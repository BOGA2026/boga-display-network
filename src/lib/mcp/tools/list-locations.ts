import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { notAuthenticated, supabaseForUser } from "../supabase";

/**
 * `locations` has no `city` column — only a free-text `address` plus optional
 * lat/lng. Selecting `city` was the source of the schema error.
 */
export default defineTool({
  name: "list_locations",
  title: "List locations",
  description: "List the signed-in user's business locations (branches).",
  inputSchema: {
    limit: z.number().int().min(1).max(200).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const { data, error } = await supabaseForUser(ctx)
      .from("locations")
      .select("id, name, address, latitude, longitude, created_at")
      .order("created_at", { ascending: false })
      .limit(limit ?? 100);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { locations: data ?? [], count: data?.length ?? 0 },
    };
  },
});
