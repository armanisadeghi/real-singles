# Real Singles Web Application - Implementation Plan

## Overview

This document outlines the complete implementation plan to bring the web application to 100% feature parity with the mobile app, implement comprehensive admin controls, and ensure modern mobile-first responsive design.

**Current State:**
- Web: Next.js 16, React 19, Tailwind CSS 4, Supabase
- Mobile: React Native 0.81, Expo 54, NativeWind, Agora
- Shared: TypeScript, Supabase PostgreSQL, 48+ API endpoints

---

## Part 1: Feature Parity - User Features

### 1.1 Authentication & Onboarding

| Feature | Mobile | Web | Status | Priority |
|---------|--------|-----|--------|----------|
| Login (email/password) | ✅ | ✅ | Complete | - |
| Social Login (Apple, Google) | ✅ | ⚠️ Config only | Needs UI | High |
| Register | ✅ | ✅ Basic | Needs multi-step | High |
| Forgot Password | ✅ | ✅ | Complete | - |
| Phone Verification | ✅ | ❌ | Missing | Medium |
| Multi-step Signup Flow (20+ steps) | ✅ | ❌ | Missing | High |

**Implementation Tasks:**
- [ ] Create multi-step signup wizard component
- [ ] Add signup steps: Intro, Personal Details, Gender, Preferences
- [ ] Add signup steps: Appearance (Height, Body Type)
- [ ] Add signup steps: Ethnicity, Religion, Languages
- [ ] Add signup steps: Marital Status, Children
- [ ] Add signup steps: Education, Job, Political Views
- [ ] Add signup steps: Lifestyle (Smoking, Drinking, Pets)
- [ ] Add signup steps: Interests selection
- [ ] Add signup steps: Photo/Video upload
- [ ] Add signup steps: Profile review & submit
- [ ] Create progress indicator component
- [ ] Add phone verification UI with OTP input
- [ ] Add social login buttons with proper OAuth flow

---

### 1.2 Profile Management

| Feature | Mobile | Web | Status | Priority |
|---------|--------|-----|--------|----------|
| View Own Profile | ✅ | ✅ | Complete | - |
| Edit Profile (all fields) | ✅ | ⚠️ Partial | Needs completion | High |
| Profile Completion Indicator | ✅ | ❌ | Missing | Medium |
| Photo Gallery Management | ✅ | ❌ | Missing | High |
| Video Upload | ✅ | ❌ | Missing | High |
| Live Photo Verification | ✅ | ❌ | Missing | Medium |
| Profile Prompts (10 questions) | ✅ | ⚠️ API only | Needs UI | Medium |

**Implementation Tasks:**
- [ ] Create profile completion progress ring component
- [ ] Build photo gallery grid with upload/delete
- [ ] Create video upload component with preview
- [ ] Add live photo capture for verification
- [ ] Build profile prompts section in profile view
- [ ] Add profile prompts editing UI
- [ ] Complete all profile edit fields (30+ fields)
- [ ] Add "prefer not to say" toggle options
- [ ] Create reorderable gallery (drag and drop)

---

### 1.3 Discovery & Matching

| Feature | Mobile | Web | Status | Priority |
|---------|--------|-----|--------|----------|
| Profile Grid/Browse | ✅ | ✅ | Complete | - |
| Advanced Filters | ✅ | ⚠️ Basic | Needs expansion | High |
| Like/Pass/Super-Like Actions | ✅ | ⚠️ Limited | Needs UI | High |
| Top Matches Section | ✅ | ❌ | Missing | High |
| Featured Videos Section | ✅ | ❌ | Missing | Medium |
| Nearby Profiles (with distance) | ✅ | ❌ | Missing | High |
| Mutual Match Detection | ✅ | ⚠️ API only | Needs UI | High |
| Verified Badge Display | ✅ | ⚠️ Partial | Needs polish | Low |

**Implementation Tasks:**
- [ ] Create swipe-like card interface with Like/Pass buttons
- [ ] Build Super Like action with animation
- [ ] Add Top Matches horizontal scroll section
- [ ] Add Featured Videos carousel section
- [ ] Create Nearby Profiles section with distance display
- [ ] Add mutual match celebration modal
- [ ] Expand filter panel with all mobile options
- [ ] Add filter persistence (save user preferences)
- [ ] Create profile card quick-action buttons

---

### 1.4 Messaging & Communication

| Feature | Mobile | Web | Status | Priority |
|---------|--------|-----|--------|----------|
| Conversation List | ✅ | ❌ | Missing | Critical |
| 1-on-1 Chat | ✅ | ❌ | Missing | Critical |
| Group Chat | ✅ | ❌ | Missing | High |
| Text Messages | ✅ | ❌ | Missing | Critical |
| Image Messages | ✅ | ❌ | Missing | High |
| Video Messages | ✅ | ❌ | Missing | Medium |
| Typing Indicators | ✅ | ❌ | Missing | Low |
| Read Receipts | ✅ | ❌ | Missing | Low |
| Online Status | ✅ | ❌ | Missing | Medium |
| Search Conversations | ✅ | ❌ | Missing | Low |

**Implementation Tasks:**
- [ ] Create conversation list page at /chats
- [ ] Build chat message thread component
- [ ] Integrate Agora Chat SDK for web
- [ ] Add message input with send button
- [ ] Create image attachment upload/preview
- [ ] Add video message support
- [ ] Build online/offline status indicators
- [ ] Create conversation search functionality
- [ ] Add typing indicator display
- [ ] Add read receipt checkmarks

---

### 1.5 Video & Voice Calls

| Feature | Mobile | Web | Status | Priority |
|---------|--------|-----|--------|----------|
| Initiate Video Call | ✅ | ❌ | Missing | High |
| Initiate Voice Call | ✅ | ❌ | Missing | High |
| Accept/Reject Calls | ✅ | ❌ | Missing | High |
| In-Call UI | ✅ | ❌ | Missing | High |
| Call Notifications | ✅ | ❌ | Missing | High |

**Implementation Tasks:**
- [ ] Integrate Agora RTC SDK for web
- [ ] Create video call UI with remote/local video
- [ ] Build voice call UI with avatar display
- [ ] Add incoming call modal/notification
- [ ] Create call controls (mute, camera, end)
- [ ] Add call quality indicators
- [ ] Build call notification system

---

### 1.6 Events System

| Feature | Mobile | Web | Status | Priority |
|---------|--------|-----|--------|----------|
| Browse Events | ✅ | ✅ | Complete | - |
| Event Details | ✅ | ⚠️ Basic | Needs enhancement | Medium |
| Register for Events | ✅ | ⚠️ API only | Needs UI | High |
| View Attendees | ✅ | ❌ | Missing | Medium |
| Create Events (User) | ✅ | ❌ Admin only | Missing for users | Medium |
| Event Filters | ✅ | ❌ | Missing | Low |
| Past Events View | ✅ | ❌ | Missing | Low |

**Implementation Tasks:**
- [ ] Enhance event detail page with full info
- [ ] Add register/unregister button
- [ ] Create attendee list with avatars
- [ ] Build event creation form for users
- [ ] Add event filter by type/location/date
- [ ] Create past events archive section
- [ ] Add event map view for in-person events

---

### 1.7 Virtual Speed Dating

| Feature | Mobile | Web | Status | Priority |
|---------|--------|-----|--------|----------|
| Browse Sessions | ✅ | ❌ | Missing | High |
| Session Details | ✅ | ❌ | Missing | High |
| Register for Sessions | ✅ | ❌ | Missing | High |
| Time Slot Selection | ✅ | ❌ | Missing | High |
| Join Session (Video) | ✅ | ❌ | Missing | High |

**Implementation Tasks:**
- [ ] Create speed dating sessions listing page
- [ ] Build session detail page with time slots
- [ ] Add registration button with slot selection
- [ ] Create speed dating lobby/waiting room
- [ ] Build round timer and partner rotation

---

### 1.8 Rewards & Points System

| Feature | Mobile | Web | Status | Priority |
|---------|--------|-----|--------|----------|
| Points Balance Display | ✅ | ⚠️ Header only | Needs expansion | Medium |
| Points History | ✅ | ❌ | Missing | Medium |
| Products/Shop Browse | ✅ | ❌ | Missing | High |
| Product Details | ✅ | ❌ | Missing | High |
| Redeem with Points | ✅ | ❌ | Missing | High |
| Order History | ✅ | ❌ | Missing | Medium |
| Shipping Address | ✅ | ❌ | Missing | Medium |

**Implementation Tasks:**
- [ ] Create rewards shop page at /rewards
- [ ] Build product grid with filtering
- [ ] Create product detail page
- [ ] Add redeem/order modal with confirmation
- [ ] Build points history timeline
- [ ] Create order history page
- [ ] Add shipping address form
- [ ] Create order tracking display

---

### 1.9 Reviews & Ratings

| Feature | Mobile | Web | Status | Priority |
|---------|--------|-----|--------|----------|
| View User Reviews | ✅ | ⚠️ API only | Needs UI | Medium |
| Submit Review | ✅ | ❌ | Missing | Medium |
| Star Rating Display | ✅ | ❌ | Missing | Medium |
| Relationship Type | ✅ | ❌ | Missing | Low |

**Implementation Tasks:**
- [ ] Create reviews section on user profiles
- [ ] Build review submission form
- [ ] Add star rating input component
- [ ] Display average rating on profile cards
- [ ] Create review approval pending state

---

### 1.10 Referral Program

| Feature | Mobile | Web | Status | Priority |
|---------|--------|-----|--------|----------|
| View Referral Code | ✅ | ❌ | Missing | Medium |
| Share Referral Link | ✅ | ❌ | Missing | Medium |
| Track Referrals | ✅ | ❌ | Missing | Low |
| Referral Rewards | ✅ | ❌ | Missing | Low |

**Implementation Tasks:**
- [ ] Create referral section in settings/profile
- [ ] Add share button with native share API
- [ ] Build referral tracking list
- [ ] Display referral rewards earned

---

### 1.11 Favorites & Social

| Feature | Mobile | Web | Status | Priority |
|---------|--------|-----|--------|----------|
| Add to Favorites | ✅ | ✅ | Complete | - |
| View Favorites List | ✅ | ✅ | Complete | - |
| Remove from Favorites | ✅ | ✅ | Complete | - |
| Block User | ✅ | ⚠️ API only | Needs UI | High |
| Report User | ✅ | ⚠️ API only | Needs UI | High |
| View Blocked Users | ✅ | ❌ | Missing | Medium |

**Implementation Tasks:**
- [ ] Add block button to user profiles
- [ ] Create report modal with reason selection
- [ ] Build blocked users list in settings
- [ ] Add unblock functionality

---

### 1.12 Notifications

| Feature | Mobile | Web | Status | Priority |
|---------|--------|-----|--------|----------|
| Notification Bell Icon | ✅ | ❌ | Missing | High |
| Notification List | ✅ | ❌ | Missing | High |
| Unread Count Badge | ✅ | ❌ | Missing | High |
| Mark as Read | ✅ | ❌ | Missing | Medium |
| Notification Types | ✅ | ❌ | Missing | Medium |

**Implementation Tasks:**
- [ ] Add notification bell to header
- [ ] Create notification dropdown/panel
- [ ] Add unread count badge
- [ ] Build notification list with icons
- [ ] Add mark as read functionality
- [ ] Create notification settings preferences

---

### 1.13 Settings

| Feature | Mobile | Web | Status | Priority |
|---------|--------|-----|--------|----------|
| Account Settings | ✅ | ⚠️ Partial | Needs expansion | Medium |
| Password Change | ✅ | ✅ | Complete | - |
| Notification Preferences | ✅ | ❌ | Missing | Medium |
| Privacy Settings | ✅ | ❌ | Missing | Medium |
| Terms of Service | ✅ | ❌ | Missing (needs page) | Low |
| Privacy Policy | ✅ | ❌ | Missing (needs page) | Low |
| FAQ | ✅ | ❌ | Missing | Low |
| Help/Support | ✅ | ❌ | Missing | Medium |
| Contact Us | ✅ | ⚠️ Marketing only | Needs app version | Medium |
| About App/Version | ✅ | ❌ | Missing | Low |
| Delete Account | ✅ | ⚠️ Stub only | Needs implementation | Medium |
| Sign Out | ✅ | ✅ | Complete | - |

**Implementation Tasks:**
- [ ] Create full settings page layout
- [ ] Add notification preferences toggles
- [ ] Add privacy settings section
- [ ] Create Terms of Service page
- [ ] Create Privacy Policy page
- [ ] Create FAQ page with accordion
- [ ] Add help/support contact form
- [ ] Build app version display
- [ ] Implement delete account with confirmation

---

## Part 2: Admin Dashboard Features

### 2.1 Current Admin Features
- ✅ Admin login
- ✅ Dashboard with stats
- ✅ User list (basic)
- ✅ Event management (basic)
- ✅ Product management (basic)
- ✅ Report viewing (basic)

### 2.2 Required Admin Enhancements

| Feature | Status | Priority |
|---------|--------|----------|
| User Detail View | ❌ Missing | High |
| Suspend/Activate User | ❌ Missing | High |
| Delete User | ❌ Missing | High |
| Adjust User Points | ❌ Missing | High |
| User Search/Filter | ❌ Missing | High |
| Profile Moderation | ❌ Missing | High |
| Review Approval Queue | ❌ Missing | High |
| Report Actions | ⚠️ Partial | High |
| Event CRUD Complete | ⚠️ Partial | Medium |
| Speed Dating Management | ❌ Missing | Medium |
| Product Stock Management | ❌ Missing | Medium |
| Order Management | ❌ Missing | Medium |
| Notification Broadcast | ❌ Missing | Medium |
| Analytics Dashboard | ❌ Missing | Medium |
| Referral Stats | ❌ Missing | Low |

**Implementation Tasks:**

#### User Management
- [ ] Create user detail page with full profile
- [ ] Add suspend user button with reason
- [ ] Add activate/reactivate user button
- [ ] Add delete user with confirmation
- [ ] Create points adjustment modal
- [ ] Add user search by name/email
- [ ] Add user filters (status, role, date)
- [ ] Create user export functionality
- [ ] Add user impersonation (view as user)

#### Content Moderation
- [ ] Create photo moderation queue
- [ ] Build review approval interface
- [ ] Add report investigation view
- [ ] Create moderation action log
- [ ] Add warning/ban system

#### Event Management
- [ ] Enhance event creation form
- [ ] Add event edit functionality
- [ ] Create attendee management
- [ ] Add event cancellation
- [ ] Build event analytics

#### Speed Dating
- [ ] Create session management page
- [ ] Add session creation form
- [ ] Build participant management
- [ ] Add session status controls

#### Products & Orders
- [ ] Enhance product creation/edit
- [ ] Add stock/inventory tracking
- [ ] Create order management page
- [ ] Add order status updates
- [ ] Build shipping management

#### Analytics
- [ ] Create analytics dashboard
- [ ] Add user growth charts
- [ ] Add match/engagement metrics
- [ ] Add event attendance stats
- [ ] Add points/redemption analytics

---

## Part 3: Mobile-First Design System

### 3.1 Design Principles

1. **Mobile-First Approach**
   - Design for smallest screens first
   - Progressively enhance for larger screens
   - Touch-friendly tap targets (minimum 44px)
   - Thumb-zone friendly navigation

2. **Modern 2026 Design Trends**
   - Clean, minimal interfaces
   - Generous whitespace
   - Soft shadows and rounded corners
   - Smooth animations and transitions
   - Dark mode support
   - Micro-interactions

3. **Performance**
   - Optimize for Core Web Vitals
   - Lazy load images and components
   - Minimize JavaScript bundles
   - Use skeleton loading states

### 3.2 Component Updates Required

| Component | Current State | Required Updates |
|-----------|---------------|------------------|
| Header | Desktop-first | Make collapsible, mobile menu |
| Navigation | Separate mobile/desktop | Unified responsive nav |
| Cards | Fixed sizes | Fluid, responsive sizing |
| Forms | Standard inputs | Mobile-optimized inputs |
| Buttons | Basic styling | Touch-friendly, animated |
| Modals | Desktop-sized | Full-screen on mobile |
| Tables | Desktop tables | Responsive cards on mobile |
| Filters | Sidebar/inline | Bottom sheet on mobile |

### 3.3 Implementation Tasks

#### Core Layout
- [ ] Create unified responsive navigation
- [ ] Implement collapsible mobile header
- [ ] Add gesture support (swipe navigation)
- [ ] Create bottom sheet component
- [ ] Build responsive grid system
- [ ] Add pull-to-refresh where appropriate

#### Components
- [ ] Update all cards for mobile-first
- [ ] Create mobile-friendly form inputs
- [ ] Build touch-friendly buttons
- [ ] Add loading skeleton components
- [ ] Create empty state components
- [ ] Build error boundary components

#### Visual Polish
- [ ] Implement consistent spacing scale
- [ ] Add smooth page transitions
- [ ] Create micro-interaction animations
- [ ] Add dark mode toggle
- [ ] Implement skeleton loading states

#### Performance
- [ ] Add image lazy loading
- [ ] Implement virtual scrolling for long lists
- [ ] Optimize bundle size
- [ ] Add service worker for offline support

---

## Part 4: API Consistency

### 4.1 Current API Usage

**Mobile uses:** `/mobile/lib/api.ts` - 50+ typed API functions
**Web uses:** Direct Supabase in layouts + API routes

### 4.2 Required Changes

- [ ] Create web API client similar to mobile
- [ ] Replace direct Supabase calls with API calls
- [ ] Ensure consistent error handling
- [ ] Add request/response logging
- [ ] Implement retry logic for failures

---

## Part 5: Implementation Priority Order

### Phase 1: Critical Features (Must Have)
1. Messaging system (conversation list + chat)
2. Multi-step signup flow
3. Profile gallery management
4. Like/Pass/Super-Like actions
5. Notifications system

### Phase 2: High Priority Features
1. Video/voice calling
2. Speed dating registration
3. Rewards shop
4. Block/Report UI
5. Complete admin user management

### Phase 3: Medium Priority Features
1. Review system UI
2. Referral program
3. Settings expansion
4. Event enhancements
5. Admin moderation tools

### Phase 4: Polish & Enhancement
1. Dark mode
2. Animations and transitions
3. Performance optimization
4. Offline support
5. Analytics

---

## File Structure for New Features

```
web/src/
├── app/
│   ├── (app)/
│   │   ├── chats/
│   │   │   ├── page.tsx           # Conversation list
│   │   │   └── [id]/
│   │   │       └── page.tsx       # Chat thread
│   │   ├── call/
│   │   │   └── [id]/
│   │   │       └── page.tsx       # Video/voice call
│   │   ├── rewards/
│   │   │   ├── page.tsx           # Shop/products
│   │   │   └── [id]/
│   │   │       └── page.tsx       # Product detail
│   │   ├── speed-dating/
│   │   │   ├── page.tsx           # Sessions list
│   │   │   └── [id]/
│   │   │       └── page.tsx       # Session detail
│   │   ├── notifications/
│   │   │   └── page.tsx           # All notifications
│   │   └── settings/
│   │       ├── page.tsx           # Main settings
│   │       ├── notifications/
│   │       ├── privacy/
│   │       ├── blocked/
│   │       └── account/
│   ├── (auth)/
│   │   └── register/
│   │       ├── page.tsx           # Step controller
│   │       └── steps/
│   │           ├── intro.tsx
│   │           ├── personal.tsx
│   │           ├── preferences.tsx
│   │           └── ... (20+ steps)
│   └── admin/
│       └── (dashboard)/
│           ├── users/
│           │   └── [id]/
│           │       └── page.tsx   # User detail
│           ├── reviews/
│           │   └── page.tsx       # Review moderation
│           ├── speed-dating/
│           │   └── page.tsx       # Session management
│           ├── orders/
│           │   └── page.tsx       # Order management
│           └── analytics/
│               └── page.tsx       # Analytics dashboard
├── components/
│   ├── chat/
│   │   ├── ConversationList.tsx
│   │   ├── ChatThread.tsx
│   │   ├── MessageBubble.tsx
│   │   └── MessageInput.tsx
│   ├── call/
│   │   ├── VideoCall.tsx
│   │   ├── VoiceCall.tsx
│   │   ├── CallControls.tsx
│   │   └── IncomingCall.tsx
│   ├── discovery/
│   │   ├── ProfileCard.tsx
│   │   ├── SwipeActions.tsx
│   │   ├── FilterPanel.tsx
│   │   └── TopMatches.tsx
│   ├── profile/
│   │   ├── GalleryGrid.tsx
│   │   ├── PhotoUpload.tsx
│   │   ├── VideoUpload.tsx
│   │   ├── ProfilePrompts.tsx
│   │   └── CompletionRing.tsx
│   ├── rewards/
│   │   ├── ProductCard.tsx
│   │   ├── PointsBalance.tsx
│   │   └── RedeemModal.tsx
│   ├── ui/
│   │   ├── BottomSheet.tsx
│   │   ├── LoadingSkeleton.tsx
│   │   ├── EmptyState.tsx
│   │   ├── StarRating.tsx
│   │   └── Toast.tsx
│   └── signup/
│       ├── StepProgress.tsx
│       ├── StepContainer.tsx
│       └── steps/
│           └── ... (individual step components)
├── hooks/
│   ├── useChat.ts
│   ├── useCall.ts
│   ├── useNotifications.ts
│   └── useFilters.ts
└── lib/
    ├── api/
    │   └── client.ts              # Unified API client
    └── agora/
        ├── chat.ts                # Chat SDK wrapper
        └── rtc.ts                 # RTC SDK wrapper
```

---

## Summary Statistics

| Category | Mobile Features | Web Current | Web Needed |
|----------|-----------------|-------------|------------|
| Auth/Onboarding | 22 features | 6 features | +16 |
| Profile | 12 features | 4 features | +8 |
| Discovery | 10 features | 4 features | +6 |
| Messaging | 10 features | 0 features | +10 |
| Calls | 5 features | 0 features | +5 |
| Events | 7 features | 3 features | +4 |
| Speed Dating | 5 features | 0 features | +5 |
| Rewards | 7 features | 1 feature | +6 |
| Reviews | 4 features | 0 features | +4 |
| Referrals | 4 features | 0 features | +4 |
| Notifications | 5 features | 0 features | +5 |
| Settings | 11 features | 3 features | +8 |
| **TOTAL** | **102 features** | **21 features** | **+81 features** |

**Admin Features Needed:** 25+ enhancements

---

*Document created: 2026-01-23*
*Target: Full feature parity + admin controls + mobile-first design*
