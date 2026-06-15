import { useState, useEffect } from 'react';
import { Bot, Crosshair, TrendingUp, AlertTriangle, RefreshCcw, Zap, Download, Copy, Check, ExternalLink, HelpCircle, Puzzle } from 'lucide-react';
import { toast } from 'sonner';

interface InboundLead {
  id: string;
  name: string;
  bio: string;
  source: string;
  timestamp: string;
  isHighTicket: boolean;
  score: number;
  draftMessage: string;
  status: string;
}

interface CloserCandidate {
  id: string;
  name: string;
  email: string;
  paymentLink: string;
  status: string;
}

export function Closer() {
  const [leads, setLeads] = useState<InboundLead[]>([]);
  const [candidates, setCandidates] = useState<CloserCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [showExtensionInfo, setShowExtensionInfo] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [leadsRes, candRes] = await Promise.all([
        fetch('/api/inbound-leads'),
        fetch('/api/closer-candidates')
      ]);
      const lData = await leadsRes.json();
      const cData = await candRes.json();
      
      setLeads(Array.isArray(lData) ? lData : []);
      setCandidates(Array.isArray(cData) ? cData : []);

      if (!candRes.ok) {
        toast.error('Błąd: ' + (cData.error || 'Nie można pobrać porzuconych koszyków.'));
      }
    } catch (e) {
      console.error(e);
      toast.error('Błąd zarządzania danymi z serwera');
    }
    setLoading(false);
  };

  const handleManualInboundTest = async () => {
    const toastId = toast.loading("Oczekuję na Webhook...");
    try {
      const res = await fetch('/api/inbound-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: "Anna Nowak",
          bio: "Founder | Pomagam w optymalizacji procesów HR | Ekspert skalowania biznesu.",
          source: "LinkedIn"
        })
      });
      if (res.ok) {
        toast.success("Nowy Lead z webhooka!", { id: toastId });
        fetchData();
      }
    } catch {
      toast.error("Błąd webhooka", { id: toastId });
    }
  };

  const generateRescueEmail = async (candidate: CloserCandidate) => {
    setGeneratingFor(candidate.id);
    const toastId = toast.loading(`Wysyłanie maila ratunkowego dla ${candidate.name}...`);
    try {
      const dbStr = localStorage.getItem('settings-storage');
      let webhookUrl = "";
      if (dbStr) {
         try { webhookUrl = JSON.parse(dbStr).state.makeWebhook; } catch { /* ignore */ }
      }
      
      const res = await fetch('/api/closer-send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
           id: candidate.id,
           name: candidate.name, 
           email: candidate.email, 
           paymentLink: candidate.paymentLink,
           webhookUrl
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Wysłano e-mail do: ${candidate.name} via Webhook`, { id: toastId });
        fetchData();
      } else {
        toast.error("Błąd wysyłania maila: " + data.error, { id: toastId });
      }
    } catch {
      toast.error("Błąd sieci.", { id: toastId });
    }
    setGeneratingFor(null);
  };

  const sendDMToLead = async (leadId: string, leadName: string) => {
     const toastId = toast.loading(`Wysyłanie DM do ${leadName}...`);
     try {
      const dbStr = localStorage.getItem('settings-storage');
      let webhookUrl = "";
      if (dbStr) {
         try { webhookUrl = JSON.parse(dbStr).state.makeWebhook; } catch { /* ignore */ }
      }

      const res = await fetch('/api/inbound-send-dm', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ leadId, webhookUrl })
      });
      if (res.ok) {
         toast.success("Wysłano DM!", { id: toastId });
         fetchData();
      } else {
         toast.error("Błąd wysyłania DM", { id: toastId });
      }
     } catch {
         toast.error("Błąd sieci.", { id: toastId });
     }
  };

  return (
    <div className="p-8 pb-32">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-sans tracking-tight text-white flex items-center gap-3">
            <Crosshair className="text-rose-500" size={32} />
            AI Inbound Setter & Closer
          </h1>
          <p className="text-neutral-400 mt-2 font-mono text-sm">
             Wyłapuj High-Ticket leady i zamykaj porzucone koszyki za pomocą DR Marketingu. Webhook: <span className="text-neutral-300">/api/inbound-lead</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
           <button onClick={fetchData} className="p-2 bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors">
              <RefreshCcw size={18} />
           </button>
           <button onClick={handleManualInboundTest} className="px-4 py-2 bg-rose-600/20 text-rose-500 border border-rose-600/30 rounded-lg hover:bg-rose-600/30 font-medium text-sm flex items-center gap-2 transition-all">
              <Zap size={16} /> Symuluj lead na Webhooku
           </button>
        </div>
      </header>

      {/* Sekcja wtyczki do przeglądarki Chrome */}
      <div className="bg-neutral-950/80 border border-neutral-800 rounded-2xl p-6 mb-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl">
              <Puzzle size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Zapalnik Lead Clipper™ PRO <span className="text-[10px] bg-purple-500/20 text-purple-300 font-semibold px-2 py-0.5 rounded border border-purple-500/30">WTYCZKA CHROME</span>
                </h2>
              </div>
              <p className="text-sm text-neutral-400 mt-1 max-w-2xl font-sans">
                Przeglądasz profile na LinkedIn lub blogi branżowe? Wyciągaj dane jednym kliknięciem bezpośrednio do modułu Zapalnik CRM, gdzie sztuczna inteligencja Gemini wyceni leada i ułoży plan kontaktu.
              </p>
            </div>
          </div>
          <div>
            <button
              type="button"
              onClick={() => setShowExtensionInfo(!showExtensionInfo)}
              className="w-full md:w-auto px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold text-neutral-300 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              {showExtensionInfo ? "Zwiń instrukcję instalacji ▴" : "Instrukcja i Pobieranie plików ▾"}
            </button>
          </div>
        </div>

        {showExtensionInfo && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 pt-6 border-t border-neutral-950">
            
            {/* Kolumna 1: Funkcje */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle size={14} className="text-purple-400" />
                Jak to działa i co oferuje?
              </h3>
              <div className="space-y-3">
                <div className="bg-neutral-900/60 p-3 rounded-xl border border-neutral-800/40">
                  <div className="font-semibold text-xs text-white">Skanowanie profili LinkedIn</div>
                  <p className="text-xs text-neutral-500 mt-1">Po wejściu na dowolny profil wtyczka sama wyciągnie imię, nazwisko oraz nagłówek (Bio).</p>
                </div>
                <div className="bg-neutral-900/60 p-3 rounded-xl border border-neutral-800/40">
                  <div className="font-semibold text-xs text-white">Przechwytywanie zaznaczeń</div>
                  <p className="text-xs text-neutral-500 mt-1">Zaznacz interesujący tekst na dowolnej stronie WWW (np. cennik, informacja o firmie) – wtyczka automatycznie wstawi go jako BIO!</p>
                </div>
                <div className="bg-neutral-900/60 p-3 rounded-xl border border-neutral-800/40">
                  <div className="font-semibold text-xs text-white">Błyskawiczna kwalifikacja AI</div>
                  <p className="text-xs text-neutral-500 mt-1">Lead trafia natychmiast na poniższą listę, na której system w tle wyliczy jego wartość oraz wygeneruje precyzyjny szablon wiadomości DM.</p>
                </div>
              </div>
            </div>

            {/* Kolumna 2: Pobieranie plików */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                <Download size={14} className="text-emerald-400" />
                Pliki wtyczki do pobrania
              </h3>
              <p className="text-xs text-neutral-500">Pobierz kolejno poniższe 5 plików i zapisz je w jednym wspólnym folderze:</p>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { file: "manifest.json", desc: "Plik konfiguracyjny manifestu wtyczki (v3)." },
                  { file: "popup.html", desc: "Warstwa wizualna popupu (czarna tablica)." },
                  { file: "popup.js", desc: "Skrypt popupu, łączący się z Twoim API." },
                  { file: "content.js", desc: "Skraper parsujący kod witryny LinkedIn." },
                  { file: "icon-128.png", desc: "Ikona launchera wtyczki w formacie PNG." }
                ].map((item) => (
                  <div key={item.file} className="flex items-center justify-between bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-850 p-2.5 rounded-lg transition-colors">
                    <div className="min-w-0 pr-2">
                      <div className="font-mono text-xs font-bold text-white truncate">{item.file}</div>
                      <div className="text-[10px] text-neutral-500 truncate">{item.desc}</div>
                    </div>
                    <a
                      href={`/chrome-extension/${item.file}`}
                      download={item.file}
                      className="px-2.5 py-1.5 bg-neutral-950 hover:bg-black text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 border border-neutral-800 rounded transition-all flex items-center gap-1 shrink-0"
                    >
                      <Download size={11} /> Pobierz
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Kolumna 3: Instalacja */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                <ExternalLink size={14} className="text-amber-400" />
                Instalacja w Chrome w 30sek
              </h3>
              <ol className="space-y-3 text-xs text-neutral-400 list-decimal pl-4">
                <li>
                  Stwórz nowy folder na swoim komputerze, np. <strong className="text-neutral-200">ZapalnikClipper</strong> i przenieś do niego pobrane wyżej pliki.
                </li>
                <li>
                  Wpisz w pasku adresu przeglądarki Chrome <strong className="text-neutral-200">chrome://extensions/</strong> i zatwierdź.
                </li>
                <li>
                  Włącz <strong className="text-amber-400">Tryb dewelopera</strong> w prawym górnym rogu, po czym kliknij przycisk <strong className="text-emerald-400">Załaduj rozpakowane</strong> po lewej stronie i wybierz stworzony folder.
                </li>
              </ol>

              <div className="mt-4 bg-neutral-900 p-3 rounded-xl border border-neutral-805">
                <div className="text-[11px] font-semibold text-neutral-400 mb-1.5">TWÓJ ADRES API DO KONFIGURACJI:</div>
                <div className="flex items-center justify-between bg-neutral-950 px-2.5 py-1.5 rounded border border-neutral-850">
                  <code className="text-[11.5px] text-purple-300 select-all font-mono truncate mr-2" id="api-origin-code">
                    {window.location.origin}
                  </code>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.origin);
                      setCopiedLink(true);
                      toast.success("Skopiowano adres API wtyczki do schowka!");
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-900 rounded transition-all cursor-pointer shrink-0"
                    title="Skopiuj adres URL programu do wklejenia w konfigurację wtyczki"
                  >
                    {copiedLink ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>
                <div className="text-[10px] text-neutral-500 mt-1">Aplikacja wgra ten adres automatycznie przy pierwszym otruciu wtyczki na tej karcie!</div>
              </div>
            </div>

          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center text-neutral-500 py-12 font-mono">Trwa inicjalizacja modułu Closera...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Kolumna 1: Inbound Leads */}
          <div className="space-y-6">
            <h2 className="text-xl font-medium text-white flex items-center gap-2">
              <Bot className="text-emerald-500" /> Inbound Setter (DM Qualify)
            </h2>
            
            {leads.length === 0 ? (
               <div className="bg-black/50 border border-neutral-800 rounded-xl p-8 text-center text-neutral-500 text-sm">
                  Cisza na łączach. Brak nowych leadów.
               </div>
            ) : (
              <div className="space-y-4">
                {leads.map(lead => (
                  <div key={lead.id} className="bg-black border border-neutral-800 rounded-xl p-5 hover:border-neutral-700 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                         <div className="flex items-center gap-2">
                            <span className="font-medium text-white">{lead.name}</span>
                            <span className="text-xs bg-neutral-900 text-neutral-400 px-2 py-0.5 rounded border border-neutral-800">{lead.source}</span>
                            {lead.isHighTicket ? (
                               <span className="text-xs bg-emerald-900/30 text-emerald-400 border border-emerald-900/50 px-2 py-0.5 rounded font-mono">High-Ticket</span>
                            ) : (
                               <span className="text-xs bg-rose-900/30 text-rose-400 border border-rose-900/50 px-2 py-0.5 rounded font-mono">Low-Quality</span>
                            )}
                         </div>
                         <div className="text-sm text-neutral-400 mt-1">{lead.bio}</div>
                      </div>
                      <div className="flex flex-col items-end">
                         <div className="text-xl font-mono font-bold text-white">{lead.score}/100</div>
                         <div className="text-xs text-neutral-500">Score</div>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-neutral-800/50">
                       <div className="text-xs font-semibold text-neutral-500 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                         <Bot size={12} /> AI DM Draft Message
                       </div>
                       <p className="text-sm text-neutral-300 italic whitespace-pre-wrap">{lead.draftMessage}</p>
                       <div className="mt-3 flex justify-end">
                          {lead.status === 'Odpisano' ? (
                             <span className="text-xs text-neutral-500">Wysłano DM via Webhook ✓</span>
                          ) : (
                            <button onClick={() => sendDMToLead(lead.id, lead.name)} className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded hover:bg-emerald-500 transition-colors flex flex-row items-center gap-2"><Zap size={12} /> Wyślij DM (Make.com)</button>
                          )}
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Kolumna 2: The Auto-Closer */}
          <div className="space-y-6">
            <h2 className="text-xl font-medium text-white flex items-center gap-2">
              <TrendingUp className="text-rose-500" /> The Auto-Closer (Porzucone Linki)
            </h2>
            
            {candidates.length === 0 ? (
              <div className="bg-black/50 border border-neutral-800 rounded-xl p-8 text-center text-neutral-500 text-sm">
                Brak porzuconych koszyków do odzyskania.
              </div>
            ) : (
              <div className="space-y-4">
                {candidates.map(candidate => (
                  <div key={candidate.id} className="bg-black border border-rose-900/20 rounded-xl p-5 hover:border-rose-900/40 shadow-[0_0_15px_-3px_rgba(225,29,72,0.05)] transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-medium text-white flex items-center gap-2">
                          <AlertTriangle size={14} className="text-rose-500" />
                          {candidate.name}
                        </div>
                        <div className="text-sm text-neutral-400 mt-0.5">{candidate.email}</div>
                      </div>
                      <span className="text-xs bg-rose-500/10 text-rose-500 border border-rose-500/20 px-2 py-1 rounded font-mono">Nieopłacone &gt; 24h</span>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                       <div className="text-xs text-neutral-500 truncate max-w-[200px]" title={candidate.paymentLink}>
                          URL: {candidate.paymentLink}
                       </div>
                       <button
                         onClick={() => generateRescueEmail(candidate)}
                         disabled={generatingFor === candidate.id}
                         className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                       >
                         {generatingFor === candidate.id ? (
                           <RefreshCcw className="animate-spin" size={16} />
                         ) : (
                           <Zap size={16} />
                         )}
                         {generatingFor === candidate.id ? "Wysyłanie..." : "Wyślij AI Rescue Email (Make)"}
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
