# RealSingles - Native UI Patterns

**Purpose:** Native-first UI patterns for each component type across Web, iOS, and Android.

---

## Core Principle

Each platform should use its **native UI patterns**. Same data, native presentation.

> For native mobile guidelines, see `.cursor/rules/mobile-native-ios-android-rules.mdc`
> For bottom navigation specifically, see `BOTTOM_NAVIGATION_SPEC.md`

---

## Component Library Quick Reference

| Component Type | Web | iOS | Android |
|---------------|-----|-----|---------|
| Single Select | `<select>` dropdown | Wheel picker | Material dropdown/spinner |
| Multi Select | Chips | Chips | Chips with Material styling |
| Text Input | `<input type="text">` | Native TextInput | TextInput with Material styling |
| Date Picker | `<input type="date">` | iOS wheel DatePicker | Material DatePickerDialog |
| Number Input | `<input type="number">` | Wheel picker or stepper | Number keyboard |
| Toggle/Boolean | Switch | UISwitch | Material Switch |
| Textarea | `<textarea>` | Multi-line TextInput | Multi-line TextInput |
| Slider | `<input type="range">` | UISlider | Material Slider |

---

## Height Input (Feet + Inches)

**Storage:** `height_inches` INTEGER (total inches)

**Conversion:**
```typescript
const toInches = (feet: number, inches: number) => (feet * 12) + inches;
const fromInches = (total: number) => ({ feet: Math.floor(total / 12), inches: total % 12 });
```

| Platform | Pattern |
|----------|---------|
| Web | Two `<select>` dropdowns (feet: 4-7, inches: 0-11) |
| iOS | Two-column `@react-native-picker/picker` wheel |
| Android | Same picker (auto-adapts to dropdown style) |

---

## Single-Select (Gender, Body Type, Religion, etc.)

| Platform | Pattern |
|----------|---------|
| Web | Native `<select>` element |
| iOS | `@react-native-picker/picker` (wheel) |
| Android | Same picker (auto-adapts to dropdown) |

---

## Multi-Select (Interests, Looking For, Ethnicity)

**Storage:** TEXT[] (array)

All platforms use **chip/tag selection**:

```tsx
// Toggle selection
const toggle = (value: string) => {
  if (selected.includes(value)) {
    onChange(selected.filter(v => v !== value));
  } else {
    onChange([...selected, value]);
  }
};
```

| Platform | Styling |
|----------|---------|
| Web | `rounded-full` pill chips |
| iOS | Horizontal scroll, pill chips |
| Android | Material chips (slightly rounded, not full pill) |

---

## Date Picker

**Storage:** DATE (ISO string in API)

| Platform | Pattern |
|----------|---------|
| Web | `<input type="date">` |
| iOS | `@react-native-community/datetimepicker` with `display="spinner"` |
| Android | Same component with `display="default"` (calendar dialog) |

---

## Boolean Toggle

| Platform | Pattern |
|----------|---------|
| Web | Switch component |
| iOS/Android | React Native `Switch` (renders native `UISwitch`/Material Switch) |

```tsx
<Switch
  value={enabled}
  onValueChange={setEnabled}
  trackColor={{ true: '#8F5924' }}
/>
```

---

## Text Input

**Critical:** Minimum 16px font size to prevent iOS zoom.

| Platform | Pattern |
|----------|---------|
| Web | `<input>` or `<textarea>` |
| iOS/Android | React Native `TextInput` |

Always show character count for limited fields:
```tsx
{maxLength && <span>{value.length}/{maxLength}</span>}
```

---

## Skip & "Prefer Not to Say"

For optional/sensitive fields:

**Skip:** User didn't answer now. Field stays `null`. May prompt later.

**Prefer not to say:** Explicit choice. Stored as `prefer_not_to_say`. Never prompt again.

```tsx
// Add to options array for sensitive fields
{ value: 'prefer_not_to_say', label: 'Prefer not to say' }
```

---

## Safe Area Handling

Use `react-native-safe-area-context`:

```tsx
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// Wrap screens
<SafeAreaView edges={['top', 'bottom']}>
  {content}
</SafeAreaView>

// Bottom padding for fixed elements
const insets = useSafeAreaInsets();
<View style={{ paddingBottom: insets.bottom }}>
  {fixedBottomContent}
</View>
```

---

## Verification Flow

### Photo Verification (Required for Matching)

**When required:** Before user can like, match, or message.

**Flow:**
1. User explores app freely
2. On first like attempt: "Verify you're real to start connecting"
3. Take selfie in-app (front camera, no gallery uploads)
4. Photo stored with timestamp
5. Badge shown: "Verified"

### ID Verification (Optional Premium)

Optional upgrade for maximum credibility. Upload government ID for "ID Verified" badge.

---

## Profile Completion

### Field Categories

| Category | Behavior |
|----------|----------|
| **Required** | Cannot skip: email, password, first_name, dob, gender, looking_for |
| **Encouraged** | Can skip, will prompt later: photo, location, bio |
| **Optional** | Can skip, won't prompt: everything else |

### Database Tracking

```sql
profile_completion_step INTEGER DEFAULT 0,
profile_completion_skipped TEXT[],
profile_completion_prefer_not TEXT[],
profile_completed_at TIMESTAMPTZ
```

---

## Related Files

| Platform | Key Files |
|----------|-----------|
| Mobile options | `mobile/constants/options.ts` |
| Web options | `web/src/types/index.ts` |
| Tab navigation | `mobile/app/(tabs)/_layout.tsx` |
| Profile edit | `mobile/components/forms/EditProfileForm.tsx` |
