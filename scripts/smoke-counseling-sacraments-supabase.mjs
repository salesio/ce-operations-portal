import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd(); const checks = [];
const read = (rel) => readFileSync(join(root, rel), "utf8");
const exists = (rel) => checks.push([`exists ${rel}`, existsSync(join(root, rel))]);
const has = (rel, needle, label = String(needle)) => checks.push([`${rel} has ${label}`, needle instanceof RegExp ? needle.test(read(rel)) : read(rel).includes(needle)]);
const notHas = (rel, needle, label = String(needle)) => checks.push([`${rel} excludes ${label}`, !(needle instanceof RegExp ? needle.test(read(rel)) : read(rel).includes(needle))]);

const counseling = "src/data/adapters/supabase/counselingSupabaseAdapter.ts";
const sacraments = "src/data/adapters/supabase/sacramentsSupabaseAdapter.ts";
const counselingApi = "src/data/adapters/api/counselingApiAdapter.ts";
const sacramentsApi = "src/data/adapters/api/sacramentsApiAdapter.ts";
const migration = "supabase/migrations/0010_counseling_sacraments_pilot.sql";
const seed = "supabase/seeds/counseling_sacraments_seed.sql";
for (const file of [counseling, sacraments, counselingApi, sacramentsApi, migration, seed, "docs/backend/COUNSELING_SACRAMENTS_SUPABASE_PILOT.md"]) exists(file);

const counselingTables = ["counseling_requests","counseling_cases","counseling_appointments","counselors","counseling_feedback","counseling_referrals"];
const sacramentTables = ["baptisms","marriages","baby_dedications","sacrament_certificates","sacrament_documents","sacrament_appointments"];
for (const table of [...counselingTables, ...sacramentTables]) { has(migration, table, table); has("database/schema.sql", table, table); }

for (const fn of ["listCounselingRequests","assignCounselingRequest","convertRequestToCase","listCounselingCases","closeCounselingCase","escalateCounselingCase","listCounselingAppointments","completeCounselingAppointment","listCounselors","getCounselorsBySpecialization","createCounselingFeedback","getFeedbackNeedingFollowUp","createCounselingReferral","acceptCounselingReferral","getCounselingOverviewStats","getCounselingConfidentialReport","getCounselorWorkloadReport"]) { has(counseling, fn, fn); has(counselingApi, fn, fn); }
for (const fn of ["listBaptisms","scheduleBaptism","completeBaptism","listMarriages","linkMarriageToCounselingCase","listBabyDedications","completeBabyDedication","createSacramentCertificate","approveSacramentCertificate","issueSacramentCertificate","createSacramentDocument","verifySacramentDocument","listSacramentAppointments","getUpcomingSacramentAppointments","getSacramentsOverviewStats","getCertificatesReport"]) { has(sacraments, fn, fn); has(sacramentsApi, fn, fn); }

for (const needle of ["counselingSupabaseAdapter","sacramentsSupabaseAdapter","map.counseling_requests","map.counseling_cases","map.baptisms","map.sacrament_documents"]) has("src/data/adapters/supabaseProvider.ts", needle, needle);
has("src/data/repositories/counselingRepository.ts", 'getDataSource() === "supabase"'); has("src/data/repositories/sacramentsRepository.ts", 'getDataSource() === "supabase"');
has(counseling, "maskConfidentialCounselingData"); has(counseling, "canViewConfidentialCounseling"); has(counseling, "confidential_data_masked"); has(counseling, "explicit_follow_up_required: true");
for (const field of ["confidential_notes","private_assessment","pastoral_guidance","confidential_session_notes","confidential_feedback"]) { has(migration, field, field); has(counseling, field, field); }
has(sacraments, "is_sensitive = true"); has(sacraments, "PRIVATE_BUCKET"); has(sacraments, "PUBLIC_BUCKET_FORBIDDEN"); has(sacraments, "finance_record_created: false"); has(sacraments, "explicit_issue: true");
notHas(sacraments, "createFinanceRecord"); notHas(counseling, "createFollowUp("); notHas(migration, /drop\s+table/i, "DROP TABLE");
has("js/dashboard.js", "counseling:"); has("js/dashboard.js", "sacraments:"); has("js/dashboard.js", "sensitive documents");
for (const flag of ["VITE_DATA_SOURCE","VITE_ENABLE_SUPABASE","VITE_SUPABASE_URL","VITE_SUPABASE_ANON_KEY","VITE_ENABLE_STORAGE"]) has(".env.example", flag, flag);
for (const frontend of [counseling, sacraments, counselingApi, sacramentsApi, "src/data/adapters/supabaseProvider.ts", "js/dashboard.js"]) notHas(frontend, "SUPABASE_SERVICE_ROLE_KEY", `service role reference in ${frontend}`);

const normalListSection = read(counseling).match(/async function list\([\s\S]*?async function get\(/)?.[0] || "";
checks.push(["normal Counseling lists mask confidential fields", normalListSection.includes("maskConfidentialCounselingData")]);
const overview = read(counseling).match(/getCounselingOverviewStats[\s\S]*?getCounselingConfidentialReport/)?.[0] || "";
checks.push(["aggregate overview excludes confidential fields", !/confidential_notes|private_assessment|pastoral_guidance/.test(overview)]);

let failed = 0; for (const [label, passed] of checks) { if (passed) console.log(`PASS ${label}`); else { failed += 1; console.error(`FAIL ${label}`); } }
if (failed) { console.error(`\nCounseling/Sacraments Supabase smoke failed: ${failed} check(s).`); process.exit(1); }
console.log(`\nCounseling/Sacraments Supabase smoke passed: ${checks.length} checks.`);
