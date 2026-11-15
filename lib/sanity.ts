// Sanity client setup for blog CMS integration
import { createClient } from '@sanity/client'

const isProd = process.env.ENVIRONMENT !== 'development'

// SANITY_PROJECT_ID (and the other SANITY_* vars) are currently only
// configured on Vercel for the "production" target -- not "preview" or
// "development". `createClient` validates its config and throws synchronously
// at construction time when `projectId` is missing, and since this module is
// imported at the top level by blogCmsService (used by, among others,
// app/sitemap.ts during static generation), that throw previously crashed the
// *entire* `next build` in any environment without SANITY_PROJECT_ID set --
// not just the blog pages. Fall back to a syntactically-valid placeholder so
// construction always succeeds; an environment missing the real project ID
// then only fails at the point an actual Sanity API call is made (which
// call sites such as sitemap.ts already catch), instead of failing the build.
const sanityClient = createClient({
  projectId: process.env.SANITY_PROJECT_ID || 'placeholder-project-id',
  dataset: isProd ? 'production' : 'preview',
  apiVersion: '2023-01-01',
  token: process.env.SANITY_API_TOKEN || process.env.SANITY_TOKEN,
  useCdn: false,
})

export default sanityClient
