// Helper to compute the real health status of a screen based on last_seen_at.
// Used by cards, badges and detail page so the dashboard reflects the live state.

export type ScreenHealth = "online" | "unstable" | "offline" | "unpaired";

export interface ScreenHealthInfo {
  status: ScreenHealth;
  label: string;
  className: string;
  dotClass: string;
  minutesSince: number | null;
}

export function getScreenHealth(lastSeenAt: string | null | undefined): ScreenHealthInfo {
  if (!lastSeenAt) {
    return {
      status: "unpaired",
      label: "Sin conectar",
      className: "text-slate-400 bg-slate-400/10",
      dotClass: "bg-slate-400",
      minutesSince: null,
    };
  }


  const diffMs = Date.now() - new Date(lastSeenAt).getTime();
  const minutes = diffMs / 60_000;

  if (minutes < 2) {
    return {
      status: "online",
      label: "En línea",
      className: "text-emerald-400 bg-emerald-400/10",
      dotClass: "bg-emerald-400",
      minutesSince: minutes,
    };
  }
  if (minutes < 5) {
    return {
      status: "unstable",
      label: "Inestable",
      className: "text-amber-400 bg-amber-400/10",
      dotClass: "bg-amber-400",
      minutesSince: minutes,
    };
  }
  return {
    status: "offline",
    label: "Desconectada",
    className: "text-rose-400 bg-rose-400/10",
    dotClass: "bg-rose-400",
    minutesSince: minutes,
  };
}

export function formatLastSeen(lastSeenAt: string | null | undefined): string {
  if (!lastSeenAt) return "Sin conectar";
  const minutes = (Date.now() - new Date(lastSeenAt).getTime()) / 60_000;
  if (minutes < 1) return "Hace un momento";
  if (minutes < 60) return `Hace ${Math.round(minutes)} min`;
  const hours = minutes / 60;
  if (hours < 24) return `Hace ${Math.round(hours)} h`;
  return `Hace ${Math.round(hours / 24)} d`;
}
