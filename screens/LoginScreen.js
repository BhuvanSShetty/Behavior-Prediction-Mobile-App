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
  Platform,
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
    console.log("--- ATTEMPTING LOGIN ---");
    console.log("Email:", email);
    
    try {
      const user = await login(email, password);
      console.log("Login Success! Received User:", user);
      console.log("User Role is:", user?.role);

      if (user?.role === "parent") {
        console.log("Navigating to Parent...");
        navigation.replace("Parent");
      } else {
        console.log("Navigating to Dashboard...");
        navigation.replace("Dashboard");
      }
    } catch (e) {
      console.log("HANDLE LOGIN CAUGHT ERROR:", e);
      Alert.alert("Login Failed", e?.response?.data?.message || "Verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {/* ── Brand mark ────────────────────────────────────────────── */}
          <View style={s.brandWrap}>
            <View style={s.logoMark}>
              <View style={s.logoInner} />
            </View>
            <Text style={s.appName}>BehaveTrack</Text>
            <Text style={s.tagline}>Behavior Detection System</Text>
          </View>

          {/* ── Card ──────────────────────────────────────────────────── */}
          <View style={s.cardWrapper}>
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
                  onSubmitEditing={handleLogin}  // <-- FIX FOR KEYBOARD SUBMIT TRIGGERING
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
        </View>

          {/* ── Footer ────────────────────────────────────────────────── */}
          <View style={s.footer}>
            <Text style={s.footerText}>Don't have an account?  </Text>
            <TouchableOpacity 
              disabled={loading}
              onPress={() => navigation.navigate("Register")}
            >
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
    paddingTop: S.xxl,
    paddingBottom: 40,
  },

  // Brand
  brandWrap: { alignItems: "center", marginBottom: S.xl, paddingTop: 40 },
  logoMark: {
    width: 48,
    height: 48,
    borderRadius: R.lg,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: S.md,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  logoInner: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: C.accent,
  },
  appName: {
    fontSize: 28,
    fontWeight: "800",
    color: C.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 14,
    color: C.textSecondary,
    fontWeight: "500",
    letterSpacing: 0.3,
  },

  // Card
  cardWrapper: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.8,
    shadowRadius: 40,
    elevation: 20,
    zIndex: 50,
  },
  card: {
    backgroundColor: C.card,
    borderRadius: R.xl,
    borderWidth: 1,
    borderColor: C.border,
    padding: S.xl,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: C.textPrimary,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  cardSub: {
    fontSize: 14,
    color: C.textSecondary,
    marginBottom: S.lg + S.sm,
  },

  // Form
  form:      { gap: S.md },
  fieldWrap: { gap: 8 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: C.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: C.input,
    color: C.textPrimary,
    paddingHorizontal: S.md,
    paddingVertical: 16,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.border,
    fontSize: 15,
  },
  inputFocused: {
    borderColor: C.borderFocus,
    backgroundColor: "rgba(255,255,255,0.08)",
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
  footer: { 
    flexDirection: "row", 
    justifyContent: "center", 
    marginTop: 80, 
    paddingBottom: 40,
    zIndex: -1,
    elevation: 0,
  },
  footerText: { color: C.textSecondary, fontSize: 14 },
  footerLink: {
    color: C.accent,
    fontSize: 14,
    fontWeight: "600",
    padding: 10,  // increasing hit area for exact targeting
    marginTop: -10, // balancing padding visually
  },
});