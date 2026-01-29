'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ResumeData } from '@/types/types';
import { generateTemplateHTML } from '@/lib/template-utils';

type ResumePreviewProps = {
  resumeData?: ResumeData;
  resumeId?: string;
  template: string;
  /** Optional: target height for the preview container (default: 80vh) */
  height?: string | number;
  regenerating?:boolean;
  className?: string; // Add className prop
};

const PAGE_WIDTH_PX = 794; // ~210mm at 96dpi
const PAGE_HEIGHT_PX = 1123; // ~297mm at 96dpi

const ResumePreview: React.FC<ResumePreviewProps> = ({
  resumeData,
  template,
  height = '60vh',
  regenerating,
  className,
}) => {
  const [data, setData] = useState<ResumeData | undefined>(resumeData);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [docHeight, setDocHeight] = useState<number>(PAGE_HEIGHT_PX);

  // Sync local state when resumeData prop is provided
  useEffect(() => {
    if (resumeData) {
      setData(resumeData);
    }
  }, [resumeData]);

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

  // Measure iframe content to show full length (multi-page preview)
  useEffect(() => {
    const measure = () => {
      const iframe = iframeRef.current;
      const body = iframe?.contentDocument?.body;
      if (!body) return;
      const scrollHeight = Math.max(body.scrollHeight, PAGE_HEIGHT_PX);
      setDocHeight(scrollHeight);
    };

    // Re-measure shortly after content changes
    const handle = setTimeout(measure, 80);
    return () => clearTimeout(handle);
  }, [srcDoc]);

  const handleIframeLoad = () => {
    const body = iframeRef.current?.contentDocument?.body;
    if (!body) return;
    const scrollHeight = Math.max(body.scrollHeight, PAGE_HEIGHT_PX);
    setDocHeight(scrollHeight);
  };

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
      className={`overflow-hidden max-w-full min-h-fit aspect-3/4 flex justify-center relative p-4 ${className}`}
      aria-busy={!!regenerating}
    >
      <div
        className="relative z-0"
        style={{
          width: PAGE_WIDTH_PX * scale,
          height: docHeight * scale,
        }}
      >
        <div
          style={{
            width: PAGE_WIDTH_PX,
            height: docHeight,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          <iframe
            title="Resume Preview"
            loading="lazy"
            ref={iframeRef}
            onLoad={handleIframeLoad}
            style={{
              width: PAGE_WIDTH_PX,
              height: docHeight,
              border: '1px solid #e5e7eb',
              borderRadius: 12,
              background: '#fff',
              display: 'block',
            }}
            srcDoc={srcDoc}
          />
        </div>
      </div>


    </div>
  );
};

export default ResumePreview;
