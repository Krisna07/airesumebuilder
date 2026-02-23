const fs = require('fs');
const path = require('path');

const recommendations = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/recommendations.json'), 'utf8'));

function matchRole(userInput) {
  if (!userInput) return null;

  const stopWords = new Set(["a", "an", "the", "and", "or", "of", "for", "with", "in", "to", "at", "by", "on"]);
  
  const userTokens = userInput
    .toLowerCase()
    .split(/[\s,./-]+/)
    .filter(w => w.length > 0 && !stopWords.has(w));

  if (userTokens.length === 0) return null;

  let bestRoleMatch = null;
  let maxScore = 0;

  const roles = recommendations.roles;

  for (const [roleKey, roleValue] of Object.entries(roles)) {
    const data = roleValue;

    for (const alias of data.aliases) {
      const aliasTokens = alias.toLowerCase().split(/[\s,./-]+/).filter((w) => w.length > 0 && !stopWords.has(w));
      
      let currentAliasScore = 0;
      for (const uToken of userTokens) {
        const matches = aliasTokens.some(aToken => {
          if (aToken === uToken) return true;
          if (aToken.length > 3 && uToken.length > 3) {
            return aToken.startsWith(uToken) || uToken.startsWith(aToken);
          }
          return false;
        });

        if (matches) {
          currentAliasScore++;
        }
      }

      if (currentAliasScore > maxScore) {
        maxScore = currentAliasScore;
        bestRoleMatch = roleKey;
      }
    }
  }

  return maxScore > 0 ? bestRoleMatch : null;
}

const testCases = [
  { input: "Senior Software Engineer", expected: "software_engineer" },
  { input: "Frontend Developer", expected: "software_engineer" },
  { input: "Project Manager", expected: "project_manager" },
  { input: "Data Analyst", expected: "data_analyst" },
  { input: "Construction Worker", expected: "construction_worker" },
  { input: "Electrician apprentice", expected: "electrician" },
  { input: "Clean the house", expected: "cleaner" },
  { input: "Registered Nurse", expected: "nurse" },
  { input: "Physician in surgery", expected: "doctor" },
  { input: "random gibberish", expected: null }
];

testCases.forEach(({ input, expected }) => {
  const result = matchRole(input);
  console.log(`Input: "${input}" | Result: "${result}" | ${result === expected ? "PASS" : "FAIL (Expected: " + expected + ")"}`);
});
