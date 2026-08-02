// Sección "En operación" — prueba social honesta.
// REGLA ESTRICTA: solo cifras verificables. Hoy: más de 150 pantallas.
// No agregar porcentajes de ventas ni testimonios sin permiso escrito.
// Los logos de clientes van solo con autorización escrita del cliente.

import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SUPPORT_WHATSAPP_NUMBER } from "@/config/support";

const WHATSAPP_URL = `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Hola, quiero saber si Visualia me sirve para mi restaurante",
)}`;

const CARDS = [
  {
    title: "Empieza con una pantalla",
    desc: "No hay mínimo. Una pantalla, un local, y ya estás andando.",
  },
  {
    title: "Sin permanencia",
    desc: "En el plan mensual cancelas cuando quieras. No firmas nada.",
  },
  {
    title: "Te acompañamos en el montaje",
    desc: "Te enviamos el equipo listo y te guiamos hasta que estés al aire. No tienes que saber de tecnología.",
  },
];

export default function Testimonials() {
  return (
    <section aria-labelledby="operacion-title" className="px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-5xl">
        <p className="mb-2 text-xs font-medium uppercase tracking-widest text-primary">
          En operación
        </p>
        <h2
          id="operacion-title"
          className="max-w-2xl font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl"
        >
          Funciona igual con una pantalla que con 150
        </h2>

        <div className="mt-6 max-w-3xl space-y-4 text-base leading-relaxed text-foreground/90">
          <p>
            Ya sea que tengas un solo local o veinte, el producto es el mismo. Empiezas con una
            pantalla, y si algún día quieres más, se agregan sin volver a empezar de cero.
          </p>
          <p className="text-muted-foreground">
            Hoy tenemos más de 150 pantallas funcionando en restaurantes de Colombia, desde locales
            de una sola sede hasta cadenas como El Carnal y Mochisand. La misma plataforma que le
            sirve a una cadena con decenas de puntos es la que vas a usar tú. Sin versión recortada,
            sin plan de segunda.
          </p>
          <p className="text-muted-foreground">
            Visualia es una empresa colombiana. Desarrollamos todo acá —el reproductor, el panel y
            la generación de menús con inteligencia artificial— y lo operamos desde acá. Cuando algo
            se rompe, contestamos nosotros.
          </p>
        </div>

        <ul className="mt-10 grid list-none gap-5 p-0 md:grid-cols-3">
          {CARDS.map((c) => (
            <li key={c.title} className="rounded-2xl border border-border/60 bg-card/40 p-6">
              <h3 className="font-display text-lg font-semibold text-foreground">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.desc}</p>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-col items-start gap-4">
          <p className="text-base text-foreground/90">
            ¿Tienes dudas de si te sirve? Escríbenos y te decimos con franqueza si es para ti.
          </p>
          <Button asChild variant="outline" size="lg">
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="mr-2 h-4 w-4" aria-hidden="true" />
              Hablar con el equipo
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
