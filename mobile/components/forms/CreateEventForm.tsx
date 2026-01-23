import { icons } from "@/constants/icons";
import { CommonFileUpload, createEvent } from "@/lib/api";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import LinearBg from "../LinearBg";

const Label = ({ text }: { text: string }) => (
  <Text
    className="text-[12px] text-gray font-normal mb-1"
    style={{ fontFamily: "SF Pro Display" }}
  >
    {text}
  </Text>
);

interface EventFormData {
  EventName: string;
  EventDate: Date;
  EventPrice: string;
  StartTime: Date;
  EndTime: Date;
  Description: string;
  Street: string;
  State: string;
  City: string;
  PostalCode: string;
  Link: string;
  Longitude: string;
  Latitude: string;
  EventImage: string;
  imageUri?: string;
}

export default function CreateEventForm({showMsg} : {showMsg?: (res: any) => void}) {
  const [date, setDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<EventFormData>({
    EventName: "",
    EventDate: new Date(),
    StartTime: new Date(),
    EndTime: new Date(),
    EventPrice: "",
    Description: "",
    Street: "",
    State: "",
    City: "",
    PostalCode: "",
    Longitude: "",
    Latitude: "",
    Link: "",
    EventImage: "",
  });

  const updateFormData = (field: keyof EventFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const getDateTimePickerProps = () => {
    if (Platform.OS === "android") {
      return {
        accentColor: "#B06D1E",
        themeVariant: "light",
      };
    } else {
      return {
        textColor: "#B06D1E",
        accentColor: "#B06D1E",
      };
    }
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
        mediaTypes: ['images'],
        allowsEditing: true,
        // aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Update form with local URI for preview
        updateFormData("imageUri", result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const uploadImage = async () => {
    if (!formData.imageUri) {
      Alert.alert("No Image", "Please select an image first.");
      return;
    }

    setIsUploading(true);
    try {
      const imageFormData = new FormData();

      const fileUri = formData.imageUri;
      const fileName = fileUri.split("/").pop();
      const fileType = fileName?.endsWith(".png") ? "image/png" : "image/jpeg";

      imageFormData.append("uploadattachments[]", {
        uri: fileUri,
        name: fileName,
        type: fileType,
      } as any);

      const response = await CommonFileUpload(imageFormData);
      console.log("Upload response:", response);
      
      if (response && response?.name) {
        const fileName = response.name.replace("uploads/", "");
        updateFormData("EventImage", response.name);
      } else {
        Alert.alert(
          "Upload Failed",
          "Failed to upload image. Please try again."
        );
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      Alert.alert("Error", "Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    // Validate form fields
    if (!formData.EventName) {
      Alert.alert("Error", "Please enter event name");
      return;
    }

    setIsSubmitting(true);
    try {
      // Create FormData for submission
      const eventFormData = new FormData();

      // Append all form fields
      eventFormData.append("EventName", formData.EventName);
      eventFormData.append("EventDate", formatDate(formData.EventDate));
      eventFormData.append("StartTime", formatTime(formData.StartTime));
      eventFormData.append("EndTime", formatTime(formData.EndTime));
      eventFormData.append("EventPrice", formData.EventPrice || "Free");
      eventFormData.append("Description", formData.Description);
      eventFormData.append("Street", formData.Street);
      eventFormData.append("State", formData.State);
      eventFormData.append("City", formData.City);
      eventFormData.append("PostalCode", formData.PostalCode);
      eventFormData.append("Link", formData.Link);
      eventFormData.append("Longitude", formData.Longitude || "37.78825");
      eventFormData.append("Latitude", formData.Latitude || "-122.4324");
      eventFormData.append("Image", formData?.EventImage);
      // eventFormData.append("Image", formData.imageUri);
       
      
      console.log("eventFormData", eventFormData);

      const res = await createEvent(eventFormData);
      console.log("Create event response:", res);
      
      if(res?.success){
        // console.log("Event created successfully:", res);
        showMsg && showMsg(res);
        setFormData({
          EventName: "",
          EventDate: new Date(),
          StartTime: new Date(),
          EndTime: new Date(),
          EventPrice: "",
          Description: "",
          Street: "",
          State: "",
          City: "",
          PostalCode: "",
          Longitude: "",
          Latitude: "",
          Link: "",
          EventImage: "",
        });
      }else{
        showMsg && showMsg(res);
        console.log("Failed to create event:", res?.msg);
      }
    } catch (error) {
      console.error("Error creating event:", error);
      showMsg && showMsg({ success: false, msg: "Something went wrong" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatTime = (date: Date): string => {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  return (
    <>
    <Toast />
      <View
        className="bg-white rounded-[22px] px-[22px] py-[30px] flex-col gap-5"
        style={styles.shadow}
      >
        <View>
          <Label text="Event Name" />
          <TextInput
            value={formData.EventName}
            onChangeText={(text) => updateFormData("EventName", text)}
            className="border border-border rounded-full px-[15px] py-[12px]"
            placeholder="Diwali Celebration"
            placeholderTextColor={"#B0B0B0"}
          />
        </View>

        <View>
          <Label text="Event Date" />
          <Pressable
            onPress={() => setShowDatePicker(true)}
            className="border border-border rounded-full px-[15px] py-[12px] flex-row items-center justify-between"
          >
            <Text>{formData.EventDate.toDateString()}</Text>
            <Image
              source={icons.calender}
              tintColor="#1D2733"
              resizeMode="contain"
            />
          </Pressable>
          {showDatePicker && (
            <DateTimePicker
              value={formData.EventDate}
              mode="date"
              display="default"
              onChange={(_, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setDate(selectedDate);
                  updateFormData("EventDate", selectedDate);
                }
              }}
              {...getDateTimePickerProps()}
            />
          )}
        </View>

        <View className="flex-row justify-between gap-3">
          <View className="flex-1">
            <Label text="Start Time" />
            <Pressable
              onPress={() => setShowStartTimePicker(true)}
              className="border border-border rounded-full px-[15px] py-[12px]"
            >
              <Text>
                {formData.StartTime.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </Pressable>
            {showStartTimePicker && (
              <DateTimePicker
                value={formData.StartTime}
                mode="time"
                display="default"
                onChange={(_, selectedTime) => {
                  setShowStartTimePicker(false);
                  if (selectedTime) {
                    setStartTime(selectedTime);
                    updateFormData("StartTime", selectedTime);
                  }
                }}
                {...getDateTimePickerProps()}
              />
            )}
          </View>

          <View className="flex-1">
            <Label text="End Time" />
            <Pressable
              onPress={() => setShowEndTimePicker(true)}
              className="border border-border rounded-full px-[15px] py-[12px]"
            >
              <Text>
                {formData.EndTime.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </Pressable>
            {showEndTimePicker && (
              <DateTimePicker
                value={formData.EndTime}
                mode="time"
                display="default"
                onChange={(_, selectedTime) => {
                  setShowEndTimePicker(false);
                  if (selectedTime) {
                    setEndTime(selectedTime);
                    updateFormData("EndTime", selectedTime);
                  }
                }}
                {...getDateTimePickerProps()}
              />
            )}
          </View>
        </View>

        <View>
          <Label text="Event Price" />
          <TextInput
            className="border border-border rounded-full px-[15px] py-[12px]"
            placeholder="Enter price (e.g. 10.00)"
            placeholderTextColor={"#B0B0B0"}
            value={formData.EventPrice}
            onChangeText={(text) => updateFormData("EventPrice", text)}
            keyboardType="numeric"
          />
        </View>

        <View>
          <Label text="Description" />
          <TextInput
            className="border border-border rounded-xl px-[15px] py-[12px]"
            placeholder="Describe your event"
            value={formData.Description}
            placeholderTextColor={"#B0B0B0"}
            onChangeText={(text) => updateFormData("Description", text)}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            style={{ height: 80, maxHeight: 100 }}
          />
        </View>

        <View>
          <Label text="Link" />
          <TextInput
            className="border border-border rounded-full px-[15px] py-[12px]"
            placeholder="Event Link"
            placeholderTextColor={"#B0B0B0"}
            value={formData.Link}
            onChangeText={(text) => updateFormData("Link", text)}
          />
        </View>
        <View>
          <Label text="Street" />
          <TextInput
            className="border border-border rounded-full px-[15px] py-[12px]"
            placeholder="Opposite Omegatron"
            placeholderTextColor={"#B0B0B0"}
            value={formData.Street}
            onChangeText={(text) => updateFormData("Street", text)}
          />
        </View>

        <View className="flex-row justify-between gap-3">
          <View className="flex-1">
            <Label text="State" />
            <TextInput
              className="border border-border rounded-full px-[15px] py-[12px]"
              placeholder="California"
              placeholderTextColor={"#B0B0B0"}
              value={formData.State}
              onChangeText={(text) => updateFormData("State", text)}
            />
          </View>

          <View className="flex-1">
            <Label text="City" />
            <TextInput
              value={formData.City}
              onChangeText={(text) => updateFormData("City", text)}
              className="border border-border rounded-full px-[15px] py-[12px]"
              placeholder="San Francisco"
              placeholderTextColor={"#B0B0B0"}
            />
          </View>
        </View>

        <View>
          <Label text="Postal Code" />
          <TextInput
            value={formData.PostalCode}
            onChangeText={(text) => updateFormData("PostalCode", text)}
            className="border border-border rounded-full px-[15px] py-[12px]"
            placeholder="T4R 0N2"
            placeholderTextColor={"#B0B0B0"}
          />
        </View>

        <View>
          <Label text="Event Image" />
          <Pressable
            onPress={pickImage}
            className="border border-gray-200 bg-gray-50 rounded-[22px] items-center justify-center py-10 mt-2"
          >
            {formData.imageUri ? (
              // Show selected image preview
              <View className="items-center">
                <Image
                  source={{ uri: formData.imageUri }}
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 8,
                    marginBottom: 10,
                  }}
                  resizeMode="cover"
                />
                <Text className="text-primary font-medium text-sm">
                  Change Image
                </Text>

                {formData.EventImage ? (
                  <Text className="text-green-600 text-xs mt-2">
                    ✓ Image uploaded
                  </Text>
                ) : (
                  <TouchableOpacity
                    onPress={uploadImage}
                    disabled={isUploading}
                    className="mt-4 bg-primary px-4 py-2 rounded-full"
                  >
                    {isUploading ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text className="text-white font-medium">
                        Upload Image
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              // Show upload icon and text
              <>
                <Image source={icons.upload} resizeMode="contain" />
                <Text className="text-dark mt-2 font-normal text-sm">
                  Upload Pictures (JPG, PNG)
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
      <TouchableOpacity
        onPress={handleSubmit}
        className="w-full mx-auto shadow-lg shadow-white rounded-[99] mt-10 mb-20 overflow-hidden"
      >
        <LinearBg className="px-6 py-5">
          {isSubmitting ? (
            <ActivityIndicator
              size="small"
              color="#ffffff"
              className="text-center"
            />
          ) : (
            <Text className="text-center text-white font-bold text-[16px] py-5">
              Create Event
            </Text>
          )}
        </LinearBg>
      </TouchableOpacity>
      {/* <GradientButton
        text="Accept Order"
        containerStyle={{ marginTop: 40, marginBottom: 80 }}
        onPress={handleSubmit}
      /> */}
    </>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: "#000000",
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
});
