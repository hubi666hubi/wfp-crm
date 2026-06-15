import { useState, useEffect } from "react";
import { collection, onSnapshot, updateDoc, doc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../lib/firebase";
import { motion, AnimatePresence } from "motion/react";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Globe,
  AlertTriangle,
  RefreshCw,
  Search,
  BookOpen,
  Eye,
  MessageSquare,
  Users,
  Send,
  Sparkles,
  ArrowRight,
  Target
} from "lucide-react";
import { toast } from "sonner";

interface ThreatLog {
  id: string;
  source: string;
  platform: string;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  timestamp: string;
  status: "unresolved" | "monitoring" | "neutralized";
}

export function ShieldPage() {
  const [logs, setLogs] = useState<ThreatLog[]>([]);

  useEffect(() => {
    let unsubscribe = () => {};
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        unsubscribe = onSnapshot(collection(db, "shield_logs"), (snapshot) => {
          if (snapshot.empty) {
            // Seed initial data if empty
            const initialLogs: ThreatLog[] = [
              {
                id: "th-1",
                source: "Wyciek na Wykop/Gowork",
                platform: "GoWork",
                severity: "high",
                message: "Podszywanie się pod niezadowolonego klienta, oskarżenia o spamerski model outbound w kampanii Zapalnika.",
                timestamp: new Date().toISOString(),
                status: "unresolved",
              },
              {
                id: "th-2",
                source: "Weryfikacja na FB Groups",
                platform: "Facebook",
                severity: "medium",
                message: "Wątek w grupie marketingowców kwestionujący legalność zautomatyzowanego dystrybutora treści.",
                timestamp: new Date().toISOString(),
                status: "monitoring",
              }
            ];
            initialLogs.forEach(lg => setDoc(doc(db, "shield_logs", lg.id), lg));
          } else {
            const fetchedLogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ThreatLog));
            setLogs(fetchedLogs);
          }
        }, (error) => console.error("Shield logs snapshot error:", error));
      } else {
        unsubscribe();
      }
    });
    return () => { unsubAuth(); unsubscribe(); };
  }, []);

  const [activeTab, setActiveTab] = useState<"monitor" | "generator" | "counter-strategy">("monitor");
  const [criticalAttackInput, setCriticalAttackInput] = useState("");
  const [defenseResponse, setDefenseResponse] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // AI shield response generator
  const handleGenerateDefense = () => {
    if (!criticalAttackInput.trim()) {
      toast.error("Wprowadź treść ataku lub zarzutu PR, aby wygenerować tarczę!");
      return;
    }
    setLoadingAI(true);
    setDefenseResponse(null);

    setTimeout(() => {
      // High-quality tactical reply blueprint
      const simulatedDefense = `[TARCZA OCHRONNA CORE OMEGA ACTIVATED]

1. ANALIZA RYZYKA I INTENCJI:
- Typ ataku: Negatywna narracja konkurencji / Atak na wiarygodność techniczną.
- Wektor wpływu: Wywołanie FUD (Fear, Uncertainty, Doubt) u nowych leadów.

2. SUGEROWANA ODPOWIEDŹ PUBLICZNA (Neutralizacja kryzysu):
"Doceniamy każdą informację zwrotną. Wirtualna Fabryka Produktów działa w oparciu o w pełni legalne i certyfikowane API Facebook (Zasady Meta Platform) oraz protokoły Google OAuth2. Nasze automatyzacje nie są 'spamerami' - to precyzyjnie targetowane, zindywidualizowane systemy wsparcia sprzedaży. Chętnie zaprezentujemy pełną transparentność techniczną podczas bezpośredniej rozmowy wdrożeniowej."

3. DZIAŁANIE ASYMETRYCZNE (Cicha kampania przeciwwagi):
- Uruchomić Zwiadowców na Reddicie i grupach FB, aby wstawiali prawdziwe, pozytywne case studies w tym samym wątku.
- Przekierować ruch zaniepokojonych użytkowników na dedykowaną stronę 'SLA & Safety' uciekając od kłótni komentarzowej.
- Automatycznie oflagować konto atakujące jako potencjalny syndykat botów.`;
      
      setDefenseResponse(simulatedDefense);
      setLoadingAI(false);
      toast.success("Odprawa tarczy obronnej wygenerowana!");
    }, 1800);
  };

  const handleTriggerQuickScan = () => {
    setIsScanning(true);
    toast.info("Uruchamianie satelitarnego pasma nasłuchu social media...");
    
    setTimeout(() => {
      setIsScanning(false);
      toast.success("Skan zakończony powodzeniem. Nie wykryto nowych krytycznych zagrożeń PR.");
    }, 2000);
  };

  const handleResolveThreat = async (id: string) => {
    try {
      await updateDoc(doc(db, "shield_logs", id), { status: "neutralized" });
      toast.success("Zagrożenie oznaczone jako zneutralizowane i zabezpieczone.");
    } catch {
      toast.error("Błąd podczas aktualizacji w chmurze.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Upper info section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-neutral-900 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg">
              <Shield size={24} className="animate-pulse" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">TARCZA OCHRONNA (Black PR Defector)</h1>
          </div>
          <p className="text-sm text-neutral-400 mt-1 font-sans">
            Asynchroniczny moduł monitorowania wizerunku firmy w przestrzeni medialnej, wykrywający kampanie deprecjonujące oraz generujący odprawy odpornościowe.
          </p>
        </div>
        <button
          onClick={handleTriggerQuickScan}
          disabled={isScanning}
          className="flex items-center gap-2 px-4 py-2.5 bg-white text-black font-semibold rounded-lg hover:bg-neutral-200 transition-all text-xs font-mono"
        >
          <RefreshCw size={14} className={isScanning ? "animate-spin" : ""} />
          {isScanning ? "SKANOWANIE MEDIÓW..." : "SKANUJ MEDIA TERAZ"}
        </button>
      </div>

      {/* Navigation tabs for Shield */}
      <div className="flex gap-2 border-b border-neutral-900 pb-2 bg-neutral-950/20 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab("monitor")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold rounded-lg transition-all border ${
            activeTab === "monitor"
              ? "bg-rose-500/10 text-rose-300 border-rose-500/40"
              : "border-transparent text-neutral-400 hover:text-neutral-200"
          }`}
        >
          <ShieldAlert size={14} />
          MONITOR DEPRECJACJI ({logs.filter(l => l.status !== "neutralized").length})
        </button>
        <button
          onClick={() => setActiveTab("generator")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold rounded-lg transition-all border ${
            activeTab === "generator"
              ? "bg-rose-500/10 text-rose-300 border-rose-500/40"
              : "border-transparent text-neutral-400 hover:text-neutral-200"
          }`}
        >
          <Sparkles size={14} />
          GENERATOR STRATAGEM PR
        </button>
        <button
          onClick={() => setActiveTab("counter-strategy")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold rounded-lg transition-all border ${
            activeTab === "counter-strategy"
              ? "bg-rose-500/10 text-rose-300 border-rose-500/40"
              : "border-transparent text-neutral-400 hover:text-neutral-200"
          }`}
        >
          <Target size={14} />
          METODYKA ASYMETRYCZNA
        </button>
      </div>

      {/* Tab Contents */}
      <AnimatePresence mode="wait">
        {activeTab === "monitor" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* System overview meter */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-neutral-950/60 border border-neutral-900 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold text-neutral-500 tracking-wider block uppercase">
                    Indeks Toksyczności Otoczenia
                  </span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-4xl font-black text-rose-500 font-mono">14%</span>
                    <span className="text-xs text-neutral-400">Niski poziom zagrożenia</span>
                  </div>
                </div>
                <div className="w-full bg-neutral-900 h-2 rounded-full mt-4 overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full" style={{ width: "14%" }} />
                </div>
              </div>

              <div className="bg-neutral-950/60 border border-neutral-900 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold text-neutral-500 tracking-wider block uppercase">
                    Czynne Ataki Wizerunkowe
                  </span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-4xl font-black text-amber-500 font-mono">2</span>
                    <span className="text-xs text-neutral-400">wątki wymagają natychmiastowej akcji</span>
                  </div>
                </div>
                <div className="text-xs font-mono text-neutral-500 mt-4 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  STAN: CZUWANIE STRATEGICZNE
                </div>
              </div>

              <div className="bg-neutral-950/60 border border-neutral-900 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold text-neutral-500 tracking-wider block uppercase">
                    Stabilność Zaplecza Prasowego
                  </span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-4xl font-black text-emerald-400 font-mono">98.2%</span>
                    <span className="text-xs text-neutral-400">Certyfikowana autentyczność</span>
                  </div>
                </div>
                <div className="text-[10px] font-mono text-emerald-400/80 mt-4 bg-emerald-950/20 border border-emerald-900/30 px-2.5 py-1 rounded-md self-start">
                  Brak wycieków baz danych
                </div>
              </div>
            </div>

            {/* List of active threats */}
            <div className="bg-neutral-950 border border-neutral-900 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-neutral-900 flex justify-between items-center bg-neutral-950/50">
                <span className="text-[11px] font-bold tracking-widest text-neutral-400 font-mono uppercase">
                  Odsłuchane Zagrożenia Wizerunkowe (Live Engine Tracker)
                </span>
                <span className="text-[10px] font-mono text-neutral-500">
                  AUTO-Skan: Co 5 min
                </span>
              </div>

              <div className="divide-y divide-neutral-900">
                {logs.map((log) => {
                  const severityStyles = {
                    low: "bg-blue-500/10 text-blue-400 border-blue-500/20",
                    medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
                    high: "bg-pink-500/10 text-pink-400 border-pink-500/20",
                    critical: "bg-rose-600/10 text-rose-400 border-rose-600/30 font-black animate-pulse",
                  };

                  const statusStyles = {
                    unresolved: "text-rose-500 bg-rose-500/10 border-rose-500/20",
                    monitoring: "text-amber-500 bg-amber-500/10 border-amber-500/20",
                    neutralized: "text-emerald-400 bg-emerald-500/10 border-emerald-400/20 line-through",
                  };

                  return (
                    <div key={log.id} className={`p-5 flex flex-col md:flex-row justify-between gap-4 transition-all ${log.status === "neutralized" ? "opacity-60 bg-neutral-950/20" : "hover:bg-neutral-950/40"}`}>
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-mono font-bold text-white bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded-md">
                            {log.platform}
                          </span>
                          <span className={`text-[9.5px] font-mono font-semibold px-2 py-0.5 border rounded-md uppercase ${severityStyles[log.severity]}`}>
                            PIORYTET: {log.severity}
                          </span>
                          <span className={`text-[9.5px] font-mono font-semibold px-2 py-0.5 border rounded-md uppercase ${statusStyles[log.status]}`}>
                            {log.status === "unresolved" ? "Aktywny" : log.status === "monitoring" ? "Obserwowany" : "Zneutralizowany"}
                          </span>
                          <span className="text-[10px] text-neutral-500 font-mono ml-auto md:ml-0">
                            {log.timestamp}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-neutral-100">{log.source}</h3>
                        <p className="text-neutral-400 text-xs leading-relaxed">{log.message}</p>
                      </div>

                      <div className="flex items-center gap-2 self-start md:self-center">
                        {log.status !== "neutralized" && (
                          <>
                            <button
                              onClick={() => {
                                setCriticalAttackInput(log.message);
                                setActiveTab("generator");
                              }}
                              className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Sparkles size={12} /> Tarczuj AI
                            </button>
                            <button
                              onClick={() => handleResolveThreat(log.id)}
                              className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <ShieldCheck size={12} /> Rozwiąż
                            </button>
                          </>
                        )}
                        {log.status === "neutralized" && (
                          <div className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                            <ShieldCheck size={14} /> Bezpieczny
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "generator" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Input area */}
            <div className="bg-neutral-950 border border-neutral-900 rounded-3xl p-6 space-y-4">
              <h3 className="text-lg font-black text-rose-50 flex items-center gap-2 tracking-tight">
                <Sparkles className="text-rose-400 shrink-0" size={18} /> GENERATOR ODPOWIEDZI TARCZY AI
              </h3>
              <p className="text-neutral-400 text-xs leading-relaxed">
                Wklej treść niesprawiedliwego ataku konkurencji, oszczerstwa PR, złego komentarza na grupie FB lub zarzutów ze strony niezadowolonych użytkowników. Procesor wizerunkowy Omega wygeneruje asymetryczną odpowiedź i chroniący biznes kontr-stratagem.
              </p>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest block">
                  Treść ataku lub postu kryzysowego:
                </label>
                <textarea
                  value={criticalAttackInput}
                  onChange={(e) => setCriticalAttackInput(e.target.value)}
                  placeholder="np.: 'WFP to oszustwo, ich boty zaspamowały moją skrzynkę na LinkedIn, a raport z VSL to zwykły plagiat! Ostrzegam przed tą firmą!'"
                  rows={6}
                  className="w-full text-xs bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500/40 tracking-wide leading-relaxed font-sans"
                />
              </div>

              <button
                onClick={handleGenerateDefense}
                disabled={loadingAI}
                className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 text-xs font-mono cursor-pointer shadow-[0_0_20px_rgba(225,29,72,0.3)] hover:shadow-[0_0_30px_rgba(225,29,72,0.5)]"
              >
                {loadingAI ? (
                  <>
                    <RefreshCw className="animate-spin" size={14} /> ANALIZA SYSTUACJI WIZERUNKOWEJ...
                  </>
                ) : (
                  <>
                    <Shield size={14} /> WYGENERUJCIE TARCZĘ AMORTYZUJĄCĄ
                  </>
                )}
              </button>
            </div>

            {/* Simulated Output output block */}
            <div className="bg-neutral-950 border border-neutral-900 rounded-3xl p-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="border-b border-neutral-900 pb-3 flex justify-between items-center">
                  <span className="text-[10px] font-mono font-bold text-neutral-400 tracking-wider block uppercase">
                    Wygenerowana Odprawa Anty-FUD & Tarczująca
                  </span>
                  {defenseResponse && (
                    <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] font-mono rounded">
                      TRYB BOJOWY
                    </span>
                  )}
                </div>

                {defenseResponse ? (
                  <pre className="text-white text-xs whitespace-pre-wrap leading-relaxed bg-neutral-900 p-4 border border-neutral-850 rounded-2xl max-h-[350px] overflow-y-auto font-mono custom-scrollbar">
                    {defenseResponse}
                  </pre>
                ) : (
                  <div className="text-center py-20 text-neutral-500 text-xs font-sans space-y-2">
                    <AlertTriangle className="mx-auto text-neutral-600 mb-2" size={24} />
                    Wprowadź treść kryzysowego postu w panelu po lewej stronie, <br />
                    aby wdrożyć procedury tarczy wizerunkowej.
                  </div>
                )}
              </div>

              {defenseResponse && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(defenseResponse);
                    toast.success("Odprawa anty-FUD skopiowana do schowka.");
                  }}
                  className="w-full mt-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 hover:text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  Skopiuj CAŁĄ strategię tarczy
                </button>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === "counter-strategy" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="bg-neutral-950 border border-neutral-900 rounded-3xl p-6 space-y-4">
              <h3 className="text-lg font-black text-rose-50 flex items-center gap-2 tracking-tight">
                <Target className="text-rose-400 shrink-0" size={18} /> STRATEGIA ASYMETRYCZNEGO ZABEZPIECZENIA WIZERUNKU
              </h3>
              <p className="text-neutral-400 text-xs leading-relaxed">
                Aby chronić wysoką marżę i budżet reklamowy przed tzw. "spaleniem" opinii przez konkurencję, wdrożone są cztery nadrzędne automatyczne doktryny bezpieczeństwa:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="p-5 bg-neutral-900 border border-neutral-850 rounded-2xl space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-pink-500/10 text-pink-400 flex items-center justify-center font-mono font-bold text-xs">
                    01
                  </div>
                  <h4 className="text-sm font-bold text-white">Doktryna Amortyzacji Pierwszej Fali</h4>
                  <p className="text-neutral-400 text-xs leading-relaxed">
                    Każdy negatywny post wykryty przez Zwiadowców na Reddicie lub Quora jest natychmiast badany pod kątem kluczowych haseł. Odpowiedź ze strony oficjalnego rzecznika prasowego generuje się w ciągu 60 sekund w panelu administratora.
                  </p>
                </div>

                <div className="p-5 bg-neutral-900 border border-neutral-850 rounded-2xl space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center font-mono font-bold text-xs">
                    02
                  </div>
                  <h4 className="text-sm font-bold text-white">Przekierowanie Semantyczne (Dynamic SLA)</h4>
                  <p className="text-neutral-400 text-xs leading-relaxed">
                    Automatyczne zastępowanie fraz drażliwych na Twoich profilach w celu złagodzenia algorytmów social-media. Algorytm promuje w zamian certyfikaty jakości, gwarancję zwrotu i transparentność procedur.
                  </p>
                </div>

                <div className="p-5 bg-neutral-900 border border-neutral-850 rounded-2xl space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-mono font-bold text-xs">
                    03
                  </div>
                  <h4 className="text-sm font-bold text-white">Autoryzowane Pozytywne Case Studies</h4>
                  <p className="text-neutral-400 text-xs leading-relaxed">
                    Automatyczne wysyłanie rekomendacji systemowych do prawdziwych klientów w CRM o statusie "Sukces" z prośbą o szybkie dodanie szczerej oceny w kluczowych katalogach (Trustpilot, mapy Google), aby rozwodnić spam ataki.
                  </p>
                </div>

                <div className="p-5 bg-neutral-900 border border-neutral-850 rounded-2xl space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-mono font-bold text-xs">
                    04
                  </div>
                  <h4 className="text-sm font-bold text-white">Zaporowe Pozycjonowanie Marki</h4>
                  <p className="text-neutral-400 text-xs leading-relaxed">
                    Budowanie niezależnych sub-domen ze słowami kluczowymi typu [WFP Opinie], [Czy Zapalnik działa], na których publikujemy w pełni transparentne opisy techniczne, neutralizując ataki zanim staną się clickbaitem.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
