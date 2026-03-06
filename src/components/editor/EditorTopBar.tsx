import { Save, BookmarkPlus } from "lucide-react";

type EditorTopBarProps = {
  contentName: string;
  onSaveContent: () => Promise<void>;
  onSavePreset: () => Promise<void>;
  saving: boolean;
};

export function EditorTopBar({ contentName, onSaveContent, onSavePreset, saving }: EditorTopBarProps) {
  return (
    <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
      <div className="text-sm text-muted-foreground">
        Editor de plantillas &gt; {contentName}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onSavePreset}
          disabled={saving}
          className="flex items-center gap-1.5 rounded border border-border px-3 py-1.5 text-sm hover:bg-accent disabled:opacity-50 transition-colors"
        >
          <BookmarkPlus className="h-4 w-4" /> Save preset
        </button>
        <button
          onClick={onSaveContent}
          disabled={saving}
          className="flex items-center gap-1.5 rounded bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          <Save className="h-4 w-4" /> Guardar
        </button>
      </div>
    </div>
  );
}
