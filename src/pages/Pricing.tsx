import { PRIMARY_CTA_LABEL } from "@/config/pricing";
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

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.486-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.13 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

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
        description="Planes por volumen para menús digitales y cartelería en restaurantes. Desde $50.000 por pantalla al mes, hasta $22.000 con volumen. IVA incluido."
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
              <FeatureCard
                key={item.label}
                title={item.label}
                explanation={item.explanation}
                icon={<item.icon className="h-5 w-5 text-primary icon-neon" aria-hidden="true" />}
              />
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
              <div key={c.title} className="group v-card v-card-interactive p-8 hover-lift">
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

      {/* CTA final */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <div className="cta-final">
            <div className="relative">
              <h2 className="font-display font-bold">
                Empieza hoy y convierte tus pantallas en ventas
              </h2>
              <p>
                Configura tu primera pantalla en menos de 10 minutos. Nosotros te acompañamos por chat en cada paso.
              </p>
              <div className="flex flex-col items-stretch justify-center gap-4 sm:flex-row sm:items-center">
                <Button
                  size="lg"
                  className="inline-flex min-h-[48px] min-w-[44px] items-center justify-center gap-2 bg-primary px-8 text-lg font-semibold text-primary-foreground shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-[3px] focus-visible:outline-white focus-visible:outline-offset-2 active:scale-[0.98]"
                  asChild
                >
                  <Link to="/registro">
                    {PRIMARY_CTA_LABEL}
                    <ArrowRight className="h-5 w-5" aria-hidden="true" />
                  </Link>
                </Button>
                <a
                  href="https://wa.me/573163265696"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[48px] min-w-[44px] items-center justify-center gap-2 rounded-lg border border-white/30 px-8 text-lg font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/10 focus-visible:outline-[3px] focus-visible:outline-white focus-visible:outline-offset-2 active:scale-[0.98]"
                >
                  <WhatsAppIcon className="h-5 w-5" aria-hidden="true" />
                  o escríbenos por WhatsApp
                </a>
              </div>
              <p className="cta-final-micro">
                Sin tarjeta de crédito · Cancela cuando quieras
              </p>
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
