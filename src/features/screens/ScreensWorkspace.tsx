import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ChevronDown,
  Search,
  X,
  Rows3,
  LayoutGrid,
  CheckSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { syncSeverity } from "@/hooks/useAnalytics";
import { ScreenTile } from "./ScreenTile";
import { TileGrid } from "./TileGrid";
import BulkActionsBar from "./BulkActionsBar";
import { useNowPlaying } from "./useNowPlaying";
import type {
  LocationRow,
  OrientationFilter,
  ScreenRow,
  SortKey,
  StatusFilter,
} from "./types";

const GROUP_PREF_KEY = "screens.groupByLocation";
const SORT_PREF_KEY = "screens.sort";

interface Props {
  screens: ScreenRow[];
  locations: LocationRow[];
  timezone?: string;
  onRefresh: () => void;
  onChangeContent: (screen: ScreenRow) => void;
}

function isLive(lastSeenAt: string | null) {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() < 180_000;
}

function statusOf(s: ScreenRow): StatusFilter {
  if (isLive(s.last_seen_at)) return "live";
  if (!s.last_seen_at && !s.device_token) return "unpaired";
  return "offline";
}

function orientationOf(s: ScreenRow): OrientationFilter {
  const r = ((s.rotation ?? 0) % 360 + 360) % 360;
  return r === 90 || r === 270 ? "vertical" : "horizontal";
}

const STATUS_LABEL: Record<StatusFilter, string> = {
  live: "En vivo",
  offline: "Sin conexión",
  unpaired: "Sin vincular",
};

export default function ScreensWorkspace({
  screens,
  locations,
  timezone,
  onRefresh,
  onChangeContent,
}: Props) {
  const navigate = useNavigate();
  const { nowPlaying } = useNowPlaying(timezone);
  const searchRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");
  const [statusFilters, setStatusFilters] = useState<StatusFilter[]>([]);
  const [locationFilters, setLocationFilters] = useState<string[]>([]);
  const [orientationFilters, setOrientationFilters] = useState<OrientationFilter[]>([]);
  const [sort, setSort] = useState<SortKey>(
    () => (localStorage.getItem(SORT_PREF_KEY) as SortKey) || "name",
  );
  const [grouped, setGrouped] = useState(
    () => localStorage.getItem(GROUP_PREF_KEY) !== "false",
  );
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => localStorage.setItem(GROUP_PREF_KEY, String(grouped)), [grouped]);
  useEffect(() => localStorage.setItem(SORT_PREF_KEY, sort), [sort]);

  // Barra diagonal enfoca el buscador, como en cualquier consola de operación.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement | null;
      const typing = el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
      if (e.key === "/" && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape") setSelected([]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const locationName = useMemo(() => {
    const m = new Map(locations.map((l) => [l.id, l.name]));
    return (id: string) => m.get(id) ?? "Sin sede asignada";
  }, [locations]);

  /** Excepciones: lo que hay que atender hoy. */
  const stale = useMemo(
    () => screens.filter((s) => {
      const sev = syncSeverity(s.last_seen_at);
      return s.device_token || s.last_seen_at ? sev.severity === "critical" : false;
    }),
    [screens],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = screens.filter((s) => {
      if (q && !s.name.toLowerCase().includes(q) && !locationName(s.location_id).toLowerCase().includes(q)) return false;
      if (statusFilters.length && !statusFilters.includes(statusOf(s))) return false;
      if (locationFilters.length && !locationFilters.includes(s.location_id)) return false;
      if (orientationFilters.length && !orientationFilters.includes(orientationOf(s))) return false;
      return true;
    });
    const order: Record<StatusFilter, number> = { live: 0, offline: 1, unpaired: 2 };
    list = [...list].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name, "es");
      if (sort === "status") return order[statusOf(a)] - order[statusOf(b)] || a.name.localeCompare(b.name, "es");
      const ta = a.last_seen_at ? new Date(a.last_seen_at).getTime() : 0;
      const tb = b.last_seen_at ? new Date(b.last_seen_at).getTime() : 0;
      return tb - ta;
    });
    return list;
  }, [screens, search, statusFilters, locationFilters, orientationFilters, sort, locationName]);

  const groups = useMemo(() => {
    if (!grouped) return [{ id: "__all__", name: "Todas las pantallas", items: filtered }];
    const map = new Map<string, ScreenRow[]>();
    for (const s of filtered) {
      const arr = map.get(s.location_id) ?? [];
      arr.push(s);
      map.set(s.location_id, arr);
    }
    return [...map.entries()]
      .map(([id, items]) => ({ id, name: locationName(id), items }))
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [filtered, grouped, locationName]);

  const toggleSelect = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const selectGroup = (items: ScreenRow[]) => {
    const ids = items.map((i) => i.id);
    const allIn = ids.every((id) => selected.includes(id));
    setSelected((prev) => (allIn ? prev.filter((id) => !ids.includes(id)) : [...new Set([...prev, ...ids])]));
  };

  const activeFilters =
    statusFilters.length + locationFilters.length + orientationFilters.length > 0 || search.trim().length > 0;

  const chip = (active: boolean) =>
    cn(
      "v-seg-item overflow-hidden rounded-full border border-border/40 px-2.5 py-1 text-xs",
      active && "v-seg-item-active",
    );

  return (
    <div className="space-y-4">
      {/* 1. Franja de excepciones */}
      {stale.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
          <span className="text-amber-100">
            {stale.length} {stale.length === 1 ? "pantalla sin reportar" : "pantallas sin reportar"} hace más de 48 h
          </span>
          <Button
            size="sm"
            variant="outline"
            className="ml-auto border-amber-500/40 text-amber-200 hover:bg-amber-500/15"
            onClick={() => {
              setStatusFilters(["offline"]);
              setSort("last_seen");
            }}
          >
            Ver solo esas
          </Button>
        </div>
      )}

      {/* Buscador, filtros y orden */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar pantalla o sede…  (/)"
              className="pl-9"
              aria-label="Buscar pantallas"
            />
          </div>
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="w-[190px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Ordenar por nombre</SelectItem>
              <SelectItem value="last_seen">Última conexión</SelectItem>
              <SelectItem value="status">Estado</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setGrouped((g) => !g)}
            aria-pressed={grouped}
          >
            {grouped ? <Rows3 className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
            {grouped ? "Por sede" : "Lista plana"}
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {(["live", "offline", "unpaired"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              className={chip(statusFilters.includes(s))}
              onClick={() =>
                setStatusFilters((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]))
              }
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
          <span className="mx-1 h-4 w-px bg-border/50" />
          {locations.map((l) => (
            <button
              key={l.id}
              className={chip(locationFilters.includes(l.id))}
              onClick={() =>
                setLocationFilters((p) => (p.includes(l.id) ? p.filter((x) => x !== l.id) : [...p, l.id]))
              }
            >
              {l.name}
            </button>
          ))}
          <span className="mx-1 h-4 w-px bg-border/50" />
          {(["horizontal", "vertical"] as OrientationFilter[]).map((o) => (
            <button
              key={o}
              className={chip(orientationFilters.includes(o))}
              onClick={() =>
                setOrientationFilters((p) => (p.includes(o) ? p.filter((x) => x !== o) : [...p, o]))
              }
            >
              {o === "horizontal" ? "Horizontal" : "Vertical"}
            </button>
          ))}
          {activeFilters && (
            <button
              className="ml-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                setSearch("");
                setStatusFilters([]);
                setLocationFilters([]);
                setOrientationFilters([]);
              }}
            >
              <X className="h-3 w-3" /> Quitar filtros
            </button>
          )}
          <span className="ml-auto text-xs text-muted-foreground">
            {filtered.length} de {screens.length}
          </span>
        </div>
      </div>

      {/* Grupos */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border/30 py-16 text-center text-sm text-muted-foreground">
          Ninguna pantalla coincide con los filtros aplicados.
        </div>
      ) : (
        groups.map((g) => {
          const online = g.items.filter((s) => isLive(s.last_seen_at)).length;
          const isCollapsed = !!collapsed[g.id];
          return (
            <section key={g.id} className="space-y-2.5">
              <header className="flex flex-wrap items-center gap-2 border-b border-border/30 pb-1.5">
                <button
                  className="flex items-center gap-1.5 text-sm font-semibold"
                  onClick={() => setCollapsed((c) => ({ ...c, [g.id]: !c[g.id] }))}
                  aria-expanded={!isCollapsed}
                >
                  <ChevronDown className={cn("h-4 w-4 transition-transform", isCollapsed && "-rotate-90")} />
                  {g.name}
                </button>
                <span className="text-xs text-muted-foreground">
                  {online} de {g.items.length} en línea
                </span>
                <div className="ml-auto flex items-center gap-1">
                  <Button size="sm" variant="ghost" className="gap-1.5 text-xs" onClick={() => selectGroup(g.items)}>
                    <CheckSquare className="h-3.5 w-3.5" /> Seleccionar todas
                  </Button>
                </div>
              </header>

              {!isCollapsed && (
                <TileGrid
                  items={g.items}
                  keyOf={(s) => s.id}
                  render={(s) => (
                    <ScreenTile
                      screen={s}
                      nowPlaying={nowPlaying.get(s.id)}
                      selected={selected.includes(s.id)}
                      selectionMode={selected.length > 0}
                      onToggle={toggleSelect}
                      onOpen={(id) => navigate(`/dashboard/pantallas/${id}`)}
                      onChangeContent={onChangeContent}
                    />
                  )}
                />
              )}
            </section>
          );
        })
      )}

      {selected.length > 0 && (
        <BulkActionsBar
          selectedIds={selected}
          locations={locations}
          onClear={() => setSelected([])}
          onDone={() => {
            setSelected([]);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}
