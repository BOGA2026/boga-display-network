/**
 * SendToScreenSheet — reusable Sheet to send a content item to a screen.
 * Redirects to /dashboard/programacion prefilled with content and screen ids.
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Screen {
  id: string;
  name: string;
  status: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentId?: string;
  contentLabel?: string;
}

export function SendToScreenSheet({
  open,
  onOpenChange,
  contentId,
  contentLabel,
}: Props) {
  const navigate = useNavigate();
  const [screens, setScreens] = useState<Screen[]>([]);
  const [screenId, setScreenId] = useState<string>("");
  const [date, setDate] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );

  useEffect(() => {
    if (!open) return;
    supabase
      .from("screens")
      .select("id, name, status")
      .order("name")
      .then(({ data, error }) => {
        if (error) {
          toast.error("No se pudieron cargar las pantallas");
          return;
        }
        setScreens(data ?? []);
      });
  }, [open]);

  const handleContinue = () => {
    if (!screenId) {
      toast.error("Seleccioná una pantalla");
      return;
    }
    const params = new URLSearchParams();
    if (contentId) params.set("content", contentId);
    params.set("screen", screenId);
    params.set("date", date);
    navigate(`/dashboard/programacion?${params.toString()}`);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Enviar a pantalla</SheetTitle>
          <SheetDescription>
            {contentLabel
              ? `Programá "${contentLabel}" en una de tus pantallas.`
              : "Elegí la pantalla y la fecha para programar este contenido."}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label>Pantalla</Label>
            <Select value={screenId} onValueChange={setScreenId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccioná una pantalla" />
              </SelectTrigger>
              <SelectContent>
                {screens.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}{" "}
                    <span className="text-xs text-muted-foreground">
                      · {s.status}
                    </span>
                  </SelectItem>
                ))}
                {screens.length === 0 && (
                  <div className="px-2 py-4 text-sm text-muted-foreground">
                    No tenés pantallas aún.
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Fecha</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        <SheetFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleContinue}>Ir a Horarios</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
