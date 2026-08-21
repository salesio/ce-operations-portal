import fs from 'node:fs';

console.log("=== TESTING CELL PORTAL FULL RENDER IN SIMULATED BROWSER ===");

// 1. Read dashboard.js and related scripts
const cellSeedCode = fs.readFileSync('js/cell-seed-data.js', 'utf8');
const dashboardCode = fs.readFileSync('js/dashboard.js', 'utf8');

// Set up mock DOM and window
const elements = new Map();
function makeElement(id) {
  return {
    id,
    innerHTML: '',
    textContent: '',
    classList: {
      add: () => {},
      remove: () => {},
      toggle: () => {},
      contains: () => false
    },
    querySelectorAll: () => [],
    querySelector: () => null,
    setAttribute: () => {},
    getAttribute: () => null,
    addEventListener: () => {},
    removeEventListener: () => {},
    style: {}
  };
}

globalThis.window = globalThis;
globalThis.addEventListener = () => {};
globalThis.removeEventListener = () => {};
globalThis.NodeFilter = { SHOW_TEXT: 4, FILTER_ACCEPT: 1 };
globalThis.document = {
  getElementById: (id) => {
    if (!elements.has(id)) elements.set(id, makeElement(id));
    return elements.get(id);
  },
  querySelector: (sel) => {
    return makeElement(sel);
  },
  querySelectorAll: () => [],
  createTreeWalker: () => ({ nextNode: () => null }),
  addEventListener: () => {},
  removeEventListener: () => {},
  documentElement: { lang: 'pt', style: { setProperty: () => {}, getPropertyValue: () => '' } }
};

globalThis.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};

globalThis.history = {
  replaceState: () => {},
  pushState: () => {}
};

globalThis.bootstrap = {
  Modal: {
    getInstance: () => ({ hide: () => {}, show: () => {} })
  }
};

globalThis.location = {
  hash: '#cellPortal',
  pathname: '/'
};

// Execute cell-seed-data.js
eval(cellSeedCode);

// Evaluate dashboard.js
try {
  eval(dashboardCode);
  console.log("✓ dashboard.js evaluated successfully without syntax error.");
} catch (e) {
  console.error("Error evaluating dashboard.js:", e);
  process.exit(1);
}

// Set authenticated user as Super Admin (Salésio Machava)
window.activeUser = {
  id: "u1111111-0000-0000-0000-000000000001",
  name: "Salésio Machava",
  role: "Super Admin",
  church_id: "a1111111-1111-4111-8111-111111111101",
  permissions: ["cell_portal.view", "cell_portal.view_members", "cell_portal.export_summary"]
};
window.isUserAuthenticated = true;

console.log("\n--- Calling window.renderCellLeaderPortal() directly ---");
try {
  window.renderCellLeaderPortal();
  const contentEl = document.getElementById("content");
  console.log("content HTML length:", contentEl.innerHTML.length);
  if (contentEl.innerHTML.includes("cell-portal-shell")) {
    console.log("✅ SUCCESS: Content correctly rendered cell-portal-shell!");
  } else {
    console.error("❌ FAILED: Content does NOT contain cell-portal-shell!");
    console.log("Full Content:", contentEl.innerHTML);
  }
} catch (err) {
  console.error("❌ Exception during renderCellLeaderPortal():", err);
}
