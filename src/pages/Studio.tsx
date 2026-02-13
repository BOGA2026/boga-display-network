import { useState } from "react";
import {
  Camera,
  LayoutGrid,
  Sparkles,
  MonitorSmartphone,
  Clock,
  RefreshCw,
  ArrowRight,
  Crown,
  Zap,
  BarChart3,
  Layers,
  CalendarClock,
  Wifi,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import LandingHeader from "@/components/landing/LandingHeader";
import VisualiaStudioForm from "@/components/landing/VisualiaStudioForm";

const services = [
  { icon: Camera, title: "Fotografía gastronómica profesional", desc: "Sesiones de foto con estilismo culinario, iluminación de estudio y edición premium para que cada plato luzca irresistible en pantalla." },
  { icon: LayoutGrid, title: "Diseño de menú digital optimizado", desc: "Jerarquía visual clara, tipografía legible a distancia y diseño pensado para decisiones rápidas del cliente." },
  { icon: Sparkles, title: "Piezas visuales para promociones", desc: "Creatividades de temporada, lanzamientos y ofertas especiales con animaciones sutiles que captan la atención." },
  { icon: MonitorSmartphone, title: "Adaptaciones multi-formato", desc: "Cada pieza se produce en vertical y horizontal, optimizada para cualquier tipo de pantalla o ubicación." },
  { icon: Clock, title: "Estrategia visual por franjas horarias", desc: "Contenido diferenciado para desayuno, almuerzo y cena que maximiza la relevancia y el ticket promedio." },
  { icon: RefreshCw, title: "Producción mensual opcional", desc: "Actualizaciones periódicas de contenido para mantener la frescura visual y la rotación de productos destacados." },
];

const integrationPoints = [
  { icon: Layers, title: "Optimizado para Visualia", desc: "Todo el contenido se produce en formatos y resoluciones perfectas para el reproductor Visualia." },
  { icon: CalendarClock, title: "Programable por horario", desc: "Cada pieza se entrega lista para asignar a franjas horarias en el programador de Visualia." },
  { icon: Wifi, title: "Distribución automática", desc: "Una vez publicado, el contenido se sincroniza en todas tus pantallas sin intervención manual." },
];

const Studio = () => {
  const [showForm, setShowForm] = useState(false);

  return (
    <div
      className="min-h-screen"
      style={{
        background: "linear-gradient(180deg, #0E0B16 0%, #12101A 50%, #0E0B16 100%)",
      }}
    >
      <LandingHeader />

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden px-6 pb-20 pt-36 md:pt-44">
        <div
          className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2"
          style={{ width: 900, height: 700 }}
        >
          <div
            className="absolute left-1/2 top-24 h-80 w-80 -translate-x-1/2 rounded-full opacity-20 blur-[120px]"
            style={{ background: "#8A00FF" }}
          />
          <div
            className="absolute left-1/3 top-48 h-56 w-56 rounded-full opacity-15 blur-[90px]"
            style={{ background: "#C000FF" }}
          />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <span
            className="mb-6 inline-flex items-center gap-2 rounded-full border px-5 py-2 text-xs font-semibold uppercase tracking-widest"
            style={{
              borderColor: "hsl(270 100% 50% / 0.4)",
              background: "hsl(270 100% 50% / 0.08)",
              color: "hsl(280 100% 70%)",
            }}
          >
            <Crown className="h-4 w-4" />
            Servicio Premium
          </span>

          <h1 className="mt-6 font-display text-4xl font-bold leading-tight text-foreground md:text-5xl lg:text-6xl">
            El contenido que convierte{" "}
            <span className="text-gradient-primary">pantallas en ventas.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Más que software. En alianza con{" "}
            <strong className="text-foreground">BOGA Casa de Contenidos</strong>, diseñamos
            menús digitales, fotografía profesional y piezas visuales estratégicas
            optimizadas para aumentar ventas en tus pantallas.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button
              size="lg"
              className="gradient-primary glow-primary border-0 px-8 text-lg text-primary-foreground"
              onClick={() => setShowForm(true)}
            >
              Solicitar Visualia Studio
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-border/40 px-8 text-lg"
            >
              Ver ejemplos
            </Button>
          </div>
        </div>
      </section>

      {/* ─── What We Do ─── */}
      <section className="px-6 py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              Qué hacemos por tu marca
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Producción de contenido premium diseñada específicamente para pantallas de señalización digital.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <div
                key={s.title}
                className="group relative overflow-hidden rounded-xl border p-8 transition-all hover:border-primary/40"
                style={{
                  borderColor: "hsl(260 15% 18%)",
                  background:
                    "linear-gradient(180deg, hsl(260 30% 10%) 0%, hsl(260 25% 8%) 100%)",
                }}
              >
                <div
                  className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
                  style={{
                    background:
                      "radial-gradient(ellipse at top right, hsl(270 100% 50% / 0.06) 0%, transparent 60%)",
                  }}
                />
                <div className="relative">
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                    <s.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="mb-2 font-display text-lg font-semibold text-foreground">
                    {s.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Why It Matters ─── */}
      <section className="px-6 py-20 md:py-28">
        <div className="mx-auto max-w-4xl">
          <div
            className="relative overflow-hidden rounded-2xl border px-8 py-16 text-center md:px-16"
            style={{
              borderColor: "hsl(270 100% 50% / 0.2)",
              background:
                "linear-gradient(180deg, hsl(260 30% 12%) 0%, hsl(260 25% 7%) 100%)",
            }}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-15"
              style={{
                background:
                  "radial-gradient(ellipse at center, hsl(270 100% 50%) 0%, transparent 70%)",
              }}
            />
            <div className="relative">
              <Zap className="mx-auto mb-6 h-10 w-10 text-primary" />
              <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
                No es solo mostrar.{" "}
                <span className="text-gradient-primary">Es vender.</span>
              </h2>
              <div className="mx-auto mt-8 grid max-w-3xl gap-6 sm:grid-cols-2 md:grid-cols-4">
                {[
                  { label: "Mejor diseño", sub: "Claridad visual" },
                  { label: "Más claridad", sub: "Decisión rápida" },
                  { label: "Decisión ágil", sub: "Menos fricción" },
                  { label: "Ticket más alto", sub: "+30% promedio" },
                ].map((step, i) => (
                  <div key={step.label} className="text-center">
                    <p className="font-display text-lg font-semibold text-foreground">
                      {step.label}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{step.sub}</p>
                    {i < 3 && (
                      <ArrowRight className="mx-auto mt-3 hidden h-4 w-4 text-primary/40 md:block" />
                    )}
                  </div>
                ))}
              </div>
              <p className="mx-auto mt-8 max-w-lg text-sm leading-relaxed text-muted-foreground">
                El contenido profesional mejora la percepción de marca, acelera las decisiones
                de compra y aumenta el valor promedio de cada ticket. No es decoración: es
                estrategia comercial.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Integration with Software ─── */}
      <section className="px-6 py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              Integrado con <span className="text-gradient-primary">Visualia</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Todo el contenido producido está listo para funcionar en tu ecosistema Visualia sin configuración adicional.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {integrationPoints.map((ip) => (
              <div
                key={ip.title}
                className="group rounded-xl border p-8 text-center transition-all hover:border-primary/40 hover:shadow-[0_0_30px_-8px_hsl(270_100%_50%/0.2)]"
                style={{
                  borderColor: "hsl(260 15% 18%)",
                  background:
                    "linear-gradient(180deg, hsl(260 25% 12%) 0%, hsl(260 25% 10%) 100%)",
                }}
              >
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl gradient-primary">
                  <ip.icon className="h-7 w-7 text-primary-foreground" />
                </div>
                <h3 className="mb-2 font-display text-lg font-semibold text-foreground">
                  {ip.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{ip.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="px-6 py-20 md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <div
            className="relative overflow-hidden rounded-2xl border px-8 py-16 md:px-16"
            style={{
              borderColor: "hsl(270 100% 50% / 0.2)",
              background:
                "linear-gradient(180deg, hsl(260 25% 14%) 0%, hsl(260 30% 8%) 100%)",
            }}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-20"
              style={{
                background:
                  "radial-gradient(ellipse at center, #8A00FF 0%, transparent 70%)",
              }}
            />
            <div className="relative">
              <Crown className="mx-auto mb-4 h-8 w-8 text-primary" />
              <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
                ¿Quieres que tus pantallas{" "}
                <span className="text-gradient-primary">vendan más</span>?
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
                Solicita una asesoría premium y descubre cómo el contenido profesional puede transformar tus resultados.
              </p>
              <div className="mt-8">
                <Button
                  size="lg"
                  className="gradient-primary glow-primary border-0 px-8 text-lg text-primary-foreground"
                  onClick={() => setShowForm(true)}
                >
                  Solicitar asesoría premium
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border/20 px-6 py-8">
        <p className="text-center text-xs text-muted-foreground/50">
          © 2026 Visualia. Todos los derechos reservados.
        </p>
      </footer>

      <VisualiaStudioForm open={showForm} onOpenChange={setShowForm} />
    </div>
  );
};

export default Studio;
