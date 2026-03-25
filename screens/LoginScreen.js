import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  StatusBar,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { login } from "../services/authService";
import { C, S, R } from "../utils/theme";

export default function LoginScreen({ navigation }) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [focused,  setFocused]  = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      
      const user = await login(email, password);

      
      if (user.role === "parent") {
        navigation.replace("Parent");
      } else {
        navigation.replace("Dashboard");
      }
    } catch (e) {
      Alert.alert("Login Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="height">
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {/* ── Brand mark ────────────────────────────────────────────── */}
          <View style={s.brandWrap}>
            <View style={s.logoMark}>
              <View style={s.logoInner} />
            </View>
            <Text style={s.appName}>GameMonitor</Text>
            <Text style={s.tagline}>Behavioural tracking for responsible gaming</Text>
          </View>

          {/* ── Card ──────────────────────────────────────────────────── */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Sign in</Text>
            <Text style={s.cardSub}>Enter your credentials to continue</Text>

            <View style={s.form}>
              <View style={s.fieldWrap}>
                <Text style={s.fieldLabel}>Email address</Text>
                <TextInput
                  placeholder="you@example.com"
                  placeholderTextColor={C.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  style={[s.input, focused === "email" && s.inputFocused]}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused("")}
                />
              </View>

              <View style={s.fieldWrap}>
                <Text style={s.fieldLabel}>Password</Text>
                <TextInput
                  placeholder="Enter your password"
                  placeholderTextColor={C.textMuted}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  style={[s.input, focused === "password" && s.inputFocused]}
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused("")}
                />
              </View>

              <TouchableOpacity
                style={[s.btn, loading && s.btnLoading]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.85}>
                <Text style={s.btnText}>
                  {loading ? "Signing in..." : "Sign in"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Footer ────────────────────────────────────────────────── */}
          <View style={s.footer}>
            <Text style={s.footerText}>Don't have an account?  </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={s.footerLink}>Create account</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: S.lg,
    paddingBottom: S.xl,
    justifyContent: "center",
  },

  // Brand
  brandWrap: { alignItems: "center", marginBottom: S.xl, paddingTop: 60 },
  logoMark: {
    width: 48,
    height: 48,
    borderRadius: R.md,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: S.md,
  },
  logoInner: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: C.bg,
    opacity: 0.6,
  },
  appName: {
    fontSize: 22,
    fontWeight: "700",
    color: C.textPrimary,
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 13,
    color: C.textSecondary,
    textAlign: "center",
    letterSpacing: 0.2,
  },

  // Card
  card: {
    backgroundColor: C.card,
    borderRadius: R.xl,
    borderWidth: 1,
    borderColor: C.border,
    padding: S.lg,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: C.textPrimary,
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 13,
    color: C.textSecondary,
    marginBottom: S.lg,
  },

  // Form
  form:      { gap: S.md },
  fieldWrap: { gap: 6 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: C.textSecondary,
  },
  input: {
    backgroundColor: C.input,
    color: C.textPrimary,
    paddingHorizontal: S.md,
    paddingVertical: 14,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.border,
    fontSize: 15,
  },
  inputFocused: {
    borderColor: C.accent,
  },
  btn: {
    backgroundColor: C.accent,
    paddingVertical: 15,
    borderRadius: R.md,
    alignItems: "center",
    marginTop: S.xs,
  },
  btnLoading: { opacity: 0.55 },
  btnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
    letterSpacing: 0.3,
  },

  // Footer
  footer:     { flexDirection: "row", justifyContent: "center", marginTop: S.xl },
  footerText: { color: C.textSecondary, fontSize: 14 },
  footerLink: {
    color: C.accent,
    fontSize: 14,
    fontWeight: "600",
  },
});