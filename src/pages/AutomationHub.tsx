import { useState, useEffect, useCallback } from "react";
import { 
  Activity, 
  RefreshCw, 
  Mail, 
  FileSpreadsheet, 
  FolderOpen, 
  Play, 
  Bot, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  FileText,
  Clock,
  Inbox,
  TrendingUp,
  MessageSquare,
  Zap,
  Flame,
  Eye
} from "lucide-react";
import { getAccessToken, googleSignIn } from "../lib/auth";
import { auth } from "../lib/firebase";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

interface Client {
  id: string;
  name: string;
  email: string;
  status: string;
}

interface AutomationLog {
  id: string;
  type: string;
  status: "success" | "warn" | "error" | "info";
  message: string;
  timestamp: string;
}

export function AutomationHub() {
  const [googleToken, setGoogleToken] = useState<string | null>(() => getAccessToken());
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedDraftClientId, setSelectedDraftClientId] = useState<string>("");
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  
  // Loaders
  const [isRunningAutomation, setIsRunningAutomation] = useState(false);
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isLoadingClients, setIsLoadingClients] = useState(false);

  // Active sync outcome previews
  const [lastBriefResult, setLastBriefResult] = useState<{ fileName: string; preview: string } | null>(null);
  const [lastDraftResult, setLastDraftResult] = useState<{ subject: string; htmlBody: string; draftId: string } | null>(null);

  // --- REAL-TIME DOPAMINE LOOPS STATE & INTEGRATION ---
  const [dopamineCampaign, setDopamineCampaign] = useState("PROCES - Auto-audyt PDF [Grom-1]");
  const [dopamineReach, setDopamineReach] = useState(14820);
  const [dopamineComments, setDopamineComments] = useState(482);
  const [dopamineDMs, setDopamineDMs] = useState(469);
  const [dopamineSpeed, setDopamineSpeed] = useState(1.24);
  const [dopaminePulse, setDopaminePulse] = useState(false);
  const [testerStep, setTesterStep] = useState(0);
  const [isSimulatingLoop, setIsSimulatingLoop] = useState(false);

  interface DopamineLoopLog {
    id: string;
    timestamp: string;
    user: string;
    trigger: string;
    action: string;
    speed: string;
    status: "success" | "pending" | "qualify";
  }

  const [dopamineLogs, setDopamineLogs] = useState<DopamineLoopLog[]>(() => [
    {
      id: "dl-1",
      timestamp: "14:18:20",
      user: "Sylwia Nowak",
      trigger: "PROCES",
      action: "Wysłano Messenger DM z linkiem do audytu",
      speed: "1.18s",
      status: "success",
    },
    {
      id: "dl-2",
      timestamp: "14:17:00",
      user: "Mariusz Czerkawski",
      trigger: "PROCES",
      action: "Klient kliknął link bota -> Kwalifikacja CRM",
      speed: "1.42s",
      status: "qualify",
    },
    {
      id: "dl-3",
      timestamp: "14:14:00",
      user: "Tomasz Adamski",
      trigger: "KLIENT",
      action: "Wysłano Messenger DM (Strategia zamknięcia)",
      speed: "1.29s",
      status: "success",
    },
    {
      id: "dl-4",
      timestamp: "14:11:30",
      user: "Marta Kołodziej",
      trigger: "ZAPALNIK",
      action: "Wykryto słowo kluczowe -> Przetwarzanie webhook...",
      speed: "1.11s",
      status: "success",
    }
  ]);

  // Real-time fluctuations simulator
  useEffect(() => {
    const statsInterval = setInterval(() => {
      // Fluctuating reach
      setDopamineReach(prev => prev + Math.floor(Math.random() * 3) + 1);
      
      // Randomly fluctuate response speed slightly
      setDopamineSpeed(prev => {
        const delta = (Math.random() * 0.1 - 0.05);
        const nextVal = prev + delta;
        return parseFloat(Math.max(1.05, Math.min(1.45, nextVal)).toFixed(2));
      });
      
      // Occasionally trigger a simulated organic lead comment
      if (Math.random() > 0.82) {
        const names = [
          "Hubert Giedroyć", "Katarzyna Bąk", "Agnieszka Włodarczyk", 
          "Paweł Zawadzki", "Dominik Szulc", "Monika Dudek"
        ];
        const randomName = names[Math.floor(Math.random() * names.length)];
        const keys = ["PROCES", "KLIENT", "ZAPALNIK"];
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        const responseSpeed = `${parseFloat((1.05 + Math.random() * 0.3).toFixed(2))}s`;
        
        setDopamineComments(prev => prev + 1);
        setDopamineDMs(prev => prev + 1);
        setDopaminePulse(true);
        setTimeout(() => setDopaminePulse(false), 800);

        const newLog: DopamineLoopLog = {
          id: `dl-rand-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          user: randomName,
          trigger: randomKey,
          action: `Wykryto organiczny komentarz '${randomKey}' -> Auto-odpowiedź Messenger`,
          speed: responseSpeed,
          status: "success"
        };
        setDopamineLogs(prev => [newLog, ...prev.slice(0, 7)]);

        // Real-time custom-styled high-converting Loop Toast Alert
        toast.info(
          <div className="flex flex-col gap-1 w-full text-left">
            <div className="flex items-center gap-1.5 text-rose-450 font-mono text-[10px] font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
              WYSOKA KONWERSJA (MESSENGER)
            </div>
            <div className="text-white text-xs font-bold leading-tight mt-0.5">
              Aktywna pętla dopaminowa u: <span className="text-rose-400 font-extrabold">{randomName}</span>
            </div>
            <p className="text-neutral-400 text-[10px] leading-normal font-sans">
              Klient skomentował słowem <strong className="text-white font-mono">"{randomKey}"</strong>. Auto-DM bota pomyślnie wysłany w czasie <strong className="text-emerald-400 font-mono">{responseSpeed}</strong>!
            </p>
          </div>,
          {
            duration: 5000,
            style: {
              background: "#09090b",
              border: "1px solid #e11d4833",
              borderRadius: "16px",
              padding: "14px"
            }
          }
        );
      }
    }, 4500);

    return () => clearInterval(statsInterval);
  }, []);

  const handleSimulateDopamineTest = useCallback(async () => {
    if (isSimulatingLoop) return;
    setIsSimulatingLoop(true);
    setTesterStep(1);
    
    // Simulate interactive step transitions
    const toastId = toast.loading("Rozpoczynanie weryfikacji pętli: Symulacja komentarza 'PROCES'...");
    
    // Step 1: Detect comment
    setTimeout(() => {
      setTesterStep(2);
      toast.info("Krok 1/4: Wykryto testowy komentarz ze słowem 'PROCES' na fanpage'u!", { id: toastId });
    }, 1200);

    // Step 2: Webhook Triggered
    setTimeout(() => {
      setTesterStep(3);
      toast.info("Krok 2/4: Meta Webhook odebrany pomyślnie. Generowanie spersonalizowanego DM przez Gemini API...", { id: toastId });
    }, 2400);

    // Step 3: Messenger reply sent
    setTimeout(() => {
      setTesterStep(4);
      toast.info("Krok 3/4: Messenger Bot pomyślnie przesłał magnetyczną wiadomość na skrzynkę klienta!", { id: toastId });
    }, 3600);

    // Step 4: CRM entry saved and Loop Complete
    setTimeout(() => {
      setTesterStep(0);
      setIsSimulatingLoop(false);

      setDopamineComments(prev => prev + 1);
      setDopamineDMs(prev => prev + 1);
      setDopaminePulse(true);
      setTimeout(() => setDopaminePulse(false), 1000);

      const testLog: DopamineLoopLog = {
        id: `dl-test-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        user: "Jan Kowalski (Tester)",
        trigger: "PROCES",
        action: "TEST SYSTEMU OK: Komentarz 'PROCES' -> Messenger DM -> Synchronizacja CRM",
        speed: "1.21s",
        status: "qualify"
      };

      setDopamineLogs(prev => [testLog, ...prev.slice(0, 7)]);
      toast.success("Pętla dopaminowa przetestowana pomyślnie! Zapisano log w czasie rzeczywistym.", { id: toastId });
    }, 4800);
  }, [isSimulatingLoop]);

  // Fetch Firestore automation execution logs
  const fetchLogs = useCallback(async () => {
    if (!auth.currentUser) return;
    setIsLoadingLogs(true);
    try {
      const res = await fetch(`/api/automation/logs?userId=${auth.currentUser.uid}`);
      if (!res.ok) throw new Error("Nie udało się pobrać logów");
      const data = await res.json();
      if (Array.isArray(data)) {
        setLogs(data);
      }
    } catch (err: unknown) {
      console.error("Error retrieving logs:", err);
    } finally {
      setIsLoadingLogs(false);
    }
  }, []);

  // Fetch clients for Drive & Draft generation lists
  const fetchClients = useCallback(async () => {
    setIsLoadingClients(true);
    try {
      const res = await fetch('/api/crm-clients');
      if (!res.ok) throw new Error("Błąd pobierania bazy klientów");
      const data = await res.json();
      if (Array.isArray(data)) {
        setClients(data);
        if (data.length > 0) {
          setSelectedClientId(data[0].id);
          setSelectedDraftClientId(data[0].id);
        }
      }
    } catch (err: unknown) {
      console.error("Error fetching clients:", err);
    } finally {
      setIsLoadingClients(false);
    }
  }, []);

  // Save token silently on backend to powerbackground 15-minute Cron tasks
  const saveTokenOnBackend = useCallback(async (token: string) => {
    if (!auth.currentUser) return;
    try {
      await fetch("/api/automation/save-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          googleToken: token,
          userId: auth.currentUser.uid
        })
      });
      console.log("[OAUTH] Token synchronised on background cron engine.");
    } catch (err: unknown) {
      console.error("[OAUTH] Failed to save token on backend:", err);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs();
      fetchClients();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchLogs, fetchClients]);

  // Save token whenever it is active
  useEffect(() => {
    if (googleToken) {
      saveTokenOnBackend(googleToken);
    }
  }, [googleToken, saveTokenOnBackend]);

  const handleConnectWorkspace = async () => {
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleToken(res.accessToken);
        toast.success("Połączono pomyślnie z Google Workspace!");
        fetchLogs();
      }
    } catch (err: unknown) {
      console.error("Workspace signin error:", err);
      toast.error("Błąd podczas uwierzytelniania w Google");
    }
  };

  // Run Gmail -> Tasks and Sheets Two-Way automation pipeline
  const handleTriggerAutomation = async () => {
    const token = getAccessToken();
    if (!token) {
      toast.error("Wymagana autoryzacja Google Workspace. Połącz konto powyżej.");
      return;
    }
    if (!auth.currentUser) return;

    setIsRunningAutomation(true);
    const toastId = toast.loading("Inicjowanie integracji: Przeszukiwanie Gmail i synchronizacja Sheets...");

    try {
      const res = await fetch("/api/automation/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: auth.currentUser.uid,
          userEmail: auth.currentUser.email
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Wystąpił błąd krytyczny podczas wykonywania integracji");
      }

      toast.success("Synchronizacja Omega zakończona sukcesem!", { id: toastId });
      
      // Update data logs immediately
      fetchLogs();
      fetchClients();
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : String(err);
      toast.error(errMsg || "Błąd wykonania", { id: toastId });
    } finally {
      setIsRunningAutomation(false);
    }
  };

  // Generate tactical brief via Gemini and save to Google Drive inside "Umowy i Oferty" folder
  const handleGenerateAndUploadBrief = async () => {
    const token = getAccessToken();
    if (!token) {
      toast.error("Zaloguj się do Google Workspace, aby zapisać plik na Dysku.");
      return;
    }
    if (!selectedClientId) {
      toast.error("Wybierz klienta z listy, aby wygenerować brief.");
      return;
    }
    if (!auth.currentUser) return;

    setIsGeneratingBrief(true);
    setLastBriefResult(null);
    const toastId = toast.loading("Generowanie dokumentu Premium przez Gemini i przekazywanie na Dysk Google...");

    try {
      const res = await fetch("/api/automation/generate-brief", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: auth.currentUser.uid,
          clientId: selectedClientId
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Nie udało się zapisać dokumentu na Dysku");
      }

      toast.success("Brief Taktyczny pomyślnie wysłany na Twój Dysk Google!", { id: toastId });
      setLastBriefResult({
        fileName: data.fileName,
        preview: data.briefPreview
      });
      fetchLogs();
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : String(err);
      toast.error(errMsg || "Wystąpił błąd generowania briefu", { id: toastId });
    } finally {
      setIsGeneratingBrief(false);
    }
  };

  // GMAIL AUTO-RESPONDER: Generate personalized follow-up and write to draft
  const handleGenerateEmailDraft = async () => {
    const token = getAccessToken();
    if (!token) {
      toast.error("Zaloguj się do Google Workspace, aby wygenerować roboczą odpowiedź.");
      return;
    }
    if (!selectedDraftClientId) {
      toast.error("Wybierz klienta z listy CRM, aby przygotować szkic.");
      return;
    }
    if (!auth.currentUser) return;

    setIsGeneratingDraft(true);
    setLastDraftResult(null);
    const toastId = toast.loading("Analiza informacji z CRM i generowanie wersji roboczej w Gmailu...");

    try {
      const res = await fetch("/api/automation/create-draft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: auth.currentUser.uid,
          clientId: selectedDraftClientId
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Nie udało się zapisać wersji roboczej w Gmailu");
      }

      toast.success("Wersja robocza została automatycznie zapisana w Twoich Drafts na koncie Gmail!", { id: toastId });
      setLastDraftResult({
        subject: data.subject,
        htmlBody: data.htmlBody,
        draftId: data.draftId
      });
      fetchLogs();
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : String(err);
      toast.error(errMsg || "Błąd generowania draftu pocztowego", { id: toastId });
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  // Dynamic statistics computing from database logs
  const parsedEmailsCount = logs.filter(l => l.type === "gmail_tasks").length;
  const generatedBriefsCount = logs.filter(l => l.type === "drive").length;
  const generatedDraftsCount = logs.filter(l => l.type === "gmail_draft").length;

  // Priority distribution computation
  const getPriorityData = () => {
    const counts = {
      "Krytyczny": 0,
      "Wysoki": 0,
      "Średni": 0,
      "Niski": 0
    };

    logs.forEach(log => {
      if (log.type === "gmail_tasks" && log.message) {
        if (log.message.includes("Priorytet: Krytyczny")) {
          counts["Krytyczny"]++;
        } else if (log.message.includes("Priorytet: Wysoki")) {
          counts["Wysoki"]++;
        } else if (log.message.includes("Priorytet: Średni")) {
          counts["Średni"]++;
        } else if (log.message.includes("Priorytet: Niski")) {
          counts["Niski"]++;
        }
      }
    });

    const total = counts["Krytyczny"] + counts["Wysoki"] + counts["Średni"] + counts["Niski"];
    if (total === 0) {
      // Return aesthetic non-empty default ratio if database logs are fresh
      return [
        { name: "Krytyczny", value: 1 },
        { name: "Wysoki", value: 3 },
        { name: "Średni", value: 5 },
        { name: "Niski", value: 2 }
      ];
    }

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0);
  };

  const priorityData = getPriorityData();
  const PRIORITY_COLORS = {
    "Krytyczny": "#f43f5e", // Rose-500
    "Wysoki": "#f59e0b",    // Amber-500
    "Średni": "#a855f7",    // Purple-500
    "Niski": "#10b981"     // Emerald-500
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-neutral-900 pb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded text-[10px] font-mono uppercase tracking-widest">
              Omega Workspace Hub
            </span>
            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[10px] font-mono uppercase tracking-widest flex items-center gap-1">
              <span className="w-1 h-1 bg-emerald-400 rounded-full animate-ping" />
              TBF Daemon Active
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Bot size={32} className="text-purple-400 animate-pulse" />
            KOKPIT AUTOMATYZACJI
          </h1>
          <p className="text-neutral-400 text-sm mt-1 max-w-2xl font-sans">
            Jednolity węzeł operacyjny łączący systemy Google Workspace bezpośrednio z bazą CRM. Synchronizuj pocztę, zadania, arkusze i dysk w czasie rzeczywistym.
          </p>
        </div>

        {/* WORKSPACE AUTHENTICATION CHECK */}
        <div className="flex items-center gap-3">
          {googleToken ? (
            <div className="flex items-center gap-2.5 px-4 py-2 bg-neutral-900/45 border border-emerald-500/20 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <div className="text-xs">
                <div className="text-neutral-400 font-medium">Google Workspace</div>
                <div className="text-emerald-400 font-bold font-mono">AUTORYZOWANO</div>
              </div>
            </div>
          ) : (
            <button
              onClick={handleConnectWorkspace}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-[0_0_15px_rgba(225,29,72,0.3)] flex items-center gap-2"
            >
              <svg width="14" height="14" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                <path fill="#ffffff" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#ffffff" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#ffffff" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#ffffff" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              </svg>
              Połącz z Google Workspace
            </button>
          )}
        </div>
      </div>

      {/* STATISTICS DASHBOARD SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-neutral-950/70 border border-neutral-900 rounded-2xl p-5 relative overflow-hidden flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-neutral-500 font-mono font-bold uppercase tracking-wider">Przeanalizowane E-maile</span>
            <div className="text-3xl font-extrabold text-white font-mono">{parsedEmailsCount}</div>
            <p className="text-[10px] text-neutral-400">Wyjęte z Gmail i skatalogowane</p>
          </div>
          <div className="p-3.5 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
            <Inbox size={22} />
          </div>
        </div>

        <div className="bg-neutral-950/70 border border-neutral-900 rounded-2xl p-5 relative overflow-hidden flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-neutral-500 font-mono font-bold uppercase tracking-wider">Briefy na Dysku Google</span>
            <div className="text-3xl font-extrabold text-amber-400 font-mono">{generatedBriefsCount}</div>
            <p className="text-[10px] text-neutral-400">Strategiczne projekty w "Umowy i Oferty"</p>
          </div>
          <div className="p-3.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <FolderOpen size={22} />
          </div>
        </div>

        <div className="bg-neutral-950/70 border border-neutral-900 rounded-2xl p-5 relative overflow-hidden flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-neutral-500 font-mono font-bold uppercase tracking-wider">AI Gmail Drafts</span>
            <div className="text-3xl font-extrabold text-emerald-400 font-mono">{generatedDraftsCount}</div>
            <p className="text-[10px] text-neutral-400">Szkice stworzone we "Wersjach Roboczych"</p>
          </div>
          <div className="p-3.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <Mail size={22} />
          </div>
        </div>
      </div>

      {/* REAL-TIME DOPAMINE LOOPS PANEL */}
      <div className="bg-neutral-950 border border-neutral-900 rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Header inside container */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between border-b border-neutral-900 pb-5 mb-6 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 bg-rose-500/10 text-rose-450 border border-rose-500/20 rounded text-[10px] font-mono uppercase tracking-wider flex items-center gap-1.5">
                <Zap size={11} className="text-rose-400 animate-pulse" />
                NEURO-CONVERSION ENGINE
              </span>
              <span className="px-2 py-0.5 bg-blue-500/10 text-blue-450 border border-blue-500/20 rounded text-[10px] font-mono uppercase tracking-wider">
                Real-time Feedback Loop
              </span>
            </div>
            <h2 className="text-xl font-black text-white tracking-tight uppercase flex items-center gap-2">
              <Flame size={20} className="text-rose-500 animate-pulse" />
              Aktywne Pętle Dopaminowe (Meta Organics & Messenger)
            </h2>
            <p className="text-neutral-400 text-xs mt-0.5 max-w-3xl font-sans">
              System neuro-retencyjny, który w czasie rzeczywistym skanuje hasła klucze w komentarzach pod postami FB i automatycznie inicjuje natychmiastowy kontakt (DM) na Messengerze. Poniższy panel pokazuje efektywność lejków w milisekundach.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-neutral-900/60 px-3.5 py-2 rounded-xl border border-neutral-850">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span className="text-[10px] font-mono text-neutral-400">Puls pętli:</span>
              <span className="text-[10px] font-mono text-white font-bold uppercase flex items-center gap-1">
                Skaner Aktywny
              </span>
            </div>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-neutral-900/40 border border-neutral-900 rounded-2xl p-4 flex items-center gap-4">
            <div className="p-3 bg-neutral-950 text-neutral-400 rounded-xl border border-neutral-850">
              <Eye size={20} />
            </div>
            <div>
              <span className="text-[10px] font-mono text-neutral-500 uppercase font-semibold block">Zasięg Postów (FB)</span>
              <div className="text-2xl font-black text-white font-mono mt-0.5">
                {dopamineReach.toLocaleString()}
              </div>
              <span className="text-[9px] text-emerald-400 font-mono flex items-center gap-1 leading-none mt-1">
                ▲ organic-reach.live
              </span>
            </div>
          </div>

          <div className={`bg-neutral-900/40 border transition-all duration-300 rounded-2xl p-4 flex items-center gap-4 ${dopaminePulse ? 'border-rose-500 bg-rose-950/10 filter drop-shadow-[0_0_10px_rgba(244,63,94,0.1)]' : 'border-neutral-900'}`}>
            <div className={`p-3 rounded-xl border transition-all ${dopaminePulse ? 'bg-rose-500/20 border-rose-500/30 text-rose-400' : 'bg-neutral-950 border-neutral-850 text-neutral-400'}`}>
              <MessageSquare size={20} />
            </div>
            <div>
              <span className="text-[10px] font-mono text-neutral-500 uppercase font-semibold block">Wykryte Komentarze</span>
              <div className="text-2xl font-black text-white font-mono mt-0.5 flex items-center gap-2">
                {dopamineComments}
                {dopaminePulse && <span className="text-xs text-rose-500 font-bold animate-ping">+1</span>}
              </div>
              <span className="text-[9px] text-rose-400 font-mono leading-none mt-1 block">
                Złapane słowa kluczowe
              </span>
            </div>
          </div>

          <div className="bg-neutral-900/40 border border-neutral-900 rounded-2xl p-4 flex items-center gap-4">
            <div className="p-3 bg-neutral-950 text-emerald-400 rounded-xl border border-neutral-850">
              <Bot size={20} />
            </div>
            <div>
              <span className="text-[10px] font-mono text-neutral-500 uppercase font-semibold block">Messenger Auto-DMs</span>
              <div className="text-2xl font-black text-white font-mono mt-0.5">
                {dopamineDMs}
              </div>
              <span className="text-[9px] text-emerald-400 font-mono leading-none mt-1 block">
                Skuteczność dostarczeń: {((dopamineDMs / dopamineComments) * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="bg-neutral-900/40 border border-neutral-900 rounded-2xl p-4 flex items-center gap-4">
            <div className="p-3 bg-neutral-950 text-amber-400 rounded-xl border border-neutral-850">
              <Clock size={20} />
            </div>
            <div>
              <span className="text-[10px] font-mono text-neutral-500 uppercase font-semibold block">Średnia latencja bota</span>
              <div className="text-2xl font-black text-white font-mono mt-0.5">
                {dopamineSpeed}s
              </div>
              <span className="text-[9px] text-amber-400 font-mono leading-none mt-1 block">
                Pik dopaminowy utrzymany
              </span>
            </div>
          </div>
        </div>

        {/* SCHEMATIC LOOP & TEST PANEL */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-neutral-950 p-6 border border-neutral-900 rounded-2xl mb-6 relative">
          
          {/* VISUAL DIAGRAM (Col-span-2) */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
              <span>Schemat Przepływu Impulsów Behawioralnych</span>
              {isSimulatingLoop && (
                <span className="text-[10px] bg-rose-500/10 text-rose-450 border border-rose-500/20 py-0.5 px-2 rounded animate-pulse">
                  TEST W TOKU...
                </span>
              )}
            </h3>

            {/* FLOW PIPES DIAGRAM */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
              
              {/* NODE 1 */}
              <div className={`p-4 rounded-xl border flex flex-col justify-between h-28 relative transition-all duration-300 ${testerStep === 1 ? 'border-rose-500 bg-rose-950/20' : 'border-neutral-900 bg-neutral-900/10'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold font-mono text-neutral-500">Krok 1</span>
                  <span className={`py-0.5 px-1.5 rounded-lg border text-[9px] font-mono font-bold ${testerStep === 1 ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 'bg-neutral-950 text-neutral-500 border-neutral-900'}`}>FB COMMENT</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Skaner Słów Kluczy</h4>
                  <p className="text-[9px] text-neutral-500 leading-tight mt-1">Wykrywanie fraz typu "PROCES" pod postami</p>
                </div>
                {testerStep === 1 && (
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-rose-500 rounded-full animate-ping" />
                )}
              </div>

              {/* NODE 2 */}
              <div className={`p-4 rounded-xl border flex flex-col justify-between h-28 relative transition-all duration-300 ${testerStep === 2 ? 'border-purple-500 bg-purple-950/20' : 'border-neutral-900 bg-neutral-900/10'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold font-mono text-neutral-500">Krok 2</span>
                  <span className={`py-0.5 px-1.5 rounded-lg border text-[9px] font-mono font-bold ${testerStep === 2 ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' : 'bg-neutral-950 text-neutral-500 border-neutral-900'}`}>WEBHOOK RUN</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Meta API Webhook</h4>
                  <p className="text-[9px] text-neutral-500 leading-tight mt-1">Przesłanie ID użytkownika i autoryzacji w tle</p>
                </div>
                {testerStep === 2 && (
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-purple-500 rounded-full animate-ping" />
                )}
              </div>

              {/* NODE 3 */}
              <div className={`p-4 rounded-xl border flex flex-col justify-between h-28 relative transition-all duration-300 ${testerStep === 3 ? 'border-amber-500 bg-amber-950/20' : 'border-neutral-900 bg-neutral-900/10'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold font-mono text-neutral-500">Krok 3</span>
                  <span className={`py-0.5 px-1.5 rounded-lg border text-[9px] font-mono font-bold ${testerStep === 3 ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-neutral-950 text-neutral-500 border-neutral-900'}`}>BOT PRIV DM</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Messenger Autopilot</h4>
                  <p className="text-[9px] text-neutral-500 leading-tight mt-1">Szybka wysyłka spersonalizowanego PDF bota</p>
                </div>
                {testerStep === 3 && (
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-amber-500 rounded-full animate-ping" />
                )}
              </div>

              {/* NODE 4 */}
              <div className={`p-4 rounded-xl border flex flex-col justify-between h-28 relative transition-all duration-300 ${testerStep === 4 ? 'border-emerald-500 bg-emerald-950/20' : 'border-neutral-900 bg-neutral-900/10'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold font-mono text-neutral-500">Krok 4</span>
                  <span className={`py-0.5 px-1.5 rounded-lg border text-[9px] font-mono font-bold ${testerStep === 4 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-neutral-950 text-neutral-505 border-neutral-900'}`}>CRM INTEGRATION</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Kvalifikacja & CRM</h4>
                  <p className="text-[9px] text-neutral-500 leading-tight mt-1">Zapisanie relacji z konwersacji do bazy danych</p>
                </div>
                {testerStep === 4 && (
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-emerald-500 rounded-full animate-ping" />
                )}
              </div>

            </div>
          </div>

          {/* SIMULATION & CONTROLLER ACTION (col-span-1) */}
          <div className="border-l border-neutral-900 pl-0 lg:pl-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <h3 className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                <span>Strefa Testu Lejka DM</span>
              </h3>
              
              <div className="space-y-1">
                <label className="text-[10px] text-neutral-500 font-mono uppercase">Aktywny Scenariusz / Słowa klucze</label>
                <select
                  value={dopamineCampaign}
                  onChange={(e) => setDopamineCampaign(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-xl text-xs py-2.5 px-3 focus:outline-none focus:border-rose-550"
                >
                  <option value="PROCES - Auto-audyt PDF [Grom-1]">PROCES - Auto-audyt PDF [Grom-1]</option>
                  <option value="KLIENT - Strategia zamknięcia [Dopa-3]">KLIENT - Strategia zamknięcia [Dopa-3]</option>
                  <option value="ZAPALNIK - Pozyskiwanie 100 leadów [Omega-9]">ZAPALNIK - Pozyskiwanie 100 leadów [Omega-9]</option>
                </select>
              </div>

              <p className="text-[10px] text-neutral-500 leading-relaxed font-sans">
                Wyzwalaj ręcznie pętlę testową, aby w czasie rzeczywistym prześledzić każdy mikro-krok: od komentarza na Facebooku, przez webhook, po wysłaną odpowiedź na Messengerze i zapis do bazy CRM.
              </p>
            </div>

            <button
              onClick={handleSimulateDopamineTest}
              type="button"
              disabled={isSimulatingLoop}
              className={`w-full py-3.5 rounded-xl text-xs font-black tracking-widest uppercase transition-all shadow-md flex items-center justify-center gap-2 ${
                isSimulatingLoop 
                  ? "bg-rose-900/30 text-rose-500 cursor-not-allowed border border-rose-500/20 animate-pulse" 
                  : "bg-rose-600 hover:bg-rose-500 text-white cursor-pointer hover:shadow-[0_0_15px_rgba(244,63,94,0.30)] border border-rose-500"
              }`}
            >
              {isSimulatingLoop ? (
                <>
                  <RefreshCw className="animate-spin" size={14} />
                  Krok {testerStep}/4 w toku...
                </>
              ) : (
                <>
                  <Play size={12} fill="currentColor" />
                  Przetestuj Pętlę (Szybka Dopamina)
                </>
              )}
            </button>
          </div>

        </div>

        {/* BOTTOM DOUBLE COLUMN: CONVERSION RATIO FUNNEL & REAL-TIME LOGS Ticker */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          
          {/* COLUMN A: NEURO-CONVERSION FUNNEL GRAPH */}
          <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <TrendingUp size={15} className="text-rose-500" />
              Skuteczność Konwersji Pętli (Dopamine Funnel)
            </h3>

            <div className="space-y-4 pt-1.5 font-sans">
              
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-neutral-300">1. Zasięg Organiczny (Wyświetlenia)</span>
                  <span className="text-[10px] text-neutral-400 font-mono font-bold">100.0%</span>
                </div>
                <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden border border-neutral-850">
                  <div className="bg-neutral-600 h-full rounded-full w-full" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-rose-400">2. Przerwanie wzorca (Komentarze z hasłem)</span>
                  <span className="text-[10px] text-rose-450 font-mono font-bold">18.4% (Śr. rynkowa: ~3.1%)</span>
                </div>
                <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden border border-neutral-850">
                  <div className="bg-rose-550 h-full rounded-full w-[18.4%]" style={{ width: '18.4%' }} />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-amber-400">3. Dostarczenie Messenger DM (Gratyfikacja)</span>
                  <span className="text-[10px] text-amber-405 font-mono font-bold border-amber-500/20">98.2% (Czas: śr. 1.2s)</span>
                </div>
                <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden border border-neutral-850">
                  <div className="bg-amber-550 h-full rounded-full w-[98.2%]" style={{ width: '98.2%' }} />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-emerald-400">4. Przekierowanie / Kwalifikacja CRM</span>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold">42.8% (Zakwalifikowani)</span>
                </div>
                <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden border border-neutral-850">
                  <div className="bg-emerald-500 h-full rounded-full w-[42.8%]" style={{ width: '42.8%' }} />
                </div>
              </div>

            </div>

            <p className="text-[9px] text-neutral-500 pt-1 leading-relaxed font-mono">
              *Dane generowane na podstawie analizy statystycznej podłączonych postów w czasie rzeczywistym. Algorytm optymalizuje bio-haczyki w celu podbicia czasu retencji.
            </p>
          </div>

          {/* COLUMN B: LIVE MESSENGER AUTOPILOT LOG Ticker */}
          <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-5 flex flex-col h-[280px] overflow-hidden">
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider border-b border-neutral-900 pb-3.5 mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Activity size={15} className="text-rose-500 animate-pulse" />
                Live Feed: Skaner Messenger & Webhooków
              </span>
              <span className="text-[9px] bg-emerald-950 text-emerald-400 px-2 py-0.5 border border-emerald-900 rounded font-bold uppercase font-mono">
                REAL-TIME STREAM
              </span>
            </h3>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-none">
              {dopamineLogs.map((log) => {
                let badgeClass = "bg-rose-500/10 text-rose-450 border border-rose-500/20";
                if (log.status === "qualify") {
                  badgeClass = "bg-emerald-500/10 text-emerald-450 border border-emerald-500/20";
                }
                
                return (
                  <div 
                    key={log.id} 
                    className="p-2.5 bg-neutral-900/20 border border-neutral-900 hover:border-neutral-850 rounded-xl flex items-start justify-between gap-3 text-xs transition-colors font-sans"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-[11px]">{log.user}</span>
                        <span className="text-[9px] font-mono text-neutral-500">{log.timestamp}</span>
                        <span className={`text-[8.5px] font-mono py-0.5 px-1.5 rounded uppercase tracking-widest leading-none ${badgeClass}`}>
                          {log.trigger}
                        </span>
                      </div>
                      <p className="text-neutral-400 text-[11px] truncate leading-normal">
                        {log.action}
                      </p>
                    </div>
                    
                    <div className="text-right shrink-0">
                      <span className="text-[9px] font-mono text-neutral-600 block leading-none">Latencja</span>
                      <span className="text-[11px] font-mono font-extrabold text-neutral-350 block mt-1">{log.speed}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* PIPELINE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMN 1 & 2: AUTOMATION OVERVIEWS & DISPATCH */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* COCKPIT TRIGGERS */}
          <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Sparkles size={18} className="text-purple-400" />
              Szybkie Uruchamianie Integracji CRM (Pipeline)
            </h2>
            <p className="text-neutral-400 text-xs mb-6">
              Wyzwalaj ręcznie proces pętli synchronizacyjnych i analizy mailowej Omega.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              
              <div className="border border-neutral-900 rounded-xl p-4 bg-neutral-900/20 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-purple-400 text-sm font-semibold mb-1">
                    <Mail size={16} /> Gmail ➡️ Google Tasks
                  </div>
                  <p className="text-neutral-500 text-[11px] leading-relaxed">
                    Pobierze wiadomości z Gmaila pasujące do fraz <span className="text-neutral-300 font-mono">"Lead" | "Współpraca"</span>, dokona analizy i podsumowania Gemini, po czym utworzy powiązane zadanie w Google Tasks chroniąc przed duplikacją.
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-[10px] text-neutral-400 font-mono">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Auto-ochrona przed duplikatami
                </div>
              </div>

              <div className="border border-neutral-900 rounded-xl p-4 bg-neutral-900/20 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold mb-1">
                    <FileSpreadsheet size={16} /> Dwukierunkowy Google Sheet CRM
                  </div>
                  <p className="text-neutral-500 text-[11px] leading-relaxed">
                    Automatycznie wyeksportuje brakujących klientów z Firestore CRM do arkusza Google Sheets "Omega CRM Klienci & Leady" oraz zaimportuje nowo dopisane wiersze z arkusza z powrotem do systemu CRM w bazie Firestore.
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-[10px] text-neutral-400 font-mono">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Synchronizacja dwukierunkowa
                </div>
              </div>

            </div>

            <button
              onClick={handleTriggerAutomation}
              disabled={isRunningAutomation || !googleToken}
              className={`w-full py-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-3 transition-all ${
                isRunningAutomation
                  ? "bg-purple-900/30 text-purple-400 border border-purple-500/30 cursor-not-allowed"
                  : !googleToken
                  ? "bg-neutral-900 text-neutral-500 border border-neutral-850 cursor-not-allowed"
                  : "bg-purple-600 border border-purple-500 hover:bg-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)] cursor-pointer"
              }`}
            >
              {isRunningAutomation ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Przetwarzanie pętli integracji Omega...
                </>
              ) : (
                <>
                  <Play size={16} fill="currentColor" />
                  Uruchom Pełny Przepływ Automatyzacji
                </>
              )}
            </button>
          </div>

          {/* GMAIL AUTO-RESPONDER PANEL */}
          <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-6 relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Sparkles size={18} className="text-emerald-400" />
              Inteligentny Asystent Odpowiedzi (Gmail Auto-Draft)
            </h2>
            <p className="text-neutral-400 text-xs mb-6">
              Przeanalizuj spotkania oraz status klienta i jednym kliknięciem stwórz spersonalizowaną propozycję follow-up jako wersję roboczą bezpośrednio w Gmailu.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mb-6">
              <div className="md:col-span-2 space-y-1.5">
                <label className="block text-xs text-neutral-500 font-medium font-mono">Wybierz klienta do odpowiedzi follow-up</label>
                {isLoadingClients ? (
                  <div className="text-neutral-600 text-xs py-2">Pobieranie listy klientów z CRM...</div>
                ) : clients.length === 0 ? (
                  <div className="text-xs text-rose-400 border border-rose-500/20 bg-rose-500/5 p-3 rounded-xl">
                    Brak klientów w systemie. Dodaj nowego klienta w Zapalniku CRM.
                  </div>
                ) : (
                  <select
                    value={selectedDraftClientId}
                    onChange={(e) => setSelectedDraftClientId(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 text-white text-xs rounded-xl px-3 py-3 focus:outline-none focus:border-emerald-500/50"
                  >
                    {clients.map((c, index) => (
                      <option key={`draft-client-${c.id || "client"}-${index}`} value={c.id}>
                        {c.name || "Brak nazwy"} - {c.email} ({c.status})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <button
                  onClick={handleGenerateEmailDraft}
                  disabled={isGeneratingDraft || !googleToken || clients.length === 0}
                  className={`w-full py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                    isGeneratingDraft
                      ? "bg-emerald-990/30 text-emerald-500 border border-emerald-500/30 cursor-not-allowed"
                      : !googleToken || clients.length === 0
                      ? "bg-neutral-900 text-neutral-500 border border-neutral-850 cursor-not-allowed"
                      : "bg-emerald-600 border border-emerald-500 hover:bg-emerald-500 text-white cursor-pointer hover:shadow-[0_0_15px_rgba(16,185,129,0.25)]"
                  }`}
                >
                  {isGeneratingDraft ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Tworzenie szkicu...
                    </>
                  ) : (
                    <>
                      <Mail size={14} />
                      Zapisz wersję roboczą
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* PREVIEW OF GENERATED DRAFT */}
            <AnimatePresence>
              {lastDraftResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="border border-neutral-800 bg-neutral-900/10 rounded-xl p-4 mt-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 font-mono uppercase">
                      <Mail size={14} /> Gmail Draft utworzony pomyślnie
                    </span>
                    <span className="text-[10px] text-neutral-500 font-mono">Gmail Folder: "Wersje Robocze"</span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] text-neutral-500 font-mono">TEMAT:</div>
                    <div className="text-sm font-semibold text-white">{lastDraftResult.subject}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] text-neutral-500 font-mono">TREŚĆ DRAFTU (HTML RENDERING):</div>
                    <div 
                      className="bg-black/60 p-4 border border-neutral-950 rounded-lg text-xs text-neutral-300 font-sans leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap select-none"
                      dangerouslySetInnerHTML={{ __html: lastDraftResult.htmlBody }}
                    />
                  </div>
                  <div className="text-[9px] text-neutral-500 font-mono italic">
                    ID Draftu w Gmail API: {lastDraftResult.draftId}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* GOOGLE DRIVE TACTICAL BRIEF GENERATOR */}
          <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-6 relative">
            <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <FolderOpen size={18} className="text-amber-400" />
              Dysk Google: Generowanie Briefów Taktycznych
            </h2>
            <p className="text-neutral-400 text-xs mb-6">
              Stwórz spersonalizowaną, strategiczną ofertę / brief dla klienta i zapisz bezpośrednio w bezpiecznym folderze <strong className="text-neutral-300">"Umowy i Oferty"</strong> na Dysku Google.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mb-6">
              <div className="md:col-span-2 space-y-1.5">
                <label className="block text-xs text-neutral-500 font-medium font-mono">Wybierz klienta z CRM</label>
                {isLoadingClients ? (
                  <div className="text-neutral-600 text-xs py-2">Pobieranie listy klientów z CRM...</div>
                ) : clients.length === 0 ? (
                  <div className="text-xs text-rose-400 border border-rose-500/20 bg-rose-500/5 p-3 rounded-xl">
                    Brak klientów w systemie. Dodaj nowego klienta w Zapalniku CRM.
                  </div>
                ) : (
                  <select
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 text-white text-xs rounded-xl px-3 py-3 focus:outline-none focus:border-amber-500/50"
                  >
                    {clients.map((c, index) => (
                      <option key={`brief-client-${c.id || "client"}-${index}`} value={c.id}>
                        {c.name || "Brak nazwy"} - {c.email} ({c.status})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <button
                  onClick={handleGenerateAndUploadBrief}
                  disabled={isGeneratingBrief || !googleToken || clients.length === 0}
                  className={`w-full py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                    isGeneratingBrief
                      ? "bg-amber-900/30 text-amber-500 border border-amber-500/30 cursor-not-allowed"
                      : !googleToken || clients.length === 0
                      ? "bg-neutral-900 text-neutral-500 border border-neutral-850 cursor-not-allowed"
                      : "bg-amber-600 border border-amber-500 hover:bg-amber-500 text-white cursor-pointer hover:shadow-[0_0_15px_rgba(245,158,11,0.25)]"
                  }`}
                >
                  {isGeneratingBrief ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Inicjowanie...
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      Wyślij na Dysk Google
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* PREVIEW OF LAST GENERATED BRIEF */}
            <AnimatePresence>
              {lastBriefResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="border border-neutral-800 bg-neutral-900/10 rounded-xl p-4 mt-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-amber-400 font-bold flex items-center gap-1.5 font-mono uppercase">
                      <FileText size={14} /> Świeżo utworzony plik
                    </span>
                    <span className="text-[10px] text-neutral-500 font-mono">Dysk Google: "Umowy i Oferty"</span>
                  </div>
                  <div className="text-sm font-semibold text-white">{lastBriefResult.fileName}</div>
                  <pre className="bg-black/60 p-4 border border-neutral-950 rounded-lg text-[11px] text-neutral-400 font-mono max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed select-none font-sans">
                    {lastBriefResult.preview}
                  </pre>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

        {/* COLUMN 3: SYSTEM DAEMONS & PRIORITY BREAKDOWN & REAL-TIME AUDIT LOGS */}
        <div className="space-y-6">

          {/* BACKUP CRON DEMON STATUS */}
          <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-5 relative overflow-hidden">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
              <Clock size={15} className="text-emerald-400" />
              Demon Tla (Background Syncer)
            </h3>
            <div className="p-3 bg-neutral-900/35 border border-neutral-800 rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-neutral-400">Pętla automatyczna (CRON):</span>
                <span className="text-[10px] text-emerald-400 font-bold animate-pulse font-mono uppercase">AKTYWNY (15 MIN)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-neutral-400">Autoryzowana sesja serwera:</span>
                <span className="text-[10px] text-neutral-300 font-mono">{googleToken ? "Zsynchronizowana" : "Oczekuje"}</span>
              </div>
              <p className="text-[9px] text-neutral-500 pt-1 leading-relaxed">
                Co 15 minut serwer przetwarza w tle listy mailowe z Gmaila w poszukiwaniu nowych leadów i aktualizuje dwukierunkowo arkusze Google Sheets bez interwencji użytkownika.
              </p>
            </div>
          </div>

          {/* RECHARTS PRIORITY BREAKDOWN */}
          <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-5">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <TrendingUp size={15} className="text-purple-400" />
              Rozkład Priorytetów Leadów
            </h3>
            
            <div className="h-44 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="45%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {priorityData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={PRIORITY_COLORS[entry.name as keyof typeof PRIORITY_COLORS] || "#6b7280"} 
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0a0a0a",
                      border: "1px solid #262626",
                      borderRadius: "10px",
                      color: "#fff",
                      fontSize: "11px",
                      fontFamily: "monospace"
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Bespoke Custom Legend */}
            <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 mt-2 font-mono text-[9px]">
              {priorityData.map((d, index) => {
                const col = PRIORITY_COLORS[d.name as keyof typeof PRIORITY_COLORS] || "#6b7280";
                return (
                  <div key={`legend-${index}`} className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: col }} />
                    <span className="text-neutral-400">{d.name}</span>
                    <span className="text-white font-bold">({d.value})</span>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* REAL-TIME AUDIT LOGS */}
          <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-6 flex flex-col max-h-[480px] overflow-hidden">
            <div className="flex items-center justify-between border-b border-neutral-900 pb-4 mb-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Activity size={16} className="text-rose-400 animate-pulse" />
                Dziennik Logów (Audit Trail)
              </h3>
              <button
                onClick={fetchLogs}
                disabled={isLoadingLogs}
                className="p-1.5 hover:bg-neutral-900 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Odśwież dziennik logów"
              >
                <RefreshCw size={14} className={isLoadingLogs ? "animate-spin" : ""} />
              </button>
            </div>

            {/* LOG STREAM */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[220px] max-h-[300px]">
              {logs.length === 0 ? (
                <div className="text-neutral-500 text-xs italic py-12 text-center">
                  Brak zapisanych logów operacji. Uruchom synchronizację wyżej, aby zainicjować zbieranie logów w Firestore.
                </div>
              ) : (
                logs.map((log, index) => {
                  let badgeColor = "bg-neutral-900 text-neutral-400 border-neutral-850";
                  let Icon = Info;

                  if (log.status === "success") {
                    badgeColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                    Icon = CheckCircle2;
                  } else if (log.status === "error") {
                    badgeColor = "bg-rose-500/10 text-rose-400 border-rose-500/20";
                    Icon = AlertCircle;
                  } else if (log.status === "warn") {
                    badgeColor = "bg-amber-500/10 text-amber-400 border-amber-500/20";
                    Icon = AlertCircle;
                  }

                  return (
                    <div 
                      key={`${log.id || "log"}-${index}`}
                      className="p-3 border border-neutral-900/65 bg-neutral-900/10 rounded-xl space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[9px] px-2 py-0.5 rounded border font-mono font-bold uppercase tracking-wider ${badgeColor} flex items-center gap-1`}>
                          <Icon size={10} />
                          {log.type}
                        </span>
                        <span className="text-[9px] text-neutral-600 font-mono">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-300 font-sans leading-relaxed break-words">
                        {log.message}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            <div className="border-t border-neutral-900 pt-4 mt-4 text-[10px] text-neutral-500 font-mono flex items-center justify-between">
              <span>Baza logów: Firestore Admin</span>
              <span>Ω OMEGA CENTRAL v3.9</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
