import { Link } from "react-router-dom";
import logoVisualia from "@/assets/logo-visualia.png";
import { Button } from "@/components/ui/button";
import LandingHeader from "@/components/landing/LandingHeader";
import {
  Monitor,
  ListMusic,
  CalendarClock,
  BarChart3,
  QrCode,
  Eye,
  TrendingUp,
  RefreshCw,
  Settings2,
  ArrowRight,
  Star,
  Twitter,
  Instagram,
  Linkedin,
  ChevronRight,
} from "lucide-react";

const problems = [
  { icon: Eye, title: "Visibilidad de promociones", desc: "Muestra ofertas y productos destacados en tiempo real para captar la atención de tus clientes." },
  { icon: TrendingUp, title: "Incremento de ticket promedio", desc: "Las pantallas digitales aumentan hasta un 30% el gasto promedio por cliente en tu negocio." },
  { icon: RefreshCw, title: "Sincronización remota", desc: "Actualiza el contenido de todas tus pantallas desde cualquier lugar, sin visitar cada sucursal." },
  { icon: Settings2, title: "Control total desde una plataforma", desc: "Un solo dashboard para gestionar ubicaciones, pantallas, contenido y programación." },
];

const features = [
  { icon: Monitor, title: "Gestión de contenido", desc: "Sube imágenes, videos y diseños. Organiza tu biblioteca de medios con facilidad." },
  { icon: ListMusic, title: "Playlists inteligentes", desc: "Crea listas de reproducción dinámicas que se adaptan a tus necesidades." },
  { icon: CalendarClock, title: "Programación por horarios", desc: "Define qué contenido se muestra en cada momento del día automáticamente." },
  { icon: BarChart3, title: "Analíticas de pantalla", desc: "Mide el rendimiento de tu señalización con métricas detalladas en tiempo real." },
  { icon: QrCode, title: "Vinculación con código", desc: "Conecta dispositivos a tu red con un simple código. Sin configuración compleja." },
];

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
  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #0E0B16 0%, #12101A 50%, #0E0B16 100%)" }}>
      <LandingHeader />

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-20 pt-32 md:pt-40">
        {/* Glow orbs */}
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2" style={{ width: 800, height: 600 }}>
          <div className="absolute left-1/2 top-20 h-72 w-72 -translate-x-1/2 rounded-full opacity-20 blur-[100px]" style={{ background: "#8A00FF" }} />
          <div className="absolute left-1/3 top-40 h-48 w-48 rounded-full opacity-15 blur-[80px]" style={{ background: "#C000FF" }} />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="flex justify-center">
            <img src={logoVisualia} alt="Visualia" className="h-96 w-auto md:h-[28rem] lg:h-[32rem]" />
          </div>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" className="gradient-primary glow-primary border-0 px-8 text-lg text-primary-foreground" asChild>
              <Link to="/registro">
                Solicitar demo <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-border/40 px-8 text-lg" asChild>
              <a href="#features">Ver beneficios</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Problem + Solution */}
      <section className="px-6 py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              ¿Por qué las señales visuales importan en tu negocio?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Las pantallas digitales son la herramienta más efectiva para comunicar, vender más y diferenciarte.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {problems.map((p) => (
              <div key={p.title} className="group rounded-xl border border-border/20 p-6 transition-all hover:border-primary/40 hover:shadow-[0_0_30px_-8px_hsl(270_100%_50%/0.2)]" style={{ background: "linear-gradient(180deg, hsl(260 25% 12%) 0%, hsl(260 25% 10%) 100%)" }}>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg gradient-primary">
                  <p.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="mb-2 font-display text-lg font-semibold text-foreground">{p.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              Funciones clave de <span className="text-gradient-primary">Visualia</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Todo lo que necesitas para gestionar tu red de señalización digital desde un solo lugar.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="group relative overflow-hidden rounded-xl border border-border/20 p-8 transition-all hover:border-primary/40" style={{ background: "linear-gradient(180deg, hsl(260 25% 12%) 0%, hsl(260 25% 10%) 100%)" }}>
                <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full opacity-0 blur-[60px] transition-opacity group-hover:opacity-20" style={{ background: "#8A00FF" }} />
                <div className="relative">
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                    <f.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="mb-2 font-display text-xl font-semibold text-foreground">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="px-6 py-20 md:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              Cómo funciona
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Tres pasos para transformar la comunicación visual de tu negocio.
            </p>
          </div>
          <div className="relative">
            <div className="absolute left-8 top-0 hidden h-full w-px md:block" style={{ background: "linear-gradient(180deg, #8A00FF 0%, #C000FF 50%, transparent 100%)" }} />
            <div className="space-y-12 md:space-y-16">
              {steps.map((s) => (
                <div key={s.num} className="flex gap-6 md:gap-10">
                  <div className="relative flex-shrink-0">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary font-display text-2xl font-bold text-primary-foreground glow-primary-sm">
                      {s.num}
                    </div>
                  </div>
                  <div className="pt-2">
                    <h3 className="mb-2 font-display text-xl font-semibold text-foreground md:text-2xl">{s.title}</h3>
                    <p className="max-w-lg text-muted-foreground">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="px-6 py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              Lo que dicen nuestros clientes
            </h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-xl border border-border/20 p-8" style={{ background: "linear-gradient(180deg, hsl(260 25% 12%) 0%, hsl(260 25% 10%) 100%)" }}>
                <div className="mb-4 flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
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
      <section className="px-6 py-20 md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="relative overflow-hidden rounded-2xl border border-primary/20 px-8 py-16 md:px-16" style={{ background: "linear-gradient(180deg, hsl(260 25% 14%) 0%, hsl(260 30% 8%) 100%)" }}>
            <div className="pointer-events-none absolute inset-0 opacity-20" style={{ background: "radial-gradient(ellipse at center, #8A00FF 0%, transparent 70%)" }} />
            <div className="relative">
              <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
                Empieza con <span className="text-gradient-primary">Visualia</span> hoy
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
                Únete a los negocios que ya están transformando su comunicación visual con Visualia.
              </p>
              <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Button size="lg" className="gradient-primary glow-primary border-0 px-8 text-lg text-primary-foreground" asChild>
                  <Link to="/registro">
                    Crear cuenta <ChevronRight className="ml-1 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-border/40 px-8 text-lg">
                  Solicitar demo
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/20 px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
            <div>
              <img src={logoVisualia} alt="Visualia" className="h-8 w-auto" />
            </div>
            <div className="flex flex-wrap justify-center gap-6">
              <a href="#" className="text-sm text-muted-foreground transition hover:text-foreground">Términos</a>
              <a href="#" className="text-sm text-muted-foreground transition hover:text-foreground">Privacidad</a>
              <a href="#" className="text-sm text-muted-foreground transition hover:text-foreground">Soporte</a>
              <a href="#" className="text-sm text-muted-foreground transition hover:text-foreground">Contacto</a>
            </div>
            <div className="flex gap-4">
              <a href="#" className="text-muted-foreground transition hover:text-primary"><Twitter className="h-5 w-5" /></a>
              <a href="#" className="text-muted-foreground transition hover:text-primary"><Instagram className="h-5 w-5" /></a>
              <a href="#" className="text-muted-foreground transition hover:text-primary"><Linkedin className="h-5 w-5" /></a>
            </div>
          </div>
          <p className="mt-8 text-center text-xs text-muted-foreground/50">© 2026 Visualia. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
