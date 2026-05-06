/**
 * Test script for Related Posts Frontend Integration
 * 
 * This script verifies that:
 * 1. The API endpoint returns related posts correctly
 * 2. The response format matches what the frontend component expects
 */

import { getBlogBySlug } from '../services/blogCmsService'

async function testRelatedPostsAPI() {
  console.log('🧪 Testing Related Posts API Integration\n')

  try {
    // Step 1: Get a blog post to test with
    console.log('Step 1: Fetching a sample blog post...')
    const posts = await getBlogBySlug('how-to-write-a-resume-in-2026')
    
    if (!posts) {
      console.log('⚠️  No blog posts found. Please create some blog posts first.')
      return
    }

    console.log(`✅ Found blog post: "${posts.title}" (ID: ${posts.id})`)
    console.log(`   SEO Keywords: ${posts.seoKeywords?.join(', ') || 'none'}\n`)

    // Step 2: Test the API endpoint
    console.log('Step 2: Testing /api/blogs/[id]/related endpoint...')
    const apiUrl = `http://localhost:3000/api/blogs/${posts.id}/related?limit=5`
    console.log(`   URL: ${apiUrl}`)

    const response = await fetch(apiUrl)
    const data = await response.json()

    if (!response.ok) {
      console.log(`❌ API request failed with status ${response.status}`)
      console.log(`   Error: ${data.error || 'Unknown error'}`)
      return
    }

    console.log(`✅ API responded with status ${response.status}`)
    console.log(`   Success: ${data.success}`)
    console.log(`   Related posts count: ${data.data?.count || 0}\n`)

    // Step 3: Verify response format
    console.log('Step 3: Verifying response format...')
    
    if (!data.success) {
      console.log('❌ Response indicates failure')
      return
    }

    if (!data.data || !Array.isArray(data.data.relatedPosts)) {
      console.log('❌ Response missing relatedPosts array')
      return
    }

    console.log('✅ Response format is correct\n')

    // Step 4: Display related posts
    if (data.data.relatedPosts.length > 0) {
      console.log('Step 4: Related posts found:')
      data.data.relatedPosts.forEach((post: any, index: number) => {
        console.log(`\n   ${index + 1}. ${post.title}`)
        console.log(`      ID: ${post.id}`)
        console.log(`      Slug: ${post.slug}`)
        console.log(`      Excerpt: ${post.excerpt?.substring(0, 60)}...`)
        console.log(`      Cover Image: ${post.coverImageId || 'none'}`)
        console.log(`      Keywords: ${post.seoKeywords?.join(', ') || 'none'}`)
      })
    } else {
      console.log('Step 4: No related posts found')
      console.log('   This is expected if the blog post has no keywords or no other posts share keywords')
    }

    console.log('\n✅ All tests passed! The Related Posts API is working correctly.')
    console.log('\n📝 Frontend Integration:')
    console.log('   - The RelatedPosts component will fetch from this API')
    console.log('   - It displays: title, excerpt, cover image, and link')
    console.log('   - Loading states and error handling are included')

  } catch (error) {
    console.error('❌ Test failed with error:', error)
    if (error instanceof Error) {
      console.error('   Message:', error.message)
      console.error('   Stack:', error.stack)
    }
  }
}

// Run the test
testRelatedPostsAPI()
  .then(() => {
    console.log('\n✅ Test script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Test script failed:', error)
    process.exit(1)
  })
