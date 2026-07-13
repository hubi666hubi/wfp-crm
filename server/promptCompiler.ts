export interface PromptVariant {
  id: string;
  agentId: string;
  prompt: string;
  score: number;
  createdAt: string;
}

export interface SuccessMemoryEntry {
  prompt: string;
  score: number;
  createdAt: string;
}

export interface PromptCompilationResult {
  selectedPrompt: string;
  variants: PromptVariant[];
}

export class PromptCompiler {
  private readonly variants: PromptVariant[] = [];
  private readonly successMemory = new Map<string, SuccessMemoryEntry[]>();

  registerSuccess(agentId: string, prompt: string, score: number): void {
    const history = this.successMemory.get(agentId) ?? [];
    const entry: SuccessMemoryEntry = {
      prompt,
      score,
      createdAt: new Date().toISOString(),
    };

    history.push(entry);
    history.sort((left, right) => right.score - left.score);
    this.successMemory.set(agentId, history.slice(0, 20));
  }

  getSuccessMemory(agentId: string): SuccessMemoryEntry[] {
    return [...(this.successMemory.get(agentId) ?? [])];
  }

  compile(agentId: string, basePrompt: string, successMemory: Array<{ score: number; prompt: string }>): PromptCompilationResult {
    const ranked = [...this.getSuccessMemory(agentId), ...successMemory]
      .filter((entry) => entry.prompt.trim().length > 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, 5);

    const selectedPrompt = ranked.length > 0
      ? `${basePrompt}\n\nBest known pattern: ${ranked[0].prompt}`
      : basePrompt;

    const newVariants = Array.from({ length: 5 }, (_, index) => ({
      id: `variant_${Date.now()}_${index}`,
      agentId,
      prompt: `${selectedPrompt}\n\nVariant ${index + 1}`,
      score: Math.max(0.1, 1 - index * 0.1),
      createdAt: new Date().toISOString(),
    }));

    this.variants.push(...newVariants);

    return {
      selectedPrompt,
      variants: newVariants,
    };
  }

  listVariants(): PromptVariant[] {
    return [...this.variants];
  }
}
