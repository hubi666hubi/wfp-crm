export type ModelTier = 'cheap' | 'balanced' | 'premium';

export interface CostGuardContext {
  userId: string;
  stripeSubscriptionValue: number;
  currentPeriodSpend: number;
  taskComplexity: 'low' | 'medium' | 'high';
  latencyBudgetMs: number;
}

export interface ModelDecision {
  tier: ModelTier;
  reason: string;
  throttled: boolean;
}

export class CostGuardMiddleware {
  private readonly maxSpendRatio = 0.3;

  decide(context: CostGuardContext): ModelDecision {
    const allowedSpend = context.stripeSubscriptionValue * this.maxSpendRatio;
    const remainingBudget = allowedSpend - context.currentPeriodSpend;

    if (remainingBudget <= 0) {
      return {
        tier: 'cheap',
        reason: 'subscription budget exhausted',
        throttled: true,
      };
    }

    if (context.taskComplexity === 'high' && remainingBudget > allowedSpend * 0.5) {
      return {
        tier: 'premium',
        reason: 'high complexity and budget available',
        throttled: false,
      };
    }

    if (context.latencyBudgetMs <= 800) {
      return {
        tier: 'cheap',
        reason: 'latency budget tight',
        throttled: true,
      };
    }

    return {
      tier: 'balanced',
      reason: 'standard workload',
      throttled: false,
    };
  }
}
