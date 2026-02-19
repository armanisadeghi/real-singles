Audit TypeScript code for type safety anti-patterns.

Scope: $ARGUMENTS (specific files, a feature, or full audit)

## Core Principle

**Supabase types are the source of truth.** All entity types must derive from:

```
database.types.ts (auto-generated)
       ↓
db.ts (DbUser, DbProfile, etc.)
       ↓
AppUser, AppProfile (camelCase for frontend)
```

Never create standalone entity interfaces that don't derive from `database.types.ts`.

## Issue Severity

### Critical (Must Fix)
- **`any` usage** — Replace with `unknown` and narrow, or use proper type
- **Type assertions (`as`)** — Only allowed for `as const`; validate external data instead
- **Duplicate type definitions** — Entity types defined in multiple places
- **Manual entity types** — Types like `User`, `Profile` not derived from Supabase

### High (Should Fix)
- **Loose index signatures** — `[key: string]: any` or similar
- **Optional property overuse** — Use explicit state types instead
- **Non-exhaustive switches** — Missing `never` check on unions/enums
- **Untyped API responses** — External data used without validation

### Medium (Consider)
- **Implicit any from dependencies** — Missing type declarations
- **Overly permissive generics** — `T extends any` or unconstrained

## Correct Patterns

### External Data Validation

```typescript
// CORRECT: Validate at boundaries
import { z } from "zod";

const WebhookSchema = z.object({
  event: z.enum(["created", "updated", "deleted"]),
  data: z.record(z.unknown()),
});

export async function POST(request: Request) {
  const body = await request.json();
  const payload = WebhookSchema.parse(body);
}
```

### Exhaustive Switch

```typescript
type Status = "active" | "pending" | "completed";

function getLabel(status: Status): string {
  switch (status) {
    case "active": return "Active";
    case "pending": return "Pending";
    case "completed": return "Completed";
    default:
      const _exhaustive: never = status;
      throw new Error(`Unhandled status: ${status}`);
  }
}
```

### Explicit State Types (over optional properties)

```typescript
// CORRECT
interface DraftOrder { items: Item[] }
interface SubmittedOrder { id: string; userId: string; items: Item[]; submittedAt: string }
type Order = DraftOrder | SubmittedOrder;

// WRONG: Optional soup
interface Order { id?: string; userId?: string; items?: Item[]; submittedAt?: string }
```

## Known Duplicate Types

`web/src/types/index.ts` contains manually-defined types that duplicate Supabase types. When you encounter code using these, migrate to `db.ts` types:

| Manual Type (index.ts) | Should Use (db.ts) |
|------------------------|-------------------|
| `User` | `DbUser`, `AppUser` |
| `Profile` | `DbProfile`, `AppProfile` |
| `UserGallery` | `DbUserGallery`, `AppUserGallery` |
| `Event` | `DbEvent`, `AppEvent` |
| `Notification` | `DbNotification`, `AppNotification` |

The `*_OPTIONS` arrays in `index.ts` (like `GENDER_OPTIONS`, `BODY_TYPE_OPTIONS`) are UI constants — these are fine.

## Output Format

1. **Summary** — Number of issues by severity
2. **Critical Issues** — Must fix before merge
3. **High Issues** — Should fix soon
4. **Medium Issues** — Consider fixing
5. **Specific Fixes** — Code examples for top issues

## Rules

1. Never recommend `any` as a solution
2. Prefer `unknown` + type guards over type assertions
3. Always recommend Zod validation for external data
4. Reference `db.ts` types, not manual duplicates
5. Provide working code examples, not just descriptions
