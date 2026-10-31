package com.nutrivision.companion

import android.content.Context
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.records.TotalCaloriesBurnedRecord
import androidx.health.connect.client.request.AggregateRequest
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId

data class HealthMetrics(
    val steps: Long,
    val caloriesBurned: Double,
    val date: String,
    val sourceDescription: String = "Health Connect"
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
        val zoneId = ZoneId.systemDefault()
        val today = LocalDate.now(zoneId)
        val startOfDay = today.atStartOfDay(zoneId).toInstant()
        val endOfDay = today.plusDays(1).atStartOfDay(zoneId).toInstant()

        val timeFilter = TimeRangeFilter.between(startOfDay, endOfDay)

        var totalSteps: Long = 0
        var totalCalories: Double = 0.0
        var usedMethod = "Aggregated"

        // 1. Try official AggregateRequest (Standard for Samsung Health daily totals)
        try {
            val aggregateResponse = healthConnectClient.aggregate(
                AggregateRequest(
                    metrics = setOf(StepsRecord.COUNT_TOTAL, TotalCaloriesBurnedRecord.ENERGY_TOTAL),
                    timeRangeFilter = timeFilter
                )
            )
            totalSteps = aggregateResponse[StepsRecord.COUNT_TOTAL] ?: 0L
            val energy = aggregateResponse[TotalCaloriesBurnedRecord.ENERGY_TOTAL]
            if (energy != null) {
                totalCalories = energy.inKilocalories
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }

        // 2. If aggregate returned 0, fallback to raw readRecords
        if (totalSteps == 0L) {
            try {
                val stepsResponse = healthConnectClient.readRecords(
                    ReadRecordsRequest(
                        recordType = StepsRecord::class,
                        timeRangeFilter = timeFilter
                    )
                )
                if (stepsResponse.records.isNotEmpty()) {
                    totalSteps = stepsResponse.records.sumOf { it.count }
                    usedMethod = "Raw Records (${stepsResponse.records.size})"
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }

        // 3. Fallback for calories if not directly recorded
        if (totalCalories == 0.0 && totalSteps > 0) {
            totalCalories = totalSteps * 0.04
        }

        return HealthMetrics(
            steps = totalSteps,
            caloriesBurned = Math.round(totalCalories * 10.0) / 10.0,
            date = today.toString(),
            sourceDescription = "Samsung Health via $usedMethod"
        )
    }
}
