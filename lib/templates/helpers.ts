import { CustomSectionData, Education, Experience, ResumeData, ResumeStyle } from '@/types/types';
import { DEFAULT_RESUME_STYLE } from '../defaultStyle';

export const escapeHtml = (text = ''): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const safeJoin = (arr: string[] | undefined) => arr?.join('') || '';

export const getGroupedSkills = (data: ResumeData, style?: ResumeStyle) => {
  if (!data.skills?.length) return [];
  if (style?.skillsGrouped === false) {
    return [{ type: '', skills: data.skills.flatMap((g) => g.skills || []) }];
  }
  return data.skills;
};

export const getFlatSkills = (data: ResumeData) => data.skills?.flatMap((g) => g.skills || []) || [];

const normalizeSectionKey = (key: string) => {
  switch (key) {
    case 'experiences':
      return 'experience';
    case 'educations':
      return 'education';
    case 'customSections':
      return 'custom';
    default:
      return key;
  }
};

export const resolveSectionOrder = (
  configured: ResumeStyle['sectionOrder'] | undefined,
  fallback: Array<{ key: string; side?: 'left' | 'right' | 'full' }>,
  data: ResumeData,
) => {
  const disabled = new Set(
    (configured || [])
      .filter((section) => section.enabled === false)
      .map((section) => normalizeSectionKey(section.key)),
  );
  const fromConfig = (configured || [])
    .filter((section) => section.enabled !== false)
    .map((section) => ({
      key: normalizeSectionKey(section.key),
      side: section.side,
    }));

  const base = fromConfig.length ? fromConfig : fallback;
  const fallbackMap = new Map(fallback.map((s) => [s.key, s.side]));

  const normalized = base.map((section) => ({
    key: section.key,
    side: section.side ?? fallbackMap.get(section.key) ?? 'full',
  }));

  const known = new Set(normalized.map((s) => s.key));

  if (data.profile?.summary && !known.has('summary') && !disabled.has('summary')) {
    normalized.push({ key: 'summary', side: fallbackMap.get('summary') ?? 'full' });
  }
  if (data.experiences?.length && !known.has('experience') && !disabled.has('experience')) {
    normalized.push({ key: 'experience', side: fallbackMap.get('experience') ?? 'full' });
  }
  if (data.educations?.length && !known.has('education') && !disabled.has('education')) {
    normalized.push({ key: 'education', side: fallbackMap.get('education') ?? 'full' });
  }
  if (data.skills?.length && !known.has('skills') && !disabled.has('skills')) {
    normalized.push({ key: 'skills', side: fallbackMap.get('skills') ?? 'full' });
  }
  if (data.customSections?.length && !known.has('custom') && !disabled.has('custom')) {
    normalized.push({ key: 'custom', side: fallbackMap.get('custom') ?? 'full' });
  }

  return normalized;
};

export const renderSectionTitle = (title: string, style?: ResumeStyle): string => {
  const settings = style?.sectionTitleStyle ?? DEFAULT_RESUME_STYLE.sectionTitleStyle;
  const iconHtml = settings.iconEnabled && settings.icon ? `<span class="section-icon" style="margin-right:6px; font-style:normal; font-weight:normal;">${escapeHtml(settings.icon)}</span>` : '';
  return `<div class="section-title">${iconHtml}${escapeHtml(title)}</div>`;
};

export const renderExperiences = (exp: Experience) => `
  <div class="experiences-item avoid-break">
    <div class="job-title">${escapeHtml(exp.title)}</div>
    <div class="location-date"><div class="company">${escapeHtml(exp.company)} - ${escapeHtml(exp.location)} </div><div class="job-date"> ${escapeHtml(exp.startDate)} - ${exp.current ? 'Present' : escapeHtml(exp.endDate)}</div></div>
    ${
      safeJoin(exp.responsibilities?.slice(0, 6).map(r => `<li>${escapeHtml(r)}</li>`))
        ? `<ul class="responsibilities">${safeJoin(exp.responsibilities?.slice(0, 6).map(r => `<li>${escapeHtml(r)}</li>`))}</ul>`
        : ''
    }
  </div>
`;

export const renderEducations = (edu: Education) => `
  <div class="educations-item avoid-break">
    <div class="job-title">${escapeHtml(edu.degree)}</div>
    <div class="location-date"><div class="company">${escapeHtml(edu.university)} - ${escapeHtml(edu.location)}</div><div class="job-date">${escapeHtml(edu.startDate)} - ${escapeHtml(edu.endDate)}</div></div>
  </div>
`;

export const renderContactInfo = (data: ResumeData) => safeJoin([
  data.profile.email && `<span class="contact-item">📧 ${escapeHtml(data.profile.email)}</span>`,
  data.profile.phone && `<span class="contact-item">📞 ${escapeHtml(data.profile.phone)}</span>`,
  data.profile.location && `<span class="contact-item">📍 ${escapeHtml(data.profile.location)}</span>`,
  ...((data.profile.links || []).map(link => link?.url && `<a href="${escapeHtml(link.url)}" class="contact-item">🔗 ${escapeHtml(link.type)}</a>`))
].filter(Boolean) as string[]);

export const renderCustomSections = (customSection: CustomSectionData, hideDes = false, style?: ResumeStyle): string => {
  return (customSection.subsections && customSection.subsections.length > 0) ? `
    <div class="custom-section avoid-break">
      ${renderSectionTitle(customSection.title, style)}

      ${safeJoin(customSection.subsections?.map((sub) => `
        <div class="custom-subsection">
          <a class="job-title" href="${escapeHtml(sub.url ? sub.url : '')}">${escapeHtml(sub.title)}</a>
          ${hideDes ? '' : `<div class="summary">${escapeHtml(sub.content)}</div>`}
        </div>
      `) || [])}
    </div>
  `: '';
};
