import { SITE_URL } from '@/config/seo';

const ALLOWED_ORIGINS = [
    SITE_URL,
    `${SITE_URL.replace('https://', 'https://www.')}`,
    'https://salaten.vercel.app',
    'http://localhost:3000',
];

/**
 * Validates the origin or referer header for CORS security
 */
export function validateOrigin(origin: string | null, referer: string | null): boolean {
    if (origin) {
        return ALLOWED_ORIGINS.includes(origin);
    }
    if (referer) {
        return ALLOWED_ORIGINS.some((allowed) => referer.startsWith(allowed));
    }
    // In production, require origin or referer. In development, allow missing headers.
    return process.env.NODE_ENV === 'development';
}

/**
 * Creates CORS headers for successful responses
 */
export function createCorsHeaders(origin: string | null): HeadersInit {
    if (!origin) {
        return {};
    }
    return { 'Access-Control-Allow-Methods': 'GET, POST', 'Access-Control-Allow-Origin': origin };
}
