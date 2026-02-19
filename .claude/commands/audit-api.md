Audit API routes for business logic ownership, type safety, validation, and production hardening.

Scope: $ARGUMENTS (specific routes, feature area, or full audit)

> **The API is the product** — every endpoint should be validated at entry, idempotent where it matters, correctly authenticated, properly typed, and production-ready.

## Audit Checklist

For each route, verify:

- [ ] **Logic ownership** — No business logic in calling components
- [ ] **Type safety** — No `any`, proper DB types, typed request/response
- [ ] **Validation** — Server validates ALL input, never trusts client
- [ ] **Auth** — Uses `createApiClient()`, checks user, verifies ownership
- [ ] **Response format** — `{ success, data/msg }` standard shape
- [ ] **Error handling** — Correct status codes, clear error messages
- [ ] **Idempotency** — Safe to retry mutating operations
- [ ] **Complex logic** — Extracted to `lib/` modules, not inline

## Logic Ownership

**API owns ALL business logic.** Components are dumb renderers.

| Belongs in API/Services | Does NOT belong in components |
|-------------------------|-------------------------------|
| Eligibility checks | `if (user.points >= 100)` |
| State transitions | `setStatus(isPremium ? 'gold' : 'silver')` |
| Business calculations | `const discount = calculateDiscount(order)` |
| Permission checks | `if (user.role === 'admin')` |
| Data transformations | Complex filtering/sorting logic |

## Standard Route Template

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database.types';

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

export async function POST(req: NextRequest): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
  try {
    const supabase = await createApiClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, msg: 'Unauthorized' }, { status: 401 });
    }

    const body: RequestBody = await req.json();

    if (!body.fieldName || typeof body.fieldName !== 'string') {
      return NextResponse.json({ success: false, msg: 'fieldName is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('users')
      .update({ field_name: body.fieldName })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Update failed:', error);
      return NextResponse.json({ success: false, msg: 'Update failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: { user: data }, msg: 'Profile updated successfully' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ success: false, msg: 'An unexpected error occurred' }, { status: 500 });
  }
}
```

## Error Status Codes

| Code | When to Use |
|------|-------------|
| 400 | Invalid input, malformed request |
| 401 | Not authenticated |
| 403 | Authenticated but not authorized |
| 404 | Resource not found (or hidden for security) |
| 409 | Conflict (duplicate, state mismatch) |
| 429 | Rate limited |
| 500 | Server error (log and alert) |

## Idempotency

Mutating operations should be safe to retry. Use upserts with `onConflict` instead of plain inserts.

## Mobile Compatibility

Support both web (camelCase) and mobile (snake_case) field names in request bodies.

## Issue Severity

- **Critical:** Business logic in components, `any` types, missing auth, no validation
- **High:** Non-standard response format, missing ownership verification, wrong status codes
- **Medium:** Inline complex logic, missing mobile field compatibility

## Output Format

1. **Summary** — Number of issues by severity
2. **Critical Issues** — Must fix before merge
3. **High Issues** — Should fix soon
4. **Logic Leakage** — Any business logic found in components
5. **Specific Fixes** — Code examples for top issues
