import React from "react";
import { Video, TrendingUp, Sparkles, CloudUpload, Save, History } from "lucide-react";
import { toast } from "sonner";

interface VslHeaderProps {
  googleUser: any;
  autoBackupEnabled: boolean;
  setAutoBackupEnabled: (enabled: boolean) => void;
  lastSaved: Date | null;
  previousScriptsCount: number;
  setIsTrendsModalOpen: (open: boolean) => void;
  setIsHistoryModalOpen: (open: boolean) => void;
  handleLoadProPreset: () => void;
  handleManualSave: () => void;
  googleSignIn: () => Promise<any>;
  setGoogleUser: (user: any) => void;
  fetchPreviousScripts: () => void;
}

export const VslHeader = React.memo(function VslHeader({
  googleUser,
  autoBackupEnabled,
  setAutoBackupEnabled,
  lastSaved,
  previousScriptsCount,
  setIsTrendsModalOpen,
  setIsHistoryModalOpen,
  handleLoadProPreset,
  handleManualSave,
  googleSignIn,
  setGoogleUser,
  fetchPreviousScripts,
}: VslHeaderProps) {
  const handleGoogleSignInClick = async () => {
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
  };

  const handleHistoryClick = () => {
    fetchPreviousScripts();
    setIsHistoryModalOpen(true);
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <Video className="text-rose-500" size={32} />
          Kwantowy Generator VSL
        </h1>
        <p className="mt-1 text-sm text-neutral-400">
          Zautomatyzowane tworzenie angażujących skryptów Video Sales Letters (Dark Patterns, Cognitive Shock).
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
                className={`text-[10px] font-semibold px-1 py-0.5 rounded transition-all ${
                  autoBackupEnabled ? "text-rose-400 hover:text-rose-300" : "text-neutral-500 hover:text-neutral-400"
                }`}
                title="Kliknij, aby zmienić tryb"
              >
                {autoBackupEnabled ? "AUTO: WŁ" : "AUTO: WYŁ"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleGoogleSignInClick}
              className="text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 transition-colors font-medium font-mono"
              title="Kliknij, aby połączyć się z Google Drive i włączyć automatyczną kopię skryptów"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
              <CloudUpload size={14} className="text-neutral-400" />
              <span>Kopia Google Drive</span>
            </button>
          )}
        </div>
        {lastSaved ? (
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
        ) : (
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
          onClick={handleHistoryClick}
          className="text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 px-3.5 py-1.5 rounded-full hover:bg-neutral-800 transition-colors"
          title="Wyświetl poprzednie wersje skryptu automatycznie zapisane w chmurze Firestore"
        >
          <History size={14} className="text-rose-400" />
          <span>Historia wersji ({previousScriptsCount})</span>
        </button>
      </div>
    </div>
  );
});
