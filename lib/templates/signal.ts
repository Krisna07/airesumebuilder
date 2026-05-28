import { ResumeData, ResumeStyle } from '@/types/types';
import { baseStyles } from './baseStyles';
import { escapeHtml, safeJoin, renderContactInfo, renderCustomSections, renderSectionTitle, getGroupedSkills, getFlatSkills, resolveSectionOrder } from './helpers';



// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function generateSignalHTML(data: ResumeData, _style?: ResumeStyle): string {
  const groupedSkills = _style?.skillsGrouped !== false;
  const skillsByGroup = getGroupedSkills(data, _style);
  const flatSkills = getFlatSkills(data);
  const signalStyles = `
    /* Signal: Bold & High Contrast */
    body { font-size: 10px; color: #101010; }
    .top-bar h1 { font-size: 36px; font-weight: 900; letter-spacing: -1px; text-transform: uppercase; line-height: 1; margin-bottom: 8px;}
    .top-bar .contact-info {  font-size: 11px; }
    .top-bar .contact-item { font-weight: 500; }
    .top-bar a {text-decoration: none; border-bottom: 1px solid ${_style?.lineColor ?? '#555'}; }
    .aligned-columns { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start; }
    .grid-layout { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; }
    .exp-item { margin-bottom: 16px; border-left: 4px solid ${_style?.accentColor ?? '#000'}; padding-left: 12px; }
    .exp-title { font-size: 12px; font-weight: 800; text-transform: uppercase; }
    .exp-company { font-size: 11px; font-weight: 600; margin-bottom: 2px; }
    .exp-date { font-size: 10px; font-weight: 500; color: #555; margin-bottom: 4px; }
    .custom-subsection { border-left: 4px solid ${_style?.accentColor ?? '#000'}; padding-left: 10px; margin-bottom: 12px; }
    ul { margin: 0; padding-left: 16px; }
    li { margin-bottom: 3px; font-weight: 400; color: #333; }

    .sidebar-section { margin-bottom: 20px; }
    .skill-block { margin-bottom: 4px; font-weight: 600; font-size: 10.5px; border-bottom: 1px solid ${_style?.lineColor ?? '#eee'}; padding-bottom: 2px; }
    .skill-group-title { font-size: 10px; font-weight: 700; text-transform: uppercase; margin-top: 6px; color: #4b5563; }
    @media (max-width: 760px) { .aligned-columns { grid-template-columns: 1fr; } }
  `;

  const renderSection = (key: string): string => {
    switch (key) {
      case 'summary':
        return data.profile.summary ? `
          <div class="section">
            ${renderSectionTitle('Profile', _style)}
            <div class="summary">${escapeHtml(data.profile.summary)}</div>
          </div>
        ` : '';
      case 'experience':
        return data.experiences?.length ? `
          <div class="section">
            ${renderSectionTitle('Experience', _style)}
            ${safeJoin(data.experiences.map(exp => `
              <div class="exp-item">
                <div class="exp-title">${escapeHtml(exp.title)}</div>
                <div style="display:flex; gap:4px; align-items:center;">
                  <div class="exp-company">${escapeHtml(exp.company)} | ${escapeHtml(exp.location)}</div>
                  <div class="exp-date">${escapeHtml(exp.startDate)} – ${exp.current ? 'Present' : escapeHtml(exp.endDate)}</div>
                </div>
                ${exp.responsibilities?.length ? `<ul>${safeJoin(exp.responsibilities.map(r => `<li>${escapeHtml(r)}</li>`))}</ul>` : ''}
              </div>
            `))}
          </div>
        ` : '';
      case 'education':
        return data.educations?.length ? `
          <div class="section">
            ${renderSectionTitle('Education', _style)}
            ${safeJoin(data.educations.map(edu => `
              <div style="margin-bottom: 12px;">
                <div style="font-weight: 700;">${escapeHtml(edu.university)}</div>
                <div style="display:flex; gap:4px; align-items:center;">
                  <div>${escapeHtml(edu.degree)}</div>
                  <div style="font-size: 10px; color: #666;">${escapeHtml(edu.startDate)} – ${escapeHtml(edu.endDate)}</div>
                </div>
              </div>
            `))}
          </div>
        ` : '';
      case 'skills':
        return data.skills?.length ? `
          <div class="section">
            ${renderSectionTitle('Skills', _style)}
            ${groupedSkills ? safeJoin(skillsByGroup.map((group) => `
              <div>
                ${group.type ? `<div class="skill-group-title">${escapeHtml(group.type)}</div>` : ''}
                ${safeJoin((group.skills || []).slice(0, 20).map(s => `<div class="skill-block">${escapeHtml(s)}</div>`))}
              </div>
            `)) : safeJoin(flatSkills.slice(0, 20).map(s => `<div class="skill-block">${escapeHtml(s)}</div>`))}
          </div>
        ` : '';
      case 'custom':
        return data.customSections?.length ? safeJoin(data.customSections.map(section => renderCustomSections(section, true, _style))) : '';
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
      <style>${baseStyles}${signalStyles}</style>
    </head>
    <body>
      <div class="container" style="padding-top: 0; max-width: 100%;">
        <div class="top-bar">
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
