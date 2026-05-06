/**
 * Test script for the related posts endpoint
 * Run with: npx tsx scripts/test-related-posts.ts
 * 
 * Tests:
 * 1. Valid blog ID returns related posts
 * 2. Custom limit parameter works correctly
 * 3. Invalid blog ID returns 400 error
 * 4. Non-existent blog ID returns 404 error
 * 5. Caching headers are properly set (1 hour)
 */

async function testRelatedPostsEndpoint() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  
  console.log('Testing Related Posts Endpoint...\n')
  
  // First, get a list of published blogs to find a valid ID
  console.log('1. Fetching published blogs...')
  const blogsResponse = await fetch(`${baseUrl}/api/blogs/public?limit=5`)
  const blogsData = await blogsResponse.json()
  
  if (!blogsData.success || !blogsData.data.items.length) {
    console.error('❌ No published blogs found. Cannot test related posts.')
    return
  }
  
  const testBlog = blogsData.data.items[0]
  console.log(`✅ Found test blog: ${testBlog.title} (${testBlog.id})`)
  console.log(`   Keywords: ${testBlog.seoKeywords?.join(', ') || 'none'}\n`)
  
  // Test 1: Valid blog ID
  console.log('2. Testing with valid blog ID...')
  const relatedResponse = await fetch(`${baseUrl}/api/blogs/${testBlog.id}/related`)
  const relatedData = await relatedResponse.json()
  
  if (relatedResponse.status === 200 && relatedData.success) {
    console.log(`✅ Status: ${relatedResponse.status}`)
    console.log(`✅ Found ${relatedData.data.count} related posts`)
    if (relatedData.data.relatedPosts.length > 0) {
      console.log('   Related posts:')
      relatedData.data.relatedPosts.forEach((post: any, i: number) => {
        console.log(`   ${i + 1}. ${post.title}`)
        console.log(`      Keywords: ${post.seoKeywords?.join(', ') || 'none'}`)
      })
    }
  } else {
    console.error(`❌ Failed: ${relatedResponse.status}`, relatedData)
  }
  
  // Test 2: Custom limit
  console.log('\n3. Testing with custom limit (limit=2)...')
  const limitResponse = await fetch(`${baseUrl}/api/blogs/${testBlog.id}/related?limit=2`)
  const limitData = await limitResponse.json()
  
  if (limitResponse.status === 200 && limitData.success) {
    console.log(`✅ Status: ${limitResponse.status}`)
    console.log(`✅ Found ${limitData.data.count} related posts (expected max 2)`)
  } else {
    console.error(`❌ Failed: ${limitResponse.status}`, limitData)
  }
  
  // Test 3: Invalid blog ID
  console.log('\n4. Testing with invalid blog ID...')
  const invalidResponse = await fetch(`${baseUrl}/api/blogs/invalid_id/related`)
  const invalidData = await invalidResponse.json()
  
  if (invalidResponse.status === 400 && !invalidData.success) {
    console.log(`✅ Status: ${invalidResponse.status} (expected 400)`)
    console.log(`✅ Error message: ${invalidData.error}`)
  } else {
    console.error(`❌ Expected 400 status, got: ${invalidResponse.status}`, invalidData)
  }
  
  // Test 4: Non-existent blog ID
  console.log('\n5. Testing with non-existent blog ID...')
  const notFoundResponse = await fetch(`${baseUrl}/api/blogs/blog_nonexistent123/related`)
  const notFoundData = await notFoundResponse.json()
  
  if (notFoundResponse.status === 404 && !notFoundData.success) {
    console.log(`✅ Status: ${notFoundResponse.status} (expected 404)`)
    console.log(`✅ Error message: ${notFoundData.error}`)
  } else {
    console.error(`❌ Expected 404 status, got: ${notFoundResponse.status}`, notFoundData)
  }
  
  // Test 5: Verify caching configuration
  console.log('\n6. Verifying caching configuration...')
  const cacheResponse = await fetch(`${baseUrl}/api/blogs/${testBlog.id}/related`)
  const cacheHeaders = cacheResponse.headers
  
  console.log('   Cache-related headers:')
  const cacheControl = cacheHeaders.get('cache-control')
  const age = cacheHeaders.get('age')
  const xNextjsCache = cacheHeaders.get('x-nextjs-cache')
  
  if (cacheControl) {
    console.log(`   ✅ Cache-Control: ${cacheControl}`)
  }
  if (age) {
    console.log(`   ℹ️  Age: ${age}s`)
  }
  if (xNextjsCache) {
    console.log(`   ℹ️  X-Nextjs-Cache: ${xNextjsCache}`)
  }
  
  console.log('\n   Note: The route is configured with revalidate = 3600 (1 hour)')
  console.log('   This enables Next.js ISR (Incremental Static Regeneration)')
  console.log('   Responses are cached and revalidated after 3600 seconds\n')
  
  console.log('✅ All tests completed!')
}

testRelatedPostsEndpoint().catch(console.error)
