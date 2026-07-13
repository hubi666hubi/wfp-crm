export interface PromptVersionRecord {
  id: string;
  agentId: string;
  prompt: string;
  score: number;
  createdAt: string;
}

export interface EvaluationResult {
  score: number;
  summary: string;
}

export class SelfEvolutionEngine {
  private readonly versions: PromptVersionRecord[] = [];

  async evaluate(logs: string[], tokenUsage: number, durationMs: number): Promise<EvaluationResult> {
    const issues = logs.filter((entry) => entry.toLowerCase().includes('error'));
    const penalty = issues.length * 0.2 + Math.min(tokenUsage / 1000, 1) * 0.1 + Math.min(durationMs / 1000, 1) * 0.05;
    const score = Math.max(0, 1 - penalty);

    return {
      score,
      summary: issues.length > 0 ? `Detected ${issues.length} issue(s)` : 'No issues detected',
    };
  }

  optimizePrompt(agentId: string, currentPrompt: string, evaluation: EvaluationResult): PromptVersionRecord {
    const improvedPrompt = evaluation.score < 0.7
      ? `${currentPrompt}\n\nSelf-improvement instruction: be concise, verify assumptions, and avoid redundant steps.`
      : `${currentPrompt}\n\nContinue to preserve the current high-quality behavior.`;

    const record: PromptVersionRecord = {
      id: `prompt_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      agentId,
      prompt: improvedPrompt,
      score: evaluation.score,
      createdAt: new Date().toISOString(),
    };

    this.versions.push(record);
    return record;
  }

  createFineTuningPayload(agentId: string, examples: Array<{ input: string; output: string }>): { agentId: string; examples: Array<{ input: string; output: string }> } {
    return {
      agentId,
      examples,
    };
  }
}
