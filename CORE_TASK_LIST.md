# RealSingles Project Tasks

## Code Updates
- [ ] 
- [ ] 

## Bugs
- [ ] Name/Last is in profile settings, and name you want to be called is in sign up - This is totally backwards and needs to be updated.
    - Confirmed: Mobile (`mobile/components/signup/PersonalDetails.tsx`) collects all three name fields in signup. Web flow is correct (legal names at registration, display name in onboarding). Fix needed on mobile side.

- [ ] Sign-up process
    - [ ] This feature is not properly using next.js layouts and page layering... We need to have a consistent header and footer that update, as needed but we don't reload them constantly and cause the entire page to go blank after each question. 
    - [ ] We have a feature to skip ahead. Let's also add one to go back to start but we can remove words for both of them and just represent them with a nice icon that emplies forward and backwards, likely a lucid icon that's kind of like these: << >>
    - [ ] Some of the items in the sign up that are together should not be together
    - [ ] We want to make sure that when there is an input and you hit enter, if there is another field, it goes to that and if there is not, it does continue automatically
    - [ ] We need to have a consistent style and position to the label for each step and the description. They all need to be at the top so they don't jump around. (In fixing this, we cannot mess up the fact that we've worked hard to make sure these steps never scroll on mobile, even if the keyboard comes up for the ones that are text.)
    - [ ] The Birthday step shows age and sign at the bottom but the text wraps and looks horrible! This is a cool feature. Let's show it off by making them look nice and put the two facts on separate lines
    - [ ] Let's make 'who are you interested in' have the same compoonent as the one before it for gender for more consistentcy
    - [ ] "What are you looking for?" and "Marital Status" Should be two separate steps and marital status should come before dating intentions.
    - [ ] Avoid dropdowns when we can easily fit the options in a list instead that just shows the options. Only use a drodown if a list would not fit and would cause a scroll. There are manuy examples, but some of them are: Body type, Dating Intentions, Marital status, 
    - [ ] For "Where do you live?" we wnat to add a street address under city that makes it clear it's optional and only if you want to receive products/gifts. Also, zip code appears to be mising from here, which is confusing since I think that's what we use for figuring out match distances, but I could be wrong. This is a very important one. 
    - [ ] Religion and political views could be split into two steps and then their options could be a list, instead of dropdowns, much like education already is.
    - [ ] I like the 3 "Your habits" on the same page, but the "Prefer not to say" cannot be once. Each one that has that option must show it as an actual option. You can't combine something like that. Also, if it's possible to convert all to a list or another component, without causing a scroll, let's do it, but if it would scroll, then dropdowns with all options, including "prefer not to say" is ok.
    - [ ] About children: Both must be lists and the paage cannot scroll on mobile. If the page will scroll, then separate them into two steps.
    - [ ] On the final step where we welcome the person and say they can start matching, let's use our cool graphic from the 'likes' tab where it has an annimation that looks like it's doing something cool. We can use that to show them that we're working hard to find them their perfectly curated matches.

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
