import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { storageThumb } from "@/lib/storageImage";
import {
  DEFAULT_TIMEZONE,
  nowLocalDayIndex,
  nowLocalTime,
} from "@/lib/businessTime";

/**
 * Qué está mostrando cada pantalla AHORA.
 *
 * El reproductor todavía no sube capturas, así que se deriva de la
 * programación vigente (bloque activo en la hora local del negocio) y, si no
 * hay bloque, de la lista asignada. Es aproximado, pero es lo que un operador
 * de cadena necesita ver de un vistazo.
 */
export interface NowPlayingInfo {
  /** Miniatura de 320 px servida por el transformador de Storage. */
  thumb?: string;
  /** Nombre de la lista o de la pieza. */
  label: string;
  /** De dónde salió: programación vigente o lista fija. */
  source: "programado" | "asignado";
}

interface PlaylistPreview {
  name: string;
  thumb?: string;
  itemName?: string;
}

interface NowPlayingData {
  blocks: Array<{
    screen_id: string;
    playlist_id: string;
    start_time: string;
    end_time: string;
    days_of_week: number[];
  }>;
  schedules: Array<{ screen_id: string; playlist_id: string }>;
  playlists: Map<string, PlaylistPreview>;
}

async function fetchNowPlaying(): Promise<NowPlayingData> {
  const [blocksRes, schedulesRes, itemsRes, playlistsRes] = await Promise.all([
    supabase
      .from("schedule_blocks")
      .select("screen_id, playlist_id, start_time, end_time, days_of_week")
      .eq("is_enabled", true),
    supabase.from("schedules").select("screen_id, playlist_id").eq("is_active", true),
    supabase
      .from("playlist_items")
      .select("playlist_id, sort_order, content:content_id(name, thumbnail_url, file_url, type)")
      .order("sort_order", { ascending: true }),
    supabase.from("playlists").select("id, name"),
  ]);

  const playlists = new Map<string, PlaylistPreview>();
  for (const p of playlistsRes.data ?? []) {
    playlists.set(p.id, { name: p.name });
  }
  for (const item of (itemsRes.data ?? []) as any[]) {
    const entry = playlists.get(item.playlist_id);
    if (!entry || entry.thumb || entry.itemName) continue;
    const content = item.content;
    if (!content) continue;
    const raw =
      content.thumbnail_url || (content.type === "image" ? content.file_url : null);
    entry.thumb = storageThumb(raw, { width: 320 }) ?? undefined;
    entry.itemName = content.name;
  }

  return {
    blocks: (blocksRes.data ?? []) as NowPlayingData["blocks"],
    schedules: (schedulesRes.data ?? []) as NowPlayingData["schedules"],
    playlists,
  };
}

export function useNowPlaying(timezone: string = DEFAULT_TIMEZONE) {
  const query = useQuery({
    queryKey: ["screens-now-playing"],
    queryFn: fetchNowPlaying,
    staleTime: 60_000,
  });

  const map = new Map<string, NowPlayingInfo>();
  if (query.data) {
    const day = nowLocalDayIndex(timezone);
    const now = nowLocalTime(timezone);

    for (const b of query.data.blocks) {
      if (!b.days_of_week?.includes(day)) continue;
      if (!(b.start_time.slice(0, 5) <= now && b.end_time.slice(0, 5) > now)) continue;
      if (map.has(b.screen_id)) continue;
      const pl = query.data.playlists.get(b.playlist_id);
      map.set(b.screen_id, {
        thumb: pl?.thumb,
        label: pl?.name ?? "Programación vigente",
        source: "programado",
      });
    }

    for (const s of query.data.schedules) {
      if (map.has(s.screen_id)) continue;
      const pl = query.data.playlists.get(s.playlist_id);
      if (!pl) continue;
      map.set(s.screen_id, { thumb: pl.thumb, label: pl.name, source: "asignado" });
    }
  }

  return { nowPlaying: map, isLoading: query.isLoading };
}
