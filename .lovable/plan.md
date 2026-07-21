
# Conexión remota de pantallas — plan de construcción

Este proyecto ya tiene la base: tabla `devices` con `device_code` + `heartbeat_token`, edge function `pair-device` con rate limit por IP, tabla `screen_commands` con Realtime, y un sheet de emparejamiento en `Screens.tsx`. El trabajo consiste en cerrar los huecos que faltan y agregar la app de TV como proyecto separado.

## 1. App de TV — decisión de stack

**Elección: Kotlin + Jetpack Compose for TV** (proyecto Android nativo en `apps/tv-player/`).

Justificación (3 líneas):
- Fire TV, Android TV, Google TV y TV Boxes genéricos son todos Android — un solo APK cubre 100% del parque objetivo (React Native TV requiere fork no oficial y no cubre Fire TV bien).
- Compose for TV da foco con D-pad, overscan y leanback nativos sin polyfills, y Kotlin compila a un APK de <10 MB apto para TV Boxes con 1 GB de RAM.
- Ya se distribuye APK firmado desde `/descargar-apk` con SHA-256 verificado — mantenemos el pipeline existente.

Módulos del APK (a crear en `apps/tv-player/`):
```
apps/tv-player/
├── app/
│   ├── build.gradle.kts
│   └── src/main/
│       ├── AndroidManifest.xml          # LEANBACK_LAUNCHER, INTERNET, WAKE_LOCK
│       └── java/media/visualia/tv/
│           ├── MainActivity.kt          # Compose entry, mantiene pantalla despierta
│           ├── pairing/
│           │   ├── PairingScreen.kt     # Código 6 dígitos fullscreen tipo Apple TV
│           │   └── PairingViewModel.kt  # llama pair-device/register, poll status
│           ├── player/
│           │   ├── PlayerScreen.kt      # ExoPlayer + capa de imágenes/menús
│           │   └── PlaylistEngine.kt    # cola, transiciones, offline cache
│           ├── net/
│           │   ├── RealtimeClient.kt    # Supabase Realtime WS + backoff exponencial
│           │   ├── HeartbeatWorker.kt   # WorkManager cada 30s
│           │   └── CommandHandler.kt    # reboot / force_sync / change_content
│           └── storage/
│               ├── ContentCache.kt      # Room + DataStore + File cache LRU 2 GB
│               └── SecureStore.kt       # heartbeat_token en EncryptedSharedPreferences
└── README.md                            # instrucciones de build y sideload
```

Comportamiento:
- **Primer arranque**: genera código local de 6 dígitos numéricos (crypto seguro), lo envía a `pair-device/register`, muestra fullscreen. Reintenta polling a `pair-device/status?code=` cada 3 s. Código expira a los 10 min → regenera.
- **Post-emparejamiento**: guarda `heartbeat_token` cifrado, abre canal Realtime `device:{id}`, suscribe a `screen_commands` (INSERT filter `device_id=eq.{id}`).
- **Offline**: `ContentCache` reproduce lo último válido; reconexión con backoff `min(2^n, 60s) + jitter`.
- **Heartbeat**: `HeartbeatWorker` cada 30 s → `pair-device/checkin` con `{ token, network_type, timestamp, app_version, resolution, downstream_kbps }`.

## 2. Backend — cambios sobre lo existente

Cambios menores porque ya está el 70%:

**Migración nueva** (una sola):
- Agregar a `devices`: `ip inet`, `network_type text`, `resolution text`, `paired_at timestamptz`, `code_expires_at timestamptz` (10 min desde creación), `latitude`/`longitude` (si no existen). Migrar `device_code` a numérico 6 dígitos para códigos generados por la TV, manteniendo alfanumérico para códigos generados por el panel (columna `code_source text check in ('tv','panel')`).
- Nueva tabla `pairing_attempts` (id, ip, device_code_attempted, tenant_id_target, success bool, reason text, created_at) — audita cada intento. RLS: solo platform_admin lee; INSERT vía service_role desde edge function.
- GRANTs correctos + índice por `ip` + `created_at`.
- Habilitar Realtime en `devices` (`ALTER PUBLICATION supabase_realtime ADD TABLE public.devices`).

**Edge function `pair-device` — extender rutas ya existentes**:
- `POST /pair-device/register` (existe): la TV publica su código; se persiste con `status='pending'`, `code_expires_at = now() + 10 min`. Rate limit endurecido (10/min por IP).
- `POST /pair-device/claim` (nuevo, requiere JWT): el panel reclama el código para su `business_id`. Valida expiración, marca `paired`, emite `heartbeat_token = gen_random_uuid()`, invalida el código (`device_code = null` tras uso). Registra en `pairing_attempts` con `success=true/false`.
- `GET /pair-device/status?code=XXXXXX` (nuevo): la TV consulta si ya fue reclamado, y si sí recibe `{ id, heartbeat_token, business_id }` **una sola vez** (el token no se vuelve a exponer). Rate limit 60/min por IP.
- `POST /pair-device/checkin` (existe): heartbeat, valida `heartbeat_token`, actualiza `last_seen_at`, `ip`, `network_type`, `resolution`, `status='online'`.
- **Seguridad clave**: en `claim` la función valida que el `business_id` en el JWT coincide con quien tiene permiso; jamás se acepta un `business_id` arbitrario del body. Fuerza bruta detectada si `pairing_attempts` supera N intentos fallidos por IP en 10 min → bloquea IP en RAM y devuelve 429.

**Cron `mark-offline-screens`** (existe): pasa a marcar `status='offline'` si `now() - last_seen_at > 90 s`.

## 3. Dashboard web — `src/features/pairing/`

Nueva estructura, aprovechando el sheet existente:
```
src/features/pairing/
├── components/
│   ├── PairDeviceModal.tsx     # 6 inputs numéricos, auto-avance, paste, feedback éxito animado
│   ├── CodeInput.tsx           # celda individual con caret y neón violeta
│   └── PairingSuccess.tsx      # check animado + nombre asignable
├── hooks/
│   ├── useDeviceStatus.ts      # supabase.channel + postgres_changes UPDATE en devices → online|offline|syncing
│   └── usePairDevice.ts        # invoca pair-device/claim, maneja errores (expirado, ya usado, no encontrado)
└── index.ts
```

- `PairDeviceModal.tsx`: 6 casillas independientes, cada dígito solo `[0-9]`, auto-avanza `onChange`, retrocede con Backspace vacío, acepta pegar código completo, valida en vivo, muestra spinner "Verificando…" y luego animación de check verde con confetti sutil.
- `useDeviceStatus(deviceId)`: `useEffect` con `supabase.channel(`device-status-${deviceId}`)`, listener `postgres_changes` sobre `devices`; expone `{ status: 'online'|'offline'|'syncing', lastSeenAt }` derivado de `last_seen_at` y comandos pendientes. Cleanup con `removeChannel`.
- Integración: `Screens.tsx` gana un botón secundario "Ya vi el código en mi TV" que abre `PairDeviceModal` (flujo inverso al actual). El flujo actual "genera código desde el panel" se mantiene para usuarios sin app instalada.

## 4. Flujo de emparejamiento (Mermaid)

```text
sequenceDiagram
  participant TV as App TV
  participant EF as Edge fn pair-device
  participant DB as Supabase DB
  participant WEB as Dashboard web

  TV->>TV: primer arranque, genera código 6 dígitos
  TV->>EF: POST /register {code, app_version}
  EF->>DB: INSERT devices(code, status=pending, expires=+10m)
  TV->>TV: muestra código fullscreen
  loop cada 3s hasta claim o expira
    TV->>EF: GET /status?code=XXXXXX
    EF-->>TV: 204 not_claimed
  end
  WEB->>WEB: usuario abre PairDeviceModal, teclea código
  WEB->>EF: POST /claim {code} (JWT del panel)
  EF->>DB: valida expiración + registra pairing_attempts
  EF->>DB: UPDATE devices SET business_id, paired_at, heartbeat_token, code=null
  EF-->>WEB: 200 {device_id}
  TV->>EF: GET /status?code=XXXXXX (última vez)
  EF-->>TV: 200 {id, heartbeat_token}
  TV->>TV: guarda token cifrado, abre canal Realtime
```

## 5. Flujo heartbeat / online-offline

```text
flowchart LR
  A[TV WorkManager 30s] -->|POST /checkin token+meta| B[Edge fn]
  B -->|UPDATE devices last_seen, status=online| C[(devices)]
  C -->|Realtime postgres_changes| D[useDeviceStatus en dashboard]
  D --> E[Badge En vivo pulsa]
  F[Cron mark-offline-screens 60s] -->|last_seen > 90s| C
  C -->|Realtime UPDATE status=offline| D
```

## Orden de entrega en este repo

1. Migración (extender `devices`, crear `pairing_attempts`, habilitar Realtime).
2. Extender `supabase/functions/pair-device/index.ts` con `claim` y `status`, más detección de fuerza bruta.
3. Crear `src/features/pairing/` con `PairDeviceModal`, `CodeInput`, `useDeviceStatus`, `usePairDevice`.
4. Enganchar el modal en `Screens.tsx` (botón "Ya tengo la app abierta en mi TV").
5. Andamiaje `apps/tv-player/` con README, `MainActivity.kt`, `PairingScreen.kt`, `RealtimeClient.kt` y `HeartbeatWorker.kt` como referencia funcional mínima (build real queda fuera del sandbox Vite).

¿Apruebas este plan y arranco por la migración?
