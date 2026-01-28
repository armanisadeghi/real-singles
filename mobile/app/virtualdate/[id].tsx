import LinearBg from "@/components/LinearBg";
import NotificationBell from "@/components/NotificationBell";
import { PlatformIcon } from "@/components/ui";
import { getVirtualSpeedDetails, registerSpeedDating, cancelSpeedDatingRegistration } from "@/lib/api";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
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
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
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
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SpeedDatingSession | null>(null);
  const [registrationCount, setRegistrationCount] = useState(0);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Android hardware back button handling
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      router.back();
      return true;
    });
    return () => backHandler.remove();
  }, []);

  const fetchSessionDetails = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const res = await getVirtualSpeedDetails(id);
      console.log("Speed Dating Details:", res);
      
      if (res?.success) {
        setSession(res.session);
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
    const [hours, minutes] = timeStr.split(":");
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const handleBackPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

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
        Toast.show({
          type: "success",
          text1: "You're registered!",
          text2: "We'll send you a reminder before the session.",
          position: "bottom",
          visibilityTime: 3000,
        });
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
  const canRegister = session?.status === "upcoming" && !isRegistered && !isFull;

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['left', 'right', 'bottom']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#F3961D" />
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['left', 'right', 'bottom']}>
        <View
          className="bg-white flex-row justify-between items-center px-4 pb-4 z-30"
          style={{ paddingTop: insets.top + 8 }}
        >
          <TouchableOpacity
            onPress={handleBackPress}
            className="border border-gray-200 rounded-lg p-2"
          >
            <PlatformIcon name="chevron-left" size={16} color="#000" />
          </TouchableOpacity>
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-lg font-semibold text-gray-900 mb-2">Session Not Found</Text>
          <Text className="text-gray-500 text-center mb-6">
            This speed dating session may have been removed or is no longer available.
          </Text>
          <TouchableOpacity onPress={handleBackPress}>
            <Text className="text-primary font-medium">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['left', 'right', 'bottom']}>
      <Toast />
      
      {/* Header */}
      <View
        className="bg-white flex-row justify-between items-center px-4 pb-4 z-30"
        style={{
          paddingTop: insets.top + 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 3,
        }}
      >
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            onPress={handleBackPress}
            className="border border-gray-200 rounded-lg p-2"
          >
            <PlatformIcon name="chevron-left" size={16} color="#000" />
          </TouchableOpacity>
          <Text className="text-base font-medium text-dark">Speed Dating</Text>
        </View>
        <NotificationBell />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Image */}
        <View className="aspect-video bg-gradient-to-br from-purple-400 to-pink-500">
          {session.image_url ? (
            <Image
              source={{ uri: session.image_url }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-full items-center justify-center">
              <PlatformIcon name="video" size={48} color="rgba(255,255,255,0.8)" />
            </View>
          )}
        </View>

        <View className="px-4 py-6">
          {/* Header with status */}
          <View className="flex-row items-start justify-between gap-4 mb-4">
            <Text className="flex-1 text-2xl font-bold text-gray-900">{session.name}</Text>
            <View
              className={`px-3 py-1 rounded-full ${
                session.status === "upcoming"
                  ? "bg-green-100"
                  : session.status === "ongoing"
                  ? "bg-yellow-100"
                  : "bg-gray-100"
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  session.status === "upcoming"
                    ? "text-green-700"
                    : session.status === "ongoing"
                    ? "text-yellow-700"
                    : "text-gray-700"
                }`}
              >
                {session.status === "upcoming" ? "Upcoming" : session.status}
              </Text>
            </View>
          </View>

          {/* Description */}
          {session.description && (
            <Text className="text-gray-600 mb-6">{session.description}</Text>
          )}

          {/* Details grid */}
          <View className="gap-3 mb-6">
            <View className="flex-row items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <PlatformIcon name="calendar" size={20} color="#ec4899" />
              <View>
                <Text className="text-sm text-gray-500">Date</Text>
                <Text className="font-medium text-gray-900">{formatDate(session.session_date)}</Text>
              </View>
            </View>

            <View className="flex-row items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <PlatformIcon name="clock" size={20} color="#ec4899" />
              <View>
                <Text className="text-sm text-gray-500">Time</Text>
                <Text className="font-medium text-gray-900">
                  {formatTime(session.start_time)}
                  {session.end_time && ` - ${formatTime(session.end_time)}`}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <PlatformIcon name="users" size={20} color="#ec4899" />
              <View>
                <Text className="text-sm text-gray-500">Participants</Text>
                <Text className="font-medium text-gray-900">
                  {registrationCount}/{session.max_participants} registered
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <PlatformIcon name="video" size={20} color="#ec4899" />
              <View>
                <Text className="text-sm text-gray-500">Format</Text>
                <Text className="font-medium text-gray-900">
                  {session.round_duration_minutes} min per date
                </Text>
              </View>
            </View>
          </View>

          {/* Age/Gender preferences */}
          {(session.min_age || session.max_age || session.gender_preference) && (
            <View className="flex-row items-start gap-3 p-4 bg-purple-50 rounded-xl mb-6">
              <PlatformIcon name="info" size={20} color="#a855f7" />
              <View>
                <Text className="font-medium text-purple-900">Preferences</Text>
                <Text className="text-sm text-purple-700">
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
            <View className="flex-row items-center justify-between gap-3 p-4 bg-green-50 border border-green-200 rounded-xl mb-6">
              <View className="flex-row items-center gap-3 flex-1">
                <View className="w-10 h-10 rounded-full bg-green-100 items-center justify-center">
                  <PlatformIcon name="check" size={20} color="#16a34a" />
                </View>
                <View className="flex-1">
                  <Text className="font-medium text-green-800">You're registered!</Text>
                  <Text className="text-sm text-green-600">
                    We'll send you a reminder before the session.
                  </Text>
                </View>
              </View>
              {session.status === "upcoming" && (
                <TouchableOpacity
                  onPress={handleCancelRegistration}
                  disabled={cancelling}
                  className="px-3 py-1.5"
                >
                  {cancelling ? (
                    <ActivityIndicator size="small" color="#dc2626" />
                  ) : (
                    <Text className="text-sm font-medium text-red-600">Cancel</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Register/Status button */}
          <TouchableOpacity
            onPress={canRegister ? handleRegister : undefined}
            disabled={!canRegister || registering}
            activeOpacity={canRegister ? 0.7 : 1}
            className={`w-full rounded-xl overflow-hidden ${!canRegister ? "opacity-50" : ""}`}
          >
            {canRegister ? (
              <LinearBg className="py-4 items-center justify-center">
                {registering ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="font-semibold text-lg text-white">Register Now</Text>
                )}
              </LinearBg>
            ) : (
              <View className="bg-gray-200 py-4 items-center justify-center">
                <Text className="font-semibold text-lg text-gray-400">
                  {isRegistered
                    ? "Already Registered"
                    : isFull
                    ? "Session Full"
                    : session.status !== "upcoming"
                    ? "Registration Closed"
                    : "Register Now"}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: "#000000",
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
});
