import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Monitor, Plus, MonitorSmartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Location {
  id: string;
  name: string;
}

interface Screen {
  id: string;
  name: string;
  status: string;
  location_id: string;
  device_token: string | null;
  last_seen_at: string | null;
  created_at: string;
}

const Screens = () => {
  const [screens, setScreens] = useState<Screen[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Form state
  const [screenName, setScreenName] = useState("");
  const [locationId, setLocationId] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [screensRes, locationsRes] = await Promise.all([
      supabase.from("screens").select("*").order("created_at", { ascending: false }),
      supabase.from("locations").select("id, name"),
    ]);
    setScreens(screensRes.data ?? []);
    setLocations(locationsRes.data ?? []);
    setLoading(false);
  };

  const resetForm = () => {
    setScreenName("");
    setLocationId("");
    setDeviceId("");
    setDescription("");
  };

  const handleAdd = async () => {
    if (!screenName.trim() || !locationId) {
      toast({ title: "Completa los campos requeridos", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("screens").insert({
      name: screenName.trim(),
      location_id: locationId,
      device_token: deviceId.trim() || null,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Error al agregar pantalla", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Pantalla agregada" });
    setDialogOpen(false);
    resetForm();
    fetchData();
  };

  const openDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const hasScreens = screens.length > 0;

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Pantallas</h1>
          <p className="text-sm text-muted-foreground">Gestiona tus pantallas digitales</p>
        </div>
        <Button
          onClick={openDialog}
          className="gradient-primary hover:gradient-primary-hover glow-primary-sm text-primary-foreground border-0 gap-2 px-5 py-2.5 text-sm font-semibold"
        >
          <Plus className="h-4 w-4" />
          Agregar pantalla
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : hasScreens ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {screens.map((screen) => (
            <Card key={screen.id} className="surface-elevated border-border/30 transition-all hover:border-primary/30 hover:glow-primary-sm">
              <CardContent className="flex items-start gap-4 p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                  <Monitor className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate">{screen.name}</p>
                  <p className="text-xs text-muted-foreground mt-1 capitalize">{screen.status}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl gradient-primary glow-primary animate-pulse-glow">
            <MonitorSmartphone className="h-10 w-10 text-primary-foreground" />
          </div>
          <h2 className="font-display text-xl font-bold mb-2">No hay pantallas registradas</h2>
          <p className="text-sm text-muted-foreground mb-8 max-w-sm">
            Agrega tu primera pantalla para comenzar a gestionar tu red de señalización digital.
          </p>
          <Button
            onClick={openDialog}
            className="gradient-primary hover:gradient-primary-hover glow-primary text-primary-foreground border-0 gap-2 px-8 py-3 text-base font-semibold"
            size="lg"
          >
            <Plus className="h-5 w-5" />
            Agregar una pantalla
          </Button>
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="surface-elevated border-border/30 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-lg">Nueva pantalla</DialogTitle>
            <DialogDescription>Registra una pantalla en tu red de señalización.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="screen-name">Nombre de la pantalla *</Label>
              <Input
                id="screen-name"
                placeholder="Pantalla principal"
                value={screenName}
                onChange={(e) => setScreenName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Ubicación *</Label>
              {locations.length > 0 ? (
                <Select value={locationId} onValueChange={setLocationId}>
                  <SelectTrigger id="location">
                    <SelectValue placeholder="Selecciona una ubicación" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground rounded-lg border border-border/50 p-3">
                  No hay ubicaciones. Crea una primero en la sección Ubicaciones.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="device-id">Device ID (opcional)</Label>
              <Input
                id="device-id"
                placeholder="Se genera automáticamente si se deja vacío"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción (opcional)</Label>
              <Textarea
                id="description"
                placeholder="Notas adicionales sobre esta pantalla..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAdd}
              disabled={saving || !screenName.trim() || !locationId}
              className="gradient-primary hover:gradient-primary-hover glow-primary-sm text-primary-foreground border-0 gap-2"
            >
              <Plus className="h-4 w-4" />
              {saving ? "Guardando..." : "Agregar pantalla"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Screens;
