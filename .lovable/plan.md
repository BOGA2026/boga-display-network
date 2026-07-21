
# Rediseño del Dashboard de Usuario

Enfoque **híbrido**: se mantiene la identidad "Neon Premium" (negro + violeta) como marca, y se introduce un acento verde exclusivo para estados en vivo (online, streaming, heartbeat). Se agrega toda la estructura moderna: AppShell, ⌘K, breadcrumbs, selector de sede global, transiciones animadas.

**Solo afecta `/dashboard/*`.** El landing público, `/studio` y `/admin` no se tocan.

---

## 1. Design tokens y base

**`tailwind.config.ts`** — añadir sin romper lo existente:
- `colors.live` con `DEFAULT`, `foreground`, `glow` (HSL vía CSS vars).
- `boxShadow`: `soft-1`, `soft-2`, `soft-3` (sombras multicapa) y `live-pulse`.
- `borderRadius`: elevar `--radius` base a `16px`, agregar `xl2: 20px`, `xl3: 24px`.
- `transitionTimingFunction.ios`: `cubic-bezier(0.32, 0.72, 0, 1)`.
- Keyframes: `live-pulse`, `page-in`, `pill-slide`.

**`src/index.css`** — añadir dentro de `@layer base`:
- Variables `--live`, `--live-foreground`, `--live-glow` (verde `142 76% 45%`).
- Variables `--dash-bg`, `--dash-surface`, `--dash-surface-2`, `--dash-border` (neutros ligeramente cálidos sobre negro violeta: `260 15% 6/8/10%`).
- Clase `.dash-scope` que redefine `--background`, `--card`, `--border`, `--radius` para todo el dashboard, sin afectar el resto del sitio.
- Fundido claro/oscuro: `html.theme-transition *, html.theme-transition *::before, html.theme-transition *::after { transition: background-color 300ms var(--ease-ios), border-color 300ms var(--ease-ios), color 300ms var(--ease-ios); }`.
- Comentario JSDoc arriba del bloque explicando *por qué* cada token existe.

## 2. Componentes UI nuevos en `src/components/ui/`

Cada archivo lleva un comentario de cabecera con la justificación de sus decisiones visuales (2-4 líneas).

- **`status-badge.tsx`** — variantes `live | online | offline | idle | warning`. La variante `live` muestra un punto verde con doble anillo animado (`live-pulse`, 2s, ease-ios).
- **`segmented-control.tsx`** — pill container + indicador deslizante con `motion.div layoutId="segmented-pill"` (spring `stiffness: 380, damping: 32`). API: `<SegmentedControl value onChange options={[{value,label,icon}]} />`.
- **`command-palette.tsx`** — envuelve `cmdk` (ya presente vía shadcn `command`) en un Dialog con atajo global ⌘K / Ctrl+K, agrupado en Navegación / Acciones / Pantallas. Registro extensible vía `useCommandRegistry`.
- **`skeleton-block.tsx`** — variantes `line | card | avatar | chart`, shimmer con gradiente.
- **`page-transition.tsx`** — wrapper `AnimatePresence mode="wait"` con fade + translateY 8→0 en 240ms ease-ios. Usa `location.pathname` como key.

Ya existentes que se re-estilan solo con tokens (sin cambiar API): `button`, `card`, `sheet`, `tabs`, `switch`, `toast`, `skeleton`.

## 3. AppShell

**Nuevo `src/components/layout/AppShell.tsx`** — reemplaza a `DashboardLayout.tsx` en la ruta `/dashboard`. Estructura:

```text
┌─ Sidebar (colapsable, 240 ↔ 68 px) ──┬─ Topbar (56px) ──────────────────────┐
│  Logo                                 │  Breadcrumbs · LocationSwitcher · ⌘K│
│  Nav items (violeta activo)           ├──────────────────────────────────────┤
│  ─                                    │                                      │
│  Colapsar / Cerrar sesión             │  <PageTransition><Outlet /></...>   │
└───────────────────────────────────────┴──────────────────────────────────────┘
```

Detalles:
- Sidebar: estado colapsado persistido en `localStorage("dash.sidebar")`. Ancho animado con Framer Motion (`ease-ios`, 260ms). Indicador de ruta activa: barra vertical + fondo gradiente violeta.
- Topbar: alto 56px, borde inferior sutil, contiene:
  - **Breadcrumbs** generados por mapa `path → label` (`/dashboard/pantallas` → "Inicio / Pantallas"). Componente `Breadcrumbs.tsx`.
  - **LocationSwitcher** (ver §4).
  - Botón `⌘K` que abre CommandPalette.
- Transición de página: `PageTransition` alrededor de `<Outlet />`.
- El `VoiceAgentDock` se conserva.
- `DashboardLayout.tsx` queda como alias que re-exporta `AppShell` para no romper imports.

## 4. Selector de sede global

- **`src/context/LocationContext.tsx`** — provee `{ locations, activeLocationId, setActiveLocationId, activeLocation }`. Fetch a `locations` filtrado por RLS del negocio del usuario. Persiste `activeLocationId` en `localStorage("dash.location")`; si no existe, usa la primera sede o `null` = "Todas".
- **`src/components/layout/LocationSwitcher.tsx`** — `Popover` con lista buscable, muestra nombre + ciudad, ítem "Todas las sedes" al inicio.
- Consumo: `Screens.tsx`, `Content.tsx`, `Playlists.tsx`, `Schedule.tsx`, `Analytics.tsx` leen `activeLocationId` y añaden `.eq("location_id", …)` cuando no es null. Se hace de forma no intrusiva: hook `useLocationFilter()` que devuelve el filtro a aplicar en cada query.

## 5. Command Palette (⌘K)

- Trigger: atajo global `⌘K` / `Ctrl+K` (listener en AppShell) o click en el botón del topbar.
- Registro base:
  - **Navegación**: cada ítem del sidebar.
  - **Acciones rápidas**: "Nueva pantalla", "Subir contenido", "Crear playlist", "Ir a suscripción".
  - **Sedes**: cambio directo desde ⌘K.
- Extensible: `registerCommand()` para que páginas específicas agreguen entradas contextuales.

## 6. Reemplazos visuales concretos (sin cambiar lógica)

- `DashboardSidebar.tsx` → deprecado; su lógica migra a `AppShell`.
- `StatusBadge` reemplaza los puntos `bg-green-500`/`bg-red-500` sueltos en `ScreenCard`, `ScreensList`, `ScreenSelector`. Pantallas online = variante `live` con pulso.
- `SegmentedControl` reemplaza tabs simples en Schedule (vista diaria/semanal) y Analytics (rango de fechas).

## 7. Dependencias

- `bun add framer-motion` (~50KB gzip). No hay conflicto con React 18.
- `cmdk` ya presente.

## 8. Archivos creados / modificados

**Nuevos**
- `src/components/layout/AppShell.tsx`
- `src/components/layout/Breadcrumbs.tsx`
- `src/components/layout/LocationSwitcher.tsx`
- `src/components/ui/status-badge.tsx`
- `src/components/ui/segmented-control.tsx`
- `src/components/ui/command-palette.tsx`
- `src/components/ui/page-transition.tsx`
- `src/context/LocationContext.tsx`
- `src/hooks/useLocationFilter.ts`
- `src/hooks/useCommandRegistry.ts`

**Modificados**
- `tailwind.config.ts` (tokens nuevos, no destructivo)
- `src/index.css` (scope `.dash-scope`, vars `--live`, `--ease-ios`)
- `src/components/layout/DashboardLayout.tsx` (delega a AppShell)
- Consumidores puntuales de status/tabs en Screens, Schedule, Analytics para adoptar los componentes nuevos.

**Sin tocar**: `/`, `/studio`, `/admin`, `/precios`, auth, edge functions, RLS, esquema de DB.

## 9. Criterios de aceptación

1. `/dashboard` renderiza con AppShell nuevo, sidebar colapsable persistente, breadcrumbs y ⌘K funcional.
2. Cambiar sede en el switcher filtra Pantallas, Contenido, Listas, Horarios y Analíticas.
3. StatusBadge `live` pulsa en verde solo para pantallas online.
4. Transiciones entre páginas del dashboard son fade+slide 240ms sin flicker.
5. Landing público, `/studio` y `/admin` visualmente idénticos a ahora.
6. Sin errores TS y build production ok.

## 10. Actualización de memoria

Al finalizar, actualizo `mem://style/visual-identity` para reflejar: "violeta primario global, verde `--live` reservado a estados en tiempo real dentro del dashboard".
