import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { GoogleGenAI } from '@google/genai';
import { getDb } from '../../db.js'; // Pobranie bezpiecznej instancji bazy danych z jądra
import nodemailer from 'nodemailer';

export interface WatchdogConfig {
  maxBackups: number;
  rateLimitRpm: number;
  targetFilePath: string;
}

/**
 * ELITARNY DEMON AUTOMATYZACJI I RETENCJI KODU OMEGA PRO v5.0
 * Działa 24/7 w celu maksymalizacji konwersji i ciągłej optymalizacji infrastruktury.
 */
export class AlphaWatchdogCore {
  private ai: GoogleGenAI;
  private config: WatchdogConfig;
  private isLoopActive: boolean = true;
  private lastExecutionTime: number = 0;

  constructor(config?: Partial<WatchdogConfig>) {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
    this.config = {
      maxBackups: config?.maxBackups || 5, // Trzymanie dokładnie 5 najnowszych kopii bazowych
      rateLimitRpm: config?.rateLimitRpm || 45,
      targetFilePath: config?.targetFilePath || path.resolve(process.cwd(), 'server.ts')
    };
  }

  /**
   * MECHANIZM ROTACJI I RETENCJI PLIKÓW .BAK
   * Sortuje kopie zapasowe temporalnie i usuwa nadmiarowe, chroniąc przestrzeń dyskową.
   */
  public rotateAndCleanBackups(): void {
    const backupDir = path.resolve(process.cwd(), 'system_backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
      return;
    }

    try {
      const filename = path.basename(this.config.targetFilePath);
      const files = fs.readdirSync(backupDir);
      
      // Filtrowanie plików według precyzyjnego wzorca temporalnego
      const backupPattern = new RegExp(`^${escapeRegExp(filename)}\\.\\d{8}_\\d{6}\\.bak$`);
      const matchingBackups = files.filter(f => backupPattern.test(f));

      // Sortowanie od najstarszych do najświeższych według czasu modyfikacji
      matchingBackups.sort((a, b) => {
        return fs.statSync(path.join(backupDir, a)).mtimeMs - fs.statSync(path.join(backupDir, b)).mtimeMs;
      });

      // Usuwanie starych migawek ponad ustalony limit retencji (R5)
      while (matchingBackups.length > this.config.maxBackups) {
        const oldestBackup = matchingBackups.shift();
        if (oldestBackup) {
          fs.unlinkSync(path.join(backupDir, oldestBackup));
          console.log(`\x1b[33m[RETENCJA] ♻️ Usunięto przestarzałą migawkę kodu źródłowego: ${oldestBackup}\x1b[0m`);
        }
      }
    } catch (err: any) {
      console.error(`[RETENCJA ERROR] Awaria podsystemu czyszczenia kopii: ${err.message}`);
    }
  }

  /**
   * URUCHOMIENIE CIĄGŁEGO STRAŻNIKA (CONTINUOUS SWARM NODE)
   */
  public async startContinuousProtectionLoop(): Promise<void> {
    console.log("\x1b[31m====================================================\x1b[0m");
    console.log(" 🪐 DEMON OMEGA WATCHDOG AKTYWOWANY W TRYBIE 24/7");
    console.log(` > Lokalizacja jądra: ${this.config.targetFilePath}`);
    console.log("====================================================\x1b[0m");

    const delayBetweenTicks = (60.0 / this.config.rateLimitRpm) * 1000;

    while (this.isLoopActive) {
      try {
        const currentTime = Date.now();
        const elapsed = currentTime - this.lastExecutionTime;

        if (elapsed < delayBetweenTicks) {
          await new Promise(resolve => setTimeout(resolve, delayBetweenTicks - elapsed));
        }

        // Wykonanie cyklu czyszczenia i kontroli stanu dyskowego
        this.rotateAndCleanBackups();
        this.lastExecutionTime = Date.now();

        // Bezpieczny, nieblokujący interwał uśpienia wątku głównego
        await new Promise(resolve => setTimeout(resolve, 15000));
      } catch (err: any) {
        console.error(`🚨 [WATCHDOG LOOP ERROR]: ${err.message}. Restartowanie dautonomicznego potoku za 5s...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
