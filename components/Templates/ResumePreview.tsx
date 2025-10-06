'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ResumeData } from '@/types/types';
import { ResumeService } from '@/services/resumeServices';
import { generateTemplateHTML } from '@/lib/template-utils';

type ResumePreviewProps = {
  resumeData?: ResumeData;
  resumeId?: string;
  template: string;
  /** Optional: target height for the preview container (default: 80vh) */
  height?: string | number;
  regenerating?:boolean;
};

const PAGE_WIDTH_PX = 794; // ~210mm at 96dpi
const PAGE_HEIGHT_PX = 1123; // ~297mm at 96dpi

const ResumePreview: React.FC<ResumePreviewProps> = ({
  resumeData,
  resumeId,
  template,
  height = '60vh',
  regenerating
}) => {
  const [data, setData] = useState<ResumeData | undefined>(resumeData);
  const [loading, setLoading] = useState(!resumeData && !!resumeId);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch when only id is provided
  useEffect(() => {
    let active = true;
    if(resumeData){
      return setData(resumeData)
    }
    // console.log(data)
    const fetchResume = async (id: string) => {
      setLoading(true);
      try {
        const response = await ResumeService.getSingle(id);
        const json = await response.json();
        if (!active) return;
        if (response.ok) {
          setData(json.data);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    if (!resumeData && resumeId) fetchResume(resumeId);
    return () => {
      active = false;
    };
  }, [resumeData, resumeId]);

  // Responsive scaling: fit A4 into container width (cap at 1)
  useEffect(() => {
    const updateScale = () => {
      const el = containerRef.current;
      if (!el) return;
      const paddingX =
        parseFloat(getComputedStyle(el).paddingLeft) +
        parseFloat(getComputedStyle(el).paddingRight);
      const available = el.clientWidth - paddingX;
      const next = Math.min(1, Math.max(0.2, available / PAGE_WIDTH_PX));
      setScale(next);
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    const id = setInterval(updateScale, 250); // catch font loading/layout shifts
    return () => {
      window.removeEventListener('resize', updateScale);
      clearInterval(id);
    };
  }, []);

  const srcDoc = useMemo(() => {
    if (!data) return '';
    // previewMode = true so iframe HTML stays A4-clean but can include tiny screen-only tweaks if desired
    return generateTemplateHTML(template, data);
  }, [data, template]);

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center" style={{ height }}>
        <div className="text-gray-600">Loading preview…</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-full flex items-center justify-center" style={{ height }}>
        <div className="text-gray-600">No data to preview.</div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="overflow-hidden min-h-fit flex justify-center relative p-4">
      {/* {regenerating ?<div className='w-full h-full absolute'></div>:<div></div>} */}
      <div
        style={{
          width: PAGE_WIDTH_PX * scale,
          minHeight: PAGE_HEIGHT_PX * scale,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          scrollbarWidth: 'none',
        }}
      className={`${regenerating ? 'blur-sm animate-pulse' : ''}`}
      >
        <iframe
          title="Resume Preview"
          style={{
            width: PAGE_WIDTH_PX,
            minHeight: PAGE_HEIGHT_PX,
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            background: 'white',
            display: 'block',
            scrollbarWidth: 'none'
          }}
          srcDoc={srcDoc}
        />
      </div>
    </div>
  );
};

export default ResumePreview;
