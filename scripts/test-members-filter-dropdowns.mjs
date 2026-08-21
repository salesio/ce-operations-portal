import fs from 'node:fs';

console.log("=== COMPREHENSIVE MEMBERS FILTER DROPDOWN TEST ===");

const cellSeedCode = fs.readFileSync('js/cell-seed-data.js', 'utf8');

globalThis.window = globalThis;
globalThis.__CE_ENV__ = { VITE_DATA_SOURCE: "supabase" };

eval(cellSeedCode);

console.log(`✓ Loaded REAL_CELL_GROUPS: ${window.REAL_CELL_GROUPS.length}`);
console.log(`✓ Loaded REAL_CELLS_REGISTRY: ${window.REAL_CELLS_REGISTRY.length}`);

// Mock state
const state = {
  cellGroups: [...window.REAL_CELL_GROUPS],
  cellRegistry: [...window.REAL_CELLS_REGISTRY],
  members: []
};

// Extracted functions under test
function normalizedMemberFilterText(value) {
  return String(value || "").toLowerCase().trim();
}

function memberCellGroupLabel(record = {}) {
  return record.cell_group_name || record.grupo_de_celula || record.group_name || "";
}

function memberCellLabel(record = {}) {
  return record.cell_name || record.celula || record.name || "";
}

function memberCellGroupFilterValue(record = {}) {
  const id = record.cell_group_id || record.group_id;
  if (id) return `id:${id}`;
  const label = memberCellGroupLabel(record);
  return label ? `name:${normalizedMemberFilterText(label)}` : "";
}

function memberCellFilterValue(record = {}) {
  const id = record.cell_id;
  if (id) return `id:${id}`;
  const label = memberCellLabel(record);
  return label ? `name:${normalizedMemberFilterText(label)}` : "";
}

function isRecordInSelectedCellGroup(record = {}, selectedGroup = "") {
  if (!selectedGroup) return true;
  const filterVal = memberCellGroupFilterValue(record);
  if (filterVal === selectedGroup) return true;
  const allGroups = [
    ...(window.REAL_CELL_GROUPS || []),
    ...(state.cellGroups || []),
    ...(state.cellMinistry?.groups || [])
  ];
  if (selectedGroup.startsWith("id:")) {
    const groupId = selectedGroup.slice(3);
    const recGroupId = String(record.cell_group_id || record.group_id || "");
    if (recGroupId === groupId) return true;
    const groupObj = allGroups.find((g) => String(g.id || g.group_id) === groupId);
    const groupName = groupObj?.group_name || groupObj?.name;
    if (groupName && normalizedMemberFilterText(memberCellGroupLabel(record)).includes(normalizedMemberFilterText(groupName))) return true;
  } else if (selectedGroup.startsWith("name:")) {
    const groupName = selectedGroup.slice(5);
    const recGroupName = normalizedMemberFilterText(memberCellGroupLabel(record));
    if (recGroupName.includes(groupName) || groupName.includes(recGroupName)) return true;
  }
  return false;
}

function memberFilterOptions(list, type, selectedGroup = "") {
  const options = new Map();
  const seenLabels = new Set();
  const add = (value, label) => {
    if (!value || !label) return;
    const normLabel = normalizedMemberFilterText(label);
    if (!options.has(value) && !seenLabels.has(normLabel)) {
      options.set(value, label);
      seenLabels.add(normLabel);
    }
  };
  const allGroups = [
    ...(window.REAL_CELL_GROUPS || []),
    ...(state.cellGroups || []),
    ...(state.cellMinistry?.groups || [])
  ];
  const allCells = [
    ...(window.REAL_CELLS_REGISTRY || []),
    ...(state.cellRegistry || []),
    ...(state.cells || [])
  ];

  if (type === "cellGroup") {
    allGroups.forEach((group) => {
      const gid = group.id || group.group_id;
      const gname = group.group_name || group.name;
      if (gid && gname) add(`id:${gid}`, gname);
    });
    (list || []).forEach((member) => add(memberCellGroupFilterValue(member), memberCellGroupLabel(member)));
  } else {
    const inSelectedGroup = (record) => isRecordInSelectedCellGroup(record, selectedGroup);
    allCells.filter(inSelectedGroup).forEach((cell) => {
      const cid = cell.id;
      const cname = cell.cell_name || cell.name;
      if (cid && cname) add(`id:${cid}`, cname);
    });
    (list || []).filter(inSelectedGroup).forEach((member) => add(memberCellFilterValue(member), memberCellLabel(member)));
  }
  return [...options.entries()].sort(([, a], [, b]) => String(a).localeCompare(String(b), "pt"));
}

// 1. Initial State (List has 50 items from various groups)
console.log("\n--- TEST 1: Initial Members Page (list with 50 members) ---");
const mockList50 = Array.from({ length: 50 }, (_, i) => ({
  id: `m-${i}`,
  full_name: `Member ${i}`,
  cell_group_name: "Blossom",
  cell_group_id: "334021cb-7658-4e26-8239-1a4f5c80409d",
  cell_name: "Blossom Perfection C3",
  cell_id: "65cfb1cb-d102-429d-8867-47854e87a27c"
}));

let groupOpts = memberFilterOptions(mockList50, "cellGroup");
let cellOpts = memberFilterOptions(mockList50, "cell");

console.log(`Groups dropdown options count: ${groupOpts.length} (Expected: 17)`);
console.log(`Cells dropdown options count: ${cellOpts.length} (Expected: 176)`);
if (groupOpts.length !== 17) throw new Error("Expected 17 groups, got " + groupOpts.length);
if (cellOpts.length !== 176) throw new Error("Expected 176 cells, got " + cellOpts.length);

// 2. Filter applied: Blossom selected -> server returned only 3 Blossom members
console.log("\n--- TEST 2: Filter Blossom selected (list with 3 Blossom members) ---");
const mockList3Blossom = [
  { id: "m1", full_name: "Isalina", cell_group_id: "334021cb-7658-4e26-8239-1a4f5c80409d", cell_group_name: "Blossom", cell_id: "65cfb1cb-d102-429d-8867-47854e87a27c", cell_name: "Blossom Perfection C3" },
  { id: "m2", full_name: "Marilia", cell_group_id: "334021cb-7658-4e26-8239-1a4f5c80409d", cell_group_name: "Blossom", cell_id: "65cfb1cb-d102-429d-8867-47854e87a27c", cell_name: "Blossom Perfection C3" },
  { id: "m3", full_name: "Osvaldo", cell_group_id: "334021cb-7658-4e26-8239-1a4f5c80409d", cell_group_name: "Blossom", cell_id: "65cfb1cb-d102-429d-8867-47854e87a27c", cell_name: "Blossom Perfection C3" },
];

groupOpts = memberFilterOptions(mockList3Blossom, "cellGroup");
cellOpts = memberFilterOptions(mockList3Blossom, "cell", "id:334021cb-7658-4e26-8239-1a4f5c80409d");

console.log(`Groups dropdown options count: ${groupOpts.length} (Expected: 17 - MUST NOT COLLAPSE TO 1 OR 2)`);
console.log(`Blossom Cells dropdown count: ${cellOpts.length} (Expected: 7 Blossom cells)`);
if (groupOpts.length !== 17) throw new Error("Groups collapsed after filtering to Blossom! Got: " + groupOpts.length);
if (cellOpts.length !== 7) throw new Error("Expected 7 Blossom cells, got " + cellOpts.length);

// 3. Change selection from Blossom to Vanguard
console.log("\n--- TEST 3: Switch selection from Blossom to Vanguard ---");
const vanguardGroup = window.REAL_CELL_GROUPS.find(g => g.name === "Vanguard");
groupOpts = memberFilterOptions(mockList3Blossom, "cellGroup");
cellOpts = memberFilterOptions([], "cell", `id:${vanguardGroup.id}`);

console.log(`Groups dropdown options count: ${groupOpts.length} (Expected: 17)`);
console.log(`Vanguard Cells dropdown count: ${cellOpts.length} (Expected: 16 Vanguard cells)`);
if (groupOpts.length !== 17) throw new Error("Groups collapsed! Got: " + groupOpts.length);
if (cellOpts.length !== 16) throw new Error("Expected 16 Vanguard cells, got " + cellOpts.length);

console.log("\n✅ ALL TESTS PASSED! Dropdowns ALWAYS show all 17 groups and correct cells!");
