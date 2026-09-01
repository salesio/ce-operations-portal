import fs from "node:fs";

let code = fs.readFileSync("js/dashboard.js", "utf8");

const regex = /const hasNationalPastoralScope = \[[\s\S]*?if \(hasNationalPastoralScope && \["dashboard", "firstTimers", "followUp"\]\.includes\(module\)\) \{[\s\S]*?return list;[\s\S]*?\}/;

const match = code.match(regex);
console.log("Match found:", !!match);
if (match) {
  const replacement = `const hasNationalPastoralScope = [
    "reitor",
    "rector",
    "pastoral reitor",
    "pastoral rector",
    "pastoral care rector",
    "reitor de cuidados pastorais",
    "follow up coordinator",
    "acompanhamento",
    "responsavel de acompanhamento",
  ].includes(pastoralRole) || (typeof isPastoralCareRector === "function" && isPastoralCareRector(activeUser));
  if (hasNationalPastoralScope && ["dashboard", "firstTimers", "followUp", "foundation", "sacraments", "counseling"].includes(module)) {
    return list;
  }`;
  code = code.replace(regex, replacement);
  fs.writeFileSync("js/dashboard.js", code, "utf8");
  console.log("Replaced with regex successfully!");
}
