/**
 * AI Response Schemas
 * 
 * This file contains JSON Schema definitions for structured AI outputs.
 * Each schema corresponds to a specific AI service method and ensures
 * type-safe, predictable responses from AI models.
 */

// ============================================================================
// Resume Generation Schema
// ============================================================================
export const resumeGenerationSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    profile: {
      type: 'object',
      additionalProperties: false,
      properties: {
        fullname: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' },
        location: { type: 'string' },
        links: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              type: { type: 'string' },
              url: { type: 'string' },
            },
            required: ['type', 'url'],
          },
        },
        summary: { type: 'string' },
      },
      required: ['fullname', 'email', 'phone', 'location', 'links', 'summary'],
    },
    experiences: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string' },
          company: { type: 'string' },
          location: { type: 'string' },
          startDate: { type: 'string' },
          endDate: { type: 'string' },
          current: { type: 'boolean' },
          responsibilities: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        required: ['title', 'company', 'location', 'startDate', 'responsibilities'],
      },
    },
    educations: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          degree: { type: 'string' },
          university: { type: 'string' },
          location: { type: 'string' },
          startDate: { type: 'string' },
          endDate: { type: 'string' },
          current: { type: 'boolean' },
        },
        required: ['degree', 'university', 'location', 'startDate'],
      },
    },
    skills: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          type: { type: 'string' },
          skills: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        required: ['type', 'skills'],
      },
    },
    customSections: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string' },
          subsections: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                title: { type: 'string' },
                content: { type: 'string' },
                date: { type: 'string' },
              },
              required: ['title', 'content'],
            },
          },
        },
        required: ['title', 'subsections'],
      },
    },
  },
  required: ['profile', 'experiences', 'educations', 'skills', 'customSections'],
};

// ============================================================================
// Resume Analysis Schema
// ============================================================================
export const resumeAnalysisSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    jobDescription: { type: 'string' },
    role: { type: 'string' },
    matchingPercentage: { type: 'number', minimum: 0, maximum: 100 },
    description: { type: 'string' },
    suggestions: {
      type: 'array',
      items: { type: 'string' },
      minItems: 1,
      maxItems: 5,
    },
    missingKeywords: {
      type: 'array',
      items: { type: 'string' },
    },
    strengths: {
      type: 'array',
      items: { type: 'string' },
    },
  },
  required: ['jobDescription', 'role', 'matchingPercentage', 'description', 'suggestions', 'missingKeywords', 'strengths'],
};

// ============================================================================
// Cover Letter Schema
// ============================================================================
export const coverLetterSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    salutation: { type: 'string' },
    coverLetter: { type: 'string' },
    closing: { type: 'string' },
    keyParagraphs: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          purpose: { type: 'string', enum: ['opening', 'fit', 'impact', 'closing'] },
          text: { type: 'string' },
        },
        required: ['purpose', 'text'],
      },
      minItems: 3,
    },
    highlights: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string' },
          text: { type: 'string' },
        },
        required: ['title', 'text'],
      },
    },
    tone: { type: 'string' },
    wordCount: { type: 'number' },
  },
  required: ['salutation', 'coverLetter', 'closing', 'keyParagraphs', 'highlights', 'tone', 'wordCount'],
};

// ============================================================================
// Job Extraction Schema
// ============================================================================
export const jobExtractionSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    title: { type: 'string' },
    company: { type: 'string' },
    location: { type: 'string' },
    domain: { type: 'string' },
    description: { type: 'string' },
  },
  required: ['title', 'company', 'location', 'domain', 'description'],
};

// ============================================================================
// Smart Recommendations Schema
// ============================================================================
export const smartRecommendationsSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    recommendations: {
      type: 'array',
      items: { type: 'string' },
      minItems: 5,
      maxItems: 10,
    },
  },
  required: ['recommendations'],
};

// ============================================================================
// Intent Inspection Schema
// ============================================================================
export const intentInspectionSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    tasks: {
      type: 'array',
      items: { type: 'string' },
    },
    notes: { type: 'string' },
    recommendations: {
      type: 'array',
      items: { type: 'string' },
    },
  },
  required: ['tasks', 'notes', 'recommendations'],
};

// ============================================================================
// URL Metadata Extraction Schema
// ============================================================================
export const urlMetadataSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    title: { type: 'string' },
    description: { type: 'string' },
    image: { type: 'string' },
    keywords: {
      type: 'array',
      items: { type: 'string' },
      maxItems: 12,
    },
  },
  required: ['title', 'description', 'image', 'keywords'],
};

// ============================================================================
// Blog Generation Schemas
// ============================================================================

/**
 * Schema for blog section (union type)
 */
export const blogSectionSchema = {
  oneOf: [
    {
      type: 'object',
      additionalProperties: false,
      properties: {
        id: { type: 'string' },
        type: { type: 'string', enum: ['paragraph'] },
        content: { type: 'string', minLength: 1 },
      },
      required: ['type', 'content'],
    },
    {
      type: 'object',
      additionalProperties: false,
      properties: {
        id: { type: 'string' },
        type: { type: 'string', enum: ['heading'] },
        level: { type: 'number', enum: [2, 3, 4] },
        content: { type: 'string', minLength: 1 },
      },
      required: ['type', 'level', 'content'],
    },
    {
      type: 'object',
      additionalProperties: false,
      properties: {
        id: { type: 'string' },
        type: { type: 'string', enum: ['list'] },
        items: {
          type: 'array',
          items: { type: 'string', minLength: 1 },
          minItems: 1,
        },
      },
      required: ['type', 'items'],
    },
    {
      type: 'object',
      additionalProperties: false,
      properties: {
        id: { type: 'string' },
        type: { type: 'string', enum: ['quote'] },
        content: { type: 'string', minLength: 1 },
        citation: { type: 'string' },
      },
      required: ['type', 'content'],
    },
  ],
};

/**
 * Schema for complete blog generation
 */
export const blogGenerationSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    title: { type: 'string', minLength: 3, maxLength: 180 },
    excerpt: { type: 'string', minLength: 10 },
    slug: {
      type: 'object',
      properties: {
        current: { type: 'string', minLength: 2, maxLength: 240 },
      },
    },
    imagePrompt: { type: 'string', minLength: 5 },
    seoKeywords: {
      type: 'array',
      items: { type: 'string' },
    },
    sections: {
      type: 'array',
      items: blogSectionSchema,
      minItems: 1,
    },
    status: { type: 'string', enum: ['draft', 'published', 'archived'] },
    author: { type: 'string', minLength: 2, maxLength: 120 },
  },
  required: ['title', 'excerpt', 'imagePrompt', 'sections'],
};

/**
 * Schema for blog title planning
 */
export const blogTitlePlanSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    title: { type: 'string', minLength: 8, maxLength: 180 },
    targetKeywords: {
      type: 'array',
      items: { type: 'string' },
    },
    marketLogic: { type: 'string' },
    intentCategory: { type: 'string' },
  },
  required: ['title'],
};

/**
 * Schema for blog meta (title + excerpt)
 */
export const blogMetaSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    title: { type: 'string', minLength: 3, maxLength: 80 },
    excerpt: { type: 'string', minLength: 10, maxLength: 160 },
  },
  required: ['title', 'excerpt'],
};

/**
 * Schema for blog regeneration (sections only)
 */
export const blogRegenerationSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    sections: {
      type: 'array',
      items: blogSectionSchema,
      minItems: 1,
    },
  },
  required: ['sections'],
};

/**
 * Schema for blog polishing (complete output)
 */
export const blogPolishSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    title: { type: 'string', minLength: 3, maxLength: 70 },
    excerpt: { type: 'string', minLength: 10, maxLength: 155 },
    seoKeywords: {
      type: 'array',
      items: { type: 'string' },
    },
    sections: {
      type: 'array',
      items: blogSectionSchema,
      minItems: 1,
    },
  },
  required: ['title', 'excerpt', 'sections'],
};

// ============================================================================
// Type Guards for Runtime Validation
// ============================================================================

export function isValidResumeData(data: unknown): data is {
  profile: any;
  experiences: any[];
  educations: any[];
  skills: any[];
  customSections: any[];
} {
  if (!data || typeof data !== 'object') return false;
  const d = data as any;
  return (
    d.profile &&
    Array.isArray(d.experiences) &&
    Array.isArray(d.educations) &&
    Array.isArray(d.skills) &&
    Array.isArray(d.customSections)
  );
}

export function isValidAnalysisResult(data: unknown): data is {
  jobDescription: string;
  role: string;
  matchingPercentage: number;
  description: string;
  suggestions: string[];
  missingKeywords: string[];
  strengths: string[];
} {
  if (!data || typeof data !== 'object') return false;
  const d = data as any;
  return (
    typeof d.jobDescription === 'string' &&
    typeof d.role === 'string' &&
    typeof d.matchingPercentage === 'number' &&
    typeof d.description === 'string' &&
    Array.isArray(d.suggestions) &&
    Array.isArray(d.missingKeywords) &&
    Array.isArray(d.strengths)
  );
}

export function isValidCoverLetter(data: unknown): data is {
  salutation: string;
  coverLetter: string;
  closing: string;
  keyParagraphs: any[];
  highlights: any[];
  tone: string;
  wordCount: number;
} {
  if (!data || typeof data !== 'object') return false;
  const d = data as any;
  return (
    typeof d.salutation === 'string' &&
    typeof d.coverLetter === 'string' &&
    typeof d.closing === 'string' &&
    Array.isArray(d.keyParagraphs) &&
    Array.isArray(d.highlights) &&
    typeof d.tone === 'string' &&
    typeof d.wordCount === 'number'
  );
}
