import React, { useState, useEffect, useCallback, useRef } from "react";
import { getAccessToken, initAuth, googleSignIn } from "../lib/auth";
import { 
  MessageSquare, 
  Send, 
  Plus, 
  Trash2, 
  Sparkles, 
  Bot, 
  Search, 
  RefreshCw, 
  ShieldCheck,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

interface Space {
  name: string; // e.g. "spaces/AAAA..."
  displayName?: string;
  spaceType: "SPACE" | "DIRECT_MESSAGE";
  singleUserBotDm?: boolean;
}

interface Message {
  name: string; // e.g. "spaces/AAAA.../messages/BBBB..."
  text: string;
  createTime: string;
  sender?: {
    name: string;
    displayName?: string;
    avatarUrl?: string;
    type?: "HUMAN" | "BOT";
  };
}

interface Membership {
  name: string; // e.g. "spaces/AAAA.../members/CCCC..."
  state: string;
  role: string;
  member?: {
    name: string;
    displayName?: string;
    avatarUrl?: string;
    type?: "HUMAN" | "BOT";
  };
}

interface AiSuggestionResult {
  senderIntent: string;
  suggestions: string[];
  suggestedActions: string[];
}

const INITIAL_SAMPLE_SPACES: Space[] = [
  { name: "spaces/local_marketing", displayName: "📣 Marketing & Wirusy (W.F.P)", spaceType: "SPACE" },
  { name: "spaces/local_sales", displayName: "💰 Handlowcy & Closery (OMEGA)", spaceType: "SPACE" },
  { name: "spaces/local_general", displayName: "☕ Pokój Ogólny", spaceType: "SPACE" }
];

const INITIAL_SAMPLE_MESSAGES: Record<string, Message[]> = {
  "spaces/local_marketing": [
    {
      name: "spaces/local_marketing/messages/msg_1",
      text: "Hej zespół! Właśnie skończyliśmy render nowego VSL-a dla klienta Innovate S.A. Wyniki konwersji wyglądają obiecująco.",
      createTime: "2026-06-11T12:00:00Z",
      sender: { name: "users/u1", displayName: "Kamil Zieliński (W.F.P)", avatarUrl: "", type: "HUMAN" }
    },
    {
      name: "spaces/local_marketing/messages/msg_2",
      text: "Super! Czy wrzuciliście go już do testów A/B na Tachometrze? Musimy zebrać pierwsze logi do piątku.",
      createTime: "2026-06-11T13:00:00Z",
      sender: { name: "users/u2", displayName: "Karolina Nowak (Designer)", avatarUrl: "", type: "HUMAN" }
    },
    {
      name: "spaces/local_marketing/messages/msg_3",
      text: "Zrobione. Pierwszy ruch wykazuje 14% wyższy retention w sekcji Cognitive Shock.",
      createTime: "2026-06-11T15:00:00Z",
      sender: { name: "users/u1", displayName: "Kamil Zieliński (W.F.P)", avatarUrl: "", type: "HUMAN" }
    }
  ],
  "spaces/local_sales": [
    {
      name: "spaces/local_sales/messages/msg_1",
      text: "Mamy nowego gorącego leada z grupy FB o automatyzacji. Janusz pyta o integration z Pipedrive. Kto przejmuje?",
      createTime: "2026-06-11T14:00:00Z",
      sender: { name: "users/u3", displayName: "Michał Kowalski (Outbound Lead)", avatarUrl: "", type: "HUMAN" }
    },
    {
      name: "spaces/local_sales/messages/msg_2",
      text: "Przejmuję go. Już wysyłam spersonalizowany onboarding na maila przez moduł Gmail i sprawdzam dostępność w Google Calendar.",
      createTime: "2026-06-11T16:00:00Z",
      sender: { name: "users/u4", displayName: "Sandra Bąk (Closer)", avatarUrl: "", type: "HUMAN" }
    }
  ],
  "spaces/local_general": [
    {
      name: "spaces/local_general/messages/msg_1",
      text: "Cześć wszystkim! Google Chat został w pełni połączony z naszym panelem operacyjnym OMEGA W.F.P. Możecie teraz zarządzać pokojami i pisać bezpośrednio stąd.",
      createTime: "2026-06-10T10:00:00Z",
      sender: { name: "users/bot_omega", displayName: "OMEGA AI (Bot)", avatarUrl: "", type: "BOT" }
    }
  ]
};

const INITIAL_SAMPLE_MEMBERS: Record<string, Membership[]> = {
  "spaces/local_marketing": [
    { name: "m1", state: "JOINED", role: "ROLE_MEMBER", member: { name: "users/u1", displayName: "Kamil Zieliński (W.F.P)", type: "HUMAN" } },
    { name: "m2", state: "JOINED", role: "ROLE_MEMBER", member: { name: "users/u2", displayName: "Karolina Nowak (Designer)", type: "HUMAN" } }
  ],
  "spaces/local_sales": [
    { name: "m3", state: "JOINED", role: "ROLE_MEMBER", member: { name: "users/u3", displayName: "Michał Kowalski (Outbound Lead)", type: "HUMAN" } },
    { name: "m4", state: "JOINED", role: "ROLE_MEMBER", member: { name: "users/u4", displayName: "Sandra Bąk (Closer)", type: "HUMAN" } }
  ],
  "spaces/local_general": [
    { name: "m5", state: "JOINED", role: "ROLE_MEMBER", member: { name: "users/bot_omega", displayName: "OMEGA AI (Bot)", type: "BOT" } },
    { name: "m6", state: "JOINED", role: "ROLE_MEMBER", member: { name: "users/u1", displayName: "Kamil Zieliński (W.F.P)", type: "HUMAN" } }
  ]
};

export function GoogleChatPage() {
  const [needsAuth, setNeedsAuth] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // States for simulated databases safely loaded to component state
  const [sampleMessages, setSampleMessages] = useState<Record<string, Message[]>>(INITIAL_SAMPLE_MESSAGES);
  const [sampleMembers, setSampleMembers] = useState<Record<string, Membership[]>>(INITIAL_SAMPLE_MEMBERS);

  // Lists
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<Membership[]>([]);

  // Form states
  const [newMessageText, setNewMessageText] = useState("");
  const [newSpaceName, setNewSpaceName] = useState("");
  const [showCreateSpaceModal, setShowCreateSpaceModal] = useState(false);
  const [messageSearch, setMessageSearch] = useState("");

  // AI assistant states
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [selectedMessageForAi, setSelectedMessageForAi] = useState<Message | null>(null);
  const [aiTone, setAiTone] = useState<"professional" | "friendly" | "witty" | "persuasive">("professional");
  const [aiResults, setAiResults] = useState<AiSuggestionResult | null>(null);

  // Ref for auto-scrolling messages
  const messageEndRef = useRef<HTMLDivElement>(null);

  // Local storage indicators for testing / fallback data
  const [showSampleData, setShowSampleData] = useState(false);

  // Load spaces
  const fetchSpaces = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;

    try {
      setIsLoading(true);
      const res = await fetch("https://chat.googleapis.com/v1/spaces", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.status === 403 || res.status === 401) {
        throw new Error("Brak dostępu do Google Chat.");
      }

      const data = await res.json();
      
      if (data.spaces && data.spaces.length > 0) {
        setSpaces(data.spaces);
        setSelectedSpace(data.spaces[0]);
        setShowSampleData(false);
      } else {
        setSpaces(INITIAL_SAMPLE_SPACES);
        setSelectedSpace(INITIAL_SAMPLE_SPACES[0]);
        setShowSampleData(true);
      }
    } catch (err: any) {
      console.warn("Real API space fetch failed, using safe sandbox database:", err);
      setSpaces(INITIAL_SAMPLE_SPACES);
      setSelectedSpace(INITIAL_SAMPLE_SPACES[0]);
      setShowSampleData(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sync token validation on component mount
  useEffect(() => {
    const unsubscribe = initAuth(
      () => {
        setNeedsAuth(false);
        fetchSpaces();
      },
      () => setNeedsAuth(true)
    );
    return () => unsubscribe();
  }, [fetchSpaces]);

  // Load details whenever active space shifts or sample database updates
  useEffect(() => {
    if (selectedSpace) {
      const spaceName = selectedSpace.name;
      
      if (showSampleData) {
        // Load simulated records asynchronously using an effect timer to avoid synchronous cascade
        const timer = setTimeout(() => {
          setAiResults(null);
          setSelectedMessageForAi(null);
          setMessages(sampleMessages[spaceName] || []);
          setMembers(sampleMembers[spaceName] || []);
        }, 20);
        return () => clearTimeout(timer);
      } else {
        // Fetch from real Workspace endpoint
        const token = getAccessToken();
        if (token) {
          let active = true;
          
          const loadDetails = async () => {
            setIsDetailLoading(true);
            try {
              const msgRes = await fetch(`https://chat.googleapis.com/v1/${spaceName}/messages`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              const msgData = msgRes.ok ? await msgRes.json() : null;
              
              const memRes = await fetch(`https://chat.googleapis.com/v1/${spaceName}/members`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              const memData = memRes.ok ? await memRes.json() : null;
              
              if (active) {
                setAiResults(null);
                setSelectedMessageForAi(null);
                setMessages(msgData?.messages || []);
                setMembers(memData?.memberships || []);
              }
            } catch (err) {
              console.error("Error loading chat context details:", err);
            } finally {
              if (active) setIsDetailLoading(false);
            }
          };
          
          loadDetails();
          return () => {
            active = false;
          };
        }
      }
    }
  }, [selectedSpace, showSampleData, sampleMessages, sampleMembers]);

  // Scroll feed to bottom
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setNeedsAuth(false);
        fetchSpaces();
      }
    } catch (err) {
      console.error("Login failed:", err);
      toast.error("Błąd uwierzytelniania.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !selectedSpace) return;

    const textToSend = newMessageText.trim();
    setNewMessageText("");

    const activeSpaceName = selectedSpace.name;

    if (showSampleData) {
      // Use clean deterministic timestamp string in handlers, safe from render mutation warnings
      const randomId = Math.floor(Math.random() * 900000) + 100000;
      const isoStamp = new Date().toISOString();

      const newMsg: Message = {
        name: `${activeSpaceName}/messages/msg_client_${randomId}`,
        text: textToSend,
        createTime: isoStamp,
        sender: {
          name: "users/system_operator",
          displayName: "Operator Systemu (Ja)",
          avatarUrl: "",
          type: "HUMAN"
        }
      };

      setSampleMessages(prev => {
        const currentList = prev[activeSpaceName] || [];
        const updated = [...currentList, newMsg];
        return {
          ...prev,
          [activeSpaceName]: updated
        };
      });

      toast.success("Wysłano symulowaną wiadomość (Sandbox)");
      return;
    }

    const token = getAccessToken();
    if (!token) return;

    try {
      const res = await fetch(`https://chat.googleapis.com/v1/${activeSpaceName}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ text: textToSend })
      });

      if (!res.ok) throw new Error("Błąd przy wysyłce");
      
      toast.success("Wiadomość została wysłana");
      
      // Force reload message details manually
      const loadRes = await fetch(`https://chat.googleapis.com/v1/${activeSpaceName}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (loadRes.ok) {
        const msgData = await loadRes.json();
        setMessages(msgData.messages || []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Nie udało się wysłać wiadomości.");
    }
  };

  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpaceName.trim()) return;

    const spaceTitle = newSpaceName.trim();
    setNewSpaceName("");
    setShowCreateSpaceModal(false);

    if (showSampleData) {
      const randomSpaceId = Math.floor(Math.random() * 900000) + 100000;
      const spaceKey = `spaces/local_${randomSpaceId}`;

      const newS: Space = {
        name: spaceKey,
        displayName: `📣 ${spaceTitle}`,
        spaceType: "SPACE"
      };

      const isoStamp = new Date().toISOString();
      const initMessages = [
        {
          name: `${spaceKey}/messages/init`,
          text: `Inicjalizacyjny kanał dyskusyjny "${spaceTitle}". Witaj w nowym pokoju!`,
          createTime: isoStamp,
          sender: { name: "users/bot_omega", displayName: "OMEGA AI (Bot)", type: "BOT" }
        }
      ];

      const initMembers = [
        { name: "m_init", state: "JOINED", role: "ROLE_MEMBER", member: { name: "users/bot_omega", displayName: "OMEGA AI (Bot)", type: "BOT" } }
      ];

      // Pure batch updates
      setSampleMessages(prev => ({ ...prev, [spaceKey]: initMessages }));
      setSampleMembers(prev => ({ ...prev, [spaceKey]: initMembers }));
      
      setSpaces(prev => [...prev, newS]);
      setSelectedSpace(newS);

      toast.success(`Utworzono symulowany pokój: ${spaceTitle}`);
      return;
    }

    const token = getAccessToken();
    if (!token) return;

    try {
      const res = await fetch("https://chat.googleapis.com/v1/spaces", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          spaceType: "SPACE",
          displayName: spaceTitle
        })
      });

      if (!res.ok) throw new Error("Błąd podczas tworzenia pokoju");
      
      toast.success(`Pomyślnie utworzono pokój Google Chat: ${spaceTitle}`);
      fetchSpaces();
    } catch (err) {
      console.error(err);
      toast.error("Nie udało się utworzyć pokoju.");
    }
  };

  const handleDeleteMessage = async (msgName: string) => {
    const isConfirmed = window.confirm(
      "Zabezpieczenie operacji niszczącej W.F.P:\n\nCzy na pewno chcesz usunąć tę wiadomość z Google Chat? Ta akcja zostanie wykonana u wszystkich użytkowników i nie można jej cofnąć."
    );

    if (!isConfirmed) return;

    if (showSampleData && selectedSpace) {
      const activeSpaceName = selectedSpace.name;
      setSampleMessages(prev => {
        const currentList = prev[activeSpaceName] || [];
        const filtered = currentList.filter(m => m.name !== msgName);
        return {
          ...prev,
          [activeSpaceName]: filtered
        };
      });
      toast.success("Usunięto symulowaną wiadomość");
      return;
    }

    const token = getAccessToken();
    if (!token) return;

    try {
      const res = await fetch(`https://chat.googleapis.com/v1/${msgName}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("Błąd usuwania wiadomości");
      
      toast.success("Wiadomość usunięta pomyślnie");
      if (selectedSpace) {
        const freshRes = await fetch(`https://chat.googleapis.com/v1/${selectedSpace.name}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (freshRes.ok) {
          const freshData = await freshRes.json();
          setMessages(freshData.messages || []);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Błąd serwera przy próbie skasowania wiadomości.");
    }
  };

  const handleGenerateAiSuggestions = async (messageToAnalyze: Message | null) => {
    const msg = messageToAnalyze || (messages.length > 0 ? messages[messages.length - 1] : null);
    if (!msg) {
      toast.error("Wybierz wiadomość lub upewnij się, że w pokoju są wiadomości do analizy.");
      return;
    }

    setIsAiGenerating(true);
    setAiResults(null);

    // Format chat context for the API
    const context = messages
      .slice(-4)
      .map(m => `${m.sender?.displayName || "Operator"}: ${m.text}`)
      .join("\n");

    try {
      const res = await fetch("/api/chat/suggest-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageText: msg.text,
          contextText: context,
          tone: aiTone
        })
      });

      if (!res.ok) throw new Error("Coś poszło nie tak");
      const data = await res.json();
      setAiResults(data);
      setSelectedMessageForAi(msg);
      toast.success("Zredagowano sugestie odpowiedzi AI!");
    } catch (err) {
      console.error(err);
      toast.error("Wyczerpano zasoby lub wystąpił błąd generatora.");
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Filter messages based on search query
  const filteredMessages = messages.filter(msg => {
    if (!messageSearch.trim()) return true;
    return msg.text.toLowerCase().includes(messageSearch.toLowerCase()) || 
           (msg.sender?.displayName && msg.sender.displayName.toLowerCase().includes(messageSearch.toLowerCase()));
  });

  if (needsAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] py-12 px-4 text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-neutral-950 border border-neutral-800 p-8 rounded-2xl shadow-xl border-t border-t-rose-500/20"
        >
          <div className="w-16 h-16 bg-rose-600/10 border border-rose-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(225,29,72,0.15)]">
            <MessageSquare className="w-8 h-8 text-rose-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2 tracking-tight font-sans">Synchronizacja Google Chat</h2>
          <p className="text-neutral-400 text-sm mb-6 leading-relaxed font-sans">
            Zintegruj system OMEGA z pokojami chatowymi Twojej firmy na Google Workspace. Zyskaj podgląd na żywo i inteligentnego asystenta odpowiedzi AI.
          </p>

          <button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full px-4 py-3 bg-white text-black text-sm font-semibold rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 font-sans"
          >
            {isLoggingIn ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Łączenie protokołów...
              </>
            ) : (
              <>
                <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  <path fill="none" d="M0 0h48v48H0z"></path>
                </svg>
                Zezwól na dostęp do Google Chat
              </>
            )}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-900 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2 font-sans">
            <MessageSquare className="text-rose-500 w-6 h-6" />
            Centrum Komunikacji Google Chat
          </h1>
          <p className="text-xs font-mono text-neutral-400 mt-1">
            ZINTEGROWANE PORTY ROZMÓW WIDEO, TEKSTOWEJ ORAZ AUTO-ASPEKTY REAKCJI AI
          </p>
        </div>

        <button
          onClick={() => setShowCreateSpaceModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold transition"
        >
          <Plus size={16} />
          Utwórz nowy pokój
        </button>
      </div>

      {showSampleData && (
        <div className="flex items-center gap-2.5 bg-amber-500/10 border border-amber-500/35 p-3 rounded-xl text-xs text-amber-400 font-mono">
          <ShieldCheck className="w-4 h-4 flex-shrink-0 animate-pulse text-amber-400" />
          <span>
            <strong>TRYB PIASKOWNICY (SANDBOX ACTIVE):</strong> Połączono z symulatorem. Jeśli Twoje konto Google Workspace nie posiada jeszcze aktywnych pokoi typu SPACE, system automatycznie ładuje bezpieczne zasoby symulacyjne.
          </span>
        </div>
      )}

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left column: Space explorer */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-neutral-900">
              <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-neutral-400">Moje Kanały ({spaces.length})</span>
              <button onClick={fetchSpaces} className="p-1 hover:bg-neutral-900 rounded text-neutral-400 animate-none" title="Odśwież kanały">
                <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
              </button>
            </div>

            {isLoading ? (
              <div className="py-8 text-center text-xs text-neutral-500">
                Ładowanie struktury kanałów...
              </div>
            ) : spaces.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-500">
                Nie znaleziono pokoi. Utwórz nowy kanał powyżej!
              </div>
            ) : (
              <div className="space-y-1 max-h-[380px] overflow-y-auto custom-scrollbar">
                {spaces.map(space => {
                  const isSelected = selectedSpace?.name === space.name;
                  return (
                    <button
                      key={space.name}
                      onClick={() => setSelectedSpace(space)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between gap-2 border transition ${
                        isSelected 
                          ? "bg-rose-500/10 text-rose-300 border-rose-500/35 shadow-[0_0_12px_rgba(225,29,72,0.15)]"
                          : "bg-transparent text-neutral-400 border-transparent hover:bg-neutral-900/60 hover:text-white"
                      }`}
                    >
                      <span className="truncate flex-1">{space.displayName || "Pokój bez nazwy"}</span>
                      {space.spaceType === "SPACE" ? (
                        <span className="text-[9px] bg-neutral-900 border border-neutral-800 px-1 py-0.5 rounded text-neutral-500 uppercase font-mono">Kanał</span>
                      ) : (
                        <span className="text-[9px] bg-neutral-900 border border-neutral-800 px-1 py-0.5 rounded text-neutral-500 uppercase font-mono">DM</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Members of selected room */}
          {selectedSpace && (
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4">
              <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-neutral-400 mb-2.5 block pb-2 border-b border-neutral-900">
                Skład Pokoju ({members.length})
              </span>
              <div className="space-y-2 max-h-[180px] overflow-y-auto custom-scrollbar">
                {members.length === 0 ? (
                  <div className="text-center py-2 text-xs text-neutral-500">
                    Brak danych handlowych
                  </div>
                ) : (
                  members.map((mem, index) => (
                    <div key={mem.name || index} className="flex items-center gap-2 text-xs py-1">
                      <div className="w-6 h-6 rounded-full bg-neutral-900 flex items-center justify-center border border-neutral-800 flex-shrink-0 text-[10px] font-mono text-neutral-400">
                        {mem.member?.displayName?.charAt(0) || "U"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-neutral-200 font-medium truncate leading-tight">
                          {mem.member?.displayName || "Nieznany handlowiec"}
                        </p>
                        <span className="text-[9px] text-neutral-500 block font-mono">
                          {mem.role === "ROLE_MEMBER" ? "Uczestnik" : "Manager"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Center: Message Feed */}
        <div className="lg:col-span-6 flex flex-col h-[650px] bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden relative">
          <div className="p-4 border-b border-neutral-900 flex items-center justify-between bg-neutral-950/40">
            <div>
              <h3 className="font-bold text-white text-sm">
                {selectedSpace ? (selectedSpace.displayName || "Rozmowa bezpośrednia") : "Wybierz kanał"}
              </h3>
              {selectedSpace && (
                <span className="text-[9px] font-mono text-neutral-500">
                  ID: {selectedSpace.name}
                </span>
              )}
            </div>

            {/* Quick Search */}
            <div className="relative w-44">
              <input
                type="text"
                placeholder="Szukaj..."
                value={messageSearch}
                onChange={e => setMessageSearch(e.target.value)}
                className="w-full bg-neutral-900/50 text-xs border border-neutral-800/80 rounded-lg pl-8 pr-3 py-1.5 text-white placeholder-neutral-500 focus:outline-none"
              />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
            </div>
          </div>

          {/* Feed Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-neutral-950/20">
            {isDetailLoading ? (
              <div className="flex flex-col items-center justify-center h-full py-12">
                <RefreshCw className="w-6 h-6 animate-spin text-rose-500 mb-2" />
                <span className="text-xs font-mono text-neutral-500">POBIERANIE PROTOKOŁÓW ROZMOWY...</span>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-neutral-500 text-xs py-12">
                Brak wiadomości w tym pokoju chatowym.
              </div>
            ) : (
              filteredMessages.map((msg, index) => {
                const isSentByMe = msg.sender?.name === "users/system_operator" || msg.sender?.displayName?.includes("Operator Systemu");
                const isBot = msg.sender?.type === "BOT";
                return (
                  <div
                    key={msg.name || index}
                    className={`flex items-start gap-4 transition-all group ${
                      selectedMessageForAi?.name === msg.name ? "ring-1 ring-rose-500/10 bg-rose-500/5 px-2 py-1.5 rounded-xl" : ""
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border font-semibold text-xs flex-shrink-0 ${
                      isSentByMe 
                        ? "bg-rose-950/20 border-rose-500/30 text-rose-300"
                        : isBot
                          ? "bg-amber-950/20 border-amber-500/30 text-amber-300"
                          : "bg-neutral-900 border-neutral-800 text-neutral-400"
                    }`}>
                      {isBot ? <Bot size={14} /> : (msg.sender?.displayName?.charAt(0) || "U")}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <span className="text-xs font-bold text-neutral-200">
                          {isSentByMe ? "Operator (Ja)" : (msg.sender?.displayName || "Uczestnik")}
                        </span>
                        {isBot && (
                          <span className="text-[8px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1 py-0.2 rounded font-mono uppercase">AI Bot</span>
                        )}
                        <span className="text-[10px] text-neutral-500 font-mono">
                          {new Date(msg.createTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-300 leading-relaxed break-words whitespace-pre-wrap">{msg.text}</p>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      {/* Trash Button for Deletion */}
                      <button
                        onClick={() => handleDeleteMessage(msg.name)}
                        className="p-1 hover:bg-neutral-950 rounded border border-transparent hover:border-neutral-850 text-neutral-500 hover:text-red-400 transition"
                        title="Usuń wiadomość"
                      >
                        <Trash2 size={12} />
                      </button>

                      {/* AI integration trigger */}
                      <button
                        onClick={() => {
                          setSelectedMessageForAi(msg);
                          handleGenerateAiSuggestions(msg);
                        }}
                        className="p-1 hover:bg-neutral-950 rounded border border-transparent hover:border-neutral-850 text-rose-500 hover:text-rose-400 transition"
                        title="Zaproponuj błyskawiczną odpowiedź (AI)"
                      >
                        <Sparkles size={12} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messageEndRef} />
          </div>

          {/* Form write input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-neutral-900 bg-neutral-950 flex gap-2">
            <input
              type="text"
              placeholder="Napisz do pokoju..."
              value={newMessageText}
              onChange={e => setNewMessageText(e.target.value)}
              className="flex-1 bg-neutral-900 text-xs border border-neutral-800 rounded-lg px-3 py-2 text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500/50 transition-colors"
            />
            <button
              type="submit"
              disabled={!newMessageText.trim()}
              className="p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Send size={14} />
            </button>
          </form>
        </div>

        {/* Right Section: AI Responder Assistant */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 border-t-rose-500/20 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-20 pointer-events-none">
              <Bot size={55} className="text-rose-500" />
            </div>

            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-neutral-900">
              <Sparkles className="text-rose-500 w-4 h-4" />
              <span className="text-[10px] uppercase font-mono font-black tracking-widest text-white">OMEGA AI Copilot</span>
            </div>

            <p className="text-[11px] text-neutral-400 leading-relaxed mb-4 font-sans">
              Wybierz dowolną wypowiedź z dyskusji, aby wygenerować profesjonalny szkic i schemat odpowiedzi.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-mono text-neutral-500 block mb-1">Tonacja Repliki</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: "professional", label: "Pro" },
                    { id: "friendly", label: "Przyjazny" },
                    { id: "witty", label: "Dowcipny" },
                    { id: "persuasive", label: "Biznes" }
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setAiTone(t.id as any)}
                      className={`px-2 py-1.5 rounded text-[10px] border font-semibold transition ${
                        aiTone === t.id 
                          ? "bg-rose-600/10 text-rose-300 border-rose-500/40 font-ans" 
                          : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:bg-neutral-900 hover:text-white"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {selectedMessageForAi && (
                <div className="p-2.5 bg-neutral-900/40 rounded-lg border border-neutral-900">
                  <span className="text-[9px] font-mono text-neutral-500 block mb-1">Analizowany wątek:</span>
                  <p className="text-[10px] text-neutral-300 italic truncate font-sans">
                    "{selectedMessageForAi.text}"
                  </p>
                </div>
              )}

              <button
                onClick={() => handleGenerateAiSuggestions(selectedMessageForAi)}
                disabled={isAiGenerating || messages.length === 0}
                className="w-full py-2.5 px-3 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-[0_0_15px_rgba(225,29,72,0.15)]"
              >
                {isAiGenerating ? (
                  <>
                    <RefreshCw size={12} className="animate-spin" />
                    Zamykanie kontekstu...
                  </>
                ) : (
                  <>
                    <Sparkles size={12} />
                    Wygeneruj szkice AI
                  </>
                )}
              </button>
            </div>
          </div>

          {/* AI Drafting Outputs */}
          <AnimatePresence>
            {aiResults && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {/* Intent Analytics */}
                <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase block mb-1">Analiza intencji:</span>
                  <p className="text-xs text-neutral-200 font-medium font-sans leading-relaxed">
                    {aiResults.senderIntent}
                  </p>
                </div>

                {/* Suggestions list */}
                <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-3">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase block">Propozycje odpowiedzi (AI):</span>
                  
                  {aiResults.suggestions.map((variant, ind) => (
                    <div 
                      key={ind} 
                      className="p-3 bg-neutral-900/40 hover:bg-neutral-900 border border-neutral-900 hover:border-neutral-800/85 rounded-xl relative group transition cursor-pointer"
                      onClick={() => {
                        setNewMessageText(variant);
                        toast.success(`Skopiowano wersję ${ind + 1} do edytora!`);
                      }}
                    >
                      <p className="text-xs text-neutral-300 leading-relaxed pr-6">{variant}</p>
                      <button className="absolute right-2 top-2 p-1 bg-neutral-950 border border-neutral-800 rounded text-neutral-400 opacity-0 group-hover:opacity-100 transition">
                        <ArrowRight size={10} />
                      </button>
                    </div>
                  ))}
                  <p className="text-[9px] text-neutral-500 text-center font-mono uppercase tracking-tight">
                    KLIKNIJ SZKIC, ABY SKOPIOWAĆ GO DO OKNA CZATU
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Modal - Create space */}
      {showCreateSpaceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowCreateSpaceModal(false)} />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-neutral-950 border border-neutral-800 p-6 rounded-2xl w-full max-w-md border-t-rose-500/20"
          >
            <h3 className="text-lg font-bold text-white mb-2 font-sans">Nowy Pokój Rozmów (Google Chat)</h3>
            <p className="text-xs text-neutral-400 mb-6 leading-relaxed font-sans">
              Utworzy to bezpieczny kanał komunikacyjny (Space) wewnątrz Twojej domeny Google Chat, do którego będziesz mógł doprosić innych użytkowników.
            </p>

            <form onSubmit={handleCreateSpace} className="space-y-4">
              <div>
                <label className="text-[10px] font-mono text-neutral-500 uppercase block mb-1">Nazwa pokoju</label>
                <input
                  type="text"
                  placeholder="np. Kampania Q4 Sposób Wirusowy"
                  value={newSpaceName}
                  onChange={e => setNewSpaceName(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateSpaceModal(false)}
                  className="px-4 py-2 hover:bg-neutral-900 text-neutral-400 rounded-lg text-xs font-semibold transition"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition"
                >
                  Utwórz pokój
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
