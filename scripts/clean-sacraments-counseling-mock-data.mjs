import fs from "node:fs";

const DASHBOARD_PATH = "js/dashboard.js";
let code = fs.readFileSync(DASHBOARD_PATH, "utf8");

// 1. Clean seedData.counseling
code = code.replace(
  /counseling:\s*\{[\s\S]*?requests:\s*\[\],[\s\S]*?counselors:\s*\[[\s\S]*?\],[\s\S]*?appointments:\s*\[\],[\s\S]*?referrals:\s*\[\],[\s\S]*?feedback:\s*\[\],[\s\S]*?timeline:\s*\[\]\s*\}/m,
  `counseling: {
    requests: [],
    counselors: [],
    appointments: [],
    referrals: [],
    feedback: [],
    timeline: []
  }`
);

// 2. Clean seedData.sacraments
code = code.replace(
  /sacraments:\s*\{[\s\S]*?baptisms:\s*\[[\s\S]*?\],[\s\S]*?marriages:\s*\[[\s\S]*?\],[\s\S]*?babies:\s*\[[\s\S]*?\]\s*\}/m,
  `sacraments: {
    baptisms: [],
    marriages: [],
    babies: []
  }`
);

// 3. Update normalizeState legacy mock purge rule
const oldMockIdRegex = `const isLegacyMockId = (id) => /^m-[123]$|^ft-[123]$|^fu-[123456]$|^fs-[123]$|^cr-[123]$|^ca-[12]$|^fin-[12345678]$|^disb-req-[489]$|^req-[123456789]$/.test(String(id || ""));`;
const newMockIdRegex = `const isLegacyMockId = (id) => /^m-[123]$|^ft-[123]$|^fu-[123456]$|^fs-[123]$|^cr-[123]$|^ca-[12]$|^fin-[12345678]$|^disb-req-[489]$|^req-[123456789]$|^bap-[0-9]+|^mar-[0-9]+|^baby-[0-9]+|^coun-[0-9]+|^counselor-[0-9]+|^apt-[0-9]+|^ref-[0-9]+|^fb-[0-9]+/i.test(String(id || ""));`;

if (code.includes(oldMockIdRegex)) {
  code = code.replace(oldMockIdRegex, newMockIdRegex);
}

// 4. In normalizeState, ensure sacraments and counseling collections are purged of any legacy mock records
const oldCounselingMerge = `  merged.counseling = Array.isArray(saved.counseling)
    ? structuredClone(seedData.counseling)
    : {
      ...structuredClone(seedData.counseling),
      ...(saved.counseling || {})
    };`;

const newCounselingMerge = `  const rawCounseling = typeof saved.counseling === "object" && saved.counseling !== null && !Array.isArray(saved.counseling) ? saved.counseling : {};
  merged.counseling = {
    requests: (rawCounseling.requests || []).filter((r) => !isLegacyMockId(r?.id)),
    counselors: (rawCounseling.counselors || []).filter((c) => !isLegacyMockId(c?.id)),
    appointments: (rawCounseling.appointments || []).filter((a) => !isLegacyMockId(a?.id)),
    referrals: (rawCounseling.referrals || []).filter((r) => !isLegacyMockId(r?.id)),
    feedback: (rawCounseling.feedback || []).filter((f) => !isLegacyMockId(f?.id)),
    timeline: (rawCounseling.timeline || []).filter((t) => !isLegacyMockId(t?.id))
  };

  const rawSacraments = typeof saved.sacraments === "object" && saved.sacraments !== null && !Array.isArray(saved.sacraments) ? saved.sacraments : {};
  merged.sacraments = {
    baptisms: (rawSacraments.baptisms || []).filter((b) => !isLegacyMockId(b?.id)),
    marriages: (rawSacraments.marriages || []).filter((m) => !isLegacyMockId(m?.id)),
    babies: (rawSacraments.babies || []).filter((b) => !isLegacyMockId(b?.id)),
    certificates: (rawSacraments.certificates || []).filter((c) => !isLegacyMockId(c?.id)),
    documents: (rawSacraments.documents || []).filter((d) => !isLegacyMockId(d?.id)),
    appointments: (rawSacraments.appointments || []).filter((a) => !isLegacyMockId(a?.id))
  };`;

if (code.includes(oldCounselingMerge)) {
  code = code.replace(oldCounselingMerge, newCounselingMerge);
}

// 5. In sacramentPanel, ensure clean EmptyState rendering when table has 0 records
const oldSacramentPanel = `function sacramentPanel(type, title, records, keys) {
  return \`
    <article id="panel-\${type}" class="panel h-100">
      <div class="panel-head">
        <h3 class="panel-title">\${title}</h3>
        <button class="btn btn-sm btn-ce-gold" data-open-form="\${type}">\${L("add")}</button>
      </div>
      \${dataTable([...keys.map((key) => labelFor(key)), L("actions")], records.map((record) => [
        ...keys.map((key) => key === "estado" ? badge(record[key]) : record[key]),
        actionButtons([
          ["view", type, record.id, L("view")],
          ["edit", type, record.id, L("edit")],
          ["status", type, record.id, L("updateStatus")],
          ["delete", type, record.id, L("delete")]
        ])
      ]))}
    </article>
  \`;
}`;

const newSacramentPanel = `function sacramentPanel(type, title, records, keys) {
  const safeRecords = Array.isArray(records) ? records : [];
  return \`
    <article id="panel-\${type}" class="panel h-100">
      <div class="panel-head">
        <h3 class="panel-title">\${title}</h3>
        <button class="btn btn-sm btn-ce-gold" data-open-form="\${type}">\${L("add")}</button>
      </div>
      \${safeRecords.length ? dataTable([...keys.map((key) => labelFor(key)), L("actions")], safeRecords.map((record) => [
        ...keys.map((key) => key === "estado" ? badge(record[key]) : (record[key] ?? "—")),
        actionButtons([
          ["view", type, record.id, L("view")],
          ["edit", type, record.id, L("edit")],
          ["status", type, record.id, L("updateStatus")],
          ["delete", type, record.id, L("delete")]
        ])
      ])) : EmptyState({ title: \`Nenhum registo de \${title.toLowerCase()}\`, description: \`Clique em "\${L("add")}" para registar novos dados.\`, icon: type === "baptism" ? "bi-droplet" : type === "marriage" ? "bi-heart" : "bi-emoji-smile" })}
    </article>
  \`;
}`;

if (code.includes(oldSacramentPanel)) {
  code = code.replace(oldSacramentPanel, newSacramentPanel);
}

fs.writeFileSync(DASHBOARD_PATH, code, "utf8");
console.log("Successfully purged mock data from Sacraments and Counseling in js/dashboard.js!");
