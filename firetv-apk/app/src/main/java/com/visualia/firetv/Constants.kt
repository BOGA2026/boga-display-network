package com.visualia.firetv

object Constants {
    const val PLAYER_BASE_URL = "https://visualiamedia.com/player/"
    const val HEARTBEAT_URL = "https://ovuhtroiuuqsiltqgqpp.supabase.co/functions/v1/screen-heartbeat"
    const val HEARTBEAT_INTERVAL_MS = 60_000L // 60s
    const val APP_VERSION = "1.0.0"
    const val PREFS_NAME = "visualia_prefs"
    const val KEY_DEVICE_CODE = "device_code"

    // Combo de teclas para salir del kiosko: MENU + REWIND mantenidos 5s
    const val EXIT_HOLD_MS = 5000L
}

