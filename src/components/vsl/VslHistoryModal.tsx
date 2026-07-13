import React from "react";
import { History, X, Activity, Clock, Trash2 } from "lucide-react";

interface VslHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  previousScripts: any[];
  isLoadingScripts: boolean;
  loadPreviousScript: (script: any) => void;
  deletePreviousScript: (id: string, e: React.MouseEvent) => void;
}

export const VslHistoryModal = React.memo(function VslHistoryModal({
  isOpen,
  onClose,
  previousScripts,
  isLoadingScripts,
  loadPreviousScript,
  deletePreviousScript,
}: VslHistoryModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-rose-950/20">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <History size={18} className="text-rose-400" />
            Historia wersji skryptów VSL (Firestore)
          </h3>
          <button
            onClick={onClose}
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
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-xs text-white font-semibold rounded-lg transition-colors"
          >
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
});
