const SCROLL_LAST_THIRD_END = 0.1;
const SCROLL_FAJR_END = 0.2;
const SCROLL_SUNRISE_END = 0.5;
const SCROLL_DHUHR_END = 0.65;
const SCROLL_ASR_END = 0.8;
const SCROLL_MAGHRIB_END = 0.87;
const SCROLL_ISHA_END = 0.93;
const SCROLL_HALF_NIGHT_END = 0.97;

const SCROLL_SUNRISE_TRANSITION_START = 0.2;
const SCROLL_SUNRISE_TRANSITION_END = 0.25;
const SCROLL_ORANGE_TRANSITION_START = 0.75;
const SCROLL_ORANGE_TRANSITION_END = 0.78;
const SCROLL_SUNSET_TRANSITION_START = 0.78;
const SCROLL_SUNSET_TRANSITION_END = 0.87;

const SUN_X_START = 90;
const SUN_X_END = 10;
const SUN_Y_HIGH = 80;
const SUN_Y_LOW = 20;
const MOON_Y_POSITION = 25;
const MOON_X_START = 10;
const MOON_X_END = 80;
const MOON_OPACITY_MAX = 0.8;

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

export type PrayerInfo = { event: string; label: string; time: string };

export const getPrayerInfoFromScroll = (
    progress: number,
    timings?: Array<{ event: string; value: Date; label: string }>,
): PrayerInfo => {
    let event = 'lastThirdOfTheNight';
    let label = 'Last Third of the Night';

    if (progress < SCROLL_LAST_THIRD_END) {
        event = 'lastThirdOfTheNight';
        label = 'Last Third of the Night';
    } else if (progress < SCROLL_FAJR_END) {
        event = 'fajr';
        label = 'Fajr';
    } else if (progress < SCROLL_SUNRISE_END) {
        event = 'sunrise';
        label = 'Sunrise';
    } else if (progress < SCROLL_DHUHR_END) {
        event = 'dhuhr';
        label = 'Ḍhuhr';
    } else if (progress < SCROLL_ASR_END) {
        event = 'asr';
        label = 'ʿAṣr';
    } else if (progress < SCROLL_MAGHRIB_END) {
        event = 'maghrib';
        label = 'Maġrib';
    } else if (progress < SCROLL_ISHA_END) {
        event = 'isha';
        label = 'ʿIshāʾ';
    } else if (progress < SCROLL_HALF_NIGHT_END) {
        event = 'middleOfTheNight';
        label = 'Half of the Night';
    }

    const timing = timings?.find((t) => t.event === event);
    const time = timing
        ? timing.value.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true, minute: '2-digit' })
        : '';

    return { event, label, time };
};

export const calculateScrollBasedVisuals = (progress: number): SunMoonState => {
    const sunX = SUN_X_START - progress * (SUN_X_START - SUN_X_END);

    const sunY =
        progress < 0.5
            ? SUN_Y_HIGH - progress * 2 * (SUN_Y_HIGH - SUN_Y_LOW)
            : SUN_Y_LOW + (progress - 0.5) * 2 * (SUN_Y_HIGH - SUN_Y_LOW);

    let sunOpacity = 0;
    let moonOpacity = 0;
    let moonX = MOON_X_START;
    const moonY = MOON_Y_POSITION;
    let sunColor = { ...SUN_COLOR_YELLOW };

    if (progress < 0.1) {
        sunOpacity = 0;
        moonOpacity = MOON_OPACITY_MAX;
        moonX = MOON_X_END;
    } else if (progress < 0.2) {
        const fadeProgress = (progress - 0.1) / 0.1;
        sunOpacity = fadeProgress;
        moonOpacity = MOON_OPACITY_MAX * (1 - fadeProgress);
        moonX = MOON_X_END;
    } else if (progress < 0.75) {
        sunOpacity = 1;
        moonOpacity = 0;
        sunColor = { ...SUN_COLOR_YELLOW };
    } else if (progress < 0.78) {
        sunOpacity = 1;
        moonOpacity = 0;
        const orangeProgress = (progress - 0.75) / 0.03;
        sunColor = {
            b: SUN_COLOR_YELLOW.b,
            g: Math.round(SUN_COLOR_YELLOW.g - orangeProgress * (SUN_COLOR_YELLOW.g - SUN_COLOR_ORANGE.g)),
            r: SUN_COLOR_YELLOW.r,
        };
    } else if (progress < 0.87) {
        const fadeProgress = (progress - 0.78) / 0.09;
        sunOpacity = Math.max(0, 1 - fadeProgress);
        moonOpacity = fadeProgress * MOON_OPACITY_MAX;
        moonX = MOON_X_START;
        sunColor = { ...SUN_COLOR_ORANGE };
    } else {
        sunOpacity = 0;
        moonOpacity = MOON_OPACITY_MAX;
        const nightProgress = (progress - 0.87) / (1.0 - 0.87);
        moonX = MOON_X_START + nightProgress * (MOON_X_END - MOON_X_START);
    }

    return { moonOpacity, moonX, moonY, sunColor, sunOpacity, sunX, sunY };
};

export type PrayerTimings = {
    fajr?: number;
    sunrise?: number;
    dhuhr?: number;
    asr?: number;
    maghrib?: number;
    isha?: number;
};

export const calculateRealTimeVisuals = (now: number, timings: PrayerTimings): SunMoonState => {
    const { fajr, sunrise, dhuhr, asr, maghrib, isha } = timings;

    let sunX = 50;
    let sunY = 80;
    let sunOpacity = 1;
    let moonOpacity = 0;
    let moonX = 20;
    let moonY = 25;
    let sunColor = { b: 0, g: 215, r: 255 };

    if (!fajr || !sunrise || !dhuhr || !maghrib || !isha) {
        return { moonOpacity, moonX, moonY, sunColor, sunOpacity, sunX, sunY };
    }

    if (now < fajr) {
        sunX = 85;
        sunY = 95;
        sunOpacity = 0;
        moonOpacity = 0.8;
        moonX = 80;
        moonY = 25;
    } else if (now < sunrise) {
        const progress = (now - fajr) / (sunrise - fajr);
        sunX = 85 - progress * 15;
        sunY = 95 - progress * 15;
    } else if (now < dhuhr) {
        const progress = (now - sunrise) / (dhuhr - sunrise);
        sunX = 70 - progress * 20;
        sunY = 80 - progress * 60;
    } else if (asr && now < asr) {
        const progress = (now - dhuhr) / (asr - dhuhr);
        sunX = 50 - progress * 20;
        sunY = 20 + progress * 30;
    } else if (asr && now < maghrib) {
        const progress = (now - asr) / (maghrib - asr);
        sunX = 30 - progress * 15;
        sunY = 50 + progress * 30;

        const orangeStartTime = maghrib - (maghrib - asr) * 0.2;
        if (now >= orangeStartTime) {
            const orangeProgress = (now - orangeStartTime) / (maghrib - orangeStartTime);
            sunColor = { b: 0, g: Math.round(215 - orangeProgress * 75), r: 255 };
        }

        const fadeStartTime = maghrib - (maghrib - asr) * 0.1;
        if (now >= fadeStartTime) {
            const fadeProgress = (now - fadeStartTime) / (maghrib - fadeStartTime);
            sunOpacity = 1 - fadeProgress;
            moonOpacity = fadeProgress * 0.5;
            moonX = 10;
            moonY = 25;
        }
    } else if (now < isha) {
        sunX = 15;
        sunY = 95;
        sunOpacity = 0;
        moonOpacity = 0.8;
        moonX = 10;
        moonY = 25;
    } else {
        sunX = 10;
        sunY = 95;
        sunOpacity = 0;
        moonOpacity = 0.8;
        moonX = 10;
        moonY = 25;
    }

    return { moonOpacity, moonX, moonY, sunColor, sunOpacity, sunX, sunY };
};
