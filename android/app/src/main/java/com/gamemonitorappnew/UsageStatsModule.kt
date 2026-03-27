package com.gamemonitorappnew

import android.app.usage.UsageStatsManager
import android.app.usage.UsageEvents
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
            
            // 🚀 Switch to UsageEvents for precision
            val events = usageStatsManager.queryEvents(time - 1000 * 20, time) // check last 20 sec
            val event = UsageEvents.Event()
            var lastPkg: String? = null

            while (events.hasNextEvent()) {
                events.getNextEvent(event)
                if (event.eventType == UsageEvents.Event.MOVE_TO_FOREGROUND) {
                    lastPkg = event.packageName
                }
            }
            
            if (lastPkg != null) {
                val map = Arguments.createMap()
                map.putString("packageName", lastPkg)
                
                // 🕵️ Game detection logic
                var isGame = false
                try {
                    val pm = reactApplicationContext.packageManager
                    val info = pm.getApplicationInfo(lastPkg, 0)
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        isGame = (info.category == ApplicationInfo.CATEGORY_GAME)
                    } else {
                        isGame = (info.flags and ApplicationInfo.FLAG_IS_GAME) != 0
                    }
                } catch (e: Exception) {
                    // ignore packagemanager errors
                }
                
                map.putBoolean("isGame", isGame)
                promise.resolve(map)
            } else {
                // Fallback to UsageStats if events log is empty
                val stats = usageStatsManager.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, time - 1000 * 10, time)
                if (stats != null && stats.isNotEmpty()) {
                    var latest = stats[0]
                    for (s in stats) { if (s.lastTimeUsed > latest.lastTimeUsed) latest = s }
                    val map = Arguments.createMap()
                    map.putString("packageName", latest.packageName)
                    map.putBoolean("isGame", false) // basic fallback
                    promise.resolve(map)
                } else {
                    promise.resolve(null)
                }
            }
        } catch (e: Exception) {
            promise.reject("ERROR_GETTING_USAGE", e.message)
        }
    }
}
