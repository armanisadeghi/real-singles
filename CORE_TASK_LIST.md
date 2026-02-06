# RealSingles Project Tasks

## Code Updates
- [ ] 
- [ ] 

## Bugs
- [ ] Name/Last is in profile settings, and name you want to be called is in sign up - This is totally backwards and needs to be updated.
    - Confirmed: Mobile (`mobile/components/signup/PersonalDetails.tsx`) collects all three name fields in signup. Web flow is correct (legal names at registration, display name in onboarding). Fix needed on mobile side.

- [x] Sign-up process — **OVERHAULED** (1 remaining task)
    - [ ] **NOTE:** Street address field was NOT added — `street_address` column does not exist in DB. Needs a migration before adding to the UI.

- [ ]
- [ ]
- [ ]

## Feature Problems or Buildouts

- [x] Speed Dating System: Fully implemented (DB, API, mobile + web pages, admin portal, LiveKit video integration)
    - [x] Explore how we can make speed dating work functionally
    - [x] Technical implementation planning
    - [ ] Test: Verify end-to-end flow — admin creates session, user registers, joins, completes

- [x] Matchmakers System: Core system implemented
    - [x] People have a role as a matchmaker and they are able to go through profiles and match, etc. — separate `matchmakers` table with status tracking
    - [x] Add user type for "Matchmaker" role — implemented via `matchmakers` table (not a role in `users`)
    - [x] Build matchmaker dashboard — full portal at `/matchmaker-portal` (dashboard, discover, clients, introductions, analytics, messages, settings)
    - [x] Create profile review/matching interface — discover page with filters and multi-select
    - [x] Implement match suggestion workflow — introductions system with full API + UI
    - [x] Add matchmaker assignment system — client relationship system with status tracking
    - [ ] TODO: ARMAN — "Matchmakers can use much of the admin system" — currently they have their own separate components, not shared admin components. Decide if this is fine or if admin component reuse is still wanted.
    - [ ] Test: Verify matchmaker portal end-to-end — add client, discover profiles, create introduction, check analytics

- [ ] 
- [ ]
- [ ]
- [ ] 
- [ ]
- [ ]

## Needs from Silva
- [ ] Points System
    - [ ] How do you earn points? Exact rules and algorithms
    - Infrastructure exists (DB tables, API routes, UI pages, redemption) but earning rules are hardcoded to 0. Marketing page lists: signup 100pts, referrals 500pts, events 50-200pts, reviews 25-100pts — none are wired up. TODO: ARMAN — Get exact rules from Silva so they can be implemented.
- [ ]
    - [ ]
- [ ]
- [ ]
- [ ]
- [ ]
- [ ]
