// import React from 'react';

export const LeadAnalytics: React.FC = () => {
  // Mock data representing processed CSV priorities
  const stats = [
    { label: 'Priority A (Decision Makers)', value: '342', color: 'bg-green-500', percent: '45%' },
    { label: 'Priority B (Influencers)', value: '185', color: 'bg-yellow-500', percent: '30%' },
    { label: 'Priority C (Gatekeepers)', value: '124', color: 'bg-orange-500', percent: '20%' },
    { label: 'Invalid Leads', value: '45', color: 'bg-red-500', percent: '5%' },
  ];

  return (
    <div className="h-full flex flex-col justify-center">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="bg-[#00ff00]/5 border border-[#00ff00]/20 p-4 rounded hover:bg-[#00ff00]/10 transition-colors">
            <div className="text-xs text-[#00ff00]/60 uppercase mb-1">{stat.label}</div>
            <div className="text-3xl font-bold text-[#00ff00] drop-shadow-[0_0_5px_rgba(0,255,0,0.5)]">
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <h3 className="text-xs uppercase text-[#00ff00]/50 tracking-wider">Funnel Distribution</h3>
        {stats.map((stat, i) => (
          <div key={i} className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-[#00ff00]/10 text-[#00ff00]">
                  {stat.label}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold inline-block text-[#00ff00]">
                  {stat.percent}
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-[#00ff00]/10 border border-[#00ff00]/20">
              <div style={{ width: stat.percent }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-[#00ff00] shadow-[0_0_10px_#00ff00]"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
