import { Monitor, ListMusic, CalendarClock, QrCode, BarChart2 } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, ResponsiveContainer,
} from "recharts";

const neon = "hsl(270 100% 65%)";
const neonFill = "hsl(270 100% 65% / 0.18)";

// Mini chart data
const uploadData  = [{ v: 30 }, { v: 45 }, { v: 40 }, { v: 60 }, { v: 75 }, { v: 70 }, { v: 90 }];
const playlistData= [{ v: 20 }, { v: 35 }, { v: 50 }, { v: 45 }, { v: 65 }, { v: 80 }, { v: 88 }];
const schedData   = [{ v: 10 }, { v: 25 }, { v: 40 }, { v: 55 }, { v: 70 }, { v: 80 }, { v: 92 }];
const analytData  = [{ v: 25 }, { v: 38 }, { v: 50 }, { v: 45 }, { v: 68 }, { v: 82 }, { v: 95 }];
const pairData    = [{ v: 15 }, { v: 30 }, { v: 28 }, { v: 48 }, { v: 62 }, { v: 78 }, { v: 90 }];

const features = [
  {
    icon: Monitor,
    impact: "Instantáneo",
    title: "Sube contenido en segundos",
    desc: "Promociones, precios y menús sin complicaciones",
    chart: "bar",
    data: uploadData,
    delay: "0ms",
    visual: (
      <div className="relative flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
        <div className="h-8 w-8 rounded bg-white/10 flex items-center justify-center">
          <Monitor className="h-4 w-4" style={{ color: neon }} />
        </div>
        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
          <div className="h-1.5 w-full rounded-full bg-white/15" />
          <div className="h-1.5 w-3/4 rounded-full bg-white/10" />
        </div>
        <div className="h-4 w-4 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: neon }}>
          <span className="text-[6px] font-bold text-white">✓</span>
        </div>
      </div>
    ),
  },
  {
    icon: ListMusic,
    impact: "Menos trabajo manual",
    title: "Contenido automático",
    desc: "Visualia organiza todo por ti",
    chart: "area",
    data: playlistData,
    delay: "60ms",
    visual: (
      <div className="flex flex-col gap-1">
        {["Promo mañana", "Menú del día", "Oferta tarde"].map((label, i) => (
          <div key={label} className="flex items-center gap-2 rounded border border-white/10 bg-white/5 px-2 py-1">
            <div className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: neon, opacity: 1 - i * 0.25 }} />
            <span className="text-[9px] text-white/50 truncate">{label}</span>
            <div className="ml-auto h-3 w-6 rounded-sm bg-white/10" />
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: CalendarClock,
    impact: "Ventas en el momento correcto",
    title: "Promociones programadas",
    desc: "Cambia contenido según la hora automáticamente",
    chart: "bar",
    data: schedData,
    delay: "120ms",
    visual: (
      <div className="flex items-end gap-0.5 h-8">
        {[
          { label: "8am", h: "40%" },
          { label: "12pm", h: "80%" },
          { label: "3pm", h: "60%" },
          { label: "7pm", h: "90%" },
          { label: "10pm", h: "50%" },
        ].map(({ label, h }) => (
          <div key={label} className="flex flex-col items-center gap-0.5 flex-1">
            <div className="w-full rounded-t" style={{ height: h, background: neon, opacity: 0.7 }} />
            <span className="text-[7px] text-white/30">{label}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: BarChart2,
    impact: "Optimiza tus resultados",
    title: "Mide qué vende más",
    desc: "Identifica el contenido más efectivo",
    chart: "area",
    data: analytData,
    delay: "180ms",
    visual: (
      <div className="relative h-8 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={analytData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="anal-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={neon} stopOpacity={0.4} />
                <stop offset="100%" stopColor={neon} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="v" stroke={neon} strokeWidth={2} fill="url(#anal-grad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    ),
  },
  {
    icon: QrCode,
    impact: "Sin técnicos ni configuraciones",
    title: "Conecta pantallas en segundos",
    desc: "Solo ingresa el código y listo",
    chart: "bar",
    data: pairData,
    delay: "240ms",
    visual: (
      <div className="flex items-center justify-center gap-2">
        <div className="flex items-center justify-center rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 gap-1">
          {["A","4","7","B","2","X"].map((c, i) => (
            <span key={i} className="font-display text-sm font-bold" style={{ color: i < 3 ? neon : "hsl(270 100% 80%)" }}>{c}</span>
          ))}
        </div>
        <div className="h-5 w-5 flex-shrink-0 rounded-full flex items-center justify-center" style={{ background: "hsl(270 100% 65% / 0.2)", border: `1px solid ${neon}` }}>
          <span className="text-[8px]" style={{ color: neon }}>→</span>
        </div>
        <div className="h-8 w-6 rounded border flex items-center justify-center" style={{ borderColor: "hsl(270 100% 65% / 0.4)" }}>
          <Monitor className="h-3.5 w-3.5" style={{ color: neon }} />
        </div>
      </div>
    ),
  },
];

const stats = [
  { value: "+30%", label: "aumento en ventas" },
  { value: "-80%", label: "menos tiempo gestionando" },
  { value: "100%", label: "control remoto" },
  { value: "< 5 min", label: "configuración inicial" },
];

const FeaturesSection = ({ onDemo }: { onDemo: () => void }) => (
  <section id="features" className="relative px-6 py-20 md:py-28">
    {/* Section background glow */}
    <div
      className="pointer-events-none absolute inset-0"
      style={{ background: "radial-gradient(ellipse 70% 45% at 50% 50%, hsl(270 100% 45% / 0.08) 0%, transparent 70%)" }}
    />

    <div className="relative mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-16 text-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Plataforma Visualia
        </p>
        <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl lg:text-5xl leading-tight">
          Todo lo que necesitas para{" "}
          <span className="text-gradient-primary">controlar tus pantallas</span>
          {" "}y vender más
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-muted-foreground text-base">
          Visualia automatiza, organiza y optimiza tus pantallas para aumentar tus ventas sin esfuerzo.
        </p>
      </div>

      {/* Feature cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <div
              key={f.title}
              className="group relative overflow-hidden glass-card hover:glass-card-hover rounded-2xl p-6 transition-all duration-300 hover-lift flex flex-col gap-4"
              style={{ animationDelay: f.delay }}
            >
              {/* Animated glow border on hover */}
              <div
                className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{ boxShadow: `inset 0 0 0 1px hsl(270 100% 65% / 0.5), 0 0 30px hsl(270 100% 50% / 0.15)` }}
              />
              {/* Corner glow */}
              <div
                className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full blur-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-30"
                style={{ background: "hsl(270 100% 60%)" }}
              />

              {/* Top row: icon + impact badge */}
              <div className="relative flex items-start justify-between gap-2">
                <div
                  className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110"
                  style={{ background: "hsl(270 100% 50% / 0.15)", border: "1px solid hsl(270 100% 65% / 0.35)" }}
                >
                  <Icon className="h-6 w-6 transition-all duration-300" style={{ color: neon }} strokeWidth={2} />
                </div>
                <span
                  className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                  style={{ background: "hsl(270 100% 50% / 0.12)", border: "1px solid hsl(270 100% 65% / 0.25)", color: "hsl(270 100% 80%)" }}
                >
                  {f.impact}
                </span>
              </div>

              {/* Mini visual */}
              <div className="relative">{f.visual}</div>

              {/* Text */}
              <div className="relative flex flex-col gap-1">
                <h3 className="font-display text-base font-bold text-foreground leading-snug">
                  {f.title}
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          );
        })}

        {/* CTA card */}
        <div
          className="group relative overflow-hidden rounded-2xl p-6 flex flex-col justify-between cursor-pointer transition-all duration-300 hover-lift"
          style={{ background: "linear-gradient(135deg, hsl(270 80% 20%) 0%, hsl(280 90% 15%) 100%)", border: "1px solid hsl(270 100% 65% / 0.3)" }}
          onClick={onDemo}
        >
          <div
            className="pointer-events-none absolute inset-0 animate-neon-breathe rounded-2xl"
            style={{ background: "radial-gradient(ellipse at 30% 30%, hsl(270 100% 50% / 0.25) 0%, transparent 60%)" }}
          />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "hsl(270 100% 80%)" }}>
              Empieza hoy
            </p>
            <h3 className="mt-3 font-display text-xl font-bold text-foreground leading-snug">
              ¿Listo para vender más con tus pantallas?
            </h3>
            <p className="mt-2 text-xs text-muted-foreground">
              Solicita tu demo gratuita y empieza en menos de 5 minutos.
            </p>
          </div>
          <div
            className="relative mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all duration-300 group-hover:scale-105"
            style={{ background: "linear-gradient(135deg, hsl(270 100% 55%), hsl(290 100% 60%))", boxShadow: "0 0 20px hsl(270 100% 50% / 0.5)" }}
          >
            Solicitar demo gratis
            <span>→</span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className="relative overflow-hidden rounded-xl px-5 py-4 text-center transition-all duration-300 hover-lift"
            style={{
              background: "hsl(270 30% 10% / 0.6)",
              border: "1px solid hsl(270 100% 65% / 0.2)",
              animationDelay: `${i * 80}ms`,
            }}
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
    </div>
  </section>
);

export default FeaturesSection;
