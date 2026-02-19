Audit API routes for business logic ownership, type safety, validation, and production hardening with detailed code patterns.

Scope: $ARGUMENTS

## Quick Audit Checklist

For each route, verify:
- [ ] Logic ownership: No business logic in calling components
- [ ] Type safety: No `any`, proper DB types, typed request/response
- [ ] Validation: Server validates ALL input, never trusts client
- [ ] Auth: Uses `createApiClient()`, checks user, verifies ownership
- [ ] Response format: `{ success, data/msg }` standard shape
- [ ] Error handling: Correct status codes
- [ ] Idempotency: Safe to retry mutating operations

## Logic Ownership

API owns ALL business logic. Components are dumb renderers.

```typescript
// WRONG: Component doing eligibility logic
const canRedeem = user.points >= reward.cost && user.level >= reward.requiredLevel;

// CORRECT: API returns computed state
const { canRedeem } = await api.get(`/api/rewards/${id}/eligibility`);
```

Complex logic goes in `lib/` modules:
```
lib/matching/algorithm.ts
lib/rewards/eligibility.ts
lib/pricing/calculator.ts
```

## Validation Patterns

### String Validation
```typescript
function validateString(value: unknown, fieldName: string, options: { minLength?: number; maxLength?: number; pattern?: RegExp } = {}): string | null {
  if (typeof value !== 'string') return `${fieldName} must be a string`;
  if (options.minLength && value.length < options.minLength) return `${fieldName} too short`;
  if (options.maxLength && value.length > options.maxLength) return `${fieldName} too long`;
  if (options.pattern && !options.pattern.test(value)) return `${fieldName} format invalid`;
  return null;
}
```

### Pagination (Cursor-Based)
```typescript
const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
const cursor = searchParams.get('cursor');
let query = supabase.from('items').select('*').order('created_at', { ascending: false }).limit(limit + 1);
if (cursor) query = query.lt('created_at', new Date(atob(cursor)).toISOString());
const hasMore = data.length > limit;
const items = hasMore ? data.slice(0, -1) : data;
```

## Idempotency

```typescript
// WRONG: Creates duplicates on retry
await supabase.from('likes').insert({ user_id, target_id });

// CORRECT: Safe to retry
await supabase.from('likes').upsert({ user_id, target_id }, { onConflict: 'user_id,target_id' });
```

## Mobile Compatibility

Support both camelCase and snake_case:
```typescript
const displayName = body.displayName || body.display_name;
```

## Error Status Codes

| Code | When |
|------|------|
| 400 | Invalid input |
| 401 | Not authenticated |
| 403 | Not authorized |
| 404 | Not found |
| 409 | Conflict/duplicate |
| 429 | Rate limited |
| 500 | Server error |

## Issue Severity

- **Critical:** Business logic in components, `any` types, missing auth, no validation
- **High:** Non-standard response format, missing ownership verification, wrong status codes
- **Medium:** Inline complex logic, missing mobile field compatibility

## Output Format

1. Summary — issues by severity
2. Critical Issues — must fix
3. High Issues — should fix
4. Logic Leakage — business logic found in components
5. Specific Fixes — code examples
