import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, Crosshair, BarChart4, Radar, BrainCircuit, Fingerprint, Activity, Terminal } from 'lucide-react';
import { toast } from 'sonner';

interface TargetAccount {
  id: string;
  name: string;
  industry: string;
  estimatedROI: number;
  anomalyDetected: boolean;
  status: 'IDLE' | 'ANALYZING' | 'LOCKED' | 'DEPLOYED';
  winProbability: number;
}

const MOCK_TARGETS: TargetAccount[] = [
  { id: 't1', name: 'InPost S.A.', industry: 'Logistyka & E-commerce', estimatedROI: 24000, anomalyDetected: true, status: 'IDLE', winProbability: 82 },
  { id: 't2', name: 'Allegro Pay', industry: 'Fintech', estimatedROI: 18500, anomalyDetected: true, status: 'IDLE', winProbability: 75 },
  { id: 't3', name: 'Modivo S.A.', industry: 'Fashion Tech', estimatedROI: 12500, anomalyDetected: false, status: 'IDLE', winProbability: 61 },
  { id: 't4', name: 'VeloBank', industry: 'Banking', estimatedROI: 21000, anomalyDetected: true, status: 'IDLE', winProbability: 88 },
];

export function OmegaABM() {
  const [targets, setTargets] = useState<TargetAccount[]>(MOCK_TARGETS);
  const [logs, setLogs] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanningProgress, setScanningProgress] = useState(0);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setLogs(prev => [...prev.slice(-15), `[${time}] ${msg}`]);
  };

  useEffect(() => {
    addLog("OMEGA ABM PREDICTOR: Moduł namierzania precyzyjnego załadowany.");
    addLog("Oczekuję na wektor uderzenia (Start Scan)...");
  }, []);

  const startMatrixScan = () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanningProgress(0);
    addLog("INICJALIZACJA SKANU: Wyszukiwanie anomalii rynkowych B2B (Target-Specific Anomaly)...");

    // Reset status
    setTargets(prev => prev.map(t => ({ ...t, status: 'IDLE' })));

    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setScanningProgress(progress);

      if (progress === 30) addLog("Analiza danych behawioralnych (NLP) z profilu LinkedIn spółek...");
      if (progress === 60) addLog("Estymacja matematyczna modelu Antigrawiti (Loss Valuation Matrix)...");
      if (progress === 90) addLog("Korelacja wyników. Oznaczanie celów wysokiego ryzyka/zysku.");

      if (progress >= 100) {
        clearInterval(interval);
        setIsScanning(false);
        setTargets(prev => prev.map(t => ({
           ...t,
           status: t.anomalyDetected ? 'LOCKED' : 'IDLE'
        })));
        toast.success("SKAN ZAKOŃCZONY. Zablokowano cele z najwyższym ROI.");
      }
    }, 400);
  };

  const deployAgent = (targetId: string, accountName: string) => {
    setTargets(prev => prev.map(t => t.id === targetId ? { ...t, status: 'DEPLOYED' } : t));
    addLog(`DEPLOYMENT: Wysłano JARVIS-KAIZEN do sektora ${accountName}.`);
    toast.success(`Agent przechwytujący wysłany na cel: ${accountName}`);

    setTimeout(() => {
       addLog(`JARVIS-KAIZEN [${accountName}]: Zaaplikowano Campaign Bomb (Retainer Lock).`);
    }, 2500);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 text-neutral-200">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-purple-500/30 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3 font-mono">
            <Target className="text-purple-500 w-10 h-10 animate-pulse drop-shadow-[0_0_15px_rgba(168,85,247,0.6)]" />
            OMEGA ABM PREDICTOR
          </h1>
          <p className="mt-2 text-purple-500/80 font-mono text-sm tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
            AI-ENHANCED ACCOUNT-BASED MARKETING (B2B HIGH-TICKET)
          </p>
        </div>

        <button
          onClick={startMatrixScan}
          disabled={isScanning}
          className="px-6 py-3 bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/30 text-purple-400 font-mono text-xs rounded-xl flex items-center gap-2 transition-all group disabled:opacity-50"
        >
          {isScanning ? (
            <Activity size={16} className="animate-spin" />
          ) : (
            <Radar size={16} className="group-hover:animate-spin-slow" />
          )}
          {isScanning ? `SKANOWANIE... ${scanningProgress}%` : "INICJUJ GLOBALNY SKAN RYNKU"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* TARGET LIST */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 mb-4 font-mono text-sm text-neutral-400">
             <Crosshair size={16} className="text-purple-500" /> WYZNACZONE CELE B2B (PIPELINE)
          </div>

          <AnimatePresence>
            {targets.map((target) => (
              <motion.div
                key={target.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-neutral-950/80 border ${target.status === 'LOCKED' ? 'border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.2)]' : target.status === 'DEPLOYED' ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'border-neutral-800'} rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-white font-mono">{target.name}</h3>
                    {target.anomalyDetected && (
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        ANOMALY DETECTED
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-neutral-500 font-mono flex items-center gap-3">
                     <span className="flex items-center gap-1"><Fingerprint size={12} /> {target.industry}</span>
                     <span className="flex items-center gap-1 text-emerald-400"><BarChart4 size={12} /> {target.estimatedROI.toLocaleString('pl-PL')} PLN / MRR</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-[10px] text-neutral-500 block font-mono">WIN PROBABILITY</span>
                    <span className={`text-xl font-black font-mono ${target.winProbability > 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {target.winProbability}%
                    </span>
                  </div>

                  <button
                    onClick={() => deployAgent(target.id, target.name)}
                    disabled={target.status === 'DEPLOYED' || target.status === 'IDLE'}
                    className={`p-3 rounded-xl border flex items-center gap-2 font-mono text-[10px] transition-all
                      ${target.status === 'LOCKED' ? 'bg-purple-950/50 border-purple-500/50 text-purple-300 hover:bg-purple-900' :
                        target.status === 'DEPLOYED' ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-500 opacity-50 cursor-not-allowed' :
                        'bg-neutral-900 border-neutral-800 text-neutral-600 opacity-50 cursor-not-allowed'}`}
                  >
                     <BrainCircuit size={16} />
                     {target.status === 'DEPLOYED' ? 'AGENT ACTIVE' : 'DEPLOY AGENT'}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* LOG TERMINAL */}
        <div className="lg:col-span-1 bg-black/80 border border-purple-900/30 rounded-3xl p-5 flex flex-col h-[500px]">
          <div className="flex items-center justify-between mb-4 border-b border-purple-900/30 pb-3">
            <div className="flex items-center gap-2">
              <Terminal size={16} className="text-purple-500" />
              <span className="text-xs font-mono font-bold text-purple-400 uppercase tracking-widest">
                ABM Kernel Log
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto font-mono text-[11px] leading-relaxed text-purple-300/80 custom-scrollbar pr-2 space-y-2">
            {logs.map((log, index) => (
              <motion.div
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                key={index}
                className="border-l-2 border-purple-500/30 pl-2"
              >
                {log}
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}