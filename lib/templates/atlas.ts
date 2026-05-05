import { ResumeData, ResumeStyle } from '@/types/types';
import { baseStyles } from './baseStyles';
import {
  escapeHtml,
  safeJoin,
  renderContactInfo,
  renderCustomSections,
  renderSectionTitle,
  getGroupedSkills,
  getFlatSkills,
  resolveSectionOrder,
} from './helpers';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function generateAtlasHTML(data: ResumeData, _style?: ResumeStyle): string {
  const groupedSkills = _style?.skillsGrouped !== false;
  const skillsByGroup = getGroupedSkills(data, _style);
  const flatSkills = getFlatSkills(data);

  const atlasStyles = `
    body { font-size: 10.5px; color: #0f172a; }
    .atlas-grid { display: grid; grid-template-columns: 0.78fr 1.22fr; gap: 18px; }
    .atlas-rail {
      background: #f8fafc;
      border: 1px solid ${_style?.lineColor ?? '#e2e8f0'};
      border-left: 4px solid ${_style?.accentColor ?? '#0f766e'};
      border-radius: 6px;
      padding: 12px 10px;
    }
    .atlas-main { padding-top: 2px; }
    .atlas-name { font-size: 23px; font-weight: 700; line-height: 1.1; color: #0f172a; letter-spacing: -0.3px; margin-bottom: 4px; }
    .atlas-role { font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.8px; color: ${_style?.accentColor ?? '#0f766e'}; font-weight: 600; margin-bottom: 8px; }
    .atlas-contacts .contact-info { justify-content: flex-start; gap: 8px; font-size: 10px; margin-top: 0; }
    .atlas-contacts .contact-item { display: inline-flex; }

    .section { margin-bottom: 12px; }
    .summary { font-size: 10.8px; color: #334155; line-height: 1.45; }
    .exp-item { margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px dashed ${_style?.lineColor ?? '#dbe3ec'}; }
    .exp-item:last-child { border-bottom: none; }
    .exp-head { display: flex; justify-content: space-between; gap: 10px; align-items: baseline; }
    .exp-title { font-size: 11.5px; font-weight: 700; color: #0f172a; }
    .exp-meta { font-size: 10px; color: #64748b; text-align: right; white-space: nowrap; }
    .exp-company { font-size: 10.7px; color: #334155; margin: 2px 0 3px; }

    .skills-wrap { display: flex; flex-wrap: wrap; gap: 5px; }
    .skill-pill {
      border: 1px solid ${_style?.lineColor ?? '#d9e1ea'};
      background: #ffffff;
      border-radius: 999px;
      padding: 2px 8px;
      font-size: 10px;
      color: ${_style?.accentColor ?? '#0f766e'};
      font-weight: 600;
    }
    .skill-group-title { font-size: 10px; font-weight: 700; color: #475569; margin-bottom: 4px; }
    .edu-item { margin-bottom: 8px; }
    .edu-title { font-size: 11px; font-weight: 700; color: #0f172a; }
    .edu-meta { font-size: 10px; color: #64748b; }

    @media (max-width: 760px) {
      .atlas-grid { grid-template-columns: 1fr; }
    }
  `;

  const renderSection = (key: string): string => {
    switch (key) {
      case 'summary':
        return data.profile.summary
          ? `<div class="section">${renderSectionTitle('Summary', _style)}<div class="summary">${escapeHtml(data.profile.summary)}</div></div>`
          : '';
      case 'skills':
        if (!data.skills?.length) return '';
        return `
          <div class="section">
            ${renderSectionTitle('Skills', _style)}
            ${groupedSkills
              ? safeJoin(skillsByGroup.map((group) => `
                <div style="margin-bottom:8px;">
                  ${group.type ? `<div class="skill-group-title">${escapeHtml(group.type)}</div>` : ''}
                  <div class="skills-wrap">${safeJoin((group.skills || []).map((skill) => `<span class="skill-pill">${escapeHtml(skill)}</span>`))}</div>
                </div>
              `))
              : `<div class="skills-wrap">${safeJoin(flatSkills.map((skill) => `<span class="skill-pill">${escapeHtml(skill)}</span>`))}</div>`
            }
          </div>
        `;
      case 'experience':
        if (!data.experiences?.length) return '';
        return `
          <div class="section">
            ${renderSectionTitle('Experience', _style)}
            ${safeJoin(data.experiences.map((exp) => `
              <div class="exp-item">
                <div class="exp-head">
                  <div class="exp-title">${escapeHtml(exp.title)}</div>
                  <div class="exp-meta">${escapeHtml(exp.startDate)} - ${exp.current ? 'Present' : escapeHtml(exp.endDate || '')}</div>
                </div>
                <div class="exp-company">${escapeHtml(exp.company)} | ${escapeHtml(exp.location)}</div>
                ${exp.responsibilities?.length ? `<ul class="responsibilities">${safeJoin(exp.responsibilities.slice(0, 6).map((r) => `<li>${escapeHtml(r)}</li>`))}</ul>` : ''}
              </div>
            `))}
          </div>
        `;
      case 'education':
        if (!data.educations?.length) return '';
        return `
          <div class="section">
            ${renderSectionTitle('Education', _style)}
            ${safeJoin(data.educations.map((edu) => `
              <div class="edu-item">
                <div class="edu-title">${escapeHtml(edu.degree)}</div>
                <div class="edu-meta">${escapeHtml(edu.university)} | ${escapeHtml(edu.location)}</div>
                <div class="edu-meta">${escapeHtml(edu.startDate)} - ${edu.current ? 'Present' : escapeHtml(edu.endDate || '')}</div>
              </div>
            `))}
          </div>
        `;
      case 'custom':
        return data.customSections?.length ? safeJoin(data.customSections.map((section) => renderCustomSections(section, false, _style))) : '';
      default:
        if (data.customSections?.length) {
          const section = data.customSections.find((s) => s.id === key);
          if (section) return renderCustomSections(section, false, _style);
        }
        return '';
    }
  };

  const orderedSections = resolveSectionOrder(
    _style?.sectionOrder,
    [
      { key: 'summary', side: 'left' },
      { key: 'skills', side: 'left' },
      { key: 'experience', side: 'right' },
      { key: 'education', side: 'right' },
      { key: 'custom', side: 'right' },
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
  <style>${baseStyles}${atlasStyles}</style>
</head>
<body>
  <div class="container">
    <div class="atlas-grid">
      <div class="atlas-rail">
        <div class="atlas-name">${escapeHtml(data.profile.fullname)}</div>
        ${data.experiences?.[0]?.title ? `<div class="atlas-role">${escapeHtml(data.experiences[0].title)}</div>` : ''}
        <div class="atlas-contacts"><div class="contact-info">${renderContactInfo(data)}</div></div>
        ${safeJoin(leftSections.map((section) => renderSection(section.key)))}
      </div>
      <div class="atlas-main">
        ${safeJoin(fullSections.map((section) => renderSection(section.key)))}
        ${safeJoin(rightSections.map((section) => renderSection(section.key)))}
      </div>
    </div>
  </div>
</body>
</html>
`;
}
