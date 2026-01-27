/**
 * ProfileImageHeader - Native Edge-to-Edge Profile Image Header
 * 
 * A platform-native image header that:
 * - Extends edge-to-edge (native iOS 26 / Android 16 pattern)
 * - Compensates for safe area so the visible content isn't obscured
 * - Adds top gradient for status bar readability
 * - Provides consistent header overlay positioning
 * 
 * The image extends behind the status bar but the height is calculated
 * so the meaningful content (user's face) appears below the safe area.
 */

import React, { useMemo } from "react";
import {
  ImageBackground,
  ImageSourcePropType,
  Platform,
  StyleSheet,
  View,
  ViewStyle,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ProfileImageHeaderProps {
  /** Image source (uri object or require) */
  source: ImageSourcePropType | { uri: string };
  /** The visible height of the image BELOW the safe area (default: 300) */
  visibleHeight?: number;
  /** Use percentage of screen height instead of fixed pixel value */
  visibleHeightPercent?: number;
  /** Whether to show top gradient for status bar readability (default: true) */
  showTopGradient?: boolean;
  /** Whether to show bottom gradient for overlay text readability (default: true) */
  showBottomGradient?: boolean;
  /** Optional dark overlay opacity (0-1, default: 0.15) */
  overlayOpacity?: number;
  /** Children rendered as overlay content (buttons, text, etc.) */
  children?: React.ReactNode;
  /** Style for the container */
  style?: ViewStyle;
  /** Content positioned at the top (below safe area) */
  topContent?: React.ReactNode;
  /** Content positioned at the bottom of the image */
  bottomContent?: React.ReactNode;
}

export default function ProfileImageHeader({
  source,
  visibleHeight = 300,
  visibleHeightPercent,
  showTopGradient = true,
  showBottomGradient = true,
  overlayOpacity = 0.15,
  children,
  style,
  topContent,
  bottomContent,
}: ProfileImageHeaderProps) {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  
  // Calculate the total image height
  // The image extends behind the status bar, but we add that height
  // so the visible portion below the safe area matches the desired height
  const totalImageHeight = useMemo(() => {
    if (visibleHeightPercent !== undefined) {
      // Use percentage of screen height for the visible portion
      const visible = screenHeight * (visibleHeightPercent / 100);
      return visible + insets.top;
    }
    // Use fixed pixel value for the visible portion
    return visibleHeight + insets.top;
  }, [visibleHeight, visibleHeightPercent, screenHeight, insets.top]);
  
  // Check if source is a uri object for expo-image or a require for ImageBackground
  const isUriSource = source && typeof source === 'object' && 'uri' in source;
  
  return (
    <View style={[styles.container, { height: totalImageHeight }, style]}>
      {/* Image - using expo-image for URI sources, ImageBackground for requires */}
      {isUriSource ? (
        <Image
          source={source as { uri: string }}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <ImageBackground
          source={source as ImageSourcePropType}
          style={styles.image}
          resizeMode="cover"
        />
      )}
      
      {/* Dark overlay for better contrast */}
      {overlayOpacity > 0 && (
        <View 
          style={[
            styles.darkOverlay, 
            { backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})` }
          ]} 
        />
      )}
      
      {/* Top gradient for status bar readability */}
      {showTopGradient && (
        <LinearGradient
          colors={[
            "rgba(0, 0, 0, 0.5)",
            "rgba(0, 0, 0, 0.3)",
            "rgba(0, 0, 0, 0.1)",
            "transparent",
          ]}
          locations={[0, 0.3, 0.6, 1]}
          style={styles.topGradient}
          pointerEvents="none"
        />
      )}
      
      {/* Bottom gradient for overlay text readability */}
      {showBottomGradient && (
        <LinearGradient
          colors={[
            "transparent",
            "rgba(0, 0, 0, 0.1)",
            "rgba(0, 0, 0, 0.4)",
            "rgba(0, 0, 0, 0.6)",
          ]}
          locations={[0, 0.3, 0.7, 1]}
          style={styles.bottomGradient}
          pointerEvents="none"
        />
      )}
      
      {/* Top content area - positioned below safe area */}
      {topContent && (
        <View style={[styles.topContentArea, { paddingTop: insets.top + 8 }]}>
          {topContent}
        </View>
      )}
      
      {/* Bottom content area */}
      {bottomContent && (
        <View style={styles.bottomContentArea}>
          {bottomContent}
        </View>
      )}
      
      {/* Additional children (for custom positioning) */}
      {children}
    </View>
  );
}

// Helper component for header buttons
interface HeaderButtonAreaProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function HeaderButtonArea({ children, style }: HeaderButtonAreaProps) {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[styles.headerButtonArea, { paddingTop: insets.top + 8 }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    width: "100%",
    overflow: "hidden",
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  topGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  bottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 140,
  },
  topContentArea: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    zIndex: 10,
  },
  bottomContentArea: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
    zIndex: 10,
  },
  headerButtonArea: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    zIndex: 10,
  },
});
