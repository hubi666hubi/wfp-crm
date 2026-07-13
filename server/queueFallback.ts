export interface BullJob<T = any> {
  id?: string;
  name: string;
  data: T;
}

/**
 * Lightweight in-memory fallback that exposes the same minimal API as the
 * real BullTaskQueue used by the server. This allows enabling USE_BULL without
 * requiring Redis or installing bullmq in constrained environments.
 */
export class BullTaskQueue<T = any> {
  private jobs: Array<{ id: string; name: string; data: T }> = [];
  private handler?: (job: { id: string; name: string; data: T }) => Promise<void>;
  private running = false;
  private concurrency = 1;
  private active = 0;

  constructor(private readonly queueName = 'fallback-queue', private readonly redisUrl?: string) {
    console.warn('⚠️ Using in-memory Bull fallback. This simulates Bull behavior without Redis.');
  }

  async enqueue(job: BullJob<T>, _opts?: Record<string, unknown>): Promise<string> {
    const id = job.id ?? `${job.name}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    this.jobs.push({ id, name: job.name, data: job.data });
    // kick the processor
    void this.maybeProcess();
    return id;
  }

  process(concurrency: number, handler: (job: { id: string; name: string; data: T }) => Promise<void>): void {
    this.handler = handler;
    this.concurrency = Math.max(1, concurrency || 1);
    if (!this.running) {
      this.running = true;
      void this.maybeProcess();
    }
  }

  private async maybeProcess(): Promise<void> {
    if (!this.handler) return;
    if (this.active >= this.concurrency) return;
    const job = this.jobs.shift();
    if (!job) return;
    this.active += 1;
    try {
      await this.handler({ id: job.id, name: job.name, data: job.data });
    } catch (err) {
      console.error('[FALLBACK QUEUE] job handler error', err);
    } finally {
      this.active -= 1;
      // schedule next tick
      setImmediate(() => void this.maybeProcess());
    }
  }

  async close(): Promise<void> {
    this.running = false;
    this.jobs = [];
    this.handler = undefined;
  }
}
