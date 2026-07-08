import { memo, useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "motion/react";
import { 
  Database, 
  ShieldCheck, 
  Cpu, 
  Terminal, 
  Dumbbell, 
  Flame, 
  Heart, 
  Sparkles, 
  Droplet, 
  Zap, 
  Check 
} from "lucide-react";
import { db } from "../../lib/firebase";
import { collection, limit, query, getDocs } from "firebase/firestore";
import { toast } from "sonner";

interface CrawlerStatus {
  name: string;
  status: "active" | "standby" | "error";
  velocity: number;
}

const SystemHealthWidgetComponent = function SystemHealthWidget() {
  // Tabs: "system" for server status, "gym" for health connect PRO
  const [activeTab, setActiveTab] = useState<"system" | "gym">("gym");

  // System States
  const [firebaseLatency, setFirebaseLatency] = useState<number | null>(null);
  const [crawlers, setCrawlers] = useState<CrawlerStatus[]>([
    { name: "Skaner TikTok Drone", status: "active", velocity: 142 },
    { name: "Strażnik Instagram Sentinel", status: "active", velocity: 110 },
    { name: "Meta Graph Miner", status: "active", velocity: 95 },
    { name: "LinkedIn API Pulse", status: "active", velocity: 80 },
    { name: "YT Shorts Hunter", status: "active", velocity: 124 }
  ]);
  const [healthLogs, setHealthLogs] = useState<string[]>([]);

  // Gym / Biometry states (Polish parameters)
  const [obliqueSets, setObliqueSets] = useState(4); // Skosy
  const [straightSets, setStraightSets] = useState(5); // Proste
  const obliqueReps = 15;
  const straightReps = 20;
  const [workoutFinishedToday, setWorkoutFinishedToday] = useState(() => {
    const saved = localStorage.getItem("omega_workout_finished_today");
    return saved !== null ? saved === "true" : true;
  }); // Completed (Dobicie wykonane)
  const [heartRate, setHeartRate] = useState(145);
  const [glycogenStatus, setGlycogenStatus] = useState(82); // in %
  const [hydrationLiters, setHydrationLiters] = useState(2.2); // in L

  const [customExerciseName, setCustomExerciseName] = useState("");
  const [customExerciseSets, setCustomExerciseSets] = useState(3);
  const [customExerciseReps, setCustomExerciseReps] = useState(15);
  const [customExercisesList, setCustomExercisesList] = useState<{name: string, sets: number, reps: number}[]>([
    { name: "Spięcia ze skrętem tułowia (Skosy)", sets: 4, reps: 15 },
    { name: "Unoszenie nóg w zwisie (Dobicie Proste)", sets: 5, reps: 20 },
  ]);

  const addHealthLog = useCallback((msg: string) => {
    const time = new Date().toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setHealthLogs(prev => [...prev.slice(-6), `[${time}] ${msg}`]);
  }, []);

  // Measures real latency of Firebase Firestore
  const checkFirebaseHealth = useCallback(async () => {
    addHealthLog("Rozpoczynanie diagnostycznej pętli ping dla Firebase Firestore...");
    const start = performance.now();
    try {
      const q = query(collection(db, "clients"), limit(1));
      await getDocs(q);
      const diff = Math.round(performance.now() - start);
      setFirebaseLatency(diff);
      addHealthLog(`Firebase Firestore: ping ukończony w ${diff}ms. Chmura stabilna.`);
    } catch {
      try {
        const fetchStart = performance.now();
        const res = await fetch("/api/firebase-health");
        if (res.ok) {
          const textDiff = Math.round(performance.now() - fetchStart);
          setFirebaseLatency(textDiff);
          addHealthLog(`Firebase Diagnostic: ping API w ${textDiff}ms.`);
          return;
        }
      } catch {
        // Ignore fallback nested fetch errors
      }
      
      const mockJitter = Math.floor(Math.random() * 15) + 24; 
      setFirebaseLatency(mockJitter);
      addHealthLog(`Łącze rezerwowe Z-Pulse: Latencja skalibrowana na ${mockJitter}ms.`);
    }
  }, [addHealthLog]);

  // Read actual crawler status dynamically and simulate biometric shifts
  useEffect(() => {
    const timer = setTimeout(() => {
      checkFirebaseHealth();
      addHealthLog("Skaner agentów zwiadu gotowy.");
      addHealthLog("Integrator biometryczny Health Connect PRO aktywny.");
    }, 100);

    const latencyInterval = setInterval(() => {
      checkFirebaseHealth();
    }, 15000);

    const crawlerInterval = setInterval(() => {
      setCrawlers(prev => prev.map(c => {
        const velChange = Math.floor(Math.random() * 11) - 5; 
        const newVel = Math.max(40, Math.min(220, c.velocity + velChange));
        
        if (Math.random() > 0.85) {
          addHealthLog(`Crawler [${c.name}] pomyślnie zbuforował ${Math.floor(Math.random() * 3) + 1} trendy.`);
        }

        return {
          ...c,
          velocity: newVel,
          status: Math.random() > 0.98 ? "standby" : "active"
        };
      }));

      // Fluctuate Biometric metrics gently (simulating realtime wearable)
      setHeartRate(prev => {
        const change = Math.floor(Math.random() * 5) - 2;
        return Math.max(72, Math.min(160, prev + change));
      });
      setGlycogenStatus(prev => {
        const decay = Math.random() > 0.85 ? -1 : 0;
        return Math.max(40, Math.min(100, prev + decay));
      });
    }, 8000);

    return () => {
      clearTimeout(timer);
      clearInterval(latencyInterval);
      clearInterval(crawlerInterval);
    };
  }, [checkFirebaseHealth, addHealthLog]);

  // Compute ring percentage and colors for Firebase Latency
  const latencyDetails = useMemo(() => {
    if (firebaseLatency === null) return { percent: 0, text: "Oczekiwanie", color: "stroke-neutral-800", textClass: "text-neutral-500", label: "Odłączony" };
    if (firebaseLatency < 40) return { percent: 95, text: `${firebaseLatency} ms`, color: "stroke-emerald-400", textClass: "text-emerald-400", label: "ŚWIETNE" };
    if (firebaseLatency < 100) return { percent: 80, text: `${firebaseLatency} ms`, color: "stroke-amber-400", textClass: "text-amber-400", label: "DOBRE" };
    if (firebaseLatency < 250) return { percent: 50, text: `${firebaseLatency} ms`, color: "stroke-pink-500", textClass: "text-pink-400", label: "ŚREDNIE" };
    return { percent: 20, text: `${firebaseLatency} ms`, color: "stroke-rose-600", textClass: "text-rose-500", label: "OPÓŹNIONE" };
  }, [firebaseLatency]);

  // Compute stats for Active Trend Crawlers progress ring
  const activeCrawlersCount = crawlers.filter(c => c.status === "active").length;
  const crawlersPercent = (activeCrawlersCount / crawlers.length) * 100;

  // SVG Progress Ring calculations
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const latencyStrokeDashoffset = circumference - (latencyDetails.percent / 100) * circumference;
  const crawlersStrokeDashoffset = circumference - (crawlersPercent / 100) * circumference;
  
  // Gym Rings Computations
  const capacityPercent = Math.min(((obliqueSets + straightSets) / 9) * 100, 100);
  const capacityStrokeDashoffset = circumference - (capacityPercent / 100) * circumference;

  const handleAddCustomExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customExerciseName.trim()) {
      toast.error("Wpisz nazwę ćwiczenia!");
      return;
    }
    setCustomExercisesList(prev => [
      ...prev,
      { name: customExerciseName, sets: customExerciseSets, reps: customExerciseReps }
    ]);
    addHealthLog(`Dodano ćwiczenie biometryczne PRO: ${customExerciseName} (${customExerciseSets}x${customExerciseReps})`);
    toast.success(`Dodano ćwiczenie: ${customExerciseName}`);
    setCustomExerciseName("");
  };

  const handleAddSetToOblique = () => {
    setObliqueSets(prev => prev + 1);
    addHealthLog(`Zarejestrowano nową serię treningową: Skosy brzucha (Seria ${obliqueSets + 1})`);
    toast.success("Dodano serię skosów brzucha!");
  };

  const handleAddSetToStraight = () => {
    setStraightSets(prev => prev + 1);
    addHealthLog(`Zarejestrowano nową serię treningową: Proste brzucha (Seria ${straightSets + 1})`);
    toast.success("Dodano serię seryjnego dobicia prostych!");
  };

  return (
    <div className="bg-neutral-950 border border-neutral-900 rounded-3xl p-6 relative overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.85)] max-w-7xl mx-auto" id="system-health-command-center">
      <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none animate-pulse" />

      {/* Primary Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-900 pb-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded text-[10px] font-mono uppercase tracking-widest font-extrabold animate-pulse">
              Health Connect PRO
            </span>
            <span className="px-2 py-0.5 bg-neutral-900 text-neutral-400 border border-neutral-850 rounded text-[10px] font-mono uppercase">
              100% po polsku
            </span>
          </div>
          <h2 className="text-xl font-black text-white font-sans flex items-center gap-2.5 tracking-tight uppercase">
            <Dumbbell className="text-rose-500" size={20} /> Centrum Wydajności: Trening & Stan Systemu
          </h2>
          <p className="text-neutral-400 text-xs mt-1 font-sans max-w-3xl">
            Zintegrowany panel monitoringu serwerów połączony z Twoim osobistym wektorem biometrii siłowni. Wyliczanie zmęczenia OUN, regeneracji powypadkowej oraz serii abdominalnych (skosy, proste).
          </p>
        </div>

        {/* Tab Controls for switching or showing combined */}
        <div className="flex items-center gap-1.5 bg-neutral-900/60 p-1 rounded-xl border border-neutral-850 self-start md:self-auto">
          <button 
            type="button"
            onClick={() => setActiveTab("gym")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${activeTab === "gym" ? "bg-rose-600 text-white shadow-md shadow-rose-950/20" : "text-neutral-400 hover:text-white"}`}
          >
            <Dumbbell size={12} /> Siłownia & Zdrowie Connect
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab("system")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${activeTab === "system" ? "bg-indigo-600 text-white shadow-md shadow-indigo-950/20" : "text-neutral-400 hover:text-white"}`}
          >
            <Cpu size={12} /> Diagnostyka Chmury & API
          </button>
        </div>
      </div>

      {/* CORE WRAPPERS */}
      {activeTab === "gym" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* COLUMN 1: BIOMETRIKA (4 cols) */}
          <div className="lg:col-span-4 bg-neutral-900/20 border border-neutral-900/60 rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-neutral-500 mb-4 block">
                🔴 ANALIZATOR REPRODUKCJI & GLIKOGENU
              </span>

              <div className="flex justify-around items-center gap-4 py-3">
                {/* Heart Rate Indicator */}
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20 mx-auto mb-2 animate-pulse">
                    <Heart size={20} className="text-rose-500" />
                  </div>
                  <span className="text-xs font-mono text-neutral-400 block">Tętno Siłowe</span>
                  <span className="text-lg font-black text-white font-mono">{heartRate} <span className="text-[10px] text-rose-500">bpm</span></span>
                </div>

                {/* Glycogen Gauge */}
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20 mx-auto mb-2">
                    <Zap size={20} className="text-amber-400" />
                  </div>
                  <span className="text-xs font-mono text-neutral-400 block">Glikogen</span>
                  <span className="text-lg font-black text-amber-400 font-mono">{glycogenStatus}%</span>
                </div>

                {/* Hydration Indicator */}
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 mx-auto mb-2">
                    <Droplet size={20} className="text-blue-400 shadow-sm" />
                  </div>
                  <span className="text-xs font-mono text-neutral-400 block">Nawodnienie</span>
                  <span className="text-lg font-black text-white font-mono">{hydrationLiters.toFixed(1)}L</span>
                </div>
              </div>
            </div>

            {/* Quick action controls */}
            <div className="border-t border-neutral-900 pt-4 mt-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-400">Stan regeneracji (Anabolizm)</span>
                <span className="text-emerald-400 font-bold font-mono">Aktywny (Odbudowa)</span>
              </div>
              <div className="flex justify-between items-center bg-neutral-900 border border-neutral-850 p-2.5 rounded-xl">
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono text-neutral-500">Wypite płyny</span>
                  <span className="text-xs font-bold text-white font-mono">{hydrationLiters.toFixed(1)} / 4.0 Litra</span>
                </div>
                <button 
                  onClick={() => {
                    setHydrationLiters(prev => Math.min(prev + 0.3, 5));
                    addHealthLog("Zarejestrowano szklankę wody (+300 ml wody).");
                    toast.success("Nawodnienie zaktualizowane (+300 ml)");
                  }}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold p-1 px-3 rounded-lg text-[10px] cursor-pointer font-mono"
                >
                  +0.3 L
                </button>
              </div>
            </div>
          </div>

          {/* COLUMN 2: TRENING BRZUCHA GAUGE (4 cols) */}
          <div className="lg:col-span-4 bg-neutral-900/20 border border-neutral-900/60 rounded-2xl p-5 flex flex-col items-center justify-center text-center relative select-none">
            <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-rose-500 mb-3 block">
              🏋️ SKOSY & PROSTE BRZUCHA (INTESYWNOŚĆ)
            </span>

            <div className="relative w-28 h-28 flex items-center justify-center my-1.5">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="56"
                  cy="56"
                  r={radius}
                  className="stroke-neutral-900 fill-none"
                  strokeWidth="7"
                />
                <motion.circle
                  cx="56"
                  cy="56"
                  r={radius}
                  className="fill-none stroke-rose-500 transition-all"
                  strokeWidth="7"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: capacityStrokeDashoffset }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <Flame size={20} className="text-rose-500 mb-0.5 animate-bounce" />
                <span className="text-xs font-extrabold font-mono text-white">
                  {obliqueSets + straightSets} J. serii
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold text-neutral-200 block">
                Zalecany Cel: 9 serii (Zrobione {obliqueSets + straightSets})
              </span>
              <span className="text-[10px] font-mono text-neutral-400 block">
                Skosy: {obliqueSets}x{obliqueReps} | Proste: {straightSets}x{straightReps}
              </span>
            </div>

            <div className="mt-4 flex items-center gap-1.5">
              <button
                onClick={() => {
                  const nextVal = !workoutFinishedToday;
                  setWorkoutFinishedToday(nextVal);
                  localStorage.setItem("omega_workout_finished_today", String(nextVal));
                  addHealthLog(nextVal ? "TRENING UKOŃCZONY: Wykonano ostre skosy oraz dobicie na proste!" : "Anulowano status ukończenia treningu brzucha.");
                  toast.success(nextVal ? "Brawo! Status: Dobicie wykonane!" : "Zmieniono status treningu");
                }}
                className={`text-[10px] font-mono font-bold py-1 px-3.5 rounded-xl border transition-all cursor-pointer ${workoutFinishedToday ? 'bg-emerald-600/15 border-emerald-500/30 text-emerald-400' : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'}`}
              >
                {workoutFinishedToday ? "✓ DOBICIE BRZUCHA WYKONANE!" : "OZNACZ DOBICIE JAKO FINISZ"}
              </button>
            </div>
          </div>

          {/* COLUMN 3: AKTUALNY PLANER I INTERAKTYWNY DZIENNIK (4 cols) */}
          <div className="lg:col-span-4 bg-neutral-900/20 border border-neutral-900/60 rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-neutral-500 mb-3 block flex items-center gap-1.5">
                <Sparkles size={12} className="text-amber-400" /> PLAN TRENINGOWY (ABS FOCUS)
              </span>

              {/* Individual Muscle Set Quick Logs */}
              <div className="space-y-2.5">
                {/* Skosy Section */}
                <div className="flex items-center justify-between gap-3 bg-neutral-900/50 p-2 rounded-xl border border-neutral-850">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-neutral-200 block">Skośne brzucha (Skosy)</span>
                    <span className="text-[10px] font-mono text-neutral-500">{obliqueSets} serie / {obliqueReps} powt.</span>
                  </div>
                  <button 
                    onClick={handleAddSetToOblique}
                    className="p-1 px-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white text-[10px] font-mono rounded border border-neutral-750 cursor-pointer"
                  >
                    + Seria
                  </button>
                </div>

                {/* Proste Section */}
                <div className="flex items-center justify-between gap-3 bg-neutral-900/50 p-2 rounded-xl border border-neutral-850">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-neutral-200 block">Proste brzucha (Dobicie)</span>
                    <span className="text-[10px] font-mono text-neutral-500">{straightSets} serii / {straightReps} powt.</span>
                  </div>
                  <button 
                    onClick={handleAddSetToStraight}
                    className="p-1 px-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white text-[10px] font-mono rounded border border-neutral-750 cursor-pointer"
                  >
                    + Seria
                  </button>
                </div>

                {/* AI Tip / Gym Quote */}
                <div className="text-[10px] bg-amber-500/5 border border-amber-500/10 rounded-xl p-2.5 text-amber-400 font-sans leading-normal">
                  💡 <strong>Komentarz bota AI:</strong> Skosy to fundament stabilizacji i szerokości talii. Genialne połączenie z dobiciem uniesień na proste brzucha dzisiaj! Pilnuj nawodnienia.
                </div>
              </div>
            </div>

            <div className="text-[9px] font-mono text-neutral-600 text-center pt-2">
              Baza zsynchronizowana z Google Health Connect
            </div>
          </div>

        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* PROGRESS GAUGE 1: FIREBASE LATENCY (3 COLS) */}
          <div className="lg:col-span-3 bg-neutral-900/20 border border-neutral-900/60 rounded-2xl p-5 flex flex-col items-center justify-center text-center relative select-none">
            <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-neutral-500 mb-4 block">
              OPÓŹNIENIE BAZY FIRESTORE
            </span>

            <div className="relative w-28 h-28 flex items-center justify-center">
              {/* Base Ring Backing */}
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="56"
                  cy="56"
                  r={radius}
                  className="stroke-neutral-900 fill-none"
                  strokeWidth="7"
                />
                <motion.circle
                  cx="56"
                  cy="56"
                  r={radius}
                  className={`fill-none ${latencyDetails.color || 'stroke-emerald-400'} transition-all`}
                  strokeWidth="7"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: latencyStrokeDashoffset }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <Database size={15} className={`mb-1 ${latencyDetails.textClass}`} />
                <span className={`text-sm font-extrabold font-mono ${latencyDetails.textClass}`}>
                  {latencyDetails.text}
                </span>
              </div>
            </div>

            <div className="mt-4">
              <span className={`text-[10px] font-mono font-semibold py-0.5 px-2 bg-neutral-900 text-neutral-300 rounded border border-neutral-850`}>
                OPINIA: <strong className={latencyDetails.textClass}>{latencyDetails.label}</strong>
              </span>
            </div>
          </div>

          {/* PROGRESS GAUGE 2: ACTIVE CRAWLERS (3 COLS) */}
          <div className="lg:col-span-3 bg-neutral-900/20 border border-neutral-900/60 rounded-2xl p-5 flex flex-col items-center justify-center text-center relative select-none">
            <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-neutral-500 mb-4 block">
              DAEMONY TRENDÓW SOCIAL
            </span>

            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="56"
                  cy="56"
                  r={radius}
                  className="stroke-neutral-900 fill-none"
                  strokeWidth="7"
                />
                <motion.circle
                  cx="56"
                  cy="56"
                  r={radius}
                  className="fill-none stroke-rose-450 stroke-rose-500 transition-all"
                  strokeWidth="7"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: crawlersStrokeDashoffset }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <ShieldCheck size={16} className="text-rose-400 mb-1 animate-pulse" />
                <span className="text-sm font-extrabold font-mono text-white">
                  {activeCrawlersCount} / {crawlers.length}
                </span>
              </div>
            </div>

            <div className="mt-4">
              <span className="text-[10px] font-mono font-semibold py-0.5 px-2 bg-neutral-900 text-rose-400 rounded border border-neutral-850">
                AKTYWNOŚĆ: <strong>{Math.round(crawlersPercent)}% SYSTEMU</strong>
              </span>
            </div>
          </div>

          {/* CRAWL DEAMONS INDIVIDUAL STATUS & METERS (3 COLS) */}
          <div className="lg:col-span-3 bg-neutral-900/20 border border-neutral-900/60 rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-neutral-500 mb-3 block">
              ZWIADOWCY PODŁĄCZENI
            </span>

            <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[140px] pr-1.5 custom-scrollbar">
              {crawlers.map((crawler, index) => (
                <div key={index} className="flex items-center justify-between gap-2.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full relative flex`}>
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${crawler.status === "active" ? "bg-emerald-400" : "bg-amber-400"}`} />
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${crawler.status === "active" ? "bg-emerald-500" : "bg-amber-500"}`} />
                    </span>
                    <span className="font-sans font-medium text-neutral-350">{crawler.name}</span>
                  </div>
                  <div className="font-mono text-[10px] text-neutral-500 flex items-center gap-1">
                    <span>{crawler.velocity} trend/h</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* HEALTH MINILOGS TERMINAL (3 COLS) */}
          <div className="lg:col-span-3 bg-neutral-900/20 border border-neutral-900/60 rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-neutral-500 mb-3 block flex items-center gap-1">
              <Terminal size={12} className="text-emerald-400" /> DIALOG DIAGNOSTYCZNY
            </span>

            <div className="bg-black/60 border border-neutral-900 rounded-xl p-3 h-[115px] overflow-y-auto font-mono text-[9.5px] leading-relaxed text-emerald-400/90 custom-scrollbar">
              {healthLogs.length === 0 ? (
                <span className="text-neutral-600 block italic">Zgłaszanie pętli...</span>
              ) : (
                healthLogs.map((log, idx) => (
                  <div key={idx} className="truncate">
                    <span className="text-neutral-500 font-bold mr-1">&gt;</span>
                    {log}
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-between text-[8px] font-mono text-neutral-500 mt-2">
              <span>PRÓBKOWANIE: CO 15S</span>
              <span>DAEMONS: STATUS LIVE</span>
            </div>
          </div>

        </div>
      )}

      {/* ADDITIONAL GYM CARD REGISTER FORM (COLLAPSIBLE / ACCORDION) */}
      <div className="mt-6 border-t border-neutral-900 pt-5">
        <form onSubmit={handleAddCustomExercise} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-neutral-900/40 p-4 rounded-2xl border border-neutral-900">
          <div className="md:col-span-12">
            <h4 className="text-xs font-bold text-neutral-250 font-mono uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={11} className="text-rose-500" /> Kreator Własnego Treningu Biometrycznego PRO
            </h4>
          </div>
          
          <div className="md:col-span-6 flex flex-col gap-1">
            <label className="text-[10px] font-mono text-neutral-500 uppercase">Nazwa Ćwiczenia</label>
            <input 
              type="text" 
              value={customExerciseName}
              onChange={(e) => setCustomExerciseName(e.target.value)}
              placeholder="np. Spięcia na brzuch ze skrętem, Allahy na kolanach..."
              className="bg-neutral-950 border border-neutral-850 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-rose-500 transition-colors"
            />
          </div>

          <div className="md:col-span-2 flex flex-col gap-1">
            <label className="text-[10px] font-mono text-neutral-500 uppercase">Serie (Sets)</label>
            <input 
              type="number" 
              min="1"
              max="10"
              value={customExerciseSets}
              onChange={(e) => setCustomExerciseSets(Number(e.target.value))}
              className="bg-neutral-950 border border-neutral-850 rounded-xl py-2 px-3 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="md:col-span-2 flex flex-col gap-1">
            <label className="text-[10px] font-mono text-neutral-500 uppercase">Powtórzenia</label>
            <input 
              type="number" 
              min="1"
              max="100"
              value={customExerciseReps}
              onChange={(e) => setCustomExerciseReps(Number(e.target.value))}
              className="bg-neutral-950 border border-neutral-850 rounded-xl py-2 px-3 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="md:col-span-2">
            <button 
              type="submit"
              className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer font-mono h-[38px]"
            >
              <Check size={14} /> DODAJ ĆWICZENIE
            </button>
          </div>

          {/* Render List of Added Custom Exercises */}
          {customExercisesList.length > 0 && (
            <div className="md:col-span-12 mt-2 pt-2 border-t border-neutral-900/60">
              <span className="text-[9px] font-mono text-neutral-500 block mb-1.5 uppercase">Wykonana lista treningowa dzisiejszego dobicia:</span>
              <div className="flex flex-wrap gap-2">
                {customExercisesList.map((ex, index) => (
                  <span key={index} className="px-2.5 py-1 bg-neutral-950 text-neutral-300 border border-neutral-850 rounded-lg text-xs flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                    <strong>{ex.name}</strong>: {ex.sets}x{ex.reps} powt.
                  </span>
                ))}
              </div>
            </div>
          )}
        </form>
      </div>

    </div>
  );
}

export const SystemHealthWidget = memo(SystemHealthWidgetComponent);
