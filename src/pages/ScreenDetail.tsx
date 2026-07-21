/**
 * ScreenDetail — /dashboard/pantallas/:id
 * Preview (iframe), weekly timeline, command history and remote actions.
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, RotateCcw, RefreshCw, Power } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

type Screen = {
  id: string;
  name: string;
  status: string;
  location_id: string;
  last_seen_at: string | null;
  device_model: string | null;
  app_version: string | null;
};

type Cmd = {
  id: string;
  command: string;
  status: string;
  created_at: string;
  executed_at: string | null;
};

type Block = {
  id: string;
  days_of_week: number[];
  start_time: string;
  end_time: string;
  name: string;
};

const DAYS = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"];

type RemoteAction = "restart" | "reload" | "power_off";

export default function ScreenDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [screen, setScreen] = useState<Screen | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [commands, setCommands] = useState<Cmd[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState<RemoteAction | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;

    const load = async () => {
      setLoading(true);
      const [scr, sched, cmds] = await Promise.all([
        supabase
          .from("screens")
          .select(
            "id, name, status, location_id, last_seen_at, device_model, app_version",
          )
          .eq("id", id)
          .maybeSingle(),
        supabase
          .from("schedule_blocks")
          .select("id, days_of_week, start_time, end_time, name")
          .eq("screen_id", id)
          .order("start_time"),
        supabase
          .from("screen_commands")
          .select("id, command, status, created_at, executed_at")
          .eq("screen_id", id)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);
      if (!active) return;
      if (scr.data) setScreen(scr.data as Screen);
      setBlocks((sched.data as Block[]) ?? []);
      setCommands((cmds.data as Cmd[]) ?? []);
      setLoading(false);
    };

    load();

    const channel = supabase
      .channel(`screen-${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "screens", filter: `id=eq.${id}` },
        () => load(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "screen_commands",
          filter: `screen_id=eq.${id}`,
        },
        () => load(),
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [id]);

  const runAction = async (action: RemoteAction) => {
    if (!id) return;
    const { error } = await supabase.from("screen_commands").insert({
      screen_id: id,
      command: action,
      status: "pending",
    });
    if (error) {
      toast.error("No se pudo enviar el comando");
      return;
    }
    toast.success("Comando enviado a la pantalla");
    setConfirm(null);
  };

  const timeline = useMemo(() => {
    const byDay: Record<number, Block[]> = {};
    for (let d = 0; d < 7; d++) byDay[d] = [];
    blocks.forEach((b) => b.days_of_week?.forEach((d) => byDay[d]?.push(b)));
    return byDay;
  }, [blocks]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!screen) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Pantalla no encontrada.</p>
        <Link to="/dashboard/pantallas">
          <Button variant="ghost" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver
          </Button>
        </Link>
      </div>
    );
  }

  const statusVariant: "live" | "offline" | "idle" =
    screen.status === "online"
      ? "live"
      : screen.status === "offline"
        ? "offline"
        : "idle";

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard/pantallas")}
            className="mb-2"
          >
            <ArrowLeft className="mr-1 h-4 w-4" /> Pantallas
          </Button>
          <h1 className="text-2xl font-bold">{screen.name}</h1>
          <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
            <StatusBadge variant={statusVariant as never}>
              {screen.status}
            </StatusBadge>
            {screen.last_seen_at && (
              <span>
                Última señal{" "}
                {formatDistanceToNow(new Date(screen.last_seen_at), {
                  addSuffix: true,
                  locale: es,
                })}
              </span>
            )}
            {screen.device_model && <span>· {screen.device_model}</span>}
            {screen.app_version && <span>· v{screen.app_version}</span>}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setConfirm("reload")}>
            <RefreshCw className="mr-2 h-4 w-4" /> Recargar
          </Button>
          <Button variant="outline" onClick={() => setConfirm("restart")}>
            <RotateCcw className="mr-2 h-4 w-4" /> Reiniciar
          </Button>
          <Button variant="destructive" onClick={() => setConfirm("power_off")}>
            <Power className="mr-2 h-4 w-4" /> Apagar
          </Button>
        </div>
      </div>

      {/* Preview */}
      <Card className="overflow-hidden">
        <div className="aspect-video bg-black">
          <iframe
            src={`/player/${screen.id}`}
            title="Preview pantalla"
            className="h-full w-full border-0"
          />
        </div>
      </Card>

      {/* Weekly timeline */}
      <Card className="p-4">
        <h2 className="mb-3 text-lg font-semibold">Programación semanal</h2>
        <div className="grid grid-cols-7 gap-2">
          {DAYS.map((day, idx) => (
            <div key={day} className="min-h-[120px]">
              <div className="mb-2 text-xs font-medium text-muted-foreground">
                {day}
              </div>
              <div className="space-y-1">
                {timeline[idx].length === 0 ? (
                  <div className="text-xs text-muted-foreground/60">—</div>
                ) : (
                  timeline[idx].map((b) => (
                    <div
                      key={b.id}
                      className="rounded-md bg-primary/10 border border-primary/20 px-2 py-1 text-xs"
                    >
                      {b.start_time.slice(0, 5)}–{b.end_time.slice(0, 5)}
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <Link
            to={`/dashboard/programacion?screen=${screen.id}`}
            className="text-sm text-primary hover:underline"
          >
            Editar programación →
          </Link>
        </div>
      </Card>

      {/* Command history */}
      <Card className="p-4">
        <h2 className="mb-3 text-lg font-semibold">Historial de acciones</h2>
        {commands.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Todavía no se han enviado comandos a esta pantalla.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {commands.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-2">
                <div>
                  <div className="text-sm font-medium">{c.command}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(c.created_at), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{c.status}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Confirmation */}
      <AlertDialog
        open={confirm !== null}
        onOpenChange={(o) => !o && setConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm === "power_off"
                ? "¿Apagar la pantalla?"
                : confirm === "restart"
                  ? "¿Reiniciar la pantalla?"
                  : "¿Recargar el contenido?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              La acción se envía al dispositivo y se ejecuta en unos segundos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirm && runAction(confirm)}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
