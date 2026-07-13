import { EventEmitter } from 'node:events';

export type QueueJob<T> = {
  id: string;
  type: string;
  payload: T;
  createdAt: number;
};

export class InMemoryTaskQueue<T> {
  private readonly jobs: QueueJob<T>[] = [];
  private readonly emitter = new EventEmitter();
  private readonly concurrency = 1;
  private active = 0;

  constructor(private readonly handler: (job: QueueJob<T>) => Promise<void>) {}

  enqueue(job: Omit<QueueJob<T>, 'id' | 'createdAt'>): string {
    const id = `${job.type}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    this.jobs.push({
      ...job,
      id,
      createdAt: Date.now(),
    });
    this.emitter.emit('enqueued', id);
    void this.drain();
    return id;
  }

  async drain(): Promise<void> {
    if (this.active >= this.concurrency) {
      return;
    }

    const next = this.jobs.shift();
    if (!next) {
      return;
    }

    this.active += 1;
    try {
      await this.handler(next);
    } catch (error) {
      console.error('[QUEUE ERROR]', error);
    } finally {
      this.active -= 1;
      if (this.jobs.length > 0) {
        void this.drain();
      }
    }
  }

  on(event: 'enqueued', listener: (jobId: string) => void): this {
    this.emitter.on(event, listener);
    return this;
  }
}
