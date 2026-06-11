# PDF Download & Generation APIs Audit

## Overview
**Total Routes:** 4  
**Critical Issues:** 1  
**High Priority Issues:** 1  
**Severity:** HIGH

---

## API Routes

### 1. `/api/download` 🔴 **DEPRECATED**
**File:** `app/api/download/route.ts`  
**Type:** PDF Download (Legacy)  
**Purpose:** Downloads resume as PDF  
**HTTP Method:** GET  
**Called From:** **Nowhere** (v2 is preferred)

**Current Implementation:**
```typescript
export async function GET(request: Request) {
  const url = new URL(request.url);
  const resumeId = url.searchParams.get('id');
  
  // Load resume data
  // Convert to PDF using library
  // Stream response
}
```

**Status:** 🔴 **DEPRECATED** - Version 2 exists and is actively used
- Verified: `/api/download/v2` is the endpoint frontend uses (line 339 in preview/page.tsx)
- No frontend calls to `/api/download`
- v1 is ~156 lines of code

**Issue:**
- Maintains duplicate code
- Adds API surface complexity
- Creates confusion about which version to use

**Proposed Action:**
- ✅ **Delete entirely** - consolidate 4 → 3 routes
- Keep `/api/download/v2` only
- Update any remaining references

---

### 2. `/api/download/v2` ✅
**File:** `app/api/download/v2/route.ts`  
**Type:** PDF Download (Refactored)  
**Purpose:** Downloads resume as PDF  
**HTTP Method:** GET  
**Called From:** Resume preview page (line 339 in `app/builder/resumes/[slug]/preview/page.tsx`)

**Current Implementation:**
```typescript
export async function GET(request: Request) {
  const url = new URL(request.url);
  const resumeId = url.searchParams.get('id');
  
  // Check authentication
  const session = await auth();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  
  // Load resume
  const resume = await prisma.resume.findUnique({
    where: { id: resumeId },
    include: { /* nested relations */ }
  });
  
  // Convert to PDF
  const pdf = await generatePDF(resume);
  
  // Stream response
  return new Response(pdf, {
    headers: { 'Content-Type': 'application/pdf' }
  });
}
```

**Status:** ✅ No issues - this is the correct endpoint to use

---

### 3. `/api/generate` 🔴 **DEPRECATED**
**File:** `app/api/generate/route.ts`  
**Type:** PDF Generation with Quota (Legacy)  
**Purpose:** Generate and save resume PDF, tracking quota usage  
**HTTP Method:** POST  
**Called From:** **Nowhere** (v2 is preferred)

**Current Implementation:**
```typescript
export async function POST(request: Request) {
  // Generate PDF
  // Increment quota counter
  // Save/return PDF
}
```

**Status:** 🔴 **DEPRECATED** - Version 2 exists
- v1 is ~207 lines
- v2 is ~171 lines (cleaner)
- No frontend calls identified to v1
- v2 has better error handling and browser control logic

**Issue:**
- Duplicate endpoint
- Same functionality as v2
- Adds maintenance burden

**Proposed Action:**
- ✅ **Delete entirely** - consolidate 4 → 3 routes
- Keep `/api/generate/v2` only
- Update any remaining references

---

### 4. `/api/generate/v2` ✅
**File:** `app/api/generate/v2/route.ts`  
**Type:** PDF Generation with Quota (Refactored)  
**Purpose:** Generate and save resume PDF with quota tracking  
**HTTP Method:** POST  
**Called From:** Resume generation flow

**Current Implementation:**
```typescript
export async function POST(request: Request) {
  const session = await auth();
  
  // Check quota
  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id }
  });
  
  if (subscription.pdfGenerations >= subscription.pdfGenerationsLimit) {
    return Response.json({ error: 'Quota exceeded' }, { status: 429 });
  }
  
  // Generate PDF
  const pdf = await generateResumePDF(resumeData, {
    browserControl: true,
    headers: true
  });
  
  // Save to storage
  // Increment quota
  // Return URL
}
```

**Status:** ✅ No issues - this is the correct endpoint to use

---

## Critical Issues & Recommendations

### Issue #1: Duplicate Legacy Endpoints

**Current State:**
```
Routes 4:
  ✅ /api/download/v2 (ACTIVE)
  🔴 /api/download (LEGACY - NOT USED)
  ✅ /api/generate/v2 (ACTIVE)
  🔴 /api/generate (LEGACY - NOT USED)
```

**Why This Is A Problem:**
1. **Maintenance burden:** Two versions of same code to maintain
2. **Confusion:** New developers don't know which to use
3. **Inconsistency:** v1 and v2 might diverge in bug fixes
4. **API complexity:** Unnecessary endpoints in API

**Solution:**
✅ **Delete v1 endpoints entirely**

**Files to Delete:**
- `app/api/download/route.ts` (156 lines)
- `app/api/generate/route.ts` (207 lines)
- **Total:** 363 lines of dead code

**Final State:**
```
Routes 2:
  ✅ /api/download/v2 → Rename to /api/download
  ✅ /api/generate/v2 → Rename to /api/generate
```

**Migration Steps:**

**Step 1: Rename v2 to v1 (cleaner naming)**
```bash
# Rename routes
app/api/download/v2/route.ts → app/api/download/route.ts
app/api/generate/v2/route.ts → app/api/generate/route.ts

# Update any internal imports (if any)
```

**Step 2: Update frontend if needed**
```typescript
// Before
fetch('/api/download/v2?id=resume-123')
fetch('/api/generate/v2', { method: 'POST', body })

// After
fetch('/api/download?id=resume-123')
fetch('/api/generate', { method: 'POST', body })
```

**Step 3: Verify tests**
- Run all resume download/generation tests
- Verify PDF quality/formatting

**Step 4: Clean up**
- Delete original v1 files
- Commit cleanup

**Effort:** 15 minutes  
**Risk:** LOW (clean removal of unused code)  
**Testing:** Run existing tests to verify

---

### Issue #2: PDF Generation Options Inconsistency

**Current Issue:**
Looking at v2 implementations, there's an inconsistency in how options are passed:

**In `/api/download/v2`:**
```typescript
// Uses browser-control option
const pdf = await generatePDF(resumeData, {
  browserControl: false // No browser
});
```

**In `/api/generate/v2`:**
```typescript
// Uses browser-control option
const pdf = await generateResumePDF(resumeData, {
  browserControl: true // With browser
});
```

**Why The Difference?**
- Download: Simple PDF stream (no extra processing)
- Generate: Save to storage with header/footer (needs browser control)

**Status:** ✅ This difference is intentional and correct

---

## Cleanup Checklist

- [ ] Verify no frontend code calls `/api/download` or `/api/generate`
- [ ] Verify no other APIs call `/api/download` or `/api/generate`
- [ ] Check for any hardcoded URLs in documentation
- [ ] Search codebase for "download/route" and "generate/route" references
- [ ] Run full test suite
- [ ] Delete `/app/api/download/route.ts`
- [ ] Delete `/app/api/generate/route.ts`
- [ ] Rename `/app/api/download/v2` → `/app/api/download`
- [ ] Rename `/app/api/generate/v2` → `/app/api/generate`
- [ ] Update any remaining references in code/docs
- [ ] Commit with message: "cleanup: remove deprecated PDF endpoints, consolidate to v2 versions"

---

## Verification Commands

```bash
# Search for any references to old endpoints
grep -r "download/route" . --include="*.ts" --include="*.tsx"
grep -r "generate/route" . --include="*.ts" --include="*.tsx"
grep -r "/api/download'" . --include="*.ts" --include="*.tsx"  # v1 fetch
grep -r "/api/generate'" . --include="*.ts" --include="*.tsx"  # v1 fetch
grep -r "/api/download\"" . --include="*.ts" --include="*.tsx"
grep -r "/api/generate\"" . --include="*.ts" --include="*.tsx"

# If any results found, update those references before deletion
```

---

## Estimated Impact

- **Routes Consolidation:** 4 → 2 (50% reduction)
- **Dead Code Removal:** 363 lines
- **Maintenance Burden:** Reduced
- **API Clarity:** Improved (no confusion about v1 vs v2)
- **Performance:** No change (same logic)
- **User Impact:** None (transparent refactor)

---

## Timeline

**Estimated Time to Complete:**
- Verification search: 5 minutes
- Code refactor (rename v2 → main): 5 minutes
- Delete old files: 2 minutes
- Testing: 10 minutes
- **Total: 22 minutes**

**Risk Level:** LOW

**Recommendation:** Do this cleanup in the next sprint - it's a quick win that reduces technical debt.

