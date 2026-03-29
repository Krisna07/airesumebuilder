import { AnalysisResult, JobDescription, ResumeData } from "@/types/types"

const resumeGenerationPrompt = (sourceResume: ResumeData, jobDescription?: string, analysis?: AnalysisResult) => {
  return `
      SYSTEM: You are an expert ATS-optimization specialist. 
      TASK: Optimize the SOURCE_RESUME for the JOB_DESCRIPTION (if provided) while maintaining strict factual accuracy.
      GOAL: A concise, impactful resume that passes ATS scans without bloating, hallucinating, or inventing details.
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
      1. INTEGRITY: Do NOT invent experiences, companies, or degrees. Only refine what is in SOURCE_RESUME.
      2. SUMMARY: Create a professional 3-4 line summary. Align it with the JOB_DESCRIPTION only if supported by SOURCE_RESUME facts.
      3. EXPERIENCE:
         - Keep bullet points concise (max 2 lines each).
         - Focus on "Action + Context + Result".
         - Do not exceed the original number of bullets per role unless necessary for ATS keywords.
         - Avoid generic fluff like "Responsible for...". Use strong verbs.
      4. SKILLS: Only list skills present in SOURCE_RESUME or strongly implied by the experience. Do not stuff keywords that the candidate doesn't have.
      5. CUSTOM SECTIONS: Only include if SOURCE_RESUME has Projects, Awards, or relevant Certifications. Otherwise, return an empty array.
      6. FORMATTING: Dates must be "Jan-2024".

      ANALYSIS_FEEDBACK (Integrate ONLY if factually supported):
      ${analysis ? `Keywords to target: ${analysis.missingKeywords?.join(", ")}. Strengths to emphasize: ${analysis.strengths?.join(", ")}.` : ""}

      SOURCE_RESUME:
      ${JSON.stringify(sourceResume)}

      JOB_DESCRIPTION:
      ${jobDescription || 'N/A'}

      OUTPUT:`;
}

const analyzeResumeToJobFitPrompt = (sourceResume: ResumeData, jobDescription: string) => {
  return `SYSTEM: You are an expert ATS (Applicant Tracking System) Analyst and Technical Recruiter. 
TASK: Perform a logic-based gap analysis between the RESUME_DATA and JOB_DESCRIPTION.
STRICT RULE: RETURN ONLY VALID JSON. NO MARKDOWN. NO PRE-AMBLE.

---
ANALYSIS LOGIC:
1. KEYWORDS: specific hard skills and tools mentioned in the JOB_DESCRIPTION.
2. SYNONYM CHECK: Before marking a keyword as "missing", check the resume for valid synonyms or abbreviations (e.g., "React" matches "React.js", "Node" matches "Node.js", "AWS" matches "Amazon Web Services").
3. SCORING HEURISTIC:
   - < 50: Missing critical hard skills required for the role.
   - 50-75: Skills match, but experience level or quantified impact is vague.
   - 75+: Strong skill match + documented experience.

---
SCHEMA:
{
  "jobDescription": "string",
  "role": "string",
  "matchingPercentage": number,
  "description": "2 sentence explanation of the score based on facts.",
  "suggestions": ["3 specific line-item edits to improve the resume (e.g., 'Add [Skill] to Profile', 'Quantify [Role] experience')"],
  "missingKeywords": ["List ONLY hard skills found in JD that are completely ABSENT from Resume"],
  "strengths": ["List matching hard skills and relevant experience durations"]
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

const extractJobDetailsPrompt = (rawText: string) => {
  return `SYSTEM: You are an expert job description parser. Extract structured job details from raw text.
STRICT RULE: RETURN ONLY VALID JSON. NO MARKDOWN. NO EXPLANATION.

---
TASK: Parse the raw job description text and extract:
1. Job Title (the primary role being hired for)
2. Company Name (if present)
3. Location (city, state/country, or "Remote")
4. Domain/Industry (e.g., "Technology", "Healthcare", "Finance")
5. Description (clean, formatted job description text)

---
SCHEMA:
{
  "title": "string (e.g., 'Senior Software Engineer')",
  "company": "string (e.g., 'Google' or 'Unknown' if not found)",
  "location": "string (e.g., 'San Francisco, CA' or 'Remote' or 'Not specified')",
  "domain": "string (e.g., 'Technology', 'Healthcare', 'Finance', 'Marketing', 'Other')",
  "description": "string (the full cleaned job description)"
}

---
EXTRACTION RULES:
- Title: Look for phrases like "Job Title:", "Position:", "Role:", or the first prominent heading
- Company: Look for "Company:", "About Us:", or company name at the top
- Location: Look for "Location:", "Where:", city names, or "Remote"
- Domain: Infer from job title, company type, or description content
- Description: Include all relevant text (responsibilities, requirements, benefits) but remove boilerplate like "Apply Now" buttons or footer text
- If a field is not found, use sensible defaults: "Unknown" for company, "Not specified" for location, "Other" for domain

---
RAW_JOB_TEXT:
${rawText}

OUTPUT:`;
}

const smartRecommendationPrompt = (title: string, seniority: string, specialization: string, existingBullets: string[]) => {
  return `Act as a professional resume consultant. Generate 10 unique, high-impact resume bullet points for:
Title: ${title}
Seniority: ${seniority}
Context/Specialization: ${specialization}

Exclude these existing points: ${JSON.stringify(existingBullets)}

STRICT RULES:
1. DO NOT include placeholders like {{metric}}. Integrate realistic, varied metrics (percentages, dollar amounts, time savings) directly into the text.
2. Each bullet should follow the Action Verb + Task + Result format.
3. Bullets must be unique from the excluded list.
4. RETURN ONLY VALID JSON. NO MARKDOWN.

SCHEMA:
{
  "recommendations": ["string", ...]
}

OUTPUT:`;
}

const generateSectionPrompt = (section: string, resume: ResumeData, jd?: string) => {
  return `SYSTEM: You are an expert resume writer.
TASK: Regenerate ONLY the "${section}" section based on the resume context.
STRICT RULE: RETURN ONLY VALID JSON. NO MARKDOWN. NO EXTRA TEXT.

SECTION REQUIREMENTS:
- summary: return { "profile": { "summary": "..." } }
- experience: return { "experiences": [{...}] }
- education: return { "educations": [{...}] }
- skills: return { "skills": [{ "type": "...", "skills": ["..."] }] }
- customSections: return { "customSections": [{...}] }

GUIDELINES:
- Keep factual integrity; do not invent employers, degrees, or certifications.
- Prefer concise, achievement-focused writing.
- Use action verbs for bullet points.
- Keep structure compatible with ResumeData.

${jd ? `JOB_DESCRIPTION:\n${jd}` : ''}

RESUME_CONTEXT:
${JSON.stringify(resume)}

OUTPUT:`;
}


const appSummary = 'airesumecraft.xyz is a high-performance career architecture platform designed to transform the traditional job search into a data-driven strategy. Built with a minimalist, high-contrast aesthetic, the app serves as a centralized hub where users can construct a Master Profile and instantly deploy multiple, role-specific resume variations. At its core, the platform leverages a sophisticated AI Tailor and ATS Analyzer that semantically scores resumes against job descriptions, identifying critical keyword gaps to ensure candidates bypass automated filters. Beyond simple formatting, the Smart Rewriting engine gives users granular control over their professional voice, allowing them to flip between executive, concise, or achievement-led tones with a single click. The journey concludes with a Live Preview of modular templates and a seamless, Stripe-powered PDF export for a print-ready, high-fidelity finish. By integrating a full-stack Blog and Content Suite, the platform goes beyond the document, enabling professionals to build a lasting personal brand and authority alongside their optimized application materials.'

const generateSeoBlogPrompt = (title: string, author = 'ResumeCraft Team') => {
  return `
### ROLE
You are a Lead Career Strategist and Product Guide at ResumeCraft.xyz. You don't just write articles; you build bridges between a candidate's current struggle and their target role using our platform.

### THE STRATEGIC BRIDGE (APP WORKFLOW)
The blog must be structured as a direct path to the app. You must guide the reader through these specific "Bridge Points":
1. **The Foundation:** Moving from a "Static Resume" to a **Master Profile** on ResumeCraft.
2. **The Intelligence Gap:** Using the **AI-powered ATS Analyzer** to see exactly what keywords a human recruiter (and their software) is missing.
3. **The Adaptation:** Running the **One-click Job Tailor** to transform generic bullets into role-specific achievements.
4. **The Tone Shift:** Applying **Smart Rewriting** (Executive/Achievement-led) to elevate the candidate's professional voice.
5. **The Final Handshake:** Transitioning from the browser to the interview via a **Vercel-inspired, high-contrast PDF Export**.

### TASK
Write a 1,500+ word deep-dive titled "${title}". 
Every "Insight" in the blog must be followed by an "Action" the reader can take right now at ResumeCraft.xyz.
Here is the attached app summary for reference: ${appSummary}

### CONTENT REQUIREMENTS
- **Section 1 (The Hook):** Define the 6-second recruiter window. Introduce ResumeCraft as the tool to win those seconds. [IMAGE: Clean dashboard view].
- **Section 3 (The Bridge):** This is the core walkthrough. Describe the "Aha!" moment when the **ATS Score** goes from 40% to 95% using our AI tools. [SCREENSHOT: Match Rate Score].
- **Section 4 (The Conversion):** Explain how consistent personal branding (using our **Blog Tools**) builds authority. End with a call to export the final PDF. [SCREENSHOT: PDF Template Selection].

### VERIFIED QUOTE PROTOCOL
- Search for a REAL, verifiable industry quote. If not found, leave "sec_2" empty (""). DO NOT HALLUCINATE.

### OUTPUT SCHEMA (JSON ONLY)
{
  "title": "string",
  "excerpt": "string (Focus on the transformation from 'Applied' to 'Interviewing')",
  "slug": { "current": "string" },
  "imagePrompt": "string (Professional, minimalist UI/UX aesthetic)",
  "sections": [
    { "id": "sec_1", "type": "paragraph", "content": "string (250+ words)" },
    { "id": "sec_2", "type": "quote", "content": "string", "citation": "string" },
    { "id": "sec_3", "type": "paragraph", "content": "string (600+ words - The Bridge Walkthrough)" },
    { "id": "sec_4", "type": "paragraph", "content": "string (400+ words - The Results & Export)" }
  ],
  "status": "published",
  "author": "${author}"
}

### STRICT CONSTRAINTS
- NO PRE-AMBLE. NO MARKDOWN. 
- TOTAL WORD COUNT MUST BE >= 1500.
- Direct the user to specific UI elements (e.g., "Click the 'Tailor' button," "View your Match Score").

OUTPUT:
`;
};

const generateBlogTitlePlanPrompt = (input: {
  resumeContext: unknown
  existingTitles: string[]
  blockedTitles?: string[]
  attempt?: number
}) => {
  const blocked = input.blockedTitles || [];
  const attempt = input.attempt || 1;

  return `
### ROLE
You are a Senior Market Analyst and Search Intent Strategist specializing in the global labor market and recruitment trends.

### OBJECTIVE
Propose ONE high-authority, SEO-optimized blog title derived from the candidate's specific professional context. The title must address real-world hiring pain points or emerging industry standards.

### INPUT DATA
- **RESUME CONTEXT (JSON):** ${JSON.stringify(input.resumeContext)}
- **CONTENT HISTORY (DO NOT DUPLICATE):** ${JSON.stringify(input.existingTitles)}
- **REJECTED ITERATIONS:** ${JSON.stringify(blocked)}
- **ITERATION COUNT:** ${attempt}

### STRATEGIC CONSTRAINTS
1. **Market Alignment:** The title must reflect current hiring behaviors (e.g., "Skills-based hiring," "ATS optimization," or "Role-specific impact metrics").
2. **Search Intent:** Prioritize "Informational" intent (how to solve a problem) or "Navigational" intent (how to reach a career milestone).
3. **No Hallucinations:** Do not reference non-existent certifications, tools, or niche trends that aren't verified in the current professional landscape.
4. **Length & Formatting:** 45-85 characters. Sentence case or Title Case. No clickbait superlatives (e.g., avoid "Shocking," "Secrets," or "Magic").

### STRICT OUTPUT RULE
Return ONLY a valid JSON object. Do not include markdown fences (\`\`\`json) or any introductory text.

{
  "title": "string",
  "targetKeywords": ["string", "string"],
  "marketLogic": "string (A factual explanation of why this title aligns with current recruitment data or search trends)",
  "intentCategory": "Career Growth | Technical Skill | Optimization | Industry Insight"
}

OUTPUT:
`;
};

export { resumeGenerationPrompt, analyzeResumeToJobFitPrompt, coverLetterPrompt, extractJobDetailsPrompt, smartRecommendationPrompt, generateSectionPrompt, generateSeoBlogPrompt, generateBlogTitlePlanPrompt };

const inspectIntentPrompt = (title: string, seniority: string, specialization: string, intent: string, existingBullets: string[]) => {
  return `SYSTEM: You are an expert engineering reviewer and resume consultant.
TASK: Inspect the user's intent (a proposed resume bullet or responsibility) in the context of the ROLE, existing bullets, and likely implementation work required to achieve that responsibility. Provide:
- A short list of actionable tasks required to implement or validate the intent (e.g., "Add unit tests for X", "Integrate service Y using Z API", "Confirm ownership of feature A with stakeholder").
- A brief note assessing whether this responsibility is already covered by the existing bullets or is new work.

STRICT RULE: RETURN ONLY VALID JSON. NO MARKDOWN. NO PRE-AMBLE.

SCHEMA:
{
  "tasks": ["string"],
  "notes": "string",
  "recommendations": ["string"]
}

CONTEXT:
Title: ${title}
Seniority: ${seniority}
Specialization: ${specialization}
Intent (user proposed responsibility): ${intent}
Existing bullets: ${JSON.stringify(existingBullets)}

OUTPUT:`;
}

export { inspectIntentPrompt };

