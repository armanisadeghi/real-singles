/**
 * Connections Screen
 * 
 * Hub for managing dating connections:
 * - Likes You: People who liked you (premium feature)
 * - Matches: Mutual connections (can message)
 * 
 * This screen uses native iOS patterns:
 * - Native SegmentedControl for tab switching
 * - PlatformColor for all semantic colors
 * - SF Symbols for empty state icons
 * - Haptic feedback on all interactions
 * - ActionSheetIOS for context menus
 */

import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { NativeSegmentedTabs } from "@/components/ui/NativeSegmentedTabs";
import ProfileListItem from "@/components/ui/ProfileListItem";
import { PlatformIcon } from "@/components/ui/PlatformIcon";
import { getMatches, getLikesReceived, sendMatchAction } from "@/lib/api";
import { User } from "@/types";
import { useFocusEffect, useRouter, Href } from "expo-router";
import * as Haptics from "expo-haptics";
import { SymbolView } from "expo-symbols";
import React, { useCallback, useState } from "react";
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  PlatformColor,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { useThemeColors } from "@/context/ThemeContext";
import Toast from "react-native-toast-message";

// Tab types
type TabType = 0 | 1; // 0 = likes, 1 = matches

// API response types
interface MatchResponse {
  user_id: string;
  display_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  age?: number | null;
  gender?: string | null;
  city?: string | null;
  state?: string | null;
  is_verified: boolean;
  profile_image_url?: string | null;
  matched_at?: string | null;
  conversation_id?: string | null;
}

interface LikeResponse {
  id: string;
  user_id: string | null;
  action: string;
  is_super_like: boolean;
  liked_at: string | null;
  display_name?: string | null;
  first_name?: string | null;
  age?: number | null;
  city?: string | null;
  state?: string | null;
  is_verified: boolean;
  profile_image_url?: string | null;
}

// Map API response to User type
function mapMatchToUser(match: MatchResponse): User & { conversation_id?: string | null; matched_at?: string | null } {
  return {
    ID: match.user_id,
    id: match.user_id,
    DisplayName: match.display_name || match.first_name || "Anonymous",
    FirstName: match.first_name || undefined,
    City: match.city || undefined,
    State: match.state || undefined,
    Image: match.profile_image_url || undefined,
    is_verified: match.is_verified,
    Email: "",
    ReferralCode: "",
    conversation_id: match.conversation_id,
    matched_at: match.matched_at,
  };
}

function mapLikeToUser(like: LikeResponse): User & { is_super_like: boolean; liked_at?: string | null } {
  return {
    ID: like.user_id || like.id,
    id: like.user_id || like.id,
    DisplayName: like.display_name || like.first_name || "Someone",
    FirstName: like.first_name || undefined,
    City: like.city || undefined,
    State: like.state || undefined,
    Image: like.profile_image_url || undefined,
    is_verified: like.is_verified,
    Email: "",
    ReferralCode: "",
    is_super_like: like.is_super_like,
    liked_at: like.liked_at,
  };
}

export default function ConnectionsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [matches, setMatches] = useState<(User & { conversation_id?: string | null })[]>([]);
  const [likes, setLikes] = useState<(User & { is_super_like: boolean; liked_at?: string | null })[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Dark mode support
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = useThemeColors();

  // Theme colors using PlatformColor on iOS
  const themedColors = {
    background: Platform.OS === "ios"
      ? (PlatformColor("systemBackground") as unknown as string)
      : colors.background,
    secondaryBackground: Platform.OS === "ios"
      ? (PlatformColor("secondarySystemBackground") as unknown as string)
      : colors.surfaceContainer,
    label: Platform.OS === "ios"
      ? (PlatformColor("label") as unknown as string)
      : colors.onSurface,
    secondaryLabel: Platform.OS === "ios"
      ? (PlatformColor("secondaryLabel") as unknown as string)
      : colors.onSurfaceVariant,
    separator: Platform.OS === "ios"
      ? (PlatformColor("separator") as unknown as string)
      : colors.outline,
    systemBlue: Platform.OS === "ios"
      ? (PlatformColor("systemBlue") as unknown as string)
      : "#007AFF",
    systemPink: Platform.OS === "ios"
      ? (PlatformColor("systemPink") as unknown as string)
      : "#FF2D55",
    systemGreen: Platform.OS === "ios"
      ? (PlatformColor("systemGreen") as unknown as string)
      : "#34C759",
    systemRed: Platform.OS === "ios"
      ? (PlatformColor("systemRed") as unknown as string)
      : "#FF3B30",
    systemGray4: Platform.OS === "ios"
      ? (PlatformColor("systemGray4") as unknown as string)
      : isDark ? "#3A3A3C" : "#D1D1D6",
  };

  const fetchData = useCallback(async (showLoader = true) => {
    if (showLoader) {
      setLoading(true);
    }
    try {
      // Fetch both in parallel
      const [matchesRes, likesRes] = await Promise.all([
        getMatches(),
        getLikesReceived(),
      ]);

      if (matchesRes?.matches) {
        setMatches(matchesRes.matches.map(mapMatchToUser));
      }

      if (likesRes?.likes) {
        setLikes(likesRes.likes.map(mapLikeToUser));
      }

      if (!showLoader) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error("Error fetching connections:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({
        type: "error",
        text1: "Failed to load connections",
        position: "bottom",
        visibilityTime: 2000,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData(false);
  };

  const handleLikeBack = async (userId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActionLoading(userId);
    try {
      const result = await sendMatchAction(userId, "like");
      if (result?.success) {
        // Remove from likes list
        setLikes((prev) => prev.filter((l) => l.ID !== userId));
        
        // If mutual match with conversation, navigate to chat
        if (result.is_mutual && result.conversation_id) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Toast.show({
            type: "success",
            text1: "It's a match!",
            position: "bottom",
            visibilityTime: 1500,
          });
          router.push(`/chat/${result.conversation_id}` as Href);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Toast.show({
            type: "success",
            text1: "Liked!",
            position: "bottom",
            visibilityTime: 1500,
          });
        }
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error("Error liking back:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePass = async (userId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActionLoading(userId);
    try {
      const result = await sendMatchAction(userId, "pass");
      if (result?.success) {
        setLikes((prev) => prev.filter((l) => l.ID !== userId));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error("Error passing:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleMessageMatch = (conversationId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/chat/${conversationId}` as Href);
  };

  const handleViewProfile = (userId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/discover/profile/${userId}` as Href);
  };

  // Long press context menu for likes
  const showLikeOptions = (item: User & { is_super_like: boolean }) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "View Profile", "Like Back", "Pass"],
          cancelButtonIndex: 0,
          destructiveButtonIndex: 3,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) handleViewProfile(item.ID);
          if (buttonIndex === 2) handleLikeBack(item.ID);
          if (buttonIndex === 3) handlePass(item.ID);
        }
      );
    } else {
      // Android: Use Alert as fallback
      Alert.alert(
        item.DisplayName || "Profile Options",
        undefined,
        [
          { text: "View Profile", onPress: () => handleViewProfile(item.ID) },
          { text: "Like Back", onPress: () => handleLikeBack(item.ID) },
          { text: "Pass", onPress: () => handlePass(item.ID), style: "destructive" },
          { text: "Cancel", style: "cancel" },
        ]
      );
    }
  };

  // Long press context menu for matches
  const showMatchOptions = (item: User & { conversation_id?: string | null }) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (Platform.OS === "ios") {
      const options = item.conversation_id
        ? ["Cancel", "View Profile", "Message"]
        : ["Cancel", "View Profile"];
      
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) handleViewProfile(item.ID);
          if (buttonIndex === 2 && item.conversation_id) {
            handleMessageMatch(item.conversation_id);
          }
        }
      );
    } else {
      const buttons = [
        { text: "View Profile", onPress: () => handleViewProfile(item.ID) },
      ];
      if (item.conversation_id) {
        buttons.push({
          text: "Message",
          onPress: () => handleMessageMatch(item.conversation_id!),
        });
      }
      buttons.push({ text: "Cancel", style: "cancel" } as any);
      
      Alert.alert(item.DisplayName || "Profile Options", undefined, buttons);
    }
  };

  // Render like item with action buttons
  const renderLikeItem = ({ item }: { item: User & { is_super_like: boolean; liked_at?: string | null } }) => {
    const isLoading = actionLoading === item.ID;
    
    return (
      <Pressable
        onPress={() => handleViewProfile(item.ID)}
        onLongPress={() => showLikeOptions(item)}
        style={({ pressed }) => [
          styles.listItem,
          { backgroundColor: themedColors.background },
          item.is_super_like && [styles.superLikeItem, { borderColor: themedColors.systemBlue }],
          pressed && styles.listItemPressed,
        ]}
      >
        <ProfileListItem 
          profile={item} 
          onPress={() => handleViewProfile(item.ID)}
        />
        <View style={styles.actionButtons}>
          <Pressable
            style={({ pressed }) => [
              styles.passButton,
              { backgroundColor: themedColors.systemGray4 },
              pressed && styles.buttonPressed,
            ]}
            onPress={() => handlePass(item.ID)}
            disabled={isLoading}
          >
            <PlatformIcon name="close" iosName="xmark" size={20} color={themedColors.secondaryLabel as string} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.likeButton,
              { backgroundColor: themedColors.systemPink },
              pressed && styles.buttonPressed,
            ]}
            onPress={() => handleLikeBack(item.ID)}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <PlatformIcon name="favorite" iosName="heart.fill" size={20} color="#fff" />
            )}
          </Pressable>
        </View>
      </Pressable>
    );
  };

  // Render match item with message button
  const renderMatchItem = ({ item }: { item: User & { conversation_id?: string | null } }) => (
    <Pressable
      onPress={() => handleViewProfile(item.ID)}
      onLongPress={() => showMatchOptions(item)}
      style={({ pressed }) => [
        styles.listItem,
        { backgroundColor: themedColors.background },
        pressed && styles.listItemPressed,
      ]}
    >
      <ProfileListItem 
        profile={item} 
        onPress={() => handleViewProfile(item.ID)}
      />
      {item.conversation_id && (
        <Pressable
          style={({ pressed }) => [
            styles.messageButton,
            { backgroundColor: themedColors.systemBlue },
            pressed && styles.buttonPressed,
          ]}
          onPress={() => handleMessageMatch(item.conversation_id!)}
        >
          <PlatformIcon name="chat" iosName="bubble.fill" size={20} color="#fff" />
        </Pressable>
      )}
    </Pressable>
  );

  // Empty state for likes
  const renderEmptyLikes = () => (
    <View style={styles.emptyContainer}>
      {Platform.OS === "ios" ? (
        <SymbolView
          name="hand.thumbsup"
          style={{ width: 64, height: 64 }}
          tintColor={themedColors.systemPink}
        />
      ) : (
        <PlatformIcon name="thumb-up" size={64} color={themedColors.systemPink} />
      )}
      <Text style={[styles.emptyTitle, { color: themedColors.label }]}>No new likes</Text>
      <Text style={[styles.emptySubtitle, { color: themedColors.secondaryLabel }]}>
        When someone likes you, they'll appear here
      </Text>
    </View>
  );

  // Empty state for matches
  const renderEmptyMatches = () => (
    <View style={styles.emptyContainer}>
      {Platform.OS === "ios" ? (
        <SymbolView
          name="heart.slash"
          style={{ width: 64, height: 64 }}
          tintColor={themedColors.systemPink}
        />
      ) : (
        <PlatformIcon name="favorite-border" size={64} color={themedColors.systemPink} />
      )}
      <Text style={[styles.emptyTitle, { color: themedColors.label }]}>No matches yet</Text>
      <Text style={[styles.emptySubtitle, { color: themedColors.secondaryLabel }]}>
        When you and someone else like each other, you'll match!
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: themedColors.secondaryBackground }]}>
      <ScreenHeader title="Connections" />

      {/* Native Segmented Tabs */}
      <View style={{ backgroundColor: themedColors.background }}>
        <NativeSegmentedTabs
          tabs={["Likes You", "Matches"]}
          selectedIndex={activeTab}
          onSelect={(index) => setActiveTab(index as TabType)}
          badges={[likes.length > 0 ? likes.length : undefined, matches.length > 0 ? matches.length : undefined]}
        />
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themedColors.systemPink} />
        </View>
      ) : activeTab === 0 ? (
        <FlatList
          data={likes}
          keyExtractor={(item) => item.ID}
          renderItem={renderLikeItem}
          contentContainerStyle={styles.listContent}
          contentInsetAdjustmentBehavior="automatic"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={themedColors.systemPink}
            />
          }
          ListEmptyComponent={renderEmptyLikes}
        />
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item) => item.ID}
          renderItem={renderMatchItem}
          contentContainerStyle={styles.listContent}
          contentInsetAdjustmentBehavior="automatic"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={themedColors.systemPink}
            />
          }
          ListEmptyComponent={renderEmptyMatches}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    padding: 16,
    gap: 12,
    flexGrow: 1,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    overflow: "hidden",
  },
  listItemPressed: {
    opacity: 0.7,
  },
  superLikeItem: {
    borderWidth: 2,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 12,
  },
  passButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  likeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  messageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
  },
});
