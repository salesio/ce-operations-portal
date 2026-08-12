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
for (const token of ["memberRegistrationCandidates", "openMemberCandidateForm", "candidateAction", "member_candidate.approved", "data-open-member-candidate"]) {
  if (!dashboard.includes(token)) throw new Error(`Dashboard workflow is missing: ${token}`);
}
for (const token of ["member_registration_candidates", "primary_phone text", "approval_status", "approved_member_id"]) {
  if (!migration.includes(token)) throw new Error(`Migration is missing: ${token}`);
}
if (dashboard.includes("primary_phone: `+258")) throw new Error("Candidate workflow must not generate placeholder phones.");
console.log("Member candidate workflow smoke check passed.");
