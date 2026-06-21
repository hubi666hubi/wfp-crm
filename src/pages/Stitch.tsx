import { useState, useEffect } from 'react';
import { Cpu, Zap, Terminal as TerminalIcon, Search, CheckCircle2, Lock, ArrowRight, Layout, ExternalLink, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface StitchScreen {
  id: string;
  title: string;
  thumbnail: string;
  deviceType: string;
}

const STITCH_PROJECT_ID = "353902890850105523";

const MOCK_SCREENS: StitchScreen[] = [
  { id: "1c8916c364514f548a670f43f2e549df", title: "NEURAL_SATURATION: Full Load Test Monitor", thumbnail: "https://lh3.googleusercontent.com/aida/AP1WRLsn2ZoxRsSKVFnUaVNl_ZDO9Ha6vDGm5YXA-7qqrk9sU39AL_CRfaIo-ROm6QtEwSXGHiD1nL4BJ8B2HFQQ7sST_5iYlE6mzTkrHpdH08vPFwGSrLTXO888gJO67CrlIzfOYZ-Xv3BPju5vt-_uvSwI5RfVqbga31H0kLSz_70AXLiG2BxuD4CstzLrCR0UsPCT-woyVUY3u5eU8FwLsTyqXdCHuGX7sbs6PJ-XaM8WA9A7UTEgHAkF", deviceType: "MOBILE" },
  { id: "e5db18652cd2441c94a8cd4229c3c4f8", title: "COMPLIANCE_MANIFEST: Audyt Zgodności PRO V2", thumbnail: "https://lh3.googleusercontent.com/aida/AP1WRLuV4QjuOO5ARawPQFOLlZDqJTBL1Dfnlqv04RaF8-VBGvBlAL3vC2cyiNUb9zRUu6etK6x29-hhvoUfGhuHqFpL1teKUKGwWEVDanXIeGrA52GYUMaJB6SDTqbsv_YPfQovQTnZOqCafIIbespOZCtu165Far615abCbKKBkV-ip7Bs1MmBWZDzPayLdMplIETV7_ZsYYaXJi2kGs3KylnEC8TRxud0u_zWHHxRh1OFUhcg-k5g1PN7aQ", deviceType: "MOBILE" },
  { id: "8a5bd0ac644f476b88db5b5e9b5d5651", title: "Prognoza MRR 12-miesięczna PRO V2", thumbnail: "https://lh3.googleusercontent.com/aida/AP1WRLvh3BJD1AV00SK3PxjvTDMxSHhj8jef206UtbVLzMmV1f0e3npDS45B6bOJWtJ_4I7SaHqozqpv0rstXCT_it1pO4xaz1aIMQCRT_2867ofKjS65B5MBf3O1Y66V2Prfs7BZK0BfVo9yrdCD-RGaF2deKHXguzNoeK2FRFsVBjB3y_v3cIO7JCa_wsbpWxm6c95yB9bPN9q0MOZ3Syqos1aIAn_chg2vrN7-Jc4JN1JFwPkQBxXuybr6g", deviceType: "MOBILE" },
  { id: "0878588f889643489be6e121fa898745", title: "DASHBOARD_PRO: Central Command Hub", thumbnail: "https://lh3.googleusercontent.com/aida/AP1WRLv6SbrJM8pou7UzBNQ-E_OfGvgqN37QIiwdJeoVwYZQ_FeL3s3ZPeaMa8KPTkO43ppcKa5obKk7JmE7jpx1n8HODUFXgvOTaA96vEpNNm8bJSFvfbSR1rL3K3qu5FpaWKx2TZVOVN48vRTedgSmD_xCEyBqqof-9B5CI8hPFQ82bDxtGw5bGQQnYHACYKHQr8cYF1gba1WwxOLQ5VfNfqUo3OhOYGHcUin3QEtwcAi8s5iO_TDCBYrBmg", deviceType: "MOBILE" }
];

export function Stitch() {
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<'uplink' | 'repo'>('uplink');

  useEffect(() => {
    if (isConnecting) {
      const messages = [
        "[14:20:01] INITIALIZING STITCH_UPLINK_V3...",
        "[14:20:02] PARSING COMMAND ARGUMENTS...",
        "[14:20:03] AUTHENTICATING WITH OMEGA_AUTH_TOKEN...",
        "[14:20:05] ESTABLISHING SECURE TUNNEL TO STITCH.WITHGOOGLE.COM...",
        "[14:20:06] CLUSTER_SYNC: VERIFYING PROJECT_ID " + STITCH_PROJECT_ID + "...",
        "[14:20:08] HANDSHAKE SUCCESSFUL. UPLINK STABLE."
      ];

      let i = 0;
      const interval = setInterval(() => {
        if (i < messages.length) {
          setTerminalOutput(prev => [...prev, messages[i]]);
          i++;
        } else {
          clearInterval(interval);
          setIsConnecting(false);
          setIsConnected(true);
          toast.success("Połączenie ze Stitch ustanowione!");
        }
      }, 800);

      return () => clearInterval(interval);
    }
  }, [isConnecting]);

  const handleConnect = () => {
    setTerminalOutput([]);
    setIsConnecting(true);
    setIsConnected(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Cpu className="text-rose-500" size={32} />
            Stitch Uplink & Design Hub
          </h1>
          <p className="mt-1 text-sm text-neutral-400 max-w-3xl">
            Zautomatyzowana synchronizacja z Google Stitch. Zarządzaj interfejsami, eksportuj komponenty i nadzoruj ewolucję UI w czasie rzeczywistym.
          </p>
        </div>

        <div className="flex items-center gap-2 p-1 bg-neutral-900 border border-neutral-800 rounded-xl">
           <button
             onClick={() => setActiveTab('uplink')}
             className={`px-4 py-2 text-xs font-mono font-bold rounded-lg transition-all ${activeTab === 'uplink' ? 'bg-rose-600 text-white shadow-lg' : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-850'}`}
           >
             UPLINK CONFIG
           </button>
           <button
             onClick={() => setActiveTab('repo')}
             className={`px-4 py-2 text-xs font-mono font-bold rounded-lg transition-all ${activeTab === 'repo' ? 'bg-rose-600 text-white shadow-lg' : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-850'}`}
           >
             DESIGN REPO
           </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'uplink' ? (
          <motion.div
            key="uplink"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-6 space-y-6">
                <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                  <Zap size={14} className="text-amber-500" />
                  Status Połączenia
                </h3>

                <div className="p-4 bg-neutral-900/40 border border-neutral-800 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-neutral-500 uppercase font-mono">Sieć</p>
                    <p className="text-sm font-bold text-white font-mono">Google Stitch API</p>
                  </div>
                  <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-rose-500 animate-pulse'}`} />
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] text-neutral-500 uppercase font-mono mb-1">Project ID</label>
                    <input
                      type="text"
                      value={STITCH_PROJECT_ID}
                      readOnly
                      className="w-full bg-black border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-300 font-mono focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-500 uppercase font-mono mb-1">Auth Method</label>
                    <div className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-400 font-mono flex items-center justify-between">
                      API_KEY_HEADER
                      <Lock size={12} />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-500 disabled:bg-neutral-900 disabled:text-neutral-500 text-white text-xs font-bold font-mono rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(225,29,72,0.2)]"
                >
                  {isConnecting ? <RefreshCw className="animate-spin" size={16} /> : <TerminalIcon size={16} />}
                  {isConnecting ? 'NAWIĄZYWANIE...' : 'RE-INITIALIZE UPLINK'}
                </button>
              </div>

              <div className="bg-gradient-to-br from-rose-950/20 to-neutral-950 border border-rose-900/20 rounded-2xl p-6">
                <h4 className="text-xs font-bold text-rose-400 uppercase tracking-widest mb-3">Dokumentacja MCP</h4>
                <p className="text-[11px] text-neutral-500 leading-relaxed font-mono">
                  Uplink wykorzystuje Model Context Protocol do bezpośredniej injekcji schematów designu do lokalnego runtime'u. Wszelkie zmiany w Stitch są synchronizowane co 300ms w trybie "Active Listen".
                </p>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-neutral-950 border border-neutral-900 rounded-2xl flex flex-col h-[500px] overflow-hidden">
                <div className="p-4 border-b border-neutral-900 bg-neutral-900/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-rose-500/20 border border-rose-500/40" />
                      <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/40" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/40" />
                    </div>
                    <span className="text-[10px] text-neutral-500 font-mono uppercase tracking-widest ml-4">Terminal: STDOUT</span>
                  </div>
                  <span className="text-[10px] text-neutral-600 font-mono">PID: 4921</span>
                </div>

                <div className="flex-1 p-6 overflow-y-auto font-mono text-xs space-y-2 custom-scrollbar bg-black/40">
                  {terminalOutput.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-neutral-700 space-y-4">
                      <TerminalIcon size={48} className="opacity-10" />
                      <p className="animate-pulse">Oczekiwanie na sygnał inicjalizacji...</p>
                    </div>
                  ) : (
                    terminalOutput.map((line, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`${line.includes('SUCCESS') || line.includes('STABLE') ? 'text-emerald-400 font-bold' : line.includes('VERIFYING') ? 'text-amber-400' : 'text-neutral-400'}`}
                      >
                        <span className="text-rose-500/50 mr-2">&gt;</span>
                        {line}
                      </motion.div>
                    ))
                  )}
                  {isConnected && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="pt-4"
                    >
                      <span className="text-rose-500 animate-pulse">_</span>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="repo"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Layout className="text-rose-500" size={20} />
                    Project: HYPEd
                  </h3>
                  <p className="text-xs text-neutral-500 font-mono mt-1">ID: {STITCH_PROJECT_ID}</p>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={14} />
                  <input
                    type="text"
                    placeholder="Wyszukaj ekran..."
                    className="bg-black border border-neutral-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-rose-500 w-64"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {MOCK_SCREENS.map((screen) => (
                  <motion.div
                    key={screen.id}
                    whileHover={{ y: -5 }}
                    className="group bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden cursor-pointer hover:border-rose-500/40 transition-all"
                  >
                    <div className="aspect-[9/16] relative bg-neutral-950 overflow-hidden">
                       <img
                         src={screen.thumbnail}
                         alt={screen.title}
                         className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500"
                       />
                       <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                       <div className="absolute bottom-4 left-4 right-4 translate-y-4 group-hover:translate-y-0 transition-transform">
                          <button className="w-full py-2 bg-rose-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity">
                            Podgląd 8K
                          </button>
                       </div>
                       <div className="absolute top-3 right-3 px-2 py-0.5 bg-black/80 rounded border border-neutral-800 text-[8px] font-mono text-neutral-400">
                         {screen.deviceType}
                       </div>
                    </div>
                    <div className="p-4 space-y-2">
                       <h4 className="text-xs font-bold text-neutral-200 line-clamp-1 group-hover:text-rose-400 transition-colors">{screen.title}</h4>
                       <div className="flex items-center justify-between">
                         <span className="text-[9px] text-neutral-500 font-mono">{screen.id.substring(0, 8)}...</span>
                         <a
                           href={`https://stitch.withgoogle.com/projects/${STITCH_PROJECT_ID}/screens/${screen.id}`}
                           target="_blank"
                           rel="noreferrer"
                           className="text-neutral-500 hover:text-white transition-colors"
                           onClick={(e) => e.stopPropagation()}
                         >
                           <ExternalLink size={12} />
                         </a>
                       </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="p-6 bg-neutral-950 border border-neutral-900 rounded-2xl flex items-start gap-4">
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">Synchronizacja Komponentów</h4>
                    <p className="text-xs text-neutral-500 leading-relaxed">System automatycznie zmapował 42 komponenty z projektu HYPEd. Gotowe do użycia w module <strong>VslGenerator</strong>.</p>
                  </div>
               </div>
               <div className="p-6 bg-neutral-950 border border-neutral-900 rounded-2xl flex items-start gap-4">
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400">
                    <ArrowRight size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">Eksportuj do React</h4>
                    <p className="text-xs text-neutral-500 leading-relaxed">Skorzystaj z wtyczki <strong>omega-exporter</strong> w Stitch, aby wygenerować czysty kod Tailwind z zaznaczonych sekcji.</p>
                  </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Stitch;
