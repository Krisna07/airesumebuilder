import { ResumeData } from "@/types/types";
import { baseStyles } from "./baseStyles";
import { escapeHtml, safeJoin, renderExperiences, renderEducations, renderContactInfo, renderCustomSections } from './helpers';

const template02Styles = `
  body { font-family: 'Inter', system-ui, Arial, sans-serif; }
  .banner { background: linear-gradient(90deg,#0f172a,#0e7490); color:#fff; padding:32px 34px 24px; border-radius:18px; margin-bottom:26px; }
  .banner h1 { margin:0; font-size:34px; line-height:1.05; letter-spacing:-1px; font-weight:700; }
  .banner .role { margin-top:6px; font-size:14px; letter-spacing:1px; text-transform:uppercase; font-weight:600; opacity:.9; }
  .contact-inline { margin-top:14px; font-size:12px; display:flex; flex-wrap:wrap; gap:14px; opacity:.95; }
  .section { margin-bottom:26px; }
  .section-title { font-size:13px; font-weight:700; letter-spacing:1.5px; color:#0f172a; text-transform:uppercase; margin-bottom:10px; position:relative; padding-left:10px; }
  .section-title:before { content:''; position:absolute; left:0; top:2px; bottom:2px; width:4px; border-radius:2px; background:linear-gradient(#0284c7,#0ea5e9); }
  .summary { font-size:14px; line-height:1.6; color:#334155; }
  .tags { display:flex; flex-wrap:wrap; gap:8px; }
  .tag { background:#f1f5f9; color:#0f172a; border:1px solid #e2e8f0; font-size:11px; padding:5px 9px; border-radius:20px; font-weight:500; }
  .grid-two { display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:24px; }
  .experiences-item { border:1px solid #e2e8f0; border-radius:10px; padding:10px 14px 8px; background:#fff; box-shadow:0 1px 2px rgba(0,0,0,0.04); }
  .experiences-item .job-title { font-size:13.5px; font-weight:600; }
  .experiences-item .company { font-size:12px; color:#475569; }
  .experiences-item .job-date { font-size:11px; color:#64748b; margin-top:2px; }
  .certificate-item { font-size:12.5px; margin-bottom:6px; }
  .edu-card { background:#fff; border:1px solid #e2e8f0; padding:12px 14px; border-radius:10px; }
  @media (max-width:680px){
    .banner { padding:26px 22px 20px; }
    .banner h1 { font-size:28px; }
  }
`;

export function generatetemplate02HTML(data: ResumeData): string {
  const skills = data.skills?.flatMap(g => g.skills) || [];
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>${escapeHtml(data.profile.fullname)} - Resume</title>
<style>${baseStyles}${template02Styles}</style>
</head>
<body>
  <div class="container" style="max-width:900px;">
    <div class="banner">
      <h1>${escapeHtml(data.profile.fullname)}</h1>
      <div class="contact-inline">${renderContactInfo(data)}</div>
    </div>

    ${data.profile.summary ? `
      <div class="section">
        <div class="section-title">Professional Summary</div>
        <div class="summary">${escapeHtml(data.profile.summary)}</div>
      </div>` : ""}

    ${skills.length ? `
      <div class="section">
        <div class="section-title">Core Skills</div>
        <div class="tags">
          ${safeJoin(skills.slice(0,40).map(s => `<span class="tag">${escapeHtml(s)}</span>`))}
        </div>
      </div>` : ""}

    ${data.experiences?.length ? `
      <div class="section">
        <div class="section-title">Experience</div>
        <div class="grid-two">
          ${safeJoin(data.experiences.slice(0,6).map(renderExperiences))}
        </div>
      </div>` : ""}

    ${data.educations?.length ? `
      <div class="section">
        <div class="section-title">Education</div>
        <div class="grid-two">
          ${safeJoin(data.educations.slice(0,3).map(renderEducations))}
        </div>
      </div>` : ""}

    ${data.customSections?.length ? `
      <div class="section">
        ${safeJoin(data.customSections.slice(0, 6).map(renderCustomSections))}
      </div>` : ""}
  </div>
</body>
</html>
`;
}