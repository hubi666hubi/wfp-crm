import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cylinder, 
  Cpu, 
  Zap, 
  TrendingUp, 
  RefreshCw, 
  Lock, 
  Layers, 
  Plus, 
  CheckCircle,
  Gem,
  ShoppingCart,
  DollarSign,
  AlertCircle,
  Sparkles,
  Play,
  History,
  Activity,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

interface Factory {
  factoryId: string;
  factoryName: string;
  userId: string;
  tier: string;
  isAutomated: boolean;
  speedMultiplier: number;
  maxLinesLimit: number;
  registeredAt: string;
  currentProduct: string;
  progressPercentage: number;
  status: string;
}

interface UserProfile {
  userId: string;
  email: string;
  tier: 'free' | 'manager' | 'tycoon';
  credits: number;
  naniteGems: number;
  isAutomated: boolean;
  activeLinesCount: number;
}

interface Listing {
  id?: string;
  listingId?: string;
  itemName: string;
  sellerId?: string;
  seller?: string;
  priceCredits: number;
  status?: string;
}

export function FactoryRegistry() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [factories, setFactories] = useState<Factory[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  
  // Agent Broker telemetry state
  const [brokerStatus, setBrokerStatus] = useState<{
    isBrokerMonitoring: boolean;
    totalCompleted: number;
    unlistedCompleted: number;
    listedByBrokerCount: number;
    brokerListings: any[];
    brokerLogs: any[];
    zpulseTrends: any[];
  } | null>(null);
  const [isScanningBroker, setIsScanningBroker] = useState(false);

  // Registration form
  const [newFactoryId, setNewFactoryId] = useState('');
  const [newFactoryName, setNewFactoryName] = useState('');
  
  // Marketplace form
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchProfileAndData = async () => {
    try {
      const pRes = await fetch('/api/factory-registry/profile?userId=demo_tycoon_user');
      const pData = await pRes.json();
      setProfile(pData.profile);

      // Fetch dynamic factory lists from our actual database backend!
      const fRes = await fetch('/api/factory-registry/factories?userId=demo_tycoon_user');
      const fData = await fRes.json();
      setFactories(fData.factories || []);

      // Fetch dynamic Agent Broker status variables
      const bRes = await fetch('/api/factory-registry/agent-broker/status?userId=demo_tycoon_user');
      const bData = await bRes.json();
      setBrokerStatus(bData);

      if (pData.profile?.tier === 'tycoon') {
        const mRes = await fetch('/api/factory-registry/marketplace?userId=demo_tycoon_user');
        const mData = await mRes.json();
        setListings(mData.listings || []);
      }
    } catch (err) {
      console.error("Error loading registry data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProfileAndData();
    }, 0);
    // Premium Real-time simulation polling: refresh dashboard every 6 seconds to watch progress bar animations in real time!
    const pollInterval = setInterval(() => {
      fetchProfileAndData();
    }, 6000);
    return () => {
      clearTimeout(timer);
      clearInterval(pollInterval);
    };
  }, []);

  const handleRegisterFactory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFactoryId.trim() || !newFactoryName.trim()) {
      toast.error("Wypełnij wszystkie pola formularza.");
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch('/api/factory-registry/register-factory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile?.userId || 'demo_tycoon_user',
          factoryId: newFactoryId.trim(),
          factoryName: newFactoryName.trim(),
          activeLines: profile?.activeLinesCount || 0
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Nie udało się zarejestrować fabryki.");
      }

      toast.success(data.message || "Fabryka została zarejestrowana!");
      setNewFactoryId('');
      setNewFactoryName('');
      await fetchProfileAndData();
    } catch (err: any) {
      toast.error(err.message || "Błąd podczas rejestracji.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleOverclock = async (factoryId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/factory-registry/overclock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile?.userId || 'demo_tycoon_user',
          factoryId,
          gemCost: 50
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message, { icon: '⚡' });
        await fetchProfileAndData();
      } else {
        toast.error(data.error || "Wystąpił nieznany błąd podczas boostu.");
      }
    } catch (err) {
      toast.error("Błąd podczas wysyłania zapytania do klastra.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleListOnMarketplace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !newItemPrice.trim()) {
      toast.error("Podaj nazwę przedmiotu i cenę.");
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch('/api/factory-registry/list-on-marketplace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId: profile?.userId || 'demo_tycoon_user',
          itemName: newItemName.trim(),
          priceCredits: Number(newItemPrice)
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setNewItemName('');
        setNewItemPrice('');
        await fetchProfileAndData();
      }
    } catch (err) {
      toast.error("Wystąpił błąd podczas wystawiania.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleTriggerBrokerScan = async () => {
    setIsScanningBroker(true);
    try {
      const res = await fetch('/api/factory-registry/agent-broker/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: profile?.userId || 'demo_tycoon_user' })
      });
      const data = await res.json();
      if (data.success) {
        if (data.processed && data.processed.length > 0) {
          toast.success(
            `AgentBroker zlokalizował i wystawił ${data.processed.length} nowo wyprodukowanych partii!`, 
            { icon: '🤖' }
          );
        } else {
          toast.info("AgentBroker: Wszystkie procesy produkcyjne są zsynchronizowane. Brak nowych towarów o statusie COMPLETED.");
        }
        await fetchProfileAndData();
      } else {
        toast.error(data.error || "Błąd wykonania skanera.");
      }
    } catch (err) {
      toast.error("Nie udało się wymusić skanowania klastra.");
    } finally {
      setIsScanningBroker(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <RefreshCw className="h-10 w-10 text-rose-500 animate-spin" />
        <p className="text-neutral-400 font-mono text-sm tracking-widest">AUTORYZOWANIE REJESTRU FABRYK (FactoryRegistry)...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 select-none" id="factory-registry-module">
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-neutral-900 pb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Cylinder className="h-6 w-6 text-rose-500 animate-pulse" />
            <span className="text-xs font-mono font-bold tracking-widest text-rose-500 uppercase">AISTUDIO ENTERPRISE PROTOCOL</span>
          </div>
          <h1 className="text-3 tracking-tight font-extrabold text-white text-3xl">
            FactoryRegistry <span className="text-neutral-600">/ Engine</span>
          </h1>
          <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
            Zautomatyzowany silnik zarządzania strukturą i unikalnymi identyfikatorami fabryk powiązanych bezpośrednio z Twoim kontem i subskrypcją.
          </p>
        </div>

        {/* Dynamic status widgets */}
        <div className="flex items-center gap-4 bg-neutral-950 p-4 rounded-2xl border border-neutral-900">
          <div className="text-right">
            <div className="text-xs text-neutral-500 font-mono">Dostępność Systemu</div>
            <div className="text-sm font-bold text-emerald-400 flex items-center gap-1.5 justify-end mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              ONLINE LOKALNE
            </div>
          </div>
        </div>
      </div>

      {/* Profile Overview (Soft / Hard Currency Ledger Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="ledger-cards">
        <div className="p-5 rounded-2xl border border-neutral-900 bg-neutral-950/60 backdrop-blur-md">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-mono font-bold uppercase">Plan Subskrypcji</span>
            <Layers className="h-4 w-4 text-neutral-500" />
          </div>
          <div className="text-2xl font-black text-white capitalize flex items-center gap-2">
            {profile?.tier}
            {profile?.tier === 'tycoon' && (
              <span className="text-[10px] bg-rose-500/10 text-rose-400 font-mono font-black border border-rose-500/30 px-2 py-0.5 rounded-md uppercase">
                UNLIMITED
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-500 mt-2 font-mono">Status: {profile?.isAutomated ? 'KLASTER AUTONOMICZNY (is_automated)' : 'TRYB RĘCZNY'}</p>
        </div>

        <div className="p-5 rounded-2xl border border-neutral-900 bg-neutral-950/60 backdrop-blur-md">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-mono font-bold uppercase">Kredyty Operacyjne</span>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {profile?.credits?.toLocaleString() || 0} <span className="text-xs">CR</span>
          </div>
          <p className="text-xs text-neutral-500 mt-2 font-mono">Waluta miekka (Soft Currency Ledger)</p>
        </div>

        <div className="p-5 rounded-2xl border border-neutral-900 bg-neutral-950/60 backdrop-blur-md">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-mono font-bold uppercase">Kryształy Nanitowe</span>
            <Gem className="h-4 w-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-400 font-mono">
            {profile?.naniteGems || 0} <span className="text-xs">GEMS</span>
          </div>
          <p className="text-xs text-neutral-500 mt-2 font-mono">Waluta twarda (Hard Currency Ledger)</p>
        </div>

        <div className="p-5 rounded-2xl border border-neutral-900 bg-neutral-950/60 backdrop-blur-md">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-mono font-bold uppercase">Aktywne Linie</span>
            <Cpu className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-400 font-mono">
            {profile?.activeLinesCount || 0} <span className="text-xs">/ {profile?.tier === 'tycoon' ? '10' : '2'}</span>
          </div>
          <p className="text-xs text-neutral-500 mt-2 font-mono">Obciążenie fizycznych rdzeni maszyn</p>
        </div>
      </div>

      {/* 🤖 CUSTOM MODULE: SYSTEM AGENTBROKER MONITOR PANELS */}
      <div className="rounded-3xl border border-neutral-900 bg-neutral-950/40 p-6 space-y-6" id="agent-broker-swarm-runtime-panel">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-neutral-900/60 pb-4 gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-rose-500/10 rounded-xl border border-rose-500/20 text-rose-400">
              <Sparkles className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white">AgentBroker Swarm Intelligence</h2>
                <span className="flex items-center gap-1 text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                  Monitorowanie Aktywne
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                Autonomiczny Agent Broker wyszukuje partie o statusie <span className="text-white font-mono bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800">COMPLETED</span>, pobiera trendy z modułu <strong className="text-rose-500">ZPulse</strong>, wylicza optymalną wycenę z Gemini API i automatycznie wystawia komponenty. Enriczuje także outreach przez Gmail API.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-manual-broker-scan"
              onClick={handleTriggerBrokerScan}
              disabled={isScanningBroker}
              className={`px-4 py-2 bg-rose-600/15 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer ${isScanningBroker ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <RefreshCw size={14} className={isScanningBroker ? 'animate-spin' : ''} />
              {isScanningBroker ? 'SKANOWANIE REJESTRÓW...' : 'SKANUJ I WYSTAW Z OPTYMALNĄ CENĄ'}
            </button>
          </div>
        </div>

        {/* Telemetry metrics row */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-900/80">
            <span className="text-[10px] uppercase font-mono text-neutral-500 tracking-wider">Status Agentury</span>
            <div className="text-base font-black text-white mt-1 flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-rose-500 animate-spin" style={{ animationDuration: '4s' }} />
              SWARM AUTONOMY
            </div>
            <p className="text-[10px] font-mono text-neutral-500 mt-1">Własne połączenia z API klienta</p>
          </div>

          <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-900/80">
            <span className="text-[10px] uppercase font-mono text-neutral-500 tracking-wider">Dopasowywanie Cen (Gemini)</span>
            <div className="text-base font-black text-rose-400 mt-1 font-mono">
              Z-Pulse Grounding
            </div>
            <p className="text-[10px] font-mono text-neutral-500 mt-1">Strojenie cen pod żywe trendy</p>
          </div>

          <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-900/80">
            <span className="text-[10px] uppercase font-mono text-neutral-500 tracking-wider">Nieobsługiwane Partie (COMPLETED)</span>
            <div className="text-base font-black text-amber-500 mt-1 font-mono">
              {brokerStatus?.unlistedCompleted !== undefined ? brokerStatus.unlistedCompleted : 0} <span className="text-[10px] text-neutral-500">szt.</span>
            </div>
            <p className="text-[10px] font-mono text-neutral-500 mt-1">Oczekuje na alokację brokera</p>
          </div>

          <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-900/80">
            <span className="text-[10px] uppercase font-mono text-neutral-500 tracking-wider">Wystawione przez Agenta</span>
            <div className="text-base font-black text-emerald-400 mt-1 font-mono">
              {brokerStatus?.listedByBrokerCount !== undefined ? brokerStatus.listedByBrokerCount : 0} <span className="text-[10px] text-neutral-500">szt.</span>
            </div>
            <p className="text-[10px] font-mono text-neutral-500 mt-1">Aktywne oferty handlowe AI</p>
          </div>
        </div>

        {/* Dynamic Inner Swarm Grids */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Column 1: Live Trends from ZPulse (Grounding Model context) */}
          <div className="space-y-3 lg:border-r lg:border-neutral-900 lg:pr-6">
            <h4 className="text-xs font-bold text-neutral-300 font-mono flex items-center gap-2">
              <TrendingUp size={14} className="text-rose-500" />
              Sygnały Rynkowe (ZPulse Context)
            </h4>
            <p className="text-[11px] text-neutral-500">
              Poniższe wektory momentum są wstrzykiwane bezpośrednio do promptów Gemini w celu optymalizacji i modelowania marży w czasie rzeczywistym.
            </p>

            <div className="space-y-2 mt-4">
              {brokerStatus?.zpulseTrends && brokerStatus.zpulseTrends.length > 0 ? (
                brokerStatus.zpulseTrends.map((trend: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl border border-neutral-900 bg-neutral-950/60 leading-tight space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-white max-w-[150px] truncate">{trend.topic}</span>
                      <span className="text-[10px] font-mono text-rose-500 bg-rose-500/5 px-1.5 py-0.5 rounded border border-rose-500/10">
                        x{trend.viralCoefficient}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-neutral-500 font-mono">
                      <span>Portal: {trend.portal}</span>
                      <span className="text-neutral-400">Momentum: {trend.momentum}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center p-6 bg-neutral-950/20 border border-dashed border-neutral-900 rounded-xl text-xs text-neutral-500 font-mono">
                  Brak aktywnych trendów w pamięci podręcznej.
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Agent Broker listings & pricing rationale */}
          <div className="space-y-3 lg:col-span-2 flex flex-col justify-between">
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-neutral-300 font-mono flex items-center gap-2">
                <ShoppingCart size={14} className="text-purple-500" />
                Dystrybucja Handlowa AI (Marketplace Offers)
              </h4>
              <p className="text-[11px] text-neutral-500">
                Pozycje technologiczne wyliczone i opublikowane na wewnętrznym rynku ze szczegółowym modelowaniem marżowym.
              </p>

              <div className="space-y-2.5 max-h-[220px] overflow-y-auto custom-scrollbar pr-1 mt-4">
                {brokerStatus?.brokerListings && brokerStatus.brokerListings.length > 0 ? (
                  brokerStatus.brokerListings.map((item: any, idx: number) => (
                    <div key={idx} className="p-3.5 rounded-xl border border-neutral-900 bg-neutral-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-left">
                      <div className="space-y-1 max-w-[70%]">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white">{item.itemName}</span>
                          <span className="text-[9px] font-mono bg-purple-500/10 border border-purple-500/20 text-purple-400 px-1.5 py-0.2 rounded">
                            AGENT PRICED
                          </span>
                        </div>
                        {item.reasoning && (
                          <p className="text-[10px] text-neutral-400 font-mono bg-neutral-950 border border-neutral-900/60 p-1.5 rounded-md leading-relaxed">
                            <span className="text-rose-400 font-bold uppercase text-[8px] tracking-wider block mb-0.5">Analiza Gemini API:</span>
                            {item.reasoning}
                          </p>
                        )}
                        <p className="text-[10px] text-neutral-600 font-mono">Wystawiono: {item.listedAt ? new Date(item.listedAt).toLocaleString() : 'Niedawno'}</p>
                      </div>

                      <div className="text-right sm:self-center flex flex-col items-end">
                        <span className="text-rose-500 font-bold font-mono text-sm">{item.priceCredits?.toLocaleString()} CR</span>
                        <span className="text-[9px] uppercase tracking-wider text-emerald-400 font-mono mt-1">
                          STATUS: ACTIVE
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 bg-neutral-950/25 border border-dashed border-neutral-900 rounded-xl text-neutral-500 text-xs font-mono space-y-2">
                    <p>Brak aktywnych ofert wygenerowanych przez Agenta.</p>
                    <p className="text-[10px] text-neutral-600 max-w-xs mx-auto text-center">
                      Uruchom fabrykę lub naciśnij "OVERCLOCK", aby ukończyć cykl produkcyjny, a Agent Broker natychmiast wyceni i umieści komponent w tym ujednoliconym panelu.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Micro logging terminal */}
            <div className="mt-4 p-3 bg-neutral-950 rounded-xl border border-neutral-900/60 leading-normal space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
                  LOGI SYSTEMOWE SWARM AGENTURA
                </span>
                <span>TELEMETRIA ACTIVE</span>
              </div>
              <div className="max-h-[100px] overflow-y-auto font-mono text-[10px] text-neutral-400 space-y-1.5 custom-scrollbar pr-1">
                {brokerStatus?.brokerLogs && brokerStatus.brokerLogs.length > 0 ? (
                  brokerStatus.brokerLogs.map((log: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-1 justify-between py-0.5 border-b border-neutral-900/20">
                      <span className="text-neutral-500 flex-shrink-0">[{log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : 'NOW'}]</span>
                      <span className="text-white text-left flex-1 pl-2 truncate">{log.message}</span>
                      <span className={`text-[9px] uppercase font-bold text-center px-1 rounded flex-shrink-0 ${log.type === 'outreach' ? 'text-blue-400 bg-blue-400/5' : 'text-purple-400 bg-purple-400/5'}`}>
                        {log.type}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-neutral-600 text-[10px] text-center">Czekam na zdarzenia produkcyjne w klastrze...</div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="operations-layout">
        <div className="lg:col-span-2 space-y-6">
          {/* List of Registered Factories */}
          <div className="p-6 rounded-3xl border border-neutral-900 bg-neutral-950/40 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Cpu className="h-5 w-5 text-rose-500 animate-pulse" />
              Wykaz Zarejestrowanych Jednostek
            </h3>
            
            <div className="space-y-4">
              {factories.map((factory) => (
                <div key={factory.factoryId} className="p-5 rounded-2xl border border-neutral-900 bg-neutral-950/80 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-base">{factory.factoryName}</h4>
                        <span className="text-[10px] font-mono bg-neutral-900 text-neutral-400 border border-neutral-800 px-2 py-0.5 rounded">
                          ID: {factory.factoryId}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 font-mono mt-1">Aktualna operacja: {factory.currentProduct}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleOverclock(factory.factoryId)}
                        disabled={actionLoading}
                        className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-lg text-xs font-mono font-bold hover:bg-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Zap size={14} className="animate-bounce" />
                        OVERCLOCK (50 GEMS)
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-neutral-500 font-mono">
                      <span>Postęp procesu produkcyjnego</span>
                      <span>{factory.progressPercentage}%</span>
                    </div>
                    <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden border border-neutral-800">
                      <motion.div 
                        className="bg-gradient-to-r from-rose-500 to-amber-500 h-full" 
                        initial={{ width: 0 }}
                        animate={{ width: `${factory.progressPercentage}%` }}
                        transition={{ duration: 0.8 }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono text-neutral-500">
                    <div className="bg-neutral-900/50 p-2 rounded-lg border border-neutral-900">
                      <div>Mnożnik Prędkości</div>
                      <div className="text-white font-bold mt-1 text-xs">x{factory.speedMultiplier.toFixed(1)}</div>
                    </div>
                    <div className="bg-neutral-900/50 p-2 rounded-lg border border-neutral-900">
                      <div>Automatyzacja</div>
                      <div className="text-emerald-400 font-bold mt-1 text-xs">
                        {factory.isAutomated ? "AKTYWNA" : "WYŁĄCZONA"}
                      </div>
                    </div>
                    <div className="bg-neutral-900/50 p-2 rounded-lg border border-neutral-900">
                      <div>Typ Planu</div>
                      <div className="text-purple-400 font-bold mt-1 text-xs uppercase">{factory.tier}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Typhoon Only Marketplace trade module */}
          {profile?.tier === 'tycoon' ? (
            <div className="p-6 rounded-3xl border border-neutral-900 bg-neutral-950/40 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-purple-500" />
                  Kupiecki Rynek Transakcyjny (Tycoon Trade Ledger)
                </h3>
                <span className="text-[10px] font-mono bg-purple-500/10 border border-purple-500/30 text-purple-400 px-2.5 py-1 rounded-full uppercase font-black">
                  TYCOON BENEFIT
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Seeded marketplace listings */}
                <div className="space-y-3">
                  <div className="text-xs text-neutral-500 font-mono">Dostępne Oferty w Klastrze:</div>
                  <div className="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar">
                    {listings.map((item, idx) => (
                      <div key={idx} className="p-3 rounded-xl border border-neutral-900 bg-neutral-950 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-white">{item.itemName}</p>
                          <p className="text-[10px] text-neutral-500">Sprzedający: {item.seller || 'Midas_Industrial'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-emerald-400 font-mono font-bold">{item.priceCredits.toLocaleString()} CR</p>
                          <button 
                            onClick={() => {
                              if ((profile?.credits || 0) < item.priceCredits) {
                                toast.error("Brak wystarczających kredytów operacyjnych na to zlecenie.");
                                return;
                              }
                              toast.success(`Zlecono transfer kredytów. Zakupiono pomyślnie "${item.itemName}"!`);
                            }}
                            className="text-[10px] underline text-rose-500 hover:text-rose-400 mt-1 cursor-pointer"
                          >
                            Złóż Ofertę
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Form to list items */}
                <form onSubmit={handleListOnMarketplace} className="p-4 rounded-xl border border-neutral-900 bg-neutral-950/60 space-y-4">
                  <div className="text-xs text-neutral-500 font-mono">Wystaw przedmioty technologiczne:</div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] text-neutral-500 uppercase font-mono mb-1">Nazwa Podzespołu</label>
                      <input 
                        type="text" 
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        placeholder="np. Skondensowany Kondensator Fuzji"
                        className="w-full bg-neutral-950 border border-neutral-900 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-neutral-500 uppercase font-mono mb-1">Cena Kredytów (Credits)</label>
                      <input 
                        type="number" 
                        value={newItemPrice}
                        onChange={(e) => setNewItemPrice(e.target.value)}
                        placeholder="np. 150000"
                        className="w-full bg-neutral-950 border border-neutral-900 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500/50"
                      />
                    </div>

                    <button 
                      type="submit"
                      disabled={actionLoading}
                      className="w-full py-2 bg-gradient-to-r from-purple-600 to-rose-600 text-white rounded-lg text-xs font-mono font-bold hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      WYSTAW NA GLOBALNY RYNEK
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-3xl border border-neutral-900 bg-neutral-950/20 text-center space-y-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-md z-10 flex flex-col items-center justify-center p-6 space-y-4">
                <Lock className="h-10 w-10 text-neutral-500 animate-pulse" />
                <h4 className="text-sm font-bold text-neutral-300">Globalny Rynek Handlowy Zablokowany</h4>
                <p className="text-xs text-neutral-500 max-w-md">
                  Twój obecny plan ({profile?.tier}) nie obsługuje integracji marketplacu. Zaktualizuj system do poziomu <span className="text-purple-400 font-bold uppercase">TYCOON</span>, aby handlować zaawansowanymi komponentami i technologią na globalnym rynku.
                </p>
                <button 
                  onClick={() => toast.info("Skontaktuj się ze swoim menedżerem konta OMEGA w celu natychmiastowego upgradu.")}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold rounded-lg transition-all cursor-pointer"
                >
                  AKTUALIZUJ PLAN TERAZ
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Form and info panel */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl border border-neutral-900 bg-neutral-950/40 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Plus className="h-5 w-5 text-rose-500" />
              Rejestracja Nowej Jednostki
            </h3>

            <form onSubmit={handleRegisterFactory} className="space-y-4">
              <div>
                <label className="block text-[10px] text-neutral-500 uppercase font-mono mb-1">Unikalny Identyfikator (factoryId)</label>
                <input 
                  type="text" 
                  value={newFactoryId}
                  onChange={(e) => setNewFactoryId(e.target.value)}
                  placeholder="np. quantum_reactor_01"
                  className="w-full bg-neutral-950 border border-neutral-900 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500/50"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] text-neutral-500 uppercase font-mono mb-1">Nazwa Jednostki Produkcyjnej</label>
                <input 
                  type="text" 
                  value={newFactoryName}
                  onChange={(e) => setNewFactoryName(e.target.value)}
                  placeholder="np. Zakład Krystalizacji Molekularnej"
                  className="w-full bg-neutral-950 border border-neutral-900 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500/50"
                  required
                />
              </div>

              <div className="p-3 bg-neutral-950 border border-neutral-900 rounded-xl flex items-start gap-2 text-[10px] text-neutral-500 leading-normal">
                <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                <span>
                  Autonatyczny system przypisze fabryce status <span className="text-emerald-400 font-bold">is_automated: true</span> oraz parametry wydajności zgodne z Twoim tierem <strong>({profile?.tier})</strong>.
                </span>
              </div>

              <button 
                type="submit"
                disabled={actionLoading}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-mono font-bold active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                AUTORYZUJ REJESTRACJĘ W WALECIE
              </button>
            </form>
          </div>

          <div className="p-6 rounded-3xl border border-neutral-900 bg-neutral-950/40 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Przewodnik po Poziomach (Tiers)</h3>
            <div className="space-y-3 text-xs leading-normal">
              <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-900">
                <div className="flex items-center justify-between font-bold text-white mb-1">
                  <span>FREE PLAN</span>
                  <span className="text-[10px] font-mono bg-neutral-900 text-neutral-500 px-1.5 py-0.5 rounded">LIMIT: 2</span>
                </div>
                <p className="text-neutral-500 text-[11px]">Brak automatyzacji (is_automated: false), standardowa wydajność. Brak dostępu do Globalnego Rynku Trade Ledger.</p>
              </div>

              <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-900">
                <div className="flex items-center justify-between font-bold text-white mb-1">
                  <span className="text-blue-400">MANAGER PLAN</span>
                  <span className="text-[10px] font-mono bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded">LIMIT: 5</span>
                </div>
                <p className="text-neutral-500 text-[11px]">Automatyczne zarządzanie (is_automated: true), x2.0 speed multiplier. Zlecenia bezwysiłkowe na poziomie średnim.</p>
              </div>

              <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-950">
                <div className="flex items-center justify-between font-bold text-white mb-1">
                  <span className="text-purple-400">TYCOON PLAN</span>
                  <span className="text-[10px] font-mono bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded">LIMIT: 10</span>
                </div>
                <p className="text-neutral-500 text-[11px]">Klaster zoptymalizowany (is_automated: true), x3.5 speed multiplier. Pełny dostęp do handlu, transakcji oraz Globalnego Rynku podzespołów.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
