import { GoogleGenerativeAI } from "@google/generative-ai";
import { ResumeData } from "@/types/types";

const api = process.env.GEMINI_API_KEY;

if (!api) {
  throw new Error('GEMINI_API_KEY environment variable is not set. Please add it to your .env.local file.');
}

const genAI = new GoogleGenerativeAI(api);
// Central model instances
// analyzeModel: faster, smaller output
const analyzeModel = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  generationConfig: {
    temperature: 0.3,
    topP: 0.9,
    maxOutputTokens: 768,
  },
});
// resumeModel: allow a bit more room for full structured resume JSON
const resumeModel = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  generationConfig: {
    temperature: 0.35, // slightly higher for richer bullets
    topP: 0.9,
    maxOutputTokens: 2048,
  },
});

/**
 * Robustly extract the first JSON object from a model response.
 * Strips code fences, trims noise, and throws on parse errors.
 */
function extractFirstJsonObject(raw?: string) {
  if (!raw) throw new Error("Empty AI response");
  const cleaned = raw
    .replace(/```(json)?/gi, "")
    // Remove any leading noise before the first '{'
    .replace(/^[^{]*{/, "{")
    .trim();
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) {
    throw new Error("No JSON object delimiters found");
  }
  const slice = cleaned.slice(first, last + 1);
  return robustParseJson(slice);
}

// Attempt to repair common minor JSON issues (trailing commas, dangling quotes)
function robustParseJson(str: string) {
  const attempts: string[] = [];
  const record = (s: string) => attempts.push(s);
  let current = str;
  try {
    return JSON.parse(current);
  } catch (e) {
    record("initial: " + (e as Error).message);
  }
  // Remove trailing commas before } or ]
  current = current.replace(/,(\s*[}\]])/g, "$1");
  try {
    return JSON.parse(current);
  } catch (e) {
    record("after trailing comma removal: " + (e as Error).message);
  }
  // Remove any control characters that may slip in
  current = current.replace(/[\u0000-\u001F]+/g, "");
  try {
    return JSON.parse(current);
  } catch (e) {
    record("after control char strip: " + (e as Error).message);
  }
  // Heuristic: balance braces/brackets if obviously short by appending
  const openBraces = (current.match(/{/g) || []).length;
  const closeBraces = (current.match(/}/g) || []).length;
  const openBrackets = (current.match(/\[/g) || []).length;
  const closeBrackets = (current.match(/]/g) || []).length;
  if (openBraces > closeBraces) current += "}".repeat(openBraces - closeBraces);
  if (openBrackets > closeBrackets) current += "]".repeat(openBrackets - closeBrackets);
  try {
    return JSON.parse(current);
  } catch (e) {
    record("after balance attempt: " + (e as Error).message);
  }
  // If still failing, throw aggregated diagnostics
  throw new Error(
    "Failed to parse AI JSON after repairs. Diagnostics: " + attempts.join(" | ")
  );
}

/** Basic shape guard (non-exhaustive) to keep downstream flow stable */
function coerceArrayStrings(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v) => typeof v === "string");
  return [];
}

// ---- ANALYZE RESUME ----

export async function analyseResumeToJobDescription(
  userdata?: ResumeData,
  jobDescription?: string
) {
  // Compact the resume to reduce tokens (remove undefined / large arrays if empty)
  const compactResume = userdata
    ? {
      ...userdata,
      experiences: userdata.experiences?.slice(0, 8), // cap to avoid runaway tokens
      educations: userdata.educations?.slice(0, 5),
      certificates: userdata.certificates?.slice(0, 10),
      skills: userdata.skills?.slice(0, 20),
    }
    : {};

  const prompt = `SYSTEM: You are an expert technical recruiter. Return only strict JSON.
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

JOB_DESCRIPTION_TEXT:\n${(jobDescription || "").slice(0, 6000)}

OUTPUT:`;

  try {
    const result = await analyzeModel.generateContent(prompt);
    const response = await result.response;
    const raw = (await response.text())?.trim();
    const parsed = extractFirstJsonObject(raw);
    // Light coercion to maintain shape stability
    if (parsed) {
      parsed.suggestions = coerceArrayStrings(parsed.suggestions);
      parsed.missingKeywords = coerceArrayStrings(parsed.missingKeywords);
      parsed.strengths = coerceArrayStrings(parsed.strengths);
      if (typeof parsed.matchingPercentage !== "number") {
        // Fallback simple heuristic if model drifted
        parsed.matchingPercentage = 0;
      } else {
        parsed.matchingPercentage = Math.max(
          0,
          Math.min(100, Math.round(parsed.matchingPercentage))
        );
      }
    }
    return parsed;
  } catch (error) {
    console.error("Error analyzing resume:", error);
    throw new Error("Failed to analyze resume");
  }
}

export async function GenerateResume(
  userdata?: ResumeData,
  data?: string,
  jobDescription?: string
) {
  // Prefer structured JSON over verbose markdown to reduce hallucinations.
  const sourceResume = userdata
    ? JSON.stringify(userdata)
    : JSON.stringify({ raw: data });

  const prompt = `SYSTEM: You are a senior resume writer. Produce ONLY valid JSON for a tailored resume.
SCHEMA:
{
  "profile": {"fullname": string, "email": string, "phone": string, "location": string, "links": [{"type": string, "url": string}], "summary": string },
  "experiences": [{"title": string, "company": string, "location": string, "startDate": string, "endDate": string, "current": boolean, "responsibilities": string[]}],
  "educations": [{"degree": string, "university": string, "location": string, "startDate": string, "endDate": string, "current": boolean}],
  "skills": [{"type": string, "skills": string[]}],
  "certificates": [{"title": string, "issued_by": string, "year": string}]
}
RULES:
- Dates format: Mon-YYYY (e.g. Jan-2024)
- summary max ~80 words.
- Each experience: >=5 strong quantified bullet responsibilities starting with a verb.
- Group skills into meaningful categories; at least 10 total skills across groups.
- Derive link type from URL host (e.g. github.com => "GitHub").
- If job description missing, still return valid JSON.
- No extra commentary, ONLY JSON.

SOURCE_RESUME_JSON:
${sourceResume}

JOB_DESCRIPTION_TEXT:\n${(jobDescription || "").slice(0, 6000)}

OUTPUT:`;

  try {
    const result = await resumeModel.generateContent(prompt);
    const response = await result.response;
    const raw = await response.text();
    const parsed = extractFirstJsonObject(raw);
    return parsed;
  } catch (error) {
    console.error("Error generating resume:", error);
    throw new Error("Failed to generate resume");
  }
}


export async function extractUrlData(url: string) {
  const prompt = `SYSTEM: Extract concise metadata for the URL. Return ONLY JSON.
SCHEMA: {"title": string, "description": string, "image": string, "keywords": string[]}
RULES:
- description <= 30 words.
- keywords: unique lowercase phrases (max 12) ordered by relevance.
- If image unknown use empty string.
- No commentary.
URL: ${url}
OUTPUT:`;
  try {
    const result = await analyzeModel.generateContent(prompt);
    const response = await result.response;
    const raw = await response.text();
    return extractFirstJsonObject(raw);
  } catch (error) {
    console.error("Error extracting URL data:", error);
    throw new Error("Failed to extract URL data");
  }
}