
# Rediseño de las 7 vistas del dashboard

Trabajamos sobre el proyecto actual (no un subproyecto). Conectamos a las tablas Supabase existentes (`screens`, `content`, `content_items`, `locations`, `schedule_blocks`, `screen_commands`, `businesses`) y creamos las tablas mínimas que faltan para QR (`qr_codes`, `qr_scans`). Toda la navegación queda cableada al Command Palette ⌘K que ya existe.

## Mapa de rutas y archivos

```text
/dashboard                       → src/pages/Dashboard.tsx        (hub: KPIs + mini-mapa + accesos rápidos)
/dashboard/pantallas             → src/pages/Screens.tsx          (grid Apple TV + sheet de emparejamiento)
/dashboard/pantallas/:id         → src/pages/ScreenDetail.tsx     (NUEVO: preview, timeline, historial, acciones)
/dashboard/contenido             → src/pages/Content.tsx          (grilla + "enviar a pantalla" → scheduler)
/dashboard/generar-ia            → src/pages/GenerateAI.tsx       (generar → preview → enviar → scheduler)
/dashboard/qr                    → src/pages/QRCodes.tsx          (NUEVO: lista + panel lateral con analítica)
/dashboard/mapa                  → src/pages/DashboardMap.tsx     (NUEVO: mapa con filtros y link a detalle)
```

Sidebar: agregamos entradas para **QR** y **Mapa** en `DashboardSidebar.tsx`. El Command Palette (`command-palette.tsx`) recibe comandos nuevos: `Ir a Mapa`, `Ir a QR`, `Emparejar pantalla`, `Crear con IA`, `Enviar a pantalla…`.

## Flujo (tal como lo pediste)

```text
Dashboard  ──clic pin mini-mapa──▶  /dashboard/mapa  ──clic marker──▶  /dashboard/pantallas/:id
    │                                                                        ▲
    ├──"Crear con IA"──▶ /dashboard/generar-ia ──preview──▶ enviar ─────────┘
    │                                              │
    │                                              └──▶ scheduler (Schedule.tsx prellenado)
    │
    ├──"Emparejar" (sheet, código 6 dígitos, auto-avance) ──▶ /dashboard/pantallas
    │
    └──"QR" ──▶ /dashboard/qr ──clic fila──▶ panel lateral (Sheet) con escaneos + link al lead
```

## Vistas — comportamiento

- **Dashboard (hub)**: 4 KPIs (pantallas online/total, contenidos, escaneos QR 7d, próximos bloques). Mini-mapa Leaflet a la derecha con pins por `locations.lat/lng` coloreados por estado de sus screens; pin → navega a `/dashboard/pantallas/:id` (o al mapa si la sede tiene varias). Accesos rápidos: "Crear con IA", "Ver QR", "Emparejar pantalla".
- **Screens (grid Apple TV)**: cards grandes con thumb del contenido actual, badge de estado (`StatusBadge` live). `Sheet` de emparejamiento: código de 6 caracteres con inputs auto-avance (focus salta al siguiente), copiar, QR a `/descargar-apk`, y polling de `screens` filtrando por `pairing_code` para auto-cerrar cuando el device se registra.
- **ScreenDetail**: preview en iframe (`/player/:deviceId`), timeline semanal (bloques de `schedule_blocks` en grilla 7×24), historial (últimos `screen_commands`), acciones remotas (**reiniciar**, **recargar**, **apagar**) con confirmación en `Sheet` que inserta en `screen_commands`.
- **Content**: grilla con acciones "Enviar a pantalla" → `Sheet` selector de pantalla + fecha → redirige a `/dashboard/programacion?content=…&screen=…`.
- **GenerateAI**: mantener generación; al finalizar, botón "Enviar a pantalla" reutiliza el mismo Sheet de Content.
- **QRCodes**: tabla `qr_codes` con columnas (nombre, destino, escaneos 7d, creado). Clic en fila → `Sheet` lateral con serie temporal (recharts) desde `qr_scans` y CTA a copiar/descargar SVG.
- **DashboardMap**: mapa full-height + panel de filtros (estado: online/offline/sin emparejar, sede). Marker → navega a `/dashboard/pantallas/:id`.

## Datos que faltan (una sola migración)

Creamos dos tablas mínimas para QR con RLS por business, más el endpoint público de escaneo.

```sql
-- qr_codes: uno por business/pantalla/contenido
CREATE TABLE public.qr_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  screen_id uuid REFERENCES public.screens(id) ON DELETE SET NULL,
  label text NOT NULL,
  target_url text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- qr_scans: se inserta desde una Edge Function pública /qr/:slug que redirige
CREATE TABLE public.qr_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_code_id uuid NOT NULL REFERENCES public.qr_codes(id) ON DELETE CASCADE,
  scanned_at timestamptz NOT NULL DEFAULT now(),
  user_agent text,
  referrer text
);
```

GRANT + RLS: `authenticated` puede leer/administrar filas donde `is_member_of_business(business_id)`; `service_role` full. `anon` sin acceso; el conteo público lo hace la Edge Function `qr-redirect` con service role.

## Detalles técnicos

- **Command Palette**: extendemos `commandRegistry` con acciones que hacen `navigate()` y abren sheets vía un `useUIStore` (Zustand ligero) para poder disparar "abrir emparejamiento" desde cualquier lado.
- **Mapa**: reusar `react-leaflet` que ya está instalado en `/admin/mapa`; nuevo componente `MiniMap.tsx` compartido.
- **Sheets**: usar `@/components/ui/sheet` existente. Todos los sheets destructivos requieren confirmación (`AlertDialog`).
- **Realtime**: canal `screens` para actualizar estado online en Dashboard, Screens y ScreenDetail; cleanup con `removeChannel` dentro de `useEffect`.
- **Diseño**: se mantiene el `.dash-scope` (violeta + verde live, radios 16–24, sombras soft-*). Sin cambios en el shell público.

## Fuera de alcance

- No tocamos landing pública, admin, ni Studio.
- No cambiamos el modelo de suscripción/pagos.
- No renombramos rutas existentes; agregamos las nuevas.

## Entregables

1. Migración: `qr_codes`, `qr_scans`, GRANTs, RLS y trigger `updated_at`.
2. Edge Function `qr-redirect` (público, 302 al `target_url` e inserta `qr_scans`).
3. Nuevas páginas: `ScreenDetail.tsx`, `QRCodes.tsx`, `DashboardMap.tsx` + rutas en `App.tsx`.
4. Refactor de: `Dashboard.tsx` (hub + mini-mapa), `Screens.tsx` (grid + sheet auto-avance), `Content.tsx` (acción enviar), `GenerateAI.tsx` (CTA enviar), `DashboardSidebar.tsx` (nuevas entradas), `command-palette.tsx` (comandos nuevos).
5. Nuevos componentes compartidos: `MiniMap.tsx`, `SendToScreenSheet.tsx`, `PairScreenSheet.tsx`, `ScreenActionsSheet.tsx`.

¿Apruebas el plan para implementarlo tal cual, o querés ajustar algo (por ejemplo, dejar QR con placeholder y no crear las tablas todavía)?
