import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  Switch,
  Alert,
  StatusBar,
  ScrollView,
} from "react-native";

import {
  fetchChildren,
  fetchChildDash,
  updateControls,
} from "../services/parentService";

import { logout } from "../services/authService";
import { C, S, R, stateColor, riskColor } from "../utils/theme";

// ─── Stat card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, color }) => (
  <View style={sc.wrap}>
    <Text style={[sc.val, { color: color || C.textPrimary }]}>{value ?? "—"}</Text>
    <Text style={sc.label}>{label}</Text>
  </View>
);
const sc = StyleSheet.create({
  wrap:  { flex: 1, backgroundColor: C.card, borderRadius: R.lg, padding: S.md, alignItems: "center", borderWidth: 1, borderColor: C.border },
  val:   { color: C.textPrimary, fontSize: 24, fontWeight: "800", letterSpacing: -0.5 },
  label: { color: C.textSecondary, fontSize: 11, fontWeight: "600", letterSpacing: 0.5, marginTop: 4, textTransform: "uppercase" },
});

// ─── Alert pill ───────────────────────────────────────────────────────────────
const AlertPill = ({ label, color }) => (
  <View style={[ap.wrap, { backgroundColor: color + "18", borderColor: color + "40" }]}>
    <View style={[ap.dot, { backgroundColor: color }]} />
    <Text style={[ap.text, { color }]}>{label}</Text>
  </View>
);
const ap = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: R.full, borderWidth: 1 },
  dot:  { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 13, fontWeight: "600", letterSpacing: 0.2 },
});

// ─── Section label ────────────────────────────────────────────────────────────
const SectionLabel = ({ children }) => (
  <Text style={sl.t}>{children}</Text>
);
const sl = StyleSheet.create({
  t: {
    color: C.textMuted, fontSize: 11, fontWeight: "600",
    letterSpacing: 1, textTransform: "uppercase",
    marginTop: S.lg, marginBottom: S.sm,
  },
});

export default function Parent({ navigation }) {
  const [children,      setChildren]      = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [data,          setData]          = useState(null);
  const [limit,         setLimit]         = useState("");
  const [night,         setNight]         = useState(false);
  const [focusedInput,  setFocusedInput]  = useState(false);

  const load = async () => {
    try {
      const res = await fetchChildren();
      setChildren(res || []);
    } catch (e) {
      console.log("Fetch error:", e);
    }
  };

  useEffect(() => { load(); }, []);

  const open = async (child) => {
    setSelectedChild(child);
    try {
      const res = await fetchChildDash(child._id);
      setData(res);
    } catch (e) {
      console.log("Dashboard error:", e);
    }
  };

  const saveControls = async () => {
    try {
      await updateControls(selectedChild._id, {
        dailyLimitMinutes: Number(limit),
        nightRestriction: night,
      });
      Alert.alert("Controls updated");
    } catch (e) {
      Alert.alert("Update failed");
      console.log(e);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigation.replace("Login");
  };

  // ─── Child row ────────────────────────────────────────────────────────────
  const renderChild = ({ item }) => {
    const isSelected = selectedChild?._id === item._id;
    const initial    = item.name?.[0]?.toUpperCase() || "?";
    return (
      <TouchableOpacity
        style={[s.childRow, isSelected && s.childRowActive]}
        onPress={() => open(item)}
        activeOpacity={0.8}>
        <View style={[s.avatar, isSelected && s.avatarActive]}>
          <Text style={[s.avatarText, isSelected && s.avatarTextActive]}>{initial}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.childName, isSelected && { color: C.textPrimary }]}>{item.name}</Text>
          <Text style={s.childEmail}>{item.email}</Text>
        </View>
        <Text style={[s.chevron, isSelected && { color: C.accent }]}>›</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* ── Nav bar ───────────────────────────────────────────────────── */}
      <View style={s.navbar}>
        <View>
          <Text style={s.navTitle}>Parent Dashboard</Text>
          <Text style={s.navSub}>Monitor your children</Text>
        </View>
        <TouchableOpacity style={s.signOutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={s.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Children ────────────────────────────────────────────────── */}
        <SectionLabel>Linked accounts ({children.length})</SectionLabel>

        {children.length === 0 ? (
          <View style={s.emptyWrap}>
            <Text style={s.emptyTitle}>No children linked</Text>
            <Text style={s.emptyBody}>
              Ask your child to enter your user ID as their Parent Code when registering.
            </Text>
          </View>
        ) : (
          <FlatList
            data={children}
            keyExtractor={(i) => i._id}
            renderItem={renderChild}
            scrollEnabled={false}
          />
        )}

        {/* ── Selected child detail ────────────────────────────────────── */}
        {data && (
          <>
            <SectionLabel>
              {selectedChild?.name || "Child"} — today
            </SectionLabel>

            {/* Stats grid */}
            <View style={s.statsRow}>
              <StatCard label="Play time"  value={`${data.todayPlayTime}m`} color={C.info} />
              <StatCard label="Sessions"   value={data.sessionCount}        color={C.purple} />
              <StatCard label="Night"      value={data.nightSessions}       color={data.nightSessions > 0 ? C.danger : C.success} />
              <StatCard label="Trend"      value={`${data.trend > 0 ? "+" : ""}${data.trend}m`} color={data.trend > 0 ? C.danger : C.success} />
            </View>

            {/* State + risk bar */}
            <View style={s.stateCard}>
              <View style={s.stateRow}>
                <View style={[s.stateDot, { backgroundColor: stateColor(data.state) }]} />
                <Text style={[s.stateLabel, { color: stateColor(data.state) }]}>
                  {data.state}
                </Text>
                <Text style={s.riskScore}>
                  Addiction risk  {data.addictionRisk}/100
                </Text>
              </View>
              <View style={s.riskTrack}>
                <View style={[s.riskFill, {
                  width: `${Math.min(data.addictionRisk, 100)}%`,
                  backgroundColor: riskColor(data.addictionRisk),
                }]} />
              </View>
            </View>

            {/* Alert pills */}
            {data.alerts && (
              <View style={s.alertRow}>
                {Object.entries(data.alerts).map(([k, v]) =>
                  v ? (
                    <AlertPill
                      key={k}
                      label={
                        k === "addictionAlert"        ? "Addiction risk"   :
                        k === "playtimeLimitExceeded" ? "Limit exceeded"   :
                        k === "nightGamingAlert"      ? "Night gaming"     : k
                      }
                      color={
                        k === "addictionAlert"        ? C.danger  :
                        k === "playtimeLimitExceeded" ? C.warning :
                        C.purple
                      }
                    />
                  ) : null
                )}
              </View>
            )}

            {/* Controls */}
            <SectionLabel>Parental controls</SectionLabel>
            <View style={s.controlCardWrapper}>
              <View style={s.controlCard}>
                <View style={s.controlField}>
                  <Text style={s.controlLabel}>Daily play limit</Text>
                  <Text style={s.controlDesc}>Maximum minutes per day before an alert is triggered</Text>
                  <View style={s.inputRow}>
                    <TextInput
                      placeholder="e.g. 90"
                      placeholderTextColor={C.textMuted}
                      value={limit}
                      onChangeText={setLimit}
                      style={[s.input, focusedInput && s.inputFocused]}
                      keyboardType="numeric"
                      onFocus={() => setFocusedInput(true)}
                      onBlur={() => setFocusedInput(false)}
                    />
                    <View style={s.unitBox}>
                      <Text style={s.unitText}>min</Text>
                    </View>
                  </View>
                </View>

                <View style={s.divider} />

                <View style={s.switchRow}>
                  <View style={{ flex: 1, paddingRight: S.md }}>
                    <Text style={s.controlLabel}>Night restriction</Text>
                    <Text style={s.controlDesc}>Sends alert if gaming starts between 12 AM and 4 AM</Text>
                  </View>
                  <Switch
                    value={night}
                    onValueChange={setNight}
                    trackColor={{ false: C.border, true: C.accent + "80" }}
                    thumbColor={night ? C.accent : C.textSecondary}
                  />
                </View>

                <View style={s.divider} />

                <TouchableOpacity style={s.saveBtn} onPress={saveControls} activeOpacity={0.85}>
                  <Text style={s.saveBtnText}>Save controls</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {!data && children.length > 0 && (
          <View style={s.selectHint}>
            <Text style={s.selectHintText}>Select a child above to view their activity</Text>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: S.md, paddingBottom: 60 },

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
  navTitle:   { color: C.textPrimary, fontSize: 18, fontWeight: "800", letterSpacing: -0.3 },
  navSub:     { color: C.textSecondary, fontSize: 13, marginTop: 2, fontWeight: "500" },
  signOutBtn: {
    paddingHorizontal: S.md,
    paddingVertical: 8,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.input,
  },
  signOutText: { color: C.textPrimary, fontSize: 12, fontWeight: "600" },

  // Children list
  childRow: {
    flexDirection: "row", alignItems: "center", gap: S.sm,
    backgroundColor: C.card, borderRadius: R.lg,
    borderWidth: 1, borderColor: C.border,
    padding: S.md, marginBottom: S.sm,
  },
  childRowActive: { borderColor: C.accent, backgroundColor: C.accentSoft },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.input, borderWidth: 1, borderColor: C.border,
    alignItems: "center", justifyContent: "center",
  },
  avatarActive:     { backgroundColor: C.accent, borderColor: C.accent },
  avatarText:       { color: C.textSecondary, fontWeight: "700", fontSize: 18 },
  avatarTextActive: { color: "#fff" },
  childName:  { color: C.textSecondary, fontWeight: "700", fontSize: 16, letterSpacing: -0.3 },
  childEmail: { color: C.textMuted, fontSize: 13, marginTop: 2 },
  chevron:    { color: C.textMuted, fontSize: 24, fontWeight: "300" },

  emptyWrap:  { paddingVertical: S.xl, gap: S.sm, alignItems: "center" },
  emptyTitle: { color: C.textPrimary, fontWeight: "700", fontSize: 18, letterSpacing: -0.3 },
  emptyBody:  { color: C.textSecondary, fontSize: 14, lineHeight: 22, textAlign: "center", paddingHorizontal: S.md },

  // Stats
  statsRow: { flexDirection: "row", gap: S.sm, flexWrap: "wrap" },

  // State card
  stateCard: {
    backgroundColor: C.card, borderRadius: R.xl,
    borderWidth: 1, borderColor: C.border,
    padding: S.lg, marginTop: S.sm, gap: S.md,
  },
  stateRow:  { flexDirection: "row", alignItems: "center", gap: S.sm },
  stateDot:  { width: 10, height: 10, borderRadius: 5 },
  stateLabel: { fontSize: 16, fontWeight: "700", flex: 1, letterSpacing: -0.2 },
  riskScore:  { color: C.textSecondary, fontSize: 13, fontWeight: "600" },
  riskTrack:  { height: 6, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: "hidden" },
  riskFill:   { height: "100%", borderRadius: 3 },

  alertRow: { flexDirection: "row", flexWrap: "wrap", gap: S.sm, marginTop: S.md },

  // Controls
  controlCardWrapper: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
    marginBottom: S.lg,
  },
  controlCard: {
    backgroundColor: C.card, borderRadius: R.xl,
    borderWidth: 1, borderColor: C.border,
    overflow: "hidden",
  },
  controlField: { padding: S.lg, gap: 6 },
  controlLabel: { color: C.textPrimary, fontSize: 15, fontWeight: "700", letterSpacing: -0.2 },
  controlDesc:  { color: C.textSecondary, fontSize: 13, lineHeight: 19, marginBottom: S.md },
  inputRow:     { flexDirection: "row", alignItems: "center", gap: S.sm },
  input: {
    flex: 1, backgroundColor: C.input, color: C.textPrimary,
    paddingHorizontal: S.md, paddingVertical: 14,
    borderRadius: R.md, borderWidth: 1, borderColor: C.border, fontSize: 16,
    fontWeight: "500",
  },
  inputFocused: { borderColor: C.borderFocus, backgroundColor: "rgba(255,255,255,0.08)" },
  unitBox:  { paddingHorizontal: S.md, paddingVertical: 14, backgroundColor: C.input, borderRadius: R.md, borderWidth: 1, borderColor: C.border },
  unitText: { color: C.textSecondary, fontSize: 14, fontWeight: "600" },

  divider:   { height: 1, backgroundColor: C.border },
  switchRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: S.lg,
  },

  saveBtn: {
    margin: S.lg,
    backgroundColor: C.accent,
    paddingVertical: 16,
    borderRadius: R.md,
    alignItems: "center",
  },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 15, letterSpacing: 0.3 },

  selectHint:     { alignItems: "center", paddingTop: S.xxl },
  selectHintText: { color: C.textSecondary, fontSize: 14 },
});