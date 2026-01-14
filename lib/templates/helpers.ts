import { CustomSectionData, Education, Experience, ResumeData } from '@/types/types';

export const escapeHtml = (text = ''): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const safeJoin = (arr: string[] | undefined) => arr?.join('') || '';

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

export const renderCustomSections = (customSection: CustomSectionData): string => {
  return (customSection.subsections && customSection.subsections.length > 0) ? `
    <div class="custom-section avoid-break">
      <div class="section-title">${escapeHtml(customSection.title)}</div>
      ${safeJoin(customSection.subsections?.map((sub, index) => `
        <div class="custom-subsection">
          <a class="job-title" href="${escapeHtml(sub.url ? sub.url : '')}"  >${index + 1}. ${escapeHtml(sub.title)}</a>
          <div class="summary">${escapeHtml(sub.content)}</div>
        </div>
      `) || [])}
    </div>
  `: '';
};
