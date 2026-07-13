import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { auth } from '../lib/firebase';
import { Share2, Search, Sparkles, MessageSquare, FileText, Zap, Activity, RefreshCw, Flame } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

// Import refactored items
import type { FBPost, FBLead, FBAccount, MessengerConfig, MachineData, SentimentResult } from '../components/facebook/types';
import { KeywordMonitor } from '../components/facebook/KeywordMonitor';
import { OfferProfile } from '../components/facebook/OfferProfile';
import { VirtualFeedTab } from '../components/facebook/VirtualFeedTab';
import { ManualScannerTab } from '../components/facebook/ManualScannerTab';
import { LeadsDatabaseTab } from '../components/facebook/LeadsDatabaseTab';
import { SentimentAnalysisTab } from '../components/facebook/SentimentAnalysisTab';
import { IntegrationsTab } from '../components/facebook/IntegrationsTab';
import { GrowthMachineTab } from '../components/facebook/GrowthMachineTab';
import { LeadDetailsDrawer } from '../components/facebook/LeadDetailsDrawer';
import { FacebookLeadsHeader } from '../components/facebook/FacebookLeadsHeader';
import { FacebookLeadsTabs } from '../components/facebook/FacebookLeadsTabs';
import { FacebookLeadsToolbar } from '../components/facebook/FacebookLeadsToolbar';

const FacebookIcon = Share2;

export function FacebookLeads() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'feed' | 'paste' | 'leads' | 'integrations' | 'sentiment' | 'machine'>('feed');
  const [simulatedPosts, setSimulatedPosts] = useState<FBPost[]>([]);
  const [savedLeads, setSavedLeads] = useState<FBLead[]>([]);
  const [generatingAiPost, setGeneratingAiPost] = useState(false);

  // Autopilot status & Scanned Groups
  const [fbAccount, setFbAccount] = useState<FBAccount>({
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

  const [messengerConfig, setMessengerConfig] = useState<MessengerConfig>({
    pageAccessToken: '',
    verifyToken: 'zapalnik_token_vip_2026',
    autopilotEnabled: false
  });
  const [isSavingMessenger, setIsSavingMessenger] = useState(false);

  // Growth Machine Loop state
  const [growthMachine, setGrowthMachine] = useState<MachineData | null>(null);
  const [generatingMachine, setGeneratingMachine] = useState(false);

  // Settings & keywords
  const [keywords, setKeywords] = useState<string[]>(['automatyzacja', 'szukam', 'zlece', 'CRM', 'programista', 'stronę']);
  
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [intentFilter, setIntentFilter] = useState('All');

  // Loading and Detail UI state
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [selectedLead, setSelectedLead] = useState<FBLead | null>(null);
  const [refreshingFeed, setRefreshingFeed] = useState(false);

  // Offer detail state
  const [yourOffer, setYourOffer] = useState(
    'Profesjonalne systemy automatyzacji biznesu AI, integracje platform CRM (Pipedrive, HubSpot) z komunikatorami, automatyczny mailing Value-First oraz budowa dedykowanych asystentów AI do natychmiastowego zamykania klientów.'
  );
  const [customInstructions, setCustomInstructions] = useState('');

  // Standalone Real-time Sentiment analysis
  const [analyzingSentiment, setAnalyzingSentiment] = useState(false);
  const [sentimentResult, setSentimentResult] = useState<SentimentResult | null>(null);
  const [analyzingLeadSentimentId, setAnalyzingLeadSentimentId] = useState<string | null>(null);

  const loadingSteps = useMemo(() => [
    'Tunelowanie bezpiecznego połączenia przez API Facebook Graph Emulator...',
    'Odpytywanie wirtualnego scrapera grup biznesowych pod kątem słów kluczowych...',
    'Przeprowadzanie analizy semantycznej i wykrywanie intencji zakupowej...',
    'Uruchamianie silnika Gemini 3.5-flash w celu zmapowania słabych punktów autora...',
    'Generowanie wysoce angażującej i luźnej wiadomości Value-First na Messenger...',
    'Zapisywanie nowego profilu leada w chmurze Firebase...'
  ], []);

  // AbortController Tracker for memory leaks on unmount
  const controllersRef = useRef<Set<AbortController>>(new Set());

  const createSignal = useCallback(() => {
    const controller = new AbortController();
    controllersRef.current.add(controller);
    return {
      signal: controller.signal,
      cleanup: () => {
        controllersRef.current.delete(controller);
      }
    };
  }, []);

  // Cleanup abort controllers on unmount
  useEffect(() => {
    return () => {
      controllersRef.current.forEach(c => c.abort());
      controllersRef.current.clear();
    };
  }, []);

  // API Call: Fetch Messenger Configuration
  const fetchMessengerConfig = useCallback(async () => {
    const { signal, cleanup } = createSignal();
    try {
      const res = await fetch('/api/messenger/config', { signal });
      if (res.ok) {
        const data = await res.json();
        setMessengerConfig({
          pageAccessToken: data.pageAccessToken || '',
          verifyToken: data.verifyToken || 'zapalnik_token_vip_2026',
          autopilotEnabled: !!data.autopilotEnabled
        });
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Error fetching messenger config:', err);
      }
    } finally {
      cleanup();
    }
  }, [createSignal]);

  // API Call: Save Webhook config
  const handleSaveMessengerConfig = useCallback(async () => {
    setIsSavingMessenger(true);
    const { signal, cleanup } = createSignal();
    try {
      const res = await fetch('/api/messenger/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messengerConfig),
        signal
      });
      if (!res.ok) throw new Error();
      toast.success('Pomyślnie zapisano konfigurację webhooka Messenger!');
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        toast.error('Błąd zapisu parametrów integracji Messenger.');
      }
    } finally {
      setIsSavingMessenger(false);
      cleanup();
    }
  }, [messengerConfig, createSignal]);

  // API Call: Generate Organic Growth Machine
  const handleGenerateGrowthMachine = useCallback(async () => {
    setGeneratingMachine(true);
    const { signal, cleanup } = createSignal();
    try {
      const res = await fetch('/api/facebook/growth-machine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerDescription: yourOffer }),
        signal
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setGrowthMachine(data);
      toast.success('Maszyna Organiczna została pomyślnie wygenerowana przez Gemini!');
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        toast.error('Błąd generowania maszyny organicznej przez Gemini.');
      }
    } finally {
      setGeneratingMachine(false);
      cleanup();
    }
  }, [yourOffer, createSignal]);

  // Handler: Promo Codes activation
  const handleApplyPromo = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const code = promoCode.trim().toUpperCase();
    if (code === 'OJCIEC' || code === 'SMOKE') {
      if (activePromos.includes('OJCIEC')) {
        toast.error('Kod "OJCIEC" został już aktywowany!');
        return;
      }
      setActivePromos(prev => [...prev, 'OJCIEC']);
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
  }, [activePromos, promoCode]);

  // API Call: Generate AI post
  const handleGenerateAiPost = useCallback(async () => {
    setGeneratingAiPost(true);
    const { signal, cleanup } = createSignal();
    try {
      const res = await fetch('/api/facebook-leads/generate-simulated-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords }),
        signal
      });
      if (!res.ok) throw new Error('Błąd generowania posta AI.');
      const newPost = await res.json();
      
      setSimulatedPosts(prev => [newPost, ...prev]);
      toast.success(`Wykryto nowy, symulowany post o wysokiej intencji! Autor: ${newPost.authorName}`);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error(err);
        toast.error('Nie udało się wygenerować postu AI.');
      }
    } finally {
      setGeneratingAiPost(false);
      cleanup();
    }
  }, [keywords, createSignal]);

  // API Call: Real-time Sentiment Analysis
  const handleAnalyzeSentiment = useCallback(async (text: string) => {
    setAnalyzingSentiment(true);
    const { signal, cleanup } = createSignal();
    try {
      const res = await fetch('/api/facebook-leads/sentiment-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
        signal
      });
      if (!res.ok) throw new Error('Błąd analizy wydźwięku przez AI.');
      const data = await res.json();
      setSentimentResult(data);
      toast.success('Analiza psychologiczna & Priorytet ustalony!');
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error(err);
        toast.error('Nie udało się przeanalizować wydźwięku.');
      }
    } finally {
      setAnalyzingSentiment(false);
      cleanup();
    }
  }, [createSignal]);

  // API Call: Simulate Feed Scrape
  const fetchSimulatedFeed = useCallback(async () => {
    setRefreshingFeed(true);
    const { signal, cleanup } = createSignal();
    try {
      const res = await fetch('/api/facebook-leads/simulate-feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal
      });
      if (!res.ok) throw new Error('Błąd pobierania symulowanego feedu.');
      const data = await res.json();
      setSimulatedPosts(data);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error(err);
        toast.error('Nie udało się załadować wirtualnego monitora grup.');
      }
    } finally {
      setRefreshingFeed(false);
      cleanup();
    }
  }, [createSignal]);

  // API Call: Fetch Saved Leads from Firebase
  const fetchSavedLeads = useCallback(async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    const { signal, cleanup } = createSignal();
    try {
      const res = await fetch(`/api/facebook-leads?userId=${userId}`, { signal });
      if (!res.ok) throw new Error('Błąd pobierania zapisanych leadów.');
      const data = await res.json();
      setSavedLeads(data);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error(err);
        toast.error('Błąd podczas ładowania bazy wyciągniętych leadów.');
      }
    } finally {
      cleanup();
    }
  }, [createSignal]);

  // Handlers for Keywords monitor
  const handleAddKeyword = useCallback((kw: string) => {
    const cleanKw = kw.trim().toLowerCase();
    if (keywords.includes(cleanKw)) {
      toast.error('To słowo kluczowe jest już monitorowane!');
      return;
    }
    setKeywords(prev => [...prev, cleanKw]);
    toast.success(`Dodano słowo kluczowe: "${cleanKw}"`);
  }, [keywords]);

  const handleRemoveKeyword = useCallback((kw: string) => {
    setKeywords(prev => prev.filter((k) => k !== kw));
    toast.success(`Usunięto monitorowanie słowa: "${kw}"`);
  }, []);

  // API Call: Run Full AI Extraction on Facebook Post
  const handleAnalyzePost = useCallback(async (postContent: string, author?: string, group?: string) => {
    setLoadingStep(0);
    setLoading(true);
    const { signal, cleanup } = createSignal();
    try {
      const userId = auth.currentUser?.uid;
      const response = await fetch('/api/facebook-leads/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postText: postContent,
          authorName: author || '',
          groupName: group || '',
          yourOffer,
          customInstructions,
          userId,
        }),
        signal
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Błąd analizy posta.');
      }

      toast.success(`Wykryto i wygenerowano lead dla użytkownika: ${resData.lead.authorName}!`);
      await fetchSavedLeads();
      setSelectedLead(resData.lead);
      setActiveTab('leads');
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error(err);
        const errMsg = err instanceof Error ? err.message : 'Wystąpił nieoczekiwany błąd serwera.';
        toast.error(errMsg);
      }
    } finally {
      setLoading(false);
      cleanup();
    }
  }, [yourOffer, customInstructions, fetchSavedLeads, createSignal]);

  // API Call: Delete Lead from database
  const handleDeleteLead = useCallback(async (leadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Czy na pewno chcesz usunąć ten wyekstrahowany lead z bazy?')) return;

    const { signal, cleanup } = createSignal();
    try {
      const response = await fetch('/api/facebook-leads/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId }),
        signal
      });

      if (!response.ok) throw new Error('Błąd usuwania.');

      toast.success('Lead został trwale usunięty.');
      setSavedLeads((prev) => prev.filter((l) => l.id !== leadId));
      if (selectedLead?.id === leadId) {
        setSelectedLead(null);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error(err);
        toast.error('Nie udało się usunąć leada.');
      }
    } finally {
      cleanup();
    }
  }, [selectedLead, createSignal]);

  // API Call: Update Lead Contact status
  const handleUpdateStatus = useCallback(async (leadId: string, newStatus: string) => {
    // Optimistic update
    setSavedLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
    if (selectedLead?.id === leadId) {
      setSelectedLead(prev => prev ? { ...prev, status: newStatus } : null);
    }
    
    const { signal, cleanup } = createSignal();
    try {
      const response = await fetch('/api/facebook-leads/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, status: newStatus }),
        signal
      });
      if (!response.ok) throw new Error('Nie udało się zapisać statusu na serwerze.');

      toast.success(`Zaktualizowano status leada na: ${newStatus}`);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error(err);
        toast.error('Błąd aktualizacji statusu na serwerze.');
      }
    } finally {
      cleanup();
    }
  }, [selectedLead, createSignal]);

  // API Call: Analyze Lead sentiment details on-the-fly inside the drawer
  const handleAnalyzeLeadSentimentOnTheFly = useCallback(async (lead: FBLead) => {
    setAnalyzingLeadSentimentId(lead.id);
    const { signal, cleanup } = createSignal();
    try {
      const res = await fetch('/api/facebook-leads/sentiment-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: lead.postText }),
        signal
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

      setSelectedLead(updatedLead);
      setSavedLeads(prev => prev.map(l => l.id === lead.id ? updatedLead : l));
      toast.success('Pomyślnie zanalizowano psychologiczny wydźwięk okazji!');
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        toast.error('Błąd podczas próby analizy wydźwięku przez AI.');
      }
    } finally {
      setAnalyzingLeadSentimentId(null);
      cleanup();
    }
  }, [createSignal]);

  const copyToClipboard = useCallback((text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Skopiowano ${fieldName}!`);
  }, []);

  const handleNavigateToScraper = useCallback((url: string, name: string) => {
    setSelectedLead(null);
    navigate(`/scraper?url=${encodeURIComponent(url)}&name=${encodeURIComponent(name)}`);
    toast.success('Pomyślnie przeniesiono adres URL do Skanera Głębokościowego!');
  }, [navigate]);

  const handleCloseDrawer = useCallback(() => {
    setSelectedLead(null);
  }, []);

  // Initialize
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
  }, [fetchSimulatedFeed, fetchSavedLeads, fetchMessengerConfig]);

  // Loading Steps timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [loading, loadingSteps.length]);

  // Memoized: Filter simulated feed posts based on keywords + search query
  const filteredSimulatedPosts = useMemo(() => {
    return simulatedPosts.filter((post) => {
      const text = post.postText.toLowerCase();
      const group = post.groupName.toLowerCase();
      const author = post.authorName.toLowerCase();
      
      const matchesKeyword = keywords.length === 0 || keywords.some(kw => text.includes(kw.toLowerCase()));
      const matchesQuery = searchQuery === '' || 
        text.includes(searchQuery.toLowerCase()) || 
        group.includes(searchQuery.toLowerCase()) || 
        author.includes(searchQuery.toLowerCase());

      return matchesKeyword && matchesQuery;
    });
  }, [simulatedPosts, keywords, searchQuery]);

  // Memoized: Inject simulated fast-lane lead from cache
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
    } as FBLead;
    return [simulatedZrzutLead, ...savedLeads];
  }, [savedLeads]);

  // Memoized: Filtered saved leads
  const filteredSavedLeads = useMemo(() => {
    return computedSavedLeadsWithFastLane.filter((lead) => {
      const query = searchQuery.toLowerCase();
      const matchesQuery = 
        lead.authorName.toLowerCase().includes(query) ||
        lead.groupName.toLowerCase().includes(query) ||
        lead.painSummary.toLowerCase().includes(query) ||
        lead.postText.toLowerCase().includes(query);

      if (intentFilter === 'All') return matchesQuery;
      return matchesQuery && lead.intentLevel.toLowerCase() === intentFilter.toLowerCase();
    });
  }, [computedSavedLeadsWithFastLane, searchQuery, intentFilter]);

  const getIntentBadgeColor = useCallback((intent: string) => {
    switch (intent) {
      case 'Gorący':
        return 'bg-red-500/15 text-red-400 border-red-500/30';
      case 'Ciepły':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'Zimny':
      default:
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    }
  }, []);

  const tabsConfig = useMemo(() => [
    { id: 'feed', label: 'Wirtualny Monitor Grup', icon: <Activity size={14} /> },
    { id: 'paste', label: 'Ręczny Skaner / Paste', icon: <Zap size={14} /> },
    { id: 'leads', label: `Baza Leadów (${filteredSavedLeads.length})`, icon: <FileText size={14} /> },
    { id: 'sentiment', label: '🧠 Analiza Wydźwięku', icon: <Sparkles size={14} /> },
    { id: 'integrations', label: '🔗 Konta & Promocje PRO', icon: <FacebookIcon size={14} /> },
    { id: 'machine', label: '🚀 Maszyna Growth Loop', icon: <Flame size={14} className="text-red-500 animate-pulse" /> },
  ], [filteredSavedLeads.length]);

  return (
    <div className="space-y-8" id="facebook-leads-root">
      
      <FacebookLeadsHeader
        badge={<><FacebookIcon size={12} /> FACEBOOK PRO MONITOR</>}
        title="Detektor Leadów z Grup FB"
        description="Wychwytuj zlecenia i okazje biznesowe bezpośrednio z polskich grup na Facebooku. Wklej surowy post lub przeglądaj inteligentne monity, a sztuczna inteligencja wygeneruje dopasowany, bezpośredni Messenger Outreach oparty na wartości."
        icon={MessageSquare}
      />

      {/* Loading overlay for Deep AI Extraction */}
      {loading && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in">
          <div className="w-24 h-24 rounded-full border-t-4 border-blue-600 animate-spin flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(24,119,242,0.4)]">
            <FacebookIcon className="text-blue-400 animate-pulse" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-wide font-sans mb-3 text-center">
            PROWADZENIE GŁĘBOKIEJ ANALIZY SOCIAL RESEARCH...
          </h2>
          <p className="text-blue-400 font-mono text-sm max-w-xl animate-pulse">
            {loadingSteps[loadingStep]}
          </p>
          <div className="mt-8 text-xs text-neutral-505 max-w-md">
            Wychwytujemy kontekst grupy, oceniamy intencje zakupowe, kalkulujemy uśredniony budżet i formułujemy ultra-płynny Messenger Pitch.
          </div>
        </div>
      )}

      {/* Grid Layout: Controls / Keywords on Left, Content on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Keyword settings & offer syncing */}
        <div className="lg:col-span-4 space-y-6">
          <KeywordMonitor 
            keywords={keywords}
            onAddKeyword={handleAddKeyword}
            onRemoveKeyword={handleRemoveKeyword}
          />
          <OfferProfile 
            yourOffer={yourOffer}
            setYourOffer={setYourOffer}
            customInstructions={customInstructions}
            setCustomInstructions={setCustomInstructions}
          />
        </div>

        {/* Right Column: Tabbed Workspace */}
        <div className="lg:col-span-8 space-y-6">
          
          {unlockedSecretGroups && (
            <div className="p-3.5 bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs animate-pulse text-amber-300 font-sans font-bold">
              <span>🎁 BONUS OD OJCA ODBLOKOWANY: Dodano prestiżowe, wysoce lukratywne grupy VIP do monitoringu!</span>
              <span className="text-[10px] bg-amber-950 font-mono text-amber-500 px-2 py-0.5 rounded border border-amber-500/20 shrink-0 font-bold">OJCIEC VIP</span>
            </div>
          )}
          
          <FacebookLeadsTabs
            tabs={tabsConfig}
            activeTab={activeTab}
            onTabChange={(tabId) => {
              setActiveTab(tabId as any);
              if (tabId !== 'leads') {
                setSelectedLead(null);
               }
            }}
          />

          <div className="bg-neutral-955 border border-neutral-800 rounded-2xl p-6">
            
            <FacebookLeadsToolbar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              activeTab={activeTab}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              intentFilter={intentFilter}
              onIntentFilterChange={setIntentFilter}
              refreshingFeed={refreshingFeed}
              onRefreshFeed={fetchSimulatedFeed}
            />

            {/* TAB CONTENT */}
            {activeTab === 'feed' && (
              <VirtualFeedTab 
                keywords={keywords}
                generatingAiPost={generatingAiPost}
                filteredSimulatedPosts={filteredSimulatedPosts}
                onGenerateAiPost={handleGenerateAiPost}
                onAnalyzePost={handleAnalyzePost}
              />
            )}

            {activeTab === 'paste' && (
              <ManualScannerTab 
                loading={loading}
                onAnalyzePost={handleAnalyzePost}
              />
            )}

            {activeTab === 'leads' && (
              <LeadsDatabaseTab 
                savedLeads={savedLeads}
                filteredSavedLeads={filteredSavedLeads}
                selectedLead={selectedLead}
                setSelectedLead={setSelectedLead}
                viewMode={viewMode}
                onUpdateStatus={handleUpdateStatus}
                onDeleteLead={handleDeleteLead}
                onCopyText={copyToClipboard}
                getIntentBadgeColor={getIntentBadgeColor}
              />
            )}

            {activeTab === 'sentiment' && (
              <SentimentAnalysisTab 
                analyzingSentiment={analyzingSentiment}
                sentimentResult={sentimentResult}
                setSentimentResult={setSentimentResult}
                onAnalyzeSentiment={handleAnalyzeSentiment}
              />
            )}

            {activeTab === 'integrations' && (
              <IntegrationsTab 
                fbAccount={fbAccount}
                setFbAccount={setFbAccount}
                promoCode={promoCode}
                setPromoCode={setPromoCode}
                activePromos={activePromos}
                onApplyPromo={handleApplyPromo}
                messengerConfig={messengerConfig}
                setMessengerConfig={setMessengerConfig}
                isSavingMessenger={isSavingMessenger}
                onSaveMessengerConfig={handleSaveMessengerConfig}
                onCopyText={copyToClipboard}
              />
            )}

            {activeTab === 'machine' && (
              <GrowthMachineTab 
                generatingMachine={generatingMachine}
                growthMachine={growthMachine}
                yourOffer={yourOffer}
                setYourOffer={setYourOffer}
                onGenerateGrowthMachine={handleGenerateGrowthMachine}
                onCopyText={copyToClipboard}
              />
            )}

          </div>
        </div>

      </div>

      {/* DETAIL SIDE DRAWER DESIGN */}
      <AnimatePresence>
        {selectedLead && (
          <LeadDetailsDrawer 
            selectedLead={selectedLead}
            onClose={handleCloseDrawer}
            onUpdateStatus={handleUpdateStatus}
            analyzingLeadSentimentId={analyzingLeadSentimentId}
            onAnalyzeLeadSentimentOnTheFly={handleAnalyzeLeadSentimentOnTheFly}
            onCopyText={copyToClipboard}
            onNavigateToScraper={handleNavigateToScraper}
            getIntentBadgeColor={getIntentBadgeColor}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
