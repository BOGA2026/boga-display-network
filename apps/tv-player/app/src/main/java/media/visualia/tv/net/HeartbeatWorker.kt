package media.visualia.tv.net

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import media.visualia.tv.BuildConfig
import media.visualia.tv.storage.SecureStore
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

/**
 * Runs every 30 s via WorkManager. Sends heartbeat + metadata to
 * pair-device/checkin so the panel sees the pantalla online in real time.
 */
class HeartbeatWorker(ctx: Context, params: WorkerParameters) : CoroutineWorker(ctx, params) {

    private val http = OkHttpClient.Builder()
        .callTimeout(15, TimeUnit.SECONDS)
        .build()
    private val json = Json { ignoreUnknownKeys = true }
    private val store = SecureStore(applicationContext)

    @Serializable
    private data class CheckinBody(
        val heartbeat_token: String,
        val app_version: String,
        val resolution: String,
        val network_type: String,
        val timestamp: Long,
    )

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        val token = store.heartbeatToken() ?: return@withContext Result.success()
        val body = json.encodeToString(
            CheckinBody.serializer(),
            CheckinBody(
                heartbeat_token = token,
                app_version = BuildConfig.VERSION_NAME,
                resolution = "1920x1080",
                network_type = "wifi",
                timestamp = System.currentTimeMillis(),
            )
        ).toRequestBody("application/json".toMediaType())
        val req = Request.Builder()
            .url("${BuildConfig.SUPABASE_URL}/functions/v1/pair-device/checkin")
            .header("apikey", BuildConfig.SUPABASE_ANON_KEY)
            .header("Authorization", "Bearer ${BuildConfig.SUPABASE_ANON_KEY}")
            .post(body).build()
        try {
            http.newCall(req).execute().use { resp ->
                if (resp.isSuccessful) Result.success() else Result.retry()
            }
        } catch (_: Exception) {
            Result.retry()
        }
    }
}
