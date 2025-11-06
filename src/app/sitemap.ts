import type { MetadataRoute } from 'next';

/**
 * Generate sitemap for search engines
 * Next.js automatically serves this at /sitemap.xml
 */
export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://salat10.app';
    const currentDate = new Date();

    return [
        { changeFrequency: 'daily', lastModified: currentDate, priority: 1.0, url: baseUrl },
        { changeFrequency: 'weekly', lastModified: currentDate, priority: 0.9, url: `${baseUrl}/v2` },
        { changeFrequency: 'monthly', lastModified: currentDate, priority: 0.8, url: `${baseUrl}/settings` },
        { changeFrequency: 'weekly', lastModified: currentDate, priority: 0.8, url: `${baseUrl}/timetable` },
        { changeFrequency: 'weekly', lastModified: currentDate, priority: 0.7, url: `${baseUrl}/graph` },
        { changeFrequency: 'monthly', lastModified: currentDate, priority: 0.6, url: `${baseUrl}/explanations` },
    ];
}
