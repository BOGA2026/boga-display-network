package media.visualia.tv.storage

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

/**
 * Persists heartbeat_token + device/screen ids in EncryptedSharedPreferences,
 * so the token never lives in plain text on disk and never appears in backups.
 */
class SecureStore(context: Context) {

    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val prefs = EncryptedSharedPreferences.create(
        context,
        "visualia_secure",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
    )

    fun heartbeatToken(): String? = prefs.getString(KEY_TOKEN, null)
    fun deviceId(): String? = prefs.getString(KEY_DEVICE, null)
    fun screenId(): String? = prefs.getString(KEY_SCREEN, null)

    fun savePairing(token: String, deviceId: String, screenId: String) {
        prefs.edit()
            .putString(KEY_TOKEN, token)
            .putString(KEY_DEVICE, deviceId)
            .putString(KEY_SCREEN, screenId)
            .apply()
    }

    fun clear() { prefs.edit().clear().apply() }

    companion object {
        private const val KEY_TOKEN = "heartbeat_token"
        private const val KEY_DEVICE = "device_id"
        private const val KEY_SCREEN = "screen_id"
    }
}
