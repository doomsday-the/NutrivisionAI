package com.nutrivision.companion

import android.content.Context
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.records.TotalCaloriesBurnedRecord
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.temporal.ChronoUnit

data class HealthMetrics(
    val steps: Long,
    val caloriesBurned: Double,
    val date: String
)

class HealthConnectManager(private val context: Context) {

    val healthConnectClient by lazy {
        HealthConnectClient.getOrCreate(context)
    }

    val permissions = setOf(
        HealthPermission.getReadPermission(StepsRecord::class),
        HealthPermission.getReadPermission(TotalCaloriesBurnedRecord::class)
    )

    fun isAvailable(): Boolean {
        return HealthConnectClient.getSdkStatus(context) == HealthConnectClient.SDK_AVAILABLE
    }

    suspend fun hasAllPermissions(): Boolean {
        if (!isAvailable()) return false
        val granted = healthConnectClient.permissionController.getGrantedPermissions()
        return granted.containsAll(permissions)
    }

    suspend fun readTodayMetrics(): HealthMetrics {
        val today = LocalDate.now()
        val zoneId = ZoneId.systemDefault()
        val startOfDay = today.atStartOfDay(zoneId).toInstant()
        val now = Instant.now()

        val timeFilter = TimeRangeFilter.between(startOfDay, now)

        var totalSteps: Long = 0
        try {
            val stepsResponse = healthConnectClient.readRecords(
                ReadRecordsRequest(
                    recordType = StepsRecord::class,
                    timeRangeFilter = timeFilter
                )
            )
            totalSteps = stepsResponse.records.sumOf { it.count }
        } catch (e: Exception) {
            e.printStackTrace()
        }

        var totalCalories: Double = 0.0
        try {
            val caloriesResponse = healthConnectClient.readRecords(
                ReadRecordsRequest(
                    recordType = TotalCaloriesBurnedRecord::class,
                    timeRangeFilter = timeFilter
                )
            )
            if (caloriesResponse.records.isNotEmpty()) {
                totalCalories = caloriesResponse.records.sumOf { it.energy.inKilocalories }
            } else {
                // Approximate active burn if explicit calorie records are absent
                totalCalories = totalSteps * 0.04
            }
        } catch (e: Exception) {
            totalCalories = totalSteps * 0.04
        }

        return HealthMetrics(
            steps = totalSteps,
            caloriesBurned = Math.round(totalCalories * 10.0) / 10.0,
            date = today.toString()
        )
    }
}
