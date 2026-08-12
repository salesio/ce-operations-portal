import fs from "node:fs";

const required = [
  "src/data/repositories/memberRegistrationCandidatesRepository.ts",
  "supabase/migrations/0015_members_master_data_legacy_import_readiness.sql",
  "docs/backend/MEMBER_CANDIDATE_APPROVAL_WORKFLOW.md",
  "js/dashboard.js",
];
for (const file of required) {
  if (!fs.existsSync(file)) throw new Error(`Missing required workflow file: ${file}`);
}
const dashboard = fs.readFileSync("js/dashboard.js", "utf8");
const migration = fs.readFileSync("supabase/migrations/0015_members_master_data_legacy_import_readiness.sql", "utf8");
for (const token of ["memberRegistrationCandidates", "openMemberCandidateForm", "candidateAction", "member_candidate.approved", "member_candidate.submitted", "member_candidate.correction_requested", "data-open-member-candidate", "data-candidate-submit-form", "Registos por Aprovar", "data-member-candidate-tab", "persistMemberCandidateViaRepository", "local-state-legacy-candidate", "provider_sync_status", "Pending"]) {
  if (!dashboard.includes(token)) throw new Error(`Dashboard workflow is missing: ${token}`);
}
for (const token of ["member_registration_candidates", "primary_phone text", "approval_status", "approved_member_id"]) {
  if (!migration.includes(token)) throw new Error(`Migration is missing: ${token}`);
}
if (dashboard.includes("primary_phone: `+258")) throw new Error("Candidate workflow must not generate placeholder phones.");
if (!dashboard.includes("context.authorized_cell_ids.includes(item.cell_id)")) throw new Error("Cell Portal must scope candidates by authorized cell.");
if (!dashboard.includes("[\"Submitted\", \"UnderReview\"]")) throw new Error("Active approval queue must contain submitted/review candidates only.");
if (!dashboard.includes("Criar novo membro") || !dashboard.includes("Ligar existente")) throw new Error("Duplicate approval must require an explicit create/link decision.");
console.log("Member candidate workflow smoke check passed.");
