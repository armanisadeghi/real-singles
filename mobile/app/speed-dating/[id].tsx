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
  const { id } = useLocalSearchParams<{ id: string }>();
  const { contentPadding } = useBottomSpacing(true);
  
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SpeedDatingSession | null>(null);
  const [registrationCount, setRegistrationCount] = useState(0);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const primaryColor = Platform.OS === "ios" 
    ? (PlatformColor("systemPurple") as unknown as string) 
    : "#9333EA";

  const fetchSessionDetails = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const res = await getVirtualSpeedDetails(id);
      console.log("Speed Dating Details:", res);
      
      if (res?.success) {
        // Handle both API response formats
        const sessionData = res.session || res.data;
        if (sessionData) {
          // Normalize from legacy format if needed
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
        
        // iOS-native alert style
        Alert.alert(
          `Registered for "${session?.name}"`,
          "We'll send you a reminder before the session starts.",
          [
            { text: "OK", style: "cancel" },
          ]
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

  // Get status display
  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case "scheduled":
        return { bg: "#DCFCE7", text: "#15803D", label: "Upcoming" };
      case "in_progress":
        return { bg: "#FEF3C7", text: "#B45309", label: "Live" };
      case "completed":
        return { bg: "#F3F4F6", text: "#4B5563", label: "Completed" };
      case "cancelled":
        return { bg: "#FEE2E2", text: "#DC2626", label: "Cancelled" };
      default:
        return { bg: "#F3F4F6", text: "#4B5563", label: status };
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color={primaryColor} />
      </View>
    );
  }

  if (!session) {
    return (
      <>
        <Stack.Screen options={{ title: "Not Found" }} />
        <View className="flex-1 bg-gray-50 justify-center items-center px-6">
          {Platform.OS === "ios" ? (
            <SymbolView
              name="exclamationmark.triangle"
              style={{ width: 48, height: 48, marginBottom: SPACING.md }}
              tintColor="#9CA3AF"
            />
          ) : (
            <PlatformIcon name="error-outline" size={48} color="#9CA3AF" style={{ marginBottom: SPACING.md }} />
          )}
          <Text className="text-lg font-semibold text-gray-900 mb-2">Session Not Found</Text>
          <Text className="text-gray-500 text-center mb-6">
            This speed dating session may have been removed or is no longer available.
          </Text>
          <TouchableOpacity 
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={{ color: primaryColor, fontWeight: "500" }}>Go Back</Text>
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
        className="flex-1 bg-gray-50" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: contentPadding }}
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* Image */}
        <View className="aspect-video">
          {session.image_url ? (
            <Image
              source={{ uri: session.image_url }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={["#A855F7", "#EC4899"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="w-full h-full justify-center items-center"
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
          <View className="flex-row items-start justify-between mb-4" style={{ gap: SPACING.md }}>
            <Text className="flex-1 text-2xl font-bold text-gray-900">{session.name}</Text>
            <View 
              className="px-3 py-1 rounded-full"
              style={{ backgroundColor: statusStyle.bg }}
            >
              <Text style={{ fontSize: 13, fontWeight: "500", color: statusStyle.text }}>
                {statusStyle.label}
              </Text>
            </View>
          </View>

          {/* Description */}
          {session.description && (
            <Text className="text-gray-600 mb-6" style={{ fontSize: 15, lineHeight: 22 }}>
              {session.description}
            </Text>
          )}

          {/* Details cards */}
          <View style={{ gap: SPACING.md, marginBottom: VERTICAL_SPACING.lg }}>
            {/* Date */}
            <View className="flex-row items-center bg-gray-100 rounded-xl p-4" style={{ gap: SPACING.md }}>
              {Platform.OS === "ios" ? (
                <SymbolView name="calendar" style={{ width: 22, height: 22 }} tintColor={primaryColor} />
              ) : (
                <PlatformIcon name="event" size={22} color={primaryColor} />
              )}
              <View>
                <Text className="text-gray-500" style={{ fontSize: 13 }}>Date</Text>
                <Text className="font-medium text-gray-900" style={{ fontSize: 15 }}>
                  {formatDate(session.session_date)}
                </Text>
              </View>
            </View>

            {/* Time */}
            <View className="flex-row items-center bg-gray-100 rounded-xl p-4" style={{ gap: SPACING.md }}>
              {Platform.OS === "ios" ? (
                <SymbolView name="clock" style={{ width: 22, height: 22 }} tintColor={primaryColor} />
              ) : (
                <PlatformIcon name="schedule" size={22} color={primaryColor} />
              )}
              <View>
                <Text className="text-gray-500" style={{ fontSize: 13 }}>Time</Text>
                <Text className="font-medium text-gray-900" style={{ fontSize: 15 }}>
                  {formatTime(session.start_time)}
                  {session.end_time && ` - ${formatTime(session.end_time)}`}
                </Text>
              </View>
            </View>

            {/* Participants */}
            <View className="flex-row items-center bg-gray-100 rounded-xl p-4" style={{ gap: SPACING.md }}>
              {Platform.OS === "ios" ? (
                <SymbolView name="person.2" style={{ width: 22, height: 22 }} tintColor={primaryColor} />
              ) : (
                <PlatformIcon name="people" size={22} color={primaryColor} />
              )}
              <View>
                <Text className="text-gray-500" style={{ fontSize: 13 }}>Participants</Text>
                <Text className="font-medium text-gray-900" style={{ fontSize: 15 }}>
                  {registrationCount}/{session.max_participants} registered
                </Text>
              </View>
            </View>

            {/* Format */}
            <View className="flex-row items-center bg-gray-100 rounded-xl p-4" style={{ gap: SPACING.md }}>
              {Platform.OS === "ios" ? (
                <SymbolView name="video" style={{ width: 22, height: 22 }} tintColor={primaryColor} />
              ) : (
                <PlatformIcon name="videocam" size={22} color={primaryColor} />
              )}
              <View>
                <Text className="text-gray-500" style={{ fontSize: 13 }}>Format</Text>
                <Text className="font-medium text-gray-900" style={{ fontSize: 15 }}>
                  {session.round_duration_minutes} min per date • {session.duration_minutes} min total
                </Text>
              </View>
            </View>
          </View>

          {/* Age/Gender preferences */}
          {(session.min_age || session.max_age || session.gender_preference) && (
            <View 
              className="flex-row items-start rounded-xl p-4 mb-6" 
              style={{ gap: SPACING.md, backgroundColor: "#F3E8FF" }}
            >
              {Platform.OS === "ios" ? (
                <SymbolView name="info.circle" style={{ width: 22, height: 22 }} tintColor="#9333EA" />
              ) : (
                <PlatformIcon name="info-outline" size={22} color="#9333EA" />
              )}
              <View>
                <Text className="font-medium" style={{ color: "#581C87" }}>Preferences</Text>
                <Text style={{ fontSize: 14, color: "#7E22CE" }}>
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
              className="flex-row items-center justify-between rounded-xl p-4 mb-6 border"
              style={{ gap: SPACING.md, backgroundColor: "#F0FDF4", borderColor: "#BBF7D0" }}
            >
              <View className="flex-row items-center flex-1" style={{ gap: SPACING.md }}>
                <View 
                  className="w-10 h-10 rounded-full justify-center items-center"
                  style={{ backgroundColor: "#DCFCE7" }}
                >
                  {Platform.OS === "ios" ? (
                    <SymbolView name="checkmark" style={{ width: 20, height: 20 }} tintColor="#16A34A" />
                  ) : (
                    <PlatformIcon name="check" size={20} color="#16A34A" />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text className="font-medium" style={{ color: "#166534" }}>You're registered!</Text>
                  <Text style={{ fontSize: 13, color: "#15803D" }}>
                    We'll send you a reminder before the session.
                  </Text>
                </View>
              </View>
              {session.status === "scheduled" && (
                <TouchableOpacity
                  onPress={handleCancelRegistration}
                  disabled={cancelling}
                  className="px-3 py-1.5"
                  activeOpacity={0.7}
                >
                  {cancelling ? (
                    <ActivityIndicator size="small" color="#DC2626" />
                  ) : (
                    <Text style={{ fontSize: 14, fontWeight: "500", color: "#DC2626" }}>Cancel</Text>
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
            className="w-full rounded-xl overflow-hidden"
            style={{ opacity: canRegister ? 1 : 0.5 }}
          >
            {canRegister ? (
              <LinearGradient
                colors={["#A855F7", "#EC4899"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="py-4 items-center justify-center"
              >
                {registering ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="font-semibold text-lg text-white">Register Now</Text>
                )}
              </LinearGradient>
            ) : (
              <View className="bg-gray-200 py-4 items-center justify-center">
                <Text className="font-semibold text-lg text-gray-400">
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
