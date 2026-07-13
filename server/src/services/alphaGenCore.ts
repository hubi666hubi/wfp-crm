import { GoogleGenAI, Type, Schema } from "@google/genai";

export interface HighValueTargetJson {
  hook: string;
  painAgitation: string;
  offerCta: string;
}

/**
 * ULTRA-STABILNY GENERATOR STRUKTUR DR (DIRECT RESPONSE)
 * Bezwzględnie wymusza schemat JSON na poziomie jądra Google GenAI.
 */
export async function generateStrictJsonOutreach(companyName: string, painPoints: string[]): Promise<HighValueTargetJson> {
  const apiKey = process.env.GEMINI_API_KEY || "";
  const ai = new GoogleGenAI({ apiKey });
  
  const modelsCascade = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-3.1-flash-lite"];

  const prompt = `Wygeneruj uderzeniowy komunikat marketingowy PAS dla firmy: ${companyName}. Zdiagnozowane słabości: ${painPoints.join(", ")}.`;
  
  const jsonSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      hook: { type: Type.STRING, description: "Mocny, polaryzujący haczyk przyciągający uwagę (Pattern Interrupt)." },
      painAgitation: { type: Type.STRING, description: "Agitacja bólu operacyjnego i marnotrawstwa szmalu." },
      offerCta: { type: Type.STRING, description: "Główna oferta Grand Slam z wezwaniem do natychmiastowego działania." }
    },
    required: ["hook", "painAgitation", "offerCta"]
  };

  let lastError: any = null;

  for (const modelName of modelsCascade) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction: "Jesteś bezwzględnym ekspertem Direct Response Marketingu. Zwracasz wyłącznie poprawny, strukturalny obiekt JSON.",
          responseMimeType: "application/json",
          responseSchema: jsonSchema
        }
      });

      if (response && response.text) {
        return JSON.parse(response.text.trim()) as HighValueTargetJson;
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`\x1b[33m⚠️ [ALPHA GEN]: Węzeł ${modelName} zgłosił błąd. Przerzut kaskadowy...\x1b[0m`);
    }
  }

  throw lastError || new Error("Kaskada wszystkich modeli ratunkowych zakończyła się awarią.");
}
