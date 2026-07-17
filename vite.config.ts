import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/supabase/vite";
import { imagetools } from "vite-imagetools";

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
        // Two responsive presets; use ?responsive-hero for above-the-fold
        // hero images and ?responsive for the rest.
        const buildSet = (widths: string) => {
          const params = new URLSearchParams();
          params.set("w", widths);
          params.set("format", "webp");
          params.set("as", "srcset");
          return params;
        };
        if (url.searchParams.has("responsive-hero")) {
          return buildSet("640;960;1280;1600;1920");
        }
        if (url.searchParams.has("responsive")) {
          return buildSet("480;768;1200;1600");
        }
        return new URLSearchParams();
      },
    }),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (!id.includes("node_modules")) return;
          if (id.includes("react-router")) return "router";
          if (id.includes("@supabase")) return "supabase";
          if (id.includes("@tanstack")) return "query";
          if (id.includes("fabric")) return "fabric";
          if (id.includes("leaflet")) return "leaflet";
          if (id.includes("recharts") || id.includes("d3-")) return "charts";
          if (id.includes("@radix-ui")) return "radix";
          if (id.includes("framer-motion")) return "motion";
          if (id.includes("react-dom") || id.includes("scheduler") || id.includes("/react/")) return "react";
        },
      },
    },
  },
}));

