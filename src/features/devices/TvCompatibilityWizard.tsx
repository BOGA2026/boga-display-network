/**
 * TvCompatibilityWizard — primer paso del alta de una pantalla.
 *
 * La mayoría de los televisores vendidos en Colombia (Samsung, LG) no sirven
 * solos: necesitar el aparatito es lo normal, no la excepción. Por eso este
 * chequeo va antes del código de vinculación y nunca promete compatibilidad
 * por la marca: siempre se confirma con la pregunta de Play Store.
 */
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Loader2, PackageCheck, ShoppingCart, Tv } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/features/auth/useTenant";
import { useAuthContext } from "@/context/AuthContext";
import { logError } from "@/lib/errorLogger";
import { COPY } from "@/config/lexicon";
import {
  DEVICE_MODELS,
  TV_BRANDS,
  VISUALIA_DEVICE_PRICE_COP,
  deviceIsIncluded,
  formatCop,
  type DeviceType,
  type TvBrand,
} from "@/config/devices";
import playStoreIcon from "@/assets/play-store-icon.png";

type Step = "marca" | "playstore" | "dispositivo" | "pedido" | "pedido_ok";

interface Props {
  /** Se llama cuando el televisor sirve y hay que seguir al código. */
  onCompatible?: (deviceType: DeviceType) => void;
  /** Texto del botón que continúa al código de vinculación. */
  continueLabel?: string;
  /** Modo consulta: sin continuar al código (enlace "¿Mi televisor sirve?"). */
  consultOnly?: boolean;
  onClose?: () => void;
  /** Marca ya elegida antes (por ejemplo en la landing): no se vuelve a preguntar. */
  initialBrandId?: string | null;
}

const C = COPY.dispositivo;

export function TvCompatibilityWizard({
  onCompatible,
  continueLabel = "Seguir al código",
  consultOnly = false,
  onClose,
  initialBrandId = null,
}: Props) {
  // Si la persona ya respondió el verificador de la landing, el asistente
  // arranca en el resultado y no le repite la misma pregunta.
  const preset = initialBrandId ? TV_BRANDS.find((b) => b.id === initialBrandId) ?? null : null;
  const [step, setStep] = React.useState<Step>(
    preset ? (preset.verdict === "necesita_dispositivo" ? "dispositivo" : "playstore") : "marca",
  );
  const [brand, setBrand] = React.useState<TvBrand | null>(preset);

  const { businessId } = useTenant();
  const { userId } = useAuthContext();

  const { data: subscription } = useQuery({
    queryKey: ["device-subscription-cycle", businessId],
    enabled: !!businessId,
    queryFn: async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("billing_cycle")
        .eq("business_id", businessId!)
        .maybeSingle();
      return data;
    },
  });
  const included = deviceIsIncluded(subscription?.billing_cycle);

  // ── Paso 3B: pedido a Visualia ──
  const [contactName, setContactName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [city, setCity] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const pickBrand = (b: TvBrand) => {
    setBrand(b);
    setStep(b.verdict === "necesita_dispositivo" ? "dispositivo" : "playstore");
  };

  const submitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId || saving) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("device_orders").insert({
        business_id: businessId,
        requested_by: userId,
        model_name: "Dispositivo Visualia con Google TV",
        price_cop: included ? 0 : VISUALIA_DEVICE_PRICE_COP,
        included,
        contact_name: contactName.trim(),
        contact_phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        notes: notes.trim() || null,
      });
      if (error) throw error;
      setStep("pedido_ok");
    } catch (err) {
      logError(err, { label: "device.order", scope: "devices", section: "pantallas" });
      toast.error(C.pedidoError);
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────── Paso 1 ───────────────────────────
  if (step === "marca") {
    return (
      <div className="space-y-4">
        <Header title={C.paso1Titulo} description={C.paso1Sub} />
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {TV_BRANDS.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => pickBrand(b)}
              style={{ ["--brand" as string]: brandColor(b.id) }}
              className="group v-card v-card-interactive flex h-20 flex-col items-center justify-center gap-1.5 px-2 text-center"
            >
              <BrandLogo id={b.id} name={b.name} active={brand?.id === b.id} />
              {!isWordmark(b.id) && (
                <span className="text-[11px] leading-tight text-muted-foreground">{b.name}</span>
              )}
            </button>
          ))}
        </div>

        {!consultOnly && (
          <Button
            variant="ghost"
            className="w-full text-sm text-muted-foreground hover:text-foreground"
            onClick={() => onCompatible?.("dispositivo_externo")}
          >
            Ya tengo un dispositivo conectado al HDMI
          </Button>
        )}
      </div>
    );
  }


  // ─────────────────────────── Paso 2 ───────────────────────────
  if (step === "playstore") {
    return (
      <div className="space-y-4">
        <Header
          title={C.paso2Titulo}
          description={
            brand?.verdict === "probable" ? `${C.paso2Pista} ${C.paso2Sub}` : C.paso2Sub
          }
        />
        <div className="v-card flex items-center gap-4 p-4">
          <img
            src={playStoreIcon}
            alt="Ícono de Play Store como se ve en el televisor"
            loading="lazy"
            width={512}
            height={512}
            className="h-14 w-14 shrink-0 object-contain"
          />
          <p className="text-sm text-muted-foreground">{C.paso2Ayuda}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            className="flex-1"
            onClick={() => {
              if (consultOnly) {
                toast.success(C.compatible);
                onClose?.();
              } else {
                onCompatible?.("tv_google");
              }
            }}
          >
            {C.siLaVeo}
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => setStep("dispositivo")}>
            {C.noLaEncuentro}
          </Button>
        </div>
        <BackLink onClick={() => setStep("marca")} />
      </div>
    );
  }

  // ─────────────────────────── Paso 3 ───────────────────────────
  if (step === "dispositivo") {
    return (
      <div className="space-y-4">
        <Header
          title={C.paso3Titulo}
          description={
            brand?.verdict === "necesita_dispositivo" ? `${C.paso3Marca} ${C.paso3Sub}` : C.paso3Sub
          }
        />

        {/* B) Visualia te lo envía — opción destacada */}
        <div className="v-card space-y-3 border-primary/40 p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <PackageCheck className="h-5 w-5" />
            </span>
            <div>
              <h4 className="text-sm font-semibold text-foreground">{C.opcionVisualia}</h4>
              <p className="text-xs text-muted-foreground">{C.opcionVisualiaSub}</p>
            </div>
          </div>

          <PriceComparison />

          <p className="text-xs text-muted-foreground">{C.incluidoNota}</p>

          {!included && (
            <div className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-foreground">
              {C.ahorroMensual}
            </div>
          )}

          <Button className="w-full" onClick={() => setStep("pedido")}>
            {included ? C.pedirIncluido : C.pedirloAVisualia}
          </Button>
        </div>

        {/* A) Comprarlo por su cuenta */}
        <div className="v-card space-y-3 p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/60 text-muted-foreground">
              <ShoppingCart className="h-5 w-5" />
            </span>
            <div>
              <h4 className="text-sm font-semibold text-foreground">{C.opcionPropia}</h4>
              <p className="text-xs text-muted-foreground">{C.requisito}</p>
            </div>
          </div>
          <ul className="space-y-1.5">
            {DEVICE_MODELS.map((m) => (
              <li key={m.id} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="text-foreground">
                  {m.name}
                  {m.note && <span className="ml-2 text-xs text-muted-foreground">{m.note}</span>}
                </span>
                <span className="v-numeric shrink-0 text-sm text-muted-foreground">
                  {formatCop(m.priceCop)}
                </span>
              </li>
            ))}
          </ul>
          {!consultOnly && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => onCompatible?.("dispositivo_externo")}
            >
              {C.yaTengoDispositivo}
            </Button>
          )}
        </div>

        <BackLink onClick={() => setStep(brand?.verdict === "necesita_dispositivo" ? "marca" : "playstore")} />
      </div>
    );
  }

  // ───────────────────── Paso 3B: dirección ─────────────────────
  if (step === "pedido") {
    return (
      <form onSubmit={submitOrder} className="space-y-4">
        <Header title={C.envioTitulo} description={C.envioSub} />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="dev-name">Nombre de quien recibe</Label>
            <Input id="dev-name" value={contactName} onChange={(e) => setContactName(e.target.value)} maxLength={80} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dev-phone">Teléfono</Label>
            <Input id="dev-phone" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} required />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="dev-address">Dirección</Label>
            <Input id="dev-address" value={address} onChange={(e) => setAddress(e.target.value)} maxLength={160} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dev-city">Ciudad</Label>
            <Input id="dev-city" value={city} onChange={(e) => setCity(e.target.value)} maxLength={80} required />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="dev-notes">Indicaciones para la entrega (opcional)</Label>
            <Textarea id="dev-notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={300} rows={2} />
          </div>
        </div>
        <div className="flex items-baseline justify-between text-sm">
          <span className="text-muted-foreground">Total del dispositivo</span>
          <span className="v-numeric font-semibold text-foreground">
            {included ? C.sinCosto : formatCop(VISUALIA_DEVICE_PRICE_COP)}
          </span>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" className="flex-1" onClick={() => setStep("dispositivo")}>
            Volver
          </Button>
          <Button type="submit" className="flex-1" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {C.confirmarPedido}
          </Button>
        </div>
      </form>
    );
  }

  // ───────────────────── Confirmación ─────────────────────
  return (
    <div className="space-y-4 py-2 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
        <Check className="h-6 w-6" />
      </span>
      <div>
        <h3 className="font-display text-lg font-semibold text-foreground">{C.pedidoOkTitulo}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{C.pedidoOkSub}</p>
      </div>
      <Button variant="outline" className="w-full" onClick={() => onClose?.()}>
        Listo
      </Button>
    </div>
  );
}

function Header({ title, description }: { title: string; description?: string }) {
  return (
    <div className="space-y-1">
      <h3 className="flex items-center gap-2 font-display text-base font-semibold text-foreground">
        <Tv className="h-4 w-4 text-primary" />
        {title}
      </h3>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}

function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-xs text-muted-foreground transition-colors hover:text-foreground"
    >
      ← Volver
    </button>
  );
}

/** Comparación de tres filas: mensual paga, anual y contrato sin costo. */
export function PriceComparison() {
  return (
    <div className="space-y-1.5">
      <Row label={C.planMensual} value={formatCop(VISUALIA_DEVICE_PRICE_COP)} />
      <Row label={C.pagoAnual} value={`Te ahorras ${formatCop(VISUALIA_DEVICE_PRICE_COP)}`} highlight />
      <Row label={C.contratoAnual} value={C.sinCosto} highlight />
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={`flex items-baseline justify-between gap-3 rounded-lg px-3 py-2 text-sm ${
        highlight ? "bg-primary/10 text-primary" : "text-muted-foreground"
      }`}
    >
      <span className={highlight ? "font-medium" : ""}>{label}</span>
      <span className="flex items-center gap-2">
        {highlight && (
          <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
            {C.incluido}
          </span>
        )}
        <span className="v-numeric font-semibold">{value}</span>
      </span>
    </div>
  );
}
