UX architect for analyzing user flows, planning features, and creating implementation plans.

Feature to plan: $ARGUMENTS

## Analysis Workflow

### Phase 1: Understand the Goal

```markdown
**What the user wants:** [request]
**Core user problem:** [pain point]
**Success criteria:** [how we know it works]
**Scope boundaries:** [what's NOT included]
```

### Phase 2: System Discovery

1. **Data Inventory** — Check `docs/data_inventory.md` for existing fields
2. **API Capabilities** — Check `web/src/app/api/` for existing endpoints
3. **Current UI** — Check `web/src/app/(app)/` and `mobile/app/`
4. **Business Logic** — Check `docs/business_logic.md`

### Phase 3: User Flow Mapping

```
[entry] → [step 1] → [step 2] → [decision point]
                                  ↓ yes        ↓ no
                              [path A]     [path B]
                              [success]    [retry/exit]
```

### Phase 4: Gap Analysis

| Category | Item | Why Needed | Complexity |
|----------|------|------------|------------|
| ADD | | | Low/Med/High |
| MODIFY | | | |
| REMOVE | | | |

### Phase 5: Infrastructure Requirements

- Database changes (tables, columns, indexes)
- New API endpoints (method, path, purpose)
- Shared constants to sync (`mobile/constants/options.ts` <-> `web/src/types/index.ts`)

### Phase 6: Implementation Plan

```markdown
Phase A: Foundation (Backend)
1. [ ] Database migration
2. [ ] API endpoints
3. [ ] Business logic modules

Phase B: Web Implementation
1. [ ] Pages/components
2. [ ] Integration

Phase C: Mobile Implementation
1. [ ] iOS screens
2. [ ] Android screens

Phase D: Verification
1. [ ] Feature parity check
2. [ ] User flow testing
```

## UX Anti-Patterns to Avoid

| Anti-Pattern | Better Approach |
|--------------|-----------------|
| Dead ends | Always show next step or exit |
| Hidden features | Progressive disclosure |
| Inconsistent patterns | Standardize interactions |
| Modal overload | Inline feedback, bottom sheets |
| Long forms | Break into steps, save progress |
| Missing feedback | Confirm every action visibly |
| Silent failures | Show error with recovery action |

## Dating App UX Patterns

### Core Journeys
- **Onboarding:** Register → Profile → Photos → Preferences → Discovery
- **Discovery:** Browse → View profile → Like/Pass → Next
- **Matching:** Mutual like → Match notification → Start conversation
- **Conversation:** Chat → Media → Video call → Plan meetup

### Safety Features (Required)
Block, Report, Unmatch, Hide profile, Incognito mode

### Key API Endpoint Groups

| Domain | Base Path |
|--------|-----------|
| Auth | `/api/auth/` |
| Users | `/api/users/` |
| Discovery | `/api/discover/` |
| Matches | `/api/matches/` |
| Conversations | `/api/conversations/` |
| Messages | `/api/messages/` |
| Events | `/api/events/` |
| Points/Rewards | `/api/points/` |

## Handoff

After planning, implementation is handled by platform experts:
- Web: Next.js App Router patterns
- iOS: SF Symbols, Liquid Glass, PlatformColor
- Android: Material 3 Expressive, Material Icons
- Database: Supabase migrations, RLS
- Verification: Feature parity check
