import { GoogleGenAI } from "@google/genai";

export async function generateAIContentWithFallback(
  arg1: any,
  arg2?: any
): Promise<any> {
  let aiInstance: GoogleGenAI;
  let params: any;

  // Detect call signature
  if (arg1 instanceof GoogleGenAI || (arg1 && typeof arg1 === 'object' && arg1.models)) {
    // Called as: generateAIContentWithFallback(ai, params)
    aiInstance = arg1;
    params = arg2;
  } else if (typeof arg1 === 'string') {
    // Called as: generateAIContentWithFallback(prompt)
    const apiKey = process.env.GEMINI_API_KEY || "";
    aiInstance = new GoogleGenAI({ apiKey });
    params = { contents: arg1 };
  } else {
    // Called as: generateAIContentWithFallback(params)
    const apiKey = process.env.GEMINI_API_KEY || "";
    aiInstance = new GoogleGenAI({ apiKey });
    params = arg1;
  }

  const models = [
    "gemini-2.5-flash",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b"
  ];

  let lastError: any = null;

  for (const modelName of models) {
    try {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[AI SERVICE] Trying model ${modelName}...`);
      }
      
      const callParams = { ...params, model: modelName };
      
      // Map top-level config parameters (systemInstruction, tools, generationConfig)
      // to the config sub-object required by google-genai SDK
      const config: any = { ...(callParams.config || {}) };
      
      if (callParams.systemInstruction) {
        config.systemInstruction = callParams.systemInstruction;
        delete callParams.systemInstruction;
      }
      if (callParams.tools) {
        config.tools = callParams.tools;
        delete callParams.tools;
      }
      if (callParams.generationConfig) {
        config.generationConfig = callParams.generationConfig;
        delete callParams.generationConfig;
      }
      
      if (Object.keys(config).length > 0) {
        callParams.config = config;
      }
      
      const response = await aiInstance.models.generateContent(callParams);
      
      // If called with a simple prompt string, return the text property.
      // Otherwise, return the full response object so callers can inspect candidates/parts/etc.
      if (typeof arg1 === 'string' && !arg2) {
        if (response && response.text) {
          return response.text;
        }
      }
      return response;
    } catch (err: any) {
      lastError = err;
      console.warn(`[AI SERVICE] Warning: Model ${modelName} failed. Error: ${err?.message || err}`);
    }
  }

  console.error(`[AI SERVICE] Fatal: All models failed in fallback chain.`);
  throw lastError || new Error("All fallback models failed.");
}

