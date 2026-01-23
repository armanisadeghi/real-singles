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
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
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
      const profileData = {
        first_name: formData.FirstName || null,
        last_name: formData.LastName || null,
        date_of_birth: formData.DOB || null,
        gender: formData.Gender?.toLowerCase() || null,
        height_inches: formData.Height ? Number(formData.Height) : null,
        body_type: formData.BodyType?.toLowerCase() || null,
        city: formData.City || null,
        state: formData.State || null,
        country: formData.Country || null,
        occupation: formData.JobTitle || null,
        education: formData.Education || null,
        religion: formData.Religion?.toLowerCase() || null,
        smoking: formData.Smoking?.toLowerCase() || null,
        drinking: formData.Drinks?.toLowerCase() || null,
        has_kids: formData.HaveChild === "Yes",
        wants_kids: formData.WantChild?.toLowerCase().replace(" ", "_") || null,
        interests: formData.Interest ? 
          (Array.isArray(formData.Interest) ? formData.Interest : formData.Interest.split(",").map((s: string) => s.trim())) 
          : null,
        bio: formData.About || null,
        looking_for_description: formData.IdeaDate || null,
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
        const loadedData: EditProfileFormData = {
          SocialType: "",
          Username: "",
          FirstName: profile.first_name || "",
          LastName: profile.last_name || "",
          DisplayName: `${profile.first_name || ""} ${profile.last_name || ""}`.trim(),
          Phone: "",
          Zipcode: "",
          Address: "",
          City: profile.city || "",
          State: profile.state || "",
          Country: profile.country || "",
          Street: "",
          NightAtHome: "",
          craziestTravelStory: "",
          CraziestThings: "",
          weiredestGift: "",
          livePicture: profile.profile_image_url || "",
          HSign: "",
          DOB: profile.date_of_birth || "",
          MaritalStatus: "",
          HaveChild: profile.has_kids ? "Yes" : "No",
          WantChild: profile.wants_kids || "",
          Education: profile.education || "",
          School: "",
          JobTitle: profile.occupation || "",
          Company: "",
          Height: profile.height_inches?.toString() || "",
          BodyType: profile.body_type || "",
          Marijuna: "",
          Smoking: profile.smoking || "",
          Drinks: profile.drinking || "",
          Pets: "",
          Ethniticity: "",
          Language: "",
          Religion: profile.religion || "",
          About: profile.bio || "",
          Interest: profile.interests?.join(", ") || "",
          IdeaDate: profile.looking_for_description || "",
          WayToHeart: "",
          Gender: profile.gender || "",
          Image: profile.profile_image_url || "",
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
          Marijuna: "",
          Smoking: "",
          Drinks: "",
          Pets: "",
          Ethniticity: "",
          Language: "",
          Religion: "",
          About: "",
          Interest: "",
          IdeaDate: "",
          WayToHeart: "",
          Gender: "",
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
