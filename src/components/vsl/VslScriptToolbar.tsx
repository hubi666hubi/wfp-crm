import React from "react";
import {
  List,
  LayoutGrid,
  Share2,
  Send,
  CloudUpload,
  Activity,
  Volume2,
  Download,
  Sparkles,
  Box,
  MonitorPlay,
} from "lucide-react";
import { useVslStore } from "../../store/vslStore";

interface VslScriptToolbarProps {
  setPartViewModes: React.Dispatch<
    React.SetStateAction<Record<number, "list" | "storyboard">>
  >;
  setContentEngineModal: (open: boolean) => void;
  setIsOutreachModalOpen: (open: boolean) => void;
  backupToGoogleDrive: (parts: any[]) => void;
  isBackingUp: boolean;
  googleUser: any;
  backupStatus: string;
  exportAudio: () => void;
  isExportingAudio: boolean;
  exportScript: (format: "txt" | "md" | "json") => void;
  handleGenerateAllImages: () => void;
  isGeneratingAllImages: boolean;
  handleGenerateAll3D: () => void;
  isGeneratingAll3D: boolean;
}

export const VslScriptToolbar = React.memo(function VslScriptToolbar({
  setPartViewModes,
  setContentEngineModal,
  setIsOutreachModalOpen,
  backupToGoogleDrive,
  isBackingUp,
  googleUser,
  backupStatus,
  exportAudio,
  isExportingAudio,
  exportScript,
  handleGenerateAllImages,
  isGeneratingAllImages,
  handleGenerateAll3D,
  isGeneratingAll3D,
}: VslScriptToolbarProps) {
  const {
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
    isPreviewVisible,
    setIsPreviewVisible,
    scriptParts,
  } = useVslStore();

  const handleSelectExportFormat = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // Selection doesn't need local state as we query the DOM in exportScript,
    // but to be clean and safe, let's keep querying the element or pass value.
  };

  return (
    <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
      <h2 className="text-xl text-white font-medium">
        Wygenerowany Scenariusz Pętel Dopaminowych
      </h2>
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
          <button
            onClick={() => {
              setViewMode("list");
              setPartViewModes({});
            }}
            className={`p-2 text-sm transition-colors flex items-center justify-center ${
              viewMode === "list" ? "bg-neutral-800 text-white" : "text-neutral-500 hover:text-neutral-300"
            }`}
            title="Widok Listy"
          >
            <List size={16} />
          </button>
          <button
            onClick={() => {
              setViewMode("storyboard");
              setPartViewModes({});
            }}
            className={`p-2 text-sm transition-colors flex items-center justify-center ${
              viewMode === "storyboard" ? "bg-neutral-800 text-white" : "text-neutral-500 hover:text-neutral-300"
            }`}
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
          title={
            googleUser
              ? backupStatus || "Utwórz kopię zapasową JSON na swoim Google Drive"
              : "Zaloguj się przez Google Drive (górny pasek), aby wysłać ten skrypt na Drive"
          }
        >
          {isBackingUp ? <Activity className="animate-spin" size={14} /> : <CloudUpload size={14} />}
          <span>Kopia na Drive</span>
        </button>

        <button
          type="button"
          onClick={exportAudio}
          disabled={isExportingAudio}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white border border-rose-600 disabled:border-transparent rounded-lg transition-colors shadow-[0_0_10px_rgba(244,63,94,0.2)]"
          title="Syntetyzuj całą ścieżkę lektorską i pobierz ją jako plik audio MP3"
        >
          {isExportingAudio ? <Activity className="animate-spin" size={14} /> : <Volume2 size={14} />}
          <span>Pobierz MP3 lektora</span>
        </button>

        <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden px-1">
          <select
            id="export-format"
            className="bg-neutral-900 text-xs text-neutral-400 py-1.5 focus:outline-none focus:text-gray-200"
            defaultValue="txt"
          >
            <option value="txt">TXT</option>
            <option value="md">Markdown</option>
            <option value="json">JSON</option>
          </select>
          <div className="w-[1px] h-4 bg-neutral-800"></div>
          <button
            onClick={() => {
              const selectEl = document.getElementById("export-format") as HTMLSelectElement;
              const val = selectEl ? (selectEl.value as "txt" | "md" | "json") : "txt";
              exportScript(val);
            }}
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
            onChange={(e) => setImageAspectRatio(e.target.value as "16:9" | "1:1" | "9:16")}
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
            onChange={(e) => setImageVariationsCount(parseInt(e.target.value))}
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
          disabled={isGeneratingAllImages || scriptParts.every((p) => p.imageUrl)}
          className={`flex items-center gap-2 text-sm transition-colors ${
            scriptParts.every((p) => p.imageUrl) ? "text-neutral-500" : "text-rose-400 hover:text-rose-300"
          } disabled:opacity-50`}
          title="Generuj obrazy dla wszystkich scenariuszy"
        >
          {isGeneratingAllImages ? <Activity size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {isGeneratingAllImages ? "Generowanie..." : "Generuj Wszystkie Obrazy"}
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
          disabled={isGeneratingAll3D || scriptParts.every((p) => p.model3dUrl)}
          className={`flex items-center gap-2 text-sm transition-colors ${
            scriptParts.every((p) => p.model3dUrl) ? "text-neutral-500" : "text-sky-400 hover:text-sky-300"
          } disabled:opacity-50`}
          title="Generuj modele 3D dla wszystkich scenariuszy"
        >
          {isGeneratingAll3D ? <Activity size={16} className="animate-spin" /> : <Box size={16} />}
          {isGeneratingAll3D ? "Generowanie 3D..." : "Generuj Wszystkie Modele 3D"}
        </button>

        <button
          onClick={() => setIsPreviewVisible(!isPreviewVisible)}
          className={`flex items-center gap-2 text-sm transition-colors ${
            isPreviewVisible ? "text-amber-400 hover:text-amber-300" : "text-emerald-400 hover:text-emerald-300"
          }`}
        >
          <MonitorPlay size={16} /> {isPreviewVisible ? "Zamknij Podgląd Wideo" : "Otwórz Podgląd Wideo"}
        </button>
      </div>
    </div>
  );
});
