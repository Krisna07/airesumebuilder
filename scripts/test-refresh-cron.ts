#!/usr/bin/env tsx
/**
 * Test script for content refresh cron
 * 
 * Usage:
 *   npm run test:refresh-cron                    # Dry run (no changes)
 *   npm run test:refresh-cron -- --live          # Actually refresh a post
 *   npm run test:refresh-cron -- --threshold 30  # Custom age threshold
 */

import { runContentRefreshCron } from '../services/blogAutomationService'

async function main() {
  const args = process.argv.slice(2)
  const dryRun = !args.includes('--live')
  const thresholdIndex = args.indexOf('--threshold')
  const ageThresholdDays = thresholdIndex >= 0 && args[thresholdIndex + 1] 
    ? parseInt(args[thresholdIndex + 1], 10) 
    : 90

  console.log('🔄 Testing content refresh cron...')
  console.log(`   Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE (will refresh post)'}`)
  console.log(`   Age Threshold: ${ageThresholdDays} days`)
  console.log('')

  try {
    const result = await runContentRefreshCron({ dryRun, ageThresholdDays })

    console.log('✅ Success!')
    console.log(`   State: ${result.state}`)
    
    if (result.postId) {
      console.log(`   Post ID: ${result.postId}`)
      console.log(`   Title: "${result.postTitle}"`)
      console.log(`   Age: ${result.oldAgeDays} days`)
      if (result.newUpdatedAt) {
        console.log(`   New Updated At: ${result.newUpdatedAt}`)
      }
    }
    
    if (result.reason) {
      console.log(`   Reason: ${result.reason}`)
    }
    
    console.log(`   Duration: ${result.durationMs}ms`)

    if (dryRun && result.postId) {
      console.log('')
      console.log('💡 This was a dry run. To actually refresh the post, run:')
      console.log('   npm run test:refresh-cron -- --live')
    }
  } catch (error) {
    console.error('❌ Failed:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

main()
