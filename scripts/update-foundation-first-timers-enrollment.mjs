import fs from "node:fs";

const DASHBOARD_PATH = "js/dashboard.js";
let code = fs.readFileSync(DASHBOARD_PATH, "utf8");

// Helper regex check for Foundation Demo
const isDemoFoundationHelper = `function isDemoFoundationRecord(item) {
  if (!item) return false;
  const str = String(item.id || "") + " " + String(item.name || "") + " " + String(item.full_name || "") + " " + String(item.student_number || "") + " " + String(item.class_code || "") + " " + String(item.teacher_number || "") + " " + String(item.enrollment_number || "");
  if (/demo|^8[1-5]000000-|^fs-[1-9]$|^fst-[1-9]$|^fsc-[1-9]$|^fse-[1-9]$|^fss-[1-9]$/i.test(str)) return true;
  if (/Aluno Demo|Professor Demo|Turma.*Demo|FSC-DEMO|FST-DEMO|FSS-DEMO|FSE-DEMO/i.test(str)) return true;
  if (item.metadata && typeof item.metadata === "object" && item.metadata.demo === true) return true;
  return false;
}`;

// 1. Insert helper function if not present
if (!code.includes("function isDemoFoundationRecord(")) {
  code = code.replace(
    /function ensureFoundationData\(\) \{/,
    isDemoFoundationHelper + "\n\nfunction ensureFoundationData() {"
  );
}

// 2. Update ensureFoundationData to clean mock data
const oldEnsureFoundationDataHead = `function ensureFoundationData() {
  const today = new Date().toISOString().slice(0, 10);
  const hq = state.churches?.[0]?.id || "church-hq";
  const churchLabel = churchName(hq);
  if (!Array.isArray(state.foundationTeachers)) state.foundationTeachers = [];
  if (!Array.isArray(state.foundationClassGroups)) state.foundationClassGroups = [];
  if (!Array.isArray(state.foundationStudents)) state.foundationStudents = [];`;

const newEnsureFoundationDataHead = `function ensureFoundationData() {
  const today = new Date().toISOString().slice(0, 10);
  const hq = state.churches?.[0]?.id || "church-hq";
  const churchLabel = churchName(hq);
  if (!Array.isArray(state.foundationTeachers)) state.foundationTeachers = [];
  if (!Array.isArray(state.foundationClassGroups)) state.foundationClassGroups = [];
  if (!Array.isArray(state.foundationStudents)) state.foundationStudents = [];

  // Purge any legacy mock foundation records
  state.foundationStudents = state.foundationStudents.filter((s) => !isDemoFoundationRecord(s));
  state.foundationClassGroups = state.foundationClassGroups.filter((c) => !isDemoFoundationRecord(c));
  state.foundationTeachers = state.foundationTeachers.filter((t) => !isDemoFoundationRecord(t));`;

if (code.includes(oldEnsureFoundationDataHead)) {
  code = code.replace(oldEnsureFoundationDataHead, newEnsureFoundationDataHead);
}

// 3. Update normalizeState to purge mock foundation data
const oldNormalizeFoundation = `  merged.foundationStudents = (merged.foundationStudents || []).filter((fs) => !isLegacyMockId(fs?.id));`;
const newNormalizeFoundation = `  merged.foundationStudents = (merged.foundationStudents || []).filter((fs) => !isLegacyMockId(fs?.id) && !isDemoFoundationRecord(fs));
  merged.foundationClassGroups = (merged.foundationClassGroups || []).filter((fc) => !isDemoFoundationRecord(fc));
  merged.foundationTeachers = (merged.foundationTeachers || []).filter((ft) => !isDemoFoundationRecord(ft));
  merged.foundationLessonSessions = (merged.foundationLessonSessions || []).filter((fls) => !isDemoFoundationRecord(fls));
  merged.foundationLessonProgress = (merged.foundationLessonProgress || []).filter((flp) => !isDemoFoundationRecord(flp));
  merged.foundationLessonAttendance = (merged.foundationLessonAttendance || []).filter((fla) => !isDemoFoundationRecord(fla));
  merged.foundationLessonTestSubmissions = (merged.foundationLessonTestSubmissions || []).filter((flt) => !isDemoFoundationRecord(flt));
  merged.foundationSoulWinning = (merged.foundationSoulWinning || []).filter((fsw) => !isDemoFoundationRecord(fsw));
  merged.foundationFinalExams = (merged.foundationFinalExams || []).filter((ffe) => !isDemoFoundationRecord(ffe));`;

if (code.includes(oldNormalizeFoundation)) {
  code = code.replace(oldNormalizeFoundation, newNormalizeFoundation);
}

// 4. Update hydrateFoundationSchoolFromRepository to ignore demo rows
const oldHydrateStudentsLoop = `        result.data.forEach((row) => {
          const previous = prev.get(row.id) || {};
          byId.set(row.id, migrateFoundationStudentRecord({ ...row, ...previous, id: row.id }));
        });`;

const newHydrateStudentsLoop = `        result.data.forEach((row) => {
          if (isDemoFoundationRecord(row)) return;
          const previous = prev.get(row.id) || {};
          byId.set(row.id, migrateFoundationStudentRecord({ ...row, ...previous, id: row.id }));
        });`;

if (code.includes(oldHydrateStudentsLoop)) {
  code = code.replace(oldHydrateStudentsLoop, newHydrateStudentsLoop);
}

// 5. Update firstTimerActions to ALWAYS allow Enroll FS / Matricular na ESF
const oldFirstTimerFSActions = `  // Downstream flows
  const isEnrolledFS = (state.foundationStudents || []).some((s) => s.first_timer_id === id || (s.phone && s.phone === (row.telefone || row.phone)));
  if ((row.foundation_school_interest || row.quer_escola_de_fundacao) && !isEnrolledFS) {
    actions.push(["enrollFoundation", "firstTimer", id, "Matricular na ESF"]);
  }`;

const newFirstTimerFSActions = `  // Downstream flows - Foundation School enrollment always available for pending visitors
  const isEnrolledFS = (state.foundationStudents || []).some((s) => s.first_timer_id === id || (s.phone && s.phone === (row.telefone || row.phone)));
  if (!isEnrolledFS) {
    actions.push(["enrollFoundation", "firstTimer", id, "Enroll FS / Matricular na ESF"]);
  }`;

if (code.includes(oldFirstTimerFSActions)) {
  code = code.replace(oldFirstTimerFSActions, newFirstTimerFSActions);
}

// 6. Update foundationPending() to check both quer_escola_de_fundacao and foundation_school_interest
const oldFoundationPending = `function foundationPending() {
  const ids = new Set(state.foundationStudents.map((s) => s.first_timer_id));
  return scoped(state.firstTimers).filter((p) => p.quer_escola_de_fundacao && !ids.has(p.id));
}`;

const newFoundationPending = `function foundationPending() {
  const ids = new Set((state.foundationStudents || []).map((s) => s.first_timer_id).filter(Boolean));
  const cleanStudentPhones = new Set((state.foundationStudents || []).map((s) => String(s.phone || s.telefone || "").replace(/\\D/g, "")).filter(Boolean));
  return scoped(state.firstTimers || []).filter((p) => {
    const cleanP = String(p.telefone || p.phone || "").replace(/\\D/g, "");
    const isAlreadyEnrolled = ids.has(p.id) || (cleanP && cleanStudentPhones.has(cleanP));
    const wantsFS = !!(p.quer_escola_de_fundacao || p.foundation_school_interest);
    return wantsFS && !isAlreadyEnrolled;
  });
}`;

if (code.includes(oldFoundationPending)) {
  code = code.replace(oldFoundationPending, newFoundationPending);
}

// 7. Update quickAction enrollFoundation to update both flags and assign UUID
const oldQuickActionEnroll = `  if (type === "firstTimer" && action === "enrollFoundation") {
    const record = (state.firstTimers || []).find((item) => item.id === id);
    if (!record) return;
    const cleanPhone = String(record.telefone || record.phone || "").replace(/\\D/g, "");
    const existing = (state.foundationStudents || []).find((s) => s.first_timer_id === id || (cleanPhone && String(s.phone || s.telefone || "").replace(/\\D/g, "") === cleanPhone));
    if (existing) {
      alert(\`Este visitante já está matriculado na Escola de Fundação (\${existing.full_name || fullName(existing)}).\`);
      return;
    }
    const studentId = \`fs-\${Date.now()}\`;
    const studentRecord = {
      id: studentId,
      first_timer_id: record.id,
      full_name: fullName(record),
      phone: record.telefone || record.phone || "",
      whatsapp: record.whatsapp || record.telefone || record.phone || "",
      church_id: record.church_id || activeUser?.church_id,
      church_name: record.church_name || churchName(record.church_id),
      class_group_id: "",
      status: "Inscrito",
      registered_at: new Date().toISOString().slice(0, 10),
      source: "Primeira Vez",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    state.foundationStudents = state.foundationStudents || [];
    state.foundationStudents.push(studentRecord);
    record.quer_escola_de_fundacao = true;
    record.foundation_school_interest = true;
    record.foundation_student_id = studentId;
    saveState(\`Enrolled first timer \${fullName(record)} in Foundation School\`);
    void persistFoundationStudentViaRepository("create", studentRecord).catch((e) => console.warn("[CE Foundation] sync student error", e));
    alert(\`\${fullName(record)} foi matriculado(a) na Escola de Fundação com sucesso!\`);
    return setRoute(activeRoute);
  }`;

const newQuickActionEnroll = `  if (type === "firstTimer" && action === "enrollFoundation") {
    const record = (state.firstTimers || []).find((item) => item.id === id);
    if (!record) return;
    const cleanPhone = String(record.telefone || record.phone || "").replace(/\\D/g, "");
    const existing = (state.foundationStudents || []).find((s) => s.first_timer_id === id || (cleanPhone && String(s.phone || s.telefone || "").replace(/\\D/g, "") === cleanPhone));
    if (existing) {
      alert(\`Este visitante já está matriculado na Escola de Fundação (\${existing.full_name || fullName(existing)}).\`);
      return;
    }
    const studentId = typeof generateUuid === "function" ? generateUuid() : \`fss-\${Date.now()}\`;
    const studentRecord = {
      id: studentId,
      first_timer_id: record.id,
      full_name: fullName(record),
      phone: record.telefone || record.phone || "",
      whatsapp: record.whatsapp || record.telefone || record.phone || "",
      church_id: record.church_id || activeUser?.church_id,
      church_name: record.church_name || churchName(record.church_id),
      class_group_id: "",
      status: "Inscrito",
      registered_at: new Date().toISOString().slice(0, 10),
      source: "Primeira Vez",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    state.foundationStudents = state.foundationStudents || [];
    state.foundationStudents.push(studentRecord);
    record.quer_escola_de_fundacao = true;
    record.foundation_school_interest = true;
    record.foundation_student_id = studentId;
    saveState(\`Enrolled first timer \${fullName(record)} in Foundation School\`);
    void persistFirstTimerViaRepository("update", migrateFirstTimerRecord(record));
    void persistFoundationStudentViaRepository("create", studentRecord).catch((e) => console.warn("[CE Foundation] sync student error", e));
    alert(\`\${fullName(record)} foi inscrito(a) na Escola de Fundação e agora está visível nas Inscrições / Alunos da ESF!\`);
    return setRoute(activeRoute);
  }`;

if (code.includes(oldQuickActionEnroll)) {
  code = code.replace(oldQuickActionEnroll, newQuickActionEnroll);
}

// 8. Update renderFoundationEnrolments to show enhanced card / table with quick action
const oldRenderFoundationEnrolments = `function renderFoundationEnrolments(pending) {
  return \`
    <article class="panel" id="panel-foundation-enrolments">
      <div class="panel-header-row d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
        <h3 class="panel-title mb-0">\${FS("foundationTabEnrolments")}</h3>
      </div>
      \${foundationActionBar([
        { label: lang === "pt" ? "Nova inscrição / aluno" : "New enrolment / student", icon: "bi-person-plus", attrs: \`data-open-form="foundationStudent"\` }
      ])}
      <div class="row g-3 mt-1">
        \${pending.length ? pending.map((p) => \`<div class="col-md-6 col-xl-4"><div class="record-card h-100"><strong>\${fullName(p)}</strong><p class="text-secondary mb-2">\${p.telefone || "-"} · \${churchName(p.church_id)}</p><button class="btn btn-sm btn-ce-gold" data-enroll="\${p.id}">\${L("enrolStudent")}</button></div></div>\`).join("") : \`<div class="col-12">\${EmptyState({ compact: true, title: L("empty") })}</div>\`}
      </div>
    </article>
  \`;
}`;

const newRenderFoundationEnrolments = `function renderFoundationEnrolments(pending) {
  const safePending = Array.isArray(pending) ? pending : [];
  return \`
    <article class="panel glass-panel" id="panel-foundation-enrolments">
      <div class="panel-header-row d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div>
          <h3 class="panel-title mb-0"><i class="bi bi-person-check-fill me-2 text-warning"></i>\${FS("foundationTabEnrolments")} (\${safePending.length})</h3>
          <p class="text-secondary small mb-0">\${lang === "pt" ? "Visitantes com interesse em Escola de Fundação vindos do fluxo de Primeiras Vezes." : "First Timers who expressed interest in Foundation School."}</p>
        </div>
      </div>
      \${foundationActionBar([
        { label: lang === "pt" ? "Nova inscrição manual" : "New manual enrolment", icon: "bi-person-plus", attrs: \`data-open-form="foundationStudent"\` }
      ])}
      <div class="row g-3 mt-2">
        \${safePending.length ? safePending.map((p) => \`
          <div class="col-md-6 col-xl-4">
            <div class="record-card h-100 glass-panel p-3 border-start border-warning border-3">
              <div class="d-flex justify-content-between align-items-start mb-2">
                <strong class="fs-6 text-light">\${escapeAttr(fullName(p))}</strong>
                <span class="badge bg-warning text-dark"><i class="bi bi-person-heart me-1"></i>First Timer</span>
              </div>
              <p class="text-secondary small mb-1"><i class="bi bi-telephone me-1"></i>\${escapeAttr(p.telefone || p.phone || "—")}</p>
              <p class="text-secondary small mb-1"><i class="bi bi-building me-1"></i>\${escapeAttr(churchName(p.church_id))}</p>
              <p class="text-secondary small mb-3"><i class="bi bi-calendar me-1"></i>\${escapeAttr(p.data_da_visita || p.service_date || p.created_at?.slice(0, 10) || "—")}</p>
              <button type="button" class="btn btn-sm btn-ce-gold w-100" data-enroll="\${escapeAttr(p.id)}">
                <i class="bi bi-mortarboard-fill me-1"></i>\${L("enrolStudent")} (Matricular)
              </button>
            </div>
          </div>
        \`).join("") : \`<div class="col-12">\${EmptyState({ compact: true, title: "Sem inscrições pendentes", description: "Quando um First Timer for marcado com 'Enroll FS', ele aparecerá nesta secção." })}</div>\`}
      </div>
    </article>
  \`;
}`;

if (code.includes(oldRenderFoundationEnrolments)) {
  code = code.replace(oldRenderFoundationEnrolments, newRenderFoundationEnrolments);
}

fs.writeFileSync(DASHBOARD_PATH, code, "utf8");
console.log("Successfully updated Foundation School and First Timers in dashboard.js!");
