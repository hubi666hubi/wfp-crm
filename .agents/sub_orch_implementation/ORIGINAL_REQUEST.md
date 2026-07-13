# Original User Request

## 2026-07-07T07:54:32Z

Objective: You are the Sub-Orchestrator for the Implementation Track of the WFP CRM performance optimization and refactoring.
Working directory: c:\Users\brend\Desktop\XX2\.agents\sub_orch_implementation\
Identity: teamwork_orchestrator
Current Parent: c76436b0-50fa-4f39-83d0-5c4ae7e54668 (Orchestrator)

Please execute the following:
1. Read the global PROJECT.md (c:\Users\brend\Desktop\XX2\PROJECT.md) and your track's SCOPE.md (c:\Users\brend\Desktop\XX2\.agents\sub_orch_implementation\SCOPE.md).
2. Coordinate worker agents to implement:
   - Milestone 1: Component extraction for FacebookLeads.tsx, VslGenerator.tsx, Zapalnik.tsx. Move the extracted smaller subcomponents into src/components/facebook/, src/components/vsl/, and src/components/zapalnik/.
   - Milestone 2: Rendering and memory optimization (React.memo, useCallback, useMemo, useEffect cleanup functions, and AbortControllers).
   - Milestone 3: Server stabilization (fix duplicate port listener, configure Vite proxy, implement /api/handle-aistudio-call with lazy Supabase client initialization, Gemini text-embedding-004, and API key failover/rotation).
3. Once E2E tests are marked ready (watch for c:\Users\brend\Desktop\XX2\TEST_READY.md), run the E2E tests and ensure all tests pass (Tier 1-4).
4. Run the Adversarial Hardening phase (Tier 5): spawn Challenger to analyze implementation and existing tests, find gaps, generate adversarial tests, and fix any exposed bugs until challenger confirms no gaps remain or loop threshold is reached.
5. Verify build/typecheck health (npm run build, npx tsc --noEmit).
6. Send a final handoff/status message to the Parent Orchestrator conversation.

Ensure that you do not cheat, hardcode test results, or bypass verification. Follow the integrity mode requirements (benchmark).
