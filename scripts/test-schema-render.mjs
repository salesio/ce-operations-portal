import fs from "fs";

const content = fs.readFileSync("js/dashboard.js", "utf-8");
const line = content.split('\n').find(l => l.includes("alecRegistration: ["));

console.log("alecRegistration line in file:");
console.log(line);

// Parse fields
const fieldTuples = [...line.matchAll(/\["([^"]+)",\s*"([^"]+)"(?:,\s*"([^"]+)")?/g)].map(m => ({
  name: m[1],
  label: m[2],
  type: m[3] || "text"
}));

console.log("\nFields parsed from alecRegistration:");
console.table(fieldTuples);

const churchSelectFields = fieldTuples.filter(f => f.type === "church" || f.name === "church_id" || f.name === "igreja");
console.log(`\nChurch select fields count: ${churchSelectFields.length}`);

if (churchSelectFields.length !== 1) {
  throw new Error(`FAIL: Expected 1 church select field, found ${churchSelectFields.length}`);
}

console.log("SUCCESS: alecRegistration form schema has EXACTLY 1 church selector!");
