import { LinearGradient } from "expo-linear-gradient";
import React, { ReactNode } from "react";
import {
  StyleProp,
  Text,
  TextStyle,
  TouchableOpacity,
  TouchableOpacityProps,
  ViewStyle,
} from "react-native";

interface GradientButtonProps extends TouchableOpacityProps {
  colors?: string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  containerStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  text?: string;
  children?: ReactNode;
}

const GradientButton: React.FC<GradientButtonProps> = ({
  colors = ["#B06D1E", "#F99F2D", "#B06D1E", "#F99F2D", "#B06D1E"],
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
  containerStyle,
  textStyle,
  text,
  children,
  ...touchableProps
}) => {
  return (
    <TouchableOpacity activeOpacity={0.8} {...touchableProps}>
      <LinearGradient
        colors={["#B06D1E", "#F99F2D", "#B06D1E", "#F99F2D", "#B06D1E"]}
        start={start}
        end={end}
        className="text-center py-5"
        style={[
          {
            borderRadius: 99,
            paddingVertical: 16, // Add vertical padding here
            width: "100%", // Make sure button takes full width
          },containerStyle
        ]}
      >
        {text ? (
          <Text
            style={[
              {
                color: "#fff", // Ensure text is white
                textAlign: "center", // Ensure text is centered
                fontWeight: "500", // Make text semi-bold
                fontSize: 16, // Set appropriate font size
              },
            ]}
          >
            {text}
          </Text>
        ) : (
          children
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default GradientButton;
