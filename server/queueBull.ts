import { Queue, Worker, JobsOptions } from 'bullmq';

export interface BullJob<T = any> {
  id?: string;
  name: string;
  data: T;
}

export class BullTaskQueue<T = any> {
  private queue: Queue;
  private worker?: Worker;

  constructor(private readonly queueName = 'app-queue', private readonly redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379') {
    this.queue = new Queue(this.queueName, { connection: { url: this.redisUrl } });
  }

  async enqueue(job: BullJob<T>, opts?: JobsOptions): Promise<string> {
    const jobRef = await this.queue.add(job.name, job.data, opts || {});
    return jobRef.id as string;
  }

  process(concurrency: number, handler: (job: { id: string; name: string; data: T }) => Promise<void>): void {
    if (this.worker) {
      this.worker.close();
    }

    this.worker = new Worker(
      this.queueName,
      async (job) => {
        try {
          await handler({ id: job.id as string, name: job.name, data: job.data as T });
        } catch (err) {
          console.error('[BULL WORKER ERROR]', err);
          throw err;
        }
      },
      { connection: { url: this.redisUrl }, concurrency }
    );

    this.worker.on('failed', (job, err) => {
      console.warn('[BULL JOB FAILED]', job?.id, err?.message || err);
    });
  }

  async close(): Promise<void> {
    await Promise.all([
      this.worker ? this.worker.close() : Promise.resolve(),
      this.queue ? this.queue.close() : Promise.resolve(),
    ]);
  }
}
