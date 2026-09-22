import fs from 'fs';
import path from 'path';

// --- 1. Patch js/dashboard.js ---
const dashPath = path.resolve('js/dashboard.js');
let dash = fs.readFileSync(dashPath, 'utf8');
const isDashCRLF = dash.includes('\r\n');
if (isDashCRLF) dash = dash.replace(/\r\n/g, '\n');

// 1.1 Add PT i18n keys
const ptTarget = '    financeTabAll: "Todos os Registos",';
const ptRepl = `    financeTabAll: "Todos os Registos",
    partnershipTabOverview: "Visão Geral",
    partnershipTabArms: "Braços de Parceria",
    partnershipTabPartners: "Parceiros",
    partnershipTabContributions: "Contribuições",
    partnershipTabHighlights: "Destaques",
    partnershipTabAnalytics: "Análise",
    partnershipTabReports: "Relatórios",
    partnershipTabExports: "Exportações",`;
if (!dash.includes('partnershipTabOverview: "Visão Geral"')) {
  dash = dash.replace(ptTarget, ptRepl);
  console.log("1.1 PT i18n keys added");
}

// 1.2 Add EN i18n keys
const enTarget = '    financeTabAll: "All Records",';
const enRepl = `    financeTabAll: "All Records",
    partnershipTabOverview: "Overview",
    partnershipTabArms: "Partnership Arms",
    partnershipTabPartners: "Partners",
    partnershipTabContributions: "Contributions",
    partnershipTabHighlights: "Highlights",
    partnershipTabAnalytics: "Analytics",
    partnershipTabReports: "Reports",
    partnershipTabExports: "Exports",`;
if (!dash.includes('partnershipTabOverview: "Overview"')) {
  dash = dash.replace(enTarget, enRepl);
  console.log("1.2 EN i18n keys added");
}

// 1.3 Add PARTNERSHIP_NAV definition
const financeNavDef = `const FINANCE_TAB_ROUTES = new Set(FINANCE_NAV.routes.map(([route]) => route));`;
const partnershipNavDef = `const FINANCE_TAB_ROUTES = new Set(FINANCE_NAV.routes.map(([route]) => route));

const PARTNERSHIP_NAV = {
  parentKey: "partnershipHeader",
  label: "partnership",
  icon: "bi-stars",
  routes: [
    ["partnership", "bi-grid-1x2", "partnershipTabOverview"],
    ["partnershipArmsRoute", "bi-diagram-2", "partnershipTabArms"],
    ["partnershipPartnersRoute", "bi-people", "partnershipTabPartners"],
    ["partnershipContributionsRoute", "bi-cash-stack", "partnershipTabContributions"],
    ["partnershipHighlightsRoute", "bi-trophy", "partnershipTabHighlights"],
    ["partnershipAnalyticsRoute", "bi-graph-up-arrow", "partnershipTabAnalytics"],
    ["partnershipReportsRoute", "bi-file-earmark-bar-graph", "partnershipTabReports"],
    ["partnershipExportsRoute", "bi-download", "partnershipTabExports"]
  ]
};

const PARTNERSHIP_TAB_ROUTES = new Set(PARTNERSHIP_NAV.routes.map(([route]) => route));`;
if (!dash.includes('const PARTNERSHIP_NAV =')) {
  dash = dash.replace(financeNavDef, partnershipNavDef);
  console.log("1.3 PARTNERSHIP_NAV defined");
}

// 1.4 TAB_PARALLAX_ORDER and tabParallaxFamily
const parallaxOrderTarget = `  finance: ["finance", "financeEntriesRoute", "financePublicSubmissionsRoute", "financeVerificationRoute", "financeApprovedRequisitionsRoute", "financeReportsRoute", "financePartnersRoute", "financeExportsRoute"],`;
const parallaxOrderRepl = `  finance: ["finance", "financeEntriesRoute", "financePublicSubmissionsRoute", "financeVerificationRoute", "financeApprovedRequisitionsRoute", "financeReportsRoute", "financePartnersRoute", "financeExportsRoute"],
  partnership: ["partnership", "partnershipArmsRoute", "partnershipPartnersRoute", "partnershipContributionsRoute", "partnershipHighlightsRoute", "partnershipAnalyticsRoute", "partnershipReportsRoute", "partnershipExportsRoute"],`;
if (!dash.includes('partnership: ["partnership"')) {
  dash = dash.replace(parallaxOrderTarget, parallaxOrderRepl);
  console.log("1.4 TAB_PARALLAX_ORDER updated");
}

const parallaxFamilyTarget = `  if (FINANCE_TAB_ROUTES.has(route)) return "finance";`;
const parallaxFamilyRepl = `  if (FINANCE_TAB_ROUTES.has(route)) return "finance";
  if (PARTNERSHIP_TAB_ROUTES.has(route)) return "partnership";`;
if (!dash.includes('if (PARTNERSHIP_TAB_ROUTES.has(route)) return "partnership";')) {
  dash = dash.replace(parallaxFamilyTarget, parallaxFamilyRepl);
  console.log("1.4 tabParallaxFamily updated");
}

// 1.5 isModuleTabRoute
const isModuleTarget = `function isModuleTabRoute(route) {\n  return CELL_TAB_ROUTES.has(route) || FEVO_TAB_ROUTES.has(route) || FINANCE_TAB_ROUTES.has(route) || VENUE_TAB_ROUTES.has(route) || OUTREACH_TAB_ROUTES.has(route) || MEDIA_TAB_ROUTES.has(route);\n}`;
const isModuleRepl = `function isModuleTabRoute(route) {\n  return CELL_TAB_ROUTES.has(route) || FEVO_TAB_ROUTES.has(route) || FINANCE_TAB_ROUTES.has(route) || PARTNERSHIP_TAB_ROUTES.has(route) || VENUE_TAB_ROUTES.has(route) || OUTREACH_TAB_ROUTES.has(route) || MEDIA_TAB_ROUTES.has(route);\n}`;
if (!dash.includes('PARTNERSHIP_TAB_ROUTES.has(route)')) {
  dash = dash.replace(isModuleTarget, isModuleRepl);
  console.log("1.5 isModuleTabRoute updated");
}

// 1.6 NAV_GROUPS - remove flat partnership
const navGroupsTarget = `  // Order: Células (subnav) → F.E.V.O (subnav) → Finanças (subnav) → Parcerias → Mídia (subnav) → Requisições → Inventário → Programas & Extensão (subnav)\n  { key: "departments", items: [["partnership", "bi-stars", "partnership"], ["requisitions", "bi-clipboard-check", "requisitions"], ["venueInventory", "bi-box-seam", "venueInventoryShort"]] },`;
const navGroupsRepl = `  // Order: Células (subnav) → F.E.V.O (subnav) → Finanças (subnav) → Parcerias (subnav) → Requisições → Inventário → Mídia (subnav) → Programas & Extensão (subnav)\n  { key: "departments", items: [["requisitions", "bi-clipboard-check", "requisitions"], ["venueInventory", "bi-box-seam", "venueInventoryShort"]] },`;
if (dash.includes(navGroupsTarget)) {
  dash = dash.replace(navGroupsTarget, navGroupsRepl);
  console.log("1.6 NAV_GROUPS updated");
}

// 1.7 Add renderPartnershipSidebarNav definition
const renderFinanceNavTarget = `function renderFinanceSidebarNav() {`;
const renderPartnershipNavCode = `function renderPartnershipSidebarNav() {
  const workspaceRoutes = roleWorkspaceRoutes();
  const parentExpanded = isSidebarGroupExpanded(PARTNERSHIP_NAV.parentKey);
  const parentActive = PARTNERSHIP_TAB_ROUTES.has(activeRoute) || activeRoute === "partnership";
  const visibleRoutes = PARTNERSHIP_NAV.routes.filter(([route]) => {
    if (workspaceRoutes && !workspaceRoutes.includes(route) && !workspaceRoutes.includes("partnership")) return false;
    const nav = resolveRouteAccess(route);
    return nav.visible && !nav.locked;
  });
  if (!visibleRoutes.length) return "";
  return \`
    <div class="nav-cell-branch nav-partnership-branch \${parentExpanded ? "is-expanded" : ""} \${parentActive ? "has-active" : ""}" data-nav-group="\${PARTNERSHIP_NAV.parentKey}">
      <button type="button" class="nav-cell-parent nav-partnership-parent" aria-expanded="\${parentExpanded}" aria-label="\${L("navGroupToggle")}: \${L(PARTNERSHIP_NAV.label)}">
        <i class="bi \${PARTNERSHIP_NAV.icon}" aria-hidden="true"></i>
        <span>\${L(PARTNERSHIP_NAV.label)}</span>
        <i class="bi bi-chevron-down nav-cell-chevron" aria-hidden="true"></i>
      </button>
      <div class="nav-cell-body">
        <div class="nav-cell-body-inner">
          \${visibleRoutes.map(([route, icon, label]) => \`
            <button type="button" class="nav-cell-item nav-partnership-item \${activeRoute === route || (route === "partnership" && (activeRoute === "partnership" || activeRoute === "partnershipOverviewRoute")) ? "active" : ""}" data-route="\${route}" onclick="window.setRoute && window.setRoute('\${route}'); return false;" title="\${L(label)}">
              <i class="bi \${sidebarIcon(icon, route)} me-2" aria-hidden="true"></i>
              <span>\${L(label)}</span>
            </button>
          \`).join("")}
        </div>
      </div>
    </div>\`;
}

`;
if (!dash.includes('function renderPartnershipSidebarNav()')) {
  dash = dash.replace(renderFinanceNavTarget, renderPartnershipNavCode + renderFinanceNavTarget);
  console.log("1.7 renderPartnershipSidebarNav function added");
}

// 1.8 renderShell - compute partnershipNav and interpolate into DOM
const renderShellTarget = `    const financeNav = group.key === "departments" && (!workspaceRoutes || workspaceRoutes.some((r) => FINANCE_TAB_ROUTES.has(r) || r === "finance")) ? renderFinanceSidebarNav() : "";
    const mediaNav =`;
const renderShellRepl = `    const financeNav = group.key === "departments" && (!workspaceRoutes || workspaceRoutes.some((r) => FINANCE_TAB_ROUTES.has(r) || r === "finance")) ? renderFinanceSidebarNav() : "";
    const partnershipNav = group.key === "departments" && (!workspaceRoutes || workspaceRoutes.some((r) => PARTNERSHIP_TAB_ROUTES.has(r) || r === "partnership")) ? renderPartnershipSidebarNav() : "";
    const mediaNav =`;
if (!dash.includes('const partnershipNav =')) {
  dash = dash.replace(renderShellTarget, renderShellRepl);
  console.log("1.8 partnershipNav computed in renderShell");
}

const renderShellBodyTarget = `        <div class="nav-group-body-inner">
          \${cellNav}
          \${fevoNav}
          \${financeNav}
          \${navItems}`;
const renderShellBodyRepl = `        <div class="nav-group-body-inner">
          \${cellNav}
          \${fevoNav}
          \${financeNav}
          \${partnershipNav}
          \${navItems}`;
if (!dash.includes('${partnershipNav}')) {
  dash = dash.replace(renderShellBodyTarget, renderShellBodyRepl);
  console.log("1.8 partnershipNav interpolated in nav-group-body-inner");
}

const renderShellGuardTarget = `    if (!navItems && !cellNav && !fevoNav && !financeNav && !mediaNav && !outreachNav) return "";`;
const renderShellGuardRepl = `    if (!navItems && !cellNav && !fevoNav && !financeNav && !partnershipNav && !mediaNav && !outreachNav) return "";`;
if (dash.includes(renderShellGuardTarget)) {
  dash = dash.replace(renderShellGuardTarget, renderShellGuardRepl);
  console.log("1.8 renderShell guard updated with partnershipNav");
}

// 1.9 childRoutes in setRoute
const childRoutesTarget = `    financeExportsRoute: ["departments", "financeTabExports"],`;
const childRoutesRepl = `    financeExportsRoute: ["departments", "financeTabExports"],
    partnershipOverviewRoute: ["departments", "partnershipTabOverview"],
    partnershipArmsRoute: ["departments", "partnershipTabArms"],
    partnershipPartnersRoute: ["departments", "partnershipTabPartners"],
    partnershipContributionsRoute: ["departments", "partnershipTabContributions"],
    partnershipHighlightsRoute: ["departments", "partnershipTabHighlights"],
    partnershipAnalyticsRoute: ["departments", "partnershipTabAnalytics"],
    partnershipReportsRoute: ["departments", "partnershipTabReports"],
    partnershipExportsRoute: ["departments", "partnershipTabExports"],`;
if (!dash.includes('partnershipOverviewRoute: ["departments", "partnershipTabOverview"]')) {
  dash = dash.replace(childRoutesTarget, childRoutesRepl);
  console.log("1.9 childRoutes updated with partnership subroutes");
}

// 1.10 setRoute auto-expand
const autoExpandTarget = `  if (FINANCE_TAB_ROUTES.has(activeRoute) || activeRoute === "finance") {
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
const autoExpandRepl = `  if (FINANCE_TAB_ROUTES.has(activeRoute) || activeRoute === "finance") {
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
  }
  if (PARTNERSHIP_TAB_ROUTES.has(activeRoute) || activeRoute === "partnership") {
    sidebarGroupState[PARTNERSHIP_NAV.parentKey] = true;
    sidebarGroupState.departments = true;
    localStorage.setItem(SIDEBAR_GROUPS_KEY, JSON.stringify(sidebarGroupState));
    const deptGroup = document.querySelector('[data-nav-group="departments"]');
    if (deptGroup && !deptGroup.classList.contains("is-expanded")) {
      deptGroup.classList.add("is-expanded");
    }
    const partGroup = document.querySelector(\`[data-nav-group="\${PARTNERSHIP_NAV.parentKey}"]\`);
    if (partGroup && !partGroup.classList.contains("is-expanded")) {
      partGroup.classList.add("is-expanded");
    }
  }`;
if (!dash.includes('PARTNERSHIP_TAB_ROUTES.has(activeRoute) || activeRoute === "partnership"')) {
  dash = dash.replace(autoExpandTarget, autoExpandRepl);
  console.log("1.10 setRoute auto-expand updated for partnership");
}

// 1.11 setRoute renderers mapping
const renderersTarget = `    partnership: () => {
      if (typeof hydratePartnershipArms === "function") void hydratePartnershipArms();
      return typeof renderPartnerships === "function" ? renderPartnerships() : renderSimple("partnership", L("partnership"), state.partnership);
    },`;
const renderersRepl = `    partnership: () => {
      if (typeof hydratePartnershipArms === "function") void hydratePartnershipArms();
      if (typeof setPartnershipTab === "function") setPartnershipTab("overview");
      else if (typeof renderPartnerships === "function") renderPartnerships("overview");
      else renderSimple("partnership", L("partnership"), state.partnership);
    },
    partnershipOverviewRoute: () => {
      if (typeof hydratePartnershipArms === "function") void hydratePartnershipArms();
      if (typeof setPartnershipTab === "function") setPartnershipTab("overview");
      else if (typeof renderPartnerships === "function") renderPartnerships("overview");
    },
    partnershipArmsRoute: () => {
      if (typeof hydratePartnershipArms === "function") void hydratePartnershipArms();
      if (typeof setPartnershipTab === "function") setPartnershipTab("arms");
      else if (typeof renderPartnerships === "function") renderPartnerships("arms");
    },
    partnershipPartnersRoute: () => {
      if (typeof hydratePartnershipArms === "function") void hydratePartnershipArms();
      if (typeof setPartnershipTab === "function") setPartnershipTab("partners");
      else if (typeof renderPartnerships === "function") renderPartnerships("partners");
    },
    partnershipContributionsRoute: () => {
      if (typeof hydratePartnershipArms === "function") void hydratePartnershipArms();
      if (typeof setPartnershipTab === "function") setPartnershipTab("contributions");
      else if (typeof renderPartnerships === "function") renderPartnerships("contributions");
    },
    partnershipHighlightsRoute: () => {
      if (typeof hydratePartnershipArms === "function") void hydratePartnershipArms();
      if (typeof setPartnershipTab === "function") setPartnershipTab("highlights");
      else if (typeof renderPartnerships === "function") renderPartnerships("highlights");
    },
    partnershipAnalyticsRoute: () => {
      if (typeof hydratePartnershipArms === "function") void hydratePartnershipArms();
      if (typeof setPartnershipTab === "function") setPartnershipTab("analytics");
      else if (typeof renderPartnerships === "function") renderPartnerships("analytics");
    },
    partnershipReportsRoute: () => {
      if (typeof hydratePartnershipArms === "function") void hydratePartnershipArms();
      if (typeof setPartnershipTab === "function") setPartnershipTab("reports");
      else if (typeof renderPartnerships === "function") renderPartnerships("reports");
    },
    partnershipExportsRoute: () => {
      if (typeof hydratePartnershipArms === "function") void hydratePartnershipArms();
      if (typeof setPartnershipTab === "function") setPartnershipTab("exports");
      else if (typeof renderPartnerships === "function") renderPartnerships("exports");
    },`;
if (!dash.includes('partnershipOverviewRoute: () =>')) {
  dash = dash.replace(renderersTarget, renderersRepl);
  console.log("1.11 setRoute renderers updated for all partnership subroutes");
}

if (isDashCRLF) dash = dash.replace(/\n/g, '\r\n');
fs.writeFileSync(dashPath, dash, 'utf8');
console.log("js/dashboard.js successfully patched!");


// --- 2. Patch js/partnerships-module.js ---
const partPath = path.resolve('js/partnerships-module.js');
let part = fs.readFileSync(partPath, 'utf8');
const isPartCRLF = part.includes('\r\n');
if (isPartCRLF) part = part.replace(/\r\n/g, '\n');

// 2.1 Update renderPartnerships to accept optional targetTab
const renderPartTarget = `  function renderPartnerships() {\n    const access = partnershipAccess();`;
const renderPartRepl = `  function renderPartnerships(targetTab) {
    if (targetTab && typeof targetTab === "string") {
      partnershipPageState.tab = targetTab;
    }
    const access = partnershipAccess();`;
if (!part.includes('function renderPartnerships(targetTab)')) {
  part = part.replace(renderPartTarget, renderPartRepl);
  console.log("2.1 renderPartnerships updated to accept targetTab");
}

// 2.2 Remove tabsHtml() from renderPartnerships setPageContent
const setPageTarget = `    if (typeof setPageContent === "function") {\n      setPageContent(\`\${header}\${tabsHtml()}\${periodSelect}<div class="partnership-body">\${body}</div>\`);\n    }`;
const setPageRepl = `    if (typeof setPageContent === "function") {\n      setPageContent(\`\${header}\${periodSelect}<div class="partnership-body">\${body}</div>\`);\n    }`;
if (part.includes(setPageTarget)) {
  part = part.replace(setPageTarget, setPageRepl);
  console.log("2.2 tabsHtml removed from renderPartnerships");
}

// 2.3 Update jump and arm actions to use setRoute
const jumpTarget = `      const jump = event.target.closest("[data-partnership-jump]");
      if (jump) {
        const route = jump.getAttribute("data-partnership-route");
        if (route && typeof setRoute === "function") {
          setRoute(route);
          return;
        }
        const tab = jump.getAttribute("data-partnership-jump");
        const armId = jump.getAttribute("data-partnership-arm");
        if (armId) partnershipPageState.armId = armId;
        if (tab) partnershipPageState.tab = tab;
        renderPartnerships();
        return;
      }`;

const jumpRepl = `      const jump = event.target.closest("[data-partnership-jump]");
      if (jump) {
        const route = jump.getAttribute("data-partnership-route");
        if (route && typeof setRoute === "function") {
          setRoute(route);
          return;
        }
        const tab = jump.getAttribute("data-partnership-jump");
        const armId = jump.getAttribute("data-partnership-arm");
        if (armId) partnershipPageState.armId = armId;
        if (tab) {
          const tabToRoute = {
            overview: "partnership",
            arms: "partnershipArmsRoute",
            partners: "partnershipPartnersRoute",
            contributions: "partnershipContributionsRoute",
            highlights: "partnershipHighlightsRoute",
            analytics: "partnershipAnalyticsRoute",
            reports: "partnershipReportsRoute",
            exports: "partnershipExportsRoute"
          };
          if (tabToRoute[tab] && typeof setRoute === "function") {
            setRoute(tabToRoute[tab]);
            return;
          }
          partnershipPageState.tab = tab;
        }
        renderPartnerships();
        return;
      }`;
if (!part.includes('const tabToRoute = {')) {
  part = part.replace(jumpTarget, jumpRepl);
  console.log("2.3 jump handler updated to use setRoute");
}

const armActionsTarget = `      const armPartners = event.target.closest("[data-partnership-arm-partners]");
      if (armPartners) {
        partnershipPageState.armId = armPartners.getAttribute("data-partnership-arm-partners") || "";
        partnershipPageState.tab = "partners";
        renderPartnerships();
        return;
      }
      const armReport = event.target.closest("[data-partnership-arm-report]");
      if (armReport) {
        partnershipPageState.armId = armReport.getAttribute("data-partnership-arm-report") || "";
        partnershipPageState.tab = "reports";
        renderPartnerships();
        return;
      }`;

const armActionsRepl = `      const armPartners = event.target.closest("[data-partnership-arm-partners]");
      if (armPartners) {
        partnershipPageState.armId = armPartners.getAttribute("data-partnership-arm-partners") || "";
        if (typeof setRoute === "function") setRoute("partnershipPartnersRoute");
        else {
          partnershipPageState.tab = "partners";
          renderPartnerships();
        }
        return;
      }
      const armReport = event.target.closest("[data-partnership-arm-report]");
      if (armReport) {
        partnershipPageState.armId = armReport.getAttribute("data-partnership-arm-report") || "";
        if (typeof setRoute === "function") setRoute("partnershipReportsRoute");
        else {
          partnershipPageState.tab = "reports";
          renderPartnerships();
        }
        return;
      }`;
if (part.includes(armActionsTarget)) {
  part = part.replace(armActionsTarget, armActionsRepl);
  console.log("2.3 arm action handlers updated to use setRoute");
}

// 2.4 Expose setPartnershipTab
const globalExportsTarget = `  global.partnershipPageState = partnershipPageState;
  global.renderPartnerships = renderPartnerships;`;
const globalExportsRepl = `  global.partnershipPageState = partnershipPageState;
  global.renderPartnerships = renderPartnerships;
  global.setPartnershipTab = function setPartnershipTab(tab) {
    partnershipPageState.tab = tab || "overview";
    renderPartnerships();
  };`;
if (!part.includes('global.setPartnershipTab =')) {
  part = part.replace(globalExportsTarget, globalExportsRepl);
  console.log("2.4 setPartnershipTab exposed globally");
}

if (isPartCRLF) part = part.replace(/\n/g, '\r\n');
fs.writeFileSync(partPath, part, 'utf8');
console.log("js/partnerships-module.js successfully patched!");
