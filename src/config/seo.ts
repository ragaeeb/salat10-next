import type { Metadata } from 'next';

/**
 * Centralized SEO configuration
 * Keeps metadata organized and maintainable in one place
 */

const SITE_URL = 'https://salat10.app';
const SITE_NAME = 'Salat10';
const SITE_DESCRIPTION = 'Accurate Islamic prayer times with beautiful visualizations and motivational quotes';

// Shared keywords across pages
const COMMON_KEYWORDS = [
    'prayer times',
    'salat',
    'islamic',
    'muslim',
    'fajr',
    'dhuhr',
    'asr',
    'maghrib',
    'isha',
    'adhan',
    'namaz',
] as const;

// Base Open Graph image
const DEFAULT_OG_IMAGE = { alt: 'Salat10 - Islamic Prayer Times', height: 630, url: '/og-image.jpg', width: 1200 };

/**
 * Generate metadata for a specific page
 */
export const generatePageMetadata = (config: {
    title: string;
    description: string;
    path: string;
    keywords?: string[];
    ogImage?: { url: string; alt: string };
}): Metadata => {
    const { title, description, path, keywords = [], ogImage } = config;
    const url = `${SITE_URL}${path}`;
    const fullTitle = path === '/' ? title : `${title} | ${SITE_NAME}`;

    return {
        alternates: { canonical: url },
        description,
        keywords: [...COMMON_KEYWORDS, ...keywords],
        metadataBase: new URL(SITE_URL),
        openGraph: {
            description,
            images: [ogImage ?? DEFAULT_OG_IMAGE],
            locale: 'en_US',
            siteName: SITE_NAME,
            title: fullTitle,
            type: 'website',
            url,
        },
        title: fullTitle,
        twitter: {
            card: 'summary_large_image',
            description,
            images: [ogImage?.url ?? DEFAULT_OG_IMAGE.url],
            title: fullTitle,
        },
    };
};

/**
 * Home page metadata
 */
export const homeMetadata = generatePageMetadata({
    description:
        'View accurate Islamic prayer times (Salat) for your location with beautiful visualizations. Get Fajr, Dhuhr, Asr, Maghrib, and Isha times with countdown reminders and motivational quotes.',
    keywords: ['qibla', 'hijri calendar', 'islamic calendar'],
    path: '/',
    title: 'Salat10 - Islamic Prayer Times & Reminders',
});

/**
 * Parallax view metadata (v2)
 */
export const parallaxMetadata = generatePageMetadata({
    description:
        'Experience prayer times through an immersive parallax sky animation. Watch the sun and moon move across a dynamic sky that transitions from night to day, marking each prayer time beautifully.',
    keywords: ['parallax', 'sky animation', 'sun moon tracker', 'visual prayer times'],
    path: '/v2',
    title: 'Parallax Sky View - Interactive Prayer Times',
});

/**
 * Settings page metadata
 */
export const settingsMetadata = generatePageMetadata({
    description:
        'Configure your location coordinates and Islamic calculation methods. Choose from multiple madhabs and high-latitude rules for accurate prayer times tailored to your region.',
    keywords: ['calculation methods', 'madhab', 'hanafi', 'shafi', 'coordinates', 'timezone'],
    path: '/settings',
    title: 'Settings - Location & Calculation Methods',
});

/**
 * Timetable page metadata
 */
export const timetableMetadata = generatePageMetadata({
    description:
        'View comprehensive prayer timetables for any date range. Display monthly or yearly prayer schedules in a clean table format, perfect for printing or planning ahead.',
    keywords: ['timetable', 'schedule', 'monthly', 'yearly', 'print', 'calendar'],
    path: '/timetable',
    title: 'Prayer Timetable - Monthly & Yearly Schedules',
});

/**
 * Graph page metadata
 */
export const graphMetadata = generatePageMetadata({
    description:
        'Visualize prayer times with interactive charts and graphs. Analyze patterns in prayer times throughout the year and see how they shift with the seasons.',
    keywords: ['charts', 'graphs', 'visualization', 'analytics', 'trends', 'data'],
    path: '/graph',
    title: 'Prayer Time Graphs - Visual Analytics',
});

/**
 * Explanations page metadata
 */
export const explanationsMetadata = generatePageMetadata({
    description:
        'Understand the astronomical and Islamic principles behind prayer time calculations. Learn about Julian days, solar coordinates, twilight angles, and the mathematics of determining accurate salat times.',
    keywords: [
        'astronomical calculation',
        'julian day',
        'solar coordinates',
        'twilight angles',
        'equation of time',
        'hadith',
    ],
    path: '/explanations',
    title: 'How Prayer Times Are Calculated - Step-by-Step Guide',
});

/**
 * Export centralized config
 */
export const seoConfig = {
    defaultOgImage: DEFAULT_OG_IMAGE,
    description: SITE_DESCRIPTION,
    keywords: COMMON_KEYWORDS,
    siteName: SITE_NAME,
    siteUrl: SITE_URL,
} as const;
