import { ResumeData, ResumeStyle } from "@/types/types";
import { baseStyles } from "./baseStyles";
import { escapeHtml, safeJoin, renderExperiences, renderEducations, renderContactInfo, renderCustomSections, renderSectionTitle, resolveSectionOrder, getFlatSkills } from './helpers';


// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function generatetemplate02HTML(data: ResumeData, _style?: ResumeStyle): string {
  const template02Styles = `
    .identity { display:flex; align-items:flex-start; justify-content:space-between; padding:8px 4px 10px; border-bottom:3px solid ${_style?.accentColor ?? '#6366f1'}; margin-bottom:12px; }
    .identity h1 { font-size:24px; font-weight:700; letter-spacing:-0.5px; margin:0; color:#111827; }
    .contact-inline { font-size:11px; display:flex; flex-wrap:wrap; gap:10px; justify-content:flex-end; max-width:60%; }
    .section { margin-bottom:14px; }
    .summary { font-size:11.5px; line-height:1.5; color:#334155; background:#f5f7fa; border:1px solid #e2e8f0; padding:8px 10px; border-radius:6px; }
    .split { display:grid; grid-template-columns:1fr 0.95fr; gap:18px; }
    .skills-group { margin-bottom:8px; }
    .skills-label { font-size:10.5px; font-weight:600; color:${_style?.accentColor ?? '#4f46e5'}; margin-bottom:4px; }
    .skills-row { display:flex; flex-wrap:wrap; gap:4px 6px; }
    .skill-chip { font-size:10.5px; padding:3px 7px; background:#f8fafc; border:1px solid ${_style?.lineColor ?? '#e2e8f0'}; color:${_style?.accentColor ?? '#3730a3'}; border-radius:4px; font-weight:500; }
    .skill-overflow { font-size:10px; color:#64748b; font-style:italic; }
    .exp-item { position:relative; padding-left:14px; margin-bottom:10px; }
    .exp-item:before { content:''; position:absolute; left:0; top:4px; bottom:4px; width:3px; background:${_style?.accentColor ?? '#6366f1'}; border-radius:2px; }
    .exp-item .job-title { font-size:12.5px; font-weight:600; color:#1f2937; }
    .exp-item .location-date { font-size:10.5px; color:#64748b; display:flex; justify-content:space-between; margin-top:2px; }
    .education-block { position:relative; padding-left:12px; margin-bottom:8px; }
    .education-block:before { content:''; position:absolute; left:0; top:4px; bottom:4px; width:3px; background:${_style?.accentColor ?? '#4f46e5'}; border-radius:2px; }
    .custom-section { margin-bottom:14px; }
    .custom-subsection { background:#fff; border:1px solid ${_style?.lineColor ?? '#e2e8f0'}; padding:6px 8px; border-left:3px solid ${_style?.accentColor ?? '#6366f1'}; border-radius:5px; margin-bottom:6px; }
    @media (max-width:760px){ .split { grid-template-columns:1fr; } .contact-inline { justify-content:flex-start; max-width:100%; margin-top:6px; } }
  `;

  const allGroups = data.skills || [];
  const techGroups = allGroups.filter(g => g.type?.toLowerCase() !== 'soft skills');
  const softGroups = allGroups.filter(g => g.type?.toLowerCase() === 'soft skills');
  const flatten = (groups: typeof allGroups) => groups.flatMap(g => g.skills || []);
  const techSkills = flatten(techGroups);
  const softSkills = flatten(softGroups);
  const flatSkills = getFlatSkills(data);
  const groupedSkills = _style?.skillsGrouped !== false;
  const renderSectionBlock = (key: string) => {
    switch (key) {
      case 'summary':
        if (!data.profile.summary) return '';
        return `
          <div class="section">
            ${renderSectionTitle('Summary', _style)}
            <div class="summary">${escapeHtml(data.profile.summary)}</div>
          </div>
        `;
      case 'skills':
        if (!data.skills?.length) return '';
        if (!groupedSkills) {
          return `
            <div class="section">
              ${renderSectionTitle('Skills', _style)}
              <div class="skills-row">${safeJoin(flatSkills.map(s => `<span class="skill-chip">${escapeHtml(s)}</span>`))}</div>
            </div>
          `;
        }
        return `
          <div class="section">
            ${renderSectionTitle('Skills', _style)}
            ${techSkills.length ? `
              <div class="skills-group">
                <div class="skills-label">Technical</div>
                <div class="skills-row">${safeJoin(techSkills.map(s => `<span class="skill-chip">${escapeHtml(s)}</span>`))}</div>
              </div>` : ''}
            ${softSkills.length ? `
              <div class="skills-group">
                <div class="skills-label">Soft</div>
                <div class="skills-row">${safeJoin(softSkills.map(s => `<span class="skill-chip">${escapeHtml(s)}</span>`))}</div>
              </div>` : ''}
          </div>
        `;
      case 'education':
        if (!data.educations?.length) return '';
        return `
          <div class="section">
            ${renderSectionTitle('Education', _style)}
            ${safeJoin(data.educations.slice(0, 4).map(e => `<div class="education-block">${renderEducations(e)}</div>`))}
          </div>
        `;
      case 'experience':
        if (!data.experiences?.length) return '';
        return `
          <div class="section">
            ${renderSectionTitle('Experience', _style)}
            ${safeJoin(data.experiences.slice(0, 7).map(exp => `<div class="exp-item">${renderExperiences(exp)}</div>`))}
          </div>
        `;
      case 'custom':
        if (!data.customSections?.length) return '';
        return `
          <div class="section">
            ${safeJoin(data.customSections.slice(0, 6).map(s => renderCustomSections(s, false, _style)))}
          </div>
        `;
      default:
        if (data.customSections?.length) {
          const section = data.customSections.find((s) => s.id === key);
          if (section) return renderCustomSections(section, false, _style);
        }
        return '';
    }
  };

  const sectionsToRender = resolveSectionOrder(
    _style?.sectionOrder,
    [
      { key: 'summary', side: 'full' },
      { key: 'experience', side: 'left' },
      { key: 'education', side: 'left' },
      { key: 'skills', side: 'right' },
      { key: 'custom', side: 'right' },
    ],
    data,
  );

  const leftSections = sectionsToRender.filter(s => s.side === 'left');
  const rightSections = sectionsToRender.filter(s => s.side === 'right');
  const fullSections = sectionsToRender.filter(s => s.side === 'full' || !s.side);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(data.profile.fullname)} - Resume</title>
  <style>${baseStyles}${template02Styles}</style>
</head>
<body>
  <div class="container" style="max-width:900px;">
    <div class="identity">
      <div>
        <h1>${escapeHtml(data.profile.fullname)}</h1>
      </div>
      <div class="contact-inline">${renderContactInfo(data)}</div>
    </div>

    ${fullSections.length > 0 ? `
      <div class="full-width-sections">
        ${safeJoin(fullSections.map(s => renderSectionBlock(s.key)))}
      </div>
    ` : ''}

    <div class="split">
      <div>
        ${safeJoin(leftSections.map(s => renderSectionBlock(s.key)))}
      </div>
      <div>
        ${safeJoin(rightSections.map(s => renderSectionBlock(s.key)))}
      </div>
    </div>
  </div>
</body>
</html>
`;
}