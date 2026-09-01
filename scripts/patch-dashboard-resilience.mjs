import fs from "node:fs";

const DASHBOARD_PATH = "js/dashboard.js";
let code = fs.readFileSync(DASHBOARD_PATH, "utf8");

// 1. Add global UI component fallbacks after generateUuid
const uiFallbacks = `
// Global UI Component Fallbacks
function EmptyState({ icon = "bi-inbox", title, description = "", action = "", compact = false, variant = "light" } = {}) {
  const t = title || (typeof L === "function" ? L("empty") : "Sem registos");
  return \`
    <div class="empty-state ui-empty-state light-surface \${compact ? "ui-empty-state--compact" : ""}">
      <div class="empty-state-icon"><i class="bi \${icon}"></i></div>
      <h4 class="empty-state-title">\${t}</h4>
      \${description ? \`<p class="empty-state-desc meta-text">\${description}</p>\` : ""}
      \${action || ""}
    </div>\`;
}
`;

if (!code.includes("function EmptyState({ icon = \"bi-inbox\"")) {
  code = code.replace("function generateUuid() {", uiFallbacks + "\nfunction generateUuid() {");
  console.log("Added EmptyState fallback to top of dashboard.js!");
}

// 2. Fix sacraments length in renderDashboard
code = code.replace(
  `[[L("baptismTab"), state.sacraments.baptisms.length], [L("marriageTab"), state.sacraments.marriages.length], [L("babyTab"), state.sacraments.babies.length]]`,
  `[[L("baptismTab"), (state.sacraments?.baptisms || []).length], [L("marriageTab"), (state.sacraments?.marriages || []).length], [L("babyTab"), (state.sacraments?.babies || []).length]]`
);

// 3. Fix activeUser.role check in renderDashboard to also check role_name
code = code.replace(
  `if (["Cell Leader", "Cell Assistant", "Assistant Cell Leader"].includes(activeUser?.role)) {`,
  `if (isCellLeaderOrAssistant(activeUser)) {`
);

// 4. Fix isPastoralCareRector in renderDashboard if user navigates to dashboard directly
const oldRenderDashboardStart = `function renderDashboard() {
  if (isCellLeaderOrAssistant(activeUser)) {
    renderCellLeaderPortal();
    return;
  }`;

const newRenderDashboardStart = `function renderDashboard() {
  if (isCellLeaderOrAssistant(activeUser)) {
    renderCellLeaderPortal();
    return;
  }
  if (isPastoralCareRector(activeUser)) {
    setRoute("firstTimers");
    return;
  }`;

if (code.includes(oldRenderDashboardStart) && !code.includes("if (isPastoralCareRector(activeUser)) {")) {
  code = code.replace(oldRenderDashboardStart, newRenderDashboardStart);
  console.log("Added isPastoralCareRector guard to renderDashboard!");
}

fs.writeFileSync(DASHBOARD_PATH, code, "utf8");
console.log("Successfully patched dashboard resilience in dashboard.js!");
