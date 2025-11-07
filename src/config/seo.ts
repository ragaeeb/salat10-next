import type { Metadata } from 'next';

export const SITE_URL = 'https://salat10.app';
export const SITE_NAME = 'Salat10';

// Default metadata shared across all pages
export const defaultMetadata: Metadata = {
    applicationName: 'Salat10',
    authors: [{ name: 'IlmTest', url: 'https://ilmtest.io' }],
    category: 'Lifestyle',
    creator: 'Ragaeeb Haq',
    description:
        'Accurate Islamic prayer times with beautiful visualizations. Get Fajr, Dhuhr, Asr, Maghrib, and Isha times with Hijri calendar integration.',
    icons: { icon: '/favicon.ico' },
    keywords: [
        'prayer times',
        'salat',
        'namaz',
        'Islamic prayer',
        'Fajr',
        'Dhuhr',
        'Asr',
        'Maghrib',
        'Isha',
        'Qibla',
        'Hijri calendar',
        'Muslim prayer',
        'adhan',
    ],
    manifest: '/site.webmanifest',
    metadataBase: new URL(SITE_URL),
    openGraph: {
        description:
            'Accurate Islamic prayer times with beautiful visualizations. Get Fajr, Dhuhr, Asr, Maghrib, and Isha times with Hijri calendar integration.',
        images: [{ alt: 'Salat10 Prayer Times', height: 630, url: `${SITE_URL}/og-image.png`, width: 1200 }],
        locale: 'en_US',
        siteName: 'Salat10',
        title: 'Salat10 - Islamic Prayer Times',
        type: 'website',
        url: SITE_URL,
    },
    publisher: 'Salat10',
    robots: {
        follow: true,
        googleBot: {
            follow: true,
            index: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
            'max-video-preview': -1,
        },
        index: true,
    },
    title: { default: 'Salat10 - Islamic Prayer Times', template: '%s | Salat10' },
    twitter: {
        card: 'summary_large_image',
        description:
            'Accurate Islamic prayer times with beautiful visualizations. Get Fajr, Dhuhr, Asr, Maghrib, and Isha times with Hijri calendar integration.',
        images: [`${SITE_URL}/og-image.png`],
        title: 'Salat10 - Islamic Prayer Times',
    },
};

// Home page metadata
export const homeMetadata: Metadata = {
    ...defaultMetadata,
    alternates: { canonical: SITE_URL },
    title: 'Salat10 - Islamic Prayer Times',
};

// Parallax view metadata
export const parallaxMetadata: Metadata = {
    alternates: { canonical: `${SITE_URL}/v2` },
    description:
        'Experience prayer times with an immersive parallax view showing sun, moon, and sky transitions throughout the day.',
    title: 'Parallax View - Prayer Times Visualization',
};

// Settings page metadata
export const settingsMetadata: Metadata = {
    alternates: { canonical: `${SITE_URL}/settings` },
    description:
        'Configure your location coordinates and prayer time calculation method for accurate Islamic prayer times.',
    title: 'Settings - Location & Calculation Method',
};

// Timetable page metadata
export const timetableMetadata: Metadata = {
    alternates: { canonical: `${SITE_URL}/timetable` },
    description: 'View Islamic prayer times in a comprehensive monthly or yearly timetable format.',
    title: 'Prayer Timetable - Monthly & Yearly View',
};

// Graph page metadata
export const graphMetadata: Metadata = {
    alternates: { canonical: `${SITE_URL}/graph` },
    description: 'Visualize Islamic prayer times with interactive charts and graphs showing patterns over time.',
    title: 'Prayer Times Graph - Visual Analytics',
};

// Qibla finder metadata
export const qiblaMetadata: Metadata = {
    alternates: { canonical: `${SITE_URL}/qibla` },
    description: 'Find the Qibla direction using augmented reality. Point your camera and see the direction to Kaaba.',
    title: 'Qibla Finder - AR Compass',
};

// Explanations page metadata
export const explanationsMetadata: Metadata = {
    alternates: { canonical: `${SITE_URL}/explanations` },
    description:
        'Learn about Islamic prayer time calculations, astronomical methods, and the significance of different calculation methods.',
    title: 'Explanations - Understanding Prayer Times',
};
