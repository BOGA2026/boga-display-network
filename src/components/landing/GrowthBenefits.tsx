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
<section className="px-4 py-8 md:px-6 md:py-10">
    <style>{`
      .stat-card {
        background: hsl(260 20% 7%);
        transition: background 0.3s ease, box-shadow 0.3s ease;
      }
      .stat-card:hover {
        background: hsl(260 25% 10%);
        box-shadow: inset 0 0 50px hsl(270 100% 50% / 0.07),
                    0 0 40px hsl(270 100% 50% / 0.18);
      }
      .stat-card:hover .stat-number {
        color: hsl(270 100% 78%);
        text-shadow: 0 0 20px hsl(270 100% 65% / 1),
                     0 0 45px hsl(270 100% 55% / 0.7),
                     0 0 80px hsl(270 100% 50% / 0.4);
      }
      .stat-number {
        color: hsl(0 0% 100%);
        transition: color 0.3s ease, text-shadow 0.3s ease;
      }
    `}</style>
    <div className="mx-auto max-w-5xl">
      <div className="mb-4">
        <h2
          className="text-4xl font-black md:text-5xl lg:text-6xl leading-tight"
          style={{
            color: "hsl(0 0% 100%)",
            textShadow: "0 0 40px hsl(270 100% 60% / 0.25), 0 0 12px hsl(270 100% 60% / 0.1)",
          }}
        >
          Tu negocio{" "}
          <span
            style={{
              color: "hsl(270 100% 75%)",
              textShadow:
                "0 0 30px hsl(270 100% 60% / 0.9), 0 0 60px hsl(270 100% 50% / 0.6), 0 0 100px hsl(270 100% 50% / 0.3)",
            }}
          >
            vende más
          </span>{" "}
          con pantallas digitales
        </h2>
          <p
            className="mt-1 text-lg font-medium"
          style={{
            color: "hsl(0 0% 80%)",
            textShadow: "0 0 20px hsl(270 100% 60% / 0.2)",
          }}
        >
          Resultados reales para negocios como el tuyo.
        </p>
      </div>

      {/* Cards */}
      <div className="grid gap-px sm:grid-cols-2 lg:grid-cols-4" style={{ background: "hsl(270 15% 15%)" }}>
        {cards.map((card) => (
          <div key={card.title} className="stat-card flex flex-col gap-3 p-8 cursor-default">
            <div>
              <p className="stat-number text-4xl font-black tabular-nums">{card.stat}</p>
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
