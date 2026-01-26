import { createEvent } from "@/lib/api";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useState, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  PlatformColor,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { SymbolView } from "expo-symbols";

export default function CreateEvent() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [loading, setLoading] = useState(false);
  const [eventName, setEventName] = useState("");
  const [description, setDescription] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [eventDate, setEventDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date(Date.now() + 3 * 60 * 60 * 1000)); // 3 hours later
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const handleCreateEvent = useCallback(async () => {
    // Validate required fields
    if (!eventName.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Missing Information", "Please enter an event name.");
      return;
    }

    if (!description.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Missing Information", "Please enter an event description.");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("EventName", eventName);
      formData.append("Description", description);
      formData.append("Street", street);
      formData.append("City", city);
      formData.append("State", state);
      formData.append("PostalCode", postalCode);
      formData.append("EventDate", eventDate.toISOString().split("T")[0]);
      formData.append("StartTime", startTime.toLocaleTimeString("en-US", { 
        hour: "2-digit", 
        minute: "2-digit",
        hour12: true 
      }));
      formData.append("EndTime", endTime.toLocaleTimeString("en-US", { 
        hour: "2-digit", 
        minute: "2-digit",
        hour12: true 
      }));

      const res = await createEvent(formData);

      if (res?.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          "Success",
          "Your event has been created!",
          [{ text: "OK", onPress: () => router.back() }]
        );
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert("Error", res?.msg || "Failed to create event");
      }
    } catch (error) {
      console.error("Error creating event:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [eventName, description, street, city, state, postalCode, eventDate, startTime, endTime, router]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const onDateChange = (_: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      Haptics.selectionAsync();
      setEventDate(selectedDate);
    }
  };

  const onStartTimeChange = (_: any, selectedTime?: Date) => {
    setShowStartTimePicker(Platform.OS === "ios");
    if (selectedTime) {
      Haptics.selectionAsync();
      setStartTime(selectedTime);
    }
  };

  const onEndTimeChange = (_: any, selectedTime?: Date) => {
    setShowEndTimePicker(Platform.OS === "ios");
    if (selectedTime) {
      Haptics.selectionAsync();
      setEndTime(selectedTime);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-background"
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="px-4 py-6">
          {/* Event Name */}
          <View className="mb-5">
            <Text className="text-sm font-medium text-dark mb-2">Event Name *</Text>
            <TextInput
              className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-base text-dark"
              placeholder="Enter event name"
              placeholderTextColor="#9CA3AF"
              value={eventName}
              onChangeText={setEventName}
              clearButtonMode="while-editing"
              enablesReturnKeyAutomatically
              returnKeyType="next"
              style={{ minHeight: 48 }}
            />
          </View>

          {/* Description */}
          <View className="mb-5">
            <Text className="text-sm font-medium text-dark mb-2">Description *</Text>
            <TextInput
              className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-base text-dark"
              placeholder="Describe your event..."
              placeholderTextColor="#9CA3AF"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={{ minHeight: 120 }}
            />
          </View>

          {/* Date & Time Section */}
          <Text className="text-sm font-semibold text-dark mb-3">Date & Time</Text>
          
          {/* Event Date */}
          <TouchableOpacity
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 mb-3 flex-row justify-between items-center"
            onPress={() => {
              Haptics.selectionAsync();
              setShowDatePicker(true);
            }}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              {Platform.OS === "ios" && (
                <SymbolView
                  name="calendar"
                  style={{ width: 20, height: 20 }}
                  tintColor={Platform.select({ ios: PlatformColor("systemBlue") as unknown as string, default: "#007AFF" })}
                />
              )}
              <Text className="text-base text-dark ml-2">Date</Text>
            </View>
            <Text className="text-base text-primary">{formatDate(eventDate)}</Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={eventDate}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={onDateChange}
              minimumDate={new Date()}
            />
          )}

          {/* Start Time */}
          <TouchableOpacity
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 mb-3 flex-row justify-between items-center"
            onPress={() => {
              Haptics.selectionAsync();
              setShowStartTimePicker(true);
            }}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              {Platform.OS === "ios" && (
                <SymbolView
                  name="clock"
                  style={{ width: 20, height: 20 }}
                  tintColor={Platform.select({ ios: PlatformColor("systemGreen") as unknown as string, default: "#34C759" })}
                />
              )}
              <Text className="text-base text-dark ml-2">Start Time</Text>
            </View>
            <Text className="text-base text-primary">{formatTime(startTime)}</Text>
          </TouchableOpacity>

          {showStartTimePicker && (
            <DateTimePicker
              value={startTime}
              mode="time"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={onStartTimeChange}
            />
          )}

          {/* End Time */}
          <TouchableOpacity
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 mb-5 flex-row justify-between items-center"
            onPress={() => {
              Haptics.selectionAsync();
              setShowEndTimePicker(true);
            }}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              {Platform.OS === "ios" && (
                <SymbolView
                  name="clock.badge.checkmark"
                  style={{ width: 20, height: 20 }}
                  tintColor={Platform.select({ ios: PlatformColor("systemOrange") as unknown as string, default: "#FF9500" })}
                />
              )}
              <Text className="text-base text-dark ml-2">End Time</Text>
            </View>
            <Text className="text-base text-primary">{formatTime(endTime)}</Text>
          </TouchableOpacity>

          {showEndTimePicker && (
            <DateTimePicker
              value={endTime}
              mode="time"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={onEndTimeChange}
            />
          )}

          {/* Location Section */}
          <Text className="text-sm font-semibold text-dark mb-3">Location (Optional)</Text>

          {/* Street */}
          <View className="mb-3">
            <TextInput
              className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-base text-dark"
              placeholder="Street Address"
              placeholderTextColor="#9CA3AF"
              value={street}
              onChangeText={setStreet}
              clearButtonMode="while-editing"
              enablesReturnKeyAutomatically
              returnKeyType="next"
              style={{ minHeight: 48 }}
            />
          </View>

          {/* City & State */}
          <View className="flex-row mb-3 gap-3">
            <View className="flex-1">
              <TextInput
                className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-base text-dark"
                placeholder="City"
                placeholderTextColor="#9CA3AF"
                value={city}
                onChangeText={setCity}
                clearButtonMode="while-editing"
                enablesReturnKeyAutomatically
                returnKeyType="next"
                style={{ minHeight: 48 }}
              />
            </View>
            <View className="w-24">
              <TextInput
                className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-base text-dark"
                placeholder="State"
                placeholderTextColor="#9CA3AF"
                value={state}
                onChangeText={setState}
                clearButtonMode="while-editing"
                enablesReturnKeyAutomatically
                returnKeyType="next"
                autoCapitalize="characters"
                maxLength={2}
                style={{ minHeight: 48 }}
              />
            </View>
          </View>

          {/* Postal Code */}
          <View className="mb-8">
            <TextInput
              className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-base text-dark"
              placeholder="Postal Code"
              placeholderTextColor="#9CA3AF"
              value={postalCode}
              onChangeText={setPostalCode}
              clearButtonMode="while-editing"
              enablesReturnKeyAutomatically
              returnKeyType="done"
              keyboardType="number-pad"
              maxLength={10}
              style={{ minHeight: 48 }}
            />
          </View>
        </View>
      </ScrollView>

      {/* Create Button - Fixed at bottom */}
      <View 
        className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 pt-3"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        <TouchableOpacity
          className={`rounded-xl py-4 items-center ${
            loading ? "bg-primary/70" : "bg-primary"
          }`}
          onPress={handleCreateEvent}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <View className="flex-row items-center">
              {Platform.OS === "ios" && (
                <SymbolView
                  name="plus.circle.fill"
                  style={{ width: 20, height: 20, marginRight: 8 }}
                  tintColor="#FFFFFF"
                />
              )}
              <Text className="text-white font-semibold text-base">Create Event</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
