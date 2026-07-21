import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listScreensTool from "./tools/list-screens";
import listLocationsTool from "./tools/list-locations";
import listContentTool from "./tools/list-content";
import getSubscriptionTool from "./tools/get-subscription";
import generateImageTool from "./tools/generate-image";
import generateVideoLoopTool from "./tools/generate-video-loop";
import suggestCopyTool from "./tools/suggest-copy";
import applyBrandKitTool from "./tools/apply-brand-kit";

// Build the Supabase OAuth issuer from the project ref (Vite inlines this
// literal at build time so the entry stays import-safe — no runtime env
// read). NEVER derive from SUPABASE_URL: on managed Cloud that's the proxy
// host, and mcp-js rejects tokens whose configured issuer doesn't match the
// direct supabase.co issuer the discovery document publishes.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "visualia-mcp",
  title: "Visualia",
  version: "0.2.0",
  instructions:
    "Herramientas para la plataforma Visualia de digital signage. Consultan el negocio del usuario (pantallas, sedes, biblioteca, suscripción) y generan contenido de IA (imágenes, loops, copy) con el brand kit del tenant. Todo el acceso respeta la membresía del usuario vía Supabase RLS.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listScreensTool,
    listLocationsTool,
    listContentTool,
    getSubscriptionTool,
    generateImageTool,
    generateVideoLoopTool,
    suggestCopyTool,
    applyBrandKitTool,
  ],
});
