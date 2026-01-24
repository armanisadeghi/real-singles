import { icons } from "@/constants/icons";
// Import standardized options that match database schema
import {
  BODY_TYPE_OPTIONS,
  DRINKING_OPTIONS,
  EDUCATION_OPTIONS,
  ETHNICITY_OPTIONS,
  GENDER_OPTIONS,
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
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import RNPickerSelect from "react-native-picker-select";
import Toast from "react-native-toast-message";
import LinearBg from "./LinearBg";
import RangeSlider from "./ui/RangeSlider";

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
  gender: "male" | "female" | "non-binary" | "other" | "";
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
  onApplyFilters: (filters: FormData) => void;
}

export default function FilterOptions({
  initialFilters,
  onApplyFilters,
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
  const [gender, setGender] = useState<"male" | "female" | "non-binary" | "other" | "">(
    initialFilters?.gender || ""
  );
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
  const [filterData, setFilterData] = useState<{
    Gender: string;
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
    Gender: "",
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

      if (res?.success) {
        setFilterData(res?.data);
      }
    } catch (error) {
      console.error("Error fetching filters:", error);
    }
  };

  useEffect(() => {
    getFilterData();
  }, []);

  const handleApply = () => {
    const formData = new FormData();

    // Add all filter values to FormData
    formData.append("Gender", gender);
    formData.append("min_age", ageMin.toString());
    formData.append("max_age", ageMax.toString());
    formData.append("min_height", heightMin.toString());
    formData.append("max_height", heightMax.toString());
    formData.append("BodyType", bodyType);
    formData.append("Ethnicity", ethnicity);
    formData.append("Drinks", drinking);
    formData.append("Religion", religion);
    formData.append("Education", education);
    formData.append("HaveChild", hasKids);
    formData.append("WantChild", wantKids);
    formData.append("Pets", pets ? "true" : "false");
    formData.append("Hsign", zodiac.join(","));
    formData.append("Marijuana", marijuana);
    formData.append("min_distance", minDistance.toString());
    formData.append("max_distance", maxDistance.toString());
    // formData.append("exercise", exercise);
    formData.append("marital_status", maritalStatus);
    formData.append("looking_for", lookingFor);
    formData.append("Smoke", smoke);
    formData.append("PoliticalView", politicalView);

    onApplyFilters(formData);
    // handleClearFilter();
  };

  const pickerSelectStyles = {
    inputIOS: {
      fontSize: 16,
      paddingVertical: 14,
      paddingHorizontal: 28,
      borderWidth: 1,
      borderColor: "#E5E5E5", // gray border
      borderRadius: 30,
      backgroundColor: "#F5F5F5", // light background
      color: "#333333",
      paddingRight: 30, // to ensure the text is never behind the icon
      marginBottom: 10,
    },
    inputAndroid: {
      fontSize: 16,
      paddingHorizontal: 28,
      paddingVertical: 14,
      borderWidth: 1,
      borderColor: "#E5E5E5", // gray border
      borderRadius: 99,
      backgroundColor: "#F9F9FC", // light background
      color: "#333333",
      paddingRight: 30, // to ensure the text is never behind the icon
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
    if (zodiac.includes(sign)) {
      setZodiac(zodiac.filter((item) => item !== sign));
    } else {
      setZodiac([...zodiac, sign]);
    }
  };

  const handleClearFilter = async () => {
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
        setGender("");
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
      {/* Gender filter - uses standardized GENDER_OPTIONS from constants/options.ts */}
      <View className="mb-6 pb-6 border-b border-b-border">
        <Text className="text-base font-medium mb-3 text-dark">Gender</Text>
        <View className="flex-row gap-3 flex-wrap">
          {GENDER_OPTIONS.map((option) => {
            const isSelected = gender === option.value || filterData?.Gender === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                className={`rounded-full overflow-hidden ${
                  isSelected
                    ? "border border-primary"
                    : "bg-light-100 border border-border"
                }`}
                onPress={() => setGender(option.value as "male" | "female" | "non-binary" | "other")}
              >
                {isSelected ? (
                  <LinearGradient
                    colors={["#B06D1E", "#F99F2D", "#B06D1E"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ padding: 8, borderRadius: 4 }}
                  >
                    <Text style={{ color: "white", fontWeight: "bold" }}>{option.label}</Text>
                  </LinearGradient>
                ) : (
                  <Text className={"text-dark px-4 py-2"}>{option.label}</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View className="mb-6 pb-6 border-b border-b-border">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-medium mb-3 text-dark">Age</Text>
          <Text className="text-xs font-normal mb-3 text-gray">
            18-70 years
            {/* {filterData?.min_age || ageMin}-{filterData?.max_age || ageMax} */}
          </Text>
        </View>
        <RangeSlider
          sliderWidth={300}
          min={18}
          max={70}
          step={1}
          label="Yrs"
          onValueChange={(range) => {
            setAgeMin(range.min);
            setAgeMax(range.max);
          }}
        />
      </View>
      <View className="mb-6 pb-6 border-b border-b-border">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-medium mb-3 text-dark">Height</Text>
          <Text className="text-xs font-normal mb-3 text-gray">
            4.0-10.0 ft
          </Text>
          {/* <Text className="text-xs font-normal mb-3 text-gray">
            {filterData?.min_height || heightMin}-
            {filterData?.max_height || heightMax}
          </Text> */}
        </View>
        <RangeSlider
          sliderWidth={300}
          min={4}
          max={10}
          step={0.1}
          label="ft"
          onValueChange={(range) => {
            setHeightMin(range.min);
            setHeightMax(range.max);
          }}
        />
      </View>

      <RNPickerSelect
        value={filterData?.BodyType || bodyType}
        onValueChange={(value) => setBodyType(value)}
        placeholder={{ label: "Body Type", value: null, color: "#9EA0A4" }}
        style={pickerSelectStyles}
        useNativeAndroidPickerStyle={false}
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
        useNativeAndroidPickerStyle={false}
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
        useNativeAndroidPickerStyle={false}
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
        useNativeAndroidPickerStyle={false}
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
        useNativeAndroidPickerStyle={false}
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
        useNativeAndroidPickerStyle={false}
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
        useNativeAndroidPickerStyle={false}
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
        useNativeAndroidPickerStyle={false}
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
        useNativeAndroidPickerStyle={false}
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
        useNativeAndroidPickerStyle={false}
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
        useNativeAndroidPickerStyle={false}
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
        useNativeAndroidPickerStyle={false}
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
        useNativeAndroidPickerStyle={false}
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

      <View className="mb-6 pb-6 border-b border-b-border">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-medium mb-3 text-dark">Distance</Text>
          <Text className="text-xs font-normal mb-3 text-gray">
            {filterData?.min_distance || minDistance}-
            {filterData?.max_distance || maxDistance} miles
          </Text>
        </View>
        <RangeSlider
          sliderWidth={300}
          min={0}
          max={10000}
          step={1}
          label="mi"
          onValueChange={(range) => {
            setMinDistance(range.min);
            setMaxDistance(range.max);
          }}
        />
      </View>

      <TouchableOpacity
        onPress={() => setPets((prev) => !prev)}
        className={`rounded-[30px] border ${pets ? "bg-primary border-primary" : "bg-light-100 border-border"
          } flex-row items-center justify-between px-7 py-[14px]`}
      >
        <Text
          className={`text-lg font-normal ${pets ? "text-white" : "text-dark"}`}
        >
          Pets
        </Text>
      </TouchableOpacity>

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

      <View className="w-full gap-3 flex-row justify-between items-center my-5 -z-10">
        <TouchableOpacity
          onPress={handleClearFilter}
          className="w-[48%] border border-border bg-light-100 rounded-[50px] px-7 py-[14px]"
        >
          {loadingclear ? (
            <ActivityIndicator
              size="small"
              color="#9A9CA0"
              className="text-center"
            />
          ) : (
            <Text className="text-gray text-base text-center font-medium">
              Clear Filter
            </Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleApply}
          className="w-[48%] border border-border bg-primary rounded-[50px] overflow-hidden"
        >
          <LinearBg className="px-7 py-[14px]" style={{ paddingVertical: 13 }}>
            <Text className="text-white text-base text-center font-medium">
              Apply Filter
            </Text>
          </LinearBg>
        </TouchableOpacity>
      </View>
    </View>
  );
}
