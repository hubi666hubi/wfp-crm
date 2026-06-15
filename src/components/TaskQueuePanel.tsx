import { motion, AnimatePresence } from "motion/react";
import { useVslStore } from "../store/vslStore";
import { useCronStore } from "../store/cronStore";
import {
  Play,
  Activity,
  Check,
  X,
  ArrowUpCircle,
  Trash2,
  Maximize2,
  Minimize2,
  CalendarClock,
  Pause,
} from "lucide-react";
import { useState } from "react";

export const TaskQueuePanel = () => {
  const { tasks, removeTask, promoteTask, clearCompletedTasks } = useVslStore();
  const { jobs, removeJob, toggleJob } = useCronStore();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"queue" | "cron">("queue");

  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "processing" | "completed" | "failed"
  >("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "image" | "3d">("all");

  if (tasks.length === 0 && jobs.length === 0) return null;

  const pendingCount = tasks.filter((t) => t.status === "pending").length;
  const processingCount = tasks.filter((t) => t.status === "processing").length;

  const filteredTasks = tasks.filter((task) => {
    if (statusFilter !== "all" && task.status !== statusFilter) return false;
    if (typeFilter !== "all" && task.type !== typeFilter) return false;
    return true;
  });

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col items-end">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mb-2 bg-neutral-900 border border-neutral-800 rounded-lg shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-hidden w-80 max-h-[500px] flex flex-col"
          >
            <div className="flex border-b border-neutral-800 bg-neutral-900/50">
              <button 
                onClick={() => setActiveTab('queue')}
                className={`flex-1 p-3 text-xs font-medium text-center transition-colors ${activeTab === 'queue' ? 'text-indigo-400 border-b-2 border-indigo-500 bg-neutral-800/20' : 'text-neutral-500 hover:text-neutral-300'}`}
              >
                Kolejka Zadań
              </button>
              <button 
                onClick={() => setActiveTab('cron')}
                className={`flex-1 p-3 text-xs font-medium text-center transition-colors ${activeTab === 'cron' ? 'text-emerald-400 border-b-2 border-emerald-500 bg-neutral-800/20' : 'text-neutral-500 hover:text-neutral-300'}`}
              >
                Autopilot (Cron)
              </button>
            </div>

            {activeTab === 'queue' ? (
              <>
                <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-800 bg-neutral-900 flex-wrap gap-2">
                  <div className="flex gap-2 text-[10px]">
                    <select
                      value={statusFilter}
                      onChange={(e) =>
                        setStatusFilter(
                          e.target.value as
                            | "all"
                            | "pending"
                            | "processing"
                            | "completed"
                            | "failed",
                        )
                      }
                      className="bg-neutral-800 text-neutral-300 border border-neutral-700 rounded px-1.5 py-0.5 outline-none focus:border-neutral-500"
                    >
                      <option value="all">Wsz. Status</option>
                      <option value="pending">Oczekujące</option>
                      <option value="processing">W trakcie</option>
                      <option value="completed">Zakończone</option>
                      <option value="failed">Błędy</option>
                    </select>

                    <select
                      value={typeFilter}
                      onChange={(e) =>
                        setTypeFilter(e.target.value as "all" | "image" | "3d")
                      }
                      className="bg-neutral-800 text-neutral-300 border border-neutral-700 rounded px-1.5 py-0.5 outline-none focus:border-neutral-500"
                    >
                      <option value="all">Wsz. Typ</option>
                      <option value="image">Obraz</option>
                      <option value="3d">Model 3D</option>
                    </select>
                  </div>
                  <button
                    onClick={clearCompletedTasks}
                    className="text-[10px] text-neutral-500 hover:text-neutral-300 transition-colors ml-auto"
                  >
                    Wyczyść zakończone
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar min-h-[200px]">
                  {filteredTasks.length === 0 ? (
                    <div className="text-center p-4 text-[10px] text-neutral-500 h-full flex items-center justify-center">
                      Brak zadań w kolejce
                    </div>
                  ) : (
                    filteredTasks.map((task) => (
                      <div
                        key={task.id}
                        className="bg-neutral-800/50 border border-neutral-700/50 rounded flex flex-col p-2 gap-1.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span
                            className="text-[10px] font-medium text-neutral-300 truncate max-w-[200px]"
                            title={task.prompt}
                          >
                            {task.type === "text"
                              ? "Zadanie:"
                              : `Scena ${task.partIndex + 1}:`}{" "}
                            {task.type === "image"
                              ? "Obraz"
                              : task.type === "text"
                                ? task.prompt
                                : "Model 3D"}
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            {task.status === "pending" && (
                              <X
                                size={12}
                                className="text-neutral-500 hover:text-rose-400 cursor-pointer"
                                onClick={() => removeTask(task.id)}
                              />
                            )}
                            {task.status === "failed" && (
                              <Trash2
                                size={12}
                                className="text-rose-500 hover:text-rose-400 cursor-pointer"
                                onClick={() => removeTask(task.id)}
                              />
                            )}
                            {task.status === "pending" && (
                              <ArrowUpCircle
                                size={12}
                                className="text-sky-500 hover:text-sky-400 cursor-pointer"
                                onClick={() => promoteTask(task.id)}
                                title="Priorytetyzuj"
                              />
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {task.status === "pending" && (
                            <div className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-700 text-neutral-300 flex items-center gap-1">
                              <Play size={8} /> Oczekuje
                            </div>
                          )}
                          {task.status === "processing" && (
                            <div className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 flex items-center gap-1 border border-amber-500/20">
                              <Activity size={8} className="animate-spin" />{" "}
                              Przetwarzanie... {task.progress || 0}%
                            </div>
                          )}
                          {task.status === "completed" && (
                            <div className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 flex items-center gap-1 border border-emerald-500/20">
                              <Check size={8} /> Gotowe
                            </div>
                          )}
                          {task.status === "failed" && (
                            <div className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 flex items-center gap-1 border border-rose-500/20">
                              <X size={8} /> Błąd
                            </div>
                          )}

                          <span className="text-[9px] text-neutral-500 truncate">
                            {task.prompt}
                          </span>
                        </div>
                        {task.status === "processing" && (
                          <div className="w-full bg-neutral-900 rounded-full h-1 mt-1 overflow-hidden">
                            <motion.div
                              className="bg-amber-500 h-1 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${task.progress || 0}%` }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                        )}
                        {task.status === "completed" && (
                          <div className="w-full bg-neutral-900 rounded-full h-1 mt-1 overflow-hidden">
                            <motion.div
                              className="bg-emerald-500 h-1 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: "100%" }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                        )}
                        {task.error && (
                          <div className="text-[9px] text-rose-400 mt-1 line-clamp-2 leading-tight">
                            {task.error}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar min-h-[200px]">
                {jobs.length === 0 ? (
                  <div className="text-center p-4 text-[10px] text-neutral-500 h-full flex flex-col items-center justify-center gap-2">
                    <CalendarClock size={24} className="text-neutral-700" />
                    Brak aktywnych zadań CRON
                  </div>
                ) : (
                  jobs.map((job) => (
                    <div
                      key={job.id}
                      className={`bg-neutral-800/50 border ${job.status === 'active' ? 'border-emerald-700/50' : 'border-neutral-700/50'} rounded flex flex-col p-2 gap-2 transition-colors`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className={`text-[11px] font-bold ${job.status === 'active' ? 'text-emerald-400' : 'text-neutral-400'} line-clamp-2 uppercase`}>
                          {job.name}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          {job.status === 'active' ? (
                            <button onClick={() => toggleJob(job.id)} title="Pauzuj CRON'a" className="text-amber-500 hover:text-amber-400 transition">
                              <Pause size={12} fill="currentColor" />
                            </button>
                          ) : (
                            <button onClick={() => toggleJob(job.id)} title="Wznów CRON'a" className="text-emerald-500 hover:text-emerald-400 transition">
                              <Play size={12} fill="currentColor" />
                            </button>
                          )}
                          <button onClick={() => removeJob(job.id)} title="Usuń" className="text-rose-500 hover:text-rose-400 transition">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                        <div className="flex items-center gap-1.5 bg-neutral-900 py-0.5 px-1.5 rounded border border-neutral-700">
                          <CalendarClock size={10} className="text-neutral-400" />
                          <span className="text-neutral-300 font-medium">Cykl: {job.frequency}</span>
                        </div>
                        <span className="text-neutral-500 font-mono">
                          Next: {new Date(job.nextRun).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 bg-neutral-900 border border-neutral-700 hover:border-neutral-600 shadow-lg rounded-full px-4 py-2 transition-all"
      >
        <div className="flex items-center gap-1.5">
          {processingCount > 0 ? (
            <Activity size={14} className="text-amber-500 animate-spin" />
          ) : pendingCount > 0 ? (
            <Play size={14} className="text-sky-500" />
          ) : (
            <Check size={14} className="text-emerald-500" />
          )}
          <span className="text-xs font-medium text-neutral-200">
            Kolejka: {pendingCount + processingCount}
          </span>
        </div>
        
        {jobs.length > 0 && (
          <>
            <div className="w-[1px] h-3 bg-neutral-700 mx-1"></div>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <CalendarClock size={14} />
              <span className="text-xs font-bold">{jobs.filter(j => j.status === 'active').length}</span>
            </div>
          </>
        )}

        <div className="w-[1px] h-3 bg-neutral-700 mx-1"></div>
        {isExpanded ? (
          <Minimize2 size={14} className="text-neutral-400" />
        ) : (
          <Maximize2 size={14} className="text-neutral-400" />
        )}
      </button>
    </div>
  );
};
