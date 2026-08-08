import { Save, BookmarkPlus, Loader2 } from "lucide-react";
import { preloadCapture } from "@/components/system/DeferredMount";
import { EditorSaveStatus } from "@/components/editor/EditorSaveStatus";
import simboloVisualia from "@/assets/simbolo-visualia.webp";

type EditorTopBarProps = {
  contentName: string;
  onSaveContent: () => Promise<void>;
  onSavePreset: () => Promise<void>;
  saving: boolean;
  /** true mientras html2canvas baja y renderiza la miniatura. */
  capturing?: boolean;
  lastSavedAt?: number | null;
  dirty?: boolean;
};

export function EditorTopBar({
  contentName,
  onSaveContent,
  onSavePreset,
  saving,
  capturing = false,
  lastSavedAt = null,
  dirty = true,
}: EditorTopBarProps) {
  const busy = saving || capturing;
  return (
    <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="inline-flex shrink-0 items-center gap-2" aria-label="Visualia">
          <img
            src={simboloVisualia}
            alt=""
            aria-hidden
            width={24}
            height={24}
            style={{ height: 24, width: "auto" }}
            className="shrink-0"
          />
          <span
            className="font-display font-semibold uppercase leading-none text-foreground"
            style={{ fontSize: 13, letterSpacing: "0.06em" }}
          >
            Visualia
          </span>
        </span>
        <span aria-hidden className="h-4 w-px shrink-0 bg-border" />
        <div className="truncate text-sm text-muted-foreground">
          Editor de plantillas <span aria-hidden>›</span> {contentName}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <EditorSaveStatus saving={busy} lastSavedAt={lastSavedAt} dirty={dirty} />
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
