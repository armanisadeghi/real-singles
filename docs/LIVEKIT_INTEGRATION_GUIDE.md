**LIVEKIT INTEGRATION GUIDE**

Video & Audio Chat for Web + Mobile

AI Matrx  |  February 2026  |  Confidential

# **1. Overview**

We are integrating LiveKit for real-time video and audio chat across web (Next.js) and mobile (Expo/React Native). LiveKit is open-source (Apache 2.0), has first-class TypeScript support, and offers both a managed cloud service and self-hosting. All SDKs are currently on v2.x.

**Key links:** Docs: docs.livekit.io  |  Cloud Dashboard: cloud.livekit.io  |  GitHub: github.com/livekit

# **2. Required Packages & Versions**

All packages below are the latest stable versions as of February 2026. Pin these exact versions in package.json to avoid breaking changes.

## **2.1 Web (Next.js)**

Install in the Next.js project root:

`npm install livekit-client@^2.17.0 @livekit/components-react@^2.9.17 @livekit/components-styles livekit-server-sdk@^2.15.0`

| Package | Version | Purpose |
| :---- | :---- | :---- |
| `livekit-client` | 2.17.0 | Core JS/TS client SDK (v2). Handles WebRTC connections, tracks, rooms. |
| `@livekit/components-react` | 2.9.17 | Pre-built React components: LiveKitRoom, VideoConference, ControlBar, etc. |
| `@livekit/components-styles` | latest | Default CSS styles for components. Import globally. |
| `livekit-server-sdk` | 2.15.0 | Server-side SDK for token generation. Runs in Next.js API routes. |

## **2.2 Mobile (Expo / React Native)**

Install in the Expo project root:

`npx expo install livekit-client @livekit/react-native @livekit/react-native-expo-plugin @livekit/react-native-webrtc @config-plugins/react-native-webrtc`

| Package | Version | Purpose |
| :---- | :---- | :---- |
| `livekit-client` | 2.17.0 | Same core SDK shared with web. |
| `@livekit/react-native` | 2.9.6 | React Native SDK with hooks: LiveKitRoom, useTracks, AudioSession, etc. |
| `@livekit/react-native-webrtc` | 137.0.2 | WebRTC native module for React Native. |
| `@livekit/react-native-expo-plugin` | latest | Expo config plugin. Handles native iOS/Android setup. |
| `@config-plugins/react-native-webrtc` | latest | Companion config plugin for WebRTC permissions. |

# **3. Critical Setup Notes**

## **3.1 Expo Go Is NOT Compatible**

LiveKit requires native WebRTC modules. You **must** use Expo Development Builds (expo-dev-client). Expo Go will not work. Run `npx expo run:ios` or `npx expo run:android` for local dev, or use EAS Build for production.

## **3.2 Expo app.json / app.config.js Plugins**

Add both plugins to the plugins array. Without this, camera/mic permissions and native WebRTC setup will be missing:

`{  "expo": {    "plugins": [      "@livekit/react-native-expo-plugin",      "@config-plugins/react-native-webrtc"    ]  }}`

Optional: For audio-only scenarios, set the audioType to "media" instead of the default "communication".

## **3.3 Register Globals (Mobile Only)**

In your mobile app entry file (e.g., index.js or App.tsx), call registerGlobals() **before any other code**. This initializes the WebRTC polyfills:

`import { registerGlobals } from '@livekit/react-native';registerGlobals();`

## **3.4 AudioSession Management (Mobile Only)**

On mobile, you must explicitly start and stop the audio session. Use a useEffect in your room component to call AudioSession.startAudioSession() on mount and AudioSession.stopAudioSession() on unmount. Without this, audio will not work on iOS.

# **4. Environment Variables**

Add these to your Next.js server .env.local (never commit this file):

| Variable | Description |
| :---- | :---- |
| `LIVEKIT_URL` | WebSocket URL from LiveKit Cloud dashboard (wss://your-project.livekit.cloud) |
| `LIVEKIT_API_KEY` | API key from the LiveKit Cloud project settings page |
| `LIVEKIT_API_SECRET` | API secret from the LiveKit Cloud project settings page |

**Important:** The LIVEKIT_URL is the only value exposed to the client. API key and secret must stay server-side only. The mobile app fetches tokens from the Next.js API route, so it only needs the LIVEKIT_URL and your API route URL.

# **5. Token Generation (Server-Side)**

Create a Next.js API route to generate access tokens. Tokens encode the participant identity, room name, and permissions. Tokens are JWTs signed with your API secret.

**File:** `app/api/livekit/token/route.ts`

**Key points:**

* Import AccessToken from livekit-server-sdk  
* Create an AccessToken with the API key, secret, and participant identity  
* Call addGrant() with roomJoin: true and the room name  
* Call await at.toJwt() (v2 is async, unlike v1)  
* Return the token and the LIVEKIT_URL to the client

**v2 breaking change:** toJwt() is now async. If you see sync code examples online using toJWT(), those are v1 patterns. Always await it.

Default token TTL is 6 hours. Override by passing ttl in the AccessToken options (in seconds or as a time string like "2h").

**Authenticate the request:** Validate the user against Supabase auth before generating the token. Use the Supabase user ID or email as the participant identity for consistency.

# **6. Web Implementation (Next.js)**

## **6.1 Component Architecture**

The web implementation uses @livekit/components-react which provides ready-to-use React components. The key wrapper component is LiveKitRoom, which manages the Room object and connection lifecycle.

**Core components to use:**

| Component | What It Does |
| :---- | :---- |
| `<LiveKitRoom>` | Wraps your UI. Accepts serverUrl, token, connect, audio, video props. |
| `<VideoConference>` | Full pre-built video conference UI with grid layout and controls. |
| `<ControlBar>` | Mic/camera/screenshare toggle buttons. |
| `<GridLayout>` | Auto-arranges participant video tiles in a responsive grid. |
| `<ParticipantTile>` | Renders a single participant's video/audio with name overlay. |

## **6.2 Key Hooks**

| Hook | Purpose |
| :---- | :---- |
| `useTracks()` | Returns all tracks in the room filtered by source (camera, microphone, screen). |
| `useParticipants()` | Returns list of all remote participants in the room. |
| `useRoomContext()` | Access the Room object directly for advanced control. |
| `useConnectionState()` | Track connection status for loading/error UI states. |

## **6.3 Styling**

Import @livekit/components-styles globally in your layout. The components expose className props and CSS custom properties you can override with Tailwind. For a custom UI, skip the pre-built components and use the hooks directly with your own Tailwind-styled elements.

# **7. Mobile Implementation (Expo)**

## **7.1 Component Pattern**

The React Native SDK provides the same LiveKitRoom wrapper and useTracks hook. The key differences from web are the AudioSession management and the use of VideoTrack from @livekit/react-native instead of HTML video elements.

**Important mobile-specific patterns:**

* Always wrap track rendering with isTrackReference() guard before rendering VideoTrack  
* Use adaptiveStream with pixelDensity: 'screen' in the LiveKitRoom options for proper resolution handling across different screen densities  
* For audio-only calls, set video={false} on LiveKitRoom to skip camera permission requests  
* For background audio on iOS, you need to integrate CallKit (use react-native-callkeep)

## **7.2 Permissions**

The Expo config plugins handle camera and microphone permissions automatically. If you need additional permission strings (e.g., for iOS background audio), add them to your app.json under ios.infoPlist.

# **8. Architecture & Connection Flow**

The signaling flow is the same for both web and mobile:

1. Client requests a token from the Next.js API route (POST /api/livekit/token with room name and user identity)  
2. API route validates the user session against Supabase, generates a LiveKit access token  
3. API route returns { token, serverUrl } to the client  
4. Client passes token and serverUrl to LiveKitRoom component  
5. LiveKit handles all WebRTC negotiation, TURN/STUN servers, quality adaptation, and reconnection

**Room lifecycle:** Rooms are created automatically when the first participant joins and destroyed when the last participant leaves. Room names must be unique strings. Store call metadata (room name, participants, timestamps) in Supabase for your app's history/logs.

# **9. Supabase Integration Points**

* **Auth:** Use the Supabase session/JWT to authenticate the token generation API route. The Supabase user_id becomes the LiveKit participant identity.  
* **Call history:** Create a calls table to log room_name, participants, start_time, end_time, call_type (audio/video).  
* **Notifications:** Use Supabase Realtime to notify users of incoming calls. When User A initiates a call, insert a row into a call_invitations table. User B subscribes to that table via Realtime and sees the incoming call.  
* **Email (Resend):** For missed calls, trigger an email via Resend from a Supabase Edge Function or from the Next.js server when a call ends without being answered.

# **10. LiveKit Cloud Pricing (as of Feb 2026)**

Start on the free Build plan. No credit card required.

| Resource | Build (Free) | Ship ($50/mo) | Scale ($500/mo) | Enterprise |
| :---- | :---- | :---- | :---- | :---- |
| **WebRTC Minutes** | 5,000 | 150,000 | 1.5M | Custom |
| **Concurrent** | 100 | 1,000 | 5,000 | Unlimited |
| **Bandwidth** | 50 GB | 250 GB | 3 TB | Custom |
| **Connection Fee** | Included | $0.0005/min | $0.0004/min | Custom |

**Self-hosting option:** The LiveKit server is fully open source. Self-host on a VPS ($20-40/mo) for full control and zero per-minute costs. The SDKs work identically with both cloud and self-hosted. You can start with cloud and migrate later without any code changes.

# **11. Common Gotchas & Things to Watch For**

* **v2 SDK only —** All SDKs are on v2. Do not install v1 packages. If you see tutorials using room.participants, it has been renamed to room.remoteParticipants in v2. See docs.livekit.io/reference/migration-guides/migrate-from-v1/ for all changes.  
* **toJwt() is async in v2 —** The server SDK's AccessToken.toJwt() returns a Promise now. Always await it.  
* **No Expo Go —** LiveKit requires native modules. Use development builds only.  
* **registerGlobals() must be first —** Call this before any other LiveKit or RN code in your mobile entry point.  
* **AudioSession on iOS —** Without explicitly starting the audio session, audio will not work on iOS. This is the #1 cause of "I can see video but can't hear anything" bugs.  
* **Participant identity must be unique —** If two users connect with the same identity, the first one gets disconnected (DUPLICATE_IDENTITY error).  
* **API secrets never on client —** LIVEKIT_API_KEY and LIVEKIT_API_SECRET must only be used in server-side code (API routes). Never expose them in client bundles or env vars prefixed with NEXT_PUBLIC_.  
* **Upstream bandwidth is free —** LiveKit Cloud only meters downstream data transfer. This is good news for video publishing-heavy use cases.

# **12. Reference Links**

| Resource | URL |
| :---- | :---- |
| Next.js Quickstart | docs.livekit.io/home/quickstarts/nextjs-13/ |
| Expo Quickstart | docs.livekit.io/home/quickstarts/expo/ |
| React Components Docs | docs.livekit.io/reference/components/react/ |
| Server SDK (Token Gen) | npmjs.com/package/livekit-server-sdk |
| v1 to v2 Migration Guide | docs.livekit.io/reference/migration-guides/migrate-from-v1/ |
| Expo Example App | github.com/livekit-examples/react-native-expo-quickstart |
| LiveKit Cloud Dashboard | cloud.livekit.io |
| Pricing | livekit.io/pricing |

*— End of Guide —*