import React, { useState, useEffect } from 'react';
import { Bot, Terminal, Activity, ChevronRight, Zap, Target, Cpu, ShieldAlert, Code } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const DocsJules: React.FC = () => {
  const [activeKeyword, setActiveKeyword] = useState<number | null>(null);
  const [simulatedScore, setSimulatedScore] = useState<number | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [targetUrl, setTargetUrl] = useState('');
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    "[SYSTEM] Terminal initialized.",
    "[SYSTEM] Awaiting target payload..."
  ]);

  const keywords = [
    {
      id: 1,
      title: "End-to-end product development platform by Google",
      description: "Jules covers the entire software lifecycle from architecture planning, code generation, to deployment tracking.",
      icon: <Code size={24} className="text-blue-500" />
    },
    {
      id: 2,
      title: "How to optimize product development with Jules",
      description: "Automate repetitive tasks, enforce military-grade code standards, and use AI-driven pre-commit hooks.",
      icon: <Zap size={24} className="text-yellow-500" />
    },
    {
      id: 3,
      title: "Features of Jules agentic product development tool",
      description: "Multi-agent orchestration, real-time matrix recalibration, and continuous integration via SwarmOrchestrator.",
      icon: <Cpu size={24} className="text-emerald-500" />
    },
    {
      id: 4,
      title: "Automating product development processes with Jules",
      description: "Zero-Human-Accounting, automatic deployment pipelines, and intelligent bug resolution protocols.",
      icon: <Activity size={24} className="text-rose-500" />
    },
    {
      id: 5,
      title: "Case studies using Jules in product development",
      description: "OMEGA Core implementation achieving 93% efficiency in CRM deployments and lead scoring algorithms.",
      icon: <Target size={24} className="text-purple-500" />
    }
  ];

  const handleSimulate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUrl) return;

    setIsAnalyzing(true);
    setSimulatedScore(null);
    setConsoleLogs(prev => [...prev, `[SYSTEM] Target Acquired: ${targetUrl}`]);

    setTimeout(() => {
      setConsoleLogs(prev => [...prev, "[SYSTEM] Analyzing repository... OK"]);
      setTimeout(() => {
        setConsoleLogs(prev => [...prev, "[Jules] Auto-generating optimal code block... 100%"]);
        setTimeout(() => {
          setConsoleLogs(prev => [...prev, "[OMEGA CORE] Biometric Lead Score Calculated."]);
          setSimulatedScore(93);
          setIsAnalyzing(false);
        }, 800);
      }, 800);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 p-6 font-sans selection:bg-rose-500/30">

      {/* Hero Section */}
      <section className="relative w-full max-w-6xl mx-auto mb-16 rounded-3xl overflow-hidden border border-neutral-800 bg-neutral-900/50 backdrop-blur-md p-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-neutral-900/50 to-rose-900/10 pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-neutral-950 border border-neutral-800 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(59,130,246,0.15)] relative overflow-hidden">
            <Bot size={40} className="text-blue-500 relative z-10" />
            <div className="absolute inset-0 bg-blue-500/20 animate-pulse" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 text-white">
            Jules Agentic <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-rose-400">Platform</span>
          </h1>
          <p className="text-lg text-neutral-400 max-w-2xl font-mono">
            PROTOCOL APOCALYPSE v2.1 // OMEGA CORE INITIALIZED.
            End-to-end product development platform.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Interactive Keyword Matrix */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-2 text-white">
            <Activity className="text-rose-500" /> Interactive Feature Matrix
          </h2>
          {keywords.map((kw, idx) => (
            <motion.div
              key={kw.id}
              onClick={() => setActiveKeyword(kw.id)}
              className={`p-5 rounded-xl cursor-pointer transition-all border ${
                activeKeyword === kw.id
                ? 'bg-neutral-800 border-rose-500/50 shadow-[0_0_20px_rgba(225,29,72,0.1)]'
                : 'bg-neutral-900/40 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-neutral-950 rounded-lg border border-neutral-800">
                  {kw.icon}
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold text-sm md:text-base transition-colors ${
                    activeKeyword === kw.id ? 'text-white' : 'text-neutral-300'
                  }`}>
                    {kw.title}
                  </h3>
                </div>
                <ChevronRight className={`transition-transform ${activeKeyword === kw.id ? 'rotate-90 text-rose-500' : 'text-neutral-600'}`} />
              </div>
              <AnimatePresence>
                {activeKeyword === kw.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="pt-4 text-sm text-neutral-400 font-mono">
                      {kw.description}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Biometric Lead Score Simulator */}
        <div className="flex flex-col gap-6">
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent opacity-50" />

             <h2 className="text-xl font-bold flex items-center gap-2 mb-6 text-white">
                <ShieldAlert className="text-amber-500" /> Biometric Lead Score
             </h2>

             <form onSubmit={handleSimulate} className="mb-6 flex gap-2">
                <input
                  type="text"
                  placeholder="Wprowadź URL lub ID platformy..."
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-rose-500/50 transition-colors font-mono"
                  disabled={isAnalyzing}
                />
                <button
                  type="submit"
                  disabled={isAnalyzing || !targetUrl}
                  className="bg-white text-black px-6 py-3 rounded-xl font-bold text-sm hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAnalyzing ? 'SKANOWANIE...' : 'URUCHOM'}
                </button>
             </form>

             <div className="bg-black border border-neutral-900 rounded-xl p-4 font-mono text-xs h-48 overflow-y-auto mb-6 flex flex-col gap-2 relative shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
                {consoleLogs.map((log, i) => (
                  <div key={i} className={`${
                    log.includes('SYSTEM') ? 'text-neutral-500' :
                    log.includes('Jules') ? 'text-blue-400' :
                    log.includes('OK') || log.includes('100%') ? 'text-emerald-400' :
                    'text-rose-400'
                  }`}>
                    <span className="text-neutral-700 mr-2">{new Date().toISOString().split('T')[1].substring(0,8)}</span>
                    {log}
                  </div>
                ))}
                {isAnalyzing && (
                  <div className="text-amber-500 animate-pulse">_</div>
                )}
             </div>

             <AnimatePresence>
               {simulatedScore !== null && (
                 <motion.div
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="p-6 rounded-xl border border-rose-500/30 bg-rose-950/20 flex flex-col items-center text-center relative overflow-hidden"
                 >
                   <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-rose-900/20 to-transparent" />
                   <div className="relative z-10 text-sm font-mono text-rose-400 mb-2 uppercase tracking-widest">
                     Omega Core Score
                   </div>
                   <div className="relative z-10 text-6xl font-black text-white tracking-tighter">
                     {simulatedScore}<span className="text-rose-500">%</span>
                   </div>
                 </motion.div>
               )}
             </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
};
