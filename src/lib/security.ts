import { SITE_URL } from '@/config/seo';

/**
 * Production origins allowed by CORS validation.
 */
const ALLOWED_ORIGINS = new Set([SITE_URL, `${SITE_URL.replace('https://', 'https://www.')}`]);

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]']);

const isAllowedOrigin = (value: string): boolean => {
    try {
        const url = new URL(value);

        if (ALLOWED_ORIGINS.has(url.origin)) {
            return true;
        }

        return (
            process.env.NODE_ENV !== 'production' &&
            (url.protocol === 'http:' || url.protocol === 'https:') &&
            LOCAL_HOSTNAMES.has(url.hostname)
        );
    } catch {
        return false;
    }
};

/**
 * Validate origin or referer header for CORS security
 * Checks if request comes from an allowed origin
 * In development, allows missing headers for easier testing
 *
 * @param origin - Origin header from request
 * @param referer - Referer header from request (fallback)
 * @returns True if request is from allowed origin
 */
export function validateOrigin(origin: string | null, referer: string | null): boolean {
    if (origin) {
        return isAllowedOrigin(origin);
    }
    if (referer) {
        return isAllowedOrigin(referer);
    }
    return process.env.NODE_ENV === 'development';
}

/**
 * Create CORS headers for successful API responses
 * Includes Access-Control-Allow-Origin if origin is provided
 *
 * @param origin - Validated origin from request
 * @returns Headers object for response
 */
export function createCorsHeaders(origin: string | null): HeadersInit {
    if (!origin) {
        return {};
    }
    return { 'Access-Control-Allow-Methods': 'GET, POST', 'Access-Control-Allow-Origin': origin };
}
