const nextConfig = {
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    webpack: (config: { externals: any[]; }, { isServer }: any) => {
        if (isServer) {
            config.externals = [
                ...config.externals,
                // Mark these packages as external to prevent Webpack from bundling them
                'pdf-parse',
                'pdfjs-dist',
            ];
        }

        return config;
    },
};

module.exports = nextConfig;