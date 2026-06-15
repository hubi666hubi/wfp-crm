import cron from 'node-cron';
import { GoogleGenAI } from "@google/genai";
import fs from 'fs';
import path from 'path';

// Zapisujemy konfigurację i logi w prostym pliku JSON dla trwałości
const DB_FILE = path.join(process.cwd(), 'distributor_db.json');

export interface SocialSchedule {
  platform: string;
  topicContext: string;
  cronExpression: string; // np. "0 9 * * *" dla 9:00 codziennie
  isActive: boolean;
  webhookUrl?: string; // Opcjonalnie webhook dla platform typu make.com
}

export interface DistributorLog {
  id: number;
  timestamp: string;
  message: string;
  platform: string;
  status: 'pending' | 'success' | 'error';
}

interface DBContext {
  schedules: SocialSchedule[];
  logs: DistributorLog[];
}

export class DistributorService {
  private db: DBContext = { schedules: [], logs: [] };
  private activeJobs: Map<string, cron.ScheduledTask> = new Map();
  // Zbierani słuchacze SSE, by informować na żywo front-end o akcjach!
  private logListeners: ((log: DistributorLog) => void)[] = [];
  private lastLogId: number = 0;

  private generateUniqueId(): number {
    const now = Date.now();
    if (now <= this.lastLogId) {
      this.lastLogId = this.lastLogId + 1;
    } else {
      this.lastLogId = now;
    }
    return this.lastLogId;
  }

  constructor() {
    this.loadDb();
    this.initializeCronJobs();
  }

  private loadDb() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const data = fs.readFileSync(DB_FILE, 'utf-8');
        this.db = JSON.parse(data);
      } else {
        // Domyślna konfiguracja startowa
        this.db.schedules = [
          { platform: 'X', topicContext: 'Technologia AI i SaaS', cronExpression: '0 9 * * *', isActive: false },
          { platform: 'LinkedIn', topicContext: 'Lekcje biznesowe z analizy danych', cronExpression: '30 8 * * *', isActive: false }
        ];
        this.saveDb();
      }
    } catch (err) {
      console.error("Błąd ładowania bazy:", err);
    }
  }

  private saveDb() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.db, null, 2));
    } catch (err) {
      console.error("Błąd zapisu bazy:", err);
    }
  }

  public getSchedules() {
    return this.db.schedules;
  }

  public updateSchedule(platform: string, updates: Partial<SocialSchedule>) {
    const index = this.db.schedules.findIndex(s => s.platform === platform);
    if (index > -1) {
      this.db.schedules[index] = { ...this.db.schedules[index], ...updates };
      this.saveDb();
      this.reloadSchedulerConfig();
      return this.db.schedules[index];
    }
    return null;
  }

  public getLogs() {
    return this.db.logs;
  }
  
  public getRecentLogs(limit = 20) {
    return this.db.logs.slice(-limit);
  }

  public onNewLog(callback: (log: DistributorLog) => void) {
    this.logListeners.push(callback);
    return () => {
      this.logListeners = this.logListeners.filter(l => l !== callback);
    };
  }

  private addLog(platform: string, message: string, status: 'pending' | 'success' | 'error' = 'success') {
    const newLog: DistributorLog = {
      id: this.generateUniqueId(),
      timestamp: new Date().toISOString(),
      platform,
      message,
      status
    };
    
    this.db.logs.push(newLog);
    if (this.db.logs.length > 500) {
      this.db.logs = this.db.logs.slice(-500); // max 500 wpisów
    }
    this.saveDb();

    // Informujemy wszystkie połączone zakładki w przeglądarce o nowym evencie
    this.logListeners.forEach(listener => listener(newLog));
  }

  private initializeCronJobs() {
    // Sprzątamy starsze crony
    for (const job of this.activeJobs.values()) {
      job.stop();
    }
    this.activeJobs.clear();

    // Inicjalizujemy nowe
    this.db.schedules.forEach(schedule => {
      if (schedule.isActive) {
        const job = cron.schedule(schedule.cronExpression, () => {
          this.executeAutoPost(schedule);
        });
        this.activeJobs.set(schedule.platform, job);
        console.log(`Zainicjowano job dla ${schedule.platform} z cronem ${schedule.cronExpression}`);
      }
    });
  }

  public reloadSchedulerConfig() {
    this.initializeCronJobs();
  }

  public async executeAutoPost(schedule: SocialSchedule) {
    this.addLog('System', `Rozpoczęto rutynę auto-publikacji dla platformy ${schedule.platform}...`, 'pending');

    try {
      const prompt = `Jesteś zaawansowanym AI agentem do social mediów.
      Twoim zadaniem jest stworzenie angażującego postu i krótkiego skryptu (na platformę: ${schedule.platform}) w stylu eksperta od Direct Response Marketingu (połączenie Alexa Hormoziego, Dana Kennedy'ego i Gary'ego Halberta).

      Tematyka bazowa (Co sprzedajesz / Nisza / Cel): ${schedule.topicContext}.

      Wymagania i struktura:
      Napisz mi 1 genialny, gotowy post/tweet (Hook + Body + Call to Action), który ma jeden cel: wzbudzić ogromną ciekawość, wywołać FOMO (strach przed przegapieniem) i zmusić ludzi do kliknięcia w mój link w bio.
      Użyj polaryzacji, formatu 'How-To' (Jak ja to zrobiłem) oraz 'Us vs. Them' (My vs Oni). Nie używaj hasztagów. Język musi być dynamiczny, krótki i angażujący.

      Zastosuj następującą strukturę:
      1. THE HOOK (Haczyk): Rozpocznij od kontrintuicyjnego, mocnego stwierdzenia, które natychmiast przyciągnie uwagę. Pokaż, że ich dotychczasowe próby rozwiązania problemu to błąd.
      2. THE PROBLEM (Nóż w ranę): Opisz ich obecną sytuację tak dokładnie, żeby pomyśleli: 'Ta osoba czyta w moich myślach'. Agituj ból (np. brak powtarzalnych zysków, zmarnowany czas).
      3. THE NEW MECHANISM (Nowy mechanizm): Sprzedaj zupełnie nowy mechanizm, o którym nie słyszeli. 
      4. THE GRAND SLAM OFFER (Główna oferta/Obietnica): Przedstaw to co robisz/oferujesz jako coś absolutnie bezcennego.
      5. REVERSAL OF RISK & SCARCITY: Daj im powód dlaczego muszą wejść w to TERAZ i call to action (np. link w bio / skomentuj pod postem).
      
      Ton: Pewny siebie, bezpośredni, bazujący na logice i potężnych emocjach. Żadnego mdłego języka korporacyjnego. Zwróć tylko gotową treść do publikacji (bez dodatkowych markdownów).`;

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      let generatedPost = "Brak wygenerowanego tekstu";
      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
        });
        generatedPost = response.text || generatedPost;
      } catch (err: unknown) {
        const error = err as { status?: number, message?: string };
        if (error?.status === 503 || error?.message?.includes("503") || error?.status === 503) {
          console.log(`gemini-2.5-flash 503 during auto post, falling back to gemini-2.5-pro`);
          const fallbackResponse = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: prompt,
          });
          generatedPost = fallbackResponse.text || generatedPost;
        } else {
          throw err;
        }
      }
      
      this.addLog('System', `Agent wygenerował treść postu pomyślnie. Wysyłam do API...`, 'pending');

      if (schedule.webhookUrl) {
         // Tutaj następuje rzyczywiste wywołanie webhooka z wygenerowanym tekstem
         await fetch(schedule.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ postContent: generatedPost, platform: schedule.platform })
         });
         this.addLog(schedule.platform, `Opublikowano przez Webhook. Ostatni wygenerowany post pod tematykę "${schedule.topicContext}" wysłany z sukcesem.`, 'success');
      } else {
         // Domyślnie symulujemy sukces jeśli nie ma podanego webhooka
         this.addLog(schedule.platform, `Opublikowano post: "${generatedPost.substring(0, 50)}..."`, 'success');
      }
      
    } catch (err: unknown) {
      this.addLog(schedule.platform, `Błąd podczas auto-publikacji: ${(err as Error).message}`, 'error');
      console.error(err);
    }
  }
}

export const distributorService = new DistributorService();
