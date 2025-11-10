import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/config/seo';

/**
 * Generate sitemap for search engines
 * Next.js automatically serves this at /sitemap.xml
 */
export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = SITE_URL;

    return [
        { changeFrequency: 'daily', priority: 1.0, url: baseUrl },
        { changeFrequency: 'weekly', priority: 0.9, url: `${baseUrl}/v2` },
        { changeFrequency: 'weekly', priority: 0.9, url: `${baseUrl}/3d` },
        { changeFrequency: 'weekly', priority: 0.9, url: `${baseUrl}/qibla` },
        { changeFrequency: 'weekly', priority: 0.8, url: `${baseUrl}/timetable` },
        { changeFrequency: 'weekly', priority: 0.7, url: `${baseUrl}/graph` },
        { changeFrequency: 'weekly', priority: 0.6, url: `${baseUrl}/online` },
        { changeFrequency: 'monthly', priority: 0.6, url: `${baseUrl}/explanations` },
    ];
}
