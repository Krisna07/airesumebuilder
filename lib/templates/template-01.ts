import { ResumeData, ResumeStyle } from "@/types/types";
import { baseStyles } from "./baseStyles";
import { escapeHtml, safeJoin, renderExperiences, renderEducations, renderContactInfo, renderCustomSections, renderSectionTitle, resolveSectionOrder, getFlatSkills } from './helpers';

// Compact Professional layout (Template 01 v2)
// - Fluid 2-column grid
// - Unified section title styling consistent with modern/classic
// - Skills grouped & truncated with overflow indicator
// - Experience timeline refined
// - Custom sections integrated at bottom

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function generatetemplate01HTML(data: ResumeData, _style?: ResumeStyle): string {
  const template01Styles = `
  .layout { display: grid; grid-template-columns: 0.85fr 1.15fr; gap: 18px; }
  .header { padding-bottom: 6px; margin-bottom: 10px; border-bottom: 3px solid ${_style?.accentColor ?? '#0ea5e9'}; }
  .header h1 { font-size: 24px; font-weight: 700; letter-spacing: -0.5px; margin:0; color:#0f172a; }
  .role-line { font-size:11.5px; text-transform:uppercase; letter-spacing:0.8px; color:${_style?.accentColor ?? '#0369a1'}; font-weight:600; margin-top:4px; }
  .section { margin-bottom: 12px; }
  .summary { font-size: 11.5px; line-height: 1.45; color:#334155; background:#f8fafc; border:1px solid #e2e8f0; padding:8px 10px; border-radius:6px; }
  .skills-group { margin-bottom:8px; }
  .skills-label { font-size:10.5px; font-weight:600; color:${_style?.accentColor ?? '#0369a1'}; margin-bottom:4px; letter-spacing:0.5px; }
  .skills-row { display:flex; flex-wrap:wrap; gap:5px; }
  .skill-pill { font-size:10.5px; padding:3px 7px; background:#f1f5f9; border:1px solid ${_style?.lineColor ?? '#e2e8f0'}; color:${_style?.accentColor ?? '#075985'}; border-radius:4px; font-weight:500; line-height:1.2; }
  .skill-overflow { font-size:10px; color:#64748b; font-style:italic; }
  .timeline-item { position:relative; padding-left:14px; margin-bottom:12px; }
  .timeline-item:before { content:""; position:absolute; left:0; top:4px; bottom:4px; width:3px; background:${_style?.accentColor ?? '#0ea5e9'}; border-radius:2px; }
  .timeline-item .job-title { font-size:12.5px; font-weight:600; color:#1f2937; }
  .timeline-item .location-date { font-size:10.5px; color:#64748b; display:flex; justify-content:space-between; margin-top:2px; }
  .timeline-item ul.responsibilities { margin-top:4px; }
  .education-block { position:relative; padding-left:14px; margin-bottom:10px; }
  .education-block:before { content:""; position:absolute; left:0; top:4px; bottom:4px; width:3px; background:${_style?.accentColor ?? '#0369a1'}; border-radius:2px; }
  .custom-section { margin-bottom:12px; }
  .custom-subsection { background:#ffffff; border:1px solid ${_style?.lineColor ?? '#e2e8f0'}; padding:6px 8px; border-left:3px solid ${_style?.accentColor ?? '#0ea5e9'}; border-radius:5px; margin-bottom:6px; }
  .footer-space { height:6px; }
  @media print { .avoid-break { break-inside: avoid; } }
  @media (max-width:760px){ .layout { grid-template-columns: 1fr; } }
`;

  const techGroups = data.skills?.filter(g => g.type?.toLowerCase() !== 'soft skills') || [];
  const softGroups = data.skills?.filter(g => g.type?.toLowerCase() === 'soft skills') || [];
  const flatSkills = getFlatSkills(data);
  const groupedSkills = _style?.skillsGrouped !== false;
  // Flatten skills for truncation logic
  const flatten = (groups: typeof techGroups) => groups.flatMap(g => g.skills || []);
  const techSkills = flatten(techGroups);
  const softSkills = flatten(softGroups);
  // Disabled truncation for better content visibility
  // const truncate = (arr: string[], max: number) => ({ visible: arr.slice(0, max), hidden: arr.length > max ? arr.length - max : 0 });
  const techView = { visible: techSkills, hidden: 0 };
  const softView = { visible: softSkills, hidden: 0 };

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
              <div class="skills-row">${safeJoin(flatSkills.map(s => `<span class="skill-pill">${escapeHtml(s)}</span>`))}</div>
            </div>
          `;
        }
        return `
          <div class="section">
            ${renderSectionTitle('Skills', _style)}
            ${techSkills.length ? `
              <div class="skills-group">
                <div class="skills-label">Technical</div>
                <div class="skills-row">${safeJoin(techView.visible.map(s => `<span class="skill-pill">${escapeHtml(s)}</span>`))} ${techView.hidden ? `<span class="skill-overflow">+${techView.hidden} more</span>` : ''}</div>
              </div>` : ''}
            ${softSkills.length ? `
              <div class="skills-group">
                <div class="skills-label">Soft</div>
                <div class="skills-row">${safeJoin(softView.visible.map(s => `<span class="skill-pill">${escapeHtml(s)}</span>`))} ${softView.hidden ? `<span class="skill-overflow">+${softView.hidden} more</span>` : ''}</div>
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
            ${safeJoin(data.experiences.slice(0, 7).map(exp => `<div class="timeline-item avoid-break">${renderExperiences(exp)}</div>`))}
          </div>
        `;
      case 'custom':
        if (!data.customSections?.length) return '';
        return `
          <div class="section">
            ${safeJoin(data.customSections.map(section => renderCustomSections(section, false, _style)))}
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
      { key: 'summary', side: 'left' },
      { key: 'skills', side: 'left' },
      { key: 'education', side: 'left' },
      { key: 'experience', side: 'right' },
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
  <style>${baseStyles}${template01Styles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${escapeHtml(data.profile.fullname)}</h1>
      ${data.experiences?.[0]?.title ? `<div class="role-line">${escapeHtml(data.experiences[0].title)}</div>` : ''}
      <div class="contact-info">${renderContactInfo(data)}</div>
    </div>
    
    ${fullSections.length > 0 ? `
      <div class="full-width-sections">
        ${safeJoin(fullSections.map(s => renderSectionBlock(s.key)))}
      </div>
    ` : ''}

    <div class="layout">
      <div>
        ${safeJoin(leftSections.map(s => renderSectionBlock(s.key)))}
      </div>
      <div>
        ${safeJoin(rightSections.map(s => renderSectionBlock(s.key)))}
      </div>
    </div>
    <div class="footer-space"></div>
  </div>
</body>
</html>
`;
}