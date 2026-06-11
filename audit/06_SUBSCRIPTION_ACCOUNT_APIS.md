# Subscription & Account APIs Audit

## Overview
**Total Routes:** 8  
**Critical Issues:** 0  
**Medium Priority Issues:** 2  
**Severity:** MEDIUM

---

## Subscription Routes

### 1. `/api/subscription`
**File:** `app/api/subscription/route.ts`  
**Type:** Subscription Management  
**Purpose:** Get/set user subscription and plan  
**HTTP Methods:** GET, POST  
**Called From:** AuthContext (lines 183, 200)

**Current Implementation:**
```typescript
// GET - Get subscription info
export async function GET(request: Request) {
  const session = await auth();
  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id }
  });
  return Response.json(subscription);
}

// POST - Set subscription/plan
export async function POST(request: Request) {
  const { planId } = await request.json();
  const subscription = await prisma.subscription.update({
    where: { userId: session.user.id },
    data: { plan: planId }
  });
  return Response.json(subscription);
}
```

**Called Locations:**
- AuthContext line 183: `fetch('/api/subscription')` - GET
- AuthContext line 200: `fetch('/api/subscription', { method: 'POST' })` - POST

**Status:** ⚠️ Could be optimized for throttling, but functional

---

### 2. `/api/subscription/increment` ⚠️ **CONSOLIDATION CANDIDATE**
**File:** `app/api/subscription/increment/route.ts`  
**Type:** Quota Usage Tracking  
**Purpose:** Increments usage counters for various operations  
**HTTP Method:** POST  
**Called From:** AuthContext (line 222)

**Current Implementation:**
```typescript
export async function POST(request: Request) {
  const { type } = await request.json(); // 'pdf', 'analysis', etc.
  
  const subscription = await prisma.subscription.update({
    where: { userId: session.user.id },
    data: {
      [`${type}Generated`]: { increment: 1 }
    }
  });
  
  return Response.json(subscription);
}
```

**Called From:**
- AuthContext line 222: `fetch('/api/subscription/increment', { method: 'POST' })`

**Issue:**
- Separate endpoint just for incrementing
- Could be merged with `/api/subscription` using action parameter

**Proposed Consolidation:**
```typescript
// POST /api/subscription
export async function POST(request: Request) {
  const body = await request.json();
  
  if (body.action === 'set-plan') {
    // Set plan
    return Response.json(await updateSubscriptionPlan(body.planId));
  } else if (body.action === 'increment') {
    // Increment quota
    return Response.json(await incrementUsage(body.type));
  }
}
```

**Frontend Usage:**
```typescript
// Before: 2 endpoints
await fetch('/api/subscription', { method: 'POST', body: { planId } });
await fetch('/api/subscription/increment', { method: 'POST', body: { type: 'pdf' } });

// After: 1 endpoint
await fetch('/api/subscription', { method: 'POST', body: { action: 'set-plan', planId } });
await fetch('/api/subscription', { method: 'POST', body: { action: 'increment', type: 'pdf' } });
```

---

### 3. `/api/subscription/reset` ⚠️ **CONSOLIDATION CANDIDATE**
**File:** `app/api/subscription/reset/route.ts`  
**Type:** User-Initiated Quota Reset  
**Purpose:** Allows user to reset their quota mid-cycle  
**HTTP Method:** POST  
**Called From:** Settings/Account page (user action)

**Current Implementation:**
```typescript
export async function POST(request: Request) {
  const session = await auth();
  
  // Reset all counters to 0
  const subscription = await prisma.subscription.update({
    where: { userId: session.user.id },
    data: {
      pdfGenerated: 0,
      analysisGenerated: 0,
      // ... other counters
    }
  });
  
  return Response.json(subscription);
}
```

**Issue:**
- 3 separate reset endpoints (see below)
- Same functionality with different access levels
- Potential confusion about which one to call

---

### 4. `/api/admin/subscriptions` 
**File:** `app/api/admin/subscriptions/route.ts`  
**Type:** Admin Subscription Management  
**Purpose:** Admin CRUD for all subscriptions  
**HTTP Methods:** GET, POST, PATCH, DELETE  
**Called From:** Admin dashboard

**Status:** ✅ Appropriate - admin-only operations

---

### 5. `/api/admin/subscriptions/reset` 🔴 **PROBLEMATIC**
**File:** `app/api/admin/subscriptions/reset/route.ts`  
**Type:** Admin Bulk Reset  
**Purpose:** Admin can reset ALL user subscriptions  
**HTTP Method:** POST  
**Called From:** Admin action

**Current Implementation:**
```typescript
export async function POST(request: Request) {
  const session = await auth();
  if (!isAdmin(session.user)) return { error: 'Forbidden' };
  
  // Reset ALL subscriptions!
  await prisma.subscription.updateMany({
    data: {
      pdfGenerated: 0,
      analysisGenerated: 0,
      // ... all counters
    }
  });
  
  return Response.json({ success: true });
}
```

**Issue:** 🔴 **DANGEROUS**
- Resets ALL users' quotas at once
- No safety checks or confirmation
- Could be accidentally triggered
- Better alternative exists (see `/api/cron/subscription-reset`)

**Recommendation:**
- ⚠️ Remove this endpoint
- Use `/api/cron/subscription-reset` instead (more intelligent, selective)
- Or add `/api/admin/subscriptions/{userId}/reset` (per-user, safer)

---

### 6. `/api/cron/subscription-reset` ✅
**File:** `app/api/cron/subscription-reset/route.ts`  
**Type:** Automated Quota Reset  
**Purpose:** Runs daily to reset FREE tier quotas after 24 hours  
**HTTP Method:** POST  
**Called From:** Vercel cron trigger

**Current Implementation:**
```typescript
export async function POST(request: Request) {
  // Security: Verify cron secret
  if (request.headers.get('authorization') !== `Bearer ${CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Get subscriptions due for reset
  const subscriptionsToReset = await prisma.subscription.findMany({
    where: {
      plan: 'FREE',
      lastResetAt: {
        lt: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }
    }
  });
  
  // Reset only these subscriptions
  await prisma.subscription.updateMany({
    where: {
      id: { in: subscriptionsToReset.map(s => s.id) }
    },
    data: {
      pdfGenerated: 0,
      analysisGenerated: 0,
      lastResetAt: new Date()
    }
  });
  
  return Response.json({ 
    success: true, 
    resetCount: subscriptionsToReset.length 
  });
}
```

**Status:** ✅ Good - intelligent reset logic

---

## Account Management Routes

### 1. `/api/account`
**File:** `app/api/account/route.ts`  
**Type:** User Account Management  
**Purpose:** Profile updates, password changes, account deletion  
**HTTP Methods:** PATCH, DELETE  
**Called From:** Account/Settings pages (4 times each)

**Current Implementation:**
```typescript
// PATCH - Update profile or password
export async function PATCH(request: Request) {
  const body = await request.json();
  
  if (body.action === 'update-profile') {
    return updateProfile(body);
  } else if (body.action === 'change-password') {
    return changePassword(body);
  }
}

// DELETE - Delete account
export async function DELETE(request: Request) {
  return deleteAccount(session.user.id);
}
```

**Called From:**
- Account page: Profile update, password change, account deletion
- Settings page: Profile update, password change, account deletion

**Status:** ⚠️ Functionality duplicated in Account vs Settings pages (see duplication section)

---

### 2. `/api/account/restore` ✅
**File:** `app/api/account/restore/route.ts`  
**Type:** Account Recovery  
**Purpose:** Restores previously deleted account  
**HTTP Method:** POST  
**Called From:** Account deletion recovery flow

**Status:** ✅ No issues

---

### 3. `/api/guest-usage`
**File:** `app/api/guest-usage/route.ts`  
**Type:** Guest Quota Tracking  
**Purpose:** Tracks quotas for guest/unauthenticated users  
**HTTP Methods:** GET, POST  
**Called From:** Guest analysis feature

**Status:** ✅ No issues

---

## Summary of Issues

| Issue | Severity | Type | Consolidation Target |
|-------|----------|------|----------------------|
| `/api/subscription/increment` | MEDIUM | Consolidation | Merge into `/api/subscription` with action param |
| `/api/subscription/reset` + `/api/admin/subscriptions/reset` | HIGH | Duplication | Keep user reset, remove/replace admin reset |
| Account/Settings page duplication | HIGH | Frontend | Consolidate into single component |

---

## Detailed Recommendations

### Issue #1: Subscription Reset Endpoints

**Current State:**
```
3 reset endpoints:
1. /api/subscription/reset (User-triggered)
2. /api/admin/subscriptions/reset (Admin bulk - DANGEROUS)
3. /api/cron/subscription-reset (Automated - INTELLIGENT)
```

**Recommended Changes:**

✅ **Keep:**
- `/api/subscription/reset` (User-initiated, safe)
- `/api/cron/subscription-reset` (Automated, selective)

❌ **Remove:**
- `/api/admin/subscriptions/reset` (Dangerous bulk operation)

**Replacement for Admin:**
Create `/api/admin/subscriptions/{userId}/reset` for per-user reset:

```typescript
// POST /api/admin/subscriptions/[userId]/reset
export async function POST(request: Request, { params }) {
  if (!isAdmin(session.user)) return { error: 'Forbidden' };
  
  // Reset single user only
  const subscription = await prisma.subscription.update({
    where: { userId: params.userId },
    data: {
      pdfGenerated: 0,
      analysisGenerated: 0,
      lastResetAt: new Date()
    }
  });
  
  return Response.json(subscription);
}
```

**Benefits:**
- ✅ Removes dangerous bulk operation
- ✅ Enables targeted admin resets
- ✅ Better audit trail
- ✅ Safer operations

---

### Issue #2: Increment Quota Consolidation

**Before:**
```typescript
// Two API calls with different endpoints
await fetch('/api/subscription', {
  method: 'POST',
  body: JSON.stringify({ planId: 'pro' })
});

await fetch('/api/subscription/increment', {
  method: 'POST',
  body: JSON.stringify({ type: 'pdf' })
});
```

**After:**
```typescript
// Single endpoint, different actions
await fetch('/api/subscription', {
  method: 'POST',
  body: JSON.stringify({ action: 'set-plan', planId: 'pro' })
});

await fetch('/api/subscription', {
  method: 'POST',
  body: JSON.stringify({ action: 'increment', type: 'pdf' })
});
```

**Implementation:**
```typescript
// app/api/subscription/route.ts - Update POST
export async function POST(request: Request) {
  const body = await request.json();
  const session = await auth();
  
  if (body.action === 'set-plan') {
    return Response.json(
      await updateSubscriptionPlan(session.user.id, body.planId)
    );
  }
  
  if (body.action === 'increment') {
    return Response.json(
      await incrementUsage(session.user.id, body.type)
    );
  }
  
  return Response.json({ error: 'Invalid action' }, { status: 400 });
}
```

**Delete:** `/api/subscription/increment/route.ts` entirely

---

## Account/Settings Page Duplication

**Critical Issue:** Two nearly identical pages
- `/app/builder/account/page.tsx` (506 lines)
- `/app/builder/settings/page.tsx` (493 lines)

**Issues:**
- 100% code duplication
- 4 identical API calls in each
- Single bug fix requires two changes
- User confusion about which to use

**Recommended Solution:**

Create single unified page at `/app/builder/account-settings/page.tsx`:
```typescript
export default function AccountSettingsPage() {
  return <AccountSettings />;
}
```

Use one location for both, or:
- Keep `/app/builder/account` as primary
- Redirect `/app/builder/settings` to account page
- Or consolidate into single "Account & Settings" component

**Benefit:**
- Eliminate 500+ lines of duplicate code
- Single source of truth
- Easier maintenance
- Consistent user experience

---

## Migration Plan

### Phase 1: Consolidate Subscription Endpoints
**Time:** 30 minutes
1. Update `/api/subscription` POST to handle actions
2. Update AuthContext to use new endpoint
3. Delete `/api/subscription/increment`
4. Test quota tracking

### Phase 2: Fix Admin Reset
**Time:** 20 minutes
1. Create `/api/admin/subscriptions/[userId]/reset`
2. Delete `/api/admin/subscriptions/reset`
3. Update admin UI if needed
4. Test per-user reset

### Phase 3: Account/Settings Consolidation
**Time:** 1 hour
1. Create unified AccountSettings component
2. Update routing
3. Delete duplicate page
4. Test both paths

---

## Estimated Impact

- **Routes Reduced:** 8 → 6 (25% reduction)
- **API Calls:** Slightly reduced through consolidation
- **Code Duplication:** Eliminated
- **Maintenance Burden:** Significantly reduced
- **Safety:** Improved (no dangerous bulk reset)
- **Development Time:** 2 hours total

