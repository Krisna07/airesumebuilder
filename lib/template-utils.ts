import { Education, Experience, ResumeData } from '@/types/types';

export function generateTemplateHTML(template: string, data: ResumeData): string {
  if (!data?.profile) throw new Error('Profile data is required');

  const baseStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Roboto:wght@300;400;500;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.5; color: #333; font-size: 12px; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; max-width: 210mm; margin: 0 auto; background: white; }
    .container { max-width: 190mm; margin: 0 auto; padding: 10mm; min-height: 297mm; }
    .header { margin-bottom: 20px;  }
    .section { margin-bottom: 18px;  }
    .section-title { font-size: 14px; font-weight: 600; margin-bottom: 12px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
    .experiences-item, .educations-item { margin-bottom: 15px; page-break-inside: avoid; }
    .job-title { font-size: 13px; font-weight: 600; color: #1f2937; margin-bottom: 2px; }
    .company { font-size: 12px; font-weight: 500; color: #4b5563; margin-bottom: 2px; }
    .date-location { font-size: 11px; color: #6b7280; margin-bottom: 6px; font-style: italic; }
    .responsibilities { list-style: disc; margin-left: 15px; margin-top: 6px; }
    .responsibilities li { margin-bottom: 2px; font-size: 11px; line-height: 1.4; }
    .skills-container { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
    .skill-tag { background: #f3f4f6; padding: 3px 8px; border-radius: 12px; font-size: 10px; border: 1px solid #e5e7eb; }
    .contact-info { display: flex; flex-wrap: wrap; gap: 15px; font-size: 11px; margin-top: 8px; }
    .contact-item { display: flex; align-items: center; gap: 4px; }
    .summary { font-size: 11px; line-height: 1.5; margin-top: 10px; color: #4b5563; }
    .certificate-item { background: #f9fafb; padding: 8px 12px; border-radius: 6px; border-left: 3px solid #3b82f6; margin-bottom: 8px; }
    .project-item { background: #f0f9ff; padding: 10px; border-radius: 8px; border: 1px solid #e0f2fe; margin-bottom: 10px; }
    .project-title { font-weight: 600; color: #0369a1; margin-bottom: 4px; }
    .project-description { font-size: 11px; color: #475569; }
    @media print { body { margin: 0; } .no-print { display: none !important; } * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; } .container { padding: 10mm; } }
    @page { size: A4; margin: 10mm; }
  `;


  const getTemplateStyles = (template: string) => {
    switch (template) {
      case 'modern':
        // Modern template styles
        return ` .header {padding: 25px; border-radius: 8px; margin-bottom: 25px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
      .header h1 { font-size: 26px; font-weight: 700; margin-bottom: 10px; letter-spacing: -0.5px; }
      .section-title { color: #3b82f6; border-color: #3b82f6; font-weight: 700; }
      .skill-tag { background: linear-gradient(135deg, #dbeafe, #bfdbfe); color: #1e40af; border-color: #93c5fd; font-weight: 500; }
      .experiences-item { border-left: 3px solid #3b82f6; padding-left: 15px; margin-left: 5px; }
      .educations-item { border-left: 3px solid #8b5cf6; padding-left: 15px; margin-left: 5px; }`;
      case 'minimal':
        // Minimal template styles
        return ` .header { text-align: center; border-bottom: 4px solid #1f2937; padding: 25px; margin-bottom: 25px; border-radius: 6px; background: linear-gradient(to right, #f8fafc, #f1f5f9); }
      .header h1 { font-size: 30px; font-weight: 700; margin-bottom: 12px; color: #1f2937; font-family: 'Roboto', sans-serif; }
      .header .contact-info { justify-content: center; font-weight: 500; }
      .section-title { color: #1f2937; border-color: #1f2937; font-weight: 700; font-family: 'Roboto', sans-serif; }
      .skill-tag { background: #1f2937; color: white; border-color: #374151; font-weight: 500; }
      .experiences-item { border-left: 3px solid #1f2937; padding-left: 15px; margin-left: 5px; }
      .educations-item { border-left: 3px solid #374151; padding-left: 15px; margin-left: 5px; }`
      case 'classic':
        return ` body { font-weight: 300; font-family: 'Inter', sans-serif; }
      .header h1 { font-size: 34px; font-weight: 100; margin-bottom: 12px; color: #1f2937; letter-spacing: -1px; }
      .header .contact-info { color: #6b7280; font-weight: 400; }
      .section-title { font-weight: 400; letter-spacing: 2px; color: #6b7280; border-color: #e5e7eb; }
      .job-title { font-weight: 500; }
      .skill-tag { background: #f9fafb; color: #374151; border-color: #e5e7eb; font-weight: 400; }
      .experiences-item { border-left: 2px solid #e5e7eb; padding-left: 15px; margin-left: 5px; }
      .educations-item { border-left: 2px solid #f3f4f6; padding-left: 15px; margin-left: 5px; }`
      default:
        // Classic template styles
        return ` body { font-weight: 300; font-family: 'Inter', sans-serif; }
      .header h1 { font-size: 34px; font-weight: 100; margin-bottom: 12px; color: #1f2937; letter-spacing: -1px; }
      .header .contact-info { color: #6b7280; font-weight: 400; }
      .section-title { font-weight: 400; letter-spacing: 2px; color: #6b7280; border-color: #e5e7eb; }
      .job-title { font-weight: 500; }
      .skill-tag { background: #f9fafb; color: #374151; border-color: #e5e7eb; font-weight: 400; }
      .experiences-item { border-left: 2px solid #e5e7eb; padding-left: 15px; margin-left: 5px; }
      .educations-item { border-left: 2px solid #f3f4f6; padding-left: 15px; margin-left: 5px; }`
    }
  }

  const escapeHtml = (text = ''): string =>
    text.replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const safeJoin = (arr: string[] | undefined) => arr?.join('') || '';

  const renderExperiencesexperiences = (exp: Experience) => `
    <div class="experiences-item">
      <div class="job-title">${escapeHtml(exp.title)}</div>
      <div class="company">${escapeHtml(exp.company)}</div>
      <div class="date-location">${escapeHtml(exp.location)} • ${escapeHtml(exp.startDate)} - ${exp.current ? 'Present' : escapeHtml(exp.endDate)}</div>
      ${safeJoin(exp.responsibilities?.slice(0, 6).map(r => `<li>${escapeHtml(r)}</li>`)) ? `
        <ul class="responsibilities">${safeJoin(exp.responsibilities?.slice(0, 6).map(r => `<li>${escapeHtml(r)}</li>`))}</ul>
      ` : ''}
    </div>
  `;

  const rendereducations = (edu: Education) => `
    <div class="educations-item">
      <div class="job-title">${escapeHtml(edu.degree)}</div>
      <div class="company">${escapeHtml(edu.university)}</div>
      <div class="date-location">${escapeHtml(edu.location)} • ${escapeHtml(edu.startDate)} - ${edu.current ? 'Present' : escapeHtml(edu.endDate)}</div>
    </div>
  `;

  const renderContactInfo = () => safeJoin([
    data.profile.email && `<span class="contact-item">📧 ${escapeHtml(data.profile.email)}</span>`,
    data.profile.phone && `<span class="contact-item">📞 ${escapeHtml(data.profile.phone)}</span>`,
    data.profile.location && `<span class="contact-item">📍 ${escapeHtml(data.profile.location)}</span>`,
    ...((data.profile.links || []).map(link => link.url && `<span class="contact-item">🔗 ${escapeHtml(link.type)}</span>`))
  ].filter(Boolean) as string[]);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${escapeHtml(data.profile.fullname)} - Resume</title>
      <style>${baseStyles}${getTemplateStyles(template)}</style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${escapeHtml(data.profile.fullname)}</h1>
          <div class="contact-info">${renderContactInfo()}</div>
          ${data.profile.summary ? `<div class="summary">${escapeHtml(data.profile.summary)}</div>` : ''}
        </div>

        ${data.experiences?.length ? `
          <div class="section">
            <div class="section-title">Professional Experience</div>
            ${safeJoin(data.experiences.slice(0, 4).map(renderExperiencesexperiences))}
          </div>
        ` : ''}

        ${data.educations?.length ? `
          <div class="section">
            <div class="section-title">educations</div>
            ${safeJoin(data.educations.slice(0, 3).map(rendereducations))}
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
                <div class="date-location">${escapeHtml(cert.year)}</div>
              </div>
            `))}
          </div>
        ` : ''}
      </div>
    </body>
    </html>
  `;
}
