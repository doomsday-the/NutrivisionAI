package com.nutrivision.companion

import android.content.Context
import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.ActivityResultLauncher
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.DirectionsRun
import androidx.compose.material.icons.filled.LocalFireDepartment
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.health.connect.client.PermissionController
import com.nutrivision.companion.theme.*
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {

    private lateinit var healthConnectManager: HealthConnectManager
    private val syncService = SyncService()
    private lateinit var requestPermissionsLauncher: ActivityResultLauncher<Set<String>>
    private var tokenState = mutableStateOf("")

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        healthConnectManager = HealthConnectManager(this)

        val requestPermissionsContract = PermissionController.createRequestPermissionResultContract()
        requestPermissionsLauncher = registerForActivityResult(requestPermissionsContract) { _ -> }

        val prefs = getSharedPreferences("nutrivision_prefs", Context.MODE_PRIVATE)
        val deepLinkToken = extractTokenFromIntent(intent)
        if (!deepLinkToken.isNullOrBlank()) {
            prefs.edit().putString("auth_token", deepLinkToken).apply()
            tokenState.value = deepLinkToken
        } else {
            tokenState.value = prefs.getString("auth_token", "") ?: ""
        }

        val savedUrl = prefs.getString("backend_url", syncService.defaultBaseUrl) ?: syncService.defaultBaseUrl

        setContent {
            NutriVisionTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = Slate900
                ) {
                    SyncDashboardScreen(
                        healthConnectManager = healthConnectManager,
                        syncService = syncService,
                        initialToken = tokenState.value,
                        initialBaseUrl = savedUrl,
                        onRequestPermissions = {
                            requestPermissionsLauncher.launch(healthConnectManager.permissions)
                        },
                        onSavePrefs = { token, url ->
                            tokenState.value = token
                            prefs.edit()
                                .putString("auth_token", token)
                                .putString("backend_url", url)
                                .apply()
                        }
                    )
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        val deepLinkToken = extractTokenFromIntent(intent)
        if (!deepLinkToken.isNullOrBlank()) {
            val prefs = getSharedPreferences("nutrivision_prefs", Context.MODE_PRIVATE)
            prefs.edit().putString("auth_token", deepLinkToken).apply()
            tokenState.value = deepLinkToken
        }
    }

    private fun extractTokenFromIntent(intent: Intent?): String? {
        val data = intent?.data ?: return null
        if (data.scheme == "nutrivision" && data.host == "connect") {
            return data.getQueryParameter("token")
        }
        return null
    }
}

@Composable
fun NutriVisionTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = darkColorScheme(
            primary = Emerald500,
            secondary = Emerald600,
            background = Slate900,
            surface = Slate800,
            onPrimary = Color.White,
            onBackground = Slate50,
            onSurface = Slate50
        ),
        content = content
    )
}

@Composable
fun SyncDashboardScreen(
    healthConnectManager: HealthConnectManager,
    syncService: SyncService,
    initialToken: String,
    initialBaseUrl: String,
    onRequestPermissions: () -> Unit,
    onSavePrefs: (String, String) -> Unit
) {
    val coroutineScope = rememberCoroutineScope()
    val scrollState = rememberScrollState()

    var token by remember { mutableStateOf(initialToken) }
    var baseUrl by remember { mutableStateOf(initialBaseUrl) }
    var metrics by remember { mutableStateOf(HealthMetrics(0, 0.0, "")) }
    var hasPermissions by remember { mutableStateOf(false) }
    var isLoadingMetrics by remember { mutableStateOf(false) }
    var isPushing by remember { mutableStateOf(false) }
    var statusMessage by remember { mutableStateOf<String?>(null) }
    var isSuccess by remember { mutableStateOf(false) }

    LaunchedEffect(initialToken) {
        token = initialToken
    }

    fun refreshMetrics() {
        coroutineScope.launch {
            isLoadingMetrics = true
            hasPermissions = healthConnectManager.hasAllPermissions()
            if (hasPermissions) {
                metrics = healthConnectManager.readTodayMetrics()
            }
            isLoadingMetrics = false
        }
    }

    LaunchedEffect(Unit) {
        refreshMetrics()
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(20.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // App Title
        Text(
            text = "🥗 NutriVision Sync",
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold,
            color = Emerald400
        )
        Text(
            text = "Samsung Health On-Demand Web Bridge",
            fontSize = 13.sp,
            color = Slate400,
            modifier = Modifier.padding(top = 2.dp, bottom = 20.dp)
        )

        // Health Connect Permissions Banner if not yet granted
        if (!hasPermissions) {
            Card(
                colors = CardDefaults.cardColors(containerColor = Slate800),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 16.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Security,
                            contentDescription = null,
                            tint = Emerald400,
                            modifier = Modifier.size(24.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Samsung Health Link Required",
                            fontWeight = FontWeight.SemiBold,
                            color = Slate50
                        )
                    }
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "Allow NutriVision to read steps and active energy from Health Connect.",
                        fontSize = 12.sp,
                        color = Slate400
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Button(
                        onClick = {
                            onRequestPermissions()
                            refreshMetrics()
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = Emerald600),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("Grant Health Permission")
                    }
                }
            }
        }

        // Live Today Metrics Card
        Card(
            colors = CardDefaults.cardColors(containerColor = Slate800),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 20.dp)
        ) {
            Column(modifier = Modifier.padding(18.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "TODAY'S METRICS",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = Emerald400,
                        letterSpacing = 1.sp
                    )
                    IconButton(
                        onClick = { refreshMetrics() },
                        modifier = Modifier.size(28.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Refresh,
                            contentDescription = "Refresh",
                            tint = Slate400
                        )
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceAround
                ) {
                    // Steps Counter
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(
                            imageVector = Icons.Default.DirectionsRun,
                            contentDescription = "Steps",
                            tint = Emerald400,
                            modifier = Modifier.size(32.dp)
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = if (isLoadingMetrics) "..." else "%,d".format(metrics.steps),
                            fontSize = 24.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = Slate50
                        )
                        Text(
                            text = "Steps Walked",
                            fontSize = 12.sp,
                            color = Slate400
                        )
                    }

                    // Active Calories Burned
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(
                            imageVector = Icons.Default.LocalFireDepartment,
                            contentDescription = "Calories",
                            tint = Coral,
                            modifier = Modifier.size(32.dp)
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = if (isLoadingMetrics) "..." else "${metrics.caloriesBurned}",
                            fontSize = 24.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = Slate50
                        )
                        Text(
                            text = "kcal Burned",
                            fontSize = 12.sp,
                            color = Slate400
                        )
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))
                HorizontalDivider(color = Slate700)
                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = "Source: Samsung Health via Health Connect",
                    fontSize = 11.sp,
                    color = Slate400,
                    modifier = Modifier.align(Alignment.CenterHorizontally)
                )
            }
        }

        // PUSH BUTTON (Main Action)
        Button(
            onClick = {
                if (token.isBlank()) {
                    statusMessage = "Please authenticate your account below."
                    isSuccess = false
                    return@Button
                }
                isPushing = true
                statusMessage = null
                coroutineScope.launch {
                    val result = syncService.pushActivitySync(baseUrl, token, metrics)
                    isPushing = false
                    result.onSuccess { msg ->
                        statusMessage = msg
                        isSuccess = true
                    }.onFailure { err ->
                        statusMessage = err.localizedMessage ?: "Sync failed"
                        isSuccess = false
                    }
                }
            },
            enabled = !isPushing && !isLoadingMetrics,
            colors = ButtonDefaults.buttonColors(
                containerColor = Emerald500,
                disabledContainerColor = Slate700
            ),
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp)
        ) {
            if (isPushing) {
                CircularProgressIndicator(
                    color = Color.White,
                    modifier = Modifier.size(24.dp),
                    strokeWidth = 2.dp
                )
                Spacer(modifier = Modifier.width(10.dp))
                Text("Pushing to Web...", fontSize = 16.sp, fontWeight = FontWeight.Bold)
            } else {
                Icon(imageVector = Icons.Default.Send, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "PUSH TO NUTRIVISION WEB",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        // Status Feedback Alert
        statusMessage?.let { msg ->
            Spacer(modifier = Modifier.height(14.dp))
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(10.dp))
                    .background(if (isSuccess) Emerald600.copy(alpha = 0.2f) else Coral.copy(alpha = 0.2f))
                    .padding(12.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    if (isSuccess) {
                        Icon(
                            imageVector = Icons.Default.CheckCircle,
                            contentDescription = null,
                            tint = Emerald400,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = msg,
                        fontSize = 12.sp,
                        color = if (isSuccess) Emerald400 else Coral
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(28.dp))

        // Account Link / Auth Config
        Card(
            colors = CardDefaults.cardColors(containerColor = Slate800),
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Text(
                    text = "Account Connection",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = Slate200
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = if (token.isNotBlank()) "✓ Account paired to NutriVision!" else "Not paired yet. Tap below or link from website.",
                    fontSize = 12.sp,
                    color = if (token.isNotBlank()) Emerald400 else Slate400
                )
                Spacer(modifier = Modifier.height(10.dp))

                // Dev Bypass One-Click Login
                OutlinedButton(
                    onClick = {
                        coroutineScope.launch {
                            val res = syncService.devBypassLogin(baseUrl)
                            res.onSuccess { t ->
                                token = t
                                onSavePrefs(token, baseUrl)
                                statusMessage = "Paired with your NutriVision account!"
                                isSuccess = true
                            }.onFailure { e ->
                                statusMessage = "Login error: ${e.localizedMessage}"
                                isSuccess = false
                            }
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = Emerald400)
                ) {
                    Text("Auto Pair Account (Instant)")
                }
            }
        }
    }
}
