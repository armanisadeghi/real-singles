import LinearBg from "@/components/LinearBg";
import { icons } from "@/constants/icons";
import { getProfile, updateUser } from "@/lib/api";
import { User } from "@/types";
import { authenticateForAccountDeletion, shouldUseBiometrics } from "@/utils/biometrics";
import { IMAGE_URL, MEDIA_BASE_URL, removeToken } from "@/utils/token";
import { PlatformIcon } from "@/components/ui";
import { useThemeColors } from "@/context/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useState, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  PlatformColor,
  Switch,
  Text,
  TouchableOpacity,
  useColorScheme,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView } from "react-native-gesture-handler";
import Pdf from "react-native-pdf";
import Toast from "react-native-toast-message";
import WebView from "react-native-webview";

export default function Settings() {
  const [appleUserInfo, setAppleUserInfo] = React.useState<any>()
  const [profile, setProfile] = useState<User>();
  const [loading, setLoading] = useState(false);
  const [profileHidden, setProfileHidden] = useState(false);
  const [pauseLoading, setPauseLoading] = useState(false);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = useThemeColors();
  
  const themedColors = useMemo(() => ({
    background: Platform.OS === 'ios' ? (PlatformColor('systemBackground') as unknown as string) : colors.background,
    secondaryBackground: Platform.OS === 'ios' ? (PlatformColor('secondarySystemBackground') as unknown as string) : colors.surfaceContainer,
    text: Platform.OS === 'ios' ? (PlatformColor('label') as unknown as string) : colors.onSurface,
    secondaryText: Platform.OS === 'ios' ? (PlatformColor('secondaryLabel') as unknown as string) : colors.onSurfaceVariant,
    tertiaryText: Platform.OS === 'ios' ? (PlatformColor('tertiaryLabel') as unknown as string) : (isDark ? '#9CA3AF' : '#666666'),
    border: Platform.OS === 'ios' ? (PlatformColor('separator') as unknown as string) : colors.outline,
    cardBackground: Platform.OS === 'ios' ? (PlatformColor('secondarySystemBackground') as unknown as string) : (isDark ? '#1C1C1E' : '#FFFFFF'),
    rowBackground: Platform.OS === 'ios' ? (PlatformColor('tertiarySystemBackground') as unknown as string) : (isDark ? '#2C2C2E' : '#F5F5F5'),
  }), [isDark, colors]);
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
        setProfileHidden(res?.data?.profile_hidden || false);
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

  const handlePauseToggle = async (newValue: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPauseLoading(true);
    
    try {
      const res = await updateUser({ profile_hidden: newValue } as any);
      if (res?.success) {
        setProfileHidden(newValue);
        Toast.show({
          type: "success",
          text1: newValue 
            ? "Account paused" 
            : "Account active",
          text2: newValue 
            ? "Your profile is hidden from discovery" 
            : "You'll appear in discovery again",
          position: "bottom",
          visibilityTime: 2000,
          bottomOffset: 100,
          autoHide: true,
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Failed to update account status",
          position: "bottom",
          visibilityTime: 2000,
          bottomOffset: 100,
          autoHide: true,
        });
      }
    } catch (error) {
      console.error("Error updating profile_hidden:", error);
      Toast.show({
        type: "error",
        text1: "Failed to update account status",
        position: "bottom",
        visibilityTime: 2000,
        bottomOffset: 100,
        autoHide: true,
      });
    } finally {
      setPauseLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    // Check if we should use biometric authentication
    const useBiometrics = await shouldUseBiometrics();
    
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => Haptics.selectionAsync(),
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            // Require biometric authentication for sensitive action
            if (useBiometrics) {
              const authenticated = await authenticateForAccountDeletion();
              if (!authenticated) {
                return; // User cancelled or failed authentication
              }
            }
            
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await removeToken();
            router.replace("/(auth)/login");
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Logout", "Are you sure you want to Logout?", [
      {
        text: "Cancel",
        style: "cancel",
        onPress: () => Haptics.selectionAsync(),
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
      
      // If it's already a full URL, use it directly
      if (img.startsWith("http://") || img.startsWith("https://")) {
        return { uri: img };
      }
      
      // Otherwise, prepend the appropriate base URL
      const finalUrl = img.startsWith("uploads/")
        ? IMAGE_URL + img
        : MEDIA_BASE_URL + img;

      return { uri: finalUrl };
    }

    if (profile?.livePicture) {
      const firstImage = profile.livePicture.split(",")[0].trim();
      
      // If it's already a full URL, use it directly
      if (firstImage.startsWith("http://") || firstImage.startsWith("https://")) {
        return { uri: firstImage };
      }
      
      // Otherwise, prepend the appropriate base URL
      const finalUrl = firstImage.startsWith("uploads/")
        ? IMAGE_URL + firstImage
        : MEDIA_BASE_URL + firstImage;

      return { uri: finalUrl };
    }

    return icons.ic_user;
  };

  return (
    <>
      <View style={{ flex: 1, backgroundColor: themedColors.background }}>
        <Toast />
        {loading && (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)', zIndex: 50 }}>
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
            <SafeAreaView style={{ flex: 1, backgroundColor: themedColors.background }}>
              {/* Header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: themedColors.secondaryBackground, borderBottomWidth: 1, borderBottomColor: themedColors.border }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: themedColors.text }}>
                  {pdfSource === require("../../assets/docs/PrivacyPolicy.pdf")
                    ? "Privacy Policy"
                    : "Terms & Conditions"}
                </Text>
                <TouchableOpacity onPress={() => setVisible(false)}>
                  <PlatformIcon name="close" size={24} color={themedColors.secondaryText} />
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
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: themedColors.border, marginTop: 40, backgroundColor: themedColors.background }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: themedColors.text }}>{webViewTitle}</Text>
              <TouchableOpacity onPress={() => setShowWebView(false)}>
                <PlatformIcon name="close" size={24} color={themedColors.text} />
              </TouchableOpacity>
            </View>

            <WebView
              source={{ uri: webViewUrl }}
              startInLoadingState
              style={{ flex: 1 }}

            />
          </Modal>}

        <ScrollView style={{ flex: 1 }}>
          <View style={{ alignItems: 'center', marginTop: 32, marginBottom: 24 }}>
            <View style={{ borderRadius: 50, overflow: 'hidden', borderWidth: 2, borderColor: '#B06D1E' }}>

              <Image
                source={getProfileImage()}
                style={{ width: 100, height: 100 }}
              />
            </View>
            <Text style={{ marginTop: 12, fontWeight: '600', fontSize: 18, color: themedColors.text }}>
              {profile?.DisplayName || "User"}
            </Text>
            <Text style={{ color: themedColors.secondaryText }}>
              {profile?.Email || appleUserInfo?.email || "No email provided"}
            </Text>
          </View>

          <View
            style={{
              marginHorizontal: 20,
              borderRadius: 12,
              overflow: 'hidden',
              backgroundColor: themedColors.cardBackground,
              paddingVertical: 24,
              paddingHorizontal: 20,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.1,
              shadowRadius: 16,
              elevation: 5,
            }}
          >
            <View style={{ borderRadius: 12, overflow: 'hidden', marginTop: 16 }}>
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: themedColors.rowBackground, marginBottom: 16, paddingHorizontal: 16, paddingVertical: 16, borderWidth: 1, borderColor: themedColors.border, borderRadius: 9999 }}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push({
                    pathname: "/editProfile",
                    params: { profile: profile ? JSON.stringify(profile) : "" },
                  });
                }}
              >
                <PlatformIcon name="person-outline" size={20} color={themedColors.text} />
                <Text style={{ marginLeft: 12, flex: 1, color: themedColors.text }}>Edit Profile</Text>
                <PlatformIcon
                  name="keyboard-arrow-right"
                  size={22}
                  color={themedColors.tertiaryText}
                />
              </TouchableOpacity>
              <View
                style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: themedColors.rowBackground, marginBottom: 16, paddingHorizontal: 16, paddingVertical: 16, borderWidth: 1, borderColor: themedColors.border, borderRadius: 9999 }}
              >
                <PlatformIcon
                  name={profileHidden ? "pause-circle-outline" : "play-circle-outline"}
                  size={22}
                  color={profileHidden ? "#F97316" : themedColors.text}
                />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={{ color: themedColors.text }}>Pause Account</Text>
                  <Text style={{ fontSize: 12, color: themedColors.secondaryText }}>
                    {profileHidden 
                      ? "Your profile is hidden" 
                      : "Hide from discovery"}
                  </Text>
                </View>
                <Switch
                  value={profileHidden}
                  onValueChange={handlePauseToggle}
                  disabled={pauseLoading}
                  trackColor={{ false: isDark ? '#3A3A3C' : '#E5E7EB', true: "#FDBA74" }}
                  thumbColor={profileHidden ? "#F97316" : "#f4f3f4"}
                  ios_backgroundColor={isDark ? '#3A3A3C' : '#E5E7EB'}
                />
              </View>

              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  // @ts-expect-error - Route exists but types need regeneration
                  router.push("/subscription");
                }}
                style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: themedColors.rowBackground, marginBottom: 16, paddingHorizontal: 16, paddingVertical: 16, borderWidth: 1, borderColor: themedColors.border, borderRadius: 9999 }}
              >
                <PlatformIcon
                  name="star-outline"
                  size={22}
                  color="#F59E0B"
                />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={{ color: themedColors.text }}>Subscription</Text>
                  <Text style={{ fontSize: 12, color: themedColors.secondaryText }}>
                    {profile?.subscription_tier && profile.subscription_tier !== 'free' 
                      ? `${profile.subscription_tier} member` 
                      : "Upgrade to Premium"}
                  </Text>
                </View>
                <PlatformIcon
                  name="keyboard-arrow-right"
                  size={22}
                  color={themedColors.tertiaryText}
                />
              </TouchableOpacity>

              <TouchableOpacity
                // onPress={gotoPrivacy}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  Platform.OS == 'ios' ? openModal(require("../../assets/docs/PrivacyPolicy.pdf")) : goToPrivacy();
                }}
                style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: themedColors.rowBackground, marginBottom: 16, paddingHorizontal: 16, paddingVertical: 16, borderWidth: 1, borderColor: themedColors.border, borderRadius: 9999 }}
              >
                <PlatformIcon
                  name="info-outline"
                  size={22}
                  color={themedColors.text}
                />
                <Text style={{ marginLeft: 12, flex: 1, color: themedColors.text }}>Privacy Policy</Text>
                <PlatformIcon
                  name="keyboard-arrow-right"
                  size={22}
                  color={themedColors.tertiaryText}
                />
              </TouchableOpacity>
            </View>

            <View style={{ borderRadius: 12, overflow: 'hidden' }}>
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: themedColors.rowBackground, marginBottom: 16, paddingHorizontal: 16, paddingVertical: 16, borderWidth: 1, borderColor: themedColors.border, borderRadius: 9999 }}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push({
                    pathname: "/appGallery",
                  });
                }}>
                <PlatformIcon
                  name="photo-library"
                  size={22}
                  color={themedColors.text}
                />
                <Text style={{ marginLeft: 12, flex: 1, color: themedColors.text }}>App Gallery</Text>
                <PlatformIcon
                  name="keyboard-arrow-right"
                  size={22}
                  color={themedColors.tertiaryText}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: themedColors.rowBackground, marginBottom: 16, paddingHorizontal: 16, paddingVertical: 16, borderWidth: 1, borderColor: themedColors.border, borderRadius: 9999 }}
                onPress={handleDeleteAccount}
              >
                <PlatformIcon name="delete-outline" size={22} color={themedColors.text} />
                <Text style={{ marginLeft: 12, flex: 1, color: themedColors.text }}>Delete Account</Text>
                <PlatformIcon
                  name="keyboard-arrow-right"
                  size={22}
                  color={themedColors.tertiaryText}
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleLogout}
            style={{ overflow: 'hidden', width: '75%', alignSelf: 'center', marginVertical: 24, borderRadius: 9999 }}
          >
            <LinearBg style={{ paddingVertical: 10, borderRadius: 9999 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '600' }}>Logout</Text>
              </View>
            </LinearBg>
          </TouchableOpacity>

          <Text style={{ color: themedColors.secondaryText, textAlign: 'center' }}>Version {appVersion}</Text>
        </ScrollView>
      </View>
    </>
  );
}
