# realsingles/wep Project Tasks

## 📦 Version 1.3.30 - Deployed 2026-02-03

**What's New:**
- **Share Feature**: Share button added to Discover page (desktop & mobile) allowing users to share profiles with friends
- **Fixed Discover Layout**: Restructured to match other routes - now uses `min-h-dvh` instead of `fixed inset-0`. Bottom navigation dock properly visible with standard `pb-24` padding. Action buttons positioned correctly above the dock.
- **Refer Friends**: Eye-catching banner on Explore page promoting the referral program (emoji removed, icons-only design)
- **Better Filters**: Fixed age filter input to prevent confusing leading zeros
- **Time Display Fix**: Corrected double AM/PM display bug on speed dating events
- **Enhanced Speed Dating**: Added "Upcoming" and "Past" tabs to speed dating page, with proper handling of past events (disabled registration, hidden from Explore page)
- **Explore Page Reordered**: Sections now flow logically: Events → Speed Dating → Rewards → Videos

---

## ✅ Code Updates - COMPLETED (v1.3.24)
- ✅ Put share icon in the bottom of the Discover page, to the right of the Like
- ✅ Add the bottom links to the discover page and update formatting to ensure it works like all other routes and we consider the added height taken up by the bottom menu (dock)
- ✅ Add a feature on the explore page that links to this: http://localhost:3000/refer

### 🧪 Testing Required (v1.3.30 - RESTRUCTURED LAYOUT):
- [X] **TEST**: Verify share button appears on Discover page (right of Like button) on both desktop and mobile
- [ ] **TEST v1.3.30**: Verify bottom navigation dock is NOW VISIBLE on Discover page (Discover, Explore, Likes, Messages, Profile tabs at bottom)
- [ ] **TEST v1.3.30**: Verify action buttons (X, Undo, Star, Heart, Share) are positioned ABOVE the bottom dock (not overlapping)
- [ ] **TEST v1.3.30**: Verify profile content scrolls properly and page layout matches Explore/Events pages (not full-screen)
- [ ] **TEST**: Verify "Refer Friends" banner has NO emojis (only Lucide icons)
- [ ] **TEST**: Verify Explore page order is: Events, Speed Dating, Refer Friends, Videos
- 

## ✅ Bugs Fixed - COMPLETED (v1.3.24)
- ✅ Age showing a 0 before the number on filters (From the top menu of the app)
- ✅ Explore - Virtual speed dating events showing "AM AM" - fixed double time formatting
- ✅ Speed Dating: In the ui, show tabs for upcoming and past, just like regular "events" route
- ✅ Speed dating on Explore page: Showing past events and then allows you to start registration process and gets error only after. Instead, it should not show them on the explore page and if you get to it from "past" or another way, the register button should be disabled or changed, just like 'events'

### 🧪 Testing Required:
- [ ] **TEST**: Verify age filter inputs don't show leading zeros (e.g., 025 displays as 25)
- [ ] **TEST**: Verify speed dating times on Explore page show correctly (e.g., "4:47 PM" not "4:47 PM PM")
- [ ] **TEST**: Verify /speed-dating page has "Upcoming" and "Past" tabs that work correctly
- [ ] **TEST**: Verify past speed dating events don't appear on Explore page (only upcoming ones)
- [ ] **TEST**: Verify register button is disabled/shows "Registration Closed" for past events
- 


## Feature Problems or buildouts
- admin/products - appears to be completely dummy code without db integration, apis and logic
    - Find out what we already have with Supabase MCP tool, apis, server, etc.
    - Build whatever is missing
    - Imaage, Name, Description, Active/not, Points, Value
    - User facing options would allow a user to get these products with points and set the ship to for either themselves or choosing another member (The first user doesn't get to see the other person's address) - Like a shopping card system.

- Speed Dating System:
    - Explore how we can make speed dating work
    - 

- Matchmakers System:
    - People have a role as a matchmaker and they are able to go through profiles and match, etc.
    - Add user type for "Matchmaker"
    - Matchmakers can use much of the admin system
    - For now, the feature will be 'coming soon' and shown at the bottom of the explore page

