/**
 * Pure utility functions for calculating prayer time visual states
 */

export type PrayerPeriod =
    | 'beforeFajr'
    | 'fajr'
    | 'sunrise'
    | 'dhuhr'
    | 'asr'
    | 'maghrib'
    | 'isha'
    | 'halfNight'
    | 'lastThird';

export type SunMoonState = {
    sunX: number;
    sunY: number;
    sunOpacity: number;
    moonOpacity: number;
    moonX: number;
    moonY: number;
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
    if (progress < 0.87) {
        return { event: 'maghrib', label: 'Maġrib' };
    }
    if (progress < 0.93) {
        return { event: 'isha', label: 'ʿIshāʾ' };
    }
    if (progress < 0.97) {
        return { event: 'halfNight', label: 'Half of the Night' };
    }
    return { event: 'lastThirdOfTheNight', label: 'Last Third of the Night' };
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
    let moonX = 20; // Default moon position (left side)
    let moonY = 25; // Default moon position (upper portion)
    let sunColor = { b: 0, g: 215, r: 255 }; // Yellow

    // Before sunrise (0-0.2): sun is hidden, moon visible
    if (progress < 0.2) {
        sunOpacity = 0;
        moonOpacity = 0.8;
        // Moon at the end of its journey (right side) during last third/fajr
        moonX = 80;
        moonY = 25;
    }
    // Sunrise transition (0.2-0.25): sun fades in, moon fades out
    else if (progress >= 0.2 && progress < 0.25) {
        const fadeProgress = (progress - 0.2) / 0.05;
        sunOpacity = fadeProgress;
        moonOpacity = 0.8 * (1 - fadeProgress);
        moonX = 80;
        moonY = 25;
    }
    // Smooth yellow to orange transition (0.7-0.8)
    else if (progress >= 0.7 && progress < 0.8) {
        const orangeProgress = (progress - 0.7) / 0.1;
        sunColor = {
            b: 0,
            g: Math.round(215 - orangeProgress * 75), // 215 → 140
            r: 255,
        };
    } else if (progress >= 0.8 && progress < 0.87) {
        sunColor = { b: 0, g: 140, r: 255 };
    }

    // Maghrib transition (0.85-0.87): fade sun out, fade moon in
    if (progress >= 0.85 && progress < 0.87) {
        const fadeProgress = (progress - 0.85) / 0.02;
        sunOpacity = 1 - fadeProgress;
        moonOpacity = fadeProgress * 0.8;
        moonX = 10; // Moon starts from left
        moonY = 25;
    }
    // After Maghrib (0.87-1.0): moon travels from left to right
    else if (progress >= 0.87) {
        sunOpacity = 0;
        moonOpacity = 0.8;

        // Moon travels from left (10%) to right (80%) through the night
        // 0.87 = Isha start, 0.93 = Half Night, 1.0 = Last Third
        const nightProgress = (progress - 0.87) / (1.0 - 0.87);
        moonX = 10 + nightProgress * 70; // 10% -> 80%
        moonY = 25; // Keep moon at consistent height
    }

    return { moonOpacity, moonX, moonY, sunColor, sunOpacity, sunX, sunY };
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
    let moonX = 20;
    let moonY = 25;
    let sunColor = { b: 0, g: 215, r: 255 }; // Yellow

    if (!fajr || !sunrise || !dhuhr || !maghrib || !isha) {
        return { moonOpacity, moonX, moonY, sunColor, sunOpacity, sunX, sunY };
    }

    // Before Fajr
    if (now < fajr) {
        sunX = 85;
        sunY = 95;
        sunOpacity = 0;
        moonOpacity = 0.8;
        moonX = 80;
        moonY = 25;
    }
    // Fajr to Sunrise
    else if (now < sunrise) {
        const progress = (now - fajr) / (sunrise - fajr);
        sunX = 85 - progress * 15;
        sunY = 95 - progress * 15;
        moonX = 80;
        moonY = 25;
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
            moonX = 10;
            moonY = 25;
        }
    }
    // Maghrib to Isha
    else if (now < isha) {
        sunX = 15;
        sunY = 95;
        sunOpacity = 0;
        moonOpacity = 0.8;
        moonX = 10;
        moonY = 25;
    }
    // After Isha
    else {
        sunX = 10;
        sunY = 95;
        sunOpacity = 0;
        moonOpacity = 0.8;
        moonX = 10;
        moonY = 25;
    }

    return { moonOpacity, moonX, moonY, sunColor, sunOpacity, sunX, sunY };
}
