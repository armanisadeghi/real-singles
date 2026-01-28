import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolView, SFSymbol } from 'expo-symbols';
import React from 'react';
import { Platform, StyleProp, ViewStyle } from 'react-native';

/**
 * SF Symbol name mappings for iOS
 * @see https://developer.apple.com/sf-symbols/
 */
const SF_SYMBOL_MAP: Record<string, string> = {
  // Navigation & UI
  'settings': 'gearshape',
  'close': 'xmark',
  'arrow-back': 'chevron.left',
  'arrow-forward': 'chevron.right',
  'chevron-left': 'chevron.left',
  'chevron-right': 'chevron.right',
  'keyboard-arrow-right': 'chevron.right',
  'keyboard-arrow-left': 'chevron.left',
  'keyboard-arrow-down': 'chevron.down',
  'keyboard-arrow-up': 'chevron.up',
  'menu': 'line.3.horizontal',
  'more-vert': 'ellipsis',
  'more-horiz': 'ellipsis',
  'add': 'plus',
  'remove': 'minus',
  'refresh': 'arrow.clockwise',
  'search': 'magnifyingglass',
  'filter-list': 'line.3.horizontal.decrease',
  
  // Actions
  'check': 'checkmark',
  'check-circle': 'checkmark.circle.fill',
  'check-box': 'checkmark.square.fill',
  'check-box-outline-blank': 'square',
  'radio-button-checked': 'circle.inset.filled',
  'radio-button-unchecked': 'circle',
  'edit': 'pencil',
  'delete': 'trash',
  'delete-outline': 'trash',
  'share': 'square.and.arrow.up',
  'send': 'paperplane.fill',
  'download': 'arrow.down.to.line',
  'upload': 'arrow.up.to.line',
  'copy': 'doc.on.doc',
  
  // Communication
  'call': 'phone.fill',
  'phone': 'phone.fill',
  'videocam': 'video.fill',
  'videocam-off': 'video.slash.fill',
  'mic': 'mic.fill',
  'mic-off': 'mic.slash.fill',
  'volume-up': 'speaker.wave.3.fill',
  'volume-off': 'speaker.slash.fill',
  'message': 'message.fill',
  'chat': 'bubble.left.fill',
  'chat-bubble': 'bubble.left.fill',
  'mail': 'envelope.fill',
  
  // Media
  'photo': 'photo',
  'photo-library': 'photo.on.rectangle',
  'camera': 'camera.fill',
  'camera-alt': 'camera.fill',
  'flip-camera-ios': 'camera.rotate',
  'flip-camera-android': 'camera.rotate',
  'image': 'photo',
  'play-arrow': 'play.fill',
  'play-circle-outline': 'play.circle',
  'pause': 'pause.fill',
  'pause-circle-outline': 'pause.circle',
  'stop': 'stop.fill',
  'replay': 'arrow.counterclockwise',
  'replay-10': 'gobackward.10',
  'forward-10': 'goforward.10',
  'skip-previous': 'backward.fill',
  'skip-next': 'forward.fill',
  
  // Social & Feedback
  'favorite': 'heart.fill',
  'favorite-border': 'heart',
  'star': 'star.fill',
  'star-border': 'star',
  'thumb-up': 'hand.thumbsup.fill',
  'thumb-down': 'hand.thumbsdown.fill',
  'flag': 'flag.fill',
  'report': 'exclamationmark.triangle.fill',
  
  // Location & Maps
  'location-on': 'location.fill',
  'location-off': 'location.slash.fill',
  'navigation': 'location.north.fill',
  'directions': 'arrow.triangle.turn.up.right.diamond.fill',
  'map': 'map.fill',
  'place': 'mappin',
  'my-location': 'location.circle.fill',
  
  // People & Accounts
  'person': 'person.fill',
  'person-outline': 'person',
  'people': 'person.2.fill',
  'group': 'person.3.fill',
  'account-circle': 'person.crop.circle.fill',
  'face': 'face.smiling',
  
  // Content & Info
  'info': 'info.circle.fill',
  'info-outline': 'info.circle',
  'help': 'questionmark.circle.fill',
  'help-outline': 'questionmark.circle',
  'warning': 'exclamationmark.triangle.fill',
  'error': 'exclamationmark.circle.fill',
  'error-outline': 'exclamationmark.circle',
  'notifications': 'bell.fill',
  'notifications-none': 'bell',
  'notifications-off': 'bell.slash.fill',
  
  // Calendar & Time
  'event': 'calendar',
  'calendar-today': 'calendar',
  'schedule': 'clock.fill',
  'access-time': 'clock',
  'timer': 'timer',
  'alarm': 'alarm.fill',
  
  // Work & Business
  'work': 'briefcase.fill',
  'business': 'building.2.fill',
  'school': 'graduationcap.fill',
  
  // Files & Documents
  'folder': 'folder.fill',
  'file': 'doc.fill',
  'description': 'doc.text.fill',
  'attachment': 'paperclip',
  'link': 'link',
  
  // Misc
  'visibility': 'eye.fill',
  'visibility-off': 'eye.slash.fill',
  'lock': 'lock.fill',
  'lock-open': 'lock.open.fill',
  'verified': 'checkmark.seal.fill',
  'badge': 'rosette',
  
  // Profile details icons
  'straighten': 'ruler',
  'accessibility-new': 'figure.stand',
  'star-outline': 'star',
  'eco': 'leaf.fill',
  'local-bar': 'wineglass.fill',
  'whatshot': 'flame.fill',
  'public': 'globe',
  'pets': 'pawprint.fill',
  'people-outline': 'person.2',
  'mail-outline': 'envelope',
};

export interface PlatformIconProps {
  /**
   * MaterialIcons name - will be automatically mapped to SF Symbol on iOS
   */
  name: string;
  /**
   * Icon size in points
   */
  size?: number;
  /**
   * Icon color - accepts hex, rgb, or named colors
   */
  color?: string;
  /**
   * Optional SF Symbol name override for iOS
   * Use this when automatic mapping doesn't provide the desired symbol
   */
  iosName?: string;
  /**
   * Style to apply to the icon container
   */
  style?: StyleProp<ViewStyle>;
  /**
   * SF Symbol rendering type
   * @default 'monochrome'
   */
  symbolType?: 'monochrome' | 'hierarchical' | 'palette' | 'multicolor';
}

/**
 * Platform-native icon component
 * 
 * Automatically uses SF Symbols on iOS and MaterialIcons on Android.
 * This follows iOS Human Interface Guidelines by using native system icons.
 * 
 * @example
 * // Basic usage - automatic mapping
 * <PlatformIcon name="settings" size={24} color="#000" />
 * 
 * @example
 * // With iOS-specific symbol override
 * <PlatformIcon name="favorite" iosName="heart.circle.fill" size={24} color="red" />
 */
export function PlatformIcon({
  name,
  size = 24,
  color = '#000000',
  iosName,
  style,
  symbolType = 'monochrome',
}: PlatformIconProps) {
  if (Platform.OS === 'ios') {
    // Use provided iosName or look up in mapping, fallback to name if not found
    const sfSymbolName = (iosName || SF_SYMBOL_MAP[name] || name) as SFSymbol;
    
    return (
      <SymbolView
        name={sfSymbolName}
        style={[{ width: size, height: size }, style]}
        tintColor={color}
        type={symbolType}
      />
    );
  }

  // Android: Use MaterialIcons
  return (
    <MaterialIcons
      name={name as any}
      size={size}
      color={color}
      style={style as any}
    />
  );
}

export default PlatformIcon;
