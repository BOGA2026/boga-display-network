import { useState } from "react";
import { RefreshCw, Power, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface RemoteActionsPanelProps {
  screenId: string;
  screenName: string;
}

type CommandType = "RELOAD" | "RESTART_APP" | "SYNC";

const ACTIONS: Array<{
  command: CommandType;
  icon: typeof RefreshCw;
  label: string;
  description: string;
}> = [
  {
    command: "RELOAD",
    icon: RefreshCw,
    label: "Recargar contenido",
    description: "Refresca la pantalla con la última playlist asignada.",
  },
  {
    command: "RESTART_APP",
    icon: Power,
    label: "Reiniciar app",
    description: "Reinicia la aplicación completa en el dispositivo.",
  },
  {
    command: "SYNC",
    icon: RotateCcw,
    label: "Forzar sincronización",
    description: "Vuelve a descargar la programación actual.",
  },
];

export default function RemoteActionsPanel({ screenId, screenName }: RemoteActionsPanelProps) {
  const [pending, setPending] = useState<CommandType | null>(null);

  const sendCommand = async (command: CommandType) => {
    setPending(command);
    try {
      const { error } = await supabase
        .from("screen_commands")
        .insert({
          screen_id: screenId,
          command,
          payload: {},
          status: "pending",
        });

      if (error) throw error;

      toast({
        title: "Acción enviada",
        description: `${screenName} recibirá la orden en menos de 60 segundos.`,
      });
    } catch (err: any) {
      toast({
        title: "No se pudo enviar la acción",
        description: err.message ?? "Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="border-b border-border px-4 py-2.5">
        <h3 className="text-sm font-semibold text-foreground">Acciones remotas</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Controla la pantalla sin moverte del panel.
        </p>
      </div>
      <div className="divide-y divide-border">
        {ACTIONS.map(({ command, icon: Icon, label, description }) => {
          const isLoading = pending === command;
          return (
            <button
              key={command}
              onClick={() => sendCommand(command)}
              disabled={pending !== null}
              className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40 disabled:opacity-50"
            >
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-foreground">{label}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
