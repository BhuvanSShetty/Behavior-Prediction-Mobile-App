import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import Login from "./screens/LoginScreen";
import Register from "./screens/RegisterScreen";
import Dashboard from "./screens/DashboardScreen";
import Parent from "./screens/ParentScreen";
import GameSettings from "./screens/GameSettingsScreen";
import AuthLoading from "./screens/AuthLoadingScreen";
import DebugLog from "./screens/DebugLogScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="AuthLoading">
        {/* Startup: decides Login vs Dashboard based on saved token */}
        <Stack.Screen name="AuthLoading" component={AuthLoading} />

        {/* Auth */}
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Register" component={Register} />

        {/* Role based */}
        <Stack.Screen name="Dashboard" component={Dashboard} />
        <Stack.Screen name="Parent" component={Parent} />
        <Stack.Screen name="GameSettings" component={GameSettings} />
        <Stack.Screen name="DebugLog" component={DebugLog} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}