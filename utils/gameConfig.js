import AsyncStorage from "@react-native-async-storage/async-storage";

// Package names verified against each game's official Google Play Store
// listing (play.google.com/store/apps/details?id=<package>) — not guessed.
export const DEFAULT_GAMES = [
  { name: "BGMI (Battlegrounds Mobile India)", packageName: "com.pubg.imobile" },
  { name: "Free Fire", packageName: "com.dts.freefireth" },
  { name: "Call of Duty: Mobile", packageName: "com.activision.callofduty.shooter" },
  { name: "PUBG Mobile", packageName: "com.tencent.ig" },
  { name: "Level Devil", packageName: "com.unept.leveldevil" },
];

const STORAGE_KEY = "configured_games_v1";

let cache = null;
const subscribers = new Set();

const notify = () => subscribers.forEach((fn) => {
  try { fn(cache); } catch (e) { /* ignore listener errors */ }
});

// Returns the current list, loading + seeding defaults from AsyncStorage on first call.
export const getGames = async () => {
  if (cache) return cache;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    cache = raw ? JSON.parse(raw) : DEFAULT_GAMES;
    if (!raw) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_GAMES));
    }
  } catch (e) {
    cache = DEFAULT_GAMES;
  }
  return cache;
};

export const saveGames = async (games) => {
  cache = games;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(games));
  notify();
  return cache;
};

export const addGame = async (name, packageName) => {
  const games = await getGames();
  const pkg = packageName.trim();
  if (!pkg) throw new Error("Package name is required");
  if (games.some((g) => g.packageName === pkg)) {
    throw new Error("This package name is already configured");
  }
  const updated = [...games, { name: name.trim() || pkg, packageName: pkg }];
  return saveGames(updated);
};

export const removeGame = async (packageName) => {
  const games = await getGames();
  const updated = games.filter((g) => g.packageName !== packageName);
  return saveGames(updated);
};

export const resetToDefaults = async () => saveGames(DEFAULT_GAMES);

// Look up a display name for a package, falling back to the raw package name.
export const nameForPackage = (games, packageName) => {
  const match = (games || []).find((g) => g.packageName === packageName);
  return match ? match.name : packageName;
};

// Subscribe to config changes (e.g. settings screen editing the list while
// the dashboard is mounted). Returns an unsubscribe function.
export const subscribeToGames = (fn) => {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
};
