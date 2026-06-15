import { useState, useEffect } from 'react';
import { Bot, FileText, CheckCircle2, ChevronDown, ChevronUp, User } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

interface MeetingNote {
  date: string;
  summary: string;
  actionItems: string[];
  sentiment: string;
  rawNotes: string;
}

interface Client {
  id: string;
  name: string;
  email: string;
  status: string;
  meetings?: MeetingNote[];
}

export function CrmMeetingSummarizer() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [rawNotes, setRawNotes] = useState('');
  const [summarizing, setSummarizing] = useState(false);
  const [expandedMeeting, setExpandedMeeting] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchClients = async () => {
      try {
        const res = await fetch('/api/crm-clients');
        const data = await res.json();
        if (active) {
          if (Array.isArray(data)) {
            setClients(data);
          } else {
            setClients([]);
            if (data?.error) {
              toast.error(`Błąd: ${data.error}`);
            }
          }
        }
      } catch {
        if (active) {
          toast.error('Błąd pobierania bazy klientów');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    fetchClients();
    return () => {
      active = false;
    };
  }, []);

  const handleSummarize = async () => {
    if (!selectedClient || !rawNotes.trim()) return;

    setSummarizing(true);
    const toastId = toast.loading('Agent analizuje notatki ze spotkania...');
    
    try {
      const res = await fetch('/api/summarize-meeting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: selectedClient, rawNotes })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast.success('Notatka ze spotkania zaktualizowana!', { id: toastId });
        setRawNotes('');
        setClients(prev => prev.map(c => {
           if (c.id === selectedClient) {
             return { ...c, meetings: data.meetings };
           }
           return c;
        }));
      } else {
         toast.error(data.error || 'Błąd streszczania', { id: toastId });
      }
    } catch {
      toast.error('Błąd sieci połączenia', { id: toastId });
    }
    setSummarizing(false);
  };

  const activeClient = Array.isArray(clients) ? clients.find(c => c.id === selectedClient) : undefined;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Kolumna 1: Baza Klientów */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
        <h3 className="text-lg font-medium text-white mb-4 border-b border-neutral-800 pb-2 flex items-center gap-2">
          <User size={18} className="text-emerald-400" />
          Baza Klientów
        </h3>
        
        {loading ? (
          <div className="text-neutral-500 text-sm">Wczytywanie klientów...</div>
        ) : !Array.isArray(clients) || clients.length === 0 ? (
          <div className="text-neutral-500 text-sm italic">Brak klientów w bazie. Wyślij link testowy w module VSL.</div>
        ) : (
          <div className="space-y-3">
            {Array.isArray(clients) && clients.map(client => (
              <div 
                key={client.id}
                onClick={() => setSelectedClient(client.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedClient === client.id 
                    ? 'bg-emerald-900/20 border-emerald-500/50 shadow-[0_0_15px_-3px_rgba(16,185,129,0.1)]' 
                    : 'bg-black border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className="font-medium text-white text-sm">{client.name || 'Brak imienia'}</div>
                <div className="text-xs text-neutral-400 mt-1">{client.email}</div>
                <div className="mt-2 flex justify-between items-center">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">{client.status}</span>
                  <span className="text-[10px] text-neutral-500 bg-neutral-900 px-2 py-0.5 rounded-full border border-neutral-800">{client.meetings?.length || 0} notatek</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Kolumna 2 i 3: Moduł Agenta Notatek */}
      <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-xl p-6 flex flex-col">
        <h3 className="text-lg font-medium text-white mb-4 border-b border-neutral-800 pb-2 flex items-center gap-2">
          <Bot size={18} className="text-rose-400" />
          Inteligentne Streszczanie Spotkań {activeClient ? `- ${activeClient.name || activeClient.email}` : ''}
        </h3>

        {!activeClient ? (
          <div className="flex-1 flex items-center justify-center text-neutral-500 text-sm border-2 border-dashed border-neutral-800 rounded-xl p-12">
            Wybierz klienta z bazy po lewej stronie, aby dodać notatki ze spotkania.
          </div>
        ) : (
          <div className="flex-1 flex flex-col gap-6">
            
            {/* Wpisz Notatki */}
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Zrzuć notatki ze spotkania (surowy tekst z dyktafonu, luźne myśli)</label>
              <textarea 
                value={rawNotes}
                onChange={(e) => setRawNotes(e.target.value)}
                placeholder="Klient narzekał, że leady są słabej jakości. Umówiliśmy się, że za tydzień odpalimy nowy lejek z chatbotem na LinkedIn..."
                rows={5}
                className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 custom-scrollbar"
                disabled={summarizing}
              />
              <div className="mt-3 flex justify-end">
                <button
                  onClick={handleSummarize}
                  disabled={summarizing || !rawNotes.trim()}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {summarizing ? <Bot className="animate-spin" size={16} /> : <FileText size={16} />}
                  Stwórz Streszczenie AI
                </button>
              </div>
            </div>

            {/* Historia Spotkań */}
            <div className="mt-4">
              <h4 className="text-sm font-medium text-neutral-300 mb-3 uppercase tracking-wider">Historia Notatek Stratedicznych</h4>
              
              {!activeClient.meetings || activeClient.meetings.length === 0 ? (
                <div className="text-xs text-neutral-600 italic">Brak zapisanych notatek dla tego klienta.</div>
              ) : (
                <div className="space-y-4">
                  {activeClient.meetings.map((meeting, index) => (
                    <div key={index} className="bg-black border border-neutral-800 rounded-lg overflow-hidden">
                      <div 
                        className="p-3 bg-neutral-950 flex justify-between items-center cursor-pointer hover:bg-neutral-900 transition-colors"
                        onClick={() => setExpandedMeeting(expandedMeeting === index.toString() ? null : index.toString())}
                      >
                         <div>
                           <div className="text-xs text-neutral-400">{new Date(meeting.date).toLocaleString('pl-PL')}</div>
                           <div className="text-sm font-medium text-white truncate max-w-sm mt-0.5">{meeting.summary}</div>
                         </div>
                         <div className="flex items-center gap-3">
                           <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${meeting.sentiment === 'Pozytywny' ? 'bg-emerald-900/30 text-emerald-400' : meeting.sentiment === 'Negatywny' ? 'bg-rose-900/30 text-rose-400' : 'bg-neutral-800 text-neutral-300'}`}>
                             {meeting.sentiment || 'Brak danych'}
                           </span>
                           {expandedMeeting === index.toString() ? <ChevronUp size={16} className="text-neutral-500" /> : <ChevronDown size={16} className="text-neutral-500" />}
                         </div>
                      </div>
                      
                      <AnimatePresence>
                        {expandedMeeting === index.toString() && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="p-4 border-t border-neutral-800 text-sm space-y-4"
                          >
                             <div>
                               <div className="text-xs text-neutral-500 mb-1 font-mono uppercase">Streszczenie Spotkania</div>
                               <div className="text-neutral-300 leading-relaxed">{meeting.summary}</div>
                             </div>
                             
                             <div>
                               <div className="text-xs text-neutral-500 mb-1 font-mono uppercase">Action Items (Zadania)</div>
                               <ul className="space-y-1">
                                 {meeting.actionItems?.map((item, i) => (
                                   <li key={i} className="flex gap-2 text-emerald-400 items-start">
                                     <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                                     <span className="text-neutral-300">{item}</span>
                                   </li>
                                 ))}
                                 {(!meeting.actionItems || meeting.actionItems.length === 0) && (
                                   <li className="text-neutral-500 italic">Brak wyraźnych kroków.</li>
                                 )}
                               </ul>
                             </div>
                             
                             <div className="pt-3 border-t border-neutral-800/50">
                               <div className="text-xs text-neutral-500 mb-1 font-mono uppercase">Surowe Notatki</div>
                               <div className="text-neutral-500 text-xs italic">{meeting.rawNotes}</div>
                             </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
