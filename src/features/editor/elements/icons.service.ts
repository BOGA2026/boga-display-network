import { strokeSvg } from "./svg";
import type { ElementDef } from "./types";

const svc = (id: string, label: string, tags: string[], inner: string): ElementDef => ({
  id: `servicio-${id}`,
  label,
  tags,
  category: "servicio",
  kind: "icon",
  size: [220, 220],
  svg: () => strokeSvg(inner),
});

const dot = (x: number, y: number, r = 4) => `<circle cx="${x}" cy="${y}" r="${r}" fill="__C__" stroke="none"/>`;
const letters = (t: string, size = 30) =>
  `<text x="50" y="54" text-anchor="middle" dominant-baseline="middle" font-family="Montserrat, Inter, Arial, sans-serif" font-weight="800" font-size="${size}" fill="__C__" stroke="none">${t}</text>`;

export const SERVICE_ICONS: ElementDef[] = [
  svc("domicilio", "Domicilio", ["domicilio", "delivery", "moto", "envio", "a domicilio"],
    `<circle cx="26" cy="70" r="12"/><circle cx="76" cy="70" r="12"/><path d="M26 70 44 42h20l12 28"/><path d="M56 42h16"/>`),
  svc("para-llevar", "Para llevar", ["para llevar", "llevar", "take out", "bolsa", "pedido"],
    `<path d="M26 36h48l-6 46H32Z"/><path d="M38 36c0-10 5-16 12-16s12 6 12 16"/>`),
  svc("mesa", "Comer en el local", ["comer aqui", "mesa", "en el local", "restaurante", "salon"],
    `<path d="M30 20v30a10 10 0 0 0 20 0V20"/><path d="M40 50v32"/><path d="M70 20c-8 4-10 14-10 22h10Z"/><path d="M70 42v40"/>`),
  svc("wifi", "Wifi", ["wifi", "internet", "red"],
    `<path d="M16 44a48 48 0 0 1 68 0"/><path d="M30 58a30 30 0 0 1 40 0"/>${dot(50, 74, 6)}`),
  svc("tarjeta", "Pago con tarjeta", ["tarjeta", "debito", "credito", "datafono", "pago"],
    `<rect x="14" y="30" width="72" height="44" rx="8"/><path d="M14 46h72"/><path d="M28 62h18"/>`),
  svc("nequi", "Pago con Nequi", ["nequi", "pago", "billetera", "transferencia", "celular"],
    `<rect x="32" y="14" width="36" height="72" rx="9"/><path d="M44 78h12"/>${letters("N", 26)}`),
  svc("daviplata", "Pago con Daviplata", ["daviplata", "pago", "billetera", "transferencia", "celular"],
    `<rect x="32" y="14" width="36" height="72" rx="9"/><path d="M44 78h12"/>${letters("D", 26)}`),
  svc("efectivo", "Efectivo", ["efectivo", "plata", "billete", "contado", "pago"],
    `<rect x="12" y="32" width="76" height="40" rx="8"/><circle cx="50" cy="52" r="11"/><path d="M24 52h2"/><path d="M74 52h2"/>`),
  svc("horario", "Horario", ["horario", "hora", "reloj", "abierto", "atencion"],
    `<circle cx="50" cy="50" r="34"/><path d="M50 30v22l14 10"/>`),
  svc("telefono", "Teléfono", ["telefono", "llamar", "contacto"],
    `<path d="M28 18c8 0 12 4 14 12 2 6-4 10-6 12 4 10 12 18 22 22 2-2 6-8 12-6 8 2 12 6 12 14 0 6-6 10-14 10C42 82 18 58 18 32c0-8 4-14 10-14Z"/>`),
  svc("whatsapp", "WhatsApp", ["whatsapp", "chat", "pedidos", "contacto", "wasap"],
    `<path d="M50 16a34 34 0 0 0-29 52l-5 16 17-5A34 34 0 1 0 50 16Z"/><path d="M38 40c0 14 8 22 22 22 4 0 6-4 4-8l-6-2-4 4c-4-2-8-6-10-10l4-4-2-6c-4-2-8 0-8 4Z"/>`),
  svc("instagram", "Instagram", ["instagram", "redes", "siguenos", "ig"],
    `<rect x="18" y="18" width="64" height="64" rx="18"/><circle cx="50" cy="50" r="15"/>${dot(68, 32, 4)}`),
  svc("ubicacion", "Ubicación", ["ubicacion", "direccion", "mapa", "donde estamos", "sede"],
    `<path d="M50 86S22 62 22 42a28 28 0 0 1 56 0c0 20-28 44-28 44Z"/><circle cx="50" cy="42" r="11"/>`),
  svc("parqueadero", "Parqueadero", ["parqueadero", "parking", "carro", "estacionamiento"],
    `<rect x="16" y="16" width="68" height="68" rx="14"/>${letters("P", 44)}`),
  svc("ninos", "Apto para niños", ["ninos", "familiar", "kids", "infantil"],
    `<circle cx="50" cy="28" r="12"/><path d="M50 40v26"/><path d="M28 52h44"/><path d="M50 66 36 84"/><path d="m50 66 14 18"/>`),
  svc("pet", "Pet friendly", ["pet friendly", "mascotas", "perro", "gato"],
    `<circle cx="30" cy="36" r="9"/><circle cx="50" cy="26" r="9"/><circle cx="70" cy="36" r="9"/><path d="M50 46c14 0 22 10 22 20s-10 14-22 14-22-4-22-14 8-20 22-20Z"/>`),
];

/* ───────── Temporadas ───────── */

type Season = { id: string; label: string; tags: string[]; month: number; inner: string };

const SEASONS: Season[] = [
  { id: "navidad", label: "Navidad", tags: ["navidad", "diciembre", "arbol", "fiestas"], month: 12,
    inner: `<path d="M50 14 30 44h12L26 68h20v18h8V68h20L58 44h12Z"/>` },
  { id: "ano-nuevo", label: "Año Nuevo", tags: ["ano nuevo", "31", "fuegos", "brindis"], month: 1,
    inner: `<path d="M50 12v18"/><path d="M50 52v34"/><path d="M22 26l12 12"/><path d="M78 26 66 38"/><circle cx="50" cy="42" r="10"/><path d="M18 60h12"/><path d="M70 60h12"/>` },
  { id: "amor-amistad", label: "Amor y Amistad", tags: ["amor y amistad", "septiembre", "corazon", "amistad"], month: 9,
    inner: `<path d="M50 82S16 60 16 40a18 18 0 0 1 34-8 18 18 0 0 1 34 8c0 20-34 42-34 42Z"/>` },
  { id: "dia-madre", label: "Día de la Madre", tags: ["dia de la madre", "mama", "mayo", "flor"], month: 5,
    inner: `<circle cx="50" cy="34" r="12"/><path d="M50 22c10-10 24 4 12 12"/><path d="M50 22C40 12 26 26 38 34"/><path d="M50 46v36"/><path d="M50 62c10-4 16-12 16-12"/>` },
  { id: "dia-padre", label: "Día del Padre", tags: ["dia del padre", "papa", "junio", "corbata"], month: 6,
    inner: `<path d="M40 16h20l-6 14H46Z"/><path d="M46 30h8l10 34-14 22-14-22Z"/>` },
  { id: "halloween", label: "Halloween", tags: ["halloween", "octubre", "calabaza", "disfraz"], month: 10,
    inner: `<path d="M50 30c14-12 34-2 34 22s-16 34-34 34S16 76 16 52 36 18 50 30Z"/><path d="M50 30V16"/><path d="M36 48l10 8-10 8"/><path d="M64 48 54 56l10 8"/>` },
  { id: "patrias", label: "Fiestas patrias", tags: ["fiestas patrias", "colombia", "20 de julio", "bandera", "independencia"], month: 7,
    inner: `<path d="M26 18v70"/><path d="M26 22h52v18H26Z"/><path d="M26 40h52v10H26Z"/><path d="M26 50h52v10H26Z"/>` },
  { id: "futbol", label: "Fútbol y mundial", tags: ["futbol", "mundial", "partido", "seleccion", "balon"], month: 6,
    inner: `<circle cx="50" cy="50" r="32"/><path d="m50 32 16 12-6 20H40l-6-20Z"/><path d="M50 18v14"/><path d="M18 42l16 2"/><path d="M82 42 66 44"/>` },
  { id: "verano", label: "Verano", tags: ["verano", "sol", "vacaciones", "playa"], month: 12,
    inner: `<circle cx="50" cy="50" r="18"/><path d="M50 14v10"/><path d="M50 76v10"/><path d="M14 50h10"/><path d="M76 50h10"/><path d="m25 25 7 7"/><path d="m68 68 7 7"/><path d="m75 25-7 7"/><path d="m32 68-7 7"/>` },
];

/** Distancia en meses hacia adelante desde el mes actual (0 = este mes). */
function monthDistance(target: number, now: number) {
  return (target - now + 12) % 12;
}

/** Temporadas ordenadas: primero la más cercana a la fecha actual. */
export function seasonElements(now = new Date()): ElementDef[] {
  const m = now.getMonth() + 1;
  return [...SEASONS]
    .sort((a, b) => monthDistance(a.month, m) - monthDistance(b.month, m))
    .map((s) => ({
      id: `temporada-${s.id}`,
      label: s.label,
      tags: s.tags,
      category: "temporadas" as const,
      kind: "icon" as const,
      size: [260, 260] as [number, number],
      svg: () => strokeSvg(s.inner),
    }));
}

SERVICE_ICONS.push(
  svc("pedido-qr", "Pedido por QR", ["qr", "carta digital", "pedido", "menu digital"],
    `<rect x="16" y="16" width="26" height="26"/><rect x="58" y="16" width="26" height="26"/><rect x="16" y="58" width="26" height="26"/><path d="M58 58h12v12H58Z"/><path d="M78 58h6M58 82h26M84 68v16"/>`),
  svc("aire", "Aire acondicionado", ["aire acondicionado", "clima", "fresco"],
    `<rect x="14" y="24" width="72" height="30" rx="8"/><path d="M28 66c6 6 12 0 18 6"/><path d="M56 66c6 6 12 0 18 6"/>`),
  svc("terraza", "Terraza", ["terraza", "aire libre", "exterior", "patio"],
    `<path d="M14 46 50 18l36 28Z"/><path d="M50 46v36"/><path d="M30 82h40"/>`),
  svc("reserva", "Reservas", ["reserva", "agenda", "calendario", "cita"],
    `<rect x="16" y="24" width="68" height="60" rx="10"/><path d="M16 44h68"/><path d="M34 16v16M66 16v16"/><path d="m40 62 8 8 14-16"/>`),
  svc("domicilio-gratis", "Domicilio gratis", ["domicilio gratis", "envio gratis", "delivery", "promocion"],
    `<circle cx="26" cy="70" r="11"/><circle cx="74" cy="70" r="11"/><path d="M26 70 44 44h18l12 26"/><path d="M40 24h34"/>`),
  svc("propina", "Propina", ["propina", "servicio", "voluntaria"],
    `<circle cx="50" cy="46" r="26"/><path d="M50 32v28M42 40h14a6 6 0 0 1 0 12h-12a6 6 0 0 0 0 12h14"/><path d="M22 84h56"/>`),
);
