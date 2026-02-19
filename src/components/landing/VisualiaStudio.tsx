import { useState } from "react";
import { Crown, ArrowRight, X, Check, Star, Zap, Pencil, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import VisualiaStudioForm from "./VisualiaStudioForm";

const neon = "hsl(270 100% 65%)";

const cards = [
  {
    icon: ShoppingBag,
    title: "Tus productos se ven más irresistibles",
    desc: "Más clientes compran cuando ven mejor tus productos",
    visual: (
      <div className="relative rounded-xl overflow-hidden border border-white/10" style={{ background: "hsl(270 30% 8%)" }}>
        {/* Screen bezel */}
        <div className="px-3 py-1.5 flex items-center gap-1.5 border-b border-white/5" style={{ background: "hsl(270 20% 12%)" }}>
          <div className="h-1.5 w-1.5 rounded-full bg-white/20" />
          <div className="h-1.5 w-1.5 rounded-full bg-white/20" />
          <div className="h-1.5 w-1.5 rounded-full bg-white/20" />
        </div>
        <div className="p-3 grid grid-cols-2 gap-2">
          {[
            { name: "Tacos", price: "$18.000", emoji: "🌮" },
            { name: "Burger", price: "$22.000", emoji: "🍔" },
            { name: "Pizza", price: "$32.000", emoji: "🍕" },
            { name: "Sushi", price: "$28.000", emoji: "🍱" },
          ].map((item) => (
            <div key={item.name} className="rounded-lg p-2 flex flex-col items-center gap-1" style={{ background: "hsl(270 20% 15%)", border: "1px solid hsl(270 100% 65% / 0.15)" }}>
              <span className="text-xl">{item.emoji}</span>
              <span className="text-[9px] font-semibold text-white/80">{item.name}</span>
              <span className="text-[8px] font-bold" style={{ color: neon }}>{item.price}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: Star,
    title: "Destaca promociones en segundos",
    desc: "Muestra ofertas que realmente llaman la atención",
    visual: (
      <div className="relative rounded-xl overflow-hidden border flex flex-col items-center justify-center py-5 gap-2" style={{ background: "hsl(270 30% 8%)", borderColor: "hsl(270 100% 65% / 0.4)", boxShadow: `0 0 30px hsl(270 100% 50% / 0.15)` }}>
        <div className="pointer-events-none absolute inset-0 rounded-xl animate-neon-breathe" style={{ background: "radial-gradient(ellipse at center, hsl(270 100% 50% / 0.12), transparent 70%)" }} />
        <div className="rounded-full px-5 py-2 font-black text-sm uppercase tracking-wider text-white" style={{ background: `linear-gradient(135deg, hsl(270 100% 50%), hsl(290 100% 55%))`, boxShadow: `0 0 20px hsl(270 100% 50% / 0.6)` }}>
          🔥 OFERTA HOY
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[11px] text-muted-foreground line-through">$25.000</span>
          <span className="text-sm font-black" style={{ color: neon }}>$18.000</span>
        </div>
        <span className="text-[9px] text-white/40 uppercase tracking-widest">Solo hasta las 3pm</span>
      </div>
    ),
  },
  {
    icon: Pencil,
    title: "Cambia precios y productos fácilmente",
    desc: "Actualiza tus pantallas en segundos",
    visual: (
      <div className="rounded-xl overflow-hidden border border-white/10" style={{ background: "hsl(270 30% 8%)" }}>
        <div className="px-3 py-2 text-[9px] text-white/30 border-b border-white/5 flex items-center gap-1" style={{ background: "hsl(270 20% 12%)" }}>
          <Pencil className="h-2.5 w-2.5" style={{ color: neon }} />
          <span style={{ color: neon }}>Editar menú</span>
        </div>
        <div className="p-3 flex flex-col gap-1.5">
          {[
            { label: "Bandeja paisa", price: "$28.000", updated: false },
            { label: "Sopa del día", price: "$15.000", updated: true },
            { label: "Jugo natural", price: "$8.000", updated: false },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between rounded-lg px-2.5 py-1.5" style={{ background: row.updated ? "hsl(270 100% 50% / 0.12)" : "hsl(270 10% 15%)", border: `1px solid ${row.updated ? "hsl(270 100% 65% / 0.4)" : "transparent"}` }}>
              <span className="text-[10px] text-white/70">{row.label}</span>
              <span className="text-[10px] font-bold" style={{ color: row.updated ? neon : "hsl(270 10% 60%)" }}>{row.price}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: Zap,
    title: "Tu negocio se ve moderno y profesional",
    desc: "Genera más confianza y más ventas",
    visual: (
      <div className="flex gap-2">
        {/* Before */}
        <div className="flex-1 rounded-xl overflow-hidden border border-white/10" style={{ background: "hsl(220 10% 10%)" }}>
          <div className="px-2 py-1 text-[8px] text-white/30 border-b border-white/5 text-center">Antes</div>
          <div className="p-2 flex flex-col gap-1">
            <div className="h-1.5 rounded bg-white/10 w-full" />
            <div className="h-1.5 rounded bg-white/5 w-4/5" />
            <div className="h-1.5 rounded bg-white/10 w-3/4" />
            <div className="h-1.5 rounded bg-white/5 w-full" />
          </div>
        </div>
        {/* Arrow */}
        <div className="flex items-center">
          <ArrowRight className="h-3 w-3" style={{ color: neon }} />
        </div>
        {/* After */}
        <div className="flex-1 rounded-xl overflow-hidden border" style={{ background: "hsl(270 25% 10%)", borderColor: "hsl(270 100% 65% / 0.4)", boxShadow: `0 0 15px hsl(270 100% 50% / 0.15)` }}>
          <div className="px-2 py-1 text-[8px] font-semibold border-b border-white/5 text-center" style={{ color: neon, background: "hsl(270 100% 50% / 0.1)" }}>Con Visualia</div>
          <div className="p-2 flex flex-col gap-1">
            <div className="h-1.5 rounded w-full" style={{ background: neon, opacity: 0.8 }} />
            <div className="h-1.5 rounded w-4/5" style={{ background: "hsl(270 100% 65% / 0.4)" }} />
            <div className="h-1.5 rounded w-3/4" style={{ background: "hsl(270 100% 65% / 0.3)" }} />
            <div className="h-1.5 rounded w-full" style={{ background: "hsl(270 100% 65% / 0.4)" }} />
          </div>
        </div>
      </div>
    ),
  },
];

const results = [
  { value: "+30%", label: "más ventas promedio" },
  { value: "⚡", label: "Clientes deciden más rápido" },
  { value: "📺", label: "Más impacto visual" },
  { value: "🚀", label: "Más ventas sin esfuerzo" },
];

const without = ["Menús desordenados", "Clientes dudan", "Menos ventas"];
const withStudio = ["Menús claros", "Clientes compran más rápido", "Más ventas"];

const VisualiaStudio = () => {
  const [showForm, setShowForm] = useState(false);

  return (
    <section id="studio" className="relative px-6 py-24 md:py-32">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse 70% 50% at 50% 30%, hsl(270 100% 50% / 0.07) 0%, transparent 70%)" }}
      />

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

        {/* 4 Benefit Cards */}
        <div className="mb-20 grid gap-6 sm:grid-cols-2">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="group relative overflow-hidden glass-card hover:glass-card-hover rounded-2xl p-7 transition-all duration-300 hover-lift flex flex-col gap-5"
              >
                <div
                  className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{ boxShadow: `inset 0 0 0 1px hsl(270 100% 65% / 0.4), 0 0 40px hsl(270 100% 50% / 0.08)` }}
                />
                <div
                  className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-15"
                  style={{ background: "hsl(270 100% 60%)" }}
                />

                {/* Icon + text */}
                <div className="relative flex items-start gap-4">
                  <div
                    className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110"
                    style={{ background: "hsl(270 100% 50% / 0.15)", border: "1px solid hsl(270 100% 65% / 0.3)" }}
                  >
                    <Icon className="h-6 w-6" style={{ color: neon }} strokeWidth={1.75} />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-foreground leading-snug">{card.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{card.desc}</p>
                  </div>
                </div>

                {/* Visual */}
                <div className="relative">{card.visual}</div>
              </div>
            );
          })}
        </div>

        {/* Before / After */}
        <div className="mb-16 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl p-8" style={{ background: "hsl(220 20% 8%)", border: "1px solid hsl(220 15% 16%)" }}>
            <p className="mb-6 text-xs font-bold uppercase tracking-widest text-muted-foreground/50">Sin Visualia</p>
            <ul className="space-y-4">
              {without.map((item) => (
                <li key={item} className="flex items-center gap-3 text-base text-muted-foreground">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-white/5">
                    <X className="h-3 w-3 text-muted-foreground/40" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div
            className="relative overflow-hidden rounded-2xl p-8"
            style={{ background: "linear-gradient(135deg, hsl(270 40% 12%) 0%, hsl(260 35% 9%) 100%)", border: "1px solid hsl(270 100% 65% / 0.45)", boxShadow: "0 0 60px hsl(270 100% 50% / 0.12)" }}
          >
            <div
              className="pointer-events-none absolute inset-0 rounded-2xl animate-neon-breathe"
              style={{ background: "radial-gradient(ellipse at 20% 20%, hsl(270 100% 50% / 0.15) 0%, transparent 60%)" }}
            />
            <div className="relative">
              <div className="mb-6 flex items-center gap-2">
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: neon }}>Con Visualia</p>
                <Crown className="h-3.5 w-3.5" style={{ color: neon }} />
              </div>
              <ul className="space-y-4">
                {withStudio.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-base text-foreground/90">
                    <span
                      className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full"
                      style={{ background: "hsl(270 100% 50% / 0.2)", border: "1px solid hsl(270 100% 65% / 0.4)" }}
                    >
                      <Check className="h-3 w-3" style={{ color: neon }} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Results Strip */}
        <div className="mb-16 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {results.map((r) => (
            <div
              key={r.label}
              className="relative overflow-hidden rounded-2xl px-4 py-6 text-center hover-lift transition-all duration-300"
              style={{ background: "hsl(270 25% 10% / 0.7)", border: "1px solid hsl(270 100% 65% / 0.2)" }}
            >
              <div
                className="pointer-events-none absolute inset-0 rounded-2xl"
                style={{ background: "radial-gradient(ellipse at center, hsl(270 100% 50% / 0.06) 0%, transparent 70%)" }}
              />
              <p
                className="font-display text-3xl font-black leading-none"
                style={{ color: neon, textShadow: `0 0 24px hsl(270 100% 65% / 0.7)` }}
              >
                {r.value}
              </p>
              <p className="mt-2 text-xs text-muted-foreground leading-snug">{r.label}</p>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button
            size="lg"
            className="gradient-primary-vibrant cta-pulse btn-glow border-0 px-10 text-lg text-primary-foreground"
            onClick={() => setShowForm(true)}
          >
            Quiero vender más
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button size="lg" variant="outline" className="neon-border neon-border-hover px-10 text-lg hover-lift">
            Ver ejemplos reales
          </Button>
        </div>
      </div>

      <VisualiaStudioForm open={showForm} onOpenChange={setShowForm} />
    </section>
  );
};

export default VisualiaStudio;
