import { defineTool } from "@lovable.dev/mcp-js";
import { notAuthenticated, supabaseForUser } from "../supabase";

/**
 * Real columns: screens_count (not screen_count). There are no
 * current_period_start / current_period_end columns — the billing window is
 * expressed as billing_anchor + next_billing_date (+ expires_at and
 * grace_period_ends_at for lapsed subscriptions).
 */
export default defineTool({
  name: "get_subscription",
  title: "Get subscription status",
  description:
    "Return the current subscription plan, screen count, pricing and billing dates for the signed-in user's business.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("subscriptions")
      .select(
        "id, plan, status, screens_count, billing_cycle, price_per_screen, total_amount, billing_anchor, next_billing_date, expires_at, grace_period_ends_at, updated_at",
      )
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { subscription: data ?? null },
    };
  },
});
