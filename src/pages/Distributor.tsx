import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Network, MessageSquare, Briefcase, Send, Radio, Mail, Download, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface LogEntry {
  id: number;
  message: string;
  platform: string;
  status: 'pending' | 'active' | 'success';
}

import type { SVGProps } from 'react';
export function Distributor() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [active, setActive] = useState(false);
  const [tweetTopic, setTweetTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const [webhookUrl, setWebhookUrl] = useState('https://api.x.com/2/webhooks/142...');
  const [webhookActive, setWebhookActive] = useState(true);

  const [schedules, setSchedules] = useState<SocialSchedule[]>([]);

  useEffect(() => {
    fetch('/api/distributor-schedules')
      .then(res => res.json())
      .then(data => setSchedules(data))
      .catch(err => console.error("Error loading schedules", err));
  }, []);

  const handleScheduleChange = (platform: string, field: string, value: string | boolean) => {
    setSchedules(prev => prev.map(s => s.platform === platform ? { ...s, [field]: value } : s));
  };

  const handleSaveSchedule = async (platform: string) => {
     const schedule = schedules.find(s => s.platform === platform);
     if (!schedule) return;

     try {
       const res = await fetch('/api/distributor-schedules', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ platform, updates: schedule })
       });
       if (res.ok) {
         toast.success(`Zapisano harmonogram dla ${platform}.`);
       }
     } catch {
       toast.error('Błąd zapisu harmonogramu');
     }
  };

  const handleManualTrigger = async (platform: string) => {
     try {
       const res = await fetch('/api/distributor-trigger', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ platform })
       });
       if (res.ok) {
         toast.success(`Uruchomiono ręcznie bota dla ${platform}.`);
       }
     } catch {
       toast.error('Błąd triggerowania');
     }
  };

  useEffect(() => {
    if (!active || !webhookActive) return;

    const eventSource = new EventSource('/api/distributor-logs');

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setLogs((prev) => {
        const newLogs = [...prev, data as LogEntry];
        if (newLogs.length > 8) return newLogs.slice(newLogs.length - 8);
        return newLogs;
      });
    };

    eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [active, webhookActive]);

  const PlatformIcon = ({ name }: { name: string }) => {
    switch(name) {
      case 'X': return <MessageSquare size={16} className="text-blue-400" />;
      case 'LinkedIn': return <Briefcase size={16} className="text-blue-600" />;
      case 'TikTok': return <Send size={16} className="text-pink-500" />; // Generic as TikTok icon absent
      case 'Newsletter': return <Mail size={16} className="text-amber-500" />;
      case 'Webhook': return <Network size={16} className="text-emerald-400" />;
      case 'System': return <Terminal size={16} className="text-neutral-400" />;
      default: return <Radio size={16} className="text-gray-400" />;
    }
  }

  const handleExportLogs = (format: 'csv' | 'json') => {
    let content = '';
    let mimeType = 'text/plain';
    const timestamp = new Date().toISOString().split('T')[0];
    let filename = `distributor_logs_${timestamp}`;

    if (format === 'json') {
      content = JSON.stringify(logs, null, 2);
      mimeType = 'application/json';
      filename += '.json';
    } else if (format === 'csv') {
      const header = 'id,platform,status,message\n';
      const rows = logs.map(l => `${l.id},${l.platform},${l.status},"${l.message.replace(/"/g, '""')}"`).join('\n');
      content = header + rows;
      mimeType = 'text/csv';
      filename += '.csv';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleGenerateTweet = async () => {
    if (!tweetTopic.trim()) return;
    setIsGenerating(true);
    
    // Optimistically add an event log for the AI generation
    const genId = Date.now() * 10 + 1;
    setLogs(prev => [...prev.slice(-7), { id: genId, message: `Inicjalizacja Agenta Treści dla '${tweetTopic}'...`, platform: 'Agent', status: 'pending' }]);

    try {
      const response = await fetch('/api/generate-tweet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: tweetTopic })
      });
      
      const data = await response.json();
      
      if (response.ok && data.tweet) {
        setLogs(prev => [...prev.slice(-7), { 
          id: Date.now() * 10 + 2, 
          message: `Gotowy post X: "${data.tweet}"`, 
          platform: 'X', 
          status: 'success' 
        }]);
        toast.success('Pomyślnie opublikowano post na X');
      } else {
        setLogs(prev => [...prev.slice(-7), { 
          id: Date.now() * 10 + 3, 
          message: `Błąd agenta: ${data.error || 'Nieznany błąd'}`, 
          platform: 'System', 
          status: 'success' 
        }]);
      }
    } catch (e) {
      console.error(e);
      setLogs(prev => [...prev.slice(-7), { 
        id: Date.now() * 10 + 4, 
        message: `Błąd komunikacji z agentem.`, 
        platform: 'System', 
        status: 'success' 
      }]);
    } finally {
      setIsGenerating(false);
      setTweetTopic('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Network className="text-rose-500" size={32} />
            Autonomiczny Dystrybutor
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            Bezpośrednie potoki dystrybucyjne agentów. Skalowalna maszyna publikacyjna.
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-4">
           {active && (
             <span className="flex items-center gap-2 text-rose-500 text-sm font-semibold animate-pulse">
               <Radio size={16} /> Transmisja Aktywna
             </span>
           )}
           <button 
             onClick={() => setActive(!active)}
             className={`px-6 py-2 font-medium rounded-lg transition-all ${
               active ? 'bg-neutral-800 text-neutral-300 border border-neutral-700 hover:bg-neutral-700' : 'bg-rose-600 text-white shadow-[0_0_15px_rgba(225,29,72,0.3)] hover:bg-rose-500'
             }`}
           >
             {active ? 'Wyłącz Dystrybutor' : 'Inicjuj Dystrybutor'}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
            <h3 className="text-lg font-medium text-white mb-4 border-b border-neutral-800 pb-2">Platformy Docelowe</h3>
            <ul className="space-y-3">
              {[
                { name: 'Algorytmy X (Twitter)', status: 'Connected', icon: MessageSquare, color: 'text-blue-400' },
                { name: 'Konta TikTok', status: 'Connected', icon: Send, color: 'text-pink-500' },
                { name: 'LinkedIn API', status: 'Connected', icon: Briefcase, color: 'text-blue-600' },
                { name: 'Silnik Newsletterów', status: 'Connected', icon: Mail, color: 'text-amber-500' },
              ].map((platform) => (
                <li key={platform.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-black rounded-lg border border-neutral-800">
                      <platform.icon size={18} className={platform.color} />
                    </div>
                    <span className="text-sm font-medium text-gray-300">{platform.name}</span>
                  </div>
                  <span className="text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">
                    {platform.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
            <h3 className="text-lg font-medium text-white mb-4 border-b border-neutral-800 pb-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Network size={18} className="text-rose-400" />
                Nasłuch Webhook'a X (Zadania Agentów)
              </span>
              <button 
                onClick={() => setWebhookActive(!webhookActive)}
                className={`w-10 h-5 rounded-full relative transition-colors ${webhookActive ? 'bg-rose-500' : 'bg-neutral-700'}`}
              >
                <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${webhookActive ? 'left-6' : 'left-1'}`} />
              </button>
            </h3>
            <p className="text-xs text-neutral-400 mb-3">System zintegrowany. Nasłuchuje na ukończone taski od Agentów, konwertując i publikując automatycznie na X (Twitterze).</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1">Webhook URL</label>
                <input 
                  type="text" 
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  disabled={!webhookActive}
                  className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-xs text-neutral-300 focus:outline-none focus:border-rose-500 transition-colors disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
            <h3 className="text-lg font-medium text-white mb-4 border-b border-neutral-800 pb-2 flex items-center gap-2">
              <MessageSquare size={18} className="text-blue-400" />
              Bezpośrednia Publikacja Agentem X
            </h3>
            <div className="space-y-3">
              <input 
                type="text" 
                value={tweetTopic}
                onChange={(e) => setTweetTopic(e.target.value)}
                placeholder="Podaj temat (np. 'spadek konwersji SaaS')..."
                className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500 transition-colors"
                disabled={isGenerating}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerateTweet()}
              />
              <button 
                onClick={handleGenerateTweet}
                disabled={isGenerating || !tweetTopic.trim() || !active}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2"
              >
                {isGenerating ? 'Generowanie...' : 'Generuj i Publikuj X'}
              </button>
              {!active && <p className="text-xs text-rose-400 mt-2">Dystrybutor musi być aktywny.</p>}
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
            <h3 className="text-lg font-medium text-white mb-4 border-b border-neutral-800 pb-2 flex items-center gap-2">
              <Calendar size={18} className="text-purple-400" />
              Harmonogram Publikacji
            </h3>
            <p className="text-xs text-neutral-400 mb-4">Ustaw preferowane godziny dla automatycznych publikacji wygenerowanych postów.</p>
            <div className="space-y-3">
              {schedules.map((schedule) => (
                <div key={schedule.platform} className="flex flex-col gap-2 p-3 bg-black rounded-lg border border-neutral-800">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <PlatformIcon name={schedule.platform} />
                      <span className="text-sm text-gray-300 font-medium">{schedule.platform}</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={schedule.isActive} onChange={(e) => handleScheduleChange(schedule.platform, 'isActive', e.target.checked)} className="sr-only peer"/>
                      <div className="w-9 h-5 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500"></div>
                    </label>
                  </div>
                  <input 
                    type="text" 
                    value={schedule.cronExpression}
                    placeholder="np. 0 9 * * *"
                    onChange={(e) => handleScheduleChange(schedule.platform, 'cronExpression', e.target.value)}
                    className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-white focus:border-rose-500 focus:outline-none"
                    title="Cron Expression (Sek/Min/Godz/itp)"
                  />
                  <input 
                    type="text" 
                    value={schedule.topicContext}
                    placeholder="Co ma publikować AI?"
                    onChange={(e) => handleScheduleChange(schedule.platform, 'topicContext', e.target.value)}
                    className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-white focus:border-rose-500 focus:outline-none"
                  />
                  <input 
                    type="text" 
                    value={schedule.webhookUrl || ''}
                    placeholder="Webhook (np. make.com) - opcjonalnie"
                    onChange={(e) => handleScheduleChange(schedule.platform, 'webhookUrl', e.target.value)}
                    className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-white focus:border-rose-500 focus:outline-none"
                  />
                  <div className="flex gap-2">
                     <button 
                       onClick={() => handleSaveSchedule(schedule.platform)}
                       className="flex-1 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium rounded transition-colors border border-neutral-700"
                     >
                       Zapisz
                     </button>
                     <button 
                       onClick={() => handleManualTrigger(schedule.platform)}
                       className="px-2 py-1.5 bg-rose-600/20 hover:bg-rose-600/40 text-rose-400 text-xs font-medium rounded transition-colors border border-rose-500/30"
                       title="Sprawdź raz asynchronicznie natychmiast"
                     >
                       Test Autopost
                     </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
            <h3 className="text-lg font-medium text-white mb-4 border-b border-neutral-800 pb-2">Status Kolejki</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs text-neutral-400 mb-1">
                  <span>Przepustowość Zadań</span>
                  <span>78%</span>
                </div>
                <div className="w-full bg-black rounded-full h-2 border border-neutral-800">
                  <div className="bg-rose-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                </div>
              </div>
              <p className="text-xs text-neutral-500">Agenci wygenerowali 41 postów w ostatnich 24h. Brak zaległości w kolejce wysyłkowej.</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl h-[500px] flex flex-col overflow-hidden relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neutral-900/40 via-transparent to-transparent pointer-events-none" />
            
            <div className="p-4 border-b border-neutral-800 bg-neutral-900/50 flex justify-between items-center z-10">
              <h3 className="text-sm font-medium text-white flex items-center gap-2">
                <Terminal size={16} className="text-neutral-500" />
                Dystrybucja Na Żywo (Webhooki)
              </h3>
              
              <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden px-1">
                <select 
                  id="logs-export-format"
                  className="bg-neutral-900 text-xs text-neutral-400 py-1.5 px-1 focus:outline-none focus:text-gray-200"
                >
                  <option value="csv">CSV</option>
                  <option value="json">JSON</option>
                </select>
                <div className="w-[1px] h-4 bg-neutral-800"></div>
                <button
                  onClick={() => handleExportLogs((document.getElementById('logs-export-format') as HTMLSelectElement).value as 'csv' | 'json')}
                  className="flex items-center gap-1.5 text-xs transition-colors text-emerald-400 hover:text-emerald-300 py-1.5 pr-2 pl-1"
                  title="Eksportuj logi"
                  disabled={logs.length === 0}
                >
                  <Download size={14} /> Eksportuj Logi
                </button>
              </div>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto font-mono text-sm space-y-3 custom-scrollbar z-10">
              {logs.length === 0 ? (
                 <div className="flex items-center justify-center h-full text-neutral-600">
                   {active ? 'Czekanie na strumień danych od agentów...' : 'Dystrybutor jest wyłączony. Uruchom system, aby rozpocząć strumieniowanie.'}
                 </div>
              ) : (
                <AnimatePresence initial={false}>
                  {logs.map((log) => (
                    <motion.div 
                      key={log.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-start gap-3"
                    >
                      <div className="mt-1">
                         <PlatformIcon name={log.platform} />
                      </div>
                      <div>
                        <span className="text-neutral-500 mr-2">[{log.platform.toUpperCase()}]</span>
                        <span className="text-white">{log.message}</span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Quick component for terminal icon
function Terminal(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" x2="20" y1="19" y2="19" />
    </svg>
  )
}
