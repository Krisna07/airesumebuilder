import { ResumeData } from '@/types/types';
import { generateModernHTML } from './modern';
import { generateMinimalHTML } from './minimal';
import { generateClassicHTML } from './classic';
import { generateDefaultHTML } from './default';

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
    default:
      return generateDefaultHTML(data);
  }
}
