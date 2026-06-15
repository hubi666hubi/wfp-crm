import { create } from "zustand";

export interface KeywordSuggestionGroup {
  category: string;
  keywords: string[];
}

export interface ScriptPart {
  type: string;
  time: string;
  visual: string;
  audio: string;
  text: string;
  imageUrl?: string;
  imageVariations?: string[];
  isGeneratingImage?: boolean;
  isGeneratingKeywords?: boolean;
  keywordSuggestions?: KeywordSuggestionGroup[];
  isGeneratingAdvancedPrompt?: boolean;
  imageError?: string;
  model3dUrl?: string;
  preview3dUrl?: string;
  isGenerating3D?: boolean;
  model3dError?: string;
}

export type ViewMode = "list" | "storyboard";
export type AspectRatio = "16:9" | "1:1" | "9:16";

export type TaskType = "image" | "3d" | "text";
export type TaskStatus = "pending" | "processing" | "completed" | "failed";

export interface GenerativeTask {
  id: string;
  partIndex: number;
  type: TaskType;
  status: TaskStatus;
  priority: number;
  prompt: string;
  createdAt: string; // ISO string
  progress?: number;
  error?: string;
  options?: Record<string, unknown>;
}

export interface VslParameters {
  productName: string;
  targetAudience: string;
  mainProblem: string;
  keyBenefits: string;
  videoQuality?: string;
}

interface VslState {
  topic: string;
  parameters: VslParameters;
  globalKeywords: string[];
  generating: boolean;
  scriptParts: ScriptPart[];
  isPreviewVisible: boolean;
  isPlaying: boolean;
  currentPartIndex: number;
  volume: number;
  lastSaved: Date | null;
  viewMode: ViewMode;
  isGeneratingAllImages: boolean;
  isGeneratingAll3D: boolean;
  imageAspectRatio: AspectRatio;
  imageVariationsCount: number;
  model3dStyle: string;
  model3dFormat: string;
  customKeywords: Record<number, string>;
  tasks: GenerativeTask[];

  // Parameters
  setParameter: (key: keyof VslParameters, value: string) => void;

  // Queue Actions
  enqueueTask: (
    task: Omit<GenerativeTask, "id" | "status" | "createdAt">,
  ) => void;
  updateTaskStatus: (id: string, status: TaskStatus, error?: string) => void;
  updateTaskProgress: (id: string, progress: number) => void;
  removeTask: (id: string) => void;
  clearCompletedTasks: () => void;
  promoteTask: (id: string) => void;

  // Actions
  setTopic: (topic: string) => void;
  setGlobalKeywords: (
    updater: string[] | ((prev: string[]) => string[]),
  ) => void;
  addGlobalKeyword: (keyword: string) => void;
  removeGlobalKeyword: (keyword: string) => void;
  setGenerating: (generating: boolean) => void;
  setScriptParts: (
    updater: ScriptPart[] | ((prev: ScriptPart[]) => ScriptPart[]),
  ) => void;
  setIsPreviewVisible: (visible: boolean) => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentPartIndex: (index: number | ((prev: number) => number)) => void;
  setVolume: (volume: number | ((prev: number) => number)) => void;
  setLastSaved: (date: Date | null) => void;
  setViewMode: (mode: ViewMode) => void;
  setIsGeneratingAllImages: (generating: boolean) => void;
  setIsGeneratingAll3D: (generating: boolean) => void;
  setImageAspectRatio: (ratio: AspectRatio) => void;
  setImageVariationsCount: (count: number) => void;
  setModel3dStyle: (style: string) => void;
  setModel3dFormat: (format: string) => void;
  setCustomKeywords: (
    updater:
      | Record<number, string>
      | ((prev: Record<number, string>) => Record<number, string>),
  ) => void;

  // Specific complex actions for VSL
  updatePartVisual: (index: number, newVisual: string) => void;
  updatePartAudio: (index: number, newAudio: string) => void;
  updatePartText: (index: number, newText: string) => void;
  appendKeyword: (index: number, keyword: string) => void;
  addKeywordToSuggestions: (index: number) => void;
  removeKeywordFromSuggestions: (
    index: number,
    category: string,
    keyword: string,
  ) => void;
  updateKeywordSuggestionCategory: (
    index: number,
    oldCategory: string,
    newCategory: string,
  ) => void;
  clearKeywordSuggestions: (index: number) => void;
}

// Custom storage to serialize Date properly if needed, although defaults are fine,
// let's use a simpler state that doesn't persist everything, or persist only what was persisted before.
// Originally, we saved: topic, scriptParts, timestamp in localStorage.
// Let's create the store.

export const useVslStore = create<VslState>((set) => ({
  topic: "lack of predictable growth",
  parameters: {
    productName: "GrowthAI",
    targetAudience: "SaaS founders",
    mainProblem: "lack of predictable growth",
    keyBenefits: "automated lead nurturing and conversion optimization",
    videoQuality: "1080p",
  },
  globalKeywords: [],
  generating: false,
  scriptParts: [],
  isPreviewVisible: false,
  isPlaying: false,
  currentPartIndex: 0,
  volume: 1,
  lastSaved: null,
  viewMode: "list",
  isGeneratingAllImages: false,
  isGeneratingAll3D: false,
  imageAspectRatio: "16:9",
  imageVariationsCount: 1,
  model3dStyle: "realistic",
  model3dFormat: "glb",
  customKeywords: {},
  tasks: [],

  setParameter: (key, value) =>
    set((state) => ({
      parameters: {
        ...state.parameters,
        [key]: value,
      },
    })),

  enqueueTask: (task) =>
    set((state) => ({
      tasks: [
        ...state.tasks,
        {
          ...task,
          id: Math.random().toString(36).substring(2, 9),
          status: "pending" as TaskStatus,
          createdAt: new Date().toISOString(),
        },
      ].sort((a, b) => b.priority - a.priority),
    })),

  updateTaskStatus: (id, status, error) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, status, error: error || t.error } : t,
      ),
    })),

  updateTaskProgress: (id, progress) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, progress } : t)),
    })),

  removeTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    })),

  clearCompletedTasks: () =>
    set((state) => ({
      tasks: state.tasks.filter(
        (t) => t.status !== "completed" && t.status !== "failed",
      ),
    })),

  promoteTask: (id) =>
    set((state) => {
      const task = state.tasks.find((t) => t.id === id);
      if (!task) return state;
      const maxPriority =
        state.tasks.length > 0
          ? Math.max(...state.tasks.map((t) => t.priority))
          : 0;
      return {
        tasks: state.tasks
          .map((t) => (t.id === id ? { ...t, priority: maxPriority + 10 } : t))
          .sort((a, b) => b.priority - a.priority),
      };
    }),

  setTopic: (topic) => set({ topic }),
  setGlobalKeywords: (updater) =>
    set((state) => ({
      globalKeywords:
        typeof updater === "function" ? updater(state.globalKeywords) : updater,
    })),
  addGlobalKeyword: (keyword) =>
    set((state) => {
      const kw = keyword.trim();
      if (!kw || state.globalKeywords.includes(kw)) return state;
      return { globalKeywords: [...state.globalKeywords, kw] };
    }),
  removeGlobalKeyword: (keyword) =>
    set((state) => ({
      globalKeywords: state.globalKeywords.filter((k) => k !== keyword),
    })),
  setGenerating: (generating) => set({ generating }),
  setScriptParts: (updater) =>
    set((state) => ({
      scriptParts:
        typeof updater === "function" ? updater(state.scriptParts) : updater,
    })),
  setIsPreviewVisible: (isPreviewVisible) => set({ isPreviewVisible }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentPartIndex: (updater) =>
    set((state) => ({
      currentPartIndex:
        typeof updater === "function"
          ? updater(state.currentPartIndex)
          : updater,
    })),
  setVolume: (updater) =>
    set((state) => ({
      volume: typeof updater === "function" ? updater(state.volume) : updater,
    })),
  setLastSaved: (lastSaved) => set({ lastSaved }),
  setViewMode: (viewMode) => set({ viewMode }),
  setIsGeneratingAllImages: (isGeneratingAllImages) =>
    set({ isGeneratingAllImages }),
  setIsGeneratingAll3D: (isGeneratingAll3D) => set({ isGeneratingAll3D }),
  setImageAspectRatio: (imageAspectRatio) => set({ imageAspectRatio }),
  setImageVariationsCount: (imageVariationsCount) =>
    set({ imageVariationsCount }),
  setModel3dStyle: (model3dStyle) => set({ model3dStyle }),
  setModel3dFormat: (model3dFormat) => set({ model3dFormat }),
  setCustomKeywords: (updater) =>
    set((state) => ({
      customKeywords:
        typeof updater === "function" ? updater(state.customKeywords) : updater,
    })),

  updatePartVisual: (index, newVisual) =>
    set((state) => {
      const newParts = [...state.scriptParts];
      newParts[index] = { ...newParts[index], visual: newVisual };
      return { scriptParts: newParts };
    }),

  updatePartAudio: (index, newAudio) =>
    set((state) => {
      const newParts = [...state.scriptParts];
      newParts[index] = { ...newParts[index], audio: newAudio };
      return { scriptParts: newParts };
    }),

  updatePartText: (index, newText) =>
    set((state) => {
      const newParts = [...state.scriptParts];
      newParts[index] = { ...newParts[index], text: newText };
      return { scriptParts: newParts };
    }),

  appendKeyword: (index, keyword) =>
    set((state) => {
      const newParts = [...state.scriptParts];
      const currentVisual = newParts[index].visual;
      const updatedVisual =
        currentVisual.endsWith(".") || currentVisual.trim().endsWith(",")
          ? `${currentVisual} ${keyword}`
          : `${currentVisual}, ${keyword}`;
      newParts[index] = {
        ...newParts[index],
        visual: updatedVisual,
        keywordSuggestions: newParts[index].keywordSuggestions
          ?.map((group) => ({
            ...group,
            keywords: group.keywords.filter((k) => k !== keyword),
          }))
          .filter((group) => group.keywords.length > 0),
      };
      return { scriptParts: newParts };
    }),

  addKeywordToSuggestions: (index) =>
    set((state) => {
      const keyword = state.customKeywords[index]?.trim();
      if (!keyword) return state;

      const newParts = [...state.scriptParts];
      const currentSuggestions = newParts[index].keywordSuggestions || [];

      // Check if keyword already exists anywhere
      const keywordExists = currentSuggestions.some((group) =>
        group.keywords.includes(keyword),
      );

      if (!keywordExists) {
        const updatedSuggestions = [...currentSuggestions];
        const customGroupIndex = updatedSuggestions.findIndex(
          (g) => g.category === "Własne",
        );
        if (customGroupIndex >= 0) {
          updatedSuggestions[customGroupIndex] = {
            ...updatedSuggestions[customGroupIndex],
            keywords: [
              ...updatedSuggestions[customGroupIndex].keywords,
              keyword,
            ],
          };
        } else {
          updatedSuggestions.push({ category: "Własne", keywords: [keyword] });
        }
        newParts[index] = {
          ...newParts[index],
          keywordSuggestions: updatedSuggestions,
        };
      }
      return {
        scriptParts: newParts,
        customKeywords: { ...state.customKeywords, [index]: "" },
      };
    }),

  clearKeywordSuggestions: (index: number) =>
    set((state) => {
      const newParts = [...state.scriptParts];
      newParts[index] = { ...newParts[index], keywordSuggestions: undefined };
      return { scriptParts: newParts };
    }),

  removeKeywordFromSuggestions: (index, category, keyword) =>
    set((state) => {
      const newParts = [...state.scriptParts];
      if (!newParts[index].keywordSuggestions) return state;

      newParts[index] = {
        ...newParts[index],
        keywordSuggestions: newParts[index].keywordSuggestions
          ?.map((group) => {
            if (group.category === category) {
              return {
                ...group,
                keywords: group.keywords.filter((k) => k !== keyword),
              };
            }
            return group;
          })
          .filter((group) => group.keywords.length > 0),
      };
      return { scriptParts: newParts };
    }),

  updateKeywordSuggestionCategory: (index, oldCategory, newCategory) =>
    set((state) => {
      if (!newCategory.trim()) return state;
      const newParts = [...state.scriptParts];
      if (!newParts[index].keywordSuggestions) return state;

      newParts[index] = {
        ...newParts[index],
        keywordSuggestions: newParts[index].keywordSuggestions?.map((group) => {
          if (group.category === oldCategory) {
            return { ...group, category: newCategory };
          }
          return group;
        }),
      };
      return { scriptParts: newParts };
    }),
}));
