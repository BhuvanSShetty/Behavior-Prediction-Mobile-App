import { NativeModules } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { sendSession } from "../services/sessionService";
import { getGames, nameForPackage, subscribeToGames } from "./gameConfig";

const { UsageStatsModule } = NativeModules || {};

// The real detection loop (foreground-app polling + start/pause/resume/end
// session bookkeeping) runs natively inside BehaviorDetectionService so it
// keeps working when the JS thread is backgrounded or the app UI is closed.
// This module's job is: (1) keep the native service's game list in sync,
// (2) poll the *lightweight* SharedPreferences-backed state while the app is
// open (for UI + to sync finished sessions to the backend), and (3) offer a
// pub/sub API screens can subscribe to.

const OFFLINE_QUEUE_KEY = "offline_session_queue_v1";

let syncTimer = null;
let unsubConfig = null;
let games = [];
let listeners = new Set();
let lastActivePackage = null; // used to fire onStart/onEnd transitions
let isSyncing = false; // reentrancy guard -- prevents overlapping syncs from double-sending the same completed session if a network call runs longer than the poll interval

const notify = (event, payload) => {
  listeners.forEach((l) => {
    try {
      if (event === "start" && l.onStart) l.onStart(payload);
      if (event === "end" && l.onEnd) l.onEnd(payload);
      if (event === "result") l.onResult && l.onResult(payload);
    } catch (e) {
      // never let a listener crash the loop
    }
  });
};

// Subscribe to detection events. Returns an unsubscribe function.
// handlers: { onStart(session), onEnd(session), onResult() }
export const addListener = (handlers) => {
  listeners.add(handlers);
  return () => listeners.delete(handlers);
};

const queueOffline = async (entry) => {
  try {
    const raw = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    const queue = raw ? JSON.parse(raw) : [];
    queue.push(entry);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.log("⚠️ Failed to persist offline session", e);
  }
};

const flushOfflineQueue = async () => {
  let queue = [];
  try {
    const raw = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    queue = raw ? JSON.parse(raw) : [];
  } catch (e) {
    return;
  }
  if (!queue.length) return;

  const remaining = [];
  for (const entry of queue) {
    try {
      await sendSession(entry.start, entry.end);
    } catch (e) {
      remaining.push(entry); // still offline / still failing, keep it queued
    }
  }
  await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
};

// Push the current configured game list into native SharedPreferences so
// BehaviorDetectionService picks it up on its next poll tick (no restart
// needed). Call this on startup and whenever the settings screen edits it.
export const refreshGameList = async () => {
  games = await getGames();
  if (UsageStatsModule && UsageStatsModule.setGameList) {
    try {
      await UsageStatsModule.setGameList(games.map((g) => g.packageName));
    } catch (e) {
      console.log("⚠️ setGameList failed", e);
    }
  }
  return games;
};

// One pass: read native session state + any completed sessions, sync
// completed sessions to the backend (or queue offline), fire listener
// events, and flush anything left over from a previous offline period.
const syncOnce = async () => {
  if (!UsageStatsModule) return;
  if (isSyncing) return; // a previous sync is still in flight -- skip this tick rather than risk double-sending
  isSyncing = true;

  try {
    await flushOfflineQueue();

    if (UsageStatsModule.getCompletedSessions) {
      const completed = await UsageStatsModule.getCompletedSessions();
      if (completed && completed.length) {
        for (const s of completed) {
          try {
            await sendSession(s.start, s.end);
          } catch (e) {
            await queueOffline({ start: s.start, end: s.end });
          }
        }
        await UsageStatsModule.clearCompletedSessions();
        notify("result");
      }
    }

    if (UsageStatsModule.getSessionState) {
      const active = await UsageStatsModule.getSessionState();
      const activePkg = active ? active.packageName : null;

      if (activePkg && activePkg !== lastActivePackage) {
        lastActivePackage = activePkg;
        notify("start", {
          packageName: activePkg,
          gameName: nameForPackage(games, activePkg),
          startTime: active.startTime,
        });
      } else if (!activePkg && lastActivePackage) {
        lastActivePackage = null;
        notify("end", {});
      }
    }
  } catch (e) {
    console.log("⚠️ Detector sync error (ignored):", e);
  } finally {
    isSyncing = false;
  }
};

// Starts native detection (foreground service + polling loop) and the
// lightweight JS sync loop that mirrors state into the UI / backend while
// the app is open.
export const startGameDetection = async () => {
  if (syncTimer) return; // prevent duplicate loops

  await refreshGameList();
  unsubConfig = subscribeToGames(refreshGameList);

  if (UsageStatsModule && UsageStatsModule.startService) {
    try {
      await UsageStatsModule.startService();
    } catch (e) {
      console.log("⚠️ Foreground service failed to start", e);
    }
  }

  await syncOnce(); // immediate pass -- recovers state after app restart
  syncTimer = setInterval(syncOnce, 3000);
};

// Stops the JS-side sync loop (called when the dashboard unmounts). The
// native service keeps running so detection continues in the background --
// use stopBackgroundService() to actually turn detection off (e.g. logout).
export const stopGameDetection = () => {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
  }
  if (unsubConfig) {
    unsubConfig();
    unsubConfig = null;
  }
};

// Fully stops background detection. Call on logout, not on screen unmount.
export const stopBackgroundService = async () => {
  stopGameDetection();
  if (UsageStatsModule && UsageStatsModule.stopService) {
    try {
      await UsageStatsModule.stopService();
    } catch (e) {
      console.log("⚠️ Service stop failed", e);
    }
  }
};

export const hasUsagePermission = async () => {
  if (UsageStatsModule && UsageStatsModule.checkPermission) {
    return await UsageStatsModule.checkPermission();
  }
  return false;
};

export const openUsageSettings = () => {
  if (UsageStatsModule && UsageStatsModule.requestPermission) {
    UsageStatsModule.requestPermission();
  }
};
