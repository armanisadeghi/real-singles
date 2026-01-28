# Dating App UX Patterns Reference

Common user flows and UX patterns for dating applications. Reference when analyzing RealSingles features.

---

## Core User Journeys

### 1. Onboarding Journey

**Goal:** New user → Complete profile → Ready to discover

```
Download → Register → Profile creation → Photo upload → Preferences → Discovery
```

**Critical moments:**
- Registration friction (too many fields = abandonment)
- Photo upload (required for matching)
- Preference setting (affects match quality)

**Best practices:**
- Progressive profile completion (minimum viable → enhanced)
- Show profile strength/completion meter
- Allow skip with gentle nudges to complete later
- Gate discovery behind minimum requirements (photo, basic info)

---

### 2. Discovery Journey

**Goal:** Browse profiles → Find interesting people → Express interest

```
Home/Discover → View profile → Like/Pass → (Optional) Super like/Comment → Next profile
```

**Key decisions:**
- Card stack vs. grid view
- Quick actions vs. full profile view required
- Feedback after like (immediate match notification vs. batch)

**Best practices:**
- Show one profile at a time (focused attention)
- Large, clear action buttons (like/pass)
- Undo capability for accidental passes
- Daily limits for free tier (creates urgency)
- Profile preview in stack, full profile on tap

---

### 3. Matching Journey

**Goal:** Mutual interest → Connection → Conversation starter

```
Like sent → (If mutual) Match notification → Match screen → Start conversation
```

**Critical moments:**
- Match notification (celebration moment)
- First message prompt (reduce blank screen anxiety)
- Conversation starters (icebreakers from profile)

**Best practices:**
- Celebratory match animation
- Immediate option to message
- Suggested openers based on shared interests
- "It's a Match" screen with both photos

---

### 4. Conversation Journey

**Goal:** Match → Meaningful conversation → Date planning

```
Matches list → Open chat → Exchange messages → (Optional) Video call → Plan meetup
```

**Key features:**
- Unread indicators
- Typing indicators
- Read receipts (optional)
- Media sharing (photos, voice notes)
- Video call integration
- Date scheduling

**Best practices:**
- New matches section separate from ongoing chats
- Activity indicators (online now, last active)
- Conversation prompts for stale matches
- Safety features (report, block, unmatch)

---

### 5. Profile Management Journey

**Goal:** User maintains attractive, accurate profile

```
My profile → Edit section → Save → See preview → Verify changes
```

**Sections:**
- Photos (primary + gallery)
- Basic info (name, age, location)
- Bio/About me
- Prompts/Icebreakers
- Preferences (who I'm looking for)
- Verification badges

**Best practices:**
- Photo reorder via drag
- Real-time preview
- Profile strength indicator
- Prompt suggestions
- Verification options (phone, photo, video, social)

---

## Feature-Specific Patterns

### Photo Gallery

**Standard features:**
- 6-9 photo slots
- Primary photo (shown in discovery)
- Photo reordering
- Delete with confirmation
- Upload from camera/gallery

**Enhanced features:**
- Photo verification (selfie match)
- Video profile clips
- Photo prompts ("Me in my element")

### Prompts/Icebreakers

**Purpose:** Make profiles more engaging, give conversation starters

**Pattern:**
- Select prompt from list
- Write answer (character limit)
- Display on profile
- Used for conversation starters

**Example prompts:**
- "The way to my heart is..."
- "I'm looking for someone who..."
- "My most controversial opinion..."

### Verification System

**Trust signals:**

| Level | How | Badge |
|-------|-----|-------|
| Phone | SMS OTP | Basic verification |
| Photo | Selfie pose match | Photo verified |
| Video | Live video verification | Video verified |
| ID | Government ID check | Identity verified |
| Social | Connect social accounts | Social verified |
| Background | Professional check | Background checked |

### Discovery Filters

**Common filters:**
- Age range
- Distance/Location
- Height
- Education
- Smoking/Drinking
- Religion
- Ethnicity
- Has children/Wants children
- Relationship type (serious/casual)
- Verified only

**Premium filters:**
- Recently active
- New to app
- Already liked me
- Advanced preferences

### Likes/Pass Mechanics

**Free tier:**
- Limited likes per day
- No see who liked you
- Basic filters

**Premium tier:**
- Unlimited likes
- See who liked you
- Advanced filters
- Rewind (undo pass)
- Super likes
- Profile boosts

---

## Safety Features (Required)

### Always Include

| Feature | Purpose |
|---------|---------|
| Block user | Prevent all contact |
| Report user | Flag inappropriate behavior |
| Unmatch | Remove from matches |
| Hide profile | Temporary invisibility |
| Incognito mode | Only visible to liked profiles |

### Report Categories

- Inappropriate photos
- Harassment
- Scam/Fake profile
- Underage
- Hate speech
- Other

### Safety Tips

Display prominently:
- Never send money
- Meet in public places
- Tell a friend your plans
- Video call first
- Trust your instincts

---

## Premium Feature Tiers

### Typical Structure

| Feature | Free | Basic Premium | Top Tier |
|---------|------|---------------|----------|
| Likes per day | 10 | Unlimited | Unlimited |
| See who liked you | ❌ | ✓ | ✓ |
| Advanced filters | ❌ | ✓ | ✓ |
| Rewind | ❌ | ✓ | ✓ |
| Super likes | 1/week | 5/day | Unlimited |
| Profile boost | ❌ | 1/month | Weekly |
| Read receipts | ❌ | ❌ | ✓ |
| Priority likes | ❌ | ❌ | ✓ |
| Incognito mode | ❌ | ❌ | ✓ |

---

## Mobile-Specific Considerations

### Gesture Patterns

| Gesture | Action |
|---------|--------|
| Swipe right | Like |
| Swipe left | Pass |
| Swipe up | Super like / View profile |
| Tap | View full profile |
| Double tap | Like photo |
| Long press | Preview profile |

### Push Notifications

**Essential:**
- New match
- New message
- Someone liked you (premium)

**Optional:**
- Daily picks
- Profile tips
- Nearby users
- Event reminders

**Settings:**
- Allow per-category opt-out
- Quiet hours
- Push/In-app/Email preferences

---

## Metrics to Track

### Engagement

- Daily/Monthly active users
- Session length
- Profiles viewed per session
- Like rate (likes / profiles viewed)
- Match rate (matches / likes sent)
- Message rate (messages sent / matches)
- Response rate
- Conversation length

### Conversion

- Registration → Profile complete
- Profile complete → First like
- First like → First match
- First match → First message
- Message → Reply
- Free → Premium conversion

### Retention

- Day 1, 7, 30 retention
- Churn reasons
- Reactivation rate

---

## Common UX Pitfalls

| Pitfall | Problem | Solution |
|---------|---------|----------|
| Too many required fields | Abandonment | Progressive disclosure |
| No undo | Accidental passes permanent | Rewind feature |
| Match notification only | Missed matches | Matches section + notification |
| No conversation starters | Blank chat anxiety | Prompts, icebreakers |
| Hidden safety features | Users don't find them | Prominent in profile/chat |
| Complicated premium upsell | User confusion | Clear feature comparison |
| No feedback on actions | User unsure if worked | Animations, confirmations |
| Stale matches | Dead connections | Prompts, expiration |

---

## RealSingles-Specific Features

### Events

Singles events for in-person meetings:
- Event listing
- RSVP/Registration
- Add to calendar
- Check-in
- Post-event connections

### Speed Dating

Virtual speed dating sessions:
- Session scheduling
- Video call rotation
- Time limits
- Post-session matches

### Groups

Community interest groups:
- Join groups
- Group chat
- Group events
- Member discovery

### Rewards/Points

Engagement gamification:
- Earn points for actions
- Redeem for premium features
- Badges and achievements

### Reviews

Reference checking:
- Request reviews from matches
- Display on profile
- Verified reviewer system
