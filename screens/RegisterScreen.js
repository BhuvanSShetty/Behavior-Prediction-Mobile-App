import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { register } from "../services/authService";
import { C, S, R } from "../utils/theme";

const AGE_GROUPS = ["10-12", "13-15", "16-18", "19-24", "24+"];

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "child",
    ageGroup: "13-15",
    parentCode: "",
  });

  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleRegister = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      Alert.alert("Missing fields", "Name, email and password required");
      return;
    }

    setLoading(true);
    try {
      const user = await register({
        ...form,
        email: form.email.toLowerCase(),
      });

      if (user.role === "parent") {
        navigation.replace("Parent");
      } else {
        navigation.replace("Dashboard");
      }
    } catch (err) {
      Alert.alert("Error", err?.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* ✅ FIXED Keyboard handling */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={s.container}>
            
            {/* Header */}
          <View style={s.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
              <Text style={s.backText}>← Back</Text>
            </TouchableOpacity>
          </View>

          <View style={s.cardWrapper}>
            <View style={s.card}>
              <Text style={s.title}>Create account</Text>
              <Text style={s.sub}>Set up your monitoring profile</Text>

              <View style={s.form}>
                {/* Role Selection */}
                <View style={s.section}>
                  <Text style={s.fieldLabel}>Account type</Text>

                  <View style={s.roleGroup}>
                    {[
                      { key: "parent", label: "Parent / Guardian" },
                      { key: "child", label: "Child / Player" },
                    ].map((item) => (
                      <TouchableOpacity
                        key={item.key}
                        activeOpacity={0.8}
                        style={[
                          s.roleBtn,
                          form.role === item.key && s.roleBtnActive,
                        ]}
                        onPress={() => set("role", item.key)}
                      >
                        <Text style={[
                          s.roleText,
                          form.role === item.key && s.roleTextActive
                        ]}>{item.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Inputs */}
                <View style={s.fieldWrap}>
                  <Text style={s.fieldLabel}>Full name</Text>
                  <TextInput
                    placeholder="Enter full name"
                    placeholderTextColor={C.textMuted}
                    style={[s.input, focused === "name" && s.inputFocused]}
                    value={form.name}
                    onChangeText={(v) => set("name", v)}
                    onFocus={() => setFocused("name")}
                    onBlur={() => setFocused("")}
                  />
                </View>

                <View style={s.fieldWrap}>
                  <Text style={s.fieldLabel}>Email address</Text>
                  <TextInput
                    placeholder="you@example.com"
                    placeholderTextColor={C.textMuted}
                    style={[s.input, focused === "email" && s.inputFocused]}
                    value={form.email}
                    onChangeText={(v) => set("email", v)}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    onFocus={() => setFocused("email")}
                    onBlur={() => setFocused("")}
                  />
                </View>

                <View style={s.fieldWrap}>
                  <Text style={s.fieldLabel}>Password</Text>
                  <TextInput
                    placeholder="Create a strong password"
                    placeholderTextColor={C.textMuted}
                    style={[s.input, focused === "password" && s.inputFocused]}
                    value={form.password}
                    onChangeText={(v) => set("password", v)}
                    secureTextEntry
                    onFocus={() => setFocused("password")}
                    onBlur={() => setFocused("")}
                  />
                </View>

                {/* Parent Code */}
                {form.role === "child" && (
                  <View style={s.fieldWrap}>
                    <Text style={s.fieldLabel}>Parent Code (Optional)</Text>
                    <TextInput
                      placeholder="e.g. 64b8d9..."
                      placeholderTextColor={C.textMuted}
                      style={[s.input, focused === "code" && s.inputFocused]}
                      value={form.parentCode}
                      onChangeText={(v) => set("parentCode", v)}
                      onFocus={() => setFocused("code")}
                      onBlur={() => setFocused("")}
                    />
                  </View>
                )}

                {/* Age */}
                {form.role === "child" && (
                  <View style={s.section}>
                    <Text style={s.fieldLabel}>Age group</Text>
                    <View style={s.ageRow}>
                      {AGE_GROUPS.map((g) => (
                        <TouchableOpacity
                          key={g}
                          activeOpacity={0.8}
                          style={[
                            s.ageBtn,
                            form.ageGroup === g && s.ageBtnActive,
                          ]}
                          onPress={() => set("ageGroup", g)}
                        >
                          <Text style={[
                            s.ageText, 
                            form.ageGroup === g && s.ageTextActive
                          ]}>{g}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Button */}
                <TouchableOpacity
                  style={[s.btn, loading && s.btnLoading]}
                  onPress={handleRegister}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={s.btnText}>Create account</Text>
                  )}
                </TouchableOpacity>

              </View>
            </View>
          </View>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  scrollContent: {
    flexGrow: 1,
    paddingTop: S.xl,
    paddingBottom: 40,
  },

  container: {
    flex: 1,
    paddingHorizontal: S.lg,
    justifyContent: "center",
  },

  headerRow: {
    marginBottom: S.lg,
    alignItems: "flex-start",
    zIndex: 50,
    elevation: 50,
  },
  backBtn: {
    paddingVertical: S.sm,
    paddingHorizontal: S.sm,
    marginLeft: -S.sm,
  },
  backText: {
    color: C.textSecondary,
    fontSize: 15,
    fontWeight: "600",
  },

  // Card Structure
  cardWrapper: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.8,
    shadowRadius: 40,
    elevation: 20,
  },
  card: {
    backgroundColor: C.card,
    borderRadius: R.xl,
    borderWidth: 1,
    borderColor: C.border,
    padding: S.xl,
  },

  title: {
    fontSize: 24,
    color: C.textPrimary,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  sub: {
    fontSize: 14,
    color: C.textSecondary,
    marginBottom: S.xl,
  },

  form: { gap: S.md },
  fieldWrap: { gap: 8 },
  section: { gap: 8 },
  
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: C.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Form Controls
  roleGroup: {
    flexDirection: "row",
    gap: S.sm,
  },
  roleBtn: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: C.input,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
  },
  roleBtnActive: {
    backgroundColor: "rgba(99,102,241,0.15)",
    borderColor: C.borderFocus,
  },
  roleText: { color: C.textSecondary, fontWeight: "600", fontSize: 13 },
  roleTextActive: { color: C.accentDim },

  input: {
    backgroundColor: C.input,
    paddingHorizontal: S.md,
    paddingVertical: 16,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.border,
    color: C.textPrimary,
    fontSize: 15,
  },
  inputFocused: {
    borderColor: C.borderFocus,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  ageRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  ageBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: C.input,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.border,
  },
  ageBtnActive: {
    backgroundColor: "rgba(99,102,241,0.15)",
    borderColor: C.borderFocus,
  },
  ageText: { color: C.textSecondary, fontSize: 13, fontWeight: "600" },
  ageTextActive: { color: C.accentDim },

  btn: {
    backgroundColor: C.accent,
    paddingVertical: 15,
    borderRadius: R.md,
    alignItems: "center",
    marginTop: S.sm,
  },
  btnLoading: { opacity: 0.6 },
  btnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
    letterSpacing: 0.3,
  },
});