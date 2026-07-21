import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { callAiStudio } from "../ai-studio-bridge";

export default defineTool({
  name: "apply_brand_kit",
  title: "Reaplicar brand kit al asset",
  description:
    "Toma un asset generado previamente y lo re-genera aplicando los colores, logo y watermark del brand kit del negocio. Útil cuando la primera generación no respetó la marca.",
  inputSchema: {
    asset_id: z.string().uuid().describe("ID de una generación previa del propio negocio."),
    tenant_id: z
      .string()
      .uuid()
      .optional()
      .describe("Legacy; ignorado. El tenant siempre se deriva del token del usuario."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "No autenticado." }], isError: true };
    }
    const out = await callAiStudio<{ id: string; url: string }>(
      "apply_brand_kit",
      { generation_id: input.asset_id },
      ctx.getToken(),
    );
    return {
      content: [{ type: "text", text: `Asset con brand kit aplicado: ${out.url}` }],
      structuredContent: out as unknown as Record<string, unknown>,
    };
  },
});
