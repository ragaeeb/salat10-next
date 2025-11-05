import type { Timeline } from '@/types/timeline';
import { FRAC } from './constants';
import { invLerp, lerp } from './utils';

/**
 * Base sky color - single source of truth for the background throughout the day.
 * FajrGradient and SunsetGradient overlay on top to add dawn/dusk warmth.
 */
export const skyColorAt = (p: number, tl: Timeline): string => {
    if (p < tl.sunrise) {
        // Keep the same dark night base through Fajr - let FajrGradient overlay provide the dawn glow
        return 'rgba(5, 7, 16, 0.98)';
    }
    if (p < tl.dhuhr) {
        return 'rgba(135, 206, 235, 0.30)';
    }
    if (p < tl.asr) {
        return 'rgba(150, 215, 245, 0.32)';
    }
    if (p < tl.maghrib) {
        return 'rgba(160, 220, 255, 0.35)';
    }
    if (p < tl.isha) {
        const t = invLerp(tl.maghrib, tl.isha, p);
        return `rgba(${lerp(160, 40, t)}, ${lerp(220, 40, t)}, ${lerp(255, 60, t)}, ${lerp(0.35, 0.6, t)})`;
    }
    if (p < tl.midNight) {
        return 'rgba(10, 12, 28, 0.90)';
    }
    if (p < tl.lastThird) {
        return 'rgba(6, 8, 20, 0.95)';
    }
    // Last third through pre-sunrise: single source of truth for night darkness
    return 'rgba(5, 7, 16, 0.98)';
};

export const starsOpacityAt = (p: number, tl: Timeline): number => {
    if (p < tl.isha) {
        return 0;
    }
    if (p < tl.midNight) {
        return invLerp(tl.isha, tl.midNight, p);
    }
    return 1;
};

export const fajrGradientOpacityAt = (p: number, tl: Timeline): number => {
    if (p < tl.fajr) {
        return 0;
    }
    if (p < tl.sunrise) {
        const t = invLerp(tl.fajr, tl.sunrise, p);
        return 0.7 + 0.3 * t; // visible immediately at Fajr (checklist #1)
    }
    const tail = lerp(0, tl.sunrise - tl.fajr, FRAC.FAJR_GLOW_TAIL_OF_SUNRISE);
    if (p < tl.sunrise + tail) {
        return 1 - invLerp(tl.sunrise, tl.sunrise + tail, p);
    }
    return 0;
};

export const sunsetGradientOpacityAt = (p: number, tl: Timeline): number => {
    // Start orange exactly halfway between Asr & Maghrib (checklist #5)
    const orangeStart = (tl.asr + tl.maghrib) / 2;
    if (p < orangeStart) {
        return 0;
    }

    const holdEnd = lerp(tl.maghrib, tl.isha, FRAC.SUNSET_HOLD_AFTER_MAGHRIB);
    const fadeStart = lerp(tl.maghrib, tl.isha, 1 - FRAC.SUNSET_FADE_BEFORE_ISHA);

    if (p < holdEnd) {
        return invLerp(orangeStart, holdEnd, p);
    }
    if (p < fadeStart) {
        return 1;
    }
    if (p < tl.isha) {
        return 1 - invLerp(fadeStart, tl.isha, p);
    }
    return 0;
};

export const sunColorChannelAt = (p: number, tl: Timeline, ch: 'r' | 'g' | 'b'): number => {
    const day = { b: 102, g: 223, r: 255 };
    const dusk = { b: 0, g: 140, r: 255 };
    const orangeStart = (tl.asr + tl.maghrib) / 2;
    if (p <= orangeStart) {
        return day[ch];
    }
    const t = invLerp(orangeStart, tl.maghrib, p);
    return Math.round(lerp(day[ch], dusk[ch], t));
};

export const sunOpacityAt = (p: number, tl: Timeline): number => {
    if (p < tl.sunrise) {
        return 0;
    }
    // fade shortly before Maghrib (checklist #6)
    const orangeStart = (tl.asr + tl.maghrib) / 2;
    const fadeStart = lerp(orangeStart, tl.maghrib, 1 - FRAC.SUN_FADE_PRE_MAGHRIB);
    if (p < fadeStart) {
        return 1;
    }
    if (p < tl.maghrib) {
        return 1 - invLerp(fadeStart, tl.maghrib, p);
    }
    return 0; // at Maghrib the sun is fully gone (checklist #7)
};

export const moonOpacityAt = (p: number, tl: Timeline): number => {
    const orangeStart = (tl.asr + tl.maghrib) / 2;
    const appearStart = lerp(orangeStart, tl.maghrib, 1 - FRAC.MOON_PRE_MAGHRIB_APPEAR);
    if (p < appearStart) {
        return 0;
    }
    if (p < tl.maghrib) {
        return invLerp(appearStart, tl.maghrib, p);
    }
    return 1; // moon fully visible at/after Maghrib (checklist #7)
};

export const lightRaysOpacityAt = (p: number, tl: Timeline): number => {
    if (p < tl.fajr) {
        return 0;
    }
    if (p < tl.sunrise) {
        return invLerp(tl.fajr, tl.sunrise, p) * 0.4;
    }
    // gentle tail after sunrise
    const tail = lerp(0, tl.sunrise - tl.fajr, 0.15);
    if (p < tl.sunrise + tail) {
        return (1 - invLerp(tl.sunrise, tl.sunrise + tail, p)) * 0.4;
    }
    return 0;
};
