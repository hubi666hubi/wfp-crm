import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { getDb } from "./db.js";
import { stripeKombajnDistributor } from "./stripeKombajnDistributor.js";

export interface AvatarGenerationPayload {
  leadId: string;
  avatarId: string;
  scriptText: string;
  userEmail: string;
}

/**
 * ELITARNY KONTROLER CYFROWYCH KLONÓW WIDEO (GENKIT DIGITAL HUMAN CORE)
 * Automatycznie generuje spersonalizowane wideo VSL z dopasowanym ruchem ust (Lip-Sync) 24/7.
 */
export class DigitalHumanOrchestrator {
  private projectRoot: string = process.env.PROJECT_ROOT || process.cwd();
  private ultralightEnv: string = process.env.ULTRALIGHT_CONDA_ENV || "dh";
  private fishSpeechEnv: string = process.env.FISH_SPEECH_CONDA_ENV || "fish-speech";

  /**
   * CYLINDER SYNTEZY MOWY (FISH-SPEECH GENERATOR)
   */
  private generateVoiceAsset(text: string, outputWavPath: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const fishPath = path.join(this.projectRoot, "external_modules", "fish-speech");
      console.log(`[FISH-SPEECH] Inicjalizacja generowania audio dla tekstu: "${text.substring(0, 30)}..."`);

      // Wywołanie potoku komend wewnątrz środowiska Conda fish-speech
      const args = ["run", "-n", this.fishSpeechEnv, "python", "tools/llama/generate.py", "--text", text, "--checkpoint-path", "checkpoints/fish-speech-1.4"];
      const pyProcess = spawn("conda", args, { cwd: fishPath, shell: true });

      pyProcess.on("close", (code) => {
        if (code === 0) {
          console.log("🟢 [FISH-SPEECH SUCCESS] Plik audio wygenerowany prawidłowo.");
          resolve(true)
        } else {
          reject(new Error(`Fish-Speech zakończył działanie z kodem błędu: ${code}`));
        }
      });
    });
  }

  /**
   * CYLINDER RENDEROWANIA TRANSFORMATYWNEGO (ULTRALIGHT HOT-SWAP)
   */
  public async executeAvatarVideoGeneration(payload: AvatarGenerationPayload): Promise<string> {
    console.log(`\x1b[34m🛸 [DIGITAL HUMAN rozruch]: Generowanie spersonalizowanego wideo dla leada: ${payload.leadId}\x1b[0m`);
    const db = getDb();

    const tempAudioPath = path.join(this.projectRoot, "data", "temp_audio.wav");
    const outputVideoPath = path.join(this.projectRoot, "data", "public", "output", `${payload.leadId}_vsl.mp4`);

    try {
      // 1. Wygenerowanie klonowanego głosu na podstawie skryptu z potoku
      await this.generateVoiceAsset(payload.scriptText, tempAudioPath);

      // 2. Odpalenie silnika renderowania klatek cyfrowego człowieka (Ultralight Mobile Real-Time Node)
      const ultralightPath = path.join(this.projectRoot, "external_modules", "ultralight");
      const avatarDir = path.join(this.projectRoot, "data", "public", "avatar", payload.avatarId);
      const checkpointPath = path.join(avatarDir, "checkpoint", "best.pth");

      const args = [
        "run", "-n", this.ultralightEnv, "python", "inference.py",
        "--asr", "hubert",
        "--dataset", avatarDir,
        "--checkpoint", checkpointPath,
        "--save_path", outputVideoPath
      ];

      await new Promise((resolve, reject) => {
        const renderProcess = spawn("conda", args, { cwd: ultralightPath, shell: true });
        renderProcess.on("close", (code) => code === 0 ? resolve(true) : reject(new Error(`Ultralight błąd: ${code}`)));
      });

      console.log(`\x1b[32m✅ [DIGITAL HUMAN SUCCESS]: Wideo VSL wyrenderowane pomyślnie. Ścieżka: ${outputVideoPath}\x1b[0m`);

      // 3. Atomowe wstrzyknięcie gotowego zasobu wideo do profilu leada w Firebase
      await db.collection("leads").doc(payload.leadId).update({
        status: "Rozmowa w toku",
        generatedVslUrl: `/output/${payload.leadId}_vsl.mp4`,
        vslGeneratedAt: new Date().toISOString()
      });

      // 4. Automatyczne wypchnięcie powiadomienia i uruchomienie kombajnu Stripe
      await stripeKombajnDistributor.triggerHighVelocityProfitCampaign();

      return outputVideoPath;

    } catch (err: any) {
      console.error(`\x1b[31m🚨 [DIGITAL HUMAN FATAL]: Awaria potoku generowania wizerunku: ${err.message}\x1b[0m`);
      
      await db.collection("evolution_logs").add({
        agentId: "Thor-Digital-Human-Engine",
        filePath: "server/digitalHumanOrchestrator.ts",
        success: false,
        score: 0.0,
        patch: { leadTarget: payload.leadId, errorDetails: err.message }
      });

      throw err;
    }
  }
}

export const digitalHumanOrchestrator = new DigitalHumanOrchestrator();
