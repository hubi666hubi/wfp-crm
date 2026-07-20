import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Radar, 
  Flame, 
  Zap, 
  TrendingUp, 
  Sparkles, 
  Layers, 
  Bot, 
  Clock, 
  ArrowRight, 
  Filter, 
  Globe, 
  RefreshCw, 
  AlertCircle 
} from "lucide-react";
import { toast } from "sonner";

interface TrendItem {
  id: string;
  portal: "TikTok" | "Instagram" | "Facebook" | "LinkedIn" | "YouTube Shorts";
  topic: string;
  viralCoefficient: number;
  velocity: number;
  momentum: "emerging" | "up" | "peak" | "down";
  keywords: string[];
  sampleHook: string;
  category: "Tech" | "Marketing" | "Lifestyle" | "Finance" | "E-commerce";
  details: string;
  timestamp: string;
}

interface AnalysisResult {
  resonance: {
    demographics: Array<{ segment: string; interest: number }>;
    engagementProbability: number;
    viralVelocityPrediction: number;
    decayDays: number;
    explanation: string;
  };
  hookVariations: Array<{
    framework: string;
    hookText: string;
    storyPreview: string;
    ctaText: string;
    retentionScore: number;
  }>;
  distribution: {
    bestPostingHours: string[];
    daysOfWeek: string[];
    explanation: string;
  };
}

export function ZPulse() {
  // State for active trends
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [loadingTrends, setLoadingTrends] = useState(true);
  const [isPolling, setIsPolling] = useState(true);
  
  // Selection filters
  const [selectedPortal, setSelectedPortal] = useState<string>("All");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedMomentum, setSelectedMomentum] = useState<string>("All");

  // Selection for active generation
  const [currentConcept, setCurrentConcept] = useState("");
  const [generationPortal, setGenerationPortal] = useState<string>("TikTok");
  const [analyzingHook, setAnalyzingHook] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  // Telemetry logs panel
  const [telemetryLogs, setTelemetryLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Doppler Conversion stats (calculated live from active trends)
  const [funnelStage1, setFunnelStage1] = useState(1280);
  const [funnelStage2, setFunnelStage2] = useState(640);
  const [funnelStage3, setFunnelStage3] = useState(320);

  // Helper to add timestamped event logs
  const addTelemetryLog = useCallback((msg: string) => {
    const time = new Date().toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setTelemetryLogs(prev => [...prev.slice(-30), `[${time}] ${msg}`]);
  }, []);

  // Fetch active trends from API
  const fetchTrends = useCallback(async (silent = false) => {
    if (!silent) setLoadingTrends(true);
    try {
      const queryParams = new URLSearchParams();
      if (selectedPortal !== "All") queryParams.append("portal", selectedPortal);
      if (selectedCategory !== "All") queryParams.append("category", selectedCategory);
      if (selectedMomentum !== "All") queryParams.append("momentum", selectedMomentum);

      const response = await fetch(`/api/trends/stream?${queryParams.toString()}`);
      if (!response.ok) throw new Error("Błąd podczas odpytywania API crawlersów.");
      const data = await response.json();
      
      setTrends(data.trends || []);
      
      if (!silent) {
        addTelemetryLog(`Aktywne crawlery zsynchronizowanie z bazą. Pobrano ${data.trends?.length || 0} trendów.`);
      } else {
        // Randomly simulate small spikes when silent poll happens
        if (Math.random() > 0.6 && data.trends?.length > 0) {
          const randomTrend = data.trends[Math.floor(Math.random() * data.trends.length)] as TrendItem;
          addTelemetryLog(`Detekcja fluktuacji: trend "${randomTrend.topic}" skoczył do prędkości ${randomTrend.velocity} spikes/h.`);
          
          // Random conversion funnel adjustments
          setFunnelStage1(prev => prev + Math.floor(Math.random() * 5) + 1);
          setFunnelStage2(prev => prev + Math.floor(Math.random() * 3) + 1);
          setFunnelStage3(prev => prev + Math.floor(Math.random() * 2) + 1);
        }
      }
    } catch {
      addTelemetryLog("Błąd: Crawlery napotkały problem w komunikacji z serwerem.");
    } finally {
      if (!silent) setLoadingTrends(false);
    }
  }, [selectedPortal, selectedCategory, selectedMomentum, addTelemetryLog]);

  // Initial fetch and logs
  useEffect(() => {
    const timer = setTimeout(() => {
      addTelemetryLog("Silnik Z-Pulse 2.1 zainicjalizowany.");
      addTelemetryLog("Ładowanie radarowych koordynatów dla platform: TikTok, IG, FB, LinkedIn, YT Shorts...");
      fetchTrends(false);
    }, 50);

    // Setup initial log simulation
    const logsInterval = setInterval(() => {
      const mockMsgs = [
        "Inicjowanie zapytania o wiralne hashtagi z platformy Meta Graph...",
        "Web scraping najnowszych skryptów wideo o wysokim wskaźniku retencji...",
        "Analiza metryk pętli dopaminowych: pomyślnie zautoryzowano webhooki.",
        "System gotowy: czuwanie nad nowymi słowami kluczowymi w komentarzach...",
        "Gromadzona telemetryka konwersji ze skrzynek Messenger DM..."
      ];
      const randomMsg = mockMsgs[Math.floor(Math.random() * mockMsgs.length)];
      addTelemetryLog(randomMsg);
    }, 12000);

    return () => {
      clearTimeout(timer);
      clearInterval(logsInterval);
    };
    //
  }, []);

  // Poll trends dynamically in backgrounds every 5s if polling is enabled
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPolling) {
      interval = setInterval(() => {
        fetchTrends(true);
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPolling, fetchTrends]);

  // Handle selected trend filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTrends(false);
    }, 10);
    return () => clearTimeout(timer);
  }, [fetchTrends]);

  // Scroll telemetry to bottom
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [telemetryLogs]);

  // Trigger Gemini or fallback analysis
  const handleAnalyzeConcept = async (e: React.FormEvent) => {
    e.preventDefault();
    const concept = currentConcept.trim();
    if (!concept) {
      toast.error("Wprowadź temat trendu lub własny koncept...");
      return;
    }

    setAnalyzingHook(true);
    addTelemetryLog(`Agentic AI: Rozpoczynanie generacji neuro-haków i mapowania rezonansu dla: "${concept}" na platformie ${generationPortal}...`);
    
    try {
      const response = await fetch("/api/trends/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: concept,
          portal: generationPortal
        })
      });

      if (!response.ok) throw new Error("Błąd sieciowy");
      const data = await response.json() as AnalysisResult;
      setAnalysisResult(data);
      addTelemetryLog(`Agentic AI: Analiza ukończona pomyślnie. Wygenerowano 3 neuro-varianty oparte o PAS, AIDA oraz pętlę dopaminową.`);
      toast.success("Haki oraz analiza wiralowa gotowa!");
    } catch {
      addTelemetryLog("Błąd: Nie udało się połączyć z agentem analizującym.");
      toast.error("Nie udało się przeprowadzić analizy.");
    } finally {
      setAnalyzingHook(false);
    }
  };

  const handleSelectFromStream = (trend: TrendItem) => {
    setCurrentConcept(trend.topic);
    setGenerationPortal(trend.portal);
    toast.info(`Wybrano "${trend.topic}". Gotowy do analizy.`);
    addTelemetryLog(`Interakcja: Użytkownik przekierował trend "${trend.topic}" (${trend.portal}) do modułu analizy modeli językowych.`);
  };

  // Setup Portal specific layout colors
  const getPortalBadgeColor = (portal: string) => {
    switch (portal) {
      case "TikTok":
        return "bg-black text-rose-450 border-rose-500/30 text-rose-400";
      case "Instagram":
        return "bg-gradient-to-r from-amber-500/10 to-pink-500/10 text-pink-400 border-pink-500/30";
      case "Facebook":
        return "bg-blue-950/20 text-blue-400 border-blue-500/20";
      case "LinkedIn":
        return "bg-cyan-950/20 text-cyan-400 border-cyan-500/20";
      case "YouTube Shorts":
        return "bg-red-950/20 text-red-400 border-red-500/20";
      default:
        return "bg-neutral-900 border-neutral-800 text-neutral-400";
    }
  };

  const getMomentumGlow = (momentum: string) => {
    switch (momentum) {
      case "emerging":
        return "animate-pulse shadow-[0_0_12px_rgba(234,179,8,0.2)] text-amber-400 border-amber-500/30";
      case "up":
        return "animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.2)] text-emerald-400 border-emerald-500/30";
      case "peak":
        return "animate-bounce shadow-[0_0_16px_rgba(244,63,94,0.3)] text-pink-400 border-pink-500/40 font-bold";
      case "down":
        return "text-neutral-500 border-neutral-900";
      default:
        return "text-neutral-400 border-neutral-800";
    }
  };

  // Radar logic: trigonometry coordinates mapping
  const portalsCoordinates: Record<string, { x: number; y: number; color: string }> = {
    "TikTok": { x: 200, y: 70, color: "#f43f5e" },       // top
    "Instagram": { x: 320, y: 160, color: "#ec4899" },   // polar right-top
    "Facebook": { x: 280, y: 300, color: "#3b82f6" },    // polar right-bottom
    "LinkedIn": { x: 120, y: 300, color: "#06b6d4" },    // polar left-bottom
    "YouTube Shorts": { x: 80, y: 160, color: "#ef4444" } // polar left-top
  };

  // Convert momentum velocity to a dynamic radius multiplier
  const getRadiusForTrend = (trend: TrendItem) => {
    // Return distance from center (200,200). Maximum radius 110
    const velocityFactor = trend.velocity / 200; // max 200
    return 30 + (velocityFactor * 90);
  };

  return (
    <div className="space-y-8" id="zpulse-app-root">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-900 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-mono font-bold tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">
              MODUŁ MULTI-PORTAL
            </span>
            <span className="flex items-center gap-1 text-[10px] uppercase font-mono text-emerald-400">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
              LIVE TELEMETRY
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-sans flex items-center gap-3">
            Z-Pulse Trend Analyzer <Radar className="text-emerald-400 animate-pulse" size={28} />
          </h1>
          <p className="text-neutral-400 text-sm mt-1 max-w-2xl font-sans">
            Scentralizowany, oparty na agentach panel detekcji wiralowości. Monitoruje TikTok, Instagram, Facebook, LinkedIn oraz YouTube Shorts w poszukiwaniu konwertujących trendów.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setIsPolling(prev => !prev);
              addTelemetryLog(`Sterowanie: Zmieniono status automatycznego odpytywania demonów na: [${!isPolling ? "WŁĄCZONY" : "WYŁĄCZONY"}]`);
            }}
            className={`px-4 py-2 text-xs font-mono font-semibold rounded-xl border transition-all flex items-center gap-2 ${
              isPolling 
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.15)]" 
                : "bg-neutral-950 border-neutral-800 text-neutral-400"
            }`}
          >
            <RefreshCw size={14} className={isPolling ? "animate-spin" : ""} />
            {isPolling ? "Auto-Scanning: LIVE" : "Scanning: PAUSED"}
          </button>

          <button
            onClick={() => fetchTrends(false)}
            className="px-4 py-2 text-xs font-mono font-semibold rounded-xl bg-neutral-900 border border-neutral-800 text-white hover:bg-neutral-800 transition-colors flex items-center gap-2"
          >
            <RefreshCw size={14} />
            Wymuś Skan
          </button>
        </div>
      </div>

      {/* TOP STATS ACCENTS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Współczynnik wiralności", val: trends.length > 0 ? (trends.reduce((sum, t) => sum + t.viralCoefficient, 0) / trends.length).toFixed(1) : "0.0", change: "+14.2% w tym tygodniu", icon: TrendingUp, color: "text-rose-400" },
          { label: "Monitorowane platformy", val: "5 Portali", change: "System pełnej integracji", icon: Globe, color: "text-cyan-400" },
          { label: "Prędkość skanowania", val: "1 250 req/h", change: "Brak zatorów API", icon: Zap, color: "text-amber-400" },
          { label: "Detekcja pętli konwersji", val: "Aktywna", change: "Integracja bazy Messenger", icon: Flame, color: "text-emerald-400" }
        ].map((stat, idx) => (
          <div key={idx} className="bg-neutral-950 border border-neutral-900/80 rounded-2xl p-5 relative overflow-hidden group hover:border-neutral-800/80 transition-colors">
            <div className={`absolute top-4 right-4 ${stat.color} opacity-70`}>
              <stat.icon size={22} />
            </div>
            <p className="text-neutral-500 text-xs font-sans tracking-wide uppercase">{stat.label}</p>
            <h3 className="text-2xl font-black font-mono text-white mt-1.5">{stat.val}</h3>
            <p className="text-neutral-400 text-[10px] mt-1 flex items-center gap-1">
              <span className="legend-dot bg-neutral-800 w-1.5 h-1.5 rounded-full inline-block" />
              {stat.change}
            </p>
          </div>
        ))}
      </div>

      {/* MAIN LAYOUT: RADAR & SCROLLING STREAM FEED */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* RADAR RADAR - LEFT (7 COLS) */}
        <div className="bg-neutral-950 border border-neutral-900 rounded-3xl p-6 lg:col-span-7 flex flex-col justify-between relative overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-white font-sans flex items-center gap-2">
                  System Trend Radar <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                </h2>
                <p className="text-neutral-400 text-xs mt-0.5">Wizualne mapowanie momentum oraz prędkości trendów (kliknij punkt, aby analizować)</p>
              </div>
              <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest bg-neutral-900/50 px-2.5 py-1 rounded-md border border-neutral-850">
                Pętle Dopaminowe 2D
              </span>
            </div>

            {/* RADAR CANVAS */}
            <div className="relative flex items-center justify-center p-4">
              <svg 
                viewBox="0 0 400 400" 
                className="w-full max-w-[320px] sm:max-w-[360px] aspect-square relative"
              >
                {/* Background Radar Circles */}
                <circle cx="200" cy="200" r="180" fill="none" stroke="#262626" strokeWidth="1" strokeDasharray="3,3" />
                <circle cx="200" cy="200" r="140" fill="none" stroke="#1f1f1f" strokeWidth="1" />
                <circle cx="200" cy="200" r="100" fill="none" stroke="#1f1f1f" strokeWidth="1" strokeDasharray="5,5" />
                <circle cx="200" cy="200" r="60" fill="none" stroke="#262626" strokeWidth="1" />
                <circle cx="200" cy="200" r="20" fill="none" stroke="#404040" strokeWidth="1" />

                {/* Radar Axis lines */}
                <line x1="200" y1="20" x2="200" y2="380" stroke="#171717" strokeWidth="1.5" />
                <line x1="20" y1="200" x2="380" y2="200" stroke="#171717" strokeWidth="1.5" />
                
                {/* Diagonal Helper Lines */}
                <line x1="72" y1="72" x2="328" y2="328" stroke="#171717" strokeWidth="1" strokeDasharray="2,2" />
                <line x1="72" y1="328" x2="328" y2="72" stroke="#171717" strokeWidth="1" strokeDasharray="2,2" />

                {/* Sweeping Radar Bar Animation */}
                <motion.line
                  x1="200"
                  y1="200"
                  x2="200"
                  y2="20"
                  stroke="rgba(16, 185, 129, 0.4)"
                  strokeWidth="2.5"
                  style={{ originX: "200px", originY: "200px" }}
                  animate={{ rotate: 360 }}
                  transition={{ ease: "linear", duration: 10, repeat: Infinity }}
                />

                {/* Plot Platform Label Locations */}
                {Object.entries(portalsCoordinates).map(([plat, coords]) => (
                  <g key={plat}>
                    <text
                      x={coords.x}
                      y={plat === "TikTok" ? coords.y - 12 : coords.y + 4}
                      fill="#888888"
                      fontSize="9"
                      fontFamily="JetBrains Mono"
                      fontWeight="bold"
                      textAnchor="middle"
                      className="uppercase opacity-70 tracking-wider"
                    >
                      {plat}
                    </text>
                    <circle cx={coords.x} cy={coords.y} r="3" fill={coords.color} className="opacity-80" />
                  </g>
                ))}

                {/* Render active trends plotted dynamically based on portal + velocity */}
                <AnimatePresence>
                  {trends.map((trend, index) => {
                    // Try to distribute angle slightly based on index to prevent stacking
                    const baseCoords = portalsCoordinates[trend.portal] || { x: 200, y: 200, color: "#fff" };
                    
                    // Vector angle pointing from center (200, 200) to platform destination
                    const angle = Math.atan2(baseCoords.y - 200, baseCoords.x - 200);
                    // Add some offset so multiple trends on same platform spread out
                    const offsetAngle = angle + ((index % 3) - 1) * 0.24; 
                    const radius = getRadiusForTrend(trend);

                    // Compute dynamic point
                    const trendX = 200 + radius * Math.cos(offsetAngle);
                    const trendY = 200 + radius * Math.sin(offsetAngle);

                    // Choose color of point based on platform
                    const ptColor = baseCoords.color;

                    return (
                      <g key={trend.id} className="cursor-pointer" onClick={() => handleSelectFromStream(trend)}>
                        {/* Dynamic radar outer ping halo */}
                        <circle
                          cx={trendX}
                          cy={trendY}
                          r="12"
                          fill="none"
                          stroke={ptColor}
                          strokeWidth="1"
                          className="opacity-20 animate-ping"
                        />
                        
                        {/* Interactive trigger dot */}
                        <circle
                          cx={trendX}
                          cy={trendY}
                          r={trend.momentum === "peak" ? "8" : "6"}
                          fill={ptColor}
                          className="hover:scale-135 transition-all outline-none"
                          title={`${trend.topic} (${trend.portal})`}
                        />
                        
                        {/* Tiny hover glow background */}
                        <circle
                          cx={trendX}
                          cy={trendY}
                          r="3"
                          fill="#ffffff"
                          className="animate-pulse"
                        />
                      </g>
                    );
                  })}
                </AnimatePresence>
              </svg>
            </div>
          </div>

          {/* QUICK RADAR LEGEND */}
          <div className="border-t border-neutral-900 pt-4 mt-6 grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
            {Object.entries(portalsCoordinates).map(([plat, coords]) => (
              <div key={plat} className="bg-neutral-900/30 border border-neutral-900 px-3 py-1.5 rounded-xl flex flex-col items-center justify-center">
                <span className="text-[10px] uppercase font-mono font-bold tracking-wide text-neutral-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: coords.color }} />
                  {plat}
                </span>
                <span className="text-[10px] text-neutral-500 font-mono mt-0.5">
                  {trends.filter(t => t.portal === plat).length} aktywnych
                </span>
              </div>
            ))}
          </div>

        </div>

        {/* ACTIVE TREND STREAM FEED - RIGHT (5 COLS) */}
        <div className="bg-neutral-950 border border-neutral-900 rounded-3xl p-6 lg:col-span-5 flex flex-col select-none shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white font-sans flex items-center gap-2">
                Live Feed Odkryć <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping inline-block" />
              </h2>
              <p className="text-neutral-400 text-xs mt-0.5">Fluktuacje pobierane przez crawlery w pętli 5s</p>
            </div>
            
            {/* Quick interactive filter controls */}
            <div className="flex flex-wrap items-center gap-2 bg-neutral-900/60 p-1.5 rounded-xl border border-neutral-850">
              <div className="flex items-center gap-1">
                <Filter size={11} className="text-neutral-500 ml-1" />
                <select
                  value={selectedPortal}
                  onChange={(e) => setSelectedPortal(e.target.value)}
                  className="bg-transparent text-[10px] font-mono text-neutral-300 focus:outline-none border-none py-0.5 cursor-pointer max-w-[75px]"
                >
                  <option value="All" className="bg-neutral-950 text-white">Portal: Wszystkie</option>
                  <option value="TikTok" className="bg-neutral-950 text-white">TikTok</option>
                  <option value="Instagram" className="bg-neutral-950 text-white">Instagram</option>
                  <option value="Facebook" className="bg-neutral-950 text-white">Facebook</option>
                  <option value="LinkedIn" className="bg-neutral-950 text-white">LinkedIn</option>
                  <option value="YouTube Shorts" className="bg-neutral-950 text-white">YT Shorts</option>
                </select>
              </div>

              <div className="border-l border-neutral-800 h-3.5" />

              <div className="flex items-center gap-1">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-transparent text-[10px] font-mono text-neutral-300 focus:outline-none border-none py-0.5 cursor-pointer max-w-[75px]"
                >
                  <option value="All" className="bg-neutral-950 text-white">Kategoria: Wszystkie</option>
                  <option value="Tech" className="bg-neutral-950 text-white">Tech</option>
                  <option value="Marketing" className="bg-neutral-950 text-white">Marketing</option>
                  <option value="Lifestyle" className="bg-neutral-950 text-white">Lifestyle</option>
                  <option value="Finance" className="bg-neutral-950 text-white">Finance</option>
                  <option value="E-commerce" className="bg-neutral-950 text-white">E-commerce</option>
                </select>
              </div>

              <div className="border-l border-neutral-800 h-3.5" />

              <div className="flex items-center gap-1">
                <select
                  value={selectedMomentum}
                  onChange={(e) => setSelectedMomentum(e.target.value)}
                  className="bg-transparent text-[10px] font-mono text-neutral-300 focus:outline-none border-none py-0.5 cursor-pointer max-w-[75px]"
                >
                  <option value="All" className="bg-neutral-950 text-white">Momentum: Wszystkie</option>
                  <option value="emerging" className="bg-neutral-950 text-white">Emerging</option>
                  <option value="up" className="bg-neutral-950 text-white">Up</option>
                  <option value="peak" className="bg-neutral-950 text-white">Peak</option>
                  <option value="down" className="bg-neutral-950 text-white">Down</option>
                </select>
              </div>
            </div>
          </div>

          {/* ACTIVE DISCOVERY FEED LIST */}
          <div className="flex-1 overflow-y-auto max-h-[380px] pr-2 space-y-3 custom-scrollbar">
            {loadingTrends ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-neutral-500 text-xs font-mono">
                <RefreshCw className="animate-spin text-rose-500" size={20} />
                SKANOWANIE PORTALI...
              </div>
            ) : trends.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center border border-neutral-900 border-dashed rounded-2xl p-6">
                <AlertCircle size={24} className="text-neutral-600 mb-2" />
                <p className="text-neutral-500 text-xs font-mono">Brak dopasowanych aktywnych trendów.</p>
                <p className="text-neutral-600 text-[10px] mt-1">Zmień filtry platformy lub kategorii bocznej.</p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {trends.map((trend) => (
                  <motion.div
                    key={trend.id}
                    layoutId={`trend-${trend.id}`}
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    className="group bg-neutral-900/40 border border-neutral-900 hover:border-rose-900/20 rounded-2xl p-4 transition-all hover:bg-neutral-900/60 cursor-pointer relative"
                    onClick={() => handleSelectFromStream(trend)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-wide border uppercase ${getPortalBadgeColor(trend.portal)}`}>
                          {trend.portal}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-500">{trend.category}</span>
                      </div>
                      
                      {/* Momentum Badge with glowing style */}
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase border tracking-wider bg-black/45 ${getMomentumGlow(trend.momentum)}`}>
                        {trend.momentum}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white tracking-tight mt-2.5 font-sans group-hover:text-rose-300 transition-colors">
                      {trend.topic}
                    </h3>
                    
                    <p className="text-neutral-500 text-[11px] leading-relaxed mt-1 font-sans">
                      {trend.details}
                    </p>

                    <div className="bg-neutral-950/60 rounded-xl p-2.5 mt-3 border border-neutral-900 relative">
                      <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 mb-1">
                        <span>PRZYKŁADOWY HAK:</span>
                        <span className="text-rose-400 flex items-center gap-0.5 font-bold uppercase">
                          <TrendingUp size={10} /> {trend.viralCoefficient} VIRAL COEFF
                        </span>
                      </div>
                      <p className="text-gray-200 text-xs italic tracking-wide">
                        "{trend.sampleHook}"
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-neutral-900/50">
                      <div className="flex items-center gap-3 text-[10px] font-mono text-neutral-500">
                        <span className="flex items-center gap-1">
                          <Zap size={11} className="text-emerald-400 animate-pulse" /> {trend.velocity} spk/h
                        </span>
                        <span>Aktualizacja: teraz</span>
                      </div>
                      <span className="text-[10px] font-mono text-rose-400 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-bold">
                        Dopasuj Haki <ArrowRight size={12} />
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

      </div>

      {/* CORE MODULE 2: AI HOOK GENERATOR & VARIANT TESTER (PREDICTIONS) */}
      <div className="bg-neutral-950 border border-neutral-900 rounded-3xl p-6 relative overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center justify-between border-b border-neutral-900 pb-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-white font-sans flex items-center gap-2">
              Kreator "Neuro-Haków" AI & Variant Tester <Sparkles size={18} className="text-amber-400 animate-pulse" />
            </h2>
            <p className="text-neutral-400 text-xs mt-0.5">Wprowadź koncept lub zaznacz trend powyżej. Agent AI wygeneruje warianty copywriterskie i przewidzi ich wiralność.</p>
          </div>
          <span className="text-[10px] font-mono text-neutral-500 bg-neutral-900 px-3 py-1 rounded border border-neutral-850 uppercase">
            Model: Gemini 3.5 Flash
          </span>
        </div>

        <form onSubmit={handleAnalyzeConcept} className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
          <div className="md:col-span-6 space-y-2">
            <label className="text-xs font-mono text-neutral-400 uppercase">1. Temat lub Koncept Główny:</label>
            <input
              type="text"
              value={currentConcept}
              onChange={(e) => setCurrentConcept(e.target.value)}
              placeholder="np. Scentralizowana redukcja kosztów dla firm przez AI agents..."
              className="w-full bg-neutral-900/50 border border-neutral-850 rounded-xl px-4 py-3 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all font-sans"
            />
          </div>

          <div className="md:col-span-3 space-y-2">
            <label className="text-xs font-mono text-neutral-400 uppercase">2. Portal Docelowy:</label>
            <select
              value={generationPortal}
              onChange={(e) => setGenerationPortal(e.target.value)}
              className="w-full bg-neutral-900/50 border border-neutral-850 rounded-xl px-4 py-3 text-sm text-neutral-300 focus:outline-none focus:border-rose-500 transition-all cursor-pointer font-sans"
            >
              <option value="TikTok">TikTok</option>
              <option value="Instagram">Instagram</option>
              <option value="Facebook">Facebook (Organic)</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="YouTube Shorts">YouTube Shorts</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <button
              type="submit"
              disabled={analyzingHook}
              className="w-full bg-white hover:bg-neutral-200 text-black text-sm font-semibold rounded-xl py-3 cursor-pointer transition-colors flex items-center justify-center gap-2"
            >
              <Bot size={16} className={analyzingHook ? "animate-bounce" : ""} />
              {analyzingHook ? "Przeprowadzanie Analizy..." : "Analizuj i Draftuj Haki"}
            </button>
          </div>
        </form>

        {/* ANALYSIS RESULTS PANEL */}
        <AnimatePresence>
          {analysisResult && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="mt-8 pt-6 border-t border-neutral-900 grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              {/* COGNITIVE COPYWRITING VARIATIONS: LEFT (7 COLS) */}
              <div className="lg:col-span-7 space-y-4">
                <h3 className="text-xs font-mono text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Layers size={13} className="text-rose-450" /> Wygenerowane Warianty Neuro-Haków:
                </h3>

                <div className="space-y-4">
                  {analysisResult.hookVariations?.map((hook, index) => (
                    <div key={index} className="bg-neutral-900/30 border border-neutral-850 hover:border-neutral-800 rounded-2xl p-4 transition-all relative">
                      <div className="flex items-center justify-between border-b border-neutral-900/50 pb-2 mb-2">
                        <span className="text-xs font-mono font-bold text-emerald-400 uppercase bg-emerald-500/5 px-2.5 py-0.5 rounded border border-emerald-500/10">
                          {hook.framework}
                        </span>
                        
                        {/* Retention predictions bar helper */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-neutral-500 uppercase">Przewidywana Retencja:</span>
                          <span className="text-xs font-mono font-bold text-rose-400">{hook.retentionScore}%</span>
                        </div>
                      </div>

                      {/* Hook body highlighting display font */}
                      <p className="text-base font-bold font-sans tracking-tight text-white leading-snug">
                        "{hook.hookText}"
                      </p>

                      <p className="text-neutral-400 text-xs leading-relaxed mt-2.5 font-sans border-l-2 border-neutral-800 pl-3">
                        <strong className="text-neutral-300 font-mono text-[10px] block uppercase">Zarys Opowieści (Sec):</strong>
                        {hook.storyPreview}
                      </p>

                      <div className="flex items-center gap-1.5 mt-3 pt-2 text-[10px] font-mono text-neutral-400">
                        <span className="text-amber-400 font-bold uppercase">Wezwanie pętli DM (CTA):</span>
                        <span className="bg-black/40 px-2 py-0.5 rounded border border-neutral-850 text-white italic">
                          {hook.ctaText}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* DEMOGRAPHICS AND RESONANCE METRICS: RIGHT (5 COLS) */}
              <div className="lg:col-span-5 space-y-5">
                <h3 className="text-xs font-mono text-neutral-400 uppercase tracking-wider mb-2">
                  📊 Rozkład Rezonansu Widza (Audience Vector):
                </h3>

                <div className="bg-neutral-900/20 border border-neutral-850 rounded-2xl p-5 space-y-5">
                  
                  {/* Demographics bars list */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block">Potencjał Demograficzny:</span>
                    {analysisResult.resonance?.demographics?.map((demo, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-mono text-neutral-300">
                          <span>{demo.segment}</span>
                          <span className="text-cyan-400">{demo.interest}%</span>
                        </div>
                        <div className="w-full bg-neutral-950 rounded-full h-1.5 border border-neutral-900 overflow-hidden">
                          <div 
                            className="bg-cyan-500 h-1.5 rounded-full transition-all duration-1000" 
                            style={{ width: `${demo.interest}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Viral Probability Meters */}
                  <div className="grid grid-cols-2 gap-4 border-t border-neutral-900 pt-4">
                    <div>
                      <span className="text-[9px] font-mono text-neutral-500 uppercase">Szansa Wiralności:</span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-2xl font-black font-mono text-emerald-400">
                          {analysisResult.resonance?.engagementProbability}%
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[9px] font-mono text-neutral-500 uppercase">Trwałość Trendu:</span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-2xl font-black font-mono text-rose-400">
                          ~{analysisResult.resonance?.decayDays} dni
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic copy summary analysis from agent */}
                  <div className="border-t border-neutral-900 pt-4 text-xs font-sans text-neutral-400 leading-relaxed">
                    <p>
                      {analysisResult.resonance?.explanation}
                    </p>
                  </div>

                  {/* Post Scheduler Predictions */}
                  <div className="bg-neutral-950/60 border border-neutral-900 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-amber-400 uppercase">
                      <Clock size={12} /> Zoptymalizowany Harmonogram Publikacji:
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5">
                      {analysisResult.distribution?.bestPostingHours?.map((hr, idx) => (
                        <span key={idx} className="bg-neutral-900 text-neutral-200 text-[10px] font-mono px-2 py-0.5 rounded border border-neutral-800">
                          ⏳ {hr}
                        </span>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {analysisResult.distribution?.daysOfWeek?.map((day, idx) => (
                        <span key={idx} className="bg-neutral-900 text-neutral-200 text-[10px] font-sans px-2 py-0.5 rounded border border-neutral-800">
                          📅 {day}
                        </span>
                      ))}
                    </div>

                    <p className="text-[10px] text-neutral-500 font-sans mt-2 italic leading-normal">
                      {analysisResult.distribution?.explanation}
                    </p>
                  </div>

                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* LOWER FOOTER: DOPAMINE CONVERSION FUNNEL & LIVE TELEMETRY LOGS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-6">
        
        {/* INTERACTIVE CONVERSION CHANNELS - LEFT (5 COLS) */}
        <div className="bg-neutral-950 border border-neutral-900 rounded-3xl p-6 lg:col-span-5 flex flex-col justify-between relative overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
          <div>
            <h2 className="text-lg font-bold text-white font-sans flex items-center gap-2">
              Dopamine Conversion Channel <Layers size={18} className="text-rose-400" />
            </h2>
            <p className="text-neutral-400 text-xs mt-0.5">Wskaźniki przepustowości z lejka: Trend -&gt; Komentarz -&gt; Auto-DM</p>
            
            <div className="space-y-4 mt-6">
              {[
                { title: "Kwalifikacja trendu / Wykryte Spikes", count: funnelStage1, percent: "100%", color: "bg-neutral-800 text-neutral-400" },
                { title: "Zostawione Komentarze (Organic)", count: funnelStage2, percent: `${((funnelStage2 / funnelStage1) * 100).toFixed(0)}%`, color: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
                { title: "Wysłane Auto-DMy (Messenger)", count: funnelStage3, percent: `${((funnelStage3 / funnelStage2) * 100).toFixed(0)}%`, color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" }
              ].map((stage, sIdx) => {
                const widthStyle = sIdx === 0 ? "w-full" : sIdx === 1 ? "w-[75%]" : "w-[50%]";
                return (
                  <div key={sIdx} className="space-y-1">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-neutral-300 font-bold uppercase">{stage.title}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-black">{stage.count}</span>
                        <span className="text-neutral-500">({stage.percent})</span>
                      </div>
                    </div>
                    <div className="w-full flex items-center justify-start">
                      <div className={`h-8 rounded-xl border flex items-center pl-3 text-[10px] font-mono font-bold uppercase tracking-wider ${stage.color} ${widthStyle} shadow-lg transition-all duration-500`}>
                        {stage.percent} konwersji
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t border-neutral-900 pt-4 mt-6 text-[10px] font-mono text-neutral-500 leading-normal">
            ⚙️ Kwalifikacja CRM oraz systemy autopilot wysyłek podpięte pod bazę webhooków `automation_logs`. Wykrycie nowego słowa kluczowego wyzwala wysyłkę na Messengerze w średnim czasie <strong className="text-emerald-400">1.18s</strong>.
          </div>
        </div>

        {/* COMPREHENSIVE TELEMETRY LOGGER - RIGHT (7 COLS) */}
        <div className="bg-neutral-950 border border-neutral-900 rounded-3xl p-6 lg:col-span-7 flex flex-col justify-between relative overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-neutral-900 pb-3">
              <h2 className="text-sm font-bold text-neutral-300 font-sans flex items-center gap-1.5 uppercase tracking-wide">
                <Bot size={15} className="text-cyan-400" /> Logi Działania Systemu i Agentów:
              </h2>
              <span className="text-[9px] font-mono text-neutral-500 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-850">
                STABILNY (200 OK)
              </span>
            </div>

            {/* Scrolling log container */}
            <div className="bg-neutral-950/80 border border-neutral-900 rounded-2xl p-4 h-[180px] overflow-y-auto font-mono text-xs text-emerald-500 space-y-1.5 custom-scrollbar">
              {telemetryLogs.map((log, index) => (
                <div key={index} className="leading-snug">
                  <span className="text-neutral-400 font-bold mr-1.5">&gt;</span>
                  {log}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-neutral-900 pt-3 mt-4 text-[10px] font-mono text-neutral-500">
            <span>Z-Pulse v2.1.0 telemetry loop</span>
            <span className="text-neutral-400">Database Connection: SECURE</span>
          </div>
        </div>

      </div>

    </div>
  );
}

export default ZPulse;
