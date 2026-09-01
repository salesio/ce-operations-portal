import fs from "node:fs";
import vm from "node:vm";

const acCode = fs.readFileSync("js/access-control.js", "utf8");
const sandbox = { console, window: {} };
sandbox.window = sandbox;
const ctx = vm.createContext(sandbox);
vm.runInContext(acCode, ctx);

const filipe = {
  id: "u-diamantes-leader",
  role: "Cell Leader",
  role_name: "Líder de Célula Diamantes Main",
  department_permissions: ["cellReports", "followUp", "foundation", "foundation_teacher", "reports"]
};

console.log("Testing Filipe Access:");
["followUp", "foundation", "reports"].forEach(route => {
  const mod = sandbox.window.CEAccessControl.routeToModule(route);
  const acc = sandbox.window.CEAccessControl.resolveModuleAccess(filipe, mod);
  const nav = sandbox.window.CEAccessControl.getNavItemState(filipe, route);
  console.log(`Route: ${route} -> Module: ${mod}`, {
    can_view: acc.can_view,
    nav_visible: nav.visible,
    nav_locked: nav.locked
  });
});
