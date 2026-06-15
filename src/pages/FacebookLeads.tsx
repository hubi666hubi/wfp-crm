import { useEffect, useState, useMemo } from 'react';
import { auth } from '../lib/firebase';
import { 
  Share2, 
  Search, 
  Sparkles, 
  Trash2, 
  Check, 
  Copy, 
  ExternalLink, 
  X, 
  MessageSquare, 
  Flame, 
  FileText,
  Zap,
  Activity,
  ArrowUpRight,
  RefreshCw,
  Plus,
  Compass
} from 'lucide-react';
const Facebook = Share2;
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface FBPost {
  id: string;
  authorName: string;
  groupName: string;
  relativeTime: string;
  postText: string;
  hasDomain?: string;
}

interface FBLead {
  id: string;
  userId: string;
  postText: string;
  authorName: string;
  groupName: string;
  yourOffer: string;
  customInstructions?: string;
  intentLevel: string;
  painSummary: string;
  estimatedValueHex: string;
  valueFirstMessengerPitch: string;
  detectedCompanyUrl?: string;
  status: string;
  createdAt: string;
  // PRO Fields
  publicCommentStrategy?: string;
  videoPitchScript?: string;
  qualificationScore?: number;
  linkedinConnectPitch?: string;
  coldEmailSubject?: string;
  coldEmailBody?: string;
  // Sentiment Analysis Fields
  sentimentScore?: number;
  sentimentLabel?: string;
  priorityScore?: number;
  priorityLabel?: string;
  emotionalTriggers?: string[];
  sentimentExplanation?: string;
}

export function FacebookLeads() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'feed' | 'paste' | 'leads' | 'integrations' | 'sentiment' | 'machine'>('feed');
  const [simulatedPosts, setSimulatedPosts] = useState<FBPost[]>([]);
  const [savedLeads, setSavedLeads] = useState<FBLead[]>([]);
  const [generatingAiPost, setGeneratingAiPost] = useState(false);

  // Automated Integrations & Promos state
  const [fbAccount, setFbAccount] = useState<{
    connected: boolean;
    name: string;
    avatarUrl: string;
    profileId: string;
    tokenExpires: string;
    autopilot: boolean;
    autoComment: boolean;
    scannedGroups: string[];
  }>({
    connected: true,
    name: 'Hubert Nowak (Konto Integracyjne Główne)',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
    profileId: '61550927164821',
    tokenExpires: 'Bezterminowy (Klucz Elitarny)',
    autopilot: true,
    autoComment: true,
    scannedGroups: [
      'Automatyzacja procesów biznesowych i AI',
      'Zlecenia IT, NoCode, programowanie i copywriting',
      'Sztuczna Inteligencja dla Firm / Biznes'
    ]
  });

  const [promoCode, setPromoCode] = useState('');
  const [activePromos, setActivePromos] = useState<string[]>([]);
  const [unlockedSecretGroups, setUnlockedSecretGroups] = useState<boolean>(false);

  // Real-world Meta Messenger configuration state
  const [messengerConfig, setMessengerConfig] = useState({
    pageAccessToken: '',
    verifyToken: 'zapalnik_token_vip_2026',
    autopilotEnabled: false
  });
  const [isSavingMessenger, setIsSavingMessenger] = useState(false);

  const fetchMessengerConfig = async () => {
    try {
      const res = await fetch('/api/messenger/config');
      if (res.ok) {
        const data = await res.json();
        setMessengerConfig({
          pageAccessToken: data.pageAccessToken || '',
          verifyToken: data.verifyToken || 'zapalnik_token_vip_2026',
          autopilotEnabled: !!data.autopilotEnabled
        });
      }
    } catch (err) {
      console.error('Error fetching messenger config:', err);
    }
  };

  const handleSaveMessengerConfig = async () => {
    setIsSavingMessenger(true);
    try {
      const res = await fetch('/api/messenger/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messengerConfig)
      });
      if (!res.ok) throw new Error();
      toast.success('Pomyślnie zapisano konfigurację webhooka Messenger!');
    } catch {
      toast.error('Błąd zapisu parametrów integracji Messenger.');
    } finally {
      setIsSavingMessenger(false);
    }
  };

  // Growth Loop Machine State and Generator
  interface MachineNicheGroup {
    name: string;
    whyItWorks: string;
  }
  interface MachineData {
    nicheGroups?: MachineNicheGroup[];
    leadMagnet?: {
      title: string;
      description: string;
      keyword: string;
    };
    viralPost?: {
      hook: string;
      bodyText: string;
      cta: string;
    };
    messengerScript?: {
      firstMessage: string;
    };
  }
  const [growthMachine, setGrowthMachine] = useState<MachineData | null>(null);
  const [generatingMachine, setGeneratingMachine] = useState(false);

  const handleGenerateGrowthMachine = async () => {
    setGeneratingMachine(true);
    try {
      const res = await fetch('/api/facebook/growth-machine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerDescription: yourOffer })
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setGrowthMachine(data);
      toast.success('Maszyna Organicna została pomyślnie wygenerowana przez Gemini!');
    } catch {
      toast.error('Błąd generowania maszyny organicznej przez Gemini.');
    } finally {
      setGeneratingMachine(false);
    }
  };

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const code = promoCode.trim().toUpperCase();
    if (code === 'OJCIEC' || code === 'SMOKE') {
      if (activePromos.includes('OJCIEC')) {
        toast.error('Kod "OJCIEC" został już aktywowany!');
        return;
      }
      setActivePromos([...activePromos, 'OJCIEC']);
      setUnlockedSecretGroups(true);
      
      const bonusPosts = [
        {
          id: 'bonus-1',
          authorName: 'Marek Karwowski',
          groupName: '🔥 [PRO BONU] Elitarne Rozwiązania Biznesowe z Ojcem',
          relativeTime: 'Przed chwilą (ODBLOKOWANA OKAZJA)',
          postText: 'Pilnie poszukuję doświadczonego partnera do automatyzacji procesów w naszym holdingu. Interfejsy AI, integracja Pipedrive z CRM & Messenger, przygotowywanie spersonalizowanego mailingu. Budżet elastyczny od $8500+. Ktoś poleci sprawdzonych wyjadaczy?'
        },
        {
          id: 'bonus-2',
          authorName: 'Stanisław Wiśniewski',
          groupName: '🔥 [PRO BONU] Strategie AI & Automatyzacje',
          relativeTime: 'Teraz (ODBLOKOWANA OKAZJA)',
          postText: 'Poszukujemy zespołu, który wdroży kompletne automatyzacje lead-generation i lejek sprzedażowy przez Meta Ads z chatbotem. Chodzi o spięcie bazy danych i promptów. Budżet na start $4000. Tylko poważne oferty z portfolio zadowolonych klientów.'
        }
      ];
      setSimulatedPosts(prev => [...bonusPosts, ...prev]);
      
      setFbAccount(prev => ({
        ...prev,
        scannedGroups: [
          ...prev.scannedGroups,
          '🔥 [ODBLOKOWANE] Elitarne Rozwiązania Biznesowe z Ojcem',
          '🔥 [ODBLOKOWANE] Strategie AI & Automatyzacje'
        ]
      }));

      toast.success('🎁 KOD "OJCIEC/SMOKE" AKTYWNY! Odblokowano elitarne grupy biznesowe i darmowy credit PRO!');
      setPromoCode('');
    } else if (code) {
      toast.error('Nieprawidłowy kod promocyjny! Wskazówka: Spróbuj wpisać słowo "OJCIEC" lub "SMOKE", gdy palisz z ojcem.');
    }
  };

  const handleGenerateAiPost = async () => {
    setGeneratingAiPost(true);
    try {
      const res = await fetch('/api/facebook-leads/generate-simulated-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keywords })
      });
      if (!res.ok) throw new Error('Błąd generowania posta AI.');
      const newPost = await res.json();
      
      setSimulatedPosts(prev => [newPost, ...prev]);
      toast.success(`Wykryto nowy, symulowany post o wysokiej intencji! Autor: ${newPost.authorName}`);
    } catch (err) {
      console.error(err);
      toast.error('Nie udało się wygenerować postu AI.');
    } finally {
      setGeneratingAiPost(false);
    }
  };
  
  // Settings & keywords
  const [keywords, setKeywords] = useState<string[]>(['automatyzacja', 'szukam', 'zlece', 'CRM', 'programista', 'stronę']);
  const [newKeyword, setNewKeyword] = useState('');
  
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [intentFilter, setIntentFilter] = useState('All');
  
  // Loading and Detail UI state
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
  const [drawerOutreachTab, setDrawerOutreachTab] = useState<'messenger' | 'comment' | 'linkedin' | 'email' | 'loom'>('messenger');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [selectedLead, setSelectedLead] = useState<FBLead | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [refreshingFeed, setRefreshingFeed] = useState(false);

  // Manual Paste Form State
  const [pastedText, setPastedText] = useState('');
  const [pastedAuthor, setPastedAuthor] = useState('');
  const [pastedGroup, setPastedGroup] = useState('');
  const [yourOffer, setYourOffer] = useState(
    'Profesjonalne systemy automatyzacji biznesu AI, integracje platform CRM (Pipedrive, HubSpot) z komunikatorami, automatyczny mailing Value-First oraz budowa dedykowanych asystentów AI do natychmiastowego zamykania klientów.'
  );
  const [customInstructions, setCustomInstructions] = useState('');

  // Standalone Real-time Sentiment & Prioritisation analysis
  const [sentimentText, setSentimentText] = useState('');
  const [analyzingSentiment, setAnalyzingSentiment] = useState(false);
  const [sentimentResult, setSentimentResult] = useState<{
    sentimentScore: number;
    sentimentLabel: string;
    priorityScore: number;
    priorityLabel: string;
    emotionalTriggers: string[];
    sentimentExplanation: string;
    tacticalActionPlan: string[];
    suggestedResponseDraft: string;
  } | null>(null);

  const handleAnalyzeSentiment = async () => {
    if (!sentimentText.trim()) {
      toast.error('Wpisz tekst do analizy emocjonalnej!');
      return;
    }
    setAnalyzingSentiment(true);
    try {
      const res = await fetch('/api/facebook-leads/sentiment-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: sentimentText })
      });
      if (!res.ok) throw new Error('Błąd analizy wydźwięku przez AI.');
      const data = await res.json();
      setSentimentResult(data);
      toast.success('Analiza psychologiczna & Priorytet ustalony!');
    } catch (err) {
      console.error(err);
      toast.error('Nie udało się przeanalizować wydźwięku.');
    } finally {
      setAnalyzingSentiment(false);
    }
  };

  const loadingSteps = [
    'Tunelowanie bezpiecznego połączenia przez API Facebook Graph Emulator...',
    'Odpytywanie wirtualnego scrapera grup biznesowych pod kątem słów kluczowych...',
    'Przeprowadzanie analizy semantycznej i wykrywanie intencji zakupowej...',
    'Uruchamianie silnika Gemini 3.5-flash w celu zmapowania słabych punktów autora...',
    'Generowanie wysoce angażującej i luźnej wiadomości Value-First na Messenger...',
    'Zapisywanie nowego profilu leada w chmurze Firebase...'
  ];

  const fetchSimulatedFeed = async () => {
    setRefreshingFeed(true);
    try {
      const res = await fetch('/api/facebook-leads/simulate-feed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (!res.ok) throw new Error('Błąd pobierania symulowanego feedu.');
      const data = await res.json();
      setSimulatedPosts(data);
    } catch (err) {
      console.error(err);
      toast.error('Nie udało się załadować wirtualnego monitora grup.');
    } finally {
      setRefreshingFeed(false);
    }
  };

  const fetchSavedLeads = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;
      const res = await fetch(`/api/facebook-leads?userId=${userId}`);
      if (!res.ok) throw new Error('Błąd pobierania zapisanych leadów.');
      const data = await res.json();
      setSavedLeads(data);
    } catch (err) {
      console.error(err);
      toast.error('Błąd podczas ładowania bazy wyciągniętych leadów.');
    }
  };

  useEffect(() => {
    let active = true;
    const runInits = async () => {
      await Promise.resolve();
      if (active) {
        fetchSimulatedFeed();
        fetchSavedLeads();
        fetchMessengerConfig();
      }
    };
    runInits();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [loading, loadingSteps.length]);

  const handleAddKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;
    const cleanKw = newKeyword.trim().toLowerCase();
    if (keywords.includes(cleanKw)) {
      toast.error('To słowo kluczowe jest już monitorowane!');
      return;
    }
    setKeywords([...keywords, cleanKw]);
    setNewKeyword('');
    toast.success(`Dodano słowo kluczowe: "${cleanKw}"`);
  };

  const handleRemoveKeyword = (kw: string) => {
    setKeywords(keywords.filter((k) => k !== kw));
    toast.success(`Usunięto monitorowanie słowa: "${kw}"`);
  };

  const handleAnalyzePost = async (postContent: string, author?: string, group?: string) => {
    setLoadingStep(0);
    setLoading(true);
    try {
      const userId = auth.currentUser?.uid;
      const response = await fetch('/api/facebook-leads/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postText: postContent,
          authorName: author || '',
          groupName: group || '',
          yourOffer,
          customInstructions,
          userId,
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Błąd analizy posta.');
      }

      toast.success(`Wykryto i wygenerowano lead dla użytkownika: ${resData.lead.authorName}!`);
      
      // Clear paste form if analyzing from paste tab
      if (activeTab === 'paste') {
        setPastedText('');
        setPastedAuthor('');
        setPastedGroup('');
        setCustomInstructions('');
      }

      await fetchSavedLeads();
      setSelectedLead(resData.lead);
      setActiveTab('leads');
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : 'Wystąpił nieoczekiwany błąd serwera.';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLead = async (leadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Czy na pewno chcesz usunąć ten wyekstrahowany lead z bazy?')) return;

    try {
      const response = await fetch('/api/facebook-leads/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ leadId }),
      });

      if (!response.ok) throw new Error('Błąd usuwania.');

      toast.success('Lead został trwale usunięty.');
      setSavedLeads((prev) => prev.filter((l) => l.id !== leadId));
      if (selectedLead?.id === leadId) {
        setSelectedLead(null);
      }
    } catch (err) {
      console.error(err);
      toast.error('Nie udało się usunąć leada.');
    }
  };

  const handleUpdateStatus = async (leadId: string, newStatus: string) => {
    try {
      // Optimistic client-side update first to look ultra-responsive
      setSavedLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
      if (selectedLead?.id === leadId) {
        setSelectedLead(prev => prev ? { ...prev, status: newStatus } : null);
      }
      
      const response = await fetch('/api/facebook-leads/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ leadId, status: newStatus }),
      });
      if (!response.ok) throw new Error('Nie udało się zapisać statusu na serwerze.');

      toast.success(`Zaktualizowano status leada na: ${newStatus}`);
    } catch (err) {
      console.error(err);
      toast.error('Błąd aktualizacji statusu na serwerze.');
    }
  };

  const [analyzingLeadSentimentId, setAnalyzingLeadSentimentId] = useState<string | null>(null);

  const handleAnalyzeLeadSentimentOnTheFly = async (lead: FBLead) => {
    setAnalyzingLeadSentimentId(lead.id);
    try {
      const res = await fetch('/api/facebook-leads/sentiment-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: lead.postText })
      });
      if (!res.ok) throw new Error();
      const analysis = await res.json();
      
      const updatedLead = {
        ...lead,
        sentimentScore: analysis.sentimentScore,
        sentimentLabel: analysis.sentimentLabel,
        priorityScore: analysis.priorityScore,
        priorityLabel: analysis.priorityLabel,
        emotionalTriggers: analysis.emotionalTriggers,
        sentimentExplanation: analysis.sentimentExplanation,
      };

      // Optimistically update states
      setSelectedLead(updatedLead);
      setSavedLeads(prev => prev.map(l => l.id === lead.id ? updatedLead : l));
      toast.success('Pomyślnie zanalizowano psychologiczny wydźwięk okazji!');
    } catch {
      toast.error('Błąd podczas próby analizy wydźwięku przez AI.');
    } finally {
      setAnalyzingLeadSentimentId(null);
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`Skopiowano ${fieldName}!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Filter simulated feed posts based on monitored keywords
  const filteredSimulatedPosts = simulatedPosts.filter((post) => {
    const text = post.postText.toLowerCase();
    const group = post.groupName.toLowerCase();
    const author = post.authorName.toLowerCase();
    
    // Checks if post matches any monitored keyword
    const matchesKeyword = keywords.length === 0 || keywords.some(kw => text.includes(kw.toLowerCase()));
    
    // Checks query search
    const matchesQuery = searchQuery === '' || 
      text.includes(searchQuery.toLowerCase()) || 
      group.includes(searchQuery.toLowerCase()) || 
      author.includes(searchQuery.toLowerCase());

    return matchesKeyword && matchesQuery;
  });

  // Inject simulated high priority lead if cache is active
  const computedSavedLeadsWithFastLane = useMemo(() => {
    const hasZrzut = savedLeads.some(l => l.groupName === 'Kolejka ZRZUT' || l.groupName?.includes('ZRZUT') || l.authorName?.includes('ZRZUT'));
    if (hasZrzut) return savedLeads;

    const zrzutTopic = localStorage.getItem("omega_zrzut_vsl_topic") || "Automatyzacja Outreach wideo 2026";
    const zrzutMsg = localStorage.getItem("omega_zrzut_zapalnik_message") || "Cześć! Zauważyłem, że budujesz lejek konwersji...";
    
    const simulatedZrzutLead = {
      id: "simulated-zrzut-lead",
      userId: "system",
      authorName: "Marek Janowski // Kolejka ZRZUT 🔴",
      groupName: "Kolejka ZRZUT",
      postText: `Hej, szukam sprawdzonego bota lub skryptu do seryjnej wysyłki spersonalizowanych audio/wideo na Messengerze, który reaguje na najnowsze trendy rynkowe (np. "${zrzutTopic}"). Budżet nie gra roli, liczy się jakość i szybkie wdrożenie przed wieczorem.`,
      painSummary: `Manualny outreach zajmuje zbyt wiele czasu, brak integracji z radarem trendów i automatycznym VSL.`,
      qualificationScore: 99,
      intentLevel: "Gorący",
      estimatedValueHex: "$3000+",
      outreachPitch: zrzutMsg,
      status: "Do kontaktu",
      createdAt: new Date().toISOString()
    };
    return [simulatedZrzutLead, ...savedLeads];
  }, [savedLeads]);

  // Filter saved leads
  const filteredSavedLeads = computedSavedLeadsWithFastLane.filter((lead) => {
    const query = searchQuery.toLowerCase();
    const matchesQuery = 
      lead.authorName.toLowerCase().includes(query) ||
      lead.groupName.toLowerCase().includes(query) ||
      lead.painSummary.toLowerCase().includes(query) ||
      lead.postText.toLowerCase().includes(query);

    if (intentFilter === 'All') return matchesQuery;
    return matchesQuery && lead.intentLevel.toLowerCase() === intentFilter.toLowerCase();
  });

  const getIntentBadgeColor = (intent: string) => {
    switch (intent) {
      case 'Gorący':
        return 'bg-red-500/15 text-red-400 border-red-500/30';
      case 'Ciepły':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'Zimny':
      default:
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    }
  };

  return (
    <div className="space-y-8" id="facebook-leads-root">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1 px-2.5 rounded bg-blue-600/15 text-blue-400 text-xs font-mono font-medium border border-blue-500/20 uppercase tracking-widest flex items-center gap-1.5">
              <Facebook size={12} /> FACEBOOK PRO MONITOR
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            Detektor Leadów z Grup FB <MessageSquare className="text-blue-500 animate-pulse" size={26} />
          </h1>
          <p className="text-neutral-400 mt-1 max-w-3xl font-sans">
            Wychwytuj zlecenia i okazje biznesowe bezpośrednio z polskich grup na Facebooku. Wklej surowy post lub przeglądaj inteligentne monity, a sztuczna inteligencja wygeneruje dopasowany, nieodparty, bezpośredni Messenger Outreach oparty na wartości.
          </p>
        </div>
      </div>

      {/* Loading overlay for Deep AI Extraction */}
      {loading && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
          <div className="w-24 h-24 rounded-full border-t-4 border-blue-600 animate-spin flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(24,119,242,0.4)]">
            <Facebook className="text-blue-400 animate-pulse" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-wide font-sans mb-3 text-center">
            PROWADZENIE GŁĘBOKIEJ ANALIZY SOCIAL RESEARCH...
          </h2>
          <p className="text-blue-400 font-mono text-sm max-w-xl animate-pulse">
            {loadingSteps[loadingStep]}
          </p>
          <div className="mt-8 text-xs text-neutral-500 max-w-md">
            Wychwytujemy kontekst grupy, oceniamy intencje zakupowe, kalkulujemy uśredniony budżet i formułujemy ultra-płynny Messenger Pitch. Analiza trwa kilka sekund.
          </div>
        </div>
      )}

      {/* Grid Layout: Controls / Keywords on Left, Content on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Keyword settings & offer syncing */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Keyword Monitor */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl" />
            <h3 className="text-sm font-mono font-semibold text-neutral-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Activity className="text-blue-500 animate-pulse" size={16} /> Monitor Słów Kluczowych
            </h3>

            <form onSubmit={handleAddKeyword} className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Dodaj słowo kluczowe..."
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                className="flex-1 bg-neutral-900 border border-neutral-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg py-1.5 px-3 text-xs text-neutral-200 outline-none transition"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg transition text-xs font-semibold flex items-center gap-1"
              >
                <Plus size={14} /> Dodaj
              </button>
            </form>

            <div className="flex flex-wrap gap-1.5 max-h-[150px] overflow-y-auto pr-1">
              {keywords.map((kw) => (
                <span
                  key={kw}
                  className="inline-flex items-center gap-1 bg-blue-950/20 text-blue-400 border border-blue-500/20 text-xs px-2.5 py-1 rounded"
                >
                  #{kw}
                  <button
                    type="button"
                    onClick={() => handleRemoveKeyword(kw)}
                    className="text-blue-500 hover:text-white transition ml-1"
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
            
            <p className="text-[11px] text-neutral-500 mt-3 font-sans leading-relaxed">
              System automatycznie filtruje wirtualny strumień i wykrywa intencje postów zawierających te frazy.
            </p>
          </div>

          {/* Core Outreach Offer Profile */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5">
            <h3 className="text-sm font-mono font-semibold text-neutral-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Compass className="text-blue-400" size={16} /> Profil Oferty w Zleceniach
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono text-neutral-400 uppercase tracking-wider mb-1.5">
                  Twoja Oferta Biznesowa (Dopasowanie AI)
                </label>
                <textarea
                  rows={4}
                  value={yourOffer}
                  onChange={(e) => setYourOffer(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg py-2 px-3 text-xs text-neutral-200 outline-none transition font-sans leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-neutral-400 uppercase tracking-wider mb-1.5">
                  Wskazówki stylu Messenger (Opcjonalnie)
                </label>
                <input
                  type="text"
                  placeholder="np. Bardzo luźny styl, używaj emotikonó, brak panowania"
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg py-1.5 px-3 text-xs text-neutral-200 outline-none transition"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Tabbed Workspace */}
        <div className="lg:col-span-8 space-y-6">
          
          {unlockedSecretGroups && (
            <div className="p-3.5 bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs animate-pulse text-amber-300 font-sans font-bold">
              <span>🎁 BONUS OD OJCA ODBLOKOWANY: Dodano prestiżowe, wysoce lukratywne grupy VIP do monitoringu!</span>
              <span className="text-[10px] bg-amber-950 font-mono text-amber-500 px-2 py-0.5 rounded border border-amber-500/20 shrink-0 font-bold">OJCIEC VIP</span>
            </div>
          )}
          
          {/* Work Tabs */}
          <div className="flex flex-wrap border-b border-neutral-800 gap-1 bg-neutral-950 p-1 rounded-xl border">
            <button
              onClick={() => setActiveTab('feed')}
              className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition uppercase ${
                activeTab === 'feed'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <Activity size={14} /> Wirtualny Monitor Grup
            </button>
            <button
              onClick={() => setActiveTab('paste')}
              className={`flex-1 min-w-[124px] flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition uppercase ${
                activeTab === 'paste'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <Zap size={14} /> Ręczny Skaner / Paste
            </button>
            <button
              onClick={() => {
                setActiveTab('leads');
                setSelectedLead(null);
              }}
              className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition uppercase ${
                activeTab === 'leads'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <FileText size={14} /> Baza Leadów ({filteredSavedLeads.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('sentiment');
                setSelectedLead(null);
              }}
              className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition uppercase ${
                activeTab === 'sentiment'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <Sparkles size={14} /> 🧠 Analiza Wydźwięku
            </button>
            <button
              onClick={() => {
                setActiveTab('integrations');
                setSelectedLead(null);
              }}
              className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition uppercase ${
                activeTab === 'integrations'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <Share2 size={14} /> 🔗 Konta & Promocje PRO
            </button>
            <button
              onClick={() => {
                setActiveTab('machine');
                setSelectedLead(null);
              }}
              className={`flex-1 min-w-[150px] flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition uppercase ${
                activeTab === 'machine'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <Flame size={14} className="text-red-400 animate-pulse" /> 🚀 Maszyna Growth Loop
            </button>
          </div>

          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
            
            {/* SEARCH AND FILTER BAR (Renders across active workspace) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-neutral-900 pb-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600" size={14} />
                <input
                  type="text"
                  placeholder="Wyszukaj zlecenia, użytkowników, grupy..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 rounded-lg pl-8 pr-4 py-2 outline-none focus:border-blue-500 w-full transition"
                />
              </div>

              {activeTab === 'feed' && (
                <button
                  onClick={fetchSimulatedFeed}
                  disabled={refreshingFeed}
                  className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 p-2.5 rounded-lg transition disabled:opacity-50 text-xs font-semibold flex items-center gap-1.5"
                  title="Odśwież monitowanie"
                >
                  <RefreshCw size={12} className={refreshingFeed ? 'animate-spin' : ''} />
                  Odśwież
                </button>
              )}

              {activeTab === 'leads' && (
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex bg-neutral-900 border border-neutral-800 p-0.5 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setViewMode('kanban')}
                      className={`px-3 py-1.5 text-[11px] font-bold rounded-md transition duration-150 ${viewMode === 'kanban' ? 'bg-blue-600 text-white shadow' : 'text-neutral-400 hover:text-neutral-200'}`}
                    >
                      📊 Lejek PRO
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('list')}
                      className={`px-3 py-1.5 text-[11px] font-bold rounded-md transition duration-150 ${viewMode === 'list' ? 'bg-blue-600 text-white shadow' : 'text-neutral-400 hover:text-neutral-200'}`}
                    >
                      📋 Klasyczna Lista
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-mono text-neutral-500">Intencja</span>
                    <select
                      value={intentFilter}
                      onChange={(e) => setIntentFilter(e.target.value)}
                      className="bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 rounded px-2.5 py-1.5 outline-none focus:border-blue-500"
                    >
                      <option value="All">Wszystkie</option>
                      <option value="Gorący">Gorący</option>
                      <option value="Ciepły">Ciepły</option>
                      <option value="Zimny">Zimny</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* TAB CONTENT: 1. LIVE MONITOR FEED */}
            {activeTab === 'feed' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-950/10 border border-blue-500/20 p-4 rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <div>
                      <p className="text-xs font-mono font-semibold text-neutral-200">
                        Skanowanie fb_groups_live z Gemini PRO
                      </p>
                      <p className="text-[10px] text-neutral-500 font-sans mt-0.5">
                        Monitoruje {keywords.length} słów kluczowych pod kątem realnych potrzeb w grupach.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleGenerateAiPost}
                    disabled={generatingAiPost}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50 flex items-center gap-2 shadow-[0_0_15px_rgba(24,119,242,0.25)]"
                  >
                    <Sparkles size={13} className={generatingAiPost ? "animate-spin" : ""} />
                    {generatingAiPost ? "Symulacja..." : "🤖 Symuluj nowy post AI z grup"}
                  </button>
                </div>

                {filteredSimulatedPosts.length === 0 ? (
                  <div className="text-center py-16 text-neutral-500">
                    <Compass size={40} className="mx-auto text-neutral-700 mb-3 animate-pulse" />
                    <p className="text-xs">Brak nowo wykrytych wzmianek w monitorowanych grupach</p>
                    <p className="text-[11px] text-neutral-600 mt-1">Upewnij się, że słowa kluczowe są wystarczająco dopasowane lub rozszerz ich bazę.</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {filteredSimulatedPosts.map((post) => (
                      <div
                        key={post.id}
                        className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-5 hover:border-blue-500/30 transition relative overflow-hidden group"
                      >
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex items-center gap-2.5">
                            <span className="p-2 bg-blue-600/10 text-blue-400 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition">
                              <Facebook size={16} />
                            </span>
                            <div>
                              <h4 className="text-xs font-bold text-white tracking-wide">
                                {post.authorName}
                              </h4>
                              <p className="text-[10px] text-neutral-500 font-medium">
                                {post.groupName} • {post.relativeTime}
                              </p>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => handleAnalyzePost(post.postText, post.authorName, post.groupName)}
                            className="bg-blue-600/10 hover:bg-blue-600 border border-blue-500/20 text-blue-400 hover:text-white text-[11px] font-mono font-medium py-1 px-3 rounded-lg transition flex items-center gap-1.5 shadow-sm"
                          >
                            <Sparkles size={12} /> ANALIZUJ OKAZJĘ
                          </button>
                        </div>

                        <p className="text-xs text-neutral-300 leading-relaxed font-sans bg-neutral-950 p-3.5 rounded-lg border border-neutral-900 border-l border-l-blue-500 whitespace-pre-wrap">
                          {post.postText}
                        </p>

                        {post.hasDomain && (
                          <div className="mt-3 flex items-center justify-between text-[11px] bg-neutral-900/40 p-2 rounded border border-neutral-850">
                            <span className="text-neutral-500 flex items-center gap-1 font-mono">
                              Wykryta strona www: <span className="text-blue-400 font-semibold">{post.hasDomain}</span>
                            </span>
                            <span className="text-emerald-500 font-mono text-[10px] font-semibold flex items-center gap-1">
                              Intencja: Wysoka
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: 2. MANUAL POST PASTER */}
            {activeTab === 'paste' && (
              <div className="space-y-6">
                <div className="p-4 bg-blue-950/10 border border-blue-900/20 rounded-xl space-y-2">
                  <h4 className="text-xs font-bold font-mono uppercase text-blue-400 flex items-center gap-1.5">
                    <Zap size={14} /> Wklejacz Ręczny Zleceń z Messenger / FB
                  </h4>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Masz post lub długi komentarz bezpośrednio z grupy na Facebooku, LinkedIna lub komunikatora? Wklej go poniżej, a system automatycznie rozłoży go na czynniki pierwsze.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-mono text-neutral-400 uppercase tracking-widest mb-1.5">
                      Autor wpisu / konta (Opcjonalnie)
                    </label>
                    <input
                      type="text"
                      placeholder="np. Hubert Wiśniewski"
                      value={pastedAuthor}
                      onChange={(e) => setPastedAuthor(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg py-2 px-3.5 text-xs text-neutral-200 outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-neutral-400 uppercase tracking-widest mb-1.5">
                      Konto / Grupa (Opcjonalnie)
                    </label>
                    <input
                      type="text"
                      placeholder="np. Zlecenia Marketing & IT"
                      value={pastedGroup}
                      onChange={(e) => setPastedGroup(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg py-2 px-3.5 text-xs text-neutral-200 outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-neutral-400 uppercase tracking-widest mb-1.5">
                    Surowa treść posta / wiadomości <span className="text-blue-500">*</span>
                  </label>
                  <textarea
                    rows={6}
                    required
                    placeholder="Wklej tutaj treść..."
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg py-3 px-4 text-xs text-neutral-200 outline-none transition font-sans leading-relaxed whitespace-pre-wrap"
                  />
                </div>

                <button
                  type="button"
                  disabled={!pastedText || loading}
                  onClick={() => handleAnalyzePost(pastedText, pastedAuthor, pastedGroup)}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-semibold py-3 rounded-xl text-xs tracking-wider transition uppercase shadow-[0_0_20px_rgba(24,119,242,0.2)]"
                >
                  Wyślij do głębokiej analizy AI & Skanera
                </button>
              </div>
            )}

            {/* TAB CONTENT: 3. EXTRACTED SAVED LEADS DATABASE */}
            {activeTab === 'leads' && (
              <div className="space-y-6">
                {/* Dynamic Stats Section */}
                {savedLeads.length > 0 && (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 bg-neutral-900/40 p-4 rounded-xl border border-neutral-850">
                    <div className="p-3 bg-neutral-950/60 border border-neutral-850/60 rounded-lg flex flex-col justify-between">
                      <span className="text-[9px] font-mono uppercase tracking-wider text-neutral-500">Zapisane szanse</span>
                      <span className="text-xl font-bold font-mono text-white mt-1">
                        {savedLeads.length} <span className="text-[10px] text-neutral-500 font-sans font-normal">leadów</span>
                      </span>
                    </div>
                    <div className="p-3 bg-neutral-950/60 border border-neutral-850/60 rounded-lg flex flex-col justify-between">
                      <span className="text-[9px] font-mono uppercase tracking-wider text-neutral-500">Moc kwalifikacji (Śr)</span>
                      <span className="text-xl font-bold font-mono text-emerald-400 mt-1">
                        {Math.round(savedLeads.reduce((acc, l) => acc + (l.qualificationScore || 75), 0) / savedLeads.length)}%
                      </span>
                    </div>
                    <div className="p-3 bg-neutral-950/60 border border-neutral-850/60 rounded-lg flex flex-col justify-between">
                      <span className="text-[9px] font-mono uppercase tracking-wider text-neutral-500">Wartość lejka (Szac.)</span>
                      <span className="text-xl font-bold font-mono text-blue-400 mt-1">
                        ${savedLeads.reduce((acc, l) => {
                          const budget = l.estimatedValueHex || '';
                          if (budget.includes('Wysoki') || budget.includes('$3000+')) return acc + 4000;
                          if (budget.includes('Średni') || budget.includes('$1000')) return acc + 2000;
                          return acc + 750;
                        }, 0)}
                      </span>
                    </div>
                    <div className="p-3 bg-neutral-950/60 border border-neutral-850/60 rounded-lg flex flex-col justify-between">
                      <span className="text-[9px] font-mono uppercase tracking-wider text-neutral-500">Brak outreach</span>
                      <span className="text-xl font-bold font-mono text-amber-500 mt-1">
                        {savedLeads.filter(l => l.status === 'Do kontaktu').length} <span className="text-[10px] text-neutral-500 font-sans font-normal">czeka</span>
                      </span>
                    </div>
                  </div>
                )}

                {/* HIGH-PRIORITY FAST-LANE ZRZUT SECTION */}
                {computedSavedLeadsWithFastLane.some(l => l.groupName === 'Kolejka ZRZUT' || l.groupName?.includes('ZRZUT') || l.authorName?.includes('ZRZUT')) && (
                  <div className="bg-gradient-to-r from-red-950/30 via-neutral-950 to-neutral-950 border border-red-500/25 p-5 rounded-2xl space-y-4 relative overflow-hidden shadow-[0_4px_25px_rgba(239,68,68,0.15)]">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
                    <div className="flex items-center justify-between flex-wrap gap-2 border-b border-red-500/10 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                        <span className="bg-red-500/10 text-red-400 text-[10px] font-mono font-black px-2.5 py-0.5 rounded border border-red-500/25 uppercase tracking-wider">
                          LEAD KOLEJKI ZRZUT (FAST-LANE)
                        </span>
                        <p className="text-xs text-neutral-400">Gorące szanse z grup zidentyfikowane z najnowszego radaru trendów</p>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-rose-400">OPERACJA ZRZUT 21:00 AKTUALNA</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {computedSavedLeadsWithFastLane.filter(l => l.groupName === 'Kolejka ZRZUT' || l.groupName?.includes('ZRZUT') || l.authorName?.includes('ZRZUT')).map((lead) => {
                        const defaultPitch = `Cześć! Zauważyłem, że interesuje Cię ten nowy dynamiczny kierunek. Mamy na to gotowy schemat działania. Sprawdź i odpisz!`;
                        return (
                          <div 
                            key={`zrzut-${lead.id}`}
                            onClick={() => setSelectedLead(lead)}
                            className={`bg-neutral-900/80 p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden group ${
                              lead?.id === selectedLead?.id ? "border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.15)]" : "border-neutral-805 hover:border-neutral-700"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="text-[10px] bg-red-500/10 text-red-400 font-bold px-2 py-0.5 rounded border border-red-500/20">
                                {lead.intentLevel || 'Gorący'}
                              </span>
                              <span className="text-[10px] text-neutral-500 font-mono">Dopasowanie: {lead.qualificationScore || 95}%</span>
                            </div>
                            <h4 className="text-sm font-black text-white group-hover:text-red-400 transition-colors uppercase tracking-tight">{lead.authorName}</h4>
                            <p className="text-xs text-neutral-350 font-sans mt-1 line-clamp-2 leading-relaxed italic">"{lead.postText}"</p>
                            
                            <div className="mt-3 bg-black/40 border border-neutral-850 p-2.5 rounded-lg space-y-2">
                              <span className="text-[9px] font-mono text-neutral-500 uppercase block">Generowany Outreach Pitch:</span>
                              <p className="text-[11px] text-blue-300 font-sans italic line-clamp-2 leading-normal">"{lead.outreachPitch || defaultPitch}"</p>
                              <div className="flex items-center gap-2 pt-1 border-t border-neutral-850/65">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(lead.outreachPitch || defaultPitch);
                                    toast.success("Skopiowano Pitch pierwszej wiadomości!");
                                  }}
                                  className="bg-neutral-900 hover:bg-neutral-850 text-[10px] text-neutral-300 font-bold px-2.5 py-1 rounded border border-neutral-850 cursor-pointer flex items-center gap-1 transition-colors"
                                >
                                  <Copy size={10} /> Schowek
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedLead(lead);
                                    toast.success("Wybrano leada do podglądu!");
                                  }}
                                  className="bg-red-600/15 border border-red-500/30 text-red-400 text-[10px] font-bold px-3 py-1 rounded hover:bg-red-600/25 cursor-pointer ml-auto transition-colors"
                                >
                                  Wybierz Lead
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {filteredSavedLeads.length === 0 ? (
                  <div className="py-16 text-center text-neutral-500">
                    <FileText size={44} className="mx-auto text-neutral-700 mb-3 animate-pulse" />
                    <p className="text-xs">Brak wyciągniętych leadów w bazie danych mitygujących te filtry</p>
                    <p className="text-[11px] text-neutral-600 mt-1">
                      Spróbuj zresetować słowa kluczowe lub filtry intencji.
                    </p>
                  </div>
                ) : (
                  <div>
                    {viewMode === 'kanban' ? (
                      /* KANBAN PIPE WORKSPACE VIEW */
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5 items-stretch overflow-x-auto pb-4">
                        {[
                          { id: 'Do kontaktu', label: 'Do kontaktu 📥', color: 'border-l-blue-500/80 bg-blue-500/5 hover:border-blue-500' },
                          { id: 'Wysłano PM / Komentarz', label: 'Wysłano PM 📣', color: 'border-l-amber-500/80 bg-amber-500/5 hover:border-amber-500' },
                          { id: 'Odpowiedział', label: 'Odpowiedział 💬', color: 'border-l-emerald-500/80 bg-emerald-500/5 hover:border-emerald-500' },
                          { id: 'Negocjacja', label: 'Negocjacje 💸', color: 'border-l-indigo-500/80 bg-indigo-500/5 hover:border-indigo-500' },
                          { id: 'Zamknięty / Aktywny', label: 'Wygrane 🎉', color: 'border-l-purple-500/80 bg-purple-500/5 hover:border-purple-500' },
                        ].map((col) => {
                          const colLeads = filteredSavedLeads.filter((l) => l.status === col.id);
                          return (
                            <div 
                              key={col.id}
                              className="bg-neutral-900/25 border border-neutral-850/80 rounded-xl p-3 flex flex-col min-w-[210px] flex-1"
                            >
                              <div className="flex items-center justify-between pb-2 border-b border-neutral-850/80 mb-3 font-sans">
                                <span className="text-[11px] font-bold text-neutral-400 capitalize">
                                  {col.label}
                                </span>
                                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
                                  {colLeads.length}
                                </span>
                              </div>

                              <div className="space-y-2.5 flex-1 max-h-[480px] overflow-y-auto pr-0.5 custom-scrollbar">
                                {colLeads.length === 0 ? (
                                  <div className="h-20 flex items-center justify-center border border-dashed border-neutral-850 rounded-lg text-center p-3">
                                    <span className="text-[10px] font-sans text-neutral-600 italic">Pusta kolumna</span>
                                  </div>
                                ) : (
                                  colLeads.map((lead) => (
                                    <div
                                      key={lead.id}
                                      onClick={() => setSelectedLead(lead)}
                                      className={`p-3 rounded-lg border border-neutral-850 bg-neutral-900/65 cursor-pointer hover:border-neutral-750 hover:bg-neutral-900/90 transition flex flex-col gap-2 relative group overflow-hidden border-l-2 ${col.color}`}
                                      id={`kanban-card-${lead.id}`}
                                    >
                                      <div>
                                        <div className="flex items-center justify-between mb-1">
                                          <h5 className="text-[11px] font-bold text-white truncate max-w-[110px]">
                                            {lead.authorName}
                                          </h5>
                                          <span className="text-[9px] font-mono text-emerald-400 font-bold bg-emerald-950/80 border border-emerald-900 px-1 rounded">
                                            {lead.qualificationScore || 75}%
                                          </span>
                                        </div>
                                        <p className="text-[10px] text-neutral-400 line-clamp-2 leading-relaxed">
                                          {lead.painSummary}
                                        </p>
                                      </div>

                                      <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-neutral-850/45">
                                        <div className="flex gap-1.5">
                                          <button
                                            disabled={col.id === 'Do kontaktu'}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const statusSeq = ['Do kontaktu', 'Wysłano PM / Komentarz', 'Odpowiedział', 'Negocjacja', 'Zamknięty / Aktywny'];
                                              const idx = statusSeq.indexOf(lead.status);
                                              if (idx > 0) handleUpdateStatus(lead.id, statusSeq[idx - 1]);
                                            }}
                                            className="p-1 rounded bg-neutral-950 border border-neutral-800 disabled:opacity-30 hover:bg-neutral-850 font-mono text-[10px] text-neutral-400 font-black"
                                            title="Przesuń cofaj"
                                          >
                                            ←
                                          </button>
                                          <button
                                            disabled={col.id === 'Zamknięty / Aktywny'}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const statusSeq = ['Do kontaktu', 'Wysłano PM / Komentarz', 'Odpowiedział', 'Negocjacja', 'Zamknięty / Aktywny'];
                                              const idx = statusSeq.indexOf(lead.status);
                                              if (idx < statusSeq.length - 1 && idx !== -1) handleUpdateStatus(lead.id, statusSeq[idx + 1]);
                                            }}
                                            className="p-1 rounded bg-neutral-950 border border-neutral-800 disabled:opacity-30 hover:bg-neutral-850 font-mono text-[10px] text-neutral-400 font-black"
                                            title="Spasuj przód"
                                          >
                                            →
                                          </button>
                                        </div>

                                        <button
                                          onClick={(e) => handleDeleteLead(lead.id, e)}
                                          className="p-1 rounded text-neutral-600 hover:text-red-400 hover:bg-red-950/20 transition"
                                        >
                                          <Trash2 size={10} />
                                        </button>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* CLASSIC FLAT LIST VIEW */
                      <div className="space-y-3.5 max-h-[580px] overflow-y-auto pr-1 custom-scrollbar">
                        {filteredSavedLeads.map((lead) => (
                          <div
                            key={lead.id}
                            onClick={() => setSelectedLead(lead)}
                            className={`p-4 rounded-xl border border-neutral-800 bg-neutral-900/30 hover:bg-neutral-900/70 transition cursor-pointer flex items-start gap-4 relative overflow-hidden group ${
                              lead.id === selectedLead?.id ? 'border-blue-500/50 bg-neutral-900/70' : ''
                            }`}
                            id={`list-card-${lead.id}`}
                          >
                            <div className="p-2.5 bg-neutral-900 border border-neutral-800 text-neutral-400 group-hover:text-blue-400 rounded-lg">
                              <Facebook size={16} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1.5">
                                <h4 className="text-xs font-bold text-white truncate pr-2">
                                  {lead.authorName}
                                </h4>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-900/50 px-2 py-0.5 rounded font-black">
                                    SPRECYZOWANIE: {lead.qualificationScore || 75}%
                                  </span>
                                  <span className={`text-[9px] font-mono font-medium px-2 py-0.5 rounded border ${getIntentBadgeColor(lead.intentLevel)}`}>
                                    INTENCJA: {lead.intentLevel}
                                  </span>
                                </div>
                              </div>

                              <span className="block text-[10px] text-neutral-500 font-mono mb-2 truncate">
                                {lead.groupName}
                              </span>

                              <p className="text-xs text-neutral-300 bg-neutral-950 p-2.5 rounded border border-neutral-900 border-l border-l-blue-500 line-clamp-2 leading-relaxed">
                                {lead.painSummary}
                              </p>

                              <div className="mt-3.5 flex items-center justify-between text-[11px] text-neutral-500 font-medium">
                                <span className="p-1 px-2.5 rounded bg-neutral-950 text-neutral-400 border border-neutral-900 text-[10px]">
                                  Status: <strong className="text-blue-400">{lead.status}</strong>
                                </span>
                                <span className="font-mono text-[10px]">{new Date(lead.createdAt).toLocaleDateString('pl-PL')}</span>
                              </div>
                            </div>

                            <button
                              onClick={(e) => handleDeleteLead(lead.id, e)}
                              className="p-1 px-2 rounded hover:bg-red-500/10 hover:text-red-400 text-neutral-600 transition"
                              title="Usuń lead"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: 4. INTUITYWNY ANALIZATOR WYDŹWIĘKU AI */}
            {activeTab === 'sentiment' && (
              <div className="space-y-6">
                <div className="p-4 bg-blue-950/15 border border-blue-900/20 rounded-xl space-y-2">
                  <h4 className="text-xs font-bold font-mono uppercase text-blue-400 flex items-center gap-1.5 font-sans">
                    <Sparkles size={14} className="text-blue-400 animate-pulse" /> AI Analizator Wydźwięku i Priorytetu Komentarzy
                  </h4>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Wklej tutaj dowolny komentarz, dyskusję lub post z grupy na Facebooku. Silnik AI Gemini przeprowadzi głęboką analizę emocjonalną, skompiluje zapalniki psychologiczne i określi priorytet handlowy dla Twojej ogólnej oferty.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-mono text-neutral-400 uppercase tracking-widest mb-1.5">
                      Treść posta lub komentarza ze społeczności <span className="text-blue-500">*</span>
                    </label>
                    <textarea
                      rows={5}
                      required
                      placeholder="Napisz lub wklej tutaj np.: 'Strasznie denerwuje mnie cały ten Zapier, ciągle wyrzuca błędy, a klienci narzekają na opóźnienia. Tracę tylko nerwy i czas na bezsensowną pracę ręczną...'"
                      value={sentimentText}
                      onChange={(e) => setSentimentText(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg py-3 px-4 text-xs text-neutral-200 outline-none transition font-sans leading-relaxed whitespace-pre-wrap"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={!sentimentText.trim() || analyzingSentiment}
                      onClick={handleAnalyzeSentiment}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-6 rounded-lg text-xs tracking-wider transition uppercase flex items-center gap-2 disabled:bg-blue-800 shadow-[0_0_15px_rgba(24,119,242,0.15)]"
                    >
                      {analyzingSentiment ? (
                        <>
                          <RefreshCw size={12} className="animate-spin" />
                          Przetwarzanie profilu emocjonalnego...
                        </>
                      ) : (
                        <>
                          <Sparkles size={12} />
                          Analizuj Wydźwięk & Priorytet AI
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Sentiment Result Panel */}
                {sentimentResult && (
                  <div className="mt-8 bg-neutral-900/40 p-5 rounded-2xl border border-neutral-800 space-y-6">
                    <div className="flex items-center justify-between border-b border-neutral-850 pb-3">
                      <span className="text-xs font-mono font-bold text-neutral-300 uppercase tracking-widest flex items-center gap-1">
                        📊 Raport Wydźwięku Inteligentnego
                      </span>
                      <button
                        onClick={() => setSentimentResult(null)}
                        className="text-neutral-500 hover:text-white transition"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      
                      {/* Left Block: Sentiment Score & Priority Gauges */}
                      <div className="space-y-4">
                        
                        {/* Sentiment Score indicator */}
                        <div className="p-4 bg-neutral-950/70 border border-neutral-850 rounded-xl relative overflow-hidden font-sans">
                          <span className="block text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-1">
                            Wydźwięk Emocjonalny (Sentiment)
                          </span>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold text-white">Strumień emocji:</span>
                            <span className={`text-xs font-bold font-mono px-2.5 py-0.5 rounded ${
                              sentimentResult.sentimentScore < -20 
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                                : sentimentResult.sentimentScore > 20
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-neutral-500/10 text-neutral-400 border border-neutral-500/20'
                            }`}>
                              {sentimentResult.sentimentLabel} ({sentimentResult.sentimentScore >= 0 ? '+' : ''}{sentimentResult.sentimentScore}%)
                            </span>
                          </div>

                          {/* Zero-centered progress track */}
                          <div className="relative bg-neutral-900 h-2.5 rounded-full overflow-hidden mt-3 flex">
                            {/* Left Red segment (Negative sentiment / pain indicators) */}
                            <div className="w-1/2 flex justify-end bg-neutral-900 border-r border-neutral-850">
                              {sentimentResult.sentimentScore < 0 && (
                                <div 
                                  className="h-full bg-red-500 rounded-l" 
                                  style={{ width: `${Math.min(100, Math.abs(sentimentResult.sentimentScore))}%` }}
                                />
                              )}
                            </div>
                            {/* Right Green segment (Positive sentiment) */}
                            <div className="w-1/2 bg-neutral-900">
                              {sentimentResult.sentimentScore >= 0 && (
                                <div 
                                  className="h-full bg-emerald-500 rounded-r" 
                                  style={{ width: `${Math.min(100, sentimentResult.sentimentScore)}%` }}
                                />
                              )}
                            </div>
                          </div>
                          
                          <div className="flex justify-between text-[10px] text-neutral-600 mt-2 font-mono">
                            <span>-100% (Wysoki Ból / Frustracja)</span>
                            <span>0% (Neutral)</span>
                            <span>+100% (Szał Zakupowy)</span>
                          </div>

                          {sentimentResult.sentimentScore < 0 && (
                            <p className="text-[10px] text-amber-500 font-sans mt-3.5 italic leading-relaxed">
                              💡 Wskazówka: Wykryto ujemny wydźwięk ({sentimentResult.sentimentScore}%). To wysoki ból uniemożliwiający normalne działanie. Doskonała okazja, aby wejść z outreach i zaoferować darmową wartość niwelującą ból!
                            </p>
                          )}
                        </div>

                        {/* Priority indicator */}
                        <div className="p-4 bg-neutral-950/70 border border-neutral-850 rounded-xl font-sans">
                          <span className="block text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-1">
                            Priorytetyzacja Handlowa AI
                          </span>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-white">Priorytet kontaktu:</span>
                            <span className="text-xs font-black font-mono text-blue-400">
                              {sentimentResult.priorityLabel} ({sentimentResult.priorityScore}%)
                            </span>
                          </div>

                          <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden mb-2">
                            <div 
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${sentimentResult.priorityScore}%` }}
                            />
                          </div>

                          <div className="flex justify-between text-[9px] font-mono text-neutral-600">
                            <span>Ignoruj / Zimny</span>
                            <span>Średni priorytet</span>
                            <span>Wymaga pilnego kontaktu!</span>
                          </div>
                        </div>

                      </div>

                      {/* Right Block: Explanation & Emotional Triggers */}
                      <div className="space-y-4">
                        
                        {/* Sentiment Explanation */}
                        <div className="p-4 bg-neutral-950/40 border border-neutral-850/50 rounded-xl space-y-2">
                          <span className="block text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
                            Uzasadnienie Psychologiczne
                          </span>
                          <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                            {sentimentResult.sentimentExplanation}
                          </p>
                        </div>

                        {/* Trigger pills */}
                        <div className="p-4 bg-neutral-950/40 border border-neutral-850/50 rounded-xl space-y-2">
                          <span className="block text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
                            Zapalniki Emocjonalne (Emotional Triggers)
                          </span>
                          <div className="flex flex-wrap gap-2 pt-1">
                            {sentimentResult.emotionalTriggers.map((trig, idx) => (
                              <span 
                                key={idx} 
                                className="bg-red-950/15 text-red-400 border border-red-500/20 text-[10px] font-sans px-2.5 py-1 rounded-md font-medium"
                              >
                                🎯 {trig}
                              </span>
                            ))}
                          </div>
                        </div>

                      </div>

                    </div>

                    {/* Bottom sub-grid: Tactical advice and Outreach Reply Pitch Draft */}
                    <div className="grid grid-cols-1 gap-5 pt-3 border-t border-neutral-900">
                      
                      {/* Tactical Action list */}
                      <div className="p-4 bg-neutral-950/60 border border-neutral-850 rounded-xl space-y-2.5">
                        <span className="block text-[10px] font-mono text-neutral-400 uppercase tracking-widest">
                          🛡️ Taktyka Kontaktu i Likwidacji Bólu
                        </span>
                        <ul className="space-y-1.5">
                          {sentimentResult.tacticalActionPlan.map((step, idx) => (
                            <li key={idx} className="text-xs text-neutral-300 flex items-start gap-2 leading-relaxed">
                              <span className="text-blue-500 font-mono font-bold mt-0.5">{idx + 1}.</span>
                              <span className="font-sans">{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Reply Generator */}
                      <div className="p-4 bg-blue-950/10 border border-blue-500/20 rounded-xl space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-mono uppercase text-blue-400 font-black tracking-wider">
                            🤖 Wygenerowany Szkic Odpowiedzi (Dostrojony Emocjonalnie)
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(sentimentResult.suggestedResponseDraft);
                              setCopiedField('Sugerowana odpowiedź');
                              toast.success('Skopiowano szkic odpowiedzi do schowka!');
                              setTimeout(() => setCopiedField(null), 2000);
                            }}
                            className="bg-neutral-900 border border-neutral-850 text-neutral-400 hover:text-white px-2.5 py-1 text-[10px] rounded transition flex items-center gap-1.5 font-sans font-bold"
                          >
                            {copiedField === 'Sugerowana odpowiedź' ? <Check size={10} /> : <Copy size={10} />}
                            Kopiuj
                          </button>
                        </div>
                        <p className="text-xs text-neutral-200 leading-relaxed bg-neutral-950 border border-neutral-900 p-3.5 rounded-lg border-l border-l-blue-500 italic whitespace-pre-wrap font-sans">
                          "{sentimentResult.suggestedResponseDraft}"
                        </p>
                      </div>

                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: 5. KONTA I PROMOCJE PRO */}
            {activeTab === 'integrations' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* FB Account Status */}
                  <div className="p-5 bg-neutral-900/40 border border-neutral-800 rounded-2xl space-y-4">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Share2 className="text-blue-500" size={18} /> Profil Facebook Graph API
                    </h3>

                    <div className="flex items-center gap-3 bg-neutral-950 p-3 rounded-xl border border-neutral-850">
                      <img 
                        src={fbAccount.avatarUrl} 
                        alt="Avatar" 
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-full border border-neutral-800"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-white">{fbAccount.name}</h4>
                        <p className="text-[10px] text-neutral-500 font-mono mt-0.5">ID konta: {fbAccount.profileId}</p>
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-neutral-400">Wygaśnięcie tokenu:</span>
                        <span className="font-mono text-emerald-400">{fbAccount.tokenExpires}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-neutral-400">Status Autopilota:</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={fbAccount.autopilot}
                            onChange={(e) => setFbAccount({...fbAccount, autopilot: e.target.checked})}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-neutral-400 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 peer-checked:after:bg-white"></div>
                        </label>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-neutral-400">Automatyczny pomocnik komentarzy:</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={fbAccount.autoComment}
                            onChange={(e) => setFbAccount({...fbAccount, autoComment: e.target.checked})}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-neutral-400 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 peer-checked:after:bg-white"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Promo Coupons */}
                  <div className="p-5 bg-neutral-900/40 border border-neutral-800 rounded-2xl space-y-4">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Flame className="text-amber-500" size={17} /> Pakiety Elitarne i Promocje
                    </h3>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      Znalazłeś sekretny kod promocyjny PRO? Wpisz go poniżej, aby odblokować unikalne grupy biznesowe ze strumienia i darmowe credity Gemini Premium.
                    </p>

                    <form onSubmit={handleApplyPromo} className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="np. OJCIEC" 
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        className="flex-1 bg-neutral-950 border border-neutral-850 px-3 py-2 rounded-lg text-xs outline-none focus:border-blue-500 text-white font-mono uppercase"
                      />
                      <button 
                        type="submit"
                        className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white px-4 py-2 rounded-lg text-xs font-semibold transition"
                      >
                        Aktywuj
                      </button>
                    </form>

                    {activePromos.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <span className="text-[10px] font-mono text-neutral-500 uppercase">Aktywowane pakiety</span>
                        <div className="flex flex-wrap gap-1.5">
                          {activePromos.map((promo) => (
                            <span key={promo} className="bg-emerald-950/30 text-emerald-400 border border-emerald-900 text-[10px] font-mono px-2.5 py-1 rounded">
                              🎁 KOD PRO: {promo} (Aktywny)
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                </div>

                {/* Meta Messenger Real Integration */}
                <div className="p-5 bg-neutral-900/40 border border-neutral-800 rounded-2xl space-y-4 font-sans">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800/60 pb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        <MessageSquare className="text-blue-400" size={18} /> Reale Połączenie z Facebook Messengerem (Meta Webhook)
                      </h3>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        Podepnij swój prawdziwy Fanpage FB i pozwól sztucznej inteligencji Gemini na automatyczne odpisywanie klientom.
                      </p>
                    </div>
                    <span className="text-[10px] bg-blue-950 font-mono text-blue-400 px-2.5 py-0.5 rounded-full border border-blue-500/20 w-fit self-start sm:self-auto font-bold uppercase tracking-wider">
                      Integracja Live API
                    </span>
                  </div>

                  <div className="space-y-4">
                    {/* Technical Credentials Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Webhook URL (read only) */}
                      <div className="space-y-1.5 animate-fade-in">
                        <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold block">Adres URL Webhooka (Wklej w Meta Developer Portal)</label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            readOnly
                            value={`${window.location.origin}/api/messenger/webhook`}
                            className="flex-1 bg-neutral-950 border border-neutral-850 px-3 py-2 rounded-lg text-xs outline-none text-neutral-300 font-mono"
                          />
                          <button 
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/api/messenger/webhook`);
                              toast.success('Skopiowano URL webhooka!');
                            }}
                            className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-750 text-white px-3 py-2 rounded-lg text-xs transition flex items-center justify-center shrink-0 cursor-pointer"
                            title="Skopiuj URL"
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                        <span className="text-[9px] text-neutral-500 leading-normal block">
                          Adres URL przekierowujący zdarzenia wiadomości z Meta do Twojej instancji Zapalnika.
                        </span>
                      </div>

                      {/* Verify Token (hub.verify_token) */}
                      <div className="space-y-1.5 animate-fade-in">
                        <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold block">Meta Verify Token (Klucz weryfikacyjny)</label>
                        <input 
                          type="text" 
                          placeholder="Wpisz dowolny tajny token (np. twój-klucz-messenger)"
                          value={messengerConfig.verifyToken}
                          onChange={(e) => setMessengerConfig({ ...messengerConfig, verifyToken: e.target.value })}
                          className="w-full bg-neutral-950 border border-neutral-850 px-3 py-2 rounded-lg text-xs outline-none focus:border-blue-500 text-white font-mono"
                        />
                        <span className="text-[9px] text-neutral-500 leading-normal block">
                          Zabezpiecza Twój endpoint webhooka. Meta poprosi o ten sam klucz przy zatwierdzaniu weryfikacji.
                        </span>
                      </div>

                      {/* Page Access Token */}
                      <div className="space-y-1.5 md:col-span-2 animate-fade-in">
                        <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold block">Page Access Token (Klucz dostępu do Fanpage)</label>
                        <input 
                          type="password" 
                          placeholder="Wklej Page Access Token (EAAG...)"
                          value={messengerConfig.pageAccessToken}
                          onChange={(e) => setMessengerConfig({ ...messengerConfig, pageAccessToken: e.target.value })}
                          className="w-full bg-neutral-950 border border-neutral-850 px-3 py-2 rounded-lg text-xs outline-none focus:border-blue-500 text-white font-mono"
                        />
                        <span className="text-[9px] text-neutral-500 leading-normal block">
                          Token wygenerowany w konsoli Meta Developers, zezwalający robotom Zapalnika na pobieranie i odpisywanie na wiadomości w Twoim imieniu.
                        </span>
                      </div>

                    </div>

                    {/* Autopilot & Configuration Actions */}
                    <div className="p-4 bg-neutral-950 border border-neutral-850 rounded-xl space-y-4 animate-fade-in">
                      <div className="flex items-center justify-between gap-4">
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-white flex items-center gap-1">
                            🤖 Autopilot Odpowiedzi Gemini (Real-time)
                          </span>
                          <p className="text-[10px] text-neutral-400 leading-normal">
                            Gdy klient do Ciebie napisze na prawdziwym Messengerze, Gemini natychmiast wygeneruje magnetyczną, dopasowaną odpowiedź w 1-2 sekundy i odeśle ją do czatu.
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                          <input 
                            type="checkbox" 
                            checked={messengerConfig.autopilotEnabled}
                            onChange={(e) => setMessengerConfig({ ...messengerConfig, autopilotEnabled: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-neutral-400 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 peer-checked:after:bg-white"></div>
                        </label>
                      </div>
                    </div>

                    {/* Instructions panel */}
                    <div className="p-4 bg-neutral-950 border border-neutral-850 rounded-xl text-[11px] text-neutral-300 space-y-2 leading-relaxed animate-fade-in">
                      <span className="text-[10px] font-mono text-neutral-400 font-bold uppercase block">📋 INSTRUKCJA PODPIĘCIA MESSENGERA:</span>
                      <ol className="list-decimal list-inside space-y-1.5 pl-1 text-[11px] text-neutral-400">
                        <li>Zaloguj się na platformie <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline inline-flex items-center gap-0.5">Meta Developers <ExternalLink size={10} /></a> i utwórz aplikację biznesową.</li>
                        <li>Dodaj produkt <strong className="text-white">Messenger</strong> w panelu ustawień aplikacji.</li>
                        <li>Przejdź do zakładki <strong className="text-white">Webhooks</strong> w konfiguracji Messenger i podaj:</li>
                        <ul className="list-disc list-inside pl-4 text-neutral-400 py-0.5">
                          <li>Callback URL: <code className="text-blue-300 font-mono bg-neutral-920 px-1 py-0.5 rounded text-[10px]">{`${window.location.origin}/api/messenger/webhook`}</code></li>
                          <li>Verify Token: <code className="text-amber-300 font-mono bg-neutral-920 px-1 py-0.5 rounded text-[10px]">{messengerConfig.verifyToken || "Twój Verify Token"}</code></li>
                        </ul>
                        <li>Zaznacz i subskrybuj pola zdarzeń: <code className="text-neutral-300 font-mono">messages</code> oraz <code className="text-neutral-300 font-mono">messaging_postbacks</code>.</li>
                        <li>Podłącz swój Fanpage do aplikacji Meta, wygeneruj <strong className="text-white">Page Access Token</strong> i wklej go wyżej. Kliknij przycisk Zapisz.</li>
                      </ol>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        disabled={isSavingMessenger}
                        onClick={handleSaveMessengerConfig}
                        className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-2 uppercase tracking-wide cursor-pointer"
                      >
                        {isSavingMessenger ? (
                          <>
                            <RefreshCw size={12} className="animate-spin" /> Zapisywanie...
                          </>
                        ) : (
                          <>
                            <Check size={12} /> Zapisz Integrację Messenger
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {activeTab === 'machine' && (
              <div className="space-y-6 animate-fade-in font-sans">
                {/* Intro Hero banner */}
                <div className="p-6 bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 rounded-3xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div className="space-y-2 max-w-xl">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 text-[9px] font-mono font-bold bg-rose-950 text-rose-450 rounded-full border border-rose-500/20 uppercase tracking-wider">
                          Elite Growth Loop Engine
                        </span>
                      </div>
                      <h2 className="text-xl font-bold text-white tracking-tight">
                        Samonapędzająca się Maszyna Organiczna AI
                      </h2>
                      <p className="text-xs text-neutral-400 leading-relaxed">
                        Wygeneruj jednym kliknięciem kompletny system pozyskiwania klientów na Facebooku. Gemini zaprojektuje magnetyczne grupy niszowe, viralowy darmowy zasób, post wyzwalający dyskusję oraz pierwszą konwersację na Messengerze dostosowane bezpośrednio do Twojej oferty.
                      </p>
                    </div>
                    <button
                      onClick={handleGenerateGrowthMachine}
                      disabled={generatingMachine}
                      className="bg-gradient-to-r from-red-600 via-orange-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs px-5 py-3.5 rounded-2xl transition-all shadow-[0_0_25px_rgba(239,68,68,0.25)] flex items-center justify-center gap-2 uppercase tracking-wide cursor-pointer disabled:opacity-50 shrink-0 self-start md:self-auto"
                    >
                      {generatingMachine ? (
                        <>
                          <RefreshCw className="animate-spin text-white" size={14} /> Generowanie Maszyny...
                        </>
                      ) : (
                        <>
                          <Flame size={14} /> Uruchom Maszynę Organiczną AI
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Offer Customization Block */}
                <div className="p-5 bg-neutral-900/30 border border-neutral-800 rounded-2xl space-y-4">
                  <div>
                    <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold block mb-1.5">
                      Twoja aktualna oferta biznesowa (na jej podstawie Gemini zaprojektuje growth loop)
                    </label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={yourOffer}
                        onChange={(e) => setYourOffer(e.target.value)}
                        placeholder="np. Wdrożenia automatyzacji procesów AI i botów dla firm (budżet 5 000 - 15 000 zł)"
                        className="flex-1 bg-neutral-950 border border-neutral-850 px-3.5 py-2.5 rounded-xl text-xs outline-none focus:border-rose-500 text-white font-sans transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Loading State Animation */}
                {generatingMachine && (
                  <div className="p-12 text-center bg-black/40 border border-neutral-900 rounded-3xl space-y-4 flex flex-col items-center justify-center">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full border-2 border-neutral-800 border-t-rose-500 animate-spin" />
                      <Flame className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-rose-500 animate-pulse" size={24} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-white font-bold font-mono animate-pulse">
                        Sztuczna inteligencja Gemini wykuwa maszynę organiczną...
                      </p>
                      <p className="text-[10px] text-neutral-400">
                        Odpalamy kreatywny pipeline, analizujemy psychologię wpływu, piszemy post i scenariusz Messenger...
                      </p>
                    </div>
                  </div>
                )}

                {/* Results Workspace */}
                {!generatingMachine && growthMachine && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in text-sans">
                    
                    {/* Grid item 1: Facebook Niche Groups */}
                    <div className="p-5 bg-neutral-900/40 border border-neutral-850 rounded-2xl space-y-4 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                          <h3 className="text-xs font-mono font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                            <Compass className="text-blue-400" size={14} /> 1. Elitarne Grupy Facebookowe
                          </h3>
                          <span className="text-[9px] bg-blue-950/40 font-mono text-blue-400 px-2 py-0.5 rounded border border-blue-800/30 font-bold">KIERUNEK NICHINGU</span>
                        </div>
                        <p className="text-[11px] text-neutral-400 leading-relaxed">
                          Wysoce specyficzne nisze społeczności, które przyciągną docelowego klienta z solidnym budżetem:
                        </p>
                        
                        <div className="space-y-3 pt-2">
                          {growthMachine.nicheGroups?.map((group, idx) => (
                            <div key={idx} className="p-3 bg-neutral-950 border border-neutral-850 rounded-xl space-y-1.5 relative group">
                              <div className="flex justify-between items-start gap-2">
                                <span className="text-xs font-bold text-white leading-snug">👥 {group.name}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(group.name);
                                    toast.success(`Skopiowano nazwę grupy: ${group.name}`);
                                  }}
                                  className="text-neutral-500 hover:text-white transition p-1 rounded hover:bg-neutral-900 opacity-0 group-hover:opacity-100 cursor-pointer"
                                  title="Skopiuj nazwę grupy"
                                >
                                  <Copy size={11} />
                                </button>
                              </div>
                              <p className="text-[10px] text-neutral-400 italic leading-relaxed">
                                {group.whyItWorks}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="pt-3 text-[10px] text-neutral-550 border-t border-neutral-900 italic">
                        Zyskujesz psychologiczny pancerz autorytetu od pierwszego wejrzenia.
                      </div>
                    </div>

                    {/* Grid item 2: Free Resource (Lead Magnet) */}
                    <div className="p-5 bg-neutral-900/40 border border-neutral-850 rounded-2xl space-y-4 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                          <h3 className="text-xs font-mono font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="text-amber-400" size={14} /> 2. ZAPALNIK (Viralowy Lead Magnet)
                          </h3>
                          <span className="text-[9px] bg-amber-950/40 font-mono text-amber-450 px-2 py-0.5 rounded border border-amber-800/30 font-bold">MAGNET PRZYCIĄGANIA</span>
                        </div>
                        <p className="text-[11px] text-neutral-400 leading-relaxed">
                          Ten konkretny, darmowy schemat zelektryzuje docelowych przedsiębiorców i sprawi, że będą masowo komentować:
                        </p>

                        {growthMachine.leadMagnet && (
                          <div className="p-4 bg-neutral-950 border border-neutral-850 rounded-xl space-y-3.5 pt-3">
                            <div className="space-y-1">
                              <span className="text-[9px] font-mono text-amber-500 font-bold uppercase tracking-wider">Tytuł Zasobu</span>
                              <h4 className="text-xs font-bold text-white">{growthMachine.leadMagnet.title}</h4>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[9px] font-mono text-neutral-505 uppercase tracking-wider">Opis i Korzyści</span>
                              <p className="text-[10px] text-neutral-400 leading-normal">{growthMachine.leadMagnet.description}</p>
                            </div>
                            <div className="p-2.5 bg-amber-950/10 border border-amber-900/20 rounded-lg flex items-center justify-between">
                              <span className="text-[10px] font-mono text-amber-400 font-bold">Hasło-Klucz (Trigger):</span>
                              <span className="text-xs font-mono font-black text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-500/20 select-all uppercase">
                                {growthMachine.leadMagnet.keyword}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="pt-3 text-[10px] text-neutral-550 border-t border-neutral-900 flex justify-between items-center italic">
                        <span>Wklej hasło-klucz jako trigger w chatbocie Messenger.</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (growthMachine.leadMagnet) {
                              navigator.clipboard.writeText(growthMachine.leadMagnet.title);
                              toast.success('Skopiowano tytuł lead magnetu!');
                            }
                          }}
                          className="text-[10px] font-mono text-amber-400 hover:underline cursor-pointer"
                        >
                          Skopiuj Tytuł
                        </button>
                      </div>
                    </div>

                    {/* Grid item 3: Full Engagement Trigger Post */}
                    <div className="md:col-span-2 p-5 bg-neutral-900/40 border border-neutral-850 rounded-2xl space-y-4 font-sans">
                      <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                        <h3 className="text-xs font-mono font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Zap className="text-red-400 animate-pulse" size={14} /> 3. ELEKTRYZUJĄCY POST (Zabójca Nudy)
                        </h3>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (growthMachine.viralPost) {
                                const fullPost = `${growthMachine.viralPost.hook}\n\n${growthMachine.viralPost.bodyText}\n\n${growthMachine.viralPost.cta}`;
                                navigator.clipboard.writeText(fullPost);
                                toast.success('Skopiowano pełny post do schowka!');
                              }
                            }}
                            className="bg-neutral-800 hover:bg-neutral-700 text-white px-2.5 py-1 rounded text-[10px] font-semibold transition flex items-center gap-1 border border-neutral-750 cursor-pointer"
                          >
                            <Copy size={11} /> Kopiuj Pełny Post
                          </button>
                        </div>
                      </div>

                      <p className="text-[11px] text-neutral-400 leading-relaxed">
                        Gotowy do opublikowania w grupach branżowych. Konstrukcja z mocnym hakiem, konkretną lekcją i CTA do automatycznej konwersji:
                      </p>

                      {growthMachine.viralPost && (
                        <div className="p-4 bg-neutral-950 border border-neutral-850 rounded-xl space-y-4 text-xs font-sans">
                          {/* Hook */}
                          <div className="p-2.5 bg-red-950/10 border-l-2 border-red-500 text-neutral-200 font-bold italic leading-relaxed">
                            {growthMachine.viralPost.hook}
                          </div>
                          {/* Body Text */}
                          <div className="text-neutral-300 whitespace-pre-wrap leading-relaxed space-y-2">
                            {growthMachine.viralPost.bodyText}
                          </div>
                          {/* CTA */}
                          <div className="p-2.5 bg-blue-950/10 border border-blue-900/20 rounded-lg text-blue-300 font-semibold italic">
                            {growthMachine.viralPost.cta}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Grid item 4: Intelligent Messenger Autopilot Script */}
                    <div className="md:col-span-2 p-5 bg-gradient-to-r from-neutral-900/40 via-blue-950/10 to-neutral-900/40 border border-neutral-850 rounded-2xl space-y-4 flex flex-col justify-between font-sans">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                          <h3 className="text-xs font-mono font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                            <MessageSquare className="text-blue-400" size={14} /> 4. Ultra-krótki Scenariusz na Messengerze
                          </h3>
                          <button
                            type="button"
                            onClick={() => {
                              if (growthMachine.messengerScript) {
                                navigator.clipboard.writeText(growthMachine.messengerScript.firstMessage);
                                toast.success('Skopiowano pierwszą wiadomość!');
                              }
                            }}
                            className="bg-neutral-800 hover:bg-neutral-700 text-white px-2.5 py-1 rounded text-[10px] transition cursor-pointer"
                          >
                            <Copy size={11} /> Kopiuj Wiadomość
                          </button>
                        </div>
                        <p className="text-[11px] text-neutral-400 leading-relaxed">
                          Pierwsza automatyczna wiadomość, jaką AI wyśle do osoby komentującej post na prawdziwym Messengerze. Rozpala konwersację naturalnie i przyjacielsko:
                        </p>

                        {growthMachine.messengerScript && (
                          <div className="p-4 bg-neutral-950 border border-neutral-850 rounded-xl relative">
                            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Aktywny Autopilot" />
                            <p className="text-xs text-blue-200 italic font-mono pr-4 leading-relaxed">
                              "{growthMachine.messengerScript.firstMessage}"
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="p-3 bg-blue-950/15 border border-blue-900/20 rounded-xl text-[10px] text-blue-300 leading-normal flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                        <span>Ta linia jest zsynchronizowana z autopilotem Gemini Meta Webhook na karcie "Konta i Promocje Pro"!</span>
                      </div>
                    </div>

                  </div>
                )}

                {/* Placeholder before generation */}
                {!generatingMachine && !growthMachine && (
                  <div className="p-16 text-center border-2 border-dashed border-neutral-850 rounded-3xl space-y-4">
                    <div className="w-12 h-12 rounded-full bg-neutral-900 flex items-center justify-center mx-auto border border-neutral-800">
                      <Flame className="text-neutral-650" size={20} />
                    </div>
                    <div className="space-y-1.5 max-w-sm mx-auto">
                      <h4 className="text-sm font-semibold text-white">Maszyna jeszcze nieuruchomiona</h4>
                      <p className="text-[11px] text-neutral-400 leading-relaxed">
                        Chcesz zautomatyzować wymyślanie elitarnych grup, chwytliwych schematów, viralowych postów i naturalnych skryptów Messenger? Kliknij przycisk "Uruchom Maszynę" u góry!
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

      </div>

      {/* DETAIL SIDE DRAWER DESIGN */}
      <AnimatePresence>
        {selectedLead && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80"
              onClick={() => setSelectedLead(null)}
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-2xl bg-neutral-950 border-l border-neutral-800 h-full overflow-y-auto p-6 md:p-8 flex flex-col justify-between"
            >
              <div>
                {/* Header inside slideout */}
                <div className="flex items-center justify-between pb-6 border-b border-neutral-800 mb-6 font-sans">
                  <div className="flex items-center gap-3">
                    <span className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                      <Facebook size={20} />
                    </span>
                    <div>
                      <h4 className="text-base font-bold text-white leading-tight">
                        Okazja od: {selectedLead.authorName}
                      </h4>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        Grupa: {selectedLead.groupName}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedLead(null)}
                    className="p-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-6">
                  
                  {/* Status update box */}
                  <div className="p-3.5 bg-neutral-900 border border-neutral-800/80 rounded-xl flex items-center justify-between gap-4 font-sans">
                    <div className="text-xs font-medium text-neutral-400">
                      Zmień Status Kontaktu:
                    </div>
                    <select
                      value={selectedLead.status}
                      onChange={(e) => handleUpdateStatus(selectedLead.id, e.target.value)}
                      className="bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-200 outline-none focus:border-blue-500 font-semibold"
                    >
                      <option value="Do kontaktu">Do kontaktu</option>
                      <option value="Wysłano PM / Komentarz">Wysłano PM / Komentarz</option>
                      <option value="Odpowiedział">Odpowiedział</option>
                      <option value="Negocjacja">Negocjacja</option>
                      <option value="Zamknięty / Aktywny">Zamknięty / Aktywny</option>
                      <option value="Odrzucony">Odrzucony</option>
                    </select>
                  </div>

                  {/* Core detail grid info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 bg-neutral-900 border border-neutral-800/80 rounded-xl font-sans">
                      <span className="block text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-1">Poziom Intencji</span>
                      <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border inline-block ${getIntentBadgeColor(selectedLead.intentLevel)}`}>
                        {selectedLead.intentLevel}
                      </span>
                    </div>
                    <div className="p-3 bg-neutral-900 border border-neutral-800/80 rounded-xl font-sans">
                      <span className="block text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-1">Skala Budżetu</span>
                      <span className="text-xs text-neutral-200 font-bold block truncate">
                        {selectedLead.estimatedValueHex || 'Niedookreślona'}
                      </span>
                    </div>
                    <div className="p-3 bg-neutral-900 border border-neutral-800/80 rounded-xl font-sans flex flex-col justify-between">
                      <span className="block text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-1">Kwalifikacja Lead</span>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-neutral-950 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-emerald-500 h-full rounded-full" 
                            style={{ width: `${selectedLead.qualificationScore || 75}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono font-semibold text-emerald-400">
                          {selectedLead.qualificationScore || 75}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Original raw Facebook post */}
                  <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-2">
                    <span className="text-[10px] font-mono uppercase text-neutral-500">
                      Oryginalna Wzmianka z Facebooka
                    </span>
                    <p className="text-xs text-neutral-300 leading-relaxed font-sans italic max-h-[120px] overflow-y-auto">
                      "{selectedLead.postText}"
                    </p>
                  </div>

                  {/* Diagnosed Pain Point summary */}
                  <div className="p-4 bg-blue-950/25 border border-blue-900/30 rounded-xl space-y-1">
                    <span className="text-[10px] font-mono uppercase text-blue-400 flex items-center gap-1">
                      <Flame size={12} className="text-blue-500 animate-pulse" /> Zdefiniowany Problem (Pain Point)
                    </span>
                    <p className="text-xs text-neutral-200 font-semibold leading-relaxed">
                      {selectedLead.painSummary}
                    </p>
                  </div>

                  {/* AI Psychological Sentiment Profile */}
                  <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl space-y-3 font-sans">
                    <span className="text-[10px] font-mono uppercase text-neutral-400 flex items-center gap-1">
                      🧠 Analiza psychologiczna & wydźwięku AI
                    </span>
                    
                    {selectedLead.sentimentLabel ? (
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 bg-neutral-950 p-2.5 rounded-lg border border-neutral-850">
                          <div>
                            <span className="text-[9px] font-mono text-neutral-500 uppercase block">Stan emocjonalny</span>
                            <span className={`text-xs font-bold ${selectedLead.sentimentScore && selectedLead.sentimentScore < -20 ? 'text-red-400' : 'text-emerald-400'}`}>
                              {selectedLead.sentimentLabel} ({selectedLead.sentimentScore && selectedLead.sentimentScore >= 0 ? '+' : ''}{selectedLead.sentimentScore}%)
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] font-mono text-neutral-500 uppercase block">Priorytet sprzedażowy</span>
                            <span className="text-xs font-black text-blue-400 font-mono">
                              {selectedLead.priorityLabel || 'Brak'} ({selectedLead.priorityScore || 0}%)
                            </span>
                          </div>
                        </div>

                        {selectedLead.emotionalTriggers && selectedLead.emotionalTriggers.length > 0 && (
                          <div>
                            <span className="text-[9px] font-mono text-neutral-500 uppercase block mb-1">Główne zapalniki (Triggers)</span>
                            <div className="flex flex-wrap gap-1">
                              {selectedLead.emotionalTriggers.map((trig, index) => (
                                <span key={index} className="text-[9px] bg-red-950/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded">
                                  🎯 {trig}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {selectedLead.sentimentExplanation && (
                          <div>
                            <span className="text-[9px] font-mono text-neutral-500 uppercase block mb-0.5">Uzasadnienie psychologii</span>
                            <p className="text-[11px] text-neutral-300 leading-relaxed font-sans italic">
                              "{selectedLead.sentimentExplanation}"
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-4 text-center space-y-3 bg-neutral-950 rounded-lg border border-neutral-850">
                        <p className="text-[11px] text-neutral-500 max-w-xs leading-normal">
                          Ten lead nie posiada jeszcze zapisanego profilu emocjonalnego. Przeanalizuj go w czasie rzeczywistym, aby ułatwić domykanie sprzedaży!
                        </p>
                        <button
                          type="button"
                          disabled={analyzingLeadSentimentId === selectedLead.id}
                          onClick={() => handleAnalyzeLeadSentimentOnTheFly(selectedLead)}
                          className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-semibold text-[10px] px-3.5 py-1.5 rounded transition uppercase tracking-wider flex items-center gap-1.5"
                        >
                          {analyzingLeadSentimentId === selectedLead.id ? (
                            <>
                              <RefreshCw size={10} className="animate-spin" /> Przetwarzanie...
                            </>
                          ) : (
                            <>
                              <Sparkles size={10} /> Generuj Analizę Wydźwięku AI
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Synergistic URL Escalate Button (If Company URL is detected) */}
                  {selectedLead.detectedCompanyUrl ? (
                    <div className="p-4 bg-rose-950/15 border border-rose-900/30 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div>
                        <span className="p-1 px-1.5 rounded bg-rose-500/10 text-rose-400 text-[9px] font-mono font-semibold border border-rose-500/20 uppercase tracking-widest mb-1 inline-block">
                          Wykryto Witrynę Biznesową
                        </span>
                        <p className="text-xs font-semibold text-white truncate max-w-sm">
                          {selectedLead.detectedCompanyUrl}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedLead(null);
                          navigate(`/scraper?url=${encodeURIComponent(selectedLead.detectedCompanyUrl || '')}&name=${encodeURIComponent(selectedLead.authorName)}`);
                          toast.success('Pomyślnie przeniesiono adres URL do Skanera Głębokościowego!');
                        }}
                        className="bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs px-3 py-2 rounded-lg transition flex items-center gap-1 shadow-md whitespace-nowrap"
                      >
                        Prześlij do Skanera URL <ArrowUpRight size={14} />
                      </button>
                    </div>
                  ) : (
                    // Option to try and search or manually scan
                    <div className="p-3 bg-neutral-900/40 border border-neutral-850 rounded-xl text-center flex items-center justify-between gap-2">
                      <span className="text-[11px] text-neutral-500 italic font-mono leading-tight">
                        Wykryj stronę www tego użytkownika
                      </span>
                      <button
                        onClick={() => {
                          const query = `https://www.google.com/search?q=${encodeURIComponent(selectedLead.authorName + ' firma linkedin')}`;
                          window.open(query, '_blank');
                        }}
                        className="text-[10px] text-neutral-400 hover:text-white border border-neutral-800 bg-neutral-950 px-2.5 py-1.5 rounded transition flex items-center gap-1"
                      >
                        Szukaj w Google <Search size={10} />
                      </button>
                    </div>
                  )}

                  {/* Multi-Channel Outreach Switcher */}
                  <div className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-900/30 font-sans">
                    <div className="p-1.5 bg-neutral-900 border-b border-neutral-850 flex items-center justify-between gap-1.5 overflow-x-auto min-h-[46px] no-scrollbar">
                      <div className="flex bg-neutral-950 p-1 rounded-lg gap-1">
                        <button
                          type="button"
                          onClick={() => setDrawerOutreachTab('messenger')}
                          className={`px-3 py-1 text-[10px] font-mono uppercase font-black rounded-md transition ${drawerOutreachTab === 'messenger' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20' : 'text-neutral-400 hover:text-white'}`}
                        >
                          💬 Messenger
                        </button>
                        <button
                          type="button"
                          onClick={() => setDrawerOutreachTab('comment')}
                          className={`px-3 py-1 text-[10px] font-mono uppercase font-black rounded-md transition ${drawerOutreachTab === 'comment' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/20' : 'text-neutral-400 hover:text-white'}`}
                        >
                          📣 Komentarz
                        </button>
                        <button
                          type="button"
                          onClick={() => setDrawerOutreachTab('linkedin')}
                          className={`px-3 py-1 text-[10px] font-mono uppercase font-black rounded-md transition ${drawerOutreachTab === 'linkedin' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20' : 'text-neutral-400 hover:text-white'}`}
                        >
                          💼 LinkedIn
                        </button>
                        <button
                          type="button"
                          onClick={() => setDrawerOutreachTab('email')}
                          className={`px-3 py-1 text-[10px] font-mono uppercase font-black rounded-md transition ${drawerOutreachTab === 'email' ? 'bg-amber-600/20 text-amber-400 border border-amber-500/20' : 'text-neutral-400 hover:text-white'}`}
                        >
                          ✉️ Email
                        </button>
                        <button
                          type="button"
                          onClick={() => setDrawerOutreachTab('loom')}
                          className={`px-3 py-1 text-[10px] font-mono uppercase font-black rounded-md transition ${drawerOutreachTab === 'loom' ? 'bg-rose-600/20 text-rose-400 border border-rose-500/20' : 'text-neutral-400 hover:text-white'}`}
                        >
                          📽️ Loom
                        </button>
                      </div>
                    </div>

                    <div className="p-4 bg-neutral-950/80 min-h-[190px]">
                      {drawerOutreachTab === 'messenger' && (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-[10px] text-neutral-400">
                            <span className="font-mono text-blue-400 uppercase font-black">Wiadomość Value-First Direct PM</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(selectedLead.valueFirstMessengerPitch, 'Wiadomość Messenger')}
                              className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1 border border-neutral-800 bg-neutral-900 px-2 py-1 rounded transition"
                            >
                              {copiedField === 'Wiadomość Messenger' ? <Check size={10} /> : <Copy size={10} />} Skopiuj
                            </button>
                          </div>
                          <div className="text-xs text-neutral-300 leading-relaxed font-sans max-h-[140px] overflow-y-auto pr-1">
                            <div dangerouslySetInnerHTML={{ __html: selectedLead.valueFirstMessengerPitch }} className="prose prose-sm prose-invert" />
                          </div>
                        </div>
                      )}

                      {drawerOutreachTab === 'comment' && (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-[10px] text-neutral-400">
                            <span className="font-mono text-emerald-400 uppercase font-black">FB Kandydujący Komentarz</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(selectedLead.publicCommentStrategy || 'Komentarz', 'Komentarz')}
                              className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1 border border-neutral-800 bg-neutral-905 px-2 py-1 rounded transition"
                            >
                              {copiedField === 'Komentarz' ? <Check size={10} /> : <Copy size={10} />} Skopiuj
                            </button>
                          </div>
                          <p className="text-xs text-neutral-300 italic leading-relaxed bg-neutral-900/40 p-4 rounded-lg border border-neutral-850">
                            "{selectedLead.publicCommentStrategy || 'Hej, wysłałem wiadomość prywatną z konkretnymi poradami strategicznymi. Zerknij do skrzynki!'}"
                          </p>
                          <p className="text-[10px] text-neutral-500 leading-normal">
                            💡 Powiadomienie publiczne kieruje ruch do folderu „Message Requests” i zwielokrotnia szansę na darmowy odzew o 300%.
                          </p>
                        </div>
                      )}

                      {drawerOutreachTab === 'linkedin' && (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-[10px] text-neutral-400">
                            <span className="font-mono text-indigo-400 uppercase font-black">Zaproszenie LinkedIn (Opty)</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(selectedLead.linkedinConnectPitch || 'Cześć! Zauważyłem Twój wpis o automatyzacji. Chętnie dodam Cię do kontaktów.', 'LinkedIn Invite')}
                              className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1 border border-neutral-800 bg-neutral-900 px-2 py-1 rounded transition"
                            >
                              {copiedField === 'LinkedIn Invite' ? <Check size={10} /> : <Copy size={10} />} Skopiuj
                            </button>
                          </div>
                          <p className="text-xs text-neutral-300 leading-relaxed bg-neutral-900/40 p-3.5 rounded-lg border border-neutral-850 whitespace-pre-wrap">
                            {selectedLead.linkedinConnectPitch || `Cześć! Zauważyłem Twój wpis o automatyzacji procesów. Chętnie dodam Cię do sieci kontaktów branżowych.`}
                          </p>
                          <p className="text-[10px] text-neutral-500 leading-normal">
                            💼 Pozwala wejść tylnymi drzwiami bez rzucania się w oczy handlowca na FB.
                          </p>
                        </div>
                      )}

                      {drawerOutreachTab === 'email' && (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-[10px] text-neutral-400">
                            <span className="font-mono text-amber-500 uppercase font-black">Zimny List Email (Value outreach)</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(`Temat: ${selectedLead.coldEmailSubject || ''}\n\n${(selectedLead.coldEmailBody || '').replace(/<[^>]*>/g, '')}`, 'Zimny Mail')}
                              className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1 border border-neutral-800 bg-neutral-900 px-2 py-1 rounded transition"
                            >
                              {copiedField === 'Zimny Mail' ? <Check size={10} /> : <Copy size={10} />} Skopiuj
                            </button>
                          </div>
                          <div className="bg-neutral-900/40 p-3 rounded-lg border border-neutral-850 space-y-1.5 text-left">
                            <p className="text-[10px] text-neutral-400 font-mono">
                              Temat: <strong className="text-neutral-200">{selectedLead.coldEmailSubject || 'Szybkie pytanie nt. procesów'}</strong>
                            </p>
                            <div className="border-t border-neutral-850/60 pt-1.5 text-xs text-neutral-350 leading-relaxed max-h-[90px] overflow-y-auto font-sans">
                              <div dangerouslySetInnerHTML={{ __html: selectedLead.coldEmailBody || '<p>Dzień dobry...</p>' }} className="prose prose-sm prose-invert" />
                            </div>
                          </div>
                        </div>
                      )}

                      {drawerOutreachTab === 'loom' && (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-[10px] text-neutral-400">
                            <span className="font-mono text-rose-400 uppercase font-black">2-Minutowy Scenariusz Loom Pitch</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(selectedLead.videoPitchScript || '', 'Scenariusz Loom')}
                              className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1 border border-neutral-800 bg-neutral-900 px-2 py-1 rounded transition"
                            >
                              {copiedField === 'Scenariusz Loom' ? <Check size={10} /> : <Copy size={10} />} Skopiuj
                            </button>
                          </div>
                          <div className="p-3 bg-neutral-900/40 rounded-lg border border-neutral-850 text-xs text-neutral-300 leading-relaxed max-h-[110px] overflow-y-auto whitespace-pre-wrap font-sans">
                            {selectedLead.videoPitchScript || "Brak scenariusza."}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Direct Action Link shortcuts */}
                  <div className="grid grid-cols-2 gap-3 pt-2 font-sans">
                    <button
                      type="button"
                      onClick={() => {
                        const directUrl = `https://www.facebook.com/search/posts/?q=${encodeURIComponent(selectedLead.authorName)}`;
                        window.open(directUrl, '_blank');
                      }}
                      className="bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-300 font-semibold py-2 px-3 rounded-lg text-xs transition flex items-center justify-center gap-1.5"
                    >
                      Znajdź post na FB <ExternalLink size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        copyToClipboard((selectedLead.valueFirstMessengerPitch || '').replace(/<[^>]*>/g, ''), 'Wiadomość text');
                        const pmUrl = `https://www.facebook.com/messages/t/`;
                        window.open(pmUrl, '_blank');
                      }}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-3 rounded-lg text-xs transition flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(24,119,242,0.15)]"
                    >
                      Otwórz Messenger <Facebook size={12} />
                    </button>
                  </div>

                </div>
              </div>

              <div className="mt-8 border-t border-neutral-850 pt-4 flex items-center justify-end font-sans">
                <button
                  onClick={() => setSelectedLead(null)}
                  className="bg-neutral-900 text-neutral-300 hover:text-white px-5 py-2.5 rounded-lg border border-neutral-850 text-xs font-semibold transition uppercase"
                >
                  Zamknij Detektor
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
