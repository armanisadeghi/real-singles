import LinearBg from "@/components/LinearBg";
import NotificationBell from "@/components/NotificationBell";
import { icons } from "@/constants/icons";
import { getProfile } from "@/lib/api";
import { User } from "@/types";
import { IMAGE_URL, MEDIA_BASE_URL, removeToken } from "@/utils/token";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import Pdf from "react-native-pdf";
import Toast from "react-native-toast-message";
import WebView from "react-native-webview";

export default function Settings() {
  const [appleUserInfo, setAppleUserInfo] = React.useState<any>()
  const [profile, setProfile] = useState<User>();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  // const { profile } = useLocalSearchParams();
  // const profileData = JSON.parse(profile as string);
  // let profileData = null;

  const [showWebView, setShowWebView] = useState(false);
  const [webViewUrl, setWebViewUrl] = useState("");
  const [webViewTitle, setWebViewTitle] = useState("");

  const [visible, setVisible] = useState(false);
  const [pdfSource, setPdfSource] = useState<any>(null);


  // if (profile) {
  //   try {
  //     profileData = JSON.parse(profile as string);
  //   } catch (err) {
  //     console.error("Failed to parse profile:", err);
  //   }
  // }

  useFocusEffect(
    React.useCallback(() => {
      // Screen is focused
      console.log("settingsScreen focused");
      fetchProfile()

      return () => {
        // Screen is unfocused
        console.log("settingsScreen unfocused");
      };
    }, [])
  );

  const fetchProfile = async () => {
    setLoading(true);
    try {
      // const userId = await getCurrentUserId();
      const res = await getProfile();
      console.log("Profile data in settings screen:", res);
      if (res?.success) {
        setProfile(res?.data || {});
      } else {
        Toast.show({
          type: "error",
          text1: res?.msg || "Failed to fetch profile",
          position: "bottom",
          visibilityTime: 2000,
          bottomOffset: 100,
          autoHide: true,
        });
        console.log("Failed to fetch profile:", res?.msg);
      }
    } catch (error) {
      console.error("Error fetching profile data:", error);
    } finally {
      setLoading(false);
    }
  };

  // console.log("appleUserInfo in settinngs=>>>", appleUserInfo);


  React.useEffect(() => {
    const getAppleUserInfo = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("appleUserInfo");
        console.log("storedUser=>>>", storedUser);

        if (storedUser) {
          const appleUser = JSON.parse(storedUser);
          console.log("Apple User Info:", appleUser);
          setAppleUserInfo(appleUser)
          return appleUser;
        } else {
          console.log("No Apple user info found");
          return null;
        }
      } catch (error) {
        console.error("Error getting Apple user info:", error);
        return null;
      }
    };

    getAppleUserInfo()
  }, [])



  const appVersion = Constants.expoConfig?.version || "1.0.0";

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await removeToken();
            router.replace("/(auth)/login");
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to Logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await removeToken();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };


  const openModal = (source: any) => {
    setPdfSource(source);
    setVisible(true);
  };


  const goToPrivacy = () => {
    setWebViewUrl(
      "https://docs.google.com/document/d/e/2PACX-1vRo0peyatDv55GLYVJIEVaeJIH6VAxRZ3bCp83JSoHMRseFUpaGs-Fwaros6AOnJqVFrSNwaVjEta-x/pub"
    );
    setWebViewTitle("Privacy Policy");
    setShowWebView(true);
  };


  const getProfileImage = () => {
    if (profile?.Image) {
      const img = profile.Image.trim();
      const finalUrl = img.startsWith("uploads/")
        ? IMAGE_URL + img
        : MEDIA_BASE_URL + img;

      return { uri: finalUrl };
    }

    if (profile?.livePicture) {
      const firstImage = profile.livePicture.split(",")[0].trim();
      const finalUrl = firstImage.startsWith("uploads/")
        ? IMAGE_URL + firstImage
        : MEDIA_BASE_URL + firstImage;

      return { uri: finalUrl };
    }

    return icons.ic_user;
  };

  return (
    <>
      <View className="flex-1 bg-backgground">
        <Toast />
        {loading && (
          <View className="absolute top-0 left-0 right-0 bottom-0 justify-center items-center bg-black/20 z-50">
            <ActivityIndicator size="large" color="#B06D1E" />
          </View>
        )}

        {/* WebView Modal */}
        {Platform.OS == 'ios' ?
          <Modal
            visible={visible}
            animationType="slide"
            onRequestClose={() => setVisible(false)}
          >
            <SafeAreaView className="flex-1 bg-white">
              {/* Header */}
              <View className="flex-row justify-between items-center p-4 bg-gray-100 border-b border-gray-300">
                <Text className="text-base font-bold text-gray-800">
                  {pdfSource === require("../../assets/docs/PrivacyPolicy.pdf")
                    ? "Privacy Policy"
                    : "Terms & Conditions"}
                </Text>
                <TouchableOpacity onPress={() => setVisible(false)}>
                  <Text className="text-xl text-gray-600">✕</Text>
                </TouchableOpacity>
              </View>

              {/* PDF Viewer */}
              {pdfSource && (
                <Pdf
                  source={pdfSource}
                  style={{ flex: 1, width: "100%" }}
                  onError={(error) => console.log("PDF load error:", error)}
                />
              )}
            </SafeAreaView>
          </Modal>
          :
          <Modal
            visible={showWebView}
            animationType="slide"
            onRequestClose={() => setShowWebView(false)}
          >
            <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-300 mt-10">
              <Text className="text-lg font-semibold">{webViewTitle}</Text>
              <TouchableOpacity onPress={() => setShowWebView(false)}>
                <Text className="text-black-500 font-bold text-lg">✕</Text>
              </TouchableOpacity>
            </View>

            <WebView
              source={{ uri: webViewUrl }}
              startInLoadingState
              style={{ flex: 1 }}

            />
          </Modal>}

        <View
          className="bg-white flex-row justify-between items-center px-4 pt-10 pb-6 rounded-b-xl z-30"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.1,
            shadowRadius: 16,
            elevation: 5,
          }}
        >
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={router.back}
              className="border border-gray rounded-lg flex justify-center items-center w-8 h-8"
            >
              <Image
                source={icons.back}
                className="size-4"
                resizeMode="contain"
              />
            </TouchableOpacity>
            <Text className="leading-[22px] text-dark text-base font-medium tracking-[-0.41px]">
              Settings
            </Text>
          </View>

          <NotificationBell />
        </View>

        <ScrollView className="flex-1">
          <View className="items-center mt-8 mb-6">
            <View className="rounded-full overflow-hidden border-2 border-primary">

              <Image
                source={getProfileImage()}
                style={{ width: 100, height: 100 }}
              />
            </View>
            <Text className="mt-3 font-semibold text-lg text-dark">
              {profile?.DisplayName || "User"}
            </Text>
            <Text className="text-gray-500">
              {profile?.Email || appleUserInfo?.email || "No email provided"}
            </Text>
          </View>

          <View
            className="mx-5 rounded-xl overflow-hidden bg-white py-6 px-5"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.1,
              shadowRadius: 16,
              elevation: 5,
            }}
          >
            <View className="rounded-xl overflow-hidden mt-4">
              <TouchableOpacity
                className="flex-row items-center bg-light-100 mb-4 px-4 py-4 border border-border rounded-full"
                onPress={() =>
                  router.push({
                    pathname: "/editProfile",
                    params: { profile: profile },
                  })
                }
              >
                <Ionicons name="person-outline" size={20} color="#333" />
                <Text className="ml-3 flex-1 text-dark">Edit Profile</Text>
                <MaterialIcons
                  name="keyboard-arrow-right"
                  size={22}
                  color="#999"
                />
              </TouchableOpacity>
              <TouchableOpacity
                // onPress={gotoPrivacy}
                onPress={() => {
                  Platform.OS == 'ios' ? openModal(require("../../assets/docs/PrivacyPolicy.pdf")) : goToPrivacy()
                }}
                className="flex-row items-center bg-light-100 mb-4 px-4 py-4 border border-border rounded-full"
              >
                <Ionicons
                  name="information-circle-outline"
                  size={22}
                  color="#333"
                />
                <Text className="ml-3 flex-1 text-dark">Privacy Policy</Text>
                <MaterialIcons
                  name="keyboard-arrow-right"
                  size={22}
                  color="#999"
                />
              </TouchableOpacity>
            </View>

            <View className="rounded-xl overflow-hidden">
              <TouchableOpacity className="flex-row items-center bg-light-100 mb-4 px-4 py-4 border border-border rounded-full"
                onPress={() =>
                  router.push({
                    pathname: "/appGallery",
                  })
                }>
                {/* <Ionicons name="help-circle-outline" size={22} color="#333" /> */}
                <MaterialIcons
                  name="photo-library"
                  size={22}
                  color="#333"
                />
                {/* <Text className="ml-3 flex-1 text-dark">Help & Support</Text> */}
                <Text className="ml-3 flex-1 text-dark">App Gallery</Text>
                <MaterialIcons
                  name="keyboard-arrow-right"
                  size={22}
                  color="#999"
                />
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row items-center bg-light-100 mb-4 px-4 py-4 border border-border rounded-full"
                onPress={handleDeleteAccount}
              >
                <MaterialIcons name="delete-outline" size={22} color="#333" />
                <Text className="ml-3 flex-1 text-dark">Delete Account</Text>
                <MaterialIcons
                  name="keyboard-arrow-right"
                  size={22}
                  color="#999"
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleLogout}
            className="overflow-hidden w-3/4 mx-auto my-6 rounded-full"
          >
            <LinearBg className="py-4 rounded-full" style={{ paddingVertical: 10 }}>
              <View className="flex-row items-center justify-center">
                <Text className="text-white text-lg font-semibold">Logout</Text>
              </View>
            </LinearBg>
          </TouchableOpacity>

          <Text className="text-gray text-center">Version {appVersion}</Text>
        </ScrollView>
      </View>
    </>
  );
}
