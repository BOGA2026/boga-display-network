/**
 * "Tu marca" — se define una vez y de acá leen el generador con IA y el editor.
 *
 * Una columna de 800 px, una tarjeta `.v-card` por bloque y guardado
 * automático: es una pantalla que se visita pocas veces y se llena una vez.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  Trash2,
  Check,
  Copy,
  AlertTriangle,
  Sparkles,
  ImagePlus,
  LayoutTemplate,
  PenTool,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { storageThumb } from "@/lib/storageImage";
import { EmptyState } from "@/components/feedback/states";
import {
  BRAND_COLOR_FIELDS,
  DEFAULT_BRAND,
  LOGO_SLOTS,
  useAddBrandPhoto,
  useBrandKit,
  useBrandPhotos,
  useBrandTemplates,
  useDeleteBrandPhoto,
  useSaveBrandKit,
  uploadBrandFile,
  type BrandColorKey,
  type BrandKit,
  type LogoSlot,
} from "./api";
import {
  BRAND_FONTS,
  DEFAULT_BODY_FONT,
  DEFAULT_HEADING_FONT,
  ensureAllBrandFonts,
  ensureFont,
} from "./fonts";
import {
  MIN_TV_CONTRAST,
  contrastRatio,
  deriveLogoVariants,
  extractPalette,
  isHex,
  normalizeHex,
} from "./colors";

/** Tablero de cuadros: delata al instante un logo sin transparencia. */
const CHECKER: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(45deg, hsl(var(--muted)) 25%, transparent 25%), linear-gradient(-45deg, hsl(var(--muted)) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, hsl(var(--muted)) 75%), linear-gradient(-45deg, transparent 75%, hsl(var(--muted)) 75%)",
  backgroundSize: "16px 16px",
  backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
};

function Section({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="v-card p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-semibold">{title}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function BrandSection() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { data: kit, isLoading } = useBrandKit();
  const save = useSaveBrandKit();
  const { data: photos = [] } = useBrandPhotos();
  const addPhoto = useAddBrandPhoto();
  const deletePhoto = useDeleteBrandPhoto();
  const { data: templates = [] } = useBrandTemplates();

  const [local, setLocal] = useState<BrandKit | null>(null);
  const [subiendo, setSubiendo] = useState<LogoSlot | null>(null);
  const [dragSlot, setDragSlot] = useState<LogoSlot | null>(null);
  const [sugeridos, setSugeridos] = useState<string[]>([]);
  const [avisoColores, setAvisoColores] = useState(false);
  const [recorte, setRecorte] = useState(false);
  const inputs = useRef<Partial<Record<LogoSlot, HTMLInputElement | null>>>({});
  const fotoInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (kit) setLocal(kit);
  }, [kit]);

  useEffect(() => {
    ensureAllBrandFonts();
  }, []);

  const b = local;

  const guardar = useCallback(
    (patch: Partial<Omit<BrandKit, "business_id">>) => {
      setLocal((prev) => (prev ? { ...prev, ...patch } : prev));
      save.mutate(patch, {
        onError: (e: any) =>
          toast({ title: "No pudimos guardar", description: e.message, variant: "destructive" }),
      });
    },
    [save, toast],
  );

  /* ── Logos ── */

  /**
   * Al subir el logo principal hacemos el trabajo que nadie quiere hacer a mano:
   * leerle los colores y sacar las versiones clara y oscura. Todo en el
   * navegador, sobre el archivo local, para no depender de CORS del bucket.
   */
  const subirLogo = useCallback(
    async (slot: LogoSlot, file: File) => {
      setSubiendo(slot);
      const objectUrl = URL.createObjectURL(file);
      try {
        const url = await uploadBrandFile(file, "logos");
        const patch: Partial<BrandKit> = { [slot]: url } as Partial<BrandKit>;

        if (slot === "logo_url") {
          // 1. Colores del logo.
          try {
            const paleta = await extractPalette(objectUrl);
            if (paleta.length) {
              setSugeridos(paleta);
              const sinTocar =
                b?.primary_color === DEFAULT_BRAND.primary_color &&
                b?.secondary_color === DEFAULT_BRAND.secondary_color;
              if (sinTocar) {
                patch.primary_color = paleta[0];
                if (paleta[1]) patch.secondary_color = paleta[1];
                if (paleta[2]) patch.accent_color = paleta[2];
                setSugeridos([]);
                setAvisoColores(true);
              }
            }
          } catch {
            /* formato raro: seguimos sin sugerencias */
          }

          // 2. Versiones clara y oscura.
          try {
            const v = await deriveLogoVariants(objectUrl);
            const [claro, oscuro, transparente] = await Promise.all([
              uploadBrandFile(v.claro, "logos", "logo-claro.png"),
              uploadBrandFile(v.oscuro, "logos", "logo-oscuro.png"),
              v.recorto ? uploadBrandFile(v.transparente, "logos", "logo-recortado.png") : Promise.resolve(url),
            ]);
            patch.logo_url = transparente;
            patch.logo_dark_url = claro;
            patch.logo_light_url = oscuro;
            if (!b?.logo_symbol_url) patch.logo_symbol_url = transparente;
            setRecorte(v.recorto);
          } catch {
            // Si no se pudo derivar, al menos el principal cubre las ranuras vacías.
            LOGO_SLOTS.forEach(({ key }) => {
              if (key !== "logo_url" && b && !b[key]) (patch as any)[key] = url;
            });
          }
        }

        guardar(patch);
        toast({ title: "Logo cargado" });
      } catch (e: any) {
        toast({ title: "No pudimos subir el logo", description: e.message, variant: "destructive" });
      } finally {
        URL.revokeObjectURL(objectUrl);
        setSubiendo(null);
      }
    },
    [b, guardar, toast],
  );

  /** Rehace versiones y paleta desde el logo que ya está guardado. */
  const reprocesar = useCallback(
    async (que: "versiones" | "colores") => {
      if (!b?.logo_url) return;
      setSubiendo("logo_url");
      try {
        if (que === "colores") {
          const paleta = await extractPalette(b.logo_url);
          if (!paleta.length) throw new Error("No encontramos colores claros en el logo");
          setSugeridos(paleta);
        } else {
          const v = await deriveLogoVariants(b.logo_url);
          const [claro, oscuro] = await Promise.all([
            uploadBrandFile(v.claro, "logos", "logo-claro.png"),
            uploadBrandFile(v.oscuro, "logos", "logo-oscuro.png"),
          ]);
          guardar({ logo_dark_url: claro, logo_light_url: oscuro });
          setRecorte(v.recorto);
          toast({ title: "Versiones actualizadas" });
        }
      } catch (e: any) {
        toast({ title: "No pudimos leer el logo", description: e.message, variant: "destructive" });
      } finally {
        setSubiendo(null);
      }
    },
    [b, guardar, toast],
  );


  /* ── Colores ── */

  const cambiarColor = (key: BrandColorKey, value: string) => {
    const hex = normalizeHex(value);
    setLocal((prev) => (prev ? { ...prev, [key]: hex } : prev));
    if (!isHex(hex)) return;
    guardar({ [key]: hex } as Partial<BrandKit>);
    setAvisoColores(true);
  };

  const copiar = (hex: string) => {
    navigator.clipboard?.writeText(hex);
    toast({ title: `${hex} copiado` });
  };

  const ratio = useMemo(
    () => (b ? contrastRatio(b.text_color || "#FFFFFF", b.background_color || "#000000") : 21),
    [b],
  );

  const vacio =
    !!b &&
    !b.logo_url &&
    !b.logo_dark_url &&
    !b.logo_light_url &&
    !b.logo_symbol_url &&
    b.primary_color === DEFAULT_BRAND.primary_color;

  if (isLoading || !b) {
    return <div className="mx-auto max-w-[800px] space-y-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="v-card h-40 animate-pulse" />
      ))}
    </div>;
  }

  if (vacio) {
    return (
      <div className="mx-auto max-w-[800px]">
        <input
          ref={(el) => (inputs.current.logo_url = el)}
          type="file"
          accept="image/png,image/svg+xml,image/webp,image/jpeg"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) subirLogo("logo_url", f);
            e.target.value = "";
          }}
        />
        <EmptyState
          icon={<Sparkles className="h-9 w-9" />}
          title="Define tu marca una sola vez"
          description="Sube tu logo y elige tus colores. Todos los menús que generes van a usarlos automáticamente."
          action={
            <Button
              size="lg"
              className="gradient-primary hover:gradient-primary-hover glow-primary gap-2 border-0 px-8 font-semibold text-primary-foreground"
              onClick={() => inputs.current.logo_url?.click()}
              disabled={subiendo === "logo_url"}
            >
              <Upload className="h-5 w-5" />
              {subiendo === "logo_url" ? "Subiendo…" : "Subir mi logo"}
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[800px] space-y-4">
      {/* 1. LOGOS */}
      <Section
        title="Logos"
        description="Hasta cuatro versiones. Si solo subes la principal, la usamos en las demás."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {LOGO_SLOTS.map(({ key, label, hint }) => (
            <div key={key} className="space-y-1.5">
              <input
                ref={(el) => (inputs.current[key] = el)}
                type="file"
                accept="image/png,image/svg+xml,image/webp,image/jpeg"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) subirLogo(key, f);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => inputs.current[key]?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragSlot(key);
                }}
                onDragLeave={() => setDragSlot(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragSlot(null);
                  const f = e.dataTransfer.files?.[0];
                  if (f) subirLogo(key, f);
                }}
                style={CHECKER}
                className={cn(
                  "relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-border/60 transition-colors",
                  dragSlot === key && "border-primary",
                )}
                aria-label={`Subir logo ${label}`}
              >
                {b[key] ? (
                  <img
                    src={b[key] as string}
                    alt={`Logo ${label}`}
                    className="h-full w-full object-contain p-3"
                  />
                ) : (
                  <span className="flex flex-col items-center gap-1 text-muted-foreground">
                    <Upload className="h-4 w-4" />
                    <span className="text-[11px]">
                      {subiendo === key ? "Subiendo…" : "Arrastra o haz clic"}
                    </span>
                  </span>
                )}
              </button>
              <p className="text-xs font-medium">{label}</p>
              <p className="text-[11px] leading-tight text-muted-foreground">{hint}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="max-w-[420px] text-xs text-muted-foreground">
            {recorte
              ? "Tu logo venía con fondo blanco: lo recortamos para que salga limpio sobre cualquier color."
              : "Los cuadros grises de atrás te dejan ver si el logo tiene fondo transparente. Si ves un rectángulo blanco, ese logo va a salir con recuadro en la pantalla. Acepta PNG y SVG."}
          </p>
          {b.logo_url && (
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              disabled={subiendo === "logo_url"}
              onClick={() => reprocesar("versiones")}
            >
              <Sparkles className="h-4 w-4" />
              {subiendo === "logo_url" ? "Generando…" : "Volver a generar versiones"}
            </Button>
          )}
        </div>
      </Section>

      {/* 2. COLORES */}
      <Section
        title="Colores"
        description="Los que usan tus menús y todo lo que genere la IA."
        action={
          b.logo_url ? (
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              disabled={subiendo === "logo_url"}
              onClick={() => reprocesar("colores")}
            >
              <Sparkles className="h-4 w-4" />
              Tomar los del logo
            </Button>
          ) : undefined
        }
      >
        {sugeridos.length > 0 && (
          <div className="mb-4 rounded-xl border border-primary/30 bg-primary/5 p-3">
            <p className="text-sm font-medium">Colores que encontramos en tu logo</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Confírmalos y los usamos como primario, secundario y acento.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {sugeridos.map((c) => (
                <span
                  key={c}
                  className="flex items-center gap-2 rounded-lg border border-border/50 px-2 py-1 text-xs"
                >
                  <span className="h-4 w-4 rounded" style={{ backgroundColor: c }} />
                  {c}
                </span>
              ))}
              <div className="ml-auto flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    guardar({
                      primary_color: sugeridos[0] ?? b.primary_color,
                      secondary_color: sugeridos[1] ?? b.secondary_color,
                      accent_color: sugeridos[2] ?? b.accent_color,
                    });
                    setSugeridos([]);
                    setAvisoColores(true);
                  }}
                >
                  Usar estos colores
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSugeridos([])}>
                  Ahora no
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          {BRAND_COLOR_FIELDS.map(({ key, label, hint }) => {
            const value = (b[key] as string | null) ?? "";
            return (
              <div key={key} className="flex items-center gap-3 rounded-xl border border-border/40 p-2.5">
                <label className="relative h-10 w-10 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-border/60">
                  <span className="block h-full w-full" style={{ backgroundColor: value || "#000000" }} />
                  <input
                    type="color"
                    value={isHex(value) ? value : "#000000"}
                    onChange={(e) => cambiarColor(key, e.target.value)}
                    className="absolute inset-0 cursor-pointer opacity-0"
                    aria-label={`Elegir color ${label}`}
                  />
                </label>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{label}</span>
                    <button
                      type="button"
                      onClick={() => value && copiar(value)}
                      className="text-muted-foreground transition-colors hover:text-foreground"
                      aria-label={`Copiar ${label}`}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="truncate text-[11px] text-muted-foreground">{hint}</p>
                </div>
                <Input
                  value={value}
                  onChange={(e) => cambiarColor(key, e.target.value)}
                  placeholder="#000000"
                  className="h-9 w-[110px] font-mono text-xs uppercase"
                />
              </div>
            );
          })}
        </div>

        {ratio < MIN_TV_CONTRAST && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-400/40 bg-amber-400/5 p-3 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <p className="text-foreground">
              Tu texto sobre tu fondo tiene un contraste de {ratio.toFixed(1)}:1. Para que se lea a
              cuatro metros hace falta al menos {MIN_TV_CONTRAST}:1. Aclara el texto u oscurece el
              fondo.
            </p>
          </div>
        )}

        {avisoColores && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3">
            <p className="min-w-[200px] flex-1 text-sm">
              Cambiaste tus colores. Los diseños que ya creaste siguen con los colores viejos.
            </p>
            <Button size="sm" variant="outline" onClick={() => navigate("/dashboard/contenido")}>
              Revisar mis diseños
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setAvisoColores(false)}>
              Dejarlos como están
            </Button>
          </div>
        )}
      </Section>

      {/* 3. TIPOGRAFÍAS */}
      <Section title="Tipografías" description="Una para los títulos y otra para el resto del texto.">
        <div className="grid gap-5 sm:grid-cols-2">
          {(
            [
              { campo: "heading_font" as const, label: "Títulos", muestra: "Menú del día", size: 22 },
              { campo: "body_font" as const, label: "Cuerpo", muestra: "Bandeja paisa · $32.000", size: 15 },
            ]
          ).map(({ campo, label, muestra, size }) => {
            const actual =
              b[campo] ?? (campo === "heading_font" ? DEFAULT_HEADING_FONT : DEFAULT_BODY_FONT);
            return (
              <div key={campo} className="space-y-2">
                <p className="text-sm font-medium">{label}</p>
                <div className="max-h-[260px] space-y-1.5 overflow-y-auto pr-1">
                  {BRAND_FONTS.map((f) => (
                    <button
                      key={f.family}
                      type="button"
                      onMouseEnter={() => ensureFont(f.family)}
                      onClick={() => guardar({ [campo]: f.family } as Partial<BrandKit>)}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-lg border p-2.5 text-left transition-colors",
                        actual === f.family
                          ? "border-primary bg-primary/10"
                          : "border-border/40 hover:border-border",
                      )}
                    >
                      <span className="min-w-0">
                        <span
                          className="block truncate"
                          style={{ fontFamily: `'${f.family}', sans-serif`, fontSize: size }}
                        >
                          {muestra}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {f.family} · {f.descripcion}
                        </span>
                      </span>
                      {actual === f.family && <Check className="h-4 w-4 shrink-0 text-primary" />}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Solo estas familias porque son las que tu pantalla puede mostrar sin fallar.
        </p>
      </Section>

      {/* 4. PLANTILLAS */}
      <Section
        title="Plantillas de tu marca"
        description="Diseños guardados para reutilizar. Guardan la estructura, no los platos."
        action={
          <Button size="sm" variant="outline" className="gap-2" onClick={() => navigate("/dashboard/editor")}>
            <PenTool className="h-4 w-4" />
            Crear una
          </Button>
        }
      >
        {templates.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/50 p-6 text-center text-sm text-muted-foreground">
            Todavía no has guardado plantillas. En el editor, usa «Guardar como preset» y aparecerán
            acá.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {templates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => navigate(`/dashboard/editor?preset=${t.id}&marca=1`)}
                className="v-card-interactive overflow-hidden rounded-xl border border-border/40 text-left"
              >
                <div className="flex aspect-video items-center justify-center bg-muted/30">
                  {t.thumbnail_url ? (
                    <img
                      src={storageThumb(t.thumbnail_url, { width: 320 })}
                      alt={t.name}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <LayoutTemplate className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="p-2">
                  <p className="truncate text-xs font-medium">{t.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(t.created_at).toLocaleDateString("es-CO", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </Section>

      {/* 5. FOTOS DEL NEGOCIO */}
      <Section
        title="Fotos de tu negocio"
        description="Fachada, platos estrella, tu equipo. La IA las usa cuando necesita una foto real."
        action={
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={() => fotoInput.current?.click()}
            disabled={addPhoto.isPending}
          >
            <ImagePlus className="h-4 w-4" />
            {addPhoto.isPending ? "Subiendo…" : "Agregar foto"}
          </Button>
        }
      >
        <input
          ref={fotoInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f)
              addPhoto.mutate(f, {
                onError: (err: any) =>
                  toast({ title: "No pudimos subir la foto", description: err.message, variant: "destructive" }),
              });
            e.target.value = "";
          }}
        />
        {photos.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/50 p-6 text-center text-sm text-muted-foreground">
            Todavía no hay fotos. Sube dos o tres y tus menús dejan de verse genéricos.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {photos.map((p) => (
              <div key={p.id} className="group relative overflow-hidden rounded-xl border border-border/40">
                <img
                  src={storageThumb(p.url, { width: 320 })}
                  alt={p.name}
                  loading="lazy"
                  className="aspect-square w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => deletePhoto.mutate(p.id)}
                  className="absolute right-1.5 top-1.5 rounded-md bg-background/80 p-1.5 opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                  aria-label={`Eliminar ${p.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
