# RealSingles - Master Data Inventory

**Last Updated:** January 23, 2026  
**Purpose:** Complete inventory of every data point in the system across Database, API, Web, iOS, and Android.

---

## Quick Reference

| Category | Total Fields | In DB | In API | In Web | In Mobile | Fully Integrated |
|----------|-------------|-------|--------|--------|-----------|------------------|
| User Account | 14 | 14 | 12 | 4 | 6 | 4 |
| Profile - Basic | 7 | 7 | 7 | 6 | 7 | 5 |
| Profile - Physical | 3 | 3 | 3 | 2 | 3 | 1 |
| Profile - Location | 6 | 6 | 6 | 3 | 4 | 3 |
| Profile - Lifestyle | 9 | 8 | 8 | 6 | 8 | 4 |
| Profile - Family | 3 | 3 | 3 | 2 | 3 | 2 |
| Profile - Personality | 4 | 4 | 4 | 3 | 4 | 2 |
| Profile - Verification | 4 | 4 | 2 | 0 | 2 | 0 |
| Profile - Media | 2 | 2 | 2 | 1 | 2 | 1 |
| Profile - Prompts | 8 | 0 | 0 | 0 | 8 | 0 |
| Profile - Additional | 6 | 0 | 0 | 0 | 6 | 0 |
| **TOTAL** | **66** | **51** | **47** | **27** | **53** | **22** |

---

## Legend

**Status Codes:**
- DB: Database column exists
- API-R: API returns this field (GET)
- API-W: API accepts this field (PUT/POST)
- Web-E: Web UI allows editing
- Web-D: Web UI displays this field
- iOS-E: iOS UI allows editing
- iOS-D: iOS UI displays this field
- And-E: Android UI allows editing
- And-D: Android UI displays this field

**Integration Status:**
- `FULL` - Exists and works in all layers
- `PARTIAL` - Exists in some layers, missing in others
- `BUG` - Exists but has known issues
- `MISSING-DB` - Not in database
- `MISSING-API` - Not in API
- `MISSING-WEB` - Not in web UI
- `MISSING-MOBILE` - Not in mobile UI

---

## 1. User Account Fields

### 1.1 id
- **Purpose:** Unique user identifier
- **DB Column:** `users.id`
- **DB Type:** UUID
- **API Field:** `id`, `ID`
- **Editable:** No (system-generated)
- **Status:** `FULL`

| Layer | Status |
|-------|--------|
| DB | Yes |
| API-R | Yes |
| API-W | No (read-only) |
| Web-E | N/A |
| Web-D | Yes (internal) |
| iOS-E | N/A |
| iOS-D | Yes (internal) |

---

### 1.2 email
- **Purpose:** User's email address for login
- **DB Column:** `users.email`
- **DB Type:** TEXT UNIQUE NOT NULL
- **API Field:** `Email`
- **Editable:** No (set at registration)
- **Status:** `FULL`

| Layer | Status |
|-------|--------|
| DB | Yes |
| API-R | Yes |
| API-W | No |
| Web-E | Registration only |
| Web-D | Settings |
| iOS-E | Registration only |
| iOS-D | Settings |

---

### 1.3 phone
- **Purpose:** User's phone number
- **DB Column:** `users.phone`
- **DB Type:** TEXT
- **API Field:** `Phone`
- **Editable:** Yes
- **Validation:** Phone number format
- **Status:** `PARTIAL` - Not editable on web

| Layer | Status |
|-------|--------|
| DB | Yes |
| API-R | Yes |
| API-W | Yes |
| Web-E | **NO** |
| Web-D | No |
| iOS-E | Yes |
| iOS-D | Yes |

---

### 1.4 phone_verified
- **Purpose:** Whether phone has been verified
- **DB Column:** `users.phone_verified`
- **DB Type:** BOOLEAN DEFAULT FALSE
- **API Field:** N/A (internal)
- **Editable:** No (system-managed)
- **Status:** `PARTIAL` - Not exposed in API

| Layer | Status |
|-------|--------|
| DB | Yes |
| API-R | No |
| API-W | No |
| Web-E | N/A |
| Web-D | No |
| iOS-E | N/A |
| iOS-D | No |

---

### 1.5 display_name
- **Purpose:** User's chosen display name
- **DB Column:** `users.display_name`
- **DB Type:** TEXT
- **API Field:** `DisplayName`
- **Editable:** Yes
- **Status:** `PARTIAL` - Missing from web edit

| Layer | Status |
|-------|--------|
| DB | Yes |
| API-R | Yes |
| API-W | Yes |
| Web-E | **NO** (only at registration) |
| Web-D | Yes |
| iOS-E | Yes |
| iOS-D | Yes |

---

### 1.6 created_at
- **Purpose:** Account creation timestamp
- **DB Column:** `users.created_at`
- **DB Type:** TIMESTAMPTZ DEFAULT NOW()
- **API Field:** N/A
- **Editable:** No (system-generated)
- **Status:** `FULL` (read-only)

---

### 1.7 updated_at
- **Purpose:** Last account update timestamp
- **DB Column:** `users.updated_at`
- **DB Type:** TIMESTAMPTZ DEFAULT NOW()
- **API Field:** N/A
- **Editable:** No (system-managed via trigger)
- **Status:** `FULL` (read-only)

---

### 1.8 last_active_at
- **Purpose:** Last activity timestamp
- **DB Column:** `users.last_active_at`
- **DB Type:** TIMESTAMPTZ
- **API Field:** N/A
- **Editable:** No (system-managed)
- **Status:** `PARTIAL` - Not being updated

---

### 1.9 status
- **Purpose:** Account status
- **DB Column:** `users.status`
- **DB Type:** TEXT CHECK (status IN ('active', 'suspended', 'deleted')) DEFAULT 'active'
- **API Field:** `status`
- **Editable:** Admin only
- **Options:** active, suspended, deleted
- **Status:** `FULL`

---

### 1.10 role
- **Purpose:** User role for permissions
- **DB Column:** `users.role`
- **DB Type:** TEXT CHECK (role IN ('user', 'admin', 'moderator')) DEFAULT 'user'
- **API Field:** `role`
- **Editable:** Admin only
- **Options:** user, admin, moderator
- **Status:** `FULL`

---

### 1.11 agora_user_id
- **Purpose:** Agora Chat user identifier
- **DB Column:** `users.agora_user_id`
- **DB Type:** TEXT
- **API Field:** N/A (internal)
- **Editable:** No (system-managed)
- **Status:** `PARTIAL` - Not fully implemented

---

### 1.12 points_balance
- **Purpose:** Reward points balance
- **DB Column:** `users.points_balance`
- **DB Type:** INTEGER DEFAULT 0
- **API Field:** `WalletPoint`, `ReedemPoints`
- **Editable:** No (system-managed via transactions)
- **Status:** `FULL`

---

### 1.13 referral_code
- **Purpose:** User's unique referral code
- **DB Column:** `users.referral_code`
- **DB Type:** TEXT UNIQUE
- **API Field:** `RefferalCode`
- **Editable:** No (system-generated)
- **Status:** `FULL`

---

### 1.14 referred_by
- **Purpose:** Who referred this user
- **DB Column:** `users.referred_by`
- **DB Type:** UUID REFERENCES users(id)
- **API Field:** N/A
- **Editable:** Registration only
- **Status:** `FULL`

---

## 2. Profile - Basic Info

### 2.1 first_name
- **Purpose:** User's first name
- **DB Column:** `profiles.first_name`
- **DB Type:** TEXT
- **API Field:** `FirstName`
- **Editable:** Yes
- **Required:** Yes (essential)
- **Status:** `FULL`

| Layer | Status |
|-------|--------|
| DB | Yes |
| API-R | Yes |
| API-W | Yes |
| Web-E | Yes |
| Web-D | Yes |
| iOS-E | Yes |
| iOS-D | Yes |

---

### 2.2 last_name
- **Purpose:** User's last name
- **DB Column:** `profiles.last_name`
- **DB Type:** TEXT
- **API Field:** `LastName`
- **Editable:** Yes
- **Required:** No
- **Status:** `FULL`

| Layer | Status |
|-------|--------|
| DB | Yes |
| API-R | Yes |
| API-W | Yes |
| Web-E | Yes |
| Web-D | Yes |
| iOS-E | Yes |
| iOS-D | Yes |

---

### 2.3 date_of_birth
- **Purpose:** User's birthdate (for age calculation)
- **DB Column:** `profiles.date_of_birth`
- **DB Type:** DATE
- **API Field:** `DOB`
- **Editable:** Yes
- **Required:** Yes (for matching)
- **Validation:** Must be 18+ years old
- **Status:** `FULL`

| Layer | Status |
|-------|--------|
| DB | Yes |
| API-R | Yes |
| API-W | Yes |
| Web-E | Yes (date input) |
| Web-D | Yes (age shown) |
| iOS-E | Yes (date picker) |
| iOS-D | Yes |

**UI Pattern Note:** Web uses HTML date input, Mobile uses native DateTimePicker. Both work correctly.

---

### 2.4 gender
- **Purpose:** User's gender
- **DB Column:** `profiles.gender`
- **DB Type:** TEXT CHECK (gender IN ('male', 'female', 'non-binary', 'other'))
- **API Field:** `Gender`
- **Editable:** Yes
- **Options:**
  | Value | Display |
  |-------|---------|
  | male | Male |
  | female | Female |
  | non-binary | Non-Binary |
  | other | Other |
- **Status:** `BUG` - Mobile combines with looking_for

| Layer | Status | Notes |
|-------|--------|-------|
| DB | Yes | |
| API-R | Yes | |
| API-W | Yes | |
| Web-E | Yes (dropdown) | |
| Web-D | Yes | |
| iOS-E | Yes | **BUG: Combined dropdown "I'm a man seeking a woman"** |
| iOS-D | Yes | |

---

### 2.5 looking_for
- **Purpose:** Gender(s) user is interested in
- **DB Column:** `profiles.looking_for`
- **DB Type:** TEXT[]
- **API Field:** Part of `Gender` on mobile (bug)
- **Editable:** Yes
- **Options:** Same as gender (male, female, non-binary, other)
- **Status:** `BUG` - Mobile doesn't properly separate from gender

| Layer | Status | Notes |
|-------|--------|-------|
| DB | Yes (array) | |
| API-R | Partial | |
| API-W | Partial | |
| Web-E | Yes (multi-select chips) | |
| Web-D | Yes | |
| iOS-E | **NO** (combined with gender) | **BUG** |
| iOS-D | No | |

---

### 2.6 zodiac_sign
- **Purpose:** Astrological sign
- **DB Column:** `profiles.zodiac_sign`
- **DB Type:** TEXT
- **API Field:** `HSign`
- **Editable:** Yes
- **Options:**
  | Value | Display |
  |-------|---------|
  | aries | Aries |
  | taurus | Taurus |
  | gemini | Gemini |
  | cancer | Cancer |
  | leo | Leo |
  | virgo | Virgo |
  | libra | Libra |
  | scorpio | Scorpio |
  | sagittarius | Sagittarius |
  | capricorn | Capricorn |
  | aquarius | Aquarius |
  | pisces | Pisces |
- **Status:** `PARTIAL` - Missing from web edit

| Layer | Status |
|-------|--------|
| DB | Yes |
| API-R | Yes |
| API-W | Yes |
| Web-E | **NO** |
| Web-D | Yes |
| iOS-E | Yes (text input - should be picker) |
| iOS-D | Yes |

---

### 2.7 bio
- **Purpose:** User's about me text
- **DB Column:** `profiles.bio`
- **DB Type:** TEXT
- **API Field:** `About`
- **Editable:** Yes
- **Validation:** Max 500 characters (suggested)
- **Status:** `FULL`

| Layer | Status |
|-------|--------|
| DB | Yes |
| API-R | Yes |
| API-W | Yes |
| Web-E | Yes (textarea) |
| Web-D | Yes |
| iOS-E | Yes (textarea, 300 char limit) |
| iOS-D | Yes |

---

## 3. Profile - Physical Attributes

### 3.1 height_inches
- **Purpose:** User's height in inches
- **DB Column:** `profiles.height_inches`
- **DB Type:** INTEGER
- **API Field:** `Height` (also `HeightFeet` + `HeightInches` on load)
- **Editable:** Yes
- **Validation:** 48-96 inches (4ft - 8ft)
- **Status:** `FIXED` - Mobile conversion issue resolved

| Layer | Status | Notes |
|-------|--------|-------|
| DB | Yes (inches) | |
| API-R | Yes (as string) | |
| API-W | Yes (parses to int) | |
| Web-E | Yes (two dropdowns: feet + inches) | FIXED |
| Web-D | Yes (converted to X'Y") | |
| iOS-E | Yes (two-column wheel picker) | FIXED - uses `@react-native-picker/picker` |
| iOS-D | Yes (shows as X'Y") | FIXED |

**Implementation:** 
- Web: Two side-by-side `<select>` dropdowns (feet 4-7, inches 0-11)
- iOS: Two-column wheel picker using `@react-native-picker/picker`
- Android: Same picker automatically renders as Material Design spinners
- Conversion: `(feet * 12) + inches` on save, reverse on load
- Android: Two dropdown spinners
- Conversion: (feet * 12) + inches on save, reverse on load

---

### 3.2 body_type
- **Purpose:** User's body type
- **DB Column:** `profiles.body_type`
- **DB Type:** TEXT CHECK (needs update to include all options)
- **API Field:** `BodyType`
- **Editable:** Yes
- **Options (per business logic - expanded):**
  | Value | Display |
  |-------|---------|
  | slim | Slim/Slender |
  | athletic | Athletic/Fit |
  | average | Average |
  | muscular | Muscular |
  | curvy | Curvy |
  | plus_size | A few extra pounds |
- **Status:** `PARTIAL` - Mobile allows multiple (should be single select)

| Layer | Status | Notes |
|-------|--------|-------|
| DB | Yes (single value) | |
| API-R | Yes | |
| API-W | Yes | |
| Web-E | Yes (dropdown) | |
| Web-D | Yes | |
| iOS-E | Yes (multi-select chips) | **INCONSISTENT**: Should be single select |
| iOS-D | Yes | |

---

### 3.3 ethnicity
- **Purpose:** User's ethnicity
- **DB Column:** `profiles.ethnicity`
- **DB Type:** TEXT[] (array - per user decision for mixed heritage)
- **API Field:** `Ethnicity` (FIXED - legacy typo removed)
- **Editable:** Yes
- **Options (per business logic):**
  | Value | Display |
  |-------|---------|
  | white | White/Caucasian |
  | latino | Latino/Hispanic |
  | black | Black/African American |
  | asian | Asian |
  | native_american | Native American |
  | east_indian | East Indian |
  | pacific_islander | Pacific Islander |
  | middle_eastern | Middle Eastern |
  | armenian | Armenian |
  | mixed | Mixed/Multi-racial |
  | other | Other |
  | prefer_not_to_say | Prefer not to say |
- **Status:** `NEEDS-UPDATE` - Change to array, fix API typo, add to web

| Layer | Status | Notes |
|-------|--------|-------|
| DB | Yes (change to TEXT[]) | |
| API-R | Yes | Fix field name: `Ethnicity` |
| API-W | Yes | Fix field name: `Ethnicity` |
| Web-E | **NO** | |
| Web-D | **NO** | |
| iOS-E | Yes (multi-select chips) | |
| iOS-D | Yes | |

---

## 4. Profile - Location

### 4.1 city
- **Purpose:** User's city
- **DB Column:** `profiles.city`
- **DB Type:** TEXT
- **API Field:** `City`
- **Editable:** Yes
- **Status:** `FULL`

| Layer | Status |
|-------|--------|
| DB | Yes |
| API-R | Yes |
| API-W | Yes |
| Web-E | Yes (text input) |
| Web-D | Yes |
| iOS-E | Yes |
| iOS-D | Yes |

**Future Enhancement:** Autocomplete/location picker

---

### 4.2 state
- **Purpose:** User's state/province
- **DB Column:** `profiles.state`
- **DB Type:** TEXT
- **API Field:** `State`
- **Editable:** Yes
- **Status:** `FULL`

| Layer | Status |
|-------|--------|
| DB | Yes |
| API-R | Yes |
| API-W | Yes |
| Web-E | Yes (text input) |
| Web-D | Yes |
| iOS-E | Yes |
| iOS-D | Yes |

---

### 4.3 country
- **Purpose:** User's country
- **DB Column:** `profiles.country`
- **DB Type:** TEXT
- **API Field:** `Country`
- **Editable:** Yes
- **Status:** `PARTIAL` - Mobile signup sets to null

| Layer | Status | Notes |
|-------|--------|-------|
| DB | Yes | |
| API-R | Yes | |
| API-W | Yes | |
| Web-E | Yes (text input) | |
| Web-D | Yes | |
| iOS-E | Yes | |
| iOS-D | Yes | |
| **Signup** | **BUG** | Mobile sets to null even when city/state collected |

---

### 4.4 latitude
- **Purpose:** User's latitude for distance calculations
- **DB Column:** `profiles.latitude`
- **DB Type:** DECIMAL(10, 8)
- **API Field:** `Latitude`
- **Editable:** Yes (via location services)
- **Status:** `PARTIAL` - Not editable in UI (auto from location)

| Layer | Status |
|-------|--------|
| DB | Yes |
| API-R | Yes (as string) |
| API-W | Yes |
| Web-E | No (auto) |
| Web-D | No |
| iOS-E | No (auto from location) |
| iOS-D | No |

---

### 4.5 longitude
- **Purpose:** User's longitude for distance calculations
- **DB Column:** `profiles.longitude`
- **DB Type:** DECIMAL(11, 8)
- **API Field:** `Longitude`
- **Editable:** Yes (via location services)
- **Status:** `PARTIAL` - Same as latitude

---

### 4.6 location (PostGIS)
- **Purpose:** Geographic point for efficient distance queries
- **DB Column:** `profiles.location`
- **DB Type:** GEOGRAPHY(POINT, 4326)
- **API Field:** N/A (auto-generated from lat/long)
- **Editable:** No (trigger-managed)
- **Status:** `FULL` (internal)

---

## 5. Profile - Lifestyle

### 5.1 religion
- **Purpose:** User's religion
- **DB Column:** `profiles.religion`
- **DB Type:** TEXT (single select - per user decision)
- **API Field:** `Religion`
- **Editable:** Yes
- **Options (per business logic):**
  | Value | Display |
  |-------|---------|
  | adventist | Adventist |
  | agnostic | Agnostic |
  | atheist | Atheist |
  | buddhist | Buddhist |
  | catholic | Catholic |
  | christian | Christian/LDS/Protestant |
  | hindu | Hindu |
  | jewish | Jewish |
  | muslim | Muslim/Islam |
  | spiritual | Spiritual but not religious |
  | other | Other |
  | prefer_not_to_say | Prefer not to say |
- **Status:** `NEEDS-UPDATE` - Mobile should be single select dropdown

| Layer | Status | Notes |
|-------|--------|-------|
| DB | Yes (TEXT - single) | |
| API-R | Yes | |
| API-W | Yes | |
| Web-E | Yes (**change to dropdown**) | |
| Web-D | Yes | |
| iOS-E | Yes (**change to single select**) | |
| iOS-D | Yes | |

---

### 5.2 political_views
- **Purpose:** User's political views
- **DB Column:** `profiles.political_views`
- **DB Type:** TEXT
- **API Field:** `Political`
- **Editable:** Yes
- **Options (per business logic):**
  | Value | Display |
  |-------|---------|
  | no_answer | No answer |
  | undecided | Undecided |
  | conservative | Conservative |
  | liberal | Liberal |
  | libertarian | Libertarian |
  | moderate | Moderate |
  | prefer_not_to_say | Prefer not to say |
- **Status:** `NEEDS-UPDATE` - Missing from web, mobile stores in wrong field

| Layer | Status | Notes |
|-------|--------|-------|
| DB | Yes | |
| API-R | Yes | |
| API-W | Yes | |
| Web-E | **NO** | |
| Web-D | **NO** | |
| iOS-E | Yes (**BUG: stored in NightAtHome field**) | |
| iOS-D | Yes | |

---

### 5.3 education
- **Purpose:** Education level
- **DB Column:** `profiles.education`
- **DB Type:** TEXT
- **API Field:** `Education`
- **Editable:** Yes
- **Options (per business logic):**
  | Value | Display |
  |-------|---------|
  | high_school | High School |
  | some_college | Some College |
  | associate | Associate Degree |
  | bachelor | Bachelor's Degree |
  | graduate | Graduate Degree |
  | phd | PhD/Post-doctoral |
- **Status:** `NEEDS-UPDATE` - Web should use dropdown not text input

| Layer | Status |
|-------|--------|
| DB | Yes |
| API-R | Yes |
| API-W | Yes |
| Web-E | Yes (text input - **should be dropdown**) |
| Web-D | Yes |
| iOS-E | Yes (dropdown) |
| iOS-D | Yes |

---

### 5.4 occupation
- **Purpose:** User's job/occupation
- **DB Column:** `profiles.occupation`
- **DB Type:** TEXT
- **API Field:** `JobTitle`
- **Editable:** Yes
- **Status:** `FULL`

| Layer | Status | Notes |
|-------|--------|-------|
| DB | Yes (`occupation`) | |
| API-R | Yes (`JobTitle`) | Different name |
| API-W | Yes (`JobTitle`) | Different name |
| Web-E | Yes (text, labeled "Occupation") | |
| Web-D | Yes | |
| iOS-E | Yes (text, labeled "Job Title") | |
| iOS-D | Yes | |

---

### 5.5 smoking
- **Purpose:** Smoking habits
- **DB Column:** `profiles.smoking`
- **DB Type:** TEXT CHECK (needs update for new options)
- **API Field:** `Smoking`
- **Editable:** Yes
- **Options (per business logic - expanded):**
  | Value | Display |
  |-------|---------|
  | no | No |
  | occasionally | Yes (Occasionally) |
  | daily | Yes (Daily) |
  | trying_to_quit | Trying to quit |
- **Status:** `NEEDS-UPDATE` - DB constraint needs updating

| Layer | Status |
|-------|--------|
| DB | Yes |
| API-R | Yes |
| API-W | Yes |
| Web-E | Yes (dropdown) |
| Web-D | Yes |
| iOS-E | Yes (dropdown) |
| iOS-D | Yes |

---

### 5.6 drinking
- **Purpose:** Drinking habits
- **DB Column:** `profiles.drinking`
- **DB Type:** TEXT CHECK (needs update for new options)
- **API Field:** `Drinks`
- **Editable:** Yes
- **Options (per business logic - expanded):**
  | Value | Display |
  |-------|---------|
  | never | Never |
  | social | Social |
  | moderate | Moderately |
  | regular | Regular |
- **Status:** `NEEDS-UPDATE` - DB constraint and API field name mismatch

| Layer | Status | Notes |
|-------|--------|-------|
| DB | Yes (`drinking`) | |
| API-R | Yes (`Drinks`) | Different name |
| API-W | Yes (`Drinks`) | Different name |
| Web-E | Yes (dropdown) | |
| Web-D | Yes | |
| iOS-E | Yes (dropdown) | |
| iOS-D | Yes | |

---

### 5.7 marijuana
- **Purpose:** Marijuana use
- **DB Column:** `profiles.marijuana`
- **DB Type:** TEXT CHECK (marijuana IN ('no', 'occasionally', 'yes'))
- **API Field:** `Marijuana` (FIXED - legacy typo removed)
- **Editable:** Yes
- **Options:**
  | Value | Display |
  |-------|---------|
  | never | Never |
  | occasionally | Occasionally |
  | regularly | Regularly |
- **Status:** `PARTIAL` - Missing from web, API typo

| Layer | Status | Notes |
|-------|--------|-------|
| DB | Yes | |
| API-R | Yes | Field name: `Marijuana` (FIXED) |
| API-W | Yes | Field name: `Marijuana` (FIXED) |
| Web-E | Yes | Added with standardized options |
| Web-D | **NO** | |
| iOS-E | Yes (dropdown) | |
| iOS-D | Yes | |

---

### 5.8 exercise
- **Purpose:** Exercise frequency
- **DB Column:** `profiles.exercise`
- **DB Type:** TEXT CHECK (exercise IN ('never', 'sometimes', 'regularly', 'daily'))
- **API Field:** N/A (not in API)
- **Editable:** Yes
- **Options:**
  | Value | Display |
  |-------|---------|
  | never | Never |
  | sometimes | Sometimes |
  | regularly | Regularly |
  | daily | Daily |
- **Status:** `PARTIAL` - Missing from API

| Layer | Status | Notes |
|-------|--------|-------|
| DB | Yes | |
| API-R | **NO** | |
| API-W | **NO** | |
| Web-E | Yes (dropdown) | |
| Web-D | Yes | |
| iOS-E | **NO** | |
| iOS-D | **NO** | |

---

### 5.9 marital_status
- **Purpose:** User's marital status
- **DB Column:** **MISSING**
- **DB Type:** Needed: TEXT
- **API Field:** N/A
- **Editable:** Yes
- **Options (per business logic):**
  | Value | Display |
  |-------|---------|
  | never_married | Never Married |
  | separated | Currently Separated |
  | divorced | Divorced |
  | widowed | Widow/Widower |
- **Status:** `MISSING-DB` - In mobile UI only

| Layer | Status |
|-------|--------|
| DB | **NO** |
| API-R | **NO** |
| API-W | **NO** |
| Web-E | **NO** |
| Web-D | **NO** |
| iOS-E | Yes (dropdown) |
| iOS-D | Yes |

**Action Required:** Add to database and API

---

## 6. Profile - Family

### 6.1 has_kids
- **Purpose:** Whether user has children and their living situation
- **DB Column:** `profiles.has_kids`
- **DB Type:** TEXT (needs change from BOOLEAN for richer data)
- **API Field:** `HaveChild`
- **Editable:** Yes
- **Options (per business logic - expanded from boolean):**
  | Value | Display |
  |-------|---------|
  | no | No |
  | yes_live_at_home | Yes (Live at home) |
  | yes_live_away | Yes (Live away) |
- **Status:** `NEEDS-UPDATE` - Should be TEXT not BOOLEAN for richer options

| Layer | Status | Notes |
|-------|--------|-------|
| DB | Yes (BOOLEAN - needs change to TEXT) | |
| API-R | Yes | Returns "Yes"/"No" string |
| API-W | Yes | Accepts "Yes"/true |
| Web-E | Yes (checkbox - needs change to dropdown) | |
| Web-D | Yes | |
| iOS-E | Yes (dropdown) | |
| iOS-D | Yes | |

**Action Required:** Change DB type from BOOLEAN to TEXT with proper options

---

### 6.2 wants_kids
- **Purpose:** Whether user wants children in future
- **DB Column:** `profiles.wants_kids`
- **DB Type:** TEXT CHECK (needs update for business logic options)
- **API Field:** `WantChild`
- **Editable:** Yes
- **Options (per business logic - expanded):**
  | Value | Display |
  |-------|---------|
  | no | No |
  | definitely | Definitely |
  | someday | Someday |
  | ok_if_partner_has | No (but OK if partner has) |
- **Status:** `NEEDS-UPDATE` - Options differ from business logic

| Layer | Status |
|-------|--------|
| DB | Yes |
| API-R | Yes |
| API-W | Yes |
| Web-E | Yes (dropdown) |
| Web-D | Yes |
| iOS-E | Yes (dropdown) |
| iOS-D | Yes |

---

### 6.3 pets
- **Purpose:** User's pets
- **DB Column:** `profiles.pets`
- **DB Type:** TEXT[] (array for multiple pets)
- **API Field:** `Pets`
- **Editable:** Yes
- **Options (per business logic - simpler list):**
  | Value | Display |
  |-------|---------|
  | none | None |
  | cat | Cat |
  | dog | Dog |
  | other | Other |
- **Decision:** Keep as array (people can have both cat and dog)
- **Status:** `PARTIAL` - Missing from web

| Layer | Status | Notes |
|-------|--------|-------|
| DB | Yes (array) | |
| API-R | Yes (comma-separated string) | |
| API-W | Yes (comma-separated string) | |
| Web-E | **NO** | |
| Web-D | **NO** | |
| iOS-E | Yes (should be multi-select chips) | |
| iOS-D | Yes | |

---

## 7. Profile - Personality/Interests

### 7.1 interests
- **Purpose:** User's interests/hobbies
- **DB Column:** `profiles.interests`
- **DB Type:** TEXT[]
- **API Field:** `Interest`
- **Editable:** Yes
- **Options (merged from business logic + current - needs standardization):**
  - Per Business Logic: Dining out, Sports, Museums/Art, Music, Gardening, Basketball, Dancing, Travel
  - Current Web (21): Travel, Music, Movies, Reading, Fitness, Cooking, Photography, Art, Gaming, Sports, Dancing, Hiking, Yoga, Wine, Coffee, Dogs, Cats, Fashion, Technology, Nature, Beach, Mountains
  - **DECISION NEEDED:** Merge all into single comprehensive list
- **Status:** `NEEDS-STANDARDIZATION` - Options differ between platforms

| Layer | Status | Notes |
|-------|--------|-------|
| DB | Yes (array) | |
| API-R | Yes (comma-separated string - **should be array**) | |
| API-W | Yes (comma-separated string - **should be array**) | |
| Web-E | Yes (multi-select chips) | |
| Web-D | Yes | |
| iOS-E | Yes (multi-select chips) | Different options |
| iOS-D | Yes | |

**Action Required:** Standardize options across all platforms and return as array in API.

---

### 7.2 looking_for_description
- **Purpose:** What user is looking for in a partner
- **DB Column:** `profiles.looking_for_description`
- **DB Type:** TEXT
- **API Field:** N/A (not in API)
- **Editable:** Yes
- **Status:** `PARTIAL` - Missing from API

| Layer | Status |
|-------|--------|
| DB | Yes |
| API-R | **NO** |
| API-W | **NO** |
| Web-E | Yes (textarea) |
| Web-D | Yes |
| iOS-E | **NO** |
| iOS-D | **NO** |

---

## 8. Profile - Verification

### 8.1 is_verified
- **Purpose:** Whether user is verified
- **DB Column:** `profiles.is_verified`
- **DB Type:** BOOLEAN DEFAULT FALSE
- **API Field:** `is_verified`
- **Editable:** No (admin/system)
- **Status:** `PARTIAL` - Display only

| Layer | Status |
|-------|--------|
| DB | Yes |
| API-R | Yes |
| API-W | No |
| Web-E | N/A |
| Web-D | Yes (badge) |
| iOS-E | N/A |
| iOS-D | Yes (badge) |

---

### 8.2 verified_at
- **Purpose:** When user was verified
- **DB Column:** `profiles.verified_at`
- **DB Type:** TIMESTAMPTZ
- **API Field:** N/A
- **Editable:** No (system)
- **Status:** `PARTIAL` - Not exposed

---

### 8.3 verification_selfie_url
- **Purpose:** Selfie used for verification
- **DB Column:** `profiles.verification_selfie_url`
- **DB Type:** TEXT
- **API Field:** N/A
- **Editable:** Upload only
- **Status:** `PARTIAL` - Not fully implemented

| Layer | Status |
|-------|--------|
| DB | Yes |
| API-R | No |
| API-W | No |
| Web-E | **NO** |
| Web-D | **NO** |
| iOS-E | Yes (camera capture) |
| iOS-D | No |

---

### 8.4 profile_image_url
- **Purpose:** Main profile photo URL
- **DB Column:** `profiles.profile_image_url`
- **DB Type:** TEXT
- **API Field:** `Image`, `livePicture`
- **Editable:** Yes (via upload)
- **Status:** `FULL`

| Layer | Status |
|-------|--------|
| DB | Yes |
| API-R | Yes |
| API-W | Yes |
| Web-E | Yes (file upload) |
| Web-D | Yes |
| iOS-E | Yes (image picker) |
| iOS-D | Yes |

---

## 9. Profile Prompts (Per Business Logic)

These are "Structured Storytelling" prompts from the original business requirements. Most exist in Mobile UI but have no database storage.

### 9.1 ideal_first_date
- **Purpose:** "My ideal first date starts with... and ends with..."
- **DB Column:** **MISSING**
- **Mobile Field:** `IdeaDate`
- **Status:** `MISSING-DB`

### 9.2 non_negotiables
- **Purpose:** "My top 5 non-negotiables"
- **DB Column:** **MISSING**
- **Mobile Field:** `NonNegotiable`
- **Status:** `MISSING-DB`

### 9.3 worst_job
- **Purpose:** "The worst job I ever had"
- **DB Column:** **MISSING**
- **Mobile Field:** `WorstJob`
- **Status:** `MISSING-DB`

### 9.4 dream_job
- **Purpose:** "The job I'd do for no money"
- **DB Column:** **MISSING**
- **Mobile Field:** **MISSING**
- **Status:** `MISSING-DB` `MISSING-MOBILE`

### 9.5 nightclub_or_home
- **Purpose:** "Nightclub or night at home?"
- **DB Column:** **MISSING**
- **Mobile Field:** `NightAtHome` (currently misused for political_views)
- **Status:** `MISSING-DB` - Mobile has field but uses it wrong

### 9.6 pet_peeves
- **Purpose:** "My pet peeves"
- **DB Column:** **MISSING**
- **Mobile Field:** **MISSING**
- **Status:** `MISSING-DB` `MISSING-MOBILE`

### 9.7 after_work
- **Purpose:** "After work, you can find me..."
- **DB Column:** **MISSING**
- **Mobile Field:** `FindMe`
- **Status:** `MISSING-DB`

### 9.8 way_to_heart
- **Purpose:** "The way to my heart is through..."
- **DB Column:** **MISSING**
- **Mobile Field:** `WayToHeart`
- **Status:** `MISSING-DB`

### 9.9 craziest_travel_story
- **Purpose:** "Craziest travel story"
- **DB Column:** **MISSING**
- **Mobile Field:** `CraziestThings` (signup), `craziestTravelStory` (edit)
- **Status:** `MISSING-DB`

### 9.10 weirdest_gift
- **Purpose:** "Weirdest gift I have received"
- **DB Column:** **MISSING**
- **Mobile Field:** `weiredestGift`
- **Status:** `MISSING-DB`

### 9.11 past_event
- **Purpose:** Past event you'd attend (if any from history)
- **DB Column:** **MISSING**
- **Mobile Field:** `PastEvent`
- **Status:** `MISSING-DB`

---

## 10. Profile - Additional Fields (MISSING FROM DATABASE)

### 10.1 languages
- **Purpose:** Languages user speaks
- **DB Column:** **MISSING**
- **DB Type:** Needed: TEXT[]
- **Mobile Field:** `Language`
- **Options (per business logic - extensive list):**
  - Arabic, Armenian, Chinese, Dutch, English, French, German, Hebrew, Hindi, Italian, Japanese, Korean, Norwegian, Portuguese, Russian, Spanish, Swedish, Tagalog, Turkish, Urdu, Other
- **Status:** `MISSING-DB`

### 10.2 schools
- **Purpose:** Schools attended (multiple allowed)
- **DB Column:** **MISSING**
- **DB Type:** Needed: TEXT[]
- **Mobile Field:** `School`
- **Status:** `MISSING-DB`

### 10.3 company
- **Purpose:** Current employer/company name
- **DB Column:** **MISSING**
- **DB Type:** Needed: TEXT
- **Mobile Field:** `Company`
- **Status:** `MISSING-DB`

### 10.4 social_link_1
- **Purpose:** Social media link 1
- **DB Column:** **MISSING**
- **DB Type:** Needed: TEXT
- **Mobile Field:** `social_link1`
- **Status:** `MISSING-DB`

### 10.5 social_link_2
- **Purpose:** Social media link 2
- **DB Column:** **MISSING**
- **DB Type:** Needed: TEXT
- **Mobile Field:** `social_link2`
- **Status:** `MISSING-DB`

### 10.6 zip_code
- **Purpose:** User's ZIP/postal code
- **DB Column:** **MISSING**
- **DB Type:** Needed: TEXT
- **Mobile Field:** `Zipcode`
- **Status:** `MISSING-DB`

### 10.7 username
- **Purpose:** User's unique username (per business logic)
- **DB Column:** **MISSING** (display_name exists but username is different)
- **DB Type:** Needed: TEXT UNIQUE
- **Mobile Field:** `Username`
- **Status:** `MISSING-DB` - Business logic requires separate username

---

## 11. Summary of Required Actions

### Database Migration Needed

**New columns for `profiles` table:**

```sql
-- Lifestyle (new)
marital_status TEXT CHECK (marital_status IN ('never_married', 'separated', 'divorced', 'widowed')),

-- Additional info (new)
languages TEXT[],
schools TEXT[],
company TEXT,
zip_code TEXT,
username TEXT UNIQUE,

-- Social links (new)
social_link_1 TEXT,
social_link_2 TEXT,

-- Profile prompts (new - per business logic)
ideal_first_date TEXT,        -- "My ideal first date starts with... and ends with..."
non_negotiables TEXT,         -- "My top 5 non-negotiables"
worst_job TEXT,               -- "The worst job I ever had"
dream_job TEXT,               -- "The job I'd do for no money"
nightclub_or_home TEXT,       -- "Nightclub or night at home?"
pet_peeves TEXT,              -- "My pet peeves"
after_work TEXT,              -- "After work, you can find me..."
way_to_heart TEXT,            -- "The way to my heart is through..."
craziest_travel_story TEXT,   -- "Craziest travel story"
weirdest_gift TEXT,           -- "Weirdest gift I have received"
past_event TEXT               -- Past event you'd attend
```

**Column type changes needed:**

```sql
-- Change has_kids from BOOLEAN to TEXT for richer options
ALTER TABLE profiles ALTER COLUMN has_kids TYPE TEXT;
-- Options: 'no', 'yes_live_at_home', 'yes_live_away'

-- Change ethnicity from TEXT to TEXT[] for mixed heritage
ALTER TABLE profiles ALTER COLUMN ethnicity TYPE TEXT[];

-- Update CHECK constraints for expanded options:
-- body_type: add 'muscular'
-- smoking: change to 'no', 'occasionally', 'daily', 'trying_to_quit'
-- drinking: change to 'never', 'social', 'moderate', 'regular'
-- wants_kids: change to 'no', 'definitely', 'someday', 'ok_if_partner_has'
```

### API Fixes Required

**Field name corrections (COMPLETED):**
- `Ethniticity` → `Ethnicity` ✓
- `Marijuna` → `Marijuana` ✓

**Data format changes:**
- Return arrays as arrays, not comma-separated strings
- Accept arrays for: interests, ethnicities, languages, pets
- Standardize boolean handling (use actual booleans)

### Web UI Fields to Add
- zodiac_sign (currently display-only, needs edit)
- ethnicity (multi-select chips)
- political_views (dropdown)
- marijuana (dropdown)
- pets (multi-select chips)
- display_name (in profile edit, not just registration)
- phone (editable)
- All new fields from migration
- All profile prompts

### Mobile UI Fixes
- Separate gender and looking_for into distinct fields (currently combined)
- Fix height conversion (feet → total inches before save)
- Standardize body_type to single select (currently multi)
- Standardize religion to single select (currently multi)
- Fix political_views storage (currently uses NightAtHome field)
- Use proper field names (match API)
- Add missing prompts: dream_job, pet_peeves

### Option Standardization Required

All platforms must use identical options for:
- body_type (6 options per business logic)
- smoking (4 options per business logic)
- drinking (4 options per business logic)
- has_kids (3 options per business logic)
- wants_kids (4 options per business logic)
- ethnicity (12 options per business logic)
- religion (12 options per business logic)
- political_views (7 options per business logic)
- education (6 options per business logic)
- marital_status (4 options per business logic)
- interests (needs standardized list - merge all current options)
