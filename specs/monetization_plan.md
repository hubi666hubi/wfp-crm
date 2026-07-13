# Monetization Plan (Specification v1.0)

This document details the business logic, SQL database schema, and integrations for the full-stack monetization system.

## Business Models

### 1. Subscription Tiers (Stripe Subscriptions)
- **Basic Plan**:
  - Price: $29/month (Annual: $278.40/year - 20% discount)
  - Features: 10,000 API tokens/month limit.
- **Pro Plan**:
  - Price: $99/month (Annual: $950.40/year - 20% discount)
  - Features: 100,000 API tokens/month limit.
- **Enterprise Plan**:
  - Price: $499/month (Annual: $4,790.40/year - 20% discount)
  - Features: Unlimited tokens + SLA (99.9% uptime guarantee).
- **Trial Phase**:
  - 14 days free trial. Card required upon signup. No initial charge.

### 2. Metered Overage Billing (Pay-as-you-go)
- **Rate**: $0.0001 per token beyond the subscription tier limit.
- **Sync cycle**: Hourly background task reports usage metrics to Stripe.
- **Guardrails**:
  - Soft alert emails dispatched at 80%, 90%, and 100% of limits.
  - Optional hard spending caps defined by the user.

### 3. Credit Packages (One-Time Purchases)
- **Pack S**: $10 for 150,000 tokens.
- **Pack M**: $25 for 450,000 tokens.
- **Pack L**: $80 for 2,000,000 tokens.
- **Consumption priority**: One-time credits are consumed *after* monthly subscription allowances are exhausted.

### 4. Affiliate Referrals
- **Referral Code**: Uniquely generated upon user registration (`nanoid(8)`).
- **Eligibility**: Referral links accessible only to Pro+ tier subscribers.
- **Reward**: 20% commission from the invitee's payments during their first 12 months.
- **Payout**: Dispatched autonomously via Stripe Connect.

---

## Supabase PostgreSQL Schema

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    stripe_customer_id TEXT UNIQUE,
    referral_code TEXT UNIQUE NOT NULL,
    referred_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: Subscriptions
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    stripe_subscription_id TEXT UNIQUE NOT NULL,
    stripe_price_id TEXT NOT NULL,
    tier TEXT CHECK (tier IN ('basic', 'pro', 'enterprise', 'trial')) NOT NULL,
    status TEXT CHECK (status IN ('active', 'past_due', 'canceled', 'trialing', 'paused')) NOT NULL,
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    trial_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: Token Usage
CREATE TABLE token_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    tokens_used BIGINT DEFAULT 0,
    tokens_limit BIGINT NOT NULL,
    overage_tokens BIGINT DEFAULT 0,
    billing_period_start TIMESTAMPTZ NOT NULL,
    billing_period_end TIMESTAMPTZ NOT NULL,
    reported_to_stripe BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: Transactions
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    stripe_payment_intent_id TEXT UNIQUE NOT NULL,
    amount_cents INTEGER NOT NULL,
    currency TEXT DEFAULT 'usd',
    status TEXT NOT NULL,
    type TEXT CHECK (type IN ('subscription', 'one_time', 'overage', 'refund', 'affiliate_payout')) NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: Webhook Events (Idempotency check)
CREATE TABLE webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stripe_event_id TEXT UNIQUE NOT NULL,
    event_type TEXT NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    error TEXT,
    received_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: Affiliate Payouts
CREATE TABLE affiliate_payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    referred_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    amount_cents INTEGER NOT NULL,
    stripe_transfer_id TEXT UNIQUE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_payouts ENABLE ROW LEVEL SECURITY;

-- 1. users: users can only see their own records
CREATE POLICY user_self_read ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY user_self_update ON users FOR UPDATE USING (auth.uid() = id);

-- 2. subscriptions: users can only see their own subscriptions
CREATE POLICY subscription_self_read ON subscriptions FOR SELECT USING (auth.uid() = user_id);

-- 3. token_usage: users can only see their own usage stats
CREATE POLICY usage_self_read ON token_usage FOR SELECT USING (auth.uid() = user_id);

-- 4. transactions: users can only see their own transaction logs
CREATE POLICY transaction_self_read ON transactions FOR SELECT USING (auth.uid() = user_id);

-- 5. webhook_events: only service_role/admins can read or write
CREATE POLICY webhook_service_role ON webhook_events TO service_role USING (true) WITH CHECK (true);

-- 6. affiliate_payouts: referrers can see their payout records
CREATE POLICY payouts_referrer_read ON affiliate_payouts FOR SELECT USING (auth.uid() = referrer_id);
```
