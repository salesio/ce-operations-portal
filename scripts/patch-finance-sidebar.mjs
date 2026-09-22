import fs from 'fs';
import path from 'path';

const filePath = path.resolve('js/dashboard.js');
let code = fs.readFileSync(filePath, 'utf8');
const isCRLF = code.includes('\r\n');
if (isCRLF) {
  code = code.replace(/\r\n/g, '\n');
}

// 1. TAB_PARALLAX_ORDER
const target1 = `  fevo: ["fevo", "fevoConfigRoute", "fevoFollowUpRoute", "fevoEvangelismRoute", "fevoVisitationRoute", "fevoPrayerRoute", "fevoNoReportsRoute", "fevoWeeklyReportsRoute", "fevoAnalysisRoute"],\n  venue:`;
const repl1 = `  fevo: ["fevo", "fevoConfigRoute", "fevoFollowUpRoute", "fevoEvangelismRoute", "fevoVisitationRoute", "fevoPrayerRoute", "fevoNoReportsRoute", "fevoWeeklyReportsRoute", "fevoAnalysisRoute"],\n  finance: ["finance", "financeEntriesRoute", "financePublicSubmissionsRoute", "financeVerificationRoute", "financeApprovedRequisitionsRoute", "financeReportsRoute", "financePartnersRoute", "financeExportsRoute"],\n  venue:`;
if (!code.includes('finance: ["finance", "financeEntriesRoute"')) {
  if (code.includes(target1)) {
    code = code.replace(target1, repl1);
    console.log("1. TAB_PARALLAX_ORDER updated");
  } else {
    console.warn("1. Target 1 not found");
  }
} else {
  console.log("1. Already has finance in TAB_PARALLAX_ORDER");
}

// 2. tabParallaxFamily
const target2 = `function tabParallaxFamily(route) {\n  if (CELL_TAB_ROUTES.has(route)) return "cell";\n  if (FEVO_TAB_ROUTES.has(route)) return "fevo";\n  if (VENUE_TAB_ROUTES.has(route)) return "venue";`;
const repl2 = `function tabParallaxFamily(route) {\n  if (CELL_TAB_ROUTES.has(route)) return "cell";\n  if (FEVO_TAB_ROUTES.has(route)) return "fevo";\n  if (FINANCE_TAB_ROUTES.has(route)) return "finance";\n  if (VENUE_TAB_ROUTES.has(route)) return "venue";`;
if (!code.includes('if (FINANCE_TAB_ROUTES.has(route)) return "finance";')) {
  if (code.includes(target2)) {
    code = code.replace(target2, repl2);
    console.log("2. tabParallaxFamily updated");
  } else {
    console.warn("2. Target 2 not found");
  }
} else {
  console.log("2. Already has finance in tabParallaxFamily");
}

// 3. isModuleTabRoute
const target3 = `function isModuleTabRoute(route) {\n  return CELL_TAB_ROUTES.has(route) || FEVO_TAB_ROUTES.has(route) || VENUE_TAB_ROUTES.has(route) || OUTREACH_TAB_ROUTES.has(route) || MEDIA_TAB_ROUTES.has(route);\n}`;
const repl3 = `function isModuleTabRoute(route) {\n  return CELL_TAB_ROUTES.has(route) || FEVO_TAB_ROUTES.has(route) || FINANCE_TAB_ROUTES.has(route) || VENUE_TAB_ROUTES.has(route) || OUTREACH_TAB_ROUTES.has(route) || MEDIA_TAB_ROUTES.has(route);\n}`;
if (!code.includes('FINANCE_TAB_ROUTES.has(route)')) {
  if (code.includes(target3)) {
    code = code.replace(target3, repl3);
    console.log("3. isModuleTabRoute updated");
  } else {
    console.warn("3. Target 3 not found");
  }
} else {
  console.log("3. Already has FINANCE_TAB_ROUTES in isModuleTabRoute");
}

// 4. NAV_GROUPS
const target4 = `  // Order: Células (subnav) → F.E.V.O (subnav) → Finanças → Parcerias → Mídia (subnav) → Requisições → Inventário → Programas & Extensão (subnav)\n  { key: "departments", items: [["finance", "bi-cash-coin", "finance"], ["partnership", "bi-stars", "partnership"], ["requisitions", "bi-clipboard-check", "requisitions"], ["venueInventory", "bi-box-seam", "venueInventoryShort"]] },`;
const repl4 = `  // Order: Células (subnav) → F.E.V.O (subnav) → Finanças (subnav) → Parcerias → Mídia (subnav) → Requisições → Inventário → Programas & Extensão (subnav)\n  { key: "departments", items: [["partnership", "bi-stars", "partnership"], ["requisitions", "bi-clipboard-check", "requisitions"], ["venueInventory", "bi-box-seam", "venueInventoryShort"]] },`;
if (code.includes(target4)) {
  code = code.replace(target4, repl4);
  console.log("4. NAV_GROUPS updated");
} else {
  console.log("4. NAV_GROUPS already updated or target pattern differs");
}

// 5. renderShell - interpolate financeNav
const target5 = `      <div class="nav-group-body">\n        <div class="nav-group-body-inner">\n          \${cellNav}\n          \${fevoNav}\n          \${navItems}\n          \${mediaNav}\n          \${outreachNav}\n        </div>\n      </div>`;
const repl5 = `      <div class="nav-group-body">\n        <div class="nav-group-body-inner">\n          \${cellNav}\n          \${fevoNav}\n          \${financeNav}\n          \${navItems}\n          \${mediaNav}\n          \${outreachNav}\n        </div>\n      </div>`;
if (!code.includes('${financeNav}')) {
  if (code.includes(target5)) {
    code = code.replace(target5, repl5);
    console.log("5. renderShell updated with financeNav");
  } else {
    console.warn("5. Target 5 not found");
  }
} else {
  console.log("5. renderShell already contains financeNav");
}

// 6. renderFinance - remove financeModuleTabs
const target6 = `  setPageContent(\`\n    \${sectionHeader(L("finance"), L("financeSubtitle"), "finance", "bi-cash-coin")}\n    <article class="panel glass-panel module-content-card mb-4">\n      \${financeModuleTabs()}\n      <div class="tab-content-panel">\${tabContent}</div>\n    </article>\n  \`);`;
const repl6 = `  setPageContent(\`\n    \${sectionHeader(L("finance"), L("financeSubtitle"), "finance", "bi-cash-coin")}\n    <article class="panel glass-panel module-content-card mb-4">\n      <div class="tab-content-panel">\${tabContent}</div>\n    </article>\n  \`);`;
if (code.includes(target6)) {
  code = code.replace(target6, repl6);
  console.log("6. renderFinance updated without horizontal tabs");
} else {
  console.log("6. renderFinance already updated");
}

if (isCRLF) {
  code = code.replace(/\n/g, '\r\n');
}

fs.writeFileSync(filePath, code, 'utf8');
console.log("Finished patching js/dashboard.js successfully!");
