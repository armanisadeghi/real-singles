import ContactForm from "@/components/forms/ContactForm";
import { useThemeColors } from "@/context/ThemeContext";
import React from "react";
import { Platform, PlatformColor, Text, View } from "react-native";
import Toast from "react-native-toast-message";

export default function CreateEvent() {
  const colors = useThemeColors();

  const themedColors = {
    secondaryText: Platform.OS === 'ios' ? (PlatformColor('secondaryLabel') as unknown as string) : colors.onSurfaceVariant,
  };

  const showMsg = (e: any) => {
    console.log("Contact form submitted successfully:", e);
    Toast.show({
      type: e?.success ? "success" : "error",
      text1: e?.msg || "Message sent successfully",
      position: "bottom",
      visibilityTime: 2000,
      autoHide: true,
    });
  }
  return (
    <>
      {/* Native header is configured in _layout.tsx - no custom header needed */}
      <View className="flex-1 bg-background">
        <Toast/>
        <View className="mt-6 px-4">
            <View className="mb-6">
                <Text className="text-primary font-bold text-lg">Contact Details</Text>
                <Text style={{ color: themedColors.secondaryText }} className="text-sm font-normal leading-5">If you have any questions about app, please fill the form below. We will get back you within 24hours.</Text>
            </View>
            <ContactForm showMsg={showMsg}/>
        </View>

      </View>
    </>
  );
}
