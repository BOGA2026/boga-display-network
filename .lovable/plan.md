## Problema

Al volver transparentes las secciones sobre la capa de partículas, los `border-t border-border/40` que separaban cada bloque quedaron visibles como líneas horizontales flotando sobre el canvas. Ese borde antes no se notaba porque cada sección tenía fondo opaco propio.

## Causa confirmada

Grep sobre `src/pages/Landing.tsx` y `src/components/landing/*` muestra que las líneas provienen de un `border-t border-border/40` aplicado directamente al `<section>` / `<footer>` de cada bloque de la landing pública:

- `src/pages/Landing.tsx:604` — sección "Cómo funciona"
- `src/pages/Landing.tsx:700` — sección "Precios"
- `src/pages/Landing.tsx:790` — sección CTA final
- `src/pages/Landing.tsx:818` — `<footer>`
- `src/components/landing/Testimonials.tsx:33` — sección testimonios
- `src/components/Faq.tsx:53` — sección FAQ
- `src/components/landing/LegalFooter.tsx:8` — footer legal

El `ParticlesBackground` ya es un único canvas `fixed` global (verificado en el turno anterior), así que no hay canvas apilados. Ninguna sección de la landing tiene fondo opaco propio — solo cards internos, que sí deben conservar su borde.

## Cambios

1. **Eliminar el `border-t border-border/40`** de los `<section>` / `<footer>` listados arriba. No tocar `padding`, `margin`, ni ninguna otra clase.
2. **Conservar** los bordes internos de tarjetas, diálogos, mockups, calculadora, `GrowthBenefits` (divisor interno de tarjeta), y el `border-t` interno del bloque legal dentro del footer (`Landing.tsx:869`) — ese separa contenido dentro del mismo bloque, no dos secciones.
3. No modificar textos, espaciados, componentes, ni el canvas de partículas.

## Verificación

- Repaso visual con Playwright (screenshots top-to-bottom del landing en `/`) confirmando que no queda ninguna línea horizontal entre secciones sobre las partículas.
- Verificar que tarjetas, mockup de TV y calculadora conservan sus bordes propios.