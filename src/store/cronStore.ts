import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CronJob {
  id: string;
  name: string;
  frequency: string;
  nextRun: string;
  type: string;
  status: "active" | "paused";
}

interface CronState {
  jobs: CronJob[];
  addJob: (job: Omit<CronJob, "id">) => void;
  toggleJob: (id: string) => void;
  removeJob: (id: string) => void;
}

export const useCronStore = create<CronState>()(
  persist(
    (set) => ({
      jobs: [],
      addJob: (job) =>
        set((state) => ({
          jobs: [...state.jobs, { ...job, id: crypto.randomUUID() }],
        })),
      toggleJob: (id) =>
        set((state) => ({
          jobs: state.jobs.map((j) =>
            j.id === id
              ? { ...j, status: j.status === "active" ? "paused" : "active" }
              : j
          ),
        })),
      removeJob: (id) =>
        set((state) => ({
          jobs: state.jobs.filter((j) => j.id !== id),
        })),
    }),
    { name: "cron-store" }
  )
);
