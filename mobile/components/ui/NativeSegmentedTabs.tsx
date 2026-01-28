/**
 * NativeSegmentedTabs
 * 
 * A wrapper component that uses native SegmentedControl on iOS
 * and styled tabs on Android, with haptic feedback.
 * 
 * @example
 * <NativeSegmentedTabs
 *   tabs={["Likes You", "Matches"]}
 *   selectedIndex={activeTab}
 *   onSelect={(index) => setActiveTab(index)}
 *   badges={[likesCount, matchesCount]}
 * />
 */

import SegmentedControl from "@react-native-segmented-control/segmented-control";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Platform,
  PlatformColor,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  ViewStyle,
} from "react-native";
import { SPACING } from "@/constants/designTokens";

interface NativeSegmentedTabsProps {
  /** Array of tab labels */
  tabs: string[];
  /** Currently selected tab index */
  selectedIndex: number;
  /** Callback when a tab is selected */
  onSelect: (index: number) => void;
  /** Optional array of badge counts for each tab */
  badges?: (number | undefined)[];
  /** Optional container style */
  style?: ViewStyle;
  /** Optional primary color for Android (iOS uses system tint) */
  primaryColor?: string;
}

export function NativeSegmentedTabs({
  tabs,
  selectedIndex,
  onSelect,
  badges,
  style,
  primaryColor = "#B06D1E",
}: NativeSegmentedTabsProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const handleSelect = (index: number) => {
    if (index !== selectedIndex) {
      Haptics.selectionAsync();
      onSelect(index);
    }
  };

  // iOS uses native SegmentedControl
  if (Platform.OS === "ios") {
    return (
      <View style={[styles.container, style]}>
        <SegmentedControl
          values={tabs}
          selectedIndex={selectedIndex}
          onChange={(event) => handleSelect(event.nativeEvent.selectedSegmentIndex)}
        />
        {/* Badges overlay for iOS - positioned above segmented control */}
        {badges && badges.some((b) => b !== undefined && b > 0) && (
          <View style={styles.badgesContainer} pointerEvents="none">
            {tabs.map((_, index) => {
              const badgeCount = badges[index];
              if (!badgeCount || badgeCount <= 0) return <View key={index} style={styles.badgePlaceholder} />;
              return (
                <View key={index} style={styles.badgePlaceholder}>
                  <View style={styles.iosBadge}>
                    <Text style={styles.iosBadgeText}>
                      {badgeCount > 99 ? "99+" : badgeCount}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    );
  }

  // Android uses styled tabs
  const androidColors = {
    background: isDark ? "#2C2C2E" : "#E5E7EB",
    selectedBackground: primaryColor,
    text: isDark ? "#9CA3AF" : "#4B5563",
    selectedText: "#FFFFFF",
  };

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.androidTabsContainer, { backgroundColor: androidColors.background }]}>
        {tabs.map((label, index) => {
          const isSelected = index === selectedIndex;
          const badgeCount = badges?.[index];

          return (
            <Pressable
              key={label}
              onPress={() => handleSelect(index)}
              style={({ pressed }) => [
                styles.androidTab,
                isSelected && { backgroundColor: androidColors.selectedBackground },
                pressed && !isSelected && styles.androidTabPressed,
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected: isSelected }}
            >
              <Text
                style={[
                  styles.androidTabText,
                  { color: isSelected ? androidColors.selectedText : androidColors.text },
                ]}
              >
                {label}
              </Text>
              {badgeCount !== undefined && badgeCount > 0 && (
                <View style={[styles.androidBadge, isSelected && styles.androidBadgeSelected]}>
                  <Text style={styles.androidBadgeText}>
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING?.screenPadding ?? 16,
    paddingVertical: SPACING?.sm ?? 8,
  },
  // iOS badge styles
  badgesContainer: {
    position: "absolute",
    top: 0,
    left: SPACING?.screenPadding ?? 16,
    right: SPACING?.screenPadding ?? 16,
    flexDirection: "row",
    height: "100%",
  },
  badgePlaceholder: {
    flex: 1,
    alignItems: "flex-end",
    justifyContent: "center",
    paddingRight: 8,
  },
  iosBadge: {
    backgroundColor: Platform.OS === "ios"
      ? (PlatformColor("systemRed") as unknown as string)
      : "#FF3B30",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: "center",
  },
  iosBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
  // Android styles
  androidTabsContainer: {
    flexDirection: "row",
    borderRadius: 8,
    overflow: "hidden",
  },
  androidTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING?.sm ?? 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  androidTabPressed: {
    opacity: 0.7,
  },
  androidTabText: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  androidBadge: {
    backgroundColor: "#FF3B30",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: "center",
  },
  androidBadgeSelected: {
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  androidBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
});
