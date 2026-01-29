# Unmatch History Implementation

## Overview

Implemented a soft-delete unmatch system that preserves match history to prevent users from rediscovering each other after unmatching. This improves user experience by respecting unmatch decisions and preventing awkward re-encounters.

## Problem Solved

**Before:** When users unmatched, the match records were hard-deleted from the database. This meant:
- Users could rediscover each other in the discovery feed
- No audit trail of unmatch events
- No way to prevent repeated matching cycles

**After:** Unmatch is now a soft-delete that:
- Preserves the match record with unmatch metadata
- Prevents rediscovery in all discovery endpoints
- Maintains audit trail for analytics and support
- Archives the conversation automatically

## Database Changes

### Migration: `00021_preserve_unmatch_history.sql`

#### 1. New Columns in `matches` Table

| Column | Type | Description |
|--------|------|-------------|
| `is_unmatched` | BOOLEAN | Soft delete flag (default: false) |
| `unmatched_at` | TIMESTAMPTZ | When the unmatch occurred |
| `unmatched_by` | UUID | User ID who initiated the unmatch |
| `unmatch_reason` | TEXT | Optional reason (e.g., "not_interested", "inappropriate") |

#### 2. Indexes for Performance

```sql
CREATE INDEX idx_matches_is_unmatched ON matches(user_id, target_user_id, is_unmatched);
CREATE INDEX idx_matches_unmatched_at ON matches(unmatched_at) WHERE unmatched_at IS NOT NULL;
```

#### 3. New Database Functions

**`unmatch_user(p_user_id, p_target_user_id, p_reason)`**
- Soft-deletes matches in both directions
- Archives the conversation automatically
- Returns JSON with success status and metadata

**`has_unmatch_history(p_user_id, p_target_user_id)`**
- Checks if two users have unmatched before
- Used in discovery queries to filter out unmatched users

#### 4. Updated RLS Policies

- Users can view their own matches (including unmatched for history)
- Users **cannot** create new matches if unmatch history exists
- Users **cannot** hard-delete matches (soft delete only)
- Only service role can hard-delete (for cleanup)

#### 5. Conversation Archive Flag

Added `is_archived` column to `conversation_participants` table:
- Allows per-user archiving of conversations
- Set automatically when users unmatch
- Users can independently archive/unarchive their conversations

## API Changes

### `DELETE /api/matches/[id]` (Updated)

**Before:** Hard-deleted match records

**After:** Soft-deletes match records and archives conversation

**Query Parameters:**
- `reason` (optional): Unmatch reason string

**Response:**
```json
{
  "success": true,
  "message": "Successfully unmatched",
  "data": {
    "unmatched_count": 2,
    "conversation_archived": true,
    "conversation_id": "uuid"
  }
}
```

**Implementation:**
- Uses `unmatch_user()` database function
- Preserves match history
- Archives conversation
- Prevents rediscovery

## Discovery Service Updates

Updated `/web/src/lib/services/discovery.ts` to exclude unmatched users:

### 1. `getDiscoverableCandidates()`
- Queries matches table with `.eq("is_unmatched", false)`
- Builds `unmatchedIds` exclusion set
- Filters out users with unmatch history in either direction

### 2. `getMutualMatches()`
- Only returns matches where `is_unmatched = false`
- Prevents unmatched users from appearing in matches list

### 3. `getLikesReceived()`
- Only shows likes from users where `is_unmatched = false`
- Excludes likes from users you've unmatched

## Benefits

1. **Prevents Rediscovery**
   - Users never see each other again after unmatch
   - Respects user decisions and preferences

2. **Data Integrity**
   - Preserves match history for analytics
   - Maintains audit trail for support inquiries
   - Can track unmatch patterns and reasons

3. **Better UX**
   - No awkward re-encounters
   - Cleaner discovery feed
   - More respectful of user choices

4. **Analytics Opportunities**
   - Track unmatch reasons
   - Identify problematic users
   - Understand why matches fail
   - Improve matching algorithm

## Usage Examples

### Unmatch a User (API)
```typescript
// From the web or mobile app
const response = await fetch(`/api/matches/${targetUserId}?reason=not_interested`, {
  method: 'DELETE'
});

const { success, data } = await response.json();
// data: { unmatched_count, conversation_archived, conversation_id }
```

### Check Unmatch History (SQL)
```sql
SELECT has_unmatch_history('user1_uuid', 'user2_uuid');
-- Returns: true/false
```

### Query Unmatch Records (Admin)
```sql
SELECT 
  m.user_id,
  m.target_user_id,
  m.is_unmatched,
  m.unmatched_at,
  m.unmatched_by,
  m.unmatch_reason,
  u1.email as initiator_email,
  u2.email as target_email
FROM matches m
LEFT JOIN users u1 ON m.unmatched_by = u1.id
LEFT JOIN users u2 ON m.target_user_id = u2.id
WHERE m.is_unmatched = true
ORDER BY m.unmatched_at DESC;
```

### Get Unmatch Statistics
```sql
-- Count of unmatches by reason
SELECT 
  unmatch_reason,
  COUNT(*) as count
FROM matches
WHERE is_unmatched = true
GROUP BY unmatch_reason
ORDER BY count DESC;

-- Average time from match to unmatch
SELECT 
  AVG(EXTRACT(EPOCH FROM (unmatched_at - created_at))/3600) as avg_hours_to_unmatch
FROM matches
WHERE is_unmatched = true;
```

## Migration Status

- ✅ Migration created: `00021_preserve_unmatch_history.sql`
- ✅ Migration applied to database
- ✅ Web types regenerated
- ✅ Mobile types synced
- ✅ Unmatch API endpoint updated
- ✅ Discovery service updated (all 3 functions)
- ✅ RLS policies updated
- ✅ Database functions created
- ✅ Indexes created
- ✅ Conversation archive implemented

## Files Changed

1. `/web/supabase/migrations/00021_preserve_unmatch_history.sql` (new)
2. `/web/src/types/database.types.ts` (regenerated)
3. `/mobile/types/database.types.ts` (synced)
4. `/web/src/app/api/matches/[id]/route.ts` (soft-delete logic)
5. `/web/src/lib/services/discovery.ts` (filter unmatched users)

## Testing Checklist

- [ ] Match two users
- [ ] Unmatch one of them
- [ ] Verify `is_unmatched` set to true in database
- [ ] Verify conversation is archived
- [ ] Verify neither user sees the other in discovery
- [ ] Verify neither user sees the other in mutual matches
- [ ] Attempt to re-match (should be prevented by RLS)
- [ ] Check unmatch history with `has_unmatch_history()`
- [ ] Verify unmatch reason is stored
- [ ] Verify analytics queries work

## Future Enhancements

1. **Unmatch Appeal System**
   - Allow users to appeal an unmatch (with approval required)
   - Time-based unmatch expiration (e.g., allow re-matching after 6 months)

2. **Unmatch Insights**
   - Dashboard showing unmatch patterns
   - User feedback on why they unmatched
   - ML-based match quality improvements

3. **Conversation Export**
   - Allow users to export conversation before unmatch
   - "Download my data" feature compliance

4. **Block vs Unmatch**
   - Clear distinction in UI
   - Unmatch = "not a fit" (no report)
   - Block = "problematic behavior" (with report)

## Backward Compatibility

- ✅ Existing match records updated with `is_unmatched = false`
- ✅ API response format maintains compatibility
- ✅ Discovery endpoints continue to work (now with better filtering)
- ✅ No breaking changes to mobile or web clients
