/**
 * Thin helper for the MCP tools: forwards the caller's OAuth token to the
 * ai-studio edge function so quota, logging and RLS all live in ONE place.
 * That way the WhatsApp bot, an external LLM connector, and the dashboard
 * hit the same code path — no duplication, no per-caller drift.
 */
export async function callAiStudio<T = unknown>(
  path: "generate_image" | "generate_video_loop" | "suggest_copy" | "apply_brand_kit",
  body: unknown,
  token: string,
): Promise<T> {
  const url = process.env.SUPABASE_URL!;
  const resp = await fetch(`${url}/functions/v1/ai-studio/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-Visualia-Source": "mcp",
    },
    body: JSON.stringify(body),
  });
  const text = await resp.text();
  const data = text ? (JSON.parse(text) as { error?: string } & Record<string, unknown>) : {};
  if (!resp.ok) {
    throw new Error(data.error ?? `ai-studio ${resp.status}`);
  }
  return data as T;
}
