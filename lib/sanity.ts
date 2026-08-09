// Sanity client setup for blog CMS integration
import { createClient } from '@sanity/client'

const isProd = process.env.ENVIRONMENT !== 'development'


const sanityClient = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: isProd ? 'production' : 'preview',
  apiVersion: '2023-01-01',
  token: process.env.SANITY_API_TOKEN || process.env.SANITY_TOKEN,
  useCdn: false,
})

export default sanityClient
