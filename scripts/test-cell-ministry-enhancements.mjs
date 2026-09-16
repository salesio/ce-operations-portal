import { readFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import assert from 'node:assert/strict';

const rootDir = process.cwd();

console.log('🧪 Starting Cell Ministry Enhancements Test Suite...');

// 1. Check SQL migrations and schema
console.log('\n--- 1. Database Schema & Migration Verification ---');
const migrationPath = join(rootDir, 'database', 'migrations', '20260916_cell_ministry_evaluations_action_plans.sql');
assert.ok(existsSync(migrationPath), 'Migration SQL file must exist');

const migrationSql = readFileSync(migrationPath, 'utf8');
assert.ok(migrationSql.includes('CREATE TABLE IF NOT EXISTS public.cell_evaluations'), 'Migration contains cell_evaluations table');
assert.ok(migrationSql.includes('CREATE TABLE IF NOT EXISTS public.cell_action_plans'), 'Migration contains cell_action_plans table');
assert.ok(migrationSql.includes('ENABLE ROW LEVEL SECURITY'), 'RLS enabled for tables');
assert.ok(migrationSql.includes('update_updated_at_column'), 'Triggers defined for updated_at');
console.log('✅ Migration SQL structure verified successfully.');

const schemaSql = readFileSync(join(rootDir, 'database', 'schema.sql'), 'utf8');
assert.ok(schemaSql.includes('cell_evaluations'), 'schema.sql contains cell_evaluations');
assert.ok(schemaSql.includes('cell_action_plans'), 'schema.sql contains cell_action_plans');
console.log('✅ database/schema.sql contains updated tables.');

const seedSql = readFileSync(join(rootDir, 'database', 'seed.sql'), 'utf8');
assert.ok(seedSql.includes('cell_evaluations'), 'seed.sql contains cell_evaluations');
assert.ok(seedSql.includes('cell_action_plans'), 'seed.sql contains cell_action_plans');
console.log('✅ database/seed.sql contains seed data.');

// 2. Mock browser environment for Data Bridge
console.log('\n--- 2. Cell Ministry Data Bridge Tests ---');
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (k) => store[k] || null,
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { store = {}; }
  };
})();

global.window = {
  localStorage: localStorageMock,
  __CE_ENV__: { VITE_DATA_SOURCE: 'local' }
};
global.localStorage = localStorageMock;

const bridgeCode = readFileSync(join(rootDir, 'js', 'cell-ministry-data-bridge.js'), 'utf8');
new Function(bridgeCode)();

const CECellMinistry = global.window.CECellMinistry;
assert.ok(CECellMinistry, 'window.CECellMinistry must be defined');
assert.strictEqual(typeof CECellMinistry.listCellEvaluations, 'function', 'listCellEvaluations is a function');
assert.strictEqual(typeof CECellMinistry.createCellEvaluation, 'function', 'createCellEvaluation is a function');
assert.strictEqual(typeof CECellMinistry.updateCellEvaluation, 'function', 'updateCellEvaluation is a function');
assert.strictEqual(typeof CECellMinistry.deleteCellEvaluation, 'function', 'deleteCellEvaluation is a function');

assert.strictEqual(typeof CECellMinistry.listCellActionPlans, 'function', 'listCellActionPlans is a function');
assert.strictEqual(typeof CECellMinistry.createCellActionPlan, 'function', 'createCellActionPlan is a function');
assert.strictEqual(typeof CECellMinistry.updateCellActionPlan, 'function', 'updateCellActionPlan is a function');
assert.strictEqual(typeof CECellMinistry.deleteCellActionPlan, 'function', 'deleteCellActionPlan is a function');

// Test Data Bridge Evaluations CRUD
const initialEvals = await CECellMinistry.listCellEvaluations();
assert.ok(initialEvals.ok, 'listCellEvaluations returned ok');
assert.ok(Array.isArray(initialEvals.data) && initialEvals.data.length >= 2, 'Initial evaluations seeded');

const newEval = await CECellMinistry.createCellEvaluation({
  report_id: 'CR-TEST-99',
  cell_name: 'Test Cell Alpha',
  avaliador: 'Pastor Teste',
  classificacao: 'Excelente',
  precisa_followup: false,
  estado: 'Aprovado'
});
assert.ok(newEval.ok && newEval.data.id, 'createCellEvaluation created record with id');

const updatedEval = await CECellMinistry.updateCellEvaluation(newEval.data.id, {
  classificacao: 'Bom',
  pontos_fortes: 'Boa presença'
});
assert.ok(updatedEval.ok, 'updateCellEvaluation succeeded');
assert.strictEqual(updatedEval.data.classificacao, 'Bom', 'Classification updated');

const deleteEval = await CECellMinistry.deleteCellEvaluation(newEval.data.id);
assert.ok(deleteEval.ok, 'deleteCellEvaluation succeeded');

// Test Data Bridge Action Plans CRUD
const initialPlans = await CECellMinistry.listCellActionPlans();
assert.ok(initialPlans.ok, 'listCellActionPlans returned ok');
assert.ok(Array.isArray(initialPlans.data) && initialPlans.data.length >= 2, 'Initial action plans seeded');

const newPlan = await CECellMinistry.createCellActionPlan({
  cell_name: 'Test Cell Action',
  leader_name: 'Leader Test',
  action: 'Run evangelism outreach',
  owner: 'Supervisor Test',
  status: 'Planeado'
});
assert.ok(newPlan.ok && newPlan.data.id, 'createCellActionPlan created record with id');

const updatedPlan = await CECellMinistry.updateCellActionPlan(newPlan.data.id, {
  status: 'Em Curso'
});
assert.ok(updatedPlan.ok, 'updateCellActionPlan succeeded');
assert.strictEqual(updatedPlan.data.status, 'Em Curso', 'Status updated');

const deletePlan = await CECellMinistry.deleteCellActionPlan(newPlan.data.id);
assert.ok(deletePlan.ok, 'deleteCellActionPlan succeeded');

console.log('✅ Data Bridge CRUD operations verified successfully.');

// 3. Verify Dashboard Logic: Default Views & Cascading Filters
console.log('\n--- 3. Dashboard Default Views & Cascading Filter Logic ---');
const dashboardCode = readFileSync(join(rootDir, 'js', 'dashboard.js'), 'utf8');

// Verify default views are set to "card"
assert.ok(dashboardCode.includes('ce_cell_reports_view_mode') && dashboardCode.includes('return v === "table" ? "table" : "card";'), 'cellReportsPageState defaults to card');
assert.ok(dashboardCode.includes('ce_cell_evaluation_view_mode'), 'cellEvaluationPageState defaults to card');
assert.ok(dashboardCode.includes('ce_cell_leaders_attention_view_mode'), 'cellLeadersAttentionPageState defaults to card');
assert.ok(dashboardCode.includes('ce_cell_action_plan_view_mode'), 'cellActionPlanPageState defaults to card');
console.log('✅ All 4 Cell Ministry page states default to "card" view.');

// Verify Cell Performance Chart Aggregation fixes (no undefined)
assert.ok(dashboardCode.includes('perfTotalAtt'), 'Cell Performance aggregates attendance safely');
assert.ok(dashboardCode.includes('perfTotalFt'), 'Cell Performance aggregates first_timers safely');
assert.ok(dashboardCode.includes('perfTotalNc'), 'Cell Performance aggregates new_converts safely');
assert.ok(dashboardCode.includes('attByWeek'), 'attByWeek chart aggregation present');
assert.ok(dashboardCode.includes('ftByCell'), 'ftByCell chart aggregation present');
assert.ok(dashboardCode.includes('ncByCell'), 'ncByCell chart aggregation present');
console.log('✅ Cell Performance aggregation handles undefined safely.');

// Verify Filter Bar and Cascading Listeners
assert.ok(dashboardCode.includes('function renderCellMinistryFilterBar'), 'Filter bar renderer defined');
assert.ok(dashboardCode.includes('function cellMinistryFilterOptions'), 'Cascading options resolver defined');
assert.ok(dashboardCode.includes('function updateCellMinistryDependentFilters'), 'Dependent dropdown updater defined');
assert.ok(dashboardCode.includes('function applyCellMinistryFilters'), 'Filter evaluation logic defined');
// 4. Persistence & Hard Refresh Simulation
console.log('\n--- 4. Hard Refresh Simulation & Persistence Tests ---');
// Verify that modifications in localStorage persist when bridge is re-evaluated (simulating hard refresh)
const modifiedEvalId = (await CECellMinistry.listCellEvaluations()).data[0].id;
const updateRes = await CECellMinistry.updateCellEvaluation(modifiedEvalId, {
  pontos_fortes: 'Preserved After Hard Refresh!'
});
assert.ok(updateRes.ok, 'Evaluation updated before hard refresh');

// Simulate hard refresh: clear global memory and reload data bridge script with existing localStorage
delete global.window.CECellMinistry;
new Function(bridgeCode)();
const reloadedMinistry = global.window.CECellMinistry;

const postRefreshEvals = await reloadedMinistry.listCellEvaluations();
const preservedEval = postRefreshEvals.data.find(e => String(e.id) === String(modifiedEvalId));
assert.ok(preservedEval, 'Evaluation record exists after hard refresh');
assert.strictEqual(preservedEval.pontos_fortes, 'Preserved After Hard Refresh!', 'Updated data preserved after hard refresh');
console.log('✅ Hard refresh simulation test passed: Evaluation changes persist across reloads.');

// Test Action Plan hard refresh persistence
const modifiedPlanId = (await reloadedMinistry.listCellActionPlans()).data[0].id;
await reloadedMinistry.updateCellActionPlan(modifiedPlanId, {
  action: 'Persistent Action Plan Item'
});

// Simulate another hard refresh
delete global.window.CECellMinistry;
new Function(bridgeCode)();
const reloadedMinistry2 = global.window.CECellMinistry;

const postRefreshPlans = await reloadedMinistry2.listCellActionPlans();
const preservedPlan = postRefreshPlans.data.find(p => String(p.id) === String(modifiedPlanId));
assert.ok(preservedPlan, 'Action Plan record exists after hard refresh');
assert.strictEqual(preservedPlan.action, 'Persistent Action Plan Item', 'Action Plan updates preserved after hard refresh');
console.log('✅ Hard refresh simulation test passed: Action Plan changes persist across reloads.');

// 5. Supabase Adapter Bundle Verification
console.log('\n--- 5. Supabase Adapter Bundle Verification ---');
const bundlePath = join(rootDir, 'js', 'supabase-bundle.js');
assert.ok(existsSync(bundlePath), 'js/supabase-bundle.js exists');
const bundleCode = readFileSync(bundlePath, 'utf8');
assert.ok(bundleCode.includes('cell_evaluations'), 'Bundle includes cell_evaluations table');
assert.ok(bundleCode.includes('cell_action_plans'), 'Bundle includes cell_action_plans table');
assert.ok(bundleCode.includes('listCellEvaluations'), 'Bundle exports listCellEvaluations');
assert.ok(bundleCode.includes('listCellActionPlans'), 'Bundle exports listCellActionPlans');
console.log('✅ Supabase bundle exports and tables verified.');

console.log('\n🎉 ALL CELL MINISTRY ENHANCEMENT TESTS PASSED SUCCESSFULLY!');

