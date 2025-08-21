import { Education, Experience, ResumeData, UserResume } from '@/types/types';

export function generateTemplateHTML(template: UserResume['template'], data: ResumeData): string {
  // Validate input data
  if (!data) {
    throw new Error('Resume data is required');
  }

  if (!data.profile) {
    throw new Error('Profile data is required');
  }

  if (!template || !['modern', 'classic', 'minimal'].includes(template)) {
    throw new Error(`Invalid template: ${template}`);
  }
  const baseStyles = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { 
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
        line-height: 1.6; 
        color: #333; 
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      .container { max-width: 800px; margin: 0 auto; padding: 20px; }
      .header { margin-bottom: 30px; }
      .section { margin-bottom: 25px; }
      .section-title { font-size: 18px; font-weight: 600; margin-bottom: 15px; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px; }
      .experience-item, .education-item { margin-bottom: 20px; }
      .job-title { font-size: 16px; font-weight: 600; color: #1f2937; }
      .company { font-size: 14px; font-weight: 500; color: #4b5563; }
      .date-location { font-size: 12px; color: #6b7280; margin-bottom: 8px; }
      .responsibilities { list-style: disc; margin-left: 20px; }
      .responsibilities li { margin-bottom: 4px; font-size: 14px; }
      .skills-container { display: flex; flex-wrap: wrap; gap: 8px; }
      .skill-tag { background: #f3f4f6; padding: 4px 12px; border-radius: 16px; font-size: 12px; }
      @media print { 
        body { margin: 0; } 
        .no-print { display: none !important; }
        * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
      }
    </style>
  `;

  const modernStyles = `
    .header { background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 30px; border-radius: 8px; }
    .header h1 { font-size: 32px; font-weight: 700; margin-bottom: 10px; }
    .header .contact { display: flex; flex-wrap: wrap; gap: 15px; font-size: 14px; opacity: 0.9; }
    .section-title { color: #3b82f6; border-color: #3b82f6; }
    .skill-tag { background: #dbeafe; color: #1e40af; }
  `;

  const classicStyles = `
    .header { text-align: center; border-bottom: 4px solid #1f2937; padding-bottom: 20px; }
    .header h1 { font-size: 36px; font-weight: 700; margin-bottom: 15px; color: #1f2937; }
    .header .contact { display: flex; justify-content: center; flex-wrap: wrap; gap: 20px; font-size: 14px; }
    .section-title { text-transform: uppercase; letter-spacing: 1px; font-size: 16px; }
  `;

  const minimalStyles = `
    body { font-weight: 300; }
    .header h1 { font-size: 40px; font-weight: 100; margin-bottom: 15px; color: #1f2937; }
    .header .contact { display: flex; flex-wrap: wrap; gap: 25px; font-size: 14px; color: #6b7280; }
    .section-title { font-weight: 400; letter-spacing: 2px; text-transform: uppercase; font-size: 14px; }
    .job-title { font-weight: 500; }
  `;

  const getStyles = () => {
    let extra = '';
    switch (template) {
      case 'modern': extra = modernStyles; break;
      case 'classic': extra = classicStyles; break;
      case 'minimal': extra = minimalStyles; break;
      default: extra = modernStyles;
    }
    return `<style>${baseStyles}\n${extra}</style>`;
  };

  const escapeHtml = (text: string): string => {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

    const renderExperience = (exp: Experience) => `
    <div class="experience-item">
      <div class="job-title">${escapeHtml(exp.title || '')}</div>
      <div class="company">${escapeHtml(exp.company || '')}</div>
      <div class="date-location">${escapeHtml(exp.location || '')} • ${escapeHtml(exp.startDate || '')} - ${exp.current ? 'Present' : escapeHtml(exp.endDate || '')}</div>
      ${exp.responsibilities && exp.responsibilities.length > 0 ? `
        <ul class="responsibilities">
          ${exp.responsibilities.map((resp: string) => `<li>${escapeHtml(resp)}</li>`).join('')}
        </ul>
      ` : ''}
    </div>
  `;

    const renderEducation = (edu: Education) => `
    <div class="education-item">
      <div class="job-title">${escapeHtml(edu.degree || '')}</div>
      <div class="company">${escapeHtml(edu.university || '')}</div>
      <div class="date-location">${escapeHtml(edu.location || '')} • ${escapeHtml(edu.startDate || '')} - ${edu.current ? 'Present' : escapeHtml(edu.endDate || '')}</div>
    </div>
  `;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${data.profile.fullname} - Resume</title>
      ${getStyles()}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${escapeHtml(data.profile.fullname || '')}</h1>
          <div class="contact">
            <span>${escapeHtml(data.profile.email || '')}</span>
            <span>${escapeHtml(data.profile.phone || '')}</span>
            <span>${escapeHtml(data.profile.location || '')}</span>
            ${data.profile.links ? data.profile.links.map(link => `<span>${escapeHtml(link.type || '')}</span>`).join('') : ''}
          </div>
          ${data.profile.summary ? `<div style="margin-top: 20px; font-size: 14px; line-height: 1.6;">${escapeHtml(data.profile.summary)}</div>` : ''}
        </div>

        ${data.experience && data.experience.length > 0 ? `
          <div class="section">
            <div class="section-title">Experience</div>
            ${data.experience.map(renderExperience).join('')}
          </div>
        ` : ''}

        ${data.education && data.education.length > 0 ? `
          <div class="section">
            <div class="section-title">Education</div>
            ${data.education.map(renderEducation).join('')}
          </div>
        ` : ''}

        ${data.skills && data.skills.length > 0 ? `
          <div class="section">
            <div class="section-title">Skills</div>
            ${data.skills.map(skillGroup => `
              <div style="margin-bottom: 15px;">
                ${skillGroup.type ? `<div style="font-weight: 600; margin-bottom: 8px;">${escapeHtml(skillGroup.type)}</div>` : ''}
                ${skillGroup.skills && skillGroup.skills.length > 0 ? `
                  <div class="skills-container">
                    ${skillGroup.skills.map(skill => `<span class="skill-tag">${escapeHtml(skill)}</span>`).join('')}
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${data.certificates && data.certificates.length > 0 ? `
          <div class="section">
            <div class="section-title">Certifications</div>
            ${data.certificates.map(cert => `
              <div class="education-item">
                <div class="job-title">${cert.title}</div>
                <div class="company">${cert.issued_by}</div>
                <div class="date-location">${cert.year}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    </body>
    </html>
  `;
}