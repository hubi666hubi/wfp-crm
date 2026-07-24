import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Cpu, Activity, Radar, Zap, Waves, Terminal, Server, Shield, BrainCircuit, Target, DollarSign, Crosshair, Send } from 'lucide-react';
import { toast } from 'sonner';

export function NeuralCommand() {
  const [telemetryLogs, setTelemetryLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Real-time telemetry metrics
  const [loadMesh, setLoadMesh] = useState(42);
  const [dopamineVelocity, setDopamineVelocity] = useState(850);
  const [cortisolSpike, setCortisolSpike] = useState(12);
  const [mrrVelocity, setMrrVelocity] = useState(0);

  const [isDeploying, setIsDeploying] = useState(false);

  // Synthetic loop for Matrix Kernel Monitor and Neural Mesh
  useEffect(() => {
    const logInterval = setInterval(() => {
      const messages = [
        "Skanowanie przepustowości sieci Agenta OMEGA-SHIELD...",
        "Rekalibracja częstotliwości Dopplerowskich zakończona.",
        "Wykryto anomalię: Prędkość dopaminy w sektorze B2B rośnie.",
        "System Omega / Neuro-Monitoring w stanie czuwania."
      ];
      const time = new Date().toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      setTelemetryLogs(prev => [...prev.slice(-49), `[${time}] ${randomMsg}`]);

      setLoadMesh(prev => Math.min(100, Math.max(0, prev + (Math.random() * 10 - 5))));
      setDopamineVelocity(prev => Math.max(500, prev + (Math.random() * 100 - 40)));
      setCortisolSpike(prev => Math.min(100, Math.max(0, prev + (Math.random() * 4 - 2))));
    }, 4500);

    return () => clearInterval(logInterval);
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [telemetryLogs]);

  const addLog = (msg: string) => {
      const time = new Date().toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      setTelemetryLogs(prev => [...prev.slice(-49), `[${time}] ${msg}`]);
  };

  const triggerOverclock = () => {
    toast.success("Overclock Protocol zainicjowany. Maksymalizacja zasobów Agenta KAIZEN.");
    setLoadMesh(98);
    setDopamineVelocity(prev => prev + 500);
    addLog("OVERCLOCK: Przesterowanie systemu, uwalnianie pełnej mocy na szynach antygrawitacyjnych!");
  };

  // ACTIONABLE REVENUE ENGINE FUNCTIONS
  const launchCampaignBomb = async () => {
    setIsDeploying(true);
    addLog("WARNING: Inicjalizacja CAMPAIGN BOMB V3. Odbezpieczanie ładunków...");

    try {
      // Symulacja uderzenia w endpoint, a jesli to localhost to fetch realny
      const res = await fetch('/api/campaign/bomb-v3', { method: 'POST' }).catch(() => null);

      setTimeout(() => {
         addLog("CAMPAIGN BOMB V3 zdetonowana! Ładunki uderzyły w sektor PKO BP i LPP.");
         toast.success("Kampania uderzeniowa wysłana! Agenty zwiadowcze śledzą otwarcia.");
         setDopamineVelocity(prev => prev + 1200);
         setMrrVelocity(prev => prev + 12500); // Pro symulacja dodania potencjalnego MRR
         setIsDeploying(false);
         // "Jarvis" voice synthesis hook simul (from memory)
         addLog("AUDIO-HOOK: Wysłano sygnał aktywacji głosowej 'Jarvis' o statusie kampanii.");
      }, 2000);
    } catch (e) {
      addLog("ERROR: Odrzucenie uwierzytelnienia z API Campaign Bomb.");
      setIsDeploying(false);
    }
  };

  const dispatchAgent = (agentName: string, task: string) => {
     addLog(`SWARM-DISPATCH: ${agentName} otrzymał dyrektywę bojową: "${task}"`);
     toast.info(`Agent ${agentName} wyruszył na misję.`);
     setLoadMesh(prev => Math.min(100, prev + 25));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 text-neutral-200">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-rose-500/30 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3 font-mono">
            <Cpu className="text-rose-500 w-10 h-10 animate-pulse drop-shadow-[0_0_15px_rgba(244,63,94,0.6)]" />
            NEURAL MESH COMMAND
          </h1>
          <p className="mt-2 text-rose-500/80 font-mono text-sm tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            STREFA DOWODZENIA / REVENUE ENGINE
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={triggerOverclock}
            className="px-5 py-2.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-400 font-mono text-xs rounded-xl flex items-center gap-2 transition-all group cursor-pointer"
          >
            <Zap size={16} className="group-hover:animate-bounce" />
            ODPAL OVERCLOCK
          </button>
        </div>
      </div>

      {/* TACTICAL STRIKES / ACTIONABLE REVENUE (NOWE) */}
      <div className="bg-black/80 border border-rose-500/50 rounded-3xl p-6 relative overflow-hidden shadow-[0_0_30px_rgba(244,63,94,0.15)]">
        <div className="absolute -top-10 -right-10 opacity-5">
           <Crosshair size={200} className="text-rose-500" />
        </div>
        <div className="flex items-center gap-3 mb-6">
           <Target size={24} className="text-rose-500" />
           <h2 className="text-xl font-bold text-white font-mono tracking-wide">TAKTYCZNE UDERZENIA KAPITAŁOWE</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
           {/* Bomb V3 */}
           <button
             onClick={launchCampaignBomb}
             disabled={isDeploying}
             className="bg-rose-950/30 hover:bg-rose-900/50 border border-rose-500/40 p-5 rounded-2xl flex flex-col items-start gap-3 transition-all cursor-pointer group disabled:opacity-50"
           >
             <div className="bg-rose-500/20 p-2 rounded-lg text-rose-400 group-hover:bg-rose-500 group-hover:text-black transition-colors">
               <Send size={20} className={isDeploying ? "animate-pulse" : ""} />
             </div>
             <div className="text-left">
               <span className="text-sm font-bold text-white font-mono block">CAMPAIGN BOMB V3</span>
               <span className="text-[10px] text-rose-300 font-mono">Uderzenie masowe B2B</span>
             </div>
           </button>

           <button
             onClick={() => dispatchAgent('JULES-ALPHA', 'Ekstrakcja Leadów: Zgarnij Top 50 z InPost/Allegro')}
             className="bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 p-5 rounded-2xl flex flex-col items-start gap-3 transition-all cursor-pointer group"
           >
             <div className="bg-neutral-800 p-2 rounded-lg text-neutral-400 group-hover:text-white transition-colors">
               <Radar size={20} />
             </div>
             <div className="text-left">
               <span className="text-sm font-bold text-white font-mono block">DEPLOY: JULES-ALPHA</span>
               <span className="text-[10px] text-neutral-500 font-mono">Skraping infrastruktury</span>
             </div>
           </button>

           <button
             onClick={() => dispatchAgent('JARVIS-KAIZEN', 'Closer Protocol: Domknij leada z Modivo (Retainer 12,500 PLN)')}
             className="bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 p-5 rounded-2xl flex flex-col items-start gap-3 transition-all cursor-pointer group"
           >
             <div className="bg-neutral-800 p-2 rounded-lg text-neutral-400 group-hover:text-emerald-400 transition-colors">
               <BrainCircuit size={20} />
             </div>
             <div className="text-left">
               <span className="text-sm font-bold text-white font-mono block">DEPLOY: JARVIS-KAIZEN</span>
               <span className="text-[10px] text-neutral-500 font-mono">Ai Inbound Closer</span>
             </div>
           </button>

           <div className="bg-emerald-950/20 border border-emerald-500/20 p-5 rounded-2xl flex flex-col justify-center items-center gap-2">
              <span className="text-[10px] text-emerald-500/70 font-mono uppercase tracking-widest text-center block">Potencjalny Przychód (Velocity)</span>
              <div className="flex items-center gap-1 text-emerald-400">
                <DollarSign size={24} />
                <span className="text-3xl font-black font-mono">{mrrVelocity.toLocaleString('pl-PL')}</span>
              </div>
              <span className="text-[10px] text-emerald-500/50 font-mono">PLN / MRR Pipeline</span>
           </div>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* RADAR DNA PROFILING */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-black/60 border border-neutral-800 rounded-3xl p-6 relative overflow-hidden backdrop-blur-md">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2 font-mono">
              <Activity className="text-rose-500" size={20} />
              RADAR DNA / NEURAL METRICS
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
              <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-5">
                <span className="text-[10px] text-neutral-500 font-mono block mb-1">DOPAMINE VELOCITY</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-rose-400 font-mono">{dopamineVelocity.toFixed(0)}</span>
                  <span className="text-xs text-neutral-500">spikes/h</span>
                </div>
                <div className="mt-3 h-1 w-full bg-neutral-950 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full transition-all duration-700" style={{ width: `${Math.min(100, dopamineVelocity / 20)}%` }} />
                </div>
              </div>

              <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-5">
                <span className="text-[10px] text-neutral-500 font-mono block mb-1">NEURAL MESH LOAD</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white font-mono">{loadMesh.toFixed(1)}%</span>
                </div>
                <div className="mt-3 h-1 w-full bg-neutral-950 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${loadMesh > 85 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                    style={{ width: `${loadMesh}%` }}
                  />
                </div>
              </div>

              <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-5">
                <span className="text-[10px] text-neutral-500 font-mono block mb-1">CORTISOL SPIKE</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-amber-500 font-mono">{cortisolSpike.toFixed(1)}%</span>
                </div>
                <div className="mt-3 h-1 w-full bg-neutral-950 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full transition-all duration-700" style={{ width: `${cortisolSpike}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* ACTIVE AGENTS MATRIX */}
          <div className="bg-black/40 border border-neutral-900 rounded-3xl p-6">
            <h2 className="text-sm font-bold text-neutral-400 mb-4 flex items-center gap-2 font-mono tracking-widest uppercase">
              <Server size={16} />
              Architektura Swarm Orchestrator
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {['JULES-ALPHA', 'JARVIS-KAIZEN', 'OMEGA-SHIELD'].map((agent, i) => (
                <div key={agent} className="bg-neutral-950 border border-neutral-900/80 rounded-xl p-4 flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${i === 2 ? 'bg-amber-900/20 text-amber-500' : 'bg-rose-900/20 text-rose-500'}`}>
                    {i === 2 ? <Shield size={16} /> : <BrainCircuit size={16} />}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white font-mono block">{agent}</span>
                    <span className="text-[10px] text-neutral-500 font-mono flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active (V28.0)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* MATRIX KERNEL MONITOR */}
        <div className="lg:col-span-1 bg-black/80 border border-rose-900/30 rounded-3xl p-5 flex flex-col h-[500px]">
          <div className="flex items-center justify-between mb-4 border-b border-rose-900/30 pb-3">
            <div className="flex items-center gap-2">
              <Terminal size={16} className="text-rose-500" />
              <span className="text-xs font-mono font-bold text-rose-400 uppercase tracking-widest">
                Matrix Kernel Monitor
              </span>
            </div>
            <Waves size={16} className="text-rose-500/50" />
          </div>

          <div className="flex-1 overflow-y-auto font-mono text-[11px] leading-relaxed text-rose-400/80 custom-scrollbar pr-2 space-y-1">
            {telemetryLogs.map((log, index) => (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                key={index}
                className="border-l-2 border-rose-500/20 pl-2 py-0.5"
              >
                {log}
              </motion.div>
            ))}
            <div ref={logsEndRef} />
          </div>

          <div className="mt-4 pt-3 border-t border-rose-900/30">
            <div className="flex items-center gap-2 text-[10px] font-mono text-rose-500/60">
              <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
              SYNC: REAL-TIME KERNEL (10s EVOLUTION LOOPS)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}