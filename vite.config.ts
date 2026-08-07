import { defineConfig, loadEnv } from "vite";
import { resolve } from "path";

/**
 * Dual-purpose Vite config:
 * - `vite` / `npm run dev`  → static file server for the dashboard (index.html, css/, js/)
 * - `vite build`            → existing Supabase IIFE bundle into js/supabase-bundle.js
 *
 * Existing `build:supabase` / `dev:supabase` scripts keep working unchanged.
 */
export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const embedPublicSupabaseConfig = /^(1|true|yes|on)$/i.test(
    env.VITE_EMBED_PUBLIC_SUPABASE_CONFIG || "false",
  );
  // The tracked IIFE bundle must remain secret-free. Development receives the
  // public URL/anon key at request time; an explicit opt-in is required to bake
  // public Supabase config into an untracked deployment artifact.
  const compiledEnv = command === "build" && !embedPublicSupabaseConfig
    ? {
        ...env,
        VITE_DATA_SOURCE: "mock",
        VITE_ENABLE_SUPABASE: "false",
        VITE_SUPABASE_URL: "",
        VITE_SUPABASE_ANON_KEY: "",
      }
    : env;
  const envDefines = {
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(compiledEnv.VITE_SUPABASE_URL || ""),
    "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(compiledEnv.VITE_SUPABASE_ANON_KEY || ""),
    "import.meta.env.VITE_DATA_SOURCE": JSON.stringify(compiledEnv.VITE_DATA_SOURCE || "mock"),
    "import.meta.env.VITE_API_BASE_URL": JSON.stringify(compiledEnv.VITE_API_BASE_URL || ""),
    "import.meta.env.VITE_APP_ENV": JSON.stringify(compiledEnv.VITE_APP_ENV || "development"),
    "import.meta.env.VITE_ENABLE_SUPABASE": JSON.stringify(compiledEnv.VITE_ENABLE_SUPABASE || "false"),
    "import.meta.env.VITE_ENABLE_REAL_AUTH": JSON.stringify(compiledEnv.VITE_ENABLE_REAL_AUTH || "false"),
    "import.meta.env.VITE_ENABLE_STORAGE": JSON.stringify(compiledEnv.VITE_ENABLE_STORAGE || "false"),
    "import.meta.env.VITE_ENABLE_RLS": JSON.stringify(compiledEnv.VITE_ENABLE_RLS || "false"),
    "import.meta.env.VITE_ENABLE_PUBLIC_CELL_REPORT": JSON.stringify(compiledEnv.VITE_ENABLE_PUBLIC_CELL_REPORT || "false"),
  };

  // Local / Docker development: serve the static dashboard.
  // Classic non-module scripts (dashboard.js IIFE stack) — disable HMR client injection
  // that can throw "Cannot use import statement outside a module" in this MPA setup.
  if (command === "serve") {
    const runtimeConfig = JSON.stringify({
      VITE_DATA_SOURCE: env.VITE_DATA_SOURCE || "mock",
      VITE_ENABLE_SUPABASE: env.VITE_ENABLE_SUPABASE || "false",
      VITE_SUPABASE_URL: env.VITE_SUPABASE_URL || "",
      VITE_SUPABASE_ANON_KEY: env.VITE_SUPABASE_ANON_KEY || "",
      VITE_API_BASE_URL: env.VITE_API_BASE_URL || "",
      VITE_APP_ENV: env.VITE_APP_ENV || "development",
      VITE_ENABLE_REAL_AUTH: env.VITE_ENABLE_REAL_AUTH || "false",
      VITE_ENABLE_STORAGE: env.VITE_ENABLE_STORAGE || "false",
      VITE_ENABLE_RLS: env.VITE_ENABLE_RLS || "false",
      VITE_ENABLE_PUBLIC_CELL_REPORT: env.VITE_ENABLE_PUBLIC_CELL_REPORT || "false",
    }).replace(/</g, "\\u003c");
    const runtimeScript = `window.__CE_ENV__=Object.assign(window.__CE_ENV__||{},${runtimeConfig});`;

    return {
      root: ".",
      appType: "mpa",
      server: {
        host: "0.0.0.0",
        port: 5173,
        strictPort: true,
        hmr: false,
      },
      preview: {
        host: "0.0.0.0",
        port: 5173,
        strictPort: true,
      },
      // Static classic-script dashboard: strip Vite client to avoid ESM noise in MPA.
      plugins: [
        {
          name: "ce-strip-vite-client",
          transformIndexHtml: {
            order: "post",
            enforce: "post",
            handler(html: string) {
              const cleaned = html.replace(/<script[^>]*@vite\/client[^>]*>\s*<\/script>\s*/gi, "");
              let withDevelopmentEntry = cleaned.replace(
                /<script\s+src=["']\/?js\/supabase-bundle\.js[^"']*["']><\/script>/i,
                '<script type="module" src="/src/index.ts"></script>',
              );
              // Keep the two pilot bridges behind the module entry so their
              // initial diagnostics cannot momentarily report a false fallback.
              withDevelopmentEntry = withDevelopmentEntry.replace(
                /<script\s+src=["'](\/?js\/(?:churches|members)-data-bridge\.js[^"']*)["']><\/script>/gi,
                '<script type="module" src="$1"></script>',
              );
              return withDevelopmentEntry.replace(
                "</head>",
                '<script src="/@ce-runtime-env.js"></script></head>',
              );
            },
          },
          configureServer(server) {
            server.middlewares.use((req, res, next) => {
              const url = req.url || "";
              if (url.split("?", 1)[0] === "/@ce-runtime-env.js") {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/javascript; charset=utf-8");
                res.setHeader("Cache-Control", "no-store");
                res.end(runtimeScript);
                return;
              }
              if (url === "/" || url.startsWith("/index.html") || url === "/index.html?") {
                const end = res.end.bind(res);
                res.end = function (chunk?: unknown, ...rest: unknown[]) {
                  if (typeof chunk === "string" && chunk.includes("@vite/client")) {
                    chunk = chunk.replace(/<script[^>]*@vite\/client[^>]*>\s*<\/script>\s*/gi, "");
                  } else if (Buffer.isBuffer(chunk)) {
                    let text = chunk.toString("utf8");
                    if (text.includes("@vite/client")) {
                      text = text.replace(/<script[^>]*@vite\/client[^>]*>\s*<\/script>\s*/gi, "");
                      chunk = Buffer.from(text, "utf8");
                    }
                  }
                  return end(chunk as never, ...(rest as never[]));
                } as typeof res.end;
              }
              next();
            });
          },
        },
      ],
      define: envDefines,
    };
  }

  // Library build used by npm run build / build:supabase
  return {
    build: {
      lib: {
        entry: resolve(__dirname, "src/index.ts"),
        name: "CESupabase",
        formats: ["iife"],
        fileName: () => "supabase-bundle.js",
      },
      outDir: "js",
      emptyOutDir: false,
      rollupOptions: {
        output: {
          extend: true,
          // Prefer globalThis so CESupabase is available even if `this` is undefined.
          intro: "var global = typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this);",
        },
      },
    },
    define: envDefines,
  };
});
