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
import { toast } from "@/hooks/use-toast";
import { AlertTriangle } from "lucide-react";

import ScheduleHeader from "@/components/schedule/ScheduleHeader";
import ContentLibrarySidebar from "@/components/schedule/ContentLibrarySidebar";
import WeeklyCalendarGrid from "@/components/schedule/WeeklyCalendarGrid";
import BlockDetailsDrawer from "@/components/schedule/BlockDetailsDrawer";
import ConflictResolverModal from "@/components/schedule/ConflictResolverModal";
import NewBlockWizard from "@/components/schedule/NewBlockWizard";
import TemplatesDialog from "@/components/schedule/TemplatesDialog";

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
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [conflictsOpen, setConflictsOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [hasUnpublished, setHasUnpublished] = useState(false);

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

  // Mark unpublished on any mutation
  useEffect(() => {
    if (blocks.length > 0) setHasUnpublished(false);
  }, [blocks]);

  const markDirty = () => setHasUnpublished(true);

  const handleAddBlock = useCallback(() => {
    if (!selectedScreenId || !businessId || layers.length === 0 || playlists.length === 0) {
      toast({
        title: "Faltan datos",
        description: "Necesitas al menos una pantalla, playlist y capa.",
        variant: "destructive",
      });
      return;
    }
    setWizardOpen(true);
  }, [selectedScreenId, businessId, layers, playlists]);

  const handleCreateFromWizard = useCallback(
    (data: {
      name: string;
      playlist_id: string;
      layer_id: string;
      start_time: string;
      end_time: string;
      days_of_week: number[];
      recurrence: string;
    }) => {
      if (!selectedScreenId || !businessId) return;
      upsertBlock.mutate({
        business_id: businessId,
        screen_id: selectedScreenId,
        ...data,
        is_enabled: true,
      });
      markDirty();
    },
    [selectedScreenId, businessId, upsertBlock]
  );

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
      markDirty();
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
      markDirty();
    },
    [upsertBlock]
  );

  const handleSaveBlock = useCallback(
    (updated: Partial<ScheduleBlock>) => {
      upsertBlock.mutate(updated);
      markDirty();
    },
    [upsertBlock]
  );

  const handleDuplicateBlock = useCallback(
    (block: ScheduleBlock) => {
      const { id, playlist, layer, created_at, updated_at, ...rest } = block as any;
      upsertBlock.mutate({ ...rest, name: `${block.name} (copia)` });
      markDirty();
    },
    [upsertBlock]
  );

  const handleDeleteBlock = useCallback(
    (id: string) => {
      deleteBlock.mutate(id);
      setSelectedBlockId(null);
      markDirty();
    },
    [deleteBlock]
  );

  const handleDisableBlock = useCallback(
    (id: string) => {
      upsertBlock.mutate({ id, is_enabled: false });
      markDirty();
    },
    [upsertBlock]
  );

  const handlePublish = useCallback(async () => {
    if (!selectedScreenId) return;
    // Increment schedule_version to signal devices
    const { error } = await supabase
      .from("screens")
      .update({ schedule_version: (screens.find(s => s.id === selectedScreenId) as any)?.schedule_version + 1 || 1 })
      .eq("id", selectedScreenId);
    if (error) {
      toast({ title: "Error al publicar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "¡Publicado!", description: "Los cambios se sincronizarán con el dispositivo." });
      setHasUnpublished(false);
    }
  }, [selectedScreenId, screens]);

  const handleSaveDraft = useCallback(() => {
    toast({ title: "Borrador guardado", description: "Los cambios se guardaron sin publicar." });
  }, []);

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
      markDirty();
    },
    [selectedScreenId, businessId]
  );

  return (
    <div className="flex flex-col h-full gap-2 p-1">
      {/* Header */}
      <ScheduleHeader
        screens={screens as any}
        selectedId={selectedScreenId}
        onSelect={setSelectedScreenId}
        hasUnpublished={hasUnpublished}
        onPublish={handlePublish}
        onSaveDraft={handleSaveDraft}
        isPublishing={false}
        isSaving={false}
      />

      {/* Conflict bar */}
      {conflictCount > 0 && (
        <button
          onClick={() => setConflictsOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium hover:bg-amber-500/15 transition-colors"
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          {conflictCount} conflicto{conflictCount > 1 ? "s" : ""} detectado{conflictCount > 1 ? "s" : ""}
          <span className="text-amber-400/60 ml-1">— Clic para resolver</span>
        </button>
      )}

      {/* Main content */}
      <div className="flex flex-1 gap-2 min-h-0">
        {/* Sidebar */}
        <ContentLibrarySidebar
          blocks={blocks}
          layers={layers}
          templates={templates}
          filterLayerId={filterLayerId}
          onFilterLayer={setFilterLayerId}
          selectedBlockId={selectedBlockId}
          onSelectBlock={setSelectedBlockId}
          onAddBlock={handleAddBlock}
          onApplyPreset={handleApplyPreset}
          onApplyTemplate={handleApplyTemplate}
          conflicts={conflicts}
        />

        {/* Calendar Grid */}
        {selectedScreenId ? (
          <WeeklyCalendarGrid
            blocks={blocks}
            layers={layers}
            filterLayerId={filterLayerId}
            selectedBlockId={selectedBlockId}
            onSelectBlock={setSelectedBlockId}
            onMoveBlock={handleMoveBlock}
            conflicts={conflicts}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm rounded-xl border border-border/40 bg-card/20">
            Selecciona una pantalla para ver su programación.
          </div>
        )}

        {/* Detail drawer */}
        {selectedBlock && (
          <BlockDetailsDrawer
            block={selectedBlock}
            layers={layers}
            playlists={playlists}
            onSave={handleSaveBlock}
            onDuplicate={handleDuplicateBlock}
            onDelete={handleDeleteBlock}
            onClose={() => setSelectedBlockId(null)}
            isSaving={upsertBlock.isPending}
            hasConflict={conflicts.has(selectedBlock.id)}
          />
        )}
      </div>

      {/* Dialogs */}
      <NewBlockWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        layers={layers}
        playlists={playlists}
        onCreateBlock={handleCreateFromWizard}
      />

      <ConflictResolverModal
        open={conflictsOpen}
        onOpenChange={setConflictsOpen}
        blocks={blocks}
        layers={layers}
        conflicts={conflicts}
        onSelectBlock={(id) => {
          setSelectedBlockId(id);
          setConflictsOpen(false);
        }}
        onDisableBlock={handleDisableBlock}
      />

      <TemplatesDialog
        open={templatesOpen}
        onOpenChange={setTemplatesOpen}
        templates={templates}
        onApply={handleApplyTemplate}
        onSaveCurrent={handleSaveTemplate}
      />
    </div>
  );
};

export default Schedule;
