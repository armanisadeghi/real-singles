# Call Notification System Implementation Guide

**Goal:** Create a robust, attention-grabbing notification system for video/voice calls that works across all platforms and app states.

---

## 1. Multi-Layer Notification Strategy

### Layer 1: Native Call UI (Highest Priority)
- **iOS:** CallKit integration - native full-screen call UI even when app is killed
- **Android:** ConnectionService - native full-screen incoming call screen
- **Result:** User sees native phone call interface, can answer from lock screen

### Layer 2: Push Notifications (High Priority)
- **When:** App is backgrounded or closed
- **Type:** Time-sensitive/critical priority notifications
- **Sound:** Custom ringtone, continuous until answered/declined
- **Action:** Opens directly to call acceptance screen

### Layer 3: In-App Notifications (Current - Enhanced)
- **When:** App is open and in foreground
- **Type:** Full-screen modal with large accept/decline buttons
- **Sound:** Loud ringtone with vibration
- **Visual:** Caller photo, name, call type indicator

### Layer 4: Web Push Notifications (New)
- **When:** Web app tab is backgrounded or closed
- **Type:** Browser notification with custom sound
- **Action:** Focuses tab or opens new window to call screen

---

## 2. Platform-Specific Implementation

### 2.1 iOS - CallKit Integration

**Library:** `@react-native-voice-over-ip/ios-callkit` (latest)

**What it provides:**
- Native iOS call screen (same as phone calls)
- Lock screen call notifications
- Call history in Phone app
- Siri integration
- CarPlay support

**Key Features:**
```typescript
// CallKit setup
CallKit.setup({
  appName: 'RealSingles',
  ringtoneSound: 'ringtone.mp3',
  includesCallsInRecents: true,
  supportsVideo: true,
});

// Display incoming call
CallKit.displayIncomingCall({
  uuid: callId,
  handle: callerName,
  handleType: 'generic',
  hasVideo: true,
  supportsGrouping: false,
  supportsUngrouping: false,
  supportsHolding: false,
  supportsDTMF: false,
});
```

**Permissions Required:**
- VoIP background mode (`UIBackgroundModes: ['voip']`)
- Push notification entitlement
- Microphone permission (already have)
- Camera permission (already have)

**PushKit (VoIP Push):**
- Special type of push notification that wakes app from killed state
- Delivered instantly even when app is terminated
- Required for CallKit to work when app is closed

---

### 2.2 Android - ConnectionService

**Library:** `@react-native-voip-call/android-connectionservice` or `react-native-callkeep`

**What it provides:**
- Native Android call screen
- Full-screen incoming call UI (even over lock screen)
- System call log integration
- Bluetooth headset support
- Auto route to speakerphone for video

**Key Features:**
```typescript
// ConnectionService setup
RNCallKeep.setup({
  android: {
    alertTitle: 'Permissions Required',
    alertDescription: 'This app needs access to your phone accounts',
    cancelButton: 'Cancel',
    okButton: 'OK',
    imageName: 'phone_account_icon',
    additionalPermissions: [PermissionsAndroid.PERMISSIONS.READ_CONTACTS],
  },
});

// Display incoming call
RNCallKeep.displayIncomingCall(
  callUUID,
  callerHandle,
  callerName,
  'generic',
  hasVideo
);
```

**Permissions Required:**
```xml
<!-- AndroidManifest.xml -->
<uses-permission android:name="android.permission.READ_PHONE_STATE"/>
<uses-permission android:name="android.permission.CALL_PHONE"/>
<uses-permission android:name="android.permission.FOREGROUND_SERVICE"/>
<uses-permission android:name="android.permission.MANAGE_OWN_CALLS"/>
<uses-permission android:name="android.permission.READ_CONTACTS"/>
<uses-permission android:name="android.permission.WAKE_LOCK"/>
<uses-permission android:name="android.permission.USE_FULL_SCREEN_INTENT"/>
```

**Notification Channel (High Importance):**
```typescript
notifee.createChannel({
  id: 'calls',
  name: 'Video & Voice Calls',
  importance: AndroidImportance.HIGH,
  sound: 'ringtone',
  vibration: true,
  vibrationPattern: [300, 500, 300, 500, 300, 500],
  lights: true,
  lightColor: AndroidColor.RED,
});
```

---

### 2.3 Web - Push Notifications + Service Worker

**Library:** Web Push API (native browser API)

**What it provides:**
- Browser notifications even when tab is closed
- Custom sound playback
- Action buttons (Accept/Decline)
- Badge updates

**Key Components:**

**Service Worker (`public/sw.js`):**
```javascript
// Listen for push notifications
self.addEventListener('push', (event) => {
  const data = event.data.json();
  
  if (data.type === 'call_invitation') {
    event.waitUntil(
      self.registration.showNotification('Incoming Call', {
        body: `${data.callerName} is calling you`,
        icon: data.callerPhoto,
        badge: '/icon-badge.png',
        tag: `call-${data.callId}`,
        requireInteraction: true, // Stays until user interacts
        silent: false,
        sound: '/sounds/ringtone.mp3',
        vibrate: [300, 100, 300, 100, 300],
        actions: [
          { action: 'accept', title: 'Accept' },
          { action: 'decline', title: 'Decline' },
        ],
        data: {
          callId: data.callId,
          roomName: data.roomName,
        },
      })
    );
  }
});

// Handle notification actions
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'accept') {
    clients.openWindow(`/call/${event.notification.data.roomName}`);
  } else if (event.action === 'decline') {
    // Call API to decline
    fetch(`/api/calls/${event.notification.data.callId}/decline`, {
      method: 'POST',
    });
  }
});
```

**Permission Request:**
```typescript
// Request notification permission
const permission = await Notification.requestPermission();

if (permission === 'granted') {
  // Register service worker
  const registration = await navigator.serviceWorker.register('/sw.js');
  
  // Subscribe to push notifications
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });
  
  // Send subscription to backend
  await fetch('/api/notifications/subscribe', {
    method: 'POST',
    body: JSON.stringify(subscription),
  });
}
```

**Permissions Required:**
- Notification permission (browser prompt)
- Service worker registration
- VAPID keys for push service

---

## 3. Backend Implementation

### 3.1 Push Notification Trigger

**Database Trigger (`web/supabase/migrations/`):**
```sql
CREATE OR REPLACE FUNCTION notify_call_invitation()
RETURNS TRIGGER AS $$
DECLARE
  caller_name TEXT;
  caller_photo TEXT;
  recipient_device_tokens TEXT[];
BEGIN
  -- Get caller info
  SELECT display_name, photo_urls[1]
  INTO caller_name, caller_photo
  FROM users
  WHERE id = NEW.caller_id;
  
  -- Get recipient's device tokens
  SELECT array_agg(token)
  INTO recipient_device_tokens
  FROM user_notification_tokens
  WHERE user_id = NEW.recipient_id AND active = true;
  
  -- Send push notification via pg_net or edge function
  PERFORM net.http_post(
    url := current_setting('app.edge_function_url') || '/send-call-notification',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object(
      'tokens', recipient_device_tokens,
      'caller_id', NEW.caller_id,
      'caller_name', caller_name,
      'caller_photo', caller_photo,
      'call_id', NEW.id,
      'room_name', NEW.room_name,
      'call_type', NEW.call_type
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_call_invitation_insert
  AFTER INSERT ON call_invitations
  FOR EACH ROW
  EXECUTE FUNCTION notify_call_invitation();
```

### 3.2 Push Notification Service

**Edge Function or API Route (`web/src/app/api/notifications/send-call/route.ts`):**
```typescript
export async function POST(req: Request) {
  const { tokens, caller_name, caller_photo, call_id, room_name, call_type } = await req.json();
  
  // iOS - VoIP Push via APNs
  const apnsPayload = {
    aps: {
      alert: {
        title: 'Incoming Call',
        body: `${caller_name} is calling you`,
      },
      sound: 'ringtone.caf',
      category: 'CALL_INVITATION',
      'thread-id': call_id,
    },
    callId: call_id,
    roomName: room_name,
    callType: call_type,
    callerName: caller_name,
    callerPhoto: caller_photo,
  };
  
  // Android - FCM with high priority
  const fcmPayload = {
    notification: {
      title: 'Incoming Call',
      body: `${caller_name} is calling you`,
      sound: 'ringtone',
      android_channel_id: 'calls',
      priority: 'high',
      visibility: 'public',
    },
    data: {
      type: 'call_invitation',
      callId: call_id,
      roomName: room_name,
      callType: call_type,
      callerName: caller_name,
      callerPhoto: caller_photo,
    },
    android: {
      priority: 'high',
      ttl: '30s', // Expire quickly for calls
      notification: {
        channel_id: 'calls',
        sound: 'ringtone',
        priority: 'max',
        visibility: 'public',
        default_vibrate_timings: false,
        vibrate_timings: ['300ms', '500ms', '300ms', '500ms'],
      },
    },
  };
  
  // Web - Web Push
  const webPushPayload = {
    type: 'call_invitation',
    callId: call_id,
    roomName: room_name,
    callType: call_type,
    callerName: caller_name,
    callerPhoto: caller_photo,
  };
  
  // Send to all tokens
  await Promise.all(
    tokens.map(async (token) => {
      if (token.platform === 'ios') {
        await sendAPNs(token.value, apnsPayload);
      } else if (token.platform === 'android') {
        await sendFCM(token.value, fcmPayload);
      } else if (token.platform === 'web') {
        await sendWebPush(token.value, webPushPayload);
      }
    })
  );
  
  return Response.json({ success: true });
}
```

---

## 4. Enhanced In-App Notifications

### 4.1 Mobile - Full-Screen Modal

**Location:** `mobile/components/IncomingCall.tsx` (enhance existing)

**Features:**
- Full-screen takeover (not just a modal)
- Large caller photo (200x200)
- Pulsing animation on photo
- Slide-to-answer gesture (iOS-style)
- Large decline button
- Vibration pattern
- Loud ringtone with fade-in
- Show call type (video/voice) with icon

```typescript
// Enhanced visual hierarchy
<View style={styles.fullScreen}>
  <Animated.View style={[styles.callerPhoto, pulseAnimation]}>
    <Image source={{ uri: callerPhoto }} style={styles.photo} />
  </Animated.View>
  
  <Text style={styles.callerName}>{callerName}</Text>
  <Text style={styles.callType}>
    {isVideo ? '📹 Video Call' : '📞 Voice Call'}
  </Text>
  
  <View style={styles.actions}>
    <SlideToAnswer onAnswer={acceptCall} />
    <TouchableOpacity onPress={declineCall} style={styles.decline}>
      <Text style={styles.declineText}>Decline</Text>
    </TouchableOpacity>
  </View>
</View>
```

### 4.2 Web - Full-Screen Modal

**Location:** `web/src/components/video-call/IncomingCallModal.tsx` (enhance existing)

**Features:**
- Blur background completely
- Center large modal (600x400)
- Animated caller photo (scale pulse)
- Large Accept/Decline buttons
- Browser notification sound (HTML5 Audio)
- Show call type and caller info
- Countdown timer (30s auto-decline)

```tsx
<div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md">
  <div className="w-[600px] rounded-2xl bg-white p-12 shadow-2xl dark:bg-gray-900">
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        <img
          src={callerPhoto}
          alt={callerName}
          className="h-40 w-40 rounded-full object-cover ring-4 ring-primary animate-pulse-slow"
        />
        {isVideo && (
          <div className="absolute bottom-0 right-0 rounded-full bg-primary p-2">
            <VideoIcon className="h-6 w-6 text-white" />
          </div>
        )}
      </div>
      
      <div className="text-center">
        <h2 className="text-3xl font-bold">{callerName}</h2>
        <p className="text-lg text-muted-foreground">
          {isVideo ? 'Video Call' : 'Voice Call'}
        </p>
      </div>
      
      <div className="flex gap-6">
        <Button
          size="lg"
          onClick={accept}
          className="h-16 w-32 text-xl bg-green-600 hover:bg-green-700"
        >
          Accept
        </Button>
        <Button
          size="lg"
          variant="destructive"
          onClick={decline}
          className="h-16 w-32 text-xl"
        >
          Decline
        </Button>
      </div>
      
      <p className="text-sm text-muted-foreground">
        Auto-decline in {countdown}s
      </p>
    </div>
  </div>
</div>
```

---

## 5. Sound & Vibration

### 5.1 Ringtone Assets

**Required Files:**
- `assets/sounds/ringtone.mp3` (Web, Android)
- `assets/sounds/ringtone.caf` (iOS - Core Audio Format)

**Ringtone Requirements:**
- Duration: 5-10 seconds (will loop)
- Format: MP3 (Android/Web), CAF (iOS)
- Volume: Normalized to 0dB
- Style: Pleasant but attention-grabbing

**Free Sources:**
- Zedge.net (free ringtones)
- Freesound.org (CC0 licensed)
- iOS default ringtones (can extract from iOS Simulator)

### 5.2 Mobile Sound Playback

**Library:** `expo-av` (already in use)

```typescript
import { Audio } from 'expo-av';

const [sound, setSound] = useState<Audio.Sound>();

// Play ringtone on call invitation
async function playRingtone() {
  const { sound: ringtone } = await Audio.Sound.createAsync(
    require('./assets/sounds/ringtone.mp3'),
    { shouldPlay: true, isLooping: true, volume: 1.0 }
  );
  setSound(ringtone);
}

// Stop when answered/declined
async function stopRingtone() {
  if (sound) {
    await sound.stopAsync();
    await sound.unloadAsync();
  }
}
```

### 5.3 Vibration Patterns

**iOS (Haptics):**
```typescript
import * as Haptics from 'expo-haptics';

// Continuous notification feedback
const vibrationInterval = setInterval(() => {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}, 1000);

// Stop on answer/decline
clearInterval(vibrationInterval);
```

**Android (Vibration):**
```typescript
import { Vibration } from 'react-native';

// Pattern: wait 300ms, vibrate 500ms, repeat
const pattern = [300, 500, 300, 500, 300, 500];
Vibration.vibrate(pattern, true); // true = repeat

// Stop
Vibration.cancel();
```

---

## 6. Permission Management

### 6.1 Permission Checklist

| Platform | Permission | Purpose | When to Request |
|----|----|----|----|
| iOS | Push Notifications | VoIP push | On first call attempt |
| iOS | Microphone | Audio calls | Before joining call |
| iOS | Camera | Video calls | Before joining video call |
| iOS | Background VoIP | CallKit | Auto (in app.json) |
| Android | Push Notifications | FCM | On first call attempt |
| Android | Phone State | ConnectionService | Before first call |
| Android | Call Phone | ConnectionService | Before first call |
| Android | Foreground Service | Background call | Auto (in AndroidManifest) |
| Android | Full Screen Intent | Lock screen overlay | Before first call |
| Android | Microphone | Audio calls | Before joining call |
| Android | Camera | Video calls | Before joining video call |
| Web | Notifications | Browser notifications | On first app load |
| Web | Microphone | Audio calls | Before joining call |
| Web | Camera | Video calls | Before joining video call |

### 6.2 Permission Request Flow

**Step 1: On App Launch (One-Time)**
```typescript
// Request notification permissions
await requestNotificationPermissions();
```

**Step 2: Before First Call (One-Time)**
```typescript
// iOS: CallKit automatically requests, no manual prompt needed
// Android: Request phone permissions
if (Platform.OS === 'android') {
  await requestPhonePermissions();
}
```

**Step 3: Before Joining Call (Every Time)**
```typescript
// Request camera/mic based on call type
if (isVideoCall) {
  await requestCameraPermission();
}
await requestMicrophonePermission();
```

### 6.3 Permission Request UI

**Implement a dedicated permissions screen:**
- Show before first call attempt
- Explain why each permission is needed
- Step-by-step grant process
- Link to app settings if denied

---

## 7. Implementation Priority

### Phase 1: Core Push Notifications (1-2 weeks)
- [ ] Add push notification tokens storage to database
- [ ] Implement FCM for Android
- [ ] Implement APNs for iOS
- [ ] Create database trigger on `call_invitations` INSERT
- [ ] Build push notification sending service
- [ ] Add notification channel for Android calls

### Phase 2: Native Call UI (2-3 weeks)
- [ ] Integrate CallKit for iOS
- [ ] Integrate ConnectionService for Android
- [ ] Handle VoIP push notifications (iOS)
- [ ] Handle FCM data-only messages (Android)
- [ ] Connect native UI to LiveKit room joining

### Phase 3: Enhanced In-App UI (1 week)
- [ ] Redesign IncomingCallModal (web) with larger UI
- [ ] Enhance IncomingCall component (mobile) with full-screen
- [ ] Add ringtone assets
- [ ] Implement vibration patterns
- [ ] Add caller photo and call type indicators

### Phase 4: Web Push Notifications (1 week)
- [ ] Register service worker
- [ ] Implement push notification subscription
- [ ] Add VAPID keys to backend
- [ ] Send web push on call invitations
- [ ] Handle notification actions (accept/decline)

### Phase 5: Mobile LiveKit Migration (2 weeks)
- [ ] Migrate mobile from Agora to LiveKit
- [ ] Update CallContext to use Supabase Realtime (not Agora Chat)
- [ ] Test video/voice calls end-to-end
- [ ] Remove Agora dependencies

---

## 8. Testing Checklist

### App States to Test

| State | iOS | Android | Web |
|----|----|----|----|
| App open, in foreground | ✓ In-app modal | ✓ In-app modal | ✓ In-app modal |
| App open, in background | ✓ CallKit | ✓ ConnectionService | ✓ Browser notification |
| App closed (killed) | ✓ VoIP push + CallKit | ✓ FCM + ConnectionService | ✓ Service worker notification |
| Lock screen | ✓ CallKit over lock screen | ✓ Full-screen intent | N/A |
| Do Not Disturb mode | ✓ Bypasses DND (VoIP) | ✓ Bypasses DND (high priority) | ❌ Respects DND |

### Scenarios to Test

- [ ] Video call invitation (app open)
- [ ] Voice call invitation (app open)
- [ ] Call invitation (app backgrounded)
- [ ] Call invitation (app killed)
- [ ] Call invitation during active call
- [ ] Decline call
- [ ] Accept call
- [ ] Missed call (no answer)
- [ ] Caller cancels call before answer
- [ ] Multiple simultaneous call invitations
- [ ] Call invitation on poor network
- [ ] Permissions denied by user

---

## 9. Monitoring & Analytics

### Events to Track

- `call_invitation_sent` - When invitation is created
- `call_notification_delivered` - Push notification delivered
- `call_notification_opened` - User tapped notification
- `call_accepted` - User accepted call
- `call_declined` - User declined call
- `call_missed` - No response within timeout
- `call_notification_failed` - Push delivery failed

### Metrics to Monitor

- Push notification delivery rate (should be >95%)
- Time from invitation to notification (should be <2s)
- Call acceptance rate
- Missed call rate
- Average time to answer

---

## 10. Cost Considerations

### Push Notification Services

**Firebase Cloud Messaging (FCM):**
- Free for unlimited messages
- Required for Android push
- Optional for iOS (can use APNs directly)

**Apple Push Notification Service (APNs):**
- Free for unlimited messages
- Required for iOS push
- VoIP push certificates required

**Web Push:**
- Free (browser-native)
- Requires VAPID keys (free to generate)

### Estimated Monthly Costs

Assuming 10,000 active users, 5 calls per user per month:
- Push notifications: $0 (FCM and APNs are free)
- Additional server processing: ~$5-10 (for Edge Functions)
- **Total:** ~$5-10/month

---

## 11. Security & Privacy

### Best Practices

1. **Never include sensitive data in push notifications**
   - Only include call ID, caller name, and call type
   - No message content or private info

2. **Validate all notification actions**
   - Check user is still recipient before allowing answer
   - Verify call invitation still exists and hasn't expired

3. **Expire notifications quickly**
   - TTL of 30 seconds for call invitations
   - Auto-decline after 30 seconds

4. **Rate limiting**
   - Limit call invitations to prevent spam
   - Max 3 outgoing calls per user per hour

5. **User blocking**
   - Blocked users cannot send call invitations
   - Check block status before sending notification

---

## 12. References

### Libraries

- **iOS CallKit:** `@react-native-voice-over-ip/ios-callkit`
- **Android ConnectionService:** `react-native-callkeep`
- **Push Notifications:** `expo-notifications` (already using)
- **Sound:** `expo-av` (already using)
- **Haptics:** `expo-haptics` (already using)

### Documentation

- [iOS CallKit Framework](https://developer.apple.com/documentation/callkit)
- [Android ConnectionService](https://developer.android.com/reference/android/telecom/ConnectionService)
- [FCM Documentation](https://firebase.google.com/docs/cloud-messaging)
- [APNs Documentation](https://developer.apple.com/documentation/usernotifications)
- [Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [LiveKit Expo Guide](https://docs.livekit.io/home/quickstarts/expo/)

---

**End of Implementation Guide**
