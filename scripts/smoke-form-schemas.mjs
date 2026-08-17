import fs from "fs";

console.log("Checking form schemas for duplicate field entries...");

const content = fs.readFileSync("js/dashboard.js", "utf-8");

// Check alecRegistration schema line
const alecRegLine = content.split('\n').find(l => l.includes("alecRegistration:"));
console.log("alecRegistration schema:", alecRegLine?.trim());

if (alecRegLine && (alecRegLine.match(/church/g) || []).length > 1) {
  throw new Error("FAIL: alecRegistration form still contains duplicate church field!");
}

const alecScoreLine = content.split('\n').find(l => l.includes("alecScore:"));
if (alecScoreLine && (alecScoreLine.match(/church/g) || []).length > 1) {
  throw new Error("FAIL: alecScore form contains duplicate church field!");
}

const cellLeaderLine = content.split('\n').find(l => l.includes("cellLeader:"));
if (cellLeaderLine && (cellLeaderLine.match(/church/g) || []).length > 1) {
  throw new Error("FAIL: cellLeader form contains duplicate church field!");
}

console.log("PASS: Duplicate form fields successfully removed from all form schemas!");
