import fs from "node:fs";

const DASHBOARD_PATH = "js/dashboard.js";
let code = fs.readFileSync(DASHBOARD_PATH, "utf8");

// Helper functions for cell attendance modal controls
const helperFunctions = `
// ============================================================================
// CELL ATTENDANCE MODAL CONTROLS & HELPERS
// ============================================================================

function toggleCellAttendanceCheckboxes(checkAll) {
  const targetState = Boolean(checkAll);
  const container = document.getElementById("entryModal") || document;
  const checkboxes = container.querySelectorAll("[data-attendance-member-check]");
  checkboxes.forEach((cb) => {
    cb.checked = targetState;
  });
}
if (typeof window !== "undefined") window.toggleCellAttendanceCheckboxes = toggleCellAttendanceCheckboxes;

function stepAttendanceCounter(field, delta) {
  const container = document.getElementById("entryModal") || document;
  const input = container.querySelector(\`[data-attendance-field="\${field}"]\`) || container.querySelector(\`input[name="\${field}"]\`);
  if (input) {
    input.value = Math.max(0, (Number(input.value) || 0) + Number(delta));
  }
}
if (typeof window !== "undefined") window.stepAttendanceCounter = stepAttendanceCounter;

function addCellAttendanceVisitorFromInput() {
  const nameInput = document.getElementById("newVisitorName");
  const phoneInput = document.getElementById("newVisitorPhone");
  const typeSelect = document.getElementById("newVisitorType");

  const name = (nameInput?.value || "").trim();
  const phone = (phoneInput?.value || "").trim();
  const type = typeSelect?.value || "FT";

  if (!name) {
    alert(typeof lang !== "undefined" && lang === "en" ? "Please enter visitor's full name." : "Por favor introduza o nome completo do visitante / novo membro.");
    nameInput?.focus();
    return;
  }

  const isFT = type === "FT" || type === "FT_NC";
  const isNC = type === "NC" || type === "FT_NC";

  currentSessionVisitors.push({
    name,
    phone,
    type,
    isFT,
    isNC,
    id: typeof generateUuid === "function" ? generateUuid() : "v-" + Date.now()
  });

  if (nameInput) nameInput.value = "";
  if (phoneInput) phoneInput.value = "";
  nameInput?.focus();

  refreshAttendanceVisitorsList();
}
if (typeof window !== "undefined") window.addCellAttendanceVisitorFromInput = addCellAttendanceVisitorFromInput;
`;

if (!code.includes("function toggleCellAttendanceCheckboxes")) {
  code = code.replace("function openCellAttendanceModal()", helperFunctions + "\nfunction openCellAttendanceModal()");
  console.log("Added global helper functions for cell attendance modal!");
}

// Update the check all/uncheck buttons in openCellAttendanceModal markup
const oldCheckButtonsRegex = /<button type="button" class="btn btn-outline-success" data-cell-attendance-check-all="1"><i class="bi bi-check-all me-1"><\/i>Marcar Todos<\/button>\r?\n\s*<button type="button" class="btn btn-outline-secondary" data-cell-attendance-check-all="0"><i class="bi bi-x-lg me-1"><\/i>Desmarcar<\/button>/;

const newCheckButtons = `<button type="button" class="btn btn-outline-success" data-cell-attendance-check-all="1" onclick="window.toggleCellAttendanceCheckboxes &amp;&amp; window.toggleCellAttendanceCheckboxes(true); return false;"><i class="bi bi-check-all me-1"></i>Marcar Todos</button>
              <button type="button" class="btn btn-outline-secondary" data-cell-attendance-check-all="0" onclick="window.toggleCellAttendanceCheckboxes &amp;&amp; window.toggleCellAttendanceCheckboxes(false); return false;"><i class="bi bi-x-lg me-1"></i>Desmarcar</button>`;

if (oldCheckButtonsRegex.test(code)) {
  code = code.replace(oldCheckButtonsRegex, newCheckButtons);
  console.log("Updated check-all / uncheck buttons with inline onclick!");
}

// Update step counters in openCellAttendanceModal markup
const oldFtStepRegex = /<button class="btn btn-outline-secondary" type="button" data-step-counter="ftCount" data-step-delta="-1">-<\/button>\r?\n\s*<input type="number" min="0" class="form-control text-center fw-bold fs-5 text-warning" name="ftCount" value="0" data-attendance-field="ftCount">\r?\n\s*<button class="btn btn-outline-secondary" type="button" data-step-counter="ftCount" data-step-delta="1">\+<\/button>/;

const newFtStep = `<button class="btn btn-outline-secondary" type="button" data-step-counter="ftCount" data-step-delta="-1" onclick="window.stepAttendanceCounter &amp;&amp; window.stepAttendanceCounter('ftCount', -1); return false;">-</button>
            <input type="number" min="0" class="form-control text-center fw-bold fs-5 text-warning" name="ftCount" value="0" data-attendance-field="ftCount">
            <button class="btn btn-outline-secondary" type="button" data-step-counter="ftCount" data-step-delta="1" onclick="window.stepAttendanceCounter &amp;&amp; window.stepAttendanceCounter('ftCount', 1); return false;">+</button>`;

if (oldFtStepRegex.test(code)) {
  code = code.replace(oldFtStepRegex, newFtStep);
  console.log("Updated ftCount step buttons with inline onclick!");
}

const oldNcStepRegex = /<button class="btn btn-outline-secondary" type="button" data-step-counter="ncCount" data-step-delta="-1">-<\/button>\r?\n\s*<input type="number" min="0" class="form-control text-center fw-bold fs-5 text-success" name="ncCount" value="0" data-attendance-field="ncCount">\r?\n\s*<button class="btn btn-outline-secondary" type="button" data-step-counter="ncCount" data-step-delta="1">\+<\/button>/;

const newNcStep = `<button class="btn btn-outline-secondary" type="button" data-step-counter="ncCount" data-step-delta="-1" onclick="window.stepAttendanceCounter &amp;&amp; window.stepAttendanceCounter('ncCount', -1); return false;">-</button>
            <input type="number" min="0" class="form-control text-center fw-bold fs-5 text-success" name="ncCount" value="0" data-attendance-field="ncCount">
            <button class="btn btn-outline-secondary" type="button" data-step-counter="ncCount" data-step-delta="1" onclick="window.stepAttendanceCounter &amp;&amp; window.stepAttendanceCounter('ncCount', 1); return false;">+</button>`;

if (oldNcStepRegex.test(code)) {
  code = code.replace(oldNcStepRegex, newNcStep);
  console.log("Updated ncCount step buttons with inline onclick!");
}

// Update add visitor button
const oldAddVisitorRegex = /<button type="button" class="btn btn-sm btn-warning w-100" data-add-visitor-row>\r?\n\s*<i class="bi bi-plus-lg me-1"><\/i>Adicionar\r?\n\s*<\/button>/;

const newAddVisitor = `<button type="button" class="btn btn-sm btn-warning w-100" data-add-visitor-row onclick="window.addCellAttendanceVisitorFromInput &amp;&amp; window.addCellAttendanceVisitorFromInput(); return false;">
                  <i class="bi bi-plus-lg me-1"></i>Adicionar
                </button>`;

if (oldAddVisitorRegex.test(code)) {
  code = code.replace(oldAddVisitorRegex, newAddVisitor);
  console.log("Updated add-visitor button with inline onclick!");
}

fs.writeFileSync(DASHBOARD_PATH, code, "utf8");
console.log("Successfully wrote all modal control updates to dashboard.js!");
