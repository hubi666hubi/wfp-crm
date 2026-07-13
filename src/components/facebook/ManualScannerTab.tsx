import React, { useState } from 'react';
import { Zap } from 'lucide-react';

interface ManualScannerTabProps {
  loading: boolean;
  onAnalyzePost: (postText: string, authorName: string, groupName: string) => void;
}

export const ManualScannerTab: React.FC<ManualScannerTabProps> = React.memo(({
  loading,
  onAnalyzePost,
}) => {
  const [pastedText, setPastedText] = useState('');
  const [pastedAuthor, setPastedAuthor] = useState('');
  const [pastedGroup, setPastedGroup] = useState('');

  const handleAnalyze = () => {
    if (!pastedText.trim()) return;
    onAnalyzePost(pastedText, pastedAuthor, pastedGroup);
    setPastedText('');
    setPastedAuthor('');
    setPastedGroup('');
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-blue-950/10 border border-blue-900/20 rounded-xl space-y-2">
        <h4 className="text-xs font-bold font-mono uppercase text-blue-400 flex items-center gap-1.5">
          <Zap size={14} /> Wklejacz Ręczny Zleceń z Messenger / FB
        </h4>
        <p className="text-xs text-neutral-400 leading-relaxed">
          Masz post lub długi komentarz bezpośrednio z grupy na Facebooku, LinkedIna lub komunikatora? Wklej go poniżej, a system automatycznie rozłoży go na czynniki pierwsze.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-mono text-neutral-400 uppercase tracking-widest mb-1.5">
            Autor wpisu / konta (Opcjonalnie)
          </label>
          <input
            type="text"
            placeholder="np. Hubert Wiśniewski"
            value={pastedAuthor}
            onChange={(e) => setPastedAuthor(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg py-2 px-3.5 text-xs text-neutral-200 outline-none transition"
          />
        </div>
        <div>
          <label className="block text-[11px] font-mono text-neutral-400 uppercase tracking-widest mb-1.5">
            Konto / Grupa (Opcjonalnie)
          </label>
          <input
            type="text"
            placeholder="np. Zlecenia Marketing & IT"
            value={pastedGroup}
            onChange={(e) => setPastedGroup(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg py-2 px-3.5 text-xs text-neutral-200 outline-none transition"
          />
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-mono text-neutral-400 uppercase tracking-widest mb-1.5">
          Surowa treść posta / wiadomości <span className="text-blue-500">*</span>
        </label>
        <textarea
          rows={6}
          required
          placeholder="Wklej tutaj treść..."
          value={pastedText}
          onChange={(e) => setPastedText(e.target.value)}
          className="w-full bg-neutral-900 border border-neutral-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg py-3 px-4 text-xs text-neutral-200 outline-none transition font-sans leading-relaxed whitespace-pre-wrap"
        />
      </div>

      <button
        type="button"
        disabled={!pastedText.trim() || loading}
        onClick={handleAnalyze}
        className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-semibold py-3 rounded-xl text-xs tracking-wider transition uppercase shadow-[0_0_20px_rgba(24,119,242,0.2)] cursor-pointer"
      >
        Wyślij do głębokiej analizy AI & Skanera
      </button>
    </div>
  );
});

ManualScannerTab.displayName = 'ManualScannerTab';
