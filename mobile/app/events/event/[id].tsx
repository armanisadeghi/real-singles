import { formatEventDate } from "@/components/EventDetails";
import { getEventDetails } from "@/lib/api";
import { markEventAsInterested, cancelEventRegistration } from "@/lib/api";
import { EventCardProps } from "@/types";
import { IMAGE_URL, VIDEO_URL } from "@/utils/token";
import { addEventToCalendar } from "@/utils/permissions";
import { PlatformIcon } from "@/components/ui";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Linking,
  Platform,
  PlatformColor,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const HERO_HEIGHT = SCREEN_WIDTH * 0.65; // 16:10 aspect ratio approximately

// Array of background colors for events without images
const BACKGROUND_COLORS = [
  "#F44336", "#E91E63", "#9C27B0", "#673AB7", "#3F51B5",
  "#2196F3", "#03A9F4", "#00BCD4", "#009688", "#4CAF50",
  "#8BC34A", "#FF9800", "#FF5722", "#795548", "#607D8B",
];

export default function EventDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<EventCardProps>();
  const [loading, setLoading] = useState(false);
  const [isRsvpLoading, setIsRsvpLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [reduceTransparency, setReduceTransparency] = useState(false);

  // Check accessibility preferences for reduced transparency
  useEffect(() => {
    if (Platform.OS === "ios") {
      AccessibilityInfo.isReduceTransparencyEnabled().then(setReduceTransparency);
    }
  }, []);

  // Generate consistent background color for events without images
  const bgColor = useMemo(() => {
    if (!data) return BACKGROUND_COLORS[0];
    const seed = data?.EventID || data?.EventName || "";
    const index = Math.abs(
      seed.toString().split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % BACKGROUND_COLORS.length
    );
    return BACKGROUND_COLORS[index];
  }, [data]);

  const fetchEventDetails = useCallback(async () => {
    setLoading(true);
    try {
      const eventId = Array.isArray(id) ? id[0] : id;
      const res = await getEventDetails(eventId);
      if (res?.success) {
        setData(res?.data);
      }
    } catch (error) {
      console.error("Error fetching event details:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEventDetails();
  }, [fetchEventDetails]);

  const mapRegion = useMemo(() => ({
    latitude: parseFloat(data?.Latitude || "") || 37.78825,
    longitude: parseFloat(data?.Longitude || "") || -122.4324,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  }), [data?.Latitude, data?.Longitude]);

  const isRegistered = data?.isMarkInterested === 1;
  const locationString = [data?.Street, data?.City, data?.State].filter(Boolean).join(", ");
  const venueString = [data?.VenueName, data?.Street, data?.City, data?.State].filter(Boolean).join(", ");

  // === ACTION HANDLERS ===

  const handleRsvp = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsRsvpLoading(true);

    try {
      if (isRegistered) {
        const res = await cancelEventRegistration(data?.EventID);
        if (res?.success) {
          fetchEventDetails();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          Alert.alert("Error", res?.msg || "Failed to cancel RSVP");
        }
      } else {
        const formData = new FormData();
        formData.append("EventID", data?.EventID || "");
        const res = await markEventAsInterested(formData);
        if (res?.success) {
          fetchEventDetails();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          Alert.alert("Error", res?.msg || "Failed to RSVP");
        }
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Failed to update RSVP. Please try again.");
    } finally {
      setIsRsvpLoading(false);
    }
  }, [isRegistered, data?.EventID, fetchEventDetails]);

  const handleAddToCalendar = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const startDate = new Date(data?.EventDate || "");
      if (data?.StartTime) {
        const [time, period] = data.StartTime.split(" ");
        const [hours, minutes] = time.split(":");
        let hour = parseInt(hours);
        if (period === "PM" && hour !== 12) hour += 12;
        if (period === "AM" && hour === 12) hour = 0;
        startDate.setHours(hour, parseInt(minutes));
      }

      const endDate = new Date(startDate);
      if (data?.EndTime) {
        const [time, period] = data.EndTime.split(" ");
        const [hours, minutes] = time.split(":");
        let hour = parseInt(hours);
        if (period === "PM" && hour !== 12) hour += 12;
        if (period === "AM" && hour === 12) hour = 0;
        endDate.setHours(hour, parseInt(minutes));
      } else {
        endDate.setHours(endDate.getHours() + 2);
      }

      const result = await addEventToCalendar({
        title: data?.EventName || "RealSingles Event",
        notes: data?.Description || "",
        startDate,
        endDate,
        location: venueString,
      });

      if (result.success) {
        const formattedDate = startDate.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        });
        const formattedTime = startDate.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });

        Alert.alert(
          `"${data?.EventName}" Added`,
          `${formattedDate} at ${formattedTime}${venueString ? `\n${venueString}` : ""}`,
          [
            { text: "OK", style: "cancel" },
            {
              text: "View in Calendar",
              style: "default",
              onPress: () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                Linking.openURL(Platform.OS === "ios" ? "calshow:" : "content://com.android.calendar/time/");
              },
            },
          ]
        );
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Failed to add event to calendar.");
    }
  }, [data, venueString]);

  const handleShare = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const eventDate = data?.EventDate ? formatEventDate(data.EventDate) : "";
    const deepLink = `trusingle://events/${data?.EventID}`;
    const shareMessage = `Check out this event on RealSingles!\n\n${data?.EventName}\n${eventDate}${data?.StartTime ? ` at ${data.StartTime}` : ""}\n${locationString ? `Location: ${locationString}` : ""}`;

    try {
      await Share.share(
        Platform.OS === "ios"
          ? { message: shareMessage, url: deepLink }
          : { message: `${shareMessage}\n\n${deepLink}` }
      );
    } catch (error) {
      console.error("Error sharing event:", error);
    }
  }, [data, locationString]);

  const handleOpenInMaps = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const lat = parseFloat(data?.Latitude || "") || 37.78825;
    const lng = parseFloat(data?.Longitude || "") || -122.4324;
    const label = encodeURIComponent(data?.EventName || "Event Location");

    const url = Platform.OS === "ios"
      ? `maps:0,0?q=${label}@${lat},${lng}`
      : `geo:${lat},${lng}?q=${lat},${lng}(${label})`;

    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
      }
    });
  }, [data]);

  const handleOpenLink = useCallback(async (url: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const formattedUrl = url.startsWith("http") ? url : `https://${url}`;
    const supported = await Linking.canOpenURL(formattedUrl);
    if (supported) {
      await Linking.openURL(formattedUrl);
    }
  }, []);

  // === RENDER ===

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={Platform.OS === "ios" ? (PlatformColor("systemPink") as unknown as string) : "#E91E63"}
        />
      </View>
    );
  }

  const imageUrl = data?.EventImage
    ? data.EventImage.startsWith("http")
      ? data.EventImage
      : data.EventImage.startsWith("uploads/")
      ? IMAGE_URL + data.EventImage
      : VIDEO_URL + data.EventImage
    : null;

  return (
    <>
      <Stack.Screen
        options={{
          title: "Event Details",
          headerLargeTitle: false,
          headerTransparent: Platform.OS === "ios",
          headerBlurEffect: Platform.OS === "ios" ? "regular" : undefined,
          headerTintColor: Platform.OS === "ios" ? (PlatformColor("label") as unknown as string) : "#000",
        }}
      />

      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
        >
          {/* Hero Image Container */}
          <View style={styles.heroContainer}>
            {imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                style={styles.heroImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.heroImage, styles.heroPlaceholder, { backgroundColor: bgColor }]}>
                <Text style={styles.heroPlaceholderText} numberOfLines={3}>
                  {data?.EventName || "Event"}
                </Text>
              </View>
            )}

            {/* Date Badge */}
            <View style={styles.dateBadge}>
              <Text style={styles.dateBadgeText}>
                {data?.EventDate ? formatEventDate(data.EventDate) : "Date TBD"}
              </Text>
            </View>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Title & Location */}
            <View style={styles.titleSection}>
              <Text style={styles.title}>{data?.EventName}</Text>
              <View style={styles.locationRow}>
                <PlatformIcon name="location-on" size={16} color="#B06D1E" style={styles.locationIcon} />
                <Text style={styles.locationText}>{locationString || "Location TBD"}</Text>
              </View>
            </View>

            {/* Interested Users */}
            {data?.interestedUserImage && data.interestedUserImage.length > 0 && (
              <View style={styles.attendeesSection}>
                <View style={styles.attendeesAvatars}>
                  {data.interestedUserImage.slice(0, 5).map((member, index) => (
                    <TouchableOpacity
                      key={member?.ID || index}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push(`/discover/profile/${member?.ID}`);
                      }}
                      style={[styles.avatar, { marginLeft: index > 0 ? -10 : 0, zIndex: 5 - index }]}
                    >
                      {member?.Image ? (
                        <Image
                          source={{ uri: member.Image.startsWith("http") ? member.Image : VIDEO_URL + member.Image }}
                          style={styles.avatarImage}
                        />
                      ) : (
                        <View style={[styles.avatarPlaceholder, { backgroundColor: BACKGROUND_COLORS[index % BACKGROUND_COLORS.length] }]}>
                          <Text style={styles.avatarInitials}>
                            {member?.DisplayName?.charAt(0)?.toUpperCase() || "?"}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                  {data.interestedUserImage.length > 5 && (
                    <View style={[styles.avatar, styles.avatarMore]}>
                      <Text style={styles.avatarMoreText}>+{data.interestedUserImage.length - 5}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.attendeesText}>
                  {data.interestedUserImage.length} {data.interestedUserImage.length === 1 ? "person" : "people"} interested
                </Text>
              </View>
            )}

            {/* About Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About Event</Text>
              <Text
                style={styles.description}
                numberOfLines={expanded ? undefined : 4}
              >
                {data?.Description || "No description available."}
              </Text>
              {data?.Description && data.Description.length > 150 && (
                <TouchableOpacity
                  onPress={() => {
                    Haptics.selectionAsync();
                    setExpanded(!expanded);
                  }}
                >
                  <Text style={styles.readMore}>{expanded ? "Read less" : "Read more"}</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Event Info Card */}
            <View style={styles.infoCard}>
              <View style={styles.infoCardContent}>
                <Text style={styles.infoCardTitle}>Event Info</Text>

                <View style={styles.infoRow}>
                  <PlatformIcon name="schedule" size={16} color="#666" style={styles.infoIcon} />
                  <Text style={styles.infoText}>
                    {data?.StartTime || "TBD"} - {data?.EndTime || "TBD"}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <PlatformIcon name="event" size={16} color="#666" style={styles.infoIcon} />
                  <Text style={styles.infoText}>
                    {data?.EventDate ? formatEventDate(data.EventDate) : "Date TBD"}
                  </Text>
                </View>

                {data?.Link && (
                  <TouchableOpacity
                    style={styles.infoRow}
                    onPress={() => handleOpenLink(data.Link)}
                  >
                    <PlatformIcon name="link" size={16} color="#B06D1E" style={styles.infoIcon} />
                    <Text style={[styles.infoText, styles.linkText]} numberOfLines={1}>
                      {data.Link}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Mini Map */}
              <TouchableOpacity
                style={styles.miniMapContainer}
                onPress={handleOpenInMaps}
                activeOpacity={0.8}
              >
                <MapView
                  style={styles.miniMap}
                  initialRegion={mapRegion}
                  scrollEnabled={false}
                  zoomEnabled={false}
                  rotateEnabled={false}
                  pitchEnabled={false}
                >
                  <Marker
                    coordinate={{
                      latitude: mapRegion.latitude,
                      longitude: mapRegion.longitude,
                    }}
                    pinColor="#B06D1E"
                  />
                </MapView>
                <View style={styles.miniMapOverlay}>
                  <PlatformIcon name="open-in-new" iosName="arrow.up.right" size={14} color="#fff" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Spacer for bottom action bar */}
            <View style={{ height: 120 }} />
          </View>
        </ScrollView>

        {/* Floating Action Bar */}
        <View style={[styles.actionBarContainer, { paddingBottom: Math.max(insets.bottom + 8, 20) }]}>
          {Platform.OS === "ios" && !reduceTransparency ? (
            <BlurView
              intensity={100}
              tint="systemChromeMaterial"
              style={styles.actionBar}
            >
              <ActionBarContent
                isRegistered={isRegistered}
                isRsvpLoading={isRsvpLoading}
                onShare={handleShare}
                onCalendar={handleAddToCalendar}
                onDirections={handleOpenInMaps}
                onRsvp={handleRsvp}
              />
            </BlurView>
          ) : (
            <View style={[styles.actionBar, styles.actionBarSolid]}>
              <ActionBarContent
                isRegistered={isRegistered}
                isRsvpLoading={isRsvpLoading}
                onShare={handleShare}
                onCalendar={handleAddToCalendar}
                onDirections={handleOpenInMaps}
                onRsvp={handleRsvp}
              />
            </View>
          )}
        </View>
      </View>
    </>
  );
}

// Action Bar Content Component
function ActionBarContent({
  isRegistered,
  isRsvpLoading,
  onShare,
  onCalendar,
  onDirections,
  onRsvp,
}: {
  isRegistered: boolean;
  isRsvpLoading: boolean;
  onShare: () => void;
  onCalendar: () => void;
  onDirections: () => void;
  onRsvp: () => void;
}) {
  const iconColor = Platform.OS === "ios" 
    ? (PlatformColor("systemBlue") as unknown as string) 
    : "#007AFF";
  
  const labelColor = Platform.OS === "ios"
    ? (PlatformColor("secondaryLabel") as unknown as string)
    : "#666";

  return (
    <View style={styles.actionBarInner}>
      {/* Action Buttons - Evenly distributed */}
      <Pressable
        onPress={onShare}
        style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
        accessibilityLabel="Share"
      >
        <PlatformIcon name="share" iosName="square.and.arrow.up" size={24} color={iconColor} />
        <Text style={[styles.actionLabel, { color: labelColor }]}>Share</Text>
      </Pressable>

      <Pressable
        onPress={onCalendar}
        style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
        accessibilityLabel="Add to Calendar"
      >
        <PlatformIcon name="event" iosName="calendar.badge.plus" size={24} color={iconColor} />
        <Text style={[styles.actionLabel, { color: labelColor }]}>Calendar</Text>
      </Pressable>

      <Pressable
        onPress={onDirections}
        style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
        accessibilityLabel="Get Directions"
      >
        <PlatformIcon name="directions" iosName="location.fill" size={24} color={iconColor} />
        <Text style={[styles.actionLabel, { color: labelColor }]}>Directions</Text>
      </Pressable>

      {/* Primary RSVP Button */}
      <Pressable
        onPress={onRsvp}
        disabled={isRsvpLoading}
        style={({ pressed }) => [
          styles.rsvpButton,
          isRegistered ? styles.rsvpButtonSecondary : styles.rsvpButtonPrimary,
          pressed && styles.rsvpButtonPressed,
          isRsvpLoading && styles.rsvpButtonDisabled,
        ]}
        accessibilityLabel={isRegistered ? "Cancel RSVP" : "RSVP to Event"}
      >
        {isRsvpLoading ? (
          <ActivityIndicator size="small" color={isRegistered ? "#666" : "#fff"} />
        ) : (
          <>
            <PlatformIcon
              name={isRegistered ? "close" : "check-circle"}
              iosName={isRegistered ? "xmark.circle" : "checkmark.circle.fill"}
              size={20}
              color={isRegistered ? "#666" : "#fff"}
            />
            <Text style={[styles.rsvpText, isRegistered && styles.rsvpTextSecondary]}>
              {isRegistered ? "Cancel" : "RSVP"}
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Platform.OS === "ios" ? (PlatformColor("systemBackground") as unknown as string) : "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Platform.OS === "ios" ? (PlatformColor("systemBackground") as unknown as string) : "#fff",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 0,
  },
  heroContainer: {
    position: "relative",
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  heroPlaceholderText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
  },
  dateBadge: {
    position: "absolute",
    bottom: -12,
    right: 16,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
  },
  dateBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#B06D1E",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  titleSection: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: Platform.OS === "ios" ? (PlatformColor("label") as unknown as string) : "#000",
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationIcon: {
    marginRight: 6,
  },
  locationText: {
    fontSize: 14,
    color: Platform.OS === "ios" ? (PlatformColor("secondaryLabel") as unknown as string) : "#666",
    flex: 1,
  },
  attendeesSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Platform.OS === "ios" ? (PlatformColor("secondarySystemBackground") as unknown as string) : "#f5f5f5",
    borderRadius: 12,
  },
  attendeesAvatars: {
    flexDirection: "row",
    marginRight: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#fff",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitials: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  avatarMore: {
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: -10,
  },
  avatarMoreText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#666",
  },
  attendeesText: {
    fontSize: 14,
    color: Platform.OS === "ios" ? (PlatformColor("secondaryLabel") as unknown as string) : "#666",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#B06D1E",
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: Platform.OS === "ios" ? (PlatformColor("secondaryLabel") as unknown as string) : "#666",
  },
  readMore: {
    fontSize: 14,
    color: "#B06D1E",
    marginTop: 8,
    fontWeight: "500",
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: Platform.OS === "ios" ? (PlatformColor("secondarySystemBackground") as unknown as string) : "#f5f5f5",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  infoCardContent: {
    flex: 1,
    marginRight: 12,
  },
  infoCardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#B06D1E",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  infoIcon: {
    marginRight: 8,
  },
  infoText: {
    fontSize: 13,
    color: Platform.OS === "ios" ? (PlatformColor("secondaryLabel") as unknown as string) : "#666",
    flex: 1,
  },
  linkText: {
    color: "#B06D1E",
    textDecorationLine: "underline",
  },
  miniMapContainer: {
    width: 90,
    height: 90,
    borderRadius: 12,
    overflow: "hidden",
  },
  miniMap: {
    width: "100%",
    height: "100%",
  },
  miniMapOverlay: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 10,
    padding: 4,
  },
  actionBarContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  actionBar: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  actionBarSolid: {
    backgroundColor: Platform.OS === "ios" 
      ? (PlatformColor("secondarySystemBackground") as unknown as string) 
      : "#f8f8f8",
  },
  actionBarInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  actionButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    minWidth: 60,
  },
  actionButtonPressed: {
    backgroundColor: Platform.OS === "ios" 
      ? "rgba(0,0,0,0.05)" 
      : "rgba(0,0,0,0.05)",
  },
  actionLabel: {
    fontSize: 10,
    fontWeight: "500",
    marginTop: 4,
  },
  rsvpButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    minWidth: 100,
    gap: 6,
  },
  rsvpButtonPrimary: {
    backgroundColor: "#B06D1E",
  },
  rsvpButtonSecondary: {
    backgroundColor: Platform.OS === "ios" 
      ? (PlatformColor("systemGray4") as unknown as string) 
      : "#d0d0d0",
  },
  rsvpButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  rsvpButtonDisabled: {
    opacity: 0.6,
  },
  rsvpText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  rsvpTextSecondary: {
    color: Platform.OS === "ios" 
      ? (PlatformColor("label") as unknown as string) 
      : "#333",
  },
});
