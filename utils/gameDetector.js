import { NativeModules } from "react-native";
import { sendSession } from "../services/sessionService";

const { UsageStatsModule } = NativeModules || {};

const TARGET_PACKAGES = new Set([
  "com.leveldevil.game",
  "com.android.chrome",
]);

let playing = false;
let startTime = null;
let timer = null;

export const startGameDetection = () => {
  if (timer) return; // prevent multiple loops

  timer = setInterval(async () => {
    try {
      // ✅ If module not available → just wait
      if (!UsageStatsModule || !UsageStatsModule.getCurrentApp) {
        console.log("⏳ Waiting for native module...");
        return;
      }

      const pkg = await UsageStatsModule.getCurrentApp();

      // ✅ If nothing detected → wait silently
      if (!pkg) {
        return;
      }

      console.log("📱 Current App:", pkg);

      const isTarget = TARGET_PACKAGES.has(pkg);

      // 🎮 Game start
      if (isTarget && !playing) {
        playing = true;
        startTime = Date.now();
        console.log("🎮 START");
      }

      // 🛑 Game end
      if (!isTarget && playing) {
        const end = Date.now();

        try {
          await sendSession(startTime, end);
        } catch (e) {
          console.log("⚠️ Send session failed", e);
        }

        playing = false;
        startTime = null;

        console.log("🛑 END");
      }

    } catch (e) {
      // ✅ NEVER CRASH
      console.log("⚠️ Detector error (ignored):", e);
    }
  }, 2000);
};