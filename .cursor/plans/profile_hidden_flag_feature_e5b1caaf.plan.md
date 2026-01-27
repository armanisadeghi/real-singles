---
name: Profile Hidden Flag Feature
overview: Add a `profile_hidden` flag to the profiles table that hides users from discovery, matches, and data integrity checks. This enables admin hiding, user-initiated account pausing, and future visibility controls.
todos:
  - id: migration
    content: Create migration file 00017_add_profile_hidden.sql and run it
    status: pending
  - id: types
    content: Regenerate TypeScript types for web and mobile
    status: pending
  - id: data-integrity
    content: Update data integrity service to exclude hidden profiles
    status: pending
  - id: discovery-apis
    content: Update discover, nearby, top-matches API endpoints
    status: pending
  - id: matches-apis
    content: Update matches, likes-received, history API endpoints
    status: pending
  - id: social-apis
    content: Update favorites, conversations, groups API endpoints
    status: pending
  - id: profile-apis
    content: Update users/[id] and users/me API endpoints
    status: pending
  - id: web-settings
    content: Add pause account toggle to web settings page
    status: pending
  - id: mobile-settings
    content: Add pause account toggle to mobile settings screen
    status: pending
  - id: testing
    content: "Test all flows: pause/unpause, discovery, matches, data integrity"
    status: pending
isProject: false
---

# Profile Hidden Flag Implementation

## Overview

Add a `profile_hidden` boolean column to the `profiles` table that:

- Hides users from discovery, matches, search results, and favorites lists
- Excludes hidden users from data integrity checks
- Allows users to "pause" their account
- Auto-enables for admin/moderator accounts

## Database Migration

**File:** `web/supabase/migrations/00017_add_profile_hidden.sql`

```sql
-- Add profile_hidden flag to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS profile_hidden BOOLEAN DEFAULT FALSE;

-- Add index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_profiles_hidden 
ON profiles(profile_hidden) WHERE profile_hidden = FALSE;

-- Auto-set profile_hidden for existing admins/moderators
UPDATE profiles p
SET profile_hidden = TRUE
FROM users u
WHERE p.user_id = u.id 
AND u.role IN ('admin', 'moderator');

-- Comment for documentation
COMMENT ON COLUMN profiles.profile_hidden IS 
'When true, user is hidden from discovery, matches, and search. Used for admin accounts and user-initiated pausing.';
```

## API Endpoints to Update (13 total)

All endpoints need to add `.eq("profile_hidden", false)` or equivalent filter on profile queries.

### Discovery (3 endpoints)

- [web/src/app/api/discover/route.ts](web/src/app/api/discover/route.ts) - Top Matches and Nearby queries
- [web/src/app/api/discover/nearby/route.ts](web/src/app/api/discover/nearby/route.ts) - Nearby profiles
- [web/src/app/api/discover/top-matches/route.ts](web/src/app/api/discover/top-matches/route.ts) - Top matches

### Matches (3 endpoints)

- [web/src/app/api/matches/route.ts](web/src/app/api/matches/route.ts) - Mutual matches
- [web/src/app/api/matches/likes-received/route.ts](web/src/app/api/matches/likes-received/route.ts) - Likes received
- [web/src/app/api/matches/history/route.ts](web/src/app/api/matches/history/route.ts) - Match history

### Social (4 endpoints)

- [web/src/app/api/favorites/route.ts](web/src/app/api/favorites/route.ts) - Favorites list
- [web/src/app/api/conversations/route.ts](web/src/app/api/conversations/route.ts) - Conversation participants
- [web/src/app/api/conversations/[id]/route.ts](web/src/app/api/conversations/[id]/route.ts) - Single conversation
- [web/src/app/api/groups/route.ts](web/src/app/api/groups/route.ts) - Group members

### Profiles (1 endpoint)

- [web/src/app/api/users/[id]/route.ts](web/src/app/api/users/[id]/route.ts) - Single user profile view

### User Profile Update (1 endpoint)

- [web/src/app/api/users/me/route.ts](web/src/app/api/users/me/route.ts) - Add `profile_hidden` to PATCH allowed fields

## Data Integrity Service Update

**File:** [web/src/lib/services/data-integrity.ts](web/src/lib/services/data-integrity.ts)

Modify `runFullIntegrityCheck` query to exclude hidden profiles:

```typescript
const { data: users, error: usersError } = await supabase
  .from("users")
  .select(`
    id, email, created_at,
    profiles!inner (
      first_name, last_name, gender, looking_for,
      date_of_birth, profile_image_url, profile_hidden
    )
  `)
  .eq("profiles.profile_hidden", false)  // Exclude hidden profiles
  .order("created_at", { ascending: false });
```

## Type Generation

After migration, regenerate types:

- **Web:** `cd web && pnpm db:types`
- **Mobile:** Copy updated types to `mobile/types/`

## Web UI - Settings Page

**File:** [web/src/app/(app)/settings/page.tsx](web/src/app/\\(app)/settings/page.tsx)

Add "Pause Account" toggle section with:

- Toggle switch to enable/disable `profile_hidden`
- Explanation text: "When paused, your profile won't appear in discovery or matches"
- Fetch current state from `/api/users/me`
- Update via `PATCH /api/users/me` with `profile_hidden: true/false`

## Mobile UI - Settings Screen

**Files:**

- [mobile/app/settings/index.tsx](mobile/app/settings/index.tsx) - Add pause account toggle
- [mobile/lib/api.ts](mobile/lib/api.ts) - Ensure PATCH users/me supports profile_hidden

Add toggle between "Edit Profile" and "Privacy Policy" sections.

## Admin Dashboard Considerations

**File:** [web/src/app/admin/(dashboard)/data-integrity/page.tsx](web/src/app/admin/\\(dashboard)/data-integrity/page.tsx)

The data integrity dashboard will automatically exclude hidden profiles from checks. No additional UI changes needed since admins shouldn't appear in integrity issues.

## Implementation Order

1. Create and run database migration
2. Regenerate TypeScript types (web + mobile)
3. Update data integrity service
4. Update all 13 API endpoints
5. Add pause toggle to web settings
6. Add pause toggle to mobile settings
7. Test all flows

## Edge Cases to Handle

- **Existing conversations/matches:** Hidden users should still appear in existing chat lists (only hide from new discovery)
- **Direct profile links:** `/users/[id]` should still work but could show "Profile unavailable" for hidden users
- **Admin override:** Admins viewing users in admin panel should see all users regardless of hidden flag