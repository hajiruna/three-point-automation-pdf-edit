# Security Audit Report - PDF Editing Application

**Date**: 2025-12-05
**Application**: Next.js PDF Editing Tool with Azure AD Authentication & Stripe Billing
**Audited by**: Claude Code Security Agent

---

## Executive Summary

This security audit identified **7 critical vulnerabilities** and **4 warnings** that require immediate attention. The application currently has authentication disabled and exposes sensitive API keys in the codebase. While XSS protections are in place and RLS policies are partially configured, several high-risk security gaps exist.

**Risk Level**: HIGH - Immediate action required before production deployment

---

## 1. Authentication Vulnerabilities

### Status: ❌ CRITICAL - Authentication Disabled

#### Issue 1.1: Middleware Disabled
**Severity**: CRITICAL
**File**: `C:\repositories\three-point\three-point-automation-pdf-edit\src\middleware.ts.disabled`

**Finding**: Authentication middleware is completely disabled. The file is renamed to `.disabled` and contains commented-out authentication code.

```typescript
// Lines 1-6: middleware.ts.disabled
// ============================================
// 認証機能は一時的に無効化中
// 情報システム部からAzure AD情報を受け取ったら、
// 以下のコメントアウトを解除してください
// ============================================
```

**Impact**:
- All application routes are publicly accessible without authentication
- No user verification or session validation
- Anyone can access admin endpoints and billing APIs

**Recommendation**:
1. Rename file from `middleware.ts.disabled` to `middleware.ts`
2. Configure Azure AD credentials before enabling
3. Test authentication flow thoroughly before deployment

---

#### Issue 1.2: Development Bypass in Production Code
**Severity**: CRITICAL
**Files**: Multiple API routes

**Finding**: Development environment bypasses authentication checks throughout the codebase:

**Location 1**: `C:\repositories\three-point\three-point-automation-pdf-edit\src\app\api\admin\stats\route.ts`
```typescript
// Lines 10-14
const isDev = process.env.NODE_ENV === 'development'
if (!session && !isDev) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

**Location 2**: `C:\repositories\three-point\three-point-automation-pdf-edit\src\app\api\billing\checkout\route.ts`
```typescript
// Lines 39-42
const isDev = process.env.NODE_ENV === 'development'
const userEmail = session?.user?.email || (isDev ? 'test@example.com' : null)
const userName = session?.user?.name || (isDev ? 'Test User' : null)
```

**Similar patterns found in**:
- `src/app/api/billing/subscription/route.ts` (Lines 26-27)
- `src/app/api/billing/usage/route.ts` (Lines 35-36, 120-121)
- `src/app/api/billing/portal/route.ts` (Lines 33-34)
- `src/components/billing/BillingProvider.tsx` (Lines 55, 77, 172)
- `src/app/admin/page.tsx` (Line 72)

**Impact**:
- Development mode allows unauthenticated access to sensitive endpoints
- Admin statistics API accessible without authentication in dev mode
- Billing operations can be performed with fake user credentials
- Risk of accidentally deploying with NODE_ENV=development

**Recommendation**:
```typescript
// REMOVE development bypasses from production code
const session = await getServerSession()
if (!session?.user?.email) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

// For local development, use proper test authentication or local auth bypass
// configured via separate environment variable (ALLOW_LOCAL_DEV_AUTH=true)
```

---

#### Issue 1.3: Admin Authorization Weakness
**Severity**: WARNING
**File**: `C:\repositories\three-point\three-point-automation-pdf-edit\src\lib\auth\admin.ts`

**Finding**: When no admin emails are configured, ALL users are granted admin access:

```typescript
// Lines 24-27
if (adminEmails.length === 0) {
  return true  // ⚠️ Grants admin access to everyone
}
```

**Impact**:
- In environments without ADMIN_EMAILS configured, any authenticated user becomes admin
- Default-open security posture is dangerous

**Recommendation**:
```typescript
// Default to DENY when no admins configured
if (adminEmails.length === 0) {
  console.error('ADMIN_EMAILS not configured - denying admin access')
  return false
}
```

---

## 2. Data Exposure

### Status: ❌ CRITICAL - SELECT * Pattern Used

#### Issue 2.1: Over-fetching Database Columns
**Severity**: HIGH
**File**: `C:\repositories\three-point\three-point-automation-pdf-edit\src\lib\supabase\billing.ts`

**Finding**: Multiple database queries use `SELECT *` pattern, fetching all columns unnecessarily:

```typescript
// Line 34: getCustomerByUserId
.select('*')

// Line 55: getCustomerByStripeId
.select('*')

// Line 142: getActiveSubscription
.select('*')

// Line 166: getSubscriptionByStripeId
.select('*')

// Line 353: getUnreportedUsage
.select('*')

// Line 397: getInvoices
.select('*')

// Line 467: getPayments
.select('*')
```

**Additional Location**: `C:\repositories\three-point\three-point-automation-pdf-edit\src\app\api\admin\stats\route.ts`
```typescript
// Line 29
.select('*')  // Fetches all usage_logs columns
```

**Impact**:
- Potential exposure of sensitive database columns not needed by application
- Increased attack surface if columns contain PII or internal metadata
- Performance overhead from over-fetching data

**Recommendation**: Replace with explicit column selection:
```typescript
// Example fix for getCustomerByUserId
.select('id, user_id, email, stripe_customer_id, default_currency, created_at, updated_at')

// Example fix for getActiveSubscription
.select('id, customer_id, stripe_subscription_id, plan_type, status, current_period_end, cancel_at_period_end')
```

---

## 3. RLS (Row Level Security) Policies

### Status: ⚠️ WARNING - Incomplete RLS Implementation

#### Issue 3.1: Service Role Only Policies
**Severity**: MEDIUM
**File**: `C:\repositories\three-point\three-point-automation-pdf-edit\supabase\migrations\001_billing_tables.sql`

**Finding**: RLS is enabled but only service_role has access policies defined. No user-level policies exist:

```sql
-- Lines 121-141: RLS Configuration
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Only service_role policies defined
CREATE POLICY "Service role full access on customers" ON customers
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on subscriptions" ON subscriptions
  FOR ALL USING (auth.role() = 'service_role');
-- ... (similar for other tables)
```

**Impact**:
- Users cannot directly query their own billing data from client
- All queries must go through API endpoints using service role
- Current architecture is safe but limits flexibility
- If NEXT_PUBLIC_SUPABASE_ANON_KEY is used for direct queries from client, users get zero access

**Assessment**:
- ✅ Current implementation is SAFE (forces server-side API access)
- ⚠️ No user-level RLS policies means direct client queries will fail
- This is acceptable IF all data access goes through authenticated API routes

**Recommendation**:
1. Document that all Supabase access MUST use server-side service role
2. Add user-scoped RLS policies if you plan to allow client-side queries:

```sql
-- Example user-level policy for customers table
CREATE POLICY "Users can view own customer data" ON customers
  FOR SELECT USING (
    user_id = auth.jwt() ->> 'email'
    -- or use auth.uid() if using Supabase Auth
  );
```

---

#### Issue 3.2: Missing usage_logs Table RLS
**Severity**: MEDIUM
**File**: Not found in migrations

**Finding**: The `usage_logs` table (referenced in `src/app/api/admin/stats/route.ts`) has no RLS policies defined in the migration files.

**Impact**:
- If the table exists without RLS, it may be publicly readable
- Usage statistics could be exposed to unauthorized users

**Recommendation**:
1. Verify if `usage_logs` table has RLS enabled in Supabase dashboard
2. Add migration to enable RLS and create policies:

```sql
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on usage_logs" ON usage_logs
  FOR ALL USING (auth.role() = 'service_role');
```

---

## 4. XSS Vulnerabilities

### Status: ✅ OK - No dangerouslySetInnerHTML Found

#### Assessment:
**Finding**: No instances of `dangerouslySetInnerHTML` found in the codebase.

**Additional Check**: No `innerHTML`, `eval()`, or `Function()` constructor usage detected.

**Recommendation**: Continue avoiding these patterns. Maintain current safe practices:
- Use React's automatic JSX escaping
- Sanitize user input if HTML rendering becomes necessary (use DOMPurify)

---

## 5. API Key Exposure

### Status: ❌ CRITICAL - Secrets in .env.local

#### Issue 5.1: Committed Secrets
**Severity**: CRITICAL
**File**: `C:\repositories\three-point\three-point-automation-pdf-edit\.env.local`

**Finding**: The `.env.local` file contains actual production/test secrets and is tracked in the repository:

```bash
# Line 2-3: Supabase Keys
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[ANON_KEY_REDACTED]

# Line 22-23: Stripe Keys (Test mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_[REDACTED]
STRIPE_SECRET_KEY=sk_test_[REDACTED]

# Line 26: Webhook Secret
STRIPE_WEBHOOK_SECRET=whsec_[REDACTED]
```

**Impact**:
- Stripe test API keys exposed in git history
- Supabase anon key exposed (though this is acceptable for NEXT_PUBLIC_* variables)
- Webhook signing secret compromised - attackers could forge webhook events
- Anyone with repository access can make test Stripe API calls

**Recommendation**:
1. **IMMEDIATELY** rotate all Stripe test keys from dashboard
2. Add `.env.local` to `.gitignore` (verify it's not already there)
3. Remove `.env.local` from git history:
```bash
git rm --cached .env.local
git commit -m "Remove sensitive .env.local from tracking"
```
4. Use environment variables from hosting platform (Vercel/Netlify secrets)
5. For development, each developer should create their own `.env.local` from `.env.local.example`

---

#### Issue 5.2: NEXT_PUBLIC_* Variable Usage
**Severity**: LOW (Informational)
**Files**: `.env.local.example`

**Finding**: Several variables use `NEXT_PUBLIC_` prefix, making them accessible to client-side code:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_ENABLE_BILLING
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
NEXT_PUBLIC_ADMIN_EMAILS (in admin.ts)
```

**Assessment**:
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Safe (designed for client use)
- ✅ `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Safe (designed for client use)
- ✅ `NEXT_PUBLIC_ENABLE_BILLING` - Safe (feature flag)
- ⚠️ `NEXT_PUBLIC_ADMIN_EMAILS` - Should be server-side only

**Recommendation**:
Remove `NEXT_PUBLIC_` prefix from `ADMIN_EMAILS` in `src/lib/auth/admin.ts`:

```typescript
// Line 9: Current (exposes admin list to client)
const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS || process.env.ADMIN_EMAILS || ''

// Recommended: Server-side only
const adminEmails = process.env.ADMIN_EMAILS || ''
```

---

#### Issue 5.3: No Supabase Service Role Key Usage
**Severity**: WARNING
**Files**: API routes using `src/lib/supabase/client.ts`

**Finding**: Application uses `NEXT_PUBLIC_SUPABASE_ANON_KEY` for server-side operations instead of service role key:

```typescript
// src/lib/supabase/client.ts
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

**Impact**:
- Anon key has limited permissions (good for security)
- RLS policies apply to anon key (forces service_role policies only)
- Cannot bypass RLS for server operations if needed

**Assessment**:
- ✅ Current approach is SAFE because RLS is enabled
- ⚠️ May need service role key if you add user-scoped RLS policies and need admin override

**Recommendation**:
1. Create separate Supabase client for server operations:
```typescript
// src/lib/supabase/server.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
})
```

2. Use admin client only in API routes, never expose to client
3. Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local.example` (NOT `.env.local`)

---

## 6. API Endpoint Security

### Status: ⚠️ WARNING - Partial Protection

#### Issue 6.1: Stripe Webhook Signature Verification
**Severity**: ✅ OK
**File**: `C:\repositories\three-point\three-point-automation-pdf-edit\src\app\api\billing\webhooks\stripe\route.ts`

**Finding**: Webhook signature verification is properly implemented:

```typescript
// Lines 61-72
try {
  event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
} catch (err) {
  const error = err as Error
  console.error('Webhook signature verification failed:', error.message)
  return NextResponse.json(
    { error: 'Invalid signature' },
    { status: 400 }
  )
}
```

**Assessment**: ✅ SECURE - Properly validates webhook authenticity

---

#### Issue 6.2: API Input Validation
**Severity**: MEDIUM
**Files**: Various API routes

**Finding**: Limited input validation in API endpoints:

**Example 1**: `src/app/api/billing/checkout/route.ts`
```typescript
// Lines 51-59: Basic validation only
const body: CheckoutRequest = await request.json()
const { priceId, successUrl, cancelUrl } = body

if (!priceId) {
  return NextResponse.json(
    { error: 'Price ID is required' },
    { status: 400 }
  )
}
// ⚠️ No validation of priceId format or URL safety
```

**Example 2**: `src/app/api/billing/usage/route.ts`
```typescript
// Lines 130-141: Basic type checking only
const { operationType, pageCount } = body as {
  operationType: OperationType
  pageCount: number
}

if (!operationType || !['extract', 'merge'].includes(operationType)) {
  return NextResponse.json(
    { error: 'Invalid operation type' },
    { status: 400 }
  )
}
// ⚠️ No validation of pageCount bounds or type safety
```

**Impact**:
- Malformed input could cause unexpected behavior
- Type coercion issues with unvalidated data
- Potential for injection attacks if data used in queries

**Recommendation**: Add comprehensive input validation:
```typescript
import { z } from 'zod'

// Define schemas
const CheckoutSchema = z.object({
  priceId: z.string().startsWith('price_'),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
})

const UsageSchema = z.object({
  operationType: z.enum(['extract', 'merge']),
  pageCount: z.number().int().min(0).max(10000),
})

// Validate in handler
const body = CheckoutSchema.parse(await request.json())
```

---

#### Issue 6.3: API Rate Limiting
**Severity**: MEDIUM
**Files**: All API routes

**Finding**: No rate limiting implemented on API endpoints.

**Impact**:
- API can be abused for brute force attacks
- Usage recording endpoint could be spammed
- Webhook endpoints could be flooded
- No protection against DDoS attacks

**Recommendation**: Implement rate limiting:
```typescript
// Using @upstash/ratelimit or similar
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
})

// In API route
const identifier = request.headers.get('x-forwarded-for') || 'anonymous'
const { success } = await ratelimit.limit(identifier)

if (!success) {
  return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
}
```

---

## 7. Additional Security Concerns

### Issue 7.1: CORS Configuration
**Severity**: LOW
**Finding**: No explicit CORS configuration found in Next.js config.

**Recommendation**: Configure CORS headers in `next.config.js` if API will be called from external domains:
```javascript
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: 'https://yourdomain.com' },
        { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
      ],
    },
  ]
}
```

---

### Issue 7.2: Session Security
**Severity**: MEDIUM
**File**: `.env.local`

**Finding**: NextAuth secret is weak for development:
```
NEXTAUTH_SECRET=local-dev-secret-change-in-production-12345
```

**Recommendation**:
1. Generate cryptographically secure secret:
```bash
openssl rand -base64 32
```
2. Use different secrets for dev/staging/production
3. Store in environment variables, never commit to repo

---

### Issue 7.3: Error Message Leakage
**Severity**: LOW
**Files**: Various API routes

**Finding**: Some error messages expose internal implementation details:

```typescript
// src/lib/supabase/billing.ts
console.error('Error fetching customer:', error)
console.error('Error creating subscription:', error)
```

**Recommendation**:
- Log detailed errors server-side
- Return generic error messages to client
```typescript
if (error) {
  console.error('[Internal] Database error:', error)
  return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
}
```

---

## Summary of Findings

### Critical Issues (Immediate Action Required)
1. ❌ Authentication middleware disabled - rename `middleware.ts.disabled`
2. ❌ Development auth bypasses in production code - remove all `isDev` checks
3. ❌ Secrets exposed in `.env.local` - rotate keys and remove from git
4. ❌ SELECT * pattern over-fetching data - use explicit column selection

### High Priority Warnings
5. ⚠️ Admin authorization defaults to allow-all when unconfigured
6. ⚠️ No user-level RLS policies (acceptable if intended)
7. ⚠️ Missing `usage_logs` RLS configuration
8. ⚠️ Limited API input validation
9. ⚠️ No rate limiting on API endpoints
10. ⚠️ NEXT_PUBLIC_ADMIN_EMAILS exposes admin list to client

### Medium/Low Priority
11. Weak development NEXTAUTH_SECRET
12. No CORS configuration
13. Error message information leakage

---

## Remediation Priority

### Phase 1: Immediate (Before Any Deployment)
1. Rotate all Stripe keys from `.env.local`
2. Remove `.env.local` from git tracking
3. Configure Azure AD and enable authentication middleware
4. Remove all development authentication bypasses

### Phase 2: Pre-Production (Within 1 Week)
5. Replace SELECT * with explicit column selection
6. Fix admin authorization default-allow behavior
7. Add comprehensive input validation with Zod
8. Implement rate limiting on API routes
9. Verify and document RLS policy strategy

### Phase 3: Production Hardening (Within 1 Month)
10. Add monitoring and alerting for security events
11. Implement CORS policies
12. Improve error handling and logging
13. Conduct penetration testing
14. Document security architecture and threat model

---

## Testing Recommendations

### Security Testing Checklist
- [ ] Test authentication with real Azure AD credentials
- [ ] Verify all API routes require authentication
- [ ] Test RLS policies in Supabase dashboard
- [ ] Validate webhook signature rejection with bad signatures
- [ ] Test rate limiting thresholds
- [ ] Verify admin-only endpoints reject non-admin users
- [ ] Test input validation with malformed data
- [ ] Check for SQL injection vulnerabilities
- [ ] Verify CSRF protection on state-changing endpoints
- [ ] Test session timeout and renewal

---

## Compliance Notes

### OWASP Top 10 2021 Mapping
- **A01 Broken Access Control**: Issues 1.1, 1.2, 1.3, 3.1
- **A02 Cryptographic Failures**: Issue 5.1 (exposed secrets)
- **A03 Injection**: Issue 6.2 (input validation)
- **A05 Security Misconfiguration**: Issues 1.2, 7.2
- **A07 Identification/Authentication Failures**: Issues 1.1, 1.2

### Privacy Considerations
- Supabase RLS limits data access appropriately
- SELECT * pattern may expose unnecessary PII - requires review
- Usage logging captures user emails - ensure GDPR compliance

---

## Conclusion

The application has a solid foundation with proper RLS policies and XSS protection, but **critical authentication gaps and exposed secrets** create unacceptable risk for production deployment.

**Priority**: Complete Phase 1 remediation before any production release. The development authentication bypasses are particularly dangerous and must be removed immediately.

**Next Steps**:
1. Review this report with development team
2. Create GitHub issues for each critical finding
3. Implement Phase 1 fixes
4. Re-test with security checklist
5. Schedule follow-up security review after remediation
