import React, { useState, useEffect } from 'react';
import { Settings, Play, Pause, List, CheckCircle, AlertTriangle, Zap, Activity } from 'lucide-react';
import { toast } from 'sonner';

const AutomationHub = () => {
  const [status, setStatus] = useState<any>({ isRunning: false, lastCycle: null });
  const [logs, setLogs] = useState<any[]>([]);

  const fetchStatus = () => {
    fetch('/api/automation/status')
      .then(res => res.json())
      .then(data => setStatus(data));
  };

  const fetchLogs = () => {
    fetch('/api/automation/logs')
      .then(res => res.json())
      .then(data => setLogs(data.reverse()));
  };

  useEffect(() => {
    fetchStatus();
    fetchLogs();
    const interval = setInterval(() => {
      fetchStatus();
      fetchLogs();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-black text-neutral-200 p-8 font-mono">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex justify-between items-center border-b border-neutral-900 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tighter uppercase italic flex items-center gap-3">
              <Zap className="text-emerald-500" /> WFP Automation Hub
            </h1>
            <p className="text-neutral-500 text-[10px] mt-1 uppercase tracking-widest">Autonomous Kaizen Management Engine // V25.0</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${status.isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                Engine ${status.isRunning ? 'Active' : 'Paused'}
              </span>
            </div>
            <button className="p-2.5 bg-rose-600/10 text-rose-500 border border-rose-500/20 rounded-xl hover:bg-rose-600 hover:text-white transition-all">
              {status.isRunning ? <Pause size={18} /> : <Play size={18} />}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-neutral-950 border border-neutral-900 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
              <Settings size={14} /> Core Configuration
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-black border border-neutral-900 rounded-lg">
                <div className="text-[9px] text-neutral-500 mb-1 uppercase">Cycle Interval</div>
                <div className="text-sm font-bold text-white">15 MINUTES (OVERCLOCKED)</div>
              </div>
              <div className="p-3 bg-black border border-neutral-900 rounded-lg">
                <div className="text-[9px] text-neutral-500 mb-1 uppercase">Outreach Mode</div>
                <div className="text-sm font-bold text-emerald-500">AGGRESSIVE PRO-ELITE</div>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 p-6 bg-neutral-950 border border-neutral-900 rounded-2xl flex flex-col max-h-[500px]">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <List size={14} /> Live Automation Stream
            </h3>
            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
              {logs.map((log) => (
                <div key={log.id} className="p-3.5 bg-black border border-neutral-900 rounded-xl hover:border-emerald-500/20 transition-all group">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${log.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                        {log.action}
                      </span>
                      <span className="text-[10px] text-white font-bold">{log.target}</span>
                    </div>
                    <span className="text-[9px] text-neutral-600">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed italic">"{log.message}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutomationHub;
