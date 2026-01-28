/**
 * Matches Screen
 * 
 * Displays mutual matches - users who have both liked each other.
 * Calls the /api/matches endpoint to maintain SSOT with web.
 */

import NotificationBell from "@/components/NotificationBell";
import ProfileListItem from "@/components/ui/ProfileListItem";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { PlatformIcon } from "@/components/ui/PlatformIcon";
import { VERTICAL_SPACING } from "@/constants/designTokens";
import { useThemeColors } from "@/context/ThemeContext";
import { getMatches } from "@/lib/api";
import { User } from "@/types";
import * as Haptics from "expo-haptics";
import { SymbolView } from "expo-symbols";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  PlatformColor,
  RefreshControl,
  Text,
  useColorScheme,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

// API response type
interface MatchResponse {
  user_id: string;
  display_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  age?: number | null;
  gender?: string | null;
  city?: string | null;
  state?: string | null;
  occupation?: string | null;
  bio?: string | null;
  is_verified: boolean;
  profile_image_url?: string | null;
  gallery?: { media_url: string }[];
  last_active_at?: string | null;
  matched_at?: string | null;
  conversation_id?: string | null;
}

// Map API response to User type for ProfileListItem
function mapMatchToUser(match: MatchResponse): User {
  return {
    ID: match.user_id,
    id: match.user_id,
    DisplayName: match.display_name || match.first_name || "Anonymous",
    FirstName: match.first_name || undefined,
    LastName: match.last_name || undefined,
    City: match.city || undefined,
    State: match.state || undefined,
    Image: match.profile_image_url || undefined,
    is_verified: match.is_verified,
    livePicture: match.is_verified ? "verified" : undefined,
    Email: "", // Required by User type but not used in display
    ReferralCode: "", // Required by User type but not used in display
  };
}

export default function MatchesScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [matches, setMatches] = useState<User[]>([]);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = useThemeColors();

  const themedColors = useMemo(() => ({
    background: Platform.OS === "ios"
      ? (PlatformColor("systemBackground") as unknown as string)
      : colors.background,
    label: Platform.OS === "ios"
      ? (PlatformColor("label") as unknown as string)
      : colors.onSurface,
    secondaryLabel: Platform.OS === "ios"
      ? (PlatformColor("secondaryLabel") as unknown as string)
      : colors.onSurfaceVariant,
    systemPink: Platform.OS === "ios"
      ? (PlatformColor("systemPink") as unknown as string)
      : "#F59E0B",
  }), [isDark, colors]);

  const fetchMatches = useCallback(async (showLoader = true) => {
    if (showLoader) {
      setLoading(true);
    }
    try {
      const res = await getMatches();
      console.log("Matches fetched:", res);
      
      if (res?.matches) {
        const mappedMatches = res.matches.map(mapMatchToUser);
        setMatches(mappedMatches);
        if (!showLoader) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } else if (res?.error) {
        console.log("Failed to fetch matches:", res.error);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Toast.show({
          type: "error",
          text1: res.error || "Failed to fetch matches",
          position: "bottom",
          visibilityTime: 2000,
          autoHide: true,
        });
      }
    } catch (error) {
      console.error("Error fetching matches:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({
        type: "error",
        text1: "Failed to fetch matches",
        position: "bottom",
        bottomOffset: 100,
        visibilityTime: 2000,
        autoHide: true,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch matches when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchMatches();
    }, [fetchMatches])
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMatches(false);
  }, [fetchMatches]);

  const renderEmptyComponent = () => (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 80, paddingHorizontal: 24 }}>
      {Platform.OS === "ios" ? (
        <SymbolView
          name="heart.slash"
          style={{ width: 64, height: 64, marginBottom: 16 }}
          tintColor={themedColors.systemPink}
        />
      ) : (
        <PlatformIcon name="favorite-border" size={64} color={themedColors.systemPink} />
      )}
      <Text style={{ fontSize: 20, fontWeight: "600", color: themedColors.label, marginBottom: 8, textAlign: "center" }}>
        No matches yet
      </Text>
      <Text style={{ fontSize: 14, color: themedColors.secondaryLabel, textAlign: "center" }}>
        Start liking profiles to find your matches!
      </Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: themedColors.background }}>
      <Toast />
      <ScreenHeader
        title="Your Matches"
        showBackButton={false}
        rightContent={<NotificationBell />}
      />
      
      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={themedColors.systemPink} />
        </View>
      ) : (
        <View style={{ flex: 1, paddingBottom: 80 }}>
          <FlatList
            data={matches}
            contentContainerStyle={{
              gap: VERTICAL_SPACING.xs,
              paddingBottom: 100,
              flexGrow: 1,
            }}
            contentInsetAdjustmentBehavior="automatic"
            renderItem={({ item }) => (
              <ProfileListItem
                key={item.ID}
                profile={item}
                navigateToFocus={false}
              />
            )}
            keyExtractor={(item) => item.ID}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyComponent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={themedColors.systemPink}
                colors={[themedColors.systemPink]}
              />
            }
          />
        </View>
      )}
    </View>
  );
}
