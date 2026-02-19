import { useState } from "react";
import { Crown, ArrowRight, X, Check, Monitor, RefreshCw, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import VisualiaStudioForm from "./VisualiaStudioForm";

const cards = [
  {
    icon: Monitor,
    title: "Muestra mejor tus productos",
    desc: "Hace que los clientes compren más rápido",
    visual: (
      <div className="rounded-xl overflow-hidden border border-border" style={{ background: "hsl(var(--card))" }}>
        <div className="px-3 py-2 flex items-center gap-1.5 border-b border-border bg-muted/50">
          <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
          <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
          <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
          <span className="text-[9px] text-muted-foreground ml-1">Menú Digital</span>
        </div>
        <div className="p-3 grid grid-cols-2 gap-2">
          {[
            { name: "Bandeja Paisa", price: "$28.000" },
            { name: "Ajiaco", price: "$22.000" },
            { name: "Cazuela", price: "$32.000" },
            { name: "Sancocho", price: "$25.000" },
          ].map((item) => (
            <div key={item.name} className="rounded-lg p-2 flex flex-col gap-1 border border-border bg-muted/30">
              <div className="h-8 rounded bg-muted/60 w-full" />
              <span className="text-[9px] font-semibold text-foreground/80">{item.name}</span>
              <span className="text-[9px] font-bold text-primary">{item.price}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: RefreshCw,
    title: "Actualiza precios y promociones en segundos",
    desc: "Sin diseñadores ni procesos complicados",
    visual: (
      <div className="rounded-xl overflow-hidden border border-border" style={{ background: "hsl(var(--card))" }}>
        <div className="px-3 py-2 text-[9px] text-muted-foreground border-b border-border flex items-center gap-1.5 bg-muted/50">
          <RefreshCw className="h-2.5 w-2.5 text-primary" />
          <span>Editor de contenido</span>
        </div>
        <div className="p-3 flex flex-col gap-2">
          {[
            { label: "Bandeja paisa", price: "$28.000", updated: false },
            { label: "Sopa del día", price: "$15.000", updated: true },
            { label: "Jugo natural", price: "$8.000", updated: false },
          ].map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between rounded-lg px-2.5 py-1.5 border"
              style={{
                background: row.updated ? "hsl(var(--primary) / 0.08)" : "hsl(var(--muted) / 0.4)",
                borderColor: row.updated ? "hsl(var(--primary) / 0.4)" : "hsl(var(--border))",
              }}
            >
              <span className="text-[10px] text-muted-foreground">{row.label}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-foreground">{row.price}</span>
                {row.updated && (
                  <span className="text-[8px] font-semibold px-1 rounded" style={{ background: "hsl(var(--primary) / 0.15)", color: "hsl(var(--primary))" }}>
                    actualizado
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: TrendingUp,
    title: "Tu negocio se ve profesional",
    desc: "Genera más confianza y más ventas",
    visual: (
      <div className="flex gap-2">
        <div className="flex-1 rounded-xl overflow-hidden border border-border" style={{ background: "hsl(var(--muted) / 0.3)" }}>
          <div className="px-2 py-1.5 text-[8px] text-muted-foreground border-b border-border text-center bg-muted/50 font-medium">Antes</div>
          <div className="p-2.5 flex flex-col gap-1.5">
            <div className="h-2 rounded bg-muted-foreground/15 w-full" />
            <div className="h-2 rounded bg-muted-foreground/10 w-4/5" />
            <div className="h-2 rounded bg-muted-foreground/15 w-3/4" />
            <div className="h-2 rounded bg-muted-foreground/10 w-full" />
            <div className="h-2 rounded bg-muted-foreground/15 w-2/3" />
          </div>
        </div>
        <div className="flex items-center">
          <ArrowRight className="h-3.5 w-3.5 text-primary" />
        </div>
        <div className="flex-1 rounded-xl overflow-hidden border" style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--primary) / 0.5)" }}>
          <div className="px-2 py-1.5 text-[8px] font-semibold border-b border-border/50 text-center" style={{ color: "hsl(var(--primary))", background: "hsl(var(--primary) / 0.08)" }}>
            Con Visualia
          </div>
          <div className="p-2.5 flex flex-col gap-1.5">
            <div className="h-2 rounded w-full" style={{ background: "hsl(var(--primary) / 0.7)" }} />
            <div className="h-2 rounded w-4/5" style={{ background: "hsl(var(--primary) / 0.4)" }} />
            <div className="h-2 rounded w-3/4" style={{ background: "hsl(var(--primary) / 0.3)" }} />
            <div className="h-2 rounded w-full" style={{ background: "hsl(var(--primary) / 0.4)" }} />
            <div className="h-2 rounded w-2/3" style={{ background: "hsl(var(--primary) / 0.3)" }} />
          </div>
        </div>
      </div>
    ),
  },
];

const without = ["Menús desordenados", "Clientes dudan", "Menos ventas"];
const withVisual = ["Menús claros", "Clientes deciden rápido", "Más ventas"];

const results = [
  { value: "+30%", label: "más ventas promedio" },
  { value: "100%", label: "control total de pantallas" },
  { value: "<30s", label: "actualización de contenido" },
];

const VisualiaStudio = () => {
  const [showForm, setShowForm] = useState(false);

  return (
    <section id="studio" className="relative px-6 py-24 md:py-32">
      <div className="relative mx-auto max-w-5xl">

        {/* Badge */}
        <div className="mb-10 flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full neon-border px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-neon">
            <Crown className="h-3.5 w-3.5 icon-neon" />
            Visualia Studio — Servicio Premium
          </span>
        </div>

        {/* Header */}
        <div className="mb-20 text-center">
          <h2 className="font-display text-4xl font-black text-foreground md:text-5xl lg:text-6xl leading-tight">
            Haz que tus pantallas{" "}
            <span className="text-gradient-primary">vendan por ti</span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Muestra tus productos mejor, destaca promociones y aumenta tus ventas automáticamente.
          </p>
        </div>

        {/* 3 Benefit Cards */}
        <div className="mb-20 grid gap-6 lg:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="group relative overflow-hidden glass-card hover:glass-card-hover rounded-2xl p-7 transition-all duration-300 hover-lift flex flex-col gap-5"
              >
                <div className="relative flex items-start gap-4">
                  <div
                    className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-105"
                    style={{ background: "hsl(var(--primary) / 0.12)", border: "1px solid hsl(var(--primary) / 0.25)" }}
                  >
                    <Icon className="h-5 w-5 icon-neon" strokeWidth={1.75} />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold text-foreground leading-snug">{card.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{card.desc}</p>
                  </div>
                </div>
                <div className="relative">{card.visual}</div>
              </div>
            );
          })}
        </div>

        {/* Comparison */}
        <div className="mb-16 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl p-8 border border-border bg-muted/20">
            <p className="mb-6 text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Sin Visualia</p>
            <ul className="space-y-4">
              {without.map((item) => (
                <li key={item} className="flex items-center gap-3 text-base text-muted-foreground">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-muted">
                    <X className="h-3 w-3 text-muted-foreground/50" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div
            className="relative overflow-hidden rounded-2xl p-8 border"
            style={{
              background: "hsl(var(--primary) / 0.06)",
              borderColor: "hsl(var(--primary) / 0.4)",
            }}
          >
            <div className="relative">
              <p className="mb-6 text-xs font-bold uppercase tracking-widest text-neon">Con Visualia</p>
              <ul className="space-y-4">
                {withVisual.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-base text-foreground/90">
                    <span
                      className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full"
                      style={{ background: "hsl(var(--primary) / 0.15)", border: "1px solid hsl(var(--primary) / 0.4)" }}
                    >
                      <Check className="h-3 w-3 icon-neon" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="mb-16 grid grid-cols-3 gap-4">
          {results.map((r) => (
            <div
              key={r.label}
              className="rounded-2xl px-4 py-8 text-center border border-border bg-muted/20"
            >
              <p
                className="font-display text-4xl font-black leading-none text-neon"
              >
                {r.value}
              </p>
              <p className="mt-3 text-sm text-muted-foreground leading-snug">{r.label}</p>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button
            size="lg"
            className="gradient-primary-vibrant btn-glow border-0 px-10 text-lg text-primary-foreground"
            onClick={() => setShowForm(true)}
          >
            Quiero vender más
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button size="lg" variant="outline" className="neon-border-hover px-10 text-lg hover-lift">
            Ver ejemplos reales
          </Button>
        </div>
      </div>

      <VisualiaStudioForm open={showForm} onOpenChange={setShowForm} />
    </section>
  );
};

export default VisualiaStudio;
