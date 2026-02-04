# Professional Matchmakers - Testing Guide

## Test Accounts

**Password for all:** `MyCustomPass123!`

**Matchmakers:**
- sophia.matchmaker@testuser.realsingles.com (Professional, 5 years)
- marcus.matchmaker@testuser.realsingles.com (LGBTQ+ specialist, 8 years)
- elena.matchmaker@testuser.realsingles.com (Faith-based, 3 years)

**Regular Users:**
- Use any existing test user account

**Admin:**
- Use your admin account

---

## 1. Browse Matchmakers (Any User)

1. **Go to:** `/explore`
2. **Click:** "Expert Matchmakers" banner
3. **See:** Grid of 3 matchmakers with photos, bios, experience
4. **Click:** Any matchmaker card
5. **See:** Full profile with stats, reviews, specialties
6. **Click:** "Hire This Matchmaker" button
7. **Confirm:** Check if button changes to "Current Matchmaker"

---

## 2. Matchmaker Portal (Login as Matchmaker)

1. **Logout** current user
2. **Login as:** `sophia.matchmaker@testuser.realsingles.com`
3. **Go to:** `/matchmaker-portal/dashboard`
4. **See:** Stats cards showing your metrics

### View Clients
5. **Click:** "Clients" in sidebar
6. **See:** List of users who hired you (initially empty)

### View Introductions
7. **Click:** "Introductions" in sidebar
8. **See:** History of introductions you've created (initially empty)

---

## 3. Create Introduction (As Matchmaker)

1. **Still logged in as:** Sophia
2. **Click:** "Discover" in sidebar
3. **See:** Profile browser (similar to admin algorithm simulator)
4. **Select:** 2 users by clicking their cards
5. **Click:** "Create Introduction" button
6. **Enter:** Message explaining why they'd be great together
7. **Click:** "Send Introduction"
8. **Result:** Both users get notified

---

## 4. Respond to Introduction (As User)

1. **Logout** matchmaker
2. **Login as:** Regular test user (who received intro)
3. **Go to:** `/introductions`
4. **See:** Pending introduction from Sophia
5. **Click:** Introduction card
6. **See:** Other user's profile + matchmaker's message
7. **Click:** "Accept" or "Decline"
8. **If both accept:** Group chat automatically created

---

## 5. Admin: Review Applications (As Admin)

1. **Login as:** Admin
2. **Go to:** `/admin/matchmakers/applications`
3. **See:** Pending applications (if any)
4. **For each application:**
   - View bio, experience, certifications
   - Enter rejection reason (if rejecting)
   - Click "Approve" or "Reject"

---

## 6. Admin: Manage Matchmakers (As Admin)

1. **Still logged in as:** Admin
2. **Go to:** `/admin/matchmakers`
3. **See:** All matchmakers with status filters
4. **Filter by:** Approved, Pending, Suspended
5. **Click:** Any matchmaker
6. **See:** Full details + stats
7. **Actions available:**
   - Suspend (with reason)
   - View all introductions
   - View all clients

---

## Expected Flow

```
User browses matchmakers → Hires matchmaker
         ↓
Matchmaker views clients → Discovers profiles → Creates introduction
         ↓
Both users receive notification → View intro → Accept/Decline
         ↓
If both accept → 3-person group chat created (Matchmaker + User A + User B)
         ↓
Matchmaker tracks outcome → Users can review matchmaker
```

---

## Quick Checks

✅ **Explore Page:** Matchmakers banner displays prominently
✅ **Browse:** Grid shows all approved matchmakers
✅ **Profile:** Shows stats, reviews, "Hire" button  
✅ **Portal Access:** Only approved matchmakers can access
✅ **Introductions:** Users see pending intros, can accept/decline
✅ **Admin:** Can approve applications and suspend matchmakers
✅ **Group Chat:** Created automatically when both users accept

---

## Known Limitations

⚠️ **Profile Browser:** Currently placeholder - needs full algorithm UI cloned
⚠️ **No Notifications:** Manual checking required (in `/introductions`)
⚠️ **No User Application:** Can't apply to become matchmaker via UI yet (API only)
⚠️ **No Review Form:** Can't submit reviews via UI yet (API only)

---

## Quick Test Scenario

1. Login as Sophia → Go to dashboard
2. Create introduction between 2 test users
3. Logout → Login as User A
4. Go to `/introductions` → Accept
5. Logout → Login as User B  
6. Go to `/introductions` → Accept
7. Check messages → See new 3-person group chat
8. Logout → Login as Sophia
9. Go to introduction detail → Update outcome
10. Check stats update automatically
