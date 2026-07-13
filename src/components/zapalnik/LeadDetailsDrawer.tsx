import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Flame, X, Zap, RefreshCw, FileText, Shield, Target, 
  Bot, ClipboardList, MessageSquare, Mail, Clipboard, Check, 
  Info, AlertTriangle, GraduationCap, Award, RotateCcw 
} from 'lucide-react';
import { PIPELINE_COLUMNS } from './types';
import type { InboundLead, ChatMessage } from './types';
import { toast } from 'sonner';

export interface LeadDetailsDrawerProps {
  lead: InboundLead;
  onClose: () => void;
  selectStatus: (leadId: string, status: string) => Promise<void>;
  militaryModeEnabled: boolean;
  triggerPitchCardGeneration: (leadId: string) => Promise<void>;
  isGeneratingPitchCard: boolean;
  onOpenPitchCard: () => void;
  triggerTacticalBriefGeneration: (leadId: string) => Promise<void>;
  isGeneratingTacticalBrief: boolean;
  onOpenTacticalBrief: () => void;
  drawerTab: 'profil' | 'sekwencja' | 'symulator';
  setDrawerTab: (tab: 'profil' | 'sekwencja' | 'symulator') => void;
  triggerAIEnrichment: (leadId: string) => Promise<void>;
  isEnriching: boolean;
  triggerAISequence: (leadId: string) => Promise<void>;
  isGeneratingSequence: boolean;
  localChat: ChatMessage[];
  chatMessageText: string;
  setChatMessageText: (text: string) => void;
  isSendingChat: boolean;
  sendSimulationMessage: () => Promise<void>;
  clearSimulationChat: () => Promise<void>;
}

export const LeadDetailsDrawer: React.FC<LeadDetailsDrawerProps> = React.memo(({
  lead,
  onClose,
  selectStatus,
  militaryModeEnabled,
  triggerPitchCardGeneration,
  isGeneratingPitchCard,
  onOpenPitchCard,
  triggerTacticalBriefGeneration,
  isGeneratingTacticalBrief,
  onOpenTacticalBrief,
  drawerTab,
  setDrawerTab,
  triggerAIEnrichment,
  isEnriching,
  triggerAISequence,
  isGeneratingSequence,
  localChat,
  chatMessageText,
  setChatMessageText,
  isSendingChat,
  sendSimulationMessage,
  clearSimulationChat
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Skopiowano do schowka!");
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black z-50 cursor-pointer"
      />

      {/* Cabinet Drawer panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed right-0 top-0 bottom-0 w-full sm:w-[500px] bg-neutral-950 border-l border-neutral-850 z-50 p-6 overflow-y-auto shadow-2xl flex flex-col justify-between"
      >
        <div>
          {/* Drawer Header */}
          <div className="flex items-center justify-between border-b border-neutral-900 pb-4 mb-5">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-neutral-900 border border-neutral-855 text-emerald-400 rounded-lg">
                <Flame size={18} />
              </span>
              <div>
                <h2 className="text-md font-bold text-white tracking-wide uppercase">Szczegóły Leada PRO</h2>
                <div className="text-[10px] text-neutral-500 font-mono">ID: {lead.id}</div>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-neutral-900 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Main Card info */}
          <div className="space-y-5">
            
            {/* Lead Title Block */}
            <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-850">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-[9px] bg-neutral-950 border border-neutral-850 px-2 py-0.5 rounded text-neutral-400 font-bold uppercase tracking-wide">
                    {lead.source}
                  </span>
                  <h3 className="text-md font-extrabold text-white uppercase tracking-tight mt-1">{lead.name}</h3>
                </div>
                
                <div className="text-right">
                  <div className="text-[10px] text-neutral-500">Kwalifikacja AI</div>
                  <div className={`text-xs font-bold px-2.5 py-1 rounded mt-1 inline-block ${
                    lead.isHighTicket 
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                      : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                  }`}>
                    {lead.isHighTicket ? "TAK (High-Ticket)" : "NIE (Low-Quality)"}
                  </div>
                </div>
              </div>

              <div className="mt-3 text-xs text-neutral-300 font-sans leading-relaxed bg-black/40 p-3 rounded-lg border border-neutral-950">
                <strong>Bio profilowe:</strong><br />
                <span className="block mt-1 font-mono text-[11px] text-neutral-400">{lead.bio}</span>
              </div>

              {/* Quick status selector */}
              <div className="mt-3.5 pt-3 border-t border-neutral-950 flex items-center justify-between">
                <span className="text-[10px] text-neutral-500 uppercase font-bold">Etap lejka:</span>
                <select 
                  value={lead.status}
                  onChange={(e) => {
                    const value = e.target.value;
                    selectStatus(lead.id, value);
                  }}
                  className="bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-xs text-neutral-300 focus:outline-none focus:border-emerald-500"
                >
                  {PIPELINE_COLUMNS.map(col => (
                    <option key={col.key} value={col.key}>{col.label}</option>
                  ))}
                </select>
              </div>

              {/* B2B Pitch-Card Automation Generator Zone */}
              <div className="mt-3.5 pt-3.5 border-t border-neutral-950 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest flex items-center gap-1">
                    <Zap size={10} className="text-amber-400" />
                    OFERTA HANDLOWA B2B
                  </span>
                  {lead.pitchCard ? (
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-extrabold uppercase font-mono">
                      READY (PITCH-CARD)
                    </span>
                  ) : (
                    <span className="text-[9px] bg-neutral-950 text-neutral-500 border border-neutral-850 px-2 py-0.5 rounded font-bold uppercase font-mono">
                      BRAK
                    </span>
                  )}
                </div>

                {!lead.pitchCard ? (
                  <button
                    type="button"
                    onClick={() => triggerPitchCardGeneration(lead.id)}
                    disabled={isGeneratingPitchCard}
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:via-teal-500 hover:to-indigo-500 leading-snug text-white text-xs font-black rounded-lg transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] cursor-pointer disabled:opacity-50"
                  >
                    {isGeneratingPitchCard ? (
                      <RefreshCw size={12} className="animate-spin text-emerald-100" />
                    ) : (
                      <Sparkles size={12} className="text-emerald-200" />
                    )}
                    Przygotuj Dedykowany Pitch-Card
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={onOpenPitchCard}
                      className="flex-1 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.25)] cursor-pointer"
                    >
                      <FileText size={13} />
                      Otwórz Pitch-Card
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerPitchCardGeneration(lead.id)}
                      disabled={isGeneratingPitchCard}
                      title="Przebuduj Pitch-Card z nową analizą Gemini"
                      className="px-2.5 py-2 bg-neutral-900 hover:bg-neutral-850 hover:text-white border border-neutral-800 rounded-lg text-neutral-400 flex items-center justify-center transition-all cursor-pointer"
                    >
                      {isGeneratingPitchCard ? (
                        <RefreshCw size={12} className="animate-spin" />
                      ) : (
                        <RefreshCw size={12} />
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* B2B Tactical Battle Brief Section */}
              {militaryModeEnabled && (
                <div className="mt-3.5 pt-3.5 border-t border-rose-950/40 bg-rose-950/5 p-3 rounded-xl border border-rose-950/20 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-rose-400 uppercase font-black tracking-widest flex items-center gap-1.5 font-mono">
                      <Crosshair size={11} className="text-rose-500 animate-pulse" />
                      ODPRAWA WOJSKOWA (SDR)
                    </span>
                    {lead.tacticalBrief ? (
                      <span className="text-[9px] bg-rose-500/15 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded font-extrabold uppercase font-mono">
                        BATTLE READY
                      </span>
                    ) : (
                      <span className="text-[9px] bg-neutral-950 text-neutral-600 border border-neutral-900 px-2 py-0.5 rounded font-bold uppercase font-mono">
                        BRAK
                      </span>
                    )}
                  </div>

                  {!lead.tacticalBrief ? (
                    <button
                      type="button"
                      onClick={() => triggerTacticalBriefGeneration(lead.id)}
                      disabled={isGeneratingTacticalBrief}
                      className="w-full py-2 bg-gradient-to-r from-rose-700 via-red-700 to-amber-700 hover:from-rose-600 hover:via-red-600 hover:to-amber-600 text-white text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(244,63,94,0.15)] hover:shadow-[0_0_20px_rgba(244,63,94,0.35)] cursor-pointer disabled:opacity-50"
                    >
                      {isGeneratingTacticalBrief ? (
                        <RefreshCw size={12} className="animate-spin text-rose-100" />
                      ) : (
                        <Shield size={12} className="text-rose-200" />
                      )}
                      Uzbrój Odprawę Bojową
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={onOpenTacticalBrief}
                        className="flex-1 py-1.5 bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-400 hover:to-red-400 text-black font-extrabold text-[11px] rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(239,68,68,0.25)] cursor-pointer"
                      >
                        <Target size={12} className="text-black" />
                        Otwórz Battlecard (HUD)
                      </button>
                      <button
                        type="button"
                        onClick={() => triggerTacticalBriefGeneration(lead.id)}
                        disabled={isGeneratingTacticalBrief}
                        title="Przebuduj odprawę taktyczną"
                        className="px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-850 hover:text-white border border-neutral-800 rounded-lg text-neutral-400 flex items-center justify-center transition-all cursor-pointer"
                      >
                        {isGeneratingTacticalBrief ? (
                          <RefreshCw size={12} className="animate-spin text-rose-500" />
                        ) : (
                          <RefreshCw size={12} />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* PRO Multi-tab header inside Drawer */}
            <div className="flex bg-neutral-950 border border-neutral-850 rounded-xl p-1 mb-2">
              <button
                type="button"
                onClick={() => setDrawerTab('profil')}
                className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  drawerTab === 'profil'
                    ? 'bg-neutral-900 border border-neutral-800 text-purple-400 font-extrabold shadow'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Bot size={13} className={drawerTab === 'profil' ? 'text-purple-400' : 'text-neutral-500'} /> Profil i Analiza
              </button>
              <button
                type="button"
                onClick={() => setDrawerTab('sekwencja')}
                className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  drawerTab === 'sekwencja'
                    ? 'bg-neutral-900 border border-neutral-800 text-indigo-400 font-extrabold shadow'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <ClipboardList size={13} className={drawerTab === 'sekwencja' ? 'text-indigo-400' : 'text-neutral-500'} /> Sekwencja DM
              </button>
              <button
                type="button"
                onClick={() => setDrawerTab('symulator')}
                className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  drawerTab === 'symulator'
                    ? 'bg-neutral-900 border border-neutral-800 text-emerald-400 font-extrabold shadow'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <MessageSquare size={13} className={drawerTab === 'symulator' ? 'text-emerald-400' : 'text-neutral-500'} /> Symulator AI
              </button>
            </div>

            {/* TAB 1: PROFIL I ANALIZA */}
            {drawerTab === 'profil' && (
              <motion.div
                key="tab-profil"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Automatic Draft Message Block */}
                <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-850 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5 uppercase">
                      <Mail size={13} className="text-emerald-400" />
                      AI Draft Message (Wiadomość DM)
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyText(lead.draftMessage, `draft-${lead.id}`)}
                      className="px-2 py-1 bg-neutral-950 hover:bg-black text-[10px] font-bold text-neutral-400 hover:text-white border border-neutral-800 rounded transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === `draft-${lead.id}` ? <Check size={10} className="text-emerald-400" /> : <Clipboard size={10} />}
                      Kopiuj
                    </button>
                  </div>
                  <div className="bg-black text-neutral-300 text-xs font-mono p-3.5 rounded-lg border border-neutral-950 whitespace-pre-wrap leading-relaxed select-all">
                    {lead.draftMessage}
                  </div>
                </div>

                {/* AI ENRICHMENT ZONE (GEMINI ENGINE) */}
                <div className="bg-neutral-900 border border-neutral-850 rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between border-b border-neutral-950 pb-2">
                    <div className="flex items-center gap-1.5">
                      <Bot size={15} className="text-purple-400" />
                      <span className="text-xs font-bold text-purple-300 uppercase tracking-widest">Wzbogacenie profilu AI</span>
                    </div>
                    {lead.aiEnrichment && (
                      <span className="text-[9px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/20 font-bold uppercase">
                        Aktywne
                      </span>
                    )}
                  </div>

                  {!lead.aiEnrichment ? (
                    <div className="space-y-3 py-2 text-center sm:text-left">
                      <div className="flex gap-2 items-start justify-center sm:justify-start">
                        <Info size={16} className="text-purple-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-neutral-400 leading-relaxed max-w-sm">
                          Profil nie posiada jeszcze pogłębionej analizy. Uruchom generator Gemini, aby przygotować Icebreakery, oszacować finanse oraz wyprzedzić obiekcje!
                        </p>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => triggerAIEnrichment(lead.id)}
                        disabled={isEnriching}
                        className="w-full py-2.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(109,40,217,0.35)] cursor-pointer"
                      >
                        <Sparkles size={14} className="animate-spin text-purple-200" />
                        Wzbogać profil przez AI
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Budget potential */}
                      <div className="flex items-center justify-between bg-black/40 border border-neutral-950 p-2.5 rounded-lg text-xs">
                        <span className="text-neutral-500 font-bold">Szacowany potencjał budżetowy:</span>
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          lead.aiEnrichment.budgetPotential === 'wysoki' 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : lead.aiEnrichment.budgetPotential === 'średni'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                          {lead.aiEnrichment.budgetPotential}
                        </span>
                      </div>

                      {/* Icebreakers */}
                      <div className="space-y-2">
                        <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">3 Sugerowane Icebreakery:</div>
                        <ul className="space-y-2">
                          {lead.aiEnrichment.icebreakers.map((ice, i) => (
                            <li key={i} className="bg-black/35 p-2 rounded-lg border border-neutral-950 flex items-start gap-2 text-xs text-neutral-300 font-sans">
                              <span className="text-purple-400 font-bold font-mono">#{i + 1}</span>
                              <span className="leading-relaxed">{ice}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Objections accordion style list */}
                      <div className="space-y-2 pt-2 border-t border-neutral-950">
                        <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1 text-rose-400">
                          <AlertTriangle size={11} />
                          Obiekcje i gotowe riposty:
                        </div>
                        <div className="space-y-2.5">
                          {lead.aiEnrichment.objections.map((obj, i) => (
                            <div key={i} className="bg-black/40 border border-neutral-950 rounded-lg p-3 space-y-1.5">
                              <div className="text-[11px] font-bold text-rose-300">
                                <strong>Pytanie/Obiekcja:</strong> "{obj.objection}"
                              </div>
                              <div className="text-xs text-neutral-400 pl-3 border-l-2 border-emerald-500 italic leading-relaxed">
                                <strong>Zbijanie (Riposta):</strong> "{obj.riposte}"
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Re-trigger enrichment button */}
                      <button
                        type="button"
                        onClick={() => triggerAIEnrichment(lead.id)}
                        disabled={isEnriching}
                        className="w-full mt-2 py-1.5 bg-neutral-950 hover:bg-black border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white text-[10px] font-bold rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw size={10} className={isEnriching ? "animate-spin" : ""} />
                        Zaktualizuj analizę proflową
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* TAB 2: STRATEGIC MESSAGE SEQUENCES */}
            {drawerTab === 'sekwencja' && (
              <motion.div
                key="tab-sekwencja"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {!lead.dmSequence ? (
                  <div className="bg-neutral-900 border border-neutral-850 p-6 rounded-xl text-center space-y-4">
                    <div className="mx-auto w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <ClipboardList size={22} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Strategiczny Plan Kampanii (4 Etapy)</h3>
                      <p className="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed font-sans">
                        Gemini przeanalizuje bio handlowe, platformę {lead.source} i cel nadrzędny, aby rozpisać 4 precyzyjne kroki wiadomości bezpośrednich na kalendarzu czasowym.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => triggerAISequence(lead.id)}
                      disabled={isGeneratingSequence}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg shadow-lg shadow-indigo-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isGeneratingSequence ? (
                        <RefreshCw size={13} className="animate-spin" />
                      ) : (
                        <Sparkles size={13} />
                      )}
                      Wygeneruj Sekwencję Kampanii DM
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-xs pb-1 border-b border-neutral-900">
                      <span className="text-neutral-500 font-bold uppercase tracking-wider">SDR Sequence (4 Steps)</span>
                      <span className="bg-indigo-500/10 text-indigo-400 px-2.5 py-0.5 rounded text-[10px] font-bold border border-indigo-500/20">AKTYWNA</span>
                    </div>

                    <div className="space-y-4 relative pl-3 border-l border-neutral-850 w-full mt-2">
                      {lead.dmSequence.map((step) => (
                        <div key={step.step} className="space-y-2 relative">
                          {/* Bullet indicator on timeline */}
                          <span className="absolute -left-[16.5px] top-1.5 w-2 h-2 rounded-full border border-indigo-500 bg-black" />
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="bg-indigo-950 border border-indigo-500/30 text-indigo-300 text-[9px] px-1.5 py-0.5 rounded font-extrabold font-mono">
                                {step.delay}
                              </span>
                              <span className="text-xs font-bold text-white font-sans uppercase tracking-tight">
                                {step.label}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleCopyText(step.text, `step-${step.step}-${lead.id}`)}
                              className="px-2 py-0.5 bg-neutral-900 hover:bg-neutral-850 hover:text-white border border-neutral-800 rounded text-[9px] font-bold text-neutral-400 flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              {copiedId === `step-${step.step}-${lead.id}` ? (
                                <Check size={9} className="text-emerald-400" />
                              ) : (
                                <Clipboard size={10} />
                              )}
                              Kopiuj
                            </button>
                          </div>

                          <div className="bg-black text-neutral-300 text-xs font-mono p-3 rounded-lg border border-neutral-950 whitespace-pre-wrap leading-relaxed select-all">
                            {step.text}
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => triggerAISequence(lead.id)}
                      disabled={isGeneratingSequence}
                      className="w-full mt-2 py-1.5 bg-neutral-950 hover:bg-black border border-neutral-850 hover:border-neutral-800 text-neutral-400 hover:text-white text-[10px] font-bold rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw size={10} className={isGeneratingSequence ? "animate-spin" : ""} />
                      Przebuduj sekwencję (Odśwież)
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB 3: CONVERSATION SIMULATOR & VIRTUAL TRAINER */}
            {drawerTab === 'symulator' && (
              <motion.div
                key="tab-symulator"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="bg-neutral-900/40 p-3 rounded-xl border border-neutral-850 text-xs">
                  <div className="flex gap-2 items-start text-neutral-400 leading-relaxed font-sans">
                    <GraduationCap size={16} className="text-emerald-400 shrink-0 mt-0.5 animate-bounce" />
                    <p>
                      <strong>Symulator Sandbox:</strong> Gemini symuluje odczytaną osobowość handlową leada. Po każdej wiadomości Senior Coach oceni Twoją skuteczność w skali 1-10 i da precyzyjną poradę taktyczną!
                    </p>
                  </div>
                </div>

                {/* Chat area */}
                <div className="border border-neutral-850 bg-black rounded-xl p-3 h-[280px] overflow-y-auto flex flex-col gap-3 custom-scrollbar">
                  {localChat.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-4 space-y-2">
                      <span className="p-3 bg-neutral-900 border border-neutral-850 rounded-full text-neutral-500">
                        <MessageSquare size={18} />
                      </span>
                      <div className="text-xs font-bold text-neutral-300 uppercase">Brak wiadomości</div>
                      <p className="text-[10px] text-neutral-500 max-w-[240px] leading-relaxed font-sans">
                        Wpisz u dołu wiadomość zaczepną lub propozycyjną, aby przetestować asertywność klienta {lead.name}.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {localChat.map((msg, idx) => (
                        <div key={idx} className="space-y-1.5">
                          <div className={`flex ${msg.sender === 'seller' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] text-xs px-3.5 py-2 rounded-xl text-neutral-200 leading-relaxed font-sans ${
                              msg.sender === 'seller'
                                ? 'bg-neutral-900 border border-neutral-800 rounded-tr-none'
                                : 'bg-emerald-950/20 border border-emerald-500/20 rounded-tl-none'
                            }`}>
                              <div className="text-[9px] text-neutral-500 font-bold mb-1 uppercase tracking-tight font-mono">
                                {msg.sender === 'seller' ? 'SDR (Ty)' : lead.name}
                              </div>
                              <div className="font-sans text-[11.5px] leading-relaxed break-words">{msg.text}</div>
                            </div>
                          </div>

                          {/* Trainer widget directly showing below the artificial lead answer bubble */}
                          {msg.sender === 'lead' && (msg.coachScore || msg.coachFeedback) && (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.98 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="p-3 bg-purple-950/10 border border-purple-500/15 rounded-xl ml-2 max-w-[95%] space-y-1.5"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-[10px] text-purple-300 font-extrabold uppercase tracking-wide">
                                  <GraduationCap size={13} />
                                  Metryka Trenera
                                </div>
                                <div className="flex items-center gap-1 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full text-[10px] font-bold text-purple-300">
                                  <Award size={10} />
                                  Score: {msg.coachScore || "?"}/10
                                </div>
                              </div>
                              <p className="text-[11px] text-neutral-400 pl-3 border-l-2 border-purple-500/35 italic font-sans leading-relaxed">
                                "{msg.coachFeedback || "Świetna próba! Kontynuuj drążenie problemu klienta."}"
                              </p>
                            </motion.div>
                          )}
                        </div>
                      ))}

                      {isSendingChat && (
                        <div className="flex justify-start">
                          <div className="bg-neutral-900 border border-neutral-850 text-neutral-400 text-xs px-3 py-2 rounded-xl rounded-tl-none flex items-center gap-2 animate-pulse">
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce delay-75" />
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce delay-150" />
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce delay-300" />
                            <span className="text-[10px] italic font-sans">{lead.name} analizuje...</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Chat Input row */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatMessageText}
                    onChange={(e) => setChatMessageText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        sendSimulationMessage();
                      }
                    }}
                    disabled={isSendingChat}
                    placeholder={isSendingChat ? "SDR czeka..." : "Wpisz kolejną ripostę..."}
                    className="flex-1 bg-black border border-neutral-800 focus:border-emerald-500 text-white text-xs rounded-lg px-3 py-2 focus:outline-none placeholder-neutral-600 font-sans"
                  />
                  <button
                    type="button"
                    onClick={sendSimulationMessage}
                    disabled={isSendingChat || !chatMessageText.trim()}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-900 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:text-neutral-500"
                  >
                    Wyślij
                  </button>
                  <button
                    type="button"
                    onClick={clearSimulationChat}
                    title="Wyczyść historię konwersacji"
                    className="p-2 border border-neutral-800 hover:border-neutral-700 bg-neutral-950 hover:bg-neutral-900 text-neutral-400 hover:text-white rounded-lg transition-all cursor-pointer"
                  >
                    <RotateCcw size={14} />
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Close Drawer button */}
        <div className="border-t border-neutral-900 pt-5 mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-bold text-neutral-300 rounded-lg transition-colors cursor-pointer"
          >
            Zamknij widok szczegółów
          </button>
        </div>
      </motion.div>
    </>
  );
});

LeadDetailsDrawer.displayName = 'LeadDetailsDrawer';
