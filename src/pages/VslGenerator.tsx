import { useEffect, useState, useRef, useMemo, useCallback, memo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Share2, Copy, Check } from "lucide-react";
import { useVslStore } from "../store/vslStore";
import { auth, db } from "../lib/firebase";
import { collection, addDoc, getDocs, query, where, orderBy, deleteDoc, doc } from "firebase/firestore";
import { handleFirestoreError } from "../lib/firebaseErrors";
import type { ScriptPart } from "../store/vslStore";
import { useCronStore } from "../store/cronStore";
import { useSystemLogsStore } from "../store/systemLogsStore";
import "@google/model-viewer";
import { toast } from "sonner";
import { getAccessToken, initAuth, googleSignIn } from "../lib/auth";

import { TaskQueuePanel } from "../components/TaskQueuePanel";

// Extracted Subcomponents
import { VslHeader } from "../components/vsl/VslHeader";
import { VslParametersForm } from "../components/vsl/VslParametersForm";
import { VslScriptToolbar } from "../components/vsl/VslScriptToolbar";
import { VslPlayerPreview } from "../components/vsl/VslPlayerPreview";
import { VslScriptPartCard } from "../components/vsl/VslScriptPartCard";
import { VslHistoryModal } from "../components/vsl/VslHistoryModal";
import { VslOutreachModal } from "../components/vsl/VslOutreachModal";
import { VslContentEngineModal } from "../components/vsl/VslContentEngineModal";
import { VslTrendsModal } from "../components/vsl/VslTrendsModal";

const VslScriptPartCardItem = memo(({
  part,
  index,
  resolvedMode,
  speakingIdx,
  exportingPartIdx,
  isGeneratingAllImages,
  isGeneratingAll3D,
  handleToggleSpeakPart,
  exportSingleAudio,
  handleGenerateImage,
  handleGenerate3D,
  handleGenerateVisualPrompt,
  handleSuggestKeywords,
  setPartViewModes,
  previewModes,
  setPreviewModes
}: any) => {
  const setPreviewMode = useCallback(
    (mode: "2d" | "3d") => {
      setPreviewModes((prev: any) => ({ ...prev, [index]: mode }));
    },
    [index, setPreviewModes]
  );

  return (
    <VslScriptPartCard
      part={part}
      index={index}
      viewMode={resolvedMode}
      speakingIdx={speakingIdx}
      exportingPartIdx={exportingPartIdx}
      isGeneratingAllImages={isGeneratingAllImages}
      isGeneratingAll3D={isGeneratingAll3D}
      handleToggleSpeakPart={handleToggleSpeakPart}
      exportSingleAudio={exportSingleAudio}
      handleGenerateImage={handleGenerateImage}
      handleGenerate3D={handleGenerate3D}
      handleGenerateVisualPrompt={handleGenerateVisualPrompt}
      handleSuggestKeywords={handleSuggestKeywords}
      setPartViewModes={setPartViewModes}
      previewMode={previewModes[index] || "2d"}
      setPreviewMode={setPreviewMode}
    />
  );
});

export function VslGenerator() {
  const logAction = useSystemLogsStore((state) => state.logAction);
  const [copiedLink, setCopiedLink] = useState(false);
  const [contentEngineModal, setContentEngineModal] = useState(false);
  const [isTrendsModalOpen, setIsTrendsModalOpen] = useState(false);
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

  // AbortController ref for cleaning up active fetch/async actions on unmount
  const activeControllersRef = useRef<Set<AbortController>>(new Set());

  // Clean up SpeechSynthesis, intervals, timeouts, and fetches on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      activeControllersRef.current.forEach(c => c.abort());
      activeControllersRef.current.clear();
    };
  }, []);

  const fetchPreviousScripts = useCallback(async () => {
    const currentUserId = auth.currentUser?.uid;
    if (!currentUserId) return;

    setIsLoadingScripts(true);
    const controller = new AbortController();
    activeControllersRef.current.add(controller);

    try {
      const q = query(
        collection(db, "vsl_scripts"),
        where("userId", "==", currentUserId),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      if (controller.signal.aborted) return;

      const docs: any[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        docs.push({
          id: docSnap.id,
          topic: data.topic || "",
          parameters: data.parameters || {},
          globalKeywords: data.globalKeywords || [],
          scriptParts: data.scriptParts || [],
          createdAt: data.createdAt || "",
        });
      });
      setPreviousScripts(docs);
    } catch (err: any) {
      if (controller.signal.aborted) return;
      console.error("Failed to fetch previous VSL scripts:", err);
      try {
        handleFirestoreError(err, "list", "vsl_scripts", "VslScript");
      } catch (logErr) {
        console.warn("Firestore error logged:", logErr);
      }
    } finally {
      activeControllersRef.current.delete(controller);
      if (!controller.signal.aborted) {
        setIsLoadingScripts(false);
      }
    }
  }, []);

  const saveScriptToFirestore = useCallback(
    async (overrideTopic?: string, overrideParts?: ScriptPart[]) => {
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
          createdAt: new Date().toISOString(),
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
    },
    [scriptParts, topic, parameters, globalKeywords, fetchPreviousScripts]
  );

  const loadPreviousScript = useCallback(
    (script: any) => {
      setTopic(script.topic);
      setScriptParts(script.scriptParts);
      if (script.globalKeywords) {
        setGlobalKeywords(script.globalKeywords);
      }
      if (script.parameters) {
        Object.entries(script.parameters).forEach(([key, value]) => {
          setParameter(
            key as keyof import("../store/vslStore").VslParameters,
            value as string
          );
        });
      }
      setLastSaved(new Date(script.createdAt));
      toast.success(`Wczytano wersję z dnia ${new Date(script.createdAt).toLocaleString()}`);
      setIsHistoryModalOpen(false);
    },
    [setTopic, setScriptParts, setGlobalKeywords, setParameter, setLastSaved]
  );

  const deletePreviousScript = useCallback(
    async (id: string, e: React.MouseEvent) => {
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
    },
    [fetchPreviousScripts]
  );

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchPreviousScripts();
      } else {
        setPreviousScripts([]);
      }
    });
    return () => unsubscribe();
  }, [fetchPreviousScripts]);

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

    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  const handleToggleSpeakPart = useCallback(
    (index: number) => {
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
    },
    [speakingIdx, scriptParts, selectedVoiceURI, voices, speechRate, speechPitch, volume, setIsPlaying]
  );

  const handleGenerateOutreach = useCallback(async () => {
    if (!outreachClientName.trim()) {
      toast.error("Wprowadź nazwę klienta.");
      return;
    }

    setIsGeneratingOutreach(true);
    setGeneratedOutreach(null);
    const controller = new AbortController();
    activeControllersRef.current.add(controller);

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
          keyBenefits: parameters.keyBenefits,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error("Błąd podczas generowania outreach.");
      }

      const data = await response.json();
      if (!controller.signal.aborted) {
        setGeneratedOutreach(data);
        toast.success("Spersonalizowana sekwencja outreach została wygenerowana!");
      }
    } catch (error) {
      if (controller.signal?.aborted) return;
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Błąd sieci.");
    } finally {
      activeControllersRef.current.delete(controller);
      if (!controller.signal?.aborted) {
        setIsGeneratingOutreach(false);
      }
    }
  }, [outreachClientName, outreachClientEmail, scriptParts, parameters]);

  const handleSendAndCreateClient = useCallback(async () => {
    if (!outreachClientName.trim() || !outreachClientEmail.trim()) {
      toast.error("Wprowadź e-mail oraz nazwę klienta.");
      return;
    }
    if (!generatedOutreach) {
      toast.error("Wygeneruj najpierw sekwencję outreach.");
      return;
    }

    setIsSendingOutreach(true);
    const controller = new AbortController();
    activeControllersRef.current.add(controller);

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
        createdAt: new Date().toISOString(),
      });

      if (controller.signal.aborted) return;
      toast.success("Klient został zarejestrowany w CRM Zapalnik i GmailIntegration!");

      const token = getAccessToken();
      if (token) {
        const emailLines = [
          `To: ${outreachClientEmail}`,
          "Content-type: text/html;charset=utf-8",
          "MIME-Version: 1.0",
          `Subject: ${generatedOutreach.subject}`,
          "",
          generatedOutreach.body,
        ];

        const email = emailLines.join("\r\n");
        const base64EncodedEmail = btoa(unescape(encodeURIComponent(email)))
          .replace(/\+/g, "-")
          .replace(/\//g, "_");

        const gmailResponse = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ raw: base64EncodedEmail }),
          signal: controller.signal,
        });

        if (!gmailResponse.ok) {
          throw new Error("CRM zarejestrowany, lecz wysyłka e-mail nie powiodła się. Sprawdź autoryzację Gmail.");
        }

        if (!controller.signal.aborted) {
          toast.success("Kampania outreach została wysłana pomyślnie z Twojego Gmaila!");
        }
      } else {
        toast.info(
          "Zarejestrowano klienta! Aby automatycznie wysłać e-mail, zaloguj się do Google Workspace (u góry strony GmailIntegration)."
        );
      }

      if (!controller.signal.aborted) {
        setOutreachClientName("");
        setOutreachClientEmail("");
        setGeneratedOutreach(null);
        setIsOutreachModalOpen(false);
      }
    } catch (error) {
      if (controller.signal?.aborted) return;
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd.");
    } finally {
      activeControllersRef.current.delete(controller);
      if (!controller.signal?.aborted) {
        setIsSendingOutreach(false);
      }
    }
  }, [outreachClientName, outreachClientEmail, generatedOutreach]);

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

  const backupToGoogleDrive = useCallback(
    async (parts: ScriptPart[]) => {
      const token = getAccessToken();
      if (!token) {
        setBackupStatus("Brak autoryzacji Google Drive - zaloguj się");
        return;
      }

      setIsBackingUp(true);
      setBackupStatus("Tworzenie kopii zapasowej na Google Drive...");
      const toastId = toast.loading("Tworzenie kopii zapasowej na Google Drive...");
      const controller = new AbortController();
      activeControllersRef.current.add(controller);

      try {
        const fileName = `vsl-backup-${
          parameters.productName ? parameters.productName.replace(/[^a-zA-Z0-9]/g, "-") : "skrypt"
        }-${new Date().toISOString().slice(0, 10)}.json`;

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

        const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": `multipart/related; boundary=${boundary}`,
          },
          body: body,
          signal: controller.signal,
        });

        const resData = await response.json();
        if (!response.ok || resData.error) {
          throw new Error(resData.error?.message || "Błąd API Google Drive");
        }

        if (!controller.signal.aborted) {
          setBackupStatus("Kopia zapasowa utworzona pomyślnie!");
          toast.success("Kopia zapasowa VSL pomyślnie zapisana na Twoim Google Drive!", { id: toastId });
        }
      } catch (error: unknown) {
        if (controller.signal?.aborted) return;
        console.error("Backup to Google Drive failed:", error);
        const errMsg = error instanceof Error ? error.message : "Błąd sieci";
        setBackupStatus(`Błąd kopii zapasowej: ${errMsg}`);
        toast.error(`Nie udało się zapisać kopii na Google Drive: ${errMsg}`, { id: toastId });
      } finally {
        activeControllersRef.current.delete(controller);
        if (!controller.signal?.aborted) {
          setIsBackingUp(false);
        }
      }
    },
    [topic, parameters, globalKeywords]
  );

  const {
    topic,
    setTopic,
    parameters,
    setParameter,
    globalKeywords,
    setGlobalKeywords,
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
  } = useVslStore();

  const [partViewModes, setPartViewModes] = useState<Record<number, "list" | "storyboard">>({});
  const [previewModes, setPreviewModes] = useState<Record<number, "2d" | "3d">>({});
  const handleGenerateRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let t1: any;
    let t2: any;

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
      setParameter(
        "mainProblem",
        `Niska retencja uwagi odbiorców na kanale ${channelFromUrl || "Social Media"} w niszy ${nicheFromUrl || "B2B"}.`
      );
      setParameter("targetAudience", nicheFromUrl || "klienci biznesowi");
      setParameter("productName", "System Konwersji Omega");
      setParameter(
        "keyBenefits",
        `Maksymalizacja dopaminy za pomocą psychologii pętli "${loopTypeFromUrl || "Pętla dopaminowa"}".`
      );

      if (autoGenerate) {
        // Clean URL params so they don't block or loop
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, "", cleanUrl);

        t1 = setTimeout(() => {
          handleGenerateRef.current?.();
        }, 600);
      }
    }

    const savedDraft = localStorage.getItem("vslGeneratorDraft");
    if (savedDraft && !topicFromUrl) {
      t2 = setTimeout(() => {
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
              setParameter(key as keyof import("../store/vslStore").VslParameters, value as string);
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

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [setTopic, setScriptParts, setLastSaved, setParameter, setGlobalKeywords]);

  const handleManualSave = useCallback(() => {
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
        })
      );
      setLastSaved(new Date(timestampStr));

      // Auto-save history snapshot to Firestore
      saveScriptToFirestore(topic, scriptParts);

      toast.success("Zapisano kopie draftu lokalnie oraz historię w chmurze Firestore!");
    } else {
      toast.error("Nic do zapisania");
    }
  }, [topic, parameters, globalKeywords, scriptParts, setLastSaved, saveScriptToFirestore]);

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
          })
        );
        setLastSaved(new Date(timestampStr));
      }
    }, 15000);

    return () => clearInterval(autoSaveInterval);
  }, [topic, parameters, globalKeywords, scriptParts, setLastSaved]);

  const handleGenerate = useCallback(async () => {
    const newErrors: typeof errors = {};
    if (!topic?.trim()) newErrors.topic = "Ból Docelowego Klienta jest wymagany.";
    if (!parameters.productName?.trim()) newErrors.productName = "Nazwa Produktu jest wymagana.";
    if (!parameters.targetAudience?.trim()) newErrors.targetAudience = "Grupa Docelowa jest wymagana.";
    if (!parameters.mainProblem?.trim()) newErrors.mainProblem = "Główny Problem Klienta jest wymagany.";
    if (!parameters.keyBenefits?.trim()) newErrors.keyBenefits = "Kluczowe Korzyści są wymagane.";

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error("Uzupełnij wymagane pola (zaznaczone na czerwono) przed generowaniem skryptu", { duration: 4000 });
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
    const keyBenefits = parameters.keyBenefits || "automatyzacja i zwiększenie zysków";
    const videoQuality = parameters.videoQuality || "1080p";

    const controller = new AbortController();
    activeControllersRef.current.add(controller);

    try {
      const response = await fetch("/api/generate-vsl", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-User-Email": auth.currentUser?.email || "anonymous@wfp-platform.io"
        },
        body: JSON.stringify({
          topic,
          productName,
          targetAudience,
          mainProblem,
          keyBenefits,
          videoQuality,
        }),
        signal: controller.signal,
      });

      let data: any;
      let isJson = false;
      try {
        data = await response.json();
        isJson = true;
      } catch (parseError) {
        console.warn("Nie udało się rzutować odpowiedzi na JSON", parseError);
      }

      if (controller.signal.aborted) return;

      if (response.ok && isJson && data.scriptParts && Array.isArray(data.scriptParts)) {
        setScriptParts(data.scriptParts);
        toast.success("Skrypt został wygenerowany pomyślnie i zapisany automatycznie w historii Firestore");

        // Save generated version directly to Firestore
        saveScriptToFirestore(topic, data.scriptParts);

        // Log action
        logAction(
          "VSL Generator",
          "Generowanie skryptu VSL",
          `Wygenerowano skrypt VSL dla tematu "${topic.slice(0, 100)}" o ${data.scriptParts.length} częściach.`
        );

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
        let errorMessage = isJson && data?.error ? `${data.error}${errorDetail}` : null;

        if (!errorMessage) {
          if (response.status === 429) {
            errorMessage = "Przekroczono limit zapytań do API (Rate Limit). Spróbuj ponownie za chwilę.";
          } else if (response.status === 401 || response.status === 403) {
            errorMessage = "Brak autoryzacji. Prawdopodobnie niepoprawny klucz API.";
          } else if (response.status >= 500) {
            errorMessage = `Błąd serwera podczas generowania skryptu (${response.status}).`;
          } else if (!response.ok) {
            errorMessage = `Błąd HTTP ${response.status}: ${response.statusText || "Nieznany błąd"}`;
          } else {
            errorMessage = "Wystąpił nieznany błąd podczas generowania.";
          }
        }

        console.error(`Failed to generate VSL [${response.status}]:`, isJson ? data : response.statusText);
        toast.error(errorMessage);
      }
    } catch (error) {
      if (controller.signal?.aborted) return;
      console.error("Error calling generate-vsl API:", error);
      const errorMessage = error instanceof Error ? error.message : "Nieznany błąd sieci lub serwera.";
      toast.error(`Błąd połączenia: ${errorMessage}`);
    } finally {
      activeControllersRef.current.delete(controller);
      if (!controller.signal?.aborted) {
        setGenerating(false);
      }
    }
  }, [
    topic,
    parameters,
    autoBackupEnabled,
    saveScriptToFirestore,
    logAction,
    backupToGoogleDrive,
    setGenerating,
    setScriptParts,
    setIsPreviewVisible,
    setIsPlaying,
    setCurrentPartIndex,
  ]);

  useEffect(() => {
    handleGenerateRef.current = handleGenerate;
  });

  const fetchWithRetry = useCallback(
    async (
      url: string,
      options: RequestInit,
      retries = 3,
      backoff = 1000
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
    },
    []
  );

  const handleSuggestKeywords = useCallback(
    async (index: number) => {
      const part = scriptParts[index];
      if (!part.visual) return;

      setScriptParts((prev) => {
        const newParts = [...prev];
        newParts[index] = { ...newParts[index], isGeneratingKeywords: true };
        return newParts;
      });

      const controller = new AbortController();
      activeControllersRef.current.add(controller);

      try {
        const response = await fetch("/api/suggest-keywords", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: part.visual, globalKeywords }),
          signal: controller.signal,
        });

        let data: any;
        let isJson = false;
        try {
          data = await response.json();
          isJson = true;
        } catch (parseError) {
          console.warn("Nie udało się rzutować odpowiedzi na JSON", parseError);
        }

        if (controller.signal.aborted) return;

        if (response.ok && isJson && data.keywords && Array.isArray(data.keywords)) {
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
          let errorMessage = isJson && data?.error ? `${data.error}${errorDetail}` : null;

          if (!errorMessage) {
            if (response.status === 429) {
              errorMessage = "Przekroczono limit zapytań do API (Rate Limit). Spróbuj ponownie za chwilę.";
            } else if (response.status === 401 || response.status === 403) {
              errorMessage = "Brak autoryzacji. Prawdopodobnie niepoprawny klucz API.";
            } else if (response.status >= 500) {
              errorMessage = `Błąd serwera podczas generowania sugestii (${response.status}).`;
            } else if (!response.ok) {
              errorMessage = `Błąd HTTP ${response.status}: ${response.statusText || "Nieznany błąd"}`;
            } else {
              errorMessage = "Wystąpił nieznany błąd podczas generowania.";
            }
          }

          console.error(`Failed to suggest keywords [${response.status}]:`, isJson ? data : response.statusText);
          toast.error(errorMessage);
          setScriptParts((prev) => {
            const newParts = [...prev];
            newParts[index] = { ...newParts[index], isGeneratingKeywords: false };
            return newParts;
          });
        }
      } catch (e) {
        if (controller.signal.aborted) return;
        console.error("Network error suggesting keywords:", e);
        const errorMessage = e instanceof Error ? e.message : "Nieznany błąd sieci lub serwera.";
        toast.error(`Błąd połączenia: ${errorMessage}`);
        setScriptParts((prev) => {
          const newParts = [...prev];
          newParts[index] = { ...newParts[index], isGeneratingKeywords: false };
          return newParts;
        });
      } finally {
        activeControllersRef.current.delete(controller);
      }
    },
    [scriptParts, globalKeywords, setScriptParts]
  );

  const handleGenerateVisualPrompt = useCallback(
    async (index: number, usePain: boolean = true) => {
      const part = scriptParts[index];
      const pain = usePain ? parameters.mainProblem : "";

      if (usePain && (!pain || pain.trim() === "")) {
        toast.error('Najpierw wypełnij pole "Główny Problem Klienta / Zapalnik" w parametrach');
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

      const controller = new AbortController();
      activeControllersRef.current.add(controller);

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
          signal: controller.signal,
        });

        let data: any;
        let isJson = false;
        try {
          data = await response.json();
          isJson = true;
        } catch (parseError) {
          console.warn("Nie udało się rzutować odpowiedzi na JSON", parseError);
        }

        if (controller.signal.aborted) return;

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
          let errorMessage = isJson && data?.error ? `${data.error}${errorDetail}` : null;

          if (!errorMessage) {
            if (response.status === 429) {
              errorMessage = "Przekroczono limit zapytań do API (Rate Limit). Spróbuj ponownie za chwilę.";
            } else if (response.status === 401 || response.status === 403) {
              errorMessage = "Brak autoryzacji. Prawdopodobnie niepoprawny klucz API.";
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
            isJson ? data : response.statusText
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
        if (controller.signal.aborted) return;
        console.error("Network error generating advanced prompt:", e);
        const errorMessage = e instanceof Error ? e.message : "Nieznany błąd sieci lub serwera.";
        toast.error(`Błąd połączenia: ${errorMessage}`);
        setScriptParts((prev) => {
          const newParts = [...prev];
          newParts[index] = {
            ...newParts[index],
            isGeneratingAdvancedPrompt: false,
          };
          return newParts;
        });
      } finally {
        activeControllersRef.current.delete(controller);
      }
    },
    [scriptParts, parameters.mainProblem, globalKeywords, setScriptParts]
  );

  const executeImageGeneration = useCallback(
    async (index: number, options?: { aspectRatio?: string; variations?: number }) => {
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

      const controller = new AbortController();
      activeControllersRef.current.add(controller);

      try {
        const finalPrompt =
          globalKeywords.length > 0 ? `${part.visual}, ${globalKeywords.join(", ")}` : part.visual;

        const response = await fetchWithRetry("/api/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: finalPrompt,
            aspectRatio: options?.aspectRatio || imageAspectRatio,
            numberOfImages: options?.variations || imageVariationsCount,
          }),
          signal: controller.signal,
        });

        let data: any;
        let isJson = false;
        try {
          data = await response.json();
          isJson = true;
        } catch (parseError) {
          console.warn("Nie udało się rzutować odpowiedzi na JSON", parseError);
        }

        if (controller.signal.aborted) return;

        if (response.ok && isJson && data.imageUrls && data.imageUrls.length > 0) {
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
          toast.success(`Warianty obrazu (${data.imageUrls.length}) zostały pomyślnie wygenerowane`);
        } else {
          const errorDetail = isJson && data?.details ? ` (${data.details})` : "";
          let errorMessage = isJson && data?.error ? `${data.error}${errorDetail}` : null;

          if (!errorMessage) {
            if (response.status === 429) {
              errorMessage = "Przekroczono limit zapytań do API (Rate Limit). Spróbuj ponownie za chwilę.";
            } else if (response.status === 401 || response.status === 403) {
              errorMessage = "Brak autoryzacji. Prawdopodobnie niepoprawny lub brakujący klucz API.";
            } else if (response.status >= 500) {
              errorMessage = `Błąd serwera podczas generowania obrazka (${response.status}).`;
            } else if (!response.ok) {
              errorMessage = `Błąd HTTP ${response.status}: ${response.statusText || "Nieznany błąd"}`;
            } else {
              errorMessage = "Wystąpił błąd: nieotrzymano poprawnego adresu URL obrazka.";
            }
          }

          console.error(`Failed to generate image [${response.status}]:`, isJson ? data : response.statusText);
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
        if (controller.signal?.aborted) return;
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : "Nieznany błąd sieci lub serwera.";
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
      } finally {
        activeControllersRef.current.delete(controller);
      }
    },
    [scriptParts, globalKeywords, imageAspectRatio, imageVariationsCount, fetchWithRetry, setScriptParts]
  );

  const execute3DGeneration = useCallback(
    async (index: number, options?: { style?: string; format?: string }) => {
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

      const controller = new AbortController();
      activeControllersRef.current.add(controller);

      try {
        const finalPrompt =
          globalKeywords.length > 0 ? `${part.visual}, ${globalKeywords.join(", ")}` : part.visual;

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
            signal: controller.signal,
          },
          0
        ); // No retries for 3D as it's long-running and might duplicate tasks

        let data: any;
        let isJson = false;
        try {
          data = await response.json();
          isJson = true;
        } catch (parseError) {
          console.warn("Nie udało się rzutować odpowiedzi na JSON", parseError);
        }

        if (controller.signal.aborted) return;

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
          let errorMessage = isJson && data?.error ? `${data.error}${errorDetail}` : null;

          if (!errorMessage) {
            if (response.status === 429) {
              errorMessage = "Przekroczono limit zapytań do API (Rate Limit). Spróbuj ponownie za chwilę.";
            } else if (response.status === 401 || response.status === 403) {
              errorMessage = "Brak autoryzacji. Prawdopodobnie niepoprawny lub brakujący klucz API.";
            } else if (response.status >= 500) {
              errorMessage = `Błąd serwera podczas generowania modelu 3D (${response.status}).`;
            } else if (!response.ok) {
              errorMessage = `Błąd HTTP ${response.status}: ${response.statusText || "Nieznany błąd"}`;
            } else {
              errorMessage = "Wystąpił błąd: nieotrzymano poprawnego adresu URL modelu 3D.";
            }
          }

          console.error(`Failed to generate 3D model [${response.status}]:`, isJson ? data : response.statusText);
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
        if (controller.signal?.aborted) return;
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : "Nieznany błąd sieci lub serwera.";
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
      } finally {
        activeControllersRef.current.delete(controller);
      }
    },
    [scriptParts, globalKeywords, model3dStyle, model3dFormat, fetchWithRetry, setScriptParts]
  );

  const handleGenerateImage = useCallback(
    (index: number, options?: { aspectRatio?: string; variations?: number }, suppressToast?: boolean) => {
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
    },
    [scriptParts, globalKeywords, imageVariationsCount]
  );

  const handleGenerate3D = useCallback(
    (index: number, options?: { style?: string; format?: string }, suppressToast?: boolean) => {
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
    },
    [scriptParts, model3dStyle, model3dFormat]
  );

  const handleGenerateAllImages = useCallback(() => {
    let tasksAdded = 0;
    for (let i = 0; i < scriptParts.length; i++) {
      if (!scriptParts[i].imageUrl && !scriptParts[i].isGeneratingImage) {
        handleGenerateImage(i, { aspectRatio: "16:9", variations: imageVariationsCount }, true);
        tasksAdded++;
      }
    }
    if (tasksAdded > 0) {
      toast.success(`Dodano ${tasksAdded} zadań generowania obrazów do kolejki`);
    } else {
      toast.info("Wszystkie klatki mają już przetwarzane lub gotowe obrazy");
    }
  }, [scriptParts, imageVariationsCount, handleGenerateImage]);

  const handleGenerateAll3D = useCallback(() => {
    let tasksAdded = 0;
    for (let i = 0; i < scriptParts.length; i++) {
      if (!scriptParts[i].model3dUrl && !scriptParts[i].isGenerating3D) {
        handleGenerate3D(i, { style: model3dStyle, format: model3dFormat }, true);
        tasksAdded++;
      }
    }
    if (tasksAdded > 0) {
      toast.success(`Dodano ${tasksAdded} zadań generowania modelu 3D do kolejki`);
    } else {
      toast.info("Wszystkie klatki mają już przetwarzane lub gotowe modele 3D");
    }
  }, [scriptParts, model3dStyle, model3dFormat, handleGenerate3D]);

  // Task Processing Logic
  const tasks = useVslStore((state) => state.tasks);

  // Wrap derived state lists in useMemo
  const pendingTasks = useMemo(() => tasks.filter((t) => t.status === "pending"), [tasks]);
  const processingTasks = useMemo(() => tasks.filter((t) => t.status === "processing"), [tasks]);

  const isGeneratingAllImages = useMemo(
    () =>
      tasks.some((t) => t.type === "image" && (t.status === "pending" || t.status === "processing")) ||
      scriptParts.some((p) => p.isGeneratingImage),
    [tasks, scriptParts]
  );

  const isGeneratingAll3D = useMemo(
    () =>
      tasks.some((t) => t.type === "3d" && (t.status === "pending" || t.status === "processing")) ||
      scriptParts.some((p) => p.isGenerating3D),
    [tasks, scriptParts]
  );

  useEffect(() => {
    // limit concurrency to 2
    if (processingTasks.length < 2 && pendingTasks.length > 0) {
      const taskToRun = pendingTasks[0];
      const executeTask = async () => {
        useVslStore.getState().updateTaskStatus(taskToRun.id, "processing");
        useVslStore.getState().updateTaskProgress(taskToRun.id, 0);
        try {
          if (taskToRun.type === "image") {
            await executeImageGeneration(taskToRun.partIndex, taskToRun.options);
          } else if (taskToRun.type === "3d") {
            await execute3DGeneration(taskToRun.partIndex, taskToRun.options);
          } else if (taskToRun.type === "text") {
            await new Promise((resolve) => setTimeout(resolve, 3000));
            // Dla tekstury demo kończymy ze statusem completed i pokazujemy toasta.
            // Prawdziwa aplikacja zaktualizowałaby pole tekstu.
            toast.success("✅ Content Engine: Zadanie tekstowe wygenerowane pomyślnie.");
          }
          useVslStore.getState().updateTaskStatus(taskToRun.id, "completed");
          useVslStore.getState().updateTaskProgress(taskToRun.id, 100);
        } catch (e) {
          useVslStore
            .getState()
            .updateTaskStatus(taskToRun.id, "failed", e instanceof Error ? e.message : "Unknown error");
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
          state.updateTaskProgress(t.id, currentProgress + (t.type === "3d" ? 2 : 5));
        }
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const exportScript = useCallback(
    (format: "txt" | "md" | "json") => {
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
    },
    [scriptParts, topic]
  );

  const exportAudio = useCallback(async () => {
    if (!scriptParts || scriptParts.length === 0) {
      toast.error("Brak skryptu do eksportu.");
      return;
    }

    setIsExportingAudio(true);
    const toastId = toast.loading("Syntetyzowanie i generowanie pliku audio MP3...");
    const controller = new AbortController();
    activeControllersRef.current.add(controller);

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
        signal: controller.signal,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Błąd podczas generowania audio.");
      }

      const blob = await response.blob();
      if (controller.signal.aborted) return;
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
      if (controller.signal?.aborted) return;
      console.error(error);
      toast.error(error.message || "Nie udało się wyeksportować audio.", { id: toastId });
    } finally {
      activeControllersRef.current.delete(controller);
      if (!controller.signal?.aborted) {
        setIsExportingAudio(false);
      }
    }
  }, [scriptParts, selectedVoiceURI, voices]);

  const exportSingleAudio = useCallback(
    async (index: number) => {
      if (!scriptParts || !scriptParts[index]) {
        toast.error("Brak wybranego fragmentu do eksportu.");
        return;
      }

      setExportingPartIdx(index);
      const toastId = toast.loading(`Syntetyzowanie fragmentu ${index + 1} jako MP3...`);
      const controller = new AbortController();
      activeControllersRef.current.add(controller);

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
          signal: controller.signal,
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || "Błąd podczas generowania audio.");
        }

        const blob = await response.blob();
        if (controller.signal.aborted) return;
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
        if (controller.signal?.aborted) return;
        console.error(error);
        toast.error(error.message || "Nie udało się wyeksportować fragmentu audio.", { id: toastId });
      } finally {
        activeControllersRef.current.delete(controller);
        if (!controller.signal?.aborted) {
          setExportingPartIdx(null);
        }
      }
    },
    [scriptParts, selectedVoiceURI, voices]
  );

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

    const utterance = new SpeechSynthesisUtterance(scriptParts[currentPartIndex].text);

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

  const togglePlayback = useCallback(() => {
    setSpeakingIdx(null); // Cancel any single active part speech
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      if (currentPartIndex >= scriptParts.length) {
        setCurrentPartIndex(0);
      }
      setIsPlaying(true);
    }
  }, [isPlaying, currentPartIndex, scriptParts.length, setIsPlaying, setCurrentPartIndex]);

  const handleLoadProPreset = useCallback(() => {
    setTopic(
      "Drastycznie rosnący koszt pozyskania klienta (CAC) i całkowite wypalenie dotychczasowych lejków sprzedażowych. Mimo pompowania dziesiątek tysięcy złotych w reklamy Meta, leady są absurdalnie zimne, nie stawiają się na calle, a ci którzy przychodzą, nieustannie narzekają na cenę i porównują Cię z najtańszą konkurencją. Rosnąca frustracja i poczucie bycia zakładnikiem kapryśnych algorytmów oraz nieprzewidywalnego cash-flow."
    );
    setParameter("productName", "System Neuro-Conversion AI (lub Omega Protocol)");
    setParameter(
      "targetAudience",
      "Founderzy SaaS-ów, właściciele skalujących się agencji B2B oraz High-Ticket Coachowie (generujący min. 50k-100k PLN/mc), którzy utknęli pod szklanym sufitem skalowania i są fizycznie wycieńczeni ciągłym »gaszeniem pożarów« na back-endzie."
    );
    setParameter(
      "mainProblem",
      "Brak absolutnie przewidywalnego, zautomatyzowanego ekosystemu, który edukuje, indoktrynuje i »podgrzewa do czerwoności« leada na etapie pre-sellingu. Przez tę dziurę w lejku zmuszeni są walczyć o uwagę i ręcznie dopinać deale z niezakwalifikowanymi osobami, co niszczy ich marże."
    );
    setParameter(
      "keyBenefits",
      "Hiper-personalizacja tworząca gotowych do zakupu ewangelistów marki w zaledwie 48 godzin przy pomocy multimodalnych agentów AI. Obniżenie kosztu pozyskania (CPA) o 60%, odzyskanie 20 godzin pracy w tygodniu i bezwarunkowe przywrócenie poczucia absolutnej kontroli nad wzrostem firmy."
    );

    const kwStr =
      "cinematic lighting, hyper-realistic, dark moody atmosphere, deep neon crimson accents, corporate thriller aesthetic, extreme contrast, anamorphic lens flare, 8k, photorealistic, shadow play";
    setGlobalKeywords(kwStr.split(",").map((k) => k.trim()));
    toast.success("Załadowano Preset Absolutnego PRO!");
  }, [setTopic, setParameter, setGlobalKeywords]);

  const handleShareFacebook = useCallback(() => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?topic=${encodeURIComponent(topic)}`;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank");
    toast.success("Otwarto udostępnianie na Facebooku");
  }, [topic]);

  const handleShareX = useCallback(() => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?topic=${encodeURIComponent(topic)}`;
    const text = encodeURIComponent(`Sprawdź ten wygenerowany skrypt VSL na temat: ${topic}`);
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${text}`, "_blank");
    toast.success("Otwarto udostępnianie na X");
  }, [topic]);

  const handleShareLinkedIn = useCallback(() => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?topic=${encodeURIComponent(topic)}`;
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, "_blank");
    toast.success("Otwarto udostępnianie na LinkedIn");
  }, [topic]);

  const handleShareYouTube = useCallback(() => {
    toast.success("YouTube wymaga API do bezpośredniego uploadu. Pobierz wideo najpierw.");
  }, []);

  const handleCopyLink = useCallback(() => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?topic=${encodeURIComponent(topic)}`;
    setCopiedLink(true);
    navigator.clipboard.writeText(shareUrl);
    toast.success("Skopiowano link do udostępnienia");
    setTimeout(() => setCopiedLink(false), 2000);
  }, [topic]);

  const closeHistoryModal = useCallback(() => setIsHistoryModalOpen(false), []);
  const closeOutreachModal = useCallback(() => setIsOutreachModalOpen(false), []);
  const closeContentEngineModal = useCallback(() => setContentEngineModal(false), []);
  const closeTrendsModal = useCallback(() => setIsTrendsModalOpen(false), []);

  return (
    <div className="space-y-6">
      <VslHeader
        googleUser={googleUser}
        autoBackupEnabled={autoBackupEnabled}
        setAutoBackupEnabled={setAutoBackupEnabled}
        lastSaved={lastSaved}
        previousScriptsCount={previousScripts.length}
        setIsTrendsModalOpen={setIsTrendsModalOpen}
        setIsHistoryModalOpen={setIsHistoryModalOpen}
        handleLoadProPreset={handleLoadProPreset}
        handleManualSave={handleManualSave}
        googleSignIn={googleSignIn}
        setGoogleUser={setGoogleUser}
        fetchPreviousScripts={fetchPreviousScripts}
      />

      <VslParametersForm errors={errors} setErrors={setErrors} handleGenerate={handleGenerate} />

      {scriptParts.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <VslScriptToolbar
            setPartViewModes={setPartViewModes}
            setContentEngineModal={setContentEngineModal}
            setIsOutreachModalOpen={setIsOutreachModalOpen}
            backupToGoogleDrive={backupToGoogleDrive}
            isBackingUp={isBackingUp}
            googleUser={googleUser}
            backupStatus={backupStatus}
            exportAudio={exportAudio}
            isExportingAudio={isExportingAudio}
            exportScript={exportScript}
            handleGenerateAllImages={handleGenerateAllImages}
            isGeneratingAllImages={isGeneratingAllImages}
            handleGenerateAll3D={handleGenerateAll3D}
            isGeneratingAll3D={isGeneratingAll3D}
          />

          <AnimatePresence>
            {isPreviewVisible && scriptParts.length > 0 && (
              <VslPlayerPreview
                exportAudio={exportAudio}
                isExportingAudio={isExportingAudio}
                togglePlayback={togglePlayback}
                voices={voices}
                selectedVoiceURI={selectedVoiceURI}
                setSelectedVoiceURI={setSelectedVoiceURI}
                speechRate={speechRate}
                setSpeechRate={setSpeechRate}
                speechPitch={speechPitch}
                setSpeechPitch={setSpeechPitch}
              />
            )}
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`grid gap-4 ${
              viewMode === "storyboard"
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                : "grid-cols-1"
            }`}
          >
            {scriptParts.map((part, index) => {
              const resolvedMode = partViewModes[index] || viewMode;
              return (
                <VslScriptPartCardItem
                  key={`${resolvedMode}-${index}`}
                  part={part}
                  index={index}
                  resolvedMode={resolvedMode}
                  speakingIdx={speakingIdx}
                  exportingPartIdx={exportingPartIdx}
                  isGeneratingAllImages={isGeneratingAllImages}
                  isGeneratingAll3D={isGeneratingAll3D}
                  handleToggleSpeakPart={handleToggleSpeakPart}
                  exportSingleAudio={exportSingleAudio}
                  handleGenerateImage={handleGenerateImage}
                  handleGenerate3D={handleGenerate3D}
                  handleGenerateVisualPrompt={handleGenerateVisualPrompt}
                  handleSuggestKeywords={handleSuggestKeywords}
                  setPartViewModes={setPartViewModes}
                  previewModes={previewModes}
                  setPreviewModes={setPreviewModes}
                />
              );
            })}
          </motion.div>

          {/* Bottom Share component */}
          <div className="mt-8 bg-neutral-900 border border-neutral-800 rounded-xl p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-medium text-white flex items-center gap-2">
                  <Share2 size={18} className="text-indigo-400" />
                  Udostępnij darmowy podgląd
                </h3>
                <p className="text-sm text-neutral-400 mt-1">
                  Zdobądź więcej leadów lub podziel się skryptem VSL w social media.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleShareFacebook}
                  className="w-10 h-10 flex items-center justify-center bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2]/20 rounded-lg transition-colors font-bold text-lg"
                  title="Facebook"
                >
                  f
                </button>
                <button
                  onClick={handleShareX}
                  className="w-10 h-10 flex items-center justify-center bg-neutral-800 text-white hover:bg-neutral-700 rounded-lg transition-colors font-bold text-md"
                  title="X (Twitter)"
                >
                  X
                </button>
                <button
                  onClick={handleShareLinkedIn}
                  className="w-10 h-10 flex items-center justify-center bg-[#0A66C2]/10 text-[#0A66C2] hover:bg-[#0A66C2]/20 rounded-lg transition-colors font-bold text-sm"
                  title="LinkedIn"
                >
                  in
                </button>
                <button
                  onClick={handleShareYouTube}
                  className="w-10 h-10 flex items-center justify-center bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 rounded-lg transition-colors font-bold"
                  title="YouTube"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z" />
                    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="white" />
                  </svg>
                </button>

                <div className="w-px h-8 bg-neutral-800 mx-2"></div>

                <button
                  onClick={handleCopyLink}
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

      <VslHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={closeHistoryModal}
        previousScripts={previousScripts}
        isLoadingScripts={isLoadingScripts}
        loadPreviousScript={loadPreviousScript}
        deletePreviousScript={deletePreviousScript}
      />

      <VslOutreachModal
        isOpen={isOutreachModalOpen}
        onClose={closeOutreachModal}
        outreachClientName={outreachClientName}
        setOutreachClientName={setOutreachClientName}
        outreachClientEmail={outreachClientEmail}
        setOutreachClientEmail={setOutreachClientEmail}
        isGeneratingOutreach={isGeneratingOutreach}
        generatedOutreach={generatedOutreach}
        setGeneratedOutreach={setGeneratedOutreach}
        isSendingOutreach={isSendingOutreach}
        handleGenerateOutreach={handleGenerateOutreach}
        handleSendAndCreateClient={handleSendAndCreateClient}
      />

      <VslContentEngineModal isOpen={contentEngineModal} onClose={closeContentEngineModal} />

      <VslTrendsModal isOpen={isTrendsModalOpen} onClose={closeTrendsModal} />

      <TaskQueuePanel />
    </div>
  );
}
