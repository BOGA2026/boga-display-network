import { Monitor, RefreshCw, Zap } from "lucide-react";

const cards = [
  {
    icon: RefreshCw,
    title: "Actualiza contenido en segundos",
    desc: "Cambia precios, promociones y menús fácilmente desde cualquier lugar.",
    visual: (
      <div className="rounded-lg border border-white/8 bg-white/4 p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="h-2 w-24 rounded bg-white/15" />
          <div className="h-5 w-14 rounded bg-primary/70 text-[9px] font-semibold text-white flex items-center justify-center">Guardar</div>
        </div>
        <div className="space-y-1.5">
          {["Bandeja paisa", "Sancocho del día", "Almuerzo ejecutivo"].map((item, i) => (
            <div key={item} className="flex items-center justify-between rounded bg-white/5 px-2.5 py-1.5">
              <span className="text-[10px] text-white/50">{item}</span>
              <div className="h-2 w-10 rounded bg-white/20" style={{ opacity: 1 - i * 0.2 }} />
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: Monitor,
    title: "Control total de tus pantallas",
    desc: "Administra todas tus pantallas desde un solo panel, en tiempo real.",
    visual: (
      <div className="rounded-lg border border-white/8 bg-white/4 p-4 space-y-2.5">
        <div className="flex items-center gap-2 pb-1 border-b border-white/8">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span className="text-[9px] text-white/40 uppercase tracking-widest">3 pantallas activas</span>
        </div>
        {["Caja principal", "Menú entrada", "Promociones"].map((screen, i) => (
          <div key={screen} className="flex items-center justify-between">
            <span className="text-[10px] text-white/50">{screen}</span>
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full" style={{ background: i < 2 ? "#34d399" : "#a78bfa" }} />
              <span className="text-[9px] text-white/30">{i < 2 ? "En vivo" : "Programada"}</span>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: Zap,
    title: "Configura y conecta rápidamente",
    desc: "Sin técnicos ni instalaciones complejas. Lista en minutos.",
    visual: (
      <div className="rounded-lg border border-white/8 bg-white/4 p-4 space-y-3">
        <div className="flex items-center justify-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5">
            <Monitor className="h-4 w-4 text-white/40" />
          </div>
          <div className="flex gap-1">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-1 w-3 rounded-full bg-primary/50" style={{ opacity: 0.4 + i * 0.2 }} />
            ))}
          </div>
          <div className="flex h-10 items-center justify-center rounded-lg border border-primary/40 bg-primary/10 px-3">
            <span className="font-mono text-xs font-bold text-primary/80 tracking-widest">A4-7B</span>
          </div>
        </div>
        <div className="text-center">
          <span className="text-[9px] text-white/30 uppercase tracking-widest">Ingresa el código — conectado al instante</span>
        </div>
      </div>
    ),
  },
];

const results = [
  { value: "+30%", label: "más ventas promedio" },
  { value: "100%", label: "control remoto total" },
  { value: "< 5 min", label: "configuración inicial" },
];

const FeaturesSection = ({ onDemo }: { onDemo: () => void }) => (
  <section id="features" className="relative px-6 py-24 md:py-32">
    {/* Minimal background — barely visible */}
    <div
      className="pointer-events-none absolute inset-0"
      style={{ background: "radial-gradient(ellipse 60% 40% at 50% 50%, hsl(270 100% 45% / 0.04) 0%, transparent 70%)" }}
    />

    <div className="relative mx-auto max-w-5xl">

      {/* Header */}
      <div className="mb-20 max-w-2xl">
        <p className="mb-4 text-xs font-medium uppercase tracking-widest text-white/30">
          Plataforma
        </p>
        <h2 className="font-display text-3xl font-bold text-white md:text-4xl lg:text-5xl leading-tight">
          Todo lo que necesitas para{" "}
          <span style={{ color: "hsl(270 80% 72%)" }}>controlar tus pantallas</span>{" "}
          y vender más
        </h2>
        <p className="mt-5 text-base text-white/45 leading-relaxed">
          Controla, actualiza y automatiza tus pantallas desde un solo lugar.
        </p>
      </div>

      {/* Feature cards — 3 only */}
      <div className="grid gap-6 md:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="flex flex-col gap-5 rounded-2xl p-6 transition-all duration-200"
              style={{
                background: "hsl(260 25% 8% / 0.7)",
                border: "1px solid hsl(270 20% 20% / 0.5)",
              }}
            >
              {/* Icon */}
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: "hsl(270 60% 15%)", border: "1px solid hsl(270 60% 25% / 0.4)" }}
              >
                <Icon className="h-5 w-5" style={{ color: "hsl(270 70% 70%)" }} strokeWidth={1.5} />
              </div>

              {/* Visual */}
              <div>{card.visual}</div>

              {/* Text */}
              <div className="flex flex-col gap-1.5 mt-auto">
                <h3 className="font-display text-base font-semibold text-white leading-snug">
                  {card.title}
                </h3>
                <p className="text-sm text-white/40 leading-relaxed">{card.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA card */}
      <div
        className="mt-6 rounded-2xl p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 cursor-pointer"
        style={{
          background: "hsl(270 40% 12% / 0.8)",
          border: "1px solid hsl(270 50% 30% / 0.35)",
        }}
        onClick={onDemo}
      >
        <div>
          <h3 className="font-display text-xl font-bold text-white">Empieza hoy</h3>
          <p className="mt-1 text-sm text-white/40">Configura tu primera pantalla en menos de 5 minutos.</p>
        </div>
        <button
          className="flex-shrink-0 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "hsl(270 70% 50%)" }}
        >
          Solicitar demo gratuita
        </button>
      </div>

      {/* Results strip */}
      <div
        className="mt-12 grid grid-cols-3"
        style={{ borderTop: "1px solid hsl(270 20% 18%)", borderBottom: "1px solid hsl(270 20% 18%)" }}
      >
        {results.map((r) => (
          <div key={r.label} className="px-6 py-8 text-center" style={{ borderRight: "1px solid hsl(270 20% 18%)" }}>
            <p
              className="font-display text-3xl font-black leading-none text-white md:text-4xl"
            >
              {r.value}
            </p>
            <p className="mt-2 text-xs text-white/35 leading-snug">{r.label}</p>
          </div>
        ))}
      </div>

    </div>
  </section>
);

export default FeaturesSection;
