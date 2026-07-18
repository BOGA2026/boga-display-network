// Prueba social — testimonios reales.
// REGLA ESTRICTA: solo agregar testimonios con permiso escrito del cliente,
// foto real, negocio, ciudad y una métrica concreta y verificable.
// Mientras no haya casos verificables, dejar ITEMS vacío. NO inventar.

export type Testimonial = {
  quote: string;
  author: string;
  business: string;
  city: string;
  metric?: string; // ej. "+18% ticket promedio en combos"
  photo: string;   // /media/testimonios/*.webp (48x48 mín. recomendado 96x96)
};

const ITEMS: Testimonial[] = [
  // Ejemplo del formato — descomentar y completar solo con datos REALES y con permiso:
  // {
  //   quote: "Antes imprimir la carta nueva me costaba $400.000 cada vez. Ahora cambio precios desde el celular.",
  //   author: "Nombre Apellido",
  //   business: "Nombre del restaurante",
  //   city: "Bogotá",
  //   metric: "+18% ticket promedio en combos",
  //   photo: "/media/testimonios/cliente1.webp",
  // },
];

export default function Testimonials() {
  const hasItems = ITEMS.length > 0;

  return (
    <section
      aria-labelledby="testimonios-title"
      className="px-4 py-16 md:px-6 md:py-24 border-t border-border/40"
    >
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 max-w-2xl">
          <p className="mb-2 text-xs font-medium uppercase tracking-widest text-primary">
            Casos reales
          </p>
          <h2
            id="testimonios-title"
            className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl"
          >
            Restaurantes que ya venden más con Visualia
          </h2>
        </div>

        {hasItems ? (
          <ul className="grid list-none gap-6 p-0 md:grid-cols-2 lg:grid-cols-3">
            {ITEMS.map((t) => (
              <li
                key={`${t.author}-${t.business}`}
                className="rounded-2xl border border-border/60 bg-card/40 p-7"
              >
                <blockquote className="flex h-full flex-col">
                  <p className="text-base leading-relaxed text-foreground/90">
                    “{t.quote}”
                  </p>
                  {t.metric && (
                    <p className="mt-4 text-sm font-semibold text-primary">
                      {t.metric}
                    </p>
                  )}
                  <footer className="mt-5 flex items-center gap-3 not-italic">
                    <img
                      src={t.photo}
                      alt=""
                      width={48}
                      height={48}
                      loading="lazy"
                      decoding="async"
                      className="h-12 w-12 rounded-full object-cover"
                    />
                    <cite className="not-italic text-sm">
                      <span className="block font-semibold text-foreground">
                        {t.author}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {t.business} · {t.city}
                      </span>
                    </cite>
                  </footer>
                </blockquote>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/60 bg-card/30 p-8 md:p-10">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">
              En piloto
            </p>
            <p className="mt-3 text-base leading-relaxed text-foreground/90 md:text-lg">
              Estamos operando pilotos con restaurantes reales en Colombia. Cuando
              cada cliente confirme métricas y autorice publicar su testimonio,
              lo verás aquí — con foto, negocio, ciudad y el número exacto que
              logró (ticket promedio, rotación, ventas por hora).
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              ¿Quieres ser un caso de éxito? Escríbenos y te acompañamos en el montaje.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
