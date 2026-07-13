---
name: wfp-crm-stabilization
description: >-
  Orchestrates, verifies, and stabilizes the WFP CRM endpoints (Stripe checkouts and Supabase RAG text-embedding-004 search / api/handle-aistudio-call) and runs system validation checks.
---

# WFP CRM Stabilization & Verification Skill

## Overview
This skill provides instructions and tools to verify and stabilize the WFP CRM application services. It focuses on validating Stripe Subscription Checkout endpoints, the Express RAG embedding/matching API `/api/handle-aistudio-call`, key rotation logic, and overall system compilation health.

## Dependencies
- `omega-core-integration-and-healing` - handles core compilation and hotswap operations.
- `firebase-basics` - handles base authentication and hosting environment parameters.

## Quick Start
Run the custom verification script to check tests and compile the application:
```bash
.venv\Scripts\python scripts/verify_system.py
```

## Utility Scripts
The verification utility script is located at `scripts/verify_system.py`.

### verify_system.py
Executes the following verification stages:
1. **Node.js Validation Tests**: Runs `node --import tsx --test server/validation.test.ts`
2. **Node.js Autonomy Tests**: Runs `node --import tsx --test server/autonomy.test.ts`
3. **Python Integration Tests**: Runs `.venv\Scripts\python -m pytest tests/`
4. **Production Build Compilation**: Runs `npm run build` using the system's Node.js npm cli package.

It aggregates results and saves detailed stdout and stderr in `verification_report.json` to keep system output clean.

## Rate Limiting
- **Gemini API**: Rate limits are simulated. If a client uses the API key `exhausted_key`, the backend rotates the key and returns a `429 Too Many Requests` status code with the rotation response.
- **Stripe API**: Mocks are used in integration tests (`tests/integration/test_subscriptions.py`) to bypass Stripe checkout rate limits and live payments.

## Common Mistakes
1. **Windows PowerShell Execution Policy**: When executing `npm` or `npx` commands in PowerShell, Windows may block execution. Use Node directly to call `npm-cli.js` (e.g. `node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" run build`) to bypass execution policy limits.
2. **UnicodeEncodeError in Console**: On Windows, printing emoji characters (e.g. 🎯, ⚡) inside standard python scripts can crash the process due to CP1250 encoding conflicts. Ensure all Python system scripts include standard UTF-8 console reconfiguring at the very top:
   ```python
   import sys
   if hasattr(sys.stdout, 'reconfigure'):
       sys.stdout.reconfigure(encoding='utf-8')
   if hasattr(sys.stderr, 'reconfigure'):
       sys.stderr.reconfigure(encoding='utf-8')
   ```
