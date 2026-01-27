/**
 * Biometric Authentication Utility
 * 
 * Provides Face ID / Touch ID authentication for sensitive actions.
 * Follows iOS Human Interface Guidelines for biometric prompts.
 * 
 * @see https://developer.apple.com/design/human-interface-guidelines/authentication
 */

import * as LocalAuthentication from "expo-local-authentication";
import * as Haptics from "expo-haptics";
import { Alert, Platform } from "react-native";

// ============================================
// TYPES
// ============================================

export type BiometricType = "face" | "fingerprint" | "none";

export interface BiometricConfig {
  /** The reason shown to the user when prompted */
  promptMessage: string;
  /** Title for the fallback option */
  fallbackLabel?: string;
  /** Whether to allow device passcode as fallback */
  allowDeviceCredentials?: boolean;
}

// ============================================
// BIOMETRIC SUPPORT CHECK
// ============================================

/**
 * Check if the device supports biometric authentication
 */
export async function isBiometricSupported(): Promise<boolean> {
  try {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    return compatible;
  } catch (error) {
    console.error("Error checking biometric support:", error);
    return false;
  }
}

/**
 * Check if biometric authentication is enrolled (set up by user)
 */
export async function isBiometricEnrolled(): Promise<boolean> {
  try {
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return enrolled;
  } catch (error) {
    console.error("Error checking biometric enrollment:", error);
    return false;
  }
}

/**
 * Get the available biometric type
 */
export async function getBiometricType(): Promise<BiometricType> {
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return "face";
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return "fingerprint";
    }
    return "none";
  } catch (error) {
    console.error("Error getting biometric type:", error);
    return "none";
  }
}

/**
 * Get a user-friendly name for the biometric type
 */
export async function getBiometricTypeName(): Promise<string> {
  const type = await getBiometricType();
  
  if (Platform.OS === "ios") {
    return type === "face" ? "Face ID" : type === "fingerprint" ? "Touch ID" : "Passcode";
  }
  
  // Android
  return type === "face" ? "Face Unlock" : type === "fingerprint" ? "Fingerprint" : "Device Lock";
}

// ============================================
// AUTHENTICATION
// ============================================

/**
 * Authenticate using biometrics
 * 
 * @param config - Configuration options for the prompt
 * @returns true if authentication succeeded, false otherwise
 */
export async function authenticateWithBiometrics(
  config: BiometricConfig
): Promise<boolean> {
  try {
    // Check if biometrics are available
    const isSupported = await isBiometricSupported();
    const isEnrolled = await isBiometricEnrolled();

    if (!isSupported || !isEnrolled) {
      // Biometrics not available, but we can fallback to device credentials
      if (config.allowDeviceCredentials !== false) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: config.promptMessage,
          fallbackLabel: config.fallbackLabel,
          disableDeviceFallback: false,
        });
        
        if (result.success) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        return result.success;
      }
      return false;
    }

    // Attempt biometric authentication
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: config.promptMessage,
      fallbackLabel: config.fallbackLabel || "Use Passcode",
      disableDeviceFallback: config.allowDeviceCredentials === false,
    });

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return true;
    }

    // Handle specific errors
    if (result.error === "user_cancel") {
      Haptics.selectionAsync();
      return false;
    }

    // Handle lockout errors (lockout_permanent may not exist in all versions)
    if (result.error === "lockout" || (result.error as string) === "lockout_permanent") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const biometricName = await getBiometricTypeName();
      Alert.alert(
        `${biometricName} Locked`,
        `${biometricName} is temporarily locked due to too many failed attempts. Please try again later or use your passcode.`,
        [{ text: "OK" }]
      );
      return false;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    return false;
  } catch (error) {
    console.error("Biometric authentication error:", error);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    return false;
  }
}

// ============================================
// CONVENIENCE FUNCTIONS FOR COMMON ACTIONS
// ============================================

/**
 * Authenticate for account deletion
 */
export async function authenticateForAccountDeletion(): Promise<boolean> {
  const biometricName = await getBiometricTypeName();
  
  return authenticateWithBiometrics({
    promptMessage: `Authenticate with ${biometricName} to delete your account`,
    fallbackLabel: "Use Passcode",
    allowDeviceCredentials: true,
  });
}

/**
 * Authenticate for viewing sensitive data
 */
export async function authenticateForSensitiveData(): Promise<boolean> {
  const biometricName = await getBiometricTypeName();
  
  return authenticateWithBiometrics({
    promptMessage: `Authenticate with ${biometricName} to view sensitive information`,
    fallbackLabel: "Use Passcode",
    allowDeviceCredentials: true,
  });
}

/**
 * Authenticate for payment or purchase actions
 */
export async function authenticateForPayment(): Promise<boolean> {
  const biometricName = await getBiometricTypeName();
  
  return authenticateWithBiometrics({
    promptMessage: `Authenticate with ${biometricName} to confirm payment`,
    fallbackLabel: "Use Passcode",
    allowDeviceCredentials: true,
  });
}

/**
 * Quick check if biometric auth should be shown
 * Returns true if biometrics are available and set up
 */
export async function shouldUseBiometrics(): Promise<boolean> {
  const [supported, enrolled] = await Promise.all([
    isBiometricSupported(),
    isBiometricEnrolled(),
  ]);
  return supported && enrolled;
}
