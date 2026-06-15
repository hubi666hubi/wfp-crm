import { useState } from 'react';
import { Search, Globe, Database, Activity, RefreshCw, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useClipboard } from '../hooks/useClipboard';

interface SearchResult {
  id: string;
  source: string;
  painPoint: string;
  timestamp: string;
  url?: string;
}

function ResultCard({ result }: { result: SearchResult }) {
  const { hasCopied, copy } = useClipboard();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-neutral-900 border border-neutral-800 p-4 rounded-lg"
    >
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-semibold text-blue-400 bg-blue-400/10 px-2 py-1 rounded">
          {result.source}
        </span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-500">{result.timestamp}</span>
          {result.url && (
            <button
              onClick={() => copy(result.url!)}
              className="text-neutral-500 hover:text-blue-400 transition-colors"
              title="Skopiuj link do wyniku"
            >
              {hasCopied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            </button>
          )}
        </div>
      </div>
      <p className="text-sm text-gray-300 leading-relaxed">
        {result.painPoint}
      </p>
    </motion.div>
  );
}

export function Scouts() {
  const [keyword, setKeyword] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [vectorMemoryCount, setVectorMemoryCount] = useState(142);

  const handleScan = async () => {
    if (!keyword.trim()) return;
    setIsScanning(true);
    
    // Simulate API call to deep scraper & RAG
    setTimeout(() => {
      const newItems = [
        {
          id: Date.now().toString(),
          source: 'Reddit /r/Entrepreneur',
          painPoint: `Found people complaining about "${keyword}": They hate how much time it takes to manually update CRM data. Need automation.`,
          timestamp: new Date().toLocaleTimeString(),
          url: `https://www.reddit.com/r/Entrepreneur/search?q=${encodeURIComponent(keyword)}`
        },
        {
          id: (Date.now() + 1).toString(),
          source: 'HackerNews',
          painPoint: `Discussion on "${keyword}" revealed high churn due to complex onboarding processes. Suggests simplified UI setup.`,
          timestamp: new Date().toLocaleTimeString(),
          url: `https://hn.algolia.com/?q=${encodeURIComponent(keyword)}`
        }
      ];
      setResults(prev => [...newItems, ...prev]);
      setVectorMemoryCount(prev => prev + 2);
      setIsScanning(false);
      setKeyword('');
    }, 2500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <Globe className="text-blue-500" size={32} />
          Agenci Zwiadowcy (Deep Web & RAG)
        </h1>
        <p className="mt-1 text-sm text-neutral-400 max-w-3xl">
          Autonomiczne przeszukiwanie forów i platform społecznościowych w celu wychwycenia bólu klienta i zasilenia Pamięci Wektorowej RAG.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
            <Search size={14} />
            <span>Źródła: Reddit, HackerNews, Quora, GitHub, Twitter</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium">
            <Activity size={14} />
            <span>Analiza: Gemini 1.5 Pro</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <Database size={14} />
            <span>Baza wektorowa (RAG)</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
            <h3 className="text-lg font-medium text-white mb-4 border-b border-neutral-800 pb-2 flex items-center gap-2">
              <Search size={18} className="text-blue-400" />
              Cron Skanowania
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1 uppercase tracking-wider">Fraza kluczowa / Wektor</label>
                <input 
                  type="text" 
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="np. SaaS churn, cold email..."
                  className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                  disabled={isScanning}
                  onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                />
              </div>
              <button 
                onClick={handleScan}
                disabled={isScanning || !keyword.trim()}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2"
              >
                {isScanning ? <RefreshCw className="animate-spin" size={16} /> : <Search size={16} />}
                {isScanning ? 'Penetracja sieci...' : 'Wyślij Zwiadowcę'}
              </button>
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 text-center">
            <Database className="mx-auto text-emerald-500 mb-3" size={32} />
            <h4 className="text-sm text-neutral-400 uppercase tracking-wider font-semibold mb-1">Pamięć Wektorowa RAG</h4>
            <p className="text-4xl font-bold text-white mb-2">{vectorMemoryCount}</p>
            <p className="text-xs text-neutral-500">Złapane bóle i insighty klientów gotowe do użycia przez Maszynę A/B/C.</p>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl h-[500px] flex flex-col overflow-hidden relative">
            <div className="p-4 border-b border-neutral-800 bg-neutral-900/50 flex justify-between items-center z-10">
              <h3 className="text-sm font-medium text-white flex items-center gap-2">
                <Activity size={16} className="text-emerald-500" />
                Strumień Pozyskanych Danych
              </h3>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar z-10">
              {results.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-full text-neutral-600 space-y-3">
                   <Globe size={48} className="opacity-20" />
                   <p>Oczekujące na raporty zwiadowców...</p>
                 </div>
              ) : (
                <AnimatePresence>
                  {results.map((result) => (
                    <ResultCard key={result.id} result={result} />
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
