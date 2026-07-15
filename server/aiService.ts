import { GoogleGenAI } from "@google/genai";

export async function generateAIContentWithFallback(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || "";
  const ai = new GoogleGenAI({ apiKey });
  const models = [
    "gemini-2.5-flash",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b"
  ];

  let lastError: any = null;

  for (const modelName of models) {
    try {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[AI SERVICE] Trying model ${modelName} for prompt...`);
      }
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt
      });
      if (response && response.text) {
        return response.text;
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[AI SERVICE] Warning: Model ${modelName} failed. Error: ${err?.message || err}`);
    }
  }

  console.error(`[AI SERVICE] Fatal: All models failed in fallback chain.`);
  throw lastError || new Error("All fallback models failed.");
}
