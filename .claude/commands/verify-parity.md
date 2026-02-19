Cross-platform feature parity verification across Web Desktop, Web Mobile, iOS, and Android.

Feature to verify: $ARGUMENTS

## Verification Workflow

### Phase 1: Discovery

1. Search for the feature across both codebases:
   - `web/src/` (web implementation)
   - `mobile/` (mobile implementation)
   - `web/src/app/api/` (API routes)

2. Document what each platform does:
   - Operations supported
   - Data displayed
   - User interactions
   - Platform-specific behaviors

3. Create functionality inventory:

| Operation | Web | Mobile | API Endpoint |
|-----------|-----|--------|--------------|
| ... | | | |

**CRITICAL:** If one platform has functionality the others don't, ADD it — never remove it.

### Phase 2: Native Verification

**Web Desktop:** Hover states, keyboard nav, modals (not sheets), desktop spacing
**Web Mobile:** 44px touch targets, no hover-dependent UI, `h-dvh`, `pb-safe`, 16px+ fonts
**iOS:** SF Symbols, native sheets, haptics, system colors, safe areas
**Android:** Material Icons, Material patterns, back button, ripple effects

**Red Flags:** Custom JS bottom tabs, emoji as icons, JS animations instead of Reanimated

### Phase 3: Functionality Parity Matrix

| Capability | Web Desktop | Web Mobile | iOS | Android | Notes |
|------------|-------------|------------|-----|---------|-------|
| ... | | | | | |

### Phase 4: API Consistency

- All platforms call same API endpoints
- No business logic in client code
- Constants synced: `mobile/constants/options.ts` <-> `web/src/types/index.ts`

### Phase 5: Sister Functionality Audit

| If you changed... | Also check... |
|-------------------|---------------|
| Events | Calendar views, notifications, home feed, search |
| User profiles | Match cards, chat headers, review displays |
| Photos/Gallery | Profile previews, thumbnails, chat images |
| Settings | Any feature reading those preferences |

## Completion Report

```markdown
## Feature Parity Report: [Feature Name]

### Status: VERIFIED / ISSUES FOUND

### Platform Status
| Platform | Status | Notes |
|----------|--------|-------|
| Web Desktop | | |
| Web Mobile | | |
| iOS | | |
| Android | | |

### API Verification
- Endpoints: [list]
- Logic location: [path]

### Sister Features Updated
- [list]

### Remaining Issues
- [list]
```
