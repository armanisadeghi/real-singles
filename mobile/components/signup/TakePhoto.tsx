// import { icons } from "@/constants/icons";
// import { CommonFileUpload } from "@/lib/api";
// import { signupProps } from "@/types";
// import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
// import { useRef, useState } from "react";
// import {
//   ActivityIndicator,
//   Alert,
//   Image,
//   StatusBar,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";

// const TakePhoto = ({ data, updateData, onNext, error }: signupProps) => {
//   const [facing, setFacing] = useState<CameraType>("front"); // Changed to front for selfies
//   const [permission, requestPermission] = useCameraPermissions();
//   const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
//   const cameraRef = useRef<CameraView>(null);
//   const [loading, setLoading] = useState(false);
//   // const [livePhoto, setLivePhoto] = useState(null);

//   if (!permission) {
//     return (
//       <View className="flex-1 items-center justify-center">
//         <Text>Loading...</Text>
//       </View>
//     );
//   }

//   if (!permission.granted) {
//     return (
//       <>
//         <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
//         <View className="bg-[#1D2733] py-12 flex flex-col items-center justify-center">
//           <Text className="text-2xl text-white text-center mb-2 font-normal">
//             Upload Live Pictures
//           </Text>
//           <Text className="text-center text-xs text-gray px-14">
//             Upload 6-8 pictures plus 1 picture or video has to be taken on the
//             app with date stamp
//           </Text>
//         </View>
//         <View className="flex-1 h-[62vh] items-center justify-center">
//           <Text className="text-center text-lg mb-6">
//             We need your permission to use the camera
//           </Text>
//           <TouchableOpacity
//             onPress={requestPermission}
//             className="bg-primary px-6 py-3 rounded-lg"
//           >
//             <Text className="text-white text-center font-medium">
//               Grant Permission
//             </Text>
//           </TouchableOpacity>
//         </View>
//         <View className="bg-[#1D2733] h-[18vh] py-12 flex flex-row items-center justify-between gap-4 px-8"></View>
//       </>
//     );
//   }

//   const toggleCameraFacing = () => {
//     setFacing((current) => (current === "back" ? "front" : "back"));
//   };

//   const takePicture = async () => {
//     if (cameraRef.current) {
//       try {
//         const photo = await cameraRef?.current?.takePictureAsync();
//         console.log("Photo taken:", photo);
//         // setLivePhoto(photo);
//         setCapturedPhoto(photo.uri);
//       } catch (error) {
//         console.error("Failed to take picture:", error);
//       }
//     }
//   };

//   const handleSavePhoto = async () => {
//     if (capturedPhoto) {
//       setLoading(true);
//       try {
//         console.log("Preparing to upload photo:", capturedPhoto);

//         const formData = new FormData();

//         const fileUri = capturedPhoto;
//         const fileName = fileUri.split("/").pop();
//         const fileType = "image/jpeg";

//         formData.append("uploadattachments[]", {
//           uri: fileUri,
//           name: fileName,
//           type: fileType,
//         } as any);

//         console.log("Uploading photo on save...");

//         const res = await CommonFileUpload(formData);
//         console.log("Photo upload response:", res);

//         if (res && res?.name) {
//           updateData({ livePicture: res?.name });
//           console.log("Updated photo data with:", res?.name);
//           onNext();
//         } else {
//           console.error("Upload response missing name property:", res);
//           // updateData({ photo: capturedPhoto });
//           // onNext();
//           Alert.alert(
//             "Upload Failed",
//             "There was an issue uploading your photo. Please try again."
//           );
//         }
//       } catch (error) {
//         console.error("Failed to upload photo:", error);
//         // updateData({ photo: capturedPhoto });
//         // onNext();
//         Alert.alert(
//             "Upload Failed",
//             "There was an issue uploading your photo. Please try again."
//           );
//       } finally {
//         setLoading(false);
//       }
//     }
//   };

//   const retakePhoto = () => {
//     setCapturedPhoto(null);
//   };

//   return (
//     <View className="flex-1 bg-black">
//       {capturedPhoto ? (
//         <>
//           <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
//           <View className="bg-[#1D2733] py-12 flex flex-col items-center justify-center">
//             <Text className="text-2xl text-white text-center mb-2 font-normal">
//               Upload Live Pictures
//             </Text>
//             <Text className="text-center text-xs text-gray px-14">
//               Upload 6-8 pictures plus 1 picture or video has to be taken on the
//               app with date stamp
//             </Text>
//           </View>
//           <View className="flex-1 h-[62vh]">
//             <Image
//               source={{ uri: capturedPhoto }}
//               className="flex-1"
//               resizeMode="contain"
//             />
//           </View>
//           <View className="absolute bottom-0 left-0 right-0 bg-[#1D2733] h-[18vh] py-12 flex flex-row items-center justify-between gap-4 px-8">
//             <TouchableOpacity
//               onPress={retakePhoto}
//               className="bg-white/20 px-6 py-3 rounded-full flex-1"
//             >
//               <Text className="text-white font-semibold text-center">
//                 Retake
//               </Text>
//             </TouchableOpacity>
//             <TouchableOpacity
//               onPress={handleSavePhoto}
//               className="bg-primary px-6 py-3 rounded-full flex-1"
//             >
//               {loading ? (
//                 <ActivityIndicator size="small" color="#fff" />
//               ) : (
//                 <Text className="text-white font-semibold text-center">
//                   Use Photo
//                 </Text>
//               )}
//             </TouchableOpacity>
//           </View>
//         </>
//       ) : (
//         <>
//           <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
//           <View className="bg-[#1D2733] py-12 flex flex-col items-center justify-center">
//             <Text className="text-2xl text-white text-center mb-2 font-normal">
//               Upload Live Pictures
//             </Text>
//             <Text className="text-center text-xs text-gray px-14">
//               Upload 6-8 pictures plus 1 picture or video has to be taken on the
//               app with date stamp
//             </Text>
//           </View>
//           <CameraView className="flex-1" facing={facing} ref={cameraRef}>
//             <View className="h-[62vh] flex-1 bg-transparent"></View>
//           </CameraView>
//           <View className="bg-[#1D2733] py-12 flex flex-row items-center justify-between px-8">
//             <TouchableOpacity
//               className="w-14 h-14 rounded-full bg-black/30 items-center justify-center"
//               onPress={toggleCameraFacing}
//             >
//               <Image source={icons.flip} className="w-8 h-8" />
//               {/* <Ionicons name="camera-reverse" size={28} color="white" /> */}
//             </TouchableOpacity>
//             <TouchableOpacity
//               className="w-20 h-20 rounded-full border-4 border-white items-center justify-center"
//               onPress={takePicture}
//             >
//               <View className="w-16 h-16 rounded-full bg-white opacity-90"></View>
//             </TouchableOpacity>
//             <View className="w-14 h-14" />
//           </View>
//         </>
//       )}
//     </View>
//   );
// };

// export default TakePhoto;





// import { CommonFileUpload } from "@/lib/api";
// import { signupProps } from "@/types";
// import { CameraRoll } from "@react-native-camera-roll/camera-roll";
// import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
// import * as ImagePicker from "expo-image-picker";
// import React, { useRef, useState } from "react";
// import {
//   ActivityIndicator,
//   Alert,
//   Dimensions,
//   Image,
//   PermissionsAndroid,
//   Platform,
//   ScrollView,
//   StatusBar,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View
// } from "react-native";
// const { height, width } = Dimensions.get('window');

// const TakePhoto = ({ data, updateData, onNext, error }: signupProps) => {
//   const [facing, setFacing] = useState<CameraType>("front");
//   const [permission, requestPermission] = useCameraPermissions();
//   const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
//   const cameraRef = useRef<CameraView>(null);
//   const [loading, setLoading] = useState(false);
//   const [modalVisible, setModalVisible] = useState(false);
//   const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
//   const [cameraReady, setCameraReady] = useState(false);
//   const [images, setImages] = useState<string[]>([]);

//   const openModal = (uri: string) => {
//     setSelectedPhoto(uri);
//     setModalVisible(true);
//   };

//   const closeModal = () => {
//     setModalVisible(false);
//     setSelectedPhoto(null);
//   };

//   if (!permission) {
//     return (
//       <View className="flex-1 items-center justify-center">
//         <Text>Loading...</Text>
//       </View>
//     );
//   }

//   if (!permission.granted) {
//     return (
//       <>
//         <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
//         <View className="bg-[#1D2733] py-12 flex flex-col items-center justify-center">
//           <Text className="text-2xl text-white text-center mb-2 font-normal">
//             Upload Live Pictures
//           </Text>
//           <Text className="text-center text-xs text-gray px-14">
//             Upload 6-8 pictures plus 1 picture or video has to be taken on the
//             app with date stamp
//           </Text>
//         </View>
//         <View className="flex-1 h-[62vh] items-center justify-center">
//           <Text className="text-center text-lg mb-6">
//             We need your permission to use the camera
//           </Text>
//           <TouchableOpacity
//             onPress={requestPermission}
//             className="bg-primary px-6 py-3 rounded-lg"
//           >
//             <Text className="text-white text-center font-medium">
//               Grant Permission
//             </Text>
//           </TouchableOpacity>
//         </View>
//         <View className="bg-[#1D2733] h-[18vh] py-12 flex flex-row items-center justify-between gap-4 px-8"></View>
//       </>
//     );
//   }

//   const toggleCameraFacing = () => {
//     setFacing((current) => (current === "back" ? "front" : "back"));
//   };

//   const requestGalleryPermission = async () => {
//     if (Platform.OS === "android") {
//       const granted = await PermissionsAndroid.request(
//         PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
//         {
//           title: "Storage Permission",
//           message: "App needs access to your storage to save photos",
//           buttonNeutral: "Ask Me Later",
//           buttonNegative: "Cancel",
//           buttonPositive: "OK",
//         }
//       );
//       return granted === PermissionsAndroid.RESULTS.GRANTED;
//     }
//     return true; // iOS handles via Info.plist automatically
//   };

//   const takePhoto = async () => {
//     // CAMERA PERMISSION
//     const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
//     if (cameraPermission.status !== "granted") {
//       alert("Camera permission required!");
//       return;
//     }

//     // ANDROID 13+ MEDIA PERMISSION
//     const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
//     if (mediaPermission.status !== "granted") {
//       alert("Storage permission required!");
//       return;
//     }

//     // OPEN CAMERA
//     const result = await ImagePicker.launchCameraAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.Images,
//       quality: 1,
//     });

//     if (!result.canceled) {
//       const uri = result.assets[0].uri;
//       setImages((prev) => [...prev, uri]);
//     }
//   };

//   const takePicture = async () => {
//     if (!cameraRef.current) return;

//     try {
//       const photo = await cameraRef.current.takePictureAsync();

//       if (!photo?.uri) {
//         console.log("Photo URI is missing");
//         return;
//       }

//       // Add to capturedPhotos immediately
//       // setCapturedPhotos((prev) => [...prev, photo.uri]);
//       setCapturedPhotos((prev) => {
//         console.log("Adding photo:", photo.uri);
//         return [...prev, photo.uri];
//       });

//       // Open the photo in modal if you want
//       openModal(photo.uri);

//       // Save to gallery (do not block state update)
//       requestGalleryPermission().then((hasPermission) => {
//         if (hasPermission) {
//           CameraRoll.save(photo.uri, { type: "photo" }).catch((err) =>
//             console.warn("Failed to save photo to gallery:", err)
//           );
//         }
//       });
//     } catch (error) {
//       console.error("Failed to take picture:", error);
//       Alert.alert("Error", "Failed to take picture. Please try again.");
//     }
//   };

//   // const takePicture = async () => {
//   //   if (cameraRef.current) {
//   //     try {
//   //       const photo = await cameraRef?.current?.takePictureAsync();
//   //       setCapturedPhotos((prev) => [...prev, photo.uri]);
//   //       const hasPermission = await requestGalleryPermission();
//   //         if (hasPermission) {
//   //           await CameraRoll.save(photo.uri, { type: "photo" });
//   //         } else {
//   //           console.warn("Gallery permission denied");
//   //         }

//   //     } catch (error) {
//   //       console.error("Failed to take picture:", error);
//   //     }
//   //   }
//   // };

//   const removePhoto = (uri: string) => {
//     setCapturedPhotos((prev) => prev.filter((p) => p !== uri));
//   };

//   const handleSavePhotos = async () => {
//     if (images.length === 0) {
//       // if (capturedPhotos.length === 0) {
//       Alert.alert("No photos", "Please take at least one photo.");
//       return;
//     }

//     setLoading(true);

//     try {
//       const uploadedNames: string[] = [];

//       for (const uri of images) {
//         // for (const uri of capturedPhotos) {
//         const fileName = uri.split("/").pop();
//         const formData = new FormData();
//         formData.append("uploadattachments[]", {
//           uri,
//           name: fileName,
//           type: "image/jpeg",
//         } as any);

//         const res = await CommonFileUpload(formData);

//         if (res && res?.name) {
//           uploadedNames.push(res.name);
//         } else {
//           console.error("Upload failed for:", uri, res);
//         }
//       }

//       if (uploadedNames.length > 0) {
//         // Join uploaded image names as comma-separated string
//         updateData({ livePicture: uploadedNames.join(",") });
//         onNext();
//       } else {
//         Alert.alert(
//           "Upload Failed",
//           "There was an issue uploading your photos. Please try again."
//         );
//       }
//     } catch (error) {
//       console.error("Failed to upload photos:", error);
//       Alert.alert(
//         "Upload Failed",
//         "There was an issue uploading your photos. Please try again."
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <View className="flex-1 bg-black">
//       <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

//       {modalVisible && selectedPhoto && (
//         <View className="absolute top-0 left-0 right-0 bottom-0 bg-white/100 z-30 items-center justify-center">
//           <Image
//             source={{ uri: selectedPhoto }}
//             className="w-full h-full"
//             resizeMode="contain"
//           />
//           <TouchableOpacity
//             className="absolute top-12 right-6 w-10 h-10 bg-black/50 rounded-full items-center justify-center"
//             onPress={closeModal}
//           >
//             <Text className="text-white text-xl font-bold">✕</Text>
//           </TouchableOpacity>
//         </View>
//       )}


//       {/* Header */}
//       <View className="bg-[#1D2733] py-12 flex flex-col items-center justify-center">
//         <Text className="text-2xl text-white text-center mb-2 font-normal">
//           Upload Live Pictures
//         </Text>
//         <Text className="text-center text-xs text-gray px-14">
//           Upload 6-8 pictures plus 1 picture or video has to be taken on the
//           app with date stamp
//         </Text>
//       </View>

//       {/* Camera / Preview */}
//       {/* <CameraView className="flex-1" facing={facing} ref={cameraRef} > 
//         <View className="flex-1 bg-transparent" style={{height: height * 0.8}}></View>
//       </CameraView> */}


//       {/* Preview Thumbnails */}
//       <Text style={styles.heading}>Saved Photos</Text>

//           <ScrollView contentContainerStyle={styles.grid}>
//             {images.map((img, index) => (
//               <View key={index} style={styles.card}>
//                 <Image source={{ uri: img }} style={styles.photo} />
//                 <Text style={styles.label}>Photo {index + 1}</Text>
//               </View>
//             ))}
//           </ScrollView>
//       {/* {capturedPhotos.length > 0 && (
//         <View className="absolute top-44 w-full">
//           <FlatList
//             horizontal
//             data={capturedPhotos}
//             keyExtractor={(item) => item}
//             contentContainerStyle={{ paddingHorizontal: 10 }}
//             renderItem={({ item }) => (
//               <View className="relative mr-4">
//                 <TouchableOpacity onPress={() => openModal(item)}>
//                   <Image
//                     source={{ uri: item }}
//                     className="w-20 h-20 rounded-lg"
//                     resizeMode="cover"
//                   />
//                 </TouchableOpacity>
//                 <TouchableOpacity
//                   className="absolute top-0 right-0 w-6 h-6 bg-red-500 rounded-full items-center justify-center"
//                   onPress={() => removePhoto(item)}
//                 >
//                   <Text className="text-white text-xs font-bold">X</Text>
//                 </TouchableOpacity>
//               </View>
//             )}
//           />
//         </View>
//       )} */}


//       {/* Bottom Buttons */}
//       <View className="absolute bottom-0 left-0 right-0 bg-[#1D2733] h-[18vh] py-12 flex flex-row items-center justify-between px-8">
//         {/* Flip Camera */}
//         {/* <TouchableOpacity
//           className="w-14 h-14 rounded-full bg-black/30 items-center justify-center"
//           onPress={toggleCameraFacing}
//         >
//           <Image source={icons.flip} className="w-8 h-8" />
//         </TouchableOpacity> */}

//         {/* Take Picture */}
//         {/* <TouchableOpacity
//           className="w-20 h-20 rounded-full border-4 border-white items-center justify-center"
//           onPress={takePicture}
//           disabled={!cameraReady}
//         >
//           <View className="w-16 h-16 rounded-full bg-white opacity-90"></View>
//         </TouchableOpacity> */}

//        <TouchableOpacity
//           onPress={takePhoto}
//           className="w-24 h-12 bg-primary rounded-full items-center justify-center"
//         >
//            <Text className="text-white font-semibold text-center">
//               📸 Take Photo
//             </Text>
//         </TouchableOpacity>

//         {/* Use Photos */}
//         <TouchableOpacity
//           onPress={handleSavePhotos}
//           className="w-24 h-12 bg-primary rounded-full items-center justify-center"
//         >
//           {loading ? (
//             <ActivityIndicator size="small" color="#fff" />
//           ) : (
//             <Text className="text-white font-semibold text-center">
//               Upload
//             </Text>
//           )}
//         </TouchableOpacity>
//       </View>

//     </View>
//   );
// };


// const styles = StyleSheet.create({
//   container: { flex: 1, padding: 20, backgroundColor: "#F5F7FA" },

//   captureBtn: {
//     backgroundColor: "#0066FF",
//     paddingVertical: 14,
//     borderRadius: 12,
//     alignItems: "center",
//     marginBottom: 10,
//   },

//   captureText: {
//     fontSize: 16,
//     color: "#fff",
//     fontWeight: "bold",
//   },

//   heading: {
//     marginTop: 10,
//     fontSize: 20,
//     fontWeight: "bold",
//     marginBottom: 15,
//     color: "#333",
//   },

//   grid: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//   },

//   card: {
//     width: "46%",
//     margin: "2%",
//     backgroundColor: "#fff",
//     borderRadius: 12,
//     padding: 8,
//     alignItems: "center",
//     elevation: 4,
//   },

//   photo: {
//     width: "100%",
//     height: 150,
//     borderRadius: 10,
//   },

//   label: {
//     marginTop: 6,
//     fontSize: 12,
//     color: "#444",
//     fontWeight: "600",
//   },
// });
// export default TakePhoto;


import { CommonFileUpload } from "@/lib/api";
import { signupProps } from "@/types";
import { CameraRoll } from "@react-native-camera-roll/camera-roll";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  PermissionsAndroid,
  Platform,
  PlatformColor,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { moderateScale, scale, verticalScale } from "react-native-size-matters";
import { useDeviceSize } from "@/hooks/useResponsive";
import { useThemeColors } from "@/context/ThemeContext";
import GradientButton from "../ui/GradientButton";
import { PlatformIcon } from "@/components/ui/PlatformIcon";

const TakePhoto = ({ data, updateData, onNext, error }: signupProps) => {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { gridColumns } = useDeviceSize();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = useThemeColors();

  const themedColors = {
    text: Platform.OS === 'ios' ? (PlatformColor('label') as unknown as string) : colors.onSurface,
    secondaryText: Platform.OS === 'ios' ? (PlatformColor('secondaryLabel') as unknown as string) : colors.onSurfaceVariant,
    placeholder: isDark ? '#9CA3AF' : '#B0B0B0',
  };
  
  // Calculate card width responsively based on grid columns
  const cardWidth = useMemo(
    () => (screenWidth - scale(48) - scale(12) * (gridColumns - 1)) / gridColumns, 
    [screenWidth, gridColumns]
  );
  
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);


  const requestGalleryPermission = async () => {
    if (Platform.OS === "android") {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: "Storage Permission",
          message: "App needs access to your storage to save photos",
          buttonPositive: "OK",
          buttonNegative: "Cancel",
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  const takePhoto = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    if (cameraPermission.status !== "granted") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      alert("Camera permission required!");
      return;
    }

    const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (mediaPermission.status !== "granted") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      alert("Storage permission required!");
      return;
    }

    // ✅ Permission granted
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setHasPermission(true);

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      cameraType: ImagePicker.CameraType.front
    });

    if (!result.canceled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const uri = result.assets[0].uri;
      setImages((prev) => [...prev, uri]);

      requestGalleryPermission().then((hasPermission) => {
        if (hasPermission) {
          CameraRoll.save(uri, { type: "photo" }).catch((err) =>
            console.warn("Failed to save photo:", err)
          );
        }
      });
    }
  };

  const handleSavePhotos = async () => {
  if (images.length === 0) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert("No photos", "Please take at least one photo.");
    return;
  }

  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  setLoading(true);

  try {
    const uploadedNames: string[] = [];

    const supportedExtensions = ["jpg", "jpeg", "png", "heic", "heif", "webp"];

    const mimeMap: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      heic: "image/heic",
      heif: "image/heif",
      webp: "image/webp",
    };

    for (const uri of images) {
      const fileName = uri.split("/").pop() || "image";
      const ext = fileName.split(".").pop()?.toLowerCase();

      if (!ext || !supportedExtensions.includes(ext)) {
        continue; // skip invalid image
      }

      const formData = new FormData();
      formData.append("uploadattachments[]", {
        uri,
        name: fileName,
        type: mimeMap[ext],
      } as any);

      const res = await CommonFileUpload(formData);

      if (res?.name) {
        uploadedNames.push(res.name.replace("uploads/", ""));
      }
    }

    if (uploadedNames.length > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      updateData({ livePicture: uploadedNames.join(",") });
      onNext();
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Upload Failed", "Please try again.");
    }
  } catch (error) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    console.error("Multiple upload error:", error);
    Alert.alert("Upload Failed", "Please try again.");
  } finally {
    setLoading(false);
  }
};


  // const handleSavePhotos = async () => {
  //   if (images.length === 0) {
  //     Alert.alert("No photos", "Please take at least one photo.");
  //     return;
  //   }

  //   setLoading(true);

  //   try {
  //     const uploadedNames: string[] = [];

  //     for (const uri of images) {
  //       const fileName = uri.split("/").pop();
  //       const formData = new FormData();

  //       formData.append("uploadattachments[]", {
  //         uri,
  //         name: fileName,
  //         type: "image/jpeg",
  //       } as any);

  //       const res = await CommonFileUpload(formData);
  //       if (res?.name) uploadedNames.push(res.name);
  //     }

  //     if (uploadedNames.length > 0) {
  //       updateData({ livePicture: uploadedNames.join(",") });
  //       onNext();
  //     } else {
  //       Alert.alert("Upload Failed", "Please try again.");
  //     }
  //   } catch (err) {
  //     Alert.alert("Upload Failed", "Please try again.");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const deleteImage = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <SafeAreaView style={[styles.safeArea]}>

      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Upload Live Pictures</Text>
          <Text style={styles.headerSubtitle}>
            Upload 6-8 pictures plus 1 picture or video has to be taken on the app
            with date stamp
          </Text>
        </View>

        {/* CONTENT */}
        <View style={styles.content}>
          {images.length > 0 && <Text style={[styles.heading, { color: themedColors.text }]}>Saved Photos</Text>}
          {images.length === 0 ? (
            <View style={styles.emptyPlaceholder}>
              <Text style={styles.emptyText}>Please add your pictures by clicking the button below</Text>
               <GradientButton
                  onPress={takePhoto}
                  containerStyle={{
                    marginVertical: 40,
                    width: "50%",
                    marginHorizontal: "auto",
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {hasPermission && <PlatformIcon name="camera-alt" size={18} color="#fff" />}
                    <Text style={{ color: '#fff', fontWeight: '600' }}>
                      {hasPermission ? "Take Photo" : "Grant Permission"}
                    </Text>
                  </View>
                </GradientButton>
            </View>
          ) : (
            <FlatList
              key={`photos-${gridColumns}`}
              data={images}
              numColumns={gridColumns}
              keyExtractor={(item, index) => index.toString()}
              columnWrapperStyle={{ justifyContent: "space-between" }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: verticalScale(70) }}
              renderItem={({ item, index }) => (
                <View style={[styles.card, { width: cardWidth }]}>
                  <Image source={{ uri: item }} style={styles.photo} />

                  {/* Delete Button */}
                  <TouchableOpacity
                    style={styles.deleteIcon}
                    onPress={() => deleteImage(index)}
                  >
                    <PlatformIcon name="close" size={14} color="#fff" />
                  </TouchableOpacity>

                  {/* <Text style={styles.label}>Photo {index + 1}</Text> */}
                </View>
              )}
            />
          )}
        </View>
      </View>
      {/* FOOTER */}
      {images.length > 0 && (
          <View
            style={[
              styles.footer,
              { paddingBottom: insets.bottom + verticalScale(12) },
            ]}
          >
            {/* Take Photo Button */}
            <GradientButton
              onPress={takePhoto}
              containerStyle={{
                paddingHorizontal: 20,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <PlatformIcon name="camera-alt" size={18} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '600' }}>Take Photo</Text>
              </View>
            </GradientButton>

            {/* Upload Button */}
            <GradientButton
              onPress={handleSavePhotos}
              containerStyle={{
                paddingHorizontal: 40
              }}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.actionButtonText}>
                  Upload
                </Text>
              )}
            </GradientButton>
          </View>
        )}

      {/* {images.length > 0 &&
        <View style={[styles.footer, { paddingBottom: insets.bottom + verticalScale(12) }]}>
          <TouchableOpacity onPress={takePhoto} style={styles.actionButton}>
            <Text style={styles.actionButtonText}>📸 Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSavePhotos} style={styles.actionButton}>
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.actionButtonText}>Upload</Text>
            )}
          </TouchableOpacity>
        </View>
      } */}
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#1D2733",
  },

  container: {
    flex: 1,
    justifyContent: "space-between",
    backgroundColor: "#FFFAF2",
  },

  /* HEADER */
  header: {
    backgroundColor: "#1D2733",
    paddingVertical: verticalScale(30),
    paddingHorizontal: scale(16),
  },
  headerTitle: {
    fontSize: moderateScale(22),
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: verticalScale(6),
    fontWeight: "600",
  },
  headerSubtitle: {
    fontSize: moderateScale(12),
    color: "#D1D5DB",
    textAlign: "center",
  },

  /* CONTENT */
  content: {
    flex: 1,
    paddingHorizontal: scale(16),
  },
  heading: {
    marginTop: verticalScale(10),
    fontSize: moderateScale(20),
    fontWeight: "bold",
    marginBottom: verticalScale(12),
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  card: {
    // width set dynamically via inline style for responsive layouts
    marginBottom: verticalScale(15),
    backgroundColor: "#fff",
    borderRadius: moderateScale(12),
    padding: scale(8),
    elevation: 4,
  },

  photo: {
    width: "100%",
    aspectRatio: 3 / 3,
    borderRadius: moderateScale(10),
  },

  label: {
    marginTop: verticalScale(6),
    fontSize: moderateScale(12),
    color: "#000",
    fontWeight: "600",
    textAlign: "center",
  },

  /* EMPTY */
  emptyPlaceholder: {
    height: verticalScale(300),
    justifyContent: "center",
  },
  emptyText: {
    color: "#aaa",
    fontSize: moderateScale(14),
    textAlign: "center",
    marginHorizontal: 60
  },

  /* FOOTER */
  footer: {
    backgroundColor: "#1D2733",
    paddingHorizontal: scale(32),
    paddingVertical: verticalScale(16),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: 'center',
    position: "absolute",       // ✅ keeps it at the bottom
    bottom: 0,
    left: 0,
    right: 0,
  },

  actionButton: {
    width: scale(120),
    height: verticalScale(40),
    backgroundColor: "#F99F2D",
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },

  actionButtonText: {
    color: "#FFFFFF",
    fontSize: moderateScale(14),
    fontWeight: "600",
  },
  deleteIcon: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.6)",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },

});

export default TakePhoto;
