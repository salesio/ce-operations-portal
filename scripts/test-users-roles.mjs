/**
 * Test Suite: Users & Roles RBAC Model
 * Validates role definitions, hierarchy, scopes, permission seeds,
 * and user management table enhancements.
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFileSync(join(root, file), "utf8");

const rolesSeed = read("src/data/seeds/rolesSeed.ts");
const permissionsSeed = read("src/data/seeds/permissionsSeed.ts");
const dashboard = read("js/dashboard.js");
const accessControl = read("js/access-control.js");

let passed = 0;
let failed = 0;

function check(name, condition) {
  if (condition) {
    passed += 1;
    console.log(`PASS  ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL  ${name}`);
  }
}

console.log("\n=== Testing Users & Roles Model ===");

check("rolesSeed contains standard roles with correct default scopes",
  /role-church-admin/.test(rolesSeed) &&
  /role-cell-group-leader/.test(rolesSeed) &&
  /role-cell-leader/.test(rolesSeed) &&
  /role-cell-assistant/.test(rolesSeed) &&
  /default_scope:\s*"church"/.test(rolesSeed) &&
  /default_scope:\s*"cell_group"/.test(rolesSeed) &&
  /default_scope:\s*"own"/.test(rolesSeed)
);

check("permissionsSeed includes permissions for church_admin, cell_group_leader, and cell_assistant",
  /role-church-admin/.test(permissionsSeed) &&
  /role-cell-group-leader/.test(permissionsSeed) &&
  /role-cell-assistant/.test(permissionsSeed)
);

check("accessControl templates include Church Admin, Cell Group Leader, and Assistant Cell Leader",
  /"Church Admin":/.test(accessControl) &&
  /"Cell Group Leader":/.test(accessControl) &&
  /"Assistant Cell Leader":/.test(accessControl)
);

check("modules outside cell scope are omitted from Cell Leader template (default deny)",
  /"Cell Leader":\s*\{\s*modules:\s*\{[\s\S]{0,600}cell:/.test(accessControl) &&
  !/"Cell Leader":\s*\{\s*modules:\s*\{[\s\S]{0,600}finance:/.test(accessControl)
);

check("renderUsers table displays Auth Link status and Cell/Group assignment",
  /Auth Ligado/.test(dashboard) &&
  /Pendente Auth/.test(dashboard) &&
  /Linked/.test(dashboard) &&
  /Pending Setup/.test(dashboard) &&
  /Célula \/ Grupo/.test(dashboard)
);

check("formSchemas.user contains role selector with standard roles",
  /user:\s*\[[\s\S]{0,400}Church Admin[\s\S]{0,300}Assistant Cell Leader/.test(dashboard)
);

check("documentation exists",
  existsSync(join(root, "docs/auth/USER_ROLE_MODEL.md"))
);

console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
process.exit(failed ? 1 : 0);
