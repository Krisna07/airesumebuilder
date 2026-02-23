import recommendations from "@/data/recommendations.json"

interface RoleData {
  aliases: string[];
  specializations?: Record<string, unknown>;
  [key: string]: unknown;
}

export function matchRole(userInput: string) {
  if (!userInput) return null;

  // Simple list of stop words to ignore
  const stopWords = new Set(["a", "an", "the", "and", "or", "of", "for", "with", "in", "to", "at", "by", "on"]);
  
  const normalizeToken = (t: string) => t.replace(/[^a-z0-9]/gi, '').toLowerCase();

  // Common abbreviation expansions to improve matching
  const abbreviationMap: Record<string, string> = {
    sr: 'senior',
    'sr.': 'senior',
    jr: 'junior',
    'jr.': 'junior',
    eng: 'engineer',
    dev: 'developer',
    's/w': 'software',
  };

  const expandToken = (t: string) => {
    const raw = t.toLowerCase();
    if (abbreviationMap[raw]) return abbreviationMap[raw];
    // simple singularize: remove trailing 's'
    if (raw.endsWith('s') && raw.length > 3) return raw.slice(0, -1);
    return raw;
  };

  const userTokens = userInput
    .toLowerCase()
    .split(/[\s,./-]+/)
    .map(normalizeToken)
    .map(expandToken)
    .filter(w => w.length > 0 && !stopWords.has(w));

  if (userTokens.length === 0) return null;

  let bestRoleMatch: string | null = null;
  let maxScore = 0;

  const roles = (recommendations as unknown as { roles: Record<string, RoleData> }).roles;

  for (const [roleKey, roleValue] of Object.entries(roles)) {
    const data = roleValue as RoleData;
    let score = 0;

    // 1. Check for exact alias match (High Priority)
    const hasExactMatch = data.aliases.some((alias: string) => 
      alias.toLowerCase().trim() === userInput.toLowerCase().trim()
    );
    // Prioritize an exact alias match by returning immediately.
    if (hasExactMatch) {
      return roleKey;
    }

    // 2. Token-based matching across all aliases
    const allAliasTokens = new Set<string>();
    data.aliases.forEach((alias: string) => {
      alias.toLowerCase().split(/[\s,./-]+/).map(normalizeToken).map(expandToken).forEach(token => {
        if (token && !stopWords.has(token)) allAliasTokens.add(token);
      });
    });

    let matchedTokens = 0;
    for (const uToken of userTokens) {
      if (allAliasTokens.has(uToken)) {
        matchedTokens++;
        score += 1;
      } else {
        // more tolerant matching: substring or startsWith for longer tokens
        let partialMatched = false;
        for (const aToken of allAliasTokens) {
          if (!aToken || !uToken) continue;
          if (aToken.includes(uToken) || uToken.includes(aToken) || aToken.startsWith(uToken) || uToken.startsWith(aToken)) {
            // weight partial matches slightly based on length similarity
            const weight = Math.min(1, Math.max(0.3, Math.min(aToken.length, uToken.length) / Math.max(aToken.length, uToken.length)));
            score += 0.5 * weight;
            matchedTokens += 0.5 * weight;
            partialMatched = true;
            break;
          }
        }
        if (!partialMatched) {
          // try fuzzy numeric match (e.g., 'nodejs' vs 'node')
          for (const aToken of allAliasTokens) {
            if (aToken.replace(/\W/g, '').includes(uToken.replace(/\W/g, ''))) {
              score += 0.4;
              matchedTokens += 0.4;
              break;
            }
          }
        }
      }
    }

    // 3. Completeness Bonus: add proportional bonus based on title word coverage
    // This rewards roles that cover more of the input tokens.
    const coverage = Math.min(1, matchedTokens / Math.max(1, userTokens.length));
    score += coverage * 5; // up to +5 when fully covered

    if (score > maxScore) {
      maxScore = score;
      bestRoleMatch = roleKey;
    }
  }

  // Only return a match if we have a significant score
  if (maxScore > 0) return bestRoleMatch;

  // Debug: if no match found, log normalized tokens for inspection
  try {
    // eslint-disable-next-line no-console
    console.debug('[roleMatcher] No match for input tokens:', userInput, '->', userTokens);
  } catch (e) {}
  return null;
}
