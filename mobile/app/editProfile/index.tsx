/**
 * Edit Profile Screen
 * 
 * Features:
 * - Autosave: Automatically saves after 5 seconds of inactivity
 * - Change detection: Only saves when data actually changes
 * - Visual status indicator: Shows save status (Saved, Saving, Unsaved)
 * - Uses Supabase for data persistence
 */

import EditProfileForm from "@/components/forms/EditProfileForm";
import { icons } from "@/constants/icons";
import { supabase, getProfile, updateProfile, getCurrentUser } from "@/lib/supabase";
import { EditProfileFormData } from "@/types";
import { useAuth } from "@/utils/authContext";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState, useRef, useEffect } from "react";
import { 
  ActivityIndicator, 
  Image, 
  Keyboard, 
  ScrollView, 
  Text, 
  TouchableOpacity, 
  View,
  AppState,
  AppStateStatus
} from "react-native";
import Toast from "react-native-toast-message";

// Autosave delay in milliseconds
const AUTOSAVE_DELAY = 5000;

type SaveStatus = "saved" | "saving" | "unsaved" | "error" | "idle";

const EditProfile = () => {
  const router = useRouter();
  const { refreshUser } = useAuth();

  const [formData, setFormData] = useState<EditProfileFormData | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Refs for autosave
  const lastSavedDataRef = useRef<string>("");
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialLoadRef = useRef(true);
  const appStateRef = useRef(AppState.currentState);

  // Check if data has changed
  const hasChanges = useCallback(() => {
    if (!formData) return false;
    const currentJson = JSON.stringify(formData);
    return currentJson !== lastSavedDataRef.current;
  }, [formData]);

  // Perform save operation
  const performSave = useCallback(async (isAutosave = false) => {
    if (!formData || !hasChanges()) {
      return true;
    }

    if (!isAutosave) {
      setSaving(true);
    }
    setSaveStatus("saving");

    try {
      const user = await getCurrentUser();
      if (!user) {
        router.push("/login");
        return false;
      }

      // Map form data to profile schema
      // Note: Height is stored as feet and inches in form, convert to total inches for DB
      const heightInches = formData.HeightFeet && formData.HeightInches !== undefined
        ? (Number(formData.HeightFeet) * 12) + Number(formData.HeightInches)
        : formData.Height ? Number(formData.Height) : null;

      const profileData = {
        // Basic info
        first_name: formData.FirstName || null,
        last_name: formData.LastName || null,
        date_of_birth: formData.DOB || null,
        gender: formData.Gender || null,
        looking_for: formData.LookingFor && formData.LookingFor.length > 0 ? formData.LookingFor : null,
        zodiac_sign: formData.HSign?.toLowerCase() || null,
        bio: formData.About || null,
        looking_for_description: formData.IdeaDate || null,
        
        // Physical - height now properly converted
        height_inches: heightInches,
        body_type: formData.BodyType || null,
        ethnicity: formData.Ethnicity ? 
          (Array.isArray(formData.Ethnicity) ? formData.Ethnicity : formData.Ethnicity.split(",").map((s: string) => s.trim()).filter(Boolean)) 
          : null,
        
        // Location
        city: formData.City || null,
        state: formData.State || null,
        country: formData.Country || null,
        zip_code: formData.Zipcode || null,
        
        // Lifestyle
        marital_status: formData.MaritalStatus || null,
        religion: formData.Religion || null,
        political_views: formData.Political || null,
        education: formData.Education || null,
        occupation: formData.JobTitle || null,
        company: formData.Company || null,
        smoking: formData.Smoking || null,
        drinking: formData.Drinks || null,
        marijuana: formData.Marijuana || null,
        exercise: formData.Exercise || null,
        languages: formData.Language ? 
          (Array.isArray(formData.Language) ? formData.Language : formData.Language.split(",").map((s: string) => s.trim()).filter(Boolean)) 
          : null,
        
        // Family
        has_kids: formData.HaveChild || null,
        wants_kids: formData.WantChild || null,
        pets: formData.Pets ? 
          (Array.isArray(formData.Pets) ? formData.Pets : formData.Pets.split(",").map((s: string) => s.trim()).filter(Boolean)) 
          : null,
        
        // Interests
        interests: formData.Interest ? 
          (Array.isArray(formData.Interest) ? formData.Interest : formData.Interest.split(",").map((s: string) => s.trim()).filter(Boolean)) 
          : null,
        
        // Profile prompts
        ideal_first_date: formData.IdeaDate || null,
        non_negotiables: formData.NonNegotiable || null,
        worst_job: formData.WorstJob || null,
        dream_job: formData.DreamJob || null,
        nightclub_or_home: formData.NightAtHome || null,
        pet_peeves: formData.PetPeeves || null,
        after_work: formData.FindMe || null,
        way_to_heart: formData.WayToHeart || null,
        craziest_travel_story: formData.craziestTravelStory || formData.CraziestThings || null,
        weirdest_gift: formData.weiredestGift || null,
        past_event: formData.PastEvent || null,
        
        // Social links
        social_link_1: formData.social_link1 || null,
        social_link_2: formData.social_link2 || null,
        
        // Media
        profile_image_url: formData.Image || null,
      };

      await updateProfile(profileData);

      // Update last saved state
      lastSavedDataRef.current = JSON.stringify(formData);
      setLastSaved(new Date());
      setSaveStatus("saved");

      if (!isAutosave) {
        await refreshUser();
        Toast.show({
          type: "success",
          text1: "Profile updated successfully",
          position: "bottom",
          visibilityTime: 2000,
          bottomOffset: 100,
          autoHide: true,
        });
        setSaving(false);
      }

      return true;
    } catch (error: any) {
      console.error("Error saving profile:", error);
      setSaveStatus("error");
      
      if (!isAutosave) {
        Toast.show({
          type: "error",
          text1: error?.message || "Failed to update profile",
          position: "bottom",
          visibilityTime: 2000,
          bottomOffset: 100,
          autoHide: true,
        });
        setSaving(false);
      }
      
      return false;
    }
  }, [formData, hasChanges, router, refreshUser]);

  // Manual save handler
  const handleSave = useCallback(async () => {
    Keyboard.dismiss();
    
    // Clear any pending autosave
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
    
    const success = await performSave(false);
    if (success) {
      setTimeout(() => {
        router.back();
      }, 1000);
    }
  }, [performSave, router]);

  // Fetch user data
  const fetchUserData = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const profile = await getProfile();
      console.log("Profile loaded:", profile);

      if (profile) {
        // Convert height from total inches to feet and inches for the form
        const heightFeet = profile.height_inches ? Math.floor(profile.height_inches / 12) : 5;
        const heightInchesRemainder = profile.height_inches ? profile.height_inches % 12 : 6;

        const loadedData: EditProfileFormData = {
          // Basic info
          SocialType: "",
          Username: "",
          FirstName: profile.first_name || "",
          LastName: profile.last_name || "",
          DisplayName: `${profile.first_name || ""} ${profile.last_name || ""}`.trim(),
          Phone: "",
          DOB: profile.date_of_birth || "",
          Gender: profile.gender || "",
          LookingFor: profile.looking_for || [],
          HSign: profile.zodiac_sign || "",
          About: profile.bio || "",
          
          // Height - stored as separate feet and inches for proper UI
          Height: profile.height_inches?.toString() || "",
          HeightFeet: heightFeet,
          HeightInches: heightInchesRemainder,
          
          // Physical
          BodyType: profile.body_type || "",
          Ethnicity: profile.ethnicity || [],
          
          // Location
          Address: "",
          Street: "",
          City: profile.city || "",
          State: profile.state || "",
          Country: profile.country || "",
          Zipcode: profile.zip_code || "",
          
          // Lifestyle
          MaritalStatus: profile.marital_status || "",
          Religion: profile.religion || "",
          Political: profile.political_views || "",
          Education: profile.education || "",
          School: profile.schools || [],
          JobTitle: profile.occupation || "",
          Company: profile.company || "",
          JobID: "",
          Smoking: profile.smoking || "",
          Drinks: profile.drinking || "",
          Marijuana: profile.marijuana || "",
          Exercise: profile.exercise || "",
          Language: profile.languages || [],
          
          // Family
          HaveChild: profile.has_kids || "",
          WantChild: profile.wants_kids || "",
          Pets: profile.pets || [],
          
          // Interests
          Interest: profile.interests || [],
          
          // Profile prompts
          IdeaDate: profile.ideal_first_date || profile.looking_for_description || "",
          NonNegotiable: profile.non_negotiables || "",
          WorstJob: profile.worst_job || "",
          DreamJob: profile.dream_job || "",
          NightAtHome: profile.nightclub_or_home || "",
          PetPeeves: profile.pet_peeves || "",
          FindMe: profile.after_work || "",
          WayToHeart: profile.way_to_heart || "",
          craziestTravelStory: profile.craziest_travel_story || "",
          CraziestThings: "",
          weiredestGift: profile.weirdest_gift || "",
          PastEvent: profile.past_event || "",
          
          // Social and media
          livePicture: profile.profile_image_url || "",
          social_link1: profile.social_link_1 || "",
          social_link2: profile.social_link_2 || "",
          Image: profile.profile_image_url || "",
          
          // System
          DeviceToken: "",
          applicantID: "",
        };

        setFormData(loadedData);
        lastSavedDataRef.current = JSON.stringify(loadedData);
      } else {
        // Initialize empty form for new profile
        const emptyData: EditProfileFormData = {
          SocialType: "",
          Username: "",
          FirstName: "",
          LastName: "",
          DisplayName: "",
          Phone: "",
          Zipcode: "",
          Address: "",
          City: "",
          State: "",
          Country: "",
          Street: "",
          NightAtHome: "",
          craziestTravelStory: "",
          CraziestThings: "",
          weiredestGift: "",
          livePicture: "",
          HSign: "",
          DOB: "",
          MaritalStatus: "",
          HaveChild: "",
          WantChild: "",
          Education: "",
          School: "",
          JobTitle: "",
          Company: "",
          Height: "",
          BodyType: "",
          Marijuana: "",
          Smoking: "",
          Drinks: "",
          Pets: "",
          Ethnicity: [],
          Language: [],
          Religion: "",
          About: "",
          Interest: "",
          IdeaDate: "",
          WayToHeart: "",
          Gender: "",
          LookingFor: [],
          Image: "",
          DeviceToken: "",
          NonNegotiable: "",
          WorstJob: "",
          JobID: "",
          PastEvent: "",
          FindMe: "",
          social_link1: "",
          social_link2: "",
          applicantID: "",
        };
        setFormData(emptyData);
        lastSavedDataRef.current = JSON.stringify(emptyData);
      }

      isInitialLoadRef.current = false;
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  // Refetch profile every time screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchUserData();
    }, [])
  );

  // Autosave effect
  useEffect(() => {
    if (isInitialLoadRef.current || !formData) {
      return;
    }

    if (!hasChanges()) {
      setSaveStatus("saved");
      return;
    }

    setSaveStatus("unsaved");

    // Clear existing timer
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    // Set new timer
    autosaveTimerRef.current = setTimeout(() => {
      performSave(true);
    }, AUTOSAVE_DELAY);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [formData, hasChanges, performSave]);

  // Save on app background
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState: AppStateStatus) => {
      if (
        appStateRef.current.match(/active/) &&
        nextAppState.match(/inactive|background/)
      ) {
        // App is going to background - save if there are changes
        if (hasChanges()) {
          performSave(true);
        }
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [hasChanges, performSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, []);

  const handleChange = (field: string, value: any) => {
    if (!formData) return;
    setFormData({ ...formData, [field]: value });
  };

  // Get relative time string
  const getRelativeTime = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  // Render save status indicator
  const renderSaveStatus = () => {
    switch (saveStatus) {
      case "saving":
        return (
          <View className="flex-row items-center">
            <ActivityIndicator size="small" color="#B06D1E" />
            <Text className="ml-2 text-xs text-gray-500">Saving...</Text>
          </View>
        );
      case "saved":
        return (
          <View className="flex-row items-center">
            <Text className="text-xs text-green-600">
              ✓ Saved {lastSaved ? getRelativeTime(lastSaved) : ""}
            </Text>
          </View>
        );
      case "unsaved":
        return (
          <View className="flex-row items-center">
            <Text className="text-xs text-amber-600">● Unsaved changes</Text>
          </View>
        );
      case "error":
        return (
          <View className="flex-row items-center">
            <Text className="text-xs text-red-600">⚠ Save failed</Text>
          </View>
        );
      default:
        return null;
    }
  };

  if (!formData) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#B06D1E" />
        <Text className="mt-4 text-gray-600">Loading profile...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-backgground">
      {/* Header */}
      <View
        className="bg-white flex-row justify-between items-center px-5 pt-8 pb-4 rounded-b-xl z-30"
        style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 5 }}
      >
        <View className="flex-row items-center gap-2">
          <TouchableOpacity onPress={router.back} className="border border-gray rounded-lg w-8 h-8 justify-center items-center">
            <Image source={icons.back} className="size-4" resizeMode="contain" />
          </TouchableOpacity>
          <View>
            <Text className="leading-[22px] text-base font-medium tracking-[-0.41px] text-black">Edit Profile</Text>
            {renderSaveStatus()}
          </View>
        </View>

        <TouchableOpacity 
          onPress={handleSave} 
          disabled={saving || saveStatus === "saving"}
          style={{ paddingHorizontal: 20, paddingVertical: 10, opacity: saving ? 0.5 : 1 }}
        >
          <Text className="text-primary w-full font-medium text-base tracking-[-0.41px] leading-[22px]">
            {saving ? "Saving..." : "Save"}
          </Text>
        </TouchableOpacity>
      </View>

      {saving && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.2)",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <ActivityIndicator size="large" color="#B06D1E" />
        </View>
      )}

      {/* Body */}
      <ScrollView className="flex-1">
        <View className="mt-8 px-6 pb-10">
          <EditProfileForm formData={formData} onChangeField={handleChange} />
        </View>
      </ScrollView>

      <Toast />
    </View>
  );
};

export default EditProfile;
