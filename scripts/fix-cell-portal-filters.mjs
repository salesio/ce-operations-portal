import fs from "node:fs";

const DASHBOARD_PATH = "js/dashboard.js";
let code = fs.readFileSync(DASHBOARD_PATH, "utf8");

const brokenRegex = /const allGroups = \[\r?\n\s*\.\.\.\(window\.REAL_CELL_GROUPS \|\| \[\]\),\r?\n\s*\.\.\.\(state\.cellGroups \|\| \[\]\),\r?\n\s*\.\.\.\(state\.cellMinistry\?\.groups \|\| \[\]\)\r?\n\s*const heroCellsList = cellPortalPageState\.cellGroupId/;

const fixedBlock = `const allGroups = [
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
    const heroCellsList = cellPortalPageState.cellGroupId`;

if (brokenRegex.test(code)) {
  code = code.replace(brokenRegex, fixedBlock);
  console.log("Matched and replaced broken allGroups block!");
} else {
  console.log("Regex did not match broken allGroups block");
}

const oldToolbarRegex = /<label>Grupo de Célula<select class="form-select" data-cell-portal-filter="cellGroupId"><option value="">Todos os Grupos<\/option>\$\{safeCellGroups\.map\(\(g\) => `<option value="\$\{escapeAttr\(g\.id\)\}" \$\{String\(g\.id\) === String\(cellPortalPageState\.cellGroupId \|\| ""\) \? "selected" : ""\}>\$\{escapeAttr\(g\.group_name \|\| g\.name \|\| "Grupo"\)\}<\/option>`\)\.join\(""\)\}<\/select><\/label>\r?\n\s*<label>Célula<select class="form-select" data-cell-portal-filter="cellId"><option value="">Todas as Células<\/option>\$\{safeCellRegistry\.map\(\(c\) => `<option value="\$\{escapeAttr\(c\.id\)\}" \$\{String\(c\.id\) === String\(cellPortalPageState\.cellId \|\| ""\) \? "selected" : ""\}>\$\{escapeAttr\(c\.cell_name \|\| c\.name \|\| "Célula"\)\}<\/option>`\)\.join\(""\)\}<\/select><\/label>/;

const newToolbar = `\${showCellGroupSelectors ? \`
        <label>Grupo de Célula<select class="form-select" data-cell-portal-filter="cellGroupId"><option value="">Todos os Grupos</option>\${safeCellGroups.map((g) => \`<option value="\${escapeAttr(g.id)}" \${String(g.id) === String(cellPortalPageState.cellGroupId || "") ? "selected" : ""}>\${escapeAttr(g.group_name || g.name || "Grupo")}</option>\`).join("")}</select></label>
        <label>Célula<select class="form-select" data-cell-portal-filter="cellId"><option value="">Todas as Células</option>\${safeCellRegistry.map((c) => \`<option value="\${escapeAttr(c.id)}" \${String(c.id) === String(cellPortalPageState.cellId || "") ? "selected" : ""}>\${escapeAttr(c.cell_name || c.name || "Célula")}</option>\`).join("")}</select></label>
        \` : ""}`;

if (oldToolbarRegex.test(code)) {
  code = code.replace(oldToolbarRegex, newToolbar);
  console.log("Matched and replaced oldToolbar!");
} else {
  console.log("oldToolbarRegex did not match");
}

fs.writeFileSync(DASHBOARD_PATH, code, "utf8");
