# Security Constitution (Specification v1.0)

This document establishes the security mechanisms, verification gates, and middleware specifications required for the monetization platform.

## 1. Stripe Webhook Signature Verification
- **Header**: All incoming webhook requests from Stripe must include the `stripe-signature` header.
- **Verification**: Evaluated via `stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)` before any routing logic.
- **Failures**: Reject with `HTTP 400 Bad Request` or `HTTP 403 Forbidden` if signature is invalid. No logs of the raw payload are written to the database if the signature check fails.

## 2. Row Level Security (RLS) Rules
Supabase RLS is enforced at the database level to ensure data isolation:
- `users`: Selected and updated *only* when the authenticated `auth.uid()` matches `id`.
- `subscriptions`: Accessible only to the associated `user_id`.
- `token_usage`: User-specific data access.
- `transactions`: Read-only for the billing account holder.
- `affiliate_payouts`: Only visible to the referring partner (`referrer_id`).
- `webhook_events`: Locked down to the database administrator (`service_role`).

## 3. Role-Based Access Control (RBAC)
FastAPI endpoints use a security dependency checking the user's active tier:
```python
def require_tier(allowed_tiers: list):
    async def dependency(current_user: User = Depends(get_current_user)):
        if current_user.tier not in allowed_tiers:
            raise HTTPException(status_code=403, detail="Upgrade required to access this resource.")
        return current_user
    return dependency
```

## 4. Rate Limiting Middleware
- **Backend Storage**: Redis.
- **Algorithm**: Sliding window log or Token Bucket algorithm.
- **Limits**:
  - Unauthenticated endpoints: 10 requests / minute per IP.
  - Basic Tier: 100 requests / minute per User.
  - Pro Tier: 500 requests / minute per User.
  - Enterprise Tier: 2000 requests / minute per User.
- **Overage**: Trigger HTTP 429 when limits are violated, returning headers:
  - `Retry-After`: Seconds to wait before retrying.
  - `X-RateLimit-Limit`: Maximum requests per period.
  - `X-RateLimit-Remaining`: Remaining capacity.
