import React from 'react';
import { motion } from 'motion/react';
import { 
  Crosshair, Clipboard, Download, X, Target, Skull, Shield, AlertTriangle 
} from 'lucide-react';
import type { InboundLead } from './types';
import { toast } from 'sonner';

export interface TacticalBriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: InboundLead;
}

export const TacticalBriefModal: React.FC<TacticalBriefModalProps> = React.memo(({
  isOpen,
  onClose,
  lead
}) => {
  if (!isOpen || !lead.tacticalBrief) return null;

  const tb = lead.tacticalBrief;

  const handleCopyScript = () => {
    const scriptText = `FAZA 1 (HAK): ${tb.opScript.phase1Hook}\n\nFAZA 2 (BÓL): ${tb.opScript.phase2Pain}\n\nFAZA 3 (DOWÓD): ${tb.opScript.phase3Proof}\n\nFAZA 4 (CTA): ${tb.opScript.phase4Cta}`;
    navigator.clipboard.writeText(scriptText);
    toast.success("Skopiowano scenariusz ataku (Op-Script) do schowka! Ruszaj do walki.");
  };

  const handleDownloadBrief = () => {
    const fileContent = `===========================================================
             B2B SDR COMMAND TACTICAL BRIEF & BATTLECARD
===========================================================
CEL OPERACYJNY: ${lead.name}
ZAKRES WPŁYWU / BIO: ${lead.bio}
ŁĄCZNOŚĆ / PLATFORMA: ${lead.source}
STOSOWANY TRYB: WOJSKOWY (TACTICAL COMBAT MODE)
INDEKS GOTOWOŚCI (CRI): ${tb.readinessRating} / 100

-----------------------------------------------------------
1. MISJA BOJOWA (STRATEGIC MISSION TARGET):
-----------------------------------------------------------
${tb.missionObjective}

-----------------------------------------------------------
2. REKONESANS SŁABYCH PUNKTÓW (VULNERABILITY ASSESSMENT):
-----------------------------------------------------------
${tb.vulnerabilityAssessment.map((vuln, i) => `${i + 1}. [SABOTAŻ] ${vuln}`).join('\n')}

-----------------------------------------------------------
3. ANALIZA MEDDPICC (OPERATIONAL QUALIFICATION):
-----------------------------------------------------------
* Metrics (Wyliczenia):   ${tb.meddpiccTable.metrics}
* Economic Buyer:         ${tb.meddpiccTable.economicBuyer}
* Decision Criteria:      ${tb.meddpiccTable.decisionCriteria}
* Decision Process:       ${tb.meddpiccTable.decisionProcess}
* Identify Pain (Ból):    ${tb.meddpiccTable.identifyPain}
* Champion (Sojusznik):   ${tb.meddpiccTable.champion}

-----------------------------------------------------------
4. SCENARIUSZ ATAKU TELEFONICZNEGO (OP-SCRIPT):
-----------------------------------------------------------
* Faza 1: Hak Taktyczny:
  -> ${tb.opScript.phase1Hook}

* Faza 2: Punkt Bólu:
  -> ${tb.opScript.phase2Pain}

* Faza 3: Dowód Dowodzenia:
  -> ${tb.opScript.phase3Proof}

* Faza 4: Bezpośredni CTA:
  -> ${tb.opScript.phase4Cta}

-----------------------------------------------------------
5. TARCZA OBRAŻEŃ (COMBAT OBJECTIONS SHIELDS):
-----------------------------------------------------------
${tb.combatObjections.map((obj, i) => `[OBIEKCJA ${i + 1}] "${obj.objection}"
  -> [TARCZA BOJOWA] "${obj.combatshield}"`).join('\n\n')}

===========================================================
GENEROWANE PRZEZ: ZAPALNIK B2B TACTICAL INTEL ENGINE v4.0
===========================================================`;

    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Tactical-Brief_${lead.name.replace(/\s+/g, '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Plik odprawy taktycznej (Tactical-Brief) pobrany pomyślnie!");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.85 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-neutral-950/90 backdrop-blur-md cursor-pointer"
      />

      {/* Premium Military Battlecard HUD Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-neutral-950 border-2 border-rose-950/60 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col relative shadow-[0_0_60px_rgba(244,63,94,0.15)] z-10 overflow-hidden font-sans"
      >
        {/* Tactical Grid Background Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(120,40,40,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(120,40,40,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

        {/* Top Header Panel (Mission Command) */}
        <div className="flex items-center justify-between px-6 py-4 bg-rose-950/10 border-b-2 border-rose-950/40 relative z-10">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.2)]">
              <Crosshair size={18} className="animate-spin text-rose-500 [animation-duration:10s]" />
            </span>
            <div>
              <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.25em] leading-none mb-1 font-mono flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
                TACTICAL BATTLE BREEF / SDR BATTLECARD
              </h3>
              <div className="text-sm font-black text-white flex items-center gap-2">
                <span className="tracking-wide">{lead.name}</span>
                <span className="text-rose-400 bg-rose-950/40 border border-rose-800/40 text-[9px] px-2 py-0.5 rounded font-bold font-mono tracking-wider">
                  STATUS: ACTIVE MISSION
                </span>
              </div>
            </div>
          </div>

          {/* Operations Commands */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleCopyScript}
              className="px-3.5 py-2 bg-rose-900/20 hover:bg-rose-900/40 text-rose-400 border border-rose-800/40 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-md font-mono"
            >
              <Clipboard size={12} />
              SKOPIUJ OP-SCRIPT
            </button>

            <button
              onClick={handleDownloadBrief}
              className="px-3.5 py-2 bg-neutral-900 border border-neutral-800 hover:bg-neutral-850 text-neutral-300 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer font-mono"
            >
              <Download size={12} />
              POBIERZ INSTRUCTIONS.TXT
            </button>

            <button
              onClick={onClose}
              className="p-2 hover:bg-rose-950/20 border border-rose-950/45 text-rose-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Main HUD Interface Panels */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative z-10">
          
          {/* Left Column: Intelligence, MEDDPICC and Vulnerability Scouting */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-black/40">
            
            {/* Mission Target Block */}
            <div className="p-4 bg-rose-950/10 border-2 border-rose-900/30 rounded-xl space-y-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 blur-2xl rounded-full" />
              <div className="flex items-center gap-2 text-rose-400 font-mono text-[10px] font-black uppercase tracking-wider">
                <Target size={14} className="text-rose-500 animate-pulse" />
                MISJA BOJOWA (STRATEGIC GOAL)
              </div>
              <p className="text-white text-xs font-bold leading-relaxed pr-8">
                {tb.missionObjective}
              </p>
            </div>

            {/* Operational Challenges (Vulnerability Scouting) */}
            <div className="space-y-2.5">
              <h4 className="text-[10px] text-neutral-500 uppercase tracking-widest font-black font-mono flex items-center gap-2">
                <AlertTriangle size={12} className="text-rose-500" />
                REKONESANS WPŁYWÓW / DIAGNOZA SŁABYCH PUNKTÓW
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {tb.vulnerabilityAssessment.map((vulnerability, i) => (
                  <div key={i} className="bg-neutral-950 border border-rose-950/50 rounded-xl p-3.5 space-y-2 relative hover:border-rose-900/60 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] bg-rose-500/10 text-rose-400 px-1.5 py-0.5 rounded font-mono font-bold">
                        SŁABY PUNKT {i + 1}
                      </span>
                      <Skull size={10} className="text-rose-500/40" />
                    </div>
                    <p className="text-neutral-300 text-[11px] leading-relaxed font-sans">{vulnerability}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* MEDDPICC Operational Qualification Grid */}
            <div className="space-y-2.5">
              <h4 className="text-[10px] text-neutral-500 uppercase tracking-widest font-black font-mono flex items-center gap-2">
                <Shield size={12} className="text-rose-400" />
                METODOLOGIA KWALIFIKACJI (MEDDPICC COMPASS)
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                
                <div className="bg-neutral-950/60 border border-neutral-900 rounded-xl p-3.5 space-y-1 hover:border-rose-950/30 transition-all">
                  <div className="text-[8px] text-rose-400 uppercase font-mono font-black">[M] METRICS</div>
                  <div className="text-xs font-bold text-white leading-snug">{tb.meddpiccTable.metrics}</div>
                </div>

                <div className="bg-neutral-950/60 border border-neutral-900 rounded-xl p-3.5 space-y-1 hover:border-rose-950/30 transition-all">
                  <div className="text-[8px] text-rose-400 uppercase font-mono font-black">[E] ECONOMIC BUYER</div>
                  <div className="text-xs font-bold text-white leading-snug">{tb.meddpiccTable.economicBuyer}</div>
                </div>

                <div className="bg-neutral-950/60 border border-neutral-900 rounded-xl p-3.5 space-y-1 hover:border-rose-950/30 transition-all">
                  <div className="text-[8px] text-rose-400 uppercase font-mono font-black">[D] DECISION CRITERIA</div>
                  <div className="text-xs font-bold text-white leading-snug">{tb.meddpiccTable.decisionCriteria}</div>
                </div>

                <div className="bg-neutral-950/60 border border-neutral-900 rounded-xl p-3.5 space-y-1 hover:border-rose-950/30 transition-all">
                  <div className="text-[8px] text-rose-400 uppercase font-mono font-black">[D] DECISION PROCESS</div>
                  <div className="text-xs font-bold text-white leading-snug">{tb.meddpiccTable.decisionProcess}</div>
                </div>

                <div className="bg-neutral-950/60 border border-neutral-900 rounded-xl p-3.5 space-y-1 hover:border-rose-950/30 transition-all">
                  <div className="text-[8px] text-rose-400 uppercase font-mono font-black">[P] IDENTIFY PAIN</div>
                  <div className="text-xs font-bold text-white leading-snug">{tb.meddpiccTable.identifyPain}</div>
                </div>

                <div className="bg-neutral-950/60 border border-neutral-900 rounded-xl p-3.5 space-y-1 hover:border-rose-950/30 transition-all">
                  <div className="text-[8px] text-rose-400 uppercase font-mono font-black">[C] CHAMPION</div>
                  <div className="text-xs font-bold text-white leading-snug">{tb.meddpiccTable.champion}</div>
                </div>

              </div>
            </div>

            {/* Combat Defenses - Objections & Counter Tactics */}
            <div className="space-y-2.5">
              <h4 className="text-[10px] text-neutral-500 uppercase tracking-widest font-black font-mono flex items-center gap-2">
                <Shield size={12} className="text-emerald-500 animate-pulse" />
                PANCERNA TARCZA ANTY-OBIEKCYJNA (COMBAT SHIELDS)
              </h4>
              <div className="space-y-3">
                {tb.combatObjections.map((objectionBlock, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-5 bg-neutral-950 border border-neutral-900 rounded-xl overflow-hidden hover:border-rose-950/30 transition-colors">
                    <div className="md:col-span-2 p-3 bg-red-950/15 border-b md:border-b-0 md:border-r border-neutral-900 flex flex-col justify-center">
                      <span className="text-[8.5px] text-red-400 uppercase font-mono font-black mb-1">STRZAŁ KLIENTA (OBJECTION):</span>
                      <p className="text-xs font-bold text-neutral-200 leading-snug">"{objectionBlock.objection}"</p>
                    </div>
                    <div className="md:col-span-3 p-3 bg-emerald-950/5 flex flex-col justify-center">
                      <span className="text-[8.5px] text-emerald-400 uppercase font-mono font-black mb-1">ODPARCIE TAKTYCZNE (COMBAT SHIELD):</span>
                      <p className="text-xs text-neutral-300 leading-relaxed font-sans">"{objectionBlock.combatshield}"</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Dynamic Op-Script and Combat Readiness Meter */}
          <div className="w-full md:w-85 border-t md:border-t-0 md:border-l-2 border-rose-950/40 bg-neutral-950 flex flex-col overflow-hidden relative">
            
            {/* Combat Readiness circular layout */}
            <div className="px-5 py-4 bg-rose-950/10 border-b border-rose-950/30 flex items-center justify-between">
              <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-widest font-mono">BATTLE READINESS INDEX</span>
              <span className="text-[10px] text-rose-400 font-black font-mono bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded">
                CRI-{tb.readinessRating}%
              </span>
            </div>

            <div className="flex-1 p-5 overflow-y-auto space-y-5 custom-scrollbar bg-black/10">
              
              {/* Visual Target Ring/Stat indicator */}
              <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-4 flex items-center gap-4 relative overflow-hidden">
                <div className="w-16 h-16 rounded-full border-4 border-neutral-900 flex items-center justify-center relative shrink-0">
                  <div className="absolute inset-0 rounded-full border-4 border-rose-500 border-t-transparent animate-spin [animation-duration:4s]" />
                  <span className="text-sm font-black text-white font-mono">{tb.readinessRating}</span>
                </div>
                <div>
                  <div className="text-[9px] text-rose-400 font-black font-mono uppercase tracking-[0.15em]">WAR PROBABILITY</div>
                  <h5 className="text-[11px] font-black text-white uppercase tracking-tight mt-0.5">Ocena potencjału domknięcia</h5>
                  <p className="text-[10px] text-neutral-500 leading-snug font-sans mt-0.5">
                    Inbound oznaczony wysokorokująco wg MEDDPICC. Prawdopodobieństwo sukcesu równe {tb.readinessRating}%.
                  </p>
                </div>
              </div>

              {/* Telemarketing Op-Script Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 border-b border-neutral-900 pb-1.5">
                  <Crosshair size={12} className="text-red-500 animate-pulse" />
                  <span className="text-[9px] text-neutral-400 font-black uppercase tracking-wider font-mono">PANCERNY OP-SCRIPT OUTREACHOWY</span>
                </div>

                {/* Op-Script Phases */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                      <span className="text-[8.5px] text-rose-400 uppercase font-mono font-black">FAZA 1: HAK PSYCHOLOGICZNY (HOOK)</span>
                    </div>
                    <p className="p-2.5 bg-neutral-950/80 border border-neutral-900 rounded-lg text-[10.5px] text-neutral-300 leading-relaxed font-sans">
                      {tb.opScript.phase1Hook}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                      <span className="text-[8.5px] text-rose-400 uppercase font-mono font-black">FAZA 2: STRZAŁ W PUNKT BÓLU (PAIN)</span>
                    </div>
                    <p className="p-2.5 bg-neutral-950/80 border border-neutral-900 rounded-lg text-[10.5px] text-neutral-300 leading-relaxed font-sans">
                      {tb.opScript.phase2Pain}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                      <span className="text-[8.5px] text-rose-400 uppercase font-mono font-black">FAZA 3: DOWÓD SKUTECZNOŚCI (PROOF)</span>
                    </div>
                    <p className="p-2.5 bg-neutral-950/80 border border-neutral-900 rounded-lg text-[10.5px] text-neutral-300 leading-relaxed font-sans">
                      {tb.opScript.phase3Proof}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                      <span className="text-[8.5px] text-rose-400 uppercase font-mono font-black">FAZA 4: WEZWANIE DO WALKI (CTA)</span>
                    </div>
                    <p className="p-2.5 bg-neutral-950/80 border border-neutral-900 rounded-lg text-[10.5px] text-neutral-300 leading-relaxed font-sans">
                      {tb.opScript.phase4Cta}
                    </p>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
});

TacticalBriefModal.displayName = 'TacticalBriefModal';
