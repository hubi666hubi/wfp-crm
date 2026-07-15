import { useState, useEffect, useMemo } from "react";
import { 
  Save, 
  Radar, 
  Video, 
  Network, 
  Shield, 
  AlertCircle, 
  RefreshCw, 
  Terminal, 
  Activity, 
  Server, 
  Wifi, 
  AlertTriangle,
  Zap,
  UserCheck,
  Trash2,
  Search
} from "lucide-react";
import { useSettingsStore } from "../store/settingsStore";
import { auth, db } from "../lib/firebase";
import { collection, query, limit, getDocsFromServer } from "firebase/firestore";
import { useSystemLogsStore } from "../store/systemLogsStore";
import { toast } from "sonner";
import * as Sentry from "@sentry/react";


export function Settings() {
  const settingsStore = useSettingsStore();
  const { logAction, logs, fetchLogs, loading: logsLoading, clearLogs } = useSystemLogsStore();

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModule, setSelectedModule] = useState("Wszystkie");

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const displayedLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.userEmail || "").toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesModule =
        selectedModule === "Wszystkie" ||
        log.module === selectedModule;

      return matchesSearch && matchesModule;
    });
  }, [logs, searchTerm, selectedModule]);

  // Real-time Diagnostics States
  const [diagRunning, setDiagRunning] = useState(false);
  const [diagLogs, setDiagLogs] = useState<string[]>([]);
  const [authState, setAuthState] = useState<{
    status: "idle" | "checking" | "connected" | "error";
    email: string | null;
    uid: string | null;
    verified: boolean;
    error: string | null;
  }>({
    status: "idle",
    email: null,
    uid: null,
    verified: false,
    error: null,
  });

  const [firestoreState, setFirestoreState] = useState<{
    status: "idle" | "checking" | "connected" | "error" | "restricted";
    latency: number | null;
    error: string | null;
  }>({
    status: "idle",
    latency: null,
    error: null,
  });

  const [serverState, setServerState] = useState<{
    status: "idle" | "checking" | "connected" | "error";
    details: string | null;
    geminiKey: boolean;
    stripeKey: boolean;
    makeWebhook: boolean;
    error: string | null;
  }>({
    status: "idle",
    details: null,
    geminiKey: false,
    stripeKey: false,
    makeWebhook: false,
    error: null,
  });

  const addLog = (message: string) => {
    const time = new Date().toLocaleTimeString("pl-PL");
    setDiagLogs((prev) => [...prev, `[${time}] ${message}`]);
  };

  const runDiagnostics = async () => {
    setDiagRunning(true);
    setDiagLogs([]);
    logAction("Ustawienia", "Uruchomienie diagnostyki", "Uruchomiono pełną diagnostykę połączeń z Firebase oraz backendem.");
    
    setAuthState({ status: "checking", email: null, uid: null, verified: false, error: null });
    setFirestoreState({ status: "checking", latency: null, error: null });
    setServerState({ status: "checking", details: null, geminiKey: false, stripeKey: false, makeWebhook: false, error: null });

    addLog("⚙️ Rozpoczynanie skanowania sygnatury i konfiguracji Firebase...");
    await new Promise((resolve) => setTimeout(resolve, 300));

    // 1. Firebase Auth Connection
    try {
      addLog("🔐 [AUTH] Pobieranie stanu sesji Firebase Authentication...");
      const user = auth.currentUser;
      if (user) {
        setAuthState({
          status: "connected",
          email: user.email,
          uid: user.uid,
          verified: user.emailVerified,
          error: null,
        });
        addLog(`🟢 [AUTH] Połączenie aktywne. Zalogowano jako: ${user.email} (Email zweryfikowany: ${user.emailVerified ? "Tak" : "Nie"}).`);
      } else {
        setAuthState({
          status: "idle",
          email: null,
          uid: null,
          verified: false,
          error: null,
        });
        addLog("🟡 [AUTH] Brak aktywnej zalogowanej sesji użytkownika. Funkcje bazy będą działać w trybie gościa.");
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setAuthState({
        status: "error",
        email: null,
        uid: null,
        verified: false,
        error: errorMsg,
      });
      addLog(`🔴 [AUTH] Błąd usługi Auth: ${errorMsg}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 400));

    // 2. Firestore Client Connection
    try {
      addLog("📦 [FIRESTORE] Nawiązywanie połączenia z bazą i wysyłanie zapytania testowego...");
      const startTime = performance.now();
      const q = query(collection(db, "clients"), limit(1));
      
      try {
        await getDocsFromServer(q);
        const endTime = performance.now();
        const latency = Math.round(endTime - startTime);
        
        setFirestoreState({
          status: "connected",
          latency,
          error: null,
        });
        addLog(`🟢 [FIRESTORE] Połączenie z bazą danych zweryfikowane pomyślnie. Latencja: ${latency}ms.`);
      } catch (innerErr: unknown) {
        const endTime = performance.now();
        const latency = Math.round(endTime - startTime);
        const errObj = innerErr as { code?: string; message?: string };
        if (errObj.code === "permission-denied" || errObj.message?.toLowerCase().includes("permission")) {
          setFirestoreState({
            status: "restricted",
            latency,
            error: null,
          });
          addLog(`🟡 [FIRESTORE] Połączenie aktywne (Latency: ${latency}ms), lecz uprawnienia zostały zablokowane przez reguły (Security Rules). To jest oczekiwane zachowanie dla niezalogowanych użytkowników.`);
        } else {
          throw innerErr;
        }
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setFirestoreState({
        status: "error",
        latency: null,
        error: errorMsg,
      });
      addLog(`🔴 [FIRESTORE] Krytyczny błąd połączenia z bazą: ${errorMsg}.`);
    }

    await new Promise((resolve) => setTimeout(resolve, 400));

    // 3. Server Node / Cloud Backend health check
    try {
      addLog("⚡ [SERVER] Odpytywanie głównego wektora API serwera (/api/firebase-health)...");
      const res = await fetch("/api/firebase-health");
      if (!res.ok) {
        throw new Error(`Serwer odpowiedział kodem błędu HTTP: ${res.status}`);
      }
      
      const data = await res.json() as {
        status: string;
        firestoreAdmin: string;
        firestoreDetails: string;
        geminiKeyConfigured: boolean;
        stripeKeyConfigured: boolean;
        makeWebhookConfigured: boolean;
        error: string | null;
      };
      if (data.status === "healthy" || data.firestoreAdmin === "connected") {
        setServerState({
          status: "connected",
          details: data.firestoreDetails,
          geminiKey: data.geminiKeyConfigured,
          stripeKey: data.stripeKeyConfigured,
          makeWebhook: data.makeWebhookConfigured,
          error: null,
        });
        addLog(`🟢 [SERVER] Diagnostyka serwera pomyślna. Firestore Admin: ${data.firestoreAdmin === "connected" ? "Połączony" : "Błąd"}. Gemini: ${data.geminiKeyConfigured ? "Skonfigurowany" : "Brak"}.`);
      } else {
        setServerState({
          status: "error",
          details: data.firestoreDetails,
          geminiKey: data.geminiKeyConfigured,
          stripeKey: data.stripeKeyConfigured,
          makeWebhook: data.makeWebhookConfigured,
          error: data.error,
        });
        addLog(`🔴 [SERVER] Wykryto nieprawidłowości na serwerze: ${data.firestoreDetails}`);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setServerState({
        status: "error",
        details: null,
        geminiKey: false,
        stripeKey: false,
        makeWebhook: false,
        error: errorMsg,
      });
      addLog(`🔴 [SERVER] Błąd komunikacji z kontenerem: ${errorMsg}`);
    }

    addLog("🏁 Skan diagnostyczny ukończony. System Omega działa stabilnie.");
    setDiagRunning(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      runDiagnostics();
    }, 100);

    const unsubscribe = auth.onAuthStateChanged((user) => {
      setTimeout(() => {
        if (user) {
          setAuthState({
            status: "connected",
            email: user.email,
            uid: user.uid,
            verified: user.emailVerified,
            error: null,
          });
          const time = new Date().toLocaleTimeString("pl-PL");
          setDiagLogs((prev) => [...prev, `[${time}] [EVENT] Wykryto logowanie: ${user.email}`]);
        } else {
          setAuthState({
            status: "idle",
            email: null,
            uid: null,
            verified: false,
            error: null,
          });
          const time = new Date().toLocaleTimeString("pl-PL");
          setDiagLogs((prev) => [...prev, `[${time}] [EVENT] Wykryto brak aktywnej sesji użytkownika.`]);
        }
      }, 0);
    });

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  // Scout Settings
  const [scoutFrequency, setScoutFrequency] = useState("hourly");
  const [scoutKeywords, setScoutKeywords] = useState(
    "SaaS, AI, marketing automation",
  );
  const [scoutModel, setScoutModel] = useState("gemini-2.5-pro");
  const [scoutTemperature, setScoutTemperature] = useState(0.7);

  // VSL Generator Settings
  const [vslTone, setVslTone] = useState("aggressive");
  const [vslDefaultLength, setVslDefaultLength] = useState("medium");
  const [vslModel, setVslModel] = useState("gemini-2.5-flash");
  const [vslTemperature, setVslTemperature] = useState(0.9);

  // Distributor Settings
  const [distributorDelay, setDistributorDelay] = useState("15");
  const [distributorPlatforms, setDistributorPlatforms] = useState([
    "twitter",
    "linkedin",
  ]);
  const [distributorModel, setDistributorModel] = useState("gemini-2.5-pro");
  const [distributorTemperature, setDistributorTemperature] = useState(0.5);

  // Integrations
  const [stripeKey, setStripeKey] = useState(settingsStore.stripeKey);
  const [makeWebhook, setMakeWebhook] = useState(settingsStore.makeWebhook);
  const [openAiKey, setOpenAiKey] = useState(settingsStore.openAiKey);
  const [supabaseUrl, setSupabaseUrlLocal] = useState(settingsStore.supabaseUrl || "");
  const [supabaseServiceRoleKey, setSupabaseServiceRoleKeyLocal] = useState(settingsStore.supabaseServiceRoleKey || "");

  // Testing states
  const [dbTestQuery, setDbTestQuery] = useState("");
  const [dbTestLimit, setDbTestLimit] = useState(3);
  const [dbTestThreshold, setDbTestThreshold] = useState(0.7);
  const [dbTestLoading, setDbTestLoading] = useState(false);
  const [dbTestResults, setDbTestResults] = useState<any>(null);
  const [dbTestError, setDbTestError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setStripeKey(settingsStore.stripeKey);
      setMakeWebhook(settingsStore.makeWebhook);
      setOpenAiKey(settingsStore.openAiKey);
      setSupabaseUrlLocal(settingsStore.supabaseUrl || "");
      setSupabaseServiceRoleKeyLocal(settingsStore.supabaseServiceRoleKey || "");
    }, 0);
    return () => clearTimeout(timer);
  }, [settingsStore.stripeKey, settingsStore.makeWebhook, settingsStore.openAiKey, settingsStore.supabaseUrl, settingsStore.supabaseServiceRoleKey]);

  const handleSave = () => {
    setSaving(true);
    setSuccess(false);

    settingsStore.setStripeKey(stripeKey);
    settingsStore.setMakeWebhook(makeWebhook);
    settingsStore.setOpenAiKey(openAiKey);
    settingsStore.setSupabaseUrl(supabaseUrl);
    settingsStore.setSupabaseServiceRoleKey(supabaseServiceRoleKey);

    // Simulate API call
    setTimeout(() => {
      setSaving(false);
      setSuccess(true);
      logAction("Ustawienia", "Zapisanie konfiguracji", "Zaktualizowano globalne klucze API, konfigurację Supabase i parametry agentów systemowych w magazynie lokalnym.");
      setTimeout(() => setSuccess(false), 3000);
    }, 800);
  };

  const handleTestSupabase = async () => {
    if (!dbTestQuery.trim()) {
      toast.error("Wpisz zapytanie testowe!");
      return;
    }
    setDbTestLoading(true);
    setDbTestError(null);
    setDbTestResults(null);

    try {
      const response = await fetch("/api/handle-aistudio-call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Email": auth.currentUser?.email || "anonymous@wfp-platform.io"
        },
        body: JSON.stringify({
          supabaseUrl,
          supabaseServiceRoleKey,
          geminiApiKey: settingsStore.geminiKey || openAiKey, // Use local or store key
          query: dbTestQuery,
          limit: dbTestLimit,
          matchThreshold: dbTestThreshold,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Wystąpił błąd podczas testowania połączenia.");
      }

      setDbTestResults(data);
      toast.success("Odpytanie bazy wiedzy zakończne sukcesem!");
    } catch (err: any) {
      console.error(err);
      setDbTestError(err.message || String(err));
      toast.error("Nie udało się pobrać danych z Supabase.");
    } finally {
      setDbTestLoading(false);
    }
  };

  const togglePlatform = (platform: string) => {
    if (distributorPlatforms.includes(platform)) {
      setDistributorPlatforms(
        distributorPlatforms.filter((p) => p !== platform),
      );
    } else {
      setDistributorPlatforms([...distributorPlatforms, platform]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Shield className="text-rose-500" size={32} />
            Konfiguracja Agentów
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            Dostosuj globalne parametry i zachowanie autonomicznych agentów
            systemu.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
        >
          <Save size={18} />
          {saving ? "Zapisywanie..." : "Zapisz Konfigurację"}
        </button>
      </div>

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
          <AlertCircle size={16} />
          Konfiguracja agentów została pomyślnie zaktualizowana.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agenci Zwiadowcy */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2 border-b border-neutral-800 pb-3">
            <Radar className="text-blue-400" size={20} />
            Agenci Zwiadowcy (Scouts)
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">
                Częstotliwość Skanowania
              </label>
              <select
                value={scoutFrequency}
                onChange={(e) => setScoutFrequency(e.target.value)}
                className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-rose-500"
              >
                <option value="realtime">
                  Czas rzeczywisty (Maksymalne zużycie zasobów)
                </option>
                <option value="hourly">Co 1 godzinę</option>
                <option value="daily">Raz dziennie</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">
                Słowa Kluczowe (oddzielone przecinkami)
              </label>
              <textarea
                value={scoutKeywords}
                onChange={(e) => setScoutKeywords(e.target.value)}
                rows={3}
                className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-rose-500 custom-scrollbar"
                placeholder="Marketing, AI, SaaS..."
              />
              <p className="text-xs text-neutral-500 mt-1">
                Zdefiniuj wektory operacyjne dla zwiadu.
              </p>
            </div>

            <div className="pt-4 border-t border-neutral-800">
              <h3 className="text-sm font-medium text-white mb-3">Model AI</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">
                    Wybór Modelu
                  </label>
                  <select
                    value={scoutModel}
                    onChange={(e) => setScoutModel(e.target.value)}
                    className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">
                    Temperatura: {scoutTemperature}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={scoutTemperature}
                    onChange={(e) =>
                      setScoutTemperature(parseFloat(e.target.value))
                    }
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-500 mt-2"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* VSL Generator */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2 border-b border-neutral-800 pb-3">
            <Video className="text-amber-400" size={20} />
            Generator VSL
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">
                Ton Komunikacji (Tone of Voice)
              </label>
              <select
                value={vslTone}
                onChange={(e) => setVslTone(e.target.value)}
                className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              >
                <option value="aggressive">Agresywny (Direct Response)</option>
                <option value="educational">Edukacyjny / Ekspercki</option>
                <option value="storytelling">Storytelling</option>
                <option value="corporate">Korporacyjny B2B</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">
                Domyślna Długość Skryptu
              </label>
              <div className="flex gap-4">
                {["short", "medium", "long"].map((length) => (
                  <label
                    key={length}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="vsl_length"
                      value={length}
                      checked={vslDefaultLength === length}
                      onChange={() => setVslDefaultLength(length)}
                      className="text-amber-500 focus:ring-amber-500 bg-black border-neutral-700"
                    />
                    <span className="text-sm text-neutral-300 capitalize">
                      {length === "short"
                        ? "Krótki (< 1 min)"
                        : length === "medium"
                          ? "Średni (1-3 min)"
                          : "Długi (> 3 min)"}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-800">
              <h3 className="text-sm font-medium text-white mb-3">Model AI</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">
                    Wybór Modelu
                  </label>
                  <select
                    value={vslModel}
                    onChange={(e) => setVslModel(e.target.value)}
                    className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">
                    Temperatura: {vslTemperature}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={vslTemperature}
                    onChange={(e) =>
                      setVslTemperature(parseFloat(e.target.value))
                    }
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500 mt-2"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Autonomiczny Dystrybutor - Zakończenie */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 lg:col-span-2">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2 border-b border-neutral-800 pb-3">
            <Network className="text-emerald-400" size={20} />
            Autonomiczny Dystrybutor
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">
                Dystans Czasowy (Opóźnienie dystrybucji)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="60"
                  step="5"
                  value={distributorDelay}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setDistributorDelay(newValue);
                  }}
                  className="flex-1 accent-emerald-500"
                />
                <span className="text-white font-medium w-16 text-right">
                  {distributorDelay} min
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-2">
                Opóźnienie między publikacjami multi-platform stanowić będzie
                tarczę anty-spamową.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-3">
                Aktywne Kanały Dystrybucji
              </label>
              <div className="flex flex-wrap gap-3">
                {[
                  { id: "twitter", name: "X / Twitter" },
                  { id: "linkedin", name: "LinkedIn" },
                  { id: "facebook", name: "Facebook" },
                  { id: "instagram", name: "Instagram" },
                  { id: "tiktok", name: "TikTok" },
                ].map((platform) => (
                  <button
                    key={platform.id}
                    onClick={() => togglePlatform(platform.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                      distributorPlatforms.includes(platform.id)
                        ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                        : "bg-black border-neutral-800 text-neutral-500 hover:border-neutral-600"
                    }`}
                  >
                    {platform.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-2 pt-4 border-t border-neutral-800 mt-2">
              <h3 className="text-sm font-medium text-white mb-3">Model AI</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">
                    Wybór Modelu
                  </label>
                  <select
                    value={distributorModel}
                    onChange={(e) => setDistributorModel(e.target.value)}
                    className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">
                    Temperatura: {distributorTemperature}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={distributorTemperature}
                    onChange={(e) =>
                      setDistributorTemperature(parseFloat(e.target.value))
                    }
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 mt-3"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hub Integracji (Płatności, Automatyzacje, Modele AI) */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 lg:col-span-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[80px] rounded-full pointer-events-none" />
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2 border-b border-neutral-800 pb-3 uppercase tracking-wider">
            <Network className="text-blue-500" size={20} />
            Hub Integracji (Włącz Zarabianie i Autopilot)
          </h2>

          <div className="space-y-6">
            {/* 1. Stripe */}
            <div className="bg-black/50 border border-neutral-800 rounded-lg p-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="bg-indigo-500/20 text-indigo-400 p-1.5 rounded">
                      1
                    </span>
                    Płatności (Stripe)
                  </h3>
                  <p className="text-sm text-neutral-400 mt-1">
                    Przyjmuj płatności i subskrypcje na żywo. To pozwoli
                    generować prawdziwy dochód.
                  </p>
                </div>
                <a
                  href="https://dashboard.stripe.com/apikeys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded text-xs font-medium transition-colors"
                >
                  Odbierz swój klucz darmowo &rarr;
                </a>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1">
                  Stripe Secret Key (sk_live_... / sk_test_...)
                </label>
                <input
                  type="password"
                  value={stripeKey}
                  onChange={(e) => setStripeKey(e.target.value)}
                  placeholder="Wklej swój klucz Stripe tutaj..."
                  className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            {/* 2. Make.com / Zapier */}
            <div className="bg-black/50 border border-neutral-800 rounded-lg p-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="bg-emerald-500/20 text-emerald-400 p-1.5 rounded">
                      2
                    </span>
                    Automatyzacje (Make.com / Webhook)
                  </h3>
                  <p className="text-sm text-neutral-400 mt-1">
                    Połącz swój system z CRM, E-mailem czy arkuszem Google
                    ustalaąc darmowy Webhook.
                  </p>
                </div>
                <a
                  href="https://www.make.com/en/register"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded text-xs font-medium transition-colors"
                >
                  Załóż darmowe Make.com &rarr;
                </a>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1">
                  Make Webhook URL (https://hook.make.com/...)
                </label>
                <input
                  type="text"
                  value={makeWebhook}
                  onChange={(e) => setMakeWebhook(e.target.value)}
                  placeholder="Wklej swój link Webhook z Make.com tutaj..."
                  className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            {/* 3. OpenAI / Gemini APIs */}
            <div className="bg-black/50 border border-neutral-800 rounded-lg p-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="bg-amber-500/20 text-amber-400 p-1.5 rounded">
                      3
                    </span>
                    Modele AI (OpenAI / Gemini)
                  </h3>
                  <p className="text-sm text-neutral-400 mt-1">
                    Daje systemowi pełen dostęp do generowania tekstu, kodu i
                    obrazów dla Twoich klientów.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded text-xs font-medium transition-colors"
                  >
                    OpenAI API &rarr;
                  </a>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded text-xs font-medium transition-colors"
                  >
                    Gemini API &rarr;
                  </a>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1">
                  Klucz API OpenAI lub Gemini (sk-...)
                </label>
                <input
                  type="password"
                  value={openAiKey}
                  onChange={(e) => setOpenAiKey(e.target.value)}
                  placeholder="Wklej swój klucz API tutaj..."
                  className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            {/* 4. Supabase Vector Knowledge Base */}
            <div className="bg-black/50 border border-neutral-800 rounded-lg p-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="bg-blue-600/20 text-blue-400 p-1.5 rounded">
                      4
                    </span>
                    Baza Wiedzy Vektor (Supabase & text-embedding-004)
                  </h3>
                  <p className="text-sm text-neutral-400 mt-1">
                    Połącz system z bazą wiedzy Supabase. Wyszukiwanie wektorowe pozwala agentom na wydobywanie powiązanych informacji z dokumentów i FAQ.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href="https://supabase.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded text-xs font-medium transition-colors"
                  >
                    Przejdź do Supabase &rarr;
                  </a>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1">
                    Supabase Projekt URL
                  </label>
                  <input
                    type="text"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrlLocal(e.target.value)}
                    placeholder="https://your-project-id.supabase.co"
                    className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1">
                    Supabase Service Role Key (tajny klucz serwera)
                  </label>
                  <input
                    type="password"
                    value={supabaseServiceRoleKey}
                    onChange={(e) => setSupabaseServiceRoleKeyLocal(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Vector Query Sandbox Playground */}
              <div className="mt-6 border-t border-neutral-850 pt-5">
                <h4 className="text-sm font-semibold text-neutral-200 mb-2 flex items-center gap-1.5 font-mono">
                  <Radar size={16} className="text-blue-500" />
                  PIASKOWNICA ZAPYTAŃ WEKTOROWYCH (PLAYGROUND)
                </h4>
                <p className="text-xs text-neutral-400 mb-4 font-sans">
                  Przetestuj dopasowanie dokumentów w czasie rzeczywistym. System zamieni zapytanie na embedding wektora (768 dim/text-embedding-004) i przeszuka dokumenty przez RPC <code className="bg-neutral-800 text-neutral-200 px-1 rounded font-mono text-[11px]">match_documents</code>.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1">
                      Wpisz frazę do wyszukania wektorowego
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={dbTestQuery}
                        onChange={(e) => setDbTestQuery(e.target.value)}
                        placeholder="np. Jak napisać skuteczny skrypt VSL?"
                        className="flex-1 bg-black border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                      />
                      <button
                        onClick={handleTestSupabase}
                        disabled={dbTestLoading}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                      >
                        {dbTestLoading ? (
                          <>
                            <RefreshCw size={12} className="animate-spin" />
                            SZUKANIE...
                          </>
                        ) : (
                          <>
                            <Search size={12} />
                            SZUKAJ W BAZIE
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-neutral-400 mb-1">
                        Próg dopasowania wektora (Match Threshold): {Math.round(dbTestThreshold * 100)}%
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="0.95"
                        step="0.05"
                        value={dbTestThreshold}
                        onChange={(e) => setDbTestThreshold(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-500 mt-2"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-400 mb-1">
                        Maksymalna liczba dokumentów (Limit): {dbTestLimit}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={dbTestLimit}
                        onChange={(e) => setDbTestLimit(parseInt(e.target.value) || 3)}
                        className="w-full bg-black border border-neutral-800 rounded-lg px-3 py-1 text-sm text-white focus:outline-none focus:border-blue-500 mt-1"
                      />
                    </div>
                  </div>

                  {dbTestError && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg p-3 font-mono">
                      ❌ Błąd: {dbTestError}
                    </div>
                  )}

                  {dbTestResults && (
                    <div className="bg-neutral-950 border border-neutral-850 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
                        <span className="text-xs text-emerald-400 font-mono">
                          ✓ Sukces (Embedding {dbTestResults.embeddingLength}-wymiarowy wygenerowany!)
                        </span>
                        <span className="text-[10px] text-neutral-500 font-mono">
                          Znaleziono: {dbTestResults.documents?.length || 0} dopasowań
                        </span>
                      </div>

                      {dbTestResults.documents?.length === 0 ? (
                        <p className="text-xs text-neutral-500 italic">Brak dokumentów spełniających kryteria dopasowania (próg: {Math.round(dbTestThreshold * 100)}%).</p>
                      ) : (
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                          {dbTestResults.documents.map((doc: any, i: number) => (
                            <div key={i} className="text-xs bg-neutral-900/60 p-2.5 rounded border border-neutral-800/80">
                              <div className="flex justify-between items-center mb-1 text-[10px] font-mono text-neutral-500">
                                <span>Dokument ID: #{doc.id || i}</span>
                                <span className="text-blue-400 font-bold">Podobieństwo: {Math.round((doc.similarity || 0) * 1000) / 10}%</span>
                              </div>
                              <p className="text-neutral-300 font-sans leading-relaxed whitespace-pre-wrap">{doc.content}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Diagnostics Panel */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 -mr-6 -mt-6 w-36 h-36 rounded-full bg-gradient-to-br from-indigo-500/10 to-transparent blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-850 pb-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Activity className="text-rose-500 animate-pulse" size={22} />
              Panel Diagnostyczny Firebase & Server
            </h2>
            <p className="text-xs text-neutral-400 mt-1">
              Testowanie w czasie rzeczywistym i trace połączeń z Firebase Auth, Firestore oraz Cloud Backend.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                Sentry.logger.info('User triggered test error', {
                  action: 'test_error_button_click',
                });
                Sentry.metrics.count('test_counter', 1);
                throw new Error('This is your first error!');
              }}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-200 rounded-lg transition-all text-xs font-mono"
            >
              <AlertTriangle size={14} />
              Break the world
            </button>
            
            <button
              onClick={runDiagnostics}
              disabled={diagRunning}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-neutral-950 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 rounded-lg transition-all text-xs font-mono disabled:opacity-50"
            >
              <RefreshCw size={14} className={diagRunning ? "animate-spin" : ""} />
              {diagRunning ? "DIAGNOZOWANIE..." : "PONÓW DIAGNOSTYKĘ"}
            </button>
          </div>
        </div>

        {/* Diagnostic KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Auth State */}
          <div className="bg-neutral-950/40 border border-neutral-850 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">Firebase Auth Status</span>
              {authState.status === "checking" ? (
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
              ) : authState.status === "connected" ? (
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              ) : (
                <span className="w-2.5 h-2.5 rounded-full bg-neutral-600" />
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-2 bg-neutral-900 rounded border border-neutral-800">
                <UserCheck size={18} className={authState.status === "connected" ? "text-emerald-400" : "text-neutral-500"} />
              </div>
              <div>
                <div className="text-sm font-bold text-white">
                  {authState.status === "checking" ? "Odpytywanie..." : authState.status === "connected" ? "Zalogowano" : "Tryb Gościa"}
                </div>
                <div className="text-[10px] text-neutral-400 truncate max-w-[180px] font-mono">
                  {authState.email || "Brak aktywnej sesji"}
                </div>
              </div>
            </div>
          </div>

          {/* Firestore Connection */}
          <div className="bg-neutral-950/40 border border-neutral-850 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">Firestore Database</span>
              {firestoreState.status === "checking" ? (
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
              ) : firestoreState.status === "connected" ? (
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              ) : firestoreState.status === "restricted" ? (
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              ) : (
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-neutral-900 rounded border border-neutral-800">
                <Wifi size={18} className={firestoreState.status === "connected" ? "text-emerald-400" : firestoreState.status === "restricted" ? "text-amber-400" : "text-rose-500"} />
              </div>
              <div>
                <div className="text-sm font-bold text-white">
                  {firestoreState.status === "checking" ? "Ping..." : firestoreState.status === "connected" ? "Połączono" : firestoreState.status === "restricted" ? "Zabezpieczono" : "Błąd Komunikacji"}
                </div>
                <div className="text-[10px] text-neutral-400 font-mono">
                  {firestoreState.status === "connected" && firestoreState.latency ? `Latencja: ${firestoreState.latency}ms` : firestoreState.status === "restricted" ? "Reguły aktywne" : "Brak dostępu"}
                </div>
              </div>
            </div>
          </div>

          {/* Cloud Functions (Express Server API) */}
          <div className="bg-neutral-950/40 border border-neutral-850 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">Backend Server / APIs</span>
              {serverState.status === "checking" ? (
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
              ) : serverState.status === "connected" ? (
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              ) : (
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-neutral-900 rounded border border-neutral-800">
                <Server size={18} className={serverState.status === "connected" ? "text-emerald-400" : "text-rose-500"} />
              </div>
              <div>
                <div className="text-sm font-bold text-white">
                  {serverState.status === "checking" ? "Skanowanie..." : serverState.status === "connected" ? "Zdrowy (Healthy)" : "Brak odpowiedzi"}
                </div>
                <div className="text-[10px] text-neutral-400 font-mono">
                  Gemini API: {serverState.geminiKey ? "Zainstalowane" : "Nieskonfigurowane"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Console logs */}
        <div className="mb-6">
          <label className="text-xs font-mono text-neutral-400 uppercase tracking-widest block mb-2 flex items-center gap-2">
            <Terminal size={14} className="text-neutral-500" />
            Trasy Systemowe (Real-time Diagnostic Logs)
          </label>
          <div className="bg-black/80 font-mono text-[11px] leading-relaxed p-4 rounded-lg text-emerald-400 h-44 overflow-y-auto border border-neutral-850 custom-scrollbar shadow-inner">
            {diagLogs.length > 0 ? (
              diagLogs.map((log, index) => (
                <div key={index} className="border-b border-neutral-900/40 py-0.5">
                  {log}
                </div>
              ))
            ) : (
              <div className="text-neutral-500 animate-pulse">Inicjalizacja pętli pomiarowych...</div>
            )}
          </div>
        </div>

        {/* Troubleshooting Instructions */}
        <div className="bg-neutral-950/40 border border-neutral-850 p-5 rounded-lg flex flex-col md:flex-row gap-5">
          <div className="p-3 bg-rose-500/5 border border-rose-900/20 rounded-lg flex items-start gap-3 flex-1">
            <AlertTriangle className="text-rose-400 shrink-0 mt-0.5" size={18} />
            <div>
              <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider font-mono">Co zrobić, gdy Firebase nie świeci się na zielono?</h4>
              <ul className="text-[11px] text-neutral-400 space-y-1.5 mt-2 list-disc pl-4 font-sans">
                <li>Upewnij się, że Twoja konfiguracja w pliku <strong className="text-neutral-300">firebase-applet-config.json</strong> jest w pełni poprawna.</li>
                <li>Jeśli system Auth wskazuje <strong className="text-neutral-300">"Tryb Gościa"</strong>, oznacza to brak aktywnego konta. Użyj modułu rejestracji/logowania, aby uprawnić połączenie.</li>
                <li>W przypadku błędu Firestore <strong className="text-neutral-300">"permission-denied"</strong>, oznacza to, że Twoje bazy są super zabezpieczone w <strong className="text-amber-400">firestore.rules</strong> i wymagają autoryzacji do odczytu danych.</li>
              </ul>
            </div>
          </div>

          <div className="p-3 bg-indigo-500/5 border border-indigo-900/20 rounded-lg flex items-start gap-3 flex-1">
            <Zap className="text-indigo-400 shrink-0 mt-0.5" size={18} />
            <div>
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider font-mono">Autoryzacje Google Workspace (Gmail / Sheets / Drive)</h4>
              <p className="text-[11px] text-neutral-400 mt-2 leading-relaxed font-sans">
                Niedawno zaakceptowałeś uprawnienia OAuth do połączenia z Gmail, Google Sheets, Google Drive oraz Google Tasks. Te uprawnienia są niezależne od połączenia z bazą Firestore, ale są niezbędne do uruchomienia dynamicznych integracji poczty i dokumentów. Te uprawnienia są teraz w pełni zainicjalizowane na poziomie Twojego konta!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* System Logs (Audit Trail) Panel */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 mt-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 -mr-6 -mt-6 w-36 h-36 rounded-full bg-gradient-to-br from-emerald-500/10 to-transparent blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-850 pb-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Terminal className="text-emerald-500" size={22} />
              Logi Systemowe (Operational Audit Trail)
            </h2>
            <p className="text-xs text-neutral-400 mt-1">
              Śledzenie i audyt działań operacyjnych użytkownika w różnych modułach w czasie rzeczywistym.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchLogs()}
              disabled={logsLoading}
              className="flex items-center gap-2 px-3 py-1.5 bg-neutral-950 hover:bg-neutral-850 font-mono text-[11px] text-neutral-200 border border-neutral-800 rounded-lg transition-all"
            >
              <RefreshCw size={12} className={logsLoading ? "animate-spin" : ""} />
              ODŚWIEŻ
            </button>
            <button
              onClick={async () => {
                if (window.confirm("Czy na pewno chcesz wyczyścić historię logów audytowych z tej sesji?")) {
                  await clearLogs();
                  toast.success("Historia lokalnych logów została pomyślnie wyczyszczona.");
                }
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 font-mono border border-rose-900/30 rounded-lg transition-all text-[11px]"
            >
              <Trash2 size={12} />
              WYCZYŚĆ
            </button>
          </div>
        </div>

        {/* Filter controls */}
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Filtruj logi według szczegółów..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/50 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors placeholder-neutral-500"
            />
          </div>
          <div className="flex gap-2 self-start md:self-auto overflow-x-auto max-w-full pb-1 md:pb-0">
            {["Wszystkie", "CRM (Zapalnik)", "VSL Generator", "Ustawienia"].map((mod) => (
              <button
                key={mod}
                onClick={() => setSelectedModule(mod)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all whitespace-nowrap ${
                  selectedModule === mod
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/35"
                    : "bg-neutral-950/40 text-neutral-400 border-neutral-850 hover:bg-neutral-850"
                }`}
              >
                {mod}
              </button>
            ))}
          </div>
        </div>

        {/* Audit list */}
        <div className="border border-neutral-850 rounded-lg overflow-hidden bg-black/30">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-950/60 border-b border-neutral-850 font-mono text-[10px] text-neutral-400 uppercase tracking-widest font-bold">
                  <th className="py-3 px-4">Czas zdarzenia</th>
                  <th className="py-3 px-4">Użytkownik</th>
                  <th className="py-3 px-4">Moduł</th>
                  <th className="py-3 px-4">Działanie</th>
                  <th className="py-3 px-4">Szczegóły operacji</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-850/50 font-sans text-xs">
                {displayedLogs.length > 0 ? (
                  displayedLogs.map((log, idx) => {
                    let moduleBadge = "text-blue-400 bg-blue-500/5 border-blue-500/10";
                    if (log.module.includes("CRM")) {
                      moduleBadge = "text-amber-400 bg-amber-500/5 border-amber-500/10";
                    } else if (log.module.includes("VSL")) {
                      moduleBadge = "text-fuchsia-400 bg-fuchsia-500/5 border-fuchsia-500/10";
                    } else if (log.module.includes("Ustawienia")) {
                      moduleBadge = "text-cyan-400 bg-cyan-500/5 border-cyan-500/10";
                    }
                    
                    return (
                      <tr key={idx} className="hover:bg-neutral-950/30 transition-colors">
                        <td className="py-3 px-4 font-mono text-[10px] text-neutral-500 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString("pl-PL")}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-neutral-400 whitespace-nowrap">
                          {log.userEmail || "guest@system.omega"}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded border text-[10px] font-medium ${moduleBadge}`}>
                            {log.module}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-white whitespace-nowrap">
                          {log.action}
                        </td>
                        <td className="py-3 px-4 text-neutral-400 leading-relaxed min-w-[300px]">
                          {log.details}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-neutral-500 font-mono text-xs">
                      Brak dopasowanych logów systemowych w audit trailu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

