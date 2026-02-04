# Matchmakers Feature - Test Steps

**All passwords:** `MyCustomPass123!`

---

## Step 1: Browse Matchmakers (Regular User)

**Login as:** Any test user  
**Go to:** `/explore`  
**See:** "Expert Matchmakers" banner (purple/pink gradient)  
**Click:** The banner  
**Result:** Grid of 3 matchmakers with photos, bios, stats

---

## Step 2: View Matchmaker Profile (Regular User)

**Still logged in as:** Regular user  
**Click:** Any matchmaker card  
**See:** Full profile with experience, specialties, reviews  
**Click:** "Hire This Matchmaker" button  
**Result:** Button changes to "Current Matchmaker"

---

## Step 3: Matchmaker Dashboard (Matchmaker)

**Logout** → **Login as:** `sophia.matchmaker@testuser.realsingles.com`  
**Go to:** `/matchmaker-portal/dashboard`  
**See:** Your stats (0 intros, 0 clients initially)  
**Navigate:** Use left sidebar (Dashboard, Discover, Clients, Introductions)

---

## Step 4: View Clients (Matchmaker)

**Still logged in as:** Sophia  
**Click:** "Clients" in sidebar  
**See:** List of users who hired you (1 user from Step 2)

---

## Step 5: Admin - View All Matchmakers (Admin)

**Logout** → **Login as:** Your admin account  
**Go to:** `/admin/matchmakers`  
**See:** Table showing all 3 matchmakers  
**Try:** Filter by status (All, Approved, Pending, Suspended)  
**Result:** List updates based on filter

---

## Step 6: Admin - Suspend Matchmaker (Admin)

**Still logged in as:** Admin  
**Click:** Any matchmaker row  
**See:** Full details page  
**Enter:** Suspension reason in text box  
**Click:** "Suspend Matchmaker" button  
**Result:** Status changes to "Suspended"  
**Check:** Go to `/matchmaker-portal/dashboard` as that matchmaker  
**Result:** See "Account Suspended" message

---

## Key Routes Summary

| Route | Who Can Access | What It Does |
|-------|---------------|-------------|
| `/explore` | Anyone logged in | Browse features, click matchmakers banner |
| `/matchmakers` | Anyone logged in | Grid of matchmakers |
| `/matchmakers/[id]` | Anyone logged in | Matchmaker profile + hire button |
| `/matchmaker-portal/dashboard` | Approved matchmakers | Dashboard, stats, navigation |
| `/matchmaker-portal/clients` | Approved matchmakers | View hired clients |
| `/admin/matchmakers` | Admin | View all matchmakers, filter by status |
| `/admin/matchmakers/[id]` | Admin | Suspend/manage individual matchmaker |
| `/admin/matchmakers/applications` | Admin | Approve/reject new applications (empty now) |

---

## What Works Now

✅ Browse matchmakers with photos  
✅ View matchmaker profiles  
✅ Hire matchmaker  
✅ Matchmaker portal access  
✅ Admin approval/suspension  
✅ Matchmakers hidden from normal discovery  
✅ All 3 have professional photos

---

## What's Next (Not Required for Initial Test)

⚠️ **Profile browser** - Matchmaker can't browse profiles yet (discover page is placeholder)  
⚠️ **Create introductions** - Needs profile browser first  
⚠️ **Accept/decline intros** - UI exists at `/introductions` but needs actual intro data  
⚠️ **Notifications** - Not integrated yet

**To test full flow:** Profile browser needs to be cloned from `/admin/algorithm-simulator`
