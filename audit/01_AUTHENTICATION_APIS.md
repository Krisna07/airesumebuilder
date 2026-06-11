# Authentication APIs Audit

## Overview
**Total Routes:** 10  
**Critical Issues:** 2  
**High Priority Fixes:** 1  
**Severity:** HIGH

---

## API Routes

### 1. `/api/auth/[...nextauth]`
**File:** `app/api/auth/[...nextauth]/route.ts`  
**Type:** OAuth & Session Management  
**Purpose:** NextAuth configuration, handles Google, GitHub, credentials providers

**Status:** ✅ No issues

---

### 2. `/api/auth/login`
**File:** `app/api/auth/login/route.ts`  
**Type:** Credentials Login  
**Purpose:** Email/password authentication  
**Called From:** `SignIn` component

**Status:** ✅ No issues

---

### 3. `/api/auth/logout`
**File:** `app/api/auth/logout/route.ts`  
**Type:** Session Termination  
**Purpose:** Clears user session  

**Status:** ✅ No issues

---

### 4. `/api/auth/me`
**File:** `app/api/auth/me/route.ts`  
**Type:** Current User Info  
**Purpose:** Returns authenticated user data  
**HTTP Method:** GET

**Status:** ✅ No issues

---

### 5. `/api/auth/forgot-password` ⚠️ **CONSOLIDATION CANDIDATE**
**File:** `app/api/auth/forgot-password/route.ts`  
**Type:** Password Reset Request  
**Purpose:** Initiates password reset, sends email  
**HTTP Method:** POST  
**Called From:** Account/Settings pages (line 91-98)

**Issue:** 
- Part of a 2-step reset flow with `/api/auth/reset-password`
- Could be combined into single endpoint with `step` or `action` parameter
- Adds unnecessary API surface complexity

**Current Flow:**
```
1. POST /api/auth/forgot-password { email }
   → Sends reset email
2. POST /api/auth/reset-password { token, newPassword }
   → Completes reset
```

**Proposed Fix - Merge into Single Endpoint:**
```typescript
// POST /api/auth/reset-password
// Payload: { email } OR { token, newPassword }
// The endpoint handles both cases

if (request.body.email) {
  // Step 1: Send reset email
} else if (request.body.token) {
  // Step 2: Verify token and reset password
}
```

**Migration Path:**
- Keep both endpoints for backward compatibility
- Update Account/Settings pages to use consolidated endpoint
- Deprecate old endpoints after 2 releases

---

### 6. `/api/auth/reset-password` ⚠️ **CONSOLIDATION CANDIDATE**
**File:** `app/api/auth/reset-password/route.ts`  
**Type:** Password Reset Completion  
**Purpose:** Verifies reset token and updates password  
**HTTP Method:** POST  
**Called From:** Account/Settings pages (line 136-143)

**Issue:** See `/api/auth/forgot-password` above - should be consolidated

---

### 7. `/api/auth/verify` ⚠️ **REDUNDANT**
**File:** `app/api/auth/verify/route.ts`  
**Type:** Email Verification  
**Purpose:** Verifies email with code  
**HTTP Method:** POST  
**Called From:** AuthContext (line 417)

**Related Endpoint:** `/api/auth/verification` (line 283 in AuthContext)

**Issue:** Two endpoints for email verification state
- `/api/auth/verify` - Verifies the code and marks email as verified
- `/api/auth/verification` - Checks verification status

**Current Usage in AuthContext.tsx:**
```typescript
// Line 283: Check verification status
const response = await fetch('/api/auth/verification');

// Line 417: Verify email
const response = await fetch(`/api/auth/verify?token=${token}`);
```

**Proposed Fix:**
```typescript
// Single endpoint: POST /api/auth/verify
// Payload: { token } - verifies and returns status
// GET /api/auth/verify - returns current verification status

// Consolidate /api/auth/verification into verify endpoint
// DELETE /api/auth/verification completely
```

---

### 8. `/api/auth/verification` ⚠️ **REDUNDANT**
**File:** `app/api/auth/verification/route.ts`  
**Type:** Verification Status Check  
**Purpose:** Returns user's email verification status  
**HTTP Method:** GET  
**Called From:** AuthContext (line 283)

**Issue:** Redundant with `/api/auth/verify` - see above

---

### 9. `/api/auth/resend` ⚠️ **CONSOLIDATION CANDIDATE**
**File:** `app/api/auth/resend/route.ts`  
**Type:** Resend Verification Email  
**Purpose:** Resends verification code  
**HTTP Method:** POST  
**Called From:** AuthContext (line 451)

**Proposed Consolidation:**
Instead of 3 separate endpoints (`verify`, `verification`, `resend`), create single verification endpoint:

```typescript
// POST /api/auth/verify-email
case 'send': {
  // Send initial verification email or resend
  sendVerificationEmail(email);
}

case 'verify': {
  // Verify the code/token
  verifyEmailToken(token);
}

case 'status': {
  // Check verification status
  getVerificationStatus(userId);
}
```

**Current API Calls from AuthContext:**
```
1. GET /api/auth/verification (line 283)
2. POST /api/auth/verify (line 417)
3. POST /api/auth/resend (line 451)
= 3 endpoints for 1 logical feature
```

---

### 10. `/api/auth/newuser` ⚠️ **CONSOLIDATION CANDIDATE**
**File:** `app/api/auth/newuser/route.ts`  
**Type:** New User Registration  
**Purpose:** Creates new user account (OAuth or credentials)  
**HTTP Method:** POST  
**Called From:** NextAuth callbacks

**Status:** 
- Functionality overlaps with NextAuth signIn callback
- Could be eliminated by moving logic to NextAuth route.ts
- Current code duplication with OAuth handling in main auth route

**Proposed Fix:**
- Move newuser logic into `/api/auth/[...nextauth]/route.ts` signIn callback
- Eliminate separate newuser endpoint (consolidate 10 → 9 endpoints)

---

## Summary of Issues

| Issue | Severity | Type | Fix |
|-------|----------|------|-----|
| `/api/auth/forgot-password` + `/api/auth/reset-password` | HIGH | Consolidation | Merge into single endpoint |
| `/api/auth/verify` + `/api/auth/verification` + `/api/auth/resend` | HIGH | Consolidation | Merge into single endpoint |
| `/api/auth/newuser` | MEDIUM | Duplication | Move to NextAuth callback |

---

## Recommended Refactor Plan

### Phase 1: Create New Consolidated Endpoints
- `POST /api/auth/password-reset` - Handles forgot & reset password
- `POST /api/auth/email-verification` - Handles verify, check status, resend

### Phase 2: Update Frontend
- Update AuthContext.tsx to use new endpoints
- Update Account/Settings pages to use new endpoints

### Phase 3: Deprecation
- Add deprecation warnings to old endpoints
- Document migration path
- Remove old endpoints after 2 releases

---

## Migration Examples

### Password Reset Consolidation
**Before:**
```typescript
// Step 1
await fetch('/api/auth/forgot-password', {
  method: 'POST',
  body: JSON.stringify({ email })
});

// Step 2
await fetch('/api/auth/reset-password', {
  method: 'POST',
  body: JSON.stringify({ token, newPassword })
});
```

**After:**
```typescript
// Step 1
await fetch('/api/auth/password-reset', {
  method: 'POST',
  body: JSON.stringify({ action: 'send', email })
});

// Step 2
await fetch('/api/auth/password-reset', {
  method: 'POST',
  body: JSON.stringify({ action: 'verify', token, newPassword })
});
```

### Email Verification Consolidation
**Before:**
```typescript
// Check status
await fetch('/api/auth/verification');

// Verify code
await fetch(`/api/auth/verify?token=${token}`, { method: 'POST' });

// Resend
await fetch('/api/auth/resend', { method: 'POST' });
```

**After:**
```typescript
// All in one endpoint
await fetch('/api/auth/email-verification', {
  method: 'POST',
  body: JSON.stringify({ action: 'status' })
});

await fetch('/api/auth/email-verification', {
  method: 'POST',
  body: JSON.stringify({ action: 'verify', token })
});

await fetch('/api/auth/email-verification', {
  method: 'POST',
  body: JSON.stringify({ action: 'resend', email })
});
```

---

## Estimated Impact

- **Routes Reduced:** 10 → 7 (30% reduction)
- **API Surface Complexity:** Reduced by 3 endpoints
- **Frontend Code Savings:** ~50 lines (AuthContext, Account page)
- **Database Calls Saved:** None (logic restructuring, not optimization)
- **Development Time:** 2-3 hours for refactor + testing

