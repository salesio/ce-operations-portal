import crypto from "node:crypto";
import fs from "node:fs";

console.log("=== COMPREHENSIVE LIVE AUDIT & BROWSER FLOW VERIFICATION ===");

const liveBaseUrl = "https://salesio.github.io/ce-operations-portal/";

// 1. Download live index.html with cache: no-store
console.log("\n1. Downloading published index.html with cache: no-store...");
const indexRes = await fetch(liveBaseUrl + "index.html?t=" + Date.now(), { cache: "no-store" });
if (!indexRes.ok) {
  throw new Error("Failed to fetch published index.html: HTTP " + indexRes.status);
}
const indexHtml = await indexRes.text();
console.log("   - HTTP Status:", indexRes.status);

const bundleMatch = indexHtml.match(/src=["'](js\/supabase-bundle\.js[^"']*)["']/i);
const bridgeMatch = indexHtml.match(/src=["'](js\/members-data-bridge\.js[^"']*)["']/i);
const diagMatch = indexHtml.match(/src=["'](js\/runtime-diagnostics\.js[^"']*)["']/i);
const configMatch = indexHtml.match(/src=["'](js\/supabase-config\.js[^"']*)["']/i);

console.log("   - Exact bundle reference in index.html:", bundleMatch ? bundleMatch[1] : "NOT FOUND");
console.log("   - Exact bridge reference in index.html:", bridgeMatch ? bridgeMatch[1] : "NOT FOUND");
console.log("   - Exact diag reference in index.html:  ", diagMatch ? diagMatch[1] : "NOT FOUND");
console.log("   - Exact config reference in index.html:", configMatch ? configMatch[1] : "NOT FOUND");

if (!bundleMatch || !bridgeMatch) {
  throw new Error("Missing script tags in live index.html");
}

// 2. Download live scripts with cache: no-store
console.log("\n2. Downloading live bundle & bridges with cache: no-store...");
const bundleUrl = liveBaseUrl + bundleMatch[1];
const bundleRes = await fetch(bundleUrl + (bundleUrl.includes("?") ? "&" : "?") + "t=" + Date.now(), { cache: "no-store" });
const liveBundleCode = await bundleRes.text();
const liveBundleSha256 = crypto.createHash("sha256").update(liveBundleCode).digest("hex");

const localBundleCode = fs.readFileSync("js/supabase-bundle.js", "utf8");
const localBundleSha256 = crypto.createHash("sha256").update(localBundleCode).digest("hex");

console.log("   - Live bundle URL:   ", bundleUrl);
console.log("   - Live bundle SHA256:", liveBundleSha256);
console.log("   - Local bundle SHA256:", localBundleSha256);

const bridgeUrl = liveBaseUrl + bridgeMatch[1];
const bridgeRes = await fetch(bridgeUrl + (bridgeUrl.includes("?") ? "&" : "?") + "t=" + Date.now(), { cache: "no-store" });
const liveBridgeCode = await bridgeRes.text();
const liveBridgeSha256 = crypto.createHash("sha256").update(liveBridgeCode).digest("hex");
console.log("   - Live bridge SHA256:", liveBridgeSha256);

// 3. Inspect bundle content for token propagation and error handling
console.log("\n3. Inspecting Live Bundle Content...");
const hasAuthNoSession = liveBundleCode.includes("AUTH_NO_SESSION");
const hasVersionFix = liveBundleCode.includes("2026.08.21-profile-write-guard");
const hasOldVersion = liveBundleCode.includes("2026.08.19-members-runtime-fix");
const hasError42501 = liveBundleCode.includes("42501");

console.log("   - Contains AUTH_NO_SESSION:                  ", hasAuthNoSession);
console.log("   - Contains 2026.08.21-profile-write-guard:   ", hasVersionFix);
console.log("   - Contains old 2026.08.19-members-runtime-fix:", hasOldVersion);
console.log("   - Contains 42501 error code handling:        ", hasError42501);

if (!hasAuthNoSession || !hasVersionFix || hasOldVersion) {
  throw new Error("Live bundle content validation failed");
}

// 4. Runtime simulation in live environment
console.log("\n4. Simulating Live Browser Environment with Downloaded Live Scripts...");

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

// Execute live bundle
new Function(liveBundleCode).call(globalThis);
// Execute live bridge
new Function(liveBridgeCode).call(globalThis);

// 4.1 Unauthenticated query verification (fail-closed + diagnostics)
console.log("\n4.1 Unauthenticated Test (Hard Refresh State / No Session)...");
const unauthResult = await globalThis.CEDataLayer.members.listMembersPage({ page: 1, pageSize: 50 });
console.log("   - Unauthenticated query ok:", unauthResult.ok);
console.log("   - Unauthenticated query code:", unauthResult.code);

const unauthInfo = globalThis.CEMembers.getInfo();
console.log("   - Unauthenticated CEMembers.getInfo():", {
  dataSource: unauthInfo.dataSource,
  repository: unauthInfo.repository,
  version: unauthInfo.version,
  fallbackUsed: unauthInfo.fallbackUsed,
  lastError: unauthInfo.lastError,
  lastRowsReturned: unauthInfo.lastRowsReturned,
});

if (unauthResult.ok !== false || unauthResult.code !== "AUTH_NO_SESSION") {
  throw new Error("Unauthenticated query did not fail closed with AUTH_NO_SESSION");
}
if (unauthInfo.lastError === null || unauthInfo.lastError?.code !== "42501") {
  throw new Error("Unauthenticated diagnostics did not record code 42501");
}

// 4.2 Authenticated flow (Login -> Session Check -> Query with Bearer JWT)
console.log("\n4.2 Authenticated Flow (Login as Salésio Machava -> Query with Bearer JWT)...");
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
    await new Promise((r) => setTimeout(r, 1500));
  }
}

if (authRes.error || !authRes.data?.session?.access_token) {
  throw new Error("Failed to sign in: " + authRes.error?.message);
}
console.log("   - Sign in successful. Access token acquired (sanitized length:", authRes.data.session.access_token.length, "chars)");

// Verify direct PostgREST request with Authorization: Bearer <token>
const postgrestUrl = "https://kmurqbgpybrolrrumiue.supabase.co/rest/v1/members?select=id,full_name,church_id,status&limit=50";
const directPostgrestRes = await fetch(postgrestUrl, {
  method: "GET",
  headers: {
    apikey: globalThis.__CE_ENV__.VITE_SUPABASE_ANON_KEY,
    Authorization: `Bearer ${authRes.data.session.access_token}`,
    Prefer: "count=exact",
  },
});

console.log("\n4.3 Direct PostgREST Request Evidence with Bearer JWT:");
console.log("   - Request URL:         ", postgrestUrl.split("?")[0]);
console.log("   - Authorization Header: Bearer [REDACTED_VALID_USER_JWT]");
console.log("   - HTTP Status:         ", directPostgrestRes.status);
console.log("   - Content-Range Header:", directPostgrestRes.headers.get("content-range"));

if (directPostgrestRes.status !== 200) {
  const errBody = await directPostgrestRes.text();
  throw new Error("Direct PostgREST request failed with HTTP " + directPostgrestRes.status + ": " + errBody);
}

// Run members query through data layer
const authMembersResult = await globalThis.CEDataLayer.members.listMembersPage({ page: 1, pageSize: 50 });
console.log("\n4.4 Data Layer Members Query Result:");
console.log("   - ok:           ", authMembersResult.ok);
console.log("   - totalCount:   ", authMembersResult.data?.totalCount);
console.log("   - items length: ", authMembersResult.data?.items?.length);
console.log("   - first member: ", authMembersResult.data?.items?.[0]?.fullName || "None");

const authInfo = globalThis.CEMembers.getInfo();
console.log("\n4.5 Authenticated CEMembers.getInfo():", {
  dataSource: authInfo.dataSource,
  repository: authInfo.repository,
  version: authInfo.version,
  fallbackUsed: authInfo.fallbackUsed,
  lastError: authInfo.lastError,
  lastRowsReturned: authInfo.lastRowsReturned,
  ready: authInfo.ready,
  fallback: authInfo.fallback,
});

if (authInfo.version !== "2026.08.21-profile-write-guard") {
  throw new Error("Version mismatch in CEMembers.getInfo(): " + authInfo.version);
}
if (authInfo.lastError !== null) {
  throw new Error("lastError was not null on authenticated query: " + JSON.stringify(authInfo.lastError));
}
if (authInfo.fallbackUsed !== false) {
  throw new Error("fallbackUsed was true");
}

console.log("\n>>> LIVE BROWSER FLOW VERIFICATION 100% SUCCESSFUL! <<<\n");
process.exit(0);
