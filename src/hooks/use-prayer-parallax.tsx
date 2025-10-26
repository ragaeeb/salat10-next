import { useScroll, useTransform } from 'motion/react';

export function usePrayerParallax() {
    const { scrollYProgress } = useScroll();

    // Sun moves right to left (east to west)
    const sunX = useTransform(scrollYProgress, [0, 1], ['90%', '10%']);
    const sunY = useTransform(scrollYProgress, [0, 0.5, 1], ['80%', '20%', '80%']);

    // Sky color transitions with Fajr horizon gradient
    const skyColor = useTransform(
        scrollYProgress,
        [0, 0.05, 0.08, 0.11, 0.14, 0.17, 0.2, 0.23, 0.26, 0.5, 0.75, 0.82, 0.88, 0.92, 1],
        [
            'rgba(26, 26, 46, 0.3)', // Night (before fajr)
            'linear-gradient(to top, rgba(60, 70, 100, 0.4) 0%, rgba(40, 50, 80, 0.35) 30%, rgba(26, 26, 46, 0.3) 65%)', // Very early twilight hint
            'linear-gradient(to top, rgba(120, 100, 80, 0.5) 0%, rgba(80, 80, 100, 0.42) 35%, rgba(30, 35, 55, 0.32) 70%)', // Dawn beginning
            'linear-gradient(to top, rgba(200, 150, 90, 0.65) 0%, rgba(150, 130, 110, 0.55) 30%, rgba(80, 85, 110, 0.4) 60%, rgba(30, 35, 55, 0.32) 78%)', // Early Fajr warm glow
            'linear-gradient(to top, rgba(255, 200, 80, 0.75) 0%, rgba(240, 180, 95, 0.68) 20%, rgba(180, 150, 120, 0.58) 40%, rgba(100, 110, 130, 0.45) 65%, rgba(40, 50, 75, 0.35) 82%)', // Mid Fajr - golden horizon
            'linear-gradient(to top, rgba(255, 200, 80, 0.85) 0%, rgba(255, 180, 90, 0.75) 15%, rgba(255, 160, 100, 0.7) 28%, rgba(255, 180, 130, 0.5) 42%, rgba(120, 130, 160, 0.48) 60%, rgba(60, 80, 110, 0.4) 78%)', // Late Fajr - bright yellow-orange
            'linear-gradient(to top, rgba(255, 190, 100, 0.88) 0%, rgba(255, 200, 130, 0.78) 22%, rgba(220, 210, 180, 0.68) 40%, rgba(160, 180, 200, 0.58) 58%, rgba(120, 150, 190, 0.5) 75%)', // Pre-sunrise brightening
            'linear-gradient(to top, rgba(255, 210, 140, 0.75) 0%, rgba(240, 220, 180, 0.65) 30%, rgba(180, 200, 220, 0.55) 55%, rgba(135, 180, 220, 0.45) 75%)', // Almost sunrise
            'rgba(135, 206, 235, 0.3)', // Sunrise complete - transition to day sky
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

    return { lightBlueSkyColor, scrollYProgress, skyColor, sunX, sunY };
}
