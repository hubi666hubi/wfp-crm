import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import {
  Banknote, TrendingUp, Zap, Clock, Terminal, Activity, ArrowUpRight, DollarSign, Database
} from 'lucide-react';
import { toast } from 'sonner';

// WFP Initial Financial Seed Data
const initialChartData = [
  { time: '08:00', volume: 1200, momentum: 45 },
  { time: '10:00', volume: 2100, momentum: 55 },
  { time: '12:00', volume: 3400, momentum: 80 },
  { time: '14:00', volume: 8500, momentum: 120 },
  { time: '16:00', volume: 7200, momentum: 110 },
  { time: '18:00', volume: 15400, momentum: 210 },
  { time: '20:00', volume: 24500, momentum: 350 }
];

export function ChronoLedger() {
  const [chartData, setChartData] = useState(initialChartData);
  const [logs, setLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Kinetic state for capital
  const [currentMRR, setCurrentMRR] = useState(148500);
  const [velocity, setVelocity] = useState(8.4);
  const [isAccelerating, setIsAccelerating] = useState(false);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit", second: "2-digit", fractionalSecondDigits: 2 });
    setLogs(prev => [...prev.slice(-30), `[${time}] ${msg}`]);
  };

  useEffect(() => {
    addLog("CHRONO LEDGER: Moduł akceleracji strumieni przychodowych zainicjowany.");
    addLog("Nawiązywanie bezpiecznego połączenia z Fakturownia / Make.com...");

    // Symulacja szumu finansowego
    const noiseInterval = setInterval(() => {
      if (Math.random() > 0.7) {
         addLog(`Wykryto mikrozakłócenia w koszyku (Abandoned Cart) - Agent OMEGA koryguje strumień...`);
      }
    }, 8000);
    return () => clearInterval(noiseInterval);
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const forceChronoAccel = () => {
    if (isAccelerating) return;
    setIsAccelerating(true);
    addLog("WARNING: Aktywacja funkcji FORCE CHRONO-ACCEL. Otwieram przepustnicę kapitalizacji...");
    toast.success("CHRONO-ACCEL ZAINICJOWANY! Agenci wywierają presję na Pipeline.");

    let cycles = 0;
    const accelInterval = setInterval(() => {
      cycles++;

      // Dodawanie piku na wykresie
      setChartData(prev => {
        const newData = [...prev];
        const lastVol = newData[newData.length - 1].volume;
        newData.push({
          time: new Date().toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" }),
          volume: lastVol + Math.floor(Math.random() * 4000) + 1000,
          momentum: Math.floor(Math.random() * 300) + 200
        });
        if (newData.length > 10) newData.shift();
        return newData;
      });

      // Zwiekszanie wartosci
      setCurrentMRR(prev => prev + Math.floor(Math.random() * 2500) + 500);
      setVelocity(prev => +(prev + 1.2).toFixed(1));

      addLog(`CHRONO-CYCLE #${cycles}: Rejestracja nowego zamknięcia w pipeline. Przepustowość +1.2x`);

      if (cycles >= 5) {
        clearInterval(accelInterval);
        setIsAccelerating(false);
        addLog("SYSTEM: Stabilizacja strumieni. Akceleracja zakończona pomyślnie. Wskaźniki nadpisane.");
      }
    }, 1500);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 text-neutral-200 font-sans">

      {/* HEADER: KOD-MUTANT B2B CAPITAL */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-emerald-500/30 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3 font-mono">
            <Database className="text-emerald-500 w-10 h-10 animate-pulse drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
            CHRONO LEDGER
          </h1>
          <p className="mt-2 text-emerald-500/80 font-mono text-sm tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            TRANSACTION ACCELERATION & CAPITAL KINETICS
          </p>
        </div>

        <button
          onClick={forceChronoAccel}
          disabled={isAccelerating}
          className="px-6 py-3 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/50 text-emerald-400 font-mono font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.15)] disabled:opacity-50 cursor-pointer"
        >
          {isAccelerating ? <Activity size={16} className="animate-spin" /> : <Zap size={16} />}
          {isAccelerating ? "AKCELERACJA W TOKU..." : "FORCE CHRONO-ACCEL"}
        </button>
      </div>

      {/* DASHBOARD GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* KPI WIDGETS */}
        <div className="xl:col-span-3 flex flex-col gap-4">
          <div className="bg-black/60 border border-emerald-900/50 rounded-3xl p-6 relative overflow-hidden backdrop-blur-md">
             <div className="absolute top-0 right-0 p-4 opacity-5">
               <DollarSign size={80} className="text-emerald-500" />
             </div>
             <span className="text-[10px] text-emerald-500/70 font-mono block mb-2 uppercase tracking-widest">Globalny Wolumen MRR</span>
             <div className="flex items-baseline gap-2">
               <span className="text-4xl font-black text-white font-mono">{currentMRR.toLocaleString('pl-PL')}</span>
               <span className="text-xs text-neutral-500 font-mono">PLN</span>
             </div>
             <div className="mt-4 flex items-center gap-2 text-xs font-mono text-emerald-400">
               <ArrowUpRight size={14} /> +24% od ostatniego skanu
             </div>
          </div>

          <div className="bg-black/60 border border-neutral-800 rounded-3xl p-6 relative overflow-hidden backdrop-blur-md">
             <div className="absolute top-0 right-0 p-4 opacity-5">
               <TrendingUp size={80} className="text-amber-500" />
             </div>
             <span className="text-[10px] text-neutral-500 font-mono block mb-2 uppercase tracking-widest">Transaction Velocity</span>
             <div className="flex items-baseline gap-2">
               <span className="text-4xl font-black text-amber-400 font-mono">{velocity.toFixed(1)}x</span>
             </div>
             <div className="mt-4 flex items-center gap-2 text-xs font-mono text-neutral-400">
               Mnożnik momentum w lejku
             </div>
          </div>
        </div>

        {/* RECHARTS TRAJECTORY GRAPH */}
        <div className="xl:col-span-6 bg-black/40 border border-neutral-900 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-bold text-neutral-400 flex items-center gap-2 font-mono tracking-widest uppercase">
              <Activity size={16} className="text-emerald-500" />
              Trajektoria Dopływu Kapitału
            </h2>
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-emerald-950/30 text-emerald-500 text-[9px] font-mono border border-emerald-500/20 rounded">
                LIVE
              </span>
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis dataKey="time" stroke="#525252" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#525252" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v/1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#10b981', borderRadius: '12px' }}
                  itemStyle={{ color: '#10b981', fontFamily: 'monospace' }}
                  labelStyle={{ color: '#737373', fontFamily: 'monospace', marginBottom: '4px' }}
                />
                <Area
                  type="monotone"
                  dataKey="volume"
                  stroke="#10b981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorVolume)"
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* MATRIX KERNEL LOGS */}
        <div className="xl:col-span-3 bg-black/80 border border-emerald-900/30 rounded-3xl p-5 flex flex-col h-[400px] xl:h-auto">
          <div className="flex items-center justify-between mb-4 border-b border-emerald-900/30 pb-3">
            <div className="flex items-center gap-2">
              <Terminal size={16} className="text-emerald-500" />
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
                Ledger Sync Log
              </span>
            </div>
            <Clock size={14} className="text-emerald-500/50" />
          </div>

          <div className="flex-1 overflow-y-auto font-mono text-[10px] leading-relaxed text-emerald-300/80 custom-scrollbar pr-2 space-y-2">
            {logs.map((log, index) => (
              <motion.div
                initial={{ opacity: 0, x: 5 }}
                animate={{ opacity: 1, x: 0 }}
                key={index}
                className="border-l-2 border-emerald-500/30 pl-2"
              >
                {log}
              </motion.div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>

      </div>
    </div>
  );
}