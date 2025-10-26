/**
 * Pure utility functions for calculating prayer time visual states
 */

// Scroll progress thresholds for prayer periods
const SCROLL_LAST_THIRD_END = 0.1;
const SCROLL_FAJR_END = 0.2;
const SCROLL_SUNRISE_END = 0.5;
const SCROLL_DHUHR_END = 0.65;
const SCROLL_ASR_END = 0.8;
const SCROLL_MAGHRIB_END = 0.87;
const SCROLL_ISHA_END = 0.93;
const SCROLL_HALF_NIGHT_END = 0.97;

// Visual transition timing
const SCROLL_SUNRISE_TRANSITION_START = 0.2;
const SCROLL_SUNRISE_TRANSITION_END = 0.25;
const SCROLL_ORANGE_TRANSITION_START = 0.75;
const SCROLL_ORANGE_TRANSITION_END = 0.78;
const SCROLL_SUNSET_TRANSITION_START = 0.78;
const SCROLL_SUNSET_TRANSITION_END = 0.87;

// Sun/Moon positioning constants
const SUN_X_START = 90; // Right side (%)
const SUN_X_END = 10; // Left side (%)
const SUN_Y_HIGH = 80; // High in sky (%)
const SUN_Y_LOW = 20; // Low/zenith (%)
const MOON_Y_POSITION = 25; // Moon height (%)
const MOON_X_START = 10; // Moon starts left (%)
const MOON_X_END = 80; // Moon ends right (%)
const MOON_OPACITY_MAX = 0.8;

// Sun colors
const SUN_COLOR_YELLOW = { b: 0, g: 215, r: 255 };
const SUN_COLOR_ORANGE = { b: 0, g: 140, r: 255 };

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
    if (progress < SCROLL_LAST_THIRD_END) {
        return { event: 'lastThirdOfTheNight', label: 'Last Third of the Night' };
    }
    if (progress < SCROLL_FAJR_END) {
        return { event: 'fajr', label: 'Fajr' };
    }
    if (progress < SCROLL_SUNRISE_END) {
        return { event: 'sunrise', label: 'Sunrise' };
    }
    if (progress < SCROLL_DHUHR_END) {
        return { event: 'dhuhr', label: 'Ḍhuhr' };
    }
    if (progress < SCROLL_ASR_END) {
        return { event: 'asr', label: 'ʿAṣr' };
    }
    if (progress < SCROLL_MAGHRIB_END) {
        return { event: 'maghrib', label: 'Maġrib' };
    }
    if (progress < SCROLL_ISHA_END) {
        return { event: 'isha', label: 'ʿIshāʾ' };
    }
    if (progress < SCROLL_HALF_NIGHT_END) {
        return { event: 'halfNight', label: 'Half of the Night' };
    }
    return { event: 'lastThirdOfTheNight', label: 'Last Third of the Night' };
}

/**
 * Calculate sun/moon state based on scroll progress
 */
export function calculateScrollBasedVisuals(progress: number): SunMoonState {
    // Sun moves from right to left
    const sunX = SUN_X_START - progress * (SUN_X_START - SUN_X_END);

    // Sun arcs: high at edges, low at center
    const sunY =
        progress < 0.5
            ? SUN_Y_HIGH - progress * 2 * (SUN_Y_HIGH - SUN_Y_LOW)
            : SUN_Y_LOW + (progress - 0.5) * 2 * (SUN_Y_HIGH - SUN_Y_LOW);

    let sunOpacity = 1;
    let moonOpacity = 0;
    let moonX = MOON_X_START;
    const moonY = MOON_Y_POSITION;
    let sunColor = { ...SUN_COLOR_YELLOW };

    // Last Third / Before Fajr: moon visible, sun hidden
    if (progress < SCROLL_FAJR_END) {
        sunOpacity = 0;
        moonOpacity = MOON_OPACITY_MAX;
        moonX = MOON_X_END;
    }
    // Sunrise transition: sun fades in, moon fades out
    else if (progress < SCROLL_SUNRISE_TRANSITION_END) {
        const fadeProgress =
            (progress - SCROLL_SUNRISE_TRANSITION_START) /
            (SCROLL_SUNRISE_TRANSITION_END - SCROLL_SUNRISE_TRANSITION_START);
        sunOpacity = fadeProgress;
        moonOpacity = MOON_OPACITY_MAX * (1 - fadeProgress);
        moonX = MOON_X_END;
    }
    // Day time - sun visible: yellow sun
    else if (progress < SCROLL_ORANGE_TRANSITION_START) {
        sunOpacity = 1;
        moonOpacity = 0;
        sunColor = { ...SUN_COLOR_YELLOW };
    }
    // Asr - transition to orange
    else if (progress < SCROLL_ORANGE_TRANSITION_END) {
        sunOpacity = 1;
        moonOpacity = 0;
        const orangeProgress =
            (progress - SCROLL_ORANGE_TRANSITION_START) /
            (SCROLL_ORANGE_TRANSITION_END - SCROLL_ORANGE_TRANSITION_START);
        sunColor = {
            b: SUN_COLOR_YELLOW.b,
            g: Math.round(SUN_COLOR_YELLOW.g - orangeProgress * (SUN_COLOR_YELLOW.g - SUN_COLOR_ORANGE.g)),
            r: SUN_COLOR_YELLOW.r,
        };
    }
    // Late Asr leading up to Maghrib: sun sets, moon rises
    // By SCROLL_MAGHRIB_END, sun is completely gone and moon is completely visible
    else if (progress < SCROLL_MAGHRIB_END) {
        const fadeProgress =
            (progress - SCROLL_SUNSET_TRANSITION_START) /
            (SCROLL_SUNSET_TRANSITION_END - SCROLL_SUNSET_TRANSITION_START);
        sunOpacity = 1 - fadeProgress;
        moonOpacity = fadeProgress * MOON_OPACITY_MAX;
        moonX = MOON_X_START;
        sunColor = { ...SUN_COLOR_ORANGE };
    }
    // At and after Maghrib: sun is gone, moon travels across night sky
    else {
        sunOpacity = 0;
        moonOpacity = MOON_OPACITY_MAX;
        // Moon travels from left to right
        const nightProgress = (progress - SCROLL_MAGHRIB_END) / (1.0 - SCROLL_MAGHRIB_END);
        moonX = MOON_X_START + nightProgress * (MOON_X_END - MOON_X_START);
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
