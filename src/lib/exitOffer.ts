/**
 * exitOffer.ts — la oferta de salida vive en el servidor.
 *
 * El cronómetro no es un adorno: al mostrarse el modal se crea un registro
 * con `expires_at` a cinco minutos y todo se calcula contra ese instante.
 * Si la persona recarga, el reloj sigue donde iba. Si vence, el checkout no
 * aplica el descuento por más que la pantalla lo prometa.
 *
 * Una sola oportunidad, con doble control: la marca local (respuesta
 * inmediata, sin viaje de red) y el registro único por visitante en la base
 * (la que manda si alguien borra el navegador a medias).
 */

import { supabase } from "@/integrations/supabase/client";
import { EXIT_OFFER } from "@/config/pricing";

const VISITOR_KEY = "visualia_visitor_id";

export interface ExitOffer {
  code: string;
  percent: number;
  status: "shown" | "accepted" | "dismissed";
  /** Instante de vencimiento según el servidor. */
  expiresAt: number;
  /** Desfase entre el reloj del navegador y el del servidor, en ms. */
  skewMs: number;
  active: boolean;
}

/** Identificador anónimo del visitante. No es un dato personal. */
export function visitorId(): string {
  try {
    const found = localStorage.getItem(VISITOR_KEY);
    if (found) return found;
    const id = crypto.randomUUID();
    localStorage.setItem(VISITOR_KEY, id);
    return id;
  } catch {
    // Incógnito estricto: id efímero, la oferta vale sólo por esta pestaña.
    return `tmp-${Math.random().toString(36).slice(2)}-${Date.now()}`;
  }
}

type Payload = {
  code: string;
  percent: number;
  status: ExitOffer["status"];
  expires_at: string;
  server_now: string;
  active: boolean;
} | null;

function shape(payload: Payload): ExitOffer | null {
  if (!payload) return null;
  const serverNow = new Date(payload.server_now).getTime();
  return {
    code: payload.code,
    percent: payload.percent,
    status: payload.status,
    expiresAt: new Date(payload.expires_at).getTime(),
    skewMs: Date.now() - serverNow,
    active: payload.active,
  };
}

/** Milisegundos que quedan, corrigiendo el desfase del reloj local. */
export function msLeft(offer: ExitOffer): number {
  return Math.max(0, offer.expiresAt - (Date.now() - offer.skewMs));
}

/** Crea la oferta (o devuelve la que ya existía, con su vencimiento real). */
export async function claimExitOffer(): Promise<ExitOffer | null> {
  const { data, error } = await supabase.rpc("exit_offer_claim", {
    p_visitor_id: visitorId(),
  });
  if (error) return null;
  return shape(data as Payload);
}

/** Estado actual de la oferta del visitante, si tiene una. */
export async function getExitOffer(): Promise<ExitOffer | null> {
  const { data, error } = await supabase.rpc("exit_offer_get", {
    p_visitor_id: visitorId(),
  });
  if (error) return null;
  return shape(data as Payload);
}

/** Marca la oferta como tomada o descartada. No se puede volver atrás. */
export async function markExitOffer(status: "accepted" | "dismissed") {
  await supabase.rpc("exit_offer_mark", {
    p_visitor_id: visitorId(),
    p_status: status,
  });
}

/**
 * Porcentaje que el checkout puede aplicar de verdad: exige que el código
 * coincida y que la oferta siga viva según el servidor.
 */
export async function validateExitOffer(code: string | null | undefined) {
  if (!code) return 0;
  const offer = await getExitOffer();
  if (!offer || !offer.active) return 0;
  if (offer.code.toUpperCase() !== code.trim().toUpperCase()) return 0;
  return offer.percent;
}

/** Marca local: evita el parpadeo de mostrar y esconder. */
export function seenLocally() {
  try {
    return localStorage.getItem(EXIT_OFFER.storageKey) === "1";
  } catch {
    return true;
  }
}

export function markSeenLocally() {
  try {
    localStorage.setItem(EXIT_OFFER.storageKey, "1");
  } catch {
    /* incógnito: manda el registro del servidor */
  }
}

/** mm:ss para el cronómetro. */
export function formatCountdown(ms: number) {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
