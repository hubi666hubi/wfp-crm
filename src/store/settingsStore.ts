import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  stripeKey: string;
  makeWebhook: string;
  openAiKey: string;
  geminiKey: string;
  deepseekKey: string;
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  stitchProjectId: string;
  setStripeKey: (key: string) => void;
  setMakeWebhook: (url: string) => void;
  setOpenAiKey: (key: string) => void;
  setGeminiKey: (key: string) => void;
  setDeepseekKey: (key: string) => void;
  setSupabaseUrl: (url: string) => void;
  setSupabaseServiceRoleKey: (key: string) => void;
  setStitchProjectId: (id: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      stripeKey: "",
      makeWebhook: "",
      openAiKey: "",
      geminiKey: "",
      deepseekKey: "",
      supabaseUrl: "",
      supabaseServiceRoleKey: "",
      stitchProjectId: "353902890850105523",
      setStripeKey: (stripeKey) => set({ stripeKey }),
      setMakeWebhook: (makeWebhook) => set({ makeWebhook }),
      setOpenAiKey: (openAiKey) => set({ openAiKey }),
      setGeminiKey: (geminiKey) => set({ geminiKey }),
      setDeepseekKey: (deepseekKey) => set({ deepseekKey }),
      setSupabaseUrl: (supabaseUrl) => set({ supabaseUrl }),
      setSupabaseServiceRoleKey: (supabaseServiceRoleKey) => set({ supabaseServiceRoleKey }),
      setStitchProjectId: (stitchProjectId) => set({ stitchProjectId }),
    }),
    { name: "settings-store" }
  )
);
