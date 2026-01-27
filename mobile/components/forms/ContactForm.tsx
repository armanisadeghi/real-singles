import { contactUs } from "@/lib/api";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import LinearBg from "../LinearBg";

interface Formdata {
  Name: string;
  Phone: string;
  Email: string;
  Message: string;
}

export const Label = ({ text, marginLeft }: { text: string, marginLeft?: string }) => (
  <Text
    className={`text-[12px] text-gray font-normal mb-1 ${marginLeft ? `ml-${marginLeft}` : ""}`}
    style={{ fontFamily: "SF Pro Display" }}
  >
    {text}
  </Text>
);

export default function ContactForm({showMsg} : {showMsg?: (res: any) => void}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Formdata>({
    Name: "",
    Phone: "",
    Email: "",
    Message: "",
  });

  const handleChange = (field: keyof Formdata, value: string) => {
    setFormData((prevData) => ({
      ...prevData,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.Name || !formData.Email || !formData.Message) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }
    if (!formData.Email.includes("@")) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);

    try {
      const data = new FormData();
      data.append("Name", formData.Name);
      data.append("Phone", formData.Phone);
      data.append("Email", formData.Email);
      data.append("Message", formData.Message);

      console.log("Submitting contact form with data:", data);

      const res = await contactUs(data);
      if (res?.success) {
        showMsg?.(res);
        console.log("Contact form submitted successfully:", res);
        // setFormData({
        //   Name: "",
        //   Phone: "",
        //   Email: "",test
        //   Message: "",
        // });
      } else {
        showMsg?.(res);
        console.log("Failed to submit contact form:", res.msg);
      }
    } catch (error) {
      console.error("Error submitting contact form:", error);
      showMsg?.({ success: false, msg: "Something went wrong" });
    }finally{
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <View
        className="bg-white w-full rounded-[22px] px-[22px] py-[30px] flex-col gap-5"
        style={styles.shadow}
      >
        <View>
          <Label text="Full Name" />
          <TextInput
            placeholder="John Doe"
            placeholderTextColor={"#A0A0A0"}
            className="border border-border bg-light-100 rounded-full px-[15px] py-[12px]"
            value={formData.Name}
            onChangeText={(text) => handleChange("Name", text)}
            autoComplete="name"
            importantForAutofill="yes"
            textContentType="name"
          />
        </View>

        <View>
          <Label text="Phone Number" />
          <TextInput
            placeholder="+1(41)4258741"
            placeholderTextColor={"#A0A0A0"}
            keyboardType="phone-pad"
            className="border border-border bg-light-100 rounded-full px-[15px] py-[12px]"
            value={formData.Phone}
            onChangeText={(text) => handleChange("Phone", text)}
            autoComplete="tel"
            importantForAutofill="yes"
            textContentType="telephoneNumber"
          />
        </View>

        <View>
          <Label text="Email Address" />
          <TextInput
            placeholder="email@example.com"
            placeholderTextColor={"#A0A0A0"}
            keyboardType="email-address"
            className="border border-border bg-light-100 rounded-full px-[15px] py-[12px]"
            value={formData.Email}
            onChangeText={(text) => handleChange("Email", text)}
            autoComplete="email"
            importantForAutofill="yes"
            textContentType="emailAddress"
          />
        </View>

        <View>
          <Label text="Leave us Message" />
          <TextInput
            placeholder="Your message here"
            placeholderTextColor={"#A0A0A0"}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            className="border border-border bg-light-100 rounded-[15px] px-[15px] py-[12px]"
            value={formData.Message}
            onChangeText={(text) => handleChange("Message", text)}
            style={{ height: 100 }} // Set a fixed height for multiline input
          />
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
            <Text className="text-center text-white font-bold text-[16px]">
              Send Message
            </Text>
          )}
        </LinearBg>
      </TouchableOpacity>
    </>
  );
}

export const styles = StyleSheet.create({
  shadow: {
    shadowColor: "#000000",
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
});
