package com.visualia.firetv

import android.annotation.SuppressLint
import android.content.Context
import android.os.Build
import android.os.Bundle
import android.os.PowerManager
import android.text.InputFilter
import android.text.InputType
import android.view.KeyEvent
import android.view.View
import android.view.WindowManager
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.EditText
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import com.visualia.firetv.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private var wakeLock: PowerManager.WakeLock? = null
    private lateinit var heartbeat: HeartbeatManager

    // Para combo de salida: MENU + REWIND mantenidos 5s
    private var menuPressedAt: Long = 0
    private var rewindPressedAt: Long = 0

    @SuppressLint("SetJavaScriptEnabled", "WakelockTimeout")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        enableImmersiveMode()

        // Wake lock — mantener pantalla encendida
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
        wakeLock = pm.newWakeLock(
            PowerManager.SCREEN_BRIGHT_WAKE_LOCK or PowerManager.ON_AFTER_RELEASE,
            "Visualia::PlayerWakeLock"
        ).apply { acquire() }

        setupWebView()

        heartbeat = HeartbeatManager(applicationContext) { getDeviceCode() }

        val code = getDeviceCode()
        if (code.isNullOrBlank()) {
            askForDeviceCode()
        } else {
            loadPlayer(code)
            heartbeat.start()
        }
    }

    private fun enableImmersiveMode() {
        @Suppress("DEPRECATION")
        window.decorView.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                or View.SYSTEM_UI_FLAG_FULLSCREEN
                or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
        )
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        val ws: WebSettings = binding.webview.settings
        ws.javaScriptEnabled = true
        ws.domStorageEnabled = true
        ws.databaseEnabled = true
        ws.mediaPlaybackRequiresUserGesture = false
        ws.cacheMode = WebSettings.LOAD_DEFAULT
        ws.loadWithOverviewMode = true
        ws.useWideViewPort = true
        ws.allowContentAccess = true
        ws.allowFileAccess = true
        ws.userAgentString = ws.userAgentString + " VisualiaFireTV/1.0"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            ws.mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
        }

        binding.webview.setBackgroundColor(0xFF000000.toInt())
        binding.webview.webViewClient = object : WebViewClient() {
            override fun onReceivedError(view: WebView?, errorCode: Int, description: String?, failingUrl: String?) {
                // Reintentar a los 5s si falla la red
                view?.postDelayed({ view.reload() }, 5000)
            }
        }
        binding.webview.webChromeClient = WebChromeClient()
    }

    private fun loadPlayer(code: String) {
        val url = Constants.PLAYER_BASE_URL + code.trim().uppercase()
        binding.webview.loadUrl(url)
    }

    private fun getDeviceCode(): String? =
        getSharedPreferences(Constants.PREFS_NAME, Context.MODE_PRIVATE)
            .getString(Constants.KEY_DEVICE_CODE, null)

    private fun saveDeviceCode(code: String) {
        getSharedPreferences(Constants.PREFS_NAME, Context.MODE_PRIVATE)
            .edit().putString(Constants.KEY_DEVICE_CODE, code.trim().uppercase()).apply()
    }

    private fun askForDeviceCode() {
        val input = EditText(this).apply {
            inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_FLAG_CAP_CHARACTERS
            filters = arrayOf(InputFilter.LengthFilter(12), InputFilter.AllCaps())
            hint = "ABC123"
        }
        AlertDialog.Builder(this)
            .setTitle("Visualia — Código de pantalla")
            .setMessage("Ingresa el código de vinculación que aparece en el panel Visualia.")
            .setView(input)
            .setCancelable(false)
            .setPositiveButton("Conectar") { _, _ ->
                val code = input.text.toString().trim()
                if (code.isNotEmpty()) {
                    saveDeviceCode(code)
                    loadPlayer(code)
                    heartbeat.start()
                } else {
                    askForDeviceCode()
                }
            }
            .show()
    }

    private fun resetDeviceCode() {
        getSharedPreferences(Constants.PREFS_NAME, Context.MODE_PRIVATE)
            .edit().remove(Constants.KEY_DEVICE_CODE).apply()
        askForDeviceCode()
    }

    // ───── KIOSKO: bloquear Home, Back, etc. ─────
    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        val now = System.currentTimeMillis()
        when (keyCode) {
            KeyEvent.KEYCODE_MENU -> {
                if (menuPressedAt == 0L) menuPressedAt = now
            }
            KeyEvent.KEYCODE_MEDIA_REWIND -> {
                if (rewindPressedAt == 0L) rewindPressedAt = now
            }
            KeyEvent.KEYCODE_BACK,
            KeyEvent.KEYCODE_HOME -> return true // bloquear
        }

        // Combo MENU + REWIND mantenidos 5s → reset device code (admin)
        if (menuPressedAt > 0 && rewindPressedAt > 0) {
            val held = now - maxOf(menuPressedAt, rewindPressedAt)
            if (held >= Constants.EXIT_HOLD_MS) {
                menuPressedAt = 0
                rewindPressedAt = 0
                resetDeviceCode()
                return true
            }
        }
        return super.onKeyDown(keyCode, event)
    }

    override fun onKeyUp(keyCode: Int, event: KeyEvent?): Boolean {
        when (keyCode) {
            KeyEvent.KEYCODE_MENU -> menuPressedAt = 0
            KeyEvent.KEYCODE_MEDIA_REWIND -> rewindPressedAt = 0
        }
        return super.onKeyUp(keyCode, event)
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) enableImmersiveMode()
    }

    override fun onResume() {
        super.onResume()
        enableImmersiveMode()
        if (wakeLock?.isHeld == false) wakeLock?.acquire()
    }

    override fun onDestroy() {
        if (wakeLock?.isHeld == true) wakeLock?.release()
        binding.webview.destroy()
        super.onDestroy()
    }

    @Deprecated("Kiosko: deshabilitado")
    override fun onBackPressed() {
        // No-op: bloquear botón atrás
    }
}
