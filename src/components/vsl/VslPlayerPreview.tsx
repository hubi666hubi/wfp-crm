import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Video,
  Pause,
  Play,
  Square,
  Download,
  VolumeX,
  Volume2,
  Share2,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { useVslStore } from "../../store/vslStore";

interface VslPlayerPreviewProps {
  exportAudio: () => void;
  isExportingAudio: boolean;
  togglePlayback: () => void;
  voices: SpeechSynthesisVoice[];
  selectedVoiceURI: string;
  setSelectedVoiceURI: (uri: string) => void;
  speechRate: number;
  setSpeechRate: (rate: number) => void;
  speechPitch: number;
  setSpeechPitch: (pitch: number) => void;
}

export const VslPlayerPreview = React.memo(function VslPlayerPreview({
  exportAudio,
  isExportingAudio,
  togglePlayback,
  voices,
  selectedVoiceURI,
  setSelectedVoiceURI,
  speechRate,
  setSpeechRate,
  speechPitch,
  setSpeechPitch,
}: VslPlayerPreviewProps) {
  const {
    scriptParts,
    currentPartIndex,
    setCurrentPartIndex,
    isPlaying,
    setIsPlaying,
    volume,
    setVolume,
    topic,
  } = useVslStore();

  const [previewShareOpen, setPreviewShareOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const activePart = scriptParts[currentPartIndex];

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="bg-black border border-neutral-800 rounded-xl overflow-hidden mb-8">
        {/* Video Player Display */}
        <div className="aspect-[16/9] bg-neutral-950 relative flex items-center justify-center">
          {activePart?.imageUrl ? (
            <img
              src={activePart.imageUrl}
              alt="Current Visual"
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="text-center p-6 mt-4">
              <Video className="mx-auto text-neutral-700 mb-4" size={48} />
              <p className="text-neutral-500 text-sm max-w-sm mx-auto">
                Wizualizacja niedostępna dla tej sekwencji. Wygeneruj obraz w ustawieniach sceny poniżej, aby aktywować
                warstwę wizualną.
              </p>
              <p className="text-neutral-600 font-mono text-xs mt-4">
                [ {activePart?.visual} ]
              </p>
            </div>
          )}

          {/* Subtitles Overlay */}
          <div className="absolute bottom-6 left-0 right-0 px-8 text-center">
            <div className="inline-block bg-black/70 backdrop-blur-sm border border-white/10 px-6 py-3 rounded-lg max-w-3xl">
              <p className="text-emerald-400 font-medium text-lg lg:text-xl drop-shadow-md">
                "{activePart?.text}"
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
              onClick={() => setVolume(volume > 0 ? 0 : 1)}
              className="text-neutral-400 hover:text-white transition-colors"
              title={volume === 0 ? "Włącz dźwięk" : "Wycisz dźwięk"}
            >
              {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
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
                            "_blank"
                          );
                          toast.success("Otwarto udostępnianie na Facebooku");
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
                          const text = encodeURIComponent(`Sprawdź ten wygenerowany skrypt VSL na temat: ${topic}`);
                          window.open(
                            `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${text}`,
                            "_blank"
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
                            "_blank"
                          );
                          toast.success("Otwarto udostępnianie na LinkedIn");
                          setPreviewShareOpen(false);
                        }}
                        className="aspect-square flex items-center justify-center bg-[#0A66C2]/10 text-[#0A66C2] hover:bg-[#0A66C2]/20 rounded-lg transition-colors font-bold text-sm"
                        title="LinkedIn"
                      >
                        in
                      </button>
                      <button
                        onClick={() => {
                          toast.success("YouTube wymaga API do bezpośredniego uploadu. Pobierz wideo najpierw.");
                          setPreviewShareOpen(false);
                        }}
                        className="aspect-square flex items-center justify-center bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 rounded-lg transition-colors font-bold"
                        title="YouTube"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z" />
                          <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="white" />
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
        <div className="bg-neutral-955 p-4 border-t border-neutral-800 flex flex-wrap gap-6 items-center justify-between text-xs text-neutral-400">
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
                {voices.length === 0 && <option value="">Głos wyjściowy systemu</option>}
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
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:bg-neutral-800 disabled:text-neutral-500 border border-rose-500/20 disabled:border-transparent rounded-lg text-white font-semibold transition-colors shadow-sm"
              title="Zsyntetyzuj konfigurację głosu jako jeden gotowy plik MP3"
            >
              {isExportingAudio ? (
                <span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Download size={12} />
              )}
              <span>Generuj plik MP3 lektora</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
});
