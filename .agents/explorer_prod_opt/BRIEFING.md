# BRIEFING — 2026-07-09T00:25:00Z

## Mission
Investigate production setup, memory leaks, logging verbosity, and React rendering bottlenecks in WFP CRM.

## 🔒 My Identity
- Archetype: explorer
- Roles: Teamwork explorer, read-only investigator
- Working directory: c:\Users\brend\Desktop\XX2\.agents\explorer_prod_opt
- Original parent: 31e43e60-c4fb-4080-9f6c-379843de347c
- Milestone: Performance & Memory Optimization / Exploration and Feasibility Analysis

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Code-only network mode (no external web/HTTP access)

## Current Parent
- Conversation ID: 31e43e60-c4fb-4080-9f6c-379843de347c
- Updated: 2026-07-09T00:25:00Z

## Investigation State
- **Explored paths**:
  - `server.ts`
  - `server/db.ts`, `server/costGuard.ts`, `server/selfHealing.ts`, `server/telemetry.ts`, `server/validation.ts`, `server/queueFallback.ts`, `server/inboundService.ts`
  - `src/pages/FacebookLeads.tsx`, `src/pages/VslGenerator.tsx`, `src/pages/Zapalnik.tsx`, `src/pages/Dashboard.tsx`, `src/pages/GmailIntegration.tsx`
  - `src/components/zapalnik/PipelineKanban.tsx`, `src/components/zapalnik/LeadCard.tsx`
  - `src/components/vsl/VslScriptPartCard.tsx`
  - `vite.config.ts`, `package.json`
- **Key findings**:
  1. **Production Mode Setup**: Controlled in `server.ts` via `process.env.NODE_ENV === 'production'`. A path resolution bug is present: `path.resolve(_dirname, 'dist')` evaluates to `dist/dist/` when running from the esbuild output `dist/server.cjs`, causing 404s on all static files.
  2. **Memory Leaks**: `VslGenerator.tsx` overwrites `abortControllerRef.current` with the latest task's controller, leaving previously started tasks running on unmount. `Zapalnik.tsx` polling interval is uncontrolled and can run overlapping async fetches. `GmailIntegration.tsx` lacks abort controllers or mount checks for its email fetch effect.
  3. **Excessive logs**: `server.ts` verbosely logs Bull queue status, critic/sandbox AST outputs, and full LLM text responses. `inboundService.ts` logs fallback triggers and database seeds. Needs a custom logger wrapper checking `NODE_ENV`.
  4. **Rendering Bottlenecks**: `VslGenerator.tsx` passes a shared `previewModes` object reference to `VslScriptPartCard` components, breaking `React.memo` memoization whenever any single card changes mode. `Zapalnik.tsx` triggers Firestore writes for all leads on every 5s polling iteration, and performs expensive `JSON.stringify` array checks.
- **Unexplored areas**: None. Scope fully completed.

## Key Decisions Made
- Proceed with writing final handoff.md and communicating findings to orchestrator.

## Artifact Index
- c:\Users\brend\Desktop\XX2\.agents\explorer_prod_opt\handoff.md — Analysis and findings handoff report
