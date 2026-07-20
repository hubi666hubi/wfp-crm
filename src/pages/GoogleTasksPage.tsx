import React, { useState, useEffect, useCallback } from "react";
import { getAccessToken, initAuth, googleSignIn } from "../lib/auth";
import { CheckSquare, Plus, Trash2, Calendar } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";

interface TaskList {
  id: string;
  title: string;
}

interface Task {
  id: string;
  title: string;
  notes?: string;
  status: "needsAction" | "completed";
  due?: string;
}

const parsePriority = (title: string) => {
  const match = title.match(/^\[(Low|Medium|High|Critical)\]\s*(.*)$/i);
  if (match) {
    return { priority: match[1], displayTitle: match[2] };
  }
  return { priority: null, displayTitle: title };
};

export function GoogleTasksPage() {
  const [needsAuth, setNeedsAuth] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [selectedListId, setSelectedListId] = useState<string>("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("Normal");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(
    new Set(),
  );
  const [showCompleted, setShowCompleted] = useState(false);

  const fetchTaskLists = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;

    try {
      setIsLoading(true);
      const res = await fetch(
        "https://tasks.googleapis.com/tasks/v1/users/@me/lists",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) throw new Error("Błąd ładowania list zadań");
      const data = await res.json();
      setTaskLists(data.items || []);
      if (data.items && data.items.length > 0) {
        setSelectedListId(data.items[0].id);
      }
    } catch (err) {
      console.error(err);
      toast.error("Nie udało się pobrać list zadań.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchTasks = useCallback(async (listId: string) => {
    const token = getAccessToken();
    if (!token) return;

    try {
      setIsLoading(true);
      const res = await fetch(
        `https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks?showCompleted=true&showHidden=true`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) throw new Error("Błąd ładowania zadań");
      const data = await res.json();
      setTasks(data.items || []);
    } catch (err) {
      console.error(err);
      toast.error("Nie udało się pobrać zadań.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = initAuth(
      () => {
        setNeedsAuth(false);
        fetchTaskLists();
      },
      () => setNeedsAuth(true),
    );
    return () => unsubscribe();
  }, [fetchTaskLists]);

  useEffect(() => {
    if (selectedListId) {
      //
      setSelectedTaskIds(new Set());
      fetchTasks(selectedListId);
    }
  }, [selectedListId, fetchTasks]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setNeedsAuth(false);
        fetchTaskLists();
      }
    } catch (err) {
      console.error("Login failed:", err);
      toast.error("Błąd logowania do Google");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !selectedListId) return;

    const token = getAccessToken();
    if (!token) return;

    const finalTitle =
      newTaskPriority !== "Normal"
        ? `[${newTaskPriority}] ${newTaskTitle}`
        : newTaskTitle;

    try {
      const res = await fetch(
        `https://tasks.googleapis.com/tasks/v1/lists/${selectedListId}/tasks`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ title: finalTitle }),
        },
      );
      if (!res.ok) throw new Error("Błąd dodawania zadania");
      const newTask = await res.json();
      setTasks([newTask, ...tasks]);
      setNewTaskTitle("");
      setNewTaskPriority("Normal");
      toast.success("Dodano zadanie");
    } catch (err) {
      console.error(err);
      toast.error("Nie udało się dodać zadania.");
    }
  };

  const toggleTaskStatus = async (task: Task) => {
    const token = getAccessToken();
    if (!token) return;

    const newStatus = task.status === "completed" ? "needsAction" : "completed";
    // Optimistic update
    setTasks(
      tasks.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)),
    );

    try {
      const res = await fetch(
        `https://tasks.googleapis.com/tasks/v1/lists/${selectedListId}/tasks/${task.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ...task, status: newStatus }),
        },
      );
      if (!res.ok) throw new Error("Błąd aktualizacji zadania");
    } catch (err) {
      console.error(err);
      toast.error("Nie udało się zaktualizować statusu zadania.");
      // Revert on fail
      setTasks(tasks.map((t) => (t.id === task.id ? task : t)));
    }
  };

  const toggleSelection = (taskId: string) => {
    setSelectedTaskIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const filteredTasks = showCompleted
    ? tasks
    : tasks.filter((t) => t.status !== "completed");

  const toggleSelectAll = () => {
    const allFilteredSelected =
      filteredTasks.length > 0 &&
      filteredTasks.every((t) => selectedTaskIds.has(t.id));
    if (allFilteredSelected) {
      setSelectedTaskIds(new Set());
    } else {
      setSelectedTaskIds(new Set(filteredTasks.map((t) => t.id)));
    }
  };

  const bulkToggleStatus = async (status: "needsAction" | "completed") => {
    const token = getAccessToken();
    if (!token) return;
    if (selectedTaskIds.size === 0) return;

    const tasksToUpdate = tasks.filter(
      (t) => selectedTaskIds.has(t.id) && t.status !== status,
    );
    if (tasksToUpdate.length === 0) {
      setSelectedTaskIds(new Set());
      return;
    }

    setTasks((prevTasks) =>
      prevTasks.map((t) => (selectedTaskIds.has(t.id) ? { ...t, status } : t)),
    );

    try {
      await Promise.all(
        tasksToUpdate.map((task) =>
          fetch(
            `https://tasks.googleapis.com/tasks/v1/lists/${selectedListId}/tasks/${task.id}`,
            {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ ...task, status }),
            },
          ),
        ),
      );
      toast.success(`Zaktualizowano status ${tasksToUpdate.length} zadań`);
    } catch (err) {
      console.error(err);
      toast.error("Błąd podczas aktualizacji wielu zadań.");
      fetchTasks(selectedListId);
    } finally {
      setSelectedTaskIds(new Set());
    }
  };

  const bulkDelete = async () => {
    const token = getAccessToken();
    if (!token) return;
    if (selectedTaskIds.size === 0) return;

    if (
      !confirm(
        `Czy na pewno chcesz usunąć ${selectedTaskIds.size} zaznaczonych zadań?`,
      )
    )
      return;

    const idsToDelete = Array.from(selectedTaskIds);
    setTasks((prevTasks) =>
      prevTasks.filter((t) => !selectedTaskIds.has(t.id)),
    );

    try {
      await Promise.all(
        idsToDelete.map((taskId) =>
          fetch(
            `https://tasks.googleapis.com/tasks/v1/lists/${selectedListId}/tasks/${taskId}`,
            {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            },
          ),
        ),
      );
      toast.success(`Usunięto ${idsToDelete.length} zadań`);
    } catch (err) {
      console.error(err);
      toast.error("Błąd podczas usuwania wielu zadań.");
      fetchTasks(selectedListId);
    } finally {
      setSelectedTaskIds(new Set());
    }
  };

  const deleteTask = async (taskId: string) => {
    const token = getAccessToken();
    if (!token) return;

    if (!confirm("Czy na pewno chcesz usunąć to zadanie?")) return;

    try {
      const res = await fetch(
        `https://tasks.googleapis.com/tasks/v1/lists/${selectedListId}/tasks/${taskId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) throw new Error("Błąd usuwania zadania");
      setTasks(tasks.filter((t) => t.id !== taskId));
      toast.success("Usunięto zadanie");
    } catch (err) {
      console.error(err);
      toast.error("Nie udało się usunąć zadania.");
    }
  };

  if (needsAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <CheckSquare className="w-16 h-16 text-blue-500 mb-6" />
        <h2 className="text-2xl font-bold text-white mb-2">
          Google Tasks Integration
        </h2>
        <p className="text-neutral-400 max-w-md mb-8">
          Zaloguj się z Google i przyznaj dostęp, aby zarządzać swoimi zadaniami
          Google Tasks bezpośrednio z aplikacji.
        </p>
        <button
          onClick={handleLogin}
          disabled={isLoggingIn}
          className="flex items-center gap-3 px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg border border-neutral-700 transition font-medium"
        >
          <svg className="w-5 h-5" viewBox="0 0 48 48">
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
            />
            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
            />
            <path
              fill="#FBBC05"
              d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
            />
            <path fill="none" d="M0 0h48v48H0z" />
          </svg>
          {isLoggingIn ? "Logowanie..." : "Zaloguj się przez Google"}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-blue-500/10 rounded-lg">
          <CheckSquare className="text-blue-500" size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Google Tasks
          </h1>
          <p className="text-neutral-400">
            Zarządzaj swoimi zadaniami prosto z panelu W.F.P.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-4">
          <h2 className="text-lg font-medium text-white px-2">Listy Zadań</h2>
          <div className="space-y-1">
            {taskLists.map((list) => (
              <button
                key={list.id}
                onClick={() => setSelectedListId(list.id)}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-colors ${
                  selectedListId === list.id
                    ? "bg-blue-600 text-white font-medium shadow-md shadow-blue-500/20"
                    : "bg-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-white"
                }`}
              >
                {list.title}
              </button>
            ))}
          </div>
        </div>

        <div className="md:col-span-3 bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden flex flex-col min-h-[500px]">
          <div className="p-4 border-b border-neutral-800 bg-neutral-950/50 space-y-3">
            <form onSubmit={handleAddTask} className="flex gap-2">
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value)}
                className="bg-black border border-neutral-800 rounded-lg px-2 py-2 text-sm text-neutral-300 focus:outline-none focus:border-blue-500 transition-colors"
                disabled={isLoading || !selectedListId}
              >
                <option value="Normal">Brak</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Dodaj nowe zadanie..."
                className="flex-1 bg-black border border-neutral-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                disabled={isLoading || !selectedListId}
              />
              <button
                type="submit"
                disabled={!newTaskTitle.trim() || isLoading || !selectedListId}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Dodaj</span>
              </button>
            </form>

            {tasks.length > 0 && (
              <div className="flex items-center justify-between bg-neutral-900/80 px-3 py-2 rounded-lg border border-neutral-800">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={
                          filteredTasks.length > 0 &&
                          filteredTasks.every((t) => selectedTaskIds.has(t.id))
                        }
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-neutral-700 bg-black text-blue-500 focus:ring-blue-500 focus:ring-offset-neutral-900 cursor-pointer"
                      />
                    </label>
                    <span className="text-xs text-neutral-400 font-medium">
                      {selectedTaskIds.size} zaznaczonych
                    </span>
                  </div>

                  <div className="h-4 w-px bg-neutral-800"></div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showCompleted}
                      onChange={(e) => setShowCompleted(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-neutral-700 bg-black text-blue-500 focus:ring-blue-500 focus:ring-offset-neutral-900 cursor-pointer"
                    />
                    <span className="text-xs text-neutral-400">
                      Pokaż ukończone
                    </span>
                  </label>
                </div>

                {selectedTaskIds.size > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => bulkToggleStatus("completed")}
                      className="text-xs px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-md transition flex items-center gap-1 font-medium"
                      title="Oznacz jako zakończone"
                    >
                      <CheckSquare size={14} /> Zakończ
                    </button>
                    <button
                      onClick={() => bulkToggleStatus("needsAction")}
                      className="text-xs px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-md transition font-medium"
                      title="Oznacz jako aktywne"
                    >
                      Cofnij
                    </button>
                    <button
                      onClick={bulkDelete}
                      className="text-xs px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-md transition flex items-center gap-1 font-medium"
                      title="Usuń zaznaczone zadania"
                    >
                      <Trash2 size={14} /> Usuń
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
            {isLoading && tasks.length === 0 ? (
              <div className="flex justify-center items-center h-full text-neutral-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-neutral-500 space-y-3">
                <CheckSquare size={48} className="opacity-20" />
                <p>Ta lista jest pusta</p>
                {!showCompleted && tasks.length > 0 && (
                  <button
                    onClick={() => setShowCompleted(true)}
                    className="text-sm text-blue-400 hover:text-blue-300 underline underline-offset-2"
                  >
                    Pokaż ukończone zadania
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTasks.map((task) => {
                  const { priority, displayTitle } = parsePriority(task.title);
                  return (
                    <motion.div
                      key={task.id}
                      layoutId={task.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-colors group ${
                        task.status === "completed"
                          ? "bg-neutral-900/50 border-neutral-800/50 opacity-60"
                          : "bg-neutral-950 border-neutral-800"
                      } ${selectedTaskIds.has(task.id) ? "border-blue-500/50 bg-blue-500/5" : ""}`}
                    >
                      <div className="flex items-center h-6">
                        <input
                          type="checkbox"
                          checked={selectedTaskIds.has(task.id)}
                          onChange={() => toggleSelection(task.id)}
                          className="w-4 h-4 rounded border-neutral-700 bg-black text-blue-500 focus:ring-blue-500 focus:ring-offset-neutral-950 cursor-pointer"
                        />
                      </div>
                      <button
                        onClick={() => toggleTaskStatus(task)}
                        className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                          task.status === "completed"
                            ? "bg-blue-500 border-blue-500 text-white"
                            : "border-neutral-500 hover:border-blue-400 text-transparent hover:text-blue-400"
                        }`}
                      >
                        <CheckSquare size={14} className="opacity-100" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          {priority && (
                            <span
                              className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${
                                priority.toLowerCase() === "critical"
                                  ? "bg-rose-500/20 text-rose-400"
                                  : priority.toLowerCase() === "high"
                                    ? "bg-orange-500/20 text-orange-400"
                                    : priority.toLowerCase() === "medium"
                                      ? "bg-yellow-500/20 text-yellow-400"
                                      : "bg-green-500/20 text-green-400"
                              }`}
                            >
                              {priority}
                            </span>
                          )}
                          <p
                            className={`text-sm font-medium ${task.status === "completed" ? "text-neutral-500 line-through" : "text-neutral-200"}`}
                          >
                            {displayTitle}
                          </p>
                        </div>
                        {task.notes && (
                          <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                            {task.notes}
                          </p>
                        )}
                        {task.due &&
                          (() => {
                            const isDueSoon =
                              task.status !== "completed" &&
                              new Date(task.due).getTime() - Date.now() <=
                                24 * 60 * 60 * 1000;
                            return (
                              <div
                                className={`flex items-center gap-1 text-[10px] mt-2 w-fit px-1.5 py-0.5 rounded ${
                                  isDueSoon
                                    ? "text-rose-400 bg-rose-500/10 font-medium"
                                    : "text-neutral-500 px-0"
                                }`}
                              >
                                <Calendar size={10} />
                                {new Date(task.due).toLocaleDateString()}
                                {isDueSoon && (
                                  <span className="ml-0.5">&lt;24h</span>
                                )}
                              </div>
                            );
                          })()}
                      </div>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-all"
                        title="Usuń zadanie"
                      >
                        <Trash2 size={16} />
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
