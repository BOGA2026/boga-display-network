import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Clock, FileText, LayoutGrid, Layers, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScheduleBlock, ScheduleLayer, ScheduleTemplate } from "@/hooks/useScheduleData";
import { PRESETS } from "@/hooks/useScheduleData";

interface Props {
  blocks: ScheduleBlock[];
  layers: ScheduleLayer[];
  templates: ScheduleTemplate[];
  filterLayerId: string | null;
  onFilterLayer: (id: string | null) => void;
  selectedBlockId: string | null;
  onSelectBlock: (id: string | null) => void;
  onAddBlock: () => void;
  onApplyPreset: (start: string, end: string, label: string) => void;
  onApplyTemplate: (t: ScheduleTemplate) => void;
  conflicts: Map<string, string[]>;
}

const ContentLibrarySidebar = ({
  blocks,
  layers,
  templates,
  filterLayerId,
  onFilterLayer,
  selectedBlockId,
  onSelectBlock,
  onAddBlock,
  onApplyPreset,
  onApplyTemplate,
  conflicts,
}: Props) => {
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const layerMap = useMemo(() => {
    const m = new Map<string, ScheduleLayer>();
    layers.forEach((l) => m.set(l.id, l));
    return m;
  }, [layers]);

  const filteredBlocks = useMemo(() => {
    let list = blocks;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.playlist?.name?.toLowerCase().includes(q)
      );
    }
    if (filterLayerId) list = list.filter((b) => b.layer_id === filterLayerId);
    if (filterPriority !== "all") {
      const p = parseInt(filterPriority);
      list = list.filter((b) => layerMap.get(b.layer_id)?.priority === p);
    }
    if (filterStatus === "enabled") list = list.filter((b) => b.is_enabled);
    if (filterStatus === "disabled") list = list.filter((b) => !b.is_enabled);
    if (filterStatus === "conflict") list = list.filter((b) => conflicts.has(b.id));
    return list;
  }, [blocks, search, filterLayerId, filterPriority, filterStatus, layerMap, conflicts]);

  return (
    <div className="w-72 flex flex-col border-r border-border bg-card/60 rounded-xl overflow-hidden">
      {/* CTA */}
      <div className="p-3 border-b border-border">
        <Button
          className="w-full gradient-primary text-primary-foreground gap-2 glow-primary-sm h-9"
          onClick={onAddBlock}
        >
          <Plus className="h-4 w-4" />
          Nuevo bloque
        </Button>
      </div>

      {/* Search */}
      <div className="px-3 pt-3 pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar bloques…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm bg-secondary/60 border-border"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="px-3 pb-2 flex gap-2">
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="h-7 text-[11px] bg-secondary/40 border-border flex-1">
            <SelectValue placeholder="Prioridad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {layers.map((l) => (
              <SelectItem key={l.id} value={String(l.priority)}>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: l.color }} />
                  P{l.priority}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-7 text-[11px] bg-secondary/40 border-border flex-1">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="enabled">Activos</SelectItem>
            <SelectItem value="disabled">Inactivos</SelectItem>
            <SelectItem value="conflict">Conflictos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Layer chips */}
      <div className="px-3 pb-2 flex gap-1 flex-wrap">
        <button
          onClick={() => onFilterLayer(null)}
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors",
            filterLayerId === null
              ? "gradient-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground hover:text-foreground"
          )}
        >
          Todas
        </button>
        {layers.map((l) => (
          <button
            key={l.id}
            onClick={() => onFilterLayer(l.id)}
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors flex items-center gap-1",
              filterLayerId === l.id ? "text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
            style={filterLayerId === l.id ? { background: l.color } : undefined}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: l.color }} />
            {l.name}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="blocks" className="flex-1 flex flex-col min-h-0">
        <TabsList className="mx-3 mb-0 h-8 bg-secondary/40">
          <TabsTrigger value="blocks" className="text-[11px] gap-1 h-6">
            <LayoutGrid className="h-3 w-3" />
            Bloques
          </TabsTrigger>
          <TabsTrigger value="presets" className="text-[11px] gap-1 h-6">
            <Clock className="h-3 w-3" />
            Presets
          </TabsTrigger>
          <TabsTrigger value="templates" className="text-[11px] gap-1 h-6">
            <FileText className="h-3 w-3" />
            Plantillas
          </TabsTrigger>
        </TabsList>

        {/* Blocks list */}
        <TabsContent value="blocks" className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 m-0">
          {filteredBlocks.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              No hay bloques{search ? " que coincidan" : ""}.
            </p>
          ) : (
            filteredBlocks.map((b) => {
              const layer = layerMap.get(b.layer_id);
              const hasConflict = conflicts.has(b.id);
              const isSelected = selectedBlockId === b.id;
              return (
                <button
                  key={b.id}
                  onClick={() => onSelectBlock(b.id)}
                  className={cn(
                    "w-full text-left rounded-lg p-2.5 transition-all border",
                    isSelected
                      ? "border-primary/50 bg-primary/10 ring-1 ring-primary/30"
                      : "border-border/50 bg-secondary/30 hover:bg-secondary/60 hover:border-border"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-1 rounded-full shrink-0"
                      style={{ background: layer?.color || "hsl(var(--muted-foreground))" }}
                    />
                    <span className="text-xs font-medium truncate flex-1">
                      {b.name || "Sin nombre"}
                    </span>
                    {hasConflict && <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0" />}
                    {!b.is_enabled && (
                      <Badge variant="outline" className="text-[9px] h-4 px-1 border-muted-foreground/30 text-muted-foreground">
                        Off
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground pl-3.5">
                    <span>{b.start_time.slice(0, 5)}–{b.end_time.slice(0, 5)}</span>
                    <span>·</span>
                    <span className="truncate">{b.playlist?.name || "—"}</span>
                  </div>
                </button>
              );
            })
          )}
        </TabsContent>

        {/* Presets */}
        <TabsContent value="presets" className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 m-0">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => onApplyPreset(p.start, p.end, p.label)}
              className="w-full text-left rounded-lg p-3 border border-border/50 bg-secondary/30 hover:bg-secondary/60 hover:border-border transition-all"
            >
              <div className="text-xs font-medium">{p.label}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {p.start} – {p.end}
              </div>
            </button>
          ))}
        </TabsContent>

        {/* Templates */}
        <TabsContent value="templates" className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 m-0">
          {templates.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              No hay plantillas guardadas.
            </p>
          ) : (
            templates.map((t) => (
              <button
                key={t.id}
                onClick={() => onApplyTemplate(t)}
                className="w-full text-left rounded-lg p-3 border border-border/50 bg-secondary/30 hover:bg-secondary/60 hover:border-border transition-all"
              >
                <div className="text-xs font-medium flex items-center gap-2">
                  <FileText className="h-3 w-3 text-muted-foreground" />
                  {t.name}
                </div>
                {t.description && (
                  <div className="text-[10px] text-muted-foreground mt-0.5 pl-5 truncate">
                    {t.description}
                  </div>
                )}
              </button>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Legend */}
      <div className="px-3 py-2 border-t border-border/50">
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1">
          <Layers className="h-3 w-3" />
          Leyenda
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {layers.map((l) => (
            <span key={l.id} className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <span className="h-2 w-2 rounded-sm" style={{ background: l.color }} />
              {l.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ContentLibrarySidebar;
