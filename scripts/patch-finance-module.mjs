import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dashboardPath = join(__dirname, "../js/dashboard.js");
let content = readFileSync(dashboardPath, "utf8");

// 1. Fix duplicate readyForExam in TEXT.pt and TEXT.en
content = content.replace(
  'enrolledInCourse: "Alunos Inscritos",\n    readyForExam: "Prontos para Exame",',
  'enrolledInCourse: "Alunos Inscritos",\n    readyForExamPlural: "Prontos para Exame",'
);
content = content.replace(
  'enrolledInCourse: "Enrolled Students",\n    readyForExam: "Ready for Exam",',
  'enrolledInCourse: "Enrolled Students",\n    readyForExamPlural: "Ready for Exam",'
);

// 2. Add FINANCE_NAV and FINANCE_TAB_ROUTES after FEVO_TAB_ROUTES
const financeNavDef = `const FEVO_TAB_ROUTES = new Set(FEVO_NAV.routes.map(([route]) => route));

const FINANCE_NAV = {
  parentKey: "financeHeader",
  label: "finance",
  icon: "bi-cash-coin",
  routes: [
    ["finance", "bi-grid-1x2", "financeTabOverview"],
    ["financeEntriesRoute", "bi-table", "financeTabEntries"],
    ["financePublicSubmissionsRoute", "bi-globe2", "financeTabPublic"],
    ["financeVerificationRoute", "bi-shield-check", "financeTabVerification"],
    ["financeApprovedRequisitionsRoute", "bi-clipboard-check", "financeTabApprovedReq"],
    ["financeReportsRoute", "bi-graph-up", "financeTabReports"],
    ["financePartnersRoute", "bi-stars", "financeTabPartners"],
    ["financeExportsRoute", "bi-download", "financeTabExports"]
  ]
};

const FINANCE_TAB_ROUTES = new Set(FINANCE_NAV.routes.map(([route]) => route));`;

content = content.replace('const FEVO_TAB_ROUTES = new Set(FEVO_NAV.routes.map(([route]) => route));', financeNavDef);

// 3. Update TAB_PARALLAX_ORDER, tabParallaxFamily, and isModuleTabRoute
content = content.replace(
  'fevo: ["fevo", "fevoConfigRoute", "fevoFollowUpRoute", "fevoEvangelismRoute", "fevoVisitationRoute", "fevoPrayerRoute", "fevoNoReportsRoute", "fevoWeeklyReportsRoute", "fevoAnalysisRoute"],',
  `fevo: ["fevo", "fevoConfigRoute", "fevoFollowUpRoute", "fevoEvangelismRoute", "fevoVisitationRoute", "fevoPrayerRoute", "fevoNoReportsRoute", "fevoWeeklyReportsRoute", "fevoAnalysisRoute"],
  finance: ["finance", "financeEntriesRoute", "financePublicSubmissionsRoute", "financeVerificationRoute", "financeApprovedRequisitionsRoute", "financeReportsRoute", "financePartnersRoute", "financeExportsRoute"],`
);

content = content.replace(
  'if (FEVO_TAB_ROUTES.has(route)) return "fevo";',
  'if (FEVO_TAB_ROUTES.has(route)) return "fevo";\n  if (FINANCE_TAB_ROUTES.has(route)) return "finance";'
);

content = content.replace(
  'return CELL_TAB_ROUTES.has(route) || FEVO_TAB_ROUTES.has(route) || VENUE_TAB_ROUTES.has(route) || OUTREACH_TAB_ROUTES.has(route) || MEDIA_TAB_ROUTES.has(route);',
  'return CELL_TAB_ROUTES.has(route) || FEVO_TAB_ROUTES.has(route) || FINANCE_TAB_ROUTES.has(route) || VENUE_TAB_ROUTES.has(route) || OUTREACH_TAB_ROUTES.has(route) || MEDIA_TAB_ROUTES.has(route);'
);

// 4. Update NAV_GROUPS under departments
content = content.replace(
  '// Order: Células (subnav) → F.E.V.O (subnav) → Finanças → Parcerias → Mídia (subnav) → Requisições → Inventário → Programas & Extensão (subnav)\n  { key: "departments", items: [["finance", "bi-cash-coin", "finance"], ["partnership", "bi-stars", "partnership"], ["requisitions", "bi-clipboard-check", "requisitions"], ["venueInventory", "bi-box-seam", "venueInventoryShort"]] },',
  '// Order: Células (subnav) → F.E.V.O (subnav) → Finanças (subnav) → Parcerias → Requisições → Inventário → Mídia (subnav) → Programas & Extensão (subnav)\n  { key: "departments", items: [["partnership", "bi-stars", "partnership"], ["requisitions", "bi-clipboard-check", "requisitions"], ["venueInventory", "bi-box-seam", "venueInventoryShort"]] },'
);

// 5. Empty seed finance records in seedData
const seedFinanceMatch = content.match(/finance:\s*\[[\s\S]*?\n\s*\],\s*cells:/);
if (seedFinanceMatch) {
  content = content.replace(seedFinanceMatch[0], 'finance: [],\n  cells:');
}

// 6. Add renderFinanceSidebarNav() before renderFevoSidebarNav()
const renderFinanceNavCode = `function renderFinanceSidebarNav() {
  const workspaceRoutes = roleWorkspaceRoutes();
  const parentExpanded = isSidebarGroupExpanded(FINANCE_NAV.parentKey);
  const parentActive = FINANCE_TAB_ROUTES.has(activeRoute) || activeRoute === "finance";
  const visibleRoutes = FINANCE_NAV.routes.filter(([route]) => {
    if (workspaceRoutes && !workspaceRoutes.includes(route) && !workspaceRoutes.includes("finance")) return false;
    const nav = resolveRouteAccess(route);
    return nav.visible && !nav.locked;
  });
  if (!visibleRoutes.length) return "";
  return \`
    <div class="nav-cell-branch nav-finance-branch \${parentExpanded ? "is-expanded" : ""} \${parentActive ? "has-active" : ""}" data-nav-group="\${FINANCE_NAV.parentKey}">
      <button type="button" class="nav-cell-parent nav-finance-parent" aria-expanded="\${parentExpanded}" aria-label="\${L("navGroupToggle")}: \${L(FINANCE_NAV.label)}">
        <i class="bi \${FINANCE_NAV.icon}" aria-hidden="true"></i>
        <span>\${L(FINANCE_NAV.label)}</span>
        <i class="bi bi-chevron-down nav-cell-chevron" aria-hidden="true"></i>
      </button>
      <div class="nav-cell-body">
        <div class="nav-cell-body-inner">
          \${visibleRoutes.map(([route, icon, label]) => \`
            <button type="button" class="nav-cell-item nav-finance-item \${activeRoute === route || (route === "finance" && activeRoute === "financeOverviewRoute") || (route === "financeOverviewRoute" && activeRoute === "finance") ? "active" : ""}" data-route="\${route}" onclick="window.setRoute && window.setRoute('\${route}'); return false;" title="\${L(label)}">
              <i class="bi \${sidebarIcon(icon, route)} me-2" aria-hidden="true"></i>
              <span>\${L(label)}</span>
            </button>
          \`).join("")}
        </div>
      </div>
    </div>\`;
}

function renderFevoSidebarNav()`;

content = content.replace('function renderFevoSidebarNav()', renderFinanceNavCode);

// 7. Update renderShell to include financeNav
content = content.replace(
  'const fevoNav = group.key === "departments" && (!workspaceRoutes || workspaceRoutes.some((r) => FEVO_TAB_ROUTES.has(r))) ? renderFevoSidebarNav() : "";',
  `const fevoNav = group.key === "departments" && (!workspaceRoutes || workspaceRoutes.some((r) => FEVO_TAB_ROUTES.has(r))) ? renderFevoSidebarNav() : "";
    const financeNav = group.key === "departments" && (!workspaceRoutes || workspaceRoutes.some((r) => FINANCE_TAB_ROUTES.has(r) || r === "finance")) ? renderFinanceSidebarNav() : "";`
);

content = content.replace(
  'if (!navItems && !cellNav && !fevoNav && !mediaNav && !outreachNav) return "";',
  'if (!navItems && !cellNav && !fevoNav && !financeNav && !mediaNav && !outreachNav) return "";'
);

content = content.replace(
  '${cellNav}\n          ${fevoNav}\n          ${navItems}',
  '${cellNav}\n          ${fevoNav}\n          ${financeNav}\n          ${navItems}'
);

// 8. Update FALLBACK_ROUTE_MODULES and fallbackRouteModule
const fallbackModulesTarget = 'finance: "finance",';
const fallbackModulesReplacement = `finance: "finance",
  financeOverviewRoute: "finance",
  financeEntriesRoute: "finance",
  financePublicSubmissionsRoute: "finance",
  financeVerificationRoute: "finance",
  financeApprovedRequisitionsRoute: "finance",
  financeReportsRoute: "finance",
  financePartnersRoute: "finance",
  financeExportsRoute: "finance",`;

content = content.replace(fallbackModulesTarget, fallbackModulesReplacement);

content = content.replace(
  'if (route.startsWith("fevo")) return "fevo";',
  'if (route.startsWith("fevo")) return "fevo";\n  if (route.startsWith("finance")) return "finance";'
);

// 9. Update roleWorkspaceRoutes for finance
content = content.replace(
  'if (grants.includes("finance")) routes.push("finance");',
  'if (grants.includes("finance")) routes.push("finance", "financeOverviewRoute", "financeEntriesRoute", "financePublicSubmissionsRoute", "financeVerificationRoute", "financeApprovedRequisitionsRoute", "financeReportsRoute", "financePartnersRoute", "financeExportsRoute");'
);

// 10. Update setRoute: childRoutes, sidebar expansion, and renderers
const childRoutesTarget = 'notifications: ["main", "notifications"]';
const childRoutesReplacement = `financeOverviewRoute: ["departments", "financeTabOverview"],
    financeEntriesRoute: ["departments", "financeTabEntries"],
    financePublicSubmissionsRoute: ["departments", "financeTabPublic"],
    financeVerificationRoute: ["departments", "financeTabVerification"],
    financeApprovedRequisitionsRoute: ["departments", "financeTabApprovedReq"],
    financeReportsRoute: ["departments", "financeTabReports"],
    financePartnersRoute: ["departments", "financeTabPartners"],
    financeExportsRoute: ["departments", "financeTabExports"],
    notifications: ["main", "notifications"]`;

content = content.replace(childRoutesTarget, childRoutesReplacement);

const financeSidebarExpand = `if (FINANCE_TAB_ROUTES.has(activeRoute) || activeRoute === "finance") {
    sidebarGroupState[FINANCE_NAV.parentKey] = true;
    sidebarGroupState.departments = true;
    localStorage.setItem(SIDEBAR_GROUPS_KEY, JSON.stringify(sidebarGroupState));
    const deptGroup = document.querySelector('[data-nav-group="departments"]');
    if (deptGroup && !deptGroup.classList.contains("is-expanded")) {
      deptGroup.classList.add("is-expanded");
    }
    const financeGroup = document.querySelector(\`[data-nav-group="\${FINANCE_NAV.parentKey}"]\`);
    if (financeGroup && !financeGroup.classList.contains("is-expanded")) {
      financeGroup.classList.add("is-expanded");
    }
  }`;

content = content.replace(
  'if (OUTREACH_TAB_ROUTES.has(activeRoute)) {',
  `${financeSidebarExpand}\n  if (OUTREACH_TAB_ROUTES.has(activeRoute)) {`
);

const financeRenderersTarget = 'finance: renderFinance,';
const financeRenderersReplacement = `finance: () => { financePageState.tab = "overview"; renderFinance(); },
    financeOverviewRoute: () => { financePageState.tab = "overview"; renderFinance(); },
    financeEntriesRoute: () => { financePageState.tab = "entries"; renderFinance(); },
    financePublicSubmissionsRoute: () => { financePageState.tab = "public"; renderFinance(); },
    financeVerificationRoute: () => { financePageState.tab = "verification"; renderFinance(); },
    financeApprovedRequisitionsRoute: () => { financePageState.tab = "approvedRequisitions"; renderFinance(); },
    financeReportsRoute: () => { financePageState.tab = "reports"; renderFinance(); },
    financePartnersRoute: () => { financePageState.tab = "partners"; renderFinance(); },
    financeExportsRoute: () => { financePageState.tab = "exports"; renderFinance(); },`;

content = content.replace(financeRenderersTarget, financeRenderersReplacement);

// 11. In financeModuleTabs, link tabs to routes
const financeTabsTarget = `function financeModuleTabs() {
  const tabs = [
    ["overview", L("financeTabOverview")],
    ["entries", L("financeTabEntries")],
    ["public", L("financeTabPublic")],
    ["verification", L("financeTabVerification")],
    ["approvedRequisitions", L("financeTabApprovedReq")],
    ["reports", L("financeTabReports")],
    ["partners", L("financeTabPartners")],
    ["exports", L("financeTabExports")]
  ];
  return moduleTabsNav(tabs.map(([key, label]) => {
    const canAccess = window.CEAccessControl?.canAccessTab?.(activeUser, "finance", key) !== false;
    return moduleTabButton(label, {
      active: financePageState.tab === key,
      attrs: \`data-finance-tab="\${key}"\${canAccess ? "" : \` aria-disabled="true" data-locked-tab="finance:\${key}"\`}\`,
      disabled: !canAccess,
      tooltip: L("navLockedTooltip")
    });
  }).join(""), "finance-module-tabs");
}`;

const financeTabsReplacement = `function financeModuleTabs() {
  const tabs = [
    ["overview", L("financeTabOverview"), "finance"],
    ["entries", L("financeTabEntries"), "financeEntriesRoute"],
    ["public", L("financeTabPublic"), "financePublicSubmissionsRoute"],
    ["verification", L("financeTabVerification"), "financeVerificationRoute"],
    ["approvedRequisitions", L("financeTabApprovedReq"), "financeApprovedRequisitionsRoute"],
    ["reports", L("financeTabReports"), "financeReportsRoute"],
    ["partners", L("financeTabPartners"), "financePartnersRoute"],
    ["exports", L("financeTabExports"), "financeExportsRoute"]
  ];
  return moduleTabsNav(tabs.map(([key, label, route]) => {
    const canAccess = window.CEAccessControl?.canAccessTab?.(activeUser, "finance", key) !== false;
    return moduleTabButton(label, {
      active: financePageState.tab === key || activeRoute === route || (key === "overview" && activeRoute === "finance"),
      attrs: \`data-finance-tab="\${key}" data-route="\${route}"\${canAccess ? "" : \` aria-disabled="true" data-locked-tab="finance:\${key}"\`}\`,
      disabled: !canAccess,
      tooltip: L("navLockedTooltip")
    });
  }).join(""), "finance-module-tabs");
}`;

content = content.replace(financeTabsTarget, financeTabsReplacement);

// 12. Fix duplicate igreja in financeEditSchema
content = content.replace(
  '["source_type", "sourceType", "readonly"], ["igreja", "church", "readonly"],',
  '["source_type", "sourceType", "readonly"],'
);

// 13. State normalization - purge demo finance IDs
content = content.replace(
  'const isTombstone = (u) => {',
  `const demoFinanceIds = new Set(["fin-1", "fin-2", "fin-3", "fin-4", "fin-5", "fin-6", "fin-7", "fin-8", "fin-lw-sat-ok"]);
  merged.finance = (Array.isArray(saved?.finance) ? saved.finance : (Array.isArray(merged.finance) ? merged.finance : []))
    .filter((f) => f && !demoFinanceIds.has(String(f.id)));

  const isTombstone = (u) => {`
);

// 14. In event delegation for finance tabs, use setRoute
content = content.replace(
  `    const financeTabBtn = event.target.closest("[data-finance-tab]");
    if (financeTabBtn) {
      const tab = financeTabBtn.dataset.financeTab || "overview";
      financePageState.tab = tab;
      renderFinance();
      return;
    }`,
  `    const financeTabBtn = event.target.closest("[data-finance-tab]");
    if (financeTabBtn) {
      const tab = financeTabBtn.dataset.financeTab || "overview";
      financePageState.tab = tab;
      const tabRouteMap = {
        overview: "finance",
        entries: "financeEntriesRoute",
        public: "financePublicSubmissionsRoute",
        verification: "financeVerificationRoute",
        approvedRequisitions: "financeApprovedRequisitionsRoute",
        reports: "financeReportsRoute",
        partners: "financePartnersRoute",
        exports: "financeExportsRoute"
      };
      const targetRoute = tabRouteMap[tab] || "finance";
      if (typeof setRoute === "function" && activeRoute !== targetRoute) {
        setRoute(targetRoute);
      } else {
        renderFinance();
      }
      return;
    }`
);

writeFileSync(dashboardPath, content, "utf8");
console.log("Successfully patched dashboard.js for Finance module restructure!");
