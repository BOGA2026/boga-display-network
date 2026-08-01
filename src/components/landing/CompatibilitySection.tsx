import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Info, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import SequenceVideo, { type SequenceClip } from "@/components/media/SequenceVideo";
import { COMPAT_CLIPS } from "@/config/compatibilityMedia";
import { TV_BRANDS, VISUALIA_DEVICE_PRICE_COP, formatCop } from "@/config/devices";
import { SUPPORT_WHATSAPP_NUMBER } from "@/config/support";
import { supabase } from "@/integrations/supabase/client";


type Answer = "compatible" | "necesita" | "preguntar" | null;

const WHATSAPP_URL = `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Hola, tengo dudas sobre si mi televisor sirve para Visualia",
)}`;

function visitorId(): string {
  try {
    const key = "visualia_visitor_id";
    let v = localStorage.getItem(key);
    if (!v) {
      v = crypto.randomUUID();
      localStorage.setItem(key, v);
    }
    return v;
  } catch {
    return "anon";
  }
}

/** Registro anónimo de qué marca consulta cada visitante. */
async function logBrandCheck(brandId: string, verdict: string) {
  try {
    await supabase.from("landing_brand_checks").insert({
      brand_id: brandId,
      verdict,
      visitor_id: visitorId(),
      path: typeof window !== "undefined" ? window.location.pathname : null,
    });
  } catch {
    /* la analítica nunca puede romper la página */
  }
}

const STEPS = [
  {
    clip: COMPAT_CLIPS.paso1,
    title: "Conectalo al HDMI",
    desc: "Enchufás el aparatito en la entrada HDMI del televisor y a la corriente.",
  },
  {
    clip: COMPAT_CLIPS.paso2,
    title: "Vinculá tu pantalla",
    desc: "El televisor muestra un código y vos lo escribís una sola vez desde tu celular.",
  },
  {
    clip: COMPAT_CLIPS.paso3,
    title: "Listo, ya estás al aire",
    desc: "Tu menú aparece en pantalla y lo cambiás cuando quieras desde el celular.",
  },
];

export default function CompatibilitySection() {
  const [brand, setBrand] = useState<string | null>(null);
  const [answer, setAnswer] = useState<Answer>(null);

  const pickBrand = (id: string) => {
    const b = TV_BRANDS.find((t) => t.id === id);
    const verdict = b?.verdict ?? "desconocido";
    setBrand(id);
    setAnswer(
      verdict === "probable" ? "compatible" : verdict === "necesita_dispositivo" ? "necesita" : "preguntar",
    );
    void logBrandCheck(id, verdict);
  };

  const landingBrands = TV_BRANDS.filter((b) => b.id !== "no_se");

  return (
    <section id="compatibilidad" className="px-4 py-16 md:px-6 md:py-24" aria-labelledby="compatibilidad-title">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 max-w-2xl">
          <p className="mb-2 text-xs font-medium uppercase tracking-widest text-primary">Antes de empezar</p>
          <h2 id="compatibilidad-title" className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            ¿Sirve mi televisor?
          </h2>
          <p className="mt-3 text-muted-foreground">Depende de la marca. Averigualo en dos clics.</p>
        </div>

        {/* BLOQUE 1 — Verificador */}
        <div className="bento-card p-5 md:p-7">
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">
            {landingBrands.map((b) => {
              const active = brand === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => pickBrand(b.id)}
                  aria-pressed={active}
                  className={`flex h-16 items-center justify-center rounded-xl border px-2 text-center text-sm font-semibold transition ${
                    active
                      ? "border-primary bg-primary/15 text-foreground"
                      : "border-border/50 bg-card/40 text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  }`}
                >
                  {b.name}
                </button>
              );
            })}
          </div>

          {answer && (
            <div className="mt-6 animate-fade-in rounded-xl border border-border/50 bg-card/40 p-5">
              {answer === "compatible" && (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-400" aria-hidden="true" />
                  <div>
                    <p className="font-display text-lg font-semibold text-foreground">
                      Tu televisor probablemente ya funciona.
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Solo confirmá que en el menú de aplicaciones te aparezca Google Play Store. Si está, no
                      necesitás comprar nada más.
                    </p>
                    <Button asChild className="mt-4">
                      <Link to="/register">Empezar ahora</Link>
                    </Button>
                  </div>
                </div>
              )}

              {answer === "necesita" && (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  <Info className="h-6 w-6 shrink-0 text-primary" aria-hidden="true" />
                  <div>
                    <p className="font-display text-lg font-semibold text-foreground">
                      Los televisores Samsung y LG no usan Android, así que necesitás un dispositivo adicional.
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Nosotros te lo enviamos configurado.{" "}
                      <a href="#dispositivo" className="text-primary underline underline-offset-4">
                        Mirá cómo es
                      </a>
                      .
                    </p>
                  </div>
                </div>
              )}

              {answer === "preguntar" && (
                <div>
                  <p className="text-base text-foreground">
                    Buscá Google Play Store en el menú de aplicaciones de tu televisor.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button onClick={() => setAnswer("compatible")}>Sí, la veo</Button>
                    <Button variant="outline" onClick={() => setAnswer("necesita")}>
                      No la encuentro
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* BLOQUE 2 — El dispositivo */}
        <div id="dispositivo" className="mt-12 grid items-center gap-8 md:grid-cols-2">
          <InlineVideo
            sources={clipSources(COMPAT_CLIPS.dispositivo)}
            poster={clipPoster(COMPAT_CLIPS.dispositivo)}
            label="El aparatito que se conecta al televisor"
            placeholder="Video del aparatito"
          />
          <div>
            <h3 className="font-display text-2xl font-bold text-foreground">Un aparato pequeño y ya.</h3>
            <p className="mt-3 text-muted-foreground">
              Se conecta al HDMI de tu televisor y lo convierte en una pantalla de menú digital. Te lo enviamos
              con la aplicación instalada y tu pantalla ya vinculada. Solo lo conectás.
            </p>

            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between rounded-xl border border-border/50 bg-card/40 px-4 py-3">
                <span className="text-sm text-muted-foreground">Plan mensual</span>
                <span className="text-sm font-semibold text-muted-foreground">
                  {formatCop(VISUALIA_DEVICE_PRICE_COP)}
                </span>
              </div>
              {["Pago anual adelantado", "Contrato a 1 año"].map((label) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-xl border border-primary/50 bg-primary/15 px-4 py-3"
                >
                  <span className="text-sm font-medium text-foreground">{label}</span>
                  <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    Incluido
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Con pago anual o contrato a un año, el dispositivo no te cuesta nada.
            </p>
          </div>
        </div>

        {/* BLOQUE 3 — Cómo funciona */}
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.title}>
              <InlineVideo
                sources={clipSources(s.clip)}
                poster={clipPoster(s.clip)}
                label={s.title}
                placeholder={`Video del paso ${i + 1}`}
              />
              <h4 className="mt-3 text-base font-semibold text-foreground">{s.title}</h4>
              <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* Cierre */}
        <div className="mt-12 flex flex-col items-center gap-3">
          <Button asChild size="lg" className="px-8">
            <Link to="/register">Empezar ahora</Link>
          </Button>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            Hablar con alguien por WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
