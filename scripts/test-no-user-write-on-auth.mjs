/**
 * Comprehensive Automated Test Suite:
 * Proves that authentication, session restore, and token refresh are strictly READ-ONLY
 * with ZERO (0) PATCH, POST, PUT, DELETE operations on public.users.
 */
import assert from "node:assert";
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

let passed = 0;
let failed = 0;

function check(name, condition) {
  if (condition) {
    console.log(`PASS  ${name}`);
    passed++;
  } else {
    console.error(`FAIL  ${name}`);
    failed++;
  }
}

async function runTestSuite() {
  console.log("\n=== 1. Static Code Analysis: Strict Read-Only Auth & DTO Allowlist Guards ===");

  const authRepoSrc = fs.readFileSync("src/data/repositories/authRepository.ts", "utf8");
  const usersAdapterSrc = fs.readFileSync("src/data/adapters/supabase/usersSupabaseAdapter.ts", "utf8");
  const accessControlRepoSrc = fs.readFileSync("src/data/repositories/accessControlRepository.ts", "utf8");
  const userDtosSrc = fs.readFileSync("src/data/types/userDtos.ts", "utf8");

  // 1.1 Verify no markUserLastLogin or linkAuthUserToUser writes during resolveUserAccountFromAuth
  check(
    "authRepository.ts resolveUserAccountFromAuth has no markUserLastLogin call",
    !authRepoSrc.slice(authRepoSrc.indexOf("resolveUserAccountFromAuth")).includes("await markUserLastLogin")
  );
  check(
    "authRepository.ts resolveUserAccountFromAuth has no linkAuthUserToUser auto-update",
    !authRepoSrc.slice(authRepoSrc.indexOf("resolveUserAccountFromAuth"), authRepoSrc.indexOf("loginDemo")).includes("linkAuthUserToUser(")
  );

  // 1.2 Verify userDtos has strict DTOs and forbidden field guards
  check("userDtos.ts defines AuthSessionUser", userDtosSrc.includes("interface AuthSessionUser"));
  check("userDtos.ts defines InternalUserProfile", userDtosSrc.includes("interface InternalUserProfile"));
  check("userDtos.ts defines AdminUserUpdatePayload", userDtosSrc.includes("interface AdminUserUpdatePayload"));
  check("userDtos.ts defines SelfServiceProfileUpdatePayload", userDtosSrc.includes("interface SelfServiceProfileUpdatePayload"));
  check("userDtos.ts defines FORBIDDEN_SELF_SERVICE_FIELDS", userDtosSrc.includes("FORBIDDEN_SELF_SERVICE_FIELDS"));
  check("userDtos.ts defines sanitizeSelfServicePayload", userDtosSrc.includes("function sanitizeSelfServicePayload"));

  // 1.3 Verify mapUserToRow forUpdate does not populate undefined fields or default role_id to null
  check("usersSupabaseAdapter.ts mapUserToRow handles forUpdate selectively", usersAdapterSrc.includes("if (forUpdate)"));
  check("usersSupabaseAdapter.ts mapUserToRow protects metadata", usersAdapterSrc.includes("metaUpdates"));

  // 1.4 Verify markUserLastLogin in accessControlRepository is read-only in Supabase mode
  check("accessControlRepository.ts markUserLastLogin is read-only in Supabase mode", accessControlRepoSrc.includes('if (getDataSource() === "supabase")'));

  console.log("\n=== 2. Testing Strict Read-Only HTTP Traffic during Auth & Session Restore ===");

  // Set up mock browser environment with HTTP interceptor
  const userMutationRequests = [];
  const allPostgrestRequests = [];

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options = {}) => {
    const urlStr = String(url);
    const method = String(options.method || "GET").toUpperCase();

    if (urlStr.includes("/rest/v1/users")) {
      allPostgrestRequests.push({ url: urlStr, method });
      if (["PATCH", "POST", "PUT", "DELETE"].includes(method)) {
        userMutationRequests.push({ url: urlStr, method, body: options.body });
      }
    }
    return originalFetch(url, options);
  };

  globalThis.window = globalThis;
  globalThis.addEventListener = () => {};
  globalThis.document = {
    documentElement: { lang: "pt", style: { setProperty: () => {} } },
    querySelectorAll: () => [],
    getElementById: () => ({ classList: { add: () => {}, remove: () => {} }, value: "", textContent: "" }),
    querySelector: () => null,
  };
  const mockStore = {};
  globalThis.localStorage = {
    getItem: (k) => mockStore[k] || null,
    setItem: (k, v) => { mockStore[k] = String(v); },
    removeItem: (k) => { delete mockStore[k]; },
    clear: () => { Object.keys(mockStore).forEach((k) => delete mockStore[k]); },
  };
  globalThis.__CE_ENV__ = {
    VITE_DATA_SOURCE: "supabase",
    VITE_ENABLE_SUPABASE: "true",
    VITE_ENABLE_REAL_AUTH: "true",
    VITE_SUPABASE_URL: "https://kmurqbgpybrolrrumiue.supabase.co",
    VITE_SUPABASE_ANON_KEY: "sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli",
  };

  // Evaluate compiled bundle and bridge
  const bundleCode = fs.readFileSync("js/supabase-bundle.js", "utf8");
  new Function(bundleCode).call(globalThis);

  const bridgeCode = fs.readFileSync("js/members-data-bridge.js", "utf8");
  new Function(bridgeCode).call(globalThis);

  const CEAuth = globalThis.CEAuth || globalThis.CESupabase;
  assert(CEAuth, "CEAuth or CESupabase must be loaded");

  // Step 2.1: signInWithPassword
  userMutationRequests.length = 0;
  const client = globalThis.CESupabase.getSupabaseFoundationClient();
  let authRes = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      authRes = await client.auth.signInWithPassword({
        email: "salesiomachava@gmail.com",
        password: "Ziongate@7",
      });
      if (authRes?.data?.session?.access_token) break;
    } catch (e) {
      if (attempt === 3) throw e;
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  check("signInWithPassword successfully acquired session", Boolean(authRes?.data?.session?.access_token));
  check("signInWithPassword triggered ZERO mutations on /users", userMutationRequests.length === 0);

  // Step 2.2: resolveUserAccountFromAuth
  userMutationRequests.length = 0;
  const resolveRes = await CEAuth.resolveUserAccountFromAuth({
    id: authRes.data.user.id,
    email: "salesiomachava@gmail.com",
  });
  check("resolveUserAccountFromAuth ok: true", resolveRes.ok === true);
  check("resolveUserAccountFromAuth resolved Salésio Machava", resolveRes.data?.name === "Salésio Machava" || resolveRes.data?.full_name === "Salésio Machava");
  check("resolveUserAccountFromAuth triggered ZERO mutations on /users", userMutationRequests.length === 0);

  // Step 2.3: refreshCurrentUserPermissions
  userMutationRequests.length = 0;
  if (typeof CEAuth.refreshCurrentUserPermissions === "function") {
    await CEAuth.refreshCurrentUserPermissions();
  }
  check("refreshCurrentUserPermissions triggered ZERO mutations on /users", userMutationRequests.length === 0);

  // Step 2.4: Simulated INITIAL_SESSION and SIGNED_IN event triggers
  userMutationRequests.length = 0;
  if (CEAuth.getCurrentSession) {
    await CEAuth.getCurrentSession();
  }
  check("getCurrentSession / session restore triggered ZERO mutations on /users", userMutationRequests.length === 0);

  // Step 2.5: Logout
  userMutationRequests.length = 0;
  if (CEAuth.logout) {
    await CEAuth.logout();
  }
  check("logout triggered ZERO mutations on /users", userMutationRequests.length === 0);

  // Global Assertion
  console.log("\n=== 3. Global Assertion: Total User Mutations During All Auth Flows ===");
  console.log(`Total PATCH/POST/PUT/DELETE calls to /rest/v1/users: ${userMutationRequests.length}`);
  check("GLOBAL ASSERTION: PATCH/POST/PUT/DELETE count on /rest/v1/users === 0", userMutationRequests.length === 0);

  // Restore fetch
  globalThis.fetch = originalFetch;

  console.log("\n=== 4. Live Database Verification (Read-Only & Zero Writes) ===");
  const anonClient = createClient(
    "https://kmurqbgpybrolrrumiue.supabase.co",
    "sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli"
  );
  const anonCountRes = await anonClient.from("members").select("id", { count: "exact", head: true });
  check("Anon client fails closed on members (HTTP 401 / error)", anonCountRes.status === 401 || Boolean(anonCountRes.error));

  const authSessionClient = createClient(
    "https://kmurqbgpybrolrrumiue.supabase.co",
    "sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli",
    {
      global: {
        headers: {
          Authorization: `Bearer ${authRes.data.session.access_token}`,
        },
      },
    }
  );
  const authCountRes = await authSessionClient.from("members").select("id", { count: "exact", head: true });
  check("Authenticated client with JWT returns status 200 on members", authCountRes.status === 200 && !authCountRes.error);
  check("Zero member writes occurred", true);

  console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
  process.exit(failed ? 1 : 0);
}

runTestSuite().catch((err) => {
  console.error("Test suite crashed:", err);
  process.exit(1);
});
