import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
const isProd = process.env.ENVIRONMENT !== 'development'

export default defineConfig({
  name: 'default',
  title: 'resumeblogs',

  projectId: 'nu3oga1w',
  dataset: isProd ? 'production' : 'development',

  plugins: [structureTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },
})
