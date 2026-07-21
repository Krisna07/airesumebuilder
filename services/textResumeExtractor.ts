/**
 * Text-to-Resume Extractor
 * Fallback utility when AI service fails
 * Extracts resume data from raw text using pattern matching and heuristics
 */

import { ResumeData, Profile, Experience, Education, skills, CustomSectionData, CustomSubsection } from '@/types/types';

/**
 * Section name synonyms for robust matching
 */
const SECTION_PATTERNS = {
  // Profile/Summary section
  summary: {
    keywords: ['summary', 'professional summary', 'objective', 'career objective', 'about', 'about me', 'profile'],
    priority: 1,
  },
  // Skills section
  skills: {
    keywords: [
      'skills',
      'technical skills',
      'core competencies',
      'competencies',
      'expertise',
      'qualifications',
      'qualities',
      'proficiencies',
      'languages',
      'tools',
      'technologies',
      'technical expertise',
    ],
    priority: 2,
  },
  // Experience section
  experience: {
    keywords: [
      'experience',
      'work experience',
      'professional experience',
      'employment',
      'employment history',
      'career history',
      'work history',
      'positions held',
    ],
    priority: 3,
  },
  // Education section
  education: {
    keywords: [
      'education',
      'educational background',
      'academic',
      'qualifications',
      'degree',
      'university',
      'college',
      'school',
    ],
    priority: 4,
  },
};

const FORM_NOISE_PATTERNS: RegExp[] = [
    /let'?s\s+start\s+with\s+your\s+details/i,
    /provide\s+essential\s+information\s+to\s+proceed/i,
    /^regenerate$/i,
    /^save\s+profile$/i,
    /^full\s*name\*?$/i,
    /^email\*?$/i,
    /^phone\*?$/i,
    /^location\*?$/i,
    /^add\s+link$/i,
    /^summary\*?$/i,
];

function isLikelyFormNoiseLine(line: string): boolean {
    const cleaned = line.replace(/^#+\s*/, '').trim();
    if (!cleaned) return true;
    return FORM_NOISE_PATTERNS.some((pattern) => pattern.test(cleaned));
}

function removeNoiseLines(lines: string[]): string[] {
    return lines.filter((line) => !isLikelyFormNoiseLine(line));
}

/**
 * Extract section headers from text
 */
function findSections(text: string): Map<string, { start: number; end: number; type: string }> {
  const sections = new Map<string, { start: number; end: number; type: string }>();
  const lines = text.split('\n');
  let currentIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim().toLowerCase();
    if (line.length === 0) continue;

    // Check if this line matches any section header
    for (const [sectionType, patterns] of Object.entries(SECTION_PATTERNS)) {
      const matches = patterns.keywords.some((keyword) => {
        const regex = new RegExp(`^${keyword}s?\\s*:?\\s*$|^${keyword}s?\\s*$`);
        return regex.test(line);
      });

      if (matches) {
        // Find start position in full text
        const start = text.indexOf(lines[i]);
        sections.set(sectionType, { start, end: text.length, type: sectionType });
      }
    }

    currentIndex += lines[i].length + 1;
  }

  // Calculate end positions based on next section
  const sortedSections = Array.from(sections.entries())
    .sort((a, b) => a[1].start - b[1].start);

  for (let i = 0; i < sortedSections.length - 1; i++) {
    const [key, section] = sortedSections[i];
    section.end = sortedSections[i + 1][1].start;
  }

  return sections;
}

/**
 * Extract text for a specific section
 */
function extractSectionText(text: string, start: number, end: number): string {
  return text.substring(start, end).trim();
}

/**
 * Parse profile/header information
 */
function extractProfile(text: string): Partial<Profile> {
  const profile: Partial<Profile> = {
    fullname: '',
    email: '',
    phone: '',
    location: '',
    links: [],
    summary: '',
  };

  // Extract name (usually first substantial line)
    const lines = removeNoiseLines(text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0));
  if (lines.length > 0) {
    const firstLine = lines[0].trim();
    // Skip if it looks like a section header
      if (
          !SECTION_PATTERNS.summary.keywords.some((k) => firstLine.toLowerCase().includes(k)) &&
          !isLikelyFormNoiseLine(firstLine)
      ) {
      profile.fullname = firstLine.substring(0, 100); // Cap at 100 chars
    }
  }

  // Extract email
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = text.match(emailRegex);
  if (emails && emails.length > 0) {
    profile.email = emails[0];
  }

  // Extract phone
  const phoneRegex = /(?:\+\d{1,3}[-.\s]?)?\(?[\d]{3}\)?[-.\s]?[\d]{3}[-.\s]?[\d]{4}/g;
  const phones = text.match(phoneRegex);
  if (phones && phones.length > 0) {
    profile.phone = phones[0];
  }

  // Extract location (look for city, state/country patterns)
  const locationRegex = /(?:location|city|based in|based at|located in)[\s:]*([A-Za-z\s,]+?)(?:\n|,|$)/i;
  const locationMatch = text.match(locationRegex);
  if (locationMatch) {
    profile.location = locationMatch[1].trim().substring(0, 100);
  }

  // Extract URLs/links
  const urlRegex = /https?:\/\/[^\s]+|www\.[^\s]+/g;
  const urls = text.match(urlRegex);
  if (urls) {
    profile.links = urls.map((url) => ({
      type: extractLinkType(url),
      url: url,
    }));
  }

  return profile;
}

/**
 * Detect link type from URL
 */
function extractLinkType(url: string): string {
  if (url.includes('linkedin')) return 'LinkedIn';
  if (url.includes('github')) return 'GitHub';
  if (url.includes('portfolio') || url.includes('website')) return 'Portfolio';
  if (url.includes('twitter') || url.includes('x.com')) return 'Twitter';
  return 'Website';
}

/**
 * Extract skills with type categorization
 */
function extractSkills(text: string): skills[] {
  const skillsArray: skills[] = [];
    const lines = removeNoiseLines(text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0));

  let currentType = 'Technical';
  const skillsByType: { [key: string]: string[] } = {};

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect skill type from keywords
    if (/^(technical|programming|languages|tools|soft|interpersonal|leadership)/i.test(trimmed)) {
      const match = trimmed.match(/^([^:]+)s?:/i);
      if (match) {
        currentType = match[1].trim();
      }
    }

    // Skip section headers and empty lines
    if (
      trimmed.length < 3 ||
      SECTION_PATTERNS.skills.keywords.some((k) => trimmed.toLowerCase() === k) ||
      trimmed.endsWith(':')
    ) {
      continue;
    }

    // Parse skills (comma or bullet separated)
    const skillTexts = trimmed.split(/[•\-\n]|,\s*/);
    const skills = skillTexts
      .map((s) => s.trim())
      .filter(
        (s) =>
          s.length > 0 &&
          s.length < 50 &&
          !s.match(/^[0-9]+\./) &&
          !/^\d+\s*years?/i.test(s),
      );

    if (skills.length > 0) {
      if (!skillsByType[currentType]) {
        skillsByType[currentType] = [];
      }
      skillsByType[currentType].push(...skills);
    }
  }

  // Convert to skills array format
  for (const [type, skillList] of Object.entries(skillsByType)) {
    if (skillList.length > 0) {
      skillsArray.push({
        type: type,
        skills: Array.from(new Set(skillList)), // Remove duplicates
      });
    }
  }

  // Default if no skills found
  if (skillsArray.length === 0) {
    skillsArray.push({ type: 'Skills', skills: [] });
  }

  return skillsArray;
}

/**
 * Parse dates in various formats
 */
function parseDate(dateStr: string): string {
  if (!dateStr) return '';

  const trimmed = dateStr.trim().toLowerCase();

  // Match "Month Year" or "MM/YYYY" or "MM-YYYY"
  const monthYearMatch = trimmed.match(
    /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december)\s*\.?\s*(\d{4})/i,
  );
  if (monthYearMatch) {
    return `${monthYearMatch[0].replace(/\./g, '')} ${monthYearMatch[1]}`;
  }

  // Match "MM/YYYY" format
  const slashDateMatch = trimmed.match(/(\d{1,2})\/(\d{4})/);
  if (slashDateMatch) {
    return `${slashDateMatch[1]}/${slashDateMatch[2]}`;
  }

  // Match year only
  const yearMatch = trimmed.match(/\d{4}/);
  if (yearMatch) {
    return yearMatch[0];
  }

  return trimmed;
}

/**
 * Extract experiences
 */
function extractExperiences(text: string): Experience[] {
  const experiences: Experience[] = [];
    const sanitizedText = removeNoiseLines(text.split('\n')).join('\n');
    const entries = sanitizedText.split(/(?=\n(?:[A-Z]|[0-9]))/); // Split on capitalized lines

  for (const entry of entries) {
    if (entry.trim().length < 20) continue;

    const lines = entry.split('\n').filter((l) => l.trim().length > 0);
    if (lines.length < 2) continue;

    const exp: Experience = {
      title: '',
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      responsibilities: [],
    };

    // First line usually contains title and company
    const firstLine = lines[0].trim();
    const titleCompanyMatch = firstLine.match(/^([^–\-—]*?)\s*(?:–|—|-|at|,|\|)\s*(.+?)(?:\s*[,|].*)?$/);

    if (titleCompanyMatch) {
      exp.title = titleCompanyMatch[1].trim().substring(0, 100);
      exp.company = titleCompanyMatch[2].trim().substring(0, 100);
    } else {
      exp.title = firstLine.substring(0, 100);
    }

    // Extract dates
    const fullText = entry.toLowerCase();
    const dateRangeRegex = /([\w\s]+\d{4})\s*[-–—]\s*(present|current|[\w\s]*\d{4})/i;
    const dateMatch = fullText.match(dateRangeRegex);

    if (dateMatch) {
      exp.startDate = parseDate(dateMatch[1]);
      exp.endDate = parseDate(dateMatch[2]);
      exp.current = /present|current|ongoing/i.test(dateMatch[2]);
    }

    // Extract location (if present)
    const locationRegex = /(?:location|based in)\s*:?\s*([A-Za-z\s,]+?)(?:\n|$)/i;
    const locMatch = entry.match(locationRegex);
    if (locMatch) {
      exp.location = locMatch[1].trim().substring(0, 100);
    }

    // Extract responsibilities (bullet points)
    const bulletRegex = /^[\s]*[•\-*]\s+(.+?)$/gm;
    const responsibilities = [];
    let bulletMatch;
    while ((bulletMatch = bulletRegex.exec(entry)) !== null) {
      const responsibility = bulletMatch[1].trim();
      if (responsibility.length < 200 && !responsibility.match(/^\d+\s*years?/i)) {
        responsibilities.push(responsibility);
      }
    }

    if (responsibilities.length > 0) {
      exp.responsibilities = responsibilities.slice(0, 6); // Cap at 6 responsibilities
    }

    // Only add if we have a title or company
    if (exp.title || exp.company) {
      experiences.push(exp);
    }
  }

  return experiences;
}

/**
 * Extract education
 */
function extractEducations(text: string): Education[] {
  const educations: Education[] = [];
    const sanitizedText = removeNoiseLines(text.split('\n')).join('\n');
    const entries = sanitizedText.split(/(?=\n(?:[A-Z]|[0-9]))/);

  for (const entry of entries) {
    if (entry.trim().length < 15) continue;

    const lines = entry.split('\n').filter((l) => l.trim().length > 0);
    if (lines.length === 0) continue;

    const edu: Education = {
      degree: '',
      university: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
    };

    // First line usually has degree and university
    const firstLine = lines[0].trim();
    const degreeMatch = firstLine.match(
      /^(?:B\.?S\.?|B\.?A\.?|M\.?S\.?|M\.?B\.?A\.?|M\.?A\.?|Ph\.?D\.?|Associate|Diploma|Certificate|Bachelor|Master|Doctor|Advanced|Postgraduate)\s+(?:in\s+)?([^–\-—]*?)(?:\s*[–\-—]\s*(.+))?/i,
    );

    if (degreeMatch) {
      edu.degree = `${degreeMatch[0].split(/\s(?:in|at)/)[0].trim()}`;
      if (degreeMatch[1]) {
        edu.degree += ` in ${degreeMatch[1].trim()}`;
      }
      if (degreeMatch[2]) {
        edu.university = degreeMatch[2].trim().substring(0, 100);
      }
    } else {
      edu.degree = firstLine.substring(0, 100);
    }

    // Extract university if not in first line
    if (!edu.university && lines.length > 1) {
      edu.university = lines[1].trim().substring(0, 100);
    }

    // Extract dates
    const dateRegex = /([\w\s]+\d{4})\s*[-–—]\s*(present|current|[\w\s]*\d{4})/i;
    const dateMatch = entry.match(dateRegex);
    if (dateMatch) {
      edu.startDate = parseDate(dateMatch[1]);
      edu.endDate = parseDate(dateMatch[2]);
      edu.current = /present|current|ongoing/i.test(dateMatch[2]);
    }

    // Extract location
    const locationRegex = /(?:location|city|campus)\s*:?\s*([A-Za-z\s,]+?)(?:\n|$)/i;
    const locMatch = entry.match(locationRegex);
    if (locMatch) {
      edu.location = locMatch[1].trim().substring(0, 100);
    }

    // Only add if we have a degree
    if (edu.degree) {
      educations.push(edu);
    }
  }

  return educations;
}

/**
 * Extract custom sections (anything that doesn't fit the standard categories)
 */
function extractCustomSections(text: string, foundSections: Map<string, any>): CustomSectionData[] {
  const customSections: CustomSectionData[] = [];
  const standardSectionTypes = new Set(foundSections.keys());

  // Find all headers that aren't standard sections
    const lines = removeNoiseLines(text.split('\n'));
  let currentCustomSection: CustomSectionData | null = null;
  let subsectionContent = '';

  for (const line of lines) {
    const trimmed = line.trim();

    // Check if this is a potential custom section header
    if (trimmed.length > 0 && trimmed.length < 50 && line.match(/^[A-Z]/)) {
      // Uppercase start suggests header
      const lowerLine = trimmed.toLowerCase();
      const isSectionHeader =
        lowerLine.endsWith(':') ||
        (trimmed.match(/^[A-Z][a-z\s]+$/) && !SECTION_PATTERNS.skills.keywords.some((k) => lowerLine.includes(k)));

      if (isSectionHeader && !standardSectionTypes.has(lowerLine.replace(/[:\s]/g, ''))) {
        // Save previous custom section
        if (currentCustomSection && subsectionContent.trim()) {
          currentCustomSection.subsections.push({
            id: `subsection-${currentCustomSection.subsections.length}`,
            title: 'Content',
            content: subsectionContent.trim(),
          });
          customSections.push(currentCustomSection);
        }

        // Start new custom section
        currentCustomSection = {
          id: `custom-${customSections.length}`,
          title: trimmed.replace(/[:\s]+$/, ''),
          subsections: [],
        };
        subsectionContent = '';
        continue;
      }
    }

    // Accumulate content
    if (currentCustomSection) {
      subsectionContent += (subsectionContent ? '\n' : '') + trimmed;
    }
  }

  // Save last custom section
  if (currentCustomSection && subsectionContent.trim()) {
    currentCustomSection.subsections.push({
      id: `subsection-${currentCustomSection.subsections.length}`,
      title: 'Content',
      content: subsectionContent.trim(),
    });
    customSections.push(currentCustomSection);
  }

  return customSections;
}

/**
 * Main extractor function
 */
export function extractResumeFromText(
  text: string,
  userId: string,
  title: string = 'Extracted Resume',
): ResumeData {
  // Find and extract sections
    const cleanedInput = removeNoiseLines(text.split('\n')).join('\n');
    const sections = findSections(cleanedInput);

  // Extract profile/header info (from beginning of document)
    const headerEndIdx = sections.size > 0
        ? Math.min(...Array.from(sections.values()).map((s) => s.start))
        : cleanedInput.indexOf(cleanedInput.split('\n')[5] || '');
    const headerText = cleanedInput.substring(0, Math.max(headerEndIdx, 200));
  const profile = extractProfile(headerText);

  // Extract summary from section if present
  if (sections.has('summary')) {
    const { start, end } = sections.get('summary')!;
      const summaryText = extractSectionText(cleanedInput, start, end);
      const summaryLines = removeNoiseLines(summaryText.split('\n').slice(1)); // Skip header
    profile.summary = summaryLines.join('\n').trim().substring(0, 500);
  }

  // Extract skills
  let skills: skills[] = [];
  if (sections.has('skills')) {
    const { start, end } = sections.get('skills')!;
      const skillsText = extractSectionText(cleanedInput, start, end);
    skills = extractSkills(skillsText);
  }

  // Extract experiences
  let experiences: Experience[] = [];
  if (sections.has('experience')) {
    const { start, end } = sections.get('experience')!;
      const experienceText = extractSectionText(cleanedInput, start, end);
    experiences = extractExperiences(experienceText);
  }

  // Extract educations
  let educations: Education[] = [];
  if (sections.has('education')) {
    const { start, end } = sections.get('education')!;
      const educationText = extractSectionText(cleanedInput, start, end);
    educations = extractEducations(educationText);
  }

  // Extract custom sections
    const customSections = extractCustomSections(cleanedInput, sections);

  return {
    id: '',
    userId,
    title,
    template: 'modern',
    profile: (profile as Profile) || {
      fullname: '',
      email: '',
      phone: '',
      location: '',
      links: [],
      summary: '',
    },
    skills: skills.length > 0 ? skills : [{ type: 'Skills', skills: [] }],
    experiences,
    educations,
    customSections,
  };
}

/**
 * Extract just the resume text from multi-format input
 */
export function cleanResumeText(rawText: string): string {
  // Remove extra whitespace and normalize
  let cleaned = rawText
    .replace(/\f/g, '\n') // Form feed to newline
    .replace(/\r\n/g, '\n') // CRLF to LF
    .replace(/\t/g, '  ') // Tabs to spaces
      .replace(/^#{1,6}\s+/gm, '') // Drop markdown header markers often produced by OCR/HTML-to-text
    .replace(/\n\n\n+/g, '\n\n') // Multiple newlines to double
    .trim();

  return cleaned;
}
