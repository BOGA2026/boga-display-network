import { useState, useCallback, useRef, useEffect } from "react";
import heroVideoIntro from "@/assets/hero-video-intro.mov";
import heroVideo from "@/assets/hero-video.mov";
import { Link, useSearchParams } from "react-router-dom";
import ShowcaseCarousel from "@/components/landing/ShowcaseCarousel";
import GrowthBenefits from "@/components/landing/GrowthBenefits";
import logoVisualia from "@/assets/logo-visualia.png";
import { Button } from "@/components/ui/button";
import LandingHeader from "@/components/landing/LandingHeader";
import IntroSplash, { hasSeenIntro } from "@/components/landing/IntroSplash";
import DemoRequestDialog from "@/components/landing/DemoRequestDialog";
import PremiumBackground from "@/components/layout/PremiumBackground";
import { ArrowRight, Star, Twitter, Instagram, Linkedin, ChevronRight } from "lucide-react";
import FeaturesSection from "@/components/landing/FeaturesSection";

const steps = [
  { num: "01", title: "Empieza con tu CMS", desc: "Regístrate y accede al panel de control. Sube tu contenido multimedia y organízalo." },
  { num: "02", title: "Vincula la pantalla con código", desc: "Ingresa el código único de tu dispositivo para conectarlo a tu red de señalización." },
  { num: "03", title: "Automatiza contenido y programación", desc: "Crea playlists, programa horarios y deja que Visualia haga el resto." },
];

const testimonials = [
  { name: "María López", role: "Gerente, Café Urbano", quote: "Visualia transformó la manera en que comunicamos nuestras promociones. Las ventas de productos destacados aumentaron un 25%." },
  { name: "Carlos Méndez", role: "Director, Cadena FreshBite", quote: "Gestionar 12 sucursales desde un solo panel nos ahorra horas cada semana. La sincronización es instantánea." },
  { name: "Ana Rodríguez", role: "Marketing, Hotel Pacífico", quote: "La programación por horarios es increíble. Nuestros lobbies muestran contenido relevante las 24 horas sin intervención manual." },
];

const Landing = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [demoOpen, setDemoOpen] = useState(false);
  const [activeVideo, setActiveVideo] = useState<0 | 1>(0);
  const [transitioning, setTransitioning] = useState(false);
  const introRef = useRef<HTMLVideoElement>(null);
  const mainRef = useRef<HTMLVideoElement>(null);

  const handleIntroEnded = useCallback(() => {
    setTransitioning(true);
    setTimeout(() => {
      setActiveVideo(1);
      setTransitioning(false);
    }, 700);
  }, []);
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
    <PremiumBackground>
      {showIntro && <IntroSplash onComplete={handleIntroComplete} />}
      <LandingHeader />

      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-12 pt-24 md:px-6 md:pt-32">
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2" style={{ width: 900, height: 700 }}>
          <div className="absolute left-1/2 top-16 h-80 w-80 -translate-x-1/2 rounded-full animate-neon-breathe blur-[120px]" style={{ background: "hsl(270 100% 50%)", opacity: 0.22 }} />
          <div className="absolute left-1/3 top-40 h-56 w-56 rounded-full animate-neon-breathe blur-[90px]" style={{ background: "hsl(290 100% 50%)", opacity: 0.15, animationDelay: "1.5s" }} />
          <div className="absolute right-1/4 top-32 h-40 w-40 rounded-full animate-neon-breathe blur-[80px]" style={{ background: "hsl(260 100% 60%)", opacity: 0.1, animationDelay: "3s" }} />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="flex justify-center">
            <img src={logoVisualia} alt="Visualia" className="h-[24rem] w-auto md:h-[30rem] lg:h-[36rem] drop-shadow-[0_0_60px_hsl(270_100%_50%/0.3)]" />
          </div>

          {/* Hero Video with crossfade */}
          <div
            className="-mt-6 mx-auto w-full overflow-hidden rounded-2xl relative"
            style={{
              boxShadow: "0 0 18px 3px hsl(270 100% 55% / 0.45), 0 0 50px 8px hsl(270 100% 50% / 0.2)",
              border: "1.5px solid hsl(270 100% 60% / 0.6)",
            }}
          >
            {/* Intro video */}
            <video
              ref={introRef}
              src={heroVideoIntro}
              autoPlay
              muted
              playsInline
              onEnded={handleIntroEnded}
              className="w-full h-auto block"
              style={{
                position: activeVideo === 1 ? "absolute" : "relative",
                inset: 0,
                opacity: activeVideo === 0 ? 1 : 0,
                transition: "opacity 0.7s ease-in-out",
                zIndex: activeVideo === 0 ? 2 : 1,
              }}
            />
            {/* Main loop video */}
            <video
              ref={mainRef}
              src={heroVideo}
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-auto block"
              style={{
                position: activeVideo === 0 ? "absolute" : "relative",
                inset: 0,
                opacity: activeVideo === 1 ? 1 : 0,
                transition: "opacity 0.7s ease-in-out",
                zIndex: activeVideo === 1 ? 2 : 1,
              }}
            />
          </div>

          <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" className="gradient-primary-vibrant cta-pulse btn-glow border-0 px-8 text-lg text-primary-foreground" onClick={() => setDemoOpen(true)}>
              Solicitar demo <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="neon-border neon-border-hover px-8 text-lg hover-lift" asChild>
              <a href="#features">Ver beneficios</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Growth Benefits */}
      <GrowthBenefits />

      {/* Features */}
      <FeaturesSection onDemo={() => setDemoOpen(true)} />

      {/* How It Works */}
      <section id="how" className="px-4 py-12 md:px-6 md:py-16">
        <div className="mx-auto max-w-4xl">
          <div className="mb-10 text-center">
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">Cómo funciona</h2>
            <p className="mx-auto mt-5 max-w-xl text-muted-foreground">Tres pasos para transformar la comunicación visual de tu negocio.</p>
          </div>
          <div className="relative">
            <div className="absolute left-8 top-0 hidden h-full w-px md:block" style={{ background: "linear-gradient(180deg, hsl(270 100% 50%) 0%, hsl(290 100% 50%) 50%, transparent 100%)" }} />
            <div className="space-y-10 md:space-y-12">
              {steps.map((s) => (
                <div key={s.num} className="flex gap-8 md:gap-12 group">
                  <div className="relative flex-shrink-0">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary-vibrant font-display text-2xl font-bold text-primary-foreground glow-primary transition-shadow duration-300 group-hover:glow-primary-lg">{s.num}</div>
                  </div>
                  <div className="pt-2">
                    <h3 className="mb-3 font-display text-xl font-semibold text-foreground md:text-2xl">{s.title}</h3>
                    <p className="max-w-lg text-muted-foreground">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Showcase Carousel */}
      <ShowcaseCarousel />

      {/* Testimonials */}
      <section id="testimonials" className="relative px-4 py-12 md:px-6 md:py-16">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 50% 30% at 50% 50%, hsl(270 100% 50% / 0.05) 0%, transparent 70%)" }} />
        <div className="relative mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">Lo que dicen nuestros clientes</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.name} className="glass-card hover:glass-card-hover rounded-xl p-8 transition-all duration-300 hover-lift">
                <div className="mb-5 flex gap-1">
                  {[...Array(5)].map((_, i) => (<Star key={i} className="h-4 w-4 fill-primary text-primary icon-neon" />))}
                </div>
                <p className="mb-6 text-sm leading-relaxed text-muted-foreground italic">"{t.quote}"</p>
                <div>
                  <p className="font-display font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-12 md:px-6 md:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <div className="relative overflow-hidden rounded-2xl neon-border px-8 py-16 md:px-16" style={{ background: "linear-gradient(180deg, hsl(260 25% 14%) 0%, hsl(260 30% 8%) 100%)" }}>
            <div className="pointer-events-none absolute inset-0 animate-neon-breathe" style={{ background: "radial-gradient(ellipse at center, hsl(270 100% 50% / 0.2) 0%, transparent 70%)" }} />
            <div className="relative">
              <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">Empieza con <span className="text-gradient-primary">Visualia</span> hoy</h2>
              <p className="mx-auto mt-5 max-w-lg text-muted-foreground">Únete a los negocios que ya están transformando su comunicación visual con Visualia.</p>
              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Button size="lg" className="gradient-primary-vibrant cta-pulse btn-glow border-0 px-8 text-lg text-primary-foreground" onClick={() => setDemoOpen(true)}>Crear cuenta <ChevronRight className="ml-1 h-5 w-5" /></Button>
                <Button size="lg" variant="outline" className="neon-border neon-border-hover px-8 text-lg hover-lift" onClick={() => setDemoOpen(true)}>Solicitar demo</Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/20 px-4 py-8 md:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
            <div><img src={logoVisualia} alt="Visualia" className="h-8 w-auto" /></div>
            <div className="flex flex-wrap justify-center gap-8">
              <a href="#" className="text-sm text-muted-foreground transition hover:text-foreground">Términos</a>
              <a href="#" className="text-sm text-muted-foreground transition hover:text-foreground">Privacidad</a>
              <a href="#" className="text-sm text-muted-foreground transition hover:text-foreground">Soporte</a>
              <a href="#" className="text-sm text-muted-foreground transition hover:text-foreground">Contacto</a>
            </div>
            <div className="flex gap-5">
              <a href="#" className="text-muted-foreground transition hover:text-primary"><Twitter className="h-5 w-5" /></a>
              <a href="#" className="text-muted-foreground transition hover:text-primary"><Instagram className="h-5 w-5" /></a>
              <a href="#" className="text-muted-foreground transition hover:text-primary"><Linkedin className="h-5 w-5" /></a>
            </div>
          </div>
          <p className="mt-10 text-center text-xs text-muted-foreground/50">© 2026 Visualia. Todos los derechos reservados.</p>
        </div>
      </footer>
      <DemoRequestDialog open={demoOpen} onOpenChange={setDemoOpen} />
    </PremiumBackground>
  );
};

export default Landing;
