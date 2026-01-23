import EditProfileForm from "@/components/forms/EditProfileForm";
import { icons } from "@/constants/icons";
import { fetchUserProfile, updateUser } from "@/lib/api";
import { EditProfileFormData } from "@/types";
import { useAuth } from "@/utils/authContext";
import { getCurrentUserId } from "@/utils/token";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Image, Keyboard, ScrollView, Text, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";

const EditProfile = () => {
  const router = useRouter();
  const { refreshUser } = useAuth();

  const [formData, setFormData] = useState<EditProfileFormData | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchUserData = async () => {
    try {
      const userid = await getCurrentUserId();
      if (!userid) return;

      const res = await fetchUserProfile(userid);
      console.log("res in fetchUserData:", res);


      if (res?.success && res?.data) {
        const profileData = res.data;
        console.log("profileData.Ethniticity:", profileData.Ethniticity);


        setFormData({
          SocialType: profileData?.SocialType || "",
          Username: profileData?.Username || "",
          FirstName: profileData?.FirstName || "",
          LastName: profileData?.LastName || "",
          DisplayName: profileData?.DisplayName || "",
          Phone: profileData?.Phone || "",
          Zipcode: profileData?.Zipcode || "",
          Address: profileData?.Address || "",
          City: profileData?.City || "",
          State: profileData?.State || "",
          Country: profileData?.Country || "",
          Street: profileData?.Street || "",
          NightAtHome: profileData?.NightAtHome || "", //PoliticalViews key change to NightAtHome
          craziestTravelStory: profileData?.craziestTravelStory || "",
          CraziestThings: profileData?.CraziestThings || "",
          weiredestGift: profileData?.weiredestGift || "",
          livePicture: profileData?.livePicture || "",
          HSign: profileData?.HSign || "",
          DOB: profileData?.DOB ? profileData.DOB.split("T")[0] : "",
          MaritalStatus: profileData?.MaritalStatus || "",
          HaveChild: profileData?.HaveChild || "",
          WantChild: profileData?.WantChild || "",
          Education: profileData?.Education || "",
          School: profileData?.School || "",
          JobTitle: profileData?.JobTitle || "",
          Company: profileData?.Company || "",
          Height: profileData?.Height || "",
          BodyType: profileData?.BodyType || "",
          Marijuna: profileData?.Marijuna || "",
          Smoking: profileData?.Smoking || "",
          Drinks: profileData?.Drinks || "",
          Pets: profileData?.Pets?.toLowerCase().trim() || "",
          Ethniticity: profileData?.Ethniticity || "",
          Language: profileData?.Language || "",
          Religion: profileData?.Religion || "",
          About: profileData?.About || "",
          Interest: profileData?.Interest || "",
          IdeaDate: profileData?.IdeaDate || "",
          WayToHeart: profileData?.WayToHeart || "",
          Gender: profileData?.Gender || "",
          Image: profileData?.Image || "",
          DeviceToken: profileData?.DeviceToken || "",
          NonNegotiable: profileData?.Political || "",
          WorstJob: profileData?.WorstJob || "",
          JobID: profileData?.JobID || "",
          PastEvent: profileData?.PastEvent || "",
          FindMe: profileData?.FindMe || "",
          social_link1: profileData?.social_link1 || "",
          social_link2: profileData?.social_link2 || "",
          applicantID: profileData?.applicantID || "",
        });

      } else {
        console.error(res?.msg || "Failed to fetch profile");
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  // ✅ Refetch profile every time screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchUserData();
    }, [])
  );

  const handleChange = (field: string, value: any) => {
    if (!formData) return;
    setFormData({ ...formData, [field]: value });
  };

  const handleSave = async () => {
    Keyboard.dismiss();
    if (!formData) return;

    try {
      setSaving(true);
      const res = await updateUser(formData);
      if (res?.success) {
        await refreshUser();
        Toast.show({
          type: "success",
          text1: "Profile updated successfully",
          position: "bottom",
          visibilityTime: 2000,
          bottomOffset: 100,
          autoHide: true,
        });
        console.log("Profile updated successfully");
        // router.back()
          setTimeout(() => {
            router.back();
          }, 1000); 

      } else {
        Toast.show({
          type: "error",
          text1: res?.msg || "Failed to update profile",
          position: "bottom",
          visibilityTime: 2000,
          bottomOffset: 100,
          autoHide: true,
        });
      }
    } catch (err) {
       Toast.show({
          type: "error",
          text1: "Failed to update profile",
          position: "bottom",
          visibilityTime: 2000,
          bottomOffset: 100,
          autoHide: true,
        });
    } finally {
      setSaving(false); // ⬅️ Stop loader
    }
  };

  if (!formData) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Loading profile...</Text>
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
          <Text className="leading-[22px] text-base font-medium tracking-[-0.41px] text-black">Edit Profile</Text>
        </View>

        <TouchableOpacity onPress={handleSave} style={{ paddingHorizontal: 20, paddingVertical: 10 }}>
          <Text className="text-primary w-full font-medium text-base tracking-[-0.41px] leading-[22px]">Save</Text>
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
            backgroundColor: "rgba(0,0,0,0.2)", // light transparent black
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
    </View>
  );
};

export default EditProfile;
