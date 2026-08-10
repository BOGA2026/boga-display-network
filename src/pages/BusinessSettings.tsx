import { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Building2, Check, Clock3, HardDrive, Image as ImageIcon, Loader2, Monitor, ArrowRight, AlertTriangle } from "lucide-react";
import { useTenant } from "@/features/auth/useTenant";
import {
  useBusinessUsage,
  useSaveBusinessSettings,
  uploadBusinessLogo,
  type BusinessSettingsPatch,
} from "@/features/settings/api";
import {
  BUSINESS_CATEGORIES,
  DURATION_OPTIONS,
  EXPIRY_OPTIONS,
  STORAGE_WARN_RATIO,
  TIMEZONE_OPTIONS,
  formatGB,
} from "@/config/businessSettings";
import { NAV } from "@/config/lexicon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/** Confirmación discreta: aparece junto al campo recién guardado. */
function SavedHint({ visible }: { visible: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[11px] text-emerald-400 transition-opacity",
        visible ? "opacity-100" : "opacity-0",
      )}
      aria-live="polite"
    >
      <Check className="h-3 w-3" /> Guardado
    </span>
  );
}

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Building2;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="v-card p-5">
      <header className="mb-4 flex items-start gap-3 border-b border-border/30 pb-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </header>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  saved,
  children,
}: {
  label: string;
  hint: string;
  saved?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5 md:grid-cols-[minmax(0,1fr)_320px] md:items-start md:gap-6">
      <div>
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">{label}</Label>
          <SavedHint visible={!!saved} />
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
      </div>
      <div>{children}</div>
    </div>
  );
}

export default function BusinessSettings() {
  const tenant = useTenant();
  const { toast } = useToast();
  const { data: usage } = useBusinessUsage(tenant.businessId);
  const save = useSaveBusinessSettings(tenant.businessId, tenant.userId);
  const canEdit = tenant.hasRole(["owner", "admin"]);

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(tenant.businessName ?? "");
    setCity(tenant.city ?? "");
  }, [tenant.businessName, tenant.city]);

  const commit = async (key: string, patch: BusinessSettingsPatch) => {
    try {
      await save.mutateAsync(patch);
      setSavedKey(key);
      window.setTimeout(() => setSavedKey((k) => (k === key ? null : k)), 2200);
    } catch (e: any) {
      toast({ title: "No se pudo guardar", description: e.message, variant: "destructive" });
    }
  };

  const handleLogo = async (file: File) => {
    if (!tenant.businessId) return;
    setUploadingLogo(true);
    try {
      const url = await uploadBusinessLogo(tenant.businessId, file);
      await commit("logo", { logo_url: url });
    } catch (e: any) {
      toast({ title: "No se pudo subir el logo", description: e.message, variant: "destructive" });
    } finally {
      setUploadingLogo(false);
    }
  };

  const ratio = usage?.ratio ?? 0;
  const pct = Math.min(100, Math.round(ratio * 100));
  const full = ratio >= 1;
  const warn = ratio >= STORAGE_WARN_RATIO;

  return (
    <div className="v-page">
      <Helmet>
        <title>Ajustes del negocio · Visualia</title>
      </Helmet>

      <header className="mb-6">
        <h1 className="font-display text-2xl font-bold">Ajustes del negocio</h1>
        <p className="text-sm text-muted-foreground">
          Datos, cupo del plan y valores por defecto del contenido. Todo se guarda solo al cambiarlo.
        </p>
      </header>

      {!canEdit && (
        <div className="mb-5 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-300">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Solo el dueño o un administrador puede modificar estos ajustes. Estás viendo la configuración actual.
        </div>
      )}

      <div className="mx-auto grid max-w-4xl gap-5">
        {/* ───────── Datos del negocio ───────── */}
        <Section
          icon={Building2}
          title="Datos del negocio"
          description="Identidad del local. Alimentan los menús generados con IA y los reportes."
        >
          <Field label="Nombre del negocio" hint="Aparece en el panel, en los reportes y en las piezas generadas." saved={savedKey === "name"}>
            <Input
              value={name}
              disabled={!canEdit}
              maxLength={120}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => {
                const v = name.trim();
                if (v && v !== tenant.businessName) commit("name", { name: v });
              }}
            />
          </Field>

          <Field label="Categoría" hint="Ajusta las plantillas y sugerencias de la generación con IA." saved={savedKey === "category"}>
            <Select
              value={tenant.category ?? undefined}
              disabled={!canEdit}
              onValueChange={(v) => commit("category", { category: v })}
            >
              <SelectTrigger><SelectValue placeholder="Elige una categoría" /></SelectTrigger>
              <SelectContent>
                {BUSINESS_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Ciudad" hint="Se usa en el mapa de la red y en el soporte." saved={savedKey === "city"}>
            <Input
              value={city}
              disabled={!canEdit}
              maxLength={120}
              placeholder="Bogotá"
              onChange={(e) => setCity(e.target.value)}
              onBlur={() => {
                const v = city.trim();
                if (v !== (tenant.city ?? "")) commit("city", { city: v || null });
              }}
            />
          </Field>

          <Field
            label="Zona horaria"
            hint="Con esta hora se interpreta toda la programación. Si está mal, las pantallas se apagan a la hora equivocada."
            saved={savedKey === "timezone"}
          >
            <Select
              value={tenant.timezone}
              disabled={!canEdit}
              onValueChange={(v) => commit("timezone", { timezone: v })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIMEZONE_OPTIONS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Logo del negocio" hint="Se usa como marca en los menús y diseños generados con IA. PNG o SVG con fondo transparente." saved={savedKey === "logo"}>
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/40 bg-muted/30">
                {tenant.logoUrl ? (
                  <img src={tenant.logoUrl} alt="Logo del negocio" className="h-full w-full object-contain" />
                ) : (
                  <ImageIcon className="h-5 w-5 text-muted-foreground/50" />
                )}
              </div>
              <input
                ref={logoInput}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleLogo(f);
                  e.target.value = "";
                }}
              />
              <Button variant="outline" size="sm" disabled={!canEdit || uploadingLogo} onClick={() => logoInput.current?.click()}>
                {uploadingLogo ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
                {tenant.logoUrl ? "Cambiar logo" : "Subir logo"}
              </Button>
              {tenant.logoUrl && canEdit && (
                <Button variant="ghost" size="sm" onClick={() => commit("logo", { logo_url: null })}>
                  Quitar
                </Button>
              )}
            </div>
          </Field>
        </Section>

        {/* ───────── Uso y plan ───────── */}
        <Section
          icon={HardDrive}
          title="Uso y plan"
          description="Consumo real de tu cuenta, medido sobre los archivos que tienes guardados."
        >
          <div>
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <span className="text-sm font-medium">Almacenamiento</span>
              <span className={cn("v-numeric text-sm", full ? "text-destructive" : warn ? "text-amber-400" : "text-foreground")}>
                {formatGB(usage?.usedBytes ?? 0)} de {formatGB(usage?.limitBytes ?? 0)}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted/40">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  full ? "bg-destructive" : warn ? "bg-amber-400" : "bg-primary",
                )}
                style={{ width: `${Math.max(pct, usage && usage.usedBytes > 0 ? 2 : 0)}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {usage?.contentCount ?? 0} piezas en la biblioteca. El cupo se libera al eliminar archivos.
            </p>
            {full && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
                <AlertTriangle className="h-3.5 w-3.5" />
                Llegaste al límite del plan: no se pueden subir archivos nuevos hasta liberar espacio o ampliar el plan.
              </p>
            )}
            {warn && !full && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-400">
                <AlertTriangle className="h-3.5 w-3.5" />
                Usaste más del 80% del cupo.{" "}
                <Link to={NAV.suscripcion.path} className="underline underline-offset-2">Ampliar el plan</Link>
              </p>
            )}
          </div>

          <div>
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <Monitor className="h-3.5 w-3.5 text-muted-foreground" /> Pantallas
              </span>
              <span className="v-numeric text-sm">
                {usage?.screensUsed ?? 0} de {usage?.screensLicensed ?? 0} contratadas
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Cada pantalla activa consume una licencia del plan.
            </p>
          </div>

          <Link
            to={NAV.suscripcion.path}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            Ver mi suscripción <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Section>

        {/* ───────── Valores por defecto ───────── */}
        <Section
          icon={Clock3}
          title="Valores por defecto del contenido"
          description="Se aplican a cada pieza nueva. Siempre puedes cambiarlos pieza por pieza."
        >
          <Field
            label="Duración predeterminada"
            hint="Cuántos segundos se muestra una imagen recién subida antes de pasar a la siguiente."
            saved={savedKey === "duration"}
          >
            <Select
              value={String(tenant.defaultDurationSeconds)}
              disabled={!canEdit}
              onValueChange={(v) => commit("duration", { default_duration_seconds: Number(v) })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DURATION_OPTIONS.map((d) => (
                  <SelectItem key={d} value={String(d)}>{d} segundos</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field
            label="Vigencia predeterminada"
            hint="A los cuántos días vence el contenido nuevo. Evita que una promoción de temporada siga en pantalla tres meses después."
            saved={savedKey === "expiry"}
          >
            <Select
              value={tenant.defaultExpiryDays === null ? "nunca" : String(tenant.defaultExpiryDays)}
              disabled={!canEdit}
              onValueChange={(v) =>
                commit("expiry", { default_expiry_days: v === "nunca" ? null : Number(v) })
              }
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {EXPIRY_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <p className="rounded-lg border border-border/30 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
            En Contenido, las piezas que vencen en menos de 7 días se marcan en ámbar y las vencidas en rojo.
            Las pantallas no reproducen contenido vencido.
          </p>
        </Section>

        <DeletedScreensCard />
      </div>

    </div>
  );
}
