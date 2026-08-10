import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { notAuthenticated, supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_screens",
  title: "List screens",
  description:
    "List digital-signage screens the signed-in Visualia user can see (respects business membership and RLS). Returns id, name, status, location and last_seen.",
  inputSchema: {
    status: z
      .enum(["online", "offline", "pending", "all"])
      .optional()
      .describe("Filter by screen status. Defaults to 'all'."),
    limit: z.number().int().min(1).max(200).optional().describe("Max rows to return (default 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const supabase = supabaseForUser(ctx);
    let q = supabase
      .from("screens")
      .select("id, name, status, last_seen_at, location_id, locations(name)")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(limit ?? 50);
    if (status && status !== "all") q = q.eq("status", status);
    const { data, error } = await q;
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    const rows = (data ?? []).map((r: any) => ({
      id: r.id,
      name: r.name,
      status: r.status,
      last_seen_at: r.last_seen_at,
      location: r.locations?.name ?? null,
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
      structuredContent: { screens: rows, count: rows.length },
    };
  },
});
