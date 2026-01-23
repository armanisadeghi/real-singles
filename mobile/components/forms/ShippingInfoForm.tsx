import { acceptOrderRedeemPoints } from "@/lib/api";
import React, { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import Toast from "react-native-toast-message";
import GradientButton from "../ui/GradientButton";

const Label = ({ text }: { text: string }) => (
  <Text className="text-[12px] text-gray font-normal mb-1" style={{ fontFamily: 'SF Pro Display' }}>
    {text}
  </Text>
);

interface ShippingFormData {
  Building: string;
  Street: string;
  State: string;
  City: string;
  Zipcode: string;
}

interface ShippingInfoFormProps {
  productId: any;
  selectedUsers?: any;
  productPoints?: any;
  redeemForYou?: string;
  onSubmitSuccess: () => void;
}

export default function ShippingInfoForm({ productId, selectedUsers, redeemForYou, productPoints, onSubmitSuccess }: ShippingInfoFormProps) {
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<ShippingFormData>({
    Building: "",
    Street: "",
    State: "",
    City: "",
    Zipcode: ""
  });

  const updateFormData = (field: keyof ShippingFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    console.log("Event Form Data:", formData);
    console.log("Product ID:", productId);
    console.log("Selected Users:", selectedUsers);
    try {
      const data = new FormData();
      data.append("ProductID", productId);
      data.append("Building", formData.Building);
      data.append("Street", formData.Street);
      data.append("State", formData.State);
      data.append("City", formData.City);
      data.append("Zipcode", formData.Zipcode);
      data.append("ProductPoint", productPoints);
      data.append("Address", formData.Street + ", " + formData.City + ", " + formData.Zipcode);
      data.append("InitialProductPoint", "0");

      const res = await acceptOrderRedeemPoints(data);
      console.log("Response from acceptOrderRedeemPoints:", res);

      if (res?.success) {
        Toast.show({
          type: "success",
          text1: res?.msg || "Order Accepted Successfully",
          position: "bottom",
          visibilityTime: 2000,
          autoHide: true,
        });
        onSubmitSuccess();
      } else {
        Toast.show({
          type: "error",
          text1: res?.msg || "Failed to accept order",
          position: "bottom",
          visibilityTime: 2000,
          autoHide: true,
        });
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      Toast.show({
        type: "error",
        text1: "Something went wrong",
        position: "bottom",
        visibilityTime: 2000,
        autoHide: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <View
        className="bg-white rounded-[22px] px-[22px] py-[30px] flex-col gap-5"
        style={styles.shadow}
      >
        <Toast />
        <View>
          <Label text="Building / Floor" />
          <TextInput
            value={formData.Building}
            onChangeText={(text) => updateFormData("Building", text)}
            className="border border-border rounded-full px-[15px] py-[12px]" 
            placeholder="Enter your Building Number" 
            placeholderTextColor="gray"
            />
        </View>

        <View>
          <Label text="Street" />
          <TextInput
            className="border border-border rounded-full px-[15px] py-[12px]"
            placeholder="Enter your Street Address"
            value={formData.Street}
            onChangeText={(text) => updateFormData("Street", text)}
            placeholderTextColor="gray"
          />
        </View>

        <View className="flex-row justify-between gap-3">
          <View className="flex-1">
            <Label text="State" />
            <TextInput
              className="border border-border rounded-full px-[15px] py-[12px]"
              placeholder="Enter your State"
              value={formData.State}
              onChangeText={(text) => updateFormData("State", text)}
              placeholderTextColor="gray"
            />
          </View>

          <View className="flex-1">
            <Label text="City" />
            <TextInput
              value={formData.City}
              placeholder="Enter your City"
              onChangeText={(text) => updateFormData("City", text)}
              className="border border-border rounded-full px-[15px] py-[12px]" 
              placeholderTextColor="gray"
              />
          </View>
        </View>

        <View>
          <Label text="Postal Code" />
          <TextInput
            value={formData.Zipcode}
            onChangeText={(text) => updateFormData("Zipcode", text)}
            className="border border-border rounded-full px-[15px] py-[12px]" placeholder="*** ***" placeholderTextColor="gray" />
        </View>
      </View>
      <Text className="my-4 text-[#FF0000] text-[10px] font-normal text-center">
        *Your address or any related information will not be shared with anyone
      </Text>
      <GradientButton
        text={loading ? "Processing..." : "Accept Order"}
        containerStyle={{ marginTop: 40, marginBottom: 80 }}
        onPress={handleSubmit}
      />
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
