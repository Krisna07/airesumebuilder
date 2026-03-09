import { ResumeStyle } from '@/types/types';

/**
 * Builds the CSS string for .section-title based on the current ResumeStyle.
 * This replaces all hardcoded .section-title rules across templates.
 */
export function buildSectionTitleCSS(style: ResumeStyle): string {
    const { sectionTitleStyle: s, accentColor, lineColor } = style;

    const base = `
      font-weight: ${s.fontWeight};
      font-style: ${s.fontStyle};
      text-transform: ${s.textTransform};
      text-align: ${s.align};
            font-size: ${s.fontSize}px;
      margin-bottom: 6px;
      letter-spacing: 0.6px;
    `;

    const typeStyles: Record<string, string> = {
        plain: `
            color: ${accentColor};
            border: none;
            padding: 0;
        `,
        underline: `
            color: ${accentColor};
            border-bottom: 2px solid ${lineColor};
            padding-bottom: 3px;
        `,
        overline: `
            color: ${accentColor};
            border-top: 2px solid ${lineColor};
            padding-top: 3px;
        `,
        ribbon: `
            background: ${accentColor};
            color: #ffffff;
            padding: 3px 10px;
            border-radius: 3px;
            display: inline-block;
        `,
        'left-bar': `
            color: ${accentColor};
            border-left: 4px solid ${accentColor};
            padding-left: 8px;
        `,
    };

    const typeCSS = typeStyles[s.type] ?? typeStyles['underline'];

    return `.section-title { ${base} ${typeCSS} }`;
}

/**
 * Builds the CSS for global spacing, body text, body text alignment,
 * and font overrides based on ResumeStyle.
 */
export function buildGlobalStyleCSS(style: ResumeStyle): string {
    return `
      body {
        font-size: ${style.bodyFontSize}px;
        line-height: ${style.lineHeight};
        text-align: ${style.bodyTextAlign};
      }
      .section { margin-bottom: ${style.sectionGap}px; }
      .experiences-item,
      .educations-item,
      .exp-item,
      .timeline-item { margin-bottom: ${style.itemGap}px; }
            .custom-subsection {
                border-left-color: ${style.accentColor};
                border-color: ${style.lineColor};
            }
    `;
}

/**
 * Builds a Google Fonts <link> tag for the preview (browser),
 * or an empty string if the font is already a system font.
 * Note: For PDF generation, fonts fall back to system fonts if not embedded.
 */
export function buildFontLinkTag(font: string): string {
    const systemFonts = ['Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Courier New', 'Verdana'];
    if (systemFonts.includes(font)) return '';
    const encoded = encodeURIComponent(font) + ':wght@400;500;600;700';
    return `<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=${encoded}&display=swap" rel="stylesheet">`;
}

/**
 * Builds font-family override CSS for heading and body.
 */
export function buildFontFamilyCSS(style: ResumeStyle): string {
    const heading = style.headingFont ? `'${style.headingFont}', ` : '';
    const body = style.bodyFont ? `'${style.bodyFont}', ` : '';
    const fallback = '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
    return `
      body { font-family: ${body}${fallback}; }
      h1, h2, h3, .section-title { font-family: ${heading}${fallback}; }
    `;
}
