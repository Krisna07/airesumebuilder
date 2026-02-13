import { ResumeData } from "@/types/types";
import { baseStyles } from "./baseStyles";
import { escapeHtml, safeJoin, renderExperiences, renderEducations, renderContactInfo, renderCustomSections } from './helpers';

// Creative Compact layout (Template 02 v2)
// - Slim identity bar
// - Unified section styling
// - Condensed experience entries without card UI
// - Skills grouped + overflow indicator
// - Custom sections grouped under single heading
const template02Styles = `
  .identity { display:flex; align-items:flex-start; justify-content:space-between; padding:8px 4px 10px; border-bottom:3px solid #6366f1; margin-bottom:12px; }
  .identity h1 { font-size:24px; font-weight:700; letter-spacing:-0.5px; margin:0; color:#111827; }
  .contact-inline { font-size:11px; display:flex; flex-wrap:wrap; gap:10px; justify-content:flex-end; max-width:60%; }
  .section { margin-bottom:14px; }
  .section-title { font-size:11.5px; font-weight:600; letter-spacing:0.7px; text-transform:uppercase; color:#111827; margin:0 0 6px; position:relative; }
  .section-title:after { content:''; display:block; height:2px; width:42px; background:#6366f1; margin-top:4px; border-radius:2px; }
  .summary { font-size:11.5px; line-height:1.5; color:#334155; background:#f5f7fa; border:1px solid #e2e8f0; padding:8px 10px; border-radius:6px; }
  .split { display:grid; grid-template-columns:1fr 0.95fr; gap:18px; }
  .skills-group { margin-bottom:8px; }
  .skills-label { font-size:10.5px; font-weight:600; color:#4f46e5; margin-bottom:4px; }
  .skills-row { display:flex; flex-wrap:wrap; gap:4px 6px; }
  .skill-chip { font-size:10.5px; padding:3px 7px; background:#eef2ff; border:1px solid #e0e7ff; color:#3730a3; border-radius:4px; font-weight:500; }
  .skill-overflow { font-size:10px; color:#64748b; font-style:italic; }
  .exp-item { position:relative; padding-left:14px; margin-bottom:10px; }
  .exp-item:before { content:''; position:absolute; left:0; top:4px; bottom:4px; width:3px; background:#6366f1; border-radius:2px; }
  .exp-item .job-title { font-size:12.5px; font-weight:600; color:#1f2937; }
  .exp-item .location-date { font-size:10.5px; color:#64748b; display:flex; justify-content:space-between; margin-top:2px; }
  .education-block { position:relative; padding-left:12px; margin-bottom:8px; }
  .education-block:before { content:''; position:absolute; left:0; top:4px; bottom:4px; width:3px; background:#4f46e5; border-radius:2px; }
  .custom-section { margin-bottom:14px; }
  .custom-subsection { background:#fff; border:1px solid #e2e8f0; padding:6px 8px; border-left:3px solid #6366f1; border-radius:5px; margin-bottom:6px; }
  @media (max-width:760px){ .split { grid-template-columns:1fr; } .contact-inline { justify-content:flex-start; max-width:100%; margin-top:6px; } }
`;

export function generatetemplate02HTML(data: ResumeData): string {
  const allGroups = data.skills || [];
  const techGroups = allGroups.filter(g => g.type?.toLowerCase() !== 'soft skills');
  const softGroups = allGroups.filter(g => g.type?.toLowerCase() === 'soft skills');
  const flatten = (groups: typeof allGroups) => groups.flatMap(g => g.skills || []);
  const techSkills = flatten(techGroups);
  const softSkills = flatten(softGroups);
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
    ${data.profile.summary ? `
      <div class="section">
        <div class="section-title">Summary</div>
        <div class="summary">${escapeHtml(data.profile.summary)}</div>
      </div>` : ''}
    <div class="split">
      <div>
        ${data.experiences?.length ? `
          <div class="section">
            <div class="section-title">Experience</div>
            ${safeJoin(data.experiences.slice(0, 7).map(exp => `<div class="exp-item">${renderExperiences(exp)}</div>`))}
          </div>` : ''}
        ${data.educations?.length ? `
          <div class="section">
            <div class="section-title">Education</div>
            ${safeJoin(data.educations.slice(0, 4).map(e => `<div class="education-block">${renderEducations(e)}</div>`))}
          </div>` : ''}
      </div>
      <div>
        ${data.skills?.length ? `
          <div class="section">
            <div class="section-title">Skills</div>
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
          </div>` : ''}
        ${data.customSections?.length ? `
          <div class="section">
            ${safeJoin(data.customSections.slice(0, 6).map(s => renderCustomSections(s)))}
          </div>` : ''}
      </div>
    </div>
  </div>
</body>
</html>
`;
}