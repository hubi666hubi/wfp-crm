import React, { useState } from "react";
import { Share2, X, CalendarDays, CalendarCheck } from "lucide-react";
import { toast } from "sonner";
import { useCronStore } from "../../store/cronStore";
import { useVslStore } from "../../store/vslStore";

interface VslContentEngineModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VslContentEngineModal = React.memo(function VslContentEngineModal({
  isOpen,
  onClose,
}: VslContentEngineModalProps) {
  const [contentEngineConfig, setContentEngineConfig] = useState({
    amount: 15,
    frequency: "co_2_dni",
    autoSchedule: true,
  });

  if (!isOpen) return null;

  const handleLaunchRepurposing = () => {
    useCronStore.getState().addJob({
      name: `Repurposing ( ${contentEngineConfig.amount} wariantów )`,
      type: "repurposing",
      frequency: contentEngineConfig.frequency,
      nextRun: new Date(Date.now() + 86400000).toISOString(),
      status: "active",
    });

    for (let i = 0; i < 2; i++) {
      useVslStore.getState().enqueueTask({
        type: "text",
        partIndex: 0,
        prompt: `Multi-Channel ${i + 1}: Karuzela LinkedIn`,
        priority: 5,
        options: { contentIdx: 0 },
      });
      useVslStore.getState().enqueueTask({
        type: "text",
        partIndex: 0,
        prompt: `Multi-Channel ${i + 1}: Wątek na X (Twitter)`,
        priority: 5,
        options: { contentIdx: 0 },
      });
    }
    
    onClose();
    toast.success(
      `🗓️ Poprawnie dodano na Automatyzację/Kalendarza! Cykl: ${contentEngineConfig.frequency}.`
    );
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Share2 size={18} className="text-indigo-400" />
            Dystrybucja & Repurposing
          </h3>
          <button
            onClick={onClose}
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
            onClick={onClose}
            className="px-4 py-2 text-sm text-neutral-400 hover:bg-neutral-800 rounded-lg transition-colors w-full sm:w-auto"
          >
            Anuluj
          </button>
          <button
            onClick={handleLaunchRepurposing}
            className="flex items-center justify-center gap-2 px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-lg shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-colors w-full sm:w-auto"
          >
            <CalendarCheck size={18} /> Uruchom Repurposing
          </button>
        </div>
      </div>
    </div>
  );
});
