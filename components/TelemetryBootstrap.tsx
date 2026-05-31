'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackPageView } from '@/lib/analytics/events';
import { captureClientError } from '@/lib/monitoring/client';

const GA_SCRIPT_ID = 'ga4-script';
const META_PIXEL_SCRIPT_ID = 'meta-pixel-script';

const appendScript = (id: string, src: string) => {
  if (document.getElementById(id)) {
    return;
  }

  const script = document.createElement('script');
  script.id = id;
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
};

const initializeGA = (measurementId: string) => {
  appendScript(
    GA_SCRIPT_ID,
    `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`
  );

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function (...args: unknown[]) {
    window.dataLayer!.push(args);
  };

  window.gtag('js', new Date());
  // send_page_view=false avoids duplicate events; route changes are tracked manually.
  window.gtag('config', measurementId, { send_page_view: false });
  window.__analyticsReady = true;
};

const initializeMetaPixel = (pixelId: string) => {
  if (!window.fbq) {
    const fbq = function (...args: unknown[]) {
      (fbq as unknown as { queue: unknown[] }).queue.push(args);
    } as unknown as ((...args: unknown[]) => void) & { queue: unknown[] };

    fbq.queue = [];
    window.fbq = fbq;
  }

  appendScript(
    META_PIXEL_SCRIPT_ID,
    'https://connect.facebook.net/en_US/fbevents.js'
  );

  window.fbq('init', pixelId);
  window.__marketingPixelReady = true;
};

const hasConsent = (requireConsent: boolean) => {
  if (!requireConsent) {
    return true;
  }

  return localStorage.getItem('analytics_consent') === 'granted';
};

export default function TelemetryBootstrap() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isEnabled, setIsEnabled] = useState(false);
  const lastTrackedUrl = useRef<string>('');

  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || '';
  const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || '';
  const requireConsent = process.env.NEXT_PUBLIC_ANALYTICS_REQUIRE_CONSENT === 'true';

  useEffect(() => {
    const enableTelemetry = () => {
      if (!gaMeasurementId && !metaPixelId) {
        return;
      }

      if (!hasConsent(requireConsent)) {
        return;
      }

      if (gaMeasurementId) {
        initializeGA(gaMeasurementId);
      }

      if (metaPixelId) {
        initializeMetaPixel(metaPixelId);
      }

      setIsEnabled(true);
    };

    enableTelemetry();

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      void captureClientError(event.reason, {
        source: 'window.unhandledrejection',
        severity: 'critical',
        tags: ['frontend', 'unhandledrejection'],
      });
    };

    const onWindowError = (event: ErrorEvent) => {
      void captureClientError(event.error || event.message, {
        source: 'window.onerror',
        severity: 'critical',
        tags: ['frontend', 'window-error'],
      });
    };

    window.addEventListener('unhandledrejection', onUnhandledRejection);
    window.addEventListener('error', onWindowError);

    return () => {
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
      window.removeEventListener('error', onWindowError);
    };
  }, [gaMeasurementId, metaPixelId, requireConsent]);

  useEffect(() => {
    if (!isEnabled || !pathname) {
      return;
    }

    const query = searchParams?.toString();
    const relativeUrl = query ? `${pathname}?${query}` : pathname;

    if (relativeUrl === lastTrackedUrl.current) {
      return;
    }

    lastTrackedUrl.current = relativeUrl;
    trackPageView(window.location.href);
  }, [isEnabled, pathname, searchParams]);

  return null;
}
