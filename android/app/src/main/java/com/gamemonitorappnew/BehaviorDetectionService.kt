package com.gamemonitorappnew

import android.app.*
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import androidx.core.app.NotificationCompat
import org.json.JSONArray
import org.json.JSONObject

// Runs the actual foreground-app polling loop. This is intentionally a plain
// Android Service (not driven by JS setInterval) so detection keeps working
// even when the React Native JS thread is backgrounded/suspended or the app
// UI is fully closed. Session state is persisted to SharedPreferences so the
// JS layer can read it whenever it's running, and so an app/process restart
// can recover safely instead of losing an in-progress session.
class BehaviorDetectionService : Service() {

    private val CHANNEL_ID = "BehaviorDetectionChannel"

    // Reasonable polling interval: frequent enough to catch quick app
    // switches without being a battery-draining tight loop.
    private val POLL_INTERVAL_MS = 4000L

    private val handler = Handler(Looper.getMainLooper())
    private var loopRunning = false

    // How long the foreground app must be *continuously* away from the active
    // game before we finalize the session. This absorbs brief, spurious
    // foreground blips -- most notably Samsung's Game Booster / Game Launcher
    // overlay, which can register as the foreground app for a fraction of a
    // second during normal play and would otherwise look identical to the
    // user genuinely switching apps.
    private val LEAVE_GRACE_MS = 30000L

    // Timestamp of the first poll where the configured game was no longer in
    // the foreground, or null if currently on the game (or no session active).
    // In-memory only: if the service process dies, onDestroy() already
    // finalizes whatever was active, so there's nothing to recover here.
    private var pendingLeaveSince: Long? = null

    private lateinit var prefs: android.content.SharedPreferences

    // Diagnostic log: every raw foreground-change event we see gets appended
    // here (package, event type, timestamp), capped to the most recent 60
    // entries. Lets us see exactly what interrupted a session from the app
    // itself, without needing adb/logcat on a device where USB debugging is
    // being uncooperative.
    private fun logEvent(pkg: String, type: Int) {
        try {
            val raw = prefs.getString(DetectionPrefs.KEY_EVENT_LOG, "[]")
            val arr = JSONArray(raw)
            val entry = JSONObject()
            entry.put("pkg", pkg)
            entry.put("type", type)
            entry.put("time", System.currentTimeMillis())
            arr.put(entry)
            // Cap to last 60 entries.
            val trimmed = if (arr.length() > 60) {
                val newArr = JSONArray()
                for (i in (arr.length() - 60) until arr.length()) newArr.put(arr.get(i))
                newArr
            } else arr
            prefs.edit().putString(DetectionPrefs.KEY_EVENT_LOG, trimmed.toString()).apply()
        } catch (e: Exception) {
            // diagnostic logging must never break detection itself
        }
    }

    override fun onCreate() {
        super.onCreate()
        prefs = getSharedPreferences(DetectionPrefs.NAME, Context.MODE_PRIVATE)
        lastKnownForegroundPkg = null
        lastEventQueryTime = 0L
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notificationIntent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, notificationIntent,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0
        )

        val notification: Notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("BehaveTrack Monitoring")
            .setContentText("Behavior detection is active in the background")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentIntent(pendingIntent)
            .build()

        startForeground(1, notification)

        // Guard against onStartCommand being called again (e.g. JS calling
        // startService() a second time) spawning a duplicate polling loop.
        if (!loopRunning) {
            loopRunning = true
            handler.post(pollRunnable)
        }

        return START_STICKY
    }

    private val pollRunnable = object : Runnable {
        override fun run() {
            try {
                pollOnce()
            } catch (e: Exception) {
                // Never let a transient error kill the loop.
            }
            handler.postDelayed(this, POLL_INTERVAL_MS)
        }
    }

    private fun pollOnce() {
        val gamePackages = prefs.getStringSet(DetectionPrefs.KEY_GAME_PACKAGES, emptySet()) ?: emptySet()
        if (gamePackages.isEmpty()) return

        // Treat a locked/off screen as "not actively gaming" -- the backend
        // session model has no pause concept, only start/end blocks, so a
        // lock finalizes the current block; unlocking starts a fresh one if
        // the same game is still in the foreground.
        val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
        val screenOn = powerManager.isInteractive

        val foregroundPkg = if (screenOn) getForegroundPackage() else null
        val now = System.currentTimeMillis()

        val current = readCurrentSession()
        val isConfiguredGame = foregroundPkg != null && gamePackages.contains(foregroundPkg)

        when {
            // On the same game the active session is already tracking:
            // nothing to do, and cancel any pending "leave" timer -- this is
            // what absorbs a brief Game Booster/notification blip that
            // resolved back to the game before the grace period elapsed.
            isConfiguredGame && current != null && current.optString("packageName") == foregroundPkg -> {
                pendingLeaveSince = null
            }

            // Switched to a *different* configured game: this is a deliberate
            // switch, not a blip, so finalize the old one and start the new
            // one immediately (no debounce needed here).
            isConfiguredGame && current != null -> {
                finalizeSession(current, now)
                writeCurrentSession(foregroundPkg!!, now)
                pendingLeaveSince = null
            }

            // On a configured game, nothing active yet: start a new session.
            isConfiguredGame && current == null -> {
                writeCurrentSession(foregroundPkg!!, now)
                pendingLeaveSince = null
            }

            // Not on a configured game (or screen locked/off), but a session
            // is active: don't finalize immediately. Start (or continue) a
            // grace-period timer, and only finalize once the game has been
            // continuously absent for LEAVE_GRACE_MS. This is what prevents
            // one continuous play session from being split into many.
            current != null -> {
                val leaveStart = pendingLeaveSince ?: now.also { pendingLeaveSince = it }
                if (now - leaveStart >= LEAVE_GRACE_MS) {
                    finalizeSession(current, leaveStart)
                    clearCurrentSession()
                    pendingLeaveSince = null
                }
            }

            // Not on a configured game and nothing active: nothing to do.
            else -> { pendingLeaveSince = null }
        }
    }

    // The foreground app doesn't necessarily generate a new usage event every
    // poll -- a game sitting continuously in full-screen foreground (BGMI,
    // etc.) may not fire another MOVE_TO_FOREGROUND/ACTIVITY_RESUMED event for
    // the entire time it's open. So instead of asking "what was in the
    // foreground in the last N seconds" (which goes empty and wrongly reads
    // as "nothing running" once the game stops generating new events), we
    // track the last known foreground package across polls and only update it
    // when a genuinely newer event appears.
    private var lastKnownForegroundPkg: String? = null
    private var lastEventQueryTime: Long = 0L

    // Samsung's Game Booster / Game Launcher / Game Optimizing Service can
    // briefly take foreground focus while a game is running (its overlay
    // toolbar, performance HUD, etc.) without the user actually leaving the
    // game. Treat these the same as our own app -- ignore their events
    // entirely rather than letting them look like "the user switched apps".
    private val IGNORED_OVERLAY_PACKAGES = setOf(
        "com.samsung.android.game.gametools",
        "com.samsung.android.game.gamehome",
        "com.samsung.android.game.gos"
    )

    private fun getForegroundPackage(): String? {
        val usageStatsManager = getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val now = System.currentTimeMillis()

        // First call: look back a bit so we can pick up an already-running
        // foreground app instead of returning null until the next event.
        val queryFrom = if (lastEventQueryTime == 0L) now - 1000 * 60 else lastEventQueryTime

        val events = usageStatsManager.queryEvents(queryFrom, now)
        val event = UsageEvents.Event()

        while (events.hasNextEvent()) {
            events.getNextEvent(event)
            // TYPE 1: MOVE_TO_FOREGROUND -- reliable signal of a genuine app
            // switch on this device (confirmed via on-device diagnostic log).
            // TYPE 10 (ACTIVITY_RESUMED) is intentionally NOT trusted here:
            // it was observed firing for WhatsApp purely from background
            // notification handling (e.g. a message arriving), without the
            // user ever actually switching away from the game -- that false
            // signal was silently ending sessions early.
            if (event.eventType == 1) {
                logEvent(event.packageName, event.eventType)
                // Skip known gaming-overlay packages -- these briefly steal
                // focus without the user actually leaving the game. Our own
                // app is intentionally NOT skipped: if the user opens this
                // app, the game genuinely isn't in the foreground anymore,
                // and the session should correctly show as ended.
                if (!IGNORED_OVERLAY_PACKAGES.contains(event.packageName)) {
                    lastKnownForegroundPkg = event.packageName
                }
            }
        }

        lastEventQueryTime = now
        return lastKnownForegroundPkg
    }

    private fun readCurrentSession(): JSONObject? {
        val raw = prefs.getString(DetectionPrefs.KEY_CURRENT_SESSION, null) ?: return null
        return try { JSONObject(raw) } catch (e: Exception) { null }
    }

    private fun writeCurrentSession(pkg: String, startTime: Long) {
        val obj = JSONObject()
        obj.put("packageName", pkg)
        obj.put("startTime", startTime)
        prefs.edit().putString(DetectionPrefs.KEY_CURRENT_SESSION, obj.toString()).apply()
    }

    private fun clearCurrentSession() {
        prefs.edit().remove(DetectionPrefs.KEY_CURRENT_SESSION).apply()
    }

    private fun finalizeSession(session: JSONObject, endTime: Long) {
        val startTime = session.optDouble("startTime")
        // Guard against a degenerate zero/negative duration (e.g. a single
        // poll tick) still being queued.
        if (endTime <= startTime) return

        val completed = JSONObject()
        completed.put("packageName", session.optString("packageName"))
        completed.put("start", startTime)
        completed.put("end", endTime)

        val rawQueue = prefs.getString(DetectionPrefs.KEY_COMPLETED_SESSIONS, "[]")
        val queue = try { JSONArray(rawQueue) } catch (e: Exception) { JSONArray() }
        queue.put(completed)
        prefs.edit().putString(DetectionPrefs.KEY_COMPLETED_SESSIONS, queue.toString()).apply()
    }

    override fun onDestroy() {
        super.onDestroy()
        loopRunning = false
        handler.removeCallbacks(pollRunnable)
        // If the service is destroyed mid-session (e.g. user force-stops the
        // app), finalize whatever was in progress so it isn't silently lost.
        readCurrentSession()?.let {
            finalizeSession(it, System.currentTimeMillis())
            clearCurrentSession()
        }
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val serviceChannel = NotificationChannel(
                CHANNEL_ID,
                "Behavior Detection Service Channel",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(serviceChannel)
        }
    }
}
