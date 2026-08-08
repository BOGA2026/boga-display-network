import { useEffect, useState } from "react";
import simboloVisualia from "@/assets/simbolo-visualia.webp";

type Props = {
  /** true mientras se está escribiendo en la base de datos. */
  saving: boolean;
  /** Momento del último guardado exitoso, o null si nunca se guardó. */
  lastSavedAt: number | null;
  /** true si hay cambios posteriores al último guardado. */
  dirty: boolean;
};

function relativo(ms: number) {
  const s = Math.floor(ms / 1000);
  if (s < 60) return "hace un momento";
  const m = Math.floor(s / 60);
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.floor(h / 24)} d`;
}

/**
 * Estado de guardado con el símbolo de Visualia: convierte un dato funcional
 * en un recordatorio de marca sin ocupar espacio extra.
 */
export function EditorSaveStatus({ saving, lastSavedAt, dirty }: Props) {
  const [, tick] = useState(0);

  useEffect(() => {
    if (!lastSavedAt) return;
    const id = window.setInterval(() => tick((n) => n + 1), 30000);
    return () => window.clearInterval(id);
  }, [lastSavedAt]);

  const texto = saving
    ? "Guardando…"
    : lastSavedAt && !dirty
      ? `Guardado ${relativo(Date.now() - lastSavedAt)}`
      : "Sin guardar";

  return (
    <span
      className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:inline-flex"
      aria-live="polite"
    >
      <img
        src={simboloVisualia}
        alt=""
        aria-hidden
        width={14}
        height={14}
        style={{ height: 14, width: "auto" }}
        className={saving ? "shrink-0 animate-pulse" : "shrink-0"}
      />
      {texto}
    </span>
  );
}
