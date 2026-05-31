'use client';

export const ANALYTICS_EVENTS = {
  BUILDER_START: 'builder_start',
  RESUME_SAVE: 'resume_save',
  CHECKOUT_INTENT: 'checkout_intent',
} as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

export type AnalyticsEventPayload = Record<
  string,
  string | number | boolean | null | undefined
>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    __analyticsReady?: boolean;
    __marketingPixelReady?: boolean;
  }
}

const MAX_PARAM_NAME_LENGTH = 40;
const MAX_PARAM_VALUE_LENGTH = 100;

const normalizeParamName = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, MAX_PARAM_NAME_LENGTH);

const normalizeParamValue = (value: AnalyticsEventPayload[string]) => {
  if (value === null || typeof value === 'undefined') {
    return undefined;
  }

  if (typeof value === 'string') {
    return value.slice(0, MAX_PARAM_VALUE_LENGTH);
  }

  return value;
};

const normalizePayload = (payload: AnalyticsEventPayload = {}) => {
  const normalized: Record<string, string | number | boolean> = {};

  for (const [key, value] of Object.entries(payload)) {
    const normalizedName = normalizeParamName(key);
    const normalizedValue = normalizeParamValue(value);

    if (!normalizedName || typeof normalizedValue === 'undefined') {
      continue;
    }

    normalized[normalizedName] = normalizedValue;
  }

  return normalized;
};

export const trackAnalyticsEvent = (
  eventName: AnalyticsEventName,
  payload: AnalyticsEventPayload = {}
) => {
  if (typeof window === 'undefined') {
    return;
  }

  const normalizedPayload = normalizePayload(payload);

  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, normalizedPayload);
  }

  if (typeof window.fbq === 'function') {
    window.fbq('trackCustom', eventName, normalizedPayload);
  }
};

export const trackPageView = (url: string) => {
  if (typeof window === 'undefined') {
    return;
  }

  if (typeof window.gtag === 'function') {
    window.gtag('event', 'page_view', {
      page_location: url,
      page_path: window.location.pathname,
      page_title: document.title,
    });
  }

  if (typeof window.fbq === 'function') {
    window.fbq('track', 'PageView');
  }
};
