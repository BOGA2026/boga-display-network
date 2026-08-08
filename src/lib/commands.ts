/**
 * commands.ts — construcción y ranking de los comandos del ⌘K.
 *
 * Reglas:
 * - La navegación se genera SOLO desde `NAV` / `NAV_GROUPS`: nada de listas
 *   paralelas (eso producía duplicados tipo "Ir a Pantallas" + "Pantallas").
 * - El orden lo decide `getCommandScore()`, no el orden de registro.
 * - `recordUsage(id)` alimenta el score para que el ranking aprenda del uso real.
 */
import { NAV, NAV_GROUPS, COPY, type NavEntry, type NavKey } from "@/config/lexicon";

export type CommandGroup = "Navegación" | "Acciones" | "Ayuda" | "Sedes";

/** Orden fijo de los grupos en la paleta. */
export const GROUP_ORDER: CommandGroup[] = ["Navegación", "Acciones", "Ayuda", "Sedes"];

export interface CommandDef {
  id: string;
  label: string;
  group: CommandGroup;
  /** Términos alternativos (incluye el vocabulario viejo). */
  keywords?: string[];
  /** Peso base: define el orden cuando nadie ha usado nada todavía. */
  priority?: number;
  /** Entrada de NAV asociada (para el ícono). */
  nav?: NavEntry;
  iconKey?: string;
  run: () => void;
}

/* ─────────────────────────  Uso persistido  ───────────────────────── */

const USAGE_KEY = "cmdk.usage";
const HALF_LIFE_MS = 14 * 24 * 60 * 60 * 1000; // 14 días

interface UsageEntry {
  count: number;
  last: number;
}
type UsageMap = Record<string, UsageEntry>;

let usageCache: UsageMap | null = null;

function readUsage(): UsageMap {
  if (usageCache) return usageCache;
  if (typeof window === "undefined") return (usageCache = {});
  try {
    usageCache = JSON.parse(window.localStorage.getItem(USAGE_KEY) ?? "{}") as UsageMap;
  } catch {
    usageCache = {};
  }
  return usageCache;
}

/** Registra la ejecución de un comando para que suba en el ranking. */
export function recordUsage(id: string) {
  const usage = readUsage();
  const prev = usage[id];
  usage[id] = { count: (prev?.count ?? 0) + 1, last: Date.now() };
  usageCache = usage;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(USAGE_KEY, JSON.stringify(usage));
    } catch {
      /* cuota llena: el ranking simplemente no persiste */
    }
  }
}

/** Solo para tests / "restablecer orden". */
export function resetUsage() {
  usageCache = {};
  if (typeof window !== "undefined") window.localStorage.removeItem(USAGE_KEY);
}

/**
 * Score de un comando: prioridad base + frecuencia de uso con decaimiento
 * temporal. Mayor score = más arriba.
 */
export function getCommandScore(command: Pick<CommandDef, "id" | "priority">): number {
  const base = command.priority ?? 0;
  const entry = readUsage()[command.id];
  if (!entry) return base;
  const age = Date.now() - entry.last;
  const decay = Math.pow(0.5, age / HALF_LIFE_MS); // 1 → recién usado, ~0 → viejo
  return base + entry.count * 12 * decay + decay * 6;
}

/** Ordena de mayor a menor score (desempate estable por etiqueta). */
export function sortByScore<T extends Pick<CommandDef, "id" | "priority" | "label">>(
  commands: T[],
): T[] {
  return [...commands].sort((a, b) => {
    const diff = getCommandScore(b) - getCommandScore(a);
    return diff !== 0 ? diff : a.label.localeCompare(b.label, "es");
  });
}

/* ─────────────────────────  Construcción  ───────────────────────── */

/** Claves de navegación en el orden canónico del menú lateral. */
const NAV_ORDER: NavKey[] = NAV_GROUPS.flatMap((g) => g.items);

export interface BuildCommandsOptions {
  navigate: (path: string) => void;
  locations?: { id: string; name: string }[];
  setActiveLocationId?: (id: string | null) => void;
  supportUrl?: string;
}

/**
 * Única fuente de comandos. La navegación sale de NAV, así que renombrar una
 * sección en el lexicon renombra el comando automáticamente.
 */
export function buildCommands({
  navigate,
  locations = [],
  setActiveLocationId,
  supportUrl,
}: BuildCommandsOptions): CommandDef[] {
  const nav: CommandDef[] = NAV_ORDER.map((key, index) => {
    const entry = NAV[key];
    return {
      id: `nav:${key}`,
      label: entry.label,
      group: "Navegación" as const,
      // Alias: quien busca el vocabulario viejo igual encuentra la sección.
      keywords: [entry.breadcrumb, entry.pageTitle, ...(entry.aliases ?? [])],
      // El orden del menú manda: Inicio primero, Mapa/QR después.
      priority: 100 - index,
      nav: entry,
      run: () => navigate(entry.path),
    };
  });

  const actions: CommandDef[] = [
    {
      id: "action:connect-screen",
      label: COPY.actions.connectScreen,
      group: "Acciones",
      keywords: ["emparejar", "pair", "nueva pantalla", "tv"],
      priority: 60,
      iconKey: "plus",
      run: () => navigate(`${NAV.pantallas.path}?pair=1`),
    },
    {
      id: "action:upload-content",
      label: COPY.actions.upload,
      group: "Acciones",
      keywords: ["subir", "contenido", "media", "archivo"],
      priority: 58,
      iconKey: "upload",
      run: () => navigate(NAV.contenido.path),
    },
    {
      id: "action:create-ai",
      label: COPY.actions.createWithAi,
      group: "Acciones",
      keywords: ["ia", "ai", "generar", "diseño"],
      priority: 56,
      iconKey: "sparkles",
      run: () => navigate(NAV.generarIa.path),
    },
    {
      id: "action:design-editor",
      label: COPY.actions.designInEditor,
      group: "Acciones",
      keywords: ["editor", "diseñar", "canvas"],
      priority: 54,
      iconKey: "pen",
      run: () => navigate(NAV.editor.path),
    },
    {
      id: "action:new-playlist",
      label: COPY.actions.newPlaylist,
      group: "Acciones",
      keywords: ["lista", "playlist", "nueva"],
      priority: 52,
      iconKey: "list",
      run: () => navigate(NAV.listas.path),
    },
    {
      id: "action:new-qr",
      label: COPY.actions.newQr,
      group: "Acciones",
      keywords: ["qr", "codigo", "código"],
      priority: 50,
      iconKey: "qr",
      run: () => navigate(NAV.qr.path),
    },
  ];

  const help: CommandDef[] = [
    {
      id: "help:soporte",
      label: NAV.soporte.pageTitle,
      group: "Ayuda",
      keywords: ["soporte", "pqrs", "contacto", "ayuda"],
      priority: 40,
      nav: NAV.soporte,
      run: () => navigate(NAV.soporte.path),
    },
  ];

  if (supportUrl) {
    help.push({
      id: "help:whatsapp",
      label: `${COPY.actions.help} por WhatsApp`,
      group: "Ayuda",
      keywords: ["whatsapp", "chat", "humano", "soporte"],
      priority: 38,
      iconKey: "help",
      run: () => window.open(supportUrl, "_blank", "noopener,noreferrer"),
    });
  }

  const sedes: CommandDef[] = setActiveLocationId
    ? [
        {
          id: "sede:all",
          label: "Ver todas las sedes",
          group: "Sedes",
          keywords: ["sede", "location", "todas"],
          priority: 20,
          run: () => setActiveLocationId(null),
        },
        ...locations.map<CommandDef>((loc, i) => ({
          id: `sede:${loc.id}`,
          label: `Cambiar a sede: ${loc.name}`,
          group: "Sedes",
          keywords: ["sede", "location", loc.name],
          priority: 19 - i * 0.01,
          run: () => setActiveLocationId(loc.id),
        })),
      ]
    : [];

  // De-dup defensivo por id (por si una página registra algo ya existente).
  const all = [...nav, ...actions, ...help, ...sedes];
  const seen = new Set<string>();
  return all.filter((c) => (seen.has(c.id) ? false : (seen.add(c.id), true)));
}

/* ─────────────────────────  Relevancia de búsqueda  ─────────────────────────
 * cmdk filtra con coincidencia difusa por subsecuencia: escribir "menu" hacía
 * match con "MonitorEo" (m-o-n… las letras aparecen en orden). Por eso la
 * paleta corre con `shouldFilter={false}` y usa esto: coincidencia REAL de
 * prefijo o de subcadena sobre etiqueta y alias, sin acentos.
 */
export function normalizeTerm(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** > 0 si el comando coincide de verdad con la consulta; 0 si no coincide. */
export function matchScore(
  command: Pick<CommandDef, "label" | "keywords">,
  query: string,
): number {
  const q = normalizeTerm(query);
  if (!q) return 1;

  const label = normalizeTerm(command.label);
  const keywords = (command.keywords ?? []).filter(Boolean).map(normalizeTerm);

  const scoreOne = (term: string): number => {
    if (term === q) return 500;
    if (term.startsWith(q)) return 320;
    if (term.split(/[\s/·-]+/).some((w) => w.startsWith(q))) return 220;
    if (term.includes(q)) return 110;
    return 0;
  };

  const best = Math.max(scoreOne(label), ...keywords.map((k) => scoreOne(k) * 0.8));
  return best > 0 ? best : 0;
}
