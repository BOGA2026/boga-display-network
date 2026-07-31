/**
 * Design archetypes for AI-generated signage pieces.
 *
 * The three proposals must be STRUCTURALLY different, not the same layout in
 * three colors. Each archetype has its own composition, its own dish budget and
 * its own type family so the difference reads at a glance.
 */

export type ArchetypeId = "foto_protagonista" | "lista_limpia" | "dividido";

export interface Archetype {
  id: ArchetypeId;
  label: string;
  /** One line the user reads under the preview. */
  resumen: string;
  /** Hard cap of dishes for this composition. */
  maxItems: number;
  /** true = the piece is built around a photo, false = no photography at all. */
  usaFoto: boolean;
  /** Where the dish block sits. */
  bloque: "banda_inferior" | "columna_completa" | "mitad_derecha";
  fuenteTitulo: string;
  fuenteCuerpo: string;
  /** Type family character, used in the prompt and in the UI label. */
  familia: string;
  promptBlock: string;
}

export const ARCHETYPES: Record<ArchetypeId, Archetype> = {
  foto_protagonista: {
    id: "foto_protagonista",
    label: "Foto protagonista",
    resumen: "Imagen a sangre completa con los platos sobre una banda sólida",
    maxItems: 4,
    usaFoto: true,
    bloque: "banda_inferior",
    fuenteTitulo: "Playfair Display",
    fuenteCuerpo: "Cormorant",
    familia: "serif con carácter",
    promptBlock: `ARQUETIPO 1 — FOTO PROTAGONISTA
- Una sola imagen a sangre ocupa el 100% del lienzo (background_image_query obligatorio y muy específico).
- Los platos van SIEMPRE sobre una banda sólida (inferior o lateral), nunca sueltos sobre la foto.
- Máximo 4 platos en total. Sirve para promocionar un producto estrella, no para el menú completo.
- Tipografía serif con carácter: fuente_titulo "Playfair Display", fuente_cuerpo "Cormorant".
- overlay_opacity mínimo 0.6 y elementos_decorativos debe incluir "banda_inferior".`,
  },
  lista_limpia: {
    id: "lista_limpia",
    label: "Lista limpia",
    resumen: "Sin foto, fondo de marca y tipografía grande: lo más legible a distancia",
    maxItems: 7,
    usaFoto: false,
    bloque: "columna_completa",
    fuenteTitulo: "Space Grotesk",
    fuenteCuerpo: "DM Sans",
    familia: "sans geométrica",
    promptBlock: `ARQUETIPO 2 — LISTA LIMPIA
- SIN fotografía. background_image_query debe ir vacío ("").
- Fondo sólido o degradado sutil con los colores de la marca.
- Tipografía grande, hasta 7 platos en una o dos columnas. Es el formato más legible a distancia y el mejor para menús completos.
- Tipografía sans geométrica: fuente_titulo "Space Grotesk", fuente_cuerpo "DM Sans".
- Sin overlay de foto: overlay_opacity 0.`,
  },
  dividido: {
    id: "dividido",
    label: "Dividido",
    resumen: "Mitad imagen, mitad menú, con separación neta",
    maxItems: 5,
    usaFoto: true,
    bloque: "mitad_derecha",
    fuenteTitulo: "Oswald",
    fuenteCuerpo: "Inter",
    familia: "sans condensada",
    promptBlock: `ARQUETIPO 3 — DIVIDIDO
- El lienzo se parte en dos mitades con separación neta: una mitad es la imagen, la otra mitad es el menú sobre color sólido.
- Máximo 5 platos.
- La imagen nunca lleva texto encima; el texto vive en la mitad sólida.
- Tipografía sans condensada: fuente_titulo "Oswald", fuente_cuerpo "Inter".`,
  },
};

/** Default presentation order when the user has no history yet. */
export const DEFAULT_ARCHETYPE_ORDER: ArchetypeId[] = [
  "lista_limpia",
  "foto_protagonista",
  "dividido",
];

export const ARCHETYPE_IDS = Object.keys(ARCHETYPES) as ArchetypeId[];

export const isArchetypeId = (value: unknown): value is ArchetypeId =>
  typeof value === "string" && (ARCHETYPE_IDS as string[]).includes(value);

/**
 * Sorts archetypes by how often the user picked each one (most picked first),
 * keeping the default order as the tie-breaker.
 */
export function orderArchetypes(picks: Partial<Record<ArchetypeId, number>> = {}): ArchetypeId[] {
  return [...DEFAULT_ARCHETYPE_ORDER].sort((a, b) => {
    const diff = (picks[b] ?? 0) - (picks[a] ?? 0);
    if (diff !== 0) return diff;
    return DEFAULT_ARCHETYPE_ORDER.indexOf(a) - DEFAULT_ARCHETYPE_ORDER.indexOf(b);
  });
}

/** Normalizes an incoming order, filling in any missing archetype. */
export function normalizeArchetypeOrder(value: unknown): ArchetypeId[] {
  const incoming = Array.isArray(value) ? value.filter(isArchetypeId) : [];
  const unique = [...new Set(incoming)] as ArchetypeId[];
  for (const id of DEFAULT_ARCHETYPE_ORDER) {
    if (!unique.includes(id)) unique.push(id);
  }
  return unique.slice(0, 3);
}

type LooseSection = { nombre?: string; items?: unknown[] };

/** Caps a menu to the dish budget of an archetype. Fewer dishes, never smaller type. */
export function capSections<T extends LooseSection>(sections: T[], maxItems: number): T[] {
  let budget = Math.max(0, maxItems);
  return sections
    .map((s) => {
      const items = (s.items || []).slice(0, budget);
      budget -= items.length;
      return { ...s, items } as T;
    })
    .filter((s) => (s.items?.length ?? 0) > 0);
}

/**
 * Forces a proposal to actually belong to its archetype: fonts, dish budget,
 * photo presence and the structural layout tag.
 */
export function enforceArchetype<T extends Record<string, any>>(proposal: T, id: ArchetypeId): T {
  const a = ARCHETYPES[id];
  const out: Record<string, any> = { ...proposal };

  out.arquetipo = id;
  out.tipo_layout = id;
  out.fuente_titulo = a.fuenteTitulo;
  out.fuente_cuerpo = a.fuenteCuerpo;

  if (Array.isArray(out.secciones)) {
    out.secciones = capSections(out.secciones, a.maxItems);
  }

  if (!a.usaFoto) {
    out.background_image_query = "";
    out.image_url = null;
    out.overlay_opacity = 0;
  } else {
    out.overlay_opacity = Math.max(typeof out.overlay_opacity === "number" ? out.overlay_opacity : 0, 0.6);
  }

  return out as T;
}

/** Prompt block listing the three archetypes in the requested order. */
export function buildArchetypePrompt(order: ArchetypeId[]): string {
  return `ARQUETIPOS OBLIGATORIOS — LAS 3 PROPUESTAS DEBEN SER ESTRUCTURALMENTE DISTINTAS:
No basta con cambiar el color: cada propuesta usa una composición y una familia tipográfica diferente.

${order.map((id, i) => `PROPUESTA ${i + 1} → "${id}"\n${ARCHETYPES[id].promptBlock}`).join("\n\n")}

Cada propuesta debe incluir el campo "arquetipo" con exactamente ese valor y respetar su límite de platos.
PROHIBIDO entregar tres variaciones del mismo layout.`;
}
