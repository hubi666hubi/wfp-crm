const { queryRef, executeQuery, validateArgsWithOptions, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const LeadPriority = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
}
exports.LeadPriority = LeadPriority;

const connectorConfig = {
  connector: 'crm',
  service: 'zapalnik-crm',
  location: 'us-central1'
};
exports.connectorConfig = connectorConfig;

const createLeadPublicRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateLeadPublic', inputVars);
}
createLeadPublicRef.operationName = 'CreateLeadPublic';
exports.createLeadPublicRef = createLeadPublicRef;

exports.createLeadPublic = function createLeadPublic(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(createLeadPublicRef(dcInstance, inputVars));
}
;

const upsertLeadRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertLead', inputVars);
}
upsertLeadRef.operationName = 'UpsertLead';
exports.upsertLeadRef = upsertLeadRef;

exports.upsertLead = function upsertLead(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(upsertLeadRef(dcInstance, inputVars));
}
;

const updateLeadRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateLead', inputVars);
}
updateLeadRef.operationName = 'UpdateLead';
exports.updateLeadRef = updateLeadRef;

exports.updateLead = function updateLead(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateLeadRef(dcInstance, inputVars));
}
;

const deleteLeadRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteLead', inputVars);
}
deleteLeadRef.operationName = 'DeleteLead';
exports.deleteLeadRef = deleteLeadRef;

exports.deleteLead = function deleteLead(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(deleteLeadRef(dcInstance, inputVars));
}
;

const upsertCampaignRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertCampaign', inputVars);
}
upsertCampaignRef.operationName = 'UpsertCampaign';
exports.upsertCampaignRef = upsertCampaignRef;

exports.upsertCampaign = function upsertCampaign(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(upsertCampaignRef(dcInstance, inputVars));
}
;

const insertCampaignConversionRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'InsertCampaignConversion', inputVars);
}
insertCampaignConversionRef.operationName = 'InsertCampaignConversion';
exports.insertCampaignConversionRef = insertCampaignConversionRef;

exports.insertCampaignConversion = function insertCampaignConversion(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(insertCampaignConversionRef(dcInstance, inputVars));
}
;

const createEventRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateEvent', inputVars);
}
createEventRef.operationName = 'CreateEvent';
exports.createEventRef = createEventRef;

exports.createEvent = function createEvent(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(createEventRef(dcInstance, inputVars));
}
;

const createEvolutionLogRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateEvolutionLog', inputVars);
}
createEvolutionLogRef.operationName = 'CreateEvolutionLog';
exports.createEvolutionLogRef = createEvolutionLogRef;

exports.createEvolutionLog = function createEvolutionLog(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(createEvolutionLogRef(dcInstance, inputVars));
}
;

const upsertLeadAndLogRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertLeadAndLog', inputVars);
}
upsertLeadAndLogRef.operationName = 'UpsertLeadAndLog';
exports.upsertLeadAndLogRef = upsertLeadAndLogRef;

exports.upsertLeadAndLog = function upsertLeadAndLog(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(upsertLeadAndLogRef(dcInstance, inputVars));
}
;

const listLeadsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListLeads', inputVars);
}
listLeadsRef.operationName = 'ListLeads';
exports.listLeadsRef = listLeadsRef;

exports.listLeads = function listLeads(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, false);
  return executeQuery(listLeadsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const getLeadRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetLead', inputVars);
}
getLeadRef.operationName = 'GetLead';
exports.getLeadRef = getLeadRef;

exports.getLead = function getLead(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getLeadRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listDeadLeadsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListDeadLeads', inputVars);
}
listDeadLeadsRef.operationName = 'ListDeadLeads';
exports.listDeadLeadsRef = listDeadLeadsRef;

exports.listDeadLeads = function listDeadLeads(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listDeadLeadsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listCampaignsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListCampaigns', inputVars);
}
listCampaignsRef.operationName = 'ListCampaigns';
exports.listCampaignsRef = listCampaignsRef;

exports.listCampaigns = function listCampaigns(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, false);
  return executeQuery(listCampaignsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const getCampaignDetailsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetCampaignDetails', inputVars);
}
getCampaignDetailsRef.operationName = 'GetCampaignDetails';
exports.getCampaignDetailsRef = getCampaignDetailsRef;

exports.getCampaignDetails = function getCampaignDetails(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getCampaignDetailsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listEventsByTypeRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListEventsByType', inputVars);
}
listEventsByTypeRef.operationName = 'ListEventsByType';
exports.listEventsByTypeRef = listEventsByTypeRef;

exports.listEventsByType = function listEventsByType(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listEventsByTypeRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listEvolutionLogsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListEvolutionLogs', inputVars);
}
listEvolutionLogsRef.operationName = 'ListEvolutionLogs';
exports.listEvolutionLogsRef = listEvolutionLogsRef;

exports.listEvolutionLogs = function listEvolutionLogs(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, false);
  return executeQuery(listEvolutionLogsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const getEvolutionLogRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetEvolutionLog', inputVars);
}
getEvolutionLogRef.operationName = 'GetEvolutionLog';
exports.getEvolutionLogRef = getEvolutionLogRef;

exports.getEvolutionLog = function getEvolutionLog(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getEvolutionLogRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;
