import React from "react";
import { Sliders, Zap, Globe, Wand2, Search, ImageIcon, Video as VideoIcon, Trash2, Film, Loader2, Play, HelpCircle, CheckCircle } from "lucide-react";
import { AdvancedPromptEditor } from "../AdvancedPromptEditor";

type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
type ImageSize = "512px" | "1K" | "2K";

interface GeneratorFormProps {
  activeTab: "image" | "video";
  prompt: string;
  setPrompt: (p: string) => void;
  aspect: string;
  setAspect: (a: any) => void;
  size?: ImageSize;
  setSize?: (s: ImageSize) => void;
  editorMode: "simple" | "templates";
  setEditorMode: (m: "simple" | "templates") => void;
  sourceImage: string | null;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearImage: () => void;
  enableSearchGrounding: boolean;
  setEnableSearchGrounding: (e: boolean) => void;
  isOptimizing: boolean;
  onOptimize: () => void;
  isGenerating: boolean;
  onGenerate: () => void;
  fileRef: React.RefObject<HTMLInputElement | null>;
  groundingCitations: { uri: string; title: string }[];
}

export const GeneratorForm: React.FC<GeneratorFormProps> = React.memo(({
  activeTab,
  prompt,
  setPrompt,
  aspect,
  setAspect,
  size,
  setSize,
  editorMode,
  setEditorMode,
  sourceImage,
  onImageUpload,
  onClearImage,
  enableSearchGrounding,
  setEnableSearchGrounding,
  isOptimizing,
  onOptimize,
  isGenerating,
  onGenerate,
  fileRef,
  groundingCitations
}) => {
  const isImage = activeTab === "image";

  return (
    <div className="space-y-6">
      <div className="border border-neutral-800 bg-neutral-950/80 backend-panel rounded-2xl p-6 relative overflow-hidden backdrop-blur-md">
        <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none ${isImage ? "bg-rose-500/5" : "bg-amber-500/5"}`} />

        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 font-mono flex items-center gap-1.5 border-b border-neutral-900 pb-3">
          {isImage ? (
            <>
              <Sliders size={16} className="text-rose-500" /> Parametryzacja silnika graficznego
            </>
          ) : (
            <>
              <Film size={16} className="text-amber-500" /> Kinowy sterownik kamery Veo AI
            </>
          )}
        </h3>

        <div className="space-y-4">
          {/* Reference Image (Image-to-Image / Start Frame) */}
          {!isImage && (
            <div className="space-y-2">
              <label className="text-[11px] font-mono font-bold text-neutral-450 uppercase tracking-widest flex items-center justify-between">
                <span className="text-white">Klatka startowa (Wymagane)</span>
                {sourceImage && (
                  <button
                    onClick={onClearImage}
                    className="text-neutral-500 hover:text-rose-400 text-[10px] uppercase font-mono tracking-wider flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 size={10} /> Zmień
                  </button>
                )}
              </label>

              {sourceImage ? (
                <div className="relative border border-neutral-800 bg-neutral-900 rounded-xl overflow-hidden p-2 flex items-center justify-between">
                  <img
                    src={sourceImage}
                    alt="Podgląd referencyjny"
                    referrerPolicy="no-referrer"
                    className="h-16 w-16 object-cover rounded-lg border border-neutral-700 flex-shrink-0"
                  />
                  <div className="flex-1 px-3 text-left">
                    <p className="text-xs text-white truncate font-medium">Bieżący Obraz</p>
                    <span className="text-[9px] text-green-400 font-mono tracking-wider">
                      Załadowano do Veo Engine Model
                    </span>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border border-dashed border-neutral-800 hover:border-neutral-700 bg-neutral-900/50 p-8 rounded-xl text-center cursor-pointer hover:bg-neutral-900 transition-colors group"
                  id="video-image-dropzone"
                >
                  <VideoIcon size={24} className="mx-auto text-neutral-500 group-hover:text-amber-500 transition-colors mb-2" />
                  <p className="text-xs text-white font-medium font-sans">
                    Wgraj początkową klatkę wideo
                  </p>
                  <span className="text-[9px] text-neutral-500 font-mono block mt-1.5 max-w-xs mx-auto">
                    Wybierz obraz koncepcyjny z folderu, który silnik Veo ożywi w postaci dynamicznej sceny.
                  </span>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={onImageUpload}
                className="hidden"
              />
            </div>
          )}

          {/* Wybór Trybu Edytora */}
          <div className="flex border-b border-neutral-900 pb-2 mb-2 items-center justify-between">
            <span className="text-[10px] font-mono text-neutral-500 font-bold uppercase tracking-widest">
              Tryb edytora promptów
            </span>
            <div className="flex bg-neutral-950 rounded-lg p-0.5 border border-neutral-850">
              <button
                type="button"
                onClick={() => setEditorMode("simple")}
                className={`px-3 py-1 text-[10px] font-mono font-bold uppercase rounded-md transition-colors cursor-pointer ${
                  editorMode === "simple"
                    ? "bg-rose-500/10 text-rose-400"
                    : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                Szybki Szkic
              </button>
              <button
                type="button"
                onClick={() => setEditorMode("templates")}
                className={`px-3 py-1 text-[10px] font-mono font-bold uppercase rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                  editorMode === "templates"
                    ? "bg-rose-500/10 text-rose-400"
                    : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                <Zap size={10} className="text-amber-500 animate-pulse" /> Studio Szablonów PRO
              </button>
            </div>
          </div>

          {editorMode === "simple" ? (
            <>
              {/* Opis kreatywny */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono font-bold text-neutral-400 uppercase tracking-widest flex justify-between">
                  <span>{isImage ? "Kreatywny Prompt Wizualny" : "Wektor Ruchu / Opis Animacji"}</span>
                  <span className="text-neutral-600">{isImage ? "Model: Gemini 3.1-flash-image" : "Model: Veo 3.1-fast"}</span>
                </label>
                <textarea
                  placeholder={
                    isImage
                      ? "Niebieski lśniący robot z mosiężnymi zębatkami siedzący w kokpicie futurystycznego statku, styl cyber-noir z różowym podświetleniem neonowym, hiperdetale, unreal engine 5..."
                      : "Kinowe oddalenie kamery (zoom out), wokół robota unoszą się jasne pyłki kurzu w promieniach słońca, realistyczna tekstura fizyczna, dym snujący się z silników statku..."
                  }
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  className={`w-full text-sm rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-3 placeholder-neutral-600 focus:outline-none focus:ring-1 text-white leading-relaxed resize-none transition-all ${isImage ? "focus:ring-rose-500/50" : "focus:ring-amber-500/50"}`}
                />
              </div>

              {/* SUPERCHARGER PROMPTU (AUTOMATYCZNY OPTYMALIZATOR Z GOOGLE SEARCH) */}
              <div className="bg-neutral-900/60 rounded-xl p-3 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                    <Zap size={12} className="text-amber-550" /> Supercharger Promptu Ω
                  </span>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={enableSearchGrounding}
                      onChange={(e) => setEnableSearchGrounding(e.target.checked)}
                      className="rounded bg-neutral-950 border-neutral-850 text-amber-500 focus:ring-0 focus:ring-offset-0 h-3.5 w-3.5 cursor-pointer accent-amber-500"
                    />
                    <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase flex items-center gap-1">
                      <Globe size={10} className="text-blue-400" /> Google Search
                    </span>
                  </label>
                </div>

                <p className="text-[10px] text-neutral-500 leading-normal">
                  Podaj hasło robocze w polu wyżej i kliknij przycisk, aby stworzyć hiperdetaliczny, profesjonalny prompt.
                </p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[9px] font-mono text-neutral-500 uppercase flex items-center">Szybka baza:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setPrompt(isImage ? "Luxury cyberpunk sports car on a wet neon Neo-Tokyo street, dramatic reflections" : "Epic 3D sweep around the futuristic robot object, majestic sun beams filtering deep, volumetric smoke");
                    }}
                    className="text-[10px] px-2 py-1 bg-neutral-950 border border-neutral-850 text-neutral-300 rounded hover:text-white hover:border-neutral-750 transition-colors uppercase font-mono cursor-pointer"
                  >
                    {isImage ? "Cyberpunk" : "Epic Sweep"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPrompt(isImage ? "Intricate celestial watchmaker with floating astronomical gears inside a space nebula" : "Slow-motion pullback reveal of the dark nebula planet, cinematic particle vortex swirling");
                    }}
                    className="text-[10px] px-2 py-1 bg-neutral-950 border border-neutral-850 text-neutral-300 rounded hover:text-white hover:border-neutral-750 transition-colors uppercase font-mono cursor-pointer"
                  >
                    {isImage ? "Astronomia" : "Cinematic Zoom"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPrompt(isImage ? "High studio lit minimalist diamond necklace lying on dramatic black sand" : "Soft aesthetic camera pan, gentle warm realistic lights flickering inside and shimmering reflections");
                    }}
                    className="text-[10px] px-2 py-1 bg-neutral-950 border border-neutral-850 text-neutral-300 rounded hover:text-white hover:border-neutral-750 transition-colors uppercase font-mono cursor-pointer"
                  >
                    {isImage ? "Luxury Perfume" : "Aesthetic Flow"}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={onOptimize}
                  disabled={isOptimizing}
                  className="w-full bg-neutral-950 hover:bg-neutral-900 text-amber-400 hover:text-amber-300 border border-amber-500/20 hover:border-amber-500/40 text-[10px] font-mono font-bold uppercase rounded-lg py-2 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-45 transition-all active:scale-98"
                >
                  {isOptimizing ? (
                    <>
                      <Loader2 className="animate-spin text-amber-500" size={12} />
                      Trwa Optymalizacja & Grounding...
                    </>
                  ) : (
                    <>
                      <Wand2 size={12} />
                      Ulepsz Prompt z AI & Grounding
                    </>
                  )}
                </button>

                {groundingCitations.length > 0 && (
                  <div className="space-y-1.5 pt-1.5 border-t border-neutral-850">
                    <span className="text-[9px] font-mono text-neutral-500 uppercase flex items-center gap-1">
                      <Search size={10} className="text-blue-400" /> Najnowsze trendy z Google:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {groundingCitations.map((cit, idx) => (
                        <a
                          key={idx}
                          href={cit.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[9.5px] font-mono bg-neutral-950/80 px-2 py-0.5 rounded border border-neutral-850 hover:border-blue-500/30 text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                        >
                          <Globe size={8} /> {cit.title.slice(0, 24)}...
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <AdvancedPromptEditor
              generationType={activeTab}
              currentPrompt={prompt}
              onApplyPrompt={setPrompt}
            />
          )}

          {/* Proporcje i Rozmiary */}
          {isImage ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono font-bold text-neutral-400 uppercase tracking-widest">
                    Proporcje Obrazu
                  </label>
                  <select
                    value={aspect}
                    onChange={(e) => setAspect(e.target.value as AspectRatio)}
                    className="w-full rounded-xl bg-neutral-900 border border-neutral-800 p-3 text-sm text-neutral-300 focus:outline-none focus:ring-1 focus:ring-rose-500/50"
                  >
                    <option value="1:1">Kwadrat (1:1)</option>
                    <option value="16:9">Widescreen (16:9)</option>
                    <option value="9:16">Pionowy (9:16)</option>
                    <option value="4:3">Telewizyjny (4:3)</option>
                    <option value="3:4">Portret (3:4)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono font-bold text-neutral-400 uppercase tracking-widest">
                    Rozdzielczość Wejściowa
                  </label>
                  <select
                    value={size}
                    onChange={(e) => setSize && setSize(e.target.value as ImageSize)}
                    className="w-full rounded-xl bg-neutral-900 border border-neutral-800 p-3 text-sm text-neutral-300 focus:outline-none focus:ring-1 focus:ring-rose-500/50"
                  >
                    <option value="1K">Standard HD (1K)</option>
                    <option value="512px">Szybki podgląd (512px)</option>
                    <option value="2K">Szczegółowy Ultra (2K)</option>
                  </select>
                </div>
              </div>

              {/* Reference upload for Image (Image-to-Image / Inpainting) */}
              <div className="space-y-2 border-t border-neutral-900 pt-4">
                <label className="text-[11px] font-mono font-bold text-neutral-400 uppercase tracking-widest flex items-center justify-between">
                  <span>Obraz Referencyjny / Edycja (Opcjonalnie)</span>
                  {sourceImage && (
                    <button
                      onClick={onClearImage}
                      className="text-neutral-500 hover:text-rose-400 text-[10px] uppercase font-mono tracking-wider flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 size={10} /> Usuń
                    </button>
                  )}
                </label>

                {sourceImage ? (
                  <div className="relative border border-neutral-800 bg-neutral-900 rounded-xl overflow-hidden p-2 flex items-center justify-between">
                    <img
                      src={sourceImage}
                      alt="Podgląd edycji"
                      referrerPolicy="no-referrer"
                      className="h-14 w-14 object-cover rounded-lg border border-neutral-700 flex-shrink-0"
                    />
                    <div className="flex-1 px-3 text-left">
                      <p className="text-xs text-white truncate font-medium">Bieżący Obraz</p>
                      <p className="text-[10px] text-neutral-500 font-mono">Przekazany do klastra wektorowego</p>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="border border-dashed border-neutral-800 hover:border-neutral-700 bg-neutral-900/50 p-6 rounded-xl text-center cursor-pointer hover:bg-neutral-900 transition-colors group"
                  >
                    <ImageIcon size={22} className="mx-auto text-neutral-500 group-hover:text-rose-400 transition-colors mb-2" />
                    <p className="text-xs text-neutral-400 font-medium font-sans">
                      Kliknij, aby wgrać klatkę wejściową do edycji
                    </p>
                    <span className="text-[9px] text-neutral-600 font-mono block mt-1">
                      Przekształć istniejący obraz z nowymi instrukcjami promtu
                    </span>
                  </div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={onImageUpload}
                  className="hidden"
                />
              </div>
            </>
          ) : (
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono font-bold text-neutral-450 uppercase tracking-widest">
                Format Wyjściowy Kinowy
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAspect("16:9")}
                  className={`py-3.5 px-4 rounded-xl border text-xs font-mono font-bold transition-all duration-250 flex items-center justify-center gap-1.5 cursor-pointer ${
                    aspect === "16:9"
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                      : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
                  }`}
                >
                  <Film size={14} /> Panorama (16:9)
                </button>
                <button
                  type="button"
                  onClick={() => setAspect("9:16")}
                  className={`py-3.5 px-4 rounded-xl border text-xs font-mono font-bold transition-all duration-250 flex items-center justify-center gap-1.5 cursor-pointer ${
                    aspect === "9:16"
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                      : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
                  }`}
                >
                  <Film size={14} className="rotate-90" /> Pionowy (9:16)
                </button>
              </div>
            </div>
          )}

          {/* ACTION BUTTON */}
          <button
            onClick={onGenerate}
            disabled={isGenerating || (isImage ? !prompt.trim() : (!prompt.trim() && !sourceImage))}
            className={`w-full mt-6 rounded-xl py-3.5 px-4 font-black text-xs font-mono tracking-[0.1em] uppercase shadow-lg disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 border-none ${
              isImage
                ? "bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-[0_4px_20px_rgba(225,29,72,0.25)] hover:shadow-[0_4px_20px_rgba(225,29,72,0.4)] hover:from-rose-500 hover:to-rose-600"
                : "bg-gradient-to-r from-amber-600 to-amber-700 text-neutral-950 shadow-[0_4px_20px_rgba(245,158,11,0.25)] hover:shadow-[0_4px_20px_rgba(245,158,11,0.4)] hover:from-amber-400 hover:to-amber-500"
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                Przetwarzanie w sferze {isImage ? "Gemini..." : "Veo..."}
              </>
            ) : (
              <>
                {isImage ? <Wand2 size={16} /> : <Play size={14} />}
                {isImage
                  ? sourceImage
                    ? "Przeprowadź Edycję Obrazu"
                    : "Generuj Nową Grafikę PRO"
                  : "Generuj Wideo Veo 3 PRO"}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Model Specs / Description Block */}
      <div className="border border-neutral-800/60 bg-neutral-900/10 rounded-2xl p-4 text-xs text-neutral-500 font-mono leading-relaxed flex gap-3">
        {isImage ? (
          <>
            <CheckCircle size={18} className="text-amber-500/70 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-white font-bold mb-0.5">Model Gemini Imagen 3.1 Preview</h4>
              Zapewnia ulepszoną wierność odwzorowania słów kluczowych i skomplikowanych zapytań przestrzennych. Doskonały do renderowania dynamicznych kompozycji technicznych oraz premium grafik kampanii.
            </div>
          </>
        ) : (
          <>
            <HelpCircle size={18} className="text-amber-400/80 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-white font-bold mb-0.5">Model Veo 3.1 Neural Generations</h4>
              Technologia klasy mistrzowskiej do dynamicznej syntezy wideo. Generowanie pełnej klatki o długości ~5 sekund trwa średnio 60-120 sekund.
            </div>
          </>
        )}
      </div>
    </div>
  );
});

GeneratorForm.displayName = "GeneratorForm";
