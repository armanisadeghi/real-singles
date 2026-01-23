# RealSingles - Integration Tracker

**Last Updated:** January 23, 2026 (Updated after Native Navigation and Single/Multi-Select fixes)  
**Purpose:** Track the implementation status of every field and feature across the full integration pipeline.

---

## Recent Progress

### Completed This Session

1. **Database Migration (00005_expand_profile_fields.sql)**
   - Added 17 new profile columns (prompts, social links, verification tiers, etc.)
   - Updated constraints for expanded options
   - Added profile completion tracking columns

2. **TypeScript Types Updated**
   - All new Profile fields with correct types
   - Standardized option constants exported from `@/types`
   - All dropdown options now use `{ value, label }` format

3. **API /users/me Updated**
   - Supports all new fields
   - Fixed typos: `Ethnicity` (was Ethniticity), `Marijuana` (was Marijuna)
   - Legacy misspellings completely removed
   - Arrays returned as arrays, not comma-separated strings

4. **Web Profile Edit Updated**
   - All new fields added
   - Height now uses feet+inches dropdowns (not raw inches input)
   - Uses standardized option constants from types
   - All profile prompts included
   - Ethnicity is now multi-select for mixed heritage

5. **Mobile Profile Edit Updated**
   - **CRITICAL FIX:** Height slider replaced with native two-column picker (feet + inches)
   - All field name typos corrected (`Ethnicity`, `Marijuana`)
   - Renamed `Ethinicity.tsx` → `Ethnicity.tsx` (component + all imports)
   - Created standardized options in `constants/options.ts`
   - Updated EditProfileForm to properly save/load height as total inches
   - Fixed FilterOptions to use correct field names
   - Fixed signup flow to use correct field names
   - Installed `@react-native-picker/picker` for native height selector

6. **Gender/Looking For Separation (NEW)**
   - Split combined "I'm a man seeking woman" into two separate fields
   - Signup now has two-step selection: Gender → Looking For
   - EditProfileForm has separate dropdowns for Gender and Looking For
   - Database field `looking_for` is now properly used (TEXT[] array)

7. **Options Standardization (NEW)**
   - All signup and profile edit forms now use centralized `constants/options.ts`
   - Values match database constraints exactly (lowercase with underscores)
   - Consistent across web and mobile platforms

8. **Exercise Field Added (NEW)**
   - Exercise field now available in EditProfileForm UI
   - Connected to API and database properly

### Remaining
- ~~TypeScript errors in signup components~~ - FIXED: All `data` possibly undefined errors resolved
- ~~Progressive signup flow~~ - IMPLEMENTED: Server-side API at `/api/profile/completion`
- ~~"Prefer not to say" options~~ - IMPLEMENTED: Added to all sensitive fields
- ~~Bottom Navigation~~ - IMPLEMENTED: Native tabs using Expo Router NativeTabs (UITabBarController on iOS, BottomNavigationView on Android)
- ~~Single vs Multi-Select standardization (body_type, religion, pets)~~ - FIXED

### New API Endpoint: `/api/profile/completion`

**GET** - Returns profile completion status:
- `percentage` - Completion percentage (0-100)
- `nextField` - Next field to complete
- `canStartMatching` - True if all required fields filled
- `isComplete` - True if all fields complete or marked "prefer not to say"
- `fields` - Full list of profile fields with metadata

**POST** - Update completion tracking:
- `action: "skip"` - Mark field as skipped (will ask again later)
- `action: "prefer_not"` - Mark field as "prefer not to say" (won't ask again)
- `action: "unskip"` - Remove field from skipped list
- `action: "remove_prefer_not"` - Remove field from prefer_not list
- `action: "set_step"` - Save current completion step
- `action: "mark_complete"` - Mark profile as fully complete

---

## Quick Summary

| Category | Total | Documented | DB Ready | API Ready | Web Done | Mobile Done | Tested | Signed Off |
|----------|-------|------------|----------|-----------|----------|-------------|--------|------------|
| Profile Fields | 66 | 66 | 51 | 47 | 27 | 53 | 0 | 0 |
| Navigation | 3 | 1 | N/A | N/A | 1 | 2 | 0 | 0 |
| Auth Features | 8 | 0 | 8 | 8 | 4 | 4 | 0 | 0 |
| Core Features | 12 | 0 | TBD | TBD | TBD | TBD | 0 | 0 |

---

## Status Legend

| Symbol | Meaning |
|--------|---------|
| - | Not started |
| ... | In progress |
| X | Complete |
| BUG | Has known issues |
| N/A | Not applicable |

---

## Pipeline Stages

1. **Documented** - Best practices defined in `ui_patterns.md`
2. **DB Ready** - Column exists with correct type and constraints
3. **API Ready** - Endpoint supports read and write
4. **Web Done** - Implemented with correct UI pattern
5. **Mobile Done** - Implemented with native UI pattern (iOS + Android)
6. **Tested** - Cross-platform testing complete
7. **Signed Off** - Human QA approval

---

## 1. Profile Fields Integration Status

### User Account Fields

| Field | Documented | DB | API-R | API-W | Web-E | Web-D | iOS-E | iOS-D | And-E | And-D | Tested | Signed |
|-------|------------|----|----|----|----|----|----|----|----|----|----|-----|
| id | X | X | X | N/A | N/A | X | N/A | X | N/A | X | - | - |
| email | X | X | X | N/A | Reg | X | Reg | X | Reg | X | - | - |
| phone | - | X | X | X | - | - | X | X | X | X | - | - |
| phone_verified | - | X | - | - | - | - | - | - | - | - | - | - |
| display_name | - | X | X | X | Reg | X | X | X | X | X | - | - |
| status | - | X | X | Admin | N/A | - | N/A | - | N/A | - | - | - |
| role | - | X | X | Admin | N/A | - | N/A | - | N/A | - | - | - |
| points_balance | - | X | X | N/A | N/A | - | N/A | X | N/A | X | - | - |
| referral_code | - | X | X | N/A | N/A | - | N/A | X | N/A | X | - | - |

### Profile - Basic Info

| Field | Documented | DB | API-R | API-W | Web-E | Web-D | iOS-E | iOS-D | And-E | And-D | Tested | Signed |
|-------|------------|----|----|----|----|----|----|----|----|----|----|-----|
| first_name | X | X | X | X | X | X | X | X | X | X | - | - |
| last_name | X | X | X | X | X | X | X | X | X | X | - | - |
| date_of_birth | X | X | X | X | X | X | X | X | X | X | - | - |
| gender | X | X | X | X | X | X | X | X | X | X | - | - |
| looking_for | X | X | X | X | X | X | X | X | X | X | - | - |
| zodiac_sign | - | X | X | X | - | X | X | X | X | X | - | - |
| bio | X | X | X | X | X | X | X | X | X | X | - | - |

**Notes:**
- `gender` + `looking_for`: ~~Mobile combines into one dropdown~~ FIXED - Now separate fields in EditProfileForm

### Profile - Physical

| Field | Documented | DB | API-R | API-W | Web-E | Web-D | iOS-E | iOS-D | And-E | And-D | Tested | Signed |
|-------|------------|----|----|----|----|----|----|----|----|----|----|-----|
| height_inches | X | X | X | X | X | X | X | X | X | X | - | - |
| body_type | X | X | X | X | X | X | X | X | X | X | - | - |
| ethnicity | - | X | X | X | X | X | X | X | X | X | - | - |

**Notes:**
- `height_inches`: FIXED - Mobile uses two-column native picker (feet + inches), properly converts to total inches.
- `body_type`: FIXED - Mobile now single-select matching database constraint.
- `ethnicity`: FIXED - Now available on web and mobile, API uses correct field name.

### Profile - Location

| Field | Documented | DB | API-R | API-W | Web-E | Web-D | iOS-E | iOS-D | And-E | And-D | Tested | Signed |
|-------|------------|----|----|----|----|----|----|----|----|----|----|-----|
| city | X | X | X | X | X | X | X | X | X | X | - | - |
| state | X | X | X | X | X | X | X | X | X | X | - | - |
| country | X | X | X | X | X | X | X | X | X | X | - | - |
| latitude | - | X | X | X | - | - | - | - | - | - | - | - |
| longitude | - | X | X | X | - | - | - | - | - | - | - | - |
| zip_code | - | - | - | - | - | - | X | X | X | X | - | - |

**Notes:**
- `zip_code`: In mobile UI but not in database. Needs migration.
- Lat/long: Auto-populated from device, not manually editable.

### Profile - Lifestyle

| Field | Documented | DB | API-R | API-W | Web-E | Web-D | iOS-E | iOS-D | And-E | And-D | Tested | Signed |
|-------|------------|----|----|----|----|----|----|----|----|----|----|-----|
| religion | - | X | X | X | X | X | X | X | X | X | - | - |
| political_views | - | X | X | X | X | X | X | X | X | X | - | - |
| education | X | X | X | X | X | X | X | X | X | X | - | - |
| occupation | X | X | X | X | X | X | X | X | X | X | - | - |
| smoking | X | X | X | X | X | X | X | X | X | X | - | - |
| drinking | X | X | X | X | X | X | X | X | X | X | - | - |
| marijuana | - | X | X | X | X | X | X | X | X | X | - | - |
| exercise | - | X | X | X | X | X | X | X | X | X | - | - |
| marital_status | - | X | X | X | - | - | X | X | X | X | - | - |

**Notes:**
- `religion`: ~~Mobile uses multi-select but should be single.~~ FIXED - Now single-select
- `political_views`: ~~Missing from web. Mobile stores in wrong field.~~ FIXED - Now on web and mobile maps correctly
- `marijuana`: FIXED - Now available on web and API uses correct field name.
- `exercise`: FIXED - Now in DB, web, API, and mobile EditProfileForm
- `marital_status`: In mobile but not in DB. Needs migration.

### Profile - Family

| Field | Documented | DB | API-R | API-W | Web-E | Web-D | iOS-E | iOS-D | And-E | And-D | Tested | Signed |
|-------|------------|----|----|----|----|----|----|----|----|----|----|-----|
| has_kids | X | X | X | X | X | X | X | X | X | X | - | - |
| wants_kids | X | X | X | X | X | X | X | X | X | X | - | - |
| pets | - | X | X | X | - | - | X | X | X | X | - | - |

**Notes:**
- `pets`: FIXED - Mobile now uses multi-select chips matching DB array type.

### Profile - Personality/Interests

| Field | Documented | DB | API-R | API-W | Web-E | Web-D | iOS-E | iOS-D | And-E | And-D | Tested | Signed |
|-------|------------|----|----|----|----|----|----|----|----|----|----|-----|
| interests | X | X | X | X | X | X | X | X | X | X | - | - |
| looking_for_desc | - | X | - | - | X | X | - | - | - | - | - | - |

**Notes:**
- `interests`: Options differ between web and mobile. Needs standardization.
- `looking_for_description`: In DB and web but not in API or mobile.

### Profile - Verification & Media

| Field | Documented | DB | API-R | API-W | Web-E | Web-D | iOS-E | iOS-D | And-E | And-D | Tested | Signed |
|-------|------------|----|----|----|----|----|----|----|----|----|----|-----|
| is_verified | - | X | X | N/A | N/A | X | N/A | X | N/A | X | - | - |
| profile_image_url | X | X | X | X | X | X | X | X | X | X | - | - |
| verification_selfie | - | X | - | - | - | - | X | - | X | - | - | - |

### Profile - Prompts (Added in Migration 00005)

| Field | Documented | DB | API-R | API-W | Web-E | Web-D | iOS-E | iOS-D | And-E | And-D | Tested | Signed |
|-------|------------|----|----|----|----|----|----|----|----|----|----|-----|
| craziest_travel_story | - | X | X | X | - | - | X | X | X | X | - | - |
| way_to_heart | - | X | X | X | - | - | X | X | X | X | - | - |
| after_work (find_me) | - | X | X | X | - | - | X | X | X | X | - | - |
| non_negotiables | - | X | X | X | - | - | X | X | X | X | - | - |
| worst_job | - | X | X | X | - | - | X | X | X | X | - | - |
| weirdest_gift | - | X | X | X | - | - | X | X | X | X | - | - |
| past_event | - | X | X | X | - | - | X | X | X | X | - | - |
| ideal_first_date | - | X | X | X | - | - | X | X | X | X | - | - |
| nightclub_or_home | - | X | X | X | - | - | X | X | X | X | - | - |
| pet_peeves | - | X | X | X | - | - | X | X | X | X | - | - |
| dream_job | - | X | X | X | - | - | X | X | X | X | - | - |

**Note:** All prompt fields added in migration 00005. Web edit UI pending.

### Profile - Additional (Added in Migration 00005)

| Field | Documented | DB | API-R | API-W | Web-E | Web-D | iOS-E | iOS-D | And-E | And-D | Tested | Signed |
|-------|------------|----|----|----|----|----|----|----|----|----|----|-----|
| languages | - | X | X | X | X | X | X | X | X | X | - | - |
| schools | - | X | X | X | - | - | X | X | X | X | - | - |
| company | - | X | X | X | - | - | X | X | X | X | - | - |
| social_link_1 | - | X | X | X | - | - | X | X | X | X | - | - |
| social_link_2 | - | X | X | X | - | - | X | X | X | X | - | - |
| zip_code | - | X | X | X | - | - | X | X | X | X | - | - |

**Note:** All additional fields added in migration 00005.

---

## 2. Navigation Components

| Component | Documented | Web | iOS | Android | Tested | Signed |
|-----------|------------|-----|-----|---------|--------|--------|
| Bottom Tab Bar | X | X | X | X | - | - |
| Header/Top Nav | - | X | ... | ... | - | - |
| Side Menu | - | ... | - | - | - | - |

**Notes:**
- ~~Bottom tab bar on mobile needs to be native-style (not current implementation).~~ IMPLEMENTED
- iOS uses UITabBarController via Expo Router NativeTabs (supports Liquid Glass on iOS 26+)
- Android uses BottomNavigationView via Expo Router NativeTabs (Material Design 3)
- Web uses custom BottomNavigation component matching native app tabs

---

## 3. Authentication Features

| Feature | Documented | DB | API | Web | iOS | Android | Tested | Signed |
|---------|------------|----|----|-----|-----|---------|--------|--------|
| Email Registration | - | X | X | X | X | X | - | - |
| Email Login | - | X | X | X | X | X | - | - |
| Social Login (Google) | - | X | X | - | X | X | - | - |
| Social Login (Apple) | - | X | X | - | X | X | - | - |
| Forgot Password | - | X | X | X | X | X | - | - |
| Change Password | - | X | X | - | X | X | - | - |
| Phone Verification | - | X | X | - | - | - | - | - |
| Logout | - | X | X | X | X | X | - | - |

---

## 4. Core Features

| Feature | Documented | DB | API | Web | iOS | Android | Tested | Signed |
|---------|------------|----|----|-----|-----|---------|--------|--------|
| View Own Profile | - | X | X | X | X | X | - | - |
| Edit Profile | - | X | X | X | X | X | - | - |
| View Other Profiles | - | X | X | X | X | X | - | - |
| Discover/Browse | - | X | X | X | X | X | - | - |
| Like/Pass/Super Like | - | X | X | - | X | X | - | - |
| View Matches | - | X | X | X | X | X | - | - |
| Favorites | - | X | X | X | X | X | - | - |
| Block User | - | X | X | - | X | X | - | - |
| Report User | - | X | X | - | X | X | - | - |
| Chat | - | X | X | - | X | X | - | - |
| Video Call | - | X | X | - | X | X | - | - |
| Voice Call | - | X | X | - | X | X | - | - |

---

## 5. Signup Flow

| Step | Required | Documented | Web | iOS | Android | Tested | Signed |
|------|----------|------------|-----|-----|---------|--------|--------|
| Email + Password | Yes | - | X | X | X | - | - |
| Display Name | No | - | X | X | X | - | - |
| First Name | Yes | - | - | X | X | - | - |
| Last Name | No | - | - | X | X | - | - |
| Date of Birth | Yes | - | - | X | X | - | - |
| Gender | Yes | - | - | X | X | - | - |
| Looking For | Yes | - | - | X | X | - | - |
| Profile Photo | No | - | - | X | X | - | - |
| Location | No | - | - | X | X | - | - |
| Height | No | - | - | X | X | - | - |
| Body Type | No | - | - | X | X | - | - |
| Interests | No | - | - | X | X | - | - |
| Bio | No | - | - | X | X | - | - |
| Additional Fields | No | - | - | X | X | - | - |

**Notes:**
- Web signup only collects email/password/display_name, then redirects to profile edit.
- Mobile signup collects many fields but some don't save properly.
- Need to align: either web collects more during signup, or both use progressive profile completion.

---

## 6. Priority Action Items

### Critical (Blocking Issues)

1. ~~**Height Bug**~~ - FIXED: Mobile now uses two-column picker with proper conversion
2. ~~**Gender/Looking For Bug**~~ - FIXED: Now separate fields on mobile (Gender + Looking For)
3. ~~**Missing DB Fields**~~ - FIXED: Migration 00005 added all missing fields

### High Priority (Major Inconsistencies)

4. ~~**Missing Web Fields**~~ - FIXED: ethnicity, marijuana now on web
5. ~~**API Field Typos**~~ - FIXED: All legacy misspellings removed (Ethnicity, Marijuana)
6. ~~**Options Standardization**~~ - FIXED: All signup and profile edit forms now use standardized options from `constants/options.ts`
7. ~~**Bottom Navigation**~~ - IMPLEMENTED: Native tabs using Expo Router NativeTabs (UITabBarController/BottomNavigationView)

### Medium Priority (Polish)

8. ~~**Height UI**~~ - FIXED: Mobile uses native two-column picker, web uses dropdowns
9. ~~**Single vs Multi-Select**~~ - FIXED: body_type and religion now single-select, pets now multi-select chips
10. ~~**Exercise Field**~~ - FIXED: Now available in API and mobile EditProfileForm
11. ~~**Looking For Description**~~ - Already in API and mobile (mapped to IdeaDate field)

### Low Priority (Enhancements)

12. ~~**Progressive Signup**~~ - IMPLEMENTED: New `/api/profile/completion` endpoint handles all logic server-side
13. ~~**"Prefer Not to Say"~~ - IMPLEMENTED: Added to all sensitive fields (ethnicity, religion, political_views, marital_status, has_kids, wants_kids, marijuana)
14. ~~**Skip Tracking**~~ - IMPLEMENTED: Server tracks `profile_completion_skipped` and `profile_completion_prefer_not` arrays

---

## 7. Testing Checklist Template

For each field/feature, complete this testing checklist:

### [Field/Feature Name] Testing

**Web:**
- [ ] Can view (display works)
- [ ] Can edit (input works)
- [ ] Saves correctly (API call succeeds)
- [ ] Value persists (reload shows saved value)
- [ ] Validation works (invalid input rejected)

**iOS:**
- [ ] Can view (display works)
- [ ] Can edit (native picker/input works)
- [ ] Saves correctly (API call succeeds)
- [ ] Value persists (reload shows saved value)
- [ ] Validation works

**Android:**
- [ ] Can view (display works)
- [ ] Can edit (native picker/input works)
- [ ] Saves correctly (API call succeeds)
- [ ] Value persists (reload shows saved value)
- [ ] Validation works

**Cross-Platform:**
- [ ] Value saved on web shows correctly on mobile
- [ ] Value saved on mobile shows correctly on web
- [ ] Data format matches across platforms

**Sign Off:**
- [ ] Web QA approved: _____________ (date/initials)
- [ ] iOS QA approved: _____________ (date/initials)
- [ ] Android QA approved: _____________ (date/initials)

---

## 8. Migration Tracking

### Completed Migrations

| Migration | Description | Date |
|-----------|-------------|------|
| 00001_initial_schema.sql | Core tables | Done |
| 00002_rls_policies.sql | Row-level security | Done |
| 00003_promote_admin.sql | Admin promotion | Done |
| 00004_storage_policies.sql | Storage buckets | Done |

### Pending Migrations

| Migration | Description | Status |
|-----------|-------------|--------|
| 00005_expand_profile_fields.sql | Add missing profile fields | ✅ Complete |

All fields have been added in migration 00005:
- marital_status, language, school, company, zip_code
- social_link_1, social_link_2
- All prompt fields (craziest_thing, way_to_heart, etc.)
- Verification tiers (verification_tier, government_id_verified, live_photo_verified)

---

## Document Links

- **Data Inventory:** [data_inventory.md](./data_inventory.md) - Complete field definitions
- **UI Patterns:** [ui_patterns.md](./ui_patterns.md) - Native UI patterns by platform
- **Original Requirements:** [project_requirements.md](./project_requirements.md) - Initial spec
- **Initial Analysis:** [initial_analysis.md](./initial_analysis.md) - Original state before rebuild
