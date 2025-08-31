import { ResumeData } from '@/types/types';
import { baseStyles } from './baseStyles';
import { escapeHtml, safeJoin, renderExperiences, renderEducations, renderContactInfo } from './helpers';

const minimalStyles = `
  .header { border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }
  .header h1 { font-size: 22px; text-align:center; font-weight: 600; letter-spacing: -0.5px; }
  .section-title { color: #111827; border-color: #e5e7eb; font-weight: 600; }
  .skill-tag { color: #374151; border-color: #e5e7eb; border-right: 1px solid #e5e7eb; padding-right:6px; font-size:11px: line-height: 1.4; }
  .experiences-item, .educations-item { border-left: none; padding-left: 0; margin-left: 0; }
`;

export function generateMinimalHTML(data: ResumeData): string {
    const allTechicalSkills = data.skills
        ?.filter(group => group.type?.toLowerCase() !== 'soft skills')
        .flatMap(group => group.skills) || [];

    const nonTechnicalSkills = data.skills
        ?.filter(group => group.type?.toLowerCase() === 'soft skills')
        .flatMap(group => group.skills) || [];

    const allSkills = data.skills.map(g => g.skills).flat();
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${escapeHtml(data.profile.fullname)} - Resume</title>
      <style>${baseStyles}${minimalStyles}</style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${escapeHtml(data.profile.fullname)}</h1>
          <div class="contact-info">${renderContactInfo(data)}</div>
        </div>
        
          ${data.profile.summary ? ` <div class="section">
            <div class="section-title"> Summary</div>
             <div class="summary">${escapeHtml(data.profile.summary)}</div>
            </div>` : ''}
        ${data.skills?.length ? `
          <div class="section">
            <div class="section-title"> Skills</div>
        ${allTechicalSkills?.length
                ? `
                <div style="display: flex; flex-wrap: wrap; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; ">
                    <div class="job-title">Technical</div>
                    <div class="skills-container">${safeJoin(allTechicalSkills.map(s => `<span class="skill-tag">${escapeHtml(s)}</span>`))}</div>
                </div>
                  <div >
                    <div class="job-title">Soft skills</div>
                    <div class="skills-container">${safeJoin(nonTechnicalSkills.map(s => `<span class="skill-tag">${escapeHtml(s)}</span>`))}</div>
                </div>
                `
                : `  <div >
                    <div class="job-title">Soft skills</div>
                    <div class="skills-container">${safeJoin(allSkills.map(s => `<span class="skill-tag">${escapeHtml(s)}</span>`))}</div>
                </div>`
            }
           

           
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
