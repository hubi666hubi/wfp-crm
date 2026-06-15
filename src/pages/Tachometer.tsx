import { BarChart3, TrendingUp, PieChart, Zap, Mail, Edit3, Check, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { GoogleSheetsIntegration } from '../components/GoogleSheetsIntegration';
import { useTachometerStore } from '../store/tachometerStore';
import { getAccessToken } from '../lib/auth';
import { toast } from 'sonner';
import { auth } from '../lib/firebase';

const ICON_MAP: Record<string, typeof TrendingUp> = {
  'Współczynnik Konwersji VSL': TrendingUp,
  'Odrzucenia Lejków (Churn)': PieChart,
  'Pojemność Pętli Dopaminowej': Zap,
  'Testy A/B Aktywne': BarChart3,
};

export function Tachometer() {
  const { offers, metrics, setOffers, updateMetric } = useTachometerStore();
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [editVal, setEditVal] = useState('');
  const [editTrend, setEditTrend] = useState('');

  const [recipientEmail, setRecipientEmail] = useState(auth.currentUser?.email || '');
  const [isSendingReport, setIsSendingReport] = useState(false);

  // Prepare data for export: header row + data rows
  const sheetsExportData = [
    ['Nazwa Oferty', 'Konwersja (CVR)', 'Zwycięzca (Tak/Nie)'],
    ...offers.map(o => [o.offer, o.cvr, o.win ? 'Tak' : 'Nie'])
  ];

  const handleImport = (data: unknown[][]) => {
    // Assuming data[0] is header, parsing from row 1
    if (data.length <= 1) return;
    const newOffers = data.slice(1).map(row => ({
      offer: String(row[0] || 'Nieznana oferta'),
      cvr: String(row[1] || '0%'),
      win: String(row[2] || '').toLowerCase() === 'tak',
    }));
    setOffers(newOffers);
    toast.success('Pomyślnie zaimportowano oferty z Google Sheets!');
  };

  const startEdit = (metric: typeof metrics[0]) => {
    setEditingLabel(metric.label);
    setEditVal(metric.val);
    setEditTrend(metric.trend);
  };

  const saveEdit = () => {
    if (editingLabel) {
      updateMetric(editingLabel, editVal, editTrend);
      setEditingLabel(null);
      toast.success('Zaktualizowano metrykę!');
    }
  };

  const handleSendWeeklyReport = async () => {
    if (!recipientEmail) {
      toast.error('Wprowadź adres e-mail odbiorcy.');
      return;
    }

    const token = await getAccessToken();
    if (!token) {
      toast.error('Brak aktywnego tokenu GMail. Przejdź do zakładki Poczta (Gmail), aby się zalogować.');
      return;
    }

    const confirmed = window.confirm(`Czy chcesz wygenerować i wysłać raport tygodniowy na adres ${recipientEmail}?`);
    if (!confirmed) return;

    setIsSendingReport(true);
    const toastId = toast.loading('Generowanie raportu podsumowującego...');

    try {
      // We will generate a beautifully styled HTML email containing all the metrics
      const subject = `📊 [Raport Omega] Tygodniowe podsumowanie z Tachometru A/B/C - ${new Date().toLocaleDateString('pl-PL')}`;
      
      const bestOffer = [...offers].sort((a,b) => parseFloat(b.cvr) - parseFloat(a.cvr))[0];

      const htmlBody = `
        <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; background-color: #000000; color: #f3f4f6; padding: 40px 20px; max-width: 600px; margin: 0 auto; border: 1px solid #262626; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; width: 44px; height: 44px; background-color: #e11d48; color: #ffffff; font-size: 24px; font-weight: bold; line-height: 44px; text-align: center; border-radius: 8px; margin-bottom: 12px; box-shadow: 0 4px 20px rgba(225, 29, 72, 0.4);">Ω</div>
            <h2 style="color: #ffffff; margin: 0; font-size: 22px; letter-spacing: -0.5px; font-weight: 700;">Raport Wyników: Tachometr A/B/C</h2>
            <p style="color: #a3a3a3; font-size: 13px; margin: 4px 0 0 0;">Automatyczne podsumowanie tygodniowe z systemów Omega</p>
          </div>

          <div style="background-color: #171717; border: 1px solid #262626; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <h3 style="color: #ffffff; font-size: 15px; margin-top: 0; margin-bottom: 15px; border-bottom: 1px solid #262626; padding-bottom: 8px; text-transform: uppercase; font-size: 11px; letter-spacing: 1px; color: #9ca3af;">Główne Wskaźniki Efektywności</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              ${metrics.map(m => `
                <div style="background-color: #0a0a0a; border: 1px solid #262626; padding: 12px; border-radius: 6px;">
                  <div style="font-size: 11px; color: #737373; text-transform: uppercase;">${m.label}</div>
                  <div style="font-size: 20px; font-weight: bold; color: #ffffff; margin-top: 4px;">${m.val}</div>
                  <div style="font-size: 11px; color: ${m.trend.startsWith('+') ? '#10b981' : m.trend.startsWith('-') ? '#f43f5e' : '#a3a3a3'}; margin-top: 2px;">Trend: ${m.trend}</div>
                </div>
              `).join('')}
            </div>
          </div>

          <div style="background-color: #171717; border: 1px solid #262626; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <h3 style="color: #ffffff; font-size: 15px; margin-top: 0; margin-bottom: 12px; border-bottom: 1px solid #262626; padding-bottom: 8px; text-transform: uppercase; font-size: 11px; letter-spacing: 1px; color: #9ca3af;">Analiza Ofert ("Irresistible Offers")</h3>
            <div style="margin-bottom: 15px;">
              <span style="font-size: 12px; color: #a3a3a3;">Lider Konwersji:</span>
              <strong style="display: block; font-size: 14px; color: #10b981; margin-top: 2px;">${bestOffer ? `${bestOffer.offer} (${bestOffer.cvr} CVR)` : 'Brak danych'}</strong>
            </div>

            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${offers.map(o => `
                <div style="background-color: #0a0a0a; border: 1px solid #262626; padding: 10px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; justify-items: space-between;">
                  <span style="font-size: 12px; color: #e5e7eb; display: inline-block; max-width: 75%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${o.offer}</span>
                  <div style="display: inline-block; text-align: right;">
                    <span style="font-size: 12px; font-weight: bold; color: #ffffff;">${o.cvr} CVR</span>
                    <span style="display: inline-block; font-size: 9px; padding: 2px 6px; border-radius: 4px; margin-left: 6px; font-weight: bold; background-color: ${o.win ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)'}; color: ${o.win ? '#34d399' : '#f87171'};">
                      ${o.win ? 'Zwycięzca' : 'Przegrany'}
                    </span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div style="background-color: #171717; border: 1px solid #262626; border-radius: 8px; padding: 20px;">
            <h3 style="color: #ffffff; font-size: 15px; margin-top: 0; margin-bottom: 12px; border-bottom: 1px solid #262626; padding-bottom: 8px; text-transform: uppercase; font-size: 11px; letter-spacing: 1px; color: #9ca3af;">Strategiczne Rekomendacje</h3>
            <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #d1d5db; line-height: 1.6;">
              <li style="margin-bottom: 8px;"><strong>Skalowanie Ofert:</strong> Rekomenduje się natychmiastowe alokowanie 70% budżetu na <strong>${bestOffer?.offer || 'najlepszą ofertę'}</strong> z uwagi na najwyższą konwersję na poziomie <strong>${bestOffer?.cvr || '0%'}</strong>.</li>
              <li style="margin-bottom: 8px;"><strong>Optymalizacja Churnu:</strong> Bieżąca stopa odrzutu lejków wynosi <strong>${metrics.find(m => m.label.includes('Churn'))?.val || '12.5%'}</strong>. Należy upewnić się, że sekwencja follow-upów w module Zapalnik jest w pełni sprawna.</li>
              <li>Sugerowany termin kolejnego audytu testów A/B/C: za 7 dni roboczych.</li>
            </ul>
          </div>

          <div style="text-align: center; margin-top: 30px; font-size: 11px; color: #525252; border-top: 1px solid #262626; padding-top: 15px;">
            Ten e-mail został wysłany automatycznie z terminala operatorskiego Omega W.F.P. przy użyciu Twojego połączonego konta GMail.
          </div>
        </div>
      `;

      const emailLines = [
        `To: ${recipientEmail}`,
        'Content-type: text/html;charset=utf-8',
        'MIME-Version: 1.0',
        `Subject: ${subject}`,
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
        throw new Error(resData.error?.message || 'Błąd wysyłki e-maila');
      }

      toast.success('Raport podsumowujący został wysłany na Twój adres e-mail!', { id: toastId });
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : 'Nieznany błąd podczas wysyłania';
      toast.error(errMsg, { id: toastId });
    } finally {
      setIsSendingReport(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Zap className="text-yellow-500" size={32} />
            Tachometr A/B/C
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            Kokpit decyzyjno-analityczny. Śledź konwersje "Pętli Dopaminowych" i ulepszaj "Irresistible Offers".
          </p>
        </div>

        {/* Weekly Report Box */}
        <div className="bg-neutral-900/50 border border-neutral-800 p-4 rounded-xl flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full md:w-auto">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[10px] uppercase font-mono text-neutral-400 mb-1">E-mail z Raportem Tygodniowym</label>
            <input 
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="operator@system.pl"
              className="bg-black border border-neutral-800 rounded px-2 py-1 text-xs text-white max-w-full focus:outline-none focus:border-rose-500 font-mono"
            />
          </div>
          <button
            onClick={handleSendWeeklyReport}
            disabled={isSendingReport}
            className="bg-rose-600 hover:bg-rose-500 text-white font-medium px-3 py-1.5 rounded text-xs flex items-center justify-center gap-1.5 self-end transition-all"
          >
            {isSendingReport ? <RefreshCw className="animate-spin" size={12} /> : <Mail size={12} />}
            Wyślij Raport
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((stat, i) => {
          const IconComponent = ICON_MAP[stat.label] || Zap;
          const isEditing = editingLabel === stat.label;

          return (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-neutral-900 border border-neutral-800 p-5 rounded-xl relative group"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-widest">{stat.label}</span>
                <IconComponent size={18} className={stat.color} />
              </div>
              
              {isEditing ? (
                <div className="space-y-2 mt-2">
                  <input 
                    type="text" 
                    value={editVal}
                    onChange={(e) => setEditVal(e.target.value)}
                    className="w-full bg-black border border-neutral-700 rounded px-2 py-1 text-sm text-white"
                  />
                  <input 
                    type="text" 
                    value={editTrend}
                    onChange={(e) => setEditTrend(e.target.value)}
                    className="w-full bg-black border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-400"
                  />
                  <button 
                    onClick={saveEdit}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-0.5 rounded text-xs flex items-center gap-1"
                  >
                    <Check size={12} /> Zapisz
                  </button>
                </div>
              ) : (
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-3xl font-bold text-white">{stat.val}</span>
                    <span className={`block text-xs font-medium mt-1 ${
                      stat.trend.startsWith('+') ? 'text-emerald-500' : stat.trend.startsWith('-') ? 'text-rose-500' : 'text-neutral-500'
                    }`}>
                      {stat.trend}
                    </span>
                  </div>
                  <button 
                    onClick={() => startEdit(stat)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded transition-all"
                  >
                    <Edit3 size={14} />
                  </button>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 flex flex-col h-full">
           <h3 className="text-lg font-medium text-white mb-4 border-b border-neutral-800 pb-2">Najlepsze "Irresistible Offers"</h3>
           <div className="space-y-4 mb-6 flex-1">
             {offers.map((o, i) => (
               <div key={i} className="flex justify-between items-center p-3 bg-neutral-950 rounded-lg border border-neutral-800">
                 <span className="text-sm text-gray-300 font-medium">{o.offer}</span>
                 <div className="flex items-center gap-3">
                   <span className="text-sm font-bold text-white">{o.cvr}</span>
                   {o.win ? (
                     <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded">Zwycięzca</span>
                   ) : (
                     <span className="text-xs bg-rose-500/20 text-rose-400 px-2 py-1 rounded">Przegrany</span>
                   )}
                 </div>
               </div>
             ))}
           </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 flex flex-col items-center justify-center text-center">
           <GoogleSheetsIntegration 
              dataToExport={sheetsExportData} 
              sheetName="Statystyki Ofert A/B" 
              onImport={handleImport} 
           />
        </div>
      </div>
    </div>
  );
}

