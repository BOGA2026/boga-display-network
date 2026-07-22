import { useState, useCallback, useRef, useEffect } from "react";
import Seo from "@/components/Seo";
import { prefetchPublicRoutes } from "@/lib/prefetch";
import LazyVideo from "@/components/landing/LazyVideo";
import InitialsAvatar from "@/components/ui/InitialsAvatar";

import heroVideo from "@/assets/hero-video.mp4";
import heroVideoWebm from "@/assets/hero-video.webm";
import heroPresenterMp4 from "@/assets/hero-presenter.mp4.asset.json";
import heroPresenterWebm from "@/assets/hero-presenter.webm.asset.json";
import benefitsVideo from "@/assets/benefits-video.mp4";
import benefitsPresenterWebm from "@/assets/benefits-presenter.webm.asset.json";
import albertPresenter2Mp4 from "@/assets/albert-presenter-2.mp4";
import albertPresenter2Webm from "@/assets/albert-presenter-2.webm";
import { Link, useSearchParams, Navigate } from "react-router-dom";
import logoVisualia from "@/assets/logo-visualia.webp";
import { Button } from "@/components/ui/button";
import LandingHeader from "@/components/landing/LandingHeader";
import IntroSplash, { hasSeenIntro } from "@/components/landing/IntroSplash";
import DemoRequestDialog from "@/components/landing/DemoRequestDialog";
import WorkflowDemoModal from "@/components/landing/WorkflowDemoModal";
import ExpertChat from "@/components/landing/ExpertChat";
import PremiumBackground from "@/components/layout/PremiumBackground";

import ClientScreensShowcase from "@/components/landing/ClientScreensShowcase";
import Testimonials from "@/components/landing/Testimonials";
import WhatsAppFloatingButton from "@/components/landing/WhatsAppFloatingButton";
import {
  ArrowRight,
  Star,
  Instagram,
  Linkedin,
  Volume2,
  VolumeX,
  Check,
  Play,
  RefreshCw,
  Clock,
  Building2,
} from "lucide-react";
import { Faq } from "@/components/Faq";
import muestraPlatos from "@/assets/muestra-platos.mp4";
import { PRICING_TIERS, MIN_PRICE_PER_SCREEN } from "@/config/pricing";

const _fmtCOP = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});
const formatCOPStatic = (n: number) => _fmtCOP.format(n);
import muestraPlatosWebm from "@/assets/muestra-platos.webm";
import destacaPromociones from "@/assets/destaca-promociones.mp4";
import destacaPromocionesWebm from "@/assets/destaca-promociones.webm";
import vendeMasRapido from "@/assets/vende-mas-rapido.mp4";
import vendeMasRapidoWebm from "@/assets/vende-mas-rapido.webm";
import ParticlesBackground from "@/components/landing/ParticlesBackground";


// ---------- Content ----------
const benefits = [
  {
    icon: RefreshCw,
    title: "Actualiza precios en segundos, no en semanas",
    desc: "Cambia menús, combos y promos desde el celular. Tus pantallas se actualizan al instante.",
    media: muestraPlatos,
    mediaWebm: muestraPlatosWebm,
  },
  {
    icon: Clock,
    title: "Programa promos por hora del día",
    desc: "Desayuno, almuerzo, happy hour y cena. Cada pantalla muestra lo correcto en cada momento.",
    media: destacaPromociones,
    mediaWebm: destacaPromocionesWebm,
  },
  {
    icon: Building2,
    title: "Controla todas tus sedes desde un panel",
    desc: "Una cuenta, todas tus tiendas. Envía contenido a una pantalla o a todas con un clic.",
    media: vendeMasRapido,
    mediaWebm: vendeMasRapidoWebm,
  },
];

const steps = [
  {
    num: "01",
    title: "Conecta tu pantalla",
    desc: "Enchufa cualquier TV con Android TV o Fire TV. Si tu TV no es \"smart\", usa un TV Box Android (un aparato pequeño de ~$150.000 COP que convierte cualquier TV en Smart TV — te decimos cuál comprar). Ingresa un código de 6 dígitos y listo.",
  },
  {
    num: "02",
    title: "Sube tu contenido",
    desc: "Fotos, videos, menús y promos. Desde tu celular o computador.",
  },
  {
    num: "03",
    title: "Vende más",
    desc: "Programa qué mostrar y a qué hora. Tus clientes deciden más rápido.",
  },
];

type PricingCard = {
  name: string;
  price: number | null;
  priceLabel?: string;
  detail: string;
  features: string[];
  cta: string;
  ctaHref?: string;
  highlight: boolean;
  contact?: boolean;
};

const pricingTiers: PricingCard[] = [
  {
    name: `${PRICING_TIERS[0].min} a ${PRICING_TIERS[0].max} pantallas`,
    price: PRICING_TIERS[0].pricePerScreen,
    detail: "por pantalla / mes",
    features: [
      "Actualizaciones ilimitadas",
      "Editor y plantillas listas",
      "Soporte por chat",
    ],
    cta: "Empezar",
    highlight: false,
  },
  {
    name: `${PRICING_TIERS[1].min} a ${PRICING_TIERS[1].max} pantallas`,
    price: PRICING_TIERS[1].pricePerScreen,
    detail: "por pantalla / mes",
    features: [
      "Todo lo anterior",
      "Multi-sede en un solo panel",
      "Programación por horario",
      "Soporte prioritario",
    ],
    cta: "Prueba gratis 14 días",
    highlight: true,
  },
  {
    name: `${PRICING_TIERS[2].min} o más`,
    price: null,
    priceLabel: `desde ${formatCOPStatic(MIN_PRICE_PER_SCREEN)}`,
    detail: "por pantalla / mes, según volumen",
    features: [
      "Descuentos por volumen",
      "Onboarding personalizado",
      "Gerente de cuenta",
    ],
    cta: "Ver calculadora",
    ctaHref: "/precios",
    highlight: false,
  },
];

const testimonials = [
  {
    name: "Alba Sabogal",
    role: "Gerente de Operaciones",
    business: "El Carnal",
    quote:
      "Cambiamos promociones y combos del día en minutos. Impactó directo en la rotación y en las ventas del punto.",
  },
  {
    name: "Diana Duarte",
    role: "Gerente de Mercadeo",
    business: "Mochisand",
    quote:
      "Estandarizamos la comunicación en todos los puntos. Los lanzamientos ahora tienen mucha más visibilidad.",
  },
];

const HEADLINE = "Tu menú en pantalla, siempre actualizado y vendiendo más";
const SUBHEAD =
  "Cambia precios y promociones desde tu celular y se actualizan al instante en todas las pantallas de tu restaurante. Sin diseñador, sin técnico, sin imprimir cartas nunca más.";

function formatCOP(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// ---------- Fire TV redirect ----------
const isFireTvBrowser = () => {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /AFT|Silk|Fire TV|AmazonWebAppPlatform/i.test(ua);
};

const Landing = () => {
  if (isFireTvBrowser()) return <Navigate to="/tv" replace />;

  const [searchParams, setSearchParams] = useSearchParams();
  const [demoOpen, setDemoOpen] = useState(false);
  const [workflowOpen, setWorkflowOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  // Persisted audio prefs
  const savedVolume = (() => {
    const v = parseFloat(localStorage.getItem("visualia_hero_volume") || "");
    return Number.isFinite(v) && v >= 0 && v <= 1 ? v : 0.8;
  })();
  const savedMuted = localStorage.getItem("visualia_hero_muted");
  const initialMuted = savedMuted === null ? true : savedMuted === "true";

  const [muted, setMuted] = useState(initialMuted);
  const [volume, setVolume] = useState(savedVolume);
  const [showSoundPrompt, setShowSoundPrompt] = useState(initialMuted);
  const [videoFailed, setVideoFailed] = useState(false);
  const [activeHeroVideo, setActiveHeroVideo] = useState<"presenter" | "product">("presenter");
  const presenterRef = useRef<HTMLVideoElement>(null);
  const heroRef = useRef<HTMLVideoElement>(null);
  const benefitsVideoRef = useRef<HTMLVideoElement>(null);
  const [benefitsMuted, setBenefitsMuted] = useState(true);
  const presenter2Ref = useRef<HTMLVideoElement>(null);
  const [presenter2Muted, setPresenter2Muted] = useState(true);


  useEffect(() => {
    const vid = presenterRef.current;
    if (!vid) return;
    vid.muted = true; // must start muted for autoplay
    vid.volume = volume;
    vid.playsInline = true;
    vid.play().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Warm up likely-next public route chunks during idle time.
  useEffect(() => {
    prefetchPublicRoutes([
      "/precios",
      "/soluciones/restaurantes",
      "/acerca",
      "/descargar-apk",
    ]);
  }, []);

  // Reveal bento / steps / pricing cards as they enter the viewport.
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const elements = document.querySelectorAll(".reveal-on-scroll");
    if (elements.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);


  const persistMuted = (m: boolean) => localStorage.setItem("visualia_hero_muted", String(m));
  const persistVolume = (v: number) => localStorage.setItem("visualia_hero_volume", String(v));

  const activateSound = useCallback(() => {
    const vid = activeHeroVideo === "presenter" ? presenterRef.current : heroRef.current;
    if (vid) {
      vid.muted = false;
      vid.volume = volume || 0.8;
      vid.play().catch(() => {});
    }
    setMuted(false);
    setShowSoundPrompt(false);
    persistMuted(false);
  }, [activeHeroVideo, volume]);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      if (presenterRef.current) presenterRef.current.muted = next;
      if (heroRef.current) heroRef.current.muted = next;
      persistMuted(next);
      return next;
    });
  }, []);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    persistVolume(v);
    const vid = heroRef.current;
    const presenter = presenterRef.current;
    [vid, presenter].forEach((video) => {
      if (video) {
        video.volume = v;
        if (v > 0 && video.muted) video.muted = false;
      }
    });
    if (v > 0 && muted) {
        setMuted(false);
        persistMuted(false);
    }
  }, [muted]);

  const showProductVideo = useCallback(() => {
    setActiveHeroVideo("product");
    const video = heroRef.current;
    if (video) {
      video.currentTime = 0;
      video.muted = muted;
      video.volume = volume;
      video.play().catch(() => {});
    }
  }, [muted, volume]);

  const showPresenterVideo = useCallback(() => {
    setActiveHeroVideo("presenter");
    const video = presenterRef.current;
    if (video) {
      video.currentTime = 0;
      video.muted = muted;
      video.volume = volume;
      video.play().catch(() => {});
    }
  }, [muted, volume]);

  const forceIntro = searchParams.get("intro") === "reset";
  const [showIntro, setShowIntro] = useState(() => forceIntro || !hasSeenIntro());
  const handleIntroComplete = useCallback(() => {
    setShowIntro(false);
    if (forceIntro) {
      searchParams.delete("intro");
      setSearchParams(searchParams, { replace: true });
    }
  }, [forceIntro, searchParams, setSearchParams]);

  return (
    <PremiumBackground className="public-shell">
      <Seo
        title="Visualia | Menús digitales para restaurantes – Pantallas que venden"
        description="Menús digitales y cartelería inteligente para restaurantes y negocios físicos en Colombia. Actualiza precios y promociones en segundos. Prueba gratis 14 días."
        path="/"
      />
      {showIntro && <IntroSplash onComplete={handleIntroComplete} />}
      <ParticlesBackground />
      <LandingHeader />


      {/* 1. HERO */}
      <section className="relative overflow-hidden px-4 pb-10 pt-24 md:px-6 md:pt-28" aria-labelledby="hero-title">
        <div className="section-glow" aria-hidden="true" />
        {/* Aurora background */}
        <div className="hero-aurora" aria-hidden="true">
          <div className="hero-aurora-3" />
        </div>


        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <h1
            id="hero-title"
            className="hero-rise hero-rise-1 mt-4 font-display font-bold leading-[1.05] tracking-[-0.02em] text-white text-[44px] sm:text-6xl md:text-7xl lg:text-[80px]"
          >
            Menús digitales para restaurantes:{" "}
            <span className="bg-gradient-to-r from-[#5227FF] to-[#B19EEF] bg-clip-text text-transparent">
              pantallas que venden
            </span>
          </h1>
          <p className="hero-rise hero-rise-2 mx-auto mt-6 max-w-2xl text-base sm:text-lg" style={{ color: "rgba(255,255,255,0.6)" }}>
            {SUBHEAD}
          </p>

          <div className="hero-rise hero-rise-3 mt-9 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              to="/registro"
              data-analytics="cta_hero_registro"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#5227FF] px-8 py-3.5 text-base font-semibold text-white transition-all duration-300 hover:bg-[#5227FF] hover:shadow-[0_0_40px_rgba(82,39,255,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B19EEF]"
            >
              Prueba gratis 14 días
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <button
              type="button"
              onClick={() => setWorkflowOpen(true)}
              data-analytics="cta_hero_demo"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-transparent px-8 py-3.5 text-base font-medium text-white transition-all duration-300 hover:border-white/30 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            >
              <Play className="h-4 w-4" /> Ver demo
            </button>
          </div>
          <p className="hero-rise hero-rise-4 mt-4 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
            Cancela cuando quieras
          </p>

          {/* Product mockup: hero video */}
          <div
            id="demo"
            className="mx-auto mt-10 w-full overflow-hidden rounded-2xl relative scroll-mt-24"
            style={{
              boxShadow:
                "0 30px 80px -20px rgba(0,0,0,0.35), 0 12px 40px -12px rgba(82,39,255,0.28), inset 0 0 0 1px rgba(255,255,255,0.06)",
            }}
          >

            {videoFailed && (
              <img src={logoVisualia} alt="Visualia" className="w-full h-auto block" />
            )}
            <video
              ref={presenterRef}
              autoPlay
              muted
              playsInline
              preload="auto"
              width={854}
              height={480}
              aria-label="Presentación de Visualia"
              onEnded={showProductVideo}
              onError={() => setVideoFailed(true)}
              onCanPlay={(event) => {
                setVideoFailed(false);
                if (activeHeroVideo === "presenter") event.currentTarget.play().catch(() => {});
              }}
              className="w-full h-auto block transition-opacity duration-700"
              style={{
                display: videoFailed ? "none" : "block",
                opacity: activeHeroVideo === "presenter" ? 1 : 0,
                position: activeHeroVideo === "presenter" ? "relative" : "absolute",
                inset: 0,
                zIndex: activeHeroVideo === "presenter" ? 2 : 1,
              }}
            >
              <source src={heroPresenterMp4.url} type="video/mp4" />
              <source src={heroPresenterWebm.url} type="video/webm" />
            </video>
            <video
              ref={heroRef}
              muted
              playsInline
              // @ts-ignore
              webkit-playsinline="true"
              preload="auto"
              width={854}
              height={480}
              aria-label="Demostración de Visualia en una pantalla de menú digital"
              onEnded={showPresenterVideo}
              onError={() => setVideoFailed(true)}
              onCanPlay={(event) => {
                setVideoFailed(false);
                if (activeHeroVideo === "product") event.currentTarget.play().catch(() => {});
              }}
              onLoadedData={() => {
                const vid = heroRef.current;
                if (vid && activeHeroVideo === "product") {
                  vid.volume = volume;
                  vid.muted = muted;
                  vid.play().catch(() => {});
                }
              }}
              className="w-full h-auto block transition-opacity duration-700"
              style={{
                display: videoFailed ? "none" : "block",
                opacity: activeHeroVideo === "product" ? 1 : 0,
                position: activeHeroVideo === "product" ? "relative" : "absolute",
                inset: 0,
                zIndex: activeHeroVideo === "product" ? 2 : 1,
              }}
            >
              <source src={heroVideo} type="video/mp4" />
              <source src={heroVideoWebm} type="video/webm" />
            </video>

            {showSoundPrompt && (
              <button
                onClick={activateSound}
                className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 transition-opacity duration-500"
                style={{ background: "hsl(0 0% 0% / 0.4)" }}
                aria-label="Activar sonido del video"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl ring-4 ring-primary/30 animate-pulse">
                  <Volume2 className="h-7 w-7" />
                </div>
                <span className="rounded-full bg-background/90 px-4 py-1.5 text-sm font-semibold text-foreground shadow-md backdrop-blur">
                  Toca para activar sonido
                </span>
              </button>
            )}

            {!showSoundPrompt && (
              <div
                className="absolute bottom-4 right-4 z-30 flex items-center gap-2 rounded-full bg-background/85 pl-1.5 pr-3 py-1.5 backdrop-blur border border-border shadow-sm"
                role="group"
                aria-label="Controles de sonido"
              >
                <button
                  onClick={toggleMute}
                  className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted transition-colors"
                  aria-label={muted ? "Activar sonido" : "Silenciar"}
                  aria-pressed={!muted}
                >
                  {muted ? (
                    <VolumeX className="h-4 w-4 text-foreground" />
                  ) : (
                    <Volume2 className="h-4 w-4 text-primary" />
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={muted ? 0 : volume}
                  onChange={handleVolumeChange}
                  aria-label="Volumen"
                  className="h-1 w-20 sm:w-24 cursor-pointer accent-primary"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Client screens showcase (TV mockup) */}
      <ClientScreensShowcase />


      <section className="px-4 py-16 md:px-6 md:py-20" aria-labelledby="video-explicativo-title">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 max-w-2xl">
            <p className="mb-2 text-xs font-medium uppercase tracking-widest text-primary">Visualia en acción</p>
            <h2 id="video-explicativo-title" className="font-display text-3xl font-bold text-foreground md:text-4xl">
              Convierte tus pantallas en vendedores
            </h2>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-border shadow-lg">
            <LazyVideo
              ref={benefitsVideoRef}
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              width={1280}
              height={720}
              aria-label="Explicación de Visualia presentada por su creador"
              onCanPlay={(event) => event.currentTarget.play().catch(() => {})}
              className="block h-auto w-full"
              sources={[
                { src: benefitsVideo, type: "video/mp4" },
                { src: benefitsPresenterWebm.url, type: "video/webm" },
              ]}
            />

            <button
              type="button"
              onClick={() => {
                const v = benefitsVideoRef.current;
                if (!v) return;
                v.muted = !v.muted;
                if (!v.muted) v.play().catch(() => {});
                setBenefitsMuted(v.muted);
              }}
              aria-label={benefitsMuted ? "Activar sonido" : "Silenciar"}
              className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full bg-black/70 px-4 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-black/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {benefitsMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              {benefitsMuted ? "Activar sonido" : "Silenciar"}
            </button>
          </div>

        </div>
      </section>

      {/* 3. THREE BENEFITS — Bento grid glass cards */}
      <section id="beneficios" className="px-4 py-16 md:px-6 md:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 max-w-2xl">
            <p className="mb-2 text-xs font-medium uppercase tracking-widest text-primary">
              Por qué Visualia
            </p>
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Menos trabajo. Más ventas.
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {benefits.map((b, i) => {
              const Icon = b.icon;
              return (
                <div
                  key={b.title}
                  className="bento-card reveal-on-scroll p-6"
                  style={{ transitionDelay: `${i * 120}ms` }}
                >
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(82,39,255,0.15)] text-[#B19EEF]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-xl font-semibold text-white">
                    {b.title}
                  </h3>
                  <p className="mt-2 text-sm text-white/60">{b.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS — connected glass cards */}
      <section id="como-funciona" className="px-4 py-16 md:px-6 md:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 max-w-2xl">
            <p className="mb-2 text-xs font-medium uppercase tracking-widest text-primary">
              Cómo funciona
            </p>
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Tres pasos. Listo en 10 minutos.
            </h2>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-stretch md:gap-6">
            {steps.map((s, i) => (
              <div key={s.num} className="flex flex-1 items-center gap-4 md:flex-col md:items-stretch">
                <div
                  className="bento-card reveal-on-scroll flex-1 p-6"
                  style={{ transitionDelay: `${i * 120}ms` }}
                >
                  <div className="font-display text-5xl font-bold leading-none tracking-tight md:text-6xl bg-gradient-to-r from-[#5227FF] to-[#B19EEF] bg-clip-text text-transparent">
                    {s.num}
                  </div>
                  <h3 className="font-display mt-5 text-lg font-semibold text-white">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm text-white/60">{s.desc}</p>
                </div>
                {i < steps.length - 1 && (
                  <>
                    <div className="hidden md:flex items-center justify-center text-white/20">
                      <ArrowRight className="h-6 w-6" />
                    </div>
                    <div className="flex md:hidden items-center justify-center py-1 text-white/20">
                      <ArrowRight className="h-5 w-5 rotate-90" />
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Presenter message from Albert */}
      <section className="px-4 py-16 md:px-6 md:py-20" aria-labelledby="mensaje-presentador-title">
        <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-widest text-primary">Un mensaje del equipo</p>
            <h2 id="mensaje-presentador-title" className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Hecho por gente que entiende tu negocio
            </h2>
            <p className="mt-4 max-w-md text-base text-muted-foreground">
              Diseñamos Visualia junto a restaurantes reales para que vendas más sin complicarte con tecnología.
            </p>
          </div>
          <div className="relative mx-auto w-full max-w-[320px] overflow-hidden rounded-2xl border border-border shadow-lg">
            <LazyVideo
              ref={presenter2Ref}
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              width={480}
              height={854}
              aria-label="Mensaje del creador de Visualia"
              onCanPlay={(event) => event.currentTarget.play().catch(() => {})}
              className="block h-auto w-full"
              sources={[
                { src: albertPresenter2Mp4, type: "video/mp4" },
                { src: albertPresenter2Webm, type: "video/webm" },
              ]}
            />

            <button
              type="button"
              onClick={() => {
                const v = presenter2Ref.current;
                if (!v) return;
                v.muted = !v.muted;
                if (!v.muted) v.play().catch(() => {});
                setPresenter2Muted(v.muted);
              }}
              aria-label={presenter2Muted ? "Activar sonido" : "Silenciar"}
              className="absolute bottom-3 right-3 inline-flex items-center gap-2 rounded-full bg-black/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur transition hover:bg-black/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {presenter2Muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              {presenter2Muted ? "Activar sonido" : "Silenciar"}
            </button>
          </div>
        </div>
      </section>



      {/* 5. PRICING */}
      <section id="precios" className="relative overflow-hidden px-4 py-16 md:px-6 md:py-24">
        <div className="section-glow" aria-hidden="true" />
        <div className="relative z-10 mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <p className="mb-2 text-xs font-medium uppercase tracking-widest text-primary">
              Precios
            </p>
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Un precio simple por pantalla
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Sin permanencia. Sin costos ocultos. Cancela cuando quieras.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {pricingTiers.map((t, i) => (
              <div
                key={t.name}
                className={`relative flex flex-col p-7 ${
                  t.highlight
                    ? "gradient-border-shine reveal-on-scroll"
                    : "bento-card reveal-on-scroll"
                }`}
                style={{ transitionDelay: `${i * 120}ms` }}
              >
                {t.highlight && (
                  <span className="absolute -top-3 left-7 rounded-full bg-[#5227FF] px-3 py-1 text-xs font-semibold text-white">
                    Más popular
                  </span>
                )}
                <h3 className="font-display text-lg font-semibold text-white">
                  {t.name}
                </h3>
                <div className="mt-4">
                  {t.price !== null ? (
                    <div className="flex items-baseline gap-1">
                      <span className="font-display text-4xl font-bold text-white">
                        {formatCOP(t.price)}
                      </span>
                    </div>
                  ) : (
                    <span className="font-display text-2xl font-semibold text-white">
                      {t.priceLabel ?? "A medida"}
                    </span>
                  )}
                  <p className="mt-1 text-sm text-white/60">{t.detail}</p>
                </div>

                <ul className="mt-6 space-y-2.5 text-sm text-white/90">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#B19EEF]" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-7">
                  <Link
                    to={t.ctaHref ?? "/registro"}
                    className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B19EEF] ${
                      t.highlight
                        ? "bg-[#5227FF] text-white hover:shadow-[0_0_40px_rgba(82,39,255,0.55)]"
                        : "border border-white/15 bg-transparent text-white hover:bg-white/5"
                    }`}
                  >
                    {t.cta}
                    {t.highlight && <ArrowRight className="h-4 w-4" />}
                  </Link>
                </div>
              </div>
            ))}
          </div>


          <p className="mt-6 text-center text-xs text-muted-foreground">
            Precios en pesos colombianos (COP). Facturación mensual.
          </p>
        </div>
      </section>

      {/* Testimonials (real only — see src/components/landing/Testimonials.tsx) */}
      <Testimonials />


      {/* 6. FAQ */}
      <Faq />

      {/* 7. FINAL CTA */}
      <section className="px-4 py-20 md:px-6 md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground md:text-5xl">
            {HEADLINE.split(",")[0]},{" "}
            <span className="text-gradient-primary">sin esfuerzo</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Empieza gratis hoy. Conecta tu primera pantalla en 10 minutos.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" className="px-8 text-base" asChild>
              <Link to="/registro">
                Prueba gratis 14 días <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="px-8 text-base"
              onClick={() => setChatOpen(true)}
            >
              Hablar con un experto
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-12 md:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="md:col-span-2">
              <img src={logoVisualia} alt="Logotipo de Visualia" className="h-7 w-auto" width={120} height={28} />
              <p className="mt-3 max-w-sm text-sm text-muted-foreground">
                Pantallas que venden más para restaurantes y negocios físicos.
              </p>
              <div className="mt-4 flex gap-3">
                <a
                  href="https://www.instagram.com/visualiamedia"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram de Visualia"
                  className="text-muted-foreground transition hover:text-primary"
                >
                  <Instagram className="h-5 w-5" />
                </a>
                <a
                  href="https://www.linkedin.com/company/visualiamedia"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn de Visualia"
                  className="text-muted-foreground transition hover:text-primary"
                >
                  <Linkedin className="h-5 w-5" />
                </a>
              </div>
            </div>

            <div>
              <h4 className="mb-3 font-display text-sm font-semibold text-foreground">Producto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#beneficios" className="rounded-sm transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">Beneficios</a></li>
                <li><a href="#como-funciona" className="rounded-sm transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">Cómo funciona</a></li>
                <li><a href="#precios" className="rounded-sm transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">Precios</a></li>
                <li><a href="#faq" className="rounded-sm transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">Preguntas frecuentes</a></li>
              </ul>
            </div>

            <div>
              <h4 className="mb-3 font-display text-sm font-semibold text-foreground">Contacto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="mailto:hola@visualiamedia.com" className="rounded-sm transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">hola@visualiamedia.com</a></li>
                <li><a href="https://wa.me/573163265696" target="_blank" rel="noopener noreferrer" className="rounded-sm transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">WhatsApp: +57 316 3265696</a></li>
                <li>Bogotá, Colombia</li>
                <li><Link to="/soporte" className="rounded-sm transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">Soporte</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border/40 pt-6 text-xs text-muted-foreground md:flex-row">
            <p>© 2026 Boga Casa de Contenidos S.A.S. · NIT 900.325.011-10 · Visualia es una marca de Boga S.A.S. · Colombia</p>
            <div className="flex gap-4">
              <Link to="/terminos" className="rounded-sm transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">Términos</Link>
              <Link to="/privacidad" className="rounded-sm transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">Privacidad</Link>
            </div>
          </div>
        </div>
      </footer>

      <WhatsAppFloatingButton />
      <DemoRequestDialog open={demoOpen} onOpenChange={setDemoOpen} />
      <ExpertChat open={chatOpen} onOpenChange={setChatOpen} />
      <WorkflowDemoModal open={workflowOpen} onClose={() => setWorkflowOpen(false)} />
    </PremiumBackground>
  );
};

export default Landing;
