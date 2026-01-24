# RealSingles Mobile App

React Native / Expo mobile application for the RealSingles dating platform.

## Tech Stack

- **Framework**: React Native 0.79.6 with Expo SDK 53
- **Navigation**: Expo Router 5.x (file-based routing)
- **Styling**: NativeWind 4.x (Tailwind CSS for React Native)
- **State Management**: React Context (AuthContext)
- **Backend**: Supabase (PostgreSQL + Auth)
- **Real-time**: Agora Chat SDK, Agora RTC SDK

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (Mac) or Android Studio (for Android emulator)

### Installation

```bash
# Install dependencies
pnpm install

# Start the development server
pnpm start

# Run on iOS simulator
pnpm ios

# Run on Android emulator
pnpm android
```

### Environment Variables

Create a `.env` file in the mobile directory with:

```bash
# API Configuration
EXPO_PUBLIC_API_URL=http://localhost:3000/api

# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-publishable-key

# Agora Configuration (optional)
EXPO_PUBLIC_AGORA_APP_ID=
EXPO_PUBLIC_AGORA_CHAT_APP_KEY=

# Google Maps (optional)
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=
```

## Architecture

### Authentication Flow

The app uses **Supabase Auth** for authentication:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Login/Signup  │────▶│  Supabase Auth  │────▶│   AuthContext   │
│     Screens     │     │   (lib/supabase)│     │  (utils/auth)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                                                ┌─────────────────┐
                                                │   App Screens   │
                                                │  (/(tabs), etc) │
                                                └─────────────────┘
```

**Key files:**
- `lib/supabase.ts` - Supabase client configuration and helper functions
- `utils/authContext.tsx` - React Context for auth state management
- `app/(auth)/login.tsx` - Login screen
- `app/(auth)/signup.tsx` - Multi-step signup flow

### Autosave Feature

The profile edit screen (`app/editProfile/index.tsx`) includes autosave:

- **5-second debounce**: Saves after 5 seconds of inactivity
- **Change detection**: Only saves when data actually changes
- **Background save**: Saves when app goes to background
- **Visual feedback**: Shows "Saved", "Saving...", "Unsaved changes"

### File Structure

```
mobile/
├── app/                    # Expo Router screens
│   ├── (auth)/            # Auth screens (login, signup)
│   ├── (tabs)/            # Main tab navigation
│   ├── editProfile/       # Profile editing
│   ├── chat/              # Chat screens
│   └── ...
├── components/            # Reusable components
│   ├── forms/            # Form components
│   ├── signup/           # Signup flow steps
│   └── ui/               # UI primitives
├── lib/                   # Core libraries
│   ├── supabase.ts       # Supabase client ⭐
│   └── api.ts            # API client for Next.js backend
├── utils/                 # Utilities
│   ├── authContext.tsx   # Auth context ⭐
│   └── token.ts          # Token utilities (deprecated)
├── constants/             # Constants and config
├── types/                 # TypeScript types
└── assets/               # Images, fonts, etc.
```

## Migration Notes

### Backend Architecture

The app uses the Next.js API backend with Supabase for data storage:

| Feature | Implementation | Status |
|---------|----------------|--------|
| Login | `supabase.auth.signInWithPassword()` | ✅ Done |
| Register | `supabase.auth.signUp()` | ✅ Done |
| Profile | `/api/users/me` (Next.js) | ✅ Done |
| Token Storage | Supabase session (auto) | ✅ Done |
| Home Screen | `/api/discover` (Next.js) | ✅ Done |
| Favorites | `/api/favorites` (Next.js) | ✅ Done |
| Chat | `/api/agora/chat-token` (Next.js) | ✅ Done |

### Deprecated Functions

The following functions in `utils/token.ts` are deprecated:

- `storeToken()` - Use Supabase session instead
- `getToken()` - Use `supabase.auth.getSession()` instead
- `removeToken()` - Use `supabase.auth.signOut()` instead
- `addCurrentUserId()` - User ID managed by Supabase
- `getCurrentUserId()` - Use `supabase.auth.getUser()` instead

## Common Tasks

### Adding a New Screen

1. Create a file in `app/` directory (e.g., `app/newscreen/index.tsx`)
2. Export a default React component
3. Expo Router will automatically create the route

### Accessing Auth State

```tsx
import { useAuth } from '@/utils/authContext';

function MyComponent() {
  const { user, isAuthenticated, isLoading, signOut } = useAuth();
  
  if (isLoading) return <Loading />;
  if (!isAuthenticated) return <LoginPrompt />;
  
  return <View>Welcome, {user?.profile?.first_name}</View>;
}
```

### Making Supabase Queries

```tsx
import { supabase } from '@/lib/supabase';

// Fetch data
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('user_id', userId)
  .single();

// Update data
const { error } = await supabase
  .from('profiles')
  .update({ first_name: 'John' })
  .eq('user_id', userId);
```

## Testing

### Running on Device

```bash
# iOS (requires Mac)
pnpm ios

# Android
pnpm android

# Physical device (scan QR code)
pnpm start
```

### Building for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

## Troubleshooting

### "Session not found" error
- Check that `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are set
- Verify Supabase project is running
- Check network connectivity

### Auth state not updating
- Ensure `AuthProvider` wraps your app in `_layout.tsx`
- Check the console for `[Auth]` logs

### Profile not saving
- Check RLS policies in Supabase
- Verify user is authenticated
- Check console for Supabase errors

## Contributing

1. Create a feature branch from `main`
2. Make changes
3. Test on both iOS and Android
4. Submit a pull request

## Related Documentation

- [Project Requirements](../docs/project_requirements.md)
- [Web Backend README](../web/README.md)
- [Supabase Docs](https://supabase.com/docs)
- [Expo Docs](https://docs.expo.dev)
