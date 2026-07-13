# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `crm`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*ListLeads*](#listleads)
  - [*GetLead*](#getlead)
  - [*ListDeadLeads*](#listdeadleads)
  - [*ListCampaigns*](#listcampaigns)
  - [*GetCampaignDetails*](#getcampaigndetails)
  - [*ListEventsByType*](#listeventsbytype)
  - [*ListEvolutionLogs*](#listevolutionlogs)
  - [*GetEvolutionLog*](#getevolutionlog)
- [**Mutations**](#mutations)
  - [*CreateLeadPublic*](#createleadpublic)
  - [*UpsertLead*](#upsertlead)
  - [*UpdateLead*](#updatelead)
  - [*DeleteLead*](#deletelead)
  - [*UpsertCampaign*](#upsertcampaign)
  - [*InsertCampaignConversion*](#insertcampaignconversion)
  - [*CreateEvent*](#createevent)
  - [*CreateEvolutionLog*](#createevolutionlog)
  - [*UpsertLeadAndLog*](#upsertleadandlog)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `crm`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@zapalnik/crm-dataconnect` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@zapalnik/crm-dataconnect';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@zapalnik/crm-dataconnect';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `crm` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## ListLeads
You can execute the `ListLeads` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
listLeads(vars?: ListLeadsVariables, options?: ExecuteQueryOptions): QueryPromise<ListLeadsData, ListLeadsVariables>;

interface ListLeadsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars?: ListLeadsVariables): QueryRef<ListLeadsData, ListLeadsVariables>;
}
export const listLeadsRef: ListLeadsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listLeads(dc: DataConnect, vars?: ListLeadsVariables, options?: ExecuteQueryOptions): QueryPromise<ListLeadsData, ListLeadsVariables>;

interface ListLeadsRef {
  ...
  (dc: DataConnect, vars?: ListLeadsVariables): QueryRef<ListLeadsData, ListLeadsVariables>;
}
export const listLeadsRef: ListLeadsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listLeadsRef:
```typescript
const name = listLeadsRef.operationName;
console.log(name);
```

### Variables
The `ListLeads` query has an optional argument of type `ListLeadsVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListLeadsVariables {
  status?: string | null;
  isHighTicket?: boolean | null;
  limit?: number | null;
  offset?: number | null;
}
```
### Return Type
Recall that executing the `ListLeads` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListLeadsData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `ListLeads`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listLeads, ListLeadsVariables } from '@zapalnik/crm-dataconnect';

// The `ListLeads` query has an optional argument of type `ListLeadsVariables`:
const listLeadsVars: ListLeadsVariables = {
  status: ..., // optional
  isHighTicket: ..., // optional
  limit: ..., // optional
  offset: ..., // optional
};

// Call the `listLeads()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listLeads(listLeadsVars);
// Variables can be defined inline as well.
const { data } = await listLeads({ status: ..., isHighTicket: ..., limit: ..., offset: ..., });
// Since all variables are optional for this query, you can omit the `ListLeadsVariables` argument.
const { data } = await listLeads();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listLeads(dataConnect, listLeadsVars);

console.log(data.leads);

// Or, you can use the `Promise` API.
listLeads(listLeadsVars).then((response) => {
  const data = response.data;
  console.log(data.leads);
});
```

### Using `ListLeads`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listLeadsRef, ListLeadsVariables } from '@zapalnik/crm-dataconnect';

// The `ListLeads` query has an optional argument of type `ListLeadsVariables`:
const listLeadsVars: ListLeadsVariables = {
  status: ..., // optional
  isHighTicket: ..., // optional
  limit: ..., // optional
  offset: ..., // optional
};

// Call the `listLeadsRef()` function to get a reference to the query.
const ref = listLeadsRef(listLeadsVars);
// Variables can be defined inline as well.
const ref = listLeadsRef({ status: ..., isHighTicket: ..., limit: ..., offset: ..., });
// Since all variables are optional for this query, you can omit the `ListLeadsVariables` argument.
const ref = listLeadsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listLeadsRef(dataConnect, listLeadsVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.leads);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.leads);
});
```

## GetLead
You can execute the `GetLead` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
getLead(vars: GetLeadVariables, options?: ExecuteQueryOptions): QueryPromise<GetLeadData, GetLeadVariables>;

interface GetLeadRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetLeadVariables): QueryRef<GetLeadData, GetLeadVariables>;
}
export const getLeadRef: GetLeadRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getLead(dc: DataConnect, vars: GetLeadVariables, options?: ExecuteQueryOptions): QueryPromise<GetLeadData, GetLeadVariables>;

interface GetLeadRef {
  ...
  (dc: DataConnect, vars: GetLeadVariables): QueryRef<GetLeadData, GetLeadVariables>;
}
export const getLeadRef: GetLeadRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getLeadRef:
```typescript
const name = getLeadRef.operationName;
console.log(name);
```

### Variables
The `GetLead` query requires an argument of type `GetLeadVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetLeadVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `GetLead` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetLeadData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `GetLead`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getLead, GetLeadVariables } from '@zapalnik/crm-dataconnect';

// The `GetLead` query requires an argument of type `GetLeadVariables`:
const getLeadVars: GetLeadVariables = {
  id: ..., 
};

// Call the `getLead()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getLead(getLeadVars);
// Variables can be defined inline as well.
const { data } = await getLead({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getLead(dataConnect, getLeadVars);

console.log(data.lead);

// Or, you can use the `Promise` API.
getLead(getLeadVars).then((response) => {
  const data = response.data;
  console.log(data.lead);
});
```

### Using `GetLead`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getLeadRef, GetLeadVariables } from '@zapalnik/crm-dataconnect';

// The `GetLead` query requires an argument of type `GetLeadVariables`:
const getLeadVars: GetLeadVariables = {
  id: ..., 
};

// Call the `getLeadRef()` function to get a reference to the query.
const ref = getLeadRef(getLeadVars);
// Variables can be defined inline as well.
const ref = getLeadRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getLeadRef(dataConnect, getLeadVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.lead);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.lead);
});
```

## ListDeadLeads
You can execute the `ListDeadLeads` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
listDeadLeads(vars: ListDeadLeadsVariables, options?: ExecuteQueryOptions): QueryPromise<ListDeadLeadsData, ListDeadLeadsVariables>;

interface ListDeadLeadsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListDeadLeadsVariables): QueryRef<ListDeadLeadsData, ListDeadLeadsVariables>;
}
export const listDeadLeadsRef: ListDeadLeadsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listDeadLeads(dc: DataConnect, vars: ListDeadLeadsVariables, options?: ExecuteQueryOptions): QueryPromise<ListDeadLeadsData, ListDeadLeadsVariables>;

interface ListDeadLeadsRef {
  ...
  (dc: DataConnect, vars: ListDeadLeadsVariables): QueryRef<ListDeadLeadsData, ListDeadLeadsVariables>;
}
export const listDeadLeadsRef: ListDeadLeadsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listDeadLeadsRef:
```typescript
const name = listDeadLeadsRef.operationName;
console.log(name);
```

### Variables
The `ListDeadLeads` query requires an argument of type `ListDeadLeadsVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListDeadLeadsVariables {
  thirtyDaysAgo: TimestampString;
}
```
### Return Type
Recall that executing the `ListDeadLeads` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListDeadLeadsData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `ListDeadLeads`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listDeadLeads, ListDeadLeadsVariables } from '@zapalnik/crm-dataconnect';

// The `ListDeadLeads` query requires an argument of type `ListDeadLeadsVariables`:
const listDeadLeadsVars: ListDeadLeadsVariables = {
  thirtyDaysAgo: ..., 
};

// Call the `listDeadLeads()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listDeadLeads(listDeadLeadsVars);
// Variables can be defined inline as well.
const { data } = await listDeadLeads({ thirtyDaysAgo: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listDeadLeads(dataConnect, listDeadLeadsVars);

console.log(data.leads);

// Or, you can use the `Promise` API.
listDeadLeads(listDeadLeadsVars).then((response) => {
  const data = response.data;
  console.log(data.leads);
});
```

### Using `ListDeadLeads`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listDeadLeadsRef, ListDeadLeadsVariables } from '@zapalnik/crm-dataconnect';

// The `ListDeadLeads` query requires an argument of type `ListDeadLeadsVariables`:
const listDeadLeadsVars: ListDeadLeadsVariables = {
  thirtyDaysAgo: ..., 
};

// Call the `listDeadLeadsRef()` function to get a reference to the query.
const ref = listDeadLeadsRef(listDeadLeadsVars);
// Variables can be defined inline as well.
const ref = listDeadLeadsRef({ thirtyDaysAgo: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listDeadLeadsRef(dataConnect, listDeadLeadsVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.leads);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.leads);
});
```

## ListCampaigns
You can execute the `ListCampaigns` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
listCampaigns(vars?: ListCampaignsVariables, options?: ExecuteQueryOptions): QueryPromise<ListCampaignsData, ListCampaignsVariables>;

interface ListCampaignsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars?: ListCampaignsVariables): QueryRef<ListCampaignsData, ListCampaignsVariables>;
}
export const listCampaignsRef: ListCampaignsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listCampaigns(dc: DataConnect, vars?: ListCampaignsVariables, options?: ExecuteQueryOptions): QueryPromise<ListCampaignsData, ListCampaignsVariables>;

interface ListCampaignsRef {
  ...
  (dc: DataConnect, vars?: ListCampaignsVariables): QueryRef<ListCampaignsData, ListCampaignsVariables>;
}
export const listCampaignsRef: ListCampaignsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listCampaignsRef:
```typescript
const name = listCampaignsRef.operationName;
console.log(name);
```

### Variables
The `ListCampaigns` query has an optional argument of type `ListCampaignsVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListCampaignsVariables {
  status?: string | null;
  limit?: number | null;
  offset?: number | null;
}
```
### Return Type
Recall that executing the `ListCampaigns` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListCampaignsData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `ListCampaigns`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listCampaigns, ListCampaignsVariables } from '@zapalnik/crm-dataconnect';

// The `ListCampaigns` query has an optional argument of type `ListCampaignsVariables`:
const listCampaignsVars: ListCampaignsVariables = {
  status: ..., // optional
  limit: ..., // optional
  offset: ..., // optional
};

// Call the `listCampaigns()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listCampaigns(listCampaignsVars);
// Variables can be defined inline as well.
const { data } = await listCampaigns({ status: ..., limit: ..., offset: ..., });
// Since all variables are optional for this query, you can omit the `ListCampaignsVariables` argument.
const { data } = await listCampaigns();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listCampaigns(dataConnect, listCampaignsVars);

console.log(data.campaigns);

// Or, you can use the `Promise` API.
listCampaigns(listCampaignsVars).then((response) => {
  const data = response.data;
  console.log(data.campaigns);
});
```

### Using `ListCampaigns`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listCampaignsRef, ListCampaignsVariables } from '@zapalnik/crm-dataconnect';

// The `ListCampaigns` query has an optional argument of type `ListCampaignsVariables`:
const listCampaignsVars: ListCampaignsVariables = {
  status: ..., // optional
  limit: ..., // optional
  offset: ..., // optional
};

// Call the `listCampaignsRef()` function to get a reference to the query.
const ref = listCampaignsRef(listCampaignsVars);
// Variables can be defined inline as well.
const ref = listCampaignsRef({ status: ..., limit: ..., offset: ..., });
// Since all variables are optional for this query, you can omit the `ListCampaignsVariables` argument.
const ref = listCampaignsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listCampaignsRef(dataConnect, listCampaignsVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.campaigns);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.campaigns);
});
```

## GetCampaignDetails
You can execute the `GetCampaignDetails` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
getCampaignDetails(vars: GetCampaignDetailsVariables, options?: ExecuteQueryOptions): QueryPromise<GetCampaignDetailsData, GetCampaignDetailsVariables>;

interface GetCampaignDetailsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetCampaignDetailsVariables): QueryRef<GetCampaignDetailsData, GetCampaignDetailsVariables>;
}
export const getCampaignDetailsRef: GetCampaignDetailsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getCampaignDetails(dc: DataConnect, vars: GetCampaignDetailsVariables, options?: ExecuteQueryOptions): QueryPromise<GetCampaignDetailsData, GetCampaignDetailsVariables>;

interface GetCampaignDetailsRef {
  ...
  (dc: DataConnect, vars: GetCampaignDetailsVariables): QueryRef<GetCampaignDetailsData, GetCampaignDetailsVariables>;
}
export const getCampaignDetailsRef: GetCampaignDetailsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getCampaignDetailsRef:
```typescript
const name = getCampaignDetailsRef.operationName;
console.log(name);
```

### Variables
The `GetCampaignDetails` query requires an argument of type `GetCampaignDetailsVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetCampaignDetailsVariables {
  campaignId: UUIDString;
}
```
### Return Type
Recall that executing the `GetCampaignDetails` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetCampaignDetailsData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `GetCampaignDetails`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getCampaignDetails, GetCampaignDetailsVariables } from '@zapalnik/crm-dataconnect';

// The `GetCampaignDetails` query requires an argument of type `GetCampaignDetailsVariables`:
const getCampaignDetailsVars: GetCampaignDetailsVariables = {
  campaignId: ..., 
};

// Call the `getCampaignDetails()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getCampaignDetails(getCampaignDetailsVars);
// Variables can be defined inline as well.
const { data } = await getCampaignDetails({ campaignId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getCampaignDetails(dataConnect, getCampaignDetailsVars);

console.log(data.campaign);

// Or, you can use the `Promise` API.
getCampaignDetails(getCampaignDetailsVars).then((response) => {
  const data = response.data;
  console.log(data.campaign);
});
```

### Using `GetCampaignDetails`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getCampaignDetailsRef, GetCampaignDetailsVariables } from '@zapalnik/crm-dataconnect';

// The `GetCampaignDetails` query requires an argument of type `GetCampaignDetailsVariables`:
const getCampaignDetailsVars: GetCampaignDetailsVariables = {
  campaignId: ..., 
};

// Call the `getCampaignDetailsRef()` function to get a reference to the query.
const ref = getCampaignDetailsRef(getCampaignDetailsVars);
// Variables can be defined inline as well.
const ref = getCampaignDetailsRef({ campaignId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getCampaignDetailsRef(dataConnect, getCampaignDetailsVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.campaign);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.campaign);
});
```

## ListEventsByType
You can execute the `ListEventsByType` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
listEventsByType(vars: ListEventsByTypeVariables, options?: ExecuteQueryOptions): QueryPromise<ListEventsByTypeData, ListEventsByTypeVariables>;

interface ListEventsByTypeRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListEventsByTypeVariables): QueryRef<ListEventsByTypeData, ListEventsByTypeVariables>;
}
export const listEventsByTypeRef: ListEventsByTypeRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listEventsByType(dc: DataConnect, vars: ListEventsByTypeVariables, options?: ExecuteQueryOptions): QueryPromise<ListEventsByTypeData, ListEventsByTypeVariables>;

interface ListEventsByTypeRef {
  ...
  (dc: DataConnect, vars: ListEventsByTypeVariables): QueryRef<ListEventsByTypeData, ListEventsByTypeVariables>;
}
export const listEventsByTypeRef: ListEventsByTypeRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listEventsByTypeRef:
```typescript
const name = listEventsByTypeRef.operationName;
console.log(name);
```

### Variables
The `ListEventsByType` query requires an argument of type `ListEventsByTypeVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListEventsByTypeVariables {
  eventType: string;
  limit?: number | null;
}
```
### Return Type
Recall that executing the `ListEventsByType` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListEventsByTypeData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListEventsByTypeData {
  events: ({
    id: UUIDString;
    timestamp: TimestampString;
    eventType: string;
    testRunId?: string | null;
    payload: unknown;
  } & Event_Key)[];
}
```
### Using `ListEventsByType`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listEventsByType, ListEventsByTypeVariables } from '@zapalnik/crm-dataconnect';

// The `ListEventsByType` query requires an argument of type `ListEventsByTypeVariables`:
const listEventsByTypeVars: ListEventsByTypeVariables = {
  eventType: ..., 
  limit: ..., // optional
};

// Call the `listEventsByType()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listEventsByType(listEventsByTypeVars);
// Variables can be defined inline as well.
const { data } = await listEventsByType({ eventType: ..., limit: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listEventsByType(dataConnect, listEventsByTypeVars);

console.log(data.events);

// Or, you can use the `Promise` API.
listEventsByType(listEventsByTypeVars).then((response) => {
  const data = response.data;
  console.log(data.events);
});
```

### Using `ListEventsByType`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listEventsByTypeRef, ListEventsByTypeVariables } from '@zapalnik/crm-dataconnect';

// The `ListEventsByType` query requires an argument of type `ListEventsByTypeVariables`:
const listEventsByTypeVars: ListEventsByTypeVariables = {
  eventType: ..., 
  limit: ..., // optional
};

// Call the `listEventsByTypeRef()` function to get a reference to the query.
const ref = listEventsByTypeRef(listEventsByTypeVars);
// Variables can be defined inline as well.
const ref = listEventsByTypeRef({ eventType: ..., limit: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listEventsByTypeRef(dataConnect, listEventsByTypeVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.events);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.events);
});
```

## ListEvolutionLogs
You can execute the `ListEvolutionLogs` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
listEvolutionLogs(vars?: ListEvolutionLogsVariables, options?: ExecuteQueryOptions): QueryPromise<ListEvolutionLogsData, ListEvolutionLogsVariables>;

interface ListEvolutionLogsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars?: ListEvolutionLogsVariables): QueryRef<ListEvolutionLogsData, ListEvolutionLogsVariables>;
}
export const listEvolutionLogsRef: ListEvolutionLogsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listEvolutionLogs(dc: DataConnect, vars?: ListEvolutionLogsVariables, options?: ExecuteQueryOptions): QueryPromise<ListEvolutionLogsData, ListEvolutionLogsVariables>;

interface ListEvolutionLogsRef {
  ...
  (dc: DataConnect, vars?: ListEvolutionLogsVariables): QueryRef<ListEvolutionLogsData, ListEvolutionLogsVariables>;
}
export const listEvolutionLogsRef: ListEvolutionLogsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listEvolutionLogsRef:
```typescript
const name = listEvolutionLogsRef.operationName;
console.log(name);
```

### Variables
The `ListEvolutionLogs` query has an optional argument of type `ListEvolutionLogsVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListEvolutionLogsVariables {
  success?: boolean | null;
  limit?: number | null;
  offset?: number | null;
}
```
### Return Type
Recall that executing the `ListEvolutionLogs` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListEvolutionLogsData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListEvolutionLogsData {
  evolutionLogs: ({
    id: UUIDString;
    filePath: string;
    success: boolean;
    createdAt: TimestampString;
  } & EvolutionLog_Key)[];
}
```
### Using `ListEvolutionLogs`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listEvolutionLogs, ListEvolutionLogsVariables } from '@zapalnik/crm-dataconnect';

// The `ListEvolutionLogs` query has an optional argument of type `ListEvolutionLogsVariables`:
const listEvolutionLogsVars: ListEvolutionLogsVariables = {
  success: ..., // optional
  limit: ..., // optional
  offset: ..., // optional
};

// Call the `listEvolutionLogs()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listEvolutionLogs(listEvolutionLogsVars);
// Variables can be defined inline as well.
const { data } = await listEvolutionLogs({ success: ..., limit: ..., offset: ..., });
// Since all variables are optional for this query, you can omit the `ListEvolutionLogsVariables` argument.
const { data } = await listEvolutionLogs();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listEvolutionLogs(dataConnect, listEvolutionLogsVars);

console.log(data.evolutionLogs);

// Or, you can use the `Promise` API.
listEvolutionLogs(listEvolutionLogsVars).then((response) => {
  const data = response.data;
  console.log(data.evolutionLogs);
});
```

### Using `ListEvolutionLogs`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listEvolutionLogsRef, ListEvolutionLogsVariables } from '@zapalnik/crm-dataconnect';

// The `ListEvolutionLogs` query has an optional argument of type `ListEvolutionLogsVariables`:
const listEvolutionLogsVars: ListEvolutionLogsVariables = {
  success: ..., // optional
  limit: ..., // optional
  offset: ..., // optional
};

// Call the `listEvolutionLogsRef()` function to get a reference to the query.
const ref = listEvolutionLogsRef(listEvolutionLogsVars);
// Variables can be defined inline as well.
const ref = listEvolutionLogsRef({ success: ..., limit: ..., offset: ..., });
// Since all variables are optional for this query, you can omit the `ListEvolutionLogsVariables` argument.
const ref = listEvolutionLogsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listEvolutionLogsRef(dataConnect, listEvolutionLogsVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.evolutionLogs);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.evolutionLogs);
});
```

## GetEvolutionLog
You can execute the `GetEvolutionLog` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
getEvolutionLog(vars: GetEvolutionLogVariables, options?: ExecuteQueryOptions): QueryPromise<GetEvolutionLogData, GetEvolutionLogVariables>;

interface GetEvolutionLogRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetEvolutionLogVariables): QueryRef<GetEvolutionLogData, GetEvolutionLogVariables>;
}
export const getEvolutionLogRef: GetEvolutionLogRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getEvolutionLog(dc: DataConnect, vars: GetEvolutionLogVariables, options?: ExecuteQueryOptions): QueryPromise<GetEvolutionLogData, GetEvolutionLogVariables>;

interface GetEvolutionLogRef {
  ...
  (dc: DataConnect, vars: GetEvolutionLogVariables): QueryRef<GetEvolutionLogData, GetEvolutionLogVariables>;
}
export const getEvolutionLogRef: GetEvolutionLogRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getEvolutionLogRef:
```typescript
const name = getEvolutionLogRef.operationName;
console.log(name);
```

### Variables
The `GetEvolutionLog` query requires an argument of type `GetEvolutionLogVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetEvolutionLogVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `GetEvolutionLog` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetEvolutionLogData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `GetEvolutionLog`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getEvolutionLog, GetEvolutionLogVariables } from '@zapalnik/crm-dataconnect';

// The `GetEvolutionLog` query requires an argument of type `GetEvolutionLogVariables`:
const getEvolutionLogVars: GetEvolutionLogVariables = {
  id: ..., 
};

// Call the `getEvolutionLog()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getEvolutionLog(getEvolutionLogVars);
// Variables can be defined inline as well.
const { data } = await getEvolutionLog({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getEvolutionLog(dataConnect, getEvolutionLogVars);

console.log(data.evolutionLog);

// Or, you can use the `Promise` API.
getEvolutionLog(getEvolutionLogVars).then((response) => {
  const data = response.data;
  console.log(data.evolutionLog);
});
```

### Using `GetEvolutionLog`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getEvolutionLogRef, GetEvolutionLogVariables } from '@zapalnik/crm-dataconnect';

// The `GetEvolutionLog` query requires an argument of type `GetEvolutionLogVariables`:
const getEvolutionLogVars: GetEvolutionLogVariables = {
  id: ..., 
};

// Call the `getEvolutionLogRef()` function to get a reference to the query.
const ref = getEvolutionLogRef(getEvolutionLogVars);
// Variables can be defined inline as well.
const ref = getEvolutionLogRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getEvolutionLogRef(dataConnect, getEvolutionLogVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.evolutionLog);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.evolutionLog);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `crm` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## CreateLeadPublic
You can execute the `CreateLeadPublic` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
createLeadPublic(vars: CreateLeadPublicVariables): MutationPromise<CreateLeadPublicData, CreateLeadPublicVariables>;

interface CreateLeadPublicRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateLeadPublicVariables): MutationRef<CreateLeadPublicData, CreateLeadPublicVariables>;
}
export const createLeadPublicRef: CreateLeadPublicRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createLeadPublic(dc: DataConnect, vars: CreateLeadPublicVariables): MutationPromise<CreateLeadPublicData, CreateLeadPublicVariables>;

interface CreateLeadPublicRef {
  ...
  (dc: DataConnect, vars: CreateLeadPublicVariables): MutationRef<CreateLeadPublicData, CreateLeadPublicVariables>;
}
export const createLeadPublicRef: CreateLeadPublicRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createLeadPublicRef:
```typescript
const name = createLeadPublicRef.operationName;
console.log(name);
```

### Variables
The `CreateLeadPublic` mutation requires an argument of type `CreateLeadPublicVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateLeadPublicVariables {
  name: string;
  email?: string | null;
  companyName?: string | null;
  bio?: string | null;
  source: string;
  message?: string | null;
  priority?: LeadPriority | null;
}
```
### Return Type
Recall that executing the `CreateLeadPublic` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateLeadPublicData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateLeadPublicData {
  lead_insert: Lead_Key;
}
```
### Using `CreateLeadPublic`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createLeadPublic, CreateLeadPublicVariables } from '@zapalnik/crm-dataconnect';

// The `CreateLeadPublic` mutation requires an argument of type `CreateLeadPublicVariables`:
const createLeadPublicVars: CreateLeadPublicVariables = {
  name: ..., 
  email: ..., // optional
  companyName: ..., // optional
  bio: ..., // optional
  source: ..., 
  message: ..., // optional
  priority: ..., // optional
};

// Call the `createLeadPublic()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createLeadPublic(createLeadPublicVars);
// Variables can be defined inline as well.
const { data } = await createLeadPublic({ name: ..., email: ..., companyName: ..., bio: ..., source: ..., message: ..., priority: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createLeadPublic(dataConnect, createLeadPublicVars);

console.log(data.lead_insert);

// Or, you can use the `Promise` API.
createLeadPublic(createLeadPublicVars).then((response) => {
  const data = response.data;
  console.log(data.lead_insert);
});
```

### Using `CreateLeadPublic`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createLeadPublicRef, CreateLeadPublicVariables } from '@zapalnik/crm-dataconnect';

// The `CreateLeadPublic` mutation requires an argument of type `CreateLeadPublicVariables`:
const createLeadPublicVars: CreateLeadPublicVariables = {
  name: ..., 
  email: ..., // optional
  companyName: ..., // optional
  bio: ..., // optional
  source: ..., 
  message: ..., // optional
  priority: ..., // optional
};

// Call the `createLeadPublicRef()` function to get a reference to the mutation.
const ref = createLeadPublicRef(createLeadPublicVars);
// Variables can be defined inline as well.
const ref = createLeadPublicRef({ name: ..., email: ..., companyName: ..., bio: ..., source: ..., message: ..., priority: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createLeadPublicRef(dataConnect, createLeadPublicVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.lead_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.lead_insert);
});
```

## UpsertLead
You can execute the `UpsertLead` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
upsertLead(vars: UpsertLeadVariables): MutationPromise<UpsertLeadData, UpsertLeadVariables>;

interface UpsertLeadRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertLeadVariables): MutationRef<UpsertLeadData, UpsertLeadVariables>;
}
export const upsertLeadRef: UpsertLeadRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
upsertLead(dc: DataConnect, vars: UpsertLeadVariables): MutationPromise<UpsertLeadData, UpsertLeadVariables>;

interface UpsertLeadRef {
  ...
  (dc: DataConnect, vars: UpsertLeadVariables): MutationRef<UpsertLeadData, UpsertLeadVariables>;
}
export const upsertLeadRef: UpsertLeadRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the upsertLeadRef:
```typescript
const name = upsertLeadRef.operationName;
console.log(name);
```

### Variables
The `UpsertLead` mutation requires an argument of type `UpsertLeadVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
```
### Return Type
Recall that executing the `UpsertLead` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpsertLeadData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpsertLeadData {
  lead_upsert: Lead_Key;
}
```
### Using `UpsertLead`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, upsertLead, UpsertLeadVariables } from '@zapalnik/crm-dataconnect';

// The `UpsertLead` mutation requires an argument of type `UpsertLeadVariables`:
const upsertLeadVars: UpsertLeadVariables = {
  id: ..., // optional
  name: ..., 
  email: ..., // optional
  companyName: ..., // optional
  bio: ..., // optional
  source: ..., // optional
  isHighTicket: ..., // optional
  score: ..., // optional
  draftMessage: ..., // optional
  status: ..., // optional
  priority: ..., // optional
  message: ..., // optional
  rejectionReason: ..., // optional
  necromancyTriggered: ..., // optional
  lastContact: ..., // optional
  lastNecromancyAttempt: ..., // optional
  resurrectionSpell: ..., // optional
  aiEnrichment: ..., // optional
  dmSequence: ..., // optional
  chatHistory: ..., // optional
  pitchCard: ..., // optional
  tacticalBrief: ..., // optional
  campaignId: ..., // optional
};

// Call the `upsertLead()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await upsertLead(upsertLeadVars);
// Variables can be defined inline as well.
const { data } = await upsertLead({ id: ..., name: ..., email: ..., companyName: ..., bio: ..., source: ..., isHighTicket: ..., score: ..., draftMessage: ..., status: ..., priority: ..., message: ..., rejectionReason: ..., necromancyTriggered: ..., lastContact: ..., lastNecromancyAttempt: ..., resurrectionSpell: ..., aiEnrichment: ..., dmSequence: ..., chatHistory: ..., pitchCard: ..., tacticalBrief: ..., campaignId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await upsertLead(dataConnect, upsertLeadVars);

console.log(data.lead_upsert);

// Or, you can use the `Promise` API.
upsertLead(upsertLeadVars).then((response) => {
  const data = response.data;
  console.log(data.lead_upsert);
});
```

### Using `UpsertLead`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, upsertLeadRef, UpsertLeadVariables } from '@zapalnik/crm-dataconnect';

// The `UpsertLead` mutation requires an argument of type `UpsertLeadVariables`:
const upsertLeadVars: UpsertLeadVariables = {
  id: ..., // optional
  name: ..., 
  email: ..., // optional
  companyName: ..., // optional
  bio: ..., // optional
  source: ..., // optional
  isHighTicket: ..., // optional
  score: ..., // optional
  draftMessage: ..., // optional
  status: ..., // optional
  priority: ..., // optional
  message: ..., // optional
  rejectionReason: ..., // optional
  necromancyTriggered: ..., // optional
  lastContact: ..., // optional
  lastNecromancyAttempt: ..., // optional
  resurrectionSpell: ..., // optional
  aiEnrichment: ..., // optional
  dmSequence: ..., // optional
  chatHistory: ..., // optional
  pitchCard: ..., // optional
  tacticalBrief: ..., // optional
  campaignId: ..., // optional
};

// Call the `upsertLeadRef()` function to get a reference to the mutation.
const ref = upsertLeadRef(upsertLeadVars);
// Variables can be defined inline as well.
const ref = upsertLeadRef({ id: ..., name: ..., email: ..., companyName: ..., bio: ..., source: ..., isHighTicket: ..., score: ..., draftMessage: ..., status: ..., priority: ..., message: ..., rejectionReason: ..., necromancyTriggered: ..., lastContact: ..., lastNecromancyAttempt: ..., resurrectionSpell: ..., aiEnrichment: ..., dmSequence: ..., chatHistory: ..., pitchCard: ..., tacticalBrief: ..., campaignId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = upsertLeadRef(dataConnect, upsertLeadVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.lead_upsert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.lead_upsert);
});
```

## UpdateLead
You can execute the `UpdateLead` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
updateLead(vars: UpdateLeadVariables): MutationPromise<UpdateLeadData, UpdateLeadVariables>;

interface UpdateLeadRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateLeadVariables): MutationRef<UpdateLeadData, UpdateLeadVariables>;
}
export const updateLeadRef: UpdateLeadRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateLead(dc: DataConnect, vars: UpdateLeadVariables): MutationPromise<UpdateLeadData, UpdateLeadVariables>;

interface UpdateLeadRef {
  ...
  (dc: DataConnect, vars: UpdateLeadVariables): MutationRef<UpdateLeadData, UpdateLeadVariables>;
}
export const updateLeadRef: UpdateLeadRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateLeadRef:
```typescript
const name = updateLeadRef.operationName;
console.log(name);
```

### Variables
The `UpdateLead` mutation requires an argument of type `UpdateLeadVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
```
### Return Type
Recall that executing the `UpdateLead` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateLeadData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateLeadData {
  lead_update?: Lead_Key | null;
}
```
### Using `UpdateLead`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateLead, UpdateLeadVariables } from '@zapalnik/crm-dataconnect';

// The `UpdateLead` mutation requires an argument of type `UpdateLeadVariables`:
const updateLeadVars: UpdateLeadVariables = {
  id: ..., 
  status: ..., // optional
  priority: ..., // optional
  aiEnrichment: ..., // optional
  dmSequence: ..., // optional
  chatHistory: ..., // optional
  pitchCard: ..., // optional
  tacticalBrief: ..., // optional
  rejectionReason: ..., // optional
  necromancyTriggered: ..., // optional
  lastNecromancyAttempt: ..., // optional
  resurrectionSpell: ..., // optional
  lastContact: ..., // optional
};

// Call the `updateLead()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateLead(updateLeadVars);
// Variables can be defined inline as well.
const { data } = await updateLead({ id: ..., status: ..., priority: ..., aiEnrichment: ..., dmSequence: ..., chatHistory: ..., pitchCard: ..., tacticalBrief: ..., rejectionReason: ..., necromancyTriggered: ..., lastNecromancyAttempt: ..., resurrectionSpell: ..., lastContact: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateLead(dataConnect, updateLeadVars);

console.log(data.lead_update);

// Or, you can use the `Promise` API.
updateLead(updateLeadVars).then((response) => {
  const data = response.data;
  console.log(data.lead_update);
});
```

### Using `UpdateLead`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateLeadRef, UpdateLeadVariables } from '@zapalnik/crm-dataconnect';

// The `UpdateLead` mutation requires an argument of type `UpdateLeadVariables`:
const updateLeadVars: UpdateLeadVariables = {
  id: ..., 
  status: ..., // optional
  priority: ..., // optional
  aiEnrichment: ..., // optional
  dmSequence: ..., // optional
  chatHistory: ..., // optional
  pitchCard: ..., // optional
  tacticalBrief: ..., // optional
  rejectionReason: ..., // optional
  necromancyTriggered: ..., // optional
  lastNecromancyAttempt: ..., // optional
  resurrectionSpell: ..., // optional
  lastContact: ..., // optional
};

// Call the `updateLeadRef()` function to get a reference to the mutation.
const ref = updateLeadRef(updateLeadVars);
// Variables can be defined inline as well.
const ref = updateLeadRef({ id: ..., status: ..., priority: ..., aiEnrichment: ..., dmSequence: ..., chatHistory: ..., pitchCard: ..., tacticalBrief: ..., rejectionReason: ..., necromancyTriggered: ..., lastNecromancyAttempt: ..., resurrectionSpell: ..., lastContact: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateLeadRef(dataConnect, updateLeadVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.lead_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.lead_update);
});
```

## DeleteLead
You can execute the `DeleteLead` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
deleteLead(vars: DeleteLeadVariables): MutationPromise<DeleteLeadData, DeleteLeadVariables>;

interface DeleteLeadRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteLeadVariables): MutationRef<DeleteLeadData, DeleteLeadVariables>;
}
export const deleteLeadRef: DeleteLeadRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteLead(dc: DataConnect, vars: DeleteLeadVariables): MutationPromise<DeleteLeadData, DeleteLeadVariables>;

interface DeleteLeadRef {
  ...
  (dc: DataConnect, vars: DeleteLeadVariables): MutationRef<DeleteLeadData, DeleteLeadVariables>;
}
export const deleteLeadRef: DeleteLeadRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteLeadRef:
```typescript
const name = deleteLeadRef.operationName;
console.log(name);
```

### Variables
The `DeleteLead` mutation requires an argument of type `DeleteLeadVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteLeadVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `DeleteLead` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteLeadData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteLeadData {
  lead_delete?: Lead_Key | null;
}
```
### Using `DeleteLead`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteLead, DeleteLeadVariables } from '@zapalnik/crm-dataconnect';

// The `DeleteLead` mutation requires an argument of type `DeleteLeadVariables`:
const deleteLeadVars: DeleteLeadVariables = {
  id: ..., 
};

// Call the `deleteLead()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteLead(deleteLeadVars);
// Variables can be defined inline as well.
const { data } = await deleteLead({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteLead(dataConnect, deleteLeadVars);

console.log(data.lead_delete);

// Or, you can use the `Promise` API.
deleteLead(deleteLeadVars).then((response) => {
  const data = response.data;
  console.log(data.lead_delete);
});
```

### Using `DeleteLead`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteLeadRef, DeleteLeadVariables } from '@zapalnik/crm-dataconnect';

// The `DeleteLead` mutation requires an argument of type `DeleteLeadVariables`:
const deleteLeadVars: DeleteLeadVariables = {
  id: ..., 
};

// Call the `deleteLeadRef()` function to get a reference to the mutation.
const ref = deleteLeadRef(deleteLeadVars);
// Variables can be defined inline as well.
const ref = deleteLeadRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteLeadRef(dataConnect, deleteLeadVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.lead_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.lead_delete);
});
```

## UpsertCampaign
You can execute the `UpsertCampaign` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
upsertCampaign(vars: UpsertCampaignVariables): MutationPromise<UpsertCampaignData, UpsertCampaignVariables>;

interface UpsertCampaignRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertCampaignVariables): MutationRef<UpsertCampaignData, UpsertCampaignVariables>;
}
export const upsertCampaignRef: UpsertCampaignRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
upsertCampaign(dc: DataConnect, vars: UpsertCampaignVariables): MutationPromise<UpsertCampaignData, UpsertCampaignVariables>;

interface UpsertCampaignRef {
  ...
  (dc: DataConnect, vars: UpsertCampaignVariables): MutationRef<UpsertCampaignData, UpsertCampaignVariables>;
}
export const upsertCampaignRef: UpsertCampaignRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the upsertCampaignRef:
```typescript
const name = upsertCampaignRef.operationName;
console.log(name);
```

### Variables
The `UpsertCampaign` mutation requires an argument of type `UpsertCampaignVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpsertCampaignVariables {
  id?: UUIDString | null;
  name: string;
  status?: string | null;
  reach?: number | null;
  comments?: number | null;
  dmsSent?: number | null;
  responseSpeed?: number | null;
}
```
### Return Type
Recall that executing the `UpsertCampaign` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpsertCampaignData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpsertCampaignData {
  campaign_upsert: Campaign_Key;
}
```
### Using `UpsertCampaign`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, upsertCampaign, UpsertCampaignVariables } from '@zapalnik/crm-dataconnect';

// The `UpsertCampaign` mutation requires an argument of type `UpsertCampaignVariables`:
const upsertCampaignVars: UpsertCampaignVariables = {
  id: ..., // optional
  name: ..., 
  status: ..., // optional
  reach: ..., // optional
  comments: ..., // optional
  dmsSent: ..., // optional
  responseSpeed: ..., // optional
};

// Call the `upsertCampaign()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await upsertCampaign(upsertCampaignVars);
// Variables can be defined inline as well.
const { data } = await upsertCampaign({ id: ..., name: ..., status: ..., reach: ..., comments: ..., dmsSent: ..., responseSpeed: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await upsertCampaign(dataConnect, upsertCampaignVars);

console.log(data.campaign_upsert);

// Or, you can use the `Promise` API.
upsertCampaign(upsertCampaignVars).then((response) => {
  const data = response.data;
  console.log(data.campaign_upsert);
});
```

### Using `UpsertCampaign`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, upsertCampaignRef, UpsertCampaignVariables } from '@zapalnik/crm-dataconnect';

// The `UpsertCampaign` mutation requires an argument of type `UpsertCampaignVariables`:
const upsertCampaignVars: UpsertCampaignVariables = {
  id: ..., // optional
  name: ..., 
  status: ..., // optional
  reach: ..., // optional
  comments: ..., // optional
  dmsSent: ..., // optional
  responseSpeed: ..., // optional
};

// Call the `upsertCampaignRef()` function to get a reference to the mutation.
const ref = upsertCampaignRef(upsertCampaignVars);
// Variables can be defined inline as well.
const ref = upsertCampaignRef({ id: ..., name: ..., status: ..., reach: ..., comments: ..., dmsSent: ..., responseSpeed: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = upsertCampaignRef(dataConnect, upsertCampaignVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.campaign_upsert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.campaign_upsert);
});
```

## InsertCampaignConversion
You can execute the `InsertCampaignConversion` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
insertCampaignConversion(vars: InsertCampaignConversionVariables): MutationPromise<InsertCampaignConversionData, InsertCampaignConversionVariables>;

interface InsertCampaignConversionRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: InsertCampaignConversionVariables): MutationRef<InsertCampaignConversionData, InsertCampaignConversionVariables>;
}
export const insertCampaignConversionRef: InsertCampaignConversionRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
insertCampaignConversion(dc: DataConnect, vars: InsertCampaignConversionVariables): MutationPromise<InsertCampaignConversionData, InsertCampaignConversionVariables>;

interface InsertCampaignConversionRef {
  ...
  (dc: DataConnect, vars: InsertCampaignConversionVariables): MutationRef<InsertCampaignConversionData, InsertCampaignConversionVariables>;
}
export const insertCampaignConversionRef: InsertCampaignConversionRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the insertCampaignConversionRef:
```typescript
const name = insertCampaignConversionRef.operationName;
console.log(name);
```

### Variables
The `InsertCampaignConversion` mutation requires an argument of type `InsertCampaignConversionVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface InsertCampaignConversionVariables {
  campaignId: UUIDString;
  date: DateString;
  conversions: number;
  facebook?: number | null;
  linkedin?: number | null;
  direct?: number | null;
}
```
### Return Type
Recall that executing the `InsertCampaignConversion` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `InsertCampaignConversionData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface InsertCampaignConversionData {
  campaignConversion_insert: CampaignConversion_Key;
}
```
### Using `InsertCampaignConversion`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, insertCampaignConversion, InsertCampaignConversionVariables } from '@zapalnik/crm-dataconnect';

// The `InsertCampaignConversion` mutation requires an argument of type `InsertCampaignConversionVariables`:
const insertCampaignConversionVars: InsertCampaignConversionVariables = {
  campaignId: ..., 
  date: ..., 
  conversions: ..., 
  facebook: ..., // optional
  linkedin: ..., // optional
  direct: ..., // optional
};

// Call the `insertCampaignConversion()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await insertCampaignConversion(insertCampaignConversionVars);
// Variables can be defined inline as well.
const { data } = await insertCampaignConversion({ campaignId: ..., date: ..., conversions: ..., facebook: ..., linkedin: ..., direct: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await insertCampaignConversion(dataConnect, insertCampaignConversionVars);

console.log(data.campaignConversion_insert);

// Or, you can use the `Promise` API.
insertCampaignConversion(insertCampaignConversionVars).then((response) => {
  const data = response.data;
  console.log(data.campaignConversion_insert);
});
```

### Using `InsertCampaignConversion`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, insertCampaignConversionRef, InsertCampaignConversionVariables } from '@zapalnik/crm-dataconnect';

// The `InsertCampaignConversion` mutation requires an argument of type `InsertCampaignConversionVariables`:
const insertCampaignConversionVars: InsertCampaignConversionVariables = {
  campaignId: ..., 
  date: ..., 
  conversions: ..., 
  facebook: ..., // optional
  linkedin: ..., // optional
  direct: ..., // optional
};

// Call the `insertCampaignConversionRef()` function to get a reference to the mutation.
const ref = insertCampaignConversionRef(insertCampaignConversionVars);
// Variables can be defined inline as well.
const ref = insertCampaignConversionRef({ campaignId: ..., date: ..., conversions: ..., facebook: ..., linkedin: ..., direct: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = insertCampaignConversionRef(dataConnect, insertCampaignConversionVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.campaignConversion_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.campaignConversion_insert);
});
```

## CreateEvent
You can execute the `CreateEvent` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
createEvent(vars: CreateEventVariables): MutationPromise<CreateEventData, CreateEventVariables>;

interface CreateEventRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateEventVariables): MutationRef<CreateEventData, CreateEventVariables>;
}
export const createEventRef: CreateEventRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createEvent(dc: DataConnect, vars: CreateEventVariables): MutationPromise<CreateEventData, CreateEventVariables>;

interface CreateEventRef {
  ...
  (dc: DataConnect, vars: CreateEventVariables): MutationRef<CreateEventData, CreateEventVariables>;
}
export const createEventRef: CreateEventRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createEventRef:
```typescript
const name = createEventRef.operationName;
console.log(name);
```

### Variables
The `CreateEvent` mutation requires an argument of type `CreateEventVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateEventVariables {
  eventType: string;
  testRunId?: string | null;
  payload: unknown;
  leadId?: UUIDString | null;
  evolutionLogId?: UUIDString | null;
}
```
### Return Type
Recall that executing the `CreateEvent` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateEventData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateEventData {
  event_insert: Event_Key;
}
```
### Using `CreateEvent`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createEvent, CreateEventVariables } from '@zapalnik/crm-dataconnect';

// The `CreateEvent` mutation requires an argument of type `CreateEventVariables`:
const createEventVars: CreateEventVariables = {
  eventType: ..., 
  testRunId: ..., // optional
  payload: ..., 
  leadId: ..., // optional
  evolutionLogId: ..., // optional
};

// Call the `createEvent()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createEvent(createEventVars);
// Variables can be defined inline as well.
const { data } = await createEvent({ eventType: ..., testRunId: ..., payload: ..., leadId: ..., evolutionLogId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createEvent(dataConnect, createEventVars);

console.log(data.event_insert);

// Or, you can use the `Promise` API.
createEvent(createEventVars).then((response) => {
  const data = response.data;
  console.log(data.event_insert);
});
```

### Using `CreateEvent`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createEventRef, CreateEventVariables } from '@zapalnik/crm-dataconnect';

// The `CreateEvent` mutation requires an argument of type `CreateEventVariables`:
const createEventVars: CreateEventVariables = {
  eventType: ..., 
  testRunId: ..., // optional
  payload: ..., 
  leadId: ..., // optional
  evolutionLogId: ..., // optional
};

// Call the `createEventRef()` function to get a reference to the mutation.
const ref = createEventRef(createEventVars);
// Variables can be defined inline as well.
const ref = createEventRef({ eventType: ..., testRunId: ..., payload: ..., leadId: ..., evolutionLogId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createEventRef(dataConnect, createEventVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.event_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.event_insert);
});
```

## CreateEvolutionLog
You can execute the `CreateEvolutionLog` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
createEvolutionLog(vars: CreateEvolutionLogVariables): MutationPromise<CreateEvolutionLogData, CreateEvolutionLogVariables>;

interface CreateEvolutionLogRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateEvolutionLogVariables): MutationRef<CreateEvolutionLogData, CreateEvolutionLogVariables>;
}
export const createEvolutionLogRef: CreateEvolutionLogRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createEvolutionLog(dc: DataConnect, vars: CreateEvolutionLogVariables): MutationPromise<CreateEvolutionLogData, CreateEvolutionLogVariables>;

interface CreateEvolutionLogRef {
  ...
  (dc: DataConnect, vars: CreateEvolutionLogVariables): MutationRef<CreateEvolutionLogData, CreateEvolutionLogVariables>;
}
export const createEvolutionLogRef: CreateEvolutionLogRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createEvolutionLogRef:
```typescript
const name = createEvolutionLogRef.operationName;
console.log(name);
```

### Variables
The `CreateEvolutionLog` mutation requires an argument of type `CreateEvolutionLogVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
```
### Return Type
Recall that executing the `CreateEvolutionLog` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateEvolutionLogData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateEvolutionLogData {
  evolutionLog_insert: EvolutionLog_Key;
}
```
### Using `CreateEvolutionLog`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createEvolutionLog, CreateEvolutionLogVariables } from '@zapalnik/crm-dataconnect';

// The `CreateEvolutionLog` mutation requires an argument of type `CreateEvolutionLogVariables`:
const createEvolutionLogVars: CreateEvolutionLogVariables = {
  agentId: ..., // optional
  filePath: ..., 
  codeBefore: ..., 
  errorLog: ..., 
  success: ..., 
  logs: ..., 
  critic: ..., // optional
  patch: ..., // optional
  report: ..., // optional
  deployment: ..., // optional
  score: ..., // optional
};

// Call the `createEvolutionLog()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createEvolutionLog(createEvolutionLogVars);
// Variables can be defined inline as well.
const { data } = await createEvolutionLog({ agentId: ..., filePath: ..., codeBefore: ..., errorLog: ..., success: ..., logs: ..., critic: ..., patch: ..., report: ..., deployment: ..., score: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createEvolutionLog(dataConnect, createEvolutionLogVars);

console.log(data.evolutionLog_insert);

// Or, you can use the `Promise` API.
createEvolutionLog(createEvolutionLogVars).then((response) => {
  const data = response.data;
  console.log(data.evolutionLog_insert);
});
```

### Using `CreateEvolutionLog`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createEvolutionLogRef, CreateEvolutionLogVariables } from '@zapalnik/crm-dataconnect';

// The `CreateEvolutionLog` mutation requires an argument of type `CreateEvolutionLogVariables`:
const createEvolutionLogVars: CreateEvolutionLogVariables = {
  agentId: ..., // optional
  filePath: ..., 
  codeBefore: ..., 
  errorLog: ..., 
  success: ..., 
  logs: ..., 
  critic: ..., // optional
  patch: ..., // optional
  report: ..., // optional
  deployment: ..., // optional
  score: ..., // optional
};

// Call the `createEvolutionLogRef()` function to get a reference to the mutation.
const ref = createEvolutionLogRef(createEvolutionLogVars);
// Variables can be defined inline as well.
const ref = createEvolutionLogRef({ agentId: ..., filePath: ..., codeBefore: ..., errorLog: ..., success: ..., logs: ..., critic: ..., patch: ..., report: ..., deployment: ..., score: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createEvolutionLogRef(dataConnect, createEvolutionLogVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.evolutionLog_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.evolutionLog_insert);
});
```

## UpsertLeadAndLog
You can execute the `UpsertLeadAndLog` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
upsertLeadAndLog(vars: UpsertLeadAndLogVariables): MutationPromise<UpsertLeadAndLogData, UpsertLeadAndLogVariables>;

interface UpsertLeadAndLogRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertLeadAndLogVariables): MutationRef<UpsertLeadAndLogData, UpsertLeadAndLogVariables>;
}
export const upsertLeadAndLogRef: UpsertLeadAndLogRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
upsertLeadAndLog(dc: DataConnect, vars: UpsertLeadAndLogVariables): MutationPromise<UpsertLeadAndLogData, UpsertLeadAndLogVariables>;

interface UpsertLeadAndLogRef {
  ...
  (dc: DataConnect, vars: UpsertLeadAndLogVariables): MutationRef<UpsertLeadAndLogData, UpsertLeadAndLogVariables>;
}
export const upsertLeadAndLogRef: UpsertLeadAndLogRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the upsertLeadAndLogRef:
```typescript
const name = upsertLeadAndLogRef.operationName;
console.log(name);
```

### Variables
The `UpsertLeadAndLog` mutation requires an argument of type `UpsertLeadAndLogVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
```
### Return Type
Recall that executing the `UpsertLeadAndLog` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpsertLeadAndLogData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpsertLeadAndLogData {
  lead_upsert: Lead_Key;
}
```
### Using `UpsertLeadAndLog`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, upsertLeadAndLog, UpsertLeadAndLogVariables } from '@zapalnik/crm-dataconnect';

// The `UpsertLeadAndLog` mutation requires an argument of type `UpsertLeadAndLogVariables`:
const upsertLeadAndLogVars: UpsertLeadAndLogVariables = {
  id: ..., 
  email: ..., 
  name: ..., 
  companyName: ..., 
  status: ..., 
  score: ..., 
  isHighTicket: ..., 
  aiEnrichment: ..., 
  pitchCard: ..., 
};

// Call the `upsertLeadAndLog()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await upsertLeadAndLog(upsertLeadAndLogVars);
// Variables can be defined inline as well.
const { data } = await upsertLeadAndLog({ id: ..., email: ..., name: ..., companyName: ..., status: ..., score: ..., isHighTicket: ..., aiEnrichment: ..., pitchCard: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await upsertLeadAndLog(dataConnect, upsertLeadAndLogVars);

console.log(data.lead_upsert);

// Or, you can use the `Promise` API.
upsertLeadAndLog(upsertLeadAndLogVars).then((response) => {
  const data = response.data;
  console.log(data.lead_upsert);
});
```

### Using `UpsertLeadAndLog`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, upsertLeadAndLogRef, UpsertLeadAndLogVariables } from '@zapalnik/crm-dataconnect';

// The `UpsertLeadAndLog` mutation requires an argument of type `UpsertLeadAndLogVariables`:
const upsertLeadAndLogVars: UpsertLeadAndLogVariables = {
  id: ..., 
  email: ..., 
  name: ..., 
  companyName: ..., 
  status: ..., 
  score: ..., 
  isHighTicket: ..., 
  aiEnrichment: ..., 
  pitchCard: ..., 
};

// Call the `upsertLeadAndLogRef()` function to get a reference to the mutation.
const ref = upsertLeadAndLogRef(upsertLeadAndLogVars);
// Variables can be defined inline as well.
const ref = upsertLeadAndLogRef({ id: ..., email: ..., name: ..., companyName: ..., status: ..., score: ..., isHighTicket: ..., aiEnrichment: ..., pitchCard: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = upsertLeadAndLogRef(dataConnect, upsertLeadAndLogVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.lead_upsert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.lead_upsert);
});
```

