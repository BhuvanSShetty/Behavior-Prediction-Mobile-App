import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  StatusBar,
  Alert,
} from "react-native";

import { getGames, addGame, removeGame, resetToDefaults } from "../utils/gameConfig";
import { refreshGameList } from "../utils/gameDetector";
import { C, S, R } from "../utils/theme";

export default function GameSettingsScreen({ navigation }) {
  const [games, setGames] = useState([]);
  const [name, setName] = useState("");
  const [pkg, setPkg] = useState("");

  const load = useCallback(async () => {
    const list = await getGames();
    setGames(list);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async () => {
    if (!pkg.trim()) {
      Alert.alert("Package name required", "Enter the exact Android package name, e.g. com.example.game");
      return;
    }
    try {
      await addGame(name, pkg.trim());
      await refreshGameList(); // push to native service immediately, no restart needed
      setName("");
      setPkg("");
      load();
    } catch (e) {
      Alert.alert("Couldn't add game", e.message);
    }
  };

  const handleRemove = (packageName) => {
    Alert.alert("Remove game", `Stop monitoring ${packageName}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          await removeGame(packageName);
          await refreshGameList();
          load();
        },
      },
    ]);
  };

  const handleReset = () => {
    Alert.alert("Reset to defaults", "This replaces your list with the default 4 games.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        onPress: async () => {
          await resetToDefaults();
          await refreshGameList();
          load();
        },
      },
    ]);
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      <View style={s.navbar}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={s.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={s.navTitle}>Configured games</Text>
        <View style={{ width: 48 }} />
      </View>

      <FlatList
        data={games}
        keyExtractor={(item) => item.packageName}
        contentContainerStyle={s.list}
        ListHeaderComponent={
          <>
            <Text style={s.sectionLabel}>Add a game</Text>
            <View style={s.addCard}>
              <TextInput
                style={s.input}
                placeholder="Display name (e.g. BGMI)"
                placeholderTextColor={C.textMuted}
                value={name}
                onChangeText={setName}
              />
              <TextInput
                style={s.input}
                placeholder="Package name (e.g. com.pubg.imobile)"
                placeholderTextColor={C.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                value={pkg}
                onChangeText={setPkg}
              />
              <TouchableOpacity style={s.addBtn} onPress={handleAdd} activeOpacity={0.85}>
                <Text style={s.addBtnText}>Add game</Text>
              </TouchableOpacity>
            </View>

            <View style={s.rowBetween}>
              <Text style={s.sectionLabel}>Monitored ({games.length})</Text>
              <TouchableOpacity onPress={handleReset}>
                <Text style={s.resetText}>Reset to defaults</Text>
              </TouchableOpacity>
            </View>
          </>
        }
        renderItem={({ item }) => (
          <View style={s.gameRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.gameName}>{item.name}</Text>
              <Text style={s.gamePkg}>{item.packageName}</Text>
            </View>
            <TouchableOpacity onPress={() => handleRemove(item.packageName)} activeOpacity={0.7}>
              <Text style={s.removeText}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text style={s.emptyText}>No games configured -- detection will do nothing until you add one.</Text>
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

  list: { paddingHorizontal: S.md, paddingBottom: 60 },

  sectionLabel: {
    color: C.textMuted,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: S.lg,
    marginBottom: S.sm,
  },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  resetText: { color: C.accent, fontSize: 12, fontWeight: "600", marginTop: S.lg },

  addCard: {
    backgroundColor: C.card,
    borderRadius: R.xl,
    borderWidth: 1,
    borderColor: C.border,
    padding: S.lg,
    gap: S.sm,
  },
  input: {
    backgroundColor: C.input,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: S.md,
    paddingVertical: 12,
    color: C.textPrimary,
    fontSize: 14,
  },
  addBtn: {
    backgroundColor: C.accent,
    borderRadius: R.md,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: S.xs,
  },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  gameRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.border,
    padding: S.md,
    marginBottom: S.sm,
  },
  gameName: { color: C.textPrimary, fontSize: 14, fontWeight: "700" },
  gamePkg: { color: C.textMuted, fontSize: 12, marginTop: 2 },
  removeText: { color: C.danger, fontSize: 13, fontWeight: "600" },

  emptyText: { color: C.textSecondary, fontSize: 13, textAlign: "center", marginTop: S.xl },
});
