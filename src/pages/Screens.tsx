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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Monitor, Plus, MonitorSmartphone, Link2, Wifi, WifiOff, MapPin, ListMusic } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface Location {
  id: string;
  name: string;
}

interface Device {
  id: string;
  device_code: string;
  status: string;
  screen_name: string | null;
  location_id: string | null;
  screen_id: string | null;
  last_seen_at: string | null;
  paired_at: string | null;
  app_version: string | null;
  locations?: { name: string } | null;
  screens?: { name: string; status: string } | null;
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
  const [devices, setDevices] = useState<Device[]>([]);
  const [screens, setScreens] = useState<Screen[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [pairDialogOpen, setPairDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Pair form state
  const [deviceCode, setDeviceCode] = useState("");
  const [pairLocationId, setPairLocationId] = useState("");
  const [pairScreenName, setPairScreenName] = useState("");

  // Add screen form state
  const [screenName, setScreenName] = useState("");
  const [locationId, setLocationId] = useState("");
  const [deviceId, setDeviceId] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    const profileRes = await supabase.from("profiles").select("business_id").eq("id", (await supabase.auth.getUser()).data.user?.id ?? "").maybeSingle();
    const businessId = profileRes.data?.business_id;

    if (!businessId) {
      setLoading(false);
      return;
    }

    const [devicesRes, screensRes, locationsRes] = await Promise.all([
      supabase.from("devices").select("*, locations(name), screens(name, status)").eq("business_id", businessId).order("created_at", { ascending: false }),
      supabase.from("screens").select("*").order("created_at", { ascending: false }),
      supabase.from("locations").select("id, name"),
    ]);

    setDevices(devicesRes.data ?? []);
    setScreens(screensRes.data ?? []);
    setLocations(locationsRes.data ?? []);
    setLoading(false);
  };

  const handlePairDevice = async () => {
    if (!deviceCode.trim() || !pairLocationId || !pairScreenName.trim()) {
      toast({ title: "Completa todos los campos requeridos", variant: "destructive" });
      return;
    }

    setSaving(true);

    const profileRes = await supabase.from("profiles").select("business_id").eq("id", (await supabase.auth.getUser()).data.user?.id ?? "").maybeSingle();
    const businessId = profileRes.data?.business_id;

    if (!businessId) {
      toast({ title: "No se encontró tu negocio", variant: "destructive" });
      setSaving(false);
      return;
    }

    // Create screen first
    const { data: screen, error: screenError } = await supabase.from("screens").insert({
      name: pairScreenName.trim(),
      location_id: pairLocationId,
    }).select("id").single();

    if (screenError || !screen) {
      toast({ title: "Error al crear pantalla", description: screenError?.message, variant: "destructive" });
      setSaving(false);
      return;
    }

    // Create device record linked to screen
    const { error: deviceError } = await supabase.from("devices").insert({
      device_code: deviceCode.trim().toUpperCase(),
      status: "paired",
      business_id: businessId,
      location_id: pairLocationId,
      screen_id: screen.id,
      screen_name: pairScreenName.trim(),
      paired_at: new Date().toISOString(),
    });

    setSaving(false);

    if (deviceError) {
      // Rollback screen
      await supabase.from("screens").delete().eq("id", screen.id);
      if (deviceError.message.includes("unique")) {
        toast({ title: "Código ya registrado", description: "Este código de dispositivo ya fue vinculado.", variant: "destructive" });
      } else {
        toast({ title: "Error al vincular dispositivo", description: deviceError.message, variant: "destructive" });
      }
      return;
    }

    toast({ title: "Dispositivo vinculado exitosamente" });
    setPairDialogOpen(false);
    resetPairForm();
    fetchData();
  };

  const handleAddScreen = async () => {
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
    setAddDialogOpen(false);
    resetAddForm();
    fetchData();
  };

  const resetPairForm = () => {
    setDeviceCode("");
    setPairLocationId("");
    setPairScreenName("");
  };

  const resetAddForm = () => {
    setScreenName("");
    setLocationId("");
    setDeviceId("");
  };

  const isOnline = (lastSeen: string | null) => {
    if (!lastSeen) return false;
    const diff = Date.now() - new Date(lastSeen).getTime();
    return diff < 2 * 60 * 1000; // 2 minutes
  };

  const hasContent = devices.length > 0 || screens.length > 0;

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold">Pantallas</h1>
          <p className="text-sm text-muted-foreground">Gestiona tus pantallas y dispositivos vinculados</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => { resetPairForm(); setPairDialogOpen(true); }}
            className="gradient-primary hover:gradient-primary-hover glow-primary-sm text-primary-foreground border-0 gap-2 px-5 py-2.5 text-sm font-semibold"
          >
            <Link2 className="h-4 w-4" />
            Vincular dispositivo
          </Button>
          <Button
            onClick={() => { resetAddForm(); setAddDialogOpen(true); }}
            variant="outline"
            className="border-primary/40 text-primary hover:bg-primary/10 gap-2 px-5 py-2.5 text-sm font-semibold"
          >
            <Plus className="h-4 w-4" />
            Agregar pantalla
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : hasContent ? (
        <div className="space-y-8">
          {/* Devices section */}
          {devices.length > 0 && (
            <div>
              <h2 className="font-display text-lg font-semibold mb-4">Dispositivos vinculados</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {devices.map((device) => {
                  const online = isOnline(device.last_seen_at);
                  return (
                    <Card key={device.id} className="surface-elevated border-border/30 transition-all hover:border-primary/30 hover:glow-primary-sm">
                      <CardContent className="p-5 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                              <Monitor className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold truncate">{device.screen_name || device.device_code}</p>
                              <p className="text-xs text-muted-foreground font-mono">{device.device_code}</p>
                            </div>
                          </div>
                          <Badge variant={device.status === "paired" ? "default" : "secondary"} className={device.status === "paired" ? "bg-primary/20 text-primary border-primary/30" : ""}>
                            {device.status === "paired" ? "Vinculado" : "Pendiente"}
                          </Badge>
                        </div>

                        <div className="space-y-1.5 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            {online ? <Wifi className="h-3 w-3 text-primary" /> : <WifiOff className="h-3 w-3 text-destructive" />}
                            <span>{online ? "En línea" : "Desconectado"}</span>
                            {device.last_seen_at && (
                              <span className="ml-auto">
                                {formatDistanceToNow(new Date(device.last_seen_at), { addSuffix: true, locale: es })}
                              </span>
                            )}
                          </div>
                          {device.locations && (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-3 w-3" />
                              <span>{(device.locations as any).name}</span>
                            </div>
                          )}
                          {device.app_version && (
                            <div className="flex items-center gap-1.5">
                              <span>v{device.app_version}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Screens without devices */}
          {screens.length > 0 && (
            <div>
              <h2 className="font-display text-lg font-semibold mb-4">Pantallas registradas</h2>
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
            </div>
          )}
        </div>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl gradient-primary glow-primary animate-pulse-glow">
            <MonitorSmartphone className="h-10 w-10 text-primary-foreground" />
          </div>
          <h2 className="font-display text-xl font-bold mb-2">No hay pantallas registradas</h2>
          <p className="text-sm text-muted-foreground mb-8 max-w-sm">
            Vincula tu primer dispositivo o agrega una pantalla para comenzar a gestionar tu red de señalización digital.
          </p>
          <div className="flex gap-3">
            <Button
              onClick={() => { resetPairForm(); setPairDialogOpen(true); }}
              className="gradient-primary hover:gradient-primary-hover glow-primary text-primary-foreground border-0 gap-2 px-8 py-3 text-base font-semibold"
              size="lg"
            >
              <Link2 className="h-5 w-5" />
              Vincular dispositivo
            </Button>
            <Button
              onClick={() => { resetAddForm(); setAddDialogOpen(true); }}
              variant="outline"
              className="border-primary/40 text-primary hover:bg-primary/10 gap-2 px-8 py-3 text-base font-semibold"
              size="lg"
            >
              <Plus className="h-5 w-5" />
              Agregar pantalla
            </Button>
          </div>
        </div>
      )}

      {/* Pair Device Dialog */}
      <Dialog open={pairDialogOpen} onOpenChange={setPairDialogOpen}>
        <DialogContent className="surface-elevated border-border/30 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-lg flex items-center gap-2">
              <Link2 className="h-5 w-5 text-primary" />
              Vincular dispositivo
            </DialogTitle>
            <DialogDescription>
              Ingresa el código que aparece en la pantalla del dispositivo Android para vincularlo a tu red.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="device-code">Código del dispositivo *</Label>
              <Input
                id="device-code"
                placeholder="Ej: VIS-A1B2C3"
                value={deviceCode}
                onChange={(e) => setDeviceCode(e.target.value.toUpperCase())}
                className="font-mono text-lg tracking-widest text-center"
                maxLength={12}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pair-location">Ubicación *</Label>
              {locations.length > 0 ? (
                <Select value={pairLocationId} onValueChange={setPairLocationId}>
                  <SelectTrigger id="pair-location">
                    <SelectValue placeholder="Selecciona una ubicación" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
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
              <Label htmlFor="pair-screen-name">Nombre de pantalla *</Label>
              <Input
                id="pair-screen-name"
                placeholder="Ej: Pantalla recepción"
                value={pairScreenName}
                onChange={(e) => setPairScreenName(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setPairDialogOpen(false)}>Cancelar</Button>
            <Button
              onClick={handlePairDevice}
              disabled={saving || !deviceCode.trim() || !pairLocationId || !pairScreenName.trim()}
              className="gradient-primary hover:gradient-primary-hover glow-primary-sm text-primary-foreground border-0 gap-2"
            >
              <Link2 className="h-4 w-4" />
              {saving ? "Vinculando..." : "Vincular"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Screen Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
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
                      <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
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
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddDialogOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleAddScreen}
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
