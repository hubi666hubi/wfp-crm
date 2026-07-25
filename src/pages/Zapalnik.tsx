import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { doc, setDoc } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { Flame, Mail, Users, Sliders, Magnet, Crosshair } from 'lucide-react';
import { GmailIntegration } from './GmailIntegration';
import { AnimatePresence } from 'motion/react';
import { getAccessToken } from '../lib/auth';
import { CrmMeetingSummarizer } from './CrmMeetingSummarizer';
import { toast } from 'sonner';
import { useSystemLogsStore } from '../store/systemLogsStore';
import { useSettingsStore } from '../store/settingsStore';
import { financeService } from '../services/FinanceService';

// Import extracted subcomponents
import { PipelineKanban } from '../components/zapalnik/PipelineKanban';
import { LeadMagnetCreator } from '../components/zapalnik/LeadMagnetCreator';
import { LeadDetailsDrawer } from '../components/zapalnik/LeadDetailsDrawer';
import { AddLeadModal } from '../components/zapalnik/AddLeadModal';
import { PitchCardModal } from '../components/zapalnik/PitchCardModal';
import { TacticalBriefModal } from '../components/zapalnik/TacticalBriefModal';

// Re-export types so that other pages importing them from this path do not break
import { PIPELINE_COLUMNS } from '../components/zapalnik/types';
import type { 
  AIEnrichment, DMStep, ChatMessage, PitchCardData, TacticalBriefData, InboundLead 
} from '../components/zapalnik/types';

export type { AIEnrichment, DMStep, ChatMessage, PitchCardData, TacticalBriefData, InboundLead };

export function Zapalnik() {
  const logAction = useSystemLogsStore((state) => state.logAction);
  const makeWebhook = useSettingsStore((state) => state.makeWebhook);
  
  // Page tabs state
  const [activeTab, setActiveTab] = useState<'pipeline' | 'magnet' | 'inbox' | 'clients'>('pipeline');
  
  // Leads states
  const [leads, setLeads] = useState<InboundLead[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isEnriching, setIsEnriching] = useState(false);
  
  // Manual Lead Form Modal states
  const [showAddLead, setShowAddLead] = useState(false);
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadBio, setNewLeadBio] = useState('');
  const [newLeadSource, setNewLeadSource] = useState('LinkedIn');
  const [isCreatingLead, setIsCreatingLead] = useState(false);

  // PRO Feature SDR Sandbox / Sequence states
  const [drawerTab, setDrawerTab] = useState<'profil' | 'sekwencja' | 'symulator'>('profil');
  const [isGeneratingSequence, setIsGeneratingSequence] = useState(false);
  const [isGeneratingPitchCard, setIsGeneratingPitchCard] = useState(false);
  const [showPitchCardModal, setShowPitchCardModal] = useState(false);
  const [isGeneratingTacticalBrief, setIsGeneratingTacticalBrief] = useState(false);
  const [showTacticalBriefModal, setShowTacticalBriefModal] = useState(false);
  const [militaryModeEnabled, setMilitaryModeEnabled] = useState(true); // default to true
  const [localChat, setLocalChat] = useState<ChatMessage[]>([]);
  const [chatMessageText, setChatMessageText] = useState("");
  const [isSendingChat, setIsSendingChat] = useState(false);

  // Memory optimization: mounted status and abort controllers references
  const isMountedRef = useRef(true);
  const abortControllersRef = useRef<{ [key: string]: AbortController }>({});
  const leadsRef = useRef(leads);

  useEffect(() => {
    leadsRef.current = leads;
  }, [leads]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // Abort all active fetch actions on unmount
      Object.values(abortControllersRef.current).forEach(c => c.abort());
    };
  }, []);

  // Fetch and Sync leads from backend memory to Firestore with AbortController and cleanup
  useEffect(() => {
    let activeController: AbortController | null = null;
    let interval: NodeJS.Timeout;

    const fetchLeadsData = async () => {
      if (activeController) {
        activeController.abort();
      }
      const controller = new AbortController();
      activeController = controller;

      try {
        const response = await fetch('/api/inbound-leads', { signal: controller.signal });
        const data = await response.json();
        const sorted = data.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        if (isMountedRef.current) {
          const isDifferent = JSON.stringify(leadsRef.current) !== JSON.stringify(sorted);
          if (isDifferent) {
            setLeads(sorted);
            
            // Sync to cloud for cross-module Realtime Monitor
            if (auth.currentUser) {
              sorted.forEach((ld: InboundLead) => {
                setDoc(doc(db, "crm_leads", ld.id), ld).catch(() => {});
              });
            }
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error("Błąd podczas pobierania leadów", err);
        }
      } finally {
        if (activeController === controller) {
          activeController = null;
        }
      }
    };

    fetchLeadsData();
    interval = setInterval(fetchLeadsData, 5000);

    return () => {
      clearInterval(interval);
      if (activeController) {
        activeController.abort();
      }
    };
  }, []);

  // useMemo for derived leads list including simulated local storage leads
  const computedLeadsWithFastLane = useMemo(() => {
    const hasZrzut = leads.some(l => l.source === 'Kolejka ZRZUT' || l.source?.includes('ZRZUT') || l.name?.includes('ZRZUT'));
    if (hasZrzut) return leads;

    const zrzutTopic = localStorage.getItem("omega_zrzut_vsl_topic");
    const zrzutMsg = localStorage.getItem("omega_zrzut_zapalnik_message");
    
    if (zrzutTopic) {
      const simulatedZrzutLead = {
        id: "simulated-zrzut-crm-lead",
        name: "Adam Kowalski // Kolejka ZRZUT 🔴",
        bio: `System zidentyfikował reakcję na gorący trend "${zrzutTopic}". Profil rynkowy: Dyrektor Operacyjny. Potrzebuje automatyzacji dystrybucji treści.`,
        source: 'Kolejka ZRZUT',
        timestamp: new Date().toISOString(),
        isHighTicket: true,
        score: 99,
        draftMessage: zrzutMsg || "Gotowy do szybkiego wysłania...",
        status: "Do kontaktu",
        chatHistory: [
          { sender: 'lead', text: `Cześć, widziałem Waszą analizę trendu "${zrzutTopic}". Chciałbym wdrożyć u siebie podobne pętle automatyczne. Prześlesz mi ofertę oraz szablon VSL?`, timestamp: "Przed chwilą" }
        ],
        aiEnrichment: {
          icebreakers: [
            `Gratulacje udanego treningu na siłowni! Dopinamy brzuch i domykamy lejek.`,
            `Zauważyłem, że reagujesz błyskawicznie na najnowszy trend ${zrzutTopic}.`
          ],
          budgetPotential: "Wysoki ($10,000+)",
          objections: [
            { objection: "Brak czasu na wdrożenie", riposte: "Automatyzacja Omega PRO konfiguruje się w niecałe 4 minuty, przejmując całą dystrybucję wideo." }
          ]
        }
      } as unknown as InboundLead;
      return [simulatedZrzutLead, ...leads];
    }
    return leads;
  }, [leads]);

  // useMemo for deriving the selected lead
  const selectedLead = useMemo(() => {
    return selectedLeadId ? computedLeadsWithFastLane.find(l => l.id === selectedLeadId) || null : null;
  }, [selectedLeadId, computedLeadsWithFastLane]);

  // Sync Drawer tab ONLY upon selectedLeadId change (selection of a different lead)
  useEffect(() => {
    setDrawerTab('profil');
  }, [selectedLeadId]);

  // Sync initial chat history when selecting a lead
  useEffect(() => {
    if (selectedLead) {
      setLocalChat(selectedLead.chatHistory || []);
    } else {
      setLocalChat([]);
    }
  }, [selectedLeadId]);

  // Keep localChat in sync when poll results change
  useEffect(() => {
    if (selectedLead && selectedLead.chatHistory && selectedLead.chatHistory.length !== localChat.length) {
      setLocalChat(selectedLead.chatHistory);
    }
  }, [selectedLead?.chatHistory, localChat.length]);

  // G-Suite sendEmail helper with AbortController
  const sendEmail = useCallback(async (to: string, subject: string, body: string) => {
    const token = getAccessToken();
    if (!token) throw new Error('Brak tokenu dostępu G-Suite / Gmail. Zaloguj się w zakładce Integracja Gmail.');

    const encoder = new TextEncoder();
    const encodedSubject = `=?utf-8?B?${btoa(String.fromCharCode(...encoder.encode(subject)))}?=`;

    const emailLines = [
      `To: ${to}`,
      'Content-type: text/html;charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${encodedSubject}`,
      '',
      body
    ];
    
    const rawEmail = emailLines.join('\r\n');
    const base64EncodedEmail = btoa(String.fromCharCode(...encoder.encode(rawEmail)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    const controller = new AbortController();
    const actionKey = `sendEmail-${to}-${Date.now()}`;
    abortControllersRef.current[actionKey] = controller;

    try {
      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ raw: base64EncodedEmail }),
        signal: controller.signal
      });
      
      if (!response.ok) {
        let errorMessage = `HTTP Error: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.error && errorData.error.message) {
            errorMessage = errorData.error.message;
          }
        } catch {
          // ignore
        }
        throw new Error(errorMessage);
      }
    } finally {
      delete abortControllersRef.current[actionKey];
    }
  }, []);

  // useCallback for Pipeline status migration
  const migrateStatus = useCallback(async (leadId: string, currentStatus: string, direction: 'forward' | 'backward') => {
    const currentIndex = PIPELINE_COLUMNS.findIndex(col => col.key === currentStatus);
    if (currentIndex === -1) return;

    let nextIndex = currentIndex;
    if (direction === 'forward' && currentIndex < PIPELINE_COLUMNS.length - 1) {
      nextIndex = currentIndex + 1;
    } else if (direction === 'backward' && currentIndex > 0) {
      nextIndex = currentIndex - 1;
    }

    if (nextIndex === currentIndex) return;
    const nextStatus = PIPELINE_COLUMNS[nextIndex].key;

    const leadToUpdate = leads.find(l => l.id === leadId);
    if (leadToUpdate && nextStatus === "Zamknięte / Sukces" && leadToUpdate.status !== "Zamknięte / Sukces") {
      const amount = Math.floor(Math.random() * (24000 - 12500) + 12500);
      financeService.triggerJarvisVoice(amount);
      financeService.triggerStripeWebhook(leadToUpdate.name, makeWebhook, amount);
      logAction("Zero-Human-Accounting", "Sukces przychodowy", `Faktura wygenerowana dla leada ${leadToUpdate.name} na kwotę ${amount} PLN.`);
    }

    // Optimistic update
    setLeads(prevLeads => 
      prevLeads.map(l => l.id === leadId ? { ...l, status: nextStatus } : l)
    );

    const controller = new AbortController();
    const actionKey = `migrate-${leadId}`;
    abortControllersRef.current[actionKey] = controller;

    try {
      const res = await fetch('/api/inbound-lead/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, status: nextStatus }),
        signal: controller.signal
      });
      if (res.ok) {
        toast.success(`Przeniesiono do kolumny: ${nextStatus}`);
      } else {
        toast.error("Nie udało się zaktualizować statusu na serwerze");
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        toast.error("Błąd sieci przy zmianie kolumny");
      }
    } finally {
      delete abortControllersRef.current[actionKey];
    }
  }, []);

  // useCallback for direct status selection
  const selectStatus = useCallback(async (leadId: string, status: string) => {
    const leadToUpdate = leads.find(l => l.id === leadId);
    if (leadToUpdate && status === "Zamknięte / Sukces" && leadToUpdate.status !== "Zamknięte / Sukces") {
      const amount = Math.floor(Math.random() * (24000 - 12500) + 12500);
      financeService.triggerJarvisVoice(amount);
      financeService.triggerStripeWebhook(leadToUpdate.name, makeWebhook, amount);
      logAction("Zero-Human-Accounting", "Sukces przychodowy", `Faktura wygenerowana dla leada ${leadToUpdate.name} na kwotę ${amount} PLN.`);
    }

    setLeads(prevLeads => 
      prevLeads.map(l => l.id === leadId ? { ...l, status } : l)
    );

    const controller = new AbortController();
    const actionKey = `selectStatus-${leadId}`;
    abortControllersRef.current[actionKey] = controller;

    try {
      const res = await fetch('/api/inbound-lead/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, status }),
        signal: controller.signal
      });
      if (res.ok) {
        toast.success(`Zaktualizowano status leada.`);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        toast.error("Błąd sieci");
      }
    } finally {
      delete abortControllersRef.current[actionKey];
    }
  }, []);

  // useCallback for manual lead creation
  const handleAddManualLead = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadName || !newLeadBio) {
      toast.error("Podaj chociaż imię i bio!");
      return;
    }

    setIsCreatingLead(true);
    const toastId = toast.loading("Tworzenie leada oraz scoring AI...");
    
    const controller = new AbortController();
    abortControllersRef.current['addLead'] = controller;

    try {
      const response = await fetch('/api/inbound-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newLeadName,
          bio: newLeadBio,
          source: newLeadSource
        }),
        signal: controller.signal
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Pomyślnie dodano leada! AI Score: ${data.score}/100`, { id: toastId });
        logAction("CRM (Zapalnik)", "Ręczne dodanie leada", `Dodano nowego leada "${newLeadName}" ze źródła "${newLeadSource}". AI Score: ${data.score}/100.`);
        setShowAddLead(false);
        setNewLeadName('');
        setNewLeadBio('');
      } else {
        toast.error("Błąd serwera podczas zapisu", { id: toastId });
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error("Manual lead addition error:", err);
        toast.error("Błąd połączenia", { id: toastId });
      }
    } finally {
      delete abortControllersRef.current['addLead'];
      if (isMountedRef.current) {
        setIsCreatingLead(false);
      }
    }
  }, [newLeadName, newLeadBio, newLeadSource, logAction]);

  // useCallback for AI enrichment trigger
  const triggerAIEnrichment = useCallback(async (leadId: string) => {
    setIsEnriching(true);
    const toastId = toast.loading("Gemini pobiera kontekst i buduje plan strategiczny...");
    
    const controller = new AbortController();
    abortControllersRef.current['enrich'] = controller;

    try {
      const res = await fetch('/api/inbound-lead/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId }),
        signal: controller.signal
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          toast.success("Profil pomyślnie wzbogacony przez Gemini!", { id: toastId });
          logAction("CRM (Zapalnik)", "Wzbogacenie profilu leada", `Profil leada (ID: ${leadId}) został pomyślnie przeanalizowany i wzbogacony o plan strategiczny przez Gemini.`);
        } else {
          toast.error("Nie udało się wzbogacić leada.", { id: toastId });
        }
      } else {
        const data = await res.json();
        toast.error(`Błąd: ${data.error || "Serwer odmówił współpracy"}`, { id: toastId });
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        console.error("AI Enrichment error:", e);
        toast.error("Błąd sieci podczas łączenia z linią AI", { id: toastId });
      }
    } finally {
      delete abortControllersRef.current['enrich'];
      if (isMountedRef.current) {
        setIsEnriching(false);
      }
    }
  }, [logAction]);

  // useCallback for AI sequence generation
  const triggerAISequence = useCallback(async (leadId: string) => {
    setIsGeneratingSequence(true);
    const toastId = toast.loading("Gemini tworzy unikalną sekwencję konwersacyjną (4 etapy)...");
    
    const controller = new AbortController();
    abortControllersRef.current['sequence'] = controller;

    try {
      const res = await fetch('/api/inbound-lead/sequence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId }),
        signal: controller.signal
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          toast.success("Strategiczna sekwencja DM wygenerowana pomyślnie!", { id: toastId });
          logAction("CRM (Zapalnik)", "Generowanie sekwencji DM", `Pomyślnie wygenerowano 4-etapową sekwencję konwersacyjną dla leada (ID: ${leadId}).`);
        } else {
          toast.error("Nie udało się wygenerować sekwencji.", { id: toastId });
        }
      } else {
        const data = await res.json();
        toast.error(`Błąd: ${data.error || "Serwer odmówił współpracy"}`, { id: toastId });
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        console.error("AI Sequence generation error:", e);
        toast.error("Błąd sieci podczas generowania sekwencji", { id: toastId });
      }
    } finally {
      delete abortControllersRef.current['sequence'];
      if (isMountedRef.current) {
        setIsGeneratingSequence(false);
      }
    }
  }, [logAction]);

  // useCallback for AI Pitch-Card generation
  const triggerPitchCardGeneration = useCallback(async (leadId: string) => {
    setIsGeneratingPitchCard(true);
    const toastId = toast.loading("Gemini projektuje spersonalizowaną, nasyconą danymi ofertę B2B (Pitch-Card)...");
    
    const controller = new AbortController();
    abortControllersRef.current['pitchCard'] = controller;

    try {
      const res = await fetch('/api/inbound-lead/pitch-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId }),
        signal: controller.signal
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          toast.success("Dedykowany Pitch-Card przygotowany pomyślnie!", { id: toastId });
          setShowPitchCardModal(true);
        } else {
          toast.error("Nie udało się wygenerować dedykowanej oferty.", { id: toastId });
        }
      } else {
        const data = await res.json();
        toast.error(`Błąd: ${data.error || "Serwer odmówił współpracy"}`, { id: toastId });
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        console.error("AI Pitch-Card generation error:", e);
        toast.error("Błąd sieci podczas budowania Pitch-Card", { id: toastId });
      }
    } finally {
      delete abortControllersRef.current['pitchCard'];
      if (isMountedRef.current) {
        setIsGeneratingPitchCard(false);
      }
    }
  }, []);

  // useCallback for AI tactical brief generation
  const triggerTacticalBriefGeneration = useCallback(async (leadId: string) => {
    setIsGeneratingTacticalBrief(true);
    const toastId = toast.loading("SDR Command AI przygotowuje pancerną odprawę taktyczną i scenariusz ataku (Brief wojskowy)...");
    
    const controller = new AbortController();
    abortControllersRef.current['tacticalBrief'] = controller;

    try {
      const res = await fetch('/api/inbound-lead/tactical-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId }),
        signal: controller.signal
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          toast.success("Odprawa taktyczna gotowa i załadowana na dysk bojowy!", { id: toastId });
          setShowTacticalBriefModal(true);
        } else {
          toast.error("Nie udało się uzbroić odprawy taktycznej.", { id: toastId });
        }
      } else {
        const data = await res.json();
        toast.error(`Błąd polowy: ${data.error || "Serwer odmówił współpracy"}`, { id: toastId });
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        console.error("AI Tactical Brief generation error:", e);
        toast.error("Błąd łączności radiowej podczas pobierania odprawy taktycznej", { id: toastId });
      }
    } finally {
      delete abortControllersRef.current['tacticalBrief'];
      if (isMountedRef.current) {
        setIsGeneratingTacticalBrief(false);
      }
    }
  }, []);

  // useCallback for simulation message send
  const sendSimulationMessage = useCallback(async () => {
    if (!chatMessageText.trim() || !selectedLead) return;

    const userMsgText = chatMessageText;
    setChatMessageText(""); // clear input early

    const newSellerMessage: ChatMessage = {
      sender: 'seller',
      text: userMsgText,
      timestamp: new Date().toISOString()
    };

    const updatedHistory = [...localChat, newSellerMessage];
    setLocalChat(updatedHistory);
    setIsSendingChat(true);

    const controller = new AbortController();
    abortControllersRef.current['chat'] = controller;

    try {
      const res = await fetch('/api/inbound-lead/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedLead.id,
          messages: updatedHistory
        }),
        signal: controller.signal
      });

      if (res.ok) {
        const data = await res.json();
        if (!data.success) {
          toast.error("Błąd symulacji ze strony modelu.");
        }
      } else {
        toast.error("Serwer symulacji nie odpowiedział poprawnie.");
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        console.error("Simulation Message error:", e);
        toast.error("Błąd sieci podczas łączenia z symulatorem.");
      }
    } finally {
      delete abortControllersRef.current['chat'];
      if (isMountedRef.current) {
        setIsSendingChat(false);
      }
    }
  }, [chatMessageText, selectedLead, localChat]);

  // useCallback for resetting sandbox chat history
  const clearSimulationChat = useCallback(async () => {
    if (!selectedLead) return;
    
    setLocalChat([]);
    const toastId = toast.loading("Resetowanie symulatora...");
    
    const controller = new AbortController();
    abortControllersRef.current['clearChat'] = controller;

    try {
      const res = await fetch('/api/inbound-lead/chat/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedLead.id,
          chatHistory: []
        }),
        signal: controller.signal
      });

      if (res.ok) {
        toast.success("Historia symulacji została zresetowana!", { id: toastId });
      } else {
        toast.error("Wystąpił błąd podczas czyszczenia historii.", { id: toastId });
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        console.error("Clear chat history error:", e);
        toast.error("Błąd sieci", { id: toastId });
      }
    } finally {
      delete abortControllersRef.current['clearChat'];
    }
  }, [selectedLead]);

  // Stable toggles and tab selectors wrapped in useCallback
  const handleSetActiveTab = useCallback((tab: 'pipeline' | 'magnet' | 'inbox' | 'clients') => {
    setActiveTab(tab);
  }, []);

  const toggleMilitaryMode = useCallback(() => {
    setMilitaryModeEnabled(prev => {
      const newState = !prev;
      if (newState) {
        toast.success("Aktywowano Tryb Wojskowy (SDR Tactical Combat Mode) - system bojowy uzbrojony!");
      } else {
        toast.info("Przywrócono standardowy profil CRM");
      }
      return newState;
    });
  }, []);

  const handleOpenAddLead = useCallback(() => setShowAddLead(true), []);
  const handleCloseAddLead = useCallback(() => setShowAddLead(false), []);
  const handleCloseDrawer = useCallback(() => setSelectedLeadId(null), []);

  const handleOpenPitchCard = useCallback(() => setShowPitchCardModal(true), []);
  const handleClosePitchCard = useCallback(() => setShowPitchCardModal(false), []);
  const handleOpenTacticalBrief = useCallback(() => setShowTacticalBriefModal(true), []);
  const handleCloseTacticalBrief = useCallback(() => setShowTacticalBriefModal(false), []);

  return (
    <div className="space-y-6">
      {/* NAGŁÓWEK STRONY ZOPTYMALIZOWANY POD PRO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-900 pb-5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-widest">PRO Version</span>
            <span className="text-[10px] bg-purple-500/10 text-purple-400 font-bold px-2 py-0.5 rounded-full border border-purple-500/20 uppercase tracking-widest">Gemini Engine</span>
            <button
              onClick={toggleMilitaryMode}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5 ${
                militaryModeEnabled 
                  ? 'bg-rose-500/15 text-rose-400 border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.2)] hover:bg-rose-500/25'
                  : 'bg-neutral-900 text-neutral-500 border-neutral-800 hover:text-neutral-400'
              }`}
            >
              <Crosshair size={11} className={militaryModeEnabled ? "animate-spin text-rose-400" : "text-neutral-500"} />
              {militaryModeEnabled ? 'Tryb Wojskowy: UZBROJONY' : 'Tryb Wojskowy: WYŁĄCZONY'}
            </button>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3 mt-1.5">
            <Flame className="text-emerald-500 animate-pulse" size={32} />
            Zapalnik CRM Pipelines™
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            Automatyzacje B2B, śledzenie procesów, wzbogacanie transakcji o wektory Gemini oraz generator Lead Magnetów.
          </p>
        </div>
        
        {/* TABS SELECTOR PRO VIBE */}
        <div className="flex flex-wrap bg-neutral-950 border border-neutral-800 rounded-lg p-1 max-w-full">
          <button 
            onClick={() => handleSetActiveTab('pipeline')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${activeTab === 'pipeline' ? 'bg-neutral-900 text-emerald-400 border border-neutral-800 shadow-xl' : 'text-neutral-400 hover:text-white'}`}
          >
            <Sliders size={14} className="text-emerald-500" /> Pipeline (Kanban)
          </button>
          <button 
            onClick={() => handleSetActiveTab('magnet')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${activeTab === 'magnet' ? 'bg-neutral-900 text-rose-400 border border-neutral-800' : 'text-neutral-400 hover:text-white'}`}
          >
            <Magnet size={14} className="text-rose-500" /> Lead Magnet
          </button>
          <button 
            onClick={() => handleSetActiveTab('inbox')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${activeTab === 'inbox' ? 'bg-neutral-900 text-blue-400 border border-neutral-800' : 'text-neutral-400 hover:text-white'}`}
          >
            <Mail size={14} className="text-blue-500" /> Skrzynka Gmail
          </button>
          <button 
            onClick={() => handleSetActiveTab('clients')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${activeTab === 'clients' ? 'bg-neutral-900 text-purple-400 border border-neutral-800' : 'text-neutral-400 hover:text-white'}`}
          >
            <Users size={14} className="text-purple-500" /> Klienci i Notatki
          </button>
        </div>
      </div>

      {/* PIPELINE KANBAN VIEW */}
      {activeTab === 'pipeline' && (
        <PipelineKanban
          leads={computedLeadsWithFastLane}
          selectedLeadId={selectedLeadId}
          setSelectedLeadId={setSelectedLeadId}
          migrateStatus={migrateStatus}
          onAddLeadClick={handleOpenAddLead}
        />
      )}

      {/* TABS 2: LEAD MAGNET CREATOR */}
      {activeTab === 'magnet' && (
        <LeadMagnetCreator sendEmail={sendEmail} />
      )}

      {/* TABS 3: SKRZYNKA OPERATORSKA GMAIL */}
      {activeTab === 'inbox' && (
        <div className="border border-neutral-900 rounded-xl bg-neutral-950/30 p-4">
          <GmailIntegration />
        </div>
      )}

      {/* TABS 4: BAZA KLIENTÓW & SPOTKANIA NOTATKI */}
      {activeTab === 'clients' && (
        <div className="border border-neutral-900 rounded-xl bg-neutral-950/30 p-4">
          <CrmMeetingSummarizer />
        </div>
      )}

      {/* ============================================== */}
      {/* SIDE DRAWER PRO: KARTA SZCZEGÓŁÓW I AI PROFILE */}
      {/* ============================================== */}
      <AnimatePresence>
        {selectedLead && (
          <LeadDetailsDrawer
            lead={selectedLead}
            onClose={handleCloseDrawer}
            selectStatus={selectStatus}
            militaryModeEnabled={militaryModeEnabled}
            triggerPitchCardGeneration={triggerPitchCardGeneration}
            isGeneratingPitchCard={isGeneratingPitchCard}
            onOpenPitchCard={handleOpenPitchCard}
            triggerTacticalBriefGeneration={triggerTacticalBriefGeneration}
            isGeneratingTacticalBrief={isGeneratingTacticalBrief}
            onOpenTacticalBrief={handleOpenTacticalBrief}
            drawerTab={drawerTab}
            setDrawerTab={setDrawerTab}
            triggerAIEnrichment={triggerAIEnrichment}
            isEnriching={isEnriching}
            triggerAISequence={triggerAISequence}
            isGeneratingSequence={isGeneratingSequence}
            localChat={localChat}
            chatMessageText={chatMessageText}
            setChatMessageText={setChatMessageText}
            isSendingChat={isSendingChat}
            sendSimulationMessage={sendSimulationMessage}
            clearSimulationChat={clearSimulationChat}
          />
        )}
      </AnimatePresence>

      {/* ============================================== */}
      {/* PRO MODAL: ADD MANUAL LEAD */}
      {/* ============================================== */}
      <AnimatePresence>
        {showAddLead && (
          <AddLeadModal
            isOpen={showAddLead}
            onClose={handleCloseAddLead}
            newLeadName={newLeadName}
            setNewLeadName={setNewLeadName}
            newLeadBio={newLeadBio}
            setNewLeadBio={setNewLeadBio}
            newLeadSource={newLeadSource}
            setNewLeadSource={setNewLeadSource}
            isCreatingLead={isCreatingLead}
            onSubmit={handleAddManualLead}
          />
        )}
      </AnimatePresence>

      {/* B2B PREMIUM PITCH-CARD INTERACTIVE MODAL */}
      <AnimatePresence>
        {showPitchCardModal && selectedLead && selectedLead.pitchCard && (
          <PitchCardModal
            isOpen={showPitchCardModal}
            onClose={handleClosePitchCard}
            lead={selectedLead}
          />
        )}
      </AnimatePresence>

      {/* B2B MILITARY-GRADE TACTICAL BRIEF BATTLECARD (HUD) */}
      <AnimatePresence>
        {showTacticalBriefModal && selectedLead && selectedLead.tacticalBrief && (
          <TacticalBriefModal
            isOpen={showTacticalBriefModal}
            onClose={handleCloseTacticalBrief}
            lead={selectedLead}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
