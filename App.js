import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import Login from "./screens/LoginScreen";
import Register from "./screens/RegisterScreen";
import Dashboard from "./screens/DashboardScreen";
import Parent from "./screens/ParentScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Auth */}
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Register" component={Register} />

        {/* Role based */}
        <Stack.Screen name="Dashboard" component={Dashboard} />
        <Stack.Screen name="Parent" component={Parent} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}