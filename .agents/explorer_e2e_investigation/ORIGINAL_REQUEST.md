## 2026-07-07T07:55:37Z
Analyze the codebase of WFP CRM to design a robust E2E testing framework using tsx and node:test.
Your absolute working directory is: c:\Users\brend\Desktop\XX2\.agents\explorer_e2e_investigation\
Please perform the following:
1. Read PROJECT.md and c:\Users\brend\Desktop\XX2\.agents\sub_orch_e2e_testing\SCOPE.md.
2. Inspect the 3 main page components: `src/pages/FacebookLeads.tsx`, `src/pages/VslGenerator.tsx`, `src/pages/Zapalnik.tsx` to understand their user flows, input fields, state changes, and API calls.
3. Inspect `server.ts` and backend services in `server/` to map out the API endpoints they hit and how key rotation / Supabase search is implemented.
4. Propose a testing strategy. How can we test these pages programmatically without a full browser, or do we need to set up a lightweight DOM environment (e.g. happy-dom, jsdom) or mock the React state/contexts? What npm packages should be installed if any?
5. Outline the design of the test runner, mock server, and test cases covering Tiers 1-4 for features F1-F4.
6. Write your findings and recommendations in detail to `c:\Users\brend\Desktop\XX2\.agents\explorer_e2e_investigation\analysis.md` and write a handoff.md.
7. Send a message to the sub-orchestrator (conv ID: 43232522-c4c5-4e90-b2f6-946d764f11d5) when complete.
