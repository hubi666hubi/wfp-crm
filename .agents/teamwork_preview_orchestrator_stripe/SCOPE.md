# Scope: Stripe Subscription Integration, SecOps Audit & Marketing Funnel

## Architecture
- **FastAPI Backend**: Router `backend/app/routers/subscriptions.py` handling Stripe subscription checkouts.
- **Stripe API**: Used for generating checkout sessions with trial periods and annual billing discounts.
- **Integration Tests**: Pytest tests in `tests/integration/test_subscriptions.py` verifying routers and mock Stripe behavior.
- **SecOps Static Audit**: Static analysis tool `skills/SkillMonetizationAudit/third_eye_audit.py` to audit FastAPI routes for security.
- **Marketing Funnel**: Markdown copy in `specs/marketing_funnel.md` detailing Problem-Agitate-Solve copy.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Stripe Checkout Update | Refactor checkout endpoint to support discounts and better error handling | None | IN_PROGRESS (Conv: 9ee4ff51-3694-4507-8e41-3d34d04f3403) |
| M2 | Integration Test Verification | Implement and pass integration tests for subscriptions router | M1 | IN_PROGRESS (Conv: 9ee4ff51-3694-4507-8e41-3d34d04f3403) |
| M3 | SecOps Third Eye Audit | Write and execute `third_eye_audit.py` to scan `subscriptions.py` | M1 | IN_PROGRESS (Conv: 9ee4ff51-3694-4507-8e41-3d34d04f3403) |
| M4 | Marketing Copy (PAS) | Draft landing page and campaign copy in `specs/marketing_funnel.md` | None | IN_PROGRESS (Conv: 9ee4ff51-3694-4507-8e41-3d34d04f3403) |
| M5 | Verification & Consolidation | Final end-to-end verification, run test suite, run SecOps audit | M1, M2, M3, M4 | PLANNED |

## Interface Contracts
### 1. `POST /api/subscriptions/checkout`
- **Request Body**:
  ```json
  {
    "price_id": "string",
    "email": "string",
    "referral_code": "string (optional)",
    "annual_billing": "boolean (optional, default: false)"
  }
  ```
- **Response Body**:
  ```json
  {
    "success": true,
    "checkout_url": "string",
    "session_id": "string"
  }
  ```
- **Errors**:
  - `400 Bad Request`: Invalid referral code, missing inputs.
  - `422 Unprocessable Entity`: Invalid email format or body schema.
  - `500 Internal Server Error` (e.g. PaymentError, SubscriptionError): Stripe exceptions.
