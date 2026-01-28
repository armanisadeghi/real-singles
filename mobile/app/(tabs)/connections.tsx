/**
 * Connections Screen
 * 
 * Hub for managing dating connections:
 * - Likes You: People who liked you (premium feature)
 * - Matches: Mutual connections (can message)
 * 
 * This screen combines likes received and matches into a single tabbed view,
 * matching the web /connections page structure.
 */

import { ScreenHeader } from "@/components/ui/ScreenHeader";
import ProfileListItem from "@/components/ui/ProfileListItem";
import { getMatches, getLikesReceived, sendMatchAction } from "@/lib/api";
import { User } from "@/types";
import { useFocusEffect, useRouter, Href } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { PlatformIcon } from "@/components/ui/PlatformIcon";

// Design colors
const COLORS = {
  primary: "#FF6B9D",
} as const;

// Tab types
type TabType = "likes" | "matches";

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

// Format relative time
function formatRelativeTime(dateString?: string | null): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function ConnectionsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("likes");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [matches, setMatches] = useState<(User & { conversation_id?: string | null })[]>([]);
  const [likes, setLikes] = useState<(User & { is_super_like: boolean; liked_at?: string | null })[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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
    } catch (error) {
      console.error("Error fetching connections:", error);
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
    setActionLoading(userId);
    try {
      const result = await sendMatchAction(userId, "like");
      if (result?.success) {
        // Remove from likes list
        setLikes((prev) => prev.filter((l) => l.ID !== userId));
        
        // If mutual match with conversation, navigate to chat
        if (result.is_mutual && result.conversation_id) {
          Toast.show({
            type: "success",
            text1: "It's a match! 💕",
            position: "bottom",
            visibilityTime: 1500,
          });
          router.push(`/chat/${result.conversation_id}` as Href);
        } else {
          Toast.show({
            type: "success",
            text1: "Liked!",
            position: "bottom",
            visibilityTime: 1500,
          });
        }
      }
    } catch (error) {
      console.error("Error liking back:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePass = async (userId: string) => {
    setActionLoading(userId);
    try {
      const result = await sendMatchAction(userId, "pass");
      if (result?.success) {
        setLikes((prev) => prev.filter((l) => l.ID !== userId));
      }
    } catch (error) {
      console.error("Error passing:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleMessageMatch = (conversationId: string) => {
    router.push(`/chat/${conversationId}` as Href);
  };

  // Render like item with action buttons
  const renderLikeItem = ({ item }: { item: User & { is_super_like: boolean; liked_at?: string | null } }) => {
    const isLoading = actionLoading === item.ID;
    
    return (
      <View style={[styles.listItem, item.is_super_like && styles.superLikeItem]}>
        <ProfileListItem 
          profile={item} 
          onPress={() => router.push(`/profiles/focus/${item.ID}` as Href)}
        />
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.passButton}
            onPress={() => handlePass(item.ID)}
            disabled={isLoading}
          >
            <PlatformIcon name="close" size={20} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.likeButton}
            onPress={() => handleLikeBack(item.ID)}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <PlatformIcon name="favorite" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render match item with message button
  const renderMatchItem = ({ item }: { item: User & { conversation_id?: string | null } }) => (
    <View style={styles.listItem}>
      <ProfileListItem 
        profile={item} 
        onPress={() => router.push(`/profiles/${item.ID}` as Href)}
      />
      {item.conversation_id && (
        <TouchableOpacity
          style={styles.messageButton}
          onPress={() => handleMessageMatch(item.conversation_id!)}
        >
          <PlatformIcon name="chat" size={20} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderEmptyLikes = () => (
    <View style={styles.emptyContainer}>
      <PlatformIcon name="thumb-up" size={64} color="#FFB347" />
      <Text style={styles.emptyTitle}>No new likes</Text>
      <Text style={styles.emptySubtitle}>
        When someone likes you, they'll appear here
      </Text>
    </View>
  );

  const renderEmptyMatches = () => (
    <View style={styles.emptyContainer}>
      <PlatformIcon name="favorite-border" size={64} color="#FF6B9D" />
      <Text style={styles.emptyTitle}>No matches yet</Text>
      <Text style={styles.emptySubtitle}>
        When you and someone else like each other, you'll match!
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader title="Connections" />

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "likes" && styles.activeTab]}
          onPress={() => setActiveTab("likes")}
        >
          <PlatformIcon 
            name="thumb-up" 
            size={18} 
            color={activeTab === "likes" ? COLORS.primary : "#666"} 
          />
          <Text style={[styles.tabText, activeTab === "likes" && styles.activeTabText]}>
            Likes You
          </Text>
          {likes.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{likes.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "matches" && styles.activeTab]}
          onPress={() => setActiveTab("matches")}
        >
          <PlatformIcon 
            name={activeTab === "matches" ? "favorite" : "favorite-border"} 
            size={18} 
            color={activeTab === "matches" ? COLORS.primary : "#666"} 
          />
          <Text style={[styles.tabText, activeTab === "matches" && styles.activeTabText]}>
            Matches
          </Text>
          {matches.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{matches.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : activeTab === "likes" ? (
        <FlatList
          data={likes}
          keyExtractor={(item) => item.ID}
          renderItem={renderLikeItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={renderEmptyLikes}
        />
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item) => item.ID}
          renderItem={renderMatchItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
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
    backgroundColor: "#f5f5f5",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    gap: 6,
  },
  activeTab: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  activeTabText: {
    color: COLORS.primary,
  },
  badge: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
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
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
  },
  superLikeItem: {
    borderWidth: 2,
    borderColor: "#3B82F6",
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
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
  },
  likeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FF6B9D",
    alignItems: "center",
    justifyContent: "center",
  },
  messageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FF6B9D",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
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
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
});
