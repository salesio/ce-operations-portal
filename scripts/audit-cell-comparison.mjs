import fs from "fs";

const SUPABASE_URL = "https://kmurqbgpybrolrrumiue.supabase.co";
const ANON_KEY = "sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli";

const seedContent = fs.readFileSync("./js/cell-seed-data.js", "utf-8");
const defsMatch = seedContent.match(/const CELL_GROUP_DEFINITIONS = (\[[\s\S]*?\]);/);
let cellGroupsSeed = [];
if (defsMatch) {
  cellGroupsSeed = eval(defsMatch[1]);
}

console.log(`Loaded ${cellGroupsSeed.length} Cell Group definitions from portal seed.\n`);

// Fetch members from PostgREST API
let allMembers = [];
let offset = 0;
const limit = 1000;

while (true) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/members?select=id,full_name,cell_name,cell_group_name,cell_id,cell_group_id,church_id,church_name`, {
    headers: {
      "apikey": ANON_KEY,
      "Authorization": `Bearer ${ANON_KEY}`,
      "Range": `${offset}-${offset + limit - 1}`
    }
  });

  if (!res.ok) {
    console.error("HTTP error fetching members:", res.status, await res.text());
    break;
  }

  const data = await res.json();
  if (!data || data.length === 0) break;
  allMembers.push(...data);
  console.log(`Fetched ${allMembers.length} members so far...`);
  if (data.length < limit) break;
  offset += limit;
}

console.log(`\n=== Total members in Supabase DB: ${allMembers.length} ===\n`);

const dbGroupCounts = {};
const dbCellCounts = {};
let emptyCellGroupMembersCount = 0;
let emptyCellNameMembersCount = 0;

allMembers.forEach(m => {
  const gName = String(m.cell_group_name || "").trim();
  const cName = String(m.cell_name || "").trim();

  if (gName) {
    dbGroupCounts[gName] = (dbGroupCounts[gName] || 0) + 1;
  } else {
    emptyCellGroupMembersCount++;
  }

  if (cName) {
    dbCellCounts[cName] = (dbCellCounts[cName] || 0) + 1;
  } else {
    emptyCellNameMembersCount++;
  }
});

console.log(`Members with populated cell_group_name: ${allMembers.length - emptyCellGroupMembersCount}`);
console.log(`Members with NULL/empty cell_group_name: ${emptyCellGroupMembersCount}`);
console.log(`Members with populated cell_name: ${allMembers.length - emptyCellNameMembersCount}`);
console.log(`Members with NULL/empty cell_name: ${emptyCellNameMembersCount}\n`);

// Compare cell groups in seed vs DB
const groupComparison = cellGroupsSeed.map(def => {
  const seedName = def.name;
  const matchingDbGroups = Object.keys(dbGroupCounts).filter(g => 
    g.toLowerCase().includes(seedName.toLowerCase()) || seedName.toLowerCase().includes(g.toLowerCase())
  );
  
  const matchingDbCells = Object.keys(dbCellCounts).filter(c =>
    c.toLowerCase().includes(seedName.toLowerCase()) || seedName.toLowerCase().includes(c.toLowerCase())
  );

  const groupMemberCount = matchingDbGroups.reduce((sum, g) => sum + (dbGroupCounts[g] || 0), 0);
  const cellMemberCount = matchingDbCells.reduce((sum, c) => sum + (dbCellCounts[c] || 0), 0);

  return {
    seedGroupName: seedName,
    expectedCellsInSeed: def.total_cells,
    matchingDbGroupsFound: matchingDbGroups,
    matchingDbCellsFound: matchingDbCells.slice(0, 5),
    groupMemberCount,
    cellMemberCount,
    totalMembersFound: groupMemberCount + cellMemberCount,
    hasMembersInDb: (groupMemberCount + cellMemberCount) > 0
  };
});

const groupsWithMembers = groupComparison.filter(g => g.hasMembersInDb);
const groupsWithZeroMembers = groupComparison.filter(g => !g.hasMembersInDb);

console.log("=================================================");
console.log(`TOTAL CELL GROUPS DEFINED IN PORTAL SEED: ${cellGroupsSeed.length}`);
console.log(`CELL GROUPS WITH MEMBERS IN SUPABASE DB:  ${groupsWithMembers.length}`);
console.log(`CELL GROUPS WITH 0 MEMBERS IN SUPABASE DB: ${groupsWithZeroMembers.length}`);
console.log("=================================================\n");

console.log("--- CELL GROUPS DEFINED IN PORTAL WITH 0 MEMBERS IN SUPABASE DB ---");
groupsWithZeroMembers.forEach((g, idx) => {
  console.log(`${idx + 1}. [EMPTY] "${g.seedGroupName}" (Expected ${g.expectedCellsInSeed} cells in seed)`);
});

console.log("\n--- CELL GROUPS DEFINED IN PORTAL WITH MEMBERS IN SUPABASE DB ---");
groupsWithMembers.forEach((g, idx) => {
  console.log(`${idx + 1}. [ACTIVE] "${g.seedGroupName}" -> ${g.totalMembersFound} members (Groups: ${g.matchingDbGroupsFound.join(", ") || "None directly on group"}, Cells: ${g.matchingDbCellsFound.join(", ")})`);
});

console.log("\n--- TOP 30 CELL NAMES IN SUPABASE DB ---");
Object.entries(dbCellCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 30)
  .forEach(([cell, count], idx) => {
    console.log(`${idx + 1}. "${cell}": ${count} members`);
  });

// Write report JSON
fs.writeFileSync("./scripts/audit-cell-results.json", JSON.stringify({
  totalDbMembers: allMembers.length,
  emptyCellGroupMembersCount,
  emptyCellNameMembersCount,
  distinctDbGroups: Object.keys(dbGroupCounts).length,
  distinctDbCells: Object.keys(dbCellCounts).length,
  dbGroupCounts,
  dbCellCounts,
  groupsWithMembers,
  groupsWithZeroMembers
}, null, 2));
