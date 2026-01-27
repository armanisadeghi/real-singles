import ContactForm from "@/components/forms/ContactForm";
import React from "react";
import { Text, View } from "react-native";
import Toast from "react-native-toast-message";

export default function CreateEvent() {
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
                <Text className="text-sm font-normal text-[#686A6F] leading-5">If you have any questions about app, please fill the form below. We will get back you within 24hours.</Text>
            </View>
            <ContactForm showMsg={showMsg}/>
        </View>

      </View>
    </>
  );
}
