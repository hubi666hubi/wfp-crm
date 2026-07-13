import React from 'react';
import { ClipboardList, RefreshCw, Plus, Check } from 'lucide-react';
import { PIPELINE_COLUMNS } from './types';
import type { InboundLead } from './types';
import { LeadCard } from './LeadCard';
import { toast } from 'sonner';

export interface PipelineKanbanProps {
  leads: InboundLead[];
  selectedLeadId: string | null;
  setSelectedLeadId: (id: string | null) => void;
  migrateStatus: (leadId: string, currentStatus: string, direction: 'forward' | 'backward') => Promise<void>;
  onAddLeadClick: () => void;
}

export const PipelineKanban: React.FC<PipelineKanbanProps> = React.memo(({
  leads,
  selectedLeadId,
  setSelectedLeadId,
  migrateStatus,
  onAddLeadClick
}) => {
  const hasZrzut = leads.some(l => l.source === 'Kolejka ZRZUT');

  return (
    <div className="space-y-6">
      {/* PASEK FILTRÓW I TESTOWANIA */}
      <div className="bg-neutral-950/40 p-4 border border-neutral-900 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="p-2 bg-neutral-900 border border-neutral-800 rounded-lg text-emerald-400">
            <ClipboardList size={16} />
          </span>
          <div>
            <div className="text-xs font-bold text-white uppercase tracking-wider">Tablica Pipelines</div>
            <div className="text-[11px] text-neutral-500">Zsynchronizowana w czasie rzeczywistym z wtyczką Chrome.</div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button 
            onClick={() => {}} 
            className="p-2.5 bg-neutral-905 border border-neutral-800 rounded-lg text-emerald-400 font-bold transition-all text-xs flex items-center gap-1.5 cursor-pointer"
            title="Satelitarne Połączenie Aktywne"
            disabled
          >
            <RefreshCw size={13} className="animate-spin text-emerald-400" />
            LIVE SYNC ACTVE
          </button>
          
          <button
            onClick={onAddLeadClick}
            className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 border border-emerald-500/20 text-xs font-bold text-white rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:scale-[1.01] cursor-pointer"
          >
            <Plus size={14} /> Dodaj leada ręcznie
          </button>
        </div>
      </div>

      {/* HIGH-PRIORITY FAST-LANE ZRZUT SECTION */}
      {hasZrzut && (
        <div className="bg-gradient-to-r from-red-950/30 via-neutral-950 to-neutral-950 border border-red-500/25 p-5 rounded-2xl space-y-4 relative overflow-hidden shadow-[0_4px_25px_rgba(239,68,68,0.15)]">
          <div className="absolute top-0 right-0 w-80 h-80 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-red-500/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="bg-red-500/10 text-red-400 text-[10px] font-mono font-black px-2.5 py-0.5 rounded border border-red-500/25 uppercase tracking-wider">
                LEAD KOLEJKI ZRZUT (FAST-LANE)
              </span>
              <p className="text-xs text-neutral-400">Gorące szanse zidentyfikowane automatycznie przez radar trendów społecznościowych</p>
            </div>
            <span className="text-[10px] font-mono font-bold text-rose-400">OPERACJA ZRZUT 21:00 AKTUALNA</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {leads.filter(l => l.source === 'Kolejka ZRZUT').map((lead) => {
              return (
                <div 
                  key={lead.id}
                  onClick={() => setSelectedLeadId(lead.id)}
                  className={`bg-neutral-900/80 p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden group ${
                    lead.id === selectedLeadId ? "border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.15)]" : "border-neutral-805 hover:border-neutral-700"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] bg-red-500/10 text-red-400 font-bold px-2 py-0.5 rounded border border-red-500/20">
                      {lead.source}
                    </span>
                    <span className="text-[10px] text-neutral-500 font-mono">Dopasowanie: {lead.score}%</span>
                  </div>
                  <h4 className="text-sm font-black text-white group-hover:text-red-400 transition-colors uppercase tracking-tight">{lead.name}</h4>
                  <p className="text-xs text-neutral-305 font-sans mt-0.5 leading-relaxed">{lead.bio}</p>
                  
                  <div className="mt-3 bg-black/40 border border-neutral-850 p-2.5 rounded-lg space-y-2">
                    <span className="text-[9px] font-mono text-neutral-500 uppercase block">Pierwsza wiadomość Connect Connect Pitch:</span>
                    <p className="text-[11px] text-neutral-300 font-sans italic line-clamp-2 leading-normal">"{lead.draftMessage}"</p>
                    <div className="flex items-center gap-2 pt-1 border-t border-neutral-850/65">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(lead.draftMessage);
                          toast.success("Skopiowano Pitch pierwszej wiadomości zrzutowej!");
                        }}
                        className="bg-neutral-900 hover:bg-neutral-850 text-[10px] text-neutral-300 font-bold px-2.5 py-1 rounded border border-neutral-800 cursor-pointer flex items-center gap-1 transition-colors"
                      >
                        <Check size={10} /> Schowek
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLeadId(lead.id);
                          toast.success("Wybrano leada zrzutowego.");
                        }}
                        className="bg-red-600/15 border border-red-500/30 text-red-400 text-[10px] font-bold px-3 py-1 rounded hover:bg-red-600/25 cursor-pointer ml-auto transition-colors"
                      >
                        Otwórz Szanse
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* KANBAN GRID CHASSIS */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
        {PIPELINE_COLUMNS.map((column, colIndex) => {
          const colLeads = leads.filter(l => l.status === column.key);
          
          return (
            <div 
              key={column.key} 
              className="bg-neutral-950/70 border border-neutral-900 rounded-xl p-3 min-h-[500px] flex flex-col space-y-3 relative"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2 border-b border-neutral-900">
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    column.key.includes("Wtyczka") ? "bg-blue-400" :
                    column.key.includes("Zakwalifikowane") ? "bg-purple-400" :
                    column.key.includes("wiadomość") ? "bg-amber-400" :
                    column.key.includes("toku") ? "bg-pink-400" : "bg-emerald-400"
                  }`} />
                  <h3 className="text-xs font-bold text-neutral-300 truncate tracking-wide max-w-[130px]">{column.label}</h3>
                </div>
                <span className="text-[10px] bg-neutral-900 px-2 py-0.5 rounded text-neutral-400 font-mono font-bold">
                  {colLeads.length}
                </span>
              </div>

              {/* Column Cards Container */}
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[600px] custom-scrollbar pr-1">
                {colLeads.length === 0 ? (
                  <div className="h-28 border border-dashed border-neutral-900 rounded-xl flex flex-col items-center justify-center p-3 text-center">
                    <span className="text-[10px] text-neutral-600 uppercase font-bold tracking-wider">Pusty etap</span>
                  </div>
                ) : (
                  colLeads.map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      isSelected={lead.id === selectedLeadId}
                      onSelect={setSelectedLeadId}
                      onMigrate={migrateStatus}
                      isFirstColumn={colIndex === 0}
                      isLastColumn={colIndex === PIPELINE_COLUMNS.length - 1}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

PipelineKanban.displayName = 'PipelineKanban';
