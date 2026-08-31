import fs from "node:fs";

const DASHBOARD_PATH = "js/dashboard.js";
let code = fs.readFileSync(DASHBOARD_PATH, "utf8");

// 1. Update official members table in openCellAttendanceModal
const oldTableBlockRegex = /<div class="table-responsive border rounded p-2" style="max-height: 220px; overflow-y: auto; background: rgba\(15, 23, 42, 0\.45\);">[\s\S]*?<\/tbody>\s*<\/table>\s*<\/div>/;

const newTableBlock = `<div class="table-responsive border rounded p-2" style="max-height: 220px; overflow-y: auto; background: #0b132b; border-color: #1e293b !important;">
            <table class="table table-sm mb-0 align-middle" style="color: #f8fafc;">
              <thead>
                <tr style="color: #93c5fd; border-bottom: 1px solid #1e293b; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;">
                  <th style="width: 45px; color: #93c5fd;">Presença</th>
                  <th style="color: #93c5fd;">Nome do Membro</th>
                  <th style="color: #93c5fd;">Telefone</th>
                  <th style="color: #93c5fd;">Estado</th>
                </tr>
              </thead>
              <tbody>
                \${members.map((m) => \`
                  <tr style="border-bottom: 1px solid #1e293b;">
                    <td>
                      <input type="checkbox" class="form-check-input" data-attendance-member-check="\${escapeAttr(m.id)}" style="width: 1.25rem; height: 1.25rem; cursor: pointer;">
                    </td>
                    <td style="color: #ffffff;"><strong style="color: #ffffff; font-size: 0.92rem;">\${escapeAttr(m.name || "—")}</strong></td>
                    <td style="color: #38bdf8 !important; font-weight: 700; font-size: 0.9rem; font-family: monospace;">\${escapeAttr(m.phone || "—")}</td>
                    <td>\${badge(m.status || "Activo")}</td>
                  </tr>
                \`).join("") || \`<tr><td colspan="4" class="text-secondary text-center py-3">Nenhum membro oficial registado na célula.</td></tr>\`}
              </tbody>
            </table>
          </div>`;

if (oldTableBlockRegex.test(code)) {
  code = code.replace(oldTableBlockRegex, newTableBlock);
  console.log("Updated official members table block in openCellAttendanceModal!");
} else {
  console.log("oldTableBlockRegex did not match");
}

// 2. Update visitor table header and rows in openCellAttendanceModal
const oldVisitorTableRegex = /<div id="cellAttendanceVisitorsList" class="table-responsive" style="display: none;">[\s\S]*?<\/tbody>\s*<\/table>\s*<\/div>/;

const newVisitorTable = `<div id="cellAttendanceVisitorsList" class="table-responsive mt-2" style="display: none; background: #0b132b; border: 1px solid #1e293b; border-radius: 6px; padding: 6px;">
              <table class="table table-sm mb-0 align-middle" style="color: #f8fafc;">
                <thead>
                  <tr style="color: #93c5fd; border-bottom: 1px solid #1e293b; font-size: 0.75rem; text-transform: uppercase;">
                    <th style="color: #93c5fd;">Nome</th>
                    <th style="color: #93c5fd;">Telefone</th>
                    <th style="color: #93c5fd;">Classificação</th>
                    <th style="width: 50px; color: #93c5fd;">Acção</th>
                  </tr>
                </thead>
                <tbody id="cellAttendanceVisitorsTableBody"></tbody>
              </table>
            </div>`;

if (oldVisitorTableRegex.test(code)) {
  code = code.replace(oldVisitorTableRegex, newVisitorTable);
  console.log("Updated visitor table in openCellAttendanceModal!");
} else {
  console.log("oldVisitorTableRegex did not match");
}

// 3. Update refreshAttendanceVisitorsList row markup
const oldVisitorRowRegex = /tbody\.innerHTML = currentSessionVisitors\.map\(\(v, idx\) => `[\s\S]*?`\)\.join\(""\);/;

const newVisitorRow = `tbody.innerHTML = currentSessionVisitors.map((v, idx) => \`
    <tr style="border-bottom: 1px solid #1e293b;">
      <td style="color: #ffffff;"><strong style="color: #ffffff;">\${escapeAttr(v.name)}</strong></td>
      <td style="color: #38bdf8 !important; font-weight: 700; font-family: monospace;">\${escapeAttr(v.phone || "—")}</td>
      <td>
        \${v.isFT ? '<span class="badge bg-warning text-dark me-1">FT</span>' : ""}
        \${v.isNC ? '<span class="badge bg-success">NC</span>' : ""}
      </td>
      <td>
        <button type="button" class="btn btn-sm btn-outline-danger py-0 px-1" data-remove-visitor-idx="\${idx}" title="Remover">&times;</button>
      </td>
    </tr>
  \`).join("");`;

if (oldVisitorRowRegex.test(code)) {
  code = code.replace(oldVisitorRowRegex, newVisitorRow);
  console.log("Updated refreshAttendanceVisitorsList row markup!");
} else {
  console.log("oldVisitorRowRegex did not match");
}

fs.writeFileSync(DASHBOARD_PATH, code, "utf8");
console.log("Successfully wrote all high contrast modal styles!");
