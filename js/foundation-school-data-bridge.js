/**
 * Foundation School / Escola de Fundação bridge — same pattern as prior pilots.
 */
(function () {
  var KEYS = {
    students: "ce-data-layer:foundation-students",
    teachers: "ce-data-layer:foundation-teachers",
    classes: "ce-data-layer:foundation-classes",
  };
  var memory = { students: null, teachers: null, classes: null };

  function resolveDataSource() {
    try {
      var runtime = window.__CE_ENV__ && window.__CE_ENV__.VITE_DATA_SOURCE;
      var fromBundle =
        window.CESupabase && typeof window.CESupabase.getDataSource === "function"
          ? window.CESupabase.getDataSource()
          : window.CEDataLayer && typeof window.CEDataLayer.getDataSource === "function"
            ? window.CEDataLayer.getDataSource()
            : "";
      var value = String(runtime || fromBundle || "mock")
        .trim()
        .toLowerCase();
      if (value === "local" || value === "api" || value === "supabase" || value === "mock") return value;
    } catch (_) {}
    return "mock";
  }

  function resolveApi() {
    var layer = window.CEDataLayer && window.CEDataLayer.foundationSchool;
    if (layer && typeof layer.createStudent === "function") {
      return { api: layer, via: "CEDataLayer.foundationSchool" };
    }
    if (window.CESupabase && typeof window.CESupabase.createFoundationStudent === "function") {
      return { api: window.CESupabase, via: "CESupabase" };
    }
    return { api: null, via: "none" };
  }

    function isDemoRecord(item) {
    if (!item) return false;
    var id = String(item.id || "");
    var name = String(item.name || item.full_name || item.student_name || item.nome || "");
    var str = id + " " + name + " " + String(item.student_number || "") + " " + String(item.class_code || "") + " " + String(item.teacher_number || "") + " " + String(item.enrollment_number || "") + " " + String(item.email || "");
    if (/demo|^8[1-5]000000-/i.test(str)) return true;
    if (/^ftch-|^fcg-|^fsloc-demo|^flts-demo|^fls-demo|^fs-[0-9]+$/i.test(id)) return true;
    if (/foundation.(teacher[0-9]*|rector|coord|matola|beira|prison)@ce-mozambique.org/i.test(String(item.email || ""))) return true;
    if (/^Professor(a)?\s+(Jo[aã]o|Carlos|Edson|Samuel|David|Mateus|Miguel|Nelson|Tito|Pedro|Daniel|Rui|Ana|Beatriz|Marta|Helena|Rosa|Celina|Sofia|Alda|Paula|Elisa|L[uú]cia|F[aá]tima|Janet Marquele)/i.test(name)) return true;
    if (/^Pastor Coordenador|^Irm[aã] Coordenadora/i.test(name)) return true;
    if (/Turma Sede — Presencial|Turma Online —|Turma Domic[ií]lio|Turma Minist[ée]rio Prisional — Centro X|Turma Matola —|Turma Domingo 1º Culto/i.test(name)) return true;
    if (/Aluno Demo|Professor Demo|Turma.*Demo|FSC-DEMO|FST-DEMO|FSS-DEMO|FSE-DEMO/i.test(str)) return true;
    if (item.metadata && typeof item.metadata === "object" && item.metadata.demo === true) return true;
    return false;
  }

  function load(key) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      var list = Array.isArray(parsed) ? parsed : [];
      return list.filter(function (r) { return !isDemoRecord(r); });
    } catch (_) {
      return [];
    }
  }

  function save(key, rows) {
    try {
      localStorage.setItem(key, JSON.stringify(rows));
    } catch (e) {
      console.warn("[CE Foundation] persist failed", key, e);
    }
  }

  function seedStudents() {
    return ((window.CESupabase && window.CESupabase.FOUNDATION_STUDENTS_SEED) || []).filter(function (r) { return !isDemoRecord(r); });
  }
  function seedTeachers() {
    return [];
  }
  function seedClasses() {
    return ((window.CESupabase && window.CESupabase.FOUNDATION_CLASSES_SEED) || []).filter(function (r) { return !isDemoRecord(r); });
  }

  function store(kind) {
    var source = resolveDataSource();
    var key = KEYS[kind];
    if (source === "local") {
      var rows = load(key);
      if (!rows.length && kind !== "teachers") {
        var seeds =
          kind === "students" ? seedStudents() : seedClasses();
        rows = seeds.map(function (s) {
          return Object.assign({}, s);
        });
        if (rows.length) save(key, rows);
      }
      return { rows: rows, persist: true, source: "local" };
    }
    if (!memory[kind]) {
      var seeds2 =
        kind === "students" ? seedStudents() : kind === "teachers" ? seedTeachers() : seedClasses();
      memory[kind] = seeds2.map(function (s) {
        return Object.assign({}, s);
      });
    }
    return { rows: memory[kind], persist: false, source: source };
  }

  function ok(data) {
    return { ok: true, data: data };
  }
  function fail(error, code) {
    return { ok: false, error: error || "Erro", code: code || "FALLBACK_ERROR" };
  }

  function pure() {
    return {
      listStudents: async function () {
        return ok(store("students").rows.slice());
      },
      createStudent: async function (payload) {
        var s = store("students");
        var row = Object.assign({}, payload, {
          id: (payload && payload.id) || "fs-" + Date.now(),
          updated_at: new Date().toISOString().slice(0, 10),
        });
        s.rows.push(row);
        if (s.persist) save(KEYS.students, s.rows);
        return ok(row);
      },
      updateStudent: async function (id, payload) {
        var s = store("students");
        var i = s.rows.findIndex(function (r) {
          return (
            r.id === id ||
            (id && String(r.id) === String(id)) ||
            (payload && payload.student_number && r.student_number === payload.student_number) ||
            (payload && payload.full_name && r.full_name === payload.full_name) ||
            (payload && payload.nome && r.nome === payload.nome)
          );
        });
        if (i < 0) {
          var newRow = Object.assign({}, payload, { id: id || (payload && payload.id) || "fs-" + Date.now() });
          s.rows.push(newRow);
          if (s.persist) save(KEYS.students, s.rows);
          return ok(newRow);
        }
        s.rows[i] = Object.assign({}, s.rows[i], payload, { id: s.rows[i].id || id });
        if (s.persist) save(KEYS.students, s.rows);
        return ok(s.rows[i]);
      },
      deleteStudent: async function (id) {
        var s = store("students");
        s.rows = s.rows.filter(function (r) {
          return r.id !== id && String(r.id) !== String(id);
        });
        if (s.persist) save(KEYS.students, s.rows);
        return ok(true);
      },
      listTeachers: async function () {
        return ok(store("teachers").rows.slice());
      },
      createTeacher: async function (payload) {
        var s = store("teachers");
        var row = Object.assign({}, payload, { id: (payload && payload.id) || "ftch-" + Date.now() });
        s.rows.push(row);
        if (s.persist) save(KEYS.teachers, s.rows);
        return ok(row);
      },
      updateTeacher: async function (id, payload) {
        var s = store("teachers");
        var i = s.rows.findIndex(function (r) {
          return (
            r.id === id ||
            (id && String(r.id) === String(id)) ||
            (payload && payload.teacher_number && r.teacher_number === payload.teacher_number) ||
            (payload && payload.full_name && r.full_name === payload.full_name) ||
            (payload && payload.nome && r.nome === payload.nome)
          );
        });
        if (i < 0) {
          var newRow = Object.assign({}, payload, { id: id || (payload && payload.id) || "ftch-" + Date.now() });
          s.rows.push(newRow);
          if (s.persist) save(KEYS.teachers, s.rows);
          return ok(newRow);
        }
        s.rows[i] = Object.assign({}, s.rows[i], payload, { id: s.rows[i].id || id });
        if (s.persist) save(KEYS.teachers, s.rows);
        return ok(s.rows[i]);
      },
      listClasses: async function () {
        return ok(store("classes").rows.slice());
      },
      createClass: async function (payload) {
        var s = store("classes");
        var row = Object.assign({}, payload, { id: (payload && payload.id) || "fcg-" + Date.now() });
        s.rows.push(row);
        if (s.persist) save(KEYS.classes, s.rows);
        return ok(row);
      },
      updateClass: async function (id, payload) {
        var s = store("classes");
        var i = s.rows.findIndex(function (r) {
          return (
            r.id === id ||
            (id && String(r.id) === String(id)) ||
            (payload && payload.class_code && r.class_code === payload.class_code) ||
            (payload && payload.name && r.name === payload.name) ||
            (payload && payload.nome && r.nome === payload.nome)
          );
        });
        if (i < 0) {
          var newRow = Object.assign({}, payload, { id: id || (payload && payload.id) || "fcg-" + Date.now() });
          s.rows.push(newRow);
          if (s.persist) save(KEYS.classes, s.rows);
          return ok(newRow);
        }
        s.rows[i] = Object.assign({}, s.rows[i], payload, { id: s.rows[i].id || id });
        if (s.persist) save(KEYS.classes, s.rows);
        return ok(s.rows[i]);
      },
      getInfo: function () {
        return {
          source: resolveDataSource(),
          provider: "pure-js-fallback",
          ready: true,
        };
      },
    };
  }

  function getApi() {
    var resolved = resolveApi();
    if (resolved.api) return { api: resolved.api, via: resolved.via, fallback: false };
    console.warn("[CE Foundation] API missing — pure JS fallback", {
      CEDataLayer: !!window.CEDataLayer,
      dataSource: resolveDataSource(),
    });
    return { api: pure(), via: "pure-js-fallback", fallback: true };
  }

  async function call(method, args, aliases) {
    var resolved = getApi();
    var fn = resolved.api[method];
    if (typeof fn !== "function" && aliases) {
      for (var a = 0; a < aliases.length; a += 1) {
        if (typeof resolved.api[aliases[a]] === "function") {
          fn = resolved.api[aliases[a]];
          break;
        }
      }
    }
    var fallback = pure();
    if (typeof fn !== "function") fn = fallback[method];
    if (typeof fn !== "function") {
      console.error("[CE Foundation] method missing", method);
      return fail("Repositório da Escola de Fundação indisponível.", "UNAVAILABLE");
    }
    try {
      return await fn.apply(resolved.api, args || []);
    } catch (error) {
      console.warn("[CE Foundation] " + method + " threw", error);
      if (!resolved.fallback && fallback[method]) {
        try {
          return await fallback[method].apply(fallback, args || []);
        } catch (e2) {
          return fail(e2 && e2.message, "FALLBACK_ERROR");
        }
      }
      return fail(error && error.message, "BRIDGE_ERROR");
    }
  }

  window.CEFoundationSchool = {
    listStudents: function () {
      return call("listStudents", [], ["listFoundationStudents"]);
    },
    createStudent: function (payload) {
      console.info("[CE Foundation] createStudent", { via: getApi().via });
      return call("createStudent", [payload], ["createFoundationStudent"]);
    },
    updateStudent: function (id, payload) {
      return call("updateStudent", [id, payload], ["updateFoundationStudent"]);
    },
    deleteStudent: function (id) {
      return call("deleteStudent", [id], ["deleteFoundationStudent"]);
    },
    listClasses: function () {
      return call("listClasses", [], ["listFoundationClasses"]);
    },
    createClass: function (payload) {
      return call("createClass", [payload], ["createFoundationClass"]);
    },
    updateClass: function (id, payload) {
      return call("updateClass", [id, payload], ["updateFoundationClass"]);
    },
    listTeachers: function () {
      return call("listTeachers", [], ["listFoundationTeachers"]);
    },
    createTeacher: function (payload) {
      return call("createTeacher", [payload], ["createFoundationTeacher"]);
    },
    updateTeacher: function (id, payload) {
      return call("updateTeacher", [id, payload], ["updateFoundationTeacher"]);
    },
    getInfo: function () {
      var resolved = getApi();
      try {
        if (resolved.api.getFoundationSchoolDataSourceInfo) {
          return Object.assign({ via: resolved.via }, resolved.api.getFoundationSchoolDataSourceInfo());
        }
        if (resolved.api.getInfo) return Object.assign({ via: resolved.via }, resolved.api.getInfo());
      } catch (_) {}
      return { source: resolveDataSource(), provider: resolved.via, ready: !!resolved.api };
    },
    _debugResolve: function () {
      return getApi();
    },
  };

  console.info("[CE Foundation] bridge ready", window.CEFoundationSchool.getInfo());
})();
