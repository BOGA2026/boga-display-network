/**
 * Contenidos editoriales de /studio (proceso + FAQ).
 * Marcados los tiempos y políticas del negocio para confirmar con producción
 * antes de considerarlos definitivos.
 */

export const STUDIO_STEPS = [
  {
    n: 1,
    title: "Nos cuentas de tu negocio",
    text: "Una llamada o chat de 20 minutos. Nos envías tu menú actual y las fotos de tus platos.",
  },
  {
    n: 2,
    title: "Diseñamos tu contenido",
    text: "Creamos el diseño de tu carta y promociones y te mostramos avances para tu aprobación. Tiempo estimado según plan: Impulso 5 a 7 días hábiles, Crecimiento 10 a 14 días hábiles, Dominio de Marca 20 a 30 días hábiles.",
  },
  {
    n: 3,
    title: "Lo publicamos en tus pantallas",
    text: "Configuramos todo en la plataforma: horarios, rotación y promociones destacadas. Tú no tocas nada.",
  },
  {
    n: 4,
    title: "Lo mantenemos actualizado",
    text: "Cada mes ajustamos precios, productos o promociones según el plan que elegiste.",
  },
] as const;

export type StudioFaq = { q: string; a: string };

export const STUDIO_FAQ: StudioFaq[] = [
  {
    q: "¿Necesito tener ya la plataforma Visualia para contratar Studio?",
    a: "Sí. Visualia Studio es un servicio de creación de contenido sobre la plataforma Visualia. Si aún no la tienes activa, la ponemos en marcha contigo el mismo día en que empezamos el diseño. La suscripción a la plataforma se factura aparte a $50.000 por pantalla al mes.",
  },
  {
    q: "¿Las fotografías de mis productos las ponen ustedes o yo?",
    a: "Las fotografías las suministras tú. Nosotros las optimizamos (color, iluminación y encuadre) y, en el plan Crecimiento Comercial, las mejoramos con IA a partir de esas mismas fotos reales. No reemplazamos tus productos con imágenes de banco de stock.",
  },
  {
    q: "¿En cuánto tiempo está listo mi menú?",
    a: "Depende del plan y empieza a contar desde que recibimos tus fotos y tu menú actual. Impulso Visual: 5 a 7 días hábiles. Crecimiento Comercial: 10 a 14 días hábiles. Dominio de Marca: 20 a 30 días hábiles.",
  },
  {
    q: "¿La inversión inicial se paga una sola vez? ¿Hay cuotas?",
    a: "Es un pago único que cubre el diseño y la puesta en marcha. Puedes pagarlo en dos cuotas: 50% al iniciar el proyecto y 50% a la entrega. La mensualidad del servicio empieza a cobrarse cuando el contenido ya está publicado en tus pantallas.",
  },
  {
    q: "¿Puedo cambiar de plan o cancelar la mensualidad?",
    a: "Sí. Puedes subir o bajar de plan con 30 días de aviso y cancelar la mensualidad de Studio cuando quieras, sin cláusula de permanencia. La suscripción a la plataforma Visualia se maneja aparte y conserva sus propias condiciones.",
  },
  {
    q: "¿Qué pasa si necesito un cambio extra dentro del mes?",
    a: "Tu plan incluye una actualización mensual (ilimitada en Dominio de Marca). Si necesitas piezas o cambios adicionales, te enviamos cotización por pieza antes de ejecutar; nunca cobramos algo que no hayas aprobado.",
  },
];
