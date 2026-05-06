#!/usr/bin/env tsx
/**
 * Test script for blog cron automation
 * 
 * Usage:
 *   npm run test:blog-cron           # Dry run (no save)
 *   npm run test:blog-cron -- --live # Actually create a blog
 *   npm run test:blog-cron -- --title "Custom Title" --live
 */

import { runHourlyBlogAutomation } from '../services/blogAutomationService'

async function main() {
  const args = process.argv.slice(2)
  const dryRun = !args.includes('--live')
  const titleIndex = args.indexOf('--title')
  const title = titleIndex >= 0 && args[titleIndex + 1] ? args[titleIndex + 1] : undefined

  console.log('🤖 Testing blog cron automation...')
  console.log(`   Mode: ${dryRun ? 'DRY RUN (no save)' : 'LIVE (will create blog)'}`)
  console.log(`   Title: ${title ?? 'auto-generated'}`)
  console.log('')

  try {
    const result = await runHourlyBlogAutomation({ dryRun, title })

    console.log('✅ Success!')
    console.log(`   State: ${result.state}`)
    console.log(`   Title: "${result.title}"`)
    console.log(`   Slug: ${result.slug}`)
    if (result.blogId) {
      console.log(`   Blog ID: ${result.blogId}`)
      console.log(`   View at: https://airesumecraft.xyz/blogs/${result.slug}`)
    }
    console.log(`   Duration: ${result.durationMs}ms`)
    console.log(`   Trace ID: ${result.traceId}`)

    if (dryRun) {
      console.log('')
      console.log('💡 This was a dry run. To actually create the blog, run:')
      console.log('   npm run test:blog-cron -- --live')
    }
  } catch (error) {
    console.error('❌ Failed:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

main()
