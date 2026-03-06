export type WidgetOrientation = "horizontal" | "vertical";

export type WidgetPreset = {
  id: string;
  name: string;
  orientation: WidgetOrientation;
  w: number;
  h: number;
  type: "product_card" | "menu_board" | "promo";
  data: ProductCardData | MenuBoardData | PromoData;
};

export type ProductCardData = {
  title: string;
  subtitle: string;
  price: string;
  image: string;
  accent: string;
};

export type MenuBoardData = {
  header: string;
  items: { name: string; price: string }[];
  accent: string;
};

export type PromoData = {
  title: string;
  message: string;
  cta: string;
  accent: string;
  bg: string;
};

export const WIDGET_PRESETS: WidgetPreset[] = [
  {
    id: "product-horizontal",
    name: "Producto + Precio (Horizontal)",
    orientation: "horizontal",
    w: 620,
    h: 220,
    type: "product_card",
    data: {
      title: "Hamburguesa Clásica",
      subtitle: "Carne 180g + papas",
      price: "$24.900",
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop",
      accent: "#7C3AED",
    },
  },
  {
    id: "product-vertical",
    name: "Producto + Precio (Vertical)",
    orientation: "vertical",
    w: 360,
    h: 620,
    type: "product_card",
    data: {
      title: "Combo Pollo",
      subtitle: "Incluye bebida",
      price: "$19.900",
      image: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=400&h=400&fit=crop",
      accent: "#EC4899",
    },
  },
  {
    id: "menu-horizontal",
    name: "Carta Menú (Horizontal)",
    orientation: "horizontal",
    w: 980,
    h: 520,
    type: "menu_board",
    data: {
      header: "MENÚ DEL DÍA",
      items: [
        { name: "Lomo Saltado", price: "$32.000" },
        { name: "Ceviche", price: "$28.000" },
        { name: "Ají de Gallina", price: "$24.000" },
      ],
      accent: "#10B981",
    },
  },
  {
    id: "menu-vertical",
    name: "Carta Menú (Vertical)",
    orientation: "vertical",
    w: 520,
    h: 980,
    type: "menu_board",
    data: {
      header: "CARTA",
      items: [
        { name: "Hamburguesa Doble", price: "$26.900" },
        { name: "Ensalada César", price: "$18.500" },
        { name: "Limonada", price: "$7.900" },
      ],
      accent: "#F59E0B",
    },
  },
];
