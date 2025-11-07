import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/config/seo';

/**
 * Generate robots.txt for search engine crawlers
 * Next.js automatically serves this at /robots.txt
 */
export default function robots(): MetadataRoute.Robots {
    const baseUrl = SITE_URL;

    return {
        host: baseUrl,
        rules: [
            {
                allow: '/',
                disallow: [
                    '/api/', // Don't index API routes
                    '/_next/', // Don't index Next.js internals
                    '/settings', // Don't index settings page (no SEO value)
                ],
                userAgent: '*',
            },
            { allow: '/', crawlDelay: 0, userAgent: ['Googlebot', 'Bingbot'] },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
