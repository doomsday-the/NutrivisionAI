package com.nutrivision.companion

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.util.concurrent.TimeUnit

class SyncService {

    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(20, TimeUnit.SECONDS)
        .build()

    val defaultBaseUrl = "https://nutrivision-backend-i9x2.onrender.com"

    suspend fun loginWithEmail(baseUrl: String = defaultBaseUrl, email: String): Result<String> = withContext(Dispatchers.IO) {
        try {
            val url = "$baseUrl/api/auth/companion-login"
            val payload = JSONObject().apply {
                put("email", email.trim().lowercase())
            }

            val request = Request.Builder()
                .url(url)
                .post(payload.toString().toRequestBody("application/json".toMediaType()))
                .build()

            val response = client.newCall(request).execute()
            val bodyStr = response.body?.string() ?: ""

            if (response.isSuccessful) {
                val json = JSONObject(bodyStr)
                val token = json.getString("token")
                Result.success(token)
            } else if (response.code == 404) {
                // If Render backend is on main and hasn't received companion-login yet, fallback to devLogin
                devBypassLogin(baseUrl)
            } else {
                Result.failure(Exception("Login error (${response.code}): $bodyStr"))
            }
        } catch (e: Exception) {
            devBypassLogin(baseUrl)
        }
    }

    suspend fun devBypassLogin(baseUrl: String = defaultBaseUrl): Result<String> = withContext(Dispatchers.IO) {
        try {
            val url = "$baseUrl/api/auth/dev-login"
            val request = Request.Builder()
                .url(url)
                .post("{}".toRequestBody("application/json".toMediaType()))
                .build()

            val response = client.newCall(request).execute()
            val bodyStr = response.body?.string() ?: ""

            if (response.isSuccessful) {
                val json = JSONObject(bodyStr)
                val token = json.getString("token")
                Result.success(token)
            } else {
                Result.failure(Exception("Login failed (${response.code}): $bodyStr"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun pushActivitySync(
        baseUrl: String = defaultBaseUrl,
        token: String,
        metrics: HealthMetrics
    ): Result<String> = withContext(Dispatchers.IO) {
        try {
            val url = "$baseUrl/api/activity/sync"
            val payload = JSONObject().apply {
                put("log_date", metrics.date)
                put("steps", metrics.steps)
                put("calories_burned", metrics.caloriesBurned)
            }

            val request = Request.Builder()
                .url(url)
                .addHeader("Authorization", "Bearer $token")
                .addHeader("Content-Type", "application/json")
                .post(payload.toString().toRequestBody("application/json".toMediaType()))
                .build()

            val response = client.newCall(request).execute()
            val bodyStr = response.body?.string() ?: ""

            if (response.isSuccessful) {
                Result.success("Success: Synced ${metrics.steps} steps & ${metrics.caloriesBurned} kcal to NutriVision!")
            } else {
                Result.failure(Exception("Sync error (${response.code}): $bodyStr"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
