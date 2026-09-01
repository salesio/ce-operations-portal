import fs from "node:fs";

// 1. Patch js/access-control.js
let acCode = fs.readFileSync("js/access-control.js", "utf8");
acCode = acCode.replace(/\r\n/g, "\n");

const oldExplicitlyDenied = `  function isExplicitlyDenied(user, module) {
    if (!user || !module) return false;
    const grants = user.department_permissions || [];
    if (grants.includes(module) || grants.includes("*")) return false;
    if (module === "foundation" && (grants.includes("foundation_teacher") || grants.includes("foundation_assistant") || grants.includes("foundation"))) return false;
    if (module === "cell" && (grants.includes("cellReports") || grants.includes("cell"))) return false;
    const rawRole = user.role || user.role_name || "";
    const norm = normalizeRoleKey(rawRole);
    return Boolean(EXPLICIT_DENIED_MODULES[norm]?.has(module) || EXPLICIT_DENIED_MODULES[rawRole]?.has(module));
  }`;

const newExplicitlyDenied = `  function isExplicitlyDenied(user, module) {
    if (!user || !module) return false;
    const grants = user.department_permissions || [];
    if (grants.includes(module) || grants.includes("*")) return false;
    if (module === "foundation" && (grants.includes("foundation_teacher") || grants.includes("foundation_assistant") || grants.includes("foundation"))) return false;
    if (module === "followUp" && (grants.includes("followUp") || grants.includes("follow_up"))) return false;
    if (module === "reports" && (grants.includes("reports") || grants.includes("reports_viewer"))) return false;
    if (module === "firstTimers" && (grants.includes("firstTimers") || grants.includes("first_timers"))) return false;
    if (module === "cell" && (grants.includes("cellReports") || grants.includes("cell"))) return false;
    const rawRole = user.role || user.role_name || "";
    const norm = normalizeRoleKey(rawRole);
    return Boolean(EXPLICIT_DENIED_MODULES[norm]?.has(module) || EXPLICIT_DENIED_MODULES[rawRole]?.has(module));
  }`;

if (acCode.includes(oldExplicitlyDenied)) {
  acCode = acCode.replace(oldExplicitlyDenied, newExplicitlyDenied);
  console.log("Updated isExplicitlyDenied in access-control.js");
} else {
  console.warn("oldExplicitlyDenied not found!");
}

const oldCanAccessTab = `    if (module === "foundation" && user?.role === "Foundation Teacher") return foundationTeacherTabs.has(tab);
    if (module === "foundation" && user?.role === "Foundation Assistant") return foundationAssistantTabs.has(tab);`;

const newCanAccessTab = `    if (module === "foundation" && (user?.role === "Foundation Teacher" || (user?.department_permissions || []).includes("foundation_teacher"))) return foundationTeacherTabs.has(tab);
    if (module === "foundation" && (user?.role === "Foundation Assistant" || (user?.department_permissions || []).includes("foundation_assistant"))) return foundationAssistantTabs.has(tab);`;

if (acCode.includes(oldCanAccessTab)) {
  acCode = acCode.replace(oldCanAccessTab, newCanAccessTab);
  console.log("Updated canAccessTab in access-control.js");
} else {
  console.warn("oldCanAccessTab not found!");
}

fs.writeFileSync("js/access-control.js", acCode, "utf8");

// 2. Patch js/dashboard.js
let dashCode = fs.readFileSync("js/dashboard.js", "utf8");
dashCode = dashCode.replace(/\r\n/g, "\n");

const oldRoleWorkspaceRoutes = `function roleWorkspaceRoutes(user = activeUser) {
  const role = String(user?.role || user?.role_name || "").toLowerCase().trim();
  if (isCellLeaderOrAssistant(user)) {
    return ["cellPortal", "cellReceivedReports", "cellWeeklyReport"];
  }
  if (role === "alec_manager" || role === "alec coordinator" || role === "alec manager" || role === "alec_coordinator") {
    return ["cellAlecOverview", "cellAlecRegistration", "cellAlecScores", "cellChurchReports", "cellPortal"];
  }
  if (isPastoralCareRector(user)) {
    return ["firstTimers", "followUp", "foundation", "sacraments", "counseling"];
  }
  if (role === "follow-up coordinator" || role === "follow_up_coordinator") return ["firstTimers", "followUp"];
  return null;
}`;

const newRoleWorkspaceRoutes = `function roleWorkspaceRoutes(user = activeUser) {
  const role = String(user?.role || user?.role_name || "").toLowerCase().trim();
  if (isCellLeaderOrAssistant(user)) {
    const routes = ["cellPortal", "cellReceivedReports", "cellWeeklyReport"];
    const grants = user?.department_permissions || [];
    if (grants.includes("followUp") || grants.includes("follow_up")) routes.push("followUp");
    if (grants.includes("foundation") || grants.includes("foundation_teacher") || grants.includes("foundation_assistant")) routes.push("foundation");
    if (grants.includes("reports") || grants.includes("reports_viewer")) routes.push("reports");
    if (grants.includes("firstTimers") || grants.includes("first_timers")) routes.push("firstTimers");
    return routes;
  }
  if (role === "alec_manager" || role === "alec coordinator" || role === "alec manager" || role === "alec_coordinator") {
    return ["cellAlecOverview", "cellAlecRegistration", "cellAlecScores", "cellChurchReports", "cellPortal"];
  }
  if (isPastoralCareRector(user)) {
    return ["firstTimers", "followUp", "foundation", "sacraments", "counseling"];
  }
  if (role === "follow-up coordinator" || role === "follow_up_coordinator") return ["firstTimers", "followUp"];
  return null;
}`;

if (dashCode.includes(oldRoleWorkspaceRoutes)) {
  dashCode = dashCode.replace(oldRoleWorkspaceRoutes, newRoleWorkspaceRoutes);
  console.log("Updated roleWorkspaceRoutes in dashboard.js");
} else {
  console.warn("oldRoleWorkspaceRoutes not found!");
}

// Add prominent member candidate buttons in cell-portal-members
const oldMembersHeader = `        <div class="d-flex justify-content-between align-items-center mb-2">
          <small class="text-secondary">Reveja os membros históricos da sua célula: confirme membros activos, corrija dados de contacto ou solicite transferências.</small>
          \${!isReadOnlyPortal ? \`
          <button type="button" class="btn btn-sm btn-outline-success" data-cell-member-bulk-confirm>
            <i class="bi bi-check-all me-1"></i>Confirmar Todos (\${unconfirmedMembersCount})
          </button>\` : ""}
        </div>`;

const newMembersHeader = `        <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
          <small class="text-secondary">Reveja os membros históricos da sua célula: confirme membros activos, corrija dados de contacto ou solicite transferências.</small>
          \${!isReadOnlyPortal ? \`
          <div class="d-flex flex-wrap gap-2">
            <button type="button" class="btn btn-ce-gold btn-sm" data-open-member-candidate>
              <i class="bi bi-person-plus-fill me-1"></i>+ Registar Novo Membro da Célula
            </button>
            <button type="button" class="btn btn-sm btn-outline-success" data-cell-member-bulk-confirm>
              <i class="bi bi-check-all me-1"></i>Confirmar Todos (\${unconfirmedMembersCount})
            </button>
          </div>\` : ""}
        </div>`;

if (dashCode.includes(oldMembersHeader)) {
  dashCode = dashCode.replace(oldMembersHeader, newMembersHeader);
  console.log("Updated cell-portal-members header button in dashboard.js");
} else {
  console.warn("oldMembersHeader not found!");
}

// Also in hero actions
const oldHeroActions = `          \${canChooseCell ? \`<label>Seleccionar célula<select class="form-select" data-cell-portal-cell>\${safeHeroCells.map((item) => \`<option value="\${escapeAttr(item.id)}" \${String(item.id) === String(context?.cell_id) ? "selected" : ""}>\${escapeAttr(portalCellName(item))}</option>\`).join("")}</select></label>\` : ""}
          \${!isReadOnlyPortal ? \`<button type="button" class="btn btn-ce-gold btn-touch" data-public-cell-report><i class="bi bi-clipboard-plus me-2"></i>Submeter Relatório Semanal</button>\` : ""}
          \${hasCellPortalPermission("cell_portal.export_summary") ? \`<button type="button" class="btn btn-outline-cyan btn-touch" data-cell-portal-export><i class="bi bi-download me-2"></i>Exportar resumo</button>\` : ""}`;

const newHeroActions = `          \${canChooseCell ? \`<label>Seleccionar célula<select class="form-select" data-cell-portal-cell>\${safeHeroCells.map((item) => \`<option value="\${escapeAttr(item.id)}" \${String(item.id) === String(context?.cell_id) ? "selected" : ""}>\${escapeAttr(portalCellName(item))}</option>\`).join("")}</select></label>\` : ""}
          \${!isReadOnlyPortal ? \`
            <button type="button" class="btn btn-outline-gold btn-touch" data-open-member-candidate title="Registar membro pendente de aprovação"><i class="bi bi-person-plus-fill me-2"></i>+ Registar Membro</button>
            <button type="button" class="btn btn-ce-gold btn-touch" data-public-cell-report><i class="bi bi-clipboard-plus me-2"></i>Submeter Relatório Semanal</button>
          \` : ""}
          \${hasCellPortalPermission("cell_portal.export_summary") ? \`<button type="button" class="btn btn-outline-cyan btn-touch" data-cell-portal-export><i class="bi bi-download me-2"></i>Exportar resumo</button>\` : ""}`;

if (dashCode.includes(oldHeroActions)) {
  dashCode = dashCode.replace(oldHeroActions, newHeroActions);
  console.log("Updated cell-portal-hero actions in dashboard.js");
} else {
  console.warn("oldHeroActions not found!");
}

fs.writeFileSync("js/dashboard.js", dashCode, "utf8");
console.log("All patches completed!");
