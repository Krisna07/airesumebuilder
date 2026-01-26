import { ResumeData } from '@/types/types';
import { baseStyles } from './baseStyles';
import { escapeHtml, safeJoin, renderContactInfo, renderCustomSections } from './helpers';

const defaultStyles = `
  /* High density overrides for Standard Template */
  body { font-size: 10.5px; line-height: 1.35; color: #111827; }
  .header { border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px; }
  .header h1 { font-size: 28px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; line-height: 1.1; color: #000; }
  .contact-info { margin-top: 4px; justify-content: flex-start; gap: 12px; font-size: 10.5px; color: #374151; }

  .section { margin-bottom: 10px; }
  .section-title { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #d1d5db; margin-bottom: 6px; padding-bottom: 2px; color: #000; }

  .experiences-item { margin-bottom: 8px; }
  .experiences-item .job-title { font-size: 11px; font-weight: 700; color: #000; display: inline-block; }
  .experiences-item .location-date { display: inline-block; float: right; font-size: 10.5px; color: #4b5563; font-style: normal; }
  .experiences-item .company { display: block; font-size: 11px; font-weight: 600; color: #374151; margin-bottom: 2px; }

  ul.responsibilities { margin-top: 2px; margin-left: 14px; }
  ul.responsibilities li { margin-bottom: 1px; color: #374151; }

  .educations-item { margin-bottom: 6px; }
  .educations-item .job-title { font-size: 11px; font-weight: 700; color: #000; }

  .skills-container { gap: 6px; }
  .skill-item { font-weight: 500; color: #374151; border: 1px solid #e5e7eb; padding: 1px 6px; border-radius: 3px; background: #f9fafb; }
`;

export function generateDefaultHTML(data: ResumeData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(data.profile.fullname)} - Resume</title>
      <style>${baseStyles}${defaultStyles}</style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${escapeHtml(data.profile.fullname)}</h1>
          <div class="contact-info">${renderContactInfo(data)}</div>
        </div>

        ${data.profile.summary ? `
          <div class="section">
            <div class="section-title">Professional Summary</div>
            <div class="summary">${escapeHtml(data.profile.summary)}</div>
          </div>
        ` : ''}

        ${data.skills?.length ? `
          <div class="section">
            <div class="section-title">Skills</div>
            <div class="skills-container" style="display:flex; flex-wrap:wrap;">
              ${safeJoin(data.skills.flatMap(g => g.skills || []).map(s => `<span class="skill-item">${escapeHtml(s)}</span>`))}
            </div>
          </div>
        ` : ''}

        ${data.experiences?.length ? `
          <div class="section">
            <div class="section-title">Experience</div>
            ${safeJoin(data.experiences.map(exp => `
              <div class="experiences-item">
                <div>
                  <span class="job-title">${escapeHtml(exp.title)}</span>
                  <div class="location-date">${escapeHtml(exp.startDate)} – ${exp.current ? 'Present' : escapeHtml(exp.endDate)} | ${escapeHtml(exp.location)}</div>
                </div>
                <div class="company">${escapeHtml(exp.company)}</div>
                ${exp.responsibilities?.length ? `<ul class="responsibilities">${safeJoin(exp.responsibilities.slice(0, 8).map(r => `<li>${escapeHtml(r)}</li>`))}</ul>` : ''}
              </div>
            `))}
          </div>
        ` : ''}

        ${data.educations?.length ? `
          <div class="section">
            <div class="section-title">Education</div>
            ${safeJoin(data.educations.map(edu => `
              <div class="educations-item">
                <div style="display:flex; justify-content:space-between;">
                  <span class="job-title">${escapeHtml(edu.degree)}</span>
                  <span class="location-date">${escapeHtml(edu.startDate)} – ${escapeHtml(edu.endDate)}</span>
                </div>
                <div class="company">${escapeHtml(edu.university)}, ${escapeHtml(edu.location)}</div>
              </div>
            `))}
          </div>
        ` : ''}

        ${data.customSections?.length ? `
        ${safeJoin(data.customSections.map(section => renderCustomSections(section, false)))}
        ` : ''}
      </div>
    </body>
    </html>
  `;
}
