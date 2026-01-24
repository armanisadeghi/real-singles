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
import { COMPONENT_SIZES, TYPOGRAPHY, BORDER_RADIUS } from "@/constants/designTokens";

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
        style={[
          {
            borderRadius: BORDER_RADIUS.full,
            paddingVertical: COMPONENT_SIZES.button.medium.paddingVertical,
            paddingHorizontal: COMPONENT_SIZES.button.medium.paddingHorizontal,
            minHeight: COMPONENT_SIZES.button.medium.height,
            width: "100%",
            justifyContent: "center",
            alignItems: "center",
          },
          containerStyle
        ]}
      >
        {text ? (
          <Text
            style={[
              TYPOGRAPHY.button,
              {
                color: "#fff",
                textAlign: "center",
              },
              textStyle
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
