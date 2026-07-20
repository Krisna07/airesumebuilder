import { AnalysisResult, JobDescription, ResumeData } from "@/types/types"

const resumeGenerationPrompt = (sourceResume: ResumeData, jobDescription?: string, analysis?: AnalysisResult, customPrompt?: string) => {
  return `
      SYSTEM: You are an expert ATS-optimization specialist. 
      TASK: Optimize the SOURCE_RESUME for the JOB_DESCRIPTION (if provided) while maintaining strict factual accuracy.
      GOAL: A concise, impactful resume that passes ATS scans without bloating, hallucinating, or inventing details.
      STRICT RULE: RETURN ONLY VALID JSON. NO MARKDOWN. NO PRE-AMBLE.

      INSTRUCTION PRIORITY (highest to lowest):
      1. USER INSTRUCTIONS (if provided)
      2. JOB_DESCRIPTION alignment
      3. ANALYSIS_FEEDBACK suggestions
      4. Default optimization guidelines
      The only constraints that always override everything else are JSON schema validity and factual integrity.

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
        - Use metrics sparingly. Not every bullet needs numbers.
        - Include quantified results only when they are clearly supported by SOURCE_RESUME.
        - Aim for at most 1 quantified bullet for every 2-3 bullets.
         - Do not exceed the original number of bullets per role unless necessary for ATS keywords.
         - Avoid generic fluff like "Responsible for...". Use strong verbs.
      4. SKILLS: Only list skills present in SOURCE_RESUME or strongly implied by the experience. Do not stuff keywords that the candidate doesn't have.
      5. CUSTOM SECTIONS: Always preserve existing custom sections from SOURCE_RESUME (Certifications, Projects, Awards, Publications, Languages, Volunteer Work, etc.).
         - Refine descriptions if needed but keep facts intact.
         - Do not remove any custom sections unless explicitly instructed.
         - Return empty array only if SOURCE_RESUME has no custom sections.
      6. FORMATTING: Dates must be "Jan-2024".

      ANALYSIS_FEEDBACK (Integrate ONLY if factually supported):
      ${analysis ? `Keywords to target: ${analysis.missingKeywords?.join(", ")}. Strengths to emphasize: ${analysis.strengths?.join(", ")}.` : ""}

      ${customPrompt ? `USER INSTRUCTIONS (HIGH PRIORITY):\n${customPrompt}\nFollow these instructions first whenever possible, while maintaining INTEGRITY and factual accuracy.` : ""}

      SOURCE_RESUME:
      ${JSON.stringify(sourceResume)}

      JOB_DESCRIPTION:
      ${jobDescription || 'N/A'}

      OUTPUT:`;
}

const resumeExtractionPrompt = (rawText: string) => {
  return `SYSTEM: You are an expert resume parser with a mission to extract EVERY SINGLE DETAIL.
TASK: Convert the RAW_RESUME_TEXT into the exact JSON schema below.
STRICT RULE: RETURN ONLY VALID JSON. NO MARKDOWN. NO EXPLANATION.

CRITICAL: Extract as much detail as possible. Be thorough. Do not skip information.

---
GOAL:
- Extract the candidate's name, contact info, work history, education, skills, and custom sections from the raw text.
- Capture EVERY detail including dates, locations, company names, responsibilities, and achievements.
- If a field is not present, use an empty string for text fields and an empty array for list fields.
- Preserve the original facts and dates as accurately as possible.
- For responsibilities, extract ALL bullet points - don't summarize or limit to top few items.
- For skills, be very thorough and extract ALL skills mentioned, grouped by type.

---
CUSTOM SECTIONS IDENTIFICATION:
Look for sections with these common titles (or variations):
- Certifications, Licenses, Credentials, Professional Credentials, Certifications & Awards
- Projects, Notable Projects, Portfolio Projects, Side Projects, Personal Projects
- Awards, Honors, Recognition, Achievements, Academic Awards, Employee of the Month
- Publications, Research, Articles, Papers, Technical Papers, Whitepapers
- Languages, Language Skills, Proficiencies, Language Proficiencies, Multilingual
- Volunteer Work, Volunteering, Community Service, Volunteer Experience, Volunteer Positions
- Speaking, Presentations, Conferences, Speaking Engagements, Conference Talks
- Professional Memberships, Association Memberships, Member Organizations, Memberships
- Courses, Training, Professional Development, Workshops, Online Courses, Certifications
- Other, Additional Info, Additional Information, Miscellaneous, Other Details, Interests

RULES FOR CUSTOM SECTIONS:
- If a section is found with one of the above titles (or similar), extract it as a custom section.
- For each subsection item, extract:
  * title: The name/title of the certification, project, award, etc. (REQUIRED)
  * content: A description or context for the item (include dates, achievements, etc.)
  * date: If a date is mentioned, include it (e.g., "2023", "Jan-2023"). Otherwise, empty string.
- Always look for and extract ANY significant section that is NOT experience, education, or core skills.
- Extraction is better than omission - if unsure, include it.

DETAIL EXTRACTION RULES:
- For EXPERIENCES: Extract every responsibility as a separate item in the responsibilities array
- For EDUCATIONS: Include all degrees found, GPA if mentioned, honors if mentioned
- For SKILLS: Group by type (Technical, Languages, Tools, Soft Skills, etc.) and include ALL skills
- For CUSTOM SECTIONS: Include every achievement, award, publication, certification mentioned

---
SCHEMA:
{
  "profile": { "fullname": "string", "email": "string", "phone": "string", "location": "string", "links": [{ "type": "string", "url": "string" }], "summary": "string" },
  "experiences": [{ "title": "string", "company": "string", "location": "string", "startDate": "Mon-YYYY", "endDate": "Mon-YYYY", "current": boolean, "responsibilities": ["string"] }],
  "educations": [{ "degree": "string", "university": "string", "location": "string", "startDate": "Mon-YYYY", "endDate": "Mon-YYYY", "current": boolean }],
  "skills": [{ "type": "string", "skills": ["string"] }],
  "customSections": [{ "title": "string", "subsections": [{ "title": "string", "content": "string", "date": "string" }] }]
}

---
RAW_RESUME_TEXT:
${rawText}

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
1. DO NOT include placeholders like {{metric}}.
2. Use metrics selectively. Do not force numbers into every bullet.
3. Keep most bullets impact-focused but natural, with only occasional quantified outcomes.
4. If a metric is used, keep it realistic and context-appropriate.
5. Each bullet should follow the Action Verb + Task + Result format.
6. Bullets must be unique from the excluded list.
7. RETURN ONLY VALID JSON. NO MARKDOWN.

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
- For experience responsibilities, avoid over-quantifying. Use numbers only when they feel natural and credible.
- Keep structure compatible with ResumeData.

${jd ? `JOB_DESCRIPTION:\n${jd}` : ''}

RESUME_CONTEXT:
${JSON.stringify(resume)}

OUTPUT:`;
}


const appSummary = 'airesumecraft.xyz is a high-performance career architecture platform designed to transform the traditional job search into a data-driven strategy. Built with a minimalist, high-contrast aesthetic, the app serves as a centralized hub where users can construct a Master Profile and instantly deploy multiple, role-specific resume variations. At its core, the platform leverages a sophisticated AI Tailor and ATS Analyzer that semantically scores resumes against job descriptions, identifying critical keyword gaps to ensure candidates bypass automated filters. Beyond simple formatting, the Smart Rewriting engine gives users granular control over their professional voice, allowing them to flip between executive, concise, or achievement-led tones with a single click. The journey concludes with a Live Preview of modular templates and a seamless, Stripe-powered PDF export for a print-ready, high-fidelity finish. By integrating a full-stack Blog and Content Suite, the platform goes beyond the document, enabling professionals to build a lasting personal brand and authority alongside their optimized application materials.'

const generateSeoBlogPrompt = (title: string, author = 'ResumeCraft Team', targetKeywords: string[] = []) => {
  const keywordHint = targetKeywords.length > 0
    ? `\n### TARGET KEYWORDS (weave naturally into content, aim for 2-3% density)\n${targetKeywords.map(k => `- ${k}`).join('\n')}`
    : ''

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
Write a 1,500–2,000 word deep-dive titled "${title}". 
Every "Insight" in the blog must be followed by an "Action" the reader can take right now at ResumeCraft.xyz.
Here is the attached app summary for reference: ${appSummary}
${keywordHint}

### REQUIRED STRUCTURE (8–12 sections minimum)
You MUST include these section types in this order:
1. **Hook paragraph** (200+ words) — Open with a surprising stat, recruiter insight, or common pain point
2. **H2 heading** — "The Core Problem" or similar
3. **Explanation paragraph** (200+ words) — Deep dive into why this problem exists
4. **H2 heading** — "Step-by-Step: [Topic]" or "How to [Solve Problem]"
5. **Numbered list** (5–8 actionable steps) — Use type "list"
6. **H2 heading** — "Common Mistakes to Avoid"
7. **Bullet list** (4–6 mistakes) — Use type "list"
8. **H2 heading** — "How ResumeCraft Solves This"
9. **Paragraph** (150+ words) — Link to specific features with actual URLs
10. **H2 heading** — "Frequently Asked Questions"
11. **List** (3-4 items) — Each item should be formatted as: <strong>Q: [Question]</strong><br>A: [Answer]
12. **Closing CTA paragraph** (100+ words) — Direct call-to-action with link to https://airesumecraft.xyz/builder

### INTERNAL LINKS (include at least 3 throughout the content)
- Resume builder: https://airesumecraft.xyz/builder
- Blog: https://airesumecraft.xyz/blogs
- Features: https://airesumecraft.xyz/features

### IMAGE PROMPT REQUIREMENTS
Create a unique, topic-specific image prompt that reflects the blog's main theme using PHOTOREALISTIC, PROFESSIONAL PHOTOGRAPHY style. Include relevant visual metaphors (e.g., "modern office desk with laptop and resume", "professional workspace with documents", "clean minimalist desk setup", "business professional reviewing documents"). Use descriptors like: "professional photography", "high-quality", "modern", "clean aesthetic", "natural lighting", "shallow depth of field", "corporate environment". ABSOLUTELY NO TEXT, NO WORDS, NO TYPOGRAPHY, NO ILLUSTRATIONS, NO CARTOONS in the image. Focus on real-world professional scenarios.

### OUTPUT SCHEMA (JSON ONLY)
{
  "title": "string (SEO-optimised, max 70 chars, include primary keyword)",
  "excerpt": "string (keyword-led, max 155 chars, ends with clear value promise)",
  "slug": { "current": "string" },
  "imagePrompt": "string (photorealistic professional photography, modern corporate aesthetic, natural lighting, shallow depth of field. NO TEXT, NO WORDS, NO TYPOGRAPHY, NO ILLUSTRATIONS)",
  "seoKeywords": ["string", "string", "string"],
  "sections": [
    { "id": "sec_1", "type": "paragraph", "content": "string (200+ words)" },
    { "id": "sec_2", "type": "heading", "level": 2, "content": "string" },
    { "id": "sec_3", "type": "paragraph", "content": "string (200+ words)" },
    { "id": "sec_4", "type": "heading", "level": 2, "content": "string" },
    { "id": "sec_5", "type": "list", "items": ["string", "string", ...] },
    { "id": "sec_6", "type": "heading", "level": 2, "content": "string" },
    { "id": "sec_7", "type": "list", "items": ["string", "string", ...] },
    { "id": "sec_8", "type": "heading", "level": 2, "content": "string" },
    { "id": "sec_9", "type": "paragraph", "content": "string (150+ words with URLs)" },
    { "id": "sec_10", "type": "heading", "level": 2, "content": "string" },
    { "id": "sec_11", "type": "list", "items": ["<strong>Q: [Question]</strong><br>A: [Answer]", "<strong>Q: [Question]</strong><br>A: [Answer]", ...] },
    { "id": "sec_12", "type": "paragraph", "content": "string (100+ words, CTA with URL)" }
  ],
  "status": "published",
  "author": "${author}"
}

### STRICT CONSTRAINTS
- NO PRE-AMBLE. NO MARKDOWN. 
- TOTAL WORD COUNT MUST BE >= 1500 (aim for 1800–2000).
- You MUST include at least 8 sections, preferably 10–12.
- Direct the user to specific UI elements (e.g., "Click the 'Tailor' button," "View your Match Score").
- NEVER prepend numbers or bullets (like "1.", "2.", "Step 1:", "-") inside the string values of your \`list\` items. The UI automatically adds bullets.
- Include actual URLs in the content where you mention ResumeCraft features.
- The FAQ section is MANDATORY — do not skip it.
- FAQ sections MUST use type 'list' with each Q&A pair as a separate item. Use <strong> for questions and <br> to separate questions from answers.
- Return ONLY valid JSON matching the schema.

OUTPUT:
`;
};

const regenerateBlogPrompt = (currentTitle: string, currentContent: string, modificationPrompt: string) => {
  return `
### ROLE
You are a Lead Content Editor at ResumeCraft.xyz. Your task is to rewrite an existing blog draft according to specific editorial directions.

### TASK
Regenerate the provided blog draft below. Address the following editorial instruction explicitly: "${modificationPrompt}"

### ORIGINAL CONTENT SUMMARY (Reference)
TITLE: ${currentTitle}
SECTIONS PREVIEW: ${currentContent.slice(0, 1500)}...

### OUTPUT SCHEMA (JSON ONLY)
Provide the entire rewritten blog body. Do not abbreviate. Keep the content length substantial.
{
  "sections": [
    { "id": "sec_1", "type": "paragraph", "content": "string" },
    { "id": "sec_2", "type": "heading", "level": 2, "content": "string" },
    { "id": "sec_3", "type": "list", "items": ["string", "string"] },
    { "id": "sec_4", "type": "quote", "content": "string", "citation": "string" }
  ]
}

### SECTION TYPES ALLOWED
- "paragraph": Standard text
- "heading": level can be 2, 3, or 4
- "list": an array of simple string items (bullet points)
- "quote": a pull quote with optional citation

### STRICT CONSTRAINTS
- NO PRE-AMBLE. NO MARKDOWN. 
- Maintain a highly professional and informative tone.
- Return ONLY valid JSON matching the schema.

OUTPUT:
`;
};


const generateBlogTitlePlanPrompt = (input: {
  resumeContext: unknown
  existingTitles: string[]
  blockedTitles?: string[]
  appKeywords?: string[]
  crmKeywords?: string[]
  attempt?: number
}) => {
  const blocked = input.blockedTitles || [];
  const appKeywords = input.appKeywords || [];
  const crmKeywords = input.crmKeywords || [];
  const attempt = input.attempt || 1;
  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleString('en-US', { month: 'long' });
  const currentYear = currentDate.getFullYear();

  return `
### ROLE
You are a Senior Market Analyst and Search Intent Strategist specializing in the global labor market and recruitment trends.

### OBJECTIVE
Propose ONE high-authority, SEO-optimized blog title derived from the candidate's specific professional context. The title must address real-world hiring pain points or emerging industry standards.

### CURRENT CONTEXT
- **Date:** ${currentMonth} ${currentYear}
- **Iteration:** ${attempt}

### INPUT DATA
- **RESUME CONTEXT (JSON):** ${JSON.stringify(input.resumeContext)}
- **CONTENT HISTORY (DO NOT DUPLICATE):** ${JSON.stringify(input.existingTitles)}
- **REJECTED ITERATIONS:** ${JSON.stringify(blocked)}
- **APP KEYWORDS (must influence title/topic angle):** ${JSON.stringify(appKeywords)}
- **CRM KEYWORD SIGNALS (optional relevance hints):** ${JSON.stringify(crmKeywords)}

### STRATEGIC CONSTRAINTS
1. **Market Alignment:** The title must reflect current hiring behaviors (e.g., "Skills-based hiring," "ATS optimization," or "Role-specific impact metrics").
2. **Search Intent:** Prioritize "Informational" intent (how to solve a problem) or "Navigational" intent (how to reach a career milestone).
3. **No Hallucinations:** Do not reference non-existent certifications, tools, or niche trends that aren't verified in the current professional landscape.
4. **Length & Formatting:** 45-70 characters. Sentence case or Title Case. No clickbait superlatives (e.g., avoid "Shocking," "Secrets," or "Magic").
5. **Uniqueness First:** The title must be materially different from CONTENT HISTORY in structure and angle (not just swapping 1-2 words).
5. **Format Variety:** Alternate between these formats across attempts:
   - How-to: "How to [Achieve Goal] in ${currentYear}"
   - Listicle: "[Number] [Topic] Tips for [Audience]"
   - Question: "Why Do [Problem]? [Solution]"
   - Guide: "The Complete Guide to [Topic]"
   - Comparison: "[Option A] vs [Option B]: Which is Better?"

### STRICT OUTPUT RULE
Return ONLY a valid JSON object. Do not include markdown fences (\`\`\`json) or any introductory text.

{
  "title": "string (45-70 chars, SEO-optimised, includes primary keyword)",
  "targetKeywords": ["string", "string", "string"],
  "marketLogic": "string (A factual explanation of why this title aligns with current recruitment data or search trends)",
  "intentCategory": "Career Growth | Technical Skill | Optimization | Industry Insight"
}

OUTPUT:
`;
};

const polishBlogPrompt = (title: string, excerpt: string, sections: unknown[]) => {
  return `### ROLE
You are an expert blog editor, SEO strategist, and senior proofreader at ResumeCraft.xyz.

### TASK
Polish the provided blog draft for all four dimensions simultaneously:
1. **Spelling & Grammar** — Fix every spelling mistake and grammatical error without changing the author's voice.
2. **Readability** — Improve sentence flow, eliminate redundancy, and clarify any awkward phrasing. Target Flesch-Kincaid reading level: Grade 8–10 (accessible but professional).
3. **SEO Optimisation** — Naturally weave in high-value keywords relevant to: ATS optimisation, resume writing, job search strategy, career development, LinkedIn profile, cover letter, interview preparation, and personal branding. Do NOT keyword-stuff — embed them where they read naturally.
4. **Call-to-Action** — Ensure the final paragraph includes a clear, compelling CTA directing readers to https://airesumecraft.xyz/builder or another relevant ResumeCraft page.

### INPUT BLOG DRAFT
TITLE: ${title}
EXCERPT: ${excerpt}
SECTIONS (JSON):
${JSON.stringify(sections, null, 2)}

### OUTPUT SCHEMA (JSON ONLY)
{
  "title": "string — polished, SEO-optimised title (max 70 chars)",
  "excerpt": "string — polished excerpt that leads with a keyword and a clear value statement (max 155 chars)",
  "seoKeywords": ["string", "string", "string"],
  "sections": [
    { "id": "sec_1", "type": "paragraph", "content": "string" },
    { "id": "sec_2", "type": "heading", "level": 2, "content": "string" },
    { "id": "sec_3", "type": "list", "items": ["string", "string"] },
    { "id": "sec_4", "type": "quote", "content": "string", "citation": "string" }
  ]
}

### CONSTRAINTS
- Preserve every section's \`id\` and \`type\` exactly as given.
- Do NOT add, merge, or remove sections.
- Do NOT alter the fundamental message, facts, or examples.
- Ensure the last section (if it's a paragraph) includes a CTA with a URL to ResumeCraft.
- NO PRE-AMBLE. NO MARKDOWN FENCES. RETURN ONLY VALID JSON.

OUTPUT:
`;
};

export { resumeGenerationPrompt, resumeExtractionPrompt, analyzeResumeToJobFitPrompt, coverLetterPrompt, extractJobDetailsPrompt, smartRecommendationPrompt, generateSectionPrompt, generateSeoBlogPrompt, generateBlogTitlePlanPrompt, regenerateBlogPrompt, polishBlogPrompt, streamBlogHtmlPrompt, blogMetaPrompt, inspectIntentPrompt };

const blogMetaPrompt = (topic: string) => `You are a creative career content strategist at ResumeCraft.xyz.
Generate a highly distinct, unique, and engaging blog post title and excerpt for this topic: "${topic}"

Crucial Rule: Do not generate a generic or repetitive title. Explore a unique angle, advanced tip, or specific niche within the topic.

Return ONLY valid JSON — no markdown fences, no preamble:
{
  "title": "string — highly unique, SEO-optimised blog post title (max 80 chars)",
  "excerpt": "string — compelling 1-2 sentence meta description that leads with a keyword and a clear value statement (max 160 chars)"
}

OUTPUT:`;

const streamBlogHtmlPrompt = (title: string) => `You are a senior career strategist and technical writer for ResumeCraft.xyz.
Write a highly authoritative, engaging, and professional 1200+ word blog post titled: "${title}"

IMPORTANT STRUCTURAL & STYLISTIC RULES:
1. DO NOT write a plain "essay". The post MUST be highly structured, skimmable, and visually broken down.
2. Divide the content into logical sections using <h2> and <h3> headers. Use strong transitions between them.
3. Liberally incorporate structured data:
   - Use numbered steps (<ol><li>) for actionable "How-To" guides or chronologies.
   - Use bullet points (<ul><li>) for checklists, key takeaways, and symptom matching.
   - Use bold text (<strong>) sparingly to highlight critical phrases or metrics.
   - Use blockquotes (<blockquote>) for expert insights, call-outs, or important rules of thumb.
4. NEVER manually type numbers or bullets (e.g., "1. ", "- ") inside <li> tags. The HTML handles the numbering/bullets automatically.
5. Keep paragraphs short (3-4 sentences max) to ensure readability on mobile screens.
6. When creating FAQ sections, use a <ul> and wrap each Q&A in an <li>. Format: <li><strong>Q: [Question]</strong><br>A: [Answer]</li>

HTML OUTPUT RULES:
1. Output ONLY raw HTML fragments using strictly these tags: <h2>, <h3>, <p>, <ul>, <ol>, <li>, <blockquote>, <strong>, <em>
2. NO DOCTYPE, NO <html>, <head>, or <body> tags. NO class names, inline styles, or markdown (do not use #, **, etc).
3. Start writing immediately — zero preamble, no "Here is your article" intro.
4. Focus content on data-driven career advice, ATS optimization, and recruiting psychology. 
5. Integrate ResumeCraft.xyz features naturally where it logically aids the reader's strategy (e.g. using the AI Resume Tailor to align with job descriptions).
6. Conclude with an impactful final paragraph and a distinct call-to-action utilizing ResumeCraft.xyz.

Begin now:
`;

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

