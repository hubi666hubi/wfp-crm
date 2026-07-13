import React, { useState } from 'react';
import { motion } from 'motion/react'; // Preserve custom import from motion/react
import { X, Share2, Flame, Sparkles, RefreshCw, ArrowUpRight, Search, ExternalLink, Check, Copy } from 'lucide-react';
import type { FBLead } from './types';

const FacebookIcon = Share2;

interface LeadDetailsDrawerProps {
  selectedLead: FBLead;
  onClose: () => void;
  onUpdateStatus: (leadId: string, newStatus: string) => void;
  analyzingLeadSentimentId: string | null;
  onAnalyzeLeadSentimentOnTheFly: (lead: FBLead) => void;
  onCopyText: (text: string, label: string) => void;
  onNavigateToScraper: (url: string, name: string) => void;
  getIntentBadgeColor: (intent: string) => string;
}

export const LeadDetailsDrawer: React.FC<LeadDetailsDrawerProps> = React.memo(({
  selectedLead,
  onClose,
  onUpdateStatus,
  analyzingLeadSentimentId,
  onAnalyzeLeadSentimentOnTheFly,
  onCopyText,
  onNavigateToScraper,
  getIntentBadgeColor,
}) => {
  const [drawerOutreachTab, setDrawerOutreachTab] = useState<'messenger' | 'comment' | 'linkedin' | 'email' | 'loom'>('messenger');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyWithLocalIndicator = (text: string, fieldName: string) => {
    onCopyText(text, fieldName);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-full max-w-2xl bg-neutral-950 border-l border-neutral-800 h-full overflow-y-auto p-6 md:p-8 flex flex-col justify-between"
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-6 border-b border-neutral-800 mb-6 font-sans">
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                <FacebookIcon size={20} />
              </span>
              <div>
                <h4 className="text-base font-bold text-white leading-tight">
                  Okazja od: {selectedLead.authorName}
                </h4>
                <p className="text-[11px] text-neutral-400 mt-0.5 font-medium">
                  Grupa: {selectedLead.groupName}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <div className="space-y-6">
            
            {/* Status update box */}
            <div className="p-3.5 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center justify-between gap-4 font-sans">
              <div className="text-xs font-medium text-neutral-400">
                Zmień Status Kontaktu:
              </div>
              <select
                value={selectedLead.status}
                onChange={(e) => onUpdateStatus(selectedLead.id, e.target.value)}
                className="bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-200 outline-none focus:border-blue-500 font-semibold"
              >
                <option value="Do kontaktu">Do kontaktu</option>
                <option value="Wysłano PM / Komentarz">Wysłano PM / Komentarz</option>
                <option value="Odpowiedział">Odpowiedział</option>
                <option value="Negocjacja">Negocjacje</option>
                <option value="Zamknięty / Aktywny">Wygrane 🎉</option>
                <option value="Odrzucony">Odrzucony</option>
              </select>
            </div>

            {/* Core details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl font-sans">
                <span className="block text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-1">Poziom Intencji</span>
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border inline-block ${getIntentBadgeColor(selectedLead.intentLevel)}`}>
                  {selectedLead.intentLevel}
                </span>
              </div>
              <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl font-sans">
                <span className="block text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-1">Skala Budżetu</span>
                <span className="text-xs text-neutral-205 font-bold block truncate">
                  {selectedLead.estimatedValueHex || 'Niedookreślona'}
                </span>
              </div>
              <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl font-sans flex flex-col justify-between">
                <span className="block text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-1">Kwalifikacja Lead</span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-neutral-950 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full" 
                      style={{ width: `${selectedLead.qualificationScore || 75}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono font-semibold text-emerald-400">
                    {selectedLead.qualificationScore || 75}%
                  </span>
                </div>
              </div>
            </div>

            {/* Raw Wpis */}
            <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-2">
              <span className="text-[10px] font-mono uppercase text-neutral-500">
                Oryginalna Wzmianka z Facebooka
              </span>
              <p className="text-xs text-neutral-300 leading-relaxed font-sans italic max-h-[120px] overflow-y-auto">
                "{selectedLead.postText}"
              </p>
            </div>

            {/* Pain Point */}
            <div className="p-4 bg-blue-955/25 border border-blue-900/30 rounded-xl space-y-1">
              <span className="text-[10px] font-mono uppercase text-blue-400 flex items-center gap-1">
                <Flame size={12} className="text-blue-500 animate-pulse" /> Zdefiniowany Problem (Pain Point)
              </span>
              <p className="text-xs text-neutral-200 font-semibold leading-relaxed">
                {selectedLead.painSummary}
              </p>
            </div>

            {/* Sentiment Analysis details */}
            <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl space-y-3 font-sans">
              <span className="text-[10px] font-mono uppercase text-neutral-405 flex items-center gap-1">
                🧠 Analiza psychologiczna & wydźwięku AI
              </span>
              
              {selectedLead.sentimentLabel ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-neutral-955 p-2.5 rounded-lg border border-neutral-800">
                    <div>
                      <span className="text-[9px] font-mono text-neutral-500 uppercase block">Stan emocjonalny</span>
                      <span className={`text-xs font-bold ${selectedLead.sentimentScore && selectedLead.sentimentScore < -20 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {selectedLead.sentimentLabel} ({selectedLead.sentimentScore && selectedLead.sentimentScore >= 0 ? '+' : ''}{selectedLead.sentimentScore}%)
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-mono text-neutral-500 uppercase block">Priorytet sprzedażowy</span>
                      <span className="text-xs font-black text-blue-400 font-mono">
                        {selectedLead.priorityLabel || 'Brak'} ({selectedLead.priorityScore || 0}%)
                      </span>
                    </div>
                  </div>

                  {selectedLead.emotionalTriggers && selectedLead.emotionalTriggers.length > 0 && (
                    <div>
                      <span className="text-[9px] font-mono text-neutral-500 uppercase block mb-1">Główne zapalniki (Triggers)</span>
                      <div className="flex flex-wrap gap-1">
                        {selectedLead.emotionalTriggers.map((trig, index) => (
                          <span key={index} className="text-[9px] bg-red-955/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded">
                            🎯 {trig}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedLead.sentimentExplanation && (
                    <div>
                      <span className="text-[9px] font-mono text-neutral-500 uppercase block mb-0.5">Uzasadnienie psychologii</span>
                      <p className="text-[11px] text-neutral-300 leading-relaxed font-sans italic">
                        "{selectedLead.sentimentExplanation}"
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-4 text-center space-y-3 bg-neutral-950 rounded-lg border border-neutral-800">
                  <p className="text-[11px] text-neutral-550 max-w-xs leading-normal">
                    Ten lead nie posiada jeszcze zapisanego profilu emocjonalnego. Przeanalizuj go w czasie rzeczywistym, aby ułatwić domykanie sprzedaży!
                  </p>
                  <button
                    type="button"
                    disabled={analyzingLeadSentimentId === selectedLead.id}
                    onClick={() => onAnalyzeLeadSentimentOnTheFly(selectedLead)}
                    className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-semibold text-[10px] px-3.5 py-1.5 rounded transition uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                  >
                    {analyzingLeadSentimentId === selectedLead.id ? (
                      <>
                        <RefreshCw size={10} className="animate-spin" /> Przetwarzanie...
                      </>
                    ) : (
                      <>
                        <Sparkles size={10} /> Generuj Analizę Wydźwięku AI
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* URL Redirection */}
            {selectedLead.detectedCompanyUrl ? (
              <div className="p-4 bg-rose-955/15 border border-rose-900/30 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <span className="p-1 px-1.5 rounded bg-rose-500/10 text-rose-400 text-[9px] font-mono font-semibold border border-rose-500/20 uppercase tracking-widest mb-1 inline-block">
                    Wykryto Witrynę Biznesową
                  </span>
                  <p className="text-xs font-semibold text-white truncate max-w-sm">
                    {selectedLead.detectedCompanyUrl}
                  </p>
                </div>
                <button
                  onClick={() => onNavigateToScraper(selectedLead.detectedCompanyUrl || '', selectedLead.authorName)}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs px-3 py-2 rounded-lg transition flex items-center gap-1 shadow-md whitespace-nowrap cursor-pointer"
                >
                  Prześlij do Skanera URL <ArrowUpRight size={14} />
                </button>
              </div>
            ) : (
              <div className="p-3 bg-neutral-900/40 border border-neutral-800 rounded-xl text-center flex items-center justify-between gap-2 font-sans">
                <span className="text-[11px] text-neutral-500 italic font-mono leading-tight">
                  Wykryj stronę www tego użytkownika
                </span>
                <button
                  onClick={() => {
                    const query = `https://www.google.com/search?q=${encodeURIComponent(selectedLead.authorName + ' firma linkedin')}`;
                    window.open(query, '_blank');
                  }}
                  className="text-[10px] text-neutral-400 hover:text-white border border-neutral-800 bg-neutral-950 px-2.5 py-1.5 rounded transition flex items-center gap-1 cursor-pointer"
                >
                  Szukaj w Google <Search size={10} />
                </button>
              </div>
            )}

            {/* Multi-Channel Outreach Switcher */}
            <div className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-900/30 font-sans">
              <div className="p-1.5 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between gap-1.5 overflow-x-auto min-h-[46px] no-scrollbar">
                <div className="flex bg-neutral-950 p-1 rounded-lg gap-1">
                  {[
                    { id: 'messenger', label: '💬 Messenger' },
                    { id: 'comment', label: '📣 Komentarz' },
                    { id: 'linkedin', label: '💼 LinkedIn' },
                    { id: 'email', label: '✉️ Email' },
                    { id: 'loom', label: '📽️ Loom' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setDrawerOutreachTab(tab.id as any)}
                      className={`px-3 py-1 text-[10px] font-mono uppercase font-black rounded-md transition ${
                        drawerOutreachTab === tab.id 
                          ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20' 
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-neutral-950/80 min-h-[190px]">
                {drawerOutreachTab === 'messenger' && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-[10px] text-neutral-400">
                      <span className="font-mono text-blue-400 uppercase font-black">Wiadomość Value-First Direct PM</span>
                      <button
                        type="button"
                        onClick={() => copyWithLocalIndicator(selectedLead.valueFirstMessengerPitch, 'messenger')}
                        className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1 border border-neutral-800 bg-neutral-900 px-2 py-1 rounded transition cursor-pointer"
                      >
                        {copiedField === 'messenger' ? <Check size={10} /> : <Copy size={10} />} Skopiuj
                      </button>
                    </div>
                    <div className="text-xs text-neutral-300 leading-relaxed font-sans max-h-[140px] overflow-y-auto pr-1">
                      <div dangerouslySetInnerHTML={{ __html: selectedLead.valueFirstMessengerPitch }} className="prose prose-sm prose-invert" />
                    </div>
                  </div>
                )}

                {drawerOutreachTab === 'comment' && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-[10px] text-neutral-400">
                      <span className="font-mono text-emerald-400 uppercase font-black">FB Kandydujący Komentarz</span>
                      <button
                        type="button"
                        onClick={() => copyWithLocalIndicator(selectedLead.publicCommentStrategy || 'Komentarz', 'comment')}
                        className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1 border border-neutral-800 bg-neutral-900 px-2 py-1 rounded transition cursor-pointer"
                      >
                        {copiedField === 'comment' ? <Check size={10} /> : <Copy size={10} />} Skopiuj
                      </button>
                    </div>
                    <p className="text-xs text-neutral-350 italic leading-relaxed bg-neutral-900/40 p-4 rounded-lg border border-neutral-800">
                      "{selectedLead.publicCommentStrategy || 'Hej, wysłałem wiadomość prywatną z konkretnymi poradami strategicznymi. Zerknij do skrzynki!'}"
                    </p>
                    <p className="text-[10px] text-neutral-500 leading-normal">
                      💡 Powiadomienie publiczne kieruje ruch do folderu „Message Requests” i zwielokrotnia szansę na darmowy odzew o 300%.
                    </p>
                  </div>
                )}

                {drawerOutreachTab === 'linkedin' && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-[10px] text-neutral-400">
                      <span className="font-mono text-indigo-400 uppercase font-black">Zaproszenie LinkedIn (Opty)</span>
                      <button
                        type="button"
                        onClick={() => copyWithLocalIndicator(selectedLead.linkedinConnectPitch || 'Cześć! Zauważyłem Twój wpis o automatyzacji. Chętnie dodam Cię do kontaktów.', 'linkedin')}
                        className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1 border border-neutral-800 bg-neutral-900 px-2 py-1 rounded transition cursor-pointer"
                      >
                        {copiedField === 'linkedin' ? <Check size={10} /> : <Copy size={10} />} Skopiuj
                      </button>
                    </div>
                    <p className="text-xs text-neutral-350 leading-relaxed bg-neutral-900/40 p-3.5 rounded-lg border border-neutral-800 whitespace-pre-wrap">
                      {selectedLead.linkedinConnectPitch || `Cześć! Zauważyłem Twój wpis o automatyzacji procesów. Chętnie dodam Cię do sieci kontaktów branżowych.`}
                    </p>
                    <p className="text-[10px] text-neutral-500 leading-normal">
                      💼 Pozwala wejść tylnymi drzwiami bez rzucania się w oczy handlowca na FB.
                    </p>
                  </div>
                )}

                {drawerOutreachTab === 'email' && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-[10px] text-neutral-400">
                      <span className="font-mono text-amber-500 uppercase font-black">Zimny List Email (Value outreach)</span>
                      <button
                        type="button"
                        onClick={() => copyWithLocalIndicator(`Temat: ${selectedLead.coldEmailSubject || ''}\n\n${(selectedLead.coldEmailBody || '').replace(/<[^>]*>/g, '')}`, 'email')}
                        className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1 border border-neutral-800 bg-neutral-900 px-2 py-1 rounded transition cursor-pointer"
                      >
                        {copiedField === 'email' ? <Check size={10} /> : <Copy size={10} />} Skopiuj
                      </button>
                    </div>
                    <div className="bg-neutral-900/40 p-3 rounded-lg border border-neutral-800 space-y-1.5 text-left">
                      <p className="text-[10px] text-neutral-400 font-mono">
                        Temat: <strong className="text-neutral-200">{selectedLead.coldEmailSubject || 'Szybkie pytanie nt. procesów'}</strong>
                      </p>
                      <div className="border-t border-neutral-800/60 pt-1.5 text-xs text-neutral-300 leading-relaxed max-h-[90px] overflow-y-auto font-sans">
                        <div dangerouslySetInnerHTML={{ __html: selectedLead.coldEmailBody || '<p>Dzień dobry...</p>' }} className="prose prose-sm prose-invert" />
                      </div>
                    </div>
                  </div>
                )}

                {drawerOutreachTab === 'loom' && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-[10px] text-neutral-400">
                      <span className="font-mono text-rose-400 uppercase font-black">2-Minutowy Scenariusz Loom Pitch</span>
                      <button
                        type="button"
                        onClick={() => copyWithLocalIndicator(selectedLead.videoPitchScript || '', 'loom')}
                        className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1 border border-neutral-800 bg-neutral-900 px-2 py-1 rounded transition cursor-pointer"
                      >
                        {copiedField === 'loom' ? <Check size={10} /> : <Copy size={10} />} Skopiuj
                      </button>
                    </div>
                    <div className="p-3 bg-neutral-900/40 rounded-lg border border-neutral-800 text-xs text-neutral-300 leading-relaxed max-h-[110px] overflow-y-auto whitespace-pre-wrap font-sans">
                      {selectedLead.videoPitchScript || "Brak scenariusza."}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Shortcuts */}
            <div className="grid grid-cols-2 gap-3 pt-2 font-sans">
              <button
                type="button"
                onClick={() => {
                  const directUrl = `https://www.facebook.com/search/posts/?q=${encodeURIComponent(selectedLead.authorName)}`;
                  window.open(directUrl, '_blank');
                }}
                className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 font-semibold py-2 px-3 rounded-lg text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Znajdź post na FB <ExternalLink size={12} />
              </button>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText((selectedLead.valueFirstMessengerPitch || '').replace(/<[^>]*>/g, ''));
                  window.open(`https://www.facebook.com/messages/t/`, '_blank');
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-3 rounded-lg text-xs transition flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(24,119,242,0.15)] cursor-pointer"
              >
                Otwórz Messenger <FacebookIcon size={12} />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-neutral-800 pt-4 flex items-center justify-end font-sans">
          <button
            onClick={onClose}
            className="bg-neutral-900 text-neutral-300 hover:text-white px-5 py-2.5 rounded-lg border border-neutral-800 text-xs font-semibold transition uppercase cursor-pointer"
          >
            Zamknij Detektor
          </button>
        </div>
      </motion.div>
    </div>
  );
});

LeadDetailsDrawer.displayName = 'LeadDetailsDrawer';
