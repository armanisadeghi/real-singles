# Can Start Matching Implementation

## Overview

Added a database-maintained `can_start_matching` boolean field to the `profiles` table that automatically tracks whether a user has completed the minimum requirements to start matching.

## Database Changes

### Migration: `00020_add_can_start_matching.sql`

1. **New Column**: `profiles.can_start_matching` (BOOLEAN)
   - Default: `false`
   - Automatically maintained by database triggers
   - Indexed for performance

2. **Required Fields for Matching**:
   - `first_name` (not null/empty)
   - `date_of_birth` (not null)
   - `gender` (not null/empty)
   - `looking_for` (not null/non-empty array)
   - `profile_image_url` (not null/empty)
   - Minimum photo count met (default: 1 image in `user_gallery`)

3. **Database Functions**:
   - `calculate_can_start_matching(profile_record)`: Calculates if profile meets requirements
   - `update_can_start_matching_on_profile()`: Trigger function for profile updates
   - `update_can_start_matching_on_gallery_change()`: Trigger function for gallery changes

4. **Triggers**:
   - `trigger_update_can_start_matching_on_profile`: Runs BEFORE INSERT/UPDATE on `profiles`
   - `trigger_update_can_start_matching_on_gallery`: Runs AFTER INSERT/UPDATE/DELETE on `user_gallery` (for images only)

5. **Backfilled**: All existing profiles updated with correct values

## Type Updates

### Web (`web/src/types/database.types.ts`)
- Regenerated with `pnpm db:types`
- Added `can_start_matching: boolean | null` to `profiles` table Row/Insert/Update types
- Added `calculate_can_start_matching` function type

### Mobile (`mobile/types/database.types.ts`)
- Copied from web types
- Same `can_start_matching` field available

### Application Types (`web/src/types/index.ts`)
- Updated `ProfileCompletionStatus` interface:
  - `canStartMatching`: Calculated value (backwards compatibility)
  - `canStartMatchingDb`: Database-stored value (source of truth)

## API Updates

### `GET /api/users/me`
Added to response:
```typescript
{
  CanStartMatching: profile?.can_start_matching || false,
  can_start_matching: profile?.can_start_matching || false, // Alias
}
```

### `GET /api/profile/completion`
Added to response:
```typescript
{
  canStartMatchingDb: profile?.can_start_matching || false, // Database value
  canStartMatching: <calculated>, // Calculated value (backwards compatibility)
}
```

## Configuration

Environment variable (optional):
- `MIN_PHOTOS_REQUIRED`: Minimum number of photos required (default: 1)
- Set in `.env.local` or database config

## Benefits

1. **Performance**: No need to calculate on every request - pre-computed in database
2. **Consistency**: Single source of truth maintained by triggers
3. **Queryable**: Can filter users who can match: `WHERE can_start_matching = true`
4. **Automatic**: Updates whenever profile or gallery changes
5. **Indexed**: Fast queries for discovery/matching systems

## Usage Examples

### Check if user can start matching (TypeScript)
```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('can_start_matching')
  .eq('user_id', userId)
  .single();

if (profile.can_start_matching) {
  // User can start matching
}
```

### Filter matchable users (SQL)
```sql
SELECT * FROM profiles
WHERE can_start_matching = true
  AND status = 'active'
ORDER BY created_at DESC;
```

### Get current user status (API)
```typescript
// From /api/users/me
const response = await fetch('/api/users/me');
const { data } = await response.json();
console.log(data.CanStartMatching); // true/false

// From /api/profile/completion
const completionResponse = await fetch('/api/profile/completion');
const { data: completion } = await completionResponse.json();
console.log(completion.canStartMatchingDb); // Database value
```

## Migration Status

- ✅ Migration created: `00020_add_can_start_matching.sql`
- ✅ Migration applied to database
- ✅ Web types regenerated
- ✅ Mobile types synced
- ✅ API endpoints updated
- ✅ TypeScript interfaces updated
- ✅ Indexed for performance
- ✅ Backfilled existing data

## Files Changed

1. `/web/supabase/migrations/00020_add_can_start_matching.sql` (new)
2. `/web/src/types/database.types.ts` (regenerated)
3. `/mobile/types/database.types.ts` (synced)
4. `/web/src/types/index.ts` (updated ProfileCompletionStatus)
5. `/web/src/app/api/users/me/route.ts` (added field to response)
6. `/web/src/app/api/profile/completion/route.ts` (added canStartMatchingDb)

## Testing Checklist

- [ ] Create new user and verify `can_start_matching` starts as `false`
- [ ] Complete required fields and verify it changes to `true`
- [ ] Add/remove gallery photos and verify it updates correctly
- [ ] Test `/api/users/me` returns `CanStartMatching`
- [ ] Test `/api/profile/completion` returns `canStartMatchingDb`
- [ ] Verify database trigger fires on profile updates
- [ ] Verify database trigger fires on gallery changes
- [ ] Query profiles with `WHERE can_start_matching = true`
