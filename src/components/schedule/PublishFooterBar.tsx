import { Button } from "@/components/ui/button";
import { Upload, Copy, Plus } from "lucide-react";
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

const PublishFooterBar = ({
  onAddContent,
  onCopyToDays,
  onPublish,
  isPublishing,
  hasChanges,
  blockCount,
}: Props) => {
  return (
    <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-card/70 backdrop-blur-sm border border-border/50">
      {/* Add content */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="lg"
            className="gradient-primary text-primary-foreground rounded-xl gap-2.5 text-base h-12 px-6 glow-primary-sm"
            onClick={onAddContent}
          >
            <Plus className="h-5 w-5" />
            Agregar contenido
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Programa una imagen, video o plantilla en tu pantalla</p>
        </TooltipContent>
      </Tooltip>

      {/* Copy to days */}
      {blockCount > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="lg"
              className="rounded-xl gap-2 text-sm h-12"
              onClick={onCopyToDays}
            >
              <Copy className="h-4 w-4" />
              Copiar a otros días
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Copia la programación de un día a otros días de la semana</p>
          </TooltipContent>
        </Tooltip>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Summary */}
      <span className="text-sm text-muted-foreground">
        {blockCount > 0
          ? `${blockCount} contenido${blockCount > 1 ? "s" : ""} programado${blockCount > 1 ? "s" : ""}`
          : "Sin contenido programado"}
      </span>

      {/* Publish */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="lg"
            className={`rounded-xl gap-2.5 text-base h-12 px-8 transition-all ${
              hasChanges
                ? "gradient-primary text-primary-foreground glow-primary animate-pulse"
                : "bg-emerald-600 hover:bg-emerald-700 text-white"
            }`}
            onClick={onPublish}
            disabled={isPublishing || blockCount === 0}
          >
            <Upload className="h-5 w-5" />
            {isPublishing ? "Publicando…" : "Publicar"}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{hasChanges ? "Envía los cambios a tu pantalla" : "Tu pantalla está actualizada"}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

export default PublishFooterBar;
