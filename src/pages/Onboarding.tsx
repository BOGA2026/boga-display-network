/**
 * Onboarding — ruta de recuperación para usuarios autenticados que quedaron
 * sin negocio (profiles.business_id nulo). Pide lo mínimo y crea negocio +
 * membresía + perfil en una sola transacción (rpc complete_onboarding).
 *
 * Es reanudable: si el usuario se va a mitad de camino, el guard del panel lo
 * vuelve a traer acá; nunca queda en un panel vacío del que no pueda salir.
 */
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth, signOut } from "@/hooks/useAuth";
import { useTenant } from "@/features/auth/useTenant";
import { TvCompatibilityWizard } from "@/features/devices";
import { tenantQueryKey } from "@/features/auth/tenant";
import { logError } from "@/lib/errorLogger";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Onboarding() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session, loading: authLoading } = useAuth("/login");
  const { businessId, loading: tenantLoading } = useTenant();

  const [name, setName] = React.useState("");
  const [city, setCity] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  // Antes de pedir la primera vinculación hay que saber si su televisor sirve.
  const [phase, setPhase] = React.useState<"negocio" | "televisor">("negocio");
  // Elección del verificador de la landing: evita repetir la pregunta.
  const tvChoice = React.useMemo(() => captureTvChoiceFromUrl(), []);


  // Ya tiene negocio → no hay nada que configurar.
  React.useEffect(() => {
    if (!authLoading && !tenantLoading && businessId && phase === "negocio") {
      navigate("/dashboard", { replace: true });
    }
  }, [authLoading, tenantLoading, businessId, navigate, phase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !city.trim() || saving) return;
    setSaving(true);
    try {
      const { error } = await supabase.rpc("complete_onboarding", {
        p_business_name: name.trim(),
        p_city: city.trim(),
      });
      if (error) throw error;
      // El tenant cacheado quedó viejo: se recarga con el negocio nuevo.
      await queryClient.invalidateQueries({ queryKey: tenantQueryKey(session?.user?.id) });
      toast.success("Listo, tu negocio ya está configurado");
      setPhase("televisor");
    } catch (err) {
      logError(err, { label: "onboarding.complete", scope: "onboarding", section: "onboarding" });
      toast.error("No pudimos crear tu negocio. Intentá de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || tenantLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (phase === "televisor") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
        <div className="v-card w-full max-w-lg p-6 sm:p-8">
          <TvCompatibilityWizard
            continueLabel="Seguir"
            initialBrandId={tvChoice.needs_device ? tvChoice.tv_brand ?? null : null}
            onCompatible={() => navigate("/dashboard/pantallas", { replace: true })}
            onClose={() => navigate("/dashboard", { replace: true })}
          />

          <button
            type="button"
            onClick={() => navigate("/dashboard", { replace: true })}
            className="mt-6 w-full text-center text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Lo veo después
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="v-card w-full max-w-md p-6 sm:p-8">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Configurá tu negocio
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Falta un paso para entrar al panel: contanos cómo se llama tu negocio y en qué
          ciudad está. Podés cambiarlo después.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="business-name">Nombre del negocio</Label>
            <Input
              id="business-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Café Central"
              maxLength={120}
              autoFocus
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="business-city">Ciudad</Label>
            <Input
              id="business-city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ej: Medellín"
              maxLength={120}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crear mi negocio
          </Button>
        </form>

        <button
          type="button"
          onClick={() => signOut()}
          className="mt-4 w-full text-center text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          Cerrar sesión
        </button>
      </div>
    </main>
  );
}
