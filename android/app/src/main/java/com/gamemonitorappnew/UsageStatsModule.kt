package com.gamemonitorappnew

import android.app.usage.UsageStatsManager
import android.app.AppOpsManager
import android.provider.Settings
import android.content.Context
import android.content.Intent
import android.os.Build
import android.content.pm.ApplicationInfo
import com.facebook.react.bridge.*

class UsageStatsModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "UsageStatsModule"
    }

    @ReactMethod
    fun checkPermission(promise: Promise) {
        try {
            val appOps = reactApplicationContext.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
            val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                appOps.unsafeCheckOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, android.os.Process.myUid(), reactApplicationContext.packageName)
            } else {
                appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, android.os.Process.myUid(), reactApplicationContext.packageName)
            }
            promise.resolve(mode == AppOpsManager.MODE_ALLOWED)
        } catch (e: Exception) {
            promise.reject("ERROR_CHECK_PERMISSION", e.message)
        }
    }

    @ReactMethod
    fun requestPermission() {
        try {
            val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
        } catch (e: Exception) {
            // fallback if direct action fails
        }
    }

    @ReactMethod
    fun startService(promise: Promise) {
        try {
            val intent = Intent(reactApplicationContext, BehaviorDetectionService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                reactApplicationContext.startForegroundService(intent)
            } else {
                reactApplicationContext.startService(intent)
            }
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR_START_SERVICE", e.message)
        }
    }

    @ReactMethod
    fun stopService(promise: Promise) {
        try {
            val intent = Intent(reactApplicationContext, BehaviorDetectionService::class.java)
            reactApplicationContext.stopService(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR_STOP_SERVICE", e.message)
        }
    }

    @ReactMethod
    fun getCurrentApp(promise: Promise) {
        try {
            val usageStatsManager = reactApplicationContext.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
            val time = System.currentTimeMillis()
            
            // Look at the last 10 seconds of usage
            val stats = usageStatsManager.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, time - 1000 * 10, time)
            
            if (stats != null && stats.isNotEmpty()) {
                var latestStats = stats[0]
                for (usageStat in stats) {
                    if (usageStat.lastTimeUsed > latestStats.lastTimeUsed) {
                        latestStats = usageStat
                    }
                }
                
                val pkg = latestStats.packageName
                val map = Arguments.createMap()
                map.putString("packageName", pkg)
                
                // 🕵️ Game detection logic
                var isGame = false
                try {
                    val pm = reactApplicationContext.packageManager
                    val info = pm.getApplicationInfo(pkg, 0)
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        isGame = (info.category == ApplicationInfo.CATEGORY_GAME)
                    } else {
                        // Older Android versions used a flag
                        isGame = (info.flags and ApplicationInfo.FLAG_IS_GAME) != 0
                    }
                } catch (e: Exception) {
                    // ignore packagemanager errors
                }
                
                map.putBoolean("isGame", isGame)
                promise.resolve(map)
            } else {
                promise.resolve(null)
            }
        } catch (e: Exception) {
            promise.reject("ERROR_GETTING_USAGE", e.message)
        }
    }
}
