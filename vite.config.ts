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
  const envDefines = {
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(env.VITE_SUPABASE_URL || ""),
    "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(env.VITE_SUPABASE_ANON_KEY || ""),
    "import.meta.env.VITE_DATA_SOURCE": JSON.stringify(env.VITE_DATA_SOURCE || "mock"),
    "import.meta.env.VITE_API_BASE_URL": JSON.stringify(env.VITE_API_BASE_URL || ""),
  };

  // Local / Docker development: serve the static dashboard.
  // Classic non-module scripts (dashboard.js IIFE stack) — disable HMR client injection
  // that can throw "Cannot use import statement outside a module" in this MPA setup.
  if (command === "serve") {
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
              return html.replace(/<script[^>]*@vite\/client[^>]*>\s*<\/script>\s*/gi, "");
            },
          },
          configureServer(server) {
            server.middlewares.use((req, res, next) => {
              const url = req.url || "";
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
