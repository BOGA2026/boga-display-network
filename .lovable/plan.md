
# Heartbeat + Reload remoto + Estado real online/offline

Objetivo: que cada Fire TV reporte "estoy vivo" cada 60s, que el dashboard muestre el estado real (verde/ámbar/rojo), y que puedas mandar **Recargar** o **Reiniciar app** con un clic sin ir físicamente al sitio.

---

## Lo que ya tienes (no se toca)
- Tabla `screens` con `last_seen_at`, `status`, `app_version`, `device_model`, `os_version`.
- Tabla `screen_commands` con realtime habilitado.
- Edge function `screen-commands` con endpoints `/sync` y `/send`.
- APK Fire TV con WebView en kiosko.

## Lo que falta y se va a construir

### 1. Endpoint público de heartbeat (edge function nueva)
Nueva edge function `device-heartbeat` (sin JWT, validada por `device_code`):
- **POST** recibe `{ device_code, app_version, device_model, os_version, ip }`.
- Resuelve `screen_id` desde `devices.device_code`.
- Actualiza `screens.last_seen_at = now()`, `status = 'online'`, `app_version`, `device_model`, `os_version`, `ip_address`.
- Devuelve la lista de **comandos pendientes** para esa pantalla (`screen_commands` con `status='pending'` y no expirados).
- La APK marca cada comando como `executed` enviando un `result` de vuelta.

Por qué público: el Fire TV no tiene sesión Supabase. Se autentica con su `device_code` único + un token corto que le emite el pairing.

### 2. Cron de "marcar offline" (edge function programada)
Edge function `mark-offline-screens` que corre cada 2 minutos:
- `UPDATE screens SET status='offline' WHERE last_seen_at < now() - interval '3 minutes' AND status != 'offline'`.
- Se programa vía `supabase/config.toml` con `schedule = "*/2 * * * *"`.

### 3. Player web (`/player/:deviceId`) con heartbeat
Modificar `src/pages/Player.tsx`:
- Al cargar, hace `POST` a `device-heartbeat` cada 60s.
- Procesa los comandos que devuelve:
  - `reload` → `window.location.reload()`
  - `restart_app` → recarga + limpia cache (`caches.delete`)
  - `screenshot` → `html2canvas` y sube a storage (opcional, fase 2)
- Marca comandos como ejecutados.

### 4. APK Fire TV — receptor de comandos nativos
En `MainActivity.kt`:
- Inyectar un `JavascriptInterface` `VisualiaNative` con métodos `restartApp()`, `clearCache()`, `getDeviceInfo()`.
- Para `restart_app`, el WebView llama `VisualiaNative.restartApp()` que reinicia la Activity (más fuerte que `location.reload`).
- Watchdog ligero: si la WebView no dispara `onPageFinished` en 30s, reload automático.

### 5. UI en el dashboard

**`ScreenCard.tsx`** y **`ScreenDetail.tsx`**:
- Estado real con 3 niveles:
  - 🟢 **En línea** — `last_seen_at` < 2 min
  - 🟡 **Inestable** — entre 2 y 5 min
  - 🔴 **Desconectada** — > 5 min o nunca
- Mostrar `app_version` y `device_model` en el detalle.
- Mostrar "Última señal: hace X min".

**Nuevo botón "Acciones remotas"** en `ScreenDetail.tsx`:
- Recargar contenido
- Reiniciar app
- Forzar resincronización

Cada acción inserta una fila en `screen_commands` y muestra toast "Enviado, se ejecutará en <60s".

### 6. Cambios de schema (migración)
Solo una columna nueva, todo lo demás ya existe:
```sql
ALTER TABLE devices ADD COLUMN IF NOT EXISTS heartbeat_token text;
CREATE INDEX IF NOT EXISTS idx_screens_last_seen ON screens(last_seen_at);
CREATE INDEX IF NOT EXISTS idx_screen_commands_pending 
  ON screen_commands(screen_id, status) WHERE status='pending';
```

---

## Detalles técnicos

**Seguridad heartbeat**: el endpoint es público pero valida `device_code` contra `devices`. Si el código no existe → 404. Sin RLS porque la APK no tiene sesión, pero solo puede actualizar SU propia pantalla (la edge function fija el `screen_id` server-side).

**Sin breaking changes**: las pantallas existentes que no manden heartbeat simplemente quedarán como 🔴 desconectadas hasta que actualices la APK. La APK vieja sigue funcionando (solo no reporta estado real).

**APK update**: requiere recompilar y resubir el APK al bucket `downloads`. Los Fire TV existentes pueden seguir con la versión vieja; el nuevo heartbeat es opt-in por versión.

**Costo realtime**: 0. Usamos polling cada 60s (HTTP), no Supabase Realtime. Esto escala mejor que websockets para >100 pantallas.

---

## Archivos a crear/modificar

**Nuevos:**
- `supabase/functions/device-heartbeat/index.ts`
- `supabase/functions/mark-offline-screens/index.ts`
- `src/components/digital-signage/RemoteActionsPanel.tsx`
- Migración SQL (índices + columna)

**Modificados:**
- `src/pages/Player.tsx` — añadir loop de heartbeat
- `src/components/digital-signage/ScreenCard.tsx` — 3 estados de salud
- `src/pages/digital-signage/ScreenDetail.tsx` — panel de acciones remotas + info técnica
- `supabase/config.toml` — registrar funciones públicas y cron
- `firetv-apk/app/src/main/java/com/visualia/firetv/MainActivity.kt` — JavascriptInterface + watchdog
- `firetv-apk/README.md` — bump de versión a 1.1.0

---

## Lo que NO incluye (queda para fase 2)
- Captura de screenshot remota (necesita más trabajo)
- OTA auto-update del APK
- Lock Task Mode (modo device-owner)
- Migración a CDN externo para videos

¿Aprobás y arrancamos?
