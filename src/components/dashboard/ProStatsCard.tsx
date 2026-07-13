import React from "react";

interface StatsType {
  avgVelocity: number;
  maxViralCoeff: number;
  marketingShare: number;
  activeSectors: number;
}

interface ProStatsCardProps {
  stats: StatsType;
}

export const ProStatsCard: React.FC<ProStatsCardProps> = React.memo(({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="pro-stats-cards-row">
      {/* Widget 1 */}
      <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-5 flex flex-col justify-between">
        <div>
          <span className="text-[10px] font-mono text-neutral-500 uppercase block mb-1">Średnia Wirująca Prędkość</span>
          <span className="text-2xl font-black text-rose-500 font-mono">
            {stats.avgVelocity} <span className="text-xs text-neutral-400">spikes/h</span>
          </span>
        </div>
        <div className="mt-3 text-xs text-neutral-400 flex items-center gap-1 font-sans">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" /> Stały scanning serwerów
        </div>
      </div>

      {/* Widget 2 */}
      <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-5 flex flex-col justify-between">
        <div>
          <span className="text-[10px] font-mono text-neutral-500 uppercase block mb-1">Maksymalny Współczynnik Wiralności</span>
          <span className="text-2xl font-black text-white font-mono">{stats.maxViralCoeff} / 10</span>
        </div>
        <div className="mt-3 text-xs text-neutral-400 flex items-center gap-1">
          <span className="text-emerald-400 font-bold block">Absolutny Peak rynkowy</span>
        </div>
      </div>

      {/* Widget 3 */}
      <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-5 flex flex-col justify-between">
        <div>
          <span className="text-[10px] font-mono text-neutral-500 uppercase block mb-1">Przewaga Sektora Tematycznego</span>
          <span className="text-2xl font-black text-amber-500 font-mono">{stats.marketingShare}%</span>
        </div>
        <div className="mt-3 text-xs text-neutral-450">
          Segment B2g: <span className="text-white font-semibold">Marketing & Sales</span>
        </div>
      </div>

      {/* Widget 4 */}
      <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-5 flex flex-col justify-between">
        <div>
          <span className="text-[10px] font-mono text-neutral-500 uppercase block mb-1">Aktywne Sektory Analiz</span>
          <span className="text-2xl font-black text-blue-500 font-mono">
            {stats.activeSectors} <span className="text-xs text-neutral-400">branż</span>
          </span>
        </div>
        <div className="mt-3 text-xs text-neutral-450 font-mono">
          Zdigitalizowane: Tech, Finance, Marketing
        </div>
      </div>
    </div>
  );
});

ProStatsCard.displayName = "ProStatsCard";
