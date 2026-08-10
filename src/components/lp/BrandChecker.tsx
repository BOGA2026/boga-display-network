import { useState } from "react";
import { CheckCircle2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import InlineVideo from "@/components/media/InlineVideo";
import { COMPAT_CLIPS } from "@/config/compatibilityMedia";
import { TV_BRANDS, VISUALIA_DEVICE_PRICE_COP, formatCop } from "@/config/devices";
import BrandLogo, { brandColor, isWordmark } from "@/components/lp/BrandLogo";
import { getAttribution, setTvChoice, trackConversion } from "@/lib/attribution";

type Answer = "compatible" | "necesita" | "preguntar" | null;

/**
 * Verificador de marcas de la landing de campañas.
 *
 * Es una decisión con dos salidas, no un catálogo: el bloque del dispositivo
 * (precio y video) no existe hasta que la persona elige una marca que lo
 * necesita. Mostrarlo antes le pone precio a quien no lo va a pagar.
 */
export default function BrandChecker() {
  const [brand, setBrand] = useState<string | null>(null);
  const [answer, setAnswer] = useState<Answer>(null);

  const pick = (id: string) => {
    const verdict = TV_BRANDS.find((t) => t.id === id)?.verdict ?? "desconocido";
    setBrand(id);
    const next: Answer =
      verdict === "probable" ? "compatible" : verdict === "necesita_dispositivo" ? "necesita" : "preguntar";
    setAnswer(next);
    // "Otra marca" todavía no es una respuesta: no se guarda hasta que responda.
    if (next !== "preguntar") setTvChoice(id, next === "necesita");
  };

  /** Resuelve el caso "Otra marca" según lo que la persona ve en su televisor. */
  const resolveUnknown = (needsDevice: boolean) => {
    setAnswer(needsDevice ? "necesita" : "compatible");
    setTvChoice(brand ?? "otra", needsDevice);
  };

  /** Enlace al alta con la elección puesta en la URL. */
  const registerHref = (needsDevice: boolean) => {
    const plan = getAttribution().plan;
    return `/registro?marca=${encodeURIComponent(brand ?? "otra")}&dispositivo=${
      needsDevice ? "si" : "no"
    }${plan ? `&plan=${plan}` : ""}`;
  };

  const goRegister = (needsDevice: boolean) => {
    setTvChoice(brand ?? "otra", needsDevice);
    trackConversion("tv_check_cta", { tv_brand: brand ?? "otra", needs_device: needsDevice });
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 p-4 md:p-6">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:gap-3">
        {TV_BRANDS.filter(
          (b, i, all) =>
            b.id !== "no_se" &&
            // Defensa contra duplicados: una marca repetida en la lista se pinta
            // dos veces y parece un error del producto.
            all.findIndex((o) => o.name.toLowerCase() === b.name.toLowerCase()) === i,
        ).map((b) => {
          const active = brand === b.id;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => pick(b.id)}
              aria-pressed={active}
              style={{ ["--brand" as string]: brandColor(b.id) }}
              className={`group flex h-[72px] flex-col items-center justify-center gap-2 rounded-xl border px-2 transition ${
                active
                  ? "border-primary bg-primary/15"
                  : "border-border/50 bg-card/40 hover:border-primary/50"
              }`}
            >
              <BrandLogo id={b.id} name={b.name} active={active} />
              {/* Con logo el nombre acompaña; con wordmark ya está escrito y
                  repetirlo se ve como error, así que queda solo para lectores. */}
              <span
                className={
                  isWordmark(b.id)
                    ? "sr-only"
                    : `text-[11px] leading-none ${
                        active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                      }`
                }
              >
                {b.name}
              </span>
            </button>
          );
        })}
      </div>

      {answer && (
        <div className="mt-5 animate-fade-in">
          {/* RESULTADO A — el televisor sirve solo */}
          {answer === "compatible" && (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-4 md:p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" aria-hidden="true" />
                <div>
                  <h3 className="text-base font-semibold text-foreground">Tu televisor sirve</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    No necesitas comprar ningún equipo adicional. Instalas la aplicación de Visualia desde la
                    tienda de tu televisor y listo.
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Confirma que en el menú de aplicaciones te aparezca Google Play Store. Si está, ya puedes
                    empezar.
                  </p>
                </div>
              </div>
              <Button asChild className="mt-4 w-full">
                <a href={registerHref(false)} onClick={() => goRegister(false)}>
                  Crear mi cuenta
                </a>
              </Button>
            </div>
          )}

          {/* RESULTADO B — hace falta el dispositivo */}
          {answer === "necesita" && (
            <div className="rounded-xl border border-primary/50 bg-primary/5 p-4 md:p-5">
              <div className="flex items-start gap-3">
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    Tu televisor necesita un dispositivo
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Los televisores Samsung y LG no usan Android, así que no pueden instalar aplicaciones como
                    la nuestra. Se resuelve con un aparato pequeño que se conecta al HDMI.
                  </p>
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-xl">
                <InlineVideo
                  sources={COMPAT_CLIPS.dispositivo.sources}
                  poster={COMPAT_CLIPS.dispositivo.poster}
                  label="El dispositivo que se conecta al HDMI del televisor"
                />
              </div>

              {/* Informativo, no seleccionable: el plan se elige en el bloque
                  de precio. Se muestra en tono neutro para que no parezca una
                  opción marcada. */}
              <div className="mt-4 rounded-xl border border-border/50 bg-card/40 px-4 py-3 text-sm text-muted-foreground">
                Cuesta {formatCop(VISUALIA_DEVICE_PRICE_COP)} con el plan mensual y va incluido si pagas
                el año por adelantado.
              </div>

              <Button asChild className="mt-4 w-full">
                <a href={registerHref(true)} onClick={() => goRegister(true)}>
                  Crear mi cuenta con dispositivo
                </a>
              </Button>
            </div>
          )}

          {/* RESULTADO C — no sabemos la marca: que mire su televisor */}
          {answer === "preguntar" && (
            <div className="rounded-xl border border-border/60 bg-background/40 p-4 md:p-5">
              <h3 className="text-base font-semibold text-foreground">Búscalo en tu televisor</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Entra al menú de aplicaciones de tu televisor y busca Google Play Store.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Button onClick={() => resolveUnknown(false)}>Sí, la veo</Button>
                <Button variant="outline" onClick={() => resolveUnknown(true)}>
                  No la encuentro
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
