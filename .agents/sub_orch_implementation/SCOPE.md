# Scope: Implementation Track

## Architecture
- Refactoring huge page files into smaller components under `src/components/{facebook,vsl,zapalnik}/`.
- Enhancing rendering performance via `React.memo`, `useMemo`, and `useCallback`.
- Ensuring robust lifecycle cleanups in `useEffect`.
- Restructuring/stabilizing Express backend endpoints, key rotation mechanisms, and Vite dev server proxies.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Page Modularity (React component extraction) | Extract subcomponents from FacebookLeads, VslGenerator, Zapalnik pages | None | DONE |
| 2 | Code Optimization | Apply React.memo, useCallback, useMemo, and useEffect cleanups | M1 | DONE |
| 3 | Backend API & Gemini | Implement /api/handle-aistudio-call, fix server listener and proxy configs | None | IN_PROGRESS (Conv: f79063c9, 3fedd953, 6fde59ed) |
| 4 | Test Integration | Pass all Tier 1-4 tests (wait for TEST_READY.md) | M2, M3 | PLANNED |
| 5 | Adversarial Hardening | Run Challenger loop for Tier 5 coverage and edge case bugfixes | M4 | PLANNED |
