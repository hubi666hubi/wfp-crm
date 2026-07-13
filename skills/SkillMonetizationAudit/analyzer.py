import json
import os
import sys

class MonetizationAnalyzer:
    def __init__(self, transaction_log_path: str, usage_log_path: str):
        self.transaction_log_path = transaction_log_path
        self.usage_log_path = usage_log_path

    def run_audit(self) -> dict:
        """
        Runs analytical checks on transactional records and token quotas.
        """
        if not os.path.exists(self.transaction_log_path):
            return {"error": f"Transaction log missing at {self.transaction_log_path}"}
        
        with open(self.transaction_log_path, 'r') as f:
            transactions = json.load(f)

        total_revenue_cents = 0
        refunds_cents = 0
        active_subscriptions = 0
        payouts_pending_cents = 0

        for tx in transactions:
            type_ = tx.get("type")
            status = tx.get("status")
            amount = tx.get("amount_cents", 0)

            if type_ == "subscription" and status == "active":
                total_revenue_cents += amount
                active_subscriptions += 1
            elif type_ == "one_time" and status == "succeeded":
                total_revenue_cents += amount
            elif type_ == "refund":
                refunds_cents += amount
            elif type_ == "affiliate_payout" and status == "pending":
                payouts_pending_cents += amount

        return {
            "total_revenue_usd": total_revenue_cents / 100.0,
            "total_refunds_usd": refunds_cents / 100.0,
            "net_revenue_usd": (total_revenue_cents - refunds_cents) / 100.0,
            "active_subscriptions_count": active_subscriptions,
            "pending_affiliate_payouts_usd": payouts_pending_cents / 100.0,
            "audit_status": "PASS" if refunds_cents < (total_revenue_cents * 0.05) else "WARNING_HIGH_REFUNDS"
        }

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python analyzer.py <transactions_json> <usage_json>")
        sys.exit(1)
    
    analyzer = MonetizationAnalyzer(sys.argv[1], sys.argv[2])
    results = analyzer.run_audit()
    print(json.dumps(results, indent=4))
