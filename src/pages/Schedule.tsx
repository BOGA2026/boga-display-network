import { useState, useCallback, useEffect, useMemo } from "react";
import {
  useBusinessId,
  useScreens,
  usePlaylists,
  useScheduleLayers,
  useScheduleBlocks,
  useScheduleTemplates,
  useUpsertBlock,
  useDeleteBlock,
  useCreateDefaultLayers,
  detectConflicts,
  type ScheduleBlock,
  type ScheduleTemplate,
} from "@/hooks/useScheduleData";
import { supabase } from "@/integrations/supabase/client";
import ScreenSelector from "@/components/schedule/ScreenSelector";
import LayerTabs from "@/components/schedule/LayerTabs";
import WeeklyTimeline from "@/components/schedule/WeeklyTimeline";
import BlockEditor from "@/components/schedule/BlockEditor";
import ScheduleToolbar from "@/components/schedule/ScheduleToolbar";
import TemplatesDialog from "@/components/schedule/TemplatesDialog";
import { toast } from "@/hooks/use-toast";
import { AlertTriangle } from "lucide-react";

const Schedule = () => {
  const { data: businessId } = useBusinessId();
  const { data: screens = [] } = useScreens(businessId);
  const { data: playlists = [] } = usePlaylists(businessId);
  const { data: layers = [] } = useScheduleLayers(businessId);
  const { data: templates = [] } = useScheduleTemplates(businessId);
  const createDefaultLayers = useCreateDefaultLayers();
  const upsertBlock = useUpsertBlock();
  const deleteBlock = useDeleteBlock();

  const [selectedScreenId, setSelectedScreenId] = useState<string>();
  const [filterLayerId, setFilterLayerId] = useState<string | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(30);
  const [templatesOpen, setTemplatesOpen] = useState(false);

  const { data: blocks = [] } = useScheduleBlocks(selectedScreenId);

  // Auto-select first screen
  useEffect(() => {
    if (screens.length > 0 && !selectedScreenId) {
      setSelectedScreenId(screens[0].id);
    }
  }, [screens, selectedScreenId]);

  // Auto-create default layers
  useEffect(() => {
    if (businessId && layers.length === 0) {
      createDefaultLayers.mutate(businessId);
    }
  }, [businessId, layers.length]);

  const conflicts = useMemo(() => detectConflicts(blocks), [blocks]);
  const selectedBlock = blocks.find((b) => b.id === selectedBlockId);
  const conflictCount = conflicts.size;

  const handleAddBlock = useCallback(() => {
    if (!selectedScreenId || !businessId || layers.length === 0 || playlists.length === 0) {
      toast({
        title: "Faltan datos",
        description: "Necesitas al menos una pantalla, playlist y capa para crear un bloque.",
        variant: "destructive",
      });
      return;
    }
    upsertBlock.mutate({
      business_id: businessId,
      screen_id: selectedScreenId,
      layer_id: layers[0].id,
      playlist_id: playlists[0].id,
      name: "Nuevo bloque",
      start_time: "09:00:00",
      end_time: "10:00:00",
      days_of_week: [1, 2, 3, 4, 5],
      is_enabled: true,
      recurrence: "weekly",
    });
  }, [selectedScreenId, businessId, layers, playlists, upsertBlock]);

  const handleApplyPreset = useCallback(
    (start: string, end: string, label: string) => {
      if (!selectedScreenId || !businessId || layers.length === 0 || playlists.length === 0) return;
      upsertBlock.mutate({
        business_id: businessId,
        screen_id: selectedScreenId,
        layer_id: layers[0].id,
        playlist_id: playlists[0].id,
        name: label,
        start_time: start + ":00",
        end_time: end + ":00",
        days_of_week: [1, 2, 3, 4, 5, 6, 0],
        is_enabled: true,
        recurrence: "weekly",
      });
    },
    [selectedScreenId, businessId, layers, playlists, upsertBlock]
  );

  const handleMoveBlock = useCallback(
    (id: string, newStart: string, newEnd: string, _dayIndex: number) => {
      upsertBlock.mutate({
        id,
        start_time: newStart.length === 5 ? newStart + ":00" : newStart,
        end_time: newEnd.length === 5 ? newEnd + ":00" : newEnd,
      });
    },
    [upsertBlock]
  );

  const handleSaveBlock = useCallback(
    (updated: Partial<ScheduleBlock>) => {
      upsertBlock.mutate(updated);
    },
    [upsertBlock]
  );

  const handleDuplicateBlock = useCallback(
    (block: ScheduleBlock) => {
      const { id, playlist, layer, created_at, updated_at, ...rest } = block as any;
      upsertBlock.mutate({ ...rest, name: `${block.name} (copia)` });
    },
    [upsertBlock]
  );

  const handleDeleteBlock = useCallback(
    (id: string) => {
      deleteBlock.mutate(id);
      setSelectedBlockId(null);
    },
    [deleteBlock]
  );

  const handleSaveTemplate = useCallback(
    async (name: string) => {
      if (!businessId) return;
      const definition = blocks.map(({ id, playlist, layer, ...rest }) => rest);
      const { error } = await supabase.from("schedule_templates").insert({
        business_id: businessId,
        name,
        json_definition: definition,
      });
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Plantilla guardada" });
      }
    },
    [businessId, blocks]
  );

  const handleApplyTemplate = useCallback(
    async (template: ScheduleTemplate) => {
      if (!selectedScreenId || !businessId) return;
      const def = template.json_definition as any[];
      for (const block of def) {
        await supabase.from("schedule_blocks").insert({
          ...block,
          business_id: businessId,
          screen_id: selectedScreenId,
        });
      }
      toast({ title: "Plantilla aplicada" });
      setTemplatesOpen(false);
    },
    [selectedScreenId, businessId]
  );

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col gap-4 min-w-0 p-1">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-2xl font-bold">Programación</h1>
            <p className="text-sm text-muted-foreground">Control de contenido por pantalla</p>
          </div>
          <ScreenSelector
            screens={screens as any}
            selectedId={selectedScreenId}
            onSelect={setSelectedScreenId}
          />
        </div>

        {/* Layer tabs + conflicts */}
        <div className="flex items-center gap-3 flex-wrap">
          <LayerTabs layers={layers} activeLayerId={filterLayerId} onSelect={setFilterLayerId} />
          {conflictCount > 0 && (
            <div className="flex items-center gap-1.5 text-yellow-400 text-xs font-medium ml-auto">
              <AlertTriangle className="h-3.5 w-3.5" />
              {conflictCount} conflicto{conflictCount > 1 ? "s" : ""}
            </div>
          )}
        </div>

        {/* Toolbar */}
        <ScheduleToolbar
          zoom={zoom}
          onZoomChange={setZoom}
          onAddBlock={handleAddBlock}
          onApplyPreset={handleApplyPreset}
          onOpenTemplates={() => setTemplatesOpen(true)}
        />

        {/* Timeline */}
        {selectedScreenId ? (
          <WeeklyTimeline
            blocks={blocks}
            layers={layers}
            filterLayerId={filterLayerId}
            zoom={zoom}
            selectedBlockId={selectedBlockId}
            onSelectBlock={setSelectedBlockId}
            onMoveBlock={handleMoveBlock}
            conflicts={conflicts}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Selecciona una pantalla para ver su programación.
          </div>
        )}

        <TemplatesDialog
          open={templatesOpen}
          onOpenChange={setTemplatesOpen}
          templates={templates}
          onApply={handleApplyTemplate}
          onSaveCurrent={handleSaveTemplate}
        />
      </div>

      {/* Right panel */}
      {selectedBlock && (
        <BlockEditor
          block={selectedBlock}
          layers={layers}
          playlists={playlists}
          onSave={handleSaveBlock}
          onDuplicate={handleDuplicateBlock}
          onDelete={handleDeleteBlock}
          onClose={() => setSelectedBlockId(null)}
        />
      )}
    </div>
  );
};

export default Schedule;
