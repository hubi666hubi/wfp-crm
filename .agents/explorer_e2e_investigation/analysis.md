# Analysis: E2E Testing Framework Design for WFP CRM

This document presents a comprehensive analysis of the WFP CRM codebase and designs a robust End-to-End (E2E) testing framework using Node.js's native test runner (`node:test`) and TypeScript execution (`tsx`).

---

## 1. Page Component & User Flow Analysis

### F1: Facebook Leads (`src/pages/FacebookLeads.tsx`)
*   **User Flows & Tabs**:
    *   `feed`: Virtual Group Monitor. Shows simulated posts matching monitored keywords.
    *   `paste`: Manual scanner where users can paste raw text, author, and group to analyze.
    *   `leads`: Database tab showing saved leads. Includes a detailed outreach drawer.
    *   `sentiment`: Real-time psychological sentiment and prioritization analyzer.
    *   `machine`: Organic Growth Loop Machine generator.
    *   `integrations`: FB integration panel with promo code activation.
*   **Input Fields & Form Submissions**:
    *   Keyword Monitor Input: `newKeyword` text field, added on submit.
    *   Offer Profile Settings: `yourOffer` textarea, `customInstructions` text input.
    *   Manual Paste Input: `pastedText` textarea, `pastedAuthor` and `pastedGroup` text inputs.
    *   Sentiment text input: `sentimentText` textarea.
    *   Promo Code Input: `promoCode` text input (matching `"OJCIEC"` or `"SMOKE"` to unlock VIP features).
*   **State Changes**:
    *   `activeTab` controls showing sections.
    *   `simulatedPosts`, `savedLeads`, `keywords`, `growthMachine`, `sentimentResult`.
    *   `loading` and `loadingStep` control a full-screen blocking overlay during AI extraction.
*   **API Endpoints & Network Calls**:
    *   `GET /api/messenger/config` / `POST /api/messenger/config` (Save config)
    *   `POST /api/facebook/growth-machine` (Generate organic machine)
    *   `POST /api/facebook-leads/generate-simulated-post` (Add random post)
    *   `POST /api/facebook-leads/sentiment-analysis` (Psychological analyzer)
    *   `POST /api/facebook-leads/simulate-feed` (Load feed posts)
    *   `GET /api/facebook-leads?userId={userId}` (Fetch leads database)
    *   `POST /api/facebook-leads/analyze` (Run deep analysis and save lead)
    *   `POST /api/facebook-leads/delete` (Remove lead)
    *   `POST /api/facebook-leads/update-status` (Update status)

### F2: VSL Generator (`src/pages/VslGenerator.tsx`)
*   **User Flows**:
    *   Input form fields defining client pain and product parameters.
    *   VSL Script generation, loading into a multi-part storyboard list.
    *   Storyboard preview (with SpeechSynthesis playback) and 2D/3D visualization options.
    *   History restoration and local draft autosaving.
    *   Outreach integration sending custom emails via Gmail API.
*   **Input Fields & Form Submissions**:
    *   `topic` (Target Client Pain) textarea.
    *   `parameters`: `productName`, `targetAudience`, `mainProblem`, `keyBenefits`, `videoQuality`.
    *   Validation checks: Blocks generation and highlights input fields in red if empty.
    *   Outreach form: `outreachClientName` and `outreachClientEmail` text inputs.
*   **State Changes & Stores**:
    *   Zustand stores: `useVslStore` (script parts, parameters, loading states), `useCronStore`, `useSystemLogsStore`.
    *   `previousScripts` (Firestore history), `voices` (SpeechSynthesis).
*   **API Endpoints & Network Calls**:
    *   `POST /api/generate-vsl` (Generate script parts)
    *   `POST /api/generate-outreach` (Personalized email generation)
    *   Firestore DB calls: `vsl_scripts` collection (save/retrieve script history), `clients` collection (save outreach lead).
    *   Google Drive Upload API: `POST https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`
    *   Gmail Send API: `POST https://gmail.googleapis.com/gmail/v1/users/me/messages/send`

### F3: Zapalnik CRM (`src/pages/Zapalnik.tsx`)
*   **User Flows**:
    *   Pipeline Board: Kanban view displaying leads organized in 5 columns by status.
    *   "Kolejka ZRZUT (FAST-LANE)" header displaying high-priority target leads dynamically.
    *   Detailed SDR Drawer containing "Profil" (bio & AI enrichment), "Sekwencja" (4-step DM follow-up), and "Symulator" (interactive chat).
    *   Action generation modals: Pitch-Card (sales offer and HTML email) and Tactical Brief (combat objections & MEDDPICC).
    *   Lead Magnet simulator page for e-book delivery.
*   **Input Fields & Form Submissions**:
    *   Manual Lead modal: `newLeadName`, `newLeadBio`, `newLeadSource`.
    *   Simulator chat: `chatMessageText` input.
    *   Lead Magnet: `email`, `pain` inputs.
*   **State Changes**:
    *   `leads` list, `selectedLeadId` representing selected drawer.
    *   `militaryModeEnabled` toggling Military tactical mode (SDR Tactical Combat Mode).
    *   `localChat` keeping chat simulator history.
*   **API Endpoints & Network Calls**:
    *   `GET /api/inbound-leads` (Polls every 5s)
    *   `POST /api/inbound-lead/status` (Update status)
    *   `POST /api/inbound-lead` (Create manual lead and run AI scoring)
    *   `POST /api/inbound-lead/enrich` (Fetch icebreakers & objections)
    *   `POST /api/inbound-lead/sequence` (Generate 4-step sequence)
    *   `POST /api/inbound-lead/pitch-card` (Generate B2B Offer & ROI)
    *   `POST /api/inbound-lead/tactical-brief` (Generate military Battlecard)
    *   `POST /api/inbound-lead/chat` (Send message to chat simulator)
    *   `POST /api/inbound-lead/chat/history` (Reset chat simulator)

---

## 2. Backend Services & Interface Contracts

### Server Configuration (`server.ts`)
*   Runs on port 3000.
*   Acts as the API proxy and hosts queue controllers.
*   Imports local business services: `necropolisService`, `syndicateService`.
*   Note: While Express server handles queue (`/api/queue/enqueue`), clients (`/api/clients`), and syndicate analysis (`/api/crm/syndicate-analysis`), the page-specific AI/CRM APIs are currently processed on the client or mapped to services. The E2E mock server must completely stub these endpoints.

### F4: AI Studio Vector Search & Key Rotation Contract
*   **Endpoint**: `POST /api/handle-aistudio-call`
*   **Request Body**:
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
*   **Response Body**:
    ```typescript
    [
      {
        id: string;
        content: string;
        similarity: number;
      }
    ]
    ```
*   **Errors & Key Rotation**:
    *   `400 Bad Request`: Missing mandatory parameters.
    *   `429 Too Many Requests`: Triggered when Gemini API quota is exhausted. Response includes fallback key rotation metadata (e.g. `{ error: "Quota exhausted", rotated: true, nextKeyPlaceholder: "..." }`).
    *   `500 Internal Server Error`: Server crashes.

---

## 3. Testing Strategy Proposal

### High-Level Architecture
We propose a **Dual-Track Testing Setup** running programmatically **without a full browser**, executed via **`node:test`** and **`tsx`**. 

Instead of a heavy Puppeteer/Playwright browser process (which is slow, fragile, and requires network access to download browser binaries), we will establish a **Lightweight DOM Environment** directly in the Node.js test thread.

```
+-------------------------------------------------------------+
|                     Node.js Test Runner                     |
|                                                             |
|   +-----------------------------------------------------+   |
|   |         node:test Runner + tsx Compiler             |   |
|   +-----------------------------------------------------+   |
|                              |                              |
|   +-----------------------------------------------------+   |
|   |     happy-dom (Global Window, Document, DOM)        |   |
|   +-----------------------------------------------------+   |
|                              |                              |
|   +-------------------+  +---------------+  +-----------+   |
|   | React Components  |  | Zustand State |  | Firebase  |   |
|   |  (mounted by RTL) |  |   (Stores)    |  | Mock SDK  |   |
|   +-------------------+  +---------------+  +-----------+   |
|                              |                              |
|   +-----------------------------------------------------+   |
|   |     Mock Server Interceptor (Intercepts fetch)      |   |
|   +-----------------------------------------------------+   |
+-------------------------------------------------------------+
```

### Proposed Tech Stack (Npm Packages to Install)
We recommend installing the following `devDependencies`:
1.  **`happy-dom`**: A fast, lightweight web browser emulator in JS. Much faster than JSDOM and implements newer web APIs.
2.  **`@testing-library/react`**: React Testing Library (RTL) to mount React pages, trigger events, and perform assertions.
3.  **`@testing-library/dom`**: Core DOM queries.

### Stubs & Mocks Requirements
Since tests run in Node.js, we must stub browser-only and external integrations:
1.  **Speech Synthesis (`window.speechSynthesis`)**:
    Must stub `window.speechSynthesis` methods (`speak`, `cancel`, `getVoices`, `onvoiceschanged`) and `window.SpeechSynthesisUtterance` constructor in `setupDom.ts` to prevent page crashes in F2.
2.  **Clipboard (`navigator.clipboard`)**:
    Stub `navigator.clipboard.writeText` to record copy operations and check copied strings.
3.  **Local Storage (`localStorage`)**:
    Stub with an in-memory dictionary to verify VSL drafts auto-save and ZRZUT parameter exchanges.
4.  **Google Drive/Gmail APIs & Firebase Client SDK**:
    We mock `firebase/app`, `firebase/auth`, and `firebase/firestore`. We redirect all Firebase database queries and authentication checks to an in-memory dictionary.
5.  **Global Fetch (`globalThis.fetch`)**:
    Intercept relative `/api/...` calls and direct them to our custom `MockServer`.

---

## 4. Test Infrastructure & Mock Server Design

### Setup file (`tests/setupDom.ts`)
Executes before tests run. Registers globals and mocks:
```typescript
import { Window } from 'happy-dom';

const window = new Window();
globalThis.window = window as any;
globalThis.document = window.document as any;
globalThis.navigator = window.navigator as any;

// Stub SpeechSynthesis
globalThis.window.speechSynthesis = {
  speak: () => {},
  cancel: () => {},
  getVoices: () => [],
  onvoiceschanged: null
} as any;
globalThis.SpeechSynthesisUtterance = class {} as any;

// Stub Clipboard
Object.defineProperty(globalThis.navigator, 'clipboard', {
  value: {
    writeText: async (text: string) => {
      globalThis.navigator.clipboard.lastWritten = text;
    },
    lastWritten: ""
  },
  writable: true
});
```

### Mock Server (`tests/mockServer.ts`)
Intercepts HTTP traffic and simulates API routes:
```typescript
export class MockServer {
  private routes = new Map<string, Function>();
  public callCount = new Map<string, number>();

  constructor() {
    this.setupRoutes();
  }

  private setupRoutes() {
    // F1 Routes
    this.routes.set('POST:/api/facebook-leads/simulate-feed', () => [
      { id: '1', authorName: 'Marek', groupName: 'IT', postText: 'Szukam programisty' }
    ]);
    // F2 Routes
    this.routes.set('POST:/api/generate-vsl', (body: any) => ({
      scriptParts: [{ index: 0, title: 'Hook', text: `Witaj w ${body.productName}!` }]
    }));
    // F3 Routes
    this.routes.set('GET:/api/inbound-leads', () => [
      { id: 'lead_1', name: 'Michal', status: 'Inbound (Wtyczka)', score: 90 }
    ]);
    // F4 Route with dynamic responses (Key Rotation)
    this.routes.set('POST:/api/handle-aistudio-call', (body: any) => {
      const key = body.geminiApiKey;
      if (key === 'exhausted_key') {
        return { status: 429, body: { error: 'Quota exhausted', fallbackKeyActive: true } };
      }
      return { status: 200, body: [{ id: 'doc_1', content: 'Matched content', similarity: 0.95 }] };
    });
  }

  public handle(url: string, options: any) {
    const method = options?.method || 'GET';
    const cleanUrl = url.split('?')[0];
    const routeKey = `${method}:${cleanUrl}`;
    
    this.callCount.set(routeKey, (this.callCount.get(routeKey) || 0) + 1);
    
    const handler = this.routes.get(routeKey);
    if (!handler) {
      return { status: 404, body: { error: 'Not found' } };
    }
    
    const body = options?.body ? JSON.parse(options.body) : {};
    const result = handler(body);
    if (result && result.status) return result;
    return { status: 200, body: result };
  }
}
```

---

## 5. E2E Test Cases Outline (Tiers 1-4)

### Tier 1: Happy Paths (Sanity Tests)
*   **Test Case 1.1: Facebook Leads flow (F1)**
    *   *Steps*: Render `<FacebookLeads />`, load simulated feed, verify mock posts display, click "Analizuj post" on the first post, verify drawer transitions to Leads tab, and check that AI details load.
*   **Test Case 1.2: VSL Generation (F2)**
    *   *Steps*: Render `<VslGenerator />`, populate parameters (Product Name, Pain, Audience), click "Generuj Skrypt VSL", verify `scriptParts` populate and display in the storyboard list.
*   **Test Case 1.3: Zapalnik Kanban Board (F3)**
    *   *Steps*: Render `<Zapalnik />` in `'pipeline'` tab, confirm mock inbound leads display in the first column, trigger "Dodaj leada ręcznie" modal, fill details, submit, and verify new lead joins the pipeline.
*   **Test Case 1.4: AI Studio Vector Search (F4)**
    *   *Steps*: Trigger direct call to `/api/handle-aistudio-call` with correct keys and query, assert response contains array of items with `id`, `content`, and `similarity`.

### Tier 2: Boundary Values & Error Handling
*   **Test Case 2.1: Facebook Leads empty search & constraints (F1)**
    *   *Steps*: Enter non-existent keyword in feed search, verify feed is empty. Try adding an existing keyword in the monitor panel, verify error toast notifies about duplicates.
*   **Test Case 2.2: VSL Form Validation (F2)**
    *   *Steps*: Click "Generuj Skrypt VSL" with empty fields, verify generation is blocked, error object triggers, and inputs get red border indicators.
*   **Test Case 2.3: Zapalnik manual validation (F3)**
    *   *Steps*: Submit manual lead form with empty Name and Bio, verify toast warning triggers and form submission is prevented.
*   **Test Case 2.4: AI Studio Bad Request (F4)**
    *   *Steps*: Call `/api/handle-aistudio-call` with missing `query` or `supabaseUrl`, assert response returns `400 Bad Request`.

### Tier 3: Cross-Feature Integrations
*   **Test Case 3.1: Promo Code to Zapalnik Sync (F1 + F3)**
    *   *Steps*: Go to Facebook Leads tab, enter promo code `"OJCIEC"`, assert secret VIP groups unlock. Verify that high-ticket simulated leads sync and appear in the "Kolejka ZRZUT (FAST-LANE)" of Zapalnik CRM Kanban board.
*   **Test Case 3.2: VSL Outreach client registration (F2 + F3)**
    *   *Steps*: Generate script in Vsl Generator. Fill Outreach campaign form with client details, click "Wyślij i zarejestruj". Check that the client is saved in Firestore `clients` collection and Gmail Integration api is invoked.
*   **Test Case 3.3: AI Studio Key Rotation (F4 + Server)**
    *   *Steps*: Send request to `/api/handle-aistudio-call` with `geminiApiKey: "exhausted_key"`. Assert response returns `429` error with key rotation details. Verify server logic intercepts the error, swaps the key with a fallback key, and succeeds on retry.

### Tier 4: Complex Workloads (End-to-End Campaign Flow)
*   **Test Case 4.1: Sandbox Tycoon Outreach Campaign**
    *   *Steps*:
        1. Login as Demo User (`signInAsDemoUser()`), caching token.
        2. Load Facebook Leads, search post text, and analyze sentiment.
        3. Copy sentiment response to clipboard (`navigator.clipboard.writeText`).
        4. Navigate to Vsl Generator, load copied pain points, and generate VSL script.
        5. Trigger local draft auto-save and Firestore history save.
        6. Go to Zapalnik CRM, confirm target lead is in "Kolejka ZRZUT".
        7. Open Lead drawer in Zapalnik, trigger AI Enrichment, DM Sequence, Pitch-Card (extract HTML template), and Tactical Brief (Military Mode).
        8. Send 3 chat simulator messages, confirm response generation, and reset chat history.
        9. Call AI Studio API `/api/handle-aistudio-call` to index context, simulating a 429 quota exhaustion that triggers automatic key rotation and retrieves final similarity documents.

---

## 6. Recommendations & Implementation Steps

1.  **Install Node packages**:
    Execute:
    ```bash
    npm install --save-dev happy-dom @testing-library/react @testing-library/dom
    ```
2.  **Add Test Script**:
    Add the test command to `package.json`:
    ```json
    "scripts": {
      "test": "node --import tsx --test server/*.test.ts tests/**/*.test.tsx"
    }
    ```
3.  **Build Mock Infrastructure**:
    Implement the DOM environment setup (`tests/setupDom.ts`), mock server router (`tests/mockServer.ts`), and Firebase adapter mocks.
4.  **Implement Test Suites**:
    Write the test files following the Tier 1-4 design outlines. Ensure that Zustand stores are reset between test runs using hooks.
