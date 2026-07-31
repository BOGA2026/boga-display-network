import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { notAuthenticated, supabaseForUser } from "../supabase";

/**
 * Media assets live in `content` (type / file_url / thumbnail_url).
 * `content_items` is the menu-row table (name, price, currency) and has no
 * media columns — querying it here was the source of the "column
 * content_items.type does not exist" error.
 */
export default defineTool({
  name: "list_content",
  title: "List content items",
  description:
    "List content assets (images, videos, designs) available to the signed-in user's business.",
  inputSchema: {
    limit: z.number().int().min(1).max(200).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const { data, error } = await supabaseForUser(ctx)
      .from("content")
      .select("id, name, type, file_url, thumbnail_url, duration_seconds, created_at")
      .order("created_at", { ascending: false })
      .limit(limit ?? 50);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { items: data ?? [], count: data?.length ?? 0 },
    };
  },
});
