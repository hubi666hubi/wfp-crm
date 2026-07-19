import { useState, useEffect } from 'react';

export const RAGStatus: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([
    '> Initializing Supabase Connection...',
    '> Vector DB [pgvector] mounted.',
    '> text-embedding-004 model initialized.',
    '> Waiting for incoming queries...',
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      const messages = [
        '> Syncing with lead_scraper.py...',
        '> Indexing new case studies...',
        '> Optimizing vector indices...',
        '> System Health: OPTIMAL',
        '> RAG Latency: 42ms'
      ];
      const newMsg = messages[Math.floor(Math.random() * messages.length)];
      setLogs(prev => {
        const next = [...prev, newMsg];
        if (next.length > 6) return next.slice(1);
        return next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#00ff00] animate-pulse" />
            <span className="text-xs text-[#00ff00]/70">Database: CONNECTED</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#00ff00] animate-pulse" />
            <span className="text-xs text-[#00ff00]/70">Embeddings: READY</span>
          </div>
        </div>
        <div className="text-xs border border-[#00ff00]/30 px-2 py-1 rounded bg-[#00ff00]/10 text-[#00ff00]">
          12,408 VECTORS
        </div>
      </div>

      <div className="flex-1 bg-black/60 border border-[#00ff00]/20 rounded p-3 font-mono text-xs text-[#00ff00]/60 overflow-hidden flex flex-col justify-end relative">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none bg-gradient-to-b from-black/80 to-transparent" />
        {logs.map((log, i) => (
          <div key={i} className="mb-1 opacity-80 hover:opacity-100 transition-opacity">
            {log}
          </div>
        ))}
      </div>
    </div>
  );
};
