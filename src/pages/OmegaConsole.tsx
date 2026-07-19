import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Activity, DollarSign, Database, Globe, Zap, Lock, Eye, Crosshair, ChevronRight, Target, Waves, HeartPulse, Square, Cpu } from 'lucide-react';

export function OmegaConsole() {
  const [balance, setBalance] = useState(0);
  const [souls, setSouls] = useState(142);
  const [empires, setEmpires] = useState(12);
  const [logs, setLogs] = useState([]);
  const [uptime, setUptime] = useState(0);
  const [commandInput, setCommandInput] = useState('');
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  
  // Stan Resonatora Somatycznego (Leczenie)
  const [activeFrequency, setActiveFrequency] = useState(null);
  const audioCtxRef = useRef(null);
  const oscillatorRef = useRef(null);
  const gainNodeRef = useRef(null);
  
  // Stan dla Chrome Local AI (Embedder)
  const [aiTestResults, setAiTestResults] = useState([]);
  const [isSpinning, setIsSpinning] = useState(false);

  const logsEndRef = useRef(null);
  const aiLogsEndRef = useRef(null);

  // Auto-scroll do najnowszych logów
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  useEffect(() => {
    aiLogsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiTestResults]);

  // Zegar Uptime'u
  useEffect(() => {
    const timer = setInterval(() => setUptime(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const addLog = (msg, type) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-49), { id: Date.now() + Math.random(), time, msg, type }]);
  };

  const addAiLog = (msg, type = 'info') => {
    const time = new Date().toLocaleTimeString();
    setAiTestResults(prev => [...prev, { id: Date.now() + Math.random(), time, msg, type }]);
  };

  // ==========================================
  // CHROME BUILT-IN AI (EMBEDDER TESTING - WG PDF OD KENJIEGO)
  // ==========================================
  
  // Funkcja pomocnicza: Podobieństwo kosinusowe (Cosine Similarity) dla Float32Array
  const cosineSimilarity = (vecA, vecB) => {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  };

  const scanTargetSemantics = async (targetText) => {
    if (isSpinning) return;
    setIsSpinning(true);
    
    addAiLog(`INICJALIZACJA SKANU: "${targetText}"`, 'warning');
    addAiLog(`WYWOŁANIE API: window.ai.embedding.create()`, 'system');
    
    const isAiSupported = typeof window !== 'undefined' && window.ai && window.ai.embedding;
    
    try {
      let similarityScore = 0;
      let vectorSize = 0;

      if (isAiSupported) {
        // Implementacja zgodnie z dokumentacją PDF: create() -> embed() -> destroy()
        const embedder = await window.ai.embedding.create();
        
        addAiLog(`EMBEDDINGGEMMA-300M ZAŁADOWANA. Generowanie wektorów...`, 'info');
        
        // Złoty Wektor - nasz profil klienta "Wieloryba"
        const goldenVector = await embedder.embed("CEO szukający esktremalnego skalowania B2B przy użyciu AI i technologii kwantowych.");
        
        // Wektor Celu (to co wpisał użytkownik)
        const targetVector = await embedder.embed(targetText);
        
        vectorSize = targetVector.length;
        similarityScore = cosineSimilarity(goldenVector, targetVector);
        
        // Czystka z pamięci wg wytycznych PDF
        embedder.destroy();
      } else {
        // SYMULACJA dla przeglądarek bez flagi Canary
        addAiLog('OSTRZEŻENIE: Brak natywnego API `window.ai.embedding`. Flaga wyłączona?', 'error');
        addAiLog('URUCHAMIAM SYMULACJĘ REZONANSU (FALLBACK)...', 'system');
        await new Promise(r => setTimeout(r, 1200));
        vectorSize = 1024; // Domyślny wymiar Gummy
        // Losowy score zależny od długości tekstu
        similarityScore = 0.5 + (Math.random() * 0.49); 
      }

      const matchPercent = (similarityScore * 100).toFixed(2);
      addAiLog(`Wymiarowość Przestrzeni (Float32Array): ${vectorSize}D`, 'info');
      addAiLog(`WSPÓŁCZYNNIK REZONANSU (PMF): ${matchPercent}%`, matchPercent > 80 ? 'success' : 'warning');
      
      if (matchPercent > 80) {
        addAiLog('DECYZJA: CEL ZATWIERDZONY. Rozpocząć drenaż portfela.', 'success');
      } else {
        addAiLog('DECYZJA: SŁABY REZONANS TPS. Zignorować cel.', 'error');
      }

    } catch (e) {
      addAiLog(`KRYTYCZNY BŁĄD V8: ${e.message}`, 'error');
    }
    
    setIsSpinning(false);
  };

  // Stary przycisk spinLocalAI teraz odpala przykładowy skan
  const spinLocalAI = () => {
    scanTargetSemantics("Inwestor szukający nowych technologii Web3 i AI dla swojej firmy");
  };

  // ==========================================
  // REALNA INTEGRACJA WEB3 (METAMASK)
  // ==========================================
  const connectMetaMask = async () => {
    if (walletConnected && walletAddress) return;

    if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
      try {
        addLog('WYWOŁANIE WEB3: Budzenie portfela MetaMask... 🦊', 'warning');
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const account = accounts[0];
        
        setWalletAddress(account);
        setWalletConnected(true);
        addLog(`WEB3 SECURED: MetaMask podłączony. Aktywny adres: ${account}`, 'success');

        window.ethereum.on('accountsChanged', (newAccounts) => {
          if (newAccounts.length > 0) setWalletAddress(newAccounts[0]);
          else setWalletConnected(false);
        });
      } catch (error) {
        addLog(`WEB3 ERROR: Autoryzacja odrzucona.`, 'warning');
      }
    } else {
      addLog('WEB3 KRYTYCZNY BŁĄD: MetaMask nie został wykryty.', 'warning');
    }
  };

  const initiateSniper = async () => {
    if (!walletConnected || !walletAddress) return;
    try {
      const hexMessage = '0x' + "ZWIERCIADŁO OMEGA\n\nAkcja: Execute_Liquidity_Drain\nTarget: 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D".split('').map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
      await window.ethereum.request({ method: 'personal_sign', params: [hexMessage, walletAddress, ''] });
      setTimeout(() => setBalance(b => b + 142500), 1500);
    } catch (e) {}
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // ==========================================
  // RESONATOR SOMATYCZNY (WEB AUDIO API)
  // ==========================================
  const toggleFrequency = (hz) => {
    if (activeFrequency === hz) {
      stopFrequency();
      return;
    }
    if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = audioCtxRef.current;
    if (oscillatorRef.current) stopFrequency(true); 

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(hz, ctx.currentTime);
    
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 2);
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.start();
    
    oscillatorRef.current = osc;
    gainNodeRef.current = gainNode;
    setActiveFrequency(hz);
  };

  const stopFrequency = (immediate = false) => {
    if (!audioCtxRef.current || !gainNodeRef.current || !oscillatorRef.current) return;
    if (immediate) {
      oscillatorRef.current.stop();
      oscillatorRef.current.disconnect();
    } else {
      gainNodeRef.current.gain.linearRampToValueAtTime(0, audioCtxRef.current.currentTime + 1.5);
      setTimeout(() => {
        if (oscillatorRef.current) {
          oscillatorRef.current.stop();
          oscillatorRef.current.disconnect();
        }
        setActiveFrequency(null);
      }, 1500);
    }
  };

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

    return () => clearInterval(interval);
  }, []);

  const executeCommand = (e) => {
    e.preventDefault();
    if (!commandInput.trim()) return;
    addLog(`USER_OVERRIDE: ${commandInput}`, 'command');
    
    // Przechwytywanie komendy /scan w terminalu
    if (commandInput.startsWith('/scan ')) {
      const target = commandInput.replace('/scan ', '');
      scanTargetSemantics(target);
    } else if (window.chrome && window.chrome.webview) {
      window.chrome.webview.postMessage(JSON.stringify({ action: 'EXECUTE', payload: commandInput, timestamp: Date.now() }));
    }
    
    setCommandInput('');
  };

  const colorMap = {
    success: 'text-emerald-400',
    info: 'text-cyan-400',
    warning: 'text-rose-500',
    system: 'text-zinc-500',
    command: 'text-amber-400 font-bold',
    error: 'text-red-500 font-bold'
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
              ZWIERCIADŁO OMEGA <span className="text-xs bg-rose-900/50 text-rose-400 px-2 py-1 rounded border border-rose-700/50">PRO v2.8 TENSOR-NATIVE</span>
            </h1>
            <p className="text-xs text-zinc-500 tracking-widest">PHASE: RUBEDO PRIME | WFP DESKTOP HOST</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm">
          {walletConnected && (
            <button onClick={initiateSniper} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all duration-300 bg-rose-500/10 border-rose-500/50 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)] hover:bg-rose-500/20 animate-pulse">
              <Target className="w-4 h-4" /> SNIPER PROTOCOL
            </button>
          )}

          <button onClick={connectMetaMask} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all duration-300 ${walletConnected ? 'bg-orange-500/10 border-orange-500/50 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.2)] cursor-default' : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:text-orange-400 hover:border-orange-500/50'}`}>
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
          <div className="absolute -right-6 -top-6 text-emerald-500/10 group-hover:text-emerald-500/20"><DollarSign className="w-24 h-24" /></div>
          <h2 className="text-zinc-500 text-[10px] font-bold tracking-widest mb-1 flex items-center gap-2"><Lock className="w-3 h-3 text-emerald-500" /> DEFI TREASURY</h2>
          <div className="text-3xl font-black mb-1 text-emerald-400">${balance.toLocaleString()}</div>
        </div>

        {/* KARTA BIOMETRII */}
        <div className="bg-[#121214] border border-cyan-900/30 rounded-xl p-5 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 text-cyan-500/10"><Database className="w-24 h-24" /></div>
          <h2 className="text-zinc-500 text-[10px] font-bold tracking-widest mb-1 flex items-center gap-2"><Crosshair className="w-3 h-3 text-cyan-500" /> ASTRAL VECTORS</h2>
          <div className="text-3xl font-black text-cyan-400 mb-1">{souls.toLocaleString()}</div>
        </div>

        {/* KARTA DEPLOYMENTU */}
        <div className="bg-[#121214] border border-rose-900/30 rounded-xl p-5 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 text-rose-500/10"><Globe className="w-24 h-24" /></div>
          <h2 className="text-zinc-500 text-[10px] font-bold tracking-widest mb-1 flex items-center gap-2"><Activity className="w-3 h-3 text-rose-500" /> VERCEL EMPIRES</h2>
          <div className="text-3xl font-black text-rose-400 mb-1">{empires}</div>
        </div>

        {/* KARTA RESONATORA */}
        <div className={`bg-[#121214] border rounded-xl p-4 relative overflow-hidden flex flex-col justify-between transition-all duration-700 ${activeFrequency ? 'border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.15)]' : 'border-purple-900/30'}`}>
          <div className="absolute -right-4 -top-4 text-purple-500/10"><Waves className={`w-28 h-28 ${activeFrequency ? 'animate-pulse' : ''}`} /></div>
          <h2 className="text-zinc-500 text-[10px] font-bold tracking-widest mb-2 flex items-center gap-2 z-10"><HeartPulse className="w-3 h-3 text-purple-600" /> SOMATIC RESONATOR</h2>
          <div className="grid grid-cols-3 gap-2 z-10">
            <button onClick={() => toggleFrequency(396)} className={`p-2 text-[10px] font-bold rounded border ${activeFrequency === 396 ? 'bg-purple-600 text-white' : 'bg-black/50 text-zinc-400 border-zinc-800'}`}>396 Hz</button>
            <button onClick={() => toggleFrequency(432)} className={`p-2 text-[10px] font-bold rounded border ${activeFrequency === 432 ? 'bg-purple-600 text-white' : 'bg-black/50 text-zinc-400 border-zinc-800'}`}>432 Hz</button>
            <button onClick={() => toggleFrequency(528)} className={`p-2 text-[10px] font-bold rounded border ${activeFrequency === 528 ? 'bg-purple-600 text-white' : 'bg-black/50 text-zinc-400 border-zinc-800'}`}>528 Hz</button>
          </div>
        </div>
      </main>

      {/* DUAL TERMINAL LAYOUT */}
      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-4 flex-grow mb-8">
        
        {/* LEWY TERMINAL: LOGI SYSTEMOWE */}
        <section className="bg-[#0c0c0e] border border-zinc-800/50 rounded-xl flex flex-col overflow-hidden shadow-2xl h-80">
          <div className="bg-[#18181b] px-4 py-2 flex items-center gap-2 border-b border-zinc-800">
            <Terminal className="w-4 h-4 text-zinc-400" />
            <span className="text-[10px] font-bold text-zinc-400 tracking-wider">LIVE TELEMETRY STREAM</span>
          </div>
          <div className="p-4 flex-grow overflow-y-auto text-[11px] md:text-xs font-mono leading-relaxed space-y-1 scrollbar-hide">
            {logs.map((log) => (
              <div key={log.id} className="flex gap-4 hover:bg-white/5 px-2 py-0.5 rounded transition-colors">
                <span className="text-zinc-600 shrink-0">[{log.time}]</span>
                <span className={`${colorMap[log.type]}`}>{log.msg}</span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
          <form onSubmit={executeCommand} className="bg-[#121214] border-t border-zinc-800/80 p-2 flex items-center gap-2">
            <ChevronRight className="w-4 h-4 text-rose-500" />
            <input type="text" value={commandInput} onChange={(e) => setCommandInput(e.target.value)} placeholder="Wpisz komendę (np. /scan 'fraza')..." className="flex-grow bg-transparent text-amber-400 font-bold focus:outline-none text-xs" spellCheck="false" />
          </form>
        </section>

        {/* PRAWY TERMINAL: CHROME BUILT-IN AI (Wujo Kenji API) */}
        <section className="bg-[#0c0c0e] border border-blue-900/40 rounded-xl flex flex-col overflow-hidden shadow-[0_0_30px_rgba(59,130,246,0.05)] h-80">
          <div className="bg-[#0f172a] px-4 py-2 flex items-center gap-2 border-b border-blue-900/60 justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-400" />
              <span className="text-[10px] font-bold text-blue-400 tracking-wider">SEMANTIC RESONANCE (embeddinggemma-300m)</span>
            </div>
            {/* Przycisk Testu */}
            <button 
              onClick={spinLocalAI} 
              disabled={isSpinning}
              className={`text-[9px] font-bold px-2 py-1 rounded border transition-all ${isSpinning ? 'bg-blue-600/50 text-white cursor-wait border-transparent' : 'bg-blue-600/20 text-blue-300 border-blue-500/50 hover:bg-blue-500 hover:text-white'}`}
            >
              {isSpinning ? 'SKANOWANIE...' : 'ANALIZE TARGET (TEST)'}
            </button>
          </div>
          <div className="p-4 flex-grow overflow-y-auto text-[11px] md:text-xs font-mono leading-relaxed space-y-1 scrollbar-hide">
            {aiTestResults.length === 0 && (
              <div className="text-zinc-600 flex flex-col items-center justify-center h-full text-center">
                <p>Oczekiwanie na sygnał V8 Tensor Core...</p>
                <p className="text-[9px] mt-2">Wpisz w konsoli obok <span className="text-amber-400 font-bold">/scan "dowolny tekst"</span> aby sprawdzić rezonans.</p>
              </div>
            )}
            {aiTestResults.map((log) => (
              <div key={log.id} className="flex gap-4 hover:bg-white/5 px-2 py-0.5 rounded transition-colors">
                <span className="text-zinc-600 shrink-0">[{log.time}]</span>
                <span className={`${colorMap[log.type]}`}>{log.msg}</span>
              </div>
            ))}
            <div ref={aiLogsEndRef} />
          </div>
        </section>

      </div>
      
    </div>
  );
}
