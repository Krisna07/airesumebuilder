/**
 * Safely parses a URL from a Request object, handling potential issues during build time
 * @param req - The Request object
 * @returns URL object
 */
export function parseRequestURL(req: Request): URL {
    try {
        // Try to parse the URL directly first
        return new URL(req.url);
    } catch (error) {
        // Fallback for build-time when headers might be missing or malformed
        const host = req.headers.get("host") || "localhost:3000";
        try {
            return new URL(req.url, `http://${host}`);
        } catch (fallbackError) {
            // Last resort fallback
            console.warn("Failed to parse URL, using fallback:", {
                originalError: error,
                fallbackError,
                url: req.url,
                host
            });
            return new URL("/", "http://localhost:3000");
        }
    }
}

/**
 * Safely gets a search parameter from a Request URL
 * @param req - The Request object
 * @param paramName - Name of the search parameter
 * @returns The parameter value or null
 */
export function getSearchParam(req: Request, paramName: string): string | null {
    try {
        const url = parseRequestURL(req);
        return url.searchParams.get(paramName);
    } catch (error) {
        console.warn(`Failed to get search param "${paramName}":`, error);
        return null;
    }
}
