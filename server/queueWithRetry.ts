export interface RetryableJob<T> {
  id: string;
  type: string;
  payload: T;
  attempts: number;
  maxAttempts: number;
  nextAttemptAt: number;
}

export class RetryableQueue<T> {
  private readonly pending: RetryableJob<T>[] = [];

  constructor(private readonly handler: (job: RetryableJob<T>) => Promise<void>) {}

  enqueue(job: Omit<RetryableJob<T>, 'id' | 'attempts' | 'nextAttemptAt'>): string {
    const id = `${job.type}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    this.pending.push({
      ...job,
      id,
      attempts: 0,
      nextAttemptAt: Date.now(),
    });
    void this.drain();
    return id;
  }

  private async drain(): Promise<void> {
    const now = Date.now();
    const due = this.pending.filter((job) => job.nextAttemptAt <= now);
    if (due.length === 0) {
      return;
    }

    const job = due[0];
    this.pending.splice(this.pending.indexOf(job), 1);

    try {
      await this.handler(job);
    } catch (error) {
      console.error('[RETRY QUEUE ERROR]', error);
      if (job.attempts < job.maxAttempts) {
        const backoffMs = 2 ** job.attempts * 250;
        const retryJob: RetryableJob<T> = {
          ...job,
          attempts: job.attempts + 1,
          nextAttemptAt: Date.now() + backoffMs,
        };
        this.pending.push(retryJob);
      }
    }

    if (this.pending.length > 0) {
      void this.drain();
    }
  }
}
