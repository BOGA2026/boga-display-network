import { useEffect } from "react";
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
import simboloVisualia from "@/assets/simbolo-visualia.webp";
import InlineVideo from "@/components/media/InlineVideo";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getCampaign } from "@/config/campaigns";
import { COMPAT_CLIPS } from "@/config/compatibilityMedia";
import { MAX_PRICE_PER_SCREEN } from "@/config/pricing";
import { VISUALIA_DEVICE_PRICE_COP, formatCop } from "@/config/devices";
import { captureAttribution } from "@/lib/attribution";
import BrandChecker from "@/components/lp/BrandChecker";
import LeadForm from "@/components/lp/LeadForm";
import WhatsappButton from "@/components/lp/WhatsappButton";

const STEPS = [
  {
    title: "Conéctalo al HDMI",
    desc: "Enchufas el aparato en la entrada HDMI del televisor y a la corriente.",
    clip: COMPAT_CLIPS.paso1,
  },
  {
    title: "Vincula tu pantalla",
    desc: "El televisor muestra un código y lo escribes una sola vez desde tu celular.",
    clip: COMPAT_CLIPS.paso2,
  },
  {
    title: "Listo, ya estás al aire",
    desc: "Tu menú aparece en pantalla y lo cambias cuando quieras desde el celular.",
    clip: COMPAT_CLIPS.paso3,
  },
];

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

  useEffect(() => {
    captureAttribution(window.location.pathname);
  }, [campaign.slug]);

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <Helmet>
        <title>{campaign.headline}</title>
        <meta name="description" content={campaign.subheadline} />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* Logo sin enlace: de esta página solo se sale convirtiendo. */}
      <header className="px-4 pt-5 md:px-6">
        <img src={simboloVisualia} alt="Visualia" width={32} height={32} className="h-8 w-auto" />
      </header>

      {/* 1 — HERO */}
      <section className="px-4 pb-8 pt-4 md:px-6">
        <div className="mx-auto max-w-3xl">
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
            <WhatsappButton campaignSlug={campaign.slug} message={campaign.whatsappMessage} />
            <a
              href="#formulario"
              className="mt-3 flex items-center justify-center gap-1 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              o déjanos tus datos y te llamamos
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            +150 pantallas funcionando · Empresa colombiana · Soporte en español
          </p>
        </div>
      </section>

      {/* 2 — EL PROBLEMA */}
      <section className="px-4 py-10 md:px-6">
        <div className="mx-auto max-w-3xl space-y-1.5 text-base leading-relaxed text-foreground/90 md:text-lg">
          <p>Cambias un precio y toca reimprimir.</p>
          <p>Se acabó un plato y el cartel sigue ahí.</p>
          <p className="text-muted-foreground">
            La promoción del almuerzo la ve poca gente porque está en una hoja pegada en la puerta.
          </p>
        </div>
      </section>

      {/* 3 — LA SOLUCIÓN EN 3 PASOS */}
      <section className="px-4 py-10 md:px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">
            Estás al aire en tres pasos
          </h2>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.title} className="rounded-2xl border border-border/60 bg-card/40 p-4">
                <div className="overflow-hidden rounded-xl">
                  <InlineVideo sources={s.clip.sources} poster={s.clip.poster} label={s.title} />
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
      <section className="px-4 py-10 md:px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">Qué recibes</h2>
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

      {/* 5 — PRECIO */}
      <section className="px-4 py-10 md:px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">Cuánto cuesta</h2>
          <div className="mt-5 space-y-2">
            <div className="flex items-center justify-between rounded-xl border border-primary/50 bg-primary/10 px-4 py-4">
              <span className="text-sm font-medium text-foreground">Por pantalla, al mes</span>
              <span className="font-display text-xl font-bold text-foreground">
                {formatCop(MAX_PRICE_PER_SCREEN)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/50 bg-card/40 px-4 py-3">
              <span className="text-sm text-muted-foreground">Dispositivo, plan mensual</span>
              <span className="text-sm font-semibold text-muted-foreground">
                {formatCop(VISUALIA_DEVICE_PRICE_COP)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/50 bg-card/40 px-4 py-3">
              <span className="text-sm text-muted-foreground">Dispositivo, pago anual adelantado</span>
              <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                Incluido
              </span>
            </div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Con el pago anual, el dispositivo va incluido. Si tienes varias pantallas, el precio por pantalla
            baja.
          </p>
        </div>
      </section>

      {/* 6 — ¿SIRVE MI TELEVISOR? */}
      <section className="px-4 py-10 md:px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">¿Sirve mi televisor?</h2>
          <p className="mt-2 text-muted-foreground">Depende de la marca. Averígualo en dos clics.</p>
          <div className="mt-5">
            <BrandChecker />
          </div>
        </div>
      </section>

      {/* 7 — PRUEBA SOCIAL */}
      <section className="px-4 py-10 md:px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">
            Funciona igual con una pantalla que con 150
          </h2>
          <div className="mt-4 space-y-3 text-base leading-relaxed text-muted-foreground">
            <p>
              Hoy tenemos más de 150 pantallas funcionando en restaurantes de Colombia, desde locales de una
              sola sede hasta cadenas con varios puntos. La misma plataforma que le sirve a una cadena es la
              que vas a usar tú.
            </p>
            <p>
              Visualia es una empresa colombiana. Desarrollamos el reproductor, el panel y la generación de
              menús acá, y lo operamos desde acá. Cuando algo se rompe, contestamos nosotros.
            </p>
          </div>
        </div>
      </section>

      {/* 8 — PREGUNTAS FRECUENTES */}
      <section className="px-4 py-10 md:px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">Preguntas frecuentes</h2>
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
      <section id="formulario" className="scroll-mt-6 px-4 py-10 md:px-6">
        <div className="mx-auto max-w-3xl rounded-2xl border border-border/60 bg-card/40 p-5 md:p-8">
          <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">
            Cuéntanos de tu restaurante
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Te escribimos por WhatsApp y te decimos con franqueza si te sirve.
          </p>

          <div className="mt-6 grid gap-8 md:grid-cols-2">
            <LeadForm campaignSlug={campaign.slug} />
            <div className="flex flex-col justify-center gap-3 rounded-2xl border border-border/50 bg-background/40 p-5">
              <p className="text-base text-foreground/90">
                ¿Prefieres escribir ahora? Te contestamos por WhatsApp.
              </p>
              <WhatsappButton campaignSlug={campaign.slug} message={campaign.whatsappMessage} />
            </div>
          </div>
        </div>
      </section>

      {/* Pie legal: los únicos enlaces de la página, obligatorios por Ley 1581. */}
      <footer className="px-4 pb-10 pt-4 md:px-6">
        <div className="mx-auto max-w-3xl text-center text-[11px] leading-relaxed text-muted-foreground">
          <p>© {new Date().getFullYear()} Boga Casa de Contenidos S.A.S. · NIT 900.325.011-10 · Bogotá, Colombia</p>
          <p className="mt-1 flex flex-wrap justify-center gap-3">
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
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 px-4 py-3 backdrop-blur md:hidden"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        <WhatsappButton campaignSlug={campaign.slug} message={campaign.whatsappMessage} />
      </div>
    </div>
  );
}
