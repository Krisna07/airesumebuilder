# Airesumecraft

Airesumecraft is a Next.js (App Router) TypeScript application that helps users build, analyze, and generate tailored resumes using AI. It uses Prisma with PostgreSQL for persistence, NextAuth for authentication, and integrates with Google's GenAI for resume parsing and generation. The project includes server-side PDF generation and web-scraping utilities (Puppeteer) used by some API routes.

This README documents architecture, local setup, environment variables, database migrations, AI and Puppeteer notes, the email verification flow, developer workflows, and troubleshooting tips.

**Quick Links**
- **Project root:** README.md
- **App Router entry:** app/layout.tsx and app/page.tsx
- **API routes:** app/api/*
- **Prisma schema:** prisma/schema.prisma
- **AI wrapper:** services/aiServices.ts
- **Email helper:** utils/sendEmail.ts
- **Verification UI:** components/VerificationModal.tsx
- **Auth context:** context/authContext.tsx

---

## Table of Contents

- Project Overview
- Tech Stack
- Architecture and Key Files
- Environment Variables
- Getting Started (Local Development)
- Database: Prisma Migrations & Setup
- Puppeteer / PDF generation notes
- AI: GenAI integration
- Authentication & Email Verification Flow
- Tests & Linting
- Deployment
- Troubleshooting
- Security and Hardening Recommendations
- Contributing

---

## Project Overview

Airesumecraft is a resume builder web app with the following user flows:
- Sign up / Sign in (NextAuth with credentials and OAuth providers)
- Create and edit resume content using structured forms and rich text
- Analyze a resume against a job description using AI
- Generate a tailored resume from structured data and job descriptions using GenAI
- Export a resume to PDF (server-side rendering + Puppeteer)
- Email-based account verification using a 6-digit code stored server-side (Prisma)

The app is built with Next.js (App Router), TypeScript, and Prisma ORM. Several server-side API routes encapsulate the business logic and AI calls.

## Tech Stack

- Next.js (App Router, React 19) with TypeScript
- Prisma ORM with PostgreSQL (schema in `prisma/schema.prisma`)
- NextAuth for authentication (JWT session strategy)
- nodemailer for server-side email sending (via `utils/sendEmail.ts`)
- Puppeteer for PDF generation and job scraping (dynamic import between `puppeteer` and `puppeteer-core` depending on environment)
- Google GenAI client via `@google/genai` (wrapped in `services/aiServices.ts`)

---

## Architecture and Key Files

- `app/` - Next.js App Router files and server-side API routes.
  - `app/api/ai/*` - AI analysis and generation routes.
  - `app/api/auth/*` - Custom auth helpers, verification, resend, and NextAuth route.
  - `app/api/generate/` - PDF generation using Puppeteer.
- `components/` - React components and builder UI. Key components include `VerificationModal.tsx` and `Navbar.tsx`.
- `context/authContext.tsx` - Client auth helper functions and state (register, verifyCode, resendVerification).
- `services/aiServices.ts` - Wrapper around Google's GenAI API. Use this when adding or editing AI-related features.
- `utils/sendEmail.ts` - Nodemailer based email helper used by verification and other email flows.
- `prisma/schema.prisma` - DB schema. Resume JSON fields are stored as strings in the `Resume` model.
- `lib/jsonParse.ts` and `lib/prompts.ts` - JSON parsing helper and canonical prompts used by AI endpoints (prompts expect strict JSON output).

---

## Environment Variables

Create a `.env` (or provide environment variables in your environment) with the following keys. Many flows will throw or fail if these are not present.

- `DATABASE_URL` - Postgres connection string used by Prisma.
- `DIRECT_URL` - Optional direct connection string used for migrations in some setups (check `prisma.config.ts`).
- `GEMINI_API_KEY` - Required by `services/aiServices.ts` to call Google's GenAI.
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` - Used by NextAuth for Google OAuth provider.
- `NEXTAUTH_SECRET` - Secret used by NextAuth (JWT signing).
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` - Used by `utils/sendEmail.ts` for SMTP transport (nodemailer).
- `NODE_ENV` - `development` or `production` (affects Puppeteer dynamic import decision).

Add other provider secrets you need (GitHub, etc.) as configured in `app/api/auth/[...nextauth]/route.ts`.

---

## Getting Started (Local Development)

Prerequisites:
- Node.js LTS (check package.json engines if present)
- npm or yarn
- PostgreSQL (local or a hosted DB such as Neon). Set `DATABASE_URL` accordingly.

Installation steps:

```bash
npm install
# The project has a postinstall that installs local puppeteer browsers for development
# If you need to install the browsers manually:
npx puppeteer browsers install chrome

# Generate Prisma Client (required after any schema change):
npx prisma generate

# Run TypeScript typecheck (optional but recommended):
npx tsc --noEmit

# Start dev server:
npm run dev

```

Open http://localhost:3000 in your browser.

Notes:
- If you change `prisma/schema.prisma`, run `npx prisma generate` then create/apply a migration before running the app.
- Some API routes rely on the GenAI key; if `GEMINI_API_KEY` is missing, `services/aiServices.ts` may throw.

---

## Database: Prisma Migrations & Setup

Schema location: `prisma/schema.prisma`.

Common commands:

```bash
# Create a migration and apply to local DB
npx prisma migrate dev --name my_migration

# Apply pending migrations in non-interactive environments
npx prisma migrate deploy

# Generate Prisma Client after schema changes
npx prisma generate

# Open Prisma Studio (dev-only)
npx prisma studio

```

Important notes on schema:
- The `Resume` model stores JSON-like fields (profile, experiences, skills, etc.) as string columns. Routes parse/stringify these fields when reading/writing.
- A `Verification` model is used to store email verification codes (6-digit) and expiry timestamps. The app stores a `user.isVerified` boolean on the `User` model.

---

## Puppeteer / PDF Generation Notes

- Puppeteer is dynamically imported in server routes that generate or render PDFs to avoid bundling heavy browser binaries into the serverless runtime. Locally, the repository postinstall installs Chromium for `puppeteer`.
- In production, you may want to use `puppeteer-core` with a bundled Chromium provider like `@sparticuz/chromium` or a headless chrome binary available on the host.
- If you see errors about missing browser executable, run:

```bash
npx puppeteer browsers install chrome
```

or switch `app/api/generate/*` routes to `puppeteer-core` with an explicit `executablePath`.

---

## AI: GenAI Integration

- The app uses `@google/genai` through `services/aiServices.ts` with a default model (e.g., `gemini-2.5-flash-lite`).
- Prompts are defined in `lib/prompts.ts`. Several prompts require the model to RETURN ONLY VALID JSON. Do not change the parser in `lib/jsonParse.ts` without also updating prompt expectations.

Adding new AI calls:
- Add wrappers in `services/aiServices.ts` to keep API routes thin and to centralize model selection and retry/error handling.
- Keep prompt templates in `lib/prompts.ts` and ensure the model output is validated using `lib/jsonParse.ts`.

---

## Authentication & Email Verification Flow

Signup flow (high level):

1. Client calls `app/api/auth/newuser/route.ts` to create a `User` record with `isVerified: false`.
2. Server creates a `Verification` record with a 6-digit code and `expiresAt` timestamp, and sends the code via `utils/sendEmail.ts`.
3. The user enters the code in `components/VerificationModal.tsx`. Client posts to `app/api/auth/verify/route.ts`.
4. Server validates the code and expiry, sets `user.isVerified = true`, deletes the `Verification` record, and returns success.

Resend flow:

- POST `app/api/auth/resend/route.ts` with `{ email }` (or server uses authenticated session). The server generates a fresh code, upserts the `Verification` table, emails the new code, and returns the new `expiresAt`.
- The client has a cooldown and shows a countdown (modal reads `app/api/auth/verification/route.ts` to get current `expiresAt`).

NextAuth session sync:
- NextAuth `jwt` and `session` callbacks are configured to copy `user.isVerified` into the token and to read the authoritative `isVerified` from the DB in the session callback so the session object reflects the DB state.
- For immediate client session refresh after verifying, call `getSession()` or re-request the session on the client to ensure `useSession()` consumers see the updated `isVerified` immediately.

Security notes:
- Consider hashing verification codes at rest and adding rate limiting for resend endpoint. These are recommended improvements but not implemented in default code.

---

## Tests & Linting

- TypeScript checks: `npx tsc --noEmit`
- Linting: follow any `eslint` configuration present. Run `npm run lint` if configured.
- UI tests / E2E: not included by default. Consider adding Playwright or Cypress for end-to-end verification flows (email verification, signup, generate PDF).

---

## Deployment

General recommendations:

- Provide all required environment variables (see Environment Variables section).
- For Puppeteer in serverless or containerized environments, use `puppeteer-core` and a compatible Chromium binary or use a managed PDF generation service.
- Ensure `GEMINI_API_KEY` is set and allowed from your deployment region.
- Run database migrations during deploy (CI step):

```bash
npx prisma migrate deploy
npx prisma generate
```

- Consider caching or rate-limiting AI calls and guarding endpoints against abuse. GenAI calls may incur cost.

---

## Troubleshooting

- Error: "GEMINI_API_KEY missing" — Set `GEMINI_API_KEY` in your environment. The AI service wrapper will throw if missing.
- Error: Puppeteer can't find chromium — Run `npx puppeteer browsers install chrome` locally or configure `executablePath` for `puppeteer-core` in production.
- TypeScript import casing errors (TS1261) on Windows vs. Linux — Ensure import paths match the on-disk case (e.g., components/Ui vs components/UI). Use `npx tsc --noEmit` to detect.
- Prisma P1012 relation error when adding models — If you add a model with relation fields, ensure reciprocal relation fields are added on the opposite model.
- Email not sending — Verify SMTP environment variables and credentials in `utils/sendEmail.ts`. Check provider logs and consider using a transactional email service like SendGrid, Mailgun, or SES.

---

## Security & Hardening Recommendations

- Hash verification codes using a fast one-way hash (e.g., HMAC-SHA256 with a server secret) rather than storing codes in plaintext.
- Implement server-side rate limiting or a cooldown per email to prevent abuse of the resend endpoint.
- Validate and sanitize any HTML or untrusted user input used in email templates.
- Use secure cookie settings and set `NEXTAUTH_URL` properly in production deployments.

---

## Contributing

1. Fork the repo and create a feature branch.
2. Write tests for new functionality when applicable.
3. Run `npx tsc --noEmit` before opening a PR.
4. Open a PR with a clear description of your changes and link any related issue.


License: (add your preferred license)
