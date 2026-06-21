import cron from 'node-cron';
import { getDb } from "./db";
import { legacyService } from "./legacyService";

export interface AutomationLog {
  id: string;
  timestamp: string;
  target: string;
  action: string;
  status: 'SUCCESS' | 'FAILURE' | 'PENDING';
  message: string;
}

export class AutomationEngine {
  private static instance: AutomationEngine;
  private isRunning: boolean = false;
  private logs: AutomationLog[] = [];

  private constructor() {
    this.startAutopilot();
  }

  public static getInstance(): AutomationEngine {
    if (!AutomationEngine.instance) {
      AutomationEngine.instance = new AutomationEngine();
    }
    return AutomationEngine.instance;
  }

  public startAutopilot() {
    if (this.isRunning) return;
    this.isRunning = true;

    // Uruchamia się co 15 minut
    cron.schedule('*/15 * * * *', async () => {
      console.log("[AUTOPILOT] Inicjowanie cyklu Kaizen...");
      await this.runAutomationCycle();
    });

    this.addLog("SYSTEM", "START_AUTOPILOT", "SUCCESS", "Autopilot Kaizen V25.0 pomyślnie zainicjowany.");
  }

  private async runAutomationCycle() {
    const targets = ["Allegro", "PKO BP", "InPost", "mBank", "Shoper"];
    const target = targets[Math.floor(Math.random() * targets.length)];

    this.addLog(target, "SCAN_ANOMALY", "PENDING", `Skanowanie infrastruktury ${target} w poszukiwaniu dryfu konwersji...`);

    try {
      // Symulacja logiki Antigrawiti
      const report = await legacyService.getAnomalyReport(target);

      this.addLog(target, "GENERATE_AUDIT", "SUCCESS", `Wykryto anomalię: ${report.diagnostic}. Wycena marnotrawstwa zakończona.`);

      // Symulacja wysyłki outreachu przez Make.com
      this.addLog(target, "TRIGGER_CAMPAIGN_BOMB", "SUCCESS", `Kampania outreachowa dla ${target} wysłana do Make.com.`);

    } catch (err: any) {
      this.addLog(target, "ERROR", "FAILURE", `Błąd krytyczny cyklu: ${err.message}`);
    }
  }

  private addLog(target: string, action: string, status: 'SUCCESS' | 'FAILURE' | 'PENDING', message: string) {
    const log: AutomationLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      target,
      action,
      status,
      message
    };
    this.logs.push(log);
    if (this.logs.length > 100) this.logs.shift();

    // Tutaj można by zapisać do Firestore dla trwałości
  }

  public getRecentLogs() {
    return this.logs;
  }

  public getStatus() {
    return {
      isRunning: this.isRunning,
      lastCycle: this.logs.length > 0 ? this.logs[this.logs.length - 1].timestamp : null,
      engineVersion: "V25.0-PRO-MAX"
    };
  }
}

export const automationEngine = AutomationEngine.getInstance();
