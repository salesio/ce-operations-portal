import fs from "node:fs";
import vm from "node:vm";

const storage = {};
const mockLocalStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = v; },
  removeItem: (k) => { delete storage[k]; }
};
const elements = {};
function createMockElement(id) {
  const attrs = {};
  const eventListeners = {};
  return {
    id,
    innerHTML: "",
    textContent: "",
    value: "",
    style: { setProperty: () => {}, getPropertyValue: () => "" },
    offsetHeight: 60,
    offsetWidth: 1200,
    classList: {
      _classes: new Set(),
      add: function(...args) { args.forEach(c => this._classes.add(c)); },
      remove: function(...args) { args.forEach(c => this._classes.delete(c)); },
      toggle: function(c, force) { if (force !== undefined) { if (force) this._classes.add(c); else this._classes.delete(c); } else { if (this._classes.has(c)) this._classes.delete(c); else this._classes.add(c); } },
      contains: function(c) { return this._classes.has(c); }
    },
    setAttribute: (k, v) => { attrs[k] = v; },
    getAttribute: (k) => attrs[k] || null,
    querySelectorAll: () => [],
    querySelector: (sel) => createMockElement(sel),
    getBoundingClientRect: () => ({ top: 0, height: 0 }),
    scrollTop: 0,
    scrollTo: () => {},
    addEventListener: (evt, handler) => { eventListeners[evt] = handler; },
    removeEventListener: () => {},
    _listeners: eventListeners
  };
}
const mockDoc = {
  documentElement: createMockElement("html"),
  body: createMockElement("body"),
  getElementById: (id) => elements[id] || (elements[id] = createMockElement(id)),
  querySelector: (sel) => elements[sel] || (elements[sel] = createMockElement(sel)),
  querySelectorAll: () => [],
  addEventListener: () => {},
  createTreeWalker: () => ({ nextNode: () => null })
};
const sandbox = {
  localStorage: mockLocalStorage,
  sessionStorage: mockLocalStorage,
  document: mockDoc,
  location: { hash: "", href: "", reload: () => {} },
  history: { replaceState: () => {} },
  addEventListener: () => {},
  scrollTo: () => {},
  requestAnimationFrame: (cb) => { cb(); },
  Intl: global.Intl,
  NodeFilter: { SHOW_TEXT: 4 },
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
  Promise: Promise,
  structuredClone: structuredClone,
  Date: Date,
  Math: Math,
  JSON: JSON,
  String: String,
  Number: Number,
  Boolean: Boolean,
  Array: Array,
  Object: Object,
  RegExp: RegExp,
  Error: Error,
  TypeError: TypeError,
  ReferenceError: ReferenceError,
  FormData: class { constructor() {} entries() { return []; } },
  bootstrap: { Modal: { getOrCreateInstance: () => ({ show: () => {}, hide: () => {} }), getInstance: () => ({ show: () => {}, hide: () => {} }) } },
  confirm: () => true
};
sandbox.window = sandbox;
sandbox.global = sandbox;
const context = vm.createContext(sandbox);

vm.runInContext(fs.readFileSync("js/access-control.js", "utf8"), context);
vm.runInContext(fs.readFileSync("js/cell-seed-data.js", "utf8"), context);
vm.runInContext(fs.readFileSync("js/ui-components.js", "utf8"), context);
vm.runInContext(fs.readFileSync("js/dashboard.js", "utf8"), context);

vm.runInContext("activeUser = state.users[0]; isUserAuthenticated = true; continueEnterDashboard();", context);

try {
  vm.runInContext('setRoute("cellPortal");', context);
  console.log('setRoute("cellPortal") succeeded without error!');
  const content = elements["content"]?.innerHTML || "";
  console.log("HTML size:", content.length);
  const tags = ["div", "section", "article", "button", "select", "table", "thead", "tbody", "tr", "th", "td", "label"];
  tags.forEach(t => {
    const openCount = (content.match(new RegExp("<" + t + "(\\s|>|$)", "gi")) || []).length;
    const closeCount = (content.match(new RegExp("</" + t + ">", "gi")) || []).length;
    console.log("<" + t + ">: open=" + openCount + ", close=" + closeCount);
  });
} catch (err) {
  console.error("ERROR in setRoute cellPortal:", err);
}
