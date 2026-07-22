## Plan: Arreglar el corte visual del mockup de TV

### Objetivo
Eliminar el fondo negro sólido del contenedor del video/mockup para que flote directamente sobre la capa de partículas y el glow morado del fondo, sin líneas de corte rectas.

### Archivo a modificar
- `src/components/landing/ClientScreensShowcase.tsx`

### Cambios concretos
1. **Quitar el fondo sólido del marco exterior** (actualmente `background: #0a0a0a` en el div redondeado con `border border-white/10`). Dejarlo transparente o con fondo semitransparente (`bg-black/20` o similar) para que el video se integre con el fondo animado.

2. **Quitar el fondo negro sólido del contenedor interno del video** (actualmente `background: #000` en el div con `aspectRatio: 16/9`). Si se necesita un marco oscuro, reemplazarlo por un gradiente radial que se desvanezca hacia los bordes, en lugar de un rectángulo sólido.

3. **Mantener lo que sí funciona**: esquinas redondeadas (`rounded-[24px]` / `rounded-[16px]`), el padding, el glow/box-shadow, y el badge "En vivo". No se tocan textos, espaciados, lógica de rotación de videos ni interacciones.

4. **Verificar legibilidad del video**: si al quitar el fondo oscuro el video pierde contraste con la página, se ajusta el gradiente radial para oscurecer ligeramente el área del video sin crear un borde recto.

### Verificación
- Ejecutar `bun run build` o `tsgo` para confirmar que no hay errores de tipo.
- Revisar visualmente en el preview que el mockup ya no presente la línea de corte negra arriba/abajo.