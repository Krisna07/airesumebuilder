/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: '**' },
            { protocol: 'http', hostname: '**' }
        ],
        dangerouslyAllowSVG: true,
        contentDispositionType: 'attachment',
        contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    },
    experimental: {
        turbo: false // Disable Turbopack, use webpack
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    webpack: (config: any, { isServer }: { isServer: boolean }) => {
        if (isServer) {
            config.externals = [
                ...config.externals,
                // Mark these packages as external to prevent Webpack from bundling them
                'pdf-parse',
                'pdfjs-dist',
                'puppeteer',
                'puppeteer-core',
                '@sparticuz/chromium'
            ];
        }
        return config;
    },
};

module.exports = nextConfig;