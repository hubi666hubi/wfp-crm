import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Video,
  Sparkles,
  Play,
  Pause,
  Type,
  Activity,
  MonitorPlay,
  Square,
  Volume2,
  VolumeX,
  Save,
  LayoutGrid,
  List,
  Download,
  RefreshCw,
  Plus,
  AlertCircle,
  X,
  Box,
  Share2,
  Copy,
  Check,
  Globe,
  Wand2,
  ImageIcon,
  CalendarDays,
  CalendarCheck,
  TrendingUp,
  Send,
  History,
  Clock,
  Trash2,
} from "lucide-react";
import { useVslStore } from "../store/vslStore";
import { auth, db } from "../lib/firebase";
import { collection, addDoc, getDocs, query, where, orderBy, deleteDoc, doc } from "firebase/firestore";
import { handleFirestoreError } from "../lib/firebaseErrors";
import type { ScriptPart } from "../store/vslStore";
import { useCronStore } from "../store/cronStore";
import { useSystemLogsStore } from "../store/systemLogsStore";
import "@google/model-viewer";
import { toast } from "sonner";
import { CloudUpload } from "lucide-react";
import { getAccessToken, initAuth, googleSignIn } from "../lib/auth";

import { TaskQueuePanel } from "../components/TaskQueuePanel";

export function VslGenerator() {
  const logAction = useSystemLogsStore((state) => state.logAction);
  const [newGlobalKeywordInput, setNewGlobalKeywordInput] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [previewShareOpen, setPreviewShareOpen] = useState(false);
  const [contentEngineModal, setContentEngineModal] = useState(false);
  const [isTrendsModalOpen, setIsTrendsModalOpen] = useState(false);
  const [contentEngineConfig, setContentEngineConfig] = useState({
    amount: 15,
    frequency: "co_2_dni",
    autoSchedule: true,
  });
  const [errors, setErrors] = useState<{
    topic?: string;
    productName?: string;
    targetAudience?: string;
    mainProblem?: string;
    keyBenefits?: string;
  }>({});

  const [googleUser, setGoogleUser] = useState<unknown>(null);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
  const [backupStatus, setBackupStatus] = useState<string>("");
  const [isBackingUp, setIsBackingUp] = useState(false);

  // States for cold outreach integration
  const [isOutreachModalOpen, setIsOutreachModalOpen] = useState(false);
  const [outreachClientName, setOutreachClientName] = useState("");
  const [outreachClientEmail, setOutreachClientEmail] = useState("");
  const [isGeneratingOutreach, setIsGeneratingOutreach] = useState(false);
  const [generatedOutreach, setGeneratedOutreach] = useState<{ subject: string; body: string } | null>(null);
  const [isSendingOutreach, setIsSendingOutreach] = useState(false);
  const [isExportingAudio, setIsExportingAudio] = useState(false);
  const [exportingPartIdx, setExportingPartIdx] = useState<number | null>(null);

  // Firestore VSL history state and methods
  const [previousScripts, setPreviousScripts] = useState<{
    id: string;
    topic: string;
    parameters: import("../store/vslStore").VslParameters;
    globalKeywords: string[];
    scriptParts: ScriptPart[];
    createdAt: string;
  }[]>([]);
  const [isLoadingScripts, setIsLoadingScripts] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const fetchPreviousScripts = async () => {
    const currentUserId = auth.currentUser?.uid;
    if (!currentUserId) return;

    setIsLoadingScripts(true);
    try {
      const q = query(
        collection(db, "vsl_scripts"),
        where("userId", "==", currentUserId),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const docs: any[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        docs.push({
          id: docSnap.id,
          topic: data.topic || "",
          parameters: data.parameters || {},
          globalKeywords: data.globalKeywords || [],
          scriptParts: data.scriptParts || [],
          createdAt: data.createdAt || ""
        });
      });
      setPreviousScripts(docs);
    } catch (err: any) {
      console.error("Failed to fetch previous VSL scripts:", err);
      try {
        handleFirestoreError(err, "list", "vsl_scripts", "VslScript");
      } catch (logErr) {
        console.warn("Firestore error logged:", logErr);
      }
    } finally {
      setIsLoadingScripts(false);
    }
  };

  const saveScriptToFirestore = async (overrideTopic?: string, overrideParts?: ScriptPart[]) => {
    const currentUserId = auth.currentUser?.uid;
    if (!currentUserId) {
      return;
    }

    const scriptToSave = overrideParts !== undefined ? overrideParts : scriptParts;
    const topicToSave = overrideTopic !== undefined ? overrideTopic : topic;

    if (!topicToSave?.trim() && (!scriptToSave || scriptToSave.length === 0)) {
      return; // nothing to save
    }

    try {
      const docPayload = {
        userId: currentUserId,
        topic: topicToSave || "Niezatytułowany skrypt",
        parameters: parameters || {},
        globalKeywords: globalKeywords || [],
        scriptParts: scriptToSave || [],
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, "vsl_scripts"), docPayload);
      await fetchPreviousScripts();
    } catch (err: any) {
      console.error("Failed to save script to Firestore:", err);
      try {
        handleFirestoreError(err, "create", "vsl_scripts", "VslScript");
      } catch (logErr) {
        console.warn("Firestore error logged:", logErr);
      }
    }
  };

  const loadPreviousScript = (script: any) => {
    setTopic(script.topic);
    setScriptParts(script.scriptParts);
    if (script.globalKeywords) {
      setGlobalKeywords(script.globalKeywords);
    }
    if (script.parameters) {
      Object.entries(script.parameters).forEach(([key, value]) => {
        setParameter(
          key as keyof import("../store/vslStore").VslParameters,
          value as string,
        );
      });
    }
    setLastSaved(new Date(script.createdAt));
    toast.success(`Wczytano wersję z dnia ${new Date(script.createdAt).toLocaleString()}`);
    setIsHistoryModalOpen(false);
  };

  const deletePreviousScript = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Czy na pewno chcesz usunąć tę wersję skryptu z historii Firestore?")) {
      return;
    }
    try {
      await deleteDoc(doc(db, "vsl_scripts", id));
      toast.success("Pomyślnie usunięto wersję skryptu.");
      await fetchPreviousScripts();
    } catch (err: any) {
      console.error("Failed to delete script:", err);
      try {
        handleFirestoreError(err, "delete", `vsl_scripts/${id}`, "VslScript");
      } catch (logErr) {
        console.warn("Firestore error logged:", logErr);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchPreviousScripts();
      } else {
        setPreviousScripts([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>("");
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [speechPitch, setSpeechPitch] = useState<number>(0.8);
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    const populateVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      setVoices(allVoices);
      const defaultVoice = allVoices.find((v) => v.lang.startsWith("pl"));
      if (defaultVoice) {
        setSelectedVoiceURI(defaultVoice.voiceURI);
      } else if (allVoices.length > 0) {
        setSelectedVoiceURI(allVoices[0].voiceURI);
      }
    };

    populateVoices();
    window.speechSynthesis.onvoiceschanged = populateVoices;
  }, []);

  const handleToggleSpeakPart = (index: number) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      toast.error("Odtwarzanie mowy nie jest obsługiwane przez Twoją przeglądarkę.");
      return;
    }

    if (speakingIdx === index) {
      window.speechSynthesis.cancel();
      setSpeakingIdx(null);
    } else {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setSpeakingIdx(index);
      const utterance = new SpeechSynthesisUtterance(scriptParts[index].text);
      if (selectedVoiceURI && voices.length > 0) {
        const activeVoice = voices.find((v) => v.voiceURI === selectedVoiceURI);
        if (activeVoice) {
          utterance.voice = activeVoice;
          utterance.lang = activeVoice.lang;
        } else {
          utterance.lang = "pl-PL";
        }
      } else {
        utterance.lang = "pl-PL";
      }

      utterance.rate = speechRate;
      utterance.pitch = speechPitch;
      utterance.volume = volume;

      utterance.onend = () => {
        setSpeakingIdx(null);
      };

      utterance.onerror = (e) => {
        if (e.error !== "interrupted") {
          setSpeakingIdx(null);
        }
      };

      window.speechSynthesis.speak(utterance);
    }
  };

  const handleGenerateOutreach = async () => {
    if (!outreachClientName.trim()) {
      toast.error("Wprowadź nazwę klienta.");
      return;
    }
    
    setIsGeneratingOutreach(true);
    setGeneratedOutreach(null);
    try {
      const response = await fetch("/api/generate-outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vslScript: scriptParts,
          clientName: outreachClientName,
          clientEmail: outreachClientEmail,
          productName: parameters.productName,
          targetAudience: parameters.targetAudience,
          mainProblem: parameters.mainProblem,
          keyBenefits: parameters.keyBenefits
        })
      });
      
      if (!response.ok) {
        throw new Error("Błąd podczas generowania outreach.");
      }
      
      const data = await response.json();
      setGeneratedOutreach(data);
      toast.success("Spersonalizowana sekwencja outreach została wygenerowana!");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Błąd sieci.");
    } finally {
      setIsGeneratingOutreach(false);
    }
  };

  const handleSendAndCreateClient = async () => {
    if (!outreachClientName.trim() || !outreachClientEmail.trim()) {
      toast.error("Wprowadź e-mail oraz nazwę klienta.");
      return;
    }
    if (!generatedOutreach) {
      toast.error("Wygeneruj najpierw sekwencję outreach.");
      return;
    }
    
    setIsSendingOutreach(true);
    try {
      const currentUserId = auth.currentUser?.uid;
      if (!currentUserId) {
        throw new Error("Musisz być zalogowany, aby dodać klienta.");
      }
      
      await addDoc(collection(db, "clients"), {
        userId: currentUserId,
        name: outreachClientName,
        email: outreachClientEmail,
        status: "Oczekujący",
        createdAt: new Date().toISOString()
      });
      
      toast.success("Klient został zarejestrowany w CRM Zapalnik i GmailIntegration!");
      
      const token = getAccessToken();
      if (token) {
        const emailLines = [
          `To: ${outreachClientEmail}`,
          "Content-type: text/html;charset=utf-8",
          "MIME-Version: 1.0",
          `Subject: ${generatedOutreach.subject}`,
          "",
          generatedOutreach.body
        ];
        
        const email = emailLines.join("\r\n");
        const base64EncodedEmail = btoa(unescape(encodeURIComponent(email)))
          .replace(/\+/g, "-")
          .replace(/\//g, "_");
          
        const gmailResponse = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ raw: base64EncodedEmail })
        });
        
        if (!gmailResponse.ok) {
          throw new Error("CRM zarejestrowany, lecz wysyłka e-mail nie powiodła się. Sprawdź autoryzację Gmail.");
        }
        
        toast.success("Kampania outreach została wysłana pomyślnie z Twojego Gmaila!");
      } else {
        toast.info("Zarejestrowano klienta! Aby automatycznie wysłać e-mail, zaloguj się do Google Workspace (u góry strony GmailIntegration).");
      }
      
      setOutreachClientName("");
      setOutreachClientEmail("");
      setGeneratedOutreach(null);
      setIsOutreachModalOpen(false);
      
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd.");
    } finally {
      setIsSendingOutreach(false);
    }
  };

  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => {
        setGoogleUser(user);
      },
      () => {
        setGoogleUser(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const backupToGoogleDrive = async (parts: ScriptPart[]) => {
    const token = getAccessToken();
    if (!token) {
      setBackupStatus("Brak autoryzacji Google Drive - zaloguj się");
      return;
    }

    setIsBackingUp(true);
    setBackupStatus("Tworzenie kopii zapasowej na Google Drive...");
    const toastId = toast.loading("Tworzenie kopii zapasowej na Google Drive...");

    try {
      const fileName = `vsl-backup-${parameters.productName ? parameters.productName.replace(/[^a-zA-Z0-9]/g, "-") : "skrypt"}-${new Date().toISOString().slice(0, 10)}.json`;
      
      const fileData = {
        topic,
        parameters,
        globalKeywords,
        scriptParts: parts,
        backupTime: new Date().toISOString(),
      };

      const boundary = "vsl_backup_boundary_xyz";
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;

      const metadata = {
        name: fileName,
        mimeType: "application/json",
      };

      const body = 
        delimiter +
        "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
        JSON.stringify(metadata) +
        delimiter +
        "Content-Type: application/json\r\n\r\n" +
        JSON.stringify(fileData, null, 2) +
        closeDelimiter;

      const response = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": `multipart/related; boundary=${boundary}`,
          },
          body: body,
        }
      );

      const resData = await response.json();
      if (!response.ok || resData.error) {
        throw new Error(resData.error?.message || "Błąd API Google Drive");
      }

      setBackupStatus("Kopia zapasowa utworzona pomyślnie!");
      toast.success("Kopia zapasowa VSL pomyślnie zapisana na Twoim Google Drive!", { id: toastId });
    } catch (error: unknown) {
      console.error("Backup to Google Drive failed:", error);
      const errMsg = error instanceof Error ? error.message : "Błąd sieci";
      setBackupStatus(`Błąd kopii zapasowej: ${errMsg}`);
      toast.error(`Nie udało się zapisać kopii na Google Drive: ${errMsg}`, { id: toastId });
    } finally {
      setIsBackingUp(false);
    }
  };

  const {
    topic,
    setTopic,
    parameters,
    setParameter,
    globalKeywords,
    setGlobalKeywords,
    addGlobalKeyword,
    removeGlobalKeyword,
    generating,
    setGenerating,
    scriptParts,
    setScriptParts,
    isPreviewVisible,
    setIsPreviewVisible,
    isPlaying,
    setIsPlaying,
    currentPartIndex,
    setCurrentPartIndex,
    volume,
    setVolume,
    lastSaved,
    setLastSaved,
    viewMode,
    setViewMode,
    imageAspectRatio,
    setImageAspectRatio,
    imageVariationsCount,
    setImageVariationsCount,
    model3dStyle,
    setModel3dStyle,
    model3dFormat,
    setModel3dFormat,
    customKeywords,
    setCustomKeywords,
    updatePartVisual,
    updatePartAudio,
    updatePartText,
    appendKeyword,
    addKeywordToSuggestions,
    clearKeywordSuggestions,
    removeKeywordFromSuggestions,
    updateKeywordSuggestionCategory,
  } = useVslStore();

  const [partViewModes, setPartViewModes] = useState<
    Record<number, "list" | "storyboard">
  >({});
  const [previewModes, setPreviewModes] = useState<Record<number, "2d" | "3d">>(
    {},
  );
  const handleGenerateRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Read from ZRZUT fast-lane parameters first if present
    const zrzutTopic = localStorage.getItem("omega_zrzut_vsl_topic");
    const zrzutHook = localStorage.getItem("omega_zrzut_vsl_hook");
    if (zrzutTopic) {
      setTopic(zrzutTopic);
      if (zrzutHook) {
        setParameter("keyBenefits", `Sugerowany Hook PAS na start: ${zrzutHook}`);
      }
      setParameter("mainProblem", `Trend rynkowy "${zrzutTopic}" przejmuje inicjatywę B2B.`);
      setParameter("targetAudience", "Wydawcy social media, handlowcy, zespół marketingu");
      setParameter("productName", "System Konwersji Omega PRO");
      localStorage.removeItem("omega_zrzut_vsl_topic");
      localStorage.removeItem("omega_zrzut_vsl_hook");
      toast.success("Załadowano dane trendu operacji ZRZUT jako temat wejściowy!");
    }

    // Read from URL parameters first
    const params = new URLSearchParams(window.location.search);
    const topicFromUrl = params.get("topic");
    const nicheFromUrl = params.get("niche");
    const loopTypeFromUrl = params.get("loopType");
    const channelFromUrl = params.get("channel");
    const autoGenerate = params.get("autoGenerate") === "true";

    if (topicFromUrl) {
      setTopic(topicFromUrl);
      setParameter("mainProblem", `Niska retencja uwagi odbiorców na kanale ${channelFromUrl || 'Social Media'} w niszy ${nicheFromUrl || 'B2B'}.`);
      setParameter("targetAudience", nicheFromUrl || "klienci biznesowi");
      setParameter("productName", "System Konwersji Omega");
      setParameter("keyBenefits", `Maksymalizacja dopaminy za pomocą psychologii pętli "${loopTypeFromUrl || 'Pętla dopaminowa'}".`);
      
      if (autoGenerate) {
        // Clean URL params so they don't block or loop
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, "", cleanUrl);
        
        setTimeout(() => {
          handleGenerateRef.current?.();
        }, 600);
      }
    }

    const savedDraft = localStorage.getItem("vslGeneratorDraft");
    if (savedDraft && !topicFromUrl) {
      setTimeout(() => {
        try {
          const {
            topic: savedTopic,
            parameters: savedParams,
            scriptParts: savedParts,
            globalKeywords: savedKeywords,
            timestamp,
          } = JSON.parse(savedDraft);
          if (savedTopic) setTopic(savedTopic);
          if (savedParams) {
            Object.entries(savedParams).forEach(([key, value]) => {
              setParameter(
                key as keyof import("../store/vslStore").VslParameters,
                value as string,
              );
            });
          }
          if (savedKeywords) setGlobalKeywords(savedKeywords);
          if (savedParts) setScriptParts(savedParts);
          if (timestamp) setLastSaved(new Date(timestamp));
        } catch (error) {
          console.error("Failed to parse saved draft", error);
        }
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setTopic, setScriptParts, setLastSaved, setParameter, setGlobalKeywords]);

  const handleManualSave = () => {
    if (topic || scriptParts.length > 0 || globalKeywords.length > 0) {
      const timestampStr = new Date().toISOString();
      localStorage.setItem(
        "vslGeneratorDraft",
        JSON.stringify({
          topic,
          parameters,
          globalKeywords,
          scriptParts,
          timestamp: timestampStr,
        }),
      );
      setLastSaved(new Date(timestampStr));
      
      // Auto-save history snapshot to Firestore
      saveScriptToFirestore(topic, scriptParts);
      
      toast.success("Zapisano kopie draftu lokalnie oraz historię w chmurze Firestore!");
    } else {
      toast.error("Nic do zapisania");
    }
  };

  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (topic || scriptParts.length > 0 || globalKeywords.length > 0) {
        const timestampStr = new Date().toISOString();
        localStorage.setItem(
          "vslGeneratorDraft",
          JSON.stringify({
            topic,
            parameters,
            globalKeywords,
            scriptParts,
            timestamp: timestampStr,
          }),
        );
        setLastSaved(new Date(timestampStr));
      }
    }, 15000);

    return () => clearInterval(autoSaveInterval);
  }, [topic, parameters, globalKeywords, scriptParts, setLastSaved]);

  async function handleGenerate() {
    const newErrors: typeof errors = {};
    if (!topic?.trim())
      newErrors.topic = "Ból Docelowego Klienta jest wymagany.";
    if (!parameters.productName?.trim())
      newErrors.productName = "Nazwa Produktu jest wymagana.";
    if (!parameters.targetAudience?.trim())
      newErrors.targetAudience = "Grupa Docelowa jest wymagana.";
    if (!parameters.mainProblem?.trim())
      newErrors.mainProblem = "Główny Problem Klienta jest wymagany.";
    if (!parameters.keyBenefits?.trim())
      newErrors.keyBenefits = "Kluczowe Korzyści są wymagane.";

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error(
        "Uzupełnij wymagane pola (zaznaczone na czerwono) przed generowaniem skryptu",
        { duration: 4000 },
      );
      return;
    }

    setGenerating(true);
    setScriptParts([]);
    setIsPreviewVisible(false);
    setIsPlaying(false);
    setCurrentPartIndex(0);
    window.speechSynthesis.cancel();

    // Zastępowanie parametrów
    const productName = parameters.productName || "Nasz Produkt";
    const targetAudience = parameters.targetAudience || "klienci";
    const mainProblem = parameters.mainProblem || "Tracisz klientów";
    const keyBenefits =
      parameters.keyBenefits || "automatyzacja i zwiększenie zysków";
    const videoQuality = parameters.videoQuality || "1080p";

    try {
      const response = await fetch("/api/generate-vsl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          productName,
          targetAudience,
          mainProblem,
          keyBenefits,
          videoQuality,
        }),
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let data: any;
      let isJson = false;
      try {
        data = await response.json();
        isJson = true;
      } catch (parseError) {
        console.warn("Nie udało się rzutować odpowiedzi na JSON", parseError);
      }

      if (
        response.ok &&
        isJson &&
        data.scriptParts &&
        Array.isArray(data.scriptParts)
      ) {
        setScriptParts(data.scriptParts);
        toast.success("Skrypt został wygenerowany pomyślnie i zapisany automatycznie w historii Firestore");

        // Save generated version directly to Firestore
        saveScriptToFirestore(topic, data.scriptParts);
        
        // Log action
        logAction("VSL Generator", "Generowanie skryptu VSL", `Wygenerowano skrypt VSL dla tematu "${topic.slice(0, 100)}" o ${data.scriptParts.length} częściach.`);

        if (autoBackupEnabled) {
          const driveToken = getAccessToken();
          if (driveToken) {
            backupToGoogleDrive(data.scriptParts);
          } else {
            setBackupStatus("Pominięto kopię zapasową Drive (brak zalogowania)");
            toast.info("Zaloguj się do Google Drive, aby automatycznie tworzyć kopie zapasowe.", {
              duration: 5000,
            });
          }
        }
      } else {
        const errorDetail = isJson && data?.details ? ` (${data.details})` : "";
        let errorMessage =
          isJson && data?.error ? `${data.error}${errorDetail}` : null;

        if (!errorMessage) {
          if (response.status === 429) {
            errorMessage =
              "Przekroczono limit zapytań do API (Rate Limit). Spróbuj ponownie za chwilę.";
          } else if (response.status === 401 || response.status === 403) {
            errorMessage =
              "Brak autoryzacji. Prawdopodobnie niepoprawny klucz API.";
          } else if (response.status >= 500) {
            errorMessage = `Błąd serwera podczas generowania skryptu (${response.status}).`;
          } else if (!response.ok) {
            errorMessage = `Błąd HTTP ${response.status}: ${response.statusText || "Nieznany błąd"}`;
          } else {
            errorMessage = "Wystąpił nieznany błąd podczas generowania.";
          }
        }

        console.error(
          `Failed to generate VSL [${response.status}]:`,
          isJson ? data : response.statusText,
        );
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Error calling generate-vsl API:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Nieznany błąd sieci lub serwera.";
      toast.error(`Błąd połączenia: ${errorMessage}`);
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    handleGenerateRef.current = handleGenerate;
  });

  const fetchWithRetry = async (
    url: string,
    options: RequestInit,
    retries = 3,
    backoff = 1000,
  ): Promise<Response> => {
    try {
      const response = await fetch(url, options);
      if (!response.ok && retries > 0) {
        await new Promise((res) => setTimeout(res, backoff));
        return fetchWithRetry(url, options, retries - 1, backoff * 2);
      }
      return response;
    } catch (err) {
      if (retries > 0) {
        await new Promise((res) => setTimeout(res, backoff));
        return fetchWithRetry(url, options, retries - 1, backoff * 2);
      }
      throw err;
    }
  };

  const handleSuggestKeywords = async (index: number) => {
    const part = scriptParts[index];
    if (!part.visual) return;

    setScriptParts((prev) => {
      const newParts = [...prev];
      newParts[index] = { ...newParts[index], isGeneratingKeywords: true };
      return newParts;
    });

    try {
      const response = await fetch("/api/suggest-keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: part.visual, globalKeywords }),
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let data: any;
      let isJson = false;
      try {
        data = await response.json();
        isJson = true;
      } catch (parseError) {
        console.warn("Nie udało się rzutować odpowiedzi na JSON", parseError);
      }

      if (
        response.ok &&
        isJson &&
        data.keywords &&
        Array.isArray(data.keywords)
      ) {
        setScriptParts((prev) => {
          const newParts = [...prev];
          newParts[index] = {
            ...newParts[index],
            keywordSuggestions: data.keywords,
            isGeneratingKeywords: false,
          };
          return newParts;
        });
        toast.success("Sugestie słów kluczowych wygenerowane");
      } else {
        const errorDetail = isJson && data?.details ? ` (${data.details})` : "";
        let errorMessage =
          isJson && data?.error ? `${data.error}${errorDetail}` : null;

        if (!errorMessage) {
          if (response.status === 429) {
            errorMessage =
              "Przekroczono limit zapytań do API (Rate Limit). Spróbuj ponownie za chwilę.";
          } else if (response.status === 401 || response.status === 403) {
            errorMessage =
              "Brak autoryzacji. Prawdopodobnie niepoprawny klucz API.";
          } else if (response.status >= 500) {
            errorMessage = `Błąd serwera podczas generowania sugestii (${response.status}).`;
          } else if (!response.ok) {
            errorMessage = `Błąd HTTP ${response.status}: ${response.statusText || "Nieznany błąd"}`;
          } else {
            errorMessage = "Wystąpił nieznany błąd podczas generowania.";
          }
        }

        console.error(
          `Failed to suggest keywords [${response.status}]:`,
          isJson ? data : response.statusText,
        );
        toast.error(errorMessage);
        setScriptParts((prev) => {
          const newParts = [...prev];
          newParts[index] = { ...newParts[index], isGeneratingKeywords: false };
          return newParts;
        });
      }
    } catch (e) {
      console.error("Network error suggesting keywords:", e);
      const errorMessage =
        e instanceof Error ? e.message : "Nieznany błąd sieci lub serwera.";
      toast.error(`Błąd połączenia: ${errorMessage}`);
      setScriptParts((prev) => {
        const newParts = [...prev];
        newParts[index] = { ...newParts[index], isGeneratingKeywords: false };
        return newParts;
      });
    }
  };

  const handleGenerateVisualPrompt = async (
    index: number,
    usePain: boolean = true,
  ) => {
    const part = scriptParts[index];
    const pain = usePain ? parameters.mainProblem : "";

    if (usePain && (!pain || pain.trim() === "")) {
      toast.error(
        'Najpierw wypełnij pole "Główny Problem Klienta / Zapalnik" w parametrach',
      );
      return;
    }

    setScriptParts((prev) => {
      const newParts = [...prev];
      newParts[index] = {
        ...newParts[index],
        isGeneratingAdvancedPrompt: true,
      };
      return newParts;
    });

    try {
      const response = await fetch("/api/generate-advanced-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pain,
          context: part.text || part.audio || part.type,
          globalKeywords,
          existingPrompt: part.visual,
        }),
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let data: any;
      let isJson = false;
      try {
        data = await response.json();
        isJson = true;
      } catch (parseError) {
        console.warn("Nie udało się rzutować odpowiedzi na JSON", parseError);
      }

      if (response.ok && isJson && data.prompt) {
        setScriptParts((prev) => {
          const newParts = [...prev];
          newParts[index] = {
            ...newParts[index],
            visual: data.prompt,
            isGeneratingAdvancedPrompt: false,
          };
          return newParts;
        });
        toast.success("Unikalny prompt wizualny został wygenerowany pomyślnie");
      } else {
        const errorDetail = isJson && data?.details ? ` (${data.details})` : "";
        let errorMessage =
          isJson && data?.error ? `${data.error}${errorDetail}` : null;

        if (!errorMessage) {
          if (response.status === 429) {
            errorMessage =
              "Przekroczono limit zapytań do API (Rate Limit). Spróbuj ponownie za chwilę.";
          } else if (response.status === 401 || response.status === 403) {
            errorMessage =
              "Brak autoryzacji. Prawdopodobnie niepoprawny klucz API.";
          } else if (response.status >= 500) {
            errorMessage = `Błąd serwera podczas generowania prompta (${response.status}).`;
          } else if (!response.ok) {
            errorMessage = `Błąd HTTP ${response.status}: ${response.statusText || "Nieznany błąd"}`;
          } else {
            errorMessage = "Wystąpił nieznany błąd podczas generowania.";
          }
        }

        console.error(
          `Failed to generate advanced prompt [${response.status}]:`,
          isJson ? data : response.statusText,
        );
        toast.error(errorMessage);
        setScriptParts((prev) => {
          const newParts = [...prev];
          newParts[index] = {
            ...newParts[index],
            isGeneratingAdvancedPrompt: false,
          };
          return newParts;
        });
      }
    } catch (e) {
      console.error("Network error generating advanced prompt:", e);
      const errorMessage =
        e instanceof Error ? e.message : "Nieznany błąd sieci lub serwera.";
      toast.error(`Błąd połączenia: ${errorMessage}`);
      setScriptParts((prev) => {
        const newParts = [...prev];
        newParts[index] = {
          ...newParts[index],
          isGeneratingAdvancedPrompt: false,
        };
        return newParts;
      });
    }
  };

  const executeImageGeneration = async (
    index: number,
    options?: { aspectRatio?: string; variations?: number },
  ) => {
    const part = scriptParts[index];
    setScriptParts((prev) => {
      const newParts = [...prev];
      newParts[index] = {
        ...newParts[index],
        isGeneratingImage: true,
        imageError: undefined,
      };
      return newParts;
    });

    try {
      const finalPrompt =
        globalKeywords.length > 0
          ? `${part.visual}, ${globalKeywords.join(", ")}`
          : part.visual;

      const response = await fetchWithRetry("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: finalPrompt,
          aspectRatio: options?.aspectRatio || imageAspectRatio,
          numberOfImages: options?.variations || imageVariationsCount,
        }),
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let data: any;
      let isJson = false;
      try {
        data = await response.json();
        isJson = true;
      } catch (parseError) {
        console.warn("Nie udało się rzutować odpowiedzi na JSON", parseError);
      }

      if (
        response.ok &&
        isJson &&
        data.imageUrls &&
        data.imageUrls.length > 0
      ) {
        setScriptParts((prev) => {
          const newParts = [...prev];
          newParts[index] = {
            ...newParts[index],
            imageUrl: data.imageUrls[0], // Keep active image
            imageVariations: data.imageUrls,
            isGeneratingImage: false,
          };
          return newParts;
        });
        toast.success(
          `Warianty obrazu (${data.imageUrls.length}) zostały pomyślnie wygenerowane`,
        );
      } else {
        const errorDetail = isJson && data?.details ? ` (${data.details})` : "";
        let errorMessage =
          isJson && data?.error ? `${data.error}${errorDetail}` : null;

        if (!errorMessage) {
          if (response.status === 429) {
            errorMessage =
              "Przekroczono limit zapytań do API (Rate Limit). Spróbuj ponownie za chwilę.";
          } else if (response.status === 401 || response.status === 403) {
            errorMessage =
              "Brak autoryzacji. Prawdopodobnie niepoprawny lub brakujący klucz API.";
          } else if (response.status >= 500) {
            errorMessage = `Błąd serwera podczas generowania obrazka (${response.status}).`;
          } else if (!response.ok) {
            errorMessage = `Błąd HTTP ${response.status}: ${response.statusText || "Nieznany błąd"}`;
          } else {
            errorMessage =
              "Wystąpił błąd: nieotrzymano poprawnego adresu URL obrazka.";
          }
        }

        console.error(
          `Failed to generate image [${response.status}]:`,
          isJson ? data : response.statusText,
        );
        toast.error(errorMessage);
        setScriptParts((prev) => {
          const newParts = [...prev];
          newParts[index] = {
            ...newParts[index],
            isGeneratingImage: false,
            imageError: errorMessage,
          };
          return newParts;
        });
        throw new Error(errorMessage);
      }
    } catch (e) {
      console.error(e);
      const errorMessage =
        e instanceof Error ? e.message : "Nieznany błąd sieci lub serwera.";
      toast.error(errorMessage);
      setScriptParts((prev) => {
        const newParts = [...prev];
        newParts[index] = {
          ...newParts[index],
          isGeneratingImage: false,
          imageError: errorMessage,
        };
        return newParts;
      });
      throw e;
    }
  };

  const execute3DGeneration = async (
    index: number,
    options?: { style?: string; format?: string },
  ) => {
    const part = scriptParts[index];

    // Set loading state for this specific 3D model
    setScriptParts((prev) => {
      const newParts = [...prev];
      newParts[index] = {
        ...newParts[index],
        isGenerating3D: true,
        model3dError: undefined,
      };
      return newParts;
    });

    try {
      const finalPrompt =
        globalKeywords.length > 0
          ? `${part.visual}, ${globalKeywords.join(", ")}`
          : part.visual;

      const response = await fetchWithRetry(
        "/api/generate-3d",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: finalPrompt,
            artStyle: options?.style || model3dStyle,
            exportFormat: options?.format || model3dFormat,
          }),
        },
        0,
      ); // No retries for 3D as it's long-running and might duplicate tasks

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let data: any;
      let isJson = false;
      try {
        data = await response.json();
        isJson = true;
      } catch (parseError) {
        console.warn("Nie udało się rzutować odpowiedzi na JSON", parseError);
      }

      if (response.ok && isJson && data.modelUrl) {
        setScriptParts((prev) => {
          const newParts = [...prev];
          newParts[index] = {
            ...newParts[index],
            model3dUrl: data.modelUrl,
            preview3dUrl: data.previewUrl || data.modelUrl,
            isGenerating3D: false,
          };
          return newParts;
        });
        toast.success("Model 3D wygenerowany i gotowy");
      } else {
        const errorDetail = isJson && data?.details ? ` (${data.details})` : "";
        let errorMessage =
          isJson && data?.error ? `${data.error}${errorDetail}` : null;

        if (!errorMessage) {
          if (response.status === 429) {
            errorMessage =
              "Przekroczono limit zapytań do API (Rate Limit). Spróbuj ponownie za chwilę.";
          } else if (response.status === 401 || response.status === 403) {
            errorMessage =
              "Brak autoryzacji. Prawdopodobnie niepoprawny lub brakujący klucz API.";
          } else if (response.status >= 500) {
            errorMessage = `Błąd serwera podczas generowania modelu 3D (${response.status}).`;
          } else if (!response.ok) {
            errorMessage = `Błąd HTTP ${response.status}: ${response.statusText || "Nieznany błąd"}`;
          } else {
            errorMessage =
              "Wystąpił błąd: nieotrzymano poprawnego adresu URL modelu 3D.";
          }
        }

        console.error(
          `Failed to generate 3D model [${response.status}]:`,
          isJson ? data : response.statusText,
        );
        toast.error(errorMessage);
        setScriptParts((prev) => {
          const newParts = [...prev];
          newParts[index] = {
            ...newParts[index],
            isGenerating3D: false,
            model3dError: errorMessage,
          };
          return newParts;
        });
        throw new Error(errorMessage);
      }
    } catch (e) {
      console.error(e);
      const errorMessage =
        e instanceof Error ? e.message : "Nieznany błąd sieci lub serwera.";
      toast.error(errorMessage);
      setScriptParts((prev) => {
        const newParts = [...prev];
        newParts[index] = {
          ...newParts[index],
          isGenerating3D: false,
          model3dError: errorMessage,
        };
        return newParts;
      });
      throw e;
    }
  };

  const handleGenerateImage = (
    index: number,
    options?: { aspectRatio?: string; variations?: number },
    suppressToast?: boolean,
  ) => {
    const finalPrompt =
      globalKeywords.length > 0
        ? `${scriptParts[index].visual}, ${globalKeywords.join(", ")}`
        : scriptParts[index].visual;

    useVslStore.getState().enqueueTask({
      partIndex: index,
      type: "image",
      priority: 0,
      prompt: finalPrompt,
      options: options || {
        aspectRatio: "16:9",
        variations: imageVariationsCount,
      },
    });
    if (!suppressToast) {
      toast.success("Zadanie generowania obrazu dodane do kolejki");
    }
  };

  const handleGenerate3D = (
    index: number,
    options?: { style?: string; format?: string },
    suppressToast?: boolean,
  ) => {
    useVslStore.getState().enqueueTask({
      partIndex: index,
      type: "3d",
      priority: 0,
      prompt: scriptParts[index].visual,
      options: options || { style: model3dStyle, format: model3dFormat },
    });
    if (!suppressToast) {
      toast.success("Zadanie generowania modelu 3D dodane do kolejki");
    }
  };

  const handleGenerateAllImages = () => {
    let tasksAdded = 0;
    for (let i = 0; i < scriptParts.length; i++) {
      if (!scriptParts[i].imageUrl && !scriptParts[i].isGeneratingImage) {
        handleGenerateImage(
          i,
          { aspectRatio: "16:9", variations: imageVariationsCount },
          true,
        );
        tasksAdded++;
      }
    }
    if (tasksAdded > 0) {
      toast.success(
        `Dodano ${tasksAdded} zadań generowania obrazów do kolejki`,
      );
    } else {
      toast.info("Wszystkie klatki mają już przetwarzane lub gotowe obrazy");
    }
  };

  const handleGenerateAll3D = () => {
    let tasksAdded = 0;
    for (let i = 0; i < scriptParts.length; i++) {
      if (!scriptParts[i].model3dUrl && !scriptParts[i].isGenerating3D) {
        handleGenerate3D(
          i,
          { style: model3dStyle, format: model3dFormat },
          true,
        );
        tasksAdded++;
      }
    }
    if (tasksAdded > 0) {
      toast.success(
        `Dodano ${tasksAdded} zadań generowania modeli 3D do kolejki`,
      );
    } else {
      toast.info("Wszystkie klatki mają już przetwarzane lub gotowe modele 3D");
    }
  };

  // Task Processing Logic
  const tasks = useVslStore((state) => state.tasks);
  const pendingTasks = tasks.filter((t) => t.status === "pending");
  const processingTasks = tasks.filter((t) => t.status === "processing");

  const isGeneratingAllImages =
    tasks.some(
      (t) =>
        t.type === "image" &&
        (t.status === "pending" || t.status === "processing"),
    ) || scriptParts.some((p) => p.isGeneratingImage);
  const isGeneratingAll3D =
    tasks.some(
      (t) =>
        t.type === "3d" &&
        (t.status === "pending" || t.status === "processing"),
    ) || scriptParts.some((p) => p.isGenerating3D);

  useEffect(() => {
    // limit concurrency to 2
    if (processingTasks.length < 2 && pendingTasks.length > 0) {
      const taskToRun = pendingTasks[0];
      const executeTask = async () => {
        useVslStore.getState().updateTaskStatus(taskToRun.id, "processing");
        useVslStore.getState().updateTaskProgress(taskToRun.id, 0);
        try {
          if (taskToRun.type === "image") {
            await executeImageGeneration(
              taskToRun.partIndex,
              taskToRun.options,
            );
          } else if (taskToRun.type === "3d") {
            await execute3DGeneration(taskToRun.partIndex, taskToRun.options);
          } else if (taskToRun.type === "text") {
            await new Promise((resolve) => setTimeout(resolve, 3000));
            // Dla tekstury demo kończymy ze statusem completed i pokazujemy toasta.
            // Prawdziwa aplikacja zaktualizowałaby pole tekstu.
            toast.success(
              "✅ Content Engine: Zadanie tekstowe wygenerowane pomyślnie.",
            );
          }
          useVslStore.getState().updateTaskStatus(taskToRun.id, "completed");
          useVslStore.getState().updateTaskProgress(taskToRun.id, 100);
        } catch (e) {
          useVslStore
            .getState()
            .updateTaskStatus(
              taskToRun.id,
              "failed",
              e instanceof Error ? e.message : "Unknown error",
            );
        }
      };
      executeTask();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, pendingTasks, processingTasks]);

  useEffect(() => {
    const interval = setInterval(() => {
      const state = useVslStore.getState();
      const processing = state.tasks.filter((t) => t.status === "processing");
      processing.forEach((t) => {
        const currentProgress = t.progress || 0;
        if (currentProgress < 90) {
          state.updateTaskProgress(
            t.id,
            currentProgress + (t.type === "3d" ? 2 : 5),
          );
        }
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const exportScript = (format: "txt" | "md" | "json") => {
    let content = "";
    let mimeType = "text/plain";
    let filename = `vsl_script_${new Date().toISOString().split("T")[0]}`;

    if (format === "json") {
      content = JSON.stringify(scriptParts, null, 2);
      mimeType = "application/json";
      filename += ".json";
    } else if (format === "md") {
      content = `# VSL Script: ${topic}\n\n`;
      scriptParts.forEach((part, index) => {
        content += `## Part ${index + 1}: ${part.type} (${part.time})\n\n`;
        content += `**Visual Prompt:** ${part.visual}\n\n`;
        content += `**Audio/SFX:** ${part.audio}\n\n`;
        content += `**Voiceover:** "${part.text}"\n\n`;
        content += `---\n\n`;
      });
      mimeType = "text/markdown";
      filename += ".md";
    } else {
      content = `VSL Script: ${topic}\n\n`;
      scriptParts.forEach((part, index) => {
        content += `[Part ${index + 1}: ${part.type} | ${part.time}]\n`;
        content += `VISUAL: ${part.visual}\n`;
        content += `AUDIO: ${part.audio}\n`;
        content += `VOICEOVER: ${part.text}\n\n`;
      });
      filename += ".txt";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Pomyślnie wyeksportowano skrypt");
  };

  const exportAudio = async () => {
    if (!scriptParts || scriptParts.length === 0) {
      toast.error("Brak skryptu do eksportu.");
      return;
    }

    setIsExportingAudio(true);
    const toastId = toast.loading("Syntetyzowanie i generowanie pliku audio MP3...");

    try {
      let clientLang = "pl";
      if (selectedVoiceURI && voices.length > 0) {
        const activeVoice = voices.find((v) => v.voiceURI === selectedVoiceURI);
        if (activeVoice && activeVoice.lang) {
          clientLang = activeVoice.lang.split("-")[0];
        }
      }

      const textParts = scriptParts.map((part) => part.text);

      const response = await fetch("/api/vsl/export-audio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          textParts,
          lang: clientLang,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Błąd podczas generowania audio.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vsl_audio_${new Date().toISOString().split("T")[0]}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Pomyślnie wyeksportowano plik audio MP3!", { id: toastId });
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Nie udało się wyeksportować audio.", { id: toastId });
    } finally {
      setIsExportingAudio(false);
    }
  };

  const exportSingleAudio = async (index: number) => {
    if (!scriptParts || !scriptParts[index]) {
      toast.error("Brak wybranego fragmentu do eksportu.");
      return;
    }

    setExportingPartIdx(index);
    const toastId = toast.loading(`Syntetyzowanie fragmentu ${index + 1} jako MP3...`);

    try {
      let clientLang = "pl";
      if (selectedVoiceURI && voices.length > 0) {
        const activeVoice = voices.find((v) => v.voiceURI === selectedVoiceURI);
        if (activeVoice && activeVoice.lang) {
          clientLang = activeVoice.lang.split("-")[0];
        }
      }

      const response = await fetch("/api/vsl/export-audio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          textParts: [scriptParts[index].text],
          lang: clientLang,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Błąd podczas generowania audio.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vsl_part_${index + 1}_${new Date().toISOString().split("T")[0]}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Wyeksportowano fragment ${index + 1} pomyślnie!`, { id: toastId });
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Nie udało się wyeksportować fragmentu audio.", { id: toastId });
    } finally {
      setExportingPartIdx(null);
    }
  };

  useEffect(() => {
    if (!isPlaying) {
      window.speechSynthesis.cancel();
      return;
    }

    if (currentPartIndex >= scriptParts.length) {
      setTimeout(() => {
        setIsPlaying(false);
        setCurrentPartIndex(0);
      }, 0);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(
      scriptParts[currentPartIndex].text,
    );

    if (selectedVoiceURI && voices.length > 0) {
      const activeVoice = voices.find((v) => v.voiceURI === selectedVoiceURI);
      if (activeVoice) {
        utterance.voice = activeVoice;
        utterance.lang = activeVoice.lang;
      } else {
        utterance.lang = "pl-PL";
      }
    } else {
      utterance.lang = "pl-PL";
    }

    utterance.rate = speechRate;
    utterance.pitch = speechPitch;
    utterance.volume = volume;

    utterance.onend = () => {
      setCurrentPartIndex((prev) => prev + 1);
    };

    utterance.onerror = (e) => {
      if (e.error !== "interrupted") {
        setIsPlaying(false);
      }
    };

    window.speechSynthesis.speak(utterance);

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [
    isPlaying,
    currentPartIndex,
    scriptParts,
    volume,
    setCurrentPartIndex,
    setIsPlaying,
    selectedVoiceURI,
    voices,
    speechRate,
    speechPitch,
  ]);

  const togglePlayback = () => {
    setSpeakingIdx(null); // Cancel any single active part speech
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      if (currentPartIndex >= scriptParts.length) {
        setCurrentPartIndex(0);
      }
      setIsPlaying(true);
    }
  };

  const handleLoadProPreset = () => {
    setTopic(
      "Drastycznie rosnący koszt pozyskania klienta (CAC) i całkowite wypalenie dotychczasowych lejków sprzedażowych. Mimo pompowania dziesiątek tysięcy złotych w reklamy Meta, leady są absurdalnie zimne, nie stawiają się na calle, a ci którzy przychodzą, nieustannie narzekają na cenę i porównują Cię z najtańszą konkurencją. Rosnąca frustracja i poczucie bycia zakładnikiem kapryśnych algorytmów oraz nieprzewidywalnego cash-flow.",
    );
    setParameter(
      "productName",
      "System Neuro-Conversion AI (lub Omega Protocol)",
    );
    setParameter(
      "targetAudience",
      "Founderzy SaaS-ów, właściciele skalujących się agencji B2B oraz High-Ticket Coachowie (generujący min. 50k-100k PLN/mc), którzy utknęli pod szklanym sufitem skalowania i są fizycznie wycieńczeni ciągłym »gaszeniem pożarów« na back-endzie.",
    );
    setParameter(
      "mainProblem",
      "Brak absolutnie przewidywalnego, zautomatyzowanego ekosystemu, który edukuje, indoktrynuje i »podgrzewa do czerwoności« leada na etapie pre-sellingu. Przez tę dziurę w lejku zmuszeni są walczyć o uwagę i ręcznie dopinać deale z niezakwalifikowanymi osobami, co niszczy ich marże.",
    );
    setParameter(
      "keyBenefits",
      "Hiper-personalizacja tworząca gotowych do zakupu ewangelistów marki w zaledwie 48 godzin przy pomocy multimodalnych agentów AI. Obniżenie kosztu pozyskania (CPA) o 60%, odzyskanie 20 godzin pracy w tygodniu i bezwarunkowe przywrócenie poczucia absolutnej kontroli nad wzrostem firmy.",
    );

    const kwStr =
      "cinematic lighting, hyper-realistic, dark moody atmosphere, deep neon crimson accents, corporate thriller aesthetic, extreme contrast, anamorphic lens flare, 8k, photorealistic, shadow play";
    setGlobalKeywords(kwStr.split(",").map((k) => k.trim()));
    toast.success("Załadowano Preset Absolutnego PRO!");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Video className="text-rose-500" size={32} />
            Kwantowy Generator VSL
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            Zautomatyzowane tworzenie angażujących skryptów Video Sales Letters
            (Dark Patterns, Cognitive Shock).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsTrendsModalOpen(true)}
            className="text-xs px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-full flex items-center gap-1.5 transition-colors font-medium shadow-[0_0_10px_rgba(99,102,241,0.1)]"
          >
            <TrendingUp size={14} />
            Trendy AI
          </button>
          <button
            onClick={handleLoadProPreset}
            className="text-xs px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-full flex items-center gap-1.5 transition-colors font-medium shadow-[0_0_10px_rgba(225,29,72,0.1)]"
          >
            <Sparkles size={14} />
            Preset PRO
          </button>

          {/* Autozapis na Google Drive */}
          <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-full select-none">
            {googleUser ? (
              <div className="flex items-center gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <CloudUpload size={14} className="text-emerald-500" />
                  <span>Google Drive kopia</span>
                </div>
                <div className="border-l border-neutral-800 h-3" />
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !autoBackupEnabled;
                    setAutoBackupEnabled(nextVal);
                    toast.success(nextVal ? "Włączono automatyczną kopię zapasową" : "Wyłączono automatyczną kopię zapasową");
                  }}
                  className={`text-[10px] font-semibold px-1 py-0.5 rounded transition-all ${autoBackupEnabled ? "text-rose-400 hover:text-rose-300" : "text-neutral-500 hover:text-neutral-400"}`}
                  title="Kliknij, aby zmienić tryb"
                >
                  {autoBackupEnabled ? "AUTO: WŁ" : "AUTO: WYŁ"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={async () => {
                  try {
                    const res = await googleSignIn();
                    if (res) {
                      setGoogleUser(res.user);
                      toast.success("Zgoda Google Drive przyznana!");
                    }
                  } catch (e: unknown) {
                    const errMsg = e instanceof Error ? e.message : "Błąd sieci";
                    toast.error(`Autoryzacja Google Drive nie powiodła się: ${errMsg}`);
                  }
                }}
                className="text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 transition-colors font-medium font-mono"
                title="Kliknij, aby połączyć się z Google Drive i włączyć automatyczną kopię skryptów"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                <CloudUpload size={14} className="text-neutral-400" />
                <span>Kopia Google Drive</span>
              </button>
            )}
          </div>
          {lastSaved && (
            <div className="text-xs text-neutral-500 flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-full">
              <button
                onClick={handleManualSave}
                className="hover:text-emerald-400 transition-colors"
                title="Zapisz teraz"
              >
                <Save
                  size={14}
                  className="text-emerald-500 hover:text-emerald-400 transition-colors"
                />
              </button>
              <span>Zapisano draft ({lastSaved.toLocaleTimeString()})</span>
            </div>
          )}
          {!lastSaved && (
            <button
              onClick={handleManualSave}
              className="text-xs text-neutral-500 flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-full hover:bg-neutral-800 transition-colors"
            >
              <Save size={14} />
              <span>Zapisz draft</span>
            </button>
          )}

          {/* Firestore script version history trigger */}
          <button
            type="button"
            onClick={() => {
              fetchPreviousScripts();
              setIsHistoryModalOpen(true);
            }}
            className="text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 px-3.5 py-1.5 rounded-full hover:bg-neutral-800 transition-colors"
            title="Wyświetl poprzednie wersje skryptu automatycznie zapisane w chmurze Firestore"
          >
            <History size={14} className="text-rose-400" />
            <span>Historia wersji ({previousScripts.length})</span>
          </button>
        </div>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Ból Docelowego Klienta (Cel Kampanii)
            </label>
            <div className="flex gap-4 items-start">
              <div className="flex-1">
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => {
                    setTopic(e.target.value);
                    setErrors((prev) => ({ ...prev, topic: undefined }));
                  }}
                  placeholder="Np. Niskie konwersje na webinarze / Duży churn z SaaS-a..."
                  className={`w-full bg-black border ${errors.topic ? "border-rose-500" : "border-neutral-700"} rounded-lg px-4 py-3 text-white focus:outline-none focus:border-rose-500 transition-colors`}
                  disabled={generating}
                />
                {errors.topic && (
                  <p className="text-rose-500 text-xs mt-1.5">{errors.topic}</p>
                )}
              </div>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white font-medium rounded-lg shadow-[0_0_15px_rgba(225,29,72,0.3)] transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {generating ? (
                  <Activity className="animate-spin" />
                ) : (
                  <Sparkles size={20} />
                )}
                {generating ? "Generowanie..." : "Generuj Skrypt"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-neutral-800">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Nazwa Produktu
              </label>
              <input
                type="text"
                value={parameters.productName}
                onChange={(e) => {
                  setParameter("productName", e.target.value);
                  setErrors((prev) => ({ ...prev, productName: undefined }));
                }}
                placeholder="Np. Omega System..."
                className={`w-full bg-black border ${errors.productName ? "border-rose-500" : "border-neutral-700"} rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500 transition-colors`}
              />
              {errors.productName && (
                <p className="text-rose-500 text-xs mt-1">
                  {errors.productName}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Grupa Docelowa
              </label>
              <input
                type="text"
                value={parameters.targetAudience}
                onChange={(e) => {
                  setParameter("targetAudience", e.target.value);
                  setErrors((prev) => ({ ...prev, targetAudience: undefined }));
                }}
                placeholder="Np. Właściciele agencji marketingowych..."
                className={`w-full bg-black border ${errors.targetAudience ? "border-rose-500" : "border-neutral-700"} rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500 transition-colors`}
              />
              {errors.targetAudience && (
                <p className="text-rose-500 text-xs mt-1">
                  {errors.targetAudience}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Główny Problem Klienta
              </label>
              <input
                type="text"
                value={parameters.mainProblem}
                onChange={(e) => {
                  setParameter("mainProblem", e.target.value);
                  setErrors((prev) => ({ ...prev, mainProblem: undefined }));
                }}
                placeholder="Np. Brak przewidywalnych przychodów..."
                className={`w-full bg-black border ${errors.mainProblem ? "border-rose-500" : "border-neutral-700"} rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500 transition-colors`}
              />
              {errors.mainProblem && (
                <p className="text-rose-500 text-xs mt-1">
                  {errors.mainProblem}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Kluczowe Korzyści
              </label>
              <input
                type="text"
                value={parameters.keyBenefits}
                onChange={(e) => {
                  setParameter("keyBenefits", e.target.value);
                  setErrors((prev) => ({ ...prev, keyBenefits: undefined }));
                }}
                placeholder="Np. Automatyzacja leadów, wyższe ROI..."
                className={`w-full bg-black border ${errors.keyBenefits ? "border-rose-500" : "border-neutral-700"} rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500 transition-colors`}
              />
              {errors.keyBenefits && (
                <p className="text-rose-500 text-xs mt-1">
                  {errors.keyBenefits}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Jakość Wideo (wskazówka dla skryptu)
              </label>
              <select
                value={parameters.videoQuality || "1080p"}
                onChange={(e) => setParameter("videoQuality", e.target.value)}
                className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500 transition-colors"
              >
                <option value="720p">720p (HD)</option>
                <option value="1080p">1080p (Full HD)</option>
                <option value="1440p">1440p (2K)</option>
                <option value="4k">4K (Ultra HD)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-800">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Globalne słowa kluczowe (AI użyje ich w promptach obrazów)
            </label>
            <div className="flex flex-col gap-3">
              <div className="flex gap-2 max-w-md">
                <input
                  type="text"
                  value={newGlobalKeywordInput}
                  onChange={(e) => setNewGlobalKeywordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      addGlobalKeyword(newGlobalKeywordInput);
                      setNewGlobalKeywordInput("");
                    }
                  }}
                  placeholder="Np. cyberpunk, mroczny klimat, profesjonalne biuro..."
                  className="flex-1 bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  disabled={generating}
                />
                <button
                  onClick={() => {
                    addGlobalKeyword(newGlobalKeywordInput);
                    setNewGlobalKeywordInput("");
                  }}
                  disabled={!newGlobalKeywordInput.trim() || generating}
                  className="px-4 py-2 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 font-medium rounded-lg transition-all flex items-center gap-1 disabled:opacity-50"
                >
                  <Plus size={16} /> Dodaj
                </button>
              </div>

              {globalKeywords.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {globalKeywords.map((kw, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2.5 py-1 rounded-full text-xs font-medium"
                    >
                      <span>{kw}</span>
                      <button
                        onClick={() => removeGlobalKeyword(kw)}
                        className="text-indigo-400 hover:text-rose-400 transition-colors p-0.5 rounded-full hover:bg-indigo-500/20"
                        title="Usuń słowo kluczowe"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {scriptParts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
            <h2 className="text-xl text-white font-medium">
              Wygenerowany Scenariusz Pętel Dopaminowych
            </h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
                <button
                  onClick={() => {
                    setViewMode("list");
                    setPartViewModes({});
                  }}
                  className={`p-2 text-sm transition-colors flex items-center justify-center ${viewMode === "list" && Object.keys(partViewModes).length === 0 ? "bg-neutral-800 text-white" : "text-neutral-500 hover:text-neutral-300"}`}
                  title="Widok Listy"
                >
                  <List size={16} />
                </button>
                <button
                  onClick={() => {
                    setViewMode("storyboard");
                    setPartViewModes({});
                  }}
                  className={`p-2 text-sm transition-colors flex items-center justify-center ${viewMode === "storyboard" && Object.keys(partViewModes).length === 0 ? "bg-neutral-800 text-white" : "text-neutral-500 hover:text-neutral-300"}`}
                  title="Widok Storyboard"
                >
                  <LayoutGrid size={16} />
                </button>
              </div>

              <button
                onClick={() => setContentEngineModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-indigo-500 hover:bg-indigo-600 text-white border border-indigo-500 rounded-lg transition-colors shadow-[0_0_10px_rgba(99,102,241,0.2)] hover:shadow-[0_0_15px_rgba(99,102,241,0.4)]"
              >
                <Share2 size={14} /> Multi-Channel Split (Automatyzacja)
              </button>

              <button
                type="button"
                onClick={() => setIsOutreachModalOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white border border-rose-600 rounded-lg transition-colors shadow-[0_0_10px_rgba(244,63,94,0.3)] hover:shadow-[0_0_15px_rgba(244,63,94,0.5)] animate-pulse"
              >
                <Send size={14} /> Wyślij Kampanię Outreach
              </button>

              <button
                type="button"
                onClick={() => backupToGoogleDrive(scriptParts)}
                disabled={isBackingUp}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white border border-emerald-600 disabled:border-transparent rounded-lg transition-colors shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                title={googleUser ? (backupStatus || "Utwórz kopię zapasową JSON na swoim Google Drive") : "Zaloguj się przez Google Drive (górny pasek), aby wysłać ten skrypt na Drive"}
              >
                {isBackingUp ? (
                  <Activity className="animate-spin" size={14} />
                ) : (
                  <CloudUpload size={14} />
                )}
                <span>Kopia na Drive</span>
              </button>

              <button
                type="button"
                onClick={exportAudio}
                disabled={isExportingAudio}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white border border-rose-600 disabled:border-transparent rounded-lg transition-colors shadow-[0_0_10px_rgba(244,63,94,0.2)]"
                title="Syntetyzuj całą ścieżkę lektorską i pobierz ją jako plik audio MP3"
              >
                {isExportingAudio ? (
                  <Activity className="animate-spin" size={14} />
                ) : (
                  <Volume2 size={14} />
                )}
                <span>Pobierz MP3 lektora</span>
              </button>

              <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden px-1">
                <select
                  id="export-format"
                  className="bg-neutral-900 text-xs text-neutral-400 py-1.5 focus:outline-none focus:text-gray-200"
                >
                  <option value="txt">TXT</option>
                  <option value="md">Markdown</option>
                  <option value="json">JSON</option>
                </select>
                <div className="w-[1px] h-4 bg-neutral-800"></div>
                <button
                  onClick={() =>
                    exportScript(
                      (
                        document.getElementById(
                          "export-format",
                        ) as HTMLSelectElement
                      ).value as "txt" | "md" | "json",
                    )
                  }
                  className="flex items-center gap-1.5 text-xs transition-colors text-blue-400 hover:text-blue-300 py-1.5 pr-2"
                  title="Eksportuj skrypt"
                >
                  <Download size={14} /> Eksportuj
                </button>
              </div>

              <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden px-2 py-1.5">
                <span className="text-xs text-neutral-500">Format:</span>
                <select
                  value={imageAspectRatio}
                  onChange={(e) =>
                    setImageAspectRatio(
                      e.target.value as "16:9" | "1:1" | "9:16",
                    )
                  }
                  className="bg-neutral-900 text-xs text-rose-400 font-medium focus:outline-none"
                >
                  <option value="16:9">16:9</option>
                  <option value="1:1">1:1</option>
                  <option value="9:16">9:16</option>
                </select>
                <div className="w-[1px] h-4 bg-neutral-800 mx-1"></div>
                <span className="text-xs text-neutral-500">Warianty:</span>
                <select
                  value={imageVariationsCount}
                  onChange={(e) =>
                    setImageVariationsCount(parseInt(e.target.value))
                  }
                  className="bg-neutral-900 text-xs text-rose-400 font-medium focus:outline-none"
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                </select>
              </div>

              <button
                onClick={handleGenerateAllImages}
                disabled={
                  isGeneratingAllImages || scriptParts.every((p) => p.imageUrl)
                }
                className={`flex items-center gap-2 text-sm transition-colors ${scriptParts.every((p) => p.imageUrl) ? "text-neutral-500" : "text-rose-400 hover:text-rose-300"} disabled:opacity-50`}
                title="Generuj obrazy dla wszystkich scenariuszy"
              >
                {isGeneratingAllImages ? (
                  <Activity size={16} className="animate-spin" />
                ) : (
                  <Sparkles size={16} />
                )}
                {isGeneratingAllImages
                  ? "Generowanie..."
                  : "Generuj Wszystkie Obrazy"}
              </button>

              <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden px-2 py-1.5 ml-2">
                <span className="text-xs text-neutral-500">Styl 3D:</span>
                <select
                  value={model3dStyle}
                  onChange={(e) => setModel3dStyle(e.target.value)}
                  className="bg-neutral-900 text-xs text-sky-400 font-medium focus:outline-none"
                >
                  <option value="realistic">Realistyczny</option>
                  <option value="sculpture">Rzeźba</option>
                  <option value="voxel">Voxel</option>
                  <option value="cartoon">Kreskówkowy</option>
                </select>
                <div className="w-[1px] h-4 bg-neutral-800 mx-1"></div>
                <span className="text-xs text-neutral-500">Format:</span>
                <select
                  value={model3dFormat}
                  onChange={(e) => setModel3dFormat(e.target.value)}
                  className="bg-neutral-900 text-xs text-sky-400 font-medium focus:outline-none"
                >
                  <option value="glb">GLB</option>
                  <option value="obj">OBJ</option>
                  <option value="usdz">USDZ</option>
                  <option value="fbx">FBX</option>
                  <option value="mtl">MTL</option>
                </select>
              </div>

              <button
                onClick={handleGenerateAll3D}
                disabled={
                  isGeneratingAll3D || scriptParts.every((p) => p.model3dUrl)
                }
                className={`flex items-center gap-2 text-sm transition-colors ${scriptParts.every((p) => p.model3dUrl) ? "text-neutral-500" : "text-sky-400 hover:text-sky-300"} disabled:opacity-50`}
                title="Generuj modele 3D dla wszystkich scenariuszy"
              >
                {isGeneratingAll3D ? (
                  <Activity size={16} className="animate-spin" />
                ) : (
                  <Box size={16} />
                )}
                {isGeneratingAll3D
                  ? "Generowanie 3D..."
                  : "Generuj Wszystkie Modele 3D"}
              </button>

              <button
                onClick={() => setIsPreviewVisible(!isPreviewVisible)}
                className={`flex items-center gap-2 text-sm transition-colors ${isPreviewVisible ? "text-amber-400 hover:text-amber-300" : "text-emerald-400 hover:text-emerald-300"}`}
              >
                <MonitorPlay size={16} />{" "}
                {isPreviewVisible
                  ? "Zamknij Podgląd Wideo"
                  : "Otwórz Podgląd Wideo"}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {isPreviewVisible && scriptParts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-black border border-neutral-800 rounded-xl overflow-hidden mb-8">
                  {/* Video Player Display */}
                  <div className="aspect-[16/9] bg-neutral-950 relative flex items-center justify-center">
                    {scriptParts[currentPartIndex]?.imageUrl ? (
                      <img
                        src={scriptParts[currentPartIndex].imageUrl}
                        alt="Current Visual"
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="text-center p-6 mt-4">
                        <Video
                          className="mx-auto text-neutral-700 mb-4"
                          size={48}
                        />
                        <p className="text-neutral-500 text-sm max-w-sm mx-auto">
                          Wizualizacja niedostępna dla tej sekwencji. Wygeneruj
                          obraz w ustawieniach sceny poniżej, aby aktywować
                          warstwę wizualną.
                        </p>
                        <p className="text-neutral-600 font-mono text-xs mt-4">
                          [ {scriptParts[currentPartIndex]?.visual} ]
                        </p>
                      </div>
                    )}

                    {/* Subtitles Overlay */}
                    <div className="absolute bottom-6 left-0 right-0 px-8 text-center">
                      <div className="inline-block bg-black/70 backdrop-blur-sm border border-white/10 px-6 py-3 rounded-lg max-w-3xl">
                        <p className="text-emerald-400 font-medium text-lg lg:text-xl drop-shadow-md">
                          "{scriptParts[currentPartIndex]?.text}"
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Player Controls */}
                  <div className="bg-neutral-900 border-t border-neutral-800 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={togglePlayback}
                        className="w-12 h-12 rounded-full bg-rose-600 hover:bg-rose-500 flex items-center justify-center text-white transition-colors"
                      >
                        {isPlaying ? (
                          <Pause size={20} className="fill-current" />
                        ) : (
                          <Play size={20} className="fill-current ml-1" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setIsPlaying(false);
                          setCurrentPartIndex(0);
                        }}
                        className="p-2 text-neutral-400 hover:text-white transition-colors"
                        title="Zatrzymaj"
                      >
                        <Square size={18} />
                      </button>
                      <div className="text-sm font-mono text-neutral-400">
                        {currentPartIndex + 1} / {scriptParts.length}
                      </div>
                    </div>

                    <div className="flex-1 px-8">
                      <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-rose-500 transition-all duration-300"
                          style={{
                            width: `${(currentPartIndex / Math.max(1, scriptParts.length - 1)) * 100}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 justify-end relative">
                      <button
                        type="button"
                        onClick={exportAudio}
                        disabled={isExportingAudio}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 disabled:bg-neutral-800 disabled:text-neutral-550 disabled:border-transparent rounded-lg transition-colors text-xs font-semibold"
                        title="Zapisz całą ścieżkę lektora jako MP3"
                      >
                        {isExportingAudio ? (
                          <Activity className="animate-spin" size={13} />
                        ) : (
                          <Download size={13} />
                        )}
                        <span>Pobierz MP3</span>
                      </button>

                      <div className="w-[1px] h-4 bg-neutral-800 hidden md:block" />

                      <button
                        onClick={() => setVolume((v) => (v > 0 ? 0 : 1))}
                        className="text-neutral-400 hover:text-white transition-colors"
                        title={volume === 0 ? "Włącz dźwięk" : "Wycisz dźwięk"}
                      >
                        {volume === 0 ? (
                          <VolumeX size={18} />
                        ) : (
                          <Volume2 size={18} />
                        )}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        className="w-16 accent-rose-500 h-1.5 bg-neutral-800 rounded-full appearance-none cursor-pointer"
                        title="Głośność"
                      />
                      <button
                        onClick={() => setPreviewShareOpen(!previewShareOpen)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-md transition-colors text-xs font-medium border border-indigo-500/20"
                      >
                        <Share2 size={14} />
                        <span className="hidden sm:inline">Udostępnij</span>
                      </button>

                      <AnimatePresence>
                        {previewShareOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute bottom-full right-0 mb-3 w-64 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden z-50 text-sm"
                          >
                            <div className="p-3 border-b border-neutral-800">
                              <h4 className="font-medium text-white mb-2 text-xs uppercase tracking-wider text-neutral-400">
                                Udostępnij Social Media
                              </h4>
                              <div className="grid grid-cols-4 gap-2">
                                <button
                                  onClick={() => {
                                    const shareUrl = `${window.location.origin}${window.location.pathname}?topic=${encodeURIComponent(topic)}`;
                                    window.open(
                                      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
                                      "_blank",
                                    );
                                    toast.success(
                                      "Otwarto udostępnianie na Facebooku",
                                    );
                                    setPreviewShareOpen(false);
                                  }}
                                  className="aspect-square flex items-center justify-center bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2]/20 rounded-lg transition-colors font-bold text-lg"
                                  title="Facebook"
                                >
                                  f
                                </button>
                                <button
                                  onClick={() => {
                                    const shareUrl = `${window.location.origin}${window.location.pathname}?topic=${encodeURIComponent(topic)}`;
                                    const text = encodeURIComponent(
                                      `Sprawdź ten wygenerowany skrypt VSL na temat: ${topic}`,
                                    );
                                    window.open(
                                      `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${text}`,
                                      "_blank",
                                    );
                                    toast.success("Otwarto udostępnianie na X");
                                    setPreviewShareOpen(false);
                                  }}
                                  className="aspect-square flex items-center justify-center bg-neutral-800 text-white hover:bg-neutral-700 rounded-lg transition-colors font-bold text-md"
                                  title="X (Twitter)"
                                >
                                  X
                                </button>
                                <button
                                  onClick={() => {
                                    const shareUrl = `${window.location.origin}${window.location.pathname}?topic=${encodeURIComponent(topic)}`;
                                    window.open(
                                      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
                                      "_blank",
                                    );
                                    toast.success(
                                      "Otwarto udostępnianie na LinkedIn",
                                    );
                                    setPreviewShareOpen(false);
                                  }}
                                  className="aspect-square flex items-center justify-center bg-[#0A66C2]/10 text-[#0A66C2] hover:bg-[#0A66C2]/20 rounded-lg transition-colors font-bold text-sm"
                                  title="LinkedIn"
                                >
                                  in
                                </button>
                                <button
                                  onClick={() => {
                                    toast.success(
                                      "YouTube wymaga API do bezpośredniego uploadu. Pobierz wideo najpierw.",
                                    );
                                    setPreviewShareOpen(false);
                                  }}
                                  className="aspect-square flex items-center justify-center bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 rounded-lg transition-colors font-bold"
                                  title="YouTube"
                                >
                                  <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                  >
                                    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z" />
                                    <polygon
                                      points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"
                                      fill="white"
                                    />
                                  </svg>
                                </button>
                              </div>
                            </div>
                            <div className="p-3">
                              <button
                                onClick={() => {
                                  const shareUrl = `${window.location.origin}${window.location.pathname}?topic=${encodeURIComponent(topic)}`;
                                  navigator.clipboard.writeText(shareUrl);
                                  toast.success("Skopiowano link do podglądu");
                                  setPreviewShareOpen(false);
                                }}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-medium rounded-lg transition-colors border border-indigo-500/20"
                              >
                                <Copy size={14} />
                                Skopiuj link do udostępniania
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Syntezator Mowy Panel */}
                  <div className="bg-neutral-950 p-4 border-t border-neutral-800 flex flex-wrap gap-6 items-center justify-between text-xs text-neutral-400">
                    <div className="flex items-center gap-2">
                      <Volume2 size={16} className="text-rose-500" />
                      <span className="font-semibold text-neutral-200 font-sans">Głos & Synteza Mowy (Web Speech API)</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 font-sans">
                      {/* Wybór głosu */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-neutral-400">Wybrany Głos:</span>
                        <select
                          value={selectedVoiceURI}
                          onChange={(e) => setSelectedVoiceURI(e.target.value)}
                          className="bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-lg text-neutral-200 text-xs focus:outline-none focus:border-rose-500 max-w-[200px] truncate"
                        >
                          {voices.map((voice) => (
                            <option key={voice.voiceURI} value={voice.voiceURI}>
                              {voice.name} ({voice.lang})
                            </option>
                          ))}
                          {voices.length === 0 && (
                            <option value="">Głos wyjściowy systemu</option>
                          )}
                        </select>
                      </div>

                      {/* Pitch */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-neutral-400">Ton (Pitch):</span>
                        <input
                          type="range"
                          min="0.5"
                          max="1.5"
                          step="0.05"
                          value={speechPitch}
                          onChange={(e) => setSpeechPitch(parseFloat(e.target.value))}
                          className="w-20 accent-rose-500 h-1 bg-neutral-800 rounded-full appearance-none cursor-pointer"
                        />
                        <span className="text-[10px] font-mono text-neutral-400 w-6">{speechPitch.toFixed(2)}</span>
                      </div>

                      {/* Tempo */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-neutral-400">Tempo (Rate):</span>
                        <input
                          type="range"
                          min="0.5"
                          max="2.0"
                          step="0.05"
                          value={speechRate}
                          onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                          className="w-20 accent-rose-500 h-1 bg-neutral-800 rounded-full appearance-none cursor-pointer"
                        />
                        <span className="text-[10px] font-mono text-neutral-400 w-6">{speechRate.toFixed(2)}x</span>
                      </div>

                      <div className="h-4 w-[1px] bg-neutral-800 hidden lg:block" />

                      <button
                        type="button"
                        onClick={exportAudio}
                        disabled={isExportingAudio}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:bg-neutral-805 disabled:text-neutral-500 border border-rose-500/20 disabled:border-transparent rounded-lg text-white font-semibold transition-colors shadow-sm"
                        title="Zsyntetyzuj konfigurację głosu jako jeden gotowy plik MP3"
                      >
                        {isExportingAudio ? (
                          <Activity className="animate-spin" size={12} />
                        ) : (
                          <Download size={12} />
                        )}
                        <span>Generuj plik MP3 lektora</span>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`grid gap-4 ${viewMode === "storyboard" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"}`}
          >
            {scriptParts.map((part, index) => {
              const resolvedMode = partViewModes[index] || viewMode;
              if (resolvedMode === "storyboard") {
                return (
                  <motion.div
                    key={`storyboard-${index}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex flex-col bg-neutral-900 border border-neutral-800 hover:border-neutral-700 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden group ${viewMode === "list" ? "col-span-full max-w-sm mx-auto w-full" : "col-span-1"}`}
                  >
                    <div className="p-3 border-b border-neutral-800 flex justify-between items-center bg-black/40">
                      <span className="text-rose-500 font-bold text-[10px] uppercase tracking-widest">
                        {part.type}
                      </span>
                      <div className="flex items-center gap-2.5">
                        <span className="text-neutral-500 font-mono text-xs">
                          {part.time}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleSpeakPart(index)}
                          className={`p-1.5 rounded-lg transition-colors flex items-center justify-center border ${
                            speakingIdx === index
                              ? "bg-rose-500/20 text-rose-400 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.1)] animate-pulse"
                              : "bg-neutral-850 hover:bg-neutral-800 text-neutral-400 hover:text-white border-neutral-800"
                          }`}
                          title={speakingIdx === index ? "Zatrzymaj odsłuch" : "Odsłuchaj fragment lektora"}
                        >
                          {speakingIdx === index ? (
                            <Pause size={12} className="fill-current" />
                          ) : (
                            <Volume2 size={12} />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => exportSingleAudio(index)}
                          disabled={exportingPartIdx !== null}
                          className="p-1.5 bg-neutral-850 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 rounded-lg transition-colors flex items-center justify-center"
                          title="Pobierz ten fragment jako MP3"
                        >
                          {exportingPartIdx === index ? (
                            <Activity className="animate-spin" size={12} />
                          ) : (
                            <Download size={12} />
                          )}
                        </button>
                        <button
                          onClick={() =>
                            setPartViewModes((prev) => ({
                              ...prev,
                              [index]: "list",
                            }))
                          }
                          className="p-1 hover:bg-neutral-800 text-neutral-500 hover:text-neutral-300 rounded transition-colors"
                          title="Przełącz na widok listy"
                        >
                          <List size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="relative aspect-video bg-neutral-950 flex items-center justify-center overflow-hidden border-b border-neutral-800 group-hover:bg-neutral-900 transition-colors">
                      {(previewModes[index] ||
                        (part.model3dUrl ? "3d" : "2d")) === "3d" &&
                      part.model3dUrl ? (
                        <model-viewer
                          src={part.preview3dUrl || part.model3dUrl}
                          auto-rotate
                          camera-controls
                          style={{
                            width: "100%",
                            height: "100%",
                            backgroundColor: "#000000",
                          }}
                        ></model-viewer>
                      ) : part.imageUrl ? (
                        <>
                          <img
                            src={part.imageUrl}
                            alt={part.visual}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                          {part.imageVariations &&
                            part.imageVariations.length > 1 && (
                              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 p-1.5 bg-black/60 backdrop-blur-md rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                                {part.imageVariations.map((v, i) => (
                                  <button
                                    key={i}
                                    onClick={() => {
                                      setScriptParts((prev) => {
                                        const newParts = [...prev];
                                        newParts[index] = {
                                          ...newParts[index],
                                          imageUrl: v,
                                        };
                                        return newParts;
                                      });
                                    }}
                                    className={`w-2 h-2 rounded-full transition-all ${part.imageUrl === v ? "bg-rose-500 scale-125" : "bg-white/40 hover:bg-white/60"}`}
                                    title={`Wariant ${i + 1}`}
                                  />
                                ))}
                              </div>
                            )}
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center p-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleGenerateImage(index)}
                              disabled={
                                part.isGeneratingImage || isGeneratingAllImages
                              }
                              className="bg-neutral-800 hover:bg-neutral-700 text-white rounded p-2 transition-colors border border-neutral-700 disabled:opacity-50 flex items-center justify-center h-10 px-3 gap-2 text-xs"
                              title="Generuj obraz 2D"
                            >
                              {part.isGeneratingImage ? (
                                <Activity
                                  size={16}
                                  className="animate-spin text-rose-500"
                                />
                              ) : (
                                <Sparkles size={16} className="text-rose-500" />
                              )}
                              Generuj 2D (Imagen 3)
                            </button>
                            <button
                              onClick={() => handleGenerate3D(index)}
                              disabled={
                                part.isGenerating3D || isGeneratingAll3D
                              }
                              className="bg-neutral-800 hover:bg-neutral-700 text-white rounded p-2 transition-colors border border-neutral-700 disabled:opacity-50 flex items-center justify-center h-10 px-3 gap-2 text-xs"
                              title="Generuj model 3D (Meshy)"
                            >
                              {part.isGenerating3D ? (
                                <Activity
                                  size={16}
                                  className="animate-spin text-sky-500"
                                />
                              ) : (
                                <Box size={16} className="text-sky-500" />
                              )}
                              Generuj 3D (Meshy API)
                            </button>
                          </div>
                          <span className="text-xs text-neutral-500 mt-2">
                            {part.isGeneratingImage
                              ? "Generowanie obrazu..."
                              : part.isGenerating3D
                                ? "Generowanie 3D..."
                                : isGeneratingAllImages && !part.imageUrl
                                  ? "Oczekiwanie na obraz..."
                                  : isGeneratingAll3D && !part.model3dUrl
                                    ? "Oczekiwanie na 3D..."
                                    : "Wybierz podgląd"}
                          </span>
                          {part.imageError && (
                            <div className="mt-3 flex items-start gap-1 p-2 bg-rose-500/10 border border-rose-500/20 rounded text-rose-400 text-xs text-left w-full mx-2">
                              <AlertCircle
                                size={14}
                                className="mt-0.5 shrink-0"
                              />
                              <span
                                className="line-clamp-3"
                                title={part.imageError}
                              >
                                {part.imageError}
                              </span>
                            </div>
                          )}
                          {part.model3dError && (
                            <div className="mt-3 flex items-start gap-1 p-2 bg-sky-500/10 border border-sky-500/20 rounded text-sky-400 text-xs text-left w-full mx-2">
                              <AlertCircle
                                size={14}
                                className="mt-0.5 shrink-0"
                              />
                              <span
                                className="line-clamp-3"
                                title={part.model3dError}
                              >
                                {part.model3dError}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Allow toggling between 2D and 3D if both exist, or regenerating */}
                      {(part.imageUrl || part.model3dUrl) && (
                        <div className="absolute top-2 right-2 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                          {part.imageUrl && part.model3dUrl && (
                            <button
                              onClick={() =>
                                setPreviewModes((prev) => ({
                                  ...prev,
                                  [index]:
                                    (prev[index] || "3d") === "3d"
                                      ? "2d"
                                      : "3d",
                                }))
                              }
                              className="bg-black/80 hover:bg-black text-white rounded p-1.5 backdrop-blur-sm transition-colors border border-neutral-700"
                              title={
                                (previewModes[index] || "3d") === "3d"
                                  ? "Przełącz na 2D"
                                  : "Przełącz na 3D"
                              }
                            >
                              {(previewModes[index] || "3d") === "3d" ? (
                                <ImageIcon size={12} />
                              ) : (
                                <Box size={12} />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => {
                              const url = part.model3dUrl || part.imageUrl;
                              if (url) {
                                navigator.clipboard.writeText(url);
                                toast.success("Skopiowano link do zasobu");
                              }
                            }}
                            className="bg-black/80 hover:bg-black text-indigo-400 rounded p-1.5 backdrop-blur-sm transition-colors border border-neutral-700"
                            title="Udostępnij (Kopiuj link)"
                          >
                            <Share2 size={12} />
                          </button>
                          {!part.imageUrl && (
                            <button
                              onClick={() => handleGenerateImage(index)}
                              disabled={part.isGeneratingImage}
                              className="bg-black/80 hover:bg-black text-rose-400 rounded p-1.5 backdrop-blur-sm transition-colors border border-neutral-700"
                              title="Generuj obraz 2D"
                            >
                              {part.isGeneratingImage ? (
                                <Activity size={12} className="animate-spin" />
                              ) : (
                                <Sparkles size={12} />
                              )}
                            </button>
                          )}
                          {!part.model3dUrl && (
                            <button
                              onClick={() => handleGenerate3D(index)}
                              disabled={
                                part.isGenerating3D || isGeneratingAll3D
                              }
                              className="bg-black/80 hover:bg-black text-sky-400 rounded p-1.5 backdrop-blur-sm transition-colors border border-neutral-700 disabled:opacity-50"
                              title="Generuj model 3D"
                            >
                              {part.isGenerating3D ? (
                                <Activity size={12} className="animate-spin" />
                              ) : (
                                <Box size={12} />
                              )}
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="p-4 flex-1 flex flex-col gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">
                            <Video size={12} /> Prompt Wizualny
                          </span>
                          <div className="flex items-center gap-1.5">
                            <div className="relative group/wand">
                              <button
                                onClick={() =>
                                  handleGenerateVisualPrompt(index, true)
                                }
                                disabled={part.isGeneratingAdvancedPrompt}
                                className={`flex items-center gap-1.5 text-[9px] transition-colors disabled:opacity-50 font-medium px-2 py-0.5 rounded ${!parameters.mainProblem ? "text-neutral-500 bg-neutral-800/20 cursor-not-allowed" : "text-amber-400 hover:text-amber-300 bg-amber-500/10"}`}
                                title={
                                  !parameters.mainProblem
                                    ? "Wypełnij Zapalnik w parametrach"
                                    : "Wygeneruj unikalny prompt z Zapalnika (CRM) przy użyciu AI"
                                }
                              >
                                {part.isGeneratingAdvancedPrompt ? (
                                  <Activity
                                    size={10}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Wand2 size={10} />
                                )}
                                Zapalnik
                              </button>
                              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover/wand:block w-[180px] p-2 bg-neutral-900 border border-amber-500/30 shadow-xl rounded z-50 text-[10px] text-neutral-300 text-center leading-tight">
                                Generuje zaawansowany prompt na podstawie
                                wybranego problemu klienta.
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(part.visual);
                                toast.success("Prompt skopiowany do schowka");
                              }}
                              className="flex items-center gap-1 text-[9px] text-neutral-400 hover:text-neutral-300 transition-colors font-medium bg-neutral-800/40 hover:bg-neutral-800 px-1.5 py-0.5 rounded"
                              title="Kopiuj Prompt"
                            >
                              <Copy size={10} />
                              Kopiuj
                            </button>
                            <button
                              onClick={() => handleSuggestKeywords(index)}
                              disabled={part.isGeneratingKeywords}
                              className="flex items-center gap-1 text-[9px] text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-50 font-medium"
                              title={
                                part.keywordSuggestions?.length
                                  ? "Odśwież propozycje AI"
                                  : "Pomysły AI"
                              }
                            >
                              {part.isGeneratingKeywords ? (
                                <Activity size={10} className="animate-spin" />
                              ) : part.keywordSuggestions?.length ? (
                                <RefreshCw size={10} />
                              ) : (
                                <Sparkles size={10} />
                              )}
                              {part.keywordSuggestions?.length
                                ? "Odśwież"
                                : "Pomoc AI"}
                            </button>
                            <button
                              onClick={() => handleGenerateImage(index)}
                              disabled={part.isGeneratingImage}
                              className="flex items-center gap-1 text-[9px] text-rose-400 hover:text-rose-300 transition-colors disabled:opacity-50 font-medium ml-1"
                              title="Wygeneruj Obraz"
                            >
                              {part.isGeneratingImage ? (
                                <Activity size={10} className="animate-spin" />
                              ) : (
                                <Image size={10} />
                              )}
                              Wygeneruj Obraz
                            </button>
                          </div>
                        </div>
                        <textarea
                          value={part.visual}
                          onChange={(e) =>
                            updatePartVisual(index, e.target.value)
                          }
                          onFocus={() => {
                            if (
                              !part.keywordSuggestions?.length &&
                              !part.isGeneratingKeywords
                            ) {
                              handleSuggestKeywords(index);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (
                              e.key === "Enter" &&
                              !e.shiftKey &&
                              part.keywordSuggestions &&
                              part.keywordSuggestions.length > 0
                            ) {
                              e.preventDefault();
                              const firstGroup = part.keywordSuggestions[0];
                              if (firstGroup.keywords.length > 0) {
                                appendKeyword(index, firstGroup.keywords[0]);
                              }
                            } else if (e.key === "Escape") {
                              clearKeywordSuggestions(index);
                            }
                          }}
                          className={`text-xs bg-black border ${!part.visual ? "border-amber-500/30 border-dashed" : "border-neutral-700"} rounded-md p-1.5 w-full text-gray-300 focus:outline-none focus:border-rose-500 transition-colors custom-scrollbar`}
                          rows={2}
                          placeholder={
                            part.isGeneratingAdvancedPrompt
                              ? "Generowanie..."
                              : "Wpisz prompt wizualny..."
                          }
                        />
                        {!part.visual ? (
                          <button
                            onClick={() =>
                              handleGenerateVisualPrompt(index, false)
                            }
                            disabled={part.isGeneratingAdvancedPrompt}
                            className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded transition-colors disabled:opacity-50"
                          >
                            {part.isGeneratingAdvancedPrompt ? (
                              <Activity size={12} className="animate-spin" />
                            ) : (
                              <Sparkles size={12} />
                            )}
                            Generuj wizualizację
                          </button>
                        ) : (
                          <div className="flex justify-end mt-1">
                            <button
                              onClick={() =>
                                handleGenerateVisualPrompt(index, false)
                              }
                              disabled={part.isGeneratingAdvancedPrompt}
                              className="text-[10px] text-amber-500/70 hover:text-amber-400 flex items-center gap-1 transition-colors disabled:opacity-50"
                              title="Popraw istniejący prompt używając AI i kontekstu"
                            >
                              {part.isGeneratingAdvancedPrompt ? (
                                <Activity size={10} className="animate-spin" />
                              ) : (
                                <Wand2 size={10} />
                              )}
                              Popraw wizualizację za pomocą AI
                            </button>
                          </div>
                        )}
                        {part.keywordSuggestions &&
                          part.keywordSuggestions.length > 0 && (
                            <div className="flex flex-col gap-2 mt-1">
                              {part.keywordSuggestions.map(
                                (group, groupIdx) => (
                                  <div
                                    key={groupIdx}
                                    className="flex flex-col gap-1 items-start"
                                  >
                                    <input
                                      type="text"
                                      value={group.category}
                                      onChange={(e) =>
                                        updateKeywordSuggestionCategory(
                                          index,
                                          group.category,
                                          e.target.value,
                                        )
                                      }
                                      className="text-[10px] text-neutral-400 font-medium uppercase tracking-wider bg-transparent border-none p-0 w-full focus:ring-0 focus:outline-none"
                                    />
                                    <div className="flex flex-wrap gap-1">
                                      {group.keywords.map((kw, i) => (
                                        <div
                                          key={i}
                                          className="flex bg-indigo-500/10 border border-indigo-500/20 rounded-md overflow-hidden transition-colors"
                                        >
                                          <button
                                            onClick={() =>
                                              appendKeyword(index, kw)
                                            }
                                            className="text-[10px] px-2 py-0.5 text-indigo-300 hover:bg-indigo-500/20 text-left border-r border-indigo-500/20 flex items-center gap-1"
                                            title="Dodaj do tego promptu"
                                          >
                                            <span>+</span> {kw}
                                          </button>
                                          <button
                                            onClick={() => {
                                              addGlobalKeyword(kw);
                                              toast.success(
                                                `Dodano "${kw}" do globalnych`,
                                              );
                                            }}
                                            className="px-1.5 py-0.5 text-indigo-400 hover:text-indigo-200 hover:bg-indigo-500/30 flex items-center justify-center transition-colors border-r border-indigo-500/20"
                                            title="Dodaj do globalnych słów kluczowych"
                                          >
                                            <Globe size={10} />
                                          </button>
                                          <button
                                            onClick={() =>
                                              removeKeywordFromSuggestions(
                                                index,
                                                group.category,
                                                kw,
                                              )
                                            }
                                            className="px-1 py-0.5 text-neutral-500 hover:text-rose-400 hover:bg-rose-500/20 flex items-center justify-center transition-colors"
                                            title="Usuń sugestię"
                                          >
                                            <X size={10} />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ),
                              )}
                              <div className="flex items-center gap-1 mt-1">
                                <input
                                  type="text"
                                  placeholder="Dodaj słowo..."
                                  value={customKeywords[index] || ""}
                                  onChange={(e) =>
                                    setCustomKeywords((prev) => ({
                                      ...prev,
                                      [index]: e.target.value,
                                    }))
                                  }
                                  onKeyDown={(e) =>
                                    e.key === "Enter" &&
                                    addKeywordToSuggestions(index)
                                  }
                                  className="flex-1 text-[9px] bg-neutral-900 border border-neutral-800 rounded px-1.5 py-0.5 text-gray-300 focus:outline-none focus:border-indigo-500"
                                />
                                <button
                                  onClick={() => addKeywordToSuggestions(index)}
                                  disabled={!customKeywords[index]?.trim()}
                                  className="bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 rounded p-0.5 disabled:opacity-50 transition-colors"
                                >
                                  <Plus size={10} />
                                </button>
                              </div>
                            </div>
                          )}
                      </div>

                      <div className="space-y-1">
                        <span className="flex items-center gap-1 text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">
                          <Activity size={12} /> Audio
                        </span>
                        <textarea
                          value={part.audio}
                          onChange={(e) =>
                            updatePartAudio(index, e.target.value)
                          }
                          className="w-full bg-neutral-900 border border-neutral-800 rounded p-2 text-xs text-blue-300 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 resize-y min-h-[40px] transition-all"
                          placeholder="Brak warstwy audio..."
                        />
                      </div>

                      <div className="space-y-1 mt-auto">
                        <span className="flex items-center gap-1 text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">
                          <Type size={12} /> Voiceover
                        </span>
                        <textarea
                          value={part.text}
                          onChange={(e) =>
                            updatePartText(index, e.target.value)
                          }
                          className="w-full bg-neutral-900 border border-neutral-800 rounded p-2 text-xs text-emerald-300 font-medium italic focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 resize-y min-h-[60px] transition-all"
                          placeholder="Tekst voiceover..."
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              } else {
                return (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.15 }}
                    key={`list-${index}`}
                    className="col-span-full grid grid-cols-1 md:grid-cols-12 gap-4 p-5 bg-neutral-900 border border-neutral-800 rounded-xl relative overflow-hidden group"
                  >
                    <div className="absolute top-2 right-2 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() =>
                          setPartViewModes((prev) => ({
                            ...prev,
                            [index]: "storyboard",
                          }))
                        }
                        className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 rounded transition-colors"
                        title="Przełącz na widok storyboard"
                      >
                        <LayoutGrid size={14} />
                      </button>
                    </div>
                    <div className="absolute top-0 right-0 h-full w-2 bg-rose-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="md:col-span-2">
                      <div className="inline-flex flex-col items-start gap-1 font-sans">
                        <span className="text-rose-500 font-bold text-[10px] uppercase tracking-widest">
                          {part.type}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-300 font-mono text-xl">
                            {part.time}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleSpeakPart(index)}
                            className={`p-1.5 rounded-full transition-all flex items-center justify-center border hover:scale-105 ${
                              speakingIdx === index
                                ? "bg-rose-500/20 text-rose-400 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.15)] animate-pulse"
                                : "bg-neutral-850 hover:bg-neutral-800 text-neutral-400 hover:text-white border-neutral-800"
                            }`}
                            title={speakingIdx === index ? "Zatrzymaj odsłuch" : "Odsłuchaj fragment lektora"}
                          >
                            {speakingIdx === index ? (
                              <Pause size={12} className="fill-current" />
                            ) : (
                              <Volume2 size={12} />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => exportSingleAudio(index)}
                            disabled={exportingPartIdx !== null}
                            className="p-1.5 rounded-full bg-neutral-850 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition-all hover:scale-105 flex items-center justify-center"
                            title="Pobierz ten fragment jako MP3"
                          >
                            {exportingPartIdx === index ? (
                              <Activity className="animate-spin" size={12} />
                            ) : (
                              <Download size={12} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2 text-xs text-neutral-500 uppercase tracking-wider font-semibold">
                            <Video size={14} /> Wskazówka Wizualna (Prompt)
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="relative group/wand">
                              <button
                                onClick={() =>
                                  handleGenerateVisualPrompt(index, true)
                                }
                                disabled={part.isGeneratingAdvancedPrompt}
                                className={`flex items-center gap-1.5 text-xs transition-colors disabled:opacity-50 font-medium px-2 py-1 rounded ${!parameters.mainProblem ? "text-neutral-500 bg-neutral-800/20 cursor-not-allowed" : "text-amber-400 hover:text-amber-300 bg-amber-500/10"}`}
                                title={
                                  !parameters.mainProblem
                                    ? "Wypełnij Zapalnik w parametrach"
                                    : "Wygeneruj unikalny prompt z Zapalnika (CRM) przy użyciu AI"
                                }
                              >
                                {part.isGeneratingAdvancedPrompt ? (
                                  <Activity
                                    size={14}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Wand2 size={14} />
                                )}
                                Zapalnik
                              </button>
                              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover/wand:block w-[180px] p-2 bg-neutral-900 border border-amber-500/30 shadow-xl rounded z-50 text-[10px] text-neutral-300 text-center leading-tight">
                                Generuje zaawansowany prompt na podstawie
                                wybranego problemu klienta.
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(part.visual);
                                toast.success("Prompt skopiowany do schowka");
                              }}
                              className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-300 transition-colors bg-neutral-800/50 hover:bg-neutral-800 px-2 py-1 rounded"
                              title="Kopiuj Prompt"
                            >
                              <Copy size={14} />
                              Kopiuj
                            </button>
                            <button
                              onClick={() => handleSuggestKeywords(index)}
                              disabled={part.isGeneratingKeywords}
                              className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-50 font-medium bg-indigo-500/10 px-2 py-1 rounded"
                              title={
                                part.keywordSuggestions?.length
                                  ? "Odśwież propozycje AI"
                                  : "Pomysły AI"
                              }
                            >
                              {part.isGeneratingKeywords ? (
                                <Activity size={14} className="animate-spin" />
                              ) : part.keywordSuggestions?.length ? (
                                <RefreshCw size={14} />
                              ) : (
                                <Sparkles size={14} />
                              )}
                              {part.keywordSuggestions?.length
                                ? "Odśwież (AI)"
                                : "Pomoc AI"}
                            </button>
                            <button
                              onClick={() => handleGenerateImage(index)}
                              disabled={part.isGeneratingImage}
                              className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 transition-colors disabled:opacity-50 font-medium bg-rose-500/10 px-2 py-1 rounded ml-1"
                              title="Wygeneruj Obraz na podstawie wpisanego promptu i słów kluczowych"
                            >
                              {part.isGeneratingImage ? (
                                <Activity size={14} className="animate-spin" />
                              ) : (
                                <Image size={14} />
                              )}
                              Wygeneruj Obraz
                            </button>
                          </div>
                        </div>
                        <textarea
                          value={part.visual}
                          onChange={(e) =>
                            updatePartVisual(index, e.target.value)
                          }
                          onFocus={() => {
                            if (
                              !part.keywordSuggestions?.length &&
                              !part.isGeneratingKeywords
                            ) {
                              handleSuggestKeywords(index);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (
                              e.key === "Enter" &&
                              !e.shiftKey &&
                              part.keywordSuggestions &&
                              part.keywordSuggestions.length > 0
                            ) {
                              e.preventDefault();
                              const firstGroup = part.keywordSuggestions[0];
                              if (firstGroup.keywords.length > 0) {
                                appendKeyword(index, firstGroup.keywords[0]);
                              }
                            } else if (e.key === "Escape") {
                              clearKeywordSuggestions(index);
                            }
                          }}
                          className={`text-sm bg-black border ${!part.visual ? "border-amber-500/30 border-dashed" : "border-neutral-700"} rounded-md p-2 w-full text-gray-300 focus:outline-none focus:border-rose-500 transition-colors custom-scrollbar`}
                          rows={3}
                          placeholder={
                            part.isGeneratingAdvancedPrompt
                              ? "Generowanie..."
                              : "Wpisz prompt wizualny..."
                          }
                        />
                        {!part.visual ? (
                          <button
                            onClick={() =>
                              handleGenerateVisualPrompt(index, false)
                            }
                            disabled={part.isGeneratingAdvancedPrompt}
                            className="w-full flex items-center justify-center gap-1.5 py-2 text-sm text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded transition-colors disabled:opacity-50"
                          >
                            {part.isGeneratingAdvancedPrompt ? (
                              <Activity size={14} className="animate-spin" />
                            ) : (
                              <Sparkles size={14} />
                            )}
                            Generuj wizualizację
                          </button>
                        ) : (
                          <div className="flex justify-end mt-1">
                            <button
                              onClick={() =>
                                handleGenerateVisualPrompt(index, false)
                              }
                              disabled={part.isGeneratingAdvancedPrompt}
                              className="text-xs text-amber-500/70 hover:text-amber-400 flex items-center gap-1 transition-colors disabled:opacity-50"
                              title="Popraw istniejący prompt używając AI i kontekstu"
                            >
                              {part.isGeneratingAdvancedPrompt ? (
                                <Activity size={12} className="animate-spin" />
                              ) : (
                                <Wand2 size={12} />
                              )}
                              Popraw wizualizację za pomocą AI
                            </button>
                          </div>
                        )}
                        {part.keywordSuggestions &&
                          part.keywordSuggestions.length > 0 && (
                            <div className="flex flex-col gap-3 mt-2">
                              {part.keywordSuggestions.map(
                                (group, groupIdx) => (
                                  <div
                                    key={groupIdx}
                                    className="flex flex-col gap-1.5 items-start"
                                  >
                                    <input
                                      type="text"
                                      value={group.category}
                                      onChange={(e) =>
                                        updateKeywordSuggestionCategory(
                                          index,
                                          group.category,
                                          e.target.value,
                                        )
                                      }
                                      className="text-xs text-neutral-400 font-medium uppercase tracking-wider bg-transparent border-none p-0 w-full focus:ring-0 focus:outline-none"
                                    />
                                    <div className="flex flex-wrap gap-1.5">
                                      {group.keywords.map((kw, i) => (
                                        <div
                                          key={i}
                                          className="flex bg-indigo-500/10 border border-indigo-500/20 rounded-md overflow-hidden transition-colors"
                                        >
                                          <button
                                            onClick={() =>
                                              appendKeyword(index, kw)
                                            }
                                            className="text-xs px-2.5 py-1 text-indigo-300 hover:bg-indigo-500/20 flex items-center gap-1 text-left border-r border-indigo-500/20"
                                            title="Dodaj do tego promptu"
                                          >
                                            <span>+</span> {kw}
                                          </button>
                                          <button
                                            onClick={() => {
                                              addGlobalKeyword(kw);
                                              toast.success(
                                                `Dodano "${kw}" do globalnych`,
                                              );
                                            }}
                                            className="px-2 py-1 text-indigo-400 hover:text-indigo-200 hover:bg-indigo-500/30 flex items-center justify-center transition-colors border-r border-indigo-500/20"
                                            title="Dodaj do globalnych słów kluczowych"
                                          >
                                            <Globe size={14} />
                                          </button>
                                          <button
                                            onClick={() =>
                                              removeKeywordFromSuggestions(
                                                index,
                                                group.category,
                                                kw,
                                              )
                                            }
                                            className="px-1.5 py-1 text-neutral-500 hover:text-rose-400 hover:bg-rose-500/20 flex items-center justify-center transition-colors"
                                            title="Usuń sugestię"
                                          >
                                            <X size={14} />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ),
                              )}
                              <div className="flex items-center gap-2 mt-1">
                                <input
                                  type="text"
                                  placeholder="Dodaj własne słowo kluczowe..."
                                  value={customKeywords[index] || ""}
                                  onChange={(e) =>
                                    setCustomKeywords((prev) => ({
                                      ...prev,
                                      [index]: e.target.value,
                                    }))
                                  }
                                  onKeyDown={(e) =>
                                    e.key === "Enter" &&
                                    addKeywordToSuggestions(index)
                                  }
                                  className="flex-1 text-xs bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-gray-300 focus:outline-none focus:border-indigo-500"
                                />
                                <button
                                  onClick={() => addKeywordToSuggestions(index)}
                                  disabled={!customKeywords[index]?.trim()}
                                  className="bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 rounded p-1 disabled:opacity-50 transition-colors"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                            </div>
                          )}
                        {part.model3dUrl ? (
                          <div className="mt-2 flex flex-col gap-2">
                            <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-neutral-700 bg-neutral-950">
                              <model-viewer
                                src={part.preview3dUrl || part.model3dUrl}
                                auto-rotate
                                camera-controls
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  backgroundColor: "#000000",
                                }}
                              ></model-viewer>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    part.model3dUrl!,
                                  );
                                  toast.success("Skopiowano link do zasobu 3D");
                                }}
                                className="text-xs px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded flex items-center gap-2 transition-colors border border-indigo-500/20"
                              >
                                <Share2 size={14} /> Kopiuj link (
                                {part.model3dUrl?.split(".").pop() || "model"})
                              </button>
                              <a
                                href={part.model3dUrl!}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs px-3 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 rounded flex items-center gap-2 transition-colors border border-sky-500/20"
                              >
                                <Download size={14} /> Pobierz
                              </a>
                            </div>
                          </div>
                        ) : part.imageUrl ? (
                          <div className="mt-2 flex flex-col gap-2 relative group">
                            <img
                              src={part.imageUrl}
                              alt={part.visual}
                              className="rounded-lg border border-neutral-700 w-full object-cover relative"
                              loading="lazy"
                              decoding="async"
                            />
                            {part.imageVariations &&
                              part.imageVariations.length > 1 && (
                                <div className="absolute top-2 left-1/2 -translate-x-1/2 flex gap-1.5 p-1.5 bg-black/60 backdrop-blur-md rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {part.imageVariations.map((v, i) => (
                                    <button
                                      key={i}
                                      onClick={() => {
                                        setScriptParts((prev) => {
                                          const newParts = [...prev];
                                          newParts[index] = {
                                            ...newParts[index],
                                            imageUrl: v,
                                          };
                                          return newParts;
                                        });
                                      }}
                                      className={`w-2 h-2 rounded-full transition-all ${part.imageUrl === v ? "bg-rose-500 scale-125" : "bg-white/40 hover:bg-white/60"}`}
                                      title={`Wariant ${i + 1}`}
                                    />
                                  ))}
                                </div>
                              )}
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(part.imageUrl!);
                                toast.success("Skopiowano link do obrazu");
                              }}
                              className="self-start text-xs px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded flex items-center gap-2 transition-colors border border-indigo-500/20"
                            >
                              <Share2 size={14} /> Udostępnij link
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => handleGenerateImage(index)}
                              disabled={
                                part.isGeneratingImage || isGeneratingAllImages
                              }
                              className="text-xs px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded flex items-center gap-2 transition-colors border border-neutral-700 disabled:opacity-50"
                            >
                              {part.isGeneratingImage ? (
                                <Activity
                                  size={14}
                                  className="animate-spin text-rose-500"
                                />
                              ) : (
                                <Sparkles size={14} className="text-rose-500" />
                              )}
                              {part.isGeneratingImage
                                ? "Generowanie..."
                                : isGeneratingAllImages && !part.imageUrl
                                  ? "Oczekiwanie..."
                                  : "Obraz 2D (Imagen 3)"}
                            </button>
                            <button
                              onClick={() => handleGenerate3D(index)}
                              disabled={
                                part.isGenerating3D || isGeneratingAll3D
                              }
                              className="text-xs px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded flex items-center gap-2 transition-colors border border-neutral-700 disabled:opacity-50"
                            >
                              {part.isGenerating3D ? (
                                <Activity
                                  size={14}
                                  className="animate-spin text-sky-500"
                                />
                              ) : (
                                <Box size={14} className="text-sky-500" />
                              )}
                              {part.isGenerating3D
                                ? "Generowanie 3D..."
                                : isGeneratingAll3D && !part.model3dUrl
                                  ? "Oczekiwanie..."
                                  : "Model 3D (Meshy API)"}
                            </button>
                          </div>
                        )}
                        {part.imageError && (
                          <div className="mt-2 flex items-start gap-1.5 p-2 bg-rose-500/10 border border-rose-500/20 rounded text-rose-400 text-xs">
                            <AlertCircle
                              size={14}
                              className="mt-0.5 shrink-0"
                            />
                            <span
                              className="line-clamp-2"
                              title={part.imageError}
                            >
                              {part.imageError}
                            </span>
                          </div>
                        )}
                        {part.model3dError && (
                          <div className="mt-2 flex items-start gap-1.5 p-2 bg-sky-500/10 border border-sky-500/20 rounded text-sky-400 text-xs">
                            <AlertCircle
                              size={14}
                              className="mt-0.5 shrink-0"
                            />
                            <span
                              className="line-clamp-2"
                              title={part.model3dError}
                            >
                              {part.model3dError}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <span className="flex items-center gap-2 text-xs text-neutral-500 uppercase tracking-wider font-semibold">
                          <Activity size={14} /> Warstwa Audio
                        </span>
                        <textarea
                          value={part.audio}
                          onChange={(e) =>
                            updatePartAudio(index, e.target.value)
                          }
                          className="w-full bg-neutral-900 border border-neutral-800 rounded p-3 text-sm text-blue-300 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 resize-y min-h-[60px] transition-all"
                          placeholder="Brak warstwy audio..."
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="flex items-center gap-2 text-xs text-neutral-500 uppercase tracking-wider font-semibold">
                          <Type size={14} /> Voiceover (Skrypt)
                        </span>
                        <textarea
                          value={part.text}
                          onChange={(e) =>
                            updatePartText(index, e.target.value)
                          }
                          className="w-full bg-neutral-900 border border-neutral-800 rounded p-3 text-sm text-emerald-300 font-medium italic focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 resize-y min-h-[80px] transition-all"
                          placeholder="Tekst voiceover..."
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              }
            })}
          </motion.div>

          <div className="mt-8 bg-neutral-900 border border-neutral-800 rounded-xl p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-medium text-white flex items-center gap-2">
                  <Share2 size={18} className="text-indigo-400" />
                  Udostępnij darmowy podgląd
                </h3>
                <p className="text-sm text-neutral-400 mt-1">
                  Zdobądź więcej leadów lub podziel się skryptem VSL w social
                  media.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const shareUrl = `${window.location.origin}${window.location.pathname}?topic=${encodeURIComponent(topic)}`;
                    window.open(
                      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
                      "_blank",
                    );
                    toast.success("Otwarto udostępnianie na Facebooku");
                  }}
                  className="w-10 h-10 flex items-center justify-center bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2]/20 rounded-lg transition-colors font-bold text-lg"
                  title="Facebook"
                >
                  f
                </button>
                <button
                  onClick={() => {
                    const shareUrl = `${window.location.origin}${window.location.pathname}?topic=${encodeURIComponent(topic)}`;
                    const text = encodeURIComponent(
                      `Sprawdź ten wygenerowany skrypt VSL na temat: ${topic}`,
                    );
                    window.open(
                      `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${text}`,
                      "_blank",
                    );
                    toast.success("Otwarto udostępnianie na X");
                  }}
                  className="w-10 h-10 flex items-center justify-center bg-neutral-800 text-white hover:bg-neutral-700 rounded-lg transition-colors font-bold text-md"
                  title="X (Twitter)"
                >
                  X
                </button>
                <button
                  onClick={() => {
                    const shareUrl = `${window.location.origin}${window.location.pathname}?topic=${encodeURIComponent(topic)}`;
                    window.open(
                      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
                      "_blank",
                    );
                    toast.success("Otwarto udostępnianie na LinkedIn");
                  }}
                  className="w-10 h-10 flex items-center justify-center bg-[#0A66C2]/10 text-[#0A66C2] hover:bg-[#0A66C2]/20 rounded-lg transition-colors font-bold text-sm"
                  title="LinkedIn"
                >
                  in
                </button>
                <button
                  onClick={() => {
                    toast.success(
                      "YouTube wymaga API do bezpośredniego uploadu. Pobierz wideo najpierw.",
                    );
                  }}
                  className="w-10 h-10 flex items-center justify-center bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 rounded-lg transition-colors font-bold"
                  title="YouTube"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z" />
                    <polygon
                      points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"
                      fill="white"
                    />
                  </svg>
                </button>

                <div className="w-px h-8 bg-neutral-800 mx-2"></div>

                <button
                  onClick={() => {
                    const shareUrl = `${window.location.origin}${window.location.pathname}?topic=${encodeURIComponent(topic)}`;
                    setCopiedLink(true);
                    navigator.clipboard.writeText(shareUrl);
                    toast.success("Skopiowano link do udostępnienia");
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {copiedLink ? <Check size={16} /> : <Copy size={16} />}
                  {copiedLink ? "Skopiowano" : "Kopiuj Link"}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-rose-950/20">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <History size={18} className="text-rose-400" />
                Historia wersji skryptów VSL (Firestore)
              </h3>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="text-neutral-400 hover:text-white transition-colors"
                title="Zamknij"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4 overflow-y-auto">
              <p className="text-sm text-neutral-400 leading-relaxed font-mono">
                Automatycznie utworzone checkpointy Twojego skryptu. Każda udana generacja lub ręczny zapis zapisuje pełną strukturę (tekst, parametry, słowa kluczowe, czas trwania) w chmurze Firestore.
              </p>

              {isLoadingScripts ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-neutral-400">
                  <Activity className="animate-spin text-rose-500" size={32} />
                  <span className="text-sm font-mono">Pobieranie historii wersji z Firestore...</span>
                </div>
              ) : previousScripts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-neutral-500 border border-dashed border-neutral-800 rounded-lg">
                  <Clock size={32} className="text-neutral-600 mb-2" />
                  <span className="text-sm font-semibold text-neutral-400">Brak zapisanych wersji</span>
                  <span className="text-xs text-neutral-500">Wygeneruj skrypt lub kliknij "Zapisz draft", aby dodać pierwszy punkt przywracania.</span>
                </div>
              ) : (
                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                  {previousScripts.map((script) => (
                    <div
                      key={script.id}
                      onClick={() => loadPreviousScript(script)}
                      className="group flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-black border border-neutral-800 hover:border-rose-500/50 rounded-xl cursor-pointer transition-all duration-200 gap-4"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-rose-400 bg-rose-950/20 px-2 py-0.5 rounded border border-rose-900/30">
                            {new Date(script.createdAt).toLocaleDateString()} {new Date(script.createdAt).toLocaleTimeString()}
                          </span>
                          <span className="text-xs text-neutral-500 font-mono">
                            ID: {script.id.substring(0, 8)}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white group-hover:text-rose-300 transition-colors line-clamp-1">
                          {script.topic}
                        </h4>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-400 font-mono mt-1">
                          <span>
                            Produkt: <strong className="text-neutral-300">{script.parameters?.productName || "Nieokreślony"}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            Części skryptu: <strong className="text-neutral-300">{script.scriptParts?.length || 0}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-center">
                        <button
                          type="button"
                          onClick={(e) => deletePreviousScript(script.id, e)}
                          className="p-2 text-neutral-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors"
                          title="Usuń tę wersję z chmury"
                        >
                          <Trash2 size={16} />
                        </button>
                        <button
                          type="button"
                          className="px-3 py-1.5 bg-rose-600 group-hover:bg-rose-500 text-white text-xs font-semibold rounded-lg transition-colors"
                        >
                          Przywróć tę wersję
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-neutral-800 bg-neutral-950 flex justify-end">
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-xs text-white font-semibold rounded-lg transition-colors"
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}

      {isOutreachModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-rose-950/20">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Send size={18} className="text-rose-400" />
                Generuj zimną kampanię e-mailową (Outreach)
              </h3>
              <button
                onClick={() => {
                  setIsOutreachModalOpen(false);
                  setGeneratedOutreach(null);
                }}
                className="text-neutral-400 hover:text-white transition-colors"
                title="Zamknij"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-5 overflow-y-auto">
              <p className="text-sm text-neutral-400 leading-relaxed font-mono">
                System pobierze strukturę wygenerowanego skryptu VSL i przekuje go w spersonalizowaną, zimną sekwencję e-mail z precyzyjnie zaaplikowanymi wyzwalaczami uwagi z Twojej niszy.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono text-neutral-400 uppercase tracking-wider">
                    Nazwa / Firma Klienta
                  </label>
                  <input
                    type="text"
                    value={outreachClientName}
                    onChange={(e) => setOutreachClientName(e.target.value)}
                    placeholder="Np. Jan Kowalski / ACME Corp"
                    className="bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono text-neutral-400 uppercase tracking-wider">
                    E-mail Klienta
                  </label>
                  <input
                    type="email"
                    value={outreachClientEmail}
                    onChange={(e) => setOutreachClientEmail(e.target.value)}
                    placeholder="Np. jan@kowalski.pl"
                    className="bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {!generatedOutreach ? (
                <button
                  type="button"
                  onClick={handleGenerateOutreach}
                  disabled={isGeneratingOutreach}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-rose-600 hover:bg-rose-500 disabled:bg-neutral-800 text-white font-semibold rounded-lg text-sm transition-colors shadow-lg disabled:cursor-not-allowed"
                >
                  {isGeneratingOutreach ? (
                    <>
                      <Activity className="animate-spin" size={16} />
                      Trwa neurobiologiczna generacja treści...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Uruchom Silnik Copywritingu i Generuj E-mail
                    </>
                  )}
                </button>
              ) : (
                <div className="flex flex-col gap-4 border border-rose-900/30 bg-rose-950/5 rounded-lg p-5">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-mono text-rose-400 uppercase tracking-widest">
                      Temat Wiadomości (Pattern Interrupt):
                    </span>
                    <input
                      type="text"
                      value={generatedOutreach.subject}
                      onChange={(e) => setGeneratedOutreach({ ...generatedOutreach, subject: e.target.value })}
                      className="bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-sm text-white font-medium focus:outline-none"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-mono text-rose-400 uppercase tracking-widest">
                      Treść Wiadomości (HTML):
                    </span>
                    <div className="bg-neutral-950 border border-neutral-800 rounded p-4 max-h-[220px] overflow-y-auto text-sm text-neutral-300 font-mono space-y-2">
                      <div dangerouslySetInnerHTML={{ __html: generatedOutreach.body }} />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 mt-2">
                    <button
                      type="button"
                      onClick={handleSendAndCreateClient}
                      disabled={isSendingOutreach}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-800 text-white font-bold rounded-lg text-sm transition-colors shadow-lg"
                    >
                      {isSendingOutreach ? (
                        <>
                          <Activity className="animate-spin" size={16} />
                          Rejestrowanie i wysyłanie...
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          Zarejestruj Klienta w CRM i Wyślij Outreach!
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setGeneratedOutreach(null)}
                      className="w-full py-2 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 rounded-lg text-xs transition-colors"
                    >
                      Generuj Ponownie
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {contentEngineModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-neutral-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Share2 size={18} className="text-indigo-400" />
                Dystrybucja & Repurposing
              </h3>
              <button
                onClick={() => setContentEngineModal(false)}
                className="text-neutral-400 hover:text-white transition-colors"
                title="Zamknij"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-neutral-300">
                  Ilość generowanych wariacji (LinkedIn + Twitter)
                </label>
                <input
                  type="number"
                  min={1}
                  value={contentEngineConfig.amount}
                  onChange={(e) =>
                    setContentEngineConfig((p) => ({
                      ...p,
                      amount: Number(e.target.value),
                    }))
                  }
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-neutral-300">
                  Autopilot i Kalendarz (Zaplanuj z góry)
                </label>
                <div className="flex items-center gap-4 bg-neutral-950 border border-neutral-800 p-3 rounded-lg flex-wrap sm:flex-nowrap">
                  <span className="text-sm text-neutral-400 flex items-center gap-2 whitespace-nowrap">
                    <CalendarDays size={16} /> Publikuj:
                  </span>
                  <select
                    value={contentEngineConfig.frequency}
                    onChange={(e) =>
                      setContentEngineConfig((p) => ({
                        ...p,
                        frequency: e.target.value,
                      }))
                    }
                    className="flex-1 bg-neutral-900 border border-neutral-700 rounded p-2 text-sm text-white focus:outline-none"
                  >
                    <option value="codziennie">Codziennie</option>
                    <option value="co_2_dni">Co 2 dni</option>
                    <option value="co_tydzien">Co Tydzień</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-neutral-800 bg-neutral-950/50 flex flex-wrap justify-end gap-3">
              <button
                onClick={() => setContentEngineModal(false)}
                className="px-4 py-2 text-sm text-neutral-400 hover:bg-neutral-800 rounded-lg transition-colors w-full sm:w-auto"
              >
                Anuluj
              </button>
              <button
                onClick={() => {
                  useCronStore.getState().addJob({
                      name: `Repurposing ( ${contentEngineConfig.amount} wariantów )`,
                      type: 'repurposing',
                      frequency: contentEngineConfig.frequency,
                      nextRun: new Date(Date.now() + 86400000).toISOString(),
                      status: 'active'
                  });
                  for (let i = 0; i < 2; i++) {
                    useVslStore.getState().enqueueTask({
                      type: "text",
                      partIndex: 0,
                      prompt: `Multi-Channel ${i + 1}: Karuzela LinkedIn`,
                      status: "pending",
                      priority: 5,
                      options: { contentIdx: 0 },
                    });
                    useVslStore.getState().enqueueTask({
                      type: "text",
                      partIndex: 0,
                      prompt: `Multi-Channel ${i + 1}: Wątek na X (Twitter)`,
                      status: "pending",
                      priority: 5,
                      options: { contentIdx: 0 },
                    });
                  }
                  setContentEngineModal(false);
                  toast.success(
                    `🗓️ Poprawnie dodano na Automatyzację/Kalendarza! Cykl: ${contentEngineConfig.frequency}.`,
                  );
                }}
                className="flex items-center justify-center gap-2 px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-lg shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-colors w-full sm:w-auto"
              >
                <CalendarCheck size={18} /> Uruchom Repurposing
              </button>
            </div>
          </div>
        </div>
      )}

      {isTrendsModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-800/20">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp size={20} className="text-indigo-400" />
                Skaner Trendów AI (Real-Time)
              </h3>
              <button
                onClick={() => setIsTrendsModalOpen(false)}
                className="text-neutral-400 hover:text-white transition-colors"
                title="Zamknij"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
              <p className="text-sm text-neutral-400 mb-2">
                Wykryto 3 potężne narastające trendy w branży AI z ostatnich
                24h. Wybierz jeden, aby automatycznie skonfigurować wysoce
                konwertujący lejek VSL pod ten temat.
              </p>

              <div
                className="group relative bg-black border border-neutral-800 hover:border-indigo-500/50 rounded-lg p-4 cursor-pointer transition-all overflow-hidden"
                onClick={() => {
                  setTopic(
                    "AI Voice Agents (Vapi / Bland AI) zastępują recepcje i działy obsługi",
                  );
                  setParameter(
                    "targetAudience",
                    "Właściciele klinik, restauracji i małych e-commerce",
                  );
                  setParameter(
                    "mainProblem",
                    "Koszty zatrudniania ludzi do obierania setek powtarzalnych telefonów i umawiania wizyt",
                  );
                  setParameter(
                    "keyBenefits",
                    "Agent głosowy 24/7 odbierający 10,000 rozmów na raz, umawiający z 98% skutecznością",
                  );
                  setIsTrendsModalOpen(false);
                  toast.success("🔥 Wczytano Trend: AI Voice Agents");
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-md font-bold text-white">
                    1. Głosowi Agenci AI (Voice Automation)
                  </h4>
                  <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 flex items-center gap-1">
                    <TrendingUp size={12} /> Viral
                  </span>
                </div>
                <p className="text-xs text-neutral-400">
                  Gigantyczny wzrost wyszukań tematu Voice AI na X i LinkedIn.
                  Ludzie mają dość płacenia za infolinię. Niesamowity popyt na
                  wdrożenia.
                </p>
              </div>

              <div
                className="group relative bg-black border border-neutral-800 hover:border-indigo-500/50 rounded-lg p-4 cursor-pointer transition-all overflow-hidden"
                onClick={() => {
                  setTopic(
                    "Autonomiczne Systemy Cold Email - Zastępowanie SDRów przez AI",
                  );
                  setParameter(
                    "targetAudience",
                    "Agencje B2B, Software House'y, SaaS",
                  );
                  setParameter(
                    "mainProblem",
                    "Palenie setek dolarów na lead generation bez odpowiedzi, wpadanie do SPAMu",
                  );
                  setParameter(
                    "keyBenefits",
                    "Sieć 50 skrzynek rozgrzewana i prowadzona przez Agentów z auto-pisaniem personalizowanych wiadomości",
                  );
                  setIsTrendsModalOpen(false);
                  toast.success("🔥 Wczytano Trend: Autonomiczny Cold Email");
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-md font-bold text-white">
                    2. Autonomiczny Outbound AI
                  </h4>
                  <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 flex items-center gap-1">
                    <TrendingUp size={12} /> Rosnący
                  </span>
                </div>
                <p className="text-xs text-neutral-400">
                  Trend na systemy takie jak Smartlead+Clay zmiksowane w jedno
                  rozwiązanie przez AI. Wysoki ROAS z kampanii promujących to.
                </p>
              </div>

              <div
                className="group relative bg-black border border-neutral-800 hover:border-indigo-500/50 rounded-lg p-4 cursor-pointer transition-all overflow-hidden"
                onClick={() => {
                  setTopic(
                    "SaaS Wrappers śmierć - Przejście na Micro-narzędzia Workflow",
                  );
                  setParameter(
                    "targetAudience",
                    "Solopreneurzy, Agencje Marketingowe i Twórcy",
                  );
                  setParameter(
                    "mainProblem",
                    "Klienci anulują subskrypcje ChatGPT-wrapperów, brakuje twardego utility i oszczędności pracy",
                  );
                  setParameter(
                    "keyBenefits",
                    "Dostarczane na tacy kompleksowe, ukryte automatyzacje w backendzie, które dają natychmiastowy 'Aha Moment'",
                  );
                  setIsTrendsModalOpen(false);
                  toast.success("🔥 Wczytano Trend: Micro-Narzędzia Workflow");
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-md font-bold text-white">
                    3. Prawdziwe AI Automations & Workflows
                  </h4>
                  <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 flex items-center gap-1">
                    <TrendingUp size={12} /> Stabilny Wzrost
                  </span>
                </div>
                <p className="text-xs text-neutral-400">
                  Biznes woli zapłacić 2000$ wdrożeniowcowi n8n/Make, niż kupić
                  kolejny abonament za 20$/msc i robić to samemu.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <TaskQueuePanel />
    </div>
  );
}
