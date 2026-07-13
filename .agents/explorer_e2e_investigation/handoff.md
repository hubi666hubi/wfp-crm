# Handoff Report: E2E Testing Framework Analysis & Design

This report outlines the observations, logic chain, and proposed design for the E2E testing framework of WFP CRM.

## 1. Observation
-   **File Paths & Key Components**:
    -   `src/pages/FacebookLeads.tsx` (Lines 1-800+): Tab-based UI managing simulated posts, keywords monitor, and sentiment analyzer. Calls endpoints `/api/facebook-leads/analyze`, `/api/facebook-leads/sentiment-analysis`, `/api/facebook-leads/simulate-feed`, etc.
    -   `src/pages/VslGenerator.tsx` (Lines 1-800+): Parameters validation form, VSL script generation, local storage draft caching, and outreach email campaign. Calls endpoints `/api/generate-vsl`, `/api/generate-outreach`, and uses browser `window.speechSynthesis`.
    -   `src/pages/Zapalnik.tsx` (Lines 1-800+): 5-column Kanban pipeline, drawer for lead details (AI enrichment, DM sequences, chat simulator), and tactical briefs (Military Mode). Calls endpoints `/api/inbound-leads`, `/api/inbound-lead/enrich`, `/api/inbound-lead/sequence`, `/api/inbound-lead/pitch-card`, etc.
    -   `server.ts` (Lines 1-132): Express app serving only queue routes, clients, and syndicate analysis. It does *not* define page-specific routes (e.g. `generate-vsl`, `facebook-leads/analyze`), which are part of milestone M3.
    -   `package.json` (Lines 1-67): Employs `tsx` as devDependency, but has no testing libraries for DOM testing (such as jsdom or happy-dom).
    -   `server/validation.test.ts` & `server/autonomy.test.ts`: Unit test files showing successful usage of Node's native `node:test` runner.

## 2. Logic Chain
-   The user request requires an E2E testing framework designed around `tsx` and the native Node.js test runner (`node:test`).
-   The frontend pages make network calls using relative URLs (e.g., `fetch('/api/...')`) and interact with Firebase client SDK database/auth.
-   Because the real backend endpoints are currently not fully implemented in the main repository (M3 is in progress), and because we operate in a restricted offline mode where external APIs (Firebase, Gemini AI, Supabase) are unavailable, a headless browser E2E framework (like Playwright/Puppeteer) would require mock setup anyway and would fail to install browser binaries without internet.
-   Therefore, the most robust, fast, and offline-compliant strategy is a **lightweight DOM environment (happy-dom)** with a custom **`MockServer`** that intercepts `globalThis.fetch` calls and a simulated **Firebase SDK mock**.
-   This design runs 100% within the Node process, supports both local mock testing and future production server testing (dual-track), and compiles on the fly using `tsx`.

## 3. Caveats
-   **Visual Testing Limitations**: Testing inside a lightweight DOM environment like `happy-dom` will not verify CSS layout issues, animations, or WebGL rendering (e.g. `@google/model-viewer` in F2 storyboard).
-   **API Completeness**: The mock server is designed to match the expected contracts. When the backend endpoints are finalized in M3, the mock server can be toggled off to direct requests to the real running server for production E2E testing (dual-track).
-   **Speech Synthesis**: Since Node.js does not have access to hardware speech systems, `window.speechSynthesis` is stubbed in `setupDom.ts`.

## 4. Conclusion
We recommend establishing the E2E testing framework using `happy-dom` and `@testing-library/react` running via `node --import tsx --test`. The framework should include:
-   `tests/setupDom.ts`: to stub global browser APIs (SpeechSynthesis, Clipboard, localStorage).
-   `tests/mockServer.ts`: to intercept `fetch` calls and return mock payloads for Tiers 1-4.
-   Five test suites mapping to Tiers 1-4 and covering features F1-F4.

## 5. Verification Method
1.  Verify that `node:test` + `tsx` works in the project root by running:
    ```powershell
    node --import tsx --test server/validation.test.ts
    ```
2.  Inspect the detailed analysis report at:
    `c:\Users\brend\Desktop\XX2\.agents\explorer_e2e_investigation\analysis.md`
