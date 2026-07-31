import { Download, MonitorPlay, Loader2, X, AlertTriangle, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { storageThumb } from "@/lib/storageImage";
import { useToast } from "@/hooks/use-toast";
import type { GenerationRow } from "./api";
import { getBusinessId, getUserId } from "@/features/auth/tenant";

interface Props {
  items: GenerationRow[];
  onUseOnScreen?: (row: GenerationRow) => void;
}

const TOOL_LABEL: Record<GenerationRow["tool"], string> = {
  generate_image: "Imagen",
  generate_video_loop: "Loop",
  suggest_copy: "Copy",
  apply_brand_kit: "Brand kit",
};

export function GenerationHistory({ items, onUseOnScreen }: Props) {
  const { toast } = useToast();

  const download = async (row: GenerationRow) => {
    if (!row.output_url) return;
    try {
      const resp = await fetch(row.output_url);
      const blob = await resp.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `visualia-${row.id.slice(0, 8)}.${blob.type.split("/")[1] ?? "png"}`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      toast({ title: "No se pudo descargar", description: String(err), variant: "destructive" });
    }
  };

  const useOnScreen = async (row: GenerationRow) => {
    if (!row.output_url) return;
    try {
      const userId = await getUserId();
      if (!userId) throw new Error("Sesión no válida");
      const businessId = await getBusinessId();
      if (!businessId) throw new Error("Sin negocio asociado");
      const { error } = await supabase.from("content").insert({
        business_id: businessId,
        name: row.prompt?.slice(0, 60) ?? "Contenido IA",
        type: row.tool === "generate_video_loop" ? "video" : "image",
        url: row.output_url,
        created_by: userId,
      });
      if (error) throw error;
      toast({ title: "Enviado a tu biblioteca", description: "Ahora puedes programarlo desde Contenido." });
      onUseOnScreen?.(row);
    } catch (err) {
      toast({ title: "No se pudo enviar", description: String(err), variant: "destructive" });
    }
  };

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 p-8 text-center text-sm text-muted-foreground">
        Todavía no tienes generaciones. Crea la primera arriba.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((row) => (
        <div
          key={row.id}
          className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/60 shadow-sm transition-shadow hover:shadow-lg"
        >
          <div className="relative aspect-video overflow-hidden bg-muted/40">
            {row.output_url ? (
              <img
                src={storageThumb(row.output_url, { width: 320 })}
                alt={row.prompt ?? "Generación"}
                width={320}
                height={180}
                decoding="async"
                style={{ aspectRatio: "16 / 9" }}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : row.output_text ? (
              <div className="flex h-full items-center justify-center p-3 text-center text-sm text-foreground">
                <p className="line-clamp-6">{tryTitle(row.output_text)}</p>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                {row.status === "pending" ? <Loader2 className="h-5 w-5 animate-spin" /> : <X className="h-5 w-5" />}
              </div>
            )}
            <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-white">
              {TOOL_LABEL[row.tool]}
            </span>
            <StatusPill status={row.status} />
          </div>

          <div className="flex flex-1 flex-col gap-2 p-3">
            <p className="line-clamp-2 min-h-[2.5em] text-xs text-muted-foreground">
              {row.prompt ?? "—"}
            </p>
            <div className="flex items-center justify-between text-xs text-muted-foreground/80">
              <span>{formatDistanceToNow(new Date(row.created_at), { addSuffix: true, locale: es })}</span>
              <span>{row.tokens_used > 0 ? `${row.tokens_used} tk` : ""}</span>
            </div>
            {row.status === "completed" && row.output_url && (
              <div className="mt-1 flex gap-2">
                <Button size="sm" className="flex-1 gap-1" onClick={() => useOnScreen(row)}>
                  <MonitorPlay className="h-3.5 w-3.5" /> Usar en pantalla
                </Button>
                <Button size="sm" variant="outline" onClick={() => download(row)}>
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function tryTitle(text: string) {
  try {
    const parsed = JSON.parse(text) as { titulo?: string; subtitulo?: string; cta?: string };
    return [parsed.titulo, parsed.subtitulo, parsed.cta].filter(Boolean).join(" · ");
  } catch {
    return text;
  }
}

function StatusPill({ status }: { status: GenerationRow["status"] }) {
  if (status === "completed") return null;
  const map = {
    pending: { icon: Loader2, cls: "bg-primary/80 animate-pulse", label: "Generando" },
    failed: { icon: AlertTriangle, cls: "bg-destructive", label: "Falló" },
    cancelled: { icon: X, cls: "bg-muted-foreground", label: "Cancelado" },
    completed: { icon: CheckCircle2, cls: "bg-emerald-500", label: "Listo" },
  }[status];
  const Icon = map.icon;
  return (
    <span className={`absolute right-2 top-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white ${map.cls}`}>
      <Icon className="h-3 w-3" /> {map.label}
    </span>
  );
}
