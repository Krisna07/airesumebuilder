import { ResumeData, ResumeStyle } from '@/types/types';
import { baseStyles } from './baseStyles';
import { escapeHtml, safeJoin, renderContactInfo, renderCustomSections, renderSectionTitle, getGroupedSkills, getFlatSkills, resolveSectionOrder } from './helpers';



// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function generateDefaultHTML(data: ResumeData, _style?: ResumeStyle): string {
  const groupedSkills = _style?.skillsGrouped !== false;
  const skillsByGroup = getGroupedSkills(data, _style);
  const flatSkills = getFlatSkills(data);
  const defaultStyles = `
    /* High density overrides for Standard Template */
    body { font-size: 10.5px; line-height: 1.35; color: #111827; }
    .header { border-bottom: 2px solid ${_style?.accentColor ?? '#000'}; padding-bottom: 8px; margin-bottom: 12px; }
    .header h1 { font-size: 28px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; line-height: 1.1; color: ${_style?.accentColor ?? '#000'}; }
    .contact-info { margin-top: 4px; justify-content: flex-start; gap: 12px; font-size: 10.5px; color: #374151; }

    .section { margin-bottom: 10px; }
    .aligned-columns { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start; }

    .experiences-item .job-title { font-size: 11px; font-weight: 700; color: ${_style?.accentColor ?? '#000'}; }
    .experiences-item .job-header-row { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 4px; }
    .experiences-item .location-date { font-size: 10.5px; color: #4b5563; font-style: normal; white-space: nowrap; }
    .experiences-item .company { display: block; font-size: 11px; font-weight: 600; color: #374151; margin-bottom: 2px; }

    ul.responsibilities { margin-top: 2px; margin-left: 14px; }
    ul.responsibilities li { margin-bottom: 1px; color: #374151; }

    .educations-item { margin-bottom: 6px; }
    .educations-item .job-title { font-size: 11px; font-weight: 700; color: ${_style?.accentColor ?? '#000'}; }

    .skills-container { gap: 6px; }
    .skill-item { font-weight: 500; color: #374151; border: 1px solid ${_style?.lineColor ?? '#e5e7eb'}; padding: 1px 6px; border-radius: 3px; background: #f9fafb; }
    @media (max-width: 760px) { .aligned-columns { grid-template-columns: 1fr; } }
  `;

  const renderSection = (key: string): string => {
    switch (key) {
      case 'summary':
        return data.profile.summary ? `
          <div class="section">
            ${renderSectionTitle('Professional Summary', _style)}
            <div class="summary">${escapeHtml(data.profile.summary)}</div>
          </div>
        ` : '';
      case 'skills':
        return data.skills?.length ? `
          <div class="section">
            ${renderSectionTitle('Skills', _style)}
            ${groupedSkills ? safeJoin(skillsByGroup.map((group) => `
              <div style="margin-bottom: 4px;">
                ${group.type ? `<div style="font-size:10px; font-weight:700; margin-bottom:2px; color:#475569;">${escapeHtml(group.type)}</div>` : ''}
                <div class="skills-container" style="display:flex; flex-wrap:wrap;">
                  ${safeJoin((group.skills || []).map(s => `<span class="skill-item">${escapeHtml(s)}</span>`))}
                </div>
              </div>
            `)) : `
              <div class="skills-container" style="display:flex; flex-wrap:wrap;">
                ${safeJoin(flatSkills.map(s => `<span class="skill-item">${escapeHtml(s)}</span>`))}
              </div>
            `}
          </div>
        ` : '';
      case 'experience':
        return data.experiences?.length ? `
          <div class="section">
            ${renderSectionTitle('Experience', _style)}
            ${safeJoin(data.experiences.map(exp => `
              <div class="experiences-item avoid-break">
                <div class="job-header-row">
                  <span class="job-title">${escapeHtml(exp.title)}</span>
                  <span class="location-date">${escapeHtml(exp.startDate)} – ${exp.current ? 'Present' : escapeHtml(exp.endDate)} | ${escapeHtml(exp.location)}</span>
                </div>
                <div class="company">${escapeHtml(exp.company)}</div>
                ${exp.responsibilities?.length ? `<ul class="responsibilities">${safeJoin(exp.responsibilities.slice(0, 8).map(r => `<li>${escapeHtml(r)}</li>`))}</ul>` : ''}
              </div>
            `))}
          </div>
        ` : '';
      case 'education':
        return data.educations?.length ? `
          <div class="section">
            ${renderSectionTitle('Education', _style)}
            ${safeJoin(data.educations.map(edu => `
              <div class="educations-item">
                <div style="display:flex; justify-content:space-between;">
                  <span class="job-title">${escapeHtml(edu.degree)}</span>
                  <span class="location-date">${escapeHtml(edu.startDate)} – ${escapeHtml(edu.endDate)}</span>
                </div>
                <div class="company">${escapeHtml(edu.university)}, ${escapeHtml(edu.location)}</div>
              </div>
            `))}
          </div>
        ` : '';
      case 'custom':
        return data.customSections?.length ? safeJoin(data.customSections.map(section => renderCustomSections(section, false, _style))) : '';
      default:
        return '';
    }
  };

  const orderedSections = resolveSectionOrder(
    _style?.sectionOrder,
    [
      { key: 'summary', side: 'full' },
      { key: 'skills', side: 'full' },
      { key: 'experience', side: 'full' },
      { key: 'education', side: 'full' },
      { key: 'custom', side: 'full' },
    ],
    data,
  );

  const fullSections = orderedSections.filter((section) => (section.side ?? 'full') === 'full');
  const leftSections = orderedSections.filter((section) => section.side === 'left');
  const rightSections = orderedSections.filter((section) => section.side === 'right');
  const hasAlignedColumns = leftSections.length > 0 || rightSections.length > 0;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(data.profile.fullname)} - Resume</title>
      <style>${baseStyles}${defaultStyles}</style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${escapeHtml(data.profile.fullname)}</h1>
          <div class="contact-info">${renderContactInfo(data)}</div>
        </div>
        ${safeJoin(fullSections.map((section) => renderSection(section.key)))}
        ${hasAlignedColumns ? `
          <div class="aligned-columns">
            <div>${safeJoin(leftSections.map((section) => renderSection(section.key)))}</div>
            <div>${safeJoin(rightSections.map((section) => renderSection(section.key)))}</div>
          </div>
        ` : ''}
      </div>
    </body>
    </html>
  `;
}
