import { ArrowRight } from "lucide-react";

const gridImages = [
  {
    src: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=1200&auto=format&fit=crop",
    alt: "Producto destacado en pantalla",
    caption: "Productos que se ven irresistibles",
  },
  {
    src: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1200&auto=format&fit=crop",
    alt: "Cliente mirando menú digital",
    caption: "Clientes deciden más rápido",
  },
  {
    src: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=1200&auto=format&fit=crop",
    alt: "Promociones en restaurante",
    caption: "Promociones claras y visibles",
  },
];

const whyPoints = [
  "Tus clientes entienden el menú más rápido.",
  "Tus productos se ven mejor.",
  "Tus promociones se notan de inmediato.",
  "Tu equipo explica menos y atiende más.",
  "Tomas más pedidos en menos tiempo.",
];

const benefits = [
  "Tus productos se ven mejor",
  "Tus promociones llaman más la atención",
  "Cambias precios en segundos",
  "Tus clientes deciden más rápido",
  "Tu restaurante se ve moderno",
  "Tu equipo ahorra tiempo",
  "Vendes más sin hacer más trabajo",
];

const RestaurantSolution = ({ onDemo }: { onDemo: () => void }) => (
  <section id="soluciones-restaurantes" className="mx-auto max-w-[980px] px-5 py-8 leading-relaxed">

    {/* Title */}
    <h2 className="text-3xl font-bold text-foreground md:text-4xl lg:text-5xl leading-tight">
      Tus pantallas ahora{" "}
      <span className="text-gradient-primary">venden por ti</span>
    </h2>

    {/* Hero image */}
    <img
      src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1400&auto=format&fit=crop"
      alt="Pantallas digitales en restaurante mostrando menú"
      className="mt-4 mb-7 w-full max-h-[420px] object-cover rounded-2xl"
      loading="lazy"
    />

    {/* ¿Qué hace Visualia? */}
    <h3 className="text-xl font-semibold text-foreground mb-3">¿Qué hace Visualia?</h3>
    <p className="text-muted-foreground mb-4">
      Visualia convierte tus TVs y pantallas en menús digitales claros y atractivos.
      Muestra tus platos con fotos que abren el apetito.
      Destaca promociones en el momento justo.
      Ayuda a que tus clientes elijan rápido y sin dudas.
    </p>

    {/* Image grid */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 my-4 mb-6">
      {gridImages.map((img) => (
        <figure key={img.alt}>
          <img
            src={img.src}
            alt={img.alt}
            className="w-full h-[180px] object-cover rounded-xl"
            loading="lazy"
          />
          <figcaption className="text-sm mt-2 text-muted-foreground">{img.caption}</figcaption>
        </figure>
      ))}
    </div>

    {/* ¿Por qué ayuda? */}
    <h3 className="text-xl font-semibold text-foreground mb-3">¿Por qué ayuda a restaurantes?</h3>
    <div className="space-y-1 mb-2">
      {whyPoints.map((p) => (
        <p key={p} className="text-muted-foreground">{p}</p>
      ))}
    </div>
    <p className="font-semibold text-foreground mb-6">Y eso significa más ventas.</p>

    {/* Escena real */}
    <h3 className="text-xl font-semibold text-foreground mb-3">Escena real</h3>
    <p className="text-muted-foreground mb-6 leading-7">
      Entra una familia al restaurante.<br />
      Miran la pantalla y en segundos ven combos, precios y promociones.<br />
      El niño señala una hamburguesa en oferta.<br />
      Los papás ya saben qué pedir.<br />
      Ordenan rápido.<br />
      La fila avanza.<br />
      Tu cocina trabaja mejor.<br />
      <span className="font-semibold text-foreground">Tú vendes más, sin complicarte.</span>
    </p>

    {/* Beneficios */}
    <h3 className="text-xl font-semibold text-foreground mb-3">Beneficios claros</h3>
    <ul className="list-disc list-inside space-y-1 text-muted-foreground mb-8">
      {benefits.map((b) => (
        <li key={b}>{b}</li>
      ))}
    </ul>

    {/* Mensaje final + CTA */}
    <h3 className="text-xl font-semibold text-foreground mb-2">Mensaje final</h3>
    <p className="text-muted-foreground mb-4">
      Visualia convierte tus pantallas en vendedores digitales que trabajan todo el día.
    </p>
    <button
      onClick={onDemo}
      className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-primary-foreground gradient-primary cta-pulse btn-glow transition-opacity hover:opacity-90"
    >
      Empieza hoy y haz que tus pantallas vendan por ti <ArrowRight className="h-4 w-4" />
    </button>
  </section>
);

export default RestaurantSolution;
