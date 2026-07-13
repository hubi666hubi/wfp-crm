import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;


export enum LeadPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
};



export interface CampaignConversion_Key {
  id: UUIDString;
  __typename?: 'CampaignConversion_Key';
}

export interface Campaign_Key {
  id: UUIDString;
  __typename?: 'Campaign_Key';
}

export interface CreateEventData {
  event_insert: Event_Key;
}

export interface CreateEventVariables {
  eventType: string;
  testRunId?: string | null;
  payload: unknown;
  leadId?: UUIDString | null;
  evolutionLogId?: UUIDString | null;
}

export interface CreateEvolutionLogData {
  evolutionLog_insert: EvolutionLog_Key;
}

export interface CreateEvolutionLogVariables {
  agentId?: string | null;
  filePath: string;
  codeBefore: string;
  errorLog: string;
  success: boolean;
  logs: string[];
  critic?: unknown | null;
  patch?: unknown | null;
  report?: unknown | null;
  deployment?: unknown | null;
  score?: number | null;
}

export interface CreateLeadPublicData {
  lead_insert: Lead_Key;
}

export interface CreateLeadPublicVariables {
  name: string;
  email?: string | null;
  companyName?: string | null;
  bio?: string | null;
  source: string;
  message?: string | null;
  priority?: LeadPriority | null;
}

export interface DeleteLeadData {
  lead_delete?: Lead_Key | null;
}

export interface DeleteLeadVariables {
  id: UUIDString;
}

export interface Event_Key {
  id: UUIDString;
  __typename?: 'Event_Key';
}

export interface EvolutionLog_Key {
  id: UUIDString;
  __typename?: 'EvolutionLog_Key';
}

export interface GetCampaignDetailsData {
  campaign?: {
    id: UUIDString;
    name: string;
    status: string;
    reach: number;
    comments: number;
    dmsSent: number;
    responseSpeed: number;
    createdAt: TimestampString;
    campaignConversions_on_campaign: ({
      id: UUIDString;
      date: DateString;
      conversions: number;
      facebook?: number | null;
      linkedin?: number | null;
      direct?: number | null;
    } & CampaignConversion_Key)[];
  } & Campaign_Key;
}

export interface GetCampaignDetailsVariables {
  campaignId: UUIDString;
}

export interface GetEvolutionLogData {
  evolutionLog?: {
    id: UUIDString;
    agentId: string;
    filePath: string;
    codeBefore: string;
    errorLog: string;
    success: boolean;
    logs: string[];
    critic?: unknown | null;
    patch: unknown;
    report?: unknown | null;
    deployment?: unknown | null;
    score: number;
    createdAt: TimestampString;
  } & EvolutionLog_Key;
}

export interface GetEvolutionLogVariables {
  id: UUIDString;
}

export interface GetLeadData {
  lead?: {
    id: UUIDString;
    userId: string;
    name: string;
    email: string;
    companyName: string;
    bio?: string | null;
    source?: string | null;
    timestamp: TimestampString;
    isHighTicket: boolean;
    score: number;
    draftMessage?: string | null;
    status: string;
    priority?: LeadPriority | null;
    message?: string | null;
    rejectionReason?: string | null;
    necromancyTriggered: boolean;
    lastContact?: TimestampString | null;
    lastNecromancyAttempt?: TimestampString | null;
    resurrectionSpell?: string | null;
    aiEnrichment?: unknown | null;
    dmSequence?: unknown | null;
    chatHistory?: unknown | null;
    pitchCard?: unknown | null;
    tacticalBrief?: unknown | null;
    createdAt: TimestampString;
    updatedAt: TimestampString;
    campaign?: {
      id: UUIDString;
      name: string;
    } & Campaign_Key;
  } & Lead_Key;
}

export interface GetLeadVariables {
  id: UUIDString;
}

export interface InsertCampaignConversionData {
  campaignConversion_insert: CampaignConversion_Key;
}

export interface InsertCampaignConversionVariables {
  campaignId: UUIDString;
  date: DateString;
  conversions: number;
  facebook?: number | null;
  linkedin?: number | null;
  direct?: number | null;
}

export interface Lead_Key {
  id: UUIDString;
  __typename?: 'Lead_Key';
}

export interface ListCampaignsData {
  campaigns: ({
    id: UUIDString;
    name: string;
    status: string;
    reach: number;
    comments: number;
    dmsSent: number;
    responseSpeed: number;
    createdAt: TimestampString;
  } & Campaign_Key)[];
}

export interface ListCampaignsVariables {
  status?: string | null;
  limit?: number | null;
  offset?: number | null;
}

export interface ListDeadLeadsData {
  leads: ({
    id: UUIDString;
    name: string;
    email: string;
    companyName: string;
    rejectionReason?: string | null;
    status: string;
  } & Lead_Key)[];
}

export interface ListDeadLeadsVariables {
  thirtyDaysAgo: TimestampString;
}

export interface ListEventsByTypeData {
  events: ({
    id: UUIDString;
    timestamp: TimestampString;
    eventType: string;
    testRunId?: string | null;
    payload: unknown;
  } & Event_Key)[];
}

export interface ListEventsByTypeVariables {
  eventType: string;
  limit?: number | null;
}

export interface ListEvolutionLogsData {
  evolutionLogs: ({
    id: UUIDString;
    filePath: string;
    success: boolean;
    createdAt: TimestampString;
  } & EvolutionLog_Key)[];
}

export interface ListEvolutionLogsVariables {
  success?: boolean | null;
  limit?: number | null;
  offset?: number | null;
}

export interface ListLeadsData {
  leads: ({
    id: UUIDString;
    name: string;
    email: string;
    companyName: string;
    source?: string | null;
    timestamp: TimestampString;
    isHighTicket: boolean;
    score: number;
    status: string;
    priority?: LeadPriority | null;
    createdAt: TimestampString;
  } & Lead_Key)[];
}

export interface ListLeadsVariables {
  status?: string | null;
  isHighTicket?: boolean | null;
  limit?: number | null;
  offset?: number | null;
}

export interface UpdateLeadData {
  lead_update?: Lead_Key | null;
}

export interface UpdateLeadVariables {
  id: UUIDString;
  status?: string | null;
  priority?: LeadPriority | null;
  aiEnrichment?: unknown | null;
  dmSequence?: unknown | null;
  chatHistory?: unknown | null;
  pitchCard?: unknown | null;
  tacticalBrief?: unknown | null;
  rejectionReason?: string | null;
  necromancyTriggered?: boolean | null;
  lastNecromancyAttempt?: TimestampString | null;
  resurrectionSpell?: string | null;
  lastContact?: TimestampString | null;
}

export interface UpsertCampaignData {
  campaign_upsert: Campaign_Key;
}

export interface UpsertCampaignVariables {
  id?: UUIDString | null;
  name: string;
  status?: string | null;
  reach?: number | null;
  comments?: number | null;
  dmsSent?: number | null;
  responseSpeed?: number | null;
}

export interface UpsertLeadAndLogData {
  lead_upsert: Lead_Key;
}

export interface UpsertLeadAndLogVariables {
  id: UUIDString;
  email: string;
  name: string;
  companyName: string;
  status: string;
  score: number;
  isHighTicket: boolean;
  aiEnrichment: unknown;
  pitchCard: unknown;
}

export interface UpsertLeadData {
  lead_upsert: Lead_Key;
}

export interface UpsertLeadVariables {
  id?: UUIDString | null;
  name: string;
  email?: string | null;
  companyName?: string | null;
  bio?: string | null;
  source?: string | null;
  isHighTicket?: boolean | null;
  score?: number | null;
  draftMessage?: string | null;
  status?: string | null;
  priority?: LeadPriority | null;
  message?: string | null;
  rejectionReason?: string | null;
  necromancyTriggered?: boolean | null;
  lastContact?: TimestampString | null;
  lastNecromancyAttempt?: TimestampString | null;
  resurrectionSpell?: string | null;
  aiEnrichment?: unknown | null;
  dmSequence?: unknown | null;
  chatHistory?: unknown | null;
  pitchCard?: unknown | null;
  tacticalBrief?: unknown | null;
  campaignId?: UUIDString | null;
}

interface CreateLeadPublicRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateLeadPublicVariables): MutationRef<CreateLeadPublicData, CreateLeadPublicVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateLeadPublicVariables): MutationRef<CreateLeadPublicData, CreateLeadPublicVariables>;
  operationName: string;
}
export const createLeadPublicRef: CreateLeadPublicRef;

export function createLeadPublic(vars: CreateLeadPublicVariables): MutationPromise<CreateLeadPublicData, CreateLeadPublicVariables>;
export function createLeadPublic(dc: DataConnect, vars: CreateLeadPublicVariables): MutationPromise<CreateLeadPublicData, CreateLeadPublicVariables>;

interface UpsertLeadRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertLeadVariables): MutationRef<UpsertLeadData, UpsertLeadVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpsertLeadVariables): MutationRef<UpsertLeadData, UpsertLeadVariables>;
  operationName: string;
}
export const upsertLeadRef: UpsertLeadRef;

export function upsertLead(vars: UpsertLeadVariables): MutationPromise<UpsertLeadData, UpsertLeadVariables>;
export function upsertLead(dc: DataConnect, vars: UpsertLeadVariables): MutationPromise<UpsertLeadData, UpsertLeadVariables>;

interface UpdateLeadRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateLeadVariables): MutationRef<UpdateLeadData, UpdateLeadVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateLeadVariables): MutationRef<UpdateLeadData, UpdateLeadVariables>;
  operationName: string;
}
export const updateLeadRef: UpdateLeadRef;

export function updateLead(vars: UpdateLeadVariables): MutationPromise<UpdateLeadData, UpdateLeadVariables>;
export function updateLead(dc: DataConnect, vars: UpdateLeadVariables): MutationPromise<UpdateLeadData, UpdateLeadVariables>;

interface DeleteLeadRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteLeadVariables): MutationRef<DeleteLeadData, DeleteLeadVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteLeadVariables): MutationRef<DeleteLeadData, DeleteLeadVariables>;
  operationName: string;
}
export const deleteLeadRef: DeleteLeadRef;

export function deleteLead(vars: DeleteLeadVariables): MutationPromise<DeleteLeadData, DeleteLeadVariables>;
export function deleteLead(dc: DataConnect, vars: DeleteLeadVariables): MutationPromise<DeleteLeadData, DeleteLeadVariables>;

interface UpsertCampaignRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertCampaignVariables): MutationRef<UpsertCampaignData, UpsertCampaignVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpsertCampaignVariables): MutationRef<UpsertCampaignData, UpsertCampaignVariables>;
  operationName: string;
}
export const upsertCampaignRef: UpsertCampaignRef;

export function upsertCampaign(vars: UpsertCampaignVariables): MutationPromise<UpsertCampaignData, UpsertCampaignVariables>;
export function upsertCampaign(dc: DataConnect, vars: UpsertCampaignVariables): MutationPromise<UpsertCampaignData, UpsertCampaignVariables>;

interface InsertCampaignConversionRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertCampaignConversionVariables): MutationRef<InsertCampaignConversionData, InsertCampaignConversionVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: InsertCampaignConversionVariables): MutationRef<InsertCampaignConversionData, InsertCampaignConversionVariables>;
  operationName: string;
}
export const insertCampaignConversionRef: InsertCampaignConversionRef;

export function insertCampaignConversion(vars: InsertCampaignConversionVariables): MutationPromise<InsertCampaignConversionData, InsertCampaignConversionVariables>;
export function insertCampaignConversion(dc: DataConnect, vars: InsertCampaignConversionVariables): MutationPromise<InsertCampaignConversionData, InsertCampaignConversionVariables>;

interface CreateEventRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateEventVariables): MutationRef<CreateEventData, CreateEventVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateEventVariables): MutationRef<CreateEventData, CreateEventVariables>;
  operationName: string;
}
export const createEventRef: CreateEventRef;

export function createEvent(vars: CreateEventVariables): MutationPromise<CreateEventData, CreateEventVariables>;
export function createEvent(dc: DataConnect, vars: CreateEventVariables): MutationPromise<CreateEventData, CreateEventVariables>;

interface CreateEvolutionLogRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateEvolutionLogVariables): MutationRef<CreateEvolutionLogData, CreateEvolutionLogVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateEvolutionLogVariables): MutationRef<CreateEvolutionLogData, CreateEvolutionLogVariables>;
  operationName: string;
}
export const createEvolutionLogRef: CreateEvolutionLogRef;

export function createEvolutionLog(vars: CreateEvolutionLogVariables): MutationPromise<CreateEvolutionLogData, CreateEvolutionLogVariables>;
export function createEvolutionLog(dc: DataConnect, vars: CreateEvolutionLogVariables): MutationPromise<CreateEvolutionLogData, CreateEvolutionLogVariables>;

interface UpsertLeadAndLogRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertLeadAndLogVariables): MutationRef<UpsertLeadAndLogData, UpsertLeadAndLogVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpsertLeadAndLogVariables): MutationRef<UpsertLeadAndLogData, UpsertLeadAndLogVariables>;
  operationName: string;
}
export const upsertLeadAndLogRef: UpsertLeadAndLogRef;

export function upsertLeadAndLog(vars: UpsertLeadAndLogVariables): MutationPromise<UpsertLeadAndLogData, UpsertLeadAndLogVariables>;
export function upsertLeadAndLog(dc: DataConnect, vars: UpsertLeadAndLogVariables): MutationPromise<UpsertLeadAndLogData, UpsertLeadAndLogVariables>;

interface ListLeadsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars?: ListLeadsVariables): QueryRef<ListLeadsData, ListLeadsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars?: ListLeadsVariables): QueryRef<ListLeadsData, ListLeadsVariables>;
  operationName: string;
}
export const listLeadsRef: ListLeadsRef;

export function listLeads(vars?: ListLeadsVariables, options?: ExecuteQueryOptions): QueryPromise<ListLeadsData, ListLeadsVariables>;
export function listLeads(dc: DataConnect, vars?: ListLeadsVariables, options?: ExecuteQueryOptions): QueryPromise<ListLeadsData, ListLeadsVariables>;

interface GetLeadRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetLeadVariables): QueryRef<GetLeadData, GetLeadVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetLeadVariables): QueryRef<GetLeadData, GetLeadVariables>;
  operationName: string;
}
export const getLeadRef: GetLeadRef;

export function getLead(vars: GetLeadVariables, options?: ExecuteQueryOptions): QueryPromise<GetLeadData, GetLeadVariables>;
export function getLead(dc: DataConnect, vars: GetLeadVariables, options?: ExecuteQueryOptions): QueryPromise<GetLeadData, GetLeadVariables>;

interface ListDeadLeadsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListDeadLeadsVariables): QueryRef<ListDeadLeadsData, ListDeadLeadsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ListDeadLeadsVariables): QueryRef<ListDeadLeadsData, ListDeadLeadsVariables>;
  operationName: string;
}
export const listDeadLeadsRef: ListDeadLeadsRef;

export function listDeadLeads(vars: ListDeadLeadsVariables, options?: ExecuteQueryOptions): QueryPromise<ListDeadLeadsData, ListDeadLeadsVariables>;
export function listDeadLeads(dc: DataConnect, vars: ListDeadLeadsVariables, options?: ExecuteQueryOptions): QueryPromise<ListDeadLeadsData, ListDeadLeadsVariables>;

interface ListCampaignsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars?: ListCampaignsVariables): QueryRef<ListCampaignsData, ListCampaignsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars?: ListCampaignsVariables): QueryRef<ListCampaignsData, ListCampaignsVariables>;
  operationName: string;
}
export const listCampaignsRef: ListCampaignsRef;

export function listCampaigns(vars?: ListCampaignsVariables, options?: ExecuteQueryOptions): QueryPromise<ListCampaignsData, ListCampaignsVariables>;
export function listCampaigns(dc: DataConnect, vars?: ListCampaignsVariables, options?: ExecuteQueryOptions): QueryPromise<ListCampaignsData, ListCampaignsVariables>;

interface GetCampaignDetailsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetCampaignDetailsVariables): QueryRef<GetCampaignDetailsData, GetCampaignDetailsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetCampaignDetailsVariables): QueryRef<GetCampaignDetailsData, GetCampaignDetailsVariables>;
  operationName: string;
}
export const getCampaignDetailsRef: GetCampaignDetailsRef;

export function getCampaignDetails(vars: GetCampaignDetailsVariables, options?: ExecuteQueryOptions): QueryPromise<GetCampaignDetailsData, GetCampaignDetailsVariables>;
export function getCampaignDetails(dc: DataConnect, vars: GetCampaignDetailsVariables, options?: ExecuteQueryOptions): QueryPromise<GetCampaignDetailsData, GetCampaignDetailsVariables>;

interface ListEventsByTypeRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListEventsByTypeVariables): QueryRef<ListEventsByTypeData, ListEventsByTypeVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ListEventsByTypeVariables): QueryRef<ListEventsByTypeData, ListEventsByTypeVariables>;
  operationName: string;
}
export const listEventsByTypeRef: ListEventsByTypeRef;

export function listEventsByType(vars: ListEventsByTypeVariables, options?: ExecuteQueryOptions): QueryPromise<ListEventsByTypeData, ListEventsByTypeVariables>;
export function listEventsByType(dc: DataConnect, vars: ListEventsByTypeVariables, options?: ExecuteQueryOptions): QueryPromise<ListEventsByTypeData, ListEventsByTypeVariables>;

interface ListEvolutionLogsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars?: ListEvolutionLogsVariables): QueryRef<ListEvolutionLogsData, ListEvolutionLogsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars?: ListEvolutionLogsVariables): QueryRef<ListEvolutionLogsData, ListEvolutionLogsVariables>;
  operationName: string;
}
export const listEvolutionLogsRef: ListEvolutionLogsRef;

export function listEvolutionLogs(vars?: ListEvolutionLogsVariables, options?: ExecuteQueryOptions): QueryPromise<ListEvolutionLogsData, ListEvolutionLogsVariables>;
export function listEvolutionLogs(dc: DataConnect, vars?: ListEvolutionLogsVariables, options?: ExecuteQueryOptions): QueryPromise<ListEvolutionLogsData, ListEvolutionLogsVariables>;

interface GetEvolutionLogRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetEvolutionLogVariables): QueryRef<GetEvolutionLogData, GetEvolutionLogVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetEvolutionLogVariables): QueryRef<GetEvolutionLogData, GetEvolutionLogVariables>;
  operationName: string;
}
export const getEvolutionLogRef: GetEvolutionLogRef;

export function getEvolutionLog(vars: GetEvolutionLogVariables, options?: ExecuteQueryOptions): QueryPromise<GetEvolutionLogData, GetEvolutionLogVariables>;
export function getEvolutionLog(dc: DataConnect, vars: GetEvolutionLogVariables, options?: ExecuteQueryOptions): QueryPromise<GetEvolutionLogData, GetEvolutionLogVariables>;

