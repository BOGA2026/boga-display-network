import LandingHeader from "@/components/landing/LandingHeader";
import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const benefits = [
  "Mostrar tus productos de forma más atractiva",
  "Cambiar precios y promociones en segundos",
  "Destacar productos estratégicos para aumentar ventas",
  "Administrar todas tus pantallas desde un solo lugar",
];

const faqs = [
  {
    q: "¿Qué es Visualia?",
    a: "Visualia es una plataforma tecnológica que convierte las pantallas de tu negocio en menús digitales dinámicos y atractivos, permitiéndote actualizar precios, promociones y productos fácilmente desde internet.",
  },
  {
    q: "¿Para qué sirve Visualia en un restaurante?",
    a: "Visualia permite mostrar tu menú en pantallas digitales que se actualizan automáticamente. Esto mejora la presentación de los productos, facilita cambios de precios y ayuda a aumentar las ventas mostrando mejor los platos o combos.",
  },
  {
    q: "¿Necesito pantallas especiales?",
    a: "No. Visualia funciona con televisores o pantallas comerciales normales, utilizando un pequeño dispositivo que conecta la pantalla a la plataforma.",
  },
  {
    q: "¿Necesito conocimientos técnicos para usar Visualia?",
    a: "No. La plataforma está diseñada para ser muy fácil de usar. Puedes cambiar precios, imágenes o promociones en pocos clics desde el panel de control.",
  },
  {
    q: "¿Puedo administrar varias pantallas?",
    a: "Sí. Visualia permite manejar una o muchas pantallas al mismo tiempo, incluso si están en diferentes sucursales.",
  },
  {
    q: "¿Qué pasa si quiero cambiar un precio?",
    a: "Puedes hacerlo desde el panel de control y el cambio se reflejará automáticamente en todas las pantallas conectadas.",
  },
  {
    q: "¿Necesito internet?",
    a: "Sí. Las pantallas necesitan conexión a internet para recibir las actualizaciones del contenido.",
  },
  {
    q: "¿Visualia ayuda a vender más?",
    a: "Sí. Los menús digitales permiten mostrar mejor los productos, destacar promociones y dirigir la atención del cliente hacia productos estratégicos, lo que suele aumentar el ticket promedio.",
  },
  {
    q: "¿Puedo empezar con una sola pantalla?",
    a: "Claro. Visualia está pensado para que puedas empezar con una pantalla y crecer cuando lo necesites.",
  },
  {
    q: "¿Visualia funciona solo para restaurantes?",
    a: "No. También puede utilizarse en cafeterías, bares, heladerías, panaderías, tiendas, centros comerciales, salas de espera y muchos otros negocios que quieran comunicar mejor sus productos o servicios.",
  },
  {
    q: "¿Cómo puedo empezar con Visualia?",
    a: "Puedes adquirir tu suscripción y comenzar a configurar tus pantallas rápidamente desde nuestra plataforma.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="rounded-2xl border transition-colors"
      style={{
        borderColor: open ? "hsl(270 100% 60% / 0.3)" : "hsl(270 20% 18%)",
        background: open ? "hsl(270 15% 12%)" : "transparent",
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-6 py-5 text-left"
      >
        <span className="text-base font-semibold text-foreground pr-4">{q}</span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          style={{ color: "hsl(270 100% 65%)" }}
        />
      </button>
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: open ? "500px" : "0" }}
      >
        <p className="px-6 pb-5 text-sm leading-relaxed text-muted-foreground">{a}</p>
      </div>
    </div>
  );
}

export default function AboutPage() {
  return (
    <div className="min-h-screen" style={{ background: "hsl(260 30% 6%)" }}>
      <LandingHeader />

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(ellipse 60% 40% at 50% 0%, hsl(270 100% 50% / 0.2), transparent)",
          }}
        />
        <div className="relative mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Acerca de{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: "linear-gradient(135deg, hsl(270 100% 65%), hsl(290 100% 60%))",
              }}
            >
              Visualia
            </span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Empresa tecnológica colombiana que desarrolla soluciones de pantallas digitales
            inteligentes para negocios.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-3xl space-y-6 text-base leading-relaxed text-muted-foreground">
          <p>
            Nacimos con una idea simple:{" "}
            <span className="font-semibold text-foreground">
              ayudar a que los negocios comuniquen mejor lo que venden.
            </span>
          </p>
          <p>
            En un mundo donde todo cambia rápido, los menús impresos y los carteles estáticos ya no
            son suficientes. Por eso creamos Visualia, una plataforma que permite a restaurantes,
            cafés y comercios mostrar sus productos en pantallas digitales modernas, atractivas y
            fáciles de actualizar.
          </p>
          <div
            className="rounded-2xl px-8 py-6"
            style={{
              background: "hsl(270 100% 50% / 0.06)",
              border: "1px solid hsl(270 100% 60% / 0.15)",
            }}
          >
            <p className="text-lg font-semibold text-foreground">Nuestro objetivo es claro:</p>
            <p className="mt-2 text-base text-muted-foreground">
              Ayudar a los negocios a{" "}
              <span className="font-semibold" style={{ color: "hsl(270 100% 75%)" }}>
                vender más
              </span>
              , comunicar mejor y modernizar su experiencia con los clientes.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-5 w-8 shrink-0 overflow-hidden rounded" style={{ boxShadow: "0 1px 4px hsl(0 0% 0% / 0.3)" }}>
              <div className="w-full h-[50%]" style={{ background: "#FCD116" }} />
              <div className="w-full h-[25%]" style={{ background: "#003893" }} />
              <div className="w-full h-[25%]" style={{ background: "#CE1126" }} />
            </div>
            <p>
              Desde <span className="font-semibold text-foreground">Colombia</span>, estamos construyendo tecnología accesible para que cualquier negocio
              pueda tener herramientas que antes solo tenían las grandes marcas.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Con Visualia puedes</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {benefits.map((b) => (
              <div
                key={b}
                className="flex items-start gap-3 rounded-xl px-5 py-4"
                style={{
                  background: "hsl(270 15% 12%)",
                  border: "1px solid hsl(270 20% 18%)",
                }}
              >
                <div
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                  style={{ background: "hsl(270 80% 50% / 0.15)" }}
                >
                  <Check className="h-3.5 w-3.5" style={{ color: "hsl(270 100% 70%)" }} />
                </div>
                <span className="text-sm leading-snug text-foreground">{b}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xl font-semibold text-foreground sm:text-2xl">
            Creemos que la tecnología debe ser{" "}
            <span style={{ color: "hsl(270 100% 70%)" }}>simple, poderosa y accesible.</span>
          </p>
          <p className="mt-4 text-base text-muted-foreground">
            Por eso Visualia está diseñada para que cualquier persona pueda usarla, incluso sin
            conocimientos técnicos.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 pb-32">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-10 text-center text-2xl font-bold text-foreground sm:text-3xl">
            Preguntas frecuentes
          </h2>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-24">
        <div
          className="mx-auto max-w-3xl rounded-3xl px-8 py-12 text-center"
          style={{
            background: "linear-gradient(135deg, hsl(270 40% 12%), hsl(270 30% 8%))",
            border: "1px solid hsl(270 100% 60% / 0.2)",
          }}
        >
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
            ¿Listo para modernizar tu negocio?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Empieza con una pantalla y crece cuando lo necesites.
          </p>
          <Link
            to="/precios"
            className="mt-8 inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-semibold text-white transition-all hover:brightness-110"
            style={{
              background: "linear-gradient(135deg, hsl(270 80% 55%), hsl(290 80% 50%))",
              boxShadow: "0 0 24px 4px hsl(270 100% 50% / 0.25)",
            }}
          >
            Ver Planes y Precios
          </Link>
        </div>
      </section>
    </div>
  );
}
