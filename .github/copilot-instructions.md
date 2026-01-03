This file contains focused instructions to help an AI coding agent become immediately productive in the airesumebuilder repository.

Key facts (quick):
- Framework: Next.js (app directory), Next 15, React 19, TypeScript.
- DB: Prisma with PostgreSQL; JSON fields stored as strings in the `Resume` model.
- AI: uses Google's GenAI via `@google/genai` (see `services/aiServices.ts`).
- Puppeteer: dynamic imports; local dev uses `puppeteer`, production often uses `puppeteer-core` + bundled chromium helpers.

How to run (dev & build):
- Install: `npm install` (postinstall runs `npx puppeteer browsers install chrome`).
- Dev: `npm run dev` (runs `next dev`).
- Build: `npm run build` (runs `prisma generate && next build`). Always run `prisma generate` after changing `prisma/schema.prisma`.

Important environment variables (must be present for many flows):
- `GEMINI_API_KEY` — required by `services/aiServices.ts` (throws if missing).
- `DATABASE_URL` and `DIRECT_URL` — Prisma datasource; required for DB access.
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — used by NextAuth in `app/api/auth/[...nextauth]/route.ts`.

Key files to inspect for intent and patterns:
- `services/aiServices.ts` — central GenAI wrapper and model choice (`gemini-2.5-flash-lite`).
- `lib/prompts.ts` — canonical prompts; agents must preserve the strict JSON output requirements when interacting with model prompts.
- `lib/jsonParse.ts` — used to coerce model output into JSON; avoid changing prompt expectations without updating this parser.
- `prisma/schema.prisma` — DB model shapes (`Resume`, `JobDescription`, `AnalysisResult`).
- `app/api/*` — server-side API routes (resume CRUD, AI analyze/generate, scrape-job, pdf generation). Follow the `NextRequest`/`NextResponse` patterns.
- `next.config.ts` — Webpack externals for server (pdf libs are externals) and permissive image config.

Patterns and conventions discovered (codebase-specific):
- Strict JSON from LLMs: Prompts in `lib/prompts.ts` instruct the model to "RETURN ONLY VALID JSON" and the code expects this exactness. Always check `lib/jsonParse.ts` for parsing behavior before altering prompts.
- JSON-in-DB: Several Prisma model fields (profile, experiences, educations, skills, customSections) are stored as JSON text. When reading from Prisma, routes call `JSON.parse` and defensively handle parse errors. When writing, route handlers send stringified JSON into Prisma `create` / `update` calls.
- AI endpoints and shapes:
  - POST `/api/ai/analyze` expects body `{ resumeId, jobDetails }` and returns analysis stored in `AnalysisResult`.
  - POST `/api/ai/generate-resume` expects `{ resume, jobDescription }` and returns `resume: <generated JSON>`.
  - POST `/api/ai/extract-resume` expects `{ text }` and returns `data` (structured resume JSON).
- Puppeteer load patterns: `app/api/generate` and `app/api/scrape-job` dynamically import `puppeteer` vs `puppeteer-core` depending on environment. The project uses a `postinstall` step to ensure browsers are available locally — be careful when testing in CI or serverless (may require `puppeteer-core` + `@sparticuz/chromium` executablePath adjustments).
- Client <-> API usage: front-end services use relative `fetch('/api/...')` calls (see `services/resumeServices.ts`, `services/jdServices.ts`). Mimic their request shapes when editing or adding routes.
- Local fallback behaviors: job descriptions and resumes may be stored locally in browser `localStorage` (see `services/jdServices.ts` / `LocalResumeService`) for guest flows.

Quick examples (copyable):
- Analyze a resume (server route expects this JSON):
  POST /api/ai/analyze
  Body: { "resumeId": "<id>", "jobDetails": { "id": "<jd-id>", "title": "...", "description": "..." } }
- Generate a resume from text:
  POST /api/ai/generate-resume
  Body: { "resume": <ResumeData>, "jobDescription": "<job text>" }

Testing & debugging notes:
- Prisma: after schema changes run `npx prisma generate` and migrate as needed. The `build` script already runs `prisma generate`.
- Puppeteer: if a new Chromium binary is needed locally run `npx puppeteer browsers install chrome` (postinstall already runs this on `npm install`). On CI you may prefer `puppeteer-core` and providing `executablePath`.
- LLM errors: prompts expect exact JSON. When model-output parsing fails, check `lib/jsonParse.ts` and the raw response logs from `services/aiServices.ts`.

What to avoid changing without tests:
- Prompt JSON schema in `lib/prompts.ts` (many places depend on structure and parsing).
- Database column types/field names in `prisma/schema.prisma` without updating every route that JSON.parse/stringifies these fields.

Where to add features:
- New AI-related flows should be grouped under `services/*` and expose small wrapper functions used by `app/api/ai/*` routes. Follow existing error handling style (console.error + NextResponse with status).

If you need clarification or want me to expand any area (deployment, CI, or runbook), tell me which piece to expand.
