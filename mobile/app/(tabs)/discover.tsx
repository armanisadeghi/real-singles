import FilterOptions, { FilterData } from "@/components/FilterOptions";
import LinearBg from "@/components/LinearBg";
import NotificationBell from "@/components/NotificationBell";
import ProfileListItem from "@/components/ui/ProfileListItem";
import { PlatformIcon } from "@/components/ui/PlatformIcon";
import { ICON_SIZES, SPACING, TYPOGRAPHY, VERTICAL_SPACING } from "@/constants/designTokens";
import { applyFilters, clearFilter, getHomeScreenData, getProfile, saveFilter } from "@/lib/api";
import { User } from "@/types";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import * as Haptics from 'expo-haptics';
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  PlatformColor,
  RefreshControl,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useThemeColors } from "@/context/ThemeContext";
import Toast from "react-native-toast-message";
import { useSafeArea, useHeaderSpacing } from "@/hooks/useResponsive";

export default function Discover() {
  const router = useRouter();
  const safeArea = useSafeArea();
  const { minimal: headerTopPadding } = useHeaderSpacing();

  // Dark mode support
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = useThemeColors();

  // Theme-aware colors
  // Note: BottomSheet uses Reanimated which doesn't support PlatformColor objects.
  // Use plain hex colors for BottomSheet backgrounds, PlatformColor for other native components.
  const themedColors = useMemo(() => ({
    // For native components (Text, View, etc.) - can use PlatformColor
    text: Platform.OS === 'ios' 
      ? (PlatformColor('label') as unknown as string) 
      : colors.onSurface,
    secondaryText: Platform.OS === 'ios' 
      ? (PlatformColor('secondaryLabel') as unknown as string) 
      : colors.onSurfaceVariant,
    tertiaryText: Platform.OS === 'ios'
      ? (PlatformColor('tertiaryLabel') as unknown as string)
      : (isDark ? '#6B7280' : '#9CA3AF'),
    border: Platform.OS === 'ios' 
      ? (PlatformColor('separator') as unknown as string) 
      : colors.outline,
    // Brand primary color - using plain color as it may be used in animated contexts
    primary: isDark ? '#FF6B8A' : '#B06D1E',
    // Native background for main content - uses PlatformColor for automatic adaptation
    nativeBackground: Platform.OS === 'ios'
      ? (PlatformColor('systemBackground') as unknown as string)
      : colors.background,
    // For Reanimated components (BottomSheet) - must use plain colors
    background: isDark ? '#000000' : '#FFFFFF',
    secondaryBackground: isDark ? '#1C1C1E' : '#F2F2F7',
    handleIndicator: isDark ? '#4B5563' : '#CBD5E1',
  }), [isDark, colors]);
  
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [applyingFilters, setApplyingFilters] = useState(false);
  const [discoverProfiles, setDiscoverProfiles] = useState<User[]>([]);
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [isProfilePaused, setIsProfilePaused] = useState(false);
  
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
  
  // Track pending filter changes (to be saved on sheet close)
  const pendingFiltersRef = useRef<Record<string, string> | null>(null);
  const filtersChangedRef = useRef(false);

  const fetchMyProfileStatus = async () => {
    try {
      const res = await getProfile();
      if (res?.success && res?.data) {
        setIsProfilePaused(res.data.profile_hidden || res.data.ProfileHidden || false);
      }
    } catch (error) {
      console.error("Error fetching profile status:", error);
    }
  };

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
    fetchMyProfileStatus();
  }, []);

  const handleFilterPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Reset change tracking when opening the sheet
    filtersChangedRef.current = false;
    setBottomSheetIndex(0);
  }, []);

  // Called whenever filter values change in FilterOptions
  const handleFilterChange = useCallback((filterParams: Record<string, string>) => {
    console.log("Filter values changed:", filterParams);
    pendingFiltersRef.current = filterParams;
    filtersChangedRef.current = true;
  }, []);

  // Called when user clears all filters
  const handleClearFilters = useCallback(() => {
    console.log("Filters cleared");
    pendingFiltersRef.current = null;
    filtersChangedRef.current = true;
    setFiltersApplied(false);
  }, []);

  // Save and apply filters when bottom sheet closes
  const handleSheetClose = useCallback(async () => {
    setBottomSheetIndex(-1);
    
    // Only save if filters were changed
    if (!filtersChangedRef.current) {
      console.log("No filter changes to save");
      return;
    }
    
    const filterParams = pendingFiltersRef.current;
    
    // If filters were cleared, just refresh with default results
    if (!filterParams) {
      console.log("Filters were cleared, fetching default profiles");
      fetchDiscoverProfiles();
      return;
    }
    
    console.log("Saving and applying filters on close:", filterParams);
    setApplyingFilters(true);
    
    try {
      // Create FormData for the save API
      const formData = new FormData();
      Object.entries(filterParams).forEach(([key, value]) => {
        formData.append(key, value);
      });
      
      // Save filters to server
      const saveRes = await saveFilter(formData);
      console.log("Save filter response:", saveRes);

      if (saveRes?.success) {
        // Apply filters to get updated results
        const filterRes = await applyFilters(filterParams);
        console.log("Apply filter response:", filterRes);

        if (filterRes?.success) {
          setDiscoverProfiles(filterRes?.data || []);
          setFiltersApplied(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          
          Toast.show({
            type: "success",
            text1: "Filters saved",
            text2: `Found ${filterRes?.data?.length || 0} matches`,
            position: "bottom",
            visibilityTime: 2000,
            autoHide: true,
          });
        }
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Toast.show({
          type: "error",
          text1: saveRes?.msg || "Failed to save filters",
          position: "bottom",
          visibilityTime: 2000,
          autoHide: true,
        });
      }
    } catch (error) {
      console.error("Error saving filters:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({
        type: "error",
        text1: "Failed to save filters",
        position: "bottom",
        visibilityTime: 2000,
        autoHide: true,
      });
    } finally {
      setApplyingFilters(false);
      filtersChangedRef.current = false;
    }
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

  return (
    <>
      <View 
        className="flex-1"
        style={{ backgroundColor: themedColors.nativeBackground }}
      >
        <Toast />
        
        {/* Header - uses native PlatformColor for proper dark mode adaptation */}
        <View
          className="flex-row justify-between items-center rounded-b-xl z-30"
          style={{
            backgroundColor: themedColors.nativeBackground,
            paddingHorizontal: SPACING.screenPadding,
            paddingTop: headerTopPadding,
            paddingBottom: VERTICAL_SPACING.md,
            ...Platform.select({
              ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDark ? 0.2 : 0.08,
                shadowRadius: 8,
              },
              android: {
                elevation: 4,
              },
            }),
          }}
        >
          <View className="flex-row items-center" style={{ gap: SPACING.sm }}>
            <PlatformIcon
              name="search"
              iosName="magnifyingglass"
              size={ICON_SIZES.md}
              color={themedColors.text}
            />
            <Text
              className="font-semibold"
              style={[TYPOGRAPHY.h2, { color: themedColors.text }]}
            >
              Discover
            </Text>
          </View>

          <View className="flex-row items-center" style={{ gap: SPACING.sm }}>
            {/* Filter Button - Uses SF Symbol on iOS */}
            <TouchableOpacity
              onPress={handleFilterPress}
              activeOpacity={0.7}
              style={{
                borderRadius: (ICON_SIZES.md + SPACING.md * 2) / 2,
                overflow: 'hidden',
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
            >
              <LinearBg 
                style={{ 
                  width: Math.max(ICON_SIZES.md + SPACING.md * 2, 44),
                  height: Math.max(ICON_SIZES.md + SPACING.md * 2, 44),
                  borderRadius: (ICON_SIZES.md + SPACING.md * 2) / 2,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <PlatformIcon
                  name="filter-list"
                  iosName="line.3.horizontal.decrease"
                  size={ICON_SIZES.md}
                  color="#ffffff"
                />
              </LinearBg>
            </TouchableOpacity>
            
            <NotificationBell size={ICON_SIZES.md} />
          </View>
        </View>

        {/* Profile Paused Reminder */}
        {isProfilePaused && (
          <TouchableOpacity 
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/settings");
            }}
            className="bg-orange-500 flex-row items-center justify-center"
            style={{ 
              paddingVertical: SPACING.sm,
              paddingHorizontal: SPACING.screenPadding,
              gap: SPACING.xs,
            }}
            activeOpacity={0.8}
          >
            <PlatformIcon name="pause-circle-outline" size={16} color="#fff" />
            <Text className="text-white font-medium" style={TYPOGRAPHY.caption1}>
              Your profile is paused — you won't appear to others
            </Text>
          </TouchableOpacity>
        )}

        {/* Filter Applied Badge */}
        {filtersApplied && (
          <View 
            className="flex-row items-center justify-center bg-primary/10"
            style={{ 
              paddingVertical: SPACING.xs,
              paddingHorizontal: SPACING.screenPadding,
            }}
          >
            <Text className="text-primary font-medium" style={TYPOGRAPHY.caption1}>
              Filters active
            </Text>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFiltersApplied(false);
                fetchDiscoverProfiles();
              }}
              style={{ marginLeft: SPACING.sm }}
            >
              <Text className="text-primary font-semibold underline" style={TYPOGRAPHY.caption1}>
                Clear
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Content */}
        {loading && !refreshing ? (
          <View className="flex-1 items-center justify-center" style={{ backgroundColor: themedColors.nativeBackground }}>
            <ActivityIndicator size="large" color={themedColors.primary} />
          </View>
        ) : (
          <View className="flex-1" style={{ paddingTop: VERTICAL_SPACING.md }}>
          <FlatList
            data={discoverProfiles}
            contentContainerStyle={{
              paddingBottom: 100,
              gap: VERTICAL_SPACING.xs,
            }}
            renderItem={({ item }) => (
              <ProfileListItem key={item?.ID} profile={item} navigateToFocus={true} />
            )}
            keyExtractor={(item, index) => `${item?.ID}-${index}`}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[themedColors.primary]}
                tintColor={themedColors.primary}
              />
            }
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center py-20">
                <PlatformIcon
                  name="search"
                  iosName="magnifyingglass"
                  size={ICON_SIZES['3xl']}
                  color={themedColors.tertiaryText}
                  style={{ marginBottom: VERTICAL_SPACING.md, opacity: 0.5 }}
                />
                <Text 
                  className="text-center"
                  style={[TYPOGRAPHY.body, { color: themedColors.secondaryText }]}
                >
                  No profiles found
                </Text>
                <Text 
                  className="text-center"
                  style={[TYPOGRAPHY.caption1, { color: themedColors.tertiaryText, marginTop: SPACING.xs }]}
                >
                  Try adjusting your filters
                </Text>
                <TouchableOpacity
                  onPress={handleFilterPress}
                  className="mt-4 rounded-full"
                  style={{
                    backgroundColor: themedColors.primary,
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

      {/* Filter Bottom Sheet - with dark mode support */}
      <BottomSheet
        ref={bottomSheetRef}
        index={bottomSheetIndex}
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        onClose={handleSheetClose}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{ backgroundColor: themedColors.handleIndicator }}
        backgroundStyle={{ backgroundColor: themedColors.background }}
      >
        <BottomSheetScrollView
          contentContainerStyle={{
            backgroundColor: themedColors.background,
            paddingBottom: 120,
          }}
        >
          <FilterOptions
            initialFilters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />
        </BottomSheetScrollView>
      </BottomSheet>
      
      {/* Loading overlay when saving filters */}
      {applyingFilters && (
        <View 
          className="absolute inset-0 z-50 items-center justify-center"
          style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.3)' }}
        >
          <View 
            className="rounded-xl p-6 items-center" 
            style={{ 
              backgroundColor: themedColors.secondaryBackground,
              ...Platform.select({
                ios: {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: isDark ? 0.4 : 0.15,
                  shadowRadius: 12,
                },
                android: {
                  elevation: 8,
                },
              }),
            }}
          >
            <ActivityIndicator size="large" color={themedColors.primary} />
            <Text className="mt-3" style={[TYPOGRAPHY.body, { color: themedColors.text }]}>
              Saving filters...
            </Text>
          </View>
        </View>
      )}
    </>
  );
}
