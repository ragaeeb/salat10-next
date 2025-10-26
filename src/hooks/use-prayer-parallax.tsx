import { useScroll, useTransform } from 'motion/react';

export function usePrayerParallax() {
    const { scrollYProgress } = useScroll();

    // Sun moves right to left (east to west)
    const sunX = useTransform(scrollYProgress, [0, 1], ['90%', '10%']);
    const sunY = useTransform(scrollYProgress, [0, 0.5, 1], ['80%', '20%', '80%']);

    // Base sky color (solid colors only for animation compatibility)
    const skyColor = useTransform(
        scrollYProgress,
        [0, 0.1, 0.15, 0.2, 0.25, 0.5, 0.75, 0.82, 0.88, 0.92, 1],
        [
            'rgba(26, 26, 46, 0.3)', // Night
            'rgba(30, 35, 55, 0.32)', // Early dawn
            'rgba(40, 50, 75, 0.35)', // Dawn
            'rgba(60, 80, 110, 0.4)', // Early Fajr
            'rgba(100, 120, 150, 0.45)', // Mid Fajr
            'rgba(74, 144, 226, 0.4)', // Dhuhr
            'rgba(255, 165, 0, 0.3)', // Asr
            'rgba(255, 140, 0, 0.4)', // Pre-Maghrib
            'rgba(255, 107, 53, 0.35)', // Maghrib
            'rgba(138, 73, 107, 0.3)', // Post-Maghrib
            'rgba(26, 26, 46, 0.3)', // Night
        ],
    );

    // Gradient overlay opacity for Fajr period
    const fajrGradientOpacity = useTransform(scrollYProgress, [0, 0.05, 0.1, 0.2, 0.25, 0.27], [0, 0, 0.3, 1, 0.8, 0]);

    const lightBlueSkyColor = useTransform(
        scrollYProgress,
        [0, 0.1, 0.15, 0.2, 0.25, 0.3, 0.7, 0.82, 0.88, 1],
        [
            '#1a1a2e', // Night
            '#1a1a2e', // Early Fajr
            '#2d2d4a', // Fajr twilight
            '#4a5a7a', // Pre-sunrise
            '#87CEEB', // Sunrise - transition to day
            '#4A90E2', // Morning/afternoon blue
            '#FF6B35', // Asr orange
            '#FF8C00', // Pre-Maghrib deep orange
            '#FF6B35', // Maghrib
            '#1a1a2e', // Night
        ],
    );

    return { fajrGradientOpacity, lightBlueSkyColor, scrollYProgress, skyColor, sunX, sunY };
}
