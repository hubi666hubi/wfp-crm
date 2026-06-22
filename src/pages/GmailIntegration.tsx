import { useState, useEffect } from 'react';
import { Mail, Send, Activity, RefreshCw, Users, Link as LinkIcon, CheckCircle, Clock, FastForward, Play, Gauge, Sparkles } from 'lucide-react';
import { getAccessToken } from '../lib/auth';
import { toast } from 'sonner';
import { useSettingsStore } from '../store/settingsStore';
import { auth, db } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, writeBatch } from 'firebase/firestore';
import { useTachometerStore } from '../store/tachometerStore';

interface GmailMessage {
  id: string;
  snippet: string;
  subject: string;
  from: string;
  date: string;
}

interface Client {
  id: string;
  name: string;
  email: string;
  paymentLink?: string;
  status: 'Oczekujący' | 'Wysłano Link' | 'Opłacono' | 'Follow-up 1 Wysłany' | 'Follow-up 2 Wysłany';
  linkSentAt?: string;
}

export function GmailIntegration() {
  const [messages, setMessages] = useState<GmailMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [analyzingMsgId, setAnalyzingMsgId] = useState<string | null>(null);

  const [clients, setClients] = useState<Client[]>([]);
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { offers: tOffers, metrics: tMetrics } = useTachometerStore();
  const [reportRecipient, setReportRecipient] = useState(auth.currentUser?.email || '');
  const [reportSending, setReportSending] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, 'clients'),
      where('userId', '==', auth.currentUser.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedClients = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Client[];
      setClients(loadedClients);
    }, (error) => {
      console.error("Firestore error:", error);
    });
    return () => unsubscribe();
  }, []);

  const fetchEmails = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = getAccessToken();
      if (!token) throw new Error('Brak tokenu dostępu. Zaloguj się ponownie.');

      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      
      if (data.messages && data.messages.length > 0) {
        const fullMessages = await Promise.all(
          data.messages.map(async (msg: { id: string }) => {
            const msgRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const msgData = await msgRes.json();
            
            const headers = msgData.payload.headers;
            return {
              id: msgData.id,
              snippet: msgData.snippet,
              subject: headers.find((h: { name: string; value: string }) => h.name === 'Subject')?.value || 'Brak tematu',
              from: headers.find((h: { name: string; value: string }) => h.name === 'From')?.value || 'Brak nadawcy',
              date: headers.find((h: { name: string; value: string }) => h.name === 'Date')?.value || ''
            };
          })
        );
        setMessages(fullMessages);
      } else {
        setMessages([]);
      }
      
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Wystąpił błąd podczas pobierania wiadomości.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchEmails();
  }, []);

  const handleSuggestAiReply = async (msg?: GmailMessage) => {
    // Use specified message or default to the most recent one (messages[0])
    const targetMsg = msg || messages[0];
    if (!targetMsg) {
      toast.error('Brak odebranych wiadomości do analizy. Pobierz wiadomości najpierw przyciskiem odświeżania.');
      return;
    }

    const modeId = msg ? msg.id : 'last';
    setAnalyzingMsgId(modeId);
    const toastId = toast.loading('Sztuczna Inteligencja (Gemini 3.5) analizuje treść i przygotowuje szkic odpowiedzi...');

    try {
      const res = await fetch('/api/analyze-email-suggest-reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          emailFrom: targetMsg.from,
          emailSubject: targetMsg.subject,
          emailSnippet: targetMsg.snippet
        })
      });

      if (!res.ok) {
        throw new Error('Serwer zwrócił błąd podczas próby generowania odpowiedzi przez AI.');
      }

      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }

      // Populate input states with Gemini suggested response
      setTo(data.recipientEmail || targetMsg.from);
      setSubject(data.subject || `Re: ${targetMsg.subject}`);
      setBody(data.suggestedReply || '');

      toast.success('Pomyślnie wygenerowano i wstawiono szkic odpowiedzi AI!', { id: toastId });
    } catch (err: unknown) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Wystąpił błąd analizy wiadomości przez AI.', { id: toastId });
    } finally {
      setAnalyzingMsgId(null);
    }
  };

  const handleSendEmail = async (targetTo = to, targetSubject = subject, targetBody = body, showConfirm = true) => {
    if (!targetTo || !targetSubject || !targetBody) return false;
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(targetTo)) {
      toast.error('Wprowadź poprawny adres e-mail odbiorcy.');
      return false;
    }
    
    // User confirmation
    if (showConfirm) {
      const confirmed = window.confirm(`Czy na pewno chcesz wysłać tę wiadomość do ${targetTo}?`);
      if (!confirmed) return false;
    }
    
    setSending(true);
    setError('');
    
    try {
      const token = getAccessToken();
      if (!token) throw new Error('Brak tokenu dostępu z Gmail API. Upewnij się, że autoryzacja Google Workspace i GMail jest aktywna.');

      const emailLines = [
        `To: ${targetTo}`,
        'Content-type: text/html;charset=utf-8',
        'MIME-Version: 1.0',
        `Subject: ${targetSubject}`,
        '',
        targetBody.replace(/\n/g, '<br>')
      ];
      
      const email = emailLines.join('\r\n');
      const base64EncodedEmail = btoa(unescape(encodeURIComponent(email))).replace(/\+/g, '-').replace(/\//g, '_');

      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ raw: base64EncodedEmail })
      });
      
      if (!response.ok) {
        let errorMessage = `HTTP Error: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.error && errorData.error.message) {
            errorMessage = errorData.error.message;
          }
        } catch {
          // ignore json parse error
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      
      setTo('');
      setSubject('');
      setBody('');
      toast.success('Wiadomość została wysłana pomyślnie!');
      return true;
      
    } catch (err: unknown) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Wystąpił błąd podczas wysyłania wiadomości.');
      return false;
    } finally {
      setSending(false);
    }
  };

  const addClient = async () => {
    if (!newClientName || !newClientEmail || !auth.currentUser) return;
    try {
      await addDoc(collection(db, 'clients'), {
        userId: auth.currentUser.uid,
        name: newClientName,
        email: newClientEmail,
        status: 'Oczekujący',
        createdAt: new Date().toISOString()
      });
      setNewClientName('');
      setNewClientEmail('');
      toast.success('Dodano klienta do bazy CRM');
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : 'Nieznany błąd';
      toast.error('Błąd dodawania klienta: ' + errMsg);
    }
  };

  const generatePaymentLink = async (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    setActionLoading(`link-${clientId}`);
    try {
      const stripeKey = useSettingsStore.getState().stripeKey;
      if (!stripeKey) {
        toast.error("Brak klucza Stripe. Uzupełnij go w Ustawieniach.");
        setActionLoading(null);
        return;
      }

      const gmailToken = await getAccessToken();

      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          stripeKey, 
          amount: 49900, 
          productName: `Konsultacja AI & Automatyzacja - ${client.name}`,
          successUrl: window.location.href,
          cancelUrl: window.location.href,
          clientId: client.id,
          clientEmail: client.email,
          clientName: client.name,
          gmailToken: gmailToken || ""
        })
      });
      
      const data = await res.json();
      if (data.url) {
        await updateDoc(doc(db, 'clients', clientId), {
          paymentLink: data.url,
          lastGmailToken: gmailToken || ""
        });
        toast.success(`Wygenerowano link płatności dla ${client.name}`);
      } else {
        throw new Error(data.error || "Nie udało się wygenerować linku");
      }
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : "Błąd generowania linku";
      toast.error(errMsg);
    } finally {
      setActionLoading(null);
    }
  };

  const sendPaymentEmail = async (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (!client || !client.paymentLink) return;

    setActionLoading(`email-${clientId}`);
    const subjectLine = `Witaj ${client.name} - Twój unikalny link do płatności`;
    const messageBody = `
      Cześć ${client.name},

      Dziękujemy za zainteresowanie usługami. Poniżej znajduje się Twój unikalny link do bezpiecznej płatności (Stripe).

      Kliknij tutaj, aby opłacić:
      <a href="${client.paymentLink}">${client.paymentLink}</a>

      Po dokonaniu płatności natychmiast otrzymasz potwierdzenie.

      Pozdrawiam,
      Zespół AI
    `;

    const success = await handleSendEmail(client.email, subjectLine, messageBody, false);
    if (success) {
      await updateDoc(doc(db, 'clients', clientId), {
        status: 'Wysłano Link',
        linkSentAt: new Date().toISOString()
      });
    }
    setActionLoading(null);
  };

  const executeFollowUp = async (clientId: string, level: 1 | 2) => {
    const client = clients.find(c => c.id === clientId);
    if (!client || !client.paymentLink) return;

    setActionLoading(`followup-${clientId}`);
    
    const subjectLine = level === 1 
      ? `Przypomnienie: Oczekujemy na Twoją płatność - ${client.name}` 
      : `Ostatnia Szansa: Twój link wygasa wkrótce - ${client.name}`;
      
    const messageBody = `
      Cześć ${client.name},

      ${level === 1 
        ? "Przypominamy, że wciąż czekamy na realizację Twojej płatności. Czy w czymś Ci pomóc?" 
        : "Zauważyliśmy, że link do płatności za Twoją usługę wkrótce wygaśnie. Jeśli chcesz kontynuować, opłać go jak najszybciej ok?"}

      Gdybyś miał jakiekolwiek wątpliwości, daj znać!

      Twój link:
      <a href="${client.paymentLink}">${client.paymentLink}</a>

      Pozdrawiam,
      Zespół AI
    `;

    const success = await handleSendEmail(client.email, subjectLine, messageBody, false);
    if (success) {
      await updateDoc(doc(db, 'clients', clientId), {
        status: level === 1 ? 'Follow-up 1 Wysłany' : 'Follow-up 2 Wysłany',
        linkSentAt: new Date().toISOString()
      });
      toast.success(`Follow-up ${level} wysłany do ${client.name}`);
    }
    setActionLoading(null);
  };

  const simulateTimePass = async (hours: number) => {
    toast.info(`Symulacja: Przesunięto czas o ${hours} godzin dla wszystkich linków`);
    const batch = writeBatch(db);
    clients.forEach(c => {
      if (c.linkSentAt) {
        const d = new Date(c.linkSentAt);
        d.setHours(d.getHours() - hours);
        batch.update(doc(db, 'clients', c.id), { linkSentAt: d.toISOString() });
      }
    });
    try {
      await batch.commit();
    } catch (e) {
      console.error(e);
    }
  };

  const sendTachometerReport = async () => {
    if (!reportRecipient) {
      toast.error('Wprowadź poprawny email odbiorcy.');
      return;
    }

    const token = await getAccessToken();
    if (!token) {
      toast.error('Brak tokenu dostępu z Gmail API. Zaloguj się ponownie.');
      return;
    }

    const confirmed = window.confirm(`Czy na pewno chcesz wysłać tygodniowy raport wyników do ${reportRecipient}?`);
    if (!confirmed) return;

    setReportSending(true);
    const toastId = toast.loading('Generowanie i wysyłka raportu z Tachometru...');

    try {
      const bestOffer = [...tOffers].sort((a, b) => parseFloat(b.cvr) - parseFloat(a.cvr))[0];
      const subjectLine = `📊 [Raport Wyników Omega] Tygodniowe podsumowanie Tachometru A/B/C`;

      const htmlBody = `
        <div style="font-family: 'Inter', sans-serif; background-color: #0b0b0b; color: #f3f4f6; padding: 40px 20px; max-width: 600px; margin: 0 auto; border: 1px solid #222; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; width: 44px; height: 44px; background-color: #d97706; color: #ffffff; font-size: 24px; font-weight: bold; line-height: 44px; text-align: center; border-radius: 8px; margin-bottom: 12px; box-shadow: 0 4px 20px rgba(217, 119, 6, 0.4);">🎯</div>
            <h2 style="color: #ffffff; margin: 0; font-size: 22px; letter-spacing: -0.5px; font-weight: 700;">Tygodniowy Tachometr Omega</h2>
            <p style="color: #9cb3af; font-size: 13px; margin: 4px 0 0 0;">Zbiorcza kompilacja najważniejszych wyników z kokpitu operacyjnego</p>
          </div>

          <div style="background-color: #151515; border: 1px solid #222; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <h3 style="color: #d97706; font-size: 15px; margin-top: 0; margin-bottom: 15px; border-bottom: 1px solid #222; padding-bottom: 8px; text-transform: uppercase; font-size: 11px; letter-spacing: 1px;">Kluczowe Metryki Systemu</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              ${tMetrics.map(m => `
                <div style="background-color: #0d0d0d; border: 1px solid #222; padding: 12px; border-radius: 6px;">
                  <div style="font-size: 11px; color: #888; text-transform: uppercase;">${m.label}</div>
                  <div style="font-size: 20px; font-weight: bold; color: #ffffff; margin-top: 4px;">${m.val}</div>
                  <div style="font-size: 12px; color: ${m.trend.startsWith('+') ? '#10b981' : m.trend.startsWith('-') ? '#f43f5e' : '#888'}; margin-top: 2px;">Zmiana: ${m.trend}</div>
                </div>
              `).join('')}
            </div>
          </div>

          <div style="background-color: #151515; border: 1px solid #222; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <h3 style="color: #d97706; font-size: 15px; margin-top: 0; margin-bottom: 12px; border-bottom: 1px solid #222; padding-bottom: 8px; text-transform: uppercase; font-size: 11px; letter-spacing: 1px;">Skuteczność Ofert ("Irresistible Offers")</h3>
            <div style="margin-bottom: 15px;">
              <span style="font-size: 12px; color: #888;">Zwycięska oferta tygodnia:</span>
              <strong style="display: block; font-size: 14px; color: #10b981; margin-top: 2px;">${bestOffer ? `${bestOffer.offer} (${bestOffer.cvr} CVR)` : 'Brak danych'}</strong>
            </div>

            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${tOffers.map(o => `
                <div style="background-color: #0d0d0d; border: 1px solid #222; padding: 10px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 12px; color: #ccc;">${o.offer}</span>
                  <div>
                    <span style="font-size: 12px; font-weight: bold; color: #ffffff;">cvr: ${o.cvr}</span>
                    <span style="display: inline-block; font-size: 9px; padding: 2px 6px; border-radius: 4px; margin-left: 6px; font-weight: bold; background-color: ${o.win ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)'}; color: ${o.win ? '#34d399' : '#f87171'};">
                      ${o.win ? 'Zwycięzca' : 'Przegrany'}
                    </span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div style="background-color: #151515; border: 1px solid #222; border-radius: 8px; padding: 20px;">
            <h3 style="color: #d97706; font-size: 15px; margin-top: 0; margin-bottom: 12px; border-bottom: 1px solid #222; padding-bottom: 8px; text-transform: uppercase; font-size: 11px; letter-spacing: 1px;">Komentarz Agenta AI</h3>
            <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #ccc; line-height: 1.6;">
              <li style="margin-bottom: 8px;">Zweryfikuj konwersję ofert w Google Sheets. Liderem pozostaje <strong>${bestOffer?.offer || 'N/A'}</strong>.</li>
              <li>Najbliższa rekomendacja to wyłączenie ofert o współczynniku konwersji poniżej 2.5%.</li>
            </ul>
          </div>

          <div style="text-align: center; margin-top: 30px; font-size: 11px; color: #555; border-top: 1px solid #222; padding-top: 15px;">
            Podsumowanie vygenerowane we współpracy z modułem Gmail Integration systemu Omega W.F.P.
          </div>
        </div>
      `;

      const emailLines = [
        `To: ${reportRecipient}`,
        'Content-type: text/html;charset=utf-8',
        'MIME-Version: 1.0',
        `Subject: ${subjectLine}`,
        '',
        htmlBody
      ];

      const email = emailLines.join('\r\n');
      const base64EncodedEmail = btoa(unescape(encodeURIComponent(email))).replace(/\+/g, '-').replace(/\//g, '_');

      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ raw: base64EncodedEmail })
      });

      const resData = await response.json();
      if (!response.ok || resData.error) {
        throw new Error(resData.error?.message || 'Błąd API Gmail');
      }

      toast.success('Raport z Tachometru został pomyślnie nadany przez Gmail!', { id: toastId });
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : 'Błąd wysyłki raportu';
      toast.error(errMsg, { id: toastId });
    } finally {
      setReportSending(false);
    }
  };


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <Mail className="text-rose-500" size={32} />
          Terminal Komunikacyjny (Gmail)
        </h1>
        <p className="mt-1 text-sm text-neutral-400">
          Bezpośrednia integracja skrzynki pocztowej operatora.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-lg text-red-500 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Inbox */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col">
          <div className="flex justify-between items-center mb-4 border-b border-neutral-800 pb-2">
            <h3 className="text-lg font-medium text-white flex items-center gap-2">
              <Mail size={18} className="text-blue-400" />
              Ostatnie Wiadomości
            </h3>
            <button 
              onClick={fetchEmails} 
              disabled={loading}
              className="text-neutral-500 hover:text-white transition-colors"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
          
          <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="flex items-center justify-center p-8 text-neutral-500 gap-2">
                <Activity size={16} className="animate-spin" /> Ładowanie...
              </div>
            ) : messages.length > 0 ? (
              messages.map((msg, index) => (
                <div key={`${msg.id || "msg"}-${index}`} className="bg-neutral-950 border border-neutral-800 p-3 rounded-lg hover:border-neutral-700 transition-colors flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sm font-semibold text-gray-200 truncate pr-2" title={msg.from}>{msg.from}</span>
                      <span className="text-xs text-neutral-600 whitespace-nowrap">
                        {new Date(msg.date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-sm text-blue-300 truncate mb-1" title={msg.subject}>{msg.subject}</div>
                    <div className="text-xs text-neutral-500 line-clamp-2 mb-2">{msg.snippet}</div>
                  </div>
                  <div className="flex justify-end border-t border-neutral-900/50 pt-2 mt-1">
                    <button
                      type="button"
                      onClick={() => handleSuggestAiReply(msg)}
                      disabled={loading || analyzingMsgId !== null}
                      className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold font-sans flex items-center gap-1 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 px-2 py-1 rounded transition-all disabled:opacity-50 cursor-pointer"
                      title="Analizuj tę konkretną wiadomość przez AI i utwórz szkic odpowiedzi"
                    >
                      {analyzingMsgId === msg.id ? (
                        <Activity className="animate-spin text-purple-400" size={12} />
                      ) : (
                        <Sparkles size={12} />
                      )}
                      Sugeruj odpowiedź (AI)
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-neutral-600 py-8">Brak wiadomości</div>
            )}
          </div>
        </div>

        {/* Compose */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
          <h3 className="text-lg font-medium text-white mb-4 border-b border-neutral-800 pb-2 flex items-center gap-2">
            <Send size={18} className="text-emerald-400" />
            Wyślij Wiadomość (Agent Ochrony Wizualnej)
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1 uppercase tracking-wider">Odbiorca</label>
              <input 
                type="email" 
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="target@example.com"
                className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500 transition-colors"
                disabled={sending}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1 uppercase tracking-wider">Temat</label>
              <input 
                type="text" 
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Np. Ostatnie ostrzeżenie..."
                className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500 transition-colors"
                disabled={sending}
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-medium text-neutral-400 uppercase tracking-wider">Treść</label>
                {messages.length > 0 && (
                  <button
                    type="button"
                    onClick={() => handleSuggestAiReply()}
                    disabled={sending || analyzingMsgId !== null}
                    className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold font-sans flex items-center gap-1 transition-all bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 px-2 py-0.5 rounded cursor-pointer disabled:opacity-50"
                    title="Automatycznie przeanalizuje ostatnio odebraną wiadomość (najnowszą z listy) i przygotuje sugerowaną odpowiedź."
                  >
                    {analyzingMsgId === 'last' ? (
                      <Activity className="animate-spin text-purple-400" size={11} />
                    ) : (
                      <Sparkles size={11} />
                    )}
                    Autouzupełnij z ostatniego maila (AI)
                  </button>
                )}
              </div>
              <textarea 
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Wpisz treść komunikatu..."
                rows={5}
                className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500 transition-colors custom-scrollbar"
                disabled={sending}
              />
            </div>
            <button 
              onClick={handleSendEmail}
              disabled={sending || !to || !subject || !body}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2"
            >
              {sending ? <Activity className="animate-spin" size={16} /> : <Send size={16} />}
              {sending ? 'Inicjowanie transferu...' : 'Wyślij Komunikat'}
            </button>
          </div>
        </div>

        {/* Tachometer Weekly Summary Notification */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-medium text-white mb-4 border-b border-neutral-800 pb-2 flex items-center gap-2">
              <Gauge size={18} className="text-yellow-500" />
              Tygodniowy Raport Tachometru
            </h3>
            
            <p className="text-xs text-neutral-400 mb-4 font-sans leading-relaxed">
              Kompiluj i wysyłaj najważniejsze wskaźniki efektywności oraz testy "Irresistible Offers" bezpośrednio do swojej skrzynki GMail.
            </p>

            <div className="space-y-2 mb-6">
              <div className="bg-neutral-950 p-2.5 rounded border border-neutral-800 flex justify-between items-center text-xs">
                <span className="text-neutral-500">Konwersja VSL</span>
                <span className="font-bold text-white">{tMetrics.find(m => m.label.includes('Konwersji'))?.val || '0%'}</span>
              </div>
              <div className="bg-neutral-950 p-2.5 rounded border border-neutral-800 flex justify-between items-center text-xs">
                <span className="text-neutral-500">Churn Rate</span>
                <span className="font-bold text-rose-400">{tMetrics.find(m => m.label.includes('Odrzucenia'))?.val || '0%'}</span>
              </div>
              <div className="bg-neutral-950 p-2.5 rounded border border-neutral-800 flex justify-between items-center text-xs">
                <span className="text-neutral-500">Pętla Dopaminowa</span>
                <span className="font-bold text-yellow-500">{tMetrics.find(m => m.label.includes('Pojemność'))?.val || '0h'}</span>
              </div>
              <div className="bg-neutral-950 p-2.5 rounded border border-neutral-800 flex justify-between items-center text-xs">
                <span className="text-neutral-500">Najlepsza Oferta</span>
                <span className="font-bold text-emerald-400 truncate max-w-[130px]" title="Najbardziej dochodowa oferta">
                  {[...tOffers].sort((a,b) => parseFloat(b.cvr) - parseFloat(a.cvr))[0]?.offer.split(' ')[0] || 'A/B'}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3 mt-auto">
            <div>
              <label className="block text-[10px] uppercase font-mono text-neutral-400 mb-1">Wyślij raport na e-mail:</label>
              <input 
                type="email" 
                value={reportRecipient}
                onChange={(e) => setReportRecipient(e.target.value)}
                placeholder="twój-email@domena.pl"
                className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>
            
            <button 
              onClick={sendTachometerReport}
              disabled={reportSending || !reportRecipient}
              className="w-full py-2 bg-rose-600 hover:bg-rose-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
            >
              {reportSending ? <Activity className="animate-spin" size={14} /> : <Mail size={14} />}
              {reportSending ? 'Nadawanie raportu...' : 'Kompiluj i wyślij e-mail'}
            </button>
          </div>
        </div>
      </div>

      {/* Baza Klientów & Automatyzacja */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-neutral-800 pb-2">
          <h3 className="text-lg font-medium text-white flex items-center gap-2">
            <Users size={18} className="text-purple-400" />
            Baza Klientów i Automatyzacja Stripe + Gmail
          </h3>
          <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
             <button
               onClick={() => simulateTimePass(25)}
               className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs rounded transition-colors"
             >
               <FastForward size={14} />
               +25h
             </button>
             <button
               onClick={async () => {
                 const token = await getAccessToken();
                 if (!token) {
                    toast.error('Brak dostępu GMail do wysyłki');
                    return;
                 }
                 try {
                   const res = await fetch("/api/cron/followups", {
                     method: "POST",
                     headers: { "Content-Type": "application/json" },
                     body: JSON.stringify({ gmailToken: token, clients })
                   });
                   const data = await res.json();
                   if (data.success) {
                     toast.success(`Server Cron: Uruchomiono pomyślnie. Zaktualizowano ${data.processed.length} klientów.`);
                     if (data.processed.length > 0) {
                       const batch = writeBatch(db);
                       data.processed.forEach((p: { clientId: string; newStatus: 'Oczekujący' | 'Wysłano Link' | 'Opłacono' | 'Follow-up 1 Wysłany' | 'Follow-up 2 Wysłany' }) => {
                         batch.update(doc(db, 'clients', p.clientId), {
                           status: p.newStatus,
                           linkSentAt: new Date().toISOString()
                         });
                       });
                       await batch.commit();
                     }
                   } else {
                     throw new Error(data.error);
                   }
                 } catch (e: unknown) {
                   const errMsg = e instanceof Error ? e.message : 'Błąd serwera';
                   toast.error(errMsg);
                 }
               }}
               className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-500 text-xs rounded transition-colors"
             >
               <Play size={14} />
               Uruchom Trigger Follow-up
             </button>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input 
            type="text" 
            value={newClientName}
            onChange={(e) => setNewClientName(e.target.value)}
            placeholder="Imię i Nazwisko"
            className="flex-1 bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
          />
          <input 
            type="email" 
            value={newClientEmail}
            onChange={(e) => setNewClientEmail(e.target.value)}
            placeholder="Adres e-mail"
            className="flex-1 bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
          />
          <button 
            onClick={addClient}
            disabled={!newClientName || !newClientEmail}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            Dodaj Klienta
          </button>
        </div>

        <div className="space-y-3">
          {clients.map((client, index) => (
            <div key={`${client.id || "client"}-${index}`} className="bg-neutral-950 border border-neutral-800 rounded-lg p-4 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-white">{client.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    client.status === 'Oczekujący' ? 'bg-amber-500/10 text-amber-500' :
                    client.status.includes('Wysłano') ? 'bg-blue-500/10 text-blue-500' :
                    'bg-emerald-500/10 text-emerald-500'
                  }`}>
                    {client.status}
                  </span>
                </div>
                <div className="text-sm text-neutral-400">{client.email}</div>
                {client.paymentLink && (
                  <div className="mt-2 text-xs flex items-center gap-2">
                    <span className="text-neutral-400">Link:</span>
                    <a 
                      href={client.paymentLink} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline truncate max-w-[200px] md:max-w-md block"
                    >
                      {client.paymentLink}
                    </a>
                  </div>
                )}
                {client.linkSentAt && (
                   <div className="mt-1 flex items-center gap-1 text-xs text-neutral-500">
                     <Clock size={12} />
                     Wysłano: {new Date(client.linkSentAt).toLocaleString()} ({Math.floor((new Date().getTime() - new Date(client.linkSentAt).getTime()) / (1000 * 60 * 60))}h temu)
                   </div>
                )}
              </div>
              
              <div className="flex items-center gap-2 w-full md:w-auto">
                {!client.paymentLink ? (
                  <button 
                    onClick={() => generatePaymentLink(client.id)}
                    disabled={actionLoading === `link-${client.id}`}
                    className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-500 rounded text-sm transition-colors"
                  >
                    {actionLoading === `link-${client.id}` ? (
                      <Activity size={14} className="animate-spin" />
                    ) : (
                      <LinkIcon size={14} />
                    )}
                    Generuj Link (Stripe)
                  </button>
                ) : (
                  <button 
                    onClick={() => sendPaymentEmail(client.id)}
                    disabled={actionLoading === `email-${client.id}` || client.status.includes('Wysłano')}
                    className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 disabled:opacity-50 text-blue-500 rounded text-sm transition-colors"
                  >
                    {actionLoading === `email-${client.id}` ? (
                      <Activity size={14} className="animate-spin" />
                    ) : client.status.includes('Wysłano') ? (
                      <CheckCircle size={14} />
                    ) : (
                      <Send size={14} />
                    )}
                    Wyślij Link (Gmail)
                  </button>
                )}
              </div>
            </div>
          ))}
          {clients.length === 0 && (
            <div className="text-center text-neutral-500 py-8">Brak klientów w bazie.</div>
          )}
        </div>
      </div>
    </div>
  );
}
