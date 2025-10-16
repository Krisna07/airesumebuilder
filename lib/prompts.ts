import { ResumeData } from "@/types/types"

const resumeGenerationPrompt = (sourceResume: ResumeData, jobDescription: string) => {
    // Refined prompt to reduce model noise and enforce strict JSON output.
    // - Very explicit: start with a JSON object and end with the closing brace.
    // - Provide a minimal example of the expected JSON output (shape only).
    // - Ask for shortest possible valid JSON that satisfies constraints.
    return `SYSTEM: You are a senior resume writer. RETURN ONLY VALID JSON. Do not include any prose, explanation, or markdown.
Be careful: start the response with '{' and end with '}' and nothing else.

SCHEMA (keys and basic constraints):
{
  "profile": {"fullname": string, "email": string, "phone": string, "location": string, "links": [{"type": string, "url": string}], "summary": string },
  "experiences": [{"title": string, "company": string, "location": string, "startDate": string, "endDate": string, "current": boolean, "responsibilities": string[]}],
  "educations": [{"degree": string, "university": string, "location": string, "startDate": string, "endDate": string, "current": boolean}],
  "skills": [{"type": string, "skills": string[]}],
  "certificates": [{"title": string, "issued_by": string, "year": string}]
}

RULES:
- Dates: use Mon-YYYY (e.g. Jan-2024).
- Summary: ~80 words maximum.
- Experiences: each should include at least 5 strong responsibility bullets, start each with a verb, favor specificity and quantification.
- Skills: group meaningfully; aim for 10+ skills total across groups.
- Links: derive link "type" from host (e.g. github.com => "GitHub").
- If any list would be empty, return an empty array for that key.
- Output must be strictly parseable JSON (no trailing commas, no comments, double-quoted keys/strings).

SOURCE_RESUME_JSON:
${JSON.stringify(sourceResume)}

JOB_DESCRIPTION_TEXT:\n${jobDescription || ''}

EXPECTED_MINIMAL_OUTPUT_EXAMPLE:
{"profile": {"fullname": "Name", "email": "", "phone": "", "location": "", "links": [], "summary": ""}, "experiences": [], "educations": [], "skills": [], "certificates": []}

OUTPUT:`
}

const analyzeResumeToJobFitPrompt = (sourceResume: ResumeData, jobDescription: string) => {
    const compactResume = sourceResume
        ? {
            ...sourceResume,
            experiences: sourceResume.experiences?.slice(0, 8), // cap to avoid runaway tokens
            educations: sourceResume.educations?.slice(0, 5),
        customSections: sourceResume.customSections?.slice(0, 10),
            skills: sourceResume.skills?.slice(0, 20),
        }
        : {};
    return `SYSTEM: You are an expert technical recruiter. Return only strict JSON.
SCHEMA (keys & constraints):
{
  "jobDescription": string, // normalized copy of input JD (trimmed)
  "role": string, // inferred concise primary target role (<=60 chars)
  "matchingPercentage": number, // integer 0-100 (no % sign)
  "description": string, // 1-3 sentence summary of candidate vs role
  "suggestions": string[], // actionable verbs, unique, max 8
  "missingKeywords": string[], // high-signal terms absent or weak, max 12
  "strengths": string[] // notable differentiators, max 8
}
RULES:
- Output ONLY JSON. No prose. No explanations.
- If a list would be empty, return [].
- Do not fabricate technologies not implied by resume.
- matchingPercentage must correlate with coverage of core responsibilities & keywords.
- Avoid generic role names (e.g. "Professional"). Prefer "Senior Frontend Engineer", etc.

RESUME_JSON:
${JSON.stringify(compactResume)}

JOB_DESCRIPTION_TEXT:\n${jobDescription}

OUTPUT:`;
}


export { resumeGenerationPrompt, analyzeResumeToJobFitPrompt };