# Blog Management APIs Audit

## Overview
**Total Routes:** 7  
**Critical Issues:** 0  
**Medium Priority Issues:** 1  
**Severity:** LOW-MEDIUM

---

## API Routes

### 1. `/api/blogs`
**File:** `app/api/blogs/route.ts`  
**Type:** Blog CRUD  
**Purpose:** Create, read, update, delete blog posts  
**HTTP Methods:** GET, POST, PATCH, DELETE  
**Called From:** Blog editor, blog list

**Current Implementation:**
- GET: Returns all blogs for authenticated user
- POST: Creates new blog
- PATCH: Updates existing blog
- DELETE: Deletes blog (soft delete with `deleted` flag)

**Status:** ✅ No issues

---

### 2. `/api/blogs/[id]`
**File:** `app/api/blogs/[id]/route.ts`  
**Type:** Individual Blog  
**Purpose:** Get, update, delete specific blog  
**HTTP Methods:** GET, PATCH, DELETE  
**Called From:** Blog editor

**Status:** ✅ No issues

---

### 3. `/api/blogs/[id]/related` ⚠️ **CONSOLIDATION CANDIDATE**
**File:** `app/api/blogs/[id]/related/route.ts`  
**Type:** Related Blogs  
**Purpose:** Returns blogs related to a specific blog  
**HTTP Method:** GET  
**Called From:** Blog detail page

**Current Implementation:**
```typescript
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const blog = await prisma.blog.findUnique({
    where: { id: params.id }
  });
  
  // Find related blogs based on tags/categories
  const related = await prisma.blog.findMany({
    where: {
      tags: { some: { name: { in: blog.tags.map(t => t.name) } } },
      id: { not: params.id }
    },
    take: 5
  });
  
  return Response.json(related);
}
```

**Issue:** Could be merged with `/api/blogs/[id]` endpoint using query parameter
- Current: `/api/blogs/[id]/related` (GET)
- Proposed: `/api/blogs/[id]?include=related` (GET)

**Consolidation Option:**
```typescript
// GET /api/blogs/[id]?include=related,author,comments
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const url = new URL(request.url);
  const include = url.searchParams.get('include')?.split(',') || [];
  
  const blog = await prisma.blog.findUnique({
    where: { id: params.id },
    include: {
      related: include.includes('related'),
      author: include.includes('author'),
      comments: include.includes('comments')
    }
  });
  
  return Response.json(blog);
}
```

**Status:** ⚠️ Consolidatable but not critical

---

### 4. `/api/blogs/public/[slug]`
**File:** `app/api/blogs/public/[slug]/route.ts`  
**Type:** Public Blog Post  
**Purpose:** Get published blog by slug (no auth required)  
**HTTP Method:** GET  
**Called From:** Public blog pages

**Current Implementation:**
- Allows unauthenticated access to published blogs
- Fetches by slug instead of ID
- Returns public content only

**Status:** ✅ No issues - necessary for public access

---

### 5. `/api/blogs/public` ⚠️ **CONSOLIDATION CANDIDATE**
**File:** `app/api/blogs/public/route.ts`  
**Type:** Public Blog List  
**Purpose:** Lists all published blogs (paginated)  
**HTTP Method:** GET  
**Called From:** Public blog listing page

**Current Implementation:**
```typescript
export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '10');
  
  const blogs = await prisma.blog.findMany({
    where: { status: 'published', deleted: false },
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: 'desc' }
  });
  
  return Response.json(blogs);
}
```

**Potential Optimization:**
- Could implement filtering by category/tags via query params
- Could add search functionality

**Status:** ✅ Fine as-is, but could be enhanced

---

### 6. `/api/blog-images` ⚠️ **POTENTIAL DUPLICATION**
**File:** `app/api/blog-images/route.ts`  
**Type:** Blog Image Management  
**Purpose:** Upload and manage images for blog posts  
**HTTP Methods:** GET, POST  
**Called From:** Blog editor (2 calls - inline and cover)

**Current Implementation:**
```typescript
// POST - Upload image
export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  
  // Upload to storage (Supabase, etc.)
  // Save metadata to database
  // Return image URL
}

// GET - List images
export async function GET(request: Request) {
  const images = await prisma.blogImage.findMany({
    where: { authorId: session.user.id }
  });
  return Response.json(images);
}
```

**Issue:** Blog editor calls this endpoint twice per save:
- Line 1: Upload inline image
- Line 2: Upload cover image
- Could potentially batch these

**File:** `components/blog/BlogEditor.tsx`

**Current Flow:**
```typescript
// Save inline images
await Promise.all(
  inlineImages.map(img => uploadImage(img))
);

// Save cover image separately
await uploadImage(coverImage);
```

**Potential Fix:**
- Support array uploads in single endpoint
- Or implement batch upload endpoint
- See `/api/blog-images/[imageId]/route.ts` below

---

### 7. `/api/blog-images/[imageId]`
**File:** `app/api/blog-images/[imageId]/route.ts`  
**Type:** Individual Blog Image  
**Purpose:** Get, update, delete specific blog image  
**HTTP Methods:** GET, PATCH, DELETE  
**Called From:** Blog editor

**Status:** ✅ No issues

---

## Summary of Issues

| Issue | Severity | Type | File | Consolidation |
|-------|----------|------|------|-----------------|
| Related blogs subroute | LOW | Consolidation | `/api/blogs/[id]/related` | Merge into `/api/blogs/[id]` with query param |
| Multiple image uploads | MEDIUM | Optimization | `/api/blog-images` | Implement batch upload |

---

## Detailed Recommendations

### Issue #1: Related Blogs Subroute

**Current State:**
- Separate endpoint: `/api/blogs/[id]/related`
- Adds to API complexity
- Could use query parameters instead

**Before:**
```typescript
// Separate endpoint
const response = await fetch(`/api/blogs/${blogId}/related`);
const relatedBlogs = await response.json();
```

**After:**
```typescript
// With query parameter
const response = await fetch(`/api/blogs/${blogId}?include=related`);
const blog = await response.json();
const relatedBlogs = blog.related;
```

**Implementation:**
```typescript
// app/api/blogs/[id]/route.ts
export async function GET(request: Request) {
  const url = new URL(request.url);
  const include = url.searchParams.get('include')?.split(',') || [];
  
  const blog = await prisma.blog.findUnique({
    where: { id: params.id },
    include: {
      related: include.includes('related') ? { take: 5 } : false,
      author: include.includes('author'),
      comments: include.includes('comments')
    }
  });
  
  return Response.json(blog);
}

// Delete /api/blogs/[id]/related/route.ts entirely
```

**Effort:** 15 minutes  
**Impact:** Routes reduced 7 → 6

---

### Issue #2: Blog Image Upload Optimization

**Current Problem:**
Blog editor uploads images twice:
1. For inline/embedded images
2. For cover image

**Current Implementation:**
```typescript
// BlogEditor.tsx - Line X
const uploadImage = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/blog-images', {
    method: 'POST',
    body: formData
  });
  
  return response.json();
};

// Called twice
await uploadImage(inlineImage);
await uploadImage(coverImage);
```

**Option A: Batch Upload Endpoint**
```typescript
// POST /api/blog-images/batch
export async function POST(request: Request) {
  const formData = await request.formData();
  const files = formData.getAll('files') as File[];
  
  const uploaded = await Promise.all(
    files.map(file => uploadToStorage(file))
  );
  
  return Response.json(uploaded);
}
```

**Frontend Usage:**
```typescript
const formData = new FormData();
formData.append('files', inlineImage);
formData.append('files', coverImage);

const response = await fetch('/api/blog-images/batch', {
  method: 'POST',
  body: formData
});
```

**Option B: Single Upload with Type Designation**
```typescript
// POST /api/blog-images?type=inline|cover
formData.append('type', 'inline');
formData.append('file', file);
```

**Option C: Accept array in existing endpoint** ✅ Recommended
```typescript
// POST /api/blog-images
export async function POST(request: Request) {
  const formData = await request.formData();
  const files = formData.getAll('file'); // Handle both single and multiple
  
  if (Array.isArray(files) && files.length > 1) {
    // Batch upload
    const uploaded = await Promise.all(
      files.map(f => uploadImage(f))
    );
    return Response.json(uploaded);
  } else {
    // Single upload
    const file = formData.get('file');
    return Response.json(await uploadImage(file));
  }
}
```

**Frontend Implementation:**
```typescript
const uploadMultiple = async (images: File[]) => {
  const formData = new FormData();
  images.forEach(img => formData.append('file', img));
  
  const response = await fetch('/api/blog-images', {
    method: 'POST',
    body: formData
  });
  
  return response.json();
};

// Single call instead of two
const [inlineUrl, coverUrl] = await uploadMultiple([
  inlineImage,
  coverImage
]);
```

**Benefits:**
- ✅ Reduces API calls from 2 to 1 per blog save
- ✅ Faster upload (parallel processing)
- ✅ Backward compatible (single file still works)
- ✅ No new endpoint needed

**Effort:** 20 minutes  
**Impact:** 50% reduction in image upload API calls

---

## Estimated Impact

- **Routes Consolidation:** 7 → 6 (possible 14% reduction)
- **API Calls per Blog Save:** 2 → 1 (50% reduction)
- **Code Changes:** Minor
- **User Experience:** Faster blog saves
- **Backward Compatibility:** Maintained

