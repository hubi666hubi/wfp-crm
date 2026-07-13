# Refactoring Analysis & Handoff Report: Zapalnik Page Subcomponent Extraction

## 1. Observation

In `src/pages/Zapalnik.tsx`, I observed the following:
* **Large Monolithic Structure**: The page file contains 2357 lines of code, encompassing page routing, state synchronization, lead magnet logic, a Kanban board, multiple sidebar drawers, sandbox simulators, and complex visual modals.
* **Inline Subcomponents/Structures**:
  * **TypeScript Interfaces**: Lines 22-99
    ```typescript
    export interface AIEnrichment { ... }
    export interface DMStep { ... }
    export interface ChatMessage { ... }
    export interface PitchCardData { ... }
    export interface TacticalBriefData { ... }
    export interface InboundLead { ... }
    ```
  * **Global Constants**: Lines 101-107 (`PIPELINE_COLUMNS`)
  * **Kanban Grid & Board**: Lines 685-908 (Handles the Kanban columns, rendering card headers, card info, and stage migration triggers).
  * **Lead Magnet Creator**: Lines 911-1006 (Form inputs for email, pain points, sending simulation e-book, and conversion stats).
  * **Lead Details Drawer**: Lines 1025-1625 (Side panel sliding view displaying details, actions, and three sub-tabs: Profile, DM Sequence, and Coach Simulator).
    * Sub-tab **Profile**: Lines 1271-1396 (Draft message, AI enrichment triggers, budget, icebreakers, objections and ripostes).
    * Sub-tab **Sequence**: Lines 1398-1487 (4-step DM campaign timeline).
    * Sub-tab **Simulator**: Lines 1490-1608 (Interactive sandbox chat with Senior Coach scoring).
  * **Add Lead Modal**: Lines 1630-1724 (Form modal for manual lead creation).
  * **Pitch-Card Modal**: Lines 1727-2022 (Interactive layout displaying One-Pager details, ROI charts, proposed automations, and HTML email exporter).
  * **Tactical Brief Modal**: Lines 2025-2353 (HUD panel displaying MEDDPICC qualification, vulnerabilities, and combat shields).
* **State & Network Interactions**:
  * Uses Firestore and Firebase Auth (`db`, `auth`) on lines 150-173 inside a 5-second polling `useEffect` to fetch inbound leads from `/api/inbound-leads`.
  * Integrates with G-Suite Gmail endpoints (e.g. `https://gmail.googleapis.com/gmail/v1/...`) on lines 259-280.
  * Triggers multiple asynchronous AI processes via POST requests to `/api/inbound-lead/enrich`, `/api/inbound-lead/sequence`, `/api/inbound-lead/pitch-card`, `/api/inbound-lead/tactical-brief`, and `/api/inbound-lead/chat`.

## 2. Logic Chain

1. **Maintainability**: A single React page file exceeding 2000 lines is difficult to maintain, trace, and debug. Extracting subcomponents into modular files under a single folder (`src/components/zapalnik/`) will partition concerns cleanly.
2. **Performance**: Real-time state polling (every 5 seconds) updates the `leads` state. Because all Kanban columns, cards, drawers, and modals are inline, *every* poll cycle causes a full re-render of all elements in the DOM.
3. **Memoization (React.memo)**: By extracting subcomponents (such as `LeadCard` or columns) and wrapping them in `React.memo`, we can prevent re-rendering when the lead's properties have not changed.
4. **Stable References (useCallback)**: Passing callback handlers (`migrateStatus`, `selectStatus`, `triggerAIEnrichment`) directly to nested components without stable references causes cache invalidation in memoized subcomponents. Wrapping these handlers in `useCallback` solves this.
5. **Decoupling Types**: Centralizing TypeScript definitions in a separate `types.ts` file ensures clean imports without circular dependencies.

## 3. Caveats

* The G-Suite/Gmail integration depends on `getAccessToken()` from `../lib/auth`. This needs to be imported or passed down cleanly.
* Page sub-components (`GmailIntegration`, `CrmMeetingSummarizer`) are imported from the parent directory (`src/pages`). When extracting components to `src/components/zapalnik/`, correct import paths (`../../pages/...`) must be used.
* The fast-lane "Operation Zrzut" simulation logic (lines 176-211) uses `localStorage`. This should remain in the parent page and pass down the parsed simulated leads as part of the `leads` prop to ensure separation of concern.

## 4. Conclusion & Proposed Strategy

I suggest extracting the monolithic structures in `Zapalnik.tsx` into **8 modular subcomponents** located in `src/components/zapalnik/`.

### Proposed File Layout

```
src/components/zapalnik/
├── types.ts                   # Unified types & shared constants
├── PipelineKanban.tsx         # Tab 1: Kanban Board & Column Grid
├── LeadCard.tsx               # Individual Lead Card (Memoized)
├── LeadMagnetCreator.tsx      # Tab 2: Lead Magnet Form & Stats
├── LeadDetailsDrawer.tsx      # Side panel: Lead Profile, Sequence, Sandbox Simulator
├── AddLeadModal.tsx           # Modal: Add Manual Lead form
├── PitchCardModal.tsx         # Modal: B2B Pitch-Card Document Viewer
└── TacticalBriefModal.tsx     # Modal: Military Battle Brief HUD
```

### Component Details & Code Strategy

#### 1. `types.ts`
* Move `AIEnrichment`, `DMStep`, `ChatMessage`, `PitchCardData`, `TacticalBriefData`, and `InboundLead` interfaces here.
* Move `PIPELINE_COLUMNS` here.

#### 2. `PipelineKanban.tsx`
* Renders the filter bar, live sync status, and columns.
* Renders each status column using `.map(...)`.
* Renders a list of `LeadCard`s.
* **Props Interface**:
  ```typescript
  import { InboundLead } from './types';
  interface PipelineKanbanProps {
    leads: InboundLead[];
    selectedLeadId: string | null;
    setSelectedLeadId: (id: string | null) => void;
    migrateStatus: (leadId: string, currentStatus: string, direction: 'forward' | 'backward') => Promise<void>;
    onAddLeadClick: () => void;
  }
  ```

#### 3. `LeadCard.tsx` (Wrapped in `React.memo`)
* Renders the individual card with animation (`motion.div`), details, and migration buttons.
* **Props Interface**:
  ```typescript
  import { InboundLead } from './types';
  interface LeadCardProps {
    lead: InboundLead;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onMigrate: (leadId: string, currentStatus: string, direction: 'forward' | 'backward') => void;
    isFirstColumn: boolean;
    isLastColumn: boolean;
  }
  ```

#### 4. `LeadMagnetCreator.tsx`
* Manages G-Suite email capturing/sending and the analytics panel.
* Can manage its own internal input states (`email`, `pain`, `generating`, `success`, `errorMessage`).
* Uses G-Suite Gmail helper functions.
* **Props Interface**:
  ```typescript
  interface LeadMagnetCreatorProps {
    sendEmail: (to: string, subject: string, body: string) => Promise<void>;
  }
  ```

#### 5. `LeadDetailsDrawer.tsx`
* Houses the side panel, tabs (`profil`, `sekwencja`, `symulator`), and updates the sub-tab rendering.
* Handles:
  * Profile Tab: Icebreakers list, objection defenses, and AI enrichment trigger.
  * Sequence Tab: 4-stage campaign mapping.
  * Simulator Tab: Chat window, senior coach advice scoring.
* **Props Interface**:
  ```typescript
  import { InboundLead, ChatMessage } from './types';
  interface LeadDetailsDrawerProps {
    lead: InboundLead;
    onClose: () => void;
    selectStatus: (leadId: string, status: string) => Promise<void>;
    militaryModeEnabled: boolean;
    triggerPitchCardGeneration: (leadId: string) => Promise<void>;
    isGeneratingPitchCard: boolean;
    onOpenPitchCard: () => void;
    triggerTacticalBriefGeneration: (leadId: string) => Promise<void>;
    isGeneratingTacticalBrief: boolean;
    onOpenTacticalBrief: () => void;
    drawerTab: 'profil' | 'sekwencja' | 'symulator';
    setDrawerTab: (tab: 'profil' | 'sekwencja' | 'symulator') => void;
    triggerAIEnrichment: (leadId: string) => Promise<void>;
    isEnriching: boolean;
    triggerAISequence: (leadId: string) => Promise<void>;
    isGeneratingSequence: boolean;
    localChat: ChatMessage[];
    chatMessageText: string;
    setChatMessageText: (text: string) => void;
    isSendingChat: boolean;
    sendSimulationMessage: () => Promise<void>;
    clearSimulationChat: () => Promise<void>;
  }
  ```

#### 6. `AddLeadModal.tsx`
* Form modal dialog.
* **Props Interface**:
  ```typescript
  interface AddLeadModalProps {
    isOpen: boolean;
    onClose: () => void;
    newLeadName: string;
    setNewLeadName: (val: string) => void;
    newLeadBio: string;
    setNewLeadBio: (val: string) => void;
    newLeadSource: string;
    setNewLeadSource: (val: string) => void;
    isCreatingLead: boolean;
    onSubmit: (e: React.FormEvent) => void;
  }
  ```

#### 7. `PitchCardModal.tsx`
* Displays individual One-Pager metrics, estimated ROI, harmonogram milestones, and template.
* **Props Interface**:
  ```typescript
  import { InboundLead } from './types';
  interface PitchCardModalProps {
    isOpen: boolean;
    onClose: () => void;
    lead: InboundLead;
    triggerPitchCardGeneration: (leadId: string) => Promise<void>;
    isGeneratingPitchCard: boolean;
  }
  ```

#### 8. `TacticalBriefModal.tsx`
* Displays mission tactical battle briefs and outreach op-script.
* **Props Interface**:
  ```typescript
  import { InboundLead } from './types';
  interface TacticalBriefModalProps {
    isOpen: boolean;
    onClose: () => void;
    lead: InboundLead;
    triggerTacticalBriefGeneration: (leadId: string) => Promise<void>;
    isGeneratingTacticalBrief: boolean;
  }
  ```

## 5. Verification Method

1. **Static Analysis (TypeScript compilation)**: Run `tsc --noEmit` from the project root directory (once refactored) to verify there are no import path or prop type errors.
2. **Visual Inspection**:
   * Inspect the extracted files under `src/components/zapalnik/` to ensure all JSX structure matches the original layout from `Zapalnik.tsx`.
   * Check that event handlers passed as props in `Zapalnik.tsx` are wrapped with `useCallback` to prevent re-render regressions.
3. **End-to-End Test Suite**:
   * Execute the project's testing framework (e.g. `npm run test` or standard Vitest/Playwright tests for Zapalnik page actions) to verify Kanban status migrations and drawer tabs function exactly as before.
