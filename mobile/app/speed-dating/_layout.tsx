import { Stack } from "expo-router";
import { Platform } from "react-native";

export default function SpeedDatingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: "Back",
        headerLargeTitle: Platform.OS === "ios",
        headerLargeTitleShadowVisible: false,
        headerBlurEffect: Platform.OS === "ios" ? "regular" : undefined,
        headerTransparent: Platform.OS === "ios",
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Speed Dating",
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: "Session Details",
          headerLargeTitle: false,
        }}
      />
    </Stack>
  );
}
