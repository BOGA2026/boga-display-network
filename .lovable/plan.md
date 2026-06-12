## Objetivo
Reducir confusión consolidando 3 ítems del menú lateral ("Contenido", "Generar con IA", "Editor") en uno solo ("Contenido"), y exponer las 3 acciones como botones dentro de la página de Contenido.

## Cambios

### 1. `src/components/layout/DashboardSidebar.tsx`
- Eliminar los ítems "Generar con IA" (`/dashboard/generar-ia`) y "Editor" (`/dashboard/editor`).
- Dejar "Contenido" (`/dashboard/contenido`) como único punto de entrada para creación de contenido.
- El menú queda: Inicio · Pantallas · **Contenido** · Listas · Horarios · Analíticas · Suscripción.

### 2. `src/pages/Content.tsx`
En el header de la página (arriba de la grilla de contenidos), reemplazar el botón único "Subir" por una fila con 3 botones claros:

1. **Subir archivo** (primario, icono `Upload`) — abre el diálogo de upload actual.
2. **Crear con IA** (secundario, icono `Sparkles`) — navega a `/dashboard/generar-ia`.
3. **Diseñar en editor** (secundario, icono `LayoutGrid`) — navega a `/dashboard/editor`.

En móvil se apilan (`flex-col sm:flex-row`). Mismo estilo visual neon que el resto del dashboard.

### Lo que NO cambia
- Las rutas `/dashboard/generar-ia` y `/dashboard/editor` siguen existiendo y funcionando (solo se accede a ellas desde los botones de Contenido).
- Lógica de upload, listado, eliminación, etc.
- Estilos generales.

## Vista previa del menú

```text
Antes                         Después
─────                         ───────
Inicio                        Inicio
Pantallas                     Pantallas
Contenido          ──►        Contenido   ← (con 3 botones adentro)
Generar con IA
Editor
Listas                        Listas
Horarios                      Horarios
Analíticas                    Analíticas
Suscripción                   Suscripción
```

¿Confirmás que aplique estos cambios?