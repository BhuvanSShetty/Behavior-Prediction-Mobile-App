import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  NativeModules,
} from "react-native";
import { C, S, R } from "../utils/theme";

const { UsageStatsModule } = NativeModules || {};

// Shows the raw log of every foreground-app-change event the native service
// has seen, most recent first. Purely diagnostic -- lets us see exactly
// which package interrupted a session without needing adb/logcat.
export default function DebugLogScreen({ navigation }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!UsageStatsModule || !UsageStatsModule.getEventLog) return;
    setLoading(true);
    try {
      const log = await UsageStatsModule.getEventLog();
      setEvents([...(log || [])].reverse());
    } catch (e) {
      // ignore
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <View style={s.navbar}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={s.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={s.navTitle}>Detection log</Text>
        <TouchableOpacity onPress={load} activeOpacity={0.7}>
          <Text style={s.backText}>{loading ? "..." : "Refresh"}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={events}
        keyExtractor={(item, i) => `${item.time}-${i}`}
        contentContainerStyle={s.list}
        renderItem={({ item }) => (
          <View style={s.row}>
            <Text style={s.time}>{new Date(item.time).toLocaleTimeString()}</Text>
            <Text style={s.pkg}>{item.pkg}</Text>
            <Text style={s.type}>type {item.type}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={s.emptyText}>
            No events logged yet. Play a game for a bit, then come back and tap Refresh.
          </Text>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  navbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: S.lg,
    paddingVertical: S.lg,
    paddingTop: S.xl,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.03)",
  },
  backText: { color: C.accent, fontSize: 15, fontWeight: "600" },
  navTitle: { color: C.textPrimary, fontSize: 16, fontWeight: "800" },
  list: { padding: S.md },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.border,
    padding: S.sm,
    marginBottom: 6,
    gap: 8,
  },
  time: { color: C.textMuted, fontSize: 11, width: 90 },
  pkg: { color: C.textPrimary, fontSize: 12, flex: 1 },
  type: { color: C.accent, fontSize: 11 },
  emptyText: { color: C.textSecondary, fontSize: 13, textAlign: "center", marginTop: S.xl, padding: S.lg },
});
