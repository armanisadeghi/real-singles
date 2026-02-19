TypeScript strict patterns, anti-pattern elimination, and Supabase type flow enforcement.

Task: $ARGUMENTS

## Core Principle

**Supabase types are the source of truth.**

```
database.types.ts (auto-generated)
       ↓
db.ts (DbUser, DbProfile, etc.)
       ↓
AppUser, AppProfile (camelCase for frontend)
```

Never create standalone entity interfaces that don't derive from `database.types.ts`.

## Anti-Pattern Detection

### 1. Type Assertion Abuse (`as`)

```typescript
// DESTRUCTIVE — bypasses type checking
const user = data as User;
const profile = apiResponse as DbProfile;

// CORRECT — validate at runtime
const profile = ProfileSchema.parse(apiResponse);

// ACCEPTABLE uses of `as`
const STATUSES = ["active", "pending"] as const;
```

### 2. `any` Usage

```typescript
// WRONG
const data: any = await response.json();

// CORRECT
const data: unknown = await response.json();
// Then narrow with type guards or Zod validation
```

### 3. Loose Index Signatures

```typescript
// WRONG
interface Config { [key: string]: any; }

// CORRECT
interface Config { apiUrl: string; timeout: number; }
type FeatureFlags = Record<string, boolean>;
```

### 4. Optional Property Overuse

```typescript
// WRONG — allows impossible states
interface Order { id?: string; items?: Item[]; paidAt?: string; }

// CORRECT — model explicit states
interface DraftOrder { items: Item[] }
interface SubmittedOrder { id: string; userId: string; items: Item[]; submittedAt: string }
type Order = DraftOrder | SubmittedOrder;
```

### 5. Non-Exhaustive Switches

```typescript
// CORRECT
function getLabel(status: Status): string {
  switch (status) {
    case "active": return "Active";
    case "pending": return "Pending";
    default:
      const _exhaustive: never = status;
      throw new Error(`Unhandled: ${status}`);
  }
}
```

### 6. Unvalidated External Data

```typescript
// WRONG — trusts external data
const payload = (await request.json()) as WebhookPayload;

// CORRECT — runtime validation
import { z } from "zod";
const WebhookSchema = z.object({
  event: z.enum(["created", "updated", "deleted"]),
  data: z.record(z.unknown()),
});
const payload = WebhookSchema.parse(await request.json());
```

## Known Duplicate Types

| Manual Type (index.ts) | Should Use (db.ts) |
|------------------------|--------------------|
| `User` | `DbUser`, `AppUser` |
| `Profile` | `DbProfile`, `AppProfile` |
| `UserGallery` | `DbUserGallery`, `AppUserGallery` |
| `Event` | `DbEvent`, `AppEvent` |
| `Notification` | `DbNotification`, `AppNotification` |

The `*_OPTIONS` arrays in `index.ts` (GENDER_OPTIONS, etc.) are UI constants — fine to keep.

## Audit Commands

```bash
rg " as [A-Z]" --type ts -g '!*.d.ts' web/src/   # type assertions
rg ": any" --type ts web/src/                      # any usage
rg "^(interface|type) " --type ts web/src/ -o | sort | uniq -d  # duplicates
```

## Rules

1. Never recommend `any` as a solution
2. Prefer `unknown` + type guards over assertions
3. Always recommend Zod validation for external data
4. Reference `db.ts` types, not manual duplicates
5. Provide working code examples
