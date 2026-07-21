package media.visualia.tv.net

import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlin.math.min
import kotlin.random.Random

/**
 * Persistent WebSocket to Supabase Realtime with exponential backoff
 * (min(2^n, 60s) + jitter). Reopens on drop; consumer receives commands
 * via `onCommand`. Simplified — real impl uses the Supabase Kotlin SDK.
 */
class RealtimeClient(
    private val supabaseUrl: String,
    private val anonKey: String,
    private val screenId: String,
    private val onCommand: (command: String, payload: String) -> Unit,
) {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private var job: Job? = null

    fun connect() {
        job?.cancel()
        job = scope.launch {
            var attempt = 0
            while (isActive) {
                try {
                    // Open channel `screen-commands-{screenId}` filtered by INSERT
                    // on screen_commands where screen_id=eq.{screenId}.
                    // Consumer implementation lives in the Supabase realtime-kt SDK.
                    Log.i(TAG, "opening realtime channel for $screenId")
                    // realtimeClient.channel("screen-commands-$screenId")
                    //     .on(RealtimePostgresListenTypes.INSERT, filter) { event ->
                    //         onCommand(event.record["command"], event.record["payload"])
                    //     }.subscribe().awaitCompletion()
                    attempt = 0
                } catch (e: Exception) {
                    val delayMs = min(1L shl attempt, 60L) * 1000L + Random.nextLong(0, 1000)
                    Log.w(TAG, "realtime dropped, reconnecting in ${delayMs}ms", e)
                    delay(delayMs)
                    attempt = (attempt + 1).coerceAtMost(6)
                }
            }
        }
    }

    fun close() { job?.cancel(); job = null }

    private val kotlinx.coroutines.CoroutineScope.isActive: Boolean
        get() = this.coroutineContext[Job]?.isActive == true

    companion object { private const val TAG = "RealtimeClient" }
}
