import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { callAiStudio } from "../ai-studio-bridge";

export default defineTool({
  name: "generate_video_loop",
  title: "Generar loop corto para pantalla",
  description:
    "Genera una pieza en loop corta (3–15s) para digital signage. Devuelve la URL del asset y su duración. Aplica el brand kit del negocio.",
  inputSchema: {
    prompt: z.string().min(3).describe("Descripción de la escena en loop."),
    duracion_segundos: z.number().int().min(3).max(15).default(6),
    formato: z.enum(["16:9", "9:16", "1:1"]).default("16:9"),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "No autenticado." }], isError: true };
    }
    const out = await callAiStudio<{ id: string; url: string; duracion_segundos: number }>(
      "generate_video_loop",
      input,
      ctx.getToken(),
    );
    return {
      content: [{ type: "text", text: `Loop ${out.duracion_segundos}s listo: ${out.url}` }],
      structuredContent: out as unknown as Record<string, unknown>,
    };
  },
});
