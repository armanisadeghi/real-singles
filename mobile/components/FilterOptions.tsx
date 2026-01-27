import { icons } from "@/constants/icons";
// Import standardized options that match database schema
// Note: GENDER_OPTIONS removed - gender preference comes from user's profile "looking_for" field
import {
  BODY_TYPE_OPTIONS,
  DRINKING_OPTIONS,
  EDUCATION_OPTIONS,
  ETHNICITY_OPTIONS,
  HAS_KIDS_OPTIONS,
  LOOKING_FOR_OPTIONS,
  MARIJUANA_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  POLITICAL_OPTIONS,
  RELIGION_OPTIONS,
  SMOKING_OPTIONS,
  WANTS_KIDS_OPTIONS,
} from "@/constants/options";
import { clearFilter, getFilter } from "@/lib/api";
import Slider from "@react-native-community/slider";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import RNPickerSelect from "react-native-picker-select";
import Toast from "react-native-toast-message";
import LinearBg from "./LinearBg";

export interface FilterData {
  ageRange: {
    min: number;
    max: number;
  };
  heightRange: {
    min: number;
    max: number;
  };
  distanceRange?: {
    min: number;
    max: number;
  };
  // Note: gender preference is NOT a filter - it comes from user's profile "looking_for" field
  bodyType: string;
  maritalStatus: string;
  ethnicity: string;
  religion: string;
  marijuana: string;
  drinking: string;
  hasKids: string;
  wantKids: string;
  pets: boolean;
  zodiac: string[];
  education?: string;
  smoke?: string;
  politicalView?: string;
  exercise?: string;
  lookingFor?: string;
}

interface FilterOptionsProps {
  initialFilters?: FilterData;
  onFilterChange: (filterParams: Record<string, string>) => void;
  onClearFilters: () => void;
}

export default function FilterOptions({
  initialFilters,
  onFilterChange,
  onClearFilters,
}: FilterOptionsProps) {
  console.log("initialFilters?.ageRange",initialFilters?.ageRange);
  

  const [ageMin, setAgeMin] = useState(initialFilters?.ageRange?.min || 18);
  const [ageMax, setAgeMax] = useState(initialFilters?.ageRange?.max || 70);
  const [heightMin, setHeightMin] = useState(
    initialFilters?.heightRange?.min || 4
  );
  const [heightMax, setHeightMax] = useState(
    initialFilters?.heightRange?.max || 10
  );
  const [zodiac, setZodiac] = useState<string[]>(initialFilters?.zodiac || []);
  const [education, setEducation] = useState<string>(
    initialFilters?.education || ""
  );
  const [smoke, setSmoke] = useState<string>(initialFilters?.smoke || "");
  const [politicalView, setPoliticalView] = useState<string>(
    initialFilters?.politicalView || ""
  );
  const [exercise, setExercise] = useState<string>(
    initialFilters?.exercise || ""
  );
  const [lookingFor, setLookingFor] = useState<string>(
    initialFilters?.lookingFor || ""
  );
  const [minDistance, setMinDistance] = useState<number>(
    initialFilters?.distanceRange?.min || 0
  );
  const [maxDistance, setMaxDistance] = useState<number>(
    initialFilters?.distanceRange?.max || 10000
  );
  // Note: gender state removed - gender preference comes from user's profile "looking_for" field
  const [bodyType, setBodyType] = useState<string>(
    initialFilters?.bodyType || ""
  );
  const [maritalStatus, setMaritalStatus] = useState<string>(
    initialFilters?.maritalStatus || ""
  );
  const [ethnicity, setEthnicity] = useState<string>(
    initialFilters?.ethnicity || ""
  );
  const [religion, setReligion] = useState<string>(
    initialFilters?.religion || ""
  );
  const [marijuana, setMarijuana] = useState<string>(
    initialFilters?.marijuana || ""
  );
  const [drinking, setDrinking] = useState<string>(
    initialFilters?.drinking || ""
  );
  const [hasKids, setHasKids] = useState<string>(initialFilters?.hasKids || "");
  const [wantKids, setWantKids] = useState<string>(
    initialFilters?.wantKids || ""
  );
  const [pets, setPets] = useState<boolean>(initialFilters?.pets || false);
  const [loadingclear, setLoadingClear] = useState<boolean>(false);
  const [isLoadingFromApi, setIsLoadingFromApi] = useState<boolean>(true);
  const [filterData, setFilterData] = useState<{
    // Note: Gender removed - gender preference comes from user's profile "looking_for" field
    min_age: number;
    max_age: number;
    min_height: number;
    max_height: number;
    BodyType: string;
    Ethnicity: string;
    Drinks: string;
    Religion: string;
    Education: string;
    HaveChild: string;
    WantChild: string;
    Pets: boolean;
    Hsign: string;
    Marijuana: string;
    min_distance: number;
    max_distance: number;
    exercise: string;
    marital_status: string;
    looking_for: string;
    Smoke: string;
    PoliticalView: string;
  } | null>({
    // Note: Gender removed - gender preference comes from user's profile "looking_for" field
    min_age: 18,
    max_age: 70,
    min_height: 4,
    max_height: 10,
    BodyType: "",
    Ethnicity: "",
    Drinks: "",
    Religion: "",
    Education: "",
    HaveChild: "",
    WantChild: "",
    Pets: false,
    Hsign: "",
    Marijuana: "",
    min_distance: 0,
    max_distance: 10000,
    exercise: "",
    marital_status: "",
    looking_for: "",
    Smoke: "",
    PoliticalView: ""
  });

  const getFilterData = async () => {
    try {
      const res = await getFilter();
      console.log("Filter Data:", res);

      if (res?.success && res?.data) {
        const data = res.data;
        setFilterData(data);
        
        // Sync loaded filter data with local state
        if (data.min_age) setAgeMin(data.min_age);
        if (data.max_age) setAgeMax(data.max_age);
        if (data.min_height) setHeightMin(data.min_height);
        if (data.max_height) setHeightMax(data.max_height);
        if (data.min_distance !== undefined) setMinDistance(data.min_distance);
        if (data.max_distance !== undefined) setMaxDistance(data.max_distance);
        if (data.BodyType) setBodyType(data.BodyType);
        if (data.marital_status) setMaritalStatus(data.marital_status);
        if (data.Ethnicity) setEthnicity(data.Ethnicity);
        if (data.Religion) setReligion(data.Religion);
        if (data.Marijuana) setMarijuana(data.Marijuana);
        if (data.Drinks) setDrinking(data.Drinks);
        if (data.HaveChild) setHasKids(data.HaveChild);
        if (data.WantChild) setWantKids(data.WantChild);
        if (data.Pets !== undefined) setPets(data.Pets);
        if (data.Hsign) setZodiac(data.Hsign.split(',').filter(Boolean));
        if (data.Education) setEducation(data.Education);
        if (data.Smoke) setSmoke(data.Smoke);
        if (data.PoliticalView) setPoliticalView(data.PoliticalView);
        if (data.looking_for) setLookingFor(data.looking_for);
      }
    } catch (error) {
      console.error("Error fetching filters:", error);
    } finally {
      // Mark loading as complete after a short delay to allow state to settle
      setTimeout(() => setIsLoadingFromApi(false), 100);
    }
  };

  useEffect(() => {
    getFilterData();
  }, []);

  // Build current filter params object
  const buildFilterParams = useCallback((): Record<string, string> => {
    return {
      min_age: ageMin.toString(),
      max_age: ageMax.toString(),
      min_height: heightMin.toString(),
      max_height: heightMax.toString(),
      BodyType: bodyType,
      Ethnicity: ethnicity,
      Drinks: drinking,
      Religion: religion,
      Education: education,
      HaveChild: hasKids,
      WantChild: wantKids,
      Pets: pets ? "true" : "false",
      Hsign: zodiac.join(","),
      Marijuana: marijuana,
      min_distance: minDistance.toString(),
      max_distance: maxDistance.toString(),
      marital_status: maritalStatus,
      looking_for: lookingFor,
      Smoke: smoke,
      PoliticalView: politicalView,
    };
  }, [ageMin, ageMax, heightMin, heightMax, bodyType, ethnicity, drinking, religion, education, hasKids, wantKids, pets, zodiac, marijuana, minDistance, maxDistance, maritalStatus, lookingFor, smoke, politicalView]);

  // Report filter changes to parent whenever any value changes
  // Skip during initial API loading to avoid false positives
  useEffect(() => {
    // Don't report changes while loading from API
    if (isLoadingFromApi) {
      return;
    }
    
    const filterParams = buildFilterParams();
    console.log("Filter values changed by user:", filterParams);
    onFilterChange(filterParams);
  }, [buildFilterParams, onFilterChange, isLoadingFromApi]);

  // Picker styles - iOS custom, Android uses native styling
  const pickerSelectStyles = {
    inputIOS: {
      fontSize: 16,
      paddingVertical: 14,
      paddingHorizontal: 28,
      borderWidth: 1,
      borderColor: "#E5E5E5",
      borderRadius: 30,
      backgroundColor: "#F5F5F5",
      color: "#333333",
      paddingRight: 30,
      marginBottom: 10,
    },
    // Android: Let native picker handle styling for native feel
    inputAndroid: {
      fontSize: 16,
      color: "#333333",
      marginBottom: 10,
    },
    placeholder: {
      color: "#9E9E9E",
    },
    iconContainer: {
      top: 16,
      right: 12,
    },
  };

  const zodiacOptions = [
    { label: "Aries", value: "aries" },
    { label: "Taurus", value: "taurus" },
    { label: "Gemini", value: "gemini" },
    { label: "Cancer", value: "cancer" },
    { label: "Leo", value: "leo" },
    { label: "Virgo", value: "virgo" },
    { label: "Libra", value: "libra" },
    { label: "Scorpio", value: "scorpio" },
    { label: "Sagittarius", value: "sagittarius" },
    { label: "Capricorn", value: "capricorn" },
    { label: "Aquarius", value: "aquarius" },
    { label: "Pisces", value: "pisces" },
  ];

  const toggleZodiac = (sign: string) => {
    // Haptic feedback for selection feedback - feels native
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (zodiac.includes(sign)) {
      setZodiac(zodiac.filter((item) => item !== sign));
    } else {
      setZodiac([...zodiac, sign]);
    }
  };

  const handleClearFilter = async () => {
    // Haptic feedback for action confirmation
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setLoadingClear(true);
    try {
      const res = await clearFilter();
      console.log("Clear Filter Response:", res);

      if (res?.success) {
        setAgeMin(18);
        setAgeMax(70);
        setHeightMin(4);
        setHeightMax(10);
        setZodiac([]);
        setEducation("");
        setSmoke("");
        setPoliticalView("");
        setExercise("");
        setLookingFor("");
        setMinDistance(0);
        setMaxDistance(10000);
        // Note: gender state removed - comes from profile
        setBodyType("");
        setMaritalStatus("");
        setEthnicity("");
        setReligion("");
        setMarijuana("");
        setDrinking("");
        setHasKids("");
        setWantKids("");
        setPets(false);
        setFilterData(null);
        
        // Notify parent that filters were cleared
        onClearFilters();
      }
      Toast.show({
        type: "success",
        text1: "Filters cleared successfully!",
        position: "bottom",
        visibilityTime: 2000,
      })
    } catch (error) {
      console.error("Error clearing filters:", error);
    } finally {
      setLoadingClear(false);
    }
  };

  return (
    <View className="p-6">
      <Toast />
      {/* Note: Gender filter removed - gender preference comes from user's profile "looking_for" field */}
      {/* Users can change their gender preference in Profile Settings */}

      {/* Age Range - Native Sliders */}
      <View className="mb-6 pb-6 border-b border-b-border">
        <Text className="text-base font-medium mb-1 text-dark">Age Range</Text>
        <Text className="text-xs font-normal mb-3 text-gray">
          {ageMin} - {ageMax} years
        </Text>
        
        <View className="mb-2">
          <Text className="text-xs text-gray mb-1">Minimum: {ageMin}</Text>
          <Slider
            minimumValue={18}
            maximumValue={70}
            step={1}
            value={ageMin}
            onValueChange={(value) => {
              if (value < ageMax) setAgeMin(Math.round(value));
            }}
            onSlidingComplete={() => Haptics.selectionAsync()}
            minimumTrackTintColor="#E91E63"
            // Let platform handle other colors natively
          />
        </View>
        
        <View>
          <Text className="text-xs text-gray mb-1">Maximum: {ageMax}</Text>
          <Slider
            minimumValue={18}
            maximumValue={70}
            step={1}
            value={ageMax}
            onValueChange={(value) => {
              if (value > ageMin) setAgeMax(Math.round(value));
            }}
            onSlidingComplete={() => Haptics.selectionAsync()}
            minimumTrackTintColor="#E91E63"
          />
        </View>
      </View>

      {/* Height Range - Native Sliders */}
      <View className="mb-6 pb-6 border-b border-b-border">
        <Text className="text-base font-medium mb-1 text-dark">Height Range</Text>
        <Text className="text-xs font-normal mb-3 text-gray">
          {heightMin.toFixed(1)} - {heightMax.toFixed(1)} ft
        </Text>
        
        <View className="mb-2">
          <Text className="text-xs text-gray mb-1">Minimum: {heightMin.toFixed(1)} ft</Text>
          <Slider
            minimumValue={4}
            maximumValue={10}
            step={0.1}
            value={heightMin}
            onValueChange={(value) => {
              if (value < heightMax) setHeightMin(Math.round(value * 10) / 10);
            }}
            onSlidingComplete={() => Haptics.selectionAsync()}
            minimumTrackTintColor="#E91E63"
          />
        </View>
        
        <View>
          <Text className="text-xs text-gray mb-1">Maximum: {heightMax.toFixed(1)} ft</Text>
          <Slider
            minimumValue={4}
            maximumValue={10}
            step={0.1}
            value={heightMax}
            onValueChange={(value) => {
              if (value > heightMin) setHeightMax(Math.round(value * 10) / 10);
            }}
            onSlidingComplete={() => Haptics.selectionAsync()}
            minimumTrackTintColor="#E91E63"
          />
        </View>
      </View>

      <RNPickerSelect
        value={filterData?.BodyType || bodyType}
        onValueChange={(value) => setBodyType(value)}
        placeholder={{ label: "Body Type", value: null, color: "#9EA0A4" }}
        style={pickerSelectStyles}
        useNativeAndroidPickerStyle={true}
        key="bodyType"
        Icon={() => (
          <Image
            source={icons.down}
            className="size-4 mr-4"
            resizeMode="contain"
          />
        )}
        items={BODY_TYPE_OPTIONS}
      />
      <RNPickerSelect
        value={filterData?.marital_status || maritalStatus}
        onValueChange={(value) => setMaritalStatus(value)}
        placeholder={{ label: "Marital status", value: null, color: "#9EA0A4" }}
        style={pickerSelectStyles}
        useNativeAndroidPickerStyle={true}
        key="Marital Status"
        Icon={() => (
          <Image
            source={icons.down}
            className="size-4 mr-4"
            resizeMode="contain"
          />
        )}
        items={MARITAL_STATUS_OPTIONS}
      />
      <RNPickerSelect
        value={filterData?.Ethnicity || ethnicity}
        onValueChange={(value) => setEthnicity(value)}
        placeholder={{ label: "Ethnicity", value: null, color: "#9EA0A4" }}
        style={pickerSelectStyles}
        useNativeAndroidPickerStyle={true}
        key="Ethnicity"
        Icon={() => (
          <Image
            source={icons.down}
            className="size-4 mr-4"
            resizeMode="contain"
          />
        )}
        items={ETHNICITY_OPTIONS}
      />
      <RNPickerSelect
        value={filterData?.Religion || religion}
        onValueChange={(value) => setReligion(value)}
        placeholder={{ label: "Religion", value: null, color: "#9EA0A4" }}
        style={pickerSelectStyles}
        useNativeAndroidPickerStyle={true}
        key="religion"
        Icon={() => (
          <Image
            source={icons.down}
            className="size-4 mr-4"
            resizeMode="contain"
          />
        )}
        items={RELIGION_OPTIONS}
      />
      <RNPickerSelect
        value={filterData?.Marijuana || marijuana}
        onValueChange={(value) => setMarijuana(value)}
        placeholder={{ label: "Marijuana", value: null, color: "#9EA0A4" }}
        style={pickerSelectStyles}
        useNativeAndroidPickerStyle={true}
        key="marijuana"
        Icon={() => (
          <Image
            source={icons.down}
            className="size-4 mr-4"
            resizeMode="contain"
          />
        )}
        items={MARIJUANA_OPTIONS}
      />
      <RNPickerSelect
        value={filterData?.Drinks || drinking}
        onValueChange={(value) => setDrinking(value)}
        placeholder={{ label: "Drinking", value: null, color: "#9EA0A4" }}
        style={pickerSelectStyles}
        useNativeAndroidPickerStyle={true}
        key="drinking"
        Icon={() => (
          <Image
            source={icons.down}
            className="size-4 mr-4"
            resizeMode="contain"
          />
        )}
        items={DRINKING_OPTIONS}
      />
      <RNPickerSelect
        value={filterData?.HaveChild || hasKids}
        onValueChange={(value) => setHasKids(value)}
        placeholder={{ label: "Has Kids", value: null, color: "#9EA0A4" }}
        style={pickerSelectStyles}
        useNativeAndroidPickerStyle={true}
        key="has kids"
        Icon={() => (
          <Image
            source={icons.down}
            className="size-4 mr-4"
            resizeMode="contain"
          />
        )}
        items={HAS_KIDS_OPTIONS}
      />
      <RNPickerSelect
        value={filterData?.WantChild || wantKids}
        onValueChange={(value) => setWantKids(value)}
        placeholder={{ label: "Want Kids", value: null, color: "#9EA0A4" }}
        style={pickerSelectStyles}
        useNativeAndroidPickerStyle={true}
        key="want kids"
        Icon={() => (
          <Image
            source={icons.down}
            className="size-4 mr-4"
            resizeMode="contain"
          />
        )}
        items={WANTS_KIDS_OPTIONS}
      />
      <RNPickerSelect
        value={filterData?.Education || education}
        onValueChange={(value) => setEducation(value)}
        placeholder={{ label: "Education", value: null, color: "#9EA0A4" }}
        style={pickerSelectStyles}
        useNativeAndroidPickerStyle={true}
        key="education"
        Icon={() => (
          <Image
            source={icons.down}
            className="size-4 mr-4"
            resizeMode="contain"
          />
        )}
        items={EDUCATION_OPTIONS}
      />
      <RNPickerSelect
        value={filterData?.Smoke || smoke}
        onValueChange={(value) => setSmoke(value)}
        placeholder={{ label: "Smoking", value: null, color: "#9EA0A4" }}
        style={pickerSelectStyles}
        useNativeAndroidPickerStyle={true}
        key="smoke"
        Icon={() => (
          <Image
            source={icons.down}
            className="size-4 mr-4"
            resizeMode="contain"
          />
        )}
        items={SMOKING_OPTIONS}
      />
      <RNPickerSelect
        value={filterData?.PoliticalView || politicalView}
        onValueChange={(value) => setPoliticalView(value)}
        placeholder={{ label: "Political View", value: null, color: "#9EA0A4" }}
        style={pickerSelectStyles}
        useNativeAndroidPickerStyle={true}
        key="politicalView"
        Icon={() => (
          <Image
            source={icons.down}
            className="size-4 mr-4"
            resizeMode="contain"
          />
        )}
        items={POLITICAL_OPTIONS}
      />
      {/* <RNPickerSelect
        value={filterData?.exercise || exercise}
        onValueChange={(value) => setExercise(value)}
        placeholder={{ label: "Exercise", value: null, color: "#9EA0A4" }}
        style={pickerSelectStyles}
        useNativeAndroidPickerStyle={true}
        key="exercise"
        Icon={() => (
          <Image
            source={icons.down}
            className="size-4 mr-4"
            resizeMode="contain"
          />
        )}
        items={exerciseOptions}
      /> */}
      <RNPickerSelect
        value={filterData?.looking_for || lookingFor}
        onValueChange={(value) => setLookingFor(value)}
        placeholder={{ label: "Looking For", value: null, color: "#9EA0A4" }}
        style={pickerSelectStyles}
        useNativeAndroidPickerStyle={true}
        key="lookingFor"
        Icon={() => (
          <Image
            source={icons.down}
            className="size-4 mr-4"
            resizeMode="contain"
          />
        )}
        items={LOOKING_FOR_OPTIONS}
      />

      {/* Distance Range - Native Sliders */}
      <View className="mb-6 pb-6 border-b border-b-border">
        <Text className="text-base font-medium mb-1 text-dark">Distance Range</Text>
        <Text className="text-xs font-normal mb-3 text-gray">
          {minDistance} - {maxDistance} miles
        </Text>
        
        <View className="mb-2">
          <Text className="text-xs text-gray mb-1">Minimum: {minDistance} mi</Text>
          <Slider
            minimumValue={0}
            maximumValue={10000}
            step={100}
            value={minDistance}
            onValueChange={(value) => {
              if (value < maxDistance) setMinDistance(Math.round(value / 100) * 100);
            }}
            onSlidingComplete={() => Haptics.selectionAsync()}
            minimumTrackTintColor="#E91E63"
          />
        </View>
        
        <View>
          <Text className="text-xs text-gray mb-1">Maximum: {maxDistance} mi</Text>
          <Slider
            minimumValue={0}
            maximumValue={10000}
            step={100}
            value={maxDistance}
            onValueChange={(value) => {
              if (value > minDistance) setMaxDistance(Math.round(value / 100) * 100);
            }}
            onSlidingComplete={() => Haptics.selectionAsync()}
            minimumTrackTintColor="#E91E63"
          />
        </View>
      </View>

      {/* Pets Toggle - Native Switch */}
      <View 
        className="flex-row items-center justify-between rounded-[30px] border border-border bg-light-100 px-7 py-[14px] mb-4"
      >
        <Text className="text-lg font-normal text-dark">
          Pets
        </Text>
        <Switch
          value={pets}
          onValueChange={(value) => {
            // Haptic feedback for switch toggle - native feel
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setPets(value);
          }}
          trackColor={{ true: '#E91E63' }}
          // Let platform handle other styling natively
        />
      </View>

      <View className="my-6 pb-6 border-b border-b-border">
        <Text className="text-base font-medium mb-3 text-dark">Zodiac</Text>
        <View className="flex-row gap-3 flex-wrap">
          {zodiacOptions.map((option) => {
            const isSelected = zodiac.includes(option.value);

            return (
              <TouchableOpacity
                key={option.value}
                onPress={() => toggleZodiac(option.value)}
                className="rounded-full border overflow-hidden px-4 py-2"
                style={{
                  borderColor: isSelected ? "#B06D1E" : "#E5E7EB",
                }}
              >
                {isSelected && (
                  <LinearGradient
                    colors={["#B06D1E", "#F99F2D", "#B06D1E"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      ...StyleSheet.absoluteFillObject,
                    }}
                  />
                )}

                <Text className={isSelected ? "text-white" : "text-dark"}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

      </View>

      <View className="w-full my-5 -z-10">
        <TouchableOpacity
          onPress={handleClearFilter}
          className="w-full border border-border bg-light-100 rounded-[50px] px-7 py-[14px]"
        >
          {loadingclear ? (
            <ActivityIndicator
              size="small"
              color="#9A9CA0"
              className="text-center"
            />
          ) : (
            <Text className="text-gray text-base text-center font-medium">
              Clear All Filters
            </Text>
          )}
        </TouchableOpacity>
        <Text className="text-gray text-xs text-center mt-3">
          Filters are saved automatically when you close this panel
        </Text>
      </View>
    </View>
  );
}
