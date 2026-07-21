package media.visualia.tv.pairing

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.tv.material3.MaterialTheme
import androidx.tv.material3.Text
import androidx.lifecycle.viewmodel.compose.viewModel

data class PairedResult(val token: String, val deviceId: String, val screenId: String)

/**
 * Full-screen Apple-TV-style pairing display: brand mark, the 6-digit code
 * broken into six tiles, a short instruction line, and an ambient hint.
 */
@Composable
fun PairingScreen(
    onPaired: (PairedResult) -> Unit,
    vm: PairingViewModel = viewModel(),
) {
    val state by vm.state.collectAsState()

    LaunchedEffect(Unit) { vm.start() }
    LaunchedEffect(state.paired) {
        state.paired?.let(onPaired)
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF06000F)),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
        ) {
            Text(
                text = "Conecta esta pantalla a Visualia",
                color = Color.White.copy(alpha = 0.9f),
                fontSize = 32.sp,
                fontWeight = FontWeight.Medium,
            )
            Spacer(Modifier.height(12.dp))
            Text(
                text = "Escribe este código en tu panel web:",
                color = Color.White.copy(alpha = 0.6f),
                fontSize = 20.sp,
            )
            Spacer(Modifier.height(48.dp))

            Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                val code = state.code ?: "------"
                code.padEnd(6, ' ').take(6).forEach { ch ->
                    Box(
                        modifier = Modifier
                            .size(width = 96.dp, height = 128.dp)
                            .clip(RoundedCornerShape(20.dp))
                            .background(Color(0xFF1A0B33)),
                        contentAlignment = Alignment.Center,
                    ) {
                        Text(
                            text = if (ch == ' ') "•" else ch.toString(),
                            color = Color(0xFFB794F6),
                            fontSize = 72.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace,
                        )
                    }
                }
            }

            Spacer(Modifier.height(48.dp))
            Text(
                text = state.hint,
                color = Color.White.copy(alpha = 0.55f),
                fontSize = 18.sp,
            )
        }
    }
}
