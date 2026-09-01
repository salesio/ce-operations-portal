import fs from "node:fs";

let dashCode = fs.readFileSync("js/dashboard.js", "utf8");
dashCode = dashCode.replace(/\r\n/g, "\n");

// 1. Add cell_portal.edit and cell_portal.register_member to CELL_PORTAL_PERMISSION_CODES
const oldPortalCodes = `const CELL_PORTAL_PERMISSION_CODES = [
  "cell_portal.view",
  "cell_portal.view_members",
  "cell_portal.view_member_profile",
  "cell_portal.submit_report",
  "cell_portal.view_finance_summary",
  "cell_portal.view_partnership_summary",
  "cell_portal.view_soul_winning",
  "cell_portal.view_programs",
  "cell_portal.view_charts",
  "cell_portal.export_summary"
];`;

const newPortalCodes = `const CELL_PORTAL_PERMISSION_CODES = [
  "cell_portal.view",
  "cell_portal.edit",
  "cell_portal.register_member",
  "cell_portal.view_members",
  "cell_portal.view_member_profile",
  "cell_portal.submit_report",
  "cell_portal.view_finance_summary",
  "cell_portal.view_partnership_summary",
  "cell_portal.view_soul_winning",
  "cell_portal.view_programs",
  "cell_portal.view_charts",
  "cell_portal.export_summary"
];`;

if (dashCode.includes(oldPortalCodes)) {
  dashCode = dashCode.replace(oldPortalCodes, newPortalCodes);
  console.log("Updated CELL_PORTAL_PERMISSION_CODES in dashboard.js");
} else {
  console.warn("oldPortalCodes not found!");
}

// 2. Fix isReadOnlyPortal
const oldReadOnly = `    const isReadOnlyPortal = ["alec_manager", "ALEC Coordinator", "ALEC Manager"].includes(activeUser?.role) || !hasCellPortalPermission("cell_portal.edit");`;

const newReadOnly = `    const isReadOnlyPortal = ["alec_manager", "ALEC Coordinator", "ALEC Manager"].includes(activeUser?.role) ||
      (!isCellLeaderOrAssistant(activeUser) && !["Super Admin", "Main Pastor", "National Admin", "Administrator", "Admin", "Cell Ministry Head"].includes(activeUser?.role) && !hasCellPortalPermission("cell_portal.edit"));`;

if (dashCode.includes(oldReadOnly)) {
  dashCode = dashCode.replace(oldReadOnly, newReadOnly);
  console.log("Updated isReadOnlyPortal in dashboard.js");
} else {
  console.warn("oldReadOnly not found!");
}

// 3. Make hero button gold and prominent
const oldHeroBtns = `          \${!isReadOnlyPortal ? \`
            <button type="button" class="btn btn-outline-gold btn-touch" data-open-member-candidate title="Registar membro pendente de aprovação"><i class="bi bi-person-plus-fill me-2"></i>+ Registar Membro</button>
            <button type="button" class="btn btn-ce-gold btn-touch" data-public-cell-report><i class="bi bi-clipboard-plus me-2"></i>Submeter Relatório Semanal</button>
          \` : ""}`;

const newHeroBtns = `          \${!isReadOnlyPortal ? \`
            <button type="button" class="btn btn-ce-gold btn-touch shadow" data-open-member-candidate title="Registar membro pendente de aprovação"><i class="bi bi-person-plus-fill me-2"></i>+ Registar Membro</button>
            <button type="button" class="btn btn-outline-gold btn-touch" data-public-cell-report><i class="bi bi-clipboard-plus me-2"></i>Submeter Relatório Semanal</button>
          \` : ""}`;

if (dashCode.includes(oldHeroBtns)) {
  dashCode = dashCode.replace(oldHeroBtns, newHeroBtns);
  console.log("Updated hero buttons in dashboard.js");
} else {
  console.warn("oldHeroBtns not found!");
}

fs.writeFileSync("js/dashboard.js", dashCode, "utf8");
console.log("Patched dashboard.js successfully!");
