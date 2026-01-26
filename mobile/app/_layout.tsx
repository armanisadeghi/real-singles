import 'react-native-gesture-handler';
import 'react-native-reanimated';

import * as SplashScreen from 'expo-splash-screen';
import IncomingCall from "@/components/IncomingCall";
import NotificationBell from "@/components/NotificationBell";
import { CallProvider, useCall } from "@/context/CallContext";
import { AuthProvider, useAuth } from "@/utils/authContext";
import { Stack } from "expo-router";
import React, { useEffect, useRef } from "react";
import { StatusBar } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import "./globals.css";

// Prevent native splash from auto-hiding - we control when it hides
SplashScreen.preventAutoHideAsync();

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

  return (
    <>
      <Stack
        screenOptions={{
          // Native header defaults - DO NOT override unless necessary
          headerTintColor: '#E91E63', // Brand color for interactive elements
          headerShadowVisible: false, // Clean flat header (modern design)
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerTitleStyle: { fontWeight: '600', color: '#000000' },
          // Prevent "(tabs)" from showing as back button title
          headerBackTitle: 'Back',
        }}
      >
        {/* Auth & Splash - No headers */}
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/signup" options={{ headerShown: false }} />
        
        {/* Tab Navigator - Has its own navigation */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        
        {/* Chat screens - Custom headers needed for complex UI */}
        <Stack.Screen name="chat/[userid]" options={{ headerShown: false }} />
        <Stack.Screen name="group/[groupid]" options={{ headerShown: false }} />
        
        {/* Full-screen media - No headers */}
        <Stack.Screen name="profiles/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="profiles/focus/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="discover/profile/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="video/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="call/index" options={{ headerShown: false }} />
        <Stack.Screen name="videocall/index" options={{ headerShown: false }} />
        <Stack.Screen name="voicecall/index" options={{ headerShown: false }} />
        <Stack.Screen name="virtualdate/[id]" options={{ headerShown: false }} />
        
        {/* Standard screens - Native headers with NotificationBell */}
        <Stack.Screen 
          name="settings/index" 
          options={{ 
            title: 'Settings',
            headerRight: () => <NotificationBell />,
          }} 
        />
        <Stack.Screen 
          name="notification/index" 
          options={{ 
            title: 'Notifications',
            headerRight: () => <NotificationBell />,
          }} 
        />
        <Stack.Screen 
          name="events/index" 
          options={{ 
            title: 'Nearby Events',
            headerRight: () => <NotificationBell />,
          }} 
        />
        <Stack.Screen 
          name="events/event/[id]" 
          options={{ 
            title: 'Event Details',
          }} 
        />
        <Stack.Screen 
          name="events/create/index" 
          options={{ 
            title: 'Create Event',
          }} 
        />
        <Stack.Screen 
          name="topMatches/index" 
          options={{ 
            title: 'Top Matches',
            headerRight: () => <NotificationBell />,
          }} 
        />
        <Stack.Screen 
          name="appGallery/index" 
          options={{ 
            title: 'App Gallery',
          }} 
        />
        <Stack.Screen 
          name="contact/index" 
          options={{ 
            title: 'Contact Us',
          }} 
        />
        <Stack.Screen 
          name="redeem/index" 
          options={{ 
            title: 'Redeem Points',
          }} 
        />
        <Stack.Screen 
          name="redeem/product/[productId]" 
          options={{ 
            title: 'Product Details',
          }} 
        />
        <Stack.Screen 
          name="shipping/index" 
          options={{ 
            title: 'Shipping Info',
          }} 
        />
        <Stack.Screen 
          name="refer/index" 
          options={{ 
            title: 'Refer Friends',
          }} 
        />
        <Stack.Screen 
          name="editProfile/index" 
          options={{ 
            title: 'Edit Profile',
          }} 
        />
        <Stack.Screen 
          name="review/index" 
          options={{ 
            title: 'Reviews',
          }} 
        />
        <Stack.Screen 
          name="nearbyprofile/index" 
          options={{ 
            title: 'Nearby Profiles',
            headerRight: () => <NotificationBell />,
          }} 
        />
        <Stack.Screen 
          name="group/create/index" 
          options={{ 
            title: 'Create Group',
          }} 
        />
        <Stack.Screen 
          name="group/addmember/index" 
          options={{ 
            title: 'Add Members',
          }} 
        />
        <Stack.Screen 
          name="join/index" 
          options={{ 
            headerShown: false,
          }} 
        />
      </Stack>
      <Toast />
      <IncomingCall />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar backgroundColor="#FFFAF2" barStyle="dark-content" />
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <CallProvider>
            <RootLayoutNav />
          </CallProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

