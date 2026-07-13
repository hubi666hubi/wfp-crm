import React from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, Clipboard, Download, X, Clock, Activity, 
  RefreshCw, Coins, Briefcase, TrendingUp, AlertTriangle, Zap 
} from 'lucide-react';
import type { InboundLead } from './types';
import { toast } from 'sonner';

export interface PitchCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: InboundLead;
}

export const PitchCardModal: React.FC<PitchCardModalProps> = React.memo(({
  isOpen,
  onClose,
  lead
}) => {
  if (!isOpen || !lead.pitchCard) return null;

  const pc = lead.pitchCard;

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(pc.htmlEmailTemplate);
    toast.success("Skopiowano kod HTML do schowka! Możesz wkleić go bezpośrednio jako treść maila.");
  };

  const handleDownloadOnePager = () => {
    const fileContent = `===========================================================
             INDYWIDUALNA OFERTA WDROŻENIA AUTOMATYZACJI AI
===========================================================
KLIENT: ${pc.leadName}
FIRMA: ${pc.companyName}
DATA PRZYGOTOWANIA: ${new Date().toLocaleDateString('pl-PL')}

-----------------------------------------------------------
1. GŁÓWNE WYZWANIA BRANŻOWE KLIENTA:
-----------------------------------------------------------
${pc.industryChallenges.map((challengeItem, i) => `${i + 1}. [Wyzwanie] ${challengeItem}`).join('\n')}

-----------------------------------------------------------
2. PROPONOWANE SCHEMATY AUTOMATYZACJI:
-----------------------------------------------------------
${pc.proposedSolutions.map((solutionItem, i) => `${i + 1}. [Wdrożenie] ${solutionItem}`).join('\n')}

-----------------------------------------------------------
3. SZACOWANY ZWROT Z INWESTYCJI (ESTIMATED ROI):
-----------------------------------------------------------
* Zaoszczędzony czas pracy zespołu: ${pc.estimatedRoi.timeSavedHours}
* Procentowa redukcja kosztów:    ${pc.estimatedRoi.costReductionPct}
* Szacowany okres zwrotu:         ${pc.estimatedRoi.paybackMonths}
* Roczny ekwiwalent finansowy:    ${pc.estimatedRoi.financialGain}

-----------------------------------------------------------
4. PLAN HARMONOGRAMU WDROŻENIOWEGO:
-----------------------------------------------------------
${pc.timeline.map(timelineItem => `* ${timelineItem.milestone} (${timelineItem.duration})
  -> ${timelineItem.description}`).join('\n\n')}

-----------------------------------------------------------
GENEROWANO PRZEZ AUTOMAT CRM ZAPALNIK.PL - TWÓJ ROZRUCH B2B
===========================================================`;

    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Pitch-Card_${pc.companyName.replace(/\s+/g, '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Pomyślnie pobrano One-Pager jako plik .txt");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
      />

      {/* Premium Document Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-neutral-950 border border-neutral-800 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col relative shadow-[0_0_50px_rgba(16,185,129,0.15)] z-10 overflow-hidden"
      >
        {/* Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-black/50 border-b border-neutral-900">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Sparkles size={16} />
            </span>
            <div>
              <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest leading-none mb-1">Dedykowany B2B Pitch-Card</h3>
              <div className="text-sm font-black text-white flex items-center gap-2">
                <span>{pc.companyName}</span>
                <span className="text-neutral-400 bg-neutral-900 border border-neutral-850 text-[9px] px-2 py-0.5 rounded font-normal font-mono uppercase">
                  {pc.leadName}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyHtml}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-950/40"
            >
              <Clipboard size={12} />
              Kopiuj Mail HTML
            </button>

            <button
              onClick={handleDownloadOnePager}
              className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-850 text-neutral-300 hover:text-white border border-neutral-800 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Download size={12} />
              Pobierz One-Pager
            </button>

            <button
              onClick={onClose}
              className="p-1.5 hover:bg-neutral-900 border border-neutral-900 hover:border-neutral-800 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Modal Body Panel */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left side: Premium Document Container */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-black/20 custom-scrollbar space-y-8">
            
            {/* Premium Document Brand Header */}
            <div className="p-8 bg-neutral-950 border border-neutral-900 rounded-2xl relative overflow-hidden space-y-4">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-3xl rounded-full" />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500 font-extrabold text-sm tracking-tighter">ZAPALNIK</span>
                  <span className="text-[9px] bg-neutral-900 text-neutral-500 border border-neutral-855 px-2 py-0.5 rounded font-mono">B2B INBOUND ENGINE</span>
                </div>
                <span className="text-xs text-neutral-500 font-mono">ID: PC-{lead.id}</span>
              </div>

              <div className="space-y-1">
                <h1 className="text-xl font-black text-white tracking-tight uppercase">INDYWIDUALNY DESIGN OFERTY B2B</h1>
                <p className="text-xs text-neutral-400">
                  Strategiczne studium operacyjne systemów automatyzacji i integracji AI dla: <strong className="text-white">{pc.companyName}</strong>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-900 text-xs text-neutral-400">
                <div>
                  <div className="text-neutral-500 text-[10px] uppercase font-bold mb-0.5">Inżynier Kontaktu</div>
                  <div className="font-bold text-neutral-300">ZAPALNIK CRM Automations</div>
                </div>
                <div>
                  <div className="text-neutral-500 text-[10px] uppercase font-bold mb-0.5">Adresat Oferty</div>
                  <div className="font-bold text-emerald-400">{pc.leadName}</div>
                </div>
              </div>
            </div>

            {/* Bento Scoreboard: ROI metrics */}
            <div className="space-y-3">
              <h4 className="text-[10px] text-neutral-500 uppercase tracking-widest font-black flex items-center gap-1.5 font-mono">
                <TrendingUp size={12} className="text-emerald-400" />
                PROGNOZOWANY ZWROT Z INWESTYCJI (KPI & ROI)
              </h4>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-4 text-center space-y-1 hover:border-neutral-800 transition-colors">
                  <div className="mx-auto w-7 h-7 bg-emerald-500/10 text-emerald-400 rounded-lg flex items-center justify-center">
                    <Clock size={14} />
                  </div>
                  <div className="text-lg font-black text-white tracking-tight mt-1">{pc.estimatedRoi.timeSavedHours}</div>
                  <div className="text-[9px] text-neutral-500 uppercase font-bold">Wolny czas / mc</div>
                </div>

                <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-4 text-center space-y-1 hover:border-neutral-800 transition-colors">
                  <div className="mx-auto w-7 h-7 bg-indigo-500/10 text-indigo-400 rounded-lg flex items-center justify-center">
                    <Activity size={14} />
                  </div>
                  <div className="text-lg font-black text-white tracking-tight mt-1">{pc.estimatedRoi.costReductionPct}</div>
                  <div className="text-[9px] text-neutral-500 uppercase font-bold">Redukcja kosztów procesu</div>
                </div>

                <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-4 text-center space-y-1 hover:border-neutral-800 transition-colors">
                  <div className="mx-auto w-7 h-7 bg-amber-500/10 text-amber-400 rounded-lg flex items-center justify-center">
                    <RefreshCw size={14} />
                  </div>
                  <div className="text-lg font-black text-white tracking-tight mt-1">{pc.estimatedRoi.paybackMonths}</div>
                  <div className="text-[9px] text-neutral-500 uppercase font-bold">Okres zwrotu (Payback)</div>
                </div>

                <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-4 text-center space-y-1 hover:border-neutral-800 transition-colors">
                  <div className="mx-auto w-7 h-7 bg-teal-500/10 text-teal-400 rounded-lg flex items-center justify-center">
                    <Coins size={14} />
                  </div>
                  <div className="text-lg font-black text-emerald-400 tracking-tight mt-1">{pc.estimatedRoi.financialGain}</div>
                  <div className="text-[9px] text-neutral-500 uppercase font-bold">Ekwiwalent roczny</div>
                </div>
              </div>
            </div>

            {/* Operational Challenges vs Automated Solutions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Industry Challenges */}
              <div className="bg-neutral-950 p-5 rounded-xl border border-neutral-900 space-y-3.5">
                <h4 className="text-xs font-extrabold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-neutral-900 pb-2">
                  <AlertTriangle size={13} className="text-rose-400" />
                  Zidentyfikowane Wyzwania Operacyjne
                </h4>
                <ul className="space-y-3">
                  {pc.industryChallenges.map((challenge, index) => (
                    <li key={index} className="flex gap-2 text-xs leading-relaxed text-neutral-300">
                      <span className="text-rose-400 font-bold shrink-0 font-mono mt-0.5">{index + 1}.</span>
                      <span>{challenge}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Proposed Automations */}
              <div className="bg-neutral-950 p-5 rounded-xl border border-neutral-900 space-y-3.5">
                <h4 className="text-xs font-extrabold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-neutral-900 pb-2">
                  <Zap size={13} className="text-emerald-400" />
                  Planowana Architektura Automatyzacji
                </h4>
                <ul className="space-y-3">
                  {pc.proposedSolutions.map((solution, index) => (
                    <li key={index} className="flex gap-2 text-xs leading-relaxed text-neutral-300">
                      <span className="text-emerald-400 font-bold shrink-0 font-mono mt-0.5">{index + 1}.</span>
                      <span>{solution}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Horizontal Timeline Block */}
            <div className="space-y-3.5">
              <h4 className="text-[10px] text-neutral-500 uppercase tracking-widest font-black flex items-center gap-1.5 font-mono">
                <Briefcase size={12} className="text-indigo-400" />
                DEDYKOWANY HARMONOGRAM WDROŻENIA (PLAN ROZWOJU)
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {pc.timeline.map((item, index) => (
                  <div key={index} className="bg-neutral-950 border border-neutral-900 rounded-xl p-4 relative space-y-2 hover:border-neutral-800 transition-colors">
                    <div className="flex items-center justify-between border-b border-neutral-900 pb-1.5">
                      <span className="text-[9px] font-bold text-indigo-400 font-mono bg-indigo-505/10">{item.duration}</span>
                      <span className="text-[8px] bg-neutral-900 border border-neutral-850 text-neutral-500 px-1.5 py-0.5 rounded font-bold font-mono">
                        FAZA {index + 1}
                      </span>
                    </div>
                    <h5 className="text-xs font-black text-white mt-1 leading-snug">{item.milestone}</h5>
                    <p className="text-[10px] text-neutral-400 leading-relaxed font-sans">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right side: HTML Email template viewer with live frame rendering */}
          <div className="w-80 border-l border-neutral-900 bg-neutral-950/20 flex flex-col overflow-hidden">
            <div className="px-4 py-3 bg-neutral-950 border-b border-neutral-900 flex items-center justify-between">
              <span className="text-[9px] text-neutral-400 font-black uppercase tracking-widest">Szablon Mailingowy</span>
              <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded font-mono font-bold">
                HTML READY
              </span>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar">
              <div className="text-[11px] text-neutral-400 leading-normal space-y-2 pb-2">
                <p>Dołączony kod HTML zawiera pełen zestaw stylów inline CSS zintegrowanych bezpośrednio z elementami, co zapewnia bezproblemowe renderowanie w każdej popularnej poczcie (np. Gmail, Outlook).</p>
                <p>Możesz go użyć jako spersonalizowaną ofertę handlową o bezkompromisowej konwersji.</p>
              </div>

              <button
                onClick={handleCopyHtml}
                className="w-full py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-950/30 font-sans"
              >
                <Clipboard size={12} />
                Skopiuj Kod HTML Maila
              </button>

              <div className="border border-neutral-850 rounded-xl p-3 bg-black space-y-1.5">
                <div className="text-[9px] text-neutral-500 uppercase font-bold font-mono border-b border-neutral-900 pb-1 flex items-center justify-between">
                  <span>Podgląd mini-kodu</span>
                  <span>HTML</span>
                </div>
                <pre className="text-[9px] font-mono text-neutral-500 overflow-x-auto whitespace-pre-wrap max-h-40 custom-scrollbar select-all">
                  {pc.htmlEmailTemplate.substring(0, 400)}...
                </pre>
              </div>

              <div className="pt-2">
                <div className="bg-neutral-900 rounded-lg p-3 border border-neutral-855 text-[10px] text-neutral-400 leading-normal space-y-1">
                  <strong className="text-neutral-300">Wskazówka taktyczna:</strong>
                  <p>Skopiuj kod i wyślij go do klienta zaraz po kwalifikującą rozmowie, aby bliski "domknąć" obiekcje wyliczeniem ROI i profesjonalną strukturą harmonogramu.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
});

PitchCardModal.displayName = 'PitchCardModal';
