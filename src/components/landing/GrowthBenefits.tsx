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
  <section className="section-pad px-6">
    <div className="mx-auto max-w-[1200px]">
      <div className="max-w-2xl">
        <h2>
          Tu negocio <span className="text-primary">vende más</span> con pantallas digitales
        </h2>
        <p className="mt-4 text-muted-foreground text-lg">
          Resultados reales para negocios como el tuyo.
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.title}
            className="v-card flex flex-col gap-4 p-6 hover-lift"
          >
            <div>
              <p className="text-3xl font-semibold v-numeric text-primary">{card.stat}</p>
              <p className="mt-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                {card.statLabel}
              </p>
            </div>
            <div className="border-t border-border pt-4">
              <h3 className="text-base font-semibold text-foreground">{card.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{card.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        * Promedio reportado por clientes activos de Visualia en sus primeros 3 meses de uso.
      </p>
    </div>
  </section>
);

export default GrowthBenefits;
