package com.gamemonitorappnew

import android.app.usage.UsageStatsManager
import android.app.usage.UsageEvents
import android.app.AppOpsManager
import android.util.Log
import android.provider.Settings
import android.content.Context
import android.content.Intent
import android.os.Build
import android.content.pm.ApplicationInfo
import com.facebook.react.bridge.*
import org.json.JSONArray
import org.json.JSONObject

class UsageStatsModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val TAG = "UsageStatsModule"

    override fun getName(): String {
        return "UsageStatsModule"
    }

    private fun prefs() =
        reactApplicationContext.getSharedPreferences(DetectionPrefs.NAME, Context.MODE_PRIVATE)

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

    // 🎮 Push the configurable list of monitored game package names to the
    // native service. Stored in SharedPreferences so BehaviorDetectionService
    // (which runs independently of the JS thread) can read it every poll
    // cycle without needing a live RN bridge call.
    @ReactMethod
    fun setGameList(packages: ReadableArray, promise: Promise) {
        try {
            val set = HashSet<String>()
            for (i in 0 until packages.size()) {
                packages.getString(i)?.let { set.add(it) }
            }
            prefs().edit().putStringSet(DetectionPrefs.KEY_GAME_PACKAGES, set).apply()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR_SET_GAME_LIST", e.message)
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
            // Clear any in-progress session marker so we don't try to resume
            // a session against a service that is no longer running.
            prefs().edit().remove(DetectionPrefs.KEY_CURRENT_SESSION).apply()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR_STOP_SERVICE", e.message)
        }
    }

    // Current in-progress session (if any), written by the native service.
    // Returns null when nothing is active.
    @ReactMethod
    fun getSessionState(promise: Promise) {
        try {
            val raw = prefs().getString(DetectionPrefs.KEY_CURRENT_SESSION, null)
            if (raw == null) {
                promise.resolve(null)
                return
            }
            val obj = JSONObject(raw)
            val map = Arguments.createMap()
            map.putString("packageName", obj.optString("packageName"))
            map.putDouble("startTime", obj.optDouble("startTime"))
            promise.resolve(map)
        } catch (e: Exception) {
            promise.resolve(null)
        }
    }

    // Sessions the native service has already finalized (game closed / switched
    // away from) but that the JS layer hasn't confirmed syncing to the backend
    // yet. This queue is what makes "app killed mid-session" and "network
    // unavailable" safe -- nothing is lost until JS explicitly clears it.
    @ReactMethod
    fun getCompletedSessions(promise: Promise) {
        try {
            val raw = prefs().getString(DetectionPrefs.KEY_COMPLETED_SESSIONS, "[]")
            val arr = JSONArray(raw)
            val result = Arguments.createArray()
            for (i in 0 until arr.length()) {
                val obj = arr.getJSONObject(i)
                val map = Arguments.createMap()
                map.putString("packageName", obj.optString("packageName"))
                map.putDouble("start", obj.optDouble("start"))
                map.putDouble("end", obj.optDouble("end"))
                result.pushMap(map)
            }
            promise.resolve(result)
        } catch (e: Exception) {
            promise.resolve(Arguments.createArray())
        }
    }

    // Called by JS only after it has successfully POSTed the queued sessions
    // (or durably queued them offline itself), so the native queue never
    // grows unbounded and nothing is double-submitted.
    @ReactMethod
    fun clearCompletedSessions(promise: Promise) {
        try {
            prefs().edit().putString(DetectionPrefs.KEY_COMPLETED_SESSIONS, "[]").apply()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR_CLEAR_COMPLETED", e.message)
        }
    }

    // Diagnostic: the last ~60 raw foreground-change events the service has
    // seen, for on-device debugging without needing adb/logcat.
    @ReactMethod
    fun getEventLog(promise: Promise) {
        try {
            val raw = prefs().getString(DetectionPrefs.KEY_EVENT_LOG, "[]")
            val arr = JSONArray(raw)
            val result = Arguments.createArray()
            for (i in 0 until arr.length()) {
                val obj = arr.getJSONObject(i)
                val map = Arguments.createMap()
                map.putString("pkg", obj.optString("pkg"))
                map.putInt("type", obj.optInt("type"))
                map.putDouble("time", obj.optDouble("time"))
                result.pushMap(map)
            }
            promise.resolve(result)
        } catch (e: Exception) {
            promise.resolve(Arguments.createArray())
        }
    }

    // Kept for backward compatibility / debugging. Not used by the primary
    // detection path anymore (that now lives natively in the service and is
    // matched against the configured package list, not the OS "game"
    // category, which is unreliable for many popular titles).
    @ReactMethod
    fun getCurrentApp(promise: Promise) {
        try {
            val usageStatsManager = reactApplicationContext.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
            val time = System.currentTimeMillis()
            val selfPkg = reactApplicationContext.packageName

            val events = usageStatsManager.queryEvents(time - 1000 * 60, time)
            val event = UsageEvents.Event()
            var lastOtherPkg: String? = null
            var currentForegroundPkg: String? = null

            while (events.hasNextEvent()) {
                events.getNextEvent(event)
                if (event.eventType == 1 || event.eventType == 10) {
                    currentForegroundPkg = event.packageName
                    if (event.packageName != selfPkg) {
                        lastOtherPkg = event.packageName
                    }
                }
            }

            val pkgToReport = if (currentForegroundPkg != selfPkg) currentForegroundPkg else lastOtherPkg

            if (pkgToReport != null) {
                val map = Arguments.createMap()
                map.putString("packageName", pkgToReport)

                var isGame = false
                try {
                    val pm = reactApplicationContext.packageManager
                    val info = pm.getApplicationInfo(pkgToReport, 0)
                    isGame = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        info.category == ApplicationInfo.CATEGORY_GAME
                    } else {
                        (info.flags and ApplicationInfo.FLAG_IS_GAME) != 0
                    }
                } catch (e: Exception) {
                    // ignore
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

    // RN's NativeEventEmitter requires addListener/removeListeners to exist on
    // native modules that back JS event emitters, even though this module
    // uses polling (getSessionState/getCompletedSessions) rather than push
    // events. No-op stubs prevent an "unhandled JS exception" warning.
    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}
}
