import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/supabase/vite";
import { imagetools } from "vite-imagetools";
import { visualizer } from "rollup-plugin-visualizer";
import { sentryVitePlugin } from "@sentry/vite-plugin";



// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mcpPlugin(),
    imagetools({
      defaultDirectives: (url) => {
        // Presets responsive: ?responsive-hero (above the fold) y ?responsive.
        // Sufijo -avif para la fuente AVIF del <picture>; sin sufijo = WebP.
        const buildSet = (widths: string, format: "webp" | "avif") => {
          const params = new URLSearchParams();
          params.set("w", widths);
          params.set("format", format);
          params.set("as", "srcset");
          return params;
        };
        const HERO = "640;960;1280;1600;1920";
        const STD = "480;768;1200;1600";
        if (url.searchParams.has("responsive-hero-avif")) return buildSet(HERO, "avif");
        if (url.searchParams.has("responsive-avif")) return buildSet(STD, "avif");
        if (url.searchParams.has("responsive-hero")) return buildSet(HERO, "webp");
        if (url.searchParams.has("responsive")) return buildSet(STD, "webp");
        return new URLSearchParams();
      },
    }),

    mode === "development" && componentTagger(),
    mode !== "development" &&
      visualizer({
        filename: "dist/stats.html",
        gzipSize: true,
        brotliSize: true,
        template: "treemap",
      }),
    // Sube los sourcemaps ocultos a Sentry y los borra del dist, así los stack
    // traces quedan legibles sin publicar el código.
    mode !== "development" &&
      Boolean(
        process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_ORG && process.env.SENTRY_PROJECT,
      ) &&

      sentryVitePlugin({
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
        authToken: process.env.SENTRY_AUTH_TOKEN,
        telemetry: false,
        sourcemaps: {
          filesToDeleteAfterUpload: ["dist/**/*.map"],
        },
      }),
  ].filter(Boolean),

  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Código compartido entre edge functions (Deno) y el cliente web.
      "@shared": path.resolve(__dirname, "./supabase/functions/_shared"),
    },
  },
  build: {
    target: "es2020",
    minify: "terser",
    cssCodeSplit: true,
    sourcemap: "hidden",
    chunkSizeWarningLimit: 900,
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        passes: 2,
      },
      format: { comments: false },
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (!id.includes("node_modules")) return;
          // Only split heavy, self-contained libs to avoid cross-chunk TDZ cycles.
          if (id.includes("fabric")) return "fabric";
          if (id.includes("leaflet")) return "leaflet";
          if (id.includes("recharts") || id.includes("d3-")) return "charts";
          
          if (id.includes("@supabase")) return "supabase";
          if (id.includes("html2canvas")) return "html2canvas";
        },
      },
    },
  },
}));


