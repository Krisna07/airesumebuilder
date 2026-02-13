import { ResumeData } from '@/types/types';
import { baseStyles } from './baseStyles';
import { escapeHtml } from './helpers';

const minimalStyles = `
  .header {  margin-bottom: 24px; padding-bottom: 12px; border-bottom: 1px solid #e5e7eb; }
  .header h1 { font-size: 28px; font-weight: 700; color: #111827; letter-spacing: -0.02em; line-height: 1.2; margin-bottom: 8px; text-transform: uppercase; }
  .contact-info { display: flex; flex-wrap: wrap; gap: 8px; font-size: 11px; color: #4b5563; align-items: center; }
  .contact-item { display: flex; align-items: center; }
  .contact-item:not(:last-child)::after { content: "•"; margin-left: 8px; color: #9ca3af; }
  .contact-item a { color: inherit; text-decoration: none; border-bottom: 1px dotted #9ca3af; }

  .section { margin-bottom: 20px; }
  .section-title { font-size: 12px; font-weight: 700; color: #111827; margin-bottom: 12px; letter-spacing: 0.1em; text-transform: uppercase; display: flex; align-items: center; gap: 8px;border:none; }
  .section-title::after { content: ""; flex: 1; height: 1px; background-color: #e5e7eb; }

  .experiences-item, .educations-item { margin-bottom: 12px; }
  .job-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 2px; }
  .job-title { font-size: 14px; font-weight: 600; color: #111827; }
  .company { font-size: 13px; font-weight: 400; color: #4b5563; }
  .date { font-size: 11px; color: #6b7280; text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }

  .responsibilities { margin-top: 4px; padding-left: 0; list-style: none; }
  .responsibilities li { position: relative; padding-left: 12px; margin-bottom: 3px; color: #374151; font-size: 11px; line-height: 1.5; }
  .responsibilities li::before { content: "•"; position: absolute; left: 0; color: #9ca3af; font-size: 14px; line-height: 12px; top: 2px; }

  .skills-grid { display: flex; flex-direction: column; gap: 6px; }
  .skill-group { display: flex; align-items: baseline; gap: 12px; }
  .skill-category { font-size: 11px; font-weight: 600; color: #111827; min-width: 100px; flex-shrink: 0; text-transform: capitalize; }
  .skill-list { display: flex; flex-wrap: wrap; gap: 6px; flex: 1; }
  .skill-tag { font-size: 11px; color: #4b5563; background-color: #f3f4f6; padding: 2px 8px; border-radius: 4px; border: 1px solid #e5e7eb; }
.noUnderline { text-decoration: none; color: inherit; }
  .summary { color: #374151; font-size: 11px; line-height: 1.6; text-align: justify; }
`;

export function generateMinimalHTML(data: ResumeData): string {
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
          <div class="contact-info">
             ${data.profile.email ? `<span class="contact-item">${escapeHtml(data.profile.email)}</span>` : ''}
             ${data.profile.phone ? `<span class="contact-item">${escapeHtml(data.profile.phone)}</span>` : ''}
             ${data.profile.location ? `<span class="contact-item">${escapeHtml(data.profile.location)}</span>` : ''}
             ${data.profile.links?.map(link => `<span class="contact-item"><a href="${link.url}" target="_blank">${escapeHtml(link.type)}</a></span>`).join('') || ''}
          </div>
        </div>

        ${data.profile.summary ? `
          <div class="section avoid-break">
            <div class="section-title">Profile</div>
            <div class="summary">${escapeHtml(data.profile.summary)}</div>
          </div>
        ` : ''}

        ${data.skills?.length ? `
          <div class="section avoid-break">
            <div class="section-title">Skills</div>
            <div class="skills-grid">
              ${data.skills.map(group => `
                ${group.skills && group.skills.length > 0 ? `
                  <div class="skill-group">
                    <div class="skill-category">${escapeHtml(group.type || 'Skills')}</div>
                    <div class="skill-list">
                      ${group.skills.map(skill => `<span class="skill-tag">${escapeHtml(skill)}</span>`).join('')}
                    </div>
                  </div>
                ` : ''}
              `).join('')}
            </div>
          </div>
        ` : ''}

        ${data.experiences?.length ? `
          <div class="section ">
            <div class="section-title">Experience</div>
             ${data.experiences.map(exp => `
               <div class="experiences-item avoid-break">
                 <div class="job-header">
                    <div>
                        <span class="job-title">${escapeHtml(exp.title)}</span>
                        ${exp.company ? `<span style="color:#d1d5db; margin: 0 6px;">|</span> <span class="company">${escapeHtml(exp.company)}</span>` : ''}
                    </div>
                    <span class="date">${escapeHtml(exp.startDate)} – ${exp.current ? 'Present' : escapeHtml(exp.endDate || '')}</span>
                 </div>
                 ${exp.location ? `<div style="font-size:10px; color:#9ca3af; margin-bottom:4px;">${escapeHtml(exp.location)}</div>` : ''}
                 
                 ${exp.responsibilities?.length ? `
                   <ul class="responsibilities">
                     ${exp.responsibilities.map(r => `<li>${escapeHtml(r)}</li>`).join('')}
                   </ul>
                 ` : ''}
               </div>
             `).join('')}
          </div>
        ` : ''}

        ${data.educations?.length ? `
          <div class="section avoid-break">
            <div class="section-title">Education</div>
            ${data.educations.map(edu => `
               <div class="educations-item">
                 <div class="job-header">
                    <div>
                        <span class="job-title">${escapeHtml(edu.university)}</span>
                         ${edu.degree ? `<span style="color:#d1d5db; margin: 0 6px;">|</span> <span class="company">${escapeHtml(edu.degree)}</span>` : ''}
                    </div>
                    <span class="date">${escapeHtml(edu.startDate)} – ${edu.current ? 'Present' : escapeHtml(edu.endDate || '')}</span>
                 </div>
                 ${edu.location ? `<div style="font-size:10px; color:#9ca3af;">${escapeHtml(edu.location)}</div>` : ''}
               </div>
             `).join('')}
          </div>
        ` : ''}
        
        ${data.customSections?.length ? `
           ${data.customSections.map(section => `
            <div class="section">
               <div class="section-title">${escapeHtml(section.title)}</div>
               ${section.subsections.map(sub => `
                  <div class="experiences-item">
                      <div class="job-header">
                          <a class="job-title noUnderline" href=${sub.url}>${escapeHtml(sub.title || '')}</a>
                      </div>
                       <div class="summary">${escapeHtml(sub.content)}</div>
                  </div>
               `).join('')}
            </div>
           `).join('')}
        ` : ''}
      </div>
    </body>
    </html>
  `;
}
