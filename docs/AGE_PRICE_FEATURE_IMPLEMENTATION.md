# Age Range and Price Feature Implementation

## Summary

Successfully added age range (`age_min`, `age_max`) and `price` fields to both `events` and `virtual_speed_dating` tables, updated all relevant APIs, admin pages, and user-facing pages.

---

## Database Changes

### Migration Applied: `add_age_price_to_events`

**Events Table:**
- Added `age_min` INTEGER
- Added `age_max` INTEGER  
- Added `price` DECIMAL(10, 2) DEFAULT 0

**Virtual Speed Dating Table:**
- Added `price` DECIMAL(10, 2) DEFAULT 0
- (Already had `age_min` and `age_max`)

---

## TypeScript Types Updated

✅ **Web:** `/web/src/types/database.types.ts` - Regenerated with `pnpm db:types`
✅ **Mobile:** `/mobile/types/database.types.ts` - Copied from web

Both projects now have the latest database types with the new fields.

---

## API Routes Updated

### Events API (`/web/src/app/api/events/[id]/route.ts`)
- **GET:** Returns `AgeMin`, `AgeMax`, and `Price` fields in response
- **PUT:** Accepts and updates `age_min`, `age_max`, and `price` fields

### Speed Dating API (`/web/src/app/api/speed-dating/[id]/route.ts`)
- **GET:** Returns `price` field in session response

---

## Admin Pages Updated

### Events Admin:
1. **Create Page** (`/web/src/app/admin/(dashboard)/events/create/page.tsx`)
   - Added form fields for Minimum Age, Maximum Age, and Price
   - Form submits all three new fields to API

2. **Edit Page** (`/web/src/app/admin/(dashboard)/events/[id]/edit/page.tsx`)
   - Added form fields for Minimum Age, Maximum Age, and Price
   - Loads existing values from database
   - Updates all three fields when saving

### Speed Dating Admin:
1. **Create Page** (`/web/src/app/admin/(dashboard)/speed-dating/create/page.tsx`)
   - Already had age fields
   - Added Price field

2. **Edit Page** (`/web/src/app/admin/(dashboard)/speed-dating/[id]/edit/page.tsx`)
   - Already had age fields
   - Added Price field
   - Loads existing price from database

---

## User-Facing Pages Updated

### Events Detail Page (`/web/src/app/(app)/events/[id]/page.tsx`)
- ✅ **Removed:** "Who's going" section with attendee avatars
- ✅ **Added:** Age Range display (shows when `age_min` or `age_max` is set)
- ✅ **Added:** Cost display (shows when `price` > 0)
- Updated TypeScript interface to include new fields

### Speed Dating Detail Page (`/web/src/app/(app)/speed-dating/[id]/page.tsx`)
- ✅ Age Range already displayed correctly
- ✅ **Added:** Cost display (shows when `price` is set, displays "Free" for $0)
- Updated TypeScript interface to include `price` field

---

## Key Features

### Display Logic:
- **Age Range:** Only shows if at least one age boundary is set
  - Both set: "21-35 years"
  - Only min: "21+ years"
  - Only max: "Up to 35 years"

- **Price:** Only shows if > 0 for events, shows "Free" or price for speed dating
  - Events: Shows when price > 0 
  - Speed Dating: Shows "Free" or formatted price (e.g., "$25.00")

### Admin Form Fields:
- **Age Min/Max:** Number inputs with min=18, max=99
- **Price:** Number input with min=0, step=0.01, placeholder "0.00 for free events/sessions"

---

## Testing Checklist

- [ ] Create new event with age range and price via admin
- [ ] Edit existing event to add/update age range and price
- [ ] View event detail page - confirm age range and price display
- [ ] Create new speed dating session with age range and price
- [ ] Edit existing speed dating session to add/update price
- [ ] View speed dating detail page - confirm age range and price display
- [ ] Confirm "Who's going" section is removed from events
- [ ] Test on mobile devices (iOS and Android)

---

## Files Changed

### Database:
- Migration applied via Supabase MCP tool

### Web:
- `src/types/database.types.ts` - Regenerated
- `src/app/api/events/[id]/route.ts` - Updated GET and PUT
- `src/app/api/speed-dating/[id]/route.ts` - Updated GET
- `src/app/(app)/events/[id]/page.tsx` - UI updates
- `src/app/(app)/speed-dating/[id]/page.tsx` - UI updates
- `src/app/admin/(dashboard)/events/create/page.tsx` - Form fields added
- `src/app/admin/(dashboard)/events/[id]/edit/page.tsx` - Form fields added
- `src/app/admin/(dashboard)/speed-dating/create/page.tsx` - Price field added
- `src/app/admin/(dashboard)/speed-dating/[id]/edit/page.tsx` - Price field added

### Mobile:
- `types/database.types.ts` - Copied from web

---

## Notes

- All changes maintain cross-platform parity (Single Source of Truth)
- API handles both camelCase and snake_case field names for compatibility
- Price is stored as DECIMAL(10, 2) for precision
- Age fields use INTEGER type with reasonable constraints
- Default price is 0 (free events/sessions)
- Age fields are optional (NULL allowed)
