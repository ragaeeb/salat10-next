import { useScroll, useTransform } from 'motion/react';

export function usePrayerParallax() {
    const { scrollYProgress } = useScroll();

    // Sun moves right to left (east to west)
    const sunX = useTransform(scrollYProgress, [0, 1], ['90%', '10%']);
    const sunY = useTransform(scrollYProgress, [0, 0.5, 1], ['80%', '20%', '80%']);

    // Base sky color (solid colors only for animation compatibility)
    const skyColor = useTransform(
        scrollYProgress,
        [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.5, 0.55, 0.75, 0.82, 0.88, 0.92, 0.93, 0.97, 1],
        [
            'rgba(10, 15, 35, 0.4)', // Last third of night - deep blue
            'rgba(15, 20, 45, 0.38)', // Transitioning
            'rgba(26, 26, 46, 0.35)', // Pre-dawn
            'rgba(40, 50, 75, 0.35)', // Dawn
            'rgba(60, 80, 110, 0.4)', // Early Fajr
            'rgba(100, 120, 150, 0.45)', // Sunrise
            'rgba(135, 206, 235, 0.3)', // Post-sunrise
            'rgba(160, 220, 255, 0.35)', // Dhuhr - lighter blue
            'rgba(255, 165, 0, 0.3)', // Asr
            'rgba(255, 140, 0, 0.4)', // Pre-Maghrib
            'rgba(255, 107, 53, 0.35)', // Maghrib
            'rgba(138, 73, 107, 0.3)', // Post-Maghrib
            'rgba(26, 26, 46, 0.3)', // Isha
            'rgba(15, 20, 45, 0.35)', // Half night
            'rgba(10, 15, 35, 0.4)', // Last third
        ],
    );

    // Gradient overlay opacity for Fajr period
    const fajrGradientOpacity = useTransform(scrollYProgress, [0, 0.08, 0.12, 0.2, 0.25, 0.27], [0, 0, 0.3, 1, 0.8, 0]);

    // Light rays opacity for Last Third of Night - show at beginning and end of scroll
    const lightRaysOpacity = useTransform(
        scrollYProgress,
        [0, 0.02, 0.08, 0.1, 0.93, 0.95, 0.98, 1],
        [0.8, 1, 0.3, 0, 0, 0.3, 0.8, 1],
    );

    const lightBlueSkyColor = useTransform(
        scrollYProgress,
        [0, 0.1, 0.15, 0.2, 0.25, 0.3, 0.55, 0.7, 0.82, 0.88, 0.93, 0.97, 1],
        [
            '#0a0f23', // Last third night
            '#1a1a2e', // Early Fajr
            '#2d2d4a', // Fajr twilight
            '#4a5a7a', // Pre-sunrise
            '#87CEEB', // Sunrise
            '#4A90E2', // Morning
            '#a0dcff', // Dhuhr - lighter blue
            '#FF6B35', // Asr orange
            '#FF8C00', // Pre-Maghrib deep orange
            '#FF6B35', // Maghrib
            '#1a1a2e', // Isha
            '#0f1428', // Half night
            '#0a0f23', // Last third
        ],
    );

    return { fajrGradientOpacity, lightBlueSkyColor, lightRaysOpacity, scrollYProgress, skyColor, sunX, sunY };
}
