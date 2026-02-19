import { useState } from "react";
import {
  Camera, LayoutList, Tag, Clock, Wand2, RefreshCw, Crown, ArrowRight, X, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import VisualiaStudioForm from "./VisualiaStudioForm";

const neon = "hsl(270 100% 65%)";

const cards = [
  {
    icon: Camera,
    impact: "Aumenta el deseo de compra",
    title: "Haz que tus productos se vean irresistibles",
    desc: "Imágenes optimizadas para vender más",
    visual: (
      <div className="flex items-center gap-2">
        <div className="flex-1 rounded-lg overflow-hidden border border-white/10">
          <div className="bg-white/5 px-2 py-1 text-[8px] text-white/30 border-b border-white/5">Antes</div>
          <div className="flex items-center justify-center h-10 bg-white/5">
            <div className="h-6 w-8 rounded bg-white/10 opacity-40" />
          </div>
        </div>
        <ArrowRight className="h-3 w-3 flex-shrink-0 opacity-50" style={{ color: neon }} />
        <div className="flex-1 rounded-lg overflow-hidden border" style={{ borderColor: "hsl(270 100% 65% / 0.4)" }}>
          <div className="px-2 py-1 text-[8px] font-semibold border-b border-white/5" style={{ color: neon, background: "hsl(270 100% 50% / 0.1)" }}>Después</div>
          <div className="flex items-center justify-center h-10" style={{ background: "hsl(270 100% 30% / 0.2)" }}>
            <div className="h-6 w-8 rounded" style={{ background: "linear-gradient(135deg, hsl(270 80% 40%), hsl(290 90% 50%))", boxShadow: `0 0 10px ${neon}` }} />
          </div>
        </div>
      </div>
    ),
  },
  {
    icon: LayoutList,
    impact: "Menos dudas, más ventas",
    title: "Clientes deciden más rápido",
    desc: "Menús claros y fáciles de entender",
    visual: (
      <div className="flex flex-col gap-1 rounded-lg border border-white/10 bg-white/5 p-2">
        <div className="h-1.5 w-full rounded-full" style={{ background: neon, opacity: 0.7 }} />
        {[["80%", "60%"], ["90%", "50%"], ["70%", "40%"]].map(([w1, w2], i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="h-1 rounded-full bg-white/20" style={{ width: w1 }} />
            <div className="h-1 rounded-full bg-white/10 ml-auto" style={{ width: w2 }} />
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: Tag,
    impact: "Mayor visibilidad",
    title: "Promociones que sí llaman la atención",
    desc: "Ofertas destacadas estratégicamente",
    visual: (
      <div className="relative flex items-center justify-center rounded-lg border p-3" style={{ borderColor: "hsl(270 100% 65% / 0.3)", background: "hsl(270 100% 30% / 0.1)" }}>
        <div className="pointer-events-none absolute inset-0 rounded-lg animate-neon-breathe" style={{ background: "radial-gradient(ellipse at center, hsl(270 100% 50% / 0.12), transparent 70%)" }} />
        <span className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ background: "linear-gradient(135deg, hsl(270 100% 55%), hsl(290 100% 60%))", color: "white", boxShadow: `0 0 12px ${neon}` }}>
          🔥 Oferta especial
        </span>
      </div>
    ),
  },
  {
    icon: Clock,
    impact: "Ventas en cada franja horaria",
    title: "Contenido que cambia automáticamente",
    desc: "Desayuno, almuerzo y cena automáticos",
    visual: (
      <div className="flex items-end gap-1 justify-between">
        {[
          { t: "8am", label: "☀️", active: false },
          { t: "12pm", label: "🍽️", active: true },
          { t: "3pm", label: "☕", active: false },
          { t: "7pm", label: "🌙", active: false },
        ].map(({ t, label, active }) => (
          <div key={t} className="flex flex-col items-center gap-1 flex-1">
            <span className="text-[10px]">{label}</span>
            <div className="w-full rounded-t text-center text-[7px] py-0.5" style={{
              height: active ? 24 : 14,
              background: active ? neon : "hsl(270 100% 65% / 0.15)",
              color: active ? "white" : "transparent",
              boxShadow: active ? `0 0 8px ${neon}` : "none",
              transition: "all 0.3s",
            }} />
            <span className="text-[7px] text-white/30">{t}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: Wand2,
    impact: "Mejora tu percepción de marca",
    title: "Imagen profesional para tu negocio",
    desc: "Tu negocio se ve más moderno",
    visual: (
      <div className="relative flex items-center justify-center rounded-lg border border-white/10 bg-white/5 h-12">
        <div className="h-6 w-16 rounded-md" style={{ background: "linear-gradient(135deg, hsl(270 80% 35%), hsl(290 90% 45%))" }} />
        <div className="pointer-events-none absolute inset-0 rounded-lg" style={{ boxShadow: `inset 0 0 20px hsl(270 100% 65% / 0.15)` }} />
        <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full" style={{ background: neon, boxShadow: `0 0 6px ${neon}` }} />
      </div>
    ),
  },
  {
    icon: RefreshCw,
    impact: "Negocio activo siempre",
    title: "Tus pantallas siempre actualizadas",
    desc: "Contenido renovado constantemente",
    visual: (
      <div className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 py-2.5">
        <RefreshCw className="h-4 w-4 animate-spin" style={{ color: neon, animationDuration: "3s" }} />
        <div className="flex flex-col gap-0.5">
          <div className="h-1 w-16 rounded-full bg-white/15" />
          <div className="h-1 w-12 rounded-full" style={{ background: neon, opacity: 0.6 }} />
        </div>
      </div>
    ),
  },
];

const without = [
  "Menús desordenados y confusos",
  "Fotos poco atractivas",
  "Clientes indecisos",
  "Menor conversión en ventas",
];
const withStudio = [
  "Menús claros y atractivos",
  "Productos que llaman la atención",
  "Clientes deciden rápido",
  "Mayor volumen de ventas",
];

const stats = [
  { value: "+20%", label: "aumento promedio en ventas" },
  { value: "+40%", label: "más visibilidad de promociones" },
  { value: "-60%", label: "menos dudas de clientes" },
  { value: "Rápido", label: "decisiones más rápidas" },
];

const VisualiaStudio = () => {
  const [showForm, setShowForm] = useState(false);

  return (
    <section id="studio" className="relative px-6 py-20 md:py-28">
      {/* Background glow */}
      <div
        className="pointer-events-none absolute inset-0 animate-neon-breathe"
        style={{ background: "radial-gradient(ellipse 70% 50% at 50% 40%, hsl(270 100% 50% / 0.1) 0%, transparent 70%)" }}
      />

      <div className="relative mx-auto max-w-6xl">
        {/* Badge */}
        <div className="mb-8 flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full neon-border px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-neon">
            <Crown className="h-3.5 w-3.5 icon-neon" />
            Visualia Studio — Servicio Premium
          </span>
        </div>

        {/* Headline */}
        <div className="mb-16 text-center">
          <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl lg:text-5xl leading-tight">
            El contenido que hace que{" "}
            <span className="text-gradient-primary">tus pantallas generen ingresos</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Visualia transforma tus pantallas en una herramienta de ventas activa con contenido optimizado para vender más.
          </p>
        </div>

        {/* Benefit cards */}
        <div className="mb-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="group relative overflow-hidden glass-card hover:glass-card-hover rounded-2xl p-6 transition-all duration-300 hover-lift flex flex-col gap-4"
              >
                {/* Hover glow border */}
                <div
                  className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{ boxShadow: `inset 0 0 0 1px hsl(270 100% 65% / 0.5), 0 0 30px hsl(270 100% 50% / 0.12)` }}
                />
                <div
                  className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full blur-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-25"
                  style={{ background: "hsl(270 100% 60%)" }}
                />

                {/* Icon + impact */}
                <div className="relative flex items-start justify-between gap-2">
                  <div
                    className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110"
                    style={{ background: "hsl(270 100% 50% / 0.15)", border: "1px solid hsl(270 100% 65% / 0.35)" }}
                  >
                    <Icon className="h-6 w-6" style={{ color: neon }} strokeWidth={2} />
                  </div>
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-right"
                    style={{ background: "hsl(270 100% 50% / 0.12)", border: "1px solid hsl(270 100% 65% / 0.25)", color: "hsl(270 100% 80%)" }}
                  >
                    {card.impact}
                  </span>
                </div>

                {/* Mini visual */}
                <div className="relative">{card.visual}</div>

                {/* Text */}
                <div className="relative">
                  <h3 className="font-display text-base font-bold text-foreground leading-snug">{card.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{card.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Comparison block */}
        <div className="mb-14 grid gap-4 md:grid-cols-2">
          {/* Without */}
          <div className="rounded-2xl p-7" style={{ background: "hsl(220 20% 8%)", border: "1px solid hsl(220 15% 18%)" }}>
            <p className="mb-5 text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Sin Visualia</p>
            <ul className="space-y-3">
              {without.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-white/5">
                    <X className="h-3 w-3 text-muted-foreground/40" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* With Studio */}
          <div
            className="relative overflow-hidden rounded-2xl p-7"
            style={{ background: "linear-gradient(135deg, hsl(270 40% 12%) 0%, hsl(260 35% 9%) 100%)", border: "1px solid hsl(270 100% 65% / 0.4)", boxShadow: "0 0 40px hsl(270 100% 50% / 0.1)" }}
          >
            <div
              className="pointer-events-none absolute inset-0 animate-neon-breathe rounded-2xl"
              style={{ background: "radial-gradient(ellipse at 20% 20%, hsl(270 100% 50% / 0.15) 0%, transparent 60%)" }}
            />
            <div className="relative">
              <div className="mb-5 flex items-center gap-2">
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: neon }}>Con Visualia</p>
                <Crown className="h-3.5 w-3.5" style={{ color: neon }} />
              </div>
              <ul className="space-y-3">
                {withStudio.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-foreground/90">
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

        {/* Stats row */}
        <div className="mb-14 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className="relative overflow-hidden rounded-xl px-4 py-4 text-center transition-all duration-300 hover-lift"
              style={{ background: "hsl(270 30% 10% / 0.6)", border: "1px solid hsl(270 100% 65% / 0.2)", animationDelay: `${i * 80}ms` }}
            >
              <div
                className="pointer-events-none absolute inset-0 rounded-xl"
                style={{ background: "radial-gradient(ellipse at center, hsl(270 100% 50% / 0.06) 0%, transparent 70%)" }}
              />
              <p
                className="font-display text-2xl font-black leading-none"
                style={{ color: neon, textShadow: `0 0 20px hsl(270 100% 65% / 0.6)` }}
              >
                {s.value}
              </p>
              <p className="mt-1.5 text-[11px] text-muted-foreground leading-snug">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Differentiator strip */}
        <div className="mb-12 rounded-xl neon-border px-6 py-5 text-center">
          <p className="text-sm font-medium text-foreground/80 md:text-base">
            No es solo software:{" "}
            <span className="text-gradient-primary font-semibold">es una solución completa</span>{" "}
            para que tu contenido se vea y se venda mejor.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button
            size="lg"
            className="gradient-primary-vibrant cta-pulse btn-glow border-0 px-8 text-lg text-primary-foreground"
            onClick={() => setShowForm(true)}
          >
            Solicitar Visualia Studio
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button size="lg" variant="outline" className="neon-border neon-border-hover px-8 text-lg hover-lift">
            Ver ejemplos
          </Button>
        </div>
      </div>

      <VisualiaStudioForm open={showForm} onOpenChange={setShowForm} />
    </section>
  );
};

export default VisualiaStudio;
