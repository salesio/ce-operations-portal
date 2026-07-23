/**
 * First Timers / Primeira Vez bridge — same pattern as Members / Churches.
 *
 * Resolution order:
 * 1. window.CEDataLayer.firstTimers
 * 2. window.CESupabase (IIFE bundle exports)
 * 3. Pure JS fallback (mock / ce-data-layer:first-timers)
 */
(function () {
  var STORAGE_KEY = "ce-data-layer:first-timers";
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
      console.warn("[CE FirstTimers] resolveDataSource failed", error);
    }
    return "mock";
  }

  function resolveRepoApi() {
    var layer = window.CEDataLayer && window.CEDataLayer.firstTimers;
    if (layer && typeof layer.createFirstTimer === "function") {
      return { api: layer, via: "CEDataLayer.firstTimers" };
    }

    var supabase = window.CESupabase;
    if (supabase && typeof supabase.createFirstTimer === "function") {
      return { api: supabase, via: "CESupabase" };
    }

    if (supabase && supabase.repositories && supabase.repositories.firstTimers) {
      return { api: supabase.repositories.firstTimers, via: "CESupabase.repositories.firstTimers" };
    }

    var data = window.CEData && window.CEData.firstTimers;
    if (data && typeof data.createFirstTimer === "function") {
      return { api: data, via: "CEData.firstTimers" };
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
      console.warn("[CE FirstTimers] failed to read", STORAGE_KEY, error);
      return [];
    }
  }

  function saveLocalRows(rows) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    } catch (error) {
      console.warn("[CE FirstTimers] failed to write", STORAGE_KEY, error);
    }
  }

  function defaultSeed() {
    var seedFromBundle =
      window.CESupabase && Array.isArray(window.CESupabase.FIRST_TIMERS_SEED)
        ? window.CESupabase.FIRST_TIMERS_SEED
        : null;
    if (seedFromBundle && seedFromBundle.length) {
      return seedFromBundle.map(function (item) {
        return Object.assign({}, item);
      });
    }
    return [
      {
        id: "ft-1",
        tratamento: "Irmã",
        nome: "Aminata",
        apelido: "Chivinda",
        genero: "Feminino",
        telefone: "848287179",
        church_id: "church-hq",
        data_do_culto: "2026-07-05",
        culto: "Domingo 1º Culto",
        nasceu_de_novo: false,
        quer_escola_de_fundacao: true,
        estado_do_seguimento: "Pending",
        notas: "",
      },
      {
        id: "ft-2",
        tratamento: "Sr.",
        nome: "Mateus",
        apelido: "Nhantumbo",
        genero: "Masculino",
        telefone: "862720011",
        church_id: "church-hq",
        data_do_culto: "2026-06-28",
        culto: "Domingo 1º Culto",
        nasceu_de_novo: true,
        quer_escola_de_fundacao: true,
        estado_do_seguimento: "Contacted",
        notas: "",
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
    if (!fallbackMemory) {
      fallbackMemory = defaultSeed();
    }
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

  var pureFallback = {
    listFirstTimers: async function () {
      return ok(getFallbackStore().rows.slice());
    },
    getFirstTimerById: async function (id) {
      var found = getFallbackStore().rows.find(function (row) {
        return row.id === id;
      });
      return ok(found || null);
    },
    createFirstTimer: async function (payload) {
      var store = getFallbackStore();
      if (store.source === "api" || store.source === "supabase") {
        return fail(
          "API/Supabase provider ainda não implementado. Use VITE_DATA_SOURCE=mock|local.",
          "NOT_IMPLEMENTED"
        );
      }
      var id = (payload && payload.id) || "ft-" + Date.now();
      var person = Object.assign({}, payload, {
        id: id,
        updated_at: new Date().toISOString().slice(0, 10),
      });
      store.rows.push(person);
      if (store.persist) saveLocalRows(store.rows);
      console.info("[CE FirstTimers] pure fallback createFirstTimer", { id: person.id, source: store.source });
      return ok(person);
    },
    updateFirstTimer: async function (id, payload) {
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
      if (index < 0) return fail("Registo de primeira vez não encontrado.", "NOT_FOUND");
      var next = Object.assign({}, store.rows[index], payload, {
        id: id,
        updated_at: new Date().toISOString().slice(0, 10),
      });
      store.rows[index] = next;
      if (store.persist) saveLocalRows(store.rows);
      console.info("[CE FirstTimers] pure fallback updateFirstTimer", { id: id, source: store.source });
      return ok(next);
    },
    deleteFirstTimer: async function (id) {
      var store = getFallbackStore();
      var before = store.rows.length;
      store.rows = store.rows.filter(function (row) {
        return row.id !== id;
      });
      if (store.rows.length === before) return fail("Registo de primeira vez não encontrado.", "NOT_FOUND");
      if (store.persist) saveLocalRows(store.rows);
      return ok(true);
    },
    searchFirstTimers: async function (query) {
      var listed = await pureFallback.listFirstTimers();
      if (!listed.ok) return listed;
      var q = String(query || "")
        .trim()
        .toLowerCase();
      if (!q) return listed;
      return ok(
        listed.data.filter(function (person) {
          return [person.nome, person.apelido, person.telefone, person.email, person.culto, person.estado_do_seguimento]
            .some(function (value) {
              return String(value || "")
                .toLowerCase()
                .includes(q);
            });
        })
      );
    },
    getFirstTimersByChurch: async function (churchId) {
      var listed = await pureFallback.listFirstTimers();
      if (!listed.ok) return listed;
      return ok(listed.data.filter(function (p) { return p.church_id === churchId; }));
    },
    getFirstTimersByCell: async function (cellId) {
      var listed = await pureFallback.listFirstTimers();
      if (!listed.ok) return listed;
      return ok(listed.data.filter(function (p) { return p.cell_id === cellId; }));
    },
    getFirstTimersByCellGroup: async function (cellGroupId) {
      var listed = await pureFallback.listFirstTimers();
      if (!listed.ok) return listed;
      return ok(listed.data.filter(function (p) { return p.cell_group_id === cellGroupId; }));
    },
    getFirstTimersByStatus: async function (status) {
      var listed = await pureFallback.listFirstTimers();
      if (!listed.ok) return listed;
      var key = statusKey(status);
      return ok(listed.data.filter(function (p) { return statusKey(p.estado_do_seguimento) === key; }));
    },
    getFirstTimersByDateRange: async function (startDate, endDate) {
      var listed = await pureFallback.listFirstTimers();
      if (!listed.ok) return listed;
      var start = String(startDate || "").slice(0, 10);
      var end = String(endDate || "").slice(0, 10);
      return ok(
        listed.data.filter(function (p) {
          var d = String(p.data_do_culto || p.created_at || "").slice(0, 10);
          if (!d) return false;
          if (start && d < start) return false;
          if (end && d > end) return false;
          return true;
        })
      );
    },
    getNewConverts: async function () {
      var listed = await pureFallback.listFirstTimers();
      if (!listed.ok) return listed;
      return ok(listed.data.filter(function (p) { return !!p.nasceu_de_novo; }));
    },
    getPendingFollowUps: async function () {
      var listed = await pureFallback.listFirstTimers();
      if (!listed.ok) return listed;
      return ok(
        listed.data.filter(function (p) {
          var key = statusKey(p.estado_do_seguimento);
          return key === "pending" || key === "noanswer" || key === "interested";
        })
      );
    },
    getInterestedInFoundationSchool: async function () {
      var listed = await pureFallback.listFirstTimers();
      if (!listed.ok) return listed;
      return ok(listed.data.filter(function (p) { return !!p.quer_escola_de_fundacao; }));
    },
    convertFirstTimerToMember: async function () {
      return fail(
        "Conversão para membro requer o repositório TypeScript (npm run build).",
        "NOT_IMPLEMENTED"
      );
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
    if (resolved.api) {
      return { api: resolved.api, via: resolved.via, fallback: false };
    }
    console.warn("[CE FirstTimers] repository API missing — using pure JS fallback", {
      CEDataLayer: !!window.CEDataLayer,
      CESupabase: !!window.CESupabase,
      dataSource: resolveDataSource(),
    });
    return { api: pureFallback, via: "pure-js-fallback", fallback: true };
  }

  async function call(method, args) {
    var resolved = getApi();
    var fn = resolved.api && resolved.api[method];
    if (typeof fn !== "function") {
      fn = pureFallback[method];
    }
    if (typeof fn !== "function") {
      console.error("[CE FirstTimers] method missing", method, resolved);
      return fail("Repositório de primeira vez indisponível.", "UNAVAILABLE");
    }
    try {
      var result = await fn.apply(resolved.api, args || []);
      if (result && result.ok === false && !resolved.fallback && pureFallback[method]) {
        var source = resolveDataSource();
        if (source === "mock" || source === "local") {
          console.warn("[CE FirstTimers] bundle " + method + " failed — retrying pure fallback", result);
          return await pureFallback[method].apply(pureFallback, args || []);
        }
      }
      return result;
    } catch (error) {
      console.warn("[CE FirstTimers] " + method + " threw via " + resolved.via, error);
      if (!resolved.fallback && pureFallback[method]) {
        try {
          return await pureFallback[method].apply(pureFallback, args || []);
        } catch (fallbackError) {
          console.error("[CE FirstTimers] pure fallback also failed", fallbackError);
          return fail(fallbackError && fallbackError.message, "FALLBACK_ERROR");
        }
      }
      return fail(error && error.message, "BRIDGE_ERROR");
    }
  }

  window.CEFirstTimers = {
    listFirstTimers: function () { return call("listFirstTimers", []); },
    getFirstTimerById: function (id) { return call("getFirstTimerById", [id]); },
    createFirstTimer: function (payload) {
      console.info("[CE FirstTimers] createFirstTimer invoked", {
        name: payload && (payload.nome || payload.full_name),
        via: getApi().via,
      });
      return call("createFirstTimer", [payload]);
    },
    updateFirstTimer: function (id, payload) {
      console.info("[CE FirstTimers] updateFirstTimer invoked", { id: id, via: getApi().via });
      return call("updateFirstTimer", [id, payload]);
    },
    deleteFirstTimer: function (id) { return call("deleteFirstTimer", [id]); },
    searchFirstTimers: function (query) { return call("searchFirstTimers", [query]); },
    getFirstTimersByChurch: function (churchId) { return call("getFirstTimersByChurch", [churchId]); },
    getFirstTimersByCell: function (cellId) { return call("getFirstTimersByCell", [cellId]); },
    getFirstTimersByCellGroup: function (cellGroupId) { return call("getFirstTimersByCellGroup", [cellGroupId]); },
    getFirstTimersByStatus: function (status) { return call("getFirstTimersByStatus", [status]); },
    getFirstTimersByDateRange: function (startDate, endDate) {
      return call("getFirstTimersByDateRange", [startDate, endDate]);
    },
    getNewConverts: function () { return call("getNewConverts", []); },
    getPendingFollowUps: function () { return call("getPendingFollowUps", []); },
    getInterestedInFoundationSchool: function () { return call("getInterestedInFoundationSchool", []); },
    convertFirstTimerToMember: function (id, overrides) {
      return call("convertFirstTimerToMember", [id, overrides || {}]);
    },
    getInfo: function () {
      var resolved = getApi();
      try {
        if (resolved.api && typeof resolved.api.getFirstTimersDataSourceInfo === "function") {
          return Object.assign({ via: resolved.via }, resolved.api.getFirstTimersDataSourceInfo());
        }
        if (resolved.api && typeof resolved.api.getInfo === "function") {
          return Object.assign({ via: resolved.via }, resolved.api.getInfo());
        }
        if (window.CESupabase && typeof window.CESupabase.getFirstTimersDataSourceInfo === "function") {
          return Object.assign(
            { via: "CESupabase.getFirstTimersDataSourceInfo" },
            window.CESupabase.getFirstTimersDataSourceInfo()
          );
        }
      } catch (error) {
        console.warn("[CE FirstTimers] getInfo failed", error);
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

  console.info("[CE FirstTimers] bridge ready", window.CEFirstTimers.getInfo());
})();
