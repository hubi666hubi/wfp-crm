import { useState } from 'react';
import { Podcast as PodcastIcon, Rss, Mic, Play, Settings } from 'lucide-react';
import { motion } from 'motion/react';

export function Podcast() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [feedUrl, setFeedUrl] = useState('');

  const handleGenerateRss = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setFeedUrl(`https://omegasystem.app/rss/podcast/${Date.now()}.xml`);
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <PodcastIcon className="text-purple-500" size={32} />
          Zautomatyzowany Podcast AI
        </h1>
        <p className="mt-1 text-sm text-neutral-400">
          Ciągły format feedu RSS. Odcinki, skrypty i synteza kreowane automatycznie z bazy wiedzy.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <h3 className="text-lg font-medium text-white mb-4 border-b border-neutral-800 pb-2 flex items-center gap-2">
            <Rss size={18} className="text-orange-500" />
            Generator Feedu RSS
          </h3>
          <p className="text-sm text-neutral-400 mb-6">
            Kliknij, aby podsumować aktualne VSL-e i zwiady. System wygeneruje skrypt i przekonwertuje go na audio, a następnie udostępni link RSS gotowy do dodania do Spotify i Apple Podcasts.
          </p>

          <button 
            onClick={handleGenerateRss}
            disabled={isGenerating}
            className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(147,51,234,0.3)] mb-4"
          >
            {isGenerating ? <Mic className="animate-pulse" size={18} /> : <Settings size={18} />}
            {isGenerating ? 'Synteza nowych odcinków...' : 'Generuj Aktualny Kanał RSS'}
          </button>

          {feedUrl && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4 p-4 bg-orange-500/10 border border-orange-500/50 rounded-lg"
            >
              <h4 className="text-sm font-semibold text-orange-400 mb-2">Twój Kanał RSS Audio:</h4>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={feedUrl} 
                  className="flex-1 bg-black border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-300 focus:outline-none"
                />
                <button 
                  onClick={() => navigator.clipboard.writeText(feedUrl)}
                  className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  Kopiuj
                </button>
              </div>
            </motion.div>
          )}
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <h3 className="text-lg font-medium text-white mb-4 border-b border-neutral-800 pb-2 flex items-center gap-2">
            <Play size={18} className="text-purple-400" />
            Ostatnie Wygenerowane Odcinki
          </h3>
          <div className="space-y-4">
            {[
              { title: 'Ep 12: Jak zmniejszyć churn w B2B o 30%', duration: '14:20', date: 'Wczoraj' },
              { title: 'Ep 11: Analiza wektorowa bólów klientów', duration: '22:15', date: '3 dni temu' },
              { title: 'Ep 10: VSL - Ciemne Wzorce vs Etyka', duration: '18:45', date: 'Tydzień temu' },
            ].map((ep, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-neutral-950 rounded-lg border border-neutral-800">
                <div>
                  <h4 className="text-sm font-medium text-gray-200">{ep.title}</h4>
                  <p className="text-xs text-neutral-500 mt-1">{ep.date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-purple-400 bg-purple-400/10 px-2 py-1 rounded">{ep.duration}</span>
                  <button className="text-neutral-400 hover:text-white transition-colors">
                    <Play size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
