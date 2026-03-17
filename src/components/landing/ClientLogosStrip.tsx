// CORRECCIÓN 9 aplicada — Sección de logos de clientes
const clients = [
  "El Carnal",
  "Mochisand",
  "Heladería Premium",
  "Sabor Urbano",
  "Kiosko Fresh",
  "La Barra",
];

const ClientLogosStrip = () => (
  <section className="px-4 py-8 md:px-6 md:py-10">
    <div className="mx-auto max-w-5xl text-center">
      <p className="mb-6 text-xs font-medium uppercase tracking-widest" style={{ color: "hsl(0 0% 40%)" }}>
        Negocios que ya confían en Visualia
      </p>
      <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
        {clients.map((name) => (
          <div
            key={name}
            className="flex h-12 w-28 items-center justify-center rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-300"
            style={{
              background: "hsl(0 0% 100% / 0.03)",
              color: "hsl(0 0% 35%)",
              border: "1px solid hsl(0 0% 15%)",
              filter: "grayscale(100%)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.filter = "grayscale(0%)";
              e.currentTarget.style.color = "hsl(270 60% 65%)";
              e.currentTarget.style.borderColor = "hsl(270 100% 50% / 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = "grayscale(100%)";
              e.currentTarget.style.color = "hsl(0 0% 35%)";
              e.currentTarget.style.borderColor = "hsl(0 0% 15%)";
            }}
          >
            {name}
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default ClientLogosStrip;
