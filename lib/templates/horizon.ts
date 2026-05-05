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
export function generateHorizonHTML(data: ResumeData, _style?: ResumeStyle): string {
  const groupedSkills = _style?.skillsGrouped !== false;
  const skillsByGroup = getGroupedSkills(data, _style);
  const flatSkills = getFlatSkills(data);

  const horizonStyles = `
    body { font-size: 10.5px; color: #0f172a; }
    .hero {
      background: linear-gradient(135deg, ${_style?.accentColor ?? '#1d4ed8'} 0%, #0f172a 100%);
      color: #ffffff;
      margin-bottom: 14px;
    }
    .hero-inner { padding: 18px 20px 16px; }
    .hero h1 { font-size: 27px; line-height: 1.1; margin: 0; font-weight: 800; letter-spacing: -0.6px; }
    .hero-sub { font-size: 10.5px; letter-spacing: 0.8px; text-transform: uppercase; margin-top: 4px; color: rgba(255,255,255,0.85); }
    .hero .contact-info { margin-top: 8px; justify-content: flex-start; gap: 9px; font-size: 10px; }
    .hero .contact-item, .hero a { color: rgba(255,255,255,0.92); text-decoration: none; }

    .section { margin-bottom: 12px; }
    .card {
      border: 1px solid ${_style?.lineColor ?? '#dbe5ef'};
      border-radius: 7px;
      padding: 9px 10px;
      margin-bottom: 8px;
      background: #ffffff;
    }
    .summary { font-size: 10.8px; line-height: 1.5; color: #334155; }
    .meta { font-size: 9.8px; color: #64748b; }
    .title { font-size: 11.5px; font-weight: 700; color: #0f172a; }

    .chip-row { display: flex; flex-wrap: wrap; gap: 6px; }
    .chip {
      font-size: 10px;
      font-weight: 600;
      color: ${_style?.accentColor ?? '#1d4ed8'};
      border: 1px solid ${_style?.lineColor ?? '#dbe5ef'};
      background: #f8fbff;
      border-radius: 4px;
      padding: 3px 7px;
    }
    .group-title { font-size: 10px; font-weight: 700; color: #475569; margin-bottom: 4px; }
  `;

  const renderSection = (key: string): string => {
    switch (key) {
      case 'summary':
        return data.profile.summary
          ? `<div class="section">${renderSectionTitle('Summary', _style)}<div class="card"><div class="summary">${escapeHtml(data.profile.summary)}</div></div></div>`
          : '';
      case 'experience':
        if (!data.experiences?.length) return '';
        return `
          <div class="section">
            ${renderSectionTitle('Experience', _style)}
            ${safeJoin(data.experiences.map((exp) => `
              <div class="card">
                <div style="display:flex; justify-content:space-between; gap:10px; align-items:baseline;">
                  <div class="title">${escapeHtml(exp.title)}</div>
                  <div class="meta">${escapeHtml(exp.startDate)} - ${exp.current ? 'Present' : escapeHtml(exp.endDate || '')}</div>
                </div>
                <div class="meta" style="margin:2px 0 4px;">${escapeHtml(exp.company)} | ${escapeHtml(exp.location)}</div>
                ${exp.responsibilities?.length ? `<ul class="responsibilities">${safeJoin(exp.responsibilities.slice(0, 6).map((item) => `<li>${escapeHtml(item)}</li>`))}</ul>` : ''}
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
              <div class="card">
                <div class="title">${escapeHtml(edu.degree)}</div>
                <div class="meta">${escapeHtml(edu.university)} | ${escapeHtml(edu.location)}</div>
                <div class="meta">${escapeHtml(edu.startDate)} - ${edu.current ? 'Present' : escapeHtml(edu.endDate || '')}</div>
              </div>
            `))}
          </div>
        `;
      case 'skills':
        if (!data.skills?.length) return '';
        return `
          <div class="section">
            ${renderSectionTitle('Skills', _style)}
            <div class="card">
              ${groupedSkills
                ? safeJoin(skillsByGroup.map((group) => `
                  <div style="margin-bottom:8px;">
                    ${group.type ? `<div class="group-title">${escapeHtml(group.type)}</div>` : ''}
                    <div class="chip-row">${safeJoin((group.skills || []).map((skill) => `<span class="chip">${escapeHtml(skill)}</span>`))}</div>
                  </div>
                `))
                : `<div class="chip-row">${safeJoin(flatSkills.map((skill) => `<span class="chip">${escapeHtml(skill)}</span>`))}</div>`
              }
            </div>
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
      { key: 'summary', side: 'full' },
      { key: 'experience', side: 'full' },
      { key: 'education', side: 'full' },
      { key: 'skills', side: 'full' },
      { key: 'custom', side: 'full' },
    ],
    data,
  );

  const fullSections = orderedSections.filter((section) => (section.side ?? 'full') === 'full');
  const leftSections = orderedSections.filter((section) => section.side === 'left');
  const rightSections = orderedSections.filter((section) => section.side === 'right');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(data.profile.fullname)} - Resume</title>
  <style>${baseStyles}${horizonStyles}</style>
</head>
<body>
  <div class="container">
    <div class="hero full-bleed">
      <div class="hero-inner full-bleed-inner">
        <h1>${escapeHtml(data.profile.fullname)}</h1>
        ${data.experiences?.[0]?.title ? `<div class="hero-sub">${escapeHtml(data.experiences[0].title)}</div>` : ''}
        <div class="contact-info">${renderContactInfo(data)}</div>
      </div>
    </div>

    ${safeJoin(fullSections.map((section) => renderSection(section.key)))}

    ${(leftSections.length || rightSections.length) ? `
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
