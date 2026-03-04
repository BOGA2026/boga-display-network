import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface ScheduleLayer {
  id: string;
  business_id: string;
  name: string;
  priority: number;
  color: string;
}

export interface ScheduleBlock {
  id: string;
  business_id: string;
  screen_id: string;
  layer_id: string;
  playlist_id: string;
  name: string;
  start_time: string; // HH:MM:SS
  end_time: string;
  days_of_week: number[];
  start_date: string | null;
  end_date: string | null;
  is_enabled: boolean;
  recurrence: string | null;
  playlist?: { id: string; name: string };
  layer?: ScheduleLayer;
}

export interface ScheduleTemplate {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  json_definition: any;
}

export function useBusinessId() {
  return useQuery({
    queryKey: ["user-business-id"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_user_business_id");
      if (error) throw error;
      return data as string;
    },
  });
}

export function useScreens(businessId: string | undefined) {
  return useQuery({
    queryKey: ["screens-for-schedule", businessId],
    enabled: !!businessId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("screens")
        .select("id, name, status, location_id, locations(name)")
        .order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function usePlaylists(businessId: string | undefined) {
  return useQuery({
    queryKey: ["playlists-for-schedule", businessId],
    enabled: !!businessId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("playlists")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useScheduleLayers(businessId: string | undefined) {
  return useQuery({
    queryKey: ["schedule-layers", businessId],
    enabled: !!businessId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schedule_layers")
        .select("*")
        .order("priority", { ascending: true });
      if (error) throw error;
      return (data || []) as ScheduleLayer[];
    },
  });
}

export function useScheduleBlocks(screenId: string | undefined) {
  return useQuery({
    queryKey: ["schedule-blocks", screenId],
    enabled: !!screenId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schedule_blocks")
        .select("*, playlists(id, name), schedule_layers(id, name, priority, color)")
        .eq("screen_id", screenId)
        .order("start_time");
      if (error) throw error;
      const mapped = (data || []).map((b: any) => ({
        ...b,
        playlist: b.playlists,
        layer: b.schedule_layers,
      })) as ScheduleBlock[];
      return mapped;
    },
  });
}

export function useScheduleTemplates(businessId: string | undefined) {
  return useQuery({
    queryKey: ["schedule-templates", businessId],
    enabled: !!businessId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schedule_templates")
        .select("*")
        .order("name");
      if (error) throw error;
      return (data || []) as ScheduleTemplate[];
    },
  });
}

export function useUpsertBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (block: Partial<ScheduleBlock> & { id?: string }) => {
      const { playlist, layer, ...rest } = block as any;
      if (rest.id) {
        const { error } = await supabase.from("schedule_blocks").update(rest).eq("id", rest.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("schedule_blocks").insert(rest);
        if (error) throw error;
      }
      // Increment screen schedule_version
      if (rest.screen_id) {
        await supabase.rpc("get_user_business_id"); // just to keep session alive
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["schedule-blocks"] });
      toast({ title: "Bloque guardado" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });
}

export function useDeleteBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("schedule_blocks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["schedule-blocks"] });
      toast({ title: "Bloque eliminado" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });
}

export function useCreateDefaultLayers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (businessId: string) => {
      const layers = [
        { business_id: businessId, name: "Diario", priority: 0, color: "#8A00FF" },
        { business_id: businessId, name: "FDS", priority: 1, color: "#C000FF" },
        { business_id: businessId, name: "Eventos", priority: 2, color: "#FF6B00" },
        { business_id: businessId, name: "Emergencia", priority: 3, color: "#FF0040" },
      ];
      const { error } = await supabase.from("schedule_layers").insert(layers);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["schedule-layers"] });
    },
  });
}

// Conflict detection
export function detectConflicts(blocks: ScheduleBlock[]): Map<string, string[]> {
  const conflicts = new Map<string, string[]>();

  for (let i = 0; i < blocks.length; i++) {
    for (let j = i + 1; j < blocks.length; j++) {
      const a = blocks[i];
      const b = blocks[j];
      if (a.layer_id !== b.layer_id || !a.is_enabled || !b.is_enabled) continue;

      const sharedDays = a.days_of_week.filter((d) => b.days_of_week.includes(d));
      if (sharedDays.length === 0) continue;

      if (a.start_time < b.end_time && b.start_time < a.end_time) {
        const existing = conflicts.get(a.id) || [];
        existing.push(b.id);
        conflicts.set(a.id, existing);
        const existing2 = conflicts.get(b.id) || [];
        existing2.push(a.id);
        conflicts.set(b.id, existing2);
      }
    }
  }
  return conflicts;
}

// Presets
export const PRESETS = [
  { label: "Desayuno", start: "07:00", end: "11:00" },
  { label: "Almuerzo", start: "12:00", end: "15:00" },
  { label: "Tarde", start: "15:00", end: "18:00" },
  { label: "Noche", start: "18:00", end: "23:00" },
];
