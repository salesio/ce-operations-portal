import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd(); const checks = [];
const read = (rel) => readFileSync(join(root, rel), "utf8");
const exists = (rel) => checks.push([`exists ${rel}`, existsSync(join(root, rel))]);
const has = (rel, needle, label = String(needle)) => checks.push([`${rel} has ${label}`, needle instanceof RegExp ? needle.test(read(rel)) : read(rel).includes(needle)]);
const notHas = (rel, needle, label = String(needle)) => checks.push([`${rel} excludes ${label}`, !(needle instanceof RegExp ? needle.test(read(rel)) : read(rel).includes(needle))]);

const programs = "src/data/adapters/supabase/programsSupabaseAdapter.ts";
const media = "src/data/adapters/supabase/mediaSupabaseAdapter.ts";
const programsApi = "src/data/adapters/api/programsApiAdapter.ts";
const mediaApi = "src/data/adapters/api/mediaApiAdapter.ts";
const migration = "supabase/migrations/0009_programs_media_pilot.sql";
const seed = "supabase/seeds/programs_media_seed.sql";
for (const file of [programs, media, programsApi, mediaApi, migration, seed, "docs/backend/PROGRAMS_MEDIA_SUPABASE_PILOT.md"]) exists(file);

const programTables = ["programs","program_sessions","program_teams","program_participants","program_registrations","program_resources","program_budgets","program_checklists","program_reports"];
const mediaTables = ["media_roles","media_team_members","media_services","media_schedules","media_channels","media_performance_records","media_awards"];
for (const table of [...programTables, ...mediaTables]) { has(migration, table, table); has("database/schema.sql", table, table); }

for (const fn of ["listPrograms","createProgram","searchPrograms","getProgramsRequiringMedia","createProgramSession","assignStaffToProgramTeam","checkInProgramParticipant","confirmProgramRegistration","reserveProgramResource","approveProgramBudget","linkBudgetToRequisition","linkBudgetToFinanceDisbursement","completeProgramChecklist","approveProgramReport","getProgramExecutionReport"]) { has(programs, fn, fn); has(programsApi, fn, fn); }
for (const fn of ["listMediaRoles","listMediaTeamMembers","getMediaTeamByStaff","createMediaService","getMediaServicesByProgram","confirmMediaSchedule","createMediaChannel","deactivateMediaChannel","createMediaPerformanceRecord","recalculateMediaOverallScore","createMediaAward","getMediaOverviewStats"]) { has(media, fn, fn); has(mediaApi, fn, fn); }

for (const needle of ["programsSupabaseAdapter","mediaSupabaseAdapter","map.programs","map.media_technicians","map.media_services","map.media_performance"]) has("src/data/adapters/supabaseProvider.ts", needle, needle);
has("src/data/repositories/programsEventsRepository.ts", 'getDataSource() === "supabase"');
has("src/data/repositories/mediaRepository.ts", 'getDataSource() === "supabase"');
has(programs, "automatic_finance_record: false"); has(programs, "expense_created: false"); has(programs, "inventory_movement_created: false");
has(media, "assertPublicChannelPayload"); has(media, "heavy_livestream_managed: false"); has(media, "finance_record_created: false"); has(media, "inventory_movement_created: false");
has("src/index.ts", "programEvents: programsEvents"); has("src/index.ts", "mediaTeam:"); has("src/index.ts", "mediaServices:");
has("js/dashboard.js", "programs:"); has("js/dashboard.js", "media:");
for (const flag of ["VITE_DATA_SOURCE","VITE_ENABLE_SUPABASE","VITE_SUPABASE_URL","VITE_SUPABASE_ANON_KEY"]) has(".env.example", flag, flag);
notHas(migration, /drop\s+table/i, "DROP TABLE");
notHas(programs, "createFinanceRecord"); notHas(media, "createFinanceRecord");

const channelSql = read(migration).match(/CREATE TABLE IF NOT EXISTS public\.media_channels[\s\S]*?\n\);/i)?.[0] || "";
for (const forbiddenColumn of ["stream_key","password","access_token","refresh_token","client_secret"]) checks.push([`media_channels excludes ${forbiddenColumn} column`, !new RegExp(`\\b${forbiddenColumn}\\s+text`, "i").test(channelSql)]);
for (const frontend of [programs, media, programsApi, mediaApi, "src/data/adapters/supabaseProvider.ts", "js/dashboard.js"]) notHas(frontend, "SUPABASE_SERVICE_ROLE_KEY", `service role reference in ${frontend}`);

let failed = 0; for (const [label, passed] of checks) { if (passed) console.log(`PASS ${label}`); else { failed += 1; console.error(`FAIL ${label}`); } }
if (failed) { console.error(`\nPrograms/Media Supabase smoke failed: ${failed} check(s).`); process.exit(1); }
console.log(`\nPrograms/Media Supabase smoke passed: ${checks.length} checks.`);

