/**
 * Matches Screen
 * 
 * Displays mutual matches - users who have both liked each other.
 * Calls the /api/matches endpoint to maintain SSOT with web.
 */

import NotificationBell from "@/components/NotificationBell";
import ProfileListItem from "@/components/ui/ProfileListItem";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { VERTICAL_SPACING } from "@/constants/designTokens";
import { getMatches } from "@/lib/api";
import { User } from "@/types";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
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
      } else if (res?.error) {
        console.log("Failed to fetch matches:", res.error);
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
    <View className="flex-1 items-center justify-center py-20 px-6">
      <Text className="text-6xl mb-4">💕</Text>
      <Text className="text-xl font-semibold text-gray-900 mb-2 text-center">
        No matches yet
      </Text>
      <Text className="text-sm text-gray-500 text-center">
        Start liking profiles to find your matches!
      </Text>
    </View>
  );

  return (
    <View className="flex-1 bg-background">
      <Toast />
      <ScreenHeader
        title="Your Matches"
        showBackButton={false}
        rightContent={<NotificationBell />}
      />
      
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#F59E0B" />
        </View>
      ) : (
        <View className="flex-1 pb-20">
          <FlatList
            data={matches}
            contentContainerStyle={{
              gap: VERTICAL_SPACING.xs,
              paddingBottom: 100,
            }}
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
                tintColor="#F59E0B"
                colors={["#F59E0B"]}
              />
            }
          />
        </View>
      )}
    </View>
  );
}
