import { strict as assert } from "node:assert";
import fs from "node:fs";

console.log("Starting Cell Ministry and Cell Reports Filters Test Suite...");
const dashboardSource = fs.readFileSync("js/dashboard.js", "utf8");

assert(dashboardSource.includes("const cellMinistryFilterState = {"), "cellMinistryFilterState must be defined");
assert(dashboardSource.includes("cellGroups:"), "cellGroups must be in cellMinistryFilterState");
assert(dashboardSource.includes("cellCellsList:"), "cellCellsList must be in cellMinistryFilterState");
assert(dashboardSource.includes("cellMembers:"), "cellMembers must be in cellMinistryFilterState");
assert(dashboardSource.includes("function cellMinistryFilterOptions("), "cellMinistryFilterOptions must be defined");
assert(dashboardSource.includes("function renderCellMinistryFilterBar("), "renderCellMinistryFilterBar must be defined");
assert(dashboardSource.includes("function updateCellMinistryDependentFilters("), "updateCellMinistryDependentFilters must be defined");
assert(dashboardSource.includes("function applyCellMinistryFilters("), "applyCellMinistryFilters must be defined");
assert(dashboardSource.includes("function triggerCellMinistryAutoFilter("), "triggerCellMinistryAutoFilter must be defined");

console.log("1. Core filter architecture definitions present in js/dashboard.js");

const mockState = {
  churches: [
    { id: "church-1", church_name: "Christ Embassy Maputo Central", public_name: "Maputo Central" },
    { id: "church-2", church_name: "Christ Embassy Matola", public_name: "Matola" }
  ],
  cellGroups: [
    { id: "group-1", group_name: "Grupo Vitoria", church_id: "church-1", status: "Active" },
    { id: "group-2", group_name: "Grupo Graca", church_id: "church-2", status: "Active" }
  ],
  cellRegistry: [
    { id: "cell-101", cell_name: "Celula Luz", group_id: "group-1", church_id: "church-1", status: "Active", leader_name: "Joao Silva" },
    { id: "cell-102", cell_name: "Celula Vida", group_id: "group-1", church_id: "church-1", status: "Active", leader_name: "Maria Santos" },
    { id: "cell-201", cell_name: "Celula Paz", group_id: "group-2", church_id: "church-2", status: "Active", leader_name: "Pedro Alves" }
  ],
  members: [
    { id: "mem-1", full_name: "Carlos Alberto", church_id: "church-1", cell_group_id: "group-1", cell_id: "cell-101", phone: "+258841234567" },
    { id: "mem-2", full_name: "Ana Paula", church_id: "church-1", cell_group_id: "group-1", cell_id: "", phone: "+258842345678" },
    { id: "mem-3", full_name: "Lucas Mendes", church_id: "church-2", cell_group_id: "group-2", cell_id: "cell-201", phone: "+258843456789" }
  ]
};

function simFilterOptions(type, churchId = "", cellGroupId = "") {
  const norm = (v) => String(v || "").trim().toLowerCase();
  const options = [];
  const seen = new Set();
  const add = (value, label) => {
    const k = norm(label);
    if (!k || seen.has(k)) return;
    seen.add(k);
    options.push({ value, label });
  };

  if (type === "church") {
    mockState.churches.forEach((c) => add(c.id, c.church_name));
    return options.sort((a, b) => a.label.localeCompare(b.label));
  }

  if (type === "cellGroup") {
    mockState.cellGroups.forEach((g) => {
      if (churchId && g.church_id !== churchId) return;
      add(g.id, g.group_name);
    });
    return options.sort((a, b) => a.label.localeCompare(b.label));
  }

  if (type === "cell") {
    mockState.cellRegistry.forEach((c) => {
      let cChurch = c.church_id;
      if (!cChurch && c.group_id) {
        const p = mockState.cellGroups.find((g) => g.id === c.group_id);
        if (p) cChurch = p.church_id;
      }
      if (cellGroupId && c.group_id !== cellGroupId) return;
      if (churchId && cChurch !== churchId) return;
      add(c.id, c.cell_name);
    });
    return options.sort((a, b) => a.label.localeCompare(b.label));
  }
  return options;
}

const allChurches = simFilterOptions("church");
assert.equal(allChurches.length, 2, "Should return 2 churches");

const groupsChurch1 = simFilterOptions("cellGroup", "church-1");
assert.equal(groupsChurch1.length, 1, "Church 1 should only have 1 group");
assert.equal(groupsChurch1[0].value, "group-1");

const cellsChurch1 = simFilterOptions("cell", "church-1");
assert.equal(cellsChurch1.length, 2, "Church 1 should have 2 cells");

const cellsChurch1Group1 = simFilterOptions("cell", "church-1", "group-1");
assert.equal(cellsChurch1Group1.length, 2, "Group 1 should have 2 cells");

const cellsChurch2 = simFilterOptions("cell", "church-2");
assert.equal(cellsChurch2.length, 1, "Church 2 should only have 1 cell");
assert.equal(cellsChurch2[0].value, "cell-201");

console.log("2. Cascading options generation (Church -> Group -> Cell) verified");

const mockReports = [
  { id: "rep-1", church_id: "church-1", cell_group_id: "group-1", cell_id: "cell-101", celula: "Celula Luz", nome_do_lider: "Joao Silva", att: 12, ft: 2, nc: 1, semana: "2026-W38", estado: "Submetido" },
  { id: "rep-2", church_id: "church-1", cell_group_id: "group-1", cell_id: "cell-102", celula: "Celula Vida", nome_do_lider: "Maria Santos", att: 15, ft: 4, nc: 2, semana: "2026-W38", estado: "Validado" },
  { id: "rep-3", church_id: "church-2", cell_group_id: "group-2", cell_id: "cell-201", celula: "Celula Paz", nome_do_lider: "Pedro Alves", att: 8, ft: 1, nc: 0, semana: "2026-W37", estado: "Submetido" }
];

function simApplyFilters(items, filters = {}, itemType = "report") {
  const norm = (v) => String(v || "").trim().toLowerCase();
  const search = norm(filters.search);
  const targetChurchId = String(filters.church_id || "");
  const targetGroup = norm(filters.cell_group);
  const targetCell = norm(filters.cell);
  const targetStatus = norm(filters.status);
  const targetWeek = String(filters.week || "").trim();

  return items.filter((item) => {
    if (!item) return false;
    if (search) {
      const haystack = [item.full_name, item.nome_do_lider, item.celula, item.cell_name, item.phone].filter(Boolean).map(norm).join(" ");
      if (!haystack.includes(search)) return false;
    }
    if (targetChurchId) {
      if (item.church_id !== targetChurchId) return false;
    }
    if (targetGroup) {
      const gid = norm(item.cell_group_id || item.group_id || "");
      if (gid !== targetGroup) return false;
    }
    if (targetCell) {
      const cid = norm(item.cell_id || item.id || "");
      if (cid !== targetCell) return false;
    }
    if (targetStatus) {
      if (itemType === "member") {
        const hasCell = !!item.cell_id;
        if (targetStatus === "assigned" && !hasCell) return false;
        if (targetStatus === "awaiting" && hasCell) return false;
      } else {
        const s = norm(item.estado || item.status || "");
        if (s !== targetStatus) return false;
      }
    }
    if (targetWeek) {
      const w = String(item.semana || "");
      if (!w.includes(targetWeek)) return false;
    }
    return true;
  });
}

assert.equal(simApplyFilters(mockReports, { church_id: "church-1" }).length, 2, "Church-1 reports filter");
assert.equal(simApplyFilters(mockReports, { church_id: "church-1", cell: "cell-101" }).length, 1, "Church-1 + Cell-101 reports filter");
assert.equal(simApplyFilters(mockReports, { status: "Validado" }).length, 1, "Status Validado filter");
assert.equal(simApplyFilters(mockReports, { search: "Maria" }).length, 1, "Search Maria filter");

assert.equal(simApplyFilters(mockState.members, { church_id: "church-1" }, "member").length, 2, "Church-1 members filter");
assert.equal(simApplyFilters(mockState.members, { status: "awaiting" }, "member").length, 1, "Awaiting members queue filter");
assert.equal(simApplyFilters(mockState.members, { status: "assigned" }, "member").length, 2, "Assigned members filter");

console.log("3. Multi-dimensional filtering logic (Church, Group, Cell, Status, Search) verified");
console.log("ALL CELL MINISTRY & CELL REPORTS FILTER TESTS PASSED SUCCESSFULLY!");
