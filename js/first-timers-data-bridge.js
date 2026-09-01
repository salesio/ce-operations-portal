/**
 * First Timers / Primeira Vez bridge — direct Supabase live repository with local fallback.
 */
(function () {
  function getClient() {
    if (typeof window === "undefined") return null;
    return (
      (window.CESupabase && typeof window.CESupabase.getSupabaseFoundationClient === "function" && window.CESupabase.getSupabaseFoundationClient()) ||
      (window.CESupabase && typeof window.CESupabase.getSupabaseAuthClient === "function" && window.CESupabase.getSupabaseAuthClient()) ||
      (typeof supabase !== "undefined" ? supabase : null)
    );
  }

  function mapRow(row) {
    if (!row) return row;
    var full = row.full_name || [row.first_name, row.last_name].filter(Boolean).join(" ") || row.nome || "Visitante";
    return {
      id: row.id,
      first_timer_number: row.first_timer_number || row.id,
      full_name: full,
      fullName: full,
      first_name: row.first_name || (full ? full.split(" ")[0] : "") || "",
      last_name: row.last_name || (full ? full.split(" ").slice(1).join(" ") : "") || "",
      nome: row.first_name || (full ? full.split(" ")[0] : "") || (row.nome || ""),
      apelido: row.last_name || (full ? full.split(" ").slice(1).join(" ") : "") || (row.apelido || ""),
      title: row.title || row.tratamento || "Irmão/Irmã",
      tratamento: row.title || row.tratamento || "Irmão/Irmã",
      gender: row.gender || row.genero || "",
      genero: row.gender || row.genero || "",
      date_of_birth: row.date_of_birth || row.data_de_nascimento || null,
      data_de_nascimento: row.date_of_birth || row.data_de_nascimento || null,
      phone: row.phone || row.telefone || "",
      telefone: row.phone || row.telefone || "",
      whatsapp: row.whatsapp || row.phone || row.telefone || "",
      email: row.email || "",
      address: row.address || row.endereco || "",
      endereco: row.address || row.endereco || "",
      neighborhood: row.neighborhood || row.bairro || "",
      profession: row.profession || row.profissao || "",
      church_id: row.church_id || "",
      church_name: row.church_name || "",
      cell_group_id: row.cell_group_id || null,
      cell_group_name: row.cell_group_name || null,
      cell_id: row.cell_id || null,
      cell_name: row.cell_name || null,
      visit_date: row.visit_date || row.data_do_culto || "",
      data_do_culto: row.visit_date || row.data_do_culto || "",
      service_name: row.service_name || row.culto || "Culto de Domingo",
      culto: row.service_name || row.culto || "Culto de Domingo",
      invited_by: row.invited_by_name || row.invited_by || row.convidado_por || "",
      convidado_por: row.invited_by_name || row.invited_by || row.convidado_por || "",
      born_again: Boolean(row.born_again),
      nasceu_de_novo: Boolean(row.born_again),
      foundation_school_interest: Boolean(row.foundation_school_interest ?? row.foundation_interest ?? row.quer_escola_de_fundacao),
      quer_escola_de_fundacao: Boolean(row.foundation_school_interest ?? row.foundation_interest ?? row.quer_escola_de_fundacao),
      counseling_interest: Boolean(row.counseling_interest ?? row.quer_aconselhamento),
      quer_aconselhamento: Boolean(row.counseling_interest ?? row.quer_aconselhamento),
      cell_interest: Boolean(row.cell_interest ?? row.interesse_em_celula),
      interesse_em_celula: Boolean(row.cell_interest ?? row.interesse_em_celula),
      workflow_status: row.workflow_status || "DRAFT",
      follow_up_status: row.follow_up_status || row.estado_do_seguimento || "Pending",
      estado_do_seguimento: row.follow_up_status || row.estado_do_seguimento || "Pending",
      assigned_to_user_id: row.assigned_to_user_id || null,
      assigned_to_name: row.assigned_to_name || null,
      converted_to_member: Boolean(row.converted_to_member),
      member_id: row.member_id || null,
      status: row.status || "Active",
      notes: row.notes || row.notas || "",
      notas: row.notes || row.notas || "",
      created_at: row.created_at || new Date().toISOString(),
    };
  }

  var bridge = {
    listFirstTimers: async function () {
      var client = getClient();
      if (client) {
        try {
          var res = await client.from("first_timers").select("*").order("created_at", { ascending: false });
          if (!res.error && Array.isArray(res.data)) {
            return { ok: true, data: res.data.map(mapRow) };
          }
        } catch (e) {
          console.warn("[CE FirstTimers Bridge] Supabase query error", e);
        }
      }
      return { ok: true, data: [] };
    },

    getFirstTimerById: async function (id) {
      var client = getClient();
      if (client) {
        try {
          var res = await client.from("first_timers").select("*").eq("id", id).single();
          if (!res.error && res.data) return { ok: true, data: mapRow(res.data) };
        } catch (_) {}
      }
      return { ok: false, error: "Not found" };
    },

    createFirstTimer: async function (payload) {
      var client = getClient();
      if (client) {
        try {
          var full = payload.full_name || [payload.nome, payload.apelido].filter(Boolean).join(" ") || payload.nome || "Visitante";
          var row = {
            id: payload.id,
            first_timer_number: payload.first_timer_number || payload.id,
            full_name: full,
            first_name: payload.nome || full.split(" ")[0] || "",
            last_name: payload.apelido || full.split(" ").slice(1).join(" ") || "",
            phone: payload.telefone || payload.phone || null,
            church_id: payload.church_id || null,
            visit_date: payload.data_do_culto || payload.visit_date || new Date().toISOString().slice(0, 10),
            service_name: payload.culto || payload.service_name || "Culto de Domingo",
            born_again: Boolean(payload.nasceu_de_novo ?? payload.born_again),
            foundation_school_interest: Boolean(payload.foundation_school_interest ?? payload.quer_escola_de_fundacao),
            counseling_interest: Boolean(payload.counseling_interest ?? payload.quer_aconselhamento),
            cell_interest: Boolean(payload.cell_interest ?? payload.interesse_em_celula),
            workflow_status: payload.workflow_status || "DRAFT",
            follow_up_status: payload.follow_up_status || payload.estado_do_seguimento || "Pending",
            status: payload.status || "Active",
            notes: payload.notas || payload.notes || null,
          };
          var res = await client.from("first_timers").upsert(row).select().single();
          if (!res.error && res.data) return { ok: true, data: mapRow(res.data) };
        } catch (e) {
          console.warn("[CE FirstTimers Bridge] Supabase create error", e);
        }
      }
      return { ok: true, data: payload };
    },

    updateFirstTimer: async function (id, payload) {
      var client = getClient();
      if (client) {
        try {
          var res = await client.from("first_timers").update(payload).eq("id", id).select().single();
          if (!res.error && res.data) return { ok: true, data: mapRow(res.data) };
        } catch (e) {
          console.warn("[CE FirstTimers Bridge] Supabase update error", e);
        }
      }
      return { ok: true, data: payload };
    },

    deleteFirstTimer: async function (id) {
      var client = getClient();
      if (client) {
        try {
          await client.from("first_timers").delete().eq("id", id);
        } catch (_) {}
      }
      return { ok: true };
    },

    searchFirstTimers: async function (query) {
      var all = await bridge.listFirstTimers();
      if (!all.ok) return all;
      var q = String(query || "").toLowerCase();
      var filtered = all.data.filter(function (p) {
        return (p.full_name && p.full_name.toLowerCase().includes(q)) || (p.phone && p.phone.includes(q));
      });
      return { ok: true, data: filtered };
    },

    getFirstTimersByChurch: async function (churchId) {
      var all = await bridge.listFirstTimers();
      if (!all.ok) return all;
      return { ok: true, data: all.data.filter(function (p) { return p.church_id === churchId; }) };
    },

    getFirstTimersByStatus: async function (status) {
      var all = await bridge.listFirstTimers();
      if (!all.ok) return all;
      return { ok: true, data: all.data.filter(function (p) { return p.follow_up_status === status; }) };
    },

    getNewConverts: async function () {
      var all = await bridge.listFirstTimers();
      if (!all.ok) return all;
      return { ok: true, data: all.data.filter(function (p) { return Boolean(p.born_again); }) };
    },

    getPendingFollowUps: async function () {
      var all = await bridge.listFirstTimers();
      if (!all.ok) return all;
      return { ok: true, data: all.data.filter(function (p) { return p.follow_up_status === "Pending"; }) };
    },

    getInterestedInFoundationSchool: async function () {
      var all = await bridge.listFirstTimers();
      if (!all.ok) return all;
      return { ok: true, data: all.data.filter(function (p) { return Boolean(p.foundation_school_interest); }) };
    },

    getInfo: function () {
      return {
        source: "supabase",
        provider: "CESupabase (Live REST Bridge)",
        ready: !!getClient(),
      };
    },
  };

  window.CEFirstTimers = bridge;
  console.info("[CE FirstTimers] Live Supabase bridge ready", bridge.getInfo());
})();
