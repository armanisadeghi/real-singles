import { icons } from "@/constants/icons";
import { PlatformIcon } from "@/components/ui/PlatformIcon";
import { CommonFileUpload } from "@/lib/api";
import { signupProps } from "@/types";
import { CameraRoll } from "@react-native-camera-roll/camera-roll";
import { CameraType, CameraView, useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
  PermissionsAndroid,
  Platform,
  StatusBar, StyleSheet, Text,
  TouchableOpacity,
  View
} from "react-native";

const TakeVideo = ({ data, updateData, onNext, error }: signupProps) => {
  console.log("TakeVideo rendered");

  const [facing, setFacing] = useState<CameraType>("front");
  const [permission, requestPermission] = useCameraPermissions();
  const [audioPermission, requestAudioPermission] = useMicrophonePermissions();
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [permissionsChecked, setPermissionsChecked] = useState(false);
  const cameraRef = useRef<CameraView | null>(null);
  const videoRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);

  // store interval id in a ref to avoid stale closures
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;

    const checkPermissions = async () => {
      try {
        const cameraStatus = permission?.granted
          ? permission
          : await requestPermission();
        const audioStatus = audioPermission?.granted
          ? audioPermission
          : await requestAudioPermission();

        console.log("Camera permission:", cameraStatus?.granted);
        console.log("Audio permission:", audioStatus?.granted);

        if (mounted) setPermissionsChecked(true);
      } catch (err) {
        console.error("Permission check failed:", err);
        Alert.alert(
          "Permission Error",
          "Failed to check camera permissions. Please restart the app."
        );
      }
    };

    checkPermissions();

    return () => {
      mounted = false;
      // ensure interval cleanup
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const requestAllPermissions = async () => {
    try {
      const cameraStatus = await requestPermission();
      const audioStatus = await requestAudioPermission();

      console.log("Requested camera permission:", cameraStatus.granted);
      console.log("Requested audio permission:", audioStatus.granted);

      return cameraStatus.granted && audioStatus.granted;
    } catch (err) {
      console.error("Permission request failed:", err);
      Alert.alert(
        "Permission Error",
        "Failed to request permissions. Please try again."
      );
      return false;
    }
  };

  const onCameraReady = () => {
    console.log("Camera is ready");
    setCameraReady(true);
  };

  const onCameraError = (error: any) => {
    console.error("Camera error:", error);
    Alert.alert(
      "Camera Error",
      "There was a problem with the camera. Please restart the app."
    );
  };

  // Helper: get file extension and mime type fallback
  const getMimeTypeFromUri = (uri: string) => {
    try {
      const parts = uri.split(".");
      const ext = parts[parts.length - 1].toLowerCase();
      switch (ext) {
        case "mp4":
          return "video/mp4";
        case "mov":
          return "video/quicktime";
        case "3gp":
        case "3gpp":
          return "video/3gpp";
        case "mkv":
          return "video/x-matroska";
        case "webm":
          return "video/webm";
        default:
          return "video/mp4";
      }
    } catch {
      return "video/mp4";
    }
  };

  /**
   * Normalize URI:
   * - On some Samsung devices recorded video returns content:// uri.
   * - Try FileSystem.copyAsync to copy content:// to cacheDirectory and return new file path.
   * - If copy fails, fallback to the original uri.
   */
  const normalizeUri = async (uri: string) => {
    if (!uri) return uri;
    if (!uri.startsWith("content://")) return uri;

    try {
      const dest = `${(FileSystem as any).documentDirectory || ""}video_${Date.now()}.mp4`;
      console.log("Attempting to copy content:// URI to cache:", uri, "->", dest);
      await FileSystem.copyAsync({ from: uri, to: dest });
      // verify file exists
      const info = await FileSystem.getInfoAsync(dest);
      if (info.exists) {
        console.log("Copied content:// to:", dest);
        return dest;
      } else {
        console.warn("Copied file does not exist after copyAsync. Falling back to original URI.");
        return uri;
      }
    } catch (copyErr) {
      console.warn("Failed to copy content:// URI using FileSystem.copyAsync():", copyErr);
      // fallback: try to use the original uri (some servers accept content:// if RN fetch can read it)
      return uri;
    }
  };

  const toggleCameraFacing = () => {
    Haptics.selectionAsync();
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  const requestGalleryPermission = async () => {
    // We no longer request WRITE_EXTERNAL_STORAGE; CameraRoll.save will handle scoped-storage on modern Android.
    // On Android, CameraRoll may still require READ/WRITE for older devices. We keep a pragmatic check.
    if (Platform.OS === "android" && Platform.Version < 29) {
      // for older Android versions you might need WRITE permission (rare)
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: "Storage Permission",
          message: "App needs access to your storage to save videos",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK",
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  const startRecording = async () => {
    console.log("in startRecording");

    if (!cameraRef.current || !cameraReady) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert("Camera not ready", "Please wait for camera to initialize");
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setRecording(true);
      setRecordingDuration(0);

      // Start the timer (store id in ref)
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000) as unknown as number;

      console.log("Starting recording...");

      // recordAsync is supported on expo-camera's CameraView wrapper; keep maxDuration
      const video = await cameraRef.current.recordAsync({
        maxDuration: 30,
      });

      console.log("Recording completed:", video);

      if (video && video.uri) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setRecordedVideo(video.uri);
      } else {
        console.warn("recordAsync returned no uri:", video);
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error("Failed to record video:", error);
      Alert.alert("Error", "Failed to record video. Please try again.");
    } finally {
      // stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setRecording(false);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    try {
      if (cameraRef.current) {
        console.log("Stopping recording...");
        cameraRef.current.stopRecording();
      }
    } catch (err) {
      console.error("Error stopping recording:", err);
    }

    // ensure timer cleared here as well
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRecording(false);
  };

  const handleSaveVideo = async () => {
    if (!recordedVideo) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      console.log("Preparing to upload video:", recordedVideo);

      // --- SAVE TO GALLERY (optional) ---
      const hasPermission = await requestGalleryPermission();
      if (hasPermission) {
        try {
          await CameraRoll.save(recordedVideo, { type: "video" });
          console.log("Video saved to gallery!");
        } catch (saveErr) {
          console.warn("CameraRoll.save failed:", saveErr);
        }
      } else {
        console.warn("Gallery permission denied");
      }

      // Normalize URI (handle content:// on Samsung)
      const fileUri = await normalizeUri(recordedVideo);
      console.log("Upload fileUri after normalization:", fileUri);

      // Extract filename and mime type
      const fileName = fileUri.split("/").pop() || `video_${Date.now()}.mp4`;
      const fileType = getMimeTypeFromUri(fileName);

      // Build FormData
      const formData = new FormData();
      // For android content URIs, using the normalized cache path helps.
      formData.append("uploadattachments[]", {
        uri: fileUri,
        name: fileName,
        type: fileType,
      } as any);

      console.log("Uploading video...");
      const res = await CommonFileUpload(formData);
      console.log("Video upload response:", res);

      if (res && res?.name) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        updateData({ liveVideo: res?.name });
        Alert.alert("Upload Successful", "Your video has been successfully uploaded.");
        console.log("Updated video data with:", res?.name);
        onNext();
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        console.error("Upload response missing name property:", res);
        Alert.alert("Upload Failed", "There was an issue uploading your video. Please try again.");
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error("Failed to upload video:", error);
      Alert.alert("Upload Failed", "There was an issue uploading your video. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const retakeVideo = () => {
    setRecordedVideo(null);
    setRecordingDuration(0);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  if (!permissionsChecked) {
    return (
      <View className="flex-1 items-center justify-center bg-[#1D2733]">
        <Text className="text-white">Checking permissions...</Text>
      </View>
    );
  }

  if (!permission?.granted || !audioPermission?.granted) {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View className="bg-[#1D2733] py-12 flex flex-col items-center justify-center">
          <Text className="text-2xl text-white text-center mb-2 font-normal">
            Record Intro Video
          </Text>
          <Text className="text-center text-xs text-gray px-14">
            Record a short intro video to help others get to know you
          </Text>
        </View>
        <View className="flex-1 h-[62vh] items-center justify-center">
          <Text className="text-center text-lg mb-6">
            We need your permission to use the camera & Audio
          </Text>
          <TouchableOpacity
            onPress={requestAllPermissions}
            className="bg-primary px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-medium">Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

return (
  <View style={styles.root}>
    <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

    {/* Header */}
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Upload Live Video</Text>
      <Text style={styles.headerSubtitle}>
        Upload 6-8 pictures plus 1 picture or video must be taken on the app with date stamp
      </Text>

      <TouchableOpacity onPress={onNext} style={styles.skipBtn}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>
    </View>

    {/* Camera */}
    <View style={styles.cameraWrapper}>
      {permission?.granted && audioPermission?.granted && (
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          mode="video"
          onCameraReady={onCameraReady}
          onMountError={onCameraError}
        />
      )}

      {recording && (
        <View style={styles.timerBox}>
          <View style={styles.redDot} />
          <Text style={styles.timerText}>{formatDuration(recordingDuration)}</Text>
        </View>
      )}
    </View>

    {/* Bottom Controls */}
    <View style={styles.controls}>
      <TouchableOpacity
        style={styles.flipBtn}
        onPress={toggleCameraFacing}
        disabled={recording || !cameraReady}
      >
        <PlatformIcon name="flip-camera-ios" size={28} color="#fff" iosName="camera.rotate" />
      </TouchableOpacity>

      {recording ? (
        <TouchableOpacity style={styles.stopBtn} onPress={stopRecording}>
          <View style={styles.stopInner} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.recordBtn}
          onPress={startRecording}
          disabled={!cameraReady}
        >
          <View style={styles.recordInner} />
        </TouchableOpacity>
      )}

      <View style={{ width: 50 }} />
    </View>
  </View>
);




};


const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
  },

  // header: {
  //   backgroundColor: "#1D2733",
  //   paddingBottom: 20,
  //   paddingHorizontal: 20,
  //   justifyContent: "center",
  //   alignItems: "center",
  // },

  header: {
  backgroundColor: "#1D2733",
  paddingTop: Platform.OS === "ios" ? 50 : StatusBar.currentHeight || 20,
  paddingBottom: 10,
  paddingHorizontal: 20,
  justifyContent: "center",
  alignItems: "center",
},

cameraWrapper: {
  flex: 1,
  backgroundColor: "#000",
  justifyContent: "center",
  alignItems: "center",
},

camera: {
  flex: 1,        // Fill remaining space
  // width: "100%",
},

controls: {
  height: 120,
  backgroundColor: "#1D2733",
  flexDirection: "row",
  justifyContent: "space-around",
  alignItems: "center",
  paddingHorizontal: 30,
},



  headerTitle: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "600",
    marginBottom: 6,
    textAlign: "center",
  },

  headerSubtitle: {
    fontSize: 12,
    color: "#ccc",
    textAlign: "center",
  },

  skipBtn: {
    position: "absolute",
    right: 20,
    top: Platform.OS === "ios" ? 55 : (StatusBar.currentHeight ?? 0) + 10,
  },

  skipText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },

  // cameraWrapper: {
  //   flex: 1,
  //   backgroundColor: 'pink',
  //   // backgroundColor: "#000",
  // },

  // camera: {
  //   height: '100%',
  //   width: '100%',
  // },

  timerBox: {
    position: "absolute",
    top: 20,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
  },

  redDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "red",
    marginRight: 8,
  },

  timerText: {
    color: "#fff",
    fontSize: 14,
  },

  // controls: {
  //   height: 130,
  //   backgroundColor: "#1D2733",
  //   flexDirection: "row",
  //   justifyContent: "space-around",
  //   alignItems: "center",
  //   paddingHorizontal: 30,
  // },

  flipBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },

  flipIcon: {
    width: 28,
    height: 28,
    tintColor: "#fff",
  },

  recordBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 5,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },

  recordInner: {
    width: 55,
    height: 55,
    borderRadius: 30,
    backgroundColor: "red",
  },

  stopBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 5,
    borderColor: "red",
    justifyContent: "center",
    alignItems: "center",
  },

  stopInner: {
    width: 28,
    height: 28,
    backgroundColor: "red",
    borderRadius: 4,
  },
});
export default TakeVideo;


