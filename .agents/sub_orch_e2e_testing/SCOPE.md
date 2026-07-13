# Scope: E2E Testing Track

## Architecture
- Dual-track testing setup: Opaque-box, requirement-driven E2E tests.
- Infrastructure should support running tests against both local development (mock backend) and production server builds.
- Tests will execute using Node's native test runner (`node:test`) and tsx execution.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Test Infra & Tier 1 | Enumerate features, set up runner, write Tier 1 tests (happy-paths) | None | PLANNED |
| 2 | Tier 2 (Edge cases)  | Boundary values, empty inputs, limits, error handling | M1 | PLANNED |
| 3 | Tier 3 (Cross-feature) | Pairwise combinations of features | M2 | PLANNED |
| 4 | Tier 4 (Workloads)   | Realistic application scenarios and flows | M3 | PLANNED |
| 5 | Publish TEST_READY.md| Write test report and checklist, confirm 100% pass | M4 | PLANNED |

## Feature Checklist
- **F1: Facebook Leads page features** (simulated post, feed simulation, sentiment analysis configuration).
- **F2: Vsl Generator features** (custom model preview, Drive/Gmail backup inputs, campaign form).
- **F3: Zapalnik CRM features** (MEDDPICC table updates, chats, simulated lead flows).
- **F4: AI Studio endpoint** (Supabase query, embeddings search, key rotation on 429 status).
