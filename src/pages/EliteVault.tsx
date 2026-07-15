import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Eye,
  Activity,
  ShieldAlert,
  Zap,
  Database,
  Terminal,
  Lock,
  Unlock,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { FinanceService } from '../services/FinanceService';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend
} from 'recharts';

const ANCIENT_METRICS = [
  { subject: 'Ankh Vitality', A: 120, B: 110, fullMark: 150 },
  { subject: 'Eye of Ra (Vision)', A: 98, B: 130, fullMark: 150 },
  { subject: 'Chakra Alignment', A: 86, B: 130, fullMark: 150 },
  { subject: 'Prana Flow (Speed)', A: 99, B: 100, fullMark: 150 },
  { subject: 'Aura Shield (Defense)', A: 85, B: 90, fullMark: 150 },
  { subject: 'Karma Loop (Retention)', A: 65, B: 85, fullMark: 150 },
];

export function EliteVault() {
  const [isLocked, setIsLocked] = useState(true);
  const [pulseLine, setPulseLine] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulseLine(prev => (prev + 1) % 100);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const handleUnlock = () => {
    setIsLocked(false);
    FinanceService.triggerJarvisVoiceConfirmation('Omega Protocol Initiated. Elite Vault unlocked.');
    toast.success('ELITE VAULT UNLOCKED. PROTOCOL OMEGA INITIATED.', {
      style: { background: 'rgba(0,0,0,0.9)', border: '1px solid #ef4444', color: '#ef4444' }
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 relative z-10">

      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-black/60 p-6 rounded-2xl border border-rose-900/30 backdrop-blur-md shadow-[0_0_30px_rgba(225,29,72,0.1)] relative overflow-hidden">

        {/* Subtle scanline overlay for the header */}
        <div className="absolute inset-0 pointer-events-none opacity-20"
             style={{ backgroundImage: 'linear-gradient(rgba(225, 29, 72, 0.1) 1px, transparent 1px)', backgroundSize: '100% 4px' }} />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-950/50 rounded-lg border border-rose-500/20 shadow-[0_0_15px_rgba(225,29,72,0.3)]">
              <Eye className="w-8 h-8 text-rose-500" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-500 tracking-tight">
                ELITE VAULT
              </h1>
              <p className="text-rose-500/60 font-mono text-sm tracking-widest mt-1">
                RADAR DNA PROFILING // MATRIX OMEGA
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 relative z-10">
          <div className="flex items-center gap-2 px-4 py-2 bg-neutral-900/80 rounded-lg border border-neutral-800">
            <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
            <span className="text-sm font-mono text-emerald-500">SYS: ONLINE</span>
          </div>
          <button
            onClick={isLocked ? handleUnlock : undefined}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold tracking-wider transition-all duration-500 ${
              isLocked
                ? 'bg-rose-950/40 text-rose-500 border border-rose-500/30 hover:bg-rose-900/60 hover:shadow-[0_0_20px_rgba(225,29,72,0.4)]'
                : 'bg-emerald-950/40 text-emerald-500 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
            }`}
          >
            {isLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
            {isLocked ? 'UNLOCK VAULT' : 'ACCESS GRANTED'}
          </button>
        </div>
      </div>

      {isLocked && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-24 bg-black/40 rounded-2xl border border-neutral-900 backdrop-blur-sm"
        >
          <AlertTriangle className="w-16 h-16 text-rose-500/50 mb-4" />
          <h2 className="text-xl font-bold text-neutral-300 tracking-widest">VAULT IS LOCKED</h2>
          <p className="text-neutral-500 mt-2 font-mono text-sm">Awaiting Omega Protocol Authorization</p>
        </motion.div>
      )}

      {!isLocked && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >

          {/* Radar Chart Section */}
          <div className="bg-black/80 rounded-2xl p-6 border border-rose-900/40 shadow-[0_0_40px_rgba(225,29,72,0.05)] backdrop-blur-md relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-950/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-neutral-200 flex items-center gap-2 tracking-wide">
                <Radar className="w-5 h-5 text-amber-500" />
                ANCIENT METRICS DNA
              </h2>
              <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded text-xs text-amber-400 font-mono">
                LIVE SYNC
              </div>
            </div>

            <div className="h-[400px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={ANCIENT_METRICS}>
                  <PolarGrid stroke="#333" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 11, fontFamily: 'monospace' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 150]} tick={{ fill: '#555' }} axisLine={false} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid #525252', borderRadius: '8px' }}
                    itemStyle={{ color: '#e5e5e5' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                  <Radar name="Current Sync" dataKey="A" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
                  <Radar name="Target Threshold" dataKey="B" stroke="#e11d48" fill="#e11d48" fillOpacity={0.1} />
                </RadarChart>
              </ResponsiveContainer>

              {/* Radar scanner effect overlay */}
              <div className="absolute top-1/2 left-1/2 w-[70%] h-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-rose-500/10 pointer-events-none">
                 <div className="absolute top-0 bottom-1/2 left-1/2 right-1/2 border-l border-rose-500/30 origin-bottom animate-[spin_4s_linear_infinite]"
                      style={{ background: 'linear-gradient(90deg, rgba(225,29,72,0.2) 0%, transparent 100%)', width: '50%' }} />
              </div>
            </div>
          </div>

          {/* Diagnostics Terminal */}
          <div className="bg-black/90 rounded-2xl border border-neutral-800 shadow-2xl relative overflow-hidden flex flex-col font-mono text-sm">
            <div className="flex items-center justify-between p-3 border-b border-neutral-800 bg-neutral-900/50">
               <div className="flex items-center gap-2">
                 <Terminal className="w-4 h-4 text-rose-500" />
                 <span className="text-neutral-400">root@matrix-kernel:~# ./diagnostics.sh</span>
               </div>
               <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/50" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
               </div>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-2 text-green-500/80">
               <p>[{new Date().toISOString()}] INITIALIZING OMEGA PROTOCOL...</p>
               <p className="text-neutral-400">[{new Date().toISOString()}] CHECKING NEURAL MESH LINKS...</p>
               <p>[{new Date().toISOString()}] OK: KAIZEN LOOP ACTIVE</p>
               <p>[{new Date().toISOString()}] OK: EYE OF RA CONNECTED</p>
               <p className="text-rose-400">[{new Date().toISOString()}] WARN: CHAKRA ALIGNMENT SUB-OPTIMAL (86/130)</p>
               <p>[{new Date().toISOString()}] RECALIBRATING FREQUENCIES...</p>
               <p className="text-emerald-400">[{new Date().toISOString()}] SYNCHRONIZATION AT 99.8%</p>

               <div className="mt-8 pt-4 border-t border-green-900/30">
                  <p className="text-amber-500 animate-pulse">AWAITING FURTHER INSTRUCTIONS...</p>
               </div>
            </div>

            <div className="p-3 bg-neutral-900/50 border-t border-neutral-800 flex items-center gap-2">
              <span className="text-rose-500 font-bold">{'>'}</span>
              <input
                type="text"
                className="bg-transparent border-none outline-none text-green-500 w-full placeholder-green-900/50"
                placeholder="ENTER OVERRIDE COMMAND..."
                disabled
              />
            </div>
          </div>

        </motion.div>
      )}

    </div>
  );
}
