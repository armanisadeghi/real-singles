import { PlatformIcon } from "@/components/ui/PlatformIcon";
import { SPACING, TYPOGRAPHY, VERTICAL_SPACING } from "@/constants/designTokens";
import { useBottomSpacing } from "@/hooks/useResponsive";
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
  useColorScheme,
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [sessions, setSessions] = useState<SpeedDatingSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { contentPadding } = useBottomSpacing(true);

  // Theme colors
  const colors = {
    background: Platform.OS === "ios" 
      ? PlatformColor("systemBackground") as unknown as string
      : isDark ? "#000000" : "#F9FAFB",
    secondaryBackground: Platform.OS === "ios"
      ? PlatformColor("secondarySystemBackground") as unknown as string
      : isDark ? "#1C1C1E" : "#FFFFFF",
    tertiaryBackground: Platform.OS === "ios"
      ? PlatformColor("tertiarySystemBackground") as unknown as string
      : isDark ? "#2C2C2E" : "#F3F4F6",
    label: Platform.OS === "ios"
      ? PlatformColor("label") as unknown as string
      : isDark ? "#FFFFFF" : "#000000",
    secondaryLabel: Platform.OS === "ios"
      ? PlatformColor("secondaryLabel") as unknown as string
      : isDark ? "#8E8E93" : "#6B7280",
    tertiaryLabel: Platform.OS === "ios"
      ? PlatformColor("tertiaryLabel") as unknown as string
      : isDark ? "#48484A" : "#9CA3AF",
    separator: Platform.OS === "ios"
      ? PlatformColor("separator") as unknown as string
      : isDark ? "#38383A" : "#E5E5EA",
    purple: Platform.OS === "ios"
      ? PlatformColor("systemPurple") as unknown as string
      : "#9333EA",
  };

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

  const formatTime = (timeStr: string) => {
    if (!timeStr) return "";
    try {
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

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case "scheduled":
        return { 
          bg: isDark ? "rgba(34, 197, 94, 0.2)" : "#DCFCE7", 
          text: isDark ? "#4ADE80" : "#15803D", 
          label: "Upcoming" 
        };
      case "in_progress":
        return { 
          bg: isDark ? "rgba(251, 191, 36, 0.2)" : "#FEF3C7", 
          text: isDark ? "#FBBF24" : "#B45309", 
          label: "Live" 
        };
      default:
        return { 
          bg: isDark ? "rgba(156, 163, 175, 0.2)" : "#F3F4F6", 
          text: colors.secondaryLabel, 
          label: status 
        };
    }
  };

  // How It Works component
  const HowItWorks = () => (
    <View 
      style={{ 
        marginHorizontal: 16,
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        backgroundColor: isDark ? "rgba(147, 51, 234, 0.15)" : "rgba(147, 51, 234, 0.08)",
      }}
    >
      <Text style={[TYPOGRAPHY.body, { fontWeight: "600", color: colors.label, marginBottom: 16 }]}>
        How It Works
      </Text>
      <View style={{ gap: SPACING.md }}>
        {[
          { num: "1", title: "Register", desc: "Sign up for an upcoming session", color: "#A855F7" },
          { num: "2", title: "Meet", desc: "Have quick video dates with multiple people", color: "#EC4899" },
          { num: "3", title: "Match", desc: "Connect with mutual interests after the session", color: "#F43F5E" },
        ].map((step) => (
          <View key={step.num} style={{ flexDirection: "row", alignItems: "flex-start", gap: SPACING.md }}>
            <View 
              style={{ 
                width: 32, 
                height: 32, 
                borderRadius: 16, 
                justifyContent: "center", 
                alignItems: "center",
                backgroundColor: step.color + (isDark ? "40" : "20"),
              }}
            >
              <Text style={{ color: step.color, fontWeight: "700" }}>{step.num}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: "500", color: colors.label }}>
                {step.title}
              </Text>
              <Text style={{ fontSize: 13, color: colors.secondaryLabel }}>
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
        style={{
          marginHorizontal: 16,
          marginBottom: 16,
          borderRadius: 12,
          overflow: "hidden",
          backgroundColor: colors.secondaryBackground,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: isDark ? 0.3 : 0.05,
          shadowRadius: 3,
          elevation: 2,
        }}
      >
        <View style={{ flexDirection: "row" }}>
          {/* Image */}
          <View 
            style={{ 
              width: 120, 
              height: 120,
              backgroundColor: "#A855F7",
              justifyContent: "center",
              alignItems: "center",
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
            <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: SPACING.sm }}>
              <Text 
                style={{ flex: 1, fontSize: 15, fontWeight: "600", color: colors.label }}
                numberOfLines={1}
              >
                {normalized.name}
              </Text>
              <View 
                style={{ 
                  paddingHorizontal: 8, 
                  paddingVertical: 2, 
                  borderRadius: 12,
                  backgroundColor: statusStyle.bg,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: "500", color: statusStyle.text }}>
                  {statusStyle.label}
                </Text>
              </View>
            </View>

            {normalized.description && (
              <Text 
                style={{ fontSize: 13, color: colors.secondaryLabel, marginTop: 4 }}
                numberOfLines={2}
              >
                {normalized.description}
              </Text>
            )}

            <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 8, gap: SPACING.sm }}>
              {normalized.session_date && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  {Platform.OS === "ios" ? (
                    <SymbolView name="calendar" style={{ width: 14, height: 14 }} tintColor={colors.secondaryLabel} />
                  ) : (
                    <PlatformIcon name="event" size={14} color={colors.secondaryLabel} />
                  )}
                  <Text style={{ fontSize: 12, color: colors.secondaryLabel }}>
                    {formatDate(normalized.session_date)}
                  </Text>
                </View>
              )}

              {normalized.start_time && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  {Platform.OS === "ios" ? (
                    <SymbolView name="clock" style={{ width: 14, height: 14 }} tintColor={colors.secondaryLabel} />
                  ) : (
                    <PlatformIcon name="schedule" size={14} color={colors.secondaryLabel} />
                  )}
                  <Text style={{ fontSize: 12, color: colors.secondaryLabel }}>
                    {formatTime(normalized.start_time)}
                  </Text>
                </View>
              )}

              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                {Platform.OS === "ios" ? (
                  <SymbolView name="person.2" style={{ width: 14, height: 14 }} tintColor={colors.secondaryLabel} />
                ) : (
                  <PlatformIcon name="people" size={14} color={colors.secondaryLabel} />
                )}
                <Text style={{ fontSize: 12, color: colors.secondaryLabel }}>
                  {normalized.registration_count}/{normalized.max_participants}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
              <Text style={{ fontSize: 12, color: colors.tertiaryLabel }}>
                {normalized.duration_minutes} min total
              </Text>
              <Text style={{ fontSize: 13, fontWeight: "500", color: colors.purple }}>
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
      <HowItWorks />

      <View style={{ paddingHorizontal: SPACING.screenPadding, paddingBottom: SPACING.md }}>
        <Text style={{ fontSize: 17, fontWeight: "600", color: colors.label }}>
          Upcoming Sessions
        </Text>
        <Text style={{ fontSize: 13, color: colors.secondaryLabel }}>
          Register now to secure your spot
        </Text>
      </View>
    </View>
  );

  // Empty state
  const EmptyState = () => (
    <View 
      style={{ 
        marginHorizontal: 16, 
        borderRadius: 12, 
        padding: 32, 
        alignItems: "center",
        backgroundColor: colors.tertiaryBackground,
      }}
    >
      {Platform.OS === "ios" ? (
        <SymbolView
          name="video.slash"
          style={{ width: 48, height: 48, marginBottom: SPACING.md }}
          tintColor={colors.tertiaryLabel}
        />
      ) : (
        <PlatformIcon 
          name="videocam-off" 
          size={48} 
          color={colors.tertiaryLabel} 
          style={{ marginBottom: SPACING.md }}
        />
      )}
      <Text style={[TYPOGRAPHY.body, { fontWeight: "600", color: colors.label, textAlign: "center", marginBottom: 8 }]}>
        No sessions scheduled right now
      </Text>
      <Text style={{ fontSize: 14, color: colors.secondaryLabel, textAlign: "center", maxWidth: 280 }}>
        We host virtual speed dating sessions regularly. Check back soon or enable notifications 
        to be the first to know when a new session is scheduled!
      </Text>
    </View>
  );

  // Error state
  const ErrorState = () => (
    <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: VERTICAL_SPACING.xl * 2 }}>
      {Platform.OS === "ios" ? (
        <SymbolView
          name="exclamationmark.triangle"
          style={{ width: 48, height: 48, marginBottom: SPACING.md }}
          tintColor="#EF4444"
        />
      ) : (
        <PlatformIcon name="error-outline" size={48} color="#EF4444" style={{ marginBottom: SPACING.md }} />
      )}
      <Text style={[TYPOGRAPHY.body, { color: "#EF4444", textAlign: "center", marginBottom: 16 }]}>
        {error}
      </Text>
      <TouchableOpacity
        onPress={() => fetchSessions()}
        style={{
          paddingHorizontal: SPACING.base,
          paddingVertical: SPACING.sm,
          backgroundColor: colors.purple,
          borderRadius: 20,
        }}
        activeOpacity={0.7}
      >
        <Text style={{ fontSize: 14, fontWeight: "500", color: "#FFFFFF" }}>
          Try Again
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading && !isRefreshing) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.purple} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {error ? (
        <FlatList
          data={[]}
          renderItem={() => null}
          ListHeaderComponent={ListHeader}
          ListFooterComponent={ErrorState}
          contentContainerStyle={{ paddingBottom: contentPadding }}
          contentInsetAdjustmentBehavior="automatic"
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={colors.purple}
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
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={colors.purple}
            />
          }
        />
      )}
    </View>
  );
}
