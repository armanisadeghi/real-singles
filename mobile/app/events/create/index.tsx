import { createEvent } from "@/lib/api";
import { useThemeColors } from "@/context/ThemeContext";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useState, useCallback, useMemo } from "react";
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
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { SymbolView } from "expo-symbols";

export default function CreateEvent() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
    placeholderText: Platform.OS === 'ios' ? (PlatformColor('placeholderText') as unknown as string) : (isDark ? '#8E8E93' : '#9CA3AF'),
  }), [isDark, colors]);
  
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
      style={{ flex: 1, backgroundColor: themedColors.background }}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: 16, paddingVertical: 24 }}>
          {/* Event Name */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 14, fontWeight: '500', color: themedColors.text, marginBottom: 8 }}>Event Name *</Text>
            <TextInput
              style={{
                backgroundColor: themedColors.secondaryBackground,
                borderWidth: 1,
                borderColor: themedColors.border,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 16,
                color: themedColors.text,
                minHeight: 48,
              }}
              placeholder="Enter event name"
              placeholderTextColor={themedColors.placeholderText}
              value={eventName}
              onChangeText={setEventName}
              clearButtonMode="while-editing"
              enablesReturnKeyAutomatically
              returnKeyType="next"
            />
          </View>

          {/* Description */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 14, fontWeight: '500', color: themedColors.text, marginBottom: 8 }}>Description *</Text>
            <TextInput
              style={{
                backgroundColor: themedColors.secondaryBackground,
                borderWidth: 1,
                borderColor: themedColors.border,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 16,
                color: themedColors.text,
                minHeight: 120,
              }}
              placeholder="Describe your event..."
              placeholderTextColor={themedColors.placeholderText}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Date & Time Section */}
          <Text style={{ fontSize: 14, fontWeight: '600', color: themedColors.text, marginBottom: 12 }}>Date & Time</Text>
          
          {/* Event Date */}
          <TouchableOpacity
            style={{
              backgroundColor: themedColors.secondaryBackground,
              borderWidth: 1,
              borderColor: themedColors.border,
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 12,
              marginBottom: 12,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
            onPress={() => {
              Haptics.selectionAsync();
              setShowDatePicker(true);
            }}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {Platform.OS === "ios" && (
                <SymbolView
                  name="calendar"
                  style={{ width: 20, height: 20 }}
                  tintColor={Platform.select({ ios: PlatformColor("systemBlue") as unknown as string, default: "#007AFF" })}
                />
              )}
              <Text style={{ fontSize: 16, color: themedColors.text, marginLeft: 8 }}>Date</Text>
            </View>
            <Text style={{ fontSize: 16, color: '#B06D1E' }}>{formatDate(eventDate)}</Text>
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
            style={{
              backgroundColor: themedColors.secondaryBackground,
              borderWidth: 1,
              borderColor: themedColors.border,
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 12,
              marginBottom: 12,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
            onPress={() => {
              Haptics.selectionAsync();
              setShowStartTimePicker(true);
            }}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {Platform.OS === "ios" && (
                <SymbolView
                  name="clock"
                  style={{ width: 20, height: 20 }}
                  tintColor={Platform.select({ ios: PlatformColor("systemGreen") as unknown as string, default: "#34C759" })}
                />
              )}
              <Text style={{ fontSize: 16, color: themedColors.text, marginLeft: 8 }}>Start Time</Text>
            </View>
            <Text style={{ fontSize: 16, color: '#B06D1E' }}>{formatTime(startTime)}</Text>
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
            style={{
              backgroundColor: themedColors.secondaryBackground,
              borderWidth: 1,
              borderColor: themedColors.border,
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 12,
              marginBottom: 20,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
            onPress={() => {
              Haptics.selectionAsync();
              setShowEndTimePicker(true);
            }}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {Platform.OS === "ios" && (
                <SymbolView
                  name="clock.badge.checkmark"
                  style={{ width: 20, height: 20 }}
                  tintColor={Platform.select({ ios: PlatformColor("systemOrange") as unknown as string, default: "#FF9500" })}
                />
              )}
              <Text style={{ fontSize: 16, color: themedColors.text, marginLeft: 8 }}>End Time</Text>
            </View>
            <Text style={{ fontSize: 16, color: '#B06D1E' }}>{formatTime(endTime)}</Text>
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
          <Text style={{ fontSize: 14, fontWeight: '600', color: themedColors.text, marginBottom: 12 }}>Location (Optional)</Text>

          {/* Street */}
          <View style={{ marginBottom: 12 }}>
            <TextInput
              style={{
                backgroundColor: themedColors.secondaryBackground,
                borderWidth: 1,
                borderColor: themedColors.border,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 16,
                color: themedColors.text,
                minHeight: 48,
              }}
              placeholder="Street Address"
              placeholderTextColor={themedColors.placeholderText}
              value={street}
              onChangeText={setStreet}
              clearButtonMode="while-editing"
              enablesReturnKeyAutomatically
              returnKeyType="next"
            />
          </View>

          {/* City & State */}
          <View style={{ flexDirection: 'row', marginBottom: 12, gap: 12 }}>
            <View style={{ flex: 1 }}>
              <TextInput
                style={{
                  backgroundColor: themedColors.secondaryBackground,
                  borderWidth: 1,
                  borderColor: themedColors.border,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  fontSize: 16,
                  color: themedColors.text,
                  minHeight: 48,
                }}
                placeholder="City"
                placeholderTextColor={themedColors.placeholderText}
                value={city}
                onChangeText={setCity}
                clearButtonMode="while-editing"
                enablesReturnKeyAutomatically
                returnKeyType="next"
              />
            </View>
            <View style={{ width: 96 }}>
              <TextInput
                style={{
                  backgroundColor: themedColors.secondaryBackground,
                  borderWidth: 1,
                  borderColor: themedColors.border,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  fontSize: 16,
                  color: themedColors.text,
                  minHeight: 48,
                }}
                placeholder="State"
                placeholderTextColor={themedColors.placeholderText}
                value={state}
                onChangeText={setState}
                clearButtonMode="while-editing"
                enablesReturnKeyAutomatically
                returnKeyType="next"
                autoCapitalize="characters"
                maxLength={2}
              />
            </View>
          </View>

          {/* Postal Code */}
          <View style={{ marginBottom: 32 }}>
            <TextInput
              style={{
                backgroundColor: themedColors.secondaryBackground,
                borderWidth: 1,
                borderColor: themedColors.border,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 16,
                color: themedColors.text,
                minHeight: 48,
              }}
              placeholder="Postal Code"
              placeholderTextColor={themedColors.placeholderText}
              value={postalCode}
              onChangeText={setPostalCode}
              clearButtonMode="while-editing"
              enablesReturnKeyAutomatically
              returnKeyType="done"
              keyboardType="number-pad"
              maxLength={10}
            />
          </View>
        </View>
      </ScrollView>

      {/* Create Button - Fixed at bottom */}
      <View 
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: themedColors.secondaryBackground,
          borderTopWidth: 1,
          borderTopColor: themedColors.border,
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: insets.bottom + 12,
        }}
      >
        <TouchableOpacity
          style={{
            backgroundColor: loading ? 'rgba(176, 109, 30, 0.7)' : '#B06D1E',
            borderRadius: 12,
            paddingVertical: 16,
            alignItems: 'center',
          }}
          onPress={handleCreateEvent}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {Platform.OS === "ios" && (
                <SymbolView
                  name="plus.circle.fill"
                  style={{ width: 20, height: 20, marginRight: 8 }}
                  tintColor="#FFFFFF"
                />
              )}
              <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 16 }}>Create Event</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
