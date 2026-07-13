# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.





## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { createLeadPublic, upsertLead, updateLead, deleteLead, upsertCampaign, insertCampaignConversion, createEvent, createEvolutionLog, upsertLeadAndLog, listLeads } from '@zapalnik/crm-dataconnect';


// Operation CreateLeadPublic:  For variables, look at type CreateLeadPublicVars in ../index.d.ts
const { data } = await CreateLeadPublic(dataConnect, createLeadPublicVars);

// Operation UpsertLead:  For variables, look at type UpsertLeadVars in ../index.d.ts
const { data } = await UpsertLead(dataConnect, upsertLeadVars);

// Operation UpdateLead:  For variables, look at type UpdateLeadVars in ../index.d.ts
const { data } = await UpdateLead(dataConnect, updateLeadVars);

// Operation DeleteLead:  For variables, look at type DeleteLeadVars in ../index.d.ts
const { data } = await DeleteLead(dataConnect, deleteLeadVars);

// Operation UpsertCampaign:  For variables, look at type UpsertCampaignVars in ../index.d.ts
const { data } = await UpsertCampaign(dataConnect, upsertCampaignVars);

// Operation InsertCampaignConversion:  For variables, look at type InsertCampaignConversionVars in ../index.d.ts
const { data } = await InsertCampaignConversion(dataConnect, insertCampaignConversionVars);

// Operation CreateEvent:  For variables, look at type CreateEventVars in ../index.d.ts
const { data } = await CreateEvent(dataConnect, createEventVars);

// Operation CreateEvolutionLog:  For variables, look at type CreateEvolutionLogVars in ../index.d.ts
const { data } = await CreateEvolutionLog(dataConnect, createEvolutionLogVars);

// Operation UpsertLeadAndLog:  For variables, look at type UpsertLeadAndLogVars in ../index.d.ts
const { data } = await UpsertLeadAndLog(dataConnect, upsertLeadAndLogVars);

// Operation ListLeads:  For variables, look at type ListLeadsVars in ../index.d.ts
const { data } = await ListLeads(dataConnect, listLeadsVars);


```