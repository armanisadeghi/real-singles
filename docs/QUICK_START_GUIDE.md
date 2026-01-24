# Quick Start Guide - Testing New Features
**Date:** January 24, 2026  
**For:** Development & QA Teams

---

## What Was Just Implemented

We've achieved ~95% feature parity between web and mobile. Here's how to test all the new features:

---

## 1. Photo & Video Management

### How to Test:
1. Log into web app
2. Go to **Profile → Edit Profile**
3. Click **"Manage Gallery"** button (top right)
4. **Upload photos:**
   - Click the upload area or drag files
   - Photos will open in cropper - crop to square
   - Click "Crop & Save"
5. **Upload video:**
   - Select a video file (max 50MB)
   - No cropping needed for videos
6. **Reorder:**
   - Drag and drop photos to reorder
   - Changes save automatically
7. **Set primary:**
   - Hover over a photo
   - Click "Set Primary" button
8. **Delete:**
   - Hover over any item
   - Click "Delete" button
   - Confirm deletion

### What to Check:
- ✅ Can upload multiple photos
- ✅ Cropper appears for images
- ✅ Videos upload without cropping
- ✅ Drag-and-drop reordering works
- ✅ Primary photo updates
- ✅ Delete removes items
- ✅ Gallery shows on profile page

**Location:** `/profile/gallery`

---

## 2. Complete Discovery Filters

### How to Test:
1. Go to **Discover** page
2. Click **"Filters"** button
3. Scroll through ALL filter options:
   - Age Range
   - Height Range
   - Distance
   - Gender (multi-select)
   - Body Type (multi-select)
   - Ethnicity (multi-select) ← **NEW**
   - Education (multi-select)
   - Religion (multi-select)
   - Political Views (multi-select) ← **NEW**
   - Marital Status (multi-select) ← **NEW**
   - Has Kids (multi-select) ← **NEW**
   - Wants Kids (multi-select) ← **NEW**
   - Pets (multi-select) ← **NEW**
   - Smoking (multi-select)
   - Drinking (multi-select)
   - Marijuana (multi-select) ← **NEW**
   - Exercise (multi-select) ← **NEW**
   - Zodiac (multi-select)
4. Select multiple options in each
5. Click **"Apply Filters"**
6. Verify results match your filters

### What to Check:
- ✅ All 18 filters visible
- ✅ Multi-select chips work
- ✅ Sliders work for age/height/distance
- ✅ Reset button clears all
- ✅ Apply button saves and filters results

**Location:** `/discover` → Filters button

---

## 3. Settings Pages

### 3A. Notification Preferences

**How to Test:**
1. Go to **Settings**
2. Click **"Notifications"**
3. Toggle each preference:
   - Email notifications
   - Match notifications
   - Message notifications
   - Event reminders
   - Likes received
4. Verify "Settings saved" message appears
5. Refresh page - toggles should persist

**What to Check:**
- ✅ Toggles work smoothly
- ✅ Save confirmation appears
- ✅ Settings persist after refresh

**Location:** `/settings/notifications`

---

### 3B. Privacy Settings

**How to Test:**
1. Go to **Settings**
2. Click **"Privacy"**
3. Toggle privacy options:
   - Show profile in discovery
   - Show online status
   - Show distance
   - Show last active
4. Change "Who can message me" setting
5. Verify save confirmation

**What to Check:**
- ✅ All toggles work
- ✅ Message setting changes
- ✅ Settings persist after refresh

**Location:** `/settings/privacy`

---

### 3C. Blocked Users

**How to Test:**
1. Block a user from their profile page
2. Go to **Settings → Blocked Users**
3. See list of blocked users
4. Click **"Unblock"** on one
5. Confirm unblock works

**What to Check:**
- ✅ Blocked users list displays
- ✅ Shows user avatars and names
- ✅ Block date visible
- ✅ Unblock button works
- ✅ Empty state when no blocks

**Location:** `/settings/blocked`

---

## 4. User Event Creation

### How to Test:
1. Go to **Events** page
2. Click **"Create Event"** (if available)
3. Or navigate to `/events/create`
4. Fill in event details:
   - Title: "Test Singles Mixer"
   - Description: "Join us for drinks and mingling"
   - Type: In-Person Event
   - Upload event image
   - Start date/time: Tomorrow at 7 PM
   - Venue: "Downtown Bar"
   - City: "New York"
   - Max attendees: 50
5. Check "Public Event"
6. Click **"Create Event"**
7. Verify redirected to events list

### What to Check:
- ✅ Form validates required fields
- ✅ Image upload works
- ✅ Date picker prevents past dates
- ✅ Location required for in-person events
- ✅ Event appears in events list
- ✅ Can view created event details

**Location:** `/events/create`

---

## 5. Chat Enhancements

### 5A. Typing Indicators

**How to Test:**
1. Open a chat with someone
2. Ask them to type on mobile
3. Watch for "..." animation on web
4. Or: Open two browsers, test yourself

**What to Check:**
- ✅ Typing dots appear when other person types
- ✅ Dots disappear after they stop typing
- ✅ Shows avatar with typing animation

---

### 5B. Read Receipts

**How to Test:**
1. Send a message
2. Watch for status icons:
   - Spinning: Sending
   - Single check ✓: Sent
   - Double check ✓✓: Delivered
   - Blue double check: Read

**What to Check:**
- ✅ Icons change as message progresses
- ✅ Blue checkmarks when read
- ✅ Only shows on own messages

---

### 5C. Online Status

**How to Test:**
1. Go to **Chats** list
2. Look for green dots next to avatars
3. Open a chat
4. Check for "Online" or "Offline" text

**What to Check:**
- ✅ Green dot shows on online users
- ✅ No dot for offline users
- ✅ Online status in chat header
- ✅ Only shows for direct chats (not groups)

**Location:** `/chats` and `/chats/[id]`

---

## 6. Legal Pages

### How to Test:
1. Navigate to each page:
   - `/terms` - Terms of Service
   - `/privacy-policy` - Privacy Policy
   - `/faq` - FAQ
2. Verify all content loads
3. Test FAQ search functionality
4. Test FAQ category filters

### What to Check:
- ✅ All pages load properly
- ✅ Content is readable and formatted
- ✅ Links work (internal navigation)
- ✅ FAQ search works in real-time
- ✅ FAQ categories filter questions
- ✅ FAQ accordions expand/collapse

**Locations:** `/terms`, `/privacy-policy`, `/faq`

---

## 7. Home Dashboard

### How to Test:
1. Log in to web app
2. Click **"Home"** in bottom navigation
3. Verify you see:
   - Welcome message with your name
   - Points display (clickable to rewards)
   - Quick action category pills
   - Top Matches section
   - Featured Videos section
   - Virtual Speed Dating section
   - Nearby Profiles section
   - Events section
4. Click "View All" on any section
5. Verify it navigates correctly

### What to Check:
- ✅ Home button goes to `/home` (not `/`)
- ✅ All 5 sections display
- ✅ Points display is prominent
- ✅ Sections have real data
- ✅ "View All" links work
- ✅ Responsive on mobile/tablet/desktop

**Location:** `/home` (authenticated users)

---

## Testing Priority

### HIGH PRIORITY (Test First):
1. **Photo/Video Upload** - Core feature users need
2. **Gallery Management** - Reorder, delete, set primary
3. **Home Dashboard** - Fixed navigation issue
4. **Discovery Filters** - All 18 filters work

### MEDIUM PRIORITY:
5. **User Event Creation** - New capability
6. **Settings Pages** - Preferences save correctly
7. **Chat Enhancements** - Real-time features

### LOW PRIORITY:
8. **Legal Pages** - Content accuracy

---

## Common Issues to Watch For

### Photo Upload:
- ❌ File size exceeded - Show clear error
- ❌ Invalid file type - Show clear error
- ✅ Cropper should work smoothly
- ✅ Upload progress visible

### Filters:
- ✅ Multi-select should allow multiple choices
- ✅ Reset should clear everything
- ✅ Apply should refresh results

### Settings:
- ✅ Changes should save immediately
- ✅ Toast message should appear
- ✅ Settings should persist after refresh

---

## Cross-Platform Testing

### Test Data Sync:
1. Upload photo on web → Check mobile app shows it
2. Create event on web → Check mobile app shows it
3. Change settings on web → Verify applies to mobile
4. Block user on mobile → Check web shows in blocked list
5. Update filters on web → Check mobile has same preferences

### What Should Match:
- ✅ Profile photos sync
- ✅ Gallery items sync
- ✅ Filter preferences sync
- ✅ Blocked users sync
- ✅ Settings sync
- ✅ Event data sync

---

## Browser Testing

### Test On:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile Safari (iOS)
- ✅ Chrome Mobile (Android)

### Features to Test Per Browser:
- File upload (drag-drop may vary)
- Image cropper (canvas support)
- Date/time pickers (native inputs)
- Drag-and-drop reordering

---

## Performance Testing

### Check:
- Photo upload speed (should be < 5 seconds for 2MB image)
- Gallery page load (should be < 2 seconds)
- Filter panel open (should be instant)
- Settings save (should be < 1 second)
- Page transitions (should be smooth)

---

## Rollback Plan

If critical issues found:

```bash
# Revert last commit
git revert HEAD

# Or revert to specific commit
git revert <commit-hash>

# Push to production
git push
```

---

## Success Metrics

After 1 week in production, track:
- Photo upload success rate (target: >95%)
- Filter usage increase (expect 2-3x more)
- Event creation count (new capability)
- Settings page visits (should increase)
- User satisfaction (reduced support tickets)

---

## Support Team Briefing

### New Features to Communicate:
1. **"Where do I upload photos?"** → Settings → Manage Gallery or Profile → Edit → Manage Gallery
2. **"How do I filter by ethnicity/religion/etc.?"** → All filters now available in Discover → Filters
3. **"Can I create my own event?"** → Yes! Events → Create Event
4. **"Where are blocked users?"** → Settings → Blocked Users
5. **"How do I change notification settings?"** → Settings → Notifications

---

**Document Status:** Complete  
**Ready for:** QA Testing  
**Last Updated:** 2026-01-24
