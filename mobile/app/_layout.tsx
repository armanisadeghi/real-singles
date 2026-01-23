import 'react-native-gesture-handler';
import 'react-native-reanimated';

import IncomingCall from "@/components/IncomingCall";
import { CallProvider, useCall } from "@/context/CallContext";
import { AuthProvider, useAuth } from "@/utils/authContext";
import { Stack } from "expo-router";
import React, { useEffect, useRef } from "react";
import { StatusBar } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";
import "./globals.css";

function RootLayoutNav() {
  const agoraLoginRef = useRef(false);

  const { isAuthenticated } = useAuth();
  const { loginToAgoraChat } = useCall();

  useEffect(() => {
  if (isAuthenticated && !agoraLoginRef.current) {
    agoraLoginRef.current = true;
    loginToAgoraChat();
  }
}, [isAuthenticated]);

  // let agoraLoggedIn = false;

// useEffect(() => {
//   if (isAuthenticated && !agoraLoggedIn) {
//     loginToAgoraChat();
//     agoraLoggedIn = true;
//   }
// }, [isAuthenticated]);


  // useEffect(() => {
  //   if (isAuthenticated) {
  //     loginToAgoraChat();
  //   }
  // }, [isAuthenticated]);

  return (
    <>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/signup" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="chat/[userid]" options={{ headerShown: false }} />
        <Stack.Screen name="profiles/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="video/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="topMatches/index" options={{ headerShown: false }} />
        <Stack.Screen name="appGallery/index" options={{ headerShown: false }} />
        <Stack.Screen name="contact/index" options={{ headerShown: false }} />
        <Stack.Screen name="notification/index" options={{ headerShown: false }} />
        <Stack.Screen name="events/index" options={{ headerShown: false }} />
        <Stack.Screen name="events/event/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="events/create/index" options={{ headerShown: false }} />
        <Stack.Screen name="redeem/index" options={{ headerShown: false }} />
        <Stack.Screen name="redeem/product/[productId]" options={{ headerShown: false }} />
        <Stack.Screen name="shipping/index" options={{ headerShown: false }} />
        <Stack.Screen name="refer/index" options={{ headerShown: false }} />
        <Stack.Screen name="editProfile/index" options={{ headerShown: false }} />
        <Stack.Screen name="review/index" options={{ headerShown: false }} />
        <Stack.Screen name="virtualdate/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="nearbyprofile/index" options={{ headerShown: false }} />
        <Stack.Screen name="group/create/index" options={{ headerShown: false }} />
        <Stack.Screen name="group/addmember/index" options={{ headerShown: false }} />
        <Stack.Screen name="settings/index" options={{ headerShown: false }} />
        <Stack.Screen name="call/index" options={{ headerShown: false }} />
        <Stack.Screen name="videocall/index" options={{ headerShown: false }} />
        <Stack.Screen name="voicecall/index" options={{ headerShown: false }} />
        <Stack.Screen name="group/[groupid]" options={{ headerShown: false }} />
      </Stack>
      <Toast />
      <IncomingCall />
    </>
  );
}

export default function RootLayout() {
  return (
    <>
      <StatusBar backgroundColor="#FFFAF2" barStyle="dark-content" />
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <CallProvider>
            <RootLayoutNav />
          </CallProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    </>
  );
}

