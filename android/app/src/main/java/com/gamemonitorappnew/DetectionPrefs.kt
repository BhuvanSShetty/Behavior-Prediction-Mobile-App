package com.gamemonitorappnew

// Central place for the SharedPreferences name/keys shared between
// UsageStatsModule (JS bridge) and BehaviorDetectionService (background
// polling loop). Using SharedPreferences rather than RN device events keeps
// session detection correct even when the JS thread is suspended/killed.
object DetectionPrefs {
    const val NAME = "behavior_detection_prefs"

    // Set<String> of configured game package names.
    const val KEY_GAME_PACKAGES = "game_packages"

    // JSON object: {"packageName": "...", "startTime": <millis>} or absent.
    const val KEY_CURRENT_SESSION = "current_session"

    // JSON array of finalized-but-unsynced sessions:
    // [{"packageName": "...", "start": <millis>, "end": <millis>}, ...]
    const val KEY_COMPLETED_SESSIONS = "completed_sessions"

    // JSON array of the last ~60 raw foreground-change events seen, for
    // on-device diagnostics: [{"pkg": "...", "type": 1, "time": <millis>}, ...]
    const val KEY_EVENT_LOG = "event_log"
}
