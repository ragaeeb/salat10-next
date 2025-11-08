import type { Timeline } from '@/types/timeline';
import { FALLBACK_COLORS, FRAC, SERIES_COLORS } from './constants';
import { invLerp, lerp } from './utils';

/**
 * Calculate base sky color at a given timeline position
 * Single source of truth for background color throughout the day
 * Fajr and sunset gradients overlay on top of this base
 *
 * Color progression:
 * - Pre-sunrise: Dark night (consistent through Fajr for gradient overlay)
 * - Morning: Light blue transitioning to daytime
 * - Afternoon: Bright sky blue
 * - Maghrib to Isha: Darkening blue
 * - Night: Very dark blue/black
 *
 * @param p - Timeline position [0..1] where 0=Fajr, 1=next Fajr
 * @param tl - Timeline object with normalized prayer time positions
 * @returns RGBA color string
 */
export const skyColorAt = (p: number, tl: Timeline): string => {
    if (p < tl.sunrise) {
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
    return 'rgba(5, 7, 16, 0.98)';
};

/**
 * Calculate star field opacity at given timeline position
 * Stars only visible after Isha, fading in until midnight
 *
 * @param p - Timeline position [0..1]
 * @param tl - Timeline object
 * @returns Opacity value [0..1]
 */
export const starsOpacityAt = (p: number, tl: Timeline): number => {
    if (p < tl.isha) {
        return 0;
    }
    if (p < tl.midNight) {
        return invLerp(tl.isha, tl.midNight, p);
    }
    return 1;
};

/**
 * Calculate Fajr gradient overlay opacity
 * Provides dawn glow on top of dark base sky
 * Visible immediately at Fajr, peaks at sunrise, then fades
 *
 * @param p - Timeline position [0..1]
 * @param tl - Timeline object
 * @returns Opacity value [0..1]
 */
export const fajrGradientOpacityAt = (p: number, tl: Timeline): number => {
    if (p < tl.fajr) {
        return 0;
    }
    if (p < tl.sunrise) {
        const t = invLerp(tl.fajr, tl.sunrise, p);
        return 0.7 + 0.3 * t;
    }
    const tail = lerp(0, tl.sunrise - tl.fajr, FRAC.FAJR_GLOW_TAIL_OF_SUNRISE);
    if (p < tl.sunrise + tail) {
        return 1 - invLerp(tl.sunrise, tl.sunrise + tail, p);
    }
    return 0;
};

/**
 * Calculate sunset gradient overlay opacity
 * Provides orange/red glow during sunset transition
 * Starts halfway between Asr and Maghrib, holds through Maghrib, fades before Isha
 *
 * @param p - Timeline position [0..1]
 * @param tl - Timeline object
 * @returns Opacity value [0..1]
 */
export const sunsetGradientOpacityAt = (p: number, tl: Timeline): number => {
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

/**
 * Calculate sun color channel value (R, G, or B) at timeline position
 * Sun transitions from day yellow to dusk orange during sunset
 *
 * @param p - Timeline position [0..1]
 * @param tl - Timeline object
 * @param ch - Color channel ('r', 'g', or 'b')
 * @returns Color channel value [0..255]
 */
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

/**
 * Calculate sun opacity at timeline position
 * Sun visible from sunrise, fades shortly before Maghrib
 *
 * @param p - Timeline position [0..1]
 * @param tl - Timeline object
 * @returns Opacity value [0..1]
 */
export const sunOpacityAt = (p: number, tl: Timeline): number => {
    if (p < tl.sunrise) {
        return 0;
    }
    const orangeStart = (tl.asr + tl.maghrib) / 2;
    const fadeStart = lerp(orangeStart, tl.maghrib, 1 - FRAC.SUN_FADE_PRE_MAGHRIB);
    if (p < fadeStart) {
        return 1;
    }
    if (p < tl.maghrib) {
        return 1 - invLerp(fadeStart, tl.maghrib, p);
    }
    return 0;
};

/**
 * Calculate moon opacity at timeline position
 * Moon appears shortly before Maghrib, fully visible at/after Maghrib
 *
 * @param p - Timeline position [0..1]
 * @param tl - Timeline object
 * @returns Opacity value [0..1]
 */
export const moonOpacityAt = (p: number, tl: Timeline): number => {
    const orangeStart = (tl.asr + tl.maghrib) / 2;
    const appearStart = lerp(orangeStart, tl.maghrib, 1 - FRAC.MOON_PRE_MAGHRIB_APPEAR);
    if (p < appearStart) {
        return 0;
    }
    if (p < tl.maghrib) {
        return invLerp(appearStart, tl.maghrib, p);
    }
    return 1;
};

/**
 * Calculate light rays opacity (subtle sunrise effect)
 * Visible during Fajr to sunrise transition with short tail after
 *
 * @param p - Timeline position [0..1]
 * @param tl - Timeline object
 * @returns Opacity value [0..1], capped at 0.4 for subtlety
 */
export const lightRaysOpacityAt = (p: number, tl: Timeline): number => {
    if (p < tl.fajr) {
        return 0;
    }
    if (p < tl.sunrise) {
        return invLerp(tl.fajr, tl.sunrise, p) * 0.4;
    }
    const tail = lerp(0, tl.sunrise - tl.fajr, 0.15);
    if (p < tl.sunrise + tail) {
        return (1 - invLerp(tl.sunrise, tl.sunrise + tail, p)) * 0.4;
    }
    return 0;
};

/**
 * Get color for a specific prayer event in charts/visualizations
 * Uses predefined color map with fallback to index-based colors
 *
 * @param event - Prayer event name
 * @param index - Fallback index for color selection
 * @returns Hex color string
 */
export const getColorFor = (event: string, index: number) => {
    const fallbackColor = FALLBACK_COLORS[index % FALLBACK_COLORS.length] ?? FALLBACK_COLORS[0] ?? '#60a5fa';
    return SERIES_COLORS[event] ?? fallbackColor;
};
