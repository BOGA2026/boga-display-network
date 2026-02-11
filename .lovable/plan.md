

# BOGA Signage Network — Plan MVP

**Plataforma SaaS de Digital Signage para restaurantes y retail en Latinoamérica**

UI en español, tema oscuro, diseño profesional y minimalista.

---

## Fase 1: Fundamentos — Autenticación y Multi-Tenant

### Autenticación
- Login con email y contraseña via Supabase Auth
- Pantalla de registro para nuevos negocios
- Recuperación de contraseña

### Estructura Multi-Tenant
- **Negocios** (tenants): Cada cuenta es un negocio independiente
- **Ubicaciones**: Cada negocio puede tener múltiples sucursales
- **Pantallas**: Cada ubicación puede tener múltiples pantallas/dispositivos
- **Roles**: Admin, Manager, Editor de Contenido — con permisos diferenciados usando tabla separada de roles y RLS policies

### Base de datos
- Tablas: `businesses`, `locations`, `screens`, `user_roles`, `profiles`
- Row-Level Security para aislamiento completo entre tenants

---

## Fase 2: Dashboard Principal

### Navegación y Layout
- Sidebar con navegación: Inicio, Ubicaciones, Pantallas, Contenido, Playlists, Programación, Analíticas
- Header con nombre del negocio, usuario activo, y selector de ubicación
- Dashboard de resumen: total de pantallas, pantallas online/offline, contenido activo

### Gestión de Ubicaciones
- CRUD de ubicaciones (nombre, dirección, zona horaria)
- Vista de tarjetas con estado general de cada ubicación

### Gestión de Pantallas
- Registrar pantallas con ID único de dispositivo
- Ver estado: online/offline, último check-in, playlist asignada, ubicación
- Agrupar pantallas por etiquetas o grupos personalizados
- Asignar/desasignar playlists a pantallas individuales o grupos

---

## Fase 3: Gestión de Contenido

### Biblioteca de Medios
- Upload de imágenes, videos y GIFs a Supabase Storage
- Organización por carpetas y etiquetas
- Vista previa de archivos
- Metadata: nombre, tipo, tamaño, fecha de subida

### Playlists
- Crear y editar playlists con nombre y descripción
- Agregar contenido de la biblioteca a la playlist
- Reordenar ítems con drag-and-drop
- Configurar duración de cada ítem
- Vista previa de la playlist completa

---

## Fase 4: Programación y Asignación

### Programación
- Asignar playlists a pantallas con horarios específicos
- Programación por hora, día de la semana, y rango de fechas
- Programaciones recurrentes (ej: menú de almuerzo 12–3pm)
- Vista de calendario para visualizar la programación

### Grupos de Pantallas
- Crear grupos de pantallas (ej: "Todas las cajas", "Lobby")
- Enviar contenido a todo un grupo con un clic
- Override de contenido para ubicaciones específicas

---

## Fase 5: Player Web (App de Reproducción)

### Ruta `/player` — Pantalla de Reproducción
- Página dedicada que los dispositivos cargan en pantalla completa
- Autenticación del dispositivo con token único
- Descarga la playlist asignada y reproduce contenido en loop
- Soporte para imágenes (con duración configurable) y videos
- Diseñada para funcionar en navegadores de Android TV boxes y Raspberry Pi

### Comunicación con el Servidor
- Check-in periódico reportando estado del dispositivo
- Detección de cambios en playlist para actualizar contenido
- Funcionalidad offline básica (caché del navegador)

---

## Fase 6: Analíticas y Monitoreo

### Dashboard de Analíticas
- Porcentaje de uptime por pantalla
- Logs de reproducción (qué contenido se reprodujo, cuándo)
- Estado de salud de dispositivos (online/offline, última conexión)
- Gráficos con Recharts para visualización de datos

---

## Diseño Visual

- **Tema oscuro** como predeterminado
- Paleta de colores profesional: tonos oscuros con acentos en azul/verde
- Branding "BOGA Signage Network" en sidebar y login
- Tipografía limpia, espaciado generoso
- Iconografía con Lucide React
- Responsive para gestión desde tablets

