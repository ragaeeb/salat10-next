/**
 * Pure utility functions for calculating prayer time visual states
 */

export type PrayerPeriod = 'beforeFajr' | 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export type SunMoonState = {
    sunX: number;
    sunY: number;
    sunOpacity: number;
    moonOpacity: number;
    sunColor: { r: number; g: number; b: number };
};

export type PrayerInfo = { event: string; label: string };

/**
 * Get prayer period and info based on scroll progress (0-1)
 */
export function getPrayerInfoFromScroll(progress: number): PrayerInfo {
    if (progress < 0.1) {
        return { event: 'lastThirdOfTheNight', label: 'Last Third of the Night' };
    }
    if (progress < 0.2) {
        return { event: 'fajr', label: 'Fajr' };
    }
    if (progress < 0.5) {
        return { event: 'sunrise', label: 'Sunrise' };
    }
    if (progress < 0.65) {
        return { event: 'dhuhr', label: 'Ḍhuhr' };
    }
    if (progress < 0.8) {
        return { event: 'asr', label: 'ʿAṣr' };
    }
    if (progress < 0.9) {
        return { event: 'maghrib', label: 'Maġrib' };
    }
    return { event: 'isha', label: 'ʿIshāʾ' };
}

/**
 * Calculate sun/moon state based on scroll progress
 */
export function calculateScrollBasedVisuals(progress: number): SunMoonState {
    // Sun moves from right (90%) to left (10%)
    const sunX = 90 - progress * 80;

    // Sun arcs: high at edges (80%), low at center (20%)
    const sunY =
        progress < 0.5
            ? 80 - progress * 2 * 60 // 80 -> 20
            : 20 + (progress - 0.5) * 2 * 60; // 20 -> 80

    let sunOpacity = 1;
    let moonOpacity = 0;
    let sunColor = { b: 0, g: 215, r: 255 }; // Yellow

    // Smooth yellow to orange transition (0.7-0.8)
    if (progress >= 0.7 && progress < 0.8 && sunOpacity > 0) {
        const orangeProgress = (progress - 0.7) / 0.1;
        // Linear interpolation from yellow (255, 215, 0) to orange (255, 140, 0)
        sunColor = {
            b: 0,
            g: Math.round(215 - orangeProgress * 75), // 215 → 140
            r: 255,
        };
    } else if (progress >= 0.8 && sunOpacity > 0) {
        // Full orange after 0.8
        sunColor = { b: 0, g: 140, r: 255 };
    }

    // Maghrib transition (0.75-0.85): fade sun out, fade moon in
    if (progress > 0.75 && progress < 0.85) {
        const fadeProgress = (progress - 0.75) / 0.1;
        sunOpacity = 1 - fadeProgress;
        moonOpacity = fadeProgress * 0.8;
    } else if (progress >= 0.85) {
        // After Maghrib: sun hidden, moon visible
        sunOpacity = 0;
        moonOpacity = 0.8;
    }

    return { moonOpacity, sunColor, sunOpacity, sunX, sunY };
}

export type PrayerTimings = {
    fajr?: number;
    sunrise?: number;
    dhuhr?: number;
    asr?: number;
    maghrib?: number;
    isha?: number;
};

/**
 * Calculate sun/moon state based on actual prayer times
 */
export function calculateRealTimeVisuals(now: number, timings: PrayerTimings): SunMoonState {
    const { fajr, sunrise, dhuhr, asr, maghrib, isha } = timings;

    let sunX = 50;
    let sunY = 80;
    let sunOpacity = 1;
    let moonOpacity = 0;
    let sunColor = { b: 0, g: 215, r: 255 }; // Yellow

    if (!fajr || !sunrise || !dhuhr || !maghrib || !isha) {
        return { moonOpacity, sunColor, sunOpacity, sunX, sunY };
    }

    // Before Fajr
    if (now < fajr) {
        sunX = 85;
        sunY = 95;
        sunOpacity = 0;
        moonOpacity = 0.8;
    }
    // Fajr to Sunrise
    else if (now < sunrise) {
        const progress = (now - fajr) / (sunrise - fajr);
        sunX = 85 - progress * 15;
        sunY = 95 - progress * 15;
    }
    // Sunrise to Dhuhr
    else if (now < dhuhr) {
        const progress = (now - sunrise) / (dhuhr - sunrise);
        sunX = 70 - progress * 20;
        sunY = 80 - progress * 60;
    }
    // Dhuhr to Asr
    else if (asr && now < asr) {
        const progress = (now - dhuhr) / (asr - dhuhr);
        sunX = 50 - progress * 20;
        sunY = 20 + progress * 30;
    }
    // Asr to Maghrib
    else if (asr && now < maghrib) {
        const progress = (now - asr) / (maghrib - asr);
        sunX = 30 - progress * 15;
        sunY = 50 + progress * 30;

        // Smooth gradient from yellow to orange in last 20% before Maghrib
        const orangeStartTime = maghrib - (maghrib - asr) * 0.2;
        if (now >= orangeStartTime) {
            const orangeProgress = (now - orangeStartTime) / (maghrib - orangeStartTime);
            // Linear interpolation from yellow (255, 215, 0) to orange (255, 140, 0)
            sunColor = {
                b: 0,
                g: Math.round(215 - orangeProgress * 75), // 215 → 140
                r: 255,
            };
        }

        // Fade out sun in last 10% before Maghrib
        const fadeStartTime = maghrib - (maghrib - asr) * 0.1;
        if (now >= fadeStartTime) {
            const fadeProgress = (now - fadeStartTime) / (maghrib - fadeStartTime);
            sunOpacity = 1 - fadeProgress;
            moonOpacity = fadeProgress * 0.5;
        }
    }
    // Maghrib to Isha
    else if (now < isha) {
        sunX = 15;
        sunY = 95;
        sunOpacity = 0;
        moonOpacity = 0.8;
    }
    // After Isha
    else {
        sunX = 10;
        sunY = 95;
        sunOpacity = 0;
        moonOpacity = 0.8;
    }

    return { moonOpacity, sunColor, sunOpacity, sunX, sunY };
}
