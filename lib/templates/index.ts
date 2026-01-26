import { ResumeData } from '@/types/types';
import { generateModernHTML } from './modern';
import { generateMinimalHTML } from './minimal';
import { generateClassicHTML } from './classic';
import { generateDefaultHTML } from './default';
import { generatetemplate01HTML } from './template-01';
import { generatetemplate02HTML } from './template-02';
import { generateExecutiveHTML } from './executive';
import { generateSignalHTML } from './signal';

export function generateTemplateHTML(
  template: string,
  data: ResumeData,
): string {
  switch (template) {
    case 'modern':
      return generateModernHTML(data);
    case 'minimal':
      return generateMinimalHTML(data);
    case 'classic':
      return generateClassicHTML(data);
    case 'template01':
      return generatetemplate01HTML(data);
    case 'template02':
      return generatetemplate02HTML(data);
    case 'executive':
      return generateExecutiveHTML(data);
    case 'signal':
      return generateSignalHTML(data);
    case 'default':
    default:
      return generateDefaultHTML(data);
  }
}
