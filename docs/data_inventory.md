# RealSingles - Master Data Inventory

**Last Updated:** January 24, 2026  
**Purpose:** Complete inventory of every data point in the system across Database, API, Web, iOS, and Android.

---

## Quick Reference

| Category | Total Fields | In DB | In API | In Web UI | In Mobile UI | Fully Integrated |
|----------|-------------|-------|--------|-----------|--------------|------------------|
| User Account | 16 | 16 | 14 | 6 | 8 | 6 |
| Profile - Basic | 9 | 9 | 9 | 9 | 8 | 8 |
| Profile - Physical | 3 | 3 | 3 | 3 | 3 | 3 |
| Profile - Location | 6 | 6 | 6 | 4 | 5 | 4 |
| Profile - Lifestyle | 12 | 12 | 12 | 10 | 10 | 9 |
| Profile - Family | 3 | 3 | 3 | 3 | 3 | 3 |
| Profile - Personality | 4 | 4 | 4 | 4 | 4 | 4 |
| Profile - Verification | 7 | 7 | 6 | 3 | 3 | 3 |
| Profile - Media | 5 | 5 | 5 | 2 | 2 | 2 |
| Profile - Prompts | 11 | 11 | 11 | 11 | 10 | 10 |
| Profile - Life Goals | 1 | 1 | 1 | 1 | 0 | 0 |
| **TOTAL** | **77** | **77** | **74** | **56** | **56** | **52** |

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
- `WEB-ONLY` - Only on web platform
- `MOBILE-ONLY` - Only on mobile platforms
- `COMING-SOON` - DB/API ready, UI pending

---

## 1. User Account Fields

### 1.1 id
- **Purpose:** Unique user identifier
- **DB Column:** `users.id`
- **DB Type:** UUID
- **API Field:** `id`, `ID`
- **Editable:** No (system-generated)
- **Status:** `FULL`

---

### 1.2 email
- **Purpose:** User's email address for login
- **DB Column:** `users.email`
- **DB Type:** TEXT UNIQUE NOT NULL
- **API Field:** `Email`
- **Editable:** No (set at registration)
- **Status:** `FULL`

---

### 1.3 phone
- **Purpose:** User's phone number
- **DB Column:** `users.phone`
- **DB Type:** TEXT
- **API Field:** `Phone`
- **Editable:** Yes
- **Validation:** Phone number format
- **Status:** `FULL`

| Layer | Status |
|-------|--------|
| DB | Yes |
| API-R | Yes |
| API-W | Yes |
| Web-E | Yes (settings/verification) |
| Web-D | Yes |
| iOS-E | Yes |
| iOS-D | Yes |

---

### 1.4 phone_verified
- **Purpose:** Whether phone has been verified
- **DB Column:** `users.phone_verified`
- **DB Type:** BOOLEAN DEFAULT FALSE
- **API Field:** N/A (internal)
- **Editable:** No (system-managed)
- **Status:** `PARTIAL` - Not exposed in public API

---

### 1.5 display_name
- **Purpose:** User's chosen display name
- **DB Column:** `users.display_name`
- **DB Type:** TEXT
- **API Field:** `DisplayName`
- **Editable:** Yes
- **Status:** `FULL`

| Layer | Status |
|-------|--------|
| DB | Yes |
| API-R | Yes |
| API-W | Yes |
| Web-E | Registration only |
| Web-D | Yes |
| iOS-E | Yes |
| iOS-D | Yes |

---

### 1.6 username
- **Purpose:** User's unique username
- **DB Column:** `users.username`
- **DB Type:** TEXT UNIQUE
- **API Field:** `Username`
- **Editable:** Yes
- **Status:** `PARTIAL` - Not in mobile edit form

| Layer | Status |
|-------|--------|
| DB | Yes |
| API-R | Yes |
| API-W | Yes |
| Web-E | No |
| Web-D | No |
| iOS-E | No |
| iOS-D | No |

---

### 1.7 created_at
- **Purpose:** Account creation timestamp
- **DB Column:** `users.created_at`
- **DB Type:** TIMESTAMPTZ DEFAULT NOW()
- **API Field:** N/A
- **Editable:** No (system-generated)
- **Status:** `FULL` (read-only)

---

### 1.8 updated_at
- **Purpose:** Last account update timestamp
- **DB Column:** `users.updated_at`
- **DB Type:** TIMESTAMPTZ DEFAULT NOW()
- **API Field:** N/A
- **Editable:** No (system-managed via trigger)
- **Status:** `FULL` (read-only)

---

### 1.9 last_active_at
- **Purpose:** Last activity timestamp
- **DB Column:** `users.last_active_at`
- **DB Type:** TIMESTAMPTZ
- **API Field:** N/A
- **Editable:** No (system-managed)
- **Status:** `PARTIAL` - Needs implementation for activity tracking

---

### 1.10 status
- **Purpose:** Account status
- **DB Column:** `users.status`
- **DB Type:** TEXT CHECK (status IN ('active', 'suspended', 'deleted')) DEFAULT 'active'
- **API Field:** `status`
- **Editable:** Admin only
- **Options:** active, suspended, deleted
- **Status:** `FULL`

---

### 1.11 role
- **Purpose:** User role for permissions
- **DB Column:** `users.role`
- **DB Type:** TEXT CHECK (role IN ('user', 'admin', 'moderator')) DEFAULT 'user'
- **API Field:** `role`
- **Editable:** Admin only
- **Options:** user, admin, moderator
- **Status:** `FULL`

---

### 1.12 agora_user_id
- **Purpose:** Agora Chat user identifier
- **DB Column:** `users.agora_user_id`
- **DB Type:** TEXT
- **API Field:** N/A (internal)
- **Editable:** No (system-managed)
- **Status:** `FULL` (internal)

---

### 1.13 points_balance
- **Purpose:** Reward points balance
- **DB Column:** `users.points_balance`
- **DB Type:** INTEGER DEFAULT 0
- **API Field:** `WalletPoint`, `RedeemPoints`, `PointsBalance`
- **Editable:** No (system-managed via transactions)
- **Status:** `FULL`

---

### 1.14 referral_code
- **Purpose:** User's unique referral code
- **DB Column:** `users.referral_code`
- **DB Type:** TEXT UNIQUE
- **API Field:** `ReferralCode`
- **Editable:** No (system-generated)
- **Status:** `FULL`

---

### 1.15 referred_by
- **Purpose:** Who referred this user
- **DB Column:** `users.referred_by`
- **DB Type:** UUID REFERENCES users(id)
- **API Field:** N/A
- **Editable:** Registration only
- **Status:** `FULL`

---

### 1.16 notification_preferences
- **Purpose:** User notification settings
- **DB Column:** `users.notification_preferences`
- **DB Type:** JSONB
- **API Field:** N/A
- **Editable:** Yes (via settings)
- **Status:** `PARTIAL` - Needs UI implementation

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

---

### 2.2 last_name
- **Purpose:** User's last name
- **DB Column:** `profiles.last_name`
- **DB Type:** TEXT
- **API Field:** `LastName`
- **Editable:** Yes
- **Required:** No
- **Status:** `FULL`

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

**UI Pattern:** Web uses HTML date input, Mobile uses native DateTimePicker.

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
  | prefer_not_to_say | Prefer not to say |
- **Status:** `FULL`

---

### 2.5 looking_for
- **Purpose:** Gender(s) user is interested in
- **DB Column:** `profiles.looking_for`
- **DB Type:** TEXT[]
- **API Field:** `LookingFor` (array)
- **Editable:** Yes
- **Options:** Same as gender options
- **Status:** `FULL`

---

### 2.6 zodiac_sign
- **Purpose:** Astrological sign
- **DB Column:** `profiles.zodiac_sign`
- **DB Type:** TEXT
- **API Field:** `ZodiacSign`, `HSign`
- **Editable:** Yes (auto-calculated from DOB on web)
- **Options:** aries, taurus, gemini, cancer, leo, virgo, libra, scorpio, sagittarius, capricorn, aquarius, pisces
- **Status:** `FULL`

**Implementation:** Web auto-calculates from DOB. Mobile has text input (should be picker).

---

### 2.7 bio
- **Purpose:** User's about me text
- **DB Column:** `profiles.bio`
- **DB Type:** TEXT
- **API Field:** `Bio`, `About`
- **Editable:** Yes
- **Validation:** Max 500 characters (suggested)
- **Status:** `FULL`

---

### 2.8 looking_for_description
- **Purpose:** What user is looking for in a partner
- **DB Column:** `profiles.looking_for_description`
- **DB Type:** TEXT
- **API Field:** `LookingForDescription`
- **Editable:** Yes
- **Status:** `PARTIAL` - Missing from mobile

| Layer | Status |
|-------|--------|
| DB | Yes |
| API-R | Yes |
| API-W | Yes |
| Web-E | Yes |
| Web-D | Yes |
| iOS-E | No |
| iOS-D | No |

---

### 2.9 dating_intentions
- **Purpose:** User's relationship goals
- **DB Column:** `profiles.dating_intentions`
- **DB Type:** TEXT CHECK (dating_intentions IN ('life_partner', 'long_term', 'long_term_open', 'figuring_out', 'prefer_not_to_say'))
- **API Field:** `DatingIntentions`
- **Editable:** Yes
- **Options:**
  | Value | Display |
  |-------|---------|
  | life_partner | Life Partner |
  | long_term | Long-term Relationship |
  | long_term_open | Long-term, Open to Short |
  | figuring_out | Figuring Out My Goals |
  | prefer_not_to_say | Prefer not to say |
- **Status:** `PARTIAL` - Missing from mobile UI

| Layer | Status |
|-------|--------|
| DB | Yes |
| API-R | Yes |
| API-W | Yes |
| Web-E | Yes |
| Web-D | Yes |
| iOS-E | **NO** |
| iOS-D | No |

---

## 3. Profile - Physical Attributes

### 3.1 height_inches
- **Purpose:** User's height in inches
- **DB Column:** `profiles.height_inches`
- **DB Type:** INTEGER
- **API Field:** `Height`, `HeightInches`
- **Editable:** Yes
- **Validation:** 48-96 inches (4ft - 8ft)
- **Status:** `FULL`

**Implementation:** 
- Web: Two side-by-side dropdowns (feet + inches)
- Mobile: Two-column wheel picker using `@react-native-picker/picker`
- Conversion: `(feet * 12) + inches` on save, reverse on load

---

### 3.2 body_type
- **Purpose:** User's body type
- **DB Column:** `profiles.body_type`
- **DB Type:** TEXT CHECK (body_type IN ('slim', 'athletic', 'average', 'muscular', 'curvy', 'plus_size'))
- **API Field:** `BodyType`
- **Editable:** Yes
- **Options:**
  | Value | Display |
  |-------|---------|
  | slim | Slim/Slender |
  | athletic | Athletic/Fit |
  | average | Average |
  | muscular | Muscular |
  | curvy | Curvy |
  | plus_size | A few extra pounds |
  | prefer_not_to_say | Prefer not to say |
- **Status:** `FULL`

**Note:** Single select (not multi-select). Mobile correctly implements as single select chips.

---

### 3.3 ethnicity
- **Purpose:** User's ethnicity
- **DB Column:** `profiles.ethnicity`
- **DB Type:** TEXT[] (array - for mixed heritage)
- **API Field:** `Ethnicity` (array)
- **Editable:** Yes
- **Options:**
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
- **Status:** `FULL`

---

## 4. Profile - Location

### 4.1 city
- **Purpose:** User's city
- **DB Column:** `profiles.city`
- **DB Type:** TEXT
- **API Field:** `City`
- **Editable:** Yes
- **Status:** `FULL`

---

### 4.2 state
- **Purpose:** User's state/province
- **DB Column:** `profiles.state`
- **DB Type:** TEXT
- **API Field:** `State`
- **Editable:** Yes
- **Status:** `FULL`

---

### 4.3 country
- **Purpose:** User's country
- **DB Column:** `profiles.country`
- **DB Type:** TEXT
- **API Field:** `Country`
- **Editable:** Yes
- **Status:** `FULL`

---

### 4.4 zip_code
- **Purpose:** User's ZIP/postal code
- **DB Column:** `profiles.zip_code`
- **DB Type:** TEXT
- **API Field:** `ZipCode`, `Zipcode`
- **Editable:** Yes
- **Status:** `FULL`

---

### 4.5 latitude / longitude
- **Purpose:** User's coordinates for distance calculations
- **DB Columns:** `profiles.latitude`, `profiles.longitude`
- **DB Type:** DECIMAL(10, 8), DECIMAL(11, 8)
- **API Field:** `Latitude`, `Longitude`
- **Editable:** Via location services
- **Status:** `PARTIAL` - Auto from location, not manually edited

---

### 4.6 location (PostGIS)
- **Purpose:** Geographic point for efficient distance queries
- **DB Column:** `profiles.location`
- **DB Type:** GEOGRAPHY(POINT, 4326)
- **API Field:** N/A (auto-generated from lat/long via trigger)
- **Editable:** No (trigger-managed)
- **Status:** `FULL` (internal)

---

## 5. Profile - Lifestyle

### 5.1 religion
- **Purpose:** User's religion
- **DB Column:** `profiles.religion`
- **DB Type:** TEXT
- **API Field:** `Religion`
- **Editable:** Yes
- **Options:**
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
- **Status:** `FULL`

**Note:** Single select (not multi-select).

---

### 5.2 political_views
- **Purpose:** User's political views
- **DB Column:** `profiles.political_views`
- **DB Type:** TEXT
- **API Field:** `Political`, `PoliticalViews`
- **Editable:** Yes
- **Options:**
  | Value | Display |
  |-------|---------|
  | no_answer | No answer |
  | undecided | Undecided |
  | conservative | Conservative |
  | liberal | Liberal |
  | libertarian | Libertarian |
  | moderate | Moderate |
  | prefer_not_to_say | Prefer not to say |
- **Status:** `FULL`

---

### 5.3 education
- **Purpose:** Education level
- **DB Column:** `profiles.education`
- **DB Type:** TEXT
- **API Field:** `Education`
- **Editable:** Yes
- **Options:**
  | Value | Display |
  |-------|---------|
  | high_school | High School |
  | some_college | Some College |
  | associate | Associate Degree |
  | bachelor | Bachelor's Degree |
  | graduate | Graduate Degree |
  | phd | PhD/Post-doctoral |
  | prefer_not_to_say | Prefer not to say |
- **Status:** `FULL`

---

### 5.4 occupation
- **Purpose:** User's job/occupation
- **DB Column:** `profiles.occupation`
- **DB Type:** TEXT
- **API Field:** `Occupation`, `JobTitle`
- **Editable:** Yes
- **Status:** `FULL`

---

### 5.5 company
- **Purpose:** Current employer/company name
- **DB Column:** `profiles.company`
- **DB Type:** TEXT
- **API Field:** `Company`
- **Editable:** Yes
- **Status:** `FULL`

---

### 5.6 schools
- **Purpose:** Schools attended
- **DB Column:** `profiles.schools`
- **DB Type:** TEXT[]
- **API Field:** `Schools`, `School`
- **Editable:** Yes
- **Status:** `FULL`

---

### 5.7 languages
- **Purpose:** Languages user speaks
- **DB Column:** `profiles.languages`
- **DB Type:** TEXT[]
- **API Field:** `Languages`, `Language`
- **Editable:** Yes
- **Options:** english, spanish, french, german, italian, portuguese, chinese, japanese, korean, arabic, armenian, dutch, hebrew, hindi, norwegian, russian, swedish, tagalog, turkish, urdu, other
- **Status:** `FULL`

---

### 5.8 marital_status
- **Purpose:** User's marital status
- **DB Column:** `profiles.marital_status`
- **DB Type:** TEXT CHECK (marital_status IN ('never_married', 'separated', 'divorced', 'widowed', 'prefer_not_to_say'))
- **API Field:** `MaritalStatus`
- **Editable:** Yes
- **Options:**
  | Value | Display |
  |-------|---------|
  | never_married | Never Married |
  | separated | Currently Separated |
  | divorced | Divorced |
  | widowed | Widow/Widower |
  | prefer_not_to_say | Prefer not to say |
- **Status:** `FULL`

---

### 5.9 smoking
- **Purpose:** Smoking habits
- **DB Column:** `profiles.smoking`
- **DB Type:** TEXT CHECK (smoking IN ('no', 'occasionally', 'daily', 'trying_to_quit'))
- **API Field:** `Smoking`
- **Editable:** Yes
- **Options:**
  | Value | Display |
  |-------|---------|
  | no | No |
  | occasionally | Yes (Occasionally) |
  | daily | Yes (Daily) |
  | trying_to_quit | Trying to quit |
  | prefer_not_to_say | Prefer not to say |
- **Status:** `FULL`

---

### 5.10 drinking
- **Purpose:** Drinking habits
- **DB Column:** `profiles.drinking`
- **DB Type:** TEXT CHECK (drinking IN ('never', 'social', 'moderate', 'regular'))
- **API Field:** `Drinking`, `Drinks`
- **Editable:** Yes
- **Options:**
  | Value | Display |
  |-------|---------|
  | never | Never |
  | social | Social |
  | moderate | Moderately |
  | regular | Regular |
  | prefer_not_to_say | Prefer not to say |
- **Status:** `FULL`

---

### 5.11 marijuana
- **Purpose:** Marijuana use
- **DB Column:** `profiles.marijuana`
- **DB Type:** TEXT CHECK (marijuana IN ('no', 'yes', 'occasionally'))
- **API Field:** `Marijuana`
- **Editable:** Yes
- **Options:**
  | Value | Display |
  |-------|---------|
  | no | No |
  | occasionally | Occasionally |
  | yes | Yes |
  | prefer_not_to_say | Prefer not to say |
- **Status:** `FULL`

---

### 5.12 exercise
- **Purpose:** Exercise frequency
- **DB Column:** `profiles.exercise`
- **DB Type:** TEXT CHECK (exercise IN ('never', 'sometimes', 'regularly', 'daily'))
- **API Field:** `Exercise`
- **Editable:** Yes
- **Options:**
  | Value | Display |
  |-------|---------|
  | never | Never |
  | sometimes | Sometimes |
  | regularly | Regularly |
  | daily | Daily |
  | prefer_not_to_say | Prefer not to say |
- **Status:** `FULL`

---

## 6. Profile - Family

### 6.1 has_kids
- **Purpose:** Whether user has children and their living situation
- **DB Column:** `profiles.has_kids`
- **DB Type:** TEXT CHECK (has_kids IN ('no', 'yes_live_at_home', 'yes_live_away'))
- **API Field:** `HasKids`, `HaveChild`
- **Editable:** Yes
- **Options:**
  | Value | Display |
  |-------|---------|
  | no | No |
  | yes_live_at_home | Yes (Live at home) |
  | yes_live_away | Yes (Live away) |
  | prefer_not_to_say | Prefer not to say |
- **Status:** `FULL`

---

### 6.2 wants_kids
- **Purpose:** Whether user wants children in future
- **DB Column:** `profiles.wants_kids`
- **DB Type:** TEXT CHECK (wants_kids IN ('no', 'definitely', 'someday', 'ok_if_partner_has'))
- **API Field:** `WantsKids`, `WantChild`
- **Editable:** Yes
- **Options:**
  | Value | Display |
  |-------|---------|
  | no | No |
  | definitely | Definitely |
  | someday | Someday |
  | ok_if_partner_has | No (but OK if partner has) |
  | prefer_not_to_say | Prefer not to say |
- **Status:** `FULL`

---

### 6.3 pets
- **Purpose:** User's pets
- **DB Column:** `profiles.pets`
- **DB Type:** TEXT[] (array for multiple pets)
- **API Field:** `Pets`
- **Editable:** Yes
- **Options:**
  | Value | Display |
  |-------|---------|
  | none | None |
  | cat | Cat |
  | dog | Dog |
  | other | Other |
- **Status:** `FULL`

---

## 7. Profile - Personality/Interests

### 7.1 interests
- **Purpose:** User's interests/hobbies
- **DB Column:** `profiles.interests`
- **DB Type:** TEXT[]
- **API Field:** `Interests` (array), `Interest` (comma-separated string for mobile)
- **Editable:** Yes
- **Options:** Standardized across platforms - dining_out, sports, museums_art, music, gardening, basketball, dancing, travel, movies, reading, fitness, cooking, photography, gaming, hiking, yoga, wine, coffee, dogs, cats, fashion, technology, nature, beach, mountains, running, cycling, concerts, theater, volunteering
- **Status:** `FULL`

---

### 7.2 life_goals
- **Purpose:** User's life goals (The League model)
- **DB Column:** `profiles.life_goals`
- **DB Type:** TEXT[] (max 10)
- **API Field:** `LifeGoals`, `life_goals`
- **Editable:** Yes
- **Source:** Admin-managed `life_goal_definitions` table
- **Categories:** career, adventure, personal, impact
- **Status:** `PARTIAL` - Missing from mobile UI

| Layer | Status |
|-------|--------|
| DB | Yes |
| API-R | Yes |
| API-W | Yes |
| Web-E | Yes |
| Web-D | Yes |
| iOS-E | **NO** |
| iOS-D | No |

---

## 8. Profile - Verification

### 8.1 is_verified
- **Purpose:** Whether user has basic verification (selfie)
- **DB Column:** `profiles.is_verified`
- **DB Type:** BOOLEAN DEFAULT FALSE
- **API Field:** `is_verified`, `IsVerified`
- **Editable:** No (admin/system)
- **Status:** `FULL`

---

### 8.2 verified_at
- **Purpose:** When basic verification was completed
- **DB Column:** `profiles.verified_at`
- **DB Type:** TIMESTAMPTZ
- **API Field:** `VerifiedAt`
- **Editable:** No (system)
- **Status:** `FULL` (internal)

---

### 8.3 verification_selfie_url
- **Purpose:** Selfie used for basic verification
- **DB Column:** `profiles.verification_selfie_url`
- **DB Type:** TEXT
- **API Field:** `VerificationSelfieUrl`
- **Editable:** Upload only
- **Status:** `PARTIAL` - Mobile has camera capture, web needs UI

---

### 8.4 is_photo_verified
- **Purpose:** Photo verification status (required for matching)
- **DB Column:** `profiles.is_photo_verified`
- **DB Type:** BOOLEAN DEFAULT FALSE
- **API Field:** `IsPhotoVerified`
- **Editable:** No (system)
- **Status:** `PARTIAL` - Needs UI for verification flow

---

### 8.5 photo_verified_at
- **Purpose:** When photo verification was completed
- **DB Column:** `profiles.photo_verified_at`
- **DB Type:** TIMESTAMPTZ
- **API Field:** `PhotoVerifiedAt`
- **Editable:** No (system)
- **Status:** `FULL` (internal)

---

### 8.6 is_id_verified
- **Purpose:** ID verification status (premium tier)
- **DB Column:** `profiles.is_id_verified`
- **DB Type:** BOOLEAN DEFAULT FALSE
- **API Field:** `IsIdVerified`
- **Editable:** No (system)
- **Status:** `PARTIAL` - Needs UI for ID verification flow

---

### 8.7 id_document_url
- **Purpose:** URL to uploaded ID document
- **DB Column:** `profiles.id_document_url`
- **DB Type:** TEXT
- **API Field:** N/A (internal)
- **Editable:** No (upload only)
- **Status:** `PARTIAL` - Needs secure storage implementation

---

## 9. Profile - Media

### 9.1 profile_image_url
- **Purpose:** Main profile photo URL
- **DB Column:** `profiles.profile_image_url`
- **DB Type:** TEXT
- **API Field:** `Image`, `livePicture`, `ProfileImageUrl`
- **Editable:** Yes (via upload)
- **Status:** `FULL`

---

### 9.2 voice_prompt_url
- **Purpose:** URL to user's voice introduction (30 sec max)
- **DB Column:** `profiles.voice_prompt_url`
- **DB Type:** TEXT
- **API Field:** `VoicePromptUrl`
- **Editable:** Yes (via upload)
- **Status:** `COMING-SOON` - DB/API ready, UI pending

---

### 9.3 voice_prompt_duration_seconds
- **Purpose:** Duration of voice prompt
- **DB Column:** `profiles.voice_prompt_duration_seconds`
- **DB Type:** INTEGER (1-30)
- **API Field:** `VoicePromptDurationSeconds`
- **Editable:** No (system-calculated)
- **Status:** `COMING-SOON`

---

### 9.4 video_intro_url
- **Purpose:** URL to user's video introduction (60 sec max)
- **DB Column:** `profiles.video_intro_url`
- **DB Type:** TEXT
- **API Field:** `VideoIntroUrl`
- **Editable:** Yes (via upload)
- **Status:** `COMING-SOON` - DB/API ready, UI pending

---

### 9.5 video_intro_duration_seconds
- **Purpose:** Duration of video intro
- **DB Column:** `profiles.video_intro_duration_seconds`
- **DB Type:** INTEGER (1-60)
- **API Field:** `VideoIntroDurationSeconds`
- **Editable:** No (system-calculated)
- **Status:** `COMING-SOON`

---

## 10. Profile Prompts

All prompts allow users to share personality through structured storytelling.

### 10.1 ideal_first_date
- **Purpose:** "My ideal first date starts with... and ends with..."
- **DB Column:** `profiles.ideal_first_date`
- **API Field:** `IdealFirstDate`, `IdeaDate`
- **Status:** `FULL`

### 10.2 non_negotiables
- **Purpose:** "My top non-negotiables in a partner"
- **DB Column:** `profiles.non_negotiables`
- **API Field:** `NonNegotiables`, `NonNegotiable`
- **Status:** `FULL`

### 10.3 way_to_heart
- **Purpose:** "The way to my heart is through..."
- **DB Column:** `profiles.way_to_heart`
- **API Field:** `WayToHeart`
- **Status:** `FULL`

### 10.4 after_work
- **Purpose:** "After work, you can find me..."
- **DB Column:** `profiles.after_work`
- **API Field:** `AfterWork`, `FindMe`
- **Status:** `FULL`

### 10.5 nightclub_or_home
- **Purpose:** "Nightclub or night at home?"
- **DB Column:** `profiles.nightclub_or_home`
- **API Field:** `NightclubOrHome`, `NightAtHome`
- **Status:** `FULL`

### 10.6 worst_job
- **Purpose:** "The worst job I ever had"
- **DB Column:** `profiles.worst_job`
- **API Field:** `WorstJob`
- **Status:** `FULL`

### 10.7 dream_job
- **Purpose:** "The job I'd do for no money"
- **DB Column:** `profiles.dream_job`
- **API Field:** `DreamJob`
- **Status:** `FULL`

### 10.8 craziest_travel_story
- **Purpose:** "Craziest travel story"
- **DB Column:** `profiles.craziest_travel_story`
- **API Field:** `CraziestTravelStory`, `craziestTravelStory`
- **Status:** `FULL`

### 10.9 weirdest_gift
- **Purpose:** "Weirdest gift I've ever received"
- **DB Column:** `profiles.weirdest_gift`
- **API Field:** `WeirdestGift`, `weirdestGift`
- **Status:** `FULL`

### 10.10 pet_peeves
- **Purpose:** "My pet peeves"
- **DB Column:** `profiles.pet_peeves`
- **API Field:** `PetPeeves`
- **Status:** `FULL`

### 10.11 past_event
- **Purpose:** "If I could attend any event in history"
- **DB Column:** `profiles.past_event`
- **API Field:** `PastEvent`
- **Status:** `PARTIAL` - Missing from mobile edit form

| Layer | Status |
|-------|--------|
| DB | Yes |
| API-R | Yes |
| API-W | Yes |
| Web-E | Yes |
| Web-D | Yes |
| iOS-E | **NO** |
| iOS-D | No |

---

## 11. Profile - Additional

### 11.1 social_link_1 / social_link_2
- **Purpose:** Social media links
- **DB Columns:** `profiles.social_link_1`, `profiles.social_link_2`
- **DB Type:** TEXT
- **API Field:** `SocialLink1`, `SocialLink2`, `social_link1`, `social_link2`
- **Editable:** Yes
- **Status:** `FULL`

---

### 11.2 privacy_settings
- **Purpose:** User privacy preferences
- **DB Column:** `profiles.privacy_settings`
- **DB Type:** JSONB
- **API Field:** N/A
- **Editable:** Yes (via settings)
- **Status:** `PARTIAL` - Needs UI implementation

---

### 11.3 Profile Completion Tracking
- **DB Columns:**
  - `profile_completion_step` (INTEGER)
  - `profile_completion_skipped` (TEXT[])
  - `profile_completion_prefer_not` (TEXT[])
  - `profile_completed_at` (TIMESTAMPTZ)
- **API Fields:** `ProfileCompletionStep`, `ProfileCompletionSkipped`, `ProfileCompletionPreferNot`, `ProfileCompletedAt`
- **Status:** `FULL`

---

## 12. Related Tables

### 12.1 life_goal_definitions (Admin-Managed)
- **Purpose:** Defines available life goals
- **Columns:** id, key, label, category, description, icon, is_active, display_order
- **API Endpoint:** GET /api/life-goals
- **Admin UI:** /admin/life-goals
- **Status:** `FULL`

### 12.2 prompt_definitions (Admin-Managed)
- **Purpose:** Defines available profile prompts
- **Columns:** id, key, prompt_text, placeholder_text, category, max_length, is_active, is_required, display_order, icon
- **API Endpoint:** GET /api/prompts
- **Admin UI:** /admin/prompts
- **Status:** `FULL`

### 12.3 user_profile_prompts
- **Purpose:** Stores user responses to profile prompts
- **Columns:** id, user_id, prompt_key, response, display_order
- **Note:** Alternative to storing prompts directly in profiles table - allows dynamic prompts
- **Status:** `PARTIAL` - Migration exists, needs client integration

---

## 13. Constants Synchronization

**CRITICAL:** Constants MUST be identical between:
- `mobile/constants/options.ts`
- `web/src/types/index.ts`

### Current Status: SYNCHRONIZED ✓

All option arrays are aligned between mobile and web:
- GENDER_OPTIONS ✓
- BODY_TYPE_OPTIONS ✓
- MARITAL_STATUS_OPTIONS ✓
- HAS_KIDS_OPTIONS ✓
- WANTS_KIDS_OPTIONS ✓
- SMOKING_OPTIONS ✓
- DRINKING_OPTIONS ✓
- MARIJUANA_OPTIONS ✓
- EXERCISE_OPTIONS ✓
- EDUCATION_OPTIONS ✓
- ETHNICITY_OPTIONS ✓
- RELIGION_OPTIONS ✓
- POLITICAL_OPTIONS ✓
- ZODIAC_OPTIONS ✓
- PETS_OPTIONS ✓
- LANGUAGE_OPTIONS ✓
- INTEREST_OPTIONS ✓
- COUNTRY_OPTIONS ✓

---

## 14. Action Items

### Mobile UI Additions Needed
1. Add `dating_intentions` dropdown to Personal Details section
2. Add `life_goals` multi-select section (max 10)
3. Add `past_event` prompt to "In a few Words" section
4. Add `looking_for_description` textarea

### Future Enhancements
1. Voice prompt recording UI (mobile and web)
2. Video intro upload UI (mobile and web)
3. ID verification flow
4. Privacy settings UI
5. Notification preferences UI

---

## Changelog

### 2026-01-24
- Updated entire document to reflect actual database state
- Marked all profile prompts as FULL (exist in DB via migration 00005)
- Added life_goals, dating_intentions, voice/video prompt fields
- Confirmed constants are synchronized between mobile and web
- Added API field aliases for mobile compatibility
- Documented prompt_definitions and user_profile_prompts tables
