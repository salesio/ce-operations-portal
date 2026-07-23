/**
 * Follow-Up / Acompanhamento bridge — same pattern as Members / First Timers.
 *
 * Resolution order:
 * 1. window.CEDataLayer.followUps
 * 2. window.CESupabase (IIFE bundle exports)
 * 3. Pure JS fallback (mock / ce-data-layer:follow-ups)
 */
(function () {
  var STORAGE_KEY = "ce-data-layer:follow-ups";
  var fallbackMemory = null;

  function friendlyError(result, fallback) {
    if (result && result.ok === false) return result.error || fallback;
    return fallback;
  }

  function resolveDataSource() {
    try {
      var runtime =
        typeof window !== "undefined" && window.__CE_ENV__
          ? window.__CE_ENV__.VITE_DATA_SOURCE
          : "";
      var fromBundle =
        window.CESupabase && typeof window.CESupabase.getDataSource === "function"
          ? window.CESupabase.getDataSource()
          : window.CEDataLayer && typeof window.CEDataLayer.getDataSource === "function"
            ? window.CEDataLayer.getDataSource()
            : "";
      var value = String(runtime || fromBundle || "mock")
        .trim()
        .toLowerCase();
      if (value === "local" || value === "api" || value === "supabase" || value === "mock") {
        return value;
      }
    } catch (error) {
      console.warn("[CE FollowUps] resolveDataSource failed", error);
    }
    return "mock";
  }

  function resolveRepoApi() {
    var layer = window.CEDataLayer && window.CEDataLayer.followUps;
    if (layer && typeof layer.createFollowUp === "function") {
      return { api: layer, via: "CEDataLayer.followUps" };
    }
    var supabase = window.CESupabase;
    if (supabase && typeof supabase.createFollowUp === "function") {
      return { api: supabase, via: "CESupabase" };
    }
    if (supabase && supabase.repositories && supabase.repositories.followUps) {
      return { api: supabase.repositories.followUps, via: "CESupabase.repositories.followUps" };
    }
    return { api: null, via: "none" };
  }

  function loadLocalRows() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn("[CE FollowUps] failed to read", STORAGE_KEY, error);
      return [];
    }
  }

  function saveLocalRows(rows) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    } catch (error) {
      console.warn("[CE FollowUps] failed to write", STORAGE_KEY, error);
    }
  }

  function defaultSeed() {
    var seedFromBundle =
      window.CESupabase && Array.isArray(window.CESupabase.FOLLOW_UPS_SEED)
        ? window.CESupabase.FOLLOW_UPS_SEED
        : null;
    if (seedFromBundle && seedFromBundle.length) {
      return seedFromBundle.map(function (item) {
        return Object.assign({}, item);
      });
    }
    return [
      {
        id: "fu-1",
        first_timer_id: "ft-1",
        church_id: "church-hq",
        data_do_contacto: "2026-07-06",
        metodo: "WhatsApp",
        resultado: "Mensagem enviada",
        proximo_passo: "Confirmar presença no próximo culto",
        proxima_data_de_contacto: "2026-07-09",
        status: "Pending",
        notas: "Aguardando resposta.",
        actualizado_por: "Líder de Aconselhamento",
      },
    ];
  }

  function getFallbackStore() {
    var source = resolveDataSource();
    if (source === "local") {
      var rows = loadLocalRows();
      if (!rows.length) {
        rows = defaultSeed();
        if (rows.length) saveLocalRows(rows);
      }
      return { source: "local", rows: rows, persist: true };
    }
    if (!fallbackMemory) fallbackMemory = defaultSeed();
    return { source: source === "mock" ? "mock" : source, rows: fallbackMemory, persist: false };
  }

  function ok(data) {
    return { ok: true, data: data };
  }

  function fail(error, code) {
    return { ok: false, error: error || "Erro desconhecido.", code: code || "FALLBACK_ERROR" };
  }

  function statusKey(status) {
    return String(status || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "");
  }

  function todayIso() {
    return new Date().toISOString().slice(0, 10);
  }

  var pureFallback = {
    listFollowUps: async function () {
      return ok(getFallbackStore().rows.slice());
    },
    getFollowUpById: async function (id) {
      var found = getFallbackStore().rows.find(function (row) {
        return row.id === id;
      });
      return ok(found || null);
    },
    createFollowUp: async function (payload) {
      var store = getFallbackStore();
      if (store.source === "api" || store.source === "supabase") {
        return fail(
          "API/Supabase provider ainda não implementado. Use VITE_DATA_SOURCE=mock|local.",
          "NOT_IMPLEMENTED"
        );
      }
      var id = (payload && payload.id) || "fu-" + Date.now();
      var row = Object.assign({}, payload, {
        id: id,
        updated_at: todayIso(),
        created_at: (payload && payload.created_at) || todayIso(),
      });
      store.rows.push(row);
      if (store.persist) saveLocalRows(store.rows);
      console.info("[CE FollowUps] pure fallback createFollowUp", { id: row.id, source: store.source });
      return ok(row);
    },
    updateFollowUp: async function (id, payload) {
      var store = getFallbackStore();
      if (store.source === "api" || store.source === "supabase") {
        return fail(
          "API/Supabase provider ainda não implementado. Use VITE_DATA_SOURCE=mock|local.",
          "NOT_IMPLEMENTED"
        );
      }
      var index = store.rows.findIndex(function (row) {
        return row.id === id;
      });
      if (index < 0) return fail("Acompanhamento não encontrado.", "NOT_FOUND");
      var next = Object.assign({}, store.rows[index], payload, {
        id: id,
        updated_at: todayIso(),
      });
      store.rows[index] = next;
      if (store.persist) saveLocalRows(store.rows);
      return ok(next);
    },
    deleteFollowUp: async function (id) {
      var store = getFallbackStore();
      var before = store.rows.length;
      store.rows = store.rows.filter(function (row) {
        return row.id !== id;
      });
      if (store.rows.length === before) return fail("Acompanhamento não encontrado.", "NOT_FOUND");
      if (store.persist) saveLocalRows(store.rows);
      return ok(true);
    },
    searchFollowUps: async function (query) {
      var listed = await pureFallback.listFollowUps();
      if (!listed.ok) return listed;
      var q = String(query || "")
        .trim()
        .toLowerCase();
      if (!q) return listed;
      return ok(
        listed.data.filter(function (row) {
          return [row.full_name, row.phone, row.resultado, row.metodo, row.status, row.notas]
            .some(function (value) {
              return String(value || "")
                .toLowerCase()
                .includes(q);
            });
        })
      );
    },
    getFollowUpsByChurch: async function (churchId) {
      var listed = await pureFallback.listFollowUps();
      if (!listed.ok) return listed;
      return ok(listed.data.filter(function (r) { return r.church_id === churchId; }));
    },
    getFollowUpsByCell: async function (cellId) {
      var listed = await pureFallback.listFollowUps();
      if (!listed.ok) return listed;
      return ok(listed.data.filter(function (r) { return r.cell_id === cellId; }));
    },
    getFollowUpsByCellGroup: async function (cellGroupId) {
      var listed = await pureFallback.listFollowUps();
      if (!listed.ok) return listed;
      return ok(listed.data.filter(function (r) { return r.cell_group_id === cellGroupId; }));
    },
    getFollowUpsByStatus: async function (status) {
      var listed = await pureFallback.listFollowUps();
      if (!listed.ok) return listed;
      var key = statusKey(status);
      return ok(listed.data.filter(function (r) { return statusKey(r.status || r.estado) === key; }));
    },
    getFollowUpsByResponsibleUser: async function (userId) {
      var listed = await pureFallback.listFollowUps();
      if (!listed.ok) return listed;
      return ok(
        listed.data.filter(function (r) {
          return r.responsible_user_id === userId || r.actualizado_por === userId;
        })
      );
    },
    getFollowUpsByDateRange: async function (startDate, endDate) {
      var listed = await pureFallback.listFollowUps();
      if (!listed.ok) return listed;
      var start = String(startDate || "").slice(0, 10);
      var end = String(endDate || "").slice(0, 10);
      return ok(
        listed.data.filter(function (r) {
          var d = String(r.data_do_contacto || r.created_at || "").slice(0, 10);
          if (!d) return false;
          if (start && d < start) return false;
          if (end && d > end) return false;
          return true;
        })
      );
    },
    getPendingFollowUps: async function () {
      var listed = await pureFallback.listFollowUps();
      if (!listed.ok) return listed;
      return ok(
        listed.data.filter(function (r) {
          var key = statusKey(r.status || r.estado);
          return key === "pending" || key === "noanswer" || key === "noresponse";
        })
      );
    },
    getOverdueFollowUps: async function () {
      var listed = await pureFallback.listFollowUps();
      if (!listed.ok) return listed;
      var today = todayIso();
      return ok(
        listed.data.filter(function (r) {
          var key = statusKey(r.status || r.estado);
          if (key === "closed" || key === "becamemember") return false;
          var next = String(r.proxima_data_de_contacto || r.next_follow_up_date || "").slice(0, 10);
          return !!next && next < today;
        })
      );
    },
    getTodayFollowUps: async function () {
      var listed = await pureFallback.listFollowUps();
      if (!listed.ok) return listed;
      var today = todayIso();
      return ok(
        listed.data.filter(function (r) {
          var contact = String(r.data_do_contacto || "").slice(0, 10);
          var next = String(r.proxima_data_de_contacto || "").slice(0, 10);
          return contact === today || next === today;
        })
      );
    },
    getFollowUpsByFirstTimer: async function (firstTimerId) {
      var listed = await pureFallback.listFollowUps();
      if (!listed.ok) return listed;
      return ok(listed.data.filter(function (r) { return r.first_timer_id === firstTimerId; }));
    },
    createFollowUpFromFirstTimer: async function (firstTimerId, payload) {
      return pureFallback.createFollowUp(
        Object.assign({}, payload || {}, { first_timer_id: firstTimerId, person_type: "First Timer" })
      );
    },
    markFollowUpBecameMember: async function (id) {
      return pureFallback.updateFollowUp(id, {
        status: "Became Member",
        estado: "Became Member",
        became_member: true,
      });
    },
    getInfo: function () {
      return {
        source: resolveDataSource(),
        provider: "pure-js-fallback",
        ready: true,
        description: "Bridge fallback (bundle API missing)",
      };
    },
  };

  function getApi() {
    var resolved = resolveRepoApi();
    if (resolved.api) return { api: resolved.api, via: resolved.via, fallback: false };
    console.warn("[CE FollowUps] repository API missing — using pure JS fallback", {
      CEDataLayer: !!window.CEDataLayer,
      CESupabase: !!window.CESupabase,
      dataSource: resolveDataSource(),
    });
    return { api: pureFallback, via: "pure-js-fallback", fallback: true };
  }

  async function call(method, args) {
    var resolved = getApi();
    var fn = resolved.api && resolved.api[method];
    if (typeof fn !== "function") fn = pureFallback[method];
    if (typeof fn !== "function") {
      console.error("[CE FollowUps] method missing", method, resolved);
      return fail("Repositório de acompanhamento indisponível.", "UNAVAILABLE");
    }
    try {
      var result = await fn.apply(resolved.api, args || []);
      if (result && result.ok === false && !resolved.fallback && pureFallback[method]) {
        var source = resolveDataSource();
        if (source === "mock" || source === "local") {
          console.warn("[CE FollowUps] bundle " + method + " failed — retrying pure fallback", result);
          return await pureFallback[method].apply(pureFallback, args || []);
        }
      }
      return result;
    } catch (error) {
      console.warn("[CE FollowUps] " + method + " threw via " + resolved.via, error);
      if (!resolved.fallback && pureFallback[method]) {
        try {
          return await pureFallback[method].apply(pureFallback, args || []);
        } catch (fallbackError) {
          console.error("[CE FollowUps] pure fallback also failed", fallbackError);
          return fail(fallbackError && fallbackError.message, "FALLBACK_ERROR");
        }
      }
      return fail(error && error.message, "BRIDGE_ERROR");
    }
  }

  window.CEFollowUps = {
    listFollowUps: function () { return call("listFollowUps", []); },
    getFollowUpById: function (id) { return call("getFollowUpById", [id]); },
    createFollowUp: function (payload) {
      console.info("[CE FollowUps] createFollowUp invoked", { via: getApi().via });
      return call("createFollowUp", [payload]);
    },
    updateFollowUp: function (id, payload) { return call("updateFollowUp", [id, payload]); },
    deleteFollowUp: function (id) { return call("deleteFollowUp", [id]); },
    searchFollowUps: function (query) { return call("searchFollowUps", [query]); },
    getFollowUpsByChurch: function (churchId) { return call("getFollowUpsByChurch", [churchId]); },
    getFollowUpsByCell: function (cellId) { return call("getFollowUpsByCell", [cellId]); },
    getFollowUpsByCellGroup: function (cellGroupId) { return call("getFollowUpsByCellGroup", [cellGroupId]); },
    getFollowUpsByStatus: function (status) { return call("getFollowUpsByStatus", [status]); },
    getFollowUpsByResponsibleUser: function (userId) { return call("getFollowUpsByResponsibleUser", [userId]); },
    getFollowUpsByDateRange: function (startDate, endDate) {
      return call("getFollowUpsByDateRange", [startDate, endDate]);
    },
    getPendingFollowUps: function () { return call("getPendingFollowUps", []); },
    getOverdueFollowUps: function () { return call("getOverdueFollowUps", []); },
    getTodayFollowUps: function () { return call("getTodayFollowUps", []); },
    getFollowUpsByFirstTimer: function (firstTimerId) {
      return call("getFollowUpsByFirstTimer", [firstTimerId]);
    },
    createFollowUpFromFirstTimer: function (firstTimerId, payload) {
      return call("createFollowUpFromFirstTimer", [firstTimerId, payload || {}]);
    },
    markFollowUpBecameMember: function (id, overrides) {
      return call("markFollowUpBecameMember", [id, overrides || {}]);
    },
    getInfo: function () {
      var resolved = getApi();
      try {
        if (resolved.api && typeof resolved.api.getFollowUpsDataSourceInfo === "function") {
          return Object.assign({ via: resolved.via }, resolved.api.getFollowUpsDataSourceInfo());
        }
        if (resolved.api && typeof resolved.api.getInfo === "function") {
          return Object.assign({ via: resolved.via }, resolved.api.getInfo());
        }
      } catch (error) {
        console.warn("[CE FollowUps] getInfo failed", error);
      }
      return {
        source: resolveDataSource(),
        provider: resolved.via,
        ready: !!resolved.api,
        fallback: resolved.fallback,
      };
    },
    friendlyError: friendlyError,
    _debugResolve: function () {
      return getApi();
    },
  };

  console.info("[CE FollowUps] bridge ready", window.CEFollowUps.getInfo());
})();
