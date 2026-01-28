import { HomeHeaderMenu } from "@/components/home";
import SideMenu from "@/components/SidebarMenu";
import { Avatar } from "@/components/ui/Avatar";
import EventCard from "@/components/ui/EventCard";
import { PlatformIcon } from "@/components/ui/PlatformIcon";
import { PointsBadge } from "@/components/ui/PointsBadge";
import ProfileCard from "@/components/ui/ProfileCard";
import VideoCard from "@/components/ui/VideoCard";
import VirtualDateCard from "@/components/ui/VirtualDateCard";
import { images } from "@/constants/images";
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
  ImageBackground,
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

  if (isLoading) {
    return (
      <View className="w-full h-full flex items-center justify-center py-4">
        <ActivityIndicator size="large" color="#B06D1E" />
      </View>
    );
  }


  const BACKGROUND_COLORS = [
    "#F44336",
    "#E91E63",
    "#9C27B0",
    "#673AB7",
    "#3F51B5",
    "#2196F3",
    "#03A9F4",
    "#00BCD4",
    "#009688",
    "#4CAF50",
    "#8BC34A",
    "#FF9800",
    "#FF5722",
    "#795548",
    "#607D8B",
  ];

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
            colors={["#B06D1E"]}
            tintColor="#B06D1E"
            title="Pull to refresh..."
            titleColor="#B06D1E"
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
        <ImageBackground
          source={images.hero}
          resizeMode="cover"
          style={{ minHeight: 244 + safeArea.top }}
        >
          <View
            className="flex-row justify-between items-start"
            style={{ paddingHorizontal: SPACING.screenPadding, paddingTop: headerTopPadding }}
          >
            <TouchableOpacity 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push("/profile");
              }}
            >
              <Avatar
                src={profile?.Image}
                name={profile?.DisplayName || "User"}
                size="xl"
                borderColor={themedColors.background}
                borderWidth={2}
              />
            </TouchableOpacity>
            <View className="flex-row items-center" style={{ gap: SPACING.sm }}>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/notification");
                }}
                className="rounded-full"
                style={{ 
                  padding: SPACING.sm,
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                }}
              >
                <PlatformIcon
                  name="notifications"
                  size={ICON_SIZES.md}
                  color="#ffffff"
                />
              </TouchableOpacity>
              <HomeHeaderMenu
                onShowMenu={() => setMenuVisible(true)}
                iconColor="#ffffff"
                backgroundColor="rgba(255, 255, 255, 0.15)"
              />
            </View>
          </View>
          <View
            className="flex-row justify-between items-start"
            style={{ paddingHorizontal: SPACING.screenPadding, marginTop: VERTICAL_SPACING.lg }}
          >
            <View className="w-3/4">
              <Text
                className="font-bold text-white"
                style={TYPOGRAPHY.h1}
              >
                Find Your Perfect Match
              </Text>
            </View>
            <PointsBadge
              points={redeemPoints}
              size="md"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/redeem");
              }}
            />
          </View>
        </ImageBackground>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: VERTICAL_SPACING.md }}
          contentContainerStyle={{ 
            paddingHorizontal: SPACING.screenPadding,
          }}
        >
          <View className="flex-row" style={{ gap: SPACING.sm }}>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/discover");
              }}
              className="border border-primary bg-secondary rounded-full"
              style={{ 
                paddingHorizontal: SPACING.base, 
                paddingVertical: SPACING.sm,
                minHeight: 36,
                justifyContent: 'center',
              }}
              activeOpacity={0.7}
            >
              <Text className="text-black font-medium" style={TYPOGRAPHY.subheadline}>Discover</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({
                  pathname: "/topMatches",
                  params: { category: "topMatches" },
                });
              }}
              className="border border-primary bg-secondary rounded-full"
              style={{ 
                paddingHorizontal: SPACING.base, 
                paddingVertical: SPACING.sm,
                minHeight: 36,
                justifyContent: 'center',
              }}
              activeOpacity={0.7}
            >
              <Text className="text-black font-medium" style={TYPOGRAPHY.subheadline}>
                Top Matches
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({
                  pathname: "/topMatches",
                  params: { category: "featuredVideos" },
                });
              }}
              className="border border-primary bg-secondary rounded-full"
              style={{ 
                paddingHorizontal: SPACING.base, 
                paddingVertical: SPACING.sm,
                minHeight: 36,
                justifyContent: 'center',
              }}
              activeOpacity={0.7}
            >
              <Text className="text-black font-medium" style={TYPOGRAPHY.subheadline}>
                Videos
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/speed-dating");
              }}
              className="border border-primary bg-secondary rounded-full"
              style={{ 
                paddingHorizontal: SPACING.base, 
                paddingVertical: SPACING.sm,
                minHeight: 36,
                justifyContent: 'center',
              }}
              activeOpacity={0.7}
            >
              <Text className="text-black font-medium" style={TYPOGRAPHY.subheadline}>
                Virtual Dates
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/nearbyprofile");
              }}
              className="border border-primary bg-secondary rounded-full"
              style={{ 
                paddingHorizontal: SPACING.base, 
                paddingVertical: SPACING.sm,
                minHeight: 36,
                justifyContent: 'center',
              }}
              activeOpacity={0.7}
            >
              <Text className="text-black font-medium" style={TYPOGRAPHY.subheadline}>
                Nearby
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/events");
              }}
              className="border border-primary bg-secondary rounded-full"
              style={{ 
                paddingHorizontal: SPACING.base, 
                paddingVertical: SPACING.sm,
                minHeight: 36,
                justifyContent: 'center',
              }}
              activeOpacity={0.7}
            >
              <Text className="text-black font-medium" style={TYPOGRAPHY.subheadline}>
                Events
              </Text>
            </TouchableOpacity>
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
              <Text className="font-medium underline text-black" style={TYPOGRAPHY.subheadline}>
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
                <Text className="text-gray" style={TYPOGRAPHY.body}>
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
              <Text className="font-medium underline text-black" style={TYPOGRAPHY.subheadline}>
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
                <Text className="text-gray" style={TYPOGRAPHY.body}>No events available</Text>
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
              <Text className="font-medium underline text-black" style={TYPOGRAPHY.subheadline}>
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
                <Text className="text-gray" style={TYPOGRAPHY.body}>
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
              <Text className="font-medium underline text-black" style={TYPOGRAPHY.subheadline}>
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
                <Text className="text-gray" style={TYPOGRAPHY.body}>
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
              <Text className="font-medium underline text-black" style={TYPOGRAPHY.subheadline}>
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
                <Text className="text-gray" style={TYPOGRAPHY.body}>
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
