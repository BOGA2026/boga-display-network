package com.visualia.firetv

import android.content.Context
import android.net.wifi.WifiManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.text.format.Formatter
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.Executors

/**
 * Envía un POST a /functions/v1/screen-heartbeat cada 60s con
 * deviceCode, appVersion, deviceModel, osVersion e ipAddress.
 *
 * Permite al panel admin ver qué Fire TVs están online y con qué versión.
 */
class HeartbeatManager(
    private val context: Context,
    private val getDeviceCode: () -> String?,
) {
    private val handler = Handler(Looper.getMainLooper())
    private val executor = Executors.newSingleThreadExecutor()
    private var running = false

    private val tick = object : Runnable {
        override fun run() {
            sendHeartbeat()
            if (running) handler.postDelayed(this, Constants.HEARTBEAT_INTERVAL_MS)
        }
    }

    fun start() {
        if (running) return
        running = true
        // Primer ping a los 3s para no chocar con el load inicial
        handler.postDelayed(tick, 3000)
    }

    fun stop() {
        running = false
        handler.removeCallbacks(tick)
    }

    private fun sendHeartbeat() {
        val deviceCode = getDeviceCode()?.takeIf { it.isNotBlank() } ?: return
        executor.execute {
            try {
                val ip = getLocalIp()
                val body = JSONObject().apply {
                    put("deviceCode", deviceCode)
                    put("appVersion", Constants.APP_VERSION)
                    put("deviceModel", Build.MODEL ?: "")
                    put("osVersion", Build.VERSION.RELEASE ?: "")
                    if (ip != null) put("ipAddress", ip)
                }

                val url = URL(Constants.HEARTBEAT_URL)
                val conn = (url.openConnection() as HttpURLConnection).apply {
                    requestMethod = "POST"
                    setRequestProperty("Content-Type", "application/json")
                    doOutput = true
                    connectTimeout = 8000
                    readTimeout = 8000
                }
                conn.outputStream.use { it.write(body.toString().toByteArray()) }
                conn.inputStream.use { it.readBytes() }
                conn.disconnect()
            } catch (e: Exception) {
                // Silencioso: si falla, reintenta en el próximo tick
            }
        }
    }

    private fun getLocalIp(): String? = try {
        val wm = context.applicationContext.getSystemService(Context.WIFI_SERVICE) as? WifiManager
        wm?.connectionInfo?.ipAddress?.let { ip ->
            @Suppress("DEPRECATION")
            Formatter.formatIpAddress(ip)
        }
    } catch (_: Exception) {
        null
    }
}
