import { readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(process.cwd());
const read = (file) => readFileSync(join(root, file), "utf8");
const results = [];
let failed = 0;

function check(name, condition) {
  const ok = Boolean(condition);
  results.push(`${ok ? "PASS" : "FAIL"}  ${name}`);
  if (!ok) failed += 1;
}

const vite = read("vite.config.ts");
const entry = read("src/index.ts");
const config = read("src/data/config.ts");
const supabaseConfig = read("src/data/adapters/supabase/supabaseConfig.ts");
const churchesRepo = read("src/data/repositories/churchesRepository.ts");
const membersRepo = read("src/data/repositories/membersRepository.ts");
const churchesBridge = read("js/churches-data-bridge.js");
const membersBridge = read("js/members-data-bridge.js");
const dashboard = read("js/dashboard.js");
const index = read("index.html");
const browserJs = [churchesBridge, membersBridge, dashboard].join("\n");

check("external runtime env injection exists", /\/@ce-runtime-env\.js/.test(vite) && /window\.__CE_ENV__=Object\.assign/.test(vite));
check("runtime env includes Supabase source and public config", ["VITE_DATA_SOURCE", "VITE_ENABLE_SUPABASE", "VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"].every((key) => vite.includes(key)));
check("tracked bundle defaults secret-free", /VITE_EMBED_PUBLIC_SUPABASE_CONFIG/.test(vite) && /VITE_SUPABASE_ANON_KEY:\s*""/.test(vite));
check("config reads safe browser runtime", /window\.__CE_ENV__/.test(config) && /runtime \|\| fromEnv/.test(config));
check("Supabase config reads runtime values", /__CE_ENV__/.test(supabaseConfig) && /hasAnonKey/.test(supabaseConfig));
check("CEDataLayer getInfo exists", /root\.CEDataLayer\s*=\s*\{[\s\S]*?getInfo,/.test(entry));
check("CESupabase safe getInfo exists", /export function getInfo\(\)/.test(entry) && /hasSupabaseAnonKey/.test(entry) && /safe:\s*true/.test(entry));
check("churches route to Supabase adapter", /useSupabaseChurches/.test(churchesRepo) && /churchesSb\.createChurch/.test(churchesRepo));
check("members route to Supabase adapter", /useSupabaseMembers/.test(membersRepo) && /membersSb\.createMember/.test(membersRepo));
check("churches bridge reports runtime reason", /safeRuntimeInfo/.test(churchesBridge) && /fallbackReason/.test(churchesBridge) && /supabaseProviderLoaded/.test(churchesBridge));
check("members bridge reports runtime reason", /safeRuntimeInfo/.test(membersBridge) && /fallbackReason/.test(membersBridge) && /supabaseProviderLoaded/.test(membersBridge));
check("mock and local fallback retained", /pureFallback/.test(churchesBridge) && /source === "local"/.test(churchesBridge) && /pureFallback/.test(membersBridge));
check("Settings shows actual runtime provider", /Estado real do runtime/.test(dashboard) && /CEChurches provider/.test(dashboard) && /Last runtime provider check/.test(dashboard));
check("finance and member forms include dependent cell selects", /financeEntrySchema\(\)/.test(dashboard) && /member:\s*\[[\s\S]*?cellGroupSelect[\s\S]*?cellRegistrySelect/.test(dashboard));
check("cell selects support Supabase HQ UUID aliases", /isHqChurchReference/.test(dashboard) && /matchesSelectedCellChurch/.test(dashboard));
check("cell selects preserve national access scope", /canSelectAllCellNetworkRecords/.test(dashboard) && /cellNetworkRecordsForSelect/.test(dashboard));
check("dependent cell selects prefer relational church ids", /querySelector\("\[name='church_id'\]"\)[\s\S]*?querySelector\("\[name='igreja_id'\]"\)[\s\S]*?querySelector\("\[name='igreja'\]"\)/.test(dashboard));
check("runtime bundle cachebuster updated", /(?:20260806-runtime-provider-v8|20260819-members-runtime-fix-v[12]|20260819-auth-real-v1|20260821-[\w-]+)/.test(index));
check("no backend credential assignment in browser JS", !/(?:VITE_)?SUPABASE_SERVICE_ROLE_KEY\s*=|DATABASE_URL\s*=/.test(browserJs));
check("smoke script registered target exists", existsSync(join(root, "scripts/smoke-supabase-runtime-provider.mjs")));

results.forEach((line) => console.log(line));
console.log(`\nSupabase Runtime Provider: ${results.length - failed} passed, ${failed} failed`);
if (failed) process.exit(1);
