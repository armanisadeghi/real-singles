# Route Naming Conventions

> **Official guide:** `~/.arman/rules/nextjs-best-practices/nextjs-guide.md` — Section 11 (Route Architecture & Conventions) covers route group ownership rules and conflict detection. This document covers project-specific route assignments.

This document establishes route naming conventions to prevent route conflicts between different route groups.

## Problem

Next.js route groups like `(app)`, `(marketing)`, and `(auth)` are organizational tools that don't affect the URL structure. This means routes with the same name in different groups will **conflict** and cause build errors.

**Example of conflict:**
- `(app)/about/page.tsx` → resolves to `/about`
- `(marketing)/about/page.tsx` → resolves to `/about`
- ❌ **Build Error:** Two pages resolve to the same path

## Route Ownership by Group

### `(marketing)` - Public Marketing Pages
**Purpose:** Public-facing pages for non-authenticated users

**Common routes:**
- `/about` - Company info, mission, values
- `/contact` - Contact form
- `/privacy-policy` - Privacy policy
- `/terms` - Terms of service
- `/faq` - Frequently asked questions
- `/team` - Team members
- `/membership` - Membership tiers
- `/safety` - Safety information

### `(app)` - Authenticated App Pages
**Purpose:** User-facing features requiring authentication

**Common routes:**
- `/profile` - User profile
- `/settings` - App settings
- `/discover` - Discovery feed
- `/matches` - Match list
- `/messages` - Message inbox
- `/app-info` - App version and update info (NOT `/about`)

### `(auth)` - Authentication Pages
**Purpose:** Login, signup, password reset flows

**Common routes:**
- `/login`
- `/register`
- `/forgot-password`

## Naming Rules

1. **Marketing pages get priority for generic names** like `/about`, `/contact`, `/faq`
2. **App pages should use specific names** that clearly indicate they're app features
3. **When in doubt, prefix with context:**
   - App-specific: `/app-info`, `/app-settings`
   - User-specific: `/my-profile`, `/my-messages`
4. **Check for conflicts before creating new routes:**
   ```bash
   # Run this command to find duplicate routes
   find src/app -type f -name "page.tsx" | \
     sed 's|src/app/||; s|/page.tsx||; s|(app)/||; s|(marketing)/||; s|(auth)/||' | \
     sort | uniq -d
   ```

## Historical Conflicts & Resolutions

| Conflict | Resolution | Date |
|----------|-----------|------|
| `(app)/about` vs `(marketing)/about` | Renamed `(app)/about` → `(app)/app-info` | 2026-02-03 |

## Before Adding a New Route

1. Check if the route name conflicts with other groups
2. Use the duplicate route checker command above
3. Choose a more specific name if conflict exists
4. Update this document if creating a new pattern
