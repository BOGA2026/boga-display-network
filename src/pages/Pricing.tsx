import Seo from "@/components/Seo";
import { Faq } from "@/components/Faq";

import showcaseImg from "@/assets/signage-restaurant.webp";
import showcaseImg2 from "@/assets/signage-icecream.webp";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import LandingHeader from "@/components/landing/LandingHeader";
import { PriceCalculator } from "@/components/landing/PriceCalculator";
import { FeatureCard } from "@/components/landing/FeatureCard";
import PremiumBackground from "@/components/layout/PremiumBackground";
import {
  Monitor,
  RefreshCw,
  CalendarClock,
  ListMusic,
  Headphones,
  ArrowRight,
  BarChart3,
  Globe,
  Zap,
  Shield,
} from "lucide-react";


const included = [
  {
    icon: Monitor,
    label: "Gestión remota de pantallas",
    explanation:
      "Controla todas tus pantallas desde tu celular o computador, estés donde estés. Por ejemplo: cambias el precio del almuerzo desde tu casa y se actualiza al instante en todas tus sedes.",
  },
  {
    icon: CalendarClock,
    label: "Programación de contenido",
    explanation:
      "Deja todo programado y olvídate: el menú de desayuno aparece solo a las 7:00 a.m. y el de almuerzo a las 11:30 a.m., sin que nadie tenga que tocar el televisor.",
  },
  {
    icon: ListMusic,
    label: "Playlists automáticas",
    explanation:
      "Como una lista de canciones, pero con tus imágenes y videos: tus promociones rotan solas en la pantalla, una tras otra, todo el día.",
  },
  {
    icon: Headphones,
    label: "Soporte técnico prioritario",
    explanation:
      "Si algo falla, escribes por chat y una persona real te ayuda de inmediato. No necesitas saber de tecnología.",
  },
  {
    icon: RefreshCw,
    label: "Actualizaciones continuas",
    explanation:
      "La plataforma mejora todos los meses con funciones nuevas, sin que pagues más ni tengas que instalar nada.",
  },
  {
    icon: Shield,
    label: "Seguridad y respaldos",
    explanation:
      "Tus menús y diseños quedan guardados en la nube. Si el televisor se daña o se va la luz, no pierdes nada: conectas otro TV y todo reaparece.",
  },
];


const valueCards = [
  { icon: Globe, title: "Control total desde cualquier lugar", desc: "Gestiona todas tus pantallas desde un solo panel, sin importar dónde estés." },
  { icon: RefreshCw, title: "Pantallas sincronizadas", desc: "El contenido se actualiza en segundos en todas tus ubicaciones simultáneamente." },
  { icon: CalendarClock, title: "Programación automática", desc: "Define horarios y deja que Visualia muestre el contenido correcto en cada momento." },
  { icon: BarChart3, title: "Estadísticas de reproducción", desc: "Mide qué contenido funciona mejor y optimiza tu comunicación visual." },
];

const Pricing = () => {
  return (
    <PremiumBackground>
      <Seo
        title="Precios de Visualia | Menús digitales desde $22.000 por pantalla"
        description="Planes por volumen para menús digitales y cartelería en restaurantes. Desde $50.000 por pantalla al mes, hasta $22.000 con volumen. Prueba gratis 14 días."
        path="/precios"
      />
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

      <PriceCalculator />

      {/* Showcase */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl text-center">
          <p className="mb-6 text-sm font-semibold uppercase tracking-widest text-primary">Visualia en acción</p>
          <h2 className="mb-4 font-display text-3xl font-bold text-foreground md:text-4xl">Tus pantallas, vendiendo por ti</h2>
          <p className="mx-auto mb-10 max-w-xl text-muted-foreground">Menús digitales, promociones y contenido dinámico que captura la atención de tus clientes.</p>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="overflow-hidden rounded-2xl neon-border glow-primary-sm h-72 md:h-96">
              <img
                src={showcaseImg}
                alt="Pantallas digitales de menú en restaurante gestionadas con Visualia"
                width={1600}
                height={900}
                className="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="overflow-hidden rounded-2xl neon-border glow-primary-sm h-72 md:h-96">
              <img
                src={showcaseImg2}
                alt="Gestión de pantallas de señalización digital en heladería con Visualia"
                width={1600}
                height={900}
                className="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
              />

            </div>
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

      <Faq />

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
                  <Link to="/registro">Hablar con un experto <ArrowRight className="ml-2 h-5 w-5" /></Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/20 px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-xs text-muted-foreground md:flex-row">
          <p>© 2026 Boga Casa de Contenidos S.A.S. · NIT 900.325.011-10 · Bogotá, Colombia</p>
          <div className="flex gap-4">
            <a href="/privacidad" className="hover:text-foreground">Política de tratamiento de datos</a>
            <a href="/terminos" className="hover:text-foreground">Términos y condiciones</a>
          </div>
        </div>
      </footer>
    </PremiumBackground>
  );
};

export default Pricing;
