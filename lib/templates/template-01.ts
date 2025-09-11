import { ResumeData } from "@/types/types";
import { baseStyles } from "./baseStyles";
import { escapeHtml, safeJoin, renderExperiences, renderEducations, renderContactInfo } from "./helpers";

const template01Styles = `
  body { font-family: Inter, system-ui, Arial, sans-serif; }
  .layout { display: grid; grid-template-columns: 250px 1fr; gap: 28px; }
  .sidebar { border-right: 2px solid #e5e7eb; padding-right: 18px; }
  .header { grid-column: 1 / -1; padding-bottom: 10px; border-bottom: 4px solid #0ea5e9; }
  .header h1 { font-size: 30px; font-weight: 700; letter-spacing: -0.5px; margin:0; }
  .role-line { font-size:13px; text-transform:uppercase; letter-spacing:1px; color:#0369a1; font-weight:600; margin-top:4px; }
  .section { margin-bottom: 18px; }
  .section-title { font-size: 12px; letter-spacing: 1.2px; font-weight: 700; color:#0f172a; text-transform: uppercase; border-bottom:1px solid #e2e8f0; padding-bottom:4px; margin-bottom:10px; }
  .summary { font-size: 13px; line-height: 1.55; color:#334155; }
  .chip-wrap { display:flex; flex-wrap:wrap; gap:6px; }
  .chip { font-size:11px; padding:4px 8px; border:1px solid #cbd5e1; background:#f1f5f9; border-radius:6px; font-weight:500; }
  .split-skill-group { margin-bottom:10px; }
  .split-skill-group .label { font-size:11px; font-weight:600; color:#0369a1; margin-bottom:4px; }
  .experiences-item { border-left:3px solid #0ea5e9; padding-left:10px; margin-bottom:14px; }
  .experiences-item .job-title { font-weight:600; font-size:13.5px; }
  .experiences-item .company { font-size:12px; color:#475569; }
  .experiences-item .job-date { font-size:11px; color:#64748b; margin-top:2px; }
  .certificate-item { margin-bottom:8px; }
  .edu-item { margin-bottom:10px; }
  .skills-inline { font-size:11.5px; line-height:1.5; }
  .footer-space { height:8px; }
  @media (max-width:760px){
    .layout { grid-template-columns: 1fr; }
    .sidebar { border-right:none; padding-right:0; border-bottom:2px solid #e5e7eb; padding-bottom:12px; margin-bottom:10px; }
  }
`;

export function generatetemplate01HTML(data: ResumeData): string {
  const tech = data.skills?.filter(g => g.type?.toLowerCase() !== "soft skills").flatMap(g => g.skills) || [];
  const soft = data.skills?.filter(g => g.type?.toLowerCase() === "soft skills").flatMap(g => g.skills) || [];
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
      ${data.experiences[0].title ? `<div class="role-line">${escapeHtml(data.experiences[0].title)}</div>` : ""}
      <div class="contact-info" style="margin-top:6px;">${renderContactInfo(data)}</div>
    </div>
    <div class="layout">
      <div class="sidebar">
        ${data.profile.summary ? `
          <div class="section">
            <div class="section-title">Summary</div>
            <div class="summary">${escapeHtml(data.profile.summary)}</div>
          </div>` : ""}

        ${data.skills?.length ? `
          <div class="section">
            <div class="section-title">Skills</div>
            ${tech.length ? `
              <div class="split-skill-group">
                <div class="label">Technical</div>
                <div class="chip-wrap">
                  ${safeJoin(tech.map(s => `<span class="chip">${escapeHtml(s)}</span>`))}
                </div>
              </div>` : ""}
            ${soft.length ? `
              <div class="split-skill-group">
                <div class="label">Soft</div>
                <div class="chip-wrap">
                  ${safeJoin(soft.map(s => `<span class="chip">${escapeHtml(s)}</span>`))}
                </div>
              </div>` : ""}
          </div>` : ""}

        ${data.educations?.length ? `
          <div class="section">
            <div class="section-title">Education</div>
            ${safeJoin(data.educations.slice(0,3).map(renderEducations))}
          </div>` : ""}

        ${data.certificates?.length ? `
          <div class="section">
            <div class="section-title">Certifications</div>
            ${safeJoin(data.certificates.slice(0,5).map(c => `
              <div class="certificate-item">
                <div class="job-title">${escapeHtml(c.title)}</div>
                <div class="company">${escapeHtml(c.issued_by)}</div>
                <div class="job-date">${escapeHtml(c.year)}</div>
              </div>`))}
          </div>` : ""}
      </div>
      <div>
        ${data.experiences?.length ? `
          <div class="section">
            <div class="section-title">Experience</div>
            ${safeJoin(data.experiences.slice(0,6).map(renderExperiences))}
          </div>` : ""}
      </div>
    </div>
    <div class="footer-space"></div>
  </div>
</body>
</html>
`;
}