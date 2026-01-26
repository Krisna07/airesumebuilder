import { ResumeData } from '@/types/types';
import { baseStyles } from './baseStyles';
import { escapeHtml, safeJoin, renderContactInfo, renderCustomSections } from './helpers';

const signalStyles = `
  /* Signal: Bold & High Contrast */
  body { font-family: 'Inter', sans-serif; font-size: 10px; color: #101010; }
  .top-bar h1 { font-size: 36px; font-weight: 900; letter-spacing: -1px; text-transform: uppercase; line-height: 1; margin-bottom: 8px;}
  .top-bar .contact-info {  font-size: 11px; }
  .top-bar .contact-item { font-weight: 500; }
  .top-bar a {text-decoration: none; border-bottom: 1px solid #555; }
  .section-title { width:100%;font-size: 12px; font-weight: 900; background: #022212; color: #fff; padding: 4px 8px; display: inline-block; text-transform: uppercase; margin: 5px 0;  }
  .grid-layout { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; }
  .exp-item { margin-bottom: 16px; border-left: 4px solid #000; padding-left: 12px; }
  .exp-title { font-size: 12px; font-weight: 800; text-transform: uppercase; }
  .exp-company { font-size: 11px; font-weight: 600; margin-bottom: 2px; }
  .exp-date { font-size: 10px; font-weight: 500; color: #555; margin-bottom: 4px; }
  .custom-subsection { border-left: 4px solid #000; padding-left: 10px; margin-bottom: 12px; }
  ul { margin: 0; padding-left: 16px; }
  li { margin-bottom: 3px; font-weight: 400; color: #333; }

  .sidebar-section { margin-bottom: 20px; }
  .skill-block { margin-bottom: 4px; font-weight: 600; font-size: 10.5px; border-bottom: 1px solid #eee; padding-bottom: 2px; }
`;

export function generateSignalHTML(data: ResumeData): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(data.profile.fullname)} - Resume</title>
      <style>${baseStyles}${signalStyles}</style>
    </head>
    <body>
      <div class="container" style="padding-top: 0; max-width: 100%;">
        <div class="top-bar">
          <h1>${escapeHtml(data.profile.fullname)}</h1>
          <div class="contact-info">${renderContactInfo(data)}</div>
        </div>
         ${data.profile.summary ? `
              <div class="section">
                <div class="section-title">Profile</div>
                <div class="summary">${escapeHtml(data.profile.summary)}</div>
              </div>
            ` : ''}

        <div class="grid-layout">
          <div class="main-content">
            ${data.experiences?.length ? `
              <div class="section">
                <div class="section-title">Experience</div>
                ${safeJoin(data.experiences.map(exp => `
                  <div class="exp-item">
                    <div class="exp-title">${escapeHtml(exp.title)}</div>
                     <div style="display:flex; gap:4px; align-items:center;">   
                      <div class="exp-company">${escapeHtml(exp.company)} | ${escapeHtml(exp.location)}</div>
                    <div class="exp-date">${escapeHtml(exp.startDate)} – ${exp.current ? 'Present' : escapeHtml(exp.endDate)}</div></div>
                    ${exp.responsibilities?.length ? `<ul>${safeJoin(exp.responsibilities.map(r => `<li>${escapeHtml(r)}</li>`))}</ul>` : ''}
                  </div>
                `))}
              </div>
            ` : ''}

            ${data.educations?.length ? `
              <div class="section">
                <div class="section-title">Education</div>
                ${safeJoin(data.educations.map(edu => `
                  <div style="margin-bottom: 12px;">
                    <div style="font-weight: 700;">${escapeHtml(edu.university)}</div>
                     <div style="display:flex; gap:4px; align-items:center;"> 
                      <div>${escapeHtml(edu.degree)}</div>
                    <div style="font-size: 10px; color: #666;">${escapeHtml(edu.startDate)} – ${escapeHtml(edu.endDate)}</div>
                  </div>
                    </div>
                `))}
              </div>
            ` : ''}
          </div>
          
          <div class="sidebar">
            ${data.skills?.length ? `
              <div class="section">
                <div class="section-title">Skills</div>
                ${safeJoin(data.skills.flatMap(g => g.skills || []).splice(0, 20).map(s => `<div class="skill-block">${escapeHtml(s)}</div>`))}
              </div>
            ` : ''}  

               ${data.customSections?.length ? `
              ${safeJoin(data.customSections.map(section => renderCustomSections(section, true)))}
            ` : ''}
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}
