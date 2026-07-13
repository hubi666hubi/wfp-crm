import React from 'react';
import { Trash2, Copy, FileText, Share2 } from 'lucide-react';
import type { FBLead } from './types';

const FacebookIcon = Share2;

interface KanbanCardProps {
  lead: FBLead;
  onSelect: () => void;
  onUpdateStatus: (leadId: string, newStatus: string) => void;
  onDeleteLead: (leadId: string, e: React.MouseEvent) => void;
  colColor: string;
}

const KanbanCard: React.FC<KanbanCardProps> = React.memo(({
  lead,
  onSelect,
  onUpdateStatus,
  onDeleteLead,
  colColor,
}) => {
  return (
    <div
      onClick={onSelect}
      className={`p-3 rounded-lg border border-neutral-800 bg-neutral-900/65 cursor-pointer hover:border-neutral-700 hover:bg-neutral-900/90 transition flex flex-col gap-2 relative group overflow-hidden border-l-2 ${colColor}`}
    >
      <div>
        <div className="flex items-center justify-between mb-1">
          <h5 className="text-[11px] font-bold text-white truncate max-w-[110px]">{lead.authorName}</h5>
          <span className="text-[9px] font-mono text-emerald-400 font-bold bg-emerald-950/80 border border-emerald-900 px-1 rounded">
            {lead.qualificationScore || 75}%
          </span>
        </div>
        <p className="text-[10px] text-neutral-400 line-clamp-2 leading-relaxed">{lead.painSummary}</p>
      </div>

      <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-neutral-800/45">
        <div className="flex gap-1.5">
          <button
            disabled={lead.status === 'Do kontaktu'}
            onClick={(e) => {
              e.stopPropagation();
              const statusSeq = ['Do kontaktu', 'Wysłano PM / Komentarz', 'Odpowiedział', 'Negocjacja', 'Zamknięty / Aktywny'];
              const idx = statusSeq.indexOf(lead.status);
              if (idx > 0) onUpdateStatus(lead.id, statusSeq[idx - 1]);
            }}
            className="p-1 rounded bg-neutral-950 border border-neutral-800 disabled:opacity-30 hover:bg-neutral-800 font-mono text-[10px] text-neutral-400 font-black cursor-pointer"
          >
            ←
          </button>
          <button
            disabled={lead.status === 'Zamknięty / Aktywny'}
            onClick={(e) => {
              e.stopPropagation();
              const statusSeq = ['Do kontaktu', 'Wysłano PM / Komentarz', 'Odpowiedział', 'Negocjacja', 'Zamknięty / Aktywny'];
              const idx = statusSeq.indexOf(lead.status);
              if (idx < statusSeq.length - 1 && idx !== -1) onUpdateStatus(lead.id, statusSeq[idx + 1]);
            }}
            className="p-1 rounded bg-neutral-950 border border-neutral-800 disabled:opacity-30 hover:bg-neutral-800 font-mono text-[10px] text-neutral-400 font-black cursor-pointer"
          >
            →
          </button>
        </div>

        <button
          onClick={(e) => onDeleteLead(lead.id, e)}
          className="p-1 rounded text-neutral-600 hover:text-red-400 hover:bg-red-950/20 transition cursor-pointer"
        >
          <Trash2 size={10} />
        </button>
      </div>
    </div>
  );
});
KanbanCard.displayName = 'KanbanCard';

interface ListCardProps {
  lead: FBLead;
  onSelect: () => void;
  onDeleteLead: (leadId: string, e: React.MouseEvent) => void;
  getIntentBadgeColor: (intent: string) => string;
  isSelected: boolean;
}

const ListCard: React.FC<ListCardProps> = React.memo(({
  lead,
  onSelect,
  onDeleteLead,
  getIntentBadgeColor,
  isSelected,
}) => {
  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-xl border border-neutral-800 bg-neutral-900/30 hover:bg-neutral-900/70 transition cursor-pointer flex items-start gap-4 relative overflow-hidden group ${
        isSelected ? 'border-blue-500/50 bg-neutral-900/70' : ''
      }`}
    >
      <div className="p-2.5 bg-neutral-900 border border-neutral-800 text-neutral-400 group-hover:text-blue-400 rounded-lg">
        <FacebookIcon size={16} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <h4 className="text-xs font-bold text-white truncate pr-2">{lead.authorName}</h4>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-900/50 px-2 py-0.5 rounded font-black">
              SPRECYZOWANIE: {lead.qualificationScore || 75}%
            </span>
            <span className={`text-[9px] font-mono font-medium px-2 py-0.5 rounded border ${getIntentBadgeColor(lead.intentLevel)}`}>
              INTENCJA: {lead.intentLevel}
            </span>
          </div>
        </div>

        <span className="block text-[10px] text-neutral-500 font-mono mb-2 truncate">{lead.groupName}</span>

        <p className="text-xs text-neutral-300 bg-neutral-950 p-2.5 rounded border border-neutral-900 border-l border-l-blue-500 line-clamp-2 leading-relaxed">
          {lead.painSummary}
        </p>

        <div className="mt-3.5 flex items-center justify-between text-[11px] text-neutral-500 font-medium">
          <span className="p-1 px-2.5 rounded bg-neutral-950 text-neutral-400 border border-neutral-900 text-[10px]">
            Status: <strong className="text-blue-400">{lead.status}</strong>
          </span>
          <span className="font-mono text-[10px]">{new Date(lead.createdAt).toLocaleDateString('pl-PL')}</span>
        </div>
      </div>

      <button
        onClick={(e) => onDeleteLead(lead.id, e)}
        className="p-1 px-2 rounded hover:bg-red-500/10 hover:text-red-400 text-neutral-600 transition cursor-pointer"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
});
ListCard.displayName = 'ListCard';

interface LeadsDatabaseTabProps {
  savedLeads: FBLead[];
  filteredSavedLeads: FBLead[];
  selectedLead: FBLead | null;
  setSelectedLead: (lead: FBLead | null) => void;
  viewMode: 'list' | 'kanban';
  onUpdateStatus: (leadId: string, newStatus: string) => void;
  onDeleteLead: (leadId: string, e: React.MouseEvent) => void;
  onCopyText: (text: string, fieldName: string) => void;
  getIntentBadgeColor: (intent: string) => string;
}

export const LeadsDatabaseTab: React.FC<LeadsDatabaseTabProps> = React.memo(({
  savedLeads,
  filteredSavedLeads,
  selectedLead,
  setSelectedLead,
  viewMode,
  onUpdateStatus,
  onDeleteLead,
  onCopyText,
  getIntentBadgeColor,
}) => {
  const defaultPitch = `Cześć! Zauważyłem, że interesuje Cię ten nowy dynamiczny kierunek. Mamy na to gotowy schemat działania. Sprawdź i odpisz!`;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {savedLeads.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 bg-neutral-900/40 p-4 rounded-xl border border-neutral-800">
          <div className="p-3 bg-neutral-950/60 border border-neutral-800/60 rounded-lg flex flex-col justify-between">
            <span className="text-[9px] font-mono uppercase tracking-wider text-neutral-500">Zapisane szanse</span>
            <span className="text-xl font-bold font-mono text-white mt-1">
              {savedLeads.length} <span className="text-[10px] text-neutral-500 font-sans font-normal">leadów</span>
            </span>
          </div>
          <div className="p-3 bg-neutral-950/60 border border-neutral-800/60 rounded-lg flex flex-col justify-between">
            <span className="text-[9px] font-mono uppercase tracking-wider text-neutral-500">Moc kwalifikacji (Śr)</span>
            <span className="text-xl font-bold font-mono text-emerald-400 mt-1">
              {Math.round(savedLeads.reduce((acc, l) => acc + (l.qualificationScore || 75), 0) / savedLeads.length)}%
            </span>
          </div>
          <div className="p-3 bg-neutral-950/60 border border-neutral-800/60 rounded-lg flex flex-col justify-between">
            <span className="text-[9px] font-mono uppercase tracking-wider text-neutral-500">Wartość lejka (Szac.)</span>
            <span className="text-xl font-bold font-mono text-blue-400 mt-1">
              ${savedLeads.reduce((acc, l) => {
                const budget = l.estimatedValueHex || '';
                if (budget.includes('Wysoki') || budget.includes('$3000+')) return acc + 4000;
                if (budget.includes('Średni') || budget.includes('$1000')) return acc + 2000;
                return acc + 750;
              }, 0)}
            </span>
          </div>
          <div className="p-3 bg-neutral-950/60 border border-neutral-800/60 rounded-lg flex flex-col justify-between">
            <span className="text-[9px] font-mono uppercase tracking-wider text-neutral-500">Brak outreach</span>
            <span className="text-xl font-bold font-mono text-amber-500 mt-1">
              {savedLeads.filter(l => l.status === 'Do kontaktu').length} <span className="text-[10px] text-neutral-500 font-sans font-normal">czeka</span>
            </span>
          </div>
        </div>
      )}

      {/* Fast Lane Section */}
      {filteredSavedLeads.some(l => l.groupName === 'Kolejka ZRZUT' || l.groupName?.includes('ZRZUT') || l.authorName?.includes('ZRZUT')) && (
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
              <p className="text-xs text-neutral-400">Gorące szanse z grup zidentyfikowane z najnowszego radaru trendów</p>
            </div>
            <span className="text-[10px] font-mono font-bold text-rose-400">OPERACJA ZRZUT 21:00</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSavedLeads.filter(l => l.groupName === 'Kolejka ZRZUT' || l.groupName?.includes('ZRZUT') || l.authorName?.includes('ZRZUT')).map((lead) => (
              <div 
                key={`zrzut-${lead.id}`}
                onClick={() => setSelectedLead(lead)}
                className={`bg-neutral-900/80 p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden group ${
                  lead.id === selectedLead?.id ? "border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.15)]" : "border-neutral-800 hover:border-neutral-700"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] bg-red-500/10 text-red-400 font-bold px-2 py-0.5 rounded border border-red-500/20">
                    {lead.intentLevel || 'Gorący'}
                  </span>
                  <span className="text-[10px] text-neutral-500 font-mono">Dopasowanie: {lead.qualificationScore || 95}%</span>
                </div>
                <h4 className="text-sm font-black text-white group-hover:text-red-400 transition-colors uppercase tracking-tight">{lead.authorName}</h4>
                <p className="text-xs text-neutral-300 font-sans mt-1 line-clamp-2 leading-relaxed italic">"{lead.postText}"</p>
                
                <div className="mt-3 bg-black/40 border border-neutral-800 p-2.5 rounded-lg space-y-2">
                  <span className="text-[9px] font-mono text-neutral-500 uppercase block">Generowany Outreach Pitch:</span>
                  <p className="text-[11px] text-blue-300 font-sans italic line-clamp-2 leading-normal">"{lead.outreachPitch || defaultPitch}"</p>
                  <div className="flex items-center gap-2 pt-1 border-t border-neutral-800">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCopyText(lead.outreachPitch || defaultPitch, "Outreach Pitch");
                      }}
                      className="bg-neutral-900 hover:bg-neutral-800 text-[10px] text-neutral-300 font-bold px-2.5 py-1 rounded border border-neutral-800 cursor-pointer flex items-center gap-1 transition-colors"
                    >
                      <Copy size={10} /> Schowek
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLead(lead);
                      }}
                      className="bg-red-600/15 border border-red-500/30 text-red-400 text-[10px] font-bold px-3 py-1 rounded hover:bg-red-600/25 cursor-pointer ml-auto transition-colors"
                    >
                      Wybierz Lead
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredSavedLeads.length === 0 ? (
        <div className="py-16 text-center text-neutral-500">
          <FileText size={44} className="mx-auto text-neutral-700 mb-3 animate-pulse" />
          <p className="text-xs">Brak wyciągniętych leadów w bazie danych mitygujących te filtry</p>
          <p className="text-[11px] text-neutral-600 mt-1">Spróbuj zresetować słowa kluczowe lub filtry intencji.</p>
        </div>
      ) : (
        <div>
          {viewMode === 'kanban' ? (
            /* KANBAN PIPE WORKSPACE VIEW */
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5 items-stretch overflow-x-auto pb-4">
              {[
                { id: 'Do kontaktu', label: 'Do kontaktu 📥', color: 'border-l-blue-500/80 bg-blue-500/5 hover:border-blue-500' },
                { id: 'Wysłano PM / Komentarz', label: 'Wysłano PM 📣', color: 'border-l-amber-500/80 bg-amber-500/5 hover:border-amber-500' },
                { id: 'Odpowiedział', label: 'Odpowiedział 💬', color: 'border-l-emerald-500/80 bg-emerald-500/5 hover:border-emerald-500' },
                { id: 'Negocjacja', label: 'Negocjacje 💸', color: 'border-l-indigo-500/80 bg-indigo-500/5 hover:border-indigo-500' },
                { id: 'Zamknięty / Aktywny', label: 'Wygrane 🎉', color: 'border-l-purple-500/80 bg-purple-500/5 hover:border-purple-500' },
              ].map((col) => {
                const colLeads = filteredSavedLeads.filter((l) => l.status === col.id);
                return (
                  <div 
                    key={col.id}
                    className="bg-neutral-900/25 border border-neutral-800 rounded-xl p-3 flex flex-col min-w-[210px] flex-1"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-neutral-800 mb-3 font-sans">
                      <span className="text-[11px] font-bold text-neutral-400 capitalize">{col.label}</span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
                        {colLeads.length}
                      </span>
                    </div>

                    <div className="space-y-2.5 flex-1 max-h-[480px] overflow-y-auto pr-0.5 custom-scrollbar">
                      {colLeads.length === 0 ? (
                        <div className="h-20 flex items-center justify-center border border-dashed border-neutral-800 rounded-lg text-center p-3">
                          <span className="text-[10px] font-sans text-neutral-605 italic">Pusta kolumna</span>
                        </div>
                      ) : (
                        colLeads.map((lead) => (
                          <KanbanCard
                            key={lead.id}
                            lead={lead}
                            colColor={col.color}
                            onSelect={() => setSelectedLead(lead)}
                            onUpdateStatus={onUpdateStatus}
                            onDeleteLead={onDeleteLead}
                          />
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* CLASSIC FLAT LIST VIEW */
            <div className="space-y-3.5 max-h-[580px] overflow-y-auto pr-1 custom-scrollbar">
              {filteredSavedLeads.map((lead) => (
                <ListCard
                  key={lead.id}
                  lead={lead}
                  isSelected={lead.id === selectedLead?.id}
                  onSelect={() => setSelectedLead(lead)}
                  onDeleteLead={onDeleteLead}
                  getIntentBadgeColor={getIntentBadgeColor}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

LeadsDatabaseTab.displayName = 'LeadsDatabaseTab';
