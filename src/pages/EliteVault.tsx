import React, { useState, useEffect } from 'react';
import { Shield, Eye, Database, Activity, Zap, Download, Lock } from 'lucide-react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell
} from 'recharts';
import { generateMcKinseyAudit, AuditData } from '../lib/pdfGenerator';
import { toast } from 'sonner';

const EliteVault = () => {
  const [metrics, setMetrics] = useState({ ankhVitality: 99.9, eyeOfRaScore: 88, chakraAlignment: 92 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/legacy/metrics')
      .then(res => res.json())
      .then(data => {
        setMetrics(data);
        setLoading(false);
      });
  }, []);

  const radarData = [
    { subject: 'ANKH VITALITY', A: metrics.ankhVitality, fullMark: 100 },
    { subject: 'EYE OF RA', A: metrics.eyeOfRaScore, fullMark: 100 },
    { subject: 'CHAKRA SYNC', A: metrics.chakraAlignment, fullMark: 100 },
    { subject: 'DIAG DEPTH', A: 95, fullMark: 100 },
    { subject: 'OVERCLOCK', A: 82, fullMark: 100 }
  ];

  const handleDownloadAudit = (target: any) => {
    const data: AuditData = {
      companyName: target.name,
      driftPercentage: target.drift,
      totalLeak: target.loss,
      anomalies: [
        { item: target.anomaly, cost: target.loss },
        { item: "Infrastructural Latency (PRO)", cost: "150k PLN" }
      ],
      recommendation: "Immediate deployment of Chrono Ledger to stabilize conversion drift and optimize session vitality."
    };
    const doc = generateMcKinseyAudit(data);
    doc.save(`WFP_AUDIT_${target.name.replace(/\s+/g, '_')}.pdf`);
    toast.success(`Raport ${target.name} został wygenerowany pomyślnie!`);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 p-8 font-mono relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-600 via-rose-600 to-amber-600 animate-pulse" />

      <div className="max-w-6xl mx-auto space-y-12">
        <header className="flex justify-between items-end border-b border-neutral-900 pb-8">
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tighter uppercase italic flex items-center gap-4">
              <Lock className="text-amber-500" /> <span className="military-flicker">The Ancient Ledger</span>
            </h1>
            <p className="text-amber-500 text-xs mt-2 uppercase">☥ WFP PRO ELITE LEGACY // ANOMALY DETECTION UNIT</p>
          </div>
          <div className="text-right">
            <span className="block text-[10px] text-neutral-500">ENGINE: V11.0-PRO</span>
            <span className="block text-rose-500 font-bold">STATUS: PRO_ACTIVE</span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Radar Chart */}
          <div className="bg-black/40 border border-neutral-900 p-8 rounded-3xl h-[400px]">
            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-6">Legacy Performance Matrix</h3>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#262626" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#737373', fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Elite Metrics"
                  dataKey="A"
                  stroke="#d97706"
                  fill="#d97706"
                  fillOpacity={0.4}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Targets Grid */}
          <div className="space-y-4">
            {[
              { name: "mBank S.A.", loss: "2.95M PLN", drift: "-21.4%", anomaly: "API LATENCY" },
              { name: "LPP S.A.", loss: "4.50M PLN", drift: "-14.7%", anomaly: "GHOST INVENTORY" },
              { name: "Żabka Group", loss: "3.01M PLN", drift: "-12.9%", anomaly: "COMPUTER VISION" }
            ].map((target) => (
              <div key={target.name} className="p-5 bg-neutral-900/20 border border-neutral-900 rounded-2xl flex justify-between items-center group hover:border-amber-600/30 transition-all">
                <div>
                  <h4 className="text-white font-bold uppercase text-sm">{target.name}</h4>
                  <p className="text-[10px] text-rose-500 font-bold">{target.drift} DRIFT // {target.anomaly}</p>
                </div>
                <button
                  onClick={() => handleDownloadAudit(target)}
                  className="p-3 bg-amber-600/10 text-amber-500 rounded-xl hover:bg-amber-600 hover:text-white transition-all"
                >
                  <Download size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <section className="p-10 bg-gradient-to-br from-neutral-900 to-black border border-neutral-800 rounded-[40px] relative">
          <div className="absolute top-8 right-8 flex gap-4">
            <Eye size={24} className="text-rose-500 animate-pulse" />
            <Activity size={24} className="text-amber-500" />
          </div>
          <h2 className="text-sm font-bold text-white uppercase tracking-[0.2em] mb-8 border-b border-neutral-800 pb-4">
            Tactical Execution Core (TEC) Methodology
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-[11px] leading-relaxed">
            <div className="space-y-3">
              <span className="text-amber-400 font-bold block border-b border-amber-900/50 pb-1">☥ ANKH VITALITY</span>
              <p className="text-neutral-500">Pomiar stabilności warstwy sesyjnej. Optymalizacja uptime'u transakcyjnego w celu eliminacji wycieków w segmencie High-Volume.</p>
            </div>
            <div className="space-y-3">
              <span className="text-rose-400 font-bold block border-b border-rose-900/50 pb-1">👁 EYE OF RA</span>
              <p className="text-neutral-500">Aktywna telemetria anomalii. Przesunięcie paradygmatu z monitorowania reaktywnego na predykcyjne wykrywanie choking points.</p>
            </div>
            <div className="space-y-3">
              <span className="text-emerald-400 font-bold block border-b border-emerald-900/50 pb-1">🧬 CHAKRA ALIGNMENT</span>
              <p className="text-neutral-500">Synchronizacja procesów backendowych z lejkiem marketingowym. Maksymalizacja prędkości operacyjnej (Velocity Overclocking).</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default EliteVault;
