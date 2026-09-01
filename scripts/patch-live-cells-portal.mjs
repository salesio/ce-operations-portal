import fs from "node:fs";

// 1. Patch js/cell-ministry-data-bridge.js
let bridgeCode = fs.readFileSync("js/cell-ministry-data-bridge.js", "utf8");
bridgeCode = bridgeCode.replace(/\r\n/g, "\n");

const oldResolveApi = `  function resolveApi() {
    var layer = window.CEDataLayer && window.CEDataLayer.cellMinistry;
    if (layer && typeof layer.createCellGroup === "function") {
      return { api: layer, via: "CEDataLayer.cellMinistry" };
    }
    if (window.CESupabase && typeof window.CESupabase.createCellGroup === "function") {
      return { api: window.CESupabase, via: "CESupabase" };
    }
    return { api: null, via: "none" };
  }`;

const newResolveApi = `  function resolveApi() {
    var adapter = (window.CESupabase && window.CESupabase.cellMinistrySupabaseAdapter) || window.cellMinistrySupabaseAdapter;
    if (adapter && typeof adapter.listCellGroups === "function") {
      return { api: adapter, via: "CESupabase.cellMinistrySupabaseAdapter" };
    }
    var layer = window.CEDataLayer && window.CEDataLayer.cellMinistry;
    if (layer && typeof layer.createCellGroup === "function") {
      return { api: layer, via: "CEDataLayer.cellMinistry" };
    }
    if (window.CESupabase && typeof window.CESupabase.createCellGroup === "function") {
      return { api: window.CESupabase, via: "CESupabase" };
    }
    return { api: null, via: "none" };
  }`;

if (bridgeCode.includes(oldResolveApi)) {
  bridgeCode = bridgeCode.replace(oldResolveApi, newResolveApi);
  console.log("Updated resolveApi in cell-ministry-data-bridge.js");
}

const oldSeedFns = `  function seedGroups() {
    return (window.CESupabase && window.CESupabase.CELL_GROUPS_SEED) || [];
  }
  function seedCells() {
    return (window.CESupabase && window.CESupabase.CELLS_SEED) || [];
  }`;

const newSeedFns = `  function seedGroups() {
    return (window.REAL_CELL_GROUPS) || (window.CESupabase && window.CESupabase.CELL_GROUPS_SEED) || [];
  }
  function seedCells() {
    return (window.REAL_CELLS_REGISTRY) || (window.CESupabase && window.CESupabase.CELLS_SEED) || [];
  }`;

if (bridgeCode.includes(oldSeedFns)) {
  bridgeCode = bridgeCode.replace(oldSeedFns, newSeedFns);
  console.log("Updated seedGroups & seedCells in cell-ministry-data-bridge.js");
}

fs.writeFileSync("js/cell-ministry-data-bridge.js", bridgeCode, "utf8");

// 2. Patch js/dashboard.js
let dashCode = fs.readFileSync("js/dashboard.js", "utf8");
dashCode = dashCode.replace(/\r\n/g, "\n");

// Patch canChooseCell & showCellGroupSelectors
const oldCellSelectors = `    const isSpecificSingleCellLeader = (activeUser?.auth_user_id === "47df0cce-9701-492c-90aa-b3cb205bbd4b") ||
      (activeUser?.id === "47df0cce-9701-492c-90aa-b3cb205bbd4b") ||
      ["Cell Leader", "Cell Assistant", "cell_leader", "assistant_cell_leader", "cell_assistant"].includes(activeUser?.role);

    const showCellGroupSelectors = Boolean(isGroupLeaderOrAbove && !isSpecificSingleCellLeader);
    const canChooseCell = showCellGroupSelectors && authorizedCells.length > 1;`;

const newCellSelectors = `    const isSpecificSingleCellLeader = (activeUser?.auth_user_id === "47df0cce-9701-492c-90aa-b3cb205bbd4b") ||
      (activeUser?.id === "47df0cce-9701-492c-90aa-b3cb205bbd4b") ||
      (["Cell Leader", "Cell Assistant", "cell_leader", "assistant_cell_leader", "cell_assistant"].includes(activeUser?.role) && authorizedCells.length <= 1);

    const showCellGroupSelectors = Boolean(isGroupLeaderOrAbove && !isSpecificSingleCellLeader);
    const canChooseCell = authorizedCells.length > 1;`;

if (dashCode.includes(oldCellSelectors)) {
  dashCode = dashCode.replace(oldCellSelectors, newCellSelectors);
  console.log("Updated canChooseCell in dashboard.js");
} else {
  console.warn("oldCellSelectors not found!");
}

// Patch continueEnterDashboard to reset cell portal filters on login
const oldContinueEnter = `  const isCellPortalMember = isCellLeaderOrAssistant(activeUser);
  if (isCellPortalMember) {
    history.replaceState(null, "", "#cellPortal");
    setRoute("cellPortal");
  } else if (isPastoralCareRector(activeUser)) {`;

const newContinueEnter = `  const isCellPortalMember = isCellLeaderOrAssistant(activeUser);
  if (isCellPortalMember) {
    cellPortalPageState.cellId = activeUser.cell_id || (activeUser.assigned_cells && activeUser.assigned_cells[0]) || "";
    cellPortalPageState.cellGroupId = activeUser.cell_group_id || (activeUser.assigned_cell_groups && activeUser.assigned_cell_groups[0]) || "";
    cellPortalPageState.search = "";
    cellPortalPageState.reconciliationStatus = "";
    history.replaceState(null, "", "#cellPortal");
    setRoute("cellPortal");
  } else {
    if (["Super Admin", "Main Pastor", "National Admin", "Administrator", "Admin"].includes(activeUser.role)) {
      cellPortalPageState.cellId = "";
      cellPortalPageState.cellGroupId = "";
    }
  }
  if (isPastoralCareRector(activeUser)) {`;

if (dashCode.includes(oldContinueEnter)) {
  dashCode = dashCode.replace(oldContinueEnter, newContinueEnter);
  console.log("Updated continueEnterDashboard in dashboard.js");
} else {
  console.warn("oldContinueEnter not found!");
}

fs.writeFileSync("js/dashboard.js", dashCode, "utf8");
console.log("All patches applied successfully!");
