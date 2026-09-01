import fs from "node:fs";

// 1. Update js/dashboard.js
const DASHBOARD_PATH = "js/dashboard.js";
let dashCode = fs.readFileSync(DASHBOARD_PATH, "utf8");

dashCode = dashCode.replace(
  `{ id: "u-1", name: "Admin Principal", email: "admin@ce-mozambique.org", role: "Super Admin", church_id: "church-hq", department_permissions: ["*"], can_view_all_churches: true },`,
  `{ id: "u-1", auth_user_id: "f8d9954c-a17b-4870-98f6-a7d6f2576391", name: "Salésio Machava", email: "admin@embaixadadecristo.org", role: "Super Admin", church_id: "a1111111-1111-4111-8111-111111111101", department_permissions: ["*"], can_view_all_churches: true },`
);

dashCode = dashCode.replace(
  `{ id: "u-pastor-valdemiro", name: "Pastor Valdemiro Machava", email: "valdomacha@gmail.com", role: "pastoral_care_rector", church_id: "a1111111-1111-4111-8111-111111111101", department_permissions: ["firstTimers", "followUp", "foundation", "sacraments", "counseling"], can_view_all_churches: false },`,
  `{ id: "u-pastor-valdemiro", auth_user_id: "ac47e5fa-f9f5-4d58-ab91-eebcb01f1b01", name: "Pastor Valdemiro Machava", email: "p.care@embaixadadecristo.org", role: "pastoral_care_rector", church_id: "a1111111-1111-4111-8111-111111111101", department_permissions: ["firstTimers", "followUp", "foundation", "sacraments", "counseling"], can_view_all_churches: false },`
);

fs.writeFileSync(DASHBOARD_PATH, dashCode, "utf8");
console.log("Updated js/dashboard.js!");

// 2. Update scripts/provision-valdemiro.sql
const PROVISION_PATH = "scripts/provision-valdemiro.sql";
let provCode = fs.readFileSync(PROVISION_PATH, "utf8");
provCode = provCode.replace(/valdomacha@gmail\.com/g, "p.care@embaixadadecristo.org");
provCode = provCode.replace(/b80a3e2d-615e-4f8b-a1a8-4f0d5f458cef/g, "ac47e5fa-f9f5-4d58-ab91-eebcb01f1b01");
fs.writeFileSync(PROVISION_PATH, provCode, "utf8");
console.log("Updated scripts/provision-valdemiro.sql!");

// 3. Update tests
const testFiles = [
  "scripts/test-pastoral-rector-access.mjs",
  "scripts/test-pastoral-rector-landing.mjs",
  "scripts/test-provision-valdemiro.mjs",
  "scripts/test-foundation-school-cleanup.mjs"
];

for (const tf of testFiles) {
  if (fs.existsSync(tf)) {
    let tCode = fs.readFileSync(tf, "utf8");
    tCode = tCode.replace(/valdomacha@gmail\.com/g, "p.care@embaixadadecristo.org");
    tCode = tCode.replace(/b80a3e2d-615e-4f8b-a1a8-4f0d5f458cef/g, "ac47e5fa-f9f5-4d58-ab91-eebcb01f1b01");
    fs.writeFileSync(tf, tCode, "utf8");
    console.log(`Updated ${tf}!`);
  }
}
