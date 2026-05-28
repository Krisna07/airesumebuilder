import { ResumeData, ResumeStyle } from '@/types/types';
import { baseStyles } from './baseStyles';
import { escapeHtml, safeJoin, renderExperiences, renderEducations, renderContactInfo, renderCustomSections, renderSectionTitle, getGroupedSkills, resolveSectionOrder } from './helpers';



// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function generateClassicHTML(data: ResumeData, _style?: ResumeStyle): string {
  const skillsForRender = getGroupedSkills(data, _style);
  const classicStyles = `
    .header { border-radius: 2px; padding-bottom: 10px; margin-bottom: 12px; border-bottom: 2px solid ${_style?.accentColor ?? '#8b5cf6'}; }
    .header h1 { font-size: 22px; font-weight: 700; letter-spacing: -0.5px; color: ${_style?.accentColor ?? '#1e1b4b'}; }
    .aligned-columns { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start; }
    .skill-tag { color: ${_style?.accentColor ?? '#6d28d9'}; border: 1px solid ${_style?.lineColor ?? '#c4b5fd'}; background: #f8fafc; font-weight: 500; font-size: 10px; line-height: 1.4; padding: 2px 6px; border-radius: 3px; }
    .experiences-item { border-left: 3px solid ${_style?.accentColor ?? '#8b5cf6'}; padding-left: 15px; margin-left: 5px; margin-bottom: 10px; }
    .educations-item { border-left: 3px solid ${_style?.accentColor ?? '#3b82f6'}; padding-left: 15px; margin-left: 5px; margin-bottom: 10px; }
    @media (max-width: 760px) { .aligned-columns { grid-template-columns: 1fr; } }
  `;

  const renderSection = (key: string): string => {
    switch (key) {
      case 'summary':
        return data.profile.summary ? `
          <div class="section">
            ${renderSectionTitle('Summary', _style)}
            <div class="summary">${escapeHtml(data.profile.summary)}</div>
          </div>
        ` : '';
      case 'skills':
        return data.skills?.length ? `
          <div class="section">
            ${renderSectionTitle('Skills', _style)}
            ${safeJoin(skillsForRender.map(group => `
              <div class="avoid-break" style="display:flex; align-items:start; gap:10px; border-bottom:1px solid #e5e7eb; padding:3px;">
                ${group.type ? `<div style="width:20%; font-weight:600; display:flex; align-items:start; justify-content:space-between;">${escapeHtml(group.type)} <span>:</span> </div>` : ''}
                ${(group.skills && group.skills.length) ? `<div style="${group.type ? 'width:80%;' : 'width:100%;'}" class="skills-container">${safeJoin(group.skills!.map(s => `<span class="skill-tag">${escapeHtml(s)}</span>`))}</div>` : ''}
              </div>
            `))}
          </div>
        ` : '';
      case 'experience':
        return data.experiences?.length ? `
          <div class="section">
            ${renderSectionTitle('Professional Experience', _style)}
            ${safeJoin(data.experiences.slice(0, 4).map(renderExperiences))}
          </div>
        ` : '';
      case 'education':
        return data.educations?.length ? `
          <div class="section">
            ${renderSectionTitle('Education', _style)}
            ${safeJoin(data.educations.slice(0, 3).map(renderEducations))}
          </div>
        ` : '';
      case 'custom':
        return data.customSections?.length ? `
          <div class="section">
            ${safeJoin(data.customSections.map(section => renderCustomSections(section, false, _style)))}
          </div>
        ` : '';
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
  const leftSections = orderedSections.filter((section) => section.side === 'left');
  const rightSections = orderedSections.filter((section) => section.side === 'right');
  const fullSections = orderedSections.filter((section) => (section.side ?? 'full') === 'full');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${escapeHtml(data.profile.fullname)} - Resume</title>
      <style>${baseStyles}${classicStyles}</style>
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
