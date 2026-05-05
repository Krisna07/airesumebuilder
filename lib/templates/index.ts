import { ResumeData, ResumeStyle } from '@/types/types';
import { mergeWithDefault } from '@/lib/defaultStyle';
import { buildSectionTitleCSS, buildGlobalStyleCSS, buildFontLinkTag, buildFontFamilyCSS } from './sectionTitleCSS';
import { generateModernHTML } from './modern';
import { generateMinimalHTML } from './minimal';
import { generateClassicHTML } from './classic';
import { generateDefaultHTML } from './default';
import { generatetemplate01HTML } from './template-01';
import { generatetemplate02HTML } from './template-02';
import { generateExecutiveHTML } from './executive';
import { generateSignalHTML } from './signal';
import { generateAtlasHTML } from './atlas';
import { generateHorizonHTML } from './horizon';

/**
 * Generates the complete HTML string for a resume template.
 * The style param is optional — if omitted, DEFAULT_RESUME_STYLE is used.
 *
 * All templates inject dynamic CSS after their own static styles:
 *   <style>[baseStyles][templateStyles][dynamicStyleCSS]</style>
 * The dynamic CSS is injected via a placeholder <!-- DYNAMIC_STYLE --> in each template.
 */
export function generateTemplateHTML(
    template: string,
    data: ResumeData,
    styleOverride?: ResumeStyle | null,
): string {
    // Merge saved style with defaults (handles missing fields gracefully)
    const style = mergeWithDefault(styleOverride ?? data.styleConfig);

    // Build the dynamic CSS block from the style settings
    const dynamicCSS = [
        buildSectionTitleCSS(style),
        buildGlobalStyleCSS(style),
        buildFontFamilyCSS(style),
    ].join('\n');

    // Build font <link> tag (for browser preview; PDF uses system fallback)
    const fontLink = [
        buildFontLinkTag(style.headingFont),
        style.bodyFont !== style.headingFont ? buildFontLinkTag(style.bodyFont) : '',
    ].filter(Boolean).join('\n');

    // Pass both data and style to each generator
    let html: string;
    switch (template) {
        case 'modern':    html = generateModernHTML(data, style); break;
        case 'minimal':   html = generateMinimalHTML(data, style); break;
        case 'classic':   html = generateClassicHTML(data, style); break;
        case 'template01': html = generatetemplate01HTML(data, style); break;
        case 'template02': html = generatetemplate02HTML(data, style); break;
        case 'executive': html = generateExecutiveHTML(data, style); break;
        case 'signal':    html = generateSignalHTML(data, style); break;
        case 'atlas': html = generateAtlasHTML(data, style); break;
        case 'horizon': html = generateHorizonHTML(data, style); break;
        case 'default':
        default:          html = generateDefaultHTML(data, style); break;
    }

    // Inject font link tags and dynamic CSS into the <head>
    // Templates should have <!-- DYNAMIC_STYLE --> inside <head> as injection point
    // If not present, we inject before </head>
    if (html.includes('<!-- DYNAMIC_STYLE -->')) {
        html = html.replace(
            '<!-- DYNAMIC_STYLE -->',
            `${fontLink}\n<style>${dynamicCSS}</style>`
        );
    } else {
        html = html.replace(
            '</head>',
            `${fontLink}\n<style>${dynamicCSS}</style>\n</head>`
        );
    }

    return html;
}
