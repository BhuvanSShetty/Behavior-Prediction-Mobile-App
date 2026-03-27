import { NativeModules } from "react-native";
import { sendSession } from "../services/sessionService";

const { UsageStatsModule } = NativeModules || {};

let playing = false;
let startTime = null;
let timer = null;

export const startGameDetection = () => {
  if (timer) return; // prevent multiple loops

  // 🚀 START NATIVE FOREGROUND SERVICE
  if (UsageStatsModule && UsageStatsModule.startService) {
    UsageStatsModule.startService()
      .then(() => console.log("✅ Foreground Service Started"))
      .catch(e => console.log("⚠️ Service failed", e));
  }

  timer = setInterval(async () => {
    try {
      // ✅ If module not available → just wait
      if (!UsageStatsModule || !UsageStatsModule.getCurrentApp) {
        console.log("⏳ Waiting for native module...");
        return;
      }

      const res = await UsageStatsModule.getCurrentApp();

      // ✅ If nothing detected → wait silently
      if (!res || !res.packageName) {
        return;
      }

      const pkg = res.packageName;
      const isGame = res.isGame;

      console.log("📱 Current App:", pkg, isGame ? "(GAME)" : "(APP)");

      // 🎮 Game start (Any Category: Game)
      if (isGame && !playing) {
        playing = true;
        startTime = Date.now();
        console.log("🎮 STARTING UNIVERSAL SESSION");
      }

      // 🛑 Game end
      if (!isGame && playing) {
        const end = Date.now();
        try {
          await sendSession(startTime, end);
        } catch (e) {
          console.log("⚠️ Send session failed", e);
        }

        playing = false;
        startTime = null;
        console.log("🛑 ENDING UNIVERSAL SESSION");
      }

    } catch (e) {
      // ✅ NEVER CRASH
      console.log("⚠️ Detector error (ignored):", e);
    }
  }, 2000);
};

export const stopGameDetection = () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
    console.log("🛑 Detection Timer Stopped");
  }

  // 🚀 STOP NATIVE FOREGROUND SERVICE
  if (UsageStatsModule && UsageStatsModule.stopService) {
    UsageStatsModule.stopService()
      .then(() => console.log("✅ Foreground Service Stopped"))
      .catch(e => console.log("⚠️ Service stop failed", e));
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