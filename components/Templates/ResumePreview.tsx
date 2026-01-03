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
    const el = containerRef.current;
    if (!el) return;

    const updateScale = () => {
      const paddingX =
        parseFloat(getComputedStyle(el).paddingLeft || '0') +
        parseFloat(getComputedStyle(el).paddingRight || '0');
      const available = el.clientWidth - paddingX;
      const next = Math.min(1, Math.max(0.2, available / PAGE_WIDTH_PX));
      setScale(next);
    };

    updateScale();
    // Use ResizeObserver for efficient layout/responding to container changes
    const ro = new ResizeObserver(updateScale);
    ro.observe(el);
    // keep window.resize as a lightweight fallback
    window.addEventListener('resize', updateScale);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateScale);
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
    <div
      ref={containerRef}
      className="overflow-hidden min-h-fit flex justify-center relative p-4"
      aria-busy={!!regenerating}
    >
      <div
        className="relative z-0"
        style={{
          width: PAGE_WIDTH_PX * scale,
          height: PAGE_HEIGHT_PX * scale,
        }}
      >
        <div
          style={{
            width: PAGE_WIDTH_PX,
            height: PAGE_HEIGHT_PX,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          <iframe
            title="Resume Preview"
            loading="lazy"
            style={{
              width: PAGE_WIDTH_PX,
              height: PAGE_HEIGHT_PX,
              border: '1px solid #e5e7eb',
              borderRadius: 12,
              background: '#fff',
              display: 'block',
            }}
            srcDoc={srcDoc}
          />
        </div>
      </div>

      {regenerating && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60">
          <div className="flex items-center space-x-2 bg-white/80 rounded-md px-3 py-2 shadow">
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            <div className="text-sm text-gray-700">Regenerating…</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumePreview;
