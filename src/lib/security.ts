import { SITE_URL } from '@/config/seo';

/**
 * List of allowed origins for CORS validation
 * Includes production site, www variant, Vercel preview, and localhost
 */
const ALLOWED_ORIGINS = [
    SITE_URL,
    `${SITE_URL.replace('https://', 'https://www.')}`,
    'https://salaten.vercel.app',
    'http://localhost:3000',
];

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
        return ALLOWED_ORIGINS.includes(origin);
    }
    if (referer) {
        return ALLOWED_ORIGINS.some((allowed) => referer.startsWith(allowed));
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
