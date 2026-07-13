import React, { useState } from 'react';
import { Activity, Plus, X } from 'lucide-react';

interface KeywordMonitorProps {
  keywords: string[];
  onAddKeyword: (kw: string) => void;
  onRemoveKeyword: (kw: string) => void;
}

export const KeywordMonitor: React.FC<KeywordMonitorProps> = React.memo(({
  keywords,
  onAddKeyword,
  onRemoveKeyword,
}) => {
  const [newKeyword, setNewKeyword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;
    onAddKeyword(newKeyword);
    setNewKeyword('');
  };

  return (
    <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl" />
      <h3 className="text-sm font-mono font-semibold text-neutral-300 uppercase tracking-wider mb-4 flex items-center gap-2">
        <Activity className="text-blue-500 animate-pulse" size={16} /> Monitor Słów Kluczowych
      </h3>

      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Dodaj słowo kluczowe..."
          value={newKeyword}
          onChange={(e) => setNewKeyword(e.target.value)}
          className="flex-1 bg-neutral-900 border border-neutral-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg py-1.5 px-3 text-xs text-neutral-200 outline-none transition"
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg transition text-xs font-semibold flex items-center gap-1"
        >
          <Plus size={14} /> Dodaj
        </button>
      </form>

      <div className="flex flex-wrap gap-1.5 max-h-[150px] overflow-y-auto pr-1">
        {keywords.map((kw) => (
          <span
            key={kw}
            className="inline-flex items-center gap-1 bg-blue-950/20 text-blue-400 border border-blue-500/20 text-xs px-2.5 py-1 rounded"
          >
            #{kw}
            <button
              type="button"
              onClick={() => onRemoveKeyword(kw)}
              className="text-blue-500 hover:text-white transition ml-1"
            >
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
      
      <p className="text-[11px] text-neutral-500 mt-3 font-sans leading-relaxed">
        System automatycznie filtruje wirtualny strumień i wykrywa intencje postów zawierających te frazy.
      </p>
    </div>
  );
});

KeywordMonitor.displayName = 'KeywordMonitor';
