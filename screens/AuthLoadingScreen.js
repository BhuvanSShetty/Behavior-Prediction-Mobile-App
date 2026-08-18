import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { C } from "../utils/theme";

// Runs once on app startup. If a login token is already saved from a
// previous session, skip straight to the Dashboard instead of forcing the
// user to log in again every time the app is opened/reopened.
export default function AuthLoadingScreen({ navigation }) {
  useEffect(() => {
    (async () => {
      let token = null;
      try {
        token = await AsyncStorage.getItem("auth_token");
      } catch (e) {
        // if storage itself fails, fall through to Login same as no token
      }
      navigation.replace(token ? "Dashboard" : "Login");
    })();
  }, [navigation]);

  return (
    <View style={s.root}>
      <ActivityIndicator size="large" color={C.accent} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg, alignItems: "center", justifyContent: "center" },
});
