import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Plus } from "lucide-react";
import type { ScheduleTemplate } from "@/hooks/useScheduleData";
import { useState } from "react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  templates: ScheduleTemplate[];
  onApply: (template: ScheduleTemplate) => void;
  onSaveCurrent: (name: string) => void;
}

const TemplatesDialog = ({ open, onOpenChange, templates, onApply, onSaveCurrent }: Props) => {
  const [newName, setNewName] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Plantillas de programación</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Save current */}
          <div className="flex gap-2">
            <Input
              placeholder="Nombre de la plantilla…"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="h-8 text-sm bg-secondary border-border"
            />
            <Button
              size="sm"
              className="gradient-primary text-primary-foreground shrink-0"
              onClick={() => {
                if (newName.trim()) {
                  onSaveCurrent(newName.trim());
                  setNewName("");
                }
              }}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Guardar actual
            </Button>
          </div>

          {/* List */}
          {templates.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No hay plantillas guardadas aún.
            </p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {templates.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-secondary/50 p-3"
                >
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{t.name}</p>
                    {t.description && (
                      <p className="text-xs text-muted-foreground truncate">{t.description}</p>
                    )}
                  </div>
                  <Button size="sm" variant="outline" onClick={() => onApply(t)}>
                    Usar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TemplatesDialog;
