import { useState, useEffect, useCallback } from "react";
import { 
  Sparkles, 
  Save, 
  FolderOpen, 
  Trash2, 
  Copy, 
  Wand2, 
  Plus, 
  HelpCircle, 
  Code2, 
  Braces, 
  Eye, 
  CheckCircle,
  AlertCircle,
  ChevronDown,
  Loader2
} from "lucide-react";
import { auth, db } from "../lib/firebase";
import { collection, addDoc, getDocs, query, where, orderBy, deleteDoc, doc } from "firebase/firestore";
import { handleFirestoreError } from "../lib/firebaseErrors";
import { toast } from "sonner";

interface SavedPrompt {
  id: string;
  userId: string;
  title: string;
  promptTemplate: string;
  variables: string[];
  generationType: "image" | "video";
  createdAt: string;
}

interface AdvancedPromptEditorProps {
  generationType: "image" | "video";
  currentPrompt: string;
  onApplyPrompt: (compiledPrompt: string) => void;
}

// Built-in starter templates for immediate utility
const STARTER_TEMPLATES: Omit<SavedPrompt, "id" | "userId">[] = [
  {
    title: "Portret Cinematic Cyborga",
    promptTemplate: "A dramatic close-up studio portrait of a futuristic cyborg {{character_description}} with {{nano_glowing_lines}} glowing circuits, shot on 85mm lens, volumetric smoke, cyberpunk {{color_pallet}} color grade, highly-detailed photorealistic skin textures, unreal engine 5 render, 8k resolution",
    variables: ["character_description", "nano_glowing_lines", "color_pallet"],
    generationType: "image",
    createdAt: new Date().toISOString()
  },
  {
    title: "Produkt Luksusowy na Piasku",
    promptTemplate: "Minimalist studio macro shot of an elegant perfume bottle designed by {{brand_designer}}, lying on dramatic {{sand_color}} sand, glowing golden hour backlighting, shimmering dew particles floating, refraction caustic lights, extreme high fashion editorial, photorealistic, 8k, hdr",
    variables: ["brand_designer", "sand_color"],
    generationType: "image",
    createdAt: new Date().toISOString()
  },
  {
    title: "Przelot Kamery: Kosmiczny Nebula",
    promptTemplate: "Epic slow-motion pullback 3D camera sweep revealing a floating colossal astrolabe and {{astronomical_object}} swirling inside a deep {{nebula_color}} space nebula, cosmic particle vortex, cinematography, photorealistic, 4k",
    variables: ["astronomical_object", "nebula_color"],
    generationType: "video",
    createdAt: new Date().toISOString()
  },
  {
    title: "Dynamiczny Obiekt 360",
    promptTemplate: "Fluid continuous orbital tracking shot circling around a floating ancient {{relic_type}} artifact in a high-tech clean room, dust motes filtering through overhead amber shafts, {{ambience_style}} cinematic lighting model, unreal engine 5, slow-draw dynamic range",
    variables: ["relic_type", "ambience_style"],
    generationType: "video",
    createdAt: new Date().toISOString()
  }
];

export function AdvancedPromptEditor({ 
  generationType, 
  currentPrompt, 
  onApplyPrompt 
}: AdvancedPromptEditorProps) {
  
  const [template, setTemplate] = useState(currentPrompt);
  const [title, setTitle] = useState("");
  const [variablesValues, setVariablesValues] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [savedTemplates, setSavedTemplates] = useState<SavedPrompt[]>([]);
  const [activeTab, setActiveTab] = useState<"edit" | "presets">("edit");
  const [user, setUser] = useState(auth.currentUser);

  const fetchSavedTemplates = useCallback(async (userId: string) => {
    setIsLoading(true);
    try {
      const q = query(
        collection(db, "saved_prompts"),
        where("userId", "==", userId),
        where("generationType", "==", generationType)
      );
      const querySnapshot = await getDocs(q);
      const list: SavedPrompt[] = [];
      querySnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as SavedPrompt);
      });
      setSavedTemplates(list);
    } catch (err) {
      console.error("Error fetching templates:", err);
      try {
        toast.error(handleFirestoreError(err));
      } catch (authErr: any) {
        toast.error("Błąd ładowania: " + authErr.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [generationType]);

  // Monitor firebase authentication
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchSavedTemplates(currentUser.uid);
      }
    });
    return () => unsubscribe();
  }, [fetchSavedTemplates]);

  // Extract variables inside double braces: {{variable}}
  function extractVariables(text: string): string[] {
    const regex = /\{\{([^}]+)\}\}/g;
    const matches = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      const vName = match[1].trim();
      if (!matches.includes(vName)) {
        matches.push(vName);
      }
    }
    return matches;
  }

  // Compile prompt by replacing variables with their current inputs
  const compiledPrompt = (() => {
    let result = template;
    const variables = extractVariables(template);
    variables.forEach((key) => {
      const val = variablesValues[key] || "";
      const placeholder = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g");
      result = result.replace(placeholder, val || `{{${key}}}`);
    });
    return result;
  })();

  const handleSaveTemplate = async () => {
    if (!user) {
      toast.error("Zaloguj się, aby zapisać szablony do chmury Firebase.");
      return;
    }
    if (!title.trim()) {
      toast.error("Wpisz tytuł dla swojego szablonu.");
      return;
    }
    if (!template.trim()) {
      toast.error("Szablon promptu nie może być pusty.");
      return;
    }

    setIsSaving(true);
    const variables = extractVariables(template);

    const payload = {
      userId: user.uid,
      title: title.trim(),
      promptTemplate: template.trim(),
      variables,
      generationType,
      createdAt: new Date().toISOString()
    };

    try {
      const docRef = await addDoc(collection(db, "saved_prompts"), payload);
      toast.success("Szablon został pomyślnie zapisany w chmurze Fortecy!");
      setTitle("");
      fetchSavedTemplates(user.uid);
      setActiveTab("presets");
    } catch (err) {
      try {
        handleFirestoreError(err, "create", "saved_prompts");
      } catch (authErr: any) {
        toast.error("Brak uprawnień or błąd bazy: " + authErr.message);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Czy na pewno chcesz usunąć ten szablon z bazy?")) return;
    try {
      await deleteDoc(doc(db, "saved_prompts", id));
      toast.success("Usunięto szablon.");
      if (user) fetchSavedTemplates(user.uid);
    } catch (err) {
      try {
        handleFirestoreError(err, "delete", `saved_prompts/${id}`);
      } catch (authErr: any) {
        toast.error("Błąd usuwania: " + authErr.message);
      }
    }
  };

  const loadTemplate = (p: Omit<SavedPrompt, "id">) => {
    setTemplate(p.promptTemplate);
    const vars = p.variables || [];
    const values: Record<string, string> = {};
    vars.forEach(v => {
      values[v] = "";
    });
    setVariablesValues(values);
    toast.success(`Załadowano szablon: ${p.title}`);
    setActiveTab("edit");
  };

  // Syntax highlighting parser
  const renderHighlightedContent = () => {
    if (!template) {
      return <span className="text-neutral-600 font-mono italic">Wpisz tekst szablonu...</span>;
    }

    // Split template by matches of variables: {{var}}
    const parts = template.split(/(\{\{[^}]+\}\})/g);
    
    // Style/technical words list for contextual categorization
    const keywordsTeal = ["photorealistic", "ultra-realistic", "hyper-detailed", "realism", "realistic", "microshot", "astrolabe", "macro shot", "portrait"];
    const keywordsBlue = ["style", "art", "cinematic", "film", "glow", "backlighting", "golden hour", "refraction", "vortex", "continuous", "orbit", "volumetric", "neon"];
    const keywordsEmerald = ["85mm", "unreal engine 5", "unreal engine", "8k", "4k", "hdr", "1080p", "render", "resolution", "3D camera", "slow-motion"];

    return (
      <div className="font-mono text-xs leading-relaxed whitespace-pre-wrap select-text break-words">
        {parts.map((part, idx) => {
          if (part.startsWith("{{") && part.endsWith("}}")) {
            const varName = part.slice(2, -2).trim();
            const filledValue = variablesValues[varName];
            return (
              <span 
                key={idx} 
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/40 text-amber-400 font-bold mx-0.5 animate-pulse"
                title={`Klucz zmiennej: ${varName}`}
              >
                <Braces size={10} className="text-amber-500" />
                {filledValue ? `${varName}: "${filledValue}"` : `{{${varName}}}`}
              </span>
            );
          }

          // Render with subtoken checks for adjectives/specifiers
          const words = part.split(/(\s+)/g);
          return (
            <span key={idx}>
              {words.map((word, wIdx) => {
                const cleanWord = word.toLowerCase().replace(/[^a-z0-9-]/g, "");
                
                if (keywordsEmerald.includes(cleanWord)) {
                  return (
                    <span key={wIdx} className="text-emerald-400 font-bold border-b border-dashed border-emerald-500/20" title="Parametr Techniczny">
                      {word}
                    </span>
                  );
                }
                if (keywordsBlue.includes(cleanWord)) {
                  return (
                    <span key={wIdx} className="text-cyan-400 font-medium" title="Klucz Estetyczny">
                      {word}
                    </span>
                  );
                }
                if (keywordsTeal.includes(cleanWord)) {
                  return (
                    <span key={wIdx} className="text-teal-400" title="Styl / Tekstura">
                      {word}
                    </span>
                  );
                }
                return <span key={wIdx} className="text-neutral-300">{word}</span>;
              })}
            </span>
          );
        })}
      </div>
    );
  };

  const currentVariables = extractVariables(template);

  return (
    <div className="bg-neutral-900/45 rounded-2xl border border-neutral-800 p-4 space-y-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-neutral-850 pb-3">
        <div className="flex items-center gap-2">
          <Code2 className="text-rose-500" size={16} />
          <div>
            <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              Zaawansowany Edytor Promptów Q-{generationType === 'image' ? 'IMAGEN' : 'VEO'}
            </h4>
            <p className="text-[10px] text-neutral-500 font-sans mt-0.5">
              Używaj <code className="text-amber-400 font-mono font-bold bg-neutral-950/80 px-1 py-0.2 rounded">{"{{zmienna}}"}</code> aby tworzyć szablony i wypisywać ich wartości dynamicznie.
            </p>
          </div>
        </div>

        {/* Mały przełącznik kart wewnątrz edytora */}
        <div className="flex bg-neutral-950/80 rounded-lg p-0.5 border border-neutral-850">
          <button
            type="button"
            onClick={() => setActiveTab("edit")}
            className={`px-2.5 py-1 text-[10px] font-mono font-bold uppercase rounded-md transition-colors cursor-pointer ${
              activeTab === "edit"
                ? "bg-rose-500/10 text-rose-400"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Edytor & Szablon
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("presets")}
            className={`px-2.5 py-1 text-[10px] font-mono font-bold uppercase rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "presets"
                ? "bg-amber-500/10 text-amber-400"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <FolderOpen size={10} /> Presety
            {(savedTemplates.length > 0) && (
              <span className="bg-amber-500/20 text-amber-300 text-[8px] font-mono h-4 px-1 rounded-full flex items-center justify-center font-bold">
                {savedTemplates.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "edit" ? (
          <div className="space-y-4">
            {/* Pole wejściowe edytora */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1">
                  <Braces size={10} className="text-amber-500" /> Wpisz Szablon Główny
                </span>
                
                {/* Opcja szybkiego czyszczenia */}
                <button
                  type="button"
                  onClick={() => {
                    setTemplate("");
                    setVariablesValues({});
                  }}
                  className="text-[10px] text-neutral-500 hover:text-white font-mono uppercase cursor-pointer"
                >
                  Wyczyść
                </button>
              </div>

              <textarea
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                rows={4}
                className="w-full text-xs font-mono rounded-lg bg-neutral-950 border border-neutral-850 p-3 placeholder-neutral-700 focus:outline-none focus:ring-1 focus:ring-neutral-700 text-neutral-200 leading-relaxed font-semibold"
                placeholder="Np. A professional portrait photo of a {{gender}} astronaut, styled in {{color}} colors, highly-detailed vray render, 8k..."
              />
            </div>

            {/* Wizualny Syntax Highlighter z Podświetlaniem Składni */}
            <div className="bg-neutral-950/80 rounded-xl p-3 border border-neutral-850 space-y-2 relative overflow-hidden">
              <div className="absolute top-2 right-2 text-[9px] font-mono font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-500 flex items-center gap-1">
                <Eye size={10} /> LIVE SYNTAX HIGHLIGHTING
              </div>
              
              <div className="pb-1 border-b border-neutral-900">
                <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest block">
                  Podgląd kolorów i struktur:
                </span>
              </div>
              
              <div className="max-h-40 overflow-y-auto pt-1 pr-1 custom-scrollbar">
                {renderHighlightedContent()}
              </div>

              <div className="flex gap-3 pt-1 border-t border-neutral-900 text-[9px] font-mono text-neutral-500 uppercase">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500/20 border border-amber-500/40 inline-block" /> Zmienne
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-cyan-500/20 border border-cyan-500/40 inline-block" /> Estetyka
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500/20 border border-emerald-500/40 inline-block" /> Parametry techniczne
                </div>
              </div>
            </div>

            {/* Panel zmiennych: if dynamically detected */}
            {currentVariables.length > 0 && (
              <div className="bg-neutral-950/20 border border-neutral-850 p-3 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
                  <span className="text-[10px] font-mono font-bold text-amber-500 uppercase flex items-center gap-1.5">
                    <Sparkles size={11} className="animate-spin text-amber-500" /> Zmienne Wykryte w Szablonie ({currentVariables.length})
                  </span>
                  <span className="text-[9px] font-mono text-neutral-500 uppercase">Wprowadź wartości poniżej</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {currentVariables.map((vName) => (
                    <div key={vName} className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-neutral-450 uppercase flex items-center gap-1">
                        <Braces size={10} className="text-amber-500" /> {vName}
                      </label>
                      <input
                        type="text"
                        value={variablesValues[vName] || ""}
                        onChange={(e) => setVariablesValues({ ...variablesValues, [vName]: e.target.value })}
                        placeholder={`Podstaw za {{${vName}}}`}
                        className="w-full text-xs bg-neutral-950 border border-neutral-850 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-rose-500/30 text-white"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sekcja Zapisywania / Eksportowania Szablonu */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end pt-1">
              {/* Szybki formularz zapisu pod spodem */}
              <div className="md:col-span-7 space-y-1">
                <label className="text-[9px] font-mono font-bold text-neutral-500 uppercase tracking-widest block">
                  Zapisz ten szablon do Firebase
                </label>
                <div className="flex bg-neutral-950 border border-neutral-850 rounded-lg overflow-hidden p-0.5">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Wpisz unikalną nazwę szablonu..."
                    className="flex-1 text-xs bg-transparent px-2 focus:outline-none text-white placeholder-neutral-600 font-sans"
                  />
                  <button
                    type="button"
                    onClick={handleSaveTemplate}
                    disabled={isSaving}
                    className="bg-neutral-900 border border-neutral-800 text-amber-400 hover:text-white px-3 py-1.5 rounded-md text-[10px] font-mono font-bold uppercase transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    {isSaving ? <Loader2 size={10} className="animate-spin" /> : <Save size={10} />}
                    Zapisz
                  </button>
                </div>
              </div>

              {/* Przycisk zastosowania skompilowanego promptu */}
              <div className="md:col-span-5">
                <button
                  type="button"
                  onClick={() => {
                    onApplyPrompt(compiledPrompt);
                    toast.success("Skorzystano ze skompilowanego promptu!", {
                      description: "Wypełnione słowa zostały wstrzyknięte do głównego generatora."
                    });
                  }}
                  className="w-full bg-rose-500 hover:bg-rose-400 text-white border border-rose-500/20 text-xs font-mono font-bold uppercase rounded-lg py-2.5 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98"
                >
                  <Wand2 size={12} /> Zastosuj Skompilowany
                </button>
              </div>
            </div>

            {/* Skompilowany podgląd tekstu w małym boksie */}
            <div className="bg-neutral-950/30 rounded-xl p-2.5 border border-dashed border-neutral-850 space-y-1">
              <span className="text-[9px] font-mono text-neutral-500 uppercase block tracking-wider">
                Ostateczny Kompilat Gotowy Do Generowania:
              </span>
              <p className="text-[11px] font-sans text-neutral-400 italic break-words leading-relaxed select-all cursor-copy" title="Kliknij dwukrotnie, aby zaznaczyć">
                {compiledPrompt || "Brak promptu..."}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Lista szablonów zapisanych w Firebase i wbudowanych presetów */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-900 pb-1.5">
                <span className="text-[10px] font-mono font-bold text-amber-500 uppercase flex items-center gap-1">
                  <FolderOpen size={10} /> Aktywne Szablony w Twojej Chmurze
                </span>
                <span className="text-[9px] text-neutral-500 font-mono">
                  {user ? `UID: ${user.uid.slice(0, 6)}...` : "Zaloguj się, aby zsynchronizować"}
                </span>
              </div>

              {isLoading ? (
                <div className="py-8 text-center flex flex-col items-center justify-center gap-2">
                  <Loader2 className="animate-spin text-amber-500" size={20} />
                  <span className="text-xs text-neutral-500 font-mono">Trwa odpytywanie bazy danych Firestore...</span>
                </div>
              ) : savedTemplates.length === 0 ? (
                <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-850 text-center space-y-1.5">
                  <AlertCircle size={14} className="mx-auto text-amber-500" />
                  <p className="text-xs text-neutral-400 font-medium">Brak własnych szablonów w chmurze</p>
                  <p className="text-[9px] text-neutral-500 max-w-xs mx-auto">
                    Stwórz własny szablon w zakładce obok z użyciem zmiennych i nazwij go, aby zapisać go trwale w bazie Firestore.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                  {savedTemplates.map((item) => (
                    <div 
                      key={item.id}
                      className="group border border-neutral-850 hover:border-neutral-750 bg-neutral-950/80 p-3 rounded-lg flex flex-col justify-between hover:bg-neutral-950 transition-all text-left"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-bold text-white uppercase tracking-wide truncate">{item.title}</h5>
                          
                          {/* Przycisk usuwania z bazy */}
                          <button
                            type="button"
                            onClick={() => handleDeleteTemplate(item.id)}
                            className="text-neutral-600 hover:text-rose-500 transition-colors p-1"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                        <p className="text-[10px] text-neutral-500 mt-1 line-clamp-2 italic leading-relaxed">
                          {item.promptTemplate}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-900">
                        {item.variables.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {item.variables.map((v) => (
                              <span key={v} className="bg-amber-500/10 text-amber-400 text-[8px] font-mono font-bold px-1 py-0.5 rounded border border-amber-500/20">
                                {v}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[8px] text-neutral-600 font-mono tracking-widest uppercase">Zwykły Prompt</span>
                        )}

                        <button
                          type="button"
                          onClick={() => loadTemplate(item)}
                          className="text-[10px] text-amber-400 hover:text-amber-300 font-mono font-bold uppercase transition-colors cursor-pointer"
                        >
                          Załaduj &rarr;
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Wbudowane standardowe presety (Zawsze dostępne jako seed) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-1 border-b border-rose-950/30 pb-1.5">
                <Sparkles className="text-rose-500" size={12} />
                <span className="text-[10px] font-mono font-bold text-neutral-450 uppercase">
                  Wbudowane Biblioteki Startowe (Zalecane Presety Fortecy)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {STARTER_TEMPLATES
                  .filter(st => st.generationType === generationType)
                  .map((starter, idx) => (
                    <div 
                      key={idx}
                      className="border border-neutral-850 hover:border-neutral-800 bg-neutral-950/40 p-3 rounded-lg flex flex-col justify-between hover:bg-neutral-950/80 transition-all text-left"
                    >
                      <div>
                        <h5 className="text-xs font-bold text-neutral-300 uppercase tracking-wide truncate">{starter.title}</h5>
                        <p className="text-[10px] text-neutral-500 mt-1 line-clamp-2 italic leading-relaxed">
                          {starter.promptTemplate}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-900">
                        <div className="flex flex-wrap gap-1">
                          {starter.variables.map((v) => (
                            <span key={v} className="bg-rose-500/10 text-rose-400 text-[8px] font-mono px-1 py-0.5 rounded border border-rose-500/20">
                              {v}
                            </span>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() => loadTemplate(starter)}
                          className="text-[10px] text-rose-400 hover:text-rose-350 font-mono font-bold uppercase transition-colors cursor-pointer"
                        >
                          Załaduj &rarr;
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
