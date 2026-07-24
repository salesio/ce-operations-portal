/**
 * Backend Phase 1 foundation smoke.
 * Verifies files, env example, docs, and safe provider getInfo() after build.
 * Does not require Supabase cloud or Postgres connection.
 *
 * Run: npm run test:backend-foundation
 * (or: node scripts/check-backend-foundation.mjs after npm run build)
 */
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

// --- File tree ---
const requiredPaths = [
  "database/schema.sql",
  "database/seed.sql",
  "database/rls.sql",
  "database/storage.sql",
  "database/README.md",
  "supabase/README.md",
  "supabase/config.example.toml",
  "supabase/migrations/20260724_backend_phase1_foundation.sql",
  "supabase/seeds/foundation_roles_settings.sql",
  "src/data/adapters/supabase/supabaseClient.ts",
  "src/data/adapters/supabase/supabaseConfig.ts",
  "src/data/adapters/supabase/supabaseTypes.ts",
  "src/data/adapters/supabase/supabaseRepositoryBase.ts",
  "src/data/adapters/supabase/README.md",
  "src/data/adapters/api/apiClient.ts",
  "src/data/adapters/api/apiConfig.ts",
  "src/data/adapters/api/apiRepositoryBase.ts",
  "src/data/adapters/api/README.md",
  "src/data/adapters/supabaseProvider.ts",
  "src/data/adapters/apiProvider.ts",
  "docs/backend/BACKEND_ARCHITECTURE_PLAN.md",
  "docs/backend/SUPABASE_SETUP_PLAN.md",
  "docs/backend/AUTH_RBAC_PLAN.md",
  "docs/backend/STORAGE_PLAN.md",
  "docs/backend/RLS_SECURITY_PLAN.md",
  "docs/backend/MIGRATION_ROADMAP.md",
  ".env.example",
];

for (const p of requiredPaths) {
  ok(`exists ${p}`, existsSync(join(root, p)));
}

// --- .env.example vars ---
const envEx = read(".env.example");
const envKeys = [
  "VITE_DATA_SOURCE",
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_ANON_KEY",
  "VITE_API_BASE_URL",
  "VITE_APP_ENV",
  "VITE_ENABLE_SUPABASE",
  "VITE_ENABLE_REAL_AUTH",
  "VITE_ENABLE_STORAGE",
  "VITE_ENABLE_RLS",
  "DATABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
];
for (const k of envKeys) {
  ok(`.env.example has ${k}`, envEx.includes(k));
}
ok(
  ".env.example marks service role backend-only",
  /BACKEND-ONLY|backend-only|DO NOT|Never/i.test(envEx) &&
    /SUPABASE_SERVICE_ROLE_KEY/.test(envEx),
);
ok(
  ".env.example does not assign real service secret",
  !/SUPABASE_SERVICE_ROLE_KEY=\s*eyJ/.test(envEx),
);

// --- Source safety ---
const sbClient = read("src/data/adapters/supabase/supabaseClient.ts");
ok("supabase foundation never uses service role", !/SERVICE_ROLE/i.test(sbClient) || /NEVER|never|not use/i.test(sbClient));
ok("supabase client uses anon", /ANON_KEY|anonKey/i.test(sbClient));

const sbProvider = read("src/data/adapters/supabaseProvider.ts");
ok("supabaseProvider has getInfo", /getInfo/.test(sbProvider));
ok("supabaseProvider has generic helpers", /supabaseList|list:/.test(sbProvider));

const apiProvider = read("src/data/adapters/apiProvider.ts");
ok("apiProvider has getInfo", /getInfo/.test(apiProvider));
ok("apiProvider has apiClient", /apiClient|client:/.test(apiProvider));

const apiClient = read("src/data/adapters/api/apiClient.ts");
ok("apiClient has get/post/put/patch/delete", /get:|post:|put:|patch:|delete:/.test(apiClient));
ok("apiClient NOT_CONFIGURED when empty", /NOT_CONFIGURED/.test(apiClient));

// --- Runtime: load bundle ---
const bundlePath = join(root, "js/supabase-bundle.js");
ok("js/supabase-bundle.js exists (run npm run build if missing)", existsSync(bundlePath));

if (existsSync(bundlePath)) {
  const store = new Map();
  globalThis.window = globalThis;
  globalThis.document = {
    readyState: "complete",
    addEventListener() {},
    querySelector() {
      return null;
    },
  };
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
    key: (i) => [...store.keys()][i] ?? null,
    get length() {
      return store.size;
    },
  };
  globalThis.__CE_ENV__ = {
    VITE_DATA_SOURCE: "mock",
    VITE_ENABLE_SUPABASE: "false",
    VITE_SUPABASE_URL: "",
    VITE_SUPABASE_ANON_KEY: "",
    VITE_API_BASE_URL: "",
  };

  try {
    const code = readFileSync(bundlePath, "utf8");
    runInThisContext(code, { filename: "supabase-bundle.js" });
    const CE = globalThis.CESupabase;
    ok("CESupabase global exists", !!CE);

    if (CE) {
      ok("createSupabaseProvider exported", typeof CE.createSupabaseProvider === "function");
      ok("createApiProvider exported", typeof CE.createApiProvider === "function");

      if (typeof CE.createSupabaseProvider === "function") {
        const sp = CE.createSupabaseProvider();
        ok("supabase provider name", sp?.name === "supabase");
        ok("supabase isReady false without env", sp?.isReady?.() === false);
        const info =
          typeof sp.getInfo === "function"
            ? sp.getInfo()
            : typeof CE.getSupabaseProviderInfo === "function"
              ? CE.getSupabaseProviderInfo()
              : null;
        ok("supabase getInfo works", !!info && typeof info.message === "string", info?.status || "");
        ok(
          "supabase getInfo reports disabled or missing without enable",
          info && (info.status === "disabled" || info.status === "missing_env"),
        );
        ok("supabase usingServiceRole is false", info?.usingServiceRole === false);
      }

      if (typeof CE.createApiProvider === "function") {
        const ap = CE.createApiProvider();
        ok("api provider name", ap?.name === "api");
        ok("api isReady false", ap?.isReady?.() === false);
        const ainfo =
          typeof ap.getInfo === "function"
            ? ap.getInfo()
            : typeof CE.getApiProviderInfo === "function"
              ? CE.getApiProviderInfo()
              : null;
        ok("api getInfo works", !!ainfo && typeof ainfo.message === "string", ainfo?.status || "");
        ok("api not using DATABASE_URL in browser", ainfo?.usingDatabaseUrlInBrowser === false);
      }

      // Default data source still mock/local-safe
      if (typeof CE.getDataSource === "function") {
        ok("getDataSource is mock", CE.getDataSource() === "mock");
      }
      if (typeof CE.getDataProvider === "function") {
        const dp = CE.getDataProvider();
        ok("default provider is mock", dp?.name === "mock");
      }
    }
  } catch (e) {
    ok("bundle loads without throw", false, e instanceof Error ? e.message : String(e));
  }
}

// --- Docs mention foundation ---
ok(
  "DATA_LAYER_PLAN mentions Backend Phase 1",
  /Backend Phase 1/i.test(read("DATA_LAYER_PLAN.md")),
);
ok("README mentions Backend/Supabase Foundation", /Backend\/Supabase Foundation|Backend Phase 1/i.test(read("README.md")));

console.log(results.join("\n"));
console.log("");
console.log(`Backend foundation: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
