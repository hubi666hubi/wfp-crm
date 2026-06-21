import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  TrendingUp, 
  Sparkles, 
  Lock, 
  Unlock, 
  LineChart as LucideLineChart, 
  Copy, 
  Bookmark, 
  Award, 
  RefreshCw, 
  Layers, 
  Terminal, 
  AlertCircle,
  ChevronRight,
  CreditCard,
  Wallet,
  CheckCircle2,
  ShieldAlert,
  DollarSign,
  ArrowUpRight,
  Activity
} from "lucide-react";
import { toast } from "sonner";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Legend
} from "recharts";
import { useSettingsStore } from "../store/settingsStore";
import { auth } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

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

export function ProDashboard() {
  const navigate = useNavigate();
  
  // States
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [militaryMode, setMilitaryMode] = useState(true);
  const [activeTab, setActiveTab] = useState<"insights" | "hooks" | "radar" | "watchlist" | "stripe-finance">("insights");
  
  // Access state (Security Priority Access)
  const [isProAccessUnlocked, setIsProAccessUnlocked] = useState<boolean>(() => {
    return localStorage.getItem("omega_pro_access") === "true";
  });
  const [passcode, setPasscode] = useState<string>("");
  const [verifying, setVerifying] = useState<boolean>(false);

  // Stripe & Subs states
  const [userEmail, setUserEmail] = useState<string>("hubi666hubi@gmail.com");
  const [isUserPremium, setIsUserPremium] = useState<boolean>(() => {
    return localStorage.getItem("omega_user_premium") === "true";
  });
  const [verifyingPremium, setVerifyingPremium] = useState<boolean>(false);
  const [revenueLoading, setRevenueLoading] = useState<boolean>(false);
  const [revenueStats, setRevenueStats] = useState<{
    totalRevenue: number;
    mrr: number;
    avgOrderValue: number;
    premiumCount: number;
    transactions: any[];
  } | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<boolean>(false);
  const [syncLoading, setSyncLoading] = useState<boolean>(false);

  // Biometric gym korelacja sync state and effect
  const [isWorkoutCompleted, setIsWorkoutCompleted] = useState(() => {
    return localStorage.getItem("omega_workout_finished_today") === "true";
  });

  useEffect(() => {
    const checkGymStatus = () => {
      const isFinished = localStorage.getItem("omega_workout_finished_today") === "true";
      setIsWorkoutCompleted(isFinished);
    };
    checkGymStatus();
    const interval = setInterval(checkGymStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleInicjujZrzut = async (t: TrendItem) => {
    const pasHook = `Marnujesz godziny na bezużyteczny prospecting? Trend "${t.topic}" przejmuje rynek, a Twoja konkurencja już automatyzuje ten proces.`;
    
    // Save to local cache for VSL generator
    localStorage.setItem("omega_zrzut_vsl_topic", t.topic);
    localStorage.setItem("omega_zrzut_vsl_hook", pasHook);

    const connectPitch = `Cześć! Zauważyłem, że interesujesz się tematem: ${t.topic}. Słowa kluczowe: ${t.keywords.join(", ")}. Mamy gotowe rozwiązanie pod ten trend. Chętnie podeślę bezpłatne SOP/E-booka! Odpisz na tę wiadomość.`;
    
    addLog(`INICJACJA ZRZUTU: Przygotowanie pakietu dla "${t.topic}"...`);
    
    try {
      // Connect to CRM / inbound database
      const response = await fetch('/api/inbound-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `ZRZUT: ${t.portal} Trend`,
          bio: `Automatycznie zaimplementowany lead zrzutowy pod najnowszy trend z radaru. Słowa kluczowe: ${t.keywords.join(', ')}`,
          source: 'Kolejka ZRZUT'
        })
      });

      if (response.ok) {
        localStorage.setItem("omega_zrzut_zapalnik_message", connectPitch);
        localStorage.setItem("omega_zrzut_zapalnik_keywords", JSON.stringify(t.keywords));
        toast.success("Inicjalizacja ZRZUT pomyślna! Przekierowanie do generatora VSL...", { duration: 2500 });
        addLog(`ZRZUT (Sukces): Wyemitowano rekord CRM oraz szablon VSL dla trendu.`);
      } else {
        throw new Error();
      }
    } catch {
      localStorage.setItem("omega_zrzut_zapalnik_message", connectPitch);
      localStorage.setItem("omega_zrzut_zapalnik_keywords", JSON.stringify(t.keywords));
      toast.success("Zapisano lokalnie! Przekierowanie do generatora VSL...", { duration: 2500 });
      addLog(`ZRZUT (Wektor lokalny): Zapisano lokalną konfigurację startową.`);
    }

    // Direct redirection to the VSL page so they can build target script instantly
    setTimeout(() => {
      navigate('/vsl-generator');
    }, 1200);
  };

  // Selector for trends in charts / hook generator
  const [selectedTrendId, setSelectedTrendId] = useState<string>("");
  
  // LocalStorage Persisted Watchlist
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("omega_pro_watchlist");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [interactiveLogs, setInteractiveLogs] = useState<string[]>([]);

  const addLog = useCallback((msg: string) => {
    const time = new Date().toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setInteractiveLogs(prev => [...prev.slice(-6), `[${time}] ${msg}`]);
  }, []);

  // Fetch alive trends from backend API
  const fetchTrends = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/trends/stream");
      if (!res.ok) throw new Error("API stream response failure");
      const data = await res.json();
      const loadedTrends: TrendItem[] = data.trends || [];
      setTrends(loadedTrends);
      
      if (loadedTrends.length > 0) {
        setSelectedTrendId(prevId => prevId || loadedTrends[0].id);
      }
      
      addLog(`Pro-Tier Synchronizacja: Pobrano ${loadedTrends.length} aktywnych wektorów trendów.`);
    } catch (err) {
      console.error("Error fetching pro trends:", err);
      addLog("Błąd: Serwer trendów nie odpowiada. Uruchomiono tryb lokalnego zapasowego bufora.");
      toast.error("Błąd połączenia z radarem trendów.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [addLog, setSelectedTrendId]);

  // Fetch Stripe financial revenue stats in real-time
  const fetchRevenueStats = useCallback(async (silent = false) => {
    if (!silent) setRevenueLoading(true);
    try {
      const response = await fetch("/api/stripe/revenue-stats");
      if (response.ok) {
        const data = await response.json();
        setRevenueStats(data);
        addLog(`Synchronizacja Stripe: Obliczono ${data.totalRevenue} PLN całkowitych obrotów live.`);
      }
    } catch (err) {
      console.error("fetchRevenueStats error:", err);
      addLog("Stripe Error: Nie udało się pobrać statystyk przychodowych live.");
    } finally {
      if (!silent) setRevenueLoading(false);
    }
  }, [addLog]);

  // Automatic and manual payment status checking
  const verifyPremiumStatus = useCallback(async (emailToVerify: string, silent = false) => {
    if (!silent) setVerifyingPremium(true);
    try {
      const response = await fetch("/api/stripe/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToVerify })
      });
      if (response.ok) {
        const data = await response.json();
        setIsUserPremium(data.isPremium);
        localStorage.setItem("omega_user_premium", data.isPremium ? "true" : "false");
        
        if (data.isPremium) {
          addLog(`Ranga Premium: ${emailToVerify} posiada aktywną licencję Stripe.`);
          if (!silent) {
            toast.success("Weryfikacja pomyślna! System wykrył aktywną płatność Stripe Premium.");
          }
        } else {
          addLog(`Ranga Freemium: Brak aktywnego zakupu dla ${emailToVerify}.`);
          if (!silent) {
            toast.info("Status Freemium. Odblokuj dostęp Premium za pomocą Stripe.");
          }
        }
      }
    } catch (err) {
      console.error("verifyPremiumStatus error:", err);
    } finally {
      if (!silent) setVerifyingPremium(false);
    }
  }, [addLog]);

  // Synchronize userEmail with Firebase Auth state dynamically
  useEffect(() => {
    // Sprawdzamy czy jesteśmy w trybie demo-sandbox
    const isDemo = localStorage.getItem("auth_demo_logged_in") === "true";
    if (isDemo) {
      setUserEmail("hubi666hubi@gmail.com");
      verifyPremiumStatus("hubi666hubi@gmail.com", true);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email) {
        setUserEmail(user.email);
        verifyPremiumStatus(user.email, true);
      } else {
        setUserEmail("hubi666hubi@gmail.com");
        verifyPremiumStatus("hubi666hubi@gmail.com", true);
      }
    });

    return () => unsubscribe();
  }, [verifyPremiumStatus]);

  // Trigger Stripe Payment Gateway with current user config
  const handleUpgradeToPremium = async () => {
    setCheckoutLoading(true);
    addLog(`Stripe Billing: Inicjowanie sesji zakupowej dla ${userEmail}...`);
    try {
      const stripeKey = useSettingsStore.getState().stripeKey || "sk_test_dummy";
      const currentUser = auth.currentUser;
      const actualClientId = currentUser ? currentUser.uid : (localStorage.getItem("auth_demo_logged_in") === "true" ? "demo_tycoon_user" : `usr_${Date.now()}`);
      
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stripeKey,
          amount: 199,
          currency: "PLN",
          productName: "Omega Intelligence Premium License",
          successUrl: `${window.location.origin}/pro-dashboard?status=success&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/pro-dashboard?status=cancel`,
          clientId: actualClientId,
          clientEmail: userEmail,
          clientName: userEmail.split("@")[0] || "Użytkownik Premium",
          gmailToken: ""
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Wystąpił błąd przy inicjowaniu sesji Stripe");
      }

      const data = await response.json();
      
      if (data.url) {
        addLog(`Przekierowanie do portalu płatności Stripe: ${data.url}`);
        toast.success("Przekierowanie do bezpiecznej bramki płatniczej Stripe...");
        setTimeout(() => {
          window.location.href = data.url;
        }, 1200);
      } else {
        throw new Error("Brak wygenerowanego linku płatności (Stripe URL)");
      }
    } catch (err: any) {
      console.error("Stripe payment init error:", err);
      toast.error(`Błąd inicjacji Stripe: ${err.message}`);
      addLog(`Billing Error: ${err.message}`);
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Sync Factory: manually trigger raw session fetching and update local cache
  const handleSyncFactory = async () => {
    setSyncLoading(true);
    addLog("Stripe Sync Flow: Inicjowanie synchronizacji Sync Factory dla sesji Stripe i cache Firestore...");
    
    toast.promise(
      (async () => {
        const stripeKey = useSettingsStore.getState().stripeKey || "sk_test_dummy";
        const response = await fetch("/api/stripe/sync-sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stripeKey })
        });
        
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Failed to trigger backend sync sessions");
        }
        
        const data = await response.json();
        // Instantly re-request revenue metrics to sync local React state
        await fetchRevenueStats(true);
        addLog(`Sync Factory zakończona pomyślnie. Status: ${data.message}`);
        return data;
      })(),
      {
        loading: "Uruchamianie Sync Factory... Autoryzowanie z chmurą Stripe i odświeżanie cache docelowego.",
        success: (data) => `Zsynchronizowano! ${data.message}`,
        error: (err) => `Problem z synchronizacją: ${err.message}`
      }
    );

    setTimeout(() => {
      setSyncLoading(false);
    }, 1500);
  };

  // Intercepting Stripe Success/Cancel return params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    if (status === "success") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsUserPremium(true);
      localStorage.setItem("omega_user_premium", "true");
      toast.success("Wspaniale! Twoja subskrypcja Premium została pomyślnie opłacona przez Stripe.");
      addLog("Autoryzacja Stripe: Sukces płatniczy! Odblokowano rangę nielimitowaną PREMIUM.");
      verifyPremiumStatus(userEmail, true);
      fetchRevenueStats(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (status === "cancel") {
      toast.info("Anulowano płatność Stripe.");
      addLog("Płatność anulowana przez użytkownika.");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [addLog, userEmail, verifyPremiumStatus, fetchRevenueStats]);

  // Initial Fetch & periodic updates
  useEffect(() => {
    const initTimer = setTimeout(() => {
      fetchTrends();
      verifyPremiumStatus(userEmail, true);
      fetchRevenueStats(true);
    }, 50);
    
    // Auto refresh every 20 seconds for continuous live analytics
    const interval = setInterval(() => {
      fetchTrends(true);
      fetchRevenueStats(true);
    }, 20000);

    return () => {
      clearTimeout(initTimer);
      clearInterval(interval);
    };
  }, [fetchTrends, fetchRevenueStats, verifyPremiumStatus, userEmail]);

  // Persist Watchlist changes
  useEffect(() => {
    localStorage.setItem("omega_pro_watchlist", JSON.stringify(watchlist));
  }, [watchlist]);

  // Handle premium unlock
  const handleVerifyAccess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) {
      toast.error("Wprowadź kod autoryzacyjny!");
      return;
    }
    setVerifying(true);
    
    // Simulate real auth validation with polish feedback
    setTimeout(() => {
      if (passcode.toLowerCase() === "omega" || passcode === "3000" || passcode.toLowerCase() === "pro") {
        setIsProAccessUnlocked(true);
        localStorage.setItem("omega_pro_access", "true");
        addLog("AUTORYZACJA WYSOKIEGO PRIORYTETU: Przyznano klucz administratora OMEGA-PRO.");
        toast.success("Dostęp zweryfikowany! Witamy w Pro-Tier Command Center.");
      } else {
        toast.error("Nieprawidłowy kod autoryzacyjny Pro-Tier. Spróbuj 'omega' lub 'pro'.");
        addLog("NIEAUTORYZOWANA PRÓBA: Zablokowano próbę wejścia do bazy Insights.");
      }
      setVerifying(false);
      setPasscode("");
    }, 1200);
  };

  const handleLockAccess = () => {
    setIsProAccessUnlocked(false);
    localStorage.setItem("omega_pro_access", "false");
    addLog("Operator wylogowany z modułu priorytetowego PRO.");
    toast.info("Zablokowano bezpieczny dostęp do analiz PRO.");
  };

  // Watchlist helpers
  const toggleWatchlist = (id: string, name: string) => {
    setWatchlist(prev => {
      const exists = prev.includes(id);
      if (exists) {
        addLog(`Watchlist: Usunięto trend "${name.substring(0, 20)}..."`);
        toast.success("Usunięto z listy obserwowanych");
        return prev.filter(item => item !== id);
      } else {
        addLog(`Watchlist: Dodano trend "${name.substring(0, 20)}..."`);
        toast.success("Dodano do listy obserwacji PRO");
        return [...prev, id];
      }
    });
  };

  // Computed Values - Advanced Metrics Aggregates
  const stats = useMemo(() => {
    if (trends.length === 0) {
      return {
        avgVelocity: 0,
        maxViralCoeff: 0,
        marketingShare: 0,
        techShare: 0,
        activeSectors: 0
      };
    }
    const totalVel = trends.reduce((sum, item) => sum + item.velocity, 0);
    const avgVelocity = Math.round(totalVel / trends.length);
    const maxViralCoeff = Math.max(...trends.map(item => item.viralCoefficient));
    
    const marketingCount = trends.filter(t => t.category === "Marketing").length;
    const techCount = trends.filter(t => t.category === "Tech").length;
    const marketingShare = Math.round((marketingCount / trends.length) * 100);
    const techShare = Math.round((techCount / trends.length) * 100);
    
    const sectors = new Set(trends.map(t => t.category)).size;

    return {
      avgVelocity,
      maxViralCoeff,
      marketingShare,
      techShare,
      activeSectors: sectors
    };
  }, [trends]);

  // Aggregate Stripe transactions daily to form a beautiful timeline curve
  const monthlyRevenueChart = useMemo(() => {
    if (!revenueStats || !revenueStats.transactions) return [];
    
    const groups: { [key: string]: number } = {};
    const sorted = [...revenueStats.transactions].reverse(); // oldest to newest on graph
    
    sorted.forEach(tx => {
      try {
        const d = new Date(tx.paidAt);
        const label = d.toLocaleDateString("pl-PL", { month: "short", day: "numeric" });
        groups[label] = (groups[label] || 0) + Number(tx.amount);
      } catch {
        // Fallback
      }
    });

    return Object.keys(groups).map(date => ({
      Data: date,
      "Przychód (PLN)": groups[date]
    }));
  }, [revenueStats]);

  // Aggregate Data for Recharts Bar Chart: Velocity by Portal
  const portalChartData = useMemo(() => {
    const portals = ["TikTok", "Instagram", "Facebook", "LinkedIn", "YouTube Shorts"];
    return portals.map(p => {
      const portalTrends = trends.filter(t => t.portal === p);
      const avgVel = portalTrends.length > 0 
        ? Math.round(portalTrends.reduce((sum, t) => sum + t.velocity, 0) / portalTrends.length)
        : 0;
      const count = portalTrends.length;
      return {
        name: p,
        "Średnia Prędkość (spikes/h)": avgVel,
        "Skala Wolumenu": count * 35
      };
    });
  }, [trends]);

  // Aggregate Data for Category Chart
  const categoryChartData = useMemo(() => {
    const categories: ("Tech" | "Marketing" | "Lifestyle" | "Finance" | "E-commerce")[] = [
      "Tech", "Marketing", "Lifestyle", "Finance", "E-commerce"
    ];
    return categories.map(c => {
      const catTrends = trends.filter(t => t.category === c);
      const avgCoeff = catTrends.length > 0
        ? parseFloat((catTrends.reduce((sum, t) => sum + t.viralCoefficient, 0) / catTrends.length).toFixed(1))
        : 0;
      return {
        category: c,
        "Wskaźnik Wiralowości (1-10)": avgCoeff
      };
    });
  }, [trends]);

  // Selected Trend for Detail Analytics
  const selectedTrend = useMemo(() => {
    return trends.find(t => t.id === selectedTrendId) || trends[0];
  }, [trends, selectedTrendId]);

  // Simulated live projection data based on selected trend viral coeff
  const projectionChartData = useMemo(() => {
    if (!selectedTrend) return [];
    
    const baseCoeff = selectedTrend.viralCoefficient;
    const baseVel = selectedTrend.velocity;
    
    // Generate a 7-day resonance decay & engagement path projection
    return Array.from({ length: 7 }).map((_, idx) => {
      const day = idx + 1;
      const decayFactor = Math.exp(-idx * 0.28); // natural exponential decay
      const resonance = Math.round(baseCoeff * 10 * decayFactor + (Math.sin(baseCoeff * day) * 3));
      const engagement = Math.round(baseVel * 1.5 * decayFactor);
      
      return {
        day: `Dzień ${day}`,
        "Indeks Rezonansu": Math.max(5, resonance),
        "Aktywność (Projections)": Math.max(10, engagement)
      };
    });
  }, [selectedTrend]);

  // Pro Copywriting Hooks AI Variations database based on frameworks and parameters
  const getProHooks = useMemo(() => {
    if (!selectedTrend) return [];
    
    const topic = selectedTrend.topic;
    const kw = selectedTrend.keywords[0] || "#marketing";
    
    const baseHooks = [
      {
        framework: "Pętla Ciekawości (Curiosity Loop)",
        desc: "Buduje silne napięcie poznawcze tak, by użytkownik musiał doczytać lub skomentować wyrazem-kluczem.",
        hook: `Te algorytmy działają zbyt szybko. Wszyscy mówią o ${topic}, ale 99% ludzi przegapiło ten jeden ukryty krok...`,
        outline: "1. Otwarcie szoku (Pętla) -> 2. Dowód rzeczowy (Zjawisko) -> 3. Odwrócenie oczekiwań (Mój sekret) -> 4. Silne Call-To-Action (Skomentuj słowo klucz)."
      },
      {
        framework: "Problem - Agitacja - Rozwiązanie (PAS)",
        desc: "Klasyczny, bezlitosny model perswazyjny celujący w największe frustracje Twojego idealnego klienta.",
        hook: `Marnujesz godziny na bezużyteczny prospecting? Trend ${topic} przejmuje rynek, a Twoja konkurencja już automatyzuje ten proces.`,
        outline: "1. Problem (Marnowany czas) -> 2. Wyolbrzymienie (Konkurencja Cię wyprzedzi) -> 3. Rozwiązanie (System Omega wdrożony w 4 min) -> 4. Osiągnięcie korzyści."
      },
      {
        framework: "Hojny Prezent (High-Value Bait & Auto-DM)",
        desc: "Zaprojektowany pod viralowy algorytm komentarzy (odmiana pod Instagram / Facebook).",
        hook: `Spędziłem 14 godzin na analizie ${topic} i stworzyłem szablon SOP pod to rozwiązanie. Skomentuj słowem "${kw.toUpperCase().replace("#", "")}", a wyślę go za darmo.`,
        outline: "1. Twardy wynik osobisty -> 2. Obietnica natychmiastowego skrócenia drogi -> 3. Warunek algorytmiczny (Skomentuj) -> 4. Silnik AI wysyła automatyczny plik PDF."
      }
    ];

    if (isWorkoutCompleted) {
      baseHooks.push({
        framework: "Bestia (High-Energy Aggressive Hook) 🔥",
        desc: "Maksymalnie dynamiczny, agresywny ton idealny do nagrania wideo po powrocie z siłowni na najwyższym poziomie dopaminy.",
        hook: `Przestań wierzyć tym pustym teoretykom! Prawda o "${topic}" jest taka, że większość z Was traci cenny czas, gdy liderzy rynku bezwzględnie automatyzują ten proces dzień i noc.`,
        outline: "1. Agresywne uderzenie (Pobudka!) -> 2. Obnażenie słabości teoretyków -> 3. Gotowe rozwiązanie (Omega PRO) -> 4. Twarde wezwanie do natychmiastowego działania (Skomentuj i odbierz)."
      });
    }

    return baseHooks;
  }, [selectedTrend, isWorkoutCompleted]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Skopiowano do schowka systemowego!");
    addLog("Schowek: Skopiowano wygenerowany hook perswazyjny.");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto" id="pro-insights-dashboard-root">
      
      {/* Top Welcome Title Grid */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-neutral-950 border border-neutral-900 rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-mono font-bold uppercase tracking-wider animate-pulse flex items-center gap-1">
              <Award size={12} /> PRO-TIER MODULE
            </span>
            <span className="px-2 py-0.5 bg-neutral-900 text-neutral-400 border border-neutral-800 rounded-lg text-[10px] font-mono uppercase">
              Zaawansowana Analityka
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white font-sans flex items-center gap-3 tracking-tight uppercase">
            <TrendingUp size={28} className="text-rose-500" /> Omega Pro Insights
          </h1>
          <p className="text-neutral-400 text-sm mt-1.5 max-w-2xl font-sans">
            Wielowymiarowy agregator trendów społecznościowych z predykcjami żywotności. Moduł wyszukuje anomalie wiralowe i paruje je z gotowymi matrycami perswazyjnymi.
          </p>
        </div>

        {/* Priority Access Toggle Display Box */}
        <div className="z-10 bg-neutral-900/40 border border-neutral-800/80 p-4 rounded-2xl flex flex-col items-stretch gap-2.5 min-w-[280px]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {isUserPremium ? (
                <span className="p-1 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                  <CheckCircle2 size={14} className="animate-pulse" />
                </span>
              ) : isProAccessUnlocked ? (
                <span className="p-1 rounded bg-amber-500/15 border border-amber-500/30 text-amber-400">
                  <Unlock size={14} />
                </span>
              ) : (
                <span className="p-1 rounded bg-rose-500/15 border border-rose-500/30 text-rose-400">
                  <Lock size={14} />
                </span>
              )}
              <div>
                <span className="text-[10px] font-mono uppercase text-neutral-500 block">Status Subskrypcji</span>
                <span className="text-xs font-black font-sans text-white uppercase tracking-wider flex items-center gap-1">
                  {isUserPremium ? (
                    <span className="text-emerald-400">💎 Premium Active</span>
                  ) : isProAccessUnlocked ? (
                    <span className="text-amber-400">🔑 Dev PIN Active</span>
                  ) : (
                    <span className="text-rose-400">⚪ Freemium Standard</span>
                  )}
                </span>
              </div>
            </div>
            {isUserPremium && (
              <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold uppercase tracking-widest leading-none">
                Stripe
              </span>
            )}
          </div>
          
          <div className="border-t border-neutral-900/80 pt-2 flex flex-col gap-1.5">
            {isSystemUnlocked ? (
              <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
                <span className="text-neutral-500">Konto: {userEmail}</span>
                <button
                  onClick={() => {
                    handleLockAccess();
                    setIsUserPremium(false);
                    localStorage.setItem("omega_user_premium", "false");
                  }}
                  className="text-rose-400 hover:text-rose-300 font-bold flex items-center gap-0.5 cursor-pointer whitespace-nowrap"
                >
                  Wyloguj <ChevronRight size={10} />
                </button>
              </div>
            ) : (
              <span className="text-[10px] text-neutral-400 leading-normal font-sans">
                Zaloguj się PIN-em lub ulepsz profil przez Stripe do Premium.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Verification overlay if not authenticated to Pro */}
      {!isSystemUnlocked ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch select-none">
          
          {/* Left Grid: Passcode Bypass (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-neutral-950 border border-neutral-900 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-40 h-40 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-5">
                <Lock size={20} className="text-rose-500" />
              </div>

              <h2 className="text-lg font-bold font-sans text-white uppercase tracking-wider mb-2">
                Kanał Deweloperski (PIN Bypass)
              </h2>
              <p className="text-neutral-400 text-xs leading-relaxed font-sans mb-6">
                Wpisz posiadany klucz autoryzacji sesji tymczasowej (np. <code className="text-neutral-200 bg-neutral-900 px-1 py-0.5 rounded font-mono">omega</code>), aby tymczasowo ominąć weryfikację.
              </p>

              <form onSubmit={handleVerifyAccess} className="space-y-3">
                <div className="bg-neutral-900 border border-neutral-850 p-2 rounded-xl flex items-center gap-1.5 focus-within:border-neutral-700 transition">
                  <input
                    type="password"
                    required
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="Wpisz kod dostępu (np. 'omega')..."
                    className="w-full bg-transparent border-0 ring-0 focus:ring-0 focus:outline-none text-xs text-white px-2 py-1 placeholder-neutral-500 font-mono"
                  />
                </div>
                <button
                  type="submit"
                  disabled={verifying}
                  className="w-full bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold py-2.5 px-6 rounded-xl text-xs font-mono transition-all uppercase tracking-wide cursor-pointer flex items-center justify-center gap-2"
                >
                  {verifying ? (
                    <>
                      <RefreshCw className="animate-spin" size={12} /> Autoryzacja...
                    </>
                  ) : (
                    <>
                      <Unlock size={12} /> Bypass z hasłem
                    </>
                  )}
                </button>
              </form>
            </div>
            
            <div className="border-t border-neutral-900 pt-4 mt-6 text-[10px] font-mono text-neutral-600">
              BYPASS LOG PROTOCOL: PIN VALIDATION
            </div>
          </div>

          {/* Right Grid: Stripe Premium Integration (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between bg-neutral-950 border border-neutral-900 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="flex items-center justify-between gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <CreditCard size={20} className="text-emerald-400 font-bold" />
                </div>
                <span className="text-[9px] font-mono font-bold uppercase py-0.5 px-2 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-full animate-pulse">
                  Rekomendowane
                </span>
              </div>

              <h2 className="text-lg font-bold font-sans text-neutral-50 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                Aktywacja Subskrypcji Premium <span className="text-emerald-400 font-black">Stripe 💳</span>
              </h2>
              <p className="text-neutral-400 text-xs leading-relaxed font-sans mb-6">
                Zyskaj pełny, dożywotni lub subskrypcyjny dostęp do analityki wiralności OMEGA oraz generatorów AI. Integracja ze Stripe automatycznie aktywuje system, nadając profil w bazie Firestore.
              </p>

              <div className="bg-neutral-900/50 border border-neutral-900 p-4 rounded-2xl mb-5 flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-neutral-400">Licencja:</span>
                  <span className="text-white font-bold uppercase">Omega Intelligence Premium</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono border-t border-neutral-900/60 pt-2.5">
                  <span className="text-neutral-400">Metoda:</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">Stripe Checkout Gateway</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono border-t border-neutral-900/60 pt-2.5">
                  <span className="text-neutral-450">Kwota:</span>
                  <span className="text-white font-extrabold text-sm">199.00 PLN <span className="text-[10px] text-neutral-400 font-light">/ jednorazowo</span></span>
                </div>
              </div>

              <button
                onClick={handleUpgradeToPremium}
                disabled={checkoutLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold py-3 px-6 rounded-xl text-xs font-mono transition-all hover:scale-[1.01] uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.15)] cursor-pointer border-none"
              >
                {checkoutLoading ? (
                  <>
                    <RefreshCw className="animate-spin" size={13} /> Przygotowywanie Bramki...
                  </>
                ) : (
                  <>
                    <CreditCard size={13} /> Rozpocznij Płatność Premium
                  </>
                )}
              </button>
            </div>

            <div className="border-t border-neutral-900 pt-4 mt-6 text-[10px] font-mono text-neutral-600 flex items-center gap-2 justify-between">
              <span>STRIPE CLIENT PAYMENTS PROTOCOL</span>
              <span>100% SECURE & RECURRING SAFE</span>
            </div>
          </div>

          {/* Bottom Grid: Realtime Payment Auto-Verification (12 cols) */}
          <div className="lg:col-span-12 bg-neutral-950 border border-neutral-900 rounded-3xl p-5 flex flex-col md:flex-row items-center justify-between gap-6 relative">
            <div className="flex items-start gap-3 flex-1">
              <span className="p-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl flex-shrink-0">
                <Activity size={18} className="text-emerald-400 animate-pulse" />
              </span>
              <div>
                <span className="text-[9px] font-mono uppercase tracking-widest text-emerald-400 block font-bold">Automatyczna Weryfikacja Statusu Płatności</span>
                <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed font-sans max-w-2xl">
                  System okresowo skanuje Twoją skrzynkę pod e-mailem i wyszukuje opłacone transakcje w bazie Firestore. Wpisz e-mail licencyjny, aby wymusić natychmiastowe sprawdzenie statusu Premium.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch gap-2.5 w-full md:w-auto">
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="Twój e-mail płatności..."
                className="bg-neutral-905 bg-neutral-900 border border-neutral-850 p-2.5 rounded-xl text-xs font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-700 min-w-[230px]"
              />
              <button
                onClick={() => verifyPremiumStatus(userEmail)}
                disabled={verifyingPremium}
                className="bg-neutral-900 hover:bg-neutral-850 text-neutral-300 font-bold py-2.5 px-4 rounded-xl text-xs font-mono transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap border border-neutral-800"
              >
                {verifyingPremium ? (
                  <RefreshCw className="animate-spin" size={12} />
                ) : (
                  <CheckCircle2 size={12} className="text-emerald-400" />
                )}
                Weryfikuj status
              </button>
            </div>
          </div>

        </div>
      ) : (
        /* PRO TIER ACCESIBLE CONTENT AREA */
        <div className="space-y-6">
          
          {/* MOTIVATIONAL BIOMETRIC ALIGNMENT BANNER */}
          {isWorkoutCompleted && (
            <div className="bg-gradient-to-r from-emerald-950/40 via-neutral-950 to-neutral-950 border border-emerald-500/35 p-4 rounded-3xl flex items-center justify-between gap-4 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
                  <Sparkles size={18} className="text-emerald-400" />
                </span>
                <div>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-emerald-400 block font-bold">Health Connect PRO // Korelacja Biometryczna</span>
                  <p className="text-xs font-black text-white uppercase tracking-tight">
                    OUN zregenerowany. Poziom testosteronu i dopaminy na szczycie. Idealny moment na domknięcie lejka.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-extrabold uppercase bg-emerald-500/10 p-1 px-2.5 rounded border border-emerald-500/20 hidden md:inline-block">
                Stan: BESTIA AKTYWOWANA
              </span>
            </div>
          )}

          {/* Quick Realtime Analytics Widgets Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Widget 1 */}
            <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono text-neutral-500 uppercase block mb-1">Średnia Wirująca Prędkość</span>
                <span className="text-2xl font-black text-rose-500 font-mono">{stats.avgVelocity} <span className="text-xs text-neutral-400">spikes/h</span></span>
              </div>
              <div className="mt-3 text-xs text-neutral-400 flex items-center gap-1 font-sans">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" /> Stały scanning serwerów
              </div>
            </div>

            {/* Widget 2 */}
            <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono text-neutral-500 uppercase block mb-1">Maksymalny Współczynnik Wiralności</span>
                <span className="text-2xl font-black text-white font-mono">{stats.maxViralCoeff} / 10</span>
              </div>
              <div className="mt-3 text-xs text-neutral-400 flex items-center gap-1">
                <span className="text-emerald-400 font-bold block">Absolutny Peak rynkowy</span>
              </div>
            </div>

            {/* Widget 3 */}
            <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono text-neutral-500 uppercase block mb-1">Przewaga Sektora Tematycznego</span>
                <span className="text-2xl font-black text-amber-500 font-mono">{stats.marketingShare}%</span>
              </div>
              <div className="mt-3 text-xs text-neutral-450">
                Segment B2g: <span className="text-white font-semibold">Marketing & Sales</span>
              </div>
            </div>

            {/* Widget 4 */}
            <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono text-neutral-500 uppercase block mb-1">Aktywne Sektory Analiz</span>
                <span className="text-2xl font-black text-blue-500 font-mono">{stats.activeSectors} <span className="text-xs text-neutral-400">branż</span></span>
              </div>
              <div className="mt-3 text-xs text-neutral-450 font-mono">
                Zdigitalizowane: Tech, Finance, Marketing
              </div>
            </div>

          </div>

          {/* Tab Selection Row for Premium Modules */}
          <div className="flex border-b border-neutral-900">
            <div className="flex flex-wrap gap-2 w-full pt-2">
              
              <button
                onClick={() => setActiveTab("insights")}
                className={`pb-3 px-4 text-xs font-mono font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === "insights" 
                    ? "border-rose-500 text-rose-400 bg-rose-500/[0.02]" 
                    : "border-transparent text-neutral-400 hover:text-neutral-200"
                }`}
              >
                <Layers size={13} /> Prognoza Rezonansu & Trend Analyzer
              </button>

              <button
                onClick={() => setActiveTab("hooks")}
                className={`pb-3 px-4 text-xs font-mono font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === "hooks" 
                    ? "border-rose-500 text-rose-400 bg-rose-500/[0.02]" 
                    : "border-transparent text-neutral-400 hover:text-neutral-200"
                }`}
              >
                <Sparkles size={13} /> Generator Hooków AI & Matryce
              </button>

              <button
                onClick={() => setActiveTab("radar")}
                className={`pb-3 px-4 text-xs font-mono font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === "radar" 
                    ? "border-rose-500 text-rose-400 bg-rose-500/[0.02]" 
                    : "border-transparent text-neutral-400 hover:text-neutral-200"
                }`}
              >
                <LucideLineChart size={13} /> Krzywa Kanałów (Multi-Platform Radar)
              </button>

              <button
                onClick={() => setActiveTab("stripe-finance")}
                className={`pb-3 px-4 text-xs font-mono font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === "stripe-finance" 
                    ? "border-emerald-500 text-emerald-400 bg-emerald-500/[0.02]" 
                    : "border-transparent text-neutral-400 hover:text-emerald-300"
                }`}
              >
                <CreditCard size={13} className="text-emerald-400" /> Finanse live Stripe 💳
              </button>

              <button
                onClick={() => setActiveTab("watchlist")}
                className={`pb-3 px-4 text-xs font-mono font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ml-auto ${
                  activeTab === "watchlist" 
                    ? "border-emerald-500 text-emerald-400 bg-emerald-500/[0.02]" 
                    : "border-transparent text-neutral-400 hover:text-emerald-300"
                }`}
              >
                <Bookmark size={13} /> Obserwowane PRO ({watchlist.length})
              </button>

            </div>
          </div>

          {/* DYNAMIC TAB CONTROLLER */}
          {loading ? (
            <div className="py-20 text-center bg-neutral-950 border border-neutral-900 rounded-3xl">
              <RefreshCw className="animate-spin text-rose-500 mx-auto mb-4" size={32} />
              <p className="text-neutral-400 font-mono text-sm leading-normal">Pobieranie zaawansowanych metryk trendów w czasie rzeczywistym...</p>
            </div>
          ) : trends.length === 0 ? (
            <div className="py-20 text-center bg-neutral-950 border border-neutral-900 rounded-3xl">
              <AlertCircle className="text-amber-500 mx-auto mb-4" size={32} />
              <p className="text-neutral-400 font-mono text-sm">Błąd odczytu bazy wektorowej trendów OMEGA.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              
              {/* TAB 1: ADVANCED ANALLITYCS & DECAY GRAPH */}
              {activeTab === "insights" && (
                <>
                  {/* Left Column: Trending Lists Selector (5 cols) */}
                  <div className="lg:col-span-5 bg-neutral-950 border border-neutral-900 rounded-3xl p-5 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 mb-3.5 block">
                        🛰️ AKTYWNE WEKTORY DO ANALIZY
                      </span>
                      
                      <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1 select-none custom-scrollbar">
                        {trends.map(t => {
                          const isSelected = t.id === selectedTrendId;
                          const isBookmarked = watchlist.includes(t.id);
                          return (
                            <div 
                              key={t.id} 
                              onClick={() => setSelectedTrendId(t.id)}
                              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 group relative ${
                                isSelected 
                                  ? "bg-rose-500/10 border-rose-500/40" 
                                  : "bg-neutral-900/40 border-neutral-900 hover:border-neutral-800"
                              }`}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span className="text-[9px] font-mono bg-neutral-900 hover:bg-neutral-850 text-neutral-350 px-1.5 py-0.5 rounded border border-neutral-850">
                                    {t.portal}
                                  </span>
                                  <span className="text-[9px] font-mono text-neutral-450">
                                    {t.category}
                                  </span>
                                </div>
                                <h3 className="text-xs font-bold text-neutral-100 group-hover:text-white truncate">
                                  {t.topic}
                                </h3>
                              </div>

                              <div className="flex items-center gap-2">
                                <div className="text-right flex-shrink-0">
                                  <span className="text-[10px] font-mono text-rose-400 font-black block">
                                    {t.velocity} h/s
                                  </span>
                                  <span className="text-[8px] font-mono text-neutral-500 uppercase">
                                    {t.momentum}
                                  </span>
                                </div>
                                
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleWatchlist(t.id, t.topic);
                                  }}
                                  className={`p-1 rounded cursor-pointer transition-colors ${
                                    isBookmarked 
                                      ? "text-emerald-400 bg-emerald-500/10" 
                                      : "text-neutral-500 hover:text-neutral-300"
                                  }`}
                                >
                                  <Bookmark size={12} className={isBookmarked ? "fill-emerald-400" : ""} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="border-t border-neutral-900 pt-4 mt-4">
                      <span className="text-[10px] font-mono text-neutral-500 uppercase block mb-1">STATUS LIVE INTEGRATORA</span>
                      <p className="text-[11px] text-neutral-400">Każdy trend analizuje pętle konwersji, optymalne nagłówki i szacowany czas życia trendu.</p>
                    </div>
                  </div>

                  {/* Right Column: Deep Detailed Projection Insights (7 cols) */}
                  <div className="lg:col-span-7 bg-neutral-950 border border-neutral-900 rounded-3xl p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-4 mb-3 border-b border-neutral-900 pb-3">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="px-1.5 py-0.5 bg-neutral-900 text-neutral-400 border border-neutral-800 text-[9px] font-mono uppercase">
                              METRYKI MAKSYMALNEGO PRIORYTETU
                            </span>
                            <span className="text-amber-400 text-[10px] flex items-center gap-1">
                              <Sparkles size={10} /> Auto-Calculated
                            </span>
                          </div>
                          <h2 className="text-base font-bold text-white font-sans uppercase tracking-tight">
                            Prognoza Rezonansu dla: <span className="text-rose-400">"{selectedTrend.topic}"</span>
                          </h2>
                        </div>
                      </div>

                      {/* Highlighted Pro metrics Row */}
                      <div className="grid grid-cols-3 gap-3 mb-6 bg-neutral-900/30 p-3.5 rounded-2xl border border-neutral-900">
                        <div className="text-center">
                          <span className="text-[9px] font-mono text-neutral-500 uppercase block mb-1">Społeczny Indeks Rezonansu</span>
                          <span className="text-lg font-black text-rose-400 font-mono">
                            {Math.round(selectedTrend.viralCoefficient * 12 * 1.5)} / 200
                          </span>
                        </div>
                        <div className="text-center border-l border-r border-neutral-900">
                          <span className="text-[9px] font-mono text-neutral-500 uppercase block mb-1">Gojenie (Estimated Decay)</span>
                          <span className="text-lg font-black text-amber-500 font-mono">
                            {Math.round(selectedTrend.viralCoefficient * 1.6)} dni
                          </span>
                        </div>
                        <div className="text-center">
                          <span className="text-[9px] font-mono text-neutral-500 uppercase block mb-1">Wskaźnik Retencji</span>
                          <span className="text-lg font-black text-blue-400 font-mono">
                            {(selectedTrend.viralCoefficient * 9.6).toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* Interactive area chart (decay projection) */}
                      <span className="text-[10px] font-mono text-neutral-500 uppercase mb-3 block">📈 7-dniowa krzywa aktywności trendu</span>
                      <div className="h-[210px] w-full bg-black/40 border border-neutral-900/60 rounded-2xl p-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={projectionChartData}
                            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                          >
                            <defs>
                              <linearGradient id="colorResonance" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                              </linearGradient>
                              <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                            <XAxis 
                              dataKey="day" 
                              stroke="#737373" 
                              fontSize={9} 
                              tickLine={false} 
                            />
                            <YAxis 
                              stroke="#737373" 
                              fontSize={9} 
                              tickLine={false} 
                            />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#0a0a0a', 
                                border: '1px solid #262626', 
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontFamily: 'monospace'
                              }} 
                            />
                            <Legend fontSize={9} />
                            <Area 
                              type="monotone" 
                              dataKey="Indeks Rezonansu" 
                              stroke="#f43f5e" 
                              fillOpacity={1} 
                              fill="url(#colorResonance)" 
                              strokeWidth={2}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="Aktywność (Projections)" 
                              stroke="#60a5fa" 
                              fillOpacity={1} 
                              fill="url(#colorActivity)" 
                              strokeWidth={2}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="text-[10px] bg-sky-500/5 border border-sky-500/10 rounded-xl p-3 text-sky-400 font-sans mt-4 leading-relaxed">
                      🧠 <strong>Strategia Komercjalizacji PRO:</strong> Optymalny moment na wypalenie kampanii to <strong>Dzień 1 do Dzień 3</strong>. Szacowany rezonans pozwala na zgromadzenie do 40-70% unikalnych leadów przy minimalnym koszcie CPC.
                    </div>
                  </div>
                </>
              )}

              {/* TAB 2: AI TREND TO HOOK GENERATOR */}
              {activeTab === "hooks" && (
                <>
                  {/* Left Selector Column (5 cols) */}
                  <div className="lg:col-span-4 bg-neutral-950 border border-neutral-900 rounded-3xl p-5 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 block mb-4">
                        Wybierz Trend Bazowy
                      </span>

                      <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1.5 custom-scrollbar">
                        {trends.map(t => {
                          const isSelected = t.id === selectedTrendId;
                          return (
                            <div
                              key={t.id}
                              onClick={() => setSelectedTrendId(t.id)}
                              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                                isSelected 
                                  ? "bg-rose-500/10 border-rose-500/35 text-rose-50" 
                                  : "bg-neutral-900/20 border-neutral-900 hover:border-neutral-850 text-neutral-300"
                              }`}
                            >
                              <div className="text-[10px] font-mono text-neutral-500 uppercase mb-1">
                                {t.portal} | {t.category}
                              </div>
                              <h4 className="text-xs font-bold truncate">{t.topic}</h4>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="border-t border-neutral-900 pt-3 mt-4 text-[10px] text-neutral-500">
                      Wybierz trend, a matryca AI przebuduje go na 3 schematy gotowe do odczytu przed kamerą.
                    </div>
                  </div>

                  {/* Right Variations Generator Area (8 cols) */}
                  <div className="lg:col-span-8 bg-neutral-950 border border-neutral-900 rounded-3xl p-5 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-neutral-500 block mb-1">
                        WYGENEROWANE PERSWAZYJNE MATRYCE WIDEO // AI MULTI-FRAMEWORK
                      </span>
                      <h2 className="text-base font-bold text-white uppercase tracking-tight mb-4 flex items-center gap-1.5">
                        <Sparkles size={16} className="text-rose-500" /> Warianty Haczyków dla: <span className="text-rose-450 text-rose-400">"{selectedTrend.topic}"</span>
                      </h2>

                      {/* Hooks Grid rendering */}
                      <div className="space-y-4">
                        {getProHooks.map((h, idx) => (
                          <div key={idx} className="bg-neutral-900/40 border border-neutral-900 rounded-2xl p-4 space-y-3 hover:border-neutral-800 transition-all">
                            <div className="flex justify-between items-center bg-neutral-950 p-2 px-3 rounded-lg border border-neutral-850">
                              <div>
                                <span className="text-xs font-bold text-white block font-sans">{h.framework}</span>
                                <span className="text-[10px] text-neutral-500 font-sans block">{h.desc}</span>
                              </div>
                              <button
                                onClick={() => handleCopy(h.hook)}
                                className="p-1.5 px-3 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-350 hover:text-white rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <Copy size={11} /> Kopiuj Hook
                              </button>
                            </div>

                            <div className="text-xs text-neutral-100 font-sans pl-2.5 border-l-2 border-rose-500 font-bold leading-normal italic py-1 bg-neutral-950/20">
                              "{h.hook}"
                            </div>

                            <div className="text-[10px] bg-neutral-950 p-2.5 rounded-lg border border-neutral-900 leading-normal">
                              <span className="text-rose-400 font-mono font-bold uppercase block mb-1">STRUKTURA SCENARIUSZA:</span>
                              <p className="text-neutral-400 font-sans">{h.outline}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                    </div>

                    <div className="text-[10px] text-neutral-500 mt-4 font-mono text-center pt-2">
                      Zasugerowana struktura spełnia rygorystyczne normy retencji wideo TikTok/Shorts (pętla retencji &gt;80s).
                    </div>
                  </div>
                </>
              )}

              {/* TAB 3: PLATFORMS CURVE COMPARATIVE CHART */}
              {activeTab === "radar" && (
                <>
                  <div className="lg:col-span-6 bg-neutral-950 border border-neutral-900 rounded-3xl p-5 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-neutral-500 uppercase block mb-1">
                        SILNIKI DIAGNOSTYKI MEDIALNEJ
                      </span>
                      <h2 className="text-base font-bold text-white uppercase tracking-tight mb-2">
                        Wydajność Prędkości Kanałów Social
                      </h2>
                      <p className="text-neutral-400 text-xs mb-4 font-sans">
                        Średnia prędkość wiralowa wykrywana w węzłach crawlerów w ujęciu uśrednionym (spikes/h). Pozwala to na zlokalizowanie gdzie ruch organiczny jest najtańszy.
                      </p>

                      <div className="h-[250px] w-full bg-black/40 border border-neutral-900/60 rounded-2xl p-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={portalChartData}
                            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                            <XAxis 
                              dataKey="name" 
                              stroke="#737373" 
                              fontSize={9} 
                              tickLine={false} 
                            />
                            <YAxis 
                              stroke="#737373" 
                              fontSize={9} 
                              tickLine={false} 
                            />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#0a0a0a', 
                                border: '1px solid #262626', 
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontFamily: 'monospace'
                              }} 
                            />
                            <Bar dataKey="Średnia Prędkość (spikes/h)" fill="#f43f5e" radius={[4, 4, 0, 0]}>
                              {portalChartData.map((entry, index) => {
                                const colors = ["#f43f5e", "#ec4899", "#3b82f6", "#0a66c2", "#ef4444"];
                                return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                              })}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="text-[9px] font-mono text-neutral-600 text-center pt-3 border-t border-neutral-905">
                      Statystyki aktualizowane na bieżąco z demonami sieci
                    </div>
                  </div>

                  <div className="lg:col-span-6 bg-neutral-950 border border-neutral-900 rounded-3xl p-5 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-neutral-500 uppercase block mb-1">
                        POTENCJAŁ SEKTOROWY
                      </span>
                      <h2 className="text-base font-bold text-white uppercase tracking-tight mb-2">
                        Średnia Wiralowość według Kategorii
                      </h2>
                      <p className="text-neutral-400 text-xs mb-4 font-sans">
                        Wskaźnik współczynnika wiralowości (od 1 do 10) rozbity na poszczególne niszy rynkowe. Idealny wskaźnik do wyboru tematu pod kolejny e-book lub newsletter.
                      </p>

                      <div className="h-[250px] w-full bg-black/40 border border-neutral-900/60 rounded-2xl p-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={categoryChartData}
                            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                            <XAxis 
                              dataKey="category" 
                              stroke="#737373" 
                              fontSize={9} 
                              tickLine={false} 
                            />
                            <YAxis 
                              stroke="#737373" 
                              fontSize={9} 
                              tickLine={false} 
                              domain={[0, 10]}
                              tickCount={6}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#0a0a0a', 
                                border: '1px solid #262626', 
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontFamily: 'monospace'
                              }} 
                            />
                            <Bar dataKey="Wskaźnik Wiralowości (1-10)" fill="#fbbf24" radius={[4, 4, 0, 0]}>
                              {categoryChartData.map((entry, index) => {
                                const colors = ["#fbbf24", "#10b981", "#3b82f6", "#a855f7", "#ec4899"];
                                return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                              })}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="text-[10px] bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3 text-emerald-400 mt-3 font-sans leading-relaxed">
                      🔥 <strong>Nisza na dziś:</strong> Kategoria o najwyższym współczynniku wiralowości to wyjątkowy punkt zaczepienia do natychmiastowego zaimplementowania w lejkach handlowych.
                    </div>
                  </div>
                </>
              )}

              {/* TAB 4: PERSISTED WATCHLIST */}
              {activeTab === "watchlist" && (
                <div className="lg:col-span-12 bg-neutral-950 border border-neutral-900 rounded-3xl p-6">
                  <div className="flex items-center justify-between gap-4 border-b border-neutral-900 pb-4 mb-6">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-emerald-400 block mb-1">
                        🟢 TWOJE PERSYSTENTNE OBSERWACJE PRO
                      </span>
                      <h2 className="text-lg font-black text-white uppercase tracking-tight">
                        Zabezpieczone Rekordy Trendów do Wdrożenia
                      </h2>
                    </div>
                    {watchlist.length > 0 && (
                      <button
                        onClick={() => {
                          setWatchlist([]);
                          addLog("Wyczyszczono listę obserwowanych trendów.");
                          toast.success("Wyczyszczono listę watchlist");
                        }}
                        className="text-xs font-mono font-bold text-red-400 hover:text-red-300 border border-red-500/20 bg-red-500/5 px-3 py-1.5 rounded-xl cursor-pointer transition-colors"
                      >
                        Wyczyść Wszystko
                      </button>
                    )}
                  </div>

                  {watchlist.length === 0 ? (
                    <div className="text-center py-16 bg-neutral-900/20 border border-neutral-900 rounded-2xl">
                      <Bookmark className="text-neutral-650 text-neutral-600 mx-auto mb-3" size={28} />
                      <h3 className="text-sm font-bold text-neutral-200">Watchlist jest pusty</h3>
                      <p className="text-neutral-500 text-xs mt-1 max-w-sm mx-auto leading-relaxed font-sans">
                        Kliknij ikonę zakładki przy wybranym trendzie w zakładce "Prognoza Rezonansu", aby dodać go do obserwowanych.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {trends.filter(t => watchlist.includes(t.id)).map(t => (
                        <div key={t.id} className="bg-neutral-905 bg-neutral-900/40 border border-neutral-900 rounded-2xl p-4 flex flex-col justify-between hover:border-neutral-800 transition shadow-sm">
                          <div>
                            <div className="flex items-center justify-between gap-3 mb-2">
                              <div className="flex items-center gap-1.5">
                                <span className="px-2 py-0.5 bg-neutral-950 text-[10px] font-mono text-neutral-400 rounded border border-neutral-850">
                                  {t.portal}
                                </span>
                                <span className="text-[10px] font-mono text-neutral-500">{t.category}</span>
                              </div>
                              <button
                                onClick={() => toggleWatchlist(t.id, t.topic)}
                                className="text-rose-500 hover:text-rose-400 transition cursor-pointer"
                                title="Usuń z obserwowanych"
                              >
                                Usuń
                              </button>
                            </div>
                            <h3 className="text-sm font-bold text-white mb-2 leading-tight">
                              {t.topic}
                            </h3>
                            <p className="text-neutral-400 text-xs font-sans leading-normal line-clamp-2">
                              {t.details}
                            </p>
                          </div>

                          <div className="border-t border-neutral-900/80 pt-3 mt-4 space-y-3">
                            <div className="flex items-center justify-between text-xs font-mono">
                              <span className="text-neutral-500">Prędkość:</span>
                              <span className="text-rose-400 font-bold">{t.velocity} spikes/h</span>
                            </div>

                            <button
                              onClick={() => handleInicjujZrzut(t)}
                              className="w-full py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 border border-red-500/25 rounded-xl text-white text-xs font-bold font-mono tracking-wider transition-all hover:scale-[1.01] uppercase flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(239,68,68,0.25)] cursor-pointer"
                            >
                              <TrendingUp size={12} className="text-white animate-bounce" />
                              INICJUJ ZRZUT: WYŚLIJ DO DYSTRYBUTORA
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-6 text-xs text-neutral-500 font-sans border-t border-neutral-900 pt-4 leading-normal">
                    📌 <strong>Informacja systemowa:</strong> Obserwowane trendy są składowane w lokalnej strefie przeglądarki i pozostaną zabezpieczone dopóki nie wyczyścisz logów sesji.
                  </div>
                </div>
              )}

              {/* TAB 5: REALTIME STRIPE REVENUE ENGINE */}
              {activeTab === "stripe-finance" && (
                <div className="lg:col-span-12 space-y-6">
                  
                  {/* Revenue Summary KPI Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-5 relative overflow-hidden ring-1 ring-emerald-500/20 bg-emerald-900/5">
            <div className="absolute -top-1 -right-1 w-20 h-20 bg-emerald-500/10 blur-2xl rounded-full animate-pulse" />
                      <div className="absolute top-0 right-0 p-3 text-emerald-500/10"><DollarSign size={40} /></div>
                      <span className="text-[10px] font-mono text-neutral-500 uppercase block mb-1">Całkowity Przychód Skumulowany</span>
                      <h3 className="text-3xl font-black text-white font-mono flex items-baseline gap-1">
                        {revenueStats ? Number(revenueStats.totalRevenue).toLocaleString("pl-PL") : "---"} <span className="text-xs text-neutral-400 font-normal">PLN</span>
                      </h3>
                      <div className="mt-3 text-xs text-emerald-400 flex items-center gap-1 font-mono">
                        <ArrowUpRight size={14} /> +100% zintegrowany live
                      </div>
                    </div>

                    <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-5 relative overflow-hidden ring-1 ring-emerald-500/20 bg-emerald-900/5">
            <div className="absolute -top-1 -right-1 w-20 h-20 bg-emerald-500/10 blur-2xl rounded-full animate-pulse" />
                      <div className="absolute top-0 right-0 p-3 text-emerald-500/10"><Activity size={40} /></div>
                      <span className="text-[10px] font-mono text-neutral-500 uppercase block mb-1">Monthly Recurring Revenue (MRR)</span>
                      <h3 className="text-3xl font-black text-rose-500 font-mono flex items-baseline gap-1">
                        {revenueStats ? Number(revenueStats.mrr).toLocaleString("pl-PL") : "---"} <span className="text-xs text-neutral-400 font-normal">PLN</span>
                      </h3>
                      <div className="mt-3 text-xs text-neutral-450 flex items-center gap-1 font-sans">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Aktywna bramka subskrypcyjna
                      </div>
                    </div>

                    <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-5 relative overflow-hidden ring-1 ring-emerald-500/20 bg-emerald-900/5">
            <div className="absolute -top-1 -right-1 w-20 h-20 bg-emerald-500/10 blur-2xl rounded-full animate-pulse" />
                      <div className="absolute top-0 right-0 p-3 text-emerald-500/10"><Wallet size={40} /></div>
                      <span className="text-[10px] font-mono text-neutral-500 uppercase block mb-1">Średnia Wartość Koszyka (AOV)</span>
                      <h3 className="text-3xl font-black text-white font-mono flex items-baseline gap-1">
                        {revenueStats ? Number(revenueStats.avgOrderValue).toLocaleString("pl-PL") : "---"} <span className="text-xs text-neutral-400 font-normal">PLN</span>
                      </h3>
                      <div className="mt-3 text-xs text-neutral-500 font-mono">
                        Przelicznik licencji: Premium vs Standard
                      </div>
                    </div>
                  </div>

                  {/* Financial Graph Flow */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                    
                    {/* Left 7 cols: Graph */}
                    <div className="lg:col-span-7 bg-neutral-950 border border-neutral-900 p-6 rounded-3xl flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-3 mb-6">
                          <div>
                            <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest block font-bold">Stripe Live Analytics</span>
                            <h2 className="text-sm font-black text-white uppercase tracking-tight">Napływ Kapitału w Czasie Rzeczywistym</h2>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={handleSyncFactory}
                              disabled={syncLoading || revenueLoading}
                              className={`p-1 px-2.5 rounded bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] flex items-center gap-1.5 cursor-pointer transition-all ${syncLoading ? 'animate-pulse' : ''}`}
                            >
                              <RefreshCw size={10} className={syncLoading ? "animate-spin" : ""} />
                              {syncLoading ? "Synchronizowanie..." : "Sync Factory 🏭"}
                            </button>
                            <button
                              onClick={() => fetchRevenueStats(false)}
                              disabled={revenueLoading || syncLoading}
                              className="p-1 px-2.5 rounded bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-300 font-mono text-[10px] flex items-center gap-1 cursor-pointer transition"
                            >
                              <RefreshCw size={10} className={revenueLoading ? "animate-spin" : ""} /> Odśwież dane
                            </button>
                          </div>
                        </div>

                        {monthlyRevenueChart.length === 0 ? (
                          <div className="h-[210px] flex items-center justify-center text-xs text-neutral-600 font-mono">
                            Czekanie na pierwszą płatność...
                          </div>
                        ) : (
                          <div className="h-[210px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={monthlyRevenueChart} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                <defs>
                                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#171717" vertical={false} />
                                <XAxis 
                                  dataKey="Data" 
                                  stroke="#525252" 
                                  fontSize={10} 
                                  tickLine={false} 
                                  axisLine={false} 
                                  fontFamily="monospace"
                                />
                                <YAxis 
                                  stroke="#525252" 
                                  fontSize={10} 
                                  tickLine={false} 
                                  axisLine={false}
                                  fontFamily="monospace"
                                />
                                <Tooltip 
                                  contentStyle={{ 
                                    backgroundColor: '#0a0a0a', 
                                    border: '1px solid #1f1f1f', 
                                    borderRadius: '12px',
                                    fontSize: '11px',
                                    fontFamily: 'monospace'
                                  }} 
                                />
                                <Area 
                                  type="monotone" 
                                  dataKey="Przychód (PLN)" 
                                  stroke="#10b981" 
                                  strokeWidth={2}
                                  fillOpacity={1} 
                                  fill="url(#colorRevenue)" 
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </div>

                      <div className="text-[10px] bg-neutral-900/40 border border-neutral-900 rounded-xl p-3 text-neutral-400 mt-4 font-sans leading-normal">
                        💵 <strong>Informacja deweloperska:</strong> Każda pomyślna transakcja zarejestrowana przez Webhook Stripe jest natychmiast dopisywana do tabeli przychodów z zachowaniem integracji UUID i kwotą netto.
                      </div>
                    </div>

                    {/* Right 5 cols: Live Payment Feed */}
                    <div className="lg:col-span-5 bg-neutral-950 border border-neutral-900 p-5 rounded-3xl flex flex-col justify-between">
                      <div>
                        <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest mb-3.5 block font-bold">
                          🛰️ OSTATNIE TRANSAKCJE STRIPE
                        </span>

                        <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                          {revenueStats?.transactions && revenueStats.transactions.length > 0 ? (
                            revenueStats.transactions.map((tx) => (
                              <div key={tx.id} className="bg-neutral-900/60 border border-neutral-850/80 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 mb-0.5">
                                    <span className="font-extrabold text-white truncate max-w-[124px] block font-mono">
                                      {tx.clientName || "Użytkownik Premium"}
                                    </span>
                                    {tx.isSimulated && (
                                      <span className="text-[8px] font-mono px-1 py-0.2 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded leading-none">
                                        SIM
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-neutral-550 text-neutral-500 block truncate font-mono">
                                    {tx.clientEmail}
                                  </span>
                                </div>

                                <div className="text-right flex-shrink-0">
                                  <span className="font-mono font-black text-emerald-400 block">
                                    +{tx.amount} {tx.currency || "PLN"}
                                  </span>
                                  <span className="text-[9px] text-neutral-500 font-mono">
                                    {new Date(tx.paidAt).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-10 text-neutral-605 text-neutral-600 text-xs font-mono">
                              Brak zarejestrowanych transakcji
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="border-t border-neutral-900 pt-4 mt-5">
                        <button
                          onClick={handleUpgradeToPremium}
                          className="w-full bg-emerald-950/40 hover:bg-emerald-950 border border-emerald-500/25 p-2 rounded-xl text-emerald-400 text-xs font-bold font-mono tracking-wide transition-all uppercase flex items-center justify-center gap-2 cursor-pointer border-none"
                        >
                          <ArrowUpRight size={12} className="animate-pulse" />
                          Doładuj budżet (Zainicjuj nową transakcję)
                        </button>
                      </div>
                    </div>

                  </div>

                </div>
              )}

            </div>
          )}

          {/* REALTIME SYSTEM HEALTH MINI RADAR LOGS TERMINAL CO-OPS */}
          <div className="bg-neutral-950 border border-neutral-900 rounded-3xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Terminal size={14} className="text-emerald-400" />
              <span className="text-xs font-mono font-bold text-neutral-300 uppercase tracking-widest">
                Terminale Zwiadowcze: Omega Diagnostic Stream
              </span>
            </div>

            <div className="bg-black/60 border border-neutral-900/80 rounded-2xl p-4 h-[110px] overflow-y-auto font-mono text-xs leading-relaxed text-emerald-400/90 custom-scrollbar">
              {interactiveLogs.length === 0 ? (
                <span className="text-neutral-600 italic block">&gt; Czekiwanie na ruch w strumieniu telemetrycznym...</span>
              ) : (
                interactiveLogs.map((log, index) => (
                  <div key={index} className="truncate">
                    <span className="text-neutral-500 font-bold mr-1.5">&gt;</span>
                    {log}
                  </div>
                ))
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between text-[10px] font-mono text-neutral-500 mt-3 gap-2">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> SENSOR RADARU: AKTYWNY
              </span>
              <span>SAMPLING LIMIT: MAX 250 TR/SECTOR</span>
              <span>INTEGRACJA: GOOGLE WORKSPACE API SENSITIVE</span>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
