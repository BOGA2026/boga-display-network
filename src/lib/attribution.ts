/**
 * attribution.ts — de qué anuncio vino la visita.
 *
 * Se lee de la URL al cargar y se guarda en sessionStorage para que sobreviva
 * al desplazamiento y a la navegación interna hasta el envío del formulario.
 * Los valores nunca se sobrescriben con vacíos: la primera lectura manda.
 */

const KEY = "visualia_attribution";

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

function read(): Attribution {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Attribution) : {};
  } catch {
    return {};
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
  if (landingPath && !next.landing_path) next.landing_path = landingPath.slice(0, 200);
  if (!next.referrer && document.referrer) next.referrer = document.referrer.slice(0, 500);

  try {
    sessionStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* modo incógnito estricto: seguimos sin persistir */
  }
  return next;
}

export function getAttribution(): Attribution {
  return read();
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
