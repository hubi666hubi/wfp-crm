import { useState, useEffect } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../../lib/firebase";
import { motion } from "motion/react";
import { Activity, Zap, Users, ShieldAlert, CheckCircle2 } from "lucide-react";

export function RealtimeOperationsMonitor() {
  const [activeLeads, setActiveLeads] = useState(0);
  const [dopamineLoops, setDopamineLoops] = useState(0);
  const [unresolvedThreats, setUnresolvedThreats] = useState(0);
  
  useEffect(() => {
    let unsubLeads = () => {};
    let unsubLoops = () => {};
    let unsubShield = () => {};

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        // 1. Active Leads (Inbound Feed) - Pointed to primary data source
        unsubLeads = onSnapshot(collection(db, "inbound_leads"), (snapshot) => {
          setActiveLeads(snapshot.size);
        }, (error) => console.error("Leads snapshot error:", error));

        // 2. Generator Throughput (Dopamine Loops)
        const loopsQuery = query(collection(db, "dopamine_loops"), where("userId", "==", user.uid));
        unsubLoops = onSnapshot(loopsQuery, (snapshot) => {
          setDopamineLoops(snapshot.size);
        }, (error) => console.error("Loops snapshot error:", error));

        // 3. System Health (Shield Logs) - Server-side filtering of unresolved threats
        const shieldQuery = query(
          collection(db, "shield_logs"),
          where("userId", "==", user.uid),
          where("status", "in", ["unresolved", "monitoring"])
        );
        unsubShield = onSnapshot(shieldQuery, (snapshot) => {
          setUnresolvedThreats(snapshot.size);
        }, (error) => console.error("Shield snapshot error:", error));
      } else {
        unsubLeads();
        unsubLoops();
        unsubShield();
      }
    });

    return () => {
      unsubAuth();
      unsubLeads();
      unsubLoops();
      unsubShield();
    };
  }, []);

  const healthStatus = unresolvedThreats === 0 ? "optimal" : unresolvedThreats < 3 ? "warning" : "critical";

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 relative overflow-hidden mt-6">
      <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 rounded-full bg-gradient-to-br from-blue-500/10 to-transparent blur-3xl pointer-events-none" />
      
      <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-5">
        <h3 className="text-lg font-medium text-white flex items-center gap-2">
          <Activity size={18} className="text-emerald-500 animate-pulse" />
          Real-time Operations Monitor
        </h3>
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono font-medium border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          LIVE CHMURA
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        
        {/* Active CRM Leads */}
        <div className="bg-neutral-950/50 border border-neutral-850 rounded-lg p-5">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Users size={20} />
            </div>
            <span className="text-xs font-mono text-neutral-500">Zapalnik CRM</span>
          </div>
          <div>
            <div className="text-3xl font-bold text-white font-mono">{activeLeads}</div>
            <p className="text-sm text-neutral-400 mt-1">Aktywnych Leadów</p>
          </div>
        </div>

        {/* Generator Throughput */}
        <div className="bg-neutral-950/50 border border-neutral-850 rounded-lg p-5">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
              <Zap size={20} />
            </div>
            <span className="text-xs font-mono text-neutral-500">Generator Throughput</span>
          </div>
          <div>
            <div className="text-3xl font-bold text-white font-mono">{dopamineLoops}</div>
            <p className="text-sm text-neutral-400 mt-1">Wirusowych Pętli (VSL)</p>
          </div>
        </div>

        {/* System Health */}
        <div className={`border rounded-lg p-5 ${
            healthStatus === "optimal" ? "bg-emerald-500/5 border-emerald-500/20" : 
            healthStatus === "warning" ? "bg-amber-500/5 border-amber-500/20" : 
            "bg-rose-500/5 border-rose-500/20"
          }`}>
          <div className="flex justify-between items-start mb-4">
            <div className={`p-2 rounded-lg ${
              healthStatus === "optimal" ? "bg-emerald-500/10 text-emerald-400" : 
              healthStatus === "warning" ? "bg-amber-500/10 text-amber-400" : 
              "bg-rose-500/10 text-rose-400"
            }`}>
              {healthStatus === "optimal" ? <CheckCircle2 size={20} /> : <ShieldAlert size={20} />}
            </div>
            <span className="text-xs font-mono text-neutral-500">Tarcza Ochronna</span>
          </div>
          <div>
            <div className={`text-3xl font-bold font-mono ${
              healthStatus === "optimal" ? "text-emerald-400" : 
              healthStatus === "warning" ? "text-amber-400" : 
              "text-rose-400"
            }`}>{unresolvedThreats}</div>
            <p className="text-sm text-neutral-400 mt-1">Nierozwiązane Zagrożenia</p>
          </div>
        </div>
      </div>
      
    </div>
  );
}
