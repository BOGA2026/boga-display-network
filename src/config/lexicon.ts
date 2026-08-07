/**
 * lexicon.ts — fuente única de verdad de la nomenclatura del producto.
 *
 * Reglas:
 * - Ningún componente escribe etiquetas de navegación, títulos de página ni
 *   breadcrumbs a mano: todo sale de `NAV` / `NAV_GROUPS`.
 * - Los microcopys repetidos viven en `COPY`.
 * - Español neutro con tuteo (nada de voseo rioplatense).
 */
import {
  LayoutDashboard,
  Monitor,
  Image as ImageIcon,
  ListVideo,
  Calendar,
  Map as MapIcon,
  Radio,
  QrCode,
  BarChart3,
  CreditCard,
  LifeBuoy,
  Sparkles,
  PenTool,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavKey =
  | "inicio"
  | "pantallas"
  | "contenido"
  | "listas"
  | "horarios"
  | "mapa"
  | "monitoreo"
  | "qr"
  | "analiticas"
  | "suscripcion"
  | "ajustes"
  | "soporte"
  | "generarIa"
  | "editor";

export interface NavEntry {
  /** Ruta canónica. */
  path: string;
  /** Etiqueta corta del menú lateral. */
  label: string;
  /** Texto del breadcrumb (nunca derivar del segmento de URL). */
  breadcrumb: string;
  /** H1 de la página. */
  pageTitle: string;
  /** Subtítulo bajo el H1. */
  pageSubtitle: string;
  icon: LucideIcon;
  /** Coincidencia exacta de ruta activa. */
  end?: boolean;
  /** No se muestra en el menú lateral (accesible desde otras vistas). */
  hidden?: boolean;
  /**
   * Vocabulario alternativo/antiguo. Solo se usa para búsqueda (⌘K):
   * nunca se muestra como etiqueta.
   */
  aliases?: string[];
}

export const NAV: Record<NavKey, NavEntry> = {
  inicio: {
    path: "/dashboard",
    label: "Inicio",
    breadcrumb: "Inicio",
    pageTitle: "Inicio",
    pageSubtitle: "Resumen del estado de tus pantallas y actividad reciente.",
    icon: LayoutDashboard,
    end: true,
    aliases: ["Home", "Dashboard", "Panel", "Resumen"],
  },
  pantallas: {
    path: "/dashboard/pantallas",
    label: "Pantallas",
    breadcrumb: "Pantallas",
    pageTitle: "Pantallas",
    pageSubtitle: "Conecta, renombra y controla las pantallas de tu negocio.",
    icon: Monitor,
    aliases: ["Screens", "TVs", "Displays", "Dispositivos"],
  },
  contenido: {
    path: "/dashboard/contenido",
    label: "Contenido",
    breadcrumb: "Contenido",
    pageTitle: "Contenido",
    pageSubtitle: "Sube, organiza y publica el material que ven tus clientes.",
    icon: ImageIcon,
    aliases: ["Content", "Media", "Biblioteca", "Archivos"],
  },
  listas: {
    path: "/dashboard/listas",
    label: "Listas",
    breadcrumb: "Listas",
    pageTitle: "Listas de reproducción",
    pageSubtitle: "Agrupa contenido en secuencias y envíalas a tus pantallas.",
    icon: ListVideo,
    aliases: ["Playlists", "Playlist", "Listas de reproducción", "Secuencias"],
  },
  horarios: {
    path: "/dashboard/programacion",
    label: "Programación",
    breadcrumb: "Programación",
    pageTitle: "Programación",
    pageSubtitle: "Define qué se muestra en cada pantalla y a qué hora.",
    icon: Calendar,
    aliases: ["Horarios", "Schedule", "Scheduling", "Agenda", "Calendario"],
  },
  mapa: {
    path: "/dashboard/mapa",
    label: "Mapa",
    breadcrumb: "Mapa",
    pageTitle: "Mapa de pantallas",
    pageSubtitle: "Haz clic en un pin para ver el detalle de la pantalla.",
    icon: MapIcon,
    aliases: ["Map", "Ubicaciones", "Sedes"],
  },
  monitoreo: {
    path: "/dashboard/monitoreo",
    label: "Monitoreo",
    breadcrumb: "Monitoreo",
    pageTitle: "Monitoreo geográfico",
    pageSubtitle: "Estado casi en tiempo real de todas tus pantallas.",
    icon: Radio,
    aliases: ["Monitoring", "Estado", "Uptime", "Salud"],
  },
  qr: {
    path: "/dashboard/qr",
    label: "Códigos QR",
    breadcrumb: "Códigos QR",
    pageTitle: "Códigos QR",
    pageSubtitle:
      "Códigos dinámicos: cambia el destino cuando quieras sin reimprimir. Cada escaneo se registra en tiempo real.",
    icon: QrCode,
    aliases: ["QR", "Códigos", "Codigos QR", "Scan"],
  },
  analiticas: {
    path: "/dashboard/analiticas",
    label: "Analíticas",
    breadcrumb: "Analíticas",
    pageTitle: "Analíticas",
    pageSubtitle: "Mide el rendimiento de tus pantallas y de tus códigos QR.",
    icon: BarChart3,
    aliases: ["Analytics", "Analiticas", "Métricas", "Reportes", "Estadísticas"],
  },
  suscripcion: {
    path: "/dashboard/suscripcion",
    label: "Suscripción",
    breadcrumb: "Suscripción",
    pageTitle: "Suscripción",
    pageSubtitle: "Gestiona tu plan, tus pantallas activas y tus pagos.",
    icon: CreditCard,
    aliases: ["Billing", "Plan", "Pagos", "Facturación", "Settings"],
  },
  ajustes: {
    path: "/dashboard/ajustes",
    label: "Ajustes del negocio",
    breadcrumb: "Ajustes del negocio",
    pageTitle: "Ajustes del negocio",
    pageSubtitle: "Datos del local, cupo del plan y valores por defecto del contenido.",
    icon: Settings,
    aliases: ["Configuración", "Settings", "Ajustes", "Zona horaria", "Logo", "Almacenamiento"],
  },
  soporte: {
    path: "/dashboard/soporte",
    label: "Soporte",
    breadcrumb: "Soporte",
    pageTitle: "Soporte",
    pageSubtitle: "Habla con el equipo de Visualia o envía una PQRS.",
    icon: LifeBuoy,
    aliases: ["Support", "Ayuda", "PQRS", "Contacto"],
  },

  generarIa: {
    path: "/dashboard/generar-ia",
    label: "Generar con IA",
    breadcrumb: "Generar con IA",
    pageTitle: "Generar diseño con IA",
    pageSubtitle: "Describe lo que necesitas y la IA genera 3 propuestas editables.",
    icon: Sparkles,
    hidden: true,
    aliases: ["AI", "IA", "Generar", "Generate"],
  },
  editor: {
    path: "/dashboard/editor",
    label: "Editor",
    breadcrumb: "Editor",
    pageTitle: "Editor de diseño",
    pageSubtitle: "Ajusta textos, imágenes y colores antes de publicar.",
    icon: PenTool,
    hidden: true,
    aliases: ["Editor", "Diseñar", "Canvas", "Design"],
  },
};

export interface NavGroup {
  id: string;
  label: string;
  items: NavKey[];
}

/** Estructura del menú lateral. El sidebar se genera desde aquí. */
export const NAV_GROUPS: NavGroup[] = [
  { id: "general", label: "General", items: ["inicio"] },
  { id: "operacion", label: "Operación", items: ["pantallas", "contenido", "listas", "horarios"] },
  { id: "red", label: "Red", items: ["mapa", "monitoreo", "qr"] },
  { id: "negocio", label: "Negocio", items: ["analiticas", "suscripcion", "ajustes", "soporte"] },
];

/** Rutas antiguas → ruta canónica actual. */
export const LEGACY_REDIRECTS: Record<string, string> = {
  "/dashboard/playlists": NAV.listas.path,
  "/dashboard/playlist": NAV.listas.path,
  "/dashboard/horarios": NAV.horarios.path,
  "/dashboard/analytics": NAV.analiticas.path,
  "/dashboard/schedule": NAV.horarios.path,
};

/**
 * Rutas antiguas CON parámetro. El destino conserva el `:param`, que
 * `LegacyRedirect` reemplaza en tiempo de ejecución para no perder el deep link.
 */
export const LEGACY_PARAM_REDIRECTS: Record<string, string> = {
  "/dashboard/playlists/:id": `${NAV.listas.path}/:id`,
  "/dashboard/playlist/:id": `${NAV.listas.path}/:id`,
  "/dashboard/screens/:id": `${NAV.pantallas.path}/:id`,
};

/** Busca la entrada de navegación de un pathname (match más específico). */
export function navEntryByPath(pathname: string): NavEntry | undefined {
  const entries = Object.values(NAV);
  const exact = entries.find((e) => e.path === pathname);
  if (exact) return exact;
  return entries
    .filter((e) => !e.end && pathname.startsWith(e.path + "/"))
    .sort((a, b) => b.path.length - a.path.length)[0];
}

/** Microcopys compartidos. Español neutro, tuteo. */
export const COPY = {
  actions: {
    create: "Crear",
    save: "Guardar",
    cancel: "Cancelar",
    delete: "Eliminar",
    upload: "Subir archivo",
    createWithAi: "Crear con IA",
    designInEditor: "Diseñar en editor",
    connectScreen: "Conectar pantalla",
    newQr: "Nuevo QR",
    newPlaylist: "Nueva lista",
    retry: "Reintentar",
    help: "Ayuda",
    logout: "Cerrar sesión",
    collapse: "Colapsar",
    expand: "Expandir menú",
    search: "Buscar",
  },
  loading: {
    generic: "Cargando…",
  },
  empty: {
    screens: "Todavía no tienes pantallas conectadas.",
    content: "Todavía no has subido contenido.",
    playlists: "Todavía no tienes listas. Crea la primera para empezar.",
    qr: "Todavía no tienes códigos QR. Crea el primero.",
    aiGenerations: "Todavía no tienes generaciones. Crea la primera arriba.",
    screensTitle: "Sin pantallas registradas",
    contentTitle: "Sin contenido todavía",
    playlistsTitle: "Sin listas todavía",
    invoices: "Todavía no tienes facturas. Aparecerán aquí después del primer cobro.",
    invoicesTitle: "Sin facturas",
    payments: "Todavía no registramos pagos en esta cuenta.",
    paymentsTitle: "Sin pagos",
  },
  error: {
    title: "No pudimos cargar esta sección",
    description:
      "Algo falló al traer la información. Revisa tu conexión e inténtalo de nuevo.",
    screens: "No pudimos cargar tus pantallas.",
    content: "No pudimos cargar tu contenido.",
    playlists: "No pudimos cargar tus listas.",
    subscription: "No pudimos cargar los datos de tu suscripción.",
  },

  toasts: {
    aiReady: {
      title: "Generación lista",
      description: "Ya puedes usarla en tus pantallas.",
    },
    sentToLibrary: {
      title: "Enviado a tu biblioteca",
      description: "Ahora puedes programarlo desde Contenido.",
    },
    qrCreated: "QR creado: ya puedes imprimirlo o proyectarlo.",
    qrUpdated: "QR actualizado",
  },
  sync: {
    tooltipWarn:
      "Esta pantalla lleva rato sin reportarse. Revisa que esté encendida y con internet.",
    never: "Nunca",
    label: "Última sincronización:",
  },
  soporte: {
    chatTitle: "Chat con el equipo",
    chatEmpty: "Escríbenos por aquí. Un miembro del equipo te responderá lo antes posible.",
    chatPlaceholder: "Escribe tu mensaje…",
    slaTitle: "Tiempo estimado de respuesta",
    slaValue: "Menos de 2 horas",
    slaNote: "Lunes a sábado, de 8:00 a. m. a 8:00 p. m. Fuera de ese horario respondemos al día siguiente.",
    pqrsTitle: "Tus solicitudes PQRS",
    pqrsEmptyTitle: "Sin solicitudes",
    pqrsEmpty: "Todavía no has enviado ninguna solicitud. Crea una y le hacemos seguimiento.",
    pqrsNew: "Nueva solicitud",
    pqrsBack: "← Volver",
    pqrsNoAnswers: "Todavía no hay respuestas.",
    pqrsSent: "Solicitud enviada. Te responderemos pronto.",
    pqrsSubject: "Asunto",
    pqrsMessage: "Cuéntanos el detalle…",
    faqTitle: "Preguntas frecuentes",
    faq: [
      {
        q: "¿Cómo conecto una pantalla?",
        a: "Instala la app de Visualia en tu TV, ábrela y aparecerá un código de 6 caracteres. Ve a Pantallas, haz clic en Conectar pantalla y escribe ese código.",
      },
      {
        q: "¿Por qué mi pantalla aparece sin conexión?",
        a: "Casi siempre es internet o corriente. Revisa que el TV esté encendido, con wifi activo y con la app abierta. En pocos minutos vuelve a reportarse sola.",
      },
      {
        q: "¿Cómo cambio el menú que se ve en la pantalla?",
        a: "Entra a Contenido, sube o edita el diseño y guárdalo. Luego, desde Listas u Horarios, envíalo a la pantalla que quieras. El cambio llega en segundos.",
      },
      {
        q: "¿Cómo funcionan los códigos QR?",
        a: "Cada QR es dinámico: puedes cambiar su destino cuando quieras sin volver a imprimirlo. Cada escaneo queda registrado y lo ves en Analíticas.",
      },
      {
        q: "¿Cómo cambio de plan o agrego pantallas?",
        a: "En Suscripción puedes sumar o quitar pantallas. Te cobramos solo la parte proporcional de los días que faltan del ciclo.",
      },
      {
        q: "¿Puedo hablar con una persona?",
        a: "Sí. Escríbenos por este chat o por WhatsApp y te acompañamos en vivo.",
      },
    ],
    statusLabels: {
      abierto: "Abierto",
      en_proceso: "En proceso",
      resuelto: "Resuelto",
      cerrado: "Resuelto",
    } as Record<string, string>,
  },
  hints: {
    qrScreenAttribution:
      "Si asignas una pantalla, los escaneos quedan atribuidos a ella y puedes ver qué TV vende más.",
    whatsappSupport: "Mientras tanto, escríbenos por WhatsApp y te acompañamos en vivo.",
  },

  /** Chequeo del televisor y aparatito que se conecta al HDMI. */
  dispositivo: {
    enlaceConsulta: "¿Mi televisor sirve?",
    consultaTitulo: "Veamos si tu televisor sirve",

    paso1Titulo: "¿Qué televisor vas a usar?",
    paso1Sub: "Elige la marca de tu televisor para saber por dónde empezar.",

    paso2Titulo: "Busca en el menú de aplicaciones de tu televisor. ¿Aparece Google Play Store?",
    paso2Pista: "Tu televisor probablemente ya funciona. Vamos a confirmarlo.",
    paso2Sub: "Es la única forma segura de saberlo: mira tu televisor y dinos qué ves.",
    paso2Ayuda: "Este es el ícono que tienes que buscar entre las aplicaciones de tu televisor.",
    siLaVeo: "Sí, la veo",
    noLaEncuentro: "No la encuentro",
    compatible: "Tu televisor sirve. Puedes conectarlo cuando quieras.",

    paso3Titulo: "Necesitas un dispositivo para conectar tu pantalla",
    paso3Marca: "Los televisores Samsung y LG no usan Android, así que necesitas un dispositivo adicional.",
    paso3Sub: "Es un aparato pequeño que se conecta al HDMI del televisor y hace que funcione con Visualia.",

    opcionPropia: "Comprarlo por tu cuenta",
    requisito: "Requisito único: debe decir Google TV en la caja.",
    yaTengoDispositivo: "Ya tengo el aparato, seguir",

    opcionVisualia: "Que Visualia te lo envíe configurado",
    opcionVisualiaSub:
      "Te lo enviamos con la app instalada y tu pantalla ya vinculada. Solo lo conectas al HDMI del televisor.",
    planMensual: "Plan mensual",
    pagoAnual: "Pago anual adelantado",
    sinCosto: "Sin costo",
    incluido: "Incluido",
    incluidoNota: "Con pago anual adelantado, el dispositivo va incluido.",
    ahorroMensual: "Cambia a pago anual y el dispositivo te sale sin costo. Te ahorras $250.000.",
    pedirloAVisualia: "Que Visualia me lo envíe",
    pedirIncluido: "Pedir mi dispositivo incluido",

    envioTitulo: "¿A dónde te lo enviamos?",
    envioSub: "Lo preparamos con tu pantalla ya vinculada y te avisamos cuando salga.",
    confirmarPedido: "Confirmar pedido",
    pedidoError: "No pudimos registrar el pedido. Inténtalo de nuevo.",
    pedidoOkTitulo: "Pedido registrado",
    pedidoOkSub:
      "Puedes seguir el estado de tu dispositivo desde Suscripción, sin escribirle a nadie.",

    pedidosTitulo: "Tu plan",
    pedidosVacio: "Aún no has solicitado el envío del dispositivo.",
    anualArgumento:
      "Con pago anual adelantado te enviamos el dispositivo configurado sin costo. Son $250.000 que no pagas.",
  },
} as const;
