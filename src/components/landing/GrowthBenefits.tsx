import { Eye, TrendingUp, Monitor, Zap } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, ResponsiveContainer, Tooltip,
} from "recharts";

const visibilityData = [
  { v: 20 }, { v: 35 }, { v: 45 }, { v: 38 }, { v: 55 }, { v: 70 }, { v: 85 },
];
const revenueData = [
  { v: 30 }, { v: 42 }, { v: 38 }, { v: 55 }, { v: 60 }, { v: 75 }, { v: 95 },
];
const screensData = [
  { v: 40 }, { v: 50 }, { v: 45 }, { v: 65 }, { v: 70 }, { v: 80 }, { v: 90 },
];
const autoData = [
  { v: 10 }, { v: 20 }, { v: 35 }, { v: 50 }, { v: 65 }, { v: 75 }, { v: 88 },
];

const neonColor = "hsl(270 100% 65%)";
const neonColorDim = "hsl(270 100% 65% / 0.15)";

const cards = [
  {
    icon: Eye,
    stat: "+60%",
    statLabel: "visibilidad",
    title: "Más clientes ven tus productos",
    sub: "Tus promociones se ven claras y atractivas",
    chart: "bar",
    data: visibilityData,
    delay: "0ms",
  },
  {
    icon: TrendingUp,
    stat: "+30%",
    statLabel: "en ventas",
    title: "Aumenta tus ventas",
    sub: "Los clientes compran más cuando ven mejor",
    chart: "area",
    data: revenueData,
    delay: "80ms",
  },
  {
    icon: Monitor,
    stat: "+45%",
    statLabel: "eficiencia",
    title: "Controla todas tus pantallas",
    sub: "Cambia precios y promociones en segundos",
    chart: "bar",
    data: screensData,
    delay: "160ms",
  },
  {
    icon: Zap,
    stat: "24/7",
    statLabel: "automático",
    title: "Todo funciona solo",
    sub: "Sin esfuerzo ni complicaciones",
    chart: "area",
    data: autoData,
    delay: "240ms",
  },
];

const GrowthBenefits = () => (
  <section className="relative px-6 py-20 md:py-28">
    <div
      className="pointer-events-none absolute inset-0"
      style={{ background: "radial-gradient(ellipse 70% 55% at 50% 40%, hsl(270 100% 40% / 0.09) 0%, transparent 70%)" }}
    />
    <div className="relative mx-auto max-w-6xl">
      {/* Headline */}
      <div className="mb-14 text-center animate-fade-in">
        <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
          Tu negocio{" "}
          <span className="text-gradient-primary">vende más</span>
          {" "}con pantallas digitales
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
          Resultados reales para negocios como el tuyo.
        </p>
      </div>

      {/* Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="group relative overflow-hidden glass-card hover:glass-card-hover rounded-2xl p-6 transition-all duration-300 hover-lift flex flex-col gap-4"
              style={{ animationDelay: card.delay }}
            >
              {/* Hover glow */}
              <div
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-400 group-hover:opacity-100 rounded-2xl"
                style={{ background: "radial-gradient(ellipse at top left, hsl(270 100% 50% / 0.12) 0%, transparent 60%)" }}
              />

              {/* Icon + stat row */}
              <div className="relative flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-primary-vibrant glow-primary-sm transition-shadow duration-300 group-hover:glow-primary">
                  <Icon className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
                </div>
                <div className="text-right">
                  <p
                    className="font-display text-3xl font-black leading-none text-gradient-primary"
                  >
                    {card.stat}
                  </p>
                  <p className="mt-0.5 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                    {card.statLabel}
                  </p>
                </div>
              </div>

              {/* Chart */}
              <div className="relative h-16 w-full">
                {/* Glow behind chart */}
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-8 blur-md opacity-40"
                  style={{ background: `linear-gradient(0deg, ${neonColor}, transparent)` }}
                />
                <ResponsiveContainer width="100%" height="100%">
                  {card.chart === "bar" ? (
                    <BarChart data={card.data} barSize={6} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                      <Bar dataKey="v" fill={neonColor} radius={[3, 3, 0, 0]} />
                    </BarChart>
                  ) : (
                    <AreaChart data={card.data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id={`grad-${card.stat}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={neonColor} stopOpacity={0.4} />
                          <stop offset="100%" stopColor={neonColor} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="v"
                        stroke={neonColor}
                        strokeWidth={2}
                        fill={`url(#grad-${card.stat})`}
                        dot={false}
                      />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </div>

              {/* Text */}
              <div className="relative">
                <h3 className="font-display text-base font-bold text-foreground leading-snug">
                  {card.title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {card.sub}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </section>
);

export default GrowthBenefits;
