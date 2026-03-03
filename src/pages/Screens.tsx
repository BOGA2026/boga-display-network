import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import {
  Monitor,
  Plus,
  MonitorSmartphone,
  Wifi,
  WifiOff,
  Clock,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { SubscriptionAlerts } from "@/components/dashboard/SubscriptionAlerts";

const TIMEZONES = [
  { value: "America/Bogota", label: "America/Bogota (GMT-05:00)" },
  { value: "America/Lima", label: "America/Lima (GMT-05:00)" },
  { value: "America/Mexico_City", label: "America/Mexico_City (GMT-06:00)" },
  { value: "America/Santiago", label: "America/Santiago (GMT-03:00)" },
  { value: "America/Buenos_Aires", label: "America/Buenos_Aires (GMT-03:00)" },
  { value: "America/Caracas", label: "America/Caracas (GMT-04:00)" },
  { value: "America/Guayaquil", label: "America/Guayaquil (GMT-05:00)" },
  { value: "America/Asuncion", label: "America/Asuncion (GMT-04:00)" },
  { value: "America/Montevideo", label: "America/Montevideo (GMT-03:00)" },
  { value: "America/La_Paz", label: "America/La_Paz (GMT-04:00)" },
  { value: "America/New_York", label: "America/New_York (GMT-05:00)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (GMT-08:00)" },
  { value: "Europe/Madrid", label: "Europe/Madrid (GMT+01:00)" },
];

interface Screen {
  id: string;
  name: string;
  status: string;
  location_id: string;
  device_token: string | null;
  last_seen_at: string | null;
  created_at: string;
}

interface Location {
  id: string;
  name: string;
}

interface Subscription {
  screens_count: number;
  plan: string;
  status: string;
  expires_at: string | null;
  grace_period_ends_at: string | null;
}

// Validation helpers
const isValidCode = (code: string) => /^[A-Za-z0-9]{4,12}$/.test(code);

const Screens = () => {
  const [screens, setScreens] = useState<Screen[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successScreen, setSuccessScreen] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [subscriptionGateOpen, setSubscriptionGateOpen] = useState(false);
  const [limitGateOpen, setLimitGateOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Form state
  const [deviceCode, setDeviceCode] = useState("");
  const [screenName, setScreenName] = useState("");
  const [timezone, setTimezone] = useState("America/Bogota");
  const [codeError, setCodeError] = useState("");
  const [nameError, setNameError] = useState("");

  // Edit state
  const [editingScreen, setEditingScreen] = useState<Screen | null>(null);
  const [editName, setEditName] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: user } = await supabase.auth.getUser();
    const profileRes = await supabase
      .from("profiles")
      .select("business_id")
      .eq("id", user.user?.id ?? "")
      .maybeSingle();
    const businessId = profileRes.data?.business_id;
    if (!businessId) { setLoading(false); return; }

    const [screensRes, locationsRes, subRes] = await Promise.all([
      supabase.from("screens").select("*").order("created_at", { ascending: false }),
      supabase.from("locations").select("id, name").eq("business_id", businessId),
      supabase.from("subscriptions").select("screens_count, plan, status, expires_at, grace_period_ends_at").eq("business_id", businessId).maybeSingle(),
    ]);

    setScreens(screensRes.data ?? []);
    setLocations(locationsRes.data ?? []);
    setSubscription(subRes.data ?? null);
    setLoading(false);
  };

  const hasActiveSubscription = () => {
    if (!subscription) return false;
    if (subscription.status === "suspended" || subscription.status === "inactive") return false;
    return subscription.status === "active";
  };

  const isAtLimit = () => {
    if (!subscription) return true;
    return screens.length >= subscription.screens_count;
  };

  const handleAddScreenClick = () => {
    // Always allow opening the dialog — demo screens don't require subscription
    resetForm();
    setDialogOpen(true);
  };

  const isOnline = (lastSeen: string | null) => {
    if (!lastSeen) return false;
    return Date.now() - new Date(lastSeen).getTime() < 2 * 60 * 1000;
  };

  const resetForm = () => {
    setDeviceCode("");
    setScreenName("");
    setTimezone("America/Bogota");
    setCodeError("");
    setNameError("");
  };

  const validateForm = () => {
    let valid = true;
    if (!deviceCode.trim()) {
      setCodeError("El código es requerido");
      valid = false;
    } else if (!isValidCode(deviceCode)) {
      setCodeError("Solo letras y números, entre 4 y 12 caracteres");
      valid = false;
    } else {
      setCodeError("");
    }
    if (!screenName.trim()) {
      setNameError("El nombre es requerido");
      valid = false;
    } else if (screenName.trim().length > 40) {
      setNameError("Máximo 40 caracteres");
      valid = false;
    } else {
      setNameError("");
    }
    return valid;
  };

  const isFormValid = () => {
    return (
      deviceCode.trim().length >= 4 &&
      isValidCode(deviceCode) &&
      screenName.trim().length > 0 &&
      screenName.trim().length <= 40
    );
  };

  const handleAddScreen = async () => {
    if (!validateForm()) return;
    setSaving(true);

    const { data: user } = await supabase.auth.getUser();
    const profileRes = await supabase
      .from("profiles")
      .select("business_id")
      .eq("id", user.user?.id ?? "")
      .maybeSingle();
    const businessId = profileRes.data?.business_id;

    if (!businessId) {
      toast({ title: "No se encontró tu negocio", variant: "destructive" });
      setSaving(false);
      return;
    }

    // Use first location or create a default one
    let locationId = locations[0]?.id;
    if (!locationId) {
      const { data: newLoc } = await supabase
        .from("locations")
        .insert({ name: "Principal", business_id: businessId })
        .select("id")
        .single();
      locationId = newLoc?.id;
    }

    if (!locationId) {
      toast({ title: "Error al crear ubicación", variant: "destructive" });
      setSaving(false);
      return;
    }

    // Create screen
    const { data: screen, error: screenError } = await supabase
      .from("screens")
      .insert({ name: screenName.trim(), location_id: locationId })
      .select("id")
      .single();

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
      location_id: locationId,
      screen_id: screen.id,
      screen_name: screenName.trim(),
      paired_at: new Date().toISOString(),
    });

    setSaving(false);

    if (deviceError) {
      await supabase.from("screens").delete().eq("id", screen.id);
      if (deviceError.message.includes("unique")) {
        setCodeError("Código inválido o no encontrado");
      } else {
        toast({ title: "Error al vincular dispositivo", description: deviceError.message, variant: "destructive" });
      }
      return;
    }

    setSuccessScreen(screenName.trim());
    setDialogOpen(false);
    resetForm();
    fetchData();
  };

  const handleAddDemoScreen = async () => {
    setSaving(true);
    const { data: user } = await supabase.auth.getUser();
    const profileRes = await supabase
      .from("profiles")
      .select("business_id")
      .eq("id", user.user?.id ?? "")
      .maybeSingle();
    const businessId = profileRes.data?.business_id;
    if (!businessId) { setSaving(false); return; }

    let locationId = locations[0]?.id;
    if (!locationId) {
      const { data: newLoc } = await supabase
        .from("locations")
        .insert({ name: "Principal", business_id: businessId })
        .select("id")
        .single();
      locationId = newLoc?.id;
    }

    if (!locationId) { setSaving(false); return; }

    const { error } = await supabase.from("screens").insert({
      name: "Pantalla Demo",
      location_id: locationId,
      status: "online",
    });

    setSaving(false);
    if (error) {
      toast({ title: "Error al crear pantalla demo", variant: "destructive" });
      return;
    }

    setSuccessScreen("Pantalla Demo");
    setDialogOpen(false);
    resetForm();
    fetchData();
  };

  const handleDeleteScreen = async (id: string) => {
    const { error } = await supabase.from("screens").delete().eq("id", id);
    if (error) {
      toast({ title: "Error al eliminar pantalla", variant: "destructive" });
    } else {
      setDeleteConfirmId(null);
      fetchData();
    }
  };

  const handleEditScreen = async () => {
    if (!editingScreen || !editName.trim()) return;
    setEditSaving(true);
    const { error } = await supabase.from("screens").update({ name: editName.trim() }).eq("id", editingScreen.id);
    setEditSaving(false);
    if (error) {
      toast({ title: "Error al actualizar pantalla", variant: "destructive" });
    } else {
      setEditDialogOpen(false);
      setEditingScreen(null);
      fetchData();
    }
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Success banner */}
      {successScreen && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/10 px-4 py-3 text-sm">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
          <span className="font-medium">Pantalla conectada correctamente — <span className="text-primary">{successScreen}</span></span>
          <button onClick={() => setSuccessScreen(null)} className="ml-auto text-muted-foreground hover:text-foreground transition-colors">✕</button>
        </div>
      )}

      {/* Subscription status alerts */}
      {subscription && (
        <div className="mb-6">
          <SubscriptionAlerts
            expiresAt={subscription.expires_at}
            gracePeriodEndsAt={subscription.grace_period_ends_at}
            status={subscription.status}
          />
        </div>
      )}

      {/* Header */}
      <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold">Pantallas</h1>
          <p className="text-sm text-muted-foreground">Gestiona tus pantallas de señalización digital</p>
        </div>
        <Button
          onClick={handleAddScreenClick}
          className="gradient-primary text-primary-foreground border-0 gap-2 px-5 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
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
      ) : screens.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-border/30 bg-card/40">
          {/* Table header */}
          <div className="grid grid-cols-[2fr_1fr_1.5fr_auto] items-center gap-4 border-b border-border/20 px-5 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <span>Nombre</span>
            <span>Estado</span>
            <span>Última conexión</span>
            <span></span>
          </div>
          {/* Rows */}
          <div className="divide-y divide-border/10">
            {screens.map((screen) => {
              const online = isOnline(screen.last_seen_at);
              return (
                <div key={screen.id} className="grid grid-cols-[2fr_1fr_1.5fr_auto] items-center gap-4 px-5 py-4 hover:bg-secondary/20 transition-colors cursor-pointer" onClick={() => navigate(`/digital-signage/screens/${screen.id}`)}>
                  {/* Name */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary/60">
                      <Monitor className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <span className="font-medium truncate">{screen.name}</span>
                  </div>

                  {/* Status */}
                  <div>
                    {online || screen.status === "online" ? (
                      <Badge className="bg-primary/15 text-primary border-primary/25 text-xs gap-1.5">
                        <Wifi className="h-3 w-3" />
                        Activa
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-muted-foreground text-xs gap-1.5">
                        <WifiOff className="h-3 w-3" />
                        Offline
                      </Badge>
                    )}
                  </div>

                  {/* Last seen */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 shrink-0" />
                    {screen.last_seen_at
                      ? formatDistanceToNow(new Date(screen.last_seen_at), { addSuffix: true, locale: es })
                      : "Sin sincronizar"}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setEditingScreen(screen); setEditName(screen.name); setEditDialogOpen(true); }}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                      title="Editar"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(screen.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-secondary/60">
            <MonitorSmartphone className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="font-display text-xl font-bold mb-2">Sin pantallas registradas</h2>
          <p className="text-sm text-muted-foreground mb-8 max-w-sm">
            Conecta tu primera pantalla para comenzar a gestionar tu red de señalización digital.
          </p>
          <Button
            onClick={handleAddScreenClick}
            className="gradient-primary text-primary-foreground border-0 gap-2 px-8 py-3 text-base font-semibold hover:opacity-90 transition-opacity"
            size="lg"
          >
            <Plus className="h-5 w-5" />
            Agregar pantalla
          </Button>
        </div>
      )}

      {/* ─── ADD SCREEN DIALOG ─── */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="surface-elevated border-border/30 sm:max-w-lg">
          <DialogHeader className="pb-1">
            <DialogTitle className="font-display text-lg">Agregar pantalla</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Conecta una pantalla física o prueba con una pantalla demo en tu navegador.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Field 1 — Code */}
            <div className="space-y-1.5">
              <Label htmlFor="device-code" className="text-sm font-medium">
                Código de pantalla <span className="text-destructive">*</span>
              </Label>
              <Input
                id="device-code"
                placeholder="Ingresa el código de vinculación"
                value={deviceCode}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
                  setDeviceCode(val);
                  if (codeError && isValidCode(val)) setCodeError("");
                }}
                maxLength={12}
                className={`font-mono tracking-widest text-center text-base ${codeError ? "border-destructive focus-visible:ring-destructive" : ""}`}
              />
              {codeError ? (
                <p className="text-xs text-destructive">{codeError}</p>
              ) : (
                <p className="text-xs text-muted-foreground">Este código aparece en la pantalla que deseas conectar</p>
              )}
            </div>

            {/* Field 2 — Name */}
            <div className="space-y-1.5">
              <Label htmlFor="screen-name" className="text-sm font-medium">
                Nombre de la pantalla <span className="text-destructive">*</span>
              </Label>
              <Input
                id="screen-name"
                placeholder="Ejemplo: Pantalla Caja Principal"
                value={screenName}
                onChange={(e) => {
                  setScreenName(e.target.value);
                  if (nameError && e.target.value.trim()) setNameError("");
                }}
                maxLength={40}
                className={nameError ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              <div className="flex items-center justify-between">
                {nameError ? (
                  <p className="text-xs text-destructive">{nameError}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">Este nombre te ayudará a identificar la pantalla</p>
                )}
                <span className="text-xs text-muted-foreground ml-auto">{screenName.length}/40</span>
              </div>
            </div>

            {/* Field 3 — Timezone */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Zona horaria</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Asegura la programación correcta de contenido</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-2">
            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={() => { setDialogOpen(false); resetForm(); }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAddScreen}
                disabled={saving || !isFormValid()}
                className="flex-1 gradient-primary text-primary-foreground border-0 font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                {saving ? (
                  <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />Conectando...</span>
                ) : "Agregar pantalla"}
              </Button>
            </div>

            {/* Demo divider */}
            <div className="relative flex items-center gap-3">
              <div className="flex-1 border-t border-border/30" />
              <span className="text-xs text-muted-foreground">O prueba Visualia en tu navegador</span>
              <div className="flex-1 border-t border-border/30" />
            </div>

            <Button
              variant="outline"
              onClick={handleAddDemoScreen}
              disabled={saving}
              className="border-border/40 text-muted-foreground hover:text-foreground hover:bg-secondary/50 gap-2 font-medium"
            >
              <MonitorSmartphone className="h-4 w-4" />
              Agregar pantalla demo
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── EDIT DIALOG ─── */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="surface-elevated border-border/30 sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-base">Editar pantalla</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name" className="text-sm font-medium">Nombre</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={40}
                autoFocus
              />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <Button variant="ghost" className="flex-1" onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleEditScreen}
              disabled={editSaving || !editName.trim()}
              className="flex-1 gradient-primary text-primary-foreground border-0 font-semibold hover:opacity-90 transition-opacity"
            >
              {editSaving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── DELETE CONFIRM DIALOG ─── */}
      <Dialog open={!!deleteConfirmId} onOpenChange={(open) => { if (!open) setDeleteConfirmId(null); }}>
        <DialogContent className="surface-elevated border-border/30 sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-base flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-destructive" />
              Eliminar pantalla
            </DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminará la pantalla y su configuración.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setDeleteConfirmId(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              className="flex-1 font-semibold"
              onClick={() => deleteConfirmId && handleDeleteScreen(deleteConfirmId)}
            >
              Eliminar pantalla
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── SUBSCRIPTION GATE DIALOG ─── */}
      <Dialog open={subscriptionGateOpen} onOpenChange={setSubscriptionGateOpen}>
        <DialogContent className="surface-elevated border-border/30 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-accent" />
              Primero debes activar tu suscripción
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground pt-2">
              Para agregar pantallas primero debes comprar la cantidad de licencias que necesitas en la sección Suscripción.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-3">
            <Button variant="ghost" className="flex-1" onClick={() => setSubscriptionGateOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="flex-1 gradient-primary text-primary-foreground border-0 font-semibold hover:opacity-90 transition-opacity"
              onClick={() => { setSubscriptionGateOpen(false); window.location.href = "/dashboard/suscripcion"; }}
            >
              Ir a Suscripción
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── LIMIT REACHED DIALOG ─── */}
      <Dialog open={limitGateOpen} onOpenChange={setLimitGateOpen}>
        <DialogContent className="surface-elevated border-border/30 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-accent" />
              Has alcanzado el límite de pantallas
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground pt-2">
              Has alcanzado el límite de pantallas según tu suscripción. Para agregar más pantallas, actualiza tu plan o adquiere licencias adicionales.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-3">
            <Button variant="ghost" className="flex-1" onClick={() => setLimitGateOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="flex-1 gradient-primary text-primary-foreground border-0 font-semibold hover:opacity-90 transition-opacity"
              onClick={() => { setLimitGateOpen(false); window.location.href = "/dashboard/suscripcion"; }}
            >
              Actualizar plan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Screens;
