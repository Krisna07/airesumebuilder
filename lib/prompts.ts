import { AnalysisResult, JobDescription, ResumeData } from "@/types/types"

const resumeGenerationPrompt = (sourceResume: ResumeData, jobDescription?: string) => {
  // Updated for customSections replacing legacy certificates.
  // customSections: array of section objects each with a title and array of subsections.
  // subsection: { title, content (rich summary), optional date }
  return `SYSTEM: You are a senior resume writer. RETURN ONLY VALID JSON. Do not include any prose, explanation, or markdown.
Be careful: start the response with '{' and end with '}' and nothing else.

SCHEMA (keys and basic constraints):
{
    "profile": {"fullname": string, "email": string, "phone": string, "location": string, "links": [{"type": string, "url": string}], "summary": string},
    "experiences": [{"title": string, "company": string, "location": string, "startDate": string, "endDate": string, "current": boolean, "responsibilities": string[]}],
    "educations": [{"degree": string, "university": string, "location": string, "startDate": string, "endDate": string, "current": boolean}],
    "skills": [{"type": string, "skills": string[]}],
    "customSections": [{
            "title": string, // e.g. "Projects", "Awards", "Publications", "Volunteer"
            "subsections": [{"title": string, "content": string, "date": string}]
    }]
}

CUSTOM SECTIONS RULES:
- Use at most 3 customSections unless source resume already has more.
- Pick only high-impact categories relevant to the job description if Job description is provided (e.g. Publications for research roles, Projects for engineering roles).
- Each subsection content should be 1–2 concise sentences; no bullet symbols, just plain text.
- Omit date if not provided or irrelevant.

GENERAL RULES:
- Dates: use Mon-YYYY (e.g. Jan-2024).
- Summary: maximum ~80 words; tailor to job description.
- Experiences: each must include 3–6 strong responsibility bullets; start each with a verb; include measurable outcomes when possible.
- Skills: group meaningfully; aim for >=10 distinct skills across groups; avoid duplicates.
- Links: derive link "type" from host (e.g. github.com => "GitHub").
- Empty lists must be [] (never null or omitted).
- Output must be STRICT JSON: double-quoted keys/strings, no trailing commas, no comments.

SOURCE_RESUME_JSON:
${JSON.stringify(sourceResume)}

JOB_DESCRIPTION_TEXT:\n${jobDescription || ''}

EXPECTED_MINIMAL_OUTPUT_EXAMPLE:
{"profile":{"fullname":"Name","email":"","phone":"","location":"","links":[],"summary":""},"experiences":[],"educations":[],"skills":[],"customSections":[]}

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

RESUME_JSON (truncated view):
${JSON.stringify(compactResume)}

NOTE:
- customSections present in resume may reflect projects, awards, publications, volunteer work. When deriving suggestions or strengths, treat subsection content as rich achievements.
- Do NOT hallucinate categories not in resume; if customSections is empty, ignore it.

JOB_DESCRIPTION_TEXT:\n${jobDescription}

OUTPUT:`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const coverLetterPrompt = (sourceResume: ResumeData, jobDescription: JobDescription, analysis?: AnalysisResult | undefined) => {
  const resumeJson = sourceResume ? JSON.stringify(sourceResume) : '{}';
  const jobDescriptionJson = jobDescription ? JSON.stringify(jobDescription) : '';
  const analysisJson = analysis ? JSON.stringify(analysis) : '';
  return `SYSTEM: You are a professional cover letter writer. RETURN ONLY VALID JSON. Do not include any prose, explanation, or markdown.
Be careful: start the response with '{' and end with '}' and nothing else.

SCHEMA (keys and constraints):
{
  "salutation": string, // e.g. "Dear Hiring Manager," — use specific name only if provided
  "coverLetter": string, // full cover letter in first-person, 3-5 short paragraphs, tailored to the job and resume
  "closing": string, // e.g. "Sincerely,\nFull Name"
  "keyParagraphs": [{"purpose": string, "text": string}], // ordered breakdown: opening, fit, impact, closing
  "highlights": [{"title": string, "text": string}], // up to 3 short highlight bullets the candidate can paste elsewhere
  "tone": string, // single word describing tone (e.g. "professional", "enthusiastic")
  "wordCount": number // integer count of words in coverLetter
}

RULES:
- Output ONLY JSON. No prose outside JSON, no commentary.
- coverLetter must read like the candidate wrote it (first-person, natural human voice).
- Use specifics from the resume JSON and the job description or analysis when available (company, role, technologies, measurable results).
- Do NOT fabricate facts: if a metric or date is not present in the resume/analysis, do not invent numbers — instead use qualitative phrasing (e.g. "driving user growth" rather than "grew users by 35%").
- Keep the letter between ~200 and 500 words unless the job description requests otherwise.
- Use a concise opening that references the role and company, a middle paragraph that connects 2-3 core qualifications to the role, an impact paragraph with an example or two (drawn from resume/analysis), and a closing paragraph with a call to action.
- If ${jobDescription} is provided, incorporate the top strengths and suggestions into the letter (explicitly mention 1–2 strengths).
- If ${analysis} is missing, still craft a tailored-sounding letter focusing on the candidate's strongest fit and motivation.
- If a field would be empty, return an empty string or empty array, but keep the key present.

SOURCE_RESUME_JSON:
${resumeJson}

JOB_DESCRIPTION_TEXT:
${jobDescriptionJson || ''}

ANALYSIS_JSON:
${analysisJson}

EXPECTED_MINIMAL_OUTPUT_EXAMPLE:
{"salutation":"Dear Hiring Manager,","coverLetter":"","closing":"Sincerely, Full Name","keyParagraphs":[],"highlights":[],"tone":"professional","wordCount":0}

OUTPUT:`;
}


export { resumeGenerationPrompt, analyzeResumeToJobFitPrompt, coverLetterPrompt };

