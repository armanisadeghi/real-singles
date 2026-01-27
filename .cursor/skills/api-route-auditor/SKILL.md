---
name: api-route-auditor
description: Audit API routes for business logic ownership, type safety, validation, and production hardening. Use when reviewing API routes, creating new endpoints, checking for logic leakage in components, or ensuring endpoints meet production standards. Also use when the user mentions API audit, endpoint review, logic leakage, or validation patterns.
---

# API Route Auditor

> **The API is the product** — every endpoint should be idempotent where it matters, validated at entry, rate-limited, transactional when needed, versioned for mobile longevity, and tested as if a malicious client will call it with garbage at 3 AM.

## Quick Audit Checklist

Copy this checklist when auditing:

```
API Route Audit: [route path]
- [ ] Logic ownership: No business logic in calling components
- [ ] Type safety: No `any`, proper DB types, typed request/response
- [ ] Validation: Server validates ALL input, never trusts client
- [ ] Auth: Uses createApiClient(), checks user, verifies ownership
- [ ] Response format: { success, data/msg } standard shape
- [ ] Error handling: Correct status codes, clear error messages
- [ ] Idempotency: Safe to retry mutating operations
- [ ] Complex logic: Extracted to lib/ modules, not inline
```

---

## 1. Logic Ownership

### The Rule

**API owns ALL business logic.** Components are dumb renderers.

| Belongs in API/Services | Does NOT belong in components |
|-------------------------|-------------------------------|
| Eligibility checks | `if (user.points >= 100)` |
| State transitions | `setStatus(isPremium ? 'gold' : 'silver')` |
| Business calculations | `const discount = calculateDiscount(order)` |
| Permission checks | `if (user.role === 'admin')` |
| Data transformations | Complex filtering/sorting logic |

### Detecting Logic Leakage

Flag these patterns in components:

```typescript
// ❌ BAD: Business logic in component
const canMessage = user.isVerified && !user.isBanned && hasActiveSubscription;

// ❌ BAD: Eligibility calculation client-side
const eligibleRewards = rewards.filter(r => user.points >= r.cost);

// ❌ BAD: State transition logic
const newStatus = currentLikes >= 10 ? 'popular' : 'normal';
```

### Correct Pattern

```typescript
// ✅ GOOD: Component just calls API and renders
const { data } = await api.get('/api/rewards/eligible');
return <RewardsList rewards={data.rewards} />;

// ✅ GOOD: API returns computed state
const { canMessage } = await api.get(`/api/users/${id}/permissions`);
```

### Algorithm Separation

Complex logic lives in dedicated modules:

```
lib/
├── matching/
│   └── algorithm.ts      # Matching score calculation
├── rewards/
│   └── eligibility.ts    # Reward eligibility rules
└── pricing/
    └── calculator.ts     # Pricing/discount logic
```

Route imports and uses:
```typescript
import { calculateMatchScore } from '@/lib/matching/algorithm';

export async function GET(req: Request) {
  const score = calculateMatchScore(userA, userB);
  return Response.json({ success: true, data: { score } });
}
```

---

## 2. Type Safety

### No Escape Hatches

```typescript
// ❌ FORBIDDEN
const data: any = await response.json();
const user = result as unknown as User;
// @ts-ignore
// @ts-expect-error

// ✅ REQUIRED
const data: ApiResponse<User> = await response.json();
```

### Database Types

Always use generated types:

```typescript
import { Database } from '@/types/database.types';

type User = Database['public']['Tables']['users']['Row'];
type UserInsert = Database['public']['Tables']['users']['Insert'];
type UserUpdate = Database['public']['Tables']['users']['Update'];
```

### Request/Response Types

Define explicit types for every endpoint:

```typescript
// Request body type
interface UpdateProfileRequest {
  display_name?: string;
  bio?: string;
  location?: string;
}

// Response type
interface UpdateProfileResponse {
  success: true;
  data: {
    user: User;
  };
  msg: string;
}

// Error response type
interface ApiError {
  success: false;
  msg: string;
  error?: string;
}
```

---

## 3. Server-Side Validation

### Trust Nothing

Even if the client validates, the server re-validates everything:

```typescript
export async function POST(req: Request) {
  const body = await req.json();
  
  // ✅ Validate required fields
  if (!body.email || typeof body.email !== 'string') {
    return Response.json({ success: false, msg: 'Email is required' }, { status: 400 });
  }
  
  // ✅ Validate format
  if (!isValidEmail(body.email)) {
    return Response.json({ success: false, msg: 'Invalid email format' }, { status: 400 });
  }
  
  // ✅ Validate business rules
  const existing = await supabase.from('users').select('id').eq('email', body.email).single();
  if (existing.data) {
    return Response.json({ success: false, msg: 'Email already in use' }, { status: 409 });
  }
}
```

### Ownership Verification

Always verify the user owns what they're modifying:

```typescript
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const supabase = await createApiClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return Response.json({ success: false, msg: 'Unauthorized' }, { status: 401 });
  }
  
  // ✅ Verify ownership before deletion
  const { data: photo } = await supabase
    .from('photos')
    .select('user_id')
    .eq('id', params.id)
    .single();
    
  if (!photo || photo.user_id !== user.id) {
    return Response.json({ success: false, msg: 'Not found' }, { status: 404 });
  }
  
  // Now safe to delete
}
```

---

## 4. Request Handling

### Standard Auth Pattern

```typescript
export async function GET(req: Request) {
  const supabase = await createApiClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return Response.json({ success: false, msg: 'Unauthorized' }, { status: 401 });
  }
  
  // Proceed with authenticated user
}
```

### Response Format

```typescript
// Success
return Response.json({
  success: true,
  data: { user, matches },
  msg: 'Matches retrieved successfully'
});

// Error
return Response.json({
  success: false,
  msg: 'User not found',
  error: 'USER_NOT_FOUND' // Optional error code
}, { status: 404 });
```

### Error Status Codes

| Code | When to Use |
|------|-------------|
| 400 | Invalid input, malformed request |
| 401 | Not authenticated |
| 403 | Authenticated but not authorized |
| 404 | Resource not found (or hidden for security) |
| 409 | Conflict (duplicate, state mismatch) |
| 429 | Rate limited |
| 500 | Server error (log and alert) |

### Input Compatibility

Support both web (PascalCase) and mobile (snake_case):

```typescript
const displayName = body.displayName || body.display_name;
const firstName = body.firstName || body.first_name;
```

---

## 5. Production Hardening

### Idempotency

Mutating operations should be safe to retry:

```typescript
// ❌ BAD: Creates duplicate on retry
await supabase.from('likes').insert({ user_id, target_id });

// ✅ GOOD: Idempotent upsert
await supabase.from('likes').upsert(
  { user_id, target_id },
  { onConflict: 'user_id,target_id' }
);
```

### Transactional Operations

Multi-step operations succeed or fail atomically:

```typescript
// Use Supabase RPC for transactions
const { error } = await supabase.rpc('transfer_points', {
  from_user: senderId,
  to_user: receiverId,
  amount: points
});
```

### Graceful Degradation

Handle external service failures:

```typescript
try {
  await sendPushNotification(userId, message);
} catch (error) {
  // Log but don't fail the main operation
  console.error('Push notification failed:', error);
  // Continue with response
}
```

---

## 6. Auto-Fix Guidance

When you find violations, apply these fixes:

| Issue | Fix |
|-------|-----|
| Business logic in component | Move to API route or lib/ module |
| `any` type | Add proper type from database.types or define interface |
| Missing validation | Add input validation before processing |
| Non-standard response | Wrap in `{ success, data, msg }` format |
| Missing auth check | Add createApiClient + user check at start |
| Inline complex logic | Extract to `lib/[domain]/[operation].ts` |
| Client-only permission check | Mirror validation in API route |

---

## Additional Resources

For detailed patterns and examples, see [patterns-reference.md](patterns-reference.md).
