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
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  // console.log("user", user);

  // console.log("Current user in Home component:", user);

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
    ethinicity: "",
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
      <StatusBar barStyle="dark-content" backgroundColor="transparent" hidden />
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1 bg-backgground pb-28"
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
        // direction="right"
        />
        <ImageBackground
          className="h-[244px]"
          source={images.hero}
          resizeMode="cover"
        >
          <View className="flex-row justify-between items-start px-3 mt-16">
            <TouchableOpacity onPress={() => router.push("/profile")}>
              {profile?.Image ? (
                <Image
                  source={{ uri: VIDEO_URL + profile.Image }}
                  className="size-[60px] border-2 border-white rounded-full"
                />
              ) : (
                <View
                  className="size-[60px] border-2 border-white rounded-full justify-center items-center"
                  style={{
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
                  <Text className="text-white text-xl font-bold">
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
            <View className="flex-row gap-2 items-center">
              <TouchableOpacity
                onPress={() => router.push("/notification")}
                className="border border-border rounded-lg p-2"
              >
                <Image
                  source={icons.bell}
                  className="w-5 h-5"
                  resizeMode="contain"
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setMenuVisible(true)}
                className="border border-border rounded-lg p-2"
              >
                <Image source={icons.menu} />
              </TouchableOpacity>
            </View>
          </View>
          <View className="flex-row justify-between items-start px-3 mt-8">
            <View className="w-3/4">
              <Text className="font-bold text-[28px] leading-[34px] tracking-wide text-white">
                Find Your Perfect Match
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push("/redeem")}
              className="relative w-1/4"
            >
              <Image source={images.heart} />
              <View className="absolute top-3 left-7 flex flex-col justify-center items-center">
                <Text className="text-lg font-bold text-white">
                  {redeemPoints}
                </Text>
                <Text className="text-[10px] font-medium text-white">
                  Points
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </ImageBackground>
        <View className="mt-4 flex-row items-center">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="px-3 pe-8"
          >
            <View className="flex-row gap-3 me-8">
              <TouchableOpacity className="px-4 py-2 bg-primary rounded-full">
                <Text className="text-white text-xs font-medium">All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/topMatches",
                    params: { category: "topMatches" },
                  })
                }
                className="px-4 py-2 border border-primary bg-secondary rounded-full"
              >
                <Text className="text-gray-600 text-xs font-medium text-black">
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
                className="px-4 py-2 border border-primary bg-secondary rounded-full"
              >
                <Text className="text-gray-600 text-xs font-medium text-black">
                  Fearured Videos
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/topMatches",
                    params: { category: "virtualDates" },
                  })
                }
                className="px-4 py-2 border border-primary bg-secondary rounded-full"
              >
                <Text className="text-gray-600 text-xs font-medium text-black">
                  Virtual Speed Dating
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push("/nearbyprofile")}
                className="px-4 py-2 border border-primary bg-secondary rounded-full"
              >
                <Text className="text-gray-600 text-xs font-medium text-black">
                  Nearby Profile
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push("/events")}
                className="px-4 py-2 border border-primary bg-secondary rounded-full"
              >
                <Text className="text-gray-600 text-xs font-medium text-black">
                  Events
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <TouchableOpacity
            onPress={handleFilterPress}
            className="mr-3 shadow-lg shadow-white rounded-lg overflow-hidden"
          >
            <LinearBg className="p-3" style={{ paddingVertical: 8, paddingHorizontal: 10 }}>
              <Image source={icons.filter} className="size-5" />
            </LinearBg>
          </TouchableOpacity>
        </View>
        <View>
          <View className="flex-row justify-between items-center px-3 mt-4 mb-3">
            <Text className="text-primary font-bold text-lg">Top Matches</Text>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/topMatches",
                  params: { category: "topMatches" },
                })
              }
              className="z-20"
            >
              <Text className="font-medium text-xs underline solid text-black">
                View All
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 20 }}
            className="pl-3 pr-10"
          >
            <View className="flex-row gap-[18px]">
              {topMatch && topMatch.length ? (
                topMatch.map((profile, index) => (
                  <ProfileCard key={index} profile={profile} />
                ))
              ) : (
                <Text className="text-gray text-sm">
                  No top matches available
                </Text>
              )}
            </View>
          </ScrollView>
        </View>
        <View>
          <View className="flex-row justify-between items-center px-3 mt-4 mb-3">
            <Text className="text-primary font-bold text-lg">
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
              <Text className="font-medium text-xs underline solid text-black">
                View All
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 20 }}
            className="pl-3 pr-10"
          >
            <View className="flex-row gap-[18px]">
              {videos && videos?.length ? (
                videos?.map((video, index) => (
                  <VideoCard key={index} video={video} isVideo={true} />
                ))
              ) : (
                <Text className="text-gray text-sm">
                  No featured videos available
                </Text>
              )}
            </View>
          </ScrollView>
        </View>
        <View>
          <View className="flex-row justify-between items-center px-3 mt-4 mb-3">
            <Text className="text-primary font-bold text-lg">
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
              <Text className="font-medium text-xs underline solid text-black">
                View All
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 20 }}
            className="pl-3 pr-10"
          >
            <View className="flex-row gap-[18px]">
              {virtual && virtual.length ? (
                virtual.map((video, index) => (
                  <VirtualDateCard key={index} virtualDate={video} />
                ))
              ) : (
                <Text className="text-gray text-sm">
                  No virtual speed dating available
                </Text>
              )}
            </View>
          </ScrollView>
        </View>
        <View>
          <View className="flex-row justify-between items-center px-3 mt-4 mb-3">
            <Text className="text-primary font-bold text-lg">
              Nearby Profile
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/nearbyprofile")}
              className="z-20"
            >
              <Text className="font-medium text-xs underline solid text-black">
                View All
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 20 }}
            className="pl-3 pr-10"
          >
            <View className="flex-row gap-[18px]">
              {nearBy && nearBy.length ? (
                nearBy.map((profile, index) => (
                  <ProfileCard key={index} profile={profile} />
                ))
              ) : (
                <Text className="text-gray text-sm">
                  No nearby profiles available
                </Text>
              )}
            </View>
          </ScrollView>
        </View>
        <View className="mb-36">
          <View className="flex-row justify-between items-center px-3 mt-4 mb-3">
            <Text className="text-primary font-bold text-lg">Events</Text>
            <TouchableOpacity
              onPress={() => router.push("/events")}
              className="z-20"
            >
              <Text className="font-medium text-xs underline solid text-black">
                View All
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 20 }}
            className="pl-3 pr-10"
          >
            <View className="flex-row gap-[18px]">
              {events && events?.length ? (
                events?.map((event, index) => (
                  <EventCard key={event?.EventID || index} event={event} />
                ))
              ) : (
                <Text className="text-gray text-sm">No events available</Text>
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
