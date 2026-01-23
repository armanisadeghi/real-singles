import { icons } from "@/constants/icons";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Image, Modal, Platform, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import Pdf from "react-native-pdf";
import { WebView } from "react-native-webview";
import GradientButton from "../ui/GradientButton";

const SignupLogin = ({
  data,
  updateData,
  onNext,
  error,
}: any) => {
  const [validationError, setValidationError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [checked, setChecked] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [showWebView, setShowWebView] = useState(false);
  const [webViewUrl, setWebViewUrl] = useState("");
  const [webViewTitle, setWebViewTitle] = useState("");
  const [visible, setVisible] = useState(false);
  const [pdfSource, setPdfSource] = useState<any>(null);
  
  const openModal = (source: any) => {
    setPdfSource(source);
    setVisible(true);
  };

  const handleNext = async () => {
    setValidationError("");

    // Validation
    if (!data.Username) return setValidationError("Username is required");
    if (!data.Email) return setValidationError("Email is required");
    if (!data.Email.includes('@')) return setValidationError("Please enter a valid email");
    if (!data.Password) return setValidationError("Password is required");
    if (data.Password.length < 8) return setValidationError("Password must be at least 8 characters");
    if (data.Password !== confirmPassword) return setValidationError("Passwords do not match");
    if (!checked) return setValidationError("Please agree to the Terms and Privacy Policy");

    // Ensure email update is synced before next step
    updateData({ Email: data.Email.trim() });

    setIsChecking(true);
    try {
      console.log("Checking email availability:", data.Email);
      
      // Check if email exists in Supabase auth
      // We can't directly check email existence, but we can try a sign-in 
      // and check the error. For now, we'll just proceed and let signup handle it.
      // The signup endpoint will return an error if email already exists.
      
      onNext(); // Move to next step
    } catch (error: any) {
      console.log("Error in signup validation:", error);
      setValidationError(error?.message || "An error occurred. Please try again.");
    } finally {
      setIsChecking(false);
    }
  };

  // Check if passwords match for visual feedback
  const passwordsMatch = data.Password && confirmPassword && data.Password === confirmPassword;
  const showPasswordMismatch = confirmPassword && data.Password !== confirmPassword;

 


    // Show Privacy Policy
  const goToPrivacy = () => {
    setWebViewUrl(
      "https://docs.google.com/document/d/e/2PACX-1vRo0peyatDv55GLYVJIEVaeJIH6VAxRZ3bCp83JSoHMRseFUpaGs-Fwaros6AOnJqVFrSNwaVjEta-x/pub"
    );
    setWebViewTitle("Privacy Policy");
    setShowWebView(true);
  };

  // Show Terms & Conditions
  const goToTerms = () => {
    setWebViewUrl(
      "https://docs.google.com/document/d/e/2PACX-1vTRfcRIaQY7Q7-3rVF5fIzK4gCSCdYNivy-vZbN9ib3gEUSJQzUJnFYOMEWcTXJwph7iSTcyGnAuUR_/pub"
    );
    setWebViewTitle("Terms & Conditions");
    setShowWebView(true);
  };


  return (
    <ScrollView className="flex-1 bg-backgground">
    <View className="mt-20 px-6 w-full">
      <View className="flex-row justify-between items-center">
        <View className="w-3/4">
          <Text className="text-primary font-bold text-2xl mb-2">Sign Up</Text>
          <Text className="text-dark font-normal text-sm">
            Please Fill Out The Required Fields
          </Text>
        </View>
      </View>



  {/* WebView Modal */}
  { Platform.OS == 'ios' ? 
     <Modal
        visible={visible}
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <SafeAreaView className="flex-1 bg-white">
          {/* Header */}
          <View className="flex-row justify-between items-center p-4 bg-gray-100 border-b border-gray-300">
            <Text className="text-base font-bold text-gray-800">
              {pdfSource === require("../../assets/docs/PrivacyPolicy.pdf")
                ? "Privacy Policy"
                : "Terms & Conditions"}
            </Text>
            <TouchableOpacity onPress={() => setVisible(false)}>
              <Text className="text-xl text-gray-600">✕</Text>
            </TouchableOpacity>
          </View>

          {/* PDF Viewer */}
          {pdfSource && (
            <Pdf
              source={pdfSource}
              style={{ flex: 1, width: "100%" }}
              onError={(error) => console.log("PDF load error:", error)}
            />
          )}
        </SafeAreaView>
      </Modal>
  :
   <Modal
      visible={showWebView}
      animationType="slide"
      onRequestClose={() => setShowWebView(false)}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
        <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-300">
          <Text className="text-lg font-semibold">{webViewTitle}</Text>
          <TouchableOpacity onPress={() => setShowWebView(false)}>
            <Text className="text-black-500 font-bold text-lg">✕</Text>
          </TouchableOpacity>
        </View>

        <WebView
          source={{ uri: webViewUrl }}
          startInLoadingState
          style={{ flex: 1 }}
         
        />
      </SafeAreaView>
    </Modal>}

      <View className="mt-16 px-6 bg-white rounded-2xl shadow-lg py-6">
        {/* Username Input */}
        <View className="mb-5">
          <View className="flex-row items-center border border-border rounded-[99] px-3 bg-light-200" 
          style={{paddingVertical: Platform.OS == 'ios' ? 15 : 5}}>
            <Image 
              source={icons.username} 
              style={{ width: 15, height: 15, marginRight: 10 }} 
              resizeMode="contain" 
            />
            <TextInput
              value={data.Username}
              onChangeText={(text) => updateData({ Username: text })}
              placeholder="Username"
              placeholderTextColor="#B0B0B0"
              style={{ flex: 1, color: 'black' }}
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Email Input */}
        <View className="mb-5">
          <View className="flex-row items-center border border-border rounded-[99] px-3 bg-light-200"
          style={{paddingVertical: Platform.OS == 'ios' ? 15 : 5}}>
            <Image 
              source={icons.email} 
              style={{ width: 15, height: 15, marginRight: 10 }} 
              resizeMode="contain" 
            />
            <TextInput
              value={data.Email}
              onChangeText={(text) => updateData({ Email: text })}
              placeholder="Email"
              placeholderTextColor="#B0B0B0"
              style={{ flex: 1 , color: 'black'}}
              keyboardType="email-address"
              autoCapitalize="none"
              
            />
          </View>
        </View>

        {/* Password Input */}
        <View className="mb-5">
          <View className="flex-row items-center border border-border rounded-[99] pl-3 pr-5 bg-light-200"
          style={{paddingVertical: Platform.OS == 'ios' ? 15 : 5}}>
            <Image 
              source={icons.lock} 
              style={{ width: 15, height: 15, marginRight: 10 }} 
              resizeMode="contain" 
            />
            <TextInput
              value={data.Password}
              onChangeText={(text) => updateData({ Password: text })}
              placeholder="Password (min 8 characters)"
              placeholderTextColor="#B0B0B0"
              secureTextEntry={!showPassword}
              className="text-dark"
              style={{ flex: 1, color: 'black' }}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Image 
                source={
                  showPassword 
                    ? icons.eyeClosed 
                    : icons.eyeOpen
                } 
                style={{ width: 15, height: 15 }} 
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Confirm Password Input */}
        <View className="mb-5">
          <View 
            className="flex-row items-center border rounded-[99] pl-3 pr-5 bg-light-200"
            style={{
              paddingVertical: Platform.OS == 'ios' ? 15 : 5,
              borderColor: showPasswordMismatch ? '#ef4444' : passwordsMatch ? '#22c55e' : '#e5e7eb'
            }}
          >
            <Image 
              source={icons.lock} 
              style={{ width: 15, height: 15, marginRight: 10 }} 
              resizeMode="contain" 
            />
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm Password"
              placeholderTextColor="#B0B0B0"
              secureTextEntry={!showConfirmPassword}
              className="text-dark"
              style={{ flex: 1, color: 'black' }}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <Image 
                source={
                  showConfirmPassword 
                    ? icons.eyeClosed 
                    : icons.eyeOpen
                } 
                style={{ width: 15, height: 15 }} 
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
          {/* Password match indicator */}
          {confirmPassword ? (
            <Text 
              className="text-xs mt-1 ml-3"
              style={{ color: passwordsMatch ? '#22c55e' : '#ef4444' }}
            >
              {passwordsMatch ? '✓ Passwords match' : 'Passwords do not match'}
            </Text>
          ) : null}
        </View>

        {/* Display validation error */}
        {validationError ? (
          <Text className="text-red-500 text-center text-sm px-2 mb-2">{validationError}</Text>
        ) : null}
        
        {/* Display parent component error if any */}
        {error ? (
          <Text className="text-red-500 text-sm px-2 mb-2">{error}</Text>
        ) : null}
      </View>


   {Platform.OS == 'ios' ?

    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 20,  }}>
      <TouchableOpacity onPress={() => setChecked(!checked)}>
        {checked ? (
          <Ionicons name="checkbox" size={28} color="#C07618" />
        ) : (
          <Ionicons name="square-outline" size={28} color="#C07618" />
        )}
      </TouchableOpacity>

      <Text style={{ marginLeft: 8, color: "#333", fontSize: 15}}>
        Please agree to our{" "}
        <Text
          style={{ color: "skyblue", textDecorationLine: "underline"}}
          onPress={ ()=> openModal(require("../../assets/docs/TermsConditions.pdf"))}
        >
          Terms and Conditions
        </Text>{" "}
        and{" "}
        <Text
          style={{ color: "skyblue", textDecorationLine: "underline"}}
          onPress={()=>  openModal(require("../../assets/docs/PrivacyPolicy.pdf"))}
        >
          Privacy Policy
        </Text>
        {" "}to continue.
      </Text>
    </View>

   :
   <View style={{ flexDirection: "row", alignItems: "center", marginTop: 20 , marginRight: 5}}>
      <TouchableOpacity onPress={() => setChecked(!checked)}>
        {checked ? (
          <Ionicons name="checkbox" size={28} color="#C07618" />
        ) : (
          <Ionicons name="square-outline" size={28} color="#C07618" />
        )}
      </TouchableOpacity>

      <Text style={{ marginLeft: 8, color: "#333", fontSize: 15 }}>
        Please agree to our{" "}
        <Text
          style={{ color: "skyblue", textDecorationLine: "underline"}}
          onPress={goToTerms}
        >
          Terms and Conditions
        </Text>{" "}
        and{" "}
        <Text
          style={{ color: "skyblue", textDecorationLine: "underline"}}
          onPress={goToPrivacy}
        >
          Privacy Policy
        </Text>
        {" "}to continue.
      </Text>
    </View>}
      
      <GradientButton
        text={isChecking ? "Please wait..." : "Next"}
        onPress={handleNext}
        disabled={isChecking}
        containerStyle={{
          marginTop: 30,
          width: "50%",
          marginHorizontal: "auto",
          opacity: isChecking ? 0.7 : 1,
        }}
      />
    </View>
    </ScrollView>
  );
};

export default SignupLogin;