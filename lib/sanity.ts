// Sanity client setup for blog CMS integration
import { createClient } from '@sanity/client'

// projectId 'nu3oga1w' matches sanity.config.js and is a public, non-secret value.
// Env var override is supported; the hardcoded fallback prevents build-time throws
// when SANITY_PROJECT_ID is not present in the CI/build environment.
const sanityClient = createClient({
  projectId: process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'nu3oga1w',
  dataset: process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || 'development',
  apiVersion: '2023-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
})

export default sanityClient
