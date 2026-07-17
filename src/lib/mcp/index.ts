import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listScreensTool from "./tools/list-screens";
import listLocationsTool from "./tools/list-locations";
import listContentTool from "./tools/list-content";
import getSubscriptionTool from "./tools/get-subscription";

// Build the Supabase OAuth issuer from the project ref (Vite inlines this
// literal at build time so the entry stays import-safe — no runtime env
// read). NEVER derive from SUPABASE_URL: on managed Cloud that's the proxy
// host, and mcp-js rejects tokens whose configured issuer doesn't match the
// direct supabase.co issuer the discovery document publishes.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "visualia-mcp",
  title: "Visualia",
  version: "0.1.0",
  instructions:
    "Tools for the Visualia digital-signage platform. Use these to inspect the signed-in user's screens, locations, content library, and subscription. All tools respect the user's business membership via Supabase RLS.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listScreensTool, listLocationsTool, listContentTool, getSubscriptionTool],
});
