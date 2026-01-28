import { PlatformIcon } from "@/components/ui/PlatformIcon";
import { SPACING, TYPOGRAPHY, VERTICAL_SPACING } from "@/constants/designTokens";
import { useBottomSpacing } from "@/hooks/useResponsive";
import { getVirtualSpeedDetails, registerSpeedDating, cancelSpeedDatingRegistration } from "@/lib/api";
import { VIDEO_URL } from "@/utils/token";
import * as Haptics from "expo-haptics";
import { SymbolView } from "expo-symbols";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  PlatformColor,
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Toast from "react-native-toast-message";

interface SpeedDatingSession {
  id: string;
  name: string;
  description?: string | null;
  session_date: string;
  start_time: string;
  end_time?: string | null;
  duration_minutes: number;
  round_duration_minutes: number;
  max_participants: number;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  event_type: "in_person" | "virtual";
  city?: string | null;
  venue_name?: string | null;
  venue_address?: string | null;
  image_url?: string | null;
  min_age?: number | null;
  max_age?: number | null;
  gender_preference?: string | null;
}

export default function SpeedDatingDetailScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { id } = useLocalSearchParams<{ id: string }>();
  const { contentPadding } = useBottomSpacing(true);
  
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SpeedDatingSession | null>(null);
  const [registrationCount, setRegistrationCount] = useState(0);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [cancelling, setCancelling] = useState(false);

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
    green: Platform.OS === "ios"
      ? PlatformColor("systemGreen") as unknown as string
      : "#22C55E",
    red: Platform.OS === "ios"
      ? PlatformColor("systemRed") as unknown as string
      : "#EF4444",
  };

  const fetchSessionDetails = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const res = await getVirtualSpeedDetails(id);
      console.log("Speed Dating Details:", res);
      
      if (res?.success) {
        const sessionData = res.session || res.data;
        if (sessionData) {
          setSession({
            id: sessionData.id || sessionData.ID,
            name: sessionData.name || sessionData.Title,
            description: sessionData.description || sessionData.Description,
            session_date: sessionData.session_date || sessionData.ScheduledDate,
            start_time: sessionData.start_time || sessionData.ScheduledTime,
            end_time: sessionData.end_time || sessionData.EndTime,
            duration_minutes: sessionData.duration_minutes || sessionData.Duration || 60,
            round_duration_minutes: sessionData.round_duration_minutes || 5,
            max_participants: sessionData.max_participants || sessionData.MaxParticipants || 20,
            status: sessionData.status || sessionData.Status || "scheduled",
            event_type: sessionData.event_type || "virtual",
            city: sessionData.city,
            venue_name: sessionData.venue_name,
            venue_address: sessionData.venue_address,
            image_url: sessionData.image_url || (sessionData.Image ? 
              (sessionData.Image.startsWith("http") ? sessionData.Image : VIDEO_URL + sessionData.Image) : null),
            min_age: sessionData.min_age,
            max_age: sessionData.max_age,
            gender_preference: sessionData.gender_preference,
          });
        }
        setRegistrationCount(res.registration_count || 0);
        setIsRegistered(res.is_registered || false);
      } else {
        Toast.show({
          type: "error",
          text1: res?.msg || "Failed to load session details",
          position: "bottom",
          visibilityTime: 2000,
        });
      }
    } catch (error) {
      console.error("Error fetching session details:", error);
      Toast.show({
        type: "error",
        text1: "Failed to load session details",
        position: "bottom",
        visibilityTime: 2000,
      });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSessionDetails();
  }, [fetchSessionDetails]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Date TBD";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return "Time TBD";
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

  const handleRegister = async () => {
    if (!id) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRegistering(true);
    
    try {
      const res = await registerSpeedDating(id);
      console.log("Register Response:", res);
      
      if (res?.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setIsRegistered(true);
        setRegistrationCount((prev) => prev + 1);
        
        Alert.alert(
          `Registered for "${session?.name}"`,
          "We'll send you a reminder before the session starts.",
          [{ text: "OK", style: "cancel" }]
        );
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Toast.show({
          type: "error",
          text1: res?.msg || "Failed to register",
          position: "bottom",
          visibilityTime: 2000,
        });
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error("Error registering:", error);
      Toast.show({
        type: "error",
        text1: "Something went wrong. Please try again.",
        position: "bottom",
        visibilityTime: 2000,
      });
    } finally {
      setRegistering(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (!id) return;
    
    Alert.alert(
      "Cancel Registration",
      `Are you sure you want to cancel your registration for "${session?.name}"?`,
      [
        { text: "Keep Registration", style: "cancel" },
        {
          text: "Cancel Registration",
          style: "destructive",
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setCancelling(true);
            
            try {
              const res = await cancelSpeedDatingRegistration(id);
              console.log("Cancel Response:", res);
              
              if (res?.success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setIsRegistered(false);
                setRegistrationCount((prev) => Math.max(0, prev - 1));
                Toast.show({
                  type: "success",
                  text1: "Registration cancelled",
                  position: "bottom",
                  visibilityTime: 2000,
                });
              } else {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                Toast.show({
                  type: "error",
                  text1: res?.msg || "Failed to cancel registration",
                  position: "bottom",
                  visibilityTime: 2000,
                });
              }
            } catch (error) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              console.error("Error cancelling:", error);
              Toast.show({
                type: "error",
                text1: "Something went wrong. Please try again.",
                position: "bottom",
                visibilityTime: 2000,
              });
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  const isFull = session ? registrationCount >= session.max_participants : false;
  const canRegister = session && 
    (session.status === "scheduled" || session.status === "in_progress") && 
    !isRegistered && !isFull;

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
      case "completed":
        return { 
          bg: isDark ? "rgba(156, 163, 175, 0.2)" : "#F3F4F6", 
          text: colors.secondaryLabel, 
          label: "Completed" 
        };
      case "cancelled":
        return { 
          bg: isDark ? "rgba(239, 68, 68, 0.2)" : "#FEE2E2", 
          text: isDark ? "#F87171" : "#DC2626", 
          label: "Cancelled" 
        };
      default:
        return { 
          bg: isDark ? "rgba(156, 163, 175, 0.2)" : "#F3F4F6", 
          text: colors.secondaryLabel, 
          label: status 
        };
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.purple} />
      </View>
    );
  }

  if (!session) {
    return (
      <>
        <Stack.Screen options={{ title: "Not Found" }} />
        <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center", paddingHorizontal: 24 }}>
          {Platform.OS === "ios" ? (
            <SymbolView
              name="exclamationmark.triangle"
              style={{ width: 48, height: 48, marginBottom: SPACING.md }}
              tintColor={colors.tertiaryLabel}
            />
          ) : (
            <PlatformIcon name="error-outline" size={48} color={colors.tertiaryLabel} style={{ marginBottom: SPACING.md }} />
          )}
          <Text style={{ fontSize: 18, fontWeight: "600", color: colors.label, marginBottom: 8 }}>
            Session Not Found
          </Text>
          <Text style={{ fontSize: 15, color: colors.secondaryLabel, textAlign: "center", marginBottom: 24 }}>
            This speed dating session may have been removed or is no longer available.
          </Text>
          <TouchableOpacity 
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={{ color: colors.purple, fontWeight: "500" }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  const statusStyle = getStatusStyle(session.status);

  return (
    <>
      <Stack.Screen options={{ title: session.name }} />
      <Toast />
      
      <ScrollView 
        style={{ flex: 1, backgroundColor: colors.background }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: contentPadding }}
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* Image */}
        <View style={{ aspectRatio: 16 / 9 }}>
          {session.image_url ? (
            <Image
              source={{ uri: session.image_url }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={["#A855F7", "#EC4899"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ width: "100%", height: "100%", justifyContent: "center", alignItems: "center" }}
            >
              {Platform.OS === "ios" ? (
                <SymbolView
                  name="video.fill"
                  style={{ width: 64, height: 64 }}
                  tintColor="rgba(255,255,255,0.8)"
                />
              ) : (
                <PlatformIcon name="videocam" size={64} color="rgba(255,255,255,0.8)" />
              )}
            </LinearGradient>
          )}
        </View>

        <View style={{ padding: SPACING.screenPadding }}>
          {/* Header with status */}
          <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16, gap: SPACING.md }}>
            <Text style={{ flex: 1, fontSize: 24, fontWeight: "bold", color: colors.label }}>
              {session.name}
            </Text>
            <View 
              style={{ 
                paddingHorizontal: 12, 
                paddingVertical: 4, 
                borderRadius: 12,
                backgroundColor: statusStyle.bg,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: "500", color: statusStyle.text }}>
                {statusStyle.label}
              </Text>
            </View>
          </View>

          {/* Description */}
          {session.description && (
            <Text style={{ fontSize: 15, lineHeight: 22, color: colors.secondaryLabel, marginBottom: 24 }}>
              {session.description}
            </Text>
          )}

          {/* Details cards */}
          <View style={{ gap: SPACING.md, marginBottom: VERTICAL_SPACING.lg }}>
            {/* Date */}
            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.tertiaryBackground, borderRadius: 12, padding: 16, gap: SPACING.md }}>
              {Platform.OS === "ios" ? (
                <SymbolView name="calendar" style={{ width: 22, height: 22 }} tintColor={colors.purple} />
              ) : (
                <PlatformIcon name="event" size={22} color={colors.purple} />
              )}
              <View>
                <Text style={{ fontSize: 13, color: colors.secondaryLabel }}>Date</Text>
                <Text style={{ fontSize: 15, fontWeight: "500", color: colors.label }}>
                  {formatDate(session.session_date)}
                </Text>
              </View>
            </View>

            {/* Time */}
            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.tertiaryBackground, borderRadius: 12, padding: 16, gap: SPACING.md }}>
              {Platform.OS === "ios" ? (
                <SymbolView name="clock" style={{ width: 22, height: 22 }} tintColor={colors.purple} />
              ) : (
                <PlatformIcon name="schedule" size={22} color={colors.purple} />
              )}
              <View>
                <Text style={{ fontSize: 13, color: colors.secondaryLabel }}>Time</Text>
                <Text style={{ fontSize: 15, fontWeight: "500", color: colors.label }}>
                  {formatTime(session.start_time)}
                  {session.end_time && ` - ${formatTime(session.end_time)}`}
                </Text>
              </View>
            </View>

            {/* Participants */}
            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.tertiaryBackground, borderRadius: 12, padding: 16, gap: SPACING.md }}>
              {Platform.OS === "ios" ? (
                <SymbolView name="person.2" style={{ width: 22, height: 22 }} tintColor={colors.purple} />
              ) : (
                <PlatformIcon name="people" size={22} color={colors.purple} />
              )}
              <View>
                <Text style={{ fontSize: 13, color: colors.secondaryLabel }}>Participants</Text>
                <Text style={{ fontSize: 15, fontWeight: "500", color: colors.label }}>
                  {registrationCount}/{session.max_participants} registered
                </Text>
              </View>
            </View>

            {/* Format */}
            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.tertiaryBackground, borderRadius: 12, padding: 16, gap: SPACING.md }}>
              {Platform.OS === "ios" ? (
                <SymbolView name="video" style={{ width: 22, height: 22 }} tintColor={colors.purple} />
              ) : (
                <PlatformIcon name="videocam" size={22} color={colors.purple} />
              )}
              <View>
                <Text style={{ fontSize: 13, color: colors.secondaryLabel }}>Format</Text>
                <Text style={{ fontSize: 15, fontWeight: "500", color: colors.label }}>
                  {session.round_duration_minutes} min per date • {session.duration_minutes} min total
                </Text>
              </View>
            </View>
          </View>

          {/* Age/Gender preferences */}
          {(session.min_age || session.max_age || session.gender_preference) && (
            <View 
              style={{ 
                flexDirection: "row", 
                alignItems: "flex-start", 
                borderRadius: 12, 
                padding: 16, 
                marginBottom: 24, 
                gap: SPACING.md,
                backgroundColor: isDark ? "rgba(147, 51, 234, 0.15)" : "#F3E8FF",
              }}
            >
              {Platform.OS === "ios" ? (
                <SymbolView name="info.circle" style={{ width: 22, height: 22 }} tintColor="#9333EA" />
              ) : (
                <PlatformIcon name="info-outline" size={22} color="#9333EA" />
              )}
              <View>
                <Text style={{ fontWeight: "500", color: isDark ? "#C084FC" : "#581C87" }}>Preferences</Text>
                <Text style={{ fontSize: 14, color: isDark ? "#A855F7" : "#7E22CE" }}>
                  {session.min_age && session.max_age
                    ? `Ages ${session.min_age}-${session.max_age}`
                    : session.min_age
                    ? `Ages ${session.min_age}+`
                    : session.max_age
                    ? `Ages up to ${session.max_age}`
                    : ""}
                  {session.gender_preference && ` • Looking for ${session.gender_preference}`}
                </Text>
              </View>
            </View>
          )}

          {/* Registration status */}
          {isRegistered && (
            <View 
              style={{ 
                flexDirection: "row", 
                alignItems: "center", 
                justifyContent: "space-between", 
                borderRadius: 12, 
                padding: 16, 
                marginBottom: 24, 
                gap: SPACING.md,
                backgroundColor: isDark ? "rgba(34, 197, 94, 0.15)" : "#F0FDF4",
                borderWidth: 1,
                borderColor: isDark ? "rgba(34, 197, 94, 0.3)" : "#BBF7D0",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", flex: 1, gap: SPACING.md }}>
                <View 
                  style={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: 20, 
                    justifyContent: "center", 
                    alignItems: "center",
                    backgroundColor: isDark ? "rgba(34, 197, 94, 0.2)" : "#DCFCE7",
                  }}
                >
                  {Platform.OS === "ios" ? (
                    <SymbolView name="checkmark" style={{ width: 20, height: 20 }} tintColor={isDark ? "#4ADE80" : "#16A34A"} />
                  ) : (
                    <PlatformIcon name="check" size={20} color={isDark ? "#4ADE80" : "#16A34A"} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "500", color: isDark ? "#4ADE80" : "#166534" }}>
                    You're registered!
                  </Text>
                  <Text style={{ fontSize: 13, color: isDark ? "#86EFAC" : "#15803D" }}>
                    We'll send you a reminder before the session.
                  </Text>
                </View>
              </View>
              {session.status === "scheduled" && (
                <TouchableOpacity
                  onPress={handleCancelRegistration}
                  disabled={cancelling}
                  style={{ paddingHorizontal: 12, paddingVertical: 6 }}
                  activeOpacity={0.7}
                >
                  {cancelling ? (
                    <ActivityIndicator size="small" color={colors.red} />
                  ) : (
                    <Text style={{ fontSize: 14, fontWeight: "500", color: colors.red }}>Cancel</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Register button */}
          <TouchableOpacity
            onPress={canRegister ? handleRegister : undefined}
            disabled={!canRegister || registering}
            activeOpacity={canRegister ? 0.7 : 1}
            style={{ width: "100%", borderRadius: 12, overflow: "hidden", opacity: canRegister ? 1 : 0.5 }}
          >
            {canRegister ? (
              <LinearGradient
                colors={["#A855F7", "#EC4899"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ paddingVertical: 16, alignItems: "center", justifyContent: "center" }}
              >
                {registering ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={{ fontSize: 18, fontWeight: "600", color: "#FFFFFF" }}>Register Now</Text>
                )}
              </LinearGradient>
            ) : (
              <View style={{ backgroundColor: colors.tertiaryBackground, paddingVertical: 16, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 18, fontWeight: "600", color: colors.tertiaryLabel }}>
                  {isRegistered
                    ? "Already Registered"
                    : isFull
                    ? "Session Full"
                    : session.status === "completed"
                    ? "Session Completed"
                    : session.status === "cancelled"
                    ? "Session Cancelled"
                    : "Register Now"}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}
