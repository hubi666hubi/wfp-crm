import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, updateDoc, doc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../lib/firebase";
import { 
  Magnet, Flame, Bot, Zap, Mail, Users, 
  ArrowLeft, ArrowRight, Sparkles, Plus, 
  X, Clipboard, Check, 
  Activity, RefreshCw, Sliders, 
  AlertTriangle, ClipboardList, Info,
  MessageSquare, GraduationCap, RotateCcw, Award,
  FileText, Download, Briefcase, TrendingUp, Clock, Coins,
  Crosshair, Shield, Skull, Target
} from 'lucide-react';
import { GmailIntegration } from './GmailIntegration';
import { motion, AnimatePresence } from 'motion/react';
import { getAccessToken } from '../lib/auth';
import { CrmMeetingSummarizer } from './CrmMeetingSummarizer';
import { toast } from 'sonner';
import { useSystemLogsStore } from '../store/systemLogsStore';

// Define structures matching server schemas
export interface AIEnrichment {
  icebreakers: string[];
  budgetPotential: 'niski' | 'średni' | 'wysoki' | string;
  objections: { objection: string; riposte: string }[];
}

export interface DMStep {
  step: number;
  delay: string;
  label: string;
  text: string;
}

export interface ChatMessage {
  sender: 'seller' | 'lead';
  text: string;
  timestamp: string;
  coachScore?: number;
  coachFeedback?: string;
}

export interface PitchCardData {
  companyName: string;
  leadName: string;
  industryChallenges: string[];
  proposedSolutions: string[];
  estimatedRoi: {
    timeSavedHours: string;
    costReductionPct: string;
    paybackMonths: string;
    financialGain: string;
  };
  timeline: {
    milestone: string;
    duration: string;
    description: string;
  }[];
  htmlEmailTemplate: string;
}

export interface TacticalBriefData {
  missionObjective: string;
  vulnerabilityAssessment: string[];
  meddpiccTable: {
    metrics: string;
    economicBuyer: string;
    decisionCriteria: string;
    decisionProcess: string;
    identifyPain: string;
    champion: string;
  };
  combatObjections: { objection: string; combatshield: string }[];
  opScript: {
    phase1Hook: string;
    phase2Pain: string;
    phase3Proof: string;
    phase4Cta: string;
  };
  readinessRating: number;
}

export interface InboundLead {
  id: string;
  name: string;
  bio: string;
  source: string;
  timestamp: string;
  isHighTicket: boolean;
  score: number;
  draftMessage: string;
  status: string;
  aiEnrichment?: AIEnrichment;
  dmSequence?: DMStep[];
  chatHistory?: ChatMessage[];
  pitchCard?: PitchCardData;
  tacticalBrief?: TacticalBriefData;
}

const PIPELINE_COLUMNS = [
  { key: "Inbound (Wtyczka)", label: "Inbound (Wtyczka)", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  { key: "Zakwalifikowane", label: "Zakwalifikowane", color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  { key: "Wysłana wiadomość", label: "Wysłana wiadomość", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  { key: "Rozmowa w toku", label: "Rozmowa w toku", color: "text-pink-400 bg-pink-500/10 border-pink-500/20" },
  { key: "Zamknięte / Sukces", label: "Zamknięte / Sukces", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" }
];

export function Zapalnik() {
  const logAction = useSystemLogsStore((state) => state.logAction);
  // Page tabs
  const [activeTab, setActiveTab] = useState<'pipeline' | 'magnet' | 'inbox' | 'clients'>('pipeline');
  
  // Leads state
  const [leads, setLeads] = useState<InboundLead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isEnriching, setIsEnriching] = useState(false);
  
  // Manual Lead Form Modal
  const [showAddLead, setShowAddLead] = useState(false);
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadBio, setNewLeadBio] = useState('');
  const [newLeadSource, setNewLeadSource] = useState('LinkedIn');
  const [isCreatingLead, setIsCreatingLead] = useState(false);

  // Lead Magnet simulation states
  const [email, setEmail] = useState('');
  const [pain, setPain] = useState('');
  const [generating, setGenerating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Clipboard copies
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Cache fast lane metadata to avoid repeated localStorage lookups in render loop
  const [fastLaneMeta] = useState<{topic: string | null, msg: string | null}>(() => ({
    topic: localStorage.getItem("omega_zrzut_vsl_topic"),
    msg: localStorage.getItem("omega_zrzut_zapalnik_message")
  }));

  // PRO Feature SDR Sandbox / Sequence states
  const [drawerTab, setDrawerTab] = useState<'profil' | 'sekwencja' | 'symulator'>('profil');
  const [isGeneratingSequence, setIsGeneratingSequence] = useState(false);
  const [isGeneratingPitchCard, setIsGeneratingPitchCard] = useState(false);
  const [showPitchCardModal, setShowPitchCardModal] = useState(false);
  const [isGeneratingTacticalBrief, setIsGeneratingTacticalBrief] = useState(false);
  const [showTacticalBriefModal, setShowTacticalBriefModal] = useState(false);
  const [militaryModeEnabled, setMilitaryModeEnabled] = useState(true); // default to true since client requested "tryb wojskowy"!
  const [localChat, setLocalChat] = useState<ChatMessage[]>([]);
  const [chatMessageText, setChatMessageText] = useState("");
  const [isSendingChat, setIsSendingChat] = useState(false);

  // Real-time Firestore synchronization for the Inbound Feed
  useEffect(() => {
    // Initial fetch to trigger backend logic/seeding if needed
    fetch('/api/inbound-leads').catch(err => console.error("Initial leads fetch failed:", err));

    // Listen for real-time updates directly from the source of truth
    const q = collection(db, "inbound_leads");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedLeads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InboundLead));
      // Sorting by timestamp descending (most recent first)
      const sorted = fetchedLeads.sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setLeads(sorted);
    }, (error) => {
      console.error("Real-time leads sync error:", error);
    });

    return () => unsubscribe();
  }, []);

  // Derive the selected lead directly from current leads list on every render


  // Consolidate list derivation and grouping into a single O(N) pass
  const { allLeads, grouped } = useMemo(() => {
    const result: InboundLead[] = [...leads];
    let hasZrzut = false;

    // First pass check for existing ZRZUT
    for (const l of leads) {
      if (l.source === 'Kolejka ZRZUT' || l.source?.includes('ZRZUT') || l.name?.includes('ZRZUT')) {
        hasZrzut = true;
        break;
      }
    }

    if (!hasZrzut && fastLaneMeta.topic) {
      const simulatedZrzutLead = {
        id: "simulated-zrzut-crm-lead",
        name: "Adam Kowalski // Kolejka ZRZUT 🔴",
        bio: `System zidentyfikował reakcję na gorący trend "${fastLaneMeta.topic}". Profil rynkowy: Dyrektor Operacyjny. Potrzebuje automatyzacji dystrybucji treści.`,
        source: 'Kolejka ZRZUT',
        timestamp: new Date().toISOString(),
        isHighTicket: true,
        score: 99,
        draftMessage: fastLaneMeta.msg || "Gotowy do szybkiego wysłania...",
        status: "Do kontaktu",
        chatHistory: [
          { sender: 'lead', text: `Cześć, widziałem Waszą analizę trendu "${fastLaneMeta.topic}". Chciałbym wdrożyć u siebie podobne pętle automatyczne. Prześlesz mi ofertę oraz szablon VSL?`, timestamp: "Przed chwilą" }
        ],
        aiEnrichment: {
          icebreakers: [
            `Gratulacje udanego treningu na siłowni! Dopinamy brzuch i domykamy lejek.`,
            `Zauważyłem, że reagujesz błyskawicznie na najnowszy trend ${fastLaneMeta.topic}.`
          ],
          budgetPotential: "Wysoki ($10,000+)",
          objections: [
            { objection: "Brak czasu na wdrożenie", riposte: "Automatyzacja Omega PRO konfiguruje się w niecałe 4 minuty, przejmując całą dystrybucję wideo." }
          ]
        }
      } as unknown as InboundLead;
      result.unshift(simulatedZrzutLead);
    }

    // Grouping pass
    const groups: Record<string, InboundLead[]> = {};
    result.forEach(lead => {
      if (!groups[lead.status]) groups[lead.status] = [];
      groups[lead.status].push(lead);
    });

    return { allLeads: result, grouped: groups };
  }, [leads, fastLaneMeta]);

  const computedLeadsWithFastLane = allLeads;
  const groupedLeads = grouped;

  const selectedLead = selectedLeadId ? computedLeadsWithFastLane.find(l => l.id === selectedLeadId) || null : null;

  // Sync Drawer tabs and chat history upon selecting a lead
  useEffect(() => {
    Promise.resolve().then(() => {
      setDrawerTab('profil');
      if (selectedLead) {
        setLocalChat(selectedLead.chatHistory || []);
      } else {
        setLocalChat([]);
      }
    });
  }, [selectedLeadId, selectedLead]);

  // Keep localChat in sync when poll results change
  useEffect(() => {
    if (selectedLead && selectedLead.chatHistory && selectedLead.chatHistory.length !== localChat.length) {
      const currentHistory = selectedLead.chatHistory;
      Promise.resolve().then(() => {
        setLocalChat(currentHistory);
      });
    }
  }, [selectedLead, localChat.length]);

  // Lead Magnet email helper
  const sendEmail = async (to: string, subject: string, body: string) => {
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

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ raw: base64EncodedEmail })
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
  };

  const handleCloseWonWithInvoice = async (lead: any) => {
    const amount = 19500;
    toast.info(`Inicjowanie rozliczenia PRO dla ${lead.companyName}...`);

    const res = await FinanceService.issueInvoice({
      companyName: lead.companyName,
      email: lead.email || "ksiegowosc@system.pl",
      amount,
      serviceType: "Retainer Premium WFP Elite",
      invoiceType: "vat"
    });

    if (res.success) {
      toast.success("STATUS: ZAMKNIĘTY SUKCES. Faktura VAT została wystawiona!");
      FinanceService.triggerJarvisVoice(`Mistrzu! Faktura dla firmy ${lead.companyName} na kwotę ${amount} złotych została automatycznie wystawiona i wysłana! Kesz leci na konto!`);
    }
  };
  const handleCaptureLead = () => {
    if (!email || !pain) return;
    setGenerating(true);
    setSuccess(false);
    setErrorMessage('');

    setTimeout(async () => {
      try {
        const bodyContent = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #ffffff; padding: 24px; border-radius: 12px; border: 1px solid #1f1f1f;">
            <h2 style="color: #10b981; font-family: sans-serif;">Cześć! Twój Zapalnik AI Onboarding</h2>
            <p>Nasz system przeanalizował wskazany ból operacyjny:</p>
            <blockquote style="border-left: 4px solid #10b981; padding-left: 16px; color: #a3a3a3; font-style: italic; background: #141414; padding: 12px; margin: 16px 0;">
              "${pain}"
            </blockquote>
            <p>Przygotowaliśmy dla Ciebie dedykowany schemat automatyzacji. Jeden z naszych asystentów skontaktuje się, aby omówić szczegóły.</p>
            <p style="margin-top: 30px; font-size: 12px; color: #737373;">Pozdrawiamy,<br>Zespół Zapalnik CRM PRO</p>
          </div>
        `;
        
        await sendEmail(email, "Twój spersonalizowany Plan Automatyzacji!", bodyContent);
        
        setGenerating(false);
        setSuccess(true);
        setEmail('');
        setPain('');
        toast.success("E-book i plan automatyzacji wysłany bezpośrednio przez Twoje konto Gmail!");
        setTimeout(() => setSuccess(false), 5000);
      } catch (err: unknown) {
        console.error(err);
        setGenerating(false);
        setErrorMessage(err instanceof Error ? err.message : 'Błąd podczas wysyłania emaila.');
        toast.error("Błąd wysyłki: " + (err instanceof Error ? err.message : "Spróbuj ponownie"));
      }
    }, 4500); 
  };

  // PRO: Migrate leads through pipelines
  const migrateStatus = async (leadId: string, currentStatus: string, direction: 'forward' | 'backward') => {
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

    // Optimistic update
    setLeads(prevLeads => 
      prevLeads.map(l => l.id === leadId ? { ...l, status: nextStatus } : l)
    );

    try {
      const res = await fetch('/api/inbound-lead/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, status: nextStatus })
      });
      if (res.ok) {
        toast.success(`Przeniesiono do kolumny: ${nextStatus}`);
      } else {
        toast.error("Nie udało się zaktualizować statusu na serwerze");
      }
    } catch {
      toast.error("Błąd sieci przy zmianie kolumny");
    }
  };

  // PRO: Select status directly
  const selectStatus = async (leadId: string, status: string) => {
    setLeads(prevLeads => 
      prevLeads.map(l => l.id === leadId ? { ...l, status } : l)
    );

    try {
      const res = await fetch('/api/inbound-lead/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, status })
      });
      if (res.ok) {
        toast.success(`Zaktualizowano status leada.`);
      }
    } catch {
      toast.error("Błąd sieci");
    }
  };

  // PRO: Manual Add Lead
  const handleAddManualLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadName || !newLeadBio) {
      toast.error("Podaj chociaż imię i bio!");
      return;
    }

    setIsCreatingLead(true);
    const toastId = toast.loading("Tworzenie leada oraz scoring AI...");
    try {
      const response = await fetch('/api/inbound-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newLeadName,
          bio: newLeadBio,
          source: newLeadSource
        })
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
    } catch (err) {
      console.error("Manual lead addition error:", err);
      toast.error("Błąd połączenia", { id: toastId });
    } finally {
      setIsCreatingLead(false);
    }
  };

  // PRO: AI Profile enrichment
  const triggerAIEnrichment = async (leadId: string) => {
    setIsEnriching(true);
    const toastId = toast.loading("Gemini pobiera kontekst i buduje plan strategiczny...");
    try {
      const res = await fetch('/api/inbound-lead/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId })
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
    } catch (e) {
      console.error("AI Enrichment error:", e);
      toast.error("Błąd sieci podczas łączenia z linią AI", { id: toastId });
    } finally {
      setIsEnriching(false);
    }
  };

  // PRO Feature: AI Strategic CRM Sequence Campaign Generator
  const triggerAISequence = async (leadId: string) => {
    setIsGeneratingSequence(true);
    const toastId = toast.loading("Gemini tworzy unikalną sekwencję konwersacyjną (4 etapy)...");
    try {
      const res = await fetch('/api/inbound-lead/sequence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId })
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
    } catch (e) {
      console.error("AI Sequence generation error:", e);
      toast.error("Błąd sieci podczas generowania sekwencji", { id: toastId });
    } finally {
      setIsGeneratingSequence(false);
    }
  };

  // PRO Feature: AI Pitch-Card Generator
  const triggerPitchCardGeneration = async (leadId: string) => {
    setIsGeneratingPitchCard(true);
    const toastId = toast.loading("Gemini projektuje spersonalizowaną, nasyconą danymi ofertę B2B (Pitch-Card)...");
    try {
      const res = await fetch('/api/inbound-lead/pitch-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId })
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
    } catch (e) {
      console.error("AI Pitch-Card generation error:", e);
      toast.error("Błąd sieci podczas budowania Pitch-Card", { id: toastId });
    } finally {
      setIsGeneratingPitchCard(false);
    }
  };

  // PRO Feature: Military-Style AI Tactical Brief Generator
  const triggerTacticalBriefGeneration = async (leadId: string) => {
    setIsGeneratingTacticalBrief(true);
    const toastId = toast.loading("SDR Command AI przygotowuje pancerną odprawę taktyczną i scenariusz ataku (Brief wojskowy)...");
    try {
      const res = await fetch('/api/inbound-lead/tactical-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId })
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
    } catch (e) {
      console.error("AI Tactical Brief generation error:", e);
      toast.error("Błąd łączności radiowej podczas pobierania odprawy taktycznej", { id: toastId });
    } finally {
      setIsGeneratingTacticalBrief(false);
    }
  };

  // PRO Feature: Send Simulation Message to sandbox
  const sendSimulationMessage = async () => {
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

    try {
      const res = await fetch('/api/inbound-lead/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedLead.id,
          messages: updatedHistory
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          // Sync happens via onSnapshot automatically
        } else {
          toast.error("Błąd symulacji ze strony modelu.");
        }
      } else {
        toast.error("Serwer symulacji nie odpowiedział poprawnie.");
      }
    } catch (e) {
      console.error("Simulation Message error:", e);
      toast.error("Błąd sieci podczas łączenia z symulatorem.");
    } finally {
      setIsSendingChat(false);
    }
  };

  // PRO Feature: Reset sandbox chat history
  const clearSimulationChat = async () => {
    if (!selectedLead) return;
    
    setLocalChat([]);
    const toastId = toast.loading("Resetowanie symulatora...");
    try {
      const res = await fetch('/api/inbound-lead/chat/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedLead.id,
          chatHistory: []
        })
      });

      if (res.ok) {
        toast.success("Historia symulacji została zresetowana!", { id: toastId });
      } else {
        toast.error("Wystąpił błąd podczas czyszczenia historii.", { id: toastId });
      }
    } catch (e) {
      console.error("Clear chat history error:", e);
      toast.error("Błąd sieci", { id: toastId });
    }
  };

  // Copy helper
  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Skopiowano do schowka!");
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="space-y-6">
      {/* NAGŁÓWEK STRONY ZOPTYMALIZOWANY POD PRO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-900 pb-5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-widest">PRO Version</span>
            <span className="text-[10px] bg-purple-500/10 text-purple-400 font-bold px-2 py-0.5 rounded-full border border-purple-500/20 uppercase tracking-widest">Gemini Engine</span>
            <button
              onClick={() => {
                const newState = !militaryModeEnabled;
                setMilitaryModeEnabled(newState);
                if (newState) {
                  toast.success("Aktywowano Tryb Wojskowy (SDR Tactical Combat Mode) - system bojowy uzbrojony!");
                } else {
                  toast.info("Przywrócono standardowy profil CRM");
                }
              }}
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
            onClick={() => setActiveTab('pipeline')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${activeTab === 'pipeline' ? 'bg-neutral-900 text-emerald-400 border border-neutral-800 shadow-xl' : 'text-neutral-400 hover:text-white'}`}
          >
            <Sliders size={14} className="text-emerald-500" /> Pipeline (Kanban)
          </button>
          <button 
            onClick={() => setActiveTab('magnet')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${activeTab === 'magnet' ? 'bg-neutral-900 text-rose-400 border border-neutral-800' : 'text-neutral-400 hover:text-white'}`}
          >
            <Magnet size={14} className="text-rose-500" /> Lead Magnet
          </button>
          <button 
            onClick={() => setActiveTab('inbox')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${activeTab === 'inbox' ? 'bg-neutral-900 text-blue-400 border border-neutral-800' : 'text-neutral-400 hover:text-white'}`}
          >
            <Mail size={14} className="text-blue-500" /> Skrzynka Gmail
          </button>
          <button 
            onClick={() => setActiveTab('clients')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${activeTab === 'clients' ? 'bg-neutral-900 text-purple-400 border border-neutral-800' : 'text-neutral-400 hover:text-white'}`}
          >
            <Users size={14} className="text-purple-500" /> Klienci i Notatki
          </button>
        </div>
      </div>

      {/* PIPELINE KANBAN VIEW */}
      {activeTab === 'pipeline' && (
        <div className="space-y-6">
          {/* PASEK FILTRÓW I TESTOWANIA */}
          <div className="bg-neutral-950/40 p-4 border border-neutral-900 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-neutral-900 border border-neutral-800 rounded-lg text-emerald-400">
                <ClipboardList size={16} />
              </span>
              <div>
                <div className="text-xs font-bold text-white uppercase tracking-wider">Tablica Pipelines</div>
                <div className="text-[11px] text-neutral-500">Zsynchronizowana w czasie rzeczywistym z wtyczką Chrome.</div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button 
                onClick={() => {}} 
                className="p-2.5 bg-neutral-905 border border-neutral-800 rounded-lg text-emerald-400 font-bold transition-all text-xs flex items-center gap-1.5 cursor-pointer"
                title="Satelitarne Połączenie Aktywne"
                disabled
              >
                <RefreshCw size={13} className={"animate-spin text-emerald-400"} />
                LIVE SYNC ACTVE
              </button>
              
              <button
                onClick={() => setShowAddLead(true)}
                className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 border border-emerald-500/20 text-xs font-bold text-white rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:scale-[1.01] cursor-pointer"
              >
                <Plus size={14} /> Dodaj leada ręcznie
              </button>
            </div>
          </div>

          {/* HIGH-PRIORITY FAST-LANE ZRZUT SECTION */}
          {computedLeadsWithFastLane.some(l => l.source === 'Kolejka ZRZUT') && (
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
                  <p className="text-xs text-neutral-400">Gorące szanse zidentyfikowane automatycznie przez radar trendów społecznościowych</p>
                </div>
                <span className="text-[10px] font-mono font-bold text-rose-400">OPERACJA ZRZUT 21:00 AKTUALNA</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {computedLeadsWithFastLane.filter(l => l.source === 'Kolejka ZRZUT').map((lead) => {
                  return (
                    <div 
                      key={lead.id}
                      onClick={() => setSelectedLeadId(lead.id)}
                      className={`bg-neutral-900/80 p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden group ${
                        lead.id === selectedLeadId ? "border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.15)]" : "border-neutral-805 hover:border-neutral-700"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] bg-red-500/10 text-red-400 font-bold px-2 py-0.5 rounded border border-red-500/20">
                          {lead.source}
                        </span>
                        <span className="text-[10px] text-neutral-500 font-mono">Dopasowanie: {lead.score}%</span>
                      </div>
                      <h4 className="text-sm font-black text-white group-hover:text-red-400 transition-colors uppercase tracking-tight">{lead.name}</h4>
                      <p className="text-xs text-neutral-305 font-sans mt-0.5 leading-relaxed">{lead.bio}</p>
                      
                      <div className="mt-3 bg-black/40 border border-neutral-850 p-2.5 rounded-lg space-y-2">
                        <span className="text-[9px] font-mono text-neutral-500 uppercase block">Pierwsza wiadomość Connect Connect Pitch:</span>
                        <p className="text-[11px] text-neutral-300 font-sans italic line-clamp-2 leading-normal">"{lead.draftMessage}"</p>
                        <div className="flex items-center gap-2 pt-1 border-t border-neutral-850/65">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(lead.draftMessage);
                              toast.success("Skopiowano Pitch pierwszej wiadomości zrzutowej!");
                            }}
                            className="bg-neutral-900 hover:bg-neutral-850 text-[10px] text-neutral-300 font-bold px-2.5 py-1 rounded border border-neutral-800 cursor-pointer flex items-center gap-1 transition-colors"
                          >
                            <Check size={10} /> Schowek
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLeadId(lead.id);
                              toast.success("Wybrano leada zrzutowego.");
                            }}
                            className="bg-red-600/15 border border-red-500/30 text-red-400 text-[10px] font-bold px-3 py-1 rounded hover:bg-red-600/25 cursor-pointer ml-auto transition-colors"
                          >
                            Otwórz Szanse
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* KANBAN GRID CHASSIS */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
            {PIPELINE_COLUMNS.map((column) => {
              // Efficient O(1) lookup from pre-grouped map
              const colLeads = groupedLeads[column.key] || [];
              
              return (
                <div 
                  key={column.key} 
                  className="bg-neutral-950/70 border border-neutral-900 rounded-xl p-3 min-h-[500px] flex flex-col space-y-3 relative"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-900">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        column.key.includes("Wtyczka") ? "bg-blue-400" :
                        column.key.includes("Zakwalifikowane") ? "bg-purple-400" :
                        column.key.includes("wiadomość") ? "bg-amber-400" :
                        column.key.includes("toku") ? "bg-pink-400" : "bg-emerald-400"
                      }`} />
                      <h3 className="text-xs font-bold text-neutral-300 truncate tracking-wide max-w-[130px]">{column.label}</h3>
                    </div>
                    <span className="text-[10px] bg-neutral-900 px-2 py-0.5 rounded text-neutral-400 font-mono font-bold">
                      {colLeads.length}
                    </span>
                  </div>

                  {/* Column Cards Container */}
                  <div className="flex-1 space-y-3 overflow-y-auto max-h-[600px] custom-scrollbar pr-1">
                    {colLeads.length === 0 ? (
                      <div className="h-28 border border-dashed border-neutral-900 rounded-xl flex flex-col items-center justify-center p-3 text-center">
                        <span className="text-[10px] text-neutral-600 uppercase font-bold tracking-wider">Pusty etap</span>
                      </div>
                    ) : (
                      colLeads.map((lead) => (
                        <motion.div
                          key={lead.id}
                          layoutId={`lead-${lead.id}`}
                          onClick={() => setSelectedLeadId(lead.id)}
                          className={`bg-neutral-900/60 hover:bg-neutral-900 p-3.5 rounded-xl border transition-all cursor-pointer group relative overflow-hidden ${
                            lead.id === selectedLeadId 
                              ? "border-emerald-500 bg-neutral-900/90 shadow-[0_0_15px_rgba(16,185,129,0.1)]" 
                              : "border-neutral-805 hover:border-neutral-700"
                          }`}
                        >
                          {/* Top Tag Indicators */}
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-[9px] bg-neutral-950 border border-neutral-850 px-2 py-0.5 rounded text-neutral-400 font-bold uppercase tracking-wide">
                              {lead.source}
                            </span>
                            
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                              lead.score >= 70 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                              lead.score >= 40 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                              'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}>
                              Score: {lead.score}
                            </span>
                          </div>

                          {/* Lead Name & Bio */}
                          <div className="space-y-1">
                            <h4 className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight">
                              {lead.name}
                            </h4>
                            <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed font-sans">
                              {lead.bio}
                            </p>
                          </div>

                          {/* Quick indicators (e.g. enriched status) */}
                          {lead.aiEnrichment && (
                            <div className="mt-2 text-[9px] bg-purple-500/15 border border-purple-500/20 rounded px-1.5 py-0.5 text-purple-300 w-max font-bold flex items-center gap-1">
                              <Sparkles size={8} className="text-purple-400 animate-spin" />
                              Wzbogacony AI
                            </div>
                          )}

                          {/* BOTTOM INTERACTIVE MIGRATION AREA */}
                          <div className="flex items-center justify-between border-t border-neutral-950 mt-3 pt-2.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                migrateStatus(lead.id, lead.status, 'backward');
                              }}
                              className="p-1 hover:bg-neutral-950 hover:text-white text-neutral-500 rounded transition-all cursor-pointer disabled:opacity-20"
                              disabled={column.key === PIPELINE_COLUMNS[0].key}
                              title="Cofnij do poprzedniego etapu"
                            >
                              <ArrowLeft size={11} />
                            </button>
                            
                            <span className="text-[9px] text-neutral-600 font-bold uppercase select-none">Zarządzaj</span>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                migrateStatus(lead.id, lead.status, 'forward');
                              }}
                              className="p-1 hover:bg-neutral-950 hover:text-white text-neutral-500 rounded transition-all cursor-pointer disabled:opacity-20"
                              disabled={column.key === PIPELINE_COLUMNS[PIPELINE_COLUMNS.length - 1].key}
                              title="Przesuń dalej"
                            >
                              <ArrowRight size={11} />
                            </button>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TABS 2: LEAD MAGNET CREATOR */}
      {activeTab === 'magnet' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-6">
            <h3 className="text-lg font-medium text-white mb-4 border-b border-neutral-800 pb-2 flex items-center gap-2">
              <Magnet size={18} className="text-rose-400" />
              Złap Leada & Generuj E-book
            </h3>
            <p className="text-sm text-neutral-400 mb-6">
              Symulacja frontu, który widzi Twój klient. Podaje maila i główny ból, a zestaw robotów "M-Bot" natychmiast kreuje rozwiązanie i wysyła je przez Google Workspace.
            </p>

            <div className="space-y-4">
              {errorMessage && (
                <div className="bg-red-500/10 border border-red-500/50 p-3 rounded-lg text-red-500 text-sm">
                  {errorMessage}
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">E-mail Klienta</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="klient@startup.com"
                  className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                  disabled={generating || success}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Z czym klient ma TERAZ największy problem? (Pain point)</label>
                <textarea 
                  value={pain}
                  onChange={(e) => setPain(e.target.value)}
                  placeholder="Od trzech miesięcy tracimy klientów po rejestracji, onboarding ssie..."
                  rows={3}
                  className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-text-white custom-scrollbar"
                  disabled={generating || success}
                />
              </div>
              
              <button 
                onClick={handleCaptureLead}
                disabled={generating || success || !email || !pain}
                className={`w-full py-3 text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  success ? 'bg-emerald-600 text-white' : 'bg-rose-600 hover:bg-rose-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white shadow-[0_0_20px_rgba(225,29,72,0.3)]'
                }`}
              >
                {generating ? <Zap className="animate-spin text-white" size={18} /> : success ? <Mail size={18} /> : <Bot size={18} />}
                {generating ? 'Generowanie strategicznego planu B2B...' : success ? 'E-book wysłany na skrzynkę!' : 'Złap Leada przez AI Magnet'}
              </button>
            </div>
            
            <AnimatePresence>
               {generating && (
                 <motion.div 
                   initial={{ opacity: 0, height: 0 }}
                   animate={{ opacity: 1, height: 'auto' }}
                   exit={{ opacity: 0, height: 0 }}
                   className="mt-4 p-4 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-neutral-400"
                 >
                   <div className="flex items-center gap-2 mb-2 text-rose-400"><Bot size={14} /> Agent A: Rozczytywanie problemu...</div>
                   <div className="flex items-center gap-2 mb-2 text-amber-400"><Bot size={14} /> Agent B: Draftowanie spisu treści i struktury...</div>
                   <div className="flex items-center gap-2 text-emerald-400"><Bot size={14} /> Agent C: Budowanie szablonu HTML i wysyłka do {email}</div>
                 </motion.div>
               )}
            </AnimatePresence>
          </div>

          <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-6">
             <h3 className="text-md font-bold text-white mb-2 flex items-center gap-2">
               <Activity size={18} className="text-emerald-500" />
               Analizy i Konwersje
             </h3>
             <p className="text-xs text-neutral-500 mb-6 leading-relaxed">
               System monitoruje konwersję generowanych zajączków z postów na blogach lub LinkedIn w czasie rzeczywistym.
             </p>
             <div className="space-y-4">
               <div className="flex justify-between items-center p-3.5 bg-neutral-950 rounded-xl border border-neutral-850">
                 <div>
                    <h4 className="text-xs font-bold text-gray-200">Wysłane personalne e-booki: 41</h4>
                    <p className="text-[10px] text-neutral-500 mt-1">Konwersja na spotkanie demo: 22.8%</p>
                 </div>
                 <div className="text-emerald-500 font-bold text-sm">+315%</div>
               </div>

               <div className="flex justify-between items-center p-3.5 bg-neutral-950 rounded-xl border border-neutral-850">
                 <div>
                    <h4 className="text-xs font-bold text-gray-200">Unikalne odczyty: 84%</h4>
                    <p className="text-[10px] text-neutral-500 mt-1">Czas wygenerowania średnio: 4.2 sek</p>
                 </div>
                 <div className="text-purple-400 font-bold text-sm">Bardzo wysoki</div>
               </div>
             </div>
          </div>
        </div>
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
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLeadId(null)}
              className="fixed inset-0 bg-black z-50 cursor-pointer"
            />

            {/* Cabinet Drawer panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full sm:w-[500px] bg-neutral-950 border-l border-neutral-850 z-50 p-6 overflow-y-auto shadow-2xl flex flex-col justify-between"
            >
              <div>
                {/* Drawer Header */}
                <div className="flex items-center justify-between border-b border-neutral-900 pb-4 mb-5">
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-neutral-900 border border-neutral-805 text-emerald-400 rounded-lg">
                      <Flame size={18} />
                    </span>
                    <div>
                      <h2 className="text-md font-bold text-white tracking-wide uppercase">Szczegóły Leada PRO</h2>
                      <div className="text-[10px] text-neutral-500 font-mono">ID: {selectedLead.id}</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedLeadId(null)}
                    className="p-1.5 hover:bg-neutral-900 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Main Card info */}
                <div className="space-y-5">
                  
                  {/* Lead Title Block */}
                  <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-850">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <span className="text-[9px] bg-neutral-950 border border-neutral-850 px-2 py-0.5 rounded text-neutral-400 font-bold uppercase tracking-wide">
                          {selectedLead.source}
                        </span>
                        <h3 className="text-md font-extrabold text-white uppercase tracking-tight mt-1">{selectedLead.name}</h3>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-[10px] text-neutral-500">Kwalifikacja AI</div>
                        <div className={`text-xs font-bold px-2.5 py-1 rounded mt-1 inline-block ${
                          selectedLead.isHighTicket 
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}>
                          {selectedLead.isHighTicket ? "TAK (High-Ticket)" : "NIE (Low-Quality)"}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 text-xs text-neutral-300 font-sans leading-relaxed bg-black/40 p-3 rounded-lg border border-neutral-950">
                      <strong>Bio profilowe:</strong><br />
                      <span className="block mt-1 font-mono text-[11px] text-neutral-400">{selectedLead.bio}</span>
                    </div>

                    {/* Quick status selector */}
                    <div className="mt-3.5 pt-3 border-t border-neutral-950 flex items-center justify-between">
                      <span className="text-[10px] text-neutral-500 uppercase font-bold">Etap lejka:</span>
                      <select 
                        value={selectedLead.status}
                        onChange={(e) => {
                          const value = e.target.value;
                          selectStatus(selectedLead.id, value);
                        }}
                        className="bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-xs text-neutral-300 focus:outline-none focus:border-emerald-500"
                      >
                        {PIPELINE_COLUMNS.map(col => (
                          <option key={col.key} value={col.key}>{col.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* B2B Pitch-Card Automation Generator Zone */}
                    <div className="mt-3.5 pt-3.5 border-t border-neutral-950 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest flex items-center gap-1">
                          <Zap size={10} className="text-amber-400" />
                          OFERTA HANDLOWA B2B
                        </span>
                        {selectedLead.pitchCard ? (
                          <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-extrabold uppercase font-mono">
                            READY (PITCH-CARD)
                          </span>
                        ) : (
                          <span className="text-[9px] bg-neutral-950 text-neutral-500 border border-neutral-850 px-2 py-0.5 rounded font-bold uppercase font-mono">
                            BRAK
                          </span>
                        )}
                      </div>

                      {!selectedLead.pitchCard ? (
                        <button
                          type="button"
                          onClick={() => triggerPitchCardGeneration(selectedLead.id)}
                          disabled={isGeneratingPitchCard}
                          className="w-full py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:via-teal-500 hover:to-indigo-500 leading-snug text-white text-xs font-black rounded-lg transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] cursor-pointer disabled:opacity-50"
                        >
                          {isGeneratingPitchCard ? (
                            <RefreshCw size={12} className="animate-spin text-emerald-100" />
                          ) : (
                            <Sparkles size={12} className="text-emerald-200" />
                          )}
                          Przygotuj Dedykowany Pitch-Card
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setShowPitchCardModal(true)}
                            className="flex-1 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.25)] cursor-pointer"
                          >
                            <FileText size={13} />
                            Otwórz Pitch-Card
                          </button>
                          <button
                            type="button"
                            onClick={() => triggerPitchCardGeneration(selectedLead.id)}
                            disabled={isGeneratingPitchCard}
                            title="Przebuduj Pitch-Card z nową analizą Gemini"
                            className="px-2.5 py-2 bg-neutral-900 hover:bg-neutral-850 hover:text-white border border-neutral-800 rounded-lg text-neutral-400 flex items-center justify-center transition-all cursor-pointer"
                          >
                            {isGeneratingPitchCard ? (
                              <RefreshCw size={12} className="animate-spin" />
                            ) : (
                              <RefreshCw size={12} />
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* B2B Tactical Battle Brief Section */}
                    {militaryModeEnabled && (
                      <div className="mt-3.5 pt-3.5 border-t border-rose-950/40 bg-rose-950/5 p-3 rounded-xl border border-rose-950/20 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-rose-400 uppercase font-black tracking-widest flex items-center gap-1.5 font-mono">
                            <Crosshair size={11} className="text-rose-500 animate-pulse" />
                            ODPRAWA WOJSKOWA (SDR)
                          </span>
                          {selectedLead.tacticalBrief ? (
                            <span className="text-[9px] bg-rose-500/15 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded font-extrabold uppercase font-mono">
                              BATTLE READY
                            </span>
                          ) : (
                            <span className="text-[9px] bg-neutral-950 text-neutral-600 border border-neutral-900 px-2 py-0.5 rounded font-bold uppercase font-mono">
                              BRAK
                            </span>
                          )}
                        </div>

                        {!selectedLead.tacticalBrief ? (
                          <button
                            type="button"
                            onClick={() => triggerTacticalBriefGeneration(selectedLead.id)}
                            disabled={isGeneratingTacticalBrief}
                            className="w-full py-2 bg-gradient-to-r from-rose-700 via-red-700 to-amber-700 hover:from-rose-600 hover:via-red-600 hover:to-amber-600 text-white text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(244,63,94,0.15)] hover:shadow-[0_0_20px_rgba(244,63,94,0.35)] cursor-pointer disabled:opacity-50"
                          >
                            {isGeneratingTacticalBrief ? (
                              <RefreshCw size={12} className="animate-spin text-rose-100" />
                            ) : (
                              <Shield size={12} className="text-rose-200" />
                            )}
                            Uzbrój Odprawę Bojową
                          </button>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setShowTacticalBriefModal(true)}
                              className="flex-1 py-1.5 bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-400 hover:to-red-400 text-black font-extrabold text-[11px] rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(239,68,68,0.25)] cursor-pointer"
                            >
                              <Target size={12} className="text-black" />
                              Otwórz Battlecard (HUD)
                            </button>
                            <button
                              type="button"
                              onClick={() => triggerTacticalBriefGeneration(selectedLead.id)}
                              disabled={isGeneratingTacticalBrief}
                              title="Przebuduj odprawę taktyczną"
                              className="px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-850 hover:text-white border border-neutral-800 rounded-lg text-neutral-400 flex items-center justify-center transition-all cursor-pointer"
                            >
                              {isGeneratingTacticalBrief ? (
                                <RefreshCw size={12} className="animate-spin text-rose-500" />
                              ) : (
                                <RefreshCw size={12} />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* PRO Multi-tab header inside Drawer */}
                  <div className="flex bg-neutral-950 border border-neutral-850 rounded-xl p-1 mb-2">
                    <button
                      type="button"
                      onClick={() => setDrawerTab('profil')}
                      className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        drawerTab === 'profil'
                          ? 'bg-neutral-900 border border-neutral-800 text-purple-400 font-extrabold shadow'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Bot size={13} className={drawerTab === 'profil' ? 'text-purple-400' : 'text-neutral-500'} /> Profil i Analiza
                    </button>
                    <button
                      type="button"
                      onClick={() => setDrawerTab('sekwencja')}
                      className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        drawerTab === 'sekwencja'
                          ? 'bg-neutral-900 border border-neutral-800 text-indigo-400 font-extrabold shadow'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <ClipboardList size={13} className={drawerTab === 'sekwencja' ? 'text-indigo-400' : 'text-neutral-500'} /> Sekwencja DM
                    </button>
                    <button
                      type="button"
                      onClick={() => setDrawerTab('symulator')}
                      className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        drawerTab === 'symulator'
                          ? 'bg-neutral-900 border border-neutral-800 text-emerald-400 font-extrabold shadow'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <MessageSquare size={13} className={drawerTab === 'symulator' ? 'text-emerald-400' : 'text-neutral-500'} /> Symulator AI
                    </button>
                  </div>

                  {/* TAB 1: PROFIL I ANALIZA */}
                  {drawerTab === 'profil' && (
                    <motion.div
                      key="tab-profil"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      {/* Automatic Draft Message Block */}
                      <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-850 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-bold text-white flex items-center gap-1.5 uppercase">
                            <Mail size={13} className="text-emerald-400" />
                            AI Draft Message (Wiadomość DM)
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopyText(selectedLead.draftMessage, `draft-${selectedLead.id}`)}
                            className="px-2 py-1 bg-neutral-950 hover:bg-black text-[10px] font-bold text-neutral-400 hover:text-white border border-neutral-800 rounded transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            {copiedId === `draft-${selectedLead.id}` ? <Check size={10} className="text-emerald-400" /> : <Clipboard size={10} />}
                            Kopiuj
                          </button>
                        </div>
                        <div className="bg-black text-neutral-300 text-xs font-mono p-3.5 rounded-lg border border-neutral-950 whitespace-pre-wrap leading-relaxed select-all">
                          {selectedLead.draftMessage}
                        </div>
                      </div>

                      {/* AI ENRICHMENT ZONE (GEMINI ENGINE) */}
                      <div className="bg-neutral-900 border border-neutral-850 rounded-xl p-4 space-y-4">
                        <div className="flex items-center justify-between border-b border-neutral-950 pb-2">
                          <div className="flex items-center gap-1.5">
                            <Bot size={15} className="text-purple-400" />
                            <span className="text-xs font-bold text-purple-300 uppercase tracking-widest">Wzbogacenie profilu AI</span>
                          </div>
                          {selectedLead.aiEnrichment && (
                            <span className="text-[9px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/20 font-bold uppercase">
                              Aktywne
                            </span>
                          )}
                        </div>

                        {!selectedLead.aiEnrichment ? (
                          <div className="space-y-3 py-2 text-center sm:text-left">
                            <div className="flex gap-2 items-start justify-center sm:justify-start">
                              <Info size={16} className="text-purple-400 shrink-0 mt-0.5" />
                              <p className="text-xs text-neutral-400 leading-relaxed max-w-sm">
                                Profil nie posiada jeszcze pogłębionej analizy. Uruchom generator Gemini, aby przygotować Icebreakery, oszacować finanse oraz wyprzedzić obiekcje!
                              </p>
                            </div>
                            
                            <button
                              type="button"
                              onClick={() => triggerAIEnrichment(selectedLead.id)}
                              disabled={isEnriching}
                              className="w-full py-2.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(109,40,217,0.35)] cursor-pointer"
                            >
                              <Sparkles size={14} className="animate-spin text-purple-200" />
                              Wzbogać profil przez AI
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {/* Budget potential */}
                            <div className="flex items-center justify-between bg-black/40 border border-neutral-950 p-2.5 rounded-lg text-xs">
                              <span className="text-neutral-500 font-bold">Szacowany potencjał budżetowy:</span>
                              <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                selectedLead.aiEnrichment.budgetPotential === 'wysoki' 
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                  : selectedLead.aiEnrichment.budgetPotential === 'średni'
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              }`}>
                                {selectedLead.aiEnrichment.budgetPotential}
                              </span>
                            </div>

                            {/* Icebreakers */}
                            <div className="space-y-2">
                              <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">3 Sugerowane Icebreakery:</div>
                              <ul className="space-y-2">
                                {selectedLead.aiEnrichment.icebreakers.map((ice, i) => (
                                  <li key={i} className="bg-black/35 p-2 rounded-lg border border-neutral-950 flex items-start gap-2 text-xs text-neutral-300 font-sans">
                                    <span className="text-purple-400 font-bold font-mono">#{i + 1}</span>
                                    <span className="leading-relaxed">{ice}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Objections accordion style list */}
                            <div className="space-y-2 pt-2 border-t border-neutral-950">
                              <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1 text-rose-400">
                                <AlertTriangle size={11} />
                                Obiekcje i gotowe riposty:
                              </div>
                              <div className="space-y-2.5">
                                {selectedLead.aiEnrichment.objections.map((obj, i) => (
                                  <div key={i} className="bg-black/40 border border-neutral-950 rounded-lg p-3 space-y-1.5">
                                    <div className="text-[11px] font-bold text-rose-300">
                                      <strong>Pytanie/Obiekcja:</strong> "{obj.objection}"
                                    </div>
                                    <div className="text-xs text-neutral-400 pl-3 border-l-2 border-emerald-500 italic leading-relaxed">
                                      <strong>Zbijanie (Riposta):</strong> "{obj.riposte}"
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Re-trigger enrichment button */}
                            <button
                              type="button"
                              onClick={() => triggerAIEnrichment(selectedLead.id)}
                              disabled={isEnriching}
                              className="w-full mt-2 py-1.5 bg-neutral-950 hover:bg-black border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white text-[10px] font-bold rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <RefreshCw size={10} className={isEnriching ? "animate-spin" : ""} />
                              Zaktualizuj analizę proflową
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* TAB 2: STRATEGIC MESSAGE SEQUENCES */}
                  {drawerTab === 'sekwencja' && (
                    <motion.div
                      key="tab-sekwencja"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      {!selectedLead.dmSequence ? (
                        <div className="bg-neutral-900 border border-neutral-850 p-6 rounded-xl text-center space-y-4">
                          <div className="mx-auto w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                            <ClipboardList size={22} />
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Strategiczny Plan Kampanii (4 Etapy)</h3>
                            <p className="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed font-sans">
                              Gemini przeanalizuje bio handlowe, platformę {selectedLead.source} i cel nadrzędny, aby rozpisać 4 precyzyjne kroki wiadomości bezpośrednich na kalendarzu czasowym.
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => triggerAISequence(selectedLead.id)}
                            disabled={isGeneratingSequence}
                            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg shadow-lg shadow-indigo-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                          >
                            {isGeneratingSequence ? (
                              <RefreshCw size={13} className="animate-spin" />
                            ) : (
                              <Sparkles size={13} />
                            )}
                            Wygeneruj Sekwencję Kampanii DM
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex justify-between items-center text-xs pb-1 border-b border-neutral-900">
                            <span className="text-neutral-500 font-bold uppercase tracking-wider">SDR Sequence (4 Steps)</span>
                            <span className="bg-indigo-500/10 text-indigo-400 px-2.5 py-0.5 rounded text-[10px] font-bold border border-indigo-500/20">AKTYWNA</span>
                          </div>

                          <div className="space-y-4 relative pl-3 border-l border-neutral-850 w-full mt-2">
                            {selectedLead.dmSequence.map((step) => (
                              <div key={step.step} className="space-y-2 relative">
                                {/* Bullet indicator on timeline */}
                                <span className="absolute -left-[16.5px] top-1.5 w-2 h-2 rounded-full border border-indigo-500 bg-black" />
                                
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <span className="bg-indigo-950 border border-indigo-500/30 text-indigo-300 text-[9px] px-1.5 py-0.5 rounded font-extrabold font-mono">
                                      {step.delay}
                                    </span>
                                    <span className="text-xs font-bold text-white font-sans uppercase tracking-tight">
                                      {step.label}
                                    </span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleCopyText(step.text, `step-${step.step}-${selectedLead.id}`)}
                                    className="px-2 py-0.5 bg-neutral-900 hover:bg-neutral-850 hover:text-white border border-neutral-800 rounded text-[9px] font-bold text-neutral-400 flex items-center gap-1 transition-colors cursor-pointer"
                                  >
                                    {copiedId === `step-${step.step}-${selectedLead.id}` ? (
                                      <Check size={9} className="text-emerald-400" />
                                    ) : (
                                      <Clipboard size={10} />
                                    )}
                                    Kopiuj
                                  </button>
                                </div>

                                <div className="bg-black text-neutral-300 text-xs font-mono p-3 rounded-lg border border-neutral-950 whitespace-pre-wrap leading-relaxed select-all">
                                  {step.text}
                                </div>
                              </div>
                            ))}
                          </div>

                          <button
                            type="button"
                            onClick={() => triggerAISequence(selectedLead.id)}
                            disabled={isGeneratingSequence}
                            className="w-full mt-2 py-1.5 bg-neutral-950 hover:bg-black border border-neutral-850 hover:border-neutral-800 text-neutral-400 hover:text-white text-[10px] font-bold rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <RefreshCw size={10} className={isGeneratingSequence ? "animate-spin" : ""} />
                            Przebuduj sekwencję (Odśwież)
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* TAB 3: CONVERSATION SIMULATOR & VIRTUAL TRAINER */}
                  {drawerTab === 'symulator' && (
                    <motion.div
                      key="tab-symulator"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div className="bg-neutral-900/40 p-3 rounded-xl border border-neutral-850 text-xs">
                        <div className="flex gap-2 items-start text-neutral-400 leading-relaxed font-sans">
                          <GraduationCap size={16} className="text-emerald-400 shrink-0 mt-0.5 animate-bounce" />
                          <p>
                            <strong>Symulator Sandbox:</strong> Gemini symuluje odczytaną osobowość handlową leada. Po każdej wiadomości Senior Coach oceni Twoją skuteczność w skali 1-10 i da precyzyjną poradę taktyczną!
                          </p>
                        </div>
                      </div>

                      {/* Chat area */}
                      <div className="border border-neutral-850 bg-black rounded-xl p-3 h-[280px] overflow-y-auto flex flex-col gap-3 custom-scrollbar">
                        {localChat.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full text-center p-4 space-y-2">
                            <span className="p-3 bg-neutral-900 border border-neutral-850 rounded-full text-neutral-500">
                              <MessageSquare size={18} />
                            </span>
                            <div className="text-xs font-bold text-neutral-300 uppercase">Brak wiadomości</div>
                            <p className="text-[10px] text-neutral-500 max-w-[240px] leading-relaxed font-sans">
                              Wpisz u dołu wiadomość zaczepną lub propozycyjną, aby przetestować asertywność klienta {selectedLead.name}.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3.5">
                            {localChat.map((msg, idx) => (
                              <div key={idx} className="space-y-1.5">
                                <div className={`flex ${msg.sender === 'seller' ? 'justify-end' : 'justify-start'}`}>
                                  <div className={`max-w-[85%] text-xs px-3.5 py-2 rounded-xl text-neutral-200 leading-relaxed font-sans ${
                                    msg.sender === 'seller'
                                      ? 'bg-neutral-900 border border-neutral-800 rounded-tr-none'
                                      : 'bg-emerald-950/20 border border-emerald-500/20 rounded-tl-none'
                                  }`}>
                                    <div className="text-[9px] text-neutral-500 font-bold mb-1 uppercase tracking-tight font-mono">
                                      {msg.sender === 'seller' ? 'SDR (Ty)' : selectedLead.name}
                                    </div>
                                    <div className="font-sans text-[11.5px] leading-relaxed break-words">{msg.text}</div>
                                  </div>
                                </div>

                                {/* Trainer widget directly showing below the artificial lead answer bubble */}
                                {msg.sender === 'lead' && (msg.coachScore || msg.coachFeedback) && (
                                  <motion.div 
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-3 bg-purple-950/10 border border-purple-500/15 rounded-xl ml-2 max-w-[95%] space-y-1.5"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-1.5 text-[10px] text-purple-300 font-extrabold uppercase tracking-wide">
                                        <GraduationCap size={13} />
                                        Metryka Trenera
                                      </div>
                                      <div className="flex items-center gap-1 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full text-[10px] font-bold text-purple-300">
                                        <Award size={10} />
                                        Score: {msg.coachScore || "?"}/10
                                      </div>
                                    </div>
                                    <p className="text-[11px] text-neutral-400 pl-3 border-l-2 border-purple-500/35 italic font-sans leading-relaxed">
                                      "{msg.coachFeedback || "Świetna próba! Kontynuuj drążenie problemu klienta."}"
                                    </p>
                                  </motion.div>
                                )}
                              </div>
                            ))}

                            {isSendingChat && (
                              <div className="flex justify-start">
                                <div className="bg-neutral-900 border border-neutral-850 text-neutral-400 text-xs px-3 py-2 rounded-xl rounded-tl-none flex items-center gap-2 animate-pulse">
                                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce delay-75" />
                                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce delay-150" />
                                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce delay-300" />
                                  <span className="text-[10px] italic font-sans">{selectedLead.name} analizuje...</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Chat Input row */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={chatMessageText}
                          onChange={(e) => setChatMessageText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              sendSimulationMessage();
                            }
                          }}
                          disabled={isSendingChat}
                          placeholder={isSendingChat ? "SDR czeka..." : "Wpisz kolejną ripostę..."}
                          className="flex-1 bg-black border border-neutral-800 focus:border-emerald-500 text-white text-xs rounded-lg px-3 py-2 focus:outline-none placeholder-neutral-600 font-sans"
                        />
                        <button
                          type="button"
                          onClick={sendSimulationMessage}
                          disabled={isSendingChat || !chatMessageText.trim()}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-900 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:text-neutral-500"
                        >
                          Wyślij
                        </button>
                        <button
                          type="button"
                          onClick={clearSimulationChat}
                          title="Wyczyść historię konwersacji"
                          className="p-2 border border-neutral-800 hover:border-neutral-700 bg-neutral-950 hover:bg-neutral-900 text-neutral-400 hover:text-white rounded-lg transition-all cursor-pointer"
                        >
                          <RotateCcw size={14} />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Close Drawer button */}
              <div className="border-t border-neutral-900 pt-5 mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedLeadId(null)}
                  className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-bold text-neutral-300 rounded-lg transition-colors cursor-pointer"
                >
                  Zamknij widok szczegółów
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ============================================== */}
      {/* PRO MODAL: ADD MANUAL LEAD */}
      {/* ============================================== */}
      <AnimatePresence>
        {showAddLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddLead(false)}
              className="fixed inset-0 bg-black cursor-pointer"
            />
            
            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-neutral-950 border border-neutral-800 rounded-2xl w-full max-w-md p-6 relative shadow-2xl z-10 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-neutral-900">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
                    <Plus size={16} />
                  </span>
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Dodaj leada do Pipeline</h3>
                </div>
                <button 
                  onClick={() => setShowAddLead(false)}
                  className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleAddManualLead} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Imię i Nazwisko / Nazwa</label>
                  <input
                    type="text"
                    required
                    value={newLeadName}
                    onChange={(e) => setNewLeadName(e.target.value)}
                    placeholder="np. Robert Kubica"
                    className="w-full bg-black border border-neutral-700 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Platforma Źródłowa</label>
                  <select
                    value={newLeadSource}
                    onChange={(e) => setNewLeadSource(e.target.value)}
                    className="w-full bg-black border border-neutral-700 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-neutral-300 focus:outline-none"
                  >
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Facebook">Facebook</option>
                    <option value="E-mail">E-mail</option>
                    <option value="strony www">Strona WWW</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Bio / Opis / Kontekst zawodowy</label>
                  <textarea
                    required
                    value={newLeadBio}
                    onChange={(e) => setNewLeadBio(e.target.value)}
                    placeholder="np. Head of Sales w Tech-Startup. Skalujemy kampanie outbound..."
                    rows={4}
                    className="w-full bg-black border border-neutral-700 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-white focus:outline-none custom-scrollbar"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3 border-t border-neutral-900">
                  <button
                    type="button"
                    onClick={() => setShowAddLead(false)}
                    className="px-4 py-2 bg-neutral-900 border border-neutral-800 text-xs font-bold text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingLead}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                  >
                    {isCreatingLead ? <RefreshCw className="animate-spin" size={13} /> : <Plus size={13} />}
                    Stwórz Leada
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* B2B PREMIUM PITCH-CARD INTERACTIVE MODAL */}
        {showPitchCardModal && selectedLead && selectedLead.pitchCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPitchCardModal(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
            />

            {/* Premium Document Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-neutral-950 border border-neutral-800 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col relative shadow-[0_0_50px_rgba(16,185,129,0.15)] z-10 overflow-hidden"
            >
              {/* Top Bar */}
              <div className="flex items-center justify-between px-6 py-4 bg-black/50 border-b border-neutral-900">
                <div className="flex items-center gap-3">
                  <span className="p-2 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-400 rounded-xl border border-emerald-500/20">
                    <Sparkles size={16} />
                  </span>
                  <div>
                    <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest leading-none mb-1">Dedykowany B2B Pitch-Card</h3>
                    <div className="text-sm font-black text-white flex items-center gap-2">
                      <span>{selectedLead.pitchCard.companyName}</span>
                      <span className="text-neutral-400 bg-neutral-900 border border-neutral-850 text-[9px] px-2 py-0.5 rounded font-normal font-mono uppercase">
                        {selectedLead.pitchCard.leadName}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedLead.pitchCard!.htmlEmailTemplate);
                      toast.success("Skopiowano kod HTML do schowka! Możesz wkleić go bezpośrednio jako treść maila.");
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-950/40"
                  >
                    <Clipboard size={12} />
                    Kupiuj Mail HTML
                  </button>

                  <button
                    onClick={() => {
                      const pc = selectedLead.pitchCard!;
                      const fileContent = `===========================================================
             INDYWIDUALNA OFERTA WDROŻENIA AUTOMATYZACJI AI
===========================================================
KLIENT: ${pc.leadName}
FIRMA: ${pc.companyName}
DATA PRZYGOTOWANIA: ${new Date().toLocaleDateString('pl-PL')}

-----------------------------------------------------------
1. GŁÓWNE WYZWANIA BRANŻOWE KLIENTA:
-----------------------------------------------------------
${pc.industryChallenges.map((challengeItem, i) => `${i + 1}. [Wyzwanie] ${challengeItem}`).join('\n')}

-----------------------------------------------------------
2. PROPONOWANE SCHEMATY AUTOMATYZACJI:
-----------------------------------------------------------
${pc.proposedSolutions.map((solutionItem, i) => `${i + 1}. [Wdrożenie] ${solutionItem}`).join('\n')}

-----------------------------------------------------------
3. SZACOWANY ZWROT Z INWESTYCJI (ESTIMATED ROI):
-----------------------------------------------------------
* Zaoszczędzony czas pracy zespołu: ${pc.estimatedRoi.timeSavedHours}
* Procentowa redukcja kosztów:    ${pc.estimatedRoi.costReductionPct}
* Szacowany okres zwrotu:         ${pc.estimatedRoi.paybackMonths}
* Roczny ekwiwalent finansowy:    ${pc.estimatedRoi.financialGain}

-----------------------------------------------------------
4. PLAN HARMONOGRAMU WDROŻENIOWEGO:
-----------------------------------------------------------
${pc.timeline.map(timelineItem => `* ${timelineItem.milestone} (${timelineItem.duration})
  -> ${timelineItem.description}`).join('\n\n')}

-----------------------------------------------------------
GENEROWANO PRZEZ AUTOMAT CRM ZAPALNIK.PL - TWÓJ ROZRUCH B2B
===========================================================`;

                      const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `Pitch-Card_${pc.companyName.replace(/\s+/g, '_')}.txt`;
                      link.click();
                      URL.revokeObjectURL(url);
                      toast.success("Pomyślnie pobrano One-Pager jako plik .txt");
                    }}
                    className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-850 text-neutral-300 hover:text-white border border-neutral-800 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download size={12} />
                    Pobierz One-Pager
                  </button>

                  <button
                    onClick={() => setShowPitchCardModal(false)}
                    className="p-1.5 hover:bg-neutral-900 border border-neutral-900 hover:border-neutral-800 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Modal Body Panel */}
              <div className="flex-1 flex overflow-hidden">
                {/* Left side: Premium Document Container */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-black/20 custom-scrollbar space-y-8">
                  
                  {/* Premium Document Brand Header */}
                  <div className="p-8 bg-neutral-950 border border-neutral-900 rounded-2xl relative overflow-hidden space-y-4">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-3xl rounded-full" />
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-500 font-extrabold text-sm tracking-tighter">ZAPALNIK</span>
                        <span className="text-[9px] bg-neutral-900 text-neutral-500 border border-neutral-850 px-2 py-0.5 rounded font-mono">B2B INBOUND ENGINE</span>
                      </div>
                      <span className="text-xs text-neutral-500 font-mono">ID: PC-{selectedLead.id}</span>
                    </div>

                    <div className="space-y-1">
                      <h1 className="text-xl font-black text-white tracking-tight uppercase">INDYWIDUALNY DESIGN OFERTY B2B</h1>
                      <p className="text-xs text-neutral-400">
                        Strategiczne studium operacyjne systemów automatyzacji i integracji AI dla: <strong className="text-white">{selectedLead.pitchCard.companyName}</strong>
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-900 text-xs text-neutral-400">
                      <div>
                        <div className="text-neutral-500 text-[10px] uppercase font-bold mb-0.5">Inżynier Kontaktu</div>
                        <div className="font-bold text-neutral-300">ZAPALNIK CRM Automations</div>
                      </div>
                      <div>
                        <div className="text-neutral-500 text-[10px] uppercase font-bold mb-0.5">Adresat Oferty</div>
                        <div className="font-bold text-emerald-400">{selectedLead.pitchCard.leadName}</div>
                      </div>
                    </div>
                  </div>

                  {/* Bento Scoreboard: ROI metrics */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] text-neutral-500 uppercase tracking-widest font-black flex items-center gap-1.5 font-mono">
                      <TrendingUp size={12} className="text-emerald-400" />
                      PROGNOZOWANY ZWROT Z INWESTYCJI (KPI & ROI)
                    </h4>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-4 text-center space-y-1 hover:border-neutral-800 transition-colors">
                        <div className="mx-auto w-7 h-7 bg-emerald-500/10 text-emerald-400 rounded-lg flex items-center justify-center">
                          <Clock size={14} />
                        </div>
                        <div className="text-lg font-black text-white tracking-tight mt-1">{selectedLead.pitchCard.estimatedRoi.timeSavedHours}</div>
                        <div className="text-[9px] text-neutral-500 uppercase font-bold">Wolny czas / mc</div>
                      </div>

                      <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-4 text-center space-y-1 hover:border-neutral-800 transition-colors">
                        <div className="mx-auto w-7 h-7 bg-indigo-500/10 text-indigo-400 rounded-lg flex items-center justify-center">
                          <Activity size={14} />
                        </div>
                        <div className="text-lg font-black text-white tracking-tight mt-1">{selectedLead.pitchCard.estimatedRoi.costReductionPct}</div>
                        <div className="text-[9px] text-neutral-500 uppercase font-bold">Redukcja kosztów procesu</div>
                      </div>

                      <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-4 text-center space-y-1 hover:border-neutral-800 transition-colors">
                        <div className="mx-auto w-7 h-7 bg-amber-500/10 text-amber-500 rounded-lg flex items-center justify-center">
                          <RefreshCw size={14} />
                        </div>
                        <div className="text-lg font-black text-white tracking-tight mt-1">{selectedLead.pitchCard.estimatedRoi.paybackMonths}</div>
                        <div className="text-[9px] text-neutral-500 uppercase font-bold">Okres zwrotu (Payback)</div>
                      </div>

                      <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-4 text-center space-y-1 hover:border-neutral-800 transition-colors">
                        <div className="mx-auto w-7 h-7 bg-teal-500/10 text-teal-400 rounded-lg flex items-center justify-center">
                          <Coins size={14} />
                        </div>
                        <div className="text-lg font-black text-emerald-400 tracking-tight mt-1">{selectedLead.pitchCard.estimatedRoi.financialGain}</div>
                        <div className="text-[9px] text-neutral-500 uppercase font-bold">Ekwiwalent roczny</div>
                      </div>
                    </div>
                  </div>

                  {/* Operational Challenges vs Automated Solutions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Industry Challenges */}
                    <div className="bg-neutral-950 p-5 rounded-xl border border-neutral-900 space-y-3.5">
                      <h4 className="text-xs font-extrabold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-neutral-900 pb-2">
                        <AlertTriangle size={13} className="text-rose-400" />
                        Zidentyfikowane Wyzwania Operacyjne
                      </h4>
                      <ul className="space-y-3">
                        {selectedLead.pitchCard.industryChallenges.map((challenge, index) => (
                          <li key={index} className="flex gap-2 text-xs leading-relaxed text-neutral-300">
                            <span className="text-rose-400 font-bold shrink-0 font-mono mt-0.5">{index + 1}.</span>
                            <span>{challenge}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Proposed Automations */}
                    <div className="bg-neutral-950 p-5 rounded-xl border border-neutral-900 space-y-3.5">
                      <h4 className="text-xs font-extrabold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-neutral-900 pb-2">
                        <Zap size={13} className="text-emerald-400" />
                        Planowana Architektura Automatyzacji
                      </h4>
                      <ul className="space-y-3">
                        {selectedLead.pitchCard.proposedSolutions.map((solution, index) => (
                          <li key={index} className="flex gap-2 text-xs leading-relaxed text-neutral-300">
                            <span className="text-emerald-400 font-bold shrink-0 font-mono mt-0.5">{index + 1}.</span>
                            <span>{solution}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Horizontal Timeline Block */}
                  <div className="space-y-3.5">
                    <h4 className="text-[10px] text-neutral-500 uppercase tracking-widest font-black flex items-center gap-1.5 font-mono">
                      <Briefcase size={12} className="text-indigo-400" />
                      DEDYKOWANY HARMONOGRAM WDROŻENIA (PLAN ROZWOJU)
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {selectedLead.pitchCard.timeline.map((item, index) => (
                        <div key={index} className="bg-neutral-950 border border-neutral-900 rounded-xl p-4 relative space-y-2 hover:border-neutral-800 transition-colors">
                          <div className="flex items-center justify-between border-b border-neutral-900 pb-1.5">
                            <span className="text-[9px] font-bold text-indigo-400 font-mono bg-indigo-505/10">{item.duration}</span>
                            <span className="text-[8px] bg-neutral-900 border border-neutral-850 text-neutral-500 px-1.5 py-0.5 rounded font-bold font-mono">
                              FAZA {index + 1}
                            </span>
                          </div>
                          <h5 className="text-xs font-black text-white mt-1 leading-snug">{item.milestone}</h5>
                          <p className="text-[10px] text-neutral-400 leading-relaxed font-sans">{item.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Right side: HTML Email template viewer with live frame rendering */}
                <div className="w-80 border-l border-neutral-900 bg-neutral-950/20 flex flex-col overflow-hidden">
                  <div className="px-4 py-3 bg-neutral-950 border-b border-neutral-900 flex items-center justify-between">
                    <span className="text-[9px] text-neutral-400 font-black uppercase tracking-widest">Szablon Mailingowy</span>
                    <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded font-mono font-bold">
                      HTML READY
                    </span>
                  </div>

                  <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar">
                    <div className="text-[11px] text-neutral-400 leading-normal space-y-2 pb-2">
                      <p>Dołączony kod HTML zawiera pełen zestaw stylów inline CSS zintegrowanych bezpośrednio z elementami, co zapewnia bezproblemowe renderowanie w każdej popularnej poczcie (np. Gmail, Outlook).</p>
                      <p>Możesz go użyć jako spersonalizowaną ofertę handlową o bezkompromisowej konwersji.</p>
                    </div>

                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedLead.pitchCard!.htmlEmailTemplate);
                        toast.success("Skopiowano szablon HTML (inline CSS) do schowka!");
                      }}
                      className="w-full py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-950/30 font-sans"
                    >
                      <Clipboard size={12} />
                      Skopiuj Kod HTML Maila
                    </button>

                    <div className="border border-neutral-850 rounded-xl p-3 bg-black space-y-1.5">
                      <div className="text-[9px] text-neutral-500 uppercase font-bold font-mono border-b border-neutral-900 pb-1 flex items-center justify-between">
                        <span>Podgląd mini-kodu</span>
                        <span>HTML</span>
                      </div>
                      <pre className="text-[9px] font-mono text-neutral-500 overflow-x-auto whitespace-pre-wrap max-h-40 custom-scrollbar select-all">
                        {selectedLead.pitchCard.htmlEmailTemplate.substring(0, 400)}...
                      </pre>
                    </div>

                    <div className="pt-2">
                      <div className="bg-neutral-900 rounded-lg p-3 border border-neutral-850 text-[10px] text-neutral-400 leading-normal space-y-1">
                        <strong className="text-neutral-300">Wskazówka taktyczna:</strong>
                        <p>Skopiuj kod i wyślij go do klienta zaraz po kwalifikującej rozmowie, aby błyskawicznie "domknąć" obiekcje wyliczeniem ROI i profesjonalną strukturą harmonogramu.</p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}

        {/* B2B MILITARY-GRADE TACTICAL BRIEF BATTLECARD (HUD) */}
        {showTacticalBriefModal && selectedLead && selectedLead.tacticalBrief && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop with extreme military grid feel */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.85 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTacticalBriefModal(false)}
              className="fixed inset-0 bg-neutral-950/90 backdrop-blur-md cursor-pointer"
            />

            {/* Premium Military Battlecard HUD Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-neutral-950 border-2 border-rose-950/60 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col relative shadow-[0_0_60px_rgba(244,63,94,0.15)] z-10 overflow-hidden font-sans"
            >
              {/* Tactical Grid Background Overlay */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(120,40,40,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(120,40,40,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

              {/* Top Header Panel (Mission Command) */}
              <div className="flex items-center justify-between px-6 py-4 bg-rose-950/10 border-b-2 border-rose-950/40 relative z-10">
                <div className="flex items-center gap-3">
                  <span className="p-2 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.2)]">
                    <Crosshair size={18} className="animate-spin text-rose-500 [animation-duration:10s]" />
                  </span>
                  <div>
                    <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.25em] leading-none mb-1 font-mono flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
                      TACTICAL BATTLE BREEF / SDR BATTLECARD
                    </h3>
                    <div className="text-sm font-black text-white flex items-center gap-2">
                      <span className="tracking-wide">{selectedLead.name}</span>
                      <span className="text-rose-400 bg-rose-950/40 border border-rose-800/40 text-[9px] px-2 py-0.5 rounded font-bold font-mono tracking-wider">
                        STATUS: ACTIVE MISSION
                      </span>
                    </div>
                  </div>
                </div>

                {/* Operations Commands */}
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => {
                      const tb = selectedLead.tacticalBrief!;
                      const scriptText = `FAZA 1 (HAK): ${tb.opScript.phase1Hook}\n\nFAZA 2 (BÓL): ${tb.opScript.phase2Pain}\n\nFAZA 3 (DOWÓD): ${tb.opScript.phase3Proof}\n\nFAZA 4 (CTA): ${tb.opScript.phase4Cta}`;
                      navigator.clipboard.writeText(scriptText);
                      toast.success("Skopiowano scenariusz ataku (Op-Script) do schowka! Ruszaj do walki.");
                    }}
                    className="px-3.5 py-2 bg-rose-900/20 hover:bg-rose-900/40 text-rose-400 border border-rose-800/40 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-md font-mono"
                  >
                    <Clipboard size={12} />
                    SKOPIUJ OP-SCRIPT
                  </button>

                  <button
                    onClick={() => {
                      const tb = selectedLead.tacticalBrief!;
                      const fileContent = `===========================================================
             B2B SDR COMMAND TACTICAL BRIEF & BATTLECARD
===========================================================
CEL OPERACYJNY: ${selectedLead.name}
ZAKRES WPŁYWU / BIO: ${selectedLead.bio}
ŁĄCZNOŚĆ / PLATFORMA: ${selectedLead.source}
STOSOWANY TRYB: WOJSKOWY (TACTICAL COMBAT MODE)
INDEKS GOTOWOŚCI (CRI): ${tb.readinessRating} / 100

-----------------------------------------------------------
1. MISJA BOJOWA (STRATEGIC MISSION TARGET):
-----------------------------------------------------------
${tb.missionObjective}

-----------------------------------------------------------
2. REKONESANS SŁABYCH PUNKTÓW (VULNERABILITY ASSESSMENT):
-----------------------------------------------------------
${tb.vulnerabilityAssessment.map((vuln, i) => `${i + 1}. [SABOTAŻ] ${vuln}`).join('\n')}

-----------------------------------------------------------
3. ANALIZA MEDDPICC (OPERATIONAL QUALIFICATION):
-----------------------------------------------------------
* Metrics (Wyliczenia):   ${tb.meddpiccTable.metrics}
* Economic Buyer:         ${tb.meddpiccTable.economicBuyer}
* Decision Criteria:      ${tb.meddpiccTable.decisionCriteria}
* Decision Process:       ${tb.meddpiccTable.decisionProcess}
* Identify Pain (Ból):    ${tb.meddpiccTable.identifyPain}
* Champion (Sojusznik):   ${tb.meddpiccTable.champion}

-----------------------------------------------------------
4. SCENARIUSZ ATAKU TELEFONICZNEGO (OP-SCRIPT):
-----------------------------------------------------------
* Faza 1: Hak Taktyczny:
  -> ${tb.opScript.phase1Hook}

* Faza 2: Punkt Bólu:
  -> ${tb.opScript.phase2Pain}

* Faza 3: Dowód Dowodzenia:
  -> ${tb.opScript.phase3Proof}

* Faza 4: Bezpośredni CTA:
  -> ${tb.opScript.phase4Cta}

-----------------------------------------------------------
5. TARCZA OBRAŻEŃ (COMBAT OBJECTIONS SHIELDS):
-----------------------------------------------------------
${tb.combatObjections.map((obj, i) => `[OBIEKCJA ${i + 1}] "${obj.objection}"
  -> [TARCZA BOJOWA] "${obj.combatshield}"`).join('\n\n')}

===========================================================
GENEROWANE PRZEZ: ZAPALNIK B2B TACTICAL INTEL ENGINE v4.0
===========================================================`;

                      const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `Tactical-Brief_${selectedLead.name.replace(/\s+/g, '_')}.txt`;
                      link.click();
                      URL.revokeObjectURL(url);
                      toast.success("Plik odprawy taktycznej (Tactical-Brief) pobrany pomyślnie!");
                    }}
                    className="px-3.5 py-2 bg-neutral-900 border border-neutral-800 hover:bg-neutral-850 text-neutral-300 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer font-mono"
                  >
                    <Download size={12} />
                    POBIERZ INSTRUCTIONS.TXT
                  </button>

                  <button
                    onClick={() => setShowTacticalBriefModal(false)}
                    className="p-2 hover:bg-rose-950/20 border border-rose-950/45 text-rose-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Main HUD Interface Panels */}
              <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative z-10">
                
                {/* Left Column: Intelligence, MEDDPICC and Vulnerability Scouting */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-black/40">
                  
                  {/* Mission Target Block */}
                  <div className="p-4 bg-rose-950/10 border-2 border-rose-900/30 rounded-xl space-y-2 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 blur-2xl rounded-full" />
                    <div className="flex items-center gap-2 text-rose-400 font-mono text-[10px] font-black uppercase tracking-wider">
                      <Target size={14} className="text-rose-500 animate-pulse" />
                      MISJA BOJOWA (STRATEGIC GOAL)
                    </div>
                    <p className="text-white text-xs font-bold leading-relaxed pr-8">
                      {selectedLead.tacticalBrief.missionObjective}
                    </p>
                  </div>

                  {/* Operational Challenges (Vulnerability Scouting) */}
                  <div className="space-y-2.5">
                    <h4 className="text-[10px] text-neutral-500 uppercase tracking-widest font-black font-mono flex items-center gap-2">
                      <AlertTriangle size={12} className="text-rose-500" />
                      REKONESANS WPŁYWÓW / DIAGNOZA SŁABYCH PUNKTÓW
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {selectedLead.tacticalBrief.vulnerabilityAssessment.map((vulnerability, i) => (
                        <div key={i} className="bg-neutral-950 border border-rose-950/50 rounded-xl p-3.5 space-y-2 relative hover:border-rose-900/60 transition-colors">
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] bg-rose-500/10 text-rose-400 px-1.5 py-0.5 rounded font-mono font-bold">
                              SŁABY PUNKT {i + 1}
                            </span>
                            <Skull size={10} className="text-rose-500/40" />
                          </div>
                          <p className="text-neutral-300 text-[11px] leading-relaxed font-sans">{vulnerability}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* MEDDPICC Operational Qualification Grid */}
                  <div className="space-y-2.5">
                    <h4 className="text-[10px] text-neutral-500 uppercase tracking-widest font-black font-mono flex items-center gap-2">
                      <Shield size={12} className="text-rose-400" />
                      METODOLOGIA KWALIFIKACJI (MEDDPICC COMPASS)
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      
                      <div className="bg-neutral-950/60 border border-neutral-900 rounded-xl p-3.5 space-y-1 hover:border-rose-950/30 transition-all">
                        <div className="text-[8px] text-rose-400 uppercase font-mono font-black">[M] METRICS</div>
                        <div className="text-xs font-bold text-white leading-snug">{selectedLead.tacticalBrief.meddpiccTable.metrics}</div>
                      </div>

                      <div className="bg-neutral-950/60 border border-neutral-900 rounded-xl p-3.5 space-y-1 hover:border-rose-950/30 transition-all">
                        <div className="text-[8px] text-rose-400 uppercase font-mono font-black">[E] ECONOMIC BUYER</div>
                        <div className="text-xs font-bold text-white leading-snug">{selectedLead.tacticalBrief.meddpiccTable.economicBuyer}</div>
                      </div>

                      <div className="bg-neutral-950/60 border border-neutral-900 rounded-xl p-3.5 space-y-1 hover:border-rose-950/30 transition-all">
                        <div className="text-[8px] text-rose-400 uppercase font-mono font-black">[D] DECISION CRITERIA</div>
                        <div className="text-xs font-bold text-white leading-snug">{selectedLead.tacticalBrief.meddpiccTable.decisionCriteria}</div>
                      </div>

                      <div className="bg-neutral-950/60 border border-neutral-900 rounded-xl p-3.5 space-y-1 hover:border-rose-950/30 transition-all">
                        <div className="text-[8px] text-rose-400 uppercase font-mono font-black">[D] DECISION PROCESS</div>
                        <div className="text-xs font-bold text-white leading-snug">{selectedLead.tacticalBrief.meddpiccTable.decisionProcess}</div>
                      </div>

                      <div className="bg-neutral-950/60 border border-neutral-900 rounded-xl p-3.5 space-y-1 hover:border-rose-950/30 transition-all">
                        <div className="text-[8px] text-rose-400 uppercase font-mono font-black">[P] IDENTIFY PAIN</div>
                        <div className="text-xs font-bold text-white leading-snug">{selectedLead.tacticalBrief.meddpiccTable.identifyPain}</div>
                      </div>

                      <div className="bg-neutral-950/60 border border-neutral-900 rounded-xl p-3.5 space-y-1 hover:border-rose-950/30 transition-all">
                        <div className="text-[8px] text-rose-400 uppercase font-mono font-black">[C] CHAMPION</div>
                        <div className="text-xs font-bold text-white leading-snug">{selectedLead.tacticalBrief.meddpiccTable.champion}</div>
                      </div>

                    </div>
                  </div>

                  {/* Combat Defenses - Objections & Counter Tactics */}
                  <div className="space-y-2.5">
                    <h4 className="text-[10px] text-neutral-500 uppercase tracking-widest font-black font-mono flex items-center gap-2">
                      <Shield size={12} className="text-emerald-500 animate-pulse" />
                      PANCERNA TARCZA ANTY-OBIEKCYJNA (COMBAT SHIELDS)
                    </h4>
                    <div className="space-y-3">
                      {selectedLead.tacticalBrief.combatObjections.map((objectionBlock, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-5 bg-neutral-950 border border-neutral-900 rounded-xl overflow-hidden hover:border-rose-950/30 transition-colors">
                          <div className="md:col-span-2 p-3 bg-red-950/15 border-b md:border-b-0 md:border-r border-neutral-900 flex flex-col justify-center">
                            <span className="text-[8.5px] text-red-400 uppercase font-mono font-black mb-1">STRZAŁ KLIENTA (OBJECTION):</span>
                            <p className="text-xs font-bold text-neutral-200 leading-snug">"{objectionBlock.objection}"</p>
                          </div>
                          <div className="md:col-span-3 p-3 bg-emerald-950/5 flex flex-col justify-center">
                            <span className="text-[8.5px] text-emerald-400 uppercase font-mono font-black mb-1">ODPARCIE TAKTYCZNE (COMBAT SHIELD):</span>
                            <p className="text-xs text-neutral-300 leading-relaxed font-sans">"{objectionBlock.combatshield}"</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Right Column: Dynamic Op-Script and Combat Readiness Meter */}
                <div className="w-full md:w-85 border-t md:border-t-0 md:border-l-2 border-rose-950/40 bg-neutral-950 flex flex-col overflow-hidden relative">
                  
                  {/* Combat Readiness circular layout */}
                  <div className="px-5 py-4 bg-rose-950/10 border-b border-rose-950/30 flex items-center justify-between">
                    <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-widest font-mono">BATTLE READINESS INDEX</span>
                    <span className="text-[10px] text-rose-400 font-black font-mono bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded">
                      CRI-{selectedLead.tacticalBrief.readinessRating}%
                    </span>
                  </div>

                  <div className="flex-1 p-5 overflow-y-auto space-y-5 custom-scrollbar bg-black/10">
                    
                    {/* Visual Target Ring/Stat indicator */}
                    <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-4 flex items-center gap-4 relative overflow-hidden">
                      <div className="w-16 h-16 rounded-full border-4 border-neutral-900 flex items-center justify-center relative shrink-0">
                        <div className="absolute inset-0 rounded-full border-4 border-rose-500 border-t-transparent animate-spin [animation-duration:4s]" />
                        <span className="text-sm font-black text-white font-mono">{selectedLead.tacticalBrief.readinessRating}</span>
                      </div>
                      <div>
                        <div className="text-[9px] text-rose-400 font-black font-mono uppercase tracking-[0.15em]">WAR PROBABILITY</div>
                        <h5 className="text-[11px] font-black text-white uppercase tracking-tight mt-0.5">Ocena potencjału domknięcia</h5>
                        <p className="text-[10px] text-neutral-500 leading-snug font-sans mt-0.5">
                          Inbound oznaczony wysokorokująco wg MEDDPICC. Prawdopodobieństwo sukcesu równe {selectedLead.tacticalBrief.readinessRating}%.
                        </p>
                      </div>
                    </div>

                    {/* Telemarketing Op-Script Section */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-1.5 border-b border-neutral-900 pb-1.5">
                        <Crosshair size={12} className="text-red-500 animate-pulse" />
                        <span className="text-[9px] text-neutral-400 font-black uppercase tracking-wider font-mono">PANCERNY OP-SCRIPT OUTREACHOWY</span>
                      </div>

                      {/* Op-Script Phases */}
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                            <span className="text-[8.5px] text-rose-400 uppercase font-mono font-black">FAZA 1: HAK PSYCHOLOGICZNY (HOOK)</span>
                          </div>
                          <p className="p-2.5 bg-neutral-950/80 border border-neutral-900 rounded-lg text-[10.5px] text-neutral-300 leading-relaxed font-sans">
                            {selectedLead.tacticalBrief.opScript.phase1Hook}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                            <span className="text-[8.5px] text-rose-400 uppercase font-mono font-black">FAZA 2: STRZAŁ W PUNKT BÓLU (PAIN)</span>
                          </div>
                          <p className="p-2.5 bg-neutral-950/80 border border-neutral-900 rounded-lg text-[10.5px] text-neutral-300 leading-relaxed font-sans">
                            {selectedLead.tacticalBrief.opScript.phase2Pain}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                            <span className="text-[8.5px] text-rose-400 uppercase font-mono font-black">FAZA 3: DOWÓD SKUTECZNOŚCI (PROOF)</span>
                          </div>
                          <p className="p-2.5 bg-neutral-950/80 border border-neutral-900 rounded-lg text-[10.5px] text-neutral-300 leading-relaxed font-sans">
                            {selectedLead.tacticalBrief.opScript.phase3Proof}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                            <span className="text-[8.5px] text-rose-400 uppercase font-mono font-black">FAZA 4: WEZWANIE DO WALKI (CTA)</span>
                          </div>
                          <p className="p-2.5 bg-neutral-950/80 border border-neutral-900 rounded-lg text-[10.5px] text-neutral-300 leading-relaxed font-sans">
                        <button
                          onClick={() => handleCloseWonWithInvoice(selectedLead)}
                          className="w-full mt-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(16,185,129,0.3)] border border-emerald-500/30"
                        >
                          <Receipt size={16} />
                          CLOSE WON & WYSTAW FAKTURĘ (19 500 PLN)
                        </button>
                            {selectedLead.tacticalBrief.opScript.phase4Cta}
                          </p>
                        </div>
                      </div>

                    </div>

                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
