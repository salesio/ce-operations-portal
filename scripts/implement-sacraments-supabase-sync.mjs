import fs from "node:fs";

// 1. Update js/sacraments-data-bridge.js to directly delegate to window.CESupabase
const BRIDGE_PATH = "js/sacraments-data-bridge.js";
let bridgeCode = `/**
 * Sacraments data bridge — delegates directly to Supabase with fallback.
 */
(function () {
  function getSupabaseApi() {
    if (typeof window === "undefined") return null;
    if (window.CESupabase && typeof window.CESupabase.createMarriage === "function") {
      return window.CESupabase;
    }
    return null;
  }

  var dataApi = {
    listBaptisms: function () {
      var sb = getSupabaseApi();
      if (sb && sb.listBaptisms) return sb.listBaptisms();
      var client = window.CESupabase && window.CESupabase.getSupabaseFoundationClient && window.CESupabase.getSupabaseFoundationClient();
      if (client) {
        return client.from("baptisms").select("*").order("created_at", { ascending: false }).then(function (r) {
          return { ok: !r.error, data: r.data || [], error: r.error && r.error.message };
        });
      }
      return Promise.resolve({ ok: true, data: [] });
    },
    createBaptism: function (record) {
      var sb = getSupabaseApi();
      if (sb && sb.createBaptism) return sb.createBaptism(record);
      var client = window.CESupabase && window.CESupabase.getSupabaseFoundationClient && window.CESupabase.getSupabaseFoundationClient();
      if (client) {
        return client.from("baptisms").upsert(record).select().single().then(function (r) {
          return { ok: !r.error, data: r.data, error: r.error && r.error.message };
        });
      }
      return Promise.resolve({ ok: true, data: record });
    },
    updateBaptism: function (id, record) {
      var sb = getSupabaseApi();
      if (sb && sb.updateBaptism) return sb.updateBaptism(id, record);
      var client = window.CESupabase && window.CESupabase.getSupabaseFoundationClient && window.CESupabase.getSupabaseFoundationClient();
      if (client) {
        return client.from("baptisms").update(record).eq("id", id).select().single().then(function (r) {
          return { ok: !r.error, data: r.data, error: r.error && r.error.message };
        });
      }
      return Promise.resolve({ ok: true, data: record });
    },
    deleteBaptism: function (id) {
      var sb = getSupabaseApi();
      if (sb && sb.deleteBaptism) return sb.deleteBaptism(id);
      var client = window.CESupabase && window.CESupabase.getSupabaseFoundationClient && window.CESupabase.getSupabaseFoundationClient();
      if (client) {
        return client.from("baptisms").delete().eq("id", id).then(function (r) {
          return { ok: !r.error, error: r.error && r.error.message };
        });
      }
      return Promise.resolve({ ok: true });
    },
    listMarriages: function () {
      var sb = getSupabaseApi();
      if (sb && sb.listMarriages) return sb.listMarriages();
      var client = window.CESupabase && window.CESupabase.getSupabaseFoundationClient && window.CESupabase.getSupabaseFoundationClient();
      if (client) {
        return client.from("marriages").select("*").order("created_at", { ascending: false }).then(function (r) {
          return { ok: !r.error, data: r.data || [], error: r.error && r.error.message };
        });
      }
      return Promise.resolve({ ok: true, data: [] });
    },
    createMarriage: function (record) {
      var sb = getSupabaseApi();
      if (sb && sb.createMarriage) return sb.createMarriage(record);
      var client = window.CESupabase && window.CESupabase.getSupabaseFoundationClient && window.CESupabase.getSupabaseFoundationClient();
      if (client) {
        return client.from("marriages").upsert(record).select().single().then(function (r) {
          return { ok: !r.error, data: r.data, error: r.error && r.error.message };
        });
      }
      return Promise.resolve({ ok: true, data: record });
    },
    updateMarriage: function (id, record) {
      var sb = getSupabaseApi();
      if (sb && sb.updateMarriage) return sb.updateMarriage(id, record);
      var client = window.CESupabase && window.CESupabase.getSupabaseFoundationClient && window.CESupabase.getSupabaseFoundationClient();
      if (client) {
        return client.from("marriages").update(record).eq("id", id).select().single().then(function (r) {
          return { ok: !r.error, data: r.data, error: r.error && r.error.message };
        });
      }
      return Promise.resolve({ ok: true, data: record });
    },
    deleteMarriage: function (id) {
      var sb = getSupabaseApi();
      if (sb && sb.deleteMarriage) return sb.deleteMarriage(id);
      var client = window.CESupabase && window.CESupabase.getSupabaseFoundationClient && window.CESupabase.getSupabaseFoundationClient();
      if (client) {
        return client.from("marriages").delete().eq("id", id).then(function (r) {
          return { ok: !r.error, error: r.error && r.error.message };
        });
      }
      return Promise.resolve({ ok: true });
    },
    listBabyDedications: function () {
      var sb = getSupabaseApi();
      if (sb && sb.listBabyDedications) return sb.listBabyDedications();
      var client = window.CESupabase && window.CESupabase.getSupabaseFoundationClient && window.CESupabase.getSupabaseFoundationClient();
      if (client) {
        return client.from("baby_dedications").select("*").order("created_at", { ascending: false }).then(function (r) {
          return { ok: !r.error, data: r.data || [], error: r.error && r.error.message };
        });
      }
      return Promise.resolve({ ok: true, data: [] });
    },
    createBabyDedication: function (record) {
      var sb = getSupabaseApi();
      if (sb && sb.createBabyDedication) return sb.createBabyDedication(record);
      var client = window.CESupabase && window.CESupabase.getSupabaseFoundationClient && window.CESupabase.getSupabaseFoundationClient();
      if (client) {
        return client.from("baby_dedications").upsert(record).select().single().then(function (r) {
          return { ok: !r.error, data: r.data, error: r.error && r.error.message };
        });
      }
      return Promise.resolve({ ok: true, data: record });
    },
    updateBabyDedication: function (id, record) {
      var sb = getSupabaseApi();
      if (sb && sb.updateBabyDedication) return sb.updateBabyDedication(id, record);
      var client = window.CESupabase && window.CESupabase.getSupabaseFoundationClient && window.CESupabase.getSupabaseFoundationClient();
      if (client) {
        return client.from("baby_dedications").update(record).eq("id", id).select().single().then(function (r) {
          return { ok: !r.error, data: r.data, error: r.error && r.error.message };
        });
      }
      return Promise.resolve({ ok: true, data: record });
    },
    deleteBabyDedication: function (id) {
      var sb = getSupabaseApi();
      if (sb && sb.deleteBabyDedication) return sb.deleteBabyDedication(id);
      var client = window.CESupabase && window.CESupabase.getSupabaseFoundationClient && window.CESupabase.getSupabaseFoundationClient();
      if (client) {
        return client.from("baby_dedications").delete().eq("id", id).then(function (r) {
          return { ok: !r.error, error: r.error && r.error.message };
        });
      }
      return Promise.resolve({ ok: true });
    },
    dualWriteRecord: function (kind, mode, record) {
      if (!record) return Promise.resolve({ ok: true, skipped: true });
      if (kind === "baptism") {
        if (mode === "create") return dataApi.createBaptism(record);
        if (mode === "update") return dataApi.updateBaptism(record.id, record);
      }
      if (kind === "marriage") {
        if (mode === "create") return dataApi.createMarriage(record);
        if (mode === "update") return dataApi.updateMarriage(record.id, record);
      }
      if (kind === "baby") {
        if (mode === "create") return dataApi.createBabyDedication(record);
        if (mode === "update") return dataApi.updateBabyDedication(record.id, record);
      }
      return Promise.resolve({ ok: true, skipped: true });
    }
  };

  window.CESacraments = Object.assign({}, window.CESacraments || {}, dataApi);
  window.CEDataLayer = window.CEDataLayer || {};
  window.CEDataLayer.sacraments = dataApi;
})();
`;
fs.writeFileSync(BRIDGE_PATH, bridgeCode, "utf8");
console.log("Updated js/sacraments-data-bridge.js!");

// 2. Update js/dashboard.js
const DASHBOARD_PATH = "js/dashboard.js";
let dashCode = fs.readFileSync(DASHBOARD_PATH, "utf8");

// Define persistSacramentViaRepository and hydrateSacramentsFromRepository
const newSacramentsSection = `
// ============================================================================
// SACRAMENTS SUPABASE PERSISTENCE & HYDRATION
// ============================================================================

function getSacramentsRepoSafe() {
  return window.CESupabase?.createMarriage ? window.CESupabase : (window.CESacraments || window.CEDataLayer?.sacraments || null);
}

async function persistSacramentViaRepository(type, mode, record) {
  if (!record) return { ok: false, error: "No record" };
  const repo = getSacramentsRepoSafe();
  const sbClient = window.CESupabase?.getSupabaseFoundationClient?.() || window.CESupabase?.getSupabaseAuthClient?.();

  if (!isValidUuid(record.id)) {
    record.id = typeof generateUuid === "function" ? generateUuid() : ("00000000-0000-4000-8000-" + Date.now().toString(16).padStart(12, "0"));
  }

  const tableMap = {
    baptism: "baptisms",
    marriage: "marriages",
    baby: "baby_dedications"
  };

  const tableName = tableMap[type];

  if (mode === "delete") {
    if (type === "marriage" && repo?.deleteMarriage) {
      try { await repo.deleteMarriage(record.id); } catch (_) {}
    } else if (type === "baptism" && repo?.deleteBaptism) {
      try { await repo.deleteBaptism(record.id); } catch (_) {}
    } else if (type === "baby" && repo?.deleteBabyDedication) {
      try { await repo.deleteBabyDedication(record.id); } catch (_) {}
    } else if (sbClient && tableName) {
      try { await sbClient.from(tableName).delete().eq("id", record.id); } catch (_) {}
    }
    return { ok: true };
  }

  let dbPayload = {};
  if (type === "marriage") {
    dbPayload = {
      id: record.id,
      groom_name: record.nome_do_noivo || record.groom_name || "",
      groom_phone: record.telefone_do_noivo || record.groom_phone || "",
      bride_name: record.nome_da_noiva || record.bride_name || "",
      bride_phone: record.telefone_da_noiva || record.bride_phone || "",
      church_id: isValidUuid(record.church_id) ? record.church_id : (activeUser?.church_id && isValidUuid(activeUser.church_id) ? activeUser.church_id : null),
      marriage_date: record.data_do_casamento || record.marriage_date || null,
      officiating_minister_name: record.pastor_responsavel || record.officiating_minister_name || "",
      pre_marital_counseling_completed: !!(record.aconselhamento_concluido ?? record.counseling_completed),
      status: record.estado || record.status || "Pending",
      notes: record.observacoes || record.notes || "",
      updated_at: new Date().toISOString()
    };
    if (mode === "create" && repo?.createMarriage) {
      try {
        const res = await repo.createMarriage(dbPayload);
        if (res?.ok) return res;
      } catch (_) {}
    } else if (mode === "update" && repo?.updateMarriage) {
      try {
        const res = await repo.updateMarriage(record.id, dbPayload);
        if (res?.ok) return res;
      } catch (_) {}
    }
  } else if (type === "baptism") {
    const fullName = record.full_name || [record.nome, record.apelido].filter(Boolean).join(" ") || record.nome || "";
    dbPayload = {
      id: record.id,
      full_name: fullName,
      phone: record.telefone || record.phone || "",
      church_id: isValidUuid(record.church_id) ? record.church_id : (activeUser?.church_id && isValidUuid(activeUser.church_id) ? activeUser.church_id : null),
      baptism_date: record.data_do_baptismo || record.baptism_date || null,
      baptism_location: record.local_do_baptismo || record.baptism_location || "",
      minister_name: record.baptizado_por || record.minister_name || record.pastor_responsavel || "",
      status: record.estado || record.status || "Pending",
      notes: record.observacoes || record.notes || "",
      updated_at: new Date().toISOString()
    };
    if (mode === "create" && repo?.createBaptism) {
      try {
        const res = await repo.createBaptism(dbPayload);
        if (res?.ok) return res;
      } catch (_) {}
    } else if (mode === "update" && repo?.updateBaptism) {
      try {
        const res = await repo.updateBaptism(record.id, dbPayload);
        if (res?.ok) return res;
      } catch (_) {}
    }
  } else if (type === "baby") {
    dbPayload = {
      id: record.id,
      child_name: record.nome_da_crianca || record.child_name || "",
      child_date_of_birth: record.data_de_nascimento || record.child_date_of_birth || null,
      parent_name: record.nome_do_pai || record.parent_name || record.nome_da_mae || "",
      parent_phone: record.telefone_dos_pais || record.parent_phone || "",
      second_parent_name: record.nome_da_mae || record.second_parent_name || "",
      church_id: isValidUuid(record.church_id) ? record.church_id : (activeUser?.church_id && isValidUuid(activeUser.church_id) ? activeUser.church_id : null),
      dedication_date: record.data_da_dedicacao || record.dedication_date || null,
      minister_name: record.pastor_responsavel || record.minister_name || "",
      status: record.estado || record.status || "Pending",
      notes: record.observacoes || record.notes || "",
      updated_at: new Date().toISOString()
    };
    if (mode === "create" && repo?.createBabyDedication) {
      try {
        const res = await repo.createBabyDedication(dbPayload);
        if (res?.ok) return res;
      } catch (_) {}
    } else if (mode === "update" && repo?.updateBabyDedication) {
      try {
        const res = await repo.updateBabyDedication(record.id, dbPayload);
        if (res?.ok) return res;
      } catch (_) {}
    }
  }

  // Direct Supabase upsert fallback
  if (sbClient && tableName) {
    try {
      const { data, error } = await sbClient.from(tableName).upsert(dbPayload).select().single();
      if (!error && data) return { ok: true, data };
    } catch (err) {
      console.warn("[CE Sacraments] Direct upsert error", err);
    }
  }

  return { ok: true, data: record };
}

function dualWriteSacramentsRecord(modalType, mode, record) {
  void persistSacramentViaRepository(modalType, mode, record);
}

async function hydrateSacramentsFromRepository() {
  const sbClient = window.CESupabase?.getSupabaseFoundationClient?.() || window.CESupabase?.getSupabaseAuthClient?.();
  const repo = getSacramentsRepoSafe();
  if (!sbClient && !repo) return false;

  try {
    let hydrated = false;
    state.sacraments = state.sacraments && !Array.isArray(state.sacraments)
      ? state.sacraments
      : structuredClone(seedData.sacraments || { baptisms: [], marriages: [], babies: [] });

    // 1. Baptisms
    let bapData = null;
    if (sbClient) {
      const res = await sbClient.from("baptisms").select("*").order("created_at", { ascending: false });
      if (res?.data) bapData = res.data;
    }
    if (!bapData && typeof repo?.listBaptisms === "function") {
      const res = await repo.listBaptisms();
      if (res?.ok && Array.isArray(res.data)) bapData = res.data;
    }
    if (Array.isArray(bapData)) {
      const cleanBap = bapData.filter((r) => !r.metadata?.synthetic && !String(r.baptism_number || "").includes("DEMO"));
      state.sacraments.baptisms = cleanBap.map((row) => ({
        id: row.id,
        nome: row.full_name ? row.full_name.split(" ")[0] : (row.nome || ""),
        apelido: row.full_name ? row.full_name.split(" ").slice(1).join(" ") : (row.apelido || ""),
        full_name: row.full_name || row.nome || "",
        telefone: row.phone || row.telefone || "",
        phone: row.phone || row.telefone || "",
        church_id: row.church_id || "",
        data_do_baptismo: row.baptism_date || row.data_do_baptismo || "",
        local_do_baptismo: row.baptism_location || row.local_do_baptismo || "",
        baptizado_por: row.minister_name || row.baptizado_por || "",
        pastor_responsavel: row.minister_name || row.pastor_responsavel || "",
        estado: row.status || row.estado || "Pending",
        status: row.status || row.estado || "Pending",
        observacoes: row.notes || row.observacoes || ""
      }));
      hydrated = true;
    }

    // 2. Marriages
    let marData = null;
    if (sbClient) {
      const res = await sbClient.from("marriages").select("*").order("created_at", { ascending: false });
      if (res?.data) marData = res.data;
    }
    if (!marData && typeof repo?.listMarriages === "function") {
      const res = await repo.listMarriages();
      if (res?.ok && Array.isArray(res.data)) marData = res.data;
    }
    if (Array.isArray(marData)) {
      const cleanMar = marData.filter((r) => !r.metadata?.synthetic && !String(r.marriage_number || "").includes("DEMO"));
      state.sacraments.marriages = cleanMar.map((row) => ({
        id: row.id,
        nome_do_noivo: row.groom_name || row.nome_do_noivo || "",
        groom_name: row.groom_name || row.nome_do_noivo || "",
        telefone_do_noivo: row.groom_phone || row.telefone_do_noivo || "",
        groom_phone: row.groom_phone || row.telefone_do_noivo || "",
        nome_da_noiva: row.bride_name || row.nome_da_noiva || "",
        bride_name: row.bride_name || row.nome_da_noiva || "",
        telefone_da_noiva: row.bride_phone || row.telefone_da_noiva || "",
        bride_phone: row.bride_phone || row.telefone_da_noiva || "",
        church_id: row.church_id || "",
        data_do_casamento: row.marriage_date || row.data_do_casamento || "",
        marriage_date: row.marriage_date || row.data_do_casamento || "",
        pastor_responsavel: row.officiating_minister_name || row.pastor_responsavel || "",
        aconselhamento_concluido: !!(row.pre_marital_counseling_completed ?? row.aconselhamento_concluido),
        estado: row.status || row.estado || "Pending",
        status: row.status || row.estado || "Pending",
        observacoes: row.notes || row.observacoes || ""
      }));
      hydrated = true;
    }

    // 3. Baby Dedications
    let babyData = null;
    if (sbClient) {
      const res = await sbClient.from("baby_dedications").select("*").order("created_at", { ascending: false });
      if (res?.data) babyData = res.data;
    }
    if (!babyData && typeof repo?.listBabyDedications === "function") {
      const res = await repo.listBabyDedications();
      if (res?.ok && Array.isArray(res.data)) babyData = res.data;
    }
    if (Array.isArray(babyData)) {
      const cleanBaby = babyData.filter((r) => !r.metadata?.synthetic && !String(r.dedication_number || "").includes("DEMO"));
      state.sacraments.babies = cleanBaby.map((row) => ({
        id: row.id,
        nome_da_crianca: row.child_name || row.nome_da_crianca || "",
        child_name: row.child_name || row.nome_da_crianca || "",
        data_de_nascimento: row.child_date_of_birth || row.data_de_nascimento || "",
        nome_do_pai: row.parent_name || row.nome_do_pai || "",
        nome_da_mae: row.second_parent_name || row.nome_da_mae || "",
        telefone_dos_pais: row.parent_phone || row.telefone_dos_pais || "",
        church_id: row.church_id || "",
        data_da_dedicacao: row.dedication_date || row.data_da_dedicacao || "",
        pastor_responsavel: row.minister_name || row.pastor_responsavel || "",
        estado: row.status || row.estado || "Pending",
        status: row.status || row.estado || "Pending",
        observacoes: row.notes || row.observacoes || ""
      }));
      hydrated = true;
    }

    if (hydrated) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (_) {}
      console.info("[CE Sacraments] hydrated from Supabase", {
        baptisms: (state.sacraments.baptisms || []).length,
        marriages: (state.sacraments.marriages || []).length,
        babies: (state.sacraments.babies || []).length,
      });
      if (activeRoute === "sacraments" && typeof renderSacraments === "function") {
        renderSacraments();
      }
    }
    return hydrated;
  } catch (error) {
    console.warn("[CE Sacraments] hydrate from Supabase failed", error);
    return false;
  }
}
`;

const oldSacramentsRegex = /function dualWriteSacramentsRecord\(modalType, mode, record\) \{[\s\S]*?async function hydrateSacramentsFromRepository\(\) \{[\s\S]*?return hydrated;\r?\n\s*\} catch \(error\) \{[\s\S]*?return false;\r?\n\s*\}\r?\n\}/;

if (oldSacramentsRegex.test(dashCode)) {
  dashCode = dashCode.replace(oldSacramentsRegex, newSacramentsSection.trim());
  console.log("Replaced dualWriteSacramentsRecord and hydrateSacramentsFromRepository in dashboard.js!");
} else {
  console.log("oldSacramentsRegex did not match");
}

// 3. Update quickAction delete handling for sacraments
const oldDeleteBlock = `    if (["churchReport", "alecRegistration", "alecScore", "cellReport"].includes(type)) {`;
const newDeleteBlock = `    if (["baptism", "marriage", "baby"].includes(type)) {
      const previous = collection[index];
      collection.splice(index, 1);
      saveState(\`Deleted \${type} \${id}\`);
      setRoute(activeRoute);
      void Promise.resolve(persistSacramentViaRepository(type, "delete", previous)).catch((err) => {
        console.warn("[CE Sacraments] background delete sync error", err);
      });
      return;
    }
    if (["churchReport", "alecRegistration", "alecScore", "cellReport"].includes(type)) {`;

if (dashCode.includes(oldDeleteBlock)) {
  dashCode = dashCode.replace(oldDeleteBlock, newDeleteBlock);
  console.log("Added sacraments delete handling to quickAction!");
}

// 4. In setRoute, trigger hydrateSacramentsFromRepository if activeRoute === "sacraments"
const oldSetRouteSacramentsCheck = `  if (String(activeRoute || "").startsWith("cell")) {`;
const newSetRouteSacramentsCheck = `  if (activeRoute === "sacraments") {
    Promise.resolve(hydrateSacramentsFromRepository())
      .then((hydrated) => {
        if (hydrated && activeRoute === "sacraments") {
          try { renderSacraments(); } catch (_) {}
        }
      })
      .catch((err) => console.warn("[CE Sacraments] route hydrate skipped", err));
  }
  if (String(activeRoute || "").startsWith("cell")) {`;

if (dashCode.includes(oldSetRouteSacramentsCheck) && !dashCode.includes(`if (activeRoute === "sacraments") {`)) {
  dashCode = dashCode.replace(oldSetRouteSacramentsCheck, newSetRouteSacramentsCheck);
  console.log("Added activeRoute === 'sacraments' hydration trigger to setRoute!");
}

// 5. In continueEnterDashboard, hydrate sacraments in background
const oldContinueHydrate = `  // Hydrate cell ministry & church reports asynchronously in background without full-screen re-renders`;
const newContinueHydrate = `  // Hydrate sacraments asynchronously in background from Supabase
  Promise.resolve()
    .then(() => hydrateSacramentsFromRepository())
    .then((hydrated) => {
      if (hydrated && activeRoute === "sacraments" && typeof renderSacraments === "function") {
        renderSacraments();
      }
    })
    .catch((error) => console.warn("[CE Sacraments] background hydrate skipped", error));

  // Hydrate cell ministry & church reports asynchronously in background without full-screen re-renders`;

if (dashCode.includes(oldContinueHydrate) && !dashCode.includes("// Hydrate sacraments asynchronously in background from Supabase")) {
  dashCode = dashCode.replace(oldContinueHydrate, newContinueHydrate);
  console.log("Added background sacraments hydrate to continueEnterDashboard!");
}

fs.writeFileSync(DASHBOARD_PATH, dashCode, "utf8");
console.log("Successfully wrote all Sacraments Supabase persistence updates to dashboard.js!");
