# Handoff Report: Stripe Subscription, SecOps Audit & Marketing Funnel Analysis

## 1. Observation
We examined the backend codebase, test suite configuration, and marketing spec blueprints. The following findings were directly observed:

### A. Syntax Error in Webhooks Router Blocking the Entire Test Suite
* **File Path**: `backend/app/routers/stripe_webhooks.py`
* **Line Number**: 79
* **Verbatim Line**:
  ```python
  79: @app_webhook_post_handler = router.post("/stripe")
  ```
* **Impact**: In Python, assigning the result of a decorator inline like `@decorator = func` is a syntax error. Because `backend/app/main.py` imports `routers.stripe_webhooks` (line 66: `from routers import subscriptions, stripe_webhooks`), any attempt to run pytest or start the FastAPI application fails immediately with `SyntaxError: invalid syntax` on startup.

### B. Missing Stripe Discount Implementation in Subscriptions Router
* **File Path**: `backend/app/routers/subscriptions.py`
* **Lines 63–79**:
  ```python
  63:         # 3. Create Stripe Checkout Session
  64:         session = stripe.checkout.Session.create(
  65:             payment_method_types=["card"],
  66:             line_items=[{
  67:                 "price": price_id,
  68:                 "quantity": 1,
  69:             }],
  70:             mode="subscription",
  71:             subscription_data={
  72:                 "trial_period_days": 14,
  73:                 "metadata": metadata
  74:             },
  75:             metadata=metadata,
  76:             success_url="https://app.antigravity.dev/billing?success=true",
  77:             cancel_url="https://app.antigravity.dev/billing?success=false",
  78:         )
  ```
* **Impact**: Although the incoming `CheckoutRequest` schema contains `annual_billing: bool = False`, and the metadata records `"annual_discount": "true"` if `annual_billing` is `True`, the router does NOT pass any coupon or discount arguments to the Stripe Session creation. Hence, no actual 20% discount is applied to the checkout session.

### C. Missing Files
* The SecOps static audit script `skills/SkillMonetizationAudit/third_eye_audit.py` does not exist.
* The marketing specification file `specs/marketing_funnel.md` does not exist.

---

## 2. Logic Chain
1. **Test Failure**: Since `tests/integration/test_subscriptions.py` imports `app` from `backend/app/main.py` (which imports `stripe_webhooks.py`), the syntax error at line 79 of `stripe_webhooks.py` prevents the test suite from compiling or running. Therefore, the mock Stripe tests are currently failing to run due to a syntax blocker.
2. **Discount Integration**: To support the 20% annual billing discount dynamically via Stripe Checkout, the endpoint must send the `discounts` parameter to Stripe. Using a predefined coupon (e.g. `ANNUAL_20`) is the standard Stripe Checkout approach for applying a percentage discount directly to a subscription checkout session.
3. **Mocking updates**: In `test_subscriptions.py`, the assertions currently check `metadata` and `trial_period_days` but do not assert the presence of `discounts`. Once the router is updated to apply the coupon, the mock assertions must verify that `kwargs["discounts"]` matches `[{"coupon": "ANNUAL_20"}]` if `annual_billing` is true, and is absent if false.
4. **SecOps Static Audit**: To prevent security risks, `third_eye_audit.py` should statically inspect `subscriptions.py` (and related files) for SQL injections, proper Stripe error handling, webhook signature checks, and hardcoded secrets. Using the Python `ast` module is safer and more reliable than regex for parsing code semantics.
5. **Marketing PAS Copy**: A compelling marketing funnel landing page needs to target growth hackers and agency owners by addressing the manual overhead of lead follow-ups and VSL creation (Problem), demonstrating the cost and conversion loss of delay (Agitate), and introducing WFP CRM with its plans, free trial, and annual discount as the solution (Solve).

---

## 3. Caveats
* **Environment Execution**: The integration tests were not executed to completion in the terminal because the command permission request timed out. The assertion that they fail on syntax error is based on static analysis of python import dynamics and syntax rules.
* **Stripe Dashboard Configuration**: Implementing the discount via coupon assume that a coupon with ID `ANNUAL_20` (configured with a 20% discount) has been created in the active Stripe dashboard (or mock Stripe account).

---

## 4. Conclusion

### A. Stripe Integration & Mocking Recommendations
1. **Fix the Webhook syntax error** in `stripe_webhooks.py` by changing line 79 from:
   ```python
   @app_webhook_post_handler = router.post("/stripe")
   ```
   to:
   ```python
   @router.post("/stripe")
   ```
2. **Apply 20% Annual Billing Discount** in `subscriptions.py` using Stripe Checkout Session `discounts` parameter:
   ```python
   # inside create_checkout_session
   session_args = {
       "payment_method_types": ["card"],
       "line_items": [{
           "price": price_id,
           "quantity": 1,
       }],
       "mode": "subscription",
       "subscription_data": {
           "trial_period_days": 14,
           "metadata": metadata
       },
       "metadata": metadata,
       "success_url": "https://app.antigravity.dev/billing?success=true",
       "cancel_url": "https://app.antigravity.dev/billing?success=false",
   }
   
   if payload.annual_billing:
       session_args["discounts"] = [{"coupon": "ANNUAL_20"}]
       
   session = stripe.checkout.Session.create(**session_args)
   ```
3. **Update Mock Assertions** in `tests/integration/test_subscriptions.py`:
   - In `test_checkout_endpoint_success`:
     ```python
     kwargs = mock_stripe_checkout.call_args[1]
     assert kwargs["discounts"] == [{"coupon": "ANNUAL_20"}]
     ```
   - Add a test case `test_checkout_endpoint_no_annual_discount` where `annual_billing` is `False`, verifying that `discounts` is not in `kwargs`.

### B. SecOps Static Audit Script (`third_eye_audit.py`) Recommendations
Implement `skills/SkillMonetizationAudit/third_eye_audit.py` using the Python `ast` module. The script should perform:
1. **SQL Injection Checks**: Flag f-string formatting (`ast.JoinedStr`) or string additions (`ast.BinOp` with `Add`) inside database execution methods (`execute` or `raw`).
2. **Stripe Exception Handling Checks**: Traverse the AST to ensure any call to `stripe.checkout.Session.create` is enclosed in an `ast.Try` node that contains an `ast.ExceptHandler` specifically catching `stripe.error.StripeError` or specific stripe error subclasses.
3. **Webhook Verification Checks**: Ensure any webhook endpoints in webhook routers invoke `stripe.Webhook.construct_event`.
4. **Secrets Leaks Checks**: Scan for any `getenv` calls returning default values starting with `"sk_"` or `"whsec_"`.

*Code blueprint for `third_eye_audit.py`:*
```python
import ast
import sys
import os

class SecOpsVisitor(ast.NodeVisitor):
    def __init__(self, filename):
        self.filename = filename
        self.errors = []

    def visit_Call(self, node):
        # 1. Fallback secret checks
        if isinstance(node.func, ast.Attribute) and node.func.attr == "getenv":
            if len(node.args) >= 2:
                default_val = node.args[1]
                if isinstance(default_val, ast.Constant) and isinstance(default_val.value, str):
                    val = default_val.value
                    if val.startswith("sk_") or val.startswith("whsec_"):
                        self.errors.append({
                            "line": node.lineno,
                            "type": "HARDCODED_FALLBACK_SECRET",
                            "message": f"Avoid hardcoded fallback secret key: '{val}'"
                        })

        # 2. SQL injection checks
        if isinstance(node.func, ast.Name) and node.func.id in ("execute", "raw_query"):
            self._check_sql_injection(node)
        elif isinstance(node.func, ast.Attribute) and node.func.attr in ("execute", "raw"):
            self._check_sql_injection(node)

        self.generic_visit(node)

    def _check_sql_injection(self, node):
        if not node.args:
            return
        sql_arg = node.args[0]
        if isinstance(sql_arg, ast.JoinedStr):
            self.errors.append({
                "line": node.lineno,
                "type": "SQL_INJECTION_RISK",
                "message": "SQL query uses f-string formatting. Use parameterized queries instead."
            })
        elif isinstance(sql_arg, ast.BinOp) and isinstance(sql_arg.op, ast.Add):
            self.errors.append({
                "line": node.lineno,
                "type": "SQL_INJECTION_RISK",
                "message": "SQL query uses string concatenation (+). Use parameterized queries instead."
            })

    def visit_Try(self, node):
        # 3. Stripe error handling checks
        has_stripe_call = False
        stripe_call_node = None
        for child in ast.walk(node):
            if isinstance(child, ast.Call):
                if isinstance(child.func, ast.Attribute) and child.func.attr == "create":
                    if isinstance(child.func.value, ast.Attribute) and child.func.value.attr == "Session":
                        if isinstance(child.func.value.value, ast.Name) and child.func.value.value.id == "stripe":
                            has_stripe_call = True
                            stripe_call_node = child

        if has_stripe_call:
            handles_stripe_error = False
            for handler in node.handlers:
                if handler.type is None:
                    continue
                type_str = self._get_source_type_str(handler.type)
                if "stripe.error" in type_str or "StripeError" in type_str:
                    handles_stripe_error = True
            
            if not handles_stripe_error:
                self.errors.append({
                    "line": stripe_call_node.lineno,
                    "type": "INSUFFICIENT_STRIPE_ERROR_HANDLING",
                    "message": "Stripe session creation is not caught by stripe.error.StripeError. Catching generic Exception may hide detailed Stripe API issues."
                })

        self.generic_visit(node)

    def _get_source_type_str(self, node):
        if isinstance(node, ast.Name):
            return node.id
        elif isinstance(node, ast.Attribute):
            return f"{self._get_source_type_str(node.value)}.{node.attr}"
        return ""

def audit_file(filepath):
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return False
    with open(filepath, "r", encoding="utf-8") as f:
        source = f.read()
    try:
        tree = ast.parse(source)
    except SyntaxError as e:
        print(f"Syntax error in {filepath}: {e}")
        return False

    visitor = SecOpsVisitor(filepath)
    visitor.visit(tree)

    # 4. Webhook verification checks
    if "stripe_webhooks" in filepath:
        has_webhook_verification = False
        for node in ast.walk(tree):
            if isinstance(node, ast.Call):
                if isinstance(node.func, ast.Attribute) and node.func.attr == "construct_event":
                    if isinstance(node.func.value, ast.Attribute) and node.func.value.attr == "Webhook":
                        if isinstance(node.func.value.value, ast.Name) and node.func.value.value.id == "stripe":
                            has_webhook_verification = True
        if not has_webhook_verification:
            visitor.errors.append({
                "line": 1,
                "type": "MISSING_WEBHOOK_SIGNATURE_VERIFICATION",
                "message": "Webhook endpoint file is missing signature verification via stripe.Webhook.construct_event."
            })

    if visitor.errors:
        print(f"--- SecOps Audit FAILED for {filepath} ---")
        for err in visitor.errors:
            print(f"[{err['type']}] Line {err['line']}: {err['message']}")
        return False
    else:
        print(f"--- SecOps Audit PASSED for {filepath} ---")
        return True

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python third_eye_audit.py <path_to_python_file>")
        sys.exit(1)
    
    target = sys.argv[1]
    success = audit_file(target)
    sys.exit(0 if success else 1)
```

### C. Marketing Funnel PAS Framework Recommendations
Create `specs/marketing_funnel.md` containing landing page layout and campaign structure:
1. **Problem (P)**: 
   - **Headline**: "Are You Throwing Ad Budget at Cold Leads?"
   - **Body**: Marketers and agency owners spend hours copy-pasting leads from Facebook, manually qualifying prospects, and writing custom Video Sales Letters (VSLs) or follow-ups. You are drowning in admin work instead of closing deals.
2. **Agitate (A)**:
   - **Sub-headline**: "Every minute of delay drops lead conversion by 391%."
   - **Body**: While you type out manual follow-ups or struggle to draft video scripts, your competitors have already contacted your lead. If your CRM doesn't automatically qualification-score leads and generate VSL scripts instantly, your expensive ad campaigns are burning cash while leads go freezing cold.
3. **Solve (S)**:
   - **Sub-headline**: "Automate from Facebook Click to Video pitch with WFP CRM."
   - **Body**: WFP CRM powered by the self-evolving Antigravity AI Engine instantly pulls leads via Webhooks, auto-qualifies them in real-time, and auto-generates converting VSL scripts in seconds.
   - **Features & Pricing Tiers**:
     - *Basic ($29/mo or $278.40/yr)*: 10,000 AI tokens/mo, Facebook Leads integration, basic pipeline management.
     - *Pro ($99/mo or $950.40/yr)*: 100,000 AI tokens/mo, advanced VSL generation, affiliate referral eligibility.
     - *Enterprise ($499/mo or $4,790.40/yr)*: Unlimited tokens, SLA 99.9% uptime guarantee, priority support.
   - **Call-To-Action (CTA)**: "Start Your Risk-Free 14-Day Free Trial Today. Save 20% Instantly with Annual Billing."
4. **Viral Campaign & Affiliate Program**:
   - Incentivize Pro and Enterprise users to spread the platform: Provide them with unique referral codes and reward them with a 20% commission on the invitee's payments during their first 12 months.

---

## 5. Verification Method
1. **Resolve Webhook Router Syntax**: Edit `backend/app/routers/stripe_webhooks.py` to fix line 79.
2. **Run Tests**: Execute `pytest tests/integration/test_subscriptions.py` in the workspace to confirm the existing integration tests pass successfully.
3. **Verify Discount Feature**: In `test_subscriptions.py`, update `test_checkout_endpoint_success` to check that the Stripe session mock is called with the `discounts` parameter when `annual_billing` is `True`. Run `pytest` again.
4. **Verify SecOps Audit**: Run `python skills/SkillMonetizationAudit/third_eye_audit.py backend/app/routers/subscriptions.py` and ensure the script exits with `0` (Success).
