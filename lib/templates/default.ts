import { ResumeData } from '@/types/types';
import { baseStyles } from './baseStyles';
import { escapeHtml, safeJoin, renderExperiences, renderEducations, renderContactInfo } from './helpers';

const defaultStyles = `
  .header { border-bottom: 2px solid #3b82f6; margin-bottom: 18px; padding-bottom: 8px; }
  .header h1 { font-size: 20px; font-weight: 600; margin-bottom: 6px; letter-spacing: -0.5px; }
  .section-title { color: #3b82f6; border-color: #3b82f6; font-weight: 600; }
  .skill-tag { background: #dbeafe; color: #1e40af; border-color: #93c5fd; font-weight: 500; }
  .experiences-item, .educations-item { border-left: none; padding-left: 0; margin-left: 0; }
`;

export function generateDefaultHTML(data: ResumeData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${escapeHtml(data.profile.fullname)} - Resume</title>
      <style>${baseStyles}${defaultStyles}</style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${escapeHtml(data.profile.fullname)} - Default</h1>
          <div class="contact-info">${renderContactInfo(data)}</div>
          ${data.profile.summary ? `<div class="summary">${escapeHtml(data.profile.summary)}</div>` : ''}
        </div>
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
        ${data.skills?.length ? `
          <div class="section">
            <div class="section-title">Technical Skills</div>
            ${safeJoin(data.skills.map(group => `
              <div style="margin-bottom: 12px;">
                ${group.type ? `<div style="font-weight: 600; margin-bottom: 6px; font-size: 11px;">${escapeHtml(group.type)}</div>` : ''}
                ${group.skills?.length ? `<div class="skills-container">${safeJoin(group.skills.slice(0, 8).map(s => `<span class="skill-tag">${escapeHtml(s)}</span>`))}</div>` : ''}
              </div>
            `))}
          </div>
        ` : ''}
        ${data.certificates?.length ? `
          <div class="section">
            <div class="section-title">Certifications</div>
            ${safeJoin(data.certificates.slice(0, 3).map(cert => `
              <div class="certificate-item">
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
