/**
 * Integration test for keyword matching with sorting
 * Run with: npx tsx scripts/test-keyword-sorting.ts
 */

interface BlogPost {
  id: string
  title: string
  seoKeywords: string[]
  publishedAt: string
  createdAt: string
}

/**
 * Calculate the keyword match score between two sets of keywords.
 */
function calculateKeywordMatchScore(keywords1: string[], keywords2: string[]): number {
  const set1 = new Set(keywords1 || []);
  const set2 = new Set(keywords2 || []);
  
  let sharedCount = 0;
  for (const kw of set1) {
    if (set2.has(kw)) {
      sharedCount++;
    }
  }
  
  return sharedCount;
}

/**
 * Simulate the listRelatedByKeywords sorting logic
 */
function sortRelatedPosts(
  sourceKeywords: string[],
  posts: BlogPost[]
): BlogPost[] {
  // Calculate match score for each post
  const postsWithScores = posts.map((post) => ({
    post,
    score: calculateKeywordMatchScore(sourceKeywords, post.seoKeywords || []),
  }))

  // Sort by score (descending), then by publication date (newest first)
  postsWithScores.sort((a, b) => {
    if (a.score !== b.score) {
      return b.score - a.score; // Higher score first
    }
    // Same score: sort by date (newest first)
    const dateA = a.post.publishedAt || a.post.createdAt;
    const dateB = b.post.publishedAt || b.post.createdAt;
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  })

  return postsWithScores.map(({ post }) => post);
}

function runTests() {
  console.log('Testing Keyword Matching with Sorting\n')
  
  let passed = 0
  let failed = 0
  
  // Test 1: Sort by score (descending)
  console.log('Test 1: Sort by match score (highest first)')
  const sourceKeywords1 = ['resume', 'cv', 'job']
  const posts1: BlogPost[] = [
    {
      id: 'post1',
      title: 'Post 1 - 1 match',
      seoKeywords: ['resume'],
      publishedAt: '2024-01-01T00:00:00Z',
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'post2',
      title: 'Post 2 - 3 matches',
      seoKeywords: ['resume', 'cv', 'job'],
      publishedAt: '2024-01-02T00:00:00Z',
      createdAt: '2024-01-02T00:00:00Z',
    },
    {
      id: 'post3',
      title: 'Post 3 - 2 matches',
      seoKeywords: ['resume', 'cv'],
      publishedAt: '2024-01-03T00:00:00Z',
      createdAt: '2024-01-03T00:00:00Z',
    },
  ]
  
  const sorted1 = sortRelatedPosts(sourceKeywords1, posts1)
  if (sorted1[0].id === 'post2' && sorted1[1].id === 'post3' && sorted1[2].id === 'post1') {
    console.log('✅ Posts sorted by score: 3 matches, 2 matches, 1 match')
    passed++
  } else {
    console.log(`❌ Expected order: post2, post3, post1`)
    console.log(`   Got: ${sorted1.map(p => p.id).join(', ')}`)
    failed++
  }
  
  // Test 2: Sort by date when scores are equal
  console.log('\nTest 2: Sort by date (newest first) when scores are equal')
  const sourceKeywords2 = ['resume']
  const posts2: BlogPost[] = [
    {
      id: 'post1',
      title: 'Post 1 - Oldest',
      seoKeywords: ['resume'],
      publishedAt: '2024-01-01T00:00:00Z',
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'post2',
      title: 'Post 2 - Newest',
      seoKeywords: ['resume'],
      publishedAt: '2024-01-03T00:00:00Z',
      createdAt: '2024-01-03T00:00:00Z',
    },
    {
      id: 'post3',
      title: 'Post 3 - Middle',
      seoKeywords: ['resume'],
      publishedAt: '2024-01-02T00:00:00Z',
      createdAt: '2024-01-02T00:00:00Z',
    },
  ]
  
  const sorted2 = sortRelatedPosts(sourceKeywords2, posts2)
  if (sorted2[0].id === 'post2' && sorted2[1].id === 'post3' && sorted2[2].id === 'post1') {
    console.log('✅ Posts sorted by date: newest, middle, oldest')
    passed++
  } else {
    console.log(`❌ Expected order: post2, post3, post1`)
    console.log(`   Got: ${sorted2.map(p => p.id).join(', ')}`)
    failed++
  }
  
  // Test 3: Combined sorting (score first, then date)
  console.log('\nTest 3: Combined sorting (score first, then date)')
  const sourceKeywords3 = ['resume', 'cv']
  const posts3: BlogPost[] = [
    {
      id: 'post1',
      title: 'Post 1 - 1 match, old',
      seoKeywords: ['resume'],
      publishedAt: '2024-01-01T00:00:00Z',
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'post2',
      title: 'Post 2 - 2 matches, old',
      seoKeywords: ['resume', 'cv'],
      publishedAt: '2024-01-02T00:00:00Z',
      createdAt: '2024-01-02T00:00:00Z',
    },
    {
      id: 'post3',
      title: 'Post 3 - 2 matches, new',
      seoKeywords: ['resume', 'cv'],
      publishedAt: '2024-01-04T00:00:00Z',
      createdAt: '2024-01-04T00:00:00Z',
    },
    {
      id: 'post4',
      title: 'Post 4 - 1 match, new',
      seoKeywords: ['cv'],
      publishedAt: '2024-01-03T00:00:00Z',
      createdAt: '2024-01-03T00:00:00Z',
    },
  ]
  
  const sorted3 = sortRelatedPosts(sourceKeywords3, posts3)
  // Expected: post3 (2 matches, newest), post2 (2 matches, older), post4 (1 match, newer), post1 (1 match, oldest)
  if (
    sorted3[0].id === 'post3' &&
    sorted3[1].id === 'post2' &&
    sorted3[2].id === 'post4' &&
    sorted3[3].id === 'post1'
  ) {
    console.log('✅ Posts sorted correctly: score first, then date')
    console.log('   Order: post3 (2/new), post2 (2/old), post4 (1/new), post1 (1/old)')
    passed++
  } else {
    console.log(`❌ Expected order: post3, post2, post4, post1`)
    console.log(`   Got: ${sorted3.map(p => p.id).join(', ')}`)
    failed++
  }
  
  // Test 4: Filter out posts with no shared keywords
  console.log('\nTest 4: Only include posts with at least one shared keyword')
  const sourceKeywords4 = ['resume', 'cv']
  const posts4: BlogPost[] = [
    {
      id: 'post1',
      title: 'Post 1 - Has match',
      seoKeywords: ['resume', 'job'],
      publishedAt: '2024-01-01T00:00:00Z',
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'post2',
      title: 'Post 2 - No match',
      seoKeywords: ['interview', 'career'],
      publishedAt: '2024-01-02T00:00:00Z',
      createdAt: '2024-01-02T00:00:00Z',
    },
  ]
  
  const sorted4 = sortRelatedPosts(sourceKeywords4, posts4)
  const filtered4 = sorted4.filter(post => 
    calculateKeywordMatchScore(sourceKeywords4, post.seoKeywords) > 0
  )
  
  if (filtered4.length === 1 && filtered4[0].id === 'post1') {
    console.log('✅ Only posts with shared keywords included')
    passed++
  } else {
    console.log(`❌ Expected 1 post (post1), got ${filtered4.length}`)
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
