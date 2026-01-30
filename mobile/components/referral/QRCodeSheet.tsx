/**
 * QRCodeSheet Component
 * 
 * Platform-native QR code display for sharing referral codes.
 * - iOS: Liquid Glass effect, PlatformColor, SF Symbols, native haptics
 * - Android: Material 3 colors, Material Icons, spring animations, native haptics
 */

import React, { useCallback, useMemo, forwardRef, useRef } from 'react';
import {
  Platform,
  PlatformColor,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import QRCode from 'react-native-qrcode-svg';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { SymbolView } from 'expo-symbols';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useThemeColors } from '@/context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LiquidGlassView, useLiquidGlass } from '@/components/ui/LiquidGlass';
import { getReferralLink, APP_NAME } from '@/lib/config';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring 
} from 'react-native-reanimated';

interface QRCodeSheetProps {
  referralCode: string;
  onClose?: () => void;
}

// M3 Expressive Spring Tokens
const M3_SPRINGS = {
  fastSpatial: { stiffness: 1400, damping: 67, mass: 1 },
  defaultSpatial: { stiffness: 700, damping: 48, mass: 1 },
};

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const QRCodeSheet = forwardRef<BottomSheet, QRCodeSheetProps>(
  ({ referralCode, onClose }, ref) => {
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const colors = useThemeColors();
    const { showGlass } = useLiquidGlass();
    const svgRef = useRef<any>(null);

    const referralLink = getReferralLink(referralCode);

    // Snap points
    const snapPoints = useMemo(() => ['65%'], []);

    // Theme colors with platform-specific handling
    const themedColors = useMemo(() => ({
      // Text colors
      text: Platform.OS === 'ios' 
        ? (PlatformColor('label') as unknown as string) 
        : colors.onSurface,
      secondaryText: Platform.OS === 'ios'
        ? (PlatformColor('secondaryLabel') as unknown as string)
        : colors.onSurfaceVariant,
      tertiaryText: Platform.OS === 'ios'
        ? (PlatformColor('tertiaryLabel') as unknown as string)
        : colors.onSurfaceVariant,
      // Background (for Reanimated - must be plain colors)
      sheetBackground: isDark ? '#1C1C1E' : '#FFFFFF',
      qrBackground: '#FFFFFF',
      // Button colors
      buttonBackground: Platform.OS === 'ios'
        ? isDark ? 'rgba(99, 99, 102, 0.3)' : 'rgba(118, 118, 128, 0.12)'
        : colors.surfaceContainerHigh,
      primaryButton: Platform.OS === 'ios'
        ? '#CF944E' // Brand amber
        : colors.primary,
      // Handle
      handle: Platform.OS === 'ios'
        ? isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)'
        : colors.outlineVariant,
    }), [isDark, colors]);

    // Animated scale for buttons
    const saveScale = useSharedValue(1);
    const shareScale = useSharedValue(1);

    const saveAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: saveScale.value }],
    }));

    const shareAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: shareScale.value }],
    }));

    // Handle copy code
    const handleCopyCode = useCallback(async () => {
      if (Platform.OS === 'android') {
        Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      await Clipboard.setStringAsync(referralCode);
    }, [referralCode]);

    // Handle save QR code (copy link as fallback since saving image requires more setup)
    const handleSave = useCallback(async () => {
      // Animate button press
      if (Platform.OS === 'android') {
        saveScale.value = withSpring(0.95, M3_SPRINGS.fastSpatial);
        setTimeout(() => {
          saveScale.value = withSpring(1, M3_SPRINGS.fastSpatial);
        }, 100);
        Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      
      // Copy link to clipboard
      await Clipboard.setStringAsync(referralLink);
    }, [referralLink, saveScale]);

    // Handle share
    const handleShare = useCallback(async () => {
      // Animate button press
      if (Platform.OS === 'android') {
        shareScale.value = withSpring(0.95, M3_SPRINGS.fastSpatial);
        setTimeout(() => {
          shareScale.value = withSpring(1, M3_SPRINGS.fastSpatial);
        }, 100);
        Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Virtual_Key);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      const shareMessage = `Hey! I've been using ${APP_NAME} to meet amazing people. Join me using my referral link!`;

      try {
        await Share.share(
          Platform.OS === 'ios'
            ? { message: shareMessage, url: referralLink }
            : { title: `Join me on ${APP_NAME}!`, message: `${shareMessage} ${referralLink}` }
        );
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }, [referralLink, shareScale]);

    // Handle sheet close
    const handleSheetChange = useCallback((index: number) => {
      if (index === -1) {
        onClose?.();
      }
    }, [onClose]);

    // Background component for iOS Liquid Glass
    const renderBackground = useCallback((props: { style?: any }) => {
      const { style } = props;
      if (Platform.OS === 'ios' && showGlass) {
        return (
          <LiquidGlassView
            style={[style, styles.sheetBackground]}
            glassEffectStyle="regular"
            fallbackColor={themedColors.sheetBackground}
          >
            <View style={StyleSheet.absoluteFill} />
          </LiquidGlassView>
        );
      }
      return (
        <View 
          style={[
            style, 
            styles.sheetBackground, 
            { backgroundColor: themedColors.sheetBackground }
          ]} 
        />
      );
    }, [showGlass, themedColors.sheetBackground]);

    // Render handle indicator
    const renderHandle = useCallback(() => (
      <View style={styles.handleContainer}>
        <View 
          style={[
            styles.handle, 
            { backgroundColor: themedColors.handle }
          ]} 
        />
      </View>
    ), [themedColors.handle]);

    // Platform-specific icon rendering
    const renderIcon = useCallback((
      iosName: string,
      androidName: string,
      size: number = 20,
      color?: string
    ) => {
      if (Platform.OS === 'ios') {
        return (
          <SymbolView
            name={iosName as any}
            tintColor={color || themedColors.text}
            style={{ width: size, height: size }}
            type="hierarchical"
          />
        );
      }
      return (
        <MaterialIcons
          name={androidName as any}
          size={size}
          color={color || themedColors.text}
        />
      );
    }, [themedColors.text]);

    return (
      <BottomSheet
        ref={ref}
        index={0}
        snapPoints={snapPoints}
        onChange={handleSheetChange}
        enablePanDownToClose
        backgroundComponent={renderBackground}
        handleComponent={renderHandle}
        style={styles.sheet}
      >
        <BottomSheetView style={[styles.content, { paddingBottom: insets.bottom + 16 }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: themedColors.text }]}>
              Share via QR Code
            </Text>
            <Text style={[styles.subtitle, { color: themedColors.secondaryText }]}>
              Friends can scan this to join {APP_NAME}
            </Text>
          </View>

          {/* QR Code */}
          <View style={[styles.qrContainer, { backgroundColor: themedColors.qrBackground }]}>
            <QRCode
              value={referralLink}
              size={180}
              backgroundColor={themedColors.qrBackground}
              color="#1F2937"
              ecl="H"
              getRef={(c) => (svgRef.current = c)}
            />
          </View>

          {/* Referral Code */}
          <TouchableOpacity 
            onPress={handleCopyCode}
            style={[styles.codeContainer, { backgroundColor: themedColors.buttonBackground }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.codeLabel, { color: themedColors.tertiaryText }]}>
              Tap to copy code
            </Text>
            <View style={styles.codeRow}>
              <Text style={[styles.codeText, { color: themedColors.primaryButton }]}>
                {referralCode}
              </Text>
              {renderIcon('doc.on.doc', 'content-copy', 16, themedColors.primaryButton)}
            </View>
          </TouchableOpacity>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <AnimatedTouchable
              style={[
                styles.button,
                styles.secondaryButton,
                { backgroundColor: themedColors.buttonBackground },
                saveAnimatedStyle,
              ]}
              onPress={handleSave}
              activeOpacity={0.8}
            >
              {renderIcon('square.and.arrow.down', 'save-alt', 20, themedColors.text)}
              <Text style={[styles.buttonText, { color: themedColors.text }]}>
                Copy Link
              </Text>
            </AnimatedTouchable>

            <AnimatedTouchable
              style={[
                styles.button,
                styles.primaryButton,
                { backgroundColor: themedColors.primaryButton },
                shareAnimatedStyle,
              ]}
              onPress={handleShare}
              activeOpacity={0.8}
            >
              {renderIcon('square.and.arrow.up', 'share', 20, '#FFFFFF')}
              <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
                Share
              </Text>
            </AnimatedTouchable>
          </View>
        </BottomSheetView>
      </BottomSheet>
    );
  }
);

QRCodeSheet.displayName = 'QRCodeSheet';

const styles = StyleSheet.create({
  sheet: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 16,
  },
  sheetBackground: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
  },
  qrContainer: {
    alignSelf: 'center',
    padding: 24,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  codeContainer: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 24,
    alignSelf: 'center',
    minWidth: 180,
  },
  codeLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  codeText: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    minHeight: 52,
  },
  secondaryButton: {},
  primaryButton: {
    shadowColor: '#CF944E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default QRCodeSheet;
