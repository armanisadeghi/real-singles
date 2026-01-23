# **RealSingles - Technical Requirements & Implementation Plan**

**Project:** Complete rebuild of backend infrastructure and fixes for mobile application  
**Date:** January 22, 2026 (Last Updated: January 23, 2026)  
**Tech Stack:** Next.js 16.1.4+ (App Router), Supabase (PostgreSQL + Auth), Vercel, React Native/Expo

---

## **0. Implementation Progress Summary**

### **Completed Items** ✅

| Category | Item | Status |
|----------|------|--------|
| **Infrastructure** | Git repository setup | ✅ Complete |
| **Infrastructure** | Next.js 16 project with App Router | ✅ Complete |
| **Infrastructure** | Project structure (web/, mobile/, docs/) | ✅ Complete |
| **Database** | Supabase project created | ✅ Complete |
| **Database** | Initial schema migration (all tables) | ✅ Complete |
| **Database** | RLS policies migration | ✅ Complete |
| **Database** | Seed data (products, virtual speed dating) | ✅ Complete |
| **Database** | Auto-create user trigger | ✅ Complete |
| **Auth** | `/api/auth/register` endpoint | ✅ Complete |
| **Auth** | `/api/auth/login` endpoint | ✅ Complete |
| **Auth** | `/api/auth/logout` endpoint | ✅ Complete |
| **Auth** | `/api/auth/session` endpoint | ✅ Complete |
| **API** | `/api/health` endpoint | ✅ Complete |
| **Admin** | Admin login page | ✅ Complete |
| **Admin** | Admin dashboard with stats | ✅ Complete |
| **Admin** | Admin users management page | ✅ Complete |
| **Admin** | Admin events management page | ✅ Complete |
| **Admin** | Admin reports management page | ✅ Complete |
| **Admin** | Admin products management page | ✅ Complete |
| **Admin** | Role-based access control (admin-guard) | ✅ Complete |
| **Web UI** | Registration page with password confirmation | ✅ Complete |
| **Web UI** | Login page | ✅ Complete |
| **Web UI** | Profile view page | ✅ Complete |
| **Web UI** | Profile edit page with autosave | ✅ Complete |
| **Web UI** | Discover page | ✅ Complete |
| **Web UI** | Matches page | ✅ Complete |
| **Web UI** | Favorites page | ✅ Complete |
| **Web UI** | Settings page | ✅ Complete |
| **Web UI** | Marketing landing page | ✅ Complete |
| **Web UI** | About page | ✅ Complete |
| **Web UI** | Features page | ✅ Complete |
| **Web UI** | Events page | ✅ Complete |
| **Web UI** | Contact page | ✅ Complete |
| **Config** | Environment variables setup | ✅ Complete |
| **Config** | Supabase client (browser/server/admin) | ✅ Complete |
| **Libs** | Email client (Resend) | ✅ Complete |
| **Libs** | Matching algorithm stubs | ✅ Complete |
| **Libs** | Agora token generation stubs | ✅ Complete |
| **Types** | TypeScript interfaces for all tables | ✅ Complete |

### **In Progress** 🔄

| Category | Item | Status |
|----------|------|--------|
| **Mobile** | Supabase client integration | 🔄 Next Priority |
| **Mobile** | Auth flow update (login/register) | 🔄 Next Priority |
| **Mobile** | Profile edit with autosave | 🔄 Next Priority |
| **Mobile** | API endpoint migration | 🔄 Planned |

### **Not Started** ⏳

| Category | Item | Priority |
|----------|------|----------|
| **API** | Profile endpoints (/api/users/me, /api/users/[id]) | High |
| **API** | Gallery upload endpoint | High |
| **API** | Discovery endpoints (/api/discover/*) | High |
| **API** | Matches endpoints | High |
| **API** | Favorites endpoints | High |
| **API** | Conversations endpoints | Medium |
| **API** | Events endpoints | Medium |
| **API** | Products/Orders endpoints | Medium |
| **API** | Agora token endpoints | Medium |
| **Auth** | Social login (Apple, Google) | Medium |
| **Auth** | Phone verification (Twilio) | Medium |
| **Auth** | Forgot/reset password | Medium |
| **Mobile** | iOS safe area fixes | High |
| **Mobile** | Keyboard handling | High |
| **Mobile** | Expo SDK upgrade | High |
| **Integration** | Agora Chat setup | Medium |
| **Integration** | Agora RTC setup | Medium |
| **Integration** | Push notifications | Low |
| **Deploy** | Vercel deployment | Medium |
| **Deploy** | App Store submission | Low |
| **Deploy** | Play Store submission | Low |

---

## **1. Technology Stack Overview**

| Layer | Technology | Purpose |
|-------|------------|---------|
| Database | Supabase (PostgreSQL) | Data storage, real-time subscriptions |
| Authentication | Supabase Auth | User auth, social login (Apple, Google) |
| Backend API | Next.js 16 App Router | REST API endpoints, server actions |
| Hosting | Vercel | API hosting, edge functions |
| Mobile App | React Native / Expo | Existing app (requires fixes) |
| Real-time Chat | Agora Chat SDK | Already integrated in mobile app |
| Video/Voice Calls | Agora RTC SDK | Already integrated in mobile app |
| File Storage | Supabase Storage | User photos, videos, documents |
| Email | Resend or SendGrid | Transactional emails |
| SMS/OTP | Twilio | Phone verification, OTP |
| Push Notifications | Expo Push / OneSignal | Mobile notifications |
| Maps | Google Maps API | Location services (key exists) |

---

## **2. Database Schema Design**

### **2.1 Core Tables**

#### **users**
Primary user account table (extends Supabase auth.users)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  phone_verified BOOLEAN DEFAULT FALSE,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active', -- active, suspended, deleted
  role TEXT DEFAULT 'user', -- user, admin, moderator
  agora_user_id TEXT, -- For Agora Chat integration
  points_balance INTEGER DEFAULT 0,
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES users(id)
);
```

#### **profiles**
Extended user profile information

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Basic Info
  first_name TEXT,
  last_name TEXT,
  date_of_birth DATE,
  gender TEXT, -- male, female, non-binary, other
  looking_for TEXT[], -- Array: male, female, non-binary, other
  
  -- Physical Attributes
  height_inches INTEGER,
  body_type TEXT, -- slim, athletic, average, curvy, plus-size
  ethnicity TEXT,
  
  -- Location
  city TEXT,
  state TEXT,
  country TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Lifestyle
  religion TEXT,
  political_views TEXT,
  education TEXT,
  occupation TEXT,
  smoking TEXT, -- never, occasionally, regularly
  drinking TEXT, -- never, socially, regularly
  marijuana TEXT, -- never, occasionally, regularly
  exercise TEXT, -- never, sometimes, regularly, daily
  
  -- Family
  has_kids BOOLEAN,
  wants_kids TEXT, -- yes, no, maybe, have_and_want_more
  pets TEXT[], -- Array: dogs, cats, birds, fish, reptiles, none
  
  -- Personality
  zodiac_sign TEXT,
  interests TEXT[], -- Array of interest tags
  bio TEXT,
  looking_for_description TEXT,
  
  -- Verification
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  verification_selfie_url TEXT,
  
  -- Media
  profile_image_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **user_gallery**
User photos and videos

```sql
CREATE TABLE user_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL, -- image, video
  media_url TEXT NOT NULL,
  thumbnail_url TEXT,
  is_live_photo BOOLEAN DEFAULT FALSE, -- Taken in-app with timestamp
  is_primary BOOLEAN DEFAULT FALSE,
  display_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **2.2 Matching & Discovery Tables**

#### **user_filters**
Saved search/filter preferences

```sql
CREATE TABLE user_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  min_age INTEGER DEFAULT 18,
  max_age INTEGER DEFAULT 99,
  min_height INTEGER,
  max_height INTEGER,
  max_distance_miles INTEGER DEFAULT 100,
  
  gender TEXT[],
  body_types TEXT[],
  ethnicities TEXT[],
  religions TEXT[],
  education_levels TEXT[],
  
  has_kids TEXT, -- any, yes, no
  wants_kids TEXT, -- any, yes, no, maybe
  smoking TEXT, -- any, never, occasionally, regularly
  drinking TEXT,
  marijuana TEXT,
  zodiac_signs TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **matches**
Match relationships between users

```sql
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  target_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- like, pass, super_like
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, target_user_id)
);

-- Index for finding mutual matches
CREATE INDEX idx_matches_mutual ON matches(target_user_id, user_id);
```

#### **conversations**
Chat conversation threads

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT DEFAULT 'direct', -- direct, group
  group_name TEXT,
  group_image_url TEXT,
  created_by UUID REFERENCES users(id),
  agora_group_id TEXT, -- For Agora Chat groups
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **conversation_participants**
Users in conversations

```sql
CREATE TABLE conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member', -- owner, admin, member
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ,
  is_muted BOOLEAN DEFAULT FALSE,
  
  UNIQUE(conversation_id, user_id)
);
```

#### **favorites**
User favorites/bookmarks

```sql
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  favorite_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, favorite_user_id)
);
```

#### **follows**
User follow relationships

```sql
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(follower_id, following_id)
);
```

#### **blocks**
Blocked users

```sql
CREATE TABLE blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID REFERENCES users(id) ON DELETE CASCADE,
  blocked_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(blocker_id, blocked_id)
);
```

#### **reports**
User reports for moderation

```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending', -- pending, reviewed, resolved, dismissed
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **2.3 Events & Virtual Dating Tables**

#### **events**
In-person and virtual events

```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL, -- in_person, virtual, speed_dating
  image_url TEXT,
  
  -- Location (for in-person)
  venue_name TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Timing
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ,
  timezone TEXT DEFAULT 'America/New_York',
  
  -- Capacity
  max_attendees INTEGER,
  current_attendees INTEGER DEFAULT 0,
  
  -- Settings
  is_public BOOLEAN DEFAULT TRUE,
  requires_approval BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'upcoming', -- draft, upcoming, ongoing, completed, cancelled
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **event_attendees**
Event registrations

```sql
CREATE TABLE event_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'interested', -- interested, registered, attended, cancelled
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(event_id, user_id)
);
```

#### **virtual_speed_dating**
Virtual speed dating sessions

```sql
CREATE TABLE virtual_speed_dating (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  
  scheduled_datetime TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  round_duration_seconds INTEGER DEFAULT 180, -- 3 minutes per round
  
  min_participants INTEGER DEFAULT 6,
  max_participants INTEGER DEFAULT 20,
  
  gender_preference TEXT, -- mixed, men_only, women_only
  age_min INTEGER,
  age_max INTEGER,
  
  status TEXT DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled
  agora_channel_prefix TEXT, -- Base channel name for Agora
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **speed_dating_registrations**
Speed dating session registrations

```sql
CREATE TABLE speed_dating_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES virtual_speed_dating(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'registered', -- registered, checked_in, completed, no_show
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(session_id, user_id)
);
```

### **2.4 Rewards & Products Tables**

#### **point_transactions**
Points earning and spending history

```sql
CREATE TABLE point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  amount INTEGER NOT NULL, -- Positive for earned, negative for spent
  balance_after INTEGER NOT NULL,
  
  transaction_type TEXT NOT NULL, -- referral, review, event_attendance, redemption, admin_adjustment
  description TEXT,
  reference_id UUID, -- ID of related entity (referral, review, order, etc.)
  reference_type TEXT, -- referrals, reviews, orders, etc.
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **products**
Redeemable products/gifts

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  
  points_cost INTEGER NOT NULL,
  retail_value DECIMAL(10, 2),
  
  category TEXT, -- gift_card, merchandise, experience, subscription
  stock_quantity INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **orders**
Product redemption orders

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  
  points_spent INTEGER NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, processing, shipped, delivered, cancelled
  
  -- Shipping info
  shipping_name TEXT,
  shipping_address TEXT,
  shipping_city TEXT,
  shipping_state TEXT,
  shipping_zip TEXT,
  shipping_country TEXT,
  tracking_number TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **2.5 Reviews & Ratings Tables**

#### **reviews**
User reviews (from people who know them)

```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  relationship TEXT, -- friend, coworker, met_on_app, family, other
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  
  is_approved BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  
  points_awarded INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **2.6 Referrals Table**

#### **referrals**
User referral tracking

```sql
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  referred_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  status TEXT DEFAULT 'pending', -- pending, completed, rewarded
  points_awarded INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
```

### **2.7 Notifications Table**

#### **notifications**
In-app notifications

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  type TEXT NOT NULL, -- match, message, event, system, points, etc.
  title TEXT NOT NULL,
  body TEXT,
  
  data JSONB, -- Additional structured data
  
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **2.8 Contact & Support Tables**

#### **contact_submissions**
Contact form submissions

```sql
CREATE TABLE contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  name TEXT,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  
  status TEXT DEFAULT 'new', -- new, in_progress, resolved
  responded_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## **3. API Endpoints to Build**

### **3.1 Authentication Endpoints**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user with email/password |
| POST | `/api/auth/login` | Login with email/password |
| POST | `/api/auth/logout` | Logout user |
| POST | `/api/auth/social` | Social login (Apple/Google) |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/verify-otp` | Verify OTP code |
| POST | `/api/auth/reset-password` | Reset password with token |
| POST | `/api/auth/change-password` | Change password (authenticated) |
| POST | `/api/auth/verify-phone` | Send phone verification OTP |
| POST | `/api/auth/confirm-phone` | Confirm phone with OTP |
| GET | `/api/auth/session` | Get current session/user |

### **3.2 User & Profile Endpoints**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/me` | Get current user profile |
| PUT | `/api/users/me` | Update current user profile |
| GET | `/api/users/[id]` | Get user profile by ID |
| POST | `/api/users/me/gallery` | Upload photo/video to gallery |
| DELETE | `/api/users/me/gallery/[id]` | Delete gallery item |
| PUT | `/api/users/me/gallery/reorder` | Reorder gallery items |
| GET | `/api/users/check-email` | Check if email exists |

### **3.3 Discovery & Matching Endpoints**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/discover` | Get home screen data (matches, nearby, events) |
| GET | `/api/discover/top-matches` | Get top match profiles |
| GET | `/api/discover/nearby` | Get nearby profiles |
| GET | `/api/discover/featured-videos` | Get featured video profiles |
| POST | `/api/matches` | Record match action (like/pass/super-like) |
| GET | `/api/matches` | Get mutual matches |
| GET | `/api/filters` | Get saved filters |
| PUT | `/api/filters` | Save/update filters |
| DELETE | `/api/filters` | Clear filters |

### **3.4 Favorites & Social Endpoints**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/favorites` | Get favorites list |
| POST | `/api/favorites/[userId]` | Add to favorites |
| DELETE | `/api/favorites/[userId]` | Remove from favorites |
| POST | `/api/follows/[userId]` | Follow user |
| DELETE | `/api/follows/[userId]` | Unfollow user |
| POST | `/api/blocks/[userId]` | Block user |
| DELETE | `/api/blocks/[userId]` | Unblock user |
| POST | `/api/reports` | Report user |

### **3.5 Chat & Communication Endpoints**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/conversations` | Get all conversations |
| POST | `/api/conversations` | Create new conversation |
| GET | `/api/conversations/[id]` | Get conversation details |
| POST | `/api/agora/chat-token` | Generate Agora chat token |
| POST | `/api/agora/call-token` | Generate Agora call token |
| POST | `/api/agora/refresh-token` | Refresh Agora token |

### **3.6 Groups Endpoints**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/groups` | Get user's groups |
| POST | `/api/groups` | Create new group |
| GET | `/api/groups/[id]` | Get group details |
| PUT | `/api/groups/[id]` | Update group |
| DELETE | `/api/groups/[id]` | Delete group |
| POST | `/api/groups/[id]/members` | Add members to group |
| DELETE | `/api/groups/[id]/members/[userId]` | Remove member from group |

### **3.7 Events Endpoints**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events` | Get events list |
| POST | `/api/events` | Create new event |
| GET | `/api/events/[id]` | Get event details |
| PUT | `/api/events/[id]` | Update event |
| DELETE | `/api/events/[id]` | Delete event |
| POST | `/api/events/[id]/register` | Register for event |
| DELETE | `/api/events/[id]/register` | Cancel registration |
| POST | `/api/events/[id]/interest` | Mark interest in event |

### **3.8 Virtual Speed Dating Endpoints**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/speed-dating` | Get speed dating sessions |
| GET | `/api/speed-dating/[id]` | Get session details |
| POST | `/api/speed-dating/[id]/register` | Register for session |
| DELETE | `/api/speed-dating/[id]/register` | Cancel registration |

### **3.9 Rewards & Products Endpoints**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/points` | Get user's points balance and history |
| GET | `/api/products` | Get available products |
| GET | `/api/products/[id]` | Get product details |
| POST | `/api/orders` | Create redemption order |
| GET | `/api/orders` | Get user's orders |
| GET | `/api/orders/[id]` | Get order details |

### **3.10 Reviews & Ratings Endpoints**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/[id]/reviews` | Get reviews for user |
| POST | `/api/reviews` | Submit review for user |

### **3.11 Referrals Endpoints**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/referrals` | Get user's referrals |
| POST | `/api/referrals/track` | Track referral link click |

### **3.12 Notifications Endpoints**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Get user's notifications |
| PUT | `/api/notifications/[id]/read` | Mark notification as read |
| PUT | `/api/notifications/read-all` | Mark all as read |

### **3.13 Utility Endpoints**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload file to storage |
| POST | `/api/contact` | Submit contact form |

---

## **4. Mobile App Fixes Required**

### **4.1 Critical iOS Fixes**

| Issue | Current State | Required Fix |
|-------|---------------|--------------|
| Safe Area | Content behind notch/home indicator | Implement `SafeAreaView` properly throughout |
| Height Units | Uses `h-screen` | Replace all with `h-dvh` / `min-h-dvh` |
| Keyboard | Inputs obscured | Implement `KeyboardAvoidingView` with proper behavior |
| Font Size | Inputs < 16px | Ensure all inputs are minimum 16px to prevent iOS zoom |
| Bottom Nav | Overlaps home indicator | Add `pb-safe` padding to bottom elements |
| Header Height | Hardcoded values | Use CSS variable `--header-height` |

### **4.2 API Integration Updates** 🔄 NEXT PRIORITY

The mobile app currently uses the old PHP backend at `itinfonity.io`. We need to migrate to the new Supabase-based API.

| File | Change Required | Status |
|------|-----------------|--------|
| `lib/axiosClient.ts` | Replace with Supabase client | ⏳ Pending |
| `lib/supabase.ts` | Create new Supabase client for mobile | ⏳ Pending |
| `utils/token.ts` | Replace with Supabase session management | ⏳ Pending |
| `lib/api.ts` | Rewrite all functions to use Supabase client | ⏳ Pending |

### **4.3 Authentication Updates** 🔄 NEXT PRIORITY

| Feature | Current | New Implementation | Status |
|---------|---------|-------------------|--------|
| Login | Custom JWT + PHP | Supabase Auth | ⏳ Pending |
| Register | Custom PHP | Supabase Auth | ⏳ Pending |
| Social Login | Custom PHP | Supabase Auth (Apple, Google) | ⏳ Pending |
| Token Storage | AsyncStorage | Supabase session (auto-managed) | ⏳ Pending |
| Password Reset | OTP via PHP | Supabase Auth magic link/OTP | ⏳ Pending |
| Profile Save | Manual save only | **Autosave** (mirror web) | ⏳ Pending |

### **4.4 Environment Configuration**

The mobile `.env` file has been updated. Create proper environment handling:

```typescript
// lib/supabase.ts (NEW - to be created)
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

```typescript
// config/env.ts
export const ENV = {
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  AGORA_APP_ID: process.env.EXPO_PUBLIC_AGORA_APP_ID,
  AGORA_CHAT_APP_KEY: process.env.EXPO_PUBLIC_AGORA_CHAT_APP_KEY,
  GOOGLE_MAPS_API_KEY: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
};
```

---

## **5. Third-Party Integrations to Configure**

### **5.1 Supabase Setup**

- [x] Create Supabase project
- [x] Run database migrations (all tables above)
- [x] Configure Row Level Security (RLS) policies
- [ ] Set up Storage buckets (avatars, gallery, events)
- [ ] Configure Auth providers (Email, Apple, Google)
- [ ] Set up Edge Functions if needed

### **5.2 Agora Setup**

- [ ] Create/verify Agora project
- [ ] Configure Chat SDK settings
- [ ] Configure RTC SDK settings
- [ ] Implement token server (in Next.js API)
- [ ] Set up webhook endpoints for call events

### **5.3 Twilio Setup**

- [ ] Create Twilio account/project
- [ ] Configure phone number for SMS
- [ ] Implement OTP verification flow
- [ ] Set up SMS templates

### **5.4 Push Notifications**

- [ ] Configure Expo Push Notifications
- [ ] Set up notification categories
- [ ] Implement notification handlers in app
- [ ] Create notification sending service

### **5.5 Email Service**

- [x] Set up Resend or SendGrid account (Resend client created)
- [ ] Configure domain authentication
- [x] Create email templates (welcome, password reset, etc.)
- [x] Implement email sending service

---

## **6. Matching Algorithm Requirements**

### **6.1 Compatibility Scoring**

Implement algorithm that considers:

1. **Location proximity** (weighted heavily)
2. **Age preference match** (both ways)
3. **Gender/orientation match**
4. **Shared interests** (count of overlapping interests)
5. **Lifestyle compatibility:**
   - Smoking/drinking/marijuana preferences
   - Kids situation (has/wants)
   - Pet preferences
   - Exercise habits
6. **Verification bonus** (verified profiles score higher)
7. **Activity recency** (recently active users score higher)

### **6.2 "Top Matches" Logic**

```
Score = (LocationScore * 0.25) + 
        (AgeMatchScore * 0.15) + 
        (InterestScore * 0.20) + 
        (LifestyleScore * 0.20) + 
        (VerificationBonus * 0.10) + 
        (ActivityScore * 0.10)
```

### **6.3 "Nearby" Logic**

- Use PostGIS or Supabase geography functions
- Calculate distance from user's current location
- Filter by user's max distance preference
- Exclude blocked users and already-matched users

---

## **7. Implementation Phases**

### **Phase 1: Foundation (Days 1-3)** ✅ COMPLETE

- [x] Set up Supabase project and database schema
- [x] Set up Next.js project with proper structure
- [ ] Deploy to Vercel
- [x] Implement authentication endpoints
- [ ] Update mobile app to use Supabase Auth ← **NEXT PRIORITY**

### **Phase 2: Core Features (Days 4-7)** 🔄 IN PROGRESS

- [ ] Implement user/profile endpoints
- [ ] Implement file upload to Supabase Storage
- [ ] Implement discovery endpoints (home, top matches, nearby)
- [ ] Implement favorites and blocking
- [x] Basic matching algorithm (stubs created)

### **Phase 3: Communication (Days 8-10)**

- [ ] Implement Agora token generation
- [ ] Fix chat integration in mobile app
- [ ] Fix video/voice call integration
- [ ] Implement groups functionality

### **Phase 4: Events & Social (Days 11-14)**

- [ ] Implement events CRUD
- [ ] Implement virtual speed dating
- [ ] Implement reviews system
- [ ] Implement referrals system
- [ ] Implement points/rewards system

### **Phase 5: Mobile Fixes (Days 15-18)**

- [ ] Fix all iOS safe area issues
- [ ] Fix keyboard handling
- [ ] Update all API integrations
- [ ] Implement proper error handling
- [ ] Add loading states throughout

### **Phase 6: Polish & Testing (Days 19-21)**

- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Bug fixes
- [ ] Documentation

---

## **8. File Structure for Next.js Backend**

**Current Structure (web/):**

```
web/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── register/route.ts     ✅
│   │   │   │   ├── login/route.ts        ✅
│   │   │   │   ├── logout/route.ts       ✅
│   │   │   │   ├── session/route.ts      ✅
│   │   │   │   ├── social/route.ts       ⏳
│   │   │   │   ├── forgot-password/route.ts  ⏳
│   │   │   │   └── change-password/route.ts  ⏳
│   │   │   ├── health/route.ts           ✅
│   │   │   ├── users/                    ⏳ (to be created)
│   │   │   ├── discover/                 ⏳
│   │   │   ├── matches/                  ⏳
│   │   │   ├── favorites/                ⏳
│   │   │   ├── agora/                    ⏳
│   │   │   └── ...
│   │   ├── (auth)/                       ✅ (login, register pages)
│   │   ├── (app)/                        ✅ (authenticated user pages)
│   │   ├── (marketing)/                  ✅ (public marketing pages)
│   │   ├── admin/                        ✅ (admin portal)
│   │   └── layout.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                 ✅
│   │   │   ├── server.ts                 ✅
│   │   │   └── admin.ts                  ✅
│   │   ├── auth/
│   │   │   └── admin-guard.ts            ✅
│   │   ├── agora/
│   │   │   └── token.ts                  ✅ (stubs)
│   │   ├── email/
│   │   │   └── client.ts                 ✅
│   │   └── matching/
│   │       └── algorithm.ts              ✅ (stubs)
│   ├── components/
│   │   └── layout/
│   │       ├── Header.tsx                ✅
│   │       └── Footer.tsx                ✅
│   └── types/
│       └── index.ts                      ✅
├── supabase/
│   ├── migrations/
│   │   ├── 00001_initial_schema.sql      ✅
│   │   └── 00002_rls_policies.sql        ✅
│   ├── seed.sql                          ✅
│   └── config.toml                       ✅
└── .env.local                            ✅
```

**Note:** Next.js 16 deprecated `middleware.ts`. Authentication is handled in server components using `@supabase/ssr`.

---

## **9. Success Criteria**

The project will be considered complete when:

1. **Users can register and log in** via email, Apple, or Google
2. **Profiles can be created and viewed** with photos and videos
3. **Discovery features work** — top matches, nearby profiles load real data
4. **Chat and calls function** between matched users
5. **Events can be created and joined**
6. **Virtual speed dating sessions work**
7. **Points system tracks and allows redemption**
8. **iOS app has no safe area or keyboard issues**
9. **All API calls return proper data** (no errors from missing endpoints)
10. **Admin can manage users, events, and content** (admin panel)

---

## **10. Package Updates Required**

The mobile app is currently using outdated packages. Below is a comprehensive list of required updates to ensure we're using the latest stable versions.

### **10.1 Core Framework Updates**

| Package | Current Version | Latest Stable | Update Required |
|---------|-----------------|---------------|-----------------|
| expo | ~53.0.4 | **~54.0.0** | Yes - Major |
| react | 19.0.0 | 19.0.0 | No |
| react-native | 0.79.6 | **0.83.x** | Yes - Major |
| expo-router | ^5.1.0 | **^5.2.x** | Yes - Minor |
| typescript | ~5.8.3 | ~5.8.3 | No |

### **10.2 Expo SDK Package Updates**

When upgrading to Expo SDK 54, all expo-* packages must be updated together:

| Package | Current Version | Update To |
|---------|-----------------|-----------|
| expo-apple-authentication | ~7.2.4 | ~8.x.x |
| expo-application | ~6.1.5 | ~7.x.x |
| expo-auth-session | ~6.2.0 | ~7.x.x |
| expo-av | ~15.1.6 | ~16.x.x |
| expo-blur | ~14.1.5 | ~15.x.x |
| expo-camera | ~16.1.8 | ~17.x.x |
| expo-constants | ~17.1.4 | ~18.x.x |
| expo-crypto | ~14.1.5 | ~15.x.x |
| expo-file-system | ~18.1.11 | ~19.x.x |
| expo-font | ~13.3.0 | ~14.x.x |
| expo-haptics | ~14.1.4 | ~15.x.x |
| expo-image | ~2.4.1 | ~3.x.x |
| expo-image-manipulator | ~13.1.7 | ~14.x.x |
| expo-image-picker | ~16.1.4 | ~17.x.x |
| expo-linear-gradient | ~14.1.5 | ~15.x.x |
| expo-linking | ~7.1.5 | ~8.x.x |
| expo-location | ~18.1.5 | ~19.x.x |
| expo-media-library | ^18.2.0 | ~19.x.x |
| expo-splash-screen | ~0.30.9 | ~0.31.x |
| expo-status-bar | ~2.2.3 | ~3.x.x |
| expo-symbols | ~0.4.5 | ~0.5.x |
| expo-system-ui | ~5.0.8 | ~6.x.x |
| expo-video | ~2.2.2 | ~3.x.x |
| expo-web-browser | ~14.2.0 | ~15.x.x |

### **10.3 React Native Ecosystem Updates**

| Package | Current Version | Latest Stable | Notes |
|---------|-----------------|---------------|-------|
| react-native-gesture-handler | ~2.24.0 | ~2.25.x | Update with SDK |
| react-native-reanimated | ~3.17.4 | ~3.18.x | Update with SDK |
| react-native-safe-area-context | 5.4.0 | 5.5.x | Update with SDK |
| react-native-screens | ~4.11.1 | ~4.12.x | Update with SDK |
| react-native-svg | 15.11.2 | 15.12.x | Minor update |
| react-native-webview | 13.13.5 | 13.14.x | Minor update |
| react-native-maps | 1.20.1 | 1.21.x | Minor update |

### **10.4 Third-Party SDK Updates**

| Package | Current Version | Latest Stable | Notes |
|---------|-----------------|---------------|-------|
| react-native-agora | ^4.5.3 | ^4.5.3 | Current (SDK 4.6.2 available) |
| react-native-agora-chat | ^1.3.4 | ^1.4.x | Check compatibility |
| nativewind | ^4.1.23 | **v5 (preview)** | Consider v5 or stay on v4 |
| tailwindcss | ^3.4.17 | **^4.x** | Required for NativeWind v5 |

### **10.5 Navigation Updates**

| Package | Current Version | Latest Stable |
|---------|-----------------|---------------|
| @react-navigation/native | ^7.1.6 | ^7.2.x |
| @react-navigation/bottom-tabs | ^7.3.10 | ^7.4.x |
| @react-navigation/elements | ^2.3.8 | ^2.4.x |

### **10.6 New Packages to Add**

```json
{
  "@supabase/supabase-js": "^2.x.x",
  "expo-notifications": "~0.31.x",
  "expo-secure-store": "~14.x.x",
  "@react-native-firebase/app": "^21.x.x",
  "@react-native-firebase/messaging": "^21.x.x"
}
```

### **10.7 Upgrade Command Sequence**

```bash
# 1. Upgrade Expo SDK first
npx expo install expo@^54.0.0

# 2. Run Expo doctor to update all compatible packages
npx expo install --fix

# 3. Update remaining packages manually
npm install react-native@0.83.x

# 4. Clear caches and rebuild
npx expo start --clear
```

---

## **11. App Store & Play Store Deployment**

### **11.1 Apple App Store Connect Requirements**

#### **Current Requirements (as of January 2026)**
- Apps must be built with **Xcode 16** or later
- Apps must use **iOS 18 SDK** or later
- Starting **April 2026**: Apps must be built with **iOS 26 SDK**

#### **Account Requirements**
To publish updates to the existing app, we need:

| Item | Description | Status |
|------|-------------|--------|
| Apple Developer Account | Client's existing account | **Need Access** |
| App Store Connect Access | Admin or App Manager role | **Need Access** |
| Bundle Identifier | `com.nayannew9.truSingle` | Existing |
| Signing Certificates | Distribution certificate | **Need to Generate/Access** |
| Provisioning Profiles | App Store distribution profile | **Need to Generate/Access** |

#### **Required App Store Connect Actions**

1. **Add Developer Access**
   - Client adds our team as users in App Store Connect
   - Required role: **App Manager** or **Admin**
   - Navigate to: Users and Access → Add User

2. **Certificate Setup**
   - Option A: Client exports existing certificates (.p12 file)
   - Option B: We generate new certificates (requires Admin access)

3. **App Information Updates**
   - Update app version to 4.0 (significant update)
   - Update screenshots for new UI
   - Update app description
   - Respond to age rating questions (required by Jan 31, 2026)

### **11.2 Google Play Store Requirements**

#### **Current Requirements**
- New apps must target **Android 14 (API 34)** or higher
- App updates must target **Android 14 (API 34)** or higher
- **August 2026**: Expected requirement for **Android 15 (API 35)**

#### **Account Requirements**

| Item | Description | Status |
|------|-------------|--------|
| Google Play Console | Client's existing account | **Need Access** |
| Developer Access | Admin or Release Manager | **Need Access** |
| Package Name | `com.nayannew9.truSingle` | Existing |
| Signing Key | App signing managed by Google | Existing |
| Upload Key | For uploading AAB files | **Need Access** |

#### **Required Play Console Actions**

1. **Add Developer Access**
   - Client invites our Google account
   - Required permission: **Release Manager** or **Admin**
   - Navigate to: Users and Permissions → Invite New User

2. **Keystore Access**
   - Google Play App Signing is likely enabled
   - We need the **upload key** (not the app signing key)
   - Client may need to export from existing build environment

### **11.3 EAS Build Configuration**

Update `eas.json` for production builds:

```json
{
  "cli": {
    "version": ">= 13.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "resourceClass": "m1-medium"
      },
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "ios": {
        "resourceClass": "m1-medium",
        "image": "latest"
      },
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "CLIENT_APPLE_ID",
        "ascAppId": "APP_STORE_CONNECT_APP_ID",
        "appleTeamId": "CLIENT_TEAM_ID"
      },
      "android": {
        "serviceAccountKeyPath": "./google-play-service-account.json"
      }
    }
  }
}
```

### **11.4 App Configuration Updates**

Update `app.json` for new version:

```json
{
  "expo": {
    "name": "RealSingles",
    "slug": "truSingle",
    "version": "4.0.0",
    "ios": {
      "bundleIdentifier": "com.nayannew9.truSingle",
      "buildNumber": "1",
      "infoPlist": {
        "NSCameraUsageDescription": "RealSingles needs camera access to take photos and videos for your profile.",
        "NSMicrophoneUsageDescription": "RealSingles needs microphone access for voice and video calls.",
        "NSPhotoLibraryUsageDescription": "RealSingles needs photo library access to upload photos to your profile.",
        "NSLocationWhenInUseUsageDescription": "RealSingles uses your location to show nearby matches.",
        "NSFaceIDUsageDescription": "RealSingles uses Face ID for secure authentication.",
        "UIBackgroundModes": ["audio", "voip", "remote-notification"]
      }
    },
    "android": {
      "package": "com.nayannew9.truSingle",
      "versionCode": 23,
      "permissions": [
        "CAMERA",
        "RECORD_AUDIO",
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
        "RECEIVE_BOOT_COMPLETED",
        "VIBRATE",
        "POST_NOTIFICATIONS"
      ]
    }
  }
}
```

### **11.5 Deployment Checklist**

#### **Before First Build**

- [ ] Obtain Apple Developer account access from client
- [ ] Obtain Google Play Console access from client
- [ ] Export/generate iOS signing certificates
- [ ] Export Android upload keystore (or use EAS credentials)
- [ ] Set up EAS project: `eas build:configure`
- [ ] Configure credentials: `eas credentials`

#### **Before App Store Submission**

- [ ] Update app version to 4.0.0
- [ ] Update Android versionCode to 23+
- [ ] Capture new screenshots (6.5" and 5.5" iPhone, Pixel 6)
- [ ] Write updated app description
- [ ] Update privacy policy URL
- [ ] Complete age rating questionnaire
- [ ] Test on physical iOS and Android devices
- [ ] Run TestFlight beta (iOS)
- [ ] Run internal test track (Android)

#### **Submission Process**

```bash
# Build for production
eas build --platform all --profile production

# Submit to stores
eas submit --platform ios --profile production
eas submit --platform android --profile production
```

---

## **12. Outstanding Questions**

Before beginning implementation, clarify:

1. **Existing Agora Account** — Do we use the existing credentials or create new?
2. **Domain** — What domain will the API be deployed to?
3. **Admin Panel** — Build custom or use existing admin template?
4. **Email Templates** — Brand guidelines for transactional emails?
5. **Points Values** — How many points for each action (referral, review, etc.)?
6. **Product Catalog** — Initial products for redemption?
7. **Content Moderation** — Automated or manual review of profiles/photos?
8. **Apple Developer Access** — Client needs to add us to App Store Connect
9. **Google Play Access** — Client needs to add us to Play Console
10. **NativeWind Version** — Stay on v4 (stable) or upgrade to v5 (preview)?
11. **Signing Certificates** — Does client have existing certificates to export?
12. **Upload Keys** — Does client have the Android upload keystore?
