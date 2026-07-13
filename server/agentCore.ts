import { InMemoryTaskQueue } from './queue.js';
import { CircuitBreaker } from './circuitBreaker.js';

export interface AgentMemoryEntry {
  id: string;
  agentId: string;
  content: string;
  createdAt: string;
  scope: 'short' | 'long';
}

export interface AgentExecutionContext {
  agentId: string;
  taskId: string;
  prompt: string;
  maxTokens: number;
  memoryEntries: AgentMemoryEntry[];
}

export interface AgentExecutionResult {
  success: boolean;
  output: string;
  tokenUsage: number;
  durationMs: number;
  error?: string;
}

export class AutonomousAgentCore {
  private readonly breaker = new CircuitBreaker(5, 20_000);
  private readonly memory: AgentMemoryEntry[] = [];
  private readonly queue: InMemoryTaskQueue<AgentExecutionContext>;

  constructor() {
    this.queue = new InMemoryTaskQueue(async (job) => {
      await this.execute(job.payload);
    });
  }

  enqueue(agentId: string, taskId: string, prompt: string, maxTokens: number): string {
    return this.queue.enqueue({
      type: 'agent:execute',
      payload: {
        agentId,
        taskId,
        prompt,
        maxTokens,
        memoryEntries: this.readMemory(agentId),
      },
    });
  }

  async execute(context: AgentExecutionContext): Promise<AgentExecutionResult> {
    return this.breaker.execute(async () => {
      const startedAt = Date.now();

      if (context.maxTokens <= 0) {
        throw new Error('Invalid token budget');
      }

      const promptWithContext = `${context.prompt}\n\nContext:\n${context.memoryEntries
        .slice(-5)
        .map((entry) => entry.content)
        .join('\n')}`;

      const tokenUsage = Math.min(context.maxTokens, Math.max(100, promptWithContext.length));
      const output = `Agent ${context.agentId} completed task ${context.taskId} with ${tokenUsage} simulated tokens.`;

      const durationMs = Date.now() - startedAt;

      this.writeMemory(context.agentId, output, 'short');

      return {
        success: true,
        output,
        tokenUsage,
        durationMs,
      };
    });
  }

  private readMemory(agentId: string): AgentMemoryEntry[] {
    return this.memory.filter((entry) => entry.agentId === agentId).slice(-10);
  }

  private writeMemory(agentId: string, content: string, scope: 'short' | 'long'): void {
    this.memory.push({
      id: `mem_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      agentId,
      content,
      createdAt: new Date().toISOString(),
      scope,
    });
  }
}
