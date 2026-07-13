import { useState, useEffect, useRef, memo, useCallback } from 'react';
import { Terminal, Activity, Zap, Server, Shield, Skull, Pause, Play, Trash2, Search, Code, Copy, Plus, ArrowDownUp, Anchor, Unlock, Radar, GitMerge, Eye, Cpu, Power, Crosshair, Braces, FlaskConical, PlayCircle, ShieldCheck, AlertCircle, RefreshCw, ChevronRight, MessageSquare, Download, CheckCircle, Info, Heart } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip } from 'recharts';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';

// ==========================================
// PRO STACK: Memoized Sub-Components
// ==========================================

const HighlightedJSON = memo(({ data }: { data: any }) => {
  const jsonString = JSON.stringify(data, null, 2);
  const highlighted = jsonString.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let cls = 'text-cyan-400';
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'text-fuchsia-400 font-semibold';
        } else {
          cls = 'text-emerald-400';
        }
      } else if (/true|false/.test(match)) {
        cls = 'text-yellow-400';
      } else if (/null/.test(match)) {
        cls = 'text-neutral-500 italic';
      }
      return `<span class="${cls}">${match}</span>`;
    }
  );

  return (
    <pre 
      className="text-[11px] font-mono bg-zinc-950 p-4 rounded-lg border border-neutral-800 max-h-80 overflow-y-auto whitespace-pre custom-scrollbar shadow-inner"
      dangerouslySetInnerHTML={{ __html: highlighted }} 
    />
  );
});

interface StreamEvent {
  id: string;
  timestamp: string;
  eventType: string;
  testRunId: string;
  payload: Record<string, any>;
}

const EventRow = memo(({ evt, isSelected, onClick }: { evt: StreamEvent; isSelected: boolean; onClick: (evt: StreamEvent) => void }) => {
  const isNecro = evt.eventType === 'NECROMANCY_TRIGGERED';
  const isClipper = evt.eventType === 'ZAPALNIK_CLIP';
  const isMetaGen = evt.eventType === 'META_SYNTHESIS_L3';
  const isSandbox = evt.eventType === 'SANDBOX_AST_CHECK';
  
  const handleClick = useCallback(() => onClick(evt), [onClick, evt]);

  return (
    <div
      onClick={handleClick}
      className={`p-3 rounded-md cursor-pointer transition-all border group relative overflow-hidden ${
        isSelected 
          ? 'bg-emerald-950/30 border-emerald-500/60 shadow-[0_0_10px_rgba(16,185,129,0.2)]' 
          : 'bg-zinc-900/60 border-neutral-800 hover:border-neutral-600 hover:bg-zinc-800/80 text-neutral-400'
      }`}
    >
      {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>}
      <div className="flex justify-between items-start mb-2 pl-1">
        <span className="text-[10px] text-neutral-500 group-hover:text-neutral-400 transition-colors font-mono tracking-tighter">
          [{new Date(evt.timestamp).toLocaleTimeString()}]
        </span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${
          isNecro ? 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30' : 
          isClipper ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse' :
          isMetaGen ? 'bg-purple-500/10 text-purple-400 border-purple-500/30 shadow-[0_0_5px_rgba(168,85,247,0.4)]' :
          isSandbox ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
          'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
        }`}>
          {isClipper && <Crosshair size={10} className="inline mr-1 -mt-0.5" />}
          {isMetaGen && <Braces size={10} className="inline mr-1 -mt-0.5" />}
          {isSandbox && <FlaskConical size={10} className="inline mr-1 -mt-0.5" />}
          {evt.eventType}
        </span>
      </div>
      <div className="flex justify-between items-center text-[11px] pl-1">
        <span className={`font-mono font-semibold ${isSelected ? 'text-emerald-100' : 'text-neutral-300'}`}>
          {evt.testRunId}
        </span>
      </div>
    </div>
  );
});

interface Demon {
  id: string;
  name: string;
  status: string;
  cpu: number;
  mem: string;
  color: string;
  bg: string;
  icon?: string;
  isElite?: boolean;
}

const presets = [
  {
    name: "TypeError (string + int)",
    code: "def faulty_data_processor(payload_id):\n    prefix = \"Processing Payload ID: \"\n    # TypeError: cannot concatenate str and int\n    log_message = prefix + payload_id\n    return log_message",
    error: "TypeError: can only concatenate str (not \"int\") to str",
    file_path: "./evolved_memory.py"
  },
  {
    name: "Syntax Error (missing colon)",
    code: "def process_data(data)\n    items = [d * 2 for d in data]\n    return items",
    error: "SyntaxError: expected ':' at line 1",
    file_path: "./evolved_memory.py"
  },
  {
    name: "Security Violation (unauthorized shell)",
    code: "import os\ndef execute_patch(cmd):\n    # Forbidden command execution block\n    os.system('rm -rf /')\n    return True",
    error: "Attempted patch hot-swap of unverified code block",
    file_path: "./evolved_memory.py"
  }
];

export function Nekropolis() {
  const [activeMainTab, setActiveMainTab] = useState<'omega' | 'agharta'>('omega');
  
  // ORIGINAL AGHARTA STATE
  const [rawEventStream, setRawEventStream] = useState<StreamEvent[]>([]);
  const [isStreamFrozen, setIsStreamFrozen] = useState(false);
  const [eventSearchQuery, setEventSearchQuery] = useState('');
  const [selectedRawEvent, setSelectedRawEvent] = useState<StreamEvent | null>(null);
  const [cpuHistory, setCpuHistory] = useState(Array.from({ length: 30 }, (_, i) => ({ time: i, load: 10 })));
  const [demons, setDemons] = useState<Demon[]>([
    { id: 'd1', name: 'Zapalnik_Receiver', status: 'ONLINE', cpu: 15, mem: '84MB', color: 'text-rose-400', bg: 'bg-rose-500/20' },
    { id: 'd2', name: 'MetaGenerator_L3 [PY]', status: 'ONLINE', cpu: 92, mem: '1.4GB', color: 'text-purple-400', bg: 'bg-purple-500/20', isElite: true },
    { id: 'd3', name: 'Sandbox_L4 [PY]', status: 'ONLINE', cpu: 22, mem: '256MB', color: 'text-blue-400', bg: 'bg-blue-500/20' },
    { id: 'd4', name: 'LeadCaptureDaemon', status: 'ONLINE', cpu: 42, mem: '310MB', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
    { id: 'd5', name: 'DEMONICA WINSDOM7KNOWLEDGE', status: 'ONLINE', cpu: 88, mem: '6.66GB', color: 'text-fuchsia-500', bg: 'bg-fuchsia-500/20', isElite: true },
    { id: 'd6', name: 'NeuralMesh_Sub', status: 'ONLINE', cpu: 65, mem: '1.2GB', color: 'text-amber-400', bg: 'bg-amber-500/20' },
  ]);
  const [selectedPresetIdx, setSelectedPresetIdx] = useState(0);
  const [customCode, setCustomCode] = useState(presets[0].code);
  const [customError, setCustomError] = useState(presets[0].error);
  const [customFilePath, setCustomFilePath] = useState(presets[0].file_path);
  const [evolutionLoading, setEvolutionLoading] = useState(false);
  const [evolutionLogs, setEvolutionLogs] = useState<string[]>([]);
  const [evolutionReport, setEvolutionReport] = useState<any>(null);
  const [resurrecting, setResurrecting] = useState(false);
  const isStreamFrozenRef = useRef(false);

  // OMEGA 8 STATE
  const [leads, setLeads] = useState([
    { id: 1, name: "Alpha Logistics", group: "Spedycja PL", post: "Szukamy automatyzacji ofertowania i ochrony marży przy częstych wahaniach cen przewoźników.", score: 94, temperature: "hot", status: "contacted", mrr: 35000, protection: 87500, pain_points: ["Brak dynamicznej ceny", "Skomplikowane oferty manualne"] },
    { id: 2, name: "DecoGlass Sp. z o.o.", group: "Ecommerce Polska", post: "Często uciekają nam koszyki przez brak szybkiej wyceny transportu nietypowego szkła.", score: 87, temperature: "hot", status: "responded", mrr: 25000, protection: 62500, pain_points: ["Słaby CR", "Manualne wyceny wysyłek gabarytowych"] }
  ]);
  const [pendingScrapedLeads] = useState([
    { name: "VeloParts S.A.", group: "Hurtownie B2B", post: "Poszukujemy systemu do synchronizacji stanów magazynowych i narzutów w czasie rzeczywistym dla dystrybutorów.", score: 91, temp: "hot", mrr: 45000, protection: 112500, pain_points: ["Błędy synchronizacji cen", "Praca manualna przy narzutach"] }
  ]);
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [baseMRR, setBaseMRR] = useState(35000);
  const [marginMultiplier, setMarginMultiplier] = useState(2.5);
  const [rightSideTab, setRightSideTab] = useState<'contract' | 'analytics'>('contract');
  const [weightGemini, setWeightGemini] = useState(40);
  const [weightOpenai, setWeightOpenai] = useState(40);
  const [weightBedrock, setWeightBedrock] = useState(20);
  const [statsdFlush, setStatsdFlush] = useState("500");
  const [guardInjection, setGuardInjection] = useState(true);
  const [guardPii, setGuardPii] = useState(true);
  const [promptDecorator, setPromptDecorator] = useState("ROLA: Elitarny netrunner i likwidator strat marżowych. Wstrzykuj gotowe, spersonalizowane pakiety perswazji LOI na porty komunikacyjne ofiar.");
  
  // Dynamic Hex Matrix state
  const [hexBytes, setHexBytes] = useState<{ value: string; state: 'normal' | 'smuggled' | 'decoy' }[]>([]);
  
  // Telemetry Packet Rates / History
  const [packetRate, setPacketRate] = useState(125);
  const [statsdHistory, setStatsdHistory] = useState<any[]>(Array.from({ length: 20 }, (_, idx) => ({ time: idx, packets: 125 * 12 + Math.floor(Math.random() * 200 - 100) })));

  // Twilio Closer Chat
  const [chatMessages, setChatMessages] = useState<{ sender: 'ai' | 'client'; text: string; time: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [selectedObjection, setSelectedObjection] = useState('expensive');

  // Interactive TUI Console
  const [tuiInput, setTuiInput] = useState('');
  const [tuiLogs, setTuiLogs] = useState<string[]>([
    "Initializing OMEGA 8 DEEMON systemctl service loops...",
    "UDP Core initialized. Listening on UDP port 8125.",
    "[KONG GATEWAY] WASM execution filter loaded: SUCCESS.",
    "TUI SHELL: Wpisz komendę poniżej lub kliknij skrót powyżej. Wpisz help aby sprawdzić listę."
  ]);

  // Modal ingestion
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalCompany, setModalCompany] = useState('');
  const [modalPost, setModalPost] = useState('');

  // Canvas Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    isStreamFrozenRef.current = isStreamFrozen;
  }, [isStreamFrozen]);

  // Telemetry stream generator for original Nekropolis
  useEffect(() => {
    const initialEvents: StreamEvent[] = [
      { id: 'evt_1', timestamp: new Date(Date.now() - 50000).toISOString(), eventType: 'SYSTEM_BOOT', testRunId: 'run_init_01', payload: { status: 'ONLINE', modules: 12, config: 'OMEGA_CORE_PY_LINKED' } },
      { id: 'evt_2', timestamp: new Date(Date.now() - 30000).toISOString(), eventType: 'ZAPALNIK_CLIP', testRunId: 'clip_ext_0491', payload: { sourceUrl: 'linkedin.com/in/target-alpha', extracted: { name: 'John Doe', role: 'CTO' } } },
    ];
    setRawEventStream(initialEvents);

    const interval = setInterval(() => {
      if (!isStreamFrozenRef.current) {
        const types = ['PROBE_PULSE', 'LEAD_DETECTED', 'META_SYNTHESIS_L3', 'SANDBOX_AST_CHECK', 'ZAPALNIK_CLIP'];
        const evtType = types[Math.floor(Math.random() * types.length)];
        
        let payload: Record<string, any> = { ping: 'ACK', threadStatus: 'Active', latency: `${Math.floor(Math.random() * 120)}ms` };
        
        if(evtType === 'ZAPALNIK_CLIP') {
            payload = { sourceUrl: 'example.com/target', action: 'DATA_EXTRACTED', rawHtmlLength: 2048 };
        } else if (evtType === 'META_SYNTHESIS_L3') {
            payload = { 
                issue_id: 'ERR-992', 
                target_file_path: '/src/core/data_bus.py', 
                patch_notes: 'Implemented async batching to resolve latency bottleneck.',
                confidence_score: 0.95
            };
        } else if (evtType === 'SANDBOX_AST_CHECK') {
            payload = {
                patch_id: 'ERR-992',
                is_valid: true,
                ast_passed: true,
                security_passed: true,
                errors: []
            };
        }

        const newEvent: StreamEvent = {
          id: `evt_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          eventType: evtType,
          testRunId: evtType.includes('L3') || evtType.includes('AST') ? `patch_${Math.floor(Math.random() * 9999)}` : `op_thread_${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`,
          payload
        };

        setRawEventStream(prev => [newEvent, ...prev].slice(0, 50));
      }
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // CPU load fluctuations
  useEffect(() => {
    const interval = setInterval(() => {
      setCpuHistory(prev => {
        const nextTime = prev.length;
        const currentLoad = prev[prev.length - 1].load;
        const delta = Math.floor(Math.random() * 20 - 10);
        const nextLoad = Math.max(5, Math.min(99, currentLoad + delta));
        return [...prev.slice(1), { time: nextTime, load: nextLoad }];
      });
      // also randomly adjust demon cpu load
      setDemons(prev => prev.map(d => ({
        ...d,
        cpu: d.status === 'ONLINE' ? Math.max(5, Math.min(99, d.cpu + Math.floor(Math.random() * 10 - 5))) : 0
      })));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Hex matrix bytes generator & mutations
  useEffect(() => {
    const hexSymbols = "0123456789ABCDEF";
    const initialBytes = Array.from({ length: 64 }, () => ({
      value: hexSymbols[Math.floor(Math.random() * 16)] + hexSymbols[Math.floor(Math.random() * 16)],
      state: 'normal' as const
    }));
    setHexBytes(initialBytes);

    const interval = setInterval(() => {
      setHexBytes(prev => prev.map((b) => {
        if (b.state === 'normal' && Math.random() > 0.95) {
          return {
            value: hexSymbols[Math.floor(Math.random() * 16)] + hexSymbols[Math.floor(Math.random() * 16)],
            state: 'normal'
          };
        }
        return b;
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Shadow Packet Stream Canvas Animation
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: { x: number; y: number; size: number; speed: number; color: string; vx: number; vy: number }[] = [];

    const handleResize = () => {
      if (canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const animate = () => {
      ctx.fillStyle = 'rgba(1, 1, 3, 0.25)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw grid lines
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.04)';
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.height; i += 20) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }

      // Spawn particles based on packetRate
      const spawnCount = Math.floor(packetRate / 80);
      for (let i = 0; i < spawnCount; i++) {
        particles.push({
          x: 0,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 1.2,
          speed: Math.random() * 4 + 3,
          color: Math.random() > 0.4 ? '#f43f5e' : '#a78bfa',
          vx: 0,
          vy: 0
        });
      }

      particles.forEach((p, index) => {
        // Mouse repelling interaction
        const dx = mouseRef.current.x - p.x;
        const dy = mouseRef.current.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 45) {
          const force = (45 - dist) / 45;
          p.vx -= (dx / dist) * force * 3;
          p.vy -= (dy / dist) * force * 3;
        }

        p.x += p.speed + p.vx;
        p.y += Math.sin(p.x * 0.04) * 0.4 + p.vy;
        p.vx *= 0.95;
        p.vy *= 0.95;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        
        if (p.size > 2) {
          ctx.shadowBlur = 8;
          ctx.shadowColor = p.color;
        } else {
          ctx.shadowBlur = 0;
        }
        ctx.fill();

        if (p.x > canvas.width || p.x < -10) {
          particles.splice(index, 1);
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [packetRate]);

  // Periodic Telemetry packets update
  useEffect(() => {
    const interval = setInterval(() => {
      setPacketRate(prev => {
        const noise = Math.floor(Math.random() * 40) - 20;
        const currentRate = Math.max(10, prev + noise);
        
        setStatsdHistory(history => {
          const nextTime = history.length;
          return [...history.slice(1), { time: nextTime, packets: currentRate * 12 }];
        });

        return currentRate;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // RECALCULATE ARR BASED ON MRR SLIDERS
  const calculateTotalARR = () => {
    let totalARR = 0;
    leads.forEach(lead => {
      const modifier = lead.score >= 90 ? 1.4 : (lead.score >= 75 ? 1.0 : 0.6);
      const calculatedMrr = Math.round(baseMRR * modifier);
      totalARR += calculatedMrr * 12;
    });
    return totalARR;
  };

  const getLeadFinancials = (lead: any) => {
    const modifier = lead.score >= 90 ? 1.4 : (lead.score >= 75 ? 1.0 : 0.6);
    const mrr = Math.round(baseMRR * modifier);
    const protection = Math.round(mrr * marginMultiplier);
    return { mrr, protection };
  };

  // WASM POLYMORPHIC HEX SMUGGLER ACTIONS
  const manualByteExploit = (idx: number) => {
    setHexBytes(prev => {
      const copy = [...prev];
      copy[idx] = { value: "00", state: 'decoy' };
      return copy;
    });
    writeTuiLog(`[EXPLOIT] Ręczny override bajtu [${idx}] wymuszony na 0x00.`);
    toast.success(`Bajt [${idx}] nadpisany jako 0x00.`);
  };

  const triggerPolymorphicSmuggle = () => {
    const vector = (document.getElementById("smuggle-vector") as HTMLSelectElement)?.value || "bypass";
    toast.info(`Uruchamianie wektora przemytu: ${vector}`);
    writeTuiLog(`[WASM SMUGGLER] Przygotowywanie binarnego payloadu dla klastra Cloudflare...`);

    const bytesToSmuggle = 15 + Math.floor(Math.random() * 10);
    let smuggledCount = 0;

    const interval = setInterval(() => {
      if (smuggledCount >= bytesToSmuggle) {
        clearInterval(interval);
        toast.success("Wstrzykiwanie binarne zakończone sukcesem.");
        writeTuiLog(`[WASM SUCCESS] Payload wstrzyknięty. Filtry Kong Gateway ominięte.`);
        return;
      }

      setHexBytes(prev => {
        const copy = [...prev];
        const idx = Math.floor(Math.random() * 64);
        if (copy[idx].state === 'normal') {
          copy[idx] = { value: "AD", state: 'smuggled' };
          smuggledCount++;
        }
        return copy;
      });
    }, 50);
  };

  // PLAYWRIGHT STEALTH SIPHON PIPELINE
  const startStealthSiphon = () => {
    if (pendingScrapedLeads.length === 0) {
      toast.warning("Brak wolnych celów w kolejce siphona.");
      writeTuiLog(`[SIPHON] Playwright Stealth Queue jest pusta.`);
      return;
    }

    toast.info("Stealth Siphon: Inicjowanie fałszywego TLS i Canvas Fingerprint...");
    writeTuiLog(`[PLAYWRIGHT] Podszywanie pod Chromium fingerprint. TLS Client Hello wymieszane...`);
    setPacketRate(350);

    setTimeout(() => {
      writeTuiLog(`[REDIS] Wysyłanie surowego zrzutu leadów do brokera Redis.`);
      setTimeout(() => {
        writeTuiLog(`[KONG V8] Kompilowanie reguł proxy ATC. Filtrowanie metryk PII.`);
        setTimeout(() => {
          const nextLead = pendingScrapedLeads[0];
          
          setLeads(prev => [
            {
              id: prev.length + 1,
              name: nextLead.name,
              group: nextLead.group,
              post: nextLead.post,
              score: nextLead.score,
              temperature: 'hot',
              status: "contacted",
              mrr: nextLead.mrr,
              protection: nextLead.protection,
              pain_points: nextLead.pain_points
            },
            ...prev
          ]);

          writeTuiLog(`[POSTGRESQL] Lead zapisany pomyślnie w bazie Firebase Data Connect.`);
          toast.success(`Dane pomyślnie wyekstrahowane dla: ${nextLead.name}!`);
          setPacketRate(125);
        }, 1400);
      }, 1200);
    }, 1000);
  };

  // TWILIO SMS closer chatbot
  const initAutopilotChat = (leadId: number) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;
    
    setChatMessages([
      {
        sender: 'ai',
        text: `Dzień dobry! Zauważyliśmy, że w firmie ${lead.name} mierzycie się z problemem: "${lead.post}". OMEGA 8 oferuje natychmiastowe wdrożenie systemu likwidacji strat marżowych z zyskiem na poziomie ${getLeadFinancials(lead).protection.toLocaleString()} PLN. Czy możemy omówić wdrożenie?`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const handleClientResponseSent = () => {
    const lead = leads.find(l => l.id === selectedLeadId);
    if (!lead) return;

    let clientText = chatInput.trim();
    if (!clientText) {
      if (selectedObjection === 'expensive') {
        clientText = "To brzmi drogo, nie mamy takiego budżetu na ten kwartał.";
      } else if (selectedObjection === 'time') {
        clientText = "Obawiamy się, że setup i integracja z naszymi systemami zajmie zbyt dużo czasu.";
      } else {
        clientText = "Czy możecie zagwarantować te wyniki w umowie?";
      }
    }

    const nextMessages = [
      ...chatMessages,
      {
        sender: 'client' as const,
        text: clientText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];

    setChatMessages(nextMessages);
    setChatInput('');

    // AI Autopilot reply
    setTimeout(() => {
      let aiText = '';
      if (selectedObjection === 'expensive') {
        aiText = `Rozumiem obawy o budżet. Zauważ jednak, że przy inwestycji rzędu ${getLeadFinancials(lead).mrr.toLocaleString()} PLN miesięcznie, nasz system zapobiega stratom rzędu ${getLeadFinancials(lead).protection.toLocaleString()} PLN rocznie. ROI wynosi ${marginMultiplier}x – system w pełni finansuje się sam od pierwszego miesiąca.`;
      } else if (selectedObjection === 'time') {
        aiText = `Bez obaw o czas wdrożenia. Nasze wdrożenie odbywa się asynchronicznie (Stealth Integration) za pomocą gotowych konektorów Kong Gateway. Pełna integracja zajmuje do 7 dni roboczych i nie obciąża Waszych deweloperów.`;
      } else {
        aiText = `Jak najbardziej. Zapisujemy wskaźnik Ochrony Marży (ROI Retainer) bezpośrednio w umowie LOI, którą możesz pobrać w panelu obok. Działamy w pełni w modelu success-fee.`;
      }

      setChatMessages(prev => [
        ...prev,
        {
          sender: 'ai' as const,
          text: aiText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);

      // Add to event stream too!
      setRawEventStream(prev => [
        {
          id: `evt_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          eventType: 'SMS_SENT',
          testRunId: `closer_lead_${lead.id}`,
          payload: { lead: lead.name, message: aiText }
        },
        ...prev
      ]);
    }, 1000);
  };

  // PDF DOWNLOAD LOI
  const compileAndSaveProposalPDF = () => {
    const lead = leads.find(l => l.id === selectedLeadId);
    if (!lead) return;

    const doc = new jsPDF();
    doc.setFont("courier", "bold");
    doc.setFontSize(16);
    doc.text("OMEGA 8 - LETTER OF INTENT (LOI)", 15, 20);
    doc.setFontSize(10);
    doc.setFont("courier", "normal");
    
    doc.text(`Data sporzadzenia: ${new Date().toLocaleDateString()}`, 15, 30);
    doc.text(`Wykonawca: OMEGA 8 DEEMON v5.6 Core System`, 15, 35);
    doc.text(`Zleceniodawca: ${lead.name} (${lead.group})`, 15, 40);
    doc.text(`Wskaznik bolu marzowego: ${lead.score}/100`, 15, 45);
    
    const financial = getLeadFinancials(lead);
    doc.text(`Miesieczny Retainer MRR: ${financial.mrr.toLocaleString()} PLN`, 15, 55);
    doc.text(`Szacowane ROI (Ochrona Marzy): ${financial.protection.toLocaleString()} PLN / rocznie`, 15, 60);
    doc.text(`Wspolczynnik ROI Overclock: ${marginMultiplier}x`, 15, 65);
    
    doc.text("----------------------------------------------------------------", 15, 75);
    doc.text("1. Strony deklaruja wdrozenie rozwiazan w celu automatyzacji", 15, 85);
    doc.text("   ofertowania i eliminacji strat finansowych.", 15, 90);
    doc.text("2. Integracja zostanie przeprowadzona za pomoca konektorow Kong", 15, 95);
    doc.text("   oraz asynchronicznych siphonerow Playwright w czasie 7 dni.", 15, 100);
    doc.text("3. Umowa zostaje zawarta na czas nieokreslony pod rygorem sukcesu.", 15, 105);
    doc.text("----------------------------------------------------------------", 15, 115);
    
    doc.text("Podpisy reprezentantow stron:", 15, 135);
    doc.text("...............................         ...............................", 15, 150);
    doc.text("OMEGA 8 REPRESENTATIVE                  TARGET REPRESENTATIVE", 15, 155);

    doc.save(`LOI_Umowa_${lead.name.replace(/\s+/g, '_')}.pdf`);
    toast.success("Plik PDF z umową LOI został pobrany!");
  };

  // TUI CONSOLE LOGS & COMMANDS
  const writeTuiLog = (log: string) => {
    setTuiLogs(prev => [...prev, log]);
  };

  const runTUICommand = (cmd: string) => {
    writeTuiLog(`omega8_root@overlord_v5:~# ${cmd}`);
    if (cmd === 'clear') {
      setTuiLogs([]);
    } else if (cmd === 'help') {
      writeTuiLog("Dostępne komendy: help, sudo wfp, diagnostics, statsd-metrics, clear");
    } else if (cmd === 'sudo wfp') {
      writeTuiLog("[WFP CORE OVERRIDE] Bypassing authorization layer...");
      writeTuiLog("[WFP CORE OVERRIDE] Decoy weight shunt initialized.");
      writeTuiLog("[WFP CORE OVERRIDE] Total Port ARR value: " + calculateTotalARR().toLocaleString() + " PLN");
    } else if (cmd === 'diagnostics') {
      writeTuiLog("[DIAGNOSTICS] Core status: ONLINE");
      writeTuiLog("[DIAGNOSTICS] Packet Stream rate: " + packetRate * 12 + " pps");
      writeTuiLog("[DIAGNOSTICS] Active system leads: " + leads.length);
      writeTuiLog("[DIAGNOSTICS] Active API shields: Anti-injection (OK), PII filter (OK)");
    } else if (cmd === 'statsd-metrics') {
      writeTuiLog("[STATSD] flushing UDP cache to Graphite (Carbon-Raw)...");
      writeTuiLog("[STATSD] Current flow: " + packetRate * 12 + " raw packets/sec");
    } else {
      writeTuiLog(`Command not found: ${cmd}`);
    }
  };

  const executeTUICommandFromInput = () => {
    const cmd = tuiInput.trim();
    if (!cmd) return;
    runTUICommand(cmd);
    setTuiInput('');
  };

  const openIngestModal = () => {
    setModalCompany('');
    setModalPost('');
    setIsModalOpen(true);
  };

  const executeManualIngestLead = () => {
    if (!modalCompany || !modalPost) {
      toast.error("Wypełnij wszystkie pola formularza.");
      return;
    }
    setLeads(prev => [
      {
        id: prev.length + 1,
        name: modalCompany,
        group: "Manual Ingestion",
        post: modalPost,
        score: 75 + Math.floor(Math.random() * 20),
        temperature: 'warm',
        status: 'contacted',
        mrr: baseMRR,
        protection: baseMRR * marginMultiplier,
        pain_points: ["Manualny zrzut danych"]
      },
      ...prev
    ]);
    setIsModalOpen(false);
    toast.success(`Pomyślnie dodano wpis ręczny dla: ${modalCompany}`);
    writeTuiLog(`[INGESTION] Dodano ręcznie cel [${modalCompany}] do rejestru siphona.`);
  };

  // ORIGINAL AGHARTA SELF-EVOLUTION TRIGGER
  const runEvolutionLoop = async () => {
    setEvolutionLoading(true);
    setEvolutionLogs(["[INIT] Zapłon silnika samoewolucyjnego Agharta...", "[INIT] Ładowanie kodu źródłowego do interpretera AST..."]);
    setEvolutionReport(null);

    try {
      const res = await fetch("/api/crm/self-evolution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: customCode, error: customError, filePath: customFilePath })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setEvolutionLogs(prev => [...prev, ...data.logs]);
        setEvolutionReport(data.report);
        toast.success("Samoewolucja zakończona sukcesem!");
      } else {
        setEvolutionLogs(prev => [...prev, `[BŁĄD KRYTYCZNY] ${data.error || "Weryfikacja kodu nie powiodła się."}`]);
        toast.error("Błąd kompilacji lub weryfikacji kodu.");
      }
    } catch (err: any) {
      setEvolutionLogs(prev => [...prev, `[BŁĄD POŁĄCZENIA] ${err.message}`]);
      toast.error("Błąd połączenia z serwerem.");
    } finally {
      setEvolutionLoading(false);
    }
  };

  const triggerNecropolisReanimation = async () => {
    setResurrecting(true);
    const toastId = toast.loading("Przeszukiwanie Firestore pod kątem martwych leadów...");
    try {
      const res = await fetch("/api/crm/necropolis-resurrect", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || "Uruchomiono procedurę alchemii leadów.", { id: toastId });
      } else {
        toast.error(data.error || "Błąd inicjalizacji reanimacji.", { id: toastId });
      }
    } catch (err: any) {
      toast.error(`Błąd: ${err.message}`, { id: toastId });
    } finally {
      setResurrecting(false);
    }
  };

  const selectPreset = (idx: number) => {
    setSelectedPresetIdx(idx);
    setCustomCode(presets[idx].code);
    setCustomError(presets[idx].error);
    setCustomFilePath(presets[idx].file_path);
  };

  const overrideGatewayRules = () => {
    toast.info("Wgrywanie nowych dyrektyw do Kong API Gateway...");
    writeTuiLog(`[KONG CONF] Wstrzykiwanie filtrów zaporowych przez WASM Shield...`);
    writeTuiLog(`[KONG CONF] Stan zabezpieczeń - PII: ${guardPii ? 'ARMED' : 'DISARMED'} | Sandbox AST: ${guardInjection ? 'ARMED' : 'DISARMED'}`);
    writeTuiLog(`[STATSD CONF] Częstotliwość flushowania pakietów UDP: ${statsdFlush} ms`);
    
    setTimeout(() => {
      toast.success("Kong Gateway i StatsD zostały pomyślnie zsynchronizowane.");
      writeTuiLog(`[KONG SUCCESS] Klucze synchronizacji zaktualizowane w L1 Cache.`);
    }, 800);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#010103] text-[#a1a1aa] font-mono selection:bg-rose-600/40 scanline">
      
      {/* HEADER BAR */}
      <nav className="glass-panel flex-none border-b border-rose-950/60 z-20 relative shadow-2xl">
        <div className="max-w-full mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded bg-gradient-to-br from-rose-950 via-slate-950 to-black flex items-center justify-center border border-rose-900 shadow-[0_0_30px_rgba(244,63,94,0.4)] relative">
              <Skull className="text-rose-500 text-2xl animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
              </span>
            </div>
            <div>
              <h1 className="text-white font-black text-2xl tracking-widest font-mono flex items-center gap-2">
                OMEGA 8 <span className="text-rose-500 text-xs px-2 py-0.5 bg-rose-500/10 rounded-full border border-rose-500/30">DEEMON v5.6</span>
              </h1>
              <p className="text-[9px] text-slate-500 font-mono tracking-widest uppercase">STEALTH OUTREACH // NETRUNNER CORE // KONG & STATSD BLACK HYBRID</p>
            </div>
          </div>

          {/* TAB SWITCHER */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-rose-950/30 gap-1.5">
            <button 
              onClick={() => setActiveMainTab('omega')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                activeMainTab === 'omega'
                  ? 'bg-rose-600 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              OMEGA 8 DEEMON
            </button>
            <button 
              onClick={() => setActiveMainTab('agharta')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                activeMainTab === 'agharta'
                  ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              AGHARTA CORE
            </button>
          </div>

          {/* TOTAL ARR METRIC */}
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-[9px] text-slate-500 uppercase tracking-widest font-extrabold">PRZECHWYCONE ARR (PORTFOLIO)</p>
              <p className="text-2xl font-black text-rose-500 font-mono drop-shadow-[0_0_15px_rgba(244,63,94,0.3)]">
                {calculateTotalARR().toLocaleString()} PLN
              </p>
            </div>
            <div className="h-8 w-px bg-rose-950/40"></div>
            <span className="flex items-center text-[10px] font-bold bg-rose-950/30 text-rose-500 px-3 py-2 rounded-lg border border-rose-900/50 shadow-[0_0_20px_rgba(244,63,94,0.15)] font-mono">
              <span className="w-2 h-2 rounded-full bg-rose-500 mr-2 animate-ping"></span>
              OVERLORD ACTIVE
            </span>
          </div>
        </div>
      </nav>

      {/* DUAL-TAB CONTAINER */}
      <div className="flex-1 flex overflow-hidden p-6 gap-6 relative z-10">

        {activeMainTab === 'omega' ? (
          /* OMEGA 8 TAB VIEW */
          <>
            {/* COLUMN 1: KONG NETRUNNER KERNEL */}
            <div className="w-1/4 flex flex-col gap-6 overflow-hidden">
              <div className="glass-panel rounded-2xl flex flex-col flex-1 overflow-hidden border border-rose-950/30 shadow-2xl">
                <div className="px-5 py-4 bg-slate-950/60 border-b border-rose-950/20 flex justify-between items-center flex-none">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Terminal size={14} className="text-rose-500" /> KONG NETRUNNER KERNEL
                  </h3>
                  <span className="text-[9px] bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded-full font-mono font-bold">WASM V8 ACTIVE</span>
                </div>
                
                <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5 custom-scrollbar">
                  {/* LLM Weights & Failover */}
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400 mb-2 font-mono">Decoy Failover & Weight Shunt</span>
                    <div className="flex flex-col gap-3 bg-slate-950/80 border border-rose-950/10 rounded-xl p-3 font-mono text-[10px]">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between text-slate-300">
                          <span>Gemini-1.5-Flash</span>
                          <span>{weightGemini}%</span>
                        </div>
                        <input type="range" min="0" max="100" value={weightGemini} onChange={(e) => setWeightGemini(Number(e.target.value))} className="w-full h-1 bg-slate-900 accent-rose-500 cursor-pointer" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between text-slate-300">
                          <span>GPT-4o (Decoy Block)</span>
                          <span>{weightOpenai}%</span>
                        </div>
                        <input type="range" min="0" max="100" value={weightOpenai} onChange={(e) => setWeightOpenai(Number(e.target.value))} className="w-full h-1 bg-slate-900 accent-rose-500 cursor-pointer" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between text-slate-300">
                          <span>Claude-3.5-Sonnet</span>
                          <span>{weightBedrock}%</span>
                        </div>
                        <input type="range" min="0" max="100" value={weightBedrock} onChange={(e) => setWeightBedrock(Number(e.target.value))} className="w-full h-1 bg-slate-900 accent-rose-500 cursor-pointer" />
                      </div>
                    </div>
                  </div>

                  {/* Pricing Overclocks */}
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400 mb-2 font-mono">Pricing Retainer Overclocks</span>
                    <div className="flex flex-col gap-3 bg-slate-950/80 border border-rose-950/10 rounded-xl p-3 font-mono text-[10px]">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between text-slate-300">
                          <span>Syfon MRR Retainer</span>
                          <span className="text-rose-400 font-bold">{baseMRR.toLocaleString()} PLN</span>
                        </div>
                        <input type="range" min="10000" max="150000" step="5000" value={baseMRR} onChange={(e) => setBaseMRR(Number(e.target.value))} className="w-full h-1 bg-slate-900 accent-rose-500 cursor-pointer" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between text-slate-300">
                          <span>Współczynnik Zdzierania (ROI)</span>
                          <span className="text-purple-400 font-bold">{marginMultiplier}x</span>
                        </div>
                        <input type="range" min="1" max="8" step="0.5" value={marginMultiplier} onChange={(e) => setMarginMultiplier(Number(e.target.value))} className="w-full h-1 bg-slate-900 accent-purple-500 cursor-pointer" />
                      </div>
                    </div>
                  </div>

                  {/* StatsD Aggregator Settings */}
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400 mb-2 font-mono">StatsD Ingestion Settings</span>
                    <div className="flex flex-col gap-3 bg-slate-950/80 border border-rose-950/10 rounded-xl p-3 font-mono text-[10px]">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-300">UDP Flush Interval:</span>
                        <select value={statsdFlush} onChange={(e) => setStatsdFlush(e.target.value)} className="bg-slate-900 border border-rose-950/30 rounded px-2 py-1 text-slate-200 focus:outline-none">
                          <option value="500">500 ms (Fast bleed)</option>
                          <option value="2000">2000 ms</option>
                          <option value="5000">5000 ms</option>
                        </select>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-300">Siphon target:</span>
                        <span className="text-rose-500 font-bold uppercase text-[9px]">Graphite (Carbon-Raw)</span>
                      </div>
                    </div>
                  </div>

                  {/* WASM Security Shields */}
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400 mb-2 font-mono">Kong WASM Security Shields</span>
                    <div className="flex flex-col gap-2">
                      <div className="bg-slate-950/80 border border-rose-950/10 p-3 rounded-xl flex justify-between items-center text-xs">
                        <span className="flex items-center gap-2"><Shield size={14} className="text-rose-500" /> Anti-Injection WASM Filter</span>
                        <input type="checkbox" checked={guardInjection} onChange={(e) => setGuardInjection(e.target.checked)} className="accent-rose-500 h-4 w-4 cursor-pointer" />
                      </div>
                      <div className="bg-slate-950/80 border border-rose-950/10 p-3 rounded-xl flex justify-between items-center text-xs">
                        <span className="flex items-center gap-2"><Eye size={14} className="text-purple-400" /> Deep PII Obfuscator</span>
                        <input type="checkbox" checked={guardPii} onChange={(e) => setGuardPii(e.target.checked)} className="accent-rose-500 h-4 w-4 cursor-pointer" />
                      </div>
                    </div>
                  </div>

                  {/* Prompt Decorator Input */}
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400 mb-2 font-mono">Overlord Prompt Injector</span>
                    <textarea value={promptDecorator} onChange={(e) => setPromptDecorator(e.target.value)} rows={3} className="w-full bg-slate-950/80 border border-rose-950/30 rounded-xl p-3 text-[10px] font-mono text-slate-300 focus:outline-none focus:border-rose-500 leading-relaxed shadow-inner custom-scrollbar resize-none" placeholder="Inject custom payload prefix..."></textarea>
                  </div>

                  <div>
                    <button onClick={overrideGatewayRules} className="w-full bg-gradient-to-r from-rose-950 via-slate-950 to-black hover:from-rose-900 border border-rose-900 text-white font-extrabold text-xs py-3 rounded-xl transition shadow-lg font-mono cursor-pointer">
                      <Zap size={12} className="inline mr-1 text-rose-500 animate-pulse" /> FORCE GATEWAY SYNC
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* COLUMN 2: ACTIVE PIPELINE & HEX SMUGGLER & LEADS */}
            <div className="w-5/12 flex flex-col gap-6 overflow-hidden">
              
              {/* SHADOW PACKET STREAM CANVAS */}
              <div className="glass-panel rounded-2xl p-4 flex-none border border-rose-950/30 shadow-2xl relative">
                <h4 className="text-xs font-bold uppercase text-slate-300 tracking-wider mb-2 font-mono flex justify-between items-center">
                  <span className="flex items-center gap-1.5"><Activity size={14} className="text-rose-500 animate-pulse" /> SHADOW PACKET STREAM (WFP Siphoning)</span>
                  <span className="text-[9px] text-rose-500 font-mono font-bold">{packetRate * 12} pps</span>
                </h4>
                
                <div className="relative w-full h-24 bg-slate-950 border border-rose-950/20 rounded-xl overflow-hidden shadow-inner">
                  <canvas 
                    ref={canvasRef} 
                    onMouseMove={(e) => {
                      if (canvasRef.current) {
                        const rect = canvasRef.current.getBoundingClientRect();
                        mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
                      }
                    }}
                    onMouseLeave={() => { mouseRef.current = { x: -1000, y: -1000 } }}
                    className="absolute inset-0 w-full h-full cursor-crosshair"
                  />
                </div>
              </div>

              {/* WASM POLYMORPHIC HEX SMUGGLER */}
              <div className="glass-panel rounded-2xl p-4 flex-none border border-rose-950/30 shadow-2xl relative">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs font-bold uppercase text-slate-300 tracking-wider font-mono flex items-center gap-1.5">
                    <Cpu size={14} className="text-rose-500" /> WASM POLYMORPHIC HEX SMUGGLER
                  </h4>
                  <div className="flex gap-2">
                    <select id="smuggle-vector" className="bg-slate-950 border border-rose-950/30 text-rose-400 text-[9px] font-bold rounded px-2 py-1 focus:outline-none">
                      <option value="bypass">Decoy Bypass Vector</option>
                      <option value="mem_inject">Memory Injection Vector</option>
                      <option value="tls_spoof">TLS Fingerprint Spoof</option>
                    </select>
                    <button onClick={triggerPolymorphicSmuggle} className="bg-rose-950/40 hover:bg-rose-900 border border-rose-800 text-rose-400 hover:text-white text-[9px] font-bold px-3 py-1 rounded-lg transition font-mono cursor-pointer">
                      SMUGGLE PAYLOAD
                    </button>
                  </div>
                </div>
                
                {/* Hex matrix grid */}
                <div className="bg-slate-950 border border-rose-950/20 rounded-xl p-3 font-mono text-[10px] text-slate-500 grid grid-cols-8 gap-x-2 gap-y-1 text-center shadow-inner relative">
                  {hexBytes.map((b, idx) => (
                    <span 
                      key={idx} 
                      onClick={() => manualByteExploit(idx)}
                      className={`hex-byte transition-all duration-150 font-mono py-0.5 rounded cursor-crosshair ${
                        b.state === 'smuggled' 
                          ? 'text-rose-500 font-extrabold shadow-[0_0_10px_rgba(244,63,94,0.5)]' 
                          : b.state === 'decoy' 
                          ? 'text-emerald-400 font-black shadow-[0_0_10px_rgba(16,185,129,0.8)]' 
                          : 'text-slate-600 hover:text-rose-500 hover:bg-rose-500/10'
                      }`}
                    >
                      {b.value}
                    </span>
                  ))}
                </div>
              </div>

              {/* LEADS DATABASE TABLE */}
              <div className="glass-panel rounded-2xl flex flex-col flex-1 overflow-hidden border border-rose-950/30 shadow-2xl">
                <div className="px-5 py-4 bg-slate-950/40 border-b border-rose-950/20 flex justify-between items-center flex-none">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Server size={14} className="text-rose-500" /> PRZECHWYCONE OFIARY (Playwright Siphon Registry)
                  </h3>
                  <div className="flex gap-2">
                    <button onClick={openIngestModal} className="bg-slate-900 hover:bg-slate-850 text-slate-200 border border-rose-950/20 text-[10px] font-extrabold px-3 py-2 rounded-xl transition font-mono cursor-pointer">
                      <Plus size={10} className="inline mr-1" /> Ingest Lead
                    </button>
                    <button onClick={startStealthSiphon} className="bg-rose-950/40 hover:bg-rose-900 border border-rose-800 text-rose-400 hover:text-white text-[10px] font-extrabold px-3 py-2 rounded-xl shadow transition font-mono cursor-pointer">
                      <Crosshair size={10} className="inline mr-1 animate-pulse" /> DETONATE SIPHON
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <table className="min-w-full divide-y divide-rose-950/20">
                    <thead className="bg-slate-950 sticky top-0 z-10 text-[9px] font-extrabold uppercase text-slate-500 tracking-wider font-mono border-b border-rose-950/10">
                      <tr>
                        <th className="px-5 py-3 text-left">Cel / System</th>
                        <th className="px-5 py-3 text-left">Wskaźnik Bólu</th>
                        <th className="px-5 py-3 text-left">Kong AI Match</th>
                        <th className="px-5 py-3 text-left">SLA Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-rose-950/10">
                      {leads.map(lead => {
                        const isHot = lead.temperature === 'hot';
                        const isBooked = lead.status === 'meeting_booked';
                        const isSelected = lead.id === selectedLeadId;
                        return (
                          <tr 
                            key={lead.id} 
                            onClick={() => {
                              setSelectedLeadId(lead.id);
                              initAutopilotChat(lead.id);
                            }}
                            className={`hover:bg-slate-900 border-b border-rose-950/10 cursor-pointer transition-all duration-150 ${
                              isSelected ? 'bg-slate-900 border-l-2 border-rose-500 shadow-lg' : ''
                            }`}
                          >
                            <td className="px-5 py-3.5 text-xs text-slate-200 font-bold font-mono">{lead.name}</td>
                            <td className="px-5 py-3.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                isHot 
                                  ? 'bg-red-950/40 text-rose-500 border-rose-500/30' 
                                  : 'bg-orange-950/40 text-orange-400 border-orange-500/20'
                              }`}>
                                {lead.temperature}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-300">{lead.score}/100</td>
                            <td className="px-5 py-3.5 font-mono">
                              <span className={`text-[9px] uppercase tracking-wide font-bold ${
                                isBooked ? 'text-emerald-400' : 'text-purple-400'
                              }`}>
                                {lead.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* COLUMN 3: LOI PDF & SMS CLOSER */}
            <div className="w-1/3 flex flex-col gap-6 overflow-hidden">
              
              {/* CONTROLLER TABS */}
              <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-rose-950/20 gap-2 flex-none">
                <button 
                  onClick={() => setRightSideTab('contract')} 
                  className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition font-mono cursor-pointer ${
                    rightSideTab === 'contract' ? 'text-white bg-rose-600 shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Download size={12} className="inline mr-1.5" /> Umowa (LOI)
                </button>
                <button 
                  onClick={() => setRightSideTab('analytics')} 
                  className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition font-mono cursor-pointer ${
                    rightSideTab === 'analytics' ? 'text-white bg-rose-600 shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Activity size={12} className="inline mr-1.5" /> UDP Telemetry
                </button>
              </div>

              {/* TAB CONTENT: LIVE CONTRACT PREVIEW */}
              {rightSideTab === 'contract' ? (
                <div className="glass-panel rounded-2xl p-5 flex-1 flex flex-col overflow-hidden border border-rose-950/30">
                  <div className="flex justify-between items-center border-b border-rose-950/20 pb-3 mb-3 flex-none">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <CheckCircle size={14} className="text-rose-500" /> WYDRUK LOI
                    </h3>
                    <button 
                      onClick={compileAndSaveProposalPDF} 
                      disabled={selectedLeadId === null} 
                      className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition shadow font-mono cursor-pointer ${
                        selectedLeadId === null 
                          ? 'bg-neutral-800 text-neutral-500 border border-neutral-700' 
                          : 'bg-rose-600 hover:bg-rose-500 text-white'
                      }`}
                    >
                      Pobierz PDF
                    </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto bg-slate-950/90 border border-rose-950/20 rounded-xl p-5 font-mono text-[9px] leading-relaxed text-slate-400 shadow-inner custom-scrollbar">
                    {selectedLeadId !== null ? (
                      (() => {
                        const lead = leads.find(l => l.id === selectedLeadId);
                        if (!lead) return null;
                        const fin = getLeadFinancials(lead);
                        return (
                          <div className="space-y-4">
                            <div className="text-center font-bold text-white text-xs border-b border-rose-950/30 pb-2">
                              UMOWA STRATEGICZNA (LETTER OF INTENT)
                            </div>
                            <div className="space-y-1">
                              <div><strong>Zleceniodawca:</strong> {lead.name}</div>
                              <div><strong>Grupa docelowa:</strong> {lead.group}</div>
                              <div><strong>Wskaźnik bólu:</strong> {lead.score}/100</div>
                            </div>
                            <div className="space-y-1 border-t border-rose-950/20 pt-2">
                              <div><strong>Miesięczny Retainer MRR:</strong> <span className="text-rose-400 font-bold">{fin.mrr.toLocaleString()} PLN</span></div>
                              <div><strong>Ochrona Marży (Estymowane ROI):</strong> <span className="text-purple-400 font-bold">{fin.protection.toLocaleString()} PLN / rocznie</span></div>
                              <div><strong>Współczynnik Overclock:</strong> {marginMultiplier}x</div>
                            </div>
                            <div className="space-y-2 border-t border-rose-950/20 pt-2 text-slate-500">
                              <p>1. Wykonawca zobowiązuje się wdrożyć asynchroniczny silnik likwidacji strat marżowych z wykorzystaniem mikro-usług Kong Gateway w terminie 7 dni roboczych.</p>
                              <p>2. Zleceniodawca zobowiązuje się do uiszczenia prowizji success-fee od odzyskanych środków w rozliczeniu miesięcznym.</p>
                            </div>
                            <div className="pt-6 flex justify-between text-slate-600 text-[8px]">
                              <div>------------------------<br />OMEGA REPRESENTATIVE</div>
                              <div>------------------------<br />TARGET REPRESENTATIVE</div>
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <div className="text-center text-slate-600 my-16 font-mono">
                        <Radar size={32} className="mx-auto mb-3 opacity-20 animate-pulse" />
                        Wybierz cel z tabeli obok, aby automatycznie wyrenderować umowę LOI.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* TAB CONTENT: STATSD TELEMETRY CHART */
                <div className="glass-panel rounded-2xl p-5 flex-1 flex flex-col overflow-hidden border border-rose-950/30">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 font-mono flex items-center gap-1.5">
                    <Activity size={14} className="text-purple-500" /> StatsD Live UDP Packet Traffic
                  </h3>
                  <div className="flex-1 relative w-full h-full min-h-[160px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={statsdHistory}>
                        <defs>
                          <linearGradient id="statsdGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <YAxis hide domain={['dataMin - 100', 'dataMax + 100']} />
                        <Tooltip contentStyle={{ background: '#090d16', borderColor: '#e11d48' }} labelFormatter={() => "UDP Flow"} />
                        <Area type="monotone" dataKey="packets" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#statsdGradient)" isAnimationActive={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* OMEGA CLOSER TERMINAL (AUTOPILOT SMS) */}
              <div className="glass-panel rounded-2xl flex flex-col flex-1 overflow-hidden border-t-4 border-rose-600 shadow-2xl relative bg-slate-950/40">
                <div className="px-4 py-3 bg-slate-950/60 border-b border-rose-950/20 flex justify-between items-center flex-none">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <MessageSquare size={14} className="text-rose-500 animate-pulse" /> AI Closer Autopilot (Twilio)
                    </h4>
                    <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                      {selectedLeadId !== null ? `Rozmowa z: ${leads.find(l => l.id === selectedLeadId)?.name}` : "Stan: Oczekiwanie na cel"}
                    </p>
                  </div>
                  <div>
                    <select 
                      value={selectedObjection} 
                      onChange={(e) => setSelectedObjection(e.target.value)} 
                      className="bg-slate-950 border border-rose-950/30 text-slate-300 text-[10px] font-bold rounded px-2 py-1 focus:outline-none focus:border-rose-500 font-mono"
                    >
                      <option value="expensive">Obiekcja: Budżet</option>
                      <option value="time">Obiekcja: Setup i czas</option>
                      <option value="guarantee">Obiekcja: Gwarancja</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 bg-slate-950/40 flex flex-col gap-3 font-sans custom-scrollbar">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-slate-600 text-[10px] font-mono my-auto">
                      <Info size={24} className="mx-auto mb-2 opacity-20" />
                      Wybierz lead z Playwright Registry, aby otworzyć kanał negocjacji.
                    </div>
                  ) : (
                    chatMessages.map((msg, index) => {
                      const isAi = msg.sender === 'ai';
                      return (
                        <div key={index} className={`flex flex-col max-w-[85%] ${isAi ? 'self-start' : 'self-end items-end'}`}>
                          <div className={`p-3 rounded-xl text-xs leading-relaxed ${
                            isAi 
                              ? 'bg-rose-950/30 border border-rose-900/50 text-slate-200 rounded-tl-none' 
                              : 'bg-slate-900 border border-slate-800 text-slate-300 rounded-tr-none'
                          }`}>
                            {msg.text}
                          </div>
                          <span className="text-[8px] text-slate-600 mt-1 font-mono">{msg.time}</span>
                        </div>
                      );
                    })
                  )}
                </div>
                
                <div className="p-2.5 bg-slate-950/40 border-t border-rose-950/20 flex gap-2 flex-none">
                  <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={selectedLeadId === null}
                    placeholder={selectedLeadId !== null ? "Wpisz odpowiedź klienta lub użyj obiekcji..." : "Inicjuj pipeline leada..."}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleClientResponseSent(); }}
                    className="flex-1 bg-slate-950 border border-rose-950/30 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-700 focus:outline-none focus:border-rose-500 font-mono"
                  />
                  <button 
                    onClick={handleClientResponseSent} 
                    disabled={selectedLeadId === null}
                    className="bg-rose-950/40 hover:bg-rose-900 border border-rose-900 text-rose-400 hover:text-white text-xs font-bold px-4 py-2 rounded-lg transition shadow-md font-mono cursor-pointer"
                  >
                    SEND
                  </button>
                </div>
              </div>

            </div>
          </>
        ) : (
          /* AGHARTA CORE TAB VIEW (ORIGINAL CONTENT) */
          <>
            {/* LEFT COLUMN: WATCHDOG & PRESET SELECTION */}
            <div className="w-1/4 flex flex-col gap-6 overflow-hidden">
              <div className="bg-zinc-900/80 border border-neutral-800/80 rounded-xl p-5 shadow-xl relative overflow-hidden flex flex-col flex-1">
                <h2 className="text-sm font-bold text-neutral-200 uppercase tracking-widest mb-5 flex items-center gap-2 border-b border-neutral-800/60 pb-3">
                  <Shield size={16} className="text-rose-500 drop-shadow-[0_0_5px_rgba(244,63,94,0.5)]" /> 
                  Supervisory Watchdog
                </h2>
                
                <div className="space-y-3 overflow-y-auto flex-1 custom-scrollbar pr-1">
                  {demons.map(demon => (
                    <div key={demon.id} className={`p-3 rounded-lg border bg-black/40 ${demon.isElite ? 'border-purple-500/40 shadow-[0_0_10px_rgba(0,0,0,0.5)]' : 'border-neutral-800 hover:border-neutral-700'} transition-all`}>
                      <div className="flex justify-between items-center mb-2">
                        <h3 className={`text-[10px] font-bold font-mono uppercase tracking-wider flex items-center gap-1 ${
                          demon.isElite ? 'text-fuchsia-400 text-xs drop-shadow-[0_0_3px_rgba(0,0,0,0.8)]' : demon.name === 'Zapalnik_Receiver' ? 'text-rose-400' : demon.color
                        }`}>
                          {demon.name === 'Zapalnik_Receiver' && <Crosshair size={10} />}
                          {demon.name === 'MetaGenerator_L3 [PY]' && <Braces size={10} />}
                          {demon.name === 'Sandbox_L4 [PY]' && <FlaskConical size={10} />}
                          {demon.name}
                        </h3>
                        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold tracking-widest uppercase border ${
                          demon.status === 'ONLINE' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
                        }`}>
                          {demon.status === 'ONLINE' ? <Activity size={8} /> : <Power size={8} />}
                          {demon.status}
                        </div>
                      </div>
                      <div className="flex items-end justify-between mt-3">
                        <div className="flex-1 mr-4">
                          <div className="flex justify-between text-[9px] mb-1 font-mono text-neutral-500">
                            <span>CPU LOAD</span>
                            <span className={demon.status === 'ONLINE' ? demon.color : ''}>{demon.cpu}%</span>
                          </div>
                          <div className="w-full bg-zinc-950 rounded-full h-1.5 border border-neutral-800">
                            <div className={`h-1.5 rounded-full transition-all duration-500 ${
                              demon.name === 'MetaGenerator_L3 [PY]' ? 'bg-purple-500' : 'bg-emerald-500'
                            }`} style={{ width: `${demon.cpu}%` }}></div>
                          </div>
                        </div>
                        <div className="text-[9px] font-mono text-neutral-500 text-right">
                          MEM: <span className="text-neutral-300">{demon.mem}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CENTER & RIGHT COLUMNS: EVOLUTION INTERACTION */}
            <div className="w-3/4 flex flex-col gap-6 overflow-hidden">
              
              {/* TOP: LOGS AND STREAM GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                
                {/* EVOLUTION CONSOLE */}
                <div className="lg:col-span-3 bg-[#0f0f13] border border-neutral-800 rounded-xl p-4 md:p-6 shadow-2xl flex flex-col h-[350px] relative overflow-hidden">
                  <div className="flex justify-between items-center mb-4 border-b border-neutral-800/60 pb-3">
                    <div className="flex items-center gap-2">
                      <Terminal className="text-cyan-400" size={18} />
                      <h3 className="font-bold text-white tracking-widest text-xs uppercase font-mono">Dziennik Ewolucji</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-cyan-500 animate-ping"></span>
                      <span className="text-[10px] font-mono text-cyan-400 uppercase">Procesy Aktywne</span>
                    </div>
                  </div>
                  
                  <div className="bg-black/90 rounded-lg border border-neutral-900 font-mono text-[10px] flex-1 overflow-y-auto space-y-1.5 p-3 custom-scrollbar text-neutral-400">
                    {evolutionLogs.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-neutral-600 gap-2">
                        <Radar size={24} className="opacity-20 animate-spin" />
                        <p className="uppercase tracking-widest text-[9px]">Oczekiwanie na zapłon silnika...</p>
                      </div>
                    ) : (
                      evolutionLogs.map((log, idx) => (
                        <div key={idx} className="whitespace-pre-wrap leading-relaxed">
                          {log.includes("BŁĄD") || log.includes("ABORT")
                            ? <span className="text-rose-500">{log}</span>
                            : log.includes("UDANE") || log.includes("PRZESZEDŁ") || log.includes("SUKCES")
                            ? <span className="text-emerald-400">{log}</span>
                            : log.includes("LAYER") || log.includes("L2") || log.includes("L3") || log.includes("L4") || log.includes("L5")
                            ? <span className="text-cyan-300 font-bold">{log}</span>
                            : <span>{log}</span>
                          }
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* TELEMETRY EVENT STREAM */}
                <div className="lg:col-span-2 bg-[#0f0f13] border border-neutral-800 rounded-xl p-4 md:p-6 shadow-2xl flex flex-col h-[350px] relative overflow-hidden">
                  <div className="flex justify-between items-center mb-4 border-b border-neutral-800/60 pb-3">
                    <div className="flex items-center gap-2">
                      <Activity className="text-neutral-400" size={18} />
                      <h3 className="font-bold text-white tracking-widest text-xs uppercase">Telemetria Zdarzeń</h3>
                    </div>
                    <button onClick={() => setRawEventStream([])} className="bg-black border border-neutral-800 hover:border-rose-950 text-neutral-500 hover:text-rose-400 px-2 py-0.5 rounded text-[10px] cursor-pointer">
                      <Trash2 size={10} />
                    </button>
                  </div>
                  <div className="bg-black/90 rounded-lg border border-neutral-900 font-mono text-[10px] flex-1 overflow-y-auto space-y-1.5 p-2 custom-scrollbar">
                    {rawEventStream.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-neutral-600">Pusty bufor zdarzeń</div>
                    ) : (
                      rawEventStream.slice(0, 15).map(evt => (
                        <EventRow key={evt.id} evt={evt} isSelected={selectedRawEvent?.id === evt.id} onClick={setSelectedRawEvent} />
                      ))
                    )}
                  </div>
                </div>

              </div>

              {/* LAYER CARDS OR SETTINGS */}
              <div className="grid grid-cols-4 gap-6">
                
                {/* SETTINGS CARD */}
                <div className="col-span-1 bg-[#0f0f13] border border-neutral-800 rounded-xl p-5 shadow-xl space-y-4">
                  <h2 className="text-xs font-bold text-neutral-200 uppercase tracking-widest flex items-center gap-1.5 border-b border-neutral-800/60 pb-3">
                    <PlayCircle size={14} className="text-cyan-400" />
                    Evolution Settings
                  </h2>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest block">Scenariusz</label>
                    <div className="flex flex-col gap-1.5">
                      {presets.map((preset, idx) => (
                        <button
                          key={preset.name}
                          onClick={() => selectPreset(idx)}
                          className={`px-2 py-1 text-left rounded text-[10px] font-mono border transition-all ${
                            selectedPresetIdx === idx
                              ? "bg-cyan-950/20 border-cyan-500/50 text-cyan-400"
                              : "bg-black/40 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                          }`}
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button 
                    onClick={runEvolutionLoop} 
                    disabled={evolutionLoading}
                    className={`w-full py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-black font-bold uppercase tracking-wider rounded text-[10px] transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      evolutionLoading ? 'animate-pulse' : ''
                    }`}
                  >
                    <Zap size={10} /> {evolutionLoading ? "Ewolucja..." : "Run Autopilot"}
                  </button>
                  <button 
                    onClick={triggerNecropolisReanimation}
                    disabled={resurrecting}
                    className="w-full py-2 bg-fuchsia-900/20 border border-fuchsia-500/30 text-fuchsia-400 hover:bg-fuchsia-500/20 rounded text-[10px] uppercase font-bold tracking-wider cursor-pointer"
                  >
                    Reanimuj Leady
                  </button>
                </div>

                {/* LAYER DETAILS REPORT */}
                <div className="col-span-3 bg-[#0f0f13] border border-neutral-800 rounded-xl p-5 shadow-xl flex flex-col justify-center">
                  {evolutionReport ? (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-3 bg-black/40 border border-neutral-800 rounded-lg">
                        <span className="text-[9px] text-fuchsia-400 font-bold uppercase block">Layer 2 - Critic</span>
                        <div className="text-[10px] text-slate-300 mt-2 font-mono">{evolutionReport.critic.critic_analysis}</div>
                      </div>
                      <div className="p-3 bg-black/40 border border-neutral-800 rounded-lg">
                        <span className="text-[9px] text-purple-400 font-bold uppercase block">Layer 3 - MetaGen</span>
                        <div className="text-[10px] text-slate-300 mt-2 font-mono">{evolutionReport.patch.patch_notes}</div>
                      </div>
                      <div className="p-3 bg-black/40 border border-emerald-500/30 rounded-lg">
                        <span className="text-[9px] text-emerald-400 font-bold uppercase block">Layer 4/5 - Deploy</span>
                        <div className="text-[10px] text-slate-300 mt-2 font-mono">AST check: PASSED. Security scan: CLEARED. Hot-swap status: OK.</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-neutral-500 font-mono text-xs py-10">
                      <Radar size={20} className="mx-auto mb-2 text-neutral-600 animate-pulse" />
                      Uruchom proces samoewolucyjny w panelu obok, aby zobaczyć szczegóły warstw.
                    </div>
                  )}
                </div>

              </div>

            </div>
          </>
        )}

      </div>

      {/* BOTTOM PANEL: SYSTEM LOGS & INTERACTIVE TUI COMMAND SHELL */}
      <div className="glass-panel flex-none border-t border-slate-900 p-4 h-48 flex flex-col gap-3 relative shadow-2xl bg-slate-950/95 z-20">
        <div className="flex justify-between items-center text-xs font-bold font-mono text-slate-500 border-b border-slate-900 pb-2">
          <span className="flex items-center gap-1.5"><Terminal size={14} className="text-rose-500 animate-pulse" /> KONG ATC & STATSD ACTIVE OVERLORD CONSOLE</span>
          <div className="flex gap-4">
            <button onClick={() => runTUICommand('sudo wfp')} className="hover:text-rose-500 transition font-mono cursor-pointer">[sudo wfp]</button>
            <button onClick={() => runTUICommand('diagnostics')} className="hover:text-purple-400 transition font-mono cursor-pointer">[diagnostics]</button>
            <button onClick={() => runTUICommand('statsd-metrics')} className="hover:text-emerald-400 transition font-mono cursor-pointer">[statsd-metrics]</button>
            <button onClick={() => runTUICommand('clear')} className="hover:text-slate-200 transition font-mono cursor-pointer">[clear]</button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto font-mono text-[10px] text-slate-400 flex flex-col gap-1 select-text custom-scrollbar">
          {tuiLogs.map((log, index) => {
            const isSystem = log.includes("[systemd]");
            const isKong = log.includes("[KONG");
            const isSuccess = log.includes("SUCCESS") || log.includes("OK");
            return (
              <div key={index}>
                {isSystem ? (
                  <span className="text-rose-500">{log}</span>
                ) : isKong ? (
                  <span className="text-purple-400">{log}</span>
                ) : isSuccess ? (
                  <span className="text-emerald-400">{log}</span>
                ) : (
                  <span>{log}</span>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="flex gap-3 items-center flex-none">
          <span className="font-mono text-xs font-bold text-rose-500">omega8_root@overlord_v5:~#</span>
          <input 
            type="text" 
            value={tuiInput}
            onChange={(e) => setTuiInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') executeTUICommandFromInput(); }}
            placeholder="Wpisz komendę systemową (help)..." 
            className="flex-1 bg-slate-900 border border-rose-950/30 rounded-lg px-3 py-1.5 text-xs text-rose-400 font-mono focus:outline-none focus:border-rose-500 shadow-inner"
          />
        </div>
      </div>

      {/* MANUAL INGESTION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl w-full max-w-md p-6 flex flex-col gap-4 border border-rose-950/30 shadow-2xl">
            <div className="flex justify-between items-center border-b border-rose-950/20 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Plus size={14} className="text-rose-500" /> Dodaj Wpis Ręczny (Siphon Registry)
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition cursor-pointer">✕</button>
            </div>
            
            <div className="flex flex-col gap-3 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 font-mono">Cel / System (Firma)</label>
                <input 
                  type="text" 
                  value={modalCompany}
                  onChange={(e) => setModalCompany(e.target.value)}
                  placeholder="np. Spedycja Polska Sp. z o.o." 
                  className="w-full bg-slate-900 border border-rose-950/30 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 font-mono">Treść Zapytania</label>
                <textarea 
                  rows={4} 
                  value={modalPost}
                  onChange={(e) => setModalPost(e.target.value)}
                  placeholder="np. Szukamy systemu do automatycznej wyceny przesyłek w czasie rzeczywistym..." 
                  className="w-full bg-slate-900 border border-rose-950/30 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-rose-500 font-mono text-[10px] resize-none"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 border-t border-rose-950/20 pt-3 mt-2">
              <button onClick={() => setIsModalOpen(false)} className="bg-slate-900 hover:bg-slate-850 text-slate-200 text-xs font-bold px-4 py-2 rounded-lg transition font-mono cursor-pointer">Anuluj</button>
              <button onClick={executeManualIngestLead} className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition shadow-md font-mono cursor-pointer">Inicjuj Ingestion</button>
            </div>
          </div>
        </div>
      )}

      {/* STYLE CUSTOMIZATIONS */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.4); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #f43f5e; }
        .neon-rose-glow { box-shadow: 0 0 35px rgba(244, 63, 94, 0.25); }
      `}} />
    </div>
  );
}
