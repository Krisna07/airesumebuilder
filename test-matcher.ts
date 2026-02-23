import { matchRole } from './lib/roleMatcher';

const testCases = [
  { input: "Senior Software Engineer", expected: "software_engineer" },
  { input: "Frontend Developer", expected: "software_engineer" },
  { input: "Project Manager", expected: "project_manager" },
  { input: "Data Analyst", expected: "data_analyst" },
  { input: "Construction Worker", expected: "construction_worker" },
  { input: "Electrician apprentice", expected: "electrician" },
  { input: "Clean the house", expected: "cleaner" },
  { input: "Registered Nurse", expected: "nurse" },
  { input: "random gibberish", expected: null }
];

testCases.forEach(({ input, expected }) => {
  const result = matchRole(input);
  console.log(`Input: "${input}" | Result: "${result}" | ${result === expected ? "PASS" : "FAIL (Expected: " + expected + ")"}`);
});
