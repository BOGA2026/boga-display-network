package media.visualia.tv

import android.os.Bundle
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import media.visualia.tv.pairing.PairingScreen
import media.visualia.tv.player.PlayerScreen
import media.visualia.tv.storage.SecureStore

/**
 * Entry point. Keeps the TV awake and switches between two Compose destinations:
 *   - PairingScreen while we have no heartbeat token.
 *   - PlayerScreen once the TV has been claimed by a business.
 */
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        setContent {
            val store = remember { SecureStore(this) }
            var token by remember { mutableStateOf(store.heartbeatToken()) }

            if (token == null) {
                PairingScreen(
                    onPaired = { paired ->
                        store.savePairing(paired.token, paired.deviceId, paired.screenId)
                        token = paired.token
                    }
                )
            } else {
                PlayerScreen(token = token!!)
            }
        }
    }
}
