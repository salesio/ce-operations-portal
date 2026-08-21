import fs from 'node:fs';

console.log("=== SIMULATING CELL PORTAL LOGIC & FILTERS ===");

// Load seeds
const groups = JSON.parse(fs.readFileSync('scripts/extracted_groups.json', 'utf8'));
const cells = JSON.parse(fs.readFileSync('scripts/extracted_cells.json', 'utf8'));
const members = JSON.parse(fs.readFileSync('scripts/extracted_members.json', 'utf8'));

console.log(`Master Data: ${groups.length} groups, ${cells.length} cells, ${members.length} members.`);

// Check all group IDs and names
console.log('\n--- Groups Registry ---');
groups.forEach(g => {
  const gCells = cells.filter(c => c.group_id === g.id);
  console.log(`  📁 [${g.id}] ${g.name} (${gCells.length} cells)`);
});

// Let's test the building of allGroupMap and cellGroupsList
const allGroups = [
  ...groups,
  ...groups.map(g => ({ ...g, cell_group_id: g.id, group_name: g.name }))
];

const allGroupMap = new Map();
allGroups.forEach((g) => {
  const gid = g.id || g.group_id || g.cell_group_id;
  const gname = g.group_name || g.name || g.nome_do_grupo || g.cell_group_name;
  if (gid && gname && !allGroupMap.has(String(gid))) {
    allGroupMap.set(String(gid), { id: gid, group_name: gname });
  }
});

console.log(`\nUnique groups extracted into dropdown: ${allGroupMap.size}`);

// Now check allCells
const allCellMap = new Map();
cells.forEach((c) => {
  const cid = c.id;
  if (cid && !allCellMap.has(String(cid))) {
    allCellMap.set(String(cid), c);
  }
  const gid = c.group_id || c.cell_group_id;
  const gname = c.group_name || c.cell_group_name || c.nome_do_grupo;
  if (gid && gname && !allGroupMap.has(String(gid))) {
    allGroupMap.set(String(gid), { id: gid, group_name: gname });
  }
});

console.log(`Final unique groups in allGroupMap: ${allGroupMap.size}`);
console.log(`Final unique cells in allCellMap: ${allCellMap.size}`);

// Let's test selecting a group filter
console.log('\n--- Simulating Selecting Each Group Filter ---');
for (const g of groups) {
  const filteredCells = cells.filter(c => String(c.group_id || c.cell_group_id || '') === String(g.id));
  console.log(`Selected Group "${g.name}" -> ${filteredCells.length} matching cells`);
  if (filteredCells.length === 0) {
    console.error(`ERROR: Group ${g.name} has 0 cells!`);
  }
}
