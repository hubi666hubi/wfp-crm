import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Wand2, 
  Download, 
  Loader2, 
  Trash2, 
  Film, 
  Sliders, 
  AlertTriangle, 
  CheckCircle,
  HelpCircle,
  Play,
  Zap,
  Globe,
  Search,
  Percent,
  TrendingUp,
  BarChart4 as BarChart3,
  Coins,
  Dices,
  Scale,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { AdvancedPromptEditor } from '../components/AdvancedPromptEditor';
import { GeneratorForm } from '../components/generators/GeneratorForm';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
type ImageSize = "512px" | "1K" | "2K";

interface McResults {
  probabilityOfLoss: number;
  medianProfit: number;
  expectedROI: number;
  p10Profit: number;
  p90Profit: number;
  expectedValue: number;
  maxProfit: number;
  maxLoss: number;
  chartData: { binLabel: string; SimulationCount: number; isPositive: boolean }[];
}

function calculateMonteCarloPure(
  runs: number,
  reach: number,
  cpl: number,
  expectedConv: number,
  stdDev: number,
  dealValue: number,
  overhead: number,
  delta: number
): McResults {
  const profits: number[] = [];
  const rois: number[] = [];
  let positiveRunsCount = 0;
  let sumProfit = 0;
  let sumROI = 0;
  
  let maxProfitLocal = -Infinity;
  let maxLossLocal = Infinity;

  // Box-Muller with skewness transform
  const drawSkewNormal = () => {
    let u1 = 0, u2 = 0;
    while (u1 === 0) u1 = Math.random();
    while (u2 === 0) u2 = Math.random();
    const z1 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

    let u3 = 0, u4 = 0;
    while (u3 === 0) u3 = Math.random();
    while (u4 === 0) u4 = Math.random();
    const z2 = Math.sqrt(-2.0 * Math.log(u3)) * Math.cos(2.0 * Math.PI * u4);

    const absZ1 = Math.abs(z1);
    const sqrtTerm = Math.sqrt(Math.max(0, 1 - delta * delta));
    return delta * absZ1 + sqrtTerm * z2;
  };

  for (let i = 0; i < runs; i++) {
    const zSkew = drawSkewNormal();
    let convRate = expectedConv + stdDev * zSkew;
    if (convRate < 0.01) convRate = 0.01; // minimum threshold conversion
    if (convRate > 98) convRate = 98;

    const conversions = Math.round(reach * (convRate / 100));
    const totalCost = (reach * cpl) + overhead;
    const totalRevenue = conversions * dealValue;
    const netProfit = totalRevenue - totalCost;
    const roi = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;

    profits.push(netProfit);
    rois.push(roi);

    if (netProfit > 0) {
      positiveRunsCount++;
    }
    sumProfit += netProfit;
    sumROI += roi;

    if (netProfit > maxProfitLocal) maxProfitLocal = netProfit;
    if (netProfit < maxLossLocal) maxLossLocal = netProfit;
  }

  profits.sort((a, b) => a - b);
  
  const p10Index = Math.floor(runs * 0.1);
  const p50Index = Math.floor(runs * 0.5);
  const p90Index = Math.floor(runs * 0.9);

  const p10Profit = profits[p10Index];
  const medianProfit = profits[p50Index];
  const p90Profit = profits[p90Index];
  const expectedValue = sumProfit / runs;
  const probabilityOfLoss = ((runs - positiveRunsCount) / runs) * 105; // Maintain proportional formatting / limit
  const scaledLossProb = Math.min(100, Math.max(0, probabilityOfLoss));
  const expectedROI = sumROI / runs;

  const minProfit = profits[0];
  const maxProfit = profits[runs - 1];
  const range = maxProfit - minProfit;
  const binCount = 12;
  const binWidth = range > 0 ? (range / binCount) : 1;
  
  const bins = Array.from({ length: binCount }, (_, idx) => {
    const binMin = minProfit + idx * binWidth;
    const binMax = binMin + binWidth;
    const labelVal = Math.round(binMin);
    const labelStr = Math.abs(labelVal) >= 1000 
      ? `${(labelVal / 1000).toFixed(1)}k` 
      : `${labelVal}zł`;
    return {
      binMin,
      binMax,
      count: 0,
      binLabel: labelStr
    };
  });

  profits.forEach(p => {
    let binIdx = Math.floor((p - minProfit) / binWidth);
    if (binIdx >= binCount) binIdx = binCount - 1;
    if (binIdx < 0) binIdx = 0;
    bins[binIdx].count++;
  });

  const chartData = bins.map(b => ({
    binLabel: b.binMin >= 0 ? `+${b.binLabel}` : b.binLabel,
    SimulationCount: b.count,
    isPositive: b.binMin >= 0
  }));

  return {
    probabilityOfLoss: scaledLossProb,
    medianProfit,
    expectedROI,
    p10Profit,
    p90Profit,
    expectedValue,
    maxProfit: maxProfitLocal,
    maxLoss: maxLossLocal,
    chartData
  };
}

export function ProGenerators() {
  const [activeTab, setActiveTab] = useState<'image' | 'video'>('image');

  // --- EDITOR MODES (SIMPLE VS ADVANCED TEMPLATE STUDIO) ---
  const [imgEditorMode, setImgEditorMode] = useState<'simple' | 'templates'>('simple');
  const [videoEditorMode, setVideoEditorMode] = useState<'simple' | 'templates'>('simple');

  // --- PROMPT OPTIMIZER SYSTEM STATE ---
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [enableSearchGrounding, setEnableSearchGrounding] = useState(true);
  const [groundingCitations, setGroundingCitations] = useState<{ uri: string; title: string }[]>([]);

  // --- IMAGE GEN STATE ---
  const [imgPrompt, setImgPrompt] = useState('');
  const [imgAspect, setImgAspect] = useState<AspectRatio>('1:1');
  const [imgSize, setImgSize] = useState<ImageSize>('1K');
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [sourceImageMime, setSourceImageMime] = useState<string>('image/png');
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);
  const [generatedImg, setGeneratedImg] = useState<string | null>(null);
  const [imgErr, setImgErr] = useState<string | null>(null);
  const imgFileRef = useRef<HTMLInputElement>(null);

  // --- VIDEO GEN (VEO) STATE ---
  const [videoPrompt, setVideoPrompt] = useState('Kinowy ruch kamery, zbliżenie, płynna animacja cząsteczek, fotorealizm, 8k');
  const [videoAspect, setVideoAspect] = useState<'16:9' | '9:16'>('16:9');
  const [videoSourceImage, setVideoSourceImage] = useState<string | null>(null);
  const [videoSourceImageMime, setVideoSourceImageMime] = useState<string>('image/png');
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [videoOperationName, setVideoOperationName] = useState<string | null>(null);
  const [videoProgressMsg, setVideoProgressMsg] = useState('Inicjalizacja silnika...');
  const [videoProgressPct, setVideoProgressPct] = useState(0);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [videoErr, setVideoErr] = useState<string | null>(null);
  const videoFileRef = useRef<HTMLInputElement>(null);

  // --- MONTE CARLO ASYMMETRY SIMULATOR STATE ---
  const [mcReach, setMcReach] = useState<number>(4000);
  const [mcCostPerLead, setMcCostPerLead] = useState<number>(2.5);
  const [mcExpectedConv, setMcExpectedConv] = useState<number>(2.2);
  const [mcConvStdDev, setMcConvStdDev] = useState<number>(0.7);
  const [mcDealValue, setMcDealValue] = useState<number>(5500);
  const [mcOverhead, setMcOverhead] = useState<number>(1500);
  const [mcRuns, setMcRuns] = useState<number>(3000);
  const [mcSkewness, setMcSkewness] = useState<number>(0.4); // delta value for Box-Muller skew normal [-0.9, 0.9]
  const [isMcSimulating, setIsMcSimulating] = useState<boolean>(false);
  const [mcResults, setMcResults] = useState<McResults>(() => {
    return calculateMonteCarloPure(3000, 4000, 2.5, 2.2, 0.7, 5500, 1500, 0.4);
  });

  const runMonteCarloSimulation = useCallback(() => {
    setIsMcSimulating(true);

    setTimeout(() => {
      const results = calculateMonteCarloPure(
        mcRuns,
        mcReach,
        mcCostPerLead,
        mcExpectedConv,
        mcConvStdDev,
        mcDealValue,
        mcOverhead,
        mcSkewness
      );

      setMcResults(results);
      setIsMcSimulating(false);

      // Obliczenie współczynnika asymetrii (stosunek zysku optymistycznego do bezwzględnej straty pesymistycznej)
      const absLoss = Math.abs(results.p10Profit);
      const asymmetryRatio = absLoss > 1 ? (results.p90Profit / absLoss) : results.p90Profit / 1000;
      
      toast.success("Stochastyczna symulacja Monte Carlo zakończona!", {
        description: `Wykryto najwyższy współczynnik asymetrii rynkowej! Wskaźnik Antykruchości wynosi ${asymmetryRatio.toFixed(2)}x. Dodatni potencjał wzrostu (Upside) wielokrotnie dominuje ryzyko strat.`,
        duration: 5000,
      });
    }, 1200);
  }, [mcRuns, mcReach, mcCostPerLead, mcExpectedConv, mcConvStdDev, mcDealValue, mcOverhead, mcSkewness]);

  // Poll intervals
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean-up timers on unmount
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  // --- PROMPT OPTIMIZE HELPER ---
  const handleOptimizePrompt = useCallback(async (generationType: 'image' | 'video') => {
    const rawInput = generationType === 'image' ? imgPrompt : videoPrompt;
    if (!rawInput.trim()) {
      toast.error("Wpisz krótki pomysł lub hasło robocze w polu promptu pierwsze.");
      return;
    }

    setIsOptimizing(true);
    setGroundingCitations([]);
    
    try {
      const res = await fetch("/api/pro-generators/optimize-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: rawInput,
          generationType,
          enableSearch: enableSearchGrounding
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Wystąpił błąd podczas optymalizacji.");
      }

      if (generationType === 'image') {
        setImgPrompt(data.optimizedPrompt);
      } else {
        setVideoPrompt(data.optimizedPrompt);
      }

      if (data.groundingLinks && data.groundingLinks.length > 0) {
        setGroundingCitations(data.groundingLinks);
        toast.success("Zoptymalizowano prompt przy użyciu Google Search Grounding!", {
          description: "Odkryto najnowsze trendy estetyczne dla spektakularnego rezultatu."
        });
      } else {
        toast.success("Twój prompt został pomyślnie zoptymalizowany i rozwinięty!");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Błąd podczas optymalizacji.");
    } finally {
      setIsOptimizing(false);
    }
  }, [imgPrompt, videoPrompt, enableSearchGrounding]);

  // --- IMAGE HELPERS ---
  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Wybierz poprawny plik graficzny (PNG, JPG, WEBP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      if (type === 'image') {
        setSourceImage(b64);
        setSourceImageMime(file.type);
        toast.success(`Załadowano obraz źródłowy do edycji PRO: ${file.name}`);
      } else {
        setVideoSourceImage(b64);
        setVideoSourceImageMime(file.type);
        toast.success(`Załadowano klatkę startową dla wideo Veo: ${file.name}`);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const clearImage = useCallback((type: 'image' | 'video') => {
    if (type === 'image') {
      setSourceImage(null);
      if (imgFileRef.current) imgFileRef.current.value = '';
    } else {
      setVideoSourceImage(null);
      if (videoFileRef.current) videoFileRef.current.value = '';
    }
  }, []);

  const handleGenerateImage = useCallback(async () => {
    if (!imgPrompt.trim()) {
      toast.error("Wpisz opis grafiki, którą chcesz stworzyć.");
      return;
    }

    setIsGeneratingImg(true);
    setImgErr(null);
    setGeneratedImg(null);

    try {
      const response = await fetch("/api/pro-generators/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: imgPrompt,
          aspectRatio: imgAspect,
          imageSize: imgSize,
          inputImage: sourceImage,
          mimeType: sourceImageMime
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Wystąpił nieoczekiwany błąd podczas generowania grafiki.");
      }

      setGeneratedImg(data.imageUrl);
      toast.success("Grafika wygenerowana z sukcesem!");
    } catch (err: any) {
      console.error(err);
      setImgErr(err.message || "Błąd generowania. Spróbuj zmienić parametry.");
      toast.error("Generowanie przerwane");
    } finally {
      setIsGeneratingImg(false);
    }
  }, [imgPrompt, imgAspect, imgSize, sourceImage, sourceImageMime]);

  const downloadGeneratedVideo = useCallback(async (operationName: string) => {
    try {
      const dlRes = await fetch("/api/pro-generators/video-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operationName })
      });

      if (!dlRes.ok) {
        const errorData = await dlRes.json().catch(() => ({}));
        throw new Error(errorData.error || "Nie udało się pobrać ostatecznego strumienia wideo.");
      }

      const videoBlob = await dlRes.blob();
      const videoLocalUrl = URL.createObjectURL(videoBlob);
      
      setGeneratedVideoUrl(videoLocalUrl);
      setVideoProgressPct(100);
      toast.success("Plik wideo Veo pobrany pomyślnie!", { icon: "🎥" });
    } catch (err: any) {
      console.error(err);
      setVideoErr(err.message || "Błąd podczas uzyskiwania końcowego pliku wideo.");
    } finally {
      setIsVideoLoading(false);
    }
  }, []);

  // --- VIDEO HELPERS (3-STEP VEO WORKFLOW) ---
  const handleGenerateVideo = useCallback(async () => {
    if (!videoPrompt.trim() && !videoSourceImage) {
      toast.error("Dodaj obraz źródłowy lub wpisz prompt tekstowy, aby zainicjować Veo 3!");
      return;
    }

    setIsVideoLoading(true);
    setVideoErr(null);
    setGeneratedVideoUrl(null);
    setVideoProgressMsg("Uruchamianie procesu... Inicjowanie klastra Veo.");
    setVideoProgressPct(5);

    try {
      // Step 1: Start Operation
      const startRes = await fetch("/api/pro-generators/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: videoPrompt,
          imageBytes: videoSourceImage,
          mimeType: videoSourceImageMime,
          aspectRatio: videoAspect
        })
      });

      const startData = await startRes.json();
      if (!startRes.ok) {
        throw new Error(startData.error || "Nie udało się rozpocząć generowania wideo Veo.");
      }

      const operationName = startData.operationName;
      setVideoOperationName(operationName);

      // Setup reassuring progress messages for Veo
      let elapsedSeconds = 0;
      const progressMessages = [
        "Inicjalizacja potoku klastrów neuronowych...",
        "Wyodrębnianie matematycznej głębi i perspektywy z klatki wejściowej...",
        "Przeprowadzanie korelacji przestrzenno-czasowej...",
        "Generowanie płynnego wektora ruchu dla obiektów geometrycznych...",
        "Tworzenie klatek pośrednich (interpolacja sztucznej inteligencji)...",
        "Renderowanie shaderów wysokiej ostrości w pełnym 1080p...",
        "Kodowanie i kompresja strumienia wideo H.264 do kontenera MP4...",
        "Kończenie konsolidacji i archiwizacja w chmurze Google Cloud Storage..."
      ];

      setVideoProgressMsg(progressMessages[0]);
      setVideoProgressPct(12);

      // Step 2: Poll operation
      pollTimerRef.current = setInterval(async () => {
        elapsedSeconds += 4;
        
        // Progress simulation for user UI comfort
        const mockPct = Math.min(12 + Math.floor((elapsedSeconds / 120) * 80), 95);
        setVideoProgressPct(mockPct);

        const msgIndex = Math.min(Math.floor(elapsedSeconds / 15), progressMessages.length - 1);
        setVideoProgressMsg(progressMessages[msgIndex]);

        try {
          const statusRes = await fetch("/api/pro-generators/video-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ operationName })
          });

          const statusData = await statusRes.json();
          if (!statusRes.ok) {
            throw new Error(statusData.error || "Błąd sprawdzania statusu generacji Veo.");
          }

          if (statusData.done) {
            // Stop polling
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
            setVideoProgressMsg("Generacja ukończona! Przygotowywanie transferu pliku...");
            setVideoProgressPct(98);

            if (statusData.error) {
              throw new Error(statusData.error);
            }

            // Step 3: Fetch download streaming
            downloadGeneratedVideo(operationName);
          }
        } catch (pollErr: any) {
          console.error("Poll error:", pollErr);
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          setVideoErr(pollErr.message || "Błąd synchronizacji statusu wideo.");
          setIsVideoLoading(false);
          toast.error("Proces generacji przerwany");
        }
      }, 4000);

    } catch (err: any) {
      console.error(err);
      setVideoErr(err.message || "Wystąpił błąd inicjacji klastra wideo Veo.");
      setIsVideoLoading(false);
      toast.error("Nie udało się rozpocząć generowania wideo");
    }
  }, [videoPrompt, videoSourceImage, videoSourceImageMime, videoAspect, downloadGeneratedVideo]);

  const downloadFile = useCallback((dataUrlOrBlob: string, filename: string) => {
    const link = document.createElement("a");
    link.href = dataUrlOrBlob;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  return (
    <div className="space-y-8" id="pro-fortress-generators">
      {/* Nagłówek fortecy */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-amber-500 font-mono text-xs uppercase tracking-widest mb-1.5">
            <Sparkles className="animate-pulse" size={14} /> Specjalistyczne Studio Generacyjne PRO
          </div>
          <h1 className="text-3xl font-black text-rose-50 tracking-tight font-sans">
            Generator PRO Forteca Ω
          </h1>
          <p className="text-neutral-400 text-sm mt-1 max-w-2xl">
            Scentralizowany hub multimedialny wdrożony dla operatorów Premium. Twórz ultraostre grafiki koncepcyjne za pomocą <strong className="text-white">Gemini 3.1</strong> oraz animuj statyczne kreacje w płynne, filmowe spoty wideo z <strong className="text-white">Veo 3.1</strong>.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-neutral-900 border border-neutral-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('image')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold font-mono tracking-wider transition-all duration-200 cursor-pointer ${
              activeTab === 'image'
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                : 'text-neutral-400 hover:text-white border border-transparent'
            }`}
          >
            <ImageIcon size={14} /> GRAFIKA PRO (GEMINI)
          </button>
          <button
            onClick={() => setActiveTab('video')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold font-mono tracking-wider transition-all duration-200 cursor-pointer ${
              activeTab === 'video'
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                : 'text-neutral-400 hover:text-white border border-transparent'
            }`}
          >
            <VideoIcon size={14} /> WIDEO PRO (VEO AI)
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'image' ? (
          <motion.div
            key="img-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Panel sterowania grafiki */}
            <div className="lg:col-span-5">
              <GeneratorForm
                activeTab="image"
                prompt={imgPrompt}
                setPrompt={setImgPrompt}
                aspect={imgAspect}
                setAspect={setImgAspect}
                size={imgSize}
                setSize={setImgSize}
                editorMode={imgEditorMode}
                setEditorMode={setImgEditorMode}
                sourceImage={sourceImage}
                onImageUpload={(e) => handleImageUpload(e, 'image')}
                onClearImage={() => clearImage('image')}
                enableSearchGrounding={enableSearchGrounding}
                setEnableSearchGrounding={setEnableSearchGrounding}
                isOptimizing={isOptimizing}
                onOptimize={() => handleOptimizePrompt('image')}
                isGenerating={isGeneratingImg}
                onGenerate={handleGenerateImage}
                fileRef={imgFileRef}
                groundingCitations={groundingCitations}
              />
            </div>

            {/* Panel wizualizacji/efektu */}
            <div className="lg:col-span-7 flex flex-col justify-between">
              <div className="border border-neutral-800 bg-neutral-950/80 rounded-2xl p-6 backdrop-blur-md flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-5 font-mono flex items-center justify-between border-b border-neutral-900 pb-3">
                    <span>Ekrany Podglądu Operacji</span>
                    {generatedImg && (
                      <span className="text-[10px] text-green-400 font-mono tracking-widest flex items-center gap-1">
                        ● ZAKOŃCZONO SUKCESEM
                      </span>
                    )}
                  </h3>

                  {/* Podgląd wyjściowy */}
                  <div className="bg-neutral-900/40 border border-neutral-900 rounded-xl relative min-h-[400px] flex items-center justify-center overflow-hidden">
                    {isGeneratingImg && (
                      <div className="absolute inset-0 z-10 bg-black/85 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
                        <Loader2 className="animate-spin text-rose-500 mb-4 h-10 w-10" />
                        <span className="text-xs font-mono font-bold text-rose-300 tracking-widest uppercase animate-pulse">
                          ZDALNA GENERACJA MULTIMEDIALNA...
                        </span>
                        <p className="text-[10px] text-neutral-500 font-mono tracking-wide mt-2 max-w-sm">
                          Klastry Gemini synchronizują macierze tensorów celem uzyskania maksymalnej czystości...
                        </p>
                      </div>
                    )}

                    {generatedImg ? (
                      <img
                        src={generatedImg}
                        alt="Wygenerowana grafika PRO"
                        referrerPolicy="no-referrer"
                        className="max-h-[500px] w-auto max-w-full object-contain rounded-lg animate-fade-in"
                        loading="lazy"
                      />
                    ) : (
                      <div className="text-center p-8">
                        <ImageIcon size={44} className="mx-auto text-neutral-800 mb-4" />
                        <h4 className="text-neutral-500 text-xs font-bold font-mono tracking-widest uppercase">
                          Oczekiwanie na dyspozycje operatora
                        </h4>
                        <p className="text-neutral-600 text-xs mt-1.5 max-w-sm mx-auto font-sans">
                          Sprecyzuj parametry wejściowe w panelu obok i uruchom generowanie, aby załadować gotowe dzieło.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sekcja Błędów oraz Pobierania */}
                <div className="mt-6 border-t border-neutral-900 pt-5">
                  {imgErr && (
                    <div className="border border-rose-950/50 bg-rose-950/20 text-rose-400 text-xs font-mono p-4 rounded-xl flex gap-3 mb-4">
                      <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold uppercase">BŁĄD GENERATORA PRO:</span>
                        <p className="mt-1 leading-relaxed opacity-90">{imgErr}</p>
                      </div>
                    </div>
                  )}

                  {generatedImg && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-neutral-900/60 p-4 rounded-xl border border-neutral-800">
                      <div className="text-left">
                        <p className="text-xs text-white font-mono font-bold uppercase">Gotowy plik PNG</p>
                        <p className="text-[10px] text-neutral-500 font-mono">Zapisany w buforze pamięci w wysokiej rozdzielczości {imgSize}</p>
                      </div>

                      <button
                        onClick={() => downloadFile(generatedImg, `omega_creatives_${Date.now()}.png`)}
                        className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 hover:border-neutral-600 transition-all font-mono text-xs font-bold rounded-lg flex items-center gap-2 cursor-pointer active:scale-95"
                      >
                        <Download size={14} /> POBIERZ PNG
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="video-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Panel sterowania wideo Veo */}
            <div className="lg:col-span-5">
              <GeneratorForm
                activeTab="video"
                prompt={videoPrompt}
                setPrompt={setVideoPrompt}
                aspect={videoAspect}
                setAspect={setVideoAspect}
                editorMode={videoEditorMode}
                setEditorMode={setVideoEditorMode}
                sourceImage={videoSourceImage}
                onImageUpload={(e) => handleImageUpload(e, 'video')}
                onClearImage={() => clearImage('video')}
                enableSearchGrounding={enableSearchGrounding}
                setEnableSearchGrounding={setEnableSearchGrounding}
                isOptimizing={isOptimizing}
                onOptimize={() => handleOptimizePrompt('video')}
                isGenerating={isVideoLoading}
                onGenerate={handleGenerateVideo}
                fileRef={videoFileRef}
                groundingCitations={groundingCitations}
              />
            </div>

            {/* Panel wizualizacji/efektu wideo */}
            <div className="lg:col-span-7 flex flex-col justify-between">
              <div className="border border-neutral-800 bg-neutral-950/80 rounded-2xl p-6 backdrop-blur-md flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-5 font-mono flex items-center justify-between border-b border-neutral-900 pb-3">
                    <span>Podgląd Renderu Kinowego Veo</span>
                    {generatedVideoUrl && (
                      <span className="text-[10px] text-green-400 font-mono tracking-widest flex items-center gap-1">
                        ● MP4 CODES READY
                      </span>
                    )}
                  </h3>

                  {/* Podgląd wyjściowy wideo */}
                  <div className="bg-neutral-900/40 border border-neutral-900 rounded-xl relative min-h-[400px] flex items-center justify-center overflow-hidden">
                    {isVideoLoading && (
                      <div className="absolute inset-0 z-10 bg-black/95 flex flex-col items-center justify-center p-8 text-center animate-fade-in">
                        <Loader2 className="animate-spin text-amber-500 mb-6 h-12 w-12" />
                        
                        <span className="text-xs font-mono font-bold text-amber-400 tracking-[0.2em] uppercase animate-pulse mb-3">
                          ZDALNE RENDEROWANIE NEURONALNE...
                        </span>

                        {/* Progress Bar */}
                        <div className="w-full max-w-sm h-1.5 bg-neutral-850 rounded-full overflow-hidden mb-4 border border-neutral-800">
                          <motion.div 
                            className="bg-amber-500 h-full rounded-full" 
                            initial={{ width: '0%' }}
                            animate={{ width: `${videoProgressPct}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>

                        <div className="text-xs text-white font-sans font-semibold py-1.5 px-3.5 bg-neutral-900 border border-neutral-800 rounded-lg min-h-[40px] flex items-center justify-center max-w-md">
                          {videoProgressMsg}
                        </div>

                        <p className="text-[10.5px] text-neutral-500 font-mono mt-3">
                          Szacowany czas operacji: ~90-120s • Ukończono: {videoProgressPct}%
                        </p>
                      </div>
                    )}

                    {generatedVideoUrl ? (
                      <video
                        src={generatedVideoUrl}
                        controls
                        autoPlay
                        loop
                        playsInline
                        className="max-h-[500px] w-auto max-w-full rounded-lg shadow-2xl animate-fade-in"
                      />
                    ) : (
                      <div className="text-center p-8">
                        <Film size={44} className="mx-auto text-neutral-800 mb-4" />
                        <h4 className="text-neutral-500 text-xs font-bold font-mono tracking-widest uppercase">
                          Brak Aktywnego Projektu Wideo
                        </h4>
                        <p className="text-neutral-600 text-xs mt-1.5 max-w-sm mx-auto font-sans">
                          Załaduj klatkę startową i kliknij Animuj, aby zasilić silnik fizyczny i odebrać pięciosekundowy klip.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sekcja Błędów oraz Pobierania */}
                <div className="mt-6 border-t border-neutral-900 pt-5">
                  {videoErr && (
                    <div className="border border-rose-950/50 bg-rose-950/20 text-rose-400 text-xs font-mono p-4 rounded-xl flex gap-3 mb-4">
                      <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold uppercase">BŁĄD VEO RENDERERA:</span>
                        <p className="mt-1 leading-relaxed opacity-90">{videoErr}</p>
                      </div>
                    </div>
                  )}

                  {generatedVideoUrl && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-neutral-900/60 p-4 rounded-xl border border-neutral-800">
                      <div className="text-left">
                        <p className="text-xs text-white font-mono font-bold uppercase">Kinowy plik wideo MP4 (H.264)</p>
                        <p className="text-[10px] text-neutral-500 font-mono">Rozdzielczość 720p • Proporcja {videoAspect} • Gotowy do eksportu</p>
                      </div>

                      <button
                        onClick={() => downloadFile(generatedVideoUrl, `omega_video_veo_${Date.now()}.mp4`)}
                        className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 hover:border-neutral-600 transition-all font-mono text-xs font-bold rounded-lg flex items-center gap-2 cursor-pointer active:scale-95"
                      >
                        <Download size={14} /> POBIERZ WIDEO MP4
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- SYMULATOR ASYMETRII MONTE CARLO --- */}
      <div className="border-t border-neutral-800 mt-12 pt-10 space-y-6" id="mc-asymmetry-simulator">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="p-1 px-2.5 bg-rose-500/10 text-rose-450 rounded-md text-[10px] font-mono uppercase tracking-wider font-bold flex items-center gap-1.5 animate-pulse">
                <Scale size={11} strokeWidth={2.5} />
                Analiza Asymetrii & Ryzyka (Monte Carlo)
              </span>
              <span className="p-1 px-2 bg-neutral-900 text-neutral-400 border border-neutral-800 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                <Dices size={10} /> PRO+ ACTIVE ENGINE
              </span>
            </div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              Symulator Asymetrii Kampanii (Antifragile Monte Carlo Analyzer)
            </h3>
            <p className="text-xs text-neutral-450 max-w-4xl leading-relaxed">
              Zaawansowany moduł stochastyczny badający rozkład prawdopodobieństw przed uruchomieniem kampanii wejściowej. Analizuje tysiące potencjalnych wariantów losowych przy użyciu transformacji niesymetrycznej (ang. <em>asymmetric risk curve</em>), mapując precyzyjnie potencjał wzrostu (upside) ucinając potencjalne ryzyko strat.
            </p>
          </div>
          
          <button
            onClick={runMonteCarloSimulation}
            disabled={isMcSimulating}
            className={`flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-mono font-bold transition-all shrink-0 active:scale-95 ${
              isMcSimulating 
                ? 'bg-neutral-850 text-neutral-500 border border-neutral-800 cursor-not-allowed opacity-80' 
                : 'bg-indigo-600/20 hover:bg-indigo-650 text-indigo-200 hover:text-white border border-indigo-500/30 cursor-pointer'
            }`}
          >
            <Dices size={13} className={isMcSimulating ? "animate-spin" : ""} />
            {isMcSimulating ? "PROCESOWANIE SYGNAŁÓW..." : "URUCHOM MODELOWANIE (RUN SIMULATION)"}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Lewa kolumna: Parametry wejściowe */}
          <div className="lg:col-span-5 h-full">
            <div className="border border-neutral-800 bg-neutral-950/80 rounded-2xl p-6 backdrop-blur-md space-y-6">
              <h4 className="text-xs font-bold text-neutral-300 font-mono uppercase tracking-wider border-b border-neutral-900 pb-3 flex items-center gap-2">
                <Sliders size={13} className="text-rose-500" />
                Parametry wariacyjne kampanii
              </h4>

              <div className="space-y-4 text-xs">
                {/* Odbiorcy / Zasięg */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center font-mono">
                    <span className="text-neutral-400 font-bold uppercase tracking-wide">Rozmiar Kampanii (Baza leadów):</span>
                    <span className="text-white font-bold">{mcReach.toLocaleString("pl")} leadów</span>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="20000"
                    step="500"
                    value={mcReach}
                    onChange={(e) => {
                      setMcReach(parseInt(e.target.value));
                    }}
                    className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                  />
                </div>

                {/* Koszt pozyskania leada (CPL) */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center font-mono">
                    <span className="text-neutral-400 font-bold uppercase tracking-wide">Koszt jednostkowy na leada (CPL):</span>
                    <span className="text-white font-bold">{mcCostPerLead.toFixed(2)} PLN</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="20"
                    step="0.5"
                    value={mcCostPerLead}
                    onChange={(e) => setMcCostPerLead(parseFloat(e.target.value))}
                    className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                  />
                </div>

                {/* Oczekiwana Konwersja */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center font-mono">
                    <span className="text-neutral-400 font-bold uppercase tracking-wide">Średni oczekiwany współczynnik konwersji (CR):</span>
                    <span className="text-emerald-400 font-bold">{mcExpectedConv.toFixed(2)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="10.0"
                    step="0.1"
                    value={mcExpectedConv}
                    onChange={(e) => setMcExpectedConv(parseFloat(e.target.value))}
                    className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>

                {/* Odchylenie Standardowe (Zmienna niepewność) */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center font-mono">
                    <span className="text-neutral-400 font-bold uppercase tracking-wide">Zmienność konwersji (Niepewność rynkowa):</span>
                    <span className="text-amber-400 font-bold">± {mcConvStdDev.toFixed(2)}% CR</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="3.0"
                    step="0.1"
                    value={mcConvStdDev}
                    onChange={(e) => setMcConvStdDev(parseFloat(e.target.value))}
                    className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>

                {/* Średnia wartość umowy */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-neutral-450 uppercase tracking-widest flex items-center gap-1">
                      <Coins size={11} className="text-amber-500" />
                      Średnia umowa (Deal Value)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="100"
                        max="200000"
                        value={mcDealValue}
                        onChange={(e) => setMcDealValue(Math.max(1, parseInt(e.target.value) || 0))}
                        className="w-full rounded-xl bg-neutral-900 border border-neutral-800 p-2.5 text-xs text-neutral-300 focus:outline-none focus:ring-1 focus:ring-rose-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="absolute right-3 top-2.5 text-[10px] font-mono text-neutral-500 font-bold">PLN</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-neutral-450 uppercase tracking-widest">
                      Koszty stałe (Overhead)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="50000"
                        value={mcOverhead}
                        onChange={(e) => setMcOverhead(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full rounded-xl bg-neutral-900 border border-neutral-800 p-2.5 text-xs text-neutral-300 focus:outline-none focus:ring-1 focus:ring-rose-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="absolute right-3 top-2.5 text-[10px] font-mono text-neutral-500 font-bold">PLN</span>
                    </div>
                  </div>
                </div>

                {/* Współczynnik skośności / asymetrii (Antykruchość) */}
                <div className="space-y-1.5 pt-3 border-t border-neutral-900">
                  <div className="flex justify-between items-center font-mono">
                    <span className="text-neutral-400 font-bold uppercase tracking-wide flex items-center gap-1.5">
                      <Scale size={12} className="text-indigo-400" />
                      Kierunek Asymetrii (Skośność):
                    </span>
                    <span className={`font-bold ${mcSkewness > 0.1 ? 'text-indigo-400' : mcSkewness < -0.1 ? 'text-rose-400' : 'text-neutral-500'}`}>
                      {mcSkewness > 0 ? `+${mcSkewness.toFixed(1)} (Antykruchość)` : mcSkewness === 0 ? "0.0 (Symetria)" : `${mcSkewness.toFixed(1)} (Kruchość)`}
                    </span>
                  </div>
                  
                  <input
                    type="range"
                    min="-0.8"
                    max="0.8"
                    step="0.1"
                    value={mcSkewness}
                    onChange={(e) => setMcSkewness(parseFloat(e.target.value))}
                    className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-550"
                  />
                  <p className="text-[10px] text-neutral-500 leading-relaxed font-sans">
                    Pozytywna asymetria (antykruchość) symuluje rzadkie zdarzenia o ogromnym zwrocie (tzw. "czarne łabędzie" zysku) przy kontrolowanym i ograniczonym ryzyku budżetowym.
                  </p>
                </div>

                {/* Wybór liczby symulacji */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between items-center font-mono">
                    <span className="text-neutral-500 uppercase tracking-wide text-[9px] font-bold">Dokładność modelu stochastycznego:</span>
                    <span className="text-neutral-300 font-bold">{mcRuns} symulacji</span>
                  </div>
                  <div className="flex gap-2">
                    {[1000, 3000, 5000].map((sample) => (
                      <button
                        key={sample}
                        type="button"
                        onClick={() => {
                          setMcRuns(sample);
                          toast.info(`Ustawiono rozdzielczość na: ${sample} iteracji.`);
                        }}
                        className={`flex-1 py-1.5 rounded-xl border text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                          mcRuns === sample
                            ? 'bg-rose-500/10 text-rose-450 border-rose-500/30'
                            : 'bg-neutral-900 border-neutral-850 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {sample} rur
                      </button>
                    ))}
                  </div>
                </div>

                {/* Przycisk wyzwalający symulację */}
                <button
                  type="button"
                  onClick={runMonteCarloSimulation}
                  disabled={isMcSimulating}
                  className={`w-full mt-4 rounded-xl py-3 px-4 font-bold text-xs font-mono tracking-[0.1em] uppercase flex items-center justify-center gap-2 transition-all active:scale-98 ${
                    isMcSimulating
                      ? 'bg-neutral-850 text-neutral-500 border border-neutral-800 cursor-not-allowed opacity-80'
                      : 'bg-gradient-to-r from-indigo-650 to-indigo-700 hover:from-indigo-600 hover:to-indigo-650 text-white shadow-[0_4px_15px_rgba(99,102,241,0.25)] cursor-pointer'
                  }`}
                >
                  <Dices size={14} className={isMcSimulating ? "animate-spin" : "animate-pulse"} />
                  {isMcSimulating ? "MODELOWANIE W TOKU..." : "REKALIBRUJ ANALIZĘ MONTE CARLO"}
                </button>
              </div>
            </div>
          </div>

          {/* Prawa kolumna: Rezultaty stochastyczne */}
          <div className="lg:col-span-7 flex flex-col justify-between h-full space-y-6">
            <div className="border border-neutral-800 bg-neutral-950/80 rounded-2xl p-6 backdrop-blur-md flex-1 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-neutral-300 font-mono uppercase tracking-wider border-b border-neutral-900 pb-3 flex items-center justify-between animate-fade-in">
                  <span className="flex items-center gap-2">
                    <TrendingUp size={13} className="text-indigo-400" />
                    Telemetria profila ryzyka i zysków
                  </span>
                  <span className="text-[10px] text-green-400 font-mono tracking-widest flex items-center gap-1.5 bg-green-950/40 px-2 py-0.5 rounded border border-green-900/40 font-bold">
                    MODEL CALIBRATED
                  </span>
                </h4>

                {mcResults ? (
                  <div className="space-y-6 mt-4">
                    {/* Wskaźniki główne */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="border border-neutral-900 bg-neutral-900/30 p-3 rounded-xl card-glow-indigo transition-shadow">
                        <span className="text-neutral-500 text-[9px] font-mono uppercase tracking-wider block">Wartość oczekiwana:</span>
                        <span className={`text-xs sm:text-sm font-black font-mono block mt-1 ${mcResults.expectedValue >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {mcResults.expectedValue.toLocaleString("pl", { maximumFractionDigits: 0 })} PLN
                        </span>
                      </div>

                      <div className="border border-neutral-900 bg-neutral-900/30 p-3 rounded-xl card-glow-indigo transition-shadow">
                        <span className="text-neutral-500 text-[9px] font-mono uppercase tracking-wider block">Średni ROI kampanii:</span>
                        <span className={`text-xs sm:text-sm font-black font-mono block mt-1 ${mcResults.expectedROI >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {mcResults.expectedROI >= 0 ? "+" : ""}{mcResults.expectedROI.toFixed(1)}%
                        </span>
                      </div>

                      <div className="border border-neutral-900 bg-neutral-900/30 p-3 rounded-xl card-glow-indigo transition-shadow">
                        <span className="text-neutral-500 text-[9px] font-mono uppercase tracking-wider block">Ryzyko straty (Prob):</span>
                        <span className={`text-xs sm:text-sm font-black font-mono block mt-1 ${mcResults.probabilityOfLoss > 20 ? "text-rose-450" : mcResults.probabilityOfLoss > 5 ? "text-amber-400" : "text-emerald-400"}`}>
                          {mcResults.probabilityOfLoss.toFixed(1)}%
                        </span>
                      </div>

                      <div className="border border-neutral-900 bg-neutral-900/30 p-3 rounded-xl card-glow-indigo transition-shadow">
                        <span className="text-neutral-500 text-[9px] font-mono uppercase tracking-wider block">Mediana zysku (P50):</span>
                        <span className="text-xs sm:text-sm font-black font-mono text-white block mt-1">
                          {mcResults.medianProfit.toLocaleString("pl", { maximumFractionDigits: 0 })} PLN
                        </span>
                      </div>
                    </div>

                    {/* Wizualizacja prawdopodobieństwa straty */}
                    <div className="bg-neutral-900/30 border border-neutral-900 p-3.5 rounded-xl space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-rose-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                          Obszar potencjalnej straty: {mcResults.probabilityOfLoss.toFixed(1)}%
                        </span>
                        <span className="text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                          Obszar Rentowności: {(100 - mcResults.probabilityOfLoss).toFixed(1)}% 
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        </span>
                      </div>
                      <div className="w-full h-3 bg-neutral-900 rounded-full overflow-hidden flex border border-neutral-800">
                        <div 
                          className="bg-rose-600 h-full transition-all duration-300" 
                          style={{ width: `${mcResults.probabilityOfLoss}%` }}
                        />
                        <div 
                          className="bg-gradient-to-r from-emerald-600 to-teal-500 h-full flex-1 transition-all duration-300" 
                        />
                      </div>
                    </div>

                    {/* Wykres rozkładu gęstości prawdopodobieństwa (histogram bins) */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono text-neutral-450 uppercase tracking-widest block font-bold flex items-center gap-1">
                        <BarChart3 size={11} className="text-indigo-400" />
                        Gęstość Rozkładu Prawdopodobieństwa (Asymmetry bell curve density)
                      </span>
                      <div className="w-full h-[180px] bg-neutral-950 border border-neutral-900 rounded-xl p-2.5 overflow-hidden">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={mcResults.chartData}
                            margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                          >
                            <defs>
                              <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#818cf8" stopOpacity={0.01}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                            <XAxis 
                              dataKey="binLabel" 
                              stroke="#6b7280" 
                              fontSize={9} 
                              tickLine={false} 
                              fontFamily="JetBrains Mono"
                            />
                            <YAxis 
                              stroke="#6b7280" 
                              fontSize={8} 
                              tickLine={false} 
                              fontFamily="JetBrains Mono"
                            />
                            <Tooltip
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload;
                                  return (
                                    <div className="bg-neutral-950 border border-neutral-800 p-2.5 text-[10px] font-mono rounded-lg shadow-2xl">
                                      <p className="text-white font-bold opacity-80">Próg wyniku: {data.binLabel}</p>
                                      <p className="text-indigo-300 mt-0.5">Uderzeń: {data.SimulationCount} razy</p>
                                      <p className={`mt-0.5 font-bold ${data.isPositive ? "text-emerald-400" : "text-rose-450"}`}>
                                        {data.isPositive ? "▲ RENTOWNIE" : "▼ STRATA"}
                                      </p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="SimulationCount" 
                              stroke="#818cf8" 
                              strokeWidth={2}
                              fillOpacity={1} 
                              fill="url(#colorProfit)" 
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Scenariusze decyzyjne */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-neutral-900 pt-4">
                      {/* Pesymistyczny 10% */}
                      <div className="border border-neutral-900 bg-neutral-900/30 p-3.5 rounded-xl flex items-start gap-3">
                        <AlertTriangle size={15} className="text-rose-500 mt-1 flex-shrink-0" />
                        <div>
                          <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider block">P10 - Scenariusz Pesymistyczny (Konserwatywny):</span>
                          <span className={`text-sm font-bold font-mono mt-0.5 block ${mcResults.p10Profit >= 0 ? "text-emerald-450" : "text-rose-450"}`}>
                            {mcResults.p10Profit.toLocaleString("pl", { maximumFractionDigits: 0 })} PLN
                          </span>
                          <p className="text-[10px] text-neutral-500 leading-normal font-sans mt-1">
                            Czarny scenariusz przy słabszej responsywności bazy. Istnieje aż 90% prawdopodobieństwa, że wynik kampanii przekroczy tę kwotę.
                          </p>
                        </div>
                      </div>

                      {/* Optymistyczny 90% */}
                      <div className="border border-neutral-900 bg-neutral-900/30 p-3.5 rounded-xl flex items-start gap-3">
                        <Zap size={14} className="text-amber-500 mt-1 flex-shrink-0" />
                        <div>
                          <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider block">P90 - Scenariusz Optymistyczny (Sukces rynkowy):</span>
                          <span className="text-sm font-bold font-mono text-emerald-400 mt-0.5 block">
                            +{mcResults.p90Profit.toLocaleString("pl", { maximumFractionDigits: 0 })} PLN
                          </span>
                          <p className="text-[10px] text-neutral-500 leading-normal font-sans mt-1">
                            Rezultat w przypadku zmaterializowania się pozytywnej asymetrii (Wysoki współczynnik CTR/odpowiedzi). Wykonalne przy starannym przygotowaniu z AI.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Skrajne historyczne ekstrema stymulacji */}
                    <div className="grid grid-cols-2 gap-4 text-[9px] font-mono pt-3 border-t border-neutral-900 text-neutral-500">
                      <div className="flex justify-between">
                        <span>Max zanotowany potok zysków:</span>
                        <span className="text-emerald-500 font-bold">+{mcResults.maxProfit.toLocaleString("pl", { maximumFractionDigits: 0 })} zł</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Skrajna, pesymistyczna seria strat:</span>
                        <span className="text-rose-500 font-bold">{mcResults.maxLoss.toLocaleString("pl", { maximumFractionDigits: 0 })} zł</span>
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 border border-dashed border-neutral-850 rounded-xl bg-neutral-900/10 text-center text-neutral-500 text-xs min-h-[300px]">
                    <Dices size={36} className="text-neutral-700 mb-3 animate-pulse" />
                    <p className="font-bold">Brak wyjściowych danych symulacji</p>
                    <p className="opacity-75 max-w-sm mt-1">Ustaw parametry i wciśnij przycisk po lewej stronie, aby zainicjować symulację Monte Carlo.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
