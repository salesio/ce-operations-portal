import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const root=join(dirname(fileURLToPath(import.meta.url)),".."); const dir=join(root,"supabase","seeds"); let passed=0,failed=0;
const check=(label,value)=>{if(value){passed++;console.log(`PASS ${label}`);}else{failed++;console.error(`FAIL ${label}`);}};
check("seed directory exists",existsSync(dir));
const expected=["foundation_roles_settings.sql","churches_members_seed.sql","first_timers_followups_seed.sql","finance_public_giving_seed.sql","requisitions_inventory_seed.sql","staff_hr_seed.sql","foundation_school_seed.sql","programs_media_seed.sql","counseling_sacraments_seed.sql","fevo_prison_materials_seed.sql","reports_notifications_audit_seed.sql"];
const files=existsSync(dir)?readdirSync(dir).filter(x=>x.endsWith(".sql")):[]; for(const f of expected)check(`seed exists ${f}`,files.includes(f));
const assignedSecret=/(?:password|secret|token|stream[_ -]?key|private[_ -]?key|service[_ -]?role)\s*(?:=|:|=>)\s*['"]?(?!\s*(?:true|false|null|none|empty|redacted|not[_ -]?set))[^'"\s,;]{8,}/i;
const longCredential=/\b(?:sk_live_|sk_test_|eyJ[a-zA-Z0-9_-]{20,}|sbp_[a-zA-Z0-9]{20,})/;
const realPhone=/\+258\s*(?!8(?:4|6)0?\s*0{3}|8(?:4|6)\s*2?0{2})\d{8,9}/;
for(const f of files){const raw=readFileSync(join(dir,f),"utf8");check(`${f} has no assigned credential`,!assignedSecret.test(raw));check(`${f} has no credential-shaped value`,!longCredential.test(raw));
  const emails=[...raw.matchAll(/[a-z0-9._%+-]+@([a-z0-9.-]+\.[a-z]{2,}|ce\.local)/gi)].map(m=>m[0].toLowerCase()); const allowed=emails.every(e=>/@(?:example\.(?:com|invalid|test)|test|ce\.local|ce-mozambique\.org)$/.test(e)); check(`${f} emails are demo/approved seed domains`,allowed);
  check(`${f} has no likely real phone`,!realPhone.test(raw)||/\"demo\"\s*:\s*true/i.test(raw));
}
const prison=readFileSync(join(dir,"fevo_prison_materials_seed.sql"),"utf8").split(/\r?\n/).filter(l=>!l.trim().startsWith("--")&&!/no_(?:personal_or_)?criminal_data/i.test(l)).join("\n");
check("prison student rows exclude prohibited criminal/judicial fields",!/(?:crime|sentence|case[_ -]?number|cell[_ -]?number|offence|court[_ -]?case|judicial[_ -]?record)/i.test(prison));
console.log(`Seed safety: ${passed} passed, ${failed} failed.`); process.exit(failed?1:0);
