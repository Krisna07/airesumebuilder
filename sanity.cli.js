import {defineCliConfig} from 'sanity/cli'

const isProd = process.env.ENVIRONMENT !== 'development'
export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_PROJECT_ID,
    dataset: isProd ? 'production' : 'preview'
  },
  deployment: {
    /**
     * Enable auto-updates for studios.
     * Learn more at https://www.sanity.io/docs/studio/latest-version-of-sanity#k47faf43faf56
     */
    autoUpdates: true,
  }
})
