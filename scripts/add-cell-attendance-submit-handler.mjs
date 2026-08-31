import fs from "node:fs";

const DASHBOARD_PATH = "js/dashboard.js";
let code = fs.readFileSync(DASHBOARD_PATH, "utf8");

const regex = /if \(modalType === "memberCandidate"\) return submitMemberCandidateForm\(event\.target\);\r?\n\s*if \(modalType\) submitForm\(event\.target\);/;

const replacement = `if (modalType === "memberCandidate") return submitMemberCandidateForm(event.target);
  if (modalType === "cellAttendance") return submitCellAttendanceModal(event.target);
  if (modalType) submitForm(event.target);`;

if (regex.test(code)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync(DASHBOARD_PATH, code, "utf8");
  console.log("Successfully added modalType === 'cellAttendance' to submit handler!");
} else {
  console.log("Regex did not match");
}
