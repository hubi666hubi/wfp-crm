export interface FailureSignal {
  id: string;
  errorType: string;
  message: string;
  stack?: string;
  count: number;
}

export interface PatchingCandidate {
  id: string;
  replacementCode: string;
  reason: string;
  createdAt: string;
}

export class SelfHealingRuntime {
  private readonly patchHistory: PatchingCandidate[] = [];

  analyze(signal: FailureSignal): PatchingCandidate | null {
    if (signal.count < 3) {
      return null;
    }

    return {
      id: `patch_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      replacementCode: `function safeFallback(input: unknown) { return typeof input === 'string' ? input : JSON.stringify(input); }`,
      reason: `Recovered from ${signal.errorType}`,
      createdAt: new Date().toISOString(),
    };
  }

  apply(candidate: PatchingCandidate): void {
    this.patchHistory.push(candidate);
  }

  snapshot(): PatchingCandidate[] {
    return [...this.patchHistory];
  }
}
