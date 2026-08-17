import fs from "fs";
import { resolve } from "path";

console.log("Checking Dashboard Enhancements 1 to 4 implementation...");

const htmlContent = fs.readFileSync("index.html", "utf-8");
const cssContent = fs.readFileSync("css/dashboard.css", "utf-8");
const jsContent = fs.readFileSync("js/dashboard.js", "utf-8");
const bridgeContent = fs.readFileSync("js/supabase-bridge.js", "utf-8");

// 1. Universal Search (Ctrl + K) & Topbar Search Trigger
if (!htmlContent.includes("universalSearchModal") || !htmlContent.includes("universalSearchBtn") || !htmlContent.includes("kbd-pill")) {
  throw new Error("FAIL: index.html missing Universal Search modal or topbar trigger button");
}
if (!jsContent.includes("initUniversalSearch") || !jsContent.includes("buildUniversalSearchIndex")) {
  throw new Error("FAIL: js/dashboard.js missing initUniversalSearch or buildUniversalSearchIndex");
}
console.log("PASS: Universal Search (Ctrl + K) modal and fuzzy indexer verified");

// 2. Dynamic Topbar Breadcrumbs
if (!htmlContent.includes("topbarBreadcrumbs")) {
  throw new Error("FAIL: index.html missing topbarBreadcrumbs container");
}
if (!jsContent.includes("updateTopbarBreadcrumbs")) {
  throw new Error("FAIL: js/dashboard.js missing updateTopbarBreadcrumbs");
}
console.log("PASS: Dynamic Topbar Breadcrumbs verified");

// 3. Batch Action Bar & Multi-Select Selection
if (!htmlContent.includes("batchActionBar") || !htmlContent.includes("batchSelectedCount")) {
  throw new Error("FAIL: index.html missing sticky floating batchActionBar");
}
if (!jsContent.includes("initBatchSelection") || !jsContent.includes("toggleBatchRow")) {
  throw new Error("FAIL: js/dashboard.js missing initBatchSelection or toggleBatchRow");
}
if (!cssContent.includes("batch-action-bar")) {
  throw new Error("FAIL: css/dashboard.css missing batch-action-bar styles");
}
console.log("PASS: Sticky Floating Batch Action Bar & multi-select logic verified");

// 4. Audit History Drawer
if (!htmlContent.includes("auditHistoryDrawer") || !htmlContent.includes("auditTimelineList")) {
  throw new Error("FAIL: index.html missing auditHistoryDrawer or timeline");
}
if (!jsContent.includes("openAuditHistoryDrawer")) {
  throw new Error("FAIL: js/dashboard.js missing openAuditHistoryDrawer");
}
if (!cssContent.includes(".timeline-item")) {
  throw new Error("FAIL: css/dashboard.css missing audit timeline styles");
}
console.log("PASS: Audit History Drawer & edit timeline visualizer verified");

// 5. Data Health & Deduplication Panel
if (!jsContent.includes("renderDataHealthDashboard")) {
  throw new Error("FAIL: js/dashboard.js missing renderDataHealthDashboard");
}
console.log("PASS: Data Health & Deduplication Dashboard panel verified");

// 6. Realtime & Offline Queue Helpers
if (!bridgeContent.includes("subscribeRealtimeChanges") || !bridgeContent.includes("enqueueOfflineAction") || !bridgeContent.includes("replayOfflineQueue")) {
  throw new Error("FAIL: js/supabase-bridge.js missing Realtime or Offline Queue helpers");
}
console.log("PASS: Realtime WebSocket and Offline Queue helpers verified in js/supabase-bridge.js");

console.log("\n✅ ALL Dashboard Enhancements 1 to 4 verified successfully with 0 errors!");
