import { useState } from "react";
import { ArrowUpDown, MoreVertical, Trash2, ListPlus, MonitorPlay, LayoutGrid, Check, AlertTriangle, RectangleHorizontal, RectangleVertical, Square, ImagePlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { storageThumb } from "@/lib/storageImage";
import { ContentItem, TYPE_ICONS } from "./ContentCard";
import {
  MediaDims,
  formatBytes,
  formatDims,
  formatDuration,
  isHeavyFile,
  HEAVY_FILE_TOOLTIP,
  orientationLabel,
  orientationOf,
  ratioLabel,
  relativeDate,
  typeLabel,
} from "./mediaMeta";

type SortKey = "name" | "type" | "orientation" | "duration" | "size" | "weight" | "date";

interface Props {
  items: ContentItem[];
  dims: Record<string, MediaDims>;
  onDims: (id: string, dims: MediaDims) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  isDimmed: (id: string) => boolean;
  onOpen: (item: ContentItem) => void;
  onAssign: (item: ContentItem) => void;
  onSend: (item: ContentItem) => void;
  onDelete: (item: ContentItem) => void;
  onEdit: (item: ContentItem) => void;
  onGenerateThumb?: (item: ContentItem) => void;
  workingIds?: Set<string>;
}

/** Ícono acorde a la orientación: se lee de un vistazo en una lista larga. */
function OrientationCell({ dims }: { dims?: MediaDims | null }) {
  const o = orientationOf(dims);
  const label = orientationLabel(dims);
  if (!o || !label) return <>—</>;
  const Icon = o === "vertical" ? RectangleVertical : o === "cuadrada" ? Square : RectangleHorizontal;
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 opacity-60" />
      {label}
    </span>
  );
}


const COLUMNS: { key: SortKey; label: string; className?: string }[] = [
  { key: "name", label: "Nombre" },
  { key: "type", label: "Tipo", className: "w-28" },
  { key: "orientation", label: "Orientación", className: "w-28" },
  { key: "duration", label: "Duración", className: "w-24" },
  { key: "size", label: "Resolución", className: "w-28" },
  { key: "weight", label: "Peso", className: "w-28" },
  { key: "date", label: "Fecha", className: "w-32" },
];


export function ContentTable({
  items,
  dims,
  onDims,
  selectedIds,
  onToggleSelect,
  isDimmed,
  onOpen,
  onAssign,
  onSend,
  onDelete,
  onEdit,
  onGenerateThumb,
  workingIds,
}: Props) {
  const [sort, setSort] = useState<{ key: SortKey; asc: boolean }>({ key: "date", asc: false });

  const value = (item: ContentItem, key: SortKey): string | number => {
    const d = dims[item.id];
    switch (key) {
      case "name": return item.name.toLowerCase();
      case "type": return typeLabel(item.type);
      case "orientation": return ratioLabel(d) ?? "";
      case "duration": return item.duration_seconds ?? 0;
      case "size": return d ? d.width * d.height : 0;
      case "weight": return item.file_size_bytes ?? 0;
      case "date": return new Date(item.created_at).getTime();

    }
  };

  const sorted = [...items].sort((a, b) => {
    const va = value(a, sort.key);
    const vb = value(b, sort.key);
    if (va === vb) return 0;
    return (va > vb ? 1 : -1) * (sort.asc ? 1 : -1);
  });

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, asc: !s.asc } : { key, asc: true }));

  return (
    <div className="overflow-x-auto rounded-xl border border-border/30 surface-elevated">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/30 text-left text-xs text-muted-foreground">
            <th className="w-10 p-3" />
            <th className="w-20 p-3">Vista</th>
            {COLUMNS.map((c) => (
              <th key={c.key} className={cn("p-3 font-medium", c.className)}>
                <button
                  onClick={() => toggleSort(c.key)}
                  className="inline-flex items-center gap-1 hover:text-foreground"
                >
                  {c.label}
                  <ArrowUpDown className="h-3 w-3 opacity-50" />
                </button>
              </th>
            ))}
            <th className="w-10 p-3" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((item) => {
            const d = dims[item.id];
            const Icon = TYPE_ICONS[item.type] ?? LayoutGrid;
            const thumbSrc = item.thumbnail_url ?? (item.type === "image" ? item.file_url : null);
            const selected = selectedIds.has(item.id);
            const dimmed = isDimmed(item.id);
            const working = workingIds?.has(item.id) || (!thumbSrc && item.thumbnail_status === "pendiente");
            const unknownDuration = item.type === "video" && !item.duration_seconds;

            return (
              <tr
                key={item.id}
                title={dimmed ? "Orientación distinta a la de esta pantalla" : undefined}
                className={cn(
                  "cursor-pointer border-b border-border/20 transition-colors last:border-0 hover:bg-secondary/40",
                  selected && "v-selected",
                  dimmed && "opacity-40",
                )}
                onClick={(e) => {
                  const target = e.target as HTMLElement;
                  if (target.closest("[data-row-action]") || target.closest('[role="menu"]')) return;
                  onOpen(item);
                }}
              >
                <td className="p-3">
                  <button
                    data-row-action
                    aria-label={selected ? "Quitar de la selección" : "Seleccionar"}
                    onClick={(e) => { e.stopPropagation(); onToggleSelect(item.id); }}
                    className={cn(
                      "flex h-4 w-4 items-center justify-center rounded border border-border",
                      selected && "v-check-on",
                    )}
                  >
                    {selected && <Check className="h-3 w-3" />}
                  </button>
                </td>
                <td className="p-3">
                  <div className="flex h-9 w-16 items-center justify-center overflow-hidden rounded bg-[hsl(var(--admin-surface-2,var(--muted)))]">
                    {thumbSrc ? (
                      <img
                        src={storageThumb(thumbSrc, { width: 480, resize: "contain" })}
                        alt={item.name}
                        width={64}
                        height={36}
                        loading="lazy"
                        decoding="async"
                        onLoad={(e) => {
                          const el = e.currentTarget;
                          if (el.naturalWidth) onDims(item.id, { width: el.naturalWidth, height: el.naturalHeight });
                        }}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <Icon className="h-4 w-4 text-muted-foreground opacity-30" />
                    )}
                  </div>
                </td>
                <td className="max-w-0 p-3">
                  <span className="block truncate font-medium">{item.name}</span>
                </td>
                <td className="p-3 text-muted-foreground">{typeLabel(item.type)}</td>
                <td className="p-3 text-muted-foreground">{ratioLabel(d) ?? "—"}</td>
                <td className="p-3 text-muted-foreground">{formatDuration(item.duration_seconds) ?? "—"}</td>
                <td className="p-3 text-muted-foreground">{formatDims(d) ?? "—"}</td>
                <td className="p-3 text-muted-foreground">
                  {formatBytes(item.file_size_bytes) ? (
                    <span
                      title={isHeavyFile(item.file_size_bytes) ? HEAVY_FILE_TOOLTIP : undefined}
                      className={cn(
                        "inline-flex items-center gap-1",
                        isHeavyFile(item.file_size_bytes) && "rounded bg-amber-500/15 px-1.5 py-0.5 text-amber-400",
                      )}
                    >
                      {isHeavyFile(item.file_size_bytes) && <AlertTriangle className="h-3 w-3" />}
                      {formatBytes(item.file_size_bytes)}
                    </span>
                  ) : "—"}
                </td>
                <td className="p-3 text-muted-foreground">{relativeDate(item.created_at)}</td>

                <td className="p-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        data-row-action
                        aria-label="Más acciones"
                        onClick={(e) => e.stopPropagation()}
                        className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {(item.type === "layout" || item.type === "menu") && (
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(item); }}>
                          <LayoutGrid className="mr-2 h-4 w-4" />
                          Editar en canvas
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAssign(item); }}>
                        <ListPlus className="mr-2 h-4 w-4" />
                        Agregar a lista
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSend(item); }}>
                        <MonitorPlay className="mr-2 h-4 w-4" />
                        Enviar a pantalla
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => { e.stopPropagation(); onDelete(item); }}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
