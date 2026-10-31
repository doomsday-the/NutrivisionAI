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
    val sourceDescription: String = "Health Connect",
    val recordCount: Int = 0,
    val originPackages: List<String> = emptyList()
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
        val now = Instant.now().plusSeconds(180) // buffer for clock skew

        val timeFilter = TimeRangeFilter.between(startOfDay, now)

        var totalSteps: Long = 0
        var totalCalories: Double = 0.0
        var recordCount = 0
        val originPackages = mutableListOf<String>()

        // 1. First, read raw records to inspect the actual sources (e.g. Samsung Health)
        try {
            val rawResponse = healthConnectClient.readRecords(
                ReadRecordsRequest(
                    recordType = StepsRecord::class,
                    timeRangeFilter = timeFilter
                )
            )
            recordCount = rawResponse.records.size
            rawResponse.records.forEach { record ->
                val pkg = record.metadata.dataOrigin.packageName
                if (!originPackages.contains(pkg)) {
                    originPackages.add(pkg)
                }
            }
            if (rawResponse.records.isNotEmpty()) {
                totalSteps = rawResponse.records.sumOf { it.count }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }

        // 2. Query aggregate total if aggregate provides a higher deduplicated value
        try {
            val aggregateResponse = healthConnectClient.aggregate(
                AggregateRequest(
                    metrics = setOf(StepsRecord.COUNT_TOTAL, TotalCaloriesBurnedRecord.ENERGY_TOTAL),
                    timeRangeFilter = timeFilter
                )
            )
            val aggSteps = aggregateResponse[StepsRecord.COUNT_TOTAL] ?: 0L
            if (aggSteps > totalSteps) {
                totalSteps = aggSteps
            }

            val energy = aggregateResponse[TotalCaloriesBurnedRecord.ENERGY_TOTAL]
            if (energy != null && energy.inKilocalories > 0) {
                totalCalories = energy.inKilocalories
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }

        // 3. Fallback for calories if not directly recorded by Samsung Health
        if (totalCalories == 0.0 && totalSteps > 0) {
            totalCalories = totalSteps * 0.04
        }

        val desc = when {
            originPackages.any { it.contains("shealth") } -> "Samsung Health ($recordCount entries)"
            originPackages.isNotEmpty() -> "${originPackages.joinToString()} ($recordCount entries)"
            recordCount == 0 -> "0 records written to Health Connect yet"
            else -> "Health Connect"
        }

        return HealthMetrics(
            steps = totalSteps,
            caloriesBurned = Math.round(totalCalories * 10.0) / 10.0,
            date = today.toString(),
            sourceDescription = desc,
            recordCount = recordCount,
            originPackages = originPackages
        )
    }
}
