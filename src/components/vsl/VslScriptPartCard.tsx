import React from "react";
import { motion } from "motion/react";
import {
  Video,
  Pause,
  Volume2,
  Download,
  Activity,
  List,
  LayoutGrid,
  ImageIcon,
  Box,
  Share2,
  Sparkles,
  AlertCircle,
  Wand2,
  Copy,
  RefreshCw,
  Plus,
  Globe,
  X,
  Type,
} from "lucide-react";
import { toast } from "sonner";
import { useVslStore } from "../../store/vslStore";
import type { ScriptPart } from "../../store/vslStore";

interface VslScriptPartCardProps {
  part: ScriptPart;
  index: number;
  viewMode: "list" | "storyboard";
  speakingIdx: number | null;
  exportingPartIdx: number | null;
  isGeneratingAllImages: boolean;
  isGeneratingAll3D: boolean;
  handleToggleSpeakPart: (index: number) => void;
  exportSingleAudio: (index: number) => void;
  handleGenerateImage: (index: number) => void;
  handleGenerate3D: (index: number) => void;
  handleGenerateVisualPrompt: (index: number, usePain?: boolean) => void;
  handleSuggestKeywords: (index: number) => void;
  setPartViewModes: React.Dispatch<React.SetStateAction<Record<number, "list" | "storyboard">>>;
  previewMode: "2d" | "3d";
  setPreviewMode: (mode: "2d" | "3d") => void;
}

export const VslScriptPartCard = React.memo(function VslScriptPartCard({
  part,
  index,
  viewMode,
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
  previewMode,
  setPreviewMode,
}: VslScriptPartCardProps) {
  const {
    parameters,
    globalKeywords,
    customKeywords,
    setCustomKeywords,
    addGlobalKeyword,
    updatePartVisual,
    updatePartAudio,
    updatePartText,
    appendKeyword,
    addKeywordToSuggestions,
    clearKeywordSuggestions,
    removeKeywordFromSuggestions,
    updateKeywordSuggestionCategory,
    setScriptParts,
  } = useVslStore();

  const handleVisualFocus = () => {
    if (!part.keywordSuggestions?.length && !part.isGeneratingKeywords) {
      handleSuggestKeywords(index);
    }
  };

  const handleVisualKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
  };

  const currentPreviewMode = previewMode || (part.model3dUrl ? "3d" : "2d");

  if (viewMode === "storyboard") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col bg-neutral-900 border border-neutral-800 hover:border-neutral-700 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden group col-span-1"
      >
        {/* Header */}
        <div className="p-3 border-b border-neutral-800 flex justify-between items-center bg-black/40">
          <span className="text-rose-500 font-bold text-[10px] uppercase tracking-widest">
            {part.type}
          </span>
          <div className="flex items-center gap-2.5">
            <span className="text-neutral-500 font-mono text-xs">{part.time}</span>
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
              {speakingIdx === index ? <Pause size={12} className="fill-current" /> : <Volume2 size={12} />}
            </button>
            <button
              type="button"
              onClick={() => exportSingleAudio(index)}
              disabled={exportingPartIdx !== null}
              className="p-1.5 bg-neutral-850 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 rounded-lg transition-colors flex items-center justify-center"
              title="Pobierz ten fragment jako MP3"
            >
              {exportingPartIdx === index ? <Activity className="animate-spin" size={12} /> : <Download size={12} />}
            </button>
            <button
              onClick={() => setPartViewModes((prev) => ({ ...prev, [index]: "list" }))}
              className="p-1 hover:bg-neutral-800 text-neutral-500 hover:text-neutral-300 rounded transition-colors"
              title="Przełącz na widok listy"
            >
              <List size={14} />
            </button>
          </div>
        </div>

        {/* Media Preview Pane */}
        <div className="relative aspect-video bg-neutral-950 flex items-center justify-center overflow-hidden border-b border-neutral-800 group-hover:bg-neutral-900 transition-colors">
          {currentPreviewMode === "3d" && part.model3dUrl ? (
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
              {part.imageVariations && part.imageVariations.length > 1 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 p-1.5 bg-black/60 backdrop-blur-md rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                  {part.imageVariations.map((v, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setScriptParts((prev) => {
                          const newParts = [...prev];
                          newParts[index] = { ...newParts[index], imageUrl: v };
                          return newParts;
                        });
                      }}
                      className={`w-2 h-2 rounded-full transition-all ${
                        part.imageUrl === v ? "bg-rose-500 scale-125" : "bg-white/40 hover:bg-white/60"
                      }`}
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
                  disabled={part.isGeneratingImage || isGeneratingAllImages}
                  className="bg-neutral-800 hover:bg-neutral-700 text-white rounded p-2 transition-colors border border-neutral-700 disabled:opacity-50 flex items-center justify-center h-10 px-3 gap-2 text-xs"
                  title="Generuj obraz 2D"
                >
                  {part.isGeneratingImage ? (
                    <Activity size={16} className="animate-spin text-rose-500" />
                  ) : (
                    <Sparkles size={16} className="text-rose-500" />
                  )}
                  Generuj 2D (Imagen 3)
                </button>
                <button
                  onClick={() => handleGenerate3D(index)}
                  disabled={part.isGenerating3D || isGeneratingAll3D}
                  className="bg-neutral-800 hover:bg-neutral-700 text-white rounded p-2 transition-colors border border-neutral-700 disabled:opacity-50 flex items-center justify-center h-10 px-3 gap-2 text-xs"
                  title="Generuj model 3D (Meshy)"
                >
                  {part.isGenerating3D ? (
                    <Activity size={16} className="animate-spin text-sky-500" />
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
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  <span className="line-clamp-3" title={part.imageError}>
                    {part.imageError}
                  </span>
                </div>
              )}
              {part.model3dError && (
                <div className="mt-3 flex items-start gap-1 p-2 bg-sky-500/10 border border-sky-500/20 rounded text-sky-400 text-xs text-left w-full mx-2">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  <span className="line-clamp-3" title={part.model3dError}>
                    {part.model3dError}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Toggle and Share overlay if media exists */}
          {(part.imageUrl || part.model3dUrl) && (
            <div className="absolute top-2 right-2 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
              {part.imageUrl && part.model3dUrl && (
                <button
                  onClick={() =>
                    setPreviewMode(currentPreviewMode === "3d" ? "2d" : "3d")
                  }
                  className="bg-black/80 hover:bg-black text-white rounded p-1.5 backdrop-blur-sm transition-colors border border-neutral-700"
                  title={currentPreviewMode === "3d" ? "Przełącz na 2D" : "Przełącz na 3D"}
                >
                  {currentPreviewMode === "3d" ? <ImageIcon size={12} /> : <Box size={12} />}
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
                  {part.isGeneratingImage ? <Activity size={12} className="animate-spin" /> : <Sparkles size={12} />}
                </button>
              )}
              {!part.model3dUrl && (
                <button
                  onClick={() => handleGenerate3D(index)}
                  disabled={part.isGenerating3D || isGeneratingAll3D}
                  className="bg-black/80 hover:bg-black text-sky-400 rounded p-1.5 backdrop-blur-sm transition-colors border border-neutral-700 disabled:opacity-50"
                  title="Generuj model 3D"
                >
                  {part.isGenerating3D ? <Activity size={12} className="animate-spin" /> : <Box size={12} />}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Form Fields */}
        <div className="p-4 flex-1 flex flex-col gap-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">
                <Video size={12} /> Prompt Wizualny
              </span>
              <div className="flex items-center gap-1.5">
                <div className="relative group/wand">
                  <button
                    onClick={() => handleGenerateVisualPrompt(index, true)}
                    disabled={part.isGeneratingAdvancedPrompt}
                    className={`flex items-center gap-1.5 text-[9px] transition-colors disabled:opacity-50 font-medium px-2 py-0.5 rounded ${
                      !parameters.mainProblem
                        ? "text-neutral-500 bg-neutral-800/20 cursor-not-allowed"
                        : "text-amber-400 hover:text-amber-300 bg-amber-500/10"
                    }`}
                    title={
                      !parameters.mainProblem
                        ? "Wypełnij Zapalnik w parametrach"
                        : "Wygeneruj unikalny prompt z Zapalnika (CRM) przy użyciu AI"
                    }
                  >
                    {part.isGeneratingAdvancedPrompt ? (
                      <Activity size={10} className="animate-spin" />
                    ) : (
                      <Wand2 size={10} />
                    )}
                    Zapalnik
                  </button>
                  <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover/wand:block w-[180px] p-2 bg-neutral-900 border border-amber-500/30 shadow-xl rounded z-50 text-[10px] text-neutral-300 text-center leading-tight">
                    Generuje zaawansowany prompt na podstawie wybranego problemu klienta.
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
                  title={part.keywordSuggestions?.length ? "Odśwież propozycje AI" : "Pomysły AI"}
                >
                  {part.isGeneratingKeywords ? (
                    <Activity size={10} className="animate-spin" />
                  ) : part.keywordSuggestions?.length ? (
                    <RefreshCw size={10} />
                  ) : (
                    <Sparkles size={10} />
                  )}
                  {part.keywordSuggestions?.length ? "Odśwież" : "Pomoc AI"}
                </button>
                <button
                  onClick={() => handleGenerateImage(index)}
                  disabled={part.isGeneratingImage}
                  className="flex items-center gap-1 text-[9px] text-rose-400 hover:text-rose-300 transition-colors disabled:opacity-50 font-medium ml-1"
                  title="Wygeneruj Obraz"
                >
                  {part.isGeneratingImage ? <Activity size={10} className="animate-spin" /> : <ImageIcon size={10} />}
                  Obraz
                </button>
              </div>
            </div>

            <textarea
              value={part.visual}
              onChange={(e) => updatePartVisual(index, e.target.value)}
              onFocus={handleVisualFocus}
              onKeyDown={handleVisualKeyDown}
              className={`text-xs bg-black border ${
                !part.visual ? "border-amber-500/30 border-dashed" : "border-neutral-700"
              } rounded-md p-1.5 w-full text-gray-300 focus:outline-none focus:border-rose-500 transition-colors custom-scrollbar`}
              rows={2}
              placeholder={part.isGeneratingAdvancedPrompt ? "Generowanie..." : "Wpisz prompt wizualny..."}
            />

            {!part.visual ? (
              <button
                onClick={() => handleGenerateVisualPrompt(index, false)}
                disabled={part.isGeneratingAdvancedPrompt}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded transition-colors disabled:opacity-50"
              >
                {part.isGeneratingAdvancedPrompt ? <Activity size={12} className="animate-spin" /> : <Sparkles size={12} />}
                Generuj wizualizację
              </button>
            ) : (
              <div className="flex justify-end mt-1">
                <button
                  onClick={() => handleGenerateVisualPrompt(index, false)}
                  disabled={part.isGeneratingAdvancedPrompt}
                  className="text-[10px] text-amber-500/70 hover:text-amber-400 flex items-center gap-1 transition-colors disabled:opacity-50"
                  title="Popraw istniejący prompt używając AI i kontekstu"
                >
                  {part.isGeneratingAdvancedPrompt ? <Activity size={10} className="animate-spin" /> : <Wand2 size={10} />}
                  Popraw wizualizację za pomocą AI
                </button>
              </div>
            )}

            {part.keywordSuggestions && part.keywordSuggestions.length > 0 && (
              <div className="flex flex-col gap-2 mt-1">
                {part.keywordSuggestions.map((group, groupIdx) => (
                  <div key={groupIdx} className="flex flex-col gap-1 items-start">
                    <input
                      type="text"
                      value={group.category}
                      onChange={(e) => updateKeywordSuggestionCategory(index, group.category, e.target.value)}
                      className="text-[10px] text-neutral-400 font-medium uppercase tracking-wider bg-transparent border-none p-0 w-full focus:ring-0 focus:outline-none"
                    />
                    <div className="flex flex-wrap gap-1">
                      {group.keywords.map((kw, i) => (
                        <div
                          key={i}
                          className="flex bg-indigo-500/10 border border-indigo-500/20 rounded-md overflow-hidden transition-colors"
                        >
                          <button
                            onClick={() => appendKeyword(index, kw)}
                            className="text-[10px] px-2 py-0.5 text-indigo-300 hover:bg-indigo-500/20 text-left border-r border-indigo-500/20 flex items-center gap-1"
                            title="Dodaj do tego promptu"
                          >
                            <span>+</span> {kw}
                          </button>
                          <button
                            onClick={() => {
                              addGlobalKeyword(kw);
                              toast.success(`Dodano "${kw}" do globalnych`);
                            }}
                            className="px-1.5 py-0.5 text-indigo-400 hover:text-indigo-200 hover:bg-indigo-500/30 flex items-center justify-center transition-colors border-r border-indigo-500/20"
                            title="Dodaj do globalnych słów kluczowych"
                          >
                            <Globe size={10} />
                          </button>
                          <button
                            onClick={() => removeKeywordFromSuggestions(index, group.category, kw)}
                            className="px-1 py-0.5 text-neutral-500 hover:text-rose-400 hover:bg-rose-500/20 flex items-center justify-center transition-colors"
                            title="Usuń sugestię"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
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
                    onKeyDown={(e) => e.key === "Enter" && addKeywordToSuggestions(index)}
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
              onChange={(e) => updatePartAudio(index, e.target.value)}
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
              onChange={(e) => updatePartText(index, e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded p-2 text-xs text-emerald-300 font-medium italic focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 resize-y min-h-[60px] transition-all"
              placeholder="Tekst voiceover..."
            />
          </div>
        </div>
      </motion.div>
    );
  } else {
    // List Layout
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="col-span-full grid grid-cols-1 md:grid-cols-12 gap-4 p-5 bg-neutral-900 border border-neutral-800 rounded-xl relative overflow-hidden group"
      >
        <div className="absolute top-2 right-2 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setPartViewModes((prev) => ({ ...prev, [index]: "storyboard" }))}
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
              <span className="text-gray-300 font-mono text-xl">{part.time}</span>
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
                {speakingIdx === index ? <Pause size={12} className="fill-current" /> : <Volume2 size={12} />}
              </button>
              <button
                type="button"
                onClick={() => exportSingleAudio(index)}
                disabled={exportingPartIdx !== null}
                className="p-1.5 rounded-full bg-neutral-850 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition-all hover:scale-105 flex items-center justify-center"
                title="Pobierz ten fragment jako MP3"
              >
                {exportingPartIdx === index ? <Activity className="animate-spin" size={12} /> : <Download size={12} />}
              </button>
            </div>
          </div>
        </div>

        <div className="md:col-span-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Visual prompt column */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs text-neutral-500 uppercase tracking-wider font-semibold">
                <Video size={14} /> Wskazówka Wizualna (Prompt)
              </span>
              <div className="flex items-center gap-2">
                <div className="relative group/wand">
                  <button
                    onClick={() => handleGenerateVisualPrompt(index, true)}
                    disabled={part.isGeneratingAdvancedPrompt}
                    className={`flex items-center gap-1.5 text-xs transition-colors disabled:opacity-50 font-medium px-2 py-1 rounded ${
                      !parameters.mainProblem
                        ? "text-neutral-500 bg-neutral-800/20 cursor-not-allowed"
                        : "text-amber-400 hover:text-amber-300 bg-amber-500/10"
                    }`}
                    title={
                      !parameters.mainProblem
                        ? "Wypełnij Zapalnik w parametrach"
                        : "Wygeneruj unikalny prompt z Zapalnika (CRM) przy użyciu AI"
                    }
                  >
                    {part.isGeneratingAdvancedPrompt ? (
                      <Activity size={14} className="animate-spin" />
                    ) : (
                      <Wand2 size={14} />
                    )}
                    Zapalnik
                  </button>
                  <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover/wand:block w-[180px] p-2 bg-neutral-900 border border-amber-500/30 shadow-xl rounded z-50 text-[10px] text-neutral-300 text-center leading-tight">
                    Generuje zaawansowany prompt na podstawie wybranego problemu klienta.
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
                  className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-50 font-medium"
                  title={part.keywordSuggestions?.length ? "Odśwież propozycje AI" : "Pomoc AI"}
                >
                  {part.isGeneratingKeywords ? (
                    <Activity size={14} className="animate-spin" />
                  ) : part.keywordSuggestions?.length ? (
                    <RefreshCw size={14} />
                  ) : (
                    <Sparkles size={14} />
                  )}
                  {part.keywordSuggestions?.length ? "Odśwież" : "Pomoc AI"}
                </button>
              </div>
            </div>
            <textarea
              value={part.visual}
              onChange={(e) => updatePartVisual(index, e.target.value)}
              onFocus={handleVisualFocus}
              onKeyDown={handleVisualKeyDown}
              className={`text-sm bg-black border ${
                !part.visual ? "border-amber-500/30 border-dashed" : "border-neutral-700"
              } rounded-md p-2 w-full text-gray-300 focus:outline-none focus:border-rose-500 transition-colors custom-scrollbar`}
              rows={3}
              placeholder={part.isGeneratingAdvancedPrompt ? "Generowanie..." : "Wpisz prompt wizualny..."}
            />
            {!part.visual ? (
              <button
                onClick={() => handleGenerateVisualPrompt(index, false)}
                disabled={part.isGeneratingAdvancedPrompt}
                className="w-full flex items-center justify-center gap-1.5 py-2 text-sm text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded transition-colors disabled:opacity-50"
              >
                {part.isGeneratingAdvancedPrompt ? <Activity size={14} className="animate-spin" /> : <Sparkles size={14} />}
                Generuj wizualizację
              </button>
            ) : (
              <div className="flex justify-end mt-1">
                <button
                  onClick={() => handleGenerateVisualPrompt(index, false)}
                  disabled={part.isGeneratingAdvancedPrompt}
                  className="text-xs text-amber-500/70 hover:text-amber-400 flex items-center gap-1 transition-colors disabled:opacity-50"
                  title="Popraw istniejący prompt używając AI i kontekstu"
                >
                  {part.isGeneratingAdvancedPrompt ? <Activity size={12} className="animate-spin" /> : <Wand2 size={12} />}
                  Popraw wizualizację za pomocą AI
                </button>
              </div>
            )}

            {part.keywordSuggestions && part.keywordSuggestions.length > 0 && (
              <div className="flex flex-col gap-3 mt-2">
                {part.keywordSuggestions.map((group, groupIdx) => (
                  <div key={groupIdx} className="flex flex-col gap-1.5 items-start">
                    <input
                      type="text"
                      value={group.category}
                      onChange={(e) => updateKeywordSuggestionCategory(index, group.category, e.target.value)}
                      className="text-xs text-neutral-400 font-medium uppercase tracking-wider bg-transparent border-none p-0 w-full focus:ring-0 focus:outline-none"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {group.keywords.map((kw, i) => (
                        <div
                          key={i}
                          className="flex bg-indigo-500/10 border border-indigo-500/20 rounded-md overflow-hidden transition-colors"
                        >
                          <button
                            onClick={() => appendKeyword(index, kw)}
                            className="text-xs px-2.5 py-1 text-indigo-300 hover:bg-indigo-500/20 flex items-center gap-1 text-left border-r border-indigo-500/20"
                            title="Dodaj do tego promptu"
                          >
                            <span>+</span> {kw}
                          </button>
                          <button
                            onClick={() => {
                              addGlobalKeyword(kw);
                              toast.success(`Dodano "${kw}" do globalnych`);
                            }}
                            className="px-2 py-1 text-indigo-400 hover:text-indigo-200 hover:bg-indigo-500/30 flex items-center justify-center transition-colors border-r border-indigo-500/20"
                            title="Dodaj do globalnych słów kluczowych"
                          >
                            <Globe size={14} />
                          </button>
                          <button
                            onClick={() => removeKeywordFromSuggestions(index, group.category, kw)}
                            className="px-1.5 py-1 text-neutral-500 hover:text-rose-400 hover:bg-rose-500/20 flex items-center justify-center transition-colors"
                            title="Usuń sugestię"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
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
                    onKeyDown={(e) => e.key === "Enter" && addKeywordToSuggestions(index)}
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

            {/* Media asset inside the list column if generated */}
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
                      navigator.clipboard.writeText(part.model3dUrl!);
                      toast.success("Skopiowano link do zasobu 3D");
                    }}
                    className="text-xs px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded flex items-center gap-2 transition-colors border border-indigo-500/20"
                  >
                    <Share2 size={14} /> Kopiuj link ({part.model3dUrl?.split(".").pop() || "model"})
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
                {part.imageVariations && part.imageVariations.length > 1 && (
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 flex gap-1.5 p-1.5 bg-black/60 backdrop-blur-md rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                    {part.imageVariations.map((v, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setScriptParts((prev) => {
                            const newParts = [...prev];
                            newParts[index] = { ...newParts[index], imageUrl: v };
                            return newParts;
                          });
                        }}
                        className={`w-2 h-2 rounded-full transition-all ${
                          part.imageUrl === v ? "bg-rose-500 scale-125" : "bg-white/40 hover:bg-white/60"
                        }`}
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
                  disabled={part.isGeneratingImage || isGeneratingAllImages}
                  className="text-xs px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded flex items-center gap-2 transition-colors border border-neutral-700 disabled:opacity-50"
                >
                  {part.isGeneratingImage ? (
                    <Activity size={14} className="animate-spin text-rose-500" />
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
                  disabled={part.isGenerating3D || isGeneratingAll3D}
                  className="text-xs px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded flex items-center gap-2 transition-colors border border-neutral-700 disabled:opacity-50"
                >
                  {part.isGenerating3D ? (
                    <Activity size={14} className="animate-spin text-sky-500" />
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
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span className="line-clamp-2" title={part.imageError}>
                  {part.imageError}
                </span>
              </div>
            )}
            {part.model3dError && (
              <div className="mt-2 flex items-start gap-1.5 p-2 bg-sky-500/10 border border-sky-500/20 rounded text-sky-400 text-xs">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span className="line-clamp-2" title={part.model3dError}>
                  {part.model3dError}
                </span>
              </div>
            )}
          </div>

          {/* Audio text area column */}
          <div className="space-y-1">
            <span className="flex items-center gap-2 text-xs text-neutral-500 uppercase tracking-wider font-semibold">
              <Activity size={14} /> Warstwa Audio
            </span>
            <textarea
              value={part.audio}
              onChange={(e) => updatePartAudio(index, e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded p-3 text-sm text-blue-300 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 resize-y min-h-[60px] transition-all"
              placeholder="Brak warstwy audio..."
            />
          </div>

          {/* Voiceover text area column */}
          <div className="space-y-1">
            <span className="flex items-center gap-2 text-xs text-neutral-500 uppercase tracking-wider font-semibold">
              <Type size={14} /> Voiceover (Skrypt)
            </span>
            <textarea
              value={part.text}
              onChange={(e) => updatePartText(index, e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded p-3 text-sm text-emerald-300 font-medium italic focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 resize-y min-h-[80px] transition-all"
              placeholder="Tekst voiceover..."
            />
          </div>
        </div>
      </motion.div>
    );
  }
});
