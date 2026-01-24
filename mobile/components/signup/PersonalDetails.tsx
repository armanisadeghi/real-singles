import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useState, useEffect } from "react";
import { Platform, ScrollView, Text, TextInput, View } from "react-native";
import RNPickerSelect from "react-native-picker-select";
import GradientButton from "../ui/GradientButton";
import { COUNTRY_OPTIONS, getZodiacFromDate, ZODIAC_OPTIONS } from "@/constants/options";

const PersonalDetails = ({ data, updateData, onNext, error }: any) => {
  const [validationError, setValidationError] = useState("");

  // Initialize country to US if not set
  useEffect(() => {
    if (!data.Country) {
      updateData({ Country: "US" });
    }
  }, []);

  // Auto-calculate zodiac sign when DOB changes
  useEffect(() => {
    if (data.DOB) {
      const zodiac = getZodiacFromDate(data.DOB);
      if (zodiac && zodiac !== data.HSign) {
        updateData({ HSign: zodiac });
      }
    }
  }, [data.DOB]);

  useEffect(() => {
    let isMounted = true;

    const loadAppleUserData = async () => {
      try {
        const keys = [
          "appleUserFirstName",
          "appleUserLastName",
          "appleUserName",
          "appleUserEmail",
        ];
        const values = await AsyncStorage.multiGet(keys);

        if (!isMounted) return;

        const dataMap = Object.fromEntries(values);
        const updatedFields: any = {
            FirstName: dataMap.appleUserFirstName || "",
            LastName: dataMap.appleUserLastName || "",
            DisplayName: dataMap.appleUserName || "",
          };

          // only set Email if Apple Sign-In email exists
          if (dataMap.appleUserEmail) {
            updatedFields.Email = dataMap.appleUserEmail;
          }

          updateData(updatedFields);
      } catch (error) {
        console.error("Error fetching Apple user data:", error);
      }
    };

    loadAppleUserData();

    return () => {
      isMounted = false;
    };
  }, []);


  const handleNext = () => {
  setValidationError("");

  // Validate first name and last name
  if (!data.FirstName?.trim() || !data.LastName?.trim()) {
    setValidationError("First name and last name are required");
    return;
  }

  // Validate display name
  if (!data.DisplayName?.trim()) {
    setValidationError("Display name is required");
    return;
  }

  // Validate date of birth
  if (!data.DOB) {
    setValidationError("Date of birth is required");
    return;
  }

  if (!data.City?.trim()) {
    setValidationError("City is required");
    return;
  }

  if (!data.State?.trim()) {
    setValidationError("State is required");
    return;
  }

  // Validate date format (MM/DD/YYYY)
  const dateRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/;
  if (!dateRegex.test(data.DOB)) {
    setValidationError("Please enter a valid date in MM/DD/YYYY format");
    return;
  }

  // Parse date parts
  const [month, day, year] = data.DOB.split("/").map((num: any) => parseInt(num, 10));

  // Create date object
  const birthDate = new Date(year, month - 1, day);

  // Verify the date is valid
  if (
    birthDate.getFullYear() !== year ||
    birthDate.getMonth() !== month - 1 ||
    birthDate.getDate() !== day
  ) {
    setValidationError("Please enter a valid date");
    return;
  }

  // Check if date is reasonable
  const today = new Date();
  const minAge = new Date();
  minAge.setFullYear(today.getFullYear() - 18);
  const maxAge = new Date();
  maxAge.setFullYear(today.getFullYear() - 100);

  if (birthDate > today) {
    setValidationError("Birth date cannot be in the future");
    return;
  }

  if (birthDate > minAge) {
    setValidationError("You must be at least 18 years old");
    return;
  }

  if (birthDate < maxAge) {
    setValidationError("Please enter a valid birth date");
    return;
  }

  // Phone number validation
  if (!data.Phone) {
    setValidationError("Phone number is required");
    return;
  }

  const phoneRegex = /^\d{10,15}$/;
  if (!phoneRegex.test(data.Phone.toString().replace(/\D/g, ""))) {
    setValidationError("Please enter a valid phone number (10-15 digits)");
    return;
  }

  // Zip code validation
  if (!data.Zipcode) {
    setValidationError("Zip code is required");
    return;
  }

  if (data.Zipcode.length > 9) {
    setValidationError("Please enter a valid zip code");
    return;
  }

  // Country validation
  if (!data.Country) {
    setValidationError("Country is required");
    return;
  }

  // Zodiac sign is auto-calculated from DOB, so no validation needed
  // If DOB is valid, zodiac will be calculated

  // If everything is valid
  onNext();
};


  return (
    <ScrollView className="flex-1 bg-background">
    <View className="mt-20 px-6 w-full">
      <View className="flex-row items-center justify-between px-2">
        <View className="">
          <Text className="text-primary font-bold text-2xl mb-2">
            Personal details
          </Text>
          <Text className="text-dark font-normal text-sm">
            Please Select An Option Below
          </Text>
        </View>
        <View className=""></View>
      </View>

      <View className="mt-16 px-6 bg-white rounded-2xl shadow-lg py-6">
        {/* First name and Last name (side by side) */}
        <View className="mb-4 flex-row gap-2">
          <View className="flex-1 border border-border rounded-[99] bg-light-200" 
              >
            <TextInput
              value={data.FirstName}
              onChangeText={(text) => updateData({ FirstName: text })}
              placeholder="First Name"
              placeholderTextColor="#B0B0B0"
              style={{paddingVertical: Platform.OS == 'ios' ? 18 : 10, paddingHorizontal: 16, flex: 1, color: 'black' }}
            />
          </View>

          <View className="flex-1 border border-border rounded-[99] bg-light-200">
            <TextInput
              value={data.LastName}
              onChangeText={(text) => updateData({ LastName: text })}
              placeholder="Last Name"
              placeholderTextColor="#B0B0B0"
              style={{ paddingVertical: Platform.OS == 'ios' ? 18 : 10, paddingHorizontal: 16, color: 'black' }}
            />
          </View>
        </View>

        {/* Display name (full width) */}
        <View className="mb-4 border border-border rounded-[99] bg-light-200">
          <TextInput
            value={data.DisplayName}
            onChangeText={(text) => updateData({ DisplayName: text })}
            placeholder="Display Name"
            placeholderTextColor="#B0B0B0"
            style={{ paddingVertical: Platform.OS == 'ios' ? 18 : 10, paddingHorizontal: 16, color: 'black' }}
          />
        </View>

        {/* Birthday and Phone Number (side by side) */}
        <View className="flex-row mb-4 gap-2">
          <View className="flex-1 border border-border rounded-[99] bg-light-200">
            <TextInput
              value={data.DOB}
              onChangeText={(text) => updateData({ DOB: text })}
              placeholder="DOB(MM/DD/YYYY)"
              placeholderTextColor="#B0B0B0"
              style={{ paddingVertical: Platform.OS == 'ios' ? 18 : 10, paddingHorizontal: 16, color: 'black' }}
            />
          </View>

          <View className="flex-1 border border-border rounded-[99] bg-light-200">
            <TextInput
              value={data.Phone?.toString() || ""}
              onChangeText={(text) => updateData({ Phone: text })}
              placeholder="Phone Number"
              keyboardType="phone-pad"
              placeholderTextColor="#B0B0B0"
              style={{ paddingVertical: Platform.OS == 'ios' ? 18 : 10, paddingHorizontal: 16, color: 'black' }}
            />
          </View>
        </View>

        {/* Zip Code and Zodiac Sign (side by side) */}
        <View className="flex-row mb-4 gap-2">
          <View className="flex-1 border border-border rounded-[99] bg-light-200">
            <TextInput
              value={data.Zipcode}
              onChangeText={(text) => updateData({ Zipcode: text })}
              placeholder="Zip Code"
              placeholderTextColor="#B0B0B0"
              keyboardType="numeric"
              style={{ paddingVertical: Platform.OS == 'ios' ? 18 : 10, paddingHorizontal: 16, color: 'black' }}
            />
          </View>

          {/* Zodiac Sign - Auto-calculated from DOB (read-only display) */}
          <View className="flex-1 border border-border rounded-[99] bg-gray-100">
            <View style={{ paddingVertical: Platform.OS == 'ios' ? 18 : 10, paddingHorizontal: 16 }}>
              <Text style={{ color: data.HSign ? 'black' : '#B0B0B0' }}>
                {data.HSign 
                  ? ZODIAC_OPTIONS.find(z => z.value === data.HSign)?.label || data.HSign
                  : 'Zodiac (from DOB)'}
              </Text>
            </View>
          </View>
        </View>

        {/* Country dropdown */}
        <View className="mb-4 border border-border rounded-[99] bg-light-200">
          <RNPickerSelect
            value={data.Country || "US"}
            onValueChange={(value) => updateData({ Country: value })}
            items={COUNTRY_OPTIONS}
            placeholder={{ label: "Select Country", value: null }}
            style={{
              inputIOS: {
                paddingVertical: 18,
                paddingHorizontal: 16,
                color: 'black',
              },
              inputAndroid: {
                paddingVertical: 10,
                paddingHorizontal: 16,
                color: 'black',
              },
              placeholder: {
                color: '#B0B0B0',
              },
            }}
          />
        </View>

          <View className="flex-row mb-4 gap-2">
          <View className="flex-1 border border-border rounded-[99] bg-light-200">
            <TextInput
              value={data.City}
              onChangeText={(text) => updateData({ City: text })}
              placeholder="City"
              placeholderTextColor="#B0B0B0"
              style={{ paddingVertical: Platform.OS == 'ios' ? 18 : 10, paddingHorizontal: 16, color: 'black' }}
            />
          </View>

          <View className="flex-1 border border-border rounded-[99] bg-light-200">
            <TextInput
              value={data.State}
              onChangeText={(text) => updateData({ State: text })}
              placeholder="State"
              placeholderTextColor="#B0B0B0"
              style={{ paddingVertical: Platform.OS == 'ios' ? 18 : 10, paddingHorizontal: 16 , color: 'black'}}
            />
          </View>
        </View>

        {/* Display validation error */}
        {validationError ? (
          <Text className="text-red-500 text-center text-sm px-2 mt-2">
            {validationError}
          </Text>
        ) : null}

        {/* Display parent component error if any */}
        {error ? (
          <Text className="text-red-500 text-center text-sm px-2 mt-2">
            {error}
          </Text>
        ) : null}
      </View>

      <GradientButton
        text="Next"
        onPress={handleNext}
        containerStyle={{
          marginTop: 30,
          width: "50%",
          marginHorizontal: "auto",
        }}
      />
    </View>
    </ScrollView>
  );
};

export default PersonalDetails;
