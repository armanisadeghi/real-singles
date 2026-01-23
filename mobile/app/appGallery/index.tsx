import MediaItem from "@/components/MediaItem";
import { icons } from "@/constants/icons";
import { fetchUserProfile, getProfile, saveGalleryImage, uploadImage } from "@/lib/api";
import { MaterialIcons } from "@expo/vector-icons";
import { Camera, CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import Toast from "react-native-toast-message";


const screenWidth = Dimensions.get("window").width;

export default function AppGallery() {
  const horizontalPadding = 20; // padding from screen edges
  const gap = 20; // gap between items
  const itemWidth = (screenWidth - horizontalPadding * 2 - gap) / 2;

  const router = useRouter();
  const { otherUserID } = useLocalSearchParams<{ otherUserID: string }>();
  const [loading, setLoading] = useState(false);
  const [mediaArray, setMediaArray] = useState<any>([])
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);
  const [capturedMedia, setCapturedMedia] = useState<string[]>([]);
  const [recording, setRecording] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraMode, setCameraMode] = useState<"photo" | "video" | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef<any>(null);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [])
  );



  const fetchProfile = async () => {
    setLoading(true);
    let res = null;
    try {
      if (otherUserID) {
        res = await fetchUserProfile(otherUserID);
      } else {
        res = await getProfile();
      }
      console.log("Profile data fetched successfully:", res);
      if (res?.success) {
        const profileData = res?.data || {};

        // Split livePicture by comma and filter out empty strings
        const picturesArray = (profileData.livePicture || "")
          .split(",")
          .filter((item: string) => item.trim() !== "");

        // Add LiveVideo if it exists
        if (profileData.LiveVideo && profileData.LiveVideo.trim() !== "") {
          picturesArray.push(profileData.LiveVideo);
        }
        
        console.log("Combined media array:", picturesArray);
        setMediaArray(picturesArray); // store it in state if needed
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


  // ✅ One function for all camera permission requests
  const handlePermission = async (action: "photo" | "video") => {
    if (!cameraPermission?.granted) {
      await requestCameraPermission();
    }

    if (action === "video") {
      const audioPerm = await Camera.requestMicrophonePermissionsAsync();
      if (!audioPerm.granted) {
        Alert.alert("Microphone permission is required to record video");
        return;
      }
    }

    setCameraMode(action);
    setShowCamera(true);
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      console.log("photo in take picture", photo);
      setCapturedMedia((prev) => [...prev, photo.uri]);
      await uploadMedia(photo.uri); // 🔥 Upload after capture
    }
  };

  const startRecording = async () => {
    if (!cameraRef.current || recording || !cameraReady) return;
    setRecording(true);
    setRecordingTime(0);

    // start timer
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);

    try {
      const video = await cameraRef.current.recordAsync({ maxDuration: 60 });
      console.log("video in startRecording", video);

      setCapturedMedia(prev => [...prev, video.uri]);
      // await uploadMedia(video.uri);
    } catch (error) {
      console.error("Recording failed:", error);
    } finally {
      setRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };




  // 📍 Call this when user taps "Stop Recording"
  const stopRecording = () => {
    console.log("in stopRecording..");

    if (cameraRef.current && recording) {
      cameraRef.current.stopRecording();
    }
  };



  const pickMediaFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      // mediaTypes: ImagePicker.MediaTypeOptions.All,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setCapturedMedia((prev) => [...prev, uri]);
      await uploadMedia(uri); // 🔥 Upload after selection
    }
  };

  const handleAddPress = () => {
    Alert.alert("Add Media", "Choose an option", [
      { text: "Gallery", onPress: () => pickMediaFromGallery() },
      { text: "Take Photo", onPress: () => handlePermission("photo") },
      // { text: "Record Video", onPress: () => handlePermission("video") },
      { text: "Cancel", style: "cancel", onPress: () => console.log("Alert dismissed") },
    ]);
  };


  const uploadMedia = async (uri: string) => {
    try {
      const isVideo = uri.endsWith(".mp4");

      console.log("Uploading =>", isVideo ? { video: uri } : { image: uri });

      // Step 1: upload file
      const uploadRes = await uploadImage(
        isVideo ? undefined : uri, // image
        isVideo ? uri : undefined  // video
      );

      if (uploadRes?.success && uploadRes?.name) {
        console.log("Upload successful, file path:", uploadRes.name);

        // Step 2: save gallery reference
        const saveRes = await saveGalleryImage(
          !isVideo ? uploadRes.name : "", // if image
          isVideo ? uploadRes.name : ""   // if video
        );

        if (saveRes?.success) {
          // ✅ Instantly update UI
          setMediaArray((prev: any) => [...prev, uploadRes.name]);
          Toast.show({
            type: "success",
            text1: "Saved to gallery",
            position: "bottom",
            visibilityTime: 2000,
            bottomOffset: 100,
          });
        } else {
          Toast.show({
            type: "error",
            text1: saveRes?.msg || "Failed to save gallery",
            position: "bottom",
            visibilityTime: 2000,
            bottomOffset: 100,
          });
        }
      } else {
        Toast.show({
          type: "error",
          text1: uploadRes?.msg || "Upload failed",
          position: "bottom",
          visibilityTime: 2000,
          bottomOffset: 100,
        });
      }
    } catch (err) {
      console.error("Upload error:", err);
    }
  };



  console.log("mediaArray::", mediaArray);
  console.log("capturedMedia:", capturedMedia);

  return (
    <>
      {/* <StatusBar barStyle="dark-content" translucent /> */}
      <View className="flex-1 bg-backgground">
        <Toast />
        <View className="bg-white flex-row justify-between items-center px-4 pt-10 pb-6 rounded-b-xl z-30"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.1,
            shadowRadius: 16,
            elevation: 5,
          }}
        >
          <View className="flex-row items-center gap-2 pt-5">
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
            <Text className="leading-[22px] text-base font-medium tracking-[-0.41px] text-black">
              My Gallery
            </Text>
          </View>

          <TouchableOpacity onPress={handleAddPress} className="pt-5">
            <MaterialIcons
              name="add-circle-outline"
              size={22}
              color="#333"
            />
          </TouchableOpacity>

        </View>

        {showCamera ? (
          <CameraView
            style={{ flex: 1 }}
            ref={cameraRef}
            onCameraReady={() => setCameraReady(true)}
          >
            <View style={{ flex: 1, justifyContent: "flex-end", alignItems: "center", marginBottom: 20 }}>
              {cameraMode === "photo" ? (
                <TouchableOpacity
                  onPress={async () => {
                    await takePicture();
                    setShowCamera(false); // close camera after capture
                  }}
                  style={{ backgroundColor: "white", padding: 15, borderRadius: 50 }}
                >
                  <Text>📸 Capture</Text>
                </TouchableOpacity>
              ) : (
                <>
                  {!recording ? (
                    <TouchableOpacity
                      onPress={() => {
                        if (!cameraReady) return; // prevent starting too early
                        startRecording();
                      }}
                      style={{ backgroundColor: '#B06D1E', padding: 15, borderRadius: 50, marginBottom: 50 }}
                    >
                      <Text style={{ color: "white" }}>Start Recording</Text>
                    </TouchableOpacity>
                  ) : (
                    <>
                      <Text style={{ color: "#B06D1E", marginBottom: 20 }}>
                        {recordingTime}s
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          stopRecording();
                          setShowCamera(false); // close after stop
                        }}
                        style={{ backgroundColor: "black", padding: 15, borderRadius: 50, marginBottom: 50 }}
                      >
                        <Text style={{ color: "white" }}>Stop Recording</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </>
              )}
            </View>
          </CameraView>
        ) : (
          <View className="mt-8 pb-40">
            <FlatList
              data={[...mediaArray, ...capturedMedia]}
              numColumns={2}
              renderItem={({ item }) => <MediaItem item={item} itemWidth={itemWidth} />}
              keyExtractor={(item, index) => `${index}`}
              columnWrapperStyle={{ justifyContent: "space-between", marginBottom: 20, }}
              contentContainerStyle={{ paddingHorizontal: horizontalPadding, }}
            />
          </View>
        )}

      </View>
    </>
  );
}


