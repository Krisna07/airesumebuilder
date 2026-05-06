/**
 * Unit test for keyword matching algorithm
 * Run with: npx tsx scripts/test-keyword-matching.ts
 */

/**
 * Calculate the keyword match score between two sets of keywords.
 * Returns the count of shared keywords.
 */
function calculateKeywordMatchScore(keywords1: string[], keywords2: string[]): number {
  const set1 = new Set(keywords1 || []);
  const set2 = new Set(keywords2 || []);
  
  // Count shared keywords
  let sharedCount = 0;
  for (const kw of set1) {
    if (set2.has(kw)) {
      sharedCount++;
    }
  }
  
  return sharedCount;
}

function runTests() {
  console.log('Testing Keyword Matching Algorithm\n')
  
  let passed = 0
  let failed = 0
  
  // Test 1: No shared keywords
  const test1 = calculateKeywordMatchScore(
    ['resume', 'cv', 'job'],
    ['interview', 'career', 'hiring']
  )
  if (test1 === 0) {
    console.log('✅ Test 1 passed: No shared keywords (expected 0, got 0)')
    passed++
  } else {
    console.log(`❌ Test 1 failed: Expected 0, got ${test1}`)
    failed++
  }
  
  // Test 2: All keywords shared
  const test2 = calculateKeywordMatchScore(
    ['resume', 'cv', 'job'],
    ['resume', 'cv', 'job']
  )
  if (test2 === 3) {
    console.log('✅ Test 2 passed: All keywords shared (expected 3, got 3)')
    passed++
  } else {
    console.log(`❌ Test 2 failed: Expected 3, got ${test2}`)
    failed++
  }
  
  // Test 3: Partial overlap
  const test3 = calculateKeywordMatchScore(
    ['resume', 'cv', 'job', 'career'],
    ['resume', 'interview', 'job']
  )
  if (test3 === 2) {
    console.log('✅ Test 3 passed: Partial overlap (expected 2, got 2)')
    passed++
  } else {
    console.log(`❌ Test 3 failed: Expected 2, got ${test3}`)
    failed++
  }
  
  // Test 4: Empty arrays
  const test4 = calculateKeywordMatchScore([], [])
  if (test4 === 0) {
    console.log('✅ Test 4 passed: Empty arrays (expected 0, got 0)')
    passed++
  } else {
    console.log(`❌ Test 4 failed: Expected 0, got ${test4}`)
    failed++
  }
  
  // Test 5: One empty array
  const test5 = calculateKeywordMatchScore(['resume', 'cv'], [])
  if (test5 === 0) {
    console.log('✅ Test 5 passed: One empty array (expected 0, got 0)')
    passed++
  } else {
    console.log(`❌ Test 5 failed: Expected 0, got ${test5}`)
    failed++
  }
  
  // Test 6: Duplicate keywords in one array (should still count as 1 match)
  const test6 = calculateKeywordMatchScore(
    ['resume', 'resume', 'cv'],
    ['resume', 'job']
  )
  if (test6 === 1) {
    console.log('✅ Test 6 passed: Duplicate keywords handled (expected 1, got 1)')
    passed++
  } else {
    console.log(`❌ Test 6 failed: Expected 1, got ${test6}`)
    failed++
  }
  
  // Test 7: Case sensitivity (keywords should match exactly)
  const test7 = calculateKeywordMatchScore(
    ['Resume', 'CV'],
    ['resume', 'cv']
  )
  if (test7 === 0) {
    console.log('✅ Test 7 passed: Case sensitive matching (expected 0, got 0)')
    passed++
  } else {
    console.log(`❌ Test 7 failed: Expected 0, got ${test7}`)
    failed++
  }
  
  // Test 8: Single keyword match
  const test8 = calculateKeywordMatchScore(
    ['resume'],
    ['resume']
  )
  if (test8 === 1) {
    console.log('✅ Test 8 passed: Single keyword match (expected 1, got 1)')
    passed++
  } else {
    console.log(`❌ Test 8 failed: Expected 1, got ${test8}`)
    failed++
  }
  
  console.log(`\n${'='.repeat(50)}`)
  console.log(`Total: ${passed + failed} tests`)
  console.log(`Passed: ${passed}`)
  console.log(`Failed: ${failed}`)
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed!')
  } else {
    console.log('\n⚠️  Some tests failed')
    process.exit(1)
  }
}

runTests()
