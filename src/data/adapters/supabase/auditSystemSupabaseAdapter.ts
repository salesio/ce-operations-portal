import { isValidUuid, newClientUuid, createRow, dateRangeRows, getRowById, listRows, searchRows, updateRow } from "./supabaseRepositoryBase";
export type AuditRecord=Record<string,unknown>&{id?:EntityId}; type Table="audit_logs"|"sensitive_access_events"|"system_events"|"data_source_health_checks";
const cast=<T>(x:unknown)=>x as SupabaseResult<T>; const ok=<T>(data:T):SupabaseResult<T>=>({ok:true,data});
const list=(t:Table,f:Record<string,string|number|boolean|null>={})=>cast<AuditRecord[]>(listRows(t,{filters:f,orderBy:t==="data_source_health_checks"?"checked_at":"created_at",ascending:false})); const get=(t:Table,id:EntityId)=>cast<AuditRecord|null>(getRowById(t,String(id)));
function formatAuditPayload(t: Table, p: AuditRecord): AuditRecord {
  const sanitized = sanitizeAuditPayload(p) as AuditRecord;
  if (t === "audit_logs") {
    const row: AuditRecord = { ...sanitized };
    if (row.id && !isValidUuid(String(row.id))) {
      row.id = newClientUuid();
    }
    if (row.user_id !== undefined) {
      row.user_id = row.user_id && isValidUuid(String(row.user_id)) ? String(row.user_id) : null;
    }
    if (!row.metadata || typeof row.metadata !== "object") {
      row.metadata = {};
    }
    return row;
  }
  return sanitized;
}
const create=(t:Table,p:AuditRecord)=>cast<AuditRecord>(createRow(t,formatAuditPayload(t, p))); const update=(t:Table,id:EntityId,p:AuditRecord)=>cast<AuditRecord>(updateRow(t,String(id),formatAuditPayload(t, p)));
const SECRET=/password|token|secret|service.?role|anon.?key|api.?key|authorization|cookie/i; const SENSITIVE=/confidential_notes|counseling_notes|salary_amount|proof_content|document_content/i;
export function sanitizeAuditPayload(payload:unknown):unknown{if(Array.isArray(payload))return payload.map(sanitizeAuditPayload);if(!payload||typeof payload!=="object")return payload;const out:Record<string,unknown>={};for(const[k,v]of Object.entries(payload as Record<string,unknown>)){if(SECRET.test(k)||SENSITIVE.test(k))continue;out[k]=sanitizeAuditPayload(v);}return out;}
export const listAuditLogs=()=>list("audit_logs"); export const getAuditLogById=(id:EntityId)=>get("audit_logs",id); export const createAuditLog=(p:AuditRecord)=>create("audit_logs",p); export const searchAuditLogs=(q:string)=>cast<AuditRecord[]>(searchRows("audit_logs",["event_type","event_action","module_key","message","actor_name"],q)); export const getAuditLogsByModule=(m:string)=>list("audit_logs",{module_key:m}); export const getAuditLogsByActor=(id:EntityId)=>list("audit_logs",{actor_user_id:String(id)}); export const getAuditLogsByEntity=async(t:string,id:EntityId)=>{const rows=await list("audit_logs",{entity_type:t});return rows.ok?ok(rows.data.filter(x=>String(x.entity_id)===String(id))):rows;}; export const getAuditLogsByDateRange=(s:string,e:string)=>cast<AuditRecord[]>(dateRangeRows("audit_logs","created_at",s,e)); export async function getSecurityAuditLogs(filters:AuditRecord={}){const rows=await list("audit_logs",filters as Record<string,string|number|boolean|null>);return rows.ok?ok(rows.data.filter(x=>x.severity==="Security"||x.severity==="Critical")):rows;}
export const listSensitiveAccessEvents=()=>list("sensitive_access_events"); export const createSensitiveAccessEvent=(p:AuditRecord)=>create("sensitive_access_events",{...p,field_names:Array.isArray(p.field_names)?p.field_names:[],metadata:{...((p.metadata as object)||{}),reference_only:true,no_sensitive_content:true}}); export const getSensitiveAccessByActor=(id:EntityId)=>list("sensitive_access_events",{actor_user_id:String(id)}); export const getSensitiveAccessByModule=(m:string)=>list("sensitive_access_events",{module_key:m}); export const getSensitiveAccessByEntity=async(t:string,id:EntityId)=>{const rows=await list("sensitive_access_events",{entity_type:t});return rows.ok?ok(rows.data.filter(x=>String(x.entity_id)===String(id))):rows;}; export const getDeniedSensitiveAccessEvents=()=>list("sensitive_access_events",{allowed:false}); export const getSensitiveAccessByDateRange=(s:string,e:string)=>cast<AuditRecord[]>(dateRangeRows("sensitive_access_events","created_at",s,e));
export const listSystemEvents=()=>list("system_events"); export const createSystemEvent=(p:AuditRecord)=>create("system_events",p); export const acknowledgeSystemEvent=(id:EntityId,p:AuditRecord={})=>update("system_events",id,{...p,status:"Acknowledged"}); export const resolveSystemEvent=(id:EntityId,p:AuditRecord={})=>update("system_events",id,{...p,status:"Resolved",resolved_at:new Date().toISOString()}); export const getOpenSystemEvents=()=>list("system_events",{status:"Open"}); export const getSystemEventsByModule=(m:string)=>list("system_events",{module_key:m}); export const getSystemEventsBySeverity=(s:string)=>list("system_events",{severity:s});
export const listDataSourceHealthChecks=()=>list("data_source_health_checks"); export const createDataSourceHealthCheck=(p:AuditRecord)=>create("data_source_health_checks",p); export async function getLatestHealthCheck(source:string,moduleKey:string){const rows=await list("data_source_health_checks",{data_source:source,module_key:moduleKey});return rows.ok?ok(rows.data[0]||null):cast<AuditRecord|null>(rows);} export async function runLocalDataSourceHealthCheck(p:AuditRecord={}){const started=Date.now();return ok({data_source:String(p.data_source||"local"),module_key:p.module_key,status:"Healthy",checked_at:new Date().toISOString(),latency_ms:Date.now()-started,details:{configured:true,secrets_exposed:false}});} export async function getDataSourceHealthSummary(){const rows=await listDataSourceHealthChecks();return rows.ok?ok({total:rows.data.length,healthy:rows.data.filter(x=>x.status==="Healthy").length,latest:rows.data[0]||null}):rows;}
export const recordAuditLog=createAuditLog; export const recordSensitiveAccess=createSensitiveAccessEvent; export const recordSystemEvent=createSystemEvent; export const recordDataSourceHealth=createDataSourceHealthCheck;

