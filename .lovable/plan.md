## Objetivo
Agregar un fondo animado de partículas flotantes (estilo reactbits.dev) detrás del hero de la landing, sin tocar textos ni otras secciones.

## Archivos
1. **Nuevo:** `src/components/landing/ParticlesBackground.tsx` — componente canvas standalone.
2. **Editar:** `src/pages/Landing.tsx` — insertar el componente dentro del contenedor del hero (posición absoluta, detrás del contenido). Solo se agrega el nuevo elemento; no se toca copy ni layout existente.

## Detalles técnicos de `ParticlesBackground`

- `<canvas>` con `position: absolute; inset: 0; z-index: 0; pointer-events: none`. El contenido del hero se asegura con `position: relative; z-index: 1`.
- Al montar: crear ~150 partículas con `{x, y, vx, vy, r (1–2.5px), phase (para opacidad), noiseSeed}`.
- Loop con `requestAnimationFrame`:
  - Actualizar posición: `x += vx + sin(t * 0.001 + seed) * 0.15` (mismo para y con cos) → deriva ondulante.
  - Wrap-around en los 4 bordes.
  - Opacidad respirando: `0.2 + (sin(t*0.0008 + phase)+1)/2 * 0.4` → rango 0.2–0.6.
  - Interacción mouse: si `dist < 120px` → aplicar vector de repulsión suave (`vx += dx/dist * force`, con damping para volver a la deriva base), pintar en verde esmeralda (`#10b981`) y aumentar radio ~1.5x. Fuera del radio, color base gris cálido (`stone-400` `#a8a29e`).
- Listeners: `mousemove` en el canvas (rect-relative), `resize` en window para recalcular `canvas.width/height` × `devicePixelRatio`.
- Cleanup: `cancelAnimationFrame` + remover listeners al desmontar.
- `prefers-reduced-motion`: si activo, pintar una sola vez las partículas estáticas y no arrancar el loop.
- Tema: el proyecto es dark-only (según `index.css`), así que uso stone-500 (`#78716c`) como color base y verde esmeralda como acento del cursor. Sin lógica de tema dinámico.

## Integración en Landing
- Localizar el bloque del hero en `src/pages/Landing.tsx` (contenedor que ya tiene `hero-aurora`).
- Insertar `<ParticlesBackground />` como primer hijo del contenedor relativo, antes del contenido, dejando la aurora existente intacta. Si el contenido no tiene `z-index`, agregar `relative z-10` al wrapper del texto (solo si es necesario para legibilidad).
- Opcional: pequeño gradiente radial detrás del H1 solo si la lectura se ve afectada (evaluar visualmente).

## Fuera de alcance
- No se modifica ningún texto, botón, video ni otra sección.
- No se agrega toggle ni configuración.
