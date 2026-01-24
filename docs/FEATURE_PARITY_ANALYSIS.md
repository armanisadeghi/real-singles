# Feature Parity Analysis & Action Plan
**Date:** January 24, 2026  
**Purpose:** Achieve identical functionality between mobile (iOS/Android) and web applications

---

## Executive Summary

**CRITICAL ISSUE IDENTIFIED:** The web app's "Home" button links to the public marketing homepage instead of an authenticated dashboard, creating a poor user experience for logged-in users.

### Current State
- **Mobile:** Fully-featured home dashboard with all core features integrated
- **Web:** Home button links to public homepage; missing comprehensive authenticated home screen
- **Feature Parity:** ~40% - Web is missing 60% of mobile functionality

---

## PART 1: IMMEDIATE FIXES (Critical - Do First)

### Fix 1: Create Authenticated Home/Dashboard
**Problem:** Home button goes to public homepage  
**Solution:** Create `/home` route with comprehensive dashboard

#### Mobile Home Features to Replicate:
1. **Hero Section** with user avatar, welcome message, points display
2. **Quick Actions Bar** - Category pills (All, Top Matches, Featured Videos, etc.)
3. **Filter Button** - Opens comprehensive filter modal/panel
4. **Top Matches Section** - Horizontal scroll of profile cards
5. **Featured Videos Section** - Video profile carousel
6. **Virtual Speed Dating Section** - Upcoming sessions
7. **Nearby Profiles Section** - Location-based matches
8. **Events Section** - In-person events carousel

#### Implementation:
```
/web/src/app/(app)/home/page.tsx
```

**Status:** 🚨 CRITICAL - Blocking good UX

---

### Fix 2: Update Navigation
**Problem:** Bottom nav "Home" points to "/"  
**Solution:** Point to "/home"

**Files to Update:**
- `/web/src/components/navigation/BottomNavigation.tsx` - Change href from "/" to "/home"
- `/web/src/app/(app)/layout.tsx` - Update top nav "Discover" link

**Status:** 🚨 CRITICAL - Must do with Fix 1

---

### Fix 3: Redirect Logic
**Problem:** Authenticated users can still access "/" and see marketing page  
**Solution:** Redirect authenticated users from "/" to "/home"

**Implementation:**
- Add middleware or layout-level redirect
- If user is logged in and visits "/", redirect to "/home"
- Keep "/" public for non-authenticated visitors

**Status:** 🚨 CRITICAL - Part of Fix 1

---

## PART 2: FEATURE PARITY AUDIT

### Navigation & Core Structure
| Feature | Mobile | Web | Status | Priority |
|---------|--------|-----|--------|----------|
| Home/Dashboard | ✅ Complete | ❌ Missing | Must Build | 🔴 Critical |
| Bottom Tabs | ✅ Native | ✅ Present | ⚠️ Wrong route | 🔴 Critical |
| Tab: Home | ✅ Full dashboard | ❌ Public homepage | Must Fix | 🔴 Critical |
| Tab: Discover | ✅ Browse profiles | ✅ Present | ✓ Match | ✓ |
| Tab: Chats | ✅ Full chat | ✅ Present | ⚠️ UI differs | 🟡 Medium |
| Tab: Favorites | ✅ Full list | ✅ Present | ✓ Match | ✓ |
| Tab: Profile | ✅ Full profile | ✅ Present | ⚠️ Edit differs | 🟡 Medium |

---

### Discovery & Matching Features
| Feature | Mobile | Web | Status | Priority |
|---------|--------|-----|--------|----------|
| Top Matches Display | ✅ Carousel | ❌ Not on home | Must Add | 🔴 Critical |
| Featured Videos | ✅ Carousel | ❌ Missing | Must Add | 🔴 Critical |
| Nearby Profiles | ✅ Distance-based | ❌ Missing | Must Add | 🔴 Critical |
| Filter Panel | ✅ Bottom sheet | ⚠️ Partial | Enhance | 🟡 Medium |
| Advanced Filters | ✅ 15+ options | ⚠️ 8 options | Add More | 🟡 Medium |
| Like/Pass/Super-Like | ✅ Full actions | ⚠️ Limited | Enhance UI | 🟠 High |
| Match Notifications | ✅ Real-time | ❌ Missing | Must Add | 🟠 High |
| Profile Quick View | ✅ Swipe cards | ⚠️ Click only | Enhance | 🟡 Medium |

---

### Events & Social Features
| Feature | Mobile | Web | Status | Priority |
|---------|--------|-----|--------|----------|
| Events List (Home) | ✅ Carousel | ❌ Not on home | Must Add | 🔴 Critical |
| Events Full Page | ✅ Complete | ✅ Present | ✓ Match | ✓ |
| Speed Dating List | ✅ Carousel | ✅ Page exists | ⚠️ Not on home | 🟠 High |
| Speed Dating Detail | ✅ Full page | ✅ Present | ✓ Match | ✓ |
| Event Registration | ✅ One-click | ⚠️ Basic | Enhance | 🟡 Medium |
| Event Filters | ✅ By type/date | ❌ Missing | Add | 🟡 Medium |
| Virtual Speed Dating | ✅ Full integration | ✅ API exists | ⚠️ UI minimal | 🟠 High |

---

### Messaging & Communication
| Feature | Mobile | Web | Status | Priority |
|---------|--------|-----|--------|----------|
| Conversation List | ✅ Full list | ✅ Present | ✓ Partial match | ✓ |
| 1-on-1 Chat | ✅ Full thread | ✅ Present | ⚠️ UI differs | 🟡 Medium |
| Group Chat | ✅ Supported | ❌ Missing | Must Add | 🟠 High |
| Typing Indicators | ✅ Real-time | ❌ Missing | Add | 🟡 Medium |
| Read Receipts | ✅ Checkmarks | ❌ Missing | Add | 🟡 Medium |
| Image Messages | ✅ Upload/view | ⚠️ Partial | Enhance | 🟡 Medium |
| Video Messages | ✅ Full support | ❌ Missing | Add | 🟢 Low |
| Video Calls | ✅ Agora RTC | ❌ Missing | Must Add | 🔴 Critical |
| Voice Calls | ✅ Agora RTC | ❌ Missing | Must Add | 🔴 Critical |

---

### Rewards & Gamification
| Feature | Mobile | Web | Status | Priority |
|---------|--------|-----|--------|----------|
| Points Display (Home) | ✅ Prominent | ⚠️ Header only | Must enhance | 🔴 Critical |
| Points Balance | ✅ Full view | ⚠️ Small badge | Enhance | 🟠 High |
| Points History | ✅ Timeline | ✅ Present | ✓ Match | ✓ |
| Rewards Shop | ✅ Full shop | ✅ Present | ✓ Match | ✓ |
| Product Details | ✅ Full page | ✅ Present | ✓ Match | ✓ |
| Redemption Flow | ✅ Complete | ✅ Present | ✓ Match | ✓ |

---

### Profile Management
| Feature | Mobile | Web | Status | Priority |
|---------|--------|-----|--------|----------|
| View Own Profile | ✅ Full view | ✅ Present | ✓ Match | ✓ |
| Edit Profile | ✅ Progressive | ⚠️ All-at-once | Different UX | 🟡 Medium |
| Profile Photo Gallery | ✅ Grid + upload | ⚠️ Partial | Enhance | 🟠 High |
| Video Upload | ✅ In-app | ❌ Missing | Must Add | 🔴 Critical |
| Live Photo Verification | ✅ Camera | ❌ Missing | Must Add | 🟠 High |
| Profile Completion % | ✅ Visible | ❌ Missing | Add | 🟡 Medium |
| Profile Prompts | ✅ 10+ prompts | ⚠️ API only | Add UI | 🟡 Medium |

---

### Settings & Account
| Feature | Mobile | Web | Status | Priority |
|---------|--------|-----|--------|----------|
| Settings Page | ✅ Comprehensive | ⚠️ Basic | Expand | 🟡 Medium |
| Password Change | ✅ Present | ✅ Present | ✓ Match | ✓ |
| Notification Prefs | ✅ Granular | ❌ Missing | Add | 🟡 Medium |
| Privacy Settings | ✅ Full control | ❌ Missing | Add | 🟡 Medium |
| Blocked Users List | ✅ Full list | ❌ Missing | Add | 🟡 Medium |
| Delete Account | ✅ Confirmed | ⚠️ Stub | Complete | 🟡 Medium |

---

### Admin Features (Web Only - OK to differ)
| Feature | Mobile | Web | Notes |
|---------|--------|-----|-------|
| Admin Dashboard | N/A | ✅ Present | Web-only feature (correct) |
| User Management | N/A | ✅ Present | Web-only feature (correct) |
| Event Management | N/A | ✅ Present | Web-only feature (correct) |
| Reports Moderation | N/A | ✅ Present | Web-only feature (correct) |

---

## PART 3: PRIORITY IMPLEMENTATION PLAN

### Phase 1: Fix Critical Navigation Issue (TODAY)
**Goal:** Make "Home" work properly for authenticated users

| Task | Estimated Time | Files |
|------|----------------|-------|
| Create `/home` page with sections | 3-4 hours | `web/src/app/(app)/home/page.tsx` |
| Update BottomNavigation | 5 minutes | `web/src/components/navigation/BottomNavigation.tsx` |
| Add redirect for authenticated users | 15 minutes | `web/src/app/page.tsx` or `middleware.ts` |
| Test navigation flow | 30 minutes | Manual testing |

**Total Phase 1:** ~4-5 hours

#### Home Page Sections (in order):
1. Hero with user info + points (like mobile)
2. Category quick filters (horizontal scroll)
3. Top Matches section (horizontal carousel)
4. Featured Videos section (carousel)
5. Virtual Speed Dating section (carousel)
6. Nearby Profiles section (carousel)
7. Events section (carousel)

---

### Phase 2: Enhance Discovery Experience (WEEK 1)
**Goal:** Match mobile's discovery features

| Task | Estimated Time |
|------|----------------|
| Add comprehensive filter panel (modal/drawer) | 2 hours |
| Implement Like/Pass/Super-Like UI | 3 hours |
| Add match celebration animation | 1 hour |
| Create profile quick-view modal | 2 hours |

**Total Phase 2:** ~8 hours

---

### Phase 3: Video & Calling Features (WEEK 1-2)
**Goal:** Critical missing features for dating app

| Task | Estimated Time |
|------|----------------|
| Integrate Agora RTC Web SDK | 2 hours |
| Build video call UI | 4 hours |
| Build voice call UI | 2 hours |
| Add incoming call notification | 2 hours |
| Add call controls (mute, camera, end) | 2 hours |
| Test calling across platforms | 2 hours |

**Total Phase 3:** ~14 hours

---

### Phase 4: Profile Enhancements (WEEK 2)
**Goal:** Match mobile profile features

| Task | Estimated Time |
|------|----------------|
| Add video upload to profile | 3 hours |
| Build photo gallery manager | 3 hours |
| Add profile completion indicator | 1 hour |
| Add profile prompts UI | 2 hours |
| Add live photo verification | 3 hours |

**Total Phase 4:** ~12 hours

---

### Phase 5: Chat Enhancements (WEEK 2-3)
**Goal:** Full chat feature parity

| Task | Estimated Time |
|------|----------------|
| Add group chat support | 3 hours |
| Add typing indicators | 1 hour |
| Add read receipts | 1 hour |
| Enhance image sharing | 2 hours |
| Add video message support | 3 hours |

**Total Phase 5:** ~10 hours

---

### Phase 6: Settings & Polish (WEEK 3)
**Goal:** Complete feature set

| Task | Estimated Time |
|------|----------------|
| Expand settings page | 2 hours |
| Add notification preferences | 2 hours |
| Add privacy settings | 2 hours |
| Add blocked users management | 1 hour |
| Add delete account flow | 1 hour |

**Total Phase 6:** ~8 hours

---

## PART 4: DESIGN CONSISTENCY

### Mobile-First Approach
Both platforms should follow these principles:
1. **Touch-friendly tap targets** - Minimum 44px
2. **Consistent spacing** - Use design tokens
3. **Same color palette** - Brand primary/secondary
4. **Same iconography** - Lucide icons on web, SF Symbols on iOS
5. **Responsive grids** - 1-4 columns based on screen size

### Component Mapping
| Mobile Component | Web Equivalent | Status |
|------------------|----------------|--------|
| Native Tab Bar | BottomNavigation | ⚠️ Wrong route |
| Bottom Sheet | Modal/Drawer | ⚠️ Basic only |
| Profile Card | ProfileCard | ✓ Exists |
| Video Card | VideoCard | ❌ Missing |
| Event Card | EventCard | ✓ Exists |
| Filter Options | FilterPanel | ⚠️ Basic |

---

## PART 5: API COVERAGE

### Existing APIs Used by Mobile (Should use on Web too)
| Endpoint | Mobile | Web | Action Needed |
|----------|--------|-----|---------------|
| GET /api/discover | ✅ Used | ❌ Not used | Use on /home |
| GET /api/discover/top-matches | ✅ Used | ❌ Not used | Use on /home |
| GET /api/discover/nearby | ✅ Used | ❌ Not used | Use on /home |
| POST /api/matches | ✅ Used | ⚠️ Partial | Full integration |
| GET /api/speed-dating | ✅ Used | ✅ Used | ✓ Match |
| GET /api/events | ✅ Used | ✅ Used | ✓ Match |
| POST /api/agora/call-token | ✅ Used | ❌ Not used | Implement calls |

---

## PART 6: TESTING CHECKLIST

### After Each Phase, Test:
- [ ] **Cross-Platform Data Sync**
  - Profile edits on mobile show on web
  - Matches on mobile show on web
  - Messages sync both ways
  
- [ ] **Navigation Flow**
  - All tabs work on mobile and web
  - Home button goes to dashboard (not public page)
  - Back buttons work correctly
  
- [ ] **Responsive Design**
  - Works on mobile web (320px+)
  - Works on tablet (768px+)
  - Works on desktop (1024px+)
  
- [ ] **Feature Completeness**
  - All actions available on both platforms
  - Same data displayed on both platforms
  - Same business logic on both platforms

---

## PART 7: ROLLOUT STRATEGY

### Recommended Approach:
1. **Week 1:** Phase 1 (Home Fix) + Phase 2 (Discovery) - CRITICAL
2. **Week 2:** Phase 3 (Calls) + Phase 4 (Profile) - HIGH PRIORITY
3. **Week 3:** Phase 5 (Chat) + Phase 6 (Settings) - MEDIUM PRIORITY
4. **Week 4:** Testing, bug fixes, polish

### Success Metrics:
- [ ] All navigation routes work correctly
- [ ] Home dashboard shows all 5 sections (matches, videos, speed dating, nearby, events)
- [ ] Users can perform all key actions on both platforms
- [ ] Video/voice calls work on web
- [ ] Profile editing feature parity
- [ ] No user confusion about "where is X feature"

---

## PART 8: COMMUNICATION NOTES

### For Stakeholders:
"We've identified that the web app's Home button incorrectly links to the public homepage instead of an authenticated dashboard. This is confusing for logged-in users. We're implementing a proper home/dashboard screen that matches the mobile app's functionality, with sections for Top Matches, Featured Videos, Speed Dating, Nearby Profiles, and Events. This is the first step toward full feature parity between web and mobile."

### For Developers:
"Mobile has a comprehensive home screen (`/mobile/app/(tabs)/index.tsx`) with 5 major sections. Web currently links 'Home' to the marketing page (`/`). We need to create `/home` route, replicate all sections, update navigation, and add redirect logic. Then continue with video calling, profile enhancements, and chat features to achieve full parity."

---

## APPENDIX: Quick Reference

### Current File Structure
```
mobile/app/(tabs)/
  ├── _layout.tsx        # Native tabs (5 tabs)
  ├── index.tsx          # HOME - Rich dashboard ✅
  ├── discover.tsx       # Browse profiles ✅
  ├── chats.tsx          # Chat list ✅
  ├── favorites.tsx      # Saved profiles ✅
  └── profile.tsx        # User profile ✅

web/src/app/
  ├── page.tsx           # Public homepage (WRONG for auth users) ❌
  └── (app)/
      ├── layout.tsx     # Auth layout with header + bottom nav
      ├── discover/      # Browse profiles ✅
      ├── chats/         # Chat ✅
      ├── favorites/     # Saved ✅
      ├── matches/       # Matches page ✅
      ├── profile/       # Profile ✅
      ├── settings/      # Settings ✅
      ├── rewards/       # Rewards shop ✅
      ├── speed-dating/  # Speed dating ✅
      └── notifications/ # Notifications ✅
```

### Files to Create/Update for Phase 1
```
CREATE:
  web/src/app/(app)/home/page.tsx

UPDATE:
  web/src/components/navigation/BottomNavigation.tsx
  web/src/app/(app)/layout.tsx (add redirect logic)
  web/src/app/page.tsx (redirect authenticated users)
```

---

**Last Updated:** 2026-01-24  
**Status:** Ready for Implementation  
**Next Action:** Begin Phase 1 - Create `/home` route
