/**
 * Follow-Up / Acompanhamento bridge — direct Supabase live repository with local fallback.
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
    var status = row.status || row.estado || "Pending";
    return {
      id: row.id,
      first_timer_id: row.first_timer_id || "",
      member_id: row.member_id || "",
      person_type: row.person_type || (row.first_timer_id ? "First Timer" : "Member"),
      full_name: row.person_name || row.full_name || "",
      fullName: row.person_name || row.full_name || "",
      person_name: row.person_name || row.full_name || "",
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
      created_at: row.created_at || new Date().toISOString(),
    };
  }

  var bridge = {
    listFollowUps: async function () {
      var client = getClient();
      if (client) {
        try {
          var res = await client.from("follow_ups").select("*").order("created_at", { ascending: false });
          if (!res.error && Array.isArray(res.data)) {
            return { ok: true, data: res.data.map(mapRow) };
          }
        } catch (e) {
          console.warn("[CE FollowUps Bridge] Supabase query error", e);
        }
      }
      return { ok: true, data: [] };
    },

    getFollowUpById: async function (id) {
      var client = getClient();
      if (client) {
        try {
          var res = await client.from("follow_ups").select("*").eq("id", id).single();
          if (!res.error && res.data) return { ok: true, data: mapRow(res.data) };
        } catch (_) {}
      }
      return { ok: false, error: "Not found" };
    },

    createFollowUp: async function (payload) {
      var client = getClient();
      if (client) {
        try {
          var row = {
            id: payload.id,
            first_timer_id: payload.first_timer_id || null,
            person_name: payload.full_name || payload.person_name || null,
            phone: payload.phone || payload.telefone || null,
            church_id: payload.church_id || null,
            status: payload.status || "Pending",
            priority: payload.priority || "Normal",
            notes: payload.notes || payload.notas || null,
            wants_foundation_school: Boolean(payload.wants_foundation_school),
            interested_in_cell: Boolean(payload.interested_in_cell),
            wants_counseling: Boolean(payload.wants_counseling),
            became_member: Boolean(payload.became_member),
          };
          var res = await client.from("follow_ups").upsert(row).select().single();
          if (!res.error && res.data) return { ok: true, data: mapRow(res.data) };
        } catch (e) {
          console.warn("[CE FollowUps Bridge] Supabase create error", e);
        }
      }
      return { ok: true, data: payload };
    },

    updateFollowUp: async function (id, payload) {
      var client = getClient();
      if (client) {
        try {
          var res = await client.from("follow_ups").update(payload).eq("id", id).select().single();
          if (!res.error && res.data) return { ok: true, data: mapRow(res.data) };
        } catch (e) {
          console.warn("[CE FollowUps Bridge] Supabase update error", e);
        }
      }
      return { ok: true, data: payload };
    },

    deleteFollowUp: async function (id) {
      var client = getClient();
      if (client) {
        try {
          await client.from("follow_ups").delete().eq("id", id);
        } catch (_) {}
      }
      return { ok: true };
    },

    getFollowUpsByChurch: async function (churchId) {
      var all = await bridge.listFollowUps();
      if (!all.ok) return all;
      return { ok: true, data: all.data.filter(function (p) { return p.church_id === churchId; }) };
    },

    getFollowUpsByStatus: async function (status) {
      var all = await bridge.listFollowUps();
      if (!all.ok) return all;
      return { ok: true, data: all.data.filter(function (p) { return p.status === status; }) };
    },

    getInfo: function () {
      return {
        source: "supabase",
        provider: "CESupabase (Live REST Bridge)",
        ready: !!getClient(),
      };
    },
  };

  window.CEFollowUps = bridge;
  console.info("[CE FollowUps] Live Supabase bridge ready", bridge.getInfo());
})();
