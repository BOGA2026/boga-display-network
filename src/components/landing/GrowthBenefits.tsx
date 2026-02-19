const cards = [
  {
    stat: "+60%",
    statLabel: "visibilidad",
    title: "Más clientes ven tus productos",
    desc: "Tus promociones se ven claras y atractivas en pantalla.",
  },
  {
    stat: "+30%",
    statLabel: "en ventas",
    title: "Aumenta tus ventas",
    desc: "Los clientes compran más cuando ven mejor lo que ofreces.",
  },
  {
    stat: "+45%",
    statLabel: "eficiencia",
    title: "Controla todas tus pantallas",
    desc: "Cambia precios y promociones en segundos desde el panel.",
  },
  {
    stat: "24/7",
    statLabel: "automático",
    title: "Todo funciona solo",
    desc: "Sin esfuerzo ni complicaciones técnicas.",
  },
];

const GrowthBenefits = () => (
  <section className="px-4 py-12 md:px-6 md:py-16">
    <div className="mx-auto max-w-5xl">
      {/* Headline */}
      <div className="mb-10">
        <h2 className="text-3xl font-bold text-white md:text-4xl lg:text-5xl">
          Tu negocio{" "}
          <span style={{ color: "hsl(270 60% 70%)" }}>vende más</span>
          {" "}con pantallas digitales
        </h2>
        <p className="mt-4 text-base" style={{ color: "hsl(0 0% 50%)" }}>
          Resultados reales para negocios como el tuyo.
        </p>
      </div>

      {/* Cards */}
      <div className="grid gap-px sm:grid-cols-2 lg:grid-cols-4" style={{ background: "hsl(270 15% 15%)" }}>
        {cards.map((card) => (
          <div
            key={card.title}
            className="flex flex-col gap-3 p-8"
            style={{ background: "hsl(260 20% 7%)" }}
          >
            <div>
              <p className="text-4xl font-black text-white tabular-nums">{card.stat}</p>
              <p className="mt-0.5 text-xs font-medium uppercase tracking-widest" style={{ color: "hsl(270 60% 60%)" }}>
                {card.statLabel}
              </p>
            </div>
            <div className="pt-2" style={{ borderTop: "1px solid hsl(270 15% 14%)" }}>
              <h3 className="text-base font-semibold text-white leading-snug">{card.title}</h3>
              <p className="mt-1 text-sm leading-relaxed" style={{ color: "hsl(0 0% 45%)" }}>{card.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default GrowthBenefits;
