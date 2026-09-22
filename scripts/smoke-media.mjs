import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { runInThisContext } from "node:vm";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
let passed = 0;
let failed = 0;
const results = [];

function ok(name, cond, detail = "") {
  if (cond) {
    passed += 1;
    results.push(`PASS  ${name}${detail ? ` — ${detail}` : ""}`);
  } else {
    failed += 1;
    results.push(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

// 1. Files existence check
const mediaFiles = [
  "src/data/adapters/supabase/mediaSupabaseAdapter.ts",
  "src/data/adapters/api/mediaApiAdapter.ts",
  "src/data/repositories/mediaRepository.ts",
  "js/media-data-bridge.js",
  "supabase/migrations/0009_programs_media_pilot.sql",
  "src/data/seeds/mediaTeamSeed.ts",
  "src/data/seeds/mediaServicesSeed.ts",
  "src/data/seeds/mediaSchedulesSeed.ts",
  "src/data/seeds/mediaChannelsSeed.ts",
  "src/data/seeds/mediaPerformanceSeed.ts",
  "src/data/seeds/mediaAwardsSeed.ts"
];

for (const file of mediaFiles) {
  ok(`file exists: ${file}`, existsSync(join(root, file)));
}

// 2. Mock seeds purged check
const seeds = [
  "src/data/seeds/mediaTeamSeed.ts",
  "src/data/seeds/mediaServicesSeed.ts",
  "src/data/seeds/mediaSchedulesSeed.ts",
  "src/data/seeds/mediaChannelsSeed.ts",
  "src/data/seeds/mediaPerformanceSeed.ts",
  "src/data/seeds/mediaAwardsSeed.ts"
];

for (const seed of seeds) {
  const content = read(seed).trim();
  ok(`seed purged: ${seed}`, /export const media\w+Seed:\s*any\[\]\s*=\s*\[\s*\];/.test(content));
}

// 3. Database tables check in migration & schema
const mediaTables = [
  "media_roles",
  "media_team_members",
  "media_services",
  "media_schedules",
  "media_channels",
  "media_performance_records",
  "media_awards"
];

const migration = read("supabase/migrations/0009_programs_media_pilot.sql");
for (const table of mediaTables) {
  ok(`migration contains ${table}`, migration.includes(table));
}

// 4. Supabase provider mapping check
const provider = read("src/data/adapters/supabaseProvider.ts");
for (const table of mediaTables) {
  ok(`supabaseProvider maps ${table}`, provider.includes(`map.${table}`) || provider.includes(`"${table}"`));
}

// 5. Media data bridge exports check
const bridge = read("js/media-data-bridge.js");
const deleteMethods = [
  "deleteMediaRole",
  "deleteMediaService",
  "deleteMediaSchedule",
  "deleteMediaChannel",
  "deleteMediaPerformanceReview",
  "deleteMediaAward"
];

for (const method of deleteMethods) {
  ok(`media bridge defines ${method}`, bridge.includes(method));
}

// 6. Dashboard navigation and tab route integration check
const dashboard = read("js/dashboard.js");
ok("dashboard defines MEDIA_NAV", dashboard.includes("MEDIA_NAV"));
ok("dashboard defines MEDIA_TAB_ROUTES", dashboard.includes("MEDIA_TAB_ROUTES"));
ok("dashboard includes renderMediaSidebarNav", dashboard.includes("renderMediaSidebarNav"));
ok("dashboard includes isLegacyMockId media prefixes", /mt-|mr-|ms-|sch-|mc-|mev-|maw-/.test(dashboard));

// 7. Runtime in-memory contract check via bundle
const store = new Map();
globalThis.window = globalThis;
globalThis.document = {
  readyState: "complete",
  addEventListener() {},
  querySelector() { return null; },
};
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
  key: (i) => [...store.keys()][i] ?? null,
  get length() { return store.size; },
};
globalThis.__CE_ENV__ = { VITE_DATA_SOURCE: "mock" };

const bundlePath = join(root, "js/supabase-bundle.js");
ok("bundle present", existsSync(bundlePath), "run npm run build first");

if (existsSync(bundlePath)) {
  runInThisContext(readFileSync(bundlePath, "utf8"), { filename: "supabase-bundle.js" });
}

runInThisContext(readFileSync(join(root, "js/media-data-bridge.js"), "utf8"), {
  filename: "media-data-bridge.js",
});

const mediaApi = globalThis.CEMedia || globalThis.CEDataLayer?.media;
ok("CEMedia exposed on window", !!mediaApi);

if (mediaApi) {
  // Test methods on CEMedia
  const methodsToTest = [
    "getMediaTeamMembers",
    "saveMediaTeamMember",
    "deleteMediaTeamMember",
    "getMediaRoles",
    "saveMediaRole",
    "deleteMediaRole",
    "getMediaServices",
    "saveMediaService",
    "deleteMediaService",
    "getMediaSchedules",
    "saveMediaSchedule",
    "deleteMediaSchedule",
    "getMediaChannels",
    "saveMediaChannel",
    "deleteMediaChannel",
    "getMediaPerformanceReviews",
    "saveMediaPerformanceReview",
    "deleteMediaPerformanceReview",
    "getMediaAwards",
    "saveMediaAward",
    "deleteMediaAward",
    "dualWriteRecord"
  ];

  for (const method of methodsToTest) {
    ok(`CEMedia.${method} is a function`, typeof mediaApi[method] === "function");
  }

  // Pure data operations test
  const pure = mediaApi.pure();
  ok("pure.load() returns media state", !!pure.load());
  const initial = pure.load();
  ok("teamMembers is empty array by default", Array.isArray(initial.teamMembers) && initial.teamMembers.length === 0);
  ok("roles is empty array by default", Array.isArray(initial.roles) && initial.roles.length === 0);
  ok("services is empty array by default", Array.isArray(initial.services) && initial.services.length === 0);
  ok("schedules is empty array by default", Array.isArray(initial.schedules) && initial.schedules.length === 0);
  ok("channels is empty array by default", Array.isArray(initial.channels) && initial.channels.length === 0);
  ok("performanceReviews is empty array by default", Array.isArray(initial.performanceReviews) && initial.performanceReviews.length === 0);
  ok("awards is empty array by default", Array.isArray(initial.awards) && initial.awards.length === 0);

  // Test full CRUD round-trip in pure state
  const testRole = { id: "test-role-1", name: "Diretor de Mídia", category: "Direção" };
  pure.saveMediaRole(testRole);
  ok("saveMediaRole adds record", pure.getMediaRoles().some(r => r.id === "test-role-1"));
  
  pure.saveMediaRole({ ...testRole, name: "Diretor de Mídia Executivo" });
  ok("saveMediaRole updates record", pure.getMediaRoles().find(r => r.id === "test-role-1")?.name === "Diretor de Mídia Executivo");
  
  pure.deleteMediaRole("test-role-1");
  ok("deleteMediaRole removes record", !pure.getMediaRoles().some(r => r.id === "test-role-1"));
}

console.log("\n--- SMOKE TEST RESULTS ---");
for (const res of results) {
  console.log(res);
}

if (failed > 0) {
  console.error(`\nFAILED: ${failed} checks failed, ${passed} passed.`);
  process.exit(1);
} else {
  console.log(`\nSUCCESS: All ${passed} checks passed.`);
}
