import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  GitFork, 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronRight, 
  CheckCircle2, 
  Search, 
  Mail, 
  FileSpreadsheet, 
  Sparkles, 
  Sliders, 
  Plus, 
  Cpu, 
  Database,
  ArrowRight,
  RefreshCw,
  Eye,
  AlertTriangle,
  Flame,
  Activity,
  Brain,
  Zap,
  Terminal
} from "lucide-react";
import { toast } from "sonner";
import { useSystemLogsStore } from "../../store/systemLogsStore";

// Type definitions for Orchestration Graph Nodes, connections, and states
interface WorkflowNode {
  id: string;
  name: string;
  module: "scraper" | "ai" | "gmail" | "crm";
  status: "idle" | "running" | "succeeded" | "failed";
  label: string;
  description: string;
  icon: any;
  position: { x: number; y: number };
}

interface WorkflowConnection {
  from: string;
  to: string;
  label: string;
  isActive: boolean;
}

export function WorkflowOrchestrator() {
  const sysLogsStore = useSystemLogsStore();

  // Log diagnostic events helper
  const addInternalLog = useCallback(async (action: string, details: string) => {
    await sysLogsStore.logAction("ORCHESTRATOR", action, details);
  }, [sysLogsStore]);

  // State machine configuration
  const [currentMachineState, setCurrentMachineState] = useState<
    "READY" | "SCRAPING_LEADS" | "AI_ENRICHMENT" | "GMAIL_OUTREACH" | "CRM_PIPELINE" | "COMPLETED" | "PAUSED" | "ERROR"
  >("READY");

  const [activeStep, setActiveStep] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(3000); // ms per node

  // Custom Integration/Decision Variables configured by user
  const [leadTarget, setLeadTarget] = useState("Dyrektorzy Marketingu IT");
  const [aiFilterStrength, setAiFilterStrength] = useState("Wysokie (tylko merytoryczne)");
  const [gmailTemplate, setGmailTemplate] = useState("Spersonalizowana oferta VSL");
  const [crmDealStage, setCrmDealStage] = useState("Leads (Kwalifikowanie)");
  const [autoReTrigger, setAutoReTrigger] = useState(false);

  // Stats Counters
  const [totalProcessed, setTotalProcessed] = useState(148);
  const [totalConverted, setTotalConverted] = useState(42);
  const [lastExecutionTime, setLastExecutionTime] = useState<string>("10:12:05");

  // PRO+ Optimization structures
  const [isGeneratingConfig, setIsGeneratingConfig] = useState(false);
  const [optResult, setOptResult] = useState<{
    scraperKeywords: string;
    classificationThreshold: string;
    emailSubject: string;
    emailPayloadSnippet: string;
    crmDealStageOption: string;
    predictedConversion: number;
  } | null>(null);

  // AI Feedback Loop states for real-time operation optimization
  const [feedbackData, setFeedbackData] = useState<Record<string, {
    identifiedIssue: string;
    recommendedAction: string;
    parameterUpdates: {
      target?: string;
      aiFilterStrength?: string;
      gmailTemplate?: string;
      crmDealStage?: string;
    };
    confidence: number;
    thinkingProcess: string;
  } | null>>({
    scraper: null,
    ai: null,
    gmail: null,
    crm: null
  });

  const [isAnalyzingFeedback, setIsAnalyzingFeedback] = useState<Record<string, boolean>>({
    scraper: false,
    ai: false,
    gmail: false,
    crm: false
  });

  const runFeedbackAnalysis = useCallback(async (module: "scraper" | "ai" | "gmail" | "crm") => {
    setIsAnalyzingFeedback(prev => ({ ...prev, [module]: true }));
    toast.info(`Inicjowanie pętli feedbacku AI dla modułu: ${module}...`);
    try {
      // Gather current metric context based on module
      let metrics = {};
      if (module === "scraper") {
        metrics = { processed: totalProcessed, successRate: "88%", friction: "Szybkie porzucanie stron docelowych", currentSetting: leadTarget };
      } else if (module === "ai") {
        metrics = { processed: Math.round(totalProcessed * 0.9), successRate: "84%", friction: "Brak intencji budżetowej", currentSetting: aiFilterStrength };
      } else if (module === "gmail") {
        metrics = { processed: Math.round(totalProcessed * 0.6), successRate: "22% odpowiedzi", friction: "Słaby CTR wideo VSL", currentSetting: gmailTemplate };
      } else if (module === "crm") {
        metrics = { processed: totalConverted, successRate: "95% zapisu", friction: "Opóźnienie w asynchronicznym kalendarzu", currentSetting: crmDealStage };
      }

      const resp = await fetch("/api/workflow/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module, metrics })
      });
      if (!resp.ok) throw new Error("Feedback API response error");
      const data = await resp.json();
      
      setFeedbackData(prev => ({ ...prev, [module]: data }));
      
      await addInternalLog(
        "FEEDBACK_ANALYSIS_COMPLETED",
        `Pętla Feedbacku AI zakończyła analizę dla: ${module}. Wykryty problem: "${data.identifiedIssue}". Zaufanie: ${data.confidence}%`
      );
      toast.success(`Analiza feedbacku AI dla modułu ${module} gotowa!`);
    } catch (err) {
      console.error(err);
      toast.error("Wystąpił błąd podczas pętli feedbacku w czasie rzeczywistym.");
    } finally {
      setIsAnalyzingFeedback(prev => ({ ...prev, [module]: false }));
    }
  }, [totalProcessed, totalConverted, leadTarget, aiFilterStrength, gmailTemplate, crmDealStage, addInternalLog]);

  const applyFeedbackOptimization = useCallback(async (module: "scraper" | "ai" | "gmail" | "crm") => {
    const data = feedbackData[module];
    if (!data) return;

    if (data.parameterUpdates) {
      const updates = data.parameterUpdates;
      if (updates.target) {
        setLeadTarget(updates.target);
        await addInternalLog("CONFIG_CHANGED", `Skorygowano parametry szukania leadów na: ${updates.target}`);
      }
      if (updates.aiFilterStrength) {
        setAiFilterStrength(updates.aiFilterStrength);
        await addInternalLog("CONFIG_CHANGED", `Ustawiono poziom inteligencji AI na: ${updates.aiFilterStrength}`);
      }
      if (updates.gmailTemplate) {
        setGmailTemplate(updates.gmailTemplate);
        await addInternalLog("CONFIG_CHANGED", `Zmieniono szablon wiadomości Gmail na: ${updates.gmailTemplate}`);
      }
      if (updates.crmDealStage) {
        setCrmDealStage(updates.crmDealStage);
        await addInternalLog("CONFIG_CHANGED", `Zmieniono domyślny etap transakcji CRM na: ${updates.crmDealStage}`);
      }

      await addInternalLog(
        "FEEDBACK_OPTIMIZATION_APPLIED",
        `Automatycznie skorygowano parametry z pętli feedbacku AI dla modułu: ${module}.`
      );
      toast.success(`Pomyślnie zoptymalizowano parametry modułu: ${module}!`);
    }
  }, [feedbackData, addInternalLog]);

  const handleGenerateAISuggestions = useCallback(async () => {
    if (isGeneratingConfig) return;
    setIsGeneratingConfig(true);
    toast.info(`Generowanie strategii orkiestracji Omega AI PRO dla grupy: "${leadTarget}"...`);
    try {
      const resp = await fetch("/api/workflow/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: leadTarget })
      });
      if (!resp.ok) throw new Error("Optimization API response error");
      const data = await resp.json();
      setOptResult(data);
      
      // Auto-propagate the generated values to bind our modules seamlessly
      if (data.classificationThreshold) {
        setAiFilterStrength(`AI Guard: ${data.classificationThreshold}`);
      }
      
      await addInternalLog(
        "AI_STRATEGY_GENERATED",
        `Wygenerowano plan dla "${leadTarget}". Branżowy próg AI: ${data.classificationThreshold}. Szacowana konwersja pętli: ${data.predictedConversion}%.`
      );
      toast.success("Omega AI PRO+ przetworzył i skonfigurował parametry orkiestracji!");
    } catch (err) {
      console.error(err);
      toast.error("Zastosowano procedury awaryjnego planowania (tryb hybrydowy).");
    } finally {
      setIsGeneratingConfig(false);
    }
  }, [leadTarget, isGeneratingConfig, addInternalLog]);

  // Custom workflow nodes coordinates and metadata layout representing state map
  const [nodes, setNodes] = useState<WorkflowNode[]>([
    {
      id: "node_scraper",
      name: "Lead Scraper",
      module: "scraper",
      status: "idle",
      label: "Automatyczny Skraping",
      description: "Pobiera nowe domeny, kontakty z Google Maps i LinkedIn",
      icon: Search,
      position: { x: 50, y: 150 }
    },
    {
      id: "node_ai",
      name: "Omega AI Guard",
      module: "ai",
      status: "idle",
      label: "Generatywna Analiza",
      description: "Klasyfikuje intencje klienta i redaguje spersonalizowaną treść wiadomości",
      icon: Sparkles,
      position: { x: 300, y: 150 }
    },
    {
      id: "node_gmail",
      name: "Gmail Outreach Engine",
      module: "gmail",
      status: "idle",
      label: "Dystrybucja Maili",
      description: "Masowa wysyłka i wykrywanie odpowiedzi z bezpiecznym throttlingiem",
      icon: Mail,
      position: { x: 550, y: 50 }
    },
    {
      id: "node_crm",
      name: "CRM Pipeline Sync",
      module: "crm",
      status: "idle",
      label: "Katalogowanie i Zapis",
      description: "Zapisuje rekordy w bazie klientów Firebase/Sheets",
      icon: Database,
      position: { x: 550, y: 250 }
    }
  ]);

  // Visual connections (animated wires in SVG container)
  const connections = useMemo<WorkflowConnection[]>(() => {
    return [
      {
        from: "node_scraper",
        to: "node_ai",
        label: "Nowe rekordy Leadów",
        isActive: currentMachineState === "SCRAPING_LEADS" || currentMachineState === "AI_ENRICHMENT"
      },
      {
        from: "node_ai",
        to: "node_gmail",
        label: "Kwalifikacja pozytywna",
        isActive: currentMachineState === "AI_ENRICHMENT" || currentMachineState === "GMAIL_OUTREACH"
      },
      {
        from: "node_ai",
        to: "node_crm",
        label: "Zapisz leady zimne",
        isActive: currentMachineState === "AI_ENRICHMENT" || currentMachineState === "CRM_PIPELINE"
      },
      {
        from: "node_gmail",
        to: "node_crm",
        label: "Odpowiedź -> Deal status",
        isActive: currentMachineState === "GMAIL_OUTREACH" || currentMachineState === "CRM_PIPELINE" || currentMachineState === "COMPLETED"
      }
    ];
  }, [currentMachineState]);


  // State transitions triggers representing the XState-inspired architecture
  const handleTransition = useCallback(async (nextState: typeof currentMachineState, stepIdx: number) => {
    setCurrentMachineState(nextState);
    setActiveStep(stepIdx);

    // Update nodes status array safely
    setNodes(prevNodes => prevNodes.map((n, idx) => {
      if (idx === stepIdx) {
        return { ...n, status: "running" };
      } else if (idx < stepIdx) {
        return { ...n, status: "succeeded" };
      } else {
        return { ...n, status: "idle" };
      }
    }));

    // Trigger log updates and display state changes
    switch (nextState) {
      case "SCRAPING_LEADS":
        await addInternalLog(
          "SCRAPER_TRIGGERED",
          `Rozpoczęto pobieranie leadów z filtrem: [${leadTarget}]. Maszyna stanów: SCRAPING_LEADS`
        );
        break;
      case "AI_ENRICHMENT":
        await addInternalLog(
          "AI_ENRICHMENT_START",
          `Omega AI ocenia leady z progiem dokładności: ${aiFilterStrength}. Maszyna stanów: AI_ENRICHMENT`
        );
        break;
      case "GMAIL_OUTREACH":
        await addInternalLog(
          "EMAIL_CAMPAIGN_FIRE",
          `Kolejkowanie wysyłki Gmail za pomocą szablonu: [${gmailTemplate}]. Maszyna stanów: GMAIL_OUTREACH`
        );
        break;
      case "CRM_PIPELINE":
        await addInternalLog(
          "CRM_RECORD_SYNC",
          `Rejestrowanie sprawozdań z kampanii na etapie: [${crmDealStage}]. Maszyna stanów: CRM_PIPELINE`
        );
        break;
      case "COMPLETED":
        setTotalProcessed(p => p + 12);
        setTotalConverted(c => c + 3);
        setLastExecutionTime(new Date().toLocaleTimeString("pl-PL"));
        await addInternalLog(
          "WORKFLOW_SUCCESS",
          "Kompletna sekwencja workflow zakończona pomyślnie. Wszystkie systemy przywrócone do stanu READY"
        );
        toast.success("Zautomatyzowany potok zakończony. Dane zsynchronizowane z CRM!");
        break;
      default:
        break;
    }
  }, [leadTarget, aiFilterStrength, gmailTemplate, crmDealStage, addInternalLog]);

  // Playback loop simulator simulating multi-step state execution
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setTimeout(() => {
      if (currentMachineState === "READY") {
        handleTransition("SCRAPING_LEADS", 0);
      } else if (currentMachineState === "SCRAPING_LEADS") {
        handleTransition("AI_ENRICHMENT", 1);
      } else if (currentMachineState === "AI_ENRICHMENT") {
        handleTransition("GMAIL_OUTREACH", 2);
      } else if (currentMachineState === "GMAIL_OUTREACH") {
        handleTransition("CRM_PIPELINE", 3);
      } else if (currentMachineState === "CRM_PIPELINE") {
        handleTransition("COMPLETED", -1);
        
        if (autoReTrigger) {
          // loop back immediately if auto-retrigger is toggled on
          setCurrentMachineState("READY");
        } else {
          setIsPlaying(false);
        }
      }
    }, simulationSpeed);

    return () => clearTimeout(timer);
  }, [isPlaying, currentMachineState, handleTransition, simulationSpeed, autoReTrigger]);

  const resetOrchestrator = useCallback(() => {
    setIsPlaying(false);
    setCurrentMachineState("READY");
    setActiveStep(-1);
    setNodes(prev => prev.map(n => ({ ...n, status: "idle" })));
    addInternalLog("ORCHESTRATOR_RESET", "Ręczny reset rejestrów procesu. Maszyna powróciła do stanu początkowego READY.");
    toast.info("Stan kontrolera zresetowany urządzenia do IDLE.");
  }, [addInternalLog]);

  const triggerStepDirectly = useCallback((step: number) => {
    setIsPlaying(false);
    if (step === 0) handleTransition("SCRAPING_LEADS", 0);
    if (step === 1) handleTransition("AI_ENRICHMENT", 1);
    if (step === 2) handleTransition("GMAIL_OUTREACH", 2);
    if (step === 3) handleTransition("CRM_PIPELINE", 3);
  }, [handleTransition]);

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 relative overflow-hidden shadow-2xl mt-6" id="workflow-orchestrator-root">
      {/* Visual background flourishes */}
      <div className="absolute top-0 left-0 -ml-12 -mt-12 w-48 h-48 rounded-full bg-gradient-to-br from-indigo-500/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 -mr-12 -mb-12 w-48 h-48 rounded-full bg-gradient-to-tr from-purple-500/10 to-transparent blur-3xl pointer-events-none" />

      {/* Header section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-neutral-800 pb-5 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 px-2.5 bg-indigo-500/10 text-indigo-400 rounded text-[10px] font-mono uppercase tracking-wider font-bold flex items-center gap-1">
              <GitFork size={10} className="animate-pulse" />
              Integrated XState Automata
            </span>
            <span className="p-1 px-2 bg-neutral-950 text-neutral-400 rounded text-[10px] font-mono">
              Visual Wires v2.1
            </span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Zautomatyzowany Koordynator Procesów (Workflow Orchestrator)
          </h2>
          <p className="text-xs text-neutral-400 mt-1 max-w-3xl">
            Scentralizowany silnik decyzyjny łączący moduły wyszukiwania (Sales Lead Scraper), analizy intencji Omega AI, wysyłki kampanii Gmail oraz rejestrowania szans sprzedaży w potoku CRM.
          </p>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Simulation Toggle */}
          <button
            onClick={() => {
              if (currentMachineState === "COMPLETED") {
                setCurrentMachineState("READY");
                setNodes(nodes.map(n => ({ ...n, status: "idle" })));
              }
              setIsPlaying(!isPlaying);
              toast.info(isPlaying ? "Wstrzymano automatyczną rekrutację procesu" : "Uruchomiono wykonywanie zintegrowanego automatu...");
            }}
            className={`flex items-center gap-2 px-4 py-2 font-mono text-[11px] font-bold rounded-lg border transition-all ${
              isPlaying 
                ? "bg-amber-950/40 hover:bg-amber-900/40 text-amber-400 border-amber-900/30" 
                : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20"
            }`}
          >
            {isPlaying ? <Pause size={12} /> : <Play size={12} />}
            {isPlaying ? "WSTRZYMAJ AUTO" : "URUCHOM AUTOPILOT"}
          </button>

          {/* Reset button */}
          <button
            onClick={resetOrchestrator}
            className="flex items-center gap-2 px-3  py-2 bg-neutral-950 hover:bg-neutral-850 font-mono text-[11px] text-neutral-300 border border-neutral-800 rounded-lg transition-all"
          >
            <RotateCcw size={12} />
            RESET STATUSU
          </button>

          {/* Direct Trigger Simulation Button */}
          <button
            onClick={() => {
              if (isPlaying) setIsPlaying(false);
              handleTransition("SCRAPING_LEADS", 0);
              toast.success("Inicjowanie pętli integracyjnej. Zobacz animację połączeń!");
            }}
            disabled={isPlaying}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-[11px] font-bold rounded-lg shadow-lg disabled:opacity-50"
          >
            <Activity size={12} className="animate-pulse" />
            URUCHOM POTOK TESTOWY
          </button>
        </div>
      </div>

      {/* Top Telemetry Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-neutral-950 border border-neutral-850 rounded-xl p-4 flex flex-col justify-between">
          <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">Aktualny Stan Maszyny</span>
          <div>
            <div className="text-lg font-bold text-white font-mono flex items-center gap-2 mt-1">
              <span className={`w-2.5 h-2.5 rounded-full ${
                currentMachineState === "READY" ? "bg-neutral-700" :
                currentMachineState === "COMPLETED" ? "bg-emerald-500" :
                currentMachineState === "ERROR" ? "bg-red-500" : "bg-indigo-500 animate-ping"
              }`} />
              {currentMachineState}
            </div>
            <p className="text-[10px] text-neutral-400 mt-1">
              Zgodność ze schematami stanów stanowych XState.
            </p>
          </div>
        </div>

        <div className="bg-neutral-950 border border-neutral-850 rounded-xl p-4 flex flex-col justify-between">
          <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">Metryka Przetwarzania</span>
          <div>
            <div className="text-2xl font-bold text-white font-mono mt-1">
              {totalProcessed} <span className="text-xs text-neutral-500 font-sans">leadów</span>
            </div>
            <p className="text-[10px] text-neutral-400 mt-1">
              Liczba rekordów przepuszczonych przez filtry i moduły.
            </p>
          </div>
        </div>

        <div className="bg-neutral-950 border border-neutral-850 rounded-xl p-4 flex flex-col justify-between">
          <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">Rekordy Kwalifikowane (CRM)</span>
          <div>
            <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">
              {totalConverted} <span className="text-xs text-neutral-500 font-sans">rekordów</span>
            </div>
            <p className="text-[10px] text-neutral-400 mt-1">
              Generowanie szans uwieńczone sukcesem operacyjnym.
            </p>
          </div>
        </div>

        <div className="bg-neutral-950 border border-neutral-850 rounded-xl p-4 flex flex-col justify-between">
          <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">Ostatnia Transakcja</span>
          <div>
            <div className="text-lg font-bold text-white font-mono mt-1">
              {lastExecutionTime} <span className="text-xs text-neutral-500 font-sans">UTC</span>
            </div>
            <p className="text-[10px] text-neutral-400 mt-1">
              Czas ostatniego zakończonego kompletnego przebiegu pętli.
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Settings (Left) vs Interactive Visual Wireframe Board (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT COLUMN - Settings & Parameter Configurations (4 columns) */}
        <div className="lg:col-span-4 bg-black/20 border border-neutral-850 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sliders size={16} className="text-indigo-400" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-300">Konfiguracja Integracji Modułów</span>
            </div>

            <div className="space-y-4">
              {/* Option 1: Scraper Target */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">1. Grupa docelowa (Scraper leads)</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={leadTarget}
                    onChange={(e) => {
                      setLeadTarget(e.target.value);
                      addInternalLog("CONFIG_CHANGED", `Zmieniono parametry szukania leadów na: ${e.target.value}`);
                    }}
                    className="flex-1 bg-neutral-950 border border-neutral-800 focus:border-indigo-500/50 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none"
                    placeholder="np. Dyrektorzy IT, Lokalne Restauracje Warszawa"
                  />
                  <button
                    onClick={handleGenerateAISuggestions}
                    disabled={isGeneratingConfig || !leadTarget}
                    type="button"
                    className="px-3 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/35 hover:border-indigo-500/60 rounded-lg flex items-center justify-center transition-all"
                    title="Wygeneruj optymalną strategię i powiąż moduły przy pomocy Omega AI PRO+"
                  >
                    {isGeneratingConfig ? (
                      <RefreshCw size={13} className="animate-spin" />
                    ) : (
                      <Sparkles size={13} />
                    )}
                  </button>
                </div>
              </div>

              {/* Option 2: AI Classifier Precision */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">2. Omega AI Filtrowanie & Walidacja</label>
                <select 
                  value={aiFilterStrength}
                  onChange={(e) => {
                    setAiFilterStrength(e.target.value);
                    addInternalLog("CONFIG_CHANGED", `Ustawiono poziom inteligencji AI na: ${e.target.value}`);
                  }}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-indigo-500/50 rounded-lg px-2 py-2 text-xs text-neutral-200 focus:outline-none"
                >
                  <option value="Wysokie (tylko merytoryczne)">Rygorystyczny filtr spamu i brak kontaktu</option>
                  <option value="Standardowe">Zbalansowany algorytm (Dowolna zgodność)</option>
                  <option value="Agresywne (Wszystkie znalezione)">Brak segregacji (Zapisz wszystko)</option>
                </select>
              </div>

              {/* Option 3: Gmail Outreach Template */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">3. Wybrany Szablon Outreach Gmail</label>
                <select 
                  value={gmailTemplate}
                  onChange={(e) => {
                    setGmailTemplate(e.target.value);
                    addInternalLog("CONFIG_CHANGED", `Zmieniono szablon wiadomości Gmail na: ${e.target.value}`);
                  }}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-indigo-500/50 rounded-lg px-2 py-2 text-xs text-neutral-200 focus:outline-none"
                >
                  <option value="Spersonalizowana oferta VSL">Outreach cold mail z osadzonym wideo VSL</option>
                  <option value="Krótka zajawka integracji">Szybki follow-up z zapytaniem o proces</option>
                  <option value="Darmowy audyt systemowy">Darmowy raport diagnostyczny bazy danych</option>
                </select>
              </div>

              {/* Option 4: CRM Pipeline Destination Stage */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">4. Docelowy Etap Szansy w CRM</label>
                <select 
                  value={crmDealStage}
                  onChange={(e) => {
                    setCrmDealStage(e.target.value);
                    addInternalLog("CONFIG_CHANGED", `Zmieniono domyślny etap transakcji CRM na: ${e.target.value}`);
                  }}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-indigo-500/50 rounded-lg px-2 py-2 text-xs text-neutral-200 focus:outline-none"
                >
                  <option value="Leads (Kwalifikowanie)">Etap 1: Wygenerowany Lead (Kwalifikacja)</option>
                  <option value="Umówione spotkanie">Etap 2: Prezentacja oferty (Zrobione)</option>
                  <option value="Podpisana umowa">Etap 3: Zamknięty Sukces (Wygrany)</option>
                </select>
              </div>

              {/* Dynamic Omega AI PRO+ Optimization Strategy Output */}
              {optResult && (
                <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-lg space-y-2 mt-4 animate-fade-in text-[11px]">
                  <div className="flex items-center gap-1.5 text-indigo-400 font-bold uppercase tracking-wider font-mono">
                    <Sparkles size={11} className="animate-pulse" />
                    Strategia Orkiestracji Omega PRO+
                  </div>
                  
                  <div className="space-y-1.5 font-sans text-neutral-300">
                    <div>
                      <span className="text-neutral-500 uppercase font-mono text-[8px] block">Zoptymalizowane słowa kluczowe:</span>
                      <code className="text-[10px] text-white font-mono bg-neutral-950/60 p-0.5 px-1.5 rounded block truncate">{optResult.scraperKeywords}</code>
                    </div>
                    <div>
                      <span className="text-neutral-500 uppercase font-mono text-[8px] block">Dopasowany temat:</span>
                      <span className="text-neutral-200 block italic">"{optResult.emailSubject}"</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 uppercase font-mono text-[8px] block">Zalecana treść (Draft):</span>
                      <p className="text-[10px] text-neutral-400 line-clamp-2 bg-neutral-950/40 p-1 rounded font-mono leading-relaxed">{optResult.emailPayloadSnippet}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-indigo-500/10">
                      <div>
                        <span className="text-neutral-500 uppercase font-mono text-[8px] block">Estym. Konwersja:</span>
                        <span className="text-emerald-400 font-bold font-mono text-xs">+{optResult.predictedConversion}%</span>
                      </div>
                      <div>
                        <span className="text-neutral-500 uppercase font-mono text-[8px] block">Zalecany etap CRM:</span>
                        <span className="text-indigo-400 font-bold truncate block">{optResult.crmDealStageOption}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Toggle auto re-trigger loop */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wide">Pętla Autonomiczna (Auto Re-run)</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={autoReTrigger}
                    onChange={(e) => {
                      setAutoReTrigger(e.target.checked);
                      addInternalLog("CONFIG_CHANGED", `Pętla ciągła ustawiona na: ${e.target.checked}`);
                      if (e.target.checked) toast.success("Automatyczne ponowne wyzwalanie aktywowane!");
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-neutral-400 after:border-gray-500 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white" />
                </label>
              </div>

              {/* Simulation Speed */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-neutral-400 uppercase">Czas przeskoku automatu:</span>
                  <span className="text-[10px] font-mono text-indigo-400 font-bold">{simulationSpeed / 1000}s/rok</span>
                </div>
                <input 
                  type="range" 
                  min="1500" 
                  max="6000" 
                  step="500"
                  value={simulationSpeed} 
                  onChange={(e) => setSimulationSpeed(Number(e.target.value))}
                  className="w-full accent-indigo-500 h-1 bg-neutral-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-850 mt-5 space-y-1 text-[10px] text-right font-mono text-neutral-500">
            <div>Silnik decyzyjny: <strong className="text-neutral-300">XState State-Machine Mock</strong></div>
            <div>Połączenia i dystrybucja: <strong className="text-neutral-300">Aktywne</strong></div>
          </div>
        </div>

        {/* RIGHT COLUMN - Interactive Visual Flow Diagram using SVGs (8 columns) */}
        <div className="lg:col-span-8 bg-black/20 border border-neutral-850 rounded-xl p-5 flex flex-col justify-between min-h-[420px] relative">
          
          <div className="flex items-center justify-between mb-4 border-b border-neutral-850/60 pb-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Wizualizacja Węzłów Systemowych Grafu i Stanów Kontrolera
            </span>
            <div className="text-[10px] bg-neutral-950 border border-neutral-850 p-1 px-2.5 rounded text-neutral-400 font-mono">
              XState Active State: <strong className="text-emerald-400">{currentMachineState}</strong>
            </div>
          </div>

          {/* Interactive Graph Box (Relative SVG container canvas) */}
          <div className="relative border border-neutral-850/50 bg-neutral-950/40 rounded-xl flex-1 min-h-[290px] overflow-hidden">
            
            {/* Animated Grid lines backdrops */}
            <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />

            {/* SVG Wires (Line connections) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
              {connections.map((conn, idx) => {
                const source = nodes.find(n => n.id === conn.from);
                const target = nodes.find(n => n.id === conn.to);

                if (!source || !target) return null;

                // Simple calculated path curves with middle control point offsets
                const x1 = source.position.x + 110; // offset node-box mid right
                const y1 = source.position.y + 40;
                const x2 = target.position.x;
                const y2 = target.position.y + 40;

                // Draw a beautiful curved bezier connector from node to node
                const controlX = x1 + (x2 - x1) / 2;
                const d = `M ${x1} ${y1} C ${controlX} ${y1}, ${controlX} ${y2}, ${x2} ${y2}`;

                return (
                  <g key={idx}>
                    {/* Background thicker connection line representing inactive path */}
                    <path
                      d={d}
                      fill="none"
                      stroke={conn.isActive ? "rgba(99, 102, 241, 0.45)" : "#222"}
                      strokeWidth={conn.isActive ? 3 : 1.5}
                      className="transition-all duration-300"
                    />
                    
                    {/* Active pulsing data line packet representation */}
                    {conn.isActive && (
                      <path
                        d={d}
                        fill="none"
                        stroke="#818cf8"
                        strokeWidth={2}
                        strokeDasharray="6, 6"
                        className="animate-[dash_1.5s_linear_infinite]"
                      />
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Node cards overlay */}
            <div className="absolute inset-0 flex flex-wrap items-center justify-around z-10 p-4 gap-4 h-full">
              {nodes.map((node, index) => {
                const NodeIcon = node.icon;
                const isCurrentExecuting = activeStep === index;
                const isCompleted = node.status === "succeeded";
                
                return (
                  <div
                    key={node.id}
                    className={`w-[220px] bg-neutral-900 border ${
                      isCurrentExecuting 
                        ? "border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.25)] scale-105" 
                        : isCompleted
                        ? "border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                        : "border-neutral-800"
                    } p-3.5 rounded-lg transition-all duration-300 flex flex-col relative`}
                  >
                    {/* Step number badge */}
                    <span className="absolute -top-2.5 -left-1.5 p-0.5 px-2 bg-neutral-950 border border-neutral-800 text-neutral-500 rounded text-[9px] font-mono">
                      FAZA 0{index + 1}
                    </span>

                    {/* Node status indicators */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <div className={`p-1.5 rounded ${
                          isCurrentExecuting ? "bg-indigo-500/10 text-indigo-400" : "bg-neutral-950 text-neutral-400"
                        }`}>
                          <NodeIcon size={14} className={isCurrentExecuting ? "animate-bounce" : ""} />
                        </div>
                        <span className="text-[11px] font-bold text-white font-mono">{node.name}</span>
                      </div>
                      
                      <span className={`w-2 h-2 rounded-full ${
                        isCurrentExecuting ? "bg-indigo-400 animate-pulse" :
                        isCompleted ? "bg-emerald-500" : "bg-neutral-800"
                      }`} />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-neutral-400">{node.label}</span>
                      <p className="text-[10px] text-neutral-500 leading-normal line-clamp-2">{node.description}</p>
                    </div>

                    {/* Integrated dynamic context values */}
                    <div className="mt-2.5 pt-2 border-t border-neutral-850 text-[9px] font-mono text-neutral-400 flex items-center justify-between bg-neutral-950/40 p-1 px-1.5 rounded">
                      <span className="text-neutral-500 uppercase">WIĄZANIE:</span>
                      <span className="text-white truncate max-w-[120px]">
                        {node.module === "scraper" && leadTarget}
                        {node.module === "ai" && aiFilterStrength}
                        {node.module === "gmail" && gmailTemplate}
                        {node.module === "crm" && crmDealStage}
                      </span>
                    </div>

                    {/* Direct execution simulation interface on each card */}
                    <div className="mt-2.5 flex gap-1.5">
                      <button
                        onClick={() => triggerStepDirectly(index)}
                        className="w-full text-center p-1 bg-neutral-950 hover:bg-neutral-800 border border-neutral-850 hover:border-neutral-700 rounded text-[9px] font-mono text-neutral-400 hover:text-white transition-colors"
                      >
                        URUCHOM TEN KROK
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Trigger Audit Trail Logs panel */}
          <div className="mt-4 p-3 bg-neutral-950 border border-neutral-850 rounded-lg flex items-center justify-between text-[11px] text-neutral-400 font-mono">
            <div className="flex items-center gap-2">
              <span className="p-1 px-2 bg-neutral-900 border border-neutral-800 rounded font-bold uppercase tracking-wider text-[8px] text-indigo-400">
                Automat Stanowy XState
              </span>
              <span>
                {currentMachineState === "READY" && "Maszyna czeka bezczynna. Kliknij autopilot, aby rozpocząć pętlę."}
                {currentMachineState === "SCRAPING_LEADS" && `[FAZA 1] Przebieganie zintegrowanego skrapingu CRM leadów dlas: ${leadTarget}`}
                {currentMachineState === "AI_ENRICHMENT" && "[FAZA 2] Analizowanie i personalizowanie maili silnikiem Omega AI..."}
                {currentMachineState === "GMAIL_OUTREACH" && `[FAZA 3] Kolejkowanie wysyłki pakietu mailowego z szablonu: ${gmailTemplate}`}
                {currentMachineState === "CRM_PIPELINE" && `[FAZA 4] Synchronizowanie leadów w bazie na poziomie dealstage...`}
                {currentMachineState === "COMPLETED" && "Wszystkie systemy zsynchronizowane. Pomyślnie zmapowano rekordy w bazie Firebase!"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-neutral-500">Prędkość:</span>
              <span className="text-indigo-400 font-bold font-mono">{simulationSpeed / 1000}s</span>
            </div>
          </div>

        </div>

      </div>

      {/* Pętla Feedbacku AI Section */}
      <div className="mt-8 pt-8 border-t border-neutral-800 space-y-6" id="ai-feedback-loop-section">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="p-1 px-2.5 bg-indigo-500/10 text-indigo-400 rounded-md text-[10px] font-mono uppercase tracking-wider font-bold flex items-center gap-1.5 animate-pulse">
                <Brain size={11} />
                Live operational feedback telemetry
              </span>
              <span className="p-1 px-2 bg-emerald-500/10 text-emerald-400 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider">
                PRO+ AUTOPILOT ACTIVE
              </span>
            </div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Pętla Feedbacku AI (Real-time AI Feedback Loop)
            </h3>
            <p className="text-xs text-neutral-400 max-w-4xl leading-relaxed">
              Dedykowany podsystem diagnostyczny Omega AI PRO+ dla każdego modułu. Zbierane w czasie rzeczywistym logi operacyjne, wskaźniki błędu oraz przestoje w integracjach są analizowane z użyciem modelu <code className="text-indigo-400 font-mono px-1 bg-neutral-950 rounded">gemini-1.5-pro</code> w trybie głębokiego wnioskowania (Thinking Mode – HIGH), sugerując natychmiastowe optymalizacje parametrów systemowych w celu podniesienia konwersji pętli.
            </p>
          </div>
          
          <button
            onClick={() => {
              runFeedbackAnalysis("scraper");
              runFeedbackAnalysis("ai");
              runFeedbackAnalysis("gmail");
              runFeedbackAnalysis("crm");
              toast.info("Uruchomiono masową optymalizację wszystkich modułów jednocześnie...");
            }}
            className="flex items-center gap-2 py-2 px-4 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 rounded-lg text-xs font-mono font-bold transition-all shrink-0"
          >
            <RefreshCw size={13} className="animate-spin" />
            SYNCHRONIZUJ I ZBADAJ WSZYSTKO
          </button>
        </div>

        {/* Modules Feedback Loop Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              id: "scraper" as const,
              name: "Lead Scraper (Faza 01)",
              icon: Search,
              metricLabel: "Stopa odrzucenia (Bounce)",
              metricValue: "18.2% pustych domen",
              tarcie: "Niska precyzja witryn Google Maps",
              currentSetting: leadTarget,
              label: "Przeszukiwana grupa docelowa"
            },
            {
              id: "ai" as const,
              name: "Omega AI Guard (Faza 02)",
              icon: Sparkles,
              metricLabel: "Fałszywe negatywy (False-), odrzucenia",
              metricValue: "22% wartościowych firm",
              tarcie: "Zbyt agresywne kryteria kategoryzacji",
              currentSetting: aiFilterStrength,
              label: "Poziom rygoru walidacji"
            },
            {
              id: "gmail" as const,
              name: "Gmail Outreach Engine (Faza 03)",
              icon: Mail,
              metricLabel: "CTR / Procent odpowiedzi",
              metricValue: "4.1% CTR / 22% odpowiedzi",
              tarcie: "Ciężkie linki VSL ucinane przez Gmail",
              currentSetting: gmailTemplate,
              label: "Aktywny szablon wysyłki"
            },
            {
              id: "crm" as const,
              name: "CRM Pipeline Sync (Faza 04)",
              icon: Database,
              metricLabel: "Średnie opóźnienie zapisu / follow-upu",
              metricValue: "34 godziny przestoju",
              tarcie: "Ręczny, wieloetapowy lejek kwalifikacyjny",
              currentSetting: crmDealStage,
              label: "Ustawiony etap potoku"
            }
          ].map((mod) => {
            const ModIcon = mod.icon;
            const res = feedbackData[mod.id];
            const isAnalyzing = isAnalyzingFeedback[mod.id];

            return (
              <div 
                key={mod.id} 
                className={`bg-neutral-950/60 border ${
                  res ? "border-indigo-500/45 shadow-[0_0_20px_rgba(99,102,241,0.08)] bg-indigo-950/10" : "border-neutral-850"
                } rounded-xl p-5 space-y-4 flex flex-col justify-between transition-all`}
              >
                {/* Mod Header */}
                <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-neutral-900 border border-neutral-800 rounded-lg text-indigo-400">
                      <ModIcon size={15} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider">{mod.name}</h4>
                      <p className="text-[10px] text-neutral-500 mt-0.5">{mod.label}: <span className="text-neutral-300 italic">"{mod.currentSetting}"</span></p>
                    </div>
                  </div>

                  <span className={`flex h-2 w-2 rounded-full ${isAnalyzing ? "bg-amber-400 animate-pulse" : res ? "bg-emerald-400" : "bg-neutral-700"}`} />
                </div>

                {/* Simulated Real-Time Metric Telemetry */}
                <div className="grid grid-cols-2 gap-3 bg-neutral-900/30 p-2.5 rounded-lg border border-neutral-900 text-[11px] font-mono">
                  <div>
                    <span className="text-neutral-500 uppercase text-[8px] block tracking-wide">Kluczowe tarcie:</span>
                    <span className="text-rose-400 font-bold truncate block mt-0.5" title={mod.tarcie}>{mod.tarcie}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 uppercase text-[8px] block tracking-wide">{mod.metricLabel}:</span>
                    <span className="text-indigo-300 font-bold block mt-0.5">{mod.metricValue}</span>
                  </div>
                </div>

                {/* AI Suggestions / Output Box */}
                <div className="flex-1 flex flex-col justify-center min-h-[140px]">
                  {isAnalyzing ? (
                    <div className="flex flex-col items-center justify-center space-y-3 py-6 text-center">
                      <RefreshCw size={24} className="animate-spin text-indigo-500" />
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-white font-mono">ROZUMOWANIE OMEGA AI...</p>
                        <p className="text-[10px] text-neutral-500 max-w-[280px]">Tryb Myślenia: <strong className="text-indigo-400 font-mono">ThinkingLevel.HIGH</strong>. Analizowanie korelacji i symulacja optymalnych stanów układu...</p>
                      </div>
                    </div>
                  ) : res ? (
                    <div className="space-y-3 text-[11px] text-neutral-300">
                      {/* Deep Thinking Mode Output */}
                      <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-850/65 font-mono space-y-1.5 text-[10px] shadow-inner">
                        <div className="flex items-center justify-between text-neutral-500 text-[8px] uppercase font-bold border-b border-neutral-900 pb-1">
                          <span className="flex items-center gap-1">
                            <Terminal size={9} className="text-indigo-400 animate-pulse" />
                            ROZUMOWANIE AI (Thinking Process)
                          </span>
                          <span className="text-emerald-400">STATUS: HIGH_THINKING</span>
                        </div>
                        <p className="text-neutral-400 leading-relaxed italic bg-emerald-950/5 p-1.5 rounded border border-emerald-950/10 text-[9px] font-sans">
                          {res.thinkingProcess}
                        </p>
                      </div>

                      {/* Diagnostic Outputs */}
                      <div className="space-y-1 bg-indigo-950/20 p-2.5 rounded-lg border border-indigo-500/10 leading-normal">
                        <div>
                          <strong className="text-indigo-400 uppercase font-mono text-[9px] block">Wykryty zator:</strong>
                          <span className="text-neutral-250 mt-0.5 block">{res.identifiedIssue}</span>
                        </div>
                        <div className="mt-2 text-[10px]">
                          <strong className="text-emerald-400 uppercase font-mono text-[9px] block">Zalecana optymalizacja:</strong>
                          <span className="text-neutral-100 block italic">"{res.recommendedAction}"</span>
                        </div>
                      </div>

                      {/* Parameter update representation */}
                      {res.parameterUpdates && Object.keys(res.parameterUpdates).length > 0 && (
                        <div className="flex items-center justify-between bg-neutral-900 p-2 rounded border border-neutral-850 text-[10px]">
                          <span className="text-neutral-500 uppercase font-mono text-[8px]">Modyfikacja na żądanie:</span>
                          <span className="bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/20 font-bold truncate max-w-[190px]">
                            {Object.entries(res.parameterUpdates).map(([k, v]) => `${k} ➜ ${v}`).join(", ")}
                          </span>
                        </div>
                      )}

                      {/* Confidence and applying states */}
                      <div className="flex items-center justify-between text-[10px] pt-1 border-t border-neutral-900">
                        <span className="text-neutral-500 uppercase font-mono text-[8px]">Poziom pewności algorytmu:</span>
                        <span className="text-emerald-400 font-bold font-mono">+{res.confidence}% Pewności</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-6 border border-dashed border-neutral-850 rounded-xl bg-neutral-900/10 text-center text-neutral-500 text-[11px] leading-relaxed">
                      <Brain size={20} className="text-neutral-700 mb-2 animate-pulse" />
                      <p>Brak zapytania diagnostycznego dla tego modułu.</p>
                      <p className="text-[9px] text-neutral-600 mt-1">Uruchom proces automatycznej analizy, aby zaangażować autonomiczną pętlę feedbacku i system autokorekty.</p>
                    </div>
                  )}
                </div>

                {/* Primary CTA Buttons */}
                <div className="space-y-2 pt-3 border-t border-neutral-900">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => runFeedbackAnalysis(mod.id)}
                      disabled={isAnalyzing}
                      type="button"
                      className="w-full text-center p-2 bg-neutral-900 hover:bg-neutral-850 text-neutral-300 hover:text-white border border-neutral-850 rounded-lg text-[10px] font-mono font-bold transition-all disabled:opacity-50"
                    >
                      {res ? "ZBADAJ PONOWNIE" : "URUCHOM DIAGNOSTYKĘ"}
                    </button>

                    <button
                      onClick={() => applyFeedbackOptimization(mod.id)}
                      disabled={isAnalyzing || !res}
                      type="button"
                      className={`w-full text-center p-2 text-[10px] font-mono font-bold rounded-lg border transition-all ${
                        res 
                          ? "bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500/50 shadow-md shadow-indigo-600/10 animate-pulse" 
                          : "bg-neutral-950 text-neutral-600 border-neutral-900 cursor-not-allowed"
                      }`}
                    >
                      WDROŻYJ OPTYMALIZACJĘ
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Style for line connector stream matching dasharray */}
      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -20;
          }
        }
      `}</style>
    </div>
  );
}
