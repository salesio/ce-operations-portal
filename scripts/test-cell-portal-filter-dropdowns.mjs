import fs from 'node:fs';

console.log("=== COMPREHENSIVE CELL PORTAL FILTER & DROPDOWN TEST ===");

// 1. Load JS files in simulated environment
const cellSeedCode = fs.readFileSync('js/cell-seed-data.js', 'utf8');

// Set up mock window and global environment
globalThis.window = globalThis;
globalThis.document = {
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => []
};

// Execute cell-seed-data.js
eval(cellSeedCode);

console.log(`✓ Loaded REAL_CELL_GROUPS: ${window.REAL_CELL_GROUPS.length} groups.`);
console.log(`✓ Loaded REAL_CELLS_REGISTRY: ${window.REAL_CELLS_REGISTRY.length} cells.`);

// Mock state
const state = {
  users: [{
    id: "u1111111-0000-0000-0000-000000000001",
    name: "Salésio Machava",
    role: "Super Admin",
    church_id: "a1111111-1111-4111-8111-111111111101",
    permissions: ["cell_portal.view", "cell_portal.view_members", "cell_portal.export_summary"]
  }],
  cellGroups: [...window.REAL_CELL_GROUPS],
  cellRegistry: [...window.REAL_CELLS_REGISTRY],
  members: []
};

const activeUser = state.users[0];
const cellPortalPageState = {
  cellGroupId: "",
  cellId: "",
  reconciliationStatus: "",
  period: "month",
  dateFrom: "",
  dateTo: "",
  memberStatus: "",
  foundationStatus: "",
  sacramentStatus: "",
  partnership: "",
  tithe: "",
  invited: ""
};

function getAuthorizedCellsForUser(userId) {
  const rawCells = [
    ...(window.REAL_CELLS_REGISTRY || []),
    ...(state.cellRegistry || []),
    ...(state.cells || [])
  ];
  const byId = new Map();
  rawCells.forEach((c) => {
    if (c && c.id && !byId.has(String(c.id))) byId.set(String(c.id), c);
  });
  return Array.from(byId.values());
}

function getDropdownCatalogs() {
  const allGroups = [
    ...(window.REAL_CELL_GROUPS || []),
    ...(state.cellGroups || []),
    ...(state.cellMinistry?.groups || [])
  ];
  const allGroupMap = new Map();
  allGroups.forEach((g) => {
    const gid = g.id || g.group_id || g.cell_group_id;
    const gname = g.group_name || g.name || g.nome_do_grupo || g.cell_group_name;
    if (gid && gname && !allGroupMap.has(String(gid))) {
      allGroupMap.set(String(gid), { id: gid, group_name: gname });
    }
  });

  const allCells = [
    ...(window.REAL_CELLS_REGISTRY || []),
    ...(state.cellRegistry || []),
    ...(state.cells || [])
  ];
  const allCellMap = new Map();
  allCells.forEach((c) => {
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

  const cellGroupsList = Array.from(allGroupMap.values());
  const uniqueAllCells = Array.from(allCellMap.values());
  const cellRegistryList = uniqueAllCells.filter((c) => {
    if (!cellPortalPageState.cellGroupId) return true;
    return String(c.group_id || c.cell_group_id || "") === String(cellPortalPageState.cellGroupId);
  });

  return { cellGroupsList, cellRegistryList };
}

// 1. Initial State Check
console.log("\n--- STEP 1: INITIAL STATE (No filter applied) ---");
let { cellGroupsList, cellRegistryList } = getDropdownCatalogs();
console.log(`Groups dropdown count: ${cellGroupsList.length} (Expected: 17)`);
console.log(`Cells dropdown count: ${cellRegistryList.length} (Expected: 176)`);
if (cellGroupsList.length !== 17) throw new Error("Initial groups dropdown count mismatch!");
if (cellRegistryList.length !== 176) throw new Error("Initial cells dropdown count mismatch!");

// 2. Select Vanguard Filter
console.log("\n--- STEP 2: SELECT GROUP 'Vanguard' ---");
const vanguardGroup = window.REAL_CELL_GROUPS.find(g => g.name === "Vanguard");
cellPortalPageState.cellGroupId = vanguardGroup.id;

({ cellGroupsList, cellRegistryList } = getDropdownCatalogs());
console.log(`Groups dropdown count: ${cellGroupsList.length} (Expected: 17)`);
console.log(`Cells dropdown count: ${cellRegistryList.length} (Expected: 16 Vanguard cells)`);
if (cellGroupsList.length !== 17) throw new Error("Groups dropdown reduced when selecting Vanguard!");
if (cellRegistryList.length !== 16) throw new Error("Cells dropdown count mismatch for Vanguard!");

// 3. Select Royal Sister Filter
console.log("\n--- STEP 3: SELECT GROUP 'Royal Sister' ---");
const royalSisterGroup = window.REAL_CELL_GROUPS.find(g => g.name === "Royal Sister");
cellPortalPageState.cellGroupId = royalSisterGroup.id;

({ cellGroupsList, cellRegistryList } = getDropdownCatalogs());
console.log(`Groups dropdown count: ${cellGroupsList.length} (Expected: 17)`);
console.log(`Cells dropdown count: ${cellRegistryList.length} (Expected: 25 Royal Sister cells)`);
if (cellGroupsList.length !== 17) throw new Error("Groups dropdown reduced when selecting Royal Sister!");
if (cellRegistryList.length !== 25) throw new Error("Cells dropdown count mismatch for Royal Sister!");

// 4. Select Pioneiro Filter
console.log("\n--- STEP 4: SELECT GROUP 'Pioneiro' ---");
const pioneiroGroup = window.REAL_CELL_GROUPS.find(g => g.name === "Pioneiro");
cellPortalPageState.cellGroupId = pioneiroGroup.id;

({ cellGroupsList, cellRegistryList } = getDropdownCatalogs());
console.log(`Groups dropdown count: ${cellGroupsList.length} (Expected: 17)`);
console.log(`Cells dropdown count: ${cellRegistryList.length} (Expected: 15 Pioneiro cells)`);
if (cellGroupsList.length !== 17) throw new Error("Groups dropdown reduced when selecting Pioneiro!");
if (cellRegistryList.length !== 15) throw new Error("Cells dropdown count mismatch for Pioneiro!");

// 5. Reset Filter to All Groups ("")
console.log("\n--- STEP 5: RESET GROUP FILTER TO ALL (Empty String) ---");
cellPortalPageState.cellGroupId = "";

({ cellGroupsList, cellRegistryList } = getDropdownCatalogs());
console.log(`Groups dropdown count: ${cellGroupsList.length} (Expected: 17)`);
console.log(`Cells dropdown count: ${cellRegistryList.length} (Expected: 176)`);
if (cellGroupsList.length !== 17) throw new Error("Groups dropdown reduced after reset!");
if (cellRegistryList.length !== 176) throw new Error("Cells dropdown not restored to 176 after reset!");

console.log("\n✅ ALL 5 FILTER TRANSITIONS PASSED FLAWLESSLY! NO GROUPS DISAPPEARED!");
