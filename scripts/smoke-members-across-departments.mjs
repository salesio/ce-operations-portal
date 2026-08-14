import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

console.log("Checking member hydration across departments...");

// 1. Check dashboard.js contains hydrateMembersFromRepository in initialization and route navigation
const dashboardJs = fs.readFileSync(path.join(root, "js", "dashboard.js"), "utf8");

assert(
  dashboardJs.includes("hydrateMembersFromRepository()"),
  "dashboard.js must contain hydrateMembersFromRepository() calls"
);

assert(
  dashboardJs.includes("memberDependentRoutes"),
  "dashboard.js setRoute must contain memberDependentRoutes auto-hydration check"
);

// 2. Check repository listMembers interface in membersRepository.ts
const membersRepoTs = fs.readFileSync(
  path.join(root, "src", "data", "repositories", "membersRepository.ts"),
  "utf8"
);
assert(
  membersRepoTs.includes("export async function listMembers()"),
  "membersRepository.ts must export listMembers()"
);

// 3. Check members bridge
const membersBridgeJs = fs.readFileSync(
  path.join(root, "js", "members-data-bridge.js"),
  "utf8"
);
assert(
  membersBridgeJs.includes("listMembers:"),
  "members-data-bridge.js must expose listMembers"
);

console.log("PASS: Member hydration checks passed across all departments!");
