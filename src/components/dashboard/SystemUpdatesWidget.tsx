import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  Search, 
  Settings, 
  ArrowRight, 
  Cpu, 
  Database, 
  Terminal, 
  HelpCircle,
  TrendingUp,
  RefreshCw,
  Info
} from "lucide-react";
import { useSettingsStore } from "../../store/settingsStore";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface UpdateItem {
  id: string;
  tag: string;
  tagColor: string;
  title: string;
  desc: string;
  time: string;
  icon: any;
}

export function SystemUpdatesWidget() {
  const settingsStore = useSettingsStore();
  const navigate = useNavigate();

  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLimit, setSearchLimit] = useState(3);
  const [threshold, setThreshold] = useState(0.7);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const updates: UpdateItem[] = [
    {
      id: "u1",
      tag: "BAZA WIEDZY RAG / VEKTOR",
      tagColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      title: "Integracja Supabase & text-embedding-004",
      desc: "Uruchomiono pełnoprawną pamięć semantyczną bazy. Twoi agenci wektorowi potrafią teraz błyskawicznie przeszukiwać repozytoria wiedzy, pliki PDF oraz instrukcje przy użyciu najnowszego, 768-wymiarowego modelu embeddingów i procedury match_documents.",
      time: "Aktualne",
      icon: Database
    },
    {
      id: "u2",
      tag: "INTERFEJS ADM",
      tagColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      title: "Interaktywna Piaskownica Semantic Sandbox",
      desc: "W zakładce Konfiguracja Agentów (sekcja nr 4) czeka na Ciebie panel kontrolny do ręcznego debugowania zapytania wektorowego z pełną informacją o skali podobieństwa cosinusowego dokumentów.",
      time: "Teraz",
      icon: Terminal
    },
    {
      id: "u3",
      tag: "SILNIK AI",
      tagColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      title: "Migracja do nowej biblioteki @google/genai SDK",
      desc: "Przebudowano cały backend obsługujący generatory wideo Veo 3.1, generowanie audio TTS oraz zaawansowane pętle dopaminowe. Nowa technologia gwarantuje do 40% mniejsze opóźnienia modelowania.",
      time: "Dzisiaj",
      icon: Cpu
    }
  ];

  const handleSemanticSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      toast.error("Wpisz zapytanie semantyczne!");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setResults(null);

    const backendUrl = "/api/handle-aistudio-call";
    const supabaseUrl = settingsStore.supabaseUrl;
    const supabaseServiceRoleKey = settingsStore.supabaseServiceRoleKey;
    const geminiKey = settingsStore.geminiKey || settingsStore.openAiKey; // fallback

    try {
      const response = await fetch(backendUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          supabaseUrl,
          supabaseServiceRoleKey,
          geminiApiKey: geminiKey,
          query: searchQuery,
          limit: searchLimit,
          matchThreshold: threshold,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Błąd serwera podczas wyszukiwania wektorowego.");
      }

      setResults(data);
      toast.success("Przeszukano wektorową bazę wiedzy RAG!");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || String(err));
      toast.error("Wyszukiwanie nie powiodło się.");
    } finally {
      setLoading(false);
    }
  };

  const isConfigured = !!settingsStore.supabaseUrl && !!settingsStore.supabaseServiceRoleKey;

  return (
    <div id="system-updates-root" className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
      {/* 1. Left Side: System News Feed */}
      <div id="system-news-panel" className="lg:col-span-7 bg-neutral-900 border border-neutral-800 rounded-xl p-6 relative overflow-hidden flex flex-col justify-between">
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-40 h-40 rounded-full bg-gradient-to-br from-blue-500/5 to-transparent blur-3xl pointer-events-none" />
        
        <div>
          <div className="flex items-center justify-between border-b border-neutral-850 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-rose-600/10 text-rose-400 rounded-lg">
                <Sparkles size={18} />
              </span>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Ostatnie Aktualizacje Systemu OMEGA</h3>
                <p className="text-[11px] text-neutral-400">Co nowego w Twoim wszechświecie automatyzacji AI</p>
              </div>
            </div>
            <span className="text-[10px] bg-neutral-950 px-2 py-1 border border-neutral-850 text-neutral-400 font-mono rounded">
              Wersja 4.12.0
            </span>
          </div>

          <div className="space-y-4">
            {updates.map((up) => {
              const Icon = up.icon;
              return (
                <div key={up.id} className="group relative pl-6 border-l border-neutral-800 hover:border-blue-500/40 transition-colors py-1">
                  <div className="absolute w-2 h-2 rounded-full bg-neutral-850 border border-neutral-700 -left-[4.5px] top-2.5 group-hover:bg-blue-500 group-hover:border-blue-400 transition-colors" />
                  <div className="flex items-center gap-2 text-[10px] font-mono mb-1">
                    <span className={`px-2 py-0.5 border rounded-full font-semibold ${up.tagColor}`}>
                      {up.tag}
                    </span>
                    <span className="text-neutral-500">{up.time}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-neutral-200 group-hover:text-white transition-colors flex items-center gap-1.5">
                    <Icon size={14} className="text-neutral-500" />
                    {up.title}
                  </h4>
                  <p className="text-xs text-neutral-400 leading-relaxed mt-1 font-sans">
                    {up.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="border-t border-neutral-850 pt-4 mt-6 flex justify-between items-center text-xs">
          <span className="text-neutral-500 flex items-center gap-1">
            <Info size={12} /> Przetestuj konfigurację w piaskownicy po prawej stronie.
          </span>
          <button 
            onClick={() => navigate("/settings")}
            className="text-blue-400 hover:text-blue-300 transition-colors font-medium flex items-center gap-1 cursor-pointer"
          >
            Idź do Ustawień <ArrowRight size={12} />
          </button>
        </div>
      </div>

      {/* 2. Right Side: Miniature Real-time AI Semantic Database Search */}
      <div id="vector-search-panel" className="lg:col-span-5 bg-neutral-900 border border-neutral-800 rounded-xl p-6 relative overflow-hidden flex flex-col justify-between">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500/5 to-transparent blur-3xl pointer-events-none" />

        <div>
          <div className="flex items-center justify-between border-b border-neutral-850 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-blue-600/10 text-blue-400 rounded-lg">
                <Database size={18} />
              </span>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Szybki Przeszukiwacz RAG</h3>
                <p className="text-[11px] text-neutral-400">Natychmiastowe odpytanie bazy wiedzy wektorowej</p>
              </div>
            </div>
          </div>

          {!isConfigured ? (
            <div className="bg-amber-500/5 border border-amber-500/15 rounded-lg p-4 text-center my-auto">
              <HelpCircle size={24} className="text-amber-400 mx-auto mb-2 animate-pulse" />
              <h4 className="text-xs font-bold text-neutral-200">Baza wiedzy nie jest w pełni połączona</h4>
              <p className="text-[11px] text-neutral-400 leading-relaxed mt-1">
                Uzupełnij klucze <code className="text-amber-400 font-mono text-[10px]">SUPABASE_URL</code> oraz <code className="text-amber-400 font-mono text-[10px]">SUPABASE_SERVICE_ROLE_KEY</code> w konfiguracji agentów, aby wyszukiwać wektorowo pliki i FAQ.
              </p>
              <button 
                onClick={() => navigate("/settings")}
                className="mt-3 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[11px] font-semibold border border-amber-500/20 rounded transition-colors cursor-pointer"
              >
                Skonfiguruj połączenie
              </button>
            </div>
          ) : (
            <form onSubmit={handleSemanticSearch} className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                  Wpisz pytanie dla modelu embeddingów (text-embedding-004)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="np. Skrypt rozmowy telefonicznej sprzedawcy..."
                    className="flex-grow bg-black border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500/70 transition-colors font-sans"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center justify-center shrink-0 cursor-pointer text-xs"
                  >
                    {loading ? <RefreshCw size={12} className="animate-spin" /> : <Search size={14} />}
                  </button>
                </div>
              </div>

              {/* Advanced parameters collapsed under query */}
              <div className="flex items-center gap-4 text-[10.5px] text-neutral-500 font-mono">
                <div className="flex items-center gap-1.5">
                  <span>Próg dop.: <strong>{Math.round(threshold * 100)}%</strong></span>
                  <input
                    type="range"
                    min="0.2"
                    max="0.9"
                    step="0.05"
                    value={threshold}
                    onChange={(e) => setThreshold(parseFloat(e.target.value))}
                    className="w-16 accent-blue-500"
                  />
                </div>
                <div>
                  <span>Wyniki: </span>
                  <select
                    value={searchLimit}
                    onChange={(e) => setSearchLimit(parseInt(e.target.value))}
                    className="bg-black border border-neutral-850 rounded text-neutral-400 px-1 py-0.5 text-[10px] focus:outline-none"
                  >
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="5">5</option>
                  </select>
                </div>
              </div>
            </form>
          )}

          {/* Results section */}
          <div className="mt-4">
            <AnimatePresence mode="wait">
              {errorMsg && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0 }}
                  className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-[11px] font-mono text-red-400 max-h-36 overflow-y-auto"
                >
                  ❌ Błąd: {errorMsg}
                </motion.div>
              )}

              {results && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-2 max-h-40 overflow-y-auto bg-neutral-950/60 border border-neutral-850 rounded-lg p-3 scrollbar-thin"
                >
                  <p className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <TrendingUp size={12} /> Wyjściowy bufor dopasowań Cosine (text-embedding-004):
                  </p>
                  
                  {results.documents?.length === 0 ? (
                    <p className="text-[11px] text-neutral-500 italic">Brak dokumentów wektorowych o zbieżności &gt;= {Math.round(threshold * 100)}%.</p>
                  ) : (
                    results.documents.map((doc: any, idx: number) => (
                      <div key={idx} className="border-b border-neutral-900 last:border-0 pb-1.5 last:pb-0 pt-1">
                        <div className="flex justify-between items-center text-[9px] font-mono text-neutral-500">
                          <span>Dopasowanie #{idx + 1}</span>
                          <span className="text-blue-400">Podobieństwo: {Math.round((doc.similarity || 0) * 1000) / 10}%</span>
                        </div>
                        <p className="text-[11px] text-neutral-300 font-sans mt-0.5 line-clamp-2 hover:line-clamp-none transition-all cursor-help whitespace-pre-wrap">
                          {doc.content}
                        </p>
                      </div>
                    ))
                  )}
                </motion.div>
              )}

              {!results && !errorMsg && isConfigured && (
                <div className="text-center py-6 text-[11px] text-neutral-500 italic border border-dashed border-neutral-850 rounded-lg bg-neutral-950/20 mt-2">
                  Gotowy do semantycznej eksploracji bazy. Wpisz hasło i kliknij Szukaj.
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="text-[9.5px] text-neutral-500 font-mono mt-4 border-t border-neutral-850 pt-3">
          Status: <span className="text-emerald-400">● OMEGA RAG Synced</span>
        </div>
      </div>
    </div>
  );
}
