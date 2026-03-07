import { Check, ArrowRight, UtensilsCrossed, Eye, Clock, Users, TrendingUp, Sparkles, MonitorPlay } from "lucide-react";

const benefits = [
  { icon: Eye, text: "Tus productos se ven mejor" },
  { icon: Sparkles, text: "Tus promociones llaman más la atención" },
  { icon: Clock, text: "Cambias precios en segundos" },
  { icon: Users, text: "Tus clientes deciden más rápido" },
  { icon: MonitorPlay, text: "Tu restaurante se ve moderno" },
  { icon: TrendingUp, text: "Vendes más sin hacer más trabajo" },
];

const whyPoints = [
  "Tus clientes entienden el menú más rápido",
  "Tus productos se ven mejor",
  "Tus promociones se notan de inmediato",
  "Tu equipo explica menos y atiende más",
  "Tomas más pedidos en menos tiempo",
];

const RestaurantSolution = ({ onDemo }: { onDemo: () => void }) => (
  <section id="soluciones-restaurantes" className="px-4 py-12 md:px-6 md:py-16">
    <div className="mx-auto max-w-5xl">

      {/* Header */}
      <div className="mb-12 max-w-3xl">
        <div className="mb-4 flex items-center gap-2">
          <UtensilsCrossed className="h-5 w-5 text-primary" />
          <p className="text-xs font-medium uppercase tracking-widest text-primary">
            Solución para Restaurantes
          </p>
        </div>
        <h2 className="text-3xl font-bold text-foreground md:text-4xl lg:text-5xl leading-tight">
          Tus pantallas ahora{" "}
          <span className="text-gradient-primary">venden por ti</span>
        </h2>
        <p className="mt-5 text-base leading-relaxed text-muted-foreground">
          Visualia convierte tus TVs y pantallas en menús digitales claros y atractivos.
          Muestra tus platos con fotos que abren el apetito, destaca promociones en el momento
          justo y ayuda a que tus clientes elijan rápido y sin dudas.
        </p>
      </div>

      {/* Two columns: Why + Real Scene */}
      <div className="grid gap-px md:grid-cols-2" style={{ background: "hsl(var(--border))" }}>

        {/* Why */}
        <div className="flex flex-col gap-6 p-8" style={{ background: "hsl(var(--background))" }}>
          <h3 className="text-lg font-semibold text-foreground">¿Por qué ayuda a restaurantes?</h3>
          <ul className="space-y-3">
            {whyPoints.map((p) => (
              <li key={p} className="flex items-start gap-3 text-sm text-muted-foreground">
                <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm font-semibold text-foreground">
            Y eso significa más ventas.
          </p>
        </div>

        {/* Real Scene */}
        <div className="flex flex-col gap-4 p-8" style={{ background: "hsl(var(--background))" }}>
          <h3 className="text-lg font-semibold text-foreground">Escena real</h3>
          <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
            <p>Entra una familia al restaurante.</p>
            <p>Miran la pantalla y en segundos ven combos, precios y promociones.</p>
            <p>El niño señala una hamburguesa en oferta.</p>
            <p>Los papás ya saben qué pedir.</p>
            <p>Ordenan rápido. La fila avanza.</p>
            <p>Tu cocina trabaja mejor.</p>
            <p className="font-semibold text-foreground">Tú vendes más, sin complicarte.</p>
          </div>
        </div>
      </div>

      {/* Benefits grid */}
      <div className="mt-12">
        <h3 className="mb-6 text-lg font-semibold text-foreground">Beneficios claros</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="group flex items-center gap-4 rounded-xl p-5 transition-all duration-300 hover-lift neon-border neon-border-hover"
              style={{ background: "hsl(var(--card))" }}
            >
              <div
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg"
                style={{ background: "hsl(var(--primary) / 0.1)" }}
              >
                <Icon className="h-5 w-5 text-primary icon-neon" />
              </div>
              <span className="text-sm font-medium text-foreground">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div
        className="mt-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 rounded-xl px-8 py-8"
        style={{
          background: "linear-gradient(135deg, hsl(var(--primary) / 0.08) 0%, hsl(var(--card)) 100%)",
          border: "1px solid hsl(var(--border))",
        }}
      >
        <div>
          <p className="text-lg font-bold text-foreground">
            Visualia convierte tus pantallas en vendedores digitales que trabajan todo el día.
          </p>
        </div>
        <button
          onClick={onDemo}
          className="flex-shrink-0 flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 gradient-primary cta-pulse btn-glow"
        >
          Empieza hoy <ArrowRight className="h-4 w-4" />
        </button>
      </div>

    </div>
  </section>
);

export default RestaurantSolution;
