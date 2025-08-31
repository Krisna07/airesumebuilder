import { ResumeData } from '@/types/types';
import { generateTemplateHTML as generateTemplateHTMLInternal } from './templates';

export function generateTemplateHTML(
  template: string,
  data: ResumeData
): string {
  return generateTemplateHTMLInternal(template, data);
}
