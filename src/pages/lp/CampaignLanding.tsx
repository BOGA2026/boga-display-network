import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Clock,
  Sparkles,
  QrCode,
  Smartphone,
  Headphones,
  ChevronDown,
} from "lucide-react";
import InlineVideo from "@/components/media/InlineVideo";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getCampaign, campaignOgImage, SITE_URL } from "@/config/campaigns";
import { COMPAT_CLIPS } from "@/config/compatibilityMedia";
import { ANNUAL_PRICE_PER_SCREEN, MAX_PRICE_PER_SCREEN, PRICING_TIERS } from "@/config/pricing";
import { formatCop } from "@/config/devices";
import { captureAttribution, setPlanChoice, type PlanChoice } from "@/lib/attribution";
import BrandChecker from "@/components/lp/BrandChecker";
import LeadForm from "@/components/lp/LeadForm";
import VisualiaLockup from "@/components/lp/VisualiaLockup";
import WhatsappButton from "@/components/lp/WhatsappButton";
import PlanSelector from "@/components/lp/PlanSelector";

/**
 * Contenedor único de la landing: el MISMO ancho y el MISMO margen lateral en
 * todas las secciones. Sin esto cada bloque arranca en una x distinta y la
 * página se lee desordenada.
 */
const SHELL = "mx-auto w-full max-w-4xl px-5 md:px-8";
const H2 = "font-display text-left text-2xl font-bold text-foreground md:text-3xl";

const STEPS = [
  {
    title: "Conéctalo al HDMI",
    desc: "Enchufas el aparato en la entrada HDMI del televisor y a la corriente.",
    clip: COMPAT_CLIPS.paso1,
    // El clip original queda muy oscuro y no se ve el conector.
    brighten: true,
  },
  {
    title: "Vincula tu pantalla",
    desc: "El televisor muestra un código y lo escribes una sola vez desde tu celular.",
    clip: COMPAT_CLIPS.paso2,
    brighten: false,
  },
  {
    title: "Listo, ya estás al aire",
    desc: "Tu menú aparece en pantalla y lo cambias cuando quieras desde el celular.",
    clip: COMPAT_CLIPS.paso3,
    brighten: false,
  },
];

/** Escala real de precios por volumen, tomada de la fuente única. */
const PRICE_SCALE = PRICING_TIERS.slice(1).map(
  (t) => `desde ${t.min} pantallas, ${formatCop(t.pricePerScreen)}`,
);

const BENEFITS = [
  { icon: Clock, text: "Pantalla de menú que cambia sola según la hora" },
  { icon: Sparkles, text: "Menús generados con inteligencia artificial a partir de tus platos y precios" },
  { icon: QrCode, text: "Código QR para que tus clientes vean la carta en el celular" },
  { icon: Smartphone, text: "Panel para cambiar todo desde tu teléfono, en segundos" },
  { icon: Headphones, text: "Soporte en Colombia, en español" },
];


const FAQ = [
  {
    q: "¿Cuánto me cuesta al mes?",
    a: `${formatCop(MAX_PRICE_PER_SCREEN)} por pantalla al mes. Si tienes varias pantallas, el precio por pantalla baja.`,
  },
  {
    q: "¿Tengo que firmar algo?",
    a: "No. En el plan mensual no firmas contrato ni hay permanencia.",
  },
  {
    q: "¿Necesito saber de tecnología?",
    a: "No. Te enviamos el equipo listo y te acompañamos hasta que tu menú esté en pantalla.",
  },
  {
    q: "¿Y si mi televisor no sirve?",
    a: "Los Samsung y LG necesitan un aparato pequeño que se conecta al HDMI. Te lo enviamos configurado. Con el pago anual va incluido.",
  },
  {
    q: "¿Cuánto se demora en llegar el equipo?",
    a: "Te confirmamos el tiempo de envío por WhatsApp según tu ciudad, apenas hablemos contigo.",
  },
  {
    q: "¿Sirve si solo tengo un local?",
    a: "Sí. No hay mínimo de pantallas: puedes empezar con una sola.",
  },
  {
    q: "¿Puedo cancelar cuando quiera?",
    a: "Sí. En el plan mensual cancelas cuando quieras, sin penalización.",
  },
];

export default function CampaignLanding() {
  const { campana } = useParams();
  const campaign = getCampaign(campana);
  const formRef = useRef<HTMLElement | null>(null);
  const [barVisible, setBarVisible] = useState(false);
  const [formOnScreen, setFormOnScreen] = useState(false);
  // El anual viene marcado: es el que mejor le queda al cliente y el que
  // conviene al negocio. La persona puede cambiarlo.
  const [plan, setPlan] = useState<PlanChoice>("anual");

  useEffect(() => {
    captureAttribution(window.location.pathname);
    setPlanChoice("anual");
  }, [campaign.slug]);

  const waMessage = `${campaign.whatsappMessage} — me interesa el plan ${plan === "anual" ? `anual (${formatCop(ANNUAL_PRICE_PER_SCREEN)} por pantalla al año)` : `mensual (${formatCop(MAX_PRICE_PER_SCREEN)} por pantalla al mes)`}`;


  // La barra aparece cuando la persona ya pasó el hero y se retira cuando el
  // formulario está a la vista: dos botones compitiendo bajan la conversión.
  useEffect(() => {
    const onScroll = () => setBarVisible(window.scrollY > 320);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const el = formRef.current;
    const io = el
      ? new IntersectionObserver(([e]) => setFormOnScreen(e.isIntersecting), { threshold: 0.15 })
      : null;
    if (el && io) io.observe(el);
    return () => {
      window.removeEventListener("scroll", onScroll);
      io?.disconnect();
    };
  }, []);

  const pageUrl = `${SITE_URL}/lp/${campaign.slug}`;
  const ogImage = campaignOgImage(campaign);

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <Helmet>
        <title>{campaign.headline}</title>
        <meta name="description" content={campaign.subheadline} />
        <meta name="robots" content="noindex, nofollow" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Visualia" />
        <meta property="og:locale" content="es_CO" />
        <meta property="og:title" content={campaign.headline} />
        <meta property="og:description" content={campaign.subheadline} />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={campaign.headline} />
        <meta name="twitter:description" content={campaign.subheadline} />
        <meta name="twitter:image" content={ogImage} />
      </Helmet>


      {/* Encabezado: lockup completo. Sin enlaces: de esta página solo se sale
          convirtiendo. */}
      <header className="border-b border-border/50">
        <div className={`${SHELL} flex h-16 items-center`}>
          <VisualiaLockup size={32} />
        </div>
      </header>

      {/* 1 — HERO */}
      <section className="py-8">
        <div className={SHELL}>
          <h1 className="font-display text-[28px] font-bold leading-tight tracking-tight text-foreground md:text-5xl">
            {campaign.headline}
          </h1>
          <p className="mt-2 text-base text-muted-foreground md:text-lg">{campaign.subheadline}</p>

          <div className="mt-4 overflow-hidden rounded-2xl border border-border/60">
            <InlineVideo
              sources={campaign.hero.sources}
              poster={campaign.hero.poster}
              label="Menú digital funcionando en un restaurante"
              rootMargin="0px"
            />
          </div>

          <div className="mt-4">
            <WhatsappButton campaignSlug={campaign.slug} message={waMessage} />
            {/* El botón es verde de WhatsApp a propósito: esta línea lo convierte
                en una acción de Visualia y no en un botón genérico. */}
            <p className="mt-2 flex items-center justify-center gap-2 text-[13px] text-muted-foreground">
              <VisualiaLockup size={16} symbolOnly />
              Te responde el equipo de Visualia
            </p>
            <a
              href="#formulario"
              className="mt-3 flex items-center justify-center gap-1 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              o déjanos tus datos y te llamamos
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>

          {/* Barra de confianza: símbolo primero y en su propia columna para
              que el texto no lo empuje a una línea suelta en móvil. */}
          <p className="mt-5 flex items-center gap-2 text-sm font-medium text-foreground">
            <VisualiaLockup size={16} symbolOnly className="shrink-0" />
            <span>+150 pantallas funcionando · Empresa colombiana · Soporte en español</span>
          </p>
        </div>
      </section>

      {/* 2 — EL PROBLEMA */}
      <section className="py-5">
        <div className={`${SHELL} space-y-1.5 text-base leading-relaxed text-foreground/90 md:text-lg`}>
          <p>Cambias un precio y toca reimprimir.</p>
          <p>Se acabó un plato y el cartel sigue ahí.</p>
          <p className="text-muted-foreground">
            La promoción del almuerzo la ve poca gente porque está en una hoja pegada en la puerta.
          </p>
        </div>
      </section>

      {/* 3 — LA SOLUCIÓN EN 3 PASOS */}
      <section className="py-10">
        <div className={SHELL}>
          <h2 className={H2}>Estás al aire en tres pasos</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.title} className="rounded-2xl border border-border/60 bg-card/40 p-4">
                <div className="overflow-hidden rounded-xl">
                  <InlineVideo
                    sources={s.clip.sources}
                    poster={s.clip.poster}
                    label={s.title}
                    className={s.brighten ? "[&>video]:brightness-[1.35] [&>video]:contrast-[1.08]" : ""}
                  />
                </div>
                <span className="mt-3 block text-xs font-semibold uppercase tracking-widest text-primary">
                  Paso {i + 1}
                </span>
                <h3 className="mt-1 text-base font-semibold text-foreground">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4 — QUÉ RECIBES */}
      <section className="py-10">
        <div className={SHELL}>
          <h2 className={H2}>Qué recibes</h2>
          <ul className="mt-6 space-y-4 p-0">
            {BENEFITS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex list-none items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15">
                  <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                </span>
                <span className="text-base text-foreground/90">{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 5 — PRECIO: el servicio y el dispositivo son dos cosas distintas y se
          separan para que no se lean como tres planes alternativos. */}
      <section className="py-10">
        <div className={SHELL}>
          <h2 className={H2}>Cuánto cuesta</h2>

          <h3 className="mt-6 text-sm font-semibold uppercase tracking-widest text-primary">El servicio</h3>
          <div className="mt-3 flex items-center justify-between rounded-xl border border-primary/50 bg-primary/10 px-4 py-4">
            <span className="text-sm font-medium text-foreground">Por pantalla, al mes</span>
            <span className="text-right">
              <span className="block font-display text-xl font-bold text-foreground">
                {formatCop(MAX_PRICE_PER_SCREEN)}
              </span>
              <span className="block text-xs text-muted-foreground">{IVA_LEGEND}</span>
            </span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Si tienes varias pantallas, el precio por pantalla baja:{" "}
            {PRICE_SCALE.map((t, i) => (
              <span key={t}>
                {i > 0 && " · "}
                {t}
              </span>
            ))}
            .
          </p>
          <p className="mt-2 text-xs text-muted-foreground">{PRICING_FOOTNOTE}</p>


          <hr className="my-7 border-border/60" />

          <h3 className="text-sm font-semibold uppercase tracking-widest text-primary">
            Cómo prefieres pagarlo
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Elige una opción: la usamos cuando te escribamos.
          </p>
          <div className="mt-3">
            <PlanSelector onChange={setPlan} />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            El dispositivo solo hace falta si tu televisor no es compatible.{" "}
            <a href="#compatibilidad" className="text-primary underline underline-offset-4">
              Averígualo aquí
            </a>
            .
          </p>

        </div>
      </section>

      {/* 6 — ¿SIRVE MI TELEVISOR? */}
      <section id="compatibilidad" className="scroll-mt-6 py-10">
        <div className={SHELL}>
          <h2 className={H2}>¿Sirve mi televisor?</h2>
          <p className="mt-2 text-muted-foreground">Depende de la marca. Averígualo en dos clics.</p>
          <div className="mt-5">
            <BrandChecker />
          </div>
        </div>
      </section>

      {/* 7 — PRUEBA SOCIAL */}
      <section className="py-10">
        <div className={SHELL}>
          <h2 className={H2}>Funciona igual con una pantalla que con 150</h2>
          <div className="mt-4 space-y-3 text-base leading-relaxed text-muted-foreground">
            <p>
              Hoy tenemos más de 150 pantallas funcionando en restaurantes de Colombia, desde locales de una
              sola sede hasta cadenas con varios puntos. La misma plataforma que le sirve a una cadena es la
              que vas a usar tú.
            </p>
            <p>
              Visualia es una empresa colombiana. Desarrollamos el reproductor, el panel y la generación de
              menús aquí, y lo operamos desde aquí. Cuando algo se rompe, contestamos nosotros.
            </p>
          </div>
        </div>
      </section>


      {/* 8 — PREGUNTAS FRECUENTES */}
      <section className="py-10">
        <div className={SHELL}>
          <h2 className={H2}>Preguntas frecuentes</h2>
          <Accordion type="single" collapsible className="mt-4">
            {FAQ.map((f) => (
              <AccordionItem key={f.q} value={f.q}>
                <AccordionTrigger className="text-left text-base">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* 9 — CIERRE + FORMULARIO */}
      <section id="formulario" ref={formRef} className="scroll-mt-6 py-10">
        <div className={SHELL}>
          <div className="rounded-2xl border border-border/60 bg-card/40 p-5 md:p-8">
            <h2 className={H2}>Cuéntanos de tu restaurante</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Te escribimos por WhatsApp y te decimos con franqueza si te sirve.
            </p>

            <div className="mt-6 grid gap-8 md:grid-cols-2">
              <LeadForm campaignSlug={campaign.slug} />
              <div className="flex flex-col gap-3 rounded-2xl border border-border/50 bg-background/40 p-5">
                <VisualiaLockup size={28} />
                <p className="text-base text-foreground/90">
                  ¿Prefieres escribir ahora? Te contestamos por WhatsApp.
                </p>
                <WhatsappButton campaignSlug={campaign.slug} message={waMessage} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pie legal: los únicos enlaces de la página, obligatorios por Ley 1581. */}
      <footer className="border-t border-border/50 pb-10 pt-6">
        <div className={`${SHELL} text-xs leading-relaxed text-muted-foreground`}>
          <VisualiaLockup size={24} />
          <p className="mt-3">© {new Date().getFullYear()} Boga Casa de Contenidos S.A.S. · NIT 900.325.011-10 · Bogotá, Colombia</p>
          <p className="mt-1 flex flex-wrap gap-3">

            <a href="/legal/privacidad" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
              Política de tratamiento de datos
            </a>
            <a href="/legal/terminos" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
              Términos y condiciones
            </a>
          </p>
        </div>
      </footer>

      {/* 10 — BARRA FIJA EN MÓVIL */}
      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 px-4 py-2 backdrop-blur transition-all duration-300 md:hidden ${
          barVisible && !formOnScreen
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-full opacity-0"
        }`}
        style={{ paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom))" }}
      >
        <WhatsappButton
          campaignSlug={campaign.slug}
          message={waMessage}
          className="h-14 py-0"
        />
      </div>

    </div>
  );
}
