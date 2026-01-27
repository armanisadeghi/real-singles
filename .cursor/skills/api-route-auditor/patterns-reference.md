# API Route Patterns Reference

Detailed patterns and examples for API route implementation.

---

## Complete Route Template

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/server';
import { Database } from '@/types/database.types';

// Types
type User = Database['public']['Tables']['users']['Row'];

interface RequestBody {
  fieldName: string;
  optionalField?: number;
}

interface SuccessResponse {
  success: true;
  data: { user: User };
  msg: string;
}

interface ErrorResponse {
  success: false;
  msg: string;
  error?: string;
}

type ApiResponse = SuccessResponse | ErrorResponse;

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    // 1. Auth
    const supabase = await createApiClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, msg: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse & validate input
    const body: RequestBody = await req.json();
    
    if (!body.fieldName || typeof body.fieldName !== 'string') {
      return NextResponse.json(
        { success: false, msg: 'fieldName is required' },
        { status: 400 }
      );
    }

    // 3. Business logic (or call lib/ module)
    const { data, error } = await supabase
      .from('users')
      .update({ field_name: body.fieldName })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Update failed:', error);
      return NextResponse.json(
        { success: false, msg: 'Update failed' },
        { status: 500 }
      );
    }

    // 4. Success response
    return NextResponse.json({
      success: true,
      data: { user: data },
      msg: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { success: false, msg: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
```

---

## Validation Patterns

### String Validation

```typescript
function validateString(
  value: unknown,
  fieldName: string,
  options: { minLength?: number; maxLength?: number; pattern?: RegExp } = {}
): string | null {
  if (typeof value !== 'string') {
    return `${fieldName} must be a string`;
  }
  if (options.minLength && value.length < options.minLength) {
    return `${fieldName} must be at least ${options.minLength} characters`;
  }
  if (options.maxLength && value.length > options.maxLength) {
    return `${fieldName} must be at most ${options.maxLength} characters`;
  }
  if (options.pattern && !options.pattern.test(value)) {
    return `${fieldName} format is invalid`;
  }
  return null;
}

// Usage
const emailError = validateString(body.email, 'Email', {
  pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
});
if (emailError) {
  return Response.json({ success: false, msg: emailError }, { status: 400 });
}
```

### Enum Validation

```typescript
const VALID_STATUSES = ['active', 'inactive', 'pending'] as const;
type Status = typeof VALID_STATUSES[number];

function isValidStatus(value: unknown): value is Status {
  return typeof value === 'string' && VALID_STATUSES.includes(value as Status);
}

// Usage
if (!isValidStatus(body.status)) {
  return Response.json(
    { success: false, msg: `Status must be one of: ${VALID_STATUSES.join(', ')}` },
    { status: 400 }
  );
}
```

### ID Validation

```typescript
function isValidUUID(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

// Usage in dynamic routes
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  if (!isValidUUID(params.id)) {
    return Response.json({ success: false, msg: 'Invalid ID format' }, { status: 400 });
  }
}
```

---

## Pagination Pattern

### Cursor-Based Pagination

```typescript
interface PaginationParams {
  limit: number;
  cursor?: string;
}

interface PaginatedResponse<T> {
  success: true;
  data: {
    items: T[];
    nextCursor: string | null;
    hasMore: boolean;
  };
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
  const cursor = searchParams.get('cursor');

  let query = supabase
    .from('items')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit + 1); // Fetch one extra to check hasMore

  if (cursor) {
    const cursorDate = new Date(atob(cursor));
    query = query.lt('created_at', cursorDate.toISOString());
  }

  const { data, error } = await query;
  
  if (error) {
    return Response.json({ success: false, msg: 'Failed to fetch items' }, { status: 500 });
  }

  const hasMore = data.length > limit;
  const items = hasMore ? data.slice(0, -1) : data;
  const nextCursor = hasMore && items.length > 0
    ? btoa(items[items.length - 1].created_at)
    : null;

  return Response.json({
    success: true,
    data: { items, nextCursor, hasMore }
  });
}
```

---

## Idempotency Patterns

### Upsert Pattern

```typescript
// Idempotent like/unlike
export async function POST(req: Request) {
  const { targetId } = await req.json();
  
  // Safe to retry - won't create duplicates
  const { error } = await supabase
    .from('likes')
    .upsert(
      { user_id: user.id, target_id: targetId, created_at: new Date().toISOString() },
      { onConflict: 'user_id,target_id', ignoreDuplicates: true }
    );
}
```

### Idempotency Key Pattern

For complex operations:

```typescript
export async function POST(req: Request) {
  const idempotencyKey = req.headers.get('X-Idempotency-Key');
  
  if (idempotencyKey) {
    // Check if we've already processed this request
    const { data: existing } = await supabase
      .from('idempotency_log')
      .select('response')
      .eq('key', idempotencyKey)
      .single();
    
    if (existing) {
      return Response.json(existing.response);
    }
  }
  
  // Process the request...
  const result = await processOrder(body);
  
  // Store result for idempotency
  if (idempotencyKey) {
    await supabase.from('idempotency_log').insert({
      key: idempotencyKey,
      response: result,
      created_at: new Date().toISOString()
    });
  }
  
  return Response.json(result);
}
```

---

## Complex Logic Extraction

### Before (Logic in Route)

```typescript
// ❌ BAD: Complex matching logic inline
export async function GET(req: Request) {
  const { data: users } = await supabase.from('users').select('*');
  
  // 50 lines of matching algorithm...
  const matches = users.filter(u => {
    const ageDiff = Math.abs(u.age - currentUser.age);
    const distanceKm = calculateDistance(u.location, currentUser.location);
    const interestOverlap = u.interests.filter(i => currentUser.interests.includes(i)).length;
    // ... more complex logic
  });
}
```

### After (Extracted to lib/)

```typescript
// lib/matching/algorithm.ts
import { User } from '@/types/database.types';

interface MatchScore {
  userId: string;
  score: number;
  factors: {
    ageCompatibility: number;
    distance: number;
    interests: number;
  };
}

export function calculateMatchScores(
  currentUser: User,
  candidates: User[]
): MatchScore[] {
  return candidates.map(candidate => ({
    userId: candidate.id,
    score: computeScore(currentUser, candidate),
    factors: computeFactors(currentUser, candidate)
  }));
}

// Private helpers
function computeScore(a: User, b: User): number {
  // Algorithm implementation
}
```

```typescript
// Route is now clean
import { calculateMatchScores } from '@/lib/matching/algorithm';

export async function GET(req: Request) {
  const { data: users } = await supabase.from('users').select('*');
  const matches = calculateMatchScores(currentUser, users);
  
  return Response.json({ success: true, data: { matches } });
}
```

---

## Logic Leakage Examples

### Example 1: Eligibility Check

```typescript
// ❌ Component doing eligibility logic
function RewardCard({ reward, user }) {
  const canRedeem = user.points >= reward.cost && 
                    user.level >= reward.requiredLevel &&
                    !user.redeemedRewards.includes(reward.id);
  return <Button disabled={!canRedeem}>Redeem</Button>;
}

// ✅ API returns eligibility
// GET /api/rewards/available returns rewards with { ...reward, canRedeem: boolean }
function RewardCard({ reward }) {
  return <Button disabled={!reward.canRedeem}>Redeem</Button>;
}
```

### Example 2: Status Transition

```typescript
// ❌ Component computing next status
function OrderActions({ order }) {
  const canShip = order.status === 'paid' && order.items.every(i => i.inStock);
  const canCancel = ['pending', 'paid'].includes(order.status);
  // ...
}

// ✅ API returns allowed actions
// GET /api/orders/:id returns { ...order, allowedActions: ['ship', 'cancel'] }
function OrderActions({ order }) {
  const canShip = order.allowedActions.includes('ship');
  const canCancel = order.allowedActions.includes('cancel');
}
```

### Example 3: Pricing Calculation

```typescript
// ❌ Client computing price
function Checkout({ items, user }) {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const discount = user.isPremium ? subtotal * 0.1 : 0;
  const tax = (subtotal - discount) * 0.08;
  const total = subtotal - discount + tax;
}

// ✅ API returns computed totals
// POST /api/orders/calculate returns { subtotal, discount, tax, total }
function Checkout({ items }) {
  const [pricing, setPricing] = useState(null);
  useEffect(() => {
    api.post('/api/orders/calculate', { items }).then(setPricing);
  }, [items]);
}
```

---

## Audit Log Pattern

For sensitive operations:

```typescript
async function logAuditEvent(
  supabase: SupabaseClient,
  event: {
    userId: string;
    action: string;
    resource: string;
    resourceId: string;
    details?: Record<string, unknown>;
    ip?: string;
  }
) {
  await supabase.from('audit_log').insert({
    user_id: event.userId,
    action: event.action,
    resource: event.resource,
    resource_id: event.resourceId,
    details: event.details,
    ip_address: event.ip,
    created_at: new Date().toISOString()
  });
}

// Usage
await logAuditEvent(supabase, {
  userId: user.id,
  action: 'delete',
  resource: 'account',
  resourceId: user.id,
  details: { reason: body.reason },
  ip: req.headers.get('x-forwarded-for')
});
```

---

## Rate Limiting Pattern

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
});

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') ?? 'anonymous';
  const { success, remaining } = await ratelimit.limit(ip);
  
  if (!success) {
    return Response.json(
      { success: false, msg: 'Too many requests. Please try again later.' },
      { 
        status: 429,
        headers: { 'X-RateLimit-Remaining': remaining.toString() }
      }
    );
  }
  
  // Continue with request...
}
```

---

## Mobile Compatibility

### Field Name Normalization

```typescript
function normalizeInput<T extends Record<string, unknown>>(
  body: Record<string, unknown>,
  fieldMap: Record<string, string>
): Partial<T> {
  const normalized: Record<string, unknown> = {};
  
  for (const [snakeCase, camelCase] of Object.entries(fieldMap)) {
    const value = body[camelCase] ?? body[snakeCase];
    if (value !== undefined) {
      normalized[snakeCase] = value;
    }
  }
  
  return normalized as Partial<T>;
}

// Usage
const fieldMap = {
  display_name: 'displayName',
  birth_date: 'birthDate',
  profile_photo: 'profilePhoto'
};

const input = normalizeInput(body, fieldMap);
```

### Versioning Awareness

```typescript
export async function GET(req: Request) {
  const apiVersion = req.headers.get('X-API-Version') || '1';
  
  const { data } = await supabase.from('users').select('*').eq('id', userId).single();
  
  // v1 response shape (legacy mobile apps)
  if (apiVersion === '1') {
    return Response.json({
      success: true,
      data: {
        user: transformToV1(data)
      }
    });
  }
  
  // v2 response shape (current)
  return Response.json({
    success: true,
    data: { user: data }
  });
}
```
