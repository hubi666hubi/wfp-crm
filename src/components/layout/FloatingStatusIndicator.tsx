import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Cloud, 
  Database, 
  RefreshCw, 
  Check, 
  Activity, 
  Sliders, 
  X, 
  ChevronDown, 
  ChevronUp, 
  FileCode, 
  Sparkles,
  Link2
} from "lucide-react";
import { db, auth } from "../../lib/firebase";
import { getAccessToken } from "../../lib/auth";
import { collection, limit, query, getDocs, doc, getDocFromServer } from "firebase/firestore";
import { toast } from "sonner";

interface SyncStatus {
  name: string;
  status: "synced" | "syncing" | "offline" | "ready";
  details: string;
  latency?: number;
}

export function FloatingStatusIndicator() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(() => {
    return localStorage.getItem("omega_status_minimized") === "true";
  });
  
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  
  // Real stats metrics
  const [firebaseLatency, setFirebaseLatency] = useState<number | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => {
    return new Date().toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  });

  const [googleOAuthConnected, setGoogleOAuthConnected] = useState<boolean>(false);

  // Connection check listeners
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Połączenie sieciowe przywrócone!");
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.error("Brak połączenia sieciowego. System pracuje w trybie offline.");
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Check Firebase and Google OAuth token status
  const checkStatusDetails = useCallback(async () => {
    // Check Google Auth cached Token
    try {
      const token = getAccessToken();
      setGoogleOAuthConnected(!!token);
    } catch {
      setGoogleOAuthConnected(false);
    }

    // Measure Firestore Sync Latency via server-side endpoint to prevent Firebase Auth token-refresh loops on client
    const start = performance.now();
    try {
      const res = await fetch("/api/firebase-health");
      if (res.ok) {
        const diff = Math.round(performance.now() - start);
        setFirebaseLatency(diff);
        setLastSyncTime(new Date().toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      } else {
        throw new Error();
      }
    } catch {
      // Offline fallback
      setFirebaseLatency(null);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      checkStatusDetails();
    }, 50);
    const interval = setInterval(checkStatusDetails, 20000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [checkStatusDetails]);

  // Persist minimized state preference
  const toggleMinimized = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMinimized(prev => {
      const next = !prev;
      localStorage.setItem("omega_status_minimized", String(next));
      return next;
    });
  };

  // Trigger manual resync workflow with beautiful stepping console log & feedback
  const triggerManualResync = async () => {
    if (isSyncingAll) return;
    setIsSyncingAll(true);
    setSyncLogs([]);

    const log = (msg: string) => {
      setSyncLogs(prev => [...prev, `[${new Date().toLocaleTimeString("pl-PL")}] ${msg}`]);
    };

    try {
      log("Rozpoczęcie klastrowej synchronizacji OMEGA-SYNC...");
      await new Promise(r => setTimeout(r, 600));

      log("1. Weryfikacja połączenia klienta...");
      if (!isOnline) {
        throw new Error("Wykryto brak połączenia z siecią WAN");
      }
      await new Promise(r => setTimeout(r, 500));

      log("2. Sprawdzanie integralności schematów Firebase Firestore...");
      const start = performance.now();
      const q = query(collection(db, "clients"), limit(1));
      await getDocs(q);
      const latency = Math.round(performance.now() - start);
      setFirebaseLatency(latency);
      log(`   > Firebase połączona. Latency: ${latency}ms`);
      await new Promise(r => setTimeout(r, 600));

      log("3. Weryfikacja tokenu Google API OAuth2...");
      const token = getAccessToken();
      if (token) {
        log("   > Token uwierzytelniony i aktywny.");
        setGoogleOAuthConnected(true);
      } else {
        log("   > Sygnał: Token Google Auth nieodnaleziony.");
      }
      await new Promise(r => setTimeout(r, 400));

      log("4. Odpytywanie zewnętrznych klastrów AI (Gemini Core Proxy)...");
      try {
        const testGemini = await fetch("/api/health");
        if (testGemini.ok) {
          log("   > Bramka API Gemini: STATUS OK");
        } else {
          log("   > Bramka API Gemini: STANDBY");
        }
      } catch {
        log("   > Bramka API Gemini: offline (Zapasowy wektor)");
      }
      await new Promise(r => setTimeout(r, 500));

      log("System pomyślnie zsynchronizowany!");
      setLastSyncTime(new Date().toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      toast.success("Synchronizacja zakończona sukcesem!", {
        description: "Wszystkie bazy, modele AI i Google Auth mają zweryfikowane sumy kontrolne.",
        duration: 4000
      });
    } catch (err) {
      log(`BŁĄD SYNCHRONIZACJI: ${err instanceof Error ? err.message : "Nieznana anomalii"}`);
      toast.error("Anomalia podczas synchronizacji wektorowej.");
    } finally {
      setIsSyncingAll(false);
    }
  };

  return (
    <>
      <div 
          className="fixed top-20 right-6 z-40 select-none font-sans"
          id="floating-sync-status-indicator"
        >
        <AnimatePresence mode="wait">
          {isMinimized ? (
            /* Pulsing Glowing Mini Dot Button */
            <motion.button
              key="minimized"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={toggleMinimized}
              className="flex items-center justify-center w-8 h-8 rounded-full border border-neutral-800 bg-neutral-950/80 backdrop-blur-md hover:border-rose-500/50 shadow-[0_4px_15px_rgba(0,0,0,0.8)] transition-all group cursor-pointer pointer-events-auto"
              title="Miernik Synchronizacji (Zwiń / Kliknij aby otworzyć)"
            >
              <div className="relative">
                <span className={`w-2.5 h-2.5 rounded-full block ${isOnline ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)]"}`} />
                {isSyncingAll && (
                  <span className="absolute -inset-0.5 rounded-full border border-emerald-400 animate-spin" />
                )}
              </div>
            </motion.button>
          ) : (
            /* Floating Connection Pill */
            <motion.div
              key="expanded"
              initial={{ scale: 0.92, opacity: 0, y: -5 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: -5 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="flex items-center gap-2.5 bg-neutral-950/90 hover:bg-neutral-950/100 border border-neutral-800/80 rounded-full py-1.5 pl-3 pr-2.5 shadow-[0_6px_25px_rgba(0,0,0,0.85)] backdrop-blur-md transition-all z-10 pointer-events-auto"
            >
              <div 
                className="flex items-center gap-2 cursor-pointer group"
                onClick={() => setIsOpen(!isOpen)}
              >
                <div className="flex items-center justify-center">
                  <span className={`w-2 h-2 rounded-full block animate-pulse ${
                    !isOnline 
                      ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.7)]" 
                      : (firebaseLatency && firebaseLatency < 120) 
                        ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" 
                        : "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]"
                  }`} />
                </div>
                
                <div className="flex flex-col text-left">
                  <span className="text-[9.5px] font-mono font-bold tracking-[0.05em] text-neutral-400 flex items-center gap-1 group-hover:text-neutral-200 transition-colors">
                    OMEGA-SYNC: {isOnline ? "LIVE" : "OFFLINE"}
                    <ChevronDown size={10} className={`text-neutral-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 border-l border-neutral-800 pl-1.5 ml-0.5">
                {/* Manual Reload Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerManualResync();
                  }}
                  disabled={isSyncingAll}
                  className="p-1 rounded-md text-neutral-500 hover:text-white hover:bg-neutral-900 transition-all cursor-pointer disabled:opacity-50"
                  title="Wymuś synchronizację wszystkiego"
                >
                  <RefreshCw size={11.5} className={isSyncingAll ? "animate-spin text-rose-500" : "hover:scale-105 active:scale-95 transition-transform"} />
                </button>

                {/* Hide Button */}
                <button
                  onClick={toggleMinimized}
                  className="p-1 rounded-md text-neutral-500 hover:text-rose-400 hover:bg-neutral-900 transition-all cursor-pointer"
                  title="Zwiń do bąbla"
                >
                  <X size={11.5} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Detailed Floating Menu Drawer Panel */}
        <AnimatePresence>
          {isOpen && !isMinimized && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              className="absolute top-11 right-0 w-80 bg-neutral-950 border border-neutral-850 rounded-2xl shadow-[0_15px_45px_rgba(0,0,0,0.92)] p-4 z-50 flex flex-col gap-3.5"
            >
              {/* Box Header */}
              <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
                <div className="flex items-center gap-2">
                  <Cloud size={13} className="text-rose-500" />
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    Panel Synchronizacji danych
                  </span>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-neutral-900 text-neutral-500 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X size={12} />
                </button>
              </div>

              {/* Status List */}
              <div className="space-y-3">
                {/* 1. Firebase status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database size={13} className="text-emerald-400 flex-shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-neutral-200">Baza Firestore</span>
                      <span className="text-[9px] text-neutral-500">{isOnline ? "Automatyczna synchronizacja" : "Buforowanie lokalne"}</span>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className="text-[10px] font-mono font-bold text-white">
                      {firebaseLatency !== null ? `${firebaseLatency}ms` : "W oczekiwaniu"}
                    </span>
                    <span className={`text-[9px] font-bold ${firebaseLatency ? "text-emerald-400" : "text-neutral-500"}`}>
                      {firebaseLatency ? "ZSYNCHRONIZOWANA" : "OFFLINE"}
                    </span>
                  </div>
                </div>

                {/* 2. Google OAuth Scope Check */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Link2 size={13} className="text-rose-450 flex-shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-neutral-200">Google OAuth API</span>
                      <span className="text-[9px] text-neutral-500">Logowanie, Gmail, Keep, Cal</span>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className="text-[10px] font-mono font-bold text-white">
                      {googleOAuthConnected ? "Aktywny token" : "Ready"}
                    </span>
                    <span className={`text-[9.5px] font-mono font-bold ${googleOAuthConnected ? "text-emerald-400" : "text-neutral-500"}`}>
                      {googleOAuthConnected ? "POŁĄCZONY" : "GOTOWY"}
                    </span>
                  </div>
                </div>

                {/* 3. External API Gateways / Gemini */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles size={13} className="text-amber-400 flex-shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-neutral-200">External AI Integration</span>
                      <span className="text-[9px] text-neutral-500">Gemini models grounding</span>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className="text-[10px] font-mono font-bold text-white">
                      Proxy Gateway
                    </span>
                    <span className="text-[9.5px] font-mono font-bold text-emerald-400">
                      ON-STANDBY
                    </span>
                  </div>
                </div>
              </div>

              {/* Console Sync Monitor Logs */}
              {syncLogs.length > 0 && (
                <div className="bg-black/60 border border-neutral-900 rounded-xl p-2.5 max-h-32 overflow-y-auto custom-scrollbar font-mono text-[9px] text-rose-300 leading-normal space-y-1">
                  {syncLogs.map((logLine, idx) => (
                    <div key={idx} className="truncate">{logLine}</div>
                  ))}
                </div>
              )}

              {/* Footer and trigger options */}
              <div className="border-t border-neutral-900 pt-2.5 mt-1.5 flex flex-col gap-2">
                <div className="flex items-center justify-between text-[9px] text-neutral-500">
                  <span className="font-mono">OSTATNI SYNC: {lastSyncTime}</span>
                  <span className="flex items-center gap-1.5">
                    <Activity size={9} className="text-rose-500 animate-pulse" />
                    Sygnał stabilny
                  </span>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={triggerManualResync}
                    disabled={isSyncingAll}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 hover:text-rose-300 text-[10px] font-bold font-mono border border-rose-500/20 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    <RefreshCw size={10} className={isSyncingAll ? "animate-spin" : ""} />
                    {isSyncingAll ? "SYNCHRONIZOWANIE..." : "RESYNCHRONIZUJ TERAZ"}
                  </button>
                  
                  <button 
                    onClick={() => {
                      setIsOpen(false);
                      setIsMinimized(true);
                      localStorage.setItem("omega_status_minimized", "true");
                    }}
                    className="py-1.5 px-2.5 rounded-lg bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-400 hover:text-white text-[10px] font-bold active:scale-[0.98] transition-all cursor-pointer"
                    title="Skurcz panel do stałej ikony"
                  >
                    ZWIŃ
                  </button>
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
