const cards = [
  {
    title: "Actualiza contenido en segundos",
    desc: "Cambia precios, promociones y menús fácilmente desde cualquier lugar.",
  },
  {
    title: "Control total de tus pantallas",
    desc: "Administra todas tus pantallas desde un solo panel, en tiempo real.",
  },
  {
    title: "Configura y conecta rápidamente",
    desc: "Sin técnicos ni instalaciones complejas. Lista en minutos.",
  },
];

const results = [
  { value: "+30%", label: "más ventas promedio" },
  { value: "100%", label: "control remoto total" },
  { value: "< 5 min", label: "configuración inicial" },
];

const FeaturesSection = ({ onDemo }: { onDemo: () => void }) => (
  <section id="features" className="px-4 py-12 md:px-6 md:py-16">
    <div className="mx-auto max-w-5xl">

      {/* Header */}
      <div className="mb-6 max-w-2xl">
        <p className="mb-3 text-xs font-medium uppercase tracking-widest" style={{ color: "hsl(270 60% 60%)" }}>
          Plataforma
        </p>
        <h2 className="text-3xl font-bold text-white md:text-4xl lg:text-5xl leading-tight">
          Todo lo que necesitas para{" "}
          <span style={{ color: "hsl(270 60% 70%)" }}>controlar tus pantallas</span>{" "}
          y vender más
        </h2>
        <p className="mt-2 text-base leading-relaxed" style={{ color: "hsl(0 0% 55%)" }}>
          Controla, actualiza y automatiza tus pantallas desde un solo lugar.
        </p>
      </div>

      {/* Feature cards */}
      <div className="grid gap-px md:grid-cols-3" style={{ background: "hsl(270 15% 15%)" }}>
        {cards.map((card, i) => (
          <div
            key={card.title}
            className="flex flex-col gap-4 p-8"
            style={{ background: "hsl(260 20% 7%)" }}
          >
            <span className="text-xs font-medium tabular-nums" style={{ color: "hsl(270 60% 60%)" }}>
              0{i + 1}
            </span>
            <h3 className="text-lg font-semibold text-white leading-snug">
              {card.title}
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: "hsl(0 0% 50%)" }}>
              {card.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Results strip */}
      <div
        className="mt-16 grid grid-cols-3 border-t border-b"
        style={{ borderColor: "hsl(270 15% 14%)" }}
      >
        {results.map((r, i) => (
          <div
            key={r.label}
            className="px-6 py-10 text-center"
            style={{ borderRight: i < results.length - 1 ? "1px solid hsl(270 15% 14%)" : "none" }}
          >
            <p className="text-4xl font-black text-white tabular-nums">
              {r.value}
            </p>
            <p className="mt-2 text-xs" style={{ color: "hsl(0 0% 40%)" }}>{r.label}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pt-8 border-t" style={{ borderColor: "hsl(270 15% 14%)" }}>
        <div>
          <h3 className="text-xl font-bold text-white">Empieza hoy</h3>
          <p className="mt-1 text-sm" style={{ color: "hsl(0 0% 45%)" }}>
            Configura tu primera pantalla en menos de 5 minutos.
          </p>
        </div>
        <button
          onClick={onDemo}
          className="flex-shrink-0 rounded-lg px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "hsl(270 70% 50%)" }}
        >
          Hablar con un experto
        </button>
      </div>

    </div>
  </section>
);

export default FeaturesSection;
