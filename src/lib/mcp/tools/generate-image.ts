import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { callAiStudio } from "../ai-studio-bridge";

export default defineTool({
  name: "generate_image",
  title: "Generar imagen para pantalla",
  description:
    "Genera una imagen profesional para digital signage (menú, promoción, bienvenida). Aplica el brand kit del negocio del usuario a menos que se indique lo contrario.",
  inputSchema: {
    prompt: z.string().min(3).describe("Descripción en español de la imagen a generar."),
    formato: z
      .enum(["16:9", "9:16", "1:1", "4:5"])
      .default("16:9")
      .describe("Formato de pantalla objetivo."),
    marca_de_agua_off: z
      .boolean()
      .optional()
      .describe("Desactiva el watermark discreto de Visualia (solo planes premium)."),
    apply_brand_kit: z
      .boolean()
      .optional()
      .describe("Aplica automáticamente colores/logo del brand kit del negocio."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "No autenticado." }], isError: true };
    }
    const out = await callAiStudio<{ id: string; url: string }>(
      "generate_image",
      {
        prompt: input.prompt,
        formato: input.formato,
        watermark_off: input.marca_de_agua_off ?? false,
        apply_brand_kit: input.apply_brand_kit ?? true,
      },
      ctx.getToken(),
    );
    return {
      content: [{ type: "text", text: `Imagen generada: ${out.url}` }],
      structuredContent: out as unknown as Record<string, unknown>,
    };
  },
});
