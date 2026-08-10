import { useCallback, useEffect, useState } from "react";
import { RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useTenant } from "@/features/auth/useTenant";
import { restoreScreens } from "./deleteScreens";

interface DeletedScreen {
  id: string;
  name: string;
  location_name: string | null;
  deleted_at: string;
}

/** Papelera: pantallas eliminadas en los últimos 30 días, con opción de restaurar. */
export default function DeletedScreensCard() {
  const { hasRole } = useTenant();
  const canManage = hasRole(["owner", "admin"]);
  const [rows, setRows] = useState<DeletedScreen[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("list_deleted_screens");
    setLoading(false);
    if (error) {
      toast({ title: "No se pudo cargar la papelera", description: error.message, variant: "destructive" });
      return;
    }
    setRows((data as DeletedScreen[]) ?? []);
  }, []);

  useEffect(() => {
    if (canManage) load();
  }, [canManage, load]);

  if (!canManage) return null;

  return (
    <section className="v-card p-5">
      <header className="mb-3 flex items-center gap-2">
        <Trash2 className="h-4 w-4 text-muted-foreground" />
        <h2 className="font-display text-base">Pantallas eliminadas</h2>
      </header>
      <p className="mb-4 text-sm text-muted-foreground">
        Se conservan 30 días. Después se borran definitivamente junto con su telemetría.
      </p>

      {loading ? (
        <div className="h-16 animate-pulse rounded-lg bg-muted/30" />
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay pantallas eliminadas.</p>
      ) : (
        <ul className="divide-y divide-border/40">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{r.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {r.location_name ?? "Sin sede"} · eliminada el{" "}
                  {new Date(r.deleted_at).toLocaleDateString("es-CO", { day: "numeric", month: "short" })}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="gap-1.5 shrink-0"
                disabled={busy === r.id}
                onClick={async () => {
                  setBusy(r.id);
                  const ok = await restoreScreens([r.id]);
                  setBusy(null);
                  if (ok) load();
                }}
              >
                <RotateCcw className="h-4 w-4" /> Restaurar
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
