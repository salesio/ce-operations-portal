/**
 * Verification Test: Staff Biometric Attendance & Punctuality System
 */
import assert from "node:assert";

// Sample biometric text provided by the user
const rawBiometricText = `Attendance Record,,,,
,,,,
Create Time:2026-07-09 09:39:33,,,SW:Start-Work|EW:End-Work,
Employee ID,Card No.,Name,Department,2026/07/09
,,,,SW - EW
1.0,,Leo,CESTAFF,"08:18 --:--
--:-- --:--
--:-- --:--
--:-- --:--"
2.0,,Marcelo,CESTAFF,"08:15 --:--
--:-- --:--
--:-- --:--
--:-- --:--"
3.0,,Deacon,CESTAFF,"08:29 --:--
--:-- --:--
--:-- --:--
--:-- --:--"
4.0,,Flavia,CESTAFF,"08:31 --:--
--:-- --:--
--:-- --:--
--:-- --:--"
5.0,,Gil,CESTAFF,"08:40 --:--
--:-- --:--
--:-- --:--
--:-- --:--"
7.0,0169895558,Pk,CESTAFF,"--:-- --:--
--:-- --:--
--:-- --:--
--:-- --:--"
10.0,,Valdemiro,CESTAFF,"08:16 --:--
--:-- --:--
--:-- --:--
--:-- --:--"
11.0,,Janet,CESTAFF,"09:03 --:--
--:-- --:--
--:-- --:--
--:-- --:--"
10000020.0,,Filipe,CESTAFF,"07:56 --:--
--:-- --:--
--:-- --:--
--:-- --:--"
10000021.0,,Virginia,CESTAFF,"09:20 --:--
--:-- --:--
--:-- --:--
--:-- --:--"`;

// Mock window and environment for testing data bridge
const localStorageStore = {};
global.localStorage = {
  getItem: (key) => localStorageStore[key] || null,
  setItem: (key, val) => { localStorageStore[key] = String(val); },
  removeItem: (key) => { delete localStorageStore[key]; },
};
global.window = {
  __CE_ENV__: {},
  CEDataLayer: {},
};

// Import attendance bridge code
import fs from "node:fs";
const bridgeCode = fs.readFileSync("js/attendance-data-bridge.js", "utf-8");
eval(bridgeCode);

const bridge = window.CEAttendanceBridge;
assert(bridge, "Attendance Bridge should be initialized on window.CEAttendanceBridge");

console.log("✔ Bridge initialized successfully");

// Test 1: Punctuality Status Calculation
const settings = {
  standard_start_time: "08:00",
  grace_period_minutes: 15,
  minor_delay_threshold_minutes: 30,
  severe_delay_threshold_minutes: 60,
};

// 07:56 -> On time (0 min delay)
const resFilipe = bridge.calculatePunctualityStatus("07:56", settings);
assert.strictEqual(resFilipe.status, "on_time", "07:56 should be on_time");
assert.strictEqual(resFilipe.is_late, false, "07:56 should not be late");
assert.strictEqual(resFilipe.delay_minutes, 0);

// 08:15 -> Grace Period (+15 min)
const resMarcelo = bridge.calculatePunctualityStatus("08:15", settings);
assert.strictEqual(resMarcelo.status, "grace_period", "08:15 should be grace_period");
assert.strictEqual(resMarcelo.is_late, false, "08:15 should not be counted as late");
assert.strictEqual(resMarcelo.delay_minutes, 15);

// 08:18 -> Minor delay (+18 min)
const resLeo = bridge.calculatePunctualityStatus("08:18", settings);
assert.strictEqual(resLeo.status, "minor_delay", "08:18 should be minor_delay");
assert.strictEqual(resLeo.is_late, true, "08:18 should be counted as late");
assert.strictEqual(resLeo.delay_minutes, 18);

// 08:40 -> Late (+40 min)
const resGil = bridge.calculatePunctualityStatus("08:40", settings);
assert.strictEqual(resGil.status, "late", "08:40 should be late");
assert.strictEqual(resGil.is_late, true, "08:40 should be late");
assert.strictEqual(resGil.delay_minutes, 40);

// 09:20 -> Severe Delay (+80 min)
const resVirginia = bridge.calculatePunctualityStatus("09:20", settings);
assert.strictEqual(resVirginia.status, "severe_delay", "09:20 should be severe_delay");
assert.strictEqual(resVirginia.is_late, true);
assert.strictEqual(resVirginia.delay_minutes, 80);

// --:-- -> Absent
const resPk = bridge.calculatePunctualityStatus("--:--", settings);
assert.strictEqual(resPk.status, "absent", "--:-- should be absent");
assert.strictEqual(resPk.is_present, false);

console.log("✔ Punctuality status calculations verified successfully");

// Test 2: Seed records and trajectory query
async function runTests() {
  const allRecords = await bridge.listAttendanceRecords({ date: "2026-07-09" });
  assert(allRecords.data.length >= 22, "Should have 22 initial biometric seed records");

  const filipeRec = allRecords.data.find((r) => r.employee_name === "Filipe");
  assert(filipeRec, "Filipe should be in seed records");
  assert.strictEqual(filipeRec.check_in, "07:56");
  assert.strictEqual(filipeRec.status, "on_time");

  const trajLeo = await bridge.getStaffTrajectory("1", "2026-01-01", "2026-12-31");
  assert.strictEqual(trajLeo.employee_name, "Leo");
  assert.strictEqual(trajLeo.presentCount, 1);
  assert.strictEqual(trajLeo.lateCount, 1);

  const statsPeriod = await bridge.getAggregatePeriodStats("2026-07-01", "2026-07-31");
  assert(statsPeriod.distinctEmployeesCount >= 22);
  assert(statsPeriod.onTimeRate > 0);
  assert(statsPeriod.topPunctual.length > 0);

  console.log("✔ Seed data, trajectory, and aggregate stats queries verified");
  console.log("✔ All attendance test assertions passed!");
}

runTests().catch((err) => {
  console.error("Test failed", err);
  process.exit(1);
});
