/**
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
