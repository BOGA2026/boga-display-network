import { useState, useCallback, useEffect, useMemo } from "react";
import {
  useBusinessId,
  useScreens,
  usePlaylists,
  useScheduleLayers,
  useScheduleBlocks,
  useUpsertBlock,
  useDeleteBlock,
  useCreateDefaultLayers,
  detectConflicts,
  type ScheduleBlock,
} from "@/hooks/useScheduleData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

import SimpleScheduleHeader from "@/components/schedule/SimpleScheduleHeader";
import BasicWeeklyCalendar from "@/components/schedule/BasicWeeklyCalendar";
import NowPlayingPreview from "@/components/schedule/NowPlayingPreview";
import PublishFooterBar from "@/components/schedule/PublishFooterBar";
import AddContentWizard from "@/components/schedule/AddContentWizard";
import ConflictAlertDialog from "@/components/schedule/ConflictAlertDialog";
import CopyToDaysDialog from "@/components/schedule/CopyToDaysDialog";

const Schedule = () => {
  const { data: businessId } = useBusinessId();
  const { data: screens = [] } = useScreens(businessId);
  const { data: playlists = [] } = usePlaylists(businessId);
  const { data: layers = [] } = useScheduleLayers(businessId);
  const createDefaultLayers = useCreateDefaultLayers();
  const upsertBlock = useUpsertBlock();
  const deleteBlock = useDeleteBlock();

  const [selectedScreenId, setSelectedScreenId] = useState<string>();
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showConflict, setShowConflict] = useState(false);
  const [scrollToTime, setScrollToTime] = useState<string | undefined>();

  const { data: blocks = [], refetch: refetchBlocks } = useScheduleBlocks(selectedScreenId);

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

  // Show conflict alert when new conflicts appear
  useEffect(() => {
    if (conflicts.size > 0 && hasChanges) {
      setShowConflict(true);
    }
  }, [conflicts.size]);

  const markDirty = () => {
    setHasChanges(true);
    setIsPublished(false);
  };

  // --- Handlers ---

  const handleCreateBlock = useCallback(
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
      upsertBlock.mutate(
        {
          business_id: businessId,
          screen_id: selectedScreenId,
          ...data,
          is_enabled: true,
        },
        {
          onSuccess: () => {
            toast({ title: "✓ Programación guardada", description: "El contenido se agregó correctamente." });
            markDirty();
            // Auto-scroll to the new block's start time
            setScrollToTime(data.start_time);
            // Reset after a short delay so re-creating at same time still triggers scroll
            setTimeout(() => setScrollToTime(undefined), 1000);
          },
        }
      );
    },
    [selectedScreenId, businessId, upsertBlock]
  );

  const handleMoveBlock = useCallback(
    (id: string, newStart: string, newEnd: string, _dayIndex: number) => {
      upsertBlock.mutate(
        {
          id,
          start_time: newStart.length === 5 ? newStart + ":00" : newStart,
          end_time: newEnd.length === 5 ? newEnd + ":00" : newEnd,
        },
        {
          onError: () => {
            toast({
              title: "No se pudo guardar el cambio",
              description: "Intenta de nuevo.",
              variant: "destructive",
            });
            refetchBlocks();
          },
        }
      );
      markDirty();
    },
    [upsertBlock, refetchBlocks]
  );

  const handleDeleteBlock = useCallback(
    (id: string) => {
      deleteBlock.mutate(id, {
        onSuccess: () => {
          toast({ title: "✓ Contenido eliminado" });
          markDirty();
        },
      });
      setSelectedBlockId(null);
    },
    [deleteBlock]
  );

  const handleReplace = useCallback(
    (keepId: string, removeId: string) => {
      deleteBlock.mutate(removeId, {
        onSuccess: () => {
          toast({ title: "✓ Se reemplazó el contenido anterior" });
          markDirty();
        },
      });
      setShowConflict(false);
    },
    [deleteBlock]
  );

  const handlePublish = useCallback(async () => {
    if (!selectedScreenId) return;
    setIsPublishing(true);
    try {
      const screen = screens.find((s) => s.id === selectedScreenId) as any;
      const { error } = await supabase
        .from("screens")
        .update({ schedule_version: (screen?.schedule_version || 0) + 1 })
        .eq("id", selectedScreenId);
      if (error) throw error;
      toast({ title: "✓ ¡Publicado!", description: "Los cambios ya están en tu pantalla." });
      setHasChanges(false);
      setIsPublished(true);
    } catch (e: any) {
      toast({
        title: "No se pudo publicar",
        description: "Intenta de nuevo en unos segundos.",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  }, [selectedScreenId, screens]);

  const handleUndo = useCallback(() => {
    refetchBlocks();
    setHasChanges(false);
    toast({ title: "Se restauró la última versión publicada" });
  }, [refetchBlocks]);

  const handleCopyToDays = useCallback(
    (sourceDayIndex: number, targetDays: number[]) => {
      if (!selectedScreenId || !businessId) return;
      const sourceBlocks = blocks.filter(
        (b) => b.days_of_week.includes(sourceDayIndex) && b.is_enabled
      );
      for (const block of sourceBlocks) {
        const newDays = [...new Set([...block.days_of_week, ...targetDays])];
        upsertBlock.mutate({ id: block.id, days_of_week: newDays });
      }
      toast({ title: "✓ Contenido copiado", description: `Se copió a ${targetDays.length} día${targetDays.length > 1 ? "s" : ""}.` });
      markDirty();
    },
    [blocks, selectedScreenId, businessId, upsertBlock]
  );

  const enabledBlocks = blocks.filter((b) => b.is_enabled);

  return (
    <div className="flex flex-col h-full gap-3 p-2">
      {/* Header */}
      <SimpleScheduleHeader
        screens={screens as any}
        selectedId={selectedScreenId}
        onSelect={setSelectedScreenId}
        isPublished={isPublished}
        onUndo={handleUndo}
        hasChanges={hasChanges}
      />

      {/* Main area */}
      <div className="flex flex-1 gap-3 min-h-0">
        {/* Calendar */}
        {selectedScreenId ? (
          <div className="flex-1 min-w-0">
            <BasicWeeklyCalendar
              blocks={blocks}
              layers={layers}
              selectedBlockId={selectedBlockId}
              onSelectBlock={setSelectedBlockId}
              onMoveBlock={handleMoveBlock}
              onDeleteBlock={handleDeleteBlock}
              conflicts={conflicts}
              scrollToTime={scrollToTime}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 rounded-2xl border border-border/40 bg-card/20 p-8">
            <div className="text-6xl">📺</div>
            <div>
              <h2 className="text-xl font-bold font-display">¡Bienvenido a la programación!</h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-md">
                Selecciona una pantalla arriba para empezar a programar el contenido que se mostrará.
              </p>
            </div>
          </div>
        )}

        {/* Now playing preview */}
        {selectedScreenId && (
          <NowPlayingPreview
            blocks={blocks}
            layers={layers}
            selectedBlockId={selectedBlockId}
          />
        )}
      </div>

      {/* Footer */}
      {selectedScreenId && (
        <PublishFooterBar
          onAddContent={() => setWizardOpen(true)}
          onCopyToDays={() => setCopyOpen(true)}
          onPublish={handlePublish}
          isPublishing={isPublishing}
          hasChanges={hasChanges}
          blockCount={enabledBlocks.length}
        />
      )}

      {/* Dialogs */}
      <AddContentWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        playlists={playlists}
        defaultLayerId={layers[0]?.id || ""}
        onCreateBlock={handleCreateBlock}
      />

      <CopyToDaysDialog
        open={copyOpen}
        onOpenChange={setCopyOpen}
        blocks={blocks}
        onCopy={handleCopyToDays}
      />

      <ConflictAlertDialog
        open={showConflict}
        onOpenChange={setShowConflict}
        blocks={blocks}
        layers={layers}
        conflicts={conflicts}
        onReplace={handleReplace}
        onDismiss={() => setShowConflict(false)}
      />
    </div>
  );
};

export default Schedule;
