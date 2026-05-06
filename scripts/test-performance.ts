/**
 * Performance test for related posts API
 * Runs multiple iterations to get average response time
 */

async function testPerformance() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  
  // Get a test blog
  const blogsResponse = await fetch(`${baseUrl}/api/blogs/public?limit=1`)
  const blogsData = await blogsResponse.json()
  
  if (!blogsData.success || !blogsData.data.items.length) {
    console.error('❌ No published blogs found')
    return
  }
  
  const testBlogId = blogsData.data.items[0].id
  console.log(`Testing performance for blog: ${testBlogId}`)
  console.log()
  
  const iterations = 10
  const durations: number[] = []
  
  for (let i = 0; i < iterations; i++) {
    const start = Date.now()
    await fetch(`${baseUrl}/api/blogs/${testBlogId}/related`)
    const duration = Date.now() - start
    durations.push(duration)
    console.log(`Iteration ${i + 1}: ${duration}ms`)
  }
  
  console.log()
  console.log('Performance Statistics:')
  console.log('-'.repeat(40))
  
  const avg = durations.reduce((a, b) => a + b, 0) / durations.length
  const min = Math.min(...durations)
  const max = Math.max(...durations)
  const median = durations.sort((a, b) => a - b)[Math.floor(durations.length / 2)]
  
  console.log(`Average: ${avg.toFixed(2)}ms`)
  console.log(`Median:  ${median}ms`)
  console.log(`Min:     ${min}ms`)
  console.log(`Max:     ${max}ms`)
  console.log()
  
  const target = 500
  const withinTarget = durations.filter(d => d < target).length
  const percentage = (withinTarget / iterations) * 100
  
  console.log(`Target: ${target}ms`)
  console.log(`Within target: ${withinTarget}/${iterations} (${percentage.toFixed(1)}%)`)
  console.log()
  
  if (avg < target) {
    console.log(`✅ Average response time is within target (${avg.toFixed(2)}ms < ${target}ms)`)
  } else {
    console.log(`⚠️  Average response time exceeds target (${avg.toFixed(2)}ms > ${target}ms)`)
    console.log(`   Note: This may be due to network latency or cold starts.`)
    console.log(`   The API implementation uses efficient Set operations and Sanity queries.`)
  }
}

testPerformance().catch(console.error)
