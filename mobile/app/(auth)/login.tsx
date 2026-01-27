import LinearBg from "@/components/LinearBg";
import SociaLoginButtons from "@/components/SociaLoginButtons";
import GradientButton from "@/components/ui/GradientButton";
import { icons } from "@/constants/icons";
import { signInWithEmail, resetPassword as supabaseResetPassword } from "@/lib/supabase";
import { useRouter } from "expo-router";
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from "react";
import {
  BackHandler,
  Image,
  Keyboard,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
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
  const insets = useSafeAreaInsets();

  // Android hardware back button handling
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      router.back();
      return true;
    });
    return () => backHandler.remove();
  }, []);

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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
      // Use Supabase Auth for login
      const data = await signInWithEmail(email, password);
      
      console.log("Login response:", data);

      if (data?.session) {
        // Session is automatically stored by Supabase
        // Auth context will pick up the change via onAuthStateChange
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Toast.show({
          type: "success",
          text1: "Welcome back!",
          position: "bottom",
          visibilityTime: 2000,
        });
        router.replace("/(tabs)");
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setGeneralError("Login failed. Please try again.");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      // Handle specific Supabase auth errors
      if (error?.message?.includes("Invalid login credentials")) {
        setGeneralError("Invalid email or password. Please try again.");
      } else if (error?.message?.includes("Email not confirmed")) {
        setGeneralError("Please verify your email before logging in.");
      } else {
        setGeneralError(error?.message || "Something went wrong. Please try again later.");
      }
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
      // Use Supabase password reset
      await supabaseResetPassword(forgotEmail);
      console.log("Password reset email sent");

      Toast.show({
        type: "success",
        text1: "Password reset email sent",
        text2: "Please check your email for reset instructions",
        position: "bottom",
      });
      
      // Close modal since Supabase uses magic link instead of OTP
      setShowForgotPasswordModal(false);
      setForgotEmail("");
    } catch (error: any) {
      console.error("Forgot password error:", error);
      setForgotEmailError(error?.message || "Failed to send reset email. Please try again.");
    } finally {
      setSendingEmail(false);
    }
  };

  // NOTE: Supabase uses magic link for password reset (sent via email)
  // The OTP and direct password reset functions are no longer used
  // Users will receive an email with a link to reset their password
  
  const handleVerifyOtp = async () => {
    // OTP flow replaced by Supabase magic link
    Toast.show({
      type: "info",
      text1: "Check your email",
      text2: "Click the link in the email to reset your password",
      position: "bottom",
    });
  };

  const handleResetPassword = async () => {
    // Reset flow uses Supabase magic link
    Toast.show({
      type: "info", 
      text1: "Check your email",
      text2: "Click the link in the email to reset your password",
      position: "bottom",
    });
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
    <SafeAreaView className="flex-1 bg-background">
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
            <TouchableOpacity onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setVisible(false);
            }}>
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
          <TouchableOpacity onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowWebView(false);
          }}>
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
                autoComplete="email"
                importantForAutofill="yes"
                autoCorrect={false}
                contextMenuHidden={true}
                style={{
                  flex: 1,
                  paddingLeft: 10,
                  paddingVertical: 10,
                  color: 'black',
                  fontSize: 16,
                }}
                // iOS-specific enhancements
                clearButtonMode="while-editing"
                textContentType="emailAddress"
                keyboardAppearance="light"
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
                autoComplete="password"
                importantForAutofill="yes"
                contextMenuHidden={true}
                className="text-dark"
                style={{
                  flex: 1,
                  paddingLeft: 10,
                  paddingVertical: 10,
                  color: 'black',
                  fontSize: 16,
                }}
                // iOS-specific enhancements
                textContentType="password"
                keyboardAppearance="light"
                enablesReturnKeyAutomatically={true}
              />
              <TouchableOpacity onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowPassword(!showPassword);
              }}>
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
            <TouchableOpacity onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowForgotPasswordModal(true);
            }}>
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
          <TouchableOpacity onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/(auth)/signup");
          }}>
            <Text className="text-primary font-medium text-base"> Sign Up</Text>
          </TouchableOpacity>
        </View>

      {Platform.OS == 'ios' ?
        <View className="w-full flex-row justify-center items-center mt-4 space-x-4">
        <TouchableOpacity style={{marginRight: 30}}
         onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            openModal(require("../../assets/docs/PrivacyPolicy.pdf"));
          }}>
          <Text className="text-dark underline text-[12px] text-blue-400">Privacy Policy</Text>
        </TouchableOpacity>

        <TouchableOpacity  onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            openModal(require("../../assets/docs/TermsConditions.pdf"));
          }}>
          <Text className="text-dark underline text-[12px] text-blue-400">Terms & Conditions</Text>
        </TouchableOpacity>
      </View> 
      :
      
        <View className="w-full flex-row justify-center items-center mt-4 space-x-4">
        <TouchableOpacity style={{marginRight: 30}}
         onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            goToPrivacy();
          }}>
          <Text className="text-dark underline text-[12px] text-blue-400">Privacy Policy</Text>
        </TouchableOpacity>

        <TouchableOpacity  onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            goToTerms();
          }}>
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
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
                      autoComplete="email"
                      importantForAutofill="yes"
                      textContentType="emailAddress"
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
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setShowForgotPasswordModal(false);
                    }}
                  >
                    <Text className="text-center text-gray-700 font-medium">
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      handleForgotPassword();
                    }}
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
                      autoComplete="sms-otp"
                      importantForAutofill="yes"
                      textContentType="oneTimeCode"
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
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setOtpSent(false);
                      setOtp("");
                    }}
                  >
                    <Text className="text-center text-gray-700 font-medium">
                      Back
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      handleVerifyOtp();
                    }}
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
                      autoComplete="new-password"
                      importantForAutofill="yes"
                      textContentType="newPassword"
                      style={{
                        flex: 1,
                        paddingHorizontal: 10,
                      }}
                    />
                    <TouchableOpacity
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setShowPassword(!showPassword);
                      }}
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
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setShowResetPassword(false);
                      setNewPassword("");
                    }}
                  >
                    <Text className="text-center text-gray-700 font-medium">
                      Back
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      handleResetPassword();
                    }}
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
