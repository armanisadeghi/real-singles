import { icons } from "@/constants/icons";
import { checkEmailExist } from "@/lib/api";
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
  const [checked, setChecked] = useState(false);
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

      if (!data.Username) return setValidationError("Username is required");
      if (!data.Email) return setValidationError("Email is required");
      if (!data.Email.includes('@')) return setValidationError("Please enter a valid email");
      if (!data.Password) return setValidationError("Password is required");
      if (data.Password.length < 6) return setValidationError("Password must be at least 6 characters");
      if (!checked) return;

      // 🔒 Ensure email update is synced before next step
      updateData({ Email: data.Email.trim() });

      const emailCheck = new FormData();
      emailCheck.append("Email", data.Email);

      try {
        console.log("data.Email in login/signup screen=>>>>", data.Email);
        const res = await checkEmailExist(emailCheck);
        console.log("Email check response:", res);
        if (res?.success) {
          onNext(); // this moves to next step
        } else {
          setValidationError(res?.msg || "Email already exists");
        }
      } catch (error) {
        console.log("Error checking email:", error);
        setValidationError("Email Already exists, Please try with another one.");
      }
    };

 


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
              placeholder="Password"
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

export default SignupLogin;