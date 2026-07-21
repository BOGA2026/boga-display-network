package media.visualia.tv.pairing

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import media.visualia.tv.BuildConfig
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.security.SecureRandom
import java.util.concurrent.TimeUnit

data class PairingUiState(
    val code: String? = null,
    val hint: String = "Abre tu panel en visualiamedia.com y toca “Ya tengo la app en mi TV”.",
    val paired: PairedResult? = null,
)

/**
 * Generates a 6-digit code, registers it with pair-device/register, then polls
 * pair-device/status every 3 s. Regenerates on 10-minute expiration.
 */
class PairingViewModel : ViewModel() {

    private val _state = MutableStateFlow(PairingUiState())
    val state = _state.asStateFlow()

    private val http = OkHttpClient.Builder()
        .callTimeout(10, TimeUnit.SECONDS)
        .build()
    private val json = Json { ignoreUnknownKeys = true }

    private val fnUrl = "${BuildConfig.SUPABASE_URL}/functions/v1/pair-device"
    private val anonKey = BuildConfig.SUPABASE_ANON_KEY

    fun start() {
        viewModelScope.launch { loop() }
    }

    private suspend fun loop() {
        while (state.value.paired == null) {
            val code = generateCode()
            _state.value = _state.value.copy(code = code)
            val ok = withContext(Dispatchers.IO) { register(code) }
            if (!ok) {
                delay(5_000)
                continue
            }
            val start = System.currentTimeMillis()
            while (System.currentTimeMillis() - start < 10 * 60_000) {
                delay(3_000)
                val paired = withContext(Dispatchers.IO) { pollStatus(code) }
                if (paired != null) {
                    _state.value = _state.value.copy(paired = paired)
                    return
                }
            }
            // Expired → outer loop regenerates
        }
    }

    private fun generateCode(): String {
        val rng = SecureRandom()
        val sb = StringBuilder(6)
        repeat(6) { sb.append(rng.nextInt(10)) }
        return sb.toString()
    }

    @Serializable
    private data class RegisterBody(val device_code: String, val app_version: String, val resolution: String, val network_type: String)

    private fun register(code: String): Boolean {
        val body = json.encodeToString(
            RegisterBody.serializer(),
            RegisterBody(code, BuildConfig.VERSION_NAME, "1920x1080", "wifi"),
        ).toRequestBody("application/json".toMediaType())
        val req = Request.Builder()
            .url("$fnUrl/register")
            .header("apikey", anonKey)
            .header("Authorization", "Bearer $anonKey")
            .post(body).build()
        return try {
            http.newCall(req).execute().use { it.isSuccessful }
        } catch (_: Exception) { false }
    }

    @Serializable
    private data class StatusResp(
        val status: String? = null,
        val device_id: String? = null,
        val screen_id: String? = null,
        val heartbeat_token: String? = null,
    )

    private fun pollStatus(code: String): PairedResult? {
        val req = Request.Builder()
            .url("$fnUrl/status?code=$code")
            .header("apikey", anonKey)
            .header("Authorization", "Bearer $anonKey")
            .get().build()
        return try {
            http.newCall(req).execute().use { resp ->
                if (resp.code == 410) return null // expired handled by outer loop
                if (!resp.isSuccessful) return null
                val parsed = json.decodeFromString(StatusResp.serializer(), resp.body?.string() ?: "")
                if (parsed.status == "paired" && parsed.heartbeat_token != null && parsed.device_id != null && parsed.screen_id != null) {
                    PairedResult(parsed.heartbeat_token, parsed.device_id, parsed.screen_id)
                } else null
            }
        } catch (_: Exception) { null }
    }
}
