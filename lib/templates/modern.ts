import { ResumeData } from '@/types/types';
import { baseStyles } from './baseStyles';
import { escapeHtml, safeJoin, renderContactInfo, renderCustomSections } from './helpers';

const modernStyles = `
  /* Modern clean aesthetic */
  body { font-family: 'Roboto', sans-serif; font-size: 10px; color: #333; }
  .header { background: #1e293b; color: white; padding: 20px 24px; margin: -8mm -8mm 16px -8mm; }
  .header h1 { font-size: 26px; font-weight: 300; letter-spacing: 1px; margin: 0; color: white; text-transform: uppercase; }
  .header .contact-info { color: #94a3b8; justify-content: flex-start; margin-top: 8px; font-size: 10px; }
  .header .contact-item { color: #cbd5e1; }
  .header a { color: #cbd5e1; text-decoration: none; }

  .section-title { color: #1e293b; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: 700; margin-bottom: 10px; padding-bottom: 4px; display: flex; align-items: center; gap: 8px; }
  .section-title::before { content: ''; display: block; width: 4px; height: 16px; background: #3b82f6; } /* Accent block */

  .experiences-item { margin-bottom: 12px; page-break-inside: avoid; }
  .job-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 2px; }
  .job-title { font-size: 11px; font-weight: 700; color: #0f172a; }
  .company { font-size: 10.5px; font-weight: 500; color: #475569; }
  .date-loc { font-size: 9.5px; color: #64748b; font-weight: 500; text-align: right; }

  ul.responsibilities { margin-left: 14px; margin-top: 4px; }
  ul.responsibilities li { margin-bottom: 2px; color: #475569; line-height: 1.4; }

  .skills-grid { display: flex; flex-wrap: wrap; gap: 6px; }
  .skill-bg { background: #f1f5f9; padding: 3px 8px; border-radius: 4px; font-weight: 600; color: #334155; font-size: 9.5px; text-align: center; border: 1px solid #e2e8f0; }
`;

export function generateModernHTML(data: ResumeData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(data.profile.fullname)} - Resume</title>
      <style>${baseStyles}${modernStyles}</style>
    </head>
    <body>
      <div class="container" style="padding-top: 0;">
        <div class="header">
          <h1>${escapeHtml(data.profile.fullname)}</h1>
          <div class="contact-info">${renderContactInfo(data)}</div>
        </div>
        
        ${data.profile.summary ? `
          <div class="section">
            <div class="section-title">Summary</div>
            <div class="summary" style="padding: 0 4px;">${escapeHtml(data.profile.summary)}</div>
          </div>
        ` : ''}

        ${data.experiences?.length ? `
          <div class="section">
            <div class="section-title">Experience</div>
            ${safeJoin(data.experiences.map(exp => `
              <div class="experiences-item">
                <div class="job-header">
                  <div>
                    <div class="job-title">${escapeHtml(exp.title)}</div>
                    <div class="company">${escapeHtml(exp.company)}</div>
                  </div>
                  <div class="date-loc">
                    <div>${escapeHtml(exp.startDate)} – ${exp.current ? 'Present' : escapeHtml(exp.endDate)}</div>
                    <div>${escapeHtml(exp.location)}</div>
                  </div>
                </div>
                ${exp.responsibilities?.length ? `<ul class="responsibilities">${safeJoin(exp.responsibilities.slice(0, 5).map(r => `<li>${escapeHtml(r)}</li>`))}</ul>` : ''}
              </div>
            `))}
          </div>
        ` : ''}

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          ${data.educations?.length ? `
            <div class="section">
              <div class="section-title">Education</div>
              ${safeJoin(data.educations.map(edu => `
                <div style="margin-bottom: 8px;">
                  <div class="job-title">${escapeHtml(edu.degree)}</div>
                  <div class="company">${escapeHtml(edu.university)}</div>
                  <div class="date-loc" style="text-align:left;">${escapeHtml(edu.startDate)} – ${escapeHtml(edu.endDate)}</div>
                </div>
              `))}
            </div>
          ` : ''}

          ${data.skills?.length ? `
            <div class="section">
              <div class="section-title">Skills</div>
              <div class="skills-grid">
                ${safeJoin(data.skills.flatMap(g => g.skills || []).map(s => `<div class="skill-bg">${escapeHtml(s)}</div>`))}
              </div>
            </div>
          ` : ''}
        </div>

        ${data.customSections?.length ? `
          ${safeJoin(data.customSections.map(section => renderCustomSections(section, false)))}
        ` : ''}
      </div>
    </body>
    </html>
  `;
}
