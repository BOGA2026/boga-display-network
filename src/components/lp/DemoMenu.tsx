import { formatCop } from "@/config/devices";

/**
 * Menús de demostración de la landing. Es contenido real de carta de un
 * restaurante colombiano, no una plantilla vacía: la persona tiene que ver
 * platos y precios de verdad para entender qué compra.
 */
export interface DemoDish {
  name: string;
  desc: string;
  price: number;
}

export interface DemoMenuData {
  id: "desayuno" | "almuerzo" | "noche";
  /** Rótulo del selector de horario. */
  label: string;
  /** Franja real en que la pantalla lo muestra sola. */
  range: string;
  title: string;
  accent: string;
  dishes: DemoDish[];
}

export const DEMO_MENUS: DemoMenuData[] = [
  {
    id: "desayuno",
    label: "Desayuno",
    range: "6:00 a 10:30",
    title: "Desayunos",
    accent: "#FFB020",
    dishes: [
      { name: "Calentado paisa", desc: "Arroz, frijol, huevo y arepa", price: 14000 },
      { name: "Caldo de costilla", desc: "Con papa criolla y cilantro", price: 12000 },
      { name: "Huevos pericos", desc: "Con arepa de maíz y chocolate", price: 11000 },
    ],
  },
  {
    id: "almuerzo",
    label: "Almuerzo",
    range: "11:30 a 3:00",
    title: "Almuerzo del día",
    accent: "#7C5CFF",
    dishes: [
      { name: "Bandeja paisa", desc: "Frijol, chicharrón, chorizo y huevo", price: 26000 },
      { name: "Sudado de pollo", desc: "Con arroz, papa y ensalada", price: 21000 },
      { name: "Mojarra frita", desc: "Con patacón y arroz de coco", price: 32000 },
    ],
  },
  {
    id: "noche",
    label: "Noche",
    range: "6:00 a 10:00",
    title: "Para la noche",
    accent: "#22D3EE",
    dishes: [
      { name: "Hamburguesa de la casa", desc: "Doble carne, queso y papas", price: 29000 },
      { name: "Picada para dos", desc: "Chorizo, morcilla, papa y maduro", price: 45000 },
      { name: "Michelada jarra", desc: "Litro, para compartir", price: 24000 },
    ],
  },
];

/** Pieza que se pinta dentro del display. Escala con el ancho del marco. */
export default function DemoMenu({ menu }: { menu: DemoMenuData }) {
  return (
    <div
      className="flex h-full w-full flex-col justify-between bg-[#0d0b14] p-[4%]"
      style={{ containerType: "inline-size" }}
    >
      <div className="flex items-baseline justify-between">
        <span
          className="font-display font-bold leading-none"
          style={{ color: menu.accent, fontSize: "7cqw" }}
        >
          {menu.title}
        </span>
        <span className="text-white/50" style={{ fontSize: "3cqw" }}>
          {menu.range}
        </span>
      </div>

      <ul className="mt-[3%] flex flex-1 flex-col justify-center gap-[3%] p-0">
        {menu.dishes.map((d) => (
          <li key={d.name} className="flex list-none items-baseline gap-[3%]">
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold text-white" style={{ fontSize: "5cqw" }}>
                {d.name}
              </span>
              <span className="block truncate text-white/55" style={{ fontSize: "3cqw" }}>
                {d.desc}
              </span>
            </span>
            <span className="font-display font-bold text-white" style={{ fontSize: "5cqw" }}>
              {formatCop(d.price)}
            </span>
          </li>
        ))}
      </ul>

      <span className="text-white/35" style={{ fontSize: "2.6cqw" }}>
        Precios con IVA incluido
      </span>
    </div>
  );
}
