import React from 'react';
import { Shield, Eye, Database, Activity, Zap } from 'lucide-react';

const EliteVault = () => {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 p-8 font-mono relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-600 via-rose-600 to-amber-600 animate-pulse" />

      <div className="max-w-6xl mx-auto space-y-12">
        <header className="flex justify-between items-end border-b border-neutral-900 pb-8">
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tighter uppercase italic">The Ancient Ledger of Modern Waste</h1>
            <p className="text-amber-500 text-xs mt-2 uppercase">☥ WFP PRO ELITE LEGACY // ANOMALY DETECTION UNIT</p>
          </div>
          <div className="text-right">
            <span className="block text-[10px] text-neutral-500">TIMESTAMP: 2026-06-21</span>
            <span className="block text-rose-500 font-bold">STATUS: PRO_ACTIVE</span>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: "mBank S.A.", loss: "2.95M PLN", drift: "-21.4%", anomaly: "API LATENCY" },
            { name: "LPP S.A.", loss: "4.50M PLN", drift: "-14.7%", anomaly: "GHOST INVENTORY" },
            { name: "Żabka Group", loss: "3.01M PLN", drift: "-12.9%", anomaly: "COMPUTER VISION" }
          ].map((target) => (
            <div key={target.name} className="p-6 bg-black border border-neutral-900 rounded-2xl hover:border-amber-500/50 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <Shield className="text-amber-600 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded border border-rose-500/20">{target.drift} DRIFT</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-1 uppercase tracking-tighter">{target.name}</h3>
              <p className="text-neutral-500 text-xs mb-4">ANOMALIA: {target.anomaly}</p>
              <div className="text-2xl font-bold text-amber-500">{target.loss} / MIES.</div>
              <div className="mt-4 pt-4 border-t border-neutral-900 flex justify-between items-center">
                <span className="text-[9px] text-neutral-600 uppercase">McKinsey-Style Audit Ready</span>
                <Zap size={14} className="text-amber-600" />
              </div>
            </div>
          ))}
        </div>

        <section className="p-8 bg-neutral-900/30 border border-neutral-800 rounded-3xl relative">
          <div className="absolute top-4 right-4 flex gap-2">
            <Eye size={16} className="text-rose-500 animate-pulse" />
            <Database size={16} className="text-amber-500" />
          </div>
          <h2 className="text-xs font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
            <Activity size={14} className="text-emerald-400" /> Tactical Execution Core (TEC) Logic
          </h2>
          <div className="space-y-4 text-xs text-neutral-400 leading-relaxed">
            <p><span className="text-amber-400 font-bold">SYMETRIA SUMERYJSKA:</span> Mapowanie infrastruktury w oparciu o precyzyjne algorytmy regresji Antigrawiti.</p>
            <p><span className="text-rose-400 font-bold">OKO RA:</span> Aktywne skanowanie warstwy płatności w celu wykrycia marnotrawstwa 'Ghost Transactions'.</p>
            <p><span className="text-emerald-400 font-bold">ANKH VITALITY:</span> Stabilizacja sesji i wydłużenie cyklu życia klienta (LTV Overclocking).</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default EliteVault;
