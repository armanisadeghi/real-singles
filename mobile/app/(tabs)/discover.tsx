import FilterOptions, { FilterData } from "@/components/FilterOptions";
import LinearBg from "@/components/LinearBg";
import NotificationBell from "@/components/NotificationBell";
import ProfileCard from "@/components/ui/ProfileCard";
import { icons } from "@/constants/icons";
import { ICON_SIZES, SPACING, TYPOGRAPHY, VERTICAL_SPACING } from "@/constants/designTokens";
import { getHomeScreenData } from "@/lib/api";
import { User } from "@/types";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { useSafeArea, useHeaderSpacing } from "@/hooks/useResponsive";

export default function Discover() {
  const router = useRouter();
  const safeArea = useSafeArea();
  const { minimal: headerTopPadding } = useHeaderSpacing();
  
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [discoverProfiles, setDiscoverProfiles] = useState<User[]>([]);
  const [filtersChanged, setFiltersChanged] = useState(false);
  
  // Filter state
  // Note: gender preference is NOT a filter - it comes from user's profile "looking_for" field
  const [filters, setFilters] = useState<FilterData>({
    ageRange: { min: 18, max: 70 },
    heightRange: { min: 4.0, max: 10.0 },
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

  // Bottom sheet
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["80%", "90%"], []);
  const [bottomSheetIndex, setBottomSheetIndex] = useState(-1);

  const fetchDiscoverProfiles = async () => {
    setLoading(true);
    try {
      const res = await getHomeScreenData();
      console.log("Discover profiles fetched:", res);
      if (res?.success) {
        // Combine TopMatch and NearBy for discover feed
        const allProfiles = [
          ...(res?.TopMatch || []),
          ...(res?.NearBy || []),
        ];
        // Remove duplicates by ID
        const uniqueProfiles = allProfiles.filter(
          (profile, index, self) =>
            index === self.findIndex((p) => p.ID === profile.ID)
        );
        setDiscoverProfiles(uniqueProfiles);
      } else {
        console.log("Failed to fetch discover profiles:", res?.msg);
        Toast.show({
          type: "error",
          text1: res?.msg || "Failed to fetch profiles",
          position: "bottom",
          visibilityTime: 2000,
          autoHide: true,
        });
      }
    } catch (error) {
      console.error("Error fetching discover profiles:", error);
      Toast.show({
        type: "error",
        text1: "Failed to fetch profiles",
        position: "bottom",
        bottomOffset: 100,
        visibilityTime: 2000,
        autoHide: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchDiscoverProfiles();
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDiscoverProfiles();
  }, []);

  const handleFilterPress = useCallback(() => {
    setBottomSheetIndex(0);
  }, []);

  // Called when filters are changed in FilterOptions
  const handleFiltersChanged = useCallback(() => {
    console.log("Filters changed, will refresh on close");
    setFiltersChanged(true);
  }, []);

  // Handle bottom sheet close - refresh profiles if filters changed
  const handleBottomSheetChange = useCallback((index: number) => {
    if (index === -1) {
      // Bottom sheet closed
      setBottomSheetIndex(-1);
      if (filtersChanged) {
        console.log("Refreshing profiles after filter change");
        fetchDiscoverProfiles();
        setFiltersChanged(false);
      }
    }
  }, [filtersChanged]);

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

  return (
    <>
      <View className="flex-1 bg-background">
        <Toast />
        
        {/* Header */}
        <View
          className="bg-white flex-row justify-between items-center rounded-b-xl z-30"
          style={{
            paddingHorizontal: SPACING.screenPadding,
            paddingTop: headerTopPadding,
            paddingBottom: VERTICAL_SPACING.md,
            ...Platform.select({
              ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
              },
              android: {
                elevation: 4,
              },
            }),
          }}
        >
          <View className="flex-row items-center" style={{ gap: SPACING.sm }}>
            <Image
              source={icons.search}
              style={{ width: ICON_SIZES.md, height: ICON_SIZES.md }}
              resizeMode="contain"
            />
            <Text
              className="text-black font-semibold"
              style={TYPOGRAPHY.h2}
            >
              Discover
            </Text>
          </View>

          <View className="flex-row items-center" style={{ gap: SPACING.sm }}>
            {/* Filter Button */}
            <TouchableOpacity
              onPress={handleFilterPress}
              className="rounded-full overflow-hidden"
              style={{
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
            
            <NotificationBell />
          </View>
        </View>

        {/* Content */}
        {loading && !refreshing ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#B06D1E" />
          </View>
        ) : (
          <View className="flex-1" style={{ paddingTop: VERTICAL_SPACING.md }}>
            <FlatList
              data={discoverProfiles}
              numColumns={2}
              columnWrapperStyle={{
                justifyContent: "space-between",
                paddingHorizontal: SPACING.screenPadding,
                gap: SPACING.md,
                marginBottom: VERTICAL_SPACING.md,
              }}
              contentContainerStyle={{
                paddingBottom: 100,
              }}
              renderItem={({ item }) => (
                <ProfileCard key={item?.ID} profile={item} />
              )}
              keyExtractor={(item, index) => `${item?.ID}-${index}`}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={["#B06D1E"]}
                  tintColor="#B06D1E"
                />
              }
              ListEmptyComponent={
                <View className="flex-1 items-center justify-center py-20">
                  <Image
                    source={icons.search}
                    style={{ 
                      width: ICON_SIZES['3xl'], 
                      height: ICON_SIZES['3xl'],
                      opacity: 0.3,
                      marginBottom: VERTICAL_SPACING.md,
                    }}
                    resizeMode="contain"
                  />
                  <Text 
                    className="text-gray-500 text-center"
                    style={TYPOGRAPHY.body}
                  >
                    No profiles found
                  </Text>
                  <Text 
                    className="text-gray-400 text-center"
                    style={{ ...TYPOGRAPHY.caption1, marginTop: SPACING.xs }}
                  >
                    Try adjusting your filters
                  </Text>
                  <TouchableOpacity
                    onPress={handleFilterPress}
                    className="mt-4 bg-primary rounded-full"
                    style={{
                      paddingHorizontal: SPACING.lg,
                      paddingVertical: SPACING.sm,
                    }}
                    activeOpacity={0.7}
                  >
                    <Text className="text-white font-medium" style={TYPOGRAPHY.button}>
                      Adjust Filters
                    </Text>
                  </TouchableOpacity>
                </View>
              }
            />
          </View>
        )}
      </View>

      {/* Filter Bottom Sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={bottomSheetIndex}
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        onChange={handleBottomSheetChange}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{ backgroundColor: '#CBD5E1' }}
      >
        <BottomSheetScrollView
          contentContainerStyle={{
            backgroundColor: "#fff",
            paddingBottom: 120,
          }}
        >
          <FilterOptions
            initialFilters={filters}
            onFiltersChanged={handleFiltersChanged}
          />
        </BottomSheetScrollView>
      </BottomSheet>
    </>
  );
}
