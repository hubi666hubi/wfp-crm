import React, { useState, useEffect } from 'react';

const WarRoomOverlay: React.FC = () => {
  const [active, setActive] = useState(false);

  useEffect(() => {
    // Pulse every 30 seconds
    const interval = setInterval(() => {
      setActive(true);
      setTimeout(() => setActive(false), 2000);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[10000] military-flicker">
      <div className="absolute inset-0 border-[20px] border-emerald-500/10" />
      <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-emerald-600 text-black px-6 py-2 font-black text-sm uppercase tracking-[1em] rounded-b-xl shadow-[0_0_30px_rgba(16,185,129,0.5)]">
        Combat Protocol Active
      </div>
      <div className="absolute bottom-10 right-10 text-emerald-500 font-mono text-[10px] space-y-1">
        <p>VECTOR_SYNC: OK</p>
        <p>NEURAL_MESH: ACTIVE</p>
        <p>MUTANT_CORE: STABLE</p>
      </div>
    </div>
  );
};

export default WarRoomOverlay;
