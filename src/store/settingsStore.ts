import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  stripeKey: string;
  makeWebhook: string;
  openAiKey: string;
  geminiKey: string;
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  setStripeKey: (key: string) => void;
  setMakeWebhook: (url: string) => void;
  setOpenAiKey: (key: string) => void;
  setGeminiKey: (key: string) => void;
  setSupabaseUrl: (url: string) => void;
  setSupabaseServiceRoleKey: (key: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      stripeKey: "",
      makeWebhook: "",
      openAiKey: "",
      geminiKey: "",
      supabaseUrl: "",
      supabaseServiceRoleKey: "",
      setStripeKey: (stripeKey) => set({ stripeKey }),
      setMakeWebhook: (makeWebhook) => set({ makeWebhook }),
      setOpenAiKey: (openAiKey) => set({ openAiKey }),
      setGeminiKey: (geminiKey) => set({ geminiKey }),
      setSupabaseUrl: (supabaseUrl) => set({ supabaseUrl }),
      setSupabaseServiceRoleKey: (supabaseServiceRoleKey) => set({ supabaseServiceRoleKey }),
    }),
    { name: "settings-store" }
  )
);
