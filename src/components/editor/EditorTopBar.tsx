import { Save, BookmarkPlus, Loader2 } from "lucide-react";
import { preloadCapture } from "@/components/system/DeferredMount";

type EditorTopBarProps = {
  contentName: string;
  onSaveContent: () => Promise<void>;
  onSavePreset: () => Promise<void>;
  saving: boolean;
  /** true mientras html2canvas baja y renderiza la miniatura. */
  capturing?: boolean;
};

export function EditorTopBar({ contentName, onSaveContent, onSavePreset, saving, capturing = false }: EditorTopBarProps) {
  const busy = saving || capturing;
  return (
    <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
      <div className="text-sm text-muted-foreground">
        Editor de plantillas &gt; {contentName}
      </div>
      <div className="flex items-center gap-2">
        <button
          {...preloadCapture()}
          onClick={onSavePreset}
          disabled={busy}
          className="flex items-center gap-1.5 rounded border border-border px-3 py-1.5 text-sm hover:bg-accent disabled:opacity-50 transition-colors"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookmarkPlus className="h-4 w-4" />}
          Guardar preset
        </button>
        <button
          {...preloadCapture()}
          onClick={onSaveContent}
          disabled={busy}
          className="flex items-center gap-1.5 rounded bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {capturing ? "Generando vista previa…" : saving ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </div>
  );
}
