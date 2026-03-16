# Hourly AI Blog Automation to Sanity (Go-Live Runbook)

## Implementation Status
- Implemented in codebase:
  - `lib/prompts.ts`: `generateSeoBlogPrompt(...)`, `generateBlogTitlePlanPrompt(...)`
  - `services/blogAutomationService.ts`: resume-based title planning, strict no-reuse title checks, generation, normalization, dedupe, image generation, Sanity publish
  - `app/api/cron/blog/route.ts`: secured cron endpoint (GET/POST)
  - `vercel.json`: hourly cron schedule
- Current default image model: `flux-2-klein-9b`

## Objective
Set up an hourly automated pipeline that:
1. Uses resume context plus existing blog titles to plan a fresh AI title.
2. Prechecks title/slug reuse and retries until a unique title is found.
3. Uses AI to generate a structured blog JSON payload from that title.
4. Uses `imagePrompt` from that payload to generate a hero image.
5. Uploads image to Sanity and stores `coverImageId`.
6. Saves the blog in Sanity via existing CMS services.
7. Runs safely on a cron schedule with authentication and observability.

## Current Project Facts (Confirmed)
- Blog persistence is already implemented in `services/blogCmsService.ts` (`createBlog`, `saveImage`, slug uniqueness).
- Blog route validation requires:
  - At least 1 image (`coverImageId` or image section).
  - At least 2 paragraph sections.
- Admin auth is required on current blog/image API routes, so cron should use a dedicated secure internal route or call services directly.
- Existing AI prompt helpers live in `lib/prompts.ts`.
- No cron route/schedule is currently set.

## Scope for This Feature
- Add an hourly cron endpoint for blog generation.
- Integrate your Cloudfront/Cloudflare AI worker for text generation.
- Integrate image generation API using `imagePrompt`.
- Normalize/validate AI output before persistence.
- Add safeguards to avoid duplicate/noisy posts.

## Implementation Plan

### Phase 1: Config (Required)
- Define environment variables:
  - `BLOG_CRON_SECRET`
  - `BLOG_CRON_ENABLED=true`
  - `BLOG_CRON_AUTHOR`
  - `BLOG_CRON_DEFAULT_STATUS=published`
  - `CLOUDFLARE_AI_GATEWAY_TOKEN`
  - `CLOUDFLARE_AI_GATEWAY_BASE_URL`
  - `BLOG_CRON_TITLES` (optional CSV or JSON list)
  - `BLOG_CRON_KEYWORDS` (optional CSV/JSON fallback topic seed)
  - `BLOG_AI_WORKER_URL`
  - `BLOG_AI_WORKER_API_KEY`
  - `BLOG_AI_WORKER_MODEL`
  - `BLOG_IMAGE_API_URL`
  - `BLOG_IMAGE_API_KEY`
  - `BLOG_IMAGE_API_MODEL=flux-2-klein-9b` (optional override)
  - `BLOG_IMAGE_API_SIZE=1536x1024` (optional)
  - `BLOG_TITLE_AI_MODEL` (optional override for title planning)
  - `BLOG_TITLE_GEN_RETRIES=5` (optional)
  - `BLOG_TITLE_LOOKBACK_LIMIT=500` (optional)
  - `BLOG_CRON_DEDUPE_WINDOW_HOURS=48` (optional)
  - `BLOG_CRON_ACTOR_ID` (optional)
  - `BLOG_CRON_ACTOR_EMAIL` (optional)
- Notes:
  - Primary path is OpenAI-compatible Cloudflare Gateway (`CLOUDFLARE_AI_GATEWAY_TOKEN`).
  - HTTP fallback path is still supported (`BLOG_AI_WORKER_URL` and/or `BLOG_IMAGE_API_URL`).

### Phase 2: AI Generation Layer
- Create service file: `services/blogAutomationService.ts`
- Add functions:
  - `buildResumeContextForTitlePlanning()`
  - `getExistingBlogTitleIndex()`
  - `planUniqueTitleFromResume(preferredTitle?)`
  - `generateBlogDraftFromTitle(title)`
  - `validateAndNormalizeBlogDraft(raw)`
  - `generateCoverImageFromPrompt(imagePrompt)`
  - `publishGeneratedBlog(draft, imageBuffer)`
- Use `generateBlogTitlePlanPrompt(...)` and `generateSeoBlogPrompt(...)` from `lib/prompts.ts`.
- Enforce output schema via Zod before storage.

### Phase 3: Image Flow
- Call image API with `imagePrompt`.
- Accept output as one of:
  - Binary image bytes.
  - Base64 image.
  - Remote URL to download.
- Convert to `Buffer` and upload with `saveImage(...)`.
- Use returned asset id as `coverImageId` when calling `createBlog(...)`.

### Phase 4: Cron Endpoint
- Add route: `app/api/cron/blog/route.ts`
- Security checks:
  - Verify `Authorization: Bearer <BLOG_CRON_SECRET>`.
  - Refuse when `BLOG_CRON_ENABLED` is false.
- Execution flow:
  - Build title.
  - Generate blog JSON.
  - Generate hero image.
  - Persist blog via `createBlog` with system actor.
- Return structured response:
  - `{ success, blogId, slug, title, durationMs, traceId, error? }`

### Phase 5: Scheduling
- Add Vercel cron in `vercel.json`:
  - Example: `0 * * * *` -> `/api/cron/blog`
- If not on Vercel, schedule equivalent hourly call in your platform and pass bearer token.

### Phase 6: Reliability and Guardrails
- Add timeout handling and retries for AI and image calls.
- Add dedupe guardrails:
  - Skip when generated slug/title already exists for recent period.
  - Optional: hash normalized title + first paragraph and reject duplicates.
- Add fallback behavior:
  - If image generation fails: do not publish (strict) OR use fallback stock image policy.
- Log failures with enough context for debugging.

### Phase 7: QA and Rollout
- Manual test route with a one-time secret call.
- Dry run mode (optional): generate and validate without persisting.
- Verify stored blog renders correctly in listing and slug page.
- Enable cron after successful manual tests.

## Data Contracts (Current)

### Text Generation (Cloudflare OpenAI-Compat)
Client call:
```ts
client.chat.completions.create({
  model: "workers-ai/@cf/zai-org/glm-4.7-flash",
  messages: [{ role: "user", content: prompt }],
})
```

Expected assistant content must parse to:
```json
{
  "title": "How to Write a Resume for Product Management Roles",
  "excerpt": "Learn practical resume strategies for PM roles with keyword-focused examples and recruiter-friendly structure.",
  "slug": { "current": "how-to-write-a-resume-for-product-management-roles" },
  "imagePrompt": "A modern workspace with resume on laptop, sticky notes, and clean editorial lighting, professional style",
  "sections": [
    { "id": "sec_1", "type": "paragraph", "content": "..." },
    { "id": "sec_2", "type": "quote", "content": "...", "citation": "..." },
    { "id": "sec_3", "type": "paragraph", "content": "..." },
    { "id": "sec_4", "type": "paragraph", "content": "..." }
  ],
  "status": "published",
  "author": "ResumeCraft Team"
}
```

### Image Generation (Cloudflare OpenAI-Compat)
Client call:
```ts
client.images.generate({
  model: "flux-2-klein-9b",
  prompt: imagePrompt,
  size: "1536x1024",
  response_format: "b64_json"
})
```

Supported image return forms in runtime:
```json
{
  "mimeType": "image/png",
  "base64": "<base64-image-data>"
}
```

## Files Expected to Change
- `lib/prompts.ts` (done: added `generateSeoBlogPrompt`)
- `services/blogAutomationService.ts` (new)
- `app/api/cron/blog/route.ts` (new)
- `vercel.json` (cron schedule)
- Optional: `lib/env.ts` for env validation

## Acceptance Criteria
- Hourly trigger creates one valid blog with:
  - Exactly 3 paragraph sections + 1 quote section after first paragraph.
  - A generated hero image uploaded to Sanity (`coverImageId` set).
  - Valid slug and persisted published post.
- Endpoint is secret-protected and not publicly callable.
- Failures are visible in logs with traceable metadata.
- No duplicate spam posts under normal retries.

## Go-Live Checklist
1. Set `CLOUDFLARE_AI_GATEWAY_TOKEN` in deployment env.
2. Confirm `CLOUDFLARE_AI_GATEWAY_BASE_URL` is your gateway URL.
3. Set `BLOG_CRON_SECRET` and `BLOG_CRON_ENABLED=true`.
4. Optionally set `BLOG_CRON_TITLES` (or fallback `BLOG_CRON_KEYWORDS`) if you want to override AI title planning.
5. Set `BLOG_CRON_AUTHOR` and keep `BLOG_CRON_DEFAULT_STATUS=published`.
6. Ensure Sanity envs are present: `SANITY_PROJECT_ID`, `SANITY_DATASET`, `SANITY_API_TOKEN`.
7. Trigger a dry run:
  - `GET /api/cron/blog?dryRun=true`
8. Trigger a real run:
  - `POST /api/cron/blog` with `Authorization: Bearer <BLOG_CRON_SECRET>`
9. Verify result in Sanity and blog listing.

## Nice-to-Have (Optional)
- Add a second cron for topic discovery.
- Add Slack/Email alert on cron failures.
- Add an admin dashboard card showing last cron run + status.
