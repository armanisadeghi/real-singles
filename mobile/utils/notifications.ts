/**
 * Push Notifications Utility
 * 
 * A centralized approach to handling push notifications following iOS best practices.
 * 
 * @see https://docs.expo.dev/push-notifications/overview/
 */

import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import * as Haptics from "expo-haptics";
import { Platform, Alert, Linking } from "react-native";
import Constants from "expo-constants";

// ============================================
// TYPES
// ============================================

export interface PushNotificationToken {
  token: string;
  type: "expo" | "apns" | "fcm";
}

export interface NotificationData {
  title?: string;
  body?: string;
  data?: Record<string, any>;
}

// ============================================
// CONFIGURATION
// ============================================

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ============================================
// PERMISSION & REGISTRATION
// ============================================

/**
 * Register for push notifications
 * Returns the Expo push token or null if registration fails
 */
export async function registerForPushNotifications(): Promise<PushNotificationToken | null> {
  // Push notifications only work on physical devices
  if (!Device.isDevice) {
    console.log("Push notifications require a physical device");
    return null;
  }

  try {
    // Check existing permission status
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permission if not already granted
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Push notification permission not granted");
      return null;
    }

    // Get the Expo push token
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    return {
      token: tokenData.data,
      type: "expo",
    };
  } catch (error) {
    console.error("Error registering for push notifications:", error);
    return null;
  }
}

/**
 * Request notification permission with iOS-style pre-explanation
 */
export async function requestNotificationPermissionWithExplanation(): Promise<boolean> {
  // Check current status first
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  
  if (existingStatus === "granted") {
    return true;
  }

  // Show pre-explanation alert
  return new Promise((resolve) => {
    Alert.alert(
      "Enable Notifications",
      "RealSingles would like to send you notifications about new matches, messages, and events.",
      [
        {
          text: "Not Now",
          style: "cancel",
          onPress: () => {
            Haptics.selectionAsync();
            resolve(false);
          },
        },
        {
          text: "Enable",
          style: "default",
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const token = await registerForPushNotifications();
            resolve(token !== null);
          },
        },
      ],
      { cancelable: false }
    );
  });
}

// ============================================
// NOTIFICATION LISTENERS
// ============================================

/**
 * Add a listener for notifications received while app is foregrounded
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Add a listener for when user taps on a notification
 */
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Remove a notification subscription
 */
export function removeNotificationSubscription(subscription: Notifications.Subscription): void {
  subscription.remove();
}

// ============================================
// BADGE MANAGEMENT
// ============================================

/**
 * Set the app badge count (iOS only)
 */
export async function setBadgeCount(count: number): Promise<boolean> {
  try {
    await Notifications.setBadgeCountAsync(count);
    return true;
  } catch (error) {
    console.error("Error setting badge count:", error);
    return false;
  }
}

/**
 * Get the current badge count
 */
export async function getBadgeCount(): Promise<number> {
  try {
    return await Notifications.getBadgeCountAsync();
  } catch (error) {
    console.error("Error getting badge count:", error);
    return 0;
  }
}

/**
 * Clear the app badge
 */
export async function clearBadge(): Promise<boolean> {
  return setBadgeCount(0);
}

// ============================================
// LOCAL NOTIFICATIONS
// ============================================

/**
 * Schedule a local notification
 */
export async function scheduleLocalNotification(
  notification: NotificationData,
  trigger?: Notifications.NotificationTriggerInput
): Promise<string | null> {
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title,
        body: notification.body,
        data: notification.data,
        sound: true,
      },
      trigger: trigger ?? null, // null = immediate
    });
    return id;
  } catch (error) {
    console.error("Error scheduling notification:", error);
    return null;
  }
}

/**
 * Cancel a scheduled notification
 */
export async function cancelNotification(notificationId: string): Promise<boolean> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    return true;
  } catch (error) {
    console.error("Error canceling notification:", error);
    return false;
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<boolean> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    return true;
  } catch (error) {
    console.error("Error canceling all notifications:", error);
    return false;
  }
}

// ============================================
// ANDROID-SPECIFIC SETUP
// ============================================

/**
 * Set up notification channels for Android
 * Call this once during app initialization
 */
export async function setupNotificationChannels(): Promise<void> {
  if (Platform.OS !== "android") return;

  // Main messages channel
  await Notifications.setNotificationChannelAsync("messages", {
    name: "Messages",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#B06D1E",
    sound: "default",
  });

  // Matches channel
  await Notifications.setNotificationChannelAsync("matches", {
    name: "Matches",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#B06D1E",
    sound: "default",
  });

  // Events channel
  await Notifications.setNotificationChannelAsync("events", {
    name: "Events",
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: "#B06D1E",
    sound: "default",
  });

  // General channel
  await Notifications.setNotificationChannelAsync("general", {
    name: "General",
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: "#B06D1E",
  });
}

// ============================================
// UTILITY
// ============================================

/**
 * Check if push notifications are enabled
 */
export async function arePushNotificationsEnabled(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === "granted";
}

/**
 * Open system settings for notification permissions
 */
export function openNotificationSettings(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  Linking.openSettings();
}
