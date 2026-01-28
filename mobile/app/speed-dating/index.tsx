import { PlatformIcon } from "@/components/ui/PlatformIcon";
import { SPACING, TYPOGRAPHY, VERTICAL_SPACING } from "@/constants/designTokens";
import { useSafeArea, useBottomSpacing } from "@/hooks/useResponsive";
import { getAllVirtualDate } from "@/lib/api";
import { VIDEO_URL } from "@/utils/token";
import * as Haptics from "expo-haptics";
import { SymbolView } from "expo-symbols";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  PlatformColor,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface SpeedDatingSession {
  id: string;
  ID?: string;
  name?: string;
  Title?: string;
  description?: string;
  Description?: string;
  session_date?: string;
  ScheduledDate?: string;
  start_time?: string;
  ScheduledTime?: string;
  duration_minutes?: number;
  Duration?: number;
  round_duration_minutes?: number;
  max_participants?: number;
  MaxParticipants?: number;
  registration_count?: number;
  current_participants?: number;
  status?: string;
  Status?: string;
  image_url?: string;
  Image?: string;
}

export default function SpeedDatingPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SpeedDatingSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { contentPadding } = useBottomSpacing(true);

  const fetchSessions = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const res = await getAllVirtualDate();
      
      if (res?.success) {
        // Handle both API response formats (new and legacy)
        const data = res.data || res.Virtual || [];
        setSessions(Array.isArray(data) ? data : []);
        if (showRefresh) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } else {
        throw new Error(res?.msg || "Failed to fetch sessions");
      }
    } catch (err) {
      console.error("Error fetching speed dating sessions:", err);
      setError("Unable to load sessions. Please try again.");
      if (showRefresh) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, []);

  const onRefresh = useCallback(() => {
    fetchSessions(true);
  }, [fetchSessions]);

  const primaryColor = Platform.OS === "ios" 
    ? (PlatformColor("systemPurple") as unknown as string) 
    : "#9333EA";

  // Normalize session data from different API formats
  const normalizeSession = (session: SpeedDatingSession) => ({
    id: session.id || session.ID || "",
    name: session.name || session.Title || "Speed Dating Session",
    description: session.description || session.Description || "",
    session_date: session.session_date || session.ScheduledDate || "",
    start_time: session.start_time || session.ScheduledTime || "",
    duration_minutes: session.duration_minutes || session.Duration || 60,
    max_participants: session.max_participants || session.MaxParticipants || 20,
    registration_count: session.registration_count || session.current_participants || 0,
    status: session.status || session.Status || "scheduled",
    image_url: session.image_url || (session.Image ? (session.Image.startsWith("http") ? session.Image : VIDEO_URL + session.Image) : null),
  });

  // Format date
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Format time
  const formatTime = (timeStr: string) => {
    if (!timeStr) return "";
    try {
      // Handle both HH:MM:SS and HH:MM formats
      const [hours, minutes] = timeStr.split(":");
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return timeStr;
    }
  };

  // Get status badge style
  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case "scheduled":
        return { bg: "#DCFCE7", text: "#15803D", label: "Upcoming" };
      case "in_progress":
        return { bg: "#FEF3C7", text: "#B45309", label: "Live" };
      default:
        return { bg: "#F3F4F6", text: "#4B5563", label: status };
    }
  };

  // How It Works component
  const HowItWorks = () => (
    <View 
      className="mx-4 rounded-2xl p-4 mb-6"
      style={{ 
        backgroundColor: Platform.OS === "ios" 
          ? "rgba(147, 51, 234, 0.08)" 
          : "#F3E8FF"
      }}
    >
      <Text className="font-semibold text-gray-900 mb-4" style={TYPOGRAPHY.body}>
        How It Works
      </Text>
      <View style={{ gap: SPACING.md }}>
        {[
          { num: "1", title: "Register", desc: "Sign up for an upcoming session", color: "#A855F7" },
          { num: "2", title: "Meet", desc: "Have quick video dates with multiple people", color: "#EC4899" },
          { num: "3", title: "Match", desc: "Connect with mutual interests after the session", color: "#F43F5E" },
        ].map((step) => (
          <View key={step.num} className="flex-row items-start" style={{ gap: SPACING.md }}>
            <View 
              className="w-8 h-8 rounded-full justify-center items-center"
              style={{ backgroundColor: step.color + "20" }}
            >
              <Text style={{ color: step.color, fontWeight: "700" }}>{step.num}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text className="font-medium text-gray-900" style={{ fontSize: 15 }}>
                {step.title}
              </Text>
              <Text className="text-gray-600" style={{ fontSize: 13 }}>
                {step.desc}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  // Session Card component
  const SessionCard = ({ session }: { session: SpeedDatingSession }) => {
    const normalized = normalizeSession(session);
    const statusStyle = getStatusStyle(normalized.status);

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push(`/speed-dating/${normalized.id}` as any);
        }}
        className="bg-white rounded-xl overflow-hidden mx-4 mb-4"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 3,
          elevation: 2,
        }}
      >
        <View className="flex-row">
          {/* Image */}
          <View 
            className="justify-center items-center"
            style={{ 
              width: 120, 
              height: 120,
              backgroundColor: "#A855F7",
            }}
          >
            {normalized.image_url ? (
              <Image
                source={{ uri: normalized.image_url }}
                style={{ width: 120, height: 120 }}
                resizeMode="cover"
              />
            ) : (
              Platform.OS === "ios" ? (
                <SymbolView
                  name="video.fill"
                  style={{ width: 40, height: 40 }}
                  tintColor="rgba(255,255,255,0.8)"
                />
              ) : (
                <PlatformIcon name="videocam" size={40} color="rgba(255,255,255,0.8)" />
              )
            )}
          </View>

          {/* Content */}
          <View style={{ flex: 1, padding: SPACING.base }}>
            <View className="flex-row items-start justify-between" style={{ gap: SPACING.sm }}>
              <Text 
                className="font-semibold text-gray-900 flex-1"
                style={{ fontSize: 15 }}
                numberOfLines={1}
              >
                {normalized.name}
              </Text>
              <View 
                className="px-2 py-0.5 rounded-full"
                style={{ backgroundColor: statusStyle.bg }}
              >
                <Text style={{ fontSize: 11, fontWeight: "500", color: statusStyle.text }}>
                  {statusStyle.label}
                </Text>
              </View>
            </View>

            {normalized.description && (
              <Text 
                className="text-gray-500 mt-1"
                style={{ fontSize: 13 }}
                numberOfLines={2}
              >
                {normalized.description}
              </Text>
            )}

            <View className="flex-row flex-wrap mt-2" style={{ gap: SPACING.sm }}>
              {/* Date */}
              {normalized.session_date && (
                <View className="flex-row items-center" style={{ gap: 4 }}>
                  {Platform.OS === "ios" ? (
                    <SymbolView name="calendar" style={{ width: 14, height: 14 }} tintColor="#6B7280" />
                  ) : (
                    <PlatformIcon name="event" size={14} color="#6B7280" />
                  )}
                  <Text className="text-gray-600" style={{ fontSize: 12 }}>
                    {formatDate(normalized.session_date)}
                  </Text>
                </View>
              )}

              {/* Time */}
              {normalized.start_time && (
                <View className="flex-row items-center" style={{ gap: 4 }}>
                  {Platform.OS === "ios" ? (
                    <SymbolView name="clock" style={{ width: 14, height: 14 }} tintColor="#6B7280" />
                  ) : (
                    <PlatformIcon name="schedule" size={14} color="#6B7280" />
                  )}
                  <Text className="text-gray-600" style={{ fontSize: 12 }}>
                    {formatTime(normalized.start_time)}
                  </Text>
                </View>
              )}

              {/* Participants */}
              <View className="flex-row items-center" style={{ gap: 4 }}>
                {Platform.OS === "ios" ? (
                  <SymbolView name="person.2" style={{ width: 14, height: 14 }} tintColor="#6B7280" />
                ) : (
                  <PlatformIcon name="people" size={14} color="#6B7280" />
                )}
                <Text className="text-gray-600" style={{ fontSize: 12 }}>
                  {normalized.registration_count}/{normalized.max_participants} registered
                </Text>
              </View>
            </View>

            <View className="flex-row items-center justify-between mt-2">
              <Text className="text-gray-500" style={{ fontSize: 12 }}>
                {normalized.duration_minutes} min total
              </Text>
              <Text style={{ fontSize: 13, fontWeight: "500", color: primaryColor }}>
                View Details →
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Header component
  const ListHeader = () => (
    <View style={{ paddingTop: SPACING.md }}>
      {/* Page Header */}
      <View style={{ paddingHorizontal: SPACING.screenPadding, paddingBottom: VERTICAL_SPACING.md }}>
        <Text className="font-bold text-gray-900" style={TYPOGRAPHY.h2}>
          Virtual Speed Dating
        </Text>
        <Text className="text-gray-500 mt-1" style={{ fontSize: 15 }}>
          Meet multiple matches in one fun session
        </Text>
      </View>

      {/* How It Works */}
      <HowItWorks />

      {/* Upcoming Sessions Header */}
      <View style={{ paddingHorizontal: SPACING.screenPadding, paddingBottom: SPACING.md }}>
        <Text className="font-semibold text-gray-900" style={{ fontSize: 17 }}>
          Upcoming Sessions
        </Text>
        <Text className="text-gray-500" style={{ fontSize: 13 }}>
          Register now to secure your spot
        </Text>
      </View>
    </View>
  );

  // Empty state
  const EmptyState = () => (
    <View 
      className="mx-4 rounded-xl p-8 items-center"
      style={{ backgroundColor: "#F9FAFB" }}
    >
      {Platform.OS === "ios" ? (
        <SymbolView
          name="video.slash"
          style={{ width: 48, height: 48, marginBottom: SPACING.md }}
          tintColor="#9CA3AF"
        />
      ) : (
        <PlatformIcon 
          name="videocam-off" 
          size={48} 
          color="#9CA3AF" 
          style={{ marginBottom: SPACING.md }}
        />
      )}
      <Text className="font-semibold text-gray-900 text-center mb-2" style={TYPOGRAPHY.body}>
        No sessions scheduled right now
      </Text>
      <Text className="text-gray-500 text-center" style={{ fontSize: 14, maxWidth: 280 }}>
        We host virtual speed dating sessions regularly. Check back soon or enable notifications 
        to be the first to know when a new session is scheduled!
      </Text>
    </View>
  );

  // Error state
  const ErrorState = () => (
    <View className="items-center justify-center" style={{ paddingVertical: VERTICAL_SPACING.xl * 2 }}>
      {Platform.OS === "ios" ? (
        <SymbolView
          name="exclamationmark.triangle"
          style={{ width: 48, height: 48, marginBottom: SPACING.md }}
          tintColor="#EF4444"
        />
      ) : (
        <PlatformIcon name="error-outline" size={48} color="#EF4444" style={{ marginBottom: SPACING.md }} />
      )}
      <Text className="text-red-500 text-center mb-4" style={TYPOGRAPHY.body}>
        {error}
      </Text>
      <TouchableOpacity
        onPress={() => fetchSessions()}
        className="rounded-full"
        style={{
          paddingHorizontal: SPACING.base,
          paddingVertical: SPACING.sm,
          backgroundColor: primaryColor,
        }}
        activeOpacity={0.7}
      >
        <Text className="text-white font-medium" style={{ fontSize: 14 }}>
          Try Again
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Loading state
  if (isLoading && !isRefreshing) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color={primaryColor} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {error ? (
        <FlatList
          data={[]}
          renderItem={() => null}
          ListHeaderComponent={ListHeader}
          ListFooterComponent={ErrorState}
          contentContainerStyle={{ paddingBottom: contentPadding }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={primaryColor}
            />
          }
        />
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id || item.ID || Math.random().toString()}
          renderItem={({ item }) => <SessionCard session={item} />}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={EmptyState}
          contentContainerStyle={{ paddingBottom: contentPadding }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={primaryColor}
            />
          }
        />
      )}
    </View>
  );
}
