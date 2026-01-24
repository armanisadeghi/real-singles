# RealSingles - Technical Overview

**Project:** Dating app with dual platforms sharing a single backend.

---

## Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Database | Supabase (PostgreSQL) | Real-time, RLS |
| Auth | Supabase Auth | Email, Apple, Google |
| Backend API | Next.js 16 App Router | 76+ REST endpoints |
| Hosting | Vercel | Edge functions |
| Mobile | React Native / Expo | iOS + Android |
| Chat | Agora Chat SDK | |
| Video/Voice | Agora RTC SDK | |
| Storage | Supabase Storage | avatars, gallery, events |
| Email | Resend | Transactional |
| SMS/OTP | Twilio | Phone verification |

---

## Project Structure

```
/mobile          → Expo app (iOS + Android)
/web             → Next.js app (API + Web UI)
  /src/app/api/  → All API routes
  /src/app/(app)/→ Authenticated pages
  /supabase/     → Migrations
/docs            → This documentation
/.cursor/rules/  → AI development rules (source of truth)
```

---

## API Architecture

All API routes live in `web/src/app/api/`. Mobile calls these via `mobile/lib/api.ts`.

**Key endpoint groups:** auth, users, matches, conversations, events, rewards, speed-dating, notifications

For complete field definitions and integration status, see `data_inventory.md`.

---

## App Store Deployment

### Apple Requirements

- Apps must be built with **Xcode 16** / **iOS 18 SDK**
- Starting **April 2026**: iOS 26 SDK required

**Account needs:**
- Apple Developer account access (Admin or App Manager role)
- Bundle ID: `com.nayannew9.truSingle`
- Distribution certificate and provisioning profile

### Google Play Requirements

- Apps must target **Android 14 (API 34)+**
- **August 2026**: Expected Android 15 (API 35) requirement

**Account needs:**
- Google Play Console access (Release Manager or Admin)
- Package: `com.nayannew9.truSingle`
- Upload key for AAB files

### EAS Build

```bash
# Build for production
eas build --platform all --profile production

# Submit to stores
eas submit --platform ios --profile production
eas submit --platform android --profile production
```

---

## Matching Algorithm

Compatibility scoring considers:

1. **Location proximity** (25%)
2. **Age preference match** (15%)
3. **Shared interests** (20%)
4. **Lifestyle compatibility** (20%) - smoking, drinking, kids, etc.
5. **Verification bonus** (10%)
6. **Activity recency** (10%)

---

## Outstanding Items

### Integration
- [ ] Agora RTC setup verification (video/voice)
- [ ] Push notifications (Expo Push or OneSignal)
- [ ] Twilio SMS configuration

### Mobile
- [ ] iOS safe area fixes (in progress)
- [ ] Keyboard handling improvements
- [ ] Expo SDK upgrade (53 → 54)

### Deployment
- [ ] Apple Developer account access from client
- [ ] Google Play Console access from client
- [ ] EAS credentials configuration

---

## Related Documentation

| Doc | Purpose |
|-----|---------|
| `data_inventory.md` | Complete field inventory (source of truth) |
| `business_logic.md` | Core business requirements |
| `EXTERNAL_SERVICES_SETUP.md` | Third-party credentials |
| `ui_patterns.md` | Component patterns |
| `.cursor/rules/` | Development rules |
