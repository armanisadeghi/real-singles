/**
 * iOS Permissions Utility
 * 
 * A centralized, native-first approach to handling iOS permissions.
 * This follows Apple's Human Interface Guidelines for requesting permissions:
 * 
 * 1. Request permission only when needed (at the moment of use)
 * 2. Explain why the permission is needed before requesting
 * 3. Handle denial gracefully with clear path to Settings
 * 4. Never repeatedly request denied permissions
 * 
 * @see https://developer.apple.com/design/human-interface-guidelines/privacy
 */

import * as Calendar from "expo-calendar";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Camera, useMicrophonePermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { Alert, Linking, Platform } from "react-native";

// Note: expo-notifications must be installed for notifications permission
// Install with: npx expo install expo-notifications
let Notifications: any = null;
try {
  Notifications = require("expo-notifications");
} catch (e) {
  // expo-notifications not installed yet
}

// ============================================
// TYPES
// ============================================

export type PermissionType = 
  | "camera"
  | "microphone"
  | "photoLibrary"
  | "calendar"
  | "location"
  | "locationAlways"
  | "notifications";

export type PermissionStatus = 
  | "granted"
  | "denied"
  | "undetermined"
  | "limited";

export interface PermissionResult {
  status: PermissionStatus;
  canAskAgain: boolean;
}

export interface PermissionConfig {
  /** Title for the pre-request explanation alert */
  title: string;
  /** Message explaining why the permission is needed */
  message: string;
  /** Title for the denied alert */
  deniedTitle: string;
  /** Message for the denied alert */
  deniedMessage: string;
}

// ============================================
// DEFAULT PERMISSION CONFIGS
// ============================================

const DEFAULT_CONFIGS: Record<PermissionType, PermissionConfig> = {
  camera: {
    title: "Camera Access",
    message: "RealSingles needs access to your camera to take photos and record videos for your profile.",
    deniedTitle: "Camera Access Required",
    deniedMessage: "Please enable camera access in Settings to take photos and videos.",
  },
  microphone: {
    title: "Microphone Access",
    message: "RealSingles needs access to your microphone to record video and make calls.",
    deniedTitle: "Microphone Access Required",
    deniedMessage: "Please enable microphone access in Settings to record videos and make voice/video calls.",
  },
  photoLibrary: {
    title: "Photo Library Access",
    message: "RealSingles needs access to your photos to let you share them on your profile.",
    deniedTitle: "Photo Library Access Required",
    deniedMessage: "Please enable photo library access in Settings to select photos.",
  },
  calendar: {
    title: "Calendar Access",
    message: "RealSingles would like to add events to your calendar so you never miss a dating event.",
    deniedTitle: "Calendar Access Required",
    deniedMessage: "Please enable calendar access in Settings to add events to your calendar.",
  },
  location: {
    title: "Location Access",
    message: "RealSingles uses your location to show you nearby singles and events.",
    deniedTitle: "Location Access Required",
    deniedMessage: "Please enable location access in Settings to see nearby profiles and events.",
  },
  locationAlways: {
    title: "Background Location",
    message: "RealSingles can notify you about nearby singles even when the app is in the background.",
    deniedTitle: "Background Location Required",
    deniedMessage: "Please enable 'Always' location access in Settings for background notifications.",
  },
  notifications: {
    title: "Enable Notifications",
    message: "RealSingles would like to send you notifications about new matches, messages, and events.",
    deniedTitle: "Notifications Required",
    deniedMessage: "Please enable notifications in Settings to receive updates about matches and messages.",
  },
};

// ============================================
// PERMISSION CHECKING FUNCTIONS
// ============================================

/**
 * Get the current permission status without requesting
 */
export async function getPermissionStatus(type: PermissionType): Promise<PermissionResult> {
  try {
    switch (type) {
      case "camera": {
        const result = await Camera.getCameraPermissionsAsync();
        return {
          status: mapExpoStatus(result.status),
          canAskAgain: result.canAskAgain,
        };
      }
      
      case "microphone": {
        const result = await Camera.getMicrophonePermissionsAsync();
        return {
          status: mapExpoStatus(result.status),
          canAskAgain: result.canAskAgain,
        };
      }
      
      case "photoLibrary": {
        const result = await ImagePicker.getMediaLibraryPermissionsAsync();
        return {
          status: mapExpoStatus(result.status),
          canAskAgain: result.canAskAgain,
        };
      }
      
      case "calendar": {
        const result = await Calendar.getCalendarPermissionsAsync();
        return {
          status: mapExpoStatus(result.status),
          canAskAgain: result.canAskAgain,
        };
      }
      
      case "location": {
        const result = await Location.getForegroundPermissionsAsync();
        return {
          status: mapExpoStatus(result.status),
          canAskAgain: result.canAskAgain,
        };
      }
      
      case "locationAlways": {
        const result = await Location.getBackgroundPermissionsAsync();
        return {
          status: mapExpoStatus(result.status),
          canAskAgain: result.canAskAgain,
        };
      }
      
      case "notifications": {
        if (!Notifications) {
          console.warn("expo-notifications not installed. Install with: npx expo install expo-notifications");
          return { status: "undetermined", canAskAgain: true };
        }
        const result = await Notifications.getPermissionsAsync();
        return {
          status: mapExpoStatus(result.status),
          canAskAgain: result.canAskAgain ?? true,
        };
      }
      
      default:
        return { status: "undetermined", canAskAgain: true };
    }
  } catch (error) {
    console.error(`Error getting ${type} permission status:`, error);
    return { status: "undetermined", canAskAgain: true };
  }
}

/**
 * Check if permission is granted
 */
export async function hasPermission(type: PermissionType): Promise<boolean> {
  const result = await getPermissionStatus(type);
  return result.status === "granted" || result.status === "limited";
}

// ============================================
// PERMISSION REQUEST FUNCTIONS
// ============================================

/**
 * Request a permission with proper iOS UX
 * 
 * This follows the recommended pattern:
 * 1. Check current status
 * 2. If undetermined, request permission
 * 3. If denied, show alert with option to open Settings
 * 
 * @param type - The permission type to request
 * @param config - Optional custom configuration for alerts
 * @returns true if permission was granted, false otherwise
 */
export async function requestPermission(
  type: PermissionType,
  config?: Partial<PermissionConfig>
): Promise<boolean> {
  const finalConfig = { ...DEFAULT_CONFIGS[type], ...config };
  
  try {
    // First check current status
    const currentStatus = await getPermissionStatus(type);
    
    // If already granted, return true
    if (currentStatus.status === "granted" || currentStatus.status === "limited") {
      return true;
    }
    
    // If denied and can't ask again, show settings alert
    if (currentStatus.status === "denied" && !currentStatus.canAskAgain) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      showSettingsAlert(finalConfig.deniedTitle, finalConfig.deniedMessage);
      return false;
    }
    
    // Request the permission
    const result = await requestPermissionInternal(type);
    
    if (result.status === "granted" || result.status === "limited") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return true;
    }
    
    // Permission was denied
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    
    // On iOS, if user denies, they need to go to Settings
    if (Platform.OS === "ios" && !result.canAskAgain) {
      showSettingsAlert(finalConfig.deniedTitle, finalConfig.deniedMessage);
    }
    
    return false;
  } catch (error) {
    console.error(`Error requesting ${type} permission:`, error);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    return false;
  }
}

/**
 * Request permission with a pre-explanation alert
 * 
 * Best for permissions that users might find intrusive (location, notifications)
 * Shows an explanation before the system prompt
 */
export async function requestPermissionWithExplanation(
  type: PermissionType,
  config?: Partial<PermissionConfig>
): Promise<boolean> {
  const finalConfig = { ...DEFAULT_CONFIGS[type], ...config };
  
  // First check if we even need to request
  const currentStatus = await getPermissionStatus(type);
  
  if (currentStatus.status === "granted" || currentStatus.status === "limited") {
    return true;
  }
  
  // If denied and can't ask again, go straight to settings alert
  if (currentStatus.status === "denied" && !currentStatus.canAskAgain) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    showSettingsAlert(finalConfig.deniedTitle, finalConfig.deniedMessage);
    return false;
  }
  
  // Show pre-explanation alert
  return new Promise((resolve) => {
    Alert.alert(
      finalConfig.title,
      finalConfig.message,
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
          text: "Continue",
          style: "default",
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const granted = await requestPermission(type, config);
            resolve(granted);
          },
        },
      ],
      { cancelable: false }
    );
  });
}

// ============================================
// INTERNAL HELPERS
// ============================================

async function requestPermissionInternal(type: PermissionType): Promise<PermissionResult> {
  switch (type) {
    case "camera": {
      const result = await Camera.requestCameraPermissionsAsync();
      return {
        status: mapExpoStatus(result.status),
        canAskAgain: result.canAskAgain,
      };
    }
    
    case "microphone": {
      const result = await Camera.requestMicrophonePermissionsAsync();
      return {
        status: mapExpoStatus(result.status),
        canAskAgain: result.canAskAgain,
      };
    }
    
    case "photoLibrary": {
      const result = await ImagePicker.requestMediaLibraryPermissionsAsync();
      return {
        status: mapExpoStatus(result.status),
        canAskAgain: result.canAskAgain,
      };
    }
    
    case "calendar": {
      const result = await Calendar.requestCalendarPermissionsAsync();
      return {
        status: mapExpoStatus(result.status),
        canAskAgain: result.canAskAgain,
      };
    }
    
    case "location": {
      const result = await Location.requestForegroundPermissionsAsync();
      return {
        status: mapExpoStatus(result.status),
        canAskAgain: result.canAskAgain,
      };
    }
    
    case "locationAlways": {
      // First need foreground permission
      const foreground = await Location.requestForegroundPermissionsAsync();
      if (foreground.status !== "granted") {
        return {
          status: mapExpoStatus(foreground.status),
          canAskAgain: foreground.canAskAgain,
        };
      }
      const result = await Location.requestBackgroundPermissionsAsync();
      return {
        status: mapExpoStatus(result.status),
        canAskAgain: result.canAskAgain,
      };
    }
    
    case "notifications": {
      if (!Notifications) {
        console.warn("expo-notifications not installed. Install with: npx expo install expo-notifications");
        return { status: "undetermined", canAskAgain: true };
      }
      const result = await Notifications.requestPermissionsAsync();
      return {
        status: mapExpoStatus(result.status),
        canAskAgain: result.canAskAgain ?? true,
      };
    }
    
    default:
      return { status: "undetermined", canAskAgain: true };
  }
}

function mapExpoStatus(status: string): PermissionStatus {
  switch (status) {
    case "granted":
      return "granted";
    case "denied":
      return "denied";
    case "limited":
      return "limited";
    default:
      return "undetermined";
  }
}

function showSettingsAlert(title: string, message: string): void {
  Alert.alert(
    title,
    message,
    [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Open Settings",
        style: "default",
        onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          Linking.openSettings();
        },
      },
    ],
    { cancelable: true }
  );
}

// ============================================
// CONVENIENCE HOOKS / FUNCTIONS
// ============================================

/**
 * Request multiple permissions at once
 * Returns an object with the status of each permission
 */
export async function requestMultiplePermissions(
  types: PermissionType[]
): Promise<Record<PermissionType, boolean>> {
  const results: Record<string, boolean> = {};
  
  for (const type of types) {
    results[type] = await requestPermission(type);
  }
  
  return results as Record<PermissionType, boolean>;
}

/**
 * Check if all permissions are granted
 */
export async function hasAllPermissions(types: PermissionType[]): Promise<boolean> {
  for (const type of types) {
    const granted = await hasPermission(type);
    if (!granted) return false;
  }
  return true;
}

// ============================================
// CALENDAR-SPECIFIC HELPERS
// ============================================

/**
 * Get a writable calendar for creating events
 * Prefers iCloud on iOS, primary calendar on Android
 */
export async function getWritableCalendar(): Promise<Calendar.Calendar | null> {
  try {
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    
    // Find preferred calendar
    const preferred = calendars.find(
      (cal) =>
        cal.allowsModifications &&
        (Platform.OS === "ios"
          ? cal.source?.name === "iCloud" || cal.source?.name === "Default"
          : cal.isPrimary)
    );
    
    // Fallback to any writable calendar
    return preferred || calendars.find((cal) => cal.allowsModifications) || null;
  } catch (error) {
    console.error("Error getting writable calendar:", error);
    return null;
  }
}

/**
 * Add an event to calendar with proper permission handling
 */
export async function addEventToCalendar(
  event: {
    title: string;
    notes?: string;
    startDate: Date;
    endDate: Date;
    location?: string;
  }
): Promise<{ success: boolean; eventId?: string; error?: string }> {
  // Request permission first
  const granted = await requestPermission("calendar");
  
  if (!granted) {
    return { success: false, error: "Calendar permission not granted" };
  }
  
  try {
    const calendar = await getWritableCalendar();
    
    if (!calendar) {
      return { success: false, error: "No writable calendar found" };
    }
    
    const eventId = await Calendar.createEventAsync(calendar.id, {
      title: event.title,
      notes: event.notes,
      startDate: event.startDate,
      endDate: event.endDate,
      location: event.location,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    return { success: true, eventId };
  } catch (error) {
    console.error("Error creating calendar event:", error);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    return { success: false, error: "Failed to create calendar event" };
  }
}
