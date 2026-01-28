# External Services Setup Tracker

**Last Updated:** January 23, 2026

---

## 1. Agora (Chat & Video/Voice Calls)

**Console:** https://console.agora.io/

**Status:** ✅ Complete

### What You Have
| Item | Value | Status |
|------|-------|--------|
| App ID | `789a51976aad45dba05343b8f1137d89` | ✅ Have |
| App Certificate | `494dab7988de4cdeb15b4c8a4930335d` | ✅ Have |
| AppKey (Chat) | `4110015888#1651644` | ✅ Have |
| OrgName | `4110015888` | ✅ Have |
| AppName | `1651644` | ✅ Have |
| WebSocket Address | `msync-api-41.chat.agora.io` | ✅ Have |
| REST API | `a41.chat.agora.io` | ✅ Have |

### Environment Variables to Set

**Web (`web/.env.local`):**
```env
AGORA_APP_ID=789a51976aad45dba05343b8f1137d89
AGORA_APP_CERTIFICATE=494dab7988de4cdeb15b4c8a4930335d
AGORA_CHAT_APP_KEY=4110015888#1651644
```

**Mobile (`mobile/.env`):**
```env
EXPO_PUBLIC_AGORA_APP_ID=789a51976aad45dba05343b8f1137d89
EXPO_PUBLIC_AGORA_CHAT_APP_KEY=4110015888#1651644
```

### How to Get Missing Items
1. Go to https://console.agora.io/
2. Select your project (or create one if needed)
3. Click on the project name to open Project Settings
4. **App ID** is shown at the top
5. **App Certificate** - Click "Enable" if not enabled, then click the eye icon to reveal

### Additional Setup
- [ ] Enable Chat product in Agora Console
- [ ] Enable RTC product in Agora Console (for video/voice calls)
- [ ] Install token package: `cd web && pnpm add agora-token`

---

## 2. Twilio (SMS/Phone Verification)

**Console:** https://console.twilio.com/

**Status:** ❌ Not Started

### What You Need
| Item | Where to Find | Status |
|------|---------------|--------|
| Account SID | Console Dashboard (top of page) | ❌ Need |
| Auth Token | Console Dashboard (click to reveal) | ❌ Need |
| Phone Number | Phone Numbers → Manage → Buy a number | ❌ Need |

### Environment Variables to Set

**Web (`web/.env.local`):**
```env
TWILIO_ACCOUNT_SID=<your-account-sid>
TWILIO_AUTH_TOKEN=<your-auth-token>
TWILIO_PHONE_NUMBER=+1234567890
```

### How to Set Up
1. Sign up at https://www.twilio.com/try-twilio
2. Verify your email and phone number
3. From the Console Dashboard, copy Account SID and Auth Token
4. Go to Phone Numbers → Manage → Buy a number
5. Choose a number with SMS capability

### Cost Estimate
- Phone number: ~$1.15/month
- SMS messages: ~$0.0079/message (US)

---

## 3. Resend (Transactional Email + Supabase Auth SMTP)

**Console:** https://resend.com/

**Status:** ✅ API Key Created | ⏳ Domain: Using dev domain (updates.aimatrx.com)

### What You Have
| Item | Where to Find | Status |
|------|---------------|--------|
| API Key | API Keys → "RealSingles Production" | ✅ Have |
| Dev Domain | updates.aimatrx.com | ✅ Verified |
| Production Domain | realsingles.com | ⏳ Pending access |

### Environment Variables to Set

**Web (`web/.env.local`):**
```env
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=RealSingles <noreply@updates.aimatrx.com>
```

**When switching to production domain, update EMAIL_FROM to:**
```env
EMAIL_FROM=RealSingles <noreply@realsingles.com>
```

### Supabase Auth SMTP Configuration

Resend also handles Supabase Auth emails (password reset, magic links, verification).

**Configure in Supabase Dashboard → Project Settings → Authentication → SMTP:**

| Field | Value |
|-------|-------|
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | Your RESEND_API_KEY |
| Sender email | `noreply@updates.aimatrx.com` (or production domain) |
| Sender name | `RealSingles` |

### How to Switch Domains (When Ready)
1. Go to https://resend.com/domains
2. Add Domain → `realsingles.com`
3. Add the DNS records Resend provides (SPF, DKIM, DMARC)
4. Wait for verification
5. Update `EMAIL_FROM` in:
   - `web/.env.local`
   - Vercel environment variables
   - Supabase SMTP settings

---

## 4. Google Maps Platform

**Console:** https://console.cloud.google.com/

**Status:** ❌ Not Started

### What You Need
| Item | Where to Find | Status |
|------|---------------|--------|
| API Key | APIs & Services → Credentials → Create Credentials | ❌ Need |

### Environment Variables to Set

**Web (`web/.env.local`):**
```env
GOOGLE_MAPS_API_KEY=<your-api-key>
```

**Mobile (`mobile/.env`):**
```env
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=<your-api-key>
```

### How to Set Up
1. Go to https://console.cloud.google.com/
2. Create a new project or select existing
3. Go to APIs & Services → Library
4. Enable these APIs:
   - Maps SDK for Android
   - Maps SDK for iOS
   - Places API (if using location search)
5. Go to APIs & Services → Credentials
6. Create Credentials → API Key
7. **Recommended:** Restrict the key to your app's bundle IDs

---

## 5. Google OAuth (Social Login)

**Console:** https://console.cloud.google.com/

**Status:** ❌ Not Started

### What You Need
| Item | Where to Find | Status |
|------|---------------|--------|
| Web Client ID | APIs & Services → Credentials | ❌ Need |
| Web Client Secret | APIs & Services → Credentials | ❌ Need |
| Android Client ID | APIs & Services → Credentials | ⚠️ Existing (verify) |
| iOS Client ID | APIs & Services → Credentials | ❌ Need |

### Current Android Client ID (verify this is correct)
```
1022558301980-q16c22pud1ad3trh6am40oljr3g83m2n.apps.googleusercontent.com
```

### How to Set Up
1. Go to https://console.cloud.google.com/
2. APIs & Services → Credentials → Create Credentials → OAuth Client ID
3. Create three client IDs:
   - **Web application** (for Supabase backend)
   - **Android** (package: `com.nayannew9.truSingle`)
   - **iOS** (bundle ID: `com.nayannew9.truSingle`)
4. **Supabase Setup:**
   - Go to Supabase Dashboard → Authentication → Providers → Google
   - Add the Web Client ID and Client Secret

---

## 6. Apple Sign In (Social Login)

**Console:** https://developer.apple.com/

**Status:** ❌ Not Started

### What You Need
| Item | Where to Find | Status |
|------|---------------|--------|
| Services ID | Certificates, Identifiers & Profiles | ❌ Need |
| Private Key (.p8) | Keys section | ❌ Need |
| Team ID | Membership details | ❌ Need |
| Key ID | Keys section | ❌ Need |

### How to Set Up
1. Go to https://developer.apple.com/account/
2. **Enable Sign In with Apple for your App ID:**
   - Certificates, Identifiers & Profiles → Identifiers
   - Select your App ID → Enable "Sign In with Apple"
3. **Create a Services ID (for web):**
   - Identifiers → Create new → Services IDs
   - Configure the return URLs
4. **Create a Key:**
   - Keys → Create new → Enable "Sign In with Apple"
   - Download the .p8 file (only available once!)
5. **Supabase Setup:**
   - Go to Supabase Dashboard → Authentication → Providers → Apple
   - Add Services ID, Team ID, Key ID, and upload private key

---

## 7. Push Notifications (Optional)

**Status:** ❌ Not Started

### Option A: Expo Push Notifications

**Console:** https://expo.dev/

| Item | Where to Find | Status |
|------|---------------|--------|
| Access Token | Account Settings → Access Tokens | ❌ Need |

**Environment Variable:**
```env
EXPO_ACCESS_TOKEN=<your-token>
```

### Option B: OneSignal

**Console:** https://onesignal.com/

| Item | Where to Find | Status |
|------|---------------|--------|
| App ID | Settings → Keys & IDs | ❌ Need |
| REST API Key | Settings → Keys & IDs | ❌ Need |

**Environment Variables:**
```env
ONESIGNAL_APP_ID=<your-app-id>
ONESIGNAL_REST_API_KEY=<your-rest-api-key>
```

---

## Quick Status Summary

| Service | Account Created | Credentials Obtained | Env Vars Set | Tested |
|---------|-----------------|---------------------|--------------|--------|
| Agora | ✅ | ✅ | ✅ | ❌ |
| Twilio | ❌ | ❌ | ❌ | ❌ |
| Resend | ✅ | ✅ | ✅ | ⏳ |
| Google Maps | ❌ | ❌ | ❌ | ❌ |
| Google OAuth | ❌ | ❌ | ❌ | ❌ |
| Apple Sign In | ❌ | ❌ | ❌ | ❌ |
| Push Notifications | ❌ | ❌ | ❌ | ❌ |

---

## Environment Files Checklist

### Web (`web/.env.local`)

```env
# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Agora
AGORA_APP_ID=789a51976aad45dba05343b8f1137d89
AGORA_APP_CERTIFICATE=494dab7988de4cdeb15b4c8a4930335d
AGORA_CHAT_APP_KEY=4110015888#1651644

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=RealSingles <noreply@updates.aimatrx.com>

# Twilio (SMS/OTP)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Google Maps
GOOGLE_MAPS_API_KEY=

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=RealSingles
```

### Mobile (`mobile/.env`)

```env
# API
EXPO_PUBLIC_API_URL=http://localhost:3000/api

# Supabase
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=

# Agora
EXPO_PUBLIC_AGORA_APP_ID=789a51976aad45dba05343b8f1137d89
EXPO_PUBLIC_AGORA_CHAT_APP_KEY=4110015888#1651644

# Google Maps
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=
```

---

## Notes

- Keep all API keys and secrets secure - never commit them to git
- For production, use environment variables in Vercel/hosting platform
- Test each service after configuration before marking as complete
