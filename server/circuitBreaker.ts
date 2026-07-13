export class CircuitBreaker {
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private failureCount = 0;
  private readonly threshold: number;
  private readonly resetTimeoutMs: number;
  private openedAt = 0;

  constructor(threshold = 3, resetTimeoutMs = 15_000) {
    this.threshold = threshold;
    this.resetTimeoutMs = resetTimeoutMs;
  }

  async execute<T>(action: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.openedAt >= this.resetTimeoutMs) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await action();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = 'closed';
  }

  private onFailure(): void {
    this.failureCount += 1;
    if (this.failureCount >= this.threshold) {
      this.state = 'open';
      this.openedAt = Date.now();
    }
  }
}
