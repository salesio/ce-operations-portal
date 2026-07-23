/**
 * Churches module bridge — progressive data layer pilot.
 *
 * Resolution order for the live repository API:
 * 1. window.CEDataLayer.churches
 * 2. window.CESupabase (IIFE bundle exports)
 * 3. Pure JS fallback (mock / ce-data-layer:churches) so Guardar never hard-blocks
 */
(function () {
  var STORAGE_KEY = "ce-data-layer:churches";
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
      console.warn("[CE Churches] resolveDataSource failed", error);
    }
    return "mock";
  }

  /** Prefer TS bundle / CEDataLayer; never throw. */
  function resolveRepoApi() {
    var layer = window.CEDataLayer && window.CEDataLayer.churches;
    if (layer && typeof layer.createChurch === "function") {
      return { api: layer, via: "CEDataLayer.churches" };
    }

    var supabase = window.CESupabase;
    if (supabase && typeof supabase.createChurch === "function") {
      return { api: supabase, via: "CESupabase" };
    }

    if (supabase && supabase.repositories && supabase.repositories.churches) {
      return { api: supabase.repositories.churches, via: "CESupabase.repositories.churches" };
    }

    var data = window.CEData && window.CEData.churches;
    if (data && typeof data.createChurch === "function") {
      return { api: data, via: "CEData.churches" };
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
      console.warn("[CE Churches] failed to read", STORAGE_KEY, error);
      return [];
    }
  }

  function saveLocalRows(rows) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    } catch (error) {
      console.warn("[CE Churches] failed to write", STORAGE_KEY, error);
    }
  }

  function defaultSeed() {
    // Minimal seed if bundle CHURCHES_SEED is unavailable (keeps UI usable).
    var seedFromBundle =
      window.CESupabase && Array.isArray(window.CESupabase.CHURCHES_SEED)
        ? window.CESupabase.CHURCHES_SEED
        : null;
    if (seedFromBundle && seedFromBundle.length) {
      return seedFromBundle.map(function (item) {
        return Object.assign({}, item);
      });
    }
    return [];
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
    // mock (and api/supabase when bundle missing): in-memory for this page session
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

  var pureFallback = {
    listChurches: async function () {
      var store = getFallbackStore();
      return ok(store.rows.slice());
    },
    getChurchById: async function (id) {
      var store = getFallbackStore();
      var found = store.rows.find(function (row) {
        return row.id === id || row.church_id === id;
      });
      return ok(found || null);
    },
    createChurch: async function (payload) {
      var store = getFallbackStore();
      if (store.source === "api" || store.source === "supabase") {
        return fail(
          "API/Supabase provider ainda não implementado. Use VITE_DATA_SOURCE=mock|local.",
          "NOT_IMPLEMENTED"
        );
      }
      var id =
        (payload && (payload.id || payload.church_id)) || "church-" + Date.now();
      var church = Object.assign({}, payload, {
        id: id,
        church_id: (payload && payload.church_id) || id,
        church_name: (payload && (payload.church_name || payload.name)) || "Igreja",
        updated_at: new Date().toISOString().slice(0, 10),
      });
      store.rows.push(church);
      if (store.persist) saveLocalRows(store.rows);
      console.info("[CE Churches] pure fallback createChurch", { id: church.id, source: store.source });
      return ok(church);
    },
    updateChurch: async function (id, payload) {
      var store = getFallbackStore();
      if (store.source === "api" || store.source === "supabase") {
        return fail(
          "API/Supabase provider ainda não implementado. Use VITE_DATA_SOURCE=mock|local.",
          "NOT_IMPLEMENTED"
        );
      }
      var index = store.rows.findIndex(function (row) {
        return row.id === id || row.church_id === id;
      });
      if (index < 0) return fail("Igreja não encontrada.", "NOT_FOUND");
      var next = Object.assign({}, store.rows[index], payload, {
        id: id,
        church_id: id,
        updated_at: new Date().toISOString().slice(0, 10),
      });
      store.rows[index] = next;
      if (store.persist) saveLocalRows(store.rows);
      console.info("[CE Churches] pure fallback updateChurch", { id: id, source: store.source });
      return ok(next);
    },
    deleteChurch: async function (id) {
      var store = getFallbackStore();
      var before = store.rows.length;
      store.rows = store.rows.filter(function (row) {
        return row.id !== id && row.church_id !== id;
      });
      if (store.rows.length === before) return fail("Igreja não encontrada.", "NOT_FOUND");
      if (store.persist) saveLocalRows(store.rows);
      return ok(true);
    },
    searchChurches: async function (query) {
      var listed = await pureFallback.listChurches();
      if (!listed.ok) return listed;
      var q = String(query || "")
        .trim()
        .toLowerCase();
      if (!q) return listed;
      return ok(
        listed.data.filter(function (church) {
          return [
            church.church_name,
            church.public_name,
            church.city,
            church.province,
            church.district_or_area,
            church.pastor_in_charge,
          ].some(function (value) {
            return String(value || "")
              .toLowerCase()
              .includes(q);
          });
        })
      );
    },
    getChurchServiceTimes: async function (churchId) {
      var result = await pureFallback.getChurchById(churchId);
      if (!result.ok) return result;
      if (!result.data) return fail("Igreja não encontrada.", "NOT_FOUND");
      return ok(result.data.service_times || []);
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
    console.warn("[CE Churches] repository API missing — using pure JS fallback", {
      CEDataLayer: !!window.CEDataLayer,
      CESupabase: !!window.CESupabase,
      CEData: !!window.CEData,
      CESupabaseKeys: window.CESupabase ? Object.keys(window.CESupabase).slice(0, 20) : [],
      dataSource: resolveDataSource(),
    });
    return { api: pureFallback, via: "pure-js-fallback", fallback: true };
  }

  async function call(method, args) {
    var resolved = getApi();
    var fn = resolved.api && resolved.api[method];
    if (typeof fn !== "function") {
      // Last resort: pure fallback method
      fn = pureFallback[method];
    }
    if (typeof fn !== "function") {
      console.error("[CE Churches] method missing", method, resolved);
      return fail("Repositório de igrejas indisponível.", "UNAVAILABLE");
    }
    try {
      var result = await fn.apply(resolved.api, args || []);
      if (result && result.ok === false && !resolved.fallback && pureFallback[method]) {
        // Bundle present but failed (e.g. api placeholder) → try pure fallback for mock/local only
        var source = resolveDataSource();
        if (source === "mock" || source === "local") {
          console.warn("[CE Churches] bundle " + method + " failed — retrying pure fallback", result);
          return await pureFallback[method].apply(pureFallback, args || []);
        }
      }
      return result;
    } catch (error) {
      console.warn("[CE Churches] " + method + " threw via " + resolved.via, error);
      if (!resolved.fallback && pureFallback[method]) {
        try {
          return await pureFallback[method].apply(pureFallback, args || []);
        } catch (fallbackError) {
          console.error("[CE Churches] pure fallback also failed", fallbackError);
          return fail(fallbackError && fallbackError.message, "FALLBACK_ERROR");
        }
      }
      return fail(error && error.message, "BRIDGE_ERROR");
    }
  }

  async function listChurches() {
    return call("listChurches", []);
  }

  async function getChurchById(id) {
    return call("getChurchById", [id]);
  }

  async function createChurch(payload) {
    console.info("[CE Churches] createChurch invoked", {
      name: payload && payload.church_name,
      via: getApi().via,
    });
    return call("createChurch", [payload]);
  }

  async function updateChurch(id, payload) {
    console.info("[CE Churches] updateChurch invoked", { id: id, via: getApi().via });
    return call("updateChurch", [id, payload]);
  }

  async function deleteChurch(id) {
    return call("deleteChurch", [id]);
  }

  async function searchChurches(query) {
    return call("searchChurches", [query]);
  }

  async function getChurchServiceTimes(churchId) {
    return call("getChurchServiceTimes", [churchId]);
  }

  function getInfo() {
    var resolved = getApi();
    try {
      if (resolved.api && typeof resolved.api.getChurchesDataSourceInfo === "function") {
        return Object.assign({ via: resolved.via }, resolved.api.getChurchesDataSourceInfo());
      }
      if (resolved.api && typeof resolved.api.getInfo === "function") {
        return Object.assign({ via: resolved.via }, resolved.api.getInfo());
      }
      if (window.CESupabase && typeof window.CESupabase.getChurchesDataSourceInfo === "function") {
        return Object.assign(
          { via: "CESupabase.getChurchesDataSourceInfo" },
          window.CESupabase.getChurchesDataSourceInfo()
        );
      }
    } catch (error) {
      console.warn("[CE Churches] getInfo failed", error);
    }
    return {
      source: resolveDataSource(),
      provider: resolved.via,
      ready: !!resolved.api,
      fallback: resolved.fallback,
    };
  }

  window.CEChurches = {
    listChurches: listChurches,
    getChurchById: getChurchById,
    createChurch: createChurch,
    updateChurch: updateChurch,
    deleteChurch: deleteChurch,
    searchChurches: searchChurches,
    getChurchServiceTimes: getChurchServiceTimes,
    getInfo: getInfo,
    friendlyError: friendlyError,
    /** diagnostic */
    _debugResolve: function () {
      return getApi();
    },
  };

  console.info("[CE Churches] bridge ready", window.CEChurches.getInfo());
})();
