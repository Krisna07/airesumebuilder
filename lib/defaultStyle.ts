import { ResumeStyle, SectionOrder } from '@/types/types';

// Keep global default empty so each template can apply its own sensible fallback order.
const DEFAULT_SECTION_ORDER: SectionOrder[] = [];

export const DEFAULT_RESUME_STYLE: ResumeStyle = {
  accentColor: '#0ea5e9',
  lineColor: '#e2e8f0',
  headingFont: 'Inter',
  bodyFont: 'Inter',
  bodyFontSize: 11,
  lineHeight: 1.45,
  sectionGap: 12,
  itemGap: 10,
  sectionTitleStyle: {
    type: 'underline',
    icon: '',
    iconEnabled: false,
    color: '#0ea5e9',
    fontSize: 11.5,
    fontWeight: 700,
    fontStyle: 'normal',
    textTransform: 'uppercase',
    align: 'left',
  },
  sectionOrder: [...DEFAULT_SECTION_ORDER],
  bodyTextAlign: 'left',
  skillsGrouped: true,
  skillsWithBackground: true,
  skillsWithBorder: true,
};

/**
 * Merges a partial style saved in the DB with the full defaults.
 * This means adding new style fields in the future won't break existing resumes.
 */
export function mergeWithDefault(saved?: Partial<ResumeStyle> | null): ResumeStyle {
  if (!saved) return DEFAULT_RESUME_STYLE;
  return {
    ...DEFAULT_RESUME_STYLE,
    ...saved,
    sectionTitleStyle: {
      ...DEFAULT_RESUME_STYLE.sectionTitleStyle,
      ...(saved.sectionTitleStyle ?? {}),
    },
    sectionOrder: saved.sectionOrder?.length
      ? [...saved.sectionOrder]
      : [...DEFAULT_RESUME_STYLE.sectionOrder],
  };
}
