# API Contracts (Specification v1.0)

This document specifies the REST API endpoints, payload contracts, and error structures for the monetization platform.

## 1. Subscription Endpoints

### `POST /api/subscriptions/checkout`
Creates a Stripe Checkout Session for subscription creation or upgrade.
- **Request Body**:
  ```json
  {
    "price_id": "price_1Nabc...",
    "referral_code": "optional_ref_code"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "checkout_url": "https://checkout.stripe.com/c/pay/cs_test_..."
  }
  ```

### `POST /api/subscriptions/cancel`
Cancels the user's active subscription at the end of the current billing cycle.
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Subscription scheduled to cancel on 2026-07-23."
  }
  ```

---

## 2. Usage Billing Endpoints

### `POST /api/usage/record`
Records API token consumption.
- **Request Headers**:
  - `Authorization: Bearer <API_KEY>`
- **Request Body**:
  ```json
  {
    "tokens_used": 150,
    "endpoint": "/api/v1/generate"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "remaining_quota": 9850
  }
  ```
- **Response (429 Too Many Requests)**:
  ```json
  {
    "error": "QUOTA_EXCEEDED",
    "message": "Monthly token limit reached. Overage cap activated or disabled."
  }
  ```

---

## 3. One-Time Payment Endpoints

### `POST /api/billing/buy-credits`
Initiates the purchase of a one-time credit package.
- **Request Body**:
  ```json
  {
    "pack_size": "M" 
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "payment_intent_client_secret": "pi_1Ndef_secret_...",
    "amount_cents": 2500
  }
  ```

---

## 4. Webhook Endpoint

### `POST /api/webhooks/stripe`
Stripe event gateway receiver.
- **Request Headers**:
  - `Stripe-Signature: t=1618...`
- **Response (200 OK)**:
  ```json
  {
    "received": true
  }
  ```
