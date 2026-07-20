# Text-Based Resume Extractor & Fallback System

## Overview

A robust fallback system that extracts resume data from raw text when AI services fail. This ensures the app continues to function even if OpenRouter API is down, rate-limited, or misconfigured.

## Architecture

### 1. **Text Resume Extractor** (`services/textResumeExtractor.ts`)

Pattern-based extractor that recognizes resume sections and extracts structured data without AI.

#### Features:
- **Section Recognition**: Uses synonym-based pattern matching to find resume sections
  - Summary: `summary`, `professional summary`, `objective`, `about me`, `profile`
  - Skills: `skills`, `technical skills`, `competencies`, `expertise`, `qualifications`, `qualities`
  - Experience: `experience`, `work history`, `employment`, `career history`
  - Education: `education`, `academic`, `degree`, `university`, `college`

- **Profile Extraction**:
  - Extracts name, email, phone, location
  - Parses URLs and links (LinkedIn, GitHub, portfolio, etc.)
  - Extracts professional summary

- **Skills Extraction**:
  - Groups skills by type (Technical, Programming, Soft skills, etc.)
  - Removes duplicates
  - Handles comma or bullet-separated lists

- **Experience Parsing**:
  - Extracts job title, company, location
  - Parses date ranges (flexible formats: "Jan 2020", "01/2020", "January 2020", etc.)
  - Extracts bullet points as responsibilities
  - Detects "current" positions

- **Education Parsing**:
  - Extracts degree type (B.S., M.S., Ph.D., Bachelor, Master, etc.)
  - Extracts field of study
  - Parses university/college name
  - Extracts dates and location

- **Custom Sections**:
  - Captures any non-standard sections (Certifications, Awards, Publications, etc.)

#### Key Functions:

```typescript
// Main extractor
extractResumeFromText(
  text: string,
  userId: string,
  title?: string
): ResumeData

// Clean raw PDF/text input
cleanResumeText(rawText: string): string

// Individual extractors (used internally but can be called directly)
extractProfile(text: string): Partial<Profile>
extractSkills(text: string): skills[]
extractExperiences(text: string): Experience[]
extractEducations(text: string): Education[]
extractCustomSections(text: string, foundSections: Map): CustomSectionData[]
```

### 2. **Enhanced AIService with Fallback** (`services/aiServices.ts`)

#### Resume Generation with Fallback:

```
generateResume()
  ↓
Try AI extraction
  ↓ (fails)
Fallback to text extraction
  ↓ (fails)
Return partial structured data
```

**Flow:**
1. Attempts AI-powered resume generation with OpenRouter
2. If AI fails → tries text-based extractor
3. If text extraction fails → returns partial data (if available)
4. All errors are logged and monitored

```typescript
static async generateResume(
    userdata?: ResumeData,
    data?: string,
    jobDescription?: string,
    customPrompt?: string
): Promise<ResumeData>
```

#### Resume Analysis with Fallback:

```
analyzeResume()
  ↓
Try AI analysis
  ↓ (fails)
Fallback to keyword-based analysis
```

**Keyword-Based Fallback Analysis:**
- Extracts keywords from job description
- Matches against resume text
- Calculates matching percentage
- Identifies missing keywords
- Generates basic suggestions

```typescript
static analyzeResume(
    resumeData: ResumeData,
    jobDescription: string
): Promise<AnalysisResult>

// Private fallback method
private static analyzeResumeBasic(
    resumeData: ResumeData,
    jobDescription: string
): AnalysisResult
```

## Usage Examples

### Direct Extraction

```typescript
import { extractResumeFromText, cleanResumeText } from '@/services/textResumeExtractor';

const resumeText = `
John Smith
john@email.com | (555) 123-4567 | New York, NY

Professional Summary
Experienced developer...

Technical Skills
Languages: JavaScript, Python, TypeScript
...
`;

const cleaned = cleanResumeText(resumeText);
const resume = extractResumeFromText(cleaned, 'user-123', 'My Resume');
```

### Via API (Automatic Fallback)

When using the API endpoints, fallback is automatic:

```typescript
// This automatically falls back to text extraction if AI fails
const resume = await AIService.generateResume(undefined, extractedText);

// This automatically falls back to keyword analysis if AI fails
const analysis = await AIService.analyzeResume(resume, jobDescription);
```

## Benefits

✅ **Resilience**: App works even if OpenRouter is down or rate-limited
✅ **Cost Savings**: Text extraction is free (no API calls)
✅ **Speed**: Text extraction is faster than AI calls
✅ **Graceful Degradation**: User gets results, even if lower quality
✅ **No Breaking Changes**: Existing code works without modifications

## Limitations

⚠️ **Text-Based Extractor:**
- May miss complex descriptions
- Can't infer context or relationships
- Less accurate than AI for ambiguous content
- Limited natural language understanding

⚠️ **Keyword-Based Analysis:**
- Simple percentage matching (not semantic)
- Doesn't understand context
- May miss related keywords
- No nuanced evaluation

## Error Handling

All errors are logged with context:

```
[WARN] Falling back to text-based resume extraction...
[INFO] Resume extracted successfully using fallback
[ERROR] Text extraction fallback also failed: [error message]
```

Monitor logs in Vercel:
1. Go to Deployment → Functions/Logs
2. Search for: `"fallback"` to see when fallback is triggered
3. This indicates AI service issues

## Configuration

No configuration needed. Fallback is automatic.

To disable fallback (not recommended):
- Remove the fallback try-catch block in AIService methods
- Note: This would cause requests to fail entirely when AI service is down

## Testing

See `services/textResumeExtractor.test.ts` for example usage:

```bash
# Run tests
npm test -- textResumeExtractor.test.ts
```

## Future Improvements

- [ ] ML-based keyword extraction for better context
- [ ] Support for more resume formats (LinkedIn, Indeed, etc.)
- [ ] NLP-based entity recognition for better extraction
- [ ] Multi-language support
- [ ] Resume validation rules (required fields, format checks)
