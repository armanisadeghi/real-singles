import LinearBg from "@/components/LinearBg";
import SociaLoginButtons from "@/components/SociaLoginButtons";
import GradientButton from "@/components/ui/GradientButton";
import { icons } from "@/constants/icons";
import { forgotPassword, forgotPassword2, login, verifyOtp } from "@/lib/api";
import {
  addCurrentUserId,
  getCurrentUserId,
  getToken,
  removeCurrentUserId,
  removeToken,
  storeToken,
} from "@/utils/token";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  Keyboard,
  Modal,
  Platform,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import Pdf from "react-native-pdf";
import Toast from "react-native-toast-message";
import { WebView } from "react-native-webview";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotEmailError, setForgotEmailError] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

 const [showWebView, setShowWebView] = useState(false);
 const [webViewUrl, setWebViewUrl] = useState("");
 const [webViewTitle, setWebViewTitle] = useState("");

  const [visible, setVisible] = useState(false);
  const [pdfSource, setPdfSource] = useState<any>(null);

  const openModal = (source: any) => {
    setPdfSource(source);
    setVisible(true);
  };


  React.useEffect(()=>{
    console.log(" in Login screen"); 
  },[])

  const handleEmailChange = (text: string) => {
    setEmail(text);
    setEmailError("");
    setGeneralError("");
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    setPasswordError("");
    setGeneralError("");
  };

  const handleLogin = async () => {
    Keyboard.dismiss();
    setEmailError("");
    setPasswordError("");
    setGeneralError("");

    let isValid = true;

    if (!email.trim()) {
      setEmailError("Email is required");
      isValid = false;
    } else if (!email.includes("@")) {
      setEmailError("Please enter a valid email address");
      isValid = false;
    }

    if (!password) {
      setPasswordError("Password is required");
      isValid = false;
    }

    if (!isValid) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("Email", email);
      formData.append("Password", password);
      formData.append("Latitude", '37.4220936');
      formData.append("Longitude", '-122.083922');

      console.log("formdata in login:", formData);
      

      const res = await login(formData);
      console.log("Login response:", res);

      if (res?.success) {
        const token = await getToken();
        if(token){
          await removeToken();
        }
        await storeToken(res?.data?.token);
        const id = await getCurrentUserId();
        if (id) {
          await removeCurrentUserId();
        }
        await addCurrentUserId(res?.data?.ID);
        const storedToken = await getToken();
        if (storedToken) {
          router.replace("/(tabs)");
        } else {
          setGeneralError("Token not stored");
        }
      } else {
        setGeneralError(res?.msg || "Login failed. Please try again.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setGeneralError("Something went wrong. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) {
      setForgotEmailError("Email is required");
      return;
    } else if (!forgotEmail.includes("@")) {
      setForgotEmailError("Please enter a valid email address");
      return;
    }

    setSendingEmail(true);
    try {
      const emailData = new FormData();
      emailData.append("Email", forgotEmail);

      const res = await forgotPassword(emailData);
      console.log("Forgot password response:", res);

      if (res?.success) {
        Toast.show({
          type: "success",
          text1: res?.msg || "Otp sent to your email",
          text2: "Please check your email for password reset instructions",
          position: "bottom",
        });
        setOtpSent(true);
      } else {
        setForgotEmailError(
          res?.msg || "Failed to send reset email. Please try again."
        );
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      setForgotEmailError("Something went wrong. Please try again later.");
    } finally {
      setSendingEmail(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      setOtpError("OTP is required");
      return;
    }

    setVerifyingOtp(true);
    try {
      const otpData = new FormData();
      otpData.append("Email", forgotEmail);
      otpData.append("otp", otp);

      const res = await verifyOtp(otpData);
      console.log("Verify OTP response:", res);

      if (res?.success) {
        Toast.show({
          type: "success",
          text1: res?.msg || "OTP verified successfully",
          position: "bottom",
        });
        setShowResetPassword(true); // Show password reset form
      } else {
        setOtpError(res?.msg || "Invalid OTP. Please try again.");
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      setOtpError("Something went wrong. Please try again later.");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim()) {
      setNewPasswordError("New password is required");
      return;
    } else if (newPassword.length < 6) {
      setNewPasswordError("Password must be at least 6 characters");
      return;
    }

    setResettingPassword(true);
    try {
      const resetData = new FormData();
      resetData.append("Email", forgotEmail);
      resetData.append("NewPassword", newPassword);

      const res = await forgotPassword2(resetData);
      console.log("Reset password response:", res);

      if (res?.success) {
        Toast.show({
          type: "success",
          text1: res?.msg || "Password reset successfully",
          text2: "You can now login with your new password",
          position: "bottom",
        });
        // Reset all states and close modal
        setForgotEmail("");
        setOtp("");
        setNewPassword("");
        setOtpSent(false);
        setShowResetPassword(false);
        setShowForgotPasswordModal(false);
      } else {
        setNewPasswordError(
          res?.msg || "Failed to reset password. Please try again."
        );
      }
    } catch (error) {
      console.error("Password reset error:", error);
      setNewPasswordError("Something went wrong. Please try again later.");
    } finally {
      setResettingPassword(false);
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
    <SafeAreaView className="flex-1 bg-backgground">
      <Toast />

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

    
      <View className="mt-20 px-6 w-full">
        <View className="flex-row justify-between items-center">
          <View className="w-3/4">
            <Text className="text-primary font-bold text-2xl mb-2">
              Welcome Back
            </Text>
            <Text className="text-dark font-normal text-sm">
              Access your account by using your email and password
            </Text>
          </View>
          <View></View>
        </View>

        <View className="mt-8 px-6 bg-white rounded-2xl shadow-lg py-10">
          {generalError ? (
            <Text className="text-red-500 mb-4 text-center px-8">
              {generalError}
            </Text>
          ) : null}

          {/* Email Input */}
          <View className="mb-4">
            <View className="flex-row items-center justify-center py-2 px-4 gap-2 bg-light-200 border-border rounded-[99]">
              <Image source={icons.email} resizeMode="contain" />
              <TextInput
                placeholder="Email or Phone Number"
                placeholderTextColor="#B0B0B0"
                value={email}
                onChangeText={handleEmailChange}
                keyboardType="email-address"
                autoCapitalize="none"
                style={{
                  width: "80%",
                  paddingInlineStart: 10,
                  paddingVertical: 10,
                  color: 'black'
                }}
              />
            </View>
            {emailError ? (
              <Text className="text-red-500 text-xs text-start px-8">
                {emailError}
              </Text>
            ) : null}
          </View>

          {/* Password Input */}
          <View className="mb-3">
            <View className="relative flex-row items-center justify-center py-2 px-4 gap-2 bg-light-200 border-border rounded-[99]">
              <Image source={icons.lock} resizeMode="contain" />
              <TextInput
                placeholder="Password"
                placeholderTextColor="#B0B0B0"
                value={password}
                onChangeText={handlePasswordChange}
                secureTextEntry={!showPassword}
                className="text-dark"
                style={{
                  width: "73%",
                  paddingInlineStart: 10,
                  paddingVertical: 10,
                  color: 'black'
                }}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Image
                  source={showPassword ? icons.eyeClosed : icons.eyeOpen}
                  resizeMode="contain"
                  style={{ width: 15, height: 15 }}
                />
              </TouchableOpacity>
            </View>
            {passwordError ? (
              <Text className="text-red-500 text-xs text-start px-8">
                {passwordError}
              </Text>
            ) : null}
          </View>

          <View className="w-full flex-row justify-between items-center mt-4 mb-2">
            <View className="flex-row items-center">
              {/* <Text className="text-gray text-xs font-normal text-start mb-5 px-8">
                Remember me
              </Text> */}
            </View>
            <TouchableOpacity onPress={() => setShowForgotPasswordModal(true)}>
              <Text className="text-dark text-xs font-normal text-end mb-5 px-8">
                Forgot Password?
              </Text>
            </TouchableOpacity>
          </View>

          <GradientButton
            className=""
            text={isLoading ? "Logging in..." : "Login"}
            onPress={handleLogin}
            disabled={isLoading}
          />

         <View className="flex-row justify-center items-center mt-6 mb-6 gap-2">
            <Image source={icons.line} resizeMode="contain" />
            <Text className="font-medium text-xs text-dark">
              Or continue with{" "}
            </Text>
            <Image source={icons.line} resizeMode="contain" />
          </View>
         <SociaLoginButtons />

          {/* <TouchableOpacity className="flex-row justify-center items-center gap-2 my-2 bg-light-200 py-4 rounded-[99] border-border">
            <Image source={icons.facebook} resizeMode="contain" />
            <Text className="text-gray font-medium text-xs">
              Continue with Facebook
            </Text>
          </TouchableOpacity> */}
        </View>
        
        <View className="flex-row justify-center items-center mt-10 mb-5">
          <Text className="text-dark font-medium text-xs">
            Don&apos;t have an account?
          </Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/signup")}>
            <Text className="text-primary font-medium text-base"> Sign Up</Text>
          </TouchableOpacity>
        </View>

      {Platform.OS == 'ios' ?
        <View className="w-full flex-row justify-center items-center mt-4 space-x-4">
        <TouchableOpacity style={{marginRight: 30}}
         onPress={() =>
            openModal(require("../../assets/docs/PrivacyPolicy.pdf"))
          }>
          <Text className="text-dark underline text-[12px] text-blue-400">Privacy Policy</Text>
        </TouchableOpacity>

        <TouchableOpacity  onPress={() =>
            openModal(require("../../assets/docs/TermsConditions.pdf"))
          }>
          <Text className="text-dark underline text-[12px] text-blue-400">Terms & Conditions</Text>
        </TouchableOpacity>
      </View> 
      :
      
        <View className="w-full flex-row justify-center items-center mt-4 space-x-4">
        <TouchableOpacity style={{marginRight: 30}}
         onPress={goToPrivacy}>
          <Text className="text-dark underline text-[12px] text-blue-400">Privacy Policy</Text>
        </TouchableOpacity>

        <TouchableOpacity  onPress={goToTerms}>
          <Text className="text-dark underline text-[12px] text-blue-400">Terms & Conditions</Text>
        </TouchableOpacity>
      </View>
      }
      </View>
      <Modal
        visible={showForgotPasswordModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowForgotPasswordModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white p-6 rounded-2xl w-[90%] max-w-[400px]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-primary font-bold text-xl text-center flex-1">
                {showResetPassword
                  ? "Reset Password"
                  : otpSent
                  ? "Verify OTP"
                  : "Forgot Password"}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowForgotPasswordModal(false);
                  setOtpSent(false);
                  setShowResetPassword(false);
                  setOtp("");
                  setNewPassword("");
                }}
                className="p-1"
              >
                <Text className="text-gray-500 text-xl">×</Text>
              </TouchableOpacity>
            </View>

            {!otpSent && !showResetPassword && (
              <>
                <Text className="text-dark text-sm mb-6 text-center">
                  Please enter your valid email or Phone Number to send the
                  verification code.
                </Text>

                {forgotEmailError ? (
                  <Text className="text-red-500 mb-2 text-center">
                    {forgotEmailError}
                  </Text>
                ) : null}

                <View className="mb-4">
                  <View className="flex-row items-center justify-center py-2 px-4 gap-2 bg-light-200 border-border rounded-[99]">
                    <Image source={icons.email} resizeMode="contain" />
                    <TextInput
                      placeholder="Enter your email"
                      placeholderTextColor="#B0B0B0"
                      value={forgotEmail}
                      onChangeText={(text) => {
                        setForgotEmail(text);
                        setForgotEmailError("");
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      style={{
                        flex: 1,
                        paddingHorizontal: 10,
                        color: 'black',
                      }}
                    />
                  </View>
                </View>

                <View className="flex-row gap-4 mt-2">
                  <TouchableOpacity
                    className="flex-1 py-3 bg-light-100 rounded-full"
                    onPress={() => setShowForgotPasswordModal(false)}
                  >
                    <Text className="text-center text-gray-700 font-medium">
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleForgotPassword}
                    className="flex-1 shadow-lg shadow-white rounded-3xl overflow-hidden"
                    disabled={sendingEmail}
                  >
                    <LinearBg className="px-6 py-3">
                      <Text className="text-center text-white font-medium">
                        {sendingEmail ? "Sending..." : "Send OTP"}
                      </Text>
                    </LinearBg>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {otpSent && !showResetPassword && (
              <>
                <Text className="text-dark text-sm mb-6 text-center">
                  A verification code has been sent to{" "}
                  <Text className="text-primary">{forgotEmail}</Text>. Please
                  check your email and enter the code below to activate your
                  account.
                </Text>

                {otpError ? (
                  <Text className="text-red-500 mb-2 text-center">
                    {otpError}
                  </Text>
                ) : null}

                <View className="mb-4">
                  <View className="flex-row items-center justify-center py-2 px-4 gap-2 bg-light-200 border-border rounded-[99]">
                    <TextInput
                      placeholder="Enter OTP"
                      placeholderTextColor="#B0B0B0"
                      value={otp}
                      onChangeText={(text) => {
                        setOtp(text);
                        setOtpError("");
                      }}
                      keyboardType="number-pad"
                      style={{
                        flex: 1,
                        paddingHorizontal: 10,
                      }}
                    />
                  </View>
                </View>

                <View className="flex-row gap-4 mt-2">
                  <TouchableOpacity
                    className="flex-1 py-3 bg-light-100 rounded-full"
                    onPress={() => {
                      setOtpSent(false);
                      setOtp("");
                    }}
                  >
                    <Text className="text-center text-gray-700 font-medium">
                      Back
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleVerifyOtp}
                    className="flex-1 shadow-lg shadow-white rounded-3xl overflow-hidden"
                    disabled={verifyingOtp}
                  >
                    <LinearBg className="px-6 py-3">
                      <Text className="text-center text-white font-medium">
                        {verifyingOtp ? "Verifying..." : "Verify OTP"}
                      </Text>
                    </LinearBg>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {showResetPassword && (
              <>
                <Text className="text-dark text-sm mb-6 text-center">
                  Create New password
                </Text>

                {newPasswordError ? (
                  <Text className="text-red-500 mb-2 text-center">
                    {newPasswordError}
                  </Text>
                ) : null}

                <View className="mb-4">
                  <View className="relative flex-row items-center justify-center py-2 px-4 gap-2 bg-light-200 border-border rounded-[99]">
                    <Image source={icons.lock} resizeMode="contain" />
                    <TextInput
                      placeholder="New Password"
                      placeholderTextColor="#B0B0B0"
                      value={newPassword}
                      onChangeText={(text) => {
                        setNewPassword(text);
                        setNewPasswordError("");
                      }}
                      secureTextEntry={!showPassword}
                      style={{
                        flex: 1,
                        paddingHorizontal: 10,
                      }}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Image
                        source={showPassword ? icons.eyeClosed : icons.eyeOpen}
                        resizeMode="contain"
                        style={{ width: 15, height: 15 }}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View className="flex-row gap-4 mt-2">
                  <TouchableOpacity
                    className="flex-1 py-3 bg-light-100 rounded-full"
                    onPress={() => {
                      setShowResetPassword(false);
                      setNewPassword("");
                    }}
                  >
                    <Text className="text-center text-gray-700 font-medium">
                      Back
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleResetPassword}
                    className="flex-1 shadow-lg shadow-white rounded-3xl overflow-hidden"
                    disabled={resettingPassword}
                  >
                    <LinearBg className="px-6 py-3">
                      <Text className="text-center text-white font-medium">
                        {resettingPassword ? "Resetting..." : "Reset Password"}
                      </Text>
                    </LinearBg>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Login;
