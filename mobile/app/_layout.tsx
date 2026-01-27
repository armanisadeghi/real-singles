import 'react-native-gesture-handler';
import 'react-native-reanimated';

import * as SplashScreen from 'expo-splash-screen';
import IncomingCall from "@/components/IncomingCall";
import NotificationBell from "@/components/NotificationBell";
import { CallProvider, useCall } from "@/context/CallContext";
import { AuthProvider, useAuth } from "@/utils/authContext";
import {
  setupNotificationChannels,
  addNotificationReceivedListener,
  addNotificationResponseListener,
  removeNotificationSubscription,
} from "@/utils/notifications";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Platform, StatusBar } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import "./globals.css";

// Prevent native splash from auto-hiding - we control when it hides
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const agoraLoginRef = useRef(false);
  const router = useRouter();

  const { isAuthenticated } = useAuth();
  const { loginToAgoraChat } = useCall();

  // Initialize Agora chat when authenticated
  useEffect(() => {
    if (isAuthenticated && !agoraLoginRef.current) {
      agoraLoginRef.current = true;
      loginToAgoraChat();
    }
  }, [isAuthenticated]);

  // Initialize push notifications
  useEffect(() => {
    // Set up Android notification channels
    if (Platform.OS === "android") {
      setupNotificationChannels();
    }

    // Listen for notifications received while app is foregrounded
    const notificationReceivedSubscription = addNotificationReceivedListener(
      (notification) => {
        console.log("Notification received:", notification);
        // You can show a toast or in-app notification here
      }
    );

    // Listen for notification taps (opens the app)
    const notificationResponseSubscription = addNotificationResponseListener(
      (response) => {
        console.log("Notification tapped:", response);
        const data = response.notification.request.content.data;
        
        // Handle navigation based on notification type
        if (data?.type === "message" && data?.chatId) {
          router.push(`/chat/${data.chatId}`);
        } else if (data?.type === "match" && data?.userId) {
          router.push(`/profiles/${data.userId}`);
        } else if (data?.type === "event" && data?.eventId) {
          router.push(`/events/event/${data.eventId}`);
        }
      }
    );

    return () => {
      removeNotificationSubscription(notificationReceivedSubscription);
      removeNotificationSubscription(notificationResponseSubscription);
    };
  }, []);

  return (
    <>
      <Stack
        screenOptions={{
          // Native header defaults - DO NOT override unless necessary
          headerTintColor: '#E91E63', // Brand color for interactive elements
          headerShadowVisible: false, // Clean flat header (modern design)
          headerTitleStyle: { fontWeight: '600', color: '#000000' },
          // Prevent "(tabs)" from showing as back button title
          headerBackTitle: 'Back',
          // iOS Liquid Glass: Transparent header with blur effect
          headerTransparent: Platform.OS === 'ios',
          headerBlurEffect: Platform.OS === 'ios' ? 'systemMaterial' : undefined,
          // Fallback for Android and when blur is not available
          headerStyle: Platform.OS === 'ios' 
            ? undefined 
            : { backgroundColor: '#FFFFFF' },
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
            headerLargeTitle: Platform.OS === 'ios',
            headerRight: () => <NotificationBell />,
          }} 
        />
        <Stack.Screen 
          name="notification/index" 
          options={{ 
            title: 'Notifications',
            headerLargeTitle: Platform.OS === 'ios',
            headerRight: () => <NotificationBell />,
          }} 
        />
        <Stack.Screen 
          name="events/index" 
          options={{ 
            title: 'Nearby Events',
            headerLargeTitle: Platform.OS === 'ios',
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
            headerLargeTitle: Platform.OS === 'ios',
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
            headerLargeTitle: Platform.OS === 'ios',
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
            // Full-screen map view - use floating header instead of native header
            headerShown: false,
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

