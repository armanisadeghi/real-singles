import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { ViewStyle } from "react-native";

export default function LinearBg({ children, className, style }: { children: React.ReactNode, className?: string, style?: ViewStyle }) {
  return (
    <LinearGradient
      colors={["#B06D1E", "#F99F2D", "#B06D1E", "#F99F2D", "#B06D1E"]}
      start={{ x: 0, y: 0}}
      end={{ x: 1, y: 1 }}
      className={className}
      style={[style]}
    >
      {children}
    </LinearGradient>
  );
}
