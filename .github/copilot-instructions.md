
# Project Guidelines

## Code Style
- Follow the Next.js App Router layout, keeping metadata and global styles in `app/layout.tsx`/`app/page.tsx` and importing CSS via `global.css`; the README summarizes this entry pattern and TypeScript / Prisma stack choices.
- Prefer React + Tailwind-free components similar to `components/Navbar.tsx` and context-heavy helpers in `context/authContext.tsx`; mirrors the TypeScript-first shape described under the Quick Links in [README.md](README.md#L1-L80).

## Architecture
- Keep UI logic in `app/` and shared components while routing AI, auth, subscription, and PDF work through `app/api/*` as shown in [README.md](README.md#L30-L140); data flows from React contexts → API routes → `services/` → Prisma.
- Heavy business logic (AI orchestration, resume caching, email, subscription checks) belongs in `services/aiServices.ts`, `lib/`, and server-only APIs; CLAUDE.md reinforces that server-side routes handle sensitive tasks before touching Prisma models.

## Build and Test
- Install deps with `npm install`, then keep browsers synced via `npx puppeteer browsers install chrome` and run `npx prisma generate` before `npm run dev` as noted in [README.md](README.md#L120-L180).
- For CI/dev checks run `npm run build`, `npm run lint`, and `npx tsc --noEmit`; CLAUDE.md lists the same plus subscription utilities (`npm run subscription:*`).

## Project Conventions
- Resume JSON fields stay stored as strings (`Resume.profile`, `.experiences`, etc.); parse/stringify around Prisma calls instead of native JSON columns; see [README.md](README.md#L160-L210).
- Prompts live in `lib/prompts.ts` and their outputs always funnel through `lib/jsonParse.ts`; updating either requires touching the other to keep the strict JSON contract described
- Soft deletes use `Resume.isDeleted` (filter `isDeleted: false` on queries) and subscription limits live in `lib/subscription-server.ts`/`app/api/subscription/increment` as detailed

## Integration Points
- AI hooks go through `services/aiServices.ts` (OpenRouter only) and export wrapper methods so API routes stay thin [CLAUDE.md].
- Email verification uses `app/api/auth/*` routes, `utils/sendEmail.ts`, and the `Verification` Prisma model; keep the 6-digit code flow in sync with the modal in `components/VerificationModal.tsx` per [README.md](README.md#L140-L200).
- Subscription/Stripe handling is fronted by `components/Checkout.tsx`, `app/api/webhooks/stripe`, and the Prisma `Subscription`/`Stripe*` models identified

## Security
- All sensitive env vars (`DATABASE_URL`, `GEMINI_API_KEY`, `NEXTAUTH_SECRET`, SMTP/Stripe keys) must exist before running the server, as emphasized in [README.md](README.md#L90-L150).
- Treat API responses consistently: `{ success: boolean, data?: ..., error?: string }` and avoid leaking secrets in `utils/sendEmail.ts` or webhook handlers discussed
- Hashing verification codes and rate-limiting resend endpoints are future hardening ideas already noted in README so ensure any new work keeps the current flow intact.

Please flag any places where this guidance feels incomplete so we can iterate—happy to expand or adjust based on your goals.