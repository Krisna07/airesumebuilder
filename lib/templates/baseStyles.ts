export const baseStyles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { height: auto; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, Helvetica, sans-serif;
    line-height: 1.5; color: #333; font-size: 12px;
    -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;
    max-width: 210mm; margin: 0 auto; background: white;
  }
  .container { max-width: 190mm; margin: 0 auto; display: grid; gap: 8px; }
  .section-title { font-size: 14px; font-weight: 600; margin-bottom: 4px; border-bottom: 0.5px solid #e5e7eb; padding-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
  .job-title { font-size: 13px; font-weight: 600; color: #1f2937; }
  .location-date { display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #6b7280; margin-bottom: 4px; flex-wrap: wrap; gap: 6px; }
  .company { font-size: 12px; font-weight: 500; color: #4b5563; }
  .job-date { font-size: 11px; color: #6b7280; margin-bottom: 6px; font-style: italic; }
  .responsibilities { list-style: disc; margin-left: 15px; margin-top: 6px; }
  .responsibilities li { margin-bottom: 2px; font-size: 11px; line-height: 1.3; }
  .skills-container { font-size: 11px; display: flex; flex-wrap: wrap; gap: 3px; }
  .contact-info { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 15px; font-size: 11px; margin-top: 6px; }
  .contact-item { display: flex; align-items: center; gap: 4px; }
  .summary { font-size: 11px; line-height: 1.5; margin-top: 8px; }
  .avoid-break { page-break-inside: avoid; break-inside: avoid; }
  .custom-section { margin-bottom: 4px; }
  .custom-subsection { padding: 4px 12px; border-left: 3px solid #3b82f6; margin-bottom: 4px; }
  .custom-subsection .job-title { font-weight: 600; font-size: 12px; }
  .custom-subsection .job-date { font-size: 10px; color: #64748b; margin-top: 2px; }
  .custom-subsection .summary { font-size: 11px; margin-top: 4px; line-height: 1.4; }
  .project-item { background: #f0f9ff; padding: 8px; border-radius: 8px; border: 1px solid #e0f2fe; margin-bottom: 4px; }
  .project-title { font-weight: 600; color: #0369a1; margin-bottom: 2px; }
  .project-description { font-size: 11px; color: #475569; }

  @media print {
    body { margin: 0; -webkit-print-color-adjust: exact !important; color-adjust: exact !important; print-color-adjust: exact !important; }
    .no-print { display: none !important; }
    .avoid-break { page-break-inside: avoid; break-inside: avoid; }
    .container { padding: 8mm; }
  }
  @page { size: A4; margin: 0mm; }
`;
