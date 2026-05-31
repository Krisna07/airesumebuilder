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
    turbopack: {
        root: __dirname,
    },
    serverExternalPackages: ['puppeteer-core', '@sparticuz/chromium'],
    outputFileTracingIncludes: {
        '/api/generate': [
            './node_modules/playwright-core/**/*',
            './node_modules/playwright/**/*'
        ],
        '/api/generate/v2': [
            './node_modules/playwright-core/**/*',
            './node_modules/playwright/**/*'
        ],
        '/api/download': [
            './node_modules/playwright-core/**/*',
            './node_modules/playwright/**/*'
        ],
        '/api/download/v2': [
            './node_modules/playwright-core/**/*',
            './node_modules/playwright/**/*'
        ]
    },
    async headers() {
        return [
            {
                source: '/builder/:path*',
                headers: [
                    {
                        key: 'X-Robots-Tag',
                        value: 'noindex, nofollow, noarchive, nosnippet, noimageindex',
                    },
                ],
            },
        ]
    },
    async redirects() {
        return [
            {
                source: '/addblog',
                destination: '/blogs/addblogs',
                permanent: true, // 301 redirect
            },
            {
                source: '/addblogs',
                destination: '/blogs/addblogs',
                permanent: true, // 301 redirect
            },
            {
                source: '/blog/addblog',
                destination: '/blogs/addblogs',
                permanent: true, // 301 redirect
            },
            {
                source: '/blog/addblogs',
                destination: '/blogs/addblogs',
                permanent: true, // 301 redirect
            },
        ]
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