/**
 * test-supabase-runtime-members.mjs
 *
 * Validates Supabase runtime member diagnostics, strict mode,
 * canonical church UUID scoping, and fallback safeguards.
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import vm from "node:vm";

console.log("=== Testing Supabase Runtime & Members Visibility ===");

const root = process.cwd();

// Test 1: Validate files exist
console.log("1. Checking runtime files exist...");
assert.ok(existsSync(resolve(root, "js/runtime-diagnostics.js")), "js/runtime-diagnostics.js must exist");
assert.ok(existsSync(resolve(root, "js/members-data-bridge.js")), "js/members-data-bridge.js must exist");
assert.ok(existsSync(resolve(root, "js/supabase-config.js")), "js/supabase-config.js must exist");
assert.ok(existsSync(resolve(root, "js/runtime-config.js")), "js/runtime-config.js must exist");

// Test 2: Execute runtime diagnostics in sandbox
console.log("2. Testing window.CERuntime diagnostics helper...");
const sandbox = {
  window: {
    __CE_ENV__: {
      VITE_DATA_SOURCE: "supabase",
      VITE_ENABLE_SUPABASE: "true",
      VITE_ENABLE_REAL_AUTH: "false",
      VITE_ENABLE_STORAGE: "false",
      VITE_SUPABASE_URL: "https://kmurqbgpybrolrrumiue.supabase.co",
      VITE_SUPABASE_ANON_KEY: "sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli",
      VITE_APP_ENV: "production",
    },
  },
  URL: globalThis.URL,
  Date: globalThis.Date,
  JSON: globalThis.JSON,
  console: { info() {}, warn() {}, error() {}, log() {} },
};
sandbox.window.window = sandbox.window;
sandbox.globalThis = sandbox.window;

const diagCode = readFileSync(resolve(root, "js/runtime-diagnostics.js"), "utf8");
vm.runInNewContext(diagCode, sandbox);

assert.ok(sandbox.window.CERuntime, "window.CERuntime should be defined");
const runtimeInfo = sandbox.window.CERuntime.getInfo();
assert.equal(runtimeInfo.dataSource, "supabase");
assert.equal(runtimeInfo.supabaseEnabled, true);
assert.equal(runtimeInfo.realAuthEnabled, false);
assert.equal(runtimeInfo.supabaseConfigured, true);
assert.equal(runtimeInfo.urlHost, "kmurqbgpybrolrrumiue.supabase.co");
assert.ok(runtimeInfo.buildVersion, "buildVersion must be defined");
assert.ok(!JSON.stringify(runtimeInfo).includes("sb_publishable"), "CERuntime must NEVER leak anon key");
console.log("   ✓ CERuntime correctly inspects env without leaking keys:", runtimeInfo);

// Test 3: Validate Members Bridge and CEMembers.getInfo()
console.log("3. Testing window.CEMembers diagnostics & strict Supabase mode...");
const bridgeCode = readFileSync(resolve(root, "js/members-data-bridge.js"), "utf8");
vm.runInNewContext(bridgeCode, sandbox);

assert.ok(sandbox.window.CEMembers, "window.CEMembers must be defined");
const membersInfo = sandbox.window.CEMembers.getInfo();
assert.equal(membersInfo.dataSource, "supabase");
assert.equal(membersInfo.fallbackUsed, false, "Fallback must not be marked as used in initial state");
assert.equal(membersInfo.lastError, null);
console.log("   ✓ CEMembers getInfo() returned expected structure:", membersInfo);

// Test 4: Strict Supabase Mode (no silent mock fallback on error)
console.log("4. Testing Strict Supabase Mode error propagation...");
(async () => {
  // When no Supabase bundle is installed, calling listMembersPage in supabase mode must return SUPABASE_UNAVAILABLE
  const pageResult = await sandbox.window.CEMembers.listMembersPage({ page: 1, pageSize: 50 });
  assert.equal(pageResult.ok, false, "Must return failure when Supabase repository is unavailable in supabase mode");
  assert.equal(pageResult.code, "SUPABASE_UNAVAILABLE");
  
  const postErrorInfo = sandbox.window.CEMembers.getInfo();
  assert.equal(postErrorInfo.fallbackUsed, false, "Strict Supabase mode must NEVER silently use pure mock fallback");
  assert.ok(postErrorInfo.lastError, "lastError must record the Supabase failure");
  assert.deepEqual(postErrorInfo.lastQuery, { page: 1, pageSize: 50 });
  console.log("   ✓ Strict Supabase mode successfully prevented silent mock fallback:", postErrorInfo);

  // Test 5: Verify Canonical UUID in EC_CHURCH_DISPLAY_NAMES
  console.log("5. Testing canonical Maputo Sede UUID mapping...");
  const dashCode = readFileSync(resolve(root, "js/dashboard.js"), "utf8");
  assert.ok(
    dashCode.includes('"a1111111-1111-4111-8111-111111111101": "E.C. Maputo Central - Sede"'),
    "EC_CHURCH_DISPLAY_NAMES must map a1111111-1111-4111-8111-111111111101 to E.C. Maputo Central - Sede"
  );
  console.log("   ✓ Canonical UUID a1111111-1111-4111-8111-111111111101 mapped to E.C. Maputo Central - Sede");

  // Test 6: Verify index.html includes runtime-diagnostics.js
  console.log("6. Verifying index.html script inclusion...");
  const indexHtml = readFileSync(resolve(root, "index.html"), "utf8");
  assert.ok(indexHtml.includes('src="js/runtime-diagnostics.js'), "index.html must include runtime-diagnostics.js");
  assert.ok(/v=20260819-members-runtime-fix-v[1-9]/.test(indexHtml), "index.html must have updated cache-busting strings");
  console.log("   ✓ index.html has runtime-diagnostics.js and cache-busting parameters");

  // Test 7: Verify write-github-pages-runtime-config.mjs supports CE_ and VITE_ env variables
  console.log("7. Verifying GitHub Pages deployment script...");
  const ghScript = readFileSync(resolve(root, "scripts/write-github-pages-runtime-config.mjs"), "utf8");
  assert.ok(ghScript.includes("process.env.CE_SUPABASE_URL"), "Must support CE_SUPABASE_URL");
  assert.ok(ghScript.includes("process.env.VITE_SUPABASE_URL"), "Must support VITE_SUPABASE_URL");
  console.log("   ✓ GitHub Pages deploy script verified");

  console.log("\n=======================================================");
  console.log("All 7 Supabase runtime members tests PASSED successfully!");
  console.log("=======================================================");
})();
