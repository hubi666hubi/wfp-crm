import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, ArrowLeft, ArrowRight } from 'lucide-react';
import type { InboundLead } from './types';

export interface LeadCardProps {
  lead: InboundLead;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onMigrate: (leadId: string, currentStatus: string, direction: 'forward' | 'backward') => void;
  isFirstColumn: boolean;
  isLastColumn: boolean;
}

export const LeadCard: React.FC<LeadCardProps> = React.memo(({
  lead,
  isSelected,
  onSelect,
  onMigrate,
  isFirstColumn,
  isLastColumn
}) => {
  return (
    <motion.div
      layoutId={`lead-${lead.id}`}
      onClick={() => onSelect(lead.id)}
      className={`bg-neutral-900/60 hover:bg-neutral-900 p-3.5 rounded-xl border transition-all cursor-pointer group relative overflow-hidden ${
        isSelected 
          ? "border-emerald-500 bg-neutral-900/90 shadow-[0_0_15px_rgba(16,185,129,0.1)]" 
          : "border-neutral-805 hover:border-neutral-700"
      }`}
    >
      {/* Top Tag Indicators */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[9px] bg-neutral-950 border border-neutral-850 px-2 py-0.5 rounded text-neutral-400 font-bold uppercase tracking-wide">
          {lead.source}
        </span>
        
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
          lead.score >= 70 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
          lead.score >= 40 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
          'bg-rose-500/10 text-rose-400 border border-rose-500/20'
        }`}>
          Score: {lead.score}
        </span>
      </div>

      {/* Lead Name & Bio */}
      <div className="space-y-1">
        <h4 className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight">
          {lead.name}
        </h4>
        <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed font-sans">
          {lead.bio}
        </p>
      </div>

      {/* Quick indicators (e.g. enriched status) */}
      {lead.aiEnrichment && (
        <div className="mt-2 text-[9px] bg-purple-500/15 border border-purple-500/20 rounded px-1.5 py-0.5 text-purple-300 w-max font-bold flex items-center gap-1">
          <Sparkles size={8} className="text-purple-400 animate-spin" />
          Wzbogacony AI
        </div>
      )}

      {/* BOTTOM INTERACTIVE MIGRATION AREA */}
      <div className="flex items-center justify-between border-t border-neutral-950 mt-3 pt-2.5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onMigrate(lead.id, lead.status, 'backward');
          }}
          className="p-1 hover:bg-neutral-950 hover:text-white text-neutral-500 rounded transition-all cursor-pointer disabled:opacity-20"
          disabled={isFirstColumn}
          title="Cofnij do poprzedniego etapu"
        >
          <ArrowLeft size={11} />
        </button>
        
        <span className="text-[9px] text-neutral-600 font-bold uppercase select-none">Zarządzaj</span>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onMigrate(lead.id, lead.status, 'forward');
          }}
          className="p-1 hover:bg-neutral-950 hover:text-white text-neutral-500 rounded transition-all cursor-pointer disabled:opacity-20"
          disabled={isLastColumn}
          title="Przesuń dalej"
        >
          <ArrowRight size={11} />
        </button>
      </div>
    </motion.div>
  );
});

LeadCard.displayName = 'LeadCard';
