import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { CreditCard, Building2, Smartphone, ArrowRight, Info } from "lucide-react";
import { PRICING_TIERS, findTier } from "@/config/pricing";

const fmtCOP = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

function clamp(n: number) {
  return Math.min(300, Math.max(1, Math.floor(n) || 1));
}

function InfoTooltip({
  children,
  label,
  side = "top",
}: {
  children: React.ReactNode;
  label?: string;
  side?: "top" | "bottom" | "left" | "right";
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className="inline-flex items-center justify-center rounded-full opacity-70 hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Info className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent side={side} className="max-w-xs text-xs leading-snug">
        {children}
      </TooltipContent>
    </Tooltip>
  );
}

export function PriceCalculator() {
  const [screens, setScreens] = useState(3);

  const tier = useMemo(() => findTier(screens), [screens]);
  const total = tier ? tier.pricePerScreen * screens : null;

  const handleSlider = (value: number[]) => {
    setScreens(clamp(value[0] ?? 1));
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScreens(clamp(+e.target.value));
  };

  return (
    <section aria-labelledby="calc-title" className="px-6 pb-20">
      <div className="mx-auto max-w-5xl">
        <div className="v-card rounded-2xl p-8 md:p-14 lg:p-16 glow-primary-sm">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <h2
                id="calc-title"
                className="font-display text-3xl font-bold text-foreground md:text-4xl"
              >
                ¿Cuánto me cuesta?
              </h2>
              <p className="mt-2 text-muted-foreground">
                Ajusta el número de pantallas y conoce tu precio al instante. IVA incluido.
              </p>

              <div className="mt-8 space-y-6">
                <div className="mb-4">
                  <div className="mb-3 flex items-end justify-between">
                    <label htmlFor="screens-input" className="text-sm text-muted-foreground">
                      Número de pantallas
                    </label>
                    <span className="font-display text-3xl font-bold stat-glow" aria-hidden="true">
                      {screens}
                    </span>
                  </div>
                  <Slider
                    value={[screens]}
                    onValueChange={handleSlider}
                    min={1}
                    max={300}
                    step={1}
                    className="py-2"
                    aria-label="Número de pantallas"
                  />
                  <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                    <span>1</span>
                    <span>50</span>
                    <span>100</span>
                    <span>200</span>
                    <span>300</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Input
                    id="screens-input"
                    type="number"
                    min={1}
                    max={300}
                    value={screens}
                    onChange={handleInput}
                    className="w-32"
                    aria-describedby="calc-title"
                  />
                  <span className="text-sm text-muted-foreground">pantallas</span>
                </div>


                <div className="rounded-xl surface-neon p-6 text-center transition-all duration-300">
                  <p aria-live="polite" className="font-display text-2xl font-bold stat-glow">
                    {tier && total !== null ? (
                      <>
                        {fmtCOP.format(total)}
                        <span className="ml-2 text-sm font-normal text-muted-foreground">/mes</span>
                      </>
                    ) : (
                      <a
                        href="https://wa.me/573163265696?text=Hola%2C%20tengo%20m%C3%A1s%20de%20300%20pantallas"
                        className="text-primary hover:underline"
                      >
                        Hablemos de un plan corporativo
                      </a>
                    )}
                  </p>
                  <div className="mt-1 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
                    {tier && total !== null ? (
                      <>
                        {fmtCOP.format(tier.pricePerScreen)} por pantalla/mes
                        <InfoTooltip label="Precio por pantalla" side="right">
                          El precio por pantalla baja automáticamente a medida que agregas más pantallas en tu negocio.
                        </InfoTooltip>
                        · {screens} pantalla{screens > 1 ? "s" : ""}
                      </>
                    ) : (
                      "Más de 300 pantallas"
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-border/30 bg-secondary/20 p-6">
                <h3 className="font-display text-lg font-semibold text-foreground">
                  ¿Qué pasa al terminar los 14 días de prueba?
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Eliges el plan que quieras. No cobramos automáticamente porque no te pedimos tarjeta de crédito.
                </p>
              </div>

              <div className="rounded-xl border border-border/30 bg-secondary/20 p-6">
                <h3 className="font-display text-lg font-semibold text-foreground">Medios de pago</h3>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-primary" aria-hidden="true" />
                    Tarjeta de crédito o débito
                  </li>
                  <li className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" aria-hidden="true" />
                    PSE
                  </li>
                  <li className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-primary" aria-hidden="true" />
                    Nequi / Daviplata
                  </li>
                </ul>
              </div>

              <div className="rounded-xl border border-border/30 bg-secondary/20 p-6">
                <h3 className="font-display text-lg font-semibold text-foreground">Facturación</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  ¿Necesitas factura electrónica? Sí, emitimos factura DIAN.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10">
            <h3 className="mb-4 inline-flex items-center gap-2 font-display text-lg font-semibold text-foreground">
              Tabla de precios
              <InfoTooltip label="Qué incluye cada plan" side="bottom">
                Todos los planes incluyen gestión remota, programación de contenido, playlists automáticas, soporte prioritario, actualizaciones continuas y seguridad con respaldos.
              </InfoTooltip>
            </h3>
            <div className="overflow-x-auto rounded-xl border border-border/30">
              <table className="w-full text-sm">
                <thead className="bg-secondary/30">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-foreground">Rango de pantallas</th>
                    <th className="px-4 py-3 text-right font-medium text-foreground">Precio por pantalla/mes</th>
                  </tr>
                </thead>
                <tbody>
                  {PRICING_TIERS.map((t) => {
                    const active = screens >= t.min && screens <= t.max;
                    return (
                      <tr
                        key={t.min}
                        className={active ? "bg-primary/5" : "even:bg-secondary/10"}
                      >
                        <td className="px-4 py-3 text-muted-foreground">
                          {t.min} - {t.max} pantallas
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-foreground">
                          {active && tier ? (
                            <span className="text-primary">{fmtCOP.format(tier.pricePerScreen)}</span>
                          ) : (
                            fmtCOP.format(t.pricePerScreen)
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="even:bg-secondary/10">
                    <td className="px-4 py-3 text-muted-foreground">Más de 300 pantallas</td>
                    <td className="px-4 py-3 text-right font-medium text-foreground">
                      <a
                        href="https://wa.me/573163265696?text=Hola%2C%20tengo%20m%C3%A1s%20de%20300%20pantallas"
                        className="text-primary hover:underline"
                      >
                        Plan corporativo
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-8 text-center">
              <Button
                size="lg"
                className="gradient-primary-vibrant cta-pulse btn-glow border-0 px-10 text-lg text-primary-foreground"
                asChild
              >
                <Link to="/registro">
                  Prueba gratis 14 días <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
