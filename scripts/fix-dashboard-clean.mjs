import fs from "node:fs";

let dashCode = fs.readFileSync("js/dashboard.js", "utf8");

// Fix Hydrate
dashCode = dashCode.replace(
  /(\/\/ 2\. Teachers[\s\S]*?state\.foundationTeachers = \[\.\.\.byId\.values\(\)\];\s*hydrated = true;\s*\})[\s\S]*?(\/\/ 3\. Classes[\s\S]*?state\.foundationClassGroups = \[\.\.\.byId\.values\(\)\];\s*hydrated = true;\s*\})/,
  `// 2. Teachers
    let teachersData = null;
    if (sbClient) {
      const res = await sbClient.from("foundation_school_teachers").select("*").order("created_at", { ascending: false });
      if (res?.data && Array.isArray(res.data)) teachersData = res.data;
    }
    if (!teachersData && typeof repo?.listTeachers === "function") {
      const res = await repo.listTeachers();
      if (res?.ok && Array.isArray(res.data)) teachersData = res.data;
    }
    if (Array.isArray(teachersData)) {
      const liveTeachers = teachersData.filter((t) => !isDemoFoundationRecord(t));
      const prev = new Map((state.foundationTeachers || []).filter((t) => !isDemoFoundationRecord(t)).map((t) => [t.id, t]));
      const byId = new Map();
      liveTeachers.forEach((row) => {
        byId.set(row.id, { ...(prev.get(row.id) || {}), ...row, id: row.id });
      });
      prev.forEach((localRow, id) => {
        if (!byId.has(id) && !isDemoFoundationRecord(localRow) && isValidUuid(String(id))) {
          byId.set(id, localRow);
        }
      });
      state.foundationTeachers = [...byId.values()];
      hydrated = true;
    }

    // 3. Classes
    let classesData = null;
    if (sbClient) {
      const res = await sbClient.from("foundation_school_classes").select("*").order("created_at", { ascending: false });
      if (res?.data && Array.isArray(res.data)) classesData = res.data;
    }
    if (!classesData && typeof repo?.listClasses === "function") {
      const res = await repo.listClasses();
      if (res?.ok && Array.isArray(res.data)) classesData = res.data;
    }
    if (Array.isArray(classesData)) {
      const liveClasses = classesData.filter((c) => !isDemoFoundationRecord(c));
      const prev = new Map((state.foundationClassGroups || []).filter((c) => !isDemoFoundationRecord(c)).map((c) => [c.id, c]));
      const byId = new Map();
      liveClasses.forEach((row) => {
        byId.set(row.id, { ...(prev.get(row.id) || {}), ...row, id: row.id });
      });
      prev.forEach((localRow, id) => {
        if (!byId.has(id) && !isDemoFoundationRecord(localRow) && isValidUuid(String(id))) {
          byId.set(id, localRow);
        }
      });
      state.foundationClassGroups = [...byId.values()];
      hydrated = true;
    }`
);

// Fix Class Edit/Close/View Buttons
const classButtonsRegex = /const foundationClassEditBtn = event\.target\.closest\("\[data-foundation-class-edit\]"\);[\s\S]*?return openFoundationClassForm\(foundationClassEditBtn\.getAttribute\("data-foundation-class-edit"\), "edit"\);\s*\}/;

const newClassEventBlock = `const foundationClassViewBtn = event.target.closest("[data-foundation-class-view]");
  if (foundationClassViewBtn) {
    return openFoundationClassForm(foundationClassViewBtn.getAttribute("data-foundation-class-view"), "view");
  }
  const foundationClassCloseBtn = event.target.closest("[data-foundation-class-close]");
  if (foundationClassCloseBtn) {
    const classId = foundationClassCloseBtn.getAttribute("data-foundation-class-close");
    const group = (state.foundationClassGroups || []).find((g) => String(g.id) === String(classId));
    if (!group) return;
    const confirmMsg = lang === "pt"
      ? \`Tem certeza que deseja encerrar/concluir a turma "\${group.name}"?\\n\\nA turma será marcada como "Concluída" e permanecerá disponível no histórico e nos relatórios.\`
      : \`Are you sure you want to close/conclude the class "\${group.name}"?\\n\\nThe class will be marked as "Concluded" and will remain available in history and reports.\`;
    if (!confirm(confirmMsg)) return;

    const previous = { ...group };
    group.status = "Concluída";
    group.end_date = group.end_date || new Date().toISOString().slice(0, 10);
    group.updated_at = new Date().toISOString().slice(0, 10);

    foundationAudit("class_group_closed", "foundationClassGroup", group.id, JSON.stringify(previous), JSON.stringify(group), activeUser?.name || "Admin Principal");
    saveState(\`Closed Foundation School class \${group.name}\`);
    void persistFoundationClassViaRepository("update", group).catch((err) => console.warn("[CE Foundation] close class sync error", err));
    if (typeof showToast === "function") showToast(lang === "pt" ? "Turma encerrada com sucesso! Permanece no histórico." : "Class closed successfully! Remains in history.");
    if (activeRoute === "foundation") renderFoundation();
    return;
  }
  const foundationClassEditBtn = event.target.closest("[data-foundation-class-edit]");
  if (foundationClassEditBtn) {
    return openFoundationClassForm(foundationClassEditBtn.getAttribute("data-foundation-class-edit"), "edit");
  }`;

dashCode = dashCode.replace(classButtonsRegex, newClassEventBlock);

fs.writeFileSync("js/dashboard.js", dashCode, "utf8");
console.log("Updated successfully.");
