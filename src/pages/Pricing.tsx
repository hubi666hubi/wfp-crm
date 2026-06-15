import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { collection, onSnapshot, doc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../lib/firebase";
import {
  Coins,
  TrendingUp,
  DollarSign,
  TrendingDown,
  Info,
  Layers,
  ArrowRight,
  Maximize2,
  Lock,
  Compass,
  Zap,
  Briefcase,
  Sliders,
  Target
} from "lucide-react";
import { toast } from "sonner";

interface PricingModelResult {
  recommendedPrice: number;
  expectedLtv: number;
  expectedMrr: number;
  roiRatio: number;
  tiers: {
    name: string;
    price: string;
    features: string[];
    justification: string;
  }[];
}

export function PricingPage() {
  const [currentPrice, setCurrentPrice] = useState(1999);
  const [leadValueEnriched, setLeadValueEnriched] = useState(3000);
  const [churnPrediction, setChurnPrediction] = useState(5.5);
  const [closeRate, setCloseRate] = useState(25);
  const [isCalculating, setIsCalculating] = useState(false);
  const [hasCalculated, setHasCalculated] = useState(true);

  // Sync state with cloud database
  useEffect(() => {
    let unsub = () => {};
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        unsub = onSnapshot(doc(db, "pricing_config", "current"), (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            if (data.currentPrice) setCurrentPrice(data.currentPrice);
            if (data.leadValueEnriched) setLeadValueEnriched(data.leadValueEnriched);
            if (data.churnPrediction) setChurnPrediction(data.churnPrediction);
            if (data.closeRate) setCloseRate(data.closeRate);
          } else {
            setDoc(doc(db, "pricing_config", "current"), {
              currentPrice: 1999,
              leadValueEnriched: 3000,
              churnPrediction: 5.5,
              closeRate: 25
            }).catch(console.error);
          }
        }, (err) => console.error("Pricing snapshot error:", err));
      } else {
        unsub();
      }
    });
    return () => { unsubAuth(); unsub(); };
  }, []);

  const saveToCloud = async (field: string, value: number) => {
    try {
      await setDoc(doc(db, "pricing_config", "current"), { [field]: value }, { merge: true });
    } catch {
      // suppress warning loop
    }
  };

  // Competitor database
  const competitors = [
    { name: "SDR Tech-Agency Ltd", price: 6500, model: "Retainer + prowizja", quality: "Niski (manualna rekrutacja)" },
    { name: "Outbound Automated Corp", price: 3499, model: "Abonament stały", quality: "Średni (sztywne sekwencje)" },
    { name: "Wirtualna Fabryka (Ω Zapalnik)", price: 1999, model: "Dynamiczny / Hybrydowy", quality: "Najwyższy (Wielowątkowi agenci AI)" },
    { name: "Traditional Closer Agency", price: 12000, model: "Wysoka zaliczka + 20%", quality: "Wysoki, ale bardzo drogi" },
  ];

  const handleRunOptimizer = () => {
    setIsCalculating(true);
    setTimeout(() => {
      setIsCalculating(false);
      setHasCalculated(true);
      toast.success("Optymalizacja cenowa 'Oko Opatrzności' zakończona pomyślnie!");
    }, 1200);
  };

  // Derived metrics based on dynamic states
  const recommendedCalculatedPrice = Math.round(leadValueEnriched * (closeRate / 100) * 4.2);
  const estimatedLtvValue = Math.round(recommendedCalculatedPrice / (churnPrediction / 100));
  const estimatedMrrValue = Math.round(recommendedCalculatedPrice * 18);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-neutral-900 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg">
              <Compass size={24} className="animate-spin" style={{ animationDuration: "12s" }} />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">OKO OPATRZNOŚCI (Pricing Optimizer)</h1>
          </div>
          <p className="text-sm text-neutral-400 mt-1 font-sans">
            Moduł optymalizacji polityki cenowej, analizy elastyczności popytu, estymacji LTV i zaawansowanego modelowania high-ticket pod kątem maksymalnej marży z kampanii.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Parameters panel */}
        <div className="bg-neutral-950 border border-neutral-900 rounded-3xl p-6 space-y-6 lg:col-span-1">
          <div className="flex items-center gap-2 border-b border-neutral-900 pb-3">
            <Sliders size={16} className="text-rose-400" />
            <h3 className="text-sm font-bold tracking-widest text-neutral-200 font-mono uppercase">
              Zmienne Operacyjne
            </h3>
          </div>

          {/* Slider 1: Current Price */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-neutral-400 font-sans">Próg barierowy (Cena PLN)</span>
              <span className="text-white font-extrabold">{currentPrice} PLN / msc</span>
            </div>
            <input
              type="range"
              min="999"
              max="9999"
              step="100"
              value={currentPrice}
              onChange={(e) => {
                const val = Number(e.target.value);
                setCurrentPrice(val);
                saveToCloud("currentPrice", val);
              }}
              className="w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
          </div>

          {/* Slider 2: Average Lead Worth */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-neutral-400 font-sans">Wartość ACV leada (PLN)</span>
              <span className="text-white font-extrabold">{leadValueEnriched} PLN</span>
            </div>
            <input
              type="range"
              min="1000"
              max="25000"
              step="500"
              value={leadValueEnriched}
              onChange={(e) => {
                const val = Number(e.target.value);
                setLeadValueEnriched(val);
                saveToCloud("leadValueEnriched", val);
              }}
              className="w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
          </div>

          {/* Slider 3: Churn Prediction */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-neutral-400 font-sans">Przewidywany Churn (%)</span>
              <span className="text-rose-400 font-extrabold">{churnPrediction}%</span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              step="0.5"
              value={churnPrediction}
              onChange={(e) => {
                const val = Number(e.target.value);
                setChurnPrediction(val);
                saveToCloud("churnPrediction", val);
              }}
              className="w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
          </div>

          {/* Slider 4: Close Rate */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-neutral-400 font-sans">Współczynnik zamknięcia (%)</span>
              <span className="text-emerald-400 font-extrabold">{closeRate}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="60"
              step="1"
              value={closeRate}
              onChange={(e) => {
                const val = Number(e.target.value);
                setCloseRate(val);
                saveToCloud("closeRate", val);
              }}
              className="w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
          </div>

          <button
            onClick={handleRunOptimizer}
            disabled={isCalculating}
            className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-black tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(225,29,72,0.3)] cursor-pointer"
          >
            {isCalculating ? "RE-KALKULACJA ELASTYCZNOŚCI..." : "ESTYMUJ STRUKTURĘ CENOWĄ"}
          </button>
        </div>

        {/* Right Side: Projections & Benchmark Results */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Metric 1 */}
            <div className="bg-neutral-950 border border-neutral-900 p-5 rounded-2xl flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono text-neutral-500 tracking-wider block uppercase">
                  Zalecana Optymalna Cena
                </span>
                <span className="text-2xl font-black text-emerald-400 font-mono block mt-1">
                  {recommendedCalculatedPrice} PLN / mc
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 mt-2 font-sans leading-relaxed">
                Próg oparty na wartości (Value-Based Pricing) zapewniający optymalny stopień domknięcia.
              </p>
            </div>

            {/* Metric 2 */}
            <div className="bg-neutral-950 border border-neutral-900 p-5 rounded-2xl flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono text-neutral-500 tracking-wider block uppercase">
                  Wskaźnik LTV na Klienta
                </span>
                <span className="text-2xl font-black text-rose-500 font-mono block mt-1">
                  {estimatedLtvValue} PLN
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 mt-2 font-sans leading-relaxed">
                Szacowany ekwiwalent przychodu z jednego wdrożonego klienta przy obecnym churnie.
              </p>
            </div>

            {/* Metric 3 */}
            <div className="bg-neutral-950 border border-neutral-900 p-5 rounded-2xl flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono text-neutral-500 tracking-wider block uppercase">
                  Projektowany MRR w 180 dni
                </span>
                <span className="text-2xl font-black text-amber-500 font-mono block mt-1">
                  {estimatedMrrValue} PLN
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 mt-2 font-sans leading-relaxed">
                Roczna wartość powtarzalnego wzrostu przy stałym dopływie 3 wdrożeń miesięcznie.
              </p>
            </div>
          </div>

          {/* Competitor Benchmark Grid */}
          <div className="bg-neutral-950 border border-neutral-900 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-neutral-900 bg-neutral-950/50">
              <span className="text-[11px] font-bold tracking-widest text-neutral-400 font-mono uppercase">
                POZYCJONOWANIE RYNKOWE ORAZ BAZA BENCHMARKÓW KONKURENCJI
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-neutral-900 text-neutral-500 font-mono text-[10px]">
                    <th className="p-4 uppercase">Nazwa Podmiotu</th>
                    <th className="p-4 uppercase">Sugerowana Oferta</th>
                    <th className="p-4 uppercase">Model Rozliczeniowy</th>
                    <th className="p-4 text-rose-400 uppercase">Ocena Techniczna</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900">
                  {competitors.map((comp, idx) => (
                    <tr key={idx} className="hover:bg-neutral-950/60 transition-colors">
                      <td className="p-4 font-bold text-neutral-200">{comp.name}</td>
                      <td className="p-4 font-mono font-semibold text-neutral-300">{comp.price} PLN</td>
                      <td className="p-4 text-neutral-400 font-sans">{comp.model}</td>
                      <td className={`p-4 font-semibold ${idx === 2 ? "text-emerald-400 font-mono font-bold" : "text-neutral-400"}`}>
                        {comp.quality}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Generated High-Ticket Strategic Packages recommendation */}
          <div className="bg-neutral-950 border border-neutral-900 rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold tracking-widest text-neutral-200 font-mono uppercase flex items-center gap-2">
              <Layers size={14} className="text-rose-500" />
              Zalecana Architektura Pakietowa High-Ticket
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-neutral-900/60 p-5 border border-neutral-850 rounded-2xl space-y-2">
                <span className="text-[9px] font-mono text-neutral-500 font-extrabold uppercase">
                  WPROWDZENIE / PILOTAŻ
                </span>
                <h4 className="text-sm font-extrabold text-white">Starter Outbound Sprint (S.O.S.)</h4>
                <p className="text-neutral-400 text-xs leading-relaxed">
                  Pilotażowe wdrożenie Zapalnika na 14 dni za kwotę <strong>2500 PLN</strong> jednorazowo. Obejmuje pełne podpięcie API i 1 procesor AI badający rynek.
                </p>
              </div>

              <div className="bg-neutral-900/60 p-5 border border-rose-950/40 rounded-2xl space-y-2 relative">
                <span className="absolute top-4 right-4 text-[9px] font-mono font-black text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded">
                  POLECANE
                </span>
                <span className="text-[9px] font-mono text-rose-400 font-extrabold uppercase">
                  SYSTEM CORE ABONAMENT
                </span>
                <h4 className="text-sm font-extrabold text-rose-200">Wielorozgałęźna Fabryka (Omega PRO)</h4>
                <p className="text-neutral-300 text-xs leading-relaxed">
                  Cykliczny plan w kwocie <strong>4900 PLN / msc</strong>. Uruchomienie Zwiadowców na LinkedIn i Reddicie, sekwencje dopaminowe, integracja automatycznego podcastu i dashboardu CRM.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
