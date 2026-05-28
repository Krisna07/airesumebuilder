import { ResumeData, ResumeStyle } from '@/types/types';
import { baseStyles } from './baseStyles';
import { escapeHtml, safeJoin, renderContactInfo, renderCustomSections, renderSectionTitle, getGroupedSkills, getFlatSkills, resolveSectionOrder } from './helpers';


// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function generateModernHTML(data: ResumeData, _style?: ResumeStyle): string {
  const groupedSkills = _style?.skillsGrouped !== false;
  const skillsByGroup = getGroupedSkills(data, _style);
  const flatSkills = getFlatSkills(data);
  const modernStyles = `
    /* Modern clean aesthetic */
    body { font-size: 10px; color: #333; }
    .header { background: ${_style?.accentColor ?? '#1e293b'}; color: white; margin-bottom: 16px; }
    .header-inner { padding: 18px 24px 16px; }
    .header h1 { font-size: 26px; font-weight: 300; letter-spacing: 1px; margin: 0; color: white; text-transform: uppercase; }
    .header .contact-info { color: rgba(255,255,255,0.7); justify-content: flex-start; margin-top: 8px; font-size: 10px; }
    .header .contact-item { color: rgba(255,255,255,0.85); }
    .header a { color: rgba(255,255,255,0.85); text-decoration: none; }
    .aligned-columns { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start; }

    .experiences-item { margin-bottom: 12px; page-break-inside: avoid; }
    .job-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 2px; }
    .job-title { font-size: 11px; font-weight: 700; color: #0f172a; }
    .company { font-size: 10.5px; font-weight: 500; color: #475569; }
    .date-loc { font-size: 9.5px; color: #64748b; font-weight: 500; text-align: right; }

    ul.responsibilities { margin-left: 14px; margin-top: 4px; }
    ul.responsibilities li { margin-bottom: 2px; color: #475569; line-height: 1.4; }

    .skills-grid { display: flex; flex-wrap: wrap; gap: 6px; }
    .skill-bg { background: #f8fafc; padding: 3px 8px; border-radius: 4px; font-weight: 600; color: ${_style?.accentColor ?? '#334155'}; font-size: 9.5px; text-align: center; border: 1px solid ${_style?.lineColor ?? '#e2e8f0'}; }
    .skills-group-label { font-size: 10px; font-weight: 700; color: #475569; margin-bottom: 4px; }
    @media (max-width: 760px) { .aligned-columns { grid-template-columns: 1fr; } }
  `;

  const renderSection = (key: string): string => {
    switch (key) {
      case 'summary':
        return data.profile.summary ? `
          <div class="section">
            ${renderSectionTitle('Summary', _style)}
            <div class="summary" style="padding: 0 4px;">${escapeHtml(data.profile.summary)}</div>
          </div>
        ` : '';
      case 'experience':
        return data.experiences?.length ? `
          <div class="section">
            ${renderSectionTitle('Experience', _style)}
            ${safeJoin(data.experiences.map(exp => `
              <div class="experiences-item">
                <div class="job-header">
                  <div>
                    <div class="job-title">${escapeHtml(exp.title)}</div>
                    <div class="company">${escapeHtml(exp.company)}</div>
                  </div>
                  <div class="date-loc">
                    <div>${escapeHtml(exp.startDate)} – ${exp.current ? 'Present' : escapeHtml(exp.endDate)}</div>
                    <div>${escapeHtml(exp.location)}</div>
                  </div>
                </div>
                ${exp.responsibilities?.length ? `<ul class="responsibilities">${safeJoin(exp.responsibilities.slice(0, 5).map(r => `<li>${escapeHtml(r)}</li>`))}</ul>` : ''}
              </div>
            `))}
          </div>
        ` : '';
      case 'education':
        return data.educations?.length ? `
          <div class="section">
            ${renderSectionTitle('Education', _style)}
            ${safeJoin(data.educations.map(edu => `
              <div style="margin-bottom: 8px;">
                <div class="job-title">${escapeHtml(edu.degree)}</div>
                <div class="company">${escapeHtml(edu.university)}</div>
                <div class="date-loc" style="text-align:left;">${escapeHtml(edu.startDate)} – ${escapeHtml(edu.endDate)}</div>
              </div>
            `))}
          </div>
        ` : '';
      case 'skills':
        return data.skills?.length ? `
          <div class="section">
            ${renderSectionTitle('Skills', _style)}
            ${groupedSkills ? safeJoin(skillsByGroup.map((group) => `
              <div style="margin-bottom: 8px;">
                ${group.type ? `<div class="skills-group-label">${escapeHtml(group.type)}</div>` : ''}
                <div class="skills-grid">
                  ${safeJoin((group.skills || []).map(s => `<div class="skill-bg">${escapeHtml(s)}</div>`))}
                </div>
              </div>
            `)) : `
              <div class="skills-grid">
                ${safeJoin(flatSkills.map(s => `<div class="skill-bg">${escapeHtml(s)}</div>`))}
              </div>
            `}
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
      { key: 'education', side: 'full' },
      { key: 'skills', side: 'full' },
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
      <style>${baseStyles}${modernStyles}</style>
    </head>
    <body>
      <div class="container" style="padding-top: 0;">
        <div class="header full-bleed">
          <div class="header-inner full-bleed-inner">
            <h1>${escapeHtml(data.profile.fullname)}</h1>
            <div class="contact-info">${renderContactInfo(data)}</div>
          </div>
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
