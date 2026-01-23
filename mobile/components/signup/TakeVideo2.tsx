import { CommonFileUpload } from '@/lib/api';
import { signupProps } from '@/types';
import { CameraRoll } from "@react-native-camera-roll/camera-roll";
import * as FileSystem from "expo-file-system";
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, PermissionsAndroid, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Video from 'react-native-video';
import { Camera, useCameraDevice, useCameraPermission, useMicrophonePermission } from 'react-native-vision-camera';
import GradientButton from '../ui/GradientButton';

const TakeVideo2 = ({ updateData, onNext }: signupProps) => {
  const camera = useRef(null);
  const videoPathRef = useRef(null);
  const [elapsedTime, setElapsedTime] = useState(0); 
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [, updateState] = useState({});
  const forceUpdate = () => updateState({});

  // Permissions and Device hooks (Same as before)
  const { hasPermission: cameraPermission, requestPermission: requestCameraPermission } = useCameraPermission();
  const { hasPermission: microphonePermission, requestPermission: requestMicrophonePermission } = useMicrophonePermission();
  const device = useCameraDevice('front');
  const hasAllPermissions = cameraPermission && microphonePermission;

  // Permissions Request (Same as before)
  useEffect(() => {
    (async () => {
      if (!cameraPermission) await requestCameraPermission();
      if (!microphonePermission) await requestMicrophonePermission();
    })();
  }, [cameraPermission, microphonePermission]);


  // 1. Recording Functions
  const startRecording = useCallback(async () => {
    console.log("inside startRecording...");
    if (camera.current == null) return;

    setIsRecording(true);
    // setVideoPath(null); // Ensure no preview is shown
    videoPathRef.current = null;
    startTimer();

    try {
      console.log("inside try block of startRecording...");
      camera.current?.startRecording({
        onRecordingFinished: (video: any) => {
          console.log('video created url:', video);
          // setVideoPath(video.path); 
          videoPathRef.current = video.path; // ✅ Ref में URL सेट करें
          forceUpdate();
        },
        onRecordingError: (error: any) => {
          setIsRecording(false);
          console.error("Recording Error:", error);
          Alert.alert("Error", "Video recording failed.");
        },
      });
    } catch (e) {
      console.error(e);
      setIsRecording(false);
    }
  }, []);

  const stopRecording = useCallback(async () => {
    console.log("inside stopRecording...");

    setIsRecording(false);
    stopTimer();
    if (camera.current == null) return;
    await camera.current.stopRecording();
  }, []);

  const startTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setElapsedTime(0); 

    intervalRef.current = setInterval(() => {
      setElapsedTime(prevTime => prevTime + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(seconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
  };


  if (device == null || !hasAllPermissions) {
    if (!hasAllPermissions) {
      return (
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>Camera and Microphone Permissions Required</Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={() => Linking.openSettings()}
          >
            <Text style={styles.permissionButtonText}>Go to Settings</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return <ActivityIndicator size="large" color="#000" style={styles.loadingIndicator} />;
  }

  const handleRetake = () => {
    videoPathRef.current = null;
    forceUpdate();
  };

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

  const normalizeUri = async (uri: string) => {
    if (!uri) return uri;
    if (!uri.startsWith("content://")) return uri;

    try {
      const dest = `${FileSystem.cacheDirectory}video_${Date.now()}.mp4`;
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
      return uri;
    }
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

  const ensureFileUri = (uri: string) => {
    if (!uri.startsWith("file://")) {
      return "file://" + uri;
    }
    return uri;
  };

  const handleUpload = async () => {
    let finalVideoPath: any = videoPathRef.current;
    let galleryUri;
    console.log("Raw finalVideoPath:", finalVideoPath);

    if (!finalVideoPath) {
      Alert.alert("Error", "No video found to upload.");
      return;
    }

    setUploading(true);

    try {
      // -------------------------------------------------
      // 1️⃣  SAVE TO GALLERY (OPTIONAL)
      // -------------------------------------------------
      const hasPermission = await requestGalleryPermission();

      if (hasPermission) {
        try {
          // Add file:// only if missing
            galleryUri = finalVideoPath.startsWith("file://")
            ? finalVideoPath
            : `file://${finalVideoPath}`;

          await CameraRoll.save(galleryUri, { type: "video" });
          console.log("Saved to gallery:", galleryUri);
        } catch (err) {
          console.warn("Gallery save failed:", err);
        }
      } else {
        console.warn("Gallery permission denied");
      }

      // -------------------------------------------------
      // 2️⃣  NORMALIZE URI (content:// → file://)
      // -------------------------------------------------
      const normalized = await normalizeUri(galleryUri);
      const fileUri = ensureFileUri(normalized);

      console.log("Normalized fileUri:", fileUri);

      // -------------------------------------------------
      // 3️⃣  Build FormData for Upload
      // -------------------------------------------------
      const fileName = fileUri.split("/").pop() || `video_${Date.now()}.mp4`;
      const fileType = getMimeTypeFromUri(fileName);

      const formData = new FormData();
      formData.append("uploadattachments[]", {
        uri: fileUri,
        name: fileName,
        type: fileType,
      } as any);

      console.log("Uploading video...");

      // -------------------------------------------------
      // 4️⃣  API CALL
      // -------------------------------------------------
      const res = await CommonFileUpload(formData);
      console.log("Upload response:", res);

      if (res?.name) {
        updateData({ liveVideo: res?.name });
        console.log("Updated video data with:", res?.name);
        Alert.alert("Upload Successful", "Your video has been uploaded.");
        onNext();
      } else {
        console.error("Upload failed, invalid response:", res);
        Alert.alert("Upload Failed", "Server did not return a valid file name.");
      }
    } catch (err) {
      console.error("Upload failed:", err);
      Alert.alert("Error", "Video upload failed. Please try again.");
    } finally {
      setUploading(false);
      videoPathRef.current = null;
      forceUpdate();
    }
  }

  if (videoPathRef.current) {
    return (
      <View style={styles.container}>
        <Video
          source={{ uri: videoPathRef.current }}
          style={styles.videoPreview}
          resizeMode="cover"
          controls={false}
          repeat={true}
          paused={false}
          onLoadStart={() => console.log('Video starting load')}
          onLoad={() => console.log('Video loaded')}
        />
        <View style={styles.previewControlContainer}>
          <TouchableOpacity
            style={styles.retakeButton}
            onPress={() => handleRetake()}
            disabled={uploading}
          >
            <Text style={styles.controlButtonText}>Retake</Text>
          </TouchableOpacity>

          <GradientButton
              onPress={handleUpload}
              disabled={uploading}
              containerStyle={{
                opacity: uploading ? 0.6 : 1,
                paddingHorizontal: 50
              }}
            >
              {uploading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: "#fff", fontSize: 16, fontWeight: "500" }}>
                  Upload
                </Text>
              )}
            </GradientButton>

        </View>
      </View>
    );
  }

  // 5. Render Camera View (Default View)
  return (
    <View style={styles.container}>
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        video={true}
        audio={true}
        isActive={!videoPathRef.current}
      />

      {isRecording && (
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>{formatTime(elapsedTime)}</Text>
        </View>
      )}

      <View style={styles.controlContainer}>
        <TouchableOpacity
          style={[styles.captureButton, isRecording && styles.recordingButton]}
          onPress={isRecording ? stopRecording : startRecording}
        >
          {isRecording ? (
            <Text style={styles.buttonText}>{'STOP'}</Text>
          ) : (
            <Text style={styles.buttonText}>{'RECORD'}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  timerContainer: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 10,
  },
  timerText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333',
  },
  permissionText: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  videoPreview: {
    flex: 1, 
    width: '100%',
    height: '100%',
  },
  loadingIndicator: {
    flex: 1,
    backgroundColor: 'black',
  },
  controlContainer: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 5,
    borderColor: 'white',
  },
  recordingButton: {
    backgroundColor: '#CC0000', 
    borderColor: 'yellow',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },

  // New Styles for Preview View
  previewControlContainer: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  retakeButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 15,
    borderRadius: 50,
    paddingHorizontal: 50
  },

  controlButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default TakeVideo2;