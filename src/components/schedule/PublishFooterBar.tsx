import { Button } from "@/components/ui/button";
import { Upload, Copy, Plus, Check } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Props {
  onAddContent: () => void;
  onCopyToDays: () => void;
  onPublish: () => void;
  isPublishing: boolean;
  hasChanges: boolean;
  blockCount: number;
}

/**
 * Jerarquía: "Publicar" es la acción primaria (violeta de marca) porque es la
 * que hace efectivo el trabajo. "Agregar contenido" queda en outline y
 * "Copiar a otros días" en ghost. El verde se reserva para estados de éxito.
 */
const PublishFooterBar = ({
  onAddContent,
  onCopyToDays,
  onPublish,
  isPublishing,
  hasChanges,
  blockCount,
}: Props) => {
  const nothingToPublish = blockCount === 0 || !hasChanges;

  return (
    // pr-20 en escritorio: deja libre la esquina donde flota el asistente,
    // para que nunca tape el botón de publicar.
    <div className="flex flex-wrap items-center gap-2 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:pr-20 rounded-2xl bg-card/70 backdrop-blur-sm border border-border/50">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" className="rounded-xl gap-2 h-11" onClick={onAddContent}>
            <Plus className="h-4 w-4" />
            Agregar contenido
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Programa una imagen, video o plantilla en tu pantalla</p>
        </TooltipContent>
      </Tooltip>

      {blockCount > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" className="rounded-xl gap-2 h-11 text-muted-foreground" onClick={onCopyToDays}>
              <Copy className="h-4 w-4" />
              Copiar a otros días
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Copia la programación de un día a otros días de la semana</p>
          </TooltipContent>
        </Tooltip>
      )}

      <div className="flex-1" />

      <span className="text-xs text-muted-foreground">
        {blockCount > 0
          ? `${blockCount} contenido${blockCount > 1 ? "s" : ""} programado${blockCount > 1 ? "s" : ""}`
          : "Sin contenido programado"}
      </span>

      <Tooltip>
        <TooltipTrigger asChild>
          <span tabIndex={nothingToPublish ? 0 : -1} className="inline-flex">
            <Button
              className="gradient-primary text-primary-foreground rounded-xl gap-2 h-11 px-6 disabled:opacity-60"
              onClick={onPublish}
              disabled={isPublishing || nothingToPublish}
            >
              {nothingToPublish && !isPublishing ? <Check className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
              {isPublishing ? "Publicando…" : nothingToPublish ? "Todo publicado" : "Publicar"}
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{nothingToPublish ? "No hay cambios sin publicar" : "Envía los cambios a tu pantalla"}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

export default PublishFooterBar;
