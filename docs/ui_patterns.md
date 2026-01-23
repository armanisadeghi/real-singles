# RealSingles - Native UI Patterns

**Last Updated:** January 23, 2026  
**Purpose:** Document the native-first UI pattern for each component and field across Web, iOS, and Android.

---

## Core Principle

Each platform should use its **native UI patterns**. The same data is collected, but the presentation should feel natural to each operating system. We use libraries that automatically adapt where possible.

---

## Quick Reference - Component Library

| Component Type | Web | iOS | Android |
|---------------|-----|-----|---------|
| Single Select | `<select>` dropdown | Wheel picker | Material dropdown/spinner |
| Multi Select | Checkbox group or chips | Multi-wheel or chip selection | Chips with Material styling |
| Text Input | `<input type="text">` | Native TextInput | TextInput with Material styling |
| Date Picker | `<input type="date">` | iOS wheel DatePicker | Material DatePickerDialog |
| Number Input | `<input type="number">` | Wheel picker or stepper | Material TextInput with number keyboard |
| Toggle/Boolean | Checkbox or Switch | UISwitch | Material Switch |
| Textarea | `<textarea>` | Multi-line TextInput | Multi-line TextInput |
| Slider | `<input type="range">` | UISlider | Material Slider |

---

## Navigation Components

### Bottom Navigation / Tab Bar

**Implementation Status:**
- [ ] Best practices documented
- [ ] Web implemented
- [ ] iOS implemented
- [ ] Android implemented
- [ ] Tested

#### Web (React/Next.js)

**Pattern:** Top navbar or sidebar navigation. Bottom nav only for PWA mobile-web feel.

```tsx
// For desktop: Top navigation with responsive menu
<nav className="fixed top-0 w-full">
  <div className="flex items-center justify-between">
    <Logo />
    <NavLinks /> {/* Hidden on mobile, shown on desktop */}
    <MobileMenuButton /> {/* Shown on mobile only */}
  </div>
</nav>

// For mobile web/PWA only: Bottom navigation
<nav className="fixed bottom-0 w-full md:hidden">
  {/* 4-5 items max */}
</nav>
```

**Notes:**
- Desktop: Top or side navigation is expected
- Mobile web: Bottom nav acceptable for app-like experience
- Max 5 items
- Use icons with labels

#### iOS (Expo)

**Pattern:** Tab bar using `@react-navigation/bottom-tabs` with native iOS styling.

```tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Tab = createBottomTabNavigator();

<Tab.Navigator
  screenOptions={{
    tabBarStyle: {
      backgroundColor: '#fff',
      borderTopWidth: 0.5,
      borderTopColor: '#e5e5e5',
    },
    tabBarActiveTintColor: '#8F5924', // Brand primary
    tabBarInactiveTintColor: '#8e8e93',
    tabBarLabelStyle: {
      fontSize: 10,
      fontWeight: '500',
    },
  }}
>
  {/* Max 5 tabs */}
</Tab.Navigator>
```

**iOS-specific characteristics:**
- Labels always visible
- Active state: tint color change
- Flush at bottom, respects safe area automatically
- Standard height: 49pt (83pt with safe area on notched devices)
- Icons above labels

#### Android (Expo)

**Pattern:** Bottom navigation with Material Design 3 styling.

```tsx
// Same library, Android adapts automatically
<Tab.Navigator
  screenOptions={{
    tabBarStyle: {
      backgroundColor: '#fff',
      elevation: 8, // Material shadow
    },
    tabBarActiveTintColor: '#8F5924',
    tabBarInactiveTintColor: '#49454F',
    // Material Design 3 uses pill-shaped active indicator
    tabBarActiveBackgroundColor: 'rgba(143, 89, 36, 0.12)',
  }}
>
  {/* 3-5 tabs */}
</Tab.Navigator>
```

**Android-specific characteristics:**
- Active state: pill/capsule highlight behind icon
- Labels can hide on inactive items (optional)
- Sits above gesture bar (safe area handled)
- Slightly taller than iOS
- Surface tint for elevated feel

---

## Form Input Components

### Height Input (Two-Part: Feet + Inches)

**Implementation Status:**
- [x] Best practices documented
- [ ] Web implemented
- [ ] iOS implemented
- [ ] Android implemented
- [ ] Tested

**Data Storage:** `height_inches` INTEGER (total inches, e.g., 68 for 5'8")

**Conversion Functions:**
```typescript
// Convert feet + inches to total inches (for saving)
const toInches = (feet: number, inches: number): number => (feet * 12) + inches;

// Convert total inches to feet + inches (for display/editing)
const fromInches = (totalInches: number): { feet: number; inches: number } => ({
  feet: Math.floor(totalInches / 12),
  inches: totalInches % 12,
});
```

#### Web (React/Next.js)

**Pattern:** Two side-by-side `<select>` dropdowns.

```tsx
const HeightInput = ({ value, onChange }) => {
  const { feet, inches } = fromInches(value || 66); // Default 5'6"
  
  return (
    <div className="flex gap-4">
      <div>
        <label className="block text-sm font-medium mb-1">Feet</label>
        <select
          value={feet}
          onChange={(e) => onChange(toInches(Number(e.target.value), inches))}
          className="w-20 px-3 py-2 border rounded-md"
        >
          {[4, 5, 6, 7].map((f) => (
            <option key={f} value={f}>{f}'</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Inches</label>
        <select
          value={inches}
          onChange={(e) => onChange(toInches(feet, Number(e.target.value)))}
          className="w-20 px-3 py-2 border rounded-md"
        >
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
            <option key={i} value={i}>{i}"</option>
          ))}
        </select>
      </div>
    </div>
  );
};
```

#### iOS (Expo)

**Pattern:** Two-column wheel picker (like Apple Health app).

```tsx
import { Picker } from '@react-native-picker/picker';

const HeightInput = ({ value, onChange }) => {
  const { feet, inches } = fromInches(value || 66);
  
  return (
    <View style={{ flexDirection: 'row' }}>
      <Picker
        selectedValue={feet}
        onValueChange={(val) => onChange(toInches(val, inches))}
        style={{ flex: 1 }}
        itemStyle={{ fontSize: 22 }} // iOS wheel style
      >
        {[4, 5, 6, 7].map((f) => (
          <Picker.Item key={f} label={`${f}'`} value={f} />
        ))}
      </Picker>
      <Picker
        selectedValue={inches}
        onValueChange={(val) => onChange(toInches(feet, val))}
        style={{ flex: 1 }}
        itemStyle={{ fontSize: 22 }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
          <Picker.Item key={i} label={`${i}"`} value={i} />
        ))}
      </Picker>
    </View>
  );
};
```

**iOS-specific:** The `@react-native-picker/picker` automatically renders as spinning wheel on iOS.

#### Android (Expo)

**Pattern:** Two dropdown/spinner selects (Material Design).

```tsx
// Same component as iOS - it auto-adapts!
import { Picker } from '@react-native-picker/picker';

// The same code works, but renders as Material dropdowns on Android
```

**Android-specific:** The picker automatically renders as a dropdown/spinner on Android, which is the native Android pattern.

---

### Single-Select Dropdown (e.g., Gender, Body Type)

**Implementation Status:**
- [x] Best practices documented
- [ ] Web implemented
- [ ] iOS implemented
- [ ] Android implemented
- [ ] Tested

#### Web (React/Next.js)

**Pattern:** Native `<select>` element.

```tsx
const SelectInput = ({ label, value, onChange, options }) => (
  <div>
    <label className="block text-sm font-medium mb-1">{label}</label>
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary"
    >
      <option value="">Select...</option>
      {options.map(({ value, label }) => (
        <option key={value} value={value}>{label}</option>
      ))}
    </select>
  </div>
);
```

#### iOS (Expo)

**Pattern:** Wheel picker in a modal or inline.

```tsx
import { Picker } from '@react-native-picker/picker';

const SelectInput = ({ label, value, onChange, options }) => (
  <View>
    <Text style={styles.label}>{label}</Text>
    <Picker
      selectedValue={value}
      onValueChange={onChange}
      itemStyle={{ fontSize: 18 }}
    >
      <Picker.Item label="Select..." value="" />
      {options.map(({ value, label }) => (
        <Picker.Item key={value} label={label} value={value} />
      ))}
    </Picker>
  </View>
);
```

#### Android (Expo)

**Pattern:** Material dropdown/spinner (same component, auto-adapts).

```tsx
// Same component as iOS
// Android automatically renders as dropdown style
```

---

### Multi-Select (e.g., Interests, Looking For)

**Implementation Status:**
- [x] Best practices documented
- [ ] Web implemented
- [ ] iOS implemented
- [ ] Android implemented
- [ ] Tested

**Data Storage:** Array (TEXT[] in database)

#### Web (React/Next.js)

**Pattern:** Chip/tag selection.

```tsx
const MultiSelect = ({ label, value = [], onChange, options }) => {
  const toggle = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map(({ value: optValue, label }) => (
          <button
            key={optValue}
            type="button"
            onClick={() => toggle(optValue)}
            className={`px-3 py-1 rounded-full border transition ${
              value.includes(optValue)
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-gray-700 border-gray-300 hover:border-primary'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};
```

#### iOS (Expo)

**Pattern:** Horizontally scrollable chip selection.

```tsx
import { ScrollView, TouchableOpacity, Text } from 'react-native';

const MultiSelect = ({ label, value = [], onChange, options }) => {
  const toggle = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {options.map(({ value: optValue, label }) => (
            <TouchableOpacity
              key={optValue}
              onPress={() => toggle(optValue)}
              style={[
                styles.chip,
                value.includes(optValue) && styles.chipSelected,
              ]}
            >
              <Text style={[
                styles.chipText,
                value.includes(optValue) && styles.chipTextSelected,
              ]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};
```

#### Android (Expo)

**Pattern:** Same chip selection with Material styling.

```tsx
// Same component, with Material-inspired styles
const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8, // Material uses slightly rounded, not full pill
    borderWidth: 1,
    borderColor: '#79747E',
    backgroundColor: 'transparent',
  },
  chipSelected: {
    backgroundColor: '#8F5924',
    borderColor: '#8F5924',
  },
  chipText: {
    fontSize: 14,
    color: '#1C1B1F',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
});
```

---

### Date Picker (e.g., Date of Birth)

**Implementation Status:**
- [x] Best practices documented
- [ ] Web implemented
- [ ] iOS implemented  
- [ ] Android implemented
- [ ] Tested

**Data Storage:** DATE in database, ISO string in API

#### Web (React/Next.js)

**Pattern:** Native HTML date input.

```tsx
const DateInput = ({ label, value, onChange, maxDate }) => (
  <div>
    <label className="block text-sm font-medium mb-1">{label}</label>
    <input
      type="date"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      max={maxDate} // e.g., 18 years ago for DOB
      className="w-full px-3 py-2 border rounded-md"
    />
  </div>
);
```

#### iOS (Expo)

**Pattern:** iOS DatePicker wheel.

```tsx
import DateTimePicker from '@react-native-community/datetimepicker';

const DateInput = ({ label, value, onChange, maxDate }) => {
  const [show, setShow] = useState(false);

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity onPress={() => setShow(true)} style={styles.dateButton}>
        <Text>{value ? formatDate(value) : 'Select date...'}</Text>
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={value ? new Date(value) : new Date()}
          mode="date"
          display="spinner" // iOS wheel style
          maximumDate={maxDate}
          onChange={(event, date) => {
            setShow(false);
            if (date) onChange(date.toISOString().split('T')[0]);
          }}
        />
      )}
    </View>
  );
};
```

#### Android (Expo)

**Pattern:** Material DatePickerDialog.

```tsx
// Same component - display prop adapts
<DateTimePicker
  value={value ? new Date(value) : new Date()}
  mode="date"
  display="default" // Android shows calendar dialog
  maximumDate={maxDate}
  onChange={(event, date) => {
    setShow(false);
    if (date) onChange(date.toISOString().split('T')[0]);
  }}
/>
```

---

### Boolean Toggle (e.g., Has Kids)

**Implementation Status:**
- [x] Best practices documented
- [ ] Web implemented
- [ ] iOS implemented
- [ ] Android implemented
- [ ] Tested

**Data Storage:** BOOLEAN in database

#### Web (React/Next.js)

**Pattern:** Checkbox or toggle switch.

```tsx
const BooleanInput = ({ label, value, onChange }) => (
  <label className="flex items-center gap-2 cursor-pointer">
    <input
      type="checkbox"
      checked={value || false}
      onChange={(e) => onChange(e.target.checked)}
      className="w-4 h-4 rounded border-gray-300"
    />
    <span className="text-sm">{label}</span>
  </label>
);

// Or as a switch
const SwitchInput = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm">{label}</span>
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={`relative w-11 h-6 rounded-full transition ${
        value ? 'bg-primary' : 'bg-gray-200'
      }`}
    >
      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition ${
        value ? 'left-6' : 'left-1'
      }`} />
    </button>
  </div>
);
```

#### iOS (Expo)

**Pattern:** Native Switch component.

```tsx
import { Switch } from 'react-native';

const BooleanInput = ({ label, value, onChange }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
    <Text>{label}</Text>
    <Switch
      value={value || false}
      onValueChange={onChange}
      trackColor={{ false: '#E9E9EA', true: '#8F5924' }}
      thumbColor="#FFFFFF"
      ios_backgroundColor="#E9E9EA"
    />
  </View>
);
```

#### Android (Expo)

**Pattern:** Material Switch (same component).

```tsx
// Same Switch component adapts to Material style on Android
<Switch
  value={value || false}
  onValueChange={onChange}
  trackColor={{ false: '#E9E9EA', true: '#8F5924' }}
  thumbColor={value ? '#8F5924' : '#FAFAFA'}
/>
```

---

### Text Input (e.g., Name, City, Bio)

**Implementation Status:**
- [x] Best practices documented
- [ ] Web implemented
- [ ] iOS implemented
- [ ] Android implemented
- [ ] Tested

#### Web (React/Next.js)

**Pattern:** Standard input or textarea.

```tsx
const TextInput = ({ label, value, onChange, multiline, maxLength }) => (
  <div>
    <label className="block text-sm font-medium mb-1">{label}</label>
    {multiline ? (
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        rows={4}
        className="w-full px-3 py-2 border rounded-md resize-none"
      />
    ) : (
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        className="w-full px-3 py-2 border rounded-md"
      />
    )}
    {maxLength && (
      <p className="text-xs text-gray-500 mt-1">
        {(value || '').length}/{maxLength}
      </p>
    )}
  </div>
);
```

**Critical:** Input font size must be at least 16px to prevent iOS zoom.

#### iOS (Expo)

**Pattern:** Native TextInput.

```tsx
import { TextInput as RNTextInput } from 'react-native';

const TextInputComponent = ({ label, value, onChange, multiline, maxLength }) => (
  <View>
    <Text style={styles.label}>{label}</Text>
    <RNTextInput
      value={value || ''}
      onChangeText={onChange}
      maxLength={maxLength}
      multiline={multiline}
      numberOfLines={multiline ? 4 : 1}
      style={[
        styles.input,
        multiline && styles.textarea,
        { fontSize: 16 }, // CRITICAL: Prevent iOS zoom
      ]}
    />
    {maxLength && (
      <Text style={styles.charCount}>
        {(value || '').length}/{maxLength}
      </Text>
    )}
  </View>
);
```

#### Android (Expo)

**Pattern:** Same TextInput with Material underline style (optional).

```tsx
// Same component works on Android
// Can add Material styling if desired
```

---

## Form Field Patterns by Data Type

### Zodiac Sign

**Status:**
- [ ] Documented
- [ ] Web implemented
- [ ] iOS implemented
- [ ] Android implemented

**Options:** aries, taurus, gemini, cancer, leo, virgo, libra, scorpio, sagittarius, capricorn, aquarius, pisces

**Recommended Pattern:** Single-select dropdown/picker (see Single-Select pattern above)

---

### Ethnicity

**Status:**
- [ ] Documented
- [ ] Web implemented
- [ ] iOS implemented
- [ ] Android implemented

**Options:** TBD - Need to standardize
**Decision Needed:** Single select or multi-select?

**Recommended Pattern:** If single select, use dropdown. If multi (mixed heritage), use multi-select chips.

---

### Religion

**Status:**
- [ ] Documented
- [ ] Web implemented
- [ ] iOS implemented
- [ ] Android implemented

**Options:** TBD - Need to standardize
**Decision Needed:** Single select or multi-select?

**Recommended Pattern:** Single-select dropdown (most people identify with one religion)

---

### Political Views

**Status:**
- [ ] Documented
- [ ] Web implemented
- [ ] iOS implemented
- [ ] Android implemented

**Options:** liberal, conservative, moderate, libertarian, apolitical, other, prefer_not_to_say

**Recommended Pattern:** Single-select dropdown

---

### Pets

**Status:**
- [ ] Documented
- [ ] Web implemented
- [ ] iOS implemented
- [ ] Android implemented

**Options:** dogs, cats, birds, fish, reptiles, other, none

**Recommended Pattern:** Multi-select chips (people can have multiple pet types)

---

### Languages

**Status:**
- [ ] Documented
- [ ] Web implemented
- [ ] iOS implemented
- [ ] Android implemented

**Options:** TBD - Common languages list
**Recommended Pattern:** Multi-select with search/autocomplete (people speak multiple languages)

---

### Interests

**Status:**
- [ ] Documented (options need standardization)
- [ ] Web implemented
- [ ] iOS implemented
- [ ] Android implemented

**Options:** Need to standardize across platforms

**Recommended Pattern:** Multi-select chips (see Multi-Select pattern above)

---

## Verification Tiers

### Live Photo Verification (Required for Matching)

**Purpose:** Trust gate before meaningful interactions (likes, matches, messages)

**When Required:**
- NOT required: Registration, profile setup, browsing/viewing profiles
- REQUIRED: Before user can like someone, match, or message

**Implementation:**
- User can fully set up profile and explore the app
- When they try to like someone, prompt: "Verify you're real to start connecting"
- Take photo in-app with front camera (no uploads from gallery)
- Photo stored with timestamp as `verification_selfie_url`
- Badge shown on profile: "Verified"

**Database:**
```sql
-- Add to profiles table
is_photo_verified BOOLEAN DEFAULT FALSE,
photo_verified_at TIMESTAMPTZ,
verification_selfie_url TEXT
```

### ID Verification (Optional Premium Tier)

**Purpose:** Higher trust level for users who want maximum credibility

**Implementation:**
- Optional upgrade shown in profile settings
- Upload government ID (stored securely, not displayed)
- Manual or automated verification
- Premium badge: "ID Verified"

**Database:**
```sql
-- Add to profiles table
is_id_verified BOOLEAN DEFAULT FALSE,
id_verified_at TIMESTAMPTZ,
id_document_url TEXT  -- Stored securely, never publicly accessible
```

---

## Skip and "Prefer Not to Share" Patterns

### Skip Button

For optional fields, show a skip button that saves progress and moves to next field.

```tsx
// Web
<button 
  type="button" 
  onClick={onSkip}
  className="text-gray-500 underline"
>
  Skip for now
</button>

// Mobile
<TouchableOpacity onPress={onSkip}>
  <Text style={{ color: '#666', textDecorationLine: 'underline' }}>
    Skip for now
  </Text>
</TouchableOpacity>
```

### "Prefer Not to Share" Option

For sensitive fields, include this as a selectable option:

```typescript
// Add to options array for fields like religion, political views, ethnicity
const options = [
  // ... other options
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];
```

**Behavior:**
- Selecting "Prefer not to say" = explicit choice, don't prompt again
- Skipping = blank, may prompt later
- Store as `prefer_not_to_say` in database (not null)

---

## Responsive Layout Patterns

### Form Sections (Collapsible on Mobile)

**Web:** Grid layout with visible sections
**Mobile:** Collapsible accordion sections to reduce scroll

```tsx
// Mobile pattern
const CollapsibleSection = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <View>
      <TouchableOpacity 
        onPress={() => setIsOpen(!isOpen)}
        style={styles.sectionHeader}
      >
        <Text style={styles.sectionTitle}>{title}</Text>
        <ChevronIcon direction={isOpen ? 'up' : 'down'} />
      </TouchableOpacity>
      {isOpen && <View style={styles.sectionContent}>{children}</View>}
    </View>
  );
};
```

---

## Safe Area Handling

### iOS

```tsx
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';

// Wrap app
<SafeAreaProvider>
  <App />
</SafeAreaProvider>

// Use in screens
<SafeAreaView edges={['top', 'bottom']}>
  {/* Content */}
</SafeAreaView>
```

### Android

SafeAreaView handles Android's status bar and gesture navigation automatically.

### CSS for Bottom Elements

```tsx
// Add padding for home indicator on iOS
<View style={{ paddingBottom: insets.bottom }}>
  {/* Fixed bottom content */}
</View>
```

---

## Implementation Checklist Template

For each field, use this checklist:

```markdown
### [Field Name]

**Pattern:** [Which pattern from this doc]

- [ ] Best practices documented in ui_patterns.md
- [ ] Options standardized (same values across platforms)
- [ ] Web component implemented
- [ ] iOS component implemented (uses native pattern)
- [ ] Android component implemented (uses native pattern)
- [ ] Conversions working (if applicable)
- [ ] Skip/prefer not to say option added (if applicable)
- [ ] Cross-platform tested
- [ ] Signed off
```

---

## Progressive Signup / Profile Completion Flow

### Core Principles

1. **Save as you go** - Every step saves immediately, user never loses progress
2. **Allow skip** - Non-essential fields can be skipped
3. **"Prefer not to share"** - Explicit choice (different from skipped/blank)
4. **Resume at first unanswered** - When user returns, start where they left off
5. **Never lock out** - User can always access app, completion is encouraged not forced

### Field Categories

#### Required (Cannot Skip)
- Email + Password (registration)
- First Name
- Date of Birth (must be 18+)
- Gender
- Looking For (who they want to meet)

#### Strongly Encouraged (Can Skip, Will Prompt)
- Profile Photo
- Location (city/state)
- Bio

#### Optional (Can Skip, Won't Prompt Again)
Everything else - the user can fill these out if they want, or skip.

### Database Support for Flow

Add to `profiles` table:
```sql
-- Profile completion tracking
profile_completion_step INTEGER DEFAULT 0,  -- Last completed step
profile_completion_skipped TEXT[],          -- Fields explicitly skipped
profile_completion_prefer_not TEXT[],       -- Fields marked "prefer not to share"
profile_completed_at TIMESTAMPTZ,           -- When profile was fully completed
```

### Flow State Management

```typescript
interface ProfileCompletionState {
  currentStep: number;
  totalSteps: number;
  skippedFields: string[];
  preferNotToShareFields: string[];
  isComplete: boolean;
}

// Check if field should be prompted
const shouldPromptField = (
  fieldName: string, 
  fieldValue: any,
  state: ProfileCompletionState
): boolean => {
  // Never prompt if user explicitly chose "prefer not to share"
  if (state.preferNotToShareFields.includes(fieldName)) return false;
  
  // Don't prompt if user explicitly skipped (unless they're editing profile)
  if (state.skippedFields.includes(fieldName)) return false;
  
  // Prompt if field is blank
  return fieldValue === null || fieldValue === '' || fieldValue === undefined;
};
```

### Step Definitions

| Step | Fields | Required | Can Skip |
|------|--------|----------|----------|
| 1 | Email, Password | Yes | No |
| 2 | First Name, Last Name | First: Yes | Last: Yes |
| 3 | Date of Birth | Yes | No |
| 4 | Gender | Yes | No |
| 5 | Looking For | Yes | No |
| 6 | Profile Photo | No | Yes |
| 7 | City, State, Country | No | Yes |
| 8 | Height, Body Type | No | Yes |
| 9 | Bio | No | Yes |
| 10 | Interests | No | Yes |
| 11+ | Additional fields (grouped) | No | Yes |

### UI Flow

#### Initial Registration (All Platforms)

```
[Screen 1: Account Creation]
- Email input
- Password input (with confirmation)
- [Continue] button
→ Creates auth account immediately

[Screen 2: Basic Identity]
- First Name (required)
- Last Name (optional)
- [Continue] button
→ Saves to profile immediately

[Screen 3: Birthday]
- Date picker
- Shows calculated age
- Validation: Must be 18+
- [Continue] button
→ Saves immediately

[Screen 4: Gender]
- Single select: Male, Female, Non-binary, Other
- [Continue] button
→ Saves immediately

[Screen 5: Looking For]
- Multi-select: Men, Women, Non-binary, Everyone
- [Continue] button
→ Saves immediately

[Screen 6: Profile Photo]
- Photo upload/capture
- [Add Photo] button
- [Skip for now] link (smaller, secondary)
→ Saves immediately if added
→ Records skip if skipped

[Screen 7: Location]
- Auto-detect option
- Manual: City, State, Country inputs
- [Continue] button
- [Skip] link
→ Saves immediately

[Screen 8: About You]
- Height (feet + inches picker)
- Body Type (single select)
- [Continue] button
- [Skip] link
→ Saves immediately

[Screen 9: Your Bio]
- Textarea for bio
- Character counter
- [Continue] button
- [Skip] link
→ Saves immediately

[Screen 10: Interests]
- Multi-select chips
- [Continue] button
- [Skip] link
→ Saves immediately

[Screen 11: You're All Set!]
- Shows profile preview
- [Explore] button → Go to main app
- [Add More Details] link → Continue to optional fields
```

#### Returning User Flow

```typescript
// On app launch (after login)
const handleReturningUser = async (userId: string) => {
  const profile = await getProfile(userId);
  const completionState = await getCompletionState(userId);
  
  // Check for blank required fields
  const missingRequired = checkRequiredFields(profile);
  if (missingRequired.length > 0) {
    // Navigate to first missing required field
    navigateToStep(getStepForField(missingRequired[0]));
    return;
  }
  
  // Check for blank encouraged fields (not skipped)
  const blankEncouraged = checkEncouragedFields(profile, completionState);
  if (blankEncouraged.length > 0) {
    // Show gentle prompt (not blocking)
    showCompletionPrompt({
      field: blankEncouraged[0],
      onComplete: () => navigateToHome(),
      onSkip: () => {
        markAsSkipped(blankEncouraged[0]);
        navigateToHome();
      },
    });
    return;
  }
  
  // Profile is complete enough, go to home
  navigateToHome();
};
```

### Skip vs Prefer Not to Share

**Skip:**
- User didn't answer the field this time
- Field remains blank (`null`)
- We may prompt again later if it's an encouraged field
- User can fill it out anytime in profile edit

**Prefer Not to Share:**
- User explicitly chose not to share this information
- Stored as `prefer_not_to_say` value (not `null`)
- We never prompt again
- Displayed as "Prefers not to share" to others viewing profile (if applicable)

### UI for "Prefer Not to Share"

For sensitive fields (religion, political views, ethnicity, etc.), add a tertiary option:

```tsx
// Web
<div className="mt-2">
  <button 
    type="button"
    onClick={() => onChange('prefer_not_to_say')}
    className="text-sm text-gray-500 hover:text-gray-700"
  >
    I'd rather not share this
  </button>
</div>

// Mobile
<TouchableOpacity 
  onPress={() => onChange('prefer_not_to_say')}
  style={styles.preferNotToShare}
>
  <Text style={styles.preferNotToShareText}>
    I'd rather not share this
  </Text>
</TouchableOpacity>
```

### Progress Indicator

Show completion progress during signup and in profile settings:

```tsx
// Completion bar
const ProfileCompletion = ({ percentage }) => (
  <div className="w-full bg-gray-200 rounded-full h-2">
    <div 
      className="bg-primary h-2 rounded-full transition-all"
      style={{ width: `${percentage}%` }}
    />
  </div>
);

// Step indicator
const StepIndicator = ({ current, total }) => (
  <div className="flex gap-1">
    {Array.from({ length: total }).map((_, i) => (
      <div
        key={i}
        className={`w-2 h-2 rounded-full ${
          i < current ? 'bg-primary' : 
          i === current ? 'bg-primary/50' : 'bg-gray-300'
        }`}
      />
    ))}
  </div>
);
```

### Sync Between Platforms

When user completes a field on one platform, it should reflect on others:

1. Mobile saves field → API updates profile → Web shows updated value
2. Web saves field → API updates profile → Mobile shows updated value
3. Completion state stored in database, not local storage

### Edit Profile vs Signup

Both should offer the same fields, but:

**Signup:** Step-by-step wizard, encourages completion
**Edit Profile:** All fields visible, organized by category

In Edit Profile, show what's missing:
```tsx
{!profile.bio && (
  <div className="p-2 bg-yellow-50 rounded">
    <p className="text-sm text-yellow-800">
      Add a bio to help others get to know you!
    </p>
  </div>
)}
```
