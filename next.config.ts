import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
            {
                protocol: 'http',
                hostname: '**',
            }
        ],
        dangerouslyAllowSVG: true,
        contentDispositionType: 'attachment',
        contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    },
    serverExternalPackages: [
        '@sparticuz/chromium',
        'puppeteer-core',
        'pdf-parse',
        'pdfjs-dist',
    ],
    outputFileTracingIncludes: {
        "app/api/download/route": ["node_modules/@sparticuz/chromium/**"],
        "app/api/test-pdf/route": ["node_modules/@sparticuz/chromium/**"],
    },
};

export default nextConfig;