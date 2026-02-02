# Share, Block, Report, and Undo APIs

Quick reference for UI integration of share, block, report, and undo functionality.

---

## Undo API

### Check Undo Availability
```
GET /api/matches/undo
```
**Auth:** Required

**Response (action available):**
```json
{
  "success": true,
  "can_undo": true,
  "last_action": {
    "action": "like",
    "target_user_id": "uuid",
    "created_at": "2025-01-15T10:30:00Z",
    "seconds_remaining": 245
  }
}
```

**Response (no action):**
```json
{
  "success": true,
  "can_undo": false,
  "msg": "No recent action to undo"
}
```

### Undo Last Action
```
POST /api/matches/undo
Content-Type: application/json

{
  "target_user_id": "uuid"
}
```
**Auth:** Required

**Response:**
```json
{
  "success": true,
  "undone_action": "like",
  "target_user_id": "uuid",
  "msg": "Successfully undid like action"
}
```

**Constraints:**
- Actions can only be undone within **5 minutes**
- Mutual matches **cannot** be undone
- Only your own actions can be undone

---

## Block APIs

### List Blocked Users
```
GET /api/blocks
```
**Auth:** Required

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "blocked_user_id": "uuid",
      "display_name": "John",
      "first_name": "John",
      "last_name": "Doe",
      "profile_image_url": "https://...",
      "blocked_at": "2025-01-15T10:30:00Z"
    }
  ]
}
```

### Block a User
```
POST /api/blocks
Content-Type: application/json

{
  "blocked_user_id": "uuid"
}
```
**Auth:** Required

**Response:**
```json
{
  "success": true,
  "msg": "User blocked successfully"
}
```

**Side effects:**
- Removes both users from each other's favorites
- Removes any existing matches between users
- Blocked user will no longer appear in discovery
- Blocked user cannot view your profile (returns 403)

### Unblock a User
```
DELETE /api/blocks/{blocked_user_id}
```
**Auth:** Required

**Response:**
```json
{
  "success": true,
  "msg": "User unblocked successfully"
}
```

---

## Report APIs

### Submit a Report
```
POST /api/reports
Content-Type: application/json

{
  "reported_user_id": "uuid",
  "reason": "Inappropriate photos",
  "description": "Optional additional details"
}
```
**Auth:** Required

**Predefined reasons (suggested):**
- `Inappropriate photos`
- `Fake profile`
- `Harassment`
- `Spam`
- `Other`

**Response:**
```json
{
  "success": true,
  "msg": "Thank you for your report. Our team will review it shortly."
}
```

**Notes:**
- Duplicate reports within 24 hours return success with message about existing report
- Cannot report yourself

### Get Your Submitted Reports
```
GET /api/reports
```
**Auth:** Required

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "reported_user_id": "uuid",
      "reported_user_name": "Jane",
      "reason": "Fake profile",
      "description": null,
      "status": "pending",
      "created_at": "2025-01-15T10:30:00Z"
    }
  ]
}
```

**Status values:** `pending`, `reviewed`, `resolved`, `dismissed`

---

## Share APIs

### Get Public Profile (No Auth Required)
```
GET /api/public/profile/{user_id}
```
**Auth:** Not required

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "first_name": "Sarah",
    "age": 28,
    "location": "San Francisco, CA",
    "bio": "Love hiking and exploring...",
    "profile_image_url": "https://...",
    "is_verified": true
  }
}
```

**Limited fields returned:**
- First name only (no last name)
- Age (calculated from DOB)
- City, State
- Bio (truncated to 100 chars)
- Primary photo only
- Verification status

**Error responses:**
- `404` - User not found, suspended, deleted, or profile hidden

### Share Page
```
/p/{user_id}
```

**Behavior:**
- If authenticated: redirects to `/discover/profile/{user_id}`
- If not authenticated: shows limited profile with sign-up CTA

**Usage:** Copy and share this URL to let others preview a profile.

---

## UI Integration Notes

### Block Flow
1. User taps block button on profile
2. Show confirmation dialog
3. Call `POST /api/blocks` with `blocked_user_id`
4. On success, navigate away from profile (they can't view it anymore)
5. Show toast: "User blocked"

### Report Flow
1. User taps flag/report button
2. Show reason selection modal (use predefined reasons)
3. Optional: allow description input
4. Call `POST /api/reports`
5. Show toast: "Report submitted"
6. Optionally offer to block the user

### Share Flow
1. User taps share button
2. Copy URL: `https://yourapp.com/p/{user_id}`
3. Use native share sheet if available (`navigator.share`)
4. Fallback: copy to clipboard with toast

### Undo Flow
1. User takes action (like/pass/super_like) on profile X
2. Action is recorded in localStorage via `useMatchUndo` hook
3. User navigates to next profile
4. Undo button shows active state with countdown (5 min window, shows seconds when <30s)
5. User clicks undo → API deletes the match record
6. Navigate to `/discover/profile/{target_user_id}` for a fresh start

### Existing UI Components
- `DiscoveryProfileView.tsx` already has report modal with predefined reasons
- `DiscoveryProfileView.tsx` has undo button with timer indicator
- Settings > Blocked Users page can use `GET /api/blocks` for list
- Admin reports page at `/admin/reports` for moderation

### Client-Side Hook
```typescript
import { useMatchUndo } from "@/hooks/useMatchUndo";

const { canUndo, secondsRemaining, lastAction, recordAction, performUndo } = useMatchUndo();

// Record after successful action
if (result.success && !result.is_mutual) {
  recordAction(targetUserId, userName, "like");
}

// Perform undo
const result = await performUndo();
if (result.success) {
  router.push(`/discover/profile/${result.targetUserId}`);
}
```

---

## Database Tables

### matches (for undo)
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | User who took the action |
| target_user_id | uuid | User action was taken on |
| action | text | like/pass/super_like |
| created_at | timestamp | When action was taken |

*Note: Undo deletes the match record. Only actions within 5 minutes can be undone.*

### blocks
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| blocker_id | uuid | User who blocked |
| blocked_id | uuid | User who was blocked |
| created_at | timestamp | When blocked |

### reports
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| reporter_id | uuid | User who reported |
| reported_user_id | uuid | User being reported |
| reason | text | Report reason |
| description | text | Optional details |
| status | text | pending/reviewed/resolved/dismissed |
| reviewed_by | uuid | Admin who reviewed |
| reviewed_at | timestamp | When reviewed |
| created_at | timestamp | When created |
