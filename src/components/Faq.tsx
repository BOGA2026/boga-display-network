import { Helmet } from "react-helmet-async";
import { ChevronDown } from "lucide-react";

export const FAQ_ITEMS = [
  {
    q: "¿Sirve con el televisor que ya tengo?",
    a: "Sí, si tu televisor es Smart TV con Android TV o Google TV. Si no lo es, conectás un TV Box Android (un aparato pequeño de aproximadamente $150.000 COP, pago único) y listo. También funciona con Amazon Fire TV Stick.",
  },
  {
    q: "No sé nada de tecnología, ¿quién me lo instala?",
    a: "No necesitás técnico. Conectás la app Visualia a tu televisor, ingresás un código de 6 dígitos y tu pantalla ya aparece en el panel. Si te trabás, nuestro soporte te guía paso a paso por chat o WhatsApp.",
  },
  {
    q: "¿Qué pasa si se va internet en mi restaurante? ¿La pantalla se apaga?",
    a: "No. La pantalla sigue mostrando el último contenido que descargó. Cuando el internet vuelve, se sincroniza automáticamente con los cambios que hiciste desde el panel.",
  },
  {
    q: "¿Qué pasa cuando terminan los 14 días gratis?",
    a: "Elegís si querés seguir con un plan pago o no. No te cobramos automáticamente ni te pedimos tarjeta de crédito para probar. Si decidís continuar, activás tu suscripción en un par de clics.",
  },
  {
    q: "¿Cómo pago? ¿Dan factura electrónica?",
    a: "Pagás con tarjeta de crédito o débito, PSE, Nequi o Daviplata. Emitimos factura electrónica de manera automática para que cumplas con la DIAN.",
  },
  {
    q: "¿Puedo cambiar precios desde el celular?",
    a: "Sí. Entrás al panel desde cualquier celular o computador, editás el menú y en segundos se actualiza en todas las pantallas de tu negocio.",
  },
  {
    q: "¿Puedo cancelar cuando quiera?",
    a: "Sí. No hay permanencia ni cláusulas de permanencia. Cancelás desde tu panel cuando quieras y no hay penalización.",
  },
];

export function Faq() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  return (
    <>
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
      <section
        id="faq"
        className="px-4 py-16 md:px-6 md:py-24 border-t border-border/40"
        aria-labelledby="faq-title"
      >
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <p className="mb-2 text-xs font-medium uppercase tracking-widest text-primary">
              Preguntas frecuentes
            </p>
            <h2
              id="faq-title"
              className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl"
            >
              Lo que otros dueños de restaurante preguntan
            </h2>
          </div>

          <div className="divide-y divide-border/60">
            {FAQ_ITEMS.map((item, i) => (
              <details key={i} className="group" id={`faq-${i}`}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-display text-base font-semibold text-foreground outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                  {item.q}
                  <ChevronDown
                    className="h-5 w-5 flex-shrink-0 text-muted-foreground transition-transform duration-300 group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <div className="pb-4 text-muted-foreground leading-relaxed">
                  <p>{item.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
