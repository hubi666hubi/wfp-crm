import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  TrendingUp, 
  Sparkles, 
  Coins, 
  DollarSign, 
  Percent, 
  ChevronRight, 
  Copy, 
  Flame, 
  Brain, 
  Settings2,
  CheckCircle,
  RefreshCw,
  Zap,
  ShieldCheck,
  Target
} from "lucide-react";
import { toast } from "sonner";
import { useSettingsStore } from "../../store/settingsStore";

interface ProProfitMaximizerProps {
  initialDailyGoal: number;
  initialAvgPrice: number;
  initialConvRate: number;
}

export function ProProfitMaximizer({ 
  initialDailyGoal, 
  initialAvgPrice, 
  initialConvRate 
}: ProProfitMaximizerProps) {
  const settingsStore = useSettingsStore();

  // Optimization parameters
  const [dailyGoal, setDailyGoal] = useState(initialDailyGoal);
  const [avgPrice, setAvgPrice] = useState(initialAvgPrice);
  const [convRate, setConvRate] = useState(initialConvRate);
  
  const [upsellRate, setUpsellRate] = useState(1.5); // x1.0 - x3.0
  const [trafficSource, setTrafficSource] = useState("auto_facebook_leads");
  const [monthlyExpenses, setMonthlyExpenses] = useState(450);
  const [customContext, setCustomContext] = useState("");

  const [loading, setLoading] = useState(false);
  const [strategyResult, setStrategyResult] = useState<any>(null);

  // Live calculations
  const monthlyTargetNormal = dailyGoal * 30;
  const projectedRevenuePro = Math.round(monthlyTargetNormal * upsellRate);
  const netProfitNormal = Math.max(0, monthlyTargetNormal - monthlyExpenses);
  const netProfitPro = Math.max(0, projectedRevenuePro - monthlyExpenses);
  const incrementalGain = netProfitPro - netProfitNormal;

  const handleGenerateStrategy = async () => {
    setLoading(true);
    setStrategyResult(null);

    try {
      const response = await fetch("/api/generate-pro-profit-strategy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dailyGoal,
          avgServicePrice: avgPrice,
          outreachConvRate: convRate,
          upsellRate,
          trafficSource: getLabelForTraffic(trafficSource),
          monthlyExpenses,
          customContext: customContext || "Zoptymalizuj pod markę premium i wysoką marżę netto."
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Nie udało się wygenerować planu zysków.");
      }

      setStrategyResult(data);
      toast.success("Otrzymano elitarną strategię przychodową PRO!");
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Błąd generowania strategii.");
    } finally {
      setLoading(false);
    }
  };

  const getLabelForTraffic = (key: string) => {
    switch (key) {
      case "auto_facebook_leads": return "Detektor Grup Facebook (PRO) i Skaner Leadów";
      case "gmail_scouts": return "Gmail Integration + Reddit Scouts Agents";
      case "organic_vsl": return "Wirusowe pętle dopaminowe (VSL Generator & Shorts)";
      case "hybrid": return "Hybrydowy: Integracje Workspace, CRM Zapalnik i Cold Mail";
      default: return key;
    }
  };

  const handleCopy = () => {
    if (!strategyResult?.strategy) return;
    navigator.clipboard.writeText(strategyResult.strategy);
    toast.success("Skopiowano strategię PRO do schowka!");
  };

  // Helper to render markdown format beautifully to elements
  const renderFormattedText = (text: string) => {
    if (!text) return null;
    const lines = text.split("\n");
    return lines.map((line, index) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("###")) {
        return <h4 key={index} className="text-sm font-bold text-blue-400 mt-4 mb-2 font-mono flex items-center gap-1.5">{trimmed.replace("###", "")}</h4>;
      }
      if (trimmed.startsWith("##")) {
        return <h3 key={index} className="text-base font-bold text-white mt-5 border-b border-neutral-800 pb-1 mb-2 font-mono flex items-center gap-2">{trimmed.replace("##", "")}</h3>;
      }
      if (trimmed.startsWith("#")) {
        return <h2 key={index} className="text-lg font-extrabold text-blue-500 mt-6 mb-3 font-mono">{trimmed.replace("#", "")}</h2>;
      }
      if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
        return <li key={index} className="text-xs text-neutral-300 ml-4 list-disc marker:text-blue-500 leading-relaxed py-0.5">{trimmed.substring(1).trim()}</li>;
      }
      if (/^\d+\./.test(trimmed)) {
        return <p key={index} className="text-xs text-neutral-300 ml-2 font-medium leading-relaxed py-1"><span className="text-blue-400 font-bold font-mono">{trimmed.match(/^\d+\./)?.[0]}</span> {trimmed.replace(/^\d+\./, "").trim()}</p>;
      }
      if (trimmed === "") {
        return <div key={index} className="h-2" />;
      }
      return <p key={index} className="text-xs text-neutral-400 leading-relaxed font-sans py-0.5">{trimmed}</p>;
    });
  };

  return (
    <div id="pro-profit-maximizer-root" className="bg-neutral-950 border border-neutral-800/80 rounded-xl p-6 mt-6 relative overflow-hidden shadow-2xl">
      {/* Background glow effects */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-600/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/5 to-transparent blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-850 pb-5 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 px-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded text-[10px] uppercase font-mono tracking-widest font-bold shadow-[0_0_15px_rgba(37,99,235,0.4)]">
              PRO ENGINE v4
            </span>
            <span className="text-xs text-neutral-400 font-mono">Omega Profit Maximizer</span>
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight mt-1 bg-gradient-to-r from-slate-100 via-white to-blue-400 bg-clip-text text-transparent flex items-center gap-2">
            <Coins className="text-blue-400 animate-pulse" size={20} />
            Generator Zysków PRO & Strategii ROI
          </h3>
          <p className="text-xs text-neutral-400 mt-1">
            Hiper-optymalizacja zysków netto dzięki symulacji lejka wielokanałowego, asynchronicznej sprzedaży i modelowi Gemini 3.5.
          </p>
        </div>
        
        <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800/80 px-3 py-1.5 rounded-lg shrink-0">
          <ShieldCheck size={14} className="text-emerald-400" />
          <span className="text-[11px] font-mono text-neutral-300">Bezpieczny algorytm CRO</span>
        </div>
      </div>

      {/* Sliders and Dynamic Calculations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left column: Controls */}
        <div className="lg:col-span-5 space-y-5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 font-mono flex items-center gap-1.5 border-b border-neutral-900 pb-2">
            <Settings2 size={14} className="text-blue-500" />
            ZAAWANSOWANE PARAMETRY PRO
          </h4>

          {/* Upsell rate */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-neutral-400 font-mono">Współczynnik Upsell / LTV (Mnożnik)</span>
              <span className="text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">x{upsellRate.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="3.0"
              step="0.1"
              value={upsellRate}
              onChange={(e) => setUpsellRate(parseFloat(e.target.value))}
              className="w-full accent-blue-500 bg-neutral-900 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
            <p className="text-[10px] text-neutral-500 leading-normal">
              Wyraża dodatkowy zysk z jednego klienta dzięki sprzedaży krzyżowej, abonamentom i asynchronicznym pętlom.
            </p>
          </div>

          {/* Traffic source selection */}
          <div className="space-y-1.5">
            <label className="text-xs text-neutral-400 font-mono block">Dominujący Kanał Pozyskiwania</label>
            <select
              value={trafficSource}
              onChange={(e) => setTrafficSource(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-blue-500 font-sans"
            >
              <option value="auto_facebook_leads">Detektor Grup Facebook (PRO) i Skaner Leadów</option>
              <option value="gmail_scouts">Gmail Integration + Reddit Scouts Agents</option>
              <option value="organic_vsl">Wirusowe pętle dopaminowe (VSL Generator)</option>
              <option value="hybrid">Hybryda (Email, CRM Zapalnik i Google Chat Co-pilot)</option>
            </select>
          </div>

          {/* Monthly Expenses */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-neutral-400 font-mono">Koszty Stałe i SaaS (Miesięcznie)</span>
              <span className="text-rose-400 font-semibold">{monthlyExpenses} PLN</span>
            </div>
            <input
              type="range"
              min="100"
              max="5000"
              step="50"
              value={monthlyExpenses}
              onChange={(e) => setMonthlyExpenses(parseInt(e.target.value))}
              className="w-full accent-rose-500 bg-neutral-900 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Custom user context block */}
          <div className="space-y-1.5">
            <label className="text-xs text-neutral-400 font-mono block">Niestandardowe wskazówki dla silnika AI (Opcjonalnie)</label>
            <textarea
              value={customContext}
              onChange={(e) => setCustomContext(e.target.value)}
              placeholder="np. Skup się wyłącznie na sprzedaży asynchronicznej usług B2B bez rozmów telefonicznych..."
              rows={3}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 text-xs text-neutral-300 focus:outline-none focus:border-blue-500/70 transition-colors placeholder-neutral-600 resize-none font-sans"
            />
          </div>

          {/* Synchronize inputs directly button */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setDailyGoal(2500);
                setAvgPrice(5000);
                setConvRate(5);
                setUpsellRate(2.0);
                toast.info("Wczytano agresywny profil wzrostu 'Hyper-Growth Scale-Up'!");
              }}
              className="flex-1 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[10.5px] font-mono font-medium rounded-md text-neutral-400 transition-colors cursor-pointer"
            >
              PROFIL SZYBKI WZROST 🚀
            </button>
            <button
              onClick={() => {
                setDailyGoal(1000);
                setAvgPrice(10000);
                setConvRate(10);
                setUpsellRate(1.2);
                toast.info("Wczytano profil wysokie-bilety 'Premium Consultancy'!");
              }}
              className="flex-1 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[10.5px] font-mono font-medium rounded-md text-neutral-400 transition-colors cursor-pointer"
            >
              PROFIL PREMIUM TICKET 💎
            </button>
          </div>
        </div>

        {/* Center line separator for aesthetics */}
        <div className="lg:col-span-1 flex items-center justify-center">
          <div className="w-[1px] h-full bg-neutral-900 hidden lg:block" />
          <div className="w-full h-[1px] bg-neutral-900 block lg:hidden" />
        </div>

        {/* Right column: live profits math & AI activator */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 font-mono flex items-center gap-1.5 border-b border-neutral-900 pb-2">
              <Percent size={14} className="text-emerald-500" />
              KALKULACJE PRO PORÓWNAWCZE (SIMULATOR)
            </h4>

            {/* Profits comparison grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-neutral-900/40 border border-neutral-800 p-4 rounded-lg">
                <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block">Standardowy Zysk Netto</span>
                <div className="text-xl font-bold text-neutral-300 font-mono mt-1">{netProfitNormal.toLocaleString()} PLN</div>
                <span className="text-[9px] text-neutral-500 block mt-1">Przy zbieżności x1.0 LTV</span>
              </div>

              <div className="bg-gradient-to-br from-blue-950/20 to-indigo-950/10 border border-blue-500/30 p-4 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.06)]">
                <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest font-bold block">OMEGA PRO ZYSK NETTO</span>
                <div className="text-2xl font-black text-blue-400 font-mono mt-1">{netProfitPro.toLocaleString()} PLN</div>
                <span className="text-[9px] text-blue-400/80 block mt-1 font-mono">Zysk po optymalizacji LTV x{upsellRate.toFixed(1)}</span>
              </div>
            </div>

            {/* Incremental premium booster box */}
            <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold tracking-wider block">DODATKOWY PRO GENEROWANY PRZYCHÓD (INCREMENTAL GAIN)</span>
                <p className="text-[11px] text-neutral-400 mt-0.5">Zysk z automatycznej wielozadaniowej ścieżki i lejków.</p>
              </div>
              <div className="text-right shrink-0">
                <div className="text-lg font-black text-emerald-400 font-mono">+{incrementalGain.toLocaleString()} PLN</div>
                <span className="text-[9px] text-neutral-500 font-mono">Miesiąc do miesiąca</span>
              </div>
            </div>

            {/* Live advice hint */}
            <div className="text-xs text-neutral-400 leading-relaxed bg-neutral-900 p-3 rounded-lg border border-neutral-850 flex items-start gap-2">
              <Zap className="text-amber-400 shrink-0 mt-0.5" size={14} />
              <div>
                <strong className="text-neutral-200">Wektorowa synergia PRO:</strong> Wykorzystanie silnika asynchronicznej sprzedaży pozwala na jednoczesne obsługiwanie <strong>{Math.ceil(15 * upsellRate)}</strong> kampanii bez dodatkowego zatrudnienia, tnąc koszty o blisko <strong>{Math.round(45 * upsellRate)}%</strong>.
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleGenerateStrategy}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500 shadow-[0_4px_25px_rgba(59,130,246,0.3)] text-white text-xs font-bold font-mono tracking-widest rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer uppercase"
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  ANALIZOWANIE PRZEPUSTOWOŚCI I EMISJI...
                </>
              ) : (
                <>
                  <Brain size={14} className="animate-pulse" />
                  Uruchom Optymalizator Zysków PRO (Gemini Brain)
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* AI Strategy Result Window */}
      <AnimatePresence>
        {strategyResult && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-8 border-t border-neutral-800 pt-6 space-y-4"
          >
            <div className="flex justify-between items-center bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-blue-500/20 text-blue-400 rounded">
                  <Sparkles size={14} />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider">OMEGA PRO REVENUE MAP (DOKUMENT WYGENEROWANY)</h4>
                  <p className="text-[10px] text-neutral-400">Analiza przeprowadzona przez Gemini Flash-Lite. Przewidywany ROI: <strong className="text-emerald-400 font-mono">+{Math.round((incrementalGain / (monthlyExpenses || 1)) * 100)}%</strong></p>
                </div>
              </div>
              <button
                onClick={handleCopy}
                className="p-1 px-2.5 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-xs text-neutral-300 font-mono font-semibold rounded flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Copy size={12} />
                KOPIUJ PLANSZĘ
              </button>
            </div>

            {/* Generated strategic roadmap paper */}
            <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-5 space-y-3 font-sans max-h-96 overflow-y-auto scrollbar-thin">
              <div className="prose prose-invert prose-xs max-w-none">
                {renderFormattedText(strategyResult.strategy)}
              </div>
            </div>

            <div className="bg-blue-950/20 border border-blue-900/30 rounded-lg p-3 text-center text-[11px] text-blue-400/90 font-mono">
              ★ Przypisz zadania z planu bezpośrednio do odpowiednich modułów w lewym menu bocznym w celu asynchronicznej realizacji.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
