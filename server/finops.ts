export interface FinOpsLedgerEntry {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  reason: string;
  createdAt: string;
}

export interface FinOpsSnapshot {
  totalSpend: number;
  averageLtv: number;
  budgetUtilization: number;
}

export interface FinOpsEfficiencyAnalysis extends FinOpsSnapshot {
  shouldMutatePricing: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  recommendation: string;
}

export class FinOpsLedger {
  private readonly entries: FinOpsLedgerEntry[] = [];

  record(userId: string, amount: number, currency: string, reason: string): FinOpsLedgerEntry {
    const entry: FinOpsLedgerEntry = {
      id: `ledger_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      userId,
      amount,
      currency,
      reason,
      createdAt: new Date().toISOString(),
    };
    this.entries.push(entry);
    return entry;
  }

  snapshot(averageLtv: number): FinOpsSnapshot {
    const totalSpend = this.entries.reduce((sum, entry) => sum + entry.amount, 0);
    const budgetUtilization = averageLtv > 0 ? totalSpend / averageLtv : 0;

    return {
      totalSpend,
      averageLtv,
      budgetUtilization,
    };
  }

  evaluateEfficiency(averageLtv: number): FinOpsEfficiencyAnalysis {
    const snapshot = this.snapshot(averageLtv);
    const shouldMutatePricing = snapshot.budgetUtilization >= 0.85;
    const riskLevel: FinOpsEfficiencyAnalysis['riskLevel'] = snapshot.budgetUtilization >= 1.2
      ? 'high'
      : snapshot.budgetUtilization >= 0.85
        ? 'medium'
        : 'low';
    const recommendation = shouldMutatePricing
      ? 'Inflate value-based pricing guardrails and evaluate a higher-tier Stripe plan.'
      : 'Maintain current pricing posture and monitor spend efficiency.';

    return {
      ...snapshot,
      shouldMutatePricing,
      riskLevel,
      recommendation,
    };
  }
}
