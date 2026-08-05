import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const root=join(dirname(fileURLToPath(import.meta.url)),".."); let passed=0,failed=0;
const read=(p)=>readFileSync(join(root,p),"utf8");
const check=(label,value)=>{if(value){passed++;console.log(`PASS ${label}`);}else{failed++;console.error(`FAIL ${label}`);}};
const has=(p,s)=>check(`${p} has ${s}`,read(p).includes(s)); const absent=(p,re)=>check(`${p} excludes ${re}`,!re.test(read(p)));
const files=[
"src/data/adapters/supabase/reportsSupabaseAdapter.ts","src/data/adapters/supabase/notificationsSupabaseAdapter.ts","src/data/adapters/supabase/auditSystemSupabaseAdapter.ts",
"src/data/adapters/api/reportsApiAdapter.ts","src/data/adapters/api/notificationsApiAdapter.ts","src/data/adapters/api/auditSystemApiAdapter.ts",
"supabase/migrations/0012_reports_notifications_audit_hardening.sql","supabase/seeds/reports_notifications_audit_seed.sql",
"docs/backend/REPORTS_NOTIFICATIONS_AUDIT_SUPABASE_PILOT.md","docs/backend/PRODUCTION_READINESS_PLAN.md"];
for(const f of files)check(`exists ${f}`,existsSync(join(root,f)));
for(const t of ["report_definitions","saved_report_views","report_snapshots","report_export_jobs","notifications","notification_templates","notification_preferences","audit_logs","sensitive_access_events","system_events","data_source_health_checks"]){has("database/schema.sql",t);has("supabase/migrations/0012_reports_notifications_audit_hardening.sql",t);}
for(const m of ["listReportDefinitions","getReportDefinitionByKey","createSavedReportView","setDefaultReportView","createReportSnapshot","createReportExportJob","markExportJobCompleted","buildReadOnlyReportData","sanitizeReportData","canExportSensitiveReport"]){has("src/data/adapters/supabase/reportsSupabaseAdapter.ts",m);}
for(const m of ["listNotifications","getUnreadNotificationsByUser","markNotificationRead","markNotificationDismissed","createRoleNotification","createNotificationFromTemplate","upsertNotificationPreference","getNotificationCenterSummary"]){has("src/data/adapters/supabase/notificationsSupabaseAdapter.ts",m);}
for(const m of ["sanitizeAuditPayload","recordAuditLog","recordSensitiveAccess","recordSystemEvent","recordDataSourceHealth","getDeniedSensitiveAccessEvents","runLocalDataSourceHealthCheck"]){has("src/data/adapters/supabase/auditSystemSupabaseAdapter.ts",m);}
has("src/data/adapters/supabase/reportsSupabaseAdapter.ts","read_only: true"); has("src/data/adapters/supabase/reportsSupabaseAdapter.ts","confidential_notes"); has("src/data/adapters/supabase/reportsSupabaseAdapter.ts","can_view_salary"); has("src/data/adapters/supabase/reportsSupabaseAdapter.ts","can_view_financial_proof");
has("src/data/adapters/supabase/notificationsSupabaseAdapter.ts","delivery_channel: \"in_app\""); has("src/data/adapters/supabase/notificationsSupabaseAdapter.ts","external_delivery: false");
has("src/data/adapters/supabase/auditSystemSupabaseAdapter.ts","no_sensitive_content:true"); has("src/data/adapters/supabaseProvider.ts","map.report_definitions"); has("src/data/adapters/supabaseProvider.ts","map.notifications"); has("src/data/adapters/supabaseProvider.ts","map.audit_logs");
for(const s of ["reports: <code>Supabase-ready","notifications: <code>Supabase-ready","audit logs: <code>Supabase-ready","Production Readiness","service role exposed: <code>false","direct PostgreSQL from browser: <code>false"]){has("js/dashboard.js",s);}
has(".env.example","VITE_DATA_SOURCE=supabase"); has(".env.example","VITE_ENABLE_SUPABASE=true"); has(".env.example","VITE_SUPABASE_URL="); has(".env.example","VITE_SUPABASE_ANON_KEY=");
absent("supabase/seeds/reports_notifications_audit_seed.sql",/\b(?:credential_value|private_key_value|bearer_value)\b/i);
for(const p of ["src","js"]){const targets=p==="src"?["src/index.ts","src/data/adapters/supabase/reportsSupabaseAdapter.ts","src/data/adapters/supabase/notificationsSupabaseAdapter.ts","src/data/adapters/supabase/auditSystemSupabaseAdapter.ts"]:["js/dashboard.js"];for(const f of targets)absent(f,/VITE_SUPABASE_SERVICE_ROLE|SUPABASE_SERVICE_ROLE_KEY\s*=/);}
console.log(`Reports/Notifications/Audit Supabase smoke: ${passed} passed, ${failed} failed.`); process.exit(failed?1:0);
