/** Smoke checks for the assignment-scoped independent Cell Leader Portal. */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFileSync(join(root, file), "utf8");
const dashboard = read("js/dashboard.js");
const access = read("js/access-control.js");
const permissions = read("src/data/seeds/permissionsSeed.ts");
const css = read("css/dashboard.css");
const index = read("index.html");
const portalStart = dashboard.indexOf("function renderCellLeaderPortal()");
const portalEnd = dashboard.indexOf("window.renderCellLeaderPortal", portalStart);
const portal = dashboard.slice(portalStart, portalEnd);
let passed = 0;
let failed = 0;
const check = (name, condition) => {
  if (condition) { passed += 1; console.log(`PASS  ${name}`); }
  else { failed += 1; console.error(`FAIL  ${name}`); }
};

check("independent route exists", /cellPortal:\s*renderCellLeaderPortal/.test(dashboard) && /"cell-portal":\s*"cellPortal"/.test(dashboard));
check("unauthenticated portal redirects to login", /function renderCellLeaderPortal\(\)[\s\S]{0,300}!isUserAuthenticated[\s\S]{0,200}showLoginView/.test(dashboard));
check("context helper exists", /function getCellLeaderContext\(userId/.test(dashboard) && /authorized_cell_ids/.test(dashboard));
check("cell access guard exists", /function canAccessCell\(userId, cellId\)/.test(dashboard) && /cell_portal_access_denied/.test(dashboard));
check("leader and assistant use assignments", /function getAuthorizedCellsForUser/.test(dashboard) && /primary_leader_user_id/.test(dashboard) && /assistant_user_ids/.test(dashboard));
check("reviewer head and admin scoped", /Cell Ministry Reviewer/.test(dashboard) && /Cell Ministry Head/.test(dashboard) && /Super Admin/.test(dashboard) && /canChooseCell/.test(portal));
check("no assignment message exact", dashboard.includes("Nenhuma célula está atribuída ao seu utilizador.") && dashboard.includes("No cell is assigned to your user."));
check("portal permissions declared", ["view", "view_members", "view_member_profile", "submit_report", "view_finance_summary", "view_partnership_summary", "view_soul_winning", "view_programs", "view_charts", "export_summary"].every((code) => dashboard.includes(`cell_portal.${code}`) && permissions.includes(`cell_portal.${code}`)));
check("access control route and roles", /cellPortal:\s*"dashboard"/.test(access) && ["Cell Leader", "Cell Assistant", "Cell Ministry Reviewer"].every((role) => access.includes(`"${role}"`)));
check("read-only aggregation helpers", ["getCellDashboardStats", "getCellMembersProfile", "getCellMemberSpiritualProgress", "getCellMemberFinanceSummary", "getCellSoulWinningStats", "getCellFoundationProgress", "getCellSacramentsSummary", "getCellProgramsUpcoming", "getCellReportTrends", "getCellAlerts"].every((name) => dashboard.includes(`function ${name}`) && dashboard.includes(`window.${name}`)));
check("member profile is sanitized", /exclui notas de aconselhamento, salários, documentos, comprovativos/.test(dashboard) && !/counseling\.cases/.test(portal));
check("finance only verified income", /verified\|validado\|aprovado/.test(dashboard) && /expense\|despesa/.test(dashboard));
check("portal does not create finance records", !/createFinanceRecord/.test(portal) && /não cria financeRecord/.test(portal));
check("no proof or document fields exported", !/proof_url|file_url|document_url|salary_or_allowance/.test(portal));
check("weekly report integrated", /data-public-cell-report/.test(portal) && /Pending Finance Review/.test(portal));
check("charts and indicators rendered", /cellPortalBars/.test(dashboard) && /cellPortalDonut/.test(dashboard) && /cell-portal-chart-grid/.test(portal));
check("members filters rendered", ["memberStatus", "foundationStatus", "partnership", "tithe", "invited"].every((filter) => dashboard.includes(`data-cell-portal-filter=\"${filter}\"`)));
check("live cell members use scoped pagination", /function loadCellPortalMembers\(cellId/.test(dashboard) && /listMembersPage\(\{ page: pageState\.page, pageSize: pageState\.pageSize, cellId \}\)/.test(dashboard) && /function cellPortalMemberSource\(cellId\)/.test(dashboard));
check("legacy imported cell names resolve safely", /function resolveLegacyCellPortalName\(repo, cell\)/.test(dashboard) && /cellNameLike: anchor/.test(dashboard) && /cellName: legacyName/.test(dashboard) && /resolvedCellName/.test(dashboard));
check("cell portal member paging controls rendered", /data-cell-portal-member-page=\"prev\"/.test(dashboard) && /data-cell-portal-member-page=\"next\"/.test(dashboard));
check("portal hydrates live cell context", /function ensureCellPortalContext\(\)/.test(dashboard) && /hydrateCellMinistryFromRepository\(\)/.test(dashboard) && /A carregar células e grupos do Supabase/.test(dashboard));
check("mobile portal prepared", /@media \(max-width: 700px\)/.test(css) && /td::before/.test(css));
check("leader lands in portal", /isCellPortalMember[\s\S]{0,220}setRoute\("cellPortal"\)/.test(dashboard));
check("admin dashboard hidden from leaders", /if \(\["Cell Leader", "Cell Assistant"\][\s\S]{0,500}sidebarNav/.test(dashboard));
check("cachebuster updated", /20260806-runtime-provider-v8/.test(index));
check("documentation exists", existsSync(join(root, "docs/backend/CELL_LEADER_PORTAL.md")));

console.log(`\nCell Leader Portal: ${passed} passed, ${failed} failed\n`);
process.exit(failed ? 1 : 0);
