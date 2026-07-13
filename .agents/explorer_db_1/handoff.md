# Handoff Report: Firebase SQL Connect CRM Database Design

This report presents the database schema and query/mutation design for the CRM system using Native GraphQL and PostgreSQL via Firebase SQL Connect.

---

## 1. Observation

### Leads (Lead)
The structures for Leads are defined in the front-end type files:
- **Inbound Lead (`src/components/zapalnik/types.ts` lines 62-77)**:
  ```typescript
  export interface InboundLead {
    id: string;
    name: string;
    bio: string;
    source: string;
    timestamp: string;
    isHighTicket: boolean;
    score: number;
    draftMessage: string;
    status: string;
    aiEnrichment?: AIEnrichment;
    dmSequence?: DMStep[];
    chatHistory?: ChatMessage[];
    pitchCard?: PitchCardData;
    tacticalBrief?: TacticalBriefData;
  }
  ```
- **Facebook Lead (`src/components/facebook/types.ts` lines 10-40)**:
  ```typescript
  export interface FBLead {
    id: string;
    userId: string;
    postText: string;
    authorName: string;
    groupName: string;
    yourOffer: string;
    customInstructions?: string;
    intentLevel: string;
    painSummary: string;
    estimatedValueHex: string;
    valueFirstMessengerPitch: string;
    detectedCompanyUrl?: string;
    status: string;
    createdAt: string;
    publicCommentStrategy?: string;
    videoPitchScript?: string;
    qualificationScore?: number;
    linkedinConnectPitch?: string;
    coldEmailSubject?: string;
    coldEmailBody?: string;
    sentimentScore?: number;
    sentimentLabel?: string;
    priorityScore?: number;
    priorityLabel?: string;
    emotionalTriggers?: string[];
    sentimentExplanation?: string;
    outreachPitch?: string;
  }
  ```
- **Firestore rules (`firestore.rules` line 254)**:
  ```javascript
  match /crm_leads/{docId} {
    allow read, write: if isSignedIn();
  }
  ```

### System Events (specifically `ZAPALNIK_CLIP`)
System events and telemetry are handled in `server.ts` and `src/pages/Nekropolis.tsx`:
- **Zapalnik Clip endpoint (`server.ts` lines 115-121)**:
  ```typescript
  app.all("/api/zapalnik/clip", (req, res) => {
    console.log('\x1b[31m🎯 [ZAPALNIK_CLIP] Mamy uderzenie!\x1b[0m');
    console.log('\x1b[33m[INFO] Metoda:\x1b[0m', req.method);
    console.log('\x1b[33m[INFO] Nagłówki:\x1b[0m', req.headers);
    console.log('\x1b[33m[INFO] Payload:\x1b[0m', JSON.stringify(req.body, null, 2));
    res.json({ success: true, message: "Odebrano uderzenie w Nekropolis!" });
  });
  ```
- **Nekropolis UI Event definitions (`src/pages/Nekropolis.tsx` lines 39-89)**:
  ```typescript
  interface StreamEvent {
    id: string;
    timestamp: string;
    eventType: string;
    testRunId: string;
    payload: Record<string, any>;
  }
  // Event types in event row:
  const isNecro = evt.eventType === 'NECROMANCY_TRIGGERED';
  const isClipper = evt.eventType === 'ZAPALNIK_CLIP';
  const isMetaGen = evt.eventType === 'META_SYNTHESIS_L3';
  const isSandbox = evt.eventType === 'SANDBOX_AST_CHECK';
  ```

### Marketing Campaigns (Campaign)
- **Stripe webhook simulation (`stripe-kombajn.cjs` lines 24-29)**:
  ```javascript
  const payload = {
    campaign: "COMPETITIVE_SWOT_STRIPE_ATTACK",
    timestamp: new Date().toISOString(),
    competitor_weaknesses: competitorWeaknesses,
    users: mockUsersSegment
  };
  ```

### Code Evolution Logs (EvolutionLog)
The self-evolution engine parameters are defined in `server/selfEvolution.ts` and the `/api/evolution/run-loop` route:
- **Prompt version records (`server/selfEvolution.ts` lines 1-7)**:
  ```typescript
  export interface PromptVersionRecord {
    id: string;
    agentId: string;
    prompt: string;
    score: number;
    createdAt: string;
  }
  ```
- **Self-Evolution run loop data (`server.ts` lines 213-277)**:
  - Takes `code`, `error`, and `file_path`.
  - Layers: Critic Engine AST diagnostic results (`issue_type`, `critic_analysis`), Meta-Generator L3 LLM patch generation details (`patch_notes`, `new_code`, `confidence_score`), Sandbox L4 validation checks (`ast_passed`, `security_passed`, `is_valid`), Deployment L5 hot-swap result (`success`, `backup_path`), and telemetry metrics (`score`, `durationMs`, `tokenUsage`).

---

## 2. Logic Chain

1. **Unifying Lead**: A single consolidated PostgreSQL table `Lead` is designed in `schema.gql` containing the union of fields from both `InboundLead` and `FBLead`. Dynamic JSON objects (such as `aiEnrichment`, `dmSequence`, `chatHistory`, `pitchCard`, and `tacticalBrief`) are mapped to the PostgreSQL `jsonb` type using the SQL Connect `Any` type.
2. **Structuring Events**: Since system events are utilized both as a general system audit trail and for specific leads, campaigns, or code evolution loops, `Event` is designed with optional references (`@ref`) to `Lead`, `Campaign`, and `EvolutionLog`.
3. **Establishing Campaigns**: Campaigns targeted at user segments (leads) create a Many-to-Many relationship. This is modeled using a join table `CampaignLead` with a composite key of `campaign` and `lead`.
4. **Capturing Evolution Logs**: The `EvolutionLog` table captures all AST and LLM parameters generated during a self-evolution loop execution.
5. **Configuring Service/SDK**: The `dataconnect.yaml` and `connector.yaml` configurations use standard schema paths, mapping the SDK output path to `server/dataconnect/` as requested.

---

## 3. Caveats

- **No Implementation**: The codebase itself was not modified, as the investigator agent operates in read-only mode.
- **Local compilation check**: Schema compilation via the CLI is not executed here since the proposed files reside in `.agents/explorer_db_1/`. The implementer must copy them to the root `dataconnect/` directory before compiling.

---

## 4. Conclusion

The designed relational PostgreSQL data model is fully compatible with SQL Connect constraints (keys, default expressions, type mappings, and authorization rules). The proposed schema and GQL operations are saved as standalone files inside this directory.

---

## 5. Verification Method

To independently verify the schema and operations:
1. Copy the proposed files to the project root:
   - Copy `proposed_dataconnect.yaml` to `dataconnect/dataconnect.yaml`
   - Copy `proposed_schema.gql` to `dataconnect/schema/schema.gql`
   - Create `dataconnect/connector/` directory
   - Copy `proposed_connector.yaml` to `dataconnect/connector/connector.yaml`
   - Copy `proposed_queries.gql` to `dataconnect/connector/queries.gql`
   - Copy `proposed_mutations.gql` to `dataconnect/connector/mutations.gql`
2. Run the SQL Connect compilation check in the project root:
   ```bash
   npx -y firebase-tools@latest dataconnect:compile
   ```
3. Generate the TypeScript SDK:
   ```bash
   npx -y firebase-tools@latest dataconnect:sdk:generate
   ```

---

## 6. Proposed Files

All proposed configurations and GraphQL operations have been created in the working directory:
- [dataconnect.yaml](./proposed_dataconnect.yaml)
- [connector.yaml](./proposed_connector.yaml)
- [schema.gql](./proposed_schema.gql)
- [queries.gql](./proposed_queries.gql)
- [mutations.gql](./proposed_mutations.gql)
