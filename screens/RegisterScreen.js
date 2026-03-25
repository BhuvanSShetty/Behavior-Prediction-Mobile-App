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
        <View style={s.container}>
          
          {/* Header */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Text style={s.backText}>Back</Text>
          </TouchableOpacity>

          <Text style={s.title}>Create account</Text>
          <Text style={s.sub}>Set up your monitoring profile</Text>

          {/* Role Selection */}
          <View style={s.section}>
            <Text style={s.sectionLabel}>Account type</Text>

            {[
              { key: "child", label: "Player" },
              { key: "parent", label: "Guardian" },
            ].map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[
                  s.roleBtn,
                  form.role === item.key && s.roleBtnActive,
                ]}
                onPress={() => set("role", item.key)}
              >
                <Text style={s.roleText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Inputs */}
          <TextInput
            placeholder="Name"
            placeholderTextColor={C.textMuted}
            style={[s.input, focused === "name" && s.inputFocused]}
            value={form.name}
            onChangeText={(v) => set("name", v)}
            onFocus={() => setFocused("name")}
            onBlur={() => setFocused("")}
          />

          <TextInput
            placeholder="Email"
            placeholderTextColor={C.textMuted}
            style={[s.input, focused === "email" && s.inputFocused]}
            value={form.email}
            onChangeText={(v) => set("email", v)}
            autoCapitalize="none"
            keyboardType="email-address"
            onFocus={() => setFocused("email")}
            onBlur={() => setFocused("")}
          />

          <TextInput
            placeholder="Password"
            placeholderTextColor={C.textMuted}
            style={[s.input, focused === "password" && s.inputFocused]}
            value={form.password}
            onChangeText={(v) => set("password", v)}
            secureTextEntry
            onFocus={() => setFocused("password")}
            onBlur={() => setFocused("")}
          />

          {/* Age */}
          {form.role === "child" && (
            <View style={s.ageRow}>
              {AGE_GROUPS.map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[
                    s.ageBtn,
                    form.ageGroup === g && s.ageBtnActive,
                  ]}
                  onPress={() => set("ageGroup", g)}
                >
                  <Text style={s.ageText}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Parent Code */}
          {form.role === "child" && (
            <TextInput
              placeholder="Parent Code (optional)"
              placeholderTextColor={C.textMuted}
              style={s.input}
              value={form.parentCode}
              onChangeText={(v) => set("parentCode", v)}
            />
          )}

          {/* Button */}
          <TouchableOpacity
            style={s.btn}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.btnText}>Register</Text>
            )}
          </TouchableOpacity>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  container: {
    flex: 1,
    padding: S.lg,
  },

  backBtn: { marginBottom: S.md },
  backText: { color: C.textSecondary },

  title: {
    fontSize: 26,
    color: C.textPrimary,
    fontWeight: "bold",
  },

  sub: {
    color: C.textSecondary,
    marginBottom: S.lg,
  },

  section: { marginBottom: S.lg },
  sectionLabel: { color: C.textSecondary },

  roleBtn: {
    padding: S.md,
    backgroundColor: C.card,
    borderRadius: R.md,
    marginTop: S.sm,
  },

  roleBtnActive: {
    backgroundColor: C.accentSoft,
  },

  roleText: { color: C.textPrimary },

  input: {
    backgroundColor: C.input,
    padding: S.md,
    borderRadius: R.md,
    marginBottom: S.md,
    borderWidth: 1,
    borderColor: C.border,
    color: C.textPrimary,
  },

  inputFocused: {
    borderColor: C.accent,
  },

  ageRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: S.sm,
    marginBottom: S.md,
  },

  ageBtn: {
    padding: S.sm,
    backgroundColor: C.card,
    borderRadius: R.full,
  },

  ageBtnActive: {
    backgroundColor: C.accentSoft,
  },

  ageText: { color: C.textPrimary },

  btn: {
    backgroundColor: C.accent,
    padding: S.md,
    borderRadius: R.md,
    alignItems: "center",
  },

  btnText: {
    color: "#fff",
    fontWeight: "bold",
  },
});