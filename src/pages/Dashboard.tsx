import {
  Activity,
  Users,
  Zap,
  Link,
  Terminal,
  CheckSquare,
  AlertTriangle,
  ArrowUpCircle,
  Clock,
  AlertCircle,
  Lock,
  CheckCircle2,
  Network,
  List,
  ArrowRight,
  Ban,
  Check,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { motion } from "motion/react";
import { useState, useEffect, useMemo } from "react";
import { DashboardCalendar } from "../components/dashboard/DashboardCalendar";
import { CampaignConversionChart } from "../components/dashboard/CampaignConversionChart";
import { auth, db } from "../lib/firebase";
import { toast } from "sonner";
import { useSettingsStore } from "../store/settingsStore";
import { SystemHealthWidget } from "../components/dashboard/SystemHealthWidget";
import { SystemUpdatesWidget } from "../components/dashboard/SystemUpdatesWidget";
import { ProProfitMaximizer } from "../components/dashboard/ProProfitMaximizer";
import { RealtimeOperationsMonitor } from "../components/dashboard/RealtimeOperationsMonitor";
import { SystemHealthMonitor } from "../components/dashboard/SystemHealthMonitor";
import { WorkflowOrchestrator } from "../components/dashboard/WorkflowOrchestrator";
import { doc, onSnapshot, setDoc, collection, query, where } from "firebase/firestore";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const initialStats = [
  {
    id: "loops",
    name: "Aktywowane Pętle Dopaminowe",
    value: 1024,
    change: 12.0,
    icon: Activity,
    color: "text-rose-500",
  },
  {
    id: "leads",
    name: "Leady Przechwycone (CRM)",
    value: 840,
    change: 5.4,
    icon: Users,
    color: "text-blue-500",
  },
  {
    id: "globalReach",
    name: "Globalne Zasięgi Social Media",
    value: 142050,
    change: 22.4,
    icon: Network,
    color: "text-indigo-500",
  },
  {
    id: "impressions",
    name: "Wyświetlenia (Impressions)",
    value: 395120,
    change: 18.2,
    icon: Activity,
    color: "text-purple-500",
  },
  {
    id: "engagement",
    name: "Poziom Zaangażowania",
    value: 8.4,
    change: 1.2,
    icon: Users,
    color: "text-emerald-500",
  },
  {
    id: "scripts",
    name: "Skrypty VSL Wygenerowane",
    value: 32,
    change: 14.0,
    icon: Zap,
    color: "text-amber-500",
  },
  {
    id: "threats",
    name: "Wykryte Zagrożenia (Tarcza)",
    value: 3,
    change: -2.0,
    icon: Terminal,
    color: "text-emerald-500",
  },
];

const initialTasks = [
  {
    id: 1,
    title: "Zatrzymać opuszczanie koszyka (Spadek konwersji)",
    type: "critical",
    urgency: "Wysoka",
    importance: "Wysoka",
    time: "Dzisiaj",
    completed: false,
    blocked: false,
    dependsOn: [],
  },
  {
    id: 2,
    title: "Strategiczne planowanie sekwencji post-zakupowej",
    type: "planned",
    urgency: "Niska",
    importance: "Wysoka",
    time: "Ten tydzień",
    completed: false,
    blocked: false,
    dependsOn: [1],
  },
  {
    id: 3,
    title: "Przejrzeć logi Zwiadowcy z Reddita (Błędy)",
    type: "quick",
    urgency: "Wysoka",
    importance: "Niska",
    time: "Zaraz",
    completed: false,
    blocked: false,
    dependsOn: [],
  },
  {
    id: 4,
    title: "Aktualizacja archiwalnych grafik w panelu CRM",
    type: "backlog",
    urgency: "Niska",
    importance: "Niska",
    time: "Backlog",
    completed: false,
    blocked: false,
    dependsOn: [3],
  },
];

const getTaskStyles = (type: string) => {
  switch (type) {
    case "critical":
      return {
        border: "border-rose-500/40",
        bg: "bg-rose-500/10",
        text: "text-rose-400",
        icon: AlertTriangle,
      };
    case "planned":
      return {
        border: "border-amber-500/40",
        bg: "bg-amber-500/10",
        text: "text-amber-400",
        icon: ArrowUpCircle,
      };
    case "quick":
      return {
        border: "border-blue-500/40",
        bg: "bg-blue-500/10",
        text: "text-blue-400",
        icon: Clock,
      };
    case "backlog":
      return {
        border: "border-neutral-700",
        bg: "bg-neutral-800/50",
        text: "text-neutral-400",
        icon: AlertCircle,
      };
    default:
      return {
        border: "border-neutral-700",
        bg: "bg-neutral-800/50",
        text: "text-neutral-400",
        icon: CheckSquare,
      };
  }
};

class DependencyManager {
  private tasks: typeof initialTasks;

  constructor(tasks: typeof initialTasks) {
    this.tasks = tasks;
  }

  isUnlocked(taskId: number): boolean {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) return true;
    if (task.blocked) return false;
    if (!task.dependsOn || task.dependsOn.length === 0) return true;
    return task.dependsOn.every((depId) => {
      const depTask = this.tasks.find((t) => t.id === depId);
      return depTask?.completed;
    });
  }

  getDependentTasks(taskId: number) {
    return this.tasks.filter((t) => t.dependsOn.includes(taskId));
  }

  getLayeredLayout() {
    const layers: (typeof initialTasks)[] = [];
    let remaining = [...this.tasks];

    while (remaining.length > 0) {
      const currentLayer = remaining.filter(
        (t) =>
          !t.dependsOn ||
          t.dependsOn.length === 0 ||
          t.dependsOn.every((depId) => !remaining.find((r) => r.id === depId)),
      );

      if (currentLayer.length === 0) {
        layers.push(remaining);
        break;
      }

      layers.push(currentLayer);
      remaining = remaining.filter((t) => !currentLayer.includes(t));
    }
    return layers;
  }

  getDependencyProgress(taskId: number) {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task || !task.dependsOn || task.dependsOn.length === 0)
      return { completed: 0, total: 0, percentage: 100 };

    const validDeps = task.dependsOn
      .map((id) => this.tasks.find((t) => t.id === id))
      .filter(Boolean);
    const total = validDeps.length;
    const completed = validDeps.filter((t) => t && t.completed).length;
    return {
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 100,
    };
  }
}

export function Dashboard() {
  const [tasks, setTasks] = useState<typeof initialTasks>([]);
  const [stats, setStats] = useState<typeof initialStats>([]);
  const [tasksViewMode, setTasksViewMode] = useState<"list" | "graph">("list");
  const [loopsHistory, setLoopsHistory] = useState<
    { time: string; value: number }[]
  >([]);
  const [conversionHistory, setConversionHistory] = useState<
    { date: string; conversions: number }[]
  >([]);

  // States for ROI Estimator Widget
  const [dailyGoal, setDailyGoal] = useState(500);
  const [avgServicePrice, setAvgServicePrice] = useState(1500);
  const [outreachConvRate, setOutreachConvRate] = useState(2.5);
  const [crmClientsCount, setCrmClientsCount] = useState(0);

  const monthlyTarget = dailyGoal * 30;
  const clientsNeededMonthly = avgServicePrice > 0 ? monthlyTarget / avgServicePrice : 0;
  const totalEmailsNeededMonthly = outreachConvRate > 0 ? clientsNeededMonthly / (outreachConvRate / 100) : 0;
  const emailsNeededDaily = Math.ceil(totalEmailsNeededMonthly / 30);
  const viralScriptsNeededDaily = Math.max(1, Math.ceil(emailsNeededDaily / 7));

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, "clients"),
      where("userId", "==", user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCrmClientsCount(snapshot.size);
    });
    return () => unsubscribe();
  }, []);

  const dependencyManager = useMemo(() => new DependencyManager(tasks), [tasks]);
  const layeredLayout = useMemo(() => dependencyManager.getLayeredLayout(), [dependencyManager]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const docRef = doc(db, "dashboards", user.uid);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.tasks) setTasks(data.tasks);
        if (data.conversionHistory)
          setConversionHistory(data.conversionHistory);
        if (data.stats) {
          const statsWithIcons = data.stats.map(
            (s: (typeof initialStats)[0]) => {
              const orig = initialStats.find((os) => os.id === s.id);
              return { ...s, icon: orig ? orig.icon : Activity };
            },
          );
          setStats(statsWithIcons);
          const loopsStat = statsWithIcons.find(
            (s: (typeof initialStats)[0]) => s.id === "loops",
          );
          if (loopsStat) {
            setLoopsHistory((prev) => {
              if (prev.length > 0) return prev;
              
              // Generate some initial mock history leading up to current value
              const history = [];
              let current = loopsStat.value - 60;
              for (let i = 19; i >= 0; i--) {
                const d = new Date();
                d.setSeconds(d.getSeconds() - i * 5);
                history.push({
                  time: d.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  }),
                  value: current,
                });
                current += Math.floor(Math.random() * 4) + 1;
              }
              // Add actual current value as last point
              const dCurrent = new Date();
              history.push({
                time: dCurrent.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                }),
                value: loopsStat.value,
              });
              return history;
            });
          }
        }
      } else {
        setTasks([]);
        setStats([]);
        setLoopsHistory([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const generateSampleData = () => {
    const user = auth.currentUser;
    if (user) {
      const sanitizedStats = initialStats.map((s) => {
        const { icon, ...rest } = s;
        return rest;
      });
      const history = [];
      for (let i = 89; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const total = Math.floor(Math.random() * 50) + 10;
        const facebook = Math.floor(total * (Math.random() * 0.4 + 0.2));
        const linkedin = Math.floor(total * (Math.random() * 0.3 + 0.1));
        const direct = total - facebook - linkedin;
        history.push({
          date: d.toISOString().split("T")[0],
          conversions: total,
          facebook,
          linkedin,
          direct,
        });
      }
      setDoc(
        doc(db, "dashboards", user.uid),
        {
          tasks: initialTasks,
          stats: sanitizedStats,
          conversionHistory: history,
        },
        { merge: true },
      );
    } else {
      setTasks(initialTasks);
      setStats(initialStats);
    }
  };

  const clearData = () => {
    const user = auth.currentUser;
    if (user) {
      setDoc(
        doc(db, "dashboards", user.uid),
        {
          tasks: [],
          stats: [],
          conversionHistory: [],
        },
        { merge: true },
      );
    } else {
      setTasks([]);
      setStats([]);
      setConversionHistory([]);
    }
  };

  const isStatsEmpty = stats.length === 0;

  useEffect(() => {
    // Simulate real-time polling updates locally
    if (isStatsEmpty) return;
    const interval = setInterval(() => {
      setStats((prevStats) =>
        prevStats.map((stat) => {
          if (Math.random() > 0.6) {
            const increase =
              stat.id === "threats"
                ? Math.random() > 0.85
                  ? 1
                  : 0
                : Math.floor(Math.random() * 5) + 1;
            const newChange = +(
              stat.change +
              (Math.random() * 0.4 - 0.2)
            ).toFixed(1);
            const newValue = stat.value + increase;

            if (stat.id === "loops") {
              setLoopsHistory((prev) => {
                const newHistory = [
                  ...prev,
                  {
                    time: new Date().toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    }),
                    value: newValue,
                  },
                ];
                return newHistory.slice(-20);
              });
            }

            return {
              ...stat,
              value: newValue,
              change: newChange,
            };
          }
          return stat;
        }),
      );
    }, 2500);

    return () => clearInterval(interval);
  }, [isStatsEmpty]);

  const toggleTask = (id: number) => {
    const prevUnlockedStates = new Map(
      tasks.map((t) => [t.id, dependencyManager.isUnlocked(t.id)]),
    );

    const newTasks = tasks.map((t) => {
      if (t.id === id) {
        return { ...t, completed: !t.completed };
      }
      return t;
    });

    const newDependencyManager = new DependencyManager(newTasks);
    newTasks.forEach((t) => {
      const wasUnlocked = prevUnlockedStates.get(t.id);
      const isNowUnlocked = newDependencyManager.isUnlocked(t.id);
      if (!wasUnlocked && isNowUnlocked) {
        toast.info(`Odblokowano zadanie: ${t.title}`);
      }
    });

    // Optimistic UI update
    setTasks(newTasks);

    const user = auth.currentUser;
    if (user) {
      setDoc(
        doc(db, "dashboards", user.uid),
        { tasks: newTasks },
        { merge: true },
      );
    }
  };

  const toggleTaskBlocked = (id: number) => {
    const newTasks = tasks.map((t) => {
      if (t.id === id) {
        const isNowBlocked = !t.blocked;
        if (isNowBlocked) {
          toast.warning(`Zablokowano zadanie: ${t.title}`);
        } else {
          toast.info(`Odblokowano zadanie: ${t.title}`);
        }
        return { ...t, blocked: isNowBlocked };
      }
      return t;
    });

    // Optimistic UI update
    setTasks(newTasks);

    const user = auth.currentUser;
    if (user) {
      setDoc(
        doc(db, "dashboards", user.uid),
        { tasks: newTasks },
        { merge: true },
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Terminal Główny
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            Przegląd statusu systemu i aktywności agentów.
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
          {stats.length === 0 && tasks.length === 0 ? (
            <button
              onClick={generateSampleData}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-md shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-all"
            >
              <Zap size={16} />
              Generuj przykładowe dane
            </button>
          ) : (
            <button
              onClick={clearData}
              className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm font-medium rounded-md transition-all"
            >
              <AlertTriangle size={16} />
              Wyczyść dane
            </button>
          )}
          
          <button 
            onClick={async () => {
              const stripeKey = useSettingsStore.getState().stripeKey;
              if (!stripeKey) {
                toast.error("Brak klucza Stripe. Uzupełnij go w Ustawieniach.");
                return;
              }
              try {
                const res = await fetch("/api/create-checkout-session", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ 
                    stripeKey, 
                    amount: 49900, 
                    productName: "Konsultacja AI & Automatyzacja",
                    successUrl: window.location.href,
                    cancelUrl: window.location.href
                  })
                });
                const data = await res.json();
                if (data.url) {
                  window.open(data.url, "_blank");
                } else {
                  throw new Error(data.error || "Nie udało się utworzyć płatności");
                }
              } catch (e: unknown) {
                const errMsg = e instanceof Error ? e.message : String(e);
                toast.error(errMsg || "Błąd płatności");
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-md shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
          >
            <Zap size={16} />
            Testuj Płatność (Nowa Karta)
          </button>

          <button 
            onClick={async () => {
              const stripeKey = useSettingsStore.getState().stripeKey;
              if (!stripeKey) {
                toast.error("Brak klucza Stripe. Uzupełnij go w Ustawieniach.");
                return;
              }
              try {
                const res = await fetch("/api/create-checkout-session", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ 
                    stripeKey, 
                    amount: 49900, 
                    productName: "Konsultacja AI & Automatyzacja",
                    successUrl: window.location.href,
                    cancelUrl: window.location.href
                  })
                });
                const data = await res.json();
                if (data.url) {
                  await navigator.clipboard.writeText(data.url);
                  toast.success("Skopiowano link do schowka! Możesz go wysłać klientowi.");
                } else {
                  throw new Error(data.error || "Nie udało się wygenerować linku");
                }
              } catch (e: unknown) {
                const errMsg = e instanceof Error ? e.message : String(e);
                toast.error(errMsg || "Błąd generowania linku");
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-md shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-all"
          >
            <Link size={16} />
            Skopiuj Link dla Klienta
          </button>

          <button className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-sm font-medium rounded-md shadow-[0_0_15px_rgba(225,29,72,0.3)] transition-all">
            <Zap size={16} />
            Uruchom Kampanię
          </button>
        </div>
      </div>

      <SystemHealthWidget />
      <SystemUpdatesWidget />
      <RealtimeOperationsMonitor />
      <SystemHealthMonitor />
      <WorkflowOrchestrator />

      {stats.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item, index) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              key={item.id}
              className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 rounded-full bg-gradient-to-br from-neutral-800/50 to-transparent blur-2xl" />
              <dt>
                <div className="absolute rounded-md p-3 bg-neutral-950 border border-neutral-800">
                  <item.icon
                    className={`h-6 w-6 ${item.color}`}
                    aria-hidden="true"
                  />
                </div>
                <p className="ml-16 truncate text-sm font-medium text-neutral-400">
                  {item.name}
                </p>
              </dt>
              <dd className="ml-16 flex items-baseline pb-1 sm:pb-2">
                <p className="text-2xl font-bold text-white">
                  {item.value.toLocaleString()}
                </p>
                <p
                  className={`ml-2 flex items-center gap-0.5 text-sm font-semibold ${
                    item.change >= 0 ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {item.change >= 0 ? (
                    <TrendingUp size={14} strokeWidth={2.5} />
                  ) : (
                    <TrendingDown size={14} strokeWidth={2.5} />
                  )}
                  <span>
                    {item.change >= 0 ? "+" : ""}
                    {item.change.toFixed(1)}%
                  </span>
                </p>
              </dd>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 flex flex-col items-center justify-center text-center">
          <Activity size={32} className="text-neutral-600 mb-3" />
          <h3 className="text-lg font-medium text-white">Brak statystyk</h3>
          <p className="mt-1 text-sm text-neutral-400 max-w-sm mb-4">
            System nie zgromadził jeszcze żadnych danych. Wygeneruj przykładowe
            dane, aby zobaczyć, jak wygląda pulpit.
          </p>
          <button
            onClick={generateSampleData}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-md shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-all"
          >
            <Zap size={16} />
            Generuj przykładowe statystyki i zadania
          </button>
        </div>
      )}

      {/* Szybki estymator ROI Widget */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 mt-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 rounded-full bg-gradient-to-br from-rose-500/10 to-transparent blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="p-1 px-2 bg-rose-500/10 text-rose-400 rounded text-xs uppercase font-mono tracking-wider font-semibold">Pro Mode</span>
              Szybki Estymator ROI – Conversion Pipeline
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              Wyliczanie lejka konwersji i zapotrzebowania na outreach do osiągnięcia celu finansowego.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-neutral-950/40 border border-neutral-800/80 px-4 py-2 rounded-lg">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-neutral-300 font-mono">
              Baza CRM: <strong>{crmClientsCount}</strong> {crmClientsCount === 1 ? 'klient' : crmClientsCount > 1 && crmClientsCount < 5 ? 'klientów' : 'klientów'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Inputs Section */}
          <div className="lg:col-span-5 space-y-5">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-mono text-neutral-400 uppercase tracking-wide">Cel Dzienny (PLN)</label>
                <span className="text-sm font-bold text-rose-400">{dailyGoal} PLN</span>
              </div>
              <input
                type="range"
                min="100"
                max="5000"
                step="50"
                value={dailyGoal}
                onChange={(e) => setDailyGoal(Number(e.target.value))}
                className="w-full accent-rose-500 bg-neutral-950 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
                <span>100 PLN</span>
                <span>2500 PLN</span>
                <span>5000 PLN</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-mono text-neutral-400 uppercase tracking-wide">Średnia Cena Usługi (PLN)</label>
                <span className="text-sm font-bold text-indigo-400">{avgServicePrice} PLN</span>
              </div>
              <input
                type="range"
                min="500"
                max="25000"
                step="500"
                value={avgServicePrice}
                onChange={(e) => setAvgServicePrice(Number(e.target.value))}
                className="w-full accent-indigo-500 bg-neutral-950 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
                <span>500 PLN</span>
                <span>12 500 PLN</span>
                <span>25 000 PLN</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-mono text-neutral-400 uppercase tracking-wide">Współczynnik Konwersji (%)</label>
                <span className="text-sm font-bold text-emerald-400">{outreachConvRate}%</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="15"
                step="0.5"
                value={outreachConvRate}
                onChange={(e) => setOutreachConvRate(Number(e.target.value))}
                className="w-full accent-emerald-500 bg-neutral-950 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
                <span>0.5%</span>
                <span>7.5%</span>
                <span>15.0%</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 flex items-center justify-center">
            <div className="w-[1px] h-full bg-neutral-800 hidden lg:block" />
            <div className="w-full h-[1px] bg-neutral-800 block lg:hidden my-2" />
          </div>

          {/* Readout Section */}
          <div className="lg:col-span-6 grid grid-cols-2 gap-4">
            <div className="bg-neutral-950/40 border border-neutral-850 p-4 rounded-lg flex flex-col justify-between">
              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">Wymóg Miesięczny</span>
              <div className="mt-2">
                <div className="text-xl font-bold text-white font-mono">{monthlyTarget.toLocaleString()} PLN</div>
                <span className="text-[10px] text-neutral-500 block mt-1">Cel zysku na 30 dni</span>
              </div>
            </div>

            <div className="bg-neutral-950/40 border border-neutral-850 p-4 rounded-lg flex flex-col justify-between">
              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">Klienci Miesięcznie</span>
              <div className="mt-2">
                <div className="text-xl font-bold text-white font-mono">{clientsNeededMonthly.toFixed(1)}</div>
                <span className="text-[10px] text-neutral-500 block mt-1">Sfinalizowane umowy</span>
              </div>
            </div>

            <div className="bg-rose-950/10 border border-rose-900/30 p-4 rounded-lg flex flex-col justify-between shadow-[inset_0_0_12px_rgba(244,63,94,0.05)]">
              <span className="text-[10px] font-mono text-rose-400 uppercase tracking-wider block">Zimne E-maile Dzisiaj</span>
              <div className="mt-2">
                <div className="text-2xl font-black text-rose-400 font-mono">{emailsNeededDaily}</div>
                <span className="text-[10px] text-neutral-400 block mt-1 font-sans">Wymagana wysyłka outreach</span>
              </div>
            </div>

            <div className="bg-indigo-950/10 border border-indigo-900/30 p-4 rounded-lg flex flex-col justify-between shadow-[inset_0_0_12px_rgba(99,102,241,0.05)]">
              <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider block">Skrypty VSL (Dopamina)</span>
              <div className="mt-2">
                <div className="text-2xl font-black text-indigo-400 font-mono">{viralScriptsNeededDaily}</div>
                <span className="text-[10px] text-neutral-400 block mt-1 font-sans">Skrypty wideo dzisiaj</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-3 bg-neutral-950/60 border border-neutral-800 rounded-lg flex items-center gap-3">
          <Zap size={16} className="text-rose-500 animate-bounce" />
          <p className="text-xs text-neutral-300 font-mono">
            <strong>Instrukcja działania:</strong> Wygeneruj dzisiaj {viralScriptsNeededDaily} {viralScriptsNeededDaily === 1 ? 'wirusowy skrypt' : 'wirusowe skrypty'} VSL w module <strong>DopamineLoops</strong> i wyślij {emailsNeededDaily} zimnych e-maili przez <strong>GmailIntegration</strong>, aby utrzymać tempo {dailyGoal} PLN/dziennie.
          </p>
        </div>
      </div>

      {/* 5. PRO Profits Interactive Optimizer Tool */}
      <ProProfitMaximizer 
        initialDailyGoal={dailyGoal}
        initialAvgPrice={avgServicePrice}
        initialConvRate={outreachConvRate}
      />

      {stats.length > 0 && loopsHistory.length > 0 && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 mt-6">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <Activity size={18} className="text-rose-500" />
            Aktywne Pętle Dopaminowe w czasie
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={loopsHistory}
                margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#333"
                  vertical={false}
                />
                <XAxis
                  dataKey="time"
                  stroke="#666"
                  tick={{ fill: "#666", fontSize: 12 }}
                  tickMargin={10}
                  minTickGap={30}
                />
                <YAxis
                  stroke="#666"
                  tick={{ fill: "#666", fontSize: 12 }}
                  domain={["dataMin - 10", "auto"]}
                  tickMargin={10}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#171717",
                    borderColor: "#333",
                    color: "#fff",
                    borderRadius: "8px",
                  }}
                  itemStyle={{ color: "#f43f5e" }}
                  labelStyle={{ color: "#999", marginBottom: "4px" }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  name="Wartość"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{
                    r: 6,
                    fill: "#f43f5e",
                    stroke: "#171717",
                    strokeWidth: 2,
                  }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {conversionHistory.length > 0 && (
        <CampaignConversionChart data={conversionHistory} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <Activity size={18} className="text-rose-500" />
            Aktywność Systemu
          </h3>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex gap-4 items-start p-3 rounded-lg bg-neutral-950/50 border border-neutral-800/50"
              >
                <div className="w-2 h-2 rounded-full bg-rose-500 mt-2" />
                <div>
                  <p className="text-sm text-gray-300">
                    Agent VSL zakończył generowanie skryptu dla "Projektu X".
                  </p>
                  <span className="text-xs text-neutral-500">
                    12 minut temu
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <Terminal size={18} className="text-blue-500" />
            Logi Agenta Zwiadowcy (Deep Web)
          </h3>
          <div className="font-mono text-xs text-neutral-400 bg-black p-4 rounded-lg border border-neutral-800 h-[280px] overflow-y-auto custom-scrollbar">
            <div className="text-green-500 mb-2">~ /system/scout/run.sh</div>
            <div className="opacity-70">
              [INFO] Inicjalizacja skanowania Reddit (r/SaaS)...
            </div>
            <div className="opacity-70">
              [INFO] Wykryto nowy ból: "How to reduce churn?" (Confidence: 94%)
            </div>
            <div className="text-rose-400 my-1">
              [WARN] Omijanie rate limitów API... Sukces.
            </div>
            <div className="opacity-70">
              [INFO] Zrzut do pamięci wektorowej (RAG)... Zakończono.
            </div>
            <div className="opacity-70 mt-4">
              [INFO] Inicjalizacja skanowania HackerNews...
            </div>
            <div className="opacity-70">
              [INFO] Wykryto dyskusję o pricingach...
            </div>
            <div className="text-blue-400 my-1">
              [ACTION] Agent przekazał dane do modułu "Oko Opatrzności".
            </div>
            <div className="infinite-pulse text-green-500 mt-2">_</div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-neutral-900 border border-neutral-800 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <h3 className="text-lg font-medium text-white flex items-center gap-2">
            <CheckSquare size={18} className="text-indigo-500" />
            Zadania Priorytetowe
          </h3>
          <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800">
            <button
              onClick={() => setTasksViewMode("list")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${tasksViewMode === "list" ? "bg-neutral-800 text-white" : "text-neutral-500 hover:text-neutral-300"}`}
            >
              <List size={14} /> Widok Listy
            </button>
            <button
              onClick={() => setTasksViewMode("graph")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${tasksViewMode === "graph" ? "bg-neutral-800 text-white" : "text-neutral-500 hover:text-neutral-300"}`}
            >
              <Network size={14} /> Zależności
            </button>
          </div>
        </div>

        {tasksViewMode === "list" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tasks.map((task) => {
              const styles = getTaskStyles(task.type);
              const active = dependencyManager.isUnlocked(task.id);
              const progress = dependencyManager.getDependencyProgress(task.id);
              const Icon = active ? styles.icon : Lock;

              return (
                <div
                  key={task.id}
                  className={`group flex items-start gap-4 p-4 rounded-lg border transition-all ${active ? styles.border : "border-neutral-800"} ${active ? styles.bg : "bg-neutral-900/50"} ${task.completed ? "opacity-70" : ""} ${!active ? "opacity-50 select-none" : ""}`}
                >
                  <button
                    onClick={() => active && toggleTask(task.id)}
                    className={`mt-0.5 outline-none rounded-full transition-colors ${active ? "cursor-pointer hover:scale-110" : "cursor-not-allowed"} ${task.completed ? "text-emerald-500" : active ? styles.text : "text-neutral-600"}`}
                    disabled={!active}
                  >
                    {task.completed ? (
                      <CheckCircle2 size={18} />
                    ) : (
                      <Icon size={18} />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <h4
                      className={`text-sm font-medium mb-1 leading-snug ${task.completed ? "text-neutral-400 line-through" : !active ? "text-neutral-500" : "text-gray-200"}`}
                    >
                      {task.title}
                    </h4>
                    <div
                      className={`flex items-center gap-3 text-xs ${!active ? "text-neutral-600" : "text-neutral-500"} w-full`}
                    >
                      {active ? (
                        <>
                          <span>
                            Skupienie:{" "}
                            <span className={styles.text}>
                              {task.urgency} / {task.importance}
                            </span>
                          </span>
                          <span>•</span>
                          <span>Czas: {task.time}</span>
                        </>
                      ) : (
                        <div className="flex flex-col gap-2 w-full mt-1">
                          <span className="flex items-center gap-1">
                            <Lock size={12} /> Zablokowane{" "}
                            {task.blocked
                              ? "(Ręcznie)"
                              : `(Oczekuje na: ${task.dependsOn.map((id) => tasks.find((t) => t.id === id)?.title).join(", ")})`}
                          </span>
                          {task.dependsOn.length > 0 && !task.blocked && (
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 flex-1 bg-neutral-800 rounded-full overflow-hidden max-w-[200px]">
                                <div
                                  className="h-full bg-indigo-500/50 rounded-full transition-all duration-300"
                                  style={{ width: `${progress.percentage}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-neutral-500 whitespace-nowrap">
                                {progress.completed} / {progress.total}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTask(task.id);
                      }}
                      className={`p-1.5 rounded-md transition-colors ${task.completed ? "bg-emerald-500/20 text-emerald-400" : "hover:bg-neutral-800 text-neutral-400"}`}
                      title={task.completed ? "Cofnij ukończenie" : "Zakończ"}
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTaskBlocked(task.id);
                      }}
                      className={`p-1.5 rounded-md transition-colors ${task.blocked ? "bg-rose-500/20 text-rose-400" : "hover:bg-neutral-800 text-neutral-400"}`}
                      title={task.blocked ? "Odblokuj" : "Zablokuj"}
                    >
                      <Ban size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-neutral-950/50 rounded-xl border border-neutral-800 p-6 overflow-x-auto custom-scrollbar">
            <div className="min-w-max flex flex-col gap-10">
              {layeredLayout.map((layer, idx) => (
                <div
                  key={idx}
                  className="flex justify-center flex-wrap gap-8 w-full relative"
                >
                  {layer.map((task) => {
                    const active = dependencyManager.isUnlocked(task.id);
                    const styles = getTaskStyles(task.type);
                    const dependentTasks = dependencyManager.getDependentTasks(
                      task.id,
                    );

                    return (
                      <div key={task.id} className="relative group">
                        {dependentTasks.length > 0 && (
                          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-center justify-center text-neutral-600">
                            <ArrowRight
                              size={16}
                              className="rotate-90 hidden sm:block"
                            />
                          </div>
                        )}
                        <div
                          className={`w-72 p-4 rounded-xl border transition-all ${active ? styles.border : "border-neutral-800"} ${active ? styles.bg : "bg-neutral-900/40"} ${task.completed ? "opacity-70" : ""} ${!active ? "opacity-60" : ""}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-3">
                              <button
                                onClick={() => active && toggleTask(task.id)}
                                className={`mt-0.5 outline-none rounded-full shrink-0 transition-colors ${active ? "cursor-pointer hover:scale-110" : "cursor-not-allowed"} ${task.completed ? "text-emerald-500" : active ? styles.text : "text-neutral-600"}`}
                                disabled={!active}
                              >
                                {task.completed ? (
                                  <CheckCircle2 size={16} />
                                ) : active ? (
                                  <styles.icon size={16} />
                                ) : (
                                  <Lock size={16} />
                                )}
                              </button>
                              <h4
                                className={`text-sm font-medium leading-snug break-words ${task.completed ? "text-neutral-400 line-through" : !active ? "text-neutral-500" : "text-gray-200"}`}
                              >
                                {task.title}
                              </h4>
                            </div>
                            <div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleTask(task.id);
                                }}
                                className={`p-1.5 rounded-md transition-colors ${task.completed ? "bg-emerald-500/20 text-emerald-400" : "hover:bg-neutral-800 text-neutral-400"}`}
                                title={
                                  task.completed
                                    ? "Cofnij ukończenie"
                                    : "Zakończ"
                                }
                              >
                                <Check size={14} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleTaskBlocked(task.id);
                                }}
                                className={`p-1.5 rounded-md transition-colors ${task.blocked ? "bg-rose-500/20 text-rose-400" : "hover:bg-neutral-800 text-neutral-400"}`}
                                title={task.blocked ? "Odblokuj" : "Zablokuj"}
                              >
                                <Ban size={14} />
                              </button>
                            </div>
                          </div>
                          {!active && (
                            <div className="mt-3 w-full">
                              <div
                                className="text-[10px] text-neutral-500 font-medium bg-black/40 px-2 py-1 rounded inline-block mb-2 line-clamp-1"
                                title={
                                  task.blocked
                                    ? "Zablokowane ręcznie"
                                    : `Brakujące: ${task.dependsOn
                                        .filter(
                                          (d) =>
                                            !tasks.find((x) => x.id === d)
                                              ?.completed,
                                        )
                                        .map(
                                          (id) =>
                                            tasks.find((t) => t.id === id)
                                              ?.title,
                                        )
                                        .join(", ")}`
                                }
                              >
                                {task.blocked
                                  ? "Zablokowane (Ręcznie)"
                                  : `Brakujące: ${task.dependsOn
                                      .filter(
                                        (d) =>
                                          !tasks.find((x) => x.id === d)
                                            ?.completed,
                                      )
                                      .map(
                                        (id) =>
                                          tasks.find((t) => t.id === id)?.title,
                                      )
                                      .join(", ")}`}
                              </div>

                              {task.dependsOn.length > 0 && !task.blocked && (
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="h-1.5 flex-1 bg-neutral-800 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-indigo-500/40 rounded-full transition-all duration-300"
                                      style={{
                                        width: `${dependencyManager.getDependencyProgress(task.id).percentage}%`,
                                      }}
                                    />
                                  </div>
                                  <span className="text-[9px] text-neutral-500 whitespace-nowrap">
                                    {
                                      dependencyManager.getDependencyProgress(
                                        task.id,
                                      ).completed
                                    }{" "}
                                    /{" "}
                                    {
                                      dependencyManager.getDependencyProgress(
                                        task.id,
                                      ).total
                                    }
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-8">
        <DashboardCalendar />
      </div>
    </div>
  );
}
