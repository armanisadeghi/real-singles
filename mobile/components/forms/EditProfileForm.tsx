import { Label, styles } from "@/components/forms/ContactForm";
import { icons } from "@/constants/icons";
import {
  bodyTypeOptions,
  drinkingOption,
  educationOptions,
  ethinicityOptions,
  haveChildrenOptions,
  interestOptions,
  languageOptions,
  marijuanOption,
  maritalOptions,
  petsOptions,
  politicalViewOptions,
  religionOptions,
  smokeOptions
} from "@/constants/utils";
import { changePassword, CommonFileUpload } from "@/lib/api";
import { EditProfileFormData } from "@/types";
import { IMAGE_URL, VIDEO_URL } from "@/utils/token";
import DateTimePicker from "@react-native-community/datetimepicker";
import Slider from "@react-native-community/slider";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import RNPickerSelect from "react-native-picker-select";
import Toast from "react-native-toast-message";
import LinearBg from "../LinearBg";

const FS = FileSystem as unknown as {
  cacheDirectory: string;
  documentDirectory: string;
  copyAsync: typeof FileSystem.copyAsync;
};


if (Platform.OS === "android") {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

interface ProfileFormViewProps {
  formData: EditProfileFormData;
  onChangeField: (field: string, value: any) => void;
}

const EditProfileForm = ({ formData, onChangeField }: ProfileFormViewProps) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPersonalDetails, setShowPersonalDetails] = useState(false);
  const [pickInterest, setPickInterest] = useState(false);
  const [educationJobDetail, setEducationJobDetail] = useState(false);
  const [appearance, setAppearance] = useState(false);
  const [habit, setShowHabit] = useState(false);
  const [ethinicity, setEthinicity] = useState(false);
  const [language, setLanguage] = useState(false);
  const [religion, setReligion] = useState(false);
  const [political, setPolitical] = useState(false);
  const [fewWords, setFewWords] = useState(false);
  const [imageUri, setImageUri] = useState("");
  const [uploading, setUploading] = useState(false);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Custom animation config
    const animationConfig = {
      duration: 300,
      update: {
        duration: 300,
        property: LayoutAnimation.Properties.opacity,
        type: LayoutAnimation.Types.easeInEaseOut,
      },
      delete: {
        duration: 200,
        property: LayoutAnimation.Properties.opacity,
        type: LayoutAnimation.Types.easeInEaseOut,
      },
    };
    Animated.timing(rotateAnim, {
      toValue: showPersonalDetails ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Animate height/layout
    LayoutAnimation.configureNext(animationConfig);
  }, [showPersonalDetails]);

  const arrowRotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["180deg", "90deg"],
  });

  const pickerSelectStyles = {
    inputIOS: {
      fontSize: 16,
      paddingVertical: 14,
      paddingHorizontal: 28,
      borderWidth: 1,
      borderColor: "#E5E5E5", // gray border
      borderRadius: 30,
      backgroundColor: "#F5F5F5", // light background
      color: "#333333",
      paddingRight: 30, // to ensure the text is never behind the icon
      marginBottom: 10,
    },
    inputAndroid: {
      fontSize: 16,
      paddingHorizontal: 28,
      paddingVertical: 14,
      borderWidth: 1,
      borderColor: "#E5E5E5", // gray border
      borderRadius: 99,
      backgroundColor: "#F9F9FC", // light background
      color: "#333333",
      paddingRight: 30, // to ensure the text is never behind the icon
      marginBottom: 10,
    },
    placeholder: {
      color: "#9E9E9E",
    },
    iconContainer: {
      top: 16,
      right: 12,
    },
  };

  const toggleInterest = (interestValue: string) => {
    const currentInterests = formData.Interest
      ? formData.Interest.split(",")
      : [];
    const isSelected = currentInterests.includes(interestValue);

    let newInterests;
    if (isSelected) {
      // Remove the interest
      newInterests = currentInterests.filter(
        (interest) => interest !== interestValue
      );
    } else {
      // Add the interest
      newInterests = [...currentInterests, interestValue];
    }

    // Convert back to comma-separated string and update formData
    onChangeField("Interest", newInterests.join(","));
  };

  const pickImage = async () => {

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
        quality: 0.5,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
        uploadImage(result.assets[0].uri)
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };






  const uploadImage = async (imageUri: string) => {
    setUploading(true);

    try {
      const fileName = imageUri.split("/").pop() || "image";
      const ext = fileName.split(".").pop()?.toLowerCase();

      // Supported formats
      const supportedExtensions = ["jpg", "jpeg", "png", "heic", "heif", "webp"];

      if (!ext || !supportedExtensions.includes(ext)) {
        Alert.alert(
          "Invalid Image Format",
          "Only JPG, JPEG, PNG, HEIC, HEIF or WEBP formats are allowed."
        );
        setUploading(false);
        return;
      }

      // Map extension to correct MIME type
      const mimeMap: Record<string, string> = {
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        heic: "image/heic",
        heif: "image/heif",
        webp: "image/webp",
      };

      const fileType = mimeMap[ext] || "image/jpeg";

      const imageFormData = new FormData();
      imageFormData.append("uploadattachments[]", {
        uri: imageUri,
        name: fileName,
        type: fileType,
      } as any);

      const response = await CommonFileUpload(imageFormData);

      console.log("Image upload response:", response);

      if (response && response?.name) {
        const cleanName = response.name.replace("uploads/", "");

        onChangeField("Image", cleanName);
        setImageUri("");

        Toast.show({
          type: "success",
          text1: "Image uploaded successfully",
          position: "bottom",
          visibilityTime: 2000,
          bottomOffset: 100,
        });
      } else {
        Toast.show({
          type: "error",
          text1: response?.msg || "Image upload failed",
          position: "bottom",
          visibilityTime: 2000,
          bottomOffset: 100,
        });
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      Toast.show({
        type: "error",
        text1: "Failed to upload image",
        position: "bottom",
        visibilityTime: 2000,
        bottomOffset: 100,
      });
    } finally {
      setUploading(false);
    }
  };


  

  const formatDateToMMDDYYYY = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // fallback if invalid
    return `${(date.getMonth() + 1).toString().padStart(2, "0")}/${date
      .getDate()
      .toString()
      .padStart(2, "0")}/${date.getFullYear()}`;
  };


  const handleChangePassword = async () => {
    setPasswordError("");
    // Validate passwords
    if (!passwordData.oldPassword) {
      setPasswordError("Current password is required");
      return;
    }
    if (!passwordData.newPassword) {
      setPasswordError("New password is required");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New passwords don't match");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }

    // Simulate API call
    setChangingPassword(true);
    try {
      const data = new FormData();
      data.append("OldPassword", passwordData.oldPassword);
      data.append("NewPassword", passwordData.newPassword);
      data.append("ConfirmPassword", passwordData.confirmPassword);
      const res = await changePassword(data);
      console.log("Change password response:", res);

      if (res?.success) {
        Toast.show({
          type: "success",
          text1: res?.msg || "Password changed successfully",
          position: "bottom",
          visibilityTime: 2000,
          bottomOffset: 100,
          autoHide: true,
        });
        setShowPasswordModal(false);
        setPasswordData({
          oldPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        Toast.show({
          type: "error",
          text1: res?.msg || "Failed to change password",
          position: "bottom",
          visibilityTime: 2000,
          bottomOffset: 100,
          autoHide: true,
        });
        console.log("Change password error:", res);

      }
    } catch (error) {
      console.error("Error changing password:", error);
      Toast.show({
        type: "error",
        text1: "Failed to change password",
        position: "bottom",
        visibilityTime: 2000,
        bottomOffset: 100,
        autoHide: true,
      });

    }
  };

  const getImage = () => {
    if (imageUri) {
      return { uri: imageUri };
    }
    else if (formData?.Image) {
      return { uri: VIDEO_URL + formData.Image };
    }
    else if (formData?.livePicture) {
      const imageLive = formData.livePicture.split(",")[0].trim();
      console.log("imageLive in getImage:", imageLive);

      return { uri: IMAGE_URL + imageLive };
    } else {
      return icons.ic_user
    }
  }

  const toggleEthnicity = (ethValue: string) => {
    const currentEths = formData.Ethniticity
      ? formData.Ethniticity.split(",").map((e) => e.trim())
      : [];
    const isSelected = currentEths.includes(ethValue);
    console.log("isSelected in toggleEthnicity==>>>>", isSelected);


    let newEths;
    if (isSelected) {
      // Remove ethnicity
      newEths = currentEths.filter((e) => e !== ethValue);
    } else {
      // Add ethnicity
      newEths = [...currentEths, ethValue];
    }

    // Update formData as a comma-separated string
    onChangeField("Ethniticity", newEths.join(", "));
  };

  const toggleBodyType = (bodyValue: string) => {
    const currentBodyTypes = formData.BodyType
      ? formData.BodyType.split(",").map((e) => e.trim())
      : [];
    const isSelected = currentBodyTypes.includes(bodyValue);

    let newBodyTypes;
    if (isSelected) {
      // Remove body type
      newBodyTypes = currentBodyTypes.filter((e) => e !== bodyValue);
    } else {
      // Add body type
      newBodyTypes = [...currentBodyTypes, bodyValue];
    }

    // Update formData as a comma-separated string
    onChangeField("BodyType", newBodyTypes.join(", "));
  };

  const toggleLanguage = (value: string) => {
    let selected = formData?.Language
      ? formData.Language.split(",").map((l) => l.trim())
      : [];

    const isSelected = selected.includes(value);

    if (isSelected) {
      selected = selected.filter((item) => item !== value);
    } else {
      selected.push(value);
    }

    onChangeField("Language", selected.join(", "));
  };

  const toggleReligion = (value: string) => {
    let selected = formData?.Religion
      ? formData.Religion.split(",").map((l) => l.trim())
      : [];

    const isSelected = selected.includes(value);

    if (isSelected) {
      selected = selected.filter((item) => item !== value);
    } else {
      selected.push(value);
    }

    onChangeField("Religion", selected.join(", "));
  };


  // if (uploading) return (
  //   <View className="flex-row items-center">
  //     <ActivityIndicator size="small" color="#ffffff" />
  //   </View>
  // )



  return (
    <>
      <View
        className="bg-white w-full rounded-[22px] px-[22px] py-[30px] flex-col gap-5 mb-5"
        style={styles.shadow}
      >
        <View className="flex-row items-start justify-between">
          <View>
            <View className="relative w-32 h-32">
              <Image
                source={getImage()}
                className="w-full h-full rounded-full mx-auto mb-4 border border-dark"
                resizeMode="cover"
              />
              <Pressable
                onPress={pickImage}
                className="absolute bottom-3 right-0 border border-dark bg-white rounded-lg p-2"
              >
                <Image
                  source={icons.edit}
                  className="w-4 h-4"
                  tintColor={"#000000"}
                />
              </Pressable>
            </View>

             {uploading && (
                <View
                  className="
                    absolute top-0 left-0 w-full h-full 
                    bg-black/60 
                    z-50 
                    flex items-center justify-center
                    rounded-2xl
                  "
                  style={{ position: "absolute" }}
                >
                  <ActivityIndicator size="large" color="#fff" />
                </View>
              )}
          </View>
          <View>
            <TouchableOpacity onPress={() => setShowPasswordModal(true)} className="bg-light-100 py-2 px-4 mt-8 rounded-3xl border border-border">
              <Text className="text-primary text-center text-base font-medium">Change Password</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* First Name and Last Name in same row */}
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Label text="First Name" />
            <TextInput
              placeholder="John"
              placeholderTextColor={"#A0A0A0"}
              className="border border-border bg-light-100 rounded-full px-[15px] py-[12px] text-black"
              value={formData.FirstName}
              onChangeText={(text) => onChangeField("FirstName", text)}
            />
          </View>

          <View className="flex-1">
            <Label text="Last Name" />
            <TextInput
              placeholder="Doe"
              placeholderTextColor={"#A0A0A0"}
              className="border border-border bg-light-100 rounded-full px-[15px] py-[12px] text-black"
              value={formData.LastName}
              onChangeText={(text) => onChangeField("LastName", text)}
            />
          </View>
        </View>

        {/* Display Name (full width) */}
        <View>
          <Label text="Display Name" />
          <TextInput
            placeholder="JohnDoe123"
            placeholderTextColor={"#A0A0A0"}
            className="border border-border bg-light-100 rounded-full px-[15px] py-[12px] text-black"
            value={formData.DisplayName}
            onChangeText={(text) => onChangeField("DisplayName", text)}
          />
        </View>

        {/* Birthday and Phone Number in same row */}
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Label text="Birthday" />
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              className="border border-border bg-light-100 rounded-full px-[15px] py-[12px] flex-row justify-between items-center"
            >
              <Text className={formData.DOB ? "text-dark" : "text-gray-400"}>
                {/* {formData.DOB || "Select Date"} */}
                {formData.DOB ? formatDateToMMDDYYYY(formData.DOB) : "Select Date"}
              </Text>
              <Image
                source={icons.calender}
                className="w-4 h-4"
                resizeMode="contain"
              />
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={formData.DOB ? new Date(formData.DOB) : new Date()}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);

                  if (selectedDate) {
                    const formattedISO = selectedDate.toISOString().split("T")[0]; // YYYY-MM-DD
                    onChangeField("DOB", formattedISO);

                  }
                }}
                maximumDate={new Date()} // Can't select future dates
              />
            )}
          </View>

          <View className="flex-1">
            <Label text="Phone Number" />
            <TextInput
              placeholder="+1 (123) 456-7890"
              placeholderTextColor={"#A0A0A0"}
              keyboardType="phone-pad"
              className="border border-border bg-light-100 rounded-full px-[15px] py-[12px] text-black"
              value={formData.Phone}
              onChangeText={(text) => onChangeField("Phone", text)}
            />
          </View>
        </View>

        {/* Zip Code and Horoscope Sign in same row */}
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Label text="Zip Code" />
            <TextInput
              placeholder="90210"
              placeholderTextColor={"#A0A0A0"}
              keyboardType="numeric"
              className="border border-border bg-light-100 rounded-full px-[15px] py-[12px] text-black"
              value={formData.Zipcode}
              onChangeText={(text) => onChangeField("Zipcode", text)}
            />
          </View>

          <View className="flex-1">
            <Label text="Horoscope Sign" />
            <TextInput
              placeholder="Leo"
              placeholderTextColor={"#A0A0A0"}
              className="border border-border bg-light-100 rounded-full px-[15px] py-[12px] text-black"
              value={formData.HSign}
              onChangeText={(text) => onChangeField("HSign", text)}
            />
          </View>
        </View>
      </View>

      <View
        className="bg-white w-full rounded-[22px] px-[22px] py-[30px] flex-col gap-5 mb-5"
        style={styles.shadow}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setShowPersonalDetails((prev) => !prev)}
          className="flex-row items-center justify-between"
        >
          <Text className="text-primary font-medium text-lg">
            Personal Details
          </Text>
          <Animated.View style={{ transform: [{ rotate: arrowRotation }] }}>
            <Image source={icons.back} resizeMode="contain" />
          </Animated.View>
        </TouchableOpacity>

        {showPersonalDetails && (
          <Animated.View className="mt-4 gap-5">
            <View>
              <Label text="Gender" marginLeft="" />

              <RNPickerSelect
                onValueChange={(value) => onChangeField("Gender", value)}
                items={[
                  { label: "I'm a man seeking a woman", value: "man" },
                  { label: "I'm a woman seeking a man", value: "woman" },
                  { label: "I'm a man seeking a man", value: "man2" },
                  { label: "I'm a woman seeking a woman", value: "woman2" },
                ]}
                placeholder={{
                  label: "Select Gender",
                  value: null,
                  color: "#A0A0A0",
                }}
                style={pickerSelectStyles}
                value={formData.Gender} // <-- yaha actual value
                useNativeAndroidPickerStyle={false}
                Icon={() => (
                  <Image
                    source={icons.down}
                    style={{ width: 15, height: 15, marginRight: 15 }}
                    resizeMode="contain"
                  />
                )}
              />

              {/* <RNPickerSelect
                onValueChange={(value) => {
                  // Save backend-compatible value
                  let backendValue = value;

                  if (value === "Female") backendValue = "woman";
                  if (value === "Male") backendValue = "man";

                  onChangeField("Gender", backendValue);
                }}
                items={[
                  { label: "Male", value: "Male" },
                  { label: "Female", value: "Female" },
                ]}
                placeholder={{
                  label: "Select Gender",
                  value: null,
                  color: "#A0A0A0",
                }}
                style={pickerSelectStyles}
                value={formData.Gender === "woman" || formData.Gender === "woman2"
                  ? "Female"
                  : formData.Gender === "man" || formData.Gender === "man2"
                    ? "Male"
                    : null
                }
                useNativeAndroidPickerStyle={false}
                Icon={() => (
                  <Image
                    source={icons.down}
                    style={{ width: 15, height: 15, marginRight: 15 }}
                    resizeMode="contain"
                  />
                )}
              /> */}



            </View>
            <View>
              <Label text="Marital Status" />
              <RNPickerSelect
                value={formData.MaritalStatus?.toLowerCase()}
                onValueChange={(value) => onChangeField("MaritalStatus", value)}
                items={maritalOptions}
                placeholder={{
                  label: "Select Marital Status",
                  value: null,
                  color: "#A0A0A0",
                }}
                style={pickerSelectStyles}
                useNativeAndroidPickerStyle={false}
                Icon={() => (
                  <Image
                    source={icons.down}
                    style={{ width: 15, height: 15, marginRight: 15 }}
                    resizeMode="contain"
                  />
                )}
              />
            </View>
            <View>
              <Label text="Have Children" />
              <RNPickerSelect
                onValueChange={(value) => onChangeField("HaveChild", value)}
                items={haveChildrenOptions}
                placeholder={{
                  label: "Select Option",
                  value: null,
                  color: "#A0A0A0",
                }}
                style={pickerSelectStyles}
                value={formData.HaveChild}
                useNativeAndroidPickerStyle={false}
                Icon={() => (
                  <Image
                    source={icons.down}
                    style={{ width: 15, height: 15, marginRight: 15 }}
                    resizeMode="contain"
                  />
                )}
              />
            </View>
            <View>
              <Label text="Education" />


              <RNPickerSelect
                onValueChange={(value) => onChangeField("Education", value)}
                items={educationOptions}
                placeholder={{
                  label: "Select Education",
                  value: null,
                  color: "#A0A0A0",
                }}
                style={pickerSelectStyles}
                value={formData.Education}
                useNativeAndroidPickerStyle={false}
                Icon={() => (
                  <Image
                    source={icons.down}
                    style={{ width: 15, height: 15, marginRight: 15 }}
                    resizeMode="contain"
                  />
                )}
              />
            </View>
          </Animated.View>
        )}
      </View>

      <View
        className="bg-white w-full rounded-[22px] px-[22px] py-[30px] flex-col gap-5 mb-5"
        style={styles.shadow}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setPickInterest((prev) => !prev)}
          className="flex-row items-center justify-between"
        >
          <Text className="text-primary font-medium text-lg">
            Pick your Interest
          </Text>
          <Animated.View style={{ transform: [{ rotate: arrowRotation }] }}>
            <Image source={icons.back} resizeMode="contain" />
          </Animated.View>
        </TouchableOpacity>

        {pickInterest && (
          <Animated.View className="mt-4 gap-5">
            <View className="flex-row gap-3 flex-wrap">
              {interestOptions.map((option) => {
                const isSelected = formData.Interest
                  ? formData.Interest.split(",").includes(option.value)
                  : false;

                return (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => toggleInterest(option.value)}
                    activeOpacity={0.9}
                    style={{
                      marginBottom: 8,
                      borderRadius: 50,
                      overflow: "hidden",
                      borderWidth: 1,
                      borderColor: isSelected ? "transparent" : "grey",
                    }}
                  >
                    {isSelected ? (
                      <LinearBg
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 8,
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                          borderRadius: 50, // IMPORTANT for iOS
                        }}
                      >
                        <Image
                          source={icons.check}
                          style={{ width: 20, height: 20 }}
                          resizeMode="contain"
                        />
                        <Text style={{ color: "#fff" }}>{option.label}</Text>
                      </LinearBg>
                    ) : (
                      <View
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 8,
                          borderRadius: 50, // for consistent look
                        }}
                      >
                        <Text style={{ color: 'black' }}>{option.label}</Text>
                      </View>
                    )}
                  </TouchableOpacity>




                );
              })}
            </View>
          </Animated.View>
        )}
      </View>

      <View
        className="bg-white w-full rounded-[22px] px-[22px] py-[30px] flex-col gap-5 mb-5"
        style={styles.shadow}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setEducationJobDetail((prev) => !prev)}
          className="flex-row items-center justify-between"
        >
          <Text className="text-primary font-medium text-lg">
            Education and Job Details
          </Text>
          <Animated.View style={{ transform: [{ rotate: arrowRotation }] }}>
            <Image source={icons.back} resizeMode="contain" />
          </Animated.View>
        </TouchableOpacity>

        {educationJobDetail && (
          <Animated.View className="mt-4 gap-5">
            {/* School section */}
            <View className="bg-white rounded-2xl py-4">
              <Text className="text-dark font-medium text-sm mb-4">
                Add Your School
              </Text>

              {/* Schools list */}
              {formData.School ? (
                // Split the comma-separated schools and render each one
                formData.School.split(",").map((school, index) => (
                  <View key={index} className="flex-row items-center mb-4">
                    <TextInput
                      value={school.trim()}
                      onChangeText={(text) => {
                        // Update the school at this index
                        const schools = formData.School
                          ? formData.School.split(",")
                          : [];
                        schools[index] = text;
                        // Join back and update formData
                        onChangeField("School", schools.join(","));
                      }}
                      placeholder="Add school name"
                      placeholderTextColor="#B0B0B0"
                      className="flex-1 px-4 py-3 border border-border rounded-[99] mr-2 bg-light-200 text-black"
                    />

                    {/* Remove school button */}
                    <TouchableOpacity
                      onPress={() => {
                        const schools = formData.School
                          ? formData.School.split(",")
                          : [];
                        // Remove this school
                        const updatedSchools = schools.filter(
                          (_, i) => i !== index
                        );
                        // Join back and update formData
                        onChangeField("School", updatedSchools.join(","));
                      }}
                      className="p-2"
                    >
                      <Image source={icons.remove} className="w-5 h-5" />
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                // Add first school button
                <TouchableOpacity
                  onPress={() => onChangeField("School", "")}
                  className="bg-primary py-2 px-4 rounded-lg"
                >
                  <Text className="text-white text-center">Add School</Text>
                </TouchableOpacity>
              )}

              {/* Add another school button */}
              {formData.School && (
                <TouchableOpacity
                  onPress={() => {
                    // Add a new empty school to the list
                    const schools = formData.School
                      ? formData.School.split(",")
                      : [];
                    schools.push("");
                    onChangeField("School", schools.join(","));
                  }}
                  className="bg-gray-200 py-2 px-4 rounded-lg mt-2"
                >
                  <Text className="text-primary text-center">
                    + Add Another School
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Job details section */}
            <View className="bg-white rounded-2xl py-4 mt-5">
              <Text className="text-dark font-medium text-sm mb-4">
                Add Job Details
              </Text>

              <View className="mb-4">
                {/* Company Name */}
                <View className="mb-4">
                  <Label text="Company" />
                  <TextInput
                    value={formData.Company}
                    onChangeText={(text) => onChangeField("Company", text)}
                    placeholder="Company Name"
                    placeholderTextColor="#B0B0B0"
                    className="px-4 py-3 border border-border rounded-[99] bg-light-100 text-black"
                  />
                </View>

                {/* Job Title */}
                <View className="mb-4">
                  <Label text="Job Title" />
                  <TextInput
                    value={formData.JobTitle}
                    onChangeText={(text) => onChangeField("JobTitle", text)}
                    placeholder="Job Title"
                    placeholderTextColor="#B0B0B0"
                    className="px-4 py-3 border border-border rounded-[99] bg-light-100 text-black"
                  />
                </View>
              </View>
            </View>
          </Animated.View>
        )}
      </View>

      <View
        className="bg-white w-full rounded-[22px] px-[22px] py-[30px] flex-col gap-5 mb-5"
        style={styles.shadow}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setAppearance((prev) => !prev)}
          className="flex-row items-center justify-between"
        >
          <Text className="text-primary font-medium text-lg">Appearance</Text>
          <Animated.View style={{ transform: [{ rotate: arrowRotation }] }}>
            <Image source={icons.back} resizeMode="contain" />
          </Animated.View>
        </TouchableOpacity>

        {appearance && (
          <Animated.View className="mt-4 gap-5">
            {/* Height Slider */}
            <View className="mb-6 pb-6 border-b border-b-border">
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-medium mb-3 text-dark">
                  Height
                </Text>
                <Text className="text-xs font-normal mb-3 text-gray">
                  {formData.Height ? `${formData.Height} ft` : "Select Height"}
                </Text>
              </View>
              <Slider
                style={{ width: "100%", height: 30 }}
                minimumValue={4.5}
                maximumValue={7.0}
                value={formData.Height ? parseFloat(formData.Height) : 5.5}
                onValueChange={(value) => {
                  // Round to 1 decimal place for better display
                  const heightValue = Math.round(value * 10) / 10;
                  onChangeField("Height", heightValue.toString());
                }}
                step={0.1}
                minimumTrackTintColor="#B06D1E"
                maximumTrackTintColor="#D9D9D9"
                thumbTintColor="#B06D1E"
              />
            </View>

            <View className="mt-4">
              <Label text="Body Type" />
              <Animated.View className="mt-2 gap-3">
                <View className="flex-row gap-3 flex-wrap">
                  {bodyTypeOptions.map((option) => {
                    const isSelected = formData.BodyType
                      ? formData.BodyType.split(",").map((e) => e.trim()).includes(option.value)
                      : false;


                    return (
                      <TouchableOpacity
                        key={option.value}
                        onPress={() => toggleBodyType(option.value)}
                        activeOpacity={0.9}
                        style={{
                          marginBottom: 8,
                          borderRadius: 50,
                          overflow: "hidden",
                          borderWidth: 1,
                          borderColor: isSelected ? "transparent" : "grey", // similar to your “primary”
                        }}
                      >
                        {isSelected ? (
                          <LinearBg
                            style={{
                              paddingHorizontal: 16,
                              paddingVertical: 8,
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 8,
                              borderRadius: 50, // Needed for iOS masking
                            }}
                          >
                            <Image
                              source={icons.check}
                              style={{ width: 20, height: 20 }}
                              resizeMode="contain"
                            />
                            <Text style={{ color: "#fff" }}>{option.label}</Text>
                          </LinearBg>
                        ) : (
                          <View
                            style={{
                              paddingHorizontal: 16,
                              paddingVertical: 8,
                              borderRadius: 50,
                            }}
                          >
                            <Text style={{ color: "#000" }}>{option.label}</Text>
                          </View>
                        )}
                      </TouchableOpacity>

                    );
                  })}
                </View>
              </Animated.View>
            </View>

          </Animated.View>
        )}
      </View>

      <View
        className="bg-white w-full rounded-[22px] px-[22px] py-[30px] flex-col gap-5 mb-5"
        style={styles.shadow}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setShowHabit((prev) => !prev)}
          className="flex-row items-center justify-between"
        >
          <Text className="text-primary font-medium text-lg">
            Habit & Interests
          </Text>
          <Animated.View style={{ transform: [{ rotate: arrowRotation }] }}>
            <Image source={icons.back} resizeMode="contain" />
          </Animated.View>
        </TouchableOpacity>

        {habit && (
          <Animated.View className="mt-4 gap-5">
            <View>
              <Label text="Smoking" marginLeft="" />
              <RNPickerSelect
                onValueChange={(value) => onChangeField("Smoking", value)}
                items={smokeOptions}
                placeholder={{
                  label: "Select options",
                  value: null,
                  color: "#A0A0A0",
                }}
                style={pickerSelectStyles}
                value={formData.Smoking}
                useNativeAndroidPickerStyle={false}
                Icon={() => (
                  <Image
                    source={icons.down}
                    style={{ width: 15, height: 15, marginRight: 15 }}
                    resizeMode="contain"
                  />
                )}
              />
            </View>
            <View>
              <Label text="Marijuana" />
              <RNPickerSelect
                value={formData.Marijuna}
                onValueChange={(value) => onChangeField("Marijuna", value)}
                items={marijuanOption}
                placeholder={{
                  label: "Select marijuana option",
                  value: null,
                  color: "#A0A0A0",
                }}
                style={pickerSelectStyles}
                useNativeAndroidPickerStyle={false}
                Icon={() => (
                  <Image
                    source={icons.down}
                    style={{ width: 15, height: 15, marginRight: 15 }}
                    resizeMode="contain"
                  />
                )}
              />
            </View>
            <View>
              <Label text="How often do you drink?" />
              <RNPickerSelect
                onValueChange={(value) => onChangeField("Drinks", value)}
                items={drinkingOption}
                placeholder={{
                  label: "Select Option",
                  value: null,
                  color: "#A0A0A0",
                }}
                style={pickerSelectStyles}
                value={formData.Drinks}
                useNativeAndroidPickerStyle={false}
                Icon={() => (
                  <Image
                    source={icons.down}
                    style={{ width: 15, height: 15, marginRight: 15 }}
                    resizeMode="contain"
                  />
                )}
              />
            </View>
            <View>
              <Label text="Pets" />
              <RNPickerSelect
                onValueChange={(value) => onChangeField("Pets", value?.toLowerCase().trim())}
                items={petsOptions}
                placeholder={{
                  label: "Select Pets",
                  value: null,
                  color: "#A0A0A0",
                }}
                style={pickerSelectStyles}
                value={formData.Pets}
                useNativeAndroidPickerStyle={false}
                Icon={() => (
                  <Image
                    source={icons.down}
                    style={{ width: 15, height: 15, marginRight: 15 }}
                    resizeMode="contain"
                  />
                )}
              />
            </View>
          </Animated.View>
        )}
      </View>

      <View
        className="bg-white w-full rounded-[22px] px-[22px] py-[30px] flex-col gap-5 mb-5"
        style={styles.shadow}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setEthinicity((prev) => !prev)}
          className="flex-row items-center justify-between"
        >
          <Text className="text-primary font-medium text-lg">Ethinicity</Text>
          <Animated.View style={{ transform: [{ rotate: arrowRotation }] }}>
            <Image source={icons.back} resizeMode="contain" />
          </Animated.View>
        </TouchableOpacity>

        {ethinicity && (
          <Animated.View className="mt-4 gap-5">
            <View className="flex-row gap-3 flex-wrap">
              {ethinicityOptions.map((option) => {
                const isSelected = formData.Ethniticity
                  ? formData.Ethniticity.split(",")
                    .map((e) => e.trim())
                    .includes(option.value)
                  : false;

                return (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => toggleEthnicity(option.value)}
                    activeOpacity={0.9}
                    style={{
                      marginBottom: 8,
                      borderRadius: 50,
                      overflow: "hidden",
                      borderWidth: 1,
                      borderColor: isSelected ? "transparent" : "lightgrey",
                    }}
                  >
                    {isSelected ? (
                      <LinearBg
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 8,
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                          borderRadius: 50, // For iOS masking
                        }}
                      >
                        <Image
                          source={icons.check}
                          style={{ width: 20, height: 20 }}
                          resizeMode="contain"
                        />
                        <Text style={{ color: "#fff" }}>{option.label}</Text>
                      </LinearBg>
                    ) : (
                      <View
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 8,
                          borderRadius: 50,
                        }}
                      >
                        <Text style={{ color: "#000" }}>{option.label}</Text>
                      </View>
                    )}
                  </TouchableOpacity>

                );
              })}
            </View>
          </Animated.View>
        )}
      </View>

      <View
        className="bg-white w-full rounded-[22px] px-[22px] py-[30px] flex-col gap-5 mb-5"
        style={styles.shadow}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setLanguage((prev) => !prev)}
          className="flex-row items-center justify-between"
        >
          <Text className="text-primary font-medium text-lg">Language</Text>
          <Animated.View style={{ transform: [{ rotate: arrowRotation }] }}>
            <Image source={icons.back} resizeMode="contain" />
          </Animated.View>
        </TouchableOpacity>
        {language && (
          <Animated.View className="mt-4 gap-5">
            <View className="flex-row gap-3 flex-wrap">
              {languageOptions.map((option) => {
                // ✅ Put this here — inside the map
                const isSelected = formData.Language
                  ? formData.Language.split(",")
                    .map((l) => l.trim().toLowerCase())
                    .includes(option.value.toLowerCase())
                  : false;


                return (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => toggleLanguage(option.value)}
                    activeOpacity={0.9}
                    style={{
                      marginBottom: 8,
                      borderRadius: 50,
                      overflow: "hidden",
                      borderWidth: 1,
                      borderColor: isSelected ? "transparent" : "lightgrey",
                    }}
                  >
                    {isSelected ? (
                      <LinearBg
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 8,
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                          borderRadius: 50,
                        }}
                      >
                        <Image
                          source={icons.check}
                          style={{ width: 20, height: 20 }}
                          resizeMode="contain"
                        />
                        <Text style={{ color: "#fff", textTransform: "capitalize" }}>
                          {option.label}
                        </Text>
                      </LinearBg>
                    ) : (
                      <View
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 8,
                          borderRadius: 50,
                        }}
                      >
                        <Text style={{ color: "#000", textTransform: "capitalize" }}>
                          {option.label}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>

                );
              })}
            </View>
          </Animated.View>
        )}


      </View>


      <View
        className="bg-white w-full rounded-[22px] px-[22px] py-[30px] flex-col gap-5 mb-5"
        style={styles.shadow}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setReligion((prev) => !prev)}
          className="flex-row items-center justify-between"
        >
          <Text className="text-primary font-medium text-lg">Religion</Text>
          <Animated.View style={{ transform: [{ rotate: arrowRotation }] }}>
            <Image source={icons.back} resizeMode="contain" />
          </Animated.View>
        </TouchableOpacity>
        {religion && (
          <Animated.View className="mt-4 gap-5">
            <View className="flex-row gap-3 flex-wrap">
              {religionOptions.map((option) => {
                // ✅ Put this here — inside the map
                const isSelected = formData.Religion
                  ? formData.Religion.split(",")
                    .map((l) => l.trim().toLowerCase())
                    .includes(option.value.toLowerCase())
                  : false;


                return (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => toggleReligion(option.value)}
                    activeOpacity={0.9}
                    style={{
                      marginBottom: 8,
                      borderRadius: 50,
                      overflow: "hidden",
                      borderWidth: 1,
                      borderColor: isSelected ? "transparent" : "lightgrey",
                    }}
                  >
                    {isSelected ? (
                      <LinearBg
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 8,
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                          borderRadius: 50,
                        }}
                      >
                        <Image
                          source={icons.check}
                          style={{ width: 20, height: 20 }}
                          resizeMode="contain"
                        />
                        <Text style={{ color: "#fff", textTransform: "capitalize" }}>
                          {option.label}
                        </Text>
                      </LinearBg>
                    ) : (
                      <View
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 8,
                          borderRadius: 50,
                        }}
                      >
                        <Text style={{ color: "#000", textTransform: "capitalize" }}>
                          {option.label}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>

                );
              })}
            </View>
          </Animated.View>
        )}
      </View>

      <View
        className="bg-white w-full rounded-[22px] px-[22px] py-[30px] flex-col gap-5 mb-5"
        style={styles.shadow}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setPolitical((prev) => !prev)}
          className="flex-row items-center justify-between"
        >
          <Text className="text-primary font-medium text-lg">
            Poltical Views
          </Text>
          <Animated.View style={{ transform: [{ rotate: arrowRotation }] }}>
            <Image source={icons.back} resizeMode="contain" />
          </Animated.View>
        </TouchableOpacity>

        {political && (
          <Animated.View className="mt-4 gap-5">
            <View>
              <RNPickerSelect
                onValueChange={(value) => onChangeField("NightAtHome", value)}
                items={politicalViewOptions}
                placeholder={{
                  label: "Select options",
                  value: null,
                  color: "#A0A0A0",
                }}
                value={formData.NightAtHome}
                style={pickerSelectStyles}
                useNativeAndroidPickerStyle={false}
                Icon={() => (
                  <Image
                    source={icons.down}
                    style={{ width: 15, height: 15, marginRight: 15 }}
                    resizeMode="contain"
                  />
                )}
              />
            </View>
          </Animated.View>
        )}
      </View>

      <View
        className="bg-white w-full rounded-[22px] px-[22px] py-[30px] flex-col gap-5 mb-5"
        style={styles.shadow}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setFewWords((prev) => !prev)}
          className="flex-row items-center justify-between"
        >
          <Text className="text-primary font-medium text-lg">
            In a few Words
          </Text>
          <Animated.View style={{ transform: [{ rotate: arrowRotation }] }}>
            <Image source={icons.back} resizeMode="contain" />
          </Animated.View>
        </TouchableOpacity>

        {fewWords && (
          <Animated.View className="mt-4 gap-5">
            <View className="relative py-[13px] px-[15px] border border-border rounded-2xl bg-light-100">
              <TextInput
                multiline={true}
                numberOfLines={6}
                maxLength={300}
                placeholder="Tell me a little about yourself"
                placeholderTextColor="#B0B0B0"
                value={formData.About}
                onChangeText={(value) => onChangeField("About", value)}
                textAlignVertical="top"
                style={{
                  height: 120, // Fixed height instead of relying on numberOfLines
                  paddingBottom: 20, // Space for the counter
                  color: 'black'
                }}
              />
              <Text className="absolute bottom-3 right-3 text-xs text-gray">
                {formData.About?.length || 0}/300
              </Text>
            </View>
            <View className="relative py-[13px] px-[15px] border border-border rounded-2xl bg-light-100">
              <TextInput
                multiline={true}
                numberOfLines={6}
                maxLength={300}
                placeholder="Craziest thing you have done"
                placeholderTextColor="#B0B0B0"
                value={formData.craziestTravelStory}
                onChangeText={(value) => onChangeField("craziestTravelStory", value)}
                textAlignVertical="top"
                style={{
                  height: 120,
                  paddingBottom: 20,
                  color: 'black'
                }}
              />
              <Text className="absolute bottom-3 right-3 text-xs text-gray">
                {formData.craziestTravelStory?.length || 0}/300
              </Text>
            </View>
          </Animated.View>
        )}
      </View>

      <Modal
        visible={showPasswordModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white w-[90%] rounded-3xl p-6">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-semibold text-primary">Change Password</Text>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                <Image
                  source={icons.times}
                  className="w-4 h-4"
                  resizeMode="contain"
                  tintColor="#000"
                />
              </TouchableOpacity>
            </View>

            {passwordError ? (
              <View className="bg-red-100 p-3 rounded-lg mb-4">
                <Text className="text-red-600">{passwordError}</Text>
              </View>
            ) : null}

            <View className="mb-4">
              <Label text="Current Password" />
              <TextInput
                placeholder="Enter current password"
                placeholderTextColor={"#A0A0A0"}
                className="border border-border bg-light-100 rounded-full px-[15px] py-[12px] mb-3"
                value={passwordData.oldPassword}
                onChangeText={(text) => setPasswordData({ ...passwordData, oldPassword: text })}
                secureTextEntry
              />

              <Label text="New Password" />
              <TextInput
                placeholder="Enter new password"
                placeholderTextColor={"#A0A0A0"}
                className="border border-border bg-light-100 rounded-full px-[15px] py-[12px] mb-3"
                value={passwordData.newPassword}
                onChangeText={(text) => setPasswordData({ ...passwordData, newPassword: text })}
                secureTextEntry
              />

              <Label text="Confirm New Password" />
              <TextInput
                placeholder="Confirm new password"
                placeholderTextColor={"#A0A0A0"}
                className="border border-border bg-light-100 rounded-full px-[15px] py-[12px]"
                value={passwordData.confirmPassword}
                onChangeText={(text) => setPasswordData({ ...passwordData, confirmPassword: text })}
                secureTextEntry
              />
            </View>

            <View className="flex-row gap-3 mt-4">
              <TouchableOpacity
                onPress={() => setShowPasswordModal(false)}
                className="flex-1 py-3 bg-light-100 border border-border rounded-full items-center"
              >
                <Text className="text-gray-700 font-medium">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleChangePassword}
                disabled={changingPassword}
                className="flex-1 rounded-full overflow-hidden"
              >
                <LinearBg className="py-3 items-center justify-center">
                  {changingPassword ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text className="text-white font-medium">Change Password</Text>
                  )}
                </LinearBg>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default EditProfileForm;
