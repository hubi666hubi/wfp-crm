// ==============================================================================
// APARTAMENT BABILON: HIGH-PERFORMANCE REDIS RESILIENCY MIDDLEWARE & IN-MEMORY QUEUE
// ==============================================================================
import { BullTaskQueue as FallbackQueue } from "./queueFallback";

interface JobPayload {
  patch: any;
  report: any;
  backup_dir?: string;
}

export class ResilientTaskRouter {
  private redisAvailable: boolean = false;
  private memoryQueue: FallbackQueue<JobPayload>;
  private bullQueue: any = null;

  constructor() {
    this.memoryQueue = new FallbackQueue("babilon-suppressed-queue"); // Definicja kolejki awaryjnej w RAM
    this.checkRedisConnectivity();
  }

  private async checkRedisConnectivity(): Promise<void> {
    try {
      const { default: Redis } = await import("ioredis");
      const client = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379", {
        lazyConnect: true,
        enableOfflineQueue: false, // Całkowite wyłączenie kolejkowania offline w celu uniknięcia zalewu wyjątkami
        connectTimeout: 1500,
        maxRetriesPerRequest: 0,
      });
      await client.connect();
      await client.quit();
      
      const { BullTaskQueue } = await import("./queueBull");
      this.bullQueue = new BullTaskQueue("app-queue");
      this.redisAvailable = true;
      console.log("[BABILON] Połączenie z Redis aktywne. Silnik główny uruchomiony.");
    } catch (err: any) {
      this.redisAvailable = false;
      // Całkowite wyciszenie wyjątków i przekierowanie strumienia telemetrycznego do pamięci lokalnej
      console.warn(`[BABILON SUPPRESSION] Redis jest niedostępny. Wygluszenie błędów i przekierowanie ruchu do RAM fallback.`);
    }
  }

  public async routeTask(taskName: string, data: JobPayload): Promise<string> {
    // Dynamiczny routing zadań na podstawie dostępności warstwy bazodanowej Redis
    if (this.redisAvailable && this.bullQueue) {
      try {
        return await this.bullQueue.enqueue({ name: taskName, data });
      } catch (redisError) {
        this.redisAvailable = false;
        console.warn("[BABILON] Błąd krytyczny podczas zapisu w locie do Redis. Awaryjny przerzut do pamięci RAM.");
        return await this.memoryQueue.enqueue({ name: taskName, data });
      }
    } else {
      return await this.memoryQueue.enqueue({ name: taskName, data });
    }
  }

  public process(concurrency: number, handler: (job: any) => Promise<void>): void {
    if (this.redisAvailable && this.bullQueue) {
      this.bullQueue.process(concurrency, handler);
    }
    // Zawsze aktywujemy przetwarzanie na zapasowej strukturze pamięci podręcznej, aby zachować ciągłość
    this.memoryQueue.process(concurrency, handler);
  }
}
