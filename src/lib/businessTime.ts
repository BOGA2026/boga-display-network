/**
 * Hora local del negocio.
 *
 * Las horas de programación (`schedule_blocks.start_time` / `end_time`) son
 * columnas `time` sin zona: representan la hora local del local, no un
 * instante UTC. "El menú del almuerzo va de 11:00 a 15:00" significa 11:00
 * donde está el local, siempre, sin importar el horario de verano ni desde
 * dónde se administre.
 *
 * Por eso nunca se convierten al guardar ni al dibujar el calendario. Lo
 * único que necesita zona horaria es responder "¿qué está al aire AHORA?",
 * y esa respuesta se calcula con la zona del negocio, no con la del
 * navegador de quien administra.
 */

export const DEFAULT_TIMEZONE = "America/Bogota";

interface LocalParts {
  /** 0 = domingo, como Date.getDay() */
  dayIndex: number;
  hours: number;
  minutes: number;
}

const DAY_TO_INDEX: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

/** Partes de la fecha en la zona indicada. Sin dependencias externas. */
export function localParts(timeZone = DEFAULT_TIMEZONE, date = new Date()): LocalParts {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(date);
  } catch {
    parts = new Intl.DateTimeFormat("en-US", {
      timeZone: DEFAULT_TIMEZONE,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(date);
  }
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const hours = Number(get("hour")) % 24;
  return {
    dayIndex: DAY_TO_INDEX[get("weekday")] ?? date.getDay(),
    hours: Number.isFinite(hours) ? hours : 0,
    minutes: Number(get("minute")) || 0,
  };
}

/** "HH:MM" en la zona del negocio. */
export function nowLocalTime(timeZone = DEFAULT_TIMEZONE, date = new Date()): string {
  const { hours, minutes } = localParts(timeZone, date);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/** Minutos desde medianoche en la zona del negocio. */
export function nowLocalMinutes(timeZone = DEFAULT_TIMEZONE, date = new Date()): number {
  const { hours, minutes } = localParts(timeZone, date);
  return hours * 60 + minutes;
}

/** Día de la semana (0 = domingo) en la zona del negocio. */
export function nowLocalDayIndex(timeZone = DEFAULT_TIMEZONE, date = new Date()): number {
  return localParts(timeZone, date).dayIndex;
}

/** Etiqueta corta de la zona, p. ej. "GMT-5". */
export function timeZoneLabel(timeZone = DEFAULT_TIMEZONE, date = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "shortOffset" }).formatToParts(date);
    return parts.find((p) => p.type === "timeZoneName")?.value ?? "";
  } catch {
    return "";
  }
}

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function minutesToTime(m: number): string {
  const total = ((m % 1440) + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}
