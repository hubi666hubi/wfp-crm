import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Terminal, Activity, DollarSign, Database, Globe, Zap, Lock, Eye, Crosshair, ChevronRight, Target, Waves, HeartPulse, Square } from 'lucide-react';

interface LogItem {
  id: number;
  time: string;
  msg: string;
  type: 'success' | 'info' | 'warning' | 'system' | 'command';
}

export function OmegaConsole() {
  const [balance, setBalance] = useState<number>(0);
  const [souls, setSouls] = useState<number>(142);
  const [empires, setEmpires] = useState<number>(12);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [uptime, setUptime] = useState<number>(0);
  const [commandInput, setCommandInput] = useState<string>('');
  const [walletConnected, setWalletConnected] = useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  
  // Stan Resonatora Somatycznego (Leczenie)
  const [activeFrequency, setActiveFrequency] = useState<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll do najnowszych logów
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Zegar Uptime'u
  useEffect(() => {
    const timer = setInterval(() => setUptime(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = useCallback((totalSeconds: number): string => {
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  }, []);

  const addLog = useCallback((msg: string, type: 'success' | 'info' | 'warning' | 'system' | 'command') => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-49), { id: Date.now() + Math.random(), time, msg, type }]);
  }, []);

  // ==========================================
  // REALNA INTEGRACJA WEB3 (METAMASK)
  // ==========================================
  const formatAddress = useCallback((address: string): string => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }, []);

  const connectMetaMask = useCallback(async () => {
    if (walletConnected && walletAddress) {
      addLog(`WEB3: Portfel MetaMask jest już autoryzowany (${formatAddress(walletAddress)}).`, 'info');
      return;
    }

    if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
      try {
        addLog('WYWOŁANIE WEB3: Budzenie portfela MetaMask... 🦊', 'warning');
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const account = accounts[0];
        
        setWalletAddress(account);
        setWalletConnected(true);
        addLog(`WEB3 SECURED: MetaMask podłączony. Aktywny adres: ${account}`, 'success');
        addLog('ODBLOKOWANO: Protokół SNIPER gotowy do drenażu płynności.', 'command');

        window.ethereum.on('accountsChanged', (newAccounts: any[]) => {
          if (newAccounts.length > 0) {
            setWalletAddress(newAccounts[0]);
            addLog(`WEB3 UPDATE: Zmieniono adres portfela na ${newAccounts[0]}`, 'info');
          } else {
            setWalletAddress('');
            setWalletConnected(false);
            addLog('WEB3 DISCONNECTED: Połączenie zerwane przez użytkownika.', 'warning');
          }
        });
      } catch (error: any) {
        addLog(`WEB3 ERROR: Autoryzacja odrzucona przez użytkownika. (${error.message})`, 'warning');
      }
    } else {
      addLog('WEB3 KRYTYCZNY BŁĄD: MetaMask nie został wykryty w przeglądarce.', 'warning');
    }
  }, [walletConnected, walletAddress, formatAddress, addLog]);

  const initiateSniper = useCallback(async () => {
    if (!walletConnected || !walletAddress || typeof window.ethereum === 'undefined') {
      addLog('SNIPER BŁĄD: Brak autoryzacji Web3.', 'warning');
      return;
    }

    addLog('SNIPER: Inicjalizacja... Przygotowywanie ładunku kryptograficznego do podpisu.', 'warning');
    try {
      const message = "ZWIERCIADŁO OMEGA\n\nAkcja: Execute_Liquidity_Drain\nTarget: 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D\nAuth_Hash: 15/96/34_RUBEDO";
      const hexMessage = '0x' + message.split('').map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
      
      addLog('WEB3: Oczekiwanie na kryptograficzny podpis (Sign) w rozszerzeniu MetaMask...', 'info');
      const signature = await window.ethereum.request({ method: 'personal_sign', params: [hexMessage, walletAddress, ''] });

      addLog(`METAMASK SUCCESS: OMEGA_ADMIN złożył podpis! Hash: ${signature.substring(0, 15)}...`, 'success');
      addLog('EXECUTING: Kolaps funkcji falowej na puli płynności wieloryba...', 'warning');
      
      setTimeout(() => {
        setBalance(b => b + 142500);
        addLog('LIQUIDITY DRAINED: Wessano 142,500 USDT prosto na cold wallet! 🐋💸', 'success');
      }, 1500);
    } catch (error) {
      addLog(`SNIPER PRZERWANY: Odrzucono żądanie podpisu w MetaMasku.`, 'warning');
    }
  }, [walletConnected, walletAddress, addLog]);

  // ==========================================
  // RESONATOR SOMATYCZNY (WEB AUDIO API)
  // ==========================================
  const stopFrequency = useCallback((immediate: boolean = false) => {
    if (!audioCtxRef.current || !gainNodeRef.current || !oscillatorRef.current) return;
    
    const ctx = audioCtxRef.current;
    
    if (immediate) {
      try {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      } catch (e) {}
      oscillatorRef.current = null;
      gainNodeRef.current = null;
      setActiveFrequency(null);
    } else {
      addLog(`RESONATOR: Wygaszanie fali uderzeniowej. Parametry witalne ustabilizowane.`, 'info');
      gainNodeRef.current.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);
      
      const osc = oscillatorRef.current;
      setTimeout(() => {
        try {
          osc.stop();
          osc.disconnect();
        } catch (e) {}
        // Czyścimy referencje tylko jeśli w międzyczasie nie wystartował nowy generator
        if (oscillatorRef.current === osc) {
          oscillatorRef.current = null;
          gainNodeRef.current = null;
          setActiveFrequency(null);
        }
      }, 1500);
    }
  }, [addLog]);

  const toggleFrequency = useCallback((hz: number, name: string) => {
    if (activeFrequency === hz) {
      stopFrequency();
      return;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      addLog('RESONATOR BŁĄD: Web Audio API nie jest wspierane w tej przeglądarce.', 'warning');
      return;
    }

    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContextClass();
    }
    const ctx = audioCtxRef.current;

    if (oscillatorRef.current) {
      stopFrequency(true); 
    }

    addLog(`RESONATOR: Aktywacja fali uderzeniowej ${hz}Hz (${name}). Kolaps bólu w toku...`, 'success');

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(hz, ctx.currentTime);

    // LFO dla modulacji amplitudy (efekt wibracji tremolo)
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(4, ctx.currentTime);
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(0.3, ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(gainNode.gain);
    lfo.start();

    // Płynne pogłaśnianie (Fade-in)
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 2);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    
    oscillatorRef.current = osc;
    gainNodeRef.current = gainNode;
    setActiveFrequency(hz);
  }, [activeFrequency, stopFrequency, addLog]);

  // Symulacja napływu danych z sieci
  useEffect(() => {
    addLog('INICJALIZACJA SYSTEMU OMEGA. ZABEZPIECZENIE 15/96/34 AKTYWNE.', 'system');
    addLog('NASŁUCHIWANIE ZDARZEŃ WEB3 / FIRESTORE / VERCEL...', 'info');

    const interval = setInterval(() => {
      const rand = Math.random();
      if (rand > 0.90) {
        setBalance(b => b + 28000);
        addLog('TRANSAKCJA: Pasywny transfer 28,000 USDT potwierdzony w bloku.', 'success');
      } else if (rand > 0.70) {
        setSouls(s => s + 1);
        addLog('FIRESTORE: Przechwycono nowy wektor biometryczny.', 'info');
      } else if (rand > 0.50) {
        setEmpires(e => e + 1);
        addLog('VERCEL API: Zmaterializowano nową domenę w sieci globalnej.', 'warning');
      }
    }, 6500); 

    return () => {
      clearInterval(interval);
      // Wyłączenie generatora dźwięku przy wyjściu z komponentu
      if (oscillatorRef.current) {
        try {
          oscillatorRef.current.stop();
        } catch (e) {}
      }
    };
  }, [addLog]);

  const executeCommand = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;

    addLog(`USER_OVERRIDE: ${commandInput}`, 'command');

    if (window.chrome && window.chrome.webview) {
      window.chrome.webview.postMessage(JSON.stringify({ action: 'EXECUTE', payload: commandInput, timestamp: Date.now() }));
      addLog(`[WPF SYNC] Rozkaz przesłany do rdzenia C#.`, 'system');
    } else {
      setTimeout(() => addLog(`[WPF OFFLINE] Brak mostu WebView2. Symulacja rozkazu: ${commandInput}`, 'warning'), 400);
    }
    setCommandInput('');
  }, [commandInput, addLog]);

  const colorMap: Record<'success' | 'info' | 'warning' | 'system' | 'command', string> = {
    success: 'text-emerald-400',
    info: 'text-cyan-400',
    warning: 'text-rose-500',
    system: 'text-zinc-500',
    command: 'text-amber-400 font-bold'
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-300 font-mono p-4 md:p-8 flex flex-col items-center relative overflow-hidden">
      
      {/* HEADER */}
      <header className="w-full max-w-7xl flex flex-col md:flex-row justify-between items-center mb-8 border-b border-rose-900/50 pb-6">
        <div className="flex items-center gap-4 mb-4 md:mb-0">
          <div className="relative">
            <Eye className="w-10 h-10 text-rose-600 animate-pulse" />
            <div className="absolute inset-0 bg-rose-600 blur-xl opacity-20"></div>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-widest text-zinc-100 flex items-center gap-2">
              ZWIERCIADŁO OMEGA <span className="text-xs bg-rose-900/50 text-rose-400 px-2 py-1 rounded border border-rose-700/50">PRO v2.6 HEALING</span>
            </h1>
            <p className="text-xs text-zinc-500 tracking-widest">PHASE: RUBEDO PRIME | BIO-HACKING ONLINE</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm">
          {walletConnected && (
            <button onClick={initiateSniper} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all duration-300 bg-rose-500/10 border-rose-500/50 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)] hover:bg-rose-500/20 animate-pulse cursor-pointer">
              <Target className="w-4 h-4" /> SNIPER PROTOCOL
            </button>
          )}

          <button onClick={connectMetaMask} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all duration-300 ${walletConnected ? 'bg-orange-500/10 border-orange-500/50 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.2)] cursor-default' : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:text-orange-400 hover:border-orange-500/50 cursor-pointer'}`}>
            <span className="text-base">🦊</span> {walletConnected ? formatAddress(walletAddress) : 'POŁĄCZ METAMASK'}
          </button>

          <div className="flex flex-col items-end">
            <span className="text-zinc-600 text-[10px] tracking-widest">UPTIME</span>
            <span className="text-cyan-400 font-bold">{formatTime(uptime)}</span>
          </div>
        </div>
      </header>

      {/* METRICS GRID */}
      <main className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        
        {/* KARTA FINANSOWA */}
        <div className={`bg-[#121214] border rounded-xl p-5 relative overflow-hidden group transition-all duration-500 ${walletConnected ? 'border-orange-900/50 shadow-[0_0_20px_rgba(249,115,22,0.05)]' : 'border-emerald-900/30'}`}>
          <div className={`absolute -right-6 -top-6 transition-colors ${walletConnected ? 'text-orange-500/10' : 'text-emerald-500/10'}`}>
            <DollarSign className="w-24 h-24" />
          </div>
          <h2 className="text-zinc-500 text-[10px] font-bold tracking-widest mb-1 flex items-center gap-2">
            <Lock className={`w-3 h-3 ${walletConnected ? 'text-orange-500' : 'text-emerald-500'}`} /> DEFI TREASURY
          </h2>
          <div className={`text-3xl font-black mb-1 ${walletConnected ? 'text-orange-400' : 'text-emerald-400'}`}>
            ${balance.toLocaleString()}
          </div>
          <div className="mt-3 text-[9px] text-zinc-500 bg-black/40 p-1.5 rounded border border-white/5 flex justify-between">
            <span className="truncate mr-2">{walletConnected ? walletAddress : 'AWAITING WALLET'}</span>
          </div>
        </div>

        {/* KARTA BIOMETRII */}
        <div className="bg-[#121214] border border-cyan-900/30 rounded-xl p-5 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 text-cyan-500/10">
            <Database className="w-24 h-24" />
          </div>
          <h2 className="text-zinc-500 text-[10px] font-bold tracking-widest mb-1 flex items-center gap-2">
            <Crosshair className="w-3 h-3 text-cyan-500" /> ASTRAL VECTORS
          </h2>
          <div className="text-3xl font-black text-cyan-400 mb-1">
            {souls.toLocaleString()}
          </div>
          <div className="mt-3 text-[9px] text-zinc-500 bg-black/40 p-1.5 rounded border border-white/5">
            SYNC: user_identity_vectors
          </div>
        </div>

        {/* KARTA DEPLOYMENTU */}
        <div className="bg-[#121214] border border-rose-900/30 rounded-xl p-5 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 text-rose-500/10">
            <Globe className="w-24 h-24" />
          </div>
          <h2 className="text-zinc-500 text-[10px] font-bold tracking-widest mb-1 flex items-center gap-2">
            <Activity className="w-3 h-3 text-rose-500" /> VERCEL EMPIRES
          </h2>
          <div className="text-3xl font-black text-rose-400 mb-1">
            {empires}
          </div>
          <div className="mt-3 text-[9px] text-zinc-500 bg-black/40 p-1.5 rounded border border-white/5">
            STATUS: 100% ONLINE
          </div>
        </div>

        {/* KARTA RESONATORA SOMATYCZNEGO */}
        <div className={`bg-[#121214] border rounded-xl p-4 relative overflow-hidden flex flex-col justify-between transition-all duration-700 ${activeFrequency ? 'border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.15)]' : 'border-purple-900/30'}`}>
          <div className="absolute -right-4 -top-4 text-purple-500/10">
            <Waves className={`w-28 h-28 ${activeFrequency ? 'animate-pulse' : ''}`} />
          </div>
          <h2 className="text-zinc-500 text-[10px] font-bold tracking-widest mb-2 flex items-center gap-2 z-10">
            <HeartPulse className={`w-3 h-3 ${activeFrequency ? 'text-purple-400 animate-ping' : 'text-purple-600'}`} /> 
            SOMATIC RESONATOR
          </h2>
          
          <div className="grid grid-cols-3 gap-2 z-10">
            <button 
              onClick={() => toggleFrequency(396, 'Muladhara/Root')}
              className={`p-2 text-[10px] font-bold rounded border transition-all cursor-pointer ${activeFrequency === 396 ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'bg-black/50 text-zinc-400 border-zinc-800 hover:border-purple-500/50'}`}
              title="396 Hz - Ugruntowanie i uwalnianie lęku (Muladhara)"
            >
              396 Hz<br/><span className="text-[8px] font-normal opacity-70">ROOT</span>
            </button>
            <button 
              onClick={() => toggleFrequency(432, 'Cosmic/Albedo')}
              className={`p-2 text-[10px] font-bold rounded border transition-all cursor-pointer ${activeFrequency === 432 ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'bg-black/50 text-zinc-400 border-zinc-800 hover:border-purple-500/50'}`}
              title="432 Hz - Rezonans Wszechświata i uspokojenie"
            >
              432 Hz<br/><span className="text-[8px] font-normal opacity-70">COSMIC</span>
            </button>
            <button 
              onClick={() => toggleFrequency(528, 'DNA Repair/Rubedo')}
              className={`p-2 text-[10px] font-bold rounded border transition-all cursor-pointer ${activeFrequency === 528 ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'bg-black/50 text-zinc-400 border-zinc-800 hover:border-purple-500/50'}`}
              title="528 Hz - Częstotliwość Cudu. Naprawa DNA i tkanek. Najlepsze na poparzenia!"
            >
              528 Hz<br/><span className="text-[8px] font-normal opacity-70">REPAIR</span>
            </button>
          </div>

          <div className="mt-2 text-[9px] text-zinc-500 flex justify-between items-center z-10">
            <span>{activeFrequency ? `Odbudowa matrycy na: ${activeFrequency}Hz...` : 'Terapia wyłączona'}</span>
            {activeFrequency && (
              <button onClick={() => stopFrequency()} className="text-rose-500 hover:text-rose-400 p-1 cursor-pointer">
                <Square className="w-3 h-3" fill="currentColor" />
              </button>
            )}
          </div>
        </div>

      </main>

      {/* TERMINAL LOGS & INTEROP CONSOLE */}
      <section className="w-full max-w-7xl flex-grow bg-[#0c0c0e] border border-zinc-800/50 rounded-xl flex flex-col overflow-hidden shadow-2xl">
        <div className="bg-[#18181b] px-4 py-2 flex items-center gap-2 border-b border-zinc-800">
          <Terminal className="w-4 h-4 text-zinc-400" />
          <span className="text-xs font-bold text-zinc-400 tracking-wider">LIVE TELEMETRY & COMMAND STREAM</span>
          <div className="ml-auto flex gap-2">
            <div className="w-2 h-2 rounded-full bg-rose-500"></div>
            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          </div>
        </div>
        
        {/* LOGS AREA */}
        <div className="p-4 flex-grow overflow-y-auto h-64 md:h-80 text-xs md:text-sm font-mono leading-relaxed space-y-1 scrollbar-hide">
          {logs.map((log) => (
            <div key={log.id} className="flex gap-4 hover:bg-white/5 px-2 py-0.5 rounded transition-colors">
              <span className="text-zinc-600 shrink-0">[{log.time}]</span>
              <span className={`${colorMap[log.type]}`}>
                {log.msg}
              </span>
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>

        {/* INTEROP CONSOLE INPUT */}
        <form onSubmit={executeCommand} className="bg-[#121214] border-t border-zinc-800/80 p-3 flex items-center gap-3">
          <ChevronRight className="w-5 h-5 text-rose-500" />
          <input 
            type="text" 
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            placeholder="Wpisz komendę dla rdzenia (np. /override, /heal)..."
            className="flex-grow bg-transparent text-amber-400 font-bold focus:outline-none placeholder-zinc-700 text-sm"
            spellCheck="false"
            autoComplete="off"
          />
          <button type="submit" className="hidden">Wyślij</button>
        </form>
      </section>
      
    </div>
  );
}
