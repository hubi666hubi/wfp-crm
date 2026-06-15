import { create } from "zustand";
import { persist } from "zustand/middleware";
import { db, auth } from "../lib/firebase";
import { collection, addDoc, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { handleFirestoreError } from "../lib/firebaseErrors";

export interface SystemLog {
  id?: string;
  userId: string;
  userEmail?: string;
  module: string;
  action: string;
  details: string;
  timestamp: string;
}

interface SystemLogsState {
  logs: SystemLog[];
  localLogs: SystemLog[];
  loading: boolean;
  error: string | null;
  fetchLogs: () => Promise<void>;
  logAction: (module: string, action: string, details: string) => Promise<void>;
  clearLogs: () => Promise<void>;
}

export const useSystemLogsStore = create<SystemLogsState>()(
  persist(
    (set, get) => ({
      logs: [],
      localLogs: [],
      loading: false,
      error: null,

      fetchLogs: async () => {
        set({ loading: true, error: null });
        const user = auth.currentUser;
        
        let mergedLogs = [...get().localLogs];

        if (user) {
          try {
            const logsRef = collection(db, "system_logs");
            const q = query(
              logsRef,
              where("userId", "==", user.uid),
              orderBy("timestamp", "desc"),
              limit(100)
            );
            const querySnapshot = await getDocs(q);
            const firestoreLogs: SystemLog[] = [];
            querySnapshot.forEach((doc) => {
              const data = doc.data();
              firestoreLogs.push({
                id: doc.id,
                userId: data.userId,
                userEmail: data.userEmail,
                module: data.module,
                action: data.action,
                details: data.details,
                timestamp: data.timestamp,
              });
            });

            // Merge local and firestore logs without duplicates, then sort descendently by timestamp
            const allLogsMap = new Map<string, SystemLog>();
            
            // Add local logs first
            mergedLogs.forEach(log => {
              const key = `${log.timestamp}-${log.module}-${log.action}`;
              allLogsMap.set(key, log);
            });
            
            // Merge firestore logs (override match keys or add)
            firestoreLogs.forEach(log => {
              const key = `${log.timestamp}-${log.module}-${log.action}`;
              allLogsMap.set(key, log);
            });

            const sortedLogs = Array.from(allLogsMap.values()).sort(
              (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );

            set({ logs: sortedLogs, loading: false });
          } catch (err: unknown) {
            console.error("Error fetching system logs from firestore", err);
            // Fallback to just sorting the local logs
            const sortedLocal = [...get().localLogs].sort(
              (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );
            set({ logs: sortedLocal, loading: false });
            // Since it might be rules restricting it for guests/no authentication, handle firebase errors gracefully
          }
        } else {
          // Guest mode: just sort and set local logs
          const sortedLocal = [...get().localLogs].sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          set({ logs: sortedLocal, loading: false });
        }
      },

      logAction: async (module: string, action: string, details: string) => {
        const user = auth.currentUser;
        const newLog: SystemLog = {
          userId: user?.uid || "guest",
          userEmail: user?.email || "guest@system.omega",
          module,
          action,
          details,
          timestamp: new Date().toISOString(),
        };

        // Always append to localLogs
        const updatedLocal = [newLog, ...get().localLogs].slice(0, 100);
        set({ localLogs: updatedLocal });

        // If user is logged in, try putting it on firebase
        if (user) {
          try {
            const logsRef = collection(db, "system_logs");
            await addDoc(logsRef, {
              userId: newLog.userId,
              userEmail: newLog.userEmail,
              module: newLog.module,
              action: newLog.action,
              details: newLog.details,
              timestamp: newLog.timestamp,
            });
          } catch (err: unknown) {
            console.error("Failed to persist audit log on Firebase", err);
            handleFirestoreError(err, "create", "system_logs");
          }
        }

        // Refresh main list
        get().fetchLogs();
      },

      clearLogs: async () => {
        set({ localLogs: [], logs: [] });
      },
    }),
    {
      name: "system-logs-store",
      partialize: (state) => ({ localLogs: state.localLogs }),
    }
  )
);
