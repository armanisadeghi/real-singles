import FilterOptions, { FilterData } from "@/components/FilterOptions";
import LinearBg from "@/components/LinearBg";
import SideMenu from "@/components/SidebarMenu";
import EventCard from "@/components/ui/EventCard";
import ProfileCard from "@/components/ui/ProfileCard";
import VideoCard from "@/components/ui/VideoCard";
import VirtualDateCard from "@/components/ui/VirtualDateCard";
import { icons } from "@/constants/icons";
import { images } from "@/constants/images";
import { applyFilters, checkRedeemPoints, clearFilter, fetchUserProfile, getHomeScreenData, saveFilter } from "@/lib/api";
import { EventCardProps, User } from "@/types";
import { useAuth } from "@/utils/authContext";
import { getCurrentUserId, VIDEO_URL } from "@/utils/token";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { useFocusEffect, useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
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
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [filterapplying, setFilterApplying] = useState(true);
  const [topMatch, setTopMatch] = useState<User[]>([]);
  const [nearBy, setNearBy] = useState<User[]>([]);
  const [videos, setVideos] = useState<VideoCardProps[]>([]);
  const [events, setEvents] = useState<EventCardProps[]>([]);
  const [virtual, setVirtual] = useState<any[]>([]);
    const [loadingClear, setLoadingClear] = useState(false);
  const [filters, setFilters] = useState<FilterData>({
    ageRange: { min: 18, max: 70 },
    heightRange: { min: 4.0, max: 10.0 },
    gender: "",
    bodyType: "",
    maritalStatus: "",
    ethnicity: "",
    religion: "",
    marijuana: "",
    drinking: "",
    hasKids: "",
    wantKids: "",
    pets: false,
    zodiac: [],
  });
  const [loading, setLoading] = useState(false);

  const bottomSheetModalRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["78%", "80%"], []);
  const [bottomSheetIndex, setBottomSheetIndex] = useState(-1);
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
      Toast.show({
        type: "success",
        text1: "Content refreshed",
        position: "bottom",
        visibilityTime: 1500,
        autoHide: true,
      });
    } catch (error) {
      console.error("Error refreshing data:", error);
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

  const handleFilterPress = useCallback(() => {
    setBottomSheetIndex(0);
  }, []);

  const handleApplyFilters = useCallback(async (newFilters: FormData) => {
    console.log("Filters applied:", newFilters);
    setFilterApplying(true);
    try {
      const res = await saveFilter(newFilters);
      console.log("Response from saveFilter:", res);

      if (res?.success) {
        setFiltersApplied(true);
        bottomSheetModalRef.current?.close();
        Toast.show({
          type: "success",
          text1: "Filters applied successfully",
          position: "bottom",
          bottomOffset: 100,
          visibilityTime: 2000,
          autoHide: true,
        });
        applySelectedFilters(newFilters);
      }
    } catch (error) {
      console.error("Error applying filters:", error);
      Toast.show({
        type: "error",
        text1: "Failed to apply filters",
        position: "bottom",
        bottomOffset: 100,
        visibilityTime: 2000,
        autoHide: true,
      });
    } finally {
      setFilterApplying(false);
    }
  }, []);

  const applySelectedFilters = async (newFilters: any) => {
    console.log("Processing filters for GET request...", newFilters);

    setFilterApplying(true);
    try {
      // 1. FormData ko Plain Object mein convert karein
      const params: any = {};

      // Agar newFilters FormData hai, to uske _parts se values nikalenge
      if (newFilters && newFilters._parts) {
        newFilters._parts.forEach(([key, value]: [string, any]) => {
          params[key] = value;
        });
      } else {
        // Agar direct object hai (optional check)
        Object.assign(params, newFilters);
      }

      // 2. GET API call karein
      const res = await applyFilters(params);
      // console.log("Response from applyFilters (GET):", res);

      if (res?.success) {
        // Data update karein
        setTopMatch(res?.data || []);

        setFiltersApplied(true);
        bottomSheetModalRef.current?.close();

        Toast.show({
          type: "success",
          text1: "Results updated!",
          position: "bottom",
        });
      }
    } catch (error) {
      console.error("Error fetching filtered data:", error);
      Toast.show({
        type: "error",
        text1: "Failed to fetch results",
        position: "bottom",
      });
    } finally {
      setFilterApplying(false);
    }
  };

      // Run once on first render
  useEffect(() => {
    const clearFiltersOnStart = async () => {
      setLoadingClear(true);
      try {
        const res = await clearFilter();
        console.log("Clear Filter Response on app start:", res);

        if (res?.success) {
          // Reset any state if needed
          applySelectedFilters({
            ageMin: 18,
            ageMax: 70,
            heightMin: 4,
            heightMax: 10,
            zodiac: [],
            education: "",
            smoke: "",
            politicalView: "",
            exercise: "",
            lookingFor: "",
            minDistance: 0,
            maxDistance: 10000,
            gender: "",
            bodyType: "",
            maritalStatus: "",
            ethnicity: "",
            religion: "",
            marijuana: "",
            drinking: "",
            hasKids: "",
            wantKids: "",
            pets: false,
          });
        }
         fetchHomeData();
      } catch (error) {
        console.error("Error clearing filters on app start:", error);
      } finally {
        setLoadingClear(false);
      }
    };

    clearFiltersOnStart();
  }, []);


  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

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
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
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
        <SideMenu
          visible={menuVisible}
          onClose={() => setMenuVisible(false)}
          userAvatar={profile?.Image ? { uri: VIDEO_URL + profile.Image } : null}
          userName={profile?.DisplayName || "User"}
        />
        <ImageBackground
          source={images.hero}
          resizeMode="cover"
          style={{ minHeight: 244 + safeArea.top }}
        >
          <View
            className="flex-row justify-between items-start"
            style={{ paddingHorizontal: SPACING.screenPadding, paddingTop: headerTopPadding }}
          >
            <TouchableOpacity onPress={() => router.push("/profile")}>
              {profile?.Image ? (
                <Image
                  source={{ uri: VIDEO_URL + profile.Image }}
                  className="border-2 border-white rounded-full"
                  style={{ width: ICON_SIZES['3xl'] * 1.25, height: ICON_SIZES['3xl'] * 1.25 }}
                />
              ) : (
                <View
                  className="border-2 border-white rounded-full justify-center items-center"
                  style={{
                    width: ICON_SIZES['3xl'] * 1.25,
                    height: ICON_SIZES['3xl'] * 1.25,
                    backgroundColor:
                      BACKGROUND_COLORS[
                      Math.abs(
                        (profile?.DisplayName || "User")
                          .split("")
                          .reduce(
                            (acc, char) => acc + char.charCodeAt(0),
                            0
                          ) % BACKGROUND_COLORS.length
                      )
                      ],
                  }}
                >
                  <Text className="text-white font-bold" style={TYPOGRAPHY.h3}>
                    {profile?.DisplayName
                      ? profile.DisplayName.split(" ")
                        .map((part) => part.charAt(0))
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()
                      : "U"}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <View className="flex-row items-center" style={{ gap: SPACING.xs }}>
              <TouchableOpacity
                onPress={() => router.push("/notification")}
                className="border border-border rounded-button"
                style={{ padding: SPACING.xs }}
              >
                <Image
                  source={icons.bell}
                  style={{ width: ICON_SIZES.sm, height: ICON_SIZES.sm }}
                  resizeMode="contain"
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setMenuVisible(true)}
                className="border border-border rounded-button"
                style={{ padding: SPACING.xs }}
              >
                <Image
                  source={icons.menu}
                  style={{ width: ICON_SIZES.sm, height: ICON_SIZES.sm }}
                  resizeMode="contain"
                />
              </TouchableOpacity>
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
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push("/redeem")}
              className="items-end"
            >
              <View className="relative">
                <Image source={images.heart} />
                <View 
                  className="absolute flex flex-col justify-center items-center"
                  style={{ 
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                  }}
                >
                  <Text className="font-bold text-white" style={TYPOGRAPHY.h3}>
                    {redeemPoints}
                  </Text>
                  <Text className="font-medium text-white" style={TYPOGRAPHY.caption1}>
                    Points
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </ImageBackground>
        <View 
          className="flex-row items-center" 
          style={{ 
            marginTop: VERTICAL_SPACING.md,
            paddingRight: SPACING.screenPadding,
          }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flex: 1 }}
            contentContainerStyle={{ 
              paddingLeft: SPACING.screenPadding,
              paddingRight: SPACING.sm,
            }}
          >
            <View className="flex-row" style={{ gap: SPACING.sm }}>
              <TouchableOpacity
                className="bg-primary rounded-full"
                style={{ 
                  paddingHorizontal: SPACING.base, 
                  paddingVertical: SPACING.sm,
                  minHeight: 36,
                  justifyContent: 'center',
                }}
                activeOpacity={0.7}
              >
                <Text className="text-white font-medium" style={TYPOGRAPHY.subheadline}>All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/topMatches",
                    params: { category: "topMatches" },
                  })
                }
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
                onPress={() =>
                  router.push({
                    pathname: "/topMatches",
                    params: { category: "featuredVideos" },
                  })
                }
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
                  Featured Videos
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/topMatches",
                    params: { category: "virtualDates" },
                  })
                }
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
                onPress={() => router.push("/nearbyprofile")}
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
                onPress={() => router.push("/events")}
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

          <TouchableOpacity
            onPress={handleFilterPress}
            className="rounded-full overflow-hidden"
            style={{ 
              marginLeft: SPACING.sm,
              ...Platform.select({
                ios: {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                },
                android: {
                  elevation: 3,
                },
              }),
            }}
            activeOpacity={0.7}
          >
            <LinearBg style={{ 
              padding: SPACING.sm,
              borderRadius: 9999,
            }}>
              <Image
                source={icons.filter}
                style={{ width: ICON_SIZES.sm, height: ICON_SIZES.sm }}
                resizeMode="contain"
              />
            </LinearBg>
          </TouchableOpacity>
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
            <Text className="text-primary font-bold" style={TYPOGRAPHY.h3}>Top Matches</Text>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/topMatches",
                  params: { category: "topMatches" },
                })
              }
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
            <Text className="text-primary font-bold" style={TYPOGRAPHY.h3}>
              Featured Videos
            </Text>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/topMatches",
                  params: { category: "featuredVideos" },
                })
              }
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
              onPress={() =>
                router.push({
                  pathname: "/topMatches",
                  params: { category: "virtualDates" },
                })
              }
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
              Nearby Profile
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/nearbyprofile")}
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
            <Text className="text-primary font-bold" style={TYPOGRAPHY.h3}>Events</Text>
            <TouchableOpacity
              onPress={() => router.push("/events")}
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
      </ScrollView>
      <BottomSheet
        ref={bottomSheetModalRef}
        index={bottomSheetIndex}
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        onClose={() => setBottomSheetIndex(-1)}
        backdropComponent={renderBackdrop}
      >
        <BottomSheetScrollView
          contentContainerStyle={{
            backgroundColor: "#fff",
            paddingBottom: 100,
          }}
        >
          <FilterOptions
            initialFilters={filters}
            onApplyFilters={handleApplyFilters}
          />
        </BottomSheetScrollView>
      </BottomSheet>
    </>
  );
}
