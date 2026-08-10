import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Pause, Play, Volume2, VolumeX, PenTool, AlertTriangle, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatBytes, formatDuration, type MediaDims } from "@/components/content/mediaMeta";

export interface PreviewItem {
  id: string;
  name: string;
  type: string;
  file_url: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  file_size_bytes?: number | null;
  width?: number | null;
  height?: number | null;
}

type FrameOrientation = "horizontal" | "vertical";

interface ScreenOption {
  id: string;
  name: string;
  rotation: number | null;
  location_name: string | null;
}

interface PlaylistInfo {
  items: number;
  totalSeconds: number;
}

/** Resolución nominal del marco según su orientación. */
function frameResolution(o: FrameOrientation) {
  return o === "horizontal" ? { width: 1920, height: 1080 } : { width: 1080, height: 1920 };
}

function orientationOfDims(d: MediaDims | null): FrameOrientation | null {
  if (!d?.width || !d?.height) return null;
  return d.width >= d.height ? "horizontal" : "vertical";
}

/** Tiempo transcurrido en reloj: "0:07". */
function clock(seconds: number) {
  const t = Math.max(0, Math.floor(seconds));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
}

/**
 * Simulación de un display comercial montado en pared. No hay controles
 * nativos: en una pantalla real no existe barra de progreso ni botón de play.
 */
export default function ScreenPreviewFrame({ item }: { item: PreviewItem }) {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);

  const reducedMotion = useMemo(
    () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  const dims: MediaDims | null =
    item.width && item.height ? { width: item.width, height: item.height } : null;
  const contentOrientation = orientationOfDims(dims);

  const [frame, setFrame] = useState<FrameOrientation>(contentOrientation ?? "horizontal");
  const [screens, setScreens] = useState<ScreenOption[]>([]);
  const [screenId, setScreenId] = useState<string>("");
  const [playlist, setPlaylist] = useState<PlaylistInfo | null>(null);

  const [playing, setPlaying] = useState(!reducedMotion);
  const [muted, setMuted] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(item.duration_seconds ?? 0);
  const [ready, setReady] = useState(false);
  const [slow, setSlow] = useState(false);

  const isVideo = item.type === "video" && !!item.file_url;

  useEffect(() => {
    setFrame(contentOrientation ?? "horizontal");
  }, [contentOrientation]);

  /* Pantallas del negocio, para "así se verá en …". */
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from("screens")
        .select("id, name, rotation, locations(name)")
        .is("deleted_at", null)
        .order("name");
      if (!alive) return;
      setScreens(
        ((data as any[]) ?? []).map((s) => ({
          id: s.id,
          name: s.name,
          rotation: s.rotation ?? 0,
          location_name: s.locations?.name ?? null,
        })),
      );
    })();
    return () => {
      alive = false;
    };
  }, []);

  /* Cuántas veces por hora se repite dentro de la lista donde está asignada. */
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: rows } = await supabase
        .from("playlist_items")
        .select("playlist_id")
        .eq("content_id", item.id)
        .limit(1);
      const pid = (rows as any[])?.[0]?.playlist_id;
      if (!pid) return;
      const { data: items } = await supabase
        .from("playlist_items")
        .select("duration_seconds")
        .eq("playlist_id", pid);
      if (!alive || !items) return;
      const total = (items as any[]).reduce((acc, r) => acc + (r.duration_seconds || 0), 0);
      setPlaylist({ items: items.length, totalSeconds: total });
    })();
    return () => {
      alive = false;
    };
  }, [item.id]);

  /* Si el archivo tarda, el marco muestra la miniatura con indicador — nunca negro y vacío. */
  useEffect(() => {
    if (!isVideo) return;
    const t = window.setTimeout(() => setSlow(true), 2000);
    return () => window.clearTimeout(t);
  }, [isVideo]);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      void v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  }, []);

  const selectedScreen = screens.find((s) => s.id === screenId) ?? null;
  const screenOrientation: FrameOrientation | null = selectedScreen
    ? Math.abs(selectedScreen.rotation ?? 0) % 180 === 90
      ? "vertical"
      : "horizontal"
    : null;

  const res = frameResolution(frame);
  const frameRatio = res.width / res.height;
  const contentRatio = dims ? dims.width / dims.height : frameRatio;
  const mismatch = !!contentOrientation && contentOrientation !== frame;
  /** Fracción real del ancho del marco que ocupa la pieza (letterbox lateral). */
  const widthPct = Math.round(Math.min(1, contentRatio / frameRatio) * 100);

  const title = selectedScreen
    ? `Así se verá en ${selectedScreen.name}${selectedScreen.location_name ? ` · ${selectedScreen.location_name}` : ""}`
    : "Así se verá en el local";

  const poster = item.thumbnail_url ?? undefined;
  const showPoster = isVideo && (!ready || (reducedMotion && !playing));

  const metaRow = [
    dims ? `${dims.width} × ${dims.height}` : null,
    contentOrientation === "vertical" ? "Vertical" : contentOrientation ? "Horizontal" : null,
    formatDuration(duration || item.duration_seconds),
    item.file_size_bytes ? formatBytes(item.file_size_bytes) : null,
  ].filter(Boolean);

  const repeatsPerHour =
    playlist && playlist.totalSeconds > 0 ? Math.round(3600 / playlist.totalSeconds) : null;

  return (
    <div className="space-y-4">
      {/* ── Orientación del marco ─────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <div
          role="radiogroup"
          aria-label="Orientación de la pantalla"
          className="inline-flex rounded-lg border border-border/40 bg-muted/20 p-0.5"
        >
          {(["horizontal", "vertical"] as const).map((o) => (
            <button
              key={o}
              role="radio"
              aria-checked={frame === o}
              onClick={() => {
                setFrame(o);
                setScreenId("");
              }}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                frame === o ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {o === "horizontal" ? "Horizontal (16:9)" : "Vertical (9:16)"}
            </button>
          ))}
        </div>

        {screens.length > 0 && (
          <Select
            value={screenId}
            onValueChange={(v) => {
              setScreenId(v);
              const s = screens.find((x) => x.id === v);
              if (s) setFrame(Math.abs(s.rotation ?? 0) % 180 === 90 ? "vertical" : "horizontal");
            }}
          >
            <SelectTrigger className="h-9 w-[230px] text-xs" aria-label="Ver en una pantalla real">
              <SelectValue placeholder="Ver en una pantalla real" />
            </SelectTrigger>
            <SelectContent>
              {screens.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                  {s.location_name ? ` · ${s.location_name}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <p className="text-xs font-medium text-muted-foreground">{title}</p>

      {/* ── El display ────────────────────────────────────────── */}
      <div className="flex justify-center">
        <div
          role="img"
          aria-label={`Simulación de ${item.name} en una pantalla ${frame === "horizontal" ? "horizontal de 1920 por 1080" : "vertical de 1080 por 1920"} montada en pared${
            mismatch ? `. La pieza ocupa el ${widthPct}% del ancho y quedan franjas negras a los lados` : ""
          }`}
          className="relative rounded-[4px] bg-[#0b0b0c] pt-[10px] pr-[10px] pl-[10px] pb-[14px] shadow-[0_18px_40px_-18px_rgba(0,0,0,0.85)]"
          style={{ width: frame === "horizontal" ? "min(100%, 640px)" : "min(100%, 300px)" }}
        >
          {/* Reflejo del canto: hace que el bisel se lea como objeto físico */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-[9px] bottom-[13px] rounded-[3px] ring-1 ring-[rgba(255,255,255,0.06)]"
          />
          <div
            className="relative overflow-hidden rounded-[2px] bg-black"
            style={{ aspectRatio: `${res.width} / ${res.height}` }}
          >
            {isVideo ? (
              <>
                <video
                  ref={videoRef}
                  src={item.file_url ?? undefined}
                  poster={poster}
                  preload="metadata"
                  autoPlay={!reducedMotion}
                  muted={muted}
                  loop
                  playsInline
                  className="h-full w-full object-contain"
                  onLoadedMetadata={(e) => {
                    const v = e.currentTarget;
                    setDuration(v.duration || item.duration_seconds || 0);
                  }}
                  onLoadedData={() => {
                    setReady(true);
                    setSlow(false);
                    if (!reducedMotion) void videoRef.current?.play().catch(() => setPlaying(false));
                  }}
                  onTimeUpdate={(e) => setElapsed(e.currentTarget.currentTime)}
                  onPlay={() => setPlaying(true)}
                  onPause={() => setPlaying(false)}
                />
                {showPoster && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black">
                    {poster ? (
                      <img src={poster} alt="" className="h-full w-full object-contain opacity-80" />
                    ) : null}
                    {slow && !ready && (
                      <Loader2 className="absolute h-6 w-6 animate-spin text-white/70" aria-label="Cargando" />
                    )}
                    {reducedMotion && ready && (
                      <Button
                        size="icon"
                        variant="secondary"
                        aria-label="Reproducir"
                        className="absolute h-11 w-11 rounded-full"
                        onClick={togglePlay}
                      >
                        <Play className="h-5 w-5" />
                      </Button>
                    )}
                  </div>
                )}
              </>
            ) : item.thumbnail_url || item.file_url ? (
              <img
                src={item.thumbnail_url ?? item.file_url ?? ""}
                alt={item.name}
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <ImageIcon className="h-8 w-8 text-white/20" />
              </div>
            )}
          </div>
          {/* LED de estado, apagado */}
          <span
            aria-hidden
            className="absolute bottom-[5px] left-1/2 h-[3px] w-[3px] -translate-x-1/2 rounded-full bg-white/15"
          />
        </div>
      </div>

      {/* ── Controles fuera del marco ─────────────────────────── */}
      {isVideo && (
        <div className="mx-auto max-w-[640px] space-y-2">
          <div className="h-[3px] w-full overflow-hidden rounded-full bg-muted/40">
            <div
              className="h-full bg-primary/70 transition-[width] duration-200"
              style={{ width: duration ? `${Math.min(100, (elapsed / duration) * 100)}%` : "0%" }}
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              aria-label={playing ? "Pausar" : "Reproducir"}
              onClick={togglePlay}
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              aria-label={muted ? "Activar sonido" : "Silenciar"}
              onClick={() => {
                const v = videoRef.current;
                if (v) v.muted = !muted;
                setMuted((m) => !m);
              }}
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <span className="tabular-nums">
              {clock(elapsed)} / {clock(duration)}
            </span>
          </div>
        </div>
      )}

      {/* ── Aviso de orientación ──────────────────────────────── */}
      {mismatch && (
        <div className="flex flex-col gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex gap-2 text-xs leading-relaxed text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Esta pieza es {contentOrientation === "vertical" ? "vertical" : "horizontal"}. En una pantalla{" "}
              {frame} ocupará el {widthPct}% del ancho y quedarán franjas negras a los lados. Se ve mejor en una
              pantalla montada en {contentOrientation}, o podés crear una versión {frame} en el editor.
            </span>
          </p>
          <Button
            size="sm"
            variant="secondary"
            className="shrink-0 gap-1.5"
            onClick={() => navigate(`/dashboard/n?adaptVideo=${item.id}&orientation=${frame}`)}
          >
            <PenTool className="h-4 w-4" /> Adaptar en el editor
          </Button>
        </div>
      )}

      {/* ── Datos bajo el marco ───────────────────────────────── */}
      <p className="text-xs text-muted-foreground">
        {metaRow.join(" · ")}
        {repeatsPerHour && playlist
          ? ` · se repite ${repeatsPerHour} ${repeatsPerHour === 1 ? "vez" : "veces"} por hora en una lista de ${playlist.items} ${playlist.items === 1 ? "pieza" : "piezas"}`
          : ""}
      </p>
    </div>
  );
}
