# TypeScript Anti-Patterns Reference

Detailed examples of anti-patterns and their fixes for the RealSingles codebase.

---

## 1. Type Assertion Abuse

### The Problem

Type assertions (`as`) tell TypeScript "trust me"—they perform NO runtime validation.

```typescript
// DESTRUCTIVE - bypasses all type checking
const user = data as User;
const config = response as any as ConfigType; // Double assertion = double trouble

// This compiles but crashes at runtime if data is wrong shape
const profile = apiResponse as DbProfile;
profile.first_name.toUpperCase(); // 💥 if first_name is null/undefined
```

### The Fix

Validate at runtime, especially for external data:

```typescript
import { z } from "zod";

// Define schema that matches DbProfile structure
const ProfileSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid().nullable(),
  first_name: z.string().nullable(),
  // ... other fields
});

// Validate external data
const profile = ProfileSchema.parse(apiResponse);
// Now TypeScript AND runtime agree on the shape
```

### Acceptable Uses of `as`

```typescript
// OK: as const for literal types
const STATUSES = ["active", "pending", "completed"] as const;

// OK: Narrowing after type guard
if (isDbUser(data)) {
  const user = data as DbUser; // Already validated by type guard
}

// OK: DOM element casting after null check
const input = document.getElementById("email") as HTMLInputElement | null;
if (input) {
  input.value = "test@example.com";
}
```

---

## 2. Loose Index Signatures

### The Problem

Index signatures with `any` accept anything:

```typescript
// DESTRUCTIVE
interface Config {
  [key: string]: any;
}

const config: Config = {
  apiUrl: "https://api.example.com",
  timeout: "not a number", // Should be number, no error
  nested: { deeply: { invalid: true } }, // No structure enforcement
};
```

### The Fix

Use explicit keys or discriminated unions:

```typescript
// CORRECT: Explicit shape
interface Config {
  apiUrl: string;
  timeout: number;
  retryCount: number;
}

// CORRECT: If dynamic keys needed, be specific about value types
interface FeatureFlags {
  [featureName: string]: boolean;
}

// CORRECT: For truly dynamic data, use Record with constraints
type ApiHeaders = Record<string, string>;

// CORRECT: For JSON-like data, use a recursive type
type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
```

---

## 3. Duplicate/Divergent Type Definitions

### The Problem

Same concept defined in multiple places diverges over time:

```typescript
// In web/src/types/index.ts
interface User {
  id: string;
  email: string;
  phone?: string;
  status: "active" | "suspended" | "deleted";
}

// In web/src/types/db.ts (from Supabase)
export type DbUser = Tables<"users">;
// Has: id, email, phone, status, role, points_balance, referral_code...

// In some component
interface User {
  id: number; // WRONG TYPE! DB uses string
  name: string; // FIELD DOESN'T EXIST in DB
}
```

### The Fix

Single source of truth with derivation:

```typescript
// web/src/types/db.ts - ONLY place entity types are defined
export type DbUser = Tables<"users">; // From Supabase

// Derived types for specific use cases
export type UserForDisplay = Pick<DbUser, "id" | "email" | "display_name">;
export type UserForAuth = Pick<DbUser, "id" | "email" | "role">;

// Frontend-friendly version with camelCase
export interface AppUser {
  id: string;
  email: string;
  displayName: string | null;
  // ... maps 1:1 from DbUser
}
```

### Finding Duplicates

```bash
# Find all interface/type declarations with common entity names
rg "^(interface|type) (User|Profile|Event|Match|Conversation|Message)" \
  --type ts --type tsx web/src/ mobile/

# Check if same name appears in multiple files
rg "^interface User " --type ts -l web/src/
```

---

## 4. Optional Properties Overuse

### The Problem

Everything optional creates impossible states:

```typescript
// DESTRUCTIVE
interface Order {
  id?: string;
  userId?: string;
  items?: Item[];
  status?: "draft" | "submitted" | "paid";
  paidAt?: string;
  shippedAt?: string;
}

// These are all "valid" but nonsensical:
const badOrder1: Order = { paidAt: "2024-01-01" }; // Paid but no items?
const badOrder2: Order = { id: "123", status: "draft" }; // Has ID but is draft?
```

### The Fix

Model explicit states:

```typescript
// CORRECT: States are explicit
interface DraftOrder {
  items: Item[];
}

interface SubmittedOrder {
  id: string;
  userId: string;
  items: Item[];
  submittedAt: string;
}

interface PaidOrder extends SubmittedOrder {
  paidAt: string;
  paymentMethod: PaymentMethod;
}

interface ShippedOrder extends PaidOrder {
  shippedAt: string;
  trackingNumber: string;
}

// Discriminated union for type narrowing
type Order =
  | { status: "draft"; data: DraftOrder }
  | { status: "submitted"; data: SubmittedOrder }
  | { status: "paid"; data: PaidOrder }
  | { status: "shipped"; data: ShippedOrder };

// Now TypeScript enforces valid states
function processOrder(order: Order) {
  if (order.status === "paid") {
    // TypeScript knows order.data has paidAt
    console.log(`Paid at ${order.data.paidAt}`);
  }
}
```

---

## 5. Non-Exhaustive Switch/Conditionals

### The Problem

New values silently fall through:

```typescript
type MatchAction = "like" | "pass" | "super_like";

function getActionEmoji(action: MatchAction): string {
  if (action === "like") return "❤️";
  if (action === "pass") return "👎";
  return "❓"; // super_like falls here... and so will any NEW action
}

// Later, someone adds "boost" to MatchAction
// This function silently returns "❓" for "boost" - BUG
```

### The Fix

Exhaustive checking with `never`:

```typescript
function getActionEmoji(action: MatchAction): string {
  switch (action) {
    case "like":
      return "❤️";
    case "pass":
      return "👎";
    case "super_like":
      return "⭐";
    default:
      // TypeScript error if any case is missing
      const _exhaustive: never = action;
      throw new Error(`Unhandled action: ${action}`);
  }
}

// Alternative: exhaustive helper function
function assertNever(x: never): never {
  throw new Error(`Unexpected value: ${x}`);
}

function getActionEmoji(action: MatchAction): string {
  switch (action) {
    case "like":
      return "❤️";
    case "pass":
      return "👎";
    case "super_like":
      return "⭐";
    default:
      return assertNever(action);
  }
}
```

---

## 6. Implicit `any` from Untyped Dependencies

### The Problem

```typescript
// If 'untyped-package' has no types, this is implicitly 'any'
import { something } from "untyped-package";

something.anything.works(); // No errors, crashes at runtime
```

### The Fix

```typescript
// Option 1: Install @types package
// npm install -D @types/untyped-package

// Option 2: Declare module types
// In web/src/types/declarations.d.ts
declare module "untyped-package" {
  export function something(x: string): number;
  export interface Config {
    apiKey: string;
  }
}

// Option 3: Type the import explicitly
import { something } from "untyped-package";
const typedSomething = something as (x: string) => number;
```

---

## 7. Type-Only Validation (No Runtime)

### The Problem

Types disappear at runtime—external data can be anything:

```typescript
// DESTRUCTIVE
interface WebhookPayload {
  event: "user.created" | "user.deleted";
  userId: string;
  timestamp: string;
}

export async function POST(request: Request) {
  // TypeScript thinks this is WebhookPayload, but it could be ANYTHING
  const payload: WebhookPayload = await request.json();

  // If attacker sends { event: "malicious", userId: null }
  // This crashes or has security issues
  await processUser(payload.userId);
}
```

### The Fix

Validate at system boundaries:

```typescript
import { z } from "zod";

const WebhookPayloadSchema = z.object({
  event: z.enum(["user.created", "user.deleted"]),
  userId: z.string().uuid(),
  timestamp: z.string().datetime(),
});

type WebhookPayload = z.infer<typeof WebhookPayloadSchema>;

export async function POST(request: Request) {
  const body = await request.json();

  // Runtime validation - throws if invalid
  const payload = WebhookPayloadSchema.parse(body);

  // Now BOTH TypeScript AND runtime agree on the shape
  await processUser(payload.userId); // Safe
}
```

---

## 8. Convenience Patterns That Cause Problems

### Re-exporting with Looser Types

```typescript
// DESTRUCTIVE - loses type safety
// lib/api.ts
export async function fetchUser(id: string) {
  const response = await fetch(`/api/users/${id}`);
  return response.json(); // Returns Promise<any>
}

// CORRECT - preserve types
export async function fetchUser(id: string): Promise<AppUser> {
  const response = await fetch(`/api/users/${id}`);
  const data = await response.json();
  // Validate or at minimum type assert after checking
  if (!data || typeof data.id !== "string") {
    throw new Error("Invalid user response");
  }
  return data as AppUser;
}
```

### Generic Catch-All Types

```typescript
// DESTRUCTIVE
type ApiResponse<T = any> = {
  data: T;
  error?: string;
};

// Usage forgets to specify T, gets 'any'
const response: ApiResponse = await fetchSomething(); // data is 'any'

// CORRECT - require explicit type
type ApiResponse<T> = {
  data: T;
  error?: string;
};

// Now must specify: ApiResponse<User>
```

---

## Summary Rules

1. **Never use `as` except for `as const`**
2. **Never use `any`** - use `unknown` and narrow
3. **One type definition per concept, one location**
4. **Validate all external data at boundaries**
5. **Prefer explicit states over optional properties**
6. **Use exhaustive checks** on unions/enums
7. **Run `tsc --noEmit` in CI** - don't let type errors ship
