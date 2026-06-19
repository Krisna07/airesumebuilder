# AiResumeCraft

An AI-powered resume builder built with **Next.js 15**, **Prisma**, **PostgreSQL**, **Sanity CMS**, and **Stripe**. Users can sign up, create and customize resumes with multiple templates, generate AI-tailored content, analyze resumes against job descriptions, export PDFs, and manage subscriptions.

---

## Features

- **AI Resume Generation** — Generate and regenerate resume sections using Google Gemini models via OpenRouter fallback
- **Multiple Templates** — Swap between resume templates with live preview and a real-time style editor (fonts, colors, spacing, section order)
- **Job Description Analysis** — Scrape job listings and get a match score + tailored suggestions against your resume
- **PDF Export** — Server-side PDF rendering via Puppeteer / Chromium
- **Cover Letter Generation** — AI-generated cover letters matched to a specific job description
- **Authentication** — Credentials + Google + GitHub OAuth via NextAuth.js, with email verification flow
- **Subscriptions** — Stripe-powered FREE / SUPPORTER / ULTIMATE plans with per-feature usage limits (regens, downloads, analyses, uploads)
- **Blog / CMS** — Sanity Studio embedded for blog content management with automated publishing via a daily cron job
- **Admin Panel** — Manage users, resumes, subscriptions, and blog posts

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL (Neon serverless) |
| ORM | Prisma 7 |
| Auth | NextAuth.js 4 |
| AI | Google Gemini / OpenRouter |
| CMS | Sanity v5 |
| Payments | Stripe |
| PDF | Puppeteer Core + @sparticuz/chromium |
| Email | Nodemailer (SMTP) |
| Deployment | Vercel |

---

## Project Structure

```
app/                    # Next.js App Router pages + API routes
  api/
    ai/                 # Resume extraction & generation endpoints
    auth/               # Email verification, password reset
    resume/             # CRUD for resumes
    subscription/       # Usage increment + plan checks
    webhooks/stripe/    # Stripe webhook handler
    cron/blog/          # Daily cron — automated blog publishing
components/             # Shared UI components
  BuilderComponents/    # Resume builder UI (preview, style editor, regen)
  Templates/            # HTML resume templates
  Forms/                # Section forms
context/                # React contexts (auth, theme, popups)
hooks/                  # Custom React hooks
lib/                    # Server-side utilities
  prompts.ts            # All AI prompts
  jsonParse.ts          # Strict JSON extractor for AI output
  subscription-server.ts# Server-side plan/limit checks
  prisma.ts             # Prisma client singleton
services/               # Business logic
  aiServices.ts         # AI orchestration (OpenRouter)
  resumeServices.ts     # Resume CRUD + caching
  userService.ts        # User management
prisma/schema.prisma    # Database schema
schemaTypes/            # Sanity CMS schema
scripts/                # Subscription seed / reset / test utilities
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (Neon recommended)
- Google Gemini API key
- Stripe account
- SMTP credentials (Gmail app password or similar)
- Sanity project

### Installation

```bash
npm install
npx puppeteer browsers install chrome
npx prisma generate
npx prisma migrate deploy
npm run dev
```

### Environment Variables

Copy `.env.local` (or `.env`) and fill in:

```env
# Database
DATABASE_URL=

# Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=

# OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# AI
GEMINI_API_KEY=
OPENROUTER_API_KEY=

# Email (SMTP)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Sanity
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=
SANITY_API_TOKEN=
```

> **Never commit `.env` or `.env.local` to version control.** All env patterns are listed in `.gitignore`.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Generate Prisma client + build Next.js |
| `npm run lint` | ESLint check |
| `npx tsc --noEmit` | TypeScript type-check |
| `npm run subscription:seed` | Seed subscription records |
| `npm run subscription:reset` | Reset all subscription usage counters |
| `npm run subscription:test` | Run subscription integration tests |

---

## Data Model Highlights

- **Resume** — JSON fields (`profile`, `experiences`, `educations`, `skills`, `customSections`, `styleConfig`) stored as Prisma `Json`; always parse/stringify around Prisma calls.
- **Soft deletes** — Resumes use `deleted: Boolean @default(false)`; all queries filter `deleted: false`.
- **Subscription** — Per-user usage counters (`regenCount`, `downloadCount`, `clCount`, `analysisCount`, `uploadCount`) reset daily; limits enforced server-side in `lib/subscription-server.ts`.
- **Verification** — 6-digit email verification codes stored in the `Verification` model with `expiresAt`.

---

## Cron Jobs

| Path | Schedule | Purpose |
|---|---|---|
| `/api/cron/blog` | `0 0 * * *` (daily midnight UTC) | Automated blog post publishing via Sanity |

> Vercel Hobby plan supports one cron execution per day.

---

## Deployment (Vercel)

1. Push to GitHub — Vercel auto-deploys on merge to `main`.
2. Set all environment variables in the Vercel dashboard under **Settings → Environment Variables**.
3. The `build` script runs `prisma generate && next build` automatically.
4. Stripe webhook URL: `https://<your-domain>/api/webhooks/stripe`
