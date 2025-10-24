import { useScroll, useTransform } from 'motion/react';

export function usePrayerParallax() {
    const { scrollYProgress } = useScroll();

    // Sun moves right to left (east to west)
    // Progress: 0 = right (pre-fajr), 0.5 = center (dhuhr), 1 = left (maghrib+)
    const sunX = useTransform(scrollYProgress, [0, 1], ['90%', '10%']);
    const sunY = useTransform(scrollYProgress, [0, 0.5, 1], ['80%', '20%', '80%']);

    // Sky color transitions
    const skyColor = useTransform(
        scrollYProgress,
        [0, 0.15, 0.25, 0.5, 0.75, 0.85, 1],
        [
            'rgba(26, 26, 46, 0.3)', // Night (before fajr)
            'rgba(255, 107, 53, 0.2)', // Fajr twilight
            'rgba(135, 206, 235, 0.3)', // Sunrise
            'rgba(74, 144, 226, 0.4)', // Dhuhr (noon)
            'rgba(255, 165, 0, 0.3)', // Asr
            'rgba(255, 107, 53, 0.3)', // Maghrib
            'rgba(26, 26, 46, 0.3)', // Isha/Night
        ],
    );
    const lightBlueSkyColor = useTransform(
        scrollYProgress,
        [0, 0.3, 0.7, 1],
        ['#87CEEB', '#4A90E2', '#FF6B35', '#1a1a2e'],
    );

    // Prayer time labels with opacity based on scroll position
    const getPrayerLabel = (progress: number) => {
        if (progress < 0.1) {
            return 'Last Third of the Night';
        }
        if (progress < 0.2) {
            return 'Fajr';
        }
        if (progress < 0.3) {
            return 'Sunrise';
        }
        if (progress < 0.6) {
            return 'Ḍhuhr';
        }
        if (progress < 0.8) {
            return 'ʿAṣr';
        }
        if (progress < 0.9) {
            return 'Maġrib';
        }
        return 'ʿIshāʾ';
    };

    return { getPrayerLabel, lightBlueSkyColor, scrollYProgress, skyColor: skyColor, sunX, sunY };
}
