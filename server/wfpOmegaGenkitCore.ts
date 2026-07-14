import { GoogleGenAI, Type, Schema } from "@google/genai";
import { getDb } from "./db.js";
import { stripeKombajnDistributor } from "./stripeKombajnDistributor.js";
import { spawn } from "child_process";
import path from "path";

export interface AgentTaskPayload {
  leadId: string;
  companyName: string;
  detectedPain: string;
  userEmail: string;
}

/**
 * ZAAWANSOWANE JĄDRO AGENTYWNE WFP OMEGA MATRIX (GENKIT & DOCKER RUNTIME)
 * Zarządza wieloetapową syntezą, klonowaniem awatarów oraz zabezpieczeniem stanów 24/7.
 */
export class WFPOmegaGenkitCore {
  private ai: GoogleGenAI;
  private projectRoot: string = process.env.PROJECT_ROOT || process.cwd();

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  }

  /**
   * CYLINDER 01: INTELIGENTNA SYNTEZA MATRYCY KOPII (STRICT SCHEMA ENFORCEMENT)
   */
  public async generateAutonomousScript(companyName: string, pain: string): Promise<any> {
    const prompt = `Zbuduj uderzeniowy scenariusz wideo VSL (口播) dla firmy: ${companyName}. Główny ból operacyjny: ${pain}. Wygeneruj unikalny, dopaminowy haczyk (Hook).`;

    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        videoTitle: { type: Type.STRING },
        scriptContent: { type: Type.STRING },
        voiceSpeed: { type: Type.NUMBER },
        fontColor: { type: Type.STRING }
      },
      required: ["videoTitle", "scriptContent", "voiceSpeed", "fontColor"]
    };

    // Kaskadowy mechanizm rotacji modeli odporny na błędy limitów (Rate-Limits)
    const models = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-3.1-flash-lite"];
    
    for (const modelName of models) {
      try {
        const response = await this.ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction: "Jesteś elitarnym botem generującym skrypty konwersji w formacie JSON dla cyfrowych ludzi. Nie używaj markdownu.",
            responseMimeType: "application/json",
            responseSchema: responseSchema
          }
        });

        if (response && response.text) {
          return JSON.parse(response.text.trim());
        }
      } catch (err) {
        console.warn(`⚠️ [SWARM MATRIX]: Węzeł ${modelName} przeciążony. Przerzut awaryjny...`);
      }
    }
    throw new Error("Wszystkie darmowe i płatne modele w łańcuchu kaskady uległy awarii.");
  }

  /**
   * CYLINDER 02: ORKIESTRACJA SYSTEMU AGENTYWNEGO (LIVE EXECUTION)
   * Pobiera paczkę, tworzy wpis w relacyjnej bazie i odpala asynchroniczny proces Lip-Sync.
   */
  public async processAgentWorkerTask(payload: AgentTaskPayload): Promise<boolean> {
    console.log(`\x1b[35m[AGENTYWNE JĄDRO] 🪐 Rozpoczynam procedurę ewolucyjną dla ${payload.companyName}...\x1b[0m`);
    const db = getDb();
    const taskId = `TASK-${Date.now()}`;

    try {
      // 1. Wywołanie Cylindra Syntezy AI
      const aiScript = await this.generateAutonomousScript(payload.companyName, payload.detectedPain);
      console.log(`🟢 [AI SYNTHESIS SUCCESS]: Wygenerowano tytuł: ${aiScript.videoTitle}`);

      // 2. Transakcyjny zapis zadania do tabeli i schematu SQL (Firebase Firestore Connect)
      await db.collection("tasks").doc(taskId).set({
        id: taskId,
        name: aiScript.videoTitle,
        startTime: new Date().toISOString(),
        status: 0, // Generowanie w toku
        result: "Inicjalizacja środowiska Conda / Hubert"
      });

      // Zapis szczegółów konfiguracji wideo (short_video_details)
      const detailId = Math.floor(Math.random() * 100000);
      await db.collection("short_video_details").doc(String(detailId)).set({
        id: detailId,
        user_id: payload.userEmail,
        video_title: aiScript.videoTitle,
        script_content: aiScript.scriptContent,
        video_layout: 2, // Pionowy kadr (Shorts/Reels)
        resolution: 3, // 1080p Full HD
        export_format: 1, // MP4
        voice_speed: aiScript.voiceSpeed,
        font_color: aiScript.fontColor
      });

      // 3. Asynchroniczne wywołanie zewnętrznego skryptu Pythona przez child_process do klonowania w tle
      const externalScriptPath = path.join(this.projectRoot, "backend", "app", "services", "unified_auto_worker.py");
      
      const pyProcess = spawn("python", [externalScriptPath], { shell: true });
      
      pyProcess.stdout.on("data", (data) => {
        console.log(`[AUTO WORKER EXECUTION]: ${data.toString().trim()}`);
      });

      // 4. Aktualizacja stanu w bazie po pomyślnym przekazaniu do kolejki RAM
      await db.collection("tasks").doc(taskId).update({
        status: 1, // Ukończono
        endTime: new Date().toISOString(),
        result: `Pomyślnie wyemitowano wideo VSL. Przypisano szczegóły o ID: ${detailId}`
      });

      // 5. Automatyczny zapłon kombajnu finansowego w celu domknięcia sprzedaży i naliczenia zysku
      await stripeKombajnDistributor.triggerHighVelocityProfitCampaign();
      return true;

    } catch (error: any) {
      console.error(`\x1b[31m🚨 [AGENTYWNY BLAD KRYTYCZNY]: Awaria potoku: ${error.message}\x1b[0m`);
      
      await db.collection("tasks").doc(taskId).set({
        id: taskId,
        name: "FAILED_AUTONOMOUS_TASK",
        startTime: new Date().toISOString(),
        status: 2, // Awaria / Re-try
        result: error.message
      });
      return false;
    }
  }
}

export const wfpOmegaGenkitCore = new WFPOmegaGenkitCore();
