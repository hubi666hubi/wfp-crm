# Database Schema Design Handoff Report

This report presents the database schema and query/mutation designs for migrating the CRM application to Firebase SQL Connect with PostgreSQL.

---

## 1. Observation

During exploration of the CRM application codebase, the following entities and properties were observed:

### A. Leads (Lead)
- **File: `server/validation.ts`** (Lines 1-8):
  - Defines `LeadPriority` as `'LOW' | 'MEDIUM' | 'HIGH'`.
  - Defines `LeadPayload` containing `name`, `email`, `message`, and `priority`.
- **File: `server/inboundService.ts`** (Lines 92-107):
  - Defines the `InboundLead` interface representing the core Lead entity:
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
      status: string; // 'Inbound (Wtyczka)' | 'Zakwalifikowane' | ...
      aiEnrichment?: AIEnrichment;
      dmSequence?: DMStep[];
      chatHistory?: ChatMessage[];
      pitchCard?: PitchCardData;
      tacticalBrief?: TacticalBriefData;
    }
    ```
- **File: `server/necropolisService.ts`** (Lines 14-15 & 50-55):
  - Queries the `leads` collection for status values `'Rejected'`, `'No Contact'`, and `'BabylonInactive'`.
  - Updates leads with fields: `necromancyTriggered: true`, `lastNecromancyAttempt: new Date()`, `resurrectionSpell: aiResponse`, and `status: 'NecropolisActive'`.

### B. System Events (Event - specifically ZAPALNIK_CLIP)
- **File: `server.ts`** (Lines 115-121):
  - Exposes an API endpoint `/api/zapalnik/clip` that accepts incoming HTTP payloads representing clipper hits.
- **File: `src/pages/Nekropolis.tsx`** (Line 166):
  - Shows simulated event records:
    ```typescript
    { 
      id: 'evt_2', 
      timestamp: new Date(Date.now() - 30000).toISOString(), 
      eventType: 'ZAPALNIK_CLIP', 
      testRunId: 'clip_ext_0491', 
      payload: { sourceUrl: 'linkedin.com/in/target-alpha', extracted: { name: 'John Doe', role: 'CTO' } } 
    }
    ```

### C. Marketing Campaigns (Campaign)
- **File: `src/pages/Dashboard.tsx`** (Lines 262-263):
  - Binds conversion history to campaign visualization: `conversionHistory` typed as `{ date: string; conversions: number }[]`.
- **File: `src/components/dashboard/DashboardCalendar.tsx`** (Lines 13-16):
  - Uses items with `type: 'campaign'` containing `title`, `date`, and `time`.
- **File: `src/pages/AutomationHub.tsx`** (Line 63):
  - Binds active campaign flow names (e.g. `dopamineCampaign` string state).

### D. Code Evolution Logs (EvolutionLog)
- **File: `server.ts`** (Lines 466-474):
  - Details the return object of the self-evolving loop `/api/evolution/run-loop`:
    - `logs`: `string[]` (array of step execution logs)
    - `critic`: Critic analysis results (`issue_id`, `issue_type`, `critic_analysis`, `static_issues_count`)
    - `patch`: Meta-generator results (`patch_notes`, `new_code`, `confidence_score`)
    - `report`: Sandbox validations (`is_valid`, `ast_passed`, `security_passed`, `errors`)
    - `deployment`: Hot-swap results (`success`, `backup_path`)

---

## 2. Logic Chain

1. **Lead Entity Consolidation**: By combining validation schema properties, `InboundLead` parameters, and `leads` status flags, we derive a single unified `Lead` PostgreSQL table.
2. **Semi-Structured Telemetry**: Both `Lead` (enrichments, chat histories, sequences) and `Event` (arbitrary payload outputs from webhook clippers) require unstructured JSON columns. SQL Connect provides the `Any` type, which maps directly to PostgreSQL `jsonb` fields.
3. **Relationships & Keys**: A campaign-to-lead association is a standard one-to-many relationship. By referencing `Campaign` inside `Lead` using `@ref(fields: "campaignId", references: "id")`, we establish a foreign key constraint in PostgreSQL.
4. **Self-Evolution Traceability**: `EvolutionLog` stores the array of runtime logs and the intermediate layer outputs (`criticResult`, `patchResult`, `sandboxReport`, `deploymentResult`) as `jsonb` (`Any`), ensuring every self-evolving iteration is audit-trailed.
5. **Authorization Strategy**:
   - Webhooks (clipper hits, evolution runs) are executed without explicit user login. Thus, `CreateEvent`, `CreateEvolutionLog`, and `CreateLeadPublic` are configured with `@auth(level: PUBLIC)`.
   - Admin-level actions and sensitive reads/writes (dashboard lists, status updates, campaign creations) are configured with `@auth(level: USER)`.

---

## 3. Caveats

- **Authentication assumption**: We assume Firebase Auth is used. If a custom or API-key based auth is used for queries/mutations, `@auth(expr: ...)` must be configured.
- **Relational limitations**: Large collections of logs (e.g. millions of event records) might benefit from partitioned tables in PostgreSQL. SQL Connect manages this at the DB tier.

---

## 4. Conclusion

The proposed Native GraphQL configuration successfully maps the four requested entities (Lead, Event, Campaign, EvolutionLog) to a robust PostgreSQL database structure.

---

## 5. Proposed Files

### 5.1. Service Config: `dataconnect.yaml`
```yaml
# dataconnect.yaml
specVersion: "v1"
serviceId: "zapalnik-crm"
location: "us-central1"
schemaValidation: "STRICT"
schema:
  source: "./schema"
  datasource:
    postgresql:
      database: "zapalnik_db"
      cloudSql:
        instanceId: "zapalnik-postgres-instance"
connectorDirs: ["./connector"]
```

### 5.2. Schema: `schema/schema.gql`
```graphql
# schema/schema.gql
# Database schema for CRM Zapalnik SQL Connect

type Lead @table(name: "leads")
  @index(fields: ["status", "timestamp"], order: [ASC, DESC])
  @index(fields: ["email"]) {
  id: UUID! @default(expr: "uuidV4()")
  userId: String
  name: String!
  email: String
  companyName: String
  bio: String
  source: String
  timestamp: Timestamp! @default(expr: "request.time")
  isHighTicket: Boolean @default(value: false)
  score: Int @default(value: 0)
  draftMessage: String
  status: String! @default(value: "Inbound (Wtyczka)")
  priority: String @default(value: "LOW")
  message: String
  rejectionReason: String
  necromancyTriggered: Boolean @default(value: false)
  lastContact: Timestamp
  lastNecromancyAttempt: Timestamp
  resurrectionSpell: String
  
  # Semi-structured data matching CRM's AI analyses
  aiEnrichment: Any
  dmSequence: Any
  chatHistory: Any
  pitchCard: Any
  tacticalBrief: Any
  
  createdAt: Timestamp! @default(expr: "request.time")
  updatedAt: Timestamp! @default(expr: "request.time")
  
  # Relationship: Lead optionally belongs to a Campaign
  campaign: Campaign @ref(fields: "campaignId", references: "id")
  campaignId: UUID
}

type Campaign @table(name: "campaigns")
  @index(fields: ["userId", "createdAt"], order: [ASC, DESC]) {
  id: UUID! @default(expr: "uuidV4()")
  title: String!
  type: String! @default(value: "campaign")
  status: String! @default(value: "ACTIVE")
  dopamineFlow: String
  startDate: Date
  endDate: Date
  conversions: Int @default(value: 0)
  conversionHistory: Any
  createdAt: Timestamp! @default(expr: "request.time")
  userId: String @default(expr: "auth.uid")
}

type Event @table(name: "events")
  @index(fields: ["eventType", "timestamp"], order: [ASC, DESC]) {
  id: UUID! @default(expr: "uuidV4()")
  timestamp: Timestamp! @default(expr: "request.time")
  eventType: String! @index
  testRunId: String
  payload: Any
}

type EvolutionLog @table(name: "evolution_logs")
  @index(fields: ["issueId", "createdAt"], order: [ASC, DESC]) {
  id: UUID! @default(expr: "uuidV4()")
  issueId: String!
  targetFilePath: String!
  logs: Any! # jsonb array of log lines
  criticResult: Any
  patchResult: Any
  sandboxReport: Any
  deploymentResult: Any
  success: Boolean!
  createdAt: Timestamp! @default(expr: "request.time")
}
```

### 5.3. Connector Config: `connector/connector.yaml`
```yaml
# connector/connector.yaml
connectorId: "crm-connector"
generate:
  javascriptSdk:
    outputDir: "../../server/dataconnect"
    package: "@zapalnik/crm-dataconnect"
```

### 5.4. Queries: `connector/queries.gql`
```graphql
# connector/queries.gql

# --- Leads Queries ---

# Fetch a single Lead by its UUID
query GetLead($id: UUID!) @auth(level: USER) {
  lead(id: $id) {
    id
    userId
    name
    email
    companyName
    bio
    source
    timestamp
    isHighTicket
    score
    draftMessage
    status
    priority
    message
    rejectionReason
    necromancyTriggered
    lastContact
    lastNecromancyAttempt
    resurrectionSpell
    aiEnrichment
    dmSequence
    chatHistory
    pitchCard
    tacticalBrief
    createdAt
    updatedAt
    campaignId
    campaign {
      id
      title
      status
    }
  }
}

# List all Leads with optional filtering on status and isHighTicket, sorted by timestamp DESC
query ListLeads(
  $status: String
  $isHighTicket: Boolean
  $limit: Int = 50
  $offset: Int = 0
) @auth(level: USER) {
  leads(
    where: {
      status: { eq: $status }
      isHighTicket: { eq: $isHighTicket }
    }
    orderBy: [{ timestamp: DESC }]
    limit: $limit
    offset: $offset
  ) {
    id
    name
    email
    companyName
    source
    timestamp
    isHighTicket
    score
    status
    priority
    createdAt
    campaignId
  }
}

# --- System Events Queries ---

# List all events, filtered by eventType if provided, sorted by timestamp DESC
query ListEvents(
  $eventType: String
  $limit: Int = 100
  $offset: Int = 0
) @auth(level: USER) {
  events(
    where: {
      eventType: { eq: $eventType }
    }
    orderBy: [{ timestamp: DESC }]
    limit: $limit
    offset: $offset
  ) {
    id
    timestamp
    eventType
    testRunId
    payload
  }
}

# --- Marketing Campaigns Queries ---

# List marketing campaigns, sorted by creation date
query ListCampaigns(
  $status: String
  $limit: Int = 20
  $offset: Int = 0
) @auth(level: USER) {
  campaigns(
    where: {
      status: { eq: $status }
    }
    orderBy: [{ createdAt: DESC }]
    limit: $limit
    offset: $offset
  ) {
    id
    title
    type
    status
    dopamineFlow
    startDate
    endDate
    conversions
    createdAt
  }
}

# --- Evolution Logs Queries ---

# List self-evolution logs, sorted by creation date
query ListEvolutionLogs(
  $success: Boolean
  $limit: Int = 50
  $offset: Int = 0
) @auth(level: USER) {
  evolutionLogs(
    where: {
      success: { eq: $success }
    }
    orderBy: [{ createdAt: DESC }]
    limit: $limit
    offset: $offset
  ) {
    id
    issueId
    targetFilePath
    success
    createdAt
  }
}

# Fetch a detailed Evolution Log record by ID
query GetEvolutionLog($id: UUID!) @auth(level: USER) {
  evolutionLog(id: $id) {
    id
    issueId
    targetFilePath
    logs
    criticResult
    patchResult
    sandboxReport
    deploymentResult
    success
    createdAt
  }
}
```

### 5.5. Mutations: `connector/mutations.gql`
```graphql
# connector/mutations.gql

# --- Lead Mutations ---

# Public mutation to create a new lead (e.g. via public webhook or chrome extension)
mutation CreateLeadPublic(
  $name: String!
  $email: String
  $companyName: String
  $bio: String
  $source: String!
  $message: String
  $priority: String
) @auth(level: PUBLIC) {
  lead_insert(data: {
    name: $name
    email: $email
    companyName: $companyName
    bio: $bio
    source: $source
    message: $message
    priority: $priority
    status: "Inbound (Wtyczka)"
  })
}

# Authenticated mutation to upsert a lead (insert if id is new/absent, update if exists)
mutation UpsertLead(
  $id: UUID
  $userId: String
  $name: String!
  $email: String
  $companyName: String
  $bio: String
  $source: String
  $isHighTicket: Boolean
  $score: Int
  $draftMessage: String
  $status: String
  $priority: String
  $message: String
  $rejectionReason: String
  $necromancyTriggered: Boolean
  $lastContact: Timestamp
  $lastNecromancyAttempt: Timestamp
  $resurrectionSpell: String
  $aiEnrichment: Any
  $dmSequence: Any
  $chatHistory: Any
  $pitchCard: Any
  $tacticalBrief: Any
  $campaignId: UUID
) @auth(level: USER) {
  lead_upsert(data: {
    id: $id
    userId: $userId
    name: $name
    email: $email
    companyName: $companyName
    bio: $bio
    source: $source
    isHighTicket: $isHighTicket
    score: $score
    draftMessage: $draftMessage
    status: $status
    priority: $priority
    message: $message
    rejectionReason: $rejectionReason
    necromancyTriggered: $necromancyTriggered
    lastContact: $lastContact
    lastNecromancyAttempt: $lastNecromancyAttempt
    resurrectionSpell: $resurrectionSpell
    aiEnrichment: $aiEnrichment
    dmSequence: $dmSequence
    chatHistory: $chatHistory
    pitchCard: $pitchCard
    tacticalBrief: $tacticalBrief
    campaignId: $campaignId
    updatedAt_expr: "request.time"
  })
}

# Update lead status only
mutation UpdateLeadStatus(
  $id: UUID!
  $status: String!
) @auth(level: USER) {
  lead_update(
    id: $id
    data: {
      status: $status
      updatedAt_expr: "request.time"
    }
  )
}

# Delete a lead
mutation DeleteLead($id: UUID!) @auth(level: USER) {
  lead_delete(id: $id)
}

# --- Event Mutations ---

# Log a new system event (e.g., ZAPALNIK_CLIP)
mutation CreateEvent(
  $eventType: String!
  $testRunId: String
  $payload: Any
) @auth(level: PUBLIC) {
  event_insert(data: {
    eventType: $eventType
    testRunId: $testRunId
    payload: $payload
  })
}

# --- Campaign Mutations ---

# Create or update a marketing campaign
mutation CreateCampaign(
  $title: String!
  $type: String
  $status: String
  $dopamineFlow: String
  $startDate: Date
  $endDate: Date
  $conversions: Int
  $conversionHistory: Any
) @auth(level: USER) {
  campaign_insert(data: {
    title: $title
    type: $type
    status: $status
    dopamineFlow: $dopamineFlow
    startDate: $startDate
    endDate: $endDate
    conversions: $conversions
    conversionHistory: $conversionHistory
    userId_expr: "auth.uid"
  })
}

# --- Evolution Log Mutations ---

# Save a self-evolution log (called by Python engine)
mutation CreateEvolutionLog(
  $issueId: String!
  $targetFilePath: String!
  $logs: Any!
  $criticResult: Any
  $patchResult: Any
  $sandboxReport: Any
  $deploymentResult: Any
  $success: Boolean!
) @auth(level: PUBLIC) {
  evolutionLog_insert(data: {
    issueId: $issueId
    targetFilePath: $targetFilePath
    logs: $logs
    criticResult: $criticResult
    patchResult: $patchResult
    sandboxReport: $sandboxReport
    deploymentResult: $deploymentResult
    success: $success
  })
}
```

---

## 6. Verification Method

To verify the syntax correctness of the GraphQL schema and operations, follow these steps:

1. **Local Project Compilation**:
   Create a temporary directory, copy the configuration files matching the directory structure outlined in the Handoff layout, and compile:
   ```bash
   npx -y firebase-tools@latest dataconnect:compile
   ```
2. **SDK Generation Check**:
   Validate that the type-safe SDK generators can parse all operations:
   ```bash
   npx -y firebase-tools@latest dataconnect:sdk:generate
   ```
3. **Invalidation condition**: If compiler throws standard schema validation errors (e.g. mismatch of `@ref` types or unrecognized directives), the schema definitions must be corrected.
