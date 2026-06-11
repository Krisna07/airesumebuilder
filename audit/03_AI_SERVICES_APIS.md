# AI Services APIs Audit

## Overview
**Total Routes:** 8  
**Critical Issues:** 0  
**Medium Priority Issues:** 2  
**Severity:** MEDIUM

---

## API Routes

### 1. `/api/ai/analyze`
**File:** `app/api/ai/analyze/route.ts`  
**Type:** Resume-Job Matching Analysis  
**Purpose:** Analyzes resume against job description  
**HTTP Method:** POST  
**Called From:** Analysis component, job matcher

**Current Implementation:**
- Analyzes resume content against job description
- Returns match score and suggestions
- Uses AI model for intelligent matching

**Status:** ✅ No issues - focused single purpose

---

### 2. `/api/ai/generate-resume`
**File:** `app/api/ai/generate-resume/route.ts`  
**Type:** AI Resume Generation  
**Purpose:** Generates complete resume using AI  
**HTTP Method:** POST  
**Called From:** Resume generation wizard

**Current Implementation:**
- Takes user input and preferences
- Calls AI to generate resume content
- Saves generated resume to database

**Status:** ✅ No issues - focused single purpose

---

### 3. `/api/ai/extract-resume` ⚠️ **CONSOLIDATION CANDIDATE**
**File:** `app/api/ai/extract-resume/route.ts`  
**Type:** Resume Data Extraction  
**Purpose:** Extracts structured data from uploaded resume PDF  
**HTTP Method:** POST  
**Called From:** Resume upload, import flow (authenticated users)

**Related Endpoint:** `/api/ai/extract-resume-guest` (see below)

**Current Implementation:**
```typescript
export async function POST(request: Request) {
  // Authenticated users only
  const session = await auth();
  
  const formData = await request.formData();
  const file = formData.get('file') as File;
  
  // Extract text from PDF
  // Parse with AI
  // Return structured data
}
```

**Issue:** Two nearly identical endpoints for authenticated vs guest users
- `/api/ai/extract-resume` - Authenticated users
- `/api/ai/extract-resume-guest` - Guest users
- Both do same extraction, just auth difference

---

### 4. `/api/ai/extract-resume-guest` ⚠️ **CONSOLIDATION CANDIDATE**
**File:** `app/api/ai/extract-resume-guest/route.ts`  
**Type:** Resume Data Extraction (Guest)  
**Purpose:** Extracts structured data from uploaded resume PDF (for guests)  
**HTTP Method:** POST  
**Called From:** Guest user resume upload

**Issue:** Duplicate endpoint - see `/api/ai/extract-resume` above

**Current Implementation:**
- Same functionality as authenticated version
- Only difference: No authentication required
- Could be merged with single endpoint

**Proposed Consolidation:**
```typescript
// Single endpoint: POST /api/ai/extract-resume
export async function POST(request: Request) {
  // Check if authenticated
  const session = await auth();
  
  // If not authenticated, allow guest extraction
  // Same logic for both paths
  
  const formData = await request.formData();
  const file = formData.get('file') as File;
  
  // Extract and return
}
```

**Migration Path:**
- Keep both endpoints initially
- Update frontend to use single endpoint
- Deprecate guest endpoint after 1 release

---

### 5. `/api/ai/extract-job`
**File:** `app/api/ai/extract-job/route.ts`  
**Type:** Job Description Data Extraction  
**Purpose:** Extracts structured data from job posting (URL or text)  
**HTTP Method:** POST  
**Called From:** Job description import, job matcher

**Current Implementation:**
- Parses job posting text or URL
- Extracts key information (title, requirements, etc.)
- Returns structured data

**Status:** ✅ No issues - focused single purpose

---

### 6. `/api/ai/generate-coverletter`
**File:** `app/api/ai/generate-coverletter/route.ts`  
**Type:** Cover Letter Generation  
**Purpose:** Generates cover letter using AI  
**HTTP Method:** POST  
**Called From:** Cover letter generator component

**Current Implementation:**
- Takes resume and job description
- Uses AI to generate personalized cover letter
- Returns generated text

**Status:** ✅ No issues - focused single purpose

---

### 7. `/api/ai/analyze-public` ⚠️ **DUPLICATION CONCERN**
**File:** `app/api/ai/analyze-public/route.ts`  
**Type:** Public Resume-Job Matching Analysis  
**Purpose:** Public version of analyze endpoint (no auth required)  
**HTTP Method:** POST  
**Called From:** Public analysis page

**Current Implementation:**
- Same logic as `/api/ai/analyze`
- Only difference: No authentication required
- Serves public/shared analysis requests

**Potential Issue:**
- Could be merged with `/api/ai/analyze` if authentication check is optional
- However, might have different quota/rate limiting

**Status:** ⚠️ Potentially consolidatable, but verify quota/rate limits first

---

### 8. `/api/ai/generate-section`
**File:** `app/api/ai/generate-section/route.ts`  
**Type:** Resume Section Generation  
**Purpose:** Generates specific resume section (experience, skills, etc.)  
**HTTP Method:** POST  
**Called From:** Resume editor, section wizard

**Current Implementation:**
- Takes section type and context
- Uses AI to generate that specific section
- Returns generated content

**Status:** ✅ No issues - focused single purpose

---

## Summary of Issues

| Issue | Severity | Type | File | Consolidation Target |
|-------|----------|------|------|----------------------|
| Duplicate extract endpoints | MEDIUM | Consolidation | `/api/ai/extract-resume` + `/api/ai/extract-resume-guest` | Single endpoint |
| Public analysis endpoint | MEDIUM | Consolidation | `/api/ai/analyze` vs `/api/ai/analyze-public` | Verify rate limits |

---

## Detailed Analysis

### Issue #1: Resume Extraction Duplication

**Current State:**
- 2 endpoints doing essentially the same thing
- Separate code maintenance burden
- Duplicate business logic

**File Comparison:**

| Aspect | Extract-Resume | Extract-Resume-Guest |
|--------|----------------|-----------------------|
| Auth Required | YES | NO |
| PDF Processing | Same | Same |
| AI Parsing | Same | Same |
| Return Format | Same | Same |
| Error Handling | Similar | Similar |

**Consolidation Options:**

**Option A: Single endpoint with optional auth**
```typescript
// POST /api/ai/extract-resume
export async function POST(request: Request) {
  const session = await auth(); // Optional, won't error if missing
  
  const formData = await request.formData();
  const file = formData.get('file') as File;
  
  // Apply guest limits if no session
  if (!session?.user?.id) {
    // Check guest quota
    const guestQuota = await getGuestQuota(request.ip);
    if (guestQuota.used >= guestQuota.limit) {
      return Response.json({ error: 'Guest limit exceeded' }, { status: 429 });
    }
  }
  
  // Same extraction logic for both
  const extracted = await extractResumeData(file);
  
  // Track guest usage if needed
  if (!session?.user?.id) {
    await incrementGuestQuota(request.ip);
  }
  
  return Response.json(extracted);
}
```

**Option B: Keep separate but share implementation**
```typescript
// Shared extraction logic in lib/ai/resumeExtractor.ts
export async function extractResumeData(file: File) {
  // Common implementation
}

// app/api/ai/extract-resume/route.ts
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  
  const file = await getFormDataFile(request);
  return Response.json(await extractResumeData(file));
}

// app/api/ai/extract-resume-guest/route.ts
export async function POST(request: Request) {
  // Guest-specific logic (rate limiting, etc.)
  const file = await getFormDataFile(request);
  return Response.json(await extractResumeData(file));
}
```

**Recommendation:** Option A is cleaner - single endpoint handling both cases

---

### Issue #2: Public Analysis Endpoint

**Current State:**
- `/api/ai/analyze` - Authenticated
- `/api/ai/analyze-public` - Public

**Questions to Verify:**
1. Are rate limits different?
2. Are there different quotas?
3. Is the response structure identical?
4. Are there different payment tiers applied?

**If All Same:** Merge into single endpoint
```typescript
// POST /api/ai/analyze
export async function POST(request: Request) {
  const session = await auth(); // Optional
  
  const body = await request.json();
  const analysis = await analyzeResume(body);
  
  // Apply quotas if authenticated
  if (session?.user?.id) {
    await checkAuthenticatedQuota(session.user.id);
  } else {
    await checkPublicQuota(request.ip);
  }
  
  return Response.json(analysis);
}
```

**If Different Quotas:** Keep separate with shared logic
```typescript
// lib/ai/analyzer.ts - Shared logic
export async function analyzeResumeData(resume, job) { ... }

// /api/ai/analyze
export async function POST(request: Request) {
  const session = await auth();
  await checkAuthenticatedQuota(session.user.id); // Generous quota
  return Response.json(await analyzeResumeData(...));
}

// /api/ai/analyze-public
export async function POST(request: Request) {
  await checkPublicQuota(request.ip); // Strict quota
  return Response.json(await analyzeResumeData(...));
}
```

---

## Recommended Actions

### Priority 1: Quick Consolidation
- [ ] Extract common logic from authenticated/guest endpoints
- [ ] Create shared `lib/ai/extractors.ts` file
- [ ] Both endpoints call shared function
- **Effort:** 30 minutes
- **Benefit:** DRY code, easier maintenance

### Priority 2: Public Endpoints
- [ ] Verify if `/api/ai/analyze` and `/api/ai/analyze-public` have different quotas
- [ ] If same: Merge into single endpoint
- [ ] If different: Extract shared logic
- **Effort:** 20 minutes  
- **Benefit:** Reduced API surface

### Priority 3: Future Refactor
- [ ] Consider creating `/api/ai/[action]` dynamic route instead of separate files
- [ ] Would consolidate 8 endpoints into routing logic
- **Effort:** 2 hours
- **Benefit:** Consistent structure, easier to add new AI features

---

## Estimated Impact

- **Routes Consolidation:** 8 → 6-7 endpoints (possible 13% reduction)
- **Code Duplication Eliminated:** ~200 lines
- **Maintenance Burden:** Reduced
- **Performance:** No impact (same logic)
- **User Impact:** None (same functionality, transparent refactor)

