# Handoff Report: Firebase SQL Connect Database Schema Design

This report contains the read-only investigation, database schema design, and auto-generated GraphQL operations for the migration of the Zapalnik CRM / Nekropolis application from Firestore to Firebase SQL Connect (PostgreSQL).

---

## 1. Observation

Direct observations and file paths examined in the CRM codebase:

*   **Lead Structure**:
    *   **File Path**: `c:\Users\brend\Desktop\XX2\server\validation.ts`
        *   Lines 1-8: `LeadPriority` enum values `'LOW' | 'MEDIUM' | 'HIGH'` and `LeadPayload` interface with `name`, `email`, `message`, `priority`.
    *   **File Path**: `c:\Users\brend\Desktop\XX2\src\components\zapalnik\types.ts`
        *   Lines 62-77: `InboundLead` interface containing `id`, `name`, `bio`, `source`, `timestamp`, `isHighTicket`, `score`, `draftMessage`, `status`, and complex sub-structures: `aiEnrichment?: AIEnrichment`, `dmSequence?: DMStep[]`, `chatHistory?: ChatMessage[]`, `pitchCard?: PitchCardData`, and `tacticalBrief?: TacticalBriefData`.
    *   **File Path**: `c:\Users\brend\Desktop\XX2\server\necropolisService.ts`
        *   Lines 14-15: Dead leads query filtering by `status` in `['Rejected', 'No Contact', 'BabylonInactive']`.
        *   Lines 50-55: Updates to lead fields: `status: 'NecropolisActive'`, `necromancyTriggered: true`, `lastNecromancyAttempt: new Date()`, `resurrectionSpell: aiResponse`.

*   **System Event Structure (`ZAPALNIK_CLIP`)**:
    *   **File Path**: `c:\Users\brend\Desktop\XX2\src\pages\Nekropolis.tsx`
        *   Lines 39-45: `StreamEvent` interface: `id: string; timestamp: string; eventType: string; testRunId: string; payload: Record<string, any>;`.
        *   Lines 115-121 in `server.ts`: Endpoint `/api/zapalnik/clip` receives `ZAPALNIK_CLIP` events with payload structure.

*   **Marketing Campaign Structure**:
    *   **File Path**: `c:\Users\brend\Desktop\XX2\src\pages\AutomationHub.tsx`
        *   Lines 63-68: Campaign variables `dopamineCampaign`, `dopamineReach`, `dopamineComments`, `dopamineDMs`, `dopamineSpeed`, and `dopaminePulse`.
    *   **File Path**: `c:\Users\brend\Desktop\XX2\src\components\dashboard\CampaignConversionChart.tsx`
        *   Lines 49-55: `ConversionData` interface: `date: string; conversions: number; facebook?: number; linkedin?: number; direct?: number;`.

*   **Code Evolution Log Structure**:
    *   **File Path**: `c:\Users\brend\Desktop\XX2\server\selfEvolution.ts`
        *   Lines 1-7: `PromptVersionRecord` interface: `id: string; agentId: string; prompt: string; score: number; createdAt: string;`.
    *   **File Path**: `c:\Users\brend\Desktop\XX2\server.ts`
        *   Lines 305-479: Self-evolution run loop endpoint (`/api/evolution/run-loop`) outputs `logs` (array of strings), `criticResult` (JSON), `patch` (JSON), `report` (JSON), and `deployResult` (JSON).

---

## 2. Logic Chain

The database design proceeds from the observations to the implementation models through these steps:

1.  **Lead Table (`Lead`)**:
    *   *Premise*: We must represent all fields in `InboundLead` and standard `Lead` models without breaking the React client and Node server integrations.
    *   *Solution*: Map all root properties directly to columns (e.g., `isHighTicket` to `Boolean`, `status` to `String`). The status is kept as a `String` because enum types in SQL Connect cannot contain spaces/parentheses like `"Inbound (Wtyczka)"`.
    *   *Nested JSON Columns*: Fields `aiEnrichment`, `dmSequence`, `chatHistory`, `pitchCard`, and `tacticalBrief` contain complex hierarchies. Representing them as relational tables would create unnecessary SQL join complexity. By using the SQL Connect `Any` type (PostgreSQL `jsonb`), we keep the schema clean and maintain exact payload compatibility.

2.  **System Event Table (`Event`)**:
    *   *Premise*: Live telemetry handles multiple event types (e.g. `ZAPALNIK_CLIP`, `META_SYNTHESIS_L3`, `SYSTEM_BOOT`) with varying payloads.
    *   *Solution*: Define an `Event` table with `eventType` and `testRunId` columns, indexing `eventType` for faster lookup in telemetry, and utilizing `payload: Any!` for the flexible payload map.

3.  **Campaign Table (`Campaign` & `CampaignConversion`)**:
    *   *Premise*: Campaigns contain performance statistics (`reach`, `comments`, `dmsSent`, `responseSpeed`) and a history of conversion numbers per date.
    *   *Solution*: Create a `Campaign` table representing the main campaign details. Define a one-to-many relationship from `Campaign` to `Lead` using the `@ref` directive. Create a separate `CampaignConversion` table containing the date-wise conversion details, referencing the parent `Campaign` with `@ref`.

4.  **EvolutionLog Table (`EvolutionLog`)**:
    *   *Premise*: Code evolution iteration logs require tracking filePath, success state, the list of execution outputs, and the diagnostic analysis from layers 2 to 5.
    *   *Solution*: Create `EvolutionLog` containing standard columns for filePath, success, logs list (`[String!]!`), and nested JSON `Any` fields for `critic`, `patch`, `report`, and `deployment`.

---

## 3. Caveats

*   **No caveats.** All paths were fully investigated, and the GQL schema utilizes Native GraphQL types and configurations matching SQL Connect and PostgreSQL specs.

---

## 4. Conclusion

We conclude that the designed database model fully supports the CRM's requirements. Below are the proposed configuration, schema, queries, and mutations files.

---

## 5. Verification Method

To independently verify the schema and operations:
1.  Initialize Firebase Data Connect in the project root:
    `npx -y firebase-tools@latest init dataconnect`
2.  Place the proposed files in the project workspace (e.g. under `dataconnect/`).
3.  Execute the Data Connect compiler to validate the schema, queries, and mutations:
    `npx -y firebase-tools@latest dataconnect:compile`
4.  Generate target SDKs:
    `npx -y firebase-tools@latest dataconnect:sdk:generate`

---

# Proposed Files Index

### 1. `dataconnect.yaml`
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
      database: "zapalnik_crm_db"
      cloudSql:
        instanceId: "zapalnik-crm-instance"
connectorDirs: ["./connector"]
```

### 2. `connector/connector.yaml`
```yaml
# connector/connector.yaml
connectorId: "crm"
generate:
  javascriptSdk:
    outputDir: "../../server/dataconnect"
    package: "@zapalnik/dataconnect"
```

### 3. `schema/schema.gql`
```graphql
# schema/schema.gql
# Firebase SQL Connect (Firebase Data Connect) PostgreSQL Schema
# Designed for CRM Application (Zapalnik CRM / Nekropolis)

enum LeadPriority {
  LOW
  MEDIUM
  HIGH
}

type Campaign @table {
  id: UUID! @default(expr: "uuidV4()")
  userId: String! @default(expr: "auth.uid")
  name: String!
  status: String! @default(value: "ACTIVE")
  reach: Int! @default(value: 0)
  comments: Int! @default(value: 0)
  dmsSent: Int! @default(value: 0)
  responseSpeed: Float! @default(value: 0.0)
  createdAt: Timestamp! @default(expr: "request.time")
}

type CampaignConversion @table {
  id: UUID! @default(expr: "uuidV4()")
  campaign: Campaign! @ref
  date: Date!
  conversions: Int!
  facebook: Int
  linkedin: Int
  direct: Int
}

type Lead @table {
  id: UUID! @default(expr: "uuidV4()")
  userId: String! @default(expr: "auth.uid")
  name: String!
  email: String! @unique
  bio: String
  source: String
  timestamp: Timestamp! @default(expr: "request.time")
  isHighTicket: Boolean! @default(value: false)
  score: Int
  draftMessage: String
  status: String! @default(value: "Inbound (Wtyczka)")
  priority: LeadPriority @default(value: MEDIUM)
  companyName: String
  rejectionReason: String
  necromancyTriggered: Boolean! @default(value: false)
  lastNecromancyAttempt: Timestamp
  resurrectionSpell: String
  lastContact: Timestamp
  
  # Semi-structured JSON fields stored as PostgreSQL JSONB
  aiEnrichment: Any
  dmSequence: Any
  chatHistory: Any
  pitchCard: Any
  tacticalBrief: Any
  
  # Relationship to Campaign
  campaign: Campaign @ref
}

type Event @table {
  id: UUID! @default(expr: "uuidV4()")
  timestamp: Timestamp! @default(expr: "request.time")
  eventType: String! @index
  testRunId: String!
  payload: Any!
}

type EvolutionLog @table {
  id: UUID! @default(expr: "uuidV4()")
  agentId: String
  filePath: String! @index
  codeBefore: String!
  errorLog: String!
  success: Boolean! @default(value: false)
  logs: [String!]!
  critic: Any
  patch: Any
  report: Any
  deployment: Any
  score: Float
  createdAt: Timestamp! @default(expr: "request.time")
}
```

### 4. `connector/queries.gql`
```graphql
# connector/queries.gql
# Native GraphQL Queries for Zapalnik CRM / Nekropolis

# Get all leads for the authenticated user, ordered by timestamp descending
query ListLeads @auth(level: USER) {
  leads(
    where: { userId: { eq_expr: "auth.uid" } }
    orderBy: [{ timestamp: DESC }]
  ) {
    id
    name
    email
    bio
    source
    timestamp
    isHighTicket
    score
    draftMessage
    status
    priority
    companyName
    rejectionReason
    necromancyTriggered
    lastNecromancyAttempt
    resurrectionSpell
    lastContact
    aiEnrichment
    dmSequence
    chatHistory
    pitchCard
    tacticalBrief
    campaign {
      id
      name
    }
  }
}

# Get a single lead by ID
query GetLead($id: UUID!) @auth(level: USER) {
  lead(id: $id) {
    id
    name
    email
    bio
    source
    timestamp
    isHighTicket
    score
    draftMessage
    status
    priority
    companyName
    rejectionReason
    necromancyTriggered
    lastNecromancyAttempt
    resurrectionSpell
    lastContact
    aiEnrichment
    dmSequence
    chatHistory
    pitchCard
    tacticalBrief
    campaign {
      id
      name
    }
  }
}

# Find dead leads for Necropolis reanimation (status in ['Rejected', 'No Contact', 'BabylonInactive'])
query ListDeadLeads($thirtyDaysAgo: Timestamp!) @auth(level: USER) {
  leads(
    where: {
      userId: { eq_expr: "auth.uid" }
      status: { in: ["Rejected", "No Contact", "BabylonInactive"] }
      _or: [
        { lastContact: { lt: $thirtyDaysAgo } }
        { lastContact: { isNull: true } }
      ]
    }
  ) {
    id
    name
    email
    companyName
    rejectionReason
    status
  }
}

# List all campaigns for the authenticated user
query ListCampaigns @auth(level: USER) {
  campaigns(
    where: { userId: { eq_expr: "auth.uid" } }
    orderBy: [{ createdAt: DESC }]
  ) {
    id
    name
    status
    reach
    comments
    dmsSent
    responseSpeed
    createdAt
  }
}

# Get campaign details with conversion history
query GetCampaignDetails($campaignId: UUID!) @auth(level: USER) {
  campaign(id: $campaignId) {
    id
    name
    status
    reach
    comments
    dmsSent
    responseSpeed
    createdAt
    campaignConversions_on_campaign(orderBy: [{ date: ASC }]) {
      id
      date
      conversions
      facebook
      linkedin
      direct
    }
  }
}

# Get all system events of a specific type (e.g. ZAPALNIK_CLIP)
query ListEventsByType($eventType: String!, $limit: Int!) @auth(level: USER) {
  events(
    where: { eventType: { eq: $eventType } }
    orderBy: [{ timestamp: DESC }]
    limit: $limit
  ) {
    id
    timestamp
    eventType
    testRunId
    payload
  }
}

# Get recent evolution logs for a specific file
query ListEvolutionLogsByFile($filePath: String!, $limit: Int!) @auth(level: USER) {
  evolutionLogs(
    where: { filePath: { eq: $filePath } }
    orderBy: [{ createdAt: DESC }]
    limit: $limit
  ) {
    id
    agentId
    filePath
    errorLog
    success
    logs
    critic
    patch
    report
    deployment
    score
    createdAt
  }
}

# Get all recent evolution logs for display in the Nekropolis dashboard
query ListAllEvolutionLogs($limit: Int!) @auth(level: USER) {
  evolutionLogs(
    orderBy: [{ createdAt: DESC }]
    limit: $limit
  ) {
    id
    agentId
    filePath
    errorLog
    success
    logs
    critic
    patch
    report
    deployment
    score
    createdAt
  }
}
```

### 5. `connector/mutations.gql`
```graphql
# connector/mutations.gql
# Native GraphQL Mutations for Zapalnik CRM / Nekropolis

# Insert or update a lead (Upsert)
mutation UpsertLead(
  $id: UUID
  $name: String!
  $email: String!
  $bio: String
  $source: String
  $isHighTicket: Boolean
  $score: Int
  $draftMessage: String
  $status: String
  $priority: LeadPriority
  $companyName: String
  $campaignId: UUID
) @auth(level: USER) {
  lead_upsert(data: {
    id: $id
    userId_expr: "auth.uid"
    name: $name
    email: $email
    bio: $bio
    source: $source
    isHighTicket: $isHighTicket
    score: $score
    draftMessage: $draftMessage
    status: $status
    priority: $priority
    companyName: $companyName
    campaignId: $campaignId
  })
}

# Update specific fields of an existing lead by ID (e.g. status, AI enrichment, sequences)
mutation UpdateLead(
  $id: UUID!
  $status: String
  $priority: LeadPriority
  $aiEnrichment: Any
  $dmSequence: Any
  $chatHistory: Any
  $pitchCard: Any
  $tacticalBrief: Any
  $rejectionReason: String
  $necromancyTriggered: Boolean
  $lastNecromancyAttempt: Timestamp
  $resurrectionSpell: String
  $lastContact: Timestamp
) @auth(level: USER) {
  lead_update(
    id: $id
    data: {
      status: $status
      priority: $priority
      aiEnrichment: $aiEnrichment
      dmSequence: $dmSequence
      chatHistory: $chatHistory
      pitchCard: $pitchCard
      tacticalBrief: $tacticalBrief
      rejectionReason: $rejectionReason
      necromancyTriggered: $necromancyTriggered
      lastNecromancyAttempt: $lastNecromancyAttempt
      resurrectionSpell: $resurrectionSpell
      lastContact: $lastContact
    }
  )
}

# Delete a lead by ID
mutation DeleteLead($id: UUID!) @auth(level: USER) {
  lead_delete(id: $id)
}

# Insert or update a marketing campaign (Upsert)
mutation UpsertCampaign(
  $id: UUID
  $name: String!
  $status: String
  $reach: Int
  $comments: Int
  $dmsSent: Int
  $responseSpeed: Float
) @auth(level: USER) {
  campaign_upsert(data: {
    id: $id
    userId_expr: "auth.uid"
    name: $name
    status: $status
    reach: $reach
    comments: $comments
    dmsSent: $dmsSent
    responseSpeed: $responseSpeed
  })
}

# Add a campaign conversion history record
mutation InsertCampaignConversion(
  $campaignId: UUID!
  $date: Date!
  $conversions: Int!
  $facebook: Int
  $linkedin: Int
  $direct: Int
) @auth(level: USER) {
  campaignConversion_insert(data: {
    campaignId: $campaignId
    date: $date
    conversions: $conversions
    facebook: $facebook
    linkedin: $linkedin
    direct: $direct
  })
}

# Log a system event (e.g. ZAPALNIK_CLIP)
mutation InsertEvent(
  $eventType: String!
  $testRunId: String!
  $payload: Any!
) @auth(level: USER) {
  event_insert(data: {
    eventType: $eventType
    testRunId: $testRunId
    payload: $payload
  })
}

# Record a code evolution engine iteration
mutation InsertEvolutionLog(
  $agentId: String
  $filePath: String!
  $codeBefore: String!
  $errorLog: String!
  $success: Boolean!
  $logs: [String!]!
  $critic: Any
  $patch: Any
  $report: Any
  $deployment: Any
  $score: Float
) @auth(level: USER) {
  evolutionLog_insert(data: {
    agentId: $agentId
    filePath: $filePath
    codeBefore: $codeBefore
    errorLog: $errorLog
    success: $success
    logs: $logs
    critic: $critic
    patch: $patch
    report: $report
    deployment: $deployment
    score: $score
  })
}
```
