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
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
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
    private var emailState = mutableStateOf("")

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
        emailState.value = prefs.getString("user_email", "aryaman.sinha.lko@gmail.com") ?: "aryaman.sinha.lko@gmail.com"

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
                        initialEmail = emailState.value,
                        initialBaseUrl = savedUrl,
                        onRequestPermissions = {
                            requestPermissionsLauncher.launch(healthConnectManager.permissions)
                        },
                        onSavePrefs = { token, email, url ->
                            tokenState.value = token
                            emailState.value = email
                            prefs.edit()
                                .putString("auth_token", token)
                                .putString("user_email", email)
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
    initialEmail: String,
    initialBaseUrl: String,
    onRequestPermissions: () -> Unit,
    onSavePrefs: (String, String, String) -> Unit
) {
    val coroutineScope = rememberCoroutineScope()
    val scrollState = rememberScrollState()

    var token by remember { mutableStateOf(initialToken) }
    var emailInput by remember { mutableStateOf(initialEmail) }
    var baseUrl by remember { mutableStateOf(initialBaseUrl) }
    var metrics by remember { mutableStateOf(HealthMetrics(0, 0.0, "")) }
    var hasPermissions by remember { mutableStateOf(false) }
    var isCheckingPermissions by remember { mutableStateOf(true) }
    var isLoadingMetrics by remember { mutableStateOf(false) }
    var isLoggingIn by remember { mutableStateOf(false) }
    var isPushing by remember { mutableStateOf(false) }
    var statusMessage by remember { mutableStateOf<String?>(null) }
    var isSuccess by remember { mutableStateOf(false) }
    var isEditingSteps by remember { mutableStateOf(false) }

    LaunchedEffect(initialToken) {
        token = initialToken
    }

    fun refreshMetrics() {
        coroutineScope.launch {
            isLoadingMetrics = true
            hasPermissions = healthConnectManager.hasAllPermissions()
            isCheckingPermissions = false
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
            modifier = Modifier.padding(top = 2.dp, bottom = 16.dp)
        )

        // Account Link Status Card
        Card(
            colors = CardDefaults.cardColors(containerColor = Slate800),
            shape = RoundedCornerShape(14.dp),
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 16.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "ACCOUNT LINK",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = Emerald400,
                        letterSpacing = 1.sp
                    )
                    if (token.isNotBlank()) {
                        Text(
                            text = "✓ Paired",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = Emerald400
                        )
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                if (token.isNotBlank()) {
                    Text(
                        text = "Pushing to: $emailInput",
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp,
                        color = Slate50
                    )
                    Text(
                        text = "Matches your website login account.",
                        fontSize = 11.sp,
                        color = Slate400,
                        modifier = Modifier.padding(top = 2.dp)
                    )
                } else {
                    Text(
                        text = "Enter your Google account email:",
                        fontSize = 12.sp,
                        color = Slate200
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    OutlinedTextField(
                        value = emailInput,
                        onValueChange = { emailInput = it },
                        placeholder = { Text("e.g. yourname@gmail.com", fontSize = 12.sp) },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(
                            keyboardType = KeyboardType.Email,
                            imeAction = ImeAction.Done
                        ),
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = Emerald400,
                            unfocusedBorderColor = Slate700
                        )
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    Button(
                        onClick = {
                            if (emailInput.isBlank()) {
                                statusMessage = "Please enter your email."
                                isSuccess = false
                                return@Button
                            }
                            isLoggingIn = true
                            statusMessage = null
                            coroutineScope.launch {
                                val res = syncService.loginWithEmail(baseUrl, emailInput)
                                isLoggingIn = false
                                res.onSuccess { t ->
                                    token = t
                                    onSavePrefs(token, emailInput, baseUrl)
                                    statusMessage = "Paired with $emailInput!"
                                    isSuccess = true
                                }.onFailure { e ->
                                    statusMessage = "Account link failed: ${e.localizedMessage}"
                                    isSuccess = false
                                }
                            }
                        },
                        enabled = !isLoggingIn,
                        colors = ButtonDefaults.buttonColors(containerColor = Emerald600),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(if (isLoggingIn) "Linking Account..." else "Link to My Google Account")
                    }
                }
            }
        }

        // Health Connect Permissions Banner if not yet granted
        if (!hasPermissions && !isCheckingPermissions) {
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
                            text = "Health Connect Permission",
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
                        Text("Grant Permission (Allow All)")
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
                            fontSize = 26.sp,
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
                            fontSize = 26.sp,
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

                // If steps is 0, show friendly Samsung Health sync prompt
                if (metrics.steps == 0L && !isLoadingMetrics) {
                    Spacer(modifier = Modifier.height(14.dp))
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .background(Slate700.copy(alpha = 0.5f))
                            .padding(10.dp)
                    ) {
                        Text(
                            text = "💡 Steps showing 0? Open Samsung Health > tap Steps > pull down to refresh so Samsung Health writes your 602 steps to Health Connect, then tap Refresh above.",
                            fontSize = 11.sp,
                            color = Slate200,
                            lineHeight = 15.sp
                        )
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))
                HorizontalDivider(color = Slate700)
                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = metrics.sourceDescription,
                        fontSize = 10.sp,
                        color = Slate400
                    )
                    TextButton(
                        onClick = { isEditingSteps = !isEditingSteps },
                        contentPadding = PaddingValues(0.dp)
                    ) {
                        Text(
                            text = if (isEditingSteps) "Done" else "Manual Adjust",
                            fontSize = 11.sp,
                            color = Emerald400
                        )
                    }
                }

                if (isEditingSteps) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        OutlinedButton(
                            onClick = {
                                val s = metrics.steps + 500
                                metrics = metrics.copy(steps = s, caloriesBurned = Math.round(s * 0.04 * 10.0) / 10.0)
                            },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(6.dp)
                        ) {
                            Text("+500", fontSize = 11.sp)
                        }
                        OutlinedButton(
                            onClick = {
                                metrics = metrics.copy(steps = 602, caloriesBurned = 24.1)
                            },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(6.dp)
                        ) {
                            Text("Set 602", fontSize = 11.sp)
                        }
                    }
                }
            }
        }

        // PUSH BUTTON (Main Action)
        Button(
            onClick = {
                if (token.isBlank()) {
                    statusMessage = "Please link your Google account above first."
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
    }
}
