import { useScroll, useTransform } from 'motion/react';
import { useCallback } from 'react';

export function usePrayerParallax() {
    const { scrollYProgress } = useScroll();

    // Sun moves right to left (east to west)
    // Progress: 0 = right (pre-fajr), 0.5 = center (dhuhr), 1 = left (maghrib+)
    const sunX = useTransform(scrollYProgress, [0, 1], ['90%', '10%']);
    const sunY = useTransform(scrollYProgress, [0, 0.5, 1], ['80%', '20%', '80%']);

    // Sky color transitions - enhanced with orange sunset
    const skyColor = useTransform(
        scrollYProgress,
        [0, 0.15, 0.25, 0.5, 0.75, 0.82, 0.88, 0.92, 1],
        [
            'rgba(26, 26, 46, 0.3)', // Night (before fajr)
            'rgba(255, 107, 53, 0.2)', // Fajr twilight
            'rgba(135, 206, 235, 0.3)', // Sunrise
            'rgba(74, 144, 226, 0.4)', // Dhuhr (noon)
            'rgba(255, 165, 0, 0.3)', // Asr
            'rgba(255, 140, 0, 0.4)', // Pre-Maghrib orange glow
            'rgba(255, 107, 53, 0.35)', // Maghrib sunset
            'rgba(138, 73, 107, 0.3)', // Post-Maghrib purple
            'rgba(26, 26, 46, 0.3)', // Isha/Night
        ],
    );

    const lightBlueSkyColor = useTransform(
        scrollYProgress,
        [0, 0.3, 0.7, 0.82, 0.88, 1],
        [
            '#87CEEB', // Morning blue
            '#4A90E2', // Afternoon blue
            '#FF6B35', // Asr orange
            '#FF8C00', // Pre-Maghrib deep orange
            '#FF6B35', // Maghrib
            '#1a1a2e', // Night
        ],
    );

    return { lightBlueSkyColor, scrollYProgress, skyColor: skyColor, sunX, sunY };
}
