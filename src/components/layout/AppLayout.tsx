import type { ReactNode } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  Network, 
  Cpu,
  Radar, 
  Mic2, 
  Gauge, 
  Flame, 
  ShieldAlert, 
  Video, 
  BrainCircuit, 
  Eye,
  LogOut,
  User as UserIcon,
  Menu,
  X,
  Settings as SettingsIcon,
  Search,
  Bot,
  CheckSquare,
  ChevronRight,
  Share2,
  Mail,
  Crosshair,
  Award,
  Target,
  Cylinder,
  StickyNote,
  Calendar,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { logout } from '../../lib/auth';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import Fuse from 'fuse.js';
import { SystemHealth } from './SystemHealth';
import { FloatingStatusIndicator } from './FloatingStatusIndicator';

import type { User } from 'firebase/auth';

interface AppLayoutProps {
  children: ReactNode;
  user: User;
}

const navigation = [
  { name: 'Dashboard', to: '/dashboard', icon: Network, exact: true },
  { name: 'Analiza Social Media', to: '/social-media', icon: Network },
  { name: 'Autonomiczny Dystrybutor', to: '/distributor', icon: Network },
  { name: 'AI Inbound & Closer', to: '/closer', icon: Crosshair },
  { name: 'Agenci Zwiadowcy', to: '/scouts', icon: Radar },
  { name: 'Zautomatyzowany Podcast', to: '/podcast', icon: Mic2 },
  { name: 'Tachometr A/B/C', to: '/tachometer', icon: Gauge },
  { name: 'Zapalnik (CRM)', to: '/crm', icon: Flame },
  { name: 'Skaner Leadów (URL)', to: '/scraper', icon: Radar },
  { name: 'Detektor Grup FB (PRO)', to: '/facebook-leads', icon: Share2 },
  { name: 'Tarcza Ochronna', to: '/shield', icon: ShieldAlert },
  { name: 'Generator VSL', to: '/vsl-generator', icon: Video },
  { name: 'Generatory PRO', to: '/pro-generators', icon: Sparkles },
  { name: 'Rejestr Fabryk (Factory)', to: '/factory-registry', icon: Cylinder },
  { name: 'Pętle Dopaminowe', to: '/dopamine-loops', icon: BrainCircuit },
  { name: 'Z-Pulse Trend Analyzer', to: '/z-pulse', icon: Radar },
  { name: 'OMEGA Pro Insights', to: '/pro-dashboard', icon: Award },
  { name: 'Oko Opatrzności', to: '/pricing', icon: Eye },
  { name: 'Kokpit Automatyzacji', to: '/automation', icon: BrainCircuit },
  { name: 'Poczta (Gmail)', to: '/gmail', icon: Mail },
  { name: 'Google Chat', to: '/chat', icon: MessageSquare },
  { name: 'Zadania (Google Tasks)', to: '/tasks', icon: CheckSquare },
  { name: 'Notatki (Google Keep)', to: '/keep', icon: StickyNote },
  { name: 'Kalendarz (Google Calendar)', to: '/calendar', icon: Calendar },
  { name: 'Stitch Uplink', to: '/stitch', icon: Cpu },
  { name: 'Nekropolis Agharta', to: '/nekropolis', icon: Target },
  { name: 'Zwierciadło Omega', to: '/omega-console', icon: Eye },
  { name: 'OMEGA ABM Predictor', to: '/omega-abm', icon: Crosshair },
  { name: '🤖 Zenek — AI Agent', to: '/agent', icon: Bot },
  { name: 'Konfiguracja Agentów', to: '/settings', icon: SettingsIcon },
];

const mockSearchData = [
  ...navigation.map(n => ({ id: n.to, type: 'module', title: n.name, path: n.to, icon: n.icon })),
  { id: 't1', type: 'task', title: 'Zatrzymać opuszczanie koszyka', path: '/dashboard', icon: CheckSquare },
  { id: 't2', type: 'task', title: 'Strategiczne planowanie sekwencji post-zakupowej', path: '/dashboard', icon: CheckSquare },
  { id: 't3', type: 'task', title: 'Przejrzeć logi Zwiadowcy z Reddita', path: '/dashboard', icon: CheckSquare },
  { id: 't4', type: 'task', title: 'Aktualizacja archiwalnych grafik', path: '/dashboard', icon: CheckSquare },
  { id: 'l1', type: 'lead', title: 'Jan Kowalski - Porzucony koszyk', path: '/crm', icon: Flame },
  { id: 's1', type: 'script', title: 'Skrypt VSL: Zwiększenie Konwersji', path: '/vsl-generator', icon: Video },
];

import { MobileActionSheet } from './MobileActionSheet';

export function AppLayout({ children, user }: AppLayoutProps) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState('');

  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const [hyperFocus, setHyperFocus] = useState<boolean>(() => {
    return localStorage.getItem('omega_hyper_focus') === 'true';
  });

  const toggleHyperFocus = () => {
    setHyperFocus(prev => {
      const next = !prev;
      localStorage.setItem('omega_hyper_focus', String(next));
      if (next) {
        toast.success("Aktywowano Tryb Hyper-Focus. Poboczne menu i nagłówki zostały wygaszone dla maksymalnej koncentracji.", {
          icon: "🎯"
        });
      } else {
        toast.info("Tryb Hyper-Focus wyłączony. Przywrócono pełną widoczność interfejsu.", {
          icon: "👁️"
        });
      }
      return next;
    });
  };
  const paletteInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const fuse = useMemo(() => {
    return new Fuse(mockSearchData, {
      keys: ['title', 'type'],
      threshold: 0.45,
    });
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleResultClick = useCallback((path: string) => {
    navigate(path);
    setPaletteQuery('');
    setIsCommandPaletteOpen(false);
  }, [navigate]);

  const paletteResults = useMemo(() => {
    if (!paletteQuery.trim()) {
      return mockSearchData.slice(0, 6);
    }
    return fuse.search(paletteQuery).map(res => res.item).slice(0, 8);
  }, [paletteQuery, fuse]);

  // Autofocus input when command palette opens
  useEffect(() => {
    if (isCommandPaletteOpen) {
      setTimeout(() => {
        paletteInputRef.current?.focus();
      }, 50);
    }
  }, [isCommandPaletteOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Toggle palette on Ctrl+K / Cmd+K
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
        setPaletteQuery('');
        setSelectedIndex(0);
      }
      
      if (!isCommandPaletteOpen) return;

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedIndex(prev => (prev + 1) % Math.max(1, paletteResults.length));
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedIndex(prev => (prev - 1 + paletteResults.length) % Math.max(1, paletteResults.length));
      } else if (event.key === 'Enter') {
        event.preventDefault();
        if (paletteResults[selectedIndex]) {
          handleResultClick(paletteResults[selectedIndex].path);
        }
      } else if (event.key === 'Escape') {
        event.preventDefault();
        setIsCommandPaletteOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCommandPaletteOpen, paletteResults, selectedIndex, handleResultClick]);

  const [countdownText, setCountdownText] = useState('00:00:00');

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const target = new Date();
      target.setHours(21, 0, 0, 0);
      
      let diffMs = target.getTime() - now.getTime();
      if (diffMs < 0) {
        // If past 21:00, count down to next day's 21:00
        target.setDate(target.getDate() + 1);
        diffMs = target.getTime() - now.getTime();
      }
      
      const secsTotal = Math.floor(diffMs / 1000);
      const hrs = Math.floor(secsTotal / 3600);
      const mins = Math.floor((secsTotal % 3600) / 60);
      const secs = secsTotal % 60;
      
      const formatted = [
        String(hrs).padStart(2, '0'),
        String(mins).padStart(2, '0'),
        String(secs).padStart(2, '0')
      ].join(':');
      
      setCountdownText(formatted);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-black text-gray-100 flex overflow-hidden selection:bg-rose-500/30">
      
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-neutral-950 border-r border-neutral-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto lg:flex lg:w-72 lg:flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className={`flex items-center justify-between h-16 px-6 border-b border-neutral-800 bg-neutral-950/50 transition-all duration-300 ${
          hyperFocus ? 'opacity-35 hover:opacity-100' : ''
        }`}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 flex-shrink-0 bg-rose-600 rounded flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(225,29,72,0.5)]">
              Ω
            </div>
            <span className="text-sm font-bold tracking-wider text-rose-50 flex items-center gap-2">
              W.F.P. (Wirtualna Fabryka Produktów)
              <Bot size={18} className="text-rose-400 flex-shrink-0" />
            </span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white flex-shrink-0">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar">
          <nav className="space-y-1 block">
            {navigation.map((item) => (
              <div key={item.name} className="group relative">
                <NavLink
                  to={item.to}
                  end={item.exact}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) => {
                    const focusDimming = hyperFocus 
                      ? (isActive ? 'opacity-100 ring-1 ring-rose-500/20' : 'opacity-15 hover:opacity-65 filter blur-[0.25px] hover:blur-none')
                      : '';
                    return `flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200 border pr-10 ${focusDimming} ${
                      isActive
                        ? 'bg-rose-500/10 text-rose-300 border-rose-500/40 shadow-[0_0_15px_rgba(225,29,72,0.3)]'
                        : 'border-transparent text-gray-400 hover:bg-neutral-900 hover:text-gray-200'
                    }`;
                  }}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors duration-200`}
                    aria-hidden="true"
                  />
                  <span className="truncate flex-1 text-left">{item.name}</span>
                </NavLink>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const url = `${window.location.origin}${item.to}`;
                    navigator.clipboard.writeText(url);
                    toast.success(`Skopiowano link do modułu: ${item.name}`);
                  }}
                  title="Udostępnij (Kopiuj link)"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-800/80 hover:bg-neutral-700 hover:text-rose-400 text-neutral-400 rounded z-10 lg:flex"
                >
                  <Share2 size={14} />
                </button>
              </div>
            ))}
          </nav>
        </div>

        {user && (
          <div className={`p-4 border-t border-neutral-800 bg-neutral-950/50 transition-all duration-300 ${
            hyperFocus ? 'opacity-15 hover:opacity-85 filter blur-[0.2px] hover:blur-none' : ''
          }`}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {user.photoURL ? (
                  <img
                    className="h-10 w-10 rounded-full border mb border-neutral-700"
                    src={user.photoURL}
                    alt=""
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-neutral-800 flex items-center justify-center">
                    <UserIcon size={20} className="text-gray-400" />
                  </div>
                )}
              </div>
              <div className="ml-3 truncate">
                <p className="text-sm font-medium text-white truncate">{user.displayName || 'Operator'}</p>
                <p className="text-xs font-medium text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-4 w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-neutral-400 bg-neutral-900 rounded-md hover:bg-neutral-800 hover:text-white transition-colors"
            >
              <LogOut size={16} />
              Wyloguj system
            </button>
          </div>
        )}
      </motion.div>

      {/* Main content */}
      <div className={`flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300 ${ hyperFocus ? 'bg-neutral-950' : 'bg-black bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-neutral-900/40 via-black to-black' }`} onClick={() => setIsCommandPaletteOpen(false)}>
        <header className="bg-neutral-950 border-b border-neutral-800 h-16 flex items-center px-4 lg:px-8 justify-between lg:justify-start">
          <div className={`flex items-center gap-2 lg:hidden transition-all ${
            hyperFocus ? 'opacity-30 hover:opacity-100' : ''
          }`}>
            <div className="w-8 h-8 flex-shrink-0 bg-rose-600 rounded flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(225,29,72,0.5)]">
              Ω
            </div>
            <span className="text-sm font-bold tracking-wider text-rose-50 hidden sm:flex items-center gap-2">
              W.F.P. (Wirtualna Fabryka Produktów)
              <Bot size={16} className="text-rose-400 flex-shrink-0" />
            </span>
          </div>

          <div 
            className={`flex-1 max-w-2xl mx-4 lg:mx-0 relative cursor-pointer transition-all duration-300 ${
              hyperFocus ? 'opacity-15 hover:opacity-100 focus-within:opacity-100' : ''
            }`} 
            onClick={() => {
              setIsCommandPaletteOpen(true);
              setPaletteQuery('');
              setSelectedIndex(0);
            }}
          >
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-neutral-500 group-focus-within:text-rose-500 transition-colors" />
              </div>
              <div className="block w-full pl-10 pr-3 py-2 border border-neutral-900 rounded-lg leading-5 bg-neutral-950 text-neutral-400 text-sm font-sans transition-all select-none">
                Szukaj w systemie (Naciśnij <kbd className="bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded text-neutral-450 font-mono text-xs ml-1 mr-1">Ctrl+K</kbd>)...
              </div>
            </div>
          </div>

          <div className={`hidden md:flex items-center gap-2 border-l border-neutral-900 h-10 px-4 ml-auto flex-shrink-0 select-none transition-all duration-300 ${
            hyperFocus ? 'opacity-15 hover:opacity-100' : ''
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-[10px] font-mono font-bold tracking-wider text-rose-500 uppercase">
              OPERACJA ZRZUT:
            </span>
            <span className="text-white font-mono font-black text-xs bg-rose-950/30 border border-rose-955/50 border-rose-950/50 px-2 py-0.5 rounded-md">
              {countdownText}
            </span>
          </div>

          <div className={`transition-all duration-300 ${hyperFocus ? 'opacity-15 hover:opacity-100' : ''}`}>
            <SystemHealth />
          </div>

          {/* PRZEŁĄCZNIK HYPER-FOCUS */}
          <div className="flex items-center gap-2 px-4 border-l border-neutral-900 h-10 flex-shrink-0">
            <button
              onClick={toggleHyperFocus}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-mono font-bold transition-all duration-300 cursor-pointer ${
                hyperFocus
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.35)]'
                  : 'bg-neutral-900/50 text-neutral-400 border-neutral-800 hover:text-white hover:border-neutral-700'
              }`}
              title="Przełącz Tryb Super-Skupienia (Zredukuj nadmiarowe bodźce)"
            >
              <Target size={12} className={hyperFocus ? 'animate-spin text-amber-400' : 'text-neutral-450'} style={{ animationDuration: '6s' }} />
              <span className="hidden sm:inline">
                {hyperFocus ? 'HYPER-FOCUS: WŁ' : 'HYPER-FOCUS'}
              </span>
              <span className={`w-1.5 h-1.5 rounded-full ${hyperFocus ? 'bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,1)]' : 'bg-neutral-600'}`} />
            </button>
          </div>

          <button onClick={() => setSidebarOpen(true)} className="text-gray-400 hover:text-white lg:hidden">
            <Menu size={24} />
          </button>
        </header>

        <FloatingStatusIndicator />

        <main className={`flex-1 relative z-0 overflow-y-auto focus:outline-none transition-all duration-500 ${
          hyperFocus ? 'bg-neutral-950 selection:bg-amber-500/20' : ''
        }`}>
          {hyperFocus && (
            <div className="absolute inset-0 pointer-events-none z-10 border-2 border-amber-500/5 shadow-[inset_0_0_120px_rgba(0,0,0,0.95)] animate-fade-in" />
          )}
          <motion.div 
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 sm:p-6 lg:p-8 relative ${hyperFocus ? 'z-20' : ''}`}
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Command Palette Overlay */}
      <AnimatePresence>
        {isCommandPaletteOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[200] flex items-start justify-center pt-24 px-4"
            onClick={() => setIsCommandPaletteOpen(false)}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -10 }}
              transition={{ duration: 0.15 }}
              className="relative w-full max-w-2xl bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-800">
                <Search className="h-4 w-4 text-neutral-500 flex-shrink-0" />
                <input
                  ref={paletteInputRef}
                  type="text"
                  value={paletteQuery}
                  onChange={(e) => { setPaletteQuery(e.target.value); setSelectedIndex(0); }}
                  placeholder="Szukaj modułu, zadania, leada..."
                  className="flex-1 bg-transparent border-0 ring-0 focus:outline-none text-sm text-white placeholder-neutral-500 font-sans"
                  autoComplete="off"
                />
                <kbd className="bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded text-neutral-500 font-mono text-[10px]">ESC</kbd>
              </div>

              {/* Results */}
              <div className="max-h-80 overflow-y-auto py-2">
                {paletteResults.length === 0 ? (
                  <div className="px-4 py-8 text-center text-neutral-500 text-sm font-sans">Brak wyników</div>
                ) : (
                  paletteResults.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleResultClick(item.path)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors cursor-pointer text-left ${
                          idx === selectedIndex
                            ? 'bg-rose-500/10 text-rose-300'
                            : 'text-neutral-300 hover:bg-neutral-900'
                        }`}
                      >
                        <Icon size={15} className="flex-shrink-0 text-neutral-500" />
                        <span className="flex-1 truncate font-sans">{item.title}</span>
                        <span className="text-[10px] font-mono text-neutral-600 uppercase">{item.type}</span>
                        <ChevronRight size={13} className="text-neutral-600 flex-shrink-0" />
                      </button>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="p-3 bg-neutral-950 border-t border-neutral-900 flex items-center justify-between text-[10px] text-neutral-500 font-sans font-medium px-4">
                <div className="flex items-center gap-3">
                  <span>
                    <kbd className="bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded text-neutral-400 font-mono text-[9px] mr-1">↑↓</kbd>
                    Nawigacja
                  </span>
                  <span>
                    <kbd className="bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded text-neutral-400 font-mono text-[9px] mr-1">↵ Enter</kbd>
                    Wybierz
                  </span>
                </div>
                <span>
                  <kbd className="bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded text-neutral-400 font-mono text-[9px] mr-1">ESC</kbd>
                  Zamknij
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <MobileActionSheet />
    </div>
  );
}
