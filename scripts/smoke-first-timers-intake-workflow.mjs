/** Pastoral Care First Timers intake workflow: static safety and wiring check. */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let failed = 0;
function check(condition, label) { console.log(`${condition ? "PASS" : "FAIL"} ${label}`); if (!condition) failed += 1; }
function text(path) { return readFileSync(join(root, path), "utf8"); }

const migration = "supabase/migrations/0013_first_timers_intake_workflow.sql";
check(existsSync(join(root, migration)), "0013 migration exists");
const sql = text(migration);
check(/first_timer_intake_batches/i.test(sql) && /workflow_status/i.test(sql), "migration adds intake batch and workflow");
check(!/drop\s+table/i.test(sql), "migration has no destructive table drop");
check(/never creates members/i.test(sql), "migration documents no automatic operational entities");

const pastoralAccessMigration = "supabase/migrations/0014_pastoral_care_access.sql";
check(existsSync(join(root, pastoralAccessMigration)), "0014 pastoral access migration exists");
const pastoralSql = text(pastoralAccessMigration);
check(/pastoral_rector/.test(pastoralSql) && /follow_up_coordinator/.test(pastoralSql), "pastoral roles are server-side");
check(/first_timers_pastoral_read/.test(pastoralSql) && /follow_ups_pastoral_read/.test(pastoralSql), "pastoral read policies are defined");
check(!/service_role/i.test(pastoralSql), "pastoral migration does not use a service role");

const dashboard = text("js/dashboard.js");
check(/renderFirstTimerIntakeForm/.test(dashboard), "dedicated intake form exists");
check(/Nome completo \*/.test(dashboard) && /Quem convidou\?/.test(dashboard), "physical intake fields present");
check(!/cell_group_id.*cellRegistrySelect/.test(dashboard.slice(dashboard.indexOf("firstTimer: ["), dashboard.indexOf("member: ["))), "legacy first timer schema excludes cell selectors");
check(/Submeter ao Reitor/.test(dashboard) && /Encaminhar Follow-Up/.test(dashboard), "explicit workflow actions present");
check(/Importar Excel/.test(dashboard) && /Baixar Modelo Excel/.test(dashboard), "Excel-compatible import/template controls present");
check(/duplicate/.test(dashboard) && /workflow_status/.test(dashboard), "duplicate guard and workflow status present");
check(/renderFirstTimerRectorPanel/.test(dashboard) && /Painel do Reitor/.test(dashboard), "Rector review panel is available");
if (false) { // Historical label check below is intentionally disabled after the UI rename.
check(/receiveForRectorReview/.test(dashboard) && /Receber para aprovação/.test(dashboard), "Rector receives intake with a dedicated safe action");
check(/Reitor Pastoral/.test(dashboard) && /id: "u-26"/.test(dashboard), "Rector demo account has a unique identifier");
}
check(/receiveForRectorReview/.test(dashboard) && /Lançar para Aprovação/.test(dashboard), "Rector launches intake with a dedicated safe action");
check(/data-first-timer-bulk/.test(dashboard) && /processFirstTimerBulkReview/.test(dashboard), "Rector bulk review actions are wired");
check(/roleWorkspaceRoutes/.test(dashboard) && /Follow-Up Coordinator/.test(dashboard), "Pastoral role workspaces restrict visible routes");
check(/hasNationalPastoralScope/.test(dashboard), "pastoral workspace keeps national scope despite incomplete client profile mapping");
check(/Reitor Pastoral/.test(dashboard) && /id: "u-26"/.test(dashboard), "Rector demo account has a unique identifier");
check(/full_name: suppliedFullName/.test(dashboard) && /record\.full_name/.test(dashboard), "full name is retained for list rendering");
check(/firstTimersPageState\.filter = \{\}/.test(dashboard), "new intake clears stale table filters");

const adapter = text("src/data/adapters/supabase/firstTimersSupabaseAdapter.ts");
check(/first_timer_number/.test(adapter) && /invited_by_member_id/.test(adapter), "Supabase adapter maps intake fields");
check(/emptyToNull/.test(adapter) && /visit_date: emptyToNull/.test(adapter), "optional dates are sent as null, never empty strings");
check(!/SERVICE_ROLE_KEY\s*=/.test(adapter), "adapter has no service role credential");

console.log(`\nFirst Timers intake workflow: ${failed ? "failed" : "passed"}`);
process.exit(failed ? 1 : 0);
