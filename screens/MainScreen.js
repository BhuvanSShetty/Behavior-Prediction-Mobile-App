import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import Dashboard from "./DashboardScreen";
import Parent from "./ParentScreen";

const Tab = createBottomTabNavigator();

export default function MainScreen() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Dashboard" component={Dashboard} />
      <Tab.Screen name="Parent" component={Parent} />
    </Tab.Navigator>
  );
}