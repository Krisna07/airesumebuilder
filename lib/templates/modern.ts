import { ResumeData } from '@/types/types';
import { baseStyles } from './baseStyles';
import { escapeHtml, safeJoin, renderExperiences, renderEducations, renderContactInfo, renderCustomSections } from './helpers';

const modernStyles = `
  .header {padding: 0px; border-radius: 8px; margin-bottom: 8px; }
  .header h1 { font-size: 26px; font-weight: 700; margin-bottom: 10px; letter-spacing: -0.5px; }
  .section-title { color: #3b82f6; border-color: #3b82f6; font-weight: 700; }
  .skill-tag { background: linear-gradient(135deg, #dbeafe, #bfdbfe); color: #1e40af; border-color: #93c5fd; font-weight: 500;padding: 4px 8px; border-radius: 4px; font-size:10px: line-height: 1.4; }
  .experiences-item { border-left: 3px solid #3b82f6; padding-left: 15px; margin-left: 5px; }
  .educations-item { border-left: 3px solid #8b5cf6; padding-left: 15px; margin-left: 5px; }
`;

export function generateModernHTML(data: ResumeData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${escapeHtml(data.profile.fullname)} - Resume</title>
      <style>${baseStyles}${modernStyles}</style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${escapeHtml(data.profile.fullname)}</h1>
          <div class="contact-info">${renderContactInfo(data)}</div>
        </div>

        ${data.profile.summary ? `<div class="summary">${escapeHtml(data.profile.summary)}</div>` : ''}

       <div style="display: flex; gap:20px; justify-content: space-between;">
        <div>
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
        </div>
        <div> ${data.skills?.length ? `
          <div class="section">
            <div class="section-title">Technical Skills</div>
            ${safeJoin(data.skills.map(group => `
              <div style="margin-bottom: 12px;" class="avoid-break">
                ${group.type ? `<div style="font-weight: 600; margin-bottom: 6px; font-size: 11px;">${escapeHtml(group.type)}</div>` : ''}
                ${group.skills?.length ? `<div class="skills-container">${safeJoin(group.skills.slice(0, 8).map(s => `<span class="skill-tag">${escapeHtml(s)}</span>`))}</div>` : ''}
              </div>
            `))}
          </div>
        ` : ''}
        </div>
       </div>
       
       ${data.customSections?.length ? `
          <div class="section">
            ${safeJoin(data.customSections.slice(0, 3).map(renderCustomSections))}
          </div>
        ` : ''}
      
    </body>
    </html>
  `;
}
