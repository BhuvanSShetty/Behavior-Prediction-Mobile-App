import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
} from "react-native";

import {
  startGameDetection,
  addListener,
  hasUsagePermission,
  openUsageSettings,
} from "../utils/gameDetector";

import {
  fetchMySessions,
  submitFeedback,
  sendSession,
} from "../services/sessionService";

import { logout } from "../services/authService";
import { C, S, R, stateColor } from "../utils/theme";

// ─── State badge ──────────────────────────────────────────────────────────────
const StateBadge = ({ state }) => {
  const color = stateColor(state);
  return (
    <View style={[badge.wrap, { backgroundColor: color + "18", borderColor: color + "40" }]}>
      <View style={[badge.dot, { backgroundColor: color }]} />
      <Text style={[badge.text, { color }]}>{state || "Unknown"}</Text>
    </View>
  );
};
const badge = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: R.full, borderWidth: 1 },
  dot:  { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 12, fontWeight: "600", letterSpacing: 0.2 },
});

// ─── Section heading ──────────────────────────────────────────────────────────
const SectionLabel = ({ children }) => (
  <Text style={sl.text}>{children}</Text>
);
const sl = StyleSheet.create({
  text: {
    color: C.textMuted,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: S.lg,
    marginBottom: S.sm,
  },
});

// ─── Divider ──────────────────────────────────────────────────────────────────
const Divider = () => <View style={{ height: 1, backgroundColor: C.border }} />;

export default function Dashboard({ navigation }) {
  const [sessions,    setSessions]    = useState([]);
  const [manualStart, setManualStart] = useState(null);
  const [isPlaying,   setIsPlaying]   = useState(false);

  // Load sessions
  const load = async () => {
    try {
      const data = await fetchMySessions();
      setSessions(data || []);
    } catch (e) {
      console.log("Fetch error:", e);
    }
  };

  // Permission check
  useEffect(() => {
    (async () => {
      try {
        const ok = await hasUsagePermission();
        if (!ok) {
          alert("Enable Usage Access");
          openUsageSettings();
        }
      } catch (e) {
        console.log("Permission error:", e);
      }
    })();
  }, []);

  // Game detection
  useEffect(() => {
    let unsub;
    try {
      if (typeof addListener === "function") {
        unsub = addListener({
          onStart:  () => setIsPlaying(true),
          onEnd:    () => setIsPlaying(false),
          onResult: () => load(),
        });
      }
      startGameDetection();
      load();
    } catch (e) {
      console.log("Detection error:", e);
    }
    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, []);

  // MANUAL START
  const startManual = () => {
    if (manualStart) return;
    setManualStart(Date.now());
    setIsPlaying(true);
  };

  // MANUAL STOP
  const stopManual = async () => {
    try {
      if (!manualStart) return;
      const end = Date.now();
      await sendSession(manualStart, end);
      setManualStart(null);
      setIsPlaying(false);
      load();
    } catch (e) {
      console.log("Manual session error:", e);
    }
  };

  // FEEDBACK
  const handleFeedback = async (id, state) => {
    try {
      await submitFeedback(id, false, state);
      Alert.alert("Success", "Feedback submitted. This helps improve accuracy!");
      load();
    } catch (e) {
      console.log("Feedback error:", e);
      Alert.alert("Error", "Could not submit feedback.");
    }
  };

  // LOGOUT
  const handleLogout = async () => {
    try {
      await logout();
      navigation.replace("Login");
    } catch (e) {
      console.log("Logout error", e);
    }
  };

  // ─── Session card ─────────────────────────────────────────────────────────
  const renderItem = ({ item, index }) => {
    if (!item) return null;

    const color = stateColor(item?.prediction?.state);
    const risk  = item?.prediction?.addictionRisk ?? null;
    const state = item?.prediction?.state || "Unknown";
    const dur   = item?.raw?.duration || 0;

    return (
      <View style={card.wrap}>

        <View style={card.body}>
          {/* Top row */}
          <View style={card.topRow}>
            <View>
              <Text style={card.sessionNum}>Session {sessions.length - index}</Text>
              <Text style={card.duration}>
                {dur}
                <Text style={card.durationUnit}> min</Text>
              </Text>
            </View>
            <View style={card.rightCol}>
              <StateBadge state={state} />
              {risk !== null && (
                <Text style={[card.risk, {
                  color: risk >= 70 ? C.danger : risk >= 40 ? C.warning : C.success,
                }]}>
                  Risk score  {risk}/100
                </Text>
              )}
            </View>
          </View>

          <Divider />

          {/* Feedback row */}
          <View style={card.feedRow}>
            <Text style={card.feedLabel}>Correct state?</Text>
            <View style={card.feedBtns}>
              {[
                { state: "Normal",     color: C.success },
                { state: "Frustrated", color: C.warning },
                { state: "Addicted",   color: C.danger  },
              ].map(({ state: st, color: co }) => {
                const isActive = item?.prediction?.state === st;
                return (
                  <TouchableOpacity
                    key={st}
                    style={[
                      card.feedBtn, 
                      { borderColor: "rgba(255,255,255,0.08)" },
                      isActive && { backgroundColor: co + "15", borderColor: co + "40" }
                    ]}
                    onPress={() => handleFeedback(item._id, st)}
                    activeOpacity={0.7}>
                    <View style={[card.feedDot, { backgroundColor: co }]} />
                    <Text style={[
                      card.feedBtnText,
                      isActive && { color: co }
                    ]}>{st}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </View>
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* ── Nav bar ───────────────────────────────────────────────────── */}
      <View style={s.navbar}>
        <View>
          <Text style={s.navTitle}>Game Activity</Text>
          <Text style={s.navSub}>Level Devil tracker</Text>
        </View>
        <TouchableOpacity style={s.signOutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={s.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={sessions}
        keyExtractor={(i) => i._id || Math.random().toString()}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.list}
        ListHeaderComponent={
          <>
            {/* ── Status card ─────────────────────────────────────────── */}
            <View style={[s.statusCard, isPlaying && s.statusCardActive]}>
              <View style={s.statusRow}>
                <View style={[s.statusDot, { backgroundColor: isPlaying ? C.success : C.textMuted }]} />
                <Text style={[s.statusLabel, { color: isPlaying ? C.textPrimary : C.textSecondary }]}>
                  {isPlaying ? "Session active" : "No active session"}
                </Text>
              </View>
              <Text style={s.statusHint}>
                {isPlaying
                  ? "Recording in progress. Stop manually or detection will handle it."
                  : "Auto-detects Level Devil. You can also start a session manually."}
              </Text>

              {!isPlaying ? (
                <TouchableOpacity style={s.startBtn} onPress={startManual} activeOpacity={0.85}>
                  <Text style={s.startBtnText}>Start session</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={s.stopBtn} onPress={stopManual} activeOpacity={0.85}>
                  <Text style={s.stopBtnText}>Stop session</Text>
                </TouchableOpacity>
              )}
            </View>

            <SectionLabel>Recent sessions ({sessions.length})</SectionLabel>
          </>
        }
        ListEmptyComponent={
          <View style={s.emptyWrap}>
            <View style={s.emptyIcon}>
              <View style={s.emptyIconInner} />
            </View>
            <Text style={s.emptyTitle}>No sessions recorded</Text>
            <Text style={s.emptyBody}>
              Open Level Devil or tap Start session above to begin tracking.
            </Text>
          </View>
        }
      />
    </View>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
const card = StyleSheet.create({
  wrap: {
    backgroundColor: C.card,
    borderRadius: R.xl,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: S.md,
    overflow: "hidden",
    padding: S.lg,
    gap: S.md,
  },

  topRow:    { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  rightCol:  { alignItems: "flex-end", gap: 6 },

  sessionNum:   { color: C.textMuted, fontSize: 12, fontWeight: "600", marginBottom: 2, textTransform: "uppercase", letterSpacing: 0.5 },
  duration:     { color: C.textPrimary, fontSize: 32, fontWeight: "800", letterSpacing: -1 },
  durationUnit: { fontSize: 16, fontWeight: "500", color: C.textSecondary, letterSpacing: 0 },
  risk:         { fontSize: 12, fontWeight: "600", marginTop: 4 },

  feedRow:    { gap: S.sm, marginTop: S.xs },
  feedLabel:  { color: C.textSecondary, fontSize: 12, fontWeight: "600" },
  feedBtns:   { flexDirection: "row", gap: S.sm },
  feedBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: R.md,
    borderWidth: 1,
    backgroundColor: C.input,
  },
  feedDot:     { width: 6, height: 6, borderRadius: 3 },
  feedBtnText: { color: C.textPrimary, fontSize: 12, fontWeight: "600" },
});

// ─── Screen ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  navbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: S.lg,
    paddingVertical: S.lg,
    paddingTop: S.xl,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.03)",
  },
  navTitle: { color: C.textPrimary, fontSize: 18, fontWeight: "800", letterSpacing: -0.3 },
  navSub:   { color: C.textSecondary, fontSize: 13, marginTop: 2, fontWeight: "500" },
  signOutBtn: {
    paddingHorizontal: S.md,
    paddingVertical: 8,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.input,
  },
  signOutText: { color: C.textPrimary, fontSize: 12, fontWeight: "600" },

  list: { paddingHorizontal: S.md, paddingBottom: 60 },

  // Status card
  statusCard: {
    backgroundColor: C.card,
    borderRadius: R.xl,
    borderWidth: 1,
    borderColor: C.border,
    padding: S.xl,
    marginTop: S.md,
    gap: S.md,
  },
  statusCardActive: { borderColor: C.accent + "60", backgroundColor: C.accentSoft },
  statusRow:  { flexDirection: "row", alignItems: "center", gap: S.sm },
  statusDot:  { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { fontSize: 16, fontWeight: "700", color: C.textPrimary, letterSpacing: -0.2 },
  statusHint: { color: C.textSecondary, fontSize: 14, lineHeight: 22 }, // Renamed from selectHintText to statusHint as per original context

  startBtn: {
    backgroundColor: C.accent,
    borderRadius: R.md,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: S.xs,
  },
  startBtnText: { color: "#fff", fontWeight: "700", fontSize: 14, letterSpacing: 0.3 },

  stopBtn: {
    backgroundColor: C.input,
    borderRadius: R.md,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: S.xs,
    borderWidth: 1,
    borderColor: C.danger + "60",
  },
  stopBtnText: { color: C.danger, fontWeight: "700", fontSize: 14 },

  emptyWrap:      { alignItems: "center", paddingTop: S.xxl, paddingHorizontal: S.lg, gap: S.md },
  emptyIcon:      { width: 56, height: 56, borderRadius: R.lg, backgroundColor: C.input, alignItems: "center", justifyContent: "center", marginBottom: S.sm, borderWidth: 1, borderColor: C.border },
  emptyIconInner: { width: 24, height: 24, borderRadius: 6, backgroundColor: C.borderFocus },
  emptyTitle:     { color: C.textPrimary, fontSize: 18, fontWeight: "700", letterSpacing: -0.3 },
  emptyBody:      { color: C.textSecondary, fontSize: 14, textAlign: "center", lineHeight: 22 },
});