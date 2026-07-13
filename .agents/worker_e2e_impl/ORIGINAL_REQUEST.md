## 2026-07-07T07:59:53Z
Implement the E2E testing framework and Tier 1-4 test cases for WFP CRM.
Your absolute working directory is: c:\Users\brend\Desktop\XX2\.agents\worker_e2e_impl\

Please execute the following tasks:
1. Install the required devDependencies: `happy-dom`, `@testing-library/react`, and `@testing-library/dom` (and any others you need for testing React in a headless DOM environment).
2. Set up the testing framework under a `tests/` directory:
   - Create `tests/setupDom.ts` to mock the browser environment (global window, document, navigator, location, CustomEvent, Event, etc.) and stub API stubs (speechSynthesis, clipboard, localStorage).
   - Create `tests/mockServer.ts` to intercept `fetch` calls and simulate all relevant backend API endpoints for F1 (Facebook Leads), F2 (VSL Generator), F3 (Zapalnik CRM), and F4 (AI Studio endpoint with key rotation).
   - Mock Firebase SDK (`firebase/app`, `firebase/auth`, `firebase/firestore`) to work with in-memory states instead of hitting real databases/auth.
3. Write E2E test files covering Tiers 1-4 as specified in SCOPE.md and c:\Users\brend\Desktop\XX2\.agents\explorer_e2e_investigation\analysis.md:
   - `tests/tier1.test.tsx` (Happy path flows for F1-F4)
   - `tests/tier2.test.tsx` (Boundary conditions, validation errors, bad requests, invalid options)
   - `tests/tier3.test.tsx` (Cross-feature interactions like Promo code to Zapalnik sync, VSL campaign registration to Firestore, AI Studio key rotation on 429)
   - `tests/tier4.test.tsx` (Complete campaign workload from login, leads parsing, sentiment analysis, VSL generation, local cache, CRM update, chat simulator, to AI Studio search)
4. Add a `"test"` script to `package.json` that runs all tests using `node --import tsx --test`.
5. Run the tests, fix any compilation or execution errors, and ensure 100% of the tests pass.
6. Once the tests pass, create `c:\Users\brend\Desktop\XX2\TEST_READY.md` containing the test running instructions, coverage matrix, and feature checklists.
7. Write your execution summary and verification results to `c:\Users\brend\Desktop\XX2\.agents\worker_e2e_impl\handoff.md`.

DO NOT modify page implementations or backend APIs. Your scope is strictly limited to tests, mocks, test runners, and test files.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
