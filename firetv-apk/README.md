# Visualia Fire TV Player (APK)

APK ligera tipo WebView que carga el player web de Visualia (`https://visualiamedia.com/player/{deviceId}`) en modo **kiosko** sobre Fire TV (Stick / Cube / Smart TV con Fire OS).

## ✨ Features incluidas

- ✅ **Auto-arranque** al encender el Fire TV (`BOOT_COMPLETED`)
- ✅ **Modo kiosko real**: bloquea botón Home, Back y Menú del control remoto
- ✅ **Wake lock**: la pantalla nunca se apaga
- ✅ **Pantalla completa inmersiva** (sin barras de sistema)
- ✅ **WebView con video, audio y autoplay** habilitado
- ✅ **Persistencia del Device ID** (se pide solo la primera vez, luego siempre el mismo)
- ✅ **Reconexión automática** si pierde internet
- ✅ Updates instantáneos del contenido (al cambiar el web, todos los Fire TV se actualizan sin reinstalar APK)

---

## 🛠 Cómo generar la APK

### Requisitos
- [Android Studio](https://developer.android.com/studio) (Hedgehog o superior)
- JDK 17+ (incluido en Android Studio)

### Pasos
1. Abre Android Studio → **Open** → selecciona la carpeta `firetv-apk/`.
2. Espera a que Gradle sincronice (~2-5 min la primera vez).
3. Menú **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
4. La APK firmada en debug se genera en:
   `firetv-apk/app/build/outputs/apk/debug/app-debug.apk`

### Para producción (APK firmada)
1. **Build → Generate Signed Bundle / APK → APK**
2. Crea un keystore (guárdalo bien, lo necesitarás para futuras updates)
3. Selecciona variant **release** → Finish
4. APK final: `app/build/outputs/apk/release/app-release.apk`

---

## 📲 Instalar en Fire TV (Sideload)

### Método 1: Downloader app (recomendado)
1. En el Fire TV: **Settings → My Fire TV → Developer Options → Install unknown apps → Downloader: ON**
2. Sube `app-release.apk` a Google Drive / Dropbox / tu servidor y obtén un **link directo** (.apk).
3. En el Fire TV abre la app **Downloader** → pega el link → Go.
4. Cuando descargue, te pregunta si instalar → **Install**.
5. Abrir → te pedirá el **código de dispositivo** (ej: `ABC123`) la primera vez.

### Método 2: ADB (para desarrollo)
```bash
adb connect <IP_DEL_FIRE_TV>:5555
adb install -r app/build/outputs/apk/release/app-release.apk
```

---

## 🔑 Primer arranque

1. La app abre y muestra una pantalla pidiendo el **Device Code**.
2. Ingresa el mismo código que registraste en el panel Visualia (ej: `ACME01`).
3. La app guarda el código y a partir de ahí siempre carga directamente:
   `https://visualiamedia.com/player/ACME01`
4. Para cambiar el código: mantén presionado **MENU** del control 5 segundos → vuelve a la pantalla de pairing.

---

## 🚪 Cómo salir del modo kiosko (admin)

Para desinstalar o salir necesitas:
- Mantener presionados **simultáneamente** los botones **MENU + REWIND** durante 5 segundos.
- O desinstalar desde Settings → Applications → Visualia Player → Uninstall (requiere salir primero).

---

## 🌐 URL del player

Por defecto la app apunta a:
```
https://visualiamedia.com/player/{deviceCode}
```

Para cambiarla, edita `app/src/main/java/com/visualia/firetv/Constants.kt`:
```kotlin
const val PLAYER_BASE_URL = "https://visualiamedia.com/player/"
```
