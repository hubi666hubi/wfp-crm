import React, { useState, useEffect } from 'react';
import { Network, Cpu, Shield, Zap, Terminal, Activity, Layers, Crosshair } from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { swarmOrchestrator, SwarmTask } from '../services/SwarmOrchestrator';

const NeuralCommand = () => {
  const [tasks, setTasks] = useState<SwarmTask[]>([]);
  const [meshStatus, setMeshStatus] = useState('SYNCHRONIZED');
  const [load, setLoad] = useState([
    { name: '00:00', val: 45 }, { name: '04:00', val: 52 }, { name: '08:00', val: 89 },
    { name: '12:00', val: 95 }, { name: '16:00', val: 78 }, { name: '20:00', val: 64 }
  ]);

  useEffect(() => {
    const unsubscribe = swarmOrchestrator.listenToSwarm((updatedTasks) => {
      setTasks(updatedTasks);
    });
    return () => unsubscribe();
  }, []);

  const radarData = [
    { subject: 'INTEL', A: 98, fullMark: 100 },
    { subject: 'SPEED', A: 95, fullMark: 100 },
    { subject: 'ACCURACY', A: 99, fullMark: 100 },
    { subject: 'STEALTH', A: 85, fullMark: 100 },
    { subject: 'POWER', A: 92, fullMark: 100 }
  ];

  return (
    <div className="min-h-screen bg-black text-emerald-500 p-6 font-mono selection:bg-emerald-900 selection:text-white">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-emerald-900/50 pb-6 gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic flex items-center gap-3 tactical-glow">
              <Network className="text-emerald-400 animate-pulse" size={32} />
              Neural Command Mesh
            </h1>
            <p className="text-[10px] text-emerald-700 mt-1 uppercase tracking-[0.3em]">Kernel Version: V28.0-MUTANT // Distributed Swarm Intelligence</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-emerald-950/20 border border-emerald-900/50 rounded-lg flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-bold uppercase">MESH_STATUS: {meshStatus}</span>
            </div>
            <button className="px-4 py-2 bg-emerald-600 text-black font-black text-xs uppercase hover:bg-emerald-500 transition-all active:scale-95">
              Kernel Override
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* STATS COLUMN */}
          <div className="space-y-6">
            <div className="p-5 bg-emerald-950/10 border border-emerald-900/30 rounded-2xl relative overflow-hidden group hover:border-emerald-500/50 transition-all">
              <div className="absolute -right-4 -top-4 opacity-10 group-hover:rotate-12 transition-transform">
                <Cpu size={80} />
              </div>
              <span className="text-[10px] text-emerald-700 uppercase font-bold mb-1 block">Neural Velocity</span>
              <div className="text-3xl font-black text-white">4.8 TFLOPS</div>
              <div className="w-full bg-emerald-950 h-1 mt-3 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-[85%] animate-pulse" />
              </div>
            </div>

            <div className="p-5 bg-emerald-950/10 border border-emerald-900/30 rounded-2xl relative overflow-hidden group hover:border-emerald-500/50 transition-all">
              <span className="text-[10px] text-emerald-700 uppercase font-bold mb-1 block">Swarm Active Agents</span>
              <div className="text-3xl font-black text-white">32 / 64</div>
              <div className="flex gap-1 mt-3">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className={`h-1.5 w-full rounded-sm ${i < 4 ? 'bg-emerald-500' : 'bg-emerald-900'}`} />
                ))}
              </div>
            </div>

            <div className="p-5 bg-emerald-950/10 border border-emerald-900/30 rounded-2xl">
              <h3 className="text-xs font-bold uppercase mb-4 flex items-center gap-2">
                <Activity size={14} /> Swarm DNA Profiling
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid stroke="#064e3b" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#059669', fontSize: 8 }} />
                    <Radar
                      name="Mutant Core"
                      dataKey="A"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.3}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* MAIN VISUALIZATION */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 bg-emerald-950/5 border border-emerald-900/20 rounded-3xl relative h-[450px] flex flex-col">
              <div className="absolute top-4 right-4 flex gap-2">
                <Layers size={16} className="text-emerald-800" />
                <Crosshair size={16} className="text-rose-900 animate-pulse" />
              </div>
              <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-6">Real-Time Mesh Load Telemetry</h3>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={load}>
                    <defs>
                      <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="val" stroke="#10b981" fillOpacity={1} fill="url(#colorVal)" strokeWidth={2} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#000', border: '1px solid #064e3b', fontSize: '10px' }}
                      itemStyle={{ color: '#10b981' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="p-4 bg-emerald-950/10 border border-emerald-900/30 rounded-2xl flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/10 rounded-xl">
                    <Shield size={20} className="text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-[10px] text-emerald-700 uppercase font-bold">Encrypted Nodes</div>
                    <div className="text-xl font-black text-white">4,096</div>
                  </div>
               </div>
               <div className="p-4 bg-emerald-950/10 border border-emerald-900/30 rounded-2xl flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/10 rounded-xl">
                    <Zap size={20} className="text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-[10px] text-emerald-700 uppercase font-bold">Action Velocity</div>
                    <div className="text-xl font-black text-white">0.02ms</div>
                  </div>
               </div>
            </div>
          </div>

          {/* TASK TERMINAL */}
          <div className="p-6 bg-black border border-emerald-900/50 rounded-3xl flex flex-col max-h-[600px]">
            <div className="flex items-center justify-between mb-6 border-b border-emerald-900/50 pb-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <Terminal size={14} className="text-emerald-400" />
                Active Swarm Tasks
              </h3>
              <span className="text-[9px] bg-emerald-900/30 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800">
                {tasks.length} LIVE
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
              {tasks.length === 0 ? (
                <div className="text-emerald-900 text-[10px] italic py-20 text-center animate-pulse">
                  Waiting for task ingestion...
                </div>
              ) : (
                tasks.map((task) => (
                  <div key={task.id} className="p-3 bg-emerald-950/5 border border-emerald-900/30 rounded-xl space-y-2 hover:bg-emerald-950/10 transition-colors">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black uppercase text-emerald-500">[{task.type}]</span>
                      <span className="text-[8px] text-emerald-800 font-mono italic">{task.id.slice(0, 8)}</span>
                    </div>
                    <div className="text-[11px] text-emerald-200 leading-tight">
                      Executing: {task.payload?.target || 'Global Recon'}
                    </div>
                    <div className="flex items-center justify-between pt-1">
                       <div className="flex gap-1">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className={`w-1 h-1 rounded-full ${task.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-emerald-900'}`} />
                          ))}
                       </div>
                       <span className="text-[8px] uppercase font-bold text-emerald-600">{task.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-emerald-900/50">
              <button className="w-full py-3 bg-emerald-950/40 border border-emerald-900 text-emerald-400 text-xs font-black uppercase hover:bg-emerald-900 hover:text-white transition-all">
                Ingest Global Protocol
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default NeuralCommand;
