import { HomeHeaderMenu } from "@/components/home";
import SideMenu from "@/components/SidebarMenu";
import EventCard from "@/components/ui/EventCard";
import { GlassChip } from "@/components/ui/GlassChip";
import { PlatformIcon } from "@/components/ui/PlatformIcon";
import { PointsBadge } from "@/components/ui/PointsBadge";
import ProfileCard from "@/components/ui/ProfileCard";
import VideoCard from "@/components/ui/VideoCard";
import VirtualDateCard from "@/components/ui/VirtualDateCard";
import { checkRedeemPoints, fetchUserProfile, getHomeScreenData } from "@/lib/api";
import { EventCardProps, User } from "@/types";
import { useAuth } from "@/utils/authContext";
import { getCurrentUserId, VIDEO_URL } from "@/utils/token";
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  PlatformColor,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useThemeColors } from "@/context/ThemeContext";
import Toast from "react-native-toast-message";
import { useSafeArea, useBottomSpacing, useHeaderSpacing } from "@/hooks/useResponsive";
import { TYPOGRAPHY, SPACING, VERTICAL_SPACING, ICON_SIZES } from "@/constants/designTokens";

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Responsive hooks for safe areas and spacing
  const safeArea = useSafeArea();
  const { contentPadding } = useBottomSpacing(true);
  const { minimal: headerTopPadding } = useHeaderSpacing();

  // Dark mode support
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = useThemeColors();

  const themedColors = {
    background: Platform.OS === 'ios' ? (PlatformColor('systemBackground') as unknown as string) : colors.background,
    secondaryBackground: Platform.OS === 'ios' ? (PlatformColor('secondarySystemBackground') as unknown as string) : colors.surfaceContainer,
    text: Platform.OS === 'ios' ? (PlatformColor('label') as unknown as string) : colors.onSurface,
    secondaryText: Platform.OS === 'ios' ? (PlatformColor('secondaryLabel') as unknown as string) : colors.onSurfaceVariant,
    border: Platform.OS === 'ios' ? (PlatformColor('separator') as unknown as string) : colors.outline,
    // Brand/accent color
    primary: Platform.OS === 'ios' ? (PlatformColor('systemPink') as unknown as string) : '#B06D1E',
  };

  interface HomeData {
    TopMatch: User[];
    NearBy: User[];
    Videos: VideoCardProps[];
    event: EventCardProps[];
    Virtual: any[];
    msg: string;
    success: number;
    status: number;
    baseImageUrl: string;
  }
  type VideoCardProps = {
    ID: string;
    Name: string;
    Link: string;
    VideoURL: string | number; // string for URL, number for require()
    CreatedDate: string;
  };

  const [data, setData] = useState<HomeData>();
  const [redeemPoints, setRedeemPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [topMatch, setTopMatch] = useState<User[]>([]);
  const [nearBy, setNearBy] = useState<User[]>([]);
  const [videos, setVideos] = useState<VideoCardProps[]>([]);
  const [events, setEvents] = useState<EventCardProps[]>([]);
  const [virtual, setVirtual] = useState<any[]>([]);
  const [profile, setProfile] = useState<User | null>(null);

  const fetchHomeData = async () => {
    console.log("in fetchHomeData...");
    
    setIsLoading(true);
    try {
      const res = await getHomeScreenData();
      if (res?.success) {
        setData(res);
        console.log("Home data fetched successfully:", res);
      } else {
        console.error(res.msg || "Failed to fetch home data");
      }
    } catch (error) {
      console.error("Error fetching home data:", error);
      return;
    } finally {
      setIsLoading(false);
    }
  };

  const getRedeemPoints = async () => {
    try {
      const res = await checkRedeemPoints();
      console.log("Redeem points fetched:", res);
      if (res?.success) {
        setRedeemPoints(res?.data?.points || 0);
        console.log("Redeem points:", redeemPoints);
      } else {
        console.error(res.msg || "Failed to fetch redeem points");
        setRedeemPoints(0);
      }
    } catch (error) {
      console.log("Error fetching redeem points:", error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchHomeData(), getRedeemPoints()]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({
        type: "success",
        text1: "Content refreshed",
        position: "bottom",
        visibilityTime: 1500,
        autoHide: true,
      });
    } catch (error) {
      console.error("Error refreshing data:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({
        type: "error",
        text1: "Failed to refresh content",
        position: "bottom",
        visibilityTime: 2000,
        autoHide: true,
      });
    } finally {
      setRefreshing(false);
    }
  }, []);

  const fetchUserData = async () => {
    try {
      const userid = await getCurrentUserId();
      if (!userid) {
        console.error("User ID not found");
        return;
      }
      const res = await fetchUserProfile(userid);
      if (res?.success) {
        setProfile(res?.data);
        // console.log("User profile fetched successfully:", res?.data);
      } else {
        console.error(res?.msg || "Failed to fetch user profile");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      // Screen is focused
      console.log("settingsScreen focused");
      fetchUserData();

      return () => {
        // Screen is unfocused
        console.log("settingsScreen unfocused");
      };
    }, [])
  );

  useEffect(() => {
    getRedeemPoints();
    fetchHomeData();
  }, []);

  useEffect(() => {
    if (data) {
      setTopMatch(data?.TopMatch || []);
      setNearBy(data?.NearBy || []);
      setVideos(data?.Videos || []);
      setEvents(data?.event || []);
      setVirtual(data?.Virtual || []);
    }
  }, [data]);

  // Primary color for loading indicators
  const primaryColor = Platform.OS === 'ios' 
    ? (PlatformColor('systemPink') as unknown as string) 
    : '#B06D1E';

  if (isLoading) {
    return (
      <View className="w-full h-full flex items-center justify-center py-4">
        <ActivityIndicator size="large" color={primaryColor} />
      </View>
    );
  }

  return (
    <>
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1 bg-background"
        contentContainerStyle={{ paddingBottom: contentPadding }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[primaryColor]}
            tintColor={primaryColor}
            title="Pull to refresh..."
            titleColor={primaryColor}
          />
        }
      >
        <Toast />
        {/* Android only: Side drawer menu */}
        {Platform.OS === 'android' && (
          <SideMenu
            visible={menuVisible}
            onClose={() => setMenuVisible(false)}
            userAvatar={profile?.Image}
            userName={profile?.DisplayName || "User"}
          />
        )}
        {/* Clean Native Header */}
        <View
          style={{ 
            backgroundColor: themedColors.background,
            paddingTop: headerTopPadding,
            paddingHorizontal: SPACING.screenPadding,
            paddingBottom: SPACING.sm,
          }}
        >
          {/* Header Row: Logo + Actions */}
          <View 
            className="flex-row items-center justify-between"
          >
            {/* Left: App Logo - switches based on color scheme */}
            <Image
              source={isDark 
                ? require('../../assets/images/logo-dark.png')
                : require('../../assets/images/logo.png')
              }
              style={{ 
                height: 36,
                width: 100,
                resizeMode: 'contain',
              }}
            />
            
            {/* Right Actions: Points + Notifications + Menu */}
            <View 
              className="flex-row items-center" 
              style={{ gap: SPACING.md }}
            >
              <PointsBadge
                points={redeemPoints}
                size="sm"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/redeem");
                }}
              />
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/notification");
                }}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <PlatformIcon
                  name="notifications-none"
                  iosName="bell"
                  size={ICON_SIZES.lg}
                  color={themedColors.text}
                />
              </TouchableOpacity>
              <HomeHeaderMenu
                onShowMenu={() => setMenuVisible(true)}
                iconColor={themedColors.text}
                backgroundColor="transparent"
              />
            </View>
          </View>
        </View>
        {/* Quick Action Chips - Native iOS glass style with proper dark mode support */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: VERTICAL_SPACING.md }}
          contentContainerStyle={{ 
            paddingHorizontal: SPACING.screenPadding,
          }}
        >
          <View className="flex-row" style={{ gap: SPACING.sm }}>
            <GlassChip
              label="Discover"
              iosIcon="magnifyingglass"
              androidIcon="search"
              onPress={() => router.push("/discover")}
            />
            <GlassChip
              label="Top Matches"
              iosIcon="heart.fill"
              androidIcon="favorite"
              onPress={() => router.push({
                pathname: "/topMatches",
                params: { category: "topMatches" },
              })}
            />
            <GlassChip
              label="Videos"
              iosIcon="play.rectangle.fill"
              androidIcon="play-circle-outline"
              onPress={() => router.push({
                pathname: "/topMatches",
                params: { category: "featuredVideos" },
              })}
            />
            <GlassChip
              label="Virtual Dates"
              iosIcon="video.fill"
              androidIcon="videocam"
              onPress={() => router.push("/speed-dating")}
            />
            <GlassChip
              label="Nearby"
              iosIcon="location.fill"
              androidIcon="location-on"
              onPress={() => router.push("/nearbyprofile")}
            />
            <GlassChip
              label="Events"
              iosIcon="calendar"
              androidIcon="event"
              onPress={() => router.push("/events")}
            />
          </View>
        </ScrollView>
        <View>
          <View
            className="flex-row justify-between items-center"
            style={{
              paddingHorizontal: SPACING.screenPadding,
              marginTop: VERTICAL_SPACING.md,
              marginBottom: VERTICAL_SPACING.sm
            }}
          >
            <Text className="text-primary font-bold" style={TYPOGRAPHY.h3}>Top Matches</Text>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({
                  pathname: "/topMatches",
                  params: { category: "topMatches" },
                });
              }}
              className="z-20"
            >
              <Text className="font-medium underline" style={[TYPOGRAPHY.subheadline, { color: themedColors.text }]}>
                View All
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingLeft: SPACING.screenPadding,
              paddingRight: SPACING.screenPadding
            }}
          >
            <View className="flex-row" style={{ gap: SPACING.md }}>
              {topMatch && topMatch.length ? (
                topMatch.map((profile, index) => (
                  <ProfileCard key={index} profile={profile} />
                ))
              ) : (
                <Text style={[TYPOGRAPHY.body, { color: themedColors.secondaryText }]}>
                  No top matches available
                </Text>
              )}
            </View>
          </ScrollView>
        </View>
        <View>
          <View
            className="flex-row justify-between items-center"
            style={{
              paddingHorizontal: SPACING.screenPadding,
              marginTop: VERTICAL_SPACING.md,
              marginBottom: VERTICAL_SPACING.sm
            }}
          >
            <Text className="text-primary font-bold" style={TYPOGRAPHY.h3}>Events</Text>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/events");
              }}
              className="z-20"
            >
              <Text className="font-medium underline" style={[TYPOGRAPHY.subheadline, { color: themedColors.text }]}>
                View All
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingLeft: SPACING.screenPadding,
              paddingRight: SPACING.screenPadding
            }}
          >
            <View className="flex-row" style={{ gap: SPACING.md }}>
              {events && events?.length ? (
                events?.map((event, index) => (
                  <EventCard key={event?.EventID || index} event={event} />
                ))
              ) : (
                <Text style={[TYPOGRAPHY.body, { color: themedColors.secondaryText }]}>No events available</Text>
              )}
            </View>
          </ScrollView>
        </View>
        <View>
          <View
            className="flex-row justify-between items-center"
            style={{
              paddingHorizontal: SPACING.screenPadding,
              marginTop: VERTICAL_SPACING.md,
              marginBottom: VERTICAL_SPACING.sm
            }}
          >
            <Text className="text-primary font-bold" style={TYPOGRAPHY.h3}>
              Virtual Speed Dating
            </Text>
            <TouchableOpacity
              className="z-20"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/speed-dating");
              }}
            >
              <Text className="font-medium underline" style={[TYPOGRAPHY.subheadline, { color: themedColors.text }]}>
                View All
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingLeft: SPACING.screenPadding,
              paddingRight: SPACING.screenPadding
            }}
          >
            <View className="flex-row" style={{ gap: SPACING.md }}>
              {virtual && virtual.length ? (
                virtual.map((video, index) => (
                  <VirtualDateCard key={index} virtualDate={video} />
                ))
              ) : (
                <Text style={[TYPOGRAPHY.body, { color: themedColors.secondaryText }]}>
                  No virtual speed dating available
                </Text>
              )}
            </View>
          </ScrollView>
        </View>
        <View>
          <View
            className="flex-row justify-between items-center"
            style={{
              paddingHorizontal: SPACING.screenPadding,
              marginTop: VERTICAL_SPACING.md,
              marginBottom: VERTICAL_SPACING.sm
            }}
          >
            <Text className="text-primary font-bold" style={TYPOGRAPHY.h3}>
              Nearby Profiles
            </Text>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/nearbyprofile");
              }}
              className="z-20"
            >
              <Text className="font-medium underline" style={[TYPOGRAPHY.subheadline, { color: themedColors.text }]}>
                View All
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingLeft: SPACING.screenPadding,
              paddingRight: SPACING.screenPadding
            }}
          >
            <View className="flex-row" style={{ gap: SPACING.md }}>
              {nearBy && nearBy.length ? (
                nearBy.map((profile, index) => (
                  <ProfileCard key={index} profile={profile} />
                ))
              ) : (
                <Text style={[TYPOGRAPHY.body, { color: themedColors.secondaryText }]}>
                  No nearby profiles available
                </Text>
              )}
            </View>
          </ScrollView>
        </View>
        <View>
          <View
            className="flex-row justify-between items-center"
            style={{
              paddingHorizontal: SPACING.screenPadding,
              marginTop: VERTICAL_SPACING.md,
              marginBottom: VERTICAL_SPACING.sm
            }}
          >
            <Text className="text-primary font-bold" style={TYPOGRAPHY.h3}>
              Featured Videos
            </Text>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({
                  pathname: "/topMatches",
                  params: { category: "featuredVideos" },
                });
              }}
              className="z-20"
            >
              <Text className="font-medium underline" style={[TYPOGRAPHY.subheadline, { color: themedColors.text }]}>
                View All
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingLeft: SPACING.screenPadding,
              paddingRight: SPACING.screenPadding
            }}
          >
            <View className="flex-row" style={{ gap: SPACING.md }}>
              {videos && videos?.length ? (
                videos?.map((video, index) => (
                  <VideoCard key={index} video={video} isVideo={true} />
                ))
              ) : (
                <Text style={[TYPOGRAPHY.body, { color: themedColors.secondaryText }]}>
                  No featured videos available
                </Text>
              )}
            </View>
          </ScrollView>
        </View>
      </ScrollView>
    </>
  );
}
