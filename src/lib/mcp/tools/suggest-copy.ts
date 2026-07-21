import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { callAiStudio } from "../ai-studio-bridge";

export default defineTool({
  name: "suggest_copy",
  title: "Sugerir copy de promoción",
  description:
    "Genera título, subtítulo y CTA para una promoción usando el contexto real del negocio del usuario (nombre, segmento).",
  inputSchema: {
    tipo_promocion: z.string().min(2).describe("Ej: 'happy hour cerveza', 'menú del día', 'apertura'."),
    contexto_negocio: z
      .string()
      .optional()
      .describe("Contexto adicional opcional; si no se envía se toma del perfil del negocio."),
  },
  annotations: { readOnlyHint: false, idempotentHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "No autenticado." }], isError: true };
    }
    const out = await callAiStudio<{ id: string; copy: { titulo?: string; subtitulo?: string; cta?: string } }>(
      "suggest_copy",
      input,
      ctx.getToken(),
    );
    const c = out.copy ?? {};
    return {
      content: [{ type: "text", text: `${c.titulo ?? ""}\n${c.subtitulo ?? ""}\n${c.cta ?? ""}`.trim() }],
      structuredContent: out as unknown as Record<string, unknown>,
    };
  },
});
