import time
from typing import Dict, Tuple

# Mock Redis Connection Interface
class MockRedis:
    def __init__(self):
        self.store: Dict[str, int] = {}

    def incrby(self, key: str, amount: int) -> int:
        current = self.store.get(key, 0)
        new_val = current + amount
        self.store[key] = new_val
        return new_val

    def get(self, key: str) -> str:
        return str(self.store.get(key, 0))

    def set(self, key: str, val: int):
        self.store[key] = val

redis_client = MockRedis()

# Mock Postgres Database Interface
class MockPostgres:
    @staticmethod
    async def log_batch_usage(user_id: str, total_tokens: int):
        print(f"[DB BATCH] Saved token metrics for user {user_id}: {total_tokens} tokens total.")

    @staticmethod
    async def update_stripe_reported_status(user_id: str, reported: bool):
        print(f"[DB] Token usage reported to Stripe status updated to: {reported}")

db_client = MockPostgres()

class UsageTracker:
    def __init__(self, soft_alert_thresholds: tuple = (0.80, 0.90, 1.00)):
        self.thresholds = soft_alert_thresholds
        self.batch_counters: Dict[str, int] = {}  # Tracks batch count to save to DB

    async def record_usage(
        self, user_id: str, tokens_used: int, endpoint: str, token_limit: int, hard_cap_enabled: bool = True
    ) -> Tuple[bool, str]:
        """
        Atomically records API token consumption, enforces thresholds, and batches DB saves.
        Returns:
            Tuple[bool, str]: (is_allowed, response_msg)
        """
        redis_key = f"usage:{user_id}:tokens"
        
        # 1. Atomic increment in Redis cache
        total_used = redis_client.incrby(redis_key, tokens_used)
        
        # 2. Hard Cap Enforcement
        if total_used > token_limit and hard_cap_enabled:
            # Re-adjust to avoid runaway overruns
            redis_client.incrby(redis_key, -tokens_used)
            return False, "QUOTA_EXCEEDED: Hard limit reached. Upgrade subscription."

        # 3. Soft limit alerts checking
        prev_used = total_used - tokens_used
        for th in self.thresholds:
            alert_val = int(token_limit * th)
            if prev_used < alert_val <= total_used:
                await self._dispatch_soft_limit_alert(user_id, th, total_used, token_limit)

        # 4. Batch write to Postgres DB (Every 100 requests per user)
        self.batch_counters[user_id] = self.batch_counters.get(user_id, 0) + 1
        if self.batch_counters[user_id] >= 100:
            await db_client.log_batch_usage(user_id, total_used)
            self.batch_counters[user_id] = 0

        return True, "SUCCESS: Usage logged."

    async def sync_usage_to_stripe(self, user_id: str, stripe_subscription_item_id: str) -> bool:
        """
        Pulls usage from Redis, reports it to Stripe Usage Records API, and updates local database state.
        """
        redis_key = f"usage:{user_id}:tokens"
        cached_usage = int(redis_client.get(redis_key))

        if cached_usage <= 0:
            print(f"[STRIPE SYNC] No new metered usage to report for user {user_id}")
            return True

        try:
            # Under real conditions, executes:
            # stripe.SubscriptionItem.create_usage_record(
            #     stripe_subscription_item_id,
            #     quantity=cached_usage,
            #     timestamp=int(time.time()),
            #     action="set"
            # )
            print(f"[STRIPE SYNC] Reported {cached_usage} tokens to Stripe item {stripe_subscription_item_id}")
            
            # Update Postgres database
            await db_client.update_stripe_reported_status(user_id, True)
            
            # Reset Redis cache counter after success
            redis_client.set(redis_key, 0)
            return True
            
        except Exception as e:
            print(f"[STRIPE SYNC ERROR] Failed to report usage for {user_id}: {str(e)}")
            await db_client.update_stripe_reported_status(user_id, False)
            return False

    async def _dispatch_soft_limit_alert(self, user_id: str, threshold: float, current: int, limit: int):
        percentage = int(threshold * 100)
        print(f"[ALERT SERVICE] User {user_id} reached {percentage}% of quota limit ({current}/{limit})")
        # Send transactional warning email (Resend API)
        # Push socket notification
