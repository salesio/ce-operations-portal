import fs from "node:fs";

const DASHBOARD_PATH = "js/dashboard.js";
let code = fs.readFileSync(DASHBOARD_PATH, "utf8");

// 1. Patch scoped()
const oldScopedBlock = `  const hasNationalPastoralScope = [
    "reitor",
    "rector",
    "pastoral reitor",
    "pastoral rector",
    "follow up coordinator",
    "acompanhamento",
    "responsavel de acompanhamento",
  ].includes(pastoralRole);
  if (hasNationalPastoralScope && ["dashboard", "firstTimers", "followUp"].includes(module)) {
    return list;
  }`;

const newScopedBlock = `  const hasNationalPastoralScope = [
    "reitor",
    "rector",
    "pastoral reitor",
    "pastoral rector",
    "pastoral care rector",
    "reitor de cuidados pastorais",
    "follow up coordinator",
    "acompanhamento",
    "responsavel de acompanhamento",
  ].includes(pastoralRole) || (typeof isPastoralCareRector === "function" && isPastoralCareRector(activeUser));
  if (hasNationalPastoralScope && ["dashboard", "firstTimers", "followUp", "foundation", "sacraments", "counseling"].includes(module)) {
    return list;
  }`;

if (code.includes(oldScopedBlock)) {
  code = code.replace(oldScopedBlock, newScopedBlock);
  console.log("Patched scoped() for pastoral care national scope!");
}

// 2. Patch hydrateFirstTimersFromRepository and persistFirstTimerViaRepository
const newFirstTimersHydration = `
async function persistFirstTimerViaRepository(mode, personRecord) {
  const rawId = typeof personRecord === "string" ? personRecord : personRecord?.id;
  const sbClient = window.CESupabase?.getSupabaseFoundationClient?.() || window.CESupabase?.getSupabaseAuthClient?.() || (typeof supabase !== "undefined" ? supabase : null);
  const repo = getFirstTimersRepoSafe();

  if (mode === "delete") {
    if (!rawId) return { ok: true };
    const promises = [];
    if (sbClient) {
      promises.push(
        sbClient.from("first_timers").delete().eq("id", rawId).then((res) => {
          if (res?.error) console.warn("[CE FirstTimers] sbClient delete warning:", rawId, res.error);
        })
      );
    }
    if (repo?.deleteFirstTimer) {
      promises.push(repo.deleteFirstTimer(rawId));
    }
    try {
      await Promise.allSettled(promises);
    } catch (err) {
      console.warn("[CE FirstTimers] Delete failed:", err);
    }
    return { ok: true };
  }

  // Ensure record has valid UUID
  if (!isValidUuid(personRecord.id)) {
    personRecord.id = typeof generateUuid === "function" ? generateUuid() : ("00000000-0000-4000-8000-" + Date.now().toString(16).padStart(12, "0"));
  }

  const fullName = personRecord.full_name || [personRecord.nome, personRecord.apelido].filter(Boolean).join(" ") || personRecord.nome || "Visitante";
  const dbPayload = {
    id: personRecord.id,
    first_timer_number: personRecord.first_timer_number || personRecord.id,
    full_name: fullName,
    first_name: personRecord.nome || fullName.split(" ")[0] || "",
    last_name: personRecord.apelido || fullName.split(" ").slice(1).join(" ") || "",
    title: personRecord.tratamento || personRecord.title || null,
    gender: personRecord.genero || personRecord.gender || null,
    phone: personRecord.telefone || personRecord.phone || null,
    whatsapp: personRecord.whatsapp || personRecord.telefone || personRecord.phone || null,
    email: personRecord.email || null,
    address: personRecord.endereco || personRecord.address || null,
    neighborhood: personRecord.neighborhood || personRecord.bairro || null,
    profession: personRecord.profession || personRecord.profissao || null,
    church_id: isValidUuid(personRecord.church_id) ? personRecord.church_id : (activeUser?.church_id && isValidUuid(activeUser.church_id) ? activeUser.church_id : null),
    church_name: personRecord.church_name || (personRecord.church_id ? churchName(personRecord.church_id) : null),
    visit_date: personRecord.data_do_culto || personRecord.visit_date || new Date().toISOString().slice(0, 10),
    service_name: personRecord.culto || personRecord.service_name || "Culto de Domingo",
    invited_by: personRecord.convidado_por || personRecord.invited_by || null,
    invited_by_name: personRecord.convidado_por || personRecord.invited_by || null,
    born_again: Boolean(personRecord.nasceu_de_novo ?? personRecord.born_again),
    foundation_school_interest: Boolean(personRecord.foundation_school_interest ?? personRecord.quer_escola_de_fundacao),
    counseling_interest: Boolean(personRecord.counseling_interest ?? personRecord.quer_aconselhamento),
    cell_interest: Boolean(personRecord.cell_interest ?? personRecord.interesse_em_celula),
    workflow_status: personRecord.workflow_status || "DRAFT",
    follow_up_status: personRecord.follow_up_status || personRecord.estado_do_seguimento || "Pending",
    status: personRecord.status || "Active",
    notes: personRecord.notas || personRecord.notes || null,
    updated_at: new Date().toISOString()
  };

  if (sbClient) {
    try {
      await sbClient.from("first_timers").upsert(dbPayload);
    } catch (err) {
      console.warn("[CE FirstTimers] sbClient upsert warning", err);
    }
  }
  if (mode === "create" && repo?.createFirstTimer) {
    try { await repo.createFirstTimer(personRecord); } catch (_) {}
  } else if (mode === "update" && repo?.updateFirstTimer) {
    try { await repo.updateFirstTimer(personRecord.id, personRecord); } catch (_) {}
  }

  return { ok: true, data: personRecord };
}

async function hydrateFirstTimersFromRepository() {
  const sbClient = window.CESupabase?.getSupabaseFoundationClient?.() || window.CESupabase?.getSupabaseAuthClient?.() || (typeof supabase !== "undefined" ? supabase : null);
  const repo = getFirstTimersRepoSafe();
  if (!sbClient && !repo) return false;

  try {
    let ftData = null;
    if (sbClient) {
      const res = await sbClient.from("first_timers").select("*").order("created_at", { ascending: false });
      if (res?.data && Array.isArray(res.data)) {
        ftData = res.data;
      }
    }
    if (!ftData && typeof repo?.listFirstTimers === "function") {
      const res = await repo.listFirstTimers();
      if (res?.ok && Array.isArray(res.data)) ftData = res.data;
    }
    if (!Array.isArray(ftData)) return false;

    const previousById = new Map((state.firstTimers || []).map((item) => [item.id, item]));
    state.firstTimers = ftData.map((row) => {
      const prev = previousById.get(row.id) || {};
      const full = row.full_name || [row.first_name, row.last_name].filter(Boolean).join(" ") || row.nome || "Visitante";
      return {
        ...prev,
        id: row.id,
        first_timer_number: row.first_timer_number || row.id,
        full_name: full,
        nome: row.first_name || (full ? full.split(" ")[0] : "") || (row.nome || ""),
        apelido: row.last_name || (full ? full.split(" ").slice(1).join(" ") : "") || (row.apelido || ""),
        tratamento: row.title || row.tratamento || "Irmão/Irmã",
        genero: row.gender || row.genero || "",
        data_de_nascimento: row.date_of_birth || row.data_de_nascimento || null,
        telefone: row.phone || row.telefone || "",
        phone: row.phone || row.telefone || "",
        whatsapp: row.whatsapp || row.phone || row.telefone || "",
        email: row.email || "",
        endereco: row.address || row.endereco || "",
        neighborhood: row.neighborhood || row.bairro || "",
        profession: row.profession || row.profissao || "",
        church_id: row.church_id || "",
        church_name: row.church_name || "",
        cell_group_id: row.cell_group_id || null,
        cell_group_name: row.cell_group_name || null,
        cell_id: row.cell_id || null,
        cell_name: row.cell_name || null,
        data_do_culto: row.visit_date || row.data_do_culto || "",
        culto: row.service_name || row.culto || "Culto de Domingo",
        convidado_por: row.invited_by_name || row.invited_by || row.convidado_por || "",
        nasceu_de_novo: Boolean(row.born_again),
        foundation_school_interest: Boolean(row.foundation_school_interest ?? row.foundation_interest ?? row.quer_escola_de_fundacao),
        quer_escola_de_fundacao: Boolean(row.foundation_school_interest ?? row.foundation_interest ?? row.quer_escola_de_fundacao),
        counseling_interest: Boolean(row.counseling_interest ?? row.quer_aconselhamento),
        quer_aconselhamento: Boolean(row.counseling_interest ?? row.quer_aconselhamento),
        cell_interest: Boolean(row.cell_interest ?? row.interesse_em_celula),
        interesse_em_celula: Boolean(row.cell_interest ?? row.interesse_em_celula),
        workflow_status: row.workflow_status || "DRAFT",
        estado_do_seguimento: row.follow_up_status || row.estado_do_seguimento || "Pending",
        follow_up_status: row.follow_up_status || row.estado_do_seguimento || "Pending",
        assigned_to_user_id: row.assigned_to_user_id || null,
        assigned_to_name: row.assigned_to_name || null,
        converted_to_member: Boolean(row.converted_to_member),
        member_id: row.member_id || null,
        status: row.status || "Active",
        notas: row.notes || row.notas || "",
        created_at: row.created_at || new Date().toISOString()
      };
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    console.info("[CE FirstTimers] hydrated", state.firstTimers.length, "first timers from Supabase");
    return true;
  } catch (error) {
    console.warn("[CE FirstTimers] hydrate error", error);
    return false;
  }
}
`;

const oldFirstTimersBlockRegex = /async function persistFirstTimerViaRepository[\s\S]*?async function hydrateFirstTimersFromRepository[\s\S]*?^}/m;
code = code.replace(oldFirstTimersBlockRegex, newFirstTimersHydration.trim());
console.log("Patched firstTimers live Supabase bridge!");

// 3. Patch hydrateFollowUpsFromRepository
const newFollowUpsHydration = `
async function hydrateFollowUpsFromRepository() {
  const sbClient = window.CESupabase?.getSupabaseFoundationClient?.() || window.CESupabase?.getSupabaseAuthClient?.() || (typeof supabase !== "undefined" ? supabase : null);
  const repo = getFollowUpsRepoSafe();
  if (!sbClient && !repo) return false;

  try {
    let fuData = null;
    if (sbClient) {
      const res = await sbClient.from("follow_ups").select("*").order("created_at", { ascending: false });
      if (res?.data && Array.isArray(res.data)) {
        fuData = res.data;
      }
    }
    if (!fuData && typeof repo?.listFollowUps === "function") {
      const res = await repo.listFollowUps();
      if (res?.ok && Array.isArray(res.data)) fuData = res.data;
    }
    if (!Array.isArray(fuData)) return false;

    const previousById = new Map((state.followUps || []).map((item) => [item.id, item]));
    state.followUps = fuData.map((row) => {
      const prev = previousById.get(row.id) || {};
      const status = row.status || row.estado || "Pending";
      return {
        ...prev,
        id: row.id,
        first_timer_id: row.first_timer_id || "",
        member_id: row.member_id || "",
        person_type: row.person_type || (row.first_timer_id ? "First Timer" : "Member"),
        full_name: row.person_name || row.full_name || "",
        phone: row.phone || "",
        telefone: row.phone || "",
        whatsapp: row.whatsapp || row.phone || "",
        email: row.email || "",
        church_id: row.church_id || "",
        church_name: row.church_name || "",
        cell_group_id: row.cell_group_id || null,
        cell_id: row.cell_id || null,
        source: row.source || "First Timer",
        status: status,
        estado: row.estado || status,
        priority: row.priority || "Normal",
        responsible_user_id: row.responsible_user_id || null,
        responsible_name: row.responsible_name || "",
        next_contact_date: row.next_contact_date || null,
        last_contact_date: row.last_contact_date || null,
        last_contact_method: row.last_contact_method || null,
        last_contact_result: row.last_contact_result || null,
        notes: row.notes || "",
        notas: row.notes || "",
        wants_foundation_school: Boolean(row.wants_foundation_school),
        interested_in_cell: Boolean(row.interested_in_cell),
        wants_counseling: Boolean(row.wants_counseling),
        became_member: Boolean(row.became_member),
        created_at: row.created_at || new Date().toISOString()
      };
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    console.info("[CE FollowUps] hydrated", state.followUps.length, "follow-ups from Supabase");
    return true;
  } catch (error) {
    console.warn("[CE FollowUps] hydrate error", error);
    return false;
  }
}
`;

const oldFollowUpsHydrationRegex = /async function hydrateFollowUpsFromRepository[\s\S]*?^}/m;
code = code.replace(oldFollowUpsHydrationRegex, newFollowUpsHydration.trim());
console.log("Patched followUps live Supabase bridge!");

// 4. Patch hydrateFoundationSchoolFromRepository
const newFoundationHydration = `
async function hydrateFoundationSchoolFromRepository() {
  const sbClient = window.CESupabase?.getSupabaseFoundationClient?.() || window.CESupabase?.getSupabaseAuthClient?.() || (typeof supabase !== "undefined" ? supabase : null);
  const repo = getFoundationSchoolRepoSafe();
  if (!sbClient && !repo) return false;

  try {
    let hydrated = false;
    // 1. Students
    let studentsData = null;
    if (sbClient) {
      const res = await sbClient.from("foundation_school_students").select("*").order("created_at", { ascending: false });
      if (res?.data && Array.isArray(res.data)) studentsData = res.data;
    }
    if (!studentsData && typeof repo?.listStudents === "function") {
      const res = await repo.listStudents();
      if (res?.ok && Array.isArray(res.data)) studentsData = res.data;
    }
    if (Array.isArray(studentsData)) {
      const prev = new Map((state.foundationStudents || []).map((s) => [s.id, s]));
      const byId = new Map();
      studentsData.forEach((row) => {
        const previous = prev.get(row.id) || {};
        byId.set(row.id, migrateFoundationStudentRecord({ ...row, ...previous, id: row.id }));
      });
      prev.forEach((localRow, id) => {
        if (!byId.has(id)) byId.set(id, migrateFoundationStudentRecord(localRow));
      });
      state.foundationStudents = [...byId.values()];
      hydrated = true;
    }

    // 2. Teachers
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
      const prev = new Map((state.foundationTeachers || []).map((t) => [t.id, t]));
      const byId = new Map();
      teachersData.forEach((row) => {
        byId.set(row.id, { ...(prev.get(row.id) || {}), ...row, id: row.id });
      });
      prev.forEach((localRow, id) => {
        if (!byId.has(id)) byId.set(id, localRow);
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
      const prev = new Map((state.foundationClassGroups || []).map((c) => [c.id, c]));
      const byId = new Map();
      classesData.forEach((row) => {
        byId.set(row.id, { ...(prev.get(row.id) || {}), ...row, id: row.id });
      });
      prev.forEach((localRow, id) => {
        if (!byId.has(id)) byId.set(id, localRow);
      });
      state.foundationClassGroups = [...byId.values()];
      hydrated = true;
    }

    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return hydrated;
  } catch (error) {
    console.warn("[CE Foundation] hydrate error", error);
    return false;
  }
}
`;

const oldFoundationHydrationRegex = /async function hydrateFoundationSchoolFromRepository[\s\S]*?if \(hydrated\) localStorage\.setItem\(STORAGE_KEY, JSON\.stringify\(state\)\);[\s\S]*?^}/m;
code = code.replace(oldFoundationHydrationRegex, newFoundationHydration.trim());
console.log("Patched foundationSchool live Supabase bridge!");

// 5. Patch setRoute route hooks
const oldSacramentsRouteCheck = `  if (activeRoute === "sacraments") {
    Promise.resolve(hydrateSacramentsFromRepository())
      .then((hydrated) => {
        if (hydrated && activeRoute === "sacraments") {
          try { renderSacraments(); } catch (_) {}
        }
      })
      .catch((err) => console.warn("[CE Sacraments] route hydrate skipped", err));
  }`;

const newPastoralCareRouteHooks = `  if (activeRoute === "firstTimers") {
    Promise.resolve(hydrateFirstTimersFromRepository())
      .then((hydrated) => {
        if (hydrated && activeRoute === "firstTimers" && typeof renderFirstTimers === "function") {
          try { renderFirstTimers(); } catch (_) {}
        }
      })
      .catch((err) => console.warn("[CE FirstTimers] route hydrate skipped", err));
  }
  if (activeRoute === "followUp") {
    Promise.allSettled([hydrateFirstTimersFromRepository(), hydrateFollowUpsFromRepository()])
      .then(() => {
        if (activeRoute === "followUp" && typeof renderFollowUp === "function") {
          try { renderFollowUp(); } catch (_) {}
        }
      })
      .catch((err) => console.warn("[CE FollowUps] route hydrate skipped", err));
  }
  if (activeRoute === "foundation") {
    Promise.resolve(hydrateFoundationSchoolFromRepository())
      .then((hydrated) => {
        if (hydrated && activeRoute === "foundation" && typeof renderFoundation === "function") {
          try { renderFoundation(); } catch (_) {}
        }
      })
      .catch((err) => console.warn("[CE Foundation] route hydrate skipped", err));
  }
  if (activeRoute === "counseling") {
    Promise.resolve(hydrateCounselingFromRepository())
      .then((hydrated) => {
        if (hydrated && activeRoute === "counseling" && typeof renderCounseling === "function") {
          try { renderCounseling(); } catch (_) {}
        }
      })
      .catch((err) => console.warn("[CE Counseling] route hydrate skipped", err));
  }
  if (activeRoute === "sacraments") {
    Promise.resolve(hydrateSacramentsFromRepository())
      .then((hydrated) => {
        if (hydrated && activeRoute === "sacraments" && typeof renderSacraments === "function") {
          try { renderSacraments(); } catch (_) {}
        }
      })
      .catch((err) => console.warn("[CE Sacraments] route hydrate skipped", err));
  }`;

if (code.includes(oldSacramentsRouteCheck)) {
  code = code.replace(oldSacramentsRouteCheck, newPastoralCareRouteHooks);
  console.log("Patched setRoute hooks for all pastoral care modules!");
}

fs.writeFileSync(DASHBOARD_PATH, code, "utf8");
console.log("All patches successfully written to js/dashboard.js!");
