# RealSingles Project Tasks

## Code Updates
- [ ] 
- [ ] 

## Bugs
- [ ] Name/Last is in profile settings, and name you want to be called is in sign up - This is totally backwards and needs to be updated.
    - Confirmed: Mobile (`mobile/components/signup/PersonalDetails.tsx`) collects all three name fields in signup. Web flow is correct (legal names at registration, display name in onboarding). Fix needed on mobile side.

- [x] Sign-up process — **OVERHAULED** (37 steps, modern UI, all fixes applied)
    - [x] Smooth CSS fade+slide transitions between steps (no more blank page flash)
    - [x] Added ChevronsLeft/ChevronsRight icon-only navigation for go-to-start/skip-ahead
    - [x] Split combined steps: Relationship Goals → Marital Status + Dating Intentions; Beliefs → Religion + Political Views; Kids → Has Kids + Wants Kids
    - [x] Enter key advances between fields on keyboard steps; auto-continues on last field
    - [x] Title/subtitle always pinned at top; content centered vertically for non-keyboard steps
    - [x] Birthday step: age and zodiac sign on separate lines with zodiac emoji
    - [x] InterestedIn step now uses same OnboardingOptionCardsMulti as GenderStep
    - [x] Marital Status before Dating Intentions (separate steps, option cards)
    - [x] Dropdowns converted to option card lists: Body Type, Dating Intentions, Marital Status, Political Views, Has Kids, Wants Kids
    - [x] Location step: Zip code field added (DB column already existed)
    - [x] Religion and Political Views split into separate steps; Political Views uses option cards, Religion keeps dropdown (14 options)
    - [x] Habits: Each of Smoking, Drinking, Marijuana has its own "Prefer not to say" dropdown option
    - [x] Has Kids and Wants Kids split into 2 steps, each with option cards + "Prefer not to say"
    - [x] Complete step: ripple/radar animation with profile photo, "finding your matches" messaging
    - [x] Steps-config.ts fully restructured (34→37 steps), completion.ts step numbers updated
    - [ ] **TEST:** Walk through all 37 steps as a new user — verify no blank pages, no scroll on mobile, transitions smooth
    - [ ] **TEST:** Verify "Go to start" (ChevronsLeft) and "Skip ahead" (ChevronsRight) navigation works correctly
    - [ ] **TEST:** Verify Enter key advances between inputs on Location, Work, Social Links steps
    - [ ] **TEST:** Verify "Prefer not to say" works correctly on: Marital Status, Political Views, Has Kids, Wants Kids, Smoking, Drinking, Marijuana
    - [ ] **TEST:** Verify Birthday step shows age + zodiac on separate lines with emoji
    - [ ] **TEST:** Verify Zip Code field saves and appears on profile/admin views
    - [ ] **TEST:** Verify completion percentage calculates correctly with new 37-step structure
    - [ ] **TEST:** Verify mobile web (responsive) — no horizontal overflow, keyboard doesn't cause scroll on text steps
    - [ ] **TEST:** Verify the ripple animation on the final Complete step and that CTA buttons work
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
