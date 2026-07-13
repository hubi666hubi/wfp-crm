# Project: WFP CRM Performance Optimization and Refactoring

## Architecture
WFP CRM is a client-server application built on React (Vite) on the frontend and Express on the backend.
- **Frontend**: Utilizes Zustand for state management, Tailwind CSS for styling, Lucide React for iconography, and Framer Motion (`motion/react`) for animation. Coordinates with Firebase Auth, Firestore, and the Express backend.
- **Backend**: Express app executing on Node.js. It manages API requests for CRM operations, integrates with `@google/genai` for LLM tasks, and needs integration with Supabase for vector search / document matching.
- **Data Flow**:
  - React components issue API fetches (using relative paths e.g., `/api/...`) to the dev/production server.
  - The Express backend handles these, interacts with external services (Firebase, Gemini API, Supabase database), and returns structured JSON responses.

## Code Layout
- `src/pages/` — Page components (FacebookLeads, VslGenerator, Zapalnik, Settings, etc.)
- `src/components/` — General components. Refactored subcomponents should go into subdirectories:
  - `src/components/facebook/` — Extracted Facebook-specific UI.
  - `src/components/vsl/` — Extracted VSL-specific UI.
  - `src/components/zapalnik/` — Extracted Zapalnik-specific UI.
- `server.ts` — Main Express backend entry point.
- `server/` — Server helper scripts, mock JSONs, and test suites.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | E2E Testing Track | Define test infra, write Tier 1-4 tests, write `TEST_READY.md` | None | IN_PROGRESS (Conv: 43232522-c4c5-4e90-b2f6-946d764f11d5) |
| M2 | Component Extraction | Modularize Zapalnik, FacebookLeads, VslGenerator page files | None | IN_PROGRESS (Conv: 31800add-1441-4827-98dd-cc901044d991) |
| M3 | API Stabilization & Gemini Rotation | Fix Express server, Vite dev proxy, implement `/api/handle-aistudio-call` with key rotation | None | IN_PROGRESS (Conv: 31800add-1441-4827-98dd-cc901044d991) |
| M4 | Integration & E2E Verification | Pass all E2E tests, resolve regressions, verify build/TSC health | M1, M2, M3 | PLANNED |
| M5 | Adversarial Hardening | Tier 5 white-box gap analysis, generate and pass adversarial tests | M4 | PLANNED |

## Interface Contracts

### 1. `/api/handle-aistudio-call`
- **Method**: `POST`
- **Request Body**:
  ```typescript
  {
    supabaseUrl: string;
    supabaseServiceRoleKey: string;
    geminiApiKey: string;
    query: string;
    limit?: number;
    matchThreshold?: number;
  }
  ```
- **Response Body**:
  ```typescript
  {
    embeddingLength: number;
    documents: [
      {
        id: string;
        content: string;
        similarity: number;
      }
    ]
  }
  ```
- **Errors**:
  - `400 Bad Request` if mandatory fields are missing.
  - `429 Too Many Requests` on Gemini quota exhaustion with fallback key rotation details.
  - `500 Internal Server Error` on general server crashes.

### 2. Frontend React Event Handlers
- Any event handlers passed to mapping lists (`.map(...)`) must have stable references using `useCallback` or static declarations to prevent excessive re-renders of list items.
- Any side-effects in React components must provide a cleanup function to prevent memory leaks (cancelling subscriptions, intervals, timers).
