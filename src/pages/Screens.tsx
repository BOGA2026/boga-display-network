import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { queryClient } from "@/lib/query-client";
import { pageQueryKeys } from "@/lib/routePrefetch";
import { PAGE_STALE_TIME, fetchScreensPage } from "@/lib/pageQueries";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { LastSyncLabel } from "@/components/system/LastSyncLabel";
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
  Copy,
  Check,
  Download,
  Smartphone,
  Link2Off,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SubscriptionAlerts } from "@/components/dashboard/SubscriptionAlerts";
import { QRCodeSVG } from "qrcode.react";
import { PairDeviceModal } from "@/features/pairing";
import { TvCompatibilityWizard, TvCompatibilityDialog } from "@/features/devices";
import type { DeviceType } from "@/config/devices";
import { NAV, COPY } from "@/config/lexicon";
import { CardGridSkeleton, EmptyState, ErrorState } from "@/components/feedback/states";
import ScreensWorkspace from "@/features/screens/ScreensWorkspace";
import type { ScreenRow } from "@/features/screens/types";
import AssignPlaylistDialog from "@/components/digital-signage/AssignPlaylistDialog";
import { getBusinessId, getUserId } from "@/features/auth/tenant";
import { deleteScreens } from "@/features/screens/deleteScreens";
import { getAttribution } from "@/lib/attribution";


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
  price_per_screen?: number | null;
  billing_cycle?: string | null;
  next_billing_date?: string | null;
}


// Generate a 6-character pairing code (avoids ambiguous 0/O/1/I)
const PAIRING_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const generatePairingCode = () => {
  const values = globalThis.crypto?.getRandomValues?.(new Uint32Array(6));
  return Array.from({ length: 6 }, (_, i) => {
    const v = values?.[i] ?? Math.floor(Math.random() * PAIRING_ALPHABET.length);
    return PAIRING_ALPHABET[v % PAIRING_ALPHABET.length];
  }).join("");
};

const Screens = () => {
  const [screens, setScreens] = useState<Screen[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successScreen, setSuccessScreen] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [subscriptionGateOpen, setSubscriptionGateOpen] = useState(false);
  const [limitGateOpen, setLimitGateOpen] = useState(false);
  const [pairModalOpen, setPairModalOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<{ id: string; name: string } | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Form state — new flow: panel generates the code
  const [screenName, setScreenName] = useState("");
  const [timezone, setTimezone] = useState("America/Bogota");
  const [nameError, setNameError] = useState("");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  // Paso previo: comprobar que el televisor sirve antes de dar el código.
  // Si ya lo respondió en la landing, no se le vuelve a preguntar.
  const tvChoice = getAttribution();
  const [compatDone, setCompatDone] = useState(tvChoice.needs_device === false);
  const [deviceType, setDeviceType] = useState<DeviceType>(
    tvChoice.needs_device === false ? "tv_google" : "desconocido",
  );

  const [compatDialogOpen, setCompatDialogOpen] = useState(false);

  // Edit state
  const [editingScreen, setEditingScreen] = useState<Screen | null>(null);
  const [editName, setEditName] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    fetchData({ fresh: false });
  }, []);

  // Auto-advance: when the TV claims the pairing code, close sheet and celebrate.
  useEffect(() => {
    if (!generatedCode) return;
    const channel = supabase
      .channel(`pairing-${generatedCode}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "devices", filter: `device_code=eq.${generatedCode}` },
        (payload) => {
          const status = (payload.new as { status?: string })?.status;
          if (status && status !== "pending") {
            setSuccessScreen(screenName.trim());
            setDialogOpen(false);
            resetForm();
            fetchData();
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generatedCode]);

  /**
   * Lee la consulta de la sección desde el caché de react-query, así el
   * prefetch del hover del menú se reutiliza tal cual (misma queryKey).
   * `fresh: true` (default en mutaciones) fuerza red.
   */
  const fetchData = async ({ fresh = true }: { fresh?: boolean } = {}) => {
    setLoading(true);
    setLoadError(false);
    try {
      const data = await queryClient.fetchQuery({
        queryKey: pageQueryKeys.screensPage,
        queryFn: fetchScreensPage,
        staleTime: fresh ? 0 : PAGE_STALE_TIME,
      });
      setScreens((data.screens ?? []) as Screen[]);
      setLocations((data.locations ?? []) as Location[]);
      setSubscription((data.subscription ?? null) as Subscription | null);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
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

  const isOnline = (lastSeen: string | null) => {
    if (!lastSeen) return false;
    return Date.now() - new Date(lastSeen).getTime() < 2 * 60 * 1000;
  };



  const handleAddDemoScreen = async () => {
    setSaving(true);
    const businessId = await getBusinessId();
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

  /** Borrado lógico: conserva la analítica y permite deshacer. */
  const handleDeleteScreen = async (id: string) => {
    const ok = await deleteScreens([id]);
    if (ok) {
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
    <div className="v-page">
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
          <h1 className="font-display text-2xl font-bold">{NAV.pantallas.pageTitle}</h1>
          <p className="text-sm text-muted-foreground">{NAV.pantallas.pageSubtitle}</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setPairModalOpen(true)}
            className="gradient-primary text-primary-foreground border-0 gap-2 px-5 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <MonitorSmartphone className="h-4 w-4" />
            Vincular pantalla
          </Button>
        </div>

      </div>

      {/* Content */}
      {loading ? (
        <CardGridSkeleton count={8} columns={4} />
      ) : loadError ? (
        <ErrorState description={COPY.error.screens} onRetry={fetchData} />
      ) : screens.length > 0 ? (
        <ScreensWorkspace
          screens={screens as ScreenRow[]}
          locations={locations}
          subscription={subscription}
          onRefresh={fetchData}
          onChangeContent={(s) => setAssignTarget({ id: s.id, name: s.name })}
        />

      ) : (
        <EmptyState
          icon={<MonitorSmartphone className="h-9 w-9" />}
          title={COPY.empty.screensTitle}
          description={COPY.empty.screens}
          action={
            <Button
              onClick={() => setPairModalOpen(true)}
              className="gradient-primary text-primary-foreground border-0 gap-2 px-8 py-3 text-base font-semibold hover:opacity-90 transition-opacity"
              size="lg"
            >
              <MonitorSmartphone className="h-5 w-5" />
              Vincular pantalla
            </Button>
          }

          secondaryAction={
            <Button
              variant="outline"
              onClick={handleAddDemoScreen}
              disabled={saving}
              className="border-border/40 text-muted-foreground hover:text-foreground hover:bg-secondary/50 gap-2 px-8 py-3 text-base font-medium"
              size="lg"
            >
              <MonitorSmartphone className="h-5 w-5" />
              Agregar pantalla demo
            </Button>
          }
        />

      )}





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
              El dispositivo volverá a la pantalla de vinculación. El historial de reproducción se conserva y puedes restaurarla desde Ajustes durante 30 días.
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

      {/* ─── PAIR EXISTING DEVICE MODAL ─── */}
      <PairDeviceModal
        open={pairModalOpen}
        onOpenChange={setPairModalOpen}
        locations={locations}
        onPaired={() => { setSuccessScreen("Pantalla"); fetchData(); }}
      />


      {/* ─── CONSULTA PERMANENTE: ¿MI TELEVISOR SIRVE? ─── */}
      <div className="mt-10 border-t border-border/30 pt-4 text-center">
        <button
          type="button"
          onClick={() => setCompatDialogOpen(true)}
          className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          {COPY.dispositivo.enlaceConsulta}
        </button>
      </div>
      <TvCompatibilityDialog open={compatDialogOpen} onOpenChange={setCompatDialogOpen} />

      {assignTarget && (
        <AssignPlaylistDialog
          open={!!assignTarget}
          onOpenChange={(open) => { if (!open) setAssignTarget(null); }}
          screenId={assignTarget.id}
          screenName={assignTarget.name}
          onAssigned={() => { setAssignTarget(null); fetchData(); }}
        />
      )}
    </div>

  );
};

export default Screens;
