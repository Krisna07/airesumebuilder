export const TEMPLATE_IDENTIFIER_REGEX = /^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])?$/;

export type TemplateLayoutConfig = Record<string, unknown>;
export type TemplateStyleTokens = Record<string, unknown>;
export type TemplateSectionRules = Record<string, unknown>;
export type TemplatePreviewMeta = Record<string, unknown>;

export function normalizeTemplateIdentifier(input: string): string {
  const trimmed = input.trim().toLowerCase();
  const slug = trimmed
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return slug.slice(0, 63);
}

export function isValidTemplateIdentifier(identifier: string): boolean {
  return TEMPLATE_IDENTIFIER_REGEX.test(identifier);
}

export function getTemplateIdentifierError(identifier: string): string | null {
  if (!identifier) return 'Template name is required';
  if (identifier.length < 3) return 'Template name must be at least 3 characters';
  if (identifier.length > 63) return 'Template name must be at most 63 characters';
  if (!isValidTemplateIdentifier(identifier)) {
    return 'Use lowercase letters, numbers, and single hyphens only';
  }
  return null;
}

export function defaultTemplateLayoutConfig(): TemplateLayoutConfig {
  return {
    columns: 'single',
    sectionOrder: [
      { key: 'summary', side: 'full', enabled: true },
      { key: 'experience', side: 'full', enabled: true },
      { key: 'education', side: 'full', enabled: true },
      { key: 'skills', side: 'full', enabled: true },
      { key: 'custom', side: 'full', enabled: true },
    ],
  };
}

export function defaultTemplateStyleTokens(): TemplateStyleTokens {
  return {
    accentColor: '#0ea5e9',
    lineColor: '#e2e8f0',
    headingFont: 'Inter',
    bodyFont: 'Inter',
    bodyFontSize: 11,
    lineHeight: 1.45,
    sectionGap: 12,
    itemGap: 10,
    lineOpacity: 1,
    sectionBackgroundOpacity: 1,
  };
}

export function defaultTemplateSectionRules(): TemplateSectionRules {
  return {
    summary: { maxChars: 800, enabled: true },
    experience: { maxItems: 8, enabled: true },
    education: { maxItems: 6, enabled: true },
    skills: { maxGroups: 8, maxItemsPerGroup: 20, enabled: true },
    custom: { enabled: true },
  };
}

export function defaultTemplatePreviewMeta(): TemplatePreviewMeta {
  return {
    category: 'general',
    tags: ['ATS-Friendly'],
    atsOptimized: true,
  };
}
