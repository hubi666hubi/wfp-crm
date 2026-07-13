# BRIEFING — 2026-07-08T20:06:55Z

## Mission
Explore CRM codebase for Lead, Event (ZAPALNIK_CLIP), Campaign, and EvolutionLog fields and design Firebase Data Connect PostgreSQL schema and queries/mutations.

## 🔒 My Identity
- Archetype: explorer
- Roles: explorer, db_schema_designer
- Working directory: c:\Users\brend\Desktop\XX2\.agents\explorer_db_2
- Original parent: c5e66d16-0664-495a-8839-1b426a2979f8
- Milestone: Database Schema Design

## 🔒 Key Constraints
- Read-only investigation — do NOT implement (except writing reports, handoff, and proposed files in my own folder)
- Must follow Firebase SQL Connect skill references (c:\Users\brend\Desktop\XX2\.agents\skills\firebase_data_connect_basics\SKILL.md)
- Network mode: CODE_ONLY (no external web access)

## Current Parent
- Conversation ID: c5e66d16-0664-495a-8839-1b426a2979f8
- Updated: 2026-07-08T20:06:55Z

## Investigation State
- **Explored paths**:
  - `server/db.ts`
  - `server/selfEvolution.ts`
  - `server/validation.ts`
  - `server.ts`
  - `server/necropolisService.ts`
  - `src/pages/Nekropolis.tsx`
  - `services/syndicateService.ts`
  - `src/components/zapalnik/types.ts`
  - `src/components/facebook/types.ts`
  - `src/pages/AutomationHub.tsx`
  - `src/components/dashboard/CampaignConversionChart.tsx`
  - `firebase-blueprint.json`
- **Key findings**:
  - Unified CRM Lead properties (basic contact info, qualification score, status, priority, and reanimation fields).
  - Identified telemetry Event structure for `ZAPALNIK_CLIP`.
  - Identified Campaign marketing metrics and conversion chart history.
  - Identified self-evolving agent EvolutionLog structures (critic analysis, patches, reports, and execution logs).
- **Unexplored areas**: None, the codebase exploration is fully complete.

## Key Decisions Made
- Stored nested/semi-structured fields (`aiEnrichment`, `dmSequence`, `chatHistory`, `pitchCard`, `tacticalBrief` in Lead, and `critic`, `patch`, `report`, `deployment` in EvolutionLog) as SQL Connect `Any` type (PostgreSQL `jsonb`). This matches the existing client-side JSON format and prevents database join overhead.
- Used `@ref` to model one-to-many relationship between `Campaign` and `Lead` / `CampaignConversion`.
- Standardized security using `@auth(level: USER)` and CEL expressions (`userId_expr: "auth.uid"`).

## Artifact Index
- c:\Users\brend\Desktop\XX2\.agents\explorer_db_2\handoff.md — Main handoff and analysis report
- c:\Users\brend\Desktop\XX2\.agents\explorer_db_2\schema\schema.gql — Proposed Data Connect schema
- c:\Users\brend\Desktop\XX2\.agents\explorer_db_2\dataconnect.yaml — Proposed Data Connect configuration
- c:\Users\brend\Desktop\XX2\.agents\explorer_db_2\connector\connector.yaml — Proposed Connector configuration
- c:\Users\brend\Desktop\XX2\.agents\explorer_db_2\connector\queries.gql — Proposed GraphQL queries
- c:\Users\brend\Desktop\XX2\.agents\explorer_db_2\connector\mutations.gql — Proposed GraphQL mutations
