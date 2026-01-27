---
name: typescript-expert
description: Audit TypeScript code for type safety issues, anti-patterns, and duplicate type definitions. Use when fixing type errors, reviewing TypeScript code, auditing for "any" or "as" usage, checking for duplicate types, or ensuring Supabase types are used as source of truth.
---

# TypeScript Expert

Enforce strict typing, eliminate convenience anti-patterns, and ensure database types flow correctly from Supabase through to the frontend.

## Core Principle

**Supabase types are the source of truth.** All entity types must derive from `database.types.ts` → use `DbXxx` aliases from `db.ts` → convert to `AppXxx` for frontend when needed.

## Type Flow

```
database.types.ts (auto-generated)
       ↓
db.ts (DbUser, DbProfile, etc.)
       ↓
AppUser, AppProfile (camelCase for frontend)
```

**Never** create standalone entity interfaces that don't derive from `database.types.ts`.

## Audit Checklist

When reviewing TypeScript code, check for these issues in order of severity:

### Critical (Must Fix)

- [ ] **`any` usage** - Replace with `unknown` and narrow, or use proper type
- [ ] **Type assertions (`as`)** - Only allowed for `as const`; validate external data instead
- [ ] **Duplicate type definitions** - Entity types defined in multiple places
- [ ] **Manual entity types** - Types like `User`, `Profile` not derived from Supabase

### High (Should Fix)

- [ ] **Loose index signatures** - `[key: string]: any` or similar
- [ ] **Optional property overuse** - Use explicit state types instead
- [ ] **Non-exhaustive switches** - Missing `never` check on unions/enums
- [ ] **Untyped API responses** - External data used without validation

### Medium (Consider Fixing)

- [ ] **Implicit any from dependencies** - Missing type declarations
- [ ] **Overly permissive generics** - `T extends any` or unconstrained
- [ ] **Type-only validation** - No runtime check at system boundaries

## Quick Audit Commands

Run these to find common issues:

```bash
# Find type assertions (excluding "as const")
rg " as [A-Z]" --type ts --type tsx -g '!*.d.ts' web/src/

# Find any usage
rg ": any" --type ts --type tsx web/src/

# Find duplicate interface/type names
rg "^(interface|type) " --type ts --type tsx web/src/ -o | sort | uniq -d

# Find potential duplicate entity types
rg "^interface (User|Profile|Event|Match|Conversation)" --type ts --type tsx web/src/
```

## Correct Patterns

### Database → Frontend Type Flow

```typescript
// CORRECT: Import from db.ts
import type { DbUser, DbProfile, AppUser, dbUserToApp } from "@/types/db";

// In API route - use Db types
const { data } = await supabase.from("users").select("*");
const user: DbUser = data; // Type-safe from Supabase

// Convert for frontend response
return NextResponse.json({ user: dbUserToApp(user) });
```

```typescript
// WRONG: Manual type that can drift
interface User {
  id: string;
  email: string;
  // ... manually defined, will diverge from DB
}
```

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
  const payload = WebhookSchema.parse(body); // Runtime validation
  // payload is now typed AND validated
}
```

```typescript
// WRONG: Trust external data
export async function POST(request: Request) {
  const payload = (await request.json()) as WebhookPayload; // DANGEROUS
}
```

### Exhaustive Switch

```typescript
// CORRECT: Exhaustive check
type Status = "active" | "pending" | "completed";

function getLabel(status: Status): string {
  switch (status) {
    case "active":
      return "Active";
    case "pending":
      return "Pending";
    case "completed":
      return "Completed";
    default:
      const _exhaustive: never = status;
      throw new Error(`Unhandled status: ${status}`);
  }
}
```

### Explicit State Types

```typescript
// CORRECT: Explicit states
interface DraftOrder {
  items: Item[];
}

interface SubmittedOrder {
  id: string;
  userId: string;
  items: Item[];
  submittedAt: string;
}

type Order = DraftOrder | SubmittedOrder;
```

```typescript
// WRONG: Optional soup
interface Order {
  id?: string;
  userId?: string;
  items?: Item[];
  submittedAt?: string;
}
```

## Project-Specific Issues

### Known Duplicate Types in This Codebase

The `web/src/types/index.ts` file contains manually-defined types that duplicate the Supabase-generated types:

| Manual Type (index.ts) | Should Use (db.ts) |
| ---------------------- | ------------------ |
| `User`                 | `DbUser`, `AppUser` |
| `Profile`              | `DbProfile`, `AppProfile` |
| `UserGallery`          | `DbUserGallery`, `AppUserGallery` |
| `Event`                | `DbEvent`, `AppEvent` |
| `Notification`         | `DbNotification`, `AppNotification` |

**Action:** When you encounter code using types from `index.ts`, migrate to use `db.ts` types.

### Constants Are Fine

The `*_OPTIONS` arrays in `index.ts` (like `GENDER_OPTIONS`, `BODY_TYPE_OPTIONS`) are fine—these are UI constants, not database types.

## Fixing Workflow

1. **Identify the issue** using audit commands
2. **Determine the correct type source**:
   - Entity data → `db.ts` types
   - API request body → Zod schema validation
   - Component props → Define locally or in component file
3. **Update imports** to use correct types
4. **Add runtime validation** at system boundaries (API routes, webhooks, form handlers)
5. **Test** that the type flows correctly end-to-end

## Additional Resources

For detailed anti-pattern examples, see [anti-patterns-reference.md](anti-patterns-reference.md).
