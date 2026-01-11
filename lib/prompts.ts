import { AnalysisResult, JobDescription, ResumeData } from "@/types/types"

const resumeGenerationPrompt = (sourceResume: ResumeData, jobDescription?: string, analysis?: AnalysisResult) => {
  return `SYSTEM: You are an expert ATS-optimization specialist and Senior Resume Writer.
TASK: Transform the SOURCE_RESUME into a tailored, professional JSON format.
STRICT RULE: RETURN ONLY VALID JSON. NO MARKDOWN. NO PRE-AMBLE.

---
SCHEMA:
{
  "profile": { "fullname": "string", "email": "string", "phone": "string", "location": "string", "links": [{"type": "string", "url": "string"}], "summary": "string" },
  "experiences": [{ "title": "string", "company": "string", "location": "string", "startDate": "Mon-YYYY", "endDate": "Mon-YYYY", "current": boolean, "responsibilities": ["string"] }],
  "educations": [{ "degree": "string", "university": "string", "location": "string", "startDate": "Mon-YYYY", "endDate": "Mon-YYYY", "current": boolean }],
  "skills": [{ "type": "string", "skills": ["string"] }],
  "customSections": [{ "title": "string", "subsections": [{ "title": "string", "content": "string", "date": "string" }] }]
}

---
CRITICAL GUIDELINES:
1. SUMMARY: Max 80 words. Focus on years of experience + top 2 technical skills + 1 major achievement.
2. EXPERIENCE: 3-6 bullets per role. Start with strong action verbs (e.g., "Architected," "Spearheaded"). Quantify results (e.g., "increased efficiency by 20%") where implied.
3. SKILLS: Group by category (e.g., "Languages", "Cloud"). Minimum 10 unique skills.
4. CUSTOM SECTIONS: Focus on high-impact Projects or Awards. Max 3 sections. Content must be 1-2 plain-text sentences (no bullets).
5. FORMATTING: All dates MUST be "Jan-2024" format. Use "Present" for current roles.

ANALYSIS_FEEDBACK:
${analysis ? `Focus on these missing keywords: ${analysis.missingKeywords?.join(", ")}. 
   Highlight these strengths: ${analysis.strengths?.join(", ")}.` : ""}

SOURCE_RESUME:
${JSON.stringify(sourceResume)}

JOB_DESCRIPTION:
${jobDescription || 'N/A'}

OUTPUT:`;
}

const analyzeResumeToJobFitPrompt = (sourceResume: ResumeData, jobDescription: string) => {
  return `SYSTEM: You are a Technical Recruiting Lead. Analyze the candidate's fit for the provided Job Description.
STRICT RULE: RETURN ONLY VALID JSON.

---
EVALUATION STEPS:
1. Identify "Must-Have" vs "Nice-to-Have" keywords in the JD.
2. Calculate Matching Percentage based on Keyword Match (40%), Experience Level (40%), and Industry Fit (20%).
3. Identify 3-5 "Missing Keywords" that are vital for ATS passing.

---
SCHEMA:
{
  "jobDescription": "trimmed_jd",
  "role": "Specific Job Title",
  "matchingPercentage": 0-100,
  "description": "1-3 sentence objective assessment.",
  "suggestions": ["Actionable steps to improve resume for this specific role"],
  "missingKeywords": ["Missing technical or soft skills found in JD"],
  "strengths": ["Differentiators found in candidate's profile"]
}

RESUME_DATA:
${JSON.stringify(sourceResume)}

JOB_DESCRIPTION:
${jobDescription}

OUTPUT:`;
}

const coverLetterPrompt = (sourceResume: ResumeData, jobDescription: JobDescription, analysis?: AnalysisResult) => {
  return `SYSTEM: You are a Career Consultant writing a bespoke cover letter.
TONE: Professional, confident, and human. Avoid clichés like "I am writing to express my interest."
STRICT RULE: RETURN ONLY VALID JSON.

---
STRATEGY:
- Opening: Hook the reader with a specific accomplishment or shared value.
- Body: Connect the candidate's "Strengths" from the ANALYSIS to the core challenges of the JD.
- Closing: Focused on a "Call to Action" (interview request).

SCHEMA:
{
  "salutation": "string",
  "coverLetter": "string",
  "closing": "string",
  "keyParagraphs": [{ "purpose": "opening|fit|impact|closing", "text": "string" }],
  "highlights": [{ "title": "string", "text": "string" }],
  "tone": "string",
  "wordCount": number
}

---
CONTEXT:
RESUME: ${JSON.stringify(sourceResume)}
JD: ${JSON.stringify(jobDescription)}
ANALYSIS: ${JSON.stringify(analysis || {})}

OUTPUT:`;
}

export { resumeGenerationPrompt, analyzeResumeToJobFitPrompt, coverLetterPrompt };

