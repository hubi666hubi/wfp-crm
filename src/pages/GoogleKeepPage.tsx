import React, { useState, useEffect, useMemo } from 'react';
import { 
  StickyNote, Plus, Search, Trash2, Edit3, Save, Pin, CheckSquare, 
  Sparkles, Clock, ArrowRight, RotateCw, Check, ExternalLink, 
  FileText, Video, AlertTriangle, X, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { getAccessToken, initAuth, googleSignIn, logout } from '../lib/auth';
import { collection, onSnapshot, query, where, addDoc, updateDoc, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface KeepNote {
  id: string;
  userId: string;
  title: string;
  content: string;
  checklist?: string[];
  checkedItems?: string[]; // list of completed items
  color: string; // e.g. "yellow", "blue", "rose", "zinc", etc.
  tags: string[]; // e.g. ["#Instagram", "#Idea"]
  pinned: boolean;
  isAiGenerated?: boolean;
  createdAt: string;
  updatedAt: string;
}

const NOTE_COLORS = [
  { id: 'neutral', name: 'Standardowy', bg: 'bg-neutral-800/80', border: 'border-neutral-700/80', text: 'text-neutral-200', circle: 'bg-neutral-700' },
  { id: 'yellow', name: 'Keep Żółty', bg: 'bg-amber-950/40', border: 'border-amber-500/30', text: 'text-amber-200', circle: 'bg-amber-600' },
  { id: 'rose', name: 'Zapalnik Różowy', bg: 'bg-rose-950/40', border: 'border-rose-500/30', text: 'text-rose-200', circle: 'bg-rose-600' },
  { id: 'emerald', name: 'Zielony Sukces', bg: 'bg-emerald-950/40', border: 'border-emerald-500/30', text: 'text-emerald-200', circle: 'bg-emerald-600' },
  { id: 'blue', name: 'Błękitny Lejek', bg: 'bg-blue-950/40', border: 'border-blue-500/30', text: 'text-blue-200', circle: 'bg-blue-600' },
  { id: 'indigo', name: 'Fiolet OMEGA', bg: 'bg-indigo-950/40', border: 'border-indigo-500/30', text: 'text-indigo-200', circle: 'bg-indigo-600' },
];

export function GoogleKeepPage() {
  // Authentication & API state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [keepApiStatus, setKeepApiStatus] = useState<'idle' | 'loading' | 'error' | 'connected'>('idle');
  const [apiErrorMessage, setApiErrorMessage] = useState('');

  // Firestore local/cloud synchronised notes
  const [notes, setNotes] = useState<KeepNote[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTagTab, setSelectedTagTab] = useState<'all' | '#Instagram' | '#AI_Generated' | '#Checklista'>('all');

  // Input states for new Note
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteChecklistInput, setNoteChecklistInput] = useState('');
  const [noteColor, setNoteColor] = useState('neutral');
  const [isAddingList, setIsAddingList] = useState(false);
  const [noteTags, setNoteTags] = useState<string[]>([]);
  const [currentTagInput, setCurrentTagInput] = useState('');

  // Instagram Content Generator state
  const [instaTopic, setInstaTopic] = useState('');
  const [instaFormat, setInstaFormat] = useState('Instagram Reel Script');
  const [instaGoal, setInstaGoal] = useState('Outbound DM Magnet (Komentarze)');
  const [generatingIdea, setGeneratingIdea] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<{ draftContent: string; checklist: string[] } | null>(null);

  // Destructive operations confirm modal
  const [noteToDelete, setNoteToDelete] = useState<KeepNote | null>(null);

  // Keep Sync Agent & AI Project Insights State
  const [syncAgentRunning, setSyncAgentRunning] = useState(false);
  const [insightsData, setInsightsData] = useState<any>(null);
  const [selectedInsightCategoryTab, setSelectedInsightCategoryTab] = useState<'all' | 'Instagram' | 'CRM' | 'Outreach' | 'DopamineLoops' | 'Administrative' | 'Other'>('all');
  const [syncAgentLogs, setSyncAgentLogs] = useState<string[]>([]);
  const [isPeriodicSyncEnabled, setIsPeriodicSyncEnabled] = useState(true);

  // Keep-to-Autopilot (Dispatcher POMYSŁÓW) State
  const [dispatcherRunning, setDispatcherRunning] = useState(false);
  const [dispatcherLogs, setDispatcherLogs] = useState<string[]>([]);
  const [dispatchedIdeas, setDispatchedIdeas] = useState<any[]>([]);

  // Try to query Google Keep REST API to verify access / show status
  const verifyKeepApi = async (token: string) => {
    setKeepApiStatus('loading');
    try {
      // Due to Google Keep API restrictions in Consumer GCP Projects, we want to gently verify connection
      const response = await fetch('https://keep.googleapis.com/v1/notes?pageSize=5', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        setKeepApiStatus('connected');
        setApiErrorMessage('');
      } else {
        const errData = await response.json().catch(() => ({}));
        setKeepApiStatus('error');
        setApiErrorMessage(errData?.error?.message || 'Access Restricted to GSuite/Enterprise tenants. Using cloud backup failover.');
      }
    } catch (e: any) {
      setKeepApiStatus('error');
      setApiErrorMessage('Error checking keep API connection. Backing up locally.');
    }
  };

  // Init OAuth & authentication from current page scope
  useEffect(() => {
    const unsub = initAuth(
      (user, token) => {
        setIsAuthenticated(true);
        setGoogleUser(user);
        verifyKeepApi(token);
      },
      () => {
        setIsAuthenticated(false);
        setGoogleUser(null);
        setKeepApiStatus('idle');
      }
    );
    return () => unsub();
  }, []);

  // Listen for user state to load notes from Firestore (for consumer fallbacks/unauthenticated access)
  useEffect(() => {
    let unsubFirestore = () => {};
    
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setLoadingNotes(true);
        const q = query(collection(db, 'keep_notes'), where('userId', '==', user.uid));
        unsubFirestore = onSnapshot(q, (snapshot) => {
          const items: KeepNote[] = [];
          snapshot.forEach(docSnap => {
            items.push({ id: docSnap.id, ...docSnap.data() } as KeepNote);
          });
          // Sort by pinned first, then updatedAt descending
          items.sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          });
          setNotes(items);
          setLoadingNotes(false);
        }, (err) => {
          console.error("Firestore loading error:", err);
          setLoadingNotes(false);
        });
      } else {
        setNotes([]);
        setLoadingNotes(false);
        unsubFirestore();
      }
    });

    return () => {
      unsubAuth();
      unsubFirestore();
    };
  }, []);

  // Listen for user state to load Keep insights from Firestore
  useEffect(() => {
    let unsubInsights = () => {};
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        unsubInsights = onSnapshot(doc(db, 'keep_insights', user.uid), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setInsightsData(data);
            if (data.syncLogs) {
              setSyncAgentLogs(data.syncLogs);
            }
          }
        }, (err) => {
          console.error("Listening for keep_insights failed:", err);
        });
      } else {
        setInsightsData(null);
        setSyncAgentLogs([]);
        unsubInsights();
      }
    });

    return () => {
      unsubAuth();
      unsubInsights();
    };
  }, []);

  // Listen for marketing ideas/drafts
  useEffect(() => {
    let unsubIdeas = () => {};
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const q = query(collection(db, 'marketing_ideas'), where('userId', '==', user.uid));
        unsubIdeas = onSnapshot(q, (snapshot) => {
          const list: any[] = [];
          snapshot.forEach(docSnap => {
            list.push({ id: docSnap.id, ...docSnap.data() });
          });
          setDispatchedIdeas(list.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        }, (err) => {
          console.error("Listening for marketing_ideas failed:", err);
        });
      } else {
        setDispatchedIdeas([]);
        unsubIdeas();
      }
    });

    return () => {
      unsubAuth();
      unsubIdeas();
    };
  }, []);

  // Keep-to-Autopilot (Dispatcher POMYSŁÓW) Action
  const runDispatcher = async () => {
    if (!auth.currentUser) {
      toast.error("Zaloguj się najpierw.");
      return;
    }
    setDispatcherRunning(true);
    setDispatcherLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Uruchamianie silnika OMEGA AI Dispatcher...`]);
    try {
      const token = await getAccessToken();
      const res = await fetch('/api/keep/dispatcher', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          userId: auth.currentUser.uid
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Wystąpił błąd dispatchera.");
      }
      if (data.logs) {
        setDispatcherLogs(prev => [...prev, ...data.logs]);
      }
      if (data.message) {
        toast.info(data.message);
      } else {
        toast.success("Pomyślnie przetworzono notatki i rozproszono zadania/leady/drafty!");
      }
    } catch (err: any) {
      console.error("Keep dispatcher error:", err);
      setDispatcherLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Błąd krytyczny: ${err.message}`]);
      toast.error(`Błąd: ${err.message}`);
    } finally {
      setDispatcherRunning(false);
    }
  };

  const deleteDispatchedIdea = async (id: string) => {
    try {
      const res = await fetch(`/api/keep/marketing-ideas/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setDispatchedIdeas(prev => prev.filter(item => item.id !== id));
        toast.success("Usunięto szkic postu z bazy pomysłów.");
      } else {
        toast.error("Nie udało się usunąć pomysłu.");
      }
    } catch (err) {
      toast.error("Błąd sieci podczas usuwania.");
    }
  };

  const runSyncAgent = async () => {
    if (!auth.currentUser) {
      toast.error("Zaloguj się najpierw.");
      return;
    }

    setSyncAgentRunning(true);
    setSyncAgentLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Żądanie synchronizacji wysłane do serwerów OMEGA...`]);
    const toastId = toast.loading("Sync Agent uruchamia kognitywne silniki przetwarzania...");

    try {
      const oauthToken = getAccessToken();
      const response = await fetch('/api/keep/sync-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: oauthToken,
          userId: auth.currentUser.uid
        })
      });

      if (response.ok) {
        const data = await response.json();
        setInsightsData(data);
        if (data.syncLogs) {
          setSyncAgentLogs(data.syncLogs);
        }
        toast.success("Synchronizacja biznesowa Keep zakończona pomyślnie!", { id: toastId });
      } else {
        const errText = await response.text();
        toast.error(`Wystąpił błąd agenta: ${errText || 'Niepoprawna odpowiedź serwera'}`, { id: toastId });
      }
    } catch (e: any) {
      console.error(e);
      toast.error(`Błąd połączenia: ${e.message || String(e)}`, { id: toastId });
    } finally {
      setSyncAgentRunning(false);
    }
  };

  const handleAddSampleTestingNote = async () => {
    if (!auth.currentUser) {
      toast.error("Zaloguj się najpierw.");
      return;
    }
    try {
      const sampleNotes = [
        {
          title: "🎯 Plan Reels - Automatyczny Lejek ManyChat",
          content: "Nagadać krótką rolkę na temat automatycznego domykania transakcji w prywatnych wiadomościach. Pokaż krok po kroku lejek ManyChat z wezwaniem: 'Napisz kom OMEGA'",
          tags: ["#Instagram", "#Idea", "#Test"],
          color: "rose"
        },
        {
          title: "💼 Sekwencja Post-Zakupowa dla CRM",
          content: "Wdrożyć asynchroniczny follow-up po koszyku. Wysłać SMS z darmową lekcją wideo system OMEGA. Zapewnić wysoki retention i pętlę satysfakcji.",
          tags: ["#CRM", "#Automatyzacja", "#Test"],
          color: "blue"
        }
      ];
      
      const chosen = sampleNotes[Math.floor(Math.random() * sampleNotes.length)];
      await addDoc(collection(db, 'keep_notes'), {
        userId: auth.currentUser.uid,
        title: chosen.title,
        content: chosen.content,
        checklist: [],
        checkedItems: [],
        color: chosen.color,
        tags: chosen.tags,
        pinned: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      toast.success("Wstrzyknięto notatkę do chmury! Uruchom Sync Agenta, aby ją automatycznie zaklasyfikować!");
    } catch (err: any) {
      toast.error("Błąd wstrzykiwania.");
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setIsAuthenticated(true);
        setGoogleUser(res.user);
        verifyKeepApi(res.accessToken);

        // Zapisz bezpieczny token w user_configs dla potrzeb Sync Agenta / automacji w tle
        await fetch('/api/automation/save-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: res.user.uid,
            googleToken: res.accessToken
          })
        }).catch(err => console.warn("Failed to silently cache token for background sync:", err));

        toast.success("Połączono pomyślnie z Google Workspace!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Anulowano lub błąd autoryzacji Google.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Generate Instagram content template using Gemini
  const handleGenerateInstaIdea = async () => {
    if (!instaTopic.trim()) {
      toast.error('Wprowadź temat krótki wideo lub postu na Instagramie');
      return;
    }

    setGeneratingIdea(true);
    setGeneratedResult(null);
    const toastId = toast.loading('Gemini projektuje wiralowy post z wezwaniem do działania...');

    try {
      const response = await fetch('/api/generate-instapost-idea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: instaTopic,
          format: instaFormat,
          goal: instaGoal
        })
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedResult(data);
        toast.success('Pomysł na post i checklista wdrożeń wygenerowane pomyślnie!', { id: toastId });
      } else {
        toast.error('Serwer nie odpowiedział poprawnie.', { id: toastId });
      }
    } catch (e) {
      console.error(e);
      toast.error('Błąd połączenia z modułem AI.', { id: toastId });
    } finally {
      setGeneratingIdea(false);
    }
  };

  // Export created or generated post to a Google Keep Note (and attempt direct Google Keep API write too)
  const handleExportToKeep = async (title: string, content: string, checklistItems?: string[]) => {
    if (!auth.currentUser) {
      toast.error("Zaloguj się najpierw, aby zarządzać notatkami.");
      return;
    }

    const toastId = toast.loading('Eksportowanie do bazy Google Keep i chmury Firestore...');

    try {
      const cleanedChecklist = checklistItems && checklistItems.length > 0
        ? checklistItems.map(item => item.trim()).filter(Boolean)
        : undefined;

      const newNote: Omit<KeepNote, 'id'> = {
        userId: auth.currentUser.uid,
        title: title || 'Idea z Instagrama',
        content: content || '',
        checklist: cleanedChecklist,
        checkedItems: [],
        color: 'rose', 
        tags: ['#Instagram', '#AI_Generated'],
        pinned: false,
        isAiGenerated: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 1. Sync to Google Firestore
      await addDoc(collection(db, 'keep_notes'), newNote);

      // 2. Attempt Google Keep API Create if authenticated and connected
      const oauthToken = getAccessToken();
      if (oauthToken && keepApiStatus === 'connected') {
        try {
          const body: Record<string, any> = {
            title: newNote.title,
          };
          if (cleanedChecklist) {
            body.listItems = cleanedChecklist.map(txt => ({ text: { text: txt }, checked: false }));
          } else {
            body.body = { text: { text: newNote.content } };
          }

          const apiResponse = await fetch('https://keep.googleapis.com/v1/notes', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${oauthToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
          });

          if (apiResponse.ok) {
            toast.success('Dodano do Twojego oficjalnego systemu Google Keep!', { id: toastId });
          } else {
            // gracefully log restricted access or missing Keep API scopes issues
            console.warn("Keep API returned restricted write access. Keeping locally in cloud backup.");
            toast.success('Zapisano w bezpiecznej chmurze backupu (Firestore).', { id: toastId });
          }
        } catch (apiErr) {
          console.warn("Direct Keep API submit failed:", apiErr);
          toast.success('Zapisano w bezpiecznej chmurze backupu (Firestore).', { id: toastId });
        }
      } else {
        toast.success('Zapisano lokalnie (Brak połączenia z chmurą Google Keep API).', { id: toastId });
      }
    } catch (err: any) {
      console.error(err);
      toast.error(`Wystąpił błąd: ${err.message || String(err)}`, { id: toastId });
    }
  };

  // Add custom manual Note
  const handleAddManualNote = async () => {
    if (!auth.currentUser) {
      toast.error("Zaloguj się najpierw.");
      return;
    }
    if (!noteTitle.trim() && !noteContent.trim() && !noteChecklistInput.trim()) {
      toast.error("Dodaj przynajmniej tytuł lub treść notatki.");
      return;
    }

    try {
      const finalTags = [...noteTags];
      if (isAddingList) finalTags.push('#Checklista');
      if (noteTitle.toLowerCase().includes('instagram') || noteContent.toLowerCase().includes('instagram')) {
        finalTags.push('#Instagram');
      }

      let parsedChecklist: string[] | undefined;
      if (isAddingList && noteChecklistInput.trim()) {
        parsedChecklist = noteChecklistInput
          .split('\n')
          .map(i => i.trim())
          .filter(Boolean);
      }

      const freshNote: Omit<KeepNote, 'id'> = {
        userId: auth.currentUser.uid,
        title: noteTitle.trim() || 'Bez Tytułu',
        content: noteContent.trim(),
        checklist: parsedChecklist,
        checkedItems: [],
        color: noteColor,
        tags: Array.from(new Set(finalTags)), // remove duplicates
        pinned: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'keep_notes'), freshNote);
      toast.success("Notatka utworzona pomyślnie!");

      // Clear form inputs
      setNoteTitle('');
      setNoteContent('');
      setNoteChecklistInput('');
      setNoteColor('neutral');
      setNoteTags([]);
      setIsAddingList(false);
    } catch (e: any) {
      console.error("Failed to add manual note", e);
      toast.error("Błąd zapisu.");
    }
  };

  // Toggle Pinned status
  const handleTogglePin = async (note: KeepNote) => {
    try {
      await updateDoc(doc(db, 'keep_notes', note.id), {
        pinned: !note.pinned,
        updatedAt: new Date().toISOString()
      });
      toast.success(note.pinned ? "Odpięto od góry" : "Przypięto na górze");
    } catch (err) {
      toast.error("Błąd modyfikacji.");
    }
  };

  // Toggle single checklist checkbox
  const handleToggleChecklist = async (note: KeepNote, index: number, isChecked: boolean) => {
    const list = [...(note.checkedItems || [])];
    const targetItem = note.checklist?.[index] || '';

    if (isChecked) {
      if (!list.includes(targetItem)) {
        list.push(targetItem);
      }
    } else {
      const idx = list.indexOf(targetItem);
      if (idx !== -1) {
        list.splice(idx, 1);
      }
    }

    try {
      await updateDoc(doc(db, 'keep_notes', note.id), {
        checkedItems: list,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      toast.error("Nie udało się zaktualizować checkisty.");
    }
  };

  // Handle color change
  const handleChangeColor = async (noteId: string, color: string) => {
    try {
      await updateDoc(doc(db, 'keep_notes', noteId), {
        color: color,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      toast.error("Błąd koloru.");
    }
  };

  // Confirm delete note request (with custom dialog as mandated by Workspace instructions)
  const askDeleteNote = (note: KeepNote) => {
    setNoteToDelete(note);
  };

  const handleConfirmDelete = async () => {
    if (!noteToDelete) return;

    try {
      await deleteDoc(doc(db, 'keep_notes', noteToDelete.id));
      toast.success(`Usunięto pomyślnie notatkę: "${noteToDelete.title}"`);
    } catch (err) {
      toast.error("Błąd usuwania.");
    } finally {
      setNoteToDelete(null);
    }
  };

  // Add/Remove interactive tag label for creating
  const addTag = () => {
    let clean = currentTagInput.trim();
    if (!clean) return;
    if (!clean.startsWith('#')) clean = '#' + clean;
    if (!noteTags.includes(clean)) {
      setNoteTags([...noteTags, clean]);
    }
    setCurrentTagInput('');
  };

  const removeTag = (t: string) => {
    setNoteTags(noteTags.filter(item => item !== t));
  };

  // Filter & Search computation
  const filteredNotes = useMemo(() => {
    return notes.filter(n => {
      const matchesSearch = 
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        n.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (n.checklist && n.checklist.some(itm => itm.toLowerCase().includes(searchQuery.toLowerCase())));
      
      const matchesTag = 
        selectedTagTab === 'all' || 
        (selectedTagTab === '#Instagram' && n.tags.includes('#Instagram')) ||
        (selectedTagTab === '#AI_Generated' && n.tags.includes('#AI_Generated')) ||
        (selectedTagTab === '#Checklista' && n.tags.includes('#Checklista'));

      return matchesSearch && matchesTag;
    });
  }, [notes, searchQuery, selectedTagTab]);

  return (
    <div id="keep-root-container" className="min-h-screen bg-black text-white p-6">
      
      {/* 1. Sync & Auth Status Bar - Consistent Google Workspace design */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between border-b border-neutral-800 pb-6 mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <StickyNote size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Google Keep <span className="text-rose-500 text-sm font-mono tracking-widest uppercase py-0.5 px-2 bg-rose-500/10 border border-rose-500/20 rounded">INTEGRACJA</span>
              </h1>
              <p className="text-sm text-neutral-400">Archiwum postów, scenopisy Reelsów i plany marketingowe Instagrama w jednym miejscu.</p>
            </div>
          </div>
        </div>

        {/* Integration Credentials Widgets */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Firestore Backup status */}
          <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-lg text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-neutral-400">Firestore Cloud Backup:</span>
            <span className="text-emerald-400 font-medium">Aktywny</span>
          </div>

          {/* Google Workspace Keep Sync Status */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-lg text-xs">
              <span className={`w-2 h-2 rounded-full ${keepApiStatus === 'connected' ? 'bg-amber-400 animate-pulse' : 'bg-red-400'}`} />
              <span className="text-neutral-400">Konto Google:</span>
              <span className="text-white truncate max-w-[120px]">{googleUser?.email || 'Zalogowany'}</span>
              
              {keepApiStatus === 'error' && (
                <div className="flex items-center group relative cursor-pointer ml-1 text-red-400">
                  <HelpCircle size={14} />
                  <span className="absolute bottom-full right-0 w-64 p-2 bg-neutral-950 text-[10px] text-neutral-300 rounded border border-neutral-800 hidden group-hover:block z-50 shadow-2xl">
                    Google Keep wymaga autoryzacji domenowej Enterprise. Plany i scenariusze Instagrama są bezpiecznie przechowywane w zintegrowanej bazie cloud Firestore.
                  </span>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={handleGoogleLogin}
              disabled={isLoggingIn}
              className="px-4 py-1.5 bg-white text-black hover:bg-neutral-200 text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 48 48" className="inline-block">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              </svg>
              {isLoggingIn ? "Autoryzacja..." : "Podłącz Google Keep"}
            </button>
          )}
        </div>
      </div>

      {/* Grid Layout: Config/Generation on left, Interactive Google Keep Boards on right */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Instagram Idea AI Generator Box */}
        <div className="xl:col-span-4 space-y-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 blur-2xl rounded-full" />
            
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="text-rose-400" size={20} />
              <h2 className="text-base font-semibold text-white">Przetwórnia Pomysłów Instagrama</h2>
            </div>
            <p className="text-xs text-neutral-400 mb-6">Generuj neuro-haki, scenariusze Reelsów i pełne skrypty postów. Następnie wyeksportuj wynik bezpośrednio jako notatkę Google Keep.</p>
            
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Temat przewodniczący (Idea)</label>
                <textarea
                  value={instaTopic}
                  onChange={(e) => setInstaTopic(e.target.value)}
                  placeholder="np.: Dlaczego Twoje leady marnują się w Excelu i jak zautomatyzować to za pomocą Zapalnika"
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-rose-500/50 rounded-xl px-3 py-2 text-white placeholder-neutral-600 focus:outline-none transition-colors h-20 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Target Format (Instagram)</label>
                <select
                  value={instaFormat}
                  onChange={(e) => setInstaFormat(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-rose-500/50 rounded-xl px-3 py-2 text-white focus:outline-none transition-colors cursor-pointer"
                >
                  <option value="Instagram Reel Script">Skrypt wideo Reels (0-45 sekund)</option>
                  <option value="Carousel Lead Magnet (Tekst)">Karuzela edukacyjna (Tekst dla grafik)</option>
                  <option value="Single Image Viral Post">Pojedyncza potężna grafika/meme z opisem</option>
                  <option value="Checklist Action Plan">Plan wdrożeń w formie checklisty</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Cel Marketingowy</label>
                <select
                  value={instaGoal}
                  onChange={(e) => setInstaGoal(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-rose-500/50 rounded-xl px-3 py-2 text-white focus:outline-none transition-colors cursor-pointer"
                >
                  <option value="Outbound DM Magnet (Komentarze)">Outbound Magnet (Słowo kluczowe w komentarzu)</option>
                  <option value="High-Trust Brand Value (Edukacja)">Edukacja premium (Budowa autorytetu)</option>
                  <option value="Controversial Pattern-Interrupt">Przełamujący schemat (Dyskusje/Kontrowersja)</option>
                  <option value="Direct Pitch Product Link">Bezpośrednia sprzedaż wideo do DM</option>
                </select>
              </div>

              <button
                onClick={handleGenerateInstaIdea}
                disabled={generatingIdea}
                className="w-full h-11 bg-rose-600 hover:bg-rose-500 active:scale-95 disabled:opacity-50 disabled:scale-100 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-rose-950/40"
              >
                {generatingIdea ? (
                  <>
                    <RotateCw className="animate-spin text-white" size={16} />
                    Analiza i pisanie skryptu...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} className="text-amber-300" />
                    Zaprojektuj Post z AI
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Generated Result display panel */}
          <AnimatePresence>
            {generatedResult && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="bg-neutral-900 border border-rose-500/20 rounded-2xl p-5 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                  <span className="text-xs text-rose-400 font-mono flex items-center gap-1.5 font-semibold">
                    <Check size={14} /> Gotowy szkic posta
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setGeneratedResult(null)}
                      className="p-1 hover:bg-neutral-800 rounded text-neutral-500 hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] text-neutral-400 font-mono uppercase tracking-widest block mb-1">Skrypt i Opis posta</span>
                    <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 max-h-60 overflow-y-auto text-xs text-neutral-300 whitespace-pre-wrap leading-relaxed font-sans">
                      {generatedResult.draftContent}
                    </div>
                  </div>

                  {generatedResult.checklist && generatedResult.checklist.length > 0 && (
                    <div>
                      <span className="text-[10px] text-neutral-400 font-mono uppercase tracking-widest block mb-1">Zadania Wdrożeniowe (Checklista)</span>
                      <ul className="space-y-1.5 max-h-40 overflow-y-auto bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                        {generatedResult.checklist.map((task, i) => (
                          <li key={i} className="flex items-center gap-2 text-xs text-neutral-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                            <span>{task}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      onClick={() => handleExportToKeep(
                        `📌 Post: ${instaTopic.slice(0, 30)}...`, 
                        generatedResult.draftContent, 
                        generatedResult.checklist
                      )}
                      className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-rose-950/20 active:scale-95"
                    >
                      <ExternalLink size={14} />
                      Wyślij do Google Keep
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* GOOGLE KEEP AI SYNC AGENT CONTROLLER */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-5 relative overflow-hidden mt-6">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 blur-2xl rounded-full" />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                  <StickyNote size={16} className="animate-pulse" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">Keep AI Sync Agent</h2>
                  <p className="text-[10px] text-neutral-400">Automatyczna kategoryzacja wiedzy i lejków.</p>
                </div>
              </div>
              <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded-full border ${
                syncAgentRunning 
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 animate-pulse' 
                  : 'bg-neutral-950 border-neutral-800 text-neutral-500'
              }`}>
                {syncAgentRunning ? 'Skanowanie...' : 'Aktywny'}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between bg-neutral-950 p-2.5 rounded-xl border border-neutral-850">
                <span className="text-neutral-400">Automat synchronizacyjny (24h):</span>
                <button
                  onClick={() => setIsPeriodicSyncEnabled(!isPeriodicSyncEnabled)}
                  className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${isPeriodicSyncEnabled ? 'bg-amber-500' : 'bg-neutral-800'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-black shadow-md transform duration-200 ease-in-out ${isPeriodicSyncEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="flex gap-2.5">
                <button
                  onClick={runSyncAgent}
                  disabled={syncAgentRunning}
                  className="flex-1 py-2 px-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center justify-center gap-2 text-xs transition-colors cursor-pointer"
                >
                  <RotateCw size={14} className={syncAgentRunning ? 'animate-spin' : ''} />
                  Uruchom analizę AI
                </button>
                <button
                  onClick={handleAddSampleTestingNote}
                  className="py-2 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                  title="Wstrzyknij nową notatkę do testowania Sync Agenta"
                >
                  Materiały testowe +
                </button>
              </div>
            </div>

            {/* REAL-TIME LOGS CONSOLE */}
            <div className="space-y-1.5">
              <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest block font-bold font-bold">Dziennik pracy agenta (System Logs)</span>
              <div className="bg-black border border-neutral-800/80 rounded-xl p-3 h-28 overflow-y-auto font-mono text-[10.5px] text-zinc-400 leading-relaxed scrollbar-thin">
                {syncAgentLogs.length === 0 ? (
                  <p className="text-neutral-600 italic text-center pt-6 text-[10px]">Uruchom analizę AI, aby pobrać i przefiltrować Twoje notatki Keep.</p>
                ) : (
                  <div className="space-y-1">
                    {syncAgentLogs.map((log, index) => (
                      <p key={index} className={log.includes('Błąd') || log.includes('REST') ? 'text-red-400 text-[9.5px]' : log.includes('Gemini') ? 'text-amber-400 text-[9.5px]' : log.includes('Pomyślnie') ? 'text-emerald-400 text-[9.5px]' : 'text-[9.5px] text-neutral-400'}>
                        {log}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* AI INTERACTIVE PROJECT INSIGHTS BOARD */}
          {insightsData && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4 mt-6">
              <div className="flex items-center gap-2 pb-2 border-b border-neutral-800">
                <Sparkles className="text-yellow-400 animate-pulse" size={18} />
                <h3 className="text-sm font-semibold text-white">Analiza Kognitywna Archiwum OMEGA</h3>
              </div>

              {/* Strategic AI summary text */}
              <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-850 text-xs leading-relaxed text-neutral-300 font-sans border-l-2 border-l-amber-500 italic">
                {insightsData.rawSummary}
                <div className="mt-2 text-[10px] text-zinc-500 font-mono tracking-widest text-right">
                  System: OMEGA Keep Analyzer v1.5 • Analiza pomyślna
                </div>
              </div>

              {/* Category selector Tabs */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-mono text-neutral-500 block">Katalog projektowy (AI Classified Groups)</span>
                <div className="flex flex-wrap gap-1 bg-neutral-950 rounded-lg p-1 border border-neutral-850">
                  {(['all', 'Instagram', 'CRM', 'Outreach', 'DopamineLoops', 'Administrative', 'Other'] as const).map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedInsightCategoryTab(cat)}
                      className={`px-2 py-1 text-[9.5px] rounded font-semibold transition-colors cursor-pointer ${
                        selectedInsightCategoryTab === cat 
                          ? 'bg-amber-600 text-white' 
                          : 'text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      {cat === 'all' ? 'Wszystkie' : cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Parsed Categorized List */}
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1 select-none font-sans">
                {insightsData.insights && insightsData.insights
                  .filter((ins: any) => selectedInsightCategoryTab === 'all' || ins.projectCategory === selectedInsightCategoryTab)
                  .map((ins: any, idx: number) => {
                    const categoryColors: Record<string, string> = {
                      Instagram: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
                      CRM: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
                      Outreach: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300',
                      DopamineLoops: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
                      Administrative: 'bg-zinc-500/10 border-zinc-500/30 text-zinc-300',
                      Other: 'bg-neutral-500/10 border-neutral-500/30 text-neutral-300',
                    };

                    const badgeClass = categoryColors[ins.projectCategory] || categoryColors.Other;

                    return (
                      <div key={idx} className="bg-neutral-950 p-3 rounded-xl border border-neutral-850 space-y-2 relative group hover:border-neutral-700 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-bold text-white line-clamp-1">{ins.noteTitle}</span>
                          <span className={`text-[8.5px] font-mono px-1.5 py-0.5 rounded border flex-shrink-0 ${badgeClass}`}>
                            {ins.projectCategory}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 leading-relaxed">{ins.summary}</p>
                        
                        <div className="flex items-center justify-between text-[10px] pt-1">
                          <span className="text-amber-400/90 font-mono">Użyteczność: {ins.relevanceScore}%</span>
                          <span className="text-neutral-500 font-mono font-bold">Priorytet dopasowany</span>
                        </div>

                        {/* Action items checklist suggested by AI */}
                        {ins.actionableSteps && ins.actionableSteps.length > 0 && (
                          <div className="pt-2 border-t border-neutral-900 space-y-1 bg-black/40 p-2 rounded-lg">
                            <span className="text-[9px] font-semibold text-neutral-400 uppercase tracking-wider block">Zalecane Zadania AI:</span>
                            {ins.actionableSteps.map((step: string, sIdx: number) => (
                              <label key={sIdx} className="flex items-start gap-1.5 text-[10px] text-neutral-400 hover:text-white cursor-pointer select-none py-0.5">
                                <input 
                                  type="checkbox" 
                                  className="mt-0.5 w-3 h-3 rounded bg-neutral-900 border-neutral-700 text-amber-500 focus:ring-amber-500 cursor-pointer"
                                />
                                <span className="leading-snug">{step}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* KEEP-TO-AUTOPILOT (DISPATCHER POMYSŁÓW) MODULE */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-5 relative overflow-hidden mt-6">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 blur-2xl rounded-full" />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20">
                  <Sparkles size={16} className="text-rose-400 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">Keep-to-Autopilot (Dispatcher)</h2>
                  <p className="text-[10px] text-neutral-400">Automatyczne sortowanie, wzbogacanie i dystrybucja.</p>
                </div>
              </div>
              <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded-full border ${
                dispatcherRunning 
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse' 
                  : 'bg-neutral-950 border-neutral-800 text-neutral-500'
              }`}>
                {dispatcherRunning ? 'Dystrybucja...' : 'Automatyczny'}
              </span>
            </div>

            <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
              Algorytm skanuje Twoje najnowsze notatki posiadające tagi <span className="font-semibold text-neutral-200">"Zapalnik", "Idea", "CRM"</span>, identyfikuje ich intencję poprzez Gemini Pro, a następnie wykonuje akcje: wysyła leady do Zapalnika, generuje ustrukturyzowane Google Tasks lub tworzy gotowe drafty postów.
            </p>

            <button
              onClick={runDispatcher}
              disabled={dispatcherRunning}
              className="w-full py-2.5 px-3 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center justify-center gap-2 text-xs transition-colors cursor-pointer shadow-lg shadow-rose-950/20"
            >
              <RotateCw size={14} className={dispatcherRunning ? 'animate-spin' : ''} />
              Uruchom AI Dispatcher dla notatek
            </button>

            {/* DISPATCHER STATUS log list console */}
            <div className="space-y-1.5 font-sans">
              <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest block font-bold">Statusy Dispatchera (AI Work Log)</span>
              <div className="bg-black border border-neutral-800/80 rounded-xl p-3 h-32 overflow-y-auto font-mono text-[10px] text-zinc-400 leading-relaxed scrollbar-thin">
                {dispatcherLogs.length === 0 ? (
                  <p className="text-neutral-600 italic text-center pt-8 text-[9.5px]">Kliknij "Uruchom AI Dispatcher", aby automatycznie zakwalifikować i rozesłać Twoje pomysły.</p>
                ) : (
                  <div className="space-y-1">
                    {dispatcherLogs.map((log, index) => (
                      <p key={index} className={log.includes('Błąd') ? 'text-red-400 text-[9.5px]' : log.includes('utworzono wpis') || log.includes('dodano') || log.includes('Utworzono g') ? 'text-emerald-400 text-[9.5px]' : log.includes('sklasyfikowało') ? 'text-amber-400 text-[9.5px]' : 'text-[9.5px] text-neutral-400'}>
                        {log}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* BAZA POMYSŁÓW MARKETINGOWYCH (DISPATCHED DRAFTS) */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4 mt-6">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-amber-400" />
                <h3 className="text-sm font-semibold text-white">Baza Pomysłów Marketingowych</h3>
              </div>
              <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-mono font-bold">
                {dispatchedIdeas.length} szkiców
              </span>
            </div>

            {dispatchedIdeas.length === 0 ? (
              <div className="text-center py-8 text-neutral-600 text-xs italic font-sans">
                Brak gotowych draftów marketingowych. Dodaj notatkę z tagiem "Idea" i uruchom AI Dispatchera, aby przetworzyć ją na chwytliwy draft postu z perswazyjnymi liniami.
              </div>
            ) : (
              <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
                {dispatchedIdeas.map((idea) => (
                  <div key={idea.id} className="bg-neutral-950 border border-neutral-850 p-4 rounded-xl space-y-3 relative group hover:border-neutral-700 transition-colors">
                    <button
                      onClick={() => deleteDispatchedIdea(idea.id)}
                      className="absolute top-3 right-3 text-neutral-500 hover:text-rose-500 transition-colors p-1 rounded hover:bg-neutral-900 cursor-pointer"
                      title="Usuń ten draft"
                    >
                      <Trash2 size={14} />
                    </button>

                    <div className="space-y-1 pr-6 font-sans">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">{idea.format}</span>
                        <span className="text-[9px] text-neutral-500 font-mono">Oryginał: "{idea.originalTitle}"</span>
                      </div>
                      <h4 className="text-xs font-bold text-white leading-snug">{idea.title}</h4>
                    </div>

                    {/* Persuasive Lines angle block */}
                    {idea.alternativeLines && idea.alternativeLines.length > 0 && (
                      <div className="bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-850 text-[10px] space-y-1 bg-gradient-to-r from-amber-500/5 to-transparent">
                        <span className="text-[8.5px] font-bold text-amber-400 uppercase tracking-wider block font-mono">3 Alternatywne Linie Perswazyjne (Angles):</span>
                        {idea.alternativeLines.map((line: string, lIdx: number) => (
                          <div key={lIdx} className="flex items-start gap-1 text-neutral-300 py-0.5">
                            <span className="text-rose-500 select-none font-bold">✦</span>
                            <p className="leading-relaxed">{line}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Content draft body */}
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest block font-bold">Kompletna Treść Postu / Skryptu</span>
                      <div className="bg-neutral-900/40 p-3 rounded-lg border border-neutral-850 max-h-40 overflow-y-auto text-xs text-neutral-300 whitespace-pre-wrap leading-relaxed font-sans select-text hover:bg-neutral-900 transition-colors">
                        {idea.draftContent}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Note Taking & Searching Board */}
        <div className="xl:col-span-8 space-y-6">
          
          {/* Main fast input Keep action bar */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-neutral-400 text-xs font-semibold mb-1">
              <CheckSquare size={16} className="text-amber-400" />
              <span>Szybki kreator notatek / checklist wdrożeniowych</span>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Tytuł notatki (np. #Instagram Reels - Szablon o oporze)"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500/40 rounded-xl px-4 py-2.5 text-white placeholder-neutral-600 focus:outline-none transition-all text-sm font-medium"
              />

              {isAddingList ? (
                <div>
                  <label className="block text-[10px] text-neutral-400 font-mono uppercase mb-1">Elementy checklisty (każda linijka to nowe zadanie)</label>
                  <textarea
                    placeholder="Wpisz zadania jedno pod drugim...&#10;np. Nagrać intro&#10;Ustawić ManyChat&#10;Strikeback post w komentarzu"
                    value={noteChecklistInput}
                    onChange={(e) => setNoteChecklistInput(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500/40 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none transition-all h-28 text-xs font-mono leading-relaxed"
                  />
                </div>
              ) : (
                <textarea
                  placeholder="Napisz treść notatki lub plan marketingowy..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500/40 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none transition-all h-28 text-sm leading-relaxed resize-none"
                />
              )}

              {/* Tag labels */}
              {noteTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 py-1">
                  {noteTags.map(tag => (
                    <span 
                      key={tag} 
                      onClick={() => removeTag(tag)}
                      className="bg-neutral-800 hover:bg-neutral-700 text-neutral-400 text-[10px] font-mono px-2 py-0.5 rounded-full border border-neutral-700/60 cursor-pointer flex items-center gap-1 transition-colors"
                    >
                      {tag}
                      <X size={10} className="text-neutral-500" />
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-1">
                {/* Interactive Tool options inside Note Bar */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Select Checklist toggle */}
                  <button
                    onClick={() => setIsAddingList(!isAddingList)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                      isAddingList 
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-400' 
                      : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700 text-neutral-400'
                    }`}
                  >
                    <CheckSquare size={14} />
                    <span>Styl Checklisty</span>
                  </button>

                  {/* Add manual tags */}
                  <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1 text-xs">
                    <input
                      type="text"
                      placeholder="Tag (np. #reels)"
                      value={currentTagInput}
                      onChange={(e) => setCurrentTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addTag()}
                      className="bg-transparent border-none text-white focus:outline-none placeholder-neutral-600 text-xs w-20 font-mono"
                    />
                    <button 
                      onClick={addTag}
                      className="p-1 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                {/* Color selects & Add button */}
                <div className="flex items-center justify-end gap-3 flex-shrink-0">
                  <div className="flex items-center gap-1 bg-neutral-950/80 px-2 py-1.5 rounded-xl border border-neutral-800">
                    {NOTE_COLORS.map(color => (
                      <button
                        key={color.id}
                        title={color.name}
                        onClick={() => setNoteColor(color.id)}
                        className={`w-4 h-4 rounded-full ${color.circle} transition-transform ${
                          noteColor === color.id ? 'scale-125 border border-white' : 'hover:scale-110'
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={handleAddManualNote}
                    className="bg-white hover:bg-neutral-200 active:scale-95 text-black text-xs font-semibold h-9 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Plus size={15} />
                    Dodaj notatkę
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Search, Filter Tabs and Interactive Notes Grid Dashboard */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Category selector Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 bg-neutral-900 border border-neutral-800 rounded-xl p-1 text-xs select-none">
                <button
                  onClick={() => setSelectedTagTab('all')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                    selectedTagTab === 'all' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  Wszystkie
                </button>
                <button
                  onClick={() => setSelectedTagTab('#Instagram')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                    selectedTagTab === '#Instagram' ? 'bg-neutral-800 text-rose-400' : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  #Instagram
                </button>
                <button
                  onClick={() => setSelectedTagTab('#AI_Generated')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                    selectedTagTab === '#AI_Generated' ? 'bg-neutral-800 text-amber-400' : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  #AI_Generated
                </button>
                <button
                  onClick={() => setSelectedTagTab('#Checklista')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                    selectedTagTab === '#Checklista' ? 'bg-neutral-800 text-blue-400' : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  #Checklista
                </button>
              </div>

              {/* Dynamic search input box */}
              <div className="relative min-w-[200px] max-w-sm flex-1 md:flex-initial">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={15} />
                <input
                  type="text"
                  placeholder="Przeszukaj notatki..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 focus:border-neutral-600 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Grid of loaded notes */}
            {loadingNotes ? (
              <div className="flex flex-col items-center justify-center py-20 bg-neutral-900/40 border border-neutral-800/80 rounded-2xl">
                <RotateCw className="animate-spin text-rose-500 mb-4" size={24} />
                <p className="text-xs font-mono text-neutral-500 tracking-wider">SKANOWANIE BAZY NOTATEK OMEGA...</p>
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-neutral-900/20 border border-dashed border-neutral-800 rounded-2xl text-center">
                <StickyNote size={36} className="text-neutral-700 mb-3" />
                <h3 className="text-sm font-semibold text-neutral-300">Brak dopasowanych notatek</h3>
                <p className="text-xs text-neutral-500 mt-1 max-w-sm">Wprowadź swój pierwszy post lub wygeneruj zarys nowej kampanii na Instagrama.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredNotes.map(note => {
                  const colorConfig = NOTE_COLORS.find(c => c.id === note.color) || NOTE_COLORS[0];
                  
                  return (
                    <motion.div
                      key={note.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`rounded-2xl p-4 border relative group hover:-translate-y-0.5 transition-all flex flex-col justify-between ${colorConfig.bg} ${colorConfig.border}`}
                    >
                      {/* Top bar details inside singular Keep Note Card */}
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className="text-sm font-semibold text-white tracking-tight line-clamp-1 group-hover:line-clamp-none">{note.title}</h3>
                          
                          <div className="flex items-center gap-1">
                            {/* Pin / Unpin option */}
                            <button
                              onClick={() => handleTogglePin(note)}
                              className={`p-1 hover:bg-neutral-800/60 rounded text-neutral-500 ${note.pinned ? 'text-amber-400' : 'hover:text-white'}`}
                              title={note.pinned ? "Odepnij" : "Przypnij"}
                            >
                              <Pin size={13} className={note.pinned ? "fill-amber-400" : ""} />
                            </button>
                          </div>
                        </div>

                        {/* Checklist items toggle render, or standard content text */}
                        {note.checklist && note.checklist.length > 0 ? (
                          <div className="space-y-1.5 my-3">
                            {note.checklist.map((item, keyIndex) => {
                              const isChecked = note.checkedItems?.includes(item) || false;
                              return (
                                <label 
                                  key={keyIndex}
                                  className="flex items-start gap-2 text-xs text-neutral-300 cursor-pointer select-none py-0.5 hover:text-white"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => handleToggleChecklist(note, keyIndex, e.target.checked)}
                                    className="mt-0.5 w-3.5 h-3.5 rounded border-neutral-700 bg-neutral-900 text-rose-600 focus:ring-rose-500 cursor-pointer"
                                  />
                                  <span className={`leading-snug ${isChecked ? 'line-through text-neutral-500' : ''}`}>
                                    {item}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-xs text-neutral-300 whitespace-pre-wrap leading-relaxed font-sans mb-3 font-normal max-h-56 overflow-y-auto pr-1">
                            {note.content}
                          </p>
                        )}
                      </div>

                      {/* Bottom actions & metadata for card footer */}
                      <div className="pt-2 border-t border-neutral-800 flex items-center justify-between mt-auto">
                        {/* Tags display */}
                        <div className="flex flex-wrap gap-1">
                          {note.tags.map(t => (
                            <span key={t} className="text-[9px] font-mono font-medium text-neutral-400 py-0.5 px-1.5 bg-neutral-950/80 border border-neutral-800 rounded">
                              {t}
                            </span>
                          ))}
                        </div>

                        {/* Interactive toolbar buttons */}
                        <div className="flex items-center gap-1.5">
                          {/* Color select palette drawer */}
                          <div className="relative group/palette flex items-center py-1">
                            <div className="absolute right-full bottom-0 hidden group-hover/palette:flex items-center gap-1 bg-neutral-950 border border-neutral-800 p-1 rounded-lg shadow-2xl z-20 mr-1.5 animate-in fade-in slide-in-from-right-1 duration-150">
                              {NOTE_COLORS.map(c => (
                                <button
                                  key={c.id}
                                  onClick={() => handleChangeColor(note.id, c.id)}
                                  className={`w-3 h-3 rounded-full ${c.circle} hover:scale-110 active:scale-95`}
                                  title={c.name}
                                />
                              ))}
                            </div>
                            <span className="w-4 h-4 rounded-full border border-neutral-600 cursor-pointer hover:border-white block" style={{backgroundColor: colorConfig.circle.replace('bg-', '')}} />
                          </div>

                          <button
                            onClick={() => askDeleteNote(note)}
                            className="p-1.5 text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                            title="Usuń notatkę"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 4. DESTROY NOTE POPUP MODAL (Workspace requirement - user confirmation before deletion) */}
      <AnimatePresence>
        {noteToDelete && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9998]"
              onClick={() => setNoteToDelete(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="fixed inset-0 m-auto w-full max-w-sm h-fit max-h-[90vh] bg-neutral-900 border border-neutral-800 p-6 rounded-2xl shadow-2xl z-[9999]"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center border border-rose-500/30">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Czy chcesz trwale usunąć notatkę?</h3>
                  <p className="text-xs text-neutral-400 mt-2">Czy na pewno usunąć notatkę: <span className="font-semibold text-neutral-300">"{noteToDelete.title}"</span>? Ta operacja usunie ją z pamięci Firestore i nie może być cofnięta.</p>
                </div>
                <div className="flex items-center gap-3 w-full pt-2">
                  <button
                    onClick={() => setNoteToDelete(null)}
                    className="flex-1 py-2 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold rounded-xl text-neutral-300 hover:text-white transition-colors cursor-pointer"
                  >
                    Anuluj
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-xs font-semibold rounded-xl text-white transition-colors cursor-pointer"
                  >
                    Napewno Usuń
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
