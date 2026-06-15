import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BrainCircuit, Zap, Sparkles, TrendingUp, BarChart3, 
  Trash2, RefreshCw, Clipboard, Check, Play, Save, History,
  Video
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';
import { auth, db } from '../lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import { toast } from 'sonner';

interface TriggerItem {
  trigger: string;
  description: string;
  intensity: number;
}

interface SpikePoint {
  time: string;
  baseline: number;
  spike: number;
  dropMessage: string;
}

interface DopamineLoopItem {
  id?: string;
  userId: string;
  hook: string;
  channel: string;
  niche: string;
  score: number;
  patternInterrupt: string;
  unresolvedMystery: string;
  loopType: string;
  triggerTactics: string[];
  improvedHooks: string[];
  triggers: TriggerItem[];
  spikes: SpikePoint[];
  predictedTrend?: string;
  createdAt: string;
}

const DEFAULT_SPIKES: SpikePoint[] = [
  { time: '0s', baseline: 45, spike: 45, dropMessage: 'Oczekiwanie neutralne' },
  { time: '1s', baseline: 45, spike: 65, dropMessage: 'Przerwanie wzorca' },
  { time: '3s', baseline: 45, spike: 88, dropMessage: 'Otwarcie pętli ciekawości' },
  { time: '10s', baseline: 45, spike: 75, dropMessage: 'Napięcie narracyjne' },
  { time: '30s', baseline: 45, spike: 55, dropMessage: 'Sycenie pragnienia' },
  { time: '60s', baseline: 45, spike: 50, dropMessage: 'Spadek uwagi - zmęczenie bodźcem' },
  { time: '90s', baseline: 45, spike: 45, dropMessage: 'Zamknięcie pętli / Akcja' },
];

const DEFAULT_TRIGGERS: TriggerItem[] = [
  { trigger: 'Dysonans Poznawczy', description: 'Prezentacja faktu sprzecznego ze zdrowym rozsądkiem', intensity: 85 },
  { trigger: 'Dysonans Wzorca', description: 'Nietypowy dźwięk lub wizualizacja burząca rutynę scrollowania', intensity: 78 },
  { trigger: 'Strach przed wykluczeniem (FOMO)', description: 'Sygnalizowanie ukrytej i ograniczonej wiedzy', intensity: 65 },
];

export function DopamineLoops() {
  const navigate = useNavigate();
  const [hook, setHook] = useState('');

  const handleGenerateVslFromHook = (selectedHook: string) => {
    if (!currentResult) return;
    const path = `/vsl-generator?topic=${encodeURIComponent(selectedHook)}&niche=${encodeURIComponent(currentResult.niche || '')}&loopType=${encodeURIComponent(currentResult.loopType || '')}&channel=${encodeURIComponent(currentResult.channel || '')}&autoGenerate=true`;
    navigate(path);
  };
  const [channel, setChannel] = useState('TikTok');
  const [niche, setNiche] = useState('Biznes & B2B');
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  
  // Simulation result state
  const [currentResult, setCurrentResult] = useState<Partial<DopamineLoopItem> | null>(null);
  const [savedLoops, setSavedLoops] = useState<DopamineLoopItem[]>([]);
  const [loopsLoading, setLoopsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [predicting, setPredicting] = useState(false);

  const channels = ['TikTok', 'Instagram Reels', 'YouTube Shorts', 'LinkedIn Post', 'Newsletter Broad', 'Twitter/X'];
  const niches = ['Biznes & B2B', 'Marketing & Agencje', 'Crypto & Finanse', 'Psychologia & Mindset', 'Produktywność', 'Life Hacks & Edukacja'];

  const fetchSavedLoops = async () => {
    if (!auth.currentUser) return;
    setLoopsLoading(true);
    try {
      const q = query(
        collection(db, 'dopamine_loops'),
        where('userId', '==', auth.currentUser.uid)
      );
      const snapshot = await getDocs(q);
      const items: DopamineLoopItem[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        items.push({
          id: d.id,
          userId: data.userId,
          hook: data.hook,
          channel: data.channel,
          niche: data.niche,
          score: data.score,
          patternInterrupt: data.patternInterrupt || '',
          unresolvedMystery: data.unresolvedMystery || '',
          loopType: data.loopType || 'Standard',
          triggerTactics: data.triggerTactics || [],
          improvedHooks: data.improvedHooks || [],
          triggers: data.triggers || [],
          spikes: data.spikes || [],
          predictedTrend: data.predictedTrend || '',
          createdAt: data.createdAt || new Date().toISOString(),
        });
      });
      // Sort client-side by createdAt descending since we don't have a composite index enforced yet
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setSavedLoops(items);
    } catch (e) {
      console.error('Error fetching loops:', e);
      toast.error('Błąd podczas pobierania zapisanych pętli.');
    } finally {
      setLoopsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const runFetch = async () => {
      await Promise.resolve();
      if (active) {
        fetchSavedLoops();
      }
    };
    runFetch();
    return () => {
      active = false;
    };
  }, []);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hook.trim()) {
      toast.error('Wprowadź haczyk (hook) do analizy.');
      return;
    }

    setLoading(true);
    setCurrentResult(null);
    const toastId = toast.loading('Neuro-architekt Omega inicjuje symulację biochemiczną...');

    try {
      const response = await fetch('/api/dopamine-loops/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hook, channel, niche }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Server error');
      }

      const generated = data.result;
      setCurrentResult({
        hook,
        channel,
        niche,
        score: generated.score,
        patternInterrupt: generated.patternInterrupt,
        unresolvedMystery: generated.unresolvedMystery,
        loopType: generated.loopType,
        triggerTactics: generated.triggerTactics,
        improvedHooks: generated.improvedHooks,
        triggers: generated.triggers,
        spikes: generated.spikes,
        predictedTrend: generated.predictedTrend || 'Brak predykcji.',
      });

      toast.success('Pętla dopaminowa zanalizowana pomyślnie!', { id: toastId });
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : 'Błąd połączenia z serwerem.';
      toast.error(errMsg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handlePredictTrend = async () => {
    if (!currentResult || predicting) return;
    setPredicting(true);
    const toastId = toast.loading('Satelitarny procesor Omega kalkuluje predykcję trendu...');

    try {
      const response = await fetch('/api/dopamine-loops/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hook: currentResult.hook,
          channel: currentResult.channel,
          niche: currentResult.niche,
          score: currentResult.score,
          spikes: currentResult.spikes,
          triggers: currentResult.triggers
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Prediction server error');
      }

      setCurrentResult(prev => prev ? { ...prev, predictedTrend: data.prediction } : null);
      toast.success('Prognoza trendu zaangażowania odświeżona pomyślnie!', { id: toastId });
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : 'Błąd prognozowania trendu.';
      toast.error(errMsg, { id: toastId });
    } finally {
      setPredicting(false);
    }
  };

  const handleSaveResult = async () => {
    if (!currentResult || !auth.currentUser) return;
    setIsSaving(true);
    try {
      const payload = {
        userId: auth.currentUser.uid,
        hook: currentResult.hook,
        channel: currentResult.channel,
        niche: currentResult.niche,
        score: currentResult.score,
        patternInterrupt: currentResult.patternInterrupt,
        unresolvedMystery: currentResult.unresolvedMystery,
        loopType: currentResult.loopType,
        triggerTactics: currentResult.triggerTactics,
        improvedHooks: currentResult.improvedHooks,
        triggers: currentResult.triggers,
        spikes: currentResult.spikes,
        predictedTrend: currentResult.predictedTrend || '',
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'dopamine_loops'), payload);
      toast.success('Analiza pętli dopaminowej zapisana w archiwum!');
      fetchSavedLoops();
    } catch (e) {
      console.error('Save error:', e);
      toast.error('Błąd zapisu analizy.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteLoop = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Czy na pewno chcesz usunąć tę analizę z archiwum?')) return;
    try {
      await deleteDoc(doc(db, 'dopamine_loops', id));
      toast.success('Analiza usunięta.');
      setSavedLoops(prev => prev.filter(item => item.id !== id));
      if (currentResult?.id === id) {
        setCurrentResult(null);
      }
    } catch (e) {
      console.error('Delete error:', e);
      toast.error('Błąd podczas usuwania analizy.');
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success('Skopiowano ulepszony haczyk!');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const loadSavedToActive = (item: DopamineLoopItem) => {
    setCurrentResult(item);
    setHook(item.hook);
    setChannel(item.channel);
    setNiche(item.niche);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Spike points for chart
  const chartData = currentResult?.spikes || DEFAULT_SPIKES;
  const metricsTriggers = currentResult?.triggers || DEFAULT_TRIGGERS;
  const displayScore = currentResult?.score || 0;

  return (
    <div id="dopamine-loops-container" className="space-y-8 max-w-7xl mx-auto text-neutral-200">
      
      {/* Upper header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-neutral-800 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <BrainCircuit className="text-rose-500 w-9 h-9 filter drop-shadow-[0_0_8px_rgba(244,63,94,0.5)] animate-pulse" />
            Pętle Dopaminowe <span className="text-xs bg-rose-500/10 border border-rose-500/30 text-rose-400 font-mono py-1 px-2.5 rounded uppercase tracking-widest">Neuro-Hacking PRO</span>
          </h1>
          <p className="text-neutral-400 text-sm mt-1 max-w-2xl font-mono">
            Analizuj wirusowe haczyki, symuluj reakcje behawioralne odbiorców i dostosuj bodźce biochemiczne w kanałach dystrybucji.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: Setup and simulation inputs */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-6 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl" />
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2 border-b border-neutral-800 pb-2">
              <Zap size={18} className="text-rose-500" />
              Generator Bodźców
            </h2>
            
            <form onSubmit={handleSimulate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5 uppercase font-mono tracking-wider">
                  Dystrybucja (Kanał)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {channels.map((chan) => (
                    <button
                      key={chan}
                      type="button"
                      onClick={() => setChannel(chan)}
                      className={`py-2 px-3 text-xs rounded border transition-all truncate text-left ${
                        channel === chan 
                          ? 'bg-rose-500/10 border-rose-500/50 text-rose-300 font-medium' 
                          : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'
                      }`}
                    >
                      {chan}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5 uppercase font-mono tracking-wider">
                  Nisza docelowa
                </label>
                <select
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 font-mono"
                >
                  {niches.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5 uppercase font-mono tracking-wider">
                  Haczyk / Hook wideo (Copy)
                </label>
                <textarea
                  value={hook}
                  onChange={(e) => setHook(e.target.value)}
                  placeholder="Np.: 'Większość agencji kłamie w kwestii zarobków. Oto prawda...' lub 'Jak zautomatyzowałem 100 postów w 4 minuty bez AI...'"
                  rows={4}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2.5 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-500 text-white font-medium text-sm rounded-lg transition-all flex items-center justify-center gap-2 font-mono tracking-wider shadow-[0_0_20px_rgba(225,29,72,0.25)] hover:shadow-[0_0_30px_rgba(225,29,72,0.4)] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    ANALIZA BIOMETRYCZNA...
                  </>
                ) : (
                  <>
                    <Play size={16} />
                    SYMULUJ PIK DOPAMINY
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Persistent Archive Checklist */}
          <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-6 backdrop-blur-sm">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2 border-b border-neutral-800 pb-2">
              <History size={18} className="text-neutral-400" />
              Archiwum Symulacji
            </h2>

            {loopsLoading ? (
              <div className="py-8 flex flex-col items-center justify-center text-neutral-500 font-mono text-xs gap-2">
                <RefreshCw className="animate-spin text-rose-500" size={16} />
                Ładowanie archiwum...
              </div>
            ) : savedLoops.length === 0 ? (
              <p className="text-neutral-500 text-xs font-mono py-6 text-center">
                Brak zapisanych symulacji w bazie danych.
              </p>
            ) : (
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin">
                {savedLoops.map((saved) => (
                  <div
                    key={saved.id}
                    onClick={() => loadSavedToActive(saved)}
                    className="p-3 bg-neutral-900/40 border border-neutral-800/80 rounded-lg hover:border-rose-500/40 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] bg-neutral-800 border border-neutral-700 font-mono text-neutral-400 py-0.5 px-2 rounded-sm truncate">
                          {saved.channel}
                        </span>
                        <span className="text-xs font-bold text-rose-400 font-mono">
                          {saved.score}%
                        </span>
                      </div>
                      <p className="text-xs text-neutral-300 truncate font-mono">
                        "{saved.hook}"
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDeleteLoop(saved.id!, e)}
                      title="Usuń z archiwum"
                      className="p-1.5 text-neutral-500 hover:text-rose-500 rounded bg-neutral-900 border border-neutral-800 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right content: Analysis Dashboard Dashboard */}
        <div className="lg:col-span-2 space-y-6">

          {/* Neuro Engagement Metrics Card */}
          <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-6 backdrop-blur-sm relative overflow-hidden">
            
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-4 mb-4">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase">System Omega / Neuro-Monitoring</span>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <TrendingUp className="text-rose-500" size={20} />
                  Amplituda Reakcji Dopaminowej
                </h3>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="bg-neutral-900 border border-neutral-800 rounded-lg py-1.5 px-4 text-center">
                  <span className="block text-[9px] font-mono text-neutral-500 uppercase tracking-widest">Dopamine Score</span>
                  <span className="text-2xl font-extrabold text-rose-500 font-mono filter drop-shadow-[0_0_4px_rgba(244,63,94,0.3)]">
                    {displayScore}/100
                  </span>
                </div>
                {currentResult && !currentResult.id && (
                  <button
                    onClick={handleSaveResult}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 py-2 px-3 bg-neutral-900 hover:bg-rose-950/40 border border-neutral-800 hover:border-rose-500/40 rounded-lg text-xs font-mono font-medium text-neutral-300 hover:text-rose-400 transition-all disabled:opacity-50"
                  >
                    {isSaving ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save size={14} />
                    )}
                    Zapisz
                  </button>
                )}
              </div>
            </div>

            {/* Recharts Area Chart */}
            <div className="h-72 w-full mt-2 bg-neutral-900/20 rounded-lg p-2 border border-neutral-900">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 15, right: 15, left: -25, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="colorSpike" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e11d48" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#e11d48" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorBaseline" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#525252" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#525252" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                  <XAxis 
                    dataKey="time" 
                    stroke="#525252" 
                    fontSize={11}
                    fontFamily="monospace"
                  />
                  <YAxis 
                    stroke="#525252" 
                    fontSize={11}
                    fontFamily="monospace"
                    domain={[0, 100]}
                  />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: '#0a0a0a', 
                      borderColor: '#262626',
                      color: '#e5e7eb',
                      fontSize: '11px',
                      fontFamily: 'monospace'
                    }}
                    itemStyle={{ color: '#fda4af' }}
                  />
                  <Area 
                    name="Neurobiologiczny Pik Dopaminy"
                    type="monotone" 
                    dataKey="spike" 
                    stroke="#e11d48" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorSpike)" 
                    activeDot={{ r: 6 }}
                  />
                  <Area 
                    name="Baseline (Norma uwagi)"
                    type="monotone" 
                    dataKey="baseline" 
                    stroke="#525252" 
                    strokeWidth={1}
                    strokeDasharray="4 4"
                    fillOpacity={1} 
                    fill="url(#colorBaseline)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* COMPONENT: Gemini Predictive Trend HUD */}
            {currentResult && (
              <div className="mt-6 bg-gradient-to-r from-rose-950/20 to-neutral-900/40 border border-rose-500/20 rounded-xl p-5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-1000" />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3 border-b border-rose-900/20 pb-3">
                  <div className="flex items-center gap-2.5">
                    <BrainCircuit className="text-rose-400 w-5 h-5 filter drop-shadow-[0_0_5px_rgba(251,113,133,0.5)] animate-pulse" />
                    <div>
                      <span className="text-[9px] font-mono uppercase text-rose-500 tracking-wider block font-semibold leading-none mb-1">PROGNOZA BEHAWIORALNA OMEGA (GEMINI API)</span>
                      <h4 className="text-sm font-bold text-neutral-100 font-mono tracking-tight">Komentarz Predykcji Trendu Zaangażowania</h4>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handlePredictTrend}
                    disabled={predicting}
                    className="flex items-center gap-1.5 py-1.5 px-3 bg-rose-950/30 hover:bg-rose-950/50 border border-rose-900/30 hover:border-rose-500/40 rounded-lg text-xs font-mono font-medium text-rose-300 hover:text-rose-200 transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${predicting ? 'animate-spin' : ''}`} />
                    Odśwież Prognozę
                  </button>
                </div>
                
                {predicting ? (
                  <div className="py-2 space-y-2">
                    <div className="h-3 bg-neutral-800 rounded animate-pulse w-3/4"></div>
                    <div className="h-3 bg-neutral-800 rounded animate-pulse w-5/6"></div>
                    <div className="h-3 bg-neutral-800 rounded animate-pulse w-1/2"></div>
                  </div>
                ) : (
                  <p className="text-xs text-neutral-300 leading-relaxed font-mono relative z-10 italic">
                    "{currentResult.predictedTrend || 'Wprowadź haczyk i symuluj biochemiczną aktywność, aby sporządzić prognozę neuro-behawioralną.'}"
                  </p>
                )}
              </div>
            )}

            {/* Micro Timeline log explaining timeline */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="bg-neutral-900/50 rounded-xl p-4 border border-neutral-800">
                <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Play size={12} className="text-rose-500" />
                  Biologiczna Sekwencja Piku
                </h4>
                <div className="space-y-3 max-h-[180px] overflow-y-auto pr-1 text-xs">
                  {chartData.map((pt, i) => (
                    <div key={i} className="flex gap-2.5 items-start">
                      <span className="font-mono text-rose-500 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded text-[10px] flex-shrink-0 mt-0.5">
                        {pt.time}
                      </span>
                      <div className="flex-1">
                        <div className="flex justify-between text-neutral-300">
                          <span className="font-medium font-mono">{pt.dropMessage}</span>
                          <span className="text-[10px] text-neutral-500 font-mono">D: {pt.spike}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cognitive Triggers Matrix */}
              <div className="bg-neutral-900/50 rounded-xl p-4 border border-neutral-800 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Sparkles size={12} className="text-rose-500" />
                    Wykorzystane Zapalniki Behawioralne
                  </h4>
                  <div className="space-y-3">
                    {metricsTriggers.map((trg, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-neutral-200">{trg.trigger}</span>
                          <span className="text-[10px] text-rose-400 font-mono font-medium">{trg.intensity}%</span>
                        </div>
                        <div className="w-full bg-neutral-950 h-1.5 rounded-full overflow-hidden border border-neutral-800">
                          <div 
                            className="bg-rose-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${trg.intensity}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-neutral-500 leading-snug">
                          {trg.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Analysis and Improvements cards */}
          <AnimatePresence mode="popLayout">
            {currentResult ? (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {/* Structural Analysis */}
                <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-6 backdrop-blur-sm space-y-4">
                  <h3 className="text-md font-bold text-white flex items-center gap-2 border-b border-neutral-800 pb-2">
                    <BrainCircuit size={16} className="text-rose-500" />
                    Neuro-Analiza Hooka
                  </h3>

                  <div className="space-y-3.5">
                    <div>
                      <span className="block text-[10px] font-mono uppercase text-rose-400 font-bold tracking-widest mb-1">
                        Typ Pętli (Neuro Loop Type)
                      </span>
                      <p className="text-sm text-neutral-200 font-bold bg-rose-500/5 border border-rose-500/20 px-3 py-1.5 rounded-lg inline-block font-mono">
                        {currentResult.loopType}
                      </p>
                    </div>

                    <div>
                      <span className="block text-[10px] font-mono uppercase text-rose-400 font-bold tracking-widest mb-1">
                        Przerwanie wzorca (Pattern Interrupt)
                      </span>
                      <p className="text-xs text-neutral-300 leading-relaxed font-mono">
                        {currentResult.patternInterrupt}
                      </p>
                    </div>

                    <div>
                      <span className="block text-[10px] font-mono uppercase text-rose-400 font-bold tracking-widest mb-1">
                        Niedomknięta pętla ciekawości (Unresolved Mystery)
                      </span>
                      <p className="text-xs text-neutral-300 leading-relaxed font-mono">
                        {currentResult.unresolvedMystery}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tactics Card */}
                <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-6 backdrop-blur-sm space-y-4">
                  <h3 className="text-md font-bold text-white flex items-center gap-2 border-b border-neutral-800 pb-2">
                    <BarChart3 size={16} className="text-rose-500" />
                    Taktyki Retencji (Neuro-Editing)
                  </h3>
                  <div className="space-y-4 text-xs font-mono">
                    <p className="text-neutral-400 leading-relaxed">
                      Zastosuj poniższe bodźce edycyjne w montażu, aby zmusić mózg widza do utrzymania skupienia ponad granicę 3 sekund:
                    </p>
                    <ul className="space-y-3">
                      {currentResult.triggerTactics?.map((t, idx) => (
                        <li key={idx} className="flex gap-2 items-start bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-800/80">
                          <span className="text-[10px] bg-rose-500/20 text-rose-400 py-0.5 px-2 rounded-sm flex-shrink-0">
                            Taktyka #{idx + 1}
                          </span>
                          <span className="text-neutral-300 text-xs leading-relaxed">{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Ultimate Alternatives */}
                <div className="md:col-span-2 bg-neutral-950/80 border border-neutral-800 rounded-xl p-6 backdrop-blur-sm space-y-4">
                  <h3 className="text-md font-bold text-white flex items-center gap-2 border-b border-neutral-800 pb-2">
                    <Sparkles size={16} className="text-rose-400" />
                    Ulepszone Haczyki Rynkowe (Wojskowe Copywriting Omega)
                  </h3>
                  <p className="text-xs font-mono text-neutral-400 leading-relaxed">
                    Trzy super-warianty zaprojektowane pod kątem brutalnej optymalizacji biochemicznej. Kliknij, aby skopiować:
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {currentResult.improvedHooks?.map((h, idx) => (
                      <div 
                        key={idx} 
                        className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-4 hover:border-rose-500/30 transition-all flex flex-col justify-between group relative"
                      >
                        <div className="text-[10px] font-mono text-neutral-500 mb-2 uppercase tracking-wider">
                          Wariant Omega #{idx + 1}
                        </div>
                        <p className="text-xs text-neutral-200 leading-relaxed font-medium mb-4 italic pr-6 h-12 overflow-y-auto">
                          "{h}"
                        </p>
                        <div className="flex flex-col gap-2 w-full">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(h, idx)}
                            className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-neutral-950 hover:bg-rose-950/20 border border-neutral-800 hover:border-rose-500/40 rounded text-[11px] font-mono uppercase text-neutral-400 hover:text-rose-400 transition-all"
                          >
                            {copiedIndex === idx ? (
                              <>
                                <Check size={12} className="text-green-400" />
                                Skopiowano!
                              </>
                            ) : (
                              <>
                                <Clipboard size={12} />
                                Kopiuj Hook
                              </>
                            )}
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleGenerateVslFromHook(h)}
                            className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-rose-950/50 hover:bg-rose-900/60 border border-rose-900/40 hover:border-rose-500/80 rounded text-[11px] font-mono uppercase text-rose-300 hover:text-white transition-all font-semibold animate-pulse"
                          >
                            <Video size={12} />
                            Generuj Skrypt VSL
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="bg-neutral-950/80 border border-neutral-800 border-dashed rounded-xl p-12 text-center text-neutral-500 font-mono text-sm max-w-xl mx-auto">
                <BrainCircuit className="mx-auto text-neutral-700 w-12 h-12 mb-3" />
                <p className="font-bold text-neutral-400 mb-1">
                  Oczekiwanie na definicję bodźca...
                </p>
                <p className="text-xs leading-relaxed max-w-sm mx-auto">
                  Wprowadź swój testowy haczyk w formularzu po lewej, a zaawansowany procesor psychologii Omega przeprowadzi symulację.
                </p>
              </div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
}
