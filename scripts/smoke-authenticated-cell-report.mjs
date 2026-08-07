/** Security smoke: authenticated, assignment-scoped cell report submission. */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFileSync(join(root, file), "utf8");
let passed = 0;
let failed = 0;
const check = (name, condition) => {
  if (condition) { passed += 1; console.log(`PASS  ${name}`); }
  else { failed += 1; console.error(`FAIL  ${name}`); }
};

const dashboard = read("js/dashboard.js");
const env = read(".env.example");
const stagingEnv = read(".env.staging.example");
const access = read("js/access-control.js");
const users = read("src/data/seeds/usersSeed.ts");
const roles = read("src/data/seeds/rolesSeed.ts");
const permissions = read("src/data/seeds/permissionsSeed.ts");
const cells = read("src/data/seeds/cellsSeed.ts");
const leaders = read("src/data/seeds/cellLeadersSeed.ts");
const repository = read("src/data/repositories/cellMinistryRepository.ts");
const docs = read("docs/backend/AUTHENTICATED_CELL_REPORT_SUBMISSION.md");

check("public flag defaults false", /VITE_ENABLE_PUBLIC_CELL_REPORT=false/.test(env) && /VITE_ENABLE_PUBLIC_CELL_REPORT=false/.test(stagingEnv));
check("legacy public is demo/local only", /isLegacyPublicCellReportEnabled/.test(dashboard) && /\["mock", "local"\]/.test(dashboard) && /production/.test(dashboard));
check("button requests authenticated flow", /data-public-cell-report[\s\S]{0,180}requestAuthenticatedCellReport/.test(dashboard));
check("explicit authenticated session state", /let isUserAuthenticated = false/.test(dashboard));
check("allowed portal roles declared", ["Cell Leader", "Cell Assistant", "Cell Ministry Reviewer", "Cell Ministry Head", "Super Admin"].every((role) => dashboard.includes(`\"${role}\"`)));
check("permission codes declared", ["view_own", "create_own", "edit_own_until_validated", "view_church", "review", "validate", "reject", "export"].every((code) => permissions.includes(`cell_reports.${code}`)));
check("authorized cells helper", /function getAuthorizedCellsForUser\(userId\)/.test(dashboard) && /window\.getAuthorizedCellsForUser/.test(dashboard));
check("leader and assistant assignments", /primary_leader_user_id/.test(cells) && /assistant_leader_user_ids/.test(cells) && /role_type/.test(leaders));
check("demo users", ["cell.leader@ce-mozambique.org", "cell.assistant@ce-mozambique.org", "cell.reviewer@ce-mozambique.org"].every((email) => users.includes(email) && dashboard.includes(email)));
check("demo password is visible", /Password:[\s\S]{0,80}<strong>demo<\/strong>/.test(dashboard));
check("bad demo password stays rejected", /AUTH_DEMO_BAD_PASSWORD/.test(dashboard) && /Invalid demo credentials/.test(dashboard) && /\["AUTH_ERROR", "AUTH_TIMEOUT"\]/.test(dashboard));
check("legacy adapter also validates demo password", /if \(password\.trim\(\) !== "demo"\)/.test(dashboard) && /Incorrect demo password\. Use: demo/.test(dashboard));
check("roles seeded", ["role-cell-leader", "role-cell-assistant", "role-cell-reviewer"].every((id) => roles.includes(id)));
check("access templates seeded", ["Cell Leader", "Cell Assistant", "Cell Ministry Reviewer"].every((role) => access.includes(`\"${role}\"`)));
check("form limits cell choices", /authorizedCells/.test(dashboard) && /authorizedGroupIds/.test(dashboard));
check("single assignment locks identity", /singleCell \? "disabled"/.test(dashboard) && /type="hidden" name="cell_id"/.test(dashboard));
check("server-bound guard rechecks cell", /authorizedIds\.has\(selectedCellId\)/.test(dashboard));
check("exact unauthorized messages", dashboard.includes("Não tem autorização para submeter relatório desta célula.") && dashboard.includes("You are not authorized to submit a report for this cell."));
check("authenticated metadata", ["submitted_by_user_id", "submitted_by_name", "submitted_by_role", "submitted_by_cell_role", "authorized_cell_id", "auth_required", "submission_source"].every((field) => dashboard.includes(field) && repository.includes(field)));
check("portal source exact", /submission_source:\s*legacyPublic \? "legacy_public_demo" : "cell_leader_portal"/.test(dashboard));
check("review permission guards", /cell_reports\.validate/.test(dashboard) && /cell_reports\.reject/.test(dashboard) && /cell_reports\.review/.test(dashboard));
check("rejection reason required", /rejection_reason/.test(dashboard) && /O motivo é obrigatório/.test(dashboard));
check("review history kept", /review_history/.test(dashboard));
check("security audit events", /recordCellReportSecurityEvent/.test(dashboard) && /cell_report_unauthorized_submission/.test(dashboard));
check("in-app notifications", /createNotification/.test(dashboard) && /recipient_user_id:\s*report\.submitted_by_user_id/.test(dashboard));
check("offering stays pending", /Pending Finance Review/.test(dashboard) && /never auto-create verified finance/.test(dashboard));
check("no device fingerprint stored", !/submitter_device:\s*navigator\.userAgent/.test(dashboard));
check("documentation present", /authenticated dashboard session/i.test(docs) && /never create a `financeRecord` automatically/i.test(docs));

console.log(`\nAuthenticated Cell Report: ${passed} passed, ${failed} failed\n`);
process.exit(failed ? 1 : 0);
