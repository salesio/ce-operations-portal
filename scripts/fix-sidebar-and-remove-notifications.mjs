import fs from "node:fs";

const DASHBOARD_PATH = "js/dashboard.js";
let code = fs.readFileSync(DASHBOARD_PATH, "utf8");

const startMarker = "function renderCellSidebarNav() {";
const endMarker = "  byId(\"sidebarNav\").innerHTML = NAV_GROUPS.map((group) => {";

const startIdx = code.indexOf(startMarker);
const endIdx = code.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
  console.error("Could not find markers:", startIdx, endIdx);
  process.exit(1);
}

const replacement = `function renderCellSidebarNav() {
  const workspaceRoutes = roleWorkspaceRoutes();
  const parentExpanded = isSidebarGroupExpanded(CELL_NAV.parentKey);
  const parentActive = isCellRoute(activeRoute);
  if (isCellLeaderOrAssistant(activeUser) || ["Cell Leader", "Cell Assistant"].includes(activeUser?.role)) {
    return \`<div class="nav-cell-branch is-expanded \${parentActive ? "has-active" : ""}">
      <div class="nav-cell-body"><div class="nav-cell-body-inner">
        <button type="button" class="nav-cell-item \${activeRoute === "cellPortal" || activeRoute === "dashboard" ? "active" : ""}" data-route="cellPortal" onclick="window.setRoute && window.setRoute('cellPortal'); return false;"><span>\${lang === "pt" ? "Minha Célula" : "My Cell"}</span></button>
        <button type="button" class="nav-cell-item \${activeRoute === "cellReceivedReports" ? "active" : ""}" data-route="cellReceivedReports" onclick="window.setRoute && window.setRoute('cellReceivedReports'); return false;"><span>\${L("receivedReports")}</span></button>
        <button type="button" class="nav-cell-item" data-public-cell-report><span>\${L("submitCellReport")}</span></button>
      </div></div>
    </div>\`;
  }
  const showCellPortal = hasCellPortalPermission("cell_portal.view") && (!workspaceRoutes || workspaceRoutes.includes("cellPortal"));
  return \`
    <div class="nav-cell-branch \${parentExpanded ? "is-expanded" : ""} \${parentActive ? "has-active" : ""}" data-nav-group="\${CELL_NAV.parentKey}">
      <button type="button" class="nav-cell-parent" aria-expanded="\${parentExpanded}" aria-label="\${L("navGroupToggle")}: \${L("cellLeadership")}">
        <i class="bi bi-diagram-3" aria-hidden="true"></i>
        <span>\${L("cellLeadership")}</span>
        <i class="bi bi-chevron-down nav-cell-chevron" aria-hidden="true"></i>
      </button>
      <div class="nav-cell-body">
        <div class="nav-cell-body-inner">
          \${showCellPortal ? \`<button type="button" class="nav-cell-item \${activeRoute === "cellPortal" ? "active" : ""}" data-route="cellPortal" onclick="window.setRoute && window.setRoute('cellPortal'); return false;"><span>\${lang === "pt" ? "Portal por Célula" : "Cell Portal"}</span></button>\` : ""}
          \${CELL_NAV.areas.map((area) => {
            const visibleRoutes = area.routes.filter(([route]) => {
              if (workspaceRoutes && !workspaceRoutes.includes(route)) return false;
              const nav = resolveRouteAccess(route);
              return nav.visible;
            });
            if (!visibleRoutes.length) return "";
            const areaExpanded = isSidebarGroupExpanded(area.key);
            const areaActive = area.routes.some(([route]) => route === activeRoute);
            return \`
              <div class="nav-cell-area \${areaExpanded ? "is-expanded" : ""} \${areaActive ? "has-active" : ""}" data-nav-group="\${area.key}">
                <button type="button" class="nav-cell-area-toggle" aria-expanded="\${areaExpanded}" aria-label="\${L("navGroupToggle")}: \${L(area.label)}">
                  <i class="bi \${CELL_AREA_ICONS[area.key] || CELL_AREA_ICONS.default} nav-cell-area-icon" aria-hidden="true"></i>
                  <span>\${L(area.label)}</span>
                  <i class="bi bi-chevron-down nav-cell-area-chevron" aria-hidden="true"></i>
                </button>
                <div class="nav-cell-area-body">
                  <div class="nav-cell-area-body-inner">
                    \${visibleRoutes.map(([route, label]) => {
                      const nav = resolveRouteAccess(route);
                      return \`
                      <button type="button" class="nav-cell-item \${activeRoute === route ? "active" : ""} \${nav.locked ? "is-locked" : ""}" \${nav.locked ? \`data-locked-route="\${route}" aria-disabled="true"\` : \`data-route="\${route}" onclick="window.setRoute && window.setRoute('\${route}'); return false;"\`} title="\${nav.locked ? L("navLockedTooltip") : L(label)}">
                        <span>\${L(label)}</span>\${nav.locked ? \`<i class="bi bi-lock-fill nav-lock-icon" aria-hidden="true"></i>\` : ""}
                      </button>
                    \`; }).join("")}
                  </div>
                </div>
              </div>\`;
          }).join("")}
        </div>
      </div>
    </div>\`;
}

function cellModuleHeader(route, { modalType = null } = {}) {
  return moduleNavShell("cellLeadership", {
    title: cellRouteLabel(route),
    subtitle: \`\${L("cellLeadership")} › \${cellRouteAreaLabel(route)}\`,
    modalType,
    icon: "bi-diagram-3"
  }, \`<div class="cell-route-context"><span class="eyebrow">\${L("cellLeadership")}</span><span class="cell-route-sep">›</span><span>\${cellRouteAreaLabel(route)}</span></div>\`);
}

function isSidebarCollapsed() {
  return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1";
}

function applySidebarCollapse(collapsed = isSidebarCollapsed()) {
  const shell = document.querySelector(".ops-shell");
  const toggle = byId("sidebarCollapseToggle");
  if (!shell) return;
  shell.classList.toggle("is-sidebar-collapsed", collapsed);
  localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? "1" : "0");
  if (toggle) {
    toggle.setAttribute("aria-label", collapsed ? L("sidebarExpand") : L("sidebarCollapse"));
    toggle.setAttribute("title", collapsed ? L("sidebarExpand") : L("sidebarCollapse"));
  }
}

function renderShell() {
  if (isCellLeaderOrAssistant(activeUser) || ["Cell Leader", "Cell Assistant"].includes(activeUser?.role)) {
    byId("sidebarNav").innerHTML = \`<div class="nav-group is-expanded"><div class="nav-group-body"><div class="nav-group-body-inner">
      <button type="button" class="nav-item-btn \${["dashboard", "cellPortal"].includes(activeRoute) ? "active" : ""}" data-route="cellPortal"><i class="bi bi-grid-1x2"></i><span>\${lang === "pt" ? "Minha Célula" : "My Cell"}</span></button>
      <button type="button" class="nav-item-btn \${activeRoute === "cellReceivedReports" ? "active" : ""}" data-route="cellReceivedReports"><i class="bi bi-clock-history"></i><span>\${lang === "pt" ? "Relatórios Submetidos" : "Submitted Reports"}</span></button>
      <button type="button" class="nav-item-btn" data-public-cell-report><i class="bi bi-clipboard-plus"></i><span>\${lang === "pt" ? "Submeter Relatório" : "Submit Report"}</span></button>
    </div></div></div>\`;
    byId("activeUserName").textContent = activeUser.name;
    byId("activeUserRole").textContent = activeUser.role;
    applySidebarCollapse();
    updateNotificationCenter();
    return;
  }
`;

code = code.slice(0, startIdx) + replacement + code.slice(endIdx);
fs.writeFileSync(DASHBOARD_PATH, code, "utf8");
console.log("Successfully replaced block!");
