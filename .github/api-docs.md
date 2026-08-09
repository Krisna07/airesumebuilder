# Application API, Pages, and Workflow Reference

This document collects the existing API surface, relevant page entry points, security constraints, and the typical user workflow for the Airesumecraft resume builder. Details in each section reference live handlers so future contributors can quickly understand payload expectations and dependencies.

## API Reference

Responses across the API follow `{ success?: boolean, data?: any, error?: string, message?: string }` and surface NextAuth-protected cookies or bearer tokens for authenticated routes.

### Authentication & User Management
- **POST /api/auth/newuser** (see [app/api/auth/newuser/route.ts](app/api/auth/newuser/route.ts))
  - Body: `{ email, name?, image?, provider? ("credentials"|"google"|...), providerId?, password? }`.
  - Creates OAuth or credentials users; credentials path stores a hashed password, `isVerified: false`, and seeds a 6-digit `Verification` record that is emailed via `utils/sendEmail.ts`.
  - Returns the created/updated user (`{ id, email, name, image, provider, providerId, isVerified }`).
- **POST /api/auth/verify** ([app/api/auth/verify/route.ts](app/api/auth/verify/route.ts))
  - Body: `{ email, code }`.
  - Validates expiry and marks `user.isVerified`; deletes the code record and sends a welcome email.
- **POST /api/auth/resend** ([app/api/auth/resend/route.ts](app/api/auth/resend/route.ts))
  - Body: `{ email }`.
  - Regenerates the 6-digit code, updates `Verification.expiresAt`, and re-sends via email.
- **GET /api/auth/verification** ([app/api/auth/verification/route.ts](app/api/auth/verification/route.ts))
  - Query: `?email=<user email>`.
  - Returns the current `expiresAt` for a pending code or `{ verification: null }` if no code exists.
- **POST /api/auth/login** ([app/api/auth/login/route.ts](app/api/auth/login/route.ts))
  - Body: `{ email, password }`.
  - Validates credentials, signs a JWT with `NEXTAUTH_SECRET`, and responds `{ token, user }` for mobile clients.
- **GET /api/auth/me** ([app/api/auth/me/route.ts](app/api/auth/me/route.ts))
  - Requires NextAuth cookie or `Authorization: Bearer <token>`.
  - Returns the JWT-safe user summary `{ id, name, email, image }`.
- **POST /api/auth/logout** ([app/api/auth/logout/route.ts](app/api/auth/logout/route.ts))
  - No body.
  - Placeholder for explicit logout tracking; returns success.
- **POST /api/auth/forgot-password** ([app/api/auth/forgot-password/route.ts](app/api/auth/forgot-password/route.ts))
  - Body: `{ email? }` (session email used when missing).
  - Sends a password-reset code via `EmailService.sendPasswordReset` and logs it in `Verification`.
- **POST /api/auth/reset-password** ([app/api/auth/reset-password/route.ts](app/api/auth/reset-password/route.ts))
  - Body: `{ email?, code, newPassword, oldPassword? }`.
  - Requires code, enforces 8+ characters; if logged in, also validates `oldPassword`; hashes the new credential and deletes the code.

### Account Management
- **PATCH /api/account** ([app/api/account/route.ts](app/api/account/route.ts))
  - Body: `{ email, name?, currentPassword?, newPassword? }`.
  - Updates the user name and/or password (with current-password verification when a password already exists).
- **DELETE /api/account** ([app/api/account/route.ts](app/api/account/route.ts))
  - Requires NextAuth session.
  - Body: `{ password?, confirmText }` where `confirmText` must equal `DELETE`; credentials users must also provide `password`.
  - Deletes the user cascade (Prisma) and returns `{ success: true, deletedUserId }`.

### Subscription & Usage Tracking
- **GET /api/subscription** ([app/api/subscription/route.ts](app/api/subscription/route.ts))
  - Requires session.
  - Creates the `Subscription` record if missing; automatically applies `resetCountsData()` if 30+ days since `lastResetDate`.
- **POST /api/subscription** ([app/api/subscription/route.ts](app/api/subscription/route.ts))
  - Body: `{ plan?: "FREE" | "SUPPORTER" | "ULTIMATE" }`.
  - Upserts the subscriber plan while preserving usage counters.
- **POST /api/subscription/reset** ([app/api/subscription/reset/route.ts](app/api/subscription/reset/route.ts))
  - Session required.
  - Resets a user’s counts (`resetCountsData`) and returns the updated record.
- **POST /api/subscription/increment** ([app/api/subscription/increment/route.ts](app/api/subscription/increment/route.ts))
  - Body: `{ key: "regen"|"download"|"cl"|"analysis"|"upload", amount?: number }`.
  - Rate-limited per minute (30/min), auto-reset daily, and enforces quotas via `getQuotaForPlan`. Returns the updated subscription counters.
- **GET /api/admin/subscriptions** ([app/api/admin/subscriptions/route.ts](app/api/admin/subscriptions/route.ts))
  - Requires `isAdminEmail`; optional query `?plan=FREE|SUPPORTER|ULTIMATE` filters results.
  - Returns all `Subscription` entries with nested user info.
- **PATCH /api/admin/subscriptions** ([app/api/admin/subscriptions/route.ts](app/api/admin/subscriptions/route.ts))
  - Body: `{ plan, userId?, email? }`.
  - Admin-only plan override (upserts by user ID or email).
- **POST /api/admin/subscriptions/reset** ([app/api/admin/subscriptions/reset/route.ts](app/api/admin/subscriptions/reset/route.ts))
  - Admin-only blanket reset of all usage counters via `resetCountsData()`.

### Resume & Job Data
- **GET /api/resume** ([app/api/resume/route.ts](app/api/resume/route.ts))
  - Query: `?id=<resumeId>`.
  - Returns parsed strings (`profile`, `skills`, `experiences`, `educations`, `customSections`) plus `matchingScore`/`analyzedAt` when available.
- **PUT /api/resume** ([app/api/resume/route.ts](app/api/resume/route.ts))
  - Body: `{ id?, userId, title?, template?, profile, experiences, educations, skills, customSections }`.
  - Creates or updates the resume, stringifies JSON fields, and returns the normalized record.
- **DELETE /api/resume** ([app/api/resume/route.ts](app/api/resume/route.ts))
  - Query: `?id=<resumeId>`.
  - Soft-deletes by setting `deleted = true`.
- **GET /api/resume/all** ([app/api/resume/all/route.ts](app/api/resume/all/route.ts))
  - Query: `?id=<userId>`.
  - Returns every non-deleted resume for the user, sorted by `updatedAt`.
- **POST /api/resume/description** ([app/api/resume/description/route.ts](app/api/resume/description/route.ts))
  - Body: `{ userId, url?, description?, title, company, location, domain }`.
  - Stores job metadata (requires `title`, `company`, `location`, `domain`) and returns the stored `JobDescription`.
- **GET /api/resume/description** ([app/api/resume/description/route.ts](app/api/resume/description/route.ts))
  - Query: either `?resumeId=<resumeId>` (returns every job description with optional analysis info) or `?id=<descriptionId>` for a single record.

### AI & Resume Intelligence
- **POST /api/ai/analyze** ([app/api/ai/analyze/route.ts](app/api/ai/analyze/route.ts))
  - Body: `{ analyzeResumeParams: { resumeId, jobDetails?: { id?, title, ... }, jobDescriptionId?: string } }`.
  - Requires user session and `analysis` quota; writes or updates `AnalysisResult`, records `matchingScore`, and consumes subscription usage.
- **GET /api/ai/analyze**
  - Query: `?resumeId=<id>` returns all analyses for that resume; `?resumeId=<id>&jobDescriptionId=<jobId>` returns a single entry.
- **DELETE /api/ai/analyze**
  - Query: `?analysisId=<id>&resumeId=<id>` deletes a stored analysis record.
- **POST /api/ai/generate-resume** ([app/api/ai/generate-resume/route.ts](app/api/ai/generate-resume/route.ts))
  - Body: `{ resume: ResumeData, jobDescription: string }`.
  - Requires `regen` quota and returns the AI-generated `resume` payload.
- **POST /api/ai/generate-coverletter** ([app/api/ai/generate-coverletter/route.ts](app/api/ai/generate-coverletter/route.ts))
  - Body: `{ resumeId, jobDescriptionId, analysis? }`.
  - Loads the resume and job description, calls `AIService.generateCoverLetter`, consumes `cl` quota, and returns `{ data: coverLetter }`.
- **POST /api/ai/extract-job** ([app/api/ai/extract-job/route.ts](app/api/ai/extract-job/route.ts))
  - Body: `{ rawText }`.
  - Requires `analysis` quota, sends a strict JSON prompt to Gemini, parses the response via `lib/jsonParse.ts`, and returns normalized job metadata.
- **POST /api/ai/extract-resume** ([app/api/ai/extract-resume/route.ts](app/api/ai/extract-resume/route.ts))
  - Body: `{ text }`.
  - Requires `upload` quota and returns structured resume JSON plus success metadata.
- **GET /api/ai/extract-resume**
  - Simple ping that returns `{ status: 200, message: 'endpoint hit successfully' }`.
- **POST /api/ai/extract-resume-guest** ([app/api/ai/extract-resume-guest/route.ts](app/api/ai/extract-resume-guest/route.ts))
  - Body: `{ text }` (no session).
  - Reuses `AIService.generateResume` and returns extracted resume data for guest visitors.

### PDF Generation
- **POST /api/generate** ([app/api/generate/route.ts](app/api/generate/route.ts))
  - Body: `{ content?, resumeData?, template?, pageGap? }`.
  - Optionally builds HTML via `generateTemplateHTML`, launches Puppeteer (puppeteer-core + @sparticuz/chromium in production), renders to PDF, and responds with a `Content-Disposition` attachment.
- **POST /api/download** ([app/api/download/route.ts](app/api/download/route.ts))
  - Same shape as `/api/generate`; forces `networkidle0` before PDF creation and returns the same PDF stream.

### Job Scraping & Utilities
- **POST /api/scrape-job** ([app/api/scrape-job/route.ts](app/api/scrape-job/route.ts))
  - Body: `{ url? , urls?[] }` (up to five URLs).
  - Fetches HTML via Axios or Puppeteer (LinkedIn/Seek), heuristically extracts `title`, `company`, `location`, `description`, and returns `{ results[], meta }`.

### Billing & Webhooks
- **POST /api/webhooks/stripe** ([app/api/webhooks/stripe/route.ts](app/api/webhooks/stripe/route.ts))
  - Raw body + `stripe-signature` header.
  - Verifies webhook signature with `STRIPE_WEBHOOK_SECRET`, maps `productId` metadata to `SUPPORTER`/`ULTIMATE`, and upserts the `Subscription` record.

## Pages Reference

- **Home / Landing**: `app/page.tsx` uses `LandingPageComponents` (hero, features, template slider) to introduce the product.
- **Authentication**: `app/auth/page.tsx` routes authenticated users to `/builder`; `app/auth/signin/page.tsx` and `app/auth/newuser/page.tsx` render credential/OAuth forms; `app/auth/forgot-password/page.tsx` drives the password-reset flow.
- **Account**: `app/account/page.tsx` exposes profile updates, password reset buttons, and account deletion (calls `/api/account`).
- **Builder Experience**:
  - `app/builder/page.tsx` lists resumes, handles guest vs. logged-in states (`components/BuilderComponents/GuestUser.tsx`, `LoadingResumeState.tsx`).
  - `app/builder/[slug]/page.tsx` renders `MultiStepForm` with sections (`Forms/EducationStep.tsx`, etc.) to edit data stored via `/api/resume`.
  - `app/builder/[slug]/preview/page.tsx` shows the preview (template selector, job description list, analysis reports) and triggers AI/PDF endpoints.
  - `app/builder/build/page.tsx` hosts the PDF upload + resume extraction workflow (calls `/api/ai/extract-resume`).
- **Account Modals & UI**: `components/VerificationModal.tsx`, `components/Checkout.tsx`, and `components/SubscriptionStatus.tsx` orchestrate the modals shown on forms and builder pages.
- **Global Layout**: `app/layout.tsx` wires metadata/global `global.css`, while `components/Providers.tsx` wraps the app with `authContext` and theme providers.

## Security & Environment

- Required environment variables: `DATABASE_URL` (+ optional `DIRECT_URL`), `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `GEMINI_API_KEY`, `SUPPORTER`/`ULTIMATE`-linked Stripe keys (`STRIPE_PUBLIC_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`), SMTP creds (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`), and Puppeteer/Chromium toggles (`NODE_ENV`, `CHROMIUM_VERSION`, optional `AWS_LAMBDA_FUNCTION_VERSION`).
- NextAuth drives session gates via `app/api/auth/[...nextauth]/route.ts`; all `/api/auth/me`, `/api/subscription/*`, `/api/ai/*`, `/api/account`, and `/api/resume` endpoints expect a session token.
- Subscription quotas are defined in `lib/subscription.ts`; `lib/subscription-server.ts` checks before `analysis`, `regen`, `cl`, `upload`, and `download` operations.
- Email verification codes are stored in the `Verification` table, with POST `/api/auth/resend` controlling regeneration and `app/api/auth/forgot-password` reusing the same table for password resets.
- Webhook security: `/api/webhooks/stripe` rejects events lacking `stripe-signature` or when `STRIPE_WEBHOOK_SECRET` is unset.

## Workflow Summary

1. **Onboarding & Verification**: Visitors hit `/auth/newuser` → `app/api/auth/newuser` creates the user, generates a 6-digit `Verification` record, and emails the code → the client posts the code to `/api/auth/verify` → the server flags `user.isVerified` and deletes the verification row.
2. **Session & Subscription Sync**: NextAuth cookies keep `user.isVerified` in the JWT; `context/authContext.tsx` fetches `/api/subscription` (or `/api/admin/subscriptions/*` for admins) to show plan limits, while `/api/subscription/increment` tracks usage per AI call.
3. **Resume Lifecycle**: Builder forms call `/api/resume` to persist stringified JSON fields and `/api/resume/description` for job metadata; `/api/resume/all` powers the list view; analysis results persist to `AnalysisResult` via `/api/ai/analyze` and can be re-gated for cover letters and resume regeneration.
4. **AI / PDF Flow**: From the preview page, `/api/ai/analyze`, `/api/ai/generate-resume`, and `/api/ai/generate-coverletter` are called (respecting quotas). `/api/generate` or `/api/download` streams PDF output, and `components/Checkout.tsx` or Stripe webhooks keep billing in sync.
5. **Guest / Upload Paths**: Guests can hit `/api/ai/extract-resume-guest` to parse text, while authenticated users can POST to `/api/ai/extract-resume` and `/api/ai/extract-job` to infer structured data before saving to the builder.
6. **Admin Controls**: Admin emails (via `lib/admin.ts`) can query `/api/admin/subscriptions`, update plans, or reset counts, ensuring the UI enforces plan boundaries while the backend stays consistent.

Please ask for clarification if any endpoint or payload needs more granularity; happy to expand this doc with examples or add missing routes.