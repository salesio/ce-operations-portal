import fs from "node:fs";

let dashCode = fs.readFileSync("js/dashboard.js", "utf8");
dashCode = dashCode.replace(/\r\n/g, "\n");

// 1. In renderFollowUp: auto trigger hydration if not yet done
const oldRenderFollowUp = `function renderFollowUp() {
  const list = scoped(state.firstTimers, "followUp");`;

const newRenderFollowUp = `function renderFollowUp() {
  if (!state.firstTimersHydrated && typeof hydrateFirstTimersFromRepository === "function") {
    state.firstTimersHydrated = true;
    Promise.resolve().then(() => hydrateFirstTimersFromRepository()).then((hydrated) => {
      if (hydrated && activeRoute === "followUp") renderFollowUp();
    });
  }
  const list = scoped(state.firstTimers, "followUp");`;

if (dashCode.includes(oldRenderFollowUp)) {
  dashCode = dashCode.replace(oldRenderFollowUp, newRenderFollowUp);
  console.log("Updated renderFollowUp in dashboard.js");
} else {
  console.warn("oldRenderFollowUp not found!");
}

// 2. In renderFirstTimers: auto trigger hydration if not yet done
const oldRenderFirstTimers = `function renderFirstTimers() {
  const list = scoped(state.firstTimers, "firstTimers");`;

const newRenderFirstTimers = `function renderFirstTimers() {
  if (!state.firstTimersHydrated && typeof hydrateFirstTimersFromRepository === "function") {
    state.firstTimersHydrated = true;
    Promise.resolve().then(() => hydrateFirstTimersFromRepository()).then((hydrated) => {
      if (hydrated && activeRoute === "firstTimers") renderFirstTimers();
    });
  }
  const list = scoped(state.firstTimers, "firstTimers");`;

if (dashCode.includes(oldRenderFirstTimers)) {
  dashCode = dashCode.replace(oldRenderFirstTimers, newRenderFirstTimers);
  console.log("Updated renderFirstTimers in dashboard.js");
} else {
  console.warn("oldRenderFirstTimers not found!");
}

// 3. In continueEnterDashboard: ensure active background hydration of first timers and follow ups
const oldHydrateCheck = `  // Kept only as an opt-in compatibility escape hatch. Normal login is lazy:
  // the visible route loads its data on demand, avoiding a burst of module calls.
  if (window.__CE_LEGACY_EAGER_HYDRATE__ === true) {
  // Data-layer pilots: sync churches + members + first timers without blocking UI paint`;

const newHydrateCheck = `  // Active background sync for first timers and follow ups from Supabase
  Promise.resolve()
    .then(() => hydrateFirstTimersFromRepository())
    .then((hydrated) => {
      state.firstTimersHydrated = true;
      if (hydrated && (activeRoute === "firstTimers" || activeRoute === "followUp")) {
        if (activeRoute === "firstTimers") renderFirstTimers();
        else renderFollowUp();
      }
    })
    .catch((error) => console.warn("[CE FirstTimers] background hydrate skipped", error));

  Promise.resolve()
    .then(() => hydrateFollowUpsFromRepository())
    .then((hydrated) => {
      if (hydrated && activeRoute === "followUp") renderFollowUp();
    })
    .catch((error) => console.warn("[CE FollowUps] background hydrate skipped", error));

  if (window.__CE_LEGACY_EAGER_HYDRATE__ === true) {
  // Data-layer pilots: sync churches + members + first timers without blocking UI paint`;

if (dashCode.includes(oldHydrateCheck)) {
  dashCode = dashCode.replace(oldHydrateCheck, newHydrateCheck);
  console.log("Updated continueEnterDashboard in dashboard.js");
} else {
  console.warn("oldHydrateCheck not found!");
}

// 4. In refreshDashboardData: when followUp route is active, refresh both firstTimers and followUps
const oldRouteRefreshers = `    firstTimers: hydrateFirstTimersFromRepository,
    followUp: hydrateFollowUpsFromRepository,`;

const newRouteRefreshers = `    firstTimers: hydrateFirstTimersFromRepository,
    followUp: () => Promise.all([hydrateFirstTimersFromRepository(), hydrateFollowUpsFromRepository()]),`;

if (dashCode.includes(oldRouteRefreshers)) {
  dashCode = dashCode.replace(oldRouteRefreshers, newRouteRefreshers);
  console.log("Updated routeRefreshers in dashboard.js");
} else {
  console.warn("oldRouteRefreshers not found!");
}

fs.writeFileSync("js/dashboard.js", dashCode, "utf8");
console.log("Patched dashboard.js successfully!");
