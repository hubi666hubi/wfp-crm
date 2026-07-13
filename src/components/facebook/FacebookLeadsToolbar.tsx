import { Search, RefreshCw } from 'lucide-react';

interface FacebookLeadsToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  activeTab: string;
  viewMode: 'list' | 'kanban';
  onViewModeChange: (value: 'list' | 'kanban') => void;
  intentFilter: string;
  onIntentFilterChange: (value: string) => void;
  refreshingFeed: boolean;
  onRefreshFeed: () => void;
}

export function FacebookLeadsToolbar({
  searchQuery,
  onSearchChange,
  activeTab,
  viewMode,
  onViewModeChange,
  intentFilter,
  onIntentFilterChange,
  refreshingFeed,
  onRefreshFeed,
}: FacebookLeadsToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-neutral-900 pb-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600" size={14} />
        <input
          type="text"
          placeholder="Wyszukaj zlecenia, użytkowników, grupy..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 rounded-lg pl-8 pr-4 py-2 outline-none focus:border-blue-500 w-full transition"
        />
      </div>

      {activeTab === 'feed' && (
        <button
          onClick={onRefreshFeed}
          disabled={refreshingFeed}
          className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 p-2.5 rounded-lg transition disabled:opacity-50 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          title="Odśwież monitowanie"
        >
          <RefreshCw size={12} className={refreshingFeed ? 'animate-spin' : ''} />
          Odśwież
        </button>
      )}

      {activeTab === 'leads' && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-neutral-900 border border-neutral-800 p-0.5 rounded-lg">
            <button
              type="button"
              onClick={() => onViewModeChange('kanban')}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-md transition duration-150 cursor-pointer ${viewMode === 'kanban' ? 'bg-blue-600 text-white shadow' : 'text-neutral-400 hover:text-neutral-200'}`}
            >
              📊 Lejek PRO
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('list')}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-md transition duration-150 cursor-pointer ${viewMode === 'list' ? 'bg-blue-600 text-white shadow' : 'text-neutral-400 hover:text-neutral-200'}`}
            >
              📋 Klasyczna Lista
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-mono text-neutral-500">Intencja</span>
            <select
              value={intentFilter}
              onChange={(e) => onIntentFilterChange(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 rounded px-2.5 py-1.5 outline-none focus:border-blue-500"
            >
              <option value="All">Wszystkie</option>
              <option value="Gorący">Gorący</option>
              <option value="Ciepły">Ciepły</option>
              <option value="Zimny">Zimny</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
