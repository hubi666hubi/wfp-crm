## 2026-07-09T20:32:02Z

<USER_REQUEST>
You are the Worker agent (teamwork_preview_worker).
Your task is to implement the Stripe subscription endpoint, update integration tests, implement the SecOps audit tool, and draft the marketing copy.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Here are the detailed steps you must execute:

1. Fix the syntax error in `backend/app/routers/stripe_webhooks.py`:
   - Change line 79 from: `@app_webhook_post_handler = router.post("/stripe")`
   - to: `@router.post("/stripe")`

2. Update `backend/app/routers/subscriptions.py` to implement a 20% discount for annual billing:
   - In `create_checkout_session`, if `payload.annual_billing` is True, add `discounts=[{"coupon": "ANNUAL_20"}]` to the arguments passed to `stripe.checkout.Session.create`.
   - Ensure the trial period of 14 days and other metadata are still correctly passed.

3. Update `tests/integration/test_subscriptions.py` to verify the annual billing discount:
   - In `test_checkout_endpoint_success`, assert that `discounts` was passed with the coupon code `ANNUAL_20` to Stripe when `annual_billing` is true.
   - Add/verify a test case where `annual_billing` is false and verify that no `discounts` argument was sent to Stripe.

4. Create the static audit tool `skills/SkillMonetizationAudit/third_eye_audit.py` using AST. It must statically inspect code and perform:
   - SQL Injection check: flags f-string formatting (`ast.JoinedStr`) or string concatenation (`ast.BinOp` with `Add`) in database `execute` or `raw` calls.
   - Stripe Exception Handling check: verifies that any call to `stripe.checkout.Session.create` is inside a `try` block with an `except` catching `stripe.error.StripeError` or specific stripe error subclasses.
   - Webhook Verification check (only when scanning `stripe_webhooks.py`): verifies the endpoint uses `stripe.Webhook.construct_event`.
   - Secrets Leak check: scans for default values starting with `"sk_"` or `"whsec_"` in `os.getenv` calls.
   - Make it return exit code 0 on success, and non-zero on failure.

5. Create `specs/marketing_funnel.md` following the PAS (Problem-Agitate-Solve) framework, targeting growth hackers with WFP CRM pricing tiers (Basic, Pro, Enterprise, trial details, and 20% annual discount) and the referral/viral campaign setup.

6. Run the integration tests and the SecOps audit tool using the project's python environment (e.g. using `.venv\Scripts\pytest` or `.venv\Scripts\python -m pytest` and running the audit script).
7. Document all commands, test results, and file paths in your handoff report.

Write your final handoff report to c:\Users\brend\Desktop\XX2\.agents\worker_stripe_impl\handoff.md.
</USER_REQUEST>
