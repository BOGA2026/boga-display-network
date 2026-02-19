import { useState, useMemo } from "react";
import showcaseImg from "@/assets/signage-restaurant.jpeg";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import LandingHeader from "@/components/landing/LandingHeader";
import PremiumBackground from "@/components/layout/PremiumBackground";
import {
  Monitor,
  RefreshCw,
  CalendarClock,
  ListMusic,
  Headphones,
  ArrowRight,
  Check,
  BarChart3,
  Globe,
  Zap,
  Shield,
} from "lucide-react";

const tiers = [
  { max: 5, price: 50000 },
  { max: 20, price: 42000 },
  { max: 50, price: 35000 },
  { max: 100, price: 28000 },
  { max: 300, price: 22000 },
];

function formatCOP(value: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
}

function getPrice(screens: number) {
  for (const t of tiers) {
    if (screens <= t.max) return t.price;
  }
  return tiers[tiers.length - 1].price;
}

const included = [
  { icon: Monitor, label: "Gestión remota de pantallas" },
  { icon: CalendarClock, label: "Programación de contenido" },
  { icon: ListMusic, label: "Playlists automáticas" },
  { icon: Headphones, label: "Soporte técnico prioritario" },
  { icon: RefreshCw, label: "Actualizaciones continuas" },
  { icon: Shield, label: "Seguridad y respaldos" },
];

const valueCards = [
  { icon: Globe, title: "Control total desde cualquier lugar", desc: "Gestiona todas tus pantallas desde un solo panel, sin importar dónde estés." },
  { icon: RefreshCw, title: "Pantallas sincronizadas", desc: "El contenido se actualiza en segundos en todas tus ubicaciones simultáneamente." },
  { icon: CalendarClock, title: "Programación automática", desc: "Define horarios y deja que Visualia muestre el contenido correcto en cada momento." },
  { icon: BarChart3, title: "Estadísticas de reproducción", desc: "Mide qué contenido funciona mejor y optimiza tu comunicación visual." },
];

const Pricing = () => {
  const [screens, setScreens] = useState(5);
  const [annual, setAnnual] = useState(false);

  const calc = useMemo(() => {
    const perScreen = getPrice(screens);
    const monthly = perScreen * screens;
    const annualTotal = monthly * 12 * 0.8;
    return {
      perScreen: annual ? Math.round(perScreen * 0.8) : perScreen,
      total: annual ? Math.round(annualTotal / 12) : monthly,
      savings: annual ? Math.round(monthly * 12 - annualTotal) : 0,
      storage: screens <= 5 ? "10 GB" : screens <= 20 ? "50 GB" : screens <= 50 ? "150 GB" : "500 GB",
    };
  }, [screens, annual]);

  return (
    <PremiumBackground>
      <LandingHeader />

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-16 pt-32 md:pt-40">
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2" style={{ width: 700, height: 500 }}>
          <div className="absolute left-1/2 top-20 h-72 w-72 -translate-x-1/2 rounded-full animate-neon-breathe blur-[110px]" style={{ background: "hsl(270 100% 50%)", opacity: 0.2 }} />
          <div className="absolute right-1/4 top-32 h-40 w-40 rounded-full animate-neon-breathe blur-[80px]" style={{ background: "hsl(290 100% 50%)", opacity: 0.12, animationDelay: "2s" }} />
        </div>
        <div className="relative mx-auto max-w-3xl text-center">
          <h1 className="font-display text-4xl font-bold leading-tight text-foreground md:text-5xl lg:text-6xl">
            Planes simples para <span className="text-gradient-primary">pantallas que venden</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground md:text-xl">Paga solo por las pantallas que uses. Sin contratos complicados.</p>
          <Button size="lg" className="mt-8 gradient-primary-vibrant cta-pulse btn-glow border-0 px-8 text-lg text-primary-foreground" asChild>
            <Link to="/registro">Comenzar ahora <ArrowRight className="ml-2 h-5 w-5" /></Link>
          </Button>
        </div>
      </section>

      {/* Calculator */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-3xl">
          <div className="glass-card rounded-2xl p-8 md:p-12 glow-primary-sm">
            <div className="mb-10 flex items-center justify-center gap-3">
              <span className={annual ? "text-sm text-muted-foreground" : "text-sm font-medium text-foreground"}>Mensual</span>
              <Switch checked={annual} onCheckedChange={setAnnual} />
              <span className={annual ? "text-sm font-medium text-foreground" : "text-sm text-muted-foreground"}>Anual</span>
              {annual && <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold gradient-primary-vibrant text-primary-foreground glow-primary-sm">Ahorra 20%</span>}
            </div>
            <div className="mb-10">
              <div className="mb-3 flex items-end justify-between">
                <p className="text-sm text-muted-foreground">Número de pantallas</p>
                <span className="font-display text-3xl font-bold stat-glow">{screens}</span>
              </div>
              <Slider value={[screens]} onValueChange={([v]) => setScreens(v)} min={1} max={300} step={1} className="py-2" />
              <div className="mt-1 flex justify-between text-xs text-muted-foreground"><span>1</span><span>50</span><span>100</span><span>200</span><span>300</span></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl surface-neon p-5 text-center transition-all duration-300 hover-lift">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Total mensual</p>
                <p className="mt-2 font-display text-2xl font-bold stat-glow">{formatCOP(calc.total)}</p>
                <p className="text-sm text-muted-foreground">por mes</p>
              </div>
              <div className="rounded-xl surface-neon p-5 text-center transition-all duration-300 hover-lift">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Por pantalla</p>
                <p className="mt-2 font-display text-2xl font-bold stat-glow">{formatCOP(calc.perScreen)}</p>
                <p className="text-sm text-muted-foreground">por mes</p>
              </div>
              <div className="rounded-xl surface-neon p-5 text-center transition-all duration-300 hover-lift">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Almacenamiento</p>
                <p className="mt-2 font-display text-2xl font-bold stat-glow">{calc.storage}</p>
              </div>
              <div className="rounded-xl surface-neon p-5 text-center transition-all duration-300 hover-lift">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Ahorro anual</p>
                <p className="mt-2 font-display text-2xl font-bold text-gradient-primary text-neon-bright">{annual ? formatCOP(calc.savings) : "—"}</p>
              </div>
            </div>
            <div className="mt-8 text-center">
              <Button size="lg" className="gradient-primary-vibrant cta-pulse btn-glow border-0 px-10 text-primary-foreground" asChild>
                <Link to="/registro">Comenzar ahora</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Showcase */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl text-center">
          <p className="mb-6 text-sm font-semibold uppercase tracking-widest text-primary">Visualia en acción</p>
          <h2 className="mb-4 font-display text-3xl font-bold text-foreground md:text-4xl">Tus pantallas, vendiendo por ti</h2>
          <p className="mx-auto mb-10 max-w-xl text-muted-foreground">Menús digitales, promociones y contenido dinámico que captura la atención de tus clientes.</p>
          <div className="overflow-hidden rounded-2xl neon-border glow-primary-sm">
            <img
              src={showcaseImg}
              alt="Pantallas digitales de menú en restaurante gestionadas con Visualia"
              className="w-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* Included */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center font-display text-3xl font-bold text-foreground md:text-4xl">Todo incluido en cada plan</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {included.map((item) => (
              <div key={item.label} className="flex items-center gap-4 glass-card hover:glass-card-hover rounded-xl px-5 py-4 transition-all duration-300 hover-lift">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/15 neon-border">
                  <item.icon className="h-5 w-5 text-primary icon-neon" />
                </div>
                <span className="text-sm font-medium text-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value */}
      <section className="relative px-6 py-20">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 50% 30% at 50% 50%, hsl(270 100% 50% / 0.05) 0%, transparent 70%)" }} />
        <div className="relative mx-auto max-w-6xl">
          <h2 className="mb-4 text-center font-display text-3xl font-bold text-foreground md:text-4xl">¿Qué incluye <span className="text-gradient-primary">Visualia</span>?</h2>
          <p className="mx-auto mb-12 max-w-xl text-center text-muted-foreground">Herramientas profesionales para gestionar tu red de señalización digital.</p>
          <div className="grid gap-6 sm:grid-cols-2">
            {valueCards.map((c) => (
              <div key={c.title} className="group glass-card hover:glass-card-hover rounded-xl p-8 transition-all duration-300 hover-lift">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl neon-border bg-primary/10 transition-all duration-300 group-hover:glow-primary-sm">
                  <c.icon className="h-6 w-6 text-primary icon-neon transition-all duration-300 group-hover:icon-neon-hover" />
                </div>
                <h3 className="mb-2 font-display text-lg font-semibold text-foreground">{c.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Zap className="h-6 w-6 text-primary icon-neon" />
            <p className="text-lg font-medium text-foreground">Sin instalación complicada</p>
          </div>
          <p className="text-muted-foreground">Funciona con cualquier pantalla y Android Box. Conecta, configura desde el panel y listo.</p>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="relative overflow-hidden rounded-2xl neon-border px-8 py-16 md:px-16" style={{ background: "linear-gradient(180deg, hsl(260 25% 14%) 0%, hsl(260 30% 8%) 100%)" }}>
            <div className="pointer-events-none absolute inset-0 animate-neon-breathe" style={{ background: "radial-gradient(ellipse at center, hsl(270 100% 50% / 0.2) 0%, transparent 70%)" }} />
            <div className="relative">
              <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">Empieza hoy y convierte tus pantallas en ventas</h2>
              <p className="mx-auto mt-4 max-w-lg text-muted-foreground">Únete a los negocios que ya confían en Visualia para su comunicación visual.</p>
              <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Button size="lg" className="gradient-primary-vibrant cta-pulse btn-glow border-0 px-8 text-lg text-primary-foreground" asChild>
                  <Link to="/registro">Solicitar demo <ArrowRight className="ml-2 h-5 w-5" /></Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/20 px-6 py-12">
        <div className="mx-auto max-w-6xl text-center">
          <span className="font-display text-sm font-bold text-gradient-primary">Visualia</span>
          <p className="mt-1 text-xs text-muted-foreground/50">© 2026 Visualia. Todos los derechos reservados.</p>
        </div>
      </footer>
    </PremiumBackground>
  );
};

export default Pricing;
