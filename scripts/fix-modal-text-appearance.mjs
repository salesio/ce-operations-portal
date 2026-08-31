import fs from "node:fs";

const DASHBOARD_PATH = "js/dashboard.js";
let code = fs.readFileSync(DASHBOARD_PATH, "utf8");

const oldAlertRegex = /<div class="alert alert-info mb-2 small">[\s\S]*?<\/div>/;

const newAlert = `<div class="p-3 rounded mb-2 small d-flex align-items-start gap-2" style="background: rgba(14, 165, 233, 0.15); border: 1px solid rgba(56, 189, 248, 0.4); color: #f0f9ff;">
            <i class="bi bi-info-circle-fill text-info fs-5 flex-shrink-0 mt-0"></i>
            <div style="line-height: 1.55; color: #e0f2fe;">
              Marque os membros oficiais presentes no culto e adicione novos visitantes.
              <div class="mt-1"><strong style="color: #38bdf8; font-weight: 700;">Regra de Membresia:</strong> Novos visitantes que atingirem <strong style="color: #facc15; font-weight: 700;">3 presenças</strong> em cultos/reuniões tornam-se membros oficiais da célula.</div>
            </div>
          </div>`;

if (oldAlertRegex.test(code)) {
  code = code.replace(oldAlertRegex, newAlert);
  console.log("Updated alert styling in dashboard.js!");
} else {
  console.log("Alert regex did not match");
}

// Update table rows styling in openCellAttendanceModal
const oldRowRegex = /<tr>\r?\n\s*<td>\r?\n\s*<input type="checkbox" class="form-check-input" data-attendance-member-check="\$\{escapeAttr\(m\.id\)\}" style="width: 1\.25rem; height: 1\.25rem; cursor: pointer;">\r?\n\s*<\/td>\r?\n\s*<td><strong>\$\{escapeAttr\(m\.name \|\| "—"\)\}<\/strong><\/td>\r?\n\s*<td>\$\{escapeAttr\(m\.phone \|\| "—"\)\}<\/td>\r?\n\s*<td>\$\{badge\(m\.status \|\| "Activo"\)\}<\/td>\r?\n\s*<\/tr>/;

const newRow = `<tr style="border-bottom: 1px solid rgba(148, 163, 184, 0.15);">
                    <td>
                      <input type="checkbox" class="form-check-input" data-attendance-member-check="\${escapeAttr(m.id)}" style="width: 1.25rem; height: 1.25rem; cursor: pointer;">
                    </td>
                    <td style="color: #ffffff;"><strong style="color: #ffffff;">\${escapeAttr(m.name || "—")}</strong></td>
                    <td style="color: #cbd5e1; font-weight: 500;">\${escapeAttr(m.phone || "—")}</td>
                    <td>\${badge(m.status || "Activo")}</td>
                  </tr>`;

if (oldRowRegex.test(code)) {
  code = code.replace(oldRowRegex, newRow);
  console.log("Updated table row styling in dashboard.js!");
} else {
  console.log("oldRowRegex did not match");
}

fs.writeFileSync(DASHBOARD_PATH, code, "utf8");
console.log("Successfully updated modal text appearance!");
