import { ResumeData } from '@/types/types';
import { baseStyles } from './baseStyles';
import { escapeHtml, safeJoin,  renderContactInfo, renderCustomSections } from './helpers';

const executiveStyles = `
  /* Executive / Formal Serif Layout */
  body { font-family: 'Georgia', 'Times New Roman', Times, serif; font-size: 10.5px; line-height: 1.4; color: #111; }
  .header { text-align: center; border-bottom: 2px solid #000; padding: 20px 0 10px; margin-bottom: 16px; }
  .header h1 { font-size: 32px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 6px; font-weight: 400; }
  .header .contact-info { justify-content: center; gap: 16px; font-style: italic; font-size: 10.5px; }

  .section { margin-bottom: 14px; }
  .section-title { text-align: center; text-transform: uppercase; letter-spacing: 1.5px; font-size: 11px; font-weight: 700; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-bottom: 10px; color: #444; }
  
  .experiences-item { margin-bottom: 12px; }
  .job-line { display: flex; justify-content: space-between; align-items: baseline; font-family: 'Arial', sans-serif; }
  .job-title { font-weight: 700; font-size: 11px; color: #000; }
  .company { font-style: italic; font-family: 'Georgia', serif; font-size: 11px; }
  .date { font-family: 'Arial', sans-serif; font-size: 10px; color: #444; }
  .custom-subsection { border:none }
  .summary { text-align: justify; margin-bottom: 10px; }
  
  ul.responsibilities { margin-left: 20px; list-style-type: square; }
  ul.responsibilities li { margin-bottom: 2px; }

  .skills-list { text-align: center; line-height: 1.8; }
  .skills-separator { margin: 0 6px; color: #999; font-size: 8px; vertical-align: middle; }
`;

export function generateExecutiveHTML(data: ResumeData): string {
  const allSkills = data.skills?.flatMap(g => g.skills || []) || [];
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(data.profile.fullname)} - Resume</title>
      <style>${baseStyles}${executiveStyles}</style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${escapeHtml(data.profile.fullname)}</h1>
          <div class="contact-info">${renderContactInfo(data)}</div>
        </div>

        ${data.profile.summary ? `
          <div class="section">
            <div class="section-title">Executive Profile</div>
            <div class="summary">${escapeHtml(data.profile.summary)}</div>
          </div>
        ` : ''}

        ${data.experiences?.length ? `
          <div class="section">
            <div class="section-title">Professional Experience</div>
            ${safeJoin(data.experiences.map(exp => `
              <div class="experiences-item">
                <div class="job-line">
                  <span class="job-title">${escapeHtml(exp.title)}</span>
                  <span class="date">${escapeHtml(exp.startDate)} – ${exp.current ? 'Present' : escapeHtml(exp.endDate)}</span>
                </div>
                <div class="job-line">
                  <span class="company">${escapeHtml(exp.company)} - ${escapeHtml(exp.location)}</span>
                </div>
                ${exp.responsibilities?.length ? `<ul class="responsibilities">${safeJoin(exp.responsibilities.map(r => `<li>${escapeHtml(r)}</li>`))}</ul>` : ''}
              </div>
            `))}
          </div>
        ` : ''}


        ${allSkills.length ? `
          <div class="section">
            <div class="section-title">Core Competencies</div>
            <div class="skills-list">
              ${safeJoin(allSkills.map(s => `<span>${escapeHtml(s)}</span>`).reduce((acc: string[], curr: string, idx: number, arr: string[]) => {
                 if (idx < arr.length - 1) return [...acc, curr, '<span class="skills-separator">◇</span>'];
                 return [...acc, curr];
              }, []))}
            </div>
          </div>
        ` : ''}
        
        ${data.educations?.length ? `
          <div class="section">
            <div class="section-title">Education</div>
           <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            ${safeJoin(data.educations.map(edu => `
              <div style="margin-bottom: 8px; text-align: center;">
                <div style="font-weight: 700;">${escapeHtml(edu.university)}</div>
                <div style="font-style: italic;">${escapeHtml(edu.degree)}</div>
                <div style="font-size: 10px; color: #555;">${escapeHtml(edu.startDate)} – ${escapeHtml(edu.endDate)}</div>
              </div>
            `))}
           </div>
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
