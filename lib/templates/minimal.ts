import { ResumeData, ResumeStyle } from '@/types/types';
import { baseStyles } from './baseStyles';
import { escapeHtml, renderSectionTitle, getGroupedSkills, getFlatSkills, resolveSectionOrder, safeJoin } from './helpers';


// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function generateMinimalHTML(data: ResumeData, _style?: ResumeStyle): string {
  const groupedSkills = _style?.skillsGrouped !== false;
  const skillsByGroup = getGroupedSkills(data, _style);
  const flatSkills = getFlatSkills(data);
  const minimalStyles = `
      .header {  margin-bottom: 24px; padding-bottom: 12px; border-bottom: 1px solid ${_style?.lineColor ?? '#e5e7eb'}; }
      .header h1 { font-size: 28px; font-weight: 700; color: #111827; letter-spacing: -0.02em; line-height: 1.2; margin-bottom: 8px; text-transform: uppercase; }
      .contact-info { display: flex; flex-wrap: wrap; gap: 8px; font-size: 11px; color: #4b5563; align-items: center; }
      .contact-item { display: flex; align-items: center; }
      .contact-item:not(:last-child)::after { content: "•"; margin-left: 8px; color: #9ca3af; }
      .contact-item a { color: inherit; text-decoration: none; border-bottom: 1px dotted #9ca3af; }

      .section { margin-bottom: 20px; }
      .aligned-columns { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start; }
      .experiences-item, .educations-item { margin-bottom: 12px; }
      .job-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 2px; }
      .job-title { font-size: 14px; font-weight: 600; color: #111827; }
      .company { font-size: 13px; font-weight: 400; color: #4b5563; }
      .date { font-size: 11px; color: #6b7280; text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }

      .responsibilities { margin-top: 4px; padding-left: 0; list-style: none; }
      .responsibilities li { position: relative; padding-left: 12px; margin-bottom: 3px; color: #374151; font-size: 11px; line-height: 1.5; }
      .responsibilities li::before { content: "•"; position: absolute; left: 0; color: ${_style?.accentColor ?? '#9ca3af'}; font-size: 14px; line-height: 12px; top: 2px; }

      .skills-grid { display: flex; flex-direction: column; gap: 6px; }
      .skill-group { display: flex; align-items: baseline; gap: 12px; }
      .skill-category { font-size: 11px; font-weight: 600; color: #111827; min-width: 100px; flex-shrink: 0; text-transform: capitalize; }
      .skill-list { display: flex; flex-wrap: wrap; gap: 6px; flex: 1; }
      .skill-tag { font-size: 11px; color: ${_style?.accentColor ?? '#4b5563'}; background-color: #f8fafc; padding: 2px 8px; border-radius: 4px; border: 1px solid ${_style?.lineColor ?? '#e5e7eb'}; }
      .noUnderline { text-decoration: none; color: inherit; }
      .summary { color: #374151; font-size: 11px; line-height: 1.6; text-align: justify; }
      @media (max-width: 760px) { .aligned-columns { grid-template-columns: 1fr; } }
    `;

  const renderSection = (key: string): string => {
    switch (key) {
      case 'summary':
        return data.profile.summary ? `
            <div class="section avoid-break">
              ${renderSectionTitle('Profile', _style)}
              <div class="summary">${escapeHtml(data.profile.summary)}</div>
            </div>
          ` : '';
      case 'skills':
        return data.skills?.length ? `
            <div class="section avoid-break">
              ${renderSectionTitle('Skills', _style)}
              <div class="skills-grid">
                ${groupedSkills ? skillsByGroup.map(group => `
                  ${group.skills && group.skills.length > 0 ? `
                    <div class="skill-group">
                      <div class="skill-category">${escapeHtml(group.type || 'Skills')}</div>
                      <div class="skill-list">
                        ${group.skills.map(skill => `<span class="skill-tag">${escapeHtml(skill)}</span>`).join('')}
                      </div>
                    </div>
                  ` : ''}
                `).join('') : `
                  <div class="skill-list">
                    ${flatSkills.map(skill => `<span class="skill-tag">${escapeHtml(skill)}</span>`).join('')}
                  </div>
                `}
              </div>
            </div>
          ` : '';
      case 'experience':
        return data.experiences?.length ? `
            <div class="section">
              ${renderSectionTitle('Experience', _style)}
              ${data.experiences.map(exp => `
                <div class="experiences-item avoid-break">
                  <div class="job-header">
                    <div>
                      <span class="job-title">${escapeHtml(exp.title)}</span>
                      ${exp.company ? `<span style="color:#d1d5db; margin: 0 6px;">|</span> <span class="company">${escapeHtml(exp.company)}</span>` : ''}
                    </div>
                    <span class="date">${escapeHtml(exp.startDate)} – ${exp.current ? 'Present' : escapeHtml(exp.endDate || '')}</span>
                  </div>
                  ${exp.location ? `<div style="font-size:10px; color:#9ca3af; margin-bottom:4px;">${escapeHtml(exp.location)}</div>` : ''}
                  ${exp.responsibilities?.length ? `<ul class="responsibilities">${exp.responsibilities.map(r => `<li>${escapeHtml(r)}</li>`).join('')}</ul>` : ''}
                </div>
              `).join('')}
            </div>
          ` : '';
      case 'education':
        return data.educations?.length ? `
            <div class="section avoid-break">
              ${renderSectionTitle('Education', _style)}
              ${data.educations.map(edu => `
                <div class="educations-item">
                  <div class="job-header">
                    <div>
                      <span class="job-title">${escapeHtml(edu.university)}</span>
                      ${edu.degree ? `<span style="color:#d1d5db; margin: 0 6px;">|</span> <span class="company">${escapeHtml(edu.degree)}</span>` : ''}
                    </div>
                    <span class="date">${escapeHtml(edu.startDate)} – ${edu.current ? 'Present' : escapeHtml(edu.endDate || '')}</span>
                  </div>
                  ${edu.location ? `<div style="font-size:10px; color:#9ca3af;">${escapeHtml(edu.location)}</div>` : ''}
                </div>
              `).join('')}
            </div>
          ` : '';
      case 'custom':
        return data.customSections?.length ? `
            ${data.customSections.map(section => `
              <div class="section">
                ${renderSectionTitle(section.title, _style)}
                ${section.subsections.map(sub => `
                  <div class="experiences-item">
                    <div class="job-header">
                      <a class="job-title noUnderline" href="${escapeHtml(sub.url || '')}">${escapeHtml(sub.title || '')}</a>
                    </div>
                    <div class="summary">${escapeHtml(sub.content)}</div>
                  </div>
                `).join('')}
              </div>
            `).join('')}
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

  const fullSections = orderedSections.filter((section) => (section.side ?? 'full') === 'full');
  const leftSections = orderedSections.filter((section) => section.side === 'left');
  const rightSections = orderedSections.filter((section) => section.side === 'right');
  const hasAlignedColumns = leftSections.length > 0 || rightSections.length > 0;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${escapeHtml(data.profile.fullname)} - Resume</title>
      <style>${baseStyles}${minimalStyles}</style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${escapeHtml(data.profile.fullname)}</h1>
          <div class="contact-info">
             ${data.profile.email ? `<span class="contact-item">${escapeHtml(data.profile.email)}</span>` : ''}
             ${data.profile.phone ? `<span class="contact-item">${escapeHtml(data.profile.phone)}</span>` : ''}
             ${data.profile.location ? `<span class="contact-item">${escapeHtml(data.profile.location)}</span>` : ''}
             ${data.profile.links?.map(link => `<span class="contact-item"><a href="${link.url}" target="_blank">${escapeHtml(link.type)}</a></span>`).join('') || ''}
          </div>
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
