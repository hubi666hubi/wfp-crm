## 2026-07-08T20:08:36Z
You are worker_db_impl. Your working directory is c:\Users\brend\Desktop\XX2\.agents\worker_db_impl\.

DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Please implement the Firebase SQL Connect database backend by performing the following actions:
1. Create a `dataconnect/` folder at the root of the project.
2. In `dataconnect/dataconnect.yaml`, write:
```yaml
specVersion: "v1"
serviceId: "zapalnik-crm"
location: "us-central1"
schemaValidation: "COMPATIBLE"
schema:
  source: "./schema"
  datasource:
    postgresql:
      database: "zapalnik_crm"
      cloudSql:
        instanceId: "zapalnik-crm-instance"
connectorDirs: ["./connector"]
```

3. In `dataconnect/connector/connector.yaml`, write:
```yaml
connectorId: "crm"
generate:
  javascriptSdk:
    outputDir: "../../server/dataconnect"
    package: "@zapalnik/crm-dataconnect"
```

4. In `dataconnect/schema/schema.gql`, write:
```graphql
enum LeadPriority {
  LOW
  MEDIUM
  HIGH
}

type Campaign @table(name: "campaigns") {
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

type CampaignConversion @table(name: "campaign_conversions") {
  id: UUID! @default(expr: "uuidV4()")
  campaign: Campaign! @ref
  date: Date!
  conversions: Int!
  facebook: Int
  linkedin: Int
  direct: Int
}

type Lead @table(name: "leads") {
  id: UUID! @default(expr: "uuidV4()")
  userId: String! @default(expr: "auth.uid")
  name: String!
  email: String @unique
  bio: String
  source: String
  timestamp: Timestamp! @default(expr: "request.time")
  isHighTicket: Boolean! @default(value: false)
  score: Int @default(value: 0)
  draftMessage: String
  status: String! @default(value: "Inbound (Wtyczka)")
  priority: LeadPriority @default(value: MEDIUM)
  companyName: String
  rejectionReason: String
  necromancyTriggered: Boolean! @default(value: false)
  lastNecromancyAttempt: Timestamp
  resurrectionSpell: String
  lastContact: Timestamp
  message: String
  
  # FB/Outreach specific fields
  postText: String
  authorName: String
  groupName: String
  yourOffer: String
  customInstructions: String
  intentLevel: String
  painSummary: String
  estimatedValueHex: String
  valueFirstMessengerPitch: String
  detectedCompanyUrl: String
  publicCommentStrategy: String
  videoPitchScript: String
  qualificationScore: Int
  linkedinConnectPitch: String
  coldEmailSubject: String
  coldEmailBody: String
  sentimentScore: Float
  sentimentLabel: String
  priorityScore: Int
  priorityLabel: String
  emotionalTriggers: [String!]
  sentimentExplanation: String
  outreachPitch: String

  # Semi-structured JSON fields
  aiEnrichment: Any
  dmSequence: Any
  chatHistory: Any
  pitchCard: Any
  tacticalBrief: Any

  createdAt: Timestamp! @default(expr: "request.time")
  updatedAt: Timestamp! @default(expr: "request.time")
  
  # Relationship: Lead optionally belongs to a Campaign
  campaign: Campaign @ref
}

type Event @table(name: "events") {
  id: UUID! @default(expr: "uuidV4()")
  timestamp: Timestamp! @default(expr: "request.time")
  eventType: String! @index
  testRunId: String
  payload: Any!
  
  # Optional relationship to Lead
  lead: Lead @ref
  
  # Optional relationship to EvolutionLog
  evolutionLog: EvolutionLog @ref
}

type EvolutionLog @table(name: "evolution_logs") {
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

5. In `dataconnect/connector/queries.gql`, write:
```graphql
# Queries for WFP CRM Data Connect

query ListLeads($status: String, $isHighTicket: Boolean, $limit: Int = 50, $offset: Int = 0) @auth(level: USER) {
  leads(
    where: {
      userId: { eq_expr: "auth.uid" }
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
  }
}

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
    campaign {
      id
      name
    }
  }
}

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

query ListCampaigns($status: String, $limit: Int = 20, $offset: Int = 0) @auth(level: USER) {
  campaigns(
    where: {
      userId: { eq_expr: "auth.uid" }
      status: { eq: $status }
    }
    orderBy: [{ createdAt: DESC }]
    limit: $limit
    offset: $offset
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

query ListEventsByType($eventType: String!, $limit: Int = 100) @auth(level: USER) {
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

query ListEvolutionLogs($success: Boolean, $limit: Int = 50, $offset: Int = 0) @auth(level: USER) {
  evolutionLogs(
    where: { success: { eq: $success } }
    orderBy: [{ createdAt: DESC }]
    limit: $limit
    offset: $offset
  ) {
    id
    filePath
    success
    createdAt
  }
}

query GetEvolutionLog($id: UUID!) @auth(level: USER) {
  evolutionLog(id: $id) {
    id
    agentId
    filePath
    codeBefore
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

6. In `dataconnect/connector/mutations.gql`, write:
```graphql
# Mutations for WFP CRM Data Connect

mutation CreateLeadPublic(
  $name: String!
  $email: String
  $companyName: String
  $bio: String
  $source: String!
  $message: String
  $priority: LeadPriority
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

mutation UpsertLead(
  $id: UUID
  $name: String!
  $email: String
  $companyName: String
  $bio: String
  $source: String
  $isHighTicket: Boolean
  $score: Int
  $draftMessage: String
  $status: String
  $priority: LeadPriority
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
    userId_expr: "auth.uid"
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
      updatedAt_expr: "request.time"
    }
  )
}

mutation DeleteLead($id: UUID!) @auth(level: USER) {
  lead_delete(id: $id)
}

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

mutation CreateEvent(
  $eventType: String!
  $testRunId: String
  $payload: Any!
  $leadId: UUID
  $evolutionLogId: UUID
) @auth(level: PUBLIC) {
  event_insert(data: {
    eventType: $eventType
    testRunId: $testRunId
    payload: $payload
    leadId: $leadId
    evolutionLogId: $evolutionLogId
  })
}

mutation CreateEvolutionLog(
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
) @auth(level: PUBLIC) {
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
