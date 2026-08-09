import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import { schemaTypes } from './schemaTypes'

const isProd = process.env.ENVIRONMENT !== 'development'

export default defineConfig({
  name: 'default',
  title: 'resumeblogs',

  projectId: process.env.SANITY_PROJECT_ID,
  dataset: isProd ? 'production' : 'preview',

  plugins: [structureTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },
})
