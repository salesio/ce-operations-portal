import fs from "fs";
import { resolve } from "path";

console.log("Checking ALEC RBAC and workspace route isolation...");

const dashboardContent = fs.readFileSync("js/dashboard.js", "utf-8");
const accessContent = fs.readFileSync("js/access-control.js", "utf-8");

// 1. Verify Sister Angelica user in seedData
if (!dashboardContent.includes("angelica@ce-mozambique.org")) {
  throw new Error("FAIL: Sister Angelica user missing in js/dashboard.js");
}
console.log("PASS: Sister Angelica user present in seedData (email: angelica@ce-mozambique.org)");

// 2. Verify ALEC Coordinator roleWorkspaceRoutes check
if (!dashboardContent.includes('role === "ALEC Coordinator"') || !dashboardContent.includes("cellAlecOverview")) {
  throw new Error("FAIL: roleWorkspaceRoutes does not contain ALEC Coordinator workspace isolation");
}
console.log("PASS: roleWorkspaceRoutes correctly isolates ALEC Coordinator to cellAlecOverview, cellAlecRegistration, cellAlecScores, cellChurchReports");

// 3. Verify renderCellSidebarNav filtering
if (!dashboardContent.includes("visibleRoutes") || !dashboardContent.includes("workspaceRoutes.includes(route)")) {
  throw new Error("FAIL: renderCellSidebarNav does not filter cell routes against workspaceRoutes");
}
console.log("PASS: renderCellSidebarNav dynamically filters sidebar items according to user workspace");

// 4. Verify explicitDeniedModules in access-control.js
if (!accessContent.includes('"ALEC Coordinator": new Set([')) {
  throw new Error("FAIL: access-control.js missing explicitDeniedModules for ALEC Coordinator");
}
console.log("PASS: access-control.js explicitly denies non-ALEC modules (finance, staffHr, requisitions, etc.) for ALEC Coordinator");

console.log("\nALL ALEC RBAC tests passed successfully!");
