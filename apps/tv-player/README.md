# Visualia TV Player — Android / Fire TV / Google TV client

Native Android app that runs on Fire TV, Android TV, Google TV and generic TV Boxes.
Built with **Kotlin + Jetpack Compose for TV**.

## Why this stack

- One APK covers the entire target parc (Fire OS is Android under the hood).
- Compose for TV handles D-pad focus, overscan and leanback natively.
- Compiles to a <10 MB APK suitable for TV Boxes with 1 GB RAM.

## Backend endpoints used

All routes are on the Supabase edge function `pair-device`:

| Method | Path                                | Auth               | Purpose                                             |
| ------ | ----------------------------------- | ------------------ | --------------------------------------------------- |
| POST   | `/pair-device/register`             | anon key           | TV publishes its 6-digit code (expires in 10 min)   |
| GET    | `/pair-device/status?code=NNNNNN`   | anon key           | TV polls until the panel claims the code           |
| POST   | `/pair-device/checkin`              | heartbeat token    | Heartbeat every 30 s with network / resolution      |

Realtime channel `screen_commands` (filter `screen_id=eq.<id>`, INSERT) delivers
remote commands (`reboot`, `force_sync`, `change_content`, …).

## First-run pairing flow (client side)

```
1. Generate 6 random digits with SecureRandom.
2. POST /pair-device/register  {device_code, app_version, resolution, network_type}.
3. Show the code fullscreen.
4. Every 3 s: GET /pair-device/status?code=...
     - 200 { status: "awaiting_pairing" }  → keep waiting
     - 410 { status: "expired" }           → regenerate at step 1
     - 200 { status: "paired", heartbeat_token, device_id, screen_id }
           → store the token in EncryptedSharedPreferences, transition to Player.
5. Start HeartbeatWorker (30 s) and open the Realtime channel.
```

## File layout

```
apps/tv-player/
├── app/
│   ├── build.gradle.kts
│   └── src/main/
│       ├── AndroidManifest.xml
│       └── java/media/visualia/tv/
│           ├── MainActivity.kt
│           ├── pairing/
│           │   ├── PairingScreen.kt
│           │   └── PairingViewModel.kt
│           ├── player/
│           │   ├── PlayerScreen.kt
│           │   └── PlaylistEngine.kt
│           ├── net/
│           │   ├── RealtimeClient.kt
│           │   ├── HeartbeatWorker.kt
│           │   └── CommandHandler.kt
│           └── storage/
│               ├── ContentCache.kt
│               └── SecureStore.kt
└── README.md
```

## Manifest highlights

- `<category android:name="android.intent.category.LEANBACK_LAUNCHER" />` so it
  shows up on Android TV / Fire TV home rows.
- `android:banner="@drawable/tv_banner"` (320×180 for TV app grid).
- Permissions: `INTERNET`, `ACCESS_NETWORK_STATE`, `WAKE_LOCK`,
  `RECEIVE_BOOT_COMPLETED` (start on TV power on),
  `FOREGROUND_SERVICE` (heartbeat).
- `<uses-feature android:name="android.software.leanback" android:required="false" />`
- `<uses-feature android:name="android.hardware.touchscreen" android:required="false" />`

## Security notes

- Codes are 6 numeric digits, expire in 10 minutes, and are invalidated on
  successful claim on the server side.
- The `heartbeat_token` is returned by `/status` exactly once (the server
  wipes it from the row afterwards) and is stored in
  `EncryptedSharedPreferences`. Never log it.
- The server records every claim attempt in `pairing_attempts`. After 8
  failed attempts from the same IP in 10 minutes, further claims from that
  IP are rate-limited server-side.

## Distribution

Signed APK is served from `https://visualiamedia.com/descargar-apk` with the
`Content-Type: application/vnd.android.package-archive` header and a SHA-256
integrity hash published on the same page.
