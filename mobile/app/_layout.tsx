import 'react-native-gesture-handler';
import 'react-native-reanimated';

import * as SplashScreen from 'expo-splash-screen';
import * as NavigationBar from 'expo-navigation-bar';
import IncomingCall from "@/components/IncomingCall";
import NotificationBell from "@/components/NotificationBell";
import { CallProvider } from "@/context/CallContext";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { AuthProvider, useAuth } from "@/utils/authContext";
import {
  setupNotificationChannels,
  addNotificationReceivedListener,
  addNotificationResponseListener,
  removeNotificationSubscription,
} from "@/utils/notifications";
import { Stack, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Platform, StatusBar, useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import "./globals.css";

// Prevent native splash from auto-hiding - we control when it hides
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const router = useRouter();
  const colorScheme = useColorScheme();

  const { isAuthenticated } = useAuth();

  // TODO: Re-enable Agora Chat login when video/voice calling is configured
  // Currently disabled because:
  // 1. Text messaging has been migrated to Supabase Realtime
  // 2. Video/voice calling (Agora RTC) is not yet configured
  // 3. The backend env vars AGORA_APP_ID and AGORA_APP_CERTIFICATE are not set
  // 
  // To re-enable:
  // 1. Import useCall from "@/context/CallContext"
  // 2. Add: const { loginToAgoraChat } = useCall();
  // 3. Add: const agoraLoginRef = useRef(false);
  // 4. Uncomment the useEffect below
  // 5. Configure Agora credentials in backend .env
  // 6. Test video/voice calling functionality
  //
  // useEffect(() => {
  //   if (isAuthenticated && !agoraLoginRef.current) {
  //     agoraLoginRef.current = true;
  //     loginToAgoraChat();
  //   }
  // }, [isAuthenticated]);

  // Initialize Android-specific features
  useEffect(() => {
    if (Platform.OS === "android") {
      // Set up notification channels
      setupNotificationChannels();
      
      // Configure transparent navigation bar for edge-to-edge
      NavigationBar.setBackgroundColorAsync('transparent');
      NavigationBar.setPositionAsync('absolute');
      // Set button style based on color scheme
      NavigationBar.setButtonStyleAsync(colorScheme === 'dark' ? 'light' : 'dark');
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
          router.push(`/discover/profile/${data.userId}`);
        } else if (data?.type === "event" && data?.eventId) {
          router.push(`/events/event/${data.eventId}`);
        }
      }
    );

    return () => {
      removeNotificationSubscription(notificationReceivedSubscription);
      removeNotificationSubscription(notificationResponseSubscription);
    };
  }, [colorScheme]);

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
          // iOS blur effect for navigation bar
          headerBlurEffect: Platform.OS === 'ios' ? 'systemMaterial' : undefined,
          // Note: Don't use headerTransparent globally - it breaks content insets
          // for screens with headerLargeTitle. Let native navigation handle layout.
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
      <ThemeProvider>
        <StatusBar 
          backgroundColor="transparent" 
          barStyle="dark-content" 
          translucent={Platform.OS === 'android'}
        />
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AuthProvider>
            <CallProvider>
              <RootLayoutNav />
            </CallProvider>
          </AuthProvider>
        </GestureHandlerRootView>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

