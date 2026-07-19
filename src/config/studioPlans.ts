/**
 * Studio Plans — ÚNICA fuente de verdad de precios y contenidos de /studio.
 * Ningún precio ni feature debe estar hardcodeado en JSX. Todo se lee de aquí.
 * Regla equivalente a src/config/pricing.ts para la plataforma.
 */


export type StudioPlan = {
  id: "impulso" | "crecimiento" | "dominio";
  name: string;
  ideal: string;
  highlighted: boolean;
  badge: string | null;
  setup: {
    display: string; // "$990.000" o "Desde $5.900.000"
    variesBy?: string; // solo P3
    breakdown: string[];
    installments: string;
  };
  monthly: {
    display: string; // "$99.000"
    unitLabel: string; // igual estructura en los 3 planes
    isFlat: boolean; // false = por pantalla; true = tarifa fija
  };
  includesFrom: string | null;
  features: string[];
  monthlyDetail?: {
    title: string | null;
    options: string[];
    note: string;
  };
};

const DEFAULT_INSTALLMENTS =
  "Se puede pagar en 2 cuotas: 50% al iniciar y 50% a la entrega del diseño.";

export const STUDIO_PLANS: StudioPlan[] = [
  {
    id: "impulso",
    name: "Impulso Visual",
    ideal:
      "Restaurantes y cafés que quieren empezar con un menú digital profesional.",
    highlighted: false,
    badge: null,
    setup: {
      display: "$990.000",
      breakdown: [
        "Diseño profesional de la carta digital (hasta 30 ítems)",
        "Adaptación a formato horizontal (1920×1080) y vertical (1080×1920)",
        "Configuración inicial del contenido en la plataforma",
        "1 ronda de ajustes visuales antes de la publicación",
      ],
      installments: DEFAULT_INSTALLMENTS,
    },
    monthly: {
      display: "$99.000",
      unitLabel: "COP / mes por pantalla",
      isFlat: false,
    },
    includesFrom: null,
    features: [
      "Diseño profesional de carta digital",
      "Adaptación visual a tus pantallas",
      "Configuración inicial del sistema",
      "Programación básica de contenidos",
      "Soporte técnico remoto",
    ],
    monthlyDetail: {
      title: "1 ajuste mensual de tu menú",
      options: [
        "Actualización de precios",
        "Cambio o actualización de productos",
      ],
      note: "Las fotografías y contenidos del menú deben ser suministrados por el cliente.",
    },
  },
  {
    id: "crecimiento",
    name: "Crecimiento Comercial",
    ideal: "Negocios que quieren vender más activamente.",
    highlighted: true,
    badge: "MÁS ELEGIDO POR RESTAURANTES",
    setup: {
      display: "$2.900.000",
      breakdown: [
        "Rediseño estratégico de la carta (hasta 60 ítems)",
        "Optimización de imágenes con IA a partir de fotografías reales",
        "Piezas visuales de promociones destacadas",
        "Programación automática por horarios (desayuno / almuerzo / cena)",
        "2 rondas de ajustes antes de la publicación",
      ],
      installments: DEFAULT_INSTALLMENTS,
    },
    monthly: {
      display: "$299.000",
      unitLabel: "COP / mes (tarifa fija, sin importar cuántas pantallas)",
      isFlat: true,
    },
    includesFrom: "Todo lo de Impulso Visual más:",
    features: [
      "Rediseño estratégico del menú digital",
      "Optimización visual de productos",
      "Imágenes generadas con IA a partir de fotografías reales",
      "Programación automática por horarios",
      "Promociones destacadas en pantalla",
      "1 actualización mensual de precios o productos",
      "Cada mes revisamos qué funciona y mejoramos tus diseños",
    ],
    monthlyDetail: {
      title: null,
      options: [],
      note: "Las imágenes se optimizan a partir de fotografías reales proporcionadas por el cliente.",
    },
  },
  {
    id: "dominio",
    name: "Dominio de Marca",
    ideal: "Cadenas o marcas en expansión.",
    highlighted: false,
    badge: null,
    setup: {
      display: "Desde $5.900.000",
      variesBy:
        "El valor final depende del número de sedes, la cantidad de piezas audiovisuales y el volumen de contenido mensual.",
      breakdown: [
        "Sistema visual multi-sede (identidad unificada en todas tus pantallas)",
        "Producción audiovisual base (hasta 3 videos promocionales)",
        "Campañas comerciales iniciales",
        "Estrategia visual documentada (manual de marca en pantalla)",
        "Rondas de ajustes ilimitadas durante los primeros 30 días",
      ],
      installments: DEFAULT_INSTALLMENTS,
    },
    monthly: {
      display: "Desde $1.490.000",
      unitLabel: "COP / mes (tarifa fija, sin importar cuántas pantallas)",
      isFlat: true,
    },
    includesFrom: "Todo lo de Crecimiento Comercial más:",
    features: [
      "Manejamos las pantallas de todas tus sedes por ti",
      "Producción audiovisual",
      "Campañas comerciales",
      "Videos promocionales",
      "Actualizaciones ilimitadas",
      "Un plan de qué mostrar cada temporada (Navidad, día de la madre, temporada de almuerzos)",
      "Prioridad en soporte",

    ],
  },
];

/**
 * Matriz comparativa. Cada fila lista un atributo y su valor por plan
 * en el orden [impulso, crecimiento, dominio].
 * Un booleano se pinta como ✓ / —; un string se pinta tal cual.
 */
export type ComparisonRow = {
  label: string;
  values: [boolean | string, boolean | string, boolean | string];
};

export const STUDIO_COMPARISON: ComparisonRow[] = [
  { label: "Diseño de menú digital", values: [true, true, true] },
  { label: "Adaptación horizontal y vertical", values: [true, true, true] },
  { label: "Optimización de imágenes con IA", values: [false, true, true] },
  {
    label: "Programación por horarios",
    values: ["Básica", "Automática", "Automática"],
  },
  { label: "Promociones destacadas", values: [false, true, true] },
  {
    label: "Actualizaciones mensuales incluidas",
    values: ["1", "1", "Ilimitadas"],
  },
  { label: "Producción audiovisual", values: [false, false, true] },
  { label: "Manejamos las pantallas de todas tus sedes", values: [false, false, true] },
  { label: "Prioridad en soporte", values: [false, false, true] },
];
