import { ResumeData } from '@/types/types';
import { baseStyles } from './baseStyles';
import { escapeHtml, safeJoin, renderExperiences, renderEducations, renderContactInfo } from './helpers';

const classicStyles = `
  .header {  border-radius: 6px; }
  .header h1 { font-size: 24px; font-weight: 700;  letter-spacing: -0.5px; }
  .section-title { color: #8b5cf6; border-color: #8b5cf6; font-weight: 700; }
  .skill-tag { color: #6d28d9; border-color: #c4b5fd; font-weight: 500; font-size:10px: line-height: 1.4; }
  .experiences-item { border-left: 3px solid #8b5cf6; padding-left: 15px; margin-left: 5px; }
  .educations-item { border-left: 3px solid #3b82f6; padding-left: 15px; margin-left: 5px; }
`;

export function generateClassicHTML(data: ResumeData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${escapeHtml(data.profile.fullname)} - Resume</title>
      <style>${baseStyles}${classicStyles}</style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${escapeHtml(data.profile.fullname)}</h1>
          <div class="contact-info">${renderContactInfo(data)}</div>
          ${data.profile.summary ? `<div class="summary">${escapeHtml(data.profile.summary)}</div>` : ''}
        </div>
        ${data.skills?.length ? `
          <div class="section">
            <div class="section-title">Skills</div>
            ${safeJoin(data.skills.map(group => `
              <div class="avoid-break" style=" display: flex; align-items: start; gap: 10px;  border-bottom: 1px solid #e5e7eb; padding:3px">
                ${group.type ? `<div style="width:20%; font-weight: 600; display:flex; align-items:start; justify-content:space-between;">${escapeHtml(group.type)} <span>:</span> </div>` : ''}
                ${(group.skills && group.skills.length) ? `<div style="width:80%" class="skills-container">${safeJoin(group.skills!.map(s => `<span class="skill-tag">${escapeHtml(s)}${group.skills!.indexOf(s) !== group.skills!.length-1 ? ',':''} </span>`))}</div>` : ''}
              </div>
            `))}
          </div>
        ` : ''}
        ${data.experiences?.length ? `
          <div class="section">
            <div class="section-title">Professional Experience</div>
            ${safeJoin(data.experiences.slice(0, 4).map(renderExperiences))}
          </div>
        ` : ''}
        ${data.educations?.length ? `
          <div class="section">
            <div class="section-title">Education</div>
            ${safeJoin(data.educations.slice(0, 3).map(renderEducations))}
          </div>
        ` : ''}
        
        ${data.certificates?.length ? `
          <div class="section">
            <div class="section-title">Certifications</div>
            ${safeJoin(data.certificates.slice(0, 3).map(cert => `
              <div class="certificate-item avoid-break">
                <div class="job-title">${escapeHtml(cert.title)}</div>
                <div class="company">${escapeHtml(cert.issued_by)}</div>
                <div class="job-date">${escapeHtml(cert.year)}</div>
              </div>
            `))}
          </div>
        ` : ''}
      </div>
    </body>
    </html>
  `;
}
