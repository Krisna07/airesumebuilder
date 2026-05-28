import { ResumeData, ResumeStyle } from '@/types/types';
import { baseStyles } from './baseStyles';
import { escapeHtml, safeJoin, renderContactInfo, renderCustomSections, renderSectionTitle, getGroupedSkills, getFlatSkills, resolveSectionOrder } from './helpers';



// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function generateExecutiveHTML(data: ResumeData, _style?: ResumeStyle): string {
  const groupedSkills = _style?.skillsGrouped !== false;
  const skillsByGroup = getGroupedSkills(data, _style);
  const allSkills = getFlatSkills(data);

  const executiveStyles = `
    /* Executive / Formal Serif Layout */
    body { font-size: 10.5px; line-height: 1.4; color: #111; }
    .header { text-align: center; border-bottom: 2px solid ${_style?.accentColor ?? '#000'}; padding: 20px 0 10px; margin-bottom: 16px; }
    .header h1 { font-size: 32px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 6px; font-weight: 400; }
    .header .contact-info { justify-content: center; gap: 16px; font-style: italic; font-size: 10.5px; }
    .aligned-columns { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start; }

    .section { margin-bottom: 14px; }
    .experiences-item { margin-bottom: 12px; }
    .job-line { display: flex; justify-content: space-between; align-items: baseline; }
    .job-title { font-weight: 700; font-size: 11px; color: ${_style?.accentColor ?? '#000'}; }
    .company { font-style: italic; font-size: 11px; }
    .date { font-size: 10px; color: #444; }
    .custom-subsection { border:none }
    .summary { text-align: justify; margin-bottom: 10px; }
    
    ul.responsibilities { margin-left: 20px; list-style-type: square; }
    ul.responsibilities li { margin-bottom: 2px; }

    .skills-list { text-align: center; line-height: 1.8; }
    .skills-separator { margin: 0 6px; color: ${_style?.lineColor ?? '#999'}; font-size: 8px; vertical-align: middle; }
    .skills-group { margin-bottom: 8px; }
    .skills-group-title { font-size: 10px; font-weight: 700; letter-spacing: 0.7px; text-transform: uppercase; color: #444; }
    .edu-grid { display: grid; grid-template-columns: repeat(2, minmax(180px, 1fr)); gap: 20px; }
    .edu-item { margin-bottom: 8px; text-align: center; overflow-wrap: anywhere; word-break: break-word; }
    @media (max-width: 760px) { .aligned-columns { grid-template-columns: 1fr; } }
  `;

  const renderSection = (key: string): string => {
    switch (key) {
      case 'summary':
        return data.profile.summary ? `
          <div class="section">
            ${renderSectionTitle('Executive Profile', _style)}
            <div class="summary">${escapeHtml(data.profile.summary)}</div>
          </div>
        ` : '';
      case 'experience':
        return data.experiences?.length ? `
          <div class="section">
            ${renderSectionTitle('Professional Experience', _style)}
            ${safeJoin(data.experiences.map(exp => `
              <div class="experiences-item">
                <div class="job-line">
                  <span class="job-title">${escapeHtml(exp.title)}</span>
                  <span class="date">${escapeHtml(exp.startDate)} – ${exp.current ? 'Present' : escapeHtml(exp.endDate)}</span>
                </div>
                <div class="job-line">
                  <span class="company">${escapeHtml(exp.company)} - ${escapeHtml(exp.location)}</span>
                </div>
                ${exp.responsibilities?.length ? `<ul class="responsibilities">${safeJoin(exp.responsibilities.map(r => `<li>${escapeHtml(r)}</li>`))}</ul>` : ''}
              </div>
            `))}
          </div>
        ` : '';
      case 'skills':
        return allSkills.length ? `
          <div class="section">
            ${renderSectionTitle('Core Competencies', _style)}
            ${groupedSkills ? safeJoin(skillsByGroup.map((group) => `
              <div class="skills-group">
                ${group.type ? `<div class="skills-group-title">${escapeHtml(group.type)}</div>` : ''}
                <div class="skills-list">
                  ${safeJoin((group.skills || []).map(s => `<span>${escapeHtml(s)}</span>`).reduce((acc: string[], curr: string, idx: number, arr: string[]) => {
                    if (idx < arr.length - 1) return [...acc, curr, '<span class="skills-separator">◇</span>'];
                    return [...acc, curr];
                  }, []))}
                </div>
              </div>
            `)) : `
              <div class="skills-list">
                ${safeJoin(allSkills.map(s => `<span>${escapeHtml(s)}</span>`).reduce((acc: string[], curr: string, idx: number, arr: string[]) => {
                    if (idx < arr.length - 1) return [...acc, curr, '<span class="skills-separator">◇</span>'];
                    return [...acc, curr];
                  }, []))}
              </div>
            `}
          </div>
        ` : '';
      case 'education':
        return data.educations?.length ? `
          <div class="section">
            ${renderSectionTitle('Education', _style)}
            <div class="edu-grid">
              ${safeJoin(data.educations.map(edu => `
                <div class="edu-item">
                  <div style="font-weight: 700;">${escapeHtml(edu.university)}</div>
                  <div style="font-style: italic;">${escapeHtml(edu.degree)}</div>
                  <div style="font-size: 10px; color: #555;">${escapeHtml(edu.startDate)} – ${escapeHtml(edu.endDate)}</div>
                </div>
              `))}
            </div>
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
      { key: 'experience', side: 'full' },
      { key: 'skills', side: 'full' },
      { key: 'education', side: 'full' },
      { key: 'custom', side: 'full' },
    ],
    data,
  );
  const leftSections = orderedSections.filter((section) => section.side === 'left');
  const rightSections = orderedSections.filter((section) => section.side === 'right');
  const fullSections = orderedSections.filter((section) => (section.side ?? 'full') === 'full');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(data.profile.fullname)} - Resume</title>
      <style>${baseStyles}${executiveStyles}</style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${escapeHtml(data.profile.fullname)}</h1>
          <div class="contact-info">${renderContactInfo(data)}</div>
        </div>
        ${safeJoin(fullSections.map((section) => renderSection(section.key)))}
        ${leftSections.length > 0 || rightSections.length > 0 ? `
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
