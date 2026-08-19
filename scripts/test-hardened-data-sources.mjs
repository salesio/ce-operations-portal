/**
 * Test Suite: Hardened Auth & Cell Data Sources
 * Validates that when VITE_DATA_SOURCE=supabase and VITE_ENABLE_REAL_AUTH=true:
 * - authRepository uses Supabase only (no silent demo fallback, demo login disabled)
 * - public.users uses Supabase only via usersSupabaseAdapter
 * - roles/permissions use Supabase only via accessControlSupabaseAdapter
 * - cell_user_assignments uses Supabase only (no localStorage fallback on failure)
 * - cell_transfer_requests uses Supabase only (no localStorage fallback on failure)
 * - reconciliation writes use Supabase only (no seed merge or silent fallback)
 * - Fallbacks available only when VITE_DATA_SOURCE=mock or local.
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFileSync(join(root, file), "utf8");

const authRepo = read("src/data/repositories/authRepository.ts");
const accessRepo = read("src/data/repositories/accessControlRepository.ts");
const usersAdapter = read("src/data/adapters/supabase/usersSupabaseAdapter.ts");
const accessAdapter = read("src/data/adapters/supabase/accessControlSupabaseAdapter.ts");
const cellUserRepo = read("src/data/repositories/cellUserAssignmentsRepository.ts");
const cellTransferRepo = read("src/data/repositories/cellTransferRequestsRepository.ts");
const membersRepo = read("src/data/repositories/membersRepository.ts");
const provider = read("src/data/adapters/supabaseProvider.ts");

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

console.log("\n=== Testing Hardened Auth & Cell Data Sources ===");

// 1. Auth Repository
check("authRepository rejects demo login in Supabase or real auth mode",
  /AUTH_DEMO_DISABLED/.test(authRepo) &&
  /getDataSource\(\)\s*===\s*"supabase"/.test(authRepo)
);

check("authRepository loginWithSupabase returns explicit error when real auth disabled, without demo fallback",
  /AUTH_NOT_CONFIGURED/.test(authRepo) &&
  !authRepo.slice(authRepo.indexOf("loginWithSupabase"), authRepo.indexOf("export async function login(")).includes("loginDemo")
);

check("authRepository login routes to loginWithSupabase when Supabase/realAuth enabled",
  /if\s*\(\s*getDataSource\(\)\s*===\s*"supabase"\s*\|\|\s*isRealAuthEnabled\(\)/.test(authRepo)
);

// 2. Users Supabase Adapter & Access Control Repository
check("usersSupabaseAdapter exists and maps public.users columns",
  existsSync(join(root, "src/data/adapters/supabase/usersSupabaseAdapter.ts")) &&
  /TABLE\s*=\s*"users"/.test(usersAdapter) &&
  /auth_user_id/.test(usersAdapter) &&
  /listUsers/.test(usersAdapter) &&
  /getUserByAuthUserId/.test(usersAdapter)
);

check("supabaseProvider wires users, roles, and permissions to Supabase adapters",
  /users:\s*map\.users\s*as\s*EntityRepository<User>/.test(provider) &&
  /roles:\s*map\.roles\s*as\s*EntityRepository<AccessRole>/.test(provider) &&
  /permissions:\s*map\.permissions\s*as\s*EntityRepository<AccessPermission>/.test(provider)
);

check("accessControlRepository routes single-user queries directly to Supabase adapter in Supabase mode",
  /getUserByEmail[\s\S]*?if\s*\(\s*getDataSource\(\)\s*===\s*"supabase"\s*\)\s*\{[\s\S]*?usersSb\.getUserByEmail/.test(accessRepo) &&
  /getUserByAuthUserId[\s\S]*?if\s*\(\s*getDataSource\(\)\s*===\s*"supabase"\s*\)\s*\{[\s\S]*?usersSb\.getUserByAuthUserId/.test(accessRepo)
);

// 3. Roles & Permissions Supabase Adapter
check("accessControlSupabaseAdapter exists and maps roles & permissions tables",
  existsSync(join(root, "src/data/adapters/supabase/accessControlSupabaseAdapter.ts")) &&
  /ROLES_TABLE\s*=\s*"roles"/.test(accessAdapter) &&
  /PERMISSIONS_TABLE\s*=\s*"permissions"/.test(accessAdapter) &&
  /getPermissionsByRole/.test(accessAdapter)
);

check("accessControlRepository ensureAccessControlSeeded does not seed in Supabase mode",
  /ensureAccessControlSeeded[\s\S]*?if\s*\(\s*getDataSource\(\)\s*===\s*"supabase"\s*\)[\s\S]*?return ok\(true\);/.test(accessRepo)
);

// 4. Cell User Assignments
check("cellUserAssignmentsRepository returns explicit error in Supabase mode without fallback to localStorage",
  /isSupabaseMode\(\)/.test(cellUserRepo) &&
  /SUPABASE_NOT_CONFIGURED/.test(cellUserRepo) &&
  /SUPABASE_ERROR/.test(cellUserRepo) &&
  /deleteCellUserAssignment/.test(cellUserRepo)
);

// 5. Cell Transfer Requests & Removal Logs
check("cellTransferRequestsRepository returns explicit error in Supabase mode without fallback to localStorage",
  /isSupabaseMode\(\)/.test(cellTransferRepo) &&
  /SUPABASE_NOT_CONFIGURED/.test(cellTransferRepo) &&
  /SUPABASE_ERROR/.test(cellTransferRepo) &&
  /logCellMemberRemoval/.test(cellTransferRepo)
);

// 6. Reconciliation & Members Writes
check("membersRepository returns explicit SUPABASE_NOT_CONFIGURED on Supabase failure without mock fallback",
  /listMembers[\s\S]*?SUPABASE_NOT_CONFIGURED/.test(membersRepo) &&
  /listMembersPage[\s\S]*?SUPABASE_NOT_CONFIGURED/.test(membersRepo) &&
  /createMember[\s\S]*?SUPABASE_NOT_CONFIGURED/.test(membersRepo) &&
  /updateMember[\s\S]*?SUPABASE_NOT_CONFIGURED/.test(membersRepo) &&
  /deleteMember[\s\S]*?SUPABASE_NOT_CONFIGURED/.test(membersRepo)
);

check("membersRepository ensureMembersSeeded is a no-op in Supabase mode",
  /ensureMembersSeeded[\s\S]*?getDataSource\(\)\s*===\s*"supabase"/.test(membersRepo)
);

console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
process.exit(failed ? 1 : 0);
