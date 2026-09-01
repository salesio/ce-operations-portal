import fs from "node:fs";

let code = fs.readFileSync("js/dashboard.js", "utf8");
code = code.replace(/\r\n/g, "\n");

const target = `function renderShell() {
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
  }`;

const replacement = `function renderShell() {
  if (isCellLeaderOrAssistant(activeUser) || ["Cell Leader", "Cell Assistant"].includes(activeUser?.role)) {
    const canFollowUp = typeof resolveRouteAccess === "function" ? resolveRouteAccess("followUp").visible : false;
    const canFoundation = typeof resolveRouteAccess === "function" ? resolveRouteAccess("foundation").visible : false;
    const canReports = typeof resolveRouteAccess === "function" ? resolveRouteAccess("reports").visible : false;

    let extraNav = "";
    if (canFollowUp) {
      extraNav += \`<button type="button" class="nav-item-btn \${activeRoute === "followUp" ? "active" : ""}" data-route="followUp" onclick="window.setRoute && window.setRoute('followUp'); return false;"><i class="bi bi-person-lines-fill"></i><span>\${lang === "pt" ? "Acompanhamento" : "Follow-Up"}</span></button>\`;
    }
    if (canFoundation) {
      extraNav += \`<button type="button" class="nav-item-btn \${activeRoute === "foundation" ? "active" : ""}" data-route="foundation" onclick="window.setRoute && window.setRoute('foundation'); return false;"><i class="bi bi-book"></i><span>\${lang === "pt" ? "Escola de Fundação" : "Foundation School"}</span></button>\`;
    }
    if (canReports) {
      extraNav += \`<button type="button" class="nav-item-btn \${activeRoute === "reports" ? "active" : ""}" data-route="reports" onclick="window.setRoute && window.setRoute('reports'); return false;"><i class="bi bi-bar-chart"></i><span>\${lang === "pt" ? "Relatórios" : "Reports"}</span></button>\`;
    }

    byId("sidebarNav").innerHTML = \`<div class="nav-group is-expanded"><div class="nav-group-body"><div class="nav-group-body-inner">
      <button type="button" class="nav-item-btn \${["dashboard", "cellPortal"].includes(activeRoute) ? "active" : ""}" data-route="cellPortal" onclick="window.setRoute && window.setRoute('cellPortal'); return false;"><i class="bi bi-grid-1x2"></i><span>\${lang === "pt" ? "Minha Célula" : "My Cell"}</span></button>
      <button type="button" class="nav-item-btn \${activeRoute === "cellReceivedReports" ? "active" : ""}" data-route="cellReceivedReports" onclick="window.setRoute && window.setRoute('cellReceivedReports'); return false;"><i class="bi bi-clock-history"></i><span>\${lang === "pt" ? "Relatórios Submetidos" : "Submitted Reports"}</span></button>
      <button type="button" class="nav-item-btn" data-public-cell-report><i class="bi bi-clipboard-plus"></i><span>\${lang === "pt" ? "Submeter Relatório" : "Submit Report"}</span></button>
      \${extraNav}
    </div></div></div>\`;
    byId("activeUserName").textContent = activeUser.name || activeUser.full_name || "";
    byId("activeUserRole").textContent = activeUser.role || activeUser.role_name || "";
    applySidebarCollapse();
    updateNotificationCenter();
    return;
  }`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync("js/dashboard.js", code, "utf8");
  console.log("SUCCESS: renderShell replaced successfully in js/dashboard.js!");
} else {
  console.error("target not found!");
  process.exit(1);
}
