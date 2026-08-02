/**
 * attribution.ts — de qué anuncio vino la visita.
 *
 * Se lee de la URL al cargar y se guarda en localStorage con vencimiento a 30
 * días. Antes se usaba sessionStorage: eso perdía el origen si la persona
 * cerraba la pestaña y volvía después, y así los leads quedaban sin fuente.
 * Los valores nunca se sobrescriben con vacíos: la primera lectura manda.
 */

const KEY = "visualia_attribution";
const TTL_DAYS = 30;
const TTL_MS = TTL_DAYS * 24 * 60 * 60 * 1000;

export interface Attribution {
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  gclid?: string | null;
  fbclid?: string | null;
  ttclid?: string | null;
  landing_path?: string | null;
  referrer?: string | null;
  /** Marca de televisor elegida en el verificador (id de TV_BRANDS). */
  tv_brand?: string | null;
  /** True cuando esa marca necesita el dispositivo externo. */
  needs_device?: boolean | null;
}

interface Stored {
  savedAt: number;
  data: Attribution;
}

const FIELDS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "gclid",
  "fbclid",
  "ttclid",
] as const;

/** Alias que usan algunas plataformas para el mismo identificador de clic. */
const CLICK_ALIASES: Record<string, (typeof FIELDS)[number]> = {
  gbraid: "gclid",
  wbraid: "gclid",
  ttclid: "ttclid",
  tt_clid: "ttclid",
  fbclid: "fbclid",
};

function read(): Attribution {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Stored | Attribution;
    // Formato viejo (sin marca de tiempo): se acepta una vez y se re-guarda.
    if (!parsed || typeof parsed !== "object") return {};
    if (!("savedAt" in parsed)) return parsed as Attribution;
    if (Date.now() - parsed.savedAt > TTL_MS) {
      localStorage.removeItem(KEY);
      return {};
    }
    return parsed.data ?? {};
  } catch {
    return {};
  }
}

function write(data: Attribution) {
  try {
    const payload: Stored = { savedAt: Date.now(), data };
    localStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    /* modo incógnito estricto o almacenamiento lleno: seguimos sin persistir */
  }
}

/** Captura los parámetros de la URL actual y los persiste. Idempotente. */
export function captureAttribution(landingPath?: string): Attribution {
  if (typeof window === "undefined") return {};
  const stored = read();
  const params = new URLSearchParams(window.location.search);
  const next: Attribution = { ...stored };

  for (const f of FIELDS) {
    const v = params.get(f)?.trim();
    if (v && !next[f]) next[f] = v.slice(0, 200);
  }
  for (const [param, field] of Object.entries(CLICK_ALIASES)) {
    const v = params.get(param)?.trim();
    if (v && !next[field]) next[field] = v.slice(0, 200);
  }
  if (landingPath && !next.landing_path) next.landing_path = landingPath.slice(0, 200);
  if (!next.referrer && document.referrer) next.referrer = document.referrer.slice(0, 500);

  write(next);
  return next;
}

export function getAttribution(): Attribution {
  return read();
}

/**
 * Etiqueta legible del origen para mensajes y reportes.
 * Nunca devuelve "default": eso confundía la lectura de campañas.
 */
export function attributionLabel(): string | null {
  const a = read();
  const parts = [a.utm_campaign, a.utm_source].filter(
    (v): v is string => Boolean(v) && v !== "default"
  );
  return parts.length ? [...new Set(parts)].join(" · ") : null;
}

type GtagWindow = Window & {
  gtag?: (...args: unknown[]) => void;
  fbq?: (...args: unknown[]) => void;
  ttq?: { track: (...args: unknown[]) => void };
  dataLayer?: unknown[];
};

/**
 * Evento de conversión. Dispara lo que haya disponible (GA4, Meta, TikTok) y
 * siempre empuja al dataLayer para Tag Manager. Nunca lanza errores.
 */
export function trackConversion(name: string, data: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const w = window as GtagWindow;
  try {
    w.dataLayer = w.dataLayer ?? [];
    w.dataLayer.push({ event: name, ...data });
    w.gtag?.("event", name, data);
    w.fbq?.("track", name === "lead_submit" ? "Lead" : "Contact", data);
    w.ttq?.track(name === "lead_submit" ? "SubmitForm" : "Contact", data);
  } catch {
    /* la medición nunca puede romper la conversión */
  }
}
