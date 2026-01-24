# RealSingles

A modern dating application with real-time matching, chat, video calls, events, and a rewards system.

## Project Structure

```
real-singles/
├── docs/                    # Project documentation
│   ├── project_requirements.md   # Full technical requirements
│   └── initial_analysis.md       # Analysis of original (botched) codebase
├── mobile/                  # React Native/Expo mobile app
│   ├── app/                 # Expo Router screens
│   ├── components/          # Reusable UI components
│   ├── lib/                 # API client, utilities
│   └── services/            # Agora chat services
└── web/                     # Next.js 16 backend API
    └── src/
        ├── app/api/         # API routes
        ├── lib/             # Server utilities (Supabase, Agora, Email)
        └── types/           # TypeScript types
```

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Database | Supabase (PostgreSQL) | Data storage, real-time subscriptions |
| Authentication | Supabase Auth | User auth, social login (Apple, Google) |
| Backend API | Next.js 16 (App Router) | REST API endpoints |
| Hosting | Vercel | API hosting, edge functions |
| Mobile App | React Native / Expo SDK 53 | iOS & Android app |
| Real-time Chat | Agora Chat SDK | Messaging |
| Video/Voice Calls | Agora RTC SDK | Calls |
| File Storage | Supabase Storage | User photos, videos |
| Email | Resend | Transactional emails |
| SMS/OTP | Twilio | Phone verification |

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm (for web)
- npm (for mobile)
- Expo CLI
- Supabase project
- Agora account

### Backend (Web)

```bash
cd web
cp .env.example .env.local
# Edit .env.local with your credentials
pnpm install
pnpm dev
```

The API will be available at `http://localhost:3000/api`

### Mobile App

```bash
cd mobile
cp .env.example .env
# Edit .env with your credentials
npm install
npx expo start
```

## API Endpoints

See `/docs/project_requirements.md` for complete API documentation.

### Core Endpoints

| Category | Endpoints |
|----------|-----------|
| Auth | `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/session` |
| Users | `/api/users/me`, `/api/users/[id]` |
| Discovery | `/api/discover`, `/api/discover/top-matches`, `/api/discover/nearby` |
| Matching | `/api/matches`, `/api/favorites` |
| Chat | `/api/conversations`, `/api/agora/chat-token` |
| Events | `/api/events`, `/api/speed-dating` |
| Rewards | `/api/points`, `/api/products`, `/api/orders` |

## Database Setup

The database schema is defined in `/docs/project_requirements.md` (Section 2). Tables include:

- `users` - Core user accounts
- `profiles` - Extended profile information
- `user_gallery` - Photos and videos
- `matches` - Like/pass actions
- `conversations` - Chat threads
- `events` - In-person and virtual events
- `virtual_speed_dating` - Speed dating sessions
- `products` - Redeemable rewards
- And more...

## Environment Variables

### Web (.env.local)

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
AGORA_APP_ID=
AGORA_APP_CERTIFICATE=
RESEND_API_KEY=
```

### Mobile (.env)

```env
EXPO_PUBLIC_API_URL=
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_AGORA_APP_ID=
```

## Development Phases

1. **Phase 1: Foundation** - Auth, database, basic API
2. **Phase 2: Core Features** - Profiles, discovery, matching
3. **Phase 3: Communication** - Chat, calls (Agora integration)
4. **Phase 4: Events & Social** - Events, speed dating, rewards
5. **Phase 5: Mobile Fixes** - iOS safe area, keyboard, API integration
6. **Phase 6: Polish** - Testing, optimization, documentation

## License

Proprietary - All rights reserved
