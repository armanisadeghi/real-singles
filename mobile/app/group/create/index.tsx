import { styles } from "@/components/forms/ContactForm";
import LinearBg from "@/components/LinearBg";
import NotificationBell from "@/components/NotificationBell";
import GradientButton from "@/components/ui/GradientButton";
import { icons } from "@/constants/icons";
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, Image, Platform, Text, TextInput, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";

export const Label = ({ text, marginLeft }: { text: string, marginLeft?: string }) => (
  <Text
    className={`text-[12px] text-gray font-normal mb-1 ${marginLeft ? `ml-${marginLeft}` : ""}`}
    style={{ fontFamily: "SF Pro Display" }}
  >
    {text}
  </Text>
);

export default function CreateGroup() {
  const router = useRouter();
  const [data, setData] = useState({
    GroupName: "",
    GroupImage: "",
  });
  const [localImage, setLocalImage] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const pickImage = async () => {
    console.log("Picking image...");

    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Sorry, we need camera roll permissions to upload images."
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Update form with local URI for preview
        //   updateFormData("imageUri", result.assets[0].uri);
        setLocalImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  // Function to upload the selected image
  const uploadImage = async () => {
    if (!localImage) return;

    setIsUploading(true);

    try {
      const formData = new FormData();

      const uriParts = localImage.split('.');
      const fileExtension = uriParts[uriParts.length - 1]; // e.g., 'jpg' ya 'png'

      const finalUri = Platform.OS === 'android' ? localImage : localImage.replace('file://', '');

      formData.append("uploadattachments[]", {
        uri: finalUri,
        name: `group_image.${fileExtension}`, // Dynamic name
        type: `image/${fileExtension === 'png' ? 'png' : 'jpeg'}`, // Dynamic type
      } as any);
      console.log("formData=>>>>", JSON.stringify(formData));


      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
      const response = await fetch(
        `${apiUrl}/upload`,
        {
          method: "POST",
          body: formData,
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      // Pehle text check karein console mein debugging ke liye
      const responseText = await response.text();
      console.log("RAW RESPONSE:", responseText);

      const res = JSON.parse(responseText);

      if (res?.success) {
        setData(prev => ({ ...prev, GroupImage: res.name }));
        Toast.show({
          type: "success",
          text1: "Image Uploaded",
          position: "bottom",
        });
      } else {
        throw new Error(res?.msg || "Upload failed");
      }

    } catch (error: any) {
      console.error("Upload error detail:", error);
      Toast.show({
        type: "error",
        text1: "Upload Failed",
        text2: error.message || "Network request failed",
        position: "bottom",
      });
    } finally {
      setIsUploading(false);
    }
  };



  const navigateToAddMembers = () => {
    console.log("data.GroupImage", data.GroupImage);

    if (!data.GroupName.trim()) {
      Toast.show({
        type: 'warning',
        text1: 'Group Name Required',
        text2: 'Please enter a name for your group.',
        position: 'bottom',
        visibilityTime: 2000,
      });
      return;
    }

    router.push({
      pathname: '/group/addmember',
      params: {
        GroupName: data.GroupName,
        GroupImage: data.GroupImage,
      }
    });
  };

  return (
    <View className="flex-1 bg-background">
      <Toast />
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
            onPress={() => router.back()}
            className="border border-gray rounded-lg flex justify-center items-center w-8 h-8"
          >
            <Image
              source={icons.back}
              className="size-4"
              resizeMode="contain"
            />
          </TouchableOpacity>
          <Text className="leading-[22px] text-dark text-base font-medium tracking-[-0.41px]">
            Create Group
          </Text>
        </View>

        <NotificationBell />
      </View>
      <View
        className="bg-white rounded-[22px] px-[22px] py-[30px] flex-col mb-5 mt-16 mx-6"
        style={styles.shadow}
      >
        <View className="flex-row items-start justify-between mb-8">
          {/* Image selector with upload button */}
          <View className="flex items-center">
            <TouchableOpacity
              onPress={pickImage}
              className="relative w-32 h-32 flex justify-center items-center rounded-full overflow-hidden"
              style={{ backgroundColor: localImage ? 'transparent' : '#E5E5E5' }}
            >
              {localImage ? (
                <Image
                  source={{ uri: localImage }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <Image
                  source={icons.cam}
                  className="w-12 h-12"
                  resizeMode="contain"
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={uploadImage}
              className="mt-3 bg-[#F5F5F5] px-4 py-2 rounded-full"
              disabled={isUploading || !localImage}
            >
              {isUploading ? (
                <ActivityIndicator size="small" color="#B06D1E" />
              ) : (
                <Text className="text-primary font-medium">
                  {data.GroupImage ? "Change Image" : "Upload Image"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View>
          <Label text="Group Name" />
          <TextInput
            placeholder="e.g, Blind Dating"
            placeholderTextColor={"#A0A0A0"}
            className="border-b border-border py-[12px] text-xl text-dark font-medium mb-6"
            value={data.GroupName}
            onChangeText={(text) => setData({ ...data, GroupName: text })}
          />
        </View>
      </View>

      {/* Next button - circular with LinearGradient */}
      {data.GroupName.trim().length > 0 && (
        <View className="">
          {Platform.OS == 'ios' ?
            <GradientButton
              text="Next"
              onPress={navigateToAddMembers}
              containerStyle={{
                width: "90%",
                marginHorizontal: "auto",
              }}
            /> :
            <TouchableOpacity
              onPress={navigateToAddMembers}
              className="border border-[#C07618] rounded-full overflow-hidden bg-primary mx-6"
            >
              <LinearBg className="w-full py-3 flex-row justify-center gap-4 items-center">
                <Text className="text-white text-lg font-semibold">Next</Text>
                <Image
                  source={icons.back}
                  className="rotate-180"
                  resizeMode="contain"
                  style={{ tintColor: '#FFFFFF' }}
                />
              </LinearBg>
            </TouchableOpacity>
          }
        </View>
      )}
    </View>
  );
}