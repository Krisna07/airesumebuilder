'use client';

import { generateTemplateHTML } from '@/lib/template-utils';
import { ResumeData } from '@/types/types';
import React from 'react';

type ResumePreviewProps = {
  resumeData: ResumeData;
  template: string;
};

const ResumePreview = ({ resumeData, template }: ResumePreviewProps) => {
  if (!resumeData) {
    return <>No resume data</>;
  }
  return <iframe style={{ width: '100%', minHeight: '100vh', border: '1px solid #ddd', borderRadius: '12px', fontSize: '1.6rem' }} srcDoc={generateTemplateHTML(template, resumeData)} />;
};

export default ResumePreview;
